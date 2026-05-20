---
type: open-question
module:
  - production-task
  - qc
oq-id: PT-004
status: open
priority: medium
audience: internal
related-insight:
  - 2026-05-20-change-archive-OQ收尾流程缺口
raised-at: 2026-05-20
raised-by: Miles
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-5
related-vault:
  - "[[QC]]"
  - "[[生產任務]]"
related-changes:
  - reclassify-qc-and-add-inspection
expected-resolution-at: 正式上線階段
---

# PT-004：既有 QCRecord 資料 migration 範圍與時機

## 問題描述

reclassify-qc 廢止 `QCRecord` 獨立實體，併入 ProductionTask。Prototype 階段不處理資料遷移（依 Miles 指示）。正式上線時需決定：

1. 既有 QCRecord 資料（生產環境）如何 migration 到 ProductionTask（type = qc / inspection）
2. migration script 設計（mapping 規則、邊界情況、Rollback 策略）
3. migration 時機（上線前 batch / 上線後漸進）

## 涉及範圍

production-task / qc / 正式環境資料

## 候選方案

正式上線階段另議。Prototype 階段不處理。詳見 [reclassify-qc design.md § Migration Plan](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。
