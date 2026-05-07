## REMOVED Requirements

### Requirement: 審核業務主管指定

**Reason**: 業務主管 gate 整個移到訂單階段，需求單實體不再有審核業務主管欄位。業務主管的指派改為訂單建立時於訂單實體上設定（見 [order-management spec](../order-management/spec.md) § 訂單業務主管審核欄位）。

**Migration**: QuoteRequest 資料模型 SHALL 移除 `approved_by_sales_manager_id` 欄位。Phase 1 prototype 階段無正式運行資料，無需資料遷移。Prototype 已於 commit `48224b5` 移除此欄位。

---

### Requirement: 業務主管核可議價推進

**Reason**: 業務主管 gate 整個移到訂單階段。需求單階段業務獨立完成從「已評估成本」推進至「議價中」，無需業務主管核可。業務主管的審核時點改為訂單建立後 → 報價待回簽前（見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單）。

**Migration**: 移除「進入議價」按鈕的業務主管核可邏輯；業務 SHALL 可於「已評估成本」狀態直接點擊「進入議價」推進至「議價中」。Prototype 已於 commit `48224b5` 完成清理。

---

### Requirement: 核可條件預留欄位（Phase 2 條件化升級）

**Reason**: `approval_required` 欄位隨業務主管 gate 整個移到訂單實體上（見 [order-management spec](../order-management/spec.md) § 訂單業務主管審核欄位）。需求單實體不再保留此欄位。

**Migration**: QuoteRequest 資料模型 SHALL 移除 `approval_required` 欄位。Phase 1 prototype 階段無正式運行資料，無需資料遷移。

---

### Requirement: 業務主管側選單與兩個頁面

**Reason**: 業務主管的待辦清單頁內容由「需求單核可」改為「訂單審核」（見 [user-roles spec](../user-roles/spec.md) § 業務主管角色職責）。需求單列表業務主管仍可瀏覽（只讀），但側選單結構與篩選邏輯整體調整為以訂單為核心。

**Migration**: 業務主管側選單由「需求單管理 → [需求單核可、需求單列表]」改為「需求單管理（只讀）+ 訂單管理 → [訂單列表、訂單審核、訂單異動審核]」。`/sales-manager/approvals` URL 保留，內容由需求單核可改為訂單審核（順向遷移以避免 bookmark 失效）。Prototype 已於 commit `48224b5` 完成。

---

### Requirement: 資料可見範圍

**Reason**: 業務主管 gate 移到訂單後，業務主管於需求單模組的細粒度可見範圍規則簡化為「全部需求單只讀」，無需區分核可頁與列表頁。本 Requirement 涵蓋的「需求單核可頁業務主管限制 self」邏輯整體下架，併入訂單模組的可見範圍規則。

**Migration**: 業務主管於需求單列表頁與詳情頁皆為只讀檢視全部需求單；訂單側可見範圍規則由 [order-management spec](../order-management/spec.md) § 業務主管於訂單模組的資料可見範圍 取代。Prototype 已於 commit `48224b5` 完成。

---

### Requirement: Supervisor 重新指定業務主管

**Reason**: 需求單實體不再有業務主管欄位，Supervisor 無從於需求單上「重新指定業務主管」。Supervisor 重新指定業務主管的權限改為於訂單實體上行使（見 [order-management spec](../order-management/spec.md) § Supervisor 重新指定訂單業務主管）。

**Migration**: Prototype 中 `supervisorReassignManager(quoteId, 'sales', ...)` action 已修改為回傳錯誤訊息「業務主管已搬到訂單上，請於訂單詳情頁重新指派」。「重新指定印務主管」分支保留不動。

---

## MODIFIED Requirements

### Requirement: 需求單狀態轉換

需求單 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 需求單狀態機 的規則進行狀態轉換。完整流程為：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失。其中：

- 「需求確認中 → 待評估成本」 SHALL 由業務於指定印務主管後執行「送印務評估」觸發
- 「待評估成本 → 已評估成本」 SHALL 由印務主管完成成本評估後執行「評估完成」觸發
- 「已評估成本 → 議價中」 SHALL 由業務直接執行（無業務主管 gate）
- 「議價中 → 成交 / 流失」 SHALL 由業務依議價結果執行
- 「議價中 → 待評估成本」（重新評估）SHALL 由業務發起 US-QR-006 路徑

業務主管不介入需求單流程任何狀態轉換。業務主管的審核 gate 位於訂單階段（訂單建立後 → 報價待回簽前），詳見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單。

#### Scenario: 完整成交流程

- **WHEN** 需求單經過需求確認、成本評估、議價、成交
- **THEN** 狀態依序轉換至「成交」，各轉換由業務或印務主管觸發

#### Scenario: 業務直接從已評估成本進入議價

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 系統 SHALL 直接推進至「議價中」狀態
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 需求單流失

- **WHEN** 業務判斷客戶不成交
- **THEN** 業務可將需求單標記為「流失」，MUST 選擇流失原因（LOV 選單）

#### Scenario: US-QR-002 業務管理需求單進度

- **WHEN** 需求單成本評估完成進入「已評估成本」狀態
- **THEN** 業務 SHALL 於 `payment_terms_note` 欄位填寫與客戶確認的收款說明（選填）
- **AND** 業務 SHALL 看到「進入議價」按鈕可直接推進
- **AND** 需求單進入「議價中」後，業務 SHALL 視客戶回應執行「成交」或「流失」標記終態
- **AND** 每次狀態變更 MUST 自動記錄至 ActivityLog
- **AND** 管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價

- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估
- **AND** 歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄
- **AND** 重新進入「已評估成本」後業務 SHALL 可直接再進入「議價中」（無需經業務主管核可）

---

### Requirement: 收款備註欄位

QuoteRequest 資料模型 SHALL 保有 `payment_terms_note` 欄位（text，最長 500 字，選填），供業務記錄與客戶討論的收款條件，作為後續報價單內容基礎。

業務 SHALL 於需求單任何狀態（草稿、需求確認中、待評估成本、已評估成本、議價中）皆可編輯此欄位；進入「成交」或「流失」終態後 SHALL 鎖定為唯讀。

成交轉訂單時，系統 MUST 將 `payment_terms_note` 內容帶入新訂單的同名欄位（見 [order-management spec](../order-management/spec.md) § 訂單業務主管審核欄位）。業務主管於訂單詳情頁審核時查看此欄位內容，作為審核決策依據之一。需求單階段不再有「業務主管查看收款備註」流程。

#### Scenario: 業務於需求單填寫收款備註

- **WHEN** 業務於需求單詳情頁編輯 `payment_terms_note` 欄位
- **THEN** 系統 SHALL 接受最長 500 字 free text 內容
- **AND** 超過 500 字 MUST 拒絕儲存並顯示字數超出提示
- **AND** 留空允許儲存，欄位存為 NULL

#### Scenario: 終態後收款備註鎖定

- **GIVEN** 需求單狀態為「成交」或「流失」
- **WHEN** 任何使用者嘗試修改 `payment_terms_note`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀

#### Scenario: 成交轉訂單時 payment_terms_note 帶入訂單

- **GIVEN** 需求單狀態為「成交」、`payment_terms_note` 內容為 "月結 60 天、訂金 30%"
- **WHEN** 業務於需求單點擊「建立訂單」
- **THEN** 系統 SHALL 建立新訂單
- **AND** 新訂單的 `payment_terms_note` 欄位 MUST = "月結 60 天、訂金 30%"
- **AND** 新訂單後續由業務主管審核時，業務主管 SHALL 於訂單詳情頁查看此欄位

---

### Requirement: 需求單詳情頁 Tabs 化版型

需求單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → （條件性 inline banners）→ ErpDetailTabs（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 需求單案名（標題）
- 需求單號 Badge（success 色系）
- 主動作群（依角色 / 狀態條件顯示）：
  - 業務：複製 / 編輯 / 流失 / 送印務評估 / 進入議價 / 成交 / 重新報價 / 建立訂單
  - PM 或業務：評估完成
  - Supervisor：重新指定印務主管

業務主管於需求單詳情頁 MUST NOT 顯示任何業務主管專屬動作（核可進入議價、核准成交、上次核可條件對照等動作均移除）。業務主管於需求單為只讀檢視。

`ErpPageHeader` 與 `ErpDetailTabs` 之間 SHALL 保留條件性 inline banner 區（緊貼 Header 之下、Tabs 之上）：
- 業務側：需求確認中狀態下未指定印務主管時的提示 banner
- 動作錯誤訊息 banner（Supervisor 重新指定印務主管錯誤等）

需求單詳情頁 SHALL 包含 5 個 Tab（含條件隱藏 Tab），順序：`資訊（首位，defaultValue）→ 印件報價（{count}）→ 報價紀錄（{count}，業務 / 業務主管 才顯示）→ 權限管理（{count}）→ 活動紀錄`。

「資訊」Tab 承載原 Tabs 之上的「基本資訊卡」：StatusStepper（5 步狀態步驟條）+ 主資訊欄位（業務 / 印務主管 / 客戶 / 等等）+ 收款備註 + 備註 + 流失原因 / 流失說明（status='流失' 時顯示）+ 報價金額橫排（報價輪次 / 小計 / 稅額 / 含稅總額）。

#### Scenario: 業務進入需求單詳情頁預設停留資訊 Tab

- **WHEN** 業務或業務主管進入需求單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 顯示基本資訊卡（含 StatusStepper 5 步 + 主資訊欄位 + 報價金額橫排）

#### Scenario: 需求單詳情頁 Tab 順序符合業務流先後

- **WHEN** 業務瀏覽需求單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件報價 → 報價紀錄 → 權限管理 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）
- **AND** 「報價紀錄」Tab SHALL 在使用者非業務或業務主管時隱藏（沿用既有 `hidden: !(isSales || isSalesManager)` 邏輯）

#### Scenario: 條件性 inline banner 位置

- **WHEN** 需求單 `status === '需求確認中'` 且使用者為業務、且未指定印務主管
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示「尚未指定評估印務主管」提示 banner
- **AND** banner SHALL NOT 出現在「資訊」Tab 內或其他 Tab 中

#### Scenario: 業務主管於需求單詳情頁無動作按鈕

- **WHEN** 業務主管開啟任一需求單詳情頁
- **THEN** `ErpPageHeader` 動作群 MUST NOT 顯示「核可進入議價」、「核准成交」、「一鍵確認（條件未變）」任一按鈕
- **AND** 內容區 MUST NOT 顯示「上次核可條件對照」banner
- **AND** 業務主管的審核動作改於訂單詳情頁執行（見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單）
