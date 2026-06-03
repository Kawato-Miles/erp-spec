---
type: user-story
us-id: US-ORD-005
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單建立"
  - "openspec/specs/order-management/spec.md#Requirement: 帳務公司管理（BillingCompany）"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單詳情頁編輯型 Section 統一編輯時機與角色"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 訂單已成立
  - 訂單未取消（order.status ≠ 已取消）即可編輯，訂單完成後仍可編輯
  - 業務為訂單擁有者或職務代理人（角色權限對齊 user-roles 粗粒度模組權限：業務 / 諮詢 / 訂單管理人可編輯；Supervisor / 會計唯讀；業務主管無權）
---

# US-ORD-005 訂單發票與配送資訊編輯

## 業務情境

### 作為
[[業務]]

### 我希望
能編輯訂單的開票資訊與出貨資訊

### 以便
開票與出貨資訊與訂單關聯統一管理，後續開立發票 / 配送自動帶入正確資訊

### 前置條件
- 訂單已成立
- 訂單未取消（order.status ≠ 已取消）即可編輯，訂單完成後仍可編輯
- 業務為訂單擁有者或職務代理人（角色權限對齊 user-roles 粗粒度模組權限：業務 / 諮詢 / 訂單管理人可編輯；Supervisor / 會計唯讀；業務主管無權）

### 業務流程

1. 訂單未取消時，業務於訂單詳情查看並可編輯開票資訊與出貨資訊兩個獨立區塊（發票 / 出貨資訊不涉及金額異動，於 Section 內直接編輯，無須走訂單異動 Tab）
2. 業務編輯開票相關欄位：開票公司 / 抬頭 / 統編 / 地址
3. 業務編輯出貨相關欄位：出貨地址 / 出貨方式 / 預計出貨日
4. 系統寫入活動紀錄（事件描述：發票資訊變更 / 出貨資訊變更 + 變更前 / 變更後內容）
5. 後續開立發票自動帶入開票公司 / 抬頭 / 統編 / 地址；後續建立出貨單自動帶入出貨地址 / 方式 / 預計日

### 成功條件

1. 開票公司 / 抬頭 / 統編 / 地址可獨立編輯（不互相連動，業務可分別維護）
2. 出貨地址 / 方式 / 預計出貨日可獨立編輯
3. 變更於活動紀錄留痕（含變更前 / 變更後內容）
4. 後續開立發票 / 建立出貨單時自動帶入對應資訊
5. 訂單未取消時 4 個編輯型 Section（含本卡的發票設定 / 出貨資訊）編輯啟用，訂單完成後仍可編輯（取代既有製作前 + completed_at 雙閘門控）
6. 訂單已取消時編輯停用並提示「訂單已取消，無法編輯」，內容仍以唯讀顯示
7. Supervisor 與會計檢視訂單詳情時，發票設定 / 出貨資訊 Section 為唯讀（編輯停用），對齊 user-roles 粗粒度權限

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單建立」L21+ + § Requirement「帳務公司管理（BillingCompany）」L791+
- 原 Notion User Story DB `US-ORD-005`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單建立 + § 帳務公司管理
- 補活動紀錄變更前後 diff
- 邊界：發票實際開立由 § Invoice 流程處理（不在本卡）；出貨單實際建立由出貨模組處理（不在本卡）

### 第二輪（2026-05-28，relax-order-detail-edit-conditions 對齊）

- 統一編輯時機改為「訂單未取消即可編輯」（取代製作前 + completed_at 雙閘門控）
- 補已取消唯讀守衛成功條件
- 角色權限對齊 user-roles 粗粒度（Supervisor / 會計唯讀、業務主管無權）
- 移除製作後「需走訂單異動」引導
