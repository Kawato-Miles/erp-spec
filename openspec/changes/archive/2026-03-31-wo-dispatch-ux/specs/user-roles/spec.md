## MODIFIED Requirements

### Requirement: 生管角色編輯限制

生管角色 SHALL 僅擁有任務模組的 R/W 權限，且可編輯範圍 MUST 限於以下欄位：
- 師傅指派（assigned_operator）
- 實際設備（actual_equipment）
- 報工相關欄位（報工數量、報工工時、缺陷數量、備註）
- 提前分派標記（is_early_dispatched）
- 異動確認操作

生管 MUST NOT 修改生產任務的製程參數、規格、目標數量、計畫設備（planned_equipment）或排程日期（scheduled_date）等規劃層欄位。

#### Scenario: 生管更新任務進度

- **WHEN** 生管角色開啟任務詳情頁面
- **THEN** 系統 SHALL 允許編輯：assigned_operator、actual_equipment、報工欄位、is_early_dispatched
- **AND** MUST NOT 允許修改：製程參數、規格、目標數量、planned_equipment、scheduled_date

#### Scenario: 生管安排工作任務

- **WHEN** 生管角色在日程執行面板進行分派操作
- **THEN** 系統 SHALL 允許指派師傅、覆蓋設備、提前分派、批次報工
- **AND** 系統 SHALL 提供任務排程介面供生管調整執行順序
