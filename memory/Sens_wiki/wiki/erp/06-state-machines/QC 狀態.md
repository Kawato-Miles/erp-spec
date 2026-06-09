---
type: state-machine
module:
  - qc
  - production-task
related-spec: openspec/specs/production-task/spec.md
status: active
last-reviewed: 2026-06-09
---

# QC 狀態

> QC 已併入 [[生產任務狀態|生產任務]] 框架（`type = qc`，2026-05-20 reclassify-qc-and-add-inspection change 歸檔）。獨立 QCRecord 實體已廢止，QC 統一以 ProductionTask（`type = qc`、`scope = print_item`）表達。**QC 達標後自動觸發印件入庫數量重算（齊套性邏輯）**。

## 狀態列舉

QC 任務的狀態列舉與 [[生產任務狀態]] 共用，不另設獨立狀態機：

| 狀態 | 說明 |
|------|------|
| 待處理 | QC 任務已建立，等待[[品檢人員]]開始檢驗 |
| 製作中 | 品檢人員開始執行驗收（首筆報工紀錄觸發） |
| 已完成 | 已達標（通過數量達目標） |
| 已取消 | 作廢（印務主動或生產任務連鎖） |

## 主要轉移觸發

| From → To | 觸發 | 推進方式 |
|-----------|------|---------|
| - → 待處理 | 印務建立 QC 生產任務（`type = qc`） | 手動 |
| 待處理 → 製作中 | 品檢人員首筆報工紀錄 | 自動 |
| 製作中 → 已完成 | 通過數量達目標（達標） | 自動 |
| 待處理 / 製作中 → 已取消 | 印務主動作廢（理由必填）或對應 production PT 作廢連鎖 | 手動 / 自動 |

## 與生產任務的關聯

- QC PT（`type = qc`、`scope = print_item`）的狀態變更**不走**「PT → 任務 → 工單」向上傳遞鏈
- QC PT 狀態變更直接影響其所屬印件的入庫數量計算（見 [[齊套邏輯]]）
- inspection PT（`type = inspection`、`scope = work_order_task`）的結果影響對應 production PT 的有效數量

## 相關業務邏輯

- [[齊套邏輯]]（QC 通過驅動工單完成度與印件入庫數量）
- [[數量換算規則]]
- [[印件生產流程]]

## 關聯狀態機

- [[生產任務狀態]]（QC 共用此狀態機，以 `type` 區分）
- [[工單狀態]]（QC 達標影響工單完成度）

## 來源

- OpenSpec [production-task/spec.md § 生產任務狀態機](../../../../openspec/specs/production-task/spec.md)（QC PT 與 inspection PT 的狀態變更傳遞規則）
- OpenSpec [qc/spec.md](../../../../openspec/specs/qc/spec.md)（QC 模組行為規格）
