---
type: user-story
us-id: US-QR-002
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
  - "openspec/specs/quote-request/spec.md#Requirement: 需求單狀態轉換"
  - "openspec/specs/quote-request/spec.md#Requirement: 議價備註"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-013-評估需求單報價]]：印務主管完成成本評估，需求單為「已評估成本」"
---

# US-QR-002 管理需求單進度

## 業務情境（穩定層）

### 作為
[[業務]]

### 我希望
能記錄報價提供與議價過程並標記終態（成交 / 流失）

### 以便
管理層追蹤需求單進度並從議價結果分析成交率與流失原因

### 前置條件
- 需求單成本評估完成（狀態為「已評估成本」）
- 業務為需求單擁有者或職務代理人

### 業務流程

1. 業務於「已評估成本」狀態填寫付款條件備註（與客戶確認的收款說明，選填）
2. 業務直接執行「進入議價」推進至「議價中」狀態（無業務主管核可閘門；業務主管核可在訂單階段才介入）
3. 業務於「議價中」填寫議價備註，紀錄與客戶議價歷程
4. 業務視客戶回應執行「成交」或「流失」標記終態：
   - 成交 → 進入轉訂單流程（詳見 [[US-QR-007-需求單成交轉訂單]]）
   - 流失 → 必填流失原因（詳見 [[US-QR-008-需求單流失歸因]]）
5. 每次狀態變更系統自動寫入活動紀錄（時間 / 操作者 / 前後狀態）

### 成功條件

1. 業務於「已評估成本」狀態可填付款條件備註並執行「進入議價」直接推進，**系統不要求業務主管核可**（spec L101，業務主管 gate 位於訂單階段）
2. 業務於「議價中」可填議價備註並執行「成交」或「流失」標記終態
3. 每次狀態變更（含議價 / 重新評估 / 成交 / 流失）自動寫入活動紀錄
4. 管理層可於需求單列表依狀態篩選追蹤進度（待評估成本 / 已評估成本 / 議價中 / 成交 / 流失）
5. 流失終態不可逆；成交終態觸發後續轉訂單流程

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「需求單狀態轉換」L79-123 + § Requirement「議價備註」L145-150
- 原 Notion User Story DB `US-QR-002`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L99-101 明示「業務直接進入議價、不需業務主管核可」（業務主管 gate 在訂單階段）
- 補議價備註（spec L145-150）+ 付款條件備註（spec L112）
- 邊界：成交 → 引 QR-007；流失 → 引 QR-008
- 「直接推進」描述對齊 spec L86「無業務主管 gate」
