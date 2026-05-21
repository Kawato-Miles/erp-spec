---
type: user-story
us-id: US-AR-004
module:
  - prepress-review
role:
  - "[[03-roles/審稿主管]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿主管覆寫分配"
  - "[[04-business-logic/審稿分配規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/審稿分配規則]]"
related-entities:
  - "[[05-entities/印件]]"
related-oq:
  - "[[AR-10-主管覆寫分派是否允許破例派工]]"
related-test-cases: []
---

# US-AR-004 覆寫印件分派

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能重新指派已分派但未完成審稿的印件

### 以便
人員異動 / 負擔不均 / 特殊客戶指定時可人工介入調度，避免印件卡關

### 前置條件
- 印件已由系統自動分派審稿員
- 印件尚未完成審稿（未達合格終態）
- 目標審稿員須為在職員工（離職 / 停用員工不出現於可選清單）

### 業務流程

1. 審稿主管查看部門內印件分派狀況
2. 審稿主管挑選一筆或多筆需要轉派的印件（**支援批次選取**）
3. 審稿主管指定新審稿員並填寫轉派原因（如：原審稿員請假 / 負擔過重 / 特殊客戶指定）
4. 系統驗證新審稿員能力門檻：能力門檻策略待 [[AR-10-主管覆寫分派是否允許破例派工]] 解答（spec 現狀為「能力不足時拒絕」，但與自動分派的「破例派工」設計矛盾，須業務拍板統一）
5. 系統執行轉派；活動紀錄詳見 [[04-business-logic/審稿分配規則]] § 稽核軌跡

### 成功條件

1. 已分派但未完成審稿的印件可重新指派給其他在職審稿員（離職員工不出現於可選清單）
2. 系統支援批次選取多筆印件一次覆寫
3. 覆寫必須填寫原因（自由文字；分類選項待後續業務累積後評估）
4. 系統依 [[AR-10-主管覆寫分派是否允許破例派工]] 解答結果驗證能力門檻；驗證通過後執行轉派並寫入活動紀錄（含時間 / 原審稿員 / 新審稿員 / 原因）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/prepress/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5：
  - § Requirement「審稿主管覆寫分配」L88-116（三個 Scenario：合格能力覆寫 / 能力不足拒絕 / reason 必填）
  - § Requirement「印件自動分配機制」L77-86 「能力不足破例派工」（對齊矛盾來源）
- [[04-business-logic/審稿分配規則]]：能力門檻 + 活動紀錄
- 原 Notion User Story DB `US-AR-004`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 75/100，識別 5 gap；senior-pm INVEST 5 PASS / 1 WARN（「我希望」31 字超），4 問題 + 3 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「我希望」31 字超 30 字紅線 | senior-pm 問題 1（high）| 已採納：縮為 17 字「能重新指派已分派但未完成審稿的印件」 |
| 「破例派工」spec 內部不一致（自動允許 vs 覆寫拒絕）| erp-consultant G1（high）+ senior-pm 痛點 1 | 已採納：開 OQ [[AR-10-主管覆寫分派是否允許破例派工]]，業務流程 step 4 + 成功條件 4 引 OQ |
| 批次覆寫流程提到但成功條件未對應 | senior-pm 痛點 2 | 已採納：成功條件 2 補「支援批次選取多筆印件一次覆寫」 |
| 離職員工阻擋 | senior-pm 痛點 3 | 已採納：前置條件 + 成功條件 1 |
| 業務流程 step 5「活動紀錄」屬下游 | senior-pm 問題 4（medium）| 已採納：改 wiki link 引 [[04-business-logic/審稿分配規則]] § 稽核軌跡 |
| 成功條件 1 與業務流程 step 1 重疊 | erp-consultant G4（medium）| 已採納：重構成功條件四條為「可重新指派 / 批次選取 / reason 必填 / 能力門檻 + 活動紀錄」 |
| frontmatter `related-oq` 缺欄位 | erp-consultant G2（medium）| 已採納：補 [[AR-10]] |
| 「以便」量化 | senior-pm 問題 2（medium）| **部分採納**：以便改為更具體業務情境描述，量化基準（卡關天數）待業務累積數據 |
| 覆寫原因採 LOV 分類（如「請假 / 負擔 / 客戶指定 / 其他」）| erp-consultant 段 4 設計模式對照「狀態碼結構化」| **未採納為強制**：成功條件 3 保留自由文字；分類選項待業務累積後評估（避免過早結構化） |
