---
type: open-question
module:
  - order-management
oq-id: BI-1
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 1 釐清範疇，作為隱含假設標記)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-1：請款期次「原始日期基準」凍結時點

## 背景

本 change 為支援 CEO 指標 4「期次變更次數」量測 + UI 顯示「原始 vs 現況」對照，BillingInstallment 新增 `originalDueDate` / `originalExpectedInvoiceDate` 凍結基準欄位。業務之後修改 dueDate / expectedInvoiceDate 不影響此基準。

senior-pm Phase 1 為使設計可推進，先假設「凍結時點 = 期次首次儲存當下」，待 Miles 拍板正式做法。

## 問題

期次「原始日期基準」應於何時凍結？

候選做法：

1. **首次儲存當下凍結**（PM 假設、目前實作預設）
   - 簡單明瞭：期次新增的瞬間就凍結
   - 風險：業務若 typo（填錯應收日）需立即重存才能修正基準，否則「原始 vs 現況」對照永遠拿錯誤值當基準
2. **訂單某次審核通過當下凍結**
   - 與訂單狀態機緊密綁定（如業務主管核可訂單時凍結）
   - 風險：諮詢訂單 / 線上訂單沒有「審核通過」節點如何處理？需另議

## 影響範圍

- 「原始 vs 現況」對照的基準語意（OriginalVsCurrentDateLabel 元件）
- CEO 指標 4 變更次數量測 baseline
- 諮詢訂單 / 線上訂單沒有審核通過節點時的特殊處理

## 待釐清

- 業務 typo 時的修正路徑（若採方案 1）
- 諮詢訂單 / 線上訂單的凍結時點（若採方案 2）
- 業務主管 + 會計實務上希望「對照基準」的語意為何

## 來源

- senior-pm Phase 1 假設 1（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-A
