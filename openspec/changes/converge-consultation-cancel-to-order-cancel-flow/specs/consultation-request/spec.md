## MODIFIED Requirements

### Requirement: 諮詢取消觸發建諮詢訂單與退費

當客人或諮詢人員於「待諮詢」狀態取消預約時，系統 SHALL 觸發「建諮詢訂單 + 半額退費 + 沿用一般訂單取消善後」流程，諮詢訂單終態為「**已取消**」。退費金額固定為諮詢費 50%（諮詢費 2000 → 退 1000），**不分客戶 / 諮詢人員主動、不分取消時機**，比例 hardcode in code 不開放系統設定（半額為系統內生預設值，業務於善後時 MAY 依實際調整退款金額，沿用一般退款 OA「已核可後修改不需重審」規則）。

**自動建單流程（事務性，全成功或全回滾）**：

1. 系統 SHALL 建立諮詢訂單（type=諮詢、客戶資料來自 ConsultationRequest、總額 = 諮詢費 2000）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費 2000)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id；Payment.amount 維持 +2000、status 維持 已完成）
4. **系統 SHALL 自動建立 OrderAdjustment**（金額 = -1000、adjustment_type = `諮詢取消退費`、status = **已核可**、approved_by = system、approved_amount = -1000、executed_at = NULL、requires_supervisor_approval = false、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）— **系統內生直接建為「已核可」**（approved_by=system 跳過人工待主管審核；executed_at 待退款 Payment 切已完成累計達 -1000 才寫入並推進「已執行」，對齊一般退款 OA 推進機制）
5. **系統 SHALL 自動建立退款 Payment**（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
6. **系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance、MUST NOT 自動建立待開發票（BillingInstallment / PlannedInvoice）**（廢除諮詢專屬自動建待開發票；諮詢訂單留存 1000 收入由業務循一般訂單取消發票開立路徑於需要時手動開立，未開票風險由對帳「應收 > 發票淨額」差額警示兜底）
7. **諮詢訂單 status 直接推進至「已取消」終態、paymentStatus = 已付款**（取代既有「訂單完成」；諮詢取消是「沒成交的生意」，語意應為已取消而非完成；不需製作中間態；退款 Payment 為已取消後的善後金流動作維持「處理中」）
8. ConsultationRequest 狀態 MUST 推進至「已取消」終態、`cancel_reason_category` 寫入 dialog 選定值、`linked_consultation_order_id` 寫入新諮詢訂單 ID

**已取消訂單善後金流不鎖**：諮詢訂單「已取消」終態僅鎖訂單內容編輯（印件 / 規格 / 備註），善後金流動作（退款 Payment 切已完成、發票開立、銷貨折讓）SHALL 照常，沿用一般訂單取消既有善後流程。諮詢取消 MUST NOT 走 AfterSalesTicket（售後容器強制 Order.status=已完成）。

**退款金流處理**：退款依原付款方式刷退，由第三方金流處理。ERP 只記錄取消事實與處理中退款 Payment，實際銀行撥款由第三方金流負責，撥款時程不承諾 SLA。

**諮詢人員後續手動**（諮詢訂單已是「已取消」、以下為善後金流 / 稅務動作）：
- 處理銀行退款金流（與第三方金流確認刷退完成）後，於 OA 編輯介面內將退款 Payment 切「已完成」；系統 SHALL 重算 OA 對應已完成 Payment 累計 = -1000 = OA.amount，同 transaction 推進 OrderAdjustment.status → 「已執行」、executed_at = now（金流完結 + OA 終態，不影響訂單「已取消」終態）
- 需要開立諮詢費發票時，循一般訂單取消發票開立路徑手動開立（金額由諮詢人員依客戶需求決定，建議 1000 元）
- 主動通知客戶退款已處理（不入系統，由諮詢人員以電話 / Email 等管道執行）

**對帳公式**：
- 應收 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000
- 收款淨額 = Payment(+2000) + Payment(-1000) = 1000
- 發票淨額 = 諮詢人員實際開立金額（人工負責，預設目標 1000 元）
- 對帳邏輯：應收 = 收款淨額 = 1000 對帳通過；發票差異由訂單詳情頁既有對帳警示 banner 提示（「應收 > 發票淨額」= 待開票提醒）

**離開「待諮詢」狀態以後**（已轉需求單 / 完成諮詢 / 已取消）MUST NOT 退費（諮詢結束分支已執行即不可退）。

#### Scenario: 諮詢取消觸發建單與資料模型

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空（已認領）、Payment(P0: +2000, linked=CR, status=已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員或業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（type = 諮詢、總額 = 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 的 linked_entity_type 與 linked_entity_id 改為諮詢訂單（金額不變、status 維持已完成）
- **AND** 系統 SHALL 建立 OrderAdjustment(amount = -1000、adjustment_type = `諮詢取消退費`、status = **已核可**、approved_by = system、executed_at = NULL、requires_supervisor_approval = false、reason = 「諮詢取消退費（50%）」)
- **AND** 系統 SHALL 建立退款 Payment(amount = -1000、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id)
- **AND** 系統 MUST NOT 建立任何 Invoice、SalesAllowance、待開發票（BillingInstallment / PlannedInvoice）
- **AND** 諮詢訂單 status SHALL 直接推進至「**已取消**」終態、paymentStatus = 已付款
- **AND** 退款 Payment 維持「處理中」（已取消後的善後金流動作）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」、cancel_reason_category = dialog 選定值、linked_consultation_order_id = 新諮詢訂單 ID

#### Scenario: 退款 Payment 切已完成推進 OA 已執行（善後金流、不影響已取消終態）

- **GIVEN** 諮詢取消後諮詢訂單已是「已取消」、退款 Payment(P1: -1000、paymentStatus = 處理中、linkedOrderAdjustmentId = OA-c1) 存在、OA-c1 status = 已核可
- **WHEN** 諮詢人員處理銀行退款後將退款 Payment P1 切「已完成」並上傳退款證明附件
- **THEN** 系統 SHALL 將 P1.paymentStatus 改為「已完成」
- **AND** 系統 SHALL 重算 OA-c1 對應已完成 Payment 累計 = -1000 = OA.amount，同 transaction 推進 OA-c1.status → 「已執行」、executed_at = now
- **AND** 諮詢訂單 status MUST 維持「已取消」（善後金流不再推進訂單狀態）
- **AND** 對帳：應收 1000 = 收款淨額（+2000 - 1000）= 1000 對帳通過

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
- **AND** UI SHALL 顯示「諮詢結束分支已執行，無法退費」提示

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

系統 SHALL 沿用「諮詢取消觸發建諮詢訂單與退費」主結構（半額退費 1000、自動建 OA(-1000) 已核可、自動建退款 Payment(-1000) 處理中、訂單推進**已取消**終態），但 **MUST NOT 自動建立待開發票（BillingInstallment）**——廢除諮詢專屬自動建請款期次（收斂到一般訂單取消流程：留存收入由業務手動開票、未開票由對帳差額警示兜底）。

**完整連動鏈（諮詢取消收斂版，取代 v1.10 + unify-billing 自動建請款期次）**：
1. 系統自動建立諮詢訂單（order_type = 諮詢、總額 = 諮詢費 2000）
2. 系統自動建立 OrderExtraCharge（charge_type = consultation_fee, amount = 2000）
3. 系統轉移 Payment 從 ConsultationRequest 至諮詢訂單（is_transferred = true）
4. 系統自動建立 OrderAdjustment(-1000, adjustment_type=諮詢取消退費, **status=已核可**, approved_by=system, executed_at=NULL, requires_supervisor_approval=false, linked_after_sales_ticket_id=null)
5. 系統自動建立退款 Payment(-1000, paymentMethod=退款, paymentStatus=處理中, linkedOrderAdjustmentId=OA.id)
6. **系統 MUST NOT 自動建立 BillingInstallment**（廢除 unify-billing 既有「自動建 source_type=consultation_cancellation 待開票」；`source_type = consultation_cancellation` enum 語意保留，業務若手動為已取消諮詢訂單建期次仍可選此值標示來源）
7. 諮詢訂單推進至「**已取消**」終態（取代「訂單完成」；不經製作 / 退款中間態）

#### Scenario: 諮詢取消不自動建 BillingInstallment（廢除諮詢專屬待開發票）

- **GIVEN** 諮詢人員或業務主管於諮詢取消 dialog 確認、cancel_reason_category 已選
- **WHEN** 系統執行連動鏈
- **THEN** 系統 SHALL 依步驟 1-7 完整執行
- **AND** 步驟 6 系統 MUST NOT 自動建立 BillingInstallment 或 PlannedInvoice
- **AND** 諮詢訂單留存 1000 收入由諮詢人員循一般訂單取消發票開立路徑於需要時手動開立諮詢費 Invoice
- **AND** `source_type = consultation_cancellation` enum 保留供業務手動建期次時標示來源
