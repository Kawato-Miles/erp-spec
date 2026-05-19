## Why

印務在排定生產任務時程時，目前逐筆手動設定開工日期，缺乏系統輔助。當一張工單有多道工序且存在相依關係（如印刷完才能上光、上光完才能裁切），手動排程容易算錯且耗時。需要「自動排程」功能從交貨日回推各生產任務的開始與完成日期，並以時間軸視覺化呈現結果，讓印務快速驗證排程是否合理。

本次建立 prototype 驗證「分階段 + 自動回推」的 UX 流程是否可行。

相關 spec：
- 生產任務 spec § 自動派工建議（Phase 2）：已定義依交貨日期反推最早開工日期
- 生產任務 spec § 開工日期設定與完工推算：planned_end_date = scheduled_date + estimated_duration_days
- 生產任務 spec § 工序相依性管理：手動 + UI 排序管理

## What Changes

- 工單詳情頁新增「排程規劃」Tab，含階段管理與自動回推功能
- 新增「階段」概念：印務將生產任務歸入階段，同階段可平行、跨階段依序執行
- 新增「自動排程」按鈕：從交貨日回推各階段 → 各任務的開始日與完成日
- 新增排程時間軸：甘特圖式呈現回推結果，標示交貨日與各任務時段
- 每筆生產任務新增「預估工期（天）」欄位（印務手動填寫）

## Capabilities

### New Capabilities
- `schedule-backtrack`: 排程回推功能 — 階段管理、自動回推演算、時間軸視覺化

### Modified Capabilities
- `production-task`: 生產任務 Data Model 新增 stage_order（階段序號）、estimated_duration_days 欄位

## Impact

- 工單詳情頁新增 Tab：排程規劃
- 新增元件：`src/components/workorder/SchedulePlanner.tsx`（階段管理 + 回推 + 時間軸）
- 擴展 mock data：生產任務加上 stage_order、estimated_duration_days
- 不影響現有工單 / 生產任務 / 任務分派功能
