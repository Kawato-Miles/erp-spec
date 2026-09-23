## Why

### Background

需求單的狀態列舉與轉換動機以 wiki 需求單狀態機卡為正本：[需求單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/需求單狀態.md)。該卡已定案兩組轉換：

- 流失 → 待評估成本：業務執行「重新啟動」，重啟原因必填；系統清空流失原因與流失補充說明。
- 任一狀態 → 刪除：接單業務、建立者或被授權編輯者執行「刪除」，軟刪除，資料保留、不再出現在清單。

欄位與可見範圍見 [需求單](../../../memory/Sens_wiki/wiki/erp/05-entities/需求單.md)。

### Problem Statement

`quote-request` spec 沒有這兩組轉換，而且「需求單流失歸因」寫「流失後需求單狀態 SHALL 鎖定，不可再變更」，和 wiki 的重新啟動衝突。Prototype 已實作重新啟動與刪除，行為規格落後於商業正本與介面正本。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- 需求單狀態轉換：新增「流失 → 待評估成本（重新啟動）」與「任一狀態 → 刪除（軟刪除）」。
- 需求單流失歸因：「流失後不可再變更」改為「流失後需求單鎖定，唯一出口是重新啟動」。

諮詢來源需求單流失後重新啟動、與已建立的諮詢訂單之間怎麼處理，另案處理，見 [QR-006](../../../memory/Sens_wiki/wiki/erp/08-open-questions/QR-006-諮詢來源需求單流失後重新啟動與諮詢訂單的關係.md)。

## Capabilities

### New Capabilities

- 無

### Modified Capabilities

- `quote-request`：狀態轉換補重新啟動與刪除；流失歸因移除「流失後不可再變更」。

## Impact

- 規格：`openspec/specs/quote-request/spec.md`。
- Prototype：erp repo `quote-prototype` 已實作，本變更不改 Prototype。
- 測試：Sens `erp-prototype-tests` 補刪除需求單的情境目錄節與測試；重新啟動沿用情境 1.8。
- Linear：本變更不同步 Linear（Miles 2026-09-24 裁定）。
