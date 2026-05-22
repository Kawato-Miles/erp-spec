---
type: user-story
us-id: US-ORD-011
module:
  - order-management
  - work-order
  - production-task
role:
  - "[[03-roles/業務]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單取消流程"
  - "openspec/specs/order-management/spec.md#Requirement: 退款 Payment 與折讓分離（先記退款，再開折讓）"
related-spec: openspec/specs/order-management/spec.md
related-scenarios:
  - "[[07-scenarios/README]]"
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
  - "[[05-entities/工單]]"
  - "[[05-entities/生產任務]]"
related-oq: []
related-test-cases: []
---

# US-ORD-011 訂單取消與退款

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於任意狀態取消訂單並依退款流程完成退款

### 以便
正式終止訂單並處理客戶退款，確保相關工單與生產任務同步終止避免製作浪費

### 前置條件
- 訂單存在（任何狀態均可操作）
- 業務為訂單擁有者或職務代理人

### 業務流程

1. 業務於訂單詳情執行「取消訂單」
2. 訂單狀態轉「已取消」終態（不可逆）
3. 系統自動 top-down 連鎖終止下游：
   - 所屬工單全數轉「已取消」
   - 工單下任務全數轉「已作廢」
   - 任務下生產任務分兩類處理：
     - 尚未進入生產的生產任務 → 轉「已作廢」
     - 已進入生產的生產任務 → 轉「報廢」（成本依已報工數量計算）
4. 若需退款（已收款訂單）：
   - 業務發起退款申請（狀態：退款申請）
   - 會計執行退款處理（狀態：退款處理中）
   - 完成銀行撥款後標記「已退款」
5. 系統依發票狀態處理折讓單：
   - 已開立發票 → 系統建立折讓單關聯退款付款紀錄（先記退款再開折讓）
   - 未開立發票 → 不需建立折讓單
6. 系統寫入活動紀錄（取消操作者 + 時間 + 連鎖終止的下游清單）

### 成功條件

1. 訂單可於任意狀態取消，取消後狀態為「已取消」終態**不可逆**
2. 系統自動 top-down 連鎖終止：工單 → 任務 → 生產任務（依生產進度分流「已作廢」/「報廢」）
3. 退款流程三個狀態（退款申請 → 退款處理中 → 已退款）依序推進
4. 已開發票的訂單取消時自動建立折讓單關聯退款付款紀錄
5. 取消動作與連鎖終止的下游清單寫入活動紀錄供事後稽核

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單取消流程」L204+ + § Requirement「退款 Payment 與折讓分離（先記退款，再開折讓）」L1159+
- 原 Notion User Story DB `US-ORD-011`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單取消流程完整 top-down 連鎖（工單 / 任務 / 生產任務三層）
- 生產任務分流：尚未進入生產 → 已作廢；已進入生產 → 報廢（成本依已報工數量計算）
- 對齊 spec § 退款 Payment 與折讓分離（先記退款，再開折讓）
- 退款三狀態流程：退款申請 → 退款處理中 → 已退款
- 邊界：本卡涵蓋業務發起取消 + 連鎖終止業務情境；折讓單實作細節 / 退款 Payment 資料模型由訂單 spec 各對應 Requirement 處理
