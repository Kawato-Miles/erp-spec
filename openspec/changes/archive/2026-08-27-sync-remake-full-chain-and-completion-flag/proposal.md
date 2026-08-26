# Proposal: sync-remake-full-chain-and-completion-flag

## Why

### Background

2026-08-27 Miles 拍板三件事並已落 wiki（BRD 先行，commit 7d58d24）：

1. **補做一律全鏈重做**（具名翻案原「起補工序依各工序剩餘量推算」設計）：以缺口量為成品需求，沿換算規則倒推整串補做生產任務（含補做用料的材料任務）；現場若有可用半成品由現場自行少做、報工照全鏈記。正本見 wiki [QC不通過補生產](../../../memory/Sens_wiki/wiki/erp/07-scenarios/QC不通過補生產.md) 第 2 步。全鏈重做順帶解掉補做任務計價張數取整批材料任務的失真——補做輪有自己的材料任務。
2. **是否計入完成度預設否**（實務難以事前定義末道工序）、欄位移入數量段；「每份工單需生產數量」僅計入任務顯示並必填；工單送審與異動確認時把關「至少一筆任務計入完成度」。正本見 wiki [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 數量、[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md) § 規則。
3. **計價輸入取 BOM 規格選項**（經 sens-print-core BOM 資料模型查證）：面積計價選面積規格、重量計價選母版規格列，價格階梯在 BOM；材料開料換算不再以「每份工單需生產數量」小數表達，手動建單由印務依規格與拼版直接填材料任務預計生產。正本見 wiki [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) § 三、[BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)。

### Problem Statement

work-order spec 四處與拍板後 wiki 不一致：§ 補生產承接寫起補工序推算（已翻案）；§ 生產任務目標數量預設與放損率的材料用量倍率手動路仍寫 0.125 小數開料換算；§ 預估成本凍結的其餘輸入來源未寫規格選項口徑；計入完成度的預設值、條件顯示與送審防呆在 spec 完全缺席。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- work-order：§ 補生產承接（全鏈重做）、§ 生產任務目標數量預設與放損率（開料換算路徑）、§ 預估成本凍結（規格選項口徑）三個 Requirement 修訂；新增 Requirement「生產任務完成度計入設定」（預設否、條件顯示、送審與異動確認防呆）。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- work-order：補做預帶改全鏈重做；完成度計入設定入 spec；計價輸入與開料換算對齊 BOM 規格選項。

## Impact

- OpenSpec：`openspec/specs/work-order/spec.md` 三個 Requirement 修訂＋一個新增。
- Linear（本 change 封存後出更正）：PM-1074 生產任務結構段補計入完成度、PM-1075 輸入來源段、FE-468、BE-326。
- Prototype（erp repo，另批實作）：TaskFormDialog 計入完成度移段與條件顯示、BOM 規格選項選擇器、mock 外發工單補材料任務。
- 相關 open OQ（不因本 change 結案）：[PT-042 拼版模數算法](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-042-拼版模數算法.md)（廠內是否沿用引擎拼版模組一併待裁）。
