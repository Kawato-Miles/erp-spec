## MODIFIED Requirements

### Requirement: 生產任務 Data Model -- 工作包相關欄位

ProductionTask 資料表 SHALL 新增以下欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 所屬工作包 | work_package_id | FK / null | | FK -> WorkPackage；派工後必填，未派工時為 null |

確樣需求（sample_notes）為工作包層級欄位，不在 ProductionTask 上。

所有已派工的生產任務 MUST 歸屬於某工作包（work_package_id NOT NULL）。不存在「有 assigned_operator 但無 work_package_id」的生產任務。

#### Scenario: 派工後欄位一致性
- **WHEN** 生管透過建立工作包完成派工
- **THEN** 該生產任務的 work_package_id、assigned_operator MUST 同時有值

#### Scenario: 移出工作包後欄位清除
- **WHEN** 生產任務從工作包移出
- **THEN** work_package_id、assigned_operator、actual_start_date MUST 全部清除為 null

### Requirement: 生管接收與分派

生管查看已交付任務清單，透過日程面板的「建立工作包」操作完成派工。原有的批次派工操作由建立工作包取代。

生管 SHALL 在日程面板上依分組查看所有待處理生產任務，勾選任務後建立工作包（含指派師傅、備註、確樣需求）。建立工作包後，任務狀態維持「待處理」不變。

已派工的生產任務在生產任務列表中以工作包為單位呈現（ErpExpandableRow 兩層展開），不再以單筆平鋪顯示。

#### Scenario: 生管透過工作包完成派工
- **WHEN** 生管在日程面板勾選 3 筆待處理任務並建立工作包
- **THEN** 3 筆任務歸入工作包，assigned_operator 設為選定師傅，狀態維持「待處理」

#### Scenario: 生管查看各任務進度
- **WHEN** 生管進入生產任務列表
- **THEN** 以工作包為父列（Key、師傅、備註、確樣需求、任務數、進度），展開後顯示包內生產任務明細

### Requirement: 師傅查看工作包

師傅在「我的任務」頁面 SHALL 以工作包為單位查看分派的生產任務，呈現方式與生產任務列表一致（ErpExpandableRow 兩層展開）。

#### Scenario: 師傅查看工作包任務
- **WHEN** 師傅進入「我的任務」頁面
- **THEN** 以工作包為父列，展開後顯示包內生產任務，可逐筆或批次報工
