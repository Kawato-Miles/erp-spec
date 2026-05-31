---
type: open-question
module:
  - order-management
  - state-machines
oq-id: BI-9
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 4 PM 匯報)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-9：補收 OA「立即執行」對稱破壞與 v1.13 既有規則相容性 spec 表述

## 背景

本 change 採納 CEO Challenge 2「補收正項 OA 跳過審核中間態直達已執行」+「退款負項 OA 沿用主管核可 + 綁退款 Payment 切已完成才推進已執行」對稱破壞設計。

技術側已實作 derived helper（`requiresSupervisorApproval`）+ UI 提示橫幅。但 spec 中既有「OA 已執行需綁 Payment 切已完成累計達 OA.amount」invariant（v1.13 spec L1042-1060）若同時適用於補收/退款，會與「補收立即執行不綁 Payment」矛盾。

## 問題

spec 如何表述兩條獨立 invariant？

候選方案：

1. **A：兩條獨立 invariant 分別寫**
   - 補收 OA invariant：「補收 OA 立即認列應收、不綁 Payment 切已完成」
   - 退款 OA invariant：「退款 OA 已執行 → 必有已完成退款 Payment 累計達 OA.amount」（沿用 v1.13）
2. **B：擴充原 invariant 加條件**
   - 「OA 已執行 →（補收型）應收即時 +N / （退款型）必有已完成 Payment 累計達 OA.amount」
3. **C：改寫為「依 requires_supervisor_approval derived 判定」**

## 影響範圍

- state-machines spec § OrderAdjustment 狀態機文字
- order-management spec § Requirements 中 OA 已執行 invariant 描述
- e2e 斷言 spec（task 6.6 / 6.7 寫到時必須對齊）

## 待釐清

- spec 表述清晰度（讓未來新業務員看到能理解）
- 是否需要在 state-machines § OA 狀態機加分流圖（補收路徑 vs 退款路徑）

## 來源

- senior-pm Phase 4 PM 匯報（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-US-2
- 衍生：本 change apply 時的 spec 修訂工作（不阻擋 prototype 實作）
