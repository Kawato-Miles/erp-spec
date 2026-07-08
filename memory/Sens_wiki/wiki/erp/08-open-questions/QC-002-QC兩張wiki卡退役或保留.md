---
type: open-question
module:
  - 品檢
  - 生產任務
oq-id: QC-002
status: open
priority: medium
audience: internal
raised-at: 2026-06-01
raised-by: Miles
source-link: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/proposal.md（QCRecord 廢止決議）
related-vault:
  - "[[QC]]"
  - "[[QC 狀態]]"
  - "[[生產任務]]"
  - "[[生產任務狀態]]"
related-oq:
  - QC-001
  - PT-004
  - PT-005
related-changes:
  - reclassify-qc-and-add-inspection
expected-resolution-at: 2026-Q3
---

# QC-002：QC 兩張 wiki 卡應退役並重導向生產任務，還是保留

## 問題描述

reclassify-qc-and-add-inspection change（2026-05-20 歸檔）已**廢止 `QCRecord` 獨立實體**，QC 業務語意併入[[生產任務]]（型別 = qc、範圍 = print_item，每印件強制 1 個），不良品處置改走 NCR（不符合報告）+ Disposition 機制（重工 / 允收 / 報廢）。

但 wiki 仍有兩張 QC 卡停留在舊 `QCRecord` 模型，與正本不一致：

| 卡 | 現況描述 | 問題 |
|------|---------|------|
| [[QC]]（05-entities）| 仍以 `QCRecord` 為獨立實體描述欄位與關聯 | 實體已廢止，描述過時 |
| [[QC 狀態]]（06-state-machines）| 仍描述 QCRecord 獨立狀態機，且 `source` 指向已不存在的 Requirement | 死引用 + 狀態機已併入生產任務 |

需決定：**這兩張 QC 卡的處置方式。**

## 涉及範圍

- 模組：qc、production-task
- 相關卡：[[QC]]、[[QC 狀態]]、[[生產任務]]、[[生產任務狀態]]、[[品檢人員]]
- 影響範圍：
  - wiki 商業邏輯正本一致性（05-entities / 06-state-machines）
  - 是否殘留死引用（QC 狀態.md 的 source 指向已廢 Requirement）
  - 與 QC-001（QC 角色定位已釐清）、PT-004（QCRecord 資料遷移）、PT-005（QC 心智模型驗證）的卡治理連帶

## 討論記錄

QC-001 已釐清 QC 與 prepress-review 為兩個獨立 capability，QC = 印件入庫檢查 + 工序中間品檢執行者。reclassify-qc change 進一步將 QC 的資料載體從獨立 `QCRecord` 收斂為[[生產任務]]的一個型別。本 OQ 聚焦的不是業務邏輯（已定案），而是 **wiki 卡片層的策展處置**：兩張舊卡是該退役（並把入鏈重導向新正本），還是保留作為歷史 / 過渡參照。

**前提更新（2026-07-08）**：生產階段流程重整拍板「工序間品檢整個取消」——QC 定位收斂為印件入庫前的最終品檢（每印件一筆、強制），QC-001 所述「工序中間品檢執行者」的定位已不存在，工序級 inspection PT 隨之廢止。裁決本卡時 QC 語意以 [[生產任務狀態]] § 品檢型任務（2026-07-08 版）為準；spec 層的 inspection PT 清理與出貨模組 change 一併處理。

原處（[[QC]] / [[QC 狀態]]）的引用修正由其他流程處理，本卡僅記錄待 Miles 拍板的策展決策。

## 待解答

- [ ] 兩張 QC 卡退役還是保留？
- [ ] 若退役，重導向目標為 [[生產任務]] + NCR（保留 stub 引導，還是直接刪除）？
- [ ] QC 狀態.md 的死引用（指向已廢 Requirement）如何處理？

## 候選方案

### 方案 A：兩張卡退役 + 重導向

- 將 [[QC]] / [[QC 狀態]] 內容收斂為 stub，正文改引 [[生產任務]]（型別 = qc）+ NCR 機制
- 移除死引用，保留卡名供既有入鏈不斷聯
- 優點：正本單一、避免讀者誤讀舊模型；缺點：需逐一檢查反向連結確保不產生孤島

### 方案 B：保留作為歷史 / 過渡參照

- 卡頂加「已廢止（superseded by [[生產任務]]）」標記，內文標明舊 QCRecord 模型僅供歷史對照
- 優點：保留演化軌跡；缺點：兩處描述並存，未來易再次漂移

### 方案 C：直接刪除

- 刪除兩張卡，所有入鏈改指 [[生產任務]]
- 優點：最徹底；缺點：須先確認無重要入鏈、無破壞檢索鏈風險
