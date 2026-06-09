---
type: open-question
module:
  - 訂單管理
oq-id: BI-2
status: open
priority: high
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 1 釐清範疇，作為隱含假設標記)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../04-business-logic/付款發票邏輯]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-2：折讓後期次 / 發票「已收訖」判定基準

## 背景

本 change 支援「對帳 CSV 第 11 欄收款狀態」derived 推導。若發票經折讓（SalesAllowance）抵減後，客戶實際只需支付折讓後淨額；此時「已收訖」判定基準是發票面額還是折讓後淨額？

senior-pm Phase 1 提出兩個方向，傾向 A（業界主流）。

## 問題

折讓後期次/發票「已收訖」判定基準為何？

範例：發票 100K 折讓 -10K，客戶付 90K

- **A 方向：折讓後淨額為準**（PM 傾向、業界主流）
  - 客戶付 90K = 已收訖（折讓 10K 視為已抵減）
  - 對齊 NetSuite / SAP credit memo + invoice 收款判定
- **B 方向：發票面額為準**
  - 客戶付 90K + 系統內部認列 10K 折讓才算收訖
  - 期次永遠以面額為基準對照

## 影響範圍

- 對帳 CSV 第 11 欄收款狀態欄推導邏輯
- BillingInstallment.paymentStatus 收款維度推進條件
- 「三方對帳通過」判定（CEO 指標 2）
- 業務告訴客戶「收訖」時的金額認知（PM 假設 A 對齊業務直覺）

## 待釐清

- 會計實務上「應收 vs 收款 vs 折讓」三軸對齊的會計分錄期待
- 業務與客戶溝通時「收訖」涵義是否包含折讓抵減

## 來源

- senior-pm Phase 1 假設 2（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-B
