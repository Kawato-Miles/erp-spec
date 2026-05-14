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

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 PaymentPlan。

**OrderAdjustment 雙重身份廢止**：本 change（add-after-sales-ticket）廢止 v1.2 的「雙重身份標註」設計。OrderAdjustment 不再有 `adjustment_phase` 欄位，不再依 Order.status 推算 phase，所有 adjustment_type 皆可於任何 Order 狀態下選用。原 phase = after_completion 的「售後服務單」業務情境改由 AfterSalesTicket 承載（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位標示其源自哪張售後 ticket：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑）
- **非 NULL**：AfterSalesTicket 內部建立的關聯異動（退款 / 補印收費）

兩種情境共用同一狀態機。`linked_after_sales_ticket_id` 一經建立 MUST NOT 變動。

**對帳警示觸發**：對帳檢視面板的警示 banner 觸發條件仍為「`OrderAdjustment.executed_at > Order.completed_at`」（執行時點跨越訂單完成日），同時適用 linked_after_sales_ticket_id 為 NULL 與非 NULL 的 OrderAdjustment。完整觸發邏輯詳見 [order-management spec § 對帳警示 banner 觸發條件](../order-management/spec.md)。

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

#### Scenario: 跨期執行觸發對帳警示

- **GIVEN** Order.completed_at = 2026-03-15
- **WHEN** 任一 OrderAdjustment（含 linked_after_sales_ticket_id 為 NULL 或非 NULL）執行於 2026-05-06
- **THEN** 對帳檢視面板 SHALL 顯示警示 banner

## ADDED Requirements

### Requirement: AfterSalesTicket 狀態機

AfterSalesTicket SHALL 為獨立狀態機，與 Order 主狀態、OrderAdjustment 狀態機平行運作。狀態定義：

| 狀態 | 說明 |
|------|------|
| 受理中 | 業務已建 ticket、尚未填入 resolution |
| 處理中 | 業務已填入 resolution 並送出決議；下游動作（關聯 OrderAdjustment / 補印 PrintItem）可建立與執行 |
| 已結案 | 業務手動點「結案」推進的終態 |

狀態轉換：

```
受理中 ─ 送出決議（填 resolution）──▶ 處理中
處理中 ─ 業務點結案 ────────────────▶ 已結案
處理中 ─ 修改 resolution ───────────▶ 處理中（同態，允許 resolution 變更）
已結案 ─ 不可重開 ──────────────────▶ X
```

**無核可關卡**：AfterSalesTicket 狀態機無「待主管核可」階段。業務與業務主管於 Slack 線下討論，ERP 僅記錄結果（resolution / responsibility / slack_thread_url）。

**結案純手動**：MVP 階段「處理中 → 已結案」轉換 SHALL 為業務手動操作（點「結案」按鈕），系統 SHALL NOT 依關聯動作（補印 PrintItem 出貨完成、退款 Payment 入帳）自動推導結案。

**ticket 不阻擋主訂單**：AfterSalesTicket 處於任何狀態 SHALL NOT 影響 Order.status。Order.status 永遠保持「已完成」不回退。

**ticket 不阻擋 OrderAdjustment**：AfterSalesTicket 內建關聯 OrderAdjustment 仍走 OrderAdjustment 既有狀態機（含業務主管審核關卡）。ticket 結案前 OrderAdjustment 可獨立運作。

**結案後不可重開**：MVP 階段已結案 ticket 不支援重開。客戶後續再投訴時，業務 SHALL 建立新 ticket（已結案 ticket 不算入「最多 1 張」限制）。

完整 ticket 規格詳見 [after-sales-ticket spec](../after-sales-ticket/spec.md)。

#### Scenario: ticket 受理中填入 resolution 推進處理中

- **GIVEN** AfterSalesTicket.status = 受理中、resolution = NULL
- **WHEN** 業務填入 resolution = 退款 並點「送出決議」
- **THEN** status SHALL → 處理中
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「決議送出」、resolution 值）

#### Scenario: ticket 處理中業務手動結案

- **GIVEN** AfterSalesTicket.status = 處理中、resolution = 退款、關聯 OrderAdjustment 已執行
- **WHEN** 業務點擊「結案」
- **THEN** status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at、closed_by

#### Scenario: ticket 結案不影響 Order.status

- **GIVEN** Order.status = 已完成、AfterSalesTicket.status = 處理中
- **WHEN** 業務於 ticket 上推進結案
- **THEN** AfterSalesTicket.status SHALL → 已結案
- **AND** Order.status MUST 維持「已完成」不變

#### Scenario: ticket 內 OrderAdjustment 獨立運作

- **GIVEN** AfterSalesTicket.status = 處理中
- **AND** ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=此 ticket).status = 待主管審核
- **WHEN** 業務嘗試結案 ticket
- **THEN** 系統 SHALL 提示「ticket 內有未完結的 OrderAdjustment（待主管審核），建議完成後再結案」
- **AND** 系統允許強制結案（業務確認時）；OrderAdjustment 仍可獨立完成狀態機
