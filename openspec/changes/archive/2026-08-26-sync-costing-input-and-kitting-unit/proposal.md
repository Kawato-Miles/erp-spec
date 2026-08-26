# Proposal: sync-costing-input-and-kitting-unit

## Why

### Background

2026-08-26 vault-audit 全量稽核後，Miles 拍板兩件事並已落 wiki（BRD 正本先行）：

1. **計價輸入四欄具名翻案刪除**（推翻 2026-08-19 交付的「計價輸入一律印務手填」設計）：生產任務不設任務層計價輸入欄（上機張數、才數、工序面積、頁數四欄刪除），成本各分項的數量輸入改取自數量帳——張數＝同工單材料型生產任務的目標數量（拼版換算落在該任務的預計生產欄）、才數由系統依成品尺寸換算、其餘輸入依各計價方法的定義取得。正本見 wiki [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 數量、[BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md) § 計價引擎計算框架、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) § 材料需求換算。
2. **齊套取數單位定為生產任務**：齊套完成數取各計入生產任務的產出數量最慢者（不是工序名稱、不是工單）；同名工序的任務各自獨立不合併不加總，補做產出併入被承接進度為唯一併入特例。正本見 wiki [齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md) § 規則。

### Problem Statement

work-order spec 有三處與拍板後的 wiki 正本不一致，留著會讓下一個 change 或實作引用到錯的口徑：

1. § 預估成本凍結 仍要求生產任務提供四個手填計價輸入欄位（已翻案的設計）。
2. § 工單完工判定 的 Scenario 寫齊套完成數「取各工序的產出數量」（過時措辭，取數單位已定為生產任務）。
3. § 訂單加量缺口以工單異動承接 的 Rationale 寫「齊套完成數取各工單的最慢者」——與拍板直接矛盾（跨工單取慢會讓多部件印件永遠卡在配件進度）。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- work-order：三個 Requirement 的修訂（預估成本凍結、工單完工判定、訂單加量缺口以工單異動承接），行為變更只有第一項（計價輸入來源改數量帳），後兩項為口徑措辭對齊。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- work-order：預估成本凍結改為「不設任務層計價輸入欄、數量輸入取自數量帳」；齊套完成數的取數單位措辭統一為「各計入生產任務」。

## Impact

- OpenSpec：`openspec/specs/work-order/spec.md` 三個 Requirement。
- Prototype（erp repo，本 change 之後另批處理）：TaskFormDialog 刪四欄、estimate-cost.js 改取材料型任務目標數量、mock 與驗算腳本、ACCEPTANCE.md。
- Linear（本 change 封存後出更正票）：BE-324 計價引擎移植、FE-467~469 的計價輸入段。
- 相關 open OQ（不因本 change 結案）：[PT-042 拼版模數算法](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-042-拼版模數算法.md)（拼版換算仍由印務人工算、落在材料型任務預計生產欄）、[PT-046 計價引擎三項未實作計價因子的補齊時機](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-046-計價引擎三項未實作計價因子的補齊時機.md)、[PT-043 設備人工時費率與每小時折舊欄位歸屬](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-043-設備人工時費率與每小時折舊欄位歸屬.md)。
