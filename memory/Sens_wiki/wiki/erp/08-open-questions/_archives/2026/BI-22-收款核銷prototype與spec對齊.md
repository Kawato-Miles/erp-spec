---
type: open-question
module:
  - 訂單管理
oq-id: BI-22
status: answered
priority: medium
audience: internal
raised-at: 2026-06-15
raised-by: 三方比對 P1/P2（P1-f / P2-e / P2-f）
source-link: /tmp/訂單管理三方比對報告-2026-06-14.md
related-vault:
  - "[[款項狀態]]"
  - "[[帳務]]"
related-oq: []
expected-resolution-at:
---

# BI-22：收款核銷 prototype 與 spec/BRD 對齊（月結機制 + 稽核事件模型）

## 裁決與結案（Miles，2026-06-15）

- **月結閉檔鎖設計直接取消**：prototype `lockedByPeriodClose` 與月結批次機制不採用，款項可編輯性以「款項完成條件（對帳附件 + 入帳期次分配）」控制（見 [[款項狀態]]）。lockedByPeriodClose 欄位待 prototype 移除。
- **誰接住剩餘實作**：lockedByPeriodClose 移除 + 稽核事件模型 SET 收斂（移除已廢 OVERRIDDEN/ADJUSTED_AFTER_COMPLETE、實作 PAYMENT_ALLOCATION_SET、spec 補 PRE_COMPLETION）+ adjustPaymentAllocationsAfterComplete 改寫，統一歸入「收款核銷 prototype 對齊 change」（非待裁決問題，屬 prototype 實作對齊正本）。
- 本 OQ 結案封存。

## 問題描述

訂單管理三方比對發現 prototype 的收款核銷（PaymentAllocation）在三處落後 spec / 與 Miles 拍板的 BRD 不符，皆屬 prototype 端重構（wiki 正本與 spec 方向已定）：

1. **月結閉檔鎖機制不採（P1-f）**：prototype `paymentAllocation.ts` 有 `lockedByPeriodClose` 欄位（月結批次跑完鎖定核銷分配）。但 Miles 2026-06-15 拍板：款項切已完成的條件＝上傳對帳附件＋完成入帳期次核銷分配，**不採月結閉檔機制**。故 prototype 的月結鎖與此設計意圖不符，wiki [[款項狀態]] 已記錄正確規則。
2. **稽核事件模型落後 spec（P2-e）**：spec order-billing 已把核銷稽核事件收斂為單一 `PAYMENT_ALLOCATION_SET`，但 prototype `orderActivityLog.ts` 仍保留 spec 已廢的 `PAYMENT_ALLOCATION_OVERRIDDEN`、`PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE` 兩事件、且未實作 SET；反向 spec 計費事件表缺 prototype 已實作的 `PRE_COMPLETION_AMOUNT_DECREASE`。
3. **完成後調整分配（P2-f）**：prototype `adjustPaymentAllocationsAfterComplete` action 掛在 spec 已廢事件上。

三方影響：純稽核軌跡事件標籤命名 + 收款變更率 KPI 計算來源一致性；不影響業務操作或金額。

## 涉及範圍

- 模組：order-billing（款項與發票）
- 相關卡：[[款項狀態]]、[[帳務]]（§收款核銷分配）
- 影響檔（prototype）：`paymentAllocation.ts`、`orderActivityLog.ts`、`store/useErpStore.ts`、相關 mock 與 e2e

## 討論記錄

- 2026-06-15 三方比對 P1/P2，Miles 對 P2-e/P2-f「看不懂商業情境」——確認此為程式內部技術整理、不影響業務內容，故開 OQ 延後，不在本輪 sync 動。
- P1-f 的 wiki 規則（切已完成＝附件＋期次分配、不用月結）已寫入 [[款項狀態]]；本 OQ 追蹤 prototype 端對齊（移除月結鎖機制殘留）。

## 待解答

- [ ] prototype `lockedByPeriodClose` 月結鎖欄位是否移除（對齊「不用月結」）？或保留為他用？
- [ ] 稽核事件 enum 收斂為 SET 模型（移除兩個已廢事件、補 SET）+ spec 計費事件表補 PRE_COMPLETION，何時排程（建議併收款核銷模組下一輪 change）？
- [ ] `adjustPaymentAllocationsAfterComplete` 改寫為 SET 事件後行為是否一致？

## 候選方案（若有）

### 方案 A：併收款核銷下一輪 change 一次重構（建議）
- 優點：跨檔重構（型別 / store / mock / e2e）集中做、完整驗證
- 缺點：落後期間 prototype 試用的稽核事件型別與 spec 不符，試用反饋需註記

### 方案 B：立即逐項對齊
- 優點：即時消除三方不一致
- 缺點：分散多次改動、e2e 重跑成本
