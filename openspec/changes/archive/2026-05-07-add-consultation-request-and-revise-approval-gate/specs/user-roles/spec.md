## ADDED Requirements

### Requirement: 諮詢角色職責

諮詢角色 SHALL 為公司內獨立職位（專人專責），非業務兼任。諮詢角色 SHALL 具備與業務角色完全相同的模組權限與資料可見範圍 — MUST 可檢視全公司所有需求單 / 訂單，與業務在系統內無差別。

諮詢人員 SHALL 以 `consultant_id` 身分接 ConsultationRequest，諮詢結束「轉需求單」時，新建需求單的負責業務（owner）MUST 直接設定為當前 `consultant_id`。系統內 MUST NOT 提供「諮詢人員 → 業務」的角色切換動作；同一案件從諮詢到出貨完成，諮詢人員 SHALL = 該案件的業務負責人。

諮詢角色 SHALL 額外負責：

1. **EC 客服問題處理**（既有職責）
2. **諮詢單流程**（本 change 新增）：
   - 接收 webhook 自動建立的諮詢單分派
   - 諮詢結束「完成諮詢（不做大貨）」或「轉需求單（做大貨）」分支動作
   - 諮詢取消（限「待諮詢」狀態）

#### Scenario: 諮詢角色處理 EC 客服問題

- **WHEN** 諮詢角色收到 EC 客服相關問題
- **THEN** 系統 SHALL 提供客服問題處理介面
- **AND** 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

#### Scenario: 諮詢角色執行諮詢單流程

- **GIVEN** 諮詢角色被指派為某 ConsultationRequest 的 `consultant_id`
- **WHEN** 諮詢角色開啟諮詢單詳情頁
- **THEN** 系統 SHALL 提供「完成諮詢（不做大貨）」與「轉需求單（做大貨）」兩個分支按鈕（狀態 = 待諮詢）
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

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id = U1`
- **WHEN** 諮詢人員 U1 點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立新 QuoteRequest
- **AND** 新需求單的負責業務（owner）MUST = U1
- **AND** 系統 MUST NOT 提供「指派其他業務」選項（owner 自動帶入諮詢人員）
