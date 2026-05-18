## MODIFIED Requirements

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止原 v1.2 「雙重身份」設計（`adjustment_phase` 欄位 + UI 「售後服務單」雙重表述）。OrderAdjustment 不再依 Order.status 自動推算 phase，所有 `adjustment_type` 皆可於任何 Order 狀態下選用（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑），無關聯售後 ticket
- **非 NULL**：源自 AfterSalesTicket 內部建立的關聯異動（退款、補印收費）

訂單已完成後（Order.status = 已完成）的售後事件改走 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。業務不再於訂單詳情頁直接建「售後服務單」OrderAdjustment，而是於 AfterSalesTicket 內部建關聯 OrderAdjustment。

OrderAdjustment SHALL 支援多筆明細項（OrderAdjustmentItem 子實體），每筆明細記錄 `item_type`（print_item / fee）、描述、金額。OrderAdjustment.amount 為所有明細金額加總（系統自動計算）。

#### Scenario: 業務建立加印追加異動

- **GIVEN** 訂單 SO-001 狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁點擊「建立訂單異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、UI 標題顯示「訂單異動單」
- **AND** 業務 SHALL 可選 `adjustment_type = 加印追加`
- **AND** 業務新增明細「item_type = print_item，描述 = 加印 200 份，金額 = +20,000」
- **AND** OrderAdjustment.amount SHALL 自動加總為 +20,000
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment

- **GIVEN** AfterSalesTicket AS-001 status = 處理中、resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、預填 adjustment_type = 退印、linked_after_sales_ticket_id = AS-001
- **AND** 業務填入 amount = -5000、明細描述
- **AND** OrderAdjustment.status SHALL = 草稿，後續走原狀態機（提交審核 → 主管核可 → 業務執行）

#### Scenario: 業務主管核可 OrderAdjustment

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回 OrderAdjustment

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務執行已核可的 OrderAdjustment

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行（終態）
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動
- **AND** 若 OrderAdjustment.linked_after_sales_ticket_id 非空，AfterSalesTicket 內部「關聯 OrderAdjustment 卡片」SHALL 顯示「已執行」狀態

#### Scenario: 訂單異動不阻擋主訂單推進

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

#### Scenario: 訂單異動執行後生產內容變更提示

- **GIVEN** OrderAdjustment 含 print_item 類型明細（例如加印追加、規格變更）
- **WHEN** 業務點擊「執行」
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 提示為非阻擋式（業務可關閉提示繼續），系統 NOT 自動建立或修改 PrintItem

### Requirement: OrderAdjustment.adjustment_type 完整 enum

`OrderAdjustment.adjustment_type` SHALL 採用以下完整 enum 列舉，不再依 phase 限制可選範圍：

| adjustment_type | 適用情境 |
|----------------|---------|
| 規格變更 | 訂單期間客戶變更印件規格導致金額調整 |
| 加印追加 | 訂單期間客戶要求加印 |
| 退印 | 退印 / 退款（訂單期間或售後皆可）|
| 折扣 | 業務給予客戶折扣 |
| 加運費 | 訂單成立後補收運費 |
| 急件費 | 訂單成立後補收急件費 |
| 補退 | 售後補印收費 / 訂單期間補退 |
| 其他 | 不屬上述類別 |

業務透過 UI 與 API 皆 SHALL 可選用任一 adjustment_type，系統不再依 Order.status 推算限制。當業務於 AfterSalesTicket 內建關聯 OrderAdjustment 時，UI 仍 SHALL 預填合理的 adjustment_type（例：resolution=退款 → 預填退印；resolution=補印 → 預填補退），但業務可改選。

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment 預填 adjustment_type

- **GIVEN** AfterSalesTicket.resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 預填 adjustment_type = 退印
- **AND** 業務可改選為 折扣 / 補退 / 其他

#### Scenario: 業務於訂單期間自由選 adjustment_type

- **GIVEN** Order.status = 生產中
- **WHEN** 業務建立 OrderAdjustment
- **THEN** 業務 SHALL 可從完整 enum（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）選擇

## REMOVED Requirements

### Requirement: 售後服務單行為限制與發票處理提示

**Reason**: 售後服務單從 OrderAdjustment(phase=after_completion) 改為獨立 AfterSalesTicket 實體（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。原 phase=after_completion 的行為限制（不可加印 / 加運費 / 急件費；發票處理建議式提示；訂單狀態維持已完成不回退）改寫入 after-sales-ticket spec 的相關 Requirement，本 Requirement 廢止。

**Migration**:
- 業務於已完成訂單的售後事件：改建 AfterSalesTicket（見 [after-sales-ticket spec § 業務於已完成訂單建立 AfterSalesTicket](../after-sales-ticket/spec.md)）
- 退款 / 補印的金額異動：於 AfterSalesTicket 內建關聯 OrderAdjustment（linked_after_sales_ticket_id 寫入）
- 發票處理建議：移至 [after-sales-ticket spec](../after-sales-ticket/spec.md) 與 [business-processes spec](../business-processes/spec.md) 的售後分支
- 既有 phase=after_completion 的 OrderAdjustment 歷史單：反向掛 AfterSalesTicket 並標 `legacy_migrated = true`（見 [OQ-MIGRATE-1](../../changes/add-after-sales-ticket/design.md#oq-migrate-1)）

### Requirement: OrderAdjustment.adjustment_type 完整 enum 與 phase 限制

**Reason**: `adjustment_phase` 雙重身份廢止後，adjustment_type 不再依 phase 限制。原 enum 由「OrderAdjustment.adjustment_type 完整 enum」（簡化版，無 phase 限制）取代。

**Migration**:
- 原 during_order 路徑：所有 adjustment_type 仍可選（行為不變）
- 原 after_completion 路徑：售後事件改走 AfterSalesTicket；若仍需建 OrderAdjustment（退款 / 補印收費），由 AfterSalesTicket 內部觸發建立，預填合理 adjustment_type

## MODIFIED Requirements

### Requirement: 對帳警示 banner 觸發條件

訂單詳情頁的對帳檢視面板 SHALL 於以下條件成立時顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」：

```
任一 OrderAdjustment 滿足：
  Order.completed_at IS NOT NULL
  AND OrderAdjustment.status = 已執行
  AND OrderAdjustment.executed_at > Order.completed_at
```

觸發條件 SHALL 同時適用於：
- 訂單期間建立但跨期執行的 OrderAdjustment（linked_after_sales_ticket_id IS NULL）
- AfterSalesTicket 內部建立的關聯 OrderAdjustment（linked_after_sales_ticket_id IS NOT NULL）

兩種情境的對帳意義相同（跨完成日的金額異動需重新對帳），不分桶判斷。Order 尚未完成時（completed_at IS NULL），banner 不觸發。

完整對帳警示與三方對帳檢視邏輯延續本 spec § 三方對帳檢視面板 既有定義。

#### Scenario: 訂單期間建立但跨期執行觸發警示

- **GIVEN** OrderAdjustment 建立時 Order.status = 生產中（executed_at 尚未設定）
- **AND** 業務主管核可後 Order 推進至已完成（completed_at = 2026-03-15）
- **WHEN** 業務於 2026-05-06 點擊「執行」（executed_at = 2026-05-06）
- **THEN** 因 executed_at（2026-05-06）> completed_at（2026-03-15），對帳檢視面板 SHALL 顯示警示 banner
- **AND** banner 文字 SHALL = 「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行，請會計確認原月結紀錄」

#### Scenario: AfterSalesTicket 關聯 OrderAdjustment 執行觸發警示

- **GIVEN** Order.completed_at = 2026-03-15、AfterSalesTicket AS-001 已建立、resolution = 退款
- **WHEN** 業務於 ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=AS-001, amount=-5000) 並執行於 2026-05-06
- **THEN** 對帳檢視面板 SHALL 顯示警示 banner（與訂單期間建立的 OA 處理方式相同）

#### Scenario: 訂單未完成時不觸發警示

- **GIVEN** OrderAdjustment 已執行（executed_at = 2026-05-06）
- **AND** Order.completed_at IS NULL（尚未完成）
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 系統 SHALL NOT 顯示警示 banner

## ADDED Requirements

### Requirement: 訂單詳情頁售後服務 Tab 入口

訂單詳情頁 SHALL 新增「售後服務」Tab，顯示訂單關聯的 AfterSalesTicket 列表與「建立售後服務單」按鈕。Tab 的具體 UI 與行為見 [after-sales-ticket spec § 訂單詳情頁售後服務 Tab](../after-sales-ticket/spec.md)。

訂單列表 SHALL 新增「售後」欄位，依關聯 AfterSalesTicket 狀態推導徽章（無 / 售後處理中 / 售後逾期 / 售後已結案）。具體規格見 [after-sales-ticket spec § 訂單列表售後狀態欄位與篩選器](../after-sales-ticket/spec.md)。

#### Scenario: 訂單詳情頁切換到售後服務 Tab

- **GIVEN** Order.status = 已完成
- **WHEN** 業務於訂單詳情頁切到「售後服務」Tab
- **THEN** Tab 內容 SHALL 顯示訂單關聯的 AfterSalesTicket 列表或建單入口
- **AND** 詳細行為見 [after-sales-ticket spec § 訂單詳情頁售後服務 Tab](../after-sales-ticket/spec.md)
