---
type: open-question
module:
  - 訂單管理
oq-id: BI-006
status: answered
answered-at: 2026-08-03
answered-by: Miles
priority: low
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 4 PM 匯報)
source-link: 收款項目與對帳 CSV 統一 change 設計討論
related-vault:
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
  - BI-5
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 上線前
tags:
  - 領域/款項與發票
---

# BI-006：對帳 CSV 第 10 欄「收款日期」取值

## 背景

對帳 CSV 第 10 欄「收款日期」derived 自 PaymentAllocation → Payment.paidAt。一張發票可能經多次部分收款，取哪一筆 paidAt？

目前實作（`derivePaymentInfoForInvoice` in `src/utils/reconciliationCsv.ts`）：取**最近收款日**（latest paidAt）。

## 問題

候選方案：

1. **A 取最近收款日**（目前實作）：對齊「最後一次入帳」實務
2. **B 取結清日**：直到 100% 核銷才填，未結清前空白
3. **C 取最早收款日**：對齊「首次收款」實務

## 影響範圍

- CSV 第 10 欄語意（會計每月對帳的「收款發生月」歸屬）
- 部分收款發票在 CSV 的呈現（是否該顯示 partial 標記）

## 待釐清

- 會計實務上拿 CSV 收款日做什麼分析（DSO 計算、月份歸屬、催收追蹤）
- 部分收款情境是否需要在 CSV 列多筆 row（一筆 row 一筆收款）

## 來源

- senior-pm Phase 4 PM 匯報（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-D

## 決議

對帳明細的收款日期取「最近一筆已完成收款的日期」，與現行實作一致、零改動；部分收款是否結清由金額欄比對。否決結清日（空值多、月份歸屬拉不出）與最早收款日（與對帳直覺相反）。拍板：2026-08-03，Miles。

落地去處：無需落地（取值細節屬實作規格）。
