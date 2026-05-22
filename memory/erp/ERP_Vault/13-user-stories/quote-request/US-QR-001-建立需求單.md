---
type: user-story
us-id: US-QR-001
module:
  - quote-request
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 需求單建立與編輯"
  - "openspec/specs/quote-request/spec.md#Requirement: 帳務公司自動推導"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/報價邏輯]]"
related-entities:
  - "[[05-entities/需求單]]"
related-oq: []
related-test-cases: []
---

# US-QR-001 建立需求單

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於系統建立需求單並填寫客戶需求規格

### 以便
客戶詢價的業務機會集中管理，後續成交分析與工單建立流程連動

### 前置條件
- 客戶有詢價需求
- 業務已登入系統

### 業務流程

1. 業務於系統建立新需求單，填入客戶資料、印件項目、規格、報價條件、接單公司
2. 系統依接單公司自動推導帳務公司（依 § 帳務公司自動推導規則，業務不可手動覆寫）
3. 業務指定評估印務主管（限印務主管角色的用戶）
4. 業務送印務評估，系統將需求單狀態推進為「待評估成本」
5. 系統通知指定評估印務主管（含案名 / 客戶 / 業務 / 接單公司 / 帳務公司 / Slack 討論串連結；詳見 [[US-QR-005-待評估報價通知]]）
6. 系統寫入活動紀錄（事件描述：需求單建立、送印務評估）

### 成功條件

1. 業務可建立需求單並填入客戶資料 / 印件規格 / 接單公司；系統自動推導帳務公司（業務介面不顯示帳務公司選項，依 v3.2 簡化設計）
2. 業務指定的評估印務主管限定為具印務主管角色的用戶
3. 送印務評估後需求單狀態推進為「待評估成本」，指定印務主管可於待辦清單看到此需求單
4. 系統發送通知含案名 / 客戶 / 業務 / 接單公司 / 帳務公司 / 連結
5. 需求單建立與送印務評估動作皆寫入活動紀錄供事後稽核

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/quote/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「需求單建立與編輯」L21-44 + § Requirement「帳務公司自動推導」L376+
- [[04-business-logic/報價邏輯]]
- 原 Notion User Story DB `US-QR-001`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L21-44 補入帳務公司自動推導設計（v3.2 simplify-quote-billing-company-mapping 歸檔變更）
- 對齊 spec L127-132 補入評估印務主管角色限定
- 對齊 spec L38 補入 Slack 通知內容（案名 / 客戶 / 業務 / 公司 / 連結）
- 補活動紀錄事件
- 與 [[US-QR-005-待評估報價通知]] 邊界：本卡涵蓋建單到送評估的業務動作；通知細節（Slack thread / 回寫 URL）由 QR-005 處理
- 與 [[US-QR-012-設定評估印務主管]] 邊界：本卡 step 3 簡述指定動作；QR-012 涵蓋指定後欄位 lifecycle（鎖定不可改）細節
