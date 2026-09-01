---
type: open-question
module:
  - 售後服務單
  - 印件
tags:
  - 領域/履約與售後
oq-id: AFT-15
status: open
priority: medium
audience: internal
raised-at: 2026-09-01
raised-by: Claude（售後介面重整，grill 對齊後拍板「介面照後端修剪」）
source-link: erp repo PR #162（售後側板兩段化、列表表格化）；後端查證 sens-print-core apps/order/models/after_sales_ticket.py
related-vault:
  - "[[售後服務規則]]"
related-oq:
  - "[[AFT-14-售後補做與品檢缺口補做的分流]]"
---

# AFT-15 售後單後端資料缺口補齊時機（印件關聯與補述操作人）

## 問題描述

2026-09-01 售後介面重整時查證後端現況：sens-print-core 已有售後服務單（AfterSalesTicket）完整實作，但有兩個資料缺口。Miles 拍板介面照後端現況修剪（相關印件區塊移除、補述只顯示日期與內容），設計本體不變，缺口留待後端補齊後回加介面。本卡記錄該補齊的排程歸屬，避免工單階段規劃時遺漏。

缺口一：售後服務單與印件無資料關聯（model 無 OrderItem 關聯欄位）。現行過渡做法：補做對象由印務在印件層自行選件，決議選項四值全開不設把關。
缺口二：補述紀錄（additional_complaint_log）每筆只存日期字串與內容，無操作人、無時分（append 實作在 apps/order/services/after_sales_service.py）。操作人現只間接記在訂單活動紀錄。

背景：後端目前只實作退款情境，補做尚未實作是因為工單模組還沒做到。

## 待解答

- [ ] 這兩個缺口是否併入工單階段的後端規劃一起補？還是補述操作人（獨立小改）先行？
- [ ] ticket-印件關聯補上後，介面是否恢復「相關印件」區塊（Table 呈現）與補做對象指認？
