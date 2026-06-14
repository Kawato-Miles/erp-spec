---
type: raw
status: raw
created-at: 2026-06-14
source: claude-research
captured-by: claude-on-task
module:
  - 訂單管理
  - 生產任務
topic-tag:
  - MES
  - SalesforceManufacturingCloud
  - 銷售協議
  - 需求預測
  - 邊界釐清
related-vault:
  - "[[訂單]]"
  - "[[生產任務]]"
raw-source-link: https://www.valorx.com/blog/salesforce-manufacturing-cloud-data-model-a-visual-guide
attached-files: []
---

# Salesforce Manufacturing Cloud — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：通用 ERP-MES（實為製造業 CRM / 銷售與營運規劃平台，非真正 MES）

## 系統定位概述

Salesforce Manufacturing Cloud 是建構於 Salesforce 平台之上、以「客戶帳戶（Account）」為中心的製造業 CRM 與銷售營運規劃（S&OP）產品，核心解決長期供貨承諾（銷售協議 Sales Agreement）、需求預測（Advanced Account Forecasting）、帳戶經理目標、回扣（Rebate）與庫存可視性。其原生資料模型完全偏向商業端（協議、預測、訂單、庫存可視性），不含生產訂單、工序路由（routing）、工作中心（work center）、有限產能排程或拼版等任何生產執行物件。所謂「庫存 / 工單」實為 Salesforce 平台標準的 Field Service 物件（ProductItem 倉儲庫存、WorkOrder 現場服務工單），並非製造生產工單。真正的生產執行與排程須靠 AppExchange MES 夥伴（如 24Flow）原生擴充，或透過 MuleSoft / API 整合外部 ERP-MES。定位上它偏 CRM/銷售協議，並非具備生產執行能力的 MES。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### Sales Agreement（銷售協議）

最上層商業承諾物件，記錄客戶協商的長期供貨條款（期間、狀態、協議類型、總營收 roll-up）。一個客戶帳戶在一個產品範疇與協議期間內對應一張銷售協議。此為 Manufacturing Cloud 真正的核心物件之一。

關鍵屬性：Account（lookup）、Start/End Date、Status、Agreement Type、Total Revenue（roll-up）、Owner

關聯：
- 一個 Account 對多張 Sales Agreement
- 一張 Sales Agreement 對多筆 Sales Agreement Product

### Sales Agreement Product（協議產品）

協議下的產品明細，承諾的計畫數量與計畫營收。

關鍵屬性：Sales Agreement（master-detail）、Product（lookup）、Planned Revenue、Planned Quantity、Unit of Measure

關聯：
- 一張 Sales Agreement 對多筆 Sales Agreement Product
- 一筆 Sales Agreement Product 對多筆 Sales Agreement Product Schedule

### Sales Agreement Product Schedule（協議產品時段排程）

將協議產品依時間期次（period）展開，記錄各期計畫數量/營收與實際數量/營收（planned vs actual）。這是 Manufacturing Cloud 的「時間相位（time-phased）」骨幹，但屬商業承諾的時段，而非生產排程。

關鍵屬性：Sales Agreement Product（master-detail）、Start Date、Planned Revenue、Planned Quantity、Actual Revenue、Actual Quantity

關聯：
- 一筆 Sales Agreement Product 對多筆 Schedule

### Account Forecast / Account Forecast Period（帳戶預測 / 預測期次）

Advanced Account Forecasting 的規劃層，依帳戶與預測週期產生時間相位的需求預測（數量/營收），可整合機會、訂單、銷售協議、歷史訂單與自訂資料作為輸入，支援 planned vs actual 比較與情境規劃。

關鍵屬性：Account（lookup）、Forecast Set（lookup）、Period Start Date、Forecast Quantity、Forecast Revenue、Actual Quantity、Actual Revenue

關聯：
- 一個 Account 對多筆 Account Forecast
- 一筆 Account Forecast 對多筆 Account Forecast Period
- Account Forecast Set 定義規劃週期與存取控制

### Account Manager Target（帳戶經理目標）

由上而下（top-down）的目標值，供與預測做缺口分析（gap analysis）。

關鍵屬性：Account Manager（lookup）、Period、Target Revenue、Target Quantity

關聯：
- 關聯至 Account / Account Manager 與期次

### ProductItem（產品庫存項，Field Service 標準物件）

代表「某產品在某庫存地點（如倉庫或配送點）的在庫量」。這是 Salesforce 平台 Field Service 的標準庫存物件，被納入 Manufacturing Cloud 的 Inventory 資料模型；它是地點層級的成品/料品在庫，並非製造業的多倉位、批號生產在製建模。

關鍵屬性：（依官方描述）關聯庫存 Location 並儲存該地點的產品數量；欄位如 QuantityOnHand / LocationId / Product2Id 為 Field Service 標準欄位——本研究無法從 JS 渲染的 dev 文件取得逐欄確認，列入 not_found

關聯：
- 一個 Location 對多筆 ProductItem
- 一個 Product（Product2）對多筆 ProductItem（分散於各地點）

### ProductConsumed / ProductRequired（已耗用 / 需求料品，Field Service 標準物件）

ProductConsumed 記錄在某 WorkOrder（現場服務工單）執行中實際耗用的料品數量；ProductRequired 記錄某工單預期需要的料品。語意為「現場服務耗料」，非製造 BOM 投料消耗。

關鍵屬性：關聯 WorkOrder / WorkOrderLineItem、Product2、Quantity Consumed / Quantity Required（欄位精確名稱列入 not_found）

關聯：
- 一張 WorkOrder 對多筆 ProductConsumed
- 一張 WorkOrder 對多筆 ProductRequired

### ProductTransfer / ProductRequest / ProductRequestLineItem（庫存調撥 / 補貨請求，Field Service 標準物件）

ProductTransfer 記錄產品在地點間的調撥移動；ProductRequest / ProductRequestLineItem 為補貨/領料請求與其明細。用於倉儲補貨與調撥，對應 Manufacturing Cloud 的 Inventory Search & Transfer / Replenishment 能力。

關鍵屬性：Source/Destination Location、Product2、Quantity to Transfer（欄位精確名稱列入 not_found）

關聯：
- 一筆 ProductRequest 對多筆 ProductRequestLineItem
- ProductTransfer 連結來源與目的 Location

### ProductItemTransaction / SerializedProduct / SerializedProductTransaction（庫存異動 / 序號品）

ProductItemTransaction 記錄 ProductItem 的庫存異動（增減）流水；SerializedProduct 與其 Transaction 支援序號層級追蹤。屬庫存異動帳，可作為「物料異動帳」的概念對照。

關鍵屬性：關聯 ProductItem、Transaction Type / Quantity（欄位精確名稱列入 not_found）

關聯：
- 一筆 ProductItem 對多筆 ProductItemTransaction

### WorkOrder / WorkOrderLineItem（現場服務工單，平台標準物件，非生產工單）

Salesforce 平台標準的 Field Service 工單：WorkOrder 代表為客戶執行的現場服務工作（維修/保養/到場服務），WorkOrderLineItem 為其子任務。被納入 Inventory 資料模型作為耗料載體。明確不是製造業的生產工單（production order），不具工序路由、工作中心派工或產能負載語意。

關鍵屬性：關聯 Account / Asset / Location、Status、WorkType（lookup）

關聯：
- 一張 WorkOrder 對多筆 WorkOrderLineItem
- 一張 WorkOrder 對多筆 ProductConsumed / ProductRequired

### Shipment / ShipmentItem / ReturnOrder / ReturnOrderLineItem（出貨 / 退貨，平台標準物件）

Shipment 記錄產品出貨移動、ShipmentItem 為其明細；ReturnOrder/Line Item 處理退貨。用於成品出貨與退貨流，對應感官的出貨單概念但偏配送/服務退補。

關鍵屬性：關聯 Location / Product2、Quantity Shipped（欄位精確名稱列入 not_found）

關聯：
- 一筆 Shipment 對多筆 ShipmentItem
- 一筆 ReturnOrder 對多筆 ReturnOrderLineItem

## 二、資料流程

### 銷售協議 → 時段承諾 → 實際達成追蹤（商業端核心流，planned vs actual）

1. 業務與客戶協商長期供貨條款，建立 Sales Agreement（綁定 Account、期間、協議類型）
2. 於協議下建立 Sales Agreement Product，定義各產品的計畫數量與計畫營收
3. 系統依協議期間將每個協議產品展開為 Sales Agreement Product Schedule（逐期次的 planned 數量/營收）
4. 訂單（Order / Order Item）與出貨實際發生後，actual 數量/營收回填至各期次 Schedule
5. 比對 planned vs actual，呈現協議達成率與缺口（此為承諾追蹤，非生產進度）

### 需求預測流（Advanced Account Forecasting）

1. 設定 Account Forecast Set 定義預測週期與維度（帳戶/產品/區域）
2. 彙整輸入來源：機會（Opportunity）、訂單、銷售協議、歷史訂單、自訂資料
3. 以可設定公式（configurable formula）在帳戶/產品/區域層級計算未來各期需求量
4. 產生 Account Forecast 與逐期 Account Forecast Period（forecast 數量/營收）
5. 對照 Account Manager Target 做缺口分析；actual 回填後比對預測準確度，並驅動補貨/庫存決策

### 庫存可視與調撥流（Field Service 庫存物件，非生產投料）

1. 每個庫存地點（Location）持有多筆 ProductItem，記錄各產品在該地點的在庫量
2. 庫存異動寫入 ProductItemTransaction（增減流水）
3. 補貨：建立 ProductRequest / ProductRequestLineItem 觸發補貨；地點間以 ProductTransfer 調撥
4. 現場服務執行時，WorkOrder 透過 ProductConsumed 扣減耗用料品（服務耗料，非製造 BOM 投料）
5. 出貨以 Shipment / ShipmentItem 記錄移動，退貨以 ReturnOrder 處理

### 與外部 ERP / MES 整合流（生產執行的真正落點）

1. Manufacturing Cloud 持有協議、預測、訂單、庫存可視性（商業與規劃層）
2. 需求預測與訂單透過 MuleSoft / API 下推至外部 ERP-MES
3. 外部 MES 執行生產訂單、工序排程、派工、生產回報、WIP 與品質（Manufacturing Cloud 本身不做）
4. 生產進度、工單狀態、產出與品質指標回傳 Salesforce 供 360 度可視（read-back）
5. 替代路徑：採用 AppExchange 原生 MES 夥伴（如 24Flow）在同一 Salesforce Org 內補上排程與現場執行層，ERP 仍為財務骨幹

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| 商業承諾與營運規劃（原生核心） | 銷售協議管理（Sales Agreements，含 planned vs actual 達成追蹤）、進階帳戶預測（Advanced Account Forecasting，多來源、可設定公式、情境規劃）、帳戶經理目標與缺口分析（Account Manager Targets）、回扣 / 獎勵計畫（Rebate Management：Program / Tier / Member / Payout / Claim） |
| 訂單與庫存可視（平台標準物件納入） | 訂單管理（Order / Order Item）、庫存資訊管理（ProductItem 地點層在庫）、庫存配置 / 批次管理（Inventory Allocation / Batch Management）、庫存查詢與調撥（Inventory Search & Transfer / ProductTransfer）、庫存盤點（Inventory Count）、庫存補貨（Inventory Replenishment / ProductRequest） |
| 服務與資產（Field Service 衍生） | 現場服務工單（WorkOrder / WorkOrderLineItem，服務非生產）、資產與保固（Asset / Warranty Term / Asset Warranty）、服務案件（Case）、出貨與退貨（Shipment / ReturnOrder） |
| 分析與 AI | Advanced Account Forecasting Analytics（預測 vs 協議 vs 機會的商業洞察）、Einstein / 預測式洞察（需求預測、庫存最佳化建議）、Agentforce Manufacturing（AI 代理人、含 AI Inventory Management 技能） |
| 生產執行（原生不具備，須外掛 / 整合） | 生產訂單 / 工序排程 / 派工 / 生產回報 / WIP / 拼版：均無原生功能、經 AppExchange MES 夥伴補上（如 24Flow：視覺化生產排程、工單下達編排與 WIP 控管、操作員 Cockpit、數位品檢與不良品流程、工時登錄、領料與用料確認）、或經 MuleSoft / API 整合外部 ERP-MES |

## 四、庫存處理（Miles 重點關注）

Manufacturing Cloud 原生庫存建模採用 Salesforce 平台 Field Service 的標準庫存物件，核心是 ProductItem——代表「某產品在某庫存地點（Location）的在庫量」，以 Location 對 ProductItem 的一對多關係建構多地點庫存可視性；庫存增減以 ProductItemTransaction 記錄流水，序號品以 SerializedProduct/Transaction 追蹤，地點間移動以 ProductTransfer、補貨以 ProductRequest/Line Item、出貨以 Shipment/Item、退貨以 ReturnOrder 處理。能力面提供：跨地點即時在庫可視、低庫存/缺貨警示、庫存配置、批次管理（Batch）、盤點（Count）、調撥（Transfer）與需求驅動補貨（Replenishment），並有 Einstein/Agentforce 的 AI 庫存最佳化建議。關鍵限制（對感官重要）：此庫存模型是「成品/料品在地點的在庫與調撥」，沒有製造業意義的在製品（WIP）建模——沒有生產訂單對應的在製數量、沒有工序間半成品流轉、沒有 BOM 結構化投料消耗。其中 ProductConsumed 雖記錄耗料，但語意是「現場服務工單（WorkOrder）的服務耗料」，非製造投料。成品入庫亦無「完工回報觸發入庫」的生產閉環，須由外部 MES/ERP 完成生產後回寫庫存。逐欄位精確名稱（如 QuantityOnHand / LocationId / Product2Id）為 Field Service 標準欄位，但本研究無法從 JavaScript 渲染的官方 dev 文件逐欄確認，已列入 not_found。

## 五、排程與產能

無原生生產排程或產能規劃能力。Manufacturing Cloud 的「時間相位（time-phased）」機制僅存在於商業層——Sales Agreement Product Schedule 的逐期承諾與 Account Forecast Period 的逐期需求預測，這是「需求/承諾的時段切分」，不是「生產的有限產能排程（finite capacity scheduling）」，沒有工作中心（work center）、產能負載、工序排程或派工概念。實際的有限產能排程、工作中心負載與派工須由：(1) AppExchange 原生 MES 夥伴提供——例如 24Flow 明確提供「視覺化生產規劃與排程（visual production planning & scheduling）」「工單下達編排與 WIP 控管」「操作員 Cockpit」，定位為在 Salesforce Org 內補上排程與現場執行層、ERP 仍為財務骨幹；或 (2) 整合外部 ERP-MES，由其執行排程後回寫 Salesforce 供可視。對感官而言，感官既有的排程中心 / 派工看板 / 回溯排程已超越 Manufacturing Cloud 原生能力，後者在排程上不具參考價值。

## 六、拼版優化（印刷特化）

不適用 / 無此原生功能。Salesforce Manufacturing Cloud 是製造業 CRM 與 S&OP 平台，完全不涉及印刷併單、拼版（imposition）、套版（gang-run）或排料（nesting）。其資料模型無任何幾何/版面/紙張利用率相關物件。此能力既非 Manufacturing Cloud 提供，也非其 AppExchange MES 夥伴（24Flow 為離散製造 MES）的範疇，須由印刷專用 prepress / imposition 軟體（如 Esko、印刷專用 MIS）處理。對感官的拼版優化需求，此系統零借鏡。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| 協議達成率（planned vs actual，Sales Agreement） | 以 Sales Agreement Product Schedule 各期次的 actual 數量/營收對比 planned 數量/營收，呈現客戶協議的履行進度與缺口。屬商業承諾 KPI，非生產 KPI。 |
| 預測準確度 / 預測 vs 目標缺口（Account Forecasting） | 以 Account Forecast Period 的 forecast 對比 actual 衡量預測準確度；並以 Account Manager Target 對比預測做 gap analysis。屬需求規劃 KPI。 |
| 庫存可視指標（在庫量 / 低庫存警示 / 庫存週轉概念） | 基於 ProductItem 在各 Location 的在庫量提供即時可視與缺貨警示，並以 AI 建議庫存最佳化。為庫存可視 KPI，非生產良率/稼動。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- 時間相位資料骨架（time-phased）值得借鏡：以『主檔 → 產品明細 → 逐期次 schedule（planned 欄 + actual 欄並列）』的三層結構承載承諾與實際，感官可用於『訂單承諾交期 vs 實際完工』『預測產量 vs 實際產量』的逐期對照，與既有生產任務數量追蹤互補
- planned vs actual 並列同一筆 schedule 的設計：把計畫值與實際值放同一期次記錄，天然支援達成率/缺口的即時計算，KPI 不需另建彙整表——可借鏡到感官的折損率/良率逐期統計卡設計
- 需求預測多來源彙整 + 可設定公式（configurable formula）：以機會/訂單/歷史/協議多輸入產生帳戶層需求預測，對感官『以歷史訂單推估未來產能需求、回推備料』的產能規劃前置有方法論參考
- 庫存 Location 對 ProductItem 一對多 + ProductItemTransaction 異動流水的乾淨模型：感官在建『多倉位在庫 + 物料異動帳』時可借鏡此『在庫快照物件 + 異動流水物件』分離的結構
- 明確的系統邊界宣示（ERP 為財務骨幹、MES 補執行層、CRM 管商業）：佐證感官『生產執行域 MES 應與商業/財務分層』的架構判斷，避免把生產執行硬塞進通用 CRM 模型

**不適用 / 不照搬**：
- 生產訂單 / 生產工單建模（Manufacturing Cloud 的 WorkOrder 是現場服務工單，非生產工單，不可直接對應感官的工單/生產任務）
- 工序路由（routing）、工作中心（work center）、派工與有限產能排程——原生完全不具備
- 在製品（WIP）建模與工序間半成品流轉——庫存模型只有地點在庫，無 WIP 概念
- BOM 結構化投料消耗與完工入庫的生產閉環——ProductConsumed 是服務耗料非製造投料
- 拼版 / 併單 / 排料優化——印刷專屬，此系統與其 MES 夥伴皆無
- 生產 KPI（OEE / 稼動率 / 良率 / 折損率 / 工時效率）——原生分析聚焦預測準確度與協議達成，無生產執行 KPI
- 回扣 / Rebate 管理——與感官生產執行域無關（屬通路獎勵商業功能）

## 來源（真實查證）

- [Salesforce Manufacturing Cloud Data Model Explained (Visual Guide) — Valorx](https://www.valorx.com/blog/salesforce-manufacturing-cloud-data-model-a-visual-guide) — WebFetch 成功取得：核心商業物件（Sales Agreement / Sales Agreement Product / Sales Agreement Product Schedule / Account Forecast / Account Forecast Period / Account Forecast Set / Account Manager Target / Rebate 系列）的物件名、主要欄位與一對多關係；並明確確認資料模型『無任何 production order / work order / 生產執行 / WIP / work center / routing 物件』
- [Inventory | Manufacturing Cloud | Data Model Gallery — Salesforce Developers（經 WebSearch 取得實體清單）](https://developer.salesforce.com/docs/platform/data-models/guide/inventory.html) — WebSearch 摘要逐字列出 Inventory 資料模型實體：Asset, Location, Pricebook Entry, Product, Product Consumed, Product Consumed State, Product Item, Product Item Transaction, Product Required, Product Request, Product Request Line Item, Product Transfer, Product Transfer State, Return Order, Return Order Line Item, Shipment, Shipment Item, Serialized Product, Serialized Product Transaction, Work Order, Work Order Line Item（注：頁面本體為 JS 渲染，WebFetch 取回空白，故實體清單採搜尋摘要、逐欄定義列 not_found）
- [ProductItem | Field Service Developer Guide — Salesforce Developers](https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/sforce_api_objects_productitem.htm) — 經 WebSearch 確認 ProductItem 官方語意：『代表某產品在某地點（field service）的在庫，如主倉所有螺栓』——確立 Manufacturing Cloud 庫存模型沿用 Field Service 標準物件、為地點層在庫而非製造 WIP（頁面本體 JS 渲染無法逐欄取得）
- [WorkOrder / WorkOrderLineItem | Object Reference — Salesforce Developers](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_workorder.htm) — 經 WebSearch 確認 WorkOrder 官方語意為『為客戶執行的現場服務工作（維修/保養/到場服務）』、WorkOrderLineItem 為其子任務——明確證實此非製造生產工單，是本研究判定『偏 CRM 非 MES』的關鍵證據
- [Manufacturing Cloud Data Model Objects — Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.mfg_datacloud_data_model_objects.htm&language=en_US&type=5) — WebFetch 成功取得物件分類清單：Account/Asset/Contact/Product/Location（核心）、Opportunity/Order/Order Item/Sales Agreement Product Schedule（銷售營收）、Case/Work Order/Work Order Line Item/Warranty（服務保固）等——佐證模型由商業+服務物件組成、無生產執行物件
- [Manage Product and Part Inventory in Manufacturing Cloud — Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.mfg_inventory_parent.htm&language=en_US&type=5) — WebFetch 取得庫存能力章節結構：Inventory Allocation / Batch Management / Search & Transfer / Count / Replenishment——確立原生庫存能力範圍為『在庫可視+配置+批次+盤點+調撥+補貨』，無 WIP/生產投料
- [Salesforce MES & Scheduling for Make-to-Order Manufacturing — 24Flow](https://24flow.eu/salesforce-mes/) — WebFetch 成功取得：24Flow 在 Salesforce 平台原生補上『視覺化生產規劃與排程、工單下達編排與 WIP 控管、操作員 Cockpit、數位品檢與不良品流程、工時登錄、領料與用料確認』，並定位『ERP 仍為財務骨幹』——證實生產執行/排程須由 AppExchange MES 夥伴補足、非 Manufacturing Cloud 原生
- [The Definitive Guide to Salesforce Manufacturing Cloud — Cyntexa](https://cyntexa.com/blog/salesforce-manufacturing-cloud/) — WebFetch 取得功能模組整理（Sales Agreements / Account-Based Forecasting / Inventory / Einstein / Service）並獨立佐證『文件未涉及生產排程、現場執行、製造工單、有限產能排程或 MES 功能；生產執行由整合的 ERP/MES 處理』
- [Advanced Account Forecasting — Trailhead / Salesforce Help（經 WebSearch）](https://help.salesforce.com/s/articleView?id=sf.aaf_admin_parent_concept.htm&language=en_US&type=5) — 經 WebSearch 確認 Advanced Account Forecasting 能力：以機會/訂單/銷售協議/歷史/區域多來源、可設定公式在帳戶/產品/區域層計算需求、planned vs actual 比較、情境規劃——確立其分析屬需求預測而非生產 KPI
- [Manufacturing Cloud Standard Objects | Developer Guide — Salesforce Developers](https://developer.salesforce.com/docs/atlas.en-us.mfg_api_devguide.meta/mfg_api_devguide/mfg_api_overview.htm) — 嘗試 WebFetch 取逐欄 schema 但頁面為 JS 渲染回傳空白（未取得內容）；列此來源以誠實標示逐欄欄位定義無法從官方 dev 文件取得，相關欄位精確名已列入 not_found

## 查無公開資料（誠實標註，禁編造補齊）

- ProductItem 的逐欄位精確定義（QuantityOnHand / LocationId / Product2Id / QuantityUnitOfMeasure 等）——官方 developer / field-reference 文件為 JavaScript 渲染，WebFetch 取回空白，無法逐欄確認，故僅依官方/權威摘要描述物件語意，未列為精確欄位
- ProductConsumed / ProductTransfer / ProductRequest / ProductItemTransaction 的精確欄位名（如 QuantityConsumed / QuantityToTransfer / Transaction Type）——同上，dev 文件無法渲染取得
- Manufacturing Cloud 內建生產相關 KPI 的精確計算公式——查無，因系統本身無生產執行 KPI（非『查不到』而是『不存在』，但無官方公式可引）
- Sales Agreement / Account Forecast 物件 API 上的完整欄位清單與資料型別——Valorx 視覺指南提供物件與主要欄位的整理，但官方 dev 文件逐欄定義無法渲染取得，故欄位名以第三方權威整理為準、非官方逐欄確認
- ProductItem 是否在 Manufacturing Cloud 情境下被擴充出製造專用欄位（超出 Field Service 標準）——無公開資料可確認
- 24Flow 等 AppExchange MES 夥伴的內部資料模型（其工單/排程物件 schema）——屬第三方產品，無公開 schema

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

抽查 5 個關鍵 URL，全部真實可達且內容相符：(1) Valorx 資料模型視覺指南 https://www.valorx.com/blog/salesforce-manufacturing-cloud-data-model-a-visual-guide — 證實 Sales Agreement / Sales Agreement Product / Sales Agreement Product Schedule 三件套、Account Forecast / Period / Set / Account Manager Target 四件套，並逐字列出 Schedule 欄位（Planned Revenue/Quantity、Actual Revenue/Quantity）與關聯（one Account → many Sales Agreements、master-detail），且明確「無 production order / work order / WIP / work center / routing」。(2) 24Flow https://24flow.eu/salesforce-mes/ — 七項宣稱能力（視覺化排程、工單下達編排與 WIP 控管、操作員 Cockpit、數位品檢與不良品流程、工時登錄、領料與用料確認）逐項相符，並有「ERP remains the financial backbone, Salesforce + 24Flow becomes the execution layer」原句。(3) Salesforce Developers Inventory 資料模型 https://developer.salesforce.com/docs/platform/data-models/guide/inventory.html — 18+ 實體清單與研究 source 註記逐字相符（ProductItem / ProductItemTransaction / ProductConsumed / ProductTransfer / ProductRequest / SerializedProduct / Shipment / ReturnOrder / WorkOrder 等）。(4) WorkOrder 經 WebSearch 確認官方語意為「field service work performed for a customer（維修/保養/安裝）」，佐證核心論斷「非生產工單」。(5) Salesforce Help mfg_datacloud_data_model_objects 可達，列出 Account/Asset/Case/Order/Work Order/Warranty 等商業+服務物件、無生產執行物件。唯一輕微落差：此 Help 頁我這次抓取未浮現「Sales Agreement Product Schedule」（研究 source 註記將其歸於此頁「銷售營收」分類），但該物件由 Valorx 主來源充分支撐，不影響結論。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- 逐欄精確欄位名（QuantityOnHand / LocationId / Product2Id / QuantityConsumed / QuantityToTransfer / Transaction Type 等）：研究已誠實將其全數列入 not_found，未當作確定事實寫入 ER-model 欄位段——此為正確處理，非編造。僅提醒：閉源 dev 文件逐欄定義確實未被驗證，引用時須維持 not_found 標記。
- Salesforce Help mfg_datacloud_data_model_objects 頁面佐證『Sales Agreement Product Schedule』屬該頁清單——我這次抓取該特定頁未浮現此物件名（僅見 Order/Order Item 等）。此物件由 Valorx 主來源支撐無虞，但『該 Help 頁明列 Schedule』這一具體歸屬點屬輕微未對齊，建議改以 Valorx 為該物件正本來源。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- 將『Salesforce Help mfg_datacloud_data_model_objects 頁佐證 Sales Agreement Product Schedule』一處，改以 Valorx 為該物件的主要正本來源，避免歸錯頁。
- ProductItem 等實體之逐欄欄位若日後要寫入 ER-model 正式欄位段，須先以可渲染來源（如 Field Service Object Reference 的可抓版本或 Salesforce Schema Builder 截圖）逐欄確認後再升級，否則維持 not_found，不得因『看似標準欄位』而填入。
- borrowable 段第二點『planned vs actual 並列同一筆 schedule…KPI 不需另建彙整表』為研究自身的設計推論（對感官的借鏡建議），非 Salesforce 官方宣稱；引用時應標記為『分析者推論』而非系統既有事實。

**來源充分、可信度高的內容**：
- 核心定位論斷『Manufacturing Cloud 偏 CRM/S&OP、非真正 MES，原生無生產執行物件』——由 Valorx（明確無 production/work order/WIP/routing）、Salesforce Help（僅商業+服務物件）、Cyntexa 三來源交叉佐證，且 WorkOrder=Field Service 現場服務工單之官方語意經獨立驗證，論斷紮實。
- Sales Agreement / Sales Agreement Product / Sales Agreement Product Schedule 三層結構及其 Planned/Actual 並列欄位設計——Valorx 逐字確認物件名、欄位名與 master-detail 關聯。
- Account Forecast / Account Forecast Period / Account Forecast Set / Account Manager Target——Valorx 確認四物件齊備。
- Inventory 模型沿用 Field Service 標準物件（ProductItem / ProductItemTransaction / ProductConsumed / ProductRequired / ProductTransfer / ProductRequest(LineItem) / SerializedProduct(Transaction) / Shipment(Item) / ReturnOrder(LineItem) / WorkOrder(LineItem)）——Salesforce Developers Inventory 資料模型 gallery 18+ 實體清單逐字相符。
- ProductItem 官方語意『某產品在某 Location 的在庫量』——官方/權威摘要確認，研究據此正確推導『地點層在庫、非製造 WIP』。
- 24Flow 為 AppExchange MES 夥伴補上排程/現場執行層、ERP 仍為財務骨幹——24Flow 官網七項能力與分層宣示逐項相符。
- 拼版/併單/排料（imposition）不適用之判定——符合該平台與其離散製造 MES 夥伴的範疇，未對閉源系統虛構任何幾何/版面物件。
- not_found 段的誠實標記紀律——對 JS 渲染無法逐欄取得的官方 dev 文件，未捏造欄位 schema，反而明確區分『物件名有來源』與『逐欄定義無來源』，為防幻覺的正確示範。
