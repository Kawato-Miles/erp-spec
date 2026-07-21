---
type: open-question
module:
  - 生產任務
  - 品檢
oq-id: PT-003
status: answered
priority: high
audience: internal
answered-at: 2026-07-21
answered-by: Miles
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

- [x] 系統怎麼支援補生產：補生產任務怎麼建（帶原任務製程？）、數量帶多少（不通過數？）、與 NCR 的關聯、補做完成後對可出貨數的計算 → 見決議

## 候選方案

C3 `add-production-task-rework` 範疇處理。設計層面要決定：方案 A（系統自動建補生產 WorkRecord）vs 方案 B（印務手動發起建 WorkRecord）——方向已拍 B（見部分拍板），細節待設計。詳見 [reclassify-qc design.md § Decisions 10](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md)。

## 決議（2026-07-21，Miles）

補做流程全數拍板（觸發載體依同日品檢模型再拍板改為印件層 [[品檢紀錄]]，見 [[QC-002-QC兩張wiki卡退役或保留|QC-002]]）：

1. 品檢人員記品檢紀錄（通過／不通過數），印件不通過累計出現缺口。
2. 印務從品檢紀錄**一鍵發起補做**：系統開立工單異動，並在原任務下**預帶補做生產任務草稿**——工序照原印件安排複製（完整工序鏈，印務可刪，例如大版還在只補後段）、每筆數量預填不通過數（可上調預留損耗）、草稿掛回觸發的品檢紀錄供追溯。
3. 印務確認送出 → 生管確認異動內容、照常排程派工（既有異動接力，補做期間整批生產不中斷）。
4. 補做完成 → 回同一印件的品檢紀錄累計複驗，通過數累計入庫；工單完成判定＝旗下生產任務全部完成（含補做任務，同日拍板）。
5. 工序中途損耗（未到品檢即發現做壞）同機制：師傅／生管口頭回報印務，印務用既有工單異動加開生產任務，不設另一條流程。

落地去處：[[QC不通過補生產]]（情境卡改寫）、[[印件生產流程]]、[[齊套邏輯]]（工單完成判定）、[[品檢紀錄]]。
