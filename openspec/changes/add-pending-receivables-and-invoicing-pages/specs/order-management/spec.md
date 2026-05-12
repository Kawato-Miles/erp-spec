## ADDED Requirements

### Requirement: PaymentPlan 預計開票日

`PaymentPlan` SHALL 支援選填欄位 `expected_invoice_date`，作為業務排程開立發票的提示日期。此欄位不影響 Invoice 實體的開立流程（仍由業務手動於訂單詳情頁觸發），僅作為 [pending-invoicing capability](../pending-invoicing/spec.md) 的排序與提醒來源。

#### Scenario: 業務於建立付款計畫時填入預計開票日

- **WHEN** 業務於訂單詳情頁建立 PaymentPlan，填入「期 2 = 70,000、scheduled_date = 2026-06-30、expected_invoice_date = 2026-05-15」
- **THEN** 系統 SHALL 寫入 PaymentPlan.expected_invoice_date = 2026-05-15

#### Scenario: 業務不填預計開票日

- **WHEN** 業務建立 PaymentPlan 但不填 `expected_invoice_date`
- **THEN** 系統 SHALL 允許，欄位留 NULL
- **AND** 待開發票模組顯示時 SHALL 標示「未指定預計開票日（依預定收款日）」

#### Scenario: 業務批次設定多筆 PaymentPlan 為同一預計開票日

- **GIVEN** 訂單 SO-001 有三筆 PaymentPlan
- **WHEN** 業務於 PaymentPlan 編輯介面選擇三筆並批次設定 `expected_invoice_date = 2026-05-15`
- **THEN** 系統 SHALL 將三筆 PaymentPlan.expected_invoice_date 同時更新為 2026-05-15

## ADDED Data Model

### PaymentPlan 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 預計開票日 | expected_invoice_date | 日期 | | | 業務排程用，僅服務「待開發票模組」的排序與提醒，不影響 Invoice 開立流程 |
