## MODIFIED Requirements

### Requirement: 訂單異動執行流程

訂單成立後，業務 / 諮詢 SHALL 可建立 OrderAdjustment 處理應收金額異動。OrderAdjustment MUST 走獨立狀態機，**不影響主訂單狀態**。已執行時系統 SHALL 自動重算訂單應收總額，但 PaymentPlan SHALL NOT 自動變動。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止 v1.2 「雙重身份」設計（`adjustment_phase` + UI「售後服務單」）。OrderAdjustment 不再依 Order.status 推算 phase，所有 adjustment_type（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）皆可於任何 Order 狀態下選用。

**售後事件改走 AfterSalesTicket**：Order.status = 已完成後的客訴 / 不良 / 規格不符等售後事件改建 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。AfterSalesTicket 內部依 resolution（不處理 / 退款 / 補印 / 退款+補印）決定是否建關聯 OrderAdjustment：

- **不處理**：不建 OrderAdjustment（ticket 直接結案）
- **退款**：ticket 內建 OrderAdjustment(adjustment_type=退印, amount=-退款額, linked_after_sales_ticket_id=此 ticket)
- **補印免費**：不建 OrderAdjustment，僅建補印 PrintItem 走原審稿 / 工單流程
- **補印收費**：ticket 內建 OrderAdjustment(adjustment_type=補退, amount=+補印費, linked_after_sales_ticket_id=此 ticket) + 建補印 PrintItem

**建立與審核流程（本 change MODIFY 既有「業務點執行」描述為「Payment 切已完成累計達 OA.amount 自動推進」）**：

1. 業務於訂單詳情頁點擊「建立訂單異動單」（或於 AfterSalesTicket 內部建關聯異動），填入 adjustment_type、reason；新增多筆明細項（item_type = print_item / fee，描述、金額）
2. 系統自動加總 OrderAdjustment.amount = ∑明細金額
3. OrderAdjustment.status = 草稿；業務點擊「提交審核」後 → 待主管審核
4. 業務主管核可（→ 已核可）或退回（→ 已退回，業務修改後重交）
5. **業務於 OA 編輯介面建立關聯 Payment（處理中態）**：點 OA row 開編輯 dialog，下半「新增 Payment」入口，依 OA 正負自動預填 paymentMethod
   - OA 為退款型（amount < 0）：預填 paymentMethod = '退款'、amount ≤ 0
   - OA 為補收型（amount > 0）：預填 paymentMethod 為非「退款」項（如「銀行轉帳」）、amount ≥ 0
6. **業務後續補齊資料切「已完成」**：點 Payment row 編輯 dialog，補 paidAt、上傳對帳附件 ≥ 1 個、切 paymentStatus → '已完成'、點「儲存」
7. **系統自動推進 OA 至已執行**：對應 OA 的所有已完成 Payment 累計 amount = OA.amount（含符號比較）時，同 transaction 推進 OA.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點
8. 系統重算訂單應收總額；PaymentPlan 不自動變動

**對稱化（本 change BREAKING 棄用「自動建補收 Payment」既有設計）**：補收 OA 與退款 OA 共用上述 5-7 步驟（業務手動建處理中 Payment + 切已完成）。原既有「執行加印 OA 系統自動建補收 Payment」邏輯廢止。

**執行後提示**：

- 含 item_type = print_item 的明細：顯示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- 執行時點晚於 Order.completed_at（執行時點跨越訂單完成日）：對帳檢視面板顯示警示 banner「歷史對帳需重新核對」（觸發條件詳見 [order-management spec § 對帳警示 banner 觸發條件](../order-management/spec.md)）
- AfterSalesTicket 關聯 OrderAdjustment 執行後：ticket 內「關聯 OrderAdjustment 卡片」更新狀態為「已執行」

**後續關聯動作**（業務手動）：

- 加印追加（amount > 0，訂單期間）：業務於訂單詳情頁編輯 PrintItem（新增一筆），走原審稿 / 工單流程；後續視情境開立發票（增開的 Invoice）
- 規格變更（amount 可正可負，訂單期間）：業務於訂單詳情頁編輯 PrintItem。判定原則：打樣 NG 稿件問題或追加印製數量則新建 PrintItem，其他規格變更修改原 PrintItem
- 退印 / 折扣（amount < 0）：若已開過發票，業務開立 SalesAllowance（折讓）+ 關聯退款 Payment；若發票尚可作廢則作廢重開
- 售後補印（ticket 觸發）：業務於 AfterSalesTicket 內建補印 PrintItem，走原審稿 / 工單流程；補印收費時 ticket 內另建關聯 OrderAdjustment
- 業務手動調整 PaymentPlan（如新增一期 / 修改未付期金額）

**處理中 Payment 期間禁止觸發 SalesAllowance（resolve ORD-004）**：

業務在 OA 編輯介面建立處理中退款 Payment 時，若關聯訂單已開過發票，系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示。SalesAllowance 相關提示僅在退款 Payment 切「已完成」後觸發，避免「對帳資料未齊備就開折讓單」的會計不確定性。

#### Scenario: 加印追加完整流程（MODIFY 對稱化，棄用自動建補收 Payment）

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務建立 OrderAdjustment（adjustment_type = 加印追加，明細：item_type = print_item，描述 = 加印 200 份，金額 = +20,000）→ 提交審核 → 主管核可
- **THEN** OrderAdjustment.status SHALL → 已核可（NOT 自動建補收 Payment，棄用既有設計）
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件 + 至 OA 編輯介面建立補收 Payment」
- **AND** 業務後續手動：
  - (a) 至訂單詳情頁新增 PrintItem「加印 200 份」走審稿 / 工單流程
  - (b) **於 OA 編輯介面內點「新增 Payment」建補收 Payment P-002（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中'）**
  - (c) 客戶實際匯款後業務補 P-002 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
  - (d) 系統自動推進 OA → '已執行'、訂單應收總額增加 +20000
  - (e) 業務開立 Invoice #2（20,000）

#### Scenario: 退印完整流程（訂單期間、已開發票，MODIFY 兩階段）

- **GIVEN** Invoice #1 = 100,000 已開立、訂單未完成
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務建立 OrderAdjustment（adjustment_type = 退印，明細：item_type = fee，描述 = 品質投訴退款，金額 = -10,000）→ 提交審核 → 主管核可
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 業務於 OA 編輯介面建退款 Payment P-010（amount = -10,000, paymentMethod = '退款', paymentStatus = '處理中'）
- **AND** 系統 SHALL NOT 自動建立 SalesAllowance（處理中期間禁止觸發，resolve ORD-004）
- **WHEN** 業務實際匯款給客戶後，補 P-010 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
- **THEN** 系統自動推進 OA → '已執行'、訂單應收總額 = 90,000
- **AND** 業務後續手動：開立 SalesAllowance #1（-10,000，關聯 Invoice #1）+ 手動連結 SalesAllowance.refund_payment_id = P-010.id

#### Scenario: 售後退款完整流程（透過 AfterSalesTicket，MODIFY 兩階段）

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15、Invoice #1 = 100,000 已開立並跨期申報
- **WHEN** 客戶於 2026-05-21 反映 5,000 元瑕疵，業務於訂單詳情頁建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 退款）
- **THEN** AfterSalesTicket.status SHALL → 受理中 → 處理中
- **AND** 業務於 ticket 內建 OrderAdjustment OA-020(adjustment_type = 退印, amount = -5,000, linked_after_sales_ticket_id = 此 ticket) → 提交審核 → 主管核可
- **AND** 業務於 OA-020 編輯介面建退款 Payment P-020（amount = -5,000, paymentMethod = '退款', paymentStatus = '處理中'）
- **AND** OA-020 維持「已核可」狀態（處理中 Payment 不推進 OA）
- **WHEN** 業務實際匯款給客戶後，補 P-020 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
- **THEN** 系統自動推進 OA-020.status → '已執行'、executedAt = P-020 切已完成的時點
- **AND** 因 OA-020.executed_at > Order.completed_at，對帳檢視面板 SHALL 顯示警示 banner
- **AND** 業務後續手動：開 SalesAllowance（-5,000，關聯 Invoice #1）+ 手動連結 SalesAllowance.refund_payment_id = P-020.id
- **AND** 業務確認客戶滿意後點「結案」推進 ticket.status → 已結案

#### Scenario: 售後不處理流程（透過 AfterSalesTicket）（不變，沿用既有）

- **GIVEN** 訂單 SO-003 狀態 = 已完成
- **WHEN** 客戶反映輕微瑕疵但不嚴重，業務於 ticket 上跟主管討論後決議「公司認賠不處理」
- **THEN** 業務建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 不處理）
- **AND** ticket.status SHALL → 處理中
- **AND** 系統 MUST NOT 建立 OrderAdjustment、PrintItem、Payment 任何下游動作
- **AND** 業務點「結案」推進 ticket.status → 已結案
- **AND** 訂單應收 / 發票 / 收款均不變動，三方對帳不受影響

#### Scenario: 訂單異動不阻擋主流程（不變，沿用既有）

- **GIVEN** 訂單狀態 = 生產中，OrderAdjustment.status = 待主管審核
- **WHEN** 工單交付完成觸發 bubble-up
- **THEN** 訂單狀態 SHALL 推進至「出貨中」
- **AND** OrderAdjustment 維持「待主管審核」獨立狀態

## ADDED Requirements

### Requirement: 業務先填一半再補齊資料流程（一般收款）

業務 SHALL 可於訂單詳情頁建立一般收款 Payment 時先填部分資料（amount + paymentMethod），暫存為 paymentStatus = '處理中'；後續陸續補齊 paidAt + 對帳附件後切「已完成」，避免「等資料齊才敢建檔」造成的延誤與對帳真實性問題。

**處理中 Payment 對對帳與期次狀態的影響**：

- 處理中 Payment SHALL NOT 計入收款淨額（對帳公式只算已完成 Payment，見 [order-management spec § 三方對帳檢視面板](../order-management/spec.md)）
- 處理中 Payment SHALL NOT 影響 PaymentPlan.status 推導（見 [order-management spec § 付款計畫建立](../order-management/spec.md)）
- 處理中 Payment SHALL NOT 觸發 SalesAllowance 自動建立或弱提示

#### Scenario: 業務在「客戶說已匯但對帳未到」情境先建處理中 Payment

- **GIVEN** 客戶 2026-05-21 告知「已匯款 30000」，業務需要先在系統留存紀錄但對帳單還未到
- **WHEN** 業務於訂單詳情頁 OrderPaymentSection 點「新增收款」，dialog 內填 amount = +30000、paymentMethod = '銀行轉帳'、paymentPlanId（選對應期次）；paidAt 與 attachments 暫不填、點「儲存」
- **THEN** 系統 SHALL 通過驗證（處理中態必填項已齊）並建立 Payment P-030（paymentStatus = '處理中'）
- **AND** P-030 出現在收款列表標「處理中」狀態 badge
- **AND** 對帳收款淨額不變（處理中不計入）
- **AND** 對應 PaymentPlan.status 不變（處理中不累計）

#### Scenario: 業務後續補齊資料切已完成

- **GIVEN** 處理中 Payment P-030（amount = +30000, paidAt = null, attachments = []）
- **WHEN** 2026-05-25 業務收到銀行對帳單，於收款列表點 P-030「編輯」、補 paidAt = 2026-05-23、上傳對帳單.pdf、切 paymentStatus → '已完成'、點「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-030.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000
- **AND** 對應 PaymentPlan 累計 = +30000，若達 scheduledAmount 則 status 變「已收訖」

### Requirement: 處理中 Payment 期間 SalesAllowance 行為（resolve ORD-004 補 constraint）

業務於 OA 編輯介面建立處理中退款 Payment 時，若關聯訂單已開過發票，系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示。

SalesAllowance 相關提示僅在退款 Payment 切「已完成」後觸發，符合會計實務「未實際發生的款項不開折讓」的對帳邏輯。

#### Scenario: 處理中退款 Payment 不觸發 SalesAllowance 自動建立

- **GIVEN** 訂單 SO-040 已開立 Invoice #1 = 100,000、業務於 OA-040 編輯介面建退款 Payment P-040（amount = -5000, paymentStatus = '處理中'）
- **WHEN** P-040 建立完成
- **THEN** 系統 SHALL NOT 自動建立 SalesAllowance
- **AND** 系統 SHALL NOT 顯示弱提示「請至發票區建 SalesAllowance」
- **AND** 對帳面板 SHALL 顯示「處理中退款 5000（不計入）」

#### Scenario: 退款 Payment 切已完成後系統提示業務開 SalesAllowance

- **GIVEN** P-040 切 paymentStatus = '已完成'
- **WHEN** 系統處理切換事件
- **THEN** 系統 SHALL 顯示弱提示「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance 以維持發票淨額與收款淨額對齊」（弱提示，不阻擋業務）
- **AND** 業務 SHALL 可選擇至發票區建 SalesAllowance 或忽略提示
- **註**：SalesAllowance 完整流程不在本 change 範圍（ORD-004 完整自動建立 vs 手動建決策仍 open）

### Requirement: Migration 期 OA invariant 過渡規則

本 change 上線後執行既有 Payment backfill 為「已完成」（見 [order-management spec § 既有資料 Migration](../order-management/spec.md)）。Migration 期間 SHALL 滿足下列規則：

- Migration 前：既有「OA 已執行 → 必有關聯退款 Payment」invariant 隱含 Payment「已建立 = 已完成」語意
- Migration 中：所有 Payment backfill `paymentStatus = '已完成'`、`completedAt = createdAt`
- Migration 後：新 invariant「OA 已執行 → 必有關聯已完成 Payment 累計達 OA.amount」自動滿足（既有資料已 backfill）

Migration 不涉及 OA 狀態變動（既有已執行 OA 維持已執行）。

#### Scenario: Migration 後既有已執行 OA 仍滿足新 invariant

- **GIVEN** Migration 前資料庫有 OA-100（status = 已執行, amount = -5000）+ 對應退款 Payment P-100（amount = -5000, paymentStatus = null）
- **WHEN** 系統執行 Migration
- **THEN** P-100.paymentStatus SHALL 被 backfill 為 '已完成'、completedAt = P-100.createdAt
- **AND** OA-100 對應已完成 Payment 累計 = -5000 = OA-100.amount，滿足新 invariant
- **AND** OA-100.status 維持「已執行」（不變動）
