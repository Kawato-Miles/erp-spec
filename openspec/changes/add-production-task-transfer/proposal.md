# add-production-task-transfer — Proposal

## Why

印件生產任務完成後的跨站點運送**缺乏明確當責人與可追溯憑證**：目前依賴口頭、LINE、Slack 溝通，下一站等不到物件、印務被迫自行追蹤、出問題無法追責。260417 廠務角色會議結論確立：廠務為系統外被動執行者（不進 ERP、透過 Slack 接收指令），印務與產線師傅在系統中共同承擔轉交當責。本 change 在生產任務層建立轉交狀態與欄位，讓「誰、在哪、送到哪、送達了沒」可被系統記錄與查詢。

## What Changes

- **狀態機擴充**：`production-task` 生產任務狀態機新增 `pending_transfer`（待轉交）、`transferred`（已轉交）兩個通用狀態；外包廠既有 `in_transit`（運送中）、中國廠既有 `in_transit_to_freight_forwarder`（已送集運商）→`in_transit` 由轉交功能統一納管，命名對齊
- **Data Model 擴充**：生產任務新增 12 項轉交欄位（對象類型、目的產線、目的廠商、運送方式、貨運行名稱、廠內執行者、轉交備註、預計轉交日、實際轉交日、確認操作人、簽收照片、轉交撤回紀錄）
- **三情境覆蓋**：情境 A（廠內自送）、情境 B（外部貨運行拉貨）、情境 C（外包廠商自取）在資料模型與 UI 中顯性支援
- **可逆機制**：「已轉交」允許印務撤回至「待轉交」，撤回時必填原因並寫入異動紀錄
- **Prototype UI**：`ProductionTaskDrawer` 內新增「轉交」分區；`ProductionTaskList` 狀態 Badge 新增待轉交 / 已轉交；「已轉交」按鈕旁提供「複製 Slack 摘要」純 UI 一鍵複製區塊，作為 PT-002（Slack Webhook 自動推送）落地前的橋接，避免廠務通知流程斷鏈
- **完工報工銜接**：師傅完成報工後同一畫面可直接填寫轉交確認，避免兩次分散操作
- **預填行為**：印務端以同供應商最近一次的運送方式 / 貨運行作為預設值

## Capabilities

### New Capabilities

（本 change 不新增 capability）

### Modified Capabilities

- `production-task`：狀態機擴充（新增待轉交 / 已轉交，外包 / 中國統一命名）、Data Model 新增 12 項轉交欄位與轉交撤回紀錄、Scenarios 補充三種轉交情境、完工報工與轉交確認的 UI 流程銜接

## Impact

### 規格檔

- `openspec/specs/production-task/spec.md`：§ 狀態機（擴充）、§ Data Model（新增欄位）、§ Scenarios（新增三情境）

### Prototype（sens-erp-prototype）

- `src/components/task-dispatch/ProductionTaskDrawer.tsx`（新增轉交分區）
- `src/pages/ProductionTaskList.tsx`（狀態 Badge 擴充）
- `src/components/task-dispatch/WorkReportDialog.tsx`（報工完成後銜接轉交確認）
- `src/types/dispatch.ts`（型別補轉交欄位）
- 測試 fixtures：`src/lib/mock/` 需補符合三情境的 mock data
- 資料層稽核：`src/lib/data-consistency/crossLayerAssertions.ts` 可能需要納入新欄位（待 design 階段判斷）

### Baseline 測量（上線前 2 週）

- 抽樣 2 位印務，記錄每日口頭 / LINE / Slack 追蹤物件的次數與時間
- 作為 ROI 基線與成功指標的 Baseline；若無 Baseline，上線後無法量化轉交功能帶來的節省

### 成功指標（上線後 4 週起每週測量）

| 層次 | 指標 | 閾值 |
|------|------|------|
| 目標 | 轉交後 24h 內「下一站未收到」申訴次數 | 較 Baseline 月降 50% |
| 運營 | 已轉交單筆平均填寫時間 | < 30 秒（測 Adoption 摩擦） |
| 防禦 | 已轉交後撤回率 | < 5%（撤回率過高代表填寫品質不足） |

### 相關 OQ

**本 change 內解**（見 design.md）：
- 原附件 OQ #01：印務能否進工廠（決定「確認已轉交」的師傅 / 印務權限分配）
- 原附件 OQ #04：已轉交撤回的權限與流程細節
- 原附件 OQ #05：廠內執行者欄位格式

**延後追蹤**（已登錄 Notion Follow-up DB）：
- [PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca)：轉交完成後 Slack 摘要自動產生與轉發
- [XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875)：user-roles 新增「廠務」系統外角色定義
- [XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa)：business-scenarios 新增跨任務轉交鏈路情境
- [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807)：日程面板新增「待轉交」篩選條件
- [WO-013](https://www.notion.so/34a3886511fa81f6bc18cb162bb328e9)：紙本工單列印需求範圍確認

### 系統相容性

- 與 `supplier-portal` change 既有「外包廠運送中」觸發機制對齊命名（原機制由供應商端標記製作完畢觸發，本 change 不改變觸發邏輯，僅補欄位）
- 不影響 QC、出貨、採購、倉儲模組

### 不納入（明確排除）

- Slack Webhook 自動推送（延後至 PT-002 + XM-002/004/006 合併整合 change）
- 廠務角色 spec 補強（延後至 XM-010）
- 業務情境補跨任務轉交鏈路（延後至 XM-011）
- 日程面板「待轉交」篩選（延後至 PT-003）
- 紙本工單列印整合（延後至 WO-013）
