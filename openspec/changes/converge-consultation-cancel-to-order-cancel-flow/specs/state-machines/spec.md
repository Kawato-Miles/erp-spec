## ADDED Requirements

### Requirement: 諮詢取消諮詢訂單終態收斂（訂單完成 → 已取消）

系統 SHALL 將「待諮詢取消」情境的諮詢訂單終態改為「**已取消**」，取代既有訂單狀態機「諮詢訂單路徑：建立 → 訂單完成」中此情境的終態。諮詢結束不做大貨 / 需求單流失兩情境維持「訂單完成」不變（它們是諮詢正常收尾、有完整應收、非取消）。

**修訂理由**：諮詢取消是「沒成交的生意」，結算為「訂單完成」會污染成交統計（業務誤讀、月會數字虛胖）。「已取消」是訂單狀態機既有終態（[order-management spec § 訂單取消流程](../../specs/order-management/spec.md)），諮詢取消改走此終態符合語意。**推翻 unify-billing（2026-05-28）「諮詢取消結算訂單完成」拍板**（當時為順帶沿用、非 explore 深思）。

**top-down 連鎖空轉邊界**：諮詢訂單無 printItems / workOrders，一般訂單取消的 top-down 連鎖（工單轉取消 / 生產任務報廢）SHALL 為 no-op（迭代空集合，不報錯、不執行無意義連鎖）。

#### Scenario: 待諮詢取消推進已取消終態（取代訂單完成）

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id`、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 2000)
- **AND** Payment P0 從 ConsultationRequest 轉移至諮詢訂單（+2000 不變、status 維持已完成）
- **AND** 諮詢訂單 SHALL 直接推進至「**已取消**」終態（取代既有「訂單完成」）、paymentStatus = 已付款
- **AND** top-down 連鎖（工單 / 生產任務）SHALL 為 no-op（諮詢訂單無印件 / 工單）

#### Scenario: 諮詢結束不做大貨 / 需求單流失仍維持訂單完成（回歸保護）

- **GIVEN** ConsultationRequest 走「諮詢結束不做大貨」或「需求單流失」收尾
- **WHEN** 系統建立諮詢訂單收尾
- **THEN** 諮詢訂單 SHALL 維持推進至「訂單完成」終態（非已取消）
- **AND** 兩情境 SHALL 維持既有自動建 BillingInstallment（source_type = consultation_end_no_production / quote_lost）行為不變

### Requirement: 諮詢取消退費 OA 系統建已核可（取代既有系統建已執行）

系統 SHALL 將諮詢取消退費 OA（系統內生 amount=-1000）建為「**已核可**」（approved_by=system、executed_at=NULL、requires_supervisor_approval=false），沿用一般退款 OA「退款 Payment 切已完成累計達 -1000 推進已執行」機制。取代既有「諮詢取消 OA 系統建直接已執行」（[consultation-request spec 既有 + state-machines § OrderAdjustment 狀態機修訂](../../specs/state-machines/spec.md)）。

**修訂理由**：既有「諮詢取消 OA 一建即已執行」是 bug——「已執行」鎖死金額（[order-management spec L1230](../../specs/order-management/spec.md)，業務無法調整退款金額）+ 配「處理中」退款 Payment 破壞「OA 已執行 → 必有已完成 Payment 累計達 OA.amount」invariant。改建「已核可」同時滿足：系統審核通過（approved_by=system 免人工）+ 可調（[L1184 已核可後修改不需重審](../../specs/order-management/spec.md)）+ 善後歸一 + 修 invariant bug。

**OrderAdjustment 三方審核分流**（補充 unify-billing「OrderAdjustment 狀態機修訂」）：

| OA 類型 | requires_supervisor_approval | 建立後狀態流轉 |
|---------|------------------------------|----------------|
| 補收正項（amount>0 且 type ∈ 五項補收）| false | 草稿 → 已執行（跳過審核中間態，不綁 Payment）|
| 一般退款負項（amount<0，業務發起）| true | 草稿 → 待主管審核 → 人工核可 → 已核可 → 退款 Payment 切已完成推進已執行 |
| 諮詢取消退費（amount=-1000，系統內生）| false | **系統建直接「已核可」（approved_by=system）→ 退款 Payment 切已完成推進已執行** |

#### Scenario: 諮詢取消退費 OA 系統建已核可

- **GIVEN** 諮詢人員 / 業務主管確認諮詢取消
- **WHEN** 系統自動建立諮詢取消退費 OA
- **THEN** OA.status SHALL = 已核可、approved_by = system、approved_amount = -1000、executed_at = NULL、requires_supervisor_approval = false
- **AND** 系統 MUST NOT 將 OA 建為「已執行」（避免鎖金額 + 破壞 invariant）
- **AND** 業務 SHALL 可於 OA 已核可狀態調整退款金額（沿用既有「已核可後修改不需重審」）

#### Scenario: 諮詢取消退費 OA 經退款 Payment 切已完成推進已執行

- **GIVEN** 諮詢取消退費 OA(status=已核可, amount=-1000) + 退款 Payment(-1000, 處理中, linkedOrderAdjustmentId=OA.id)
- **WHEN** 諮詢人員將退款 Payment 切「已完成」並上傳退款證明
- **THEN** 系統 SHALL 重算 OA 對應已完成 Payment 累計 = -1000 = OA.amount
- **AND** 系統 SHALL 同 transaction 推進 OA.status → 已執行、executed_at = now
- **AND** invariant 維持：OA 已執行 → 必有已完成 Payment 累計達 OA.amount（修正既有「已執行配處理中 Payment」破洞）
