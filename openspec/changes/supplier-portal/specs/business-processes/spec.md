## NEW Requirements

### Requirement: 供應商報價審核流程

系統 SHALL 提供供應商報價的提交與審核流程：

流程：供應商報價 → 生管審核 → 確認 / 退回

#### Scenario: 報價流程正常路徑

- **WHEN** 生管將生產任務分派給外包廠
- **THEN** 該生產任務的 quote_status SHALL 為「待報價」
- **AND** 供應商在供應商平台查看後提交報價，quote_status 變為「已報價」
- **AND** 生管在日程面板審核後確認，quote_status 變為「已確認」

#### Scenario: 報價流程退回路徑

- **WHEN** 生管審核報價後認為不合理
- **THEN** 生管退回並填寫退回原因，quote_status SHALL 變為「已退回」
- **AND** 供應商收到退回通知後重新報價，quote_status 變為「已報價」

#### Scenario: 報價與生產可並行

- **WHEN** 供應商尚未報價但生產任務已可開工
- **THEN** 系統 SHALL 允許供應商先開始生產（報工）再補報價
- **AND** 報價流程與生產狀態機 MUST 獨立運作，互不阻擋
