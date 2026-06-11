---
type: reference
module:
  - 跨模組
status: active
last-reviewed: 2026-05-19
---

# Prototype 索引

> [[scope-boundary|Vault 範疇]] 不收 Prototype 實作層內容（DESIGN.md / UI 業務規則 / 演算法）。本卡為「需引用 Prototype 業務規則時」的入口。

## 一、Vault 引用 Prototype 的位置

| Prototype 檔案 | Vault 引用 | 引用內容 |
|----------------|-----------|----------|
| `src/types/quote.ts` L54-57 | [[難易度機制]] | `difficultyLevel` enum 定義 |
| `src/types/quote.ts` L58-61 | [[免審決策樹]] | `skipReview` 欄位定義 |
| `src/types/quote.ts` L62-70 + `CLIENT_NOTE_MAX_LENGTH` | 印件檔案備註上限（實作參數） | 500 字限制 |
| `src/types/quote.ts` § QuoteStatus | [[需求單狀態]] | 6 個狀態 |
| `src/types/workOrder.ts` § WorkOrderStatus | [[工單狀態]] | 工單狀態定義 |
| `src/types/workOrder.ts` § ProductionTaskStatus | [[生產任務狀態]] | 4 種工廠路徑 |
| `src/utils/prepressReview.ts` § runAutoAssign | [[審稿分配規則]] | 自動分配演算法（**業務規則部分**）|
| `src/data/mockOrders.ts` | [[付款發票邏輯]] | 13 個情境對應的 mock 訂單 |

## 二、明確不收（屬實作層）

| Prototype 檔案 | 為什麼不收 |
|----------------|-----------|
| `DESIGN.md`（768 行 UI 設計系統） | 屬 Prototype 唯一權威，不重複 |
| `src/utils/prepressReview.ts` 演算法步驟（5 步驟）| 實作細節，留程式碼 |
| `src/utils/orderPricing.ts`、`equipmentCost.ts`、`imposition.ts`、`scheduling.ts` | 計算公式 / 演算法，實作層 |
| `src/index.css`、各 component | UI 實作 |
| `memory/shared/ui-business-rules.md` | UI 業務規則（屬 Prototype 範疇）|
| `memory/shared/principles.md`（§ 一~五）| 跨產品通用工作原則（§ 六 ERP 設計模式 2026-05-19 已遷至 [[erp-design-patterns]]）|

## 三、Vault → Prototype 反向追蹤

當 Vault 卡的業務規則異動時，可能影響的 Prototype 程式碼：

| Vault 卡 | 可能影響 |
|---------|---------|
| [[難易度機制]] | `src/types/quote.ts`、`src/utils/prepressReview.ts` |
| [[免審決策樹]] | 同上 |
| 印件檔案備註上限（實作參數） | `src/types/quote.ts` `CLIENT_NOTE_MAX_LENGTH` 常數、UI 字數驗證 |
| [[齊套邏輯]] | `src/utils/printItemStatus.ts`（齊套計算實作）|
| [[付款發票邏輯]] | `src/utils/ezpayMockup.ts`、`src/data/mockOrders.ts` |

## 四、Prototype repo

- 本地路徑：`/Users/b-f-03-029/sens-erp-prototype`
- GitHub：https://github.com/Kawato-Miles/sens-erp-prototype
- 唯一分支：main（依 feedback_prototype_single_branch.md）
- 技術棧：React + TypeScript + Tailwind + shadcn/ui

## 五、Prototype 工作流程

- 製作前必讀：`sens-erp-prototype/DESIGN.md`（§0 業務規範）
- 工作流程：`memory/shared/prototype-guidelines.md`
- e2e 測試：Playwright（依 feedback_prototype_playwright.md）
- 本地 dev：`npm run dev` → localhost:8080；git push 後 Lovable 雲端 build
