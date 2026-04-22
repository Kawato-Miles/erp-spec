# add-production-task-transfer — Proposal

## Why

印件生產任務完成後的跨站點運送**缺乏明確當責人與可追溯憑證**：目前依賴口頭、LINE、Slack 溝通，下一站等不到物件、印務被迫自行追蹤、出問題無法追責。本 change 不只是加欄位，而是**污染 Phase 2 北極星「訂單流程完整完成率」的防洩漏設計**：若生產任務完工但物件沒被確認送達，工單無法推到完成、訂單無法閉環，完成率指標會被卡住。260417 廠務角色會議結論：廠務為系統外被動執行者（不進 ERP、透過 Slack 接收指令），印務在系統中承擔所有轉交當責。

本設計建立**獨立的「轉交單（TransferTicket）」實體**（類似 QC 單的地位）取代「欄位塞進狀態機」做法，讓每一次轉交都是一張可追蹤、可撤回、可作廢的獨立單據，自然支援分批轉交、送錯重送、跨站點多次接力的情境，並為未來 Internal Transfer Order 抽象與 IoT 掃碼留足擴充空間。

## What Changes

- **新增 `TransferTicket` 實體**（類 `QCRecord` 地位）：透過 `production_task_id` FK 關聯生產任務，一生產任務 SHALL 可擁有多張轉交單（支援分批、重送、跨站接力）
- **TransferTicket 狀態機**：運送中 → 已送達 / 已作廢；可逆 已送達 → 運送中（撤回，必填原因與 revocation_type enum）
- **TransferTicket 欄位**（12 項移入此實體，不再掛在 ProductionTask）：對象類型、目的產線、目的廠商、運送方式、貨運行名稱、廠內執行者（純文字記錄廠務姓名）、備註、target_quantity（這批數量）、預計轉交日、實際轉交日、確認操作人、簽收照片；另含撤回（reason / at / by / type）、作廢（reason / at / by）欄位
- **ProductionTask 新增 `transfer_required` 旗標**（布林，僅標記任務是否需走轉交流程），**其餘 transfer_* 欄位全部移入 TransferTicket**
- **生產任務狀態由轉交單聚合自動算**：任一有效 Ticket in_transit → 生產任務「運送中」；所有有效 Ticket 已送達 → 生產任務「已完成」（類似工單透過齊套性算完成度）
- **轉交數量限制**：`sum(TransferTicket.target_quantity where status != cancelled) <= pt_produced_qty`（已報工數量）
- **Prototype UI**：`ProductionTaskDrawer` 新增「轉交單」分區（類 QC 單列表模式，含「新增轉交單」按鈕 + 每張 Ticket 展開詳情）；`ProductionTaskList` 加轉交 Badge（「待轉交 / 已轉交」，由聚合計算）
- **supplier-portal 衝突處理**：供應商標記「製作完畢」時，生產任務轉為「待建立轉交單」子態（非直接跳「運送中」），要求印務建立 TransferTicket 才能推進
- **Slack 摘要自動複製**：建立 TransferTicket 時，系統 SHALL 自動產生摘要並複製到剪貼簿，同時顯示 Toast「已複製至剪貼簿，可貼到 Slack」，避免印務多一道複製動作（CEO 審查採用率緩解）
- **自有廠 `transfer_required` 推薦勾選**：任務建立時若 process 屬「跨站類」（印刷、上光、模切等需後續加工的工序），系統 SHALL 預設建議勾選，印務可覆蓋
- **確認權限單一化**：所有工廠類型的「確認已送達」僅印務可操作；師傅無權限、不涉入報工外的轉交動作（與原方案差異，依 Miles 決策）

## Capabilities

### New Capabilities

（本 change 不新增 capability，TransferTicket 作為 production-task capability 的組合實體）

### Modified Capabilities

- `production-task`：新增 `TransferTicket` 實體與其狀態機；Data Model 擴充（ProductionTask 加 transfer_required 旗標、TransferTicket 完整欄位）；狀態機調整（運送中 / 已完成由 TransferTicket 聚合計算）；Scenarios 新增三情境（廠內自送 / 貨運行 / 外包廠商自取）與分批轉交、送錯重送、supplier-portal 觸發銜接

## Impact

### 規格檔

- `openspec/specs/production-task/spec.md`：§ Requirements（新增 TransferTicket 相關 Requirements）、§ Data Model（新增 TransferTicket 表、ProductionTask 加 transfer_required）、§ Scenarios（新增分批與重送情境）

### Prototype（sens-erp-prototype）

- `src/components/task-dispatch/ProductionTaskDrawer.tsx`：新增「轉交單」分區（列表 + 新增按鈕 + 單筆展開）
- `src/pages/ProductionTaskList.tsx`：狀態 Badge 擴充（基於 TransferTicket 聚合）
- `src/components/task-dispatch/transfer/`（新資料夾）：TransferTicketList、TransferTicketCard、TransferTicketDialog（新增 / 編輯）、TransferRevokeDialog、TransferCancelDialog
- `src/types/transfer.ts`（新檔）：TransferTicket、TransferTicketStatus、TransferTargetType、TransferDeliveryMethod、RevocationType enums
- `src/types/dispatch.ts`：ProductionTask 加 transfer_required
- `src/lib/transfer/`（新資料夾）：`buildSlackSummary.ts`、`aggregateTransferStatus.ts`（聚合邏輯）、`validateTransferQuantity.ts`（可申請上限）
- 測試 fixtures：`src/lib/mock/` 新增 `mockTransferTickets`；三情境各造 1-2 筆
- 資料層稽核：`src/lib/data-consistency/crossLayerAssertions.ts` 評估是否納入轉交單彙總斷言

### Baseline 測量（上線前 1 週，與開發平行啟動）

- 由 Miles 每日下班前 5 分鐘口頭詢問 2 位印務「今天追了幾次物件、大概花多久、有沒有等貨 / 送錯」，Miles 代填，連續 5 個工作日（senior-pm 建議，取代原 10 天自填版本）
- 量化公式：`Baseline = 印務時薪 × 追蹤時間 + 下一站空等工時 × 產線人時成本 + 送錯重做次數 × 平均重做成本`（CEO 建議完整公式）
- 輸出：量化金額 + 事件登記表，作為成功指標 Baseline

### 成功指標（上線後 4 週起每週測量）

| 層次 | 指標 | 閾值 |
|------|------|------|
| 目標 | 轉交後 24h 內「下一站未收到」申訴次數 | 較 Baseline 月降 50% |
| 運營 | 建立單張 TransferTicket 平均填寫時間 | < 30 秒 |
| 防禦 | 已送達撤回率 | < 5%（撤回率過高代表填寫品質不足） |
| 品質 | 轉交單作廢率 | < 3%（作廢率過高代表建單資訊不齊） |

### 相關 OQ

**本 change 內解**（見 design.md）：
- 原附件 OQ #01：印務能否進工廠（決策：確認動作單一由印務操作，印務可進工廠屬 user-roles 既有權責）
- 原附件 OQ #04：已轉交撤回的權限與流程細節（採 revocation_type enum）
- 原附件 OQ #05：廠內執行者欄位格式（純文字不接系統帳號）

**延後追蹤**（已登錄 Notion Follow-up DB）：
- [PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca)：轉交完成後 Slack 摘要自動產生與轉發（Webhook 整合，本 change 先做自動複製）
- [XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875)：user-roles 新增「廠務」系統外角色定義
- [XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa)：business-scenarios 新增跨任務轉交鏈路情境（TransferTicket 實體已預備承接此情境）
- [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807)：日程面板新增「待轉交」篩選條件
- [WO-013](https://www.notion.so/34a3886511fa81f6bc18cb162bb328e9)：紙本工單列印需求範圍確認

### 系統相容性

- **supplier-portal**：供應商標記「製作完畢」原直接觸發「運送中」狀態；本 change 調整為先進入「待建立轉交單」子態，需印務建 TransferTicket 才能推進「運送中」，解決 ERP 顧問指出的 inconsistent state 風險
- **qc**：TransferTicket 與 QCRecord 同為 ProductionTask 的組合實體，兩者在 UI 上共存（工單詳情頁可擴充「轉交單彙總」tab，MVP 不做）；資料層互不干涉
- 不影響出貨、採購、倉儲模組

### 不納入（明確排除）

- Slack Webhook 自動推送（延後至 PT-002 + XM-002/004/006 合併整合 change）
- 廠務角色 spec 補強（延後至 XM-010）
- 業務情境補跨任務轉交鏈路（延後至 XM-011，TransferTicket 實體已預備承接）
- 日程面板「待轉交」篩選（延後至 PT-003）
- 紙本工單列印整合（延後至 WO-013）
- TransferAttachment 獨立表（簽收照片改用陣列欄位承接於 TransferTicket；未來正式上線需法律級追溯時另拆）
- 工單詳情頁「轉交單彙總」tab（類 QC 單聚合，MVP 不做，可選擴充）
- 掃碼 / QR code 追蹤（未來擴充，狀態機已預留擴充空間）
