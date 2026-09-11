## Why

### Background

現況交期只有訂單單頭一個欄位（[[../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md|訂單]] 的客戶交期），同一張訂單底下每件印刷品的承諾日一律由它減掉急件天數算出，無法各自談定。同單多件時，業務只能就最急的那件填，不急的件被一起提前，現場被迫全部趕工。

交期在各單據上名稱不一（客戶期望交期／客戶交期／訂單交期（扣除急件）／印件交期），讀單的人分不出哪個是跟客戶承諾的、哪個是內部算的，開發也重複實作。

wiki 已落卡（commit 11a534c）：[[../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md|印件]] 新增獨立「訂單交期」欄並改寫「預計交期」推導欄；[[../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md|訂單]] 的客戶交期改名「訂單交期」、刪除是否急件欄；[[../../../memory/Sens_wiki/wiki/erp/05-entities/需求單.md|需求單]] 單頭與印件項目的交期欄拆寫並正名；[[../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md|訂單異動規則]] 補入印件訂單交期修改的重推與同步規則（零金額不建單段）。本次 change 把上述已定案的商業層設計同步進 OpenSpec 的系統行為規格。

### Problem Statement

四份既有 spec（order-management、quote-request、work-order、prepress-review）目前仍以「訂單客戶交期推導全部印件交期」「訂單持有是否急件」為前提撰寫 Requirement 與 Scenario，與 wiki 正本已不一致，須同步改寫：

- 印件缺一個獨立、選填的訂單交期欄位與對應的必填／選填欄位表。
- 印件「預計交期」推導算式少算一天，語意仍寫成對客戶的實際承諾交付日。
- 訂單「是否急件」欄位與其下游三處引用（work-order 兩處、prepress-review 兩處）尚未刪除。
- 工單排程日期、審稿待審清單排序仍取訂單客戶交期，未改取印件層預計交期。
- 印件急件選項與訂單交期變更的通知負責印務規則，與 Miles 2026-09-08 「不通知、只留痕與同步」裁決不一致。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- **order-management**：印件訂單交期推導 Requirement 改名為「印件預計交期推導」並改算式（訂單交期 − 1 − 急件選項凍結的增減天數），四個 Scenario 期望值改寫；刪除「訂單是否急件為注記」Requirement 與其兩個 Scenario；印件急件選項變更通知 Requirement 改為留痕與同步非終態工單（刪通知）；階段一可編輯欄位加入訂單交期；加開印件 Requirement 補上新欄位（訂單交期選填、預設取訂單的訂單交期、複製加開留空）與印件配方帶入、新增印件七項必填欄位；內部製作截止日定義刪除「工單預計交期不晚於內部製作截止日」一句與涉及比對的 Scenario；成交轉訂單帶入清單指名層級與空值不補；訂單詳情頁編輯型 Section 的欄位範圍調整（納入帳務公司、移除是否急件、加訂單交期與內部製作截止日）。
- **quote-request**：印件項目管理 Requirement 補交期欄（選填）與轉訂單帶入 Scenario；成交轉訂單段的「交期」由泛稱改為明指單頭與印件項目兩層，並補「印件項目交期為空、印件訂單交期即為空」的判定。
- **work-order**：工單排程日期取數表改取印件「預計交期」、語意改為內部預計出貨日，兩個 Scenario 期望值往前一天、補印件交期為空時工單預計交期為空的 Scenario；紙本工單表頭欄名改名並補無值印「－」；工單急件標示移除對訂單是否急件的引用並重寫 Scenario；急件變更通知 Scenario 改為留痕與同步（刪通知）。
- **prepress-review**：待審清單與待審訂單模組排序鍵改取印件「預計交期」、空值排在有值之後（同組依印件編號）、不加交期未定標記；母列顯示欄改訂單交期、子列改訂單交期與預計交期並列；移除對訂單是否急件的引用，急單標示取印件急件選項。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- order-management：印件訂單交期欄位新增、印件預計交期推導改名改算式、是否急件刪除、加開印件欄位表、內部製作截止日約束刪除、訂單詳情頁分區編輯欄位範圍調整。
- quote-request：印件項目補交期欄、成交轉訂單帶入層級明確化。
- work-order：工單排程日期取數來源改為印件預計交期、紙本工單表頭改名、急件標示與通知規則改寫。
- prepress-review：待審清單與待審訂單排序鍵改為印件預計交期、母子列顯示欄改名、急單標示改取印件急件選項。

## Impact

- wiki：26 卡已落（commit 11a534c），本次不再改動。
- OpenSpec：四份 main spec 的 delta（本 change）。
- Prototype（erp repo `(prototype)`）：需求單印件列、訂單資訊 Tab 分區編輯、新增與複製加開印件 Dialog、印件詳情兩交期欄、工單交期顯示、審稿待審清單排序七處介面與 mock 主鏈。
- 測試（Sens repo `erp-prototype-tests`）：第二章（需求單）與相關章節的情境與 mock 資料同步。
- 後端差異，走 Linear 另案處理，不在本 change 範圍：印件建立 API 不收印件類型與急件選項、訂單 `is_urgent` 欄位廢除、審稿前後預計出貨日兩欄與訂單更新可改清單的落差。
- 未解 OQ [[../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-050-印件層交期成為承諾正本後訂單準時交貨率的取數層級.md|ORD-050]]：印件層交期成為承諾正本後，訂單準時交貨率的取數層級是否下沉，另案處理，本 change 不處理。
