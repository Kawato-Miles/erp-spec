# quote-request — Delta Spec

## ADDED Requirements

### Requirement: 帳務公司指定

需求單 SHALL 於建立時要求業務指定帳務公司（billing_company_id），對應公司開立發票的法人主體（藍新 MerchantID_ 的設定來源）。帳務公司與既有「接單公司（account_company）」為**獨立欄位**：接單公司代表業務 / 品牌歸屬（如 SSP 感官 / BRO 柏樂 / KAD 川人 / EC 奕果），帳務公司代表發票主體。需求單成交轉訂單時，billing_company_id MUST 隨需求單帶入訂單。

#### Scenario: 業務建立需求單時必填帳務公司

- **WHEN** 業務建立新需求單
- **THEN** 系統 SHALL 顯示帳務公司下拉選單（從 BillingCompany 中 is_active = true 的清單）
- **AND** 系統 MUST 預設帶入 is_default = true 的帳務公司
- **AND** 業務未指定帳務公司時，系統 SHALL 拒絕送出需求單並提示

#### Scenario: 帳務公司於議價階段前可變更

- **WHEN** 需求單狀態為「需求確認中」「待評估成本」「已評估成本」
- **THEN** 業務 SHALL 可於需求單編輯頁變更帳務公司
- **AND** 變更時系統 MUST 在活動紀錄留痕

#### Scenario: 議價中或成交後不可變更帳務公司

- **GIVEN** 需求單狀態為「議價中」「成交」「流失」
- **WHEN** 業務嘗試變更帳務公司
- **THEN** 系統 SHALL 拒絕變更並提示「議價階段後不可變更帳務公司，需先回退至已評估成本」
- **AND** 系統 SHALL 提供 Supervisor 解鎖機制（與既有評估印務主管 / 審核業務主管 lifecycle 一致）

#### Scenario: 成交轉訂單時 billing_company_id 帶入

- **WHEN** 業務於成交需求單點擊「建立訂單」
- **THEN** 系統 SHALL 將 quote_request.billing_company_id 寫入新建立 Order.billing_company_id
- **AND** 訂單建立後 billing_company_id 不可在訂單側變更（與需求單一致）

### Requirement: 接單公司與帳務公司對應提示

系統 SHALL 在業務選擇接單公司（account_company）時，於 UI 顯示「該接單公司常用的帳務公司」提示（軟性引導，不強制）。實際對應關係由業務維護，由系統觀察記錄但不寫死映射。

#### Scenario: 業務選接單公司後系統提示常用帳務公司

- **WHEN** 業務於需求單編輯頁選擇 account_company（如 SSP 感官）
- **THEN** 系統 SHALL 在 billing_company 欄位下方提示「該接單公司近 30 天最常用：[BillingCompany 名稱]」
- **AND** 系統 SHALL NOT 自動覆寫業務當下選的帳務公司

## MODIFIED Requirements

### Requirement: 需求單建立與編輯
系統 SHALL 支援業務手動建立需求單，記錄客戶基本資料、印件項目、報價條件，並可於議價中以前的階段編輯。需求單建立時 MUST 同時指定接單公司（account_company）與帳務公司（billing_company_id）。

#### Scenario: 業務建立新需求單
- **WHEN** 業務點擊「建立需求單」
- **THEN** 系統 SHALL 開啟需求單編輯介面，業務可填入客戶資料、印件項目、規格、報價條件、接單公司與帳務公司
- **AND** 系統 MUST 驗證帳務公司必填（依 § 帳務公司指定）

#### Scenario: 業務編輯既有需求單
- **WHEN** 業務在需求單詳情頁點擊「編輯」
- **THEN** 系統 SHALL 允許修改需求單內容（限「已評估成本」之前的狀態），含接單公司與帳務公司

#### Scenario: US-QR-001 建立需求單並送印務評估
- **WHEN** 業務建立需求單，填入客戶、印件規格、接單公司、帳務公司、評估印務主管後送出評估
- **THEN** 系統 SHALL 將需求單狀態推進為「待評估成本」並通知指定評估印務主管
- **AND** 系統 MUST 在 Slack 發送通知，包含案名、客戶、業務、評估印務主管、接單公司、帳務公司、Slack 討論串連結

#### Scenario: US-QR-009 複製既有需求單
- **WHEN** 業務複製既有需求單
- **THEN** 系統 SHALL 建立新需求單，自動帶入原需求單的客戶、印件規格、接單公司與帳務公司
- **AND** 新需求單 MUST 為「需求確認中」狀態，業務可進一步編輯

## ADDED Data Model

### QuoteRequest 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 帳務公司 | billing_company_id | FK | Y | | FK -> BillingCompany；發票主體；需求單建立時必填，成交後不可變更 |

接單公司（account_company）欄位維持既有設計，與帳務公司並存，業務分別填寫。
