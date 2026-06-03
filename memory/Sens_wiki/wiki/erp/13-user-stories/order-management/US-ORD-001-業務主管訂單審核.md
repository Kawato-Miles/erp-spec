---
type: user-story
us-id: US-ORD-001
module:
  - order-management
role:
  - "[[業務主管]]"
priority: high
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 業務主管核准訂單"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單業務主管審核欄位"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 業務於需求單成交「轉訂單」後訂單以草稿為初始狀態，業務於草稿態調整帶入內容後點「送主管審核」推進至「待業務主管審核」
  - 訂單狀態為「待業務主管審核」
  - 業務主管（approved_by_sales_manager_id）於草稿建立時即自動指派為該訂單指定審核人
---

# US-ORD-001 業務主管訂單審核

## 業務情境

### 作為
[[業務主管]]

### 我希望
能於訂單審核清單看到待審訂單並核可（不核可時改走 Slack thread 與業務討論，不於 ERP 內退回）

### 以便
訂單內容正確才提供給客戶，避免錯誤報價外流造成內部爭議或公司損失

### 前置條件
- 業務於需求單成交「轉訂單」後訂單以草稿為初始狀態，業務於草稿態調整帶入內容後點「送主管審核」推進至「待業務主管審核」
- 訂單狀態為「待業務主管審核」
- 業務主管（approved_by_sales_manager_id）於草稿建立時即自動指派為該訂單指定審核人

### 業務流程

1. 業務主管於訂單審核清單看到所有狀態為「待業務主管審核」的訂單
2. 業務主管進入訂單詳情檢視印件規格 / 金額 / 付款條件 / 客戶資料
3. 業務主管依檢視結果執行：
   - **核可**：訂單狀態推進至「審核通過」，業務可繼續推進送出報價單流程（[[US-ORD-002-業務送出報價單給客戶]]）
   - **不核可**：業務主管不於 ERP 內按退回鈕，訂單維持「待業務主管審核」，業務主管透過 Slack thread 與業務討論、業務修正後等主管再次審視
4. 系統寫入活動紀錄（事件描述：核准訂單（成交條件審核）+ 業務主管姓名 + 時間）

### 成功條件

1. 業務主管可看到所有狀態為「待業務主管審核」的訂單（不限於自己建立的）
2. 核可後訂單狀態推進至「審核通過」，業務可繼續推進
3. 不核可時訂單維持「待業務主管審核」（無退回草稿動作）；業務主管透過 Slack thread 與業務討論，業務修正後等待主管再次審視
4. 核可動作寫入活動紀錄供事後稽核
5. 訂單進入「審核通過」後，收款條件備註（payment_terms_note）與審核業務主管（approved_by_sales_manager_id）鎖定為唯讀，不得被直接竄改

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「業務主管核准訂單」L684+ + § Requirement「訂單業務主管審核欄位」L653+
- 原 Notion User Story DB `US-ORD-001`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 業務主管核准訂單核可 / 退回流程
- 補活動紀錄事件
- 與 [[US-QR-002-管理需求單進度]] 差異：需求單議價中業務直接推進不需業務主管核可；訂單階段才有業務主管 gate

### 第二輪（2026-06-03，對齊 2026-06-01-align-business-consultation-coverage-gaps change）

- 線下訂單以「草稿」為初始狀態，業務於草稿態調整帶入內容後送主管審核，推進至「待業務主管審核」
- 草稿建立時自動指派審核業務主管（approved_by_sales_manager_id）
- 核可後推進「審核通過」（保留既有）
- 進入「審核通過」後 payment_terms_note 與 approved_by_sales_manager_id 鎖定為唯讀（新增守衛型成功條件）
- 移除退回機制：不核可時不於 ERP 內按退回鈕、訂單維持「待業務主管審核」，改透過 Slack thread 與業務討論
