---
type: user-story
us-id: US-ORD-003
module:
  - 訂單管理
role:
  - "[[業務]]"
priority: high
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單確認觸發"
  - "openspec/specs/order-management/spec.md#Requirement: OrderSignedFile 訂單回簽附件"
  - "openspec/changes/archive/2026-05-28-relax-order-detail-edit-conditions#Requirement: OrderSignedFile 訂單回簽附件（上傳時機放寬 v1.13）"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 訂單未取消（status ≠ 已取消）；首次推進情境另需訂單狀態為「報價待回簽」且無既有回簽檔案
  - 客戶已透過外部管道送回回簽紙本 / 電子檔
---

# US-ORD-003 業務上傳回簽檔案

## 業務情境

### 作為
[[業務]]

### 我希望
能上傳客戶回簽檔案（首次觸發訂單推進，後續可追加保存供追溯）

### 以便
訂單狀態反映客戶正式同意，觸發後續工單建立與製作流程

### 前置條件
- 訂單未取消（status ≠ 已取消）
- 首次上傳觸發狀態推進的前置：訂單狀態為「報價待回簽」（已執行 [[US-ORD-002-業務送出報價單給客戶]]）且尚無回簽檔案
- 追加上傳的前置：訂單未取消且已有回簽檔案
- 客戶已透過外部管道將回簽紙本 / 電子檔送回業務

### 業務流程

1. 業務收到客戶回簽（紙本掃描 / 電子簽署檔）
2. 業務於訂單詳情上傳回簽檔案（OrderSignedFile）
3. 若為首次上傳且訂單處於「報價待回簽」，系統自動推進訂單狀態（依正常 / 免審稿快速路徑）並寫入回簽時間（signed_at）
4. 若為追加上傳（已有回簽檔案），系統以 append 方式新增檔案紀錄，不重複推進狀態、不覆寫回簽時間
5. 系統寫入活動紀錄（含上傳操作者 / 時間戳 / 檔案名稱），所有情境皆寫活動紀錄

### 成功條件

1. 訂單未取消（status ≠ 已取消）時業務皆可上傳回簽檔案；已取消訂單上傳入口停用
2. 僅首次於「報價待回簽」狀態上傳時自動推進訂單狀態並寫入回簽時間（signed_at）；後續追加上傳不重複推進、不覆寫回簽時間
3. 回簽檔案保留於訂單供事後追溯（含上傳時間、操作者）
4. 活動紀錄留上傳事件供稽核
5. 訂單已取消時禁止上傳回簽檔案（上傳入口停用）

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單確認觸發」L108+ + § Requirement「OrderSignedFile 訂單回簽附件」L2133+
- 原 Notion User Story DB `US-ORD-003`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單確認觸發「上傳回簽 → 已回簽」自動推進
- 對齊 spec § OrderSignedFile 補檔案保留 / 追溯
- 邊界：上游 [[US-ORD-002]] 送出報價；下游進入工單建立流程（不在本卡）

### 第二輪（2026-06-03，對齊 2026-05-28-relax-order-detail-edit-conditions change）

- 上傳時機放寬：由「限報價待回簽」改為「訂單未取消（status ≠ 已取消）皆可上傳」
- 狀態推進收斂：僅首次於「報價待回簽」上傳觸發推進並寫入 signed_at；追加上傳以 append 新增、不重複推進、不覆寫回簽時間
- 補守衛型成功條件：已取消訂單禁止上傳（入口停用）
- 前置條件區分首次推進情境與追加上傳情境
