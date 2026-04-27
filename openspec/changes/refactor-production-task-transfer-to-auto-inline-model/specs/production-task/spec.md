## MODIFIED Requirements

### Requirement: TransferTicket 實體定位

轉交單（TransferTicket）SHALL 為獨立實體（Header 層級），透過 `printItemId` FK 關聯**印件**層，承載一次實體交接動作的時空資訊（目的地、運送方式、貨運行、簽收等）。一張 TransferTicket 包含一筆 `TransferTicketLine`（子實體）對應「一次報工 → 某個下游生產任務」的轉交記錄。

**關聯範圍限制**：
- 一張 TransferTicket MUST 綁定單一 `printItemId`，**不可跨印件**
- 一張 TransferTicket 現階段含**唯一一筆** Line（1:1）；Line 子實體保留為未來擴展預留

**現階段 1:1 規則**：
- 每次報工自動建立一張 Header + 一筆 Line（同一報工 PT 若同時有多個下游依賴邊，為每個下游各自建立獨立 Header）
- 不批次合併、不跨多筆報工合併

一印件 SHALL 可擁有多張 TransferTicket：每次報工各自建立獨立 Ticket。

#### Scenario: 建立時寫入印件 FK 與目的地

- **WHEN** 系統於報工事件自動建立 TransferTicket
- **THEN** 系統 MUST 寫入 `printItemId` 為該報工 PT 所屬印件 ID
- **AND** MUST 寫入單一目的地（destinationLineId 或 destinationVendorId）clone from `transferConfig`
- **AND** MUST 同時建立一筆 Line，其 `transferTicketId` 指向該新建 Header

#### Scenario: 一報工建一 Header（含一筆 Line）

- **WHEN** 師傅報工 P1-印刷 100 張，P1-印刷 有單一下游依賴邊（P1-裁切）
- **THEN** 系統 SHALL 建立一張 TransferTicket 含一筆 Line（quantity = 100，destinationProductionTaskId = P1-裁切）

#### Scenario: 一報工 PT 多下游依賴邊建多張 Header

- **WHEN** 上游 PT A 同時被下游 PT B 與 PT C 引用為依賴上游，師傅為 A 報工 100 張
- **THEN** 系統 SHALL 建立兩張獨立 Header（各含一筆 Line：B 與 C 分別為目的）

#### Scenario: 一印件多張轉交單

- **WHEN** 印件 X 整天有多次報工
- **THEN** 系統 SHALL 為每次報工事件各自建立獨立 Header
- **AND** 每張 Ticket 各自獨立狀態與生命週期

---

### Requirement: TransferTicket 建立流程

系統 SHALL 於報工事件**直接自動建立 TransferTicket Header**（含一筆 Line），無印務介入。

**自動建立規則**：
- 任一師傅 / 供應商 / 生管完成報工，且該生產任務 `transferRequired = true` 且為非終端工序（被其他 PT 的 dependsOn 引用為上游）
- 系統 MUST 自動建立一張 `TransferTicket` Header，狀態 = **運送中**
- Header 欄位由 `transferConfig` 帶入：targetType、destinationLineId / destinationVendorId、deliveryMethod、carrierName、handlerName
- 系統 MUST 同時建立**一筆**所屬 `TransferTicketLine`：
  - 來源報工 = 該 WorkRecord
  - 來源生產任務 = 該被報工 PT
  - 目的生產任務 = 依賴邊指向的下游 PT
  - 數量 = 報工數量
  - 所屬 transferTicketId = 該新建 Header
- 一張 Header 對應**唯一一筆** Line（現階段 1:1）；Line 子實體保留為未來擴展預留

**多依賴邊情境**：若該被報工 PT 同時被多個下游 PT 引用（極少見，實務上一個工序通常只供應一個下游），系統 MUST 為每個下游各自建立一張獨立 Header（每張 Header 含一筆 Line 指向該下游）。

**終端工序不產生 Header**：
- 若該 PT 為**終端工序**（不被任何其他 PT 的 `dependsOn` 引用為上游），系統 MUST NOT 建立 TransferTicket
- 印件成品累計量計算改由 `ProductionTask.affects_product` 既有機制承擔（見本 spec § 印件成品累計量與終端工序的關係）

**transferRequired=false 不產生 Header**：
- 若該 PT `transferRequired = false`，報工後系統 MUST NOT 建立 TransferTicket
- 該 PT 的下游若仍依賴它，因無 Line 送達該下游永遠無法解鎖（印務應在排工時避免此情境）

**不允許人工介入的部分**：
- 印務 MUST NOT 修改 Line 的 `quantity`（嚴格 = 報工數量）
- 印務 MUST NOT 修改 Line 的 `來源報工` / `來源生產任務` / `目的生產任務`
- 印務 MUST NOT 修改 Header 的 `targetType` / `destinationLineId` / `destinationVendorId`（建立時 clone from transferConfig，已建後唯讀）
- 印務可修改 Header 層的 `deliveryMethod` / `carrierName` / `handlerName` / `expectedDate` / `slackMessageUrl` / `notes`（協助補正運送細節）

**取消的設計**（先前版本中曾存在但本次推翻）：
- 「待交接池」概念取消（報工立即建 Header）
- 「印務封單」動作取消
- 「待交接中心」UI 取消
- 「18:00 自動兜底封單」取消
- 「待印務確認」狀態取消（Header 建立直接是「運送中」）

#### Scenario: 報工自動建立 Header（含一筆 Line）

- **WHEN** 師傅為 `transferRequired=true` 的 P1-印刷 報工 100 張，P1-印刷 有依賴邊「下游 P1-裁切」
- **THEN** 系統 MUST 自動建立一張 TransferTicket Header（狀態 = 運送中），clone from transferConfig
- **AND** 系統 MUST 同時建立一筆 Line：來源報工 = 該 WorkRecord、來源 PT = P1-印刷、目的 PT = P1-裁切、數量 = 100、所屬 transferTicketId = 該新 Header

#### Scenario: 多次報工建立多張獨立 Header

- **WHEN** 師傅 09:30 報工 100、10:15 再報工 100
- **THEN** 系統 SHALL 建立兩張獨立 Header（T-001 含一筆 Line qty=100、T-002 含一筆 Line qty=100），各自獨立流轉

#### Scenario: 終端工序不產生 Header

- **WHEN** 裝訂任務（不被任何其他 PT 的 dependsOn 引用為上游）報工 30 本
- **THEN** 系統 MUST 記錄 ProductionTaskWorkRecord（pt_produced_qty 累加）
- **AND** 系統 MUST NOT 建立任何 TransferTicket / TransferTicketLine
- **AND** 印件成品累計量由 `affects_product` 機制計算

#### Scenario: transferRequired=false 不建 Header

- **WHEN** 師傅為 `transferRequired=false` 的生產任務報工
- **THEN** 系統 MUST NOT 建立任何 TransferTicket / TransferTicketLine

#### Scenario: 報工數量嚴格 = Line 數量

- **WHEN** 師傅報工 200 張
- **THEN** 自動建立的 Line 數量 MUST = 200
- **AND** 印務 UI MUST NOT 暴露 Line 的 `quantity` 編輯欄位

#### Scenario: 印件詳情頁「轉交單」Tab 無新增按鈕

- **WHEN** 使用者開啟印件詳情頁「轉交單」Tab
- **THEN** UI MUST NOT 顯示「新增轉交單」按鈕
- **AND** UI MUST 顯示說明「轉交單由報工事件自動建立。廠務送達後由印務在此頁面標記已送達。」

---

### Requirement: 印件詳情頁「轉交單」Tab

印件詳情頁 SHALL 於 Tabs 內保留「轉交單」Tab，位置介於「QC 紀錄」與「出貨單」之間。

Tab 標題 MUST 顯示該印件的 TransferTicket 數量計數：`轉交單（N）`。

Tab 內容 MUST 包含：
- 摘要文字（運送中 / 已送達 / 已作廢 各數量）
- **不顯示「新增轉交單」按鈕**（v0.3 此按鈕在新模型移除；改提示「轉交單由系統依報工自動產生 Line，印務於『待交接中心』封單建立」）
- TransferTicket Header 卡片列表（依 createdAt 遞減排序）

每張 Header 卡片 MUST 顯示：
- 編號（ticketNo）+ 狀態 Badge + 含 Line 計數
- 目的地（targetType + destination name）
- 運送方式 + 貨運行名稱（若有）
- 廠內執行者（若有）
- 預計 / 實際轉交日
- **展開顯示 Line 明細**：每筆 Line 顯示「來源 PT 名 → 目的 PT 名 + 數量」
- 備註 / 作廢原因（若有）
- 操作按鈕（依狀態：確認送達 / 作廢 / 編輯 Slack 連結 / 補填運送細節）

#### Scenario: Tab 位置

- **WHEN** 使用者開啟印件詳情頁
- **THEN** Tabs 順序 SHALL 為：審稿紀錄 → 工單 → QC 紀錄 → **轉交單** → 出貨單 → 活動紀錄

#### Scenario: Tab 移除新增按鈕

- **WHEN** 使用者開啟「轉交單」Tab
- **THEN** Tab 內容 MUST NOT 顯示「新增轉交單」按鈕
- **AND** Tab 內容 MUST 顯示提示文字「轉交單由報工事件自動產生 Line，印務於『待交接中心』封單建立。」

#### Scenario: Header 展開顯示 Line

- **WHEN** 使用者點擊 Header 卡片展開
- **THEN** 系統 SHALL 顯示其包含的所有 Line：每筆顯示「來源生產任務名稱 → 目的生產任務名稱 + 數量」
- **AND** 點擊任一 Line 可跳轉至來源報工紀錄詳情

#### Scenario: 「標記已送達」操作

- **WHEN** 印務於「轉交單」Tab 對「運送中」狀態的 Header 點「標記已送達」
- **THEN** 系統 MUST 開啟對話框，要求印務上傳簽收照片（必填）
- **AND** 確認後 Header 狀態 SHALL 變為「已送達」（詳見本 spec § 印務確認送達流程）

---

### Requirement: TransferTicket Data Model

系統 SHALL 實作 TransferTicket（Header）實體的資料模型如下：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 編號 | ticketNo | 字串 | Y | Y | 格式 TT-YYYYMMDD-NNN，系統自動產生 |
| 印件 | printItemId | FK | Y | Y | FK → PrintItem；單一關聯不跨印件 |
| 印件名稱 | printItemName | 字串 | Y | Y | 快照（顯示用） |
| 狀態 | status | 單選 | Y | | 運送中 / 已送達 / 已作廢；建立即「運送中」（系統報工事件觸發） |
| 對象類型 | targetType | 單選 | Y | | 內部產線 / 外部廠商 |
| 目的產線 | destinationLineId | FK | 條件必填 | | targetType = 內部產線時必填 |
| 目的廠商 | destinationVendorId | FK | 條件必填 | | targetType = 外部廠商時必填 |
| 運送方式 | deliveryMethod | 單選 | | | 廠內自送 / 貨運行 / 供應商自取 / 其他 |
| 貨運行名稱 | carrierName | 字串 | 條件必填 | | deliveryMethod = 貨運行時必填 |
| 廠內執行者 | handlerName | 字串 | | | 廠務姓名純文字 |
| 備註 | notes | 文字 | | | |
| 預計轉交日 | expectedDate | 日期 | | | |
| 實際轉交日 | actualDate | 日期 | 系統自動 | Y | 確認送達時寫入 |
| 確認操作人 | confirmedBy | FK | 系統自動 | Y | FK → User |
| 簽收照片 | signaturePhotos | 檔案陣列 | 條件必填 | | 「標記已送達」操作時必填（至少 1 張）；Prototype 階段以圖片 URL placeholder 模擬上傳 |
| Slack 通知連結 | slackMessageUrl | URL 字串 | | | Prototype 為純 URL 欄位（無 Webhook） |
| 作廢時間 | cancelledAt | 日期時間 | | | |
| 作廢操作人 | cancelledBy | FK | | | |
| 作廢原因 | cancelledReason | 文字 | | | |
| 建立時間 | createdAt | 日期時間 | Y | Y | |
| 更新時間 | updatedAt | 日期時間 | Y | Y | |

**重要說明**：Header 不直接持有 `productionTaskId` 或 `quantity` 欄位。這些資訊由其包含的 `TransferTicketLine` 子實體承載。

#### Scenario: 封單時寫入必填欄位

- **WHEN** 印務於「待交接中心」執行封單
- **THEN** id / ticketNo / printItemId / status / targetType / createdAt / updatedAt MUST 全部寫入
- **AND** 內部產線：destinationLineId MUST 寫入；外部廠商：destinationVendorId MUST 寫入

#### Scenario: 確認送達時系統自動欄位寫入

- **WHEN** 印務點擊「確認送達」
- **THEN** actualDate MUST 寫入當日、confirmedBy MUST 寫入當前登入印務 ID
- **AND** 系統 MUST 觸發下游 ProductionTask 的佇列量重算（依 § 佇列量計算與消耗扣帳）

#### Scenario: 作廢時系統自動欄位寫入

- **WHEN** 印務點擊「作廢」並填妥原因
- **THEN** cancelledAt / cancelledBy / cancelledReason MUST 寫入
- **AND** 系統 MUST 觸發下游 ProductionTask 的佇列量重算

---

### Requirement: TransferTicketLine Data Model

系統 SHALL 實作 TransferTicketLine 子實體的資料模型如下：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 所屬 Header | transferTicketId | FK | Y | Y | FK → TransferTicket；報工事件建立 Line 時即關聯 Header |
| 來源報工 | sourceWorkRecordId | FK | Y | Y | FK → ProductionTaskWorkRecord |
| 來源生產任務 | sourceProductionTaskId | FK | Y | Y | FK → ProductionTask；快照型 FK |
| 來源生產任務名稱 | sourceProductionTaskName | 字串 | Y | Y | 快照（顯示用） |
| 目的生產任務 | destinationProductionTaskId | FK | Y | Y | FK → ProductionTask；**必填**（終端工序不產生 Line，故無 NULL 情境）|
| 目的生產任務名稱 | destinationProductionTaskName | 字串 | Y | Y | 快照（顯示用） |
| 印件 | printItemId | FK | Y | Y | 冗餘欄位，由來源 PT 推導，加速查詢 |
| 數量 | quantity | 整數 | Y | Y | 嚴格等於來源 WorkRecord.reportedQuantity，不可改 |
| 狀態 | status | 單選 | Y | | 已封單（透過 transferTicketId 推導；建立時即關聯 Header）|
| 建立時間 | createdAt | 日期時間 | Y | Y | |

**狀態推導**：
- 建立時即關聯 Header，沒有「待封單」狀態（先前版本的「待交接池」概念已取消）
- 實際運送狀態繼承 Header.status（運送中 / 已送達 / 已作廢）

#### Scenario: 報工時 Line 與 Header 同步建立

- **WHEN** 系統因報工事件建立 TransferTicket
- **THEN** id / transferTicketId / sourceWorkRecordId / sourceProductionTaskId / destinationProductionTaskId / quantity / printItemId / createdAt MUST 全部寫入
- **AND** transferTicketId MUST 指向同步建立的 Header（非 null）

#### Scenario: 終端工序不產生 Line

- **WHEN** 裝訂任務（不被任何其他 PT 引用為上游）報工
- **THEN** 系統 MUST NOT 產生任何 Line
- **AND** 印件成品累計量由 affects_product 既有規則處理

---

### Requirement: 生產任務狀態機

系統 SHALL 依照 [狀態機 spec](../state-machines/spec.md) § 生產任務定義的規則進行狀態轉換。自有工廠路徑：待處理 → 製作中 → 已完成。生管指派師傅為欄位更新（assigned_operator），不觸發狀態變更。

**依賴邊就緒前置條件**（取代先前的 prerequisiteMet 設計）：
- 系統 SHALL 在派工 / 報工時即時計算「所有依賴邊的佇列量」
- 派工條件：`status=待處理 AND 所有依賴邊的佇列量 ≥ 1`
- 首次報工條件：派工後 + 至少一條依賴邊佇列 ≥ 1

**佇列量計算 / 消耗扣帳邏輯詳見**：本 spec § 佇列量計算與消耗扣帳。

#### Scenario: 自有工廠路徑

- **WHEN** 生產任務由自有工廠執行，所有依賴邊佇列 ≥ 1
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 已完成
- **AND** 「製作中」由首次報工觸發

#### Scenario: 外包廠路徑

- **WHEN** 生產任務由外包廠執行，所有依賴邊佇列 ≥ 1
- **THEN** 狀態路徑維持不變：待處理 → 製作中 → 運送中 → 已完成

#### Scenario: 中國廠商路徑

- **WHEN** 生產任務由中國廠商執行，所有依賴邊佇列 ≥ 1
- **THEN** 狀態路徑：待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

#### Scenario: 任一依賴邊佇列為零阻擋首次報工

- **WHEN** 「待處理」狀態的生產任務，其某條依賴邊佇列量 = 0
- **THEN** 系統 MUST 拒絕首次報工，提示「依賴邊 [上游名稱] 無可用料」
- **AND** 狀態 MUST NOT 變為「製作中」

#### Scenario: 製作中報工依賴邊佇列扣帳

- **WHEN** 「製作中」狀態的生產任務由師傅報工 N 個
- **THEN** 系統 MUST 依各依賴邊的消耗比例扣減該邊佇列
- **AND** 若任一邊扣後為負數：報工仍允許（已開工事實），但 UI 顯示警示「實際生產量超過已送達量，請補送料」

#### Scenario: 生產任務作廢（未進入生產）

- **WHEN** 生管在生產任務尚未進入「製作中」時取消
- **AND** 該 PT MUST NOT 被其他 PT 的依賴邊引用為上游
- **THEN** 狀態轉為「已作廢」（無成本）

#### Scenario: 生產任務報廢（已進入生產）

- **WHEN** 已進入「製作中」的生產任務被取消
- **THEN** 狀態轉為「報廢」，費用以報工數計算

---

### Requirement: 師傅自助報工

系統 SHALL 支援師傅透過任務平台直接回報完成數量。報工時若 `transferRequired=true` 且該 PT 為非終端工序，系統 MUST 為每條下游依賴邊**直接建立一張 TransferTicket Header 含一筆 Line**（狀態 = 運送中）；同時依各依賴邊消耗比例扣減上游邊的佇列量。

#### Scenario: 師傅首次報工觸發製作中

- **WHEN** 師傅在任務平台為「待處理 + 所有依賴邊佇列 ≥ 1」的生產任務提交首次報工 100 張，且該 PT `transferRequired=true`
- **THEN** 系統 SHALL 記錄 ProductionTaskWorkRecord
- **AND** 生產任務狀態 SHALL 從「待處理」變為「製作中」
- **AND** 系統 SHALL 為該 PT 的每條下游依賴邊**直接建立一張 Header（運送中）+ 一筆 Line**
- **AND** 系統 SHALL 依各依賴邊消耗比例扣減上游邊佇列

#### Scenario: 師傅後續報工累加

- **WHEN** 師傅為「製作中」狀態的生產任務提交後續報工
- **THEN** 系統 SHALL 累加報工數量至 pt_produced_qty
- **AND** 系統 SHALL 為每條下游依賴邊**再建立新的獨立 Header + Line**
- **AND** 系統 SHALL 同步扣減上游邊佇列
- **AND** 報工數量加總 MUST NOT 超過 pt_target_qty

#### Scenario: 師傅報工但不需轉交

- **WHEN** 師傅為 `transferRequired=false` 的生產任務提交報工
- **THEN** 系統 SHALL 記錄 WorkRecord 但 MUST NOT 產生 Line

#### Scenario: 師傅僅可查看自身任務

- **WHEN** 師傅登入任務平台
- **THEN** 系統 SHALL 僅顯示 assigned_operator 為該師傅的生產任務
- **AND** 任務詳情頁 MUST 顯示各依賴邊的目前佇列量供師傅判斷

---

### Requirement: 供應商自助報工

系統 SHALL 支援外包廠商與中國廠商透過供應商平台直接回報生產進度。報工時若 `transferRequired=true`，行為與師傅自助報工一致。

#### Scenario: 供應商回報完成數量

- **WHEN** 供應商為「製作中」狀態的生產任務提交報工 500 張，該 PT `transferRequired=true`
- **THEN** 系統 SHALL 記錄 WorkRecord
- **AND** 系統 SHALL 為每條下游依賴邊**直接建立一張 Header（運送中）+ 一筆 Line**
- **AND** reported_by SHALL 記錄為該供應商操作員

#### Scenario: 供應商標記製作完成

- **WHEN** 供應商在供應商平台將生產任務標記為「製作完畢」
- **THEN** 外包廠路徑：生產任務狀態 SHALL 從「製作中」變為「運送中」
- **AND** 中國廠商路徑：生產任務狀態 SHALL 從「製作中」變為「已送集運商」

---

### Requirement: 生管代替報工

系統 SHALL 支援生管代替無法自助報工的師傅或供應商記錄報工。代報工流程與師傅自助報工一致，產生 Line + 扣帳邏輯相同。

#### Scenario: 生管代報工

- **WHEN** 生管為 `transferRequired=true` 的生產任務代提交報工 100
- **THEN** 系統 SHALL 記錄 WorkRecord（reported_by = 實際代報對象，代報者另記）
- **AND** 系統 SHALL 為每條下游依賴邊**直接建立一張 Header（運送中）+ 一筆 Line**

---

### Requirement: 生管接收與分派

系統 SHALL 讓生管查看已交付任務清單，並透過日程面板的「建立工作包」操作完成派工。原有的批次派工操作由建立工作包取代。

**派工前置條件（依賴邊就緒）**：生管建立工作包時，被勾選的所有生產任務 MUST 滿足 `status=待處理 AND 所有依賴邊佇列量 ≥ 1`。若任一任務有依賴邊佇列 = 0，派工按鈕 MUST 禁用並提示原因。

**派工板顯示**：每個任務列下方 MUST 以表格顯示各依賴邊的「上游 PT 名 + 目前佇列量」三欄迷你表格，協助生管判斷下游何時可派。

生管 SHALL 在日程面板上依分組查看所有待處理生產任務，勾選任務後建立工作包（含指派師傅、備註、確樣需求）。建立工作包後，任務狀態維持「待處理」不變。

所有已派工的生產任務 MUST 歸屬於某工作包（work_package_id NOT NULL）。不存在「有 assigned_operator 但無 work_package_id」的生產任務。

已派工的生產任務在生產任務列表中以工作包為單位呈現（ErpExpandableRow 兩層展開），不再以單筆平鋪顯示。

#### Scenario: 生管透過工作包完成派工

- **WHEN** 生管在日程面板勾選 3 筆「待處理 + 所有依賴邊佇列 ≥ 1」任務並建立工作包
- **THEN** 3 筆任務歸入工作包，assigned_operator 設為選定師傅，狀態維持「待處理」

#### Scenario: 依賴邊佇列為零無法派工

- **WHEN** 生管嘗試將某依賴邊佇列 = 0 的任務勾選建立工作包
- **THEN** 系統 MUST 阻擋，提示「依賴邊 [上游名稱] 無可用料，無法派工」
- **AND** 日程面板上該任務的勾選框 MUST 禁用

#### Scenario: 派工板顯示佇列量

- **WHEN** 生管查看派工板上某個有依賴邊的待處理任務
- **THEN** 任務列下方 MUST 以三欄迷你表格顯示：上游 PT 名 / 目前佇列量 / 消耗比例
- **AND** 佇列量 = 0 的列 MUST 以紅色強調

#### Scenario: 派工後欄位一致性

- **WHEN** 生管透過建立工作包完成派工
- **THEN** 該生產任務的 work_package_id、assigned_operator MUST 同時有值

#### Scenario: 移出工作包後欄位清除

- **WHEN** 生產任務從工作包移出
- **THEN** work_package_id、assigned_operator、actual_start_date MUST 全部清除為 null

---

### Requirement: 工序相依性管理

系統 SHALL 於 `ProductionTask` 新增 `dependsOn` 物件陣列欄位，表達生產任務之間的前置依賴關係。每元素含「上游生產任務 + 消耗比例（單位用量倍率）」。印務 SHALL 於排工時手動標註，生管不介入。系統提供「依 BOM 自動建議」減輕印務輸入負擔。

**依賴邊資料結構**（每元素）：
- `upstreamProductionTaskId` (FK)：依賴的上游生產任務
- `consumptionRatio` (數字，> 0)：**下游每生產 1 單位需消耗該上游多少單位**（單位用量倍率，**非百分比**；例：裝訂 1 本要 5 張內頁，倍率 = 5）

**依賴建立規則**：
- `dependsOn` 引用的上游 PT MUST 與下游 PT 屬同一 `printItemId`
- 上游 PT MUST `transferRequired = true`（無轉交設定無法產生 Line 解鎖下游）
- 新增 / 編輯時系統 MUST 以 DFS 檢查依賴傳遞閉包，拒絕造成環形依賴的寫入
- `consumptionRatio` 必填且 > 0

**自動建議機制（降低印務輸入負擔）**：
- 新建 `ProductionTask` 時，系統 SHALL 依該印件 BOM 的 `process_master.sort_order` 自動建議 `dependsOn`：
  - 取同印件內 `sort_order = 自身 sort_order − 1` 且 `transferRequired = true` 的 PT 作為上游
  - 自動帶入 consumptionRatio 預設值（依工序類型推論：裁切 = 1、模切 = 1、裝訂 / 折頁依本書 BOM 內頁張數推論）
- 印務可調整或刪除自動建議
- 系統不強制 `dependsOn` 與 BOM `sort_order` 持續同步；自動建議僅在 PT 建立瞬間發生

#### Scenario: 印務排工時設依賴邊

- **WHEN** 印務於印件 X 的「BOOK-裝訂」任務編輯頁新增依賴邊：上游 = P1-裁切、消耗比例 = 1
- **AND** 再新增依賴邊：上游 = P2-折頁、消耗比例 = 5
- **THEN** 系統 SHALL 寫入 `BOOK-裝訂.dependsOn = [{upstreamProductionTaskId:P1-裁切, consumptionRatio:1}, {upstreamProductionTaskId:P2-折頁, consumptionRatio:5}]`

#### Scenario: 新建 PT 時依 BOM 自動建議依賴邊

- **WHEN** 印務新建一個生產任務（依 BOM `process_master.sort_order` = 3，例：BOOK-裝訂），同印件已有 sort_order = 2 的「P2-折頁」（transferRequired=true）
- **THEN** 系統 SHALL 自動帶入 `dependsOn = [{ upstreamProductionTaskId: P2-折頁, consumptionRatio: 推論預設值 }]`
- **AND** 印務可在編輯頁調整或刪除

#### Scenario: 跨印件依賴阻擋

- **WHEN** 印務嘗試為印件 X 的任務 B 設定依賴為印件 Y 的任務 C
- **THEN** 系統 MUST 阻擋並提示「依賴僅支援同印件內任務」

#### Scenario: 引用 transferRequired=false 任務阻擋

- **WHEN** 印務嘗試將 B 設定依賴於 `transferRequired=false` 的任務 A
- **THEN** 系統 MUST 阻擋並提示「目標任務不需轉交，無法作為依賴節點」

#### Scenario: 環形依賴阻擋

- **WHEN** 已有 A.dependsOn=[]、B.dependsOn=[A]，印務嘗試設定 A.dependsOn=[B]
- **THEN** 系統 MUST 以 DFS 檢測到 B 的傳遞閉包含 A，拒絕寫入
- **AND** 系統 MUST 提示「不可形成依賴環（A ↔ B）」

#### Scenario: 多層環形阻擋

- **WHEN** 已有 A.dependsOn=[]、B.dependsOn=[A]、C.dependsOn=[B]，印務嘗試設定 A.dependsOn=[C]
- **THEN** 系統 MUST 拒絕（傳遞閉包：C → B → A 包含 A）

#### Scenario: 消耗比例必填

- **WHEN** 印務新增依賴邊但未填消耗比例
- **THEN** 系統 MUST 阻擋，提示「消耗比例必填」

#### Scenario: 清空 dependsOn

- **WHEN** 印務移除任務的所有 dependsOn
- **THEN** 該任務無依賴邊約束，派工條件僅看 `status=待處理`

## ADDED Requirements

### Requirement: ProductionTask 轉交設定欄位

系統 SHALL 於 `ProductionTask` 新增 `transferRequired`（布林）與 `transferConfig`（物件）兩個欄位，用於排工時預先定義轉交需求。報工時系統依此自動建立 TransferTicket Header（含一筆 Line）。

`transferConfig` 結構：
- `targetType`（單選）：內部產線 / 外部廠商
- `destinationLineId`（FK，條件必填，targetType=內部產線時）
- `destinationVendorId`（FK，條件必填，targetType=外部廠商時）
- `deliveryMethod`（單選）：廠內自送 / 貨運行 / 供應商自取 / 其他
- `carrierName`（字串，條件必填，deliveryMethod=貨運行時）
- `handlerName`（字串，選填）

**注意**：`transferConfig` 在新模型下作為**封單時的預設值**而非綁定欄位。印務於封單對話框可覆寫。系統不強制 `transferConfig` 與最終 Header 內容完全一致。

**編輯時機**：印務排工階段（ProductionTask 編輯頁）可自由編輯；狀態轉為「待處理」時驗證 `transferRequired=true` 必填欄位。

**中途變更不回朔**：印務變更已存在 `transferConfig`，MUST NOT 影響已建立的 TransferTicket Header；僅影響後續報工新產生的 Line（封單時的預設值）。

#### Scenario: 排工時填入 transferConfig

- **WHEN** 印務於生產任務編輯頁勾選 `transferRequired=true` 並填入 targetType=外部廠商、destinationVendorId=V-001、deliveryMethod=貨運行、carrierName=新竹貨運
- **THEN** 系統 SHALL 將 transferConfig 寫入 ProductionTask

#### Scenario: 狀態轉為待處理時驗證必填

- **WHEN** ProductionTask 從草稿轉為「待處理」、`transferRequired=true` 但 `transferConfig` 必填欄位缺失
- **THEN** 系統 MUST 阻擋狀態轉換，提示需補填

#### Scenario: 中途變更 transferConfig 不影響已建 Header

- **WHEN** ProductionTask A 已有報工建立的 Line 進入 Header T1（carrierName=A 貨運），印務改 transferConfig.carrierName=B 貨運
- **THEN** T1 的 carrierName MUST 保持「A 貨運」
- **AND** 之後 A 再次報工新產生的 Line，封單時 carrierName 預設帶入「B 貨運」

---

### Requirement: 佇列量計算與消耗扣帳

系統 SHALL 即時計算每個生產任務的每條依賴邊的「目前佇列量」，作為派工 / 報工的判定基礎。

**計算公式**：
```
某下游 D 的某依賴邊 E（指向上游 U、消耗比例 R）的佇列量 = 

  Σ Line.quantity
    where Line.sourceProductionTaskId = U
      AND Line.destinationProductionTaskId = D
      AND Line.transferTicketId IS NOT NULL
      AND Line 所屬 Header.status = 已送達

  −

  D 的 pt_produced_qty × R
```

**重要說明**：
- 已作廢 Header 的 Line 不計入累計送達（`Header.status = 已作廢` 排除）
- 運送中 Header 的 Line 不計入累計送達（尚未到達）

**消耗扣帳時機**：每次下游報工時，系統依各依賴邊的消耗比例自動扣減「概念上的」佇列。實際上佇列為計算衍生值，不存欄位；扣帳邏輯內含於計算公式中（`pt_produced_qty` 即時反映）。

**即時計算的 trigger**：
- 派工板渲染（顯示佇列量）
- 報工提交（檢查是否阻擋首次報工）
- TransferTicket 狀態變更（送達 / 作廢）後 UI 重新查詢

#### Scenario: 多依賴邊各自獨立計算

- **WHEN** BOOK-裝訂 計畫 100 本，依賴 P1-裁切（比例 1）+ P2-折頁（比例 5），已送達 P1-裁切 100 張、P2-折頁 250 張，已報工 30 本
- **THEN** P1-裁切邊佇列 = 100 − (30×1) = 70
- **AND** P2-折頁邊佇列 = 250 − (30×5) = 100

#### Scenario: 作廢 Ticket 不計入

- **WHEN** P1-裁切 → 裝訂 共有 Header T1（已送達 60）+ T2（已送達 40），其中 T2 被作廢
- **THEN** P1-裁切邊累計送達 = 60（T2 排除）
- **AND** 若已報工 50 本（消耗 50）：佇列 = 60 − 50 = 10

#### Scenario: 運送中 Header 的 Line 不計入

- **WHEN** P1-裁切 → 裝訂 100 張的 Line 所屬 Header 狀態 = 「運送中」（尚未確認送達）
- **THEN** P1-裁切邊累計送達 = 0（運送中不算到達）

#### Scenario: 佇列負數允許但警示

- **WHEN** 已送達 100，已消耗 120（如師傅錯估或補送 Header 被作廢）
- **THEN** 佇列 = -20
- **AND** UI MUST 顯示警示「實際生產量超過已送達量 20 單位，請補送料」
- **AND** 系統 MUST NOT 阻擋當下任務繼續操作（已開工事實尊重）

#### Scenario: 派工時佇列即時計算

- **WHEN** 生管打開派工板
- **THEN** 系統 SHALL 即時計算所有「待處理」任務各依賴邊的佇列量並顯示

---

### Requirement: 印務確認送達流程

系統 SHALL 支援印務在「轉交單」Tab 對「運送中」狀態的 TransferTicket Header 執行「標記已送達」操作。執行此動作時 `signaturePhotos` 必填（至少 1 張）。

**業務協作流程**（Miles 確認）：
1. 報工後系統自動建立 TransferTicket（狀態 = 運送中）
2. 廠務依 TransferTicket 進行實體運送（線下動作）
3. 廠務送達後通知印務（線下溝通：Slack / 電話 / LINE）
4. 印務於系統內對該 TransferTicket 點「標記已送達」，**必填上傳簽收照片**作為 log
5. 系統將 Header 狀態變更為「已送達」、自動寫入 `actualDate = 當日`、`confirmedBy = 當前登入印務`
6. 系統觸發下游 ProductionTask 的佇列量重算（依 § 佇列量計算與消耗扣帳）
7. 若印務未收到廠務通知 → 主動聯繫廠務確認狀況（線下，系統不介入）

**簽收照片必填理由**：
- 作為「印務確認沒問題」的物理證據
- 對外（客訴 / 退貨）可追溯
- 若無圖片 placeholder Prototype 階段可用 image URL 模擬

**自動寫入欄位**（系統處理，印務不可改）：
- `actualDate`：當日日期
- `confirmedBy`：當前登入印務 ID

**選填欄位**（印務可順手補）：
- `notes`：確認備註
- `handlerName`：是哪位廠務送的（若有需要記錄）

#### Scenario: 印務標記已送達必填簽收照片

- **WHEN** 印務於印件詳情頁「轉交單」Tab 對「運送中」Header 點「標記已送達」
- **THEN** 系統 MUST 開啟對話框，要求印務上傳至少 1 張簽收照片
- **WHEN** 印務未上傳照片即點確認
- **THEN** 系統 MUST 阻擋並提示「需上傳簽收照片才能標記已送達」

#### Scenario: 上傳照片後標記已送達

- **WHEN** 印務上傳 1 張簽收照片並點確認
- **THEN** Header 狀態 SHALL 從「運送中」變為「已送達」
- **AND** signaturePhotos MUST 寫入該照片
- **AND** actualDate MUST 寫入當日、confirmedBy MUST 寫入當前登入印務
- **AND** 系統 MUST 觸發下游 ProductionTask 的佇列量重算

#### Scenario: 已送達後簽收照片唯讀

- **WHEN** Header 狀態為「已送達」
- **THEN** UI MUST NOT 提供修改 signaturePhotos 的操作
- **AND** 簽收照片 MUST 可被點擊放大檢視

#### Scenario: 已作廢狀態無法標記已送達

- **WHEN** 任何使用者嘗試對「已作廢」Header 點「標記已送達」
- **THEN** 系統 MUST 阻擋

---

### Requirement: 印件成品累計量與終端工序的關係

系統 SHALL 維持 `ProductionTask.affects_product`（既有欄位）為「決定印件成品累計量」的唯一機制。本 change 引入的 TransferTicketLine 模型 MUST NOT 影響或重複定義印件成品累計量計算。

**規則**：
- 終端工序（不被任何其他 PT 的 dependsOn 引用為上游）報工 MUST NOT 產生 TransferTicketLine
- 印件成品累計量 = MIN(該印件下所有 `affects_product = true` 的 PT 的 `pt_produced_qty`)
- 實務上印務通常只在最末工序（裝訂、包裝等）勾 `affects_product = true`，其他工序設 false → MIN 退化為單一終端工序的 produced_qty
- 多個獨立終端工序（套書多冊 / 印件含多種成品）情境，MIN 自動取得齊套後的本數
- `affects_product` 既有規則由 [生產任務 spec § Data Model](../../../specs/production-task/spec.md) 主檔定義，本 change 不修改

**為什麼終端不產 Line**：
- 業界做法：成品入庫為獨立 transaction（SAP Goods Receipt / Oracle Move Completion），不混入 transfer 模型
- 概念純化：TransferTicket 專責 PT → PT 物料交接，不擴張為 PT → 成品倉
- 實作簡化：TransferTicketLine.destinationProductionTaskId 永遠必填，無 NULL 入庫特例

#### Scenario: 終端工序報工不產生 Line

- **WHEN** 裝訂任務（不被任何 PT 的 dependsOn 引用為上游）報工 30 本完成
- **THEN** 系統 MUST 記錄 ProductionTaskWorkRecord、累加 pt_produced_qty
- **AND** 系統 MUST NOT 產生任何 TransferTicketLine
- **AND** 印件成品累計量更新交由 affects_product 既有規則處理

#### Scenario: 印件成品由多個 affects_product=true PT 取齊套

- **WHEN** 印件 X 下有兩個終端工序：BOOK-裝訂（已報工 30、affects_product=true）、BOOK-加工（已報工 25、affects_product=true）
- **THEN** 印件 X 的成品累計量 = MIN(30, 25) = 25
- **AND** 系統 MUST 以 affects_product=true 的所有 PT 為齊套基準

#### Scenario: 單一終端工序時 MIN 退化為單值

- **WHEN** 印件 Y 下只有 BOOK-裝訂 一個 PT 設 affects_product=true，其他工序皆 false，BOOK-裝訂 已報工 50
- **THEN** 印件 Y 成品累計量 = MIN(50) = 50

---

### Requirement: 上游 ProductionTask 作廢阻擋

若 ProductionTask A 被任一其他 ProductionTask 的依賴邊引用為上游，系統 MUST 阻擋 A 的作廢 / 刪除操作。

**處理流程**：
- 系統檢查依賴邊的反向引用
- 若存在引用，阻擋並提示「任務 [B 編號] 依賴此任務，請先修改其依賴設定」
- 印務手動修改下游 B 的 dependsOn 移除 A 後，方可作廢 A

#### Scenario: 被引用時阻擋作廢

- **WHEN** B.dependsOn 含 A，印務嘗試作廢 A
- **THEN** 系統 MUST 阻擋，提示 B 依賴此任務
- **AND** A 的狀態 MUST NOT 變動

#### Scenario: 無引用時正常作廢

- **WHEN** A 不被任何 PT 的 dependsOn 引用，印務作廢 A
- **THEN** 系統 SHALL 正常執行作廢流程

## REMOVED Requirements

### Requirement: Line-level 可申請上限

**Reason**：v0.3 的 Line-level 上限公式（`line.quantity ≤ pt_produced_qty − Σ 其他未作廢 Ticket 占用`）建立在「印務手動建單可任意分配 Line.quantity」的前提。新模型下 Line.quantity = 觸發報工的 reported_quantity，系統自動寫入不可改，邏輯上不會超過已報工量。原公式失去必要性。

**Migration**：
- 移除 store 中 `computeLineQuantityLimit` 函式
- 移除建單表單的「可申請上限」顯示
- 報工 → Line.quantity 直接綁定不需驗證
