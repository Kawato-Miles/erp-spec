## MODIFIED Requirements

### Requirement: 生產任務 Data Model -- 工作包相關欄位

ProductionTask 資料表 SHALL 新增以下欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 所屬工作包 | work_package_id | FK / null | | FK -> WorkPackage；派工後必填，未派工時為 null |
| 確樣需求 | sample_notes | 文字 / null | | 建立工作包時由生管填寫，說明該任務需特別注意的事項 |

所有已派工的生產任務 MUST 歸屬於某工作包（work_package_id NOT NULL）。不存在「有 assigned_operator 但無 work_package_id」的生產任務。

#### Scenario: 派工後欄位一致性
- **WHEN** 生管透過建立工作包完成派工
- **THEN** 該生產任務的 work_package_id、assigned_operator MUST 同時有值

#### Scenario: 移出工作包後欄位清除
- **WHEN** 生產任務從工作包移出
- **THEN** work_package_id、assigned_operator、sample_notes、actual_start_date MUST 全部清除為 null

### Requirement: 生管接收與分派

生管查看已交付任務清單，透過任務分派介面的「建立工作包」操作完成派工。原有的批次派工操作由建立工作包取代。

生管 SHALL 在任務分派介面上依工序分組查看所有待處理生產任務，勾選同工序任務後建立工作包（含指派師傅、備註、各任務確樣需求）。建立工作包後，任務狀態維持「待處理」不變，由工作包卡片呈現於進行中區。

#### Scenario: 生管透過工作包完成派工
- **WHEN** 生管在任務分派介面勾選 3 筆待處理任務並建立工作包
- **THEN** 3 筆任務歸入工作包，assigned_operator 設為選定師傅，狀態維持「待處理」

#### Scenario: 生管查看各任務進度
- **WHEN** 生管已完成當日派工
- **THEN** 進行中區以工作包卡片顯示，每張卡片標示進度摘要（如 2/3 製作中）
