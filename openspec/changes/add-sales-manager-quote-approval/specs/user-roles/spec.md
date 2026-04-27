## ADDED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 擁有需求單模組的 R/W 權限，負責報價提供前的議價推進核可，以及與業務確認收款條件後將需求單從「已評估成本」推進至「議價中」。業務主管 MUST NOT 直接介入需求確認、印件規格填寫、成本評估、議價對談、成交 / 流失等其他需求單流程環節。

業務主管的核可決策範圍 MUST 限於「指定的業務主管 = 自己」的需求單；MUST NOT 跨業務主管核可他人指定範圍的需求單。本 change 範疇內 MUST NOT 擴散至訂單模組、工單模組、任務模組、KPI Dashboard 或部門管理功能（後續 Phase 2 規劃）。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理待辦（對齊印務主管模式），含 Slack Webhook 通知對齊。

業務主管的利害關係程度 SHALL 為「高」，因「議價中」的核可為需求單流程關鍵推進節點。

**資料可見範圍**：業務主管 SHALL 僅看到 `approved_by_sales_manager_id = self` 且 `status ∈ {已評估成本, 議價中, 成交, 流失}` 的需求單。MUST NOT 看到處於「草稿」、「需求確認中」、「待評估成本」狀態的需求單（即印務主管尚未完成評估前，業務主管不需介入）。詳細規則見 [quote-request spec](../quote-request/spec.md) § Requirement「資料可見範圍」。

若同一使用者兼具業務與業務主管兩角色（如資深業務兼任業務主管），可見範圍 SHALL 取兩者聯集。

#### Scenario: 業務主管登入後看到中台介面

- **WHEN** 業務主管使用業務主管角色登入 ERP
- **THEN** 系統 SHALL 顯示中台平台介面入口
- **AND** 系統 SHALL 顯示需求單模組入口
- **AND** 系統 MUST NOT 顯示報價單 / 訂單、工單、任務模組入口

#### Scenario: 業務主管核可需求單進入議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **AND** 該需求單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於需求單詳情頁點擊「核可進入議價」
- **THEN** 需求單狀態 SHALL 變更為「議價中」
- **AND** 系統 SHALL 將該核可動作寫入 QuoteRequestActivityLog（操作者 = 業務主管、事件描述包含「核可進入議價」）

#### Scenario: 業務主管不可核可他人指定的需求單

- **GIVEN** 需求單狀態為「已評估成本」
- **AND** 該需求單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於需求單詳情頁點擊「核可進入議價」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 業務主管 SHALL 看不到該需求單於自己的待辦清單

#### Scenario: 業務主管不直接編輯需求單內容

- **WHEN** 業務主管於需求單詳情頁查看內容
- **THEN** 系統 SHALL 提供印件規格、成本、報價、客戶資料、收款備註等欄位以唯讀方式呈現
- **AND** 系統 MUST NOT 提供業務主管編輯印件、修改報價、執行成交 / 流失的入口
- **AND** 系統 SHALL 提供業務主管「核可進入議價」與「退回討論」兩個動作入口（細粒度權限見 [quote-request spec](../quote-request/spec.md) § Requirement「業務主管核可議價推進」）

#### Scenario: 業務主管收到 Slack 通知

- **WHEN** 印務主管執行「評估完成」，需求單狀態變為「已評估成本」
- **THEN** 系統 SHALL 透過 Slack Webhook 通知該需求單 `approved_by_sales_manager_id` 對應的業務主管
- **AND** 通知機制與印務主管「待評估成本通知」對稱

---

## MODIFIED Requirements

### Requirement: 平台歸屬分類

系統 SHALL 將所有角色歸屬至以下六個平台之一：業務平台、中台、印務平台、審稿平台、工廠平台、中國供應商平台。每個角色 MUST 有且僅有一個平台歸屬。

#### Scenario: 角色登入後看到對應平台介面

WHEN 使用者以特定角色登入系統
THEN 系統 SHALL 僅顯示該角色所屬平台的介面與功能入口

#### Scenario: 平台歸屬對照表

WHEN 系統初始化角色設定
THEN 各角色的平台歸屬 SHALL 依下表配置：

| 平台 | 角色 |
|------|------|
| 中台 | Supervisor、訂單管理人、審稿主管、印務主管、業務主管、EC商品管理 |
| 業務平台 | 業務、諮詢、會計 |
| 印務平台 | 印務 |
| 審稿平台 | 審稿 |
| 工廠平台 | 生管、師傅、外包廠商、QC、出貨 |
| 中國供應商平台 | 中國廠商 |

#### Scenario: 師傅平台存取限制

WHEN 師傅登入 ERP
THEN 師傅 SHALL 僅能存取師傅任務平台功能
AND 系統 MUST 隱藏其他 ERP 模組選單

#### Scenario: 工廠平台統一入口

- **WHEN** 系統初始化角色設定
- **THEN** 生管、師傅、外包廠商、QC、出貨 SHALL 歸屬於工廠平台
- **AND** 工廠平台內依角色顯示對應功能：生管看到日程面板；師傅看到師傅任務平台

#### Scenario: Prototype User 切換對應

- **WHEN** 使用者在 Prototype 的角色切換選單選擇生管
- **THEN** 系統 SHALL 自動導航至工廠平台首頁（日程面板）
- **AND** 側選單 SHALL 僅顯示工廠平台功能

- **WHEN** 使用者在 Prototype 的角色切換選單選擇師傅
- **THEN** 系統 SHALL 自動導航至師傅任務平台
- **AND** 側選單 SHALL 僅顯示師傅任務平台功能

- **WHEN** 使用者在 Prototype 的角色切換選單選擇業務主管
- **THEN** 系統 SHALL 自動導航至中台首頁
- **AND** 側選單 SHALL 僅顯示需求單模組

- **WHEN** 使用者在 Prototype 的角色切換選單選擇業務
- **THEN** 系統 SHALL 自動導航至業務平台首頁
- **AND** 側選單 SHALL 僅顯示需求單與報價單 / 訂單兩個模組

---

### Requirement: 模組存取權限模型

系統 SHALL 對每個角色定義四個模組（需求單、報價單/訂單、工單、任務）的存取層級。權限層級分為 R/W（可讀寫）與 X（無存取權限）。

**「R/W」為粗粒度標示**，意義為「該角色於該模組內擁有讀取與寫入能力」。實際細粒度權限（可讀哪些資料、可寫哪些欄位、可執行哪些動作）由各模組 spec 的 Requirement 規範。例如業務主管於需求單模組為 R/W，但細粒度上僅可核可 / 退回特定狀態的需求單，且僅限自己被指定範圍，這類細節由 [quote-request spec](../quote-request/spec.md) 的對應 Requirement 定義。

新增角色時 SHALL 同時於 user-roles spec 設定粗粒度 R/W 標示，並於對應模組 spec 補充細粒度行為 Requirement。

#### Scenario: 角色存取無權限模組

WHEN 角色的模組權限為 X
THEN 系統 SHALL 不顯示該模組的任何入口，且任何 API 請求 MUST 回傳權限不足錯誤

#### Scenario: 角色存取可讀寫模組

WHEN 角色的模組權限為 R/W
THEN 系統 SHALL 允許該角色查看與編輯該模組中其職責範圍內的資料
AND 細粒度權限（可讀範圍、可寫欄位、可執行動作）SHALL 由各模組 spec 的 Requirement 規範

#### Scenario: 完整權限對照表

WHEN 系統配置角色權限
THEN 各角色的模組權限 SHALL 依下表設定：

| 角色 | 需求單 | 報價單/訂單 | 工單 | 任務 |
|------|--------|------------|------|------|
| Supervisor | R/W | R/W | R/W | R/W |
| 訂單管理人 | X | R/W | R/W | R/W |
| 業務 | R/W | R/W | X | X |
| 諮詢 | R/W | R/W | X | X |
| 業務主管 | R/W | X | X | X |
| 會計 | X | R/W | X | X |
| 審稿主管 | X | X | X | X |
| 審稿 | X | X | X | X |
| 印務主管 | R/W | X | R/W | X |
| 印務 | X | X | R/W | R/W |
| 生管 | X | X | X | R/W |
| 師傅 | X | X | X | R/W |
| 中國廠商 | X | X | X | R/W |
| 外包廠商 | X | X | X | R/W |
| QC | X | X | R/W | X |
| 出貨 | X | X | R/W | R/W |
| EC商品管理 | X | X | X | X |

---

### Requirement: 階段參與範圍限制

系統 SHALL 依據角色的參與階段設定，限制角色可操作的流程階段。未列入參與階段的角色 MUST NOT 出現在該階段的操作介面中。

#### Scenario: 參與階段對照表

WHEN 系統配置角色的階段存取權限
THEN 各角色的參與階段 SHALL 依下表設定：

| 角色 | 參與階段 |
|------|---------|
| Supervisor | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 訂單管理人 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 業務 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 諮詢 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 業務主管 | 評估 |
| 會計 | 審稿 |
| 審稿主管 | 審稿 |
| 審稿 | 審稿 |
| 印務主管 | 評估、打樣印製 |
| 印務 | 打樣印製 |
| 生管 | 打樣印製 |
| 師傅 | 打樣印製 |
| 中國廠商 | 打樣印製 |
| 外包廠商 | 打樣印製 |
| QC | 打樣印製 |
| 出貨 | 出貨 |
| EC商品管理 | BOM商品資料同步 |

#### Scenario: 非參與階段角色無法操作

WHEN 流程處於某角色未參與的階段
THEN 該角色 MUST NOT 在該階段的任務指派、操作按鈕或審核流程中出現
