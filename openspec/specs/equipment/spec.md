# equipment Specification

## Purpose
TBD - created by archiving change scheduling-center. Update Purpose after archive.
## Requirements
### Requirement: 設備主檔管理

系統 SHALL 提供設備主檔，維護工廠內所有設備的基本資料。設備主檔為排程中心設備佇列的資料來源。

每筆設備 MUST 包含：設備名稱、工序類型（對應可執行的工序）、啟用狀態、每日可用時數。

#### Scenario: 系統管理員新增設備

- **WHEN** 系統管理員在設備管理頁面新增設備，填入名稱「海德堡四色機」、工序類型「印刷」
- **THEN** 系統 SHALL 建立設備記錄，狀態預設為「啟用」，每日可用時數預設為 8 小時
- **AND** 該設備 SHALL 出現在排程中心的設備佇列區

#### Scenario: 系統管理員停用設備

- **WHEN** 系統管理員將某設備狀態改為「停用」
- **THEN** 排程中心 MUST NOT 顯示該設備的佇列
- **AND** 已排入該設備佇列的生產任務 SHALL 自動移回待排區
- **AND** 系統 SHALL 提示印務有 N 筆任務需重新排程

#### Scenario: 設備名稱不可重複

- **WHEN** 系統管理員嘗試新增與現有設備同名的設備
- **THEN** 系統 SHALL 阻擋並提示「設備名稱已存在」

