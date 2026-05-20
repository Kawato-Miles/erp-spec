---
type: open-question
module:
  - cross-module
  - production-task
  - order-management
oq-id: XM-005
status: open
priority: high
audience: internal
raised-at: 2026-05-20
raised-by: ceo-reviewer (Round 1 P0)
source-link: openspec/changes/reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-4
related-vault:
  - "[[QC]]"
  - "[[訂單異動]]"
  - "[[業務]]"
related-changes:
  - reclassify-qc-and-add-inspection
related-follow-up:
  - C3 add-production-task-rework
  - C4 move-warehousing-to-print-item-layer
expected-resolution-at: 2026-Q3
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

C3 `add-production-task-rework` 或 C4 `move-warehousing-to-print-item-layer` 處理。CEO Round 1 P0 已要求 C1 spec 明示「業務手動發起」邊界（已執行）。詳見 [reclassify-qc design.md § Decisions 10 § use_as_is 退款流程串接邊界](../../../../openspec/changes/reclassify-qc-and-add-inspection/design.md)。
