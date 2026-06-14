---
type: raw
status: raw
created-at: 2026-06-14
source: claude-research
captured-by: claude-on-task
module:
  - 工單
  - 生產任務
  - 工序主檔
  - QC
topic-tag:
  - MES
  - Odoo
  - 開源
  - MRP
  - 工作中心
  - OEE
  - 庫存批號
  - 齊套
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[QC]]"
raw-source-link: https://github.com/odoo/odoo/tree/17.0/addons/mrp/models
attached-files: []
---

# Odoo Manufacturing (MRP / Shop Floor) — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：通用 ERP-MES（開源，資料模型公開於 GitHub odoo/odoo addons/mrp 與 addons/stock）

## 系統定位概述

Odoo Manufacturing 是開源 ERP 的製造模組（addons/mrp），以製造單（mrp.production）為核心，向上掛物料清單（mrp.bom）與工藝（mrp.routing.workcenter），向下展開工單（mrp.workorder）並由 Shop Floor App 提供工作站平板介面執行回報。庫存以 stock.move／stock.quant／stock.lot 三層建模，透過虛擬「生產地點（Production location）」吃料與產出，並用一/二/三步製造路線顯式或隱式建模在製品（WIP）。內建有限產能排程（工作中心日曆＋負載）、OEE 報表與折損（scrap）追蹤。原始碼公開，本研究的實體名與欄位名皆取自 odoo/odoo 17.0 分支實際原始碼及官方文件。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### mrp.production（製造單 / Manufacturing Order, MO）

生產執行域的核心單據，代表「生產某產品 N 個」的指令。確認後依 BOM 自動展開元件移動（move_raw_ids）與成品移動（move_finished_ids），並依工藝展開工單。state 流程：draft → confirmed → progress → to_close → done（或 cancel）。

關鍵屬性：name（單號）、product_id → product.product（要生產的產品）、product_qty（計畫產量）、qty_producing（本次正在生產量）、qty_produced（已產出量，computed）、bom_id → mrp.bom、product_uom_id → uom.uom、state（draft/confirmed/progress/to_close/done/cancel）、reservation_state（confirmed/assigned/waiting 備料就緒度）、location_src_id → stock.location（元件來源）、location_dest_id → stock.location（成品入庫）、picking_type_id → stock.picking.type、lot_producing_id → stock.lot（產出批號/序號）、date_start / date_finished / date_deadline、procurement_group_id

關聯：
- 一張製造單 對多 工單（workorder_ids: One2many → mrp.workorder）
- 一張製造單 對多 元件移動（move_raw_ids: One2many → stock.move）
- 一張製造單 對多 成品移動（move_finished_ids: One2many → stock.move）
- 一張製造單 對多 副產品移動（move_byproduct_ids）
- 多張製造單 對一 物料清單（bom_id: Many2one → mrp.bom）
- 一張製造單 對一 產出批號（lot_producing_id → stock.lot）

### mrp.bom（物料清單 / Bill of Materials）+ mrp.bom.line + mrp.bom.byproduct

產品生產配方範本，定義要消耗哪些元件、各多少量，以及經過哪些工藝。type=normal 為「製造此產品」、type=phantom 為「套件（Kit）出貨時直接拆元件、不產中間品」。

關鍵屬性：product_tmpl_id → product.template（要生產的產品，required）、product_id → product.product（限定變體時才填）、product_qty（此 BOM 的基準產量）、type（normal=Manufacture this product / phantom=Kit）、code、product_uom_id → uom.uom、bom_line_ids（元件行）、operation_ids（工藝步驟）、byproduct_ids（副產品）、mrp.bom.line: product_id, product_qty, operation_id（在哪道工序消耗）、mrp.bom.byproduct: product_id, product_qty, cost_share（成本分攤百分比）

關聯：
- 一張物料清單 對多 元件行（bom_line_ids → mrp.bom.line）
- 一張物料清單 對多 工藝（operation_ids → mrp.routing.workcenter）
- 一張物料清單 對多 副產品（byproduct_ids → mrp.bom.byproduct）
- 一條元件行 對一 消耗工序（operation_id → mrp.routing.workcenter）

### mrp.routing.workcenter（工藝作業 / Operation）

BOM 上的一道工序，定義在哪個工作中心做、標準工時如何取得、附帶哪些作業指導書。支援工序間相依（blocked_by_operation_ids / needed_by_operation_ids），對排程的工序順序有意義。

關鍵屬性：name（工序名，required）、workcenter_id → mrp.workcenter、bom_id → mrp.bom、sequence（順序，default 100）、time_mode（manual / 依實績自動計算）、time_cycle_manual（手動工時，分鐘，default 60）、time_cycle（最終採用工時，computed）、time_mode_batch（自動計算取最近 N 張工單，default 10）、worksheet_type（PDF / Google Slide / Text）+ worksheet、blocked_by_operation_ids / needed_by_operation_ids（工序相依）

關聯：
- 多道工藝 對一 工作中心（workcenter_id → mrp.workcenter）
- 多道工藝 對一 物料清單（bom_id → mrp.bom）
- 一道工藝 對多 後續產生的工單（落單時實例化為 mrp.workorder）
- 工藝間多對多相依（blocked_by / needed_by operation_ids）

### mrp.workorder（工單 / Work Order）

製造單在某一道工藝上的執行實例，綁定工作中心。是 Shop Floor 平板介面的操作對象，記錄起訖時間、實際工時、產出量、品檢。state：pending → waiting → ready → progress → done（或 cancel）。實際工時來自 time_ids 的工時稼動紀錄加總。

關鍵屬性：name、production_id → mrp.production、workcenter_id → mrp.workcenter、operation_id → mrp.routing.workcenter、product_id（related 製造單）、qty_production（本工單對應的 MO 產量）、qty_produced（本工單已完成量）、qty_producing / qty_remaining、state（pending/waiting/ready/progress/done/cancel）、date_start / date_finished（計畫/實際起訖）、duration_expected（計畫工時，分鐘）、duration（實際工時，由 time_ids 加總）、duration_percent（與計畫偏差%）、time_ids → mrp.workcenter.productivity、costs_hour（套用的時薪成本）、leave_id → resource.calendar.leaves（占用工作中心日曆時段）

關聯：
- 多張工單 對一 製造單（production_id → mrp.production）
- 多張工單 對一 工作中心（workcenter_id → mrp.workcenter）
- 多張工單 對一 工藝（operation_id → mrp.routing.workcenter）
- 一張工單 對多 工時稼動紀錄（time_ids → mrp.workcenter.productivity）

### mrp.workcenter（工作中心 / Work Center）+ mrp.workcenter.productivity（工時稼動紀錄）

產能與排程的資源主檔，掛資源日曆（班表）、效率、產能、時薪成本、整備/清機時間。內建 OEE 與負載 computed 欄位。每段工時透過 mrp.workcenter.productivity 紀錄起訖與損失類別（loss_id），是 OEE 與折損分析的事實來源。

關鍵屬性：name（related resource_id.name）、resource_id / resource_calendar_id → resource.calendar（班表日曆）、time_efficiency（時間效率%，default 100）、default_capacity（可並行件數，default 1.0）、costs_hour（時薪處理成本）、time_start（整備時間，分鐘）/ time_stop（清機時間，分鐘）、oee（computed = productive_time × 100 / (productive_time + blocked_time)）、oee_target（default 90）、performance（已完工單 計畫工時/實際工時 比，computed）、workcenter_load（pending/ready/progress 工單計畫工時總和，computed）、blocked_time / productive_time（近一月，computed）、working_state（normal/blocked/done）、alternative_workcenter_ids（替代工作中心，多對多）、capacity_ids → mrp.workcenter.capacity（依產品的產能）、mrp.workcenter.productivity: workcenter_id, workorder_id, loss_id → mrp.workcenter.productivity.loss, loss_type, date_start, date_end, duration（computed 依日曆換算）, user_id

關聯：
- 一個工作中心 對多 工單（order_ids → mrp.workorder）
- 一個工作中心 對多 工藝路線（routing_line_ids → mrp.routing.workcenter）
- 一個工作中心 對多 工時稼動紀錄（→ mrp.workcenter.productivity）
- 一個工作中心 對一 資源日曆（resource_calendar_id → resource.calendar）
- 一筆工時稼動紀錄 對一 損失類別（loss_id → mrp.workcenter.productivity.loss）

### stock.move（庫存移動）+ stock.move.line

庫存異動的計畫/執行單位。mrp 模組為其加上製造關聯欄位以區分吃料與產出：raw_material_production_id（元件消耗，由來源地點 → 生產地點）vs production_id（成品產出，由生產地點 → 成品地點）。unit_factor 把元件用量依生產進度等比縮放，是 WIP 部分完工建模的關鍵。

關鍵屬性：product_id / product_uom_qty / quantity、location_id（來源）/ location_dest_id（目的）、state（draft/confirmed/assigned/done…）、raw_material_production_id → mrp.production（元件消耗）、production_id → mrp.production（成品產出）、workorder_id → mrp.workorder、bom_line_id → mrp.bom.line、byproduct_id、operation_id（哪道工序消耗）、unit_factor（= product_uom_qty / ((mo.product_qty − mo.qty_produced) or 1)）、should_consume_qty（= (mo.qty_producing − mo.qty_produced) × unit_factor）、manual_consumption（是否手動回報消耗）

關聯：
- 多筆元件移動 對一 製造單（raw_material_production_id → mrp.production）
- 多筆成品移動 對一 製造單（production_id → mrp.production）
- 多筆移動 對一 工單（workorder_id → mrp.workorder）
- 一筆移動 對多 明細行（stock.move.line，綁定批號與實際數量）
- 一筆元件移動 對一 BOM 行（bom_line_id → mrp.bom.line）

### stock.quant（庫存量子）+ stock.lot（批號/序號）

庫存帳的最小事實單位＝「產品＋地點＋批號」的在手量。quantity 為實際在手、reserved_quantity 為已被預留、available_quantity = quantity − reserved。製造的吃料會在來源地點減量、在虛擬生產地點增減；成品產出在成品地點增量。stock.lot 提供批號/序號級追溯。

關鍵屬性：product_id → product.product（required）、location_id → stock.location（required）、lot_id → stock.lot（批號/序號）、package_id → stock.quant.package、owner_id → res.partner（寄售第三方）、quantity（實際在手，readonly）、reserved_quantity（已預留，readonly）、available_quantity（computed = quantity − reserved_quantity）、inventory_quantity / inventory_diff_quantity（盤點用）、in_date（入庫日，供 FIFO/FEFO）

關聯：
- 一個量子 對一 產品×地點×批號（product_id + location_id + lot_id 唯一決定）
- 多個量子 對一 批號（lot_id → stock.lot）
- 量子的歷史 對多 stock.move（透過移動更新在手量）

### stock.scrap（報廢 / 折損）

記錄不良品/折損，將指定數量移到報廢虛擬地點（scrap location）。mrp 模組加上 production_id 與 workorder_id 把折損掛到具體製造單/工單，並依該料是元件或成品自動決定來源地點，達成折損可追溯到生產批次。是 OEE 品質維度與折損率 KPI 的來源。

關鍵屬性：product_id / scrap_qty、location_id（來源）/ scrap_location_id（報廢虛擬地點）、lot_id → stock.lot、production_id → mrp.production、workorder_id → mrp.workorder、product_is_kit / bom_id（套件用）、origin（自動帶入製造單號）

關聯：
- 多筆報廢 對一 製造單（production_id → mrp.production）
- 多筆報廢 對一 工單（workorder_id → mrp.workorder）
- 一筆報廢 對一 報廢地點（scrap_location_id → stock.location，type=inventory loss）

### quality.check / quality.point（品質檢查，enterprise 模組）

品質管理模組（Odoo 企業版 quality 模組，非社群版 addons/mrp）。quality.point 定義在哪個產品/作業型別/工序上要做哪種檢查；quality.check 為實際檢查紀錄，可掛到 production_id / workorder_id / picking_id / lot_id。檢查型別含 Instructions / Take a Picture / Pass-Fail / Measure（量測）；量測型可設容差上下限（norm/tolerance）。註：此模組原始碼未公開於 odoo/odoo 社群版，欄位以官方文件描述為準。

關鍵屬性：quality.point: title, product_ids, picking_type_ids（作業型別）, operation_id（工序）, measure_on, test_type（Instructions/Picture/Pass-Fail/Measure）, norm/tolerance_min/tolerance_max、quality.check: point_id, product_id, production_id, workorder_id, picking_id, lot_id, quality_state（none/pass/fail）, measure, control_date, user_id、quality.alert（品質警報/異常單）: title, product_id, check_id

關聯：
- 一個品質控制點 對多 品質檢查（point_id → quality.point）
- 多筆品質檢查 對一 製造單/工單（production_id / workorder_id）
- 品質檢查 失敗 可觸發 品質警報（quality.alert）

## 二、資料流程

### 製造單從確認到完工入庫（含 BOM 展開與工單）

1. 業務/排程建立 mrp.production，選產品後自動帶出 bom_id
2. 確認（draft → confirmed）：系統依 BOM 產生 move_raw_ids（元件移動）與 move_finished_ids（成品移動），依工藝產生 workorder_ids
3. 備料預留：庫存規則嘗試對元件移動做 reservation，更新 reservation_state（assigned 表示備齊）
4. 落單到現場：工單依 operation 的 sequence 與相依（blocked_by/needed_by）變為 ready
5. 現場執行（Shop Floor）：操作員 Start 工單 → state=progress → 開始計時（寫 mrp.workcenter.productivity 紀錄）
6. 回報產出：Register Production 填入本次完成量 qty_producing，必要時填批號/序號（lot_producing_id）
7. 完成工單：Done/Mark as Done，duration 由 time_ids 加總、qty_produced 累加
8. 關閉製造單：Close Production → 元件移動 done（來源 → 生產地點）、成品移動 done（生產地點 → 成品地點），state=done
9. 庫存帳更新：stock.quant 在各地點自動增減，stock.lot 完成批號追溯鏈

### 三步製造路線的在製品（WIP）顯式建模

1. 倉庫設定 Manufacture = 「Pick components, manufacture and then store products（3 steps）」
2. 系統產生 Pick Components 移轉（WH/PC/...）：把元件從儲位移到「生產前/車間地點」
3. 在生產地點消耗元件、產出成品（mrp.production 吃 raw moves、產 finished moves，經由虛擬 Production location）
4. 系統產生 Store Finished Products 移轉（WH/SFP/...）：把成品從產出地點移到成品儲位
5. 各步 stock.move 完成時對應 stock.quant 增減；停留在中間地點的數量即為在製品（WIP）庫存

### 工時稼動與 OEE 事實累積

1. 操作員在 Shop Floor 選工單並 Start，建立 mrp.workcenter.productivity（loss_type=productive、date_start）
2. 暫停或設備阻塞時，操作員選損失原因（loss_id → mrp.workcenter.productivity.loss），記為對應 loss_type（availability/performance/quality）
3. Done 時寫 date_end，duration 依工作中心日曆換算
4. mrp.workcenter 彙總近一月 productive_time 與 blocked_time
5. oee 自動計算 = productive_time × 100 / (productive_time + blocked_time)，與 oee_target 比較
6. performance 由已完工單的 計畫工時/實際工時 比計算；workcenter_load 彙總待辦工單計畫工時供負載視圖

### 折損（不良品）回報與追溯

1. 現場發現不良：在 Shop Floor 工單選單（⋮）→ Scrap，或建立 stock.scrap
2. 填報廢數量、批號；系統依該料為元件或成品自動帶 production_id / raw_material_production_id 與來源地點
3. stock.move 把數量移到報廢虛擬地點（scrap location，type=inventory loss）
4. 折損掛回製造單/工單，供品質維度 OEE 與折損率報表彙總

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| 製造單與工單執行 | 製造單（MO）建立/確認/取消/關閉、BOM 自動展開元件與工藝、工單依工藝落單與排序（含工序相依 blocked_by/needed_by）、Shop Floor 平板/桌機工作站介面執行工單、Register Production 產出回報（含批號/序號）、Mark as Done / Close Production、Unbuild（拆解，mrp.unbuild） |
| 物料清單與工藝 | 多階 BOM（含 phantom Kit 套件）、副產品（by-product）與成本分攤、工藝路線（routing operation）與標準工時（手動或依實績自動計算）、作業指導書（PDF/Google Slide/Text worksheet）、產品變體對應工藝 |
| 產能與排程 | 工作中心主檔（日曆、效率、產能、整備/清機時間、時薪）、工作中心負載視圖（workcenter_load / Planning by Workcenter）、Gantt / 行事曆排程視圖、有限產能排程（需開啟，預設為無限產能依前置時間排）、替代工作中心、主生產排程（MPS，mrp_mps 模組：預測＋訂單＋庫存→計畫單）、frePPLe 進階約束排程（第三方整合） |
| 庫存與在製品 | 一/二/三步製造路線（WIP 顯式或隱式）、元件預留（reservation）與備料就緒度、批號/序號追溯（stock.lot、追溯報表）、虛擬生產地點吃料/產出、盤點（inventory adjustment）、移除策略 FIFO/LIFO/FEFO |
| 品質與折損 | 品質控制點與檢查（Instructions/Picture/Pass-Fail/Measure，enterprise quality 模組）、量測容差上下限判定、品質警報/異常單（quality.alert）、報廢/折損（stock.scrap）掛製造單與工單 |
| 報表與管理層 KPI | OEE 報表（工作中心稼動）、損失分析（availability/performance/quality 三類 loss_type）、折損/報廢分析、生產分析（production analysis）、工時與成本分析、前置時間報表 |

## 四、庫存處理（Miles 重點關注）

Odoo 以三層建模庫存，皆有公開原始碼（addons/stock）：(1) stock.quant 是庫存帳最小事實＝「產品＋地點＋批號」的在手量，欄位 quantity（實際在手）、reserved_quantity（已預留）、available_quantity（= quantity − reserved，computed）；(2) stock.move / stock.move.line 是異動單位，記錄從 location_id 到 location_dest_id 的搬移；(3) stock.lot 提供批號/序號追溯。製造的物料流動靠「虛擬地點」實現：元件透過 raw_material_production_id 標記的 stock.move 從來源儲位流向「生產地點（Production location，虛擬）」表示被吃掉，成品透過 production_id 標記的 stock.move 從生產地點流向成品儲位表示產出，兩者數量差即留在生產地點的在製品。在製品（WIP）有兩種建模粒度：在一步製造中 Odoo 不產生顯式移轉、僅在關單時更新庫存（WIP 不顯式可見）；在二/三步製造路線中，元件先經 Pick Components 移轉（WH/PC）進入車間地點、成品產出後再經 Store Finished Products 移轉（WH/SFP）入成品庫，停留在中間地點的數量即為可量化的 WIP 庫存。部分完工的 WIP 用 stock.move.unit_factor（= 移動量 ÷ 剩餘待產量）與 should_consume_qty（= (本次生產量 − 已產量) × unit_factor）等比換算元件應消耗量，使元件消耗隨生產進度增量推進，而非一次性全扣。折損則由 stock.scrap 把不良品移到報廢虛擬地點（type=inventory loss），並掛 production_id / workorder_id 達成損耗對生產批次的追溯。

## 五、排程與產能

產能資源主檔為 mrp.workcenter，掛 resource_calendar_id（班表日曆）、time_efficiency（時間效率%）、default_capacity（可並行件數）、time_start/time_stop（整備/清機時間）、costs_hour（時薪）。工單排程把 duration_expected 依工作中心日曆排入時段，並透過 leave_id（resource.calendar.leaves）占用日曆時段避免重疊；工序間相依由 mrp.routing.workcenter 的 blocked_by_operation_ids / needed_by_operation_ids 表達。負載與排程能力：mrp.workcenter.workcenter_load（computed）彙總 pending/ready/progress 工單的計畫工時總和，搭配「Planning by Workcenter」視圖與 Gantt/行事曆視圖辨識過載與瓶頸；支援 alternative_workcenter_ids 做替代分流。重要限制：Odoo 預設以無限產能排程（只依前置時間排起訖、不檢查工作中心是否已被占用），需另行啟用有限產能規則才會做產能檢核；更複雜的約束式細排程（constraint-based detailed scheduling）需整合第三方 frePPLe。中期需求面由 MPS（mrp_mps 模組）把預測＋已確認訂單＋現有庫存彙整為每週/每月目標，產生計畫製造/採購單。

## 六、拼版優化（印刷特化）

不適用／無此原生功能。Odoo Manufacturing 是通用離散製造 MRP/MES，無印刷業的拼版（imposition）、併單（gang-run）或排版優化（nesting）能力。BOM/工藝模型只處理「元件用量＋工序工時」，不含版面幾何最佳化或刀模套排。業界做法是由專門的 prepress 軟體（如 Impostrip、Metrix、Insoft）做拼版/併單/裁切優化，再經 API 與 ERP/MIS 整合；Odoo 端僅承接整合後的工單與用料結果，本身不產出拼版方案。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| OEE（整體設備效率） | oee（computed）= productive_time × 100 / (productive_time + blocked_time)，oee_target 預設 90%。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- 庫存三層模型（stock.quant 在手/預留/可用、stock.move 異動、stock.lot 批號）值得對照：感官 ERP 的庫存痛點可借鏡「量子＝產品×地點×批號」的最小事實單位，並以 available = on_hand − reserved 明確區分在手與可用，避免超賣/超派。
- 在製品（WIP）用『虛擬生產地點＋一/二/三步路線』建模：把『領料進車間』與『成品入庫』拆成顯式移轉，停留在中間地點的數量即 WIP。感官若想看見在製半成品庫存，可借鏡此『中間地點顯式化』而非只在工單關閉時一次性結算。
- 部分完工的等比扣料邏輯（unit_factor / should_consume_qty）：元件消耗隨生產進度增量推進，對 MTO 分批投產的物料齊套性與在製品估值很有參考價值，呼應感官既有的齊套性（Kitting）邏輯。
- 工時稼動事實表（mrp.workcenter.productivity）以『起訖＋損失類別』為原子紀錄，OEE/負載/表現皆由此彙總——感官的回溯排程與派工看板可借鏡『先記乾淨的工時事實，KPI 全部 computed 衍生』的設計，避免 KPI 各自為政。
- 損失三分類（availability/performance/quality）給操作員固定下拉選單而非自由填寫，讓停機原因可量化——對感官管理層 KPI 與折損率分析直接可用。
- 工作中心 default_capacity（可並行件數）、time_efficiency、time_start/time_stop（整備/清機）、resource_calendar（班表）四要素是有限產能排程的最小欄位集，感官排程中心可對照是否欄位齊備。
- 工藝相依（blocked_by/needed_by operation_ids）顯式建模工序先後，比單純 sequence 更能表達平行/序列關係，對感官多工序印件排程有參考價值。
- 折損 stock.scrap 強制掛 production_id/workorder_id，使每筆損耗可追溯到生產批次與工序，感官的品檢/折損可借鏡此『折損必綁來源批次』約束。

**不適用 / 不照搬**：
- 拼版/併單/排版優化（imposition / gang-run / nesting）：Odoo 完全無此原生能力，需第三方 prepress 軟體（Impostrip/Metrix/Insoft）。
- 印刷特有的刀模線、壓克力開孔、固定版型套圖等稿件幾何，不在 Odoo 製造模型範疇（屬感官線上編輯器領域）。
- Odoo 為通用離散製造 MRP，預設無印刷業的色彩/紙張/印量階梯報價等行業特化邏輯。
- Odoo 預設無限產能排程，與感官已具備的回溯排程定位不同；有限產能與細排程需額外啟用或整合 frePPLe，非開箱即用。

## 來源（真實查證）

- [odoo/odoo addons/mrp/models 目錄列表（17.0）](https://github.com/odoo/odoo/tree/17.0/addons/mrp/models) — 確認 mrp 模組實際模型檔：mrp_production.py、mrp_bom.py、mrp_routing.py、mrp_workcenter.py、mrp_workorder.py、stock_move.py、stock_quant.py、stock_lot.py、stock_scrap.py、mrp_unbuild.py 等（經 gh api 列出真實檔名）
- [mrp.production 原始碼（Odoo 17.0）](https://github.com/odoo/odoo/blob/17.0/addons/mrp/models/mrp_production.py) — 取得 product_id/product_qty/qty_produced/qty_producing/bom_id/workorder_ids/move_raw_ids/move_finished_ids/location_src_id/location_dest_id/picking_type_id/lot_producing_id/reservation_state 等欄位與 state 選項（draft/confirmed/progress/to_close/done/cancel）
- [mrp.workorder 原始碼（Odoo 17.0）](https://github.com/odoo/odoo/blob/17.0/addons/mrp/models/mrp_workorder.py) — 取得 production_id/workcenter_id/operation_id/qty_production/qty_produced/duration_expected/duration/duration_percent/time_ids/costs_hour 與 state 選項（pending/waiting/ready/progress/done/cancel）；確認 time_ids 指向 mrp.workcenter.productivity
- [mrp.workcenter / mrp.workcenter.productivity / mrp.routing.workcenter 原始碼（Odoo 17.0）](https://github.com/odoo/odoo/blob/17.0/addons/mrp/models/mrp_workcenter.py) — 取得 resource_calendar_id/time_efficiency/default_capacity/costs_hour/time_start/time_stop/oee/oee_target/performance/workcenter_load/blocked_time/productive_time 與 OEE 公式 productive_time×100/(productive_time+blocked_time)；productivity 的 loss_id/loss_type/date_start/date_end/duration
- [mrp.routing.workcenter 原始碼（Odoo 17.0）](https://raw.githubusercontent.com/odoo/odoo/17.0/addons/mrp/models/mrp_routing.py) — 取得工藝欄位 name/workcenter_id/bom_id/sequence/time_mode/time_cycle_manual/time_cycle/time_mode_batch/worksheet_type/blocked_by_operation_ids/needed_by_operation_ids（工序相依）
- [mrp.bom / mrp.bom.line / mrp.bom.byproduct 原始碼（Odoo 17.0）](https://github.com/odoo/odoo/blob/17.0/addons/mrp/models/mrp_bom.py) — 取得 product_tmpl_id/product_id/product_qty/type(normal=Manufacture/phantom=Kit)/bom_line_ids/operation_ids/byproduct_ids；bom.line 的 operation_id；byproduct 的 cost_share
- [stock.move（mrp 擴充）原始碼（Odoo 17.0）](https://raw.githubusercontent.com/odoo/odoo/17.0/addons/mrp/models/stock_move.py) — 取得 raw_material_production_id/production_id/workorder_id/bom_line_id/byproduct_id/operation_id/manual_consumption 與 unit_factor、should_consume_qty 計算式（部分完工等比扣料）
- [stock.scrap（mrp 擴充）原始碼（Odoo 17.0）](https://raw.githubusercontent.com/odoo/odoo/17.0/addons/mrp/models/stock_scrap.py) — 取得 production_id/workorder_id/product_is_kit/bom_id 與 scrap 自動帶來源地點、依元件/成品打 raw_material_production_id/production_id 標記達成折損追溯
- [stock.quant 原始碼（Odoo 17.0）](https://raw.githubusercontent.com/odoo/odoo/17.0/addons/stock/models/stock_quant.py) — 取得 product_id/location_id/lot_id/package_id/owner_id/quantity/reserved_quantity/available_quantity(= quantity − reserved)/inventory_quantity/in_date，及量子＝產品×地點×批號 的定義
- [Odoo 17.0 文件：Process manufacturing orders / One-step manufacturing](https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/manufacturing/basic_setup/one_step_manufacturing.html) — 取得 MO 處理流程（確認→完成工單→Register Production→Close Production）與一步製造不產生顯式移轉、僅關單時更新庫存的說明
- [Odoo 19.0 文件：Three-step manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html) — 取得三步製造路線：Pick Components（WH/PC）＋ MO ＋ Store Finished Products（WH/SFP），以及倉庫設定 1/2/3 步的位置，確認 WIP 顯式建模方式
- [Odoo 17.0 文件：Shop Floor overview](https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/manufacturing/shop_floor/shop_floor_overview.html) — 取得 MES 平板/工作站介面：All/工作中心/My 頁、工單與 MO 資訊卡、Register Production/Mark as Done/Close Production/Quality Checks/Scrap 按鈕、計時與工時追蹤
- [Odoo 19.0 文件：Overall equipment effectiveness (OEE)](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/reporting/oee.html) — 取得 OEE 定義（完全生產時間占比）與四類時間分類：Fully Productive、Reduced Speed（performance）、Material Availability（availability）、Equipment Failure；oee_target 設定
- [Odoo 17.0 文件：Quality control points](https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/quality/quality_management/quality_control_points.html) — 取得品質控制點型別（Instructions/Take a Picture/Pass-Fail/Measure）、控制時機（All Operations/Randomly/Periodically），及 quality.check 與製造/作業掛接（enterprise quality 模組）
- [Odoo 17.0/19.0 文件：Production planning & capacity / Work centers / MPS](https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html) — 取得有限產能 vs 預設無限產能排程、Planning by Workcenter 負載視圖、Gantt、MPS（預測＋訂單＋庫存→計畫單）與 frePPLe 細排程整合的說明
- [印刷業拼版/併單軟體（Impostrip / Metrix / Insoft）](https://insoftautomation.com/ganging-for-printing-industry/) — 佐證拼版/併單/排版優化由專門 prepress 軟體經 API 與 ERP/MIS 整合處理，確認 Odoo 無此原生功能（imposition_optimization 標不適用）

## 查無公開資料（誠實標註，禁編造補齊）

- quality.check / quality.point / quality.alert 的逐欄位原始碼定義：quality 為 Odoo 企業版模組，原始碼未公開於 odoo/odoo 社群版 GitHub（addons 下無 quality 模型檔，WebFetch 取回 404），相關欄位（quality_state 的 none/pass/fail、test_type、norm/tolerance）僅能依官方使用文件描述，未經原始碼逐欄位核對。
- OEE 三因子（可用率×表現×品質）的精確內部計算式：官方 19.0 文件僅給『完全生產時間占比』的概念定義，未提供逐因子數學公式；本研究引用的 productive_time×100/(productive_time+blocked_time) 來自 17.0 mrp_workcenter.py 原始碼的 oee computed 欄位，與教科書 OEE 公式定義不完全等同。
- 折損率（scrap rate）是否有內建百分比 KPI 欄位：僅確認 stock.scrap 紀錄與報廢分析報表存在，未在原始碼確認單一 computed 的折損率百分比欄位。
- mrp.workcenter.capacity 與 mrp.workcenter.productivity.loss 兩個輔助模型的完整欄位清單：僅由 mrp_workcenter.py 的關聯與文件確認其存在與用途，未逐欄位 fetch 其獨立模型定義。
- 有限產能排程被啟用後的實際 guard 演算法細節（如何偵測時段衝突、是否自動後推）：文件層級確認『預設無限、可啟用有限』，但未取得原始碼層級的排程演算法實作細節。

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

實際以 WebFetch 打開 7 個來源並逐項比對，全部可達且內容相符：

(1) mrp_workcenter.py（17.0 raw）— OEE 計算式逐字相符：`workcenter.oee = float_round(productive_time * 100.0 / (productive_time + blocked_time), precision_digits=2)`，且 oee_target default=90、time_efficiency related default=100、default_capacity default=1.0、time_start/time_stop（Setup/Cleanup Time）、alternative_workcenter_ids（Many2many）、working_state（normal/blocked/done）全部存在，與研究一致。

(2) stock_move.py（17.0 raw）— 兩個關鍵計算式逐字相符：unit_factor = `move.product_uom_qty / ((mo.product_qty - mo.qty_produced) or 1)`；should_consume_qty = `float_round((mo.qty_producing - mo.qty_produced) * move.unit_factor, ...)`。raw_material_production_id / production_id / workorder_id / bom_line_id / byproduct_id / operation_id / manual_consumption 皆存在且語意相符。

(3) stock_quant.py（17.0 raw）— available_quantity compute 逐字相符：`quant.available_quantity = quant.quantity - quant.reserved_quantity`；product_id/location_id/lot_id 三者 required+index 與「量子＝產品×地點×批號」定義一致；package_id/owner_id/inventory_quantity/inventory_diff_quantity/in_date 皆存在。

(4) mrp_production.py（17.0 raw）— state Selection 逐字相符（draft/confirmed/progress/to_close/done/cancel）；reservation_state 三值（confirmed/assigned/waiting）相符；其餘列出欄位全部存在。

(5) mrp_routing.py（17.0 raw）— sequence default=100、time_cycle_manual default=60、time_mode_batch default=10、worksheet_type（pdf/google_slide/text）、blocked_by_operation_ids/needed_by_operation_ids（自關聯 Many2many）全部逐字相符。

(6) mrp_bom.py（17.0 raw）— type Selection（normal=Manufacture this product / phantom=Kit）逐字相符；cost_share、bom.line.operation_id 皆存在。

(7) 誠實性標記查核：研究在 not_found 宣稱 quality 模組原始碼未公開於社群版 GitHub、WebFetch 取回 404——實際打開 addons/quality/models/quality.py 確認回 HTTP 404，標記屬實，非掩飾。Odoo 17.0 quality_control_points.html 官方文件可達，確認 Measure 型「within a tolerance of a norm value」。

結論：來源真實可達、與宣稱高度相符，無捏造 URL；開源系統的具體欄位名/公式均有原始碼背書。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- 品質模組欄位名（quality.point 的 measure_on / test_type / norm / tolerance_min / tolerance_max；quality.check 的 quality_state none/pass/fail / measure / control_date）：quality 為企業版模組、社群版 GitHub 確認 404（研究已誠實標記於 not_found），這些欄位名僅依官方文件「概念描述」推得，未經原始碼逐欄位核對。屬 suspicious-but-disclosed：研究已自行降級宣稱、未冒充原始碼背書，故非編造，但 tolerance_min/tolerance_max 等具體 snake_case 欄位名仍無來源佐證。
- QCP 檢查型別數量：研究多處寫四型（Instructions / Take a Picture / Pass-Fail / Measure），實際 17.0 官方文件列五型（多一個 Worksheet checks）。屬遺漏而非編造，但與來源不完全相符。
- mrp.workcenter.capacity 與 mrp.workcenter.productivity.loss 兩輔助模型的完整欄位清單：研究已於 not_found 標記未逐欄位 fetch，僅由關聯與文件確認存在。屬已揭露的未完成核對。
- 有限產能排程啟用後的 guard 演算法細節（如何偵測時段衝突 / 是否自動後推）：研究已於 not_found 標記僅文件層級確認、未取原始碼實作。屬已揭露未核對項。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- 將品質模組（quality）檢查型別由「四型」修正為「五型」：補上 Worksheet checks（17.0 官方文件實列五型 Instructions / Take a Picture / Pass-Fail / Measure / Worksheet）。
- quality.point / quality.check 的具體欄位名（measure_on / test_type / norm / tolerance_min / tolerance_max / quality_state）建議在文件中明確標註「依官方使用文件推得、非原始碼核對」前綴，避免讀者誤認與 mrp 欄位同屬原始碼背書等級；tolerance_min/tolerance_max 屬推測欄位名，若無原始碼宜改為描述性敘述（容差上下限）而非 snake_case 欄位名。
- borrowable / not_applicable 段含對「感官 ERP」的延伸建議（齊套性、回溯排程、虛擬地點 WIP 等），屬研究員主觀對照判斷而非 Odoo 事實，建議與「Odoo 事實宣稱」在文件層級區隔標示，避免後續被當成 Odoo 來源性事實引用。

**來源充分、可信度高的內容**：
- OEE 計算式 productive_time × 100 / (productive_time + blocked_time)、oee_target default=90：經 mrp_workcenter.py 17.0 原始碼逐字確認（這是最容易被 LLM 套教科書 OEE=可用率×表現×品質 公式而出錯的點，研究反而忠於原始碼、並在 not_found 誠實指出與教科書公式不完全等同）。
- 部分完工等比扣料邏輯 unit_factor 與 should_consume_qty 計算式：經 stock_move.py 17.0 原始碼逐字確認，連 `(... or 1)` 防除零細節都正確。
- stock.quant 三欄 available_quantity = quantity − reserved_quantity 的 compute：經 stock_quant.py 原始碼逐字確認；「量子＝產品×地點×批號」定義與 product_id/location_id/lot_id 的 required+index 設計相符。
- mrp.production state 五階＋cancel（draft/confirmed/progress/to_close/done/cancel）與 reservation_state 三值（confirmed/assigned/waiting）：原始碼逐字確認。
- mrp.routing.workcenter 具體 default 值（sequence=100 / time_cycle_manual=60 / time_mode_batch=10）與 worksheet_type 三選項、工序相依 blocked_by/needed_by 自關聯：原始碼逐字確認。
- mrp.bom type=normal/phantom(Kit)、cost_share、bom.line.operation_id：原始碼逐字確認。
- 誠實性標記品質高：not_found 段準確預告了所有真正缺來源的項目（quality 模組 404、OEE 三因子無公式、折損率無內建百分比欄位、有限產能 guard 演算法未核對），對抗式查核反證後均成立，顯示無掩飾。
