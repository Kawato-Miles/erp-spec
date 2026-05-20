---
type: open-question
module:
  - order-management
oq-id: ORD-003
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: Miles (plan 階段)
source-link: openspec/changes/refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../06-state-machines/訂單狀態]]
related-oq:
related-change: refine-after-sales-refund-and-add-supplementary-print
expected-resolution-at:
---

# ORD-003：建立退款 Payment 後若發現錯誤，取消 Payment 是否自動回退 OA 為「已核可」

## 背景

本 change 設計：退款 Payment 建立同一 transaction 自動推進 OA 為「已執行」（包含 OA.status / executedAt 寫入）。

但若業務建完 Payment 後發現錯誤（金額打錯 / 對帳附件傳錯 / 退款日期誤填），現在的設計無「取消 Payment 順帶回退 OA」的機制。OA 一旦「已執行」就鎖定（不可改）。

## 問題

取消已建立的退款 Payment 時，系統應該如何處理關聯的 OA？

候選做法：

1. **自動回退 OA 為「已核可」**：Payment 取消 = OA 取消執行；OA 回到可改金額狀態；業務修正後重建 Payment
2. **OA 維持「已執行」不變，業務必須建反向 Payment**：取消 Payment = 建一筆 +5000（反向）的 Payment 而非真的刪除；OA 維持「已執行」記錄歷史
3. **禁止取消已建退款 Payment**：業務必須一次性確認；若真的錯誤要走「客訴 → 開新 ticket」路徑

## 影響範圍

- 影響業務操作體驗（誤建 Payment 的修正路徑）
- 影響 audit 追溯（取消 vs 反向 Payment 的歷史差異）
- 影響資料一致性 invariant（本 change 寫入「OA 已執行 → 必有關聯 refund Payment」）

## 待釐清

- 業務誤建退款 Payment 的實際頻率（待 UAT 實證）
- 會計觀點：取消 Payment 與反向 Payment 在帳務記錄上的差異
- 若已開過發票 + 折讓單，取消 Payment 是否連帶取消折讓單（聯動更複雜）

## 來源

- Miles plan 階段反饋（風險評估）
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § OQ-3
