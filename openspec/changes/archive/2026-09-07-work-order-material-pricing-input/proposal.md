# 工單建立材料選擇深度與計價方式成本計算

## Why

### Background

材料主檔是三層加計價子表列的結構：材料規格之下還有一層承載單價參數的列（重量計價尺寸表、面積價格矩陣、數量級距表），見 [材料主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/材料主檔.md) 與 [BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)。工單製程規劃目前只能選到材料規格層，選不到計價子表列；裝訂三種計價方法的台數與頁數輸入也沒有欄位承接。單價與計價乘數取不到，材料費與裝訂費算不出正確值，預估成本分項失真。

設計正本：[work-order-material-selection-design.md](../../../work-order-material-selection-design.md)（grill 八題＋三輪裁決拍板、plan-audit 三輪稽核通過、wiki 11 卡已於 2026-08-27 落卡，含 [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) 四個計價輸入欄）。

### Problem Statement

工單的材料型與裝訂型生產任務缺計價輸入：重量計價選不到母版規格列、面積計價沒有面積數值欄、裝訂台數與頁數無欄位，材料費與裝訂費無法依 BOM結構 公式計算。

## What Changes

- 材料型生產任務新增兩個計價輸入：母版規格列（重量計價，單選必填）、計價面積（面積計價，數字必填、單位由價格矩陣帶出）；按數量計價不新增輸入（級距由目標數量自動決定）
- 裝訂型生產任務新增兩個計價輸入：台數（台數計價必填）、頁數（頁數計價與本數計價必填）；本數取任務目標數量，不另設欄
- 材料費與裝訂費計算依計價方式分支（公式正本 [BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md) M1-M5、B1-B3）；廠內工單不套通用數量乘數
- 新欄納入生產任務儲存時的必填檢查；查無對應價格區間時該分項金額顯示 0
- 重凍規則：製程確認階段改計價輸入即儲存時重算重凍計價快照；製程定案後走工單異動、異動確認時重算重凍
- 線上單自動建工單的計價輸入承接不在本次範圍（[PT-050](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-050-線上單自動建工單的計價輸入承接.md) 另案）；Prototype 同步移除 EC 相關訂單與工單假資料

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- work-order：製程規劃的材料與裝訂計價輸入（四欄選填規則、必填擋存、成本計算分支、重凍時點）

## Impact

- OpenSpec：`openspec/specs/work-order/spec.md`（製程規劃與預估成本相關 Requirement）
- Prototype（erp repo）：工單任務表單（四欄與條件顯示）、BOM 主檔 mock（計價子表列三型）、預估成本計算（六條材料公式＋三條裝訂公式）、EC 相關訂單與工單假資料移除
- wiki：11 卡已先行落卡完成（BRD 先行），本 change 不再動 wiki
