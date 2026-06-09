---
type: open-question
module:
  - 訂單管理
  - finance
oq-id: BI-10
status: open
priority: low
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 4 PM 匯報) + Miles 拍板 5「作廢發票預設不列」
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
  - BI-5
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 上線前
---

# BI-10：作廢發票是否提供篩選選項列入 CSV

## 背景

Miles 拍板 5：CSV 第 8 欄「總金額(含稅)」採發票面額（不扣折讓；作廢發票預設不列）。

目前實作（`ReconciliationCsvExportDialog`）已提供「包含作廢發票」checkbox，預設關閉。但「會計實務上是否真的需要這個選項」需驗證（與 BI-5 一起做）。

## 問題

候選方案：

1. **A 保留 checkbox + 預設關閉**（目前實作）
   - 業務 / 會計可手動開啟看作廢歷史
   - 上線前依會計反饋微調預設值
2. **B 完全不提供 checkbox**
   - 作廢發票永遠不在對帳 CSV
   - 作廢歷史另設獨立查詢頁
3. **C 預設打開**
   - 對帳時也看作廢歷史避免遺漏

## 影響範圍

- ReconciliationCsvExportDialog UX
- 會計實務對「作廢發票」是否需要納入對帳的認知

## 待釐清

- SENS 會計實務上查詢作廢發票的場景與頻率
- 是否與 BI-5（CSV 14 欄會計實務驗證）一起做上線前確認

## 來源

- senior-pm Phase 4 PM 匯報（unify-billing-installment-and-reconciliation-csv change）
- Miles 拍板 5 衍生
- design.md § Open Questions OQ-BI-G
