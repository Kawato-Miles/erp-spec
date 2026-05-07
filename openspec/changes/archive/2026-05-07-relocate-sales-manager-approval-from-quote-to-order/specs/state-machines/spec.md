## MODIFIED Requirements

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失

角色權責：業務 / 諮詢業務負責需求確認、議價對談、成交 / 流失決策、以及「已評估成本 → 議價中」的直接推進；印務主管負責成本評估。業務主管不介入需求單流程任何狀態轉換。

業務主管 gate 位於訂單階段（線下訂單建立後 → 報價待回簽前），詳見本 spec § 訂單狀態機 與 [order-management spec](../order-management/spec.md) § 業務主管核准訂單。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管。其他狀態轉換不再觸發 Slack 通知（v2.0 的「進入已評估成本通知業務主管」隨業務主管 gate 移除而下架）。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 待評估成本進入已評估成本

- **WHEN** 印務主管執行「評估完成」
- **THEN** 需求單狀態 SHALL 變為「已評估成本」
- **AND** 系統 MUST 寫入 ActivityLog 記錄印務主管評估動作

#### Scenario: 業務直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價後成交

- **WHEN** 客戶於議價階段接受報價，業務點擊「成交」
- **THEN** 需求單狀態 SHALL 變為「成交」
- **AND** 系統 SHALL 允許後續建立訂單（轉訂單動作）
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 業務於重新評估後可直接再進入議價中

- **GIVEN** 需求單原處於「議價中」狀態，業務執行「重新評估報價」
- **AND** 需求單回到「待評估成本」狀態，印務主管重新評估後再次進入「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」（無需業務主管核可）

---

### Requirement: 訂單狀態機

訂單（Order）SHALL 依以下狀態流轉，分為線下與線上兩條前段路徑，匯入共用後段：

**線下路徑**：待業務主管審核 → 報價待回簽 → 已回簽

**線上路徑**（含一般訂單與客製單）：等待付款 → 已付款（由 EC 付款完成自動觸發）

**共用段**：稿件未上傳 → 等待審稿 ↔ 待補件 → 製作等待中 → 工單已交付 → 製作中 → 製作完成 → 出貨中 → 訂單完成

「待業務主管審核 → 報價待回簽」轉換 MUST 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為訂單 `approval_required = true`（Phase 1 線下訂單預設皆 true）。業務角色 MUST NOT 直接執行此轉換。業務主管核准動作為單向狀態轉換（無「退回至前狀態」按鈕）；業務主管不核准時透過 Slack thread 與業務溝通，訂單維持「待業務主管審核」狀態。

EC 線上訂單與諮詢訂單 MUST NOT 進入「待業務主管審核」狀態（業務主管 gate 僅適用於線下訂單）。

**審稿段子狀態說明**：
- 「等待審稿」與「待補件」互為審稿段內的平行子狀態
- 「待補件」：存在任一印件 `reviewDimensionStatus = '不合格'`（業務需補件）
- 「等待審稿」：無印件不合格，且存在至少一件印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'`（該印件稿件已上傳 / 已補件，球在審稿人員）
- 子狀態間 SHALL 允許雙向互換（補件完成從「待補件」回到「等待審稿」）
- QC 不合格 MUST NOT 冒升至 Order 層；訂單本身永遠沒有「QC 不合格」狀態

免審稿快速路徑：當訂單下所有印件的 review_status 皆為「合格」（含免審稿設定）時，訂單 SHALL 從「已付款」或「已回簽」直接進入「製作等待中」，跳過「稿件未上傳」、「等待審稿」、「待補件」。

#### Scenario: 線下訂單建立進入待業務主管審核

- **WHEN** 業務於需求單成交後執行「轉訂單」建立線下訂單
- **THEN** 訂單初始狀態 SHALL = 「待業務主管審核」
- **AND** 訂單 `approved_by_sales_manager_id` MUST 自動指派
- **AND** 訂單 `payment_terms_note` MUST 從來源需求單帶入

#### Scenario: 業務主管核准訂單推進至報價待回簽

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`、`payment_terms_note` 非空
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 ActivityLog 記錄業務主管核准動作

#### Scenario: 業務不可從待業務主管審核直接推進

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`
- **WHEN** 業務（非指定業務主管）於訂單詳情頁查看狀態推進選項
- **THEN** 系統 MUST NOT 提供「核准訂單」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」提示文字
- **AND** 任何 API 請求嘗試由業務直接推進至「報價待回簽」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管暫不核准透過 Slack 與業務溝通

- **GIVEN** 訂單狀態為「待業務主管審核」
- **WHEN** 業務主管於訂單詳情頁查看內容後選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過 Slack thread 與業務直接討論
- **AND** 訂單狀態 MUST 維持「待業務主管審核」直到核准

#### Scenario: 線下訂單回簽後進入共用段

- **WHEN** 線下訂單的報價已回簽
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 線上訂單付款後進入共用段

- **WHEN** 線上訂單（含客製單）已完成付款（EC 自動觸發）
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」
- **AND** 線上訂單 MUST NOT 進入「待業務主管審核」狀態

#### Scenario: 訂單狀態推進至製作完成

- **WHEN** 訂單下所有印件的印製狀態皆為「製作完成」
- **THEN** 訂單狀態 SHALL 推進為「製作完成」

#### Scenario: 存在不合格印件時訂單推進至待補件

- **WHEN** 訂單位於審稿段（稿件未上傳 / 等待審稿 / 待補件 其中之一）且任一印件審稿結果為「不合格」
- **THEN** 訂單狀態 SHALL 推進為「待補件」

#### Scenario: 補件完成後訂單回到等待審稿

- **WHEN** 訂單狀態為「待補件」且該不合格印件補件完成（印件 `reviewDimensionStatus` 變為「已補件」）
- **AND** 訂單下已無其他印件處於「不合格」
- **THEN** 訂單狀態 SHALL 回到「等待審稿」

#### Scenario: 全部印件合格後訂單進入製作等待中

- **WHEN** 訂單位於審稿段且所有印件 `reviewDimensionStatus = '合格'`
- **THEN** 訂單狀態 SHALL 推進為「製作等待中」

#### Scenario: 混合免審稿與需審稿未上傳印件時訂單維持稿件未上傳

- **WHEN** 訂單混合印件：部分為免審稿（`reviewDimensionStatus = '合格'`）+ 部分為需審稿但尚未上傳稿件（`reviewDimensionStatus = '稿件未上傳'`）
- **THEN** 訂單狀態 SHALL 維持「稿件未上傳」（不誤派為「等待審稿」）
- **AND** 直到需審稿印件上傳稿件（狀態轉為「等待審稿」）後，Order SHALL 推進為「等待審稿」

#### Scenario: 打樣 NG 棄用後原訂單新增免審稿印件

- **WHEN** 原訂單於製作段發生打樣 NG，業務決定棄用原印件並於**原訂單**新增印件（設定為免審稿）
- **THEN** 新印件 SHALL 於原訂單下建立，`reviewDimensionStatus = '合格'`（免審稿直達合格）
- **AND** 原訂單狀態 MUST NOT 受此操作影響（保持既有製作段狀態；`deriveOrderReviewStatus` 檢查 Order 已離開審稿段，不觸發回推）

#### Scenario: 同印件追加製作走新訂單

- **WHEN** 客戶已有合格印件想追加製作量（加印）
- **THEN** 業務 SHALL 開立新訂單承接追加製作
- **AND** 原訂單狀態 MUST NOT 因新訂單建立而改變
- **AND** 本狀態機 MUST NOT 提供「原訂單分裂新製作批次」的邏輯
