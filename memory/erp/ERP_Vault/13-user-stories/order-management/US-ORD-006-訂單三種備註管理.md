---
type: user-story
us-id: US-ORD-006
module:
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單備註三類分欄"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單詳情頁訂單備註 section"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
---

# US-ORD-006 訂單三種備註管理

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能編輯訂單須知 / 交貨備註 / 付款備註三類分欄備註

### 以便
客戶溝通備註依業務主題分類，跨部門讀取不混淆

### 前置條件
- 訂單已成立
- 業務為訂單擁有者或職務代理人（依 spec § 訂單階段訂單備註編輯權限與時機）

### 業務流程

1. 業務於訂單詳情看到三類獨立的備註欄位：訂單須知 / 交貨備註 / 付款備註
2. 業務可獨立編輯每一類備註內容（每類最多 500 字）
3. 業務可透過備註模板選擇器一鍵帶入常用文字（如：常用付款條件 / 常用交貨條件範本）
4. 備註內容於訂單詳情頁分區顯示，跨部門讀取時可依主題快速定位
5. 系統寫入活動紀錄（事件描述：備註類別 + 變更前 / 變更後內容）

### 成功條件

1. 三類備註欄位獨立可編輯，每類最多 500 字
2. 每類備註支援模板選擇器一鍵帶入常用文字
3. 訂單詳情頁分區清楚顯示三類備註（不混在同一欄位）
4. 備註變更寫入活動紀錄，便於事後追蹤
5. 編輯權限依 spec § 訂單階段訂單備註編輯權限與時機決定（限訂單擁有者 / 代理人）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單備註三類分欄」L1790+ + § Requirement「訂單詳情頁訂單備註 section」L2321+ + § Requirement「訂單階段訂單備註編輯權限與時機」L2358+
- 原 Notion User Story DB `US-ORD-006`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 三類分欄 + 500 字限制 + 模板選擇器
- 補編輯權限依 spec § 編輯權限與時機決定（職務代理人連動 [[US-QR-011]] 模式）
- 補活動紀錄變更前後 diff
