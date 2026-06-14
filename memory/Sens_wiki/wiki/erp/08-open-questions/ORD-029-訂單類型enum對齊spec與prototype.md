---
type: open-question
module:
  - 訂單管理
oq-id: ORD-029
status: open
priority: medium
audience: internal
raised-at: 2026-06-02
raised-by: erp-consultant（enhance-order-list-filter 輕量審查）
source-link: openspec/changes/enhance-order-list-filter（erp-consultant 輕量審查 SHOULD-fix）
related-vault:
  - "[[訂單]]"
related-oq: []
expected-resolution-at:
---

# ORD-029：訂單類型（order_type）enum 在 spec 與 prototype 不一致

## 問題描述

訂單類型 enum 在規格與 prototype 兩邊的值與用詞不一致：

- **spec**（`openspec/specs/order-management/spec.md` § 訂單建立 L46）：`order_type` = 「線下 / 線上 / 諮詢」**三值**。
- **prototype**（`sens-erp-prototype/src/pages/OrderList.tsx` L34）：`ALL_ORDER_TYPES` = 「線下單 / 線上單EC / 客製單」，且 L44-49 styles map 另含「諮詢訂單」，共出現 **4 種**顯示值。
- 落差：spec 無「客製單」；spec「諮詢」vs prototype「諮詢訂單」用詞不一；prototype「線下單 / 線上單EC」帶後綴。

## 涉及範圍

- 模組：order-management
- 相關卡：[[訂單]]
- 影響範圍：訂單建立的類型指派、訂單列表「訂單類型」篩選（enhance-order-list-filter 將其正式寫入篩選欄位集，使此落差更顯眼）、任何依 order_type 分流的下游邏輯

## 討論記錄

- 此為 enhance-order-list-filter change 之前就存在的落差，**非該 change 引入**。
- erp-consultant 對 enhance-order-list-filter 的輕量審查點出：因本次把「訂單類型」明列進訂單列表篩選欄位集（US-ORD-009），放大了 spec ↔ prototype 枚舉不一致的可見性。
- 建議不在 enhance-order-list-filter 內修正（避免 scope creep），開本 OQ 留專門 change 處理。

## 裁決（Miles，2026-06-15）

三方比對（prototype / wiki / spec 訂單類型枚舉互不一致）後拍板：

- **正本訂單類型先統一為三值：線下單 / 線上單 / 諮詢單**（單維，用詞帶「單」）。
- prototype 既有「線上單EC」併入「線上單」；prototype 的「客製單」與 spec 的「點數」**本輪先不收斂，待後續 EC 整合再處理**。
- 故本輪**不動** prototype / spec 的 order_type 枚舉，僅記錄此決定；EC 值收斂屬後續 EC 整合 change 的範疇。

## 待解答（剩餘）

- [x] 訂單類型 enum 以何者為準 → 已裁決：三值（線下單 / 線上單 / 諮詢單）。
- [x] 用詞統一 → 已裁決：帶「單」（線下單 / 線上單 / 諮詢單）。
- [ ] 「客製單」與「點數」如何併入三值（待 EC 整合處理）。
- [ ] 對齊後依 order_type 分流的下游邏輯（諮詢訂單終態收斂、B2B / B2C 分流）影響盤點（隨 EC 整合一併處理）。

## 候選方案（若有）

### 方案 A：prototype 收斂為 spec 三值
- 優點：spec 為規格正本，prototype 對齊單一來源
- 缺點：prototype 既有「客製單」顯示值需釐清歸屬（併入哪一類），可能涉及既有訂單資料

### 方案 B：spec 擴充對齊 prototype 現況
- 優點：貼近 prototype 已實作現況，改動面小
- 缺點：需確認「客製單」是否為正式業務分類、與「諮詢訂單」關係
