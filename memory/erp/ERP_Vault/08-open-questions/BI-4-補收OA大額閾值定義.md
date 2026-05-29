---
type: open-question
module:
  - order-management
oq-id: BI-4
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: erp-consultant (Phase 3 C-PM-3 反向挑戰)
source-link: openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../03-roles/業務主管]]
related-oq:
  - AFT-3
related-change: unify-billing-installment-and-reconciliation-csv
expected-resolution-at: 2026-Q3
---

# BI-4：補收 OA 大額閾值定義

## 背景

本 change 採納 CEO Challenge 2「補收正項 OA 跳過審核中間態、業務直接執行（免主管核可）」。顧問 C-PM-3 補強：補收 OA 不需主管核可、但應收 +N > 大額閾值時觸發事後監督機制：
- ActivityLog 寫入紅標事件 high_amount_supplementary_charge
- Slack 通知業務主管「業務 [name] 建立大額補收 OA +N 元於訂單 [order_no]」

目前實作以系統常數 50000 為起始閾值（`SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD`），待 Miles 拍板實務值。

## 問題

補收 OA 大額閾值應設定為多少？

候選依據：

1. **業界平均訂單金額 × 比例**
   - 印刷業典型訂單金額分布需 Miles 內部數據驗證
2. **固定金額閾值**
   - 起始建議 50000（PM 假設）
   - 實務反饋後可調整
3. **依 adjustment_type 分別設定**
   - 加印追加 / 加運費 / 急件費 各自閾值不同
   - 規格變更（可能很大）vs 急件費（通常很小）

## 影響範圍

- 補收 OA 免主管核可的事後監督機制觸發頻率
- 業務主管 Slack 通知頻率（過低閾值 = 干擾、過高閾值 = 失去把關）
- 業務操作體驗（被監督壓力）
- 與 AFT-3「OA 已核可改金額是否通知主管」相關（同樣是「事後監督 vs 事前審核」議題）

## 待釐清

- SENS 過去半年至一年的補收 OA 金額分布
- 印刷業實務上「大額補收」的金額分界（如 50K / 100K / 200K）
- 業務主管接收 Slack 通知的頻率忍受度（每日 / 每週 / 每月 N 則）

## 來源

- erp-consultant Phase 3 C-PM-3 反向挑戰（unify-billing-installment-and-reconciliation-csv change）
- design.md § Open Questions OQ-BI-4
- Prototype 程式碼：`src/types/orderAdjustment.ts` `SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD`
