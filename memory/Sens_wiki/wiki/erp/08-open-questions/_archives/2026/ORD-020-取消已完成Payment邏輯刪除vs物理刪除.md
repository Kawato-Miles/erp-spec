---
type: open-question
module:
  - 訂單管理
oq-id: ORD-020
status: answered
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: senior-pm 前期介入
source-link: openspec/changes/add-payment-status-and-decouple-oa-execution/design.md
resolved-at: 2026-05-26
resolved-by: complete-payment-status-ui-and-followups change
related-vault:
  - [[../05-entities/訂單]]
related-oq:
  - ORD-003
related-change: add-payment-status-and-decouple-oa-execution
---

# ORD-020：取消已完成 Payment 的刪除模式（邏輯 vs 物理）

## 決議（2026-05-26 complete-payment-status-ui-and-followups change resolve）

採「候選做法 2：邏輯刪除 + 顯示劃線標註」，依 paymentStatus 分支：

- **paymentStatus = '處理中' → 物理刪除**（從 Order.payments 陣列移除）：無稽核需求（業務預登記未實際發生、刪除等於放棄此登記）
- **paymentStatus = '已完成' → 邏輯刪除**：Payment 新增 cancelled / cancelReason / cancelledAt 三欄位；不從陣列移除；保留稽核軌跡

實作細節：

1. Payment Data Model 加 `cancelled: boolean`（必填、預設 false）、`cancelReason: string`（cancelled = true 時必填）、`cancelledAt: string | null`（必填 ISO 8601）
2. `cancelPayment(paymentId, options)` 對已完成 Payment 行為：若 options.cancelReason 為空字串 → 拒絕（必填驗證）；通過則設 cancelled = true / cancelReason / cancelledAt = now、不從陣列移除
3. `calcOACompletedPaymentsTotal` 與對帳面板收款淨額計算 SHALL 排除 cancelled = true 的 Payment（既有 OA 回退邏輯自動觸發）
4. OrderPaymentSection 列表預設隱藏 cancelled = true row、提供「顯示已取消」toggle 切換可見性
5. 已取消 row 顯示：grey Badge「已取消」+ cancelReason hover tooltip + line-through 視覺
6. mock data 一次性 backfill：所有既有 Payment 設 cancelled = false / cancelReason = '' / cancelledAt = null

## 不採用的候選

- **候選 1 物理刪除**：破壞審計連續性、會計實務抗拒、棄用
- **候選 3 反向 Payment 對沖**：增加 Payment 筆數複雜度、業務理解難（為何同一筆款項看到雙筆紀錄）、棄用

## 設計理由

已完成 Payment 代表「實際金流已發生且對帳已過」，物理刪除會造成稽核軌跡缺失（無法回查「為什麼這筆 Payment 不見了」）。處理中 Payment 屬於「業務預登記未實際發生」，刪除等於放棄此登記、無稽核需求。雙態分支符合「實際發生事件不可抹除」會計準則。

復原機制暫不支援（取消後不可逆）：若業務後悔、需手動建新 Payment 重做 — 等同重新發生交易、符合會計事實。

## 實作

- types/payment.ts、types/order.ts 加三欄位
- store.cancelPayment 改寫（邏輯 / 物理分支 + cancelReason 必填）
- calcOACompletedPaymentsTotal / calcPaymentsNetAmount / calcRegularPaymentsAmount / calcRefundsAmount / calcPendingPaymentsAmount 全部過濾 cancelled
- OrderPaymentSection 列表 cancelled toggle + Badge + line-through 視覺
- PaymentEditPanel 取消模式（cancelReason input）

## 原 OQ 內容（保留歷史）

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
