## ADDED Requirements

### Requirement: 業務送出報價單給客戶

訂單於業務主管核准後 SHALL 進入「審核通過」狀態（**僅適用 `order_type = 線下`**；線上訂單與諮詢訂單路徑不進入此狀態）。業務 / 諮詢 SHALL 透過外部管道（line / email / 紙本）將報價單寄送給客戶後，於訂單詳情頁手動點擊「已送報價單」按鈕，系統 SHALL 將訂單狀態從「審核通過」推進至「報價待回簽」。

此設計目的為明確區分訂單三種前段階段：
- 「待業務主管審核」：等待主管內部核准
- 「審核通過」：主管已核可、業務未送報價單給客戶
- 「報價待回簽」：已送報價單、等待客戶回簽

業務於「審核通過」狀態 MUST NOT 直接進入「報價待回簽」未經此手動推進動作。系統 MUST 記錄送出時間與操作者於 ActivityLog。

#### Scenario: 業務點擊已送報價單推進狀態

- **GIVEN** 訂單狀態為「審核通過」
- **AND** 業務已透過外部管道將報價單寄送給客戶
- **WHEN** 業務於訂單詳情頁點擊「已送報價單」按鈕
- **THEN** 訂單狀態 SHALL 推進至「報價待回簽」
- **AND** 系統 MUST 記錄送出時間
- **AND** ActivityLog MUST 記載「業務送出報價單」與操作者

#### Scenario: 審核通過狀態下業務可追蹤待送清單

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務開啟訂單列表頁並篩選此狀態
- **THEN** 系統 SHALL 顯示所有「審完未送」訂單供業務追蹤

### Requirement: 審核通過狀態下訂單修改

訂單於「審核通過」狀態下，業務 / 諮詢 SHALL 可直接修改訂單內容（如印件規格細節、訂單須知 / 交貨備註等一般備註、配送資訊等），修改 MUST NOT 觸發回業務主管重新審核。業務主管核可後對訂單的進一步調整為業務自主範圍。此處「可直接修改」**不含成交條件鎖定欄位**（見下「鎖定欄位」）。

**鎖定欄位（進入審核通過起唯讀）**：`payment_terms_note`（收款條件備註）與 `approved_by_sales_manager_id`（審核業務主管）自進入「審核通過」起鎖定為唯讀（見「訂單業務主管審核欄位」Requirement），**MUST NOT** 於審核通過後被業務直接修改（避免核准後外發前竄改業務主管已審視的收款條件繞過把關）。`approved_by_sales_manager_id` 進入審核通過後即為「實際核可者」歷史紀錄、鎖定唯讀；Supervisor 的「重新指定業務主管」機制（見 § Supervisor 重新指定訂單業務主管）僅作用於**核可前的「待業務主管審核」階段**以解卡待審訂單，審核通過後不再重指派（重指派會竄改實際核可者紀錄）。

**核心欄位變更例外**：若需變更下列「核心欄位」（影響業務主管已核可的成交條件金額 / 結構 / 對象），業務 MUST 走訂單異動單流程（建立訂單異動單 + 業務主管審核 + 業務執行重算應收），不直接修改：
- 報價總額（含 OrderExtraCharge 加總）
- 付款條件結構（PaymentPlan 期次的金額 / 期數結構新增 / 刪除；單一期次的日期變更由「付款計畫變更分階段稽核」Requirement 處理）
- 客戶（廠客變更直接影響核可前的成交對象，需重審）

業務直接修改 MUST 於訂單 ActivityLog 記載「審核通過狀態下訂單修改：欄位 X 由 A 變更為 B」。

#### Scenario: 業務於審核通過狀態直接修改備註

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務修改「訂單須知」備註
- **THEN** 系統 SHALL 直接儲存修改
- **AND** 訂單狀態 MUST 維持「審核通過」
- **AND** ActivityLog MUST 記載修改

#### Scenario: 業務於審核通過狀態直接修改印件規格細節

- **GIVEN** 訂單狀態為「審核通過」
- **AND** 修改範圍為印件規格細節（不影響報價總額）
- **WHEN** 業務修改印件規格
- **THEN** 系統 SHALL 直接儲存修改
- **AND** 訂單狀態 MUST 維持「審核通過」
- **AND** ActivityLog MUST 記載修改

#### Scenario: 核心欄位變更需走訂單異動單

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務嘗試修改報價總額（如新增加印項目）
- **THEN** 系統 MUST 阻擋直接修改
- **AND** UI MUST 引導業務「建立訂單異動單」走主管審核流程

### Requirement: 訂單複製功能

業務 / 諮詢 SHALL 可於訂單列表頁對既有訂單執行「複製訂單」操作，系統 SHALL 建立新訂單並帶入下列資料：客戶、印件規格、價格、付款條件。新訂單 MUST 標記 `source_order_id` 指向原訂單以追蹤 reorder 關係。

新訂單 SHALL 進入正常訂單流程起點（草稿 → 待業務主管審核），業務可調整差異欄位（交期、數量、規格變動等）後送出。系統 MUST 於新訂單與來源訂單同時寫入 ActivityLog（事件描述 = 「訂單複製：來源 / 衍生」）。

**Data Model**：

| 欄位 | 型別 | 預設值 | 必填 | 說明 |
|------|------|--------|------|------|
| `source_order_id` | FK Order | NULL | N | 訂單複製來源；複製建立時系統自動填入；nullable（一般訂單可為空）；不可指向自己 |

**複製範圍**：
- MUST 複製：客戶資料、印件項目與規格、價格、付款條件、開票公司 / 抬頭 / 統編、配送地址 / 方式、訂單三種備註
- MUST NOT 複製：工單 / 生產任務（工單由印務主管按新訂單需求重新拆分）、稿件檔案（業務需重新確認客戶最新版稿件）、ActivityLog（新訂單從複製事件開始記錄）

#### Scenario: 老客戶重複下單一鍵複製

- **GIVEN** 業務遇到老客戶要求「照上次一樣」的重複下單
- **AND** 原訂單存在於系統
- **WHEN** 業務於訂單列表選原訂單執行「複製訂單」
- **THEN** 系統 SHALL 建立新訂單並帶入客戶 / 印件規格 / 價格 / 付款條件
- **AND** 新訂單 `source_order_id` MUST 指向原訂單
- **AND** 新訂單狀態 SHALL 為「草稿」
- **AND** 系統 MUST 於新訂單寫入 ActivityLog（事件描述 = 「訂單複製：來源訂單 #XXX」）
- **AND** 系統 MUST 於來源訂單寫入 ActivityLog（事件描述 = 「衍生訂單 #YYY」）

#### Scenario: 業務調整差異欄位後送出

- **GIVEN** 新訂單已從原訂單複製建立
- **WHEN** 業務修改交期、數量或某印件規格
- **THEN** 修改僅影響新訂單
- **AND** 原訂單 MUST NOT 受影響

#### Scenario: 複製不帶工單與稿件

- **GIVEN** 原訂單已有工單與印件稿件
- **WHEN** 業務複製此訂單
- **THEN** 新訂單 MUST NOT 帶入工單（待新訂單審核通過後印務主管重新拆分）
- **AND** 新訂單印件 MUST NOT 帶入稿件（業務需重新確認客戶最新版稿件）

### Requirement: 訂單客戶資料關聯帶出

訂單的客戶資料 SHALL 以 Customer entity relation 形式關聯（非 snapshot 快照）。廠客資料異動（公司改名、統編變更、地址變更等）後 SHALL 自動同步至既有訂單顯示。

**鎖定點**：訂單進入「製作中」狀態或已建立任一出貨單後，客戶資料變更 MUST NOT 自動同步至該訂單，以避免出貨單 / 紙本工單與系統訂單客戶名稱不一致。

**例外規則**：已開立發票 MUST 保留當時的客戶資料快照（buyer_name、buyer_ubn、buyer_address），不隨廠客資料異動。此例外依中華民國稅務規則要求（發票一旦開立其買受人資訊為法定紀錄）。

系統 MUST 於客戶資料同步至訂單顯示時於訂單 ActivityLog 記載「客戶資料同步：欄位 X 由 A 變更為 B」。

#### Scenario: 客戶改名後既有訂單同步更新

- **GIVEN** 訂單狀態為「草稿」～「審核通過」，已關聯廠客
- **WHEN** 廠客資料中公司名稱由「A 公司」改為「A 集團」
- **THEN** 此訂單的客戶顯示 SHALL 同步為「A 集團」
- **AND** ActivityLog MUST 記載「客戶資料同步：名稱由 A 公司變更為 A 集團」
- **AND** 同步動作 MUST NOT 觸發訂單回業務主管審核

#### Scenario: 訂單進入製作中後停止同步

- **GIVEN** 訂單狀態為「製作中」或之後
- **WHEN** 廠客資料中公司名稱由「A 公司」改為「A 集團」
- **THEN** 此訂單 MUST 保留「A 公司」（製作段不同步）
- **AND** 該訂單詳情頁 MUST 顯示提示「客戶資料已於 YYYY-MM-DD 變更為 A 集團，本訂單因已進入製作不同步」
- **AND** 新建訂單 SHALL 使用「A 集團」

#### Scenario: 已開發票保留客戶資料快照

- **GIVEN** 訂單已開立發票（買受人 = 「A 公司」）
- **WHEN** 廠客資料中公司名稱由「A 公司」改為「A 集團」
- **THEN** 已開發票上的買受人名稱 MUST 保留「A 公司」（開立當時快照）
- **AND** 新開立的發票 SHALL 使用「A 集團」

### Requirement: 多印件分次出貨追蹤

訂單下的每個印件 SHALL 有獨立的 `shipment_quantity` 累計欄位記錄已出貨數量。印件出貨狀態 SHALL 依入庫量與已出貨量自動推進：

- 已出貨量 = 0：印件出貨狀態 = 「未出貨」
- 0 < 已出貨量 < 訂單需求量：印件出貨狀態 = 「部分出貨」
- 已出貨量 = 訂單需求量：印件出貨狀態 = 「已出貨」

出貨單列表 SHALL 呈現印件級分次出貨進度，業務 / 客戶可看到各印件已出貨 / 未出貨狀態。

**訂單整體狀態**：訂單狀態 SHALL 維持齊套性邏輯（所有印件完成製作後才推進「製作完成」、所有印件完成出貨後才推進「訂單完成」），不另設訂單「部分出貨」狀態。部分出貨進度透過印件列表呈現。

**Data Model**：

| 欄位 | 型別 | 預設值 | 必填 | 說明 |
|------|------|--------|------|------|
| `shipment_quantity` | integer | 0 | Y | NOT NULL；累計已出貨數量；MUST NOT 超過 `warehouse_qty`（入庫量） |

#### Scenario: 印件部分出貨後狀態自動推進

- **GIVEN** 印件 A 訂單需求量 = 100、入庫量 = 100、`shipment_quantity` = 0
- **WHEN** 業務建立出貨單包含印件 A 30 件
- **THEN** 印件 A 的 `shipment_quantity` SHALL 累計為 30
- **AND** 印件 A 出貨狀態 SHALL 為「部分出貨」

#### Scenario: 多印件分次出貨進度展示

- **GIVEN** 訂單含印件 A（已出貨 100/100）、印件 B（已出貨 50/100）、印件 C（已出貨 0/100）
- **WHEN** 業務於訂單詳情頁查看出貨進度
- **THEN** 系統 SHALL 顯示「印件 A 已出貨、印件 B 部分出貨、印件 C 未出貨」
- **AND** 訂單整體狀態 SHALL 為「出貨中」（依齊套性邏輯）

#### Scenario: 出貨量不可超過入庫量

- **GIVEN** 印件 A 入庫量 = 100、`shipment_quantity` = 80
- **WHEN** 業務嘗試建立出貨單包含印件 A 30 件（會使 `shipment_quantity` = 110）
- **THEN** 系統 MUST 阻擋此動作並顯示錯誤「出貨數量不可超過入庫量」

### Requirement: 發票金額誤差核銷規則

開立多品項發票時，系統 SHALL 採以下計算規則處理稅額尾差：

1. 每品項各自無條件進位計算含稅金額：
   - 未稅金額 = 品項金額 / 1.05
   - 稅額 = 未稅金額 × 0.05（無條件進位至整數）
   - 含稅金額 = 未稅金額 + 稅額
2. 加總所有品項含稅金額（「品項加總」）
3. 與「總額一次計算」結果比對（總額直接無條件進位）
4. 若品項加總 ≠ 總額：差額（通常為 1 元）SHALL 集中於最後一個品項

**禁止規則**：MUST NOT 將差額平均分攤至所有品項。平均分攤會破壞每品項稅額正確性，違反中華民國稅務規則「每品項分別計算稅額」原則。

#### Scenario: 多品項發票進位差額集中最後品項

- **GIVEN** 發票含三品項：A = 1050、B = 1050、C = 1050（含稅金額）
- **WHEN** 系統依規則計算
- **THEN** 每品項各自計算未稅 = 1000、稅額 = 50、含稅 = 1050
- **AND** 品項加總 = 3150
- **AND** 總額一次計算 = 3150
- **AND** 此例無差額，三品項各自 1050

#### Scenario: 發票進位後差額補於最後品項

- **GIVEN** 發票含三品項：A = 1000、B = 1000、C = 1001（含稅金額）
- **WHEN** 系統依規則計算
- **THEN** 品項加總 = 3001
- **AND** 若品項算法產生差額 1 元
- **AND** 差額 MUST 集中於品項 C，C 顯示 = 1002
- **AND** 品項 A、B MUST 保持原計算值

### Requirement: 發票作廢與折讓 UI 與規則

訂單詳情頁發票異動 UI SHALL 維持「作廢」「折讓」兩個獨立按鈕讓業務 / 諮詢依情境選擇。

**作廢動作**：
- 業務點擊「作廢」 → 系統呼叫第三方發票平台執行作廢
- 平台回應成功：發票狀態變「作廢」，記錄作廢時間 / 原因 / 操作者；提示「流水號 +1，新發票自動生成下一號」
- 平台回應失敗（跨齊報稅期）：UI MUST 顯示明確錯誤訊息「此發票已跨齊報稅期無法作廢，請改開折讓單」並引導業務改點「折讓」

**折讓動作**：
- 業務點擊「折讓」 → 開立折讓單（金額為負）關聯既有發票
- 折讓單成功開立後 MUST 更新發票淨額（發票金額 − 折讓 = 發票淨額）

**規則判斷在後端**：業務不需自行判斷跨齊報稅期，系統依第三方發票平台實際回應引導正確流程。

#### Scenario: 作廢未跨齊報稅期成功

- **GIVEN** 訂單已開立發票，發票未跨齊報稅期
- **WHEN** 業務於發票詳情點擊「作廢」並填寫作廢原因
- **THEN** 系統呼叫第三方發票平台
- **AND** 平台回應成功
- **AND** 發票狀態 SHALL 變「作廢」
- **AND** 系統 MUST 記錄作廢時間 / 原因 / 操作者

#### Scenario: 作廢跨齊報稅期失敗引導折讓

- **GIVEN** 訂單已開立發票，發票已跨齊報稅期
- **WHEN** 業務於發票詳情點擊「作廢」並填寫作廢原因
- **THEN** 系統呼叫第三方發票平台
- **AND** 平台回應失敗（跨齊報稅期不可作廢）
- **AND** UI MUST 顯示錯誤訊息「此發票已跨齊報稅期無法作廢，請改開折讓單」
- **AND** 業務 SHALL 改點「折讓」按鈕走折讓流程

#### Scenario: 開立折讓單關聯既有發票

- **GIVEN** 訂單已開立發票（金額 1000）
- **WHEN** 業務點擊「折讓」並填寫折讓金額 -300
- **THEN** 系統 SHALL 開立折讓單並關聯此發票
- **AND** 發票淨額 SHALL 更新為 700（1000 - 300）

### Requirement: 退款流程三組件組合

實務退款場景 SHALL 由三組件組合構成完整流程，每組件對應獨立 Requirement 與 UI 動作：

1. **訂單異動單 + 業務主管審核**（金額異動審批）：建立訂單異動單記錄退款原因與金額 → 業務主管核可 → 業務執行重算應收
2. **退款款項處理**（金流動作）：業務於訂單詳情頁建立負值收款紀錄，記錄退款金額 / 日期 / 方式
3. **發票異動**（稅務動作）：依發票是否跨齊報稅期選擇開立折讓單（負值，跨期適用）或作廢發票（未跨期適用）

三組件互不重疊：金額異動審批 / 金流動作 / 稅務動作各自獨立可驗證。業務需依場景組合三組件完成完整退款流程。

**禁止簡化**：MUST NOT 用單一動作完成三組件邏輯（例如「點退款」直接同時建立負值收款 + 折讓單）。此禁止規則確保每組件可獨立稽核且符合中華民國稅務規則。

#### Scenario: 完整退款流程三組件組合

- **GIVEN** 訂單已收款 1000、開立發票 1000，客戶提出退款需求
- **WHEN** 業務執行退款流程
- **THEN** 步驟 1：業務建立訂單異動單（金額 -1000，原因「客戶取消」）→ 提交業務主管審核
- **AND** 步驟 2：業務主管核可 → 業務執行 → 應收重算為 0
- **AND** 步驟 3：業務於訂單詳情頁建立負值收款紀錄（-1000）
- **AND** 步驟 4：依發票是否跨齊報稅期選擇開立折讓單或作廢發票
- **AND** 三組件完成後對帳：應收 = 0、收款淨額 = 0、發票淨額 = 0

#### Scenario: 跨齊報稅期退款走折讓單

- **GIVEN** 退款場景發票已跨齊報稅期
- **WHEN** 業務完成訂單異動單核可 + 負值收款紀錄
- **THEN** 業務 SHALL 走「開立折讓單」（不可作廢）
- **AND** 折讓金額 SHALL 為 -1000 等於退款金額
- **AND** 折讓單 SHALL 關聯負值收款紀錄

#### Scenario: 未跨齊報稅期退款走作廢

- **GIVEN** 退款場景發票未跨齊報稅期
- **WHEN** 業務完成訂單異動單核可 + 負值收款紀錄
- **THEN** 業務 SHALL 走「作廢發票」（系統呼叫第三方平台）
- **AND** 業務 SHALL 重新開立金額為 0 或調整後金額的新發票
- **AND** 原發票流水號 MUST NOT 重用，新發票流水號自動 +1

### Requirement: 主訂單退款三組件進度展示

訂單詳情頁付款管理 Tab SHALL 顯示「主訂單退款進度區」，當訂單存在處於「進行中」狀態的退款動作時（即有訂單異動單 type = 退款且狀態為「待主管審核」/「已核可未執行」/「已執行未完成發票異動」）顯示三組件完成狀態提示區，含每組件的：
- 完成狀態（已完成 / 進行中 / 未開始）
- 對應實體連結（訂單異動單編號 / 收款紀錄編號 / 發票或折讓單編號）
- 完成時間與操作者

此展示協助業務 / 諮詢於主訂單退款場景追蹤進度，避免漏做任一組件（與 after-sales-ticket spec § 售後服務單三組件進度展示 為相同設計範式，但展示位置在訂單詳情頁付款管理 Tab）。

#### Scenario: 主訂單退款進行中顯示三組件進度

- **GIVEN** 訂單已建立退款訂單異動單（type = 退款）且狀態為「已核可未執行」
- **AND** 尚未建立負值收款紀錄、尚未處理發票異動
- **WHEN** 業務開啟訂單詳情頁付款管理 Tab
- **THEN** 系統 SHALL 顯示三組件進度區：
  - 訂單異動單：進行中（連結至異動單編號 + 「已核可待執行」）
  - 退款收款紀錄：未開始
  - 發票異動：未開始

#### Scenario: 三組件全完成隱藏進度區

- **GIVEN** 訂單退款三組件全部完成（訂單異動單已執行、負值收款紀錄已建立、發票異動已完成）
- **WHEN** 業務開啟訂單詳情頁付款管理 Tab
- **THEN** 退款進度區 MUST 隱藏或顯示「已完成」摺疊狀態
- **AND** 退款紀錄 MUST 仍可於收款紀錄列表 / 發票列表 / 訂單異動列表查閱

### Requirement: 付款計畫變更分階段稽核

業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期） SHALL 依業務主管審核狀態採分階段稽核邏輯：

**業務主管審核通過前（訂單為內部初版，`approved_at` 為空）**：
- 變更不觸發稽核欄位
- 不需回業務主管重新審核
- 業務 / 諮詢可自由調整不留紀錄

**業務主管審核通過後（訂單為正式版，`approved_at` 非空）**：
- 變更時系統 MUST 自動填入 `original_expected_date`（僅首次變更時填入，後續變更保留首次值）
- 變更時系統 MUST 將 `change_count` 加 1
- 變更 MUST 於 ActivityLog 記載（含變更前後日期、操作者、變更時間）
- 變更不再回業務主管審核（取代原既有「付款計畫變更觸發訂單回業務主管審核」機制）

斷點判斷依據為 `Order.approved_at` 欄位（業務主管核可時填入，初始為 NULL）。

**Data Model**：

| 欄位 | 型別 | 預設值 | 必填 | 說明 |
|------|------|--------|------|------|
| `original_expected_date` | date | NULL | N | 業務主管審核通過後首次變更時，系統寫入該期次「變更前」的 `scheduled_date`；首次寫入後 immutable |
| `change_count` | integer | 0 | Y | NOT NULL；業務主管審核通過後每次變更 +1；審核通過前變更不累加 |

#### Scenario: 業務主管審核通過前變更不留稽核紀錄

- **GIVEN** 訂單狀態為「待業務主管審核」（`approved_at` 為空）
- **WHEN** 業務修改 PaymentPlan 期次的金額或日期
- **THEN** 系統 MUST NOT 填入 `original_expected_date`
- **AND** `change_count` MUST 保持 0
- **AND** 訂單狀態 MUST 維持「待業務主管審核」（不觸發回審）

#### Scenario: 業務主管審核通過後首次變更觸發稽核

- **GIVEN** 訂單 `approved_at` 非空（業務主管已核可）
- **AND** PaymentPlan 期次 X 的 `original_expected_date` 為空、`change_count = 0`
- **WHEN** 業務修改期次 X 的預計收款日（從 2026-06-01 改為 2026-06-15）
- **THEN** 系統 MUST 填入 `original_expected_date = 2026-06-01`
- **AND** `change_count` MUST 變為 1
- **AND** ActivityLog MUST 記載「PaymentPlan 期次 X 變更：2026-06-01 → 2026-06-15」
- **AND** 訂單狀態 MUST 不變（不回業務主管審核）

#### Scenario: 後續變更累計變更次數但保留首次原始日期

- **GIVEN** PaymentPlan 期次 X 的 `original_expected_date = 2026-06-01`、`change_count = 1`、當前 `scheduled_date = 2026-06-15`
- **WHEN** 業務再次修改 `scheduled_date` 為 2026-07-01
- **THEN** `original_expected_date` MUST 保留為 2026-06-01（首次變更前的值，不被覆寫）
- **AND** `change_count` MUST 變為 2
- **AND** ActivityLog MUST 記載「PaymentPlan 期次 X 變更：2026-06-15 → 2026-07-01」

### Requirement: 業務送出訂單審核（草稿 → 待業務主管審核）

線下訂單由需求單「成交」轉入後 SHALL 以「草稿」為初始狀態（僅適用 `order_type = 線下`；線上訂單由 EC 付款自動推進、諮詢訂單為短路徑收尾，皆不進入草稿態）。**本 Requirement 取代既有「訂單建立」§ Scenario US-ORD-001 與 state-machines § 訂單狀態機 線下路徑列舉中「轉訂單直接進入報價待回簽 / 待業務主管審核」的描述**（既有主 spec 該兩處已由本 change MODIFIED § 訂單建立 與 state-machines § 訂單狀態機 整條取代校正，archive sync 自動完成）。

業務 SHALL 於草稿態調整自需求單帶入的內容（交期、印件規格、報價金額、收款條件備註等），確認無誤後於訂單詳情頁點擊「送主管審核」，系統 SHALL 將訂單狀態自「草稿」推進至「待業務主管審核」並寫入 `submitted_for_review_at = 當前時間`。

業務於「草稿」與「待業務主管審核」兩態 SHALL 皆可自由編輯訂單全部內容（業務主管核准前訂單視為內部初版，修改 MUST NOT 要求改走訂單異動單、MUST NOT 觸發回審）；自進入「審核通過」起鎖定成交條件（見「訂單業務主管審核欄位」與既有「審核通過狀態下訂單修改」Requirement）。業務主管不核准時訂單維持「待業務主管審核」、業務可持續修改後等待主管再次審視，**無需「退回草稿」動作**（沿用不設退回鈕、Slack 討論之既有設計；新增「送主管審核」為業務前向動作，不涉及主管退回）。

業務主管（`approved_by_sales_manager_id`）SHALL 於「草稿」建立時即自動指派（見「訂單業務主管審核欄位」Requirement）；「送主管審核」僅推進狀態、不重新指派。

#### Scenario: 業務於草稿態送主管審核

- **GIVEN** 線下訂單狀態為「草稿」、`approval_required = true`
- **WHEN** 業務於訂單詳情頁點擊「送主管審核」
- **THEN** 訂單狀態 SHALL 自「草稿」推進至「待業務主管審核」
- **AND** 系統 MUST 寫入 `submitted_for_review_at` = 當前時間
- **AND** 系統 MUST 寫入 OrderActivityLog（操作者 = 業務、事件描述 = 「送主管審核」）
- **AND** 該訂單 SHALL 出現在指定業務主管的訂單審核待辦頁

#### Scenario: 僅訂單可編輯角色可送主管審核

- **GIVEN** 線下訂單狀態為「草稿」
- **WHEN** 系統判斷「送主管審核」按鈕顯示對象
- **THEN** 系統 SHALL 僅對訂單可編輯角色（建立 / 負責該訂單的業務 / 諮詢人員）顯示「送主管審核」按鈕
- **AND** 業務主管（審核者）、印務主管、會計等非訂單可編輯角色 MUST NOT 看到「送主管審核」按鈕
- **AND** 任何由非可編輯角色發起的送審 API 請求 MUST 回傳權限不足錯誤

- **GIVEN** 線下訂單狀態為「草稿」或「待業務主管審核」
- **WHEN** 業務修改訂單內容（含核心欄位：報價金額 / 付款條件 / 收款條件備註，及一般欄位：交期 / 印件規格 / 備註）
- **THEN** 系統 SHALL 直接儲存修改、MUST NOT 要求改走訂單異動單
- **AND** 訂單狀態 MUST 維持原狀（草稿維持草稿、待審核維持待審核，不觸發回審）
- **AND** OrderActivityLog MUST 記載修改

#### Scenario: 線下訂單轉入初始狀態為草稿

- **WHEN** 業務於「成交」需求單執行「轉訂單」（`order_type = 線下`）
- **THEN** 系統 SHALL 建立訂單並使其進入「草稿」狀態（取代既有「直接進入報價待回簽 / 待業務主管審核」描述）
- **AND** 系統 SHALL 依「訂單業務主管審核欄位」Requirement 於建立時自動指派業務主管、設定 `approval_required = true`、帶入 `payment_terms_note`

## MODIFIED Requirements

### Requirement: 業務主管核准訂單

線下訂單從「待業務主管審核」推進至「審核通過」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，訂單維持「待業務主管審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行；本 Requirement MUST NOT 提供「退回討論」按鈕（避免 ERP 內 / Slack 內雙軌討論造成資訊分散）。

業務主管核准時 MUST：
- 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`（快照）
- 寫入 `Order.approved_at = 當前時間`（提供 PaymentPlan 分階段稽核判斷依據）
- 寫入 OrderActivityLog（事件描述 = 「核准訂單（成交條件審核）」）
- 將訂單狀態推進至「**審核通過**」（不再直接推進至「報價待回簽」）

業務主管核可後業務 SHALL 於外部管道（line / email / 紙本）寄送報價單給客戶，並於訂單詳情頁手動點擊「已送報價單」推進訂單狀態至「報價待回簽」（詳見「業務送出報價單給客戶」Requirement）。

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: 業務主管核准訂單推進至審核通過

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`、`payment_terms_note` 非空
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「審核通過」
- **AND** 系統 MUST 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`
- **AND** 系統 MUST 寫入 `Order.approved_at` = 當前時間
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准訂單（成交條件審核）」）
- **AND** 業務 SHALL 看到「已送報價單」按鈕可推進至「報價待回簽」

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 訂單狀態為「待業務主管審核」、`payment_terms_note` 為空
- **WHEN** 業務主管點擊「核准訂單」
- **THEN** UI MUST 跳出 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，訂單狀態 SHALL 變更為「審核通過」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核准訂單（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，訂單狀態 MUST 維持「待業務主管審核」

#### Scenario: 業務主管不核准透過 Slack thread 溝通

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 業務主管認為需重新討論收款條件或成交條件
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過 Slack thread 與業務直接討論
- **AND** 訂單狀態 MUST 維持「待業務主管審核」直到業務主管核准

#### Scenario: 業務不可從待業務主管審核直接推進

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟訂單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准訂單」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「審核通過」 MUST 回傳權限不足錯誤

#### Scenario: 非指定業務主管不可核准

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於訂單詳情頁點擊「核准訂單」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 該訂單 MUST NOT 出現在當前業務主管的「訂單審核」待辦清單

### Requirement: 訂單業務主管審核欄位

Order 資料模型 SHALL 新增以下業務主管審核相關欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK->使用者；訂單**草稿建立時**指派；草稿 / 待業務主管審核階段可由 Supervisor 重新指定（見 § Supervisor 重新指定訂單業務主管，解卡待審訂單）；進入「審核通過」後鎖定為實際核可者歷史紀錄、不再重指派 |
| 是否需審核 | approval_required | boolean | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | text(500) | | | 從來源 QuoteRequest 帶入；業務於草稿 / 待業務主管審核態可編輯、業務主管於審核時查看作為決策依據；**進入「審核通過」後鎖定**（核准當下即鎖，避免核准後外發前被改動繞過把關） |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | text(500) | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續若訂單退回需重審時的條件對照 |
| 送審時間 | submitted_for_review_at | datetime | | Y | 業務點「送主管審核」（草稿 → 待業務主管審核）時寫入；供訂單審核待辦頁「進入待審核時間」排序依據 |
| 報價單外發時間 | quote_sent_at | datetime | | Y | 業務點「已送報價單」（審核通過 → 報價待回簽）時寫入；與 `signed_at` 對稱，供「核准到外發」「外發到回簽」落差量測 |

`approved_by_sales_manager_id` 欄位的可選範圍 MUST 限定為具業務主管角色的用戶。

#### Scenario: 線下訂單草稿建立時自動指派業務主管

- **WHEN** 業務於需求單成交後點擊「轉訂單」建立線下訂單（初始狀態 = 草稿）
- **THEN** 系統 SHALL 自動將 `approved_by_sales_manager_id` 設為預設業務主管（Phase 1 第一位）
- **AND** 系統 SHALL 將 `approval_required` 設為 `true`
- **AND** 系統 SHALL 將來源需求單的 `payment_terms_note` 內容寫入訂單同名欄位
- **AND** 系統 SHALL 將 `lastApprovedPaymentTermsNote` 預設為 `null`

#### Scenario: 進入審核通過後業務主管欄位與成交條件鎖定

- **GIVEN** 訂單狀態為「審核通過」或更後狀態
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `approved_by_sales_manager_id` 或 `payment_terms_note`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該等欄位顯示為唯讀
- **AND** Supervisor「重新指定業務主管」機制僅作用於核可前的「待業務主管審核」階段（解卡待審訂單，見 § Supervisor 重新指定訂單業務主管）；進入審核通過後 `approved_by_sales_manager_id` 為實際核可者歷史紀錄、不再重指派

### Requirement: 業務主管於訂單模組的資料可見範圍

業務主管 SHALL 於訂單模組的可見範圍依頁面區分：

| 頁面 | 業務主管可見範圍 |
|------|----------------|
| 訂單列表頁（`/orders`）| 所有訂單（提供部門總覽能力）|
| 訂單審核待辦頁（`/sales-manager/approvals`）| `approved_by_sales_manager_id = self` AND `status ∈ {待業務主管審核, 審核通過, 報價待回簽, 已回簽, 已取消}`（草稿態屬業務側未送審、MUST NOT 出現於主管待辦頁）|
| 訂單詳情頁（`/orders/{id}`）| 所有訂單可瀏覽；「核准訂單」按鈕僅在 `approved_by_sales_manager_id = self` 時顯示 |

預設篩選 `status = 待業務主管審核`，按 `submitted_for_review_at` ASC 排序（最久未審優先）；「審核通過」於待辦頁僅供主管追蹤已核准未外發訂單，不需主管再操作。

#### Scenario: 業務主管於訂單審核頁僅見自己被指派的訂單

- **GIVEN** 訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管登入並開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 在審核清單中顯示此訂單

#### Scenario: 草稿態訂單不出現於業務主管待辦頁

- **GIVEN** 線下訂單狀態為「草稿」、`approved_by_sales_manager_id = self`
- **WHEN** 業務主管開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 顯示此訂單（業務尚未點「送主管審核」）

#### Scenario: 業務主管於訂單列表頁可見全部

- **WHEN** 業務主管登入並開啟 `/orders`
- **THEN** 列表 SHALL 顯示所有訂單（含其他業務主管被指定、含未進入審核的訂單）
- **AND** 業務主管點開非自己被指定的訂單詳情頁，MUST NOT 顯示「核准訂單」按鈕

### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）。**諮詢費 BillingInstallment 由業務於主訂單既有發票時程規劃流程自行加入，系統 MUST NOT 自動建立諮詢費 BillingInstallment 於主訂單**。`consultation_invoice_option` 作為客戶意向參考保留於 ConsultationRequest 實體，業務可參考決定主訂單發票時程，但不驅動系統行為。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

3. **不做大貨**：客戶最終沒做大貨製作，涵蓋兩個觸發點：
   - 3.1 諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」時建立
   - 3.2 諮詢結束做大貨後，需求單流失：系統將此事件歸類為「不做大貨」結局，自動建諮詢訂單收尾
4. **待諮詢取消（半額退費）**：諮詢人員 / 業務主管於待諮詢階段點「取消諮詢」並於 dialog 確認後建立，含退款 Payment 與 OrderAdjustment

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不建任何訂單**；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共同的建立動作：(a) 訂單金額 = 諮詢費全額（2000），(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) **不做大貨 / 需求單流失情境自動建立待開發票 1 筆作為提醒**（金額 2000）；**諮詢取消情境 MUST NOT 自動建待開發票**（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底），(e) 取消情境額外建立 OrderAdjustment(-1000, status=已核可, approved_by=system, executed_at=NULL) + 退款 Payment(-1000, 處理中)，(f) **MUST NOT 自動開立 Invoice 或 SalesAllowance**（廢止 `consultation_invoice_option` 對發票自動化的影響）。終態：不做大貨 / 需求單流失 = 訂單完成；諮詢取消 = 已取消（見 § Requirement: 諮詢取消諮詢訂單終態收斂 / 諮詢取消退費 OA 系統建已核可，於 state-machines spec）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 2000、印件費 = 4000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 2000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 系統 MUST NOT 自動建立諮詢費的 BillingInstallment（業務於主訂單既有發票時程規劃流程自行加入）
- **AND** 系統 MUST NOT 依 `consultation_invoice_option` 自動開立 Invoice（欄位降為客戶意向參考）
- **AND** 主訂單三方對帳：應收 = 6000 = 已收 2000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 3.1）

- **WHEN** ConsultationRequest 諮詢結束，諮詢人員選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 完成諮詢時點當天、source_type = consultation_end_no_production、invoicing_status = 未開立、created_by = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 3.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失（流失事件由需求單模組觸發）
- **WHEN** 系統處理需求單流失事件，且需求單 `linked_consultation_request_id` 非空
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 流失時點當天、source_type = quote_lost、invoicing_status = 未開立、created_by = system）
- **AND** 系統 MUST NOT 自動開立 Invoice

#### Scenario: 非諮詢來源的需求單流失不建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（非諮詢來源）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 需求單流失走需求單自身的退款 / 流失流程，與諮詢訂單無關

#### Scenario: 待諮詢取消觸發建諮詢訂單與半額退費

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 從 ConsultationRequest 轉移至諮詢訂單（金額 +2000 不變、status 維持已完成）
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
- **AND** 應收認列已核可 OA(-1000)（公式 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000）；退款 Payment 切「已完成」累計達 -1000 後推進 OA「已執行」
- **AND** 系統 MUST NOT 為諮詢取消自動建待開發票（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 諮詢訂單 SHALL 直接推進至「已取消」終態（見 § Requirement: 諮詢取消諮詢訂單終態收斂，於 state-machines spec）
- **AND** 諮詢訂單應收 = OEC(2000) + OA(-1000) = 1000

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「草稿」狀態（線下單以草稿為初始狀態，業務調整帶入內容後點「送主管審核」推進；見 § 業務送出訂單審核）；活動紀錄 MUST 記錄操作人與時間戳

## REMOVED Requirements

### Requirement: 付款計畫變更觸發訂單回業務主管審核

**Reason**：既有「變更即回業務主管審核」邏輯改為分階段稽核設計（業務主管審核通過前不留稽核紀錄、通過後變更直接編輯但記稽核軌跡），由新 ADDED Requirement「付款計畫變更分階段稽核」取代。

**Migration**：
- 本 change 上線後，既有訂單依新邏輯執行：
  - 仍未過業務主管核准的訂單：付款計畫變更不留稽核（沿用舊邏輯的「未過審核」行為，但不再強制阻擋修改）
  - 已過業務主管核准的訂單：付款計畫變更不再回審核，但自動填入 `original_expected_date`（首次變更時）+ `change_count + 1`
- Prototype 補實作 task 6.5 需拆除既有「變更回業務主管審核」邏輯（OrderPaymentSection.tsx:154-171）並改為分階段稽核

## MODIFIED Data Model

> `openspec archive` 內建 sync **不處理 Data Model section**（doc-audit v1.4），archive 時 MUST 手動將下列異動合入主 spec `openspec/specs/order-management/spec.md` § Data Model § Order。下表僅列**異動 / 新增列**，其餘 Order 欄位不變。

### Order

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK -> 使用者；訂單**草稿建立時**指派；草稿 / 待業務主管審核階段可由 Supervisor 重新指定（解卡待審訂單，見 § Supervisor 重新指定訂單業務主管）；**進入「審核通過」後鎖定**為實際核可者歷史紀錄、不再重指派（原為「進入報價待回簽後鎖定」） |
| 收款條件備註 | payment_terms_note | 文字 | | | 從來源需求單帶入；最長 500 字；業務於草稿 / 待業務主管審核態可編輯、業務主管於審核時查看作為決策依據；**進入「審核通過」後鎖定**（核准當下即鎖；原為「進入報價待回簽後鎖定」） |
| 送審時間 | submitted_for_review_at | datetime | | Y | 新增；業務點「送主管審核」（草稿 → 待業務主管審核）時寫入；供訂單審核待辦頁排序 |
| 報價單外發時間 | quote_sent_at | datetime | | Y | 新增；業務點「已送報價單」（審核通過 → 報價待回簽）時寫入；供「核准到外發」「外發到回簽」落差量測 |
