## Why

### Background

印務閱讀與編輯工單的實際動線，與現行生產任務呈現方式有落差。本變更承接 2026-08-25 拍板的設計（plan-audit 全過，wiki 已先落卡）：

- 商業規則：[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)（放損兩欄口徑）、[配方展開規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/配方展開規則.md)
- 實體：[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[急件主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/急件主檔.md)（新）、[生產領域資料結構總覽](../../../memory/Sens_wiki/wiki/erp/05-entities/生產領域資料結構總覽.md)
- 情境：[工單製程規劃](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單製程規劃.md)、[工單異動與生產任務調整](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單異動與生產任務調整.md)、[訂單印件規格維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單印件規格維護.md)
- 角色：[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md)、[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)

### Problem Statement

1. 生產任務以材料／工序／裝訂三段表格呈現，欄寬過寬需捲動，且分段結構表達不了「工序 → 材料 → 工序」的真實交錯順序。
2. 放損藏在放損率與含損目標數量裡，看不到絕對損耗數，與現場「張數」溝通語言脫節。
3. 急件事實散落（訂單布林與售價側加成互不連動），生產側看不到急件標示、交期也不反映急件提前。
4. 工單列印只有樁，紙本「工作印製傳單」仍靠手工維護。

## What Changes

- 生產任務清單改單一平列卡片式（取消三段分類），排序改專用側板（拖曳後確定生效、版本比對防併發）。
- 生產任務數量拆「預計生產＋放損」兩欄（皆可編輯），目標數量改唯讀衍生；放損率改唯讀參考（僅工序任務顯示）；預填一次、手改不重算上游；改量無下限（低於已投入即依既有判定完成）。
- 生產任務預計開工日取消自動倒推預填，改印務手填。**BREAKING**：既有倒推預填與手動標記機制移除。
- 生產任務新增製作細節、備註欄；卡片顯示群組、單位（依計價方法推導）、前置相依。
- 印件新增急件選項（單選急件主檔、必填、天數快照凍結、變更通知）與「訂單交期（扣除急件）」唯讀推導欄；工單預計交期改自此欄帶入。訂單「是否急件」降為純注記。審稿待審清單急單標示改看印件急件選項。
- 工單匯出：隱藏成本版列印友善頁（表頭＋平列明細＋參考完稿圖），印務與生管可印，只含已生效內容。

## Capabilities

### New Capabilities

（無——急件主檔為中台既有模組 as-is，不新開 spec；欄位正本歸 wiki）

### Modified Capabilities

- work-order：生產任務編輯行為（兩欄數量、開工日手填、排序側板、卡片清單）、工單匯出行為、預計交期承接規則
- order-management：印件急件選項設定與交期推導行為、急件變更通知、訂單急件注記語意
- prepress-review：待審清單急單標示來源改為印件急件選項

## Impact

- Prototype：erp repo `apps/erp/src/app/(prototype)/work-orders/`（ProcessTab 改卡片清單、TaskFormDialog 欄位重組、target-qty.js 兩欄化、列印頁新做）、orders 訂單編輯（印件急件選項）、prepress-review（標示來源）。
- 既有 mock 資料：生產任務 target_qty 拆欄遷移（工序型反推、材料型先扣開機損）。
- 相依 OQ：[PT-048](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-048-加量處理正本矛盾-加開新印件與原單改量並存.md)（加量矛盾，另案裁決不擋本案）、[PT-049](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-049-工單匯出版式的實務驗證方式.md)（匯出版式驗證，另案）、[PT-047](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-047-品檢需求記載落點.md)（匯出表頭確樣需求與品檢需求欄位家，另案處理）。
