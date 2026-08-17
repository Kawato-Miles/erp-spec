# Proposal: correct-production-stage-seg4a

## Why

### Background

生產階段校正工程（以 wiki 為基準校正 openspec 與 prototype）第四段之 A：副流程生產側。wiki 已於 2026-08-12 完成段 4A 落卡三批次（25 卡），本 change 將下游兩層對齊。商業正本：

- 取消連鎖五層與手動推進：[訂單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md)、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)、[印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)
- 售後與補做統一（廢補印印件型別）：[售後服務規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則.md)、[售後服務](../../../memory/Sens_wiki/wiki/erp/05-entities/售後服務.md)、[QC不通過補生產](../../../memory/Sens_wiki/wiki/erp/07-scenarios/QC不通過補生產.md)、[工單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/工單狀態.md)
- 出貨建單額度單軌：[出貨單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md)、[出貨與送達](../../../memory/Sens_wiki/wiki/erp/07-scenarios/出貨與送達.md)
- 派單作廢與帳務口徑：[派單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/派單狀態.md)、[供應商報價規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/供應商報價規則.md)
- 工單異動與打樣：[工單異動與生產任務調整](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單異動與生產任務調整.md)、[打樣流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/打樣流程.md)、[打樣決策與重新打樣](../../../memory/Sens_wiki/wiki/erp/07-scenarios/打樣決策與重新打樣.md)

設計正本 `production-stage-seg4a-design.md`（v3，三輪 plan-audit 收斂）、拍板紀錄 `production-stage-seg4-grill.md`（30 條）。相關 OQ：PT-027／ORD-043／PI-007 open（不阻擋本 change）；PT-034、PT-044 已具名翻案（封存卡取代註記已落）。

### Problem Statement

差異矩陣段 4 重驗後，生產側副流程在 openspec 與 prototype 兩層有系統性落差：取消連鎖只改訂單狀態無下層連鎖且漏出貨單層；售後補印舊設計（建新印件）與統一補做機制衝突；出貨建單被訂單終態封死使補做品無合法出貨路徑；派單無作廢收尾；工單異動缺生管確認與分流守衛；打樣 NG 路徑觸發者兩檔對立。

## What Changes

- **BREAKING**：售後補印廢除「補印印件」型別——不再建新印件與新工單，改為售後服務單決議觸發原工單補做（after-sales-ticket 對應 Requirement 全面改寫）
- **BREAKING**：出貨單建單前提自「訂單終態後不得建立」改為額度單軌（唯一前提＝可出貨額度檢核；段 3 條文明示翻案）
- 訂單取消連鎖五層（印件棄用／非終態工單／生產任務依實際投入事實分流／派單提示／未離廠出貨單自動作廢）
- 訂單手動推進（逐格＋確認對話）
- 派單作廢（存在性、實付額結清、應付對帳口徑、上游狀態目視化）
- 工單異動：生管確認四步、入庫成品處置說明、會影響成品的最後一筆阻擋、作廢／報廢分流 action、異動紀錄五欄、補生產承接守衛（雙終態＋售後例外）
- 打樣：NG 觸發者統一（系統自動）、回退弧例外句、完成判定排除已棄用、序列不設管制（PT-025 同步）、上傳守衛不設（#39 移除）
- 收編：bubble-up 用詞清整（order-management L145、order-adjustment L118）、mock 修正（打樣與大貨分屬不同印件）
- prototype（erp repo）同步實作以上全部

## Capabilities

### New Capabilities

（無——全部為既有 capability 的行為修正）

### Modified Capabilities

- `order-management`：取消連鎖五層與分流判準、手動推進、打樣決策點對齊 prepress 正本、印製維度回退弧例外、訂單完成判定（未棄用限定＋終態後不再評估）、bubble-up 用詞
- `after-sales-ticket`：售後單零前提（受理與決議兩段、把關下沉決議選項）、統一補做機制（廢補印印件、相關印件選填欄）、金額動作依雙終態開關
- `shipment`：建單前提額度單軌、已棄用印件排除、修改明細增量檢核、訂單取消自動作廢未離廠單
- `dispatch-order`：派單作廢（存在性、原因必填、實付額調整、執行面／帳務面口徑、上游狀態顯示欄）
- `work-order`：異動流程生管確認四步、處置說明、最後一筆阻擋、分流 action 與第三分流、異動紀錄五欄、正本指向、補生產承接守衛與售後例外、序列口徑、工單草稿建立的終態出路改指售後決議補做、印件總覽的印件類型三值改二值
- `qc`：補做觸發來源擴充（售後服務單決議）
- `business-scenarios`：取消分流、打樣 NG 路徑、審稿初值錯值等同步修正
- `order-adjustment`：bubble-up 用詞一處、異動類型 enum 的售後補做用詞與預填規則對齊決議值域正名
- `sales-platform`：業務平台印件總覽的印件類型 filter 三選項改二值、補做追蹤入口改指售後服務單

## Impact

- openspec main specs：上列 8 個 capability 的 delta specs
- prototype：erp repo `apps/erp/src/app/(prototype)/` 分支 `prototype/production-stage`（cancelOrder 連鎖、印件棄用 action、手動推進、派單作廢與上游狀態欄、售後單重構、補做發起擴充、出貨建單前提、mock 修正）
- 不動：prepress-review spec 整檔（歸段 4B 審稿重寫）、金額側（A 類另案）、A1 設備停機（另案）
