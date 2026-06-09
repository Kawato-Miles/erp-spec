---
type: open-question
module:
  - 訂單管理
oq-id: BI-11
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: erp-consultant (Phase 3 C-PM-2 反向挑戰)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: apply 階段細化
---

# BI-11：三方對帳警示 banner 觸發條件細化

## 背景

顧問 C-PM-2 採納：補收 OA 已執行（應收 +N 立即認列）+ 業務尚未建期次承載該補收金額時，OrderReconciliationPanel 應顯示警示 banner「OA 已執行 N 元、但未對應期次規劃」+ action button「建立期次」。

目前 OrderBillingInstallmentSection 已部分整合（顯示應收 vs 期次合計差額警示），但 OrderReconciliationPanel 跨 panel 一致性、警示時機、UX 文案需細化。

## 問題

候選議題：

1. **觸發條件**
   - 嚴格：應收 ≠ Σ BillingInstallment.scheduledAmount where cancelled = false（目前實作）
   - 寬鬆：允許小額差額（如 < 1 元四捨五入誤差）
2. **顯示位置**
   - OrderBillingInstallmentSection 內（已做）
   - OrderReconciliationPanel 對帳檢視（task 4.8 未做）
   - 兩處同步顯示 vs 擇一
3. **UX 文案**
   - 「OA 已執行 N 元、但未對應期次規劃」（目前）
   - 「應收較期次合計多 N 元，請補建期次承載」
4. **action button**
   - 「建立期次」一鍵開 BillingInstallmentEditDialog 預填差額（已做）
   - 是否提供「忽略此差額」選項（目前無）

## 影響範圍

- OrderReconciliationPanel UX（task 4.8 整合時需對齊）
- 業務操作體驗（警示頻率 vs 提示有效性）

## 待釐清

- 業務 dogfood 時警示出現頻率與接受度
- 應收 vs 期次合計小數誤差處理（雙欄計價未稅 / 含稅換算）

## 來源

- erp-consultant Phase 3 C-PM-2 反向挑戰（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-H
- 衍生：apply 階段 task 4.8 整合 OrderReconciliationPanel 時細化
