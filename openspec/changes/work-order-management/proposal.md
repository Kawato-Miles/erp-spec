# 工單管理（work-order-management）

> 生產階段 MES 規劃四個 change 序列（工單管理 → 派工追蹤 → 品檢出貨 → 派單）的第一個。設計經序列協作 Phase 1-4 收斂（2026-07-27），Phase 4 匯報全文見 change 目錄外部橋接紀錄，設計依據見 [design.md](design.md)。

## Why

### Background

生產階段（工單建立到出貨）現場仍靠紙本工單與口頭協調；上一版 Prototype 只驗證了工單單據的建立，排程、成本、設備運作對管理層是黑箱；外包（中國線與台灣外包）與場內流程斷開，回場銜接靠人工核對。2026-07-27 grilling 拍板確立生產階段 MES 方向：工單不拆廠、TPS 為機制層準則、四個 change 依序推進。

商業邏輯正本（本 change 引用的 wiki 卡）：

- 商業流程：[印件生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/印件生產流程.md)、[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/齊套邏輯.md)、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/數量換算規則.md)、[打樣流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/打樣流程.md)、[豐田式生產管理對映](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/豐田式生產管理對映.md)
- 實體欄位正本：[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[計價快照](../../../memory/Sens_wiki/wiki/erp/05-entities/計價快照.md)、[材料主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/材料主檔.md)
- 狀態列舉正本：[工單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/工單狀態.md)、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)、[印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)
- 角色：[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)
- 架構正本：[2026-06-13 生產模組架構設計](../../../memory/Sens_wiki/wiki/erp/12-insights/2026-06-13-生產模組架構設計.md)

### Problem Statement

工單目前只驗證過「建得出來」，但建立時該把哪些帳一次凍好沒有定案：

1. 成本靠印務人工估算，機台開了才知道賺不賺；預計成本無凍結基準，日後實際成本差異無從比對。
2. 數量的帳（做了幾個、驗過幾個、出了幾個）分散在人腦與紙本；加放由印務自由裁量、無任何留痕與管理視角。
3. 依工廠性質（台灣／中國）拆單，跨廠情境靠跨工單依賴硬接，完工帳散在多張單上收不攏。
4. 補生產靠口頭協調＋紙本改單，重工成本與可回收成本混在一起算不開。

若不在工單建立階段把底層資料結構定對，日後做管理指標時必須重構底層——這是本 change 的核心風險對價。

## What Changes

- **拆單維度置換（BREAKING）**：廢除依廠拆單（工單「區域」欄棄用、openspec「工單區域設定」整段移除），改為一印件一製作週期一張工單，涵蓋完整製程；內外之分下沉到生產任務層「生產單位類別」四值，同單內四類並存為常態。新增「製作輪次」使製作週期在資料上可計數。
- **工單建立來源結構化**：建立來源六值（審稿確認可製作／印務主管加開／打樣 NG-製程問題重打／外包大貨 NG 退原廠／售後補印／加印）＋「來源工單」「來源派單」追溯連結；五建一不建的分流規則落地（品檢缺口補做不建新工單、走工單異動）。
- **計價快照凍結機制**：逐筆生產任務建立當下凍結；四分項各帶金額依據（主檔價／已確認報價／暫估）；外包未報價照凍標暫估、不擋交付；新增應有分項集合（凍結）、未報價分項數、補凍紀錄、快照版本序號。
- **工單層數量帳**：「換算所需數量」與「目標數量」並存保存；加放比例為衍生並三數並列呈現；送審新增目標數量下限守衛。
- **完工判定改判（BREAKING）**：廢除「累計 QC 入庫 ≥ 目標數量」與齊套混合公式，改為判定集合（旗下生產任務扣除已作廢與不計入者全部完成即完工）；品質帳歸印件層、工單頁不顯示品檢進度；生產任務「計入完成度」由布林升 LOV 三值，使「報廢不補做」的個案豁免可收斂、可統計。
- **製程審核強化**：送審五守衛；審核中標記（含逾時轉狀態）補上「主管尚未開始審核」判定條件；退回原因與異動原因改結構化分類（各六值 LOV＋補述）。
- **工單需完成日**：新增欄位（預設自訂單交貨日帶入、可覆寫、覆寫留痕），解「雛形有預計交期、規格無正本定義」懸空。
- **對下游觸發契約（新 Requirement）**：E1-E7 七條（派單自動產生／派單發送／工作包合批候選／異動同步派單／品質缺口待辦／工單層唯讀投影／預計成本基準供給），本 change 定契約、後三個 change 實作。
- **QC 類 Requirement 除役**：「QC 單建立」「QC 執行與結果記錄」兩段移除（品檢型任務已於 QC-002 拍板廢止）；「派工排程」「派工板雙模式」兩段移除（與 production-task spec 重複的雙正本）。
- **稽核與管理訊號**：ActivityLog 15 個關鍵動作；管理指標 17 條線（含加放比例、重工批次三子項、預計成本確定率）與三個系統化落地訊號，指標定義見 design.md。

## Capabilities

### New Capabilities

（無——「對下游模組的觸發契約」為 work-order spec 內新增 Requirement，不另立 spec）

### Modified Capabilities

- **work-order**：本 change 唯一修改的 capability。拆單維度置換、建立來源結構化、計價快照凍結、數量帳、完工判定改判、審核流程強化、觸發契約、QC 與派工類 Requirement 除役——約 25 條 MODIFIED、5 條 REMOVED、1 條 ADDED（明細見 specs/work-order/spec.md）。
- production-task 與 work-package：**僅確認掛點、不修改**（計畫設備由印務於工單建立時決定與 production-task spec 不衝突；生產任務層留有工作包關聯鍵）。

## Impact

- **wiki 卡連帶（設計確認後依 wiki-amend 執行，21 條清單見 design.md § 落地順序）**：工單／印件／生產任務／任務／計價快照／材料主檔／物料消耗記錄／數量換算規則／齊套邏輯／印件生產流程／打樣流程／成本差異／兩張情境卡／兩張角色卡等。
- **下游三個 change 依賴本 change 的八條跨 change 前提**（不拆廠、狀態機觸發點、任務交付定義、生產單位四值、快照四分項與參數組、數量帳分工、異動承接機制、建立來源清單）。
- **Prototype**：erp repo 單一分支，本 change 對應四頁（工單列表／工單詳情／製程規劃頁／成本摘要頁），靜態假資料。
- **未拍板依賴（阻斷級餘兩題，已開 OQ 卡待 Miles 裁決）**：[PT-029 計價快照四分項工序費缺席](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-029-計價快照四分項與計價引擎工序費缺席.md)、[PT-030 數量換算下行取整方向](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-030-數量換算下行取整方向表述缺口.md)。PT-028（工單已交付觸發）已於 2026-07-27 拍板採全部任務交付並回填 delta spec。設計對未拍板題已做承接或暫置，裁決後回補，不阻斷 artifact 產出（問寫分離）。其餘 OQ 見 design.md § Open Questions。
