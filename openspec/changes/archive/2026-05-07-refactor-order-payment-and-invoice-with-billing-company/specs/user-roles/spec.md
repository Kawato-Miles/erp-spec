# user-roles — Delta Spec

## MODIFIED Requirements

### Requirement: 會計角色資料存取範圍

會計角色 MUST 僅能存取報價單 / 訂單模組（讀取）+ 對帳檢視（讀取與匯出），可查看範圍 SHALL 限於基本資料、付款紀錄、發票紀錄、折讓紀錄、訂單異動紀錄。會計 MUST NOT 直接執行發票開立、作廢、折讓等操作（這些動作由業務 / 諮詢執行）。會計的核心職責為**對帳**：透過訂單詳情頁的對帳檢視面板與後台批次對帳檢視，確認三方金額（應收 / 發票淨額 / 收款淨額）一致。

#### Scenario: 會計查看訂單付款紀錄

- **WHEN** 會計角色開啟報價單 / 訂單模組
- **THEN** 系統 SHALL 僅顯示訂單基本資料、付款計畫、收款紀錄、發票紀錄、折讓紀錄、訂單異動紀錄
- **AND** 系統 MUST NOT 顯示生產相關詳情（如印件規格、BOM、工單細節）

#### Scenario: 會計使用對帳檢視面板

- **WHEN** 會計於訂單詳情頁查看「對帳檢視」面板
- **THEN** 系統 SHALL 顯示應收總額、發票淨額、收款淨額、差額
- **AND** 差額 ≠ 0 時面板 SHALL 標記「待對帳」並顯示可能原因（如「未開發票 X 元」「應收 vs 收款不符 Y 元」）

#### Scenario: 會計批次查詢待對帳訂單

- **WHEN** 會計於後台「對帳檢視」頁選擇 BillingCompany + 期間 + 「僅顯示差額 ≠ 0」
- **THEN** 系統 SHALL 列出符合條件的訂單清單
- **AND** 會計 SHALL 可匯出 CSV 含 ERP 訂單編號、藍新對帳鍵、三方金額、差額

#### Scenario: 會計嘗試開立發票被擋

- **WHEN** 會計於訂單詳情頁嘗試點擊「開立發票」
- **THEN** 系統 SHALL 隱藏該按鈕（會計無此權限）
- **AND** 若會計透過 URL 直接呼叫 API，系統 MUST 回傳 403 拒絕

## ADDED Requirements

### Requirement: 業務 / 諮詢的發票操作權責

業務 / 諮詢 SHALL 負責訂單付款 / 發票全流程操作：建立 PaymentPlan、記錄 Payment、開立 Invoice、作廢 Invoice、開立 / 作廢 SalesAllowance、建立 OrderAdjustment。所有操作 MUST 留 Activity log（誰、何時、操作類型、原因），供會計事後稽核與三方對帳使用。

#### Scenario: 業務於訂單詳情頁開立發票

- **GIVEN** 業務於訂單詳情頁
- **WHEN** 業務點擊「開立發票」並填表送出
- **THEN** 系統 SHALL 允許並建立 Invoice 紀錄
- **AND** Activity log MUST 記載「[時間] [業務] 開立發票 #INV-XXX 金額 XX,XXX」

#### Scenario: 業務作廢發票全程留痕

- **WHEN** 業務作廢 Invoice
- **THEN** 系統 MUST 在 Invoice 紀錄寫入 invalid_by、invalid_at、invalid_reason
- **AND** Activity log MUST 記載作廢動作

#### Scenario: 諮詢操作權責同業務

- **WHEN** 諮詢角色於訂單詳情頁執行付款 / 發票操作
- **THEN** 系統 SHALL 允許（諮詢與業務在此操作範圍同權）

### Requirement: 業務主管審核 OrderAdjustment 權責

業務主管 SHALL 負責審核 OrderAdjustment（含核可、退回）。業務主管 MUST NOT 直接執行訂單異動（建立 / 執行由業務 / 諮詢負責）。業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看待審清單，依負責業務、adjustment_type、訂單編號篩選。

#### Scenario: 業務主管核可訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回訂單異動需填原因

- **WHEN** 業務主管點擊「退回」
- **THEN** 系統 SHALL 強制要求填入退回原因（reject_reason）才允許送出
- **AND** OrderAdjustment.status SHALL → 已退回

#### Scenario: 業務主管不可建立訂單異動

- **WHEN** 業務主管於訂單詳情頁查看
- **THEN** 系統 SHALL NOT 顯示「建立訂單異動」按鈕
- **AND** 系統 SHALL 僅顯示「審核待審異動」入口

### Requirement: 業務主管審核付款計畫變更權責

業務主管 SHALL 負責審核因 PaymentPlan 變更（新增 / 刪除 / 修改期別）導致訂單回到「業務主管審核」狀態的訂單。沿用 [archived change: add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 的核可機制。

#### Scenario: 業務主管核可 PaymentPlan 變更後訂單恢復

- **GIVEN** 訂單因 PaymentPlan 變更回到「業務主管審核」
- **WHEN** 業務主管於訂單詳情頁核可
- **THEN** 訂單狀態 SHALL 恢復至變更前的後續狀態
- **AND** Activity log MUST 記載核可動作

### Requirement: 系統管理員維護 BillingCompany 主檔

系統管理員 SHALL 負責 BillingCompany 主檔的維護（新增、停用、設定 is_default）。一般使用者（業務、諮詢、會計、業務主管）僅能讀取。

#### Scenario: 系統管理員新增帳務公司

- **WHEN** 系統管理員於後台「帳務公司管理」頁新增 BillingCompany
- **THEN** 系統 SHALL 要求填入 name、tax_id、ezpay_merchant_id、address、phone
- **AND** 系統 MUST 驗證 ezpay_merchant_id 唯一性

#### Scenario: 系統管理員設定預設帳務公司

- **WHEN** 系統管理員設定某 BillingCompany.is_default = true
- **THEN** 系統 SHALL 自動將原預設的那筆 is_default 設為 false（同時間僅一筆 is_default = true）

#### Scenario: 一般使用者僅能讀取 BillingCompany

- **WHEN** 業務 / 諮詢 / 會計 / 業務主管登入
- **THEN** 系統 SHALL NOT 顯示「帳務公司管理」入口
- **AND** 需求單 / 訂單建立時的下拉選單 SHALL 僅顯示 is_active = true 的清單供選擇
