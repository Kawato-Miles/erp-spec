---
type: open-question
module:
  - 訂單管理
oq-id: BI-8
status: answered
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: ceo-reviewer (Phase 2 Challenge 4) + erp-consultant (Phase 3 D8)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../03-roles/會計]]
related-oq:
  - BI-3
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3（後續 change）
---

# BI-8：月結閉檔批次觸發者與時點

## 背景

CEO Challenge 4 採納「PaymentAllocation 切已完成後仍可調整、留 ActivityLog 軌跡；月結批次跑完才真鎖（locked_by_period_close = true）」延遲導入策略。

本 change 已加 `PaymentAllocation.lockedByPeriodClose` 欄位（預設 false 不主動鎖），月結閉檔批次機制本身留待後續 change 處理。

## 問題

月結閉檔批次觸發者與時點為何？

候選方案：

1. **A 會計手動觸發**：每月對帳完成後會計點按鈕觸發鎖檔
   - 控制權清晰、時點明確
   - 業務若有跨月修改需求需先與會計協調
2. **B 定時批次（每月 1 日 00:00）**：系統自動觸發
   - 自動但需異常處理（若該月還沒對完帳怎麼辦）
3. **C 混合**：預設定時觸發、會計可手動延遲

## 影響範圍

- 會計工作流程（手動觸發 vs 自動觸發的 UX）
- 業務「Payment 切已完成後再調整」的時間窗（鎖檔前可調、鎖檔後 frozen）
- 跨月修改需求的例外處理路徑

## 待釐清

- SENS 會計實務上的月結流程（何時對完、何時封帳）
- 業務跨月修改頻率（決定鎖檔嚴格度是否影響日常操作）
- 與 BI-3「預收後續處理」結合（預收金額是否也要月結凍結）

## 拍板紀錄（2026-06-11 Miles）

採候選方案 A（會計手動觸發），否決 B（定時批次）與 C（混合）：

- 對帳與逾期款項清單由 [[會計]] 隨時手動產出，非系統排程批次；會計持續向業務催帳要求補處理。
- 退款等現金流出的實際匯款，慣例集中在月底由會計手動執行，非系統自動定時。
- 不引入「每月 1 日 00:00 自動鎖檔」批次機制；鎖檔由人工流程界定，避免「該月還沒對完帳就被自動鎖」的異常處理負擔。

落地於 [[帳務流程]] 階段 5「對帳與催收」與階段 6「月底現金流出與報表交接」、業務情境卡 [[對帳與催收]]。

## 來源

- ceo-reviewer Phase 2 Challenge 4（unify-billing-installment-and-reconciliation-csv change）
- erp-consultant Phase 3 D8 採延遲導入
- design.md § Open Questions OQ-BI-2
- Miles 拍板（2026-06-11）
