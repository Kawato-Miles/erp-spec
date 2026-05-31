---
type: user-story
us-id: US-ORD-034
module:
  - order-management
role:
  - "[[業務]]"
priority: medium
status: draft
created-at: 2026-05-29
last-reviewed: 2026-05-29
source:
  - "openspec/specs/order-management/spec.md § 訂單列表印件子層展開"
  - "[[ORD-023-訂單列表與印件總覽分工邊界]]"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
  - "[[印件]]"
related-test-cases: []
---

# US-ORD-034 業務查訂單下印件狀態

## 業務情境

### 作為
[[業務]]

### 我希望
在訂單列表直接展開查看一張訂單下各印件的審稿狀態與印製狀態

### 以便
接到客戶來電詢問特定印件進度時，不需離開訂單列表即可一次回答稿件審核與製作兩個進度，縮短回覆時間

### 前置條件
- 訂單已建立並含至少一個印件
- 該業務為訂單負責人，或訂單已分享給該業務

### 業務流程

1. 客戶來電詢問某張訂單裡某個印件目前的狀況
2. 業務以訂單編號、客戶名稱、案名，或印件名稱定位該訂單
3. 業務展開該訂單，檢視其下所有印件的審稿狀態與印製狀態
4. 業務口頭回覆客戶該印件目前進度；如需更多細節（稿件、相關工單、審稿輪次），進一步檢視該印件完整資訊

### 成功條件（acceptance criteria）

1. 業務展開任一可見訂單，可看到該訂單下全部印件（含已完成，已棄用除外）的審稿狀態與印製狀態
2. 業務以印件名稱搜尋時，含該印件的訂單被過濾並自動展開，命中印件醒目標示
3. 業務僅能展開自己負責或被分享訂單的印件，無法看到其他業務未分享訂單的印件

## 來源（provenance）

- openspec/specs/order-management/spec.md § 訂單列表印件子層展開（ADDED Requirement）
- [[ORD-023-訂單列表與印件總覽分工邊界]]（分工決議：訂單入口顯示全部印件含已完成）
