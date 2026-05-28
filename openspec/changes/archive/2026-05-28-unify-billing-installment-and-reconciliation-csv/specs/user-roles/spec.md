## ADDED Requirements

### Requirement: 業務主管角色職責調整（廢止付款計畫變更回審 + 僅核可退款負項 OA）

業務主管角色職責 SHALL 在訂單款項範疇進行以下調整：

**廢止職責**：
- **不再**因「付款計畫（PaymentPlan）變更觸發訂單回審」進行審核（v1.13 spec L951 規則廢止，BillingInstallment 變更改為留軌跡不回審）

**保留職責**：
- 核可退款負項 OrderAdjustment（amount < 0）：沿用 v1.13 設計、唯一審核 gate
- 訂單其他面向核可職責（如 quote 報價金額大幅異動、客戶信用紀錄等，沿用既有 spec）

**新增職責**：
- 事後監督業務補收 OA 大額閾值警示（透過 Slack 通知接收業務 [name] 建立大額補收 OA +N 元的提醒、發現異常時與業務溝通修正、不阻擋業務操作）

#### Scenario: 業務修改期次日期不觸發業務主管審核

- **GIVEN** 訂單已過業務主管審核進入製作中、業務修改 BillingInstallment 的 due_date
- **WHEN** 系統寫入 DUE_DATE_CHANGED ActivityLog 事件
- **THEN** 業務主管 SHALL NOT 收到審核請求
- **AND** 訂單狀態維持製作中

#### Scenario: 業務主管核可退款負項 OA

- **GIVEN** 業務建立 OA-100（amount=-5000, adjustment_type=退印, status=待主管審核）
- **WHEN** 業務主管於 OA 編輯介面點「核可」
- **THEN** OA-100.status SHALL = 已核可
- **AND** approved_by = 業務主管 user_id、approved_at = now

#### Scenario: 業務主管收到大額補收 OA 事後通知

- **GIVEN** 補收 OA 大額閾值設為 50000（系統設定值）
- **WHEN** 業務建立 OA-101（amount=+60000）並執行
- **THEN** 業務主管 SHALL 收到 Slack 通知「業務 [name] 建立大額補收 OA +60000 元於訂單 [order_no]」
- **AND** 業務主管 MAY 事後檢視 OA-101 + 與業務溝通（不阻擋操作）

### Requirement: 業務角色職責調整（補收 OA 免主管核可直接執行）

業務角色職責 SHALL 在訂單款項範疇新增「補收 OA 直接執行」職責：
- 業務 MAY 建立補收正項 OA（amount > 0, adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項}）並直接執行、無需業務主管核可
- 業務 SHALL 對所建補收 OA 內容負責；超過大額閾值（建議起始 50000）的 OA 觸發業務主管事後監督通知
- 業務 SHALL 沿用既有「建立退款負項 OA → 送業務主管核可」流程，無變動

#### Scenario: 業務直接執行補收 OA

- **GIVEN** 訂單期間客戶要求加印 +8000
- **WHEN** 業務建立 OA（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** 系統 SHALL 直接執行（跳過審核中間態）
- **AND** 業務 MAY 後續新增 BillingInstallment「加印款 8000」承載該補收應收

### Requirement: 諮詢人員角色職責沿用業務（諮詢取消觸發系統自動建期次）

系統 SHALL 沿用 consultation-request v0.3 諮詢人員角色職責設計，並對齊本 change：諮詢取消觸發時系統 SHALL 自動建立 BillingInstallment 取代既有 PlannedInvoice + 諮詢人員 SHALL 後續手動於 BillingInstallment 一鍵開立諮詢費 Invoice + 諮詢人員 MAY 與業務角色等價執行訂單款項操作。

諮詢人員角色職責沿用 consultation-request v0.3 既有設計，新增以下對齊：
- 諮詢取消觸發時，系統自動建立 BillingInstallment（取代既有 PlannedInvoice）+ OA(-1000) + 退款 Payment
- 諮詢人員 SHALL 後續手動於 BillingInstallment「一鍵開立發票」完成諮詢費發票開立
- 諮詢人員 MAY 與業務角色等價執行訂單款項操作（依 after-sales-ticket § 諮詢角色等價原則）

#### Scenario: 諮詢取消觸發系統自動建期次

- **GIVEN** 諮詢人員或業務主管於諮詢取消 dialog 確認
- **WHEN** 系統執行半額退費連動鏈
- **THEN** 系統 SHALL 自動建立 BillingInstallment（scheduled_amount=1000, description=「諮詢費（取消退費後）」, due_date / expected_invoice_date=取消時點當天, source_type=consultation_cancellation, status=未開立, created_by=system）
- **AND** 系統 MUST NOT 建立 PlannedInvoice（既有自動建邏輯已遷移至 BillingInstallment）
- **AND** 諮詢人員 MAY 後續於 BillingInstallment 一鍵開立諮詢費 Invoice

### Requirement: 會計角色職責新增（CSV 匯出 + 月結對帳閉環）

會計角色職責 SHALL 在訂單款項範疇新增以下內容：

**CSV 匯出**：
- 會計 SHALL 定期（建議月底 + 月結對帳週期）匯出 14 欄對帳 CSV
- CSV 一列 = 一張已開立發票，含應收日 / 開立日 / 收款日 / 收款狀態 / 月底基準 / 帳期天數
- 會計 SHALL 對照 CSV + 銀行對帳單完成月結對帳

**月結對帳閉環**：
- 月結批次 SHALL 自動跑「三方對帳差錯訂單清單」（CEO 指標 2，限定 Order.status = 已完成 且 應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額）
- 警示清單推送給會計檢視（不另建會計反饋系統，CEO Challenge 1 採 (c) 路徑）
- 會計發現差錯時 SHALL 透過 Slack 通知對應訂單業務 / 諮詢處理（人工閉環）

**未來職責**（OQ-BI-2 待 Miles 拍板）：
- 月結閉檔批次操作（locked_by_period_close = true）—— Phase 1 階段預設不啟用、後續 change 處理

#### Scenario: 會計月底匯出對帳 CSV

- **WHEN** 會計於對帳模組選 2026-05-01 ~ 2026-05-31 範圍、點「匯出 CSV」
- **THEN** 系統 SHALL 列出範圍內所有 Invoice.status=開立 的發票紀錄
- **AND** 14 欄資料完整（含繼承來源期次的應收日 + 備註）
- **AND** CSV UTF-8 with BOM 編碼

#### Scenario: 會計收到月結差錯訂單警示

- **GIVEN** 月結批次跑指標 2「三方對帳差錯訂單數」、發現訂單 ORD-001（已完成、應收 ≠ 發票淨額）
- **WHEN** 系統推送警示清單
- **THEN** 會計 SHALL 收到清單含 ORD-001
- **AND** 會計 SHALL 透過 Slack 通知對應業務 / 諮詢追查差錯原因（人工閉環）
