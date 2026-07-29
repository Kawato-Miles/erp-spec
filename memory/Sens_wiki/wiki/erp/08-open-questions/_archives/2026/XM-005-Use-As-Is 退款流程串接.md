---
type: open-question
module:
  - 跨模組
  - 生產任務
  - 訂單管理
oq-id: XM-005
status: cancelled
priority: high
audience: internal
raised-at: 2026-05-20
raised-by: ceo-reviewer (Round 1 P0)
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-4
related-vault:
  - "[[品檢人員]]"
  - "[[訂單]]"
  - "[[業務]]"
expected-resolution-at: 2026-Q3
answered-at: 2026-07-29
answered-by: Miles
---

# XM-005：議價交付（Use-As-Is）pi_planned_qty 鎖定 + 業務退款流程串接

## 問題描述

C1 範圍下 NCR.disposition = `use_as_is` 僅做兩件事：① 系統通知業務 ② 業務手動至訂單異動模組建立 OrderAdjustment 處理退款。

**未解問題**：
1. Use-As-Is 後 `pi_planned_qty` 是否要鎖定？（防止後續業務再改數量）
2. 系統自動串接（自動產 OrderAdjustment / 自動算退款金額 / 自動帶 lines）的設計時機與範圍

## 涉及範圍

production-task / order-management / cross-module（業務 / 印務 / 系統三方流程）

## 候選方案

C3 `add-production-task-rework` 或 C4 `move-warehousing-to-print-item-layer` 處理。CEO Round 1 P0 已要求 C1 spec 明示「業務手動發起」邊界（已執行）。詳見 [reclassify-qc design.md § Decisions 10 § use_as_is 退款流程串接邊界](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。

## 決議

**取消（廢棄）**。本卡的問題陳述整個架在已經不存在的模型上——它問的是「品檢紀錄實體上的處置欄位標成議價交付之後，印件的計畫數量要不要鎖、退款要不要自動串」，但這套實體與處置欄位已被三次拍板換掉：品檢獨立實體廢止併入生產任務（2026-05-20）、品檢再改為掛在印件層的品檢紀錄（2026-07-21）、東西做壞改為兩軸模型（工作中止歸任務終態、成品缺口歸不符合報告單，2026-07-21），議價照收已在不符合報告單的處置分流裡有位置。舊卡不改寫、直接廢棄；此議題若在現行模型下仍要處理，依現行語彙另開新卡。2026-07-29 Miles 拍板。

落地去處：無需落地。現行模型下的相關議題見 [[QC-005-不符合報告單實體歸屬與欄位正本]]（處置分流與欄位正本）、[[PT-012-短出下修後工廠端資料處理]]（下修後的數量收尾）。
