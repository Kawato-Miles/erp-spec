## ADDED Requirements

### Requirement: AfterSalesTicket entity 與 Factory

Prototype 資料層 SHALL 新增 `AfterSalesTicket` entity，承載訂單已完成後的售後事件案件容器。Entity 包含以下核心欄位（完整欄位定義見 [after-sales-ticket spec § AfterSalesTicket 實體與欄位](../after-sales-ticket/spec.md)）：

- `id`、`order_id`（FK -> Order）、`case_no`（業務可讀編號 AS-YYYYMMDD-XX）
- `opened_at`、`opened_by`（FK -> User）
- `customer_complaint`（text）、`case_category`（enum）、`responsibility`（enum）
- `resolution`（enum，nullable）、`slack_thread_url`（URL，nullable）
- `additional_complaint_log`（array of {logged_at, note}）
- `customer_feedback_note`（text，nullable）
- `status`（enum: 受理中 / 處理中 / 已結案）
- `closure_status`（derived: 未結案 / 已結案）
- `closed_at`（timestamp，nullable）、`closed_by`（FK -> User，nullable）
- `legacy_migrated`（boolean，預設 false；標記是否為從歷史 OrderAdjustment(phase=after_completion) 遷移而來）

Prototype `storeTestUtils.ts` SHALL 提供 `makeAfterSalesTicket(overrides)` factory，回傳含合理預設值的 AfterSalesTicket。`seedData.ts` SHALL 提供 mockAfterSalesTickets 含至少三筆情境驅動 mock：
- 一筆 resolution=不處理（已結案）
- 一筆 resolution=退款（處理中）
- 一筆 resolution=補印（處理中）

#### Scenario: makeAfterSalesTicket factory 提供預設值

- **WHEN** 測試呼叫 `makeAfterSalesTicket({})`
- **THEN** SHALL 回傳含下列預設值的 AfterSalesTicket：
  - status = 受理中
  - resolution = NULL
  - closure_status = 未結案
  - additional_complaint_log = []
  - legacy_migrated = false
- **AND** 其他必填欄位（order_id、opened_at、opened_by、case_category、responsibility）SHALL 由 overrides 提供或 factory 帶入合理 mock

#### Scenario: mockAfterSalesTickets 含三筆情境驅動 mock

- **WHEN** Prototype 啟動載入 seedData
- **THEN** mockAfterSalesTickets SHALL 至少包含三筆：
  - AS-XXX-不處理-已結案
  - AS-XXX-退款-處理中（含關聯 OrderAdjustment linked_after_sales_ticket_id）
  - AS-XXX-補印-處理中（含關聯補印 PrintItem related_after_sales_ticket_id）

### Requirement: PrintItem 加 related_after_sales_ticket_id FK

`OrderPrintItem` entity SHALL 新增 `related_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位，標示此 PrintItem 是否為補印（屬於某張售後 ticket）。

- **NULL**：原始訂單 PrintItem（轉訂單時建立）或訂單期間加印 PrintItem（不屬於售後）
- **非 NULL**：補印 PrintItem，業務於 AfterSalesTicket 內建立

補印 PrintItem 走原審稿 / 工單 / 生產任務 / QC / 出貨流程，無特殊路徑。`related_after_sales_ticket_id` 一經建立 MUST NOT 變動。

訂單詳情頁印件區塊 SHALL 區分顯示原始 PrintItem 與補印 PrintItem（後者標「補印（來自 AS-XXX）」）。

#### Scenario: 業務於 ticket 內建補印 PrintItem 自動關聯

- **GIVEN** AfterSalesTicket AS-001.resolution = 補印
- **WHEN** 業務於 ticket 內點「建立補印印件」並填入規格
- **THEN** 系統 SHALL 建 PrintItem，related_after_sales_ticket_id = AS-001
- **AND** PrintItem 出現在訂單詳情頁印件區塊，標「補印（來自 AS-001）」

#### Scenario: 原始 PrintItem 不影響 related_after_sales_ticket_id

- **GIVEN** Order 從 Quote 轉訂單時自動建立的 PrintItem
- **THEN** related_after_sales_ticket_id SHALL = NULL

## MODIFIED Requirements

### Requirement: OrderAdjustment entity 結構

OrderAdjustment entity SHALL 移除 `adjustment_phase` 欄位（v1.2 雙重身份廢止），新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位。

**欄位調整**：

| 欄位 | 異動 | 說明 |
|------|------|------|
| `adjustment_phase` | REMOVED | v1.2 雙重身份廢止，不再依 Order.status 推算 phase |
| `linked_after_sales_ticket_id` | ADDED | nullable，標示此 OrderAdjustment 是否源自某張 AfterSalesTicket。NULL = 訂單期間直接建立；非 NULL = ticket 內建關聯異動 |
| `adjustment_type` | 不變 | enum 列舉全保留，移除依 phase 的限制；UI 仍可依 ticket.resolution 預填合理值 |

Prototype `storeTestUtils.ts` 的 `makeOrderAdjustment(overrides)` factory SHALL 更新預設值：
- 移除 `adjustment_phase` 欄位
- `linked_after_sales_ticket_id` 預設 = NULL

`seedData.ts` 的 mockOrderAdjustments SHALL 更新：
- 移除 `adjustment_phase = after_completion` 路徑的 mock
- 改寫為「mock OrderAdjustment + linked_after_sales_ticket_id 指向對應 AfterSalesTicket」

歷史 phase=after_completion 的 OrderAdjustment 遷移策略：建對應 AfterSalesTicket（含 `legacy_migrated = true` 標記）並反向關聯，customer_complaint 從 OrderAdjustment.reason 帶入。完整遷移細節見 [OQ-MIGRATE-1](../../changes/add-after-sales-ticket/design.md#oq-migrate-1)。

#### Scenario: makeOrderAdjustment factory 不含 adjustment_phase

- **WHEN** 測試呼叫 `makeOrderAdjustment({})`
- **THEN** 回傳的 OrderAdjustment SHALL NOT 包含 `adjustment_phase` 欄位
- **AND** SHALL 包含 `linked_after_sales_ticket_id`（預設 NULL）

#### Scenario: 歷史資料遷移時 OrderAdjustment 反向關聯 ticket

- **GIVEN** 歷史 mockData 中存在 OrderAdjustment(phase=after_completion)
- **WHEN** Prototype seedData 重建
- **THEN** 系統 SHALL 為每筆歷史 phase=after_completion OA 建立對應 AfterSalesTicket
- **AND** 新建 AfterSalesTicket.legacy_migrated SHALL = true
- **AND** 新建 AfterSalesTicket.customer_complaint SHALL 從 OrderAdjustment.reason 帶入
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL 寫入新建 ticket id
- **AND** OrderAdjustment.adjustment_phase 欄位 SHALL 移除

### Requirement: Order entity 售後狀態 derived field

Order entity SHALL 新增 derived field（不存實體資料庫，UI 推導用）：

- `after_sales_status`（enum: 無 / 售後處理中 / 售後逾期 / 售後已結案）
  - **無**：訂單無關聯 AfterSalesTicket
  - **售後處理中**：訂單至少有 1 張 status ≠ 已結案 的 ticket，且 ticket.opened_at 距今 ≤ 7 天
  - **售後逾期**：訂單至少有 1 張 status ≠ 已結案 的 ticket，且 ticket.opened_at 距今 > 7 天
  - **售後已結案**：訂單所有 ticket 皆 status = 已結案
  - **N 天閾值**：MVP 預設 7 天，可未來於 [OQ-AST-3](../../changes/add-after-sales-ticket/design.md#oq-ast-3) 調整

訂單列表 / 訂單詳情頁 SHALL 依此 derived field 顯示「售後」徽章。

#### Scenario: 訂單有未結案 ticket 顯示徽章

- **GIVEN** Order 有 AfterSalesTicket.status = 處理中、opened_at = 5 天前
- **WHEN** UI 計算 Order.after_sales_status
- **THEN** 該值 SHALL = 「售後處理中」（黃色徽章）

#### Scenario: 訂單未結案 ticket 超過 7 天顯示逾期

- **GIVEN** Order 有 AfterSalesTicket.status = 處理中、opened_at = 10 天前
- **WHEN** UI 計算 Order.after_sales_status
- **THEN** 該值 SHALL = 「售後逾期」（紅色徽章）
