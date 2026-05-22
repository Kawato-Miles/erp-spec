## MODIFIED Requirements

### Requirement: 訂單異動（OrderAdjustment）狀態機

OrderAdjustment SHALL 為**獨立狀態機**，不影響主訂單狀態。狀態定義：

| 狀態 | 說明 |
|------|------|
| 草稿 | 業務 / 諮詢建立但未提交審核 |
| 待主管審核 | 業務提交後等待業務主管核可 |
| 已核可 | 業務主管核可後等待業務於 OA 編輯介面建立關聯 Payment 並切「已完成」累計達 OA.amount |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | 對應 OA 的關聯 Payment（linkedOrderAdjustmentId = OA.id AND paymentStatus = '已完成'）累計 amount = OA.amount（含符號比較），系統自動推進；應收總額更新（終態） |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核 ──────────────────────────▶ 待主管審核
草稿 ─ 取消 ──────────────────────────────▶ 已取消
待主管審核 ─ 核可 ────────────────────────▶ 已核可
待主管審核 ─ 退回 ────────────────────────▶ 已退回
已退回 ─ 修改後重交 ──────────────────────▶ 待主管審核
已退回 ─ 取消 ────────────────────────────▶ 已取消
已核可 ─ 對應 Payment 累計達 OA.amount ──▶ 已執行
已執行 ─ 對應 Payment 取消致累計不足 ────▶ 已核可（修正路徑，沿用 ORD-003 候選做法 1）
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 PaymentPlan。

**「已執行」推進機制（本 change MODIFY refine-after-sales-refund 既有設計）**：

OrderAdjustment 的 `status = 已執行` 推進條件從「業務於 ticket 內建立關聯退款 Payment」改為「對應 OA 的關聯 Payment 累計達 OA.amount」。對稱適用退款 OA（amount < 0，配對 paymentMethod = '退款' 的負值 Payment）與補收 OA（amount > 0，配對 paymentMethod ≠ '退款' 的正值 Payment）。觸發時機：

- 每次業務將某筆 Payment 從 paymentStatus = '處理中' 切換為 '已完成' 時，系統 SHALL 重算該 OA 的對應 Payment 累計
- 若累計值（含符號）= OA.amount，系統 SHALL 同 transaction 推進 OA.status → 已執行、executedAt = 該 Payment 切「已完成」的時點
- 若累計值仍 ≠ OA.amount，OA 維持「已核可」

「執行」action 從業務手動觸發改為系統自動觸發；UI 上 OA 編輯介面 SHALL NOT 提供「執行」按鈕（沿用 refine-after-sales-refund 對 UI 入口的處置）。

**「已執行」回退機制（本 change 新增）**：

業務取消已完成的關聯 Payment 時，系統 SHALL 重算該 OA 的對應 Payment 累計：

- 若累計值（含符號）已 ≠ OA.amount，系統 SHALL 同 transaction 將 OA.status 從「已執行」回退至「已核可」、清空 executedAt
- 若累計值仍 = OA.amount（例如取消的不是最後一筆，剩餘已完成 Payment 仍滿足條件），OA 維持「已執行」

此回退機制 resolve 既有 ORD-003 OQ（候選做法 1：取消已完成 Payment 自動回退 OA 至已核可）。

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

#### Scenario: 退款 OA 對應單筆 Payment 切已完成推進已執行

- **GIVEN** OrderAdjustment OA-001（status = 已核可、amount = -5000）
- **AND** 業務已在 OA-001 編輯介面建立關聯 Payment P-001（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-001.id）
- **WHEN** 業務於 P-001 編輯 dialog 內補齊 paidAt 與 attachments、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-001 對應 Payment 累計 = -5000，等於 OA-001.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-001.status → 已執行、executedAt = now
- **AND** 系統 MUST 重算訂單應收總額（含此筆已執行 OA）
- **AND** 系統 MUST NOT 自動修改 PaymentPlan

#### Scenario: 補收 OA 對應 Payment 切已完成推進已執行（對稱化新規）

- **GIVEN** OrderAdjustment OA-002（status = 已核可、amount = +20000、adjustment_type = 加印追加）
- **AND** 業務已在 OA-002 編輯介面建立關聯 Payment P-002（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **WHEN** 業務於 P-002 編輯 dialog 內補齊 paidAt 與 attachments、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-002 對應 Payment 累計 = +20000，等於 OA-002.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-002.status → 已執行、executedAt = now
- **AND** 系統 MUST 重算訂單應收總額

#### Scenario: 分次退款 / 分次補收累計未達 OA.amount 維持已核可

- **GIVEN** OrderAdjustment OA-003（status = 已核可、amount = -10000）
- **AND** 業務分兩次匯款，已建立兩筆關聯 Payment P-003a、P-003b（各 amount = -5000, paymentStatus = '處理中'）
- **WHEN** 業務先將 P-003a 切「已完成」
- **THEN** 系統 SHALL 重算 OA-003 對應已完成 Payment 累計 = -5000
- **AND** 累計 -5000 ≠ OA-003.amount (-10000)，OA-003.status SHALL 維持「已核可」
- **AND** OA-003.executedAt SHALL 維持 NULL

#### Scenario: 取消已完成 Payment 致累計不足回退 OA

- **GIVEN** OrderAdjustment OA-004（status = 已執行、amount = -5000、executedAt = 2026-05-21T10:00:00Z）
- **AND** 關聯 Payment P-004（paymentStatus = '已完成', amount = -5000）為觸發 OA 已執行的最後一筆
- **WHEN** 業務於 P-004 row 點擊「取消」並確認
- **THEN** 系統 SHALL 刪除 Payment P-004
- **AND** 系統 SHALL 重算 OA-004 對應已完成 Payment 累計 = 0
- **AND** 累計 0 ≠ OA-004.amount (-5000)，系統 SHALL 同 transaction 將 OA-004.status 從「已執行」回退至「已核可」、清空 executedAt
- **AND** 系統 MUST 重算訂單應收總額（不再含此筆 OA 為已執行）

#### Scenario: 取消已完成 Payment 但累計仍滿足維持已執行

- **GIVEN** OrderAdjustment OA-005（status = 已執行、amount = -10000）
- **AND** 兩筆已完成關聯 Payment（P-005a amount = -7000, P-005b amount = -3000）累計 -10000
- **WHEN** 業務於 P-005a row 點擊「取消」
- **THEN** 系統 SHALL 刪除 P-005a
- **AND** 系統 SHALL 重算累計 = -3000 ≠ OA-005.amount (-10000)
- **AND** 系統 SHALL 將 OA-005.status 從「已執行」回退至「已核可」、清空 executedAt
- **註**：此情境結果與「致累計不足回退」一致。若三方對帳邏輯認為「業務後續會補建新 Payment」，需 UAT 階段驗證業務是否覺得意外回退干擾流程

#### Scenario: 取消處理中 Payment 不影響 OA 狀態

- **GIVEN** OrderAdjustment OA-006（status = 已核可、amount = -5000）
- **AND** 關聯 Payment P-006（paymentStatus = '處理中', amount = -5000）
- **WHEN** 業務於 P-006 row 點擊「取消」
- **THEN** 系統 SHALL 刪除 Payment P-006
- **AND** OA-006.status SHALL 維持「已核可」（處理中 Payment 從未影響 OA 狀態）

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
