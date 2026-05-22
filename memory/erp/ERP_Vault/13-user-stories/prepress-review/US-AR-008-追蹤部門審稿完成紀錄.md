---
type: user-story
us-id: US-AR-008
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
  - "openspec/specs/prepress-review/spec.md#Requirement: 對帳場景場景的資料可得性"
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿總覽時間區間篩選與 Summary Bar"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "審稿主管已登入系統"
  - "部門已有歷史審稿輪次紀錄"
---

# US-AR-008 追蹤部門審稿完成紀錄

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能依時間區間 + 審稿員 + 狀態查詢部門已完成審稿清單

### 以便
跨部門對帳（如印務反映收單數與審稿合格數不一致）時可在 5 分鐘內調出具體印件清單釐清責任，取代過去散落在即時通訊軟體的口頭爭執

### 前置條件
- 審稿主管已登入系統

### 業務流程

1. 審稿主管選擇要查詢的時間範圍（如本週、本月、自訂區間）
2. 審稿主管選擇要查詢的審稿員（單人或全部）
3. 審稿主管選擇要查詢的狀態（合格 / 不合格 / 取消）
4. 系統列出符合條件的印件清單（含印件編號 / 訂單編號 / 客戶名稱 / 合格時間），頂部摘要顯示「待處理 N / 合格 N / 不合格 N」三聚合數字（隨篩選條件即時重算）
5. 跨部門對帳時，審稿主管可調出具體印件紀錄供討論；每筆印件可進入印件詳情查歷史輪次（檔案 / 結果 / 退件原因 / 備註 / 時間），含 ReviewRound 活動紀錄供責任釐清

### 成功條件

1. 審稿主管可依時間區間查詢部門已完成審稿清單
2. 審稿主管可依審稿員（單人或全部）查詢
3. 審稿主管可依狀態（合格 / 不合格 / 取消）查詢
4. 查詢結果含印件清單（印件編號 / 訂單編號 / 客戶名稱 / 合格時間）+ 頂部摘要「待處理 N / 合格 N / 不合格 N」三聚合（隨篩選即時重算）
5. 每筆印件可追溯原始審稿紀錄（檔案 / 輪次 / 結果 / 退件原因 / 備註 + ReviewRound 活動紀錄）

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
  - § Requirement「對帳場景場景的資料可得性」L638-655（主要 spec；對帳情境 + 印件清單欄位）
  - § Requirement「審稿總覽時間區間篩選與 Summary Bar」L530-576（聚合數字計算）
- [[04-business-logic/稿件管理規則]]：審稿輪次資料模型 + 活動紀錄
- 原 Notion User Story DB `US-AR-008`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 8/10，識別 6 gap；senior-pm INVEST 4 PASS / 2 WARN，3 問題 + 3 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 對帳明細補具體欄位（spec L654：印件編號 / 訂單編號 / 客戶名稱 / 合格時間）| erp-consultant G1（high）| 已採納：業務流程 step 4 + 成功條件 4 |
| 補 Summary Bar 聚合（spec L545-549：待處理 / 合格 / 不合格 + 隨篩選即時重算）| erp-consultant G2 + senior-pm 問題 3（medium）| 已採納 |
| 成功條件 1 違反單一可驗證原則 | senior-pm 問題 1（high）| 已採納：拆三條（時間區間 / 審稿員 / 狀態） |
| 「以便」量化 | senior-pm 問題 2（medium）| 已採納：補「5 分鐘內調出具體印件清單釐清責任」 |
| 補 ReviewRound 活動紀錄稽核（跨部門爭議常需查「誰何時改了什麼備註」）| erp-consultant 段 4 設計模式對照「稽核鉤子」| 已採納：成功條件 5 補「ReviewRound 活動紀錄」 |
| 業務流程 step 4「總筆數摘要」措辭模糊 | erp-consultant G3 + senior-pm 問題 3（medium）| 已採納：改為「待處理 N / 合格 N / 不合格 N 三聚合」 |
| frontmatter `related-business-logic` 空 | erp-consultant G4 + senior-pm 問題 4（low）| 已採納：補 [[04-business-logic/稿件管理規則]] |
| source 補 spec anchor | erp-consultant G6（low）| 已採納 |
| 對帳結果系統留痕 | senior-pm 痛點 1 | **未採納為強制**：屬下游 dashboard 進階功能；現階段不入本 US，事後追溯靠 ReviewRound 活動紀錄即可 |
| 匯出 / 列印對帳清單 | senior-pm 痛點 2 | **未採納**：屬實作層需求，由 Prototype 階段定案 |
| 查詢維度擴張（印件類型 / 客戶分群）| erp-consultant 段 3 建議 5 | **未採納**：對帳場景驅動三維度已足夠，過度擴張屬 scope creep |
