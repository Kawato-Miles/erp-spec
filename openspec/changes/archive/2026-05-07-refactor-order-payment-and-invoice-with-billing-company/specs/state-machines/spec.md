# state-machines — Delta Spec

## ADDED Requirements

### Requirement: 訂單異動（OrderAdjustment）狀態機

OrderAdjustment SHALL 為**獨立狀態機**，不影響主訂單狀態。狀態定義：

| 狀態 | 說明 |
|------|------|
| 草稿 | 業務 / 諮詢建立但未提交審核 |
| 待主管審核 | 業務提交後等待業務主管核可 |
| 已核可 | 業務主管核可，等待業務執行 |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | 業務執行核可後的異動，應收總額更新（終態） |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核 ──────▶ 待主管審核
草稿 ─ 取消 ──────────▶ 已取消
待主管審核 ─ 核可 ────▶ 已核可
待主管審核 ─ 退回 ────▶ 已退回
已退回 ─ 修改後重交 ──▶ 待主管審核
已退回 ─ 取消 ────────▶ 已取消
已核可 ─ 執行 ────────▶ 已執行
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（Order.total_with_tax + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 PaymentPlan。

#### Scenario: OrderAdjustment 草稿提交審核

- **GIVEN** OrderAdjustment.status = 草稿
- **WHEN** 業務點擊「提交審核」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 MUST 通知業務主管（Slack 或站內訊息）

#### Scenario: 業務主管核可後業務執行

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** status SHALL → 已執行
- **AND** 系統 MUST 重算訂單應收總額
- **AND** 系統 MUST NOT 自動修改 PaymentPlan

#### Scenario: 業務主管退回後修改重交

- **GIVEN** OrderAdjustment.status = 已退回
- **WHEN** 業務修改 amount 或 reason 後點擊「重新提交」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 SHALL 清空原 reject_reason

#### Scenario: 主訂單推進不受 OrderAdjustment 阻擋

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 主訂單狀態 = 生產中
- **WHEN** 工單 / 印件層 bubble-up 觸發主訂單推進
- **THEN** 主訂單 SHALL 推進至下個狀態
- **AND** OrderAdjustment 維持「待主管審核」

#### Scenario: 訂單已完成但 OrderAdjustment 未完結

- **GIVEN** 主訂單狀態 = 已完成
- **AND** OrderAdjustment.status = 待主管審核
- **WHEN** 業務 / 主管查看訂單詳情頁
- **THEN** 系統 SHALL 顯示提示 banner「該訂單仍有 N 筆訂單異動待主管審核」
- **AND** OrderAdjustment SHALL 仍可獨立完成審核與執行

### Requirement: 發票（Invoice）狀態機

Invoice SHALL 有獨立狀態機，狀態定義：

| 狀態 | 說明 |
|------|------|
| 開立 | 藍新 Mockup 開立成功；可被引用至 PaymentInvoice 與 SalesAllowance |
| 作廢 | 業務作廢（含作廢原因）；終態 |

狀態轉換：

```
開立 ─ 業務作廢 ──▶ 作廢
```

作廢後 ezpay_merchant_order_no 流水號 SHALL NOT 重用；同訂單若需重新開立發票，新發票流水號 SHALL +1。

#### Scenario: 發票開立後可作廢

- **GIVEN** Invoice.status = 開立
- **WHEN** 業務 / 諮詢點擊「作廢」並填入原因
- **THEN** status SHALL → 作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at、invalid_by

#### Scenario: 作廢後流水號不重用

- **GIVEN** Invoice #1 status = 作廢，ezpay_merchant_order_no = `O-25050601-INV-01`
- **WHEN** 業務於同訂單開立新 Invoice
- **THEN** 新 Invoice 的 ezpay_merchant_order_no SHALL = `O-25050601-INV-02`

#### Scenario: 作廢的發票不參與三方對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 作廢 的 Invoice，只加總 status = 開立 的 total_amount

### Requirement: 折讓單（SalesAllowance）狀態機

折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條）SHALL 有獨立狀態機，狀態定義（Mockup 階段精簡為兩態）：

| 狀態 | 說明 |
|------|------|
| 已確認 | 業務開立折讓並 Mockup 立即觸發確認；折讓正式生效，影響三方對帳；終態之一 |
| 已作廢 | 業務作廢已確認的折讓單（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立）；終態之一 |

狀態轉換：

```
（建立時直接寫入）─▶ 已確認 ─ 業務作廢折讓 ──▶ 已作廢
```

**Mockup 階段不使用「草稿」過渡態**：藍新 API 雖支援 Status = 0 不立即確認模式，但 Prototype 不模擬此情境（業務開立 = 自動已確認）。未來真實藍新串接若需要 Status = 0 等待買受人確認流程，另開 change 補「草稿 / 已取消」狀態。

已作廢的折讓單 SHALL NOT 再參與三方對帳。已作廢後該發票 SHALL 回到折讓前的剩餘可折讓金額狀態。

#### Scenario: 折讓開立後立即為已確認

- **WHEN** 業務開立 SalesAllowance
- **THEN** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API
- **AND** SalesAllowance.status SHALL 直接寫入「已確認」（不停留於草稿）
- **AND** issued_at 與 confirmed_at MUST 同時寫入

#### Scenario: 業務作廢已確認的折讓（undo 機制）

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務於折讓詳情頁點擊「作廢折讓」並填入原因（如：金額打錯）
- **THEN** status SHALL → 已作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at
- **AND** 該發票剩餘可折讓金額 SHALL 回到作廢前狀態（因為已作廢折讓不再扣減）

#### Scenario: 已作廢的折讓不參與對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 已作廢 的 SalesAllowance
- **AND** 系統 SHALL 只扣減 status = 已確認 的 |allowance_amount|

### Requirement: PaymentPlan 變更觸發訂單回業務主管審核

訂單已通過業務主管審核後，業務 / 諮詢若變更 PaymentPlan（新增、刪除、修改期別金額或日期），訂單 SHALL 回退至「業務主管審核」狀態，等待主管重新核可。沿用 [archived change: add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 的「核可後可解鎖、變更後重審」機制。

#### Scenario: 業務修改 PaymentPlan 觸發回審

- **GIVEN** 訂單已通過業務主管審核，狀態 = 訂單確認
- **WHEN** 業務修改 PaymentPlan #2.scheduled_amount
- **THEN** 訂單狀態 SHALL → 業務主管審核
- **AND** 活動紀錄 MUST 記載變更原因（系統自動：「付款計畫變更」）

#### Scenario: 業務新增 PaymentPlan 期次觸發回審

- **GIVEN** 訂單已通過業務主管審核
- **WHEN** 業務新增 PaymentPlan #3
- **THEN** 訂單狀態 SHALL → 業務主管審核

#### Scenario: 業務主管核可後訂單恢復

- **GIVEN** 訂單因 PaymentPlan 變更回到「業務主管審核」
- **WHEN** 業務主管核可
- **THEN** 訂單 SHALL 推進至原狀態（變更前的後續狀態）

#### Scenario: PaymentPlan 變更不影響主訂單後續狀態

- **GIVEN** 訂單已進入「生產中」
- **WHEN** 業務變更 PaymentPlan
- **THEN** 訂單 SHALL NOT 回退至業務主管審核（已過審核段，不可回退；對應 § 訂單狀態不可逆）
- **AND** 系統 SHALL 顯示警告「訂單已進入生產段，付款計畫變更僅作記錄，無法重新審核」
