---
type: raw
status: raw
created-at: 2026-07-22
source: claude-research
captured-by: claude-on-task
module:
  - 工單
  - 生產任務
topic-tag:
  - 數量變更
  - 補生產
  - 超產容差
  - overs-unders
  - 工單異動
  - 狀態機
related-vault:
  - "[[工單狀態]]"
  - "[[生產任務狀態]]"
  - "[[訂單異動狀態]]"
  - "[[數量換算規則]]"
raw-source-link: https://community.sap.com/t5/enterprise-resource-planning-q-a/production-order-quantity-change/qaq-p/9905331
---

# MES / ERP 生產進行中變更工單數量 — 調研筆記

## 研究範圍與方法

Miles 指派研究（2026-07-22，批次 1 討論中）：現場慣例「做壞了直接多生產、直接上修生產任務數量」，想知道系統面怎麼設計（涉及狀態）、正常 MES 怎麼做。方法：WebSearch 為主（環境代理封鎖直接抓取），URL 均可反查。

## 原始素材（重點結論 + 來源）

### 1. 各系統是否允許已開工工單改數量
- Odoo：MO 數量可改（解鎖 Lock Quantities），元件需求連動重算；做不滿走 backorder 拆單（已完成量標 Done、剩餘量另成一張）。來源：https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/workflows/manufacturing_backorders.html
- ERPNext：Work Order 送出後數量凍結不可改；替代路徑＝事前超產容差（Overproduction Percentage）或 Stop／Cancel+Amend 另開新單。來源：https://docs.erpnext.com/docs/user/manual/en/manufacturing-settings 、https://discuss.frappe.io/t/qty-to-manufacture/108738
- SAP：CO02 技術上可改已釋放訂單數量（重排程、重算能力與預留），但社群 best practice＝釋放後加量另開新單；正式受控變更走 OCM（以 ECN 變更紀錄受控修改）。來源：https://community.sap.com/t5/enterprise-resource-planning-q-a/production-order-quantity-change/qaq-p/9905331 、https://help.sap.com/docs/SUPPORT_CONTENT/prodord/3138698506.html 、https://blogs.sap.com/2021/02/05/change-quantities-of-started-production-orders/
- Dynamics 365：Released/Started 可改量但須重估算＋重排程；BC 改量須 Refresh Production Order（刪行重建、手動修改被覆蓋）；RAF 數量不可大於已 Start 量。來源：https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-replan-refresh-production-orders 、https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/create-production-orders

### 2. 改數量對狀態的影響
- 四大系統改數量都不改主狀態：狀態由生命週期事件驅動、與數量欄位解耦；無「重新審核／re-release」慣例。配套＝強制重算＋變更紀錄。兩派：欄位變更＋重算（Odoo／SAP／BC）vs 異動單據（ERPNext Cancel+Amend 版本鏈、SAP OCM、PrintVis 版本遞增）——後者用於已對外承諾／已開工、重審計軌跡的場景。

### 3. 上修原單 vs 另開新單的取捨
- SAP 立場：釋放後加量另開新單。理由：setup 成本混批（lot size variance）、批次追溯粒度變粗、報表口徑失真（上修目標數會稀釋報廢率，管理層看不到做壞重做的成本）。
- 業界慣例：未開工／增量小／同批料→可上修原單；已部分報工／需追溯／成本口徑重要→另開新單。
- 來源：https://management-accounting.us/2023/06/17/order-variances/ 、https://www.datacor.com/resources/lot-tracking-traceability-guide

### 4. 工序層與工單層數量連動
- SAP：header 改量後各工序 operation quantity 依比例重算（含各工序計畫報廢率）；已最終確認的工序會被「重新提案剩餘量」＝重新打開要求補做——這正是上修原單最被詬病處（前段已收工，補做增量等於重新 setup，系統卻記成同工序剩餘量，排程與成本失真；印刷業版已下機尤其明顯）。
- 來源：https://community.sap.com/t5/enterprise-resource-planning-q-a/change-operation-quantity-in-production-order/qaq-p/643549

### 5. 印刷業慣例
- 貿易慣例 overs/unders：±10% 內超印短印視為合格交付、按實際數計價——第一道機制是「容差吸收、不改單」（放料時加放損耗，非事後上修）。來源：https://brooklineprintcenter.com/faq/printing-trade-customs-and-sales-contract/ 、https://www.tigerpress.com/blog/understanding-overs-and-unders-in-the-print-industry/
- PrintVis：數量變更以「同 Job 號版本遞增」承載；重印以 Product 模板重新起單。來源：https://learn.printvis.com/Legacy/Estimation/Case/ 、https://learn.printvis.com/Legacy/System/PrintVisProducts/
- Tharstern／EFI：公開文件無「生產中加量」具體流程描述，留白。

### 6. 三層機制建議（調研收斂）
1. 容差層：超產百分比內多做→不改單不動狀態，報工如實記實際產出與損耗（對應現場「做壞直接多做」）。
2. 未開工／早期：直接改欄位＋強制重算＋變更紀錄（誰／何時／原值→新值），不動狀態、不重審。
3. 已部分報工（首工序完成後）加量：異動單據＋另開生產任務（成本邊界、批次追溯、補做成本顯性化）。
「任何情況都直接改欄位重算」是四大系統中沒有任何一家採用的設計。

## 第一輪初步分析（Claude 寫）

- 觀察 1：Miles 的 D 情境（做壞多做）重新解讀後多數落在容差層——目標數不變、只是投入量增加，配合已拍板的「報工記實際產出＋上限改警示」即可，不涉狀態。與 PT-003（品檢缺口加開補做任務）、PT-009（客戶加量＝加印件）拍板正好對應第三層。
- 觀察 2：Miles 裁定「加生產／扣庫存的系統機制留待 MES 設計階段」，現況＝印務↔生管↔師傅口頭＋紙本改工單或重打新工單。本卡為設計階段參考正本。
- 候選相關卡：[[工單狀態]] / [[生產任務狀態]] / [[數量換算規則]] / [[QC不通過補生產]]
- 候選升級路徑：MES 設計階段轉入 business-logic（數量變更規則卡）＋ OQ（加生產系統機制）

## 待精練（Mode B 處理）

- [ ] MES 設計階段轉入商業邏輯卡
- [ ] 加生產系統機制 OQ（批次 1 收尾開卡）
