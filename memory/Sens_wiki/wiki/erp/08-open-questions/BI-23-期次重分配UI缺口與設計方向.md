---
type: open-question
module:
  - 訂單管理
oq-id: BI-23
status: open
priority: medium
audience: internal
raised-at: 2026-06-15
raised-by: 三方比對 P2-g
source-link: /tmp/訂單管理三方比對報告-2026-06-14.md
related-vault:
  - "[[分期請款狀態]]"
  - "[[對帳一致性]]"
related-oq: []
expected-resolution-at:
---

# BI-23：期次重分配的 UI 缺口與設計方向

## 問題描述

訂單管理三方比對 P2-g 揭露請款期次「重分配」在三方的不一致與缺口：

- **Miles 2026-06-15 拍板的方向**：期次金額重分配由業務自由控制，**不做合計判斷或警示**（因實務上不見得是一期拆兩期，可能整筆訂單重新分配期次，故拆期層級的合計判斷/警示沒有意義）；一致性只靠「應收 / 發票淨額 / 收款淨額」三軸對帳的警示語比對兜底。
- **prototype 現況**：「拆此期」按鈕與 `BillingInstallmentSplitDialog` 已於 unify-billing Layer 3 cutover **從業務 UI 移除**（`OrderBillingInstallmentSection.tsx`、`BillingInstallmentListCard.tsx` 註解確認，元件僅留作 reference、e2e 因此一直 skip）；`splitBillingInstallment` store action 仍在。即現況**沒有任何期次重分配的 UI 入口**。
- **spec 現況**：order-billing 仍描述「拆期原期次取消 + 兩筆平輩期次」Scenario（拆期 1→2 模型）。

三方落差：Miles 要的「業務自由重分配期次」是 prototype 未實作的功能（拆期 UI 已砍、自由重分配未做），spec 仍停在已退役的拆期 1→2 模型。

## 涉及範圍

- 模組：order-billing（請款期次）
- 相關卡：[[分期請款狀態]]、[[對帳一致性]]（三軸對帳兜底）
- 影響：期次管理 UI 設計（新功能）、order-billing spec 拆期 Scenario 對齊、prototype reference 元件去留

## 討論記錄

- 2026-06-15 P2-g：原以為 prototype 拆期有「兩期合計＝原期次」硬擋需移除，重驗發現拆期 UI 已於 Layer 3 cutover 移除、硬擋在死元件中（不在實際畫面），故不動 prototype。
- Miles 方向確立但功能未設計，先開 OQ 追蹤。

## 待解答

- [ ] 期次重分配的 UI 設計：是否提供「整筆訂單期次重新規劃」介面（取代已退役的 1→2 拆期）？
- [ ] 重分配時不做合計判斷/警示，僅靠三軸對帳警示——對帳檢視的警示語是否已涵蓋「期次合計 vs 應收」差異提示？
- [ ] order-billing spec 拆期 Scenario 是否改寫為「期次自由重分配」模型、或標記為已退役？
- [ ] reference-only 的 `BillingInstallmentSplitDialog` 元件與其 e2e 是否清除（dead code）？

## 候選方案（若有）

### 方案 A：另開 change 設計期次重分配功能
- 優點：完整實作 Miles 要的自由重分配 + 同步 spec
- 缺點：屬新功能，工作量較大

### 方案 B：先只對齊 spec（標記拆期 Scenario 退役）+ 清 dead code，UI 待排程
- 優點：先消除 spec 與 prototype 的描述漂移
- 缺點：業務要的重分配功能仍未到位
