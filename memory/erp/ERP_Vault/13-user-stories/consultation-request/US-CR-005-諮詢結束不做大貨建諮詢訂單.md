---
type: user-story
us-id: US-CR-005
module:
  - consultation-request
  - order-management
role:
  - "[[03-roles/諮詢]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢結束分支"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢費發票時間點處理"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-CR-002-諮詢人員認領諮詢單]] 或 [[US-CR-001-諮詢單自動建立]]：諮詢單已認領"
  - "客戶確認不繼續做大貨"
---

# US-CR-005 諮詢結束不做大貨建諮詢訂單

## 業務情境（穩定層）

### 作為
[[03-roles/諮詢]]

### 我希望
能於客戶確認不做大貨時收尾諮詢並建立諮詢訂單結算諮詢費

### 以便
諮詢費正式入帳，會計對帳清楚，無懸而未決的付款紀錄

### 前置條件
- 諮詢單已認領並完成諮詢（狀態為「待諮詢」含已分派）
- 客戶確認不繼續做大貨

### 業務流程

1. 諮詢人員與客戶確認諮詢結束且客戶不做大貨
2. 諮詢人員執行「完成諮詢（不做大貨）」
3. 系統建立諮詢訂單（訂單類型為「諮詢訂單」、客戶資料來自諮詢單、總額為諮詢費）
4. 系統在諮詢訂單上建立諮詢費的其他費用明細
5. 系統將付款紀錄從諮詢單轉移至諮詢訂單（修改綁定實體類型與 ID）
6. 系統依客戶在外部表單選擇的發票時點選項處理發票：
   - **發票時點 = 立即開立**（issue_now）：諮詢訂單立即開立發票（金額為諮詢費），訂單推進至「已開發票」再進「訂單完成」
   - **發票時點 = 延後至主訂單**（defer_to_main_order）：諮詢訂單同樣開立諮詢費發票（單筆，因為沒有主訂單可合併）
7. 諮詢單狀態推進至「完成諮詢」終態；諮詢訂單推進至「訂單完成」終態（兩種發票時點皆經「已開發票」狀態，因不做大貨情境下都單筆開立諮詢費發票）；諮詢訂單關聯欄位寫入新建諮詢訂單 ID
8. 系統寫入活動紀錄（事件描述「完成諮詢、建立諮詢訂單」+ 諮詢人員姓名 + 諮詢訂單編號 + 付款紀錄轉移軌跡）

### 成功條件

1. 諮詢人員執行「完成諮詢（不做大貨）」後系統建立諮詢訂單（類型為諮詢訂單、總額為諮詢費），客戶資料自動帶入
2. 付款紀錄從諮詢單轉移至諮詢訂單（綁定實體類型與 ID 更新），原諮詢單不再持有付款紀錄
3. 諮詢訂單依發票時點選項開立發票（不做大貨情境下無論時點選項皆開立諮詢費發票）
4. 諮詢單狀態推進至「完成諮詢」終態，諮詢訂單推進至「訂單完成」終態（兩發票時點都經「已開發票」狀態）
5. 諮詢訂單與諮詢單建立雙向關聯（諮詢訂單在諮詢單可追溯、諮詢單於詳情顯示對應訂單）；完成諮詢、付款轉移、開票皆寫入活動紀錄供事後稽核

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/consultation/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢結束分支」L112-128 + § Requirement「諮詢費發票時間點處理」L283-300
- 原 Notion User Story DB `US-CR-005`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L119-128 補入：建諮詢訂單 + 其他費用明細 + 付款紀錄轉移 + 雙向關聯
- 對齊 spec L283-300 補入發票時點兩種處理：
  - issue_now：諮詢訂單立即開立諮詢費發票
  - defer_to_main_order：不做大貨情境下因無主訂單可合併，仍單筆開立諮詢費發票（與 spec L290 一致）
- 注意：不做大貨情境下兩種發票時點實際處理一樣（都開立諮詢費發票），差異只在做大貨情境（成交轉訂單時 defer_to_main_order 才合併開票）
- 業務流程 step 5「付款紀錄綁定實體類型與 ID 更新」對應 spec `linked_entity_type` / `linked_entity_id` 欄位異動
