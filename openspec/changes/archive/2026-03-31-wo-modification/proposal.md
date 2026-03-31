## Why

狀態機 spec 與工單 spec 對工單異動流程的描述不一致：狀態機寫「直接回退至重新確認製程」，工單 spec 寫「進入異動狀態、生管確認後返回原狀態」。OQ 已決議的異動規則（WO-004 印務為唯一執行者、WO-009 從工單已交付發起異動後返回工單已交付、WO-010 印務主管不參與異動執行）尚未完整反映在規格中。此外，現實中輕量異動（QC 不通過補印）和重量異動（改製程/材料規格）需走不同路徑，目前規格未區分。

## What Changes

- 在工單狀態機新增「異動」為正式狀態，修正異動轉換規則
- 異動分流設計：印務發起異動時選擇「是否需重新審核製程」
  - 不需重新審核：生管確認後返回發起時的原狀態（工單已交付 / 製作中）
  - 需重新審核：生管確認後回到「重新確認製程」，走製程審核流程
- 定義異動期間下游行為：已在製作中的任務繼續、完成度計算持續運作、報工不受阻擋
- 新增 WorkOrderModification 資料表，結構化記錄每次異動的類型、原因、內容、操作者
- 明確收回（Withdraw）與異動（Modification）的邊界：任務交付前用收回，交付後用異動
- 定義異動對供應商平台的影響：作廢/報廢任務的呈現、新增任務的分派流程

## Capabilities

### New Capabilities

（無新增 capability，異動為既有工單管理的一部分）

### Modified Capabilities

- `state-machines`：修正工單異動路徑，新增「異動」為工單正式狀態，新增異動分流轉換規則（不需審核/需重新審核）
- `work-order`：更新異動流程 Requirement 與 Scenario（US-WO-005、US-WO-008），新增 WorkOrderModification 資料模型，補充異動 UX 流程描述
- `production-task`：補充異動期間生產任務行為規則（繼續執行、作廢/報廢處理、供應商平台呈現）

## Impact

- 狀態機 spec：工單狀態清單新增「異動」，轉換表新增 4 條規則
- 工單 spec：異動流程 Requirement 重寫，Data Model 新增 WorkOrderModification 表
- 生產任務 spec：新增異動期間行為 Requirement
- Prototype（未來實作）：工單詳情頁新增「異動」按鈕與編輯介面
- 供應商平台（supplier-portal change）：需配合顯示任務作廢/報廢狀態
- 生管日程面板（已定義異動確認區）：需配合兩種異動路徑的確認操作
