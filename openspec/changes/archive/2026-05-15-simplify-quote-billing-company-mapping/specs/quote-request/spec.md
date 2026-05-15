## MODIFIED Requirements

### Requirement: 需求單建立與編輯

系統 SHALL 支援業務手動建立需求單，記錄客戶基本資料、印件項目、報價條件，並可於議價中以前的階段編輯。需求單建立時 MUST 指定接單公司（account_company）；帳務公司（billing_company_id）由系統依接單公司硬推導，業務無需手動選擇也不可手動覆寫（見 § 帳務公司自動推導）。

#### Scenario: 業務建立新需求單

- **WHEN** 業務點擊「建立需求單」
- **THEN** 系統 SHALL 開啟需求單編輯介面，業務可填入客戶資料、印件項目、規格、報價條件、接單公司
- **AND** UI MUST NOT 顯示「帳務公司」下拉選單
- **AND** 業務選擇接單公司後，系統 MUST 自動推導 billing_company_id（依 § 帳務公司自動推導）

#### Scenario: 業務編輯既有需求單

- **WHEN** 業務在需求單詳情頁點擊「編輯」
- **THEN** 系統 SHALL 允許修改需求單內容（限「已評估成本」之前的狀態），含接單公司
- **AND** 業務若變更接單公司，系統 MUST 重新推導 billing_company_id

#### Scenario: US-QR-001 建立需求單並送印務評估

- **WHEN** 業務建立需求單，填入客戶、印件規格、接單公司、評估印務主管後送出評估
- **THEN** 系統 SHALL 將需求單狀態推進為「待評估成本」並通知指定評估印務主管
- **AND** 系統 MUST 在 Slack 發送通知，包含案名、客戶、業務、評估印務主管、接單公司、帳務公司（系統推導值）、Slack 討論串連結

#### Scenario: US-QR-009 複製既有需求單

- **WHEN** 業務複製既有需求單
- **THEN** 系統 SHALL 建立新需求單，自動帶入原需求單的客戶、印件規格、接單公司
- **AND** 系統 MUST 依新需求單的接單公司重新推導 billing_company_id（不直接複製原值，確保推導規則一致）
- **AND** 新需求單 MUST 為「需求確認中」狀態，業務可進一步編輯

---

## REMOVED Requirements

### Requirement: 帳務公司指定

**Reason**: 接單公司與帳務公司在公司實際運作中為固定對應關係（SSP/KAD → 感官股份有限公司；BRO/EC → 柏樂創意有限公司），業務不應有「選擇權」也不應有覆寫機會。原 Requirement 將兩者視為獨立欄位、業務需手動選帳務公司、並支援議價前可變更／Supervisor 解鎖等彈性機制，與實務不符。改由系統依接單公司硬推導（見新 § 帳務公司自動推導）。

**Migration**: Prototype 已於 2026-05-06 落地（`mockBillingCompanies.ts` 加入 `inferBillingCompanyByAccount`、`CreateQuotePanel` / `EditQuotePanel` 拿掉帳務公司下拉）。既有 mock 資料的 `billingCompanyId` 與 `accountCompany` 已依規則對齊；無正式運行資料，無需資料遷移。

---

### Requirement: 接單公司與帳務公司對應提示

**Reason**: 原 Requirement 設計為「業務選接單公司後 UI 顯示『該接單公司近 30 天最常用帳務公司』軟性提示」，前提是業務仍會手動選帳務公司。改為硬映射後業務無選擇權，軟性提示無作用，整個下架。系統 MAY 在需求單資訊區顯示已推導的帳務公司唯讀文字（不屬於本 Requirement 範疇）。

**Migration**: Prototype 此功能從未實作，無需移除程式碼。

---

## ADDED Requirements

### Requirement: 帳務公司自動推導

系統 SHALL 依接單公司（account_company）硬推導帳務公司（billing_company_id），業務無選擇權也不可覆寫。映射規則為：

| 接單公司 (account_company) | 帳務公司 (billing_company_id) | 法人主體 |
|---------------------------|------------------------------|---------|
| SSP（感官） | bc-ssp | 感官股份有限公司 |
| KAD（川人） | bc-ssp | 感官股份有限公司 |
| BRO（柏樂） | bc-bro | 柏樂創意有限公司 |
| EC（奕果） | bc-bro | 柏樂創意有限公司 |

需求單建立或編輯時，系統 MUST：
- 依當下選的接單公司套用上表規則寫入 `billing_company_id`
- UI MUST 將推導後的帳務公司名稱以**唯讀文字**顯示在需求單資訊區（協助業務確認）
- UI MUST NOT 提供帳務公司下拉、輸入框或任何手動修改入口

需求單成交轉訂單時，`billing_company_id` MUST 隨需求單帶入訂單；訂單建立後 `billing_company_id` 不可在訂單側手動變更（與需求單一致）。

未來新增接單公司或新增帳務公司時 MUST 同步更新本映射規則（Mockup 階段為硬編碼；正式上線時可改為 BillingCompany 主檔的 `account_company_keys` 反向查詢欄位）。

#### Scenario: 業務選接單公司後系統自動推導帳務公司

- **WHEN** 業務於需求單編輯頁選擇接單公司為 SSP 感官
- **THEN** 系統 SHALL 將 `billing_company_id` 自動寫入 `bc-ssp`
- **AND** UI MUST 顯示「帳務公司：感官股份有限公司」唯讀文字
- **AND** UI MUST NOT 顯示帳務公司下拉選單或編輯按鈕

#### Scenario: 業務變更接單公司時系統重新推導

- **GIVEN** 需求單原 account_company = SSP（billing_company_id = bc-ssp）
- **WHEN** 業務於編輯頁將 account_company 改為 BRO
- **THEN** 系統 MUST 將 `billing_company_id` 重新寫入 `bc-bro`
- **AND** UI MUST 同步更新「帳務公司：柏樂創意有限公司」顯示
- **AND** 活動紀錄 MUST 留痕「接單公司由 SSP 改為 BRO（帳務公司同步由 感官股份有限公司 → 柏樂創意有限公司）」

#### Scenario: 成交轉訂單時 billing_company_id 帶入

- **WHEN** 業務於成交需求單點擊「建立訂單」
- **THEN** 系統 SHALL 將 quote_request.billing_company_id 寫入新建立 Order.billing_company_id
- **AND** 訂單建立後 billing_company_id 不可在訂單側變更（手動或自動）
