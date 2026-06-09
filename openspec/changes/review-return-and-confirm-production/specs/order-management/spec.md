## ADDED Requirements

### Requirement: 訂單印件待改稿警示標記

當訂單處於製作段（製作等待中 / 工單已交付 / 製作中），但有印件審稿維度狀態為「合格」（待業務確認）或「待改稿」（待客戶重傳稿件）時，訂單列表 SHALL 顯示警示標記，讓業務不需點進訂單即可知道有印件需要處理。

**Priority**: P1

**Rationale**: 訂單不因單一印件退回而退回審稿段（維持段落不可逆），但業務需要有管道知道哪些訂單有印件待處理，避免遺漏。

#### Scenario: 訂單列表顯示待改稿警示

- **GIVEN** 訂單處於「製作中」，有 1 個印件狀態為「待改稿」
- **WHEN** 業務檢視訂單列表
- **THEN** 該訂單列 SHALL 顯示警示標記（例如「1 件待改稿」）

#### Scenario: 訂單列表顯示待確認警示

- **GIVEN** 訂單處於「製作中」，有 2 個印件狀態為「合格」（待業務確認可製作）
- **WHEN** 業務檢視訂單列表
- **THEN** 該訂單列 SHALL 顯示警示標記（例如「2 件待確認」）

#### Scenario: 所有印件已確認可製作時無警示

- **GIVEN** 訂單處於製作段，所有印件審稿維度狀態皆為「已確認可製作」
- **WHEN** 業務檢視訂單列表
- **THEN** 該訂單列 SHALL 不顯示警示標記

## MODIFIED Requirements

### Requirement: 訂單審稿段 Bubble-up 派生

訂單狀態位於審稿段（稿件未上傳 / 等待審稿 / 待補件）時，Order.status SHALL 由其下所有印件的 `reviewDimensionStatus` 派生，依以下優先序（5 條規則）：

1. 若存在任一印件 `reviewDimensionStatus = '不合格'` → Order.status = **待補件**
2. 否則，若所有印件 `reviewDimensionStatus = '已確認可製作'` → Order.status = **製作等待中**（進入製作段）
3. 否則，若存在任一印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'` 或 `'待改稿'` → Order.status = **等待審稿**
4. 否則，若所有印件 `reviewDimensionStatus ∈ {'合格', '已確認可製作'}` → Order.status = **等待審稿**（有印件合格但尚未確認可製作，球在業務）
5. 否則（全部「稿件未上傳」；或「合格」/「已確認可製作」+「稿件未上傳」混合）→ Order.status = **稿件未上傳**

**規則 2 變更說明**：原規則為「所有印件合格 → 製作等待中」，現改為「所有印件已確認可製作 → 製作等待中」。B2C 訂單因合格後自動跳到已確認可製作，行為不變；B2B 訂單需等業務逐件確認。

**規則 4 新增說明**：處理「部分印件已確認可製作、部分印件合格但未確認」的場景。訂單停留在審稿段等待業務確認。

**製作段不退回審稿段**：訂單一旦進入製作段（所有印件皆已確認可製作且已建工單），即使後續有印件被退回重審（待改稿），訂單 SHALL 維持在製作段（製作中），不退回審稿段。搭配警示標記讓業務知道有印件待處理。

**觸發時機**：任何會改動印件 `reviewDimensionStatus` 的 action SHALL 於完成後觸發此派生邏輯：
- 印件送審完成（合格 / 不合格）
- 補件完成（不合格 → 已補件）
- 首次稿件上傳（稿件未上傳 → 等待審稿）
- 業務確認可製作（合格 → 已確認可製作）
- 業務退回重審（合格 → 待改稿）
- 待改稿印件客戶上傳新稿（待改稿 → 等待審稿）

**邊界**：
- 免審稿快速路徑：B2C 印件免審後直接進「合格」再自動跳「已確認可製作」，若所有印件皆如此則 Order 直達「製作等待中」
- 訂單離開審稿段後此派生邏輯 MUST NOT 重新套用（不可逆段落原則）
- 製作段期間有印件被退回重審（待改稿）：訂單維持製作段，啟用警示標記
- QC 不合格 MUST NOT 冒升至 Order 層

**Priority**: P0

**Rationale**: Bubble-up 派生是訂單狀態自動推進的核心邏輯，需配合「已確認可製作」新終態調整觸發條件。

#### Scenario: 送審不合格觸發 bubble-up

- **WHEN** 審稿人員送出審核結果為「不合格」，印件 `reviewDimensionStatus` 變為「不合格」
- **AND** 訂單位於審稿段
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 變為「待補件」

#### Scenario: 補件完成觸發 bubble-up

- **WHEN** 業務或會員完成補件，印件 `reviewDimensionStatus` 由「不合格」變為「已補件」
- **AND** 訂單下已無其他「不合格」印件
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 由「待補件」變為「等待審稿」

#### Scenario: 最後一件確認可製作觸發離開審稿段

- **WHEN** 業務確認最後一件印件可製作，訂單下所有印件皆為「已確認可製作」
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 變為「製作等待中」（離開審稿段）

#### Scenario: 部分印件合格未確認不離開審稿段

- **GIVEN** 訂單有 3 個印件：2 個已確認可製作、1 個合格（未確認）
- **WHEN** 系統派生 Order.status
- **THEN** Order.status SHALL 為「等待審稿」（球在業務，等確認第 3 件）

#### Scenario: 製作段期間印件退回重審不退回審稿段

- **GIVEN** 訂單處於「製作中」，所有印件皆已確認可製作且已建工單
- **WHEN** 業務將其中一件印件退回重審（合格 → 待改稿）
- **THEN** Order.status SHALL 維持「製作中」（不退回審稿段）
- **AND** 訂單列表 SHALL 顯示警示標記（「1 件待改稿」）

#### Scenario: 免審稿路徑不觸發 bubble-up

- **WHEN** 訂單回簽 / 付款後自動分配，所有印件經免審稿快速路徑直接進入「合格」再自動跳「已確認可製作」
- **THEN** Order.status SHALL 直接進入「製作等待中」
- **AND** 訂單 MUST NOT 經過「稿件未上傳」、「等待審稿」、「待補件」

#### Scenario: 混合免審稿與需審稿未上傳印件不誤派為等待審稿

- **WHEN** 訂單混合印件：部分為免審稿（reviewDimensionStatus = '已確認可製作'）+ 部分為需審稿但尚未上傳稿件（reviewDimensionStatus = '稿件未上傳'）
- **THEN** Order.status SHALL 派生為「稿件未上傳」（規則 5）
- **AND** Order.status MUST NOT 派生為「等待審稿」

#### Scenario: QC 不合格不冒升至 Order 層

- **WHEN** 某生產任務的 QC 結果為「不合格」
- **THEN** Order.status MUST NOT 變為任何「不合格」相關狀態

### Requirement: 訂單詳情頁印件操作入口

當訂單中的印件審稿維度狀態為「不合格」且訂單來源為 B2B 時，訂單詳情頁 SHALL 於該筆印件列表旁提供「補件」入口。業務 SHALL 可點選該入口上傳新的印件檔案，作為客戶端補件的代理操作。

當印件審稿維度狀態為「合格」時，訂單詳情頁 SHALL 於該筆印件列表旁提供「確認可製作」與「退回重審」兩個操作入口（僅 B2B 訂單顯示；B2C 訂單合格後自動確認，不顯示）。

業務 SHALL 僅能檢視到訂單層級，不可直接操作工單或生產任務。

**本 change 保留**：補件入口 SHALL 顯示**歷史輪次 `review_note` 清單**，讓業務於補件前可參照審稿意見並轉達客戶。

**Priority**: P0

**Rationale**: 訂單詳情頁是業務操作印件的唯一入口，需新增確認可製作與退回重審的操作按鈕。

#### Scenario: 不合格印件顯示補件入口

- **GIVEN** B2B 訂單中的印件 X 審稿維度狀態為「不合格」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 於印件 X 列顯示「補件」按鈕

#### Scenario: 合格印件顯示確認可製作與退回重審入口（B2B）

- **GIVEN** B2B 訂單中的印件 X 審稿維度狀態為「合格」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 於印件 X 列顯示「確認可製作」按鈕
- **AND** 系統 SHALL 於印件 X 列顯示「退回重審」按鈕

#### Scenario: 合格印件不顯示操作按鈕（B2C）

- **GIVEN** B2C 訂單中的印件 X 審稿維度狀態為「合格」（B2C 合格後自動跳已確認可製作，此狀態為瞬態）
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 不顯示「確認可製作」或「退回重審」按鈕

#### Scenario: 已確認可製作印件不顯示退回重審入口

- **GIVEN** 印件審稿維度狀態為「已確認可製作」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 不於該印件列顯示「退回重審」按鈕

#### Scenario: 業務點選退回重審彈出退回原因填寫框

- **WHEN** 業務點選印件的「退回重審」按鈕
- **THEN** 系統 SHALL 彈出退回原因填寫對話框
- **AND** 退回原因 SHALL 為必填欄位
- **AND** 業務填寫原因並確認後，印件狀態 SHALL 轉為「待改稿」

#### Scenario: 待改稿印件顯示補件入口

- **GIVEN** B2B 訂單中的印件 X 審稿維度狀態為「待改稿」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 於印件 X 列顯示「補件」按鈕（與不合格印件的補件入口行為一致）

#### Scenario: 補件入口顯示歷史審稿備註清單

- **WHEN** 業務點選印件 X 的「補件」入口
- **THEN** 系統 SHALL 於上傳元件同頁顯示**歷史輪次 `review_note` 清單**（最新在上）
- **AND** 清單 SHALL 含每輪 round_no、result、reject_reason_category、review_note 與時間

## REMOVED Requirements

（無）
