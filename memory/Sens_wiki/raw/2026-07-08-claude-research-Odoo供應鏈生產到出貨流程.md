---
type: raw
status: raw
created-at: 2026-07-08
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
  - 工單
  - 生產任務
  - QC
  - 出貨
topic-tag:
  - Odoo
  - 供應鏈
  - 廠間移轉
  - 揀貨
  - 出貨
  - 報工
  - 品檢
  - 路線規則
related-vault:
  - "[[工單狀態]]"
  - "[[生產任務狀態]]"
  - "[[QC 狀態]]"
  - "[[出貨單狀態]]"
  - "[[2026-06-14-claude-research-Odoo製造與庫存模組]]"
raw-source-link: https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp.html
---

# Odoo 18.0 供應鏈端到端實作方式（生產 → 報工 → 廠間移轉 → 品檢 → 揀貨 → 出貨）

## 研究範圍與方法

Miles 指派研究（2026-07-08）：生產關細部設計（生產 > 報工 > 成品/半成品廠間移轉 > 品檢 > 揀貨 > 出貨）前，調研 Odoo 的實作方式作為設計參考。

- **方法**：六個並行調研 agent，各負責一個領域（庫存基礎概念 / 路線與廠間移轉 / 製造 / 報工 / 品質 / 揀貨出貨），限用 `https://www.odoo.com/documentation/18.0/` 官方文件（WebFetch），逐段附出處，查無即標註。
- **與既有卡分工**：[[2026-06-14-claude-research-Odoo製造與庫存模組]] 已含 17.0 原始碼級資料結構（mrp.production / stock.move / stock.quant 逐欄位與計算式、WIP 建模、OEE 公式），本卡不重複；本卡補齊該卡未涵蓋的**端到端流程視角**：路線規則機制、廠間移轉、品檢與庫存單據整合、揀貨出貨、以及 18.0 使用者文件的操作流程。資料結構深度查證需求請回頭看該卡。
- **注意**：官方「使用者文件」絕大多數頁面不揭露技術模型名（Python model），本卡技術模型名僅列文件實際出現者；未出現者標明。

## 一、三大基礎機制（貫穿六段流程的架構骨幹）

Odoo 供應鏈的所有流程共用同一組原語（primitive），六段流程都是這三個機制的組合：

### 1. 位置（Location）——一切庫存狀態都是「貨在哪個位置」

- 位置分七種類型：Vendor Location（供應商）、View（純組織層級，不可存貨）、Internal Location（內部實際儲位，計入估值）、Customer Location（客戶）、Inventory Loss（盤損/報廢抵銷）、Production（生產區，元件消耗與產出）、Transit Location（在途）。
- 供應商、客戶、生產區、報廢區都建模成「位置」——收貨＝從供應商位置移入內部位置；出貨＝內部位置移到客戶位置；製造吃料＝儲位移到生產位置；報廢＝移到報廢虛擬位置；廠間在途＝Transit 位置。**沒有獨立的「庫存狀態欄位」，狀態就是位置**。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management.html

### 2. 作業類型（Operation Type）——每張移轉單的類別與行為設定

- 預設類型：收貨（receipt）、出貨（delivery）、內部調撥（internal transfer）、製造（manufacturing）、退貨（return）、直運（dropship）等；每型定義預設來源/目的位置、單號前綴（WH/IN、WH/OUT、WH/PICK、WH/PACK 等）。
- 行為設定掛在作業類型層：**保留方式**（At Confirmation 確認即保留 / Manually 手動 / Before scheduled date 排定日前 N 天）、**欠交處理**（Ask / Always / Never 建 backorder）、條碼與硬體整合。收貨類作業不能設保留方式。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/operation_type.html 、https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/shipping_receiving/reservation_methods.html

### 3. 路線與規則（Route / Push-Pull Rule）——單據鏈的自動驅動引擎

- Route 由多條 rule 組成；rule 的組成：Action（`Pull From` / `Push To` / `Pull & Push` / `Buy` / `Manufacture`）＋來源位置＋目的位置＋作業類型＋供應方式（`Take From Stock` / `Trigger Another Rule` / `Take From Stock, if Unavailable, Trigger Another Rule`）。
- **Push**：貨一到某位置就自動推往下一位置（供給導向）。**Pull**：由需求（銷售訂單、補貨規則）從需求位置往回逐段產生移轉單（需求導向）。
- Route 可掛五個層級：產品、產品分類、倉庫、銷售訂單行、包裝。
- **單據鏈串接規則**：後一段移轉單要等前一段驗證（Done）後才變 Ready——多步收貨、多步出貨、廠間移轉全靠這條規則串接。
- 文件出現的技術模型名：`stock.route`、`stock.rule`、`stock.location`。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/use_routes.html

## 二、資料結構（18.0 使用者文件佐證範圍）

| 概念 | 技術模型（文件實際出現） | 佐證頁 |
|------|------------------------|--------|
| 移轉單（收貨/出貨/調撥/揀貨） | `stock.picking` | receipts_delivery_one_step.html |
| 庫存移動明細 | `stock.move` | receipts_delivery_one_step.html |
| 路線 / 規則 / 位置 | `stock.route` / `stock.rule` / `stock.location` | use_routes.html |
| 批次移轉（batch / cluster 共用） | `stock.picking.batch` | picking_methods/batch.html |
| 包裝實例 / 包裝類型 | `stock.quant.package` / `stock.package.type` | configure/package.html |
| 運送方式 | `delivery.carrier` | setup_configuration.html |
| BOM / 製造訂單 / 工單 / 工作中心 / 拆解單 | `mrp.bom` / `mrp.production` / `mrp.workorder` / `mrp.workcenter` / `mrp.unbuild` | bill_configuration.html、one_step_manufacturing.html、using_work_centers.html、unbuild_orders.html |
| 品檢單 | `quality.check` | quality_checks.html |

- 品檢點（QCP）、品質警報、波次揀貨（wave）、報廢（scrap）的模型名在 18.0 使用者文件**未出現**（quality 為企業版模組，原始碼不公開；細節見 [[2026-06-14-claude-research-Odoo製造與庫存模組]] § 查無公開資料）。
- 產品層：Goods / Service / Combo 三類，Goods 才有庫存欄位；追蹤粒度三選一（序號＝一號一件、批號＝一批多件、僅數量）。追蹤與否決定補貨規則、估值、盤點是否可用。出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/configure/type.html

## 三、六段流程逐段實作方式

### 1. 生產（BOM → 製造訂單 → 工單）

- **BOM**：元件行（可指定「在哪道工序消耗」「是否手動確認耗用」）＋工序（Operations，需啟用 Work Orders；每道綁一個工作中心、預估工時；**一道工序專屬一張 BOM 不可共用**）＋副產品（By-Products，可綁產出工序）。BOM type 分「Manufacture this Product」（產 MO）與「Kit」（不產 MO，出貨時直接拆元件行）。
  出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/bill_configuration.html 、advanced_configuration/kit_shipping.html
- **半成品（多層 BOM）**：子層 BOM 巢狀嵌入上層，各層各開自己的 MO；觸發子層 MO 兩法——(a) 官方推薦：對半成品設 min/max 皆 0 的補貨規則（庫存可解除保留重新分配）；(b) MTO＋Manufacture 路線（子層產量綁定該上層 MO）。**子層須完工，上層才能開始**。
  出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/sub_assemblies.html
- **MO 狀態流**：Draft → Confirmed（依 BOM 展開元件移動、成品移動、工單）→ 工單逐張完成 → Produce All → Done。
- **1/2/3 步製造**（倉庫層設定，各倉可不同）：
  - 1 步：只有 MO，元件扣除與成品入庫都在關單時發生，無獨立移轉單。
  - 2 步：MO＋領料單（Pick Components，儲位→製造區）；成品入庫在 MO 內完成、無獨立移轉。
  - 3 步：領料單（WH/PC）＋MO（WH/MO)＋成品入庫單（Store Finished Products，WH/SFP，須獨立驗證）。**半成品/成品的「入庫」在 3 步制下是顯式單據**，中間位置存量即在製品。
  出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html（及 one_step / two_step 同目錄頁）
- **例外處理**：
  - 報廢（Scrap）：移到 Virtual Locations/Scrap 虛擬位置；Manufacturing app 報廢成品限 MO Done 後、報廢元件限 Draft/Confirmed；Shop Floor 只能報廢元件；可勾「Replenish Scrapped Quantities」自動補領料。出處：workflows/scrap_manufacturing.html
  - 欠產拆單（Backorder）：實產 < 訂產時，MO 拆為 -001（實產量，關單）與 -002（餘量，續製）。出處：workflows/manufacturing_backorders.html
  - 拆分/合併 MO：Split 拆 -001/-002；Merge 限同產品同 BOM。出處：workflows/split_merge.html
  - 拆解（Unbuild）：成品拆回元件還原入庫。出處：workflows/unbuild_orders.html

### 2. 報工（Shop Floor）

Odoo 沒有獨立「報工單」實體——**報工內建在工單上**，由 Shop Floor（平板介面）操作：

- **作業員身分**：左側 operator panel，Add Operator 選員工即啟用（文件未提 PIN 驗證）；**多員工可同做一張工單**、一員工可同時做多張工單，各自計時。
- **雙層計時器**：工單層（collective，所有作業員在該工單的累計總時間）＋作業員層（individual，本次 session 個人投入時間）。點工單標題即開始計時並自動開啟作業指導。
- **產出登記（Register Production）**：登記產出數量並指定批號/序號；「# Units」鈕一鍵登記全數。登記量少於訂產量→走 backorder 拆單。
- **步驟制**：工單內含依序完成的步驟卡（含內嵌品檢步驟），中間工單按 Mark as Done、末工單按 Close Production。
- **工時回寫成本**：工單「Real Duration」＝Shop Floor 計時＋工單表單手input＋MO 上登記三來源加總；工序成本＝工作中心時薪 × 實際工時；工作中心費率分「per workcenter」（機台）與「per employee」（人工，實際成本用員工個人時薪覆蓋）。MO Cost（BOM 預估）與 Real Cost（實際）雙欄對照，完工後回寫產品平均製造成本。
- **KPI**：OEE（完全生產時間占比；損失分類：設備故障 / 降速 / 缺料）；Production Analysis 報表 20+ 指標（產出率、單位成本、工序時長等）。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/shop_floor/shop_floor_overview.html 、shop_floor/shop_floor_tracking.html 、basic_setup/mo_costs.html 、reporting/oee.html 、reporting/production_analysis.html

### 3. 成品/半成品廠間移轉（Resupply from another warehouse）

- **設定**：啟用 Storage Locations → 接收倉的倉庫表單勾「Resupply From」選供應倉（可多選）→ 系統自動生成路線「X: Supply Product from Y」（X＝接收倉、Y＝供應倉）→ 在產品上勾此路線。
- **觸發**：此路線須搭配補貨規則（reordering rule：接收倉庫存低於 min 自動觸發）或 MTO 才會啟動；補貨規則的 Route 欄決定產單型別——Buy→採購單、Manufacture→製造單、Resupply→**廠間調撥**。
- **產生的單據鏈（核心設計）**：觸發後自動建**兩張移轉單**——
  1. 供應倉的**出貨單**（供應倉儲位 → `Physical Locations/Inter-warehouse transit` 在途位置）
  2. 接收倉的**收貨單**（在途位置 → 接收倉儲位）
  在途貨物停在 Inter-warehouse transit 位置；後單等前單驗證後才 Ready。**兩張單各自獨立驗證＝兩端各自確認交接，帳實同步**。
- **手動內部調撥**：18.0 文件無專屬操作頁（列入查無清單）；internal transfer 僅以多步流程的中間段形式被文件描述。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/resupply_warehouses.html 、replenishment/reordering_rules.html 、replenishment/mto.html

### 4. 品檢（Quality）

- **品檢點（QCP）**：可掛四種作業——製造（可再鎖定特定工單工序）、出貨、收貨、內部調撥。兩軸設定：
  - **Control Per（粒度）**：Operation（整張單一檢）/ Product（每唯一產品一檢）/ Quantity（抽驗百分比）
  - **Control Frequency（頻率）**：All（每次）/ Randomly（每 N% 作業）/ Periodically（每 N 天/週/月）
- **品檢單型別**：Instructions / Pass-Fail / Measure（設標準值 Norm＋容差區間，超出自動判 fail）/ Take a Picture / Register Production / Worksheet / Spreadsheet。結果狀態文件僅呈現 Pass / Fail 兩值。
- **與工單整合**：QCP 掛製造＋指定工序 → 品檢以「工單步驟」內嵌呈現，作業員在 Shop Floor 逐步完成；MO 整張層級的品檢則以 Quality Checks 按鈕呈現。
- **與庫存單據整合（關鍵設計）**：品檢失敗**不硬性卡關過帳**——流程是 Fail → 輸入失敗數量 → 選 failure location（不良品位置，QCP 的 Control Per 須為 Quantity 才可設）→ **照樣驗證過帳**，失敗品分流到不良品位置、合格品進正常儲位。failure location 是分流不是報廢（文件明示未連結 scrap 功能）。
- **品質警報（Quality Alert）**：Fail 後可一鍵開警報；欄位含根因（Root Cause）、優先度、矯正/預防措施；看板管理，stage 可自訂。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_control_points.html 、quality_checks.html 、quality_alerts.html 、failure_locations.html 、quality_check_types/measure_check.html（等四型別頁）

### 5. 揀貨（Picking）

- **出貨步數**（倉庫層設定 Outgoing Shipments）：
  - 1 步（Ship）：儲位 → 客戶，一張 WH/OUT。
  - 2 步（Pick → Ship）：揀貨單 WH/PICK（儲位 → WH/Output）＋出貨單 WH/OUT（WH/Output → 客戶）。
  - 3 步（Pick → Pack → Ship）：揀貨（儲位 → WH/Packing Zone）＋包裝（Packing Zone → WH/Output）＋出貨（Output → 客戶），三張鏈式移轉單。
- **庫存保留**：作業類型層設定——確認即保留 / 手動（Check Availability）/ 排定日前 N 天（優先單可更早）。
- **揀貨建議（removal strategy）**：FIFO（依批號入庫日）/ LIFO / FEFO（依 removal date，需啟用效期）/ Closest Location（依儲位命名序）/ Least Packages（開最少包裝）。設定在產品分類或位置，分類的 Force Removal Strategy 優先。
- **批次揀貨三模式**（需啟用 Batch, Wave & Cluster Transfers）：
  - **Batch**：多張單合併一趟揀，揀完回 output 區再分揀；可依聯絡人/承運商/目的國/位置自動分批。
  - **Wave**：先把單「拆分」（依儲位/產品/時程）再重組成波次——適合分區大倉與出貨截止時程協調。
  - **Cluster**：揀貨當下直接分入各訂單專屬容器（可重複使用的 package），免事後分揀。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/delivery_three_steps.html 、picking_methods/batch.html 、picking_methods/wave.html 、picking_methods/cluster.html 、reservation_methods.html 、removal_strategies.html

### 6. 出貨（Delivery / Shipping）

- **包裝**：Package（實體容器實例，有編號可追蹤位置）與 Package Type（規格範本：尺寸/空重/最大載重，供運費計算）分離；Package Use 分拋棄式（出貨）與可重複（倉內/cluster 揀貨）。「Put in Pack」把一張出貨單拆多包裝；可部分數量建 backorder 分批出。
- **運送方式**：`delivery.carrier` 三類——固定價 / 規則計價（重量/地區）/ 第三方承運商即時費率（FedEx/UPS/DHL 等 connector）。
- **出貨標籤**：指定第三方承運商後驗證出貨單即自動產生追蹤號＋PDF 標籤；多包裝＝一包一標籤；2/3 步制可設在揀貨/包裝階段先印。
- 出處：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html 、shipping_receiving/setup_configuration.html 、setup_configuration/labels.html 、setup_configuration/multipack.html

## 四、業務情境推演（以官方機制串接）

**情境 1：半成品在 A 廠生產、移轉 B 廠組裝出貨**
B 廠設「Resupply From A 廠」；半成品掛路線「B: Supply Product from A」＋B 廠補貨規則（或 MTO）。成品訂單確認 → B 廠成品 MO 展開 → 半成品缺料觸發廠間補貨 → A 廠自動生成出貨單（A 儲位→在途位置）、B 廠自動生成收貨單（在途→B 儲位）→ A 廠半成品 MO 完工入庫 → A 出貨驗證 → B 收貨驗證（B 端可掛收貨 QCP 品檢）→ B 廠成品 MO 領料開工。每段單據等前段 Done 才 Ready，缺一段就斷鏈可查。

**情境 2：部分完工、部分出貨**
MO 訂 100 實產 60 → Register Production 60 → 建 backorder：MO-001（60，Done）＋MO-002（40，續製）。出貨單保留到 60 → 驗證時選建欠交出貨單，60 先出、40 隨 MO-002 完工後補出。生產與出貨兩層 backorder 機制同構（拆單、原單號加 -001/-002）。

**情境 3：收貨品檢不合格分流**
收貨作業掛 QCP（Control Per=Quantity 抽驗 20%）→ 收貨單出現品檢 → 抽驗 fail → 輸入失敗數量、選 failure location → 照樣驗證收貨：合格品入正常儲位、不良品進不良品位置（庫存可查）→ 開品質警報記根因、走矯正措施看板 → 不良品後續由人工決定退貨或報廢（文件未提供自動串接）。

## 五、Odoo 設計原則總結（架構思想層）

1. **單一原語**：一切庫存變化＝「位置間的移動」；供應商/客戶/生產區/報廢區/在途都是位置。狀態即位置，不另設庫存狀態欄。
2. **單據鏈由規則驅動**：流程步數（1/2/3 步收貨、出貨、製造）是倉庫層設定，由 route/rule 自動生成鏈式單據；前段 Done → 後段 Ready，一致的串接語意貫穿收貨、出貨、製造、廠間移轉。
3. **廠間移轉＝兩張單＋在途位置**：兩端各自驗證交接，非一張單改狀態。
4. **報工＝工時事實紀錄，KPI 全部衍生**：先記乾淨的起訖與產出事實，成本/OEE/報表全由事實表 computed，不各自為政。
5. **品檢分流不卡關**：品檢失敗導向不良品位置照樣過帳，用位置隔離取代流程凍結；品質問題另走警報（矯正措施）軌道。
6. **例外處理同構**：生產欠產與出貨欠交都是「拆單保留原單號脈絡」；報廢統一走虛擬位置。

## 六、對感官 ERP 生產關規劃的對照點（研究員主觀對照，非 Odoo 事實）

- **揀貨階段新增**（2026-07-08 pre-check 議題）：Odoo 揀貨是「出貨鏈的一段移轉單」而非出貨單的子狀態，與 [[出貨單狀態]]「打包不設狀態」的既有決策對撞時可參考——Odoo 選擇「多一張單」而不是「多一個狀態」。
- **QC 相依性**（同 pre-check 議題）：Odoo 品檢不阻擋過帳、用 failure location 分流，與感官「需品檢才可製作」的工序相依規則（[[工序相依性規則]]）是兩種哲學：流程凍結 vs 位置隔離。
- **報工體系**：Odoo 無獨立報工單，報工内建於工單（計時＋Register Production）；感官 [[報工紀錄]] 若走獨立實體，Odoo 的「事實表 + KPI 全衍生」原則仍適用。
- **廠間移轉**：「兩張單＋在途位置」與中國線三實體分離（派單/貨運單/出貨單）方向一致，可佐證「移轉拆兩端各自確認」的設計。

## 七、來源 URL 總表

共同前綴 `https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/`：

- 總覽：`inventory.html`、`manufacturing.html`、`quality.html`、`inventory/shipping_receiving.html`
- 產品與追蹤：`inventory/product_management/configure/type.html`、`configure.html`、`product_tracking.html`、`product_tracking/serial_numbers.html`、`configure/package.html`
- 倉庫位置與作業類型：`inventory/warehouses_storage/inventory_management.html`、`inventory_management/operation_type.html`、`inventory_management/use_locations.html`
- 路線與補貨：`inventory/shipping_receiving/daily_operations/use_routes.html`、`inventory/warehouses_storage/replenishment.html`、`replenishment/reordering_rules.html`、`replenishment/mto.html`、`replenishment/resupply_warehouses.html`、`replenishment/lead_times.html`
- 收發貨流程：`inventory/shipping_receiving/daily_operations.html`、`daily_operations/receipts_delivery_one_step.html`、`receipts_delivery_two_steps.html`、`receipts_three_steps.html`、`delivery_three_steps.html`
- 揀貨與保留：`inventory/shipping_receiving/picking_methods/batch.html`、`wave.html`、`cluster.html`、`reservation_methods.html`（＋`at_confirmation.html`、`before_scheduled_date.html`）、`removal_strategies.html`（＋ `fifo.html`、`lifo.html`、`fefo.html`、`closest_location.html`、`least_packages.html`）
- 出貨設定：`inventory/shipping_receiving/setup_configuration.html`、`setup_configuration/labels.html`、`setup_configuration/multipack.html`
- 製造：`manufacturing/basic_setup/bill_configuration.html`、`one_step_manufacturing.html`、`two_step_manufacturing.html`、`three_step_manufacturing.html`、`mo_costs.html`、`configure_manufacturing_product.html`
- 製造進階與工作流：`manufacturing/advanced_configuration/sub_assemblies.html`、`kit_shipping.html`、`using_work_centers.html`、`work_order_dependencies.html`、`manufacturing/workflows/scrap_manufacturing.html`、`manufacturing_backorders.html`、`split_merge.html`、`unbuild_orders.html`、`byproducts.html`
- 報工與報表：`manufacturing/shop_floor/shop_floor_overview.html`、`shop_floor_tracking.html`、`manufacturing/reporting/oee.html`、`production_analysis.html`
- 品質：`quality/quality_management/quality_control_points.html`、`quality_checks.html`、`quality_alerts.html`、`failure_locations.html`、`quality/quality_check_types/instructions_check.html`、`pass_fail_check.html`、`measure_check.html`、`picture_check.html`

## 八、查無 / 官方文件未涵蓋（誠實清單，禁編造補齊）

1. **技術模型名**：18.0 使用者文件僅零星揭露（§ 二表列者）；QCP、品質警報、wave、scrap 的模型名未出現。原始碼級欄位見 [[2026-06-14-claude-research-Odoo製造與庫存模組]]（17.0）。
2. **品檢單完整狀態機**：文件只呈現 Pass / Fail 結果，未列中間狀態列舉。
3. **品檢 Fail 是否可硬性阻擋過帳**：文件描述為分流後照樣驗證，未載明任何強制卡關設定。
4. **工單內品檢失敗是否阻擋工單推進**：Shop Floor 文件未說明。
5. **手動 internal transfer 專屬操作頁**：18.0 文件不存在此頁；`stock_warehouses.html`（多倉虛擬倉出貨）亦為 404。
6. **多員工同工單時人工成本的精確聚合公式**、Setup/Cleanup Time 是否計入成本：文件僅概念式描述。
7. **scrap 是否扣減 MO 產出量**、**副產品成本分攤方法**：文件明示未說明。
8. **OEE 三因子（可用率×效能×良率）公式**：文件只講「完全生產時間占比」與損失分類，未用教科書三因子式。
9. **作業員身分驗證（PIN / 出勤連動）**：Shop Floor 文件未涵蓋。
10. **backorder 獨立說明頁（庫存側）**：僅散見於 batch / multipack 頁片段。
11. 未展開的既存頁：MPS 主生產排程、subcontracting（委外）三頁、第三方承運商各整合頁、putaway / storage categories / cross-docking、estimation（估值）各頁。

## 第一輪初步分析（Claude 寫）

- 觀察 1：本卡六段流程與 2026-07-08 pre-check 的「生產階段流程重整」三個待裁決衝突（揀貨階段 / QC 相依性 / 報工體系）直接對應，§ 六已逐點對照；可作為該議題設計討論的參照系。
- 觀察 2：Odoo「廠間移轉＝兩張單＋在途位置」與 [[派單狀態]] 的中國線三實體分離同構，可佐證既有方向。
- 觀察 3：與 [[2026-06-14-claude-research-Odoo製造與庫存模組]] 合計已構成 Odoo 完整參照（原始碼資料結構＋端到端流程），同主題 raw 已達 2 張；若再加第三張建議轉 insight。
- 候選相關卡：[[工單狀態]] / [[生產任務狀態]] / [[QC 狀態]] / [[出貨單狀態]] / [[工序相依性規則]] / [[報工規則]]
- 候選 OQ 候補：無（pre-check 已列 OQ 候選 9 項，本卡不重複開）
- 候選升級路徑：insight（生產階段流程重整設計討論收斂後，與 06-14 卡合併提煉）/ 或直接作為 explore 階段參考文件不升級

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）
- [ ] 是否累積成 insight（≥ 3 張同主題後觸發 vault-insight）

## 精練去處（Mode B 完成後填）
