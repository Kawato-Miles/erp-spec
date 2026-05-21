---
type: open-question
module:
  - order-management
oq-id: ORD-020
status: open
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: senior-pm 前期介入
source-link: openspec/changes/add-payment-status-and-decouple-oa-execution/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq:
  - ORD-003
related-change: add-payment-status-and-decouple-oa-execution
expected-resolution-at: 2026-Q3
---

# ORD-020：取消已完成 Payment 的刪除模式（邏輯 vs 物理）

## 背景

add-payment-status-and-decouple-oa-execution change 設計：

- 「取消 Payment」action（store.cancelPayment）：處理中直接刪除；已完成可能觸發 OA 回退（resolve ORD-003）

Prototype 階段採用「物理刪除」（mock data 從陣列移除）。但 senior-pm 前期介入指出會計實務上抗拒「刪除已對帳憑證」，因審計需要連續編號 / 異動軌跡。

## 問題

「取消已完成 Payment」應該是邏輯刪除（保留紀錄、劃線標註）還是物理刪除（從資料層移除）？

候選做法：

1. **物理刪除**（Prototype 暫定）：從 `Order.payments[]` 陣列移除；簡單但破壞審計連續性
2. **邏輯刪除 + 顯示劃線標註**：Payment 加 `cancelled: boolean` + `cancelledAt` + `cancelledReason` 欄位；對帳面板與列表顯示「已取消」row（劃線、灰底）；不計入收款淨額
3. **邏輯刪除 + 反向 Payment 對沖**：建一筆反向 Payment（amount 相反符號）對沖，原 Payment 保留不動；審計上看到「先收 X、再退 X」雙筆紀錄

## 待釐清

- 會計實務的審計需求（是否真要求連續編號）
- 異動軌跡保留期限（多久後可清理）
- 對帳面板對「已取消」row 的顯示方式（劃線 / 不顯示 / 收合）
- 與 invoice 作廢機制（Invoice.status = 作廢，已實作）的一致性
- 取消後是否可「復原」（business 流程可逆性）

## 影響範圍

- 影響會計審計（邏輯刪除 vs 物理刪除）
- 影響 mock data / DB schema 設計（加 cancelled 相關欄位）
- 影響對帳面板顯示複雜度
- 影響「處理中 Payment 老化率」「款項資料齊備率」KPI 定義

## 來源

- senior-pm agent 前期介入（2026-05-21）
- change `add-payment-status-and-decouple-oa-execution` design.md § Risks 4 + § Open Questions OQ 3
