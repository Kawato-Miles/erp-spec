---
type: open-question
module:
  - 售後服務
oq-id: AFT-13
status: open
priority: low
audience: internal
raised-at: 2026-07-27
raised-by: pre-check 稽核（生產階段 MES 規劃，L1.5×實體軸）
source-link: plan mes-erp-lucky-beacon 執行之 erp-precheck-audit workflow（2026-07-27）
related-vault:
  - "[[售後服務]]"
  - "[[售後服務規則]]"
  - "[[印件]]"
expected-resolution-at: 2026-08-29
tags:
  - 領域/履約與售後
---

# AFT-13 售後補印的生產與出貨進度是否回寫售後單

## 問題描述

現行規則是「補印印件出貨完成不自動結案」（業務確認客戶滿意後手動結案），但業務在售後單上看不到補印做到哪：補印印件的審稿（自動合格）、工單、品檢、出貨進度散在各模組，售後單只是容器。要不要在售後單上呈現補印進度、結案前要不要提示「補印已送達」，未定。

## 待解答

- [ ] 售後單是否顯示補印印件的生產與出貨進度（唯讀彙總）
- [ ] 補印送達時是否提示業務可結案
