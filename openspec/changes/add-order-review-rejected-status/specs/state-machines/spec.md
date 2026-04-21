## MODIFIED Requirements

### Requirement: 訂單狀態機

訂單（Order）SHALL 依以下狀態流轉，分為線下與線上兩條前段路徑，匯入共用後段：

線下路徑：報價待回簽 → 已回簽
線上路徑（含一般訂單與客製單）：等待付款 → 已付款（由 EC 付款完成自動觸發）

共用段：稿件未上傳 → 等待審稿 ↔ 待補件 → 製作等待中 → 工單已交付 → 製作中 → 製作完成 → 出貨中 → 訂單完成

**審稿段子狀態說明**：
- 「等待審稿」與「待補件」互為審稿段內的平行子狀態
- 「待補件」：存在任一印件 `reviewDimensionStatus = '不合格'`（業務需補件）
- 「等待審稿」：無印件不合格，但尚未全部合格（含印件處於「等待審稿」或「已補件」），且至少一件已送審過
- 子狀態間 SHALL 允許雙向互換（補件完成從「待補件」回到「等待審稿」）
- QC 不合格 MUST NOT 冒升至 Order 層；訂單本身永遠沒有「QC 不合格」狀態

免審稿快速路徑：當訂單下所有印件的 review_status 皆為「合格」（含免審稿設定）時，訂單 SHALL 從「已付款」或「已回簽」直接進入「製作等待中」，跳過「稿件未上傳」、「等待審稿」、「待補件」。

#### Scenario: 線下訂單回簽後進入共用段

WHEN 線下訂單的報價已回簽
THEN 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 線上訂單付款後進入共用段

WHEN 線上訂單（含客製單）已完成付款（EC 自動觸發）
THEN 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 訂單狀態推進至製作完成

WHEN 訂單下所有印件的印製狀態皆為「製作完成」
THEN 訂單狀態 SHALL 推進為「製作完成」

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

#### Scenario: 混合免審稿與未送審印件時訂單維持稿件未上傳

- **WHEN** 訂單混合印件：部分為免審稿（`reviewDimensionStatus = '合格'`）+ 部分為需審稿（`reviewDimensionStatus = '稿件未上傳'`）
- **AND** 尚未有任何印件送審過
- **THEN** 訂單狀態 SHALL 維持「稿件未上傳」（不誤派為「等待審稿」）
- **AND** 直到首件送審後 bubble-up 才依送審結果派生

#### Scenario: 打樣 NG 棄用後透過新訂單 + 免審稿印件承接

- **WHEN** 原訂單於製作段發生打樣 NG，業務決定棄用原印件並追加新印件
- **THEN** 業務 SHALL 開立新訂單承接新印件
- **AND** 新印件 SHALL 設定為免審稿（重用原審稿基礎）
- **AND** 新訂單 SHALL 走免審稿快速路徑直達「製作等待中」
- **AND** 原訂單狀態 MUST NOT 受此操作影響（保持既有製作段狀態）

### Requirement: 訂單狀態不可逆

訂單段落（付款段 → 審稿段 → 製作段 → 出貨段）間 MUST NOT 回退。

審稿段內子狀態（等待審稿 ↔ 待補件）SHALL 允許雙向互換。其他段落內子狀態維持單向推進。

#### Scenario: 訂單已進入製作中不可回退

WHEN 訂單狀態為「製作中」
THEN 系統 MUST NOT 允許將訂單狀態回退為「製作等待中」或更早狀態

#### Scenario: 審稿段內允許待補件與等待審稿互換

- **WHEN** 訂單狀態為「待補件」且不合格印件補件完成、無其他不合格印件
- **THEN** 系統 SHALL 允許訂單狀態回到「等待審稿」
- **AND** 此互換 MUST NOT 視為狀態回退

#### Scenario: 審稿段不可回退至付款段

- **WHEN** 訂單狀態位於審稿段（稿件未上傳 / 等待審稿 / 待補件）
- **THEN** 系統 MUST NOT 允許將訂單狀態回退至「已付款」、「已回簽」或更早狀態

## ADDED Requirements

### Requirement: 訂單審稿段 Bubble-up 派生

訂單狀態位於審稿段（稿件未上傳 / 等待審稿 / 待補件）時，Order.status SHALL 由其下所有印件的 `reviewDimensionStatus` 派生，依以下優先序：

1. 若存在任一印件 `reviewDimensionStatus = '不合格'` → Order.status = **待補件**
2. 否則，若所有印件 `reviewDimensionStatus = '合格'` → Order.status = **製作等待中**（進入製作段）
3. 否則，若所有印件 `reviewDimensionStatus = '稿件未上傳'` → Order.status = **稿件未上傳**
4. 否則（存在「等待審稿」或「已補件」印件，無「不合格」）**且至少一件已送審過**（`reviewRounds.length ≥ 1`） → Order.status = **等待審稿**
5. 否則（混合情境但尚未送審任何一件，例如免審稿合格 + 需審稿未上傳） → Order.status = **稿件未上傳**

**觸發時機**：任何會改動印件 `reviewDimensionStatus` 的 action SHALL 於完成後觸發此派生邏輯：
- 印件送審完成（合格 / 不合格）
- 補件完成（不合格 → 已補件）
- 首次稿件上傳（稿件未上傳 → 等待審稿）

**邊界**：
- 免審稿快速路徑不走此派生（印件直接進入「合格」終態，Order 直達「製作等待中」）
- 訂單離開審稿段後此派生邏輯 MUST NOT 重新套用（不可逆段落原則）
- 原訂單於製作段後追加印件的需求走新訂單 + 免審稿模式承接，本派生不處理此情境

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

#### Scenario: 最後一件合格觸發離開審稿段

- **WHEN** 審稿人員送出最後一件印件的審核結果為「合格」，且訂單下所有印件皆為「合格」
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 變為「製作等待中」（離開審稿段）

#### Scenario: 免審稿路徑不觸發 bubble-up

- **WHEN** 訂單回簽 / 付款後自動分配，所有印件經免審稿快速路徑直接進入「合格」
- **THEN** Order.status SHALL 直接進入「製作等待中」
- **AND** 訂單 MUST NOT 經過「稿件未上傳」、「等待審稿」、「待補件」

#### Scenario: 混合免審稿與需審稿未送審印件不誤派為等待審稿

- **WHEN** 訂單混合印件：部分為免審稿（reviewDimensionStatus = '合格'）+ 部分為需審稿（reviewDimensionStatus = '稿件未上傳'）
- **AND** 尚未有任何印件送審過（所有印件 reviewRounds.length = 0）
- **THEN** Order.status SHALL 派生為「稿件未上傳」
- **AND** Order.status MUST NOT 派生為「等待審稿」

#### Scenario: QC 不合格不冒升至 Order 層

- **WHEN** 某生產任務的 QC 結果為「不合格」
- **THEN** Order.status MUST NOT 變為任何「不合格」相關狀態
- **AND** Order 層永遠沒有「QC 不合格」狀態
