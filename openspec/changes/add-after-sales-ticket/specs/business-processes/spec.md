## MODIFIED Requirements

### Requirement: 訂單異動執行流程

訂單成立後，業務 / 諮詢 SHALL 可建立 OrderAdjustment 處理應收金額異動。OrderAdjustment MUST 走獨立狀態機，**不影響主訂單狀態**。已執行時系統 SHALL 自動重算訂單應收總額，但 PaymentPlan SHALL NOT 自動變動。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止 v1.2 「雙重身份」設計（`adjustment_phase` + UI「售後服務單」）。OrderAdjustment 不再依 Order.status 推算 phase，所有 adjustment_type（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）皆可於任何 Order 狀態下選用。

**售後事件改走 AfterSalesTicket**：Order.status = 已完成後的客訴 / 不良 / 規格不符等售後事件改建 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。AfterSalesTicket 內部依 resolution（不處理 / 退款 / 補印 / 退款+補印）決定是否建關聯 OrderAdjustment：

- **不處理**：不建 OrderAdjustment（ticket 直接結案）
- **退款**：ticket 內建 OrderAdjustment(adjustment_type=退印, amount=-退款額, linked_after_sales_ticket_id=此 ticket)
- **補印免費**：不建 OrderAdjustment，僅建補印 PrintItem 走原審稿 / 工單流程
- **補印收費**：ticket 內建 OrderAdjustment(adjustment_type=補退, amount=+補印費, linked_after_sales_ticket_id=此 ticket) + 建補印 PrintItem

**建立與審核流程**（OrderAdjustment 不論是否關聯 ticket 皆走相同流程）：

1. 業務於訂單詳情頁點擊「建立訂單異動單」（或於 AfterSalesTicket 內部建關聯異動），填入 adjustment_type、reason；新增多筆明細項（item_type = print_item / fee，描述、金額）
2. 系統自動加總 OrderAdjustment.amount = ∑明細金額
3. OrderAdjustment.status = 草稿；業務點擊「提交審核」後 → 待主管審核
4. 業務主管核可（→ 已核可）或退回（→ 已退回，業務修改後重交）
5. 業務於已核可後點擊「執行」→ 已執行（終態）
6. 系統重算訂單應收總額；PaymentPlan 不自動變動

**執行後提示**：

- 含 item_type = print_item 的明細：顯示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- 執行時點晚於 Order.completed_at（執行時點跨越訂單完成日）：對帳檢視面板顯示警示 banner「歷史對帳需重新核對」（觸發條件詳見 [order-management spec § 對帳警示 banner 觸發條件](../order-management/spec.md)）
- AfterSalesTicket 關聯 OrderAdjustment 執行後：ticket 內「關聯 OrderAdjustment 卡片」更新狀態為「已執行」

**後續關聯動作**（業務手動）：

- 加印追加（amount > 0，訂單期間）：業務於訂單詳情頁編輯 PrintItem（新增一筆），走原審稿 / 工單流程；後續視情境開立發票（增開的 Invoice）
- 規格變更（amount 可正可負，訂單期間）：業務於訂單詳情頁編輯 PrintItem。判定原則：打樣 NG 稿件問題或追加印製數量則新建 PrintItem，其他規格變更修改原 PrintItem
- 退印 / 折扣（amount < 0）：若已開過發票，業務開立 SalesAllowance（折讓）+ 退款 Payment；若發票尚可作廢則作廢重開
- 售後補印（ticket 觸發）：業務於 AfterSalesTicket 內建補印 PrintItem，走原審稿 / 工單流程；補印收費時 ticket 內另建關聯 OrderAdjustment
- 業務手動調整 PaymentPlan（如新增一期 / 修改未付期金額）

#### Scenario: 加印追加完整流程

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務建立 OrderAdjustment（adjustment_type = 加印追加，明細：item_type = print_item，描述 = 加印 200 份，金額 = +20,000）
- **THEN** OrderAdjustment.status SHALL → 草稿 → 待主管審核 → 已核可 → 已執行
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件」
- **AND** 業務後續手動：(a) 至訂單詳情頁新增 PrintItem「加印 200 份」走審稿 / 工單流程；(b) 新增 PaymentPlan #3（20,000）；(c) 收到加印款後記錄 Payment；(d) 開立 Invoice #2（20,000）

#### Scenario: 退印完整流程（訂單期間、已開發票）

- **GIVEN** Invoice #1 = 100,000 已開立、訂單未完成
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務建立 OrderAdjustment（adjustment_type = 退印，明細：item_type = fee，描述 = 品質投訴退款，金額 = -10,000）並執行
- **THEN** OrderAdjustment.status SHALL → 已執行，訂單應收總額 = 90,000
- **AND** 業務後續手動：(a) 開立 SalesAllowance #1（-10,000，關聯 Invoice #1）；(b) 建退款 Payment（-10,000）並關聯 SalesAllowance

#### Scenario: 售後退款完整流程（透過 AfterSalesTicket）

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15、Invoice #1 = 100,000 已開立並跨期申報
- **WHEN** 客戶於 2026-05-06 反映 5,000 元瑕疵，業務於訂單詳情頁建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 退款）
- **THEN** AfterSalesTicket.status SHALL → 受理中 → 處理中
- **AND** 業務於 ticket 內建 OrderAdjustment(adjustment_type = 退印, amount = -5,000, linked_after_sales_ticket_id = 此 ticket)
- **AND** OrderAdjustment 走原狀態機 → 已執行
- **AND** 因 OrderAdjustment.executed_at > Order.completed_at，對帳檢視面板 SHALL 顯示警示 banner
- **AND** 業務於 ticket 內 / 訂單發票區建退款 Payment（-5,000）+ 開 SalesAllowance（-5,000，關聯 Invoice #1）+ 手動連結 refund_payment_id
- **AND** 業務確認客戶滿意後點「結案」推進 ticket.status → 已結案

#### Scenario: 售後不處理流程（透過 AfterSalesTicket）

- **GIVEN** 訂單 SO-003 狀態 = 已完成
- **WHEN** 客戶反映輕微瑕疵但不嚴重，業務於 ticket 上跟主管討論後決議「公司認賠不處理」
- **THEN** 業務建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 不處理）
- **AND** ticket.status SHALL → 處理中
- **AND** 系統 MUST NOT 建立 OrderAdjustment、PrintItem、Payment 任何下游動作
- **AND** 業務點「結案」推進 ticket.status → 已結案
- **AND** 訂單應收 / 發票 / 收款均不變動，三方對帳不受影響

#### Scenario: 訂單異動不阻擋主流程

- **GIVEN** 訂單狀態 = 生產中，OrderAdjustment.status = 待主管審核
- **WHEN** 工單交付完成觸發 bubble-up
- **THEN** 訂單狀態 SHALL 推進至「出貨中」
- **AND** OrderAdjustment 維持「待主管審核」獨立狀態

### Requirement: 訂單異動 vs 工單異動職責分工

業務遇到變更需求時，SHALL 依「是否涉及訂單金額變動（向客戶補收 / 退費）」與「是否屬於訂單已完成後的售後事件」決定走哪條流程：

- **訂單期間有金額變動**（向客戶補收 / 退費） → 訂單異動單（OrderAdjustment）
  - 例：加印追加（補收）、規格升級補收、訂單期間客戶投訴退款、加運費、急件費
  - 走 OrderAdjustment 獨立狀態機，業務主管審核後執行
  - 涉及印件變動時業務手動於訂單詳情頁編輯 PrintItem

- **訂單已完成後的售後事件** → 售後服務單（AfterSalesTicket）
  - 例：客訴瑕疵、客戶要求退款、補印（公司認賠或客戶承擔）、規格不符投訴、物流問題
  - 建 AfterSalesTicket → 業務與主管 Slack 討論決議（resolution）→ 視決議建關聯 OrderAdjustment / PrintItem → 業務手動結案
  - AfterSalesTicket 本身無核可關卡；ticket 內關聯的 OrderAdjustment 仍走主管核可

- **無金額變動**（含成本上升公司吸收，訂單期間） → 工單異動流程（既有工單機制）
  - 例：紙廠停產換紙（公司吸收）、訂單期間瑕疵補印、規格寫錯、工序順序調整、產線重派、不影響成品的微調
  - 走 [work-order spec](../work-order/spec.md) 的工單異動流程
  - 工單異動本身會反映於訂單成本欄位 / 利潤分析

「公司吸收成本」場景在訂單期間 SHALL 純走工單異動，不建立 `OrderAdjustment(amount=0)` 重複紀錄。原因：amount=0 不屬於「金額變動」，建立反而違反「金額變動為界」的判定邊界。成本變化資訊由工單流程承擔。

「公司吸收成本」場景在訂單已完成後 SHALL 走 AfterSalesTicket（resolution = 補印，responsibility = 公司認賠），不建 OrderAdjustment。ticket 仍提供「事件追蹤」「品質成本切片分析」價值，與「不建 amount=0 OrderAdjustment」原則不衝突。

#### Scenario: 加印追加判定為訂單異動

- **GIVEN** 客戶要求加印 200 份（向客戶補收 20,000）
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走訂單異動單（OrderAdjustment）
- **AND** 業務不應走工單異動流程

#### Scenario: 訂單已完成後客訴退款走 AfterSalesTicket

- **GIVEN** 訂單已完成、客戶投訴瑕疵要求退款 5,000
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走 AfterSalesTicket（resolution = 退款）
- **AND** ticket 內建 OrderAdjustment(adjustment_type=退印, amount=-5000, linked_after_sales_ticket_id=此 ticket)

#### Scenario: 訂單已完成後客訴公司認賠補印走 AfterSalesTicket

- **GIVEN** 訂單已完成、客戶反映瑕疵、公司認賠補印 100 份不收費
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走 AfterSalesTicket（resolution = 補印、responsibility = 公司認賠）
- **AND** ticket 內建補印 PrintItem
- **AND** 系統 SHALL NOT 建立 OrderAdjustment（免費補印）

#### Scenario: 紙廠停產換紙公司吸收純走工單異動

- **GIVEN** 訂單生產期間紙廠停產，客戶接受替代紙、成本接近公司吸收（不向客戶補收）
- **WHEN** 業務 / 印務處理變更
- **THEN** 系統 SHALL 走「工單異動」（修改工單紙材）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment(amount=0) 或 AfterSalesTicket（訂單尚未完成）
- **AND** 訂單成本變化由工單流程承擔

#### Scenario: 工序順序調整不需訂單異動

- **GIVEN** 工序順序需要調整但不影響成品與成本
- **WHEN** 印務發起變更
- **THEN** 系統 SHALL 走「工單異動」
- **AND** 系統 NOT 要求建立 OrderAdjustment 或 AfterSalesTicket

#### Scenario: 訂單期間工單瑕疵補印公司吸收純走工單異動

- **GIVEN** 訂單生產期間工單發現飛墨瑕疵需補印，公司吸收補印成本
- **WHEN** 印務處理補印
- **THEN** 系統 SHALL 走「工單異動」（建立補印工單）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment 或 AfterSalesTicket（訂單尚未完成）

## REMOVED Requirements

### Requirement: 售後服務單發票處理建議式流程

**Reason**: 售後服務單從 OrderAdjustment(phase=after_completion) 改為獨立 AfterSalesTicket 實體。原 phase=after_completion 執行後的發票處理建議邏輯（跨期走 SalesAllowance + 退款 Payment；未跨期走作廢重開）改為 AfterSalesTicket 內建關聯 OrderAdjustment 後的處理。OrderAdjustment 走原既有發票處理流程（見 § 發票異動流程），不另立「售後服務單發票處理」特殊規則。

**Migration**:
- 業務於 AfterSalesTicket 內建退款 OrderAdjustment 後，依既有 § 發票異動流程 「情境 C：已開發票後客戶要求金額調整」處理發票（先退款 Payment、再開折讓 或 作廢重開）
- 發票處理建議式提示由 [after-sales-ticket spec](../after-sales-ticket/spec.md) 與 [order-management spec](../order-management/spec.md) 的 ticket UI 流程承接

## ADDED Requirements

### Requirement: 售後服務階段流程（AfterSalesTicket）

訂單已完成後（Order.status = 已完成）的客訴 / 不良 / 規格不符等售後事件 SHALL 走 AfterSalesTicket 流程。AfterSalesTicket 是訂單異動五大階段（需求 → 訂單 → 生產 → 出貨 → 售後）的最後階段，作為訂單已完成後事件的可追蹤容器。

**流程概觀**：

1. **受理**：業務於訂單詳情頁建立 AfterSalesTicket，填入 customer_complaint、case_category（印件瑕疵 / 規格不符 / 物流問題 / 工法限制 / 交期延誤 / 其他）、responsibility（公司認賠 / 客戶承擔 / 共同分擔）。ticket.status = 受理中
2. **討論**（系統外）：業務於 Slack @ 業務主管討論處理方式，討論完成後業務將 Slack thread URL 貼入 ticket.slack_thread_url
3. **決議**：業務於 ticket 填入 resolution（不處理 / 退款 / 補印 / 退款+補印）並點「送出決議」，ticket.status → 處理中
4. **執行下游動作**（依 resolution）：
   - 不處理：不建任何下游動作
   - 退款：業務於 ticket 內建關聯 OrderAdjustment(退印, -金額) → 走 OA 狀態機 → 業務於發票區建退款 Payment + 視需要開 SalesAllowance
   - 補印免費：業務於 ticket 內建補印 PrintItem → 走原審稿 / 工單流程
   - 補印收費：業務於 ticket 內建關聯 OrderAdjustment(補退, +金額) + 建補印 PrintItem
   - 退款+補印：同時走退款與補印路徑
5. **結案**（純手動）：業務確認客戶滿意 / 所有下游動作完成後，點 ticket 上的「結案」按鈕。ticket.status → 已結案

**特殊規則**：

- AfterSalesTicket 本身**無核可關卡**（業務與主管 Slack 線下討論，ERP 僅記錄結果）
- 一個 Order 最多 1 張未結案 ticket；結案後可建新 ticket
- Order.status 永遠保持「已完成」不回退（售後處理中為 UI 徽章，非主狀態）
- 補印場景中，補印 PrintItem 出貨完成 SHALL NOT 自動結案 ticket（需業務確認客戶滿意）
- ticket 內 OrderAdjustment 仍走業務主管審核（OrderAdjustment 既有狀態機不變）

完整規格詳見 [after-sales-ticket spec](../after-sales-ticket/spec.md)。

#### Scenario: 售後事件完整流程（退款場景）

- **GIVEN** Order.status = 已完成、客戶於 2026-05-06 反映瑕疵要求退款 5,000
- **WHEN** 業務於訂單詳情頁建立 AfterSalesTicket（case_category=印件瑕疵、responsibility=公司認賠、customer_complaint=「客戶反映 5,000 元印刷瑕疵」）
- **THEN** ticket.status SHALL = 受理中
- **AND** 業務於 Slack 與業務主管討論後將 thread URL 貼入 slack_thread_url
- **AND** 業務於 ticket 填 resolution = 退款 並點「送出決議」，ticket.status → 處理中
- **AND** 業務於 ticket 內建 OrderAdjustment(退印, -5000, linked_after_sales_ticket_id=此 ticket) → 走 OA 狀態機 → 已執行
- **AND** 業務於訂單發票區建退款 Payment(-5000) + 開 SalesAllowance(-5000, 關聯 Invoice #1) + 手動連結 refund_payment_id
- **AND** 業務確認客戶滿意後點 ticket 上「結案」，ticket.status → 已結案

#### Scenario: 售後事件完整流程（補印免費場景）

- **GIVEN** Order.status = 已完成、客戶反映規格不符要求補印 100 份、公司認賠
- **WHEN** 業務建立 AfterSalesTicket（case_category=規格不符、responsibility=公司認賠、resolution=補印）
- **THEN** ticket.status → 處理中
- **AND** 業務於 ticket 內點「建立補印印件」建 PrintItem(related_after_sales_ticket_id=此 ticket)
- **AND** PrintItem 走原審稿 → 工單 → 出貨流程
- **AND** 系統 MUST NOT 建立 OrderAdjustment（免費補印）
- **AND** 補印 PrintItem 出貨完成 SHALL NOT 自動結案 ticket
- **AND** 業務確認客戶滿意後點「結案」推進 ticket.status → 已結案

#### Scenario: 售後事件完整流程（不處理場景）

- **GIVEN** Order.status = 已完成、客戶反映輕微瑕疵但接受不處理
- **WHEN** 業務建立 AfterSalesTicket（case_category=印件瑕疵、responsibility=公司認賠、resolution=不處理）
- **THEN** ticket.status → 處理中
- **AND** 系統 MUST NOT 建立 OrderAdjustment、PrintItem、Payment
- **AND** 業務點「結案」推進 ticket.status → 已結案
- **AND** 訂單應收 / 發票 / 收款均不變動，三方對帳不受影響
