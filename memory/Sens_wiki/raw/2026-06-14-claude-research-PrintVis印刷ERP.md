---
type: raw
status: raw
created-at: 2026-06-14
source: claude-research
captured-by: claude-on-task
module:
  - 工單
  - 生產任務
  - 印件
  - 工序主檔
topic-tag:
  - MES
  - PrintVis
  - 印刷MIS
  - 估價
  - 拼版
  - 印刷工序
  - 成本對比
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[印件]]"
raw-source-link: https://learn.printvis.com/Pages/pvscasemanagement/
attached-files: []
---

# PrintVis (Print MIS/ERP for Microsoft Dynamics 365 Business Central) — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：印刷專用 MIS/ERP（建構於 Microsoft Dynamics 365 Business Central 之上的印刷垂直解決方案）

## 系統定位概述

PrintVis 是植入（embedded）於 Microsoft Dynamics 365 Business Central 之內的印刷專用 MIS/ERP，以「Case（案件）」為中央資料樞紐，把報價、估價、訂單、生產排程、出貨、發票與成本核算（job costing）全部維護在同一資料結構與同一資料庫中。生產執行面以「規劃單位（Planning Unit）／產能單位（Capacity Unit）」做有限產能排程，並透過 Shop Floor 模組（電子工票、條碼生產標籤、DCM 資料採集模組）回報工時與數量；庫存與紙張管理直接複用 Business Central 的 Item / Item Ledger Entry，再以 PrintVis 自有的單位換算（庫存單位 vs 計價單位）解決紙張「以張計量、以重量計價」的痛點。閉源商業系統，公開文件僅到「資料實體 / 物件模型 / 設定欄位」層級，底層資料庫表結構不公開（learn.printvis.com 為官方文件來源）。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### Case（案件）

中央資料樞紐，從報價到發票封裝該案所有資訊。核心欄位含 Sell-To 客戶、Order Type、Product Group、Bill-To 客戶、Status（Request/Quote/Order）。Info 段追蹤需求完成、估價完成、轉訂單、生產完成、封存等日期。

關鍵屬性：Sell-To customer、Order Type、Product Group、Bill-To customer、Status(Request/Quote/Order)、Info 段日期戳記

關聯：
- 一張 Case 對多 Job（一案可多個 Job 同時 Active）
- Case 對一 Sell-To 客戶

### Job（工作／工件）

每個 Job Number 代表一個被生產的獨立產品；各自有獨立的估價、生產排程與出貨。Job Type 隨 Case 狀態而為 Request/Quote/Order/Production Order。

關鍵屬性：Job Number、Version Number(起始 1)、Job Type(Request/Quote/Order/Production Order)、Ordered quantity、Page count、Format size、Colors、Requested shipment date、Quoted price、Contribution margin

關聯：
- 多個 Job 屬一張 Case
- 一個 Job 對多 Sheet 與 Job Item
- 一個 Job 對多 Calculation Unit / 估價線

### Sheet（印張）

定義為「穿過印刷機的單一承印物（substrate）」，是印刷計算的基礎單位。

關鍵屬性：Substrate、Colors(front/back)、Number of pages、List of Units(印刷機與輔助設備)

關聯：
- 一個 Job 對多 Sheet
- 一個 Sheet 對多 Job Item(置於印張上之內容)
- Sheet 經 Imposition Type 決定拼版

### Job Item（印件項目／放在印張上之內容）

定義為「被放在印張上的東西」，描述產品組件。

關鍵屬性：Component type、Description、Number of pages、Colors(front/back)、Substrate、List of Units

關聯：
- 多個 Job Item 置於一個 Sheet
- Job Item 對一 Imposition Type

### Imposition Type（拼版型式）

治理內容如何拼到印刷面上的結構：Leafs Length/Width（垂直/水平拼幾頁）、Pages（自動計算總頁數）、Sheet length/width、Trim left、Milling Depth、Overfold、Bleed、Orientation(0/90/180/270)、Flip、Gripper Edge。型式分 Print/Print Dynamic/Die 三類，含 Priority 與 Auto Use 控制自動選用。

關鍵屬性：Leafs Length、Leafs Width、Pages、Sheet length/width、Bleed、Trim left、Milling Depth、Overfold、Gripper Edge、Priority、Auto Use、型式(Print/Print Dynamic/Die)

關聯：
- Imposition Type 對 Job Item（選定後過濾可用印刷機）
- Imposition Type 影響 Sheet 尺寸與頁數自動計算
- Imposition Range Setup 對應 web press 多塔(towers)

### Calculation Unit / Calculation Detail Line（計算單位／計算明細線）

估價計算的明細結構，承載 List of Units（印刷機與輔助設備）並透過公式（Formula 22/220 印刷、8/10 製版、9 點張）逐線計算工時與成本。

關鍵屬性：List of Units、Formula type(22/220/8/10/9)、計算時間(calculated time)

關聯：
- Calculation Unit 連結至 Planning Unit
- 一個 Job 對多 Calculation Detail Line
- Calculation Detail Line 對應 Sheet / 操作工序

### Planning Unit（規劃單位）

代表「一段被排程的工作」——需被放到某產能單位行事曆上的任務。由 Calculation Unit / Calculation Detail Line 取得計算時間，套用效率因子得出計畫時間；定義前置/後續（predecessors/successors，即工序順序）、buffer time、overlapping 百分比。狀態碼可由生產自動推進。

關鍵屬性：計算時間→計畫時間(套效率因子)、predecessors/successors(工序順序)、buffer time、overlapping %、status code 自動推進

關聯：
- Planning Unit 與 Calculation Unit 鬆耦合(非嚴格 1:1)
- 建議一部門一 Planning Unit
- Planning Unit 被排到 Capacity Unit 的可用行事曆

### Capacity Unit（產能單位）

代表一個物理資源（機台、工作位、產線），定義其何時、如何可被排程：opening hours、planned downtime、blocked capacity、效率因子。

關鍵屬性：opening hours、planned downtime、blocked capacity、效率因子

關聯：
- Capacity Unit 對 Cost Center 通常 1:1（亦可多 Cost Center 共用物理產能）
- Capacity Unit 承載多個 Planning Unit 的排程

### Cost Center（成本中心）

成本與工時歸集點，亦是 Shop Floor 生產標籤與資料採集的設定載體（Production Tracking options、allow Production Label Printing）。

關鍵屬性：Production Tracking options、number series(生產追蹤條碼)、allow Production Label Printing

關聯：
- Cost Center 對 Capacity Unit 通常 1:1
- Cost Center 收集 Job Costing 工時與消耗

### Item（物料：紙張/油墨/印版/外包/成品）

複用 BC Item 表（PrintVis 加欄位於 6010000..6011999 範圍）。分類：Print Substrates(紙/卡/PP)、Ink/Toner、Plates、Subcontracting(虛擬品不計庫存)、Finished Goods(選配)。

關鍵屬性：Width/Length/Weight、PrintVis Inventory Unit(pcs/meter/sq.m)、PrintVis Price Unit(相對庫存單位之計價單位)、PV Quantity / PV Unit Cost(採購線換算顯示)

關聯：
- Item 被 Job/Sheet 消耗
- 消耗產生 Item Ledger Entry(type=Sale) 連至 Job Costing Entry

### PrintVis Job Costing Entry（成本核算分錄）

歸集工時、機時、物料、外包之實際成本，連結至對應 Item Ledger Entry，無需事後對帳即可做利潤分析。

關鍵屬性：Direct Cost: Hours、Direct Cost: Materials、Direct Cost: Sub Contracting、Total Hours、Contribution Margin 1/2、Profit Ratio

關聯：
- Job Costing Entry 對一 Job
- Job Costing Entry 連結 Item Ledger Entry
- 彙整成 Job Costing report

### Production Label / SF Production Zone / SF Production Storage（生產標籤與在製品儲位）

Shop Floor 條碼標籤機制，標籤連到訂單號、含每標籤數量；標籤在成本中心間移動追蹤在製品，案件封存時才移除。

關鍵屬性：number of labels、quantity per label、consumed 標記、PrintVis SF Production Zone、PrintVis SF Production Storage

關聯：
- Production Label 對一 Job/Case
- Label 在 Cost Center 間移動代表 WIP 流轉
- Zone/Storage 代表實體在製品位置

## 二、資料流程

### 報價到訂單到生產（Case 生命週期）

1. 建立 Case，狀態 Request
2. 加入 Job（Job Type=Request），填印件規格（數量/頁數/尺寸/色數）
3. 估價自動化：依 Product Group Lookup Filter、色數上限、格式相容性過濾印刷機
4. 計算虛擬印張與殘張（fictitious sheet + residual sheet），算出含損耗張數、印版數、印次（impressions）
5. 逐線計算 List of Units（Formula 22/220/8/10/9），機台依成本由低到高排序供選
6. 狀態轉 Quote（Job Type=Quote），產生報價
7. 客戶下單，狀態轉 Order，Job Type 轉 Order / Production Order

### 估價到排程（Planning Unit → Capacity Unit）

1. 從 Calculation Unit / Calculation Detail Line 取得計算時間
2. 套用效率因子轉為計畫時間，建立 Planning Unit
3. Planning Unit 定義 predecessors/successors（工序順序）、buffer、overlapping
4. 系統依里程碑/瓶頸/詳細時間三層級之一排程，於新訂單時自動或半自動產生建議
5. Planning Unit 被放入對應 Capacity Unit 的可用行事曆（opening hours、避開 planned downtime/blocked capacity）
6. Planning Board（甘特圖式視覺看板）以色碼與分組呈現，供手動調整

### 生產回報（Shop Floor → 成本/庫存）

1. 電子工票（electronic job ticket）即時從資料庫推送生產指示給現場
2. 操作員於 Role Center 的 Started Jobs 視窗單擊取出工單，可繼續/停止/完工，多人可同時於同一 Cost Center 記工時
3. 印生產標籤（含每標籤數量），條碼隨件在 Cost Center 間移動
4. DCM 模組（MOXA E1210）自動採集 counting ticks 與 on/off 狀態，回報印量與 Setup/Print 模式
5. 好品與損耗數量、物料消耗、工時即時回貼至生產訂單
6. 物料消耗產生 Item Ledger Entry(type=Sale) 連至 Job Costing Entry，工時/機時/物料/外包進 BC 財務

### 完工入庫與出貨

1. Release Finished Goods 功能：透過標準 item journal 產生庫存，生成 Purchase 型 ledger entry
2. 或於出貨時 Shipments 的 Put On Stock：背景 Sales Order 產生庫存
3. 出貨產生對應 Job 的出貨單
4. Job Costing report 比對 Quote Estimation / Order Estimation / Actual Job Costing 三層，顯示金額與百分比差異
5. 案件封存（archive）時，已標 consumed 的生產標籤才移除

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| 案件與估價（Case & Estimation） | Case Management（中央案件樞紐，Request/Quote/Order 狀態）、多 Job 管理（一案多產品，各自估價/排程/出貨）、Estimation Automation（機台過濾、虛擬印張/殘張計算、含損耗張數與印次、印版數）、Calculation Unit / List of Units 公式計算（Formula 22/220 印刷、8/10 製版、9 點張）、Quick Quote / Newspaper setup 等估價變體、Imposition Types（Print/Print Dynamic/Die，含 Auto Use 自動選版） |
| 排程與產能（Planning & Scheduling） | Planning Unit / Capacity Unit 有限產能排程、三層級排程（里程碑 / 瓶頸詳排 / 全細節含日期時間與速度）、自動 + 手動排程（新訂單自動產生最佳化建議）、Planning Board（甘特式視覺看板，色碼/分組）、工序順序（predecessors/successors）、buffer time、overlapping %、狀態碼由生產自動推進 |
| 現場執行（Shop Floor / MES） | Electronic Job Ticket（即時電子工票）、Started Jobs 工時記錄（多人同 Cost Center、開始/停止/完工）、間接工時記錄（維護等可自動停止直接工時）、Production Label（條碼生產標籤，件隨成本中心移動）、DCM 資料採集模組（MOXA E1210，自動印量與 Setup/Print 狀態）、即時訂單狀態與機台可用產能顯示 |
| 庫存與採購（Inventory & Purchasing） | 紙張/承印物單位換算（庫存單位 vs 計價單位，張↔重量）、Item 分類（Substrate/Ink-Toner/Plates/Subcontracting/Finished Goods）、物料消耗即時回貼生產訂單、MRP（合併訂單、批量採購、報價時建議標準料）、BC 倉儲/履約/blanket order 整合 |
| 成本核算（Job Costing） | 工時/機時/物料/外包成本歸集（無需事後對帳）、Quote/Order/Actual 三層估價對比、差異分析（金額 + 百分比）、Contribution Margin 1/2、Profit Ratio、Error 與 Extra Work 成本（內部/客戶要求額外作業） |

## 四、庫存處理（Miles 重點關注）

PrintVis 不自建庫存引擎，而是複用 Business Central 的 Item / Item Ledger Entry，再以 PrintVis 自有欄位（加在 BC Item 表 6010000..6011999 範圍）解決印刷業的單位換算與多型態料件痛點。物料分五類：Print Substrates（紙/卡/PP）、Ink/Toner、Plates（印版）、Subcontracting（虛擬品，不計庫存）、Finished Goods（選配，供重複性產品）。紙張建模是重點：以 Width/Length/Weight 描述物理屬性，BC 基礎計量單位（base UOM）常為 PCS（張），但供應商常以重量計價（每 100kg / 每 1000 張）；PrintVis 用 PrintVis Inventory Unit（標準化為 pcs/meter/square meter）與 PrintVis Price Unit（相對庫存單位的計價單位）兩個欄位自動換算，採購線另有 PV Quantity / PV Unit Cost 顯示換算。原料消耗（raw material consumption）：消耗時產生 type=Sale 的 Item Ledger Entry 並連結到 PrintVis Job Costing Entry，達成實際成本追蹤。在製品（WIP）：以 Shop Floor 的 Production Label 機制建模——標籤連到訂單號、帶每標籤數量，隨件在 Cost Center 間移動代表在製流轉，並以 PrintVis SF Production Zone / SF Production Storage 記錄實體儲位；標籤消耗後標記 consumed，案件封存時才移除（刻意避開標準 BC 過帳以維持現場可視性）。成品（finished goods）：Release Finished Goods 功能透過標準 item journal 建立庫存（產生 Purchase 型 ledger entry）；出貨時亦可用 Shipments 的 Put On Stock，由背景 Sales Order 產生庫存。

## 五、排程與產能

PrintVis 以 Planning Unit（規劃單位）／Capacity Unit（產能單位）二元結構做有限產能排程（finite capacity）。Planning Unit 是「一段被排程的工作」，其計畫時間由 Calculation Unit/Calculation Detail Line 的計算時間套效率因子得出，並定義工序順序（predecessors/successors）、buffer time 與 overlapping 百分比。Capacity Unit 代表物理資源（機台/工作位/產線），定義 opening hours、planned downtime、blocked capacity 與效率因子，與 Cost Center 通常 1:1（亦可多 Cost Center 共用同一物理產能）。排程把 Planning Unit 放入對應 Capacity Unit 的可用行事曆內，確保計算工作實際落在能執行的物理資源上。支援三層級排程：里程碑（milestones）、瓶頸詳排（schedule a bottleneck in detail）、全細節（日期/時間/生產速度）；可自動或半自動（新訂單成立時系統產生最佳化建議）。Planning Board 為甘特圖式視覺看板，以色碼與分組（印刷機與其他成本中心）提供決策支援，供手動調整。狀態碼可由生產自動推進（status code 由現場驅動）。

## 六、拼版優化（印刷特化）

PrintVis 有原生拼版（imposition）能力，且支援併單（ganging）。Imposition Type 定義拼版結構：Leafs Length/Width（垂直/水平拼幾頁）、Pages（自動算總頁數）、Sheet length/width、Bleed、Trim left、Milling Depth、Overfold、Gripper Edge、Orientation(0/90/180/270)、Flip。型式分 Print（精確比對 prepress 模板）、Print Dynamic（彈性間距、允許 prepress 系統覆寫）、Die（刀模式拼版），以 Priority 與 Auto Use 欄位於估價時自動選版並影響下游機台指派。併單/ganging：把不同 Job 群組進同一印刷 run、置於同一張紙上以降低成本與紙張浪費；web press 多塔以 Imposition Range Setup 處理，當拼版需要多個生產單位時自動產生「殘張（Residual sheets）」，並用 Calculation Units lists 把不同塔指派給連續印張。估價時，選定 Imposition Type 後系統依其尺寸過濾可用機台，並自動算 Sheet 尺寸、頁數與含損耗張數。注意：公開文件描述的是「依拼版型式計算與選版」，未見到「自動最佳化裝箱/nesting 演算法把多件最省料地排到大張上」這類自動拼版最佳化求解器的明確說明（見 not_found）。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| Contribution Margin 1（邊際貢獻 1） | Job Costing report 內：Line 1 減去物料與預期成本。 |
| Contribution Margin 2（邊際貢獻 2） | 已開立發票價格減去直接成本。 |
| Profit Ratio（利潤率） | 利潤以百分比表示。 |
| 估價對實際差異（Quote/Order/Actual Variance） | 比對 Quote Estimation、Order Estimation、Actual Job Costing 三層，顯示金額與百分比差異。 |
| 效率因子（Efficiency factor） | 排程時將計算時間轉為計畫時間的因子；文件提及存在與用途，未給統一公式。 |
| 含損耗張數（No. of Sheets incl. scrap） | 估價時納入 scrap 後的印張數，與 Plates、No. of Impressions 一併計算。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- 以 Case 為中央樞紐、Case 下掛多個 Job（每 Job 一個獨立產品，各自估價/排程/出貨）的雙層結構，可對照感官「訂單→印件→工單/生產任務」的層級，特別是「一張 Case 多 Job 同時 Active」對應一張訂單多印件併進不同工單的情境
- Sheet（印張）與 Job Item（放在印張上的內容）分離建模——把『承印物』與『版面內容』拆開，是感官印件/工序主檔可借鏡的拼版基礎抽象
- 紙張單位雙軌（Inventory Unit 張 vs Price Unit 重量）的換算欄位設計，直接對應感官庫存痛點：紙以張入庫、以 kg 計價，應在物料主檔上建立庫存單位與計價單位兩欄並自動換算
- Planning Unit（計算時間→套效率因子→計畫時間）與 Capacity Unit（物理資源可用行事曆）二元分離，是感官『生產任務排程』與『設備/排程中心』解耦的清晰範式，並支援 predecessors/successors 工序順序與 overlapping
- 三層級排程（里程碑/瓶頸詳排/全細節）讓不同精度需求共存——感官可先做瓶頸排程（關鍵印刷機）再逐步細化，不必一步到位全工序排程
- 估價時即計算『含損耗張數 No. of Sheets incl. scrap + 印版數 + 印次』，把折損內建進報價計算，對應感官折損率的源頭量化
- Job Costing report 的 Quote/Order/Actual 三層估價對比 + 金額/百分比差異，是管理層 KPI 看板的現成模型（估準度、毛利偏差）
- WIP 用生產標籤在 Cost Center 間移動建模、案件封存才清——以『標籤位置』表達在製品流轉位置，避免每段都做標準庫存過帳的笨重，感官可借鏡輕量 WIP 追蹤
- DCM 資料採集（MOXA I/O 採 counting ticks 與 Setup/Print on/off 狀態）讓老機台也能自動回報印量與稼動狀態，對應感官 shop floor 自動回報的低成本切入點

**不適用 / 不照搬**：
- PrintVis 深度綁定 Microsoft Dynamics 365 Business Central 平台（Item/Item Ledger/G/L 過帳邏輯全複用 BC），感官自建 ERP 無此底座，庫存與財務過帳模型不能照搬
- 公開文件未見自動拼版最佳化求解器（自動把多件最省料地 nesting 到大張），PrintVis 的拼版偏『依 Imposition Type 設定計算與選版』而非自動最省料演算，若感官期待自動拼版最佳化，此非可直接借鏡的現成能力
- PrintVis 的 Formula 公式體系（Formula 22/220/8/10/9 等含本地公式）是其封閉估價引擎內建，屬實作細節，感官只能借鏡『公式化逐線計算工時/成本』的概念，不能照搬公式編號
- 成品 Finished Goods 為選配且偏向重複性產品，按單生產（MTO）為主的感官多數案件不會把成品長期入庫，此模型對感官適用面有限

## 來源（真實查證）

- [PrintVis Documentation — Case Management](https://learn.printvis.com/Pages/pvscasemanagement/) — Case/Job 雙層結構、Case 核心欄位(Sell-To/Order Type/Product Group/Status)、Job 欄位(Job Number/Version/Job Type/數量/頁數/格式/色數/報價)、Sheet 與 Job Item 定義與欄位、一案多 Job 同時 Active
- [PrintVis Documentation — Planning Units（與 Capacity Units）](https://learn.printvis.com/Legacy/Planning/PlanningUnits/) — Planning Unit(被排程工作，計算時間套效率因子)與 Capacity Unit(物理資源可用行事曆)定義、與 Calculation Unit/Cost Center 關係、predecessors/successors/buffer/overlapping、狀態碼自動推進
- [PrintVis Documentation — Shop Floor Production Tracking](https://learn.printvis.com/Legacy/JobCosting/ProductionTracking/) — 生產標籤(quantity per label)、Cost Center 的 Production Tracking 設定、SF Production Zone/Storage、標籤 consumed 與案件封存才移除、不走標準 BC 過帳
- [PrintVis Documentation — Job Costing report](https://learn.printvis.com/Legacy/JobCosting/JobCostingreport/) — 成本組成(Direct Cost: Hours/Materials/Sub Contracting/Total Hours)、Quote/Order/Actual 三層對比、金額與百分比差異、Contribution Margin 1/2、Profit Ratio、Error/Extra Work 成本
- [PrintVis Documentation — BC PV Touchpoints Items](https://learn.printvis.com/Legacy/General/BCPV-Items/) — 物料分類(Substrate/Ink-Toner/Plates/Subcontracting/Finished Goods)、紙張 Width/Length/Weight、PrintVis Inventory Unit vs Price Unit 換算、欄位範圍 6010000..6011999、消耗產生 Item Ledger Entry(type=Sale)連 Job Costing、Release Finished Goods 與 Put On Stock
- [PrintVis Documentation — Imposition Types](https://learn.printvis.com/Legacy/System/ImpositionTypes/) — Imposition Type 欄位(Leafs Length/Width/Pages/Bleed/Trim/Milling Depth/Overfold/Gripper Edge/Orientation/Flip)、Print/Print Dynamic/Die 三型、Priority/Auto Use、Imposition Range Setup 與 Residual sheets、影響機台選擇
- [PrintVis Documentation — Estimation Automation](https://learn.printvis.com/Legacy/Estimation/EstAuto/) — 估價自動化步驟(機台過濾→虛擬印張+殘張→含損耗張數/印版/印次→逐線 List of Units 計算→成本排序)、Formula 22/220/8/10/9、Product Group Lookup Filters
- [PrintVis features — Shop Floor Management](https://printvis.com/features/shop-floor-management/) — 電子工票、Started Jobs 工時記錄(多人同 Cost Center/開始停止完工)、間接工時自動停止直接工時、好品與 waste 數量回貼生產訂單、DCM(MOXA E1210)採 counting ticks 與 Setup/Print 狀態、即時訂單狀態與產能
- [PrintVis features — Planning and Scheduling（搜尋摘要）](https://printvis.com/features/planning-and-scheduling/) — 開放機台產能/可用工時/瓶頸排程、自動+手動排程、新訂單自動產生建議、三層級排程(里程碑/瓶頸詳排/全細節含速度)、Planning Board 甘特看板色碼分組
- [PrintVis features — Inventory and Purchasing / 5 Tips（搜尋摘要）](https://www.sabrelimited.com/blogs/5-tips-best-performing-for-print-mis) — 紙張以張存放、以 kg 計價的單位換算痛點；MRP 合併訂單/批量採購/報價時建議標準料；BC 倉儲整合

## 查無公開資料（誠實標註，禁編造補齊）

- PrintVis 底層資料庫表結構與實際 SQL schema（閉源商業系統，公開文件僅到資料實體/物件模型/設定欄位層級，未公開表名與欄位型別）
- 內建 OEE（Availability×Performance×Quality）標準指標：搜尋未取得 PrintVis 官方明確以 OEE 三要素呈現的儀表板或公式，僅確認其採集稼動狀態(Setup/Print on/off)與工時數量，但未見『OEE = A×P×Q』的官方定義
- 明確的良率(yield)、折損率(spoilage rate %)獨立 KPI 公式：文件顯示損耗以『含損耗張數 No. of Sheets incl. scrap』計入估價與用紙量，未見以百分比呈現的獨立 spoilage/yield 指標定義
- Shop Floor 將好品 vs 不良品數量分別欄位化的精確欄位名（features 頁稱『capturing both good output and waste』，但 ProductionTracking 文件未列出明確的良品/不良品分欄欄位名）
- 自動拼版最佳化(自動 nesting/最省料求解)演算法：文件描述依 Imposition Type 設定計算與 ganging 概念，未見自動最佳化求解器的明確官方說明
- Planning Unit 效率因子的統一計算公式（文件確認其存在與用途，未給數學定義）
- 設備稼動率(machine utilization %)作為內建報表 KPI 的明確公式（文件提及顯示『available machine capacity』與排程負載，但未見稼動率百分比的官方計算定義）

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

抽查 7 個 sources URL，全部真實可達且內容相符。詳細結果如下：

(1) learn.printvis.com/Pages/pvscasemanagement/ — 真實。確認 Case/Job 雙層、Case 欄位（Sell-To/Order Type/Product Group/Bill-To/Status Request→Quote→Order）、Job 欄位（Job Number/Version 起始 1/Job Type/數量/頁數/格式/色數/Quoted Price）、Sheet=「single substrate run through a press」、Job Item=自動建立且可加掛、原文「multiple jobs to be Active on a single case each having their own estimate, production schedule, and shipments」完全相符。

(2) learn.printvis.com/Legacy/Planning/PlanningUnits/ — 真實。Planning Unit=「a scheduled piece of work」、Capacity Unit=「a physical resource」、計算時間套效率因子→計畫時間、predecessors/successors、buffer time、overlapping %、「at least one planning unit per department」建議、status code「driven from production」自動推進，全部相符。

(3) learn.printvis.com/Legacy/General/BCPV-Items/ — 真實。最關鍵驗證：研究宣稱的「6010000..6011999」欄位範圍經原文逐字確認（「added fields to the Items table 27 (no. range 6010000..6011999)」），並非編造。五類物料、Width/Length/Weight、Inventory Unit vs Price Unit、Item Ledger Entry type=Sale 連 Job Costing、Release Finished Goods（type Purchase）/Put On Stock 皆相符。

(4) learn.printvis.com/Legacy/Estimation/EstAuto/ — 真實。Formula 22/220（印刷）、8/10（製版）、9（張數）經原文逐字確認（「for the following processes, only specific formulas are supported」），非套模板編造。估價自動化七步驟、Product Group Lookup Filters 相符。

(5) printvis.com/features/shop-floor-management/ — 真實。MOXA E1210 I/O 模組、counting ticks、Setup/Print on-off 狀態、電子工票、Started Jobs 多人同 Cost Center、間接工時自動停止直接工時皆逐字確認。

(6) learn.printvis.com/Legacy/JobCosting/JobCostingreport/ — 真實但有定義出入（見 unsupported_claims）。三層 Quote/Order/Actual 對比、Direct Cost 組成、Error/Extra Work 成本相符。

(7) learn.printvis.com/Legacy/System/ImpositionTypes/ + ProductionTracking/ — 真實。Imposition 欄位、Print/Print Dynamic/Die、Priority/Auto Use、Imposition Range Setup/Residual sheets、生產標籤 consumed/案件封存才移除、「outside of standard Business Central inventory to avoid all the postings and ledger entries」皆相符。

額外：以 WebSearch 獨立佐證「embedded in Business Central、共用同一資料庫」的閉源架構宣稱（erpsoftwareblog、sabrelimited、softwareconnect 多源一致）。

總結：本研究的「具體欄位名 / 公式編號 / 硬體型號」並非套模板幻覺，而是忠實引用官方文件原文，溯源精確度異常高。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- Contribution Margin 1 定義「Line 1 減去物料與預期成本」與官方原文「Result of line No.: 1 - 3 - 4」方向一致（線1 Quoted Price 減去直接物料、減去預期物料），屬可接受的簡化。但 Contribution Margin 2 定義「已開立發票價格減去直接成本」與官方原文「Result of line No.: 1 + 3 + 5 + 7」(線1 加直接物料、加直接外包、加預期外包) 在運算結構上不一致——官方為加法組合非「發票價減直接成本」，研究此處的 CM2 文字描述可能是 LLM 自行套常識公式（CM=售價−變動成本）回填，與來源不符，須修正或標『定義待向官方確認』。
- kpi_metrics 中 Profit Ratio 定義「利潤以百分比表示」過於精簡（官方原文僅「Profit in percent」），雖無錯誤但無實際公式內容，屬低資訊含量轉述，非編造。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- 修正 Contribution Margin 2 定義：官方 Job Costing report 文件的原文為『Result of line No.: 1 + 3 + 5 + 7』（線1 加直接物料、加直接外包、加預期外包成本），而非研究所寫『已開立發票價格減去直接成本』。研究的描述疑似套用一般財會 CM 公式回填，與來源運算結構不符，應改為引用官方行號組合式或標註『官方以行號組合定義，本文簡化描述待核對』。
- Contribution Margin 1 雖方向相符，建議補註官方原文為行號運算『line 1 - 3 - 4』，避免讀者誤以為是教科書式 CM 定義。
- 建議在 kpi_metrics 的 efficiency factor 與 Profit Ratio 兩項明確標註『官方僅述存在與用途、未給公式』（研究 not_found 已標，但 kpi_metrics 段內可一致化），避免 borrowable 段被誤讀為有現成公式可照搬。
- （非錯誤、僅強化）borrowable 段引用的紙張單位雙軌、含損耗張數內建估價等借鏡點均有來源支撐，可保留；建議在文件標註『公式編號 22/220/8/10/9 屬 PrintVis 封閉引擎實作細節，借鏡概念不照搬編號』——研究 not_applicable 段已正確點出此界線。

**來源充分、可信度高的內容**：
- Case/Job 雙層結構、一案多 Job 同時 Active、各自估價/排程/出貨 — 官方原文逐字支撐（pvscasemanagement）
- BC Item 表新增欄位範圍 6010000..6011999 — 原本最該懷疑的『閉源系統卻給具體欄位範圍』，經官方文件逐字證實為真，非幻覺（BCPV-Items）
- Formula 22/220/8/10/9 公式編號 — 官方文件明列『only specific formulas are supported』，逐字證實（EstAuto）
- MOXA E1210 I/O 模組 + counting ticks + Setup/Print on-off 狀態 — 官方 features 頁逐字證實的硬體整合細節（shop-floor-management）
- Planning Unit／Capacity Unit 二元分離、計算時間套效率因子→計畫時間、predecessors/successors/buffer/overlapping — 官方逐字支撐（PlanningUnits）
- WIP 用生產標籤在 Cost Center 間移動、案件封存才移除、刻意避開標準 BC 過帳（『outside of standard Business Central inventory to avoid all the postings and ledger entries』）— 官方逐字支撐（ProductionTracking）
- Item Ledger Entry type=Sale 連結 Job Costing Entry — 官方逐字支撐（BCPV-Items）
- Imposition Type 欄位與 Print/Print Dynamic/Die 三型、Priority/Auto Use — 官方逐字支撐（ImpositionTypes）
- 研究在 not_found 段誠實標註『無自動拼版最佳化求解器』『無 OEE=A×P×Q 官方定義』『效率因子無統一公式』，經查證屬實 — 研究的自我設限誠實，未過度宣稱
