## Why

### Background

場內轉交的商業規則已於 2026-09-23 拍板並落卡，正本如下：

| 主題 | wiki 正本 |
|------|----------|
| 轉交單的欄位、目的產線的取數與作廢重開的例外 | [轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md) |
| 目的站點的修改時機、修改者與歷程紀錄 | [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) |
| 轉交單與生產任務、產線的關係 | [生產領域資料結構總覽](../../../memory/Sens_wiki/wiki/erp/05-entities/生產領域資料結構總覽.md) |
| 轉交單狀態與轉換條件（撤回不設） | [轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md) |
| 送錯站、目的站點填錯的處置 | [場內轉交與更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與更正.md) |
| 需轉交前置的到料量不比對站點、只增不減 | [工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md) |
| 生管不改目的站點、印務主管核可後可改 | [生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)、[工單製程審核](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單製程審核.md) |

設計已過 plan-audit 三輪、Miles 拍板。Prototype 已實作並推送。

### Problem Statement

現行 spec 與拍板後的商業規則不一致，落差如下：

- spec 用回運單處理「送錯站又已被點收」。實務上送錯不回運，現場溝通後直接搬。
- spec 把目的站點的修改綁在製程規劃時機（草稿或重新確認製程）。目的站點填錯通常在第一批轉交時才發現，那時已有報工、改不了。
- spec 的到料量只算「目的地為本任務所在站點」的已點收量。送錯站、或改站前已點收的量會卡住下游。
- spec 建單段寫「可選目的地」。wiki 已改為目的地取自來源生產任務的目的站點。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- **BREAKING** 取消回運單：轉交單不分單別，刪除原轉交單連結、建回運單、回運點收減記到料量與解除佔用。已點收的單送錯站時，更正改為現場溝通後由廠務直接搬，系統不另開單。
- 生產任務的目的站點改為任務未轉「已作廢」「報廢」前皆可修改，含已完成：
  - 修改者為負責印務、編輯（代理）成員；製程核可後另加印務主管。
  - 核可後修改不必重審。
  - 每次修改記入生產任務歷程。
  - 生管不改，在現場發現設錯時於系統外通知印務。
- 需轉交標記的鎖定規則不變，與目的站點的修改拆開判定。
- 改目的站點不改寫已建轉交單的目的地：
  - 作廢重開的新單沿用原單目的地。
  - 從待搬視圖新建的單取任務當下的目的站點。
- 需轉交前置（場內生產任務）的到料量改為前置已點收轉交明細的總和，不比對站點，只增不減。
- 不受影響、仍比對站點的判定：點收權限（依轉交單目的地所屬產線）、入庫成品判定（品檢站已點收量）。
- 生產管理的操作角色刪除「回運單建立」；轉交單歷程紀錄不再記單別與原轉交單連結。
- work-order 製程規劃的「生產任務修改只在草稿或重新確認製程」加目的站點例外。

### Pending（OQ 拍板前不得進 propose）

下列議題另案處理，本 change 不規範。各 OQ 拍板前，對應行為 MUST NOT 進 propose：

| 議題 | OQ | 本 change 的處理 |
|------|----|----------------|
| 外發前置的到料量是否比對站點 | [PT-063](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-063-外發回台送場內後段是否走轉交單.md) | spec 對外發前置沿用原條文，只把不比對站點限定在場內前置 |
| 計畫設備與任務預計完成日在生產中可否修改 | [PT-062](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-062-計畫設備與任務預計完成日在生產中可否修改.md) | 製程規劃的修改時機只為目的站點開例外，其他欄位不動 |
| 來源任務報廢後重建的轉交單點不了收 | [PT-064](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-064-來源任務報廢後重建的轉交單無法點收.md) | 需轉交標記 Requirement 的報廢處置段不動 |

## Capabilities

### New Capabilities

- 無

### Modified Capabilities

- `production-execution`：取消回運單；新增目的站點修改規則；到料量改為不比對站點；操作角色與歷程紀錄同步刪回運。
- `work-order`：製程規劃的修改時機加目的站點例外。

## Impact

- 規格：`openspec/specs/production-execution/spec.md`、`openspec/specs/work-order/spec.md`。
- Prototype：erp repo `prototype/production-stage` 已實作並推送（commit 57538252、4669ea12；主管在生產管理唯讀在 b03f7566）。
- 測試：Sens `erp-prototype-tests` 第十章新增 10.22、10.23、10.24，第十章與全套已通過。
- 後端：轉交單刪單別與原轉交單連結兩欄；目的站點修改權限與歷程事件；到料量取數改為不比對站點。
- Linear：後端與交付項待 Miles 觸發 `linear-delivery`。
