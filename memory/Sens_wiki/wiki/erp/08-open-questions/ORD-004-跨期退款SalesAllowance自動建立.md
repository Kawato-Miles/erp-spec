---
type: open-question
module:
  - order-management
oq-id: ORD-004
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: Miles (plan 階段)
source-link: openspec/changes/archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq:
related-change: refine-after-sales-refund-and-add-supplementary-print
expected-resolution-at: 2026-Q3
---

# ORD-004：跨期退款的折讓單（SalesAllowance）自動建立 vs 提示業務手動建

## 背景

當業務於 ticket 內建退款 Payment 時，若該訂單**已開過發票**（跨期：發票期間已過，當期帳已結），會計層面需要開立 SalesAllowance 折讓單對應退款 Payment，否則發票淨額與收款淨額不平衡。

本 change 不處理 SalesAllowance 流程細節（不在範圍），但需釐清「退款 Payment 建立時，系統是否要自動觸發 SalesAllowance 建立 / 提示」。

## 問題

業務於 ticket 內建退款 Payment 時，若關聯訂單已開過發票，系統應該：

候選做法：

1. **自動建立 SalesAllowance**：系統一次完成「建退款 Payment + 建 SalesAllowance」兩個動作，業務無需手動
2. **提示業務手動建**：dialog 顯示提示「此訂單已開過發票，請至發票區建 SalesAllowance 折讓單」，業務手動到發票區建
3. **強制業務先建 SalesAllowance 再建退款 Payment**：禁止跨期退款 Payment 在 SalesAllowance 之前建立
4. **完全不處理（會計後續對帳）**：系統不管，會計事後核對發現不平再手動補

## 影響範圍

- 影響業務操作體驗（要不要二次操作）
- 影響會計工作（事前自動 vs 事後對帳）
- 影響跨期發票期間判定邏輯（哪算「已開發票」「跨期」）

## 待釐清

- 「跨期」的具體定義：已開發票 = 跨期？還是當月發票期間已結算才算跨期？
- SalesAllowance 自動建立的金額計算邏輯（含稅 / 不含稅 / 部分退款的折讓計算）
- 業務 vs 會計的責任邊界（誰確保折讓單 + 退款 Payment 對應一致）
- 是否獨立開 change 處理 SalesAllowance 完整流程

## 來源

- Miles plan 階段反饋（已明確排除本次範圍）
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § OQ-4 + § Migration Plan 風險 E

## 補 constraint（add-payment-status-and-decouple-oa-execution change 2026-05-21）

本 change 對「處理中 Payment 期間」補 constraint：

- 業務在 OA 編輯介面建立**處理中**退款 Payment 時，系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示（避免「對帳資料未齊備就開折讓單」的會計不確定性）
- 退款 Payment 切「已完成」後才能觸發 SalesAllowance 相關提示

完整 SalesAllowance 自動建立 vs 提示業務手動建的 4 候選做法決策仍 open（待 2026-Q3 決議）。

Spec / Scenario 對應：

- 原 business-processes spec § 處理中 Payment 期間 SalesAllowance 行為（已廢除 2026-06-09，內容遷至 order-management spec）
- [order-management spec § Requirement: 訂單異動執行流程 § 處理中 Payment 期間禁止觸發 SalesAllowance](../../../../openspec/specs/order-management/spec.md)

