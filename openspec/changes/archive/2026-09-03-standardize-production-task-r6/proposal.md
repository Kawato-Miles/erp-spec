## Why

### Background

生產任務是標準化結構：欄位、報工、狀態與轉交規則一致，唯一的型別差異是建立任務時依所引用 BOM 類型從主檔挑的計價選項，成本算式跟著這個選擇走。Miles 於 2026-09-02 至 09-03 的第六輪（含追加）把這個結構推到底，並收掉三類沒有事實來源的機制——工時、自動推算的數量、自動排程。商業正本已落卡：

- [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)（預計開工日改預計完成日、預計生產與放損改印務手填、四個計價選項欄改為建立任務時從主檔挑、計畫設備所有任務必填、刪實際設備欄、每份工單需生產數量只供齊套換算）
- [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)（刪實際工時欄與系統自動算的放損欄、運轉設備改帶入任務計畫設備）
- [設備](../../../memory/Sens_wiki/wiki/erp/05-entities/設備.md)（刪時費率、每印費率、折舊、固定班內工時、準備時間、換料校機時間；實際設備費只取階梯價）
- [工作包](../../../memory/Sens_wiki/wiki/erp/05-entities/工作包.md)（刪開機費欄、分攤基礎欄與共用資源用量欄）
- [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)（五值、四類廠商同一條路徑、派單不映射、手動完成不限廠商類別）
- [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)（數量由印務手填，主檔參數只作計價與參考）
- [工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)（前置由印務逐筆手設、到料量只從轉交單已點收量來、不需轉交的前置不檢查也不擋派工）
- [配方展開規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/配方展開規則.md)（展開只帶任務清單與 BOM 引用）
- [齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)（打樣工單與已取消工單不進齊套、每筆計入任務各自取產出）
- [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)（刪時間稼動率、折損率改算式、漏單率基準改預計完成日、不排除任何廠商類別）
- [計價快照](../../../memory/Sens_wiki/wiki/erp/05-entities/計價快照.md)（實際成本與預估同四分項同算式、只換數量來源）
- [工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)（預計完工日取旗下任務預計完成日最大值後預填、印務可改）
- [轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[派單](../../../memory/Sens_wiki/wiki/erp/05-entities/派單.md)、[派單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/派單狀態.md)、[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)

落卡紀錄見 [wiki/log.md](../../../memory/Sens_wiki/wiki/log.md) 2026-09-03「生產任務標準化第六輪」條目。本 change 是 [2026-09-02-unify-work-report-wording](../archive/2026-09-02-unify-work-report-wording/proposal.md) 的延續。

### Problem Statement

主 spec 仍照舊口徑寫著七類已被推翻的內容：

| 項目 | spec 現況 |
|---|---|
| 工時 | 報工收實際工時、工作包一次上機多筆任務分填加總、成本分項有工時、指標有時間稼動率 |
| 設備成本 | 開機費在工作包層歸集、依分攤基礎攤回各任務、實際成本含折舊 |
| 任務狀態 | 外發在途段兩個狀態值（已送集運商、運送中）由派單狀態自動映射 |
| 派工範圍 | 待派清單收自有工廠與加工廠兩類 |
| 到料 | 不需轉交的前置取累計良品數當到料量 |
| 前置 | 展開時材料型自動成為同段工序型前置、製程規劃預設帶線性鏈 |
| 數量與日期 | 建立當下沿相依鏈倒推預填兩欄、材料型取用量倍率與開機損、任務日期欄為預計開工日 |

## What Changes

### Modified Capabilities

- `production-execution`：待派清單只收自有工廠任務；報工刪實際工時與系統推導的放損欄、運轉設備改帶入任務計畫設備、外發與加工廠不受工作包前提限制、統計不排除任何廠商類別；派工前置到料量只認轉交單已點收量；生產任務狀態收為五值、派單不映射、手動完成不限廠商類別；拉料備料的前置改印務手設。
- `work-order`：製程規劃的排程欄改預計完成日、計畫設備所有任務必填、前置不預設帶鏈；目標數量兩欄改印務手填；工單排程日期改以預計完工日承載；成本四分項改材料、工序、裝訂、設備，實際與預估同算式；異動移除任務的非終態列舉收為兩值。
- `dispatch-order`：派單狀態不再映射生產任務；運費與關稅的攤回不進生產任務的實際成本四分項。
- `recipe-expansion`：展開只帶任務清單與 BOM 引用，數量、日期與前置一律留空。
- `production-overview`：六指標收為五指標，時間稼動率移除，折損率改算式，漏單率基準改預計完成日。
- `equipment`：設備主檔的自身成本參數只留固定開機損。
- `order-management`：印件詳情的實際成本四分項與生產任務欄位列改口徑；跨實體狀態向上傳遞鏈刪派單映射。

**BREAKING**：報工不再收實際工時；工作包不再歸集與攤回開機費；生產任務狀態自七值收為五值（已送集運商、運送中移除）；加工廠任務不再進待派清單；不需轉交的前置不再產生到料量；系統不再預填任何數量與日期。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：Requirement「待派任務接收」、「合批打包工作包」、「工作包維護」、「拉料備料」、「報工」、「需轉交標記的適用與變更把關」、「派工前置檢查」、「生產任務狀態轉換」；REMOVED「開機費歸集與分攤」。
- `work-order`：Requirement「製程規劃」、「預估成本凍結」、「生產任務結構與帶入規則」、「生產任務完成度計入設定」、「生產任務目標數量預設與放損率」、「數量計算邊界防呆」、「異動下修與製程調整的數量重算」、「生產任務相依性」、「工單成本對照」、「補生產承接」、「異動移除生產任務的分流與守衛」；ADDED「工單排程日期」；REMOVED「交期倒推建議日期」、「存量生產任務的數量拆欄遷移」。
- `dispatch-order`：Requirement「報價與核價」、「運費與關稅攤回」、「海外直發本輪不處理」；REMOVED「外發在途段自動映射回生產任務」。
- `recipe-expansion`：Requirement「配方段展開為生產任務」；ADDED「展開不帶數量、日期與前置」；REMOVED「展開時的數量與放損來源」。
- `production-overview`：Requirement「六指標」（改名為「五指標」，見 delta）。
- `equipment`：Requirement「設備主檔管理」。
- `order-management`：Requirement「印件詳情頁工單與生產任務區塊」、「跨實體狀態向上傳遞鏈」。

## Impact

- 受影響 spec：`openspec/specs/production-execution/spec.md`、`work-order/spec.md`、`dispatch-order/spec.md`、`recipe-expansion/spec.md`、`production-overview/spec.md`、`equipment/spec.md`、`order-management/spec.md`。
- 未受影響但已查核：`qc`（待驗清單取轉交單已點收量，外發來源沿用同一路徑，不受本輪影響）、`business-scenarios`（異動移除任務的三條分流判準未變；「運送中」的命中皆為出貨單狀態）、`process-master`／`binding-master`／`component-recipe`（用量倍率為主檔與配方的參數，本輪只取消它驅動預填，主檔定義不動）。
- 後端 `sens-print-core`：報工移除實際工時與放損欄；工作包移除開機費與分攤基礎；生產任務狀態值域自七值收為五值並移除派單映射；待派清單過濾改單一廠商類別；到料量取數收為單一來源；移除全部數量與日期的預填運算；任務日期欄改名與語意變更。
- 前端：報工表單移除兩欄；製程規劃的數量、日期與前置改空白待填；工單頁排程日期改預計完工日；成本對照與指標頁改欄位。
- Prototype：報工表單、製程規劃、工單排程與指標頁同步（另案處理）。
- Linear：派工現場執行、工單製程規劃、外包協作三個 Feature 票及其 Task 票同步。
