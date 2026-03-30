## MODIFIED Requirements

### Requirement: 開工日期設定與完工推算

系統 SHALL 支援印務手動設定開工日期（scheduled_date），系統依 estimated_duration_days 自動推算 planned_end_date。派工時間單位為天。生產任務新增 stage_order 欄位用於階段管理，estimated_duration_days 欄位供印務填寫預估工期。

#### Scenario: 印務設定開工日期
- **WHEN** 印務設定生產任務的開工日期為 2026-04-01，預估工期 3 天
- **THEN** 系統自動推算完工日期為 2026-04-04（planned_end_date = scheduled_date + estimated_duration_days）

#### Scenario: 自動排程覆寫開工日期
- **WHEN** 印務點擊「自動排程」
- **THEN** 系統依交貨日回推結果覆寫各任務的 scheduled_date 與 planned_end_date

#### Scenario: 階段序號預設值
- **WHEN** 生產任務建立時未指定 stage_order
- **THEN** 系統預設 stage_order = 1
