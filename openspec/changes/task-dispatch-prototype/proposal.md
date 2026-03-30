## Why

生管目前缺乏系統化工具來管理每日的師傅派工作業。現況依賴紙本工單 + Slack + 口頭通知，生管無法一目了然地看到「今天有哪些生產任務需要處理」、「哪些工序可以合併派工」。同工序的生產任務若分散處理，師傅需要頻繁切換工序（如印刷 → 裝訂 → 印刷），造成設備調校與準備時間浪費。本次建立 prototype 驗證任務派工介面的資訊架構與操作流程，確保生管能高效完成日常派工決策。

相關未解 OQ：
- [XM-003 工廠產能優化合併規則](https://www.notion.so/32c3886511fa815085a8e5699718cef5)（高優先）：合併條件、時間窗口、優先級衝突尚未定案，prototype 先以「同工序分組顯示」驗證基本模式
- [PT-002 US-PT-001 範疇拆分](https://www.notion.so/3323886511fa81a79714defe0effd4bb)（中優先）：報工 / QC / Kitting Logic 拆分尚未定案，本次 prototype 聚焦派工與報工，暫不含 QC 邏輯

## What Changes

- 新增「任務任務分派介面」頁面：生管視角的每日任務總覽，以工序分組顯示待處理生產任務
- 新增「派工操作」流程：生管可批次選取同工序任務、確認派工給師傅、記錄派工時間
- 新增「報工紀錄」介面：生管代替師傅回報生產數量與工時
- 新增任務狀態追蹤：待處理 → 製作中 → 已完成的狀態切換與視覺化
- 整合現有工單 prototype 的資料結構，擴展 mock data 支援派工情境

## Capabilities

### New Capabilities
- `task-dispatch-board`: 任務任務分派介面 — 生管每日任務總覽與派工操作介面，含工序分組、批次派工、報工紀錄

### Modified Capabilities
- `production-task`: 生產任務 spec 新增生管派工視角的介面需求（任務分派介面欄位、分組邏輯、報工介面）

## Impact

- Prototype 新增頁面：`/task-dispatch`（任務任務分派介面）
- 新增元件：`src/components/task-dispatch/`（任務分派介面、工序分組卡片、報工對話框）
- 新增/擴展 mock data：派工情境的生產任務資料（跨多工單、多工序）
- 擴展路由：`App.tsx` 新增路由、`AppSidebar.tsx` 新增側邊欄項目
- 擴展型別：`src/types/` 新增派工相關介面定義
- 不影響現有工單 prototype 頁面功能
