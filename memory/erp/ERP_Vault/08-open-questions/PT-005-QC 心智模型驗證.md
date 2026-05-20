---
type: open-question
module:
  - production-task
  - qc
oq-id: PT-005
status: open
priority: medium
audience: internal
related-insight:
  - 2026-05-20-change-archive-OQ收尾流程缺口
raised-at: 2026-05-20
raised-by: Miles
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-6
related-vault:
  - "[[QC]]"
  - "[[生產任務]]"
related-changes:
  - reclassify-qc-and-add-inspection
expected-resolution-at: Prototype 階段
---

# PT-005：QC 從工序層翻轉為印件層的心智模型驗證

## 問題描述

reclassify-qc design 討論中 Miles 反饋「還是滿奇怪的」，可能來自「QC 從工序層翻轉為印件層」的心智落差（QC 人員、印務、業務的舊心智模型對應不上新設計）。

## 涉及範圍

production-task / qc / 使用者心智模型

## 解答方向

**Default 假說**（senior-pm Round 1 P2 修正）：QC 從工序層翻轉印件層的心智落差。

**驗證方式**：Prototype 階段透過 1-2 個情境跑通：
1. 精裝書情境（多個工序 → 1 個印件 QC，多 type 任務協調）
2. 分批提前出貨情境（QC PT 分批驗收 + 出貨單建立）

若 Prototype 驗證後仍奇怪，C2 `simplify-production-task-completion` 啟動時一併調整。詳見 [reclassify-qc design.md § Open Questions OQ-C1-6](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。
