## MODIFIED Requirements

### Requirement: 印務角色權限

印務角色 SHALL 具備以下權限：

**工單管理**：
- 讀寫：工單內容填寫、生產任務建立與編輯、製程送審、異動發起
- 唯讀：其他印務負責的工單（僅在跨印務印件場景下，透過印件總覽查看進度）

**印件總覽**：
- 讀取：可查看印件總覽，並使用「只顯示我參與的印件」篩選
- 判斷邏輯：印件下有任何 WorkOrder.assigned_to 等於當前印務
- 跨印務印件：可查看同印件下其他印務負責的工單進度，但 MUST NOT 編輯

**生產任務**：
- 讀寫：所負責工單下的生產任務建立、編輯、排序（sort_order）、產線指定
- 唯讀：生產任務詳情中的稿件檔案與成品縮圖（引用自印件層）

#### Scenario: 印務查看參與的印件

- **WHEN** 印務在印件總覽使用「只顯示我參與的印件」篩選
- **THEN** 系統 SHALL 僅顯示印件下有 WorkOrder.assigned_to 等於當前印務的印件
- **AND** 印務 SHALL 可查看同印件下其他工單的進度但 MUST NOT 編輯

#### Scenario: 印務為生產任務指定產線與排序

- **WHEN** 印務在工單詳情頁編輯生產任務
- **THEN** 印務 SHALL 可選擇產線（production_line_id）與調整排序（sort_order）
- **AND** 排序 SHALL 限制在同一 category 內拖曳
