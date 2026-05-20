---
type: open-question
module:
  - after-sales-ticket
  - order-management
oq-id: AFT-6
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: senior-pm / Miles (補印審稿自動通過設計)
source-link: openspec/changes/archive/2026-05-20-refine-supplementary-print-skip-review/design.md
related-vault:
  - [[../05-entities/印件]]
  - [[../05-entities/售後服務]]
related-oq:
  - AFT-7
related-change: refine-supplementary-print-skip-review
expected-resolution-at:
---

# AFT-6：「補印改稿」情境（補印同時改規格）入口設計

## 背景

`refine-supplementary-print-skip-review` change 將補印 PrintItem 設計為「自動通過審稿 + 沿用原稿」（業界 MES 慣例 + 印刷業 99% 售後補印情境）。

但有 1% 情境：客戶要求「補印同時改稿」（例如客戶反映規格不符想換顏色 / 字體 / 排版）。此情境下不能沿用原稿，但業務在 ticket 內看到的入口仍是「建立補印印件」。

## 問題

業務在 ticket 內想處理「補印同時改稿」情境時，應該走哪個路徑？

候選做法：

1. **走「規格變更」OrderAdjustment 而非補印**（目前 spec 暗示）
   - 業務於訂單頁建 OrderAdjustment（adjustmentType = 規格變更、amount = 0 或補費）
   - 主管核可後業務手動到訂單頁編輯 PrintItem 規格 + 上傳新稿件
   - 缺點：流程跨頁面、業務操作步數多、與 ticket 體驗脫節

2. **補印 dialog 內加「改稿」勾選**
   - 業務勾選後系統不沿用原稿，建立補印印件後 reviewStatus = '稿件未上傳'（重走審稿）
   - 缺點：補印 dialog 複雜度提高、99% 情境用不到此 checkbox

3. **新增「補印改稿」獨立入口**（與「建立補印印件」並列）
   - ticket 詳情頁加新按鈕「建立補印 + 改稿」（少見情境）
   - 點擊建立印件 + 走完整審稿
   - 缺點：UI 入口分散

4. **不處理此情境（假設罕見）**
   - 維持現狀：業務若要改稿須走 OrderAdjustment + 訂單頁編輯
   - 後續若實證有此業務需求再開新 change

## 影響範圍

- 不影響本 change 主流程（已決定 99% 補印走自動通過）
- 影響業務在「補印 + 改稿」少見情境的操作體驗
- 影響補印路徑的入口設計（單一 vs 多入口）

## 待釐清

- 實務上「補印同時改稿」的發生頻率（待業務 / 諮詢實證統計）
- 業務若要改稿走 OrderAdjustment 是否會抗拒（步數多）
- 客戶端的需求清晰度（客戶常會說「補印一下 + 順便改 X」還是「重新做 + 改 X」？後者應屬新訂單）

## 來源

- senior-pm 第 4 段（refine-after-sales-refund-and-add-supplementary-print 前期介入）風險 D
- change `refine-supplementary-print-skip-review` design.md § OQ-SP-1
