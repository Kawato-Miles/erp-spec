## Why

### Background

wiki 於 2026-07 至 2026-08 完成生產階段重構與拍板擴散，段 3（品檢 → 齊套與完工判定 → 出貨 → 送達 → 訂單完成，＋五項附屬）的商業層設計已於 2026-08-11 完成三輪 plan-audit 稽核（未通過 0）、Miles 拍板、wiki 落卡（21 卡＋新情境卡，commit `ada40e0`）。商業正本：

- 品檢通過入庫的正常路徑（新情境卡）：[品檢通過入庫](../../../memory/Sens_wiki/wiki/erp/07-scenarios/品檢通過入庫.md)、[QC不通過補生產](../../../memory/Sens_wiki/wiki/erp/07-scenarios/QC不通過補生產.md)
- 品檢紀錄與誤記更正、缺口處置：[品檢紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/品檢紀錄.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)
- 數量帳、額度與短出收尾：[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)、[印件生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/印件生產流程.md)
- 出貨與送達：[出貨與送達](../../../memory/Sens_wiki/wiki/erp/07-scenarios/出貨與送達.md)、[出貨單](../../../memory/Sens_wiki/wiki/erp/05-entities/出貨單.md)、[出貨單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md)
- 收尾與完成連動：[印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)、[訂單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md)
- 外發回台與成本攤回：[派單](../../../memory/Sens_wiki/wiki/erp/05-entities/派單.md)、[派單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/派單狀態.md)、[貨運單](../../../memory/Sens_wiki/wiki/erp/05-entities/貨運單.md)、[生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)
- 轉交路徑來源放寬：[轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、[場內轉交與更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與更正.md)
- 角色分工：[品檢人員](../../../memory/Sens_wiki/wiki/erp/03-roles/品檢人員.md)、[揀貨人員](../../../memory/Sens_wiki/wiki/erp/03-roles/揀貨人員.md)、[廠務](../../../memory/Sens_wiki/wiki/erp/03-roles/廠務.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md)

設計正本：`production-stage-seg3-design.md`（§ 七 G1–G23 openspec 修正方向、§ 7-2 P1–P8 prototype 修正方向、§ 八 20 條情境處置）；拍板紀錄：`production-stage-seg3-grill.md`（§ 一至 § 一之四）；後端 as-is：`production-stage-dispatch-waybill-asis.md`。

**前置條件**：設計已過 plan-audit 三輪（`production-stage-seg3-audit-r1/r2/r3.md`）、Miles 已拍板（D1–D3、R1–R8、G1–G4、N1）、wiki 已落卡（commit `ada40e0`）。openspec 現況已於 2026-08-11 以段 2 archive 後的 main specs 重驗（結果 append 於 `production-stage-alignment-diff-matrix.md` 檔末「段 3 openspec 側重驗」），本 change 依該次重驗的裁決調整範圍：G4 移除（段 2 已收斂）、G8 與 G10 縮小、G15 落點改 `prepress-review`、G20 一併收斂 `dispatch-order` 同檔互斥、段 2 合併引入的相斥四點併入對應 G 項。

### Problem Statement

貨做出來之後的這一整段在 openspec 是斷的、且與 wiki 正本相反：品檢紀錄無更正規則、品質帳口徑落在生產層、出貨行為規格散在 `order-management` 與 `shipment` 兩份且互不一致、送達累計取數層級與收尾判定與 wiki 相斥、「短出下修」與 wiki 的「不下修」直接相反、訂單自動完成的連動鏈完全沒有、派單發稿觸發者在同一份規格內自相矛盾、認列工單仍掛在派單的點收介面（段 1 暫置）。規格不改，prototype 的品檢、出貨、送達與訂單完成即無所依據。

### 相關未解 OQ（建立前查核，2026-08-11）

- [PT-004 QCRecord 資料遷移](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-004-QCRecord%20資料遷移.md)：Prototype 階段不做資料遷移（卡內明文），不擋本 change
- [PI-007 印件是否需獨立交貨日期欄位](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PI-007-印件是否需獨立交貨日期欄位.md)：本段不觸及交期承諾，不擋本 change
- [PT-026 外部廠商協作門戶身分與可視邊界](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-026-外部廠商協作門戶身分與可視邊界.md)：供應商建貨運單的介面繫此 OQ，本 change 只落建單行為、介面留待驗
- [SHP-017 累計送達數的計算層級](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/)：已拍板甲案（單頭層）並隨 wiki 落卡封存

## What Changes

- 品檢紀錄補**誤記更正規則**（新增一筆負數沖銷紀錄、原紀錄不改不刪、累計以代數和計）；主詞正名「入庫數」→「完工良品數」；缺口口徑改印件層（購買數量 − 完工良品數），生產層報工不良口徑分層並存、明寫不混算；處置改一次一筆可分次、處置數量由印務填
- **品檢完成品不移動**（D1）：刪除「通過量浮上待搬視圖、品檢站 → 暫存區留段 3 設計」的整段預設，改為品檢完成品留在品檢區（＝出貨區）就地揀貨；例外移置不成單、不進系統
- 轉交單建立路徑的**來源放寬**（G1）：由「產線上的生產任務」放寬為「生產任務」（含回台點收後的外發生產任務，貨自暫存區送品檢站）；暫存區三類排除不變
- **BREAKING** 出貨行為規格單一落點：`order-management` 的出貨四段（出貨單管理、多印件分次出貨追蹤、出貨單狀態機、出貨單掛訂單層）移除，行為全歸 `shipment`；`order-management` 只保留訂單層完成判定
- 出貨規格補齊：額度檢核的時點與否決方式（按下建立那一刻檢核、整張擋下不做部分成立、改明細數量時重跑）、額度不足兩條出路引導、訂單終態後不提供建單動作、裝箱回報補「每箱幾個」且回報完成才推進待出貨、移除異常回報按鈕與自動通知、移除跨訂單合併寄出、物流段改人工推進、可出貨額度含回補項、通過側守恆鏈
- **BREAKING** 送達與收尾判定改口徑：累計送達數＝狀態為已送達的出貨單其明細數量加總（單頭層，SHP-017 甲案）；印件收尾＝排除異常與已作廢的出貨單後其餘全部已送達且**累計送達數 ≥ 購買數量**（等號改 ≥）；判準主詞「印件數量」改「購買數量」
- 訂單完成連動補齊：出貨中 → 訂單完成（全部未棄用印件的印製維度已達已送達；打樣印件另須打樣結果＝OK，守衛引 `prepress-review`）；已棄用印件退出完成度計算
- **BREAKING** `work-order` 短出規格改寫：刪「短出下修」，改印務在印件層手動結案、購買數量與累計已出貨數量都不下修、由上而下批次連動；補做預帶改依齊套帳推算並補「補做來源」欄防重複發起
- 打樣週期歸零補 Requirement：六欄逐一點名、週期界線＝最新打樣工單建立時點、生產數量（投入）不歸零
- **BREAKING** 派單發稿觸發者收斂（D2 甲）：`dispatch-order` 同檔互斥的兩處（交付即發送 vs 指派供應商即切已發稿）收斂為單一觸發——交付產線時系統要求已指派供應商，一次完成發送並切「已發稿」；明記這是既有自動轉換的搬移、屬行為變更
- 回廠點收的認列載體遷回 [貨運單](../../../memory/Sens_wiki/wiki/erp/05-entities/貨運單.md)（併櫃視角）；補建單兩條路徑（供應商發貨時建單、管理端一次輸入多組運單號即建多張單）、運費建單時按重量比例拆、關稅讀取時即時算不落庫、認列後不鎖可重送；外包實際成本補列固定運費
- `business-scenarios` 全流程表補印製維度跳態（製程已確認、工單已交付），送達收尾口徑對齊

## Capabilities

### New Capabilities

（無——全部為既有 spec 的行為修正）

### Modified Capabilities

- `qc`：品檢紀錄更正規則、完工良品數正名、缺口口徑印件層、處置可分次、品檢完成品不移動（G1、G3、S1–S3）
- `shipment`：額度檢核時點與否決方式、建單前提、裝箱回報、送達判定與收尾口徑、守恆鏈、額度回補、跨訂單移除、物流段人工推進，並承接自 `order-management` 移入的出貨行為（G9、G11–G13、G16–G19）
- `order-management`：移除出貨四段、補訂單完成判定 Requirement（G6、G7、G9、G10、G22）
- `work-order`：短出結案改寫、補做預帶與補做來源欄（G2、G14）
- `business-scenarios`：全流程表印製維度跳態、品檢與出貨情境的收尾口徑（G8、G13 擴散）
- `production-execution`：場內轉交適用路徑的來源放寬（G23／S4）
- `dispatch-order`：發稿觸發者收斂、認列遷回貨運單與運費關稅攤回（G20、G21）
- `prepress-review`：打樣週期歸零六欄與週期界線（G15）

## Impact

- openspec：上列八份 main spec 的 delta specs
- prototype（erp repo `prototype/production-stage` 分支）：品檢頁與缺口處置、補做發起、印件詳情頁、出貨模組（兩套收斂為一套）、資料源收斂、送達與完成連動、新建貨運單頁面（P1–P8）
- 不影響：報工與場內轉交本體（段 2 已完成）、打樣決策與重打的完整動線（段 4）、訂單異動單本身（段 4）、售後補印與取消連鎖（段 4）、成品庫存（Phase 2/3）
