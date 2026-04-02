## Why

生管目前的批次派工是一次性動作——勾選任務、選師傅、確認後，各生產任務就散開獨立追蹤。生管無法回溯「這幾筆是同一批派的」、無法以批次為單位查看進度，也無法列印給師傅一份涵蓋多筆任務的工作單。

實際場景：生管每天派 20-30 筆任務給 3-5 位師傅，同一位師傅通常負責同工序的多筆任務。師傅拿到的是逐筆的口頭指令或紙條，缺乏整合性的工作清單。工作包（Work Package）將「一次派工」從隱式動作升級為顯式實體，成為生管派工與師傅接單的核心操作單位。

相關已解設計：
- 排程中心（scheduling-center change）：印務層的設備佇列排程
- 任務分派介面（task-dispatch-prototype change）：生管層的批次派工 UX（本次改版對象）

## What Changes

- 新增「工作包」（WorkPackage）Data Model：無狀態的分組容器，Key 格式 WP-{工序}-{MMDD}-{流水號}，綁定一位師傅
- 改版派工流程：原「批次派工」升級為「建立工作包」，一步完成（選師傅 + 填備註 + 各任務確樣需求）
- ProductionTask 新增欄位：`work_package_id`（FK）、`sample_notes`（確樣需求，文字）
- 進行中區改版：移除師傅分組層，改以工作包卡片為主體，支援展開查看包內任務
- 生產任務列表改版：從以生產任務為單位改為以工作包為單位，提供工作包 Key 獨立搜尋欄位
- 新增工作單列印功能：以工作包為單位輸出可列印的工作單
- 工作包操作：移出任務（退回待分派）、整包移轉師傅、刪除工作包（包內任務退回待分派）

## Capabilities

### New Capabilities
- `work-package`: 工作包 — 生產任務的派工分組實體，含 Data Model、建立/移轉/刪除操作、工作單列印

### Modified Capabilities
- `production-task`: 生產任務新增 `work_package_id`、`sample_notes` 欄位，派工邏輯改為透過工作包
- `task-dispatch-board`: 任務分派介面改版 — 進行中區改為工作包視角、派工對話框改為建立工作包、新增搜尋欄位

## Impact

- Data Model：新增 WorkPackage 資料表；ProductionTask 新增兩個欄位
- Prototype 改版頁面：`/task-dispatch`（任務分派介面）
- Prototype 改版元件：`src/components/task-dispatch/`（派工對話框、進行中區、工序卡片）
- Prototype 新增元件：工作包卡片、工作單列印預覽
- 新增/擴展 mock data：工作包範例資料
- 不影響排程中心頁面（排程中心仍以單筆生產任務排入設備佇列）
