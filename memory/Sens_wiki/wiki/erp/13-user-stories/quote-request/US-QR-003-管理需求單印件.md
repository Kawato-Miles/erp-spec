---
type: user-story
us-id: US-QR-003
module:
  - quote-request
role:
  - "[[業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 印件項目管理"
  - "openspec/specs/quote-request/spec.md#Requirement: 成本評估"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic:
  - "[[報價邏輯]]"
related-entities:
  - "[[需求單]]"
  - "[[印件]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-001-建立需求單]]：需求單已建立（狀態「需求確認中」或「已評估成本」之前的可編輯狀態）"
---

# US-QR-003 管理需求單印件

## 業務情境（穩定層）

### 作為
[[業務]]

### 我希望
能在一張需求單下建立多個印件項目，每個印件有獨立規格與報價

### 以便
公司可針對複雜需求（如 6 款明信片不同規格）進行分項評估與報價

### 前置條件
- 需求單已建立、狀態為「需求確認中」或「已評估成本」之前的可編輯狀態

### 業務流程

1. 業務於需求單下新增印件項目（支援多筆，至少 10 個）
2. 業務填寫每個印件的項目名稱、規格備註、數量
3. 業務選擇印件類型（27 種分類）與印件難易度（1-10）
4. 業務（選填）填寫預計產線（多選）— 成交轉訂單時帶入對應印件
5. 業務或印務主管填入成本總額與報價總額，系統自動計算毛利率（= (報價 - 成本) / 報價）
6. 系統於毛利率低於 0 時 UI 顯示警告（不阻擋送出但提示業務確認）
7. 多印件金額隨新增 / 修改 / 刪除即時彙總更新

### 成功條件

1. 需求單可建立多個印件項目（至少 10 個），每個印件有獨立的規格 / 數量 / 報價欄位
2. 印件類型限定 27 種分類；難易度限定 1-10 整數
3. 系統自動計算毛利率；毛利率低於 0 時 UI 顯示警告
4. 多印件金額隨異動即時彙總更新（無需手動重整）
5. 預計產線（多選）成交轉訂單時自動帶入對應印件

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「印件項目管理」L46-70 + § Requirement「成本評估」L134-144 + § Requirement「印件難易度欄位」L221-244
- 原 Notion User Story DB `US-QR-003`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L47「27 種印件類型 LOV」+ L46「至少 10 個印件項目」
- 補預計產線多選（spec L62-66 + L67-70 成交轉訂單帶入）
- 補印件難易度 1-10（spec L221-244，連動 [[US-AR-002-設定印件難易度與免審稿]]）
- 補成功條件 3 毛利率警告（spec L59「低於 0 時 UI 顯示警告」）
- 邊界：印件規格細節由本卡管理；審稿員能力分派由 [[US-AR-002]] + [[US-AR-003]] 涵蓋
