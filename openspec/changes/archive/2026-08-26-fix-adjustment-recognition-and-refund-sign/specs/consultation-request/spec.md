## MODIFIED Requirements

### Requirement: 諮詢取消觸發建諮詢訂單與退費

當客人或諮詢人員於「待諮詢」狀態取消預約時，系統 SHALL 觸發「建諮詢訂單 + 半額退費 + 沿用一般訂單取消善後」流程，諮詢訂單終態為「**已取消**」。退費金額固定為諮詢費 50%（諮詢費 2000 → 退 1000），**不分客戶 / 諮詢人員主動、不分取消時機**，比例 hardcode in code 不開放系統設定（半額為系統內生預設值，業務於善後時 MAY 依實際調整退款金額，沿用一般退款 OA「已核可後修改不需重審」規則）。

**款項紀錄金額口徑**：退款款項紀錄的金額 MUST 記正值，退款方向由款項類型 = 退款表示（款項紀錄一律正值的鐵則見 wiki [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md) § 4.6）。訂單異動金額另循自身慣例（補收正值、退款負值），不受此條影響。

**自動建單流程（事務性，全成功或全回滾）**：

1. 系統 SHALL 建立諮詢訂單（type=諮詢、客戶資料來自 ConsultationRequest、總額 = 諮詢費 2000）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費 2000)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id；款項類型維持收款、金額維持 2000、status 維持 已完成）
4. **系統 SHALL 自動建立 OrderAdjustment**（金額 = -1000、adjustment_type = `諮詢取消退費`、status = **已核可**、approved_by = system、approved_amount = -1000、executed_at = NULL、requires_supervisor_approval = false、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）— **系統內生直接建為「已核可」**（「負向異動須審核」不破例，因金額固定由系統代行審核；executed_at 待諮詢人員執行「確認生效」時寫入並推進「確認可執行」、應收於此刻認列；已核可階段可調整金額不需重審、亦可取消（決定不退））
5. **系統 SHALL 自動建立退款款項紀錄**（款項類型 = 退款、金額 = 1000（正值）、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
6. **系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance、MUST NOT 自動建立待開發票（BillingInstallment / PlannedInvoice）**（廢除諮詢專屬自動建待開發票；諮詢訂單留存 1000 收入由業務循一般訂單取消發票開立路徑於需要時手動開立，未開票風險由對帳「應收 > 發票淨額」差額警示兜底）
7. **諮詢訂單 status 直接推進至「已取消」終態、paymentStatus = 已付款**（取代既有「訂單完成」；諮詢取消是「沒成交的生意」，語意應為已取消而非完成；不需製作中間態；退款款項紀錄為已取消後的善後金流動作維持「處理中」）
8. ConsultationRequest 狀態 MUST 推進至「已取消」終態、`cancel_reason_category` 寫入 dialog 選定值、`linked_consultation_order_id` 寫入新諮詢訂單 ID

**已取消訂單善後金流不鎖**：諮詢訂單「已取消」終態僅鎖訂單內容編輯（印件 / 規格 / 備註），善後金流動作（退款款項紀錄切已完成、發票開立、銷貨折讓）SHALL 照常，沿用一般訂單取消既有善後流程。諮詢取消 MUST NOT 走 AfterSalesTicket（售後容器強制 Order.status=已完成）。

**退款金流處理**：退款依原付款方式刷退，由第三方金流處理。ERP 只記錄取消事實與處理中退款款項紀錄，實際銀行撥款由第三方金流負責，撥款時程不承諾 SLA。

**諮詢人員後續手動**（諮詢訂單已是「已取消」、以下為善後動作）：
- 與客戶確認退款金額後，執行「確認生效」：系統 SHALL 推進 OrderAdjustment.status → 「確認可執行」（終態、不可逆）、executed_at = now、**應收於此刻認列減去**；確認生效前可於 OA 編輯介面調整金額（不需重審）或取消 OA（決定不退）
- 處理銀行退款金流（與第三方金流確認刷退完成）後，將退款款項紀錄切「已完成」並上傳退款證明——退款款項紀錄完成 MUST NOT 改變 OA 狀態（金流完結由對帳「應退差額」核銷歸零盯住）
- 需要開立諮詢費發票或折讓時，循一般訂單取消開立路徑手動處理（金額由諮詢人員依客戶需求決定，建議 1000 元），使發票淨額、收款淨額與應收淨額對平
- 主動通知客戶退款已處理（不入系統，由諮詢人員以電話 / Email 等管道執行）

**對帳公式**（諮詢人員執行「確認生效」後；確認生效前 OA 不認列、應收 = 2000）：
- 應收 = OEC(2000) + ∑確認可執行 OA(-1000) = 1000
- 收款淨額 = 收款款項紀錄(2000) − 退款款項紀錄(1000) = 1000
- 發票淨額 = 諮詢人員實際開立金額（人工負責，預設目標 1000 元）
- 對帳邏輯：應收 = 收款淨額 = 1000 對帳通過；發票差異由訂單詳情頁既有對帳警示 banner 提示（「應收 > 發票淨額」= 待開票提醒）

**離開「待諮詢」狀態以後**（已轉需求單 / 完成諮詢 / 已取消）MUST NOT 退費（諮詢結束分支已執行即不可退）。

**Priority**: P0

**Rationale**: 諮詢取消退一半是既定政策，必須自動建單留下應收與退款軌跡；款項紀錄記正值、方向由款項類型表示，才與後端款項模型及 ezPay 契約一致。

#### Scenario: 諮詢取消觸發建單與資料模型

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空（已認領）、Payment(P0: 款項類型 = 收款、金額 = 2000、linked=CR、status=已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員或業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（type = 諮詢、總額 = 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 的 linked_entity_type 與 linked_entity_id 改為諮詢訂單（金額與款項類型不變、status 維持已完成）
- **AND** 系統 SHALL 建立 OrderAdjustment(amount = -1000、adjustment_type = `諮詢取消退費`、status = **已核可**、approved_by = system、executed_at = NULL、requires_supervisor_approval = false、reason = 「諮詢取消退費（50%）」)
- **AND** 系統 SHALL 建立退款款項紀錄(款項類型 = 退款、金額 = 1000、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id)
- **AND** 系統 MUST NOT 建立任何 Invoice、SalesAllowance、待開發票（BillingInstallment / PlannedInvoice）
- **AND** 諮詢訂單 status SHALL 直接推進至「**已取消**」終態、paymentStatus = 已付款
- **AND** 退款款項紀錄維持「處理中」（已取消後的善後金流動作）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」、cancel_reason_category = dialog 選定值、linked_consultation_order_id = 新諮詢訂單 ID

#### Scenario: 諮詢人員確認生效推進 OA 確認可執行（認列點）

- **GIVEN** 諮詢取消後諮詢訂單已是「已取消」、OA-c1 status = 已核可（系統代審建立）、應收 = 2000（OA 未認列）
- **WHEN** 諮詢人員與客戶確認退款金額後執行「確認生效」
- **THEN** 系統 SHALL 推進 OA-c1.status → 「確認可執行」（終態、不可逆）、executed_at = now
- **AND** 應收 SHALL 於此刻認列為 2000 − 1000 = 1000、對帳出現應退差額 1000
- **AND** 諮詢訂單 status MUST 維持「已取消」

#### Scenario: 退款款項紀錄切已完成不改變 OA 狀態（金流完結由對帳盯住）

- **GIVEN** OA-c1 status = 確認可執行、退款款項紀錄(P1: 款項類型 = 退款、金額 = 1000、paymentStatus = 處理中) 存在
- **WHEN** 諮詢人員處理銀行退款後將退款款項紀錄 P1 切「已完成」並上傳退款證明附件
- **THEN** 系統 SHALL 將 P1.paymentStatus 改為「已完成」
- **AND** OA-c1.status MUST 維持「確認可執行」（退款金流完結不回寫單據）
- **AND** 對帳：應收 1000 = 收款淨額（2000 − 1000）= 1000、應退差額歸零

#### Scenario: 諮詢取消不自動開 Invoice / SalesAllowance / 待開發票

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **WHEN** 諮詢人員點擊「確認取消諮詢」
- **THEN** 系統 MUST NOT 在諮詢訂單上自動開立 Invoice（不論 `consultation_invoice_option` 為何值）
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 系統 MUST NOT 自動建立待開發票（BillingInstallment / PlannedInvoice）
- **AND** 諮詢訂單留存 1000 收入由業務循一般訂單取消發票開立路徑於需要時手動開立；未開票由對帳「應收 > 發票淨額」差額警示兜底提醒

#### Scenario: 已離開待諮詢狀態後不可取消退費

- **GIVEN** ConsultationRequest 狀態 ∈ {已轉需求單, 完成諮詢, 已取消}
- **WHEN** 諮詢人員 / 業務主管嘗試點擊「取消諮詢」
- **THEN** 系統 MUST 拒絕該動作
- **AND** UI SHALL 顯示「諮詢結束分支確認可執行，無法退費」提示

#### Scenario: 取消 dialog 內容防呆

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員或業務主管點擊「取消諮詢」按鈕
- **THEN** UI SHALL 彈出二次確認 dialog
- **AND** dialog SHALL 顯示警示文字：「確定取消？將自動建諮詢訂單（已取消）並退款 1000 元，無法復原」
- **AND** dialog SHALL 顯示 cancel_reason_category 必選下拉（6 個 enum 值）
- **AND** dialog MUST NOT 顯示 `consultation_invoice_option` 意向（既已不驅動發票自動化、避免使用者誤解）
- **AND** dialog MUST NOT 顯示客戶聯絡資訊或預約時間（資訊精簡）
- **AND** dialog 提供「取消」與「確認取消諮詢」兩個按鈕；「確認取消諮詢」按鈕在未選 cancel_reason_category 時 MUST 為 disabled

### Requirement: 諮詢取消半額退費自動建請款期次（取代既有自動建 PlannedInvoice）

系統 SHALL 沿用「諮詢取消觸發建諮詢訂單與退費」主結構（半額退費 1000、自動建 OA(-1000) 已核可、自動建退款款項紀錄（款項類型 = 退款、金額 = 1000）處理中、訂單推進**已取消**終態），但 **MUST NOT 自動建立待開發票（BillingInstallment）**——廢除諮詢專屬自動建請款期次（收斂到一般訂單取消流程：留存收入由業務手動開票、未開票由對帳差額警示兜底）。

**完整連動鏈（諮詢取消收斂版，取代 v1.10 + unify-billing 自動建請款期次）**：
1. 系統自動建立諮詢訂單（order_type = 諮詢、總額 = 諮詢費 2000）
2. 系統自動建立 OrderExtraCharge（charge_type = consultation_fee, amount = 2000）
3. 系統轉移 Payment 從 ConsultationRequest 至諮詢訂單（is_transferred = true）
4. 系統自動建立 OrderAdjustment(-1000, adjustment_type=諮詢取消退費, **status=已核可**, approved_by=system, executed_at=NULL, requires_supervisor_approval=false, linked_after_sales_ticket_id=null)
5. 系統自動建立退款款項紀錄(款項類型=退款, 金額=1000, paymentStatus=處理中, linkedOrderAdjustmentId=OA.id)
6. **系統 MUST NOT 自動建立 BillingInstallment**（廢除 unify-billing 既有「自動建 source_type=consultation_cancellation 待開票」；`source_type = consultation_cancellation` enum 語意保留，業務若手動為已取消諮詢訂單建期次仍可選此值標示來源）
7. 諮詢訂單推進至「**已取消**」終態（取代「訂單完成」；不經製作 / 退款中間態）

**Priority**: P0

**Rationale**: 諮詢取消的留存收入沿用一般訂單取消的手動開票路徑，不另設諮詢專屬自動建期次，避免同一件事兩套機制。

#### Scenario: 諮詢取消不自動建 BillingInstallment（廢除諮詢專屬待開發票）

- **GIVEN** 諮詢人員或業務主管於諮詢取消 dialog 確認、cancel_reason_category 已選
- **WHEN** 系統執行連動鏈
- **THEN** 系統 SHALL 依步驟 1-7 完整執行
- **AND** 步驟 6 系統 MUST NOT 自動建立 BillingInstallment 或 PlannedInvoice
- **AND** 諮詢訂單留存 1000 收入由諮詢人員循一般訂單取消發票開立路徑於需要時手動開立諮詢費 Invoice
- **AND** `source_type = consultation_cancellation` enum 保留供業務手動建期次時標示來源

### Requirement: 諮詢前置流程端到端規則

當客人於 surveycake 表單付款成功觸發 webhook 後，系統 SHALL 依以下端到端流程處理：

```
[客人] surveycake 填表 → 付款成功 (webhook)
        ↓
ConsultationRequest 自動建立 (status=待諮詢, cancel_reason_category=NULL)
+ Payment(linked_entity_type=ConsultationRequest, 款項類型=收款, 金額=2000, status=已完成)
（不建任何 Order）
        ↓
諮詢人員自我認領 consultant_id (status=待諮詢)
        ↓
諮詢人員與客戶討論
        ↓
諮詢人員「結束諮詢」分支：
  ├ 不做大貨 → 建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  │           Payment(收款 2000) 從 ConsultationRequest 轉移至諮詢訂單
  │           系統自動建 BillingInstallment
  │           諮詢訂單即時推進至「訂單完成」
  │           ConsultationRequest 狀態 = 完成諮詢
  │
  └ 做大貨 → 建需求單 (status=需求確認中)
            ConsultationRequest 狀態 = 已轉需求單
            Payment 維持綁 ConsultationRequest
            （MUST NOT 建任何 Order、MUST NOT 建任何 BillingInstallment）
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務「轉訂單」
                + Payment(收款 2000) 從 ConsultationRequest 轉移至一般訂單
                + 一般訂單建立 OrderExtraCharge(consultation_fee, +2000)

需求單流失（做大貨分支另一條路徑）：
  → 系統建諮詢訂單收尾（複用「不做大貨」路徑）

待諮詢取消（半額退費）：
  → 系統建諮詢訂單 + OrderExtraCharge + Payment 轉移
  → 系統自動建 OrderAdjustment(-1000, 已核可) + 退款款項紀錄(款項類型=退款, 金額=1000, 處理中)
  → 諮詢人員與客戶談定金額後執行「確認生效」→ OA 確認可執行、應收於此刻認列
  → 諮詢訂單 status = 已取消
  → ConsultationRequest 狀態 = 已取消
```

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾。諮詢費 Invoice 統一由諮詢人員 / 業務手動開立。終態分流：不做大貨 / 需求單流失 = 訂單完成、諮詢取消 = 已取消。

**`consultation_invoice_option` 欄位定位**：此欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示，**不再驅動系統行為**。

**Priority**: P0

**Rationale**: 諮詢前置流程端到端規則確保諮詢費在任何結束路徑都能正確收尾並通過三方對帳。

#### Scenario: 諮詢費走「不做大貨」分支端到端

- **GIVEN** 客人 surveycake 付諮詢費 2000 元
- **WHEN** webhook 觸發
- **THEN** 系統 SHALL 建立 ConsultationRequest（待諮詢）+ Payment（綁 ConsultationRequest、款項類型 = 收款、金額 = 2000、status = 已完成）
- **AND** 系統 MUST NOT 建立任何 Order
- **WHEN** 諮詢人員結束諮詢選擇「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、source_type = consultation_end_no_production、invoicing_status = 未開立）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 = 完成諮詢

#### Scenario: 諮詢費走「做大貨 + 需求單成交」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、後續需求單議價成交，各印件項目小計（單價 × 數量，取整）合計 4000 元
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **AND** 系統 MUST NOT 建立任何 BillingInstallment
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 訂單商品小計 SHALL 由各印件售價原值繼承後加總 ＝ 4000（見 [order-management spec § 成交轉訂單](../order-management/spec.md)）
- **AND** 一般訂單應收 = 6000、已收 = 2000、待繳 = 4000

#### Scenario: 諮詢費走「做大貨 + 需求單流失」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、Payment 綁 ConsultationRequest
- **WHEN** 後續需求單於議價中流失
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、source_type = quote_lost、invoicing_status = 未開立）
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 維持「已轉需求單」不變

#### Scenario: 待諮詢取消半額退費端到端

- **GIVEN** 客人付諮詢費 2000 元、ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員點擊「取消諮詢」並選定 cancel_reason_category
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment(收款 2000) 從 ConsultationRequest 轉移
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = 諮詢取消退費、status = 已核可）
- **AND** 系統 SHALL 自動建立退款款項紀錄（款項類型 = 退款、金額 = 1000、paymentStatus = 處理中）
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance
- **AND** 諮詢訂單 status SHALL 直接推進至「已取消」
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
