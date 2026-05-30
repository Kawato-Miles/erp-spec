## MODIFIED Requirements

### Requirement: 諮詢人員認領

諮詢人員 SHALL 於 ConsultationRequest 建立後（`status = 待諮詢` 且 `consultant_id` 為空）自行認領，將自身 user_id 寫入 `consultant_id`。認領完成後狀態 SHALL 維持「待諮詢」，僅標示已分派。

**設計理由**：諮詢量規模小、不需 round-robin 自動派工兜底；諮詢人員依專長與當前負載自主決策更符合既有日常運作；沿用既有分流（不引入指派層級的角色）。若未來發生「冷門案件無人認領」現象，將另開 change 補兜底機制（暫不過度設計）。

**併發認領衝突處理**：同一諮詢單同時被兩位諮詢人員嘗試認領時，系統 SHALL 以資料庫層級 atomic update（如 `UPDATE ... WHERE consultant_id IS NULL`）保證僅一人成功；後續嘗試者 SHALL 收到「已被認領」提示。

**權限範圍**：
- 認領動作 SHALL 限定角色為「諮詢人員」（或具諮詢權限的業務 — 沿用既有「業務代理諮詢」彈性，由 [諮詢角色 R&R](../../../memory/erp/ERP_Vault/03-roles/諮詢.md) 定義）
- **業務主管** SHALL 可代為認領（指定某諮詢人員為 `consultant_id`）— 不視為「他派」而視為「業務主管代為操作的特殊認領」，活動紀錄需標示操作者與被指派者。本 change 後業務主管統一負責業務 / 諮詢部門督導（業務主管 = 諮詢主管同一人），不另開「諮詢主管」獨立角色

**認領 vs 改派的區分**：「業務主管代為認領」（`consultant_id` 為**空**時的首次指定）與「改派負責人」（`consultant_id` **已有值**時的覆寫，見 § Requirement: 諮詢單負責人改派）為兩種不同途徑，UI 與活動紀錄事件型別 SHALL 區分。`consultant_id` 為空 → 顯示「認領 / 代為認領」；`consultant_id` 已有值 → 顯示「改派負責人」（限業務主管）；兩入口互斥。

#### Scenario: 諮詢人員於諮詢單清單自行認領

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且 `consultant_id` 為空
- **WHEN** 諮詢人員於諮詢單清單頁點擊某張未認領諮詢單的「認領」按鈕
- **THEN** 系統 SHALL 將該諮詢人員 user_id 寫入 `consultant_id`
- **AND** ConsultationRequest 狀態 MUST 維持「待諮詢」（不轉「諮詢中」過渡狀態，依 spec v2 簡化）
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「諮詢人員認領」、actor = 諮詢人員 user_id、timestamp）
- **AND** 系統 SHALL 發送 Slack 通知給該諮詢人員（確認認領）

#### Scenario: 併發認領衝突僅一人成功

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、`consultant_id` 為空
- **WHEN** 諮詢人員 A 與諮詢人員 B 於同一時點點擊「認領」按鈕
- **THEN** 系統 SHALL 透過資料庫 atomic update 保證僅一人成功寫入 `consultant_id`
- **AND** 後成功者 SHALL 收到「該諮詢單已被認領」提示
- **AND** 失敗者的清單 SHALL 即時刷新顯示為「已被認領」狀態

#### Scenario: 已認領的諮詢單於清單區隔顯示

- **GIVEN** 諮詢人員 A 已認領某張諮詢單
- **WHEN** 諮詢人員 A 或 B 進入諮詢單清單頁
- **THEN** 清單 SHALL 區隔顯示「我負責的諮詢」與「其他諮詢員負責」與「未認領」三組
- **AND** 諮詢人員 A 的「我負責的諮詢」區 SHALL 顯示該張諮詢單
- **AND** 諮詢人員 B 的「其他諮詢員負責」區 SHALL 顯示該張諮詢單（唯讀查閱，不可操作）

#### Scenario: 業務主管代為認領

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、`consultant_id` 為空
- **WHEN** 業務主管於諮詢單詳情頁選擇某諮詢人員指定為 `consultant_id`
- **THEN** 系統 SHALL 寫入該諮詢人員 user_id 至 `consultant_id`
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「業務主管代為認領」、actor = 業務主管 user_id、assigned_to = 諮詢人員 user_id、timestamp）
- **AND** 系統 SHALL 發送 Slack 通知給被指派的諮詢人員（與自我認領通知格式區別「業務主管代為認領」措辭）

## ADDED Requirements

### Requirement: 諮詢單負責人改派

業務主管 SHALL 可於諮詢單詳情頁改派負責諮詢人員（`consultant_id`），即「重新指定認領人」，覆寫已有值。改派為改 owner 的管理動作。改派的通用規則（理由分類五值必填、五要素留痕、候選人以 Role 模組權限篩選、全公司範圍、改派不改狀態）沿用 [user-roles § 業務主管改派負責業務職責](../user-roles/spec.md)。

**與認領的區分**：本改派針對 `consultant_id` **已有值**（已認領）的諮詢單；`consultant_id` 為空時應走「認領 / 代為認領」（見 § Requirement: 諮詢人員認領），不走改派。

**允許改派狀態**：諮詢單 `status = 待諮詢`（含已認領）SHALL 可改派、且 MUST NOT 回退狀態（僅換人，維持「待諮詢」）。完成諮詢 / 已取消為終態，禁改派。

#### Scenario: 業務主管改派已認領諮詢單

- **GIVEN** 諮詢單 `status = 待諮詢`、`consultant_id` 已有值（A 已認領）
- **WHEN** 業務主管點「改派負責人」、選新諮詢人員 B（候選 = 具諮詢權限的使用者）、必選理由分類、確認
- **THEN** 系統 SHALL 將 `consultant_id` 覆寫為 B
- **AND** SHALL 寫入活動紀錄五要素（原 / 新負責人、改派時間、理由分類與補述、操作主管；事件型別 = 「改派負責人」，與「認領」「代為認領」區分）
- **AND** 諮詢單狀態 MUST 維持「待諮詢」（不回退、不推進）

#### Scenario: 未認領諮詢單不走改派

- **GIVEN** 諮詢單 `status = 待諮詢`、`consultant_id` 為空
- **WHEN** 業務主管開啟該諮詢單詳情頁
- **THEN** SHALL 顯示「代為認領」入口、MUST NOT 顯示「改派負責人」入口（兩者互斥）

#### Scenario: 完成 / 取消諮詢單禁止改派

- **GIVEN** 諮詢單 `status ∈ {完成諮詢, 已取消}`
- **WHEN** 業務主管開啟該諮詢單詳情頁
- **THEN** 「改派負責人」入口 SHALL disabled
