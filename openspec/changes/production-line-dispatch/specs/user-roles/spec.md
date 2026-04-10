## MODIFIED Requirements

### Requirement: 印務角色權責

**生產任務**：
- 讀寫：所負責工單下的生產任務建立、編輯、排序（sort_order）
- 唯讀：產線（production_line_id，由 BOM 帶入不可修改）、生產任務詳情中的稿件檔案與成品縮圖（引用自印件層）

#### Scenario: 印務為生產任務調整排序

- **WHEN** 印務在工單詳情頁編輯生產任務
- **THEN** 印務 SHALL 可調整排序（sort_order）
- **AND** 排序 SHALL 限制在同一 category 內拖曳
- **AND** production_line_id SHALL 顯示為唯讀（由 BOM 帶入，印務不可修改）
