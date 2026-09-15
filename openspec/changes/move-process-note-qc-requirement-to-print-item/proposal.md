# 製程說明與品檢需求改掛印件層

## Why

### Background

製程說明目前是工單的欄位，品檢需求則根本沒有欄位——它只活在紙本工單的表頭上，落點從 PT-047 開卡起就一直懸著。兩者的共同問題是：印務寫的是「這件印刷品怎麼做、要檢查什麼」，而承載它的卻是工單這個切割後的單位。一件印件拆成本體、封面、配件三張工單時，同一份製法說明要打三次，品檢人員拿到三張紙也讀不出哪一份才算數。

Miles 2026-09-15 拍板：兩欄一起從工單搬到印件，各一份文字管旗下全部工單。落點理由是品質帳唯一的家在印件層——品檢人員驗收的對象是印件，不是單張工單。

商業層正本已落 wiki：

- [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) § 基本資料（製程說明、品檢需求兩欄新增於「預計產線」列之後）
- [工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) § 基本資料（製程說明列刪除）與 § 列印交工廠的工單單據（表頭改取所屬印件）
- [生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/生產流程.md) 階段 2（印務改在印件上填兩欄）
- [印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md) 職責 8、[品檢人員](../../../memory/Sens_wiki/wiki/erp/03-roles/品檢人員.md) § 關切點
- [工單製程規劃](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單製程規劃.md) 主流程
- 已封存 [PT-047](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/PT-047-品檢需求記載落點.md)（品檢需求記載落點以選項 A 結案）

本 change 把上述已定案的商業層設計同步進 OpenSpec 的系統行為規格。

### Problem Statement

三份既有 spec 仍以「兩欄長在工單上」撰寫，與 wiki 正本不一致：

| 模組 | 不一致之處 |
|---|---|
| work-order | § 製程規劃 把「填寫製程說明與品檢需求」列為工單詳情的規劃動作之一；§ 工單列印單據 表頭的品檢需求與製程說明沒寫取數來源，讀起來像工單自己的欄位 |
| order-management | 印件層完全沒有這兩欄的條文——顯示位置、編輯把關、兩頁同源三件事都無處可查 |
| qc | § 分次驗收記錄 只規範怎麼記數量與原因，沒有任何條文讓品檢人員在驗收介面看得到這批貨該檢查什麼 |

## What Changes

### 欄位歸屬對照

| 欄位 | 原歸屬 | 新歸屬 |
|---|---|---|
| 製程說明 | 工單（每張各一份） | 印件（一份管旗下全部工單） |
| 品檢需求 | 無系統欄位（僅紙本表頭） | 印件（一份管旗下全部工單） |

### New Capabilities

- **order-management**：新增 Requirement「印件製程說明與品檢需求」，規範兩欄的語意、顯示位置、編輯把關（角色與印件終態）、兩頁同源，以及下游取用點。

### Modified Capabilities

- **work-order**：§ 製程規劃 移除「填寫製程說明與品檢需求」這個工單層動作，改寫為印務於工單詳情的印件基本資訊面板讀寫印件層的兩欄、與印件詳情頁同源；§ 工單列印單據 表頭的兩欄明寫取自所屬印件。
- **qc**：§ 分次驗收記錄 的驗收介面新增唯讀顯示該印件的品檢需求，無值顯示「－」。

## Capabilities

### New Capabilities

- order-management：印件製程說明與品檢需求兩欄的顯示、編輯把關與兩頁同源。

### Modified Capabilities

- work-order：製程規劃的兩欄改為印件層讀寫、工單列印單據表頭取數來源明寫。
- qc：分次驗收記錄的驗收介面唯讀顯示品檢需求。

## Impact

- wiki：正本卡已落（2026-09-15），本 change 不再改動。
- OpenSpec：三份 main spec 的規格差異檔（delta）——work-order、order-management、qc。
- **歸檔順序**：§ 工單列印單據 的 MODIFIED 基底取自 `changes/delivery-date-naming-convergence/specs/work-order/spec.md`（表頭已為「內部完成日」）。本 change MUST 於 `delivery-date-naming-convergence` 歸檔之後才歸檔，否則表頭的日期欄名會被回退成舊名。
- Prototype（erp repo `(prototype)`）：工單詳情的印件基本資訊面板、印件詳情頁的印件基本資訊面板、紙本工單表頭、品檢驗收介面。
- 測試（Sens repo `erp-prototype-tests`）：印務登打製程、製程審核與交付產線、品檢三章的情境與 mock 主鏈同步。
- Mock 既有資料的收斂：同一印件的多張工單各自寫了不同製程說明時，合併成一段文字並以部件名分段（例：「本體：…／封面：…」）。
- 後端差異走 Linear 另案處理，不在本 change 範圍：工單 `製程說明` 欄位停用、印件兩欄新增的欄位對映。
