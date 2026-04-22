# production-task — Delta Spec (add-production-task-transfer)

本 change 新增 `TransferTicket` 實體承載所有轉交資訊，不再把 12 個 transfer_* 欄位塞進 ProductionTask 主表；修改生產任務狀態機讓「運送中 / 已完成」由 TransferTicket 聚合自動計算（類似 pt_qc_passed 聚合 QCRecord）。

---

## MODIFIED Requirements

### Requirement: 生產任務狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 生產任務定義的規則進行狀態轉換。若生產任務 `transfer_required = true`，其「運送中」與「已完成」狀態 SHALL 由所屬 TransferTicket 狀態聚合自動計算，不由使用者手動推進；若 `transfer_required = false`，維持原狀態機（製作中 → 已完成由報工達標觸發）。生管指派師傅為欄位更新（assigned_operator），不觸發狀態變更。

#### Scenario: 自有工廠無轉交路徑

- **WHEN** 生產任務由自有工廠或加工廠執行，且 `transfer_required = false`
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 已完成
- **AND** 「製作中」由首次報工觸發、「已完成」由報工達到 `pt_target_qty` 觸發

#### Scenario: 自有工廠需轉交路徑（由 TransferTicket 驅動）

- **WHEN** 生產任務由自有工廠或加工廠執行，且 `transfer_required = true`
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 運送中 → 已完成
- **AND** 進入「運送中」需要該任務有任一 `TransferTicket.status = in_transit` 的有效單
- **AND** 進入「已完成」需要該任務報工達標且所有非作廢 TransferTicket 均 `status = delivered`
- **AND** 本狀態轉換 MUST NOT 由使用者手動推進，而是由 TransferTicket 聚合邏輯自動計算

#### Scenario: 外包廠路徑（由 supplier-portal + TransferTicket 驅動）

- **WHEN** 生產任務由外包廠執行
- **THEN** 狀態路徑：待處理 → 製作中 → 待建立轉交單 → 運送中 → 已完成
- **AND** 「待建立轉交單」由供應商於供應商平台標記「製作完畢」觸發
- **AND** 「運送中」由印務建立第一張 TransferTicket 觸發
- **AND** 「已完成」由所有非作廢 TransferTicket delivered 觸發

#### Scenario: 中國廠商路徑

- **WHEN** 生產任務由中國廠商執行
- **THEN** 狀態路徑：待處理 → 製作中 → 已送集運商 → 待建立轉交單 → 運送中 → 已完成
- **AND** 「已送集運商」保留原邏輯；「待建立轉交單」在集運商交貨給最後一哩前需印務建立 TransferTicket

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 生產任務狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 生產任務作廢（未進入生產）

- **WHEN** 生管在生產任務尚未進入「製作中」時取消
- **THEN** 狀態轉為「已作廢」（無成本）
- **AND** 該任務下所有 TransferTicket（若有）SHALL 自動轉為「已作廢」，作廢原因標記為「所屬生產任務已作廢」

#### Scenario: 生產任務報廢（已進入生產）

- **WHEN** 已進入「製作中」的生產任務被取消
- **THEN** 狀態轉為「報廢」，費用以報工數計算
- **AND** 該任務下狀態為「運送中」的 TransferTicket SHALL 自動轉為「已作廢」；「已送達」的 Ticket 保留紀錄但不納入完成度

---

## ADDED Requirements

### Requirement: TransferTicket 實體定位

轉交單（TransferTicket）SHALL 為獨立實體，透過 `production_task_id` 關聯生產任務，承載所有轉交相關資訊與操作紀錄。**本實體的存在目的是讓跨站點物件運送的當責與憑證可被查詢與追責**，非單純資料欄位擴充。一生產任務 SHALL 可擁有多張 TransferTicket 以支援分批轉交、送錯重送、跨站接力等情境。工單詳情頁若需彙總轉交單列表，MUST 透過 `ProductionTask → WorkOrder` 關聯聚合。

#### Scenario: TransferTicket 建立時寫入生產任務 FK

- **WHEN** 印務在 ProductionTaskDrawer 的轉交單分區點擊「新增轉交單」，選擇目的地、填寫這批數量（target_quantity）、運送方式等必填欄位
- **THEN** 系統 MUST 建立 TransferTicket，寫入 `production_task_id` 為當前任務 ID
- **AND** TransferTicket MUST NOT 直接持有 `work_order_id`；工單關聯透過 `production_task.work_order_id` 間接取得

#### Scenario: 一生產任務多張轉交單（分批）

- **WHEN** 某生產任務 pt_target_qty = 1000、pt_produced_qty = 1000，印務分兩批轉交：先送 600 給下一站、再送 400
- **THEN** 系統 SHALL 允許建立 TransferTicket A（target_quantity = 600）與 TransferTicket B（target_quantity = 400）
- **AND** A 與 B 各自獨立狀態機、獨立欄位、獨立確認送達

#### Scenario: 工單詳情頁轉交單彙總（可選擴充）

- **WHEN** 工單詳情頁若擴充「轉交單」聚合視圖（MVP 可不做）
- **THEN** 系統 SHALL 以 `work_order_id → production_task → transfer_ticket` 路徑彙總該工單下所有 TransferTicket

---

### Requirement: TransferTicket 狀態機

TransferTicket SHALL 依以下狀態流轉：

- 主路徑：運送中 → 已送達
- 撤回路徑（可逆）：已送達 → 運送中（必填 revocation_type 與 revocation_reason）
- 作廢路徑：運送中 → 已作廢（建錯 / 情境變更）

「已作廢」為終態 MUST NOT 可回退；「已送達」可由印務撤回一次以上（每次撤回追加 RevocationLog）。「已作廢」的 TransferTicket 其 target_quantity MUST NOT 計入「已申請轉交量」，但紀錄保留供稽核。

#### Scenario: 建立時直接進入運送中

- **WHEN** 印務建立 TransferTicket 並填妥必填欄位（目的地、target_quantity、對象類型）
- **THEN** TransferTicket 狀態 SHALL 為「運送中」
- **AND** 系統 MUST NOT 提供「待送出」的前置狀態（未來若接 QR code 掃碼再擴充）

#### Scenario: 印務確認送達

- **WHEN** 印務親自或透過 Slack / 電話與廠務 / 外包廠 / 中國廠商確認物件已送達，於 TransferTicket 點擊「確認已送達」
- **THEN** TransferTicket 狀態 SHALL 從「運送中」變為「已送達」
- **AND** 系統 MUST 寫入 `actual_date = 當日日期`、`confirmed_by = 當前登入印務`
- **AND** 若該生產任務所有非作廢 TransferTicket 皆已送達，生產任務狀態 SHALL 自動推進至「已完成」

#### Scenario: 印務撤回已送達

- **WHEN** 印務發現送達紀錄有誤（例：貨物送錯目的地、需重新安排），於「已送達」TransferTicket 點擊「撤回」，選擇 revocation_type 並填原因
- **THEN** TransferTicket 狀態 SHALL 從「已送達」變為「運送中」
- **AND** 系統 MUST 追加一筆 TransferRevocationLog（`ticket_id`、`type`、`reason`、`operator_id`、`timestamp`、`before_actual_date`、`before_confirmed_by`）
- **AND** TransferTicket 的 `actual_date`、`confirmed_by` MUST 重置為 null
- **AND** 若該生產任務原為「已完成」，SHALL 自動回退至「運送中」

#### Scenario: revocation_type 限定為 enum

- **WHEN** 印務選擇撤回類型
- **THEN** 系統 SHALL 提供四個選項：送錯目的地 / 數量不符 / 品質不符 / 其他
- **AND** 選擇「其他」SHALL 要求原因欄位非空字串（驗證純文字說明）
- **AND** 送錯目的地 / 數量不符 / 品質不符 三類 SHALL 被標示為「NCR 聯動候選」，供未來 QC 流程串接（本 change 不實作聯動）

#### Scenario: 印務作廢運送中

- **WHEN** 印務發現 TransferTicket 建錯（例：目的地填錯需重開單），於「運送中」狀態點擊「作廢」並填原因
- **THEN** TransferTicket 狀態 SHALL 變為「已作廢」
- **AND** 系統 MUST 寫入 `cancelled_at`、`cancelled_by`、`cancelled_reason`
- **AND** 該 Ticket 的 target_quantity MUST NOT 再計入「已申請轉交量」

#### Scenario: 生產任務作廢自動帶動 Ticket 作廢

- **WHEN** 生產任務因工單異動轉為「已作廢」或「報廢」，且其下有「運送中」TransferTicket
- **THEN** 系統 MUST 自動將這些 Ticket 狀態變為「已作廢」，cancelled_reason 標記「所屬生產任務已作廢」
- **AND** 已送達的 Ticket MUST NOT 被改動，紀錄保留

---

### Requirement: TransferTicket 建立流程

系統 SHALL 支援印務在 ProductionTaskDrawer 的轉交單分區建立 TransferTicket。建立前置條件與必填：

- 生產任務 `transfer_required` MUST 為 true
- 生產任務 `pt_produced_qty` MUST > 0（有實際報工才能轉交已生產的物件）
- `target_quantity` MUST 不超出「可申請轉交量上限」
- 對象類型（內部產線 / 外部廠商）必填
- 內部產線：目的產線 FK 必填（含倉庫入庫選項）
- 外部廠商：目的廠商 FK 必填（自動帶聯絡人 / 電話 / 地址，預填上次同供應商的運送方式）

#### Scenario: 印務建立內部產線轉交單

- **WHEN** 印務開啟 ProductionTaskDrawer「轉交單」分區，點「新增轉交單」，選擇對象類型=內部產線、目的產線=手工產線B區、target_quantity=500、廠內執行者=阿明、備註=需附紙本工單
- **THEN** 系統 SHALL 建立 TransferTicket 並寫入必填欄位
- **AND** 狀態設為「運送中」

#### Scenario: 印務建立外部廠商轉交單

- **WHEN** 印務選擇對象類型=外部廠商、目的廠商=智盛加工、運送方式=貨運行、貨運行名稱=金城、target_quantity=520、預計轉交日=2026-04-14
- **THEN** 系統 SHALL 建立 TransferTicket
- **AND** 若上次同供應商運送方式為「貨運行」，系統 SHALL 預填此欄位作為輸入預設

#### Scenario: transfer_required = false 禁止建單

- **WHEN** 印務嘗試為 `transfer_required = false` 的任務建立 TransferTicket
- **THEN** 系統 SHALL 隱藏「新增轉交單」按鈕
- **AND** 即使繞過前端呼叫建立 API，後端 MUST 拒絕並回傳驗證錯誤

#### Scenario: pt_produced_qty = 0 禁止建單

- **WHEN** 印務嘗試為尚無報工紀錄（pt_produced_qty = 0）的任務建立 TransferTicket
- **THEN** 系統 SHALL 提示「需先完成報工才能建立轉交單」並阻擋建立

---

### Requirement: 轉交單可申請上限

系統 MUST 確保 TransferTicket 的 target_quantity 不超過「可申請轉交量上限」，避免超量轉交。

**計算公式**（單位一致以生產任務單位計算）：

```
可申請轉交量上限 = pt_produced_qty - 其他有效 Ticket 已申請轉交量
其他有效 Ticket 已申請轉交量 = sum(TransferTicket.target_quantity 
  where production_task_id = pt.id 
    AND ticket.id != 本次建立的 Ticket 
    AND status IN ('運送中', '已送達'))
（排除「已作廢」狀態）
```

#### Scenario: 首次建單上限

- **WHEN** 某生產任務 pt_produced_qty = 1000、尚無任何 TransferTicket，印務嘗試建立 target_quantity = 1000 的 Ticket
- **THEN** 系統 SHALL 允許建立（1000 <= 1000）

#### Scenario: 分批建單累加

- **WHEN** 同上任務已有 Ticket A（target_quantity = 600、運送中），印務建立 Ticket B
- **THEN** 可申請上限 = 1000 - 600 = 400，Ticket B target_quantity MUST 不超過 400

#### Scenario: 作廢後上限恢復

- **WHEN** Ticket A（target_quantity = 600）被作廢後，印務再建立 Ticket C
- **THEN** 可申請上限 = 1000 - 0（A 作廢不計）= 1000，Ticket C target_quantity MUST 不超過 1000

#### Scenario: 超量建單阻擋

- **WHEN** 印務嘗試建立 target_quantity 超過上限的 Ticket
- **THEN** 系統 SHALL 顯示「超過可申請轉交量上限」並阻擋建立

---

### Requirement: supplier-portal 觸發銜接

外包廠 / 中國廠生產任務在供應商標記「製作完畢」時，原直接觸發「運送中」的邏輯 SHALL 調整為進入「待建立轉交單」子態；需印務建立第一張 TransferTicket 才能推進至「運送中」，解決供應商觸發後欄位空白的 inconsistent state 風險。

#### Scenario: 供應商標記製作完畢

- **WHEN** 外包廠供應商於供應商平台將生產任務標記為「製作完畢」
- **THEN** 外包廠路徑：生產任務狀態 SHALL 從「製作中」變為「待建立轉交單」（非原「運送中」）
- **AND** 中國廠商路徑：從「製作中」變為「已送集運商」；集運商交貨給最後一哩送達前再進「待建立轉交單」
- **AND** 系統 SHALL 通知印務「XX 任務供應商已完成，需建立轉交單」

#### Scenario: 印務建立第一張 Ticket 推進

- **WHEN** 印務為「待建立轉交單」狀態的任務建立第一張 TransferTicket
- **THEN** 生產任務狀態 SHALL 從「待建立轉交單」變為「運送中」
- **AND** 後續 Ticket 建立僅追加不改變生產任務狀態（狀態已於第一張 Ticket 時推進）

---

### Requirement: Slack 摘要自動複製

TransferTicket 建立時，系統 SHALL 自動產生摘要文字並複製至剪貼簿，同時顯示 Toast「已複製至剪貼簿，可貼到 Slack」，避免印務多一道複製動作。摘要為 PT-002（Slack Webhook 自動推送）落地前的橋接機制。

摘要格式：

```
【轉交任務】
印件：{print_item_name}
任務：{production_task_id} {process_name} 完成 → {destination}
數量：{target_quantity}
廠務：{handler_name}
備註：{notes}
```

#### Scenario: 建單時自動複製

- **WHEN** 印務按下「儲存」建立 TransferTicket
- **THEN** 系統 MUST 在寫入資料的同時呼叫 `navigator.clipboard.writeText` 將摘要寫入剪貼簿
- **AND** 顯示 shadcn Toast「已複製至剪貼簿，可貼到 Slack」

#### Scenario: 欄位缺失以占位符處理

- **WHEN** 摘要欲帶入的欄位為 null（例如 handler_name 未填）
- **THEN** 系統 SHALL 於該位置顯示「—」或省略該行，不 block 建單流程

#### Scenario: 手動重新複製

- **WHEN** 印務在 TransferTicket 詳情點擊「重新複製 Slack 摘要」按鈕
- **THEN** 系統 SHALL 重新產生摘要並複製至剪貼簿

---

### Requirement: 轉交 Badge 顯示

ProductionTaskList 任務列 SHALL 顯示基於 TransferTicket 聚合的轉交 Badge，與主狀態 Badge 並列，讓印務可快速識別待轉交任務。Badge 文字採業務語言（「待轉交 / 已轉交」），不直接使用技術狀態名稱。

#### Scenario: 有運送中 Ticket 顯示待轉交

- **WHEN** 生產任務有任一 TransferTicket `status = 運送中`
- **THEN** 列表列 SHALL 顯示黃色 Badge「待轉交」

#### Scenario: 所有 Ticket 已送達顯示已轉交

- **WHEN** 生產任務所有非作廢 TransferTicket `status = 已送達`，且至少有一張非作廢 Ticket
- **THEN** 列表列 SHALL 顯示綠色 Badge「已轉交」

#### Scenario: transfer_required = false 不顯示

- **WHEN** 生產任務 `transfer_required = false`
- **THEN** 列表列 MUST NOT 顯示轉交 Badge

#### Scenario: 僅有作廢 Ticket 視為無轉交

- **WHEN** 生產任務所有 TransferTicket `status = 已作廢`（例如印務建錯後全部作廢）
- **THEN** 列表列 SHALL 視同無 Ticket 處理，按業務狀態顯示（若 transfer_required = true 則為「待轉交」空狀態提示）

---

### Requirement: 自有廠 transfer_required 推薦勾選

自有工廠 / 加工廠建立生產任務時，若 process 屬「跨站類」（印刷、上光、模切、燙金等需後續加工），系統 SHALL 預設推薦 `transfer_required = true`；其他工序（如包裝、清點）預設 false。印務可覆蓋系統建議。

#### Scenario: 跨站工序預設勾選

- **WHEN** 印務建立自有工廠生產任務，process = 印刷（屬跨站類）
- **THEN** 系統 SHALL 預設 `transfer_required = true`
- **AND** 印務若確認就地交接可手動改為 false

#### Scenario: 非跨站工序預設不勾

- **WHEN** 印務建立自有工廠生產任務，process = 清點（非跨站類）
- **THEN** 系統 SHALL 預設 `transfer_required = false`

#### Scenario: 跨站類工序清單管理

- **WHEN** 系統維護「跨站類工序」判定規則
- **THEN** 本 change 於 Prototype 以硬編碼清單實作（印刷 / 上光 / 模切 / 燙金）
- **AND** 正式上線前 MUST 於 Process 主檔加欄位 `is_cross_station` 讓業務可維護（本 change 不涵蓋主檔異動，待 Process 主檔 change）

---

### Requirement: TransferTicket Data Model

系統 SHALL 實作 TransferTicket 實體的資料模型如下，承載所有轉交欄位與狀態紀錄。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 生產任務 | production_task_id | FK | Y | Y | FK → ProductionTask |
| 狀態 | status | 單選 | Y | | 運送中 / 已送達 / 已作廢 |
| 對象類型 | target_type | 單選 | Y | | 內部產線 / 外部廠商 |
| 目的產線 | destination_line_id | FK | 條件必填 | | target_type = 內部產線時必填，FK → ProductionLine（含倉庫入庫） |
| 目的廠商 | destination_vendor_id | FK | 條件必填 | | target_type = 外部廠商時必填，FK → Vendor |
| 運送方式 | delivery_method | 單選 | | | 廠內自送 / 貨運行 / 供應商自取 / 其他 |
| 貨運行名稱 | carrier_name | 字串 | 條件必填 | | delivery_method = 貨運行時必填，純文字 |
| 廠內執行者 | handler_name | 字串 | | | 廠務姓名（純文字，不接系統帳號） |
| 這批數量 | target_quantity | 整數 | Y | | 本次轉交的數量，不超過可申請上限 |
| 備註 | notes | 文字 | | | 自由文字 |
| 預計轉交日 | expected_date | 日期 | | | |
| 實際轉交日 | actual_date | 日期 | 系統自動 | Y | 印務確認送達時自動寫入 |
| 確認操作人 | confirmed_by | FK | 系統自動 | Y | FK → User（印務），送達時寫入 |
| 簽收照片 | signature_photos | 檔案陣列 | | | 支援多張，外部廠商建議上傳 |
| 撤回時間 | revoked_at | 日期時間 | | | 最近一次撤回時間（歷次撤回於 TransferRevocationLog） |
| 撤回操作人 | revoked_by | FK | | | 最近一次撤回的印務 FK → User |
| 作廢時間 | cancelled_at | 日期時間 | | | |
| 作廢操作人 | cancelled_by | FK | | | FK → User |
| 作廢原因 | cancelled_reason | 文字 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

#### Scenario: 建立 Ticket 時寫入必填欄位

- **WHEN** 系統建立新 TransferTicket
- **THEN** id、production_task_id、status、target_type、target_quantity、created_at、updated_at MUST 全部寫入
- **AND** 依 target_type 分支：內部產線 MUST 寫入 destination_line_id；外部廠商 MUST 寫入 destination_vendor_id
- **AND** delivery_method = 貨運行時 MUST 寫入 carrier_name

#### Scenario: 送達時系統自動欄位寫入

- **WHEN** 印務於 TransferTicket 點擊「確認送達」
- **THEN** actual_date MUST 寫入當日日期、confirmed_by MUST 寫入當前登入印務 ID
- **AND** 此兩欄位為系統自動、使用者不可手動編輯

---

### Requirement: TransferRevocationLog Data Model

系統 SHALL 實作 append-only 的 TransferRevocationLog 紀錄歷次撤回，支援同一 Ticket 多次撤回的完整因果追蹤。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| ID | id | UUID | Y | 主鍵 |
| 轉交單 | ticket_id | FK | Y | FK → TransferTicket |
| 撤回類型 | revocation_type | 單選 | Y | 送錯目的地 / 數量不符 / 品質不符 / 其他 |
| 撤回原因 | reason | 文字 | Y | type = 其他時 SHALL 為非空字串 |
| 操作人 | operator_id | FK | Y | FK → User（印務） |
| 撤回時間 | timestamp | 日期時間 | Y | |
| 原實際轉交日 | before_actual_date | 日期 | Y | 撤回前的 actual_date（供還原歷史） |
| 原確認操作人 | before_confirmed_by | FK | Y | 撤回前的 confirmed_by |

#### Scenario: 撤回時 append 一筆 log

- **WHEN** 印務撤回 TransferTicket
- **THEN** 系統 MUST 新增一筆 TransferRevocationLog，寫入 ticket_id、revocation_type、reason、operator_id、timestamp、before_actual_date、before_confirmed_by
- **AND** 既有 log MUST NOT 被修改或刪除（append-only）

#### Scenario: 多次撤回皆保留

- **WHEN** 同一 TransferTicket 被撤回兩次以上（例如撤回後又確認再撤回）
- **THEN** 每次撤回各 append 一筆獨立 log
- **AND** 查詢 Ticket 撤回歷史時 SHALL 回傳所有 log 按 timestamp 排序

---

### Requirement: ProductionTask.transfer_required 欄位

ProductionTask SHALL 新增單一旗標欄位 `transfer_required` 標記本任務是否需走轉交流程。**所有轉交細節欄位 MUST 於 TransferTicket 上承載，不於 ProductionTask 新增其他 transfer_* 欄位。**

| 欄位 | 英文名稱 | 型別 | 必填 | 預設 | 說明 |
|------|---------|------|------|------|------|
| 是否需要轉交 | transfer_required | 布林 | Y | 依工廠類型與工序類別 | 外包廠 / 中國廠：true 且不可改；自有廠 / 加工廠：依工序類別推薦 |

#### Scenario: 新增 ProductionTask 寫入 transfer_required

- **WHEN** 系統建立新 ProductionTask
- **THEN** transfer_required MUST 有值（true 或 false），依工廠類型與工序類別自動推薦
- **AND** ProductionTask MUST NOT 新增其他 transfer_* 欄位（如 transfer_target_type 等），避免與 TransferTicket 語意重複

#### Scenario: 外包 / 中國廠鎖定 true

- **WHEN** ProductionTask 的 factory_type 為外包廠或中國廠商
- **THEN** transfer_required MUST 為 true
- **AND** 系統 MUST NOT 允許將其改為 false
