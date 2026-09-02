## Why

### Background

工單是標準化的內容——報工、填寫與計算在所有生產任務上相同：不分場內或場外、不分材料、工序或裝訂。Miles 於 2026-09-02 第四輪拍板把這件事推到寫法層：既然規則相同就不必反覆強調相同，也不留任何以「相同」為主題的句子。商業正本已落卡：

- [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)（刪報工累計上限整節、刪「外發任務不設廠商自助管道」與依點收結果填報句、管道節不寫死數量）
- [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)（引言刪同一組欄位的強調條、欄位段改為直述一筆報工要填哪幾欄、誰報表把印務兩列併為一列、刪工時與設備留空整段與材料型良品口徑句）
- [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)（刪「欄位結構不依任務類型分支」整段、刪三類任務強調句、報工關聯句與 BOM 引用句刪材料類任務即備料動作的整串）
- [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)（完成判定與轉換表刪皆同句與報工警示門檻引用、回廠收斂子表刪依點收結果報工措辭）
- [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)（料帳平衡放損側改寫為取下游工序任務，刪備料不產生廢料與材料型放損為 0 的口徑）
- [外發委外與回廠點收](../../../memory/Sens_wiki/wiki/erp/07-scenarios/外發委外與回廠點收.md)、[派單](../../../memory/Sens_wiki/wiki/erp/05-entities/派單.md)（刪生產任務報工的依點收結果措辭；派單終態依點收結果切不動）
- [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)（外發報工句刪欄位同一組與兩欄留空的說明）

落卡紀錄見 [wiki/log.md](../../../memory/Sens_wiki/wiki/log.md) 2026-09-02「報工用詞全統一」條目。本 change 是 [2026-09-02-unify-work-report-flow](../archive/2026-09-02-unify-work-report-flow/proposal.md) 的延續——上一輪把兩個報工變體收成一套，本輪把「收成一套」這件事本身的敘述也從 spec 移除。

### Problem Statement

四份主 spec 仍以「這裡跟那裡一樣」為敘述主題，且留著三項已被推翻的規則：

1. `production-execution` § 報工開頭以「報工 SHALL 為單一流程」立論，另有外發報工的「工時與設備留空」「依點收結果填報」與「外發不另設廠商自助管道」三段；§ 拉料備料整段材料型良品口徑（良品＝領出全部、不良品 0、放損自然 0）。
2. `production-execution` § 報工數量上限警示整個 Requirement 與拍板相反——報工累計超過目標數量不警示、不阻擋。
3. `dispatch-order` § 回廠點收把報工寫成回廠收尾的第三步（含預帶生產數量與兩欄留空），與「回廠點收是派單流程一步、不寫報工」相反。
4. 強調句散在四份 spec：「所有任務類型與承作單位皆同」「三類任務一體適用」「欄位結構不依任務類型分支」「SHALL NOT 依任務類型分流」等。

## What Changes

### Modified Capabilities

- `production-execution`：§ 報工刪單一流程立論句、刪外發留空與依點收結果填報、刪廠商自助的否定句，改為外發報工由印務手填並補「累計超過目標數量照實計入、不阻擋、不警示」一句；§ 拉料備料刪材料型良品口徑段與報工欄位相同段；§ 生產任務狀態轉換完成判定由表格改單句、刪不依任務類型的宣告與兩個材料型 Scenario；§ 派工前置檢查、§ 報工作廢與留痕、§ 需轉交標記刪強調句與材料型舉例；§ 現場回報通道刪外發桌機報工與外部門戶句。
- `dispatch-order`：§ 回廠點收第三步收為「切終態」、刪報工欄位段與依點收結果填報；§ 外發任務產出數量取報工累計改為印務手填、系統不預帶點收數量，刪警示引用。
- `work-order`：§ 製程規劃刪欄位結構不分支的宣告；§ 生產任務結構與帶入規則刪一體適用與完成判定分工的宣告；§ 生產任務目標數量預設與放損率刪三類一律顯示與外發不另立分支句；§ 工單完工判定改寫「一律改取」的迭代式措辭。
- `recipe-expansion`：§ 配方段展開為生產任務刪執行規則皆同段與備料動作的定性句。
- `production-overview`：§ 六指標刪材料型專用領用量欄位的否定句與 Rationale 的欄位同一份說明。
- `qc`：§ 待驗清單刪依點收結果報工與兩類來源完全相同的措辭。

**BREAKING**：報工累計超過目標數量不再警示（`production-execution` § 報工數量上限警示 REMOVED）；外發報工的生產數量不再由系統預帶點收數量；回廠點收的第三步不再包含報工動作。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：Requirement「拉料備料」、「報工」、「報工權限守門」、「報工作廢與留痕」、「需轉交標記的適用與變更把關」、「派工前置檢查」、「生產任務狀態轉換」、「現場回報通道與裝置政策」；REMOVED「報工數量上限警示」。
- `dispatch-order`：Requirement「回廠點收」、「外發任務產出數量取報工累計」。
- `work-order`：Requirement「製程規劃」、「生產任務結構與帶入規則」、「生產任務目標數量預設與放損率」、「工單完工判定」。
- `recipe-expansion`：Requirement「配方段展開為生產任務」。
- `production-overview`：Requirement「六指標」。
- `qc`：Requirement「待驗清單」。

## Impact

- 受影響 spec：`openspec/specs/production-execution/spec.md`、`dispatch-order/spec.md`、`work-order/spec.md`、`recipe-expansion/spec.md`、`production-overview/spec.md`、`qc/spec.md`。
- 未受影響但已查核：`order-management`（印件詳情頁兩個報工入口共用同一組欄位與檢核，敘述對象是兩個入口而非任務類型，留）、`material-master`／`process-master`／`binding-master`（承作廠商留空即自有工廠，與報工無關，留）、`business-scenarios`（報工僅作為投入事實的判準，留）。
- 後端 `sens-print-core`：移除報工超量警示；外發報工不預帶點收數量；回廠點收流程移除報工步驟。
- 前端：報工表單移除超量警示呈現；外發報工的生產數量改為空白待填。
- Prototype：報工表單與外發回廠兩處同步（另案處理）。
- Linear：派工現場執行與外包協作兩個 Feature 票及其 Task 票同步。
