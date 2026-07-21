---
type: open-question
module:
  - 生產任務
  - 品檢
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
  - "[[品檢人員]]"
  - "[[生產任務]]"
related-changes:
  - reclassify-qc-and-add-inspection
expected-resolution-at: 正式上線階段
---

# PT-004：既有 QCRecord 資料 migration 範圍與時機

## 問題描述

reclassify-qc 廢止 `QCRecord` 獨立實體，併入 ProductionTask。**遷移標的更新（2026-07-21）**：品檢模型再拍板為**印件層品檢紀錄**（品檢型生產任務亦廢止，見 [[QC-002-QC兩張wiki卡退役或保留|QC-002]] 決議），既有資料（QCRecord 與 Prototype 品檢型任務實作）的最終遷移目標為 [[品檢紀錄]]（掛印件、分次驗、累計通過＝入庫）。Prototype 階段不處理資料遷移（依 Miles 指示）。正式上線時需決定：

1. 既有品檢資料（生產環境）如何遷移到印件層品檢紀錄
2. 遷移腳本設計（對應規則、邊界情況、回復策略）
3. 遷移時機（上線前批次 / 上線後漸進）

## 涉及範圍

production-task / qc / 正式環境資料

## 候選方案

正式上線階段另議。Prototype 階段不處理。詳見 [reclassify-qc design.md § Migration Plan](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。
