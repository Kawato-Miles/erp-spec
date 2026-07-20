# Delta: business-scenarios

## MODIFIED Requirements

### Requirement: 已完成訂單售後服務情境（AfterSalesTicket 路徑）

系統 SHALL 通過此端到端情境驗證「主訂單已完成後仍可處理售後服務」的設計（依 D13 修訂）。本 change（add-after-sales-ticket）廢止原 v1.2 「直接建 OrderAdjustment(phase=after_completion)」路徑，改為「建 AfterSalesTicket → ticket 內建關聯 OrderAdjustment」雙層路徑。

Prototype MUST 跑通下列步驟，且訂單主狀態 SHALL 維持「已完成」不回退，對帳檢視面板 SHALL 顯示「歷史對帳需重新核對」警示 banner。

**情境設定**：
- 訂單 #O-25030101 = 50,000，已於 2026-03-15 完成（狀態 = 已完成）
- 已開 Invoice #1 = 50,000，客戶已付款 50,000
- 三方對帳當時通過

**端到端步驟**：
1. 2026-05-06 客戶投訴部分品質瑕疵，要求退款 5,000
2. 業務於訂單詳情頁「售後服務」Tab 建立 AfterSalesTicket
   - case_no = AS-20260506-XX
   - customer_complaint = 「客戶反映部分印件 5,000 元品質瑕疵」
   - case_category = 印件瑕疵
   - ticket.status = 受理中
3. 業務於 Slack @ 業務主管討論，討論完成後將 Slack thread URL 貼入 slack_thread_url
4. 業務於 ticket 填 resolution = 退款 並點「送出決議」，ticket.status → 處理中
5. 業務於 ticket 內點「建立退款異動單」建 OrderAdjustment #1（adjustment_type = 退印、amount = -5,000、reason = 客戶事後品質投訴、linked_after_sales_ticket_id = 此 ticket）
6. OrderAdjustment.status → 草稿 → 待主管審核 → 已核可 → 已執行
7. 訂單應收總額更新為 45,000（50,000 - 5,000）
8. 業務先建立退款 Payment（amount = -5,000、payment_method = 退款）
9. 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -5,000、reason = 品質瑕疵）
10. 訂單詳情頁對帳檢視面板顯示警示 banner「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行」
11. 業務確認客戶滿意（收到退款）後點 ticket 上「結案」按鈕
12. ticket.status → 已結案，closed_at = 當下、closed_by = 業務

**對帳驗證**：
- 應收總額 = 50,000 - 5,000 = 45,000
- 發票淨額 = 50,000（Invoice #1）- 5,000（SalesAllowance）= 45,000
- 收款淨額 = 50,000（原收款）- 5,000（退款 Payment）= 45,000
- 差額 = 0，對帳通過（雖然主訂單已完成）

**Priority**: P0

**Rationale**: 驗證訂單完成後售後退款全鏈（售後單 → 異動單 → 退款款項 → 折讓）在對帳上封閉平衡。

#### Scenario: 已完成訂單建 AfterSalesTicket 主狀態不回退

- **GIVEN** 訂單主狀態 = 已完成
- **WHEN** 業務建立 AfterSalesTicket 並執行所有下游動作（退款 OrderAdjustment、退款 Payment、SalesAllowance）
- **THEN** 訂單主狀態 SHALL 維持「已完成」（不觸發回退）
- **AND** OrderAdjustment.status SHALL → 已執行
- **AND** AfterSalesTicket.status 依業務操作推進，與 Order.status 解耦

#### Scenario: 售後異動觸發歷史對帳警示

- **GIVEN** 已完成訂單上有 AfterSalesTicket 關聯的已執行 OrderAdjustment（linked_after_sales_ticket_id 非空）
- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** 面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行」
- **AND** 面板 SHALL 仍正常計算三方金額
- **AND** banner 觸發條件不分 OrderAdjustment.linked_after_sales_ticket_id 是否為空（兩種情境的對帳意義相同）

#### Scenario: 售後折讓 / 退款依 D12 分離

- **WHEN** AfterSalesTicket 內退款流程觸發
- **THEN** 業務 SHALL 先建立退款 Payment、後開立 SalesAllowance（兩者不建立關聯，反查以訂單活動紀錄為準）
- **AND** 系統 SHALL NOT 自動建立 Payment

#### Scenario: ticket 結案後可查閱歷史

- **GIVEN** AfterSalesTicket.status = 已結案、closed_at = 2026-05-08
- **WHEN** 業務 / 會計查閱訂單詳情頁「售後服務」Tab
- **THEN** ticket 卡片 SHALL 顯示「已結案 / 結案於 2026-05-08」
- **AND** 點擊 ticket 可進入詳情頁查看 case_category、resolution、關聯 OrderAdjustment、補印 PrintItem 完整歷程

### Requirement: 售後事件「不處理」結局情境

系統 SHALL 通過此端到端情境驗證「客戶接受不處理」的售後結局，確認 AfterSalesTicket 路徑下「不處理」是合法結局（不污染對帳邏輯）。

**情境設定**：
- 訂單 #O-25040215 = 30,000，已於 2026-04-30 完成
- 客戶於 2026-05-10 反映輕微印件瑕疵但表示接受不處理

**端到端步驟**：
1. 業務建立 AfterSalesTicket
   - customer_complaint = 「客戶反映輕微印件瑕疵」
   - case_category = 印件瑕疵
2. 業務於 Slack @ 業務主管討論後將 thread URL 貼入
3. 業務填 resolution = 不處理 並點「送出決議」，ticket.status → 處理中
4. 系統 MUST NOT 建立任何 OrderAdjustment、PrintItem、Payment、SalesAllowance
5. 業務點「結案」推進 ticket.status → 已結案

**對帳驗證**：
- 應收總額 / 發票淨額 / 收款淨額 = 不變動
- 對帳檢視面板 SHALL NOT 顯示警示 banner（無 OrderAdjustment 執行）
- 三方對帳維持原狀通過

**Priority**: P1

**Rationale**: 「不處理」是合法售後結局，驗證其不觸發任何帳務動作、不污染對帳。

#### Scenario: 不處理結局不污染對帳

- **GIVEN** AfterSalesTicket.resolution = 不處理、status = 處理中
- **WHEN** 業務結案 ticket
- **THEN** 系統 SHALL NOT 觸發任何 OrderAdjustment / Payment / SalesAllowance 建立
- **AND** 訂單三方對帳 SHALL 維持原狀

### Requirement: 售後事件「補印免費」場景

系統 SHALL 通過此端到端情境驗證「免費補印（公司吸收費用）」結局，確認補印 PrintItem 與 ticket 的 FK 關聯運作，且不建 OrderAdjustment。

**情境設定**：
- 訂單 #O-25040301 印製 1,000 份名片，已於 2026-04-15 完成
- 客戶於 2026-05-05 反映 100 份規格不符（紙色與打樣不一致）、公司吸收費用補印

**端到端步驟**：
1. 業務建立 AfterSalesTicket
   - customer_complaint = 「客戶反映 100 份紙色與打樣不一致，要求補印」
   - case_category = 規格不符
2. 業務於 Slack 討論後填 resolution = 補印 並點「送出決議」，ticket.status → 處理中
3. 業務於 ticket 內點「建立補印印件」建 PrintItem
   - print_item.related_after_sales_ticket_id = 此 ticket
   - 數量 = 100、規格同原 PrintItem
4. PrintItem 走原審稿 / 工單 / 生產任務 / QC / 出貨流程
5. 系統 MUST NOT 建立 OrderAdjustment（免費補印，業務未建補收異動單）
6. 補印 PrintItem 出貨完成後 ticket.status 維持「處理中」（不自動結案）
7. 業務向客戶確認收到補印品滿意後點「結案」推進 ticket.status → 已結案

**對帳驗證**：
- 訂單應收 / 發票淨額 / 收款淨額 = 不變動（無金額異動）
- 對帳檢視面板 SHALL NOT 顯示警示 banner
- 訂單成本欄位 SHALL 反映補印 PrintItem 的生產成本（內部成本）

**Priority**: P1

**Rationale**: 驗證免費補印（收費事實＝未建補收異動單）不觸發帳務變動，補印生產沿用既有流程。

#### Scenario: 補印免費 ticket 與 PrintItem FK 關聯

- **GIVEN** AfterSalesTicket.resolution = 補印、公司吸收費用（未建補收異動單）
- **WHEN** 業務於 ticket 內建補印 PrintItem
- **THEN** PrintItem.related_after_sales_ticket_id SHALL 寫入此 ticket id
- **AND** 補印 PrintItem 於訂單詳情頁印件區塊顯示「補印（來自 AS-XXX）」標示
- **AND** 系統 MUST NOT 建立 OrderAdjustment

#### Scenario: 補印 PrintItem 完成不自動結案 ticket

- **GIVEN** 補印 PrintItem 已通過 QC 並出貨完成
- **WHEN** 系統推進 PrintItem 至完成
- **THEN** ticket.status MUST 維持「處理中」
- **AND** 業務 SHALL 確認客戶收件滿意後手動結案

### Requirement: 售後事件「補印收費」場景

系統 SHALL 通過此端到端情境驗證「付費補印（向客戶收費）」結局，確認 ticket 加掛 OrderAdjustment + 補印 PrintItem 雙實體並行運作。

**情境設定**：
- 訂單 #O-25040502 印製 500 份手冊，已於 2026-04-25 完成
- 客戶於 2026-05-08 表示「自己提供的檔案有誤，要求補印 100 份並願意支付補印費 8,000」（金額為業務與客戶協商結果）

**端到端步驟**：
1. 業務建立 AfterSalesTicket
   - customer_complaint = 「客戶補檔錯誤要求補印 100 份，願支付補印費」
   - case_category = 規格不符
2. 業務於 Slack 討論後填 resolution = 補印 並點「送出決議」，ticket.status → 處理中
3. 業務依與客戶議定的補印費，於 ticket 內手動點「建立補印費異動單」建 OrderAdjustment
   - adjustment_type = 補退
   - amount = +8,000（協商價，非系統展算）
   - linked_after_sales_ticket_id = 此 ticket
4. OrderAdjustment 走原狀態機 → 業務主管核可 → 業務執行
5. 業務於 ticket 內建補印 PrintItem(數量=100, related_after_sales_ticket_id=此 ticket)
6. PrintItem 走原審稿 / 工單 / 出貨流程
7. 業務新增 PaymentPlan 一期（8,000）追補印費
8. 客戶付款後業務記錄 Payment(+8,000) + 開立 Invoice #2(+8,000)
9. 業務確認客戶收件滿意 + 收到補印費後點「結案」

**對帳驗證**：
- 應收總額 = 訂單原應收 + 8,000（OrderAdjustment 已執行）
- 發票淨額 = 訂單原發票 + 8,000
- 收款淨額 = 訂單原收款 + 8,000
- 對帳檢視面板因 OrderAdjustment.executed_at > Order.completed_at 顯示警示 banner

**Priority**: P1

**Rationale**: 驗證付費補印（收費事實＝業務手動建補收異動單、金額為協商價）的雙實體並行與帳務封閉；實務上此路徑少見。

#### Scenario: 補印收費 ticket 加掛 OrderAdjustment

- **GIVEN** AfterSalesTicket.resolution = 補印、業務與客戶議定補印費 8,000
- **WHEN** 業務於 ticket 內點「建立補印費異動單」
- **THEN** 系統 SHALL 預填 OrderAdjustment(adjustment_type=補退, linked_after_sales_ticket_id=此 ticket)
- **AND** 業務填入 amount = +8,000、明細
- **AND** OrderAdjustment 走原狀態機（業務主管核可關卡仍在）
