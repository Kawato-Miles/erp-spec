---
type: open-question
module:
  - order-management
oq-id: ORD-007
status: open
priority: high
audience: internal
raised-at: 2026-05-20
raised-by: senior-pm (前期介入)
source-link: openspec/changes/add-order-note-section-with-template-tool/proposal.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../05-entities/需求單]]
related-oq:
  - ORD-005
related-change: add-order-note-section-with-template-tool
expected-resolution-at: 2026-Q3
---

# ORD-007：新增 paymentNote 與既有 paymentTermsNote 的 UI 共存策略

## 背景

新增的 `paymentNote`（付款備註）與既有 `paymentTermsNote`（收款備註，從 Quote 帶入並鎖定）語意有重疊但來源不同：
- `paymentTermsNote`：報價階段約定，從需求單帶入訂單，**唯讀**
- `paymentNote`：訂單階段補充說明，業務 / 諮詢可編輯

兩個欄位都在訂單詳情頁顯示時，業務可能混淆。

## 問題

兩個欄位的 UI 共存策略是什麼？

候選做法：

1. **兩個都顯示，明確區分標籤**：
   - 「收款條件（來自需求單）」唯讀
   - 「付款補充備註（訂單階段）」可編輯
2. **paymentTermsNote 收進 read-only 區，paymentNote 進編輯區**：視覺上分離
3. **只顯示 paymentNote，paymentTermsNote 變成 tooltip / 折疊**：訂單階段以可編輯為主
4. **取消新增 paymentNote，把模板插入工具掛到 paymentTermsNote 的「補充說明」延伸欄**：避免冗餘

## 影響範圍

- 訂單詳情頁資訊 Tab 版型
- 業務認知負擔（兩欄會不會搞混）
- spec：order-management § Field Display Rules

## 待釐清

- 業務在訂單階段補充付款條件的頻率多高？（例：「客戶說要改成月結」）
- 是否應該優先走「OrderAdjustment」流程而不是備註？
- paymentTermsNote 在訂單階段被新 paymentNote 部分覆寫的法律 / 對帳風險

## 來源

- senior-pm 前期介入
- erp-consultant 結構審查（避免資料冗餘）
- change `add-order-note-section-with-template-tool` proposal.md
