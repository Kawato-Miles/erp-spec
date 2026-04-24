# add-production-task-transfer — Proposal

## Why

印件從完工到送達下一站的**跨站點運送**目前完全靠口頭 / LINE / Slack，沒有系統憑證。印務是這件事的決策者與當責人（派工 → 報工 → 轉交 → 下一棒，重複直到印件完成），但他活動的範圍在**工單 / 印件層**，不在生產任務層。

印務每天要能回答三個問題：
1. 現在發生什麼事？
2. 下一步該做什麼？
3. 有意外時我有多少 buffer、可以怎麼調度？

本 change 在**印件層**建立「轉交單（TransferTicket）」獨立實體作為跨站運送的憑證單據。主流程先跑通「能回答『該印件有轉交單』」的最小驗證，類似 QC 單 / 出貨單 Tab 的模式；後續再依實務回饋擴充指標與調度視圖。

## What Changes

- **新增 `TransferTicket` 實體**（獨立實體，印件級）：
  - FK 關聯**印件** (`printItemId`)，**不可跨印件**
  - 可跨**工單**：同一印件的「工單 A 印刷 + 工單 B 外包模切」可合為一張轉交單
  - 一印件可有多張轉交單（支援分批轉交、對應分批出貨）
- **新增 `TransferTicketLine` 子結構**：每張轉交單可含多條 line，每條 line 關聯一個生產任務與本次抽取的數量；支援「同張單多生產任務合併送下一站」
- **TransferTicket 狀態機（主流程 MVP）**：運送中 → 已送達 / 已作廢；撤回機制留待主流程跑通後再設計
- **上限規則**：每條 line.quantity 不得超過對應生產任務的 `ptProducedQty − 該生產任務在其他非作廢 Ticket 中被抽走的總量`（對應 Miles「報工後才可以轉交，不可大於報工數 − 已轉交數」）
- **Prototype UI**：在**印件詳情頁**新增「轉交單」Tab（Tab 順序：審稿 → 工單 → QC → **轉交** → 出貨 → 活動紀錄，符合業務流先後）
- **Tab 內容**：類 QC 單 Tab — 摘要 + 新增按鈕 + Ticket 卡片列表；每張 Ticket 顯示 lines 明細與操作按鈕（確認送達 / 作廢 / 重新複製 Slack 摘要）
- **Slack 通知連結**：TransferTicket 新增 `slackMessageUrl?: string` 欄位，對齊需求單 `QuoteRequest.slackLink` 模式；正式上線後 Webhook 發出 Slack 訊息 URL 由印務回填，Prototype 階段為純編輯欄（**不實作 Webhook**）。建單 Dialog 選填、詳情 Dialog 可 inline 編輯、主列表以 ExternalLink icon 顯示
- **作廢機制**：誤建救濟，AlertDialog 二次確認，target 不計入其他單的可申請上限
- **生產任務狀態機維持原樣**：轉交只是印件層憑證，不影響報工 / QC 既有狀態推進邏輯

## Capabilities

### New Capabilities

（本 change 不新增 capability，TransferTicket 作為 production-task capability 的組合實體，但 FK 指向印件層）

### Modified Capabilities

- `production-task`：新增 `TransferTicket` + `TransferTicketLine` 實體；狀態機維持不變（轉交不再推進生產任務狀態）；Scenarios 補充印件層轉交 + 分批 + 多生產任務合併單情境

## Impact

### 規格檔

- `openspec/specs/production-task/spec.md`：§ Requirements（新增 TransferTicket 相關）、§ Data Model（新增 TransferTicket / TransferTicketLine）

### Prototype（sens-erp-prototype）

- `src/types/transfer.ts`：TransferTicket（printItemId FK）+ TransferTicketLine
- `src/lib/transfer/`：aggregateTransferStatus（印件級 Badge）、validateTransferQuantity（line-level 上限）、buildSlackSummary（多 line 彙整格式）
- `src/components/task-dispatch/transfer/`：TransferTicketList（印件 Tab 內容）、TransferTicketDialog（多 line 選取器）、TransferTicketCard、TransferCancelDialog、transferOptions
- `src/pages/PrintItemDetail.tsx`：新增「轉交單」TabsTrigger + TabsContent（介於 QC 與出貨之間）
- `src/store/useErpStore.ts`：state `transferTickets`；actions `addTransferTicket` / `confirmTransferDelivered` / `cancelTransferTicket`
- 測試：27 個單元測試（聚合 6 / line 上限 14 / Slack 摘要 7）

### 不納入（明確排除）

- **撤回機制**（Miles 指示：主流程跑通後再設計）
- `transferRequired` flag 與跨站類工序清單（Miles 指示：印務是決策者，有 Ticket = 需要轉交）
- Slack Webhook 自動推送（延後至 PT-002）
- 工單詳情頁入口（Miles 指示：先做印件詳情頁就好）
- 印件層狀態總覽 / 建議行動清單（Miles 指示：UI 先簡化到「能回答該印件有轉交單」即可）
- 生產任務狀態機連動轉交聚合（生產任務維持原報工 / QC 邏輯）
- supplier-portal 觸發「待建立轉交單」子態（主流程跑通後再整合）
- user-roles 廠務角色補強（XM-010）、business-scenarios 鏈路情境（XM-011）、日程面板篩選（PT-003）、紙本列印（WO-013）— 已於 Notion Follow-up DB 追蹤

### Baseline 測量（上線前 1 週，與開發平行）

- Miles 每日下班前口頭詢問 2 位印務（5 個工作日）：追貨次數 / 時間 / 等貨 / 送錯
- 量化公式：`印務時薪 × 追蹤時間 + 下一站空等 × 產線成本 + 送錯次數 × 平均重做成本`

### 成功指標（上線後 4 週起）

| 層次 | 指標 | 閾值 |
|------|------|------|
| 目標 | 轉交後 24h 內「下一站未收到」申訴次數 | 較 Baseline 月降 50% |
| 運營 | 建立單張 TransferTicket 平均填寫時間 | < 60 秒（多 line 比單 line 稍高） |
| 防禦 | 轉交單作廢率 | < 3% |

### 相關 OQ

- 本 change 內不再處理附件 OQ #01 / #04 / #05（主流程簡化，這些延後）
- 所有延後 OQ 於 Notion Follow-up DB 追蹤：[PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca) / [XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875) / [XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa) / [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807) / [WO-013](https://www.notion.so/34a3886511fa81f6bc18cb162bb328e9)
