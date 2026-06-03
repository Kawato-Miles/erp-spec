---
type: open-question
module:
  - order-management
oq-id: ORD-033
status: open
priority: high
audience: internal
raised-at: 2026-06-03
raised-by: Claude（訂單發布迭代對齊 US-ORD-011/013）
source-link: openspec/specs/order-management/spec.md § 訂單取消流程（約 L215-228，殘留舊退款序列）
related-vault:
  - "[[訂單]]"
  - "[[訂單異動規則]]"
related-oq:
  - ORD-003
  - ORD-031
---

# ORD-033：兩條退款路徑關係釐清 + main spec 舊退款序列是否收斂至訂單收退款模型重構

## 問題描述

訂單模組目前存在兩條語意不同的退款描述：

1. **EC 取消退款序列**「退款申請 → 退款處理中 → 已退款」：殘留於 main spec order-management § 訂單取消流程（約 L215-228），尚未被 2026-06-02 訂單收退款模型重構 change 對齊。US-ORD-011 前置條件原引用此序列。
2. **訂單收退款模型重構 退款核銷應退差額**：退款 OA 業務主管核可即生效（已執行）+ 退款 Payment 切「已完成」核銷「收款淨額 − 應收」的應退差額，不綁單一 OA 累計、不進期次。

US-ORD-011/013 已改寫為訂單收退款模型重構 模型，但兩條路徑（EC 取消退款 vs 訂單收退款模型重構 應退差額核銷）的關係、以及 main spec § 訂單取消流程舊序列是否需另案收斂，尚未釐清。

## 涉及範圍

- 模組：order-management（狀態機 / 訂單取消流程）
- 相關卡：[[訂單]]、[[訂單異動規則]]、US-ORD-011、US-ORD-013
- 影響：main spec 一致性；退款相關 user story 的前置條件與 source 錨點

## 待解答

- [ ] main spec § 訂單取消流程 L215-228 的「退款申請 → 退款處理中 → 已退款」是否需另開 change 收斂至訂單收退款模型重構 退款模型，或刻意保留為 EC 取消的獨立路徑？
- [ ] 兩條退款路徑（EC 取消退款 vs 訂單收退款模型重構 應退差額核銷）在資料模型與狀態機上如何共存／區隔？
