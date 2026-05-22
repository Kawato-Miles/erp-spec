---
type: user-story
us-id: US-CR-003
module:
  - consultation-request
role:
  - "[[03-roles/諮詢]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢人員筆記欄位"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢單列表與檢視"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢單活動紀錄"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
related-oq:
  - "[[CR-2-consultation_topic欄位定位]]"
related-test-cases: []
prerequisites:
  - "[[US-CR-002-諮詢人員認領諮詢單]] 或 [[US-CR-001-諮詢單自動建立]]：諮詢單已認領（含已分派）"
---

# US-CR-003 編輯諮詢內容與追蹤進度

## 業務情境（穩定層）

### 作為
[[03-roles/諮詢]]

### 我希望
能編輯諮詢備註並於活動紀錄追蹤異動

### 以便
諮詢過程有結構化紀錄，跨人交接時接手者可看到歷次備註與變更脈絡

### 前置條件
- 諮詢人員已認領諮詢單（[[US-CR-002-諮詢人員認領諮詢單]]）
- 諮詢單詳情頁可檢視客戶原始填寫的 14 表單欄位（唯讀）

### 業務流程

1. 諮詢人員開啟諮詢單詳情頁
2. 諮詢人員查看客戶原始填寫的 14 表單欄位（唯讀呈現，不可竄改，含客戶原話 `consultation_topic`）
3. 諮詢人員與客戶溝通後，於 `consultant_note` 欄位（諮詢人員筆記，獨立於客戶原話 `consultation_topic` 的雙欄位設計）記錄討論內容
4. `consultant_note` 可隨時編輯（諮詢人員自由編修；終態後鎖定）
5. 系統將 `consultant_note` 的每次儲存寫入活動紀錄「諮詢備註修改」事件，含**變更前 / 變更後內容**供事後查核
6. 跨人交接情境：接手者開啟諮詢單詳情時，可看到歷次 `consultant_note` 變更與操作者紀錄，理解前一位諮詢人員的脈絡

> **CR-2 已 closed（2026-05-22）**：拍板雙欄位設計 — 客戶原話 `consultation_topic` 唯讀，諮詢人員填寫 `consultant_note`（最長 2000 字，非必填，每次編輯寫 ActivityLog from/to）。本卡業務流程已對齊。詳見 [[CR-2-consultation_topic欄位定位]]。

### 成功條件

1. 諮詢人員可於諮詢單詳情編輯 `consultant_note`（自由文字、最長 2000 字、可多次儲存；終態後鎖定）
2. 客戶原始填寫的 14 表單欄位以唯讀方式呈現（含客戶原話 `consultation_topic`），諮詢人員不可竄改
3. `consultant_note` 每次編輯儲存自動寫入活動紀錄「諮詢備註修改」事件，含時間 / 操作者 / **變更前內容 / 變更後內容**
4. 諮詢單狀態轉移（如：分派 / 完成諮詢 / 取消）皆寫入活動紀錄，跨人交接可完整追溯
5. 同模組諮詢人員可互相查閱活動紀錄（含備註變更前後內容），達跨人交接目的

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

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢人員筆記欄位」（2026-05-22 resolve-consultation-request-gaps-cr-1-cr-2 archive 新增） + § Requirement「諮詢單列表與檢視」 + § Requirement「諮詢單活動紀錄」
- 原 Notion User Story DB `US-CR-003`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

對齊 spec § 諮詢單列表與檢視 + § 諮詢單活動紀錄補入：14 表單唯讀呈現 + 狀態轉移皆寫入活動紀錄。

### 第二輪（2026-05-22 v3，雙視角審查後）

erp-consultant 70% + senior-pm INVEST 5 PASS / 1 WARN，整合：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| consultation_topic 客戶原始填寫 vs 諮詢備註編輯衝突 | erp-consultant G1（high）| 已採納：開 OQ [[CR-2-consultation_topic欄位定位]]，業務流程 step 4 引 OQ；前置條件補 14 表單唯讀（包含 consultation_topic） |
| 活動紀錄缺 from/to diff | erp-consultant G2（medium）| 已採納：業務流程 step 5 + 成功條件 3「變更前內容 / 變更後內容」 |
| 跨人交接情境具體場景 | erp-consultant G3 | 已採納：業務流程 step 6 補「接手者可看到歷次備註與操作者紀錄」 |
| 權限邊界（其他諮詢員可見否）| senior-pm 問題 2 | 已採納：成功條件 5「同模組諮詢人員可互相查閱」 |
| 「我希望」拆 US（檢視 vs 編輯）| senior-pm 問題 1 | **未採納**：保持單卡（將 14 欄位唯讀降為前置條件 + 「我希望」聚焦編輯動作），符合 user-story-spec § 五「單一動作」紀律 |

### 第三輪（2026-05-22 v4，CR-2 closed 後同步）

[[CR-2-consultation_topic欄位定位]] 拍板雙欄位設計（2026-05-22）— 客戶原話 `consultation_topic` 唯讀 + 諮詢人員填寫 `consultant_note`。本卡同步：

| 修正項 | 處理 |
|--------|------|
| frontmatter `source` 補 Requirement「諮詢人員筆記欄位」（spec ADDED）| 已採納 |
| 業務流程 step 3「諮詢備註欄位」→「`consultant_note` 欄位（諮詢人員筆記）」明示雙欄位設計 | 已採納 |
| 業務流程 step 4「待 CR-2 解答」措辭移除 + 補 CR-2 closed 結果 | 已採納 |
| 業務流程 step 4 補「終態後鎖定」（對齊 spec ADDED Requirement Scenario）| 已採納 |
| 業務流程 step 5 補 ActivityLog 事件名稱「諮詢備註修改」| 已採納 |
| 業務流程 step 2 加註客戶原話 `consultation_topic` 也在唯讀範圍 | 已採納 |
| 成功條件 1 補「最長 2000 字」+「終態後鎖定」| 已採納 |
| 成功條件 2 補「含客戶原話 consultation_topic」| 已採納 |
| 成功條件 3 補 ActivityLog 事件名稱「諮詢備註修改」| 已採納 |
| `resolve-consultation-request-gaps-cr-1-cr-2` 引用 | 已採納：來源段補新 Requirement 演變說明 |
