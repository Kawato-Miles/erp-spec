## MODIFIED Requirements

### Requirement: 工單草稿建立

系統 SHALL 支援兩種工單草稿建立方式：(1) 線上單由審稿通過後系統依 BOM 自動建立，帶入生產任務；(2) 線下單由印務主管手動建立。工單號格式：W-[YYYYMMDD]-[NN]。

BOM 展開建立生產任務時，系統 SHALL 從 BOM 行項目帶入 production_line_id 至每筆生產任務。外包廠 / 中國廠商的行項目 SHALL 自動帶入「外包」產線。

#### Scenario: 線上單自動建立工單草稿

- **WHEN** 印件審稿通過
- **THEN** 系統自動建立工單草稿，依 BOM 帶入生產任務
- **AND** 每筆生產任務的 production_line_id SHALL 從 BOM 行項目自動帶入
- **AND** factory_type 為「外包廠」的行項目，production_line_id SHALL 自動設為「外包廠」產線
- **AND** factory_type 為「中國廠商」的行項目，production_line_id SHALL 自動設為「中國廠商」產線

#### Scenario: 線下單手動建立工單草稿

- **WHEN** 印務主管手動建立工單草稿並依 BOM 建立生產任務
- **THEN** 印務可設定製程、材料規格，並建立/編輯生產任務（手動或依 BOM 自動）
- **AND** 依 BOM 自動建立時，production_line_id SHALL 從 BOM 行項目帶入
- **AND** 手動建立時，印務 SHALL 從 BOM 行項目參考產線設定，系統自動帶入 production_line_id
