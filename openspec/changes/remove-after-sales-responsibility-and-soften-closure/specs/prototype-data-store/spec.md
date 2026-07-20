# Delta: prototype-data-store

## MODIFIED Requirements

### Requirement: AfterSalesTicket entity 與 Factory

Prototype 資料層 SHALL 新增 `AfterSalesTicket` entity，承載訂單已完成後的售後事件案件容器。Entity 包含以下核心欄位（完整欄位定義見 [after-sales-ticket spec § AfterSalesTicket 實體與欄位](../after-sales-ticket/spec.md)）：

- `id`、`order_id`（FK -> Order）、`case_no`（業務可讀編號 AS-YYYYMMDD-XX）
- `opened_at`、`opened_by`（FK -> User）
- `customer_complaint`（text）、`case_category`（enum）
- `resolution`（enum，nullable）、`slack_thread_url`（URL，nullable）
- `additional_complaint_log`（array of {logged_at, note}）
- `customer_feedback_note`（text，nullable）
- `status`（enum: 受理中 / 處理中 / 已結案）
- `closure_status`（derived: 未結案 / 已結案）
- `closed_at`（timestamp，nullable）、`closed_by`（FK -> User，nullable）
- `legacy_migrated`（boolean，預設 false；標記是否為從歷史 OrderAdjustment(phase=after_completion) 遷移而來）
- `owner_transfer_log`（array of {transferred_at, previous_owner, new_owner, transferred_by, reason}；預設空陣列；業務主管批次轉派時 append，既有紀錄不可改）

Prototype `storeTestUtils.ts` SHALL 提供 `makeAfterSalesTicket(overrides)` factory，回傳含合理預設值的 AfterSalesTicket。`seedData.ts` SHALL 提供 mockAfterSalesTickets 含至少三筆情境驅動 mock：
- 一筆 resolution=不處理（已結案）
- 一筆 resolution=退款（處理中）
- 一筆 resolution=補印（處理中）

**Priority**: P0

**Rationale**: 售後模組 Prototype 需要資料層 entity 與可重複測試的 factory；補印收費事實由售後單下有無補收異動單承載，entity 不設責任歸屬欄位。

#### Scenario: makeAfterSalesTicket factory 提供預設值

- **WHEN** 測試呼叫 `makeAfterSalesTicket({})`
- **THEN** SHALL 回傳含下列預設值的 AfterSalesTicket：
  - status = 受理中
  - resolution = NULL
  - closure_status = 未結案
  - additional_complaint_log = []
  - legacy_migrated = false
- **AND** 其他必填欄位（order_id、opened_at、opened_by、case_category）SHALL 由 overrides 提供或 factory 帶入合理 mock

#### Scenario: mockAfterSalesTickets 含三筆情境驅動 mock

- **WHEN** Prototype 啟動載入 seedData
- **THEN** mockAfterSalesTickets SHALL 至少包含三筆：
  - AS-XXX-不處理-已結案
  - AS-XXX-退款-處理中（含關聯 OrderAdjustment linked_after_sales_ticket_id）
  - AS-XXX-補印-處理中（含關聯補印 PrintItem related_after_sales_ticket_id）
