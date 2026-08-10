# 派單／運單後端實作盤點（as-is，2026-08-11）

> Sonnet 爬碼報告原樣存檔。證據層級：`erp` repo 正式前端（dashboard／china-supplier）的 API 契約與元件行為。
> **前提修正**：`sensation-api` 是 EC（電商）後台、不是 ERP 後端——它只透過 `ERP_HOST` 以 `POST /api/v1/ec/work-order/sync` 把工單推給另一個獨立的 ERP 後端服務；該 ERP 後端 repo 不在本機，凡 model 欄位型別、choices 字面、狀態轉換守衛、攤分權威實作一律「查無」。

## 一、`/api/v1/admin/order-item/{id}/shipping` 做什麼

**不是「出貨」，是稿件層的「運費紀錄」CRUD**（列表／新增／更新／刪除，另有備註端點 `note/order-item-shipping/{shippingId}`）。
證據：`packages/shared/services/outsource/outsource/api.js:35-38`、`hooks/outsource/useOutsourceDetail.js:25-34`、`components/outsource/detail/FeeModal.js:60-90`。

送出欄位（FeeModal.js:126-135）：

| 欄位 | 型別／值域 | 說明 |
|---|---|---|
| type | china / taiwan | 中國運費／台灣運費 |
| logistics_no | 文字，必填 | 寄件單號 |
| logistics_type | 文字 | 運送方式：china＝順豐／集運-巧巧狼／集運-台集運／其他；taiwan＝順豐／新竹／集運（constants.js:27-39） |
| weight | 數字，必填 | 公斤 |
| amount | 數字，必填 | 金額 |
| currency | CNY / TWD | 切換幣別時前端用稿件鎖定匯率換算 |
| sent_date | 日期 | 寄出日期 |
| remark | 文字 | 備註 |

回傳另含 `amount_twd`（台幣換算）、`china_weight`（大陸出貨重量，唯讀對照）。前端未觸發任何狀態轉換，成功後 invalidate 稿件資料（後端應會重算成本欄）。

## 二、派單的資料結構

**程式碼中沒有獨立的「派單單據」實體**——派單＝稿件（order-item）上掛 `assignment` 物件（supplier_id／supplier_name／assigned_at＝實際派單日期／expected_delivery_date），無獨立單號、無獨立狀態欄。
建立：`POST /api/v1/admin/order-item/assign`，payload `{ order_item_ids: [...], supplier: 供應商id, expected_delivery_date }`（api.js:31、AssignSupplierModal.js:49-55）。觸發者＝ERP 管理員（派案列表批次勾選、稿件詳情「指派供應商」）。供應商下拉只列 is_active。

稿件詳情欄位：id、order_id、order_display_id、work_order_no、order_item_id、order_name、product_name、specifications、quantity（派單數量）、unit_price、total_price、status（稿件狀態）、work_order_status（工單狀態）、china_status（大陸處理狀態 13 值）、work_order_attribute_type（工單製作類型）、taiwan_shipping_date、producing_cn_date（發稿日期）、earliest_ship_date（廠商預計寄出）、assignment、exchange_rate（稿件鎖定匯率）、gross_margin、shared_shipping_fee、fixed_shipping_fee、quotation{...}、tariffs[]（含 waybill_id）、thumbnails[]、attachments[]。
關聯：派單掛稿件層、不掛工單；工單只以 work_order_no／work_order_status 出現在稿件上；生產任務概念查無。上游＝EC 的 WorkOrder（sensation-api `payment/models/work_order.py:8-69`，含 attribute_type 六值、taiwan_shipping_date、erp_synced_at），經 `work-order/sync` 推進 ERP。

## 三、運單（waybill）的資料結構

端點：`GET/POST /api/v1/admin/waybill`、`GET/PUT /api/v1/admin/waybill/{id}`；輔助 `GET /api/v1/admin/order-item/search`。
建單 payload（BatchShippingDrawer.js:154-165,349-363）：supplier（**一張運單限單一供應商**，前端強制）、carrier（承運商）、ship_date、shipping_fee＋shipping_fee_currency（申報運費，TWD/CNY）、actual_quantity（實際發貨總數量，選填）、shipment_image、note、**numbers[]＝{ waybill_no, package_count, weight }（一張運單可掛多組運單號碼）**、order_item_ids[]（認列的稿件）。

detail 回傳：id、waybill_no、status（pending 待認列／confirmed 已認列）、supplier_name、carrier、ship_date、shipping_fee_cny／shipping_fee_twd、weight（大陸申報重量）、package_count、shipment_image、note、is_partial_shipment、order_items[]（**供應商認列清單，畫面明示「僅供參考，QC 可自行重新認列」**）、tariff（**singleton，一張運單最多一筆**）、shippings[]（QC 認列表）。

shippings[] 每列：order_item_id、source_order_item_id、work_order_no、product_name、thumbnail、quantity（派單數量）、received_quantity（點收數量）、weight（台灣實秤）、amount_cny／amount_twd。
關聯：運單 1 → 多稿件；稿件可掛多張運單（分批出貨 is_partial_shipment）。

## 四、運費與關稅

- **攤分基準＝台灣 QC 實秤重量佔比**（分母＝QC 表各列 weight 之和，useWaybillDetail.js:138-157）；**分攤金額由前端算好、以 amount 逐列送後端**（人民幣計、兩位小數）。任一列改重量即清空預存值改回即時試算。
- **關稅攤分只在畫面試算、不進 payload**（ratio × tariff_amount 加總）；實際攤回稿件由後端做、程式碼查無。
- 稿件成本欄兩個運費並存：**shared_shipping_fee（分攤運費）＋ fixed_shipping_fee（固定運費）**；後者前端只讀、**全前端無寫入路徑**（規則在 ERP 後端）。
- 另有第一節的稿件層自建運費紀錄線，與運單攤分在程式碼中無關聯、無去重。
- 匯率：`GET/POST /api/v1/admin/exchange-rate` append-only；稿件拋單當下鎖定 exchange_rate；取不到時前端 fallback 常數 4.6。
- 關稅單據欄位（tariff/constants.js:36-49）：shipping_method（sf／consolidation／hct）、carrier、tracking_number、customs_declaration_no、tax_bill_no（跨運單查重）、tariff_amount（整數非負）、box_count、package_count、charge_date、payer、payment_method（petty_cash 零用金／monthly 月結）、note、sequence_no、waybill_id。

## 五、認列邏輯

- 運單狀態僅兩值：pending 待認列／confirmed 已認列。確認流程：先送關稅 → 再 PUT shippings（註解：避免運單先 Lock 後 tariff 失敗）。確認文案：「確認後此運單資料將被鎖定，並回寫至派案模組。如需修改需編輯內容後再次點擊確認送出。」
- **鎖定實際不完全**：QC 認列表（點收數量／實秤／增刪稿件）已認列後未 disable，可改後再次確認重送；關稅單據明示可編輯刪除、改後重算並同步派案模組（連動毛利率）；派案端關稅區不可新增但可編輯刪除。角色權限判斷查無。

## 六、點收與秤重

quantity（派單數量，對照基準）／received_quantity（點收數量，整數 min 0）／weight（台灣實秤，step 0.01 kg）／運單層 weight（大陸申報）。差異 weightDiff＝總實秤 − 申報，**只提示（Alert ±x kg）、不寫回、無差異原因欄、不阻擋送出**。送出檢核：至少一列、每列點收數量非空且實秤 > 0。

## 七、狀態值域

- 運單：pending 待認列／confirmed 已認列（QC 於運單詳情按確認）。
- 大陸處理狀態 13 值（constants/index.js:108-152）：not_sent 未送大陸、delivered 已交付工單*、sent 已發稿*、producing_full 製作中（整批）、producing_part 製作中（分批）、partial_shipping 分批出貨中、sent_forwarder 已送集運商、returning 運回台灣中、tw_inspecting 已到貨品檢*、oversea_direct_part／full／cn 海外直發三值、tw_warehoused 台灣已入庫*（帶 * 者供應商端不可選為新狀態；台灣已入庫後供應商端整筆不可編輯）。ERP 端下拉／批量 PATCH 不受此限。
- 工單狀態 6 值（唯讀）：review_approved 審稿合格／producing_cn 製作中（大陸）／shipping 運送中／inspecting 到貨品檢中／completed 已完成／canceled 工單已作廢。
- 稿件狀態 6 值（唯讀）：waiting／pending／accepted／rejected／reupload／void。
- 狀態轉換守衛與副作用在 ERP 後端，查無。

## 八、中國供應商端（china-supplier app）

獨立 base URL 與登入（code＋驗證碼）。頁面：login／dashboard／detail。
端點：GET /api/v1/statistics（五格：待報價／未製作／製作中／已出貨／已完成）、GET /api/v1/orders（篩選 china_status、派單日期區間）、GET/PATCH /api/v1/orders/{id}（PATCH 只送 china_status；批量＝並行 PATCH）、POST /api/v1/quotations（報價）、POST /api/v1/shipments（執行出貨）、POST /api/v1/upload/image。
可見欄位：工單編號＋製作類型、稿件編號、訂單名稱、派單數量、派單日期、期望交期、狀態下拉、商品名稱規格、稿件檔案（zip 下載）、報價紀錄表、出貨紀錄表。
出貨表單：承運商、發貨日期、運費＋幣別、運單號碼（多筆，各含箱數／重量）、實際發貨總數量、分批出貨開關（開啟即 is_partial_shipment 且狀態轉分批出貨中）、發貨照片、備註＋「送出後發貨資訊不可再更新」勾選。

## 九、與 wiki 認知可能有出入的點（16 條，只列事實）

1. 「派單」無獨立實體（assignment 掛稿件、無單號無狀態表）。
2. 運費攤分基準＝台灣 QC 實秤佔比（非大陸申報重）。
3. 分攤金額前端算好逐列送後端。
4. 關稅攤分不進 payload、僅畫面試算；實際攤回後端做、查無。
5. shared_shipping_fee 與 fixed_shipping_fee 並存；後者全前端無寫入路徑。
6. 稿件層另有獨立運費紀錄線（order-item shipping），與運單攤分無關聯無去重。
7. 一張運單可掛多組運單號碼（numbers[]），列表只顯示單一號碼欄。
8. 認列後鎖定不完全（文案說鎖、程式未鎖；關稅可改且重算連動）。
9. 一張運單限單一供應商僅前端強制，後端是否強制查無。
10. 重量差異只提示不留存、不阻擋認列。
11. 兩條建運單路徑共用同一 Drawer：供應商端 POST /api/v1/shipments、ERP 端 POST /api/v1/admin/waybill；供應商出貨是否自動生成 ERP 運單查無。
12. 供應商認列清單（order_items[]）與 QC 認列（shippings[]）是兩份資料，生效的是後者。
13. 關稅是運單 singleton（最多一筆），稿件端卻以 tariffs[] 陣列跨運單彙總，兩處形狀不同。
14. 匯率稿件層鎖定、設定 append-only、前端 fallback 4.6。
15. sensation-api 的 Supplier 與 ERP 供應商同名不同物（前者僅四欄、供 EC 審稿分派）。
16. ERP 後端 repo 不在本機——model、migration、守衛、攤分權威實作全查無。

---

# 第二輪：sens-print-core 後端權威實作（2026-08-11，Miles 確認之 ERP 後端正本）

> Django + DRF，派單與運單實作在 `apps/ec/`。本輪為權威事實，與第一輪前端契約推測不同處以本輪為準（差異 18 條見文末）。

## 核心事實摘要

1. **派單＝`OrderItemAssignment`**（status: active/cancelled、expected_delivery_date、assigned_at、work_order_id 裸 ID 非 FK、order_item FK、supplier FK、admin_user FK）。無獨立單號、無獨立狀態機。
2. **`fixed_shipping_fee` 沒有計算公式**——它與 `shared_shipping_fee` 都不是 DB 欄位，是 serializer 讀取時對 `OrderItemShipping` 的分組加總（CNY 依稿件鎖定匯率換 TWD）。fee_type 的分野是**來源**：人工在稿件頁建的運費紀錄一律 `fixed`（serializer 未開放 fee_type 欄位、吃 model default）；運單認列時系統產生的一律 `shared`（currency=CNY、type=CHINA 寫死）。
3. **運費分攤只發生在運單建立時**：admin 一次帶 N 個運單號＝建 N 筆 Waybill，總運費按各運單號 weight 比例拆、最後一筆吸收餘數。認列明細的 amount 由前端算好、後端原封不動存（只驗 ≥0，不驗加總＝運單運費、不重算）。
4. **關稅攤回＝讀取時即時算、不落庫**：`tariff_amount × 該筆 shipping.weight ÷ 該運單所有 shared shipping 的 weight 加總`；只攤 shared、fixed 與未掛運單者跳過；一稿件可累加多張運單的關稅。
5. **認列（pending → confirmed）後端不鎖**：PUT 只收 `shippings` 一個欄位、已 confirmed 再 PUT 不擋（有測試明文保證）、無回退路徑；每次 PUT 把舊 shippings **硬刪重建**（id 重置、備註 GenericRelation 消失）；只寫 status，不動 china_status、不觸發工單重算、不回推中國平台。運單其他欄位（carrier／ship_date／shipping_fee／weight 等）建立後**無任何 API 可改**。
6. **china_status 零轉換守衛**（任意值互跳皆放行；13 值與 wiki 一致）。**唯一自動轉換＝指派供應商時 not_sent／delivered → sent（指派即發稿）**，並補 producing_cn_at 時間戳。「出貨自動轉分批出貨中」查無——`partial_shipping` 只被工單狀態推算讀取，無任何寫入點；`is_partial_shipment` 零行為分支。
7. **供應商端實際端點**：`POST /api/v1/ec/waybill`（強制 pending、寫 D01 歷史、不建 tariff 不改 china_status）、`POST /api/v1/ec/order-item/{id}/quotation`、`PUT /api/v1/ec/order-item/{id}`（actor 記中國供應商、不回推避免迴圈）。
8. **一張運單限單一供應商靠 FK 結構保證，但不驗稿件歸屬**——跨供應商稿件可被掛上，後端不擋。
9. **重量差異概念查無**：無申報 vs 實秤欄位對、無一致性驗證、無差異留存（前端的 ±kg 提示為純前端試算）。
10. **匯率雙軌（刻意）**：稿件 exchange_rate 於首次建立時鎖定（其後無 API 可改）；運單層 shipping_fee_twd/cny 用當前浮動匯率（get_current，只增不改、fallback 4.60）。
11. **毛利率**（serializer 即時算，%）＝（商品總價 − 報價成本×匯率 − 全部運費（shared＋fixed）− 關稅攤回）÷ 商品總價；報價有效數量取 production_quantity 優先。成本欄位受 `view_outsource_cost` 權限遮蔽（無權限回 null）。
12. **關稅單據**：Waybill OneToOne（一張運單最多一筆）、tax_bill_no 全域 unique＋跨運單查重端點、金額 PositiveInteger（NTD 無小數）。
13. **改價**走版本鏈（舊筆 is_active=False＋新建），前提稿件已有 cn_order_id（未派單回 422）。

## 與前端契約推測不同之處（18 條，以本輪為準）

供應商端點路徑三條全異（/api/v1/ec/*）；admin 建運單一次建 N 筆回陣列；PUT 只吃 shippings；confirmed 不擋不回退、硬刪重建；shared/fixed 非 DB 欄位、fixed 無公式；稿件端運費紀錄 serializer 無 received_quantity／fee_type／waybill；tariff 無 GET、另有 tax_bill_no 查重端點；匯率另有 history 端點、只增不改；china_status 零守衛、唯一自動轉換＝指派即發稿；出貨不自動轉分批出貨中；運單不驗稿件歸屬；同一筆錢兩種匯率（運單層浮動、明細層鎖定）；成本欄位權限遮蔽回 null；改價版本鏈。

（完整逐題證據與檔案行號見本次盤點對話紀錄；本檔為 wiki 回寫（派單、貨運單兩卡 as-is 註記）的依據。）

## 補充查證（2026-08-11，第三輪稽核後）

供應商端建運單 `POST /api/v1/ec/waybill` 的 `WaybillCreateSerializer`（`apps/ec/v1/serializers/waybill_serializers.py`）欄位為**單數**：`waybill_no`／`package_count`／`weight` 各一——供應商端每次呼叫建一張運單（一組號碼）；前端出貨表單的多組號碼由前端逐組送出產生多張。管理端與供應商端合併結論：**一張貨運單對一組運單號碼，兩端皆成立**（第一輪 § 九-11「供應商出貨是否自動生成 ERP 運單」的查無就此關閉——供應商端點即直接建 Waybill，無另一層生成）。
