---
type: open-question
module:
  - 售後服務
oq-id: AFT-10
status: answered
priority: low
audience: internal
raised-at: 2026-06-11
raised-by: Claude（實體卡憲章化 Phase B 修售後服務卡時識別）
source-link: openspec/specs/after-sales-ticket/spec.md § Requirement AfterSalesTicket 實體與欄位
related-vault:
  - "[[售後服務]]"
related-oq:
  - "[[_archives/2026/ORD-006-訂單階段備註欄位編輯時機|ORD-006]]"
expected-resolution-at: 2026-06-30
answered-at: 2026-06-12
answered-by: Miles
---

# 問題描述

售後服務單上兩個文字欄位的修改與鎖定規則，OpenSpec 規格未明定：

1. **客訴內容原文**：建單時必填；建單後可否修改？規格只明定「售後類型／責任歸屬／決議處理方式」三欄受理中與處理中可改、結案後鎖定，且設計上有「客戶補述紀錄」（只增不改）承接後續反映——暗示原文不改，但未明文。
2. **結案後客戶回饋**：選填；填入後可否再改？有無鎖定時機？

影響：[[售後服務]] 實體卡欄位表「可否修改」欄這兩格暫依規格現況標注，待拍板後補正。

# 待解答

- [x] 客訴內容原文建單後是否鎖定（後續反映一律走補述紀錄）？
- [x] 結案後客戶回饋的可改性與鎖定時機？

# 候選方案

- 方案 A（傾向）：客訴原文建單即鎖定，後續走補述紀錄；結案後客戶回饋於結案後可填可改、不鎖定（低風險備註性質）——與既有 append-only 補述設計一致。
- 方案 B：兩欄皆比照三分類欄（結案前可改、結案後鎖定）。

# 決議

Miles 拍板（2026-06-12）：兩欄皆**可改，但修改必須寫入活動紀錄（訂單 log）**——不鎖定、靠留痕保可追溯。
落地：[[售後服務]] 欄位表「客訴內容」「結案後客戶回饋」兩列「可否修改」欄改為「可改，修改寫入活動紀錄」。spec 回寫待後續 change。
