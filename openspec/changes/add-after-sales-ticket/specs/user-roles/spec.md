## MODIFIED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 負責**訂單建立後、報價單外發前的成交條件審核**：與業務確認收款條件、報價金額、交期合理後，將線下訂單從「待業務主管審核」推進至「報價待回簽」。業務主管 MUST NOT 介入需求單流程任何狀態轉換（需求確認、成本評估、議價、成交 / 流失皆由業務獨立執行）。

業務主管的核准決策範圍 MUST 限於「訂單指定的業務主管 = 自己」的訂單；MUST NOT 跨業務主管核准他人指定範圍的訂單。業務主管 SHALL 擁有需求單模組的只讀權限（提供部門總覽能力）；MUST NOT 編輯需求單內容、推進需求單狀態、或執行成交 / 流失動作。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理「訂單審核」待辦（對齊印務主管模式）。

業務主管的利害關係程度 SHALL 為「高」，因「待業務主管審核 → 報價待回簽」為訂單流程關鍵推進節點，未通過則報價單無法外發給客人簽回。

**訂單異動審核範疇**：業務主管 SHALL 負責 OrderAdjustment（訂單異動單）的金額核可（草稿 → 待主管審核 → 已核可 / 已退回）。此職責不分 OrderAdjustment 是否關聯 AfterSalesTicket（含 linked_after_sales_ticket_id 為 NULL 的訂單期間異動，與非 NULL 的售後 ticket 內加掛異動，皆走相同核可流程）。

**售後服務 ticket 的角色定位**：業務主管 SHALL **不參與 AfterSalesTicket 系統流程**（無 ticket 核可關卡）。業務主管與業務於 Slack 線下討論售後事件處理方式，討論結果由業務於 ticket 上記錄（resolution、slack_thread_url）。業務主管在售後流程的決策影響力透過：
1. ticket 內若加掛 OrderAdjustment（退款 / 補印收費），業務主管於 OrderAdjustment 層級審核金額
2. Slack 上的討論（外於 ERP 系統）

業務主管 SHALL 可於後台「訂單列表」依「售後狀態」篩選器查看部門內未結案售後訂單，但 MUST NOT 直接操作 AfterSalesTicket（建立、修改 resolution、結案皆由業務執行）。

#### Scenario: 業務主管核可訂單異動單

- **GIVEN** OrderAdjustment.status = 待主管審核、approved_by_sales_manager_id = 業務主管 A
- **WHEN** 業務主管 A 於後台「待審核訂單異動」頁點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管不直接操作 AfterSalesTicket

- **WHEN** 業務主管嘗試於 AfterSalesTicket 詳情頁操作「結案」「修改 resolution」「建立關聯 OrderAdjustment」
- **THEN** 系統 MUST 拒絕（按鈕設為 disabled）
- **AND** 提示「售後服務單由業務操作；如需介入請於 Slack 與業務討論」

#### Scenario: 業務主管查看部門內售後處理中訂單

- **WHEN** 業務主管於訂單列表選擇篩選器「售後處理中 / 售後逾期」+ approved_by_sales_manager_id = self
- **THEN** 列表 SHALL 列出該主管管轄業務負責的有未結案售後 ticket 訂單

### Requirement: 業務角色職責（補增售後服務 ticket 操作）

業務 SHALL 負責需求單建立、報價、訂單建立、訂單異動單建立與執行、付款計畫管理、發票開立、收款記錄、訂單售後服務 ticket 全程操作。

業務於售後服務 ticket 上的職責：

1. **建立 ticket**：於訂單詳情頁「售後服務」Tab 建立 AfterSalesTicket，填入 customer_complaint、case_category、responsibility
2. **Slack 討論**：於 Slack 上 @ 業務主管討論處理方式，討論完成後將 Slack thread URL 貼入 ticket.slack_thread_url
3. **填入 resolution**：依 Slack 討論結果於 ticket 上填入 resolution（不處理 / 退款 / 補印 / 退款+補印）並送出決議
4. **建立關聯動作**：
   - 退款場景：於 ticket 內建關聯 OrderAdjustment(退印, -金額) → 提交業務主管審核 → 執行 → 於發票區建退款 Payment + 開 SalesAllowance
   - 補印免費場景：於 ticket 內建補印 PrintItem，走原審稿 / 工單流程
   - 補印收費場景：於 ticket 內建關聯 OrderAdjustment(補退, +補印費) + 建補印 PrintItem
5. **結案**：確認客戶滿意 / 所有下游動作完成後，點 ticket 上「結案」按鈕推進 ticket.status → 已結案
6. **append complaint log**：客戶後續補述時於 ticket 上 append additional_complaint_log（任何狀態皆可，但既有紀錄不可改）

業務於業務看板「我的未結案售後」分桶 SHALL 看到自己 opened_by = self 且 status ≠ 已結案 的 ticket，避免遺漏結案。

#### Scenario: 業務建立 AfterSalesTicket 完整流程

- **GIVEN** 業務 Alice 負責的訂單 ORD-001 狀態 = 已完成
- **WHEN** 客戶投訴後 Alice 於訂單詳情頁建立 AfterSalesTicket
- **THEN** 系統 SHALL 寫入 opened_by = Alice、case_no、opened_at
- **AND** Alice SHALL 必填 customer_complaint、case_category、responsibility
- **AND** ticket.status SHALL = 受理中

#### Scenario: 業務於 ticket 內建關聯 OrderAdjustment

- **GIVEN** AfterSalesTicket.resolution = 退款、status = 處理中
- **WHEN** 業務 Alice 於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 開啟 OrderAdjustment 表單，預填 linked_after_sales_ticket_id = 此 ticket、adjustment_type = 退印
- **AND** Alice 填入 amount 與明細後送審，OrderAdjustment 走原狀態機

#### Scenario: 業務結案 ticket

- **GIVEN** AfterSalesTicket.status = 處理中、關聯 OrderAdjustment 已執行、退款 Payment 已建立
- **WHEN** 業務 Alice 確認客戶滿意後點「結案」
- **THEN** ticket.status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at = 當下、closed_by = Alice

### Requirement: 會計角色職責（補增售後 ticket 紀錄查閱）

會計角色 MUST 僅能存取報價單 / 訂單模組（讀取）+ 對帳檢視（讀取與匯出），可查看範圍 SHALL 限於基本資料、付款紀錄、發票紀錄、折讓紀錄、訂單異動紀錄、AfterSalesTicket 紀錄。會計 MUST NOT 直接執行發票開立、作廢、折讓、ticket 建立 / 結案等操作（這些動作由業務 / 諮詢執行）。

會計的核心職責為**對帳**：透過訂單詳情頁的對帳檢視面板與後台批次對帳檢視，確認三方金額（應收 / 發票淨額 / 收款淨額）一致。會計查閱 AfterSalesTicket 紀錄的目的為：
1. 確認跨期 OrderAdjustment（linked_after_sales_ticket_id 非空）對應的 ticket 已正確記錄客訴源頭與 responsibility
2. 對帳警示 banner 觸發時可回溯至對應 ticket 查看 case 詳情
3. 月度公司認賠金額統計（依 responsibility = 公司認賠 篩選關聯 OrderAdjustment 已執行金額）

#### Scenario: 會計查閱訂單售後紀錄

- **GIVEN** 訂單已完成且有關聯 AfterSalesTicket
- **WHEN** 會計開啟訂單詳情頁的「售後服務」Tab
- **THEN** 系統 SHALL 顯示 ticket 列表（唯讀）
- **AND** 會計 SHALL 可點擊 ticket 查看 customer_complaint、case_category、responsibility、關聯 OrderAdjustment
- **AND** 會計 MUST NOT 看到「建立售後服務單」「結案」「修改 resolution」等操作按鈕

#### Scenario: 會計依公司認賠 responsibility 統計月度認賠額

- **WHEN** 會計於後台對帳檢視頁需要統計 2026 年 5 月公司認賠總額
- **THEN** 系統 SHALL 提供查詢介面：filter AfterSalesTicket.responsibility = 公司認賠 AND 關聯 OrderAdjustment.executed_at 落於 2026-05
- **AND** 結果 SHALL 顯示 sum of |OrderAdjustment.amount|（絕對值）
