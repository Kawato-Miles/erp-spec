---
type: open-question
module:
  - consultation-request
  - order-management
oq-id: CR-6
status: open
priority: medium
audience: internal
raised-at: 2026-05-29
raised-by: Claude (opsx:explore 諮詢取消收斂)
source-link: opsx:explore「諮詢取消收斂到一般訂單取消流程」討論（2026-05-29，plan：~/.claude/plans/stateful-chasing-hennessy.md）
related-vault:
  - [[../05-entities/諮詢單]]
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
  - CR-5
related-change: converge-consultation-cancel-to-order-cancel-flow（規劃中）
expected-resolution-at: propose 階段
---

# CR-6：諮詢取消專屬「自動建待開發票」是否完全廢除

## 問題描述

諮詢取消收斂到一般訂單取消流程後，諮詢專屬的「自動建待開發票（BillingInstallment, `source_type=consultation_cancellation`）」是否完全廢除、改用一般訂單取消的發票開立路徑？

需確認廢除後 `source_type` 語意是否保留、既有 mock 資料如何處理。

## 涉及範圍

- 模組：consultation-request（諮詢取消）、order-management / billing（發票開立）
- 相關卡：[[../04-business-logic/付款發票邏輯]]
- 影響範圍：unify-billing 剛建的諮詢取消雙寫邏輯（`source_type=consultation_cancellation`）、prototype mock 資料、BillingInstallment 建立規則

## 討論記錄

- 現況（unify-billing 2026-05-28）：諮詢取消自動建 BillingInstallment(scheduledAmount=1000, source_type=consultation_cancellation) 作為待開發票提醒。
- 收斂方向：諮詢取消改走一般訂單取消流程，善後（發票開立 + 退款款項紀錄）沿用一般訂單。
- 衝突點：一般訂單取消是否也有「自動建待開發票」？若無，諮詢取消的自動建是否屬專屬例外，應廢除？

## 待解答

- [ ] 諮詢取消是否完全廢除自動建 BillingInstallment、改諮詢人員手動開一般發票
- [ ] `source_type=consultation_cancellation` 語意保留（作為標記）或移除
- [ ] 既有 mock 資料（含 source_type=consultation_cancellation 的 BillingInstallment）如何遷移
- [ ] 一般訂單取消後留收入的「待開發票提醒」機制是否需要（連動 BI-15 對帳完整性）

## 候選方案

### 方案 A：完全廢除自動建，走一般發票開立
- 優點：消除諮詢專屬例外、與一般訂單取消一致
- 缺點：失去「待開發票提醒」，諮詢人員可能忘記開那 1000 發票（需其他提醒機制）

### 方案 B：保留自動建 BillingInstallment 作為待開提醒，只改訂單狀態
- 優點：保留提醒、改動最小
- 缺點：諮詢專屬邏輯未消除（與收斂目標部分背離）
