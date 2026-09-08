---
type: open-question
module:
  - 需求單
tags:
  - 領域/售前
oq-id: QR-007
status: open
priority: medium
audience: internal
raised-at: 2026-09-08
raised-by: Miles 與 Claude（需求單 Prototype 對齊 wiki／Dev 後端的比對）
source-link: 對話 2026-09-08 需求單 Prototype 現況比對；sens-print-core apps/quote/models/quote_request.py LostReason
related-vault:
  - "[[需求單]]"
  - "[[需求單狀態]]"
related-oq:
  - "[[QR-003-需求單欄位修改規則與規格雛形落差]]"
---

# QR-007 流失原因值域 wiki 七選一與後端六值不一致，以哪邊為準

## 問題描述

[[需求單]] 欄位表的流失原因為七選一：價格因素／交期無法配合／品質不符需求／客戶預算刪減／競爭對手搶單／客戶取消專案／其他，此值域由 [[QR-003-需求單欄位修改規則與規格雛形落差]] 於 2026-07-31 拍板寫入。Dev 後端 sens-print-core 的需求單模型另有一組六值：價格因素／交期因素／規格不符／無回覆／改找他家／其他，正式前端與 Prototype 皆沿用後端六值。矛盾來自既有正本（wiki）與已上線程式碼，不是本次討論新產生。

不拍板的後果：業務標流失時選的原因與 wiki 的輸單歸因統計分類對不上，日後做流失趨勢分析時兩套分類無法合併。

範圍：本卡只管流失原因的值域對齊，涉及 [[需求單]] 欄位表與後端 LostReason 列舉。流失後重新啟動與諮詢訂單的連動見 [[QR-006-諮詢來源需求單流失後重新啟動與諮詢訂單的關係]]。

## 待解答

- [ ] 流失原因值域以 wiki 七值為準（後端補 migration 改列舉）、以後端六值為準（wiki 改寫欄位表）、還是合併成一組新值域？

## 候選方案

- **A（後端改成 wiki 七值）**：商業正本不動，後端加資料庫欄位值域變更（migration，即資料庫結構的版本化修改）；代價是既有資料要對映舊值到新值。
- **B（wiki 改成後端六值）**：不動程式碼；代價是 QR-003 拍板的七值歸因分類退場，「客戶預算刪減」「客戶取消專案」兩類併進「其他」。
- **C（合併）**：取兩邊聯集或重新歸類；代價是兩邊都要改。

不受影響項：流失原因必填、流失後鎖定、重新啟動清空原因這些規則任一方向皆不動。
裁決後要同步的位置：[[需求單]] 欄位表流失原因列；後端 LostReason 列舉；Prototype `quote-prototype/_lib/constants.js` 的 LOST_REASON。
