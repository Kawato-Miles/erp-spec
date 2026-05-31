---
type: open-question
module:
  - order-management
oq-id: BI-7
status: open
priority: low
audience: internal
raised-at: 2026-05-28
raised-by: senior-pm (Phase 1 PM 假設)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq: []
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-7：多期合期開一張發票是否支援

## 背景

本 change 採「期次↔發票 1:1 嚴格約束」（Invoice.sourceBillingInstallmentId NOT NULL UNIQUE FK，Miles 拍板）。拆票 = 拆期是合理方向（拆票時連期次一起拆，獨立平輩期次）。

但**反向**情境「合期」（多期合併開一張發票）目前不支援：若業務想把訂金 + 中期款合併開一張票，現行模型必須先「合期」（將兩期合併成一期）再開票。

senior-pm Phase 1 假設「1:1 模型下預設不支援合期」，待 Miles 拍板未來是否擴充。

## 問題

候選方案：

1. **A 預設不支援**（PM 傾向）：1:1 主軸保留，業務若想合期須先在期次列表手動「合併兩期」再開票（提供合期 action）
2. **B 支援例外合期**：一張發票對應 N 個期次（破壞 1:1 主軸但保留彈性）

## 影響範圍

- 1:1 模型一致性
- 業界邊緣情境覆蓋率（合期場景的真實頻率）
- CSV 14 欄資料對齊（合期會讓「應收日」「備註」需從 N 個期次推導）

## 待釐清

- SENS 實務上「合期」情境的頻率（過去訂單統計）
- 業務情境 F2 / F3（拆票）是否實際也有反向合票需求
- 若採方案 B，CSV 應收日 / 備註如何處理（取最早 / 最晚 / 合併）

## 來源

- senior-pm Phase 1 假設（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-E
