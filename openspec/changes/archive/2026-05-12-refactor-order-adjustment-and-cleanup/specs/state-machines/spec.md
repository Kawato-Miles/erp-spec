## MODIFIED Requirements

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

**雙重身份標註**：OrderAdjustment 同時涵蓋「訂單異動」與「售後服務」兩種業務情境，由 `adjustment_phase` 欄位區分（詳見 [order-management spec](../order-management/spec.md) § OrderAdjustment 建立與審核）：

- `adjustment_phase = during_order`（訂單尚未完成）→ UI 顯示「訂單異動單」
- `adjustment_phase = after_completion`（訂單已完成）→ UI 顯示「售後服務單」

雙身份共用同一狀態機，差異在於：

- `during_order`：可選 `adjustment_type` 範圍較廣（含加印追加、加運費、急件費）；執行後若涉及生產內容（item_type = print_item）顯示提示「請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- `after_completion`：可選 `adjustment_type` 範圍縮限（不可加印 / 加運費 / 急件費）；執行後顯示提示「請至訂單詳情頁的發票區處理（作廢 / 折讓）」

`adjustment_phase` 於建單時依 `Order.status` 自動推算後鎖定，狀態機運作與 phase 無關（兩 phase 共用相同狀態轉換）。

**對帳警示觸發**：對帳檢視面板的警示 banner 觸發條件 SHALL 為「`OrderAdjustment.executed_at > Order.completed_at`」（執行時點跨越訂單完成日），不依 phase 判斷。原因是 phase = during_order 但跨期執行的場景（業務於訂單未完成時建單，拖到訂單完成後才執行）會計帳上仍是跨期調整。完整觸發邏輯詳見 [order-management spec](../order-management/spec.md) § 對帳警示 banner 觸發條件 Requirement。

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
- **AND** 若執行時點晚於 Order.completed_at（執行時點跨越訂單完成日），對帳檢視面板 SHALL 顯示警示 banner

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

#### Scenario: phase = during_order 但跨期執行觸發對帳警示

- **GIVEN** OrderAdjustment.adjustment_phase = during_order（建單時 Order 尚未完成）
- **AND** 業務主管核可後 Order 推進至已完成（completed_at = 2026-03-15）
- **WHEN** 業務於 2026-05-06 執行 OrderAdjustment（executed_at = 2026-05-06）
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 因 executed_at > completed_at，對帳檢視面板 SHALL 顯示警示 banner
- **AND** 警示 banner 觸發與 phase 無關（不需 phase = after_completion 也會觸發）

#### Scenario: 訂單異動單（during_order）執行後生產內容變更提示

- **GIVEN** OrderAdjustment.adjustment_phase = during_order
- **AND** OrderAdjustment 含 item_type = print_item 的明細
- **WHEN** OrderAdjustment.status → 已執行
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 系統 NOT 自動建立或修改 PrintItem

#### Scenario: 售後服務單（after_completion）執行後顯示發票處理提示

- **GIVEN** OrderAdjustment.adjustment_phase = after_completion
- **WHEN** OrderAdjustment.status → 已執行
- **THEN** 系統 SHALL 顯示提示「此筆異動涉及金額變動，請至訂單詳情頁的發票區處理（作廢 / 折讓）」
- **AND** 提示為非問句、非自動跳轉
