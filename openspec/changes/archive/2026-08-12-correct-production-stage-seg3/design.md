## Context

段 3 的商業層決策已全數定案於 `production-stage-seg3-design.md`（三輪 plan-audit 全過、拍板紀錄 `production-stage-seg3-grill.md` § 一至 § 一之四），wiki 已落卡（commit `ada40e0`，21 卡＋新情境卡 [品檢通過入庫](../../../memory/Sens_wiki/wiki/erp/07-scenarios/品檢通過入庫.md)）。本文件只處理 PRD 層與 prototype 實作的技術取捨，不重述商業決策。

openspec 現況已於 2026-08-11 以段 2 archive 後的 main specs 重驗（結果 append 於 `production-stage-alignment-diff-matrix.md` 檔末）。範圍依該次重驗調整：G4 移除、G8 與 G10 縮小、G15 落點改 `prepress-review`、G20 一併收斂 `dispatch-order` 同檔互斥、段 2 引入的相斥四點（S1–S4）併入對應 G 項。

實作約束（沿段 1、段 2，handover § 二與 § 七）：只動 erp repo（`/Users/b-f-03-029/erp`）`prototype/production-stage` 分支、不開 PR；實作經 repo 內 `prototype-from-prompt` skill（既有配方與真元件、禁自創 UI、禁手寫 hex 與 px、巢狀表用 `SubTableWrapper`）；只動 `apps/erp/src/app/(prototype)/`；**dev server 用 `.claude/launch.json` 的 `erp-verify`（port 3020）**，3000 可能被其他對話佔用；**erp repo 工作區另有平行對話在 `print-items/*` 與 `qc-shipping/_lib/store.js` 的未提交變更，commit 前逐檔確認、勿誤 stage**。

## Goals / Non-Goals

### Goals

- 八份 main spec 的品檢、出貨、送達、訂單完成與外發回廠規格對齊 wiki 拍板現況（G1–G3、G6–G23）
- 出貨行為規格收斂為單一落點（`shipment`），`order-management` 只留訂單層完成判定
- 跨模組完成連動鏈在規格上接通：品檢通過 → 完工良品數與額度 → 出貨與送達 → 印件已送達 → 訂單完成
- prototype 的品檢、缺口處置、補做發起、印件詳情頁、出貨模組、送達與完成連動依新口徑校正並貫通資料流（P1–P7）
- 新建貨運單頁面（併櫃視角、桌機），認列工單自派單點收介面遷回（P8）

### Non-Goals

- 打樣決策與重打的完整操作動線（段 4）；本段只做「打樣結果填 NG-製程問題」的最小資料層觸發入口與帳務面（週期歸零、訂單完成的打樣結果＝OK 條件）
- 訂單異動單本身（退款、補收的審核與認列）（段 4）；本段只掛接路徑
- 售後補印、訂單取消連鎖、工單異動（段 4）
- 印件轉「已棄用」時在途出貨單的處置（段 4 備忘：觸發者在棄用那一側）
- 成品庫存的分批入庫、儲位與庫存扣帳（Phase 2/3）；本段「入庫」為帳語意
- 海外直發三終態的印件收尾與出貨帳（本輪範圍外）
- 台灣外包建貨運單（台灣外包直接對生產任務點收）
- 逾期未驗、逾期未出貨的警示；額度預警與分批建議提示（未被要求的警示不加）

## Decisions

### D1 出貨行為規格的落點與 REMOVED 的邊界

`order-management` 移除四條 Requirement（出貨單管理、多印件分次出貨追蹤、出貨單狀態機、出貨單掛訂單層），全部行為歸 `shipment`；`order-management` 只新增一條 § 訂單完成判定。判斷準則：規格回答的是「這張出貨單怎麼走」→ 歸 `shipment`；回答「這張訂單什麼時候算完成」→ 留 `order-management`。

替代方案（保留 `order-management` 的出貨段、只修內容）被否決：兩份規格都寫出貨即有兩個真相，段 3 之後每次改出貨行為都要改兩處，而重驗已證實兩處早已漂移（狀態路徑、額度口徑、物流介接三項互斥）。

### D2 訂單完成以新 Requirement 承載，不改寫 § 訂單狀態機

訂單完成判定另立 § 訂單完成判定，不把「出貨中 → 訂單完成」寫進既有 § 訂單狀態機。理由：該 Requirement 已承載線下／線上／諮詢三條路徑與二十餘個 Scenario，MODIFIED 需整段複寫、風險高於收益；完成判定的條件涉及跨模組守衛（打樣結果、棄用排除），獨立成條也更好引用。

### D3 打樣週期歸零以新 Requirement 承載，判定段另有一條 MODIFIED

G15 落點為 `prepress-review`，以 ADDED § 打樣週期數量歸零 承載六欄與週期界線；既有那句「數量帳按打樣週期歸零，公式正本見 wiki 齊套邏輯卡」不錯、只是不足，新 Requirement 補足並回指該段，兩者無相斥。

同一份 delta 另含一條 MODIFIED § 打樣結果業務判定（八十餘行、含四個分支敘述與五個 Scenario）：該段有三處與 wiki 正本相斥或不足，非改寫不可——觸發位置由打樣工單詳情頁改印件詳情頁（判定對象是印件、不是某一張工單）、觸發條件由「工單已完成」改「印製維度＝已送達且打樣結果＝待確認」（工單做完不等於客戶收到樣品）、補明重打後印製維度由系統推進「製程已確認」（只回「等待中」的話第二輪推不動）。理由與 Rationale 寫在該 Requirement 的變更理由段。

### D4 守恆鏈與額度公式的落點收斂為一處

G16（通過側守恆鏈）與 G17（額度含回補項）原方向為「出貨規格與訂單管理規格兩處補」，本 change 收斂到 `shipment` § 數量帳守恆鏈 一條 ADDED Requirement。理由：單一正本鐵則——公式正本在 wiki [齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)，spec 只需要一處承載「系統 SHALL 維持這條鏈」的行為；`order-management` § 印件進度兩本帳呈現 已引 wiki 公式，重複寫一次只會多一處要同步。

### D5 delta spec 的引用紀律

delta specs 不複寫 wiki 欄位表與狀態列舉：出貨七態引 [出貨單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md)、印製維度引 [印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)、數量欄位引 [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、品檢欄位引 [品檢紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/品檢紀錄.md)、貨運單欄位引 [貨運單](../../../memory/Sens_wiki/wiki/erp/05-entities/貨運單.md)；spec 只承載轉換條件（guard）、觸發事件與 Scenario。

### D6 prototype 的品質帳與出貨資料源

品檢紀錄與品質帳收斂為單一資料源（現況兩模組各持一份、互不同步）；出貨兩套實作收斂為一套（保留與正本對齊者）。累計已出貨數量、累計送達數、可出貨額度一律為衍生計算（selector），不存欄位——與段 2 的到料量處理一致，唯一寫入是出貨單本身，避免 handover 坑 2（跨模組寫入斷鏈）。

### D7 派單明細不再持有點收與產出數字（A8）

派單明細改為讀生產任務的欄位顯示（衍生呈現），不保留副本、不做雙向同步。後端 as-is 已確認派單側查無第二份數字，A8 為 prototype 自長出的副本，修正範圍限 prototype，wiki 與 spec 都不必動。

### D8 貨運單頁面照後端 as-is 做，不加把關

五點照現況：一次填 N 組運單號建 N 張單、分攤金額由前端算好逐列送出、關稅一張運單最多一筆且攤回即時算不落庫、認列後不鎖可重送（整批取代明細）、重量差異只提示不留存。R7／R8 拍板：不加鎖定規則、不加版本留存、不加差異原因欄、不開 OQ。認列與秤重維持桌機（R6）。

### D9 A10 五張孤兒派單以修 mock 處理

補齊或移除五張派單所指的工單，讓每張派單掛得到工單；不新增資料結構或校驗欄位（handover 坑 4）。

## Risks / Trade-offs

- [erp repo 有平行對話的未提交變更（handover 坑 6，`print-items/*`、`qc-shipping/_lib/store.js`）] → 每批 commit 前 `git status` 逐檔確認，只 stage 本批檔案；不執行任何 reset
- [出貨模組兩套實作收斂可能誤刪仍被引用的元件] → 收斂前先搜引用點，保留與正本對齊者、以路由層切換，不整目錄刪
- [實作與規格不同批改造成漂移（handover 坑 1）] → delta spec 與 prototype 同批任務內完成，verify 前不留「spec 待補」
- [跨模組連動看似完成實際斷掉（handover 坑 2）] → 收尾批次逐條追資料流：品檢通過 → 完工良品數 → 額度 → 出貨單 → 累計送達 → 印件已送達 → 訂單完成
- [揀貨照抄明細數而未實點] → 系統強制的是「要填一個總數才推得動單」，不是「這個數字是真的」；風險在填數紀律，Prototype 試用時觀察揀貨實際點到什麼顆粒度（設計隱含假設 2 已記）
- [例外移置的貨在系統上答不出位置] → 刻意接受（D1 拍板）；風險訊號是「找不到貨要查 Slack」開始頻繁發生，屆時再評估是否需要位置帳
- [認列後不鎖使成本歸屬可被改寫] → 照 as-is 接受並寫進規格（明寫比默默留著安全）；加鎖屬新規則、未經拍板不加
- [貨運單漏列明細時運費關稅攤到其他明細] → 已知限制不處理（無可信的應載清單來源），發現後走「認列後可再次送出」修正

## Migration Plan

Prototype 校正無部署議題。批次順序：品檢與品質帳 → 出貨模組收斂與額度檢核 → 送達與完成連動 → 貨運單頁面與外發成本 → 收尾貫通與驗收。每批走「實作（Sonnet）→ 稽核（Opus，只報發現）→ 裁決（Fable）→ commit」循環。回滾＝git revert 單批 commit。

`order-management` 四條 REMOVED 於 `/opsx:archive` 合併時自 main spec 刪除；`shipment` 承接的行為已於本 change 的 delta 完整寫出，合併後兩份 spec 不再有出貨行為重疊。

## Open Questions

無新增。既有 open OQ 與本 change 的關係：PT-004（QCRecord 資料遷移）不擋——Prototype 階段不做遷移；PI-007（印件交貨日期欄位）不擋——本段不觸及交期承諾；PT-026（外部廠商協作門戶）不擋——供應商建貨運單只落 spec 行為，介面標待驗。

## 另案處理（delta specs 撰寫期間發現，不在本 change 範圍）

| # | 發現 | 落點 | 為什麼另案 |
|---|------|------|-----------|
| A1 | `business-scenarios` 兩張全流程表的「印件狀態」欄仍使用「部分工單製作中」一值，而 wiki [印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md) 的印製維度九值列舉是否保留該值需複查 | wiki 狀態機卡與 `business-scenarios` | 本 change 只補「製程已確認」與「工單已交付」兩站（G8 範圍）；該值的存廢屬狀態列舉的商業決策，歸 wiki 側判定後再同步 spec |
| A2 | `order-management` § 印件印製維度狀態機 未承載「出貨中 → 已送達」與「製作完成 → 出貨中」兩條轉換（收尾判定落在 `shipment` § 送達後的收尾判定），兩份 spec 的印製維度轉換規則因此分散兩處 | 兩份 main spec 的檔頭與交叉引用 | 屬落點邊界問題而非規格錯誤（出貨觸發的轉換寫在出貨規格合理）；要不要把印製維度的全部轉換集中到 `order-management` 是一次跨檔重整，混在段 3 做會擴大 diff。**Prototype 觸發者已補（段 3 補修）**：「製作完成 → 出貨中」在 prototype 已由建出貨單的動作推進——建單成立後，該單明細所含且印製維度為「製作完成」的印件推「出貨中」，訂單狀態為「製作完成」者一併推「出貨中」，「首張」的語意由前態守衛承擔（第二張單推不動任何東西）。**A2 餘下的議題只剩落點邊界**：印製維度的轉換規則分散 `order-management` 與 `shipment` 兩份 spec，要不要集中仍屬另案 |
| A3 | `shipment` § Purpose 的範圍段未列「額度回補的方向唯一」與「守恆鏈」兩項新內容 | `shipment/spec.md` 檔頭 | delta 只承載 Requirement；檔頭需於 `/opsx:archive` 合併時一併手改 |
