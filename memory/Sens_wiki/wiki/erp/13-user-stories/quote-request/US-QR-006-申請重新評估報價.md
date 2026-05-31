---
type: user-story
us-id: US-QR-006
module:
  - quote-request
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 需求單狀態轉換"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-002-管理需求單進度]]：需求單已進入議價中"
  - 客戶要求重新報價
---

# US-QR-006 申請重新評估報價

## 業務情境

### 作為
[[業務]]

### 我希望
能於議價中讓需求單退回「待評估成本」狀態重新評估

### 以便
客戶要求調整方案（如更換紙材降低成本）時，印務主管可重新評估並保留歷史報價

### 前置條件
- 需求單狀態為「議價中」
- 客戶要求重新報價（如更換紙材、調整規格）

### 業務流程

1. 業務於議價中與客戶溝通後判斷需重新評估方案
2. 業務執行「重新評估報價」，可選填調整說明
3. 系統將需求單狀態退回「待評估成本」
4. 系統保留**歷史報價紀錄**（前一次評估的成本 / 報價數字不覆蓋）
5. 印務主管收到重新評估通知（同 [[US-QR-005-待評估報價通知]] 通知機制）
6. 印務主管重新評估完成後系統建立**新的報價紀錄**並通知業務
7. 需求單推進至「已評估成本」後業務可直接再進入「議價中」（無業務主管核可）

### 成功條件

1. 業務於「議價中」可執行「重新評估報價」並選填調整說明
2. 系統將需求單狀態退回「待評估成本」並通知印務主管
3. 歷史報價紀錄**保留不覆蓋**（業務 / 印務主管 / 管理層可查看前一次與本次評估的差異）
4. 印務主管重新評估完成後系統建立新報價紀錄並通知業務
5. 重新進入「已評估成本」後業務可直接進「議價中」（不需業務主管重新核可）

## 來源（provenance）

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「需求單狀態轉換」L118-123（Scenario US-QR-006）
- 原 Notion User Story DB `US-QR-006`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L118-123 補「歷史報價紀錄保留」「重新評估後建立新報價紀錄」「業務直接進議價不需業務主管核可」三項核心設計
- 邊界：通知機制引 [[US-QR-005]] 而非重複描述
- spec L87「議價中 → 待評估成本」轉換由本 user story 承接
