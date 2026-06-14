---
type: raw
status: raw
created-at: 2026-06-14
source: claude-research
captured-by: claude-on-task
module:
  - 生產任務
  - 工單
  - QC
topic-tag:
  - MES
  - ISA-95
  - MESA-11
  - B2MML
  - 製造標準
  - 生產回報
  - 產能模型
related-vault:
  - "[[生產任務]]"
  - "[[工單]]"
  - "[[QC]]"
raw-source-link: https://reference.opcfoundation.org/ISA-95/v100/docs/4
attached-files: []
---

# ISA-95 / MESA-11（製造執行系統標準框架） — MES 設計研究筆記

## 研究範圍與方法

Miles 指派研究（2026-06-14）：規劃生產階段 ERP/MES 大架構前，先理解權威系統的最佳實踐。本份為六權威之一。

- **範圍邊界**：聚焦生產執行域 MES 核心 + 管理層能力（排程/產能/拼版/效率折損 KPI）+ 庫存（物料消耗、在製品 WIP、成品入庫）；不展開採購/財務/訂單/CRM。
- **方法**：WebSearch + WebFetch 取真實官方文件，萃取 ER-model / 資料流 / 功能清單 / 庫存 / 排程產能 / 拼版 / KPI。
- **驗證**：另一獨立 agent 對抗式抽查來源真實性與相符性，結論見本卡末「對抗式驗證標記」段。

分類：理論框架（製造業 MES 國際標準：ANSI/ISA-95＝IEC/ISO 62264、MESA-11 功能模型、B2MML 資料交換）

## 系統定位概述

ISA-95（國際對應 IEC/ISO 62264）是企業層（ERP, Level 4）與製造執行層（MES/MOM, Level 3）整合的權威標準，核心是「四大物件模型」（產品定義 product definition / 生產排程 production schedule / 生產績效 production performance / 生產能力 production capability）構成「排程下達、績效回報」的閉環。MESA-11 則是 MES 功能參考模型，定義 11 項核心功能（排程、派工、資料採集、品質、產品追溯、績效分析等）作為「MES 該涵蓋什麼」的清單。B2MML 是 ISA-95 的 XML 實作（XSD schema 集），定義各物件的實際交換訊息結構。三者互補：MESA-11 答「範疇 what」、ISA-95 答「整合架構與資料模型」、B2MML 答「實際訊息格式」。對感官這類按單生產印刷廠，最大借鏡是用四物件閉環把「工單下達→生產回報」標準化，並以 ProductionResponse/SegmentResponse 結構承載良品/不良品/物料消耗回報。

## 一、資料結構（ER-model）

> 寫入 wiki 時改以 mermaid ER / class UML 呈現。

### Product Definition（產品定義）

描述「如何製造」：產品生產規則（product production rule）、物料清單（bill of material）、資源清單（bill of resources），並由有序的 ProductSegment（產品工序段）構成製程路徑。屬排程下達方向的主檔。

關鍵屬性：ID、Description、Version、ProductProductionRule、BillOfMaterial、BillOfResources、ProductSegment（一對多）

關聯：
- 一個 Product Definition 對多個 ProductSegment（工序段）
- ProductSegment 一對多 MaterialSpecification / EquipmentSpecification / PersonnelSpecification
- Product Definition 被 ProductionRequest 引用以決定生產內容

### Production Schedule（生產排程，B2MML: ProductionSchedule）

排程下達物件，由企業層（ERP/L4）下達給 MES（L3）。內含一至多筆 ProductionRequest，回答「要做什麼、做多少、何時完成」。

關鍵屬性：ID、Description、HierarchyScope（適用設備層級範圍）、StartTime、EndTime、ProductionRequest（一對多）

關聯：
- 一張 ProductionSchedule 對多筆 ProductionRequest
- ProductionRequest 對多筆 SegmentRequirement

### ProductionRequest（生產請求）

單一生產訂單層級的請求，對應一筆要被執行的生產工作；引用 Product Definition 決定製法。

關鍵屬性：ID、ProductProductionRuleID、StartTime、EndTime、Priority、SegmentRequirement（一對多）

關聯：
- 一筆 ProductionRequest 對多筆 SegmentRequirement（每個工序段一筆需求）
- 對應一筆 ProductionResponse 回報實績

### SegmentRequirement（工序段需求）

單一工序段（segment＝製造期間任一可被排程的任務）的資源需求，定義該段所需投入。

關鍵屬性：ProcessSegmentID、EarliestStartTime、LatestEndTime、MaterialRequirement、EquipmentRequirement、PersonnelRequirement

關聯：
- 一筆 SegmentRequirement 對多筆 MaterialRequirement / EquipmentRequirement / PersonnelRequirement
- 對應一筆 SegmentResponse 回報該段實績

### Production Performance（生產績效，B2MML: ProductionPerformance / OperationsPerformance）

績效回報物件，由 MES（L3）回報給 ERP（L4）。內含一至多筆 ProductionResponse（B2MML 對應 OperationsResponse），回答「實際做了什麼：數量、消耗、結果」。

關鍵屬性：ID、HierarchyScope、StartTime、EndTime、PerformanceState、OperationsScheduleID（對應的排程）、OperationsResponse / ProductionResponse（一對多）

關聯：
- 一張 ProductionPerformance 對多筆 ProductionResponse
- 透過 OperationsScheduleID / OperationsRequestID 回指對應的排程與請求，形成閉環

### ProductionResponse（生產回應，B2MML: OperationsResponse）

對應某筆 ProductionRequest 的實績回報，內含各工序段的 SegmentResponse。

關鍵屬性：ID、OperationsRequestID（回指請求）、SegmentRequirementID、ResponseState、SegmentResponse（一對多）

關聯：
- 一筆 ProductionResponse 對多筆 SegmentResponse
- 透過 OperationsRequestID 回指 ProductionRequest

### SegmentResponse（工序段回應，B2MML: OpSegmentResponseType）

單一工序段的實際投入產出記錄，是良品/不良品數量、物料消耗、設備工時、人員工時的承載點。對感官最關鍵的回報結構。

關鍵屬性：ProcessSegmentID、StartTime、EndTime、MaterialActual（一對多）、EquipmentActual（一對多）、PersonnelActual（一對多）、ProcessParameter

關聯：
- 一筆 SegmentResponse 對多筆 MaterialActual / EquipmentActual / PersonnelActual
- MaterialActual 區分投入消耗（consumed）與產出（produced）

### MaterialActual（B2MML: OpMaterialActualType）

工序段實際物料異動記錄；以 MaterialUse 區分消耗（Consumed）或產出（Produced），是 WIP 與成品入庫、物料消耗的資料基礎。

關鍵屬性：MaterialClassID、MaterialDefinitionID、MaterialLotID、MaterialSubLotID、MaterialUse（Consumed/Produced）、Quantity（QuantityValue + UnitOfMeasure）、MaterialActualProperty

關聯：
- 屬於一筆 SegmentResponse
- MaterialLotID 對應 Material Lot（批）實體，Material Lot 對多 Material Sublot（子批）

### EquipmentActual（B2MML: OpEquipmentActualType）

工序段實際設備使用記錄；承載稼動工時、設備用途，是 OEE / 稼動率計算來源。

關鍵屬性：EquipmentClassID、EquipmentID、EquipmentUse、Quantity（如使用時數）、EquipmentActualProperty

關聯：
- 屬於一筆 SegmentResponse
- EquipmentID 對應設備層級（work unit / work center）

### PersonnelActual（B2MML: OpPersonnelActualType）

工序段實際人員投入記錄；承載人員工時，是工時效率 KPI 來源。

關鍵屬性：PersonnelClassID、PersonID、PersonnelUse、Quantity（如工時）、PersonnelActualProperty

關聯：
- 屬於一筆 SegmentResponse
- PersonID 對應 Personnel（人員）實體，Personnel 屬 Personnel Class（角色類）

### Material（物料：Class / Definition / Lot / Sublot 四層）

ISA-95 物料模型四層：Material Class（邏輯分群）→ Material Definition（物料型別）→ Material Lot（唯一可識別批）→ Material Sublot（批內追蹤解析度）。庫存與在製品（WIP）以批為單位流動。

關鍵屬性：MaterialClassID、MaterialDefinitionID、MaterialLotID、MaterialSubLotID、Quantity、AssemblyType / AssemblyRelationship、Location（儲位）

關聯：
- Material Class 一對多 Material Definition
- Material Definition 一對多 Material Lot
- Material Lot 一對多 Material Sublot
- Lot 透過 MaterialActual 在工序段間消耗與產出（驅動 WIP 與成品入庫）

### Equipment Hierarchy（設備層級）

角色式（role-based）巢狀設備層級：Enterprise（企業）→ Site（廠區）→ Area（區域）→ Work Center（工作中心：line/cell/unit/storage zone）→ Work Unit（最小可控單元）。所有排程與績效以 HierarchyScope 綁定到此層級。

關鍵屬性：Enterprise、Site、Area、WorkCenter（含 ProcessCell / ProductionUnit / ProductionLine / WorkCell / StorageZone 等具體型）、WorkUnit、EquipmentClass

關聯：
- Enterprise 一對多 Site
- Site 一對多 Area
- Area 一對多 Work Center
- Work Center 一對多 Work Unit
- Storage Zone 為 Work Center 的一種，承載庫存定位

### Process Segment（製程段，主檔層）

製造期間任一可被排程的任務的可重用定義，宣告該任務所需的物料、設備、人員資源規格（區別於 ProductSegment 是產品專屬）。

關鍵屬性：ID、Duration、MaterialSpecification、EquipmentSpecification、PersonnelSpecification

關聯：
- Process Segment 被 SegmentRequirement / SegmentResponse 引用
- 一個 Process Segment 對多個資源規格

### Production Capability（生產能力，B2MML: ProductionCapability）

產能回報物件（capability up），描述某時段內可用的產能、設備、人員、物料能力（Committed/Available/Unattainable），供 ERP 規劃使用。

關鍵屬性：HierarchyScope、CapabilityType（Committed/Available/Unattainable）、StartTime、EndTime、ProcessSegmentCapability、EquipmentCapability、MaterialCapability、PersonnelCapability

關聯：
- 一張 Production Capability 對多筆各資源 Capability
- ProcessSegmentCapability 對多筆設備/物料/人員能力

## 二、資料流程

### 排程下達閉環（Schedule-down，ERP→MES）

1. L4 ERP 依訂單與計畫產生 ProductionSchedule
2. ProductionSchedule 內以 ProductionRequest 表達單筆生產工作，引用 Product Definition（含 BOM、工序段路徑）決定製法
3. 每筆 ProductionRequest 依 Product Definition 的 ProductSegment 展開為多筆 SegmentRequirement
4. 每筆 SegmentRequirement 攜帶 MaterialRequirement / EquipmentRequirement / PersonnelRequirement（該工序段所需投入）
5. 以 HierarchyScope 綁定到設備層級（site/area/work center），下達給 L3 MES 執行

### 績效回報閉環（Performance-up，MES→ERP）

1. MES 在工序段執行中採集數量、工時、機台狀態、製程值（MESA-11 功能 5 資料採集）
2. 每完成一個工序段，產生 SegmentResponse（OpSegmentResponseType）
3. SegmentResponse 內以 MaterialActual 記錄物料消耗（Consumed）與產出（Produced，含良品/不良品數量）、EquipmentActual 記錄設備工時、PersonnelActual 記錄人員工時
4. 多筆 SegmentResponse 彙整為 ProductionResponse（OperationsResponse），透過 OperationsRequestID 回指原 ProductionRequest
5. 多筆 ProductionResponse 彙整為 ProductionPerformance，透過 OperationsScheduleID 回指原 ProductionSchedule，回報給 L4 ERP，完成閉環

### 物料/WIP/成品流動（庫存視角）

1. 工序段開工：MaterialActual 以 MaterialUse=Consumed 記錄投入物料 Lot 的消耗（庫存扣減）
2. 工序段進行中：產出物以 Material Lot/Sublot 形式存在，於工序段間移轉即為在製品（WIP）
3. 工序段完工：MaterialActual 以 MaterialUse=Produced 記錄產出 Lot（含良品/不良品分流）
4. 完工入庫：產出 Lot 移至 Storage Zone（Work Center 的一種）形成成品庫存
5. 產品追溯（MESA-11 功能 10）：透過 MaterialLotID 串接各工序段消耗與產出，建立 genealogy（族譜）

### 產能回報（Capability-up，可選）

1. MES 依設備層級彙整某時段的可用產能
2. 以 ProductionCapability 物件分類 Committed（已承諾）/ Available（可用）/ Unattainable（不可達）
3. 攜帶 EquipmentCapability / MaterialCapability / PersonnelCapability
4. 回報 L4 供 ERP 在產生下一輪 ProductionSchedule 時做有限產能規劃

## 三、功能清單

| 功能分類 | 功能項 |
|---------|--------|
| MESA-11 核心 MES 功能（11 項） | 1. 作業排程 / 細部排程 Operations/Detailed Scheduling（訂單在產線與機台上的細部排序，含換線、批量、資源平衡）、2. 資源配置與狀態 Resource Allocation & Status（即時追蹤機台/工具/治具/物料/人員：可用、使用中、故障）、3. 派工生產單元 Dispatching Production Units（依現況與計畫釋放並路由訂單與物料至現場）、4. 文件管理 Document Control（工作指示、圖面、規格、檢驗表單派送至作業點）、5. 資料採集 Data Collection/Acquisition（採集數量、工時、機台狀態、製程值；其他功能的基礎層）、6. 人員管理 Labour Management（依技能與可用性追蹤人員、出勤與任務指派）、7. 品質管理 Quality Management（檢驗計畫、製程中管制、基礎 SPC、不合格處理、稽核軌跡）、8. 製程管理 Process Management（製程流、路徑、配方控制與製程中參數強制）、9. 維護管理 Maintenance Management（預防保養排程、故障歷史、狀態式維護）、10. 產品追蹤與族譜 Product Tracking & Genealogy（元件/批次/工序/品質結果全數綁定 Lot 或序號）、11. 績效分析 Performance Analysis（OEE、前置時間、不良率等 KPI 的營運與管理層評估） |
| ISA-95 Part 3：L3 四大操作域（每域 8 活動） | 生產操作管理 Production Operations Management、維護操作管理 Maintenance Operations Management、品質操作管理 Quality Operations Management、庫存操作管理 Inventory Operations Management（material flow / work-in-progress / locations / stock levels） |
| ISA-95 四大資訊物件（閉環） | 產品定義 Product Definition（下達：how to make it）、生產排程 Production Schedule（下達：what/how much/by when）、生產能力 Production Capability（上報：可用產能/設備/物料）、生產績效 Production Performance（上報：實際產出/消耗/結果） |
| B2MML 交換訊息動詞（每物件一組 BOD verbs） | Get / Show（查詢與回應）、Process / Acknowledge（處理與確認）、Change / Respond（變更與回應）、Cancel / Sync（取消與同步）；套用於 OperationsSchedule、OperationsPerformance、ProductDefinition、MaterialLot 等各物件 |

## 四、庫存處理（Miles 重點關注）

ISA-95 以「物料四層模型」建模庫存，並由 ISA-95 Part 3 的「庫存操作管理（Inventory Operations Management）」域明確涵蓋物料流、在製品（WIP）、儲位與庫存水位。四層為：Material Class（邏輯分群，如「銅版紙」）→ Material Definition（具體物料型別）→ Material Lot（唯一可識別的批，庫存以批為單位）→ Material Sublot（批內追蹤解析度）。流動機制全部掛在 SegmentResponse 內的 MaterialActual（OpMaterialActualType）上，關鍵欄位為 MaterialUse：值為 Consumed 代表投入消耗（庫存扣減）、Produced 代表工序段產出。在製品（WIP）並非獨立實體，而是「已被某工序段 Produced、但尚未被下一工序段 Consumed 的 Material Lot/Sublot 在工序段間移轉中的狀態」——以 Lot 在設備層級（Work Unit→Work Center）間的位置表達。成品入庫＝產出 Lot 移至 Storage Zone（Storage Zone 是 Work Center 的一種設備層級型別，承載庫存定位）。良品/不良品分流透過 MaterialActual 的 Quantity（良品產出）與品質結果（不合格走 Quality Operations）區分。對感官的價值：可借用「Lot 為庫存單位 + MaterialActual.MaterialUse 區分消耗/產出 + Storage Zone 承載成品庫位」這套標準語意，把目前 ERP 痛點的物料消耗、WIP、成品入庫統一建模為「批在工序段間的消耗-產出移轉」。Gardner Web 範例證實實際訊息以 MaterialProducedActual（含 MaterialDefinition / MaterialLotID / Quantity）承載上報。

## 五、排程與產能

ISA-95 將排程定位在 L3（Manufacturing Operations Management），介於 L4 ERP 與 L0–2 現場之間；ERP 釋放訂單與交期，L3 的 FCS/APS（Advanced Planning & Scheduling）對有限產能排序，MES 執行並回饋實績。核心是有限產能排程（Finite Capacity Scheduling, FCS）對比 ERP/MRP 的無限產能假設（MRP 假設每個工作中心能吸收任意需求量，FCS 推翻此假設，每筆訂單必須塞進特定資源的真實行事曆，含真實換線時間、工具可用性、人力限制）。排程方向有順排（forward）與逆排（backward）：逆排自交期回推開工時點，順排問「不與其他訂單衝突下能塞在哪」。FCS 五大派工規則：EDD（最早交期優先，保交期）、SPT（最短加工時間優先，降平均流程時間）、Critical Ratio（剩餘時間÷剩餘加工時間動態重排）、Setup-Optimised（將相似訂單成組以減少換線）、Bottleneck-First（DBR/TOC，先排瓶頸資源）；實務多採混合（EDD 視窗內做 Setup-Optimised）。工作中心負載以「資源真實行事曆 + 換線時間 + 工具/人力可用性」建模；MES 即時回饋實際工時（標準工時實務偏差可達 25%）與機台狀態，使排程能動態重排、訂單提前/延後完工時自動更新產能。產能回報則由 ProductionCapability 物件以 Committed/Available/Unattainable 三態上報供 ERP 規劃。對感官借鏡：既有 ERP 已有回溯排程（即 backward scheduling）與派工看板，可補上 Setup-Optimised 規則（與印刷換版/換色高度相關）與瓶頸資源優先排程。

## 六、拼版優化（印刷特化）

不適用 / 無此原生功能。ISA-95、MESA-11、B2MML 皆為跨製造業的通用標準框架，不含印刷專屬的拼版 / 併單 / nesting（imposition / gang-run）能力——標準層級只到「Process Segment（工序段）」與「物料 Lot」的抽象，不涉及版面拼排幾何優化。最接近的標準語意是 FCS 派工規則中的 Setup-Optimised（將相似訂單成組以減少換線/換版次數），這是「批次成組以省 setup」的通用概念，可作為拼版「併單以攤平版費」的上位思維，但標準本身不提供拼版演算法。拼版優化屬印刷專屬 MES / prepress 系統（如 imposition 軟體）範疇，需感官自行設計或外掛，ISA-95 框架僅能提供「成組後的訂單如何以 ProductionRequest/SegmentRequirement 表達」的承載結構。

## 七、KPI 指標

| KPI | 定義 / 計算方式 |
|-----|----------------|
| OEE（Overall Equipment Effectiveness，整體設備效率） | MESA-11 功能 11 與 ISA-95 生產操作域明確指名的主 KPI，跨三維度：可用率（Availability）× 效能（Performance）× 良率（Quality）。資料來源為 EquipmentActual（稼動工時）與 MaterialActual（良品/不良品數量）。本研究來源僅指名三維度，未給細部係數。 |
| Scrap rate / Spoilage（不良率 / 折損率） | MESA-11 績效分析功能列舉的 KPI；symestic ISA-95 範例以實際數字示意「480 good, 12 scrap」（良品 480、不良 12）。資料來源為 MaterialActual 中 Produced 數量的良品與不良品分流。對感官印刷折損率高度相關。 |
| Availability（可用率）/ Downtime（停機時間） | OEE 子維度與維護操作域 KPI；範例引用「−10% downtime」。來源為 EquipmentActual 的設備狀態與工時記錄。 |
| Lead time（前置時間） | MESA-11 績效分析功能列舉，評估從投入到產出的時間；來源為 SegmentResponse 的 StartTime/EndTime。 |
| Rolled Throughput Yield, RTY（滾動直通良率） | MESA-11 績效分析相關 KPI，衡量多工序段全程一次通過的良率（各工序良率連乘）。 |
| Schedule adherence / Capacity utilization（排程達成率 / 產能稼動率） | FCS 與細部排程隱含的關鍵指標（symestic 來源稱 implied as critical，未給明確公式）；衡量實際執行對排程的符合度與資源被有效使用的比例。 |

## 八、對感官 ERP 的借鏡 / 不適用

**可借鏡**：
- 四物件閉環標準化「工單下達→生產回報」：感官既有工單/生產任務可對映 ProductionRequest/SegmentRequirement（下達）與 ProductionResponse/SegmentResponse（回報），把回報結構化為「每工序段一筆 SegmentResponse 承載良品/不良品/物料消耗/工時」
- SegmentResponse 內 MaterialActual.MaterialUse=Consumed/Produced 是統一建模庫存的關鍵：可同時解決物料消耗、WIP（已產出未消耗的 Lot 在工序段間移轉）、成品入庫（移至 Storage Zone）三個感官庫存痛點
- 物料四層（Class→Definition→Lot→Sublot）+ Storage Zone 為設備層級型別：給感官庫存建模一套權威語意，Lot 為庫存與追溯單位
- FCS 五大派工規則中的 Setup-Optimised（相似訂單成組減少換線）與 Bottleneck-First（瓶頸優先）：直接對應印刷換版/換色成本與瓶頸機台（如印刷機）排程，可補強既有派工看板
- 管理層 KPI 來源明確化：OEE 來自 EquipmentActual+MaterialActual、折損率來自 Produced 良品/不良品分流——感官的折損率 KPI 可直接掛在工序段回報結構上計算
- 產品追溯（genealogy）以 MaterialLotID 串接各工序段消耗-產出：對印刷品質追溯（哪批紙/油墨進了哪批成品）有現成模型
- ProductionCapability 三態（Committed/Available/Unattainable）上報供 ERP 規劃：感官管理層產能規劃可借此把「已承諾/可用/不可達」產能顯性化

**不適用 / 不照搬**：
- 原生拼版/併單/nesting（imposition/gang-run）：ISA-95/MESA-11/B2MML 不涵蓋印刷版面幾何優化，需另行設計或外掛 prepress 系統
- 批次製程歷史化（BatchML 的 batch historian 擴充）：感官按單離散生產為主，流程批次（batch）歷史模型相關性低
- 維護操作管理（Maintenance Operations）域的完整 CMMS 能力：超出本研究生產執行+庫存範圍，且感官痛點不在此
- L0–L2 現場控制整合（PLC/SCADA/感測致動）：ISA-95 下層整合對印刷廠相關但非本研究焦點，且感官 ERP 不下探到設備控制層

## 來源（真實查證）

- [OPC Foundation — Common Object Model: ISA-95（OPC-10030 §4 Concept）](https://reference.opcfoundation.org/ISA-95/v100/docs/4) — ISA-95 物料模型四層（Class/Definition/Lot/Sublot）、設備角色式分類、人員/實體資產模型；確認此 OPC UA 對映僅涵蓋資源主檔子集、不含生產排程/績效/能力三物件（用於界定來源範圍）
- [Symestic — The 11 Core MES Functions Explained (MESA 11)](https://www.symestic.com/en-us/what-is/mesa-11) — MESA-11 全 11 項功能的確切名稱與定義；OEE/scrap/lead time/RTY 等 KPI；MESA-11（what）與 ISA-95 Part 3（how，4 操作×8 活動 32 格矩陣）的互補關係
- [Wikipedia — ANSI/ISA-95](https://en.wikipedia.org/wiki/ANSI/ISA-95) — 設備層級（enterprise/site/area/work center/work unit + process cell/production unit/production line/work cell/storage zone）、功能層級 0–4、Part 2 物件（ProductionRequest/SegmentRequirement、ProductionResponse/SegmentResponse、product production rule/BOM/bill of resources/ProductSegment）、四資訊類別、Part 5 交易 / Part 6 訊息、B2MML
- [Symestic — ISA-95: The Standard for MES Architectures and ERP Integration](https://www.symestic.com/en-us/blog/mes/isa95) — 功能層級 0–4 各層職責、設備層級五層定義、四物件閉環（product definition/production schedule 下達；capability/performance 上報）、庫存操作管理域涵蓋 material flow/WIP/stock levels、OEE/scrap/downtime KPI 與實例數字
- [GitHub MESAInternational/B2MML-BatchML — B2MML-OperationsPerformance.xsd](https://github.com/MESAInternational/B2MML-BatchML/blob/master/Schema/B2MML-OperationsPerformance.xsd) — OperationsPerformance/OperationsResponse 確切型別與巢狀（含 OperationsScheduleID/OperationsRequestID 回指）、八個 B2MML 交易動詞（Get/Show/Process/Acknowledge/Change/Respond/Cancel/Sync）
- [GitHub MESAInternational/B2MML-BatchML — B2MML-OperationsPerformanceTypes.xsd（OpSegmentResponseType）](https://github.com/MESAInternational/B2MML-BatchML/blob/master/Schema/B2MML-OperationsPerformanceTypes.xsd) — SegmentResponse 的實績子元素確切欄位：MaterialActual（MaterialClassID/MaterialDefinitionID/MaterialLotID/MaterialSubLotID/Quantity/MaterialUse）、EquipmentActual、PersonnelActual、PhysicalAssetActual 及 Quantity/QuantityValue 結構
- [Gardner Web — B2MML Explained](https://www.gardnerweb.com/articles/b2mml-explained) — production performance 由多筆 production response、再由多筆 segment response 組成的確認；實際上報 XML 範例 MaterialProducedActual（MaterialDefinition/MaterialLotID/Quantity/QuantityString/UnitOfMeasure）
- [Symestic — Finite Capacity Scheduling: FCS vs. Infinite & MES Role](https://www.symestic.com/en-us/what-is/fcs) — FCS vs MRP 無限產能、順排/逆排、五大派工規則（EDD/SPT/Critical Ratio/Setup-Optimised/Bottleneck-First DBR/TOC）、MES 即時回饋實際工時（偏差達 25%）動態重排
- [Symestic — Detailed Scheduling: Finite Capacity, APS & MES Role（搜尋摘要）](https://www.symestic.com/en-us/what-is/detailed-scheduling) — 細部排程位於 L3 由 APS 執行、ERP 釋放訂單與交期、FCS/APS 對有限產能排序、MES 執行回饋的層級分工確認

## 查無公開資料（誠實標註，禁編造補齊）

- ISA-95 各物件（ProductionRequest/SegmentResponse 等）的完整欄位逐一清單與資料型別——標準正文（ANSI/ISA-95.00.02）需付費購買，本研究僅取得 OPC UA 對映、Wikipedia、B2MML XSD 與技術文章層級的物件/元素名，未取得官方完整屬性表
- OEE、RTY、schedule adherence 的官方精確計算公式與係數——來源僅指名 KPI 與三維度（Availability×Performance×Quality），未給標準定義的逐項公式
- MaterialRequirement / EquipmentRequirement / PersonnelRequirement 在 ProductionSchedule 端的完整巢狀欄位——僅由搜尋摘要與 Wikipedia 確認其存在與層級關係，未逐欄取得（對應的 B2MML-OperationsScheduleTypes.xsd 未實際 fetch）
- B2MML ProductionCapability 物件的完整 XSD 元素清單——僅取得物件存在與 Committed/Available/Unattainable 三態概念，未逐欄驗證
- 印刷專屬拼版/併單演算法——確認 ISA-95/MESA-11/B2MML 不含此原生能力，屬非標準範疇（不是查不到，是標準本就不涵蓋）

## 對抗式驗證標記（claude-verify，防 Model Collapse）

**整體信度**：high

**來源抽查結果**：

抽查 4 個來源（其中 Wikipedia 打 2 次），結果如下。

1. GitHub B2MML-OperationsPerformanceTypes.xsd（最具體的欄位級宣稱）— URL 可達，內容逐字相符。確認 OpSegmentResponseType 確實包含 MaterialActual / EquipmentActual / PersonnelActual / PhysicalAssetActual 四個子元素；OpMaterialActualType 確實含 MaterialClassID / MaterialDefinitionID / MaterialLotID / MaterialSubLotID / MaterialUse(MaterialUseType) / Quantity(QuantityValueType)。研究中最容易被懷疑「過於具體」的欄位名，反而被原始 XSD 完整證實——因為 ISA-95/B2MML 是公開發布標準（XSD 公開於 GitHub），這些不是閉源系統的內部 DB 欄位，可合法逐欄驗證。

2. Symestic MESA-11 頁 — URL 可達，內容逐字相符。11 項功能名稱（Operations/Detail Scheduling、Resource Allocation & Status、Dispatching Production Units、Document Control、Data Collection、Labour Management、Quality Management、Process Management、Maintenance Management、Product Tracking & Genealogy、Performance Analysis）全部對得上；KPI（OEE / scrap / lead time / RTY）有提及；「MESA-11 答 what、ISA-95 Part 3 答 how、4 操作×8 活動=32 格矩陣」的互補框架被該頁原文證實。

3. Symestic FCS 頁 — URL 可達，內容逐字相符。FCS vs MRP 無限產能假設、五大派工規則（EDD/SPT/Critical Ratio/Setup-Optimised/Bottleneck-First DBR/TOC）及各自定義、順排/逆排、MES 即時回饋實際工時、「標準工時偏差達 25%」（頁面引 Meleghy Automotive 案例的具體數字）全部對得上。

4. Wikipedia ANSI/ISA-95 — URL 可達，但 WebFetch 的 markdown 萃取只擷取到側欄/infobox（僅 B2MML 在側欄出現），未擷取正文 prose，導致設備層級與物件名查詢回報「absent」。判定這是 fetcher 萃取限制而非內容缺失：(a) 同網域的 Symestic 兩頁與 GitHub XSD 三項皆逐字命中；(b) 這些 ISA-95 設備層級（enterprise/site/area/work center/work unit + process cell 等）與 Part 2 物件名是公認標準內容；(c) 研究本身的 sources 條目對 Wikipedia 的「what_obtained」與這些詞一致。故不把此次萃取失敗當作編造訊號。

**需謹慎引用 / 無來源支撐或過度泛化的宣稱**：
- 「MES 即時回饋實際工時（標準工時實務偏差可達 25%）」——FCS 來源確有此數字，但來源是 Symestic 引用單一客戶案例（Meleghy Automotive 沖壓線），研究把它寫成泛化的「標準工時實務偏差可達 25%」，有把個案數字過度泛化為通則之嫌。屬 supported-but-overgeneralised，非編造。
- OEE = 可用率 × 效能 × 良率 的三維度結構雖有來源，但研究已在 kpi_metrics 自行註明「來源僅指名三維度，未給細部係數」；此屬已被研究自我標註的限制，非未支撐宣稱。
- ProductionResponse 含 key_attributes「ResponseState」、ProductionRequest 含「Priority」、SegmentRequirement 含「EarliestStartTime / LatestEndTime」等部分屬性——這些屬 OperationsScheduleTypes / ProductDefinition 等未實際 fetch 的 XSD，研究在 not_found 已聲明「對應的 B2MML-OperationsScheduleTypes.xsd 未實際 fetch」。故這些下達端欄位名屬「合理推定但未逐欄驗證」，可信度中等，非編造（皆為標準公開元素名，且研究已誠實標註未驗證）。

**建議修正 / 剔除（精練進 wiki 前必處理）**：
- 建議把 scheduling_capacity 段「標準工時實務偏差可達 25%」改寫為「某沖壓線案例偏差達 25%（Symestic 引 Meleghy Automotive）」，避免把單一客戶個案數字泛化為產業通則。
- 建議在 ProductionRequest.Priority / ResponseState / SegmentRequirement 時間欄位等「下達端」屬性旁，比照 not_found 的誠實標註，明示「來自 Wikipedia / 搜尋摘要層級，未經對應 XSD 逐欄驗證」，與已逐字驗證的回報端（SegmentResponse/MaterialActual）欄位作可信度區分。
- Wikipedia 來源的 what_obtained 內容本身可信，但建議補一個非 Symestic、非 Wikipedia 的獨立第三方來源（如 ISA 官方或學術文獻）交叉佐證設備層級與 Part 2 物件名，因目前設備層級五層與 Part 2 物件名實質僅靠 Wikipedia 單一來源支撐（本次驗證中該頁正文未能由 fetcher 萃取確認）。

**來源充分、可信度高的內容**：
- SegmentResponse / MaterialActual 的欄位結構（MaterialClassID / MaterialDefinitionID / MaterialLotID / MaterialSubLotID / MaterialUse / Quantity）經 B2MML XSD 原始檔逐字證實——這是全研究最具體也最易被質疑的部分，反而是證據最硬的部分。
- MESA-11 全 11 項功能名稱與順序、以及「MESA-11 答 what / ISA-95 Part 3 答 how / 32 格矩陣」互補框架，經 Symestic 頁原文證實。
- FCS 五大派工規則（EDD / SPT / Critical Ratio / Setup-Optimised / Bottleneck-First DBR/TOC）及定義、順排逆排、FCS vs MRP 無限產能對比，經 Symestic FCS 頁原文證實。
- 四物件閉環（Product Definition / Production Schedule 下達；Production Capability / Production Performance 上報）與透過 OperationsScheduleID / OperationsRequestID 回指形成閉環的描述，與 B2MML OperationsPerformance schema 結構一致。
- 研究方法論誠實：B2MML 欄位名一律以「B2MML:」型別屬性標註來源、KPI 公式明確標為 not_found 而未編造係數、not_found 段落如實聲明標準正文付費未取得與哪些 XSD 未 fetch——無套模板幻覺特徵。
