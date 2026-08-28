## MODIFIED Requirements

### Requirement: 諮詢取消觸發建諮詢訂單與退費

當客人或諮詢人員於「待諮詢」狀態取消預約時，系統 SHALL 觸發「建諮詢訂單 + 半額退費 + 沿用一般訂單取消善後」流程，諮詢訂單終態為「**已取消**」。退費金額固定為諮詢費 50%（諮詢費 2000 → 退 1000），**不分客戶 / 諮詢人員主動、不分取消時機**，比例 hardcode in code 不開放系統設定（半額為系統內生預設值，業務於善後時 MAY 依實際調整退款金額，沿用一般退款 OA「已核可後修改不需重審」規則）。

**款項紀錄金額口徑**：退款款項紀錄的金額 MUST 記正值，退款方向由款項類型 = 退款表示（款項紀錄一律正值的鐵則見 wiki [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md) § 4.6）。訂單異動金額另循自身慣例（補收正值、退款負值），不受此條影響。

**自動建單流程（事務性，全成功或全回滾）**：

1. 系統 SHALL 建立諮詢訂單（type=諮詢、客戶資料來自 ConsultationRequest、總額 = 諮詢費 2000）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費 2000)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id；款項類型維持收款、金額維持 2000、status 維持 已完成）
4. **系統 SHALL 自動建立 OrderAdjustment**（金額 = -1000、adjustment_type = `諮詢取消退費`、status = **已核可**、approved_by = system、approved_amount = -1000、executed_at = NULL、requires_supervisor_approval = false、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）— **系統內生直接建為「已核可」**（「負向異動須審核」不破例，因金額固定由系統代行審核；executed_at 待諮詢人員執行「確認生效」時寫入並推進「確認可執行」、應收於此刻認列；已核可階段可調整金額不需重審、亦可取消（決定不退））
5. **系統 MUST NOT 自動建立退款款項紀錄**——該筆由諮詢人員於執行「確認生效」之後自行建立（款項類型 = 退款、金額 = 1000（正值）、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）。理由：認列之前應收仍為 2000、收款淨額 2000，可退額度為零，系統代建會被防超退上限擋下（見 wiki [對帳一致性](../../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/對帳一致性.md)）
6. **系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance、MUST NOT 自動建立待開發票（BillingInstallment / PlannedInvoice）**（廢除諮詢專屬自動建待開發票；諮詢訂單留存 1000 收入由業務循一般訂單取消發票開立路徑於需要時手動開立，未開票風險由對帳「應收 > 發票淨額」差額警示兜底）
7. **諮詢訂單 status 直接推進至「已取消」終態、paymentStatus = 已付款**（本步 MUST 晚於第 4 步建立訂單異動——訂單進終態後建立訂單異動須掛售後服務單，先建才不必為制度性退費開客訴容器）（取代既有「訂單完成」；諮詢取消是「沒成交的生意」，語意應為已取消而非完成；不需製作中間態；退款款項紀錄為已取消後的善後金流動作維持「處理中」）
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
