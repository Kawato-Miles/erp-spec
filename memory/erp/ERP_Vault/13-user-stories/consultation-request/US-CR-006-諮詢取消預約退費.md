---
type: user-story
us-id: US-CR-006
module:
  - consultation-request
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢取消觸發建諮詢訂單與退費"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢費發票時間點處理"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
  - "[[05-entities/訂單]]"
related-oq:
  - "[[CR-3-諮詢取消三項擴充議題]]"
related-test-cases: []
---

# US-CR-006 諮詢取消預約退費

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於客戶在「待諮詢」階段取消預約時系統化處理退費

### 以便
退費流程系統化避免人工算錯或漏退，並依發票時點正確處理開票與折讓

### 前置條件
- 諮詢單狀態為「待諮詢」（含已認領未認領）
- 客戶確認取消預約
- **離開「待諮詢」狀態後不可退費**（已轉需求單 / 完成諮詢 / 已取消的諮詢單無法執行本流程）

### 業務流程

1. 業務與客戶確認取消諮詢預約
2. 業務執行「取消諮詢（退費）」
3. 系統建立諮詢訂單（訂單類型為「諮詢訂單」、客戶資料來自諮詢單、總額為諮詢費）
4. 系統在諮詢訂單上建立諮詢費的其他費用明細
5. 系統將付款紀錄從諮詢單轉移至諮詢訂單
6. 系統在諮詢訂單上建立退款付款紀錄（金額為負諮詢費、付款方式為退款）
7. 系統依客戶在外部表單選擇的發票時點選項處理發票與折讓：
   - **發票時點 = 立即開立**（issue_now）：先建立退款付款紀錄 → 諮詢訂單推進至「已開發票」並開立發票（金額為諮詢費）→ 同步建立折讓單關聯退款付款紀錄（金額為負諮詢費、原因為諮詢取消），完成發票與退款的會計沖銷
   - **發票時點 = 延後至主訂單**（defer_to_main_order）：諮詢訂單**不開立發票**、亦無折讓單；系統自動標記對帳通過（諮詢訂單應收與已沖銷皆為 0，業務無須額外處理）
8. 諮詢訂單推進至「訂單完成」終態（退費完成）
9. 諮詢單狀態推進至「已取消」終態（不可逆），諮詢訂單關聯欄位寫入新建諮詢訂單 ID
10. 系統寫入活動紀錄（事件描述「諮詢取消退費」+ 業務姓名 + 取消時間 + 諮詢訂單編號 + 退款金額）；折讓單實際撥付沖銷由會計確認
11. 例外處理：若諮詢單已離開「待諮詢」狀態（已轉需求單 / 完成諮詢 / 已取消），系統拒絕本動作並提示「諮詢結束分支已執行，無法退費」

> **擴充議題**：部分退費 / 取消理由記錄 / 退款撥付 SLA 待 [[CR-3-諮詢取消三項擴充議題]] 解答後評估是否補入。

### 成功條件

1. 業務於諮詢單「待諮詢」狀態執行「取消諮詢（退費）」後，系統建立諮詢訂單並完成付款紀錄轉移
2. 諮詢訂單上有兩筆付款紀錄：正值諮詢費（轉移自諮詢單）+ 負值退款；淨額為 0
3. 發票時點為「立即開立」時：諮詢訂單開立諮詢費發票 + 對應金額的折讓單（沖銷退款）；雙方對帳完整
4. 發票時點為「延後至主訂單」時：諮詢訂單**不開立發票**、無折讓單；系統自動標記對帳通過（業務無須額外處理）
5. 諮詢單狀態推進至「已取消」終態不可逆；離開「待諮詟」狀態後系統拒絕重複取消動作；取消動作寫入活動紀錄供事後稽核

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

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢取消觸發建諮詢訂單與退費」L229-275（含三個 Scenario：defer_to_main_order / issue_now / 不可取消）
- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢費發票時間點處理」L287 + L293
- 原 Notion User Story DB `US-CR-006`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 「作為」改為業務（spec L249「業務點擊取消諮詢」；原 Notion 標諮詢角色，但實際執行者是業務）
- 對齊 spec L246-268 補入兩個發票時點子情境：
  - issue_now：開發票 + 折讓單沖銷
  - defer_to_main_order：不開發票、特殊對帳邏輯（應收 = 已沖銷 = 0）
- 對齊 spec L270-275 補入「離開待諮詢狀態後不可取消」例外處理
- 業務流程 step 6 補退款付款紀錄「金額為負諮詢費」業務化描述
- 「不可逆」明示在前置條件與成功條件 5（spec L242「已取消終態」）
- 注意：spec L257 提到 defer_to_main_order 情境下諮詢訂單三方對帳細節參照 [order-management spec § 諮詢取消對帳邏輯]，本 user story 僅描述業務面，對帳實作細節留 order-management 模組
