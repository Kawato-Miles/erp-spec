---
type: raw
status: raw
created-at: 2026-07-30
source: claude-self-capture
captured-by: claude-on-task
module:
  - 派單
  - 貨運單
  - 印件
topic-tag:
  - 中國線
  - 派單外派
  - 跨境物流
  - 關稅
  - 運費攤分
related-vault:
  - "[[派單]]"
  - "[[貨運單]]"
  - "[[派單狀態]]"
  - "[[印件]]"
raw-source-link: 後端 repo sens-print-core（本機 ~/sens-print-core）dev 分支 apps/ec/ 逐檔擷取；Miles 2026-07-30 指示「先去後端 repo sens-print-core 把派單、運單現況存到 raw」
---

# 派單與運單現況（sens-print-core 後端實體與狀態推導）

> Miles 2026-07-30 指示：wiki 正本卡一律只寫拍板後生效內容、不並陳兩個時態，現況改存 raw 與現行 codebase。本檔為派單與運單的現況真相，供生產階段 openspec 清整時對照。派案平台已上線，MES 上線後走迭代銜接、不是新建取代。
> 擷取方式：讀 `apps/ec/models/`、`apps/ec/services/`、`apps/ec/tasks/`、`apps/ec/v1/urls.py` 原始碼與 `db_comment` 中文欄位註解。

## 原始素材

### 一、實體全貌（皆位於 `apps/ec/`）

| model | 中文語意（依 db_comment）| 關鍵欄位 |
|---|---|---|
| `WorkOrder` | 派案模組介面上的「工單」 | `attribute_type`（工單屬性，六值）、`status`（工單狀態，六值）、`review_note`（審稿備註）、`customer_event_time`（客戶活動時間）、`taiwan_shipping_date`（台灣出貨日期）、`tags`（標籤 JSON）、`reference_order_id`（關聯訂單）、`source_work_order_id`／`source_order_id`／`source_created_at`／`source`（來源系統同步欄）、`producing_cn_at`（發稿日期＝狀態切「製作中（大陸）」的時間）、`deleted_at`（軟刪除）|
| `OrderItem` | 稿件（對應 wiki 的印件）| `status`（稿件狀態，六值）、`production_status`（製作狀態，六值）、`china_status`（大陸處理狀態，**十三值**）、`item_index`、`note`／`note_2`、`is_designed`（是否編輯器稿件）、`item_config`／`specifications`（JSON）、`exchange_rate`（建立時鎖定的人民幣對台幣匯率）、`cn_order_id`（中國供應商的稿件 ID）、FK `order`、FK `work_order`（可空）|
| `OrderItemAssignment` | 指派供應商 | `status`（active／cancelled）、`expected_delivery_date`、`assigned_at`、`work_order_id`（整數欄、非 FK）、FK `order_item`／`supplier`／`admin_user` |
| `OrderItemQuotation` | 供應商報價 | `pricing_method`（unit 單價／total 總價）、`price`、`required_days`、`earliest_ship_date`、`proof_image`（對稿圖片 URL）、`note`、`is_active`（是否為目前有效報價）、`production_quantity`（中國供應商實際生產數量）、method `get_effective_quantity()`（實際生產數量優先，None 時回退下單數量）|
| `OrderItemShipping` | 運費紀錄 | `type`（china／taiwan）、`logistics_type`、`fee_type`（shared 分攤／fixed 固定）、`logistics_no`、`weight`(kg)、`amount`、`currency`（TWD／CNY）、`sent_date`、`received_quantity`（點收數量）、FK `order_item`、FK `waybill`（可空）、method `amount_as_twd(rate)`／`amount_as_cny(rate)` |
| `Waybill` | 貨運單 | `status`（pending 待認列／confirmed 已認列）、`carrier`（承運商）、`ship_date`、`shipping_fee_currency`／`shipping_fee`、`actual_quantity`（實際出貨數量）、`is_partial_shipment`（是否部分出貨）、`shipment_image`、`waybill_no`、`package_count`（包裹數量）、`weight`(kg)、FK `supplier`、**M2M `order_items`** |
| `WaybillTariff` | 關稅單據（一張運單最多一筆，OneToOne）| `shipping_method`（sf 順豐／consolidation 集運／hct 新竹）、`tracking_number`、`tariff_amount`（NTD）、`carrier`（快遞業者）、`customs_declaration_no`（報單號碼）、`tax_bill_no`（稅單號碼，unique）、`box_count`（箱數）、`package_count`（件數）、`charge_date`（收費日期）、`payer`（付款人）、`payment_method`（petty_cash 零用金／monthly 月結）|

主檔類：`apps/supplier/models/supplier.py`（供應商）、`apps/ec/models/exchange_rate.py`（匯率）。

### 二、`WorkOrder.attribute_type` 六值（介面稱「工單屬性」）

| 代碼 | 中文註解 |
|---|---|
| `proof` | 打樣 |
| `mass_no_proof` | 大貨（無打樣，直接製作大貨）|
| `mass_same_file` | 大貨（檔案同打樣單）|
| `mass_file_modified` | 大貨（檔案有修改，以新檔案製作）|
| `second_proof` | 第二次打樣訂單（新工單）|
| `box_sample_and_mass` | 盒型白樣製作＋大貨單（廠內）|

### 三、`WorkOrder.status` 六值

`review_approved` 審稿合格／`producing_cn` 製作中（大陸）／`shipping` 運送中／`inspecting` 到貨品檢中／`completed` 已完成／`canceled` 工單已作廢。

### 四、`OrderItem.china_status` 十三值（大陸處理狀態）

`not_sent` 未送大陸／`delivered` 已交付工單／`sent` 已發稿／`producing_full` 製作中（整批）／`producing_part` 製作中（分批）／`partial_shipping` 分批出貨中／`sent_forwarder` 已送集運商／`returning` 運回台灣中／`tw_inspecting` 已到貨品檢／`oversea_direct_part` 海外直發-分批／`oversea_direct_full` 海外直發-全出／`oversea_direct_cn` 海外直發-送大陸客戶／`tw_warehoused` 台灣已入庫。

### 五、工單狀態的推導規則（`apps/ec/tasks/update_work_order_status.py`）

`WorkOrder.status` 不由人直接改，而是由旗下全部 `OrderItem.china_status` 集合推導，非同步觸發（`update_work_order_status.delay()`，`select_for_update` 防競態）。原始碼 docstring 的優先順序（高到低）：

1. 工單已作廢：訂單 `display_state` 為 VOIDED
2. 已完成：所有稿件大陸狀態皆為終態（台灣已入庫／海外直發系列）
3. 到貨品檢中：所有稿件大陸狀態皆為「已到貨品檢」
4. 運送中：任一稿件為「分批出貨中」「已送集運商」或「運回台灣中」
5. 製作中（大陸）：任一稿件為「已發稿」「製作中（整批）」或「製作中（分批）」
6. 審稿合格（預設）：未送大陸／已交付工單

觸發點散在 `apps/ec/v1/admin/views/order_item_views.py`（管理端改稿件狀態時）與 `apps/ec/v1/views/order_item_views.py`（供應商端回寫時），另有 `WorkOrderService.batch_update_status(work_order_ids)` 批次觸發。

### 六、關聯基數

- `WorkOrder` 1:N `OrderItem`（`OrderItem.work_order` 為可空 FK，`related_name="order_items"`）
- `OrderItem` 1:N `OrderItemAssignment`／`OrderItemQuotation`／`OrderItemShipping`
- `Waybill` M2M `OrderItem`（一張貨運單可含多筆稿件，一筆稿件可上多張貨運單）
- `Waybill` 1:1 `WaybillTariff`
- `OrderItemShipping` N:1 `Waybill`（可空）
- `OrderItemAssignment.work_order_id` 為整數欄、非外鍵約束

### 七、API 分界（`apps/ec/v1/`）

- 供應商端（`apps/ec/v1/urls.py`）：`GET/PATCH order-item/<id>`（稿件詳情與回寫）、`order-item/<id>/quotation`（報價）、`waybill`（建貨運單）、`work-order/sync`（自 EC 同步工單進中台）
- 管理端（`apps/ec/v1/admin/urls/`）：`order_item_urls`、`waybill_urls`、`exchange_rate_urls`

### 八、工單編號格式（`format_work_order_no`）

`{prefix}-{訂單 display_id 後 6 碼}-W-{source_work_order_id}`，例 `S-123456-W-100`。prefix 由 `source` 對映：`hiprint-dev`／`sensationsprint` → `S`，`lixiang-dev`／`82rfoi3ac1` → `L`。

## 精練時要處理的落差（僅記錄觀察，不下裁決）

1. **同名不同物**：`ec.WorkOrder` 與 MES 工單同名，六值 `attribute_type` 是前者的欄位。wiki [[派單]] 與 [[派單狀態]] 現將六值描述為「對應工單的製作類型（工單屬性）、派發時依工單帶入」，讀者會誤解為 MES 工單的屬性。
2. **十三值的實體歸屬**：大陸處理狀態掛在 `OrderItem`（稿件／印件）上，wiki [[派單狀態]] 將它整條描述為派單的狀態鏈。同卡 L123「大陸處理狀態是工單狀態的子狀態鏈」與原始碼的推導方向一致，但掛載實體不同。
3. **派單粒度**：wiki [[派單]] L104 寫「現況 1 派單對 1 工單」，原始碼是 `WorkOrder` 1:N `OrderItem`，且指派、報價、運費三者皆掛在 `OrderItem` 上、不掛在 `WorkOrder` 上。
4. **wiki 沒有的現況欄位**：`WorkOrder.taiwan_shipping_date`（台灣出貨日期）、`WorkOrder.tags`、`WorkOrder.customer_event_time`、`OrderItem.exchange_rate`（建立時鎖匯率）、`OrderItemQuotation.production_quantity`（供應商實際生產數量，含 `get_effective_quantity()` 回退邏輯）、`Waybill.is_partial_shipment`、`WaybillTariff` 全部十三欄。
5. **狀態非人工推進**：工單狀態由稿件大陸狀態集合非同步推導，wiki 未記載此推導關係與六條優先序。
