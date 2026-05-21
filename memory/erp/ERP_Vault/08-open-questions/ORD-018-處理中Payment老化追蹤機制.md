---
type: open-question
module:
  - order-management
oq-id: ORD-018
status: open
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: Miles + senior-pm 前期介入
source-link: openspec/changes/add-payment-status-and-decouple-oa-execution/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
related-change: add-payment-status-and-decouple-oa-execution
expected-resolution-at: 2026-Q3
---

# ORD-018：處理中 Payment 老化追蹤機制

## 背景

add-payment-status-and-decouple-oa-execution change 引入 paymentStatus（處理中 / 已完成）讓業務可「先填一半、陸續補齊資料」。但若業務嫌麻煩規避（建了「處理中」就忘了回來切「已完成」），會造成：

- 對帳長期掛帳、OA 永遠不推進已執行
- 比現狀（建立即完成）更糟，因為現狀至少 OA 會立即推進

senior-pm 前期介入指出此「業務嫌麻煩規避」風險，但 plan 與 change 範圍不含老化追蹤機制（留 follow-up）。

## 問題

處理中 Payment 超過 X 天未切「已完成」時，系統應如何提醒？

候選做法：

1. **被動列表標示**：列表頁標示「處理中 N 天」（如 N > 7 變紅、N > 14 變更醒目）
2. **主管看板可見度**：業務主管打開訂單列表時看到「處理中 Payment 超過 X 天清單」（看板形式）
3. **主動推播提醒**：Slack 通知對應業務或主管「Payment-XXX 處理中已 N 天，請補齊資料或取消」
4. **以上組合**：被動列表標示 + 主管看板 + Slack 通知

## 待釐清

- 老化閾值 X 的合理值（業務真實處理金流的合理時程）
- 不同 paymentMethod 是否有不同閾值（如：銀行轉帳 vs 信用卡 vs 退款）
- 主管角色定義（業務主管 / 印務主管 / 會計）對「處理中老化」的關注度
- 是否需要與訂單其他「未完成項目」清單（出貨待出、印件待補件等）合併到統一的「待辦事項」儀表板

## 影響範圍

- 影響業務日常操作（被動列表 vs 主動推播差異大）
- 影響主管工作量（是否要每天看處理中清單）
- 影響「老化率」KPI 監測（design.md § 成功指標）

## 來源

- senior-pm agent 前期介入指出「業務嫌麻煩規避」風險（2026-05-21）
- change `add-payment-status-and-decouple-oa-execution` design.md § Risks 1 + § Open Questions OQ 1
