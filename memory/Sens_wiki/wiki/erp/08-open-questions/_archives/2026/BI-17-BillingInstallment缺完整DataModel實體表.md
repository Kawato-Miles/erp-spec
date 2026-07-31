---
type: open-question
module:
  - 訂單管理
oq-id: BI-17
status: answered
priority: medium
audience: internal
raised-at: 2026-05-30
raised-by: Claude (PlannedInvoice 遷移揭露)
source-link: PlannedInvoice→BillingInstallment 全遷移收尾（2026-05-30）；unify-billing-installment-and-reconciliation-csv 遺留 gap
related-vault:
  - "[[訂單]]"
  - "[[付款發票邏輯]]"
related-oq:
  - BI-7
related-change: unify-billing-installment-and-reconciliation-csv（遺留）
expected-resolution-at: 另批補強
answered-at: 2026-07-31
answered-by: Miles
---

# BI-17：BillingInstallment 缺完整 Data Model 實體表

## 問題描述

unify-billing-installment-and-reconciliation-csv 定義 BillingInstallment 時，只用 Requirements + 雙維度狀態機（開票維度 invoicing_status / 收款維度 derived 自核銷），**未在 openspec 補完整 Data Model 實體欄位表**（欄位名 / 型別 / 必填 / 預設依賴 prototype `src/types/billingInstallment.ts` 承載）。

PlannedInvoice→BillingInstallment 全遷移（2026-05-30）後，order-management 原 PlannedInvoice Data Model 實體表改為「廢止 + supersession 註記指向 BillingInstallment」，但 **BillingInstallment 自身在 openspec 無正式 Data Model 權威定義** → 形成「實體有 Requirements + 狀態機、卻無 Data Model 欄位表」的缺口。

## 涉及範圍

- 模組：order-management（Data Model）/ billing
- 影響：openspec 缺 BillingInstallment 實體權威欄位定義（scheduled_amount / due_date / scheduled_issue_date / invoicing_status / source_type / split_from_installment_id / 原始日期凍結欄位等散在 Requirements + prototype，無單一 Data Model 表）

## 待解答

- [x] 是否補完整欄位表 → 已補，但落點不是 OpenSpec：欄位正本 2026-06-09 起歸 wiki 實體卡，[[帳務]] § 欄位（業務可見）的請款期次段已列 19 個欄位（含預計金額、預計收款日、原始預計收款日與原始預計開票日等凍結基準、已收與已退金額）
- [x] 欄位來源 → 同上，已彙整成單一權威表
- [x] 子實體 cross-link → 收款入帳明細與活動紀錄同列於 [[帳務]] 卡

## 決議（2026-07-31，Miles）

本卡的前提（欄位表該補在 OpenSpec Data Model）已因分工變更失效：欄位正本歸 wiki 實體卡、OpenSpec 不再承載欄位表。[[帳務]] 卡的請款期次欄位表即現行正本，缺口消失。[[請款期次規劃]] § 範圍外原本標「欄位正本待補」的措辭同批改掉。

## 候選方案

### 方案 A：補完整 Data Model 實體表
- 優點：openspec 有 BillingInstallment 權威定義，未來 change 不必翻 prototype/Requirements
- 缺點：需從 prototype + 多個 Requirements 彙整、確保欄位/型別準確

### 方案 B：維持 supersession 註記 + cross-ref prototype
- 優點：改動最小
- 缺點：實體定義散落、違反「文件即規格」（openspec 應有實體權威定義）
