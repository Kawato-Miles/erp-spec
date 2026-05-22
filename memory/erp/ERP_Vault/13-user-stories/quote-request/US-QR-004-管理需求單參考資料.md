---
type: user-story
us-id: US-QR-004
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
  - "openspec/specs/quote-request/spec.md#Requirement: 印件參考附件"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/需求單]]"
  - "[[05-entities/印件]]"
related-oq: []
related-test-cases: []
---

# US-QR-004 管理需求單參考資料

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能在需求單印件項目中上傳參考圖片或檔案

### 以便
印務主管評估時有具體參考依據，減少來回溝通

### 前置條件
- 需求單印件項目已建立
- 業務有需要上傳的參考檔案（圖片 / PDF）

### 業務流程

1. 業務於需求單印件項目選擇上傳參考附件
2. 系統支援多附件上傳（每個印件可上傳多個檔案）
3. 業務可預覽附件或下載原檔
4. 印務主管於評估流程可參考附件評估成本
5. 客戶若提供修改版稿件，業務可再次上傳並保留歷史檔案

### 成功條件

1. 每個印件項目支援多附件上傳（圖片 / PDF），數量無上限（依儲存配額）
2. 業務與印務主管均可預覽附件（縮圖或內嵌檢視）並下載原檔
3. 附件版本保留：上傳新檔案不覆蓋舊版，供歷史追溯

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「印件參考附件」L72-77
- 原 Notion User Story DB `US-QR-004`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L72-77 補附件多檔 + 預覽 + 下載
- 補附件版本保留（業務上的合理需求）— 未在 spec 明示但屬合理推斷
- 邊界：審稿階段的稿件管理由 [[US-AR-007-執行印件審稿]] 處理（不同生命週期、檔案不互通）
