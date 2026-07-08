---
type: open-question
module:
  - 生產任務
  - 品檢
oq-id: PT-002
status: answered
priority: low
audience: internal
answered-at: 2026-07-08
answered-by: Miles
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

## 決議（2026-07-08，Miles）

**不設專門的分批驗收流程、不做系統強制機制**（採方案 B 精神）。分批驗收類似報工的概念：品檢驗證當前完成的數量、累計回報；系統的角色只是**計算數量**（已驗多少、入庫多少、可出貨多少），依入庫數量決定可以揀貨與出貨多少——分批是數量計算的自然結果，不是一條特別流程。

**落地去處**：既有機制已涵蓋，無需改卡——[[工序相依性規則]] 提前品檢（分批驗收累計、通過數計入可出貨）＋ [[齊套邏輯]]（可出貨額度計算）即為此決議的正本。原候選方案 A（`assigned_qty` 強制欄位）不做。
