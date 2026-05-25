## MODIFIED Requirements

### Requirement: 印件狀態機（雙維度）

印件（Print Item）SHALL 以雙維度管理狀態：

**審稿維度**：
```
稿件未上傳 → 等待審稿 → 合格
                │
                └─► 不合格 ◄─► 已補件 ─► 合格
                        ▲            │
                        └── 再審 NG ──┘
```

**印製維度**：`等待中 → 工單已交付 → 部分工單製作中 → 製作中 → 製作完成 → 出貨中 → 已送達`

審稿維度允許的轉移：
- `稿件未上傳 → 等待審稿`：稿件首次上傳
- `等待審稿 → 合格`：審稿人員首審通過
- `等待審稿 → 不合格`：審稿人員首審判定內容不符
- `不合格 → 已補件`：客戶（B2C）或業務（B2B）完成補件
- `已補件 → 合格`：審稿人員重審通過
- `已補件 → 不合格`：審稿人員重審仍判定不合格

**審稿維度合格為終態**：審稿維度的「合格」狀態無任何出向轉移。若印件合格後需變更內容（客戶改稿、印務拼版時發現原稿錯誤、打樣後業務判定 `sampleResult = NG-稿件問題` 等），SHALL 透過「棄用原印件 + 建立新印件」處理：原印件 `printItemStatus` 轉「已棄用」+ 系統 clone 新印件並設定 `derived_from_print_item_id` 結構化追溯（實作機制見 [prepress-review spec § 印件追溯欄位 + § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。本 change 的補件 loop 僅適用於審稿階段（尚未合格）的稿件內容修正。

**與印製維度回退路徑無衝突**：本 spec § 印件打樣特殊流程 的「打樣 NG-製程問題 後回退至等待中」屬於**印製維度**，不影響審稿維度狀態。打樣 NG-製程問題（`sampleResult = NG-製程問題`）時，印件審稿維度維持「合格」不動，僅印製維度於同打樣印件下建新打樣 WorkOrder（業務情境見 [business-processes spec § 打樣流程規則](../business-processes/spec.md)）。

印製維度狀態僅在審稿維度為「合格」後開始推進，既有行為不變。

**已棄用狀態觸發場景**：印製維度的「已棄用」（既有 `PrintItemStatus` enum 值）目前唯一自動觸發場景為「打樣判定 NG-稿件問題」（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。已棄用印件 MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單；雙維度狀態保留原值作為棄用前稽核軌跡，印件詳情頁仍可訪問。

#### Scenario: 印件審稿合格後允許建立工單

- **WHEN** 印件的審稿狀態變為「合格」
- **THEN** 系統 SHALL 允許為該印件建立工單
- **AND** 印製狀態 SHALL 維持「等待中」直到工單交付

#### Scenario: 部分工單開始製作

- **WHEN** 印件對應的多個工單中，部分工單進入「製作中」
- **THEN** 印件印製狀態 SHALL 變為「部分工單製作中」

#### Scenario: 所有工單皆製作中

- **WHEN** 印件對應的所有工單皆進入「製作中」
- **THEN** 印件印製狀態 SHALL 變為「製作中」

#### Scenario: 首審不合格

- **WHEN** 印件審稿維度狀態為「等待審稿」
- **AND** 審稿人員送出審核並標為「不合格」
- **THEN** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方（B2C 客戶 / B2B 業務）

#### Scenario: 補件完成後轉已補件

- **WHEN** 印件審稿維度狀態為「不合格」
- **AND** 客戶（B2C）或業務（B2B）完成補件上傳
- **THEN** 印件審稿維度狀態 SHALL 轉為「已補件」
- **AND** 該印件 SHALL 重新出現在原審稿人員的待審列表

#### Scenario: 補件重審通過

- **WHEN** 印件審稿維度狀態為「已補件」
- **AND** 原審稿人員送出審核並標為「合格」
- **THEN** 印件審稿維度狀態 SHALL 轉為「合格」
- **AND** 觸發下游自動建工單流程（沿用既有規則）

#### Scenario: 補件重審仍不合格

- **WHEN** 印件審稿維度狀態為「已補件」
- **AND** 原審稿人員送出審核並標為「不合格」
- **THEN** 印件審稿維度狀態 SHALL 轉回「不合格」
- **AND** 系統 SHALL 再次通知補件方

#### Scenario: 已棄用印件雙維度狀態保留作為稽核軌跡

- **GIVEN** 印件 X `printItemStatus = 已棄用`（因 NG-稿件問題觸發棄用）
- **WHEN** 系統檢查印件 X 的雙維度狀態
- **THEN** 雙維度狀態值保留原值（如審稿維度「合格」、印製維度棄用前的狀態），作為棄用前稽核軌跡
- **AND** 印件 X MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單
- **AND** 印件 X 仍可於印件詳情頁直接訪問（稽核用途）

---

### Requirement: 印件打樣特殊流程

打樣印件對應的打樣 WorkOrder（`WorkOrder.type = 打樣`）推進至「已完成」後，業務（owner of 訂單）SHALL 於該打樣 WorkOrder 詳情頁判定 `sampleResult`（見 [prepress-review spec § 打樣結果業務判定](../prepress-review/spec.md)）。判定結果 SHALL 觸發不同的後續流程（依 enum 分支處理見以下 Scenarios）。系統 MUST 依業務判定結果自動觸發對應的下游動作（NG-稿件問題 → 自動棄用 + clone 新印件；OK / NG-製程問題 → 系統不自動觸發，保留業務決定權）。

#### Scenario: 打樣判定 OK 後開放大貨

- **WHEN** 業務判定 `sampleResult = OK`
- **THEN** 打樣印件繼續走後續流程（不變現有狀態機）
- **AND** 系統 MUST NOT 自動建大貨工單（業務後續手動建）
- **AND** 業務 SHALL 後續手動建大貨工單 / 進入大貨生產流程

#### Scenario: 打樣判定 NG-製程問題後印製維度回退

- **WHEN** 業務判定 `sampleResult = NG-製程問題`（製程問題，稿件本身無問題）
- **THEN** 該打樣印件審稿維度狀態維持「合格」不動（稿件本身無問題）
- **AND** 系統 MUST NOT 自動建新打樣 WorkOrder（業務 UI 自行建，保留業務決定權）
- **AND** 業務 SHALL 於同打樣印件下手動建立新打樣 WorkOrder 重新打樣
- **AND** ng_process 下游自動化處理機制細節待 OQ AR-13 解後實作

#### Scenario: 打樣判定 NG-稿件問題後棄用 + 建新打樣印件

- **WHEN** 業務判定 `sampleResult = NG-稿件問題`（稿件問題）
- **THEN** 系統 SHALL 自動觸發 atomic transaction：
  - 原打樣印件 `printItemStatus` 轉「已棄用」+ notes 加註棄用說明
  - 系統 clone 原打樣印件至新打樣印件（保留印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度與印製維度）
  - 新打樣印件 `derived_from_print_item_id` 指向原打樣印件（結構化追溯）
  - 新打樣印件 `sampleResult = 待確認` / `printItemStatus = 待生產` / `reviewStatus = 稿件未上傳`
  - 訂單 `printItemCount + 1`
  - 訂單層 ActivityLog 寫入「NG-稿件問題：棄用 [原印件號]，建立新印件 [新印件號]」
- **AND** 流程細節詳見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)
