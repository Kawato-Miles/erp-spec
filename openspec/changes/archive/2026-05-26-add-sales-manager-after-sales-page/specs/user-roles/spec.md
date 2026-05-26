## MODIFIED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 負責**訂單建立後、報價單外發前的成交條件審核**：與業務確認收款條件、報價金額、交期合理後，將線下訂單從「待業務主管審核」推進至「報價待回簽」。業務主管 MUST NOT 介入需求單流程任何狀態轉換（需求確認、成本評估、議價、成交 / 流失皆由業務獨立執行）。

業務主管的核准決策範圍 MUST 限於「訂單指定的業務主管 = 自己」的訂單；MUST NOT 跨業務主管核准他人指定範圍的訂單。業務主管 SHALL 擁有需求單模組的只讀權限（提供部門總覽能力）；MUST NOT 編輯需求單內容、推進需求單狀態、或執行成交 / 流失動作。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理「訂單審核」「訂單異動審核」「售後服務檢視」三類待辦（對齊印務主管模式）。

業務主管的利害關係程度 SHALL 為「高」，因「待業務主管審核 → 報價待回簽」為訂單流程關鍵推進節點，未通過則報價單無法外發給客人簽回。

**訂單異動審核範疇**：業務主管 SHALL 負責 OrderAdjustment（訂單異動單）的金額核可（草稿 → 待主管審核 → 已核可 / 已退回）。此職責不分 OrderAdjustment 是否關聯 AfterSalesTicket（含 linked_after_sales_ticket_id 為 NULL 的訂單期間異動，與非 NULL 的售後 ticket 內加掛異動，皆走相同核可流程）。

**售後服務 ticket 的角色定位**：業務主管 SHALL **不參與 AfterSalesTicket 系統流程**（無 ticket 核可關卡）。業務主管與業務於 Slack 線下討論售後事件處理方式，討論結果由業務於 ticket 上記錄（resolution、slack_thread_url）。業務主管在售後流程的決策影響力透過：
1. ticket 內若加掛 OrderAdjustment（退款 / 補印收費），業務主管於 OrderAdjustment 層級審核金額
2. Slack 上的討論（外於 ERP 系統）

**[本 change ADDED] 業務主管中台「售後服務」檢視頁職責**：

業務主管 SHALL 可於中台「售後服務」頁（路由 `/sales-manager/after-sales`）以**唯讀視角**檢視**全公司**所有 AfterSalesTicket（跨業務主管管轄範圍），作為他在 Slack 與業務跟催售後事件處理進度的決策入口。本頁面範圍為「**檢視範圍 = 全公司 ticket 唯讀**」，與業務主管的「**核可決策範圍 = 訂單指定的業務主管 = 自己**」職責邊界並存：

- **檢視範圍（全公司）**：所有業務 / 諮詢開立的 ticket，無論訂單的 `approved_by_sales_manager_id` 是否為當前主管。理由：售後事件處理品質為公司整體服務水準指標，主管以全局視角識別異常情境（逾期久未跟催 / 跨業務責任不清 / 公司認賠金額異常）後透過 Slack 跨部門協調。
- **核可決策範圍（部門內）**：當售後 ticket 內加掛 OrderAdjustment（退款 / 補印收費）時，主管於 OrderAdjustment 層的核可動作仍 MUST 限「OrderAdjustment 所屬訂單的 `approved_by_sales_manager_id` = 自己」。本 change 不改 OrderAdjustment 核可權限規則。

業務主管 MUST NOT 在「售後服務」頁執行任何 ticket 編輯動作（修改 resolution / 結案 / 建立關聯 OA / 補述）。所有 ticket 編輯動作仍由業務 / 諮詢於訂單詳情頁的售後 Tab 執行。本頁面為純檢視 + 跳轉入口。

業務主管 SHALL 可於後台「訂單列表」依「售後狀態」篩選器查看部門內未結案售後訂單（既有功能保留），與本 change 新增的「售後服務」全公司檢視頁互補：
- 「訂單列表 + 售後狀態 filter」：order-centric，限「部門內」（`approved_by_sales_manager_id = self`），找特定訂單時使用
- 「售後服務」檢視頁：ticket-centric，全公司範圍，掃描整體售後狀況時使用

頁面具體行為（路由 / 篩選器 / 表格欄位 / 摘要卡 / Scenarios）定義於 [after-sales-ticket spec § Requirement: 業務主管全公司售後管理頁](../after-sales-ticket/spec.md)。

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

#### Scenario: 業務主管查看全公司未結案售後 ticket

- **GIVEN** 業務主管 A 登入中台、全公司有未結案 AfterSalesTicket 12 張（含 5 張為 A 管轄部門、7 張為其他主管管轄部門）
- **WHEN** A 從中台 sidebar「訂單管理_業務主管」group 點擊「售後服務」
- **THEN** 系統 SHALL 導航至 `/sales-manager/after-sales`
- **AND** 頁面 SHALL 顯示全公司 12 張未結案 ticket（**不過濾**負責業務主管管轄範圍）
- **AND** A SHALL 可透過「業務 / 諮詢負責人」filter 自行收斂至特定業務 / 諮詢的 ticket

#### Scenario: 業務主管查看非管轄業務的售後 ticket 紀律邊界

- **GIVEN** 業務主管 A 進入全公司售後管理頁、列表中含 ticket AS-20260520-03 屬於業務主管 B 管轄部門（`Order.approved_by_sales_manager_id = B`）
- **WHEN** A 點擊該 ticket 跳轉至訂單詳情頁售後 Tab
- **THEN** 系統 SHALL 允許跳轉（唯讀視角）
- **AND** A MUST NOT 對該 ticket 執行任何系統內編輯動作（建立 / 修改 resolution / 結案 / 建關聯 OA / 補述）
- **AND** 訂單詳情頁售後 Tab MUST NOT 對 A 顯示編輯按鈕（即使 A 是業務主管角色，但訂單 `approved_by_sales_manager_id ≠ A`）
- **AND** A 若需介入處理 SHALL 透過 Slack 與業務主管 B 或 ticket `opened_by` 業務 / 諮詢線下協調
- **AND** 此 Scenario 明確區分「**檢視範圍 = 全公司唯讀**」與「**核可決策範圍 = 部門內**」並存的紀律邊界
