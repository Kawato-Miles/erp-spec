---
type: open-question
module:
  - 訂單管理
oq-id: ORD-035
status: open
priority: medium
audience: internal
raised-at: 2026-06-03
raised-by: Claude（資料欄位 DB 發布對齊揭露）
source-link: openspec/specs/order-management/spec.md（Payment 欄位散列各 Requirement，無完整 Data Model 表）
related-vault:
  - "[[訂單]]"
  - "[[付款發票邏輯]]"
related-oq:
  - BI-17
---

# ORD-035：Payment 缺完整 Data Model 實體表（阻 Notion schema 完整推送）

## 問題描述

訂單域 Payment（款項）已是付款正本模型（polymorphic 掛 Order / ConsultationRequest，取代舊 OrderPaymentRecord），但 openspec order-management spec **未寫 Payment 完整 Data Model 實體欄位表**——欄位散落各 Requirement（polymorphic FK、paymentMethod、paymentStatus、amount、cancel 三欄、linkedOrderAdjustmentId）。`Payment.id` / amount 型別 / paidAt / createdAt / createdBy 等基礎欄位無正式 Data Model 行號可引。

與 [[BI-17-BillingInstallment缺完整DataModel實體表|BI-17]]（BillingInstallment 同類缺口）並列：兩個核心實體都缺權威欄位表，導致 Notion 資料欄位 DB 只能推已查證欄位、無法推完整。

## 涉及範圍

- 模組：order-management（Data Model）
- 相關卡：[[訂單]]、[[付款發票邏輯]]、BI-17
- 影響：Notion 資料欄位 DB Payment / BillingInstallment 表完整度（本次只推已查證欄位 + 標另案）

## 待解答

- [ ] 是否另案補 Payment 完整 Data Model 實體表於 order-management（或 prototype-data-store）§ Data Model
- [ ] 欄位來源：自 prototype store 型別 + 各 Requirement 彙整為單一權威表
- [ ] 補齊後再對齊 Notion 資料欄位 DB 完整欄位（與 BI-17 一併處理）
