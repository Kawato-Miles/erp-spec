# production-task — Delta Spec (add-production-task-transfer)

本 change 新增 **印件級 `TransferTicket` + `TransferTicketLine`** 實體承載跨站運送憑證；生產任務狀態機**維持原樣**（轉交不影響報工 / QC 邏輯）。

MVP 主流程僅支援新增 / 確認送達 / 作廢；撤回機制於主流程跑通後再設計。

---

## ADDED Requirements

### Requirement: TransferTicket 實體定位

轉交單（TransferTicket）SHALL 為獨立實體，透過 `printItemId` FK 關聯**印件**層，承載跨站運送資訊與確認憑證。

**關聯範圍限制**：
- 一張 TransferTicket MUST 綁定單一 printItemId，**不可跨印件**
- 同一 TransferTicket 的 lines[] 可含**跨工單但同印件**的生產任務
  （例：印件 A 的工單 1 印刷 + 工單 2 外包模切合併為一張單）

一印件 SHALL 可擁有多張 TransferTicket 以支援分批轉交（對應分批出貨）。

#### Scenario: 建立時寫入印件 FK

- **WHEN** 印務於印件詳情頁「轉交單」Tab 點擊「新增轉交單」並填寫
- **THEN** 系統 MUST 寫入 `printItemId` 為該印件 ID
- **AND** MUST NOT 持有 `workOrderId` 欄位（工單關聯透過 lines[].productionTaskId → workOrder 間接取得）

#### Scenario: 同印件跨工單合併單

- **WHEN** 印務為印件 X 建單，選取工單 A 的印刷任務 100 + 工單 B 的模切任務 100
- **THEN** 系統 SHALL 建立一張 TransferTicket 包含兩條 lines
- **AND** 兩條 lines 的 productionTaskId 對應的印件 FK MUST 均為 X

#### Scenario: 禁止跨印件

- **WHEN** 印務嘗試在一張 TransferTicket 的 lines 內混入不同印件的生產任務
- **THEN** 系統 MUST 阻擋並提示「同一轉交單內所有生產任務必須屬於同一印件」

#### Scenario: 一印件多張轉交單

- **WHEN** 印件 X 第一批先送 100 建 Ticket A、剩下 200 隔日再送建 Ticket B
- **THEN** 系統 SHALL 允許 A 與 B 各自獨立狀態、獨立確認送達

---

### Requirement: TransferTicket 狀態機

TransferTicket SHALL 依以下狀態流轉：

- 主路徑：運送中 → 已送達
- 作廢路徑：運送中 → 已作廢

「已送達」與「已作廢」為終態，MUST NOT 可回退。撤回機制（已送達 → 運送中）於主流程跑通後再設計。「已作廢」的 TransferTicket 其 lines 的 quantity MUST NOT 計入其他單的可申請上限，但紀錄保留供稽核。

#### Scenario: 建立時直接進入運送中

- **WHEN** 印務建立 TransferTicket 並填妥必填欄位（目的地、至少一條 line）
- **THEN** TransferTicket 狀態 SHALL 為「運送中」

#### Scenario: 印務確認送達

- **WHEN** 印務於「運送中」Ticket 點擊「確認送達」
- **THEN** 狀態 SHALL 變為「已送達」
- **AND** 系統 MUST 寫入 `actualDate = 當日`、`confirmedBy = 當前登入印務`

#### Scenario: 印務作廢

- **WHEN** 印務於「運送中」Ticket 點擊「作廢」，二次確認並填原因
- **THEN** 狀態 SHALL 變為「已作廢」
- **AND** 系統 MUST 寫入 `cancelledAt`、`cancelledBy`、`cancelledReason`
- **AND** 該 Ticket 所有 lines 的 quantity MUST NOT 計入其他單的可申請上限

#### Scenario: 已送達無撤回路徑（MVP）

- **WHEN** 印務查看「已送達」Ticket
- **THEN** UI MUST NOT 顯示「撤回」操作按鈕
- **AND** 若印務需修正，須透過「作廢原單 + 開新單」流程表達（後續主流程通後將補撤回）

---

### Requirement: TransferTicket 建立流程

印務 SHALL 於印件詳情頁的「轉交單」Tab 建立 TransferTicket。建立前置與必填：

- 印件下至少一個生產任務有報工紀錄（`pt_produced_qty > 0`）
- 對象類型（內部產線 / 外部廠商）必填
  - 內部產線：目的產線 FK 必填
  - 外部廠商：目的廠商 FK 必填
- `lines[]` 至少含一條合法 line
  - 每條 line 的 productionTaskId MUST 屬於該印件
  - 每條 line.quantity > 0 且為整數
  - 每條 line.quantity 不超過該生產任務的可申請上限
- 同張單內同一生產任務 MUST NOT 重複出現於 lines

#### Scenario: 建立含多條 lines

- **WHEN** 印務為印件 X 建單，對象類型=內部產線、目的產線=手工產線B區，lines 含印刷 100 + 模切 100
- **THEN** 系統 SHALL 建立 TransferTicket 寫入兩條 lines
- **AND** Ticket 狀態 = 運送中

#### Scenario: 貨運行必填

- **WHEN** 印務建單選擇 deliveryMethod = 貨運行但未填 carrierName
- **THEN** 系統 SHALL 阻擋並提示貨運行名稱必填

#### Scenario: 無可轉交量禁止建單

- **WHEN** 印件下所有生產任務 `pt_produced_qty = 0`
- **THEN** 「新增轉交單」按鈕 SHALL 禁用，並提示「需先完成報工」

#### Scenario: 重複 productionTaskId 阻擋

- **WHEN** 印務嘗試建單 lines 含兩條相同 productionTaskId
- **THEN** 系統 SHALL 阻擋並提示「同一生產任務不可重複」

---

### Requirement: Line-level 可申請上限

系統 MUST 對建單 / 編輯的每條 line 獨立驗證可申請上限，不可讓某生產任務被超額抽取。

**公式（每條 line）**：

```
line.quantity <= pt.ptProducedQty
              − sum(同印件其他非作廢 Ticket 中該 productionTaskId 的 line.quantity)
```

「已作廢」狀態 Ticket 的 lines 不計入占用（符合 QC 可申請上限模式）。

#### Scenario: 首次建單上限 = 報工量

- **WHEN** 印件 X 的印刷任務 ptProducedQty = 1000、尚無 Ticket
- **THEN** 該 line 可申請上限 = 1000

#### Scenario: 其他非作廢 Ticket 占用扣除

- **WHEN** 印件 X 已有 Ticket A（運送中，印刷 line = 600），印務建 Ticket B
- **THEN** Ticket B 的印刷 line 可申請上限 = 1000 − 600 = 400

#### Scenario: 作廢 Ticket 恢復上限

- **WHEN** Ticket A 被作廢後，印務建 Ticket C
- **THEN** C 的印刷 line 可申請上限 = 1000（A 作廢不計）

#### Scenario: 編輯模式排除自身

- **WHEN** 印務編輯 Ticket B（既有印刷 line = 400），想改為 500
- **THEN** 驗證時 MUST 排除 Ticket B 自身既有占用
- **AND** 上限 = 1000 − 600（其他）= 400；若 A 也作廢則 = 1000

#### Scenario: 超量阻擋

- **WHEN** 印務嘗試建 line.quantity 超過上限
- **THEN** 系統 SHALL 阻擋並顯示具體上限值

---

### Requirement: Slack 摘要自動複製

TransferTicket 建立時，系統 SHALL 自動呼叫 `navigator.clipboard.writeText` 將摘要寫入剪貼簿，同時顯示 Toast「已複製至剪貼簿，可貼到 Slack」。

摘要格式：

```
【轉交任務】
印件：{printItemName}
來源：{lines 彙整：「{productionTaskName} {quantity}」以「 + 」串接}
送至：{destination}
總數：{sum(lines.quantity)}
廠務：{handlerName}
備註：{notes}
預計：{expectedDate}
```

欄位缺失時以「—」占位或省略整行，不 block 建單。

#### Scenario: 多 line 來源彙整

- **WHEN** TransferTicket lines = [{印刷, 100}, {模切, 100}]
- **THEN** 摘要「來源」行 MUST 顯示「印刷 100 + 模切 100」
- **AND** 摘要「總數」行 MUST 顯示「200」

#### Scenario: 建單時自動複製

- **WHEN** 印務於 Dialog 點「儲存並建立」
- **THEN** 系統 MUST 在寫入 store 的同時呼叫 clipboard API 寫入摘要
- **AND** 顯示 Toast「已複製至剪貼簿，可貼到 Slack」

#### Scenario: 手動重新複製

- **WHEN** 印務於 Ticket 卡片點「重新複製 Slack 摘要」
- **THEN** 系統 SHALL 重新產生摘要並複製

---

### Requirement: 印件詳情頁「轉交單」Tab

印件詳情頁 SHALL 於 Tabs 內新增「轉交單」Tab，位置介於「QC 紀錄」與「出貨單」之間（遵循 DESIGN.md §0 Tab 順序依業務流先後）。

Tab 標題 MUST 顯示該印件的 TransferTicket 數量計數：`轉交單（N）`。

Tab 內容 MUST 包含：
- 摘要文字（運送中 / 已送達 / 已作廢 各數量）
- 「新增轉交單」按鈕（無可申請量時 disable）
- Ticket 卡片列表（依 createdAt 遞減排序）

每張 Ticket 卡片 MUST 顯示：
- 編號（ticketNo）+ 狀態 Badge + 總數
- 目的地（targetType + destination name）
- 運送方式 + 貨運行名稱（若有）
- 廠內執行者（若有）
- 預計 / 實際轉交日
- lines 明細列表（每條 line：生產任務名稱 + 數量）
- 備註 / 作廢原因（若有）
- 操作按鈕（依狀態：確認送達 / 作廢 / 重新複製 Slack 摘要）

#### Scenario: Tab 位置

- **WHEN** 使用者開啟印件詳情頁
- **THEN** Tabs 順序 SHALL 為：審稿紀錄 → 工單 → QC 紀錄 → **轉交單** → 出貨單 → 活動紀錄

#### Scenario: Tab 無轉交單時空狀態

- **WHEN** 印件尚無 TransferTicket
- **THEN** Tab 內容 SHALL 顯示空狀態訊息，「新增轉交單」按鈕視報工狀態啟用 / 禁用

---

### Requirement: TransferTicket Data Model

系統 SHALL 實作 TransferTicket 實體的資料模型如下：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 編號 | ticketNo | 字串 | Y | | 格式 TT-YYYYMMDD-NNN |
| 印件 | printItemId | FK | Y | Y | FK → PrintItem；單一關聯不跨印件 |
| 印件名稱 | printItemName | 字串 | Y | Y | 快照（顯示用） |
| 狀態 | status | 單選 | Y | | 運送中 / 已送達 / 已作廢 |
| 對象類型 | targetType | 單選 | Y | | 內部產線 / 外部廠商 |
| 目的產線 | destinationLineId | FK | 條件必填 | | targetType = 內部產線時必填 |
| 目的廠商 | destinationVendorId | FK | 條件必填 | | targetType = 外部廠商時必填 |
| 運送方式 | deliveryMethod | 單選 | | | 廠內自送 / 貨運行 / 供應商自取 / 其他 |
| 貨運行名稱 | carrierName | 字串 | 條件必填 | | deliveryMethod = 貨運行時必填 |
| 廠內執行者 | handlerName | 字串 | | | 廠務姓名純文字 |
| Lines | lines | 陣列 | Y | | 至少一條 TransferTicketLine |
| 備註 | notes | 文字 | | | |
| 預計轉交日 | expectedDate | 日期 | | | |
| 實際轉交日 | actualDate | 日期 | 系統自動 | Y | 確認送達時寫入 |
| 確認操作人 | confirmedBy | FK | 系統自動 | Y | FK → User |
| 簽收照片 | signaturePhotos | 檔案陣列 | | | Prototype 階段 placeholder |
| 作廢時間 | cancelledAt | 日期時間 | | | |
| 作廢操作人 | cancelledBy | FK | | | |
| 作廢原因 | cancelledReason | 文字 | | | |
| 建立時間 | createdAt | 日期時間 | Y | Y | |
| 更新時間 | updatedAt | 日期時間 | Y | Y | |

#### Scenario: 建立時寫入必填欄位

- **WHEN** 系統建立新 TransferTicket
- **THEN** id / ticketNo / printItemId / status / targetType / lines / createdAt / updatedAt MUST 全部寫入
- **AND** 內部產線：destinationLineId MUST 寫入；外部廠商：destinationVendorId MUST 寫入

#### Scenario: 確認送達時系統自動欄位寫入

- **WHEN** 印務點擊「確認送達」
- **THEN** actualDate MUST 寫入當日、confirmedBy MUST 寫入當前登入印務 ID

---

### Requirement: TransferTicketLine Data Model

系統 SHALL 實作 TransferTicketLine 子結構，儲存於 TransferTicket.lines 陣列，每條 line 代表從某個生產任務抽取的部分數量。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 生產任務 | productionTaskId | FK | Y | FK → ProductionTask；必須屬於 Ticket 的 printItemId |
| 生產任務名稱 | productionTaskName | 字串 | Y | 快照（顯示用），通常為 taskNo + process |
| 數量 | quantity | 整數 | Y | > 0，不超過 line-level 上限 |

#### Scenario: 寫入 line 時驗證印件歸屬

- **WHEN** 系統建立或更新 Ticket，lines 含一條 productionTaskId
- **THEN** 系統 MUST 驗證該 PT 所屬工單的 printItemId 等於 Ticket.printItemId
- **AND** 不一致時 MUST 拒絕寫入

#### Scenario: 同單重複 PT 阻擋

- **WHEN** 系統檢驗 lines 陣列
- **THEN** 相同 productionTaskId MUST NOT 出現兩次以上
