---
type: open-question
module:
  - production-task
  - qc
oq-id: PT-003
status: open
priority: high
audience: internal
raised-at: 2026-05-20
raised-by: Miles
source-link: openspec/changes/reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-3
related-vault:
  - "[[QC]]"
  - "[[生產任務]]"
  - "[[補生產]]"
related-changes:
  - reclassify-qc-and-add-inspection
related-follow-up:
  - C3 add-production-task-rework
expected-resolution-at: 2026-Q3
---

# PT-003：NCR Disposition = Rework 的具體實現

## 問題描述

C1 範圍僅定義 NCR.disposition = `rework` 列舉值與觸發機制，**未實現補生產具體流程**（如何建補做 WorkRecord、相依性處理、與下游 PT 互動）。

## 涉及範圍

production-task / qc / cross-module

## 候選方案

C3 `add-production-task-rework` 範疇處理。設計層面要決定：方案 A（系統自動建補生產 WorkRecord）vs 方案 B（印務手動發起建 WorkRecord）。詳見 [reclassify-qc design.md § Decisions 10](../../../../openspec/changes/reclassify-qc-and-add-inspection/design.md)。
