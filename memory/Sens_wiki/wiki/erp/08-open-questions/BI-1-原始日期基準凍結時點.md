---
type: open-question
module:
  - 訂單管理
oq-id: BI-1
status: resolved
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 1 釐清範疇，作為隱含假設標記)
resolved-at: 2026-05-28
resolved-by: Miles（收款項目 6 項調整需求拍板）
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: remove-legacy-payment-plan-planned-invoice-junction
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

## 解答（Miles 2026-05-28 拍板）

**採方案 2：業務主管審核訂單通過當下凍結。**

業務脈絡：收款項目（BillingInstallment）在**訂單建立時**就要填寫，因為業務主管審核訂單時，要看到這筆訂單的收款計劃。因此「業務主管審核通過」是收款計劃確立、凍結原始基準的自然節點。

**實作（prototype，commit b31d8b3）**：
- `approveOrderByManager`（訂單「待業務主管審核」→「報價待回簽」）時，凍結該訂單所有未取消收款項目的 `originalDueDate` / `originalExpectedInvoiceDate` = 當下值 + `changeCount` 歸零
- 審核通過**前**業務的修改不計入 `changeCount`（凍結時歸零）
- `addBillingInstallment` 建立時設佔位原始值（= 當下值），審核通過時正式覆寫

**諮詢訂單 / 系統自動建期次特殊處理**（原「待釐清」項）：
- 諮詢取消半額退費 / 諮詢結束不做大貨 / 需求單流失三情境由 system 自動建期次、不經 `approveOrderByManager` → 沿用「建立當下凍結」（佔位值即最終值，因 system 建立即定案、不會再改）
- 此處理避免「方案 2 對無審核節點訂單失效」的風險

**修改次數計數規則（同步拍板）**：一次儲存若「金額 / 預計收款日 / 預計開立發票日」任一變更 → `changeCount` +1（不論改幾欄）；純改描述 / 備註不計次。

## 來源

- senior-pm Phase 1 假設 1（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-A
- Miles 2026-05-28 拍板（收款項目 6 項調整需求，承接 remove-legacy-payment-plan-planned-invoice-junction change）
