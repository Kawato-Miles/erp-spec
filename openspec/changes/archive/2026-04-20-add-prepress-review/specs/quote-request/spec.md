## ADDED Requirements

### Requirement: 印件難易度欄位

需求單中每一筆印件 SHALL 具備 `difficulty_level` 欄位，值域為 1 至 10 之整數，由業務於需求單建立或編輯時填寫。此欄位為**必填**，未填寫時需求單不可送出至下一階段。

`difficulty_level` 作為後續訂單建立時的自動分配依據，並於轉訂單時繼承至訂單印件。

#### Scenario: 業務填寫印件難易度

- **WHEN** 業務於需求單編輯頁建立或修改印件
- **THEN** 系統 SHALL 顯示 `difficulty_level` 輸入欄位（範圍 1-10）
- **AND** 欄位旁 SHALL 標示為必填

#### Scenario: 未填難易度無法送出需求單

- **GIVEN** 需求單中存在至少一筆印件 `difficulty_level` 為空
- **WHEN** 業務嘗試送出需求單至評估 / 報價階段
- **THEN** 系統 SHALL 拒絕並明確指出哪筆印件未填

#### Scenario: 難易度範圍驗證

- **WHEN** 業務於印件難易度欄位輸入 0、11 或非整數
- **THEN** 系統 SHALL 拒絕輸入並顯示範圍提示
