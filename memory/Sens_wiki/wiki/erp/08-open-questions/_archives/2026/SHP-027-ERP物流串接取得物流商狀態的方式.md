---
type: open-question
module:
  - 出貨
tags:
  - 領域/履約與售後
oq-id: SHP-027
status: answered
priority: high
audience: internal
raised-at: 2026-10-23
answered-at: 2026-10-23
answered-by: Miles
raised-by: erp-planning-pre-check（change shipment-print-download-center 稽核）
source-link: change shipment-print-download-center precheck.md 候選 C1
related-vault:
  - "[[EC 物流串接約束]]"
  - "[[物流單狀態]]"
  - "[[物流單]]"
related-oq:
  - "[[SHP-020-ERP出貨單承接EC物流串接的狀態對映與拋單失敗處置]]"
related-change:
  - shipment-print-download-center
---

# SHP-027 ERP 物流串接沒有同步排程時，物流單怎麼取得物流商的狀態

## 問題描述

現況正本：[[物流單狀態]] 的等待出貨 → 運送中 → 已送達、進出例外，都寫成「系統：物流商回傳」。[[EC 物流串接約束]] 的現況段寫 ERP 沿用 EC 的物流串接；EC 為每日凌晨輪詢一次（[[SHP-020-ERP出貨單承接EC物流串接的狀態對映與拋單失敗處置]] 現況表）。

新事實（2026-10-23 grill 提供）：ERP 的物流串接在 sens-print-core 分支 feat/logistics_carrier_integration#2489（Bill），沒有同步排程、沒有取消；貨態值只有 pending、in_transit、delivered、exception、not_found。同一場 grill 拍板刪除重新同步（G3）。

另一處對不上：ERP 串接的五個貨態值，與 [[物流單狀態]] 例外的三個子狀態（未送達、無追蹤中包裹、例外事故）沒有一對一對應。

兩邊合起來，ERP 物流單沒有任何路徑取得物流商狀態：沒有排程、也沒有人工重新同步。第三方物流的物流單會停在等待出貨，出貨單無法收到已送達，訂單無法完成。

本卡範圍：ERP 怎麼取得物流商狀態，以及 [[EC 物流串接約束]] 現況段要改寫成哪一套串接。逾期判定看不看等待出貨，見 [[SHP-028-第三方物流等待出貨時算不算已出貨]]。

## 待解答

- [x] ERP 物流單的物流商狀態由什麼機制取得（排程輪詢、物流商回呼、沿用 EC 輪詢後轉送），貨態值怎麼對到物流單狀態？ → 見決議

## 候選方案

- **A（後端補同步機制）**：請後端在 ERP 串接補排程或回呼；wiki 照實寫頻率。代價：後端工作量；頻率決定逾期標示的延遲。
- **B（沿用 EC 輪詢轉送）**：ERP 接 EC 收斂後的值；EC 每日凌晨輪詢一次。代價：狀態晚一天。

不受影響項：拋單、作廢、出貨確認、送達確認等人工操作；可出貨狀態與鎖數量規則。

裁決後要同步的位置：[[EC 物流串接約束]] 現況段與 source、[[物流單狀態]] 推進規則「以物流商最近一次回傳為準」、[[出貨與交付流程群組]] 狀態同步段。

## 決議

採 A（後端補取得機制）。ERP 物流單的物流商狀態由後端在 ERP 串接補取得機制；機制（排程或回呼）、頻率與五個貨態值對到物流單狀態的方式由後端決定，wiki 只寫「依物流商回傳推進」、不寫頻率，待後端定案後照實回寫。第三方送達確認保留為回傳沒進來時的備援。理由：取得機制屬實作；被否決的 B 綁定 EC 每日輪詢，狀態晚一天。2026-10-23 Miles 拍板。

落地去處：[[EC 物流串接約束]]（現況段改為 ERP 串接、刪向物流商取消）、[[物流單狀態]]（推進規則）、[[出貨與交付流程群組]]（狀態同步段）。正本卡寫入轉介 `wiki-amend`。
