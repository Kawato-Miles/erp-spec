## MODIFIED Requirements

### Requirement: 訂單異動執行流程

訂單成立後，業務 / 諮詢 SHALL 可建立 OrderAdjustment 處理應收金額異動。OrderAdjustment MUST 走獨立狀態機，**不影響主訂單狀態**。已執行時系統 SHALL 自動重算訂單應收總額，但 PaymentPlan SHALL NOT 自動變動。

**雙重身份**：OrderAdjustment 涵蓋「訂單異動」與「售後服務」兩種業務情境，由 `adjustment_phase` 區分（建單時依 Order.status 自動推算後鎖定）：

- `during_order`（訂單尚未完成）→ UI 顯示「訂單異動單」，可選 `adjustment_type` = 規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他
- `after_completion`（訂單已完成）→ UI 顯示「售後服務單」，可選 `adjustment_type` = 退印 / 折扣 / 補退 / 其他（不可加印 / 加運費 / 急件費）

**建立與審核流程**：

1. 業務於訂單詳情頁點擊「建立訂單異動單」（或於已完成訂單為「建立售後服務單」），填入 adjustment_type、reason；新增多筆明細項（item_type = print_item / fee，描述、金額）
2. 系統自動加總 OrderAdjustment.amount = ∑明細金額
3. OrderAdjustment.status = 草稿；業務點擊「提交審核」後 → 待主管審核
4. 業務主管核可（→ 已核可）或退回（→ 已退回，業務修改後重交）
5. 業務於已核可後點擊「執行」→ 已執行（終態）
6. 系統重算訂單應收總額；PaymentPlan 不自動變動

**執行後提示**：

- 含 item_type = print_item 的明細：顯示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- `after_completion` phase：顯示發票處理提示「請至訂單詳情頁的發票區處理（作廢 / 折讓）」
- 執行時點晚於 Order.completed_at（執行時點跨越訂單完成日）：對帳檢視面板顯示警示 banner「歷史對帳需重新核對」（觸發條件詳見 [order-management spec](../order-management/spec.md) § 對帳警示 banner 觸發條件）

**後續關聯動作**（業務手動）：

- 加印追加（amount > 0，僅 during_order）：業務於訂單詳情頁編輯 PrintItem（新增一筆），走原審稿 / 工單流程；後續視情境開立發票（增開的 Invoice）
- 規格變更（amount 可正可負，僅 during_order）：業務於訂單詳情頁編輯 PrintItem。判定原則：打樣 NG 稿件問題或追加印製數量則新建 PrintItem，其他規格變更修改原 PrintItem
- 退印 / 折扣（amount < 0）：若已開過發票，業務開立 SalesAllowance（折讓）+ 退款 Payment；若發票尚可作廢則作廢重開
- 業務手動調整 PaymentPlan（如新增一期 / 修改未付期金額）

#### Scenario: 加印追加完整流程

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務建立 OrderAdjustment（phase 自動 = during_order，adjustment_type = 加印追加，明細：item_type = print_item，描述 = 加印 200 份，金額 = +20,000）
- **THEN** OrderAdjustment.status SHALL → 草稿 → 待主管審核 → 已核可 → 已執行
- **AND** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件」
- **AND** 業務後續手動：(a) 至訂單詳情頁新增 PrintItem「加印 200 份」走審稿 / 工單流程；(b) 新增 PaymentPlan #3（20,000）；(c) 收到加印款後記錄 Payment；(d) 開立 Invoice #2（20,000）

#### Scenario: 退印完整流程（已開發票）

- **GIVEN** Invoice #1 = 100,000 已開立、訂單未完成
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務建立 OrderAdjustment（phase 自動 = during_order，adjustment_type = 退印，明細：item_type = fee，描述 = 品質投訴退款，金額 = -10,000）並執行
- **THEN** OrderAdjustment.status SHALL → 已執行，訂單應收總額 = 90,000
- **AND** 業務後續手動：(a) 開立 SalesAllowance #1（-10,000，關聯 Invoice #1）；(b) 建退款 Payment（-10,000）並關聯 SalesAllowance

#### Scenario: 售後服務單完整流程

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15、Invoice #1 = 100,000 已開立並跨期申報
- **WHEN** 客戶於 2026-05-06 反映 5,000 元瑕疵，業務建立 OrderAdjustment（phase 自動 = after_completion，adjustment_type = 退印，明細：item_type = fee，金額 = -5,000）並執行
- **THEN** OrderAdjustment.status SHALL → 已執行，訂單應收總額更新
- **AND** 因 executed_at > completed_at，對帳檢視面板 SHALL 顯示警示 banner
- **AND** 系統 SHALL 顯示提示「請至訂單詳情頁的發票區處理（作廢 / 折讓）」
- **AND** 業務後續手動：因發票已跨期不可作廢，開立 SalesAllowance（-5,000）+ 退款 Payment

#### Scenario: 訂單異動不阻擋主流程

- **GIVEN** 訂單狀態 = 生產中，OrderAdjustment.status = 待主管審核
- **WHEN** 工單交付完成觸發 bubble-up
- **THEN** 訂單狀態 SHALL 推進至「出貨中」
- **AND** OrderAdjustment 維持「待主管審核」獨立狀態

## ADDED Requirements

### Requirement: 訂單異動 vs 工單異動職責分工

業務遇到變更需求時，SHALL 依「是否涉及訂單金額變動（向客戶補收 / 退費）」決定走哪條流程：

- **有金額變動**（向客戶補收 / 退費） → 訂單異動單 / 售後服務單（OrderAdjustment）
  - 例：加印追加（補收）、規格升級補收、客戶投訴退款、加運費、急件費
  - 走 OrderAdjustment 獨立狀態機，業務主管審核後執行
  - 涉及印件變動時業務手動於訂單詳情頁編輯 PrintItem

- **無金額變動**（含成本上升公司吸收） → 工單異動流程（既有工單機制）
  - 例：紙廠停產換紙（公司吸收）、瑕疵補印、規格寫錯、工序順序調整、產線重派、不影響成品的微調
  - 走 [work-order spec](../work-order/spec.md) 的工單異動流程
  - 工單異動本身會反映於訂單成本欄位 / 利潤分析

「公司吸收成本」場景（內部成本上升但不向客戶補收） SHALL **純走工單異動**，不建立 `OrderAdjustment(amount=0)` 重複紀錄。原因：amount=0 不屬於「金額變動」，建立反而違反「金額變動為界」的判定邊界。成本變化資訊由工單流程承擔（影響訂單成本欄位 / 利潤分析）。

#### Scenario: 加印追加判定為訂單異動

- **GIVEN** 客戶要求加印 200 份（向客戶補收 20,000）
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走訂單異動單（OrderAdjustment）
- **AND** 業務不應走工單異動流程

#### Scenario: 紙廠停產換紙公司吸收純走工單異動

- **GIVEN** 紙廠停產，客戶接受替代紙、成本接近公司吸收（不向客戶補收）
- **WHEN** 業務 / 印務處理變更
- **THEN** 系統 SHALL 走「工單異動」（修改工單紙材）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment(amount=0)
- **AND** 訂單成本變化由工單流程承擔（影響訂單成本欄位 / 利潤分析）

#### Scenario: 工序順序調整不需訂單異動

- **GIVEN** 工序順序需要調整但不影響成品與成本
- **WHEN** 印務發起變更
- **THEN** 系統 SHALL 走「工單異動」
- **AND** 系統 NOT 要求建立 OrderAdjustment

#### Scenario: 工單瑕疵補印公司吸收純走工單異動

- **GIVEN** 工單發現飛墨瑕疵需補印，公司吸收補印成本（不向客戶補收）
- **WHEN** 印務處理補印
- **THEN** 系統 SHALL 走「工單異動」（建立補印工單）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment

### Requirement: 售後服務單發票處理建議式流程

售後服務單（adjustment_phase = after_completion）執行後的發票處理 SHALL 採建議式提示（非強制、非自動跳轉），業務依以下原則自行判斷：

- **發票尚未跨申報期**：可選擇「作廢原發票 → 重開正確金額發票」
- **發票已跨申報期 / 已申報**：必須「開立 SalesAllowance（折讓）+ 退款 Payment」（不可作廢）
- **無發票或部分金額無對應發票**：僅建退款 Payment（無 SalesAllowance）

提示文字範例：「此筆異動涉及金額變動，請至訂單詳情頁的發票區處理（作廢 / 折讓）」。提示為非問句、非自動跳轉，業務自行決定處理時點。

#### Scenario: 售後服務單執行後業務於跨期發票走折讓路徑

- **GIVEN** 售後服務單 amount = -5,000 已執行；對應 Invoice #1 = 100,000 已跨申報期
- **WHEN** 業務看到發票處理提示
- **THEN** 業務 SHALL 至訂單詳情頁開立 SalesAllowance（-5,000，關聯 Invoice #1）
- **AND** 業務 SHALL 建立退款 Payment（-5,000）並關聯該 SalesAllowance

#### Scenario: 售後服務單執行後業務於未跨期發票走作廢重開

- **GIVEN** 售後服務單 amount = -5,000 已執行；對應 Invoice #1 = 100,000 尚未申報
- **WHEN** 業務看到發票處理提示
- **THEN** 業務 SHALL 作廢 Invoice #1 並重開 Invoice #2（金額 = 95,000）
- **AND** 業務 SHALL 建立退款 Payment（-5,000）
