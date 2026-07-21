---
type: open-question
module:
  - 訂單管理
business-domain:
  - 履約與售後
oq-id: ORD-040
status: open
priority: medium
audience: internal
raised-at: 2026-06-01
raised-by: doc-audit（align-business-consultation-coverage-gaps archive 合併後驗收）
source-link: openspec/changes/archive/2026-06-01-align-business-consultation-coverage-gaps/
related-oq: []
---

# ORD-040：印件 shipment_quantity 與既有 pi_shipped_qty 出貨數量欄位重疊

## 問題描述

`align-business-consultation-coverage-gaps` change 新增 Requirement「多印件分次出貨追蹤」，於印件（PrintItem）新增 `shipment_quantity`（累計已出貨數量）。但 main order-management § Data Model 印件表**既有 `pi_shipped_qty`（出貨數量）**，兩者語意疑似重疊（皆為已出貨量）。

合併後 main § Data Model 印件表同時存在：
- `pi_shipped_qty | 出貨數量`（既有，約 L4127）
- `shipment_quantity | 累計已出貨數量`（新增，L4128；NOT NULL 預設 0、MUST NOT 超過入庫量）

## 涉及範圍

- 模組：order-management（fulfillment-after-sales 領域）/ 印件實體
- 既有：`pi_shipped_qty`
- 新增：`shipment_quantity`（多印件分次出貨追蹤 + 印件出貨狀態三態：未出貨 / 部分出貨 / 已出貨）
- 影響：印件出貨狀態自動推進依哪個欄位；出貨單分次進度計算

## 待解答

- [ ] `pi_shipped_qty` 與 `shipment_quantity` 是否同一語意？若是，收斂為單一欄位（保留何者命名）？
- [ ] 既有 `pi_shipped_qty` 是否已有 Requirement / Prototype 依賴？收斂時的遷移影響為何？
- [ ] 印件出貨狀態三態推進（本 change 新增）應綁定收斂後的單一欄位。

## 候選方案（若有）

### 方案 A：收斂為單一欄位（建議方向，待 Miles 確認）
- 二擇一保留（命名待定），「多印件分次出貨追蹤」的三態推進與「MUST NOT 超過入庫量」約束綁定保留欄。
- 優點：單一正本、無歧義。
- 缺點：需查既有 `pi_shipped_qty` 依賴並遷移，重寫 main § Data Model 印件表。

### 方案 B：兩欄各有語意則保留並明示差異（待確認是否真有差異）
- 若 `pi_shipped_qty` 為單次 / 某語意、`shipment_quantity` 為跨出貨單累計，則保留並在欄位說明明示。
- 缺點：兩個「出貨數量」欄位易混淆，需強說明。

## 處理決定（Miles 2026-06-01）

留待**以後的 change** 收斂（不在 align- archive 當下改正本）。本 OQ 維持 open，待後續 change 決定 pi_shipped_qty / shipment_quantity 二擇一與印件出貨三態綁定欄位。
