# qc Specification

## Purpose
TBD - created by archiving change qc-spec-consolidation. Update Purpose after archive.
## Requirements
### Requirement: QC 單實體定位

QC 單（Quality Control Record，`QCRecord`）SHALL 為獨立實體，透過 `production_task_id` 關聯生產任務。工單詳情頁的 QC 單列表 MUST 透過 `ProductionTask → WorkOrder` 關聯彙總。

QC 單為 QC 檢驗結果的唯一資料載體。**本次規格不保留 QCDetail 實體**（逐件判定、缺陷代碼分類等進階功能若有需求，另開 change 處理）。

#### Scenario: QC 單建立時寫入生產任務 FK

- **WHEN** 印務在工單詳情頁建立 QC 單，選擇某生產任務、填寫批次目標 QC 數量、指定 QC 人員
- **THEN** 系統 MUST 將 QC 單的 `production_task_id` 設為所選生產任務的 ID
- **AND** QC 單 MUST NOT 直接持有 `work_order_id` 欄位；工單關聯透過 `production_task.work_order_id` 間接取得

#### Scenario: 工單詳情頁 QC 單彙總

- **WHEN** 使用者開啟工單詳情頁並查看 QC 單列表
- **THEN** 系統 SHALL 以 `work_order_id → production_task → qc_record` 路徑彙總該工單下所有 QC 單
- **AND** 列表 MUST 顯示各 QC 單所屬的生產任務名稱，讓使用者辨識 QC 批次來源

---

### Requirement: QC 單狀態機

QC 單 SHALL 依以下狀態流轉：

- 主路徑：待執行 → 執行中 → 已完成
- 作廢路徑：待執行 → 已作廢 / 執行中 → 已作廢

「已完成」與「已作廢」均為終態，MUST NOT 可回退。「已作廢」的 QC 單不計入可申請上限、不觸發完成度重算，但 QC 紀錄本身保留供稽核。

#### Scenario: QC 單建立後進入待執行

- **WHEN** 印務建立 QC 單並指定 QC 人員
- **THEN** QC 單狀態 SHALL 為「待執行」
- **AND** 系統 SHALL 在該 QC 人員登入後於工作清單顯示此單（通知機制細節見 Scope Boundary，本 change 不定義即時推播）

#### Scenario: QC 單開始執行

- **WHEN** QC 人員開始檢驗
- **THEN** QC 單狀態 SHALL 從「待執行」變為「執行中」

#### Scenario: QC 單完成

- **WHEN** QC 人員完成所有檢驗項目並填寫結果
- **THEN** QC 單狀態 SHALL 變為「已完成」
- **AND** QC 通過數量（`passed_quantity`）SHALL 納入工單完成度計算

#### Scenario: 印務主動作廢 QC 單

- **WHEN** QC 單狀態為「待執行」或「執行中」，印務發起作廢（理由：誤建、批次改變、生產任務異動等），填寫作廢原因
- **THEN** QC 單狀態 SHALL 變為「已作廢」
- **AND** 系統 MUST 記錄 `cancelled_at`、`cancelled_by`、`cancelled_reason`
- **AND** 該 QC 單之 `target_quantity` MUST NOT 再計入該生產任務的「已申請數量」
- **AND** 若原狀態為「執行中」，QC 人員已填寫的 `passed_quantity` / `failed_quantity` 保留於紀錄但不納入 `pt_qc_passed`

#### Scenario: 生產任務作廢自動帶動 QC 單作廢

- **WHEN** 某生產任務因工單異動而狀態轉為「已作廢」或「報廢」，且該生產任務下有狀態為「待執行」或「執行中」的 QC 單
- **THEN** 系統 MUST 自動將該些 QC 單狀態變為「已作廢」
- **AND** 作廢原因 SHALL 標記為「所屬生產任務已作廢」
- **AND** 已完成的 QC 單 MUST NOT 被改動，其 `passed_quantity` 紀錄保留但依 [business-scenarios § 任務層級作廢](../business-scenarios/spec.md) 從完成度計算中排除

---

### Requirement: QC 單建立流程

系統 SHALL 支援印務在工單詳情頁建立 QC 單。建立前置條件與動作：

- 選擇的生產任務 MUST 標記為「影響成品」（`affects_product = TRUE`）
- 填寫批次目標 QC 數量（`target_quantity`），不得超出「可申請上限」（見下一 Requirement）
- 指定 QC 人員（`inspector_id`）
- 寫入 `production_task_id`，狀態設為「待執行」

#### Scenario: 印務於工單詳情頁建立 QC 單

- **WHEN** 印務在工單詳情頁點擊「新增 QC 單」，選擇該工單下某標記為「影響成品」的生產任務，填寫批次目標 QC 數量並指定 QC 人員
- **THEN** 系統 SHALL 建立 `QCRecord`，寫入 `production_task_id`、`target_quantity`、`inspector_id`，狀態為「待執行」
- **AND** 批次目標 QC 數量 MUST 不超出可申請上限

#### Scenario: 非「影響成品」生產任務不可建立 QC 單

- **WHEN** 印務嘗試為某 `affects_product = FALSE` 的生產任務建立 QC 單
- **THEN** 系統 SHALL 阻擋操作並提示「僅可對影響成品之生產任務建立 QC 單」

---

### Requirement: QC 可申請上限

系統 MUST 確保 QC 單的批次目標數量不超過「可申請上限」。QC 單的業務語意為「檢驗已生產的成品」，MUST 於該生產任務有實際報工後方可建立。

**單位前提**：以下所有數量欄位 SHALL 以同一單位計算（生產任務單位，即 `ProductionTask.quantity_per_work_order` 分子所用的單位）：

- `WorkReport.reported_quantity`（報工數）
- `QCRecord.target_quantity`（QC 批次目標）
- `QCRecord.passed_quantity` / `failed_quantity`（QC 結果）

若生產任務涉及拼版倍率換算（例如印張 vs 印件成品），換算 MUST 在報工階段完成，QC 流程所見之所有數字皆為同一單位。

**可申請上限公式**：

```
可申請上限 = 該生產任務之報工數量 - 該生產任務下其他有效 QC 單已申請數量
```

其中：
- 「報工數量」= `sum(WorkReport.reported_quantity where production_task_id = pt.id)`（該生產任務所有報工紀錄的 `reported_quantity` 加總）
- 「其他有效 QC 單已申請數量」= `sum(QCRecord.target_quantity where production_task_id = pt.id AND qc_record.id != 本次建立的 QC 單 AND status IN ('待執行', '執行中', '已完成'))`（**排除「已作廢」狀態**）

#### Scenario: QC 可申請數量計算

- **WHEN** 某生產任務報工數量為 1000，已有 QC 單申請目標數量 700（狀態為「執行中」）
- **THEN** 系統 SHALL 限制新 QC 單的批次目標數量最多為 300

#### Scenario: QC 申請超過上限

- **WHEN** 某生產任務報工數量為 1000，已有 QC 單申請目標數量 1000（狀態為「已完成」），印務嘗試再建立 QC 單
- **THEN** 系統 SHALL 阻擋操作並提示「可 QC 數量不足」

#### Scenario: 無報工時不可建立 QC 單

- **WHEN** 某生產任務尚未有任何報工（報工數量為 0）
- **THEN** 系統 SHALL 阻擋 QC 單建立並提示「無已報工成品可檢驗」

#### Scenario: 分批 QC — 邊報工邊檢驗

- **WHEN** 某生產任務目標 5000，師傅分批報工：先報工 1000 後建 QC-A（target=600）、後續報工到 2500 時建 QC-B
- **THEN** 建 QC-A 時可申請上限為 `1000 - 0 = 1000`，QC-A 建立成功
- **AND** 建 QC-B 時可申請上限為 `2500 - 600 = 1900`，QC-B 可申請上限為 1900

#### Scenario: 已作廢 QC 單不佔用可申請額度

- **WHEN** 某生產任務報工 1000，QC-A 申請 target=1000 後被印務作廢（狀態「已作廢」），印務重新建立 QC-B
- **THEN** 建 QC-B 時可申請上限為 `1000 - 0 = 1000`（QC-A 不計入已申請）
- **AND** QC-B 可申請目標最高為 1000

---

### Requirement: QC 結果記錄

QC 人員於 QC 單執行中填寫檢驗結果。每筆 QC 單 MUST 記錄：

- `passed_quantity`：通過數量
- `failed_quantity`：不通過數量
- `passed_quantity + failed_quantity <= target_quantity`（可少驗，不可超驗）
- QC 人員填寫結果後，QC 單狀態轉為「已完成」，觸發上層完成度重算

#### Scenario: QC 結果輸入並提交

- **WHEN** QC 人員在 QC 單「執行中」狀態輸入通過數量與不通過數量，並按「提交 QC」
- **THEN** 系統 SHALL 寫入 `passed_quantity` 與 `failed_quantity`，並驗證 `passed_quantity + failed_quantity <= target_quantity`
- **AND** QC 單狀態 SHALL 變為「已完成」
- **AND** 系統 MUST 觸發該生產任務所屬工單的完成度重算

#### Scenario: QC 結果數量超過批次目標

- **WHEN** QC 人員輸入 `passed_quantity + failed_quantity > target_quantity`
- **THEN** 系統 SHALL 阻擋提交並提示「QC 結果數量不得超過批次目標」

---

### Requirement: QC 通過數與入庫數量的分層定義

系統 SHALL 以下列分層命名與公式定義 QC 通過數與入庫數量，避免同名異義：

| 層級 | 欄位名稱 | 語意 | 公式 |
|------|---------|------|------|
| QC 紀錄 | `QCRecord.passed_quantity` | 單筆 QC 通過件數（QC 人員輸入） | （檢驗結果輸入） |
| 生產任務 | `pt_qc_passed` | 該生產任務所有 QC 紀錄通過數加總（**未齊套**） | `sum(QCRecord.passed_quantity where production_task_id = pt.id AND status = '已完成')` |
| 工單 | `wo_warehouse_qty` | 齊套性計算後的可入庫件數 | `floor(min_over_affects_product_pt(pt_qc_passed / pt.quantity_per_work_order)) × pt.quantity_per_print_item`（概念，等同工單完成度 × 每份印件生產數量） |
| 印件 | `pi_warehouse_qty` | 跨工單聚合後的可出貨件數 | 依齊套性邏輯從各工單 `wo_warehouse_qty` 聚合（見 business-processes § 多工單出貨齊套性） |

**業務用語 → 欄位名對照**：

| 業務用語（可互用） | 嚴格對應欄位 |
|-------------------|-------------|
| 生產任務層「QC 通過數」、「累計 QC 通過」、「入庫數量」 | `pt_qc_passed`（原始加總，未齊套） |
| 工單層「入庫數量」 | `wo_warehouse_qty`（齊套後件數） |
| 印件層「入庫數量」、「QC 入庫數」、「可出貨數量」 | `pi_warehouse_qty`（跨工單聚合件數） |

**關鍵原則**：
- 生產任務層的「入庫數量」= `pt_qc_passed`（單純加總，未跨任務齊套）
- 齊套性計算發生在 **向上聚合到工單 / 印件時**
- 讀者在任何 spec 看到「入庫數量」，須依所在層級判斷是否已齊套

#### Scenario: 生產任務層 QC 通過數加總

- **WHEN** 某生產任務下有兩筆已完成 QC 單：QC-01 `passed_quantity = 500`、QC-02 `passed_quantity = 300`
- **THEN** `pt_qc_passed` SHALL 為 800

#### Scenario: 未完成的 QC 單不計入 pt_qc_passed

- **WHEN** 某生產任務下 QC-03 狀態為「執行中」且已填 `passed_quantity = 200`，但尚未提交
- **THEN** 該 200 件 MUST NOT 計入 `pt_qc_passed`，直到 QC-03 狀態變為「已完成」

#### Scenario: 工單層齊套性計算

- **WHEN** 一工單下有生產任務 A（`pt_qc_passed = 2100`、`quantity_per_work_order = 1000`）與生產任務 B（`pt_qc_passed = 600`、`quantity_per_work_order = 300`），均為影響成品
- **THEN** 工單完成度 SHALL 為 `floor(min(2100/1000, 600/300)) = floor(min(2.1, 2)) = 2`

---

### Requirement: QC 完成觸發 pt_qc_passed 更新

QC 單狀態變為「已完成」時，系統 MUST 觸發該生產任務的 `pt_qc_passed` 重算。後續工單完成度計算、工單 / 印件 / 訂單狀態推進，完全依照 [state-machines § 完成度計算（齊套性邏輯 Kitting Logic）](../state-machines/spec.md) 與 [state-machines § bubble-up 規則](../state-machines/spec.md) 定義，本 capability 不重複定義推進路徑。

本 Requirement 僅定義「QC 完成」作為觸發事件，不定義下游狀態如何轉換。

#### Scenario: QC 完成觸發 pt_qc_passed 重算

- **WHEN** QC 單狀態從「執行中」變為「已完成」
- **THEN** 系統 MUST 即時重算該 QC 單所屬生產任務的 `pt_qc_passed`
- **AND** `pt_qc_passed` 的更新 MUST 觸發工單完成度重算（公式與推進規則見 state-machines spec）

#### Scenario: 已作廢 QC 單不觸發重算

- **WHEN** QC 單狀態變為「已作廢」
- **THEN** 系統 MUST NOT 觸發 `pt_qc_passed` 重算（因已作廢 QC 單的 `passed_quantity` 不計入 `pt_qc_passed`）

---

### Requirement: 異動期間 QC 行為

系統 SHALL 於工單處於「異動」狀態期間，維持 QC 流程正常運作。具體規則 MUST 包含：

- 師傅與供應商 SHALL 可繼續報工；未受異動影響之生產任務其 QC 單建立與執行 MUST NOT 被阻擋
- 完成度計算 SHALL 持續運作，不因異動狀態而暫停
- 未受異動影響之 QC 通過數量 SHALL 持續累計到 `pt_qc_passed`

本規則為 D2 決策定版。業務情境與狀態機 spec 的對應段落 MUST 與本 Requirement 一致。

#### Scenario: 異動期間 QC 單建立不被阻擋

- **WHEN** 工單處於「異動」狀態，印務嘗試在未受異動影響的生產任務上建立 QC 單
- **THEN** 系統 SHALL 允許建立，流程與正常狀態相同

#### Scenario: 異動期間完成度即時反映 QC 結果

- **WHEN** 工單處於「異動」狀態，未受異動影響的生產任務其 QC 單完成
- **THEN** 系統 SHALL 即時重算工單完成度並更新顯示

#### Scenario: 受異動影響的生產任務其 QC 單處理

- **WHEN** 某生產任務因工單異動而狀態轉為「已作廢」或「報廢」，其下存在狀態為「待執行」或「執行中」的 QC 單
- **THEN** 系統 MUST 依 § QC 單狀態機 的「生產任務作廢自動帶動 QC 單作廢」規則，將該些 QC 單轉為「已作廢」
- **AND** 已完成 QC 單的 `passed_quantity` 紀錄保留，但依 [business-scenarios § 任務層級作廢](../business-scenarios/spec.md) 從所屬層級的完成度計算範圍中排除

---

### Requirement: QC 與出貨的關聯

QC 通過 SHALL 為出貨前提。出貨數量規則由 business-processes § 入庫與出貨數量規則定義，QC 通過數的欄位定義以本 spec § QC 通過數與入庫數量分層為準。

本 Requirement 僅定義 QC 通過與出貨可用數量之間的語意關聯；實際出貨建立流程、分批出貨、齊套性判斷等見 order-management 與 business-processes。

分批出貨的申請節點相關設計問題見 [Open Question SHP-005](https://www.notion.so/32d3886511fa8171a70cfb3a43d57185)。

#### Scenario: QC 未通過不計入印件可出貨數量

- **WHEN** 某印件累計 `pi_warehouse_qty = 500`（齊套後件數）
- **THEN** 該印件可出貨上限 SHALL 為 500 - 已出貨數

#### Scenario: QC 通過即時更新可出貨數量

- **WHEN** 某印件下某工單的 QC 單完成，使 `wo_warehouse_qty` 增加 200，聚合後 `pi_warehouse_qty` 增加 200
- **THEN** 該印件可出貨上限 SHALL 對應提升 200

---

### Requirement: QC 角色權限邊界

QC 角色於 QC 單生命週期中的職責 SHALL 限於執行檢驗與記錄結果；建立 QC 單的動作 MUST 由印務執行。完整的 QC 角色權限定義（工單模組 R/W 範圍、可編輯欄位）詳見 [user-roles § QC 角色編輯限制](../user-roles/spec.md)，本 spec 不重複定義。

QC 角色於 QC 單生命週期中的可執行動作：

- 不建立 QC 單（由印務建立）
- 執行 QC 單（狀態轉「執行中」）
- 填寫 QC 結果（`passed_quantity`、`failed_quantity`）
- 提交 QC 單（狀態轉「已完成」）

#### Scenario: QC 人員接手待執行 QC 單

- **WHEN** QC 人員登入系統並查看被指派的 QC 單
- **THEN** 系統 SHALL 允許 QC 人員將 QC 單從「待執行」轉為「執行中」並填寫結果
- **AND** QC 人員 MUST NOT 能修改 QC 單的批次目標數量或 `inspector_id`

---

