---
type: open-question
module:
  - order-management
oq-id: ORD-019
status: open
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: senior-pm 前期介入
source-link: openspec/changes/add-payment-status-and-decouple-oa-execution/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
related-change: add-payment-status-and-decouple-oa-execution
expected-resolution-at: 2026-Q3
---

# ORD-019：會計實務對「處理中 Payment」的應收應付處理

## 背景

add-payment-status-and-decouple-oa-execution change 設計：

- 處理中 Payment 不計入對帳收款淨額
- 對帳面板顯示「處理中（合計，不計入）」資訊軸 + 差額 hint「另含處理中款項 K 元，齊備後將計入」

senior-pm 前期介入指出：會計實務上「期末結帳」會盤點當期所有應收應付。處理中 Payment 是否要納入應收 / 應付帳列？plan 與本 change 假設「不入帳」（對帳收款淨額只計已完成），但會計實務未確認。

## 問題

期末結帳時會計對「處理中 Payment」的合理處理方式是什麼？

候選做法：

1. **完全不入帳**（本 change 預設）：處理中 Payment 只在對帳面板顯示資訊軸，不納入應收 / 應付計算
2. **入應收 / 應付帳列**：處理中 Payment 視為「待確認的應收 / 應付」、納入期末結帳，月底前若未切「已完成」需會計手動處理（轉應收呆帳 / 沖銷）
3. **分階段入帳**：上半月處理中可入應收暫估、下半月處理中視同帶疑問項，會計每月底決定是否預提

## 待釐清

- 會計實務的應收應付分類規則（是否真有「處理中應收」這個分類）
- 對帳面板是否需要「處理中應收 / 處理中應付」獨立顯示（除既有「處理中合計」資訊軸外）
- 是否需要會計獨立 dashboard 顯示處理中狀態
- 與 ORD-018（處理中老化追蹤）的整合方式

## 影響範圍

- 影響會計工作量（事前自動納入 vs 事後手動處理）
- 影響對帳面板顯示設計（一個 vs 多個分軸）
- 影響「款項資料齊備率」KPI 定義（如何算齊備）

## 來源

- senior-pm agent 前期介入（2026-05-21）
- change `add-payment-status-and-decouple-oa-execution` design.md § Risks 3 + § Open Questions OQ 2
