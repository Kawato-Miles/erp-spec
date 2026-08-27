# Proposal: sync-per-task-costing-quantity

## Why

### Background

2026-08-27 Miles 拍板並已落 wiki（commit e255d36）：生產任務的數量計算，印務都看印件要做多少、任務之間不互相取數——**各任務的計價數量輸入＝自己的目標數量**；需要設備上機的任務由印務依拼版換算**以上機張數**填寫（設備成本以張計）、不需設備的任務以該工序產出件數填。正本見 wiki [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 數量、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) § 單位分工。

### Problem Statement

work-order spec 兩個 Requirement 仍寫「張數取同工單材料型任務的目標數量」的跨任務讀法（8/26 落卡措辭的過度推導，已撤銷），且倒推預填未區分以件計與以張計任務。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- work-order：§ 預估成本凍結（計價數量輸入改任務自身目標數量）、§ 生產任務目標數量預設與放損率（單位分工＋上機任務不入倒推預填）。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- work-order：計價數量輸入口徑與預填單位分工修訂。

## Impact

- OpenSpec：`openspec/specs/work-order/spec.md` 兩個 Requirement。
- Linear（封存後更正）：PM-1074 預計生產與放損段、PM-1075 計價輸入來源段、BE-324／BE-334／FE-468 相關句。
- Prototype（另批實作）：引擎改各任務自身目標數量、mock 上機任務改張口徑。
