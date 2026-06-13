---
type: open-question
module:
  - 訂單管理
business-domain:
  - 款項與發票
oq-id: BI-19
status: open
priority: high
audience: internal
raised-at: 2026-06-01
raised-by: doc-audit（align-business-consultation-coverage-gaps archive 合併後驗收）
source-link: openspec/changes/archive/2026-06-01-align-business-consultation-coverage-gaps/
related-oq:
  - BI-1
---

# BI-19：付款計畫變更分階段稽核 與 既有 BillingInstallment 變更追蹤（BI-1 已解）重疊

## 問題描述

`align-business-consultation-coverage-gaps` change 新增 Requirement「付款計畫變更分階段稽核」與兩個 Data Model 欄位，與 [[BI-1-原始日期基準凍結時點|BI-1-原始日期基準凍結時點（已封存）]]（2026-05-28 Miles 已拍板）所定的 BillingInstallment 變更追蹤機制**語意重疊、欄名不一致**，疑似重造已解的輪子。

| 面向 | BI-1 已解（既有正本）| align- 新增 |
|------|---------------------|------------|
| 實體 | BillingInstallment（請款期次）| 「PaymentPlan 期次」（疑為統一前舊命名）|
| 凍結基準欄 | `originalDueDate` / `originalExpectedInvoiceDate` | `original_expected_date`（凍結 `scheduled_date`）|
| 變更計數 | `changeCount`（金額 / 收款日 / 開票日任一變更 +1）| `change_count`（審核通過後 scheduled_date 變更 +1）|
| 凍結時點 | 業務主管審核通過當下（`approveOrderByManager`）| 審核通過後首次變更時寫入 original_expected_date |

main order-management § Data Model 現同時存在兩套（既有 BillingInstallment.change_count 約 L3111 / 新增 L3971-3972 / L4311-4312），同一請款期次實體出現兩個 change_count 定義。

## 涉及範圍

- 模組：order-management（billing-cash 領域）
- 既有：BillingInstallment.changeCount（BI-1 已解、prototype commit b31d8b3 已實作）
- 新增：align- 「付款計畫變更分階段稽核」change_count / original_expected_date
- 影響：CEO 指標 4「期次變更次數」量測 baseline 會不會被兩套計數搞亂；Prototype 實作該依哪一套

## 待解答

- [ ] align- 的「PaymentPlan 期次」是否即 BillingInstallment（統一後實體）？若是，新欄是否應收斂進既有 BillingInstallment.changeCount / originalDueDate 體系，不另立 `change_count` / `original_expected_date`？
- [ ] 兩套計數的「變更」定義不同（BI-1 計金額/收款日/開票日；align- 計 scheduled_date）——是同一件事換名，還是真有兩個不同指標？
- [ ] 若收斂為一套，main spec § Data Model 與「付款計畫變更分階段稽核」Requirement 需重寫對齊 BI-1，移除重複欄。

## 候選方案（若有）

### 方案 A：收斂進 BI-1 既有體系（建議方向，待 Miles 確認）
- align- 的 change_count / original_expected_date 視為 BillingInstallment.changeCount / originalDueDate 的重複，移除新欄、「付款計畫變更分階段稽核」Requirement 改為引用既有 BI-1 機制（凍結時點本 change 已將鎖定錨點前移至審核通過，與 BI-1「審核通過凍結」一致）。
- 優點：單一正本、單一 changeCount、CEO 指標 baseline 不分裂。
- 缺點：需回頭重寫 align- 已合併進 main 的該 Requirement 與 Data Model 列。

### 方案 B：兩套並存（不建議）
- 若「scheduled_date 變更」與「dueDate/expectedInvoiceDate 變更」確為兩個獨立業務指標則保留。
- 缺點：同實體兩個 change_count 易混淆、Prototype 與量測歧義。

## 處理決定（Miles 2026-06-01）

留待**以後的 change** 收斂（不在 align- archive 當下改正本）。本 OQ 維持 open，待後續聚焦 change 處理 change_count / original 系列欄位的單一正本化（對齊 BI-1 既有 BillingInstallment 機制）。
