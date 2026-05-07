## MODIFIED Requirements

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 → 待業務主管成交審核 → 已核准成交 / 流失

角色權責：業務 / 諮詢業務負責需求確認、報價、議價對談與成交 / 流失決策；印務主管負責成本評估；業務主管負責「待業務主管成交審核 → 已核准成交」的核准推進，並於核准前確認收款條件、報價單條件、交期是否合理。

「已評估成本 → 議價中」轉換 SHALL 由業務直接執行，無需業務主管核可（v2.0 議價前 gate 已取消，理由見 [quote-request spec](../quote-request/spec.md) § REMOVED Requirements「業務主管核可議價推進」）。

「議價中 → 成交」 SHALL 由業務於議價成交後觸發。

「成交 → 待業務主管成交審核」 SHALL 由業務點擊「送業務主管審核」觸發（或於成交時自動推進）。

「待業務主管成交審核 → 已核准成交」 MUST 由指定的業務主管（`approved_by_sales_manager_id`）執行，前提為 `approval_required = true`（Phase 1 預設所有需求單皆 true）。業務角色 MUST NOT 直接執行此轉換。業務主管核准動作為單向狀態轉換（無「退回至成交」按鈕）；業務主管不核准時透過 Slack thread 溝通，需求單維持「待業務主管成交審核」狀態。

「已核准成交」狀態 SHALL 為轉訂單前的最後狀態，業務於該狀態下方可執行「轉訂單」並出報價單給客人。

流失可發生在「需求確認中 / 待評估成本 / 已評估成本 / 議價中 / 待業務主管成交審核」任一非終態。「待業務主管成交審核 → 流失」為新增轉換，業務 SHALL 可於業務主管尚未核准前流失需求單（如客戶反悔）。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管；進入「待業務主管成交審核」時，系統 SHALL 透過 Slack Webhook 通知指定業務主管。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 業務直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價後成交推進至待業務主管成交審核

- **WHEN** 客戶於議價階段接受報價，業務點擊「成交」
- **THEN** 需求單狀態 SHALL 變為「待業務主管成交審核」
- **AND** 業務主管 SHALL 收到 Slack Webhook 通知
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 業務主管核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」、approved_by_sales_manager_id 等於當前業務主管、approval_required = true
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog 記錄業務主管核准動作

#### Scenario: 業務不可從待業務主管成交審核直接推進至已核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」、approval_required = true
- **WHEN** 業務（非指定業務主管）於需求單詳情頁查看狀態推進選項
- **THEN** 系統 MUST NOT 提供「核准成交」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」提示文字
- **AND** 任何 API 請求嘗試由業務直接推進至「已核准成交」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管暫不核准透過 Slack 溝通

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過需求單 slackLink 進入 Slack thread 與業務直接討論
- **AND** 需求單狀態 MUST 維持「待業務主管成交審核」直到核准

#### Scenario: 待業務主管成交審核狀態流失

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 客戶反悔、業務點擊「流失」
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行（業務主管尚未核准也允許）
- **AND** 若需求單來源為 ConsultationRequest，觸發諮詢費收尾流程

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: Phase 2 條件化跳過審核

- **GIVEN** Phase 2 已實作條件化規則
- **AND** 需求單 approval_required = false（依規則計算結果）
- **WHEN** 需求單進入「成交」狀態
- **THEN** 業務 SHALL 可直接從「成交」推進至「已核准成交」（跳過業務主管 gate）
- **AND** 此轉換 MUST 寫入 ActivityLog 標示「條件化跳過業務主管成交審核」
- **AND** Phase 1 範疇內所有需求單 approval_required 皆為 true，此 Scenario MUST NOT 觸發
