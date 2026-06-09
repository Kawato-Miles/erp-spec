---
type: open-question
module:
  - 訂單管理
oq-id: BI-3
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 1 釐清範疇)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-3：溢收「預收（未分配）」後續處理路徑

## 背景

本 change 中 PaymentAllocation 支援溢收場景：當業務登錄 Payment 金額 > 訂單下所有未收期次總額時，溢收部分掛 `billingInstallmentId = null` 的「預收（未分配）」桶。

senior-pm Phase 1 + 顧問 C-PM-1 未明確「預收桶」後續流向。

## 問題

溢收「預收（未分配）」後續處理路徑為何？

候選做法：

1. **A：日後核銷新期次**
   - 若同訂單後續有新異動（補收 OA）建立新期次，預收金額可優先核銷
   - 符合「客戶預付、抵充未來請款」業界主流模式
2. **B：退款處理**
   - 業務主動退多收金額給客戶（透過退款 Payment）
   - 對齊「保持訂單金流乾淨、不掛預收」會計慣例
3. **C：兩者皆可（業務依情境決定）**
   - UI 提供「核銷至新期次 / 退還客戶」兩個按鈕讓業務選

## 影響範圍

- PaymentAllocation 預收桶後續 UI 入口設計
- 對帳 CSV 是否列入「未分配預收」（task 5.1 CSV 預設不列）
- 期次列表是否顯示「可從預收核銷」按鈕（task 4.1 UI 暫未實作）
- 月結批次差錯訂單清單是否將預收視為「對帳通過」（task 5.5）

## 待釐清

- 業務實際情境中「預收金額」發生頻率與業務認知
- 會計實務上預收的記帳處理
- 客戶端是否接受預收金額抵充未來請款（vs 要求退款）

## 2026-06-02 訂單收退款模型重構 範圍界定

訂單收退款模型重構（訂單收退款通用方案）Miles 決策：**本 change 範圍內，「收款淨額 > 應收」一律當「退款待執行」處理**（核銷應退差額、不阻擋）。

「溢收（誤多收）vs 預收（客戶預付未來訂金）」的細分**另議**——本 OQ 候選 A（核銷新期次）/ B（退款）/ C（兩者）的選擇留待溢收 / 預收場景單獨處理時拍板，不在訂單收退款模型重構 本 change。維持 open（細分待決）。

## 來源

- senior-pm Phase 1 假設（unify-billing-installment-and-reconciliation-csv change）
- 顧問 C-PM-1 採納
- design.md § Open Questions OQ-BI-C
