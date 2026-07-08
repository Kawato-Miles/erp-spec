---
type: open-question
module:
  - 生產任務
  - 品檢
oq-id: PT-003
status: open
priority: high
audience: internal
related-insight:
  - 2026-05-20-change-archive-OQ收尾流程缺口
raised-at: 2026-05-20
raised-by: Miles
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md § Open Questions OQ-C1-3
related-vault:
  - "[[品檢人員]]"
  - "[[生產任務]]"
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

## 部分拍板（2026-07-08，Miles）

**補生產的業務流程方向**：品檢沒過 → 請**印務**做補生產 → 針對**原本的工單內容**建立補生產的生產任務（原工單下加開任務，不另開工單、不加印件；即候選方案 B「印務手動發起」的方向）。與 [[PT-009-生產數量追加調整與工單異動承接|PT-009]] 的區隔：客戶加量＝加印件（PT-009）、品檢不過補做＝原工單加生產任務（本卡）。

## 待解答

- [ ] 系統怎麼支援補生產：補生產任務怎麼建（帶原任務製程？）、數量帶多少（不通過數？）、與 NCR 的關聯、補做完成後對可出貨數的計算

## 候選方案

C3 `add-production-task-rework` 範疇處理。設計層面要決定：方案 A（系統自動建補生產 WorkRecord）vs 方案 B（印務手動發起建 WorkRecord）——方向已拍 B（見部分拍板），細節待設計。詳見 [reclassify-qc design.md § Decisions 10](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。
