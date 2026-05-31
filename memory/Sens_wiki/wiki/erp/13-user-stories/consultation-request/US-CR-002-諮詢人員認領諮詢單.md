---
type: user-story
us-id: US-CR-002
module:
  - consultation-request
role:
  - "[[諮詢]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢人員認領"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[諮詢單]]"
related-oq:
  - "[[CR-1-諮詢分派模式自派他派或混合]]"
related-test-cases: []
prerequisites:
  - "[[US-CR-001-諮詢單自動建立]]：諮詢單為「待諮詢」+ 尚未認領 consultant_id"
  - 諮詢人員已登入系統
---

# US-CR-002 諮詢人員認領諮詢單

## 業務情境

### 作為
[[諮詢]]

### 我希望
能於諮詢單清單自行認領未指派的諮詢單

### 以便
沿用既有分流不需自動派工，諮詢可依專長與當前負載自主接案

### 前置條件
- 諮詢單狀態為「待諮詢」且尚未指派負責人
- 諮詢人員已登入系統

### 業務流程

1. 諮詢人員查看待認領諮詢單清單（顯示各諮詢員當前在處理數，供負載判斷）
2. 諮詢人員依專長與當前負載選擇要認領的諮詢單
3. 系統將諮詢人員寫入諮詢單的負責人欄位（諮詢人員代號）
4. 諮詢單狀態仍維持「待諮詢」，僅標示已分派；活動紀錄寫入「諮詢人員認領」事件
5. 系統通知被認領的諮詢人員（自我認領為確認通知；主管代為認領時通知被指派的諮詢人員）

> **CR-1 已 closed（2026-05-22）**：拍板純自派模式 — 諮詢人員自我認領為主路徑；保留主管代為認領彈性。本卡業務流程已對齊。詳見 [[CR-1-諮詢分派模式自派他派或混合]]。

### 成功條件

1. 諮詢人員可看到所有「待諮詢」且未指派的諮詢單清單，含各諮詢員當前負載資訊
2. 認領後系統將諮詢人員寫入諮詢單負責人欄位，狀態維持「待諮詢」（不轉「諮詢中」過渡狀態，依 spec v2 簡化）
3. 認領動作留活動紀錄（人員姓名 / 時間）供事後追蹤
4. 並發認領衝突處理：同一諮詢單同時被兩人認領時，僅一人成功，其餘提示「已被認領」
5. 已認領的諮詢單於清單區隔顯示為「我負責的諮詢」與「其他諮詢員負責」，避免重複認領

## 來源（provenance）

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢人員認領」（2026-05-22 resolve-consultation-request-gaps-cr-1-cr-2 archive 後，原 Requirement「諮詢人員指派」已 REMOVED）
- 原 Notion User Story DB `US-CR-002`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

對齊 spec L98-110 補入：「狀態維持待諮詢、僅標示已分派」（v2 簡化移除「諮詢中」過渡狀態）+ 活動紀錄「指派諮詢人員」事件描述。

### 第二輪（2026-05-22 v3，雙視角審查後）

erp-consultant 85% + senior-pm INVEST 4 PASS / 1 WARN，整合：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| spec 他派 vs US 自派業務模式衝突 | erp-consultant G1 + senior-pm 問題 1（high）| 已採納：開 OQ [[CR-1-諮詢分派模式自派他派或混合]]，業務流程加註說明 |
| 補負載均衡資訊（清單顯示當前在處理數）| senior-pm 問題 3 / 痛點 | 已採納：業務流程 step 1 + 成功條件 1 |
| 補並發認領衝突處理 | senior-pm 問題 4 | 已採納：成功條件 4 |
| 反悔轉派需新 US | senior-pm 問題 2 | **未採納為強制**：屬下游動作，需新增 US 待 CR-1 解答後評估 |
| Slack 通知通道未明示 | erp-consultant G3 | **未採納為強制**：屬實作層通道選擇，業務情境段保持「系統通知」泛指 |
| 諮詢主管視角缺席（強制指派權限）| senior-pm 痛點 | **暫不採納**：屬 CR-1 解答後一併處理（若選混合模式則需主管視角 US） |

### 第三輪（2026-05-22 v4，CR-1 closed 後同步）

[[CR-1-諮詢分派模式自派他派或混合]] 拍板純自派（2026-05-22）。本卡同步：

| 修正項 | 處理 |
|--------|------|
| frontmatter `source` Requirement 名稱「諮詢人員指派」→「諮詢人員認領」（spec REMOVED 後改 ADDED）| 已採納 |
| 業務流程 step 4 ActivityLog 事件描述「指派諮詢人員」→「諮詢人員認領」| 已採納 |
| 業務流程 step 5 通知對象描述加註「自我認領 / 主管代為認領」兩種通知情境 | 已採納 |
| 業務流程後「分派模式議題」段移除 + 補 CR-1 closed 結果 | 已採納 |
| frontmatter prerequisites「尚未指派」→「尚未認領」措辭對齊 | 已採納 |
| 主管代為認領 Scenario 是否需展開為獨立 US | **未採納為強制**：主管代為認領視為「特殊認領」共用本 US 業務情境，spec ADDED「諮詢人員認領」Requirement 已含主管代為認領 Scenario |
| `resolve-consultation-request-gaps-cr-1-cr-2` 引用 | 已採納：來源段補 archive 後 Requirement 演變說明 |
