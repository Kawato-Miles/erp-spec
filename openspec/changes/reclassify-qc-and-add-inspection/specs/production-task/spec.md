## ADDED Requirements

### Requirement: ProductionTask type 與 scope 分類

ProductionTask SHALL 透過 `type` 與 `scope` 兩個列舉欄位區分業務行為層級。

- `type` 列舉值：`production`（製作工序）、`qc`（出貨前印件入庫檢查）、`inspection`（工序中間品檢，選擇性）
- `scope` 列舉值：`work_order_task`（工序層）、`print_item`（印件層）

對應規則：

| type | scope | 強制性 |
|------|-------|--------|
| `production` | `work_order_task` | 印務規劃時建立 |
| `qc` | `print_item` | 系統自動建立（每印件強制 1 個）|
| `inspection` | `work_order_task` | 印務規劃時對特定 production PT 加入（選擇性）|

建立 ProductionTask 時，系統 MUST 依 type 自動帶入對應 scope，使用者 MUST NOT 手動覆寫。既有 C1 前無 type 欄位的 ProductionTask MUST 由系統補帶為 `type = production`、`scope = work_order_task`。

#### Scenario: 建立 production 任務帶入預設 scope

- **WHEN** 印務在工單規劃時建立 production 任務
- **THEN** 系統 SHALL 將 type 設為 `production`、scope 設為 `work_order_task`

#### Scenario: 系統自動建立 QC 任務帶入預設 scope

- **WHEN** 工單規劃完成後系統為每個 PrintItem 自動建立 QC 任務
- **THEN** 系統 SHALL 將 type 設為 `qc`、scope 設為 `print_item`

#### Scenario: 印務加入品檢任務帶入預設 scope

- **WHEN** 印務在工單規劃時對某 production PT 加入品檢任務
- **THEN** 系統 SHALL 將品檢任務的 type 設為 `inspection`、scope 設為 `work_order_task`
- **AND** 系統 SHALL 將對應 production PT 的 `requires_inspection` 設為 TRUE

#### Scenario: type 與 scope 對應驗證

- **WHEN** 任何來源嘗試建立 type 與 scope 不符對應規則的 ProductionTask
- **THEN** 系統 SHALL 阻擋建立並提示「type 與 scope 對應不合法」

---

### Requirement: ProductionTask 規劃期屬性

ProductionTask SHALL 於工單規劃時由印務設定下列屬性：

| 欄位 | 適用 type | 說明 |
|------|----------|------|
| `requires_inspection` | production | 是否需要對應品檢 PT（影響齊套公式分子使用 inspection 通過數或 produced_qty）|
| `require_transfer` | production | 是否需要轉交（影響系統在報工後是否自動建 TransferTicket）|
| `previous_production_task_ids` | 全部 | 前置 PT 清單（AND 邏輯，所有前置完成才能由生管派工）|

預設策略：印務在規劃時為每個 PT 設定排序（1, 2, 3...），系統依排序自動帶線性相依（`PT-N.previous = [PT-(N-1)]`）；印務僅在並行匯流情境手動修改。

#### Scenario: 印務設定 production PT 屬性

- **WHEN** 印務在工單規劃時建立 production PT 並設定 `requires_inspection = TRUE`、`require_transfer = TRUE`、排序 = 3
- **THEN** 系統 SHALL 寫入該 PT 的 `requires_inspection`、`require_transfer`、排序資訊
- **AND** 系統 SHALL 依排序自動帶 `previous_production_task_ids = [PT-2 的 QC / inspection 完成事件]`

#### Scenario: 印務手動調整並行相依性

- **WHEN** 印務在工單規劃時將某裝訂 PT 的 `previous_production_task_ids` 設為 `[封面 PT 的 QC 完成, 內頁 PT 的 QC 完成]`
- **THEN** 系統 SHALL 寫入該手動設定，覆寫排序自動推導的線性相依

---

### Requirement: QC PT 自動建立（每印件強制 1 個）

工單規劃完成後，系統 MUST 為每個 PrintItem 自動建立 1 個 QC ProductionTask。

建立規則：

- `type = qc`、`scope = print_item`
- `pt_target_qty = 印件預計總數量（pi_planned_qty）`
- `previous_production_task_ids` 預設為「該印件下所有 `affects_product = TRUE` 的 production PT 的 QC 完成事件」
- `assigned_operator` 預設為 NULL，由印務派工指派 QC 人員
- 印件詳情頁可顯示該 QC PT 進度

QC PT 為印件入庫前最終驗證，每個印件強制 1 個（不可拆分為多個 QC PT；分批驗收透過多筆 ProductionTaskWorkRecord 累計實現）。

#### Scenario: PrintItem 對應 QC PT 自動建立

- **WHEN** 工單規劃完成（所有 production / inspection PT 建立完畢）
- **THEN** 系統 SHALL 為每個 PrintItem 建立 1 個 QC ProductionTask
- **AND** QC PT 的 `pt_target_qty` SHALL 等於 PrintItem 預計總數量
- **AND** QC PT 的 `previous_production_task_ids` SHALL 包含所有該印件下 affects_product production PT 的 QC 完成事件

#### Scenario: 印務指派 QC 執行者

- **WHEN** 印務在派工板或印件詳情頁指派 QC 人員為 QC PT 的 `assigned_operator`
- **THEN** 系統 SHALL 寫入 `assigned_operator`
- **AND** QC PT SHALL 出現在被指派 QC 人員的派工板待辦清單

---

### Requirement: 品檢 PT 印務手動加入（工序層選擇性）

印務 SHALL 在工單規劃時，對特定 `affects_product = TRUE` 的 production PT 加入對應品檢 PT。

建立規則：

- 印務在工單規劃介面選擇「加入品檢」
- 系統建立 ProductionTask（`type = inspection`、`scope = work_order_task`）
- `pt_target_qty` 由印務設定（通常 = 對應 production PT 的 target_qty）
- `previous_production_task_ids` 設為「對應 production PT 報工完成 + 轉交完成（若 require_transfer）」
- 對應 production PT 的 `requires_inspection` 自動設為 TRUE

品檢 PT 適用於：新製程良率追蹤、外包回廠半成品驗收、特殊規格品中間驗證等情境。

#### Scenario: 印務加入品檢 PT

- **WHEN** 印務在工單規劃時對某 production PT 點選「加入品檢」並填寫 `pt_target_qty`
- **THEN** 系統 SHALL 建立 inspection ProductionTask、設定相依性、將對應 production PT 的 `requires_inspection` 設為 TRUE

#### Scenario: 印務移除品檢 PT

- **WHEN** 印務在工單規劃時移除某品檢 PT（尚未派工前）
- **THEN** 系統 SHALL 刪除該 inspection PT、將對應 production PT 的 `requires_inspection` 還原為 FALSE

#### Scenario: US-PT-002 印務在工單規劃時加入品檢任務

- **WHEN** 印務在工單規劃時，對某 `affects_product = TRUE` 的 production PT 點選「加入品檢」，理由為新製程良率追蹤、外包回廠半成品驗收、或特殊規格中間驗證
- **THEN** 系統 SHALL 建立 inspection PT（type = inspection、scope = work_order_task、pt_target_qty 由印務填寫）
- **AND** 系統 SHALL 將對應 production PT 的 `requires_inspection` 設為 TRUE
- **AND** 該 inspection PT SHALL 顯示在統一派工板，與 production / QC 任務同清單處理（取代當前依賴口頭交辦與紙本紀錄的工序中間檢驗流程）

---

### Requirement: ProductionTaskWorkRecord 結果欄位

`ProductionTaskWorkRecord` SHALL 新增以下欄位（僅 type = `qc` / `inspection` 的 PT 之 WorkRecord 有值）：

| 欄位 | 來源 | 說明 |
|------|------|------|
| `passed_quantity` | QC / 品檢人員填寫 | 此次驗收通過數量 |
| `failed_quantity` | 系統計算 | = `reported_quantity - passed_quantity` |

規則：
- QC / 品檢人員提交時只填 `reported_quantity`（本次驗了多少）與 `passed_quantity`（通過多少）
- 系統自動計算 `failed_quantity` 並寫入（便於資料分析、報表撈取）
- `passed_quantity <= reported_quantity` 必須成立
- type = `production` 的 PT 之 WorkRecord 之 `passed_quantity` / `failed_quantity` 為 NULL

#### Scenario: QC 人員提交 QC 結果

- **WHEN** QC 人員在 QC PT 提交一筆 WorkRecord：`reported_quantity = 100`、`passed_quantity = 80`
- **THEN** 系統 SHALL 寫入 WorkRecord（`reported_quantity = 100`、`passed_quantity = 80`、`failed_quantity = 20`）

#### Scenario: 品檢人員提交品檢結果

- **WHEN** QC 人員（兼品檢）在 inspection PT 提交 WorkRecord：`reported_quantity = 500`、`passed_quantity = 480`
- **THEN** 系統 SHALL 寫入 WorkRecord（`failed_quantity = 20`）

#### Scenario: production PT 之 WorkRecord 不寫入 QC 欄位

- **WHEN** production PT 報工建立 WorkRecord
- **THEN** 該 WorkRecord 的 `passed_quantity` / `failed_quantity` SHALL 為 NULL

#### Scenario: passed_quantity 超過 reported_quantity 阻擋

- **WHEN** QC 人員嘗試提交 `reported_quantity = 100`、`passed_quantity = 120`
- **THEN** 系統 SHALL 阻擋提交並提示「通過數量不得超過本次驗收數量」

---

### Requirement: QC / 品檢 PT 完成判定與累計

QC / 品檢 PT SHALL 透過多筆 ProductionTaskWorkRecord 累計報工。

衍生公式：

```
pt_qc_passed = sum(WorkRecord.passed_quantity
                   where production_task_id = pt.id
                     AND status = '已完成')
```

完成判定（系統自動）：當 `pt_qc_passed >= pt_target_qty`，PT 標記為達標；達標後仍可加新 WorkRecord（補生產情境，sum 超過 target 為合法）。

`pt_qc_passed` 的更新 MUST 觸發下游 PT 相依性檢查與工單完成度重算（依 [state-machines § 完成度計算（齊套性邏輯 Kitting Logic）](../../state-machines/spec.md)）。

#### Scenario: QC PT 分批驗收累計

- **WHEN** QC PT 的 `pt_target_qty = 500`、QC 人員依序提交 2 筆 WorkRecord：第 1 筆 reported=100/passed=100、第 2 筆 reported=400/passed=400
- **THEN** `pt_qc_passed = 100 + 400 = 500`，PT 標記達標

#### Scenario: 補生產加 WorkRecord 超過 target 合法

- **WHEN** QC PT.target = 500，第 1 筆 WorkRecord passed = 480、第 2 筆補生產加 WorkRecord passed = 20
- **THEN** `pt_qc_passed = 480 + 20 = 500`，達標；系統不報錯

#### Scenario: 已作廢 WorkRecord 不計入累計

- **WHEN** QC PT 有一筆 WorkRecord 狀態為「已作廢」
- **THEN** 該 WorkRecord 的 passed_quantity MUST NOT 計入 `pt_qc_passed`

#### Scenario: US-PT-003 QC 人員分批驗收同一印件

- **WHEN** QC 人員看到某 QC PT 的上游 production PT 已累積完成 200 件、自己尚未驗收
- **AND** QC 人員提交第一筆 WorkRecord（reported = 200、passed = 200）
- **AND** 上游後續再完成 300 件，QC 人員提交第二筆 WorkRecord（reported = 300、passed = 300）
- **THEN** 系統 SHALL 計算 `pt_qc_passed = 500`，QC PT 達標
- **AND** QC 人員 MUST NOT 被系統要求等上游 PT 全部完工才能開始驗收（分批驗收節奏由 QC 自主決定）
- **AND** 上游與 QC 的協調 SHALL 透過儀表板顯示「上游已通過 vs 自己已驗」+ 印務 / 生管口頭協調，不走系統強制機制

---

### Requirement: PT 相依性檢查（生管派工前置）

生管派工某 PT 前，系統 MUST 檢查 `previous_production_task_ids` 中所有前置事件是否已完成（AND 邏輯）。

前置事件類型：
- 某 PT 的 QC / inspection 完成（PT 達標即視為完成，不看通過數量）
- 某 PT 的轉交完成（TransferTicket 狀態 = 已送達，不看數量）

「不看數量」原則：差額由 NCR Disposition 處理，不阻擋下游派工。

#### Scenario: 前置完成才能派工

- **WHEN** 生管嘗試派工 PT-B，PT-B.previous = [PT-A.qc_completed]
- **AND** PT-A 對應的 QC / inspection PT 已達標
- **THEN** 系統 SHALL 允許派工 PT-B

#### Scenario: 前置未完成阻擋派工

- **WHEN** 生管嘗試派工 PT-B，PT-A 對應的 QC PT 尚未達標
- **THEN** 系統 SHALL 阻擋派工並提示「前置條件未滿足：PT-A 的 QC 尚未完成」

#### Scenario: 多前置 AND 邏輯

- **WHEN** 裝訂 PT.previous = [封面 PT.qc_completed, 內頁 PT.qc_completed]
- **AND** 封面 PT 的 QC 已達標、內頁 PT 的 QC 尚未達標
- **THEN** 系統 SHALL 阻擋派工裝訂 PT

#### Scenario: QC 通過數不足不阻擋下游派工

- **WHEN** PT-A 的 QC PT 達標，但 passed_quantity = 480（target = 500，failed = 20）
- **THEN** PT-B 仍可由生管派工（差額由 NCR Disposition 處理，不阻擋）

---

### Requirement: NCR（不合格紀錄）實體

當 QC / inspection PT 的 WorkRecord 提交時 `failed_quantity > 0`，系統 MUST 自動建立 NCR 紀錄。

NCR Data Model：

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | UUID | Y | 主鍵 |
| `source_work_record_id` | FK | Y | 觸發此 NCR 的 ProductionTaskWorkRecord |
| `defect_quantity` | 整數 | Y | 不合格數量（= source WorkRecord 的 failed_quantity）|
| `disposition` | 列舉 | N | `rework` / `use_as_is` / `scrap`（pending 狀態時為 NULL）|
| `disposition_at` | 日期時間 | N | 印務做決策時間 |
| `disposition_by` | FK | N | FK → 使用者（印務）|
| `notes` | 文字 | N | 印務備註 |
| `status` | 列舉 | Y | `pending` / `resolved` |
| `created_at` / `updated_at` | 日期時間 | Y | 系統自動 |

#### Scenario: failed_quantity > 0 自動建 NCR

- **WHEN** QC 人員提交一筆 WorkRecord：reported=100、passed=80（failed = 20）
- **THEN** 系統 SHALL 自動建立 NCR，`source_work_record_id` 指向此 WorkRecord、`defect_quantity = 20`、`status = pending`
- **AND** 系統 SHALL 通知印務檢視 NCR

#### Scenario: failed_quantity = 0 不建 NCR

- **WHEN** QC 人員提交一筆 WorkRecord：reported=100、passed=100（failed = 0）
- **THEN** 系統 MUST NOT 建立 NCR

---

### Requirement: NCR Disposition 機制

NCR 建立後 status = `pending`，印務 SHALL 對 NCR 做 Disposition 決策（三選一）：

- `rework`：補做缺口（具體流程詳見 C3 `add-production-task-rework`）
- `use_as_is`：議價接受，印件數量鎖定，業務發起訂單異動退款（具體流程詳見 C3 / C4）
- `scrap`：報廢，標記放棄

印務做 Disposition 後，NCR 狀態變為 `resolved`，系統記錄 `disposition_at` / `disposition_by`。

NCR 處理為**並行流程**，MUST NOT 阻擋主流程：下游 PT 仍可派工執行；缺口由後續 Disposition 決定如何補。

#### Scenario: 印務選 Rework

- **WHEN** 印務在 NCR 上選擇 `disposition = rework` 並提交
- **THEN** 系統 SHALL 將 NCR.disposition 設為 `rework`、status 設為 `resolved`、記錄 disposition_at / disposition_by
- **AND** 後續補生產的具體流程依 C3 範圍實現（C1 範圍僅定義 disposition 列舉）

#### Scenario: 印務選 Use-As-Is

- **WHEN** 印務在 NCR 上選擇 `disposition = use_as_is`
- **THEN** 系統 SHALL 標記 NCR.disposition 為 `use_as_is`、status 為 `resolved`
- **AND** 系統 SHALL 通知業務發起訂單異動退款（具體串接流程詳見 C3 / C4）

#### Scenario: 印務選 Scrap

- **WHEN** 印務在 NCR 上選擇 `disposition = scrap`
- **THEN** 系統 SHALL 標記 NCR.disposition 為 `scrap`、status 為 `resolved`
- **AND** 缺口視為損失，不觸發補生產或退款

#### Scenario: NCR 不阻擋下游派工

- **WHEN** QC PT 的 WorkRecord 觸發 NCR（pending 狀態）
- **THEN** 下游相依 PT 的派工 MUST NOT 被阻擋（依「不看數量」原則）

#### Scenario: US-PT-004 印務處理 NCR Disposition（含 Use-As-Is 退款邊界）

- **WHEN** QC PT 報工後系統自動建立 pending NCR（defect_quantity > 0）
- **AND** 印務檢視 NCR、選擇 disposition（rework / use_as_is / scrap）並提交
- **THEN** 系統 SHALL 更新 NCR.disposition、status = resolved、記錄 disposition_at / disposition_by
- **AND** 若 disposition = `use_as_is`，系統 SHALL 發送通知給該訂單的業務負責人（含 NCR id、defect_quantity、source WorkRecord 連結），業務 SHALL 至訂單異動模組手動建立 OrderAdjustment 處理退款
- **AND** 系統於 C1 範圍 MUST NOT 自動產生 OrderAdjustment 或自動計算退款金額（具體自動串接留 C3 / C4）
- **AND** 若 disposition = `scrap`，缺口視為損失，系統 MUST NOT 觸發補生產或退款流程
- **AND** 若 disposition = `rework`，C1 範圍僅標記 disposition 列舉值；補生產的具體建單流程依 C3 `add-production-task-rework` 完整實現

---

### Requirement: 派工板顯示多 type 任務

派工板 SHALL 統一顯示所有 type 的 ProductionTask（production / qc / inspection）。

派工板 MUST 提供 type 篩選器，列出 `production` / `qc` / `inspection` 三類；預設顯示全部。

派工板的詳細顯示邏輯與排序規則詳見 [task-dispatch-board spec](../../specs/task-dispatch-board/spec.md)，本 Requirement 僅定義 C1 後派工板必須涵蓋三種 type。

#### Scenario: 派工板顯示三種 type 任務

- **WHEN** 印務 / 生管開啟派工板
- **THEN** 系統 SHALL 顯示所有待派工的 ProductionTask，涵蓋 `production` / `qc` / `inspection` 三種 type
- **AND** 派工板 MUST 提供 type 篩選器供切換顯示

#### Scenario: 派工板 type 篩選

- **WHEN** 印務在派工板選擇 type = `qc` 篩選
- **THEN** 系統 SHALL 僅顯示 type = `qc` 的 ProductionTask
