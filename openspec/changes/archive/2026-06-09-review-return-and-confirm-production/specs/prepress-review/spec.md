## ADDED Requirements

### Requirement: 業務確認可製作操作

業務 / 諮詢角色 SHALL 可對審稿維度狀態為「合格」的 B2B 印件執行「確認可製作」操作，將印件推進至「已確認可製作」終態並觸發工單建立流程。

B2C 訂單印件合格後，系統 SHALL 自動執行此操作（不需人工介入）。

**Priority**: P0

**Rationale**: 在審稿品質通過與生產投入之間新增業務決策閘門，讓業務確認客戶不會再改稿後才投產，避免改稿導致已投產工時浪費。

#### Scenario: B2B 業務手動確認可製作

- **GIVEN** B2B 訂單印件審稿維度狀態為「合格」
- **WHEN** 業務於訂單詳情頁點擊「確認可製作」
- **THEN** 印件審稿維度狀態 SHALL 轉為「已確認可製作」
- **AND** 系統 SHALL 建立空工單草稿（沿用既有 B2B 工單建立邏輯）
- **AND** 印件 ActivityLog SHALL 記錄「確認可製作」事件（actor、timestamp）

#### Scenario: B2C 系統自動確認可製作

- **GIVEN** B2C 訂單印件審稿維度狀態變為「合格」
- **WHEN** 系統完成合格狀態寫入
- **THEN** 系統 SHALL 立即自動推進至「已確認可製作」
- **AND** 系統 SHALL 自動建立工單並帶入生產任務（沿用既有 B2C 工單建立邏輯）
- **AND** 印件 ActivityLog SHALL 記錄「確認可製作（系統自動）」事件

### Requirement: 業務退回重審操作

業務 / 諮詢角色 SHALL 可對審稿維度狀態為「合格」的印件執行「退回重審」操作，將印件狀態轉為「待改稿」。退回原因 MUST 為必填。

退回後，重審 SHALL 預設指派給原審稿人員（該印件最近一輪合格 ReviewRound 的 `reviewer_id`）。若原審稿人員不在崗，該印件 SHALL 出現在審稿主管覆寫待辦清單中。

「退回重審」僅適用於「合格」狀態，「已確認可製作」後 MUST NOT 可退回。

**Priority**: P0

**Rationale**: 線下單客戶合格後改稿是常態，開放退回重審取代棄用 + clone，降低操作成本、維持印件唯一性。

#### Scenario: 業務退回重審並填寫原因

- **GIVEN** 印件審稿維度狀態為「合格」
- **WHEN** 業務點擊「退回重審」並填寫退回原因（例如「客戶要求更換 Logo」）
- **THEN** 印件審稿維度狀態 SHALL 轉為「待改稿」
- **AND** 印件 ActivityLog SHALL 記錄「退回重審」事件（actor、return_reason、timestamp）
- **AND** 系統 SHALL 通知客戶需重新上傳稿件

#### Scenario: 退回後重審預設指派原審稿人員

- **GIVEN** 印件最近一輪合格 ReviewRound 的 `reviewer_id = A`
- **AND** A 的可用狀態為「在崗」
- **WHEN** 待改稿印件客戶上傳新稿，狀態轉為「等待審稿」
- **THEN** 系統 SHALL 將此印件加入 A 的待審列表
- **AND** 系統 SHALL 不重新執行自動分配演算法
- **AND** 待審清單 SHALL 標示此印件為「重審」（與一般新件區分）

#### Scenario: 原審稿人員不在崗時走主管覆寫

- **GIVEN** 原審稿人員 A 當前可用狀態為「不在崗」
- **WHEN** 待改稿印件客戶上傳新稿，狀態轉為「等待審稿」
- **THEN** 系統 SHALL 於審稿主管的覆寫待辦清單中標示此印件
- **AND** 主管 SHALL 執行覆寫分配操作才能讓印件進入新審稿人員的待審列表

#### Scenario: 審稿人員看到退回原因

- **GIVEN** 印件從「合格」被退回重審，退回原因為「客戶要求更換 Logo」
- **WHEN** 審稿人員打開該印件的審稿頁面
- **THEN** 系統 SHALL 顯示退回原因（「客戶要求更換 Logo」）
- **AND** 審稿流程與一般審稿相同（合格 / 不合格判定）

## MODIFIED Requirements

### Requirement: 審稿人員審稿作業

審稿人員在其工作台中 SHALL 可執行下列動作：
- 檢視待審印件列表（我被分配的印件），待審清單 SHALL 區分一般新件與「重審」件（退回重審後重新進入的印件標示「重審」）
- 進入印件詳情頁檢視原稿（由補件方提供的 `file_role=印件檔`）、**稿件備註** `PrintItem.client_note`、印件需求規格、歷史輪次
- 對於重審件，SHALL 可查看業務填寫的退回原因
- 下載原稿進行加工（系統外處理）
- 上傳**審稿後檔案**與**縮圖**（單次送審合格時至少各一份）
- 標記送審結果為「合格」或「不合格」
- **合格 / 不合格皆可填寫 `review_note`**（不合格時仍須從 LOV 選 `reject_reason_category`，review_note 為補充說明；合格時 `review_note` 為留言給後續角色的備註）
- **送出後 `review_note` 允許修改**（供糾正打錯字 / 補充內容），每次修改觸發印件 ActivityLog「審稿備註修改」事件

**關鍵約束**：審稿人員**不可替換** `file_role=印件檔` 的原始檔。審稿人員合格時上傳的是 `file_role=審稿後檔案`，作為加工版本，與原印件檔並存。

送審動作 SHALL 觸發 ReviewRound 建立與印件狀態轉移。

**Priority**: P0

**Rationale**: 審稿人員需能區分一般新件與重審件，並查看退回原因以提高重審效率。

#### Scenario: 送審合格

- **WHEN** 審稿人員上傳**審稿後檔案**與**縮圖**，選擇「合格」、**可選擇性填寫 `review_note`**，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 合格）
- **AND** 上傳的檔案綁定此 round_id
- **AND** 系統 SHALL 將 PrintItem.current_round_id 指向此 Round
- **AND** 印件審稿維度狀態 SHALL 轉為「合格」
- **AND** B2C 訂單：系統自動推進至「已確認可製作」並觸發工單建立
- **AND** B2B 訂單：維持「合格」等待業務手動確認可製作

#### Scenario: 送審不合格

- **WHEN** 審稿人員選擇「不合格」、自 reject_reason_category LOV 選單選取原因、選填 review_note 補充備註，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 不合格）
- **AND** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方

#### Scenario: 不合格未選 reject_reason_category 被拒

- **WHEN** 審稿人員選擇「不合格」但未自 LOV 選單選取 reject_reason_category
- **THEN** 系統 SHALL 拒絕送審並提示「退件原因分類」為必選

#### Scenario: 詳情頁顯示稿件備註

- **WHEN** 審稿人員進入印件詳情頁
- **THEN** 系統 SHALL 於詳情頁顯眼處呈現 `PrintItem.client_note`
- **AND** 若 client_note 為空 SHALL 顯示「無稿件備註」佔位

#### Scenario: 重審件顯示退回原因

- **GIVEN** 印件為重審件（從「合格」被業務退回重審後重新進入待審）
- **WHEN** 審稿人員進入該印件詳情頁
- **THEN** 系統 SHALL 顯示業務填寫的退回原因
- **AND** 待審清單 SHALL 標示此印件為「重審」

### Requirement: 印件審稿狀態與 Round 同步

印件層 `reviewDimensionStatus` 7 狀態（稿件未上傳 / 等待審稿 / 不合格 / 已補件 / 合格 / 已確認可製作 / 待改稿）SHALL 由 action 在 Round 變動或業務操作時同步更新（denormalized 快取）。

**同步規則**：

| Round 變動或業務操作 | `reviewDimensionStatus` 變化 |
|-----------|----------------------------|
| 建 Round 1 待審（首次上傳稿件）| 稿件未上傳 → 等待審稿 |
| 當前 Round.result = '合格' | 等待審稿 / 已補件 → 合格 |
| 當前 Round.result = '不合格' | 等待審稿 / 已補件 → 不合格 |
| 建 Round N+1 待審（補件完成）| 不合格 → 已補件 |
| 建 Round 1（source=免審稿, result=合格）| 稿件未上傳 → 合格 |
| 業務確認可製作 | 合格 → 已確認可製作 |
| B2C 系統自動確認可製作 | 合格 → 已確認可製作 |
| 業務退回重審 | 合格 → 待改稿 |
| 待改稿印件客戶上傳新稿 | 待改稿 → 等待審稿 |

**一致性要求**：所有改變 Round 或業務操作的 action 必須同時更新 `reviewDimensionStatus`，確保 UI 層讀取時與最新狀態對齊。

**Priority**: P0

**Rationale**: 狀態同步是 UI 渲染與 Bubble-up 派生的基礎，新增 2 個狀態需完整納入同步規則。

#### Scenario: 印件狀態欄位與 Round 結構對齊（一致性驗證）

- **WHEN** 任一情境結束後查詢印件 `reviewDimensionStatus`
- **THEN** 其值 SHALL 對應於「基於當前 Round[] 與業務操作派生的預期狀態」

## REMOVED Requirements

（無）
