---
type: raw
status: raw
created-at: 2026-07-21
source: claude-research
captured-by: claude-on-task
module:
  - 工單
  - 生產任務
  - 轉交單
  - QC
  - cross-module
topic-tag:
  - MES
  - ERP
  - 訂單到生產
  - 排程可視化
  - 產能
  - BOM
  - 工序
  - 報工
  - 在製品轉交
  - 過度設計
related-vault:
  - "[[工單狀態]]"
  - "[[生產任務狀態]]"
  - "[[任務狀態]]"
  - "[[轉交單狀態]]"
  - "[[齊套邏輯]]"
  - "[[設備]]"
  - "[[工作包]]"
raw-source-link: https://docs.frappe.io/erpnext/work-order
---

# MES / ERP「訂單到生產」業界做法 — 研究筆記（接單式客製生產情境）

## 研究範圍與方法

Miles 指派研究（2026-07-21）：現行工廠階段設計疑似過於複雜，調研業界 MES / ERP 在訂單與製作的做法，聚焦設計哲學與風險。商業需求範圍：(1) 設備產能與工期排程可視化 (2) 產線 / 多道工序 / BOM (3) 廠內商品轉交 (4) 報工與品檢等生產生命週期。情境限定：接單式客製生產、無倉儲需求。

- **方法**：deep-research workflow（多路 WebSearch → 來源抓取 → 逐條主張萃取含引文 → 對抗式三票驗證 → 統整）。
- **驗證狀態（透明標註）**：搜尋與來源萃取完成；對抗式驗證階段因 API 用量上限中斷——1 條主張以 3-0 通過驗證，其餘 14 條為「官方文件一手引文、未完成對抗式複驗」。Miles 反查時以下列 URL 為準。

## 原始素材（逐條主張 + 來源）

### 主題一：訂單如何展開為工單

1. **［已驗證 3-0］** ERPNext 中工單（Work Order）可由基於銷售訂單的生產計畫（Production Plan）產生，也可直接從銷售訂單建立——即「客戶訂單 → 生產計畫 → 工單」與「訂單 → 工單」兩種展開路徑並存。
   來源：https://docs.frappe.io/erpnext/work-order （原文：「The Work Order can be generated from the Production Plan based on Sales Orders. ... A Work Order can also be directly created from a Sales Order.」）
2. ERPNext 的層級為「工單 → 工序（Operations）→ 工序卡（Job Card）」：工序自 BOM 帶入工單；工單送出後系統為各工序自動建立工序卡；工序狀態（Pending / Work In Progress / Completed）與實際工時、成本皆由工序卡回報更新。報工的載體是工序層的工序卡，而非另設獨立報工單據。
   來源：https://docs.frappe.io/erpnext/work-order 、 https://docs.frappe.io/erpnext/job-card
3. 工序卡完成後回寫工單的生產進度——工序層報工驅動工單層進度統計（向上反映）。
   來源：https://docs.frappe.io/erpnext/job-card
4. 每張工序卡綁定特定工序與特定工作站（Workstation）；多名員工做同一工序時另開多張工序卡。
   來源：https://docs.frappe.io/erpnext/job-card

### 主題二：BOM 與工序（routing）建模

5. ERPNext 工單中的工序與工作站從產品 BOM 帶出，官方建議在 BOM 上先設定 Routing（工藝路線）——建模上是 BOM 內嵌 / 引用工藝路線，而非每張工單各自定義工序。
   來源：https://docs.frappe.io/erpnext/job-card
6. ERPNext 允許在單張工單層級覆寫預設 BOM 與工序內容（可換 BOM、可改工序與工作站）——客製單（一次性製造需求）不必為每張單新建正式 BOM 的內建彈性機制。
   來源：https://docs.frappe.io/erpnext/work-order
7. Odoo 中工作中心（work center）是工序的執行地點；工序與工作中心的綁定在 BOM 的 Operations 頁籤完成——Odoo 的工藝路線內嵌在 BOM 內，不是獨立文件。
   來源：https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html
8. **（設計哲學關鍵）** Odoo 把「工單／工作中心」設計為可選層級：Work Orders 功能預設關閉，關閉時系統只有製造訂單（MO）一層，工作中心不會出現——主流 ERP 讓小型工廠簡化導入（先不拆工序）的內建做法。
   來源：同上（Odoo work centers 官方文件開頭即註明需先啟用 Work Orders 功能）

### 主題三：設備產能與排程可視化

9. Odoo 工作中心只用少數幾個參數建模產能：Capacity（同時可加工數量）、Time Efficiency（速度倍率）、Setup / Cleanup Time（前置與收尾時間）、Alternative Workcenters（不可用時的替代工作中心）——而非要求完整的有限產能排程引擎設定。
   來源：https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html
10. Odoo 的排程可視化是「依工作中心的規劃檢視（甘特圖）」：顯示各工作中心已排定的工序、每小時負載與起訖時間，可直接點入改時間或改派工作中心。
    來源：同上
11. ERPNext 工單送出時做有限產能排程：依計畫開始日與工作站可用性（時段、假日表、時段是否已被其他工單占用）依序為每個工序保留時段，預設排程視窗 30 天，工序超過可用時段時要求拆分。
    來源：https://docs.frappe.io/erpnext/work-order
12. Odoo 在工作中心層級追蹤 OEE（實際生產佔可用工時百分比）、Lost（停工損失）、Load（負載）、Performance（實際對預期工時比）——報工資料即足以支撐這些指標，無需額外單據。
    來源：https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html

### 主題四：廠內在製品轉交（WIP transfer）

13. ERPNext 追蹤在製品的標準做法是以庫存分錄（Stock Entry, "Material Transfer for Manufacture"）把物料移轉到 WIP 倉，但提供「Skip Material Transfer to WIP Warehouse」選項可跳過此單據、改以倒扣（backflush）直接視為耗用——WIP 移轉單據在設計上是可選而非必要。
    來源：https://docs.frappe.io/erpnext/work-order
14. ERPNext 工序間物料移轉可設定「Transfer Material Against = Job Card」：逐工序發起移轉；不設定則整張工單一次轉——逐工序轉交是可選精細度，不是強制的獨立轉交單據層。
    來源：https://docs.frappe.io/erpnext/job-card

### 主題五：報工與品檢生命週期

15. ERPNext 工序卡同時承載報工與製程中品檢：報工以 Time Logs（開始 / 完成時間、指派員工、完成數量）記錄；v13 起可針對工序卡建立 Quality Inspection 做半成品的製程中品檢，與進料 / 出貨檢驗區分——報工與品檢共用同一工序層載體，不各自成獨立單據體系。
    來源：https://docs.frappe.io/erpnext/job-card

### 調研過程收集、未及深查的延伸來源（可反查）

- ISA-95 標準介紹：https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard
- 有限 vs 無限產能排程：https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/finite-capacity 、 https://www.planettogether.com/aps-trends/the-difference-between-finite-capacity-scheduling-and-infinite-capacity-loading
- 接單式小廠（job shop）ERP 導入：https://www.thefabricator.com/thefabricator/article/cadcamsoftware/erp-software-for-the-job-shop-reaches-a-turning-point
- Odoo 兩步驟製造（簡化流程）：https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/two_step_manufacturing.html
- MES 反模式（含 paper-on-glass 議題）：https://www.picomes.com/resources/blog/oped-3-fixes-for-the-mes-industry 、 https://tulip.co/blog/mes-isa-95-mes-11-cmes-namur/

## 第一輪初步分析（Claude 寫）

- 觀察 1：業界主流層級是「訂單 → 工單 → 工序（工序卡）」三層，工序卡是報工、品檢、設備綁定、逐工序物料移轉的**共同載體**；對照現行五層單據鏈（訂單→印件→工單→任務→生產任務）＋工作包＋派單七實體（見 [[印件生產流程]]），「任務」層（按廠商打包交付追蹤）是業界沒有的中間層，候選簡化點。
- 觀察 2：兩大開源 ERP 的共同設計哲學是「複雜度做成可選開關、預設簡單」（Odoo 工單層預設關閉、ERPNext WIP 移轉單可跳過、逐工序轉交可選）；對照現行「生產任務預設需轉交」為反向預設，與 [[轉交單狀態]] 的滾動轉交拍板相關。
- 觀察 3：Odoo 用 4 個參數即支撐工作中心甘特與 OEE 四指標，對照 [[設備]] 卡（draft）的完整產能欄位設計與「現況僅每日可用時數粗欄位」落差——業界做法支持「先少參數負載可視化、後完整有限產能排程」的分階段路線。
- 候選相關卡：[[工單狀態]] / [[生產任務狀態]] / [[任務狀態]] / [[轉交單狀態]] / [[齊套邏輯]] / [[設備]] / [[工作包]] / [[印件生產流程]]
- 候選 OQ 候補：任務層存廢（降級為工單上的廠商分組視圖？）、排程可視化第一版範圍（少參數負載圖 vs 完整有限產能）、產線層必要性（業界僅工序＋工作中心兩層 vs 現行五層製程樹）——待與 Miles 討論後由 oq-manage 開卡
- 候選升級路徑：insight（與 2026-06-14 六權威研究系列同主題累積已 ≥ 3 張）／business-logic 修訂參考

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）
- [ ] 是否累積成 insight（與 2026-06-14 claude-research 六權威系列合併考慮）

## 精練去處（Mode B 完成後填）

<!-- Mode B step 6 寫入後在此列出 wiki link -->
