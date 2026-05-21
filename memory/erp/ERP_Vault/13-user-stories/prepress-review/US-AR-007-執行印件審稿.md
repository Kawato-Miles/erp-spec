---
type: user-story
us-id: US-AR-007
module:
  - prepress-review
role:
  - "[[03-roles/審稿]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
  - "[[04-business-logic/稿件管理規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
related-test-cases: []
---

# US-AR-007 執行印件審稿

## 業務情境（穩定層）

### 作為
[[03-roles/審稿]]

### 我希望
能查看分派給我的待審印件，檢視印件規格、原稿、歷史審稿輪次與業務送審備註，並送出合格 / 不合格判定

### 以便
有系統化工具記錄每輪審稿，取代過去散落在即時通訊軟體的溝通與紙本簽收，所有審稿決策留稽核紀錄

### 前置條件
- 印件稿件已上傳並分派給我
- 印件狀態為「等待審稿」或「已補件」（補件後重審）

### 業務流程

1. 審稿員查看分派給自己的待審印件清單
2. 審稿員選取要審稿的印件，檢視：
   - 印件規格（紙張 / 尺寸 / 印色 / 加工等）
   - 客戶原稿檔案
   - 歷史審稿輪次紀錄（補件迴圈中的前幾輪）
   - 業務送審時填的備註
3. 審稿員判定本輪結果：
   - 若合格：上傳審稿後檔案（含縮圖），系統將印件推進至製程審核階段
   - 若不合格：從預設退件原因項目中選擇，並填寫審稿備註說明問題
4. 系統記錄本輪審稿（檔案、結果、退件原因、備註、時間），印件狀態依結果推進

### 成功條件

1. 審稿員可在待審清單看到分派給自己的所有印件
2. 審稿員可查看印件規格、原稿、歷史審稿輪次、業務送審備註
3. 合格判定須附審稿後檔案，系統自動產生縮圖
4. 不合格判定須選退件原因（從預設項目）並填審稿備註
5. 提交後印件狀態正確推進，本輪審稿紀錄結構化留存

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md)
- [[04-business-logic/稿件管理規則]]
- 原 Notion User Story DB `US-AR-007`（2026-05-21 遷入）
