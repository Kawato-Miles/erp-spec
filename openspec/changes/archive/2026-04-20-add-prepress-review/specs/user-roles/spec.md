## MODIFIED Requirements

### Requirement: 審稿主管與審稿角色階段限制

審稿主管與審稿角色 SHALL 僅在審稿階段參與流程。

**審稿主管**負責：
- 維護審稿人員的能力設定（`max_difficulty_level`，1-10 整數）
- 檢視審稿人員負擔分布（每人進行中審稿數、完成數、待審數）
- 覆寫系統自動分配（例外處理，如原審稿人員離職 / 請假）
- 監管審稿 KPI（平均審稿時長、不合格率、工作量分布）

審稿主管 SHALL **不**介入審稿合格 / 不合格的核可決策，核可決策由審稿人員單層放行。

**審稿**負責：
- 接收系統自動分配的待審印件
- 檢視印件需求規格與原稿
- 加工印件檔（系統外處理）並重新上傳印件檔與縮圖
- 自行判定合格或不合格（不合格時填寫原因），直接送審放行
- 補件後的再次審稿

#### Scenario: 審稿主管維護能力設定

- **WHEN** 審稿主管於工作台調整審稿人員 A 的 `max_difficulty_level`
- **THEN** 系統 SHALL 記錄變更時間、操作者、舊值、新值
- **AND** 變更 SHALL 僅影響後續自動分配，進行中印件不受影響

#### Scenario: 審稿主管覆寫自動分配

- **GIVEN** 印件 `difficulty_level = 5` 已自動分配給審稿人員 A
- **WHEN** 審稿主管決定改指派給審稿人員 B
- **AND** B 的 `max_difficulty_level ≥ 5`
- **THEN** 系統 SHALL 完成轉指派並記錄 ActivityLog

#### Scenario: 審稿人員自行放行合格

- **WHEN** 審稿人員上傳加工檔與縮圖並判定合格
- **THEN** 印件審稿維度狀態 SHALL 直接轉為「合格」
- **AND** 系統 SHALL **不**要求審稿主管複核

#### Scenario: 審稿人員送出不合格並選取原因分類

- **WHEN** 審稿人員判定不合格並送審
- **THEN** 系統 SHALL 要求自 `reject_reason_category` LOV 選單選取退件原因分類（必選）
- **AND** 選填 `review_note` 補充備註
- **AND** 未選 reject_reason_category 時不可送審（對齊 quote-request spec § 需求單流失歸因的 LOV 設計模式）
