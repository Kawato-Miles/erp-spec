---
type: open-question
module:
  - prepress-review
  - production-task
oq-id: AR-13
status: open
priority: medium
audience: internal
raised-at: 2026-05-23
raised-by: claude-research
source-link: resolve-prepress-review-gaps-ar-10-ar-12 archive 衍生
related-vault:
  - "[[13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件]]"
  - "[[04-business-logic/打樣流程]]"
related-oq:
  - "[[AR-12-打樣後新稿件實體機制與根因判定]]"
expected-resolution-at: 2026-Q3
---

# AR-13 打樣 NG-製程問題下游處理機制

## 問題

`resolve-prepress-review-gaps-ar-10-ar-12` archive 時（2026-05-23）拍板：

- `sampleResult = NG-稿件問題` → 系統自動觸發棄用 + clone 新印件流程（議題 1 已解）
- `sampleResult = NG-製程問題` → **業務 UI 自行建新打樣 WorkOrder 重做**（系統不自動建，保留業務決定權）

但 **NG-製程問題的下游處理機制細節尚未定義**：
- 業務怎麼建新打樣 WorkOrder？（手動填表 / 系統一鍵建立？）
- 重做的成本如何記錄？（同一印件下多個打樣 WorkOrder 的計費邏輯？）
- 是否需要記錄製程問題原因（紙張色差 / 設備偏差 / 油墨配色等）以利後續分析？
- 是否與 [production-task spec § NCR Disposition](../../../../openspec/specs/production-task/spec.md) 機制（rework / use_as_is / scrap）整合？

## 影響

- 業務情境：目前 Prototype `fillSampleResult` 在 NG-製程問題情境僅彈出 `alert('已填 NG-製程問題。請建立新的打樣工單（同印件）。')`，業務需手動操作
- 缺乏結構化記錄：NG-製程問題的根因（紙張 / 設備 / 油墨等）目前只能寫 notes，無法統計分析高頻問題
- 跨模組整合空白：production-task spec 已有 NCR + Disposition 機制（rework / use_as_is / scrap），但打樣 NG-製程問題未整合 — 兩套機制平行存在的取捨需評估

## 候選方案

| 選項 | 規則 | 影響 |
|------|------|------|
| A 純手動 | 維持現狀：業務手動建新打樣 WorkOrder，無系統輔助 | 最簡單但成本與根因無結構化記錄 |
| B 系統一鍵建立 | 業務點按鈕後系統自動建立新打樣 WorkOrder（同印件、type=打樣、狀態=待生產）+ 記錄重做原因 enum | 操作便利 + 結構化記錄，但需設計重做原因 enum |
| C 整合 NCR Disposition | 觸發 production-task NCR 機制：建 NCR 記錄 + Disposition = rework → 自動建新打樣 ProductionTask；對齊大貨製程 NCR 機制 | 跨模組統一機制，但需與 production-task 整合（工程成本較高）|
| D 混合 | 業務選 enum「重做原因」（紙張 / 設備 / 油墨 / 其他）+ 系統建新打樣 WorkOrder + 累積統計分析 | 兼顧便利與結構化分析 |

## 暫定處理

- spec § 打樣結果業務判定 「NG-製程問題」分支描述「業務 UI 自行建新打樣 WorkOrder（系統不自動建，保留業務決定權；下游自動化待 OQ AR-13）」
- US-AR-011 業務流程在 NG-製程問題分支引此 OQ wiki link

## 待 Miles 確認（等業務累積 NG-製程問題案例後再決定）

1. 業務實際發生 NG-製程問題的頻率與根因分布如何？
2. 是否需要系統一鍵建立新打樣 WorkOrder（B 選項）？
3. 是否值得整合 production-task NCR 機制（C 選項）？跨模組整合的工程成本是否划算？

## 觸發解決時機建議

- 待 Prototype 在 NG-製程問題情境累積 ≥ 5 個業務操作案例後（觀察業務實際痛點）
- 或 production-task NCR 機制成熟後（評估整合可行性）
- 或業務 / 印務主管反饋「NG-製程問題流程不順暢」時
