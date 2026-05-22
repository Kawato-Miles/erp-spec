---
type: user-story
us-id: US-CR-001
module:
  - consultation-request
role:
  - "[[03-roles/業務]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢費付款成功觸發自動建單"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢人員指派"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 15：諮詢單自動建立 webhook 串接（跨系統跨角色）]]"
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
prerequisites:
  - "客戶完成 surveycake 表單付款（系統外動作）"
  - "金流平台 webhook 通道正常 + 系統自動建單機制完成（屬系統行為，詳見 spec § 諮詢費付款成功觸發自動建單 L69-95）"
related-oq:
  - "[[CR-1-諮詢分派模式自派他派或混合]]"
related-test-cases: []
---

# US-CR-001 業務查看並指派新諮詢單

> **重寫紀錄（2026-05-22）**：原卡名「諮詢單自動建立」描述系統自動建單行為，**不是 user story 性質**（無使用者動作）；依新「禁 anchor 故事 + user story 單角色單動作」紀律重新定位為「業務查看並指派新諮詢單」（業務動作）。系統自動建單機制（webhook 串接）作為 prerequisites 列出，端到端流程由 07-scenarios 補情境 15。

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]（值班業務）

### 我希望
能於待指派清單查看新諮詢單並指派諮詢人員

### 以便
新進諮詢單即時分派給合適的諮詢人員，避免案件積壓影響客戶體驗

### 前置條件
- 諮詢單已由系統 webhook 自動建立（狀態為「待諮詢」+ 尚未指派 consultant_id）
- 業務角色已登入系統

### 業務流程

1. 業務於待指派諮詢單清單看到新建立的諮詢單（系統 webhook 完成建單後自動出現）
2. 業務查看諮詢單內容（14 表單欄位 + 諮詢費收款紀錄）以判斷適合的諮詢人員
3. 業務依諮詢人員專長 / 負載指派 consultant_id
4. 系統將 consultant_id 寫入諮詢單；諮詢單狀態仍維持「待諮詢」（依 v2 簡化僅標示已分派）
5. 系統寫入活動紀錄（事件描述：指派諮詢人員 + 業務姓名 + 諮詢人員姓名 + 時間）
6. 系統通知被指派的諮詢人員

> **分派模式議題**：本卡描述「值班業務指派」模式（他派）；[[US-CR-002-諮詢人員認領諮詢單]] 描述「諮詢人員自行認領」模式（自派）。實務上採他派 / 自派 / 混合的決定待 [[CR-1-諮詢分派模式自派他派或混合]] 解答後同步調整。

### 成功條件

1. 業務於待指派清單可看到所有「待諮詢」且尚未指派的諮詢單
2. 業務可選擇諮詢人員指派 consultant_id，系統將值寫入諮詢單
3. 指派動作留活動紀錄（業務姓名 / 諮詢人員姓名 / 時間）
4. 被指派的諮詢人員即時收到通知

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

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢人員指派」L98-110（業務指派路徑）
- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢費付款成功觸發自動建單」L69-95（系統 webhook 行為，作為前置條件）
- 原 Notion User Story DB `US-CR-001`（2026-05-22 重寫；原描述系統行為改為業務動作視角）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

依 Notion 原內容寫為「諮詢單自動建立」描述 webhook 自動建單流程。

### 第二輪（2026-05-22 v3，雙視角審查後）

senior-pm 建議「作為」改值班業務（受益者視角）+ 移除下游連鎖反應。

### 第三輪（2026-05-22 v4，「禁 anchor + 單角色單動作」紀律演化後）

**重寫定位**：senior-pm v3 建議的「受益者視角」其實還是混淆「系統行為描述」與「user story」。新紀律明示：
- user story **MUST** 描述單一角色的單一動作
- 系統行為（webhook 自動建單）不入 user story，作為 prerequisites
- 跨多角色情境（客戶 → 金流 → 系統 → 業務）由 07-scenarios 處理

修正動作：
| 修正項 | 處理 |
|--------|------|
| 卡名從「諮詢單自動建立」改為「業務查看並指派新諮詢單」 | 已採納：聚焦業務動作，系統建單行為移至 prerequisites |
| 「我希望」聚焦業務動作（指派諮詢人員）| 已採納：「能於待指派清單查看新諮詢單並指派諮詢人員」單一動作 |
| 業務流程移除客戶 / 金流平台 / 系統等其他角色動作 | 已採納：只描述業務動作（查看 → 指派）；系統自動建單機制列前置條件 |
| webhook 異動偵測例外處理 | 已採納：移至 prerequisites 描述（屬系統健全性，非業務 user story 範疇） |
| 新增 frontmatter `prerequisites` 欄位 | 已採納（紀律演化示範） |
| 端到端流程（客戶 → webhook → 業務指派）對應的跨角色情境 | 待補：07-scenarios 補情境 15「諮詢單自動建立 webhook 串接」（本次未做，待 Miles 確認後補入；目前 related-scenarios 暫標 placeholder）|
