---
type: user-story
us-id: US-QR-007
module:
  - quote-request
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 成交轉訂單"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/需求單]]"
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
---

# US-QR-007 需求單成交轉訂單

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
成交後能一鍵將需求單轉為訂單並自動帶入客戶 / 業務 / 印件資料

### 以便
省去重複輸入客戶與印件規格，且訂單建立流程連動報價結果

### 前置條件
- 需求單狀態為「成交」
- 業務為需求單擁有者或職務代理人

### 業務流程

1. 業務於需求單詳情執行「轉建訂單」
2. 系統建立新訂單並自動帶入：
   - 客戶資料（接單公司 / 帳務公司 / 統編 / 聯絡人等）
   - 業務（沿用需求單擁有者作為訂單負責業務）
   - 印件項目與規格（從需求單印件對應建立訂單印件，含預計產線）
   - 報價結果（成本總額 / 報價總額 / 毛利率）
3. 訂單與需求單建立**雙向關聯**（訂單顯示「來自需求單 X」、需求單顯示「已轉訂單 Y」）
4. 業務於訂單階段補填發票 / 配送 / 付款計畫等訂單特有資訊
5. 若需求單來自諮詢單（[[US-CR-004-諮詢結束做大貨轉需求單]]）→ 諮詢付款紀錄轉移至本訂單，主訂單上建諮詢費的其他費用明細（依 spec L160 + order-management spec § Payment 跨實體轉移）

### 成功條件

1. 業務於成交需求單可執行「轉建訂單」，系統建立新訂單自動帶入客戶 / 業務 / 印件 / 報價資料
2. 訂單與需求單建立雙向關聯，可互相追溯
3. 印件預計產線自動帶入訂單對應印件的預計產線欄位
4. 若需求單來自諮詢單，諮詢付款紀錄轉移至本訂單並建諮詢費明細
5. 業務於訂單階段可補填發票 / 配送 / 付款計畫等訂單特有資訊（不在本卡範疇）

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「成交轉訂單」L171-180 + § L67-70 預計產線帶入 + § L160 諮詢付款轉移
- 原 Notion User Story DB `US-QR-007`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L171-180 補雙向關聯
- 對齊 spec L67-70 補預計產線帶入
- 對齊 spec L160 + [[US-CR-004]] 補諮詢付款跨實體轉移
- 邊界：訂單階段補填欄位（發票 / 配送 / 付款計畫）不在本卡，留至訂單模組 user story
