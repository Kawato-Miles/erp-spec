---
type: open-question
module:
  - 訂單管理
oq-id: BI-5
status: open
priority: high
audience: external
raised-at: 2026-05-28
raised-by: ceo-reviewer (Phase 2 Challenge 5)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../03-roles/會計]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 上線前（pre-launch validation）
---

# BI-5：對帳 CSV 14 欄會計實務驗證

## 背景

本 change 新增財務對帳 CSV 匯出功能，14 欄定稿（Miles 拍板）：
1. 帳務公司 / 2. 發票號碼 / 3. 訂單編號 / 4. 案名 / 5. 開立日期 / 6. 應收日期（繼承來源期次）/ 7. 客戶名稱 / 8. 總金額(含稅) / 9. 備註 / 10. 收款日期 / 11. 收款狀態 / 12. 業務名稱 / 13. 開立日期月底 / 14. 天數（應收日−開立日，帳期）

ceo-reviewer Phase 2 Challenge 5 指出：14 欄是 Miles 設計的，但「會計實際操作流程」需要實證才能驗證符合月結對帳實務。

## 問題

CSV 14 欄是否真符合 SENS 會計實務？

待驗證項目：

1. **欄位順序**：14 欄目前順序（帳務公司→發票號碼→訂單編號→…）是否符合會計 Excel 拉直觀順序？
2. **欄位完整性**：是否還有會計實際需要但 14 欄未涵蓋的資訊（如：折讓金額 / 折讓後淨額 / 帳齡 / 收款方式 / 退款明細）？
3. **第 13 欄「開立日期月底」用途**：Miles 補充對應月結對帳基準，會計實際是「以月底為帳齡起算」嗎？
4. **第 14 欄「天數」(應收日−開立日)**：對應業界 payment terms (Net N)，會計實際拿這個欄位做什麼分析？
5. **第 10 欄「收款日期」一張發票經多次部分收款時的取值**：取最近收款 / 結清日（BI-D 待定）
6. **作廢發票是否需要選項列入 CSV**：目前預設不列；會計實務是否有需要查看作廢歷史的場景？

## 影響範圍

- 對帳 CSV 上線後會計接受度
- 是否需要在 prototype 階段就調整欄位 / 順序（vs 上線後第一週反饋修正）
- 第 14 欄「天數」語意（帳期 vs 逾期天數，目前是帳期）

## 待釐清

**上線前驗證**：
- 拉會計同事看 CSV 預覽前 5 列：是否所有欄位都能直接用、不用再開 Excel 拼湊
- 詢問會計目前手動對帳的「工作流程」：是否能用 14 欄一鍵搞定 vs 還需要哪些補充資料
- 詢問會計實際的「對帳週期」：每週 / 每月 / 季底，對應「日期範圍篩選」UX 是否合理

## 來源

- ceo-reviewer Phase 2 Challenge 5（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-CSV-1
- 標記「上線前需驗證」狀態，prototype 階段先依探索結論定稿

## 處理策略

- prototype 階段：依 Miles 探索結論定稿，不阻擋本 change apply
- 上線前 1-2 週：Miles 拉會計實務確認，依反饋調整 CSV schema
- 風險預先掛卡（不在本 change 強制解決）
