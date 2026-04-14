## ADDED Requirements

### Requirement: 設備預計成本彙總

系統 SHALL 在工單詳情頁顯示「設備預計成本」Section，彙總該工單下所有生產任務的設備預計成本。成本資料來源為各生產任務的 estimated_equipment_cost（定義於[生產任務 spec](../../../specs/production-task/spec.md) § 設備預計成本計算），不在工單層額外儲存。

Section 內容 SHALL 包含：
- 表格：每筆生產任務的工序名稱、設備名稱、顏色選項摘要、預計成本
- 僅列出 estimated_equipment_cost > 0 的生產任務
- 底部顯示合計金額
- 設備未指定的生產任務顯示「待排程」，不計入合計

#### Scenario: 印務查看工單設備成本彙總

- **WHEN** 印務在工單詳情頁查看「設備預計成本」Section
- **THEN** 系統 SHALL 列出每筆有成本的生產任務：工序名稱、設備名稱、顏色選項摘要、預計成本
- **AND** 底部 SHALL 顯示所有生產任務的預計成本合計

#### Scenario: 部分生產任務尚未排程

- **WHEN** 工單下有 3 筆生產任務，其中 1 筆尚未指定設備
- **THEN** 已指定設備的 2 筆 SHALL 顯示預計成本
- **AND** 未指定設備的 1 筆 SHALL 顯示「待排程」
- **AND** 合計金額僅包含已計算的 2 筆

#### Scenario: 所有生產任務皆無顏色選項

- **WHEN** 工單下所有生產任務均未勾選任何顏色選項
- **THEN** 「設備預計成本」Section SHALL 顯示「尚無成本資料」
