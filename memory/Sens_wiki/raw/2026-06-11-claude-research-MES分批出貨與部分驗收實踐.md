---
type: raw
status: raw
created-at: 2026-06-11
source: claude-research
captured-by: claude-on-task
module:
  - 生產任務
  - 品檢
  - 訂單管理
topic-tag:
  - 分批出貨
  - 部分驗收
  - 打包入庫
  - MES
related-vault:
  - "[[出貨單狀態]]"
  - "[[生產任務狀態]]"
  - "[[齊套邏輯]]"
raw-source-link: https://www.planettogether.com/knowledge/splitting
attached-files: []
---

# MES 分批出貨與部分驗收業界實踐（研究筆記）

## 原始素材

Miles 指派研究（2026-06-11）：(1) MTO 印刷廠「先打包入庫、後建單出貨」vs WMS「先建單、後打包」哪個對；(2) 未完工先 QC（臨時分批出貨）的業界做法。WebSearch 結論與來源：

**打包時點**：
- WMS／存貨型電商的標準流是 pick→pack→ship（打包屬出貨段，在出貨指令之後）——適用「接單後從庫存揀貨」的型態（[Mintsoft](https://www.mintsoft.com/warehouse-management/picking-and-packing/)、[Hopstack](https://www.hopstack.io/guides/automated-warehouse-packing)）。
- 按單生產（MTO）的特性是「成品直接對應客戶訂單、不進共用庫存」，成品維持極低庫存、做完即向客戶交付（[Interlake Mecalux](https://www.interlakemecalux.com/blog/make-to-order-mto)、[Epicor](https://www.epicor.com/en-us/blog/industries/custom-make-to-order-manufacturing/)）；客製品常有客戶專屬包裝與標籤要求（[PackemWMS](https://packemwms.com/manufacturing-inventory-management/)）——包裝貼近生產末端而非出貨段。
- 出貨段（dispatch）的核心動作是對齊運輸排程、印貼物流標籤、更新系統、交接物流商（[Unicommerce](https://unicommerce.com/blog/warehouse-management-operations-packing-dispatch/)）。

**部分出貨與拆批**：
- 部分出貨（partial shipment）＝一張客戶訂單拆多次出貨、各自有追蹤碼，為 ERP 標配（[PackageX](https://packagex.io/blog/what-is-partial-shipment)、[Cetec ERP](https://cetecerp.com/support/how-to/how-to-partially-ship-an-order-overview-of-options/)）。
- 製造端對應機制＝拆批（lot/order split）：「當要對客戶部分出貨、或產能來不及做完整單時拆分製造單——split 是每個真實工廠都需要的例外路徑之一」（[PlanetTogether](https://www.planettogether.com/knowledge/splitting)）。
- MES 品質管理：在製程關鍵點強制品檢、支援批次層級的隔離與限制（防止未放行批次被合併或出貨），放行（release）須完成處置與核准（[Critical Manufacturing](https://www.criticalmanufacturing.com/blog/10-reasons-why-a-mes-is-crucial-for-quality-management/)、[Aegis](https://www.aegissofttech.com/insights/guide-lot-testing-in-manufacturing/)）。

## 第一輪初步分析

- 感官的「先打包入庫、後建單出貨」是 MTO 的自然型態（成品屬於特定訂單、包裝是生產延伸），現場做法與 MTO 實踐一致；pick-pack-ship 的「先單後包」適用存貨型，不適用感官。
- 臨時分批的業界正規解是拆批，但感官既有設計（QC 分批驗收累計＋QC 通過數驅動入庫）已具備「滾動驗收」的底子，放寬 QC 派工前置即可達成、不需引入拆批的單據複雜度。
- 候選升級路徑：出貨單狀態卡 v3、工序相依性規則卡、分批出貨情境卡（業務情境單元）。
