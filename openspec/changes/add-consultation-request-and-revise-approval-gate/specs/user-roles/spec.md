## MODIFIED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 擁有需求單模組的 R/W 權限，負責**成交後出報價單前的最終審核**：與業務確認收款條件、報價單條件、交期合理後將需求單從「待業務主管成交審核」推進至「已核准成交」。業務主管 MUST NOT 直接介入需求確認、印件規格填寫、成本評估、議價對談、成交 / 流失等其他需求單流程環節。

業務主管的核准決策範圍 MUST 限於「指定的業務主管 = 自己」的需求單；MUST NOT 跨業務主管核准他人指定範圍的需求單。本 change 範疇內 MUST NOT 擴散至訂單模組、工單模組、任務模組、KPI Dashboard 或部門管理功能（後續 Phase 2 規劃）。

業務主管的審核時點與 v2.0 不同：v2.0 為「議價前核可」（已評估成本 → 議價中），現修訂為「成交後審核」（待業務主管成交審核 → 已核准成交）。理由詳見 [quote-request spec](../quote-request/spec.md) 與本 change design.md D3。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理待辦（對齊印務主管模式），含 Slack Webhook 通知對齊。

業務主管的利害關係程度 SHALL 為「高」，因「已核准成交」為訂單建立的前置必要 gate。

**資料可見範圍**：業務主管於不同頁面有不同可見範圍：
- 「需求單核准頁」（`/sales-manager/approvals`）：僅自己被指定且 `status ∈ {待業務主管成交審核, 已核准成交, 流失}`
- 「需求單列表頁」（`/`）：所有需求單（提供部門總覽能力）

詳細規則見 [quote-request spec](../quote-request/spec.md) § 業務主管成交後審核。

若同一使用者兼具業務與業務主管兩角色（如資深業務兼任業務主管），可見範圍 SHALL 取兩者聯集。

#### Scenario: 業務主管登入後看到中台介面

- **WHEN** 業務主管使用業務主管角色登入 ERP
- **THEN** 系統 SHALL 顯示中台平台介面入口
- **AND** 系統 SHALL 顯示需求單模組入口
- **AND** 系統 MUST NOT 顯示報價單 / 訂單、工單、任務模組入口

#### Scenario: 業務主管核准成交後審核

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **AND** 該需求單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 SHALL 將該核准動作寫入 QuoteRequestActivityLog（操作者 = 業務主管、事件描述包含「核准成交」）

#### Scenario: 業務主管不可核准他人指定的需求單

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **AND** 該需求單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於需求單詳情頁點擊「核准成交」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 業務主管 SHALL 看不到該需求單於自己的待辦清單

#### Scenario: 業務主管不直接編輯需求單內容

- **WHEN** 業務主管於需求單詳情頁查看內容
- **THEN** 系統 SHALL 提供印件規格、成本、報價、客戶資料、收款備註等欄位以唯讀方式呈現
- **AND** 系統 MUST NOT 提供業務主管編輯印件、修改報價、執行成交 / 流失的入口
- **AND** 系統 SHALL 提供業務主管「核准成交」單向動作入口；業務主管不核准時透過 Slack thread 與業務溝通（從 `slack_thread_url` 進入），不於 ERP 內留 comment

---

### Requirement: 諮詢角色額外職責

諮詢角色 SHALL 為公司內獨立職位（專人專責），非業務兼任。諮詢角色 SHALL 具備與業務角色完全相同的模組權限與資料可見範圍 — MUST 可檢視全公司所有需求單 / 訂單，與業務在系統內無差別。

諮詢人員 SHALL 以 `consultant_id` 身分接 ConsultationRequest，諮詢結束「轉需求單」時，新建需求單的負責業務（owner）MUST 直接設定為當前 `consultant_id`。系統內 MUST NOT 提供「諮詢人員 → 業務」的角色切換動作；同一案件從諮詢到出貨完成，諮詢人員 SHALL = 該案件的業務負責人。

諮詢角色 SHALL 額外負責：

1. **EC 客服問題處理**（既有職責）
2. **諮詢單流程**（本 change 新增）：
   - 接收 webhook 自動建立的諮詢單分派
   - 開始諮詢 / 結束諮詢動作執行
   - 諮詢結束後選擇「不做大貨（轉諮詢訂單）」或「做大貨（轉需求單）」分支
   - 諮詢取消（限「待諮詢」狀態）

#### Scenario: 諮詢角色處理 EC 客服問題

- **WHEN** 諮詢角色收到 EC 客服相關問題
- **THEN** 系統 SHALL 提供客服問題處理介面
- **AND** 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

#### Scenario: 諮詢角色執行諮詢單流程

- **GIVEN** 諮詢角色被指派為某 ConsultationRequest 的 `consultant_id`
- **WHEN** 諮詢角色開啟諮詢單詳情頁
- **THEN** 系統 SHALL 提供「開始諮詢」按鈕（狀態 = 待諮詢）
- **AND** 諮詢中提供「結束諮詢 - 不做大貨」與「結束諮詢 - 轉需求單」兩個分支按鈕
- **AND** 待諮詢狀態提供「取消諮詢」按鈕（觸發退費流程）

#### Scenario: 諮詢角色查閱諮詢單列表

- **WHEN** 諮詢角色登入並進入諮詢單列表頁
- **THEN** 系統 SHALL 預設篩選 `consultant_id = self`
- **AND** 列表 SHALL 顯示自己負責的諮詢單（含待諮詢、已轉需求單、完成諮詢、已取消）

#### Scenario: 諮詢角色查閱所有需求單與訂單

- **WHEN** 諮詢角色開啟需求單列表頁或訂單列表頁
- **THEN** 系統 SHALL 顯示全公司所有需求單 / 訂單（與業務角色相同範圍）
- **AND** 諮詢角色 MUST NOT 受限於「自己負責」的篩選

#### Scenario: 諮詢結束轉需求單時 consultant_id 自動成為需求單負責業務

- **GIVEN** ConsultationRequest 狀態 = 諮詢中、`consultant_id = U1`
- **WHEN** 諮詢人員 U1 點擊「結束諮詢 - 轉需求單」
- **THEN** 系統 SHALL 建立新 QuoteRequest
- **AND** 新需求單的負責業務（owner）MUST = U1
- **AND** 系統 MUST NOT 提供「指派其他業務」選項（owner 自動帶入諮詢人員）

#### Scenario: 諮詢角色處理 EC 客服問題

- **WHEN** 諮詢角色收到 EC 客服相關問題
- **THEN** 系統 SHALL 提供客服問題處理介面
- **AND** 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

#### Scenario: 諮詢角色執行諮詢單流程

- **GIVEN** 諮詢角色被指派為某 ConsultationRequest 的 `consultant_id`
- **WHEN** 諮詢角色開啟諮詢單詳情頁
- **THEN** 系統 SHALL 提供「開始諮詢」按鈕（狀態 = 待諮詢）
- **AND** 諮詢中提供「結束諮詢 - 不做大貨」與「結束諮詢 - 轉需求單」兩個分支按鈕
- **AND** 諮詢角色 MUST NOT 操作他人被指派的諮詢單（OQ #3 待解後可能調整）

#### Scenario: 諮詢角色查閱諮詢單列表

- **WHEN** 諮詢角色登入並進入諮詢單列表頁
- **THEN** 系統 SHALL 預設篩選 `consultant_id = self`
- **AND** 列表 SHALL 顯示自己負責的諮詢單（含待諮詢、已轉需求單、完成諮詢）
