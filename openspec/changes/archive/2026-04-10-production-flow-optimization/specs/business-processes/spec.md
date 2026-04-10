## MODIFIED Requirements

### Requirement: 需求單轉訂單欄位帶入規則

需求單轉為訂單時，系統 SHALL 依以下規則處理欄位帶入：

- 自動帶入（唯讀）：客戶基本資料、印件規格
- 自動帶入（可編輯）：交期與備註、付款資訊、訂金設定、案名（需求單 title → 訂單 case_name）
- 自動帶入（原值）：各印件項目的預計產線（QuoteRequestItem.expected_production_lines → PrintItem.expected_production_lines）
- 不帶入：報價紀錄、活動紀錄

#### Scenario: 需求單轉訂單時客戶資料帶入

- **WHEN** 使用者將需求單轉為訂單
- **THEN** 系統 SHALL 自動帶入客戶基本資料與印件規格，且這些欄位為唯讀狀態

#### Scenario: 需求單轉訂單時交期可編輯

- **WHEN** 使用者將需求單轉為訂單
- **THEN** 系統 SHALL 自動帶入交期與備註、付款資訊、訂金設定，且這些欄位允許使用者編輯

#### Scenario: 需求單轉訂單時案名帶入

- **WHEN** 使用者將需求單轉為訂單
- **THEN** 系統 SHALL 將需求單的 title 帶入訂單的 case_name 欄位
- **AND** case_name SHALL 允許業務編輯

#### Scenario: 需求單轉訂單時預計產線帶入

- **WHEN** 使用者將需求單轉為訂單
- **THEN** 系統 SHALL 將各印件項目的預計產線帶入對應 PrintItem 的 expected_production_lines
- **AND** 帶入後印件的預計產線 SHALL 可繼續編輯

#### Scenario: 需求單轉訂單時報價紀錄不帶入

- **WHEN** 使用者將需求單轉為訂單
- **THEN** 系統 SHALL 不帶入報價紀錄與活動紀錄至訂單
