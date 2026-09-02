## Why

### Background

報工是單一流程、不分變體這件事於 2026-09-02 由 Miles 第三輪拍板。商業正本已落卡：

- [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)（刪報工型別概念，改為「所有生產任務同一組欄位、同一流程」＋誰報與值來源四列表；外發任務由印務依回廠點收結果填報同一組欄位，只有實際工時與運轉設備兩欄留空；放損欄補材料型任務算出來自然為 0 的說明）
- [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)（完成判定收成單一條——生產數量累計達目標數量、作廢報工不計入、所有任務類型與承作單位皆同；刪外發取產出累計算法）
- [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)（刪「依廠商類別取不同的數」與「場內與外發回廠各填哪幾項」措辭；管道四種、外發不設廠商自助）
- [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)（料帳平衡改三成分取數表，放損側明訂取吃這批料的下游工序任務報工的放損欄加不良品數）
- [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)（生產數量欄補完成判定取這個累計；產出數量欄刪完成判定分變體句；報工欄位句改不分任務類型與承作單位）
- [外發委外與回廠點收](../../../memory/Sens_wiki/wiki/erp/07-scenarios/外發委外與回廠點收.md)（四處改依點收結果填報同一組欄位）
- [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)（外發排除句改為欄位同一組、只有工時與運轉設備兩欄留空）

落卡紀錄見 [wiki/log.md](../../../memory/Sens_wiki/wiki/log.md) 2026-09-02「報工單一流程」條目。本 change 是 [2026-09-02-standardize-material-task](../archive/2026-09-02-standardize-material-task/proposal.md) 的延續——上一輪把材料型收進標準結構、留下場內與外發兩個變體，本輪把最後這道分支也拿掉。

### Problem Statement

四份 spec 仍以「場內與外發兩種報工」為骨架，與拍板後的商業正本相反：

1. `production-execution` 明寫「報工 SHALL 只有兩個變體」，外發報工只填良品與不良品；完成判定表因此分兩列（場內取投入累計、外發取產出累計）；報工上限的門檻也跟著分兩種取數。
2. `dispatch-order` 的回廠點收與外發產出數量兩處，報工欄位未與場內對齊，完成判定寫「報工累計」而未指明取哪一個數。
3. `work-order` 明寫「完成判定的取數 SHALL 依廠商類別分工」，且工單完工判定的口徑句只涵蓋場內工序型與裝訂型。
4. `production-execution` 的報工管道仍為五種（含供應商自助）並另有一段規格層宣告，與 wiki 的四管道、外發由印務填報相反。
5. 上一輪留下的材料型良品口徑待裁決（良品是否等於領出全部）已由本輪拍板解答，spec 尚未承接。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：報工由兩變體收為單一流程（同一組欄位、同一套填報規則，取不到值的欄位留空）；完成判定表由兩列收為一列（生產數量累計 ≥ 目標數量）；報工上限門檻一律取生產數量累計；報工管道由五種改四種、刪供應商自助的規格層宣告；材料型良品口徑（良品＝領出全部、不良品 0、放損自然 0）入 § 拉料備料，並串起料帳平衡放損側、轉交可申請上限與不需轉交下游到料量三處取數。
- `dispatch-order`：回廠點收的第三步明訂報工填同一組欄位（點收到的量即生產數量、工時與設備留空）；外發完成判定改生產數量累計、與場內同一條；超交由「不設上限」改寫為「不設上限校驗、只警示不阻擋」。
- `work-order`：生產任務結構與帶入規則刪「完成判定依廠商類別分工」、改單一條；工單完工判定的口徑句由「場內工序型與裝訂型」改為所有生產任務。

**BREAKING**：外發生產任務的完成判定由產出累計改為生產數量累計，報工欄位由兩欄擴為與場內同一組；供應商自助報工管道自規格層移除。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：Requirement「拉料備料」、「報工」、「報工數量上限警示」、「報工權限守門」、「報工作廢與留痕」、「派工前置檢查」、「生產任務狀態轉換」、「現場回報通道與裝置政策」。
- `work-order`：Requirement「工單完工判定」、「生產任務結構與帶入規則」。
- `dispatch-order`：Requirement「回廠點收」、「外發任務產出數量取報工累計」。

## Impact

- 受影響 spec：`openspec/specs/production-execution/spec.md`、`openspec/specs/dispatch-order/spec.md`、`openspec/specs/work-order/spec.md`。
- 未受影響但已查核：`production-overview`（六指標的外發排除句未以「變體」表述，排除理由仍為 wiki 現行口徑，無需改寫）、`recipe-expansion`（已於上一輪改為「與其他兩類走同一套執行規則」）、`order-management`（材料成本句已對齊生產數量累計）。
- 後端 `sens-print-core`：外發報工欄位由兩欄擴為同一組（生產數量、良品數、不良品數，工時與設備留空）；生產任務完成判定統一取生產數量累計；報工管道值域由五收為四。
- 前端：外發報工表單改用與場內同一份表單（工時與設備欄留空且不可填）；廠商自助報工入口不再實作。
- Prototype：報工表單與外發回廠報工兩處同步（另案處理）。
- Linear：派工現場執行與外包協作兩個 Feature 票及其 Task 票同步。
