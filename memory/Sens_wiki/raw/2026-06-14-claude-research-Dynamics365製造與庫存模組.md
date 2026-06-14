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
  - 設備
topic-tag:
  - MES
  - Dynamics365
  - 生產控制
  - 有限產能排程
  - 庫存
  - 倉儲管理
  - 成本計算
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[設備]]"
raw-source-link: https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/production-process-overview
attached-files: []
---

# Microsoft Dynamics 365 Supply Chain Management（Finance & Operations 製造模組 / Production control + Inventory + Warehouse management） — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：通用 ERP-MES（離散 + 流程 + 精實混合製造；MTO/MTS/CTO/ETO 皆支援）

## 系統定位概述

Dynamics 365 SCM 是微軟雲端 ERP 的供應鏈模組，生產執行域由 Production control（生產控制）模組承擔，與 Product information management、Inventory management、Warehouse management、General ledger 緊密整合。它以三種訂單型別（生產訂單 production order、批次訂單 batch order、看板 kanban）涵蓋混合製造，核心由「生產用料表（production BOM）+ 工藝路線（route）」驅動，搭配有限產能排程（finite capacity scheduling）與工序/作業排程兩級排程。為閉源商業系統，內部資料庫 schema 不公開；本研究萃取的是官方文件層級的概念實體與被點名的資料表/表單名（如 InventTrans、WHSInventoryTransactionTable、ProdTable、WrkCtr*、ProdJournalTrans*），已標註出處。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### 生產訂單（Production order / ProdTable）

生產執行核心單據，記錄生產什麼、數量、計畫完工日、消耗什麼材料、依何工序製造。生命週期 Created→Estimated→Scheduled→Released→Started→Reported as finished→Ended。可由主規劃 firming planned order、銷售訂單行（pegged supply）或手動建立。

關鍵屬性：item（產品）、quantity（數量）、planned finish date（計畫完工日）、status（Created/Estimated/Scheduled/Released/Started/Reported as finished/Ended）、production BOM 參照、route 參照

關聯：
- 一張生產訂單 對一個 產品（item）
- 一張生產訂單 對一份 生產用料表（production BOM）
- 一張生產訂單 對一條 工藝路線（route），路線下對多 工序作業（operations）
- 一張生產訂單 對多 子生產訂單（subproduction，pegged supply）

### 批次訂單（Batch order）

流程業或離散流程用的訂單型別，以配方（formula）而非 BOM 為換算基礎，可產出共產品（co-products）與副產品（by-products）。使用 Formula 型 BOM 與路線。

關鍵屬性：formula（配方）、co-products、by-products、route

關聯：
- 一張批次訂單 對一份 配方型 BOM
- 一張批次訂單 對多 共產品與副產品

### 看板（Kanban / Kanban job）

精實製造（lean manufacturing）訊號單元，基於生產流（production flow）、看板規則（kanban rules）與 BOM。看板工作（kanban job）在看板排程板或自動排程下產生。

關鍵屬性：kanban rule、production flow 參照、kanban job、kanban card

關聯：
- 一條 生產流（production flow）對多 活動（activities）與 看板規則
- 一張看板規則 對多 看板工作（kanban job）

### 生產用料表（Production BOM）

生產訂單兩大主實體之一，依選定產品與數量從主檔複製到訂單，啟動前可編輯。BOM 行可標 Pegged supply，估算時自動產生採購/外包工序服務並 peg 到生產訂單。

關鍵屬性：BOM line（用料行）、quantity per、Pegged supply 標記、line type

關聯：
- 一份 BOM 對多 BOM 行（用料行）
- 一條 BOM 行 對一個 物料（component item）
- released 後 BOM 行下放為 倉儲工作（warehouse work）

### 工藝路線與工序作業（Route / Route operation）

生產訂單另一主實體，定義工序順序、各工序設定時間（setup）與執行時間（run time）、所需資源/資源群組與能力。每工序排程時被指派到符合資源需求的資源或資源群組。

關鍵屬性：operation number（工序號）、run time / setup time（執行/設定時間）、route group（路線群組，控制是否產生工作 job）、resource requirement（資源需求：特定資源/資源群組/型別/能力 capability）、costing resource（成本估算用資源）

關聯：
- 一條路線 對多 工序作業（operation）
- 一個工序作業 對一個 資源需求（resource requirement）
- 一個工序作業（job scheduling 下）爆破為多 工作（job）
- 一個工序作業 對一個 路線群組（route group）

### 工作（Job）

工作排程（job scheduling）下將工序爆破成的最小可排程任務，依路線群組設定決定產生哪些工作型別（如執行時間工作、運輸時間工作等），僅在有具體工期時產生。指派到具體資源並以有限產能保證不重疊。

關鍵屬性：job type（依 route group 設定，如 process time job / transport time job）、start/end date-time、assigned resource

關聯：
- 多個工作 屬於 一個工序作業
- 一個工作 對一個 操作資源（operations resource）
- 一張生產訂單最多排程 32 個資源/工序

### 操作資源（Operations resource / WrkCtr*）

執行生產或專案活動的機器、工具、人員、設施、場地或供應商。型別 Vendor、Human resources、Machine、Tool、Location、Facility。具能力（capability）、月曆（calendar）、效率%、有限產能旗標、瓶頸資源旗標等。

關鍵屬性：resource type（Vendor/Human resources/Machine/Tool/Location/Facility）、Capacity（每小時產能）、Batch capacity（單次最大件數）、Efficiency percentage（效率%）、Finite capacity（有限產能 Yes/No）、Bottleneck resource（瓶頸）、Exclusive（獨佔）、capability（能力）、calendar（月曆）

關聯：
- 一個操作資源 對多 能力（capability）
- 一個操作資源 對一個（同時段）月曆
- 一個操作資源 可屬 多個資源群組（不可同時段重疊）
- Vendor 型資源 連結 一個供應商帳戶

### 資源群組（Resource group / WrkCtrResourceGroup）

一組操作資源，是工序排程（operations scheduling）的排程粒度，通常對應車間/工作單元。定義站別（site）、生產單位、倉庫上下文。產能=群內各資源產能之和。可標為精實工作單元（lean work cell）直接在群組上設產能。

關鍵屬性：site（站別）、production unit 參照、picking/storage warehouse、lean work cell 標記、input/output warehouse + location、calendar

關聯：
- 一個資源群組 對多 操作資源
- 一個資源群組 屬於 一個生產單位（production unit）
- 一個資源群組（lean work cell 時）對一條 生產流

### 生產單位（Production unit）

資源群組的集合，反映生產資源實體佈局，對交易處理無影響，用於彙整與篩選生產資料（如車間主管看某生產單位待辦負載與可用產能）。必須關聯站別，可指派揀貨倉與儲存倉。

關鍵屬性：site、picking warehouse、storage warehouse

關聯：
- 一個生產單位 對多 資源群組
- 一個資源群組 只屬於 一個生產單位
- 一個生產單位 對一個 站別（site）

### 庫存交易（Inventory transaction / InventTrans）+ 庫存維度（InventDim）

標準庫存交易，承載財務/成本資訊與來源單據（如銷售行預留）。庫存維度 InventDim 承載 site/warehouse/location/license plate/batch/serial。生產物料發料（issue）、成品入庫（receipt）皆生成此類交易。

關鍵屬性：transaction status（On order/Ordered/Reserved/Picked/Received 等）、financial/cost info、inventory dimensions（site, warehouse, location, license plate, batch, serial）

關聯：
- 一筆庫存交易 對一個 物料 + 一組 庫存維度
- 物料消耗 produces issue 交易；成品入庫 produces receipt 交易

### 倉儲庫存交易（Warehouse transaction / WHSInventoryTransactionTable）

10.0.32+ 引進、為倉儲作業最佳化的不可變交易記錄，不含財務/成本資訊，可批次操作不同 serial/batch 的 item set（ItemSetId）。型別由 WHSInventoryTransactionTypeEnum 定義四種。完工封板後頻繁封存（archive）。

關鍵屬性：transaction type（Registered issue / Registered receipt / Physical reservation / Removed physical reservation）、ItemSetId、license plate、immutable（不可變）

關聯：
- 一筆倉儲交易 對一個 item set（多 serial/batch）
- 倉儲工作完成後 對應 封存的倉儲交易
- 來源單據交易仍走 InventTrans，倉儲工作走 WHSInventoryTransactionTable

### 倉儲工作 / 工作行（Warehouse work / work line）

生產訂單 released 時 BOM 行下放給倉儲管理，依倉庫設定產生 wave 與 work（揀料、上架）。完工時來源庫存交易更新為 Picked 並指派具體維度。

關鍵屬性：work type（pick/put-away）、location directive（位置指令）、wave

關聯：
- 一張生產訂單 released 對多 倉儲工作（原料揀料 + 成品上架 put-away）
- 成品報完工 對一筆 put-away work（移至成品倉或出貨區）

### 生產日記帳（Production journals：Picking list / Route card / Job card / Report as finished）

生產回報的四類日記帳。揀料清單記物料消耗；路線卡（operations scheduling 下）與工作卡（job scheduling 下）記工時/資源消耗；報完工日記帳記成品入庫與良品/不良品。表單名 ProdJournalTransProd / ProdJournalTransRoute / ProdJournalTransJob。

關鍵屬性：picking list journal（物料消耗→WIP）、route card journal / job card journal（工時→WIP）、report as finished journal（成品入庫）、good quantity / error quantity

關聯：
- 一張生產訂單 對多 生產日記帳
- 路線卡/工作卡 對多 工時行（綁資源/工作）
- 報完工日記帳 對多 成品入庫行（含良品/不良品）

## 二、資料流程

### 生產訂單生命週期（Created → Ended 全流程）

1. Created：主規劃 firm planned order / 銷售訂單行 pegged / 手動建立生產訂單，複製 BOM 與路線
2. Estimated：估算物料與資源消耗，原料生成 On order 庫存交易；Pegged supply 行生成採購/外包單並 peg
3. Scheduled：工序排程（粗排，指派起迄日與成本中心群組）與/或工作排程（細排，爆破成工作、指派資源、有限產能）
4. Released：排程完成且料可揀時下達；列印揀料清單/工作卡/路線卡；BOM 行下放倉儲管理產生 wave 與 work
5. Prepared/Picked：料與資源備齊於生產地點，BOM 行更新為 Picked
6. Started：開工，可回報物料與資源消耗；可設定開工時自動過帳（preflushing/forward flushing/autoconsumption）
7. Report progress/Complete：以 MES 終端 / 生產日記帳 / 看板板 / 行動掃描按工作或資源回報進度
8. Reported as finished：成品（含共/副產品）數量更新為 on-hand；WIP 帳減少、成品庫存增加（標準成本）
9. Quality assessment：依品質關聯設定觸發品質單（quality order），可更新庫存狀態/批次屬性
10. Put away & Ship to order：上架工作將成品送往下站/成品倉/出貨區
11. Ended：計算實際成本，估算成本沖回換實際成本，勾 End job 鎖單防再過帳
12. Period closure：依成本法（periodic average/backflush/FIFO/LIFO）期末結轉

### 物料消耗與成品入庫的庫存/帳務流（生產執行域核心）

1. 原料 On order：估算生成原料 On order 庫存交易
2. 原料發料：揀料清單日記帳（picking list journal）過帳 → 生成 issue 交易扣減 on-hand → 原料 WIP 值入 Picking list account 與 Picking list offset account
3. 工時消耗：路線卡/工作卡日記帳過帳 → 工時價值入資源在製（WIP）帳
4. 成品入庫：報完工日記帳（Report as finished journal）→ 成品數量入 on-hand → 減 WIP 帳、增成品庫存（標準成本）
5. 不良品處理：error quantity 之值可分攤到良品（good quantity），或過帳到專屬廢料帳（scrap account）
6. 結單：End 時算實際成本，沖回估算成本，成品成本借 inventory Receipt account、貸 inventory Issues account，標準法差異入損益帳

### 工序作業 → 工作 → 資源產能預留（排程資料流）

1. 工序作業定義執行/設定時間與資源需求（特定資源/資源群組/型別/能力）
2. 工序排程（operations scheduling）：按路線順序在符合需求的資源群組上預留產能（不選具體資源）
3. 工作排程（job scheduling）：工序爆破成工作，依 route group 設定決定產生哪些工作型別
4. 有限產能：依資源可用月曆與既有預留，保證起迄不重疊；可正排（forward/push）或逆排（backward/pull）
5. 資源選擇：依 Primary resource selection（Duration 取最短前置/Priority 取最高優先）；效率%調整排程時間 = Time × 100 ÷ Efficiency%（Time 含 run + setup）
6. 以 Gantt 圖檢視與調整；瓶頸資源在啟用 Bottleneck scheduling 時以有限產能排

### 倉儲交易與來源單據交易的雙軌（10.0.32+）

1. 來源單據（如生產 BOM 行預留）仍以 InventTrans 表示，走庫存堆疊
2. 生產訂單 released → BOM 行下放倉儲 → 產生倉儲工作（用 WHSInventoryTransactionTable）
3. 現場行動裝置揀料/上架 → 生成 Registered issue / Registered receipt 倉儲交易（不可變、可批次 item set）
4. 工作完成 → 來源庫存交易更新為 Picked 並指派具體維度
5. 工作封板 → 背景程序 Archive warehouse inventory transactions 每 10 分鐘將相關倉儲交易封存
6. 有財務影響的作業（盤點 counting、adjust-in/out）仍走 InventTrans

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| 生產控制（Production control）核心 | 生產訂單管理（建立/估算/排程/下達/開工/報完工/結單）、批次訂單（流程業，配方+共/副產品）、看板（精實製造訊號）、生產用料表（production BOM）與工藝路線（route）維護、工序作業（route operation）與路線群組（route group）設定、生產地板執行介面（production floor execution interface）/ MES 終端回報、車間主管工作區（shop floor supervisor workspace） |
| 排程與產能 | 工序排程（operations scheduling，粗排）、工作排程（job scheduling，細排，工序爆破成工作）、有限產能排程（finite capacity scheduling）、有限物料（finite materials）、有限屬性（finite properties）、正排/逆排（forward push / backward pull）、Gantt 圖檢視與手動調整、瓶頸資源排程（bottleneck scheduling）、主規劃 / 規劃最佳化（Planning Optimization）支援有限產能資源排程 |
| 操作資源與能力 | 操作資源生命週期管理（六型別）、資源群組（resource group）/ 生產單位（production unit）、能力（capability）與人員職能（competency）匹配、月曆/工時產能、效率百分比、批次產能、精實工作單元（lean work cell） |
| 生產回報（shop floor data collection） | 揀料清單日記帳（picking list journal）、路線卡日記帳（route card journal）、工作卡日記帳（job card journal）、報完工日記帳（report as finished journal）、良品（good quantity）/ 不良品（error quantity）回報與不良原因（error reason）、工時打卡（time registration，MES 終端）、Preflushing / forward flushing / backflushing 自動過帳 |
| 庫存管理（Inventory management） | 按維度（site/warehouse/location/batch/serial/license plate）追蹤 on-hand、庫存交易（InventTrans）/ 庫存維度（InventDim）、盤點（counting）/ 調整（adjust-in/out）日記帳、Inventory Visibility（即時可視性，跨系統）、批次屬性（batch attributes）/ 序號追蹤 |
| 倉儲管理（Warehouse management / WHS） | 倉儲工作（work）/ wave / 位置指令（location directive）、倉儲庫存交易（WHSInventoryTransactionTable，四型別）、License plate / item set 批次操作、上架（put-away）/ 揀料（pick）、行動裝置 App 回報、倉儲交易封存（archive） |
| 品質與成本 | 品質單（quality order）/ 品質關聯（quality association）、生產過帳（production posting，WIP 帳務）、成本計算（標準成本 / 實際成本 FIFO/LIFO/移動平均/週期加權平均）、廢料帳（scrap account）/ 不良品成本分攤、backflush costing（精實製造） |
| 管理層分析 | Power BI 嵌入式儀表板與 KPI、Sensor Data Intelligence（IoT 感測器智慧）驅動 OEE 與預測性維護、生產效率 / 成本 / 資源稼動分析 |

## 四、庫存處理（Miles 重點關注）

庫存是本系統最成熟的部分，採「雙軌交易 + 多維度 on-hand」建模，對感官特別值得參考。(1) 物料（原料）：估算階段生成 On order 庫存交易；揀料清單日記帳（picking list journal）過帳時生成 issue 交易扣減 on-hand，並把原料 WIP 值入 Picking list account 與 Picking list offset account。可設定開工時自動發料（preflushing / forward flushing），或報完工時按比例倒扣（backflushing）。(2) 在製品（WIP）：不以獨立「WIP 庫存實體」建模，而是以帳務 WIP 科目承載——物料 WIP（揀料清單帳）與資源/工時 WIP（路線卡/工作卡帳）在開工到報完工期間累積於 WIP 科目，結單（End）時沖回估算成本換實際成本後結清。換言之 WIP 是「生產訂單尚未結轉的成本累積」，而非倉位上的實體數量。(3) 成品：報完工日記帳（Report as finished journal）把良品數量（含共產品/副產品）更新為 on-hand，減 WIP 帳、增成品庫存（標準成本），並可觸發 put-away 倉儲工作移至成品倉/出貨區。(4) 多維度追蹤：on-hand 永遠綁定庫存維度（site / warehouse / location / license plate / batch / serial），由 InventDim 承載；10.0.32+ 對倉儲作業改用最佳化的 WHSInventoryTransactionTable（四型別：Registered issue / Registered receipt / Physical reservation / Removed physical reservation），不可變、可用 item set 批次處理大量 serial/batch，但來源單據與有財務影響的作業（盤點/調整）仍走 InventTrans。官方明確說明 on-hand 目前無計畫與 InventTrans / WHSInventReserve 解耦。

## 五、排程與產能

採兩級排程 + 有限產能。工序排程（operations scheduling）是粗排/長期計畫，按路線工序順序在符合資源需求的資源群組上預留產能，不選具體資源；資源群組產能=群內各資源可用產能之和。工作排程（job scheduling）是細排，將每個工序爆破成個別工作（job，依 route group 設定決定產生哪些工作型別，僅在有具體工期時產生），指派到具體操作資源。有限產能（finite capacity）：排定產能不得超過資源可用產能（可用=資源可用且無其他預留的時段），保證同資源工作起迄不重疊；資源層級可設 Finite capacity = Yes 才被當作有限，否則視為無限可被超訂。排程方向可正排（forward/push，盡早開工）或逆排（backward/pull，依交期回推最晚開工）。資源選擇由 Primary resource selection 控制（Duration 取最短前置時間 / Priority 取最高優先序）；效率百分比調整排程時間（Scheduling time = Time × 100 ÷ Efficiency%，Time 含 run + setup）。瓶頸資源（bottleneck resource）在主計畫啟用 Bottleneck scheduling 時以有限產能排。亦支援有限物料（finite materials，料到才排）與有限屬性。單工序最多排 32 個資源。可在 Gantt 圖檢視調整。Planning Optimization（規劃最佳化引擎）自 2022 wave 1 起支援有限產能資源排程。

## 六、拼版優化（印刷特化）

不適用 / 無此原生功能。Dynamics 365 SCM 的製造模組（含精實製造架構：production flow / kanban rules / BOM）無印刷業的拼版、併單（gang-run）、版面 nesting 概念。它的「批次」是流程業配方（formula）與共/副產品概念，與印刷「同一印版上拼多件不同訂單以省版/省料」的拼版優化在語意與資料模型上不同。SCM 的 Batch capacity（資源每次可處理最大件數）僅是產能上限參數，非拼版求解器。若感官要在此類系統上做拼版，須外掛專用拼版/nesting 引擎或客製。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| 良品數量 / 不良品數量（Good quantity / Error quantity） | 報完工時逐行回報的欄位。Error quantity 可附不良原因（error reason）。系統參數 Increase remain qty with error qty 控制不良數是否回補剩餘待產數。是系統內建、可直接量化的折損基礎資料。 |
| 折損 / 廢料成本處理（Scrap） | 非以「折損率%」公式內建，而是成本處理選項：error quantity 之值可分攤到 good quantity（攤入良品成本），或過帳到專屬廢料帳（scrap account）。折損率需由 good/error quantity 自行於 Power BI 計算。 |
| 資源效率百分比（Efficiency percentage） | 資源主檔屬性，影響排程時間：Scheduling time = Time × 100 ÷ Efficiency%（Time 含 run + setup）。是排程用的效率參數，非事後實績稼動率。 |
| OEE（Overall Equipment Effectiveness 整體設備效率） | 非生產控制模組內建的計算欄位；官方定位為透過 Sensor Data Intelligence（IoT 感測器資料 + AI 異常偵測）驅動預測性維護與改善 OEE，並以 Power BI 呈現。OEE 本身需經感測器資料方案/Power BI 組裝，無文件化的固定公式內建於生產訂單。 |
| 資源負載 / 產能稼動（capacity load） | 工作排程時系統計算資源 load；資源群組可用產能=群內資源產能和，既有預留視為不可用。可在車間主管工作區/Gantt 檢視待辦負載 vs 可用產能。屬排程面負載視圖，非標準化稼動率 KPI 欄位。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- WIP 以帳務科目累積而非實體庫位建模：物料 WIP（揀料清單帳）+ 工時 WIP（路線卡/工作卡帳），結單時沖回估算換實際成本。感官現有「在製品是痛點」可借此思路——WIP 不必是一個倉位數量，而是工單尚未結轉的成本/數量累積，按生產任務歸集。
- 良品/不良品在報完工這一個動作同時回報（good quantity + error quantity + error reason），折損資料在源頭一次採集，再由 BI 算折損率；感官品檢模組可參考此「源頭一次回報、分母分子齊備」設計，避免折損率事後拼湊。
- 不良品成本兩種去向（攤入良品 vs 進專屬廢料帳）作為可設定選項：感官可借鏡『折損成本歸屬』需明確化——是攤進良品單價還是獨立廢料科目，影響成本與報價。
- 兩級排程（工序排程粗排→工作排程細排）對應感官既有『排程中心 + 派工看板』：可借鏡『粗排只到資源群組、細排才到具體設備+保證不重疊』的分層，避免一開始就硬排到機台。
- 資源以『能力（capability）+ 月曆 + 效率% + 有限產能旗標 + 瓶頸旗標』建模，排程時用能力匹配而非寫死機台：感官工序主檔可借鏡用『能力需求』而非綁定特定設備，提升換機/外包彈性（印刷某些工序可多機台或外包）。
- 倉儲交易雙軌（來源單據走 InventTrans、現場揀料/上架走最佳化的 WHSInventoryTransactionTable、可批次 item set、不可變、定期封存）：感官若有大量批號/序號或現場掃描，可借鏡『現場高頻交易與財務交易分軌、現場交易不可變+封存』以保效能與稽核。
- 效率百分比公式（Scheduling time = Time × 100 ÷ Efficiency%）可直接借入感官回溯排程，把設備實績效率納入工期估算。
- 瓶頸資源（bottleneck resource）顯式標記 + 僅瓶頸用有限產能排：印刷常見少數機台（如特定印刷機/上光機）是瓶頸，感官可借鏡只對瓶頸做有限產能、其餘無限，降低排程複雜度。

**不適用 / 不照搬**：
- 拼版/併單/nesting 優化：無原生功能，感官的拼版需求無法直接對應。
- 印刷專屬 KPI（如印刷折損率、印張數、令數、開數、上機損耗）：系統無印刷術語與內建公式，只給 good/error quantity 原料，須自行於 BI 組裝。
- OEE 內建公式：非生產控制模組原生計算，需經 IoT/Sensor Data Intelligence 或 Power BI 客製，不能視為現成印刷稼動率指標。
- 配方（formula）+ 共/副產品的批次訂單：偏流程業（化工/食品），印刷以離散生產訂單為主，此型別對感官多數情境不適用。
- 系統定位為大型企業 ERP，導入與客製成本高；感官作為單廠 MTO 印刷廠，整套採用過重，宜借鏡架構而非照搬。

## 來源（真實查證）

- [Production process overview - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/production-process-overview) — 完整生產生命週期 12 階段（Created→Period closure）、三型別訂單（production order/batch order/kanban）、混合製造原則（MTS/MTO/CTO/ETO）、preflushing/backflushing、報完工與 WIP 帳務描述、路線卡/工作卡/揀料清單/報完工日記帳定位、品質單觸發
- [Operations resources - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/operations-resources) — 操作資源六型別、能力(capability)、月曆與產能、效率%公式、有限產能/瓶頸/獨佔旗標、資源群組與生產單位定義及關聯、精實工作單元(lean work cell)、costing resource、單工序資源關係
- [Job scheduling - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/job-scheduling) — 工作排程 vs 工序排程、工序爆破成工作、route group 控制是否產生工作、有限產能/有限物料/有限屬性、正排逆排(push/pull)、Primary resource selection(Duration/Priority)、最多 32 資源、效率%公式、Gantt
- [Warehouse-specific inventory transactions - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/warehouse-transactions) — WHSInventoryTransactionTable 四型別(Registered issue/receipt/Physical reservation/Removed physical reservation)、WHSInventoryTransactionTypeEnum、ItemSetId、不可變與封存(每10分鐘 Archive 程序)、與 InventTrans/InventDim/WHSInventReserve 關係、來源單據仍走 InventTrans
- [Production order lifecycle overview (Create a production order) - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/create-production-orders) — 生產訂單核心欄位(what/quantity/planned finish date)、Created/Ended 狀態、production BOM 與 route 為兩大主實體並複製自主檔、建立來源(主規劃/銷售行 pegged/手動)、表單 ProdTable
- [Report production orders as finished - Dynamics 365 SCM | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/report-production-orders-as-finished) — 報完工流程、good/error quantity 與 error reason、backflushing、報完工三途徑(標準更新/路線卡工作卡/報完工日記帳)、put-away、品質單關聯、表單 ProdJournalTrans*/ProdParmReportFinished
- [Production posting - Dynamics 365 SCM (Cost management) | Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/production-posting) — 揀料清單帳→Picking list account/offset(物料 WIP)、路線卡/工作卡帳→資源 WIP、報完工帳→成品入庫(標準成本)、結單沖回估算換實際成本、error quantity 兩種去向(攤入良品/scrap account)、Ledger posting 三層級
- [Lean manufacturing overview - Dynamics 365 SCM | Microsoft Learn（WebSearch 摘要）](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/lean-manufacturing-overview) — 精實製造架構(production flow/activities/kanban rules)、混合模式可混用 production order/batch order/purchase order/transfer order、看板卡與揀料清單列印、可經 journals/MES Terminal/kanban board 回報——用於確認無拼版/nesting 原生功能
- [Supply Chain Management capabilities - Microsoft Dynamics 365（WebSearch 多來源摘要）](https://dynamics.microsoft.com/en-ca/supply-chain-management/capabilities/) — 確認 OEE 經 Sensor Data Intelligence(IoT)+AI 異常偵測驅動、Power BI 嵌入式儀表板提供 KPI/趨勢；OEE 非生產控制模組內建固定公式——用於 KPI 段誠實標註

## 查無公開資料（誠實標註，禁編造補齊）

- Dynamics 365 SCM 為閉源商業系統，內部資料庫實體關聯圖(完整 schema/欄位清單)不公開；本研究僅取得官方文件層級的概念實體與被點名的資料表/表單名(InventTrans、InventDim、WHSInventoryTransactionTable、WHSInventReserve、ProdTable、WrkCtr*、ProdJournalTrans*)，未取得各表完整欄位定義。
- OEE 的內建計算公式(Availability×Performance×Quality)未在生產控制官方文件中以可引用的固定公式呈現；官方僅述其經 Sensor Data Intelligence/Power BI 達成，故未列為內建 KPI 公式。
- 印刷折損率、稼動率等標準化 KPI 的內建定義/門檻：系統提供 good/error quantity 原始資料但無內建折損率%欄位或公式。
- 拼版/imposition/gang-run/nesting：確認無原生功能(非查不到，而是系統不具備)。
- 看板(kanban)與批次訂單的底層資料實體欄位細節僅取得 WebSearch 摘要層級，未逐頁 WebFetch 其資料模型欄位，故 ER 段對 kanban/batch order 的屬性以官方概念描述為主、未深入欄位級。

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

抽查 6 個關鍵 Microsoft Learn URL，全部真實可達且內容相符（HTTP 200，非死連結、非編造路徑）：

1. job-scheduling — 確認「工序爆破成工作（Explode operations into jobs）」「route group 控制是否產生工作、僅在有具體工期時產生」「finite capacity / finite materials / finite properties」「forward=push / backward=pull」「Primary resource selection: Duration（最短前置）/ Priority（最高優先=最低數值）」「最多 32 資源/工序（maximum of 32 resources per operation）」「Scheduling time = Time × 100 ÷ Efficiency percentage，Time 含 run+setup」——全部逐字命中。

2. warehouse-transactions — 逐字確認 WHSInventoryTransactionTable、四型別（Registered issue / Registered receipt / Physical reservation / Removed physical reservation）由 WHSInventoryTransactionTypeEnum 定義、ItemSetId、immutable、Archive warehouse inventory transactions 背景程序「預設每 10 分鐘」、10.0.32+ 引進、不含財務資訊（有財務影響的盤點/adjust 仍走 InventTrans）、FAQ「無計畫將 on-hand 與 InventTrans/WHSInventReserve 解耦」——全部命中，連 WHSWarehouseInventoryTransactionFeatureExtensionValidator 類名都正確。

3. production-posting — 確認 Picking list account + Picking list offset account（物料 WIP）、Route card/Job card journal → 資源 WIP、Report as finished 用標準成本減 WIP 增成品、End 時沖回估算換實際成本（借 inventory Receipt account、貸 inventory Issues account）、error quantity 兩去向（攤入良品 vs 專屬 scrap account）、Ledger posting 三層級——全部命中。metadata ms.search.form 含 WrkCtrResourceGroup、WrkCtrTable。

4. operations-resources — 確認六型別（Vendor / Human resources / Machine / Tool / Location / Facility）、capability、calendar（同時段只能一個）、Efficiency percentage 公式、Finite capacity Yes/No（No=無限可超訂）、Bottleneck resource、Batch capacity、Exclusive、resource group 產能=群內資源和、production unit「has no effect on transactions」、lean work cell——全部命中。

5. create-production-orders — metadata ms.search.form: ProdTable, ProdTableCreate（證實 ProdTable 表名非編造）；Created/Ended 狀態、BOM+route 為兩大主實體並複製自主檔、三建立來源（主規劃/銷售行 pegged/手動）——全部命中。

6. report-production-orders-as-finished — metadata ms.search.form 逐字含 ProdJournalTransJob, ProdJournalTransProd, ProdJournalTransRoute, ProdParmReportFinished（證實研究列的 ProdJournalTrans* 系列表名真實）；good/error quantity + error reason、backflushing、putaway、quality order 經 quality association 觸發——全部命中。

關鍵發現：研究中最易被誤判為「閉源系統卻給出過於具體內部表名」的部分（ProdTable、WrkCtr*、ProdJournalTrans*、InventTrans、InventDim、WHSInventReserve），實際上都來自 Microsoft Learn 官方頁面的 ms.search.form metadata 與正文，屬有來源支撐，非套模板編造。研究在 sources[].what_obtained 已正確標註出處層級，並在 not_found 誠實聲明「未取得各表完整欄位定義」「OEE 無內建公式」「無拼版/nesting」——epistemic 紀律良好。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- 「一張生產訂單最多排程 32 個資源/工序」的措辭略有偏差：官方原文是「maximum of 32 resources per operation」（每一工序最多 32 個資源），研究在 Job 實體的 relationships 寫成「一張生產訂單最多排程 32 個資源/工序」可能被讀成生產訂單層級上限。這是範圍描述的輕微不精確，非編造（數字與來源正確），建議改為「每一工序最多排程 32 個資源」。
- 資源群組表名標為 WrkCtrResourceGroup：此名出現在 production-posting 與 operations-resources 的 ms.search.form metadata，屬「表單/查詢名」而非經確認的資料庫實體表名；研究在 entity 標題用「（Resource group / WrkCtrResourceGroup）」隱含其為 DB 表，嚴格說 metadata 證實的是 form name。屬 low severity，因 Dynamics 中 form 名常與底層 table 同名，且研究 not_found 已聲明未取得完整 schema。
- Sensor Data Intelligence 驅動 OEE 與預測性維護、Power BI 嵌入式儀表板：此宣稱的來源 sources[8]（dynamics.microsoft.com capabilities 頁 + WebSearch 多來源摘要）本次未直接 WebFetch 驗證，屬 capabilities 行銷頁層級。研究已誠實在 KPI 段與 not_found 標註「OEE 非生產控制模組內建固定公式、須經 IoT/Power BI 客製」，立場誠實，但該頁本身內容未在本次抽查中逐字確認。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- 將 Job 實體 relationships 的「一張生產訂單最多排程 32 個資源/工序」改為「每一工序最多排程 32 個資源（maximum of 32 resources per operation）」，避免被誤讀為生產訂單層級上限。
- 資源群組實體標題的「WrkCtrResourceGroup」宜註明來源層級為「Microsoft Learn ms.search.form 表單名」，與已逐字確認的 InventTrans / WHSInventoryTransactionTable（正文確認）區分，措辭上不宜一律當作 DB 表名呈現（雖 not_found 已總體聲明，個別 entity 標題仍可加註）。
- 建議補一句驗證標記：sources[7] lean-manufacturing-overview 與 sources[8] capabilities 兩條標為「WebSearch 摘要」者，本次未逐頁 WebFetch；OEE / Sensor Data Intelligence 相關宣稱的可信度依賴該兩條，閱讀時應視為「行銷頁/摘要層級」而非「官方技術文件逐字確認」。

**來源充分、可信度高的內容**：
- 生產訂單生命週期與 WIP 帳務模型（Created→Ended、揀料清單帳→Picking list account/offset、路線卡/工作卡帳→資源 WIP、報完工用標準成本、End 沖回估算換實際成本、error quantity 攤入良品或進 scrap account）——production-posting + create-production-orders 逐字支撐，可信度高。
- 兩級排程 + 有限產能模型（operations scheduling 粗排到資源群組、job scheduling 細排爆破成工作、route group 控制是否產生工作、finite capacity/materials/properties、forward push/backward pull、Duration/Priority 資源選擇、效率%公式、32 資源/工序）——job-scheduling + operations-resources 逐字支撐，是本研究最扎實的段落。
- 倉儲交易雙軌模型（10.0.32+ WHSInventoryTransactionTable、四型別由 WHSInventoryTransactionTypeEnum 定義、ItemSetId 批次、immutable、每 10 分鐘 Archive、來源單據與財務影響作業仍走 InventTrans、on-hand 未計畫與 InventTrans/WHSInventReserve 解耦）——warehouse-transactions 逐字支撐，包含 FAQ 原文，可信度高。
- 操作資源建模（六型別 Vendor/Human resources/Machine/Tool/Location/Facility、capability、calendar 同時段唯一、Efficiency%、Finite capacity Yes/No、Bottleneck、Batch capacity、Exclusive、resource group 產能=群內和、production unit 對交易無影響、lean work cell、costing resource）——operations-resources 逐字支撐。
- 內部表名/表單名（ProdTable、ProdJournalTransProd/Route/Job、ProdParmReportFinished、WrkCtrResourceGroup、WrkCtrTable、InventTrans、InventDim、WHSInventoryTransactionTable、WHSInventReserve、ItemSetId）皆有 Microsoft Learn 頁面 metadata 或正文支撐，非閉源系統的幻覺編造——這點對抗式驗證特別關注，結論為 supported。
- not_applicable 與 not_found 段的誠實聲明（無拼版/imposition/gang-run/nesting 原生功能、OEE 無內建固定公式須經 IoT/Power BI 組裝、無印刷折損率%欄位、完整 DB schema 不公開）——立場誠實，未誇大系統能力，符合防幻覺要求。
