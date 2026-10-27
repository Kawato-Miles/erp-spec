## Why

### Background

- 現行 wiki：線下單由業務填「未扣急件內部完成日」，系統扣急件凍結天數得出印件內部完成日，再加 1 個工作天建議為印件預計交期（[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md)、[工作天規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工作天規則.md)）。
- 業務與客戶談的是出貨那一天，現況要先自己減一個工作天才填得進欄位（[ORD-059](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-059-業務輸入端改填未扣急件預計交期.md)）。
- 線上單沒有起算規則；訂單層沒有急件標注；各處急件判準不一（wiki 寫「非一般件」，spec 與 Prototype 寫「凍結天數非零」，兩者都把延後型標成急件）。
- 急件選項來自 [急件主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/急件主檔.md)，增減天數可正可負。
- 規劃前稽核見同資料夾 [precheck.md](./precheck.md)；拍板紀錄見同資料夾 [grill.md](./grill.md)（G1～G25、R1）。

### Problem Statement

| 問題 | 誰受影響 | 現況後果 |
|---|---|---|
| 業務要自己把談定的出貨日換算成內部完成日 | 業務 | 換算易錯；急件時還要再扣一次天數 |
| 線下單急件的交期已由業務與客戶談定，系統卻再扣急件天數 | 業務、印務 | 印件內部完成日與業務對客戶的承諾脫鉤 |
| 線上單沒有交期起算規則 | 業務、EC 整合 | 線上單印件沒有日期可排程，只能留空 |
| 訂單、工單、生產任務看不出哪些是急件 | 印務、生管、師傅 | 急件要靠人逐筆打開印件才知道 |
| 急件判準各處不一，延後型被標成急件 | 審稿人員、印務 | 待審清單的急單標示誤標 |
| 審稿前與審稿後預計出貨日寫成線上線下通用、人工填寫 | 業務 | 線下單被迫填一個沒有用途的欄位；線上單沒有推算依據 |

## What Changes

### New Capabilities

無。

### Modified Capabilities

- 線下單日期輸入端改為印件預計交期；印件內部完成日改為預計交期減 1 個工作天；急件不影響任何日期；移除下限與覆蓋規則。
- 急件標注：凍結天數大於 0 才標，由印件即時推算；訂單、印件、工單、生產任務各處顯示；其他單據子列帶標注。
- 線上單日期原則：整單製作天數、審稿前與審稿後預計出貨日由系統推算（欄位實作交 EC 整合另案）。
- ORD-059 裁決：方案 B，不扣急件。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `order-management`：印件日期欄與重算同步規則改寫；訂單急件標注與列表篩選；兩個預計出貨日依訂單類型分流；轉訂單與複製加開的帶入規則。
- `quote-request`：印件項目欄改為印件預計交期，轉訂單直接帶入。
- `work-order`：工單日期副本同步觸發改為印件預計交期；急件標注顯示於列表、詳情、工作印製傳單；超期承接方式改寫。
- `prepress-review`：待審清單急單判準改為凍結天數大於 0；打樣 NG 複製新印件帶入預計交期。
- `production-overview`：引用「未扣急件內部完成日」的敘述改為印件預計交期。
- `production-execution`：生產任務列表與派工畫面帶急件標注；轉交單子列帶標注。
- `dispatch-order`：派單急件圖標判準統一為大於 0。
- `shipment`：出貨單子列帶出印件的急件標注。

## Impact

- wiki：26 項卡異動，清單見 [precheck.md](./precheck.md) § 七；ORD-059 封存、ORD-051 與 QR-022 更新；`wiki/log.md` 追加。
- OpenSpec：order-management、work-order、quote-request、prepress-review、production-overview、production-execution、dispatch-order、shipment 八份 spec 的 delta。線上單推算與印件層日期行為未決，不寫入 specs（延後紀錄見 grill.md）。
- Prototype（erp repo）：印件編輯對話框與印件列、訂單列表與詳情、工單列表／詳情／傳單、生產任務列表與派工畫面、需求單印件項目、日期鏈與同步函式、mock 資料。
- 測試（Sens erp-prototype-tests）：情境目錄第 4、5、7、9、11、14、15 章相關節與日期鏈單元測試；細項見 design.md 與 tasks.md 的測試影響清單。
- 不在本案：線上單欄位實作與 EC 帶入（未決，延後紀錄見 grill.md）、Linear 交付（由 Miles 觸發）。
