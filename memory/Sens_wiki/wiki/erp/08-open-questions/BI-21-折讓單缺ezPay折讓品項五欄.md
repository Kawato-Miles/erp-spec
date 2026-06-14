---
type: open-question
module:
  - 訂單管理
oq-id: BI-21
status: open
priority: medium
audience: internal
raised-at: 2026-06-15
raised-by: 三方比對（訂單管理 prototype/wiki/spec 一致性稽核）
source-link: /tmp/訂單管理三方比對報告-2026-06-14.md（P0#1(b)）
related-vault:
  - "[[帳務]]"
  - "[[發票法規硬約束-ezPay-MIG]]"
related-oq: []
expected-resolution-at:
---

# BI-21：折讓單（SalesAllowance）缺 ezPay 折讓商品五欄

## 問題描述

ezPay 開立折讓 API（`allowance_issue`，見 [[發票法規硬約束-ezPay-MIG]] §4.2）要求帶「折讓商品五欄」：品名（ItemName）/ 數量（ItemCount）/ 單位（ItemUnit）/ 單價（ItemPrice）/ 小計（ItemAmt），結構同發票品項五欄。

但三方現況皆只記折讓「總金額」、無品項：

- **prototype**：`src/types/salesAllowance.ts` 的 `SalesAllowance` 介面無 `items` 陣列，只有 `allowanceAmount`（總額）。
- **wiki**：`05-entities/帳務.md` §折讓單欄位表只列「折讓金額 / 剩餘 / 原因 / 狀態 / 折讓單號 / 作廢原因 / 回簽附件」，無品項。
- **spec**：order-billing 折讓單 Requirement 同樣只述總額層。

落差：與 ezPay 折讓單法定所需資料不一致——真正送 ezPay 時需逐項品名/數量/單價，現況無處承載。

## 涉及範圍

- 模組：order-billing（款項與發票）
- 相關卡：[[帳務]]（§折讓單）、[[發票法規硬約束-ezPay-MIG]]（§4.2）
- 影響範圍：折讓單結構性欄位新增——wiki 帳務卡折讓單欄位表加品項、spec 對應 Requirement、prototype `SalesAllowance` 加 `items` 陣列 + UI 折讓 dialog 改為五欄輸入（現為單一金額輸入）

## 討論記錄

- 2026-06-15 三方比對 P0#1：確認折讓金額符號正本為正值（已修 prototype 寫入端與 mock），同時發現折讓品項五欄缺口。
- Miles 裁決：折讓符號本輪修正；**折讓品項五欄結構新增本輪不做，開本 OQ 延後**（避免本次同步 scope creep）。

## 待解答

- [ ] 折讓單是否需比照發票加「折讓商品五欄」品項結構（wiki + spec + prototype + UI dialog）？
- [ ] 若加，折讓品項預設帶入規則（從原發票品項帶入後可改，比照開立發票）？
- [ ] Mockup 階段是否先以「單一總額」近似、品項五欄留正式串接 ezPay 時再補？

## 候選方案（若有）

### 方案 A：加折讓商品五欄（完整對齊 ezPay）
- 優點：與 ezPay `allowance_issue` 法定所需資料一致，正式串接無缺口
- 缺點：結構性新增，動 wiki / spec / 型別 / UI dialog，動面較大

### 方案 B：Mockup 維持單一總額，品項延至正式串接
- 優點：改動面小，不阻擋本輪同步
- 缺點：與 ezPay 所需資料暫不一致，正式串接時仍須補
