---
type: open-question
module:
  - production-task
  - qc
oq-id: PT-002
status: open
priority: low
audience: internal
related-insight:
  - 2026-05-20-change-archive-OQ收尾流程缺口
expected-resolution-at: 2026-Q3
raised-at: 2026-05-20
raised-by: Miles
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-2
related-vault:
  - "[[品檢人員]]"
  - "[[生產任務]]"
related-changes:
  - reclassify-qc-and-add-inspection
---

# PT-002：QC 分批驗收是否需要系統強制「派工數量」機制

## 問題描述

C1 設計中 QC 分批驗收依儀表板（上游通過 vs QC 已驗）+ 印務 / 生管口頭協調，沒有系統強制機制（如 `assigned_qty` 欄位）。實務上是否需要強制？

## 涉及範圍

production-task / qc

## 候選方案

詳見 [reclassify-qc design.md § Decisions 3](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。Phase 2 驗收期觀察分批驗收實務節奏後決定：方案 A（新增 `assigned_qty` 欄位強制每次派工數量上限）vs 方案 B（強化儀表板提示，不強制阻擋）。
