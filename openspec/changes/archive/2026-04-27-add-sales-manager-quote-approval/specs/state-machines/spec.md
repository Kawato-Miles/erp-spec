## MODIFIED Requirements

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失

角色權責：業務/諮詢業務負責需求確認、報價、議價對談與成交 / 流失決策；印務主管負責成本評估；業務主管負責「已評估成本 → 議價中」的核可推進，並於核可前與業務確認收款條件。

「已評估成本 → 議價中」轉換 MUST 由指定的業務主管（`approved_by_sales_manager_id`）執行，前提為 `approval_required = true`（Phase 1 預設所有需求單皆 true）。業務角色 MUST NOT 直接執行此轉換。業務主管核可動作為單向狀態轉換（無「退回至待評估成本」按鈕）；若業務主管認為需重新評估，可使用「退回討論」非狀態轉換動作（寫入 ActivityLog 記錄理由），需求單仍維持「已評估成本」狀態，由業務看到後決定是否走 US-QR-006「重新評估報價」路徑。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管；進入「已評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定業務主管（兩者通知機制對稱）。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 待評估成本進入已評估成本通知業務主管

- **WHEN** 印務主管執行「評估完成」，需求單狀態變為「已評估成本」
- **THEN** 系統 SHALL 透過 Slack Webhook 通知指定業務主管
- **AND** 通知 permalink SHALL 附加至需求單 `slack_thread_url` 欄位

#### Scenario: 已評估成本進入議價中需業務主管核可

- **GIVEN** 需求單狀態為「已評估成本」
- **AND** 該需求單 `approved_by_sales_manager_id` 已於建立時指定
- **AND** `approval_required = true`
- **WHEN** 指定業務主管於需求單詳情頁點擊「核可進入議價」
- **THEN** 需求單狀態 SHALL 變更為「議價中」
- **AND** 系統 MUST 寫入 ActivityLog 記錄業務主管核可動作

#### Scenario: 業務不可直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」且 `approval_required = true`
- **WHEN** 業務（非指定業務主管）於需求單詳情頁查看狀態推進選項
- **THEN** 系統 MUST NOT 提供「進入議價」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 核可中（已等待 X 天）」提示文字
- **AND** 任何 API 請求嘗試由業務直接推進至「議價中」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管暫不核可時透過 Slack 與業務溝通

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務主管於需求單詳情頁查看內容後選擇暫不核可
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過需求單 `slackLink` 進入 Slack thread 與業務直接討論
- **AND** 需求單狀態 MUST 維持「已評估成本」直到核可

#### Scenario: 議價後成交

- **WHEN** 客戶於議價階段接受報價
- **THEN** 需求單狀態 SHALL 變為「成交」
- **AND** 系統 SHALL 允許後續建立訂單
- **AND** 此轉換 SHALL 由業務角色執行（非業務主管）

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行（非業務主管）

#### Scenario: 重新評估後再次需業務主管核可

- **GIVEN** 需求單原處於「議價中」狀態，業務執行「重新評估報價」
- **AND** 需求單回到「待評估成本」狀態，印務主管重新評估後再次進入「已評估成本」
- **WHEN** 系統檢視「已評估成本 → 議價中」推進條件
- **THEN** 業務主管 MUST 重新核可才能進入「議價中」
- **AND** 業務 MUST NOT 因此前曾在議價中而獲得跳過核可的權限
- **AND** 若 `payment_terms_note` 與上次業務主管核可時相同，UI SHALL 提供業務主管「一鍵確認（條件未變）」捷徑（見 quote-request spec § 業務主管核可議價推進 Scenario「重新評估後快速 confirm」）

#### Scenario: Phase 2 條件化跳過核可

- **GIVEN** Phase 2 已實作條件化規則
- **AND** 需求單 `approval_required = false`（依規則計算結果）
- **WHEN** 需求單進入「已評估成本」狀態
- **THEN** 業務 SHALL 可直接從「已評估成本」推進至「議價中」（跳過業務主管 gate）
- **AND** 此轉換 MUST 寫入 ActivityLog 標示「條件化跳過業務主管核可」
- **AND** Phase 1 範疇內所有需求單 `approval_required` 皆為 true，此 Scenario MUST NOT 觸發
