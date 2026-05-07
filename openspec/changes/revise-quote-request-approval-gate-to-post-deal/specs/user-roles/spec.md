## MODIFIED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 擁有需求單模組的 R/W 權限，負責**成交後出報價單前的最終審核**：與業務確認收款條件、報價單條件、交期合理後將需求單從「待業務主管成交審核」推進至「已核准成交」。業務主管 MUST NOT 直接介入需求確認、印件規格填寫、成本評估、議價對談、成交 / 流失等其他需求單流程環節。

業務主管的核准決策範圍 MUST 限於「指定的業務主管 = 自己」的需求單；MUST NOT 跨業務主管核准他人指定範圍的需求單。本 change 範疇內 MUST NOT 擴散至訂單模組、工單模組、任務模組、KPI Dashboard 或部門管理功能（後續 Phase 2 規劃）。

業務主管的審核時點與 v2.0 不同：v2.0 為「議價前核可」（已評估成本 → 議價中），現修訂為「成交後審核」（待業務主管成交審核 → 已核准成交）。理由詳見 [quote-request spec](../quote-request/spec.md) 與本 change design.md D1 / D3。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理待辦（對齊印務主管模式），含 Slack Webhook 通知對齊。

業務主管的利害關係程度 SHALL 為「高」，因「已核准成交」為訂單建立的前置必要 gate。

**資料可見範圍**：業務主管於不同頁面有不同可見範圍：

- 「需求單核可頁」（`/sales-manager/approvals`）：僅自己被指定且 `status ∈ {待業務主管成交審核, 已核准成交, 流失}`
- 「需求單列表頁」（`/`）：所有需求單（提供部門總覽能力）

詳細規則見 [quote-request spec](../quote-request/spec.md) § 業務主管成交後審核 與 § 業務主管側選單與兩個頁面（v3 翻轉）。

若同一使用者兼具業務與業務主管兩角色（如資深業務兼任業務主管），可見範圍 SHALL 取兩者聯集。

#### Scenario: 業務主管登入後看到中台介面

- **WHEN** 業務主管使用業務主管角色登入 ERP
- **THEN** 系統 SHALL 顯示中台平台介面入口
- **AND** 系統 SHALL 顯示需求單模組入口
- **AND** 系統 MUST NOT 顯示報價單 / 訂單、工單、任務模組入口

#### Scenario: 業務主管核准成交後審核

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **AND** 該需求單 approved_by_sales_manager_id 等於當前業務主管
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 SHALL 將該核准動作寫入 QuoteRequestActivityLog（操作者 = 業務主管、事件描述包含「核准成交」）

#### Scenario: 業務主管不可核准他人指定的需求單

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **AND** 該需求單 approved_by_sales_manager_id 不等於當前業務主管
- **WHEN** 業務主管嘗試於需求單詳情頁點擊「核准成交」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 業務主管 SHALL 看不到該需求單於自己的待辦清單

#### Scenario: 業務主管不直接編輯需求單內容

- **WHEN** 業務主管於需求單詳情頁查看內容
- **THEN** 系統 SHALL 提供印件規格、成本、報價、客戶資料、收款備註等欄位以唯讀方式呈現
- **AND** 系統 MUST NOT 提供業務主管編輯印件、修改報價、執行成交 / 流失的入口
- **AND** 系統 SHALL 提供業務主管「核准成交」單向動作入口；業務主管不核准時透過 Slack thread 與業務溝通（從 slackLink 進入），不於 ERP 內留 comment

#### Scenario: 業務主管收到 Slack 通知

- **WHEN** 需求單狀態變為「待業務主管成交審核」
- **THEN** 系統 SHALL 透過 Slack Webhook 通知指定業務主管
- **AND** 通知內容 SHALL 包含需求單編號、客戶、報價總額、payment_terms_note 摘要

#### Scenario: 業務主管於核可頁僅看自己負責需求單

- **GIVEN** 業務主管 A 為 5 張「待業務主管成交審核」需求單的 approved_by_sales_manager_id
- **AND** 系統內另有 3 張同狀態但 approved_by_sales_manager_id 為其他主管的需求單
- **WHEN** 業務主管 A 進入 `/sales-manager/approvals`
- **THEN** 預設清單 SHALL 顯示 5 張，MUST NOT 顯示其他 3 張
