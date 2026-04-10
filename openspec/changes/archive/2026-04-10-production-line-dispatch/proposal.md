## Why

多位生管各自負責不同產線，但日程面板為共用模組，目前無法依產線隔離顯示任務。加上 ProductionTask.production_line_id 為選填，導致部分任務無產線歸屬，篩選器形同虛設。需從 BOM 源頭確保產線指定，讓生管日程面板的產線篩選器真正可用。

## What Changes

- BOM 行項目新增 `production_line_id`（必填），在材料 / 工序 / 裝訂維護時即指定產線
- 生產任務建立時從 BOM 自動帶入 `production_line_id`，帶入後唯讀不可改
- ProductionTask.production_line_id 從選填改為必填（系統帶入，非人工填寫）
- 外包廠的 BOM 行項目歸入「外包廠」產線，中國廠商歸入「中國廠商」產線
- 日程面板產線篩選器新增「記住上次選擇」功能（使用者偏好持久化）
- 生管與產線不做系統綁定（不加 manager_id），無權限隔離

## Capabilities

### New Capabilities

（無新增獨立能力，所有變更為既有能力的修改）

### Modified Capabilities

- `production-task`：production_line_id 從選填改為必填（BOM 帶入、唯讀）；日程面板篩選器新增偏好記憶
- `work-order`：工單建立生產任務時，從 BOM 行項目帶入 production_line_id
- `user-roles`：印務角色移除產線指定權限（production_line_id 改為唯讀）

## Impact

- **BOM 管理**：行項目資料結構新增 production_line_id 欄位（必填）
- **生產任務建立邏輯**：從 BOM 展開時自動帶入產線，不再允許手動指定或留空
- **日程面板 UI**：篩選器需支援偏好持久化（localStorage 或使用者設定）
- **資料遷移**：既有生產任務若 production_line_id 為空，需回填策略（上線前一次性處理）
- **排程中心**：不受影響（排程中心操作的是設備佇列，產線為唯讀顯示資訊）
