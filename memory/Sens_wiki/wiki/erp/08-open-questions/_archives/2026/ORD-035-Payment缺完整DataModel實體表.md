---
type: open-question
module:
  - 訂單管理
oq-id: ORD-035
status: answered
priority: medium
audience: internal
raised-at: 2026-06-03
raised-by: Claude（資料欄位 DB 發布對齊揭露）
source-link: 訂單管理實作規格盤點
related-vault:
  - "[[訂單]]"
  - "[[付款發票邏輯]]"
related-oq:
  - BI-17
answered-at: 2026-07-31
answered-by: Miles
tags:
  - 領域/款項與發票
---

# ORD-035：Payment 缺完整 Data Model 實體表（阻 Notion schema 完整推送）

## 問題描述

訂單域 Payment（款項）已是付款正本模型（polymorphic 掛 Order / ConsultationRequest，取代舊 OrderPaymentRecord），但 openspec order-management spec **未寫 Payment 完整 Data Model 實體欄位表**——欄位散落各 Requirement（polymorphic FK、paymentMethod、paymentStatus、amount、cancel 三欄、linkedOrderAdjustmentId）。`Payment.id` / amount 型別 / paidAt / createdAt / createdBy 等基礎欄位無正式 Data Model 行號可引。

與 [[BI-17-BillingInstallment缺完整DataModel實體表]]（BillingInstallment 同類缺口）並列：兩個核心實體都缺權威欄位表，導致 Notion 資料欄位 DB 只能推已查證欄位、無法推完整。

## 涉及範圍

- 模組：order-management（Data Model）
- 相關卡：[[訂單]]、[[付款發票邏輯]]、BI-17
- 影響：Notion 資料欄位 DB Payment / BillingInstallment 表完整度（本次只推已查證欄位 + 標另案）

## 待解答

- [x] 是否另案補完整欄位表 → 已補，但落點不是 OpenSpec：欄位正本 2026-06-09 起歸 wiki 實體卡，[[帳務]] § 欄位（業務可見）的收款紀錄段即現行正本
- [x] 欄位來源 → 同上，已彙整成單一權威表
- [x] 對齊外部發布 → 以 wiki 欄位表為來源

## 決議（2026-07-31，Miles）

與 [[BI-17-BillingInstallment缺完整DataModel實體表]] 同批結案，同一理由：本卡前提（欄位表該補在 OpenSpec Data Model）已因分工變更失效，欄位正本歸 wiki 實體卡、OpenSpec 不再承載欄位表。
