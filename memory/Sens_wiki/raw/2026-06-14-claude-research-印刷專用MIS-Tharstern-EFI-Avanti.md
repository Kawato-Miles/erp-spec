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
  - 排程
topic-tag:
  - MES
  - 印刷MIS
  - Tharstern
  - EFI-Pace
  - Avanti
  - 拼版優化
  - 併單
  - 限制理論排程
  - 現場數據採集
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[印件]]"
raw-source-link: https://printepssw.com/eps-avanti-print-mis
attached-files: []
---

# 印刷專用 MIS 代表三套：Tharstern（ePS Tharstern）／EFI Pace（ePS Pace）／Avanti Slingshot（Ricoh / ePS） — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：印刷專用 MIS（Print MIS／ERP，含 MES 生產執行域）

## 系統定位概述

三套皆為印刷業專用 MIS／ERP，核心資料骨幹一致：報價(Estimate) → 工單/作業(Job/Ticket) → 排程(Schedule) → 現場數據採集(Shop Floor Data Collection, SFDC) → 完工/入庫，全部建在單一資料庫且以 JDF/JMF 雙向串接印前與印刷設備。三者皆按單生產(MTO)導向，與感官(Sens)的生產模式相符。生產執行能力上：EFI 以 PrintFlow（全域最佳化理論 TGO／限制理論）做有限產能動態排程、以 Auto-Count 4D（含直接機台介面 DMI）做即時現場採集；Avanti 以原生「自動拼版優化器(Automated Press Sheet Optimizer)」在報價/訂單階段就算拼版併單，另有獨立倉儲管理模組；Tharstern 走模組化（估價/排程板/SFDC/庫存/BI），拼版透過 IMP 或嵌入式 Metrix。三者皆為閉源商業系統，內部資料庫 schema 不公開，本研究萃取到的是官方「物件/功能模型」層級，欄位級細節已在 not_found 誠實標示。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### Estimate（報價）

報價主體。EFI Pace 報價可拆成多個 Part（部件），每個 Part 套用 Operation（工序作業）與 Material（物料）；拼版時系統依各 Part 在版面佔比(usage percent)拆分 finishing operation 與油墨/上光成本。Avanti 的報價可由估價模組產生並回填到訂單，且報價階段即可呼叫自動拼版優化器算最佳版面。

關鍵屬性：Part（部件，EFI Pace 明確命名）、Operation（工序作業，可套用於 Part）、Material（物料，可指定為 inventory item 庫存品項）、usage percent（版面佔比，用於拼版成本分攤）、press / materials / operation costs（估價最佳化依據）

關聯：
- 一張報價 對多 部件(Part)（EFI Pace）
- 一個部件 對多 工序作業(Operation)
- 一個部件 對多 物料(Material)
- 一張報價 轉換為 一張工單(Job)（estimate→job，免重新鍵入 re-keying）

### Job / Ticket（工單／工票）

生產執行核心。Tharstern 的 Job Management 是中央樞紐，匯總一張工單的所有資訊：出貨與帳務資訊、物料配置與狀態、實際與估計活動(actual and estimated activities)。EFI Pace 的工單由報價轉換而來，並保有 Job Part（工單部件）層、可在重轉(reconvert)估價成工單時維持正確的計畫物料數量。Avanti 稱 Sales Order/Job Manager/Ticketing。

關鍵屬性：material allocation and status（物料配置與狀態，Tharstern）、actual and estimated activities（實際 vs 估計活動，Tharstern）、Job Part（工單部件，EFI Pace）、planned quantity for job materials（工單物料計畫數量，EFI Pace）、shipping and billing information（出貨與帳務資訊，Tharstern）

關聯：
- 一張工單 對多 工單部件(Job Part)（EFI Pace）
- 一張工單 對多 工序作業(Operation/Activity)
- 一張工單 對多 物料配置(material allocation)
- 一張工單 由 一張報價(Estimate) 轉換產生
- 一張工單 對多 現場採集回報(SFDC records)

### Operation / Activity / Cost Center / Work Center（工序作業／成本中心／工作中心）

工單在各設備上的工序步驟，是排程與成本歸集單位。EFI PrintFlow 以 work center（工作中心）與 cost center（成本中心）為排程載體，支援平行(群組)成本中心(parallel/group cost centers)自動負載平衡，並為每個工作中心產出 run list（工作清單）。每個 Operation 區分準備(makeready/setup)與生產(run)。

關鍵屬性：setup / switchover calculations（換線/切換計算，PrintFlow 自動）、run list（各工作中心工作清單，PrintFlow）、upstream and downstream dependencies（上下游相依，PrintFlow Gantt 顯示）、makeready vs run（準備 vs 生產，AutoCount 4D 區分）、budgeted hourly cost rates（預算時薪成本率，用於工序成本）

關聯：
- 一個工作中心(Work Center) 對多 工序作業(Operation)
- 一個工序作業 屬於 一張工單(Job)
- 平行群組成本中心 之間 自動負載平衡(load balancing)（PrintFlow）
- 一個工序作業 對多 現場採集回報(time/count/waste)

### Material / Inventory Item（物料／庫存品項）

報價/工單上的物料，可標記為庫存品項。EFI Pace 透過 Wireless Inventory Device（無線庫存裝置）核對工單部件上的計畫數量(planned quantity)，數量與計畫不符會警示。Avanti 物料含紙張/原料/成品/耗材(consumables)，並有獨立倉儲管理模組。

關鍵屬性：inventory item（庫存品項，可被報價/工單引用）、planned quantity（計畫數量，EFI Pace 工單部件層）、raw materials / finished goods / consumables（Avanti 三類）、barcode（條碼，掃描盤點/領料）、low inventory automatic re-supply（低庫存自動補貨，Avanti）

關聯：
- 一個物料 被 多張報價/工單 引用
- 一個庫存品項 對多 庫存交易(收料/領用/盤點)
- 一個物料 對多 庫存地點(location)（Avanti 倉儲）
- 物料消耗 由 現場採集(AutoCount 秤重扣抵) 觸發庫存異動

### Shop Floor Data Collection Record（現場數據採集回報）

AutoCount 4D（EFI／ePS）採集：工單起訖、makeready/job completion 狀態變更、機台狀態(machine status)、停機分析(downtime analysis)、物料用量、機台效率、人員與機台層級績效，並區分準備廢與生產廢(make-ready vs running waste)。透過直接機台介面(DMI)即時採集，避免 under/overrunning。Tharstern 以 JMF 把現場資料回傳 MIS 的成本會計、報表與排程。

關鍵屬性：good count / waste（良品數/廢數，AutoCount 秤重後扣抵總用紙）、makeready time / run time / downtime（準備/生產/停機，含停機原因)、machine status（機台狀態）、operator / employee performance（操作員/人員績效）、DMI（Direct Machine Interface 直接機台介面）、customizable quality questions（依工單狀態變更觸發的品質提問）

關聯：
- 一筆採集回報 屬於 一個工序作業(Operation)/一張工單
- 採集回報 即時回饋 排程(PrintFlow real-time updates)
- 採集回報 回饋 估價/成本會計(JMF→cost accounting)
- 採集的廢數 觸發 物料庫存扣抵(component balance)

### Schedule / Scheduling Tag（排程／排程標籤）

PrintFlow 以互動式甘特圖(Gantt)呈現任一群工作中心、任一時段；排程員可在甘特圖上選取、分割(split)、拖放(drag and drop)任務，系統自動算換線。Tharstern 提供排程板與班別模式(shift patterns，含加班、機台保養)，並把 work-to schedules（工作派工表）下達現場採集裝置。Avanti 提供自動排程＋what-if 情境模擬。

關鍵屬性：Gantt chart / scheduling board（甘特圖/排程板）、drag and drop / split tasks（拖放/分割任務）、what-if scenario planning（假設情境模擬，Avanti）、shift patterns / overtime / machine maintenance（班別/加班/機台保養，Tharstern）、work-to schedules（工作派工表下達現場，Tharstern）

關聯：
- 一個排程 涵蓋 多個工作中心(Work Center)
- 一個排程任務(scheduling tag) 對應 一個工序作業(Operation)
- 排程 即時消費 現場採集狀態(real-time production status)
- 排程 受 多重限制(proof/material/vendor dates) 約束

### Layout / Gang Run（拼版／併單版面）

Avanti 自動拼版優化器(Automated Press Sheet Optimizer)在報價/訂單階段算出最佳版面，考量印刷機/裝訂機/紙張，輸出 gang run 的版材(plates)/油墨/紙張/印刷計算與成本，並算出每品項的 number up(落版數)；可處理單拼/多拼、版本(versioning)、組合(combo)工件。Metrix（可嵌入 Pace/Monarch/Tharstern）單一版面最多 160 個不同訂單。

關鍵屬性：optimal layout（最佳版面，依成本最佳化）、number up（每品項落版數）、gang run elements: plates / ink / substrate / press calc、up to 160 orders per layout（Metrix）、single form/multi form, versioning, combo（複雜工件型態）

關聯：
- 一個拼版版面 對多 訂單/品項(orders/parts)（多對多：一品項可上多版、一版含多品項）
- 一個版面 連結 一台印刷機(press) 與 一種紙張(substrate)
- 版面 匯出為 JDF/imposed PDF 給印前系統
- 版面成本 回填 報價/工單成本(job costing)

## 二、資料流程

### 報價到工單再到排程（estimate → job → schedule，三套共通骨幹）

1. 業務/估價員在 Estimating 模組依印刷機、物料、工序成本建立報價(Estimate)，EFI Pace 可拆 Part 並套 Operation/Material
2. 報價核准後一鍵轉換為工單(Job/Sales Order)，免重新鍵入(re-keying)，EFI Pace 保留 Job Part 與計畫物料數量
3. 工單進入排程：PrintFlow 依 TGO/限制理論自動排序、產各工作中心 run list，或 Tharstern 排程板人工/自動排並下達 work-to schedules
4. 排程考量多重限制(proof dates、material dates、outside vendor dates)與平行成本中心負載平衡

### 現場數據採集回饋（job → SFDC → cost accounting / schedule，閉環）

1. 工單在機台開始：AutoCount 4D 記錄 job start 狀態變更
2. 採集 makeready 時間、run time、停機(downtime 含原因)、機台狀態、操作員
3. 以 DMI 直接讀機台計數，秤重 makeready 廢與生產廢(running waste)並從總用紙扣抵(component balance)
4. 工單完成記 job completion；資料即時更新排程(real-time updates to scheduling)
5. 透過 JMF 把實際工時/數量/廢量回傳 MIS 的成本會計，產出 Job Cost vs Estimate 差異報表

### 拼版併單到印前（ganging → imposition → prepress，Avanti 原生 / Pace+Metrix）

1. 收集多筆品項的尺寸與數量(varying flat sizes and quantities)
2. 自動拼版優化器/Metrix 依規則算最佳版面：選最省成本的印法、印刷機、紙張尺寸
3. 算出 gang run 的版材/油墨/紙張/印刷計算與成本，回填報價/工單做精準成本與庫存
4. 算出每品項 number up，產生版面
5. 版面自動轉為拼版資料(imposition data)以 JDF/imposed PDF 匯出印前(Apogee/Prinergy/Prinect)，並送 JDF/CIP4 給裝訂、條碼給出貨

### 物料/庫存流動（material → WIP → finished goods）

1. 報價/工單上的物料標記為庫存品項(inventory item)並算計畫數量(planned quantity)
2. 領料：EFI Pace 以 Wireless Inventory Device 核對工單部件計畫數量，與計畫不符即警示；Avanti 行動 App 掃條碼記領用
3. 生產中 AutoCount 秤重採集實際耗用與廢量，扣抵庫存達成 component balance（在製品消耗）
4. 完工成品入庫由 Fulfillment/倉儲管理模組接手（Avanti 有獨立 WMS、低庫存自動補貨 low inventory automatic re-supply）
5. 出貨：fulfillment 控管庫存、缺貨補單(backorders)、出貨於單一系統

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| 報價與訂單（Estimating & Order） | 報價估算（依印刷機/物料/工序成本自動最佳化，EFI Pace）、報價拆部件套工序與物料（Part/Operation/Material，EFI Pace）、報價轉工單免重鍵（estimate→job re-keying free）、Request for Quote / Web-to-Print 報價需求（Tharstern）、複製舊單再訂（copy previous jobs for re-order，Avanti Sales Order） |
| 工單與生產執行（Job / Production / MES 核心） | 工單中央樞紐：物料配置與狀態、實際 vs 估計活動（Tharstern Job Management）、工單部件層 Job Part 與計畫物料數量（EFI Pace）、生產進度追蹤 job tracking（Tharstern Production）、品質控管 quality control（Tharstern；AutoCount 依狀態觸發品質提問）、生產設備整合 production device integrations（JDF/JMF） |
| 排程與產能（Scheduling & Capacity） | PrintFlow 動態排程（TGO/限制理論，自動定最佳生產路徑）、互動式甘特圖：選取/分割/拖放任務、自動換線計算（PrintFlow）、各工作中心 run list 工作清單（PrintFlow）、班別模式/加班/機台保養排程＋work-to schedules 派工（Tharstern）、自動排程＋what-if 情境模擬（Avanti） |
| 現場數據採集（Shop Floor Data Collection） | AutoCount 4D 即時採集（HTML5 介面、Plant View 廠區視圖）、直接機台介面 DMI（防 under/overrunning、秤重廢量）、makeready/run/downtime/機台狀態/操作員績效採集、條碼掃描整合（barcode scanner）、JMF 雙向訊息回傳成本會計/排程（Tharstern） |
| 拼版與印前（Imposition & Prepress） | 自動拼版優化器 Automated Press Sheet Optimizer（Avanti 原生，報價/訂單階段算版面）、Metrix 嵌入式拼版/併單（Pace/Monarch/Tharstern，單版最多 160 訂單）、Job Ganging 串接 IMP 拼版（Tharstern）、number up 落版數計算與 gang run 成本回填、JDF/imposed PDF 匯出印前、CIP4 給裝訂 |
| 庫存與倉儲（Inventory & Warehouse） | 原料/成品/耗材即時庫存（Avanti raw materials/finished goods/consumables）、獨立整合倉儲管理模組 WMS（Avanti）、低庫存自動補貨 low inventory automatic re-supply（Avanti）、Wireless Inventory Device 工單物料計畫數量核對（EFI Pace）、行動 App 掃碼盤點/收料/領用（Avanti Mobile）、Fulfillment 缺貨補單/出貨控管（Tharstern Post-Production） |
| 成本與商業智慧（Costing & BI/KPI） | Job Cost vs Estimate 實際 vs 估計差異報表（EFI Pace）、Job Costing 模組（工序時數/物料/管銷歸集）、role-based dashboards and KPIs 角色儀表板（Avanti）、Business Intelligence 報表（Tharstern）、即時獲利洞察 real-time profitability insights（Avanti）、AutoCount 即時生產指標儀表板（live production metrics） |

## 四、庫存處理（Miles 重點關注）

三套都把物料建模成可被報價/工單引用的「庫存品項(inventory item)」，並沿報價→工單→領料→廢量扣抵→成品入庫的鏈條流動，但深度不同。原料(raw material)：在報價/工單上即標記為庫存品項並算計畫數量(planned quantity)。在製品(WIP)消耗：EFI Pace 以 Wireless Inventory Device（無線庫存裝置）在領料時核對工單部件的計畫數量，數量與計畫不符即警示；AutoCount 4D 透過直接機台介面(DMI)秤重 makeready 廢與生產廢(running waste)，從總用紙扣抵達成「component balance（料帳平衡）」——這是把生產實際耗用即時反映到庫存的關鍵機制，正對應感官 ERP 的庫存痛點。成品(finished goods)：由 Fulfillment/倉儲模組接手，控管缺貨補單(backorders)與出貨。Avanti 庫存最深：原生即可管原料/成品/耗材，且有「完整整合的倉儲管理模組(WMS)」（多數印刷 MIS 僅基本成品庫存，需另接 WMS），支援「低庫存自動補貨(low inventory automatic re-supply)」、行動 App 掃條碼即時盤點/收料/領用免重鍵，並在拼版時把版材/油墨/紙張計算回填做庫存追蹤。可借鏡：庫存品項與工單計畫數量綁定 + DMI 秤重扣抵 + 低庫存自動補貨 + 行動掃碼，是補齊 WIP 與成品建模的成熟範式。

## 五、排程與產能

EFI PrintFlow 是三套中最成熟的有限產能排程，理論基礎為「全域最佳化理論(Theory of Global Optimization, TGO)」（由 Udi Arieli 團隊將限制理論 Theory of Constraints 應用於印刷），核心假設「製造是相互依存環節的鏈，只有少數限制控制產出/準交/成本」。能力：自動為每張工單定最佳生產路徑、同步數萬筆作業（依交期優先序、工件特性、即時生產狀態）、自動為平行(群組)成本中心做負載平衡、考量多重併發限制（打樣日 proof dates、物料到料日 material dates、外包供應商日 vendor dates）。介面為互動式甘特圖，可顯示任一群工作中心/任一時段，排程員可直接選取、分割(split)、拖放任務，系統自動算 setup/switchover（換線），並顯示每個作業的上下游相依，為各工作中心產 run list；與 AutoCount DMI 即時現場資料連動。Tharstern 提供排程板＋複雜班別模式（含加班、機台保養），把 work-to schedules 下達現場採集裝置。Avanti 提供自動排程＋what-if 情境模擬以平衡負載、消除瓶頸，並把實際可用庫存納入每一步排程考量。三套皆以工作中心/成本中心為產能載體、以拖放甘特為操作介面，與感官既有「排程中心/派工看板/回溯排程」可對接。

## 六、拼版優化（印刷特化）

三套皆具拼版/併單(imposition / gang-run / nesting)優化能力，但實作分兩路。Avanti Slingshot 為原生：「自動拼版優化器(Automated Press Sheet Optimizer)」在報價(Estimate)或訂單(Sales Order)階段即依規則自動處理併單條件、算最佳版面，考量企業實際製造環境（印刷機、裝訂機、紙張），對每種可能與落版方式找最省成本版面；確定印刷機與紙張後算出 gang run 的版材(plates)/油墨/紙張/印刷計算與成本價格（直接回填工單成本與庫存追蹤），算出每品項 number up，能處理單拼/多拼、版本(versioning)、組合(combo)工件，最後自動轉為拼版資料以 JDF/PDF 匯出印前(Apogee/Prinergy/Prinect)。EFI Pace 與 Tharstern 走嵌入/整合路：Metrix（可嵌入 Pace/Monarch/Tharstern/Technique）單一版面最多容納 160 個不同訂單，以智慧演算法定最省成本印法/印刷機/紙張尺寸，依操作員偏好/材料/設備運轉成本動態指派，支援平面/折頁/書冊/異形/單刀模/展示圖文與寬幅 nesting + step-and-repeat；EFI Pace 自身在報價併單時「每個唯一版面只建一個 finishing operation，並依各 part 佔版比(usage percent)拆分成本、依覆蓋率拆分油墨/上光/光油 setup 成本」。Tharstern 另有 Job Ganging 串接 IMP 拼版軟體（輸入標準矩形/1-UP CAD/PDF）。對感官可借鏡：拼版優化在報價階段就跑、版面成本即時回填工單與庫存，是把拼版從純印前工具升級為「估價+排程+成本」一體的關鍵。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| 廢損率 / 廢量（Waste / Spoilage） | AutoCount 4D 區分準備廢(make-ready waste)與生產廢(running waste)，以直接機台介面 DMI 即時秤重，從總用紙扣抵達料帳平衡(component balance)；DMI 防 under/overrunning 典型降廢約 2%。 |
| 準備時間 / 生產時間（Makeready / Run time） | AutoCount 依工單狀態變更(job start/make ready/job completion)採集準備與生產時段；自動載入紙路與墨量縮短 makeready（案例五色 B2 機換線 7 分鐘）。 |
| 機台效率 / 停機（Machine efficiency / Downtime） | AutoCount 採集 machine status 與 downtime analysis（含原因），跨機台/人員/班別比較資源績效；DMI 整合宣稱效率提升最高約 20%。 |
| 實際 vs 估計成本差異（Job Cost vs Estimate） | EFI Pace 報表顯示實際成本高於估計的 variances，表頭 Quoted Price 取自工單金額、Part Details Quoted Price 取自部件值；由 JMF 回傳實際工時/數量驅動。 |
| 即時生產儀表板 KPI（Role-based dashboards / live metrics） | Avanti 提供 role-based dashboards and KPIs 與即時獲利洞察；AutoCount 提供 live production metrics 與 Plant View（OEE 三因子統一公式未在公開頁列出，見 not_found）。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- report→job→schedule 單一骨幹：報價拆部件(Part)套工序(Operation)與物料(Material)、核准後免重鍵轉工單並保留計畫物料數量(planned quantity)——可對齊感官既有工單/生產任務/工序主檔，補上『報價即生產藍圖』的一致資料結構
- DMI 秤重扣抵料帳平衡(component balance)：以直接機台介面即時把 makeready 廢/生產廢從庫存扣抵——直接打中感官庫存（WIP 與用料準確性）痛點，是補齊在製品建模最具體的範式
- 低庫存自動補貨 + 行動掃碼盤點（Avanti）：把成品/原料庫存與工單計畫數量綁定、行動 App 掃碼免重鍵——補齊感官成品入庫與原料庫存的自動化
- 拼版優化前移到報價/訂單階段（Avanti Press Sheet Optimizer）：併單版面成本(版材/油墨/紙張)即時回填工單與庫存，而非只在印前——讓估價、排程、成本一體
- PrintFlow 有限產能排程模型：以工作中心/成本中心為產能載體、互動甘特拖放/分割、自動算換線、平行成本中心負載平衡、多重交期限制（打樣/到料/外包日）——可強化感官排程中心/派工看板/回溯排程的限制建模與自動換線
- Job Cost vs Estimate 差異報表 + JMF 回饋閉環：實際工時/數量/廢量回傳成本會計做差異分析——為感官提供生產效率/折損率 KPI 與管理層儀表板的資料來源設計範本
- 現場狀態驅動的品質提問（AutoCount 依工單狀態變更觸發 quality questions）：把品檢嵌進採集流程——可對接感官既有品檢模組

**不適用 / 不照搬**：
- 大量採購/財務/CRM 模組（三套都含，但屬感官本研究範圍外，且採購/財務已是感官既有或另議）
- Web-to-Print/客戶下單入口(Web Portal, Digital StoreFront)：屬線上接單通路，與感官線上編輯器定位不同，非生產執行域
- 封閉商業套件的計價授權與套件綁定（ePS 生態綁 Fiery/VUTEk/Process Shipper 等）對自建 ERP 不適用，僅取其資料模型概念
- Metrix 單版最多 160 訂單級別的大規模商業併單，對感官以客製異形/壓克力等小批量 MTO 可能過度；併單邏輯需重新依感官品項特性裁量

## 來源（真實查證）

- [ePS Avanti Print MIS 模組頁（印務 ePS）](https://printepssw.com/eps-avanti-print-mis) — Avanti 核心模組：Estimating & Order Management、Scheduling & Production Tracking（含 what-if）、Fulfillment & Inventory（原料/成品/缺貨/無線倉儲）、Financials & Reporting、CRM；JDF 認證、role-based dashboards and KPIs
- [Metrix Planning and Imposition Software（ePS）](https://printepssw.com/metrix-planning-and-imposition-software) — Metrix 拼版：單版最多 160 訂單、智慧演算法選最省成本印法/印刷機/紙張、平面/折頁/書冊/異形/nesting+step-and-repeat、MXML/CSV 輸入、JDF/imposed PDF 輸出、嵌入 Pace/Monarch/Tharstern/Technique
- [Tharstern Print MIS 模組頁（ePS Tharstern）](https://printepssw.com/tharstern-print-mis) — Tharstern 六大功能區：Pre-Sales&Sales(CRM/RFQ/估價/優化)、Job&Order Mgmt(工單追蹤/採購/庫存/job costing/BI)、Pre-Production(proofing/presetting/ganging/scheduling)、Production(job tracking/QC/設備整合)、Post-Production(warehousing/fulfillment/出貨)
- [AutoCount 4D 印刷數據採集（ePS，redirect 後 printepssw.com）](https://printepssw.com/ac4d-print-data-collection-software) — AutoCount 4D 採集 job start/make ready/job completion 狀態、機台狀態、停機分析、物料用量、機台效率、人員/機台績效、make-ready vs running waste；HTML5、條碼、Plant View、即時更新排程
- [AC4D Shop Floor Management（ePS Packaging，redirect epssw.com）](https://epssw.com/autocount-shop-floor-management-software) — AC4D 直接機台介面 DMI 防 under/overrunning 降廢約 2%、效率提升最高約 20%；整合 Radius/PrintFlow 4D/CorrPlan/DFE；browser-based 遠端存取
- [EFI PrintFlow Datasheet（Yumpu）](https://www.yumpu.com/en/document/view/35597105/efi-printflow-datasheet) — PrintFlow 全域最佳化理論 TGO（Udi Arieli/EFI，限制理論應用）、同步數萬作業、互動甘特拖放/分割/drill-down、上下游相依、整合 EFI MIS 與 Auto-Count DMI
- [EFI Showcases PrintFlow Scheduling（WhatTheyThink）](https://whattheythink.com/news/34345-efi-showcases-powerful-printflow-scheduling-solution/) — PrintFlow 自動定最佳生產路徑、為各工作中心產 run list、考量 proof/material/outside vendor dates、平行(群組)成本中心自動負載平衡、甘特拖放即時回饋
- [Avanti Slingshot Automated Press Sheet Optimizer（Printing News）](https://www.printingnews.com/software-workflow/prepress/product/12093462/avanti-computer-systems-limited-slingshot-automated-press-sheet-optimizer) — 原生自動拼版優化器在 Estimate/Sales order 算最佳版面、rules-based、算 gang run 的 plates/ink/substrate/press 計算與成本、number up、單拼/多拼/versioning/combo、JDF/PDF 匯出 Apogee/Prinergy/Prinect
- [EFI/ePS Pace 估價與工單結構（多來源搜尋佐證：release notes + 評論）](https://pace-clientfiles.efi.com/releasematerials/project/pace/33-01/) — Pace 報價 Part/Operation/Material 結構、ganging 每唯一版面建一個 finishing operation 並依 usage percent 拆成本、Job Cost vs Estimate 差異報表、Wireless Inventory Device 核對 job part 計畫數量（註：release notes 頁面間歇 ECONNREFUSED，內容由搜尋摘要交叉佐證）
- [Printweek - Joining up the dots（JDF/JMF/SFDC 工作流）](https://www.printweek.com/content/features/joining-up-the-dots) — JMF 在生產排程與設備間傳遞資料、可送成本會計/報表/統計，完工後檔案回傳 MIS；Auto-Count 秤重 makeready 與生產廢從總用紙扣抵達 component balance（註：頁面 403，內容由搜尋摘要佐證）
- [Printweek - 星級產品 ePS Midmarket Print Suite / EFI Pace 模組](https://www.printweek.com/content/review/star-product-eproductivity-software-midmarket-print-suite) — Pace 為瀏覽器型 MIS/ERP，模組含估價/job planning/job order entry/scheduling/SFDC/會計/發票；optional：Pace scheduling 或 PrintFlow、Metrix ganging、Auto-Count 即時 SFDC、Process Shipper
- [WhatTheyThink - Avanti Slingshot 產品聚焦](https://whattheythink.com/articles/95464-print-mis-product-spotlight-avantis-slingshot/) — Avanti 單一綜合資料庫涵蓋 Customers/Estimating/Project Plans/Sales Orders/Production/Inventory/Purchasing/Scheduling/Shipping/Billing/Accounting/CRM/Reporting；整合倉儲管理、多種排程法、what-if

## 查無公開資料（誠實標註，禁編造補齊）

- 三套皆為閉源商業系統，內部資料庫實體名/資料表/欄位級 schema 未公開；本研究取得的是官方『物件/功能模型』層級（如 EFI Pace 的 Estimate/Part/Operation/Material/Job Part 為產品介面用語，非資料庫表名）
- 三套官方文件未公開統一命名的 OEE 計算公式（可用率×效能×良率三因子）；AutoCount/Avanti 提供 KPI 儀表板但未在公開頁列出 OEE 三因子的內建欄位與算式
- run speed（印刷速度，張/時）作為獨立內建 KPI 欄位的明確定義，三套公開頁未直接列出（僅見於 makeready/waste/downtime 採集脈絡）
- Tharstern 庫存(Stock Control)與 Fulfillment 模組對 WIP/原料/成品的實體建模細節：fulfillment 與 scheduling add-on 的官方功能頁在 ePS 改版後回 404，僅取得模組存在與 JMF 回饋、work-to schedules 等概念，欄位級未取得
- EFI Pace 完整模組清單與資料結構原始官方資料表(eps_ds_global_pace_en.pdf)為影像式/二進位 PDF 無法解析；Pace 結構係由多筆官方 release notes 摘要與第三方評論交叉佐證，非單一權威 schema 文件
- Avanti Slingshot 倉儲管理模組(WMS)的庫存實體（lot/roll/sheet/location/單位換算）逐欄細節：PrintAction 與官方 PDF 為影像式無法解析，僅由模組層描述佐證原料/成品/耗材三類與低庫存自動補貨
- 三套之間 SFDC 命名差異的精確對應（Tharstern Shop Floor Capture vs EFI AutoCount 4D vs Avanti Shop Floor Data Collection module）在採集欄位粒度上的逐項對照，公開資料不足以做欄位級比對

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

實際以 WebFetch 打開 5 個關鍵來源 URL，4 個全文可達且內容逐字支撐對應宣稱：(1) Printing News 的 Avanti Automated Press Sheet Optimizer 頁逐項確認「在 Estimate/Sales order 階段算最佳版面」「算 gang run 的 plates/ink/substrate/press 計算與成本」「算每品項 number up」「處理 single/multi form/versioning/combo」「以 JDF/PDF 匯出 Apogee/Prinergy/Prinect」全部命中；(2) Yumpu 的 EFI PrintFlow datasheet 逐字確認 TGO 由 Udi Arieli 團隊將 Goldratt 限制理論應用於印刷、同步數萬作業、互動甘特拖放、上下游相依、整合 EFI MIS 與 Auto-Count DMI；(3) epssw.com 的 AC4D 頁確認 DMI 防 under/overrunning、降廢「typically by 2%」、效率「up to an impressive 20%」、整合 Radius/PrintFlow 4D/CorrPlan/DFE、browser-based，量化數字完全相符；(4) printepssw.com 的 Metrix 頁逐字確認「up to 160 different orders on a single layout」、嵌入 Pace/Monarch/Tharstern/Technique、智慧演算法選最省成本印法/印刷機/紙張、MXML/CSV 輸入 JDF/imposed PDF 輸出；(5) printepssw.com 的 Tharstern 頁確認五大功能區（Pre-Sales&Sales / Job&Order / Pre-Production / Production / Post-Production）。EFI Pace release-notes URL（pace-clientfiles.efi.com/.../33-01/）回傳 ECONNREFUSED——與研究 not_found 自陳「頁面間歇 ECONNREFUSED」完全一致，非編造而是誠實標示。另對兩個最高風險的 EFI Pace 宣稱做獨立 WebSearch 交叉佐證：ganging「每唯一版面建一個 finishing operation 並依 usage percent 拆成本」與「Wireless Inventory Device 核對 job part 計畫數量（不符即警示）」兩者皆有獨立搜尋結果以近乎逐字的措辭佐證，非套模板幻覺。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- 「Auto-Count 秤重 makeready 與生產廢從總用紙扣抵達 component balance（料帳平衡）」此宣稱的唯一來源 Printweek『Joining up the dots』頁在研究中標記為 403、僅由搜尋摘要佐證；本次驗證以 WebSearch 重查仍無法取得獨立佐證（搜尋結果為無關的 AutoCount 會計軟體）。研究已誠實標示 403，故非編造，但屬「未能獨立再驗證」的弱支撐項，借鏡清單中此機制被列為核心可借鏡點，建議降低引用權重或補一手來源。
- KPI 定義中『自動載入紙路與墨量縮短 makeready（案例五色 B2 機換線 7 分鐘）』的具體案例數字未在本次抽查的任一來源出現，亦未獨立查證；屬廠商行銷案例性質，引用時應標為單一廠商案例而非通則。
- PrintFlow『同步數萬筆作業（tens of thousands）』雖在 datasheet 逐字確認，但此為廠商行銷規模宣稱，無第三方基準，作為產能上限的工程依據時應保留懷疑。
- Tharstern 工單欄位『material allocation and status』『actual and estimated activities』兩個具體措辭，在本次抽查的 Tharstern 模組總覽頁（printepssw.com/tharstern-print-mis）未出現（該頁只談業務能力）；研究宣稱來源為另一 Job Management 頁，本次未開該頁，故此兩措辭屬「未在本次抽查 URL 再驗證」，非確認編造但建議補驗來源頁。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- component balance（JMF 料帳平衡）一項：標註來源為 Printweek 403 頁＋搜尋摘要，未能獨立再驗證；在 borrowable 清單中此機制被列為『最具體的在製品建模範式』核心借鏡點，建議引用時降權或補一手來源（如 ePS/Auto-Count 官方頁），勿在 BRD 中當已證實事實直接落地
- 『五色 B2 機換線 7 分鐘』案例數字應明確標為單一廠商行銷案例，不可推廣為換線時間通則或感官系統的目標基準
- Tharstern 工單欄位措辭『material allocation and status』『actual and estimated activities』建議補開研究所稱的 Tharstern Job Management 來源頁再確認，本次抽查的模組總覽頁未見此措辭
- 可於 not_found 補一句：本研究多項 EFI Pace 結構宣稱的一手 release-notes URL 在驗證時段持續 ECONNREFUSED，現有支撐主要來自獨立搜尋之二手摘要交叉佐證，欄位級權威文件仍缺

**來源充分、可信度高的內容**：
- Avanti Slingshot Automated Press Sheet Optimizer 在報價/訂單階段算拼版、輸出 gang run 的 plates/ink/substrate/press 成本、算 number up、處理 single/multi form/versioning/combo、JDF/PDF 匯出印前——五項全部在 Printing News 來源頁逐字命中
- EFI PrintFlow 的 TGO（Udi Arieli/EFI 將 Goldratt 限制理論應用於印刷）、同步數萬作業、互動甘特拖放/上下游相依、整合 EFI MIS 與 Auto-Count DMI——在 Yumpu datasheet 逐字確認
- AutoCount 4D DMI 的量化 KPI（防 under/overrunning、降廢約 2%、效率提升最高約 20%）——在 epssw.com 頁逐字確認，量化數字精確相符，非估算或編造
- Metrix 單版最多 160 訂單、嵌入 Pace/Monarch/Tharstern/Technique、智慧演算法選最省成本印法/印刷機/紙張、MXML/CSV→JDF/imposed PDF——在 printepssw.com 頁逐字確認，含關鍵『160』數字
- EFI Pace ganging 的『每唯一版面建一個 finishing operation、依 usage percent 拆成本』與『Wireless Inventory Device 核對 job part 計畫數量、不符即警示』——雖一手 URL 連線失敗，但獨立 WebSearch 以近乎逐字措辭交叉佐證，可信
- ER-model 的實體名與欄位名（Estimate/Part/Operation/Material/Job Part、usage percent、work center/cost center、run list、makeready/run/downtime、gang run plates/ink/substrate）皆為廠商產品介面/功能模型用語且有來源支撐，並非偽造的內部資料庫 schema——研究在 not_found 明確聲明未取得 DB 表名/欄位級 schema，符合『閉源系統不應給出過於具體內部欄位名』的審查標準
- not_found 段誠實且精準：正確標示閉源 schema 不可得、無統一 OEE 公式、無 run speed 獨立 KPI 欄位、Tharstern fulfillment 頁 404、EFI Pace 官方 PDF 為影像式無法解析——這種對不確定性的顯性標示是防幻覺的正面證據
