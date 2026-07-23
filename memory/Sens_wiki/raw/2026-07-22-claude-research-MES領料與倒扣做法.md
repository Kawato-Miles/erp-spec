---
type: raw
status: raw
created-at: 2026-07-22
source: claude-research
captured-by: claude-on-task
module:
  - 工單
  - 生產任務
  - cross-module
topic-tag:
  - 領料
  - 倒扣
  - backflush
  - 拉式生產
  - 庫存
  - 物料消耗
  - ISA-95
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[報工紀錄]]"
  - "[[BOM結構]]"
raw-source-link: https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/flushing-principles
---

# MES / ERP 領料（物料發放到生產）業界做法 — 調研筆記

## 研究範圍與方法

Miles 指派研究（2026-07-22，批次 1 討論中）：實務需要領料、傾向豐田拉式（工單依 BOM 生產時自動扣料）、MES 流程要先設計好開發後做。調研拉式 vs 推式、倒扣、主流系統選項、輕量過渡、模組切分。方法：WebSearch 為主（環境代理封鎖多數直接抓取，內容以官方文件搜尋摘要為據），URL 均可反查。

## 原始素材（重點結論 + 來源）

### 1. 拉式 vs 推式領料
- 推式（MRP）：生管／倉管依工單展開 BOM 備料發料，發料當下扣帳（SAP 移動類型 261）。拉式（看板/JIT）：現場消耗端發補料信號，扣帳貼近實際用掉的時點。兩者可並存（高頻穩定料走看板、低頻不規則走 MRP）。
- 來源：https://learning.sap.com/courses/describing-sap-for-automotive-supply-chain-and-manufacturing/sap-kanban 、https://blog.sap-press.com/how-does-kanban-fit-into-sap-s4hana 、https://www.mrpeasy.com/blog/push-system-vs-pull-system/ 、https://www.allaboutlean.com/push-pull/

### 2. 倒扣（backflush）
- 定義：不在領料當下逐筆登記，於報工／完工確認時依「BOM 用量 × 實際完成數」自動扣料入帳。
- SAP：backflush indicator 設在物料主檔／工作中心／工單元件；官方建議用於「不想為特定訂單備料」的場景。Odoo：預設即倒扣（完工依 BOM 自動消耗），BOM 行可勾 Manual Consumption 強制手動確認實耗。ERPNext：Skip Material Transfer to WIP Warehouse＋Backflush Raw Materials Based On（BOM 或實轉量）。
- 適用：用量與 BOM 一致、低價值、量測成本高於價值；不適用：用量變異大、高價值需批號追溯（倒扣完全依賴 BOM 正確性）。業界常混合制：標準料倒扣、高價料手動。
- 來源：https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/f340785101c548c9beeda9284efd18a0/0ae6c353b677b44ce10000000a174cb4.html 、https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/bill_configuration.html 、https://docs.frappe.io/erpnext/user/manual/en/manufacturing-settings

### 3. 主流系統領料模式盤點
- ERPNext：整單轉 WIP 倉／跳過倒扣／按工序卡（Job Card）領料三種顆粒。Odoo：倉庫設定 1/2/3 步製造（是否先產生揀料調撥單）。SAP：手動 261／WM 備料／倒扣／看板。D365：flushing principle 四值（Start／Finish／Available at location／Manual），層級為產品主檔預設→BOM 行覆寫。
- 共同模式：領料＝庫存交易掛工單（或工序），「事前揀料」與「事後倒扣」兩軸可選。
- 來源：https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/flushing-principles 、https://docs.erpnext.com/docs/user/manual/en/job-card 、https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/two_step_manufacturing.html

### 4. 接單式客製工廠的輕量過渡
- 「不做庫存帳、只記消耗／成本」是常見過渡：Odoo 產品可設不追蹤庫存（Consumable）；job order costing 支持「為特定工單採購、收貨即入工單成本」。何時開帳：出現跨單共用料／剩料再利用、需要齊套缺料預警、要用倒扣（前置＝BOM 用量可信＋週期盤點）、存貨金額影響財報。
- 演進路徑：只記工單成本 → 對共用高價料開帳倒扣 → 全面庫存＋齊套。
- 來源：https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/type.html 、https://www.mrpeasy.com/blog/job-order-costing/ 、https://www.jobscope.com/job-shop.html 、https://www.crowe.com/insights/netsuite-blog/why-cycle-counting-is-essential-for-inventory-management

### 5. 「領料建模成一道工序」業界不採用
- 四大系統一致：領料＝物料交易（掛工單／工序），工序＝產能與報工單位；物料與工序的關聯用「元件分派」表達（SAP component allocation、D365 BOM 行 flushing、ERPNext Transfer Material Against Job Card）。工序可「觸發」物料交易，但領料本身不是工序——做成工序無法承載倉別／批號／退料語義，上庫存帳時必須重建模。
- 來源：https://community.sap.com/t5/enterprise-resource-planning-q-a/routing-bom-component-allocation/qaq-p/8745999 、https://www.inventoryops.com/articles/kitting-versus-work-orders.html

### 6. 生產執行 vs 庫存模組切分（ISA-95）
- ISA-95 L3 把 Production Operations 與 Inventory Operations 分為兩個平行域，以交易物件交換。生產執行模組產「事件」（報工、消耗事件：料號／數量／掛生產任務／時間／人員）；庫存模組管「帳」（餘額、倒扣規則設定、退料、盤點）。介面＝報工完成事件→庫存模組執行倒扣。先讓消耗事件落地為純紀錄，日後開帳升級為正式扣帳，生產模組不改。
- 最小欄位：BOM 行（用量、單位、損耗率、消耗觸發時點、是否追庫存）；消耗紀錄（生產任務、料號、理論量、實際量可覆寫、來源＝倒扣／手動）。
- 來源：https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard 、https://reference.opcfoundation.org/ISA-95/v100/docs/4.2 、https://mesa.org/topics-resources/b2mml/

## 第一輪初步分析（Claude 寫）

- 觀察 1：Miles 傾向的「依 BOM 生產時自動扣料」＝倒扣，業界官方支援且適用條件與現況吻合；「領料型生產任務」與業界建模相悖，已於批次 1 討論拍板移除（工單載明材料但材料非生產任務）。
- 觀察 2：扣庫存設計 Miles 裁定留待 MES 設計階段；本卡為屆時的參考正本。倒扣是否計不良品耗料（印壞的紙也耗料）待開 OQ。
- 候選相關卡：[[工單]] / [[生產任務]] / [[報工紀錄]] / [[BOM結構]] / [[物料消耗記錄]]
- 候選升級路徑：MES 設計階段轉入 business-logic（庫存與領料規則卡）

## 待精練（Mode B 處理）

- [ ] MES 設計階段轉入商業邏輯卡
- [ ] 倒扣耗料口徑 OQ（批次 1 收尾開卡）
