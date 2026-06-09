## Purpose

定義 ERP 系統所有實體的狀態機規格，涵蓋各實體狀態流轉規則、跨實體狀態傳遞鏈、完成度計算邏輯，以及關鍵設計決策。

本規格之業務來源為 [狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)（Notion 發布版本）。

涵蓋實體：需求單、訂單、工單、印件、任務、生產任務、出貨單。

QC 任務狀態 = ProductionTask 狀態（依 reclassify-qc-and-add-inspection change 2026-05-20 歸檔，QCRecord 獨立實體廢止，QC 統一進 ProductionTask 框架，`type = qc`、`scope = print_item`）；inspection 任務狀態同樣 = ProductionTask 狀態（`type = inspection`、`scope = work_order_task`）。「QC 通過數」欄位定義以 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md) 為準（`pt_qc_passed = sum(ProductionTaskWorkRecord.passed_quantity where type IN ('qc', 'inspection') AND status = '已完成')`）。

---
## Requirements
### Requirement: 跨實體狀態向上傳遞鏈

當下層實體狀態變更時，系統 SHALL 依以下傳遞鏈自動推進上層實體狀態：

`type = production` 的生產任務（製作中）→ 任務 → 工單 → 印件 → 訂單

生管指派師傅（更新 assigned_operator）MUST NOT 觸發向上傳遞。僅 `type = production` 的生產任務進入「製作中」時 SHALL 觸發向上傳遞。

供應商觸發的狀態變更 SHALL 與 ERP 內部觸發的狀態變更適用相同的向上傳遞規則。

**QC PT 與 inspection PT 的狀態變更不走此鏈**（依 erp-consultant Round 1 P1 修正補強）：

- `type = qc`、`scope = print_item` 的 PT：狀態變更直接影響其所屬印件層的 `pi_warehouse_qty` 計算（依本 spec § 完成度計算公式）；MUST NOT 觸發「PT → 任務」傳遞
- `type = inspection`、`scope = work_order_task` 的 PT：狀態變更影響對應 production PT 的 `pt_effective_qty`（依 `requires_inspection` 旗標）；MUST NOT 觸發「PT → 任務」傳遞（inspection PT 不歸屬於任何「任務」實體）

#### Scenario: production 生產任務開始製作時觸發狀態向上傳遞

- **WHEN** 某 `type = production` 的生產任務狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 檢查其所屬任務下所有 production 生產任務狀態，若為該任務首個進入「製作中」的生產任務，則將任務狀態推進為「製作中」
- **THEN** 系統 SHALL 依相同邏輯逐層向上傳遞至工單、印件、訂單

#### Scenario: 部分生產任務完成不影響上層狀態回退

- **WHEN** 某任務下有 3 個 `type = production` 生產任務，其中 1 個已完成、2 個製作中
- **THEN** 任務狀態 SHALL 維持「製作中」，不得因部分完成而回退或跳進

#### Scenario: 指派師傅不觸發向上傳遞

- **WHEN** 生管為某生產任務指派師傅（更新 assigned_operator 欄位）
- **THEN** 系統 MUST NOT 向上傳遞狀態變更至任務、工單層

#### Scenario: 首次報工觸發向上傳遞

- **WHEN** 某 `type = production` 生產任務首次報工使狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依正常邏輯向上傳遞至任務、工單、印件、訂單

#### Scenario: 供應商報工觸發向上傳遞

- **WHEN** 供應商首次報工使 `type = production` 生產任務從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依傳遞鏈自動推進：任務 → 工單 → 印件 → 訂單

#### Scenario: QC PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = qc`、`scope = print_item` 的 QC PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發其所屬印件的 `pi_warehouse_qty` 重算（依本 spec § 完成度計算公式）

#### Scenario: inspection PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = inspection` 的 PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發對應 production PT 的 `pt_effective_qty` 重算

### Requirement: 完成度計算（齊套性邏輯 Kitting Logic）

工單完成度 SHALL 以下列公式計算：

`floor(min over affects_product production PT (pt_effective_qty / qpwo))`

其中 `pt_effective_qty` 定義（依 production PT 的 `requires_inspection` 屬性而定）：

- 若 `requires_inspection = TRUE`：`pt_effective_qty` = 對應 inspection PT（type = `inspection`）的 `pt_qc_passed`（= 所有已完成 inspection WorkRecord 的 passed_quantity 加總）
- 若 `requires_inspection = FALSE`：`pt_effective_qty` = `pt_produced_qty`（production PT 自身報工累計）

`pt_effective_qty` 與 `pt_qc_passed` 的正式欄位定義詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)。

此計算 MUST 基於累加邏輯，不需序列化。

**入庫公式**：C1 過渡期沿用既有「`pi_warehouse_qty = 工單完成度 × qppi`」（聚合至印件層）；C4 `move-warehousing-to-print-item-layer` 後，`pi_warehouse_qty` 改為「印件對應的 QC PT（type = `qc`、scope = `print_item`）通過數量加總」，本 Requirement 公式將進一步調整。

#### Scenario: 工單完成度計算範例（皆 requires_inspection = TRUE）

- **WHEN** 某工單有 2 個影響成品的 production PT：A（requires_inspection = TRUE）與 B（requires_inspection = TRUE）
- **AND** A 的 inspection PT.pt_qc_passed = 120、A.qpwo = 50
- **AND** B 的 inspection PT.pt_qc_passed = 90、B.qpwo = 50
- **THEN** 工單完成度 SHALL 為 floor(min(120/50, 90/50)) = floor(min(2.4, 1.8)) = floor(1.8) = 1

#### Scenario: 工單完成度計算範例（混合 requires_inspection）

- **WHEN** 某工單有 production PT：A（requires_inspection = TRUE，inspection PT.pt_qc_passed = 1000）與 B（requires_inspection = FALSE，pt_produced_qty = 1000）、皆 qpwo = 1
- **THEN** 工單完成度 SHALL 為 floor(min(1000/1, 1000/1)) = 1000

#### Scenario: 異動期間完成度計算持續運作

- **WHEN** 工單處於異動流程中
- **THEN** 完成度計算 SHALL 持續運作，不因異動狀態而暫停

#### Scenario: 打樣工單完成度獨立計算

- **WHEN** 工單為打樣工單
- **THEN** 其完成度 SHALL 獨立計算，不納入正式工單的完成度統計

#### Scenario: 分批出貨情境下 QC PT 累計與 pi_warehouse_qty 計算（P1-6，C1 過渡期）

- **WHEN** 印件分批出貨：第一批計劃 300 件、第二批計劃 200 件，total `pi_planned_qty = 500`
- **AND** QC PT.target = 500，第一筆 WorkRecord passed = 300（QC 完成第一批驗收，但 PT 未達標）
- **THEN** C1 過渡期 `pi_warehouse_qty` SHALL 依「工單完成度 × qppi」計算（非 QC PT.passed 直接 sum）
- **AND** 出貨單建立時 SHALL 檢查 `pi_warehouse_qty >= 出貨數量`，允許第一批 300 出貨（即使 QC PT 仍 pending）
- **AND** QC PT 仍維持 1 個累計 target，第二筆 WorkRecord passed = 200 後達標
- **AND** C4 `move-warehousing-to-print-item-layer` 後 `pi_warehouse_qty` 改為 `sum(QC PT.passed where status = 已完成)`，分批驗收的累計直接成為入庫量

### Requirement: 層級建立順序

實體建立 SHALL 遵循以下順序：訂單 → 印件審稿維度進入「已確認可製作」後建立工單 → 工單審核完成後建立生產任務。

**Priority**: P0

**Rationale**: 工單建立時機從「合格」後移至「已確認可製作」，確保業務確認後才投入生產資源。

#### Scenario: 印件審稿未確認可製作時不得建立工單

- **WHEN** 某訂單下的印件審稿維度狀態為「合格」（尚未確認可製作）
- **THEN** 系統 MUST NOT 允許為該印件建立工單

#### Scenario: 印件已確認可製作後允許建立工單

- **WHEN** 某訂單下的印件審稿維度狀態為「已確認可製作」
- **THEN** 系統 SHALL 允許為該印件建立工單

#### Scenario: 工單審核完成後方可建立生產任務

- **WHEN** 某工單狀態為「製程審核完成」
- **THEN** 系統 SHALL 允許為該工單建立生產任務

---

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失

角色權責：業務 / 諮詢業務負責需求確認、議價對談、成交 / 流失決策、以及「已評估成本 → 議價中」的直接推進；印務主管負責成本評估。業務主管不介入需求單流程任何狀態轉換。

業務主管 gate 位於訂單階段（線下訂單建立後 → 報價待回簽前），詳見 [order-management spec](../order-management/spec.md) § 訂單狀態機 與 § 業務主管核准訂單。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管。其他狀態轉換不再觸發 Slack 通知（v2.0 的「進入已評估成本通知業務主管」隨業務主管 gate 移除而下架）。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 待評估成本進入已評估成本

- **WHEN** 印務主管執行「評估完成」
- **THEN** 需求單狀態 SHALL 變為「已評估成本」
- **AND** 系統 MUST 寫入 ActivityLog 記錄印務主管評估動作

#### Scenario: 業務直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價後成交

- **WHEN** 客戶於議價階段接受報價，業務點擊「成交」
- **THEN** 需求單狀態 SHALL 變為「成交」
- **AND** 系統 SHALL 允許後續建立訂單（轉訂單動作）
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 業務於重新評估後可直接再進入議價中

- **GIVEN** 需求單原處於「議價中」狀態，業務執行「重新評估報價」
- **AND** 需求單回到「待評估成本」狀態，印務主管重新評估後再次進入「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」（無需業務主管核可）

---

> 訂單狀態機相關 Requirement（訂單狀態機 / 狀態不可逆 / Bubble-up 派生 / 諮詢取消終態 / 諮詢取消退費 OA 系統建已核可 / 業務改派狀態約束 / 前段審核通過）已搬遷至 [order-management/spec.md](../order-management/spec.md)。

### Requirement: 工單狀態機

工單（Work Order）SHALL 依以下狀態流轉：

草稿 → 製程確認中 ↔ 重新確認製程 → 製程審核完成 → 工單已交付 → 製作中 → 已完成

終態：已完成、已取消。

可逆路徑：
- 收回（Withdraw）：製程確認中 / 製程審核完成 → 草稿
- 異動（Modification）：由任務層 bubble-up 驅動。當任何任務處於「異動」或「已確認異動內容」時，工單狀態 SHALL 為「異動」。所有任務離開異動相關狀態後，工單自動回到正常狀態。

角色權責：印務負責製程確認與發起異動；印務主管負責製程審核；生管負責任務層異動確認（確認收到 + 完成安排）。

任務獨立交付模式下，工單狀態推進規則：
- 「製程審核完成」→「工單已交付」：首個任務（Task）交付時觸發
- 「工單已交付」→「製作中」：首個生產任務進入「製作中」時觸發（由狀態向上傳遞驅動）
- 後續任務交付時，工單狀態 MUST NOT 重複推進或回退
- 異動回到「製程審核完成」後，若已有生產任務處於「製作中」，新任務交付時工單 SHALL 直接推進為「製作中」（跳過「工單已交付」）

#### Scenario: 首個任務交付觸發工單狀態推進

- **WHEN** 工單狀態為「製程審核完成」，且該工單下首個任務被印務交付
- **THEN** 工單狀態 SHALL 推進為「工單已交付」

#### Scenario: 後續任務交付不影響工單狀態

- **WHEN** 工單狀態已為「工單已交付」或「製作中」，且該工單下其他任務被交付
- **THEN** 工單狀態 MUST NOT 變化，維持當前狀態

#### Scenario: 工單從草稿進入製程確認

- **WHEN** 印務建立工單並填寫製程資訊
- **THEN** 工單狀態 SHALL 變為「製程確認中」

#### Scenario: 製程確認需重新確認

- **WHEN** 印務主管審核製程後要求修改
- **THEN** 工單狀態 SHALL 變為「重新確認製程」
- **AND** 印務 SHALL 可修改後重新提交，狀態回到「製程確認中」

#### Scenario: 工單交付後進入製作

- **WHEN** 工單狀態為「工單已交付」且任一生產任務進入「製作中」
- **THEN** 工單狀態 SHALL 推進為「製作中」

---

### Requirement: 工單收回（Withdraw）機制

當工單已交付但需修正時，系統 SHALL 提供收回機制，允許將工單從「工單已交付」回退至適當狀態進行修正。

#### Scenario: 工單交付後收回

- **WHEN** 印務發現已交付工單有誤，執行收回
- **THEN** 工單狀態 SHALL 回退至「製程確認中」或「重新確認製程」
- **AND** 其下所有尚未開始製作的生產任務 SHALL 同步暫停

---

### Requirement: 工單異動流程

工單異動 SHALL 由印務發起。印務發起時 MUST 選擇「是否需重新審核製程」，系統依此決定前段路徑：

- 不需重新審核：受影響的任務立即進入「異動」狀態 → 工單 bubble-up 為「異動」→ 通知生管
- 需重新審核：工單直接回到「重新確認製程」→ 印務修改 → 印務主管審核 → 印務交付新任務（任務標記為「異動」）→ 工單 bubble-up 為「異動」→ 通知生管

兩條路徑最終匯入同一個收尾流程（任務層）：
1. 生管確認收到 → 任務進入「已確認異動內容」
2. 生管分配生產任務 → 安排師傅/通知外包廠
3. 生管完成安排 → 手動將任務改回「製作中」
4. 所有任務離開異動相關狀態 → 工單 bubble-up 回到正常狀態

異動期間（不論路徑），已在執行中且未被異動的生產任務 SHALL 持續運作，完成度計算 SHALL 持續運作，師傅與供應商報工 MUST NOT 受阻擋。

#### Scenario: 工單異動（不需重新審核）

- **WHEN** 印務在「工單已交付」或「製作中」狀態發起異動，選擇「不需重新審核」
- **THEN** 受影響的任務 SHALL 進入「異動」狀態
- **AND** 工單狀態 SHALL 因 bubble-up 變為「異動」
- **AND** 系統 SHALL 通知生管

#### Scenario: 工單異動（需重新審核）

- **WHEN** 印務在「工單已交付」或「製作中」狀態發起異動，選擇「需重新審核」
- **THEN** 工單狀態 SHALL 直接回到「重新確認製程」
- **AND** 印務修改後重新送審，走製程審核流程
- **AND** 審核通過後印務交付新任務，新任務 SHALL 標記為「異動」狀態
- **AND** 工單因任務 bubble-up 進入「異動」，通知生管

#### Scenario: 生管確認任務異動

- **WHEN** 生管在日程面板確認某任務的異動
- **THEN** 該任務狀態 SHALL 從「異動」變為「已確認異動內容」
- **AND** 工單 SHALL 維持「異動」狀態（因仍有任務處於異動相關狀態）

#### Scenario: 生管完成安排後恢復製作中

- **WHEN** 生管完成生產任務分配後，手動將任務從「已確認異動內容」改回「製作中」
- **THEN** 系統 SHALL 檢查工單下是否仍有任務處於「異動」或「已確認異動內容」
- **AND** 若無，工單 SHALL 自動回到正常狀態（由 bubble-up 決定）

#### Scenario: 需重新審核時已交付任務不收回

- **WHEN** 工單因異動回到「重新確認製程」，且該工單下已有任務被交付且在執行中
- **THEN** 已交付的任務 SHALL 繼續執行，MUST NOT 收回
- **AND** 新增的任務 SHALL 在審核通過後方可交付

#### Scenario: 異動後審核通過且已有任務在製作中時交付新任務

- **WHEN** 工單因異動（需重新審核）回到「製程審核完成」，且該工單下已有生產任務處於「製作中」，印務交付新增的任務
- **THEN** 新任務 SHALL 標記為「異動」，工單因 bubble-up 進入「異動」
- **AND** 系統 MUST NOT 將工單推進為「工單已交付」（跳過，因為已有任務在跑且任務為異動狀態）

#### Scenario: 異動期間完成度計算持續運作

- **WHEN** 工單處於「異動」狀態
- **THEN** 完成度計算 SHALL 持續運作，不因異動狀態而暫停
- **AND** 未受異動影響的師傅與供應商 SHALL 可繼續報工

---

### Requirement: 任務異動狀態機

任務（Task）SHALL 支援以下異動狀態路徑：

已交付 / 製作中 → 異動 → 已確認異動內容 → 製作中

- 「異動」：印務發起異動後，受影響的任務進入此狀態（系統自動設定）
- 「已確認異動內容」：生管確認收到異動通知後進入此狀態（生管手動觸發）
- 回到「製作中」：生管完成生產任務分配後手動觸發

#### Scenario: 任務進入異動

- **WHEN** 印務發起工單異動，且某任務下有生產任務被新增、修改或作廢
- **THEN** 該任務 SHALL 進入「異動」狀態

#### Scenario: 任務異動確認

- **WHEN** 生管在日程面板點擊「確認收到」
- **THEN** 任務狀態 SHALL 從「異動」變為「已確認異動內容」

#### Scenario: 任務恢復製作中

- **WHEN** 生管完成安排後點擊「已安排完畢，恢復製作中」
- **THEN** 任務狀態 SHALL 從「已確認異動內容」回到「製作中」

---

### Requirement: 印件狀態機（雙維度）

印件（Print Item）SHALL 以雙維度管理狀態：

**審稿維度**：
```
稿件未上傳 → 等待審稿 → 合格 → 已確認可製作
                │           │
                │           └→ 待改稿 → 等待審稿（重審）
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
- `合格 → 已確認可製作`：業務手動確認（B2B）或系統自動（B2C）
- `合格 → 待改稿`：業務觸發退回重審（必填退回原因）
- `待改稿 → 等待審稿`：客戶上傳新稿後系統自動（新增 ReviewRound）

**審稿維度「已確認可製作」為終態**：「已確認可製作」無任何出向轉移。業務確認可製作後即鎖定，不可退回。工單建立時機從既有「合格」後移至「已確認可製作」。

**「合格」為業務確認前的等待態**：合格代表審稿人員品質判定通過，但尚未經業務確認可投產。業務可在合格狀態下選擇「確認可製作」（進入終態）或「退回重審」（進入待改稿）。

**「待改稿」為業務退回後的等待態**：業務判斷客戶需改稿時觸發，等客戶上傳新稿。與「不合格」的區別：不合格是審稿人員品質退件，待改稿是業務要求客戶改稿（品質已通過但內容需變更）。

**B2C 自動跳過確認**：B2C 訂單印件合格後，系統 SHALL 自動將狀態推進至「已確認可製作」，業務不需手動確認。B2B 訂單印件合格後，系統 SHALL 維持在「合格」狀態等待業務手動確認。

**與棄用 + clone 路徑並存**：「退回重審」用於同一印件的稿件內容修改（客戶換 Logo、改文字等）。「棄用原印件 + 建立新印件」保留用於印件規格本身全換（如名片改成 DM、尺寸材質全變）的場景。打樣後業務判定 `sampleResult = NG-稿件問題` 仍走棄用 + clone 路徑（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。

**與印製維度回退路徑無衝突**：本 spec § 印件打樣特殊流程 的「打樣 NG-製程問題 後回退至等待中」屬於**印製維度**，不影響審稿維度狀態。

印製維度狀態僅在審稿維度為「已確認可製作」後開始推進（原為「合格」後推進，現後移至「已確認可製作」）。

**已棄用狀態觸發場景**：印製維度的「已棄用」（既有 `PrintItemStatus` enum 值）目前唯一自動觸發場景為「打樣判定 NG-稿件問題」（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。已棄用印件 MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單；雙維度狀態保留原值作為棄用前稽核軌跡，印件詳情頁仍可訪問。

**Priority**: P0

**Rationale**: 審稿維度狀態機是印件從稿件到生產的核心控制點，新增「已確認可製作」與「待改稿」解決 B2B 線下單客戶合格後改稿的操作繁瑣與語意錯誤問題。

#### Scenario: B2B 印件合格後業務確認可製作

- **GIVEN** B2B 訂單的印件審稿維度狀態為「合格」
- **WHEN** 業務於訂單詳情頁點擊該印件的「確認可製作」按鈕
- **THEN** 印件審稿維度狀態 SHALL 轉為「已確認可製作」
- **AND** 系統 SHALL 觸發工單建立流程（B2B 建空工單草稿）

#### Scenario: B2C 印件合格後系統自動確認可製作

- **GIVEN** B2C 訂單的印件審稿維度狀態變為「合格」
- **WHEN** 審稿人員送審合格或免審路徑自動合格
- **THEN** 系統 SHALL 自動將印件審稿維度狀態推進至「已確認可製作」
- **AND** 系統 SHALL 觸發工單建立流程（B2C 自動建工單 + 帶生產任務）

#### Scenario: 業務退回重審（合格 → 待改稿）

- **GIVEN** 印件審稿維度狀態為「合格」
- **WHEN** 業務於訂單詳情頁點擊該印件的「退回重審」按鈕並填寫退回原因
- **THEN** 印件審稿維度狀態 SHALL 轉為「待改稿」
- **AND** 系統 SHALL 記錄退回原因至印件 ActivityLog
- **AND** 系統 SHALL 通知客戶需重新上傳稿件

#### Scenario: 退回原因必填

- **WHEN** 業務點擊「退回重審」但未填寫退回原因
- **THEN** 系統 SHALL 拒絕操作並提示退回原因為必填

#### Scenario: 待改稿印件客戶上傳新稿後回到等待審稿

- **GIVEN** 印件審稿維度狀態為「待改稿」
- **WHEN** 客戶（B2C）或業務（B2B）上傳新稿件
- **THEN** 印件審稿維度狀態 SHALL 轉為「等待審稿」
- **AND** 系統 SHALL 建立新的 ReviewRound（round_no 遞增）
- **AND** 原審稿人員 SHALL 收到重審通知，該印件重新出現在其待審列表

#### Scenario: 已確認可製作後不可退回

- **GIVEN** 印件審稿維度狀態為「已確認可製作」
- **WHEN** 業務嘗試對該印件觸發退回重審
- **THEN** 系統 MUST NOT 提供「退回重審」操作（按鈕不顯示）

#### Scenario: 印件已確認可製作後允許建立工單

- **WHEN** 印件的審稿狀態變為「已確認可製作」
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
- **AND** B2C 訂單：系統自動推進至「已確認可製作」並觸發工單建立
- **AND** B2B 訂單：維持「合格」等待業務手動確認

#### Scenario: 補件重審仍不合格

- **WHEN** 印件審稿維度狀態為「已補件」
- **AND** 原審稿人員送出審核並標為「不合格」
- **THEN** 印件審稿維度狀態 SHALL 轉回「不合格」
- **AND** 系統 SHALL 再次通知補件方

#### Scenario: 已棄用印件雙維度狀態保留作為稽核軌跡

- **GIVEN** 印件 X `printItemStatus = 已棄用`（因 NG-稿件問題觸發棄用）
- **WHEN** 系統檢查印件 X 的雙維度狀態
- **THEN** 雙維度狀態值保留原值，作為棄用前稽核軌跡
- **AND** 印件 X MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單
- **AND** 印件 X 仍可於印件詳情頁直接訪問（稽核用途）

#### Scenario: 免審印件合格後被退回重審走正常審稿

- **GIVEN** 印件走免審快速路徑，審稿維度為「合格」（source=免審稿 Round）
- **WHEN** 業務觸發「退回重審」並填寫退回原因
- **THEN** 印件審稿維度狀態 SHALL 轉為「待改稿」
- **AND** 客戶上傳新稿後 SHALL 走正常審稿流程（系統自動分配審稿人員，非免審）

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

---

### Requirement: 任務狀態機

任務（Task）SHALL 依以下狀態流轉：

待交付 → 已交付 → 製作中 → 已完成

可逆路徑：異動 → 已確認異動內容（中間態）→ 回到正常流程。

依工廠類型（自有/外包/中國）有不同終態路徑。

#### Scenario: 任務從待交付到已交付

WHEN 工單交付後，其下任務同步交付
THEN 任務狀態 SHALL 變為「已交付」

#### Scenario: 任務異動流程（含中間態）

WHEN 任務於製作中需要異動
THEN 任務狀態 SHALL 先進入「異動」狀態
AND 確認異動內容後 SHALL 進入「已確認異動內容」中間態
THEN 再回到正常流程繼續執行

#### Scenario: 任務 Bottom-up 作廢

WHEN 任務下所有生產任務皆為「已作廢」
THEN 任務 SHALL 自動標記為作廢

---

### Requirement: 生產任務狀態機

生產任務（Production Task）SHALL 依以下狀態流轉，依工廠類型有不同路徑：

自有工廠路徑：
- 待處理 → 製作中 → 已完成
- 「製作中」由首次報工觸發

加工廠路徑：
- 待處理 → 製作中 → 已完成
- 與自有工廠相同路徑

外包廠路徑：
- 待處理 → 製作中 → 運送中 → 已完成

中國廠商路徑：
- 待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

終態：已完成、已作廢、報廢。

生管指派師傅（assigned_operator）為欄位更新，不觸發狀態變更。生產任務維持「待處理」直到首次報工。

#### Scenario: 自有工廠生產任務首次報工進入製作中

- **WHEN** 生管或師傅為「待處理」狀態的自有工廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 自有工廠生產任務完成

WHEN 自有工廠的生產任務製作完畢
THEN 狀態 SHALL 直接從「製作中」變為「已完成」

#### Scenario: 外包工廠生產任務含運送

- **WHEN** 外包工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 中國工廠生產任務含集運

- **WHEN** 中國工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「已送集運商」
- **AND** 集運商出貨後 SHALL 變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」
- **AND** 向上狀態傳遞 SHALL 正常觸發

#### Scenario: 供應商標記製作完畢觸發運送中

- **WHEN** 供應商將「製作中」狀態的外包廠生產任務標記為製作完畢
- **THEN** 狀態 SHALL 從「製作中」變為「運送中」

#### Scenario: 中國廠商標記出貨觸發已送集運商

- **WHEN** 中國廠商將「製作中」狀態的生產任務標記出貨
- **THEN** 狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 待處理狀態的生產任務作廢

- **WHEN** 「待處理」狀態的生產任務因異動需作廢
- **THEN** 狀態 SHALL 變為「已作廢」（無成本，因尚未實際生產）

---

### Requirement: 出貨單狀態機

出貨單 SHALL 掛於訂單層級，依物流方式分為兩條路徑：

自行出貨：未處理 → 打包中 → 待出貨 → 出貨中 → 已送達
第三方物流：未處理 → 已出貨 → 運送中 → 已送達

出貨單 SHALL 支援異常分支處理。

#### Scenario: 自行出貨正常流程

WHEN 倉管開始打包出貨單
THEN 狀態 SHALL 從「未處理」依序經過「打包中」→「待出貨」→「出貨中」→「已送達」

#### Scenario: 第三方物流出貨流程

WHEN 出貨單交由第三方物流處理
THEN 狀態 SHALL 從「未處理」經過「已出貨」→「運送中」→「已送達」

#### Scenario: 出貨數量防呆

WHEN 建立出貨單並填寫出貨數量
THEN 出貨數量 MUST 滿足：出貨數 <= QC 入庫數 - 已出貨數
AND 系統 MUST NOT 允許超出可出貨數量的出貨單建立

---

### Requirement: 出貨單掛訂單層

出貨單 SHALL 掛於訂單層級，而非工單或印件層級。

#### Scenario: 出貨單歸屬於訂單

WHEN 建立出貨單
THEN 出貨單 SHALL 關聯至訂單
AND 一張訂單下 SHALL 可建立多張出貨單（支援分批出貨）

### Requirement: 訂單異動（OrderAdjustment）狀態機

OrderAdjustment SHALL 為**獨立狀態機**，不影響主訂單狀態。狀態定義：

| 狀態 | 說明 |
|------|------|
| 草稿 | 業務 / 諮詢建立但未提交審核 |
| 待主管審核 | 業務提交後等待業務主管核可（僅退款負項 OA 經此態；補收正項免審）|
| 已核可 | 業務主管核可（退款 OA）；待系統推進已執行 |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | **核可後應收調整生效（系統自動推進、不綁 Payment 累計）；應收總額更新（終態）** |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核（退款 OA）─────────────────▶ 待主管審核
草稿 ─ 儲存並執行（補收正項，免審）────────▶ 已執行
草稿 ─ 取消 ──────────────────────────────▶ 已取消
待主管審核 ─ 核可 ────────────────────────▶ 已核可
待主管審核 ─ 退回 ────────────────────────▶ 已退回
已退回 ─ 修改後重交 ──────────────────────▶ 待主管審核
已退回 ─ 取消 ────────────────────────────▶ 已取消
已核可 ─ 核可後應收調整生效（系統自動）───▶ 已執行
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 BillingInstallment（請款期次）。

**「已執行」推進機制（訂單收退款模型重構 MODIFY：核可即生效、不綁 Payment 累計）**：

OrderAdjustment 的 `status = 已執行` 推進條件為「核可後應收調整生效」，與退款 Payment / 補收 Payment **解耦**（取代舊「對應 OA 的關聯 Payment 累計達 OA.amount 才推進」）：

- **補收正項 OA**（amount > 0、免審）：建立並「儲存並執行」時直接推進「已執行」（approved_by = 業務本人、executed_at = now），應收即時 +N。
- **退款負項 OA**（amount < 0、送審）：業務主管核可後系統自動推進「已執行」（executed_at = 核可時點），應收即時 −N；不等退款 Payment 切已完成。
- 補收與退款 OA「已執行」語意統一 = 應收調整生效；退款的**現金完成**獨立由退款 Payment 切「已完成」承載（見 [order-management § 退款 OA](../order-management/spec.md)）。

「執行」action 由系統自動觸發（補收於儲存並執行、退款於主管核可後）；UI 上 OA 編輯介面 SHALL NOT 提供獨立「執行」按鈕。

**[訂單收退款模型重構移除]「已執行」回退機制**：舊「業務取消已完成關聯 Payment 致累計不足 → OA 回退已核可」回退機制 **移除**——OA 已執行不再綁 Payment 累計，無「累計不足」概念。誤建退款 Payment 的修正改為「取消退款 Payment → 對帳應退差額重現 → 差額警示引導重退」，OA 維持已執行（應收已調整、不回退）。此取代既有 [ORD-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-003-取消退款Payment是否回退OA.md) 候選做法 1。

**OrderAdjustment 雙重身份廢止（沿用）**：OrderAdjustment 不再有 `adjustment_phase` 欄位，所有 adjustment_type 皆可於任何 Order 狀態下選用。OrderAdjustment 有 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）：

- **NULL**：訂單期間業務直接建立的金額異動
- **非 NULL**：AfterSalesTicket 內部建立的關聯異動（退款 / 補印收費）

兩種情境共用同一狀態機。`linked_after_sales_ticket_id` 一經建立 MUST NOT 變動。

**對帳警示觸發（沿用）**：對帳檢視面板警示 banner 觸發條件為「`OrderAdjustment.executed_at > Order.completed_at`」，同時適用 linked_after_sales_ticket_id 為 NULL 與非 NULL。

#### Scenario: OrderAdjustment 草稿提交審核（退款 OA）

- **GIVEN** 退款 OrderAdjustment.status = 草稿（amount < 0）
- **WHEN** 業務點擊「提交審核」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 MUST 通知業務主管

#### Scenario: 退款 OA 核可後核可即生效（訂單收退款模型重構）

- **GIVEN** 退款 OrderAdjustment OA-001（status = 已核可、amount = -5000）
- **WHEN** 業務主管核可
- **THEN** 系統 SHALL 自動推進 OA-001.status → 已執行、executedAt = 核可時點
- **AND** 系統 MUST 重算訂單應收總額（含此筆已執行 OA，應收 −5000）
- **AND** OA 推進已執行 MUST NOT 等待退款 Payment 切已完成
- **AND** 對帳面板 SHALL 顯示「收款淨額 > 應收」應退差額，引導業務建退款 Payment 核銷

#### Scenario: 補收正項 OA 儲存並執行直達已執行（沿用）

- **GIVEN** 補收 OrderAdjustment OA-002（amount = +8000、adjustment_type = 加印追加、免審）
- **WHEN** 業務點「儲存並執行」
- **THEN** OA-002.status SHALL 跳過待主管審核 / 已核可、直接 = 已執行（approved_by = 業務、executed_at = now）
- **AND** 應收即時 +8000、MUST NOT 綁 Payment 切已完成

#### Scenario: 取消退款 Payment 後 OA 維持已執行（無回退）

- **GIVEN** 退款 OA-001 已執行（應收已 −5000）、退款 Payment P-001 已完成
- **WHEN** 業務取消 P-001
- **THEN** OA-001.status SHALL 維持「已執行」（應收維持 −5000、不回退已核可）
- **AND** 對帳面板 SHALL 重現「應退差額 5000」、引導業務重建退款 Payment

### Requirement: AfterSalesTicket 狀態機

AfterSalesTicket SHALL 為獨立狀態機，與 Order 主狀態、OrderAdjustment 狀態機平行運作。狀態定義：

| 狀態 | 說明 |
|------|------|
| 受理中 | 業務已建 ticket、尚未填入 resolution |
| 處理中 | 業務已填入 resolution 並送出決議；下游動作（關聯 OrderAdjustment / 補印 PrintItem）可建立與執行 |
| 已結案 | 業務手動點「結案」推進的終態 |

狀態轉換：

```
受理中 ─ 送出決議（填 resolution）──▶ 處理中
處理中 ─ 業務點結案 ────────────────▶ 已結案
處理中 ─ 修改 resolution ───────────▶ 處理中（同態，允許 resolution 變更）
已結案 ─ 不可重開 ──────────────────▶ X
```

**無核可關卡**：AfterSalesTicket 狀態機無「待主管核可」階段。業務與業務主管於 Slack 線下討論，ERP 僅記錄結果（resolution / responsibility / slack_thread_url）。

**結案純手動**：MVP 階段「處理中 → 已結案」轉換 SHALL 為業務手動操作（點「結案」按鈕），系統 SHALL NOT 依關聯動作（補印 PrintItem 出貨完成、退款 Payment 入帳）自動推導結案。

**ticket 不阻擋主訂單**：AfterSalesTicket 處於任何狀態 SHALL NOT 影響 Order.status。Order.status 永遠保持「已完成」不回退。

**ticket 不阻擋 OrderAdjustment**：AfterSalesTicket 內建關聯 OrderAdjustment 仍走 OrderAdjustment 既有狀態機（含業務主管審核關卡）。ticket 結案前 OrderAdjustment 可獨立運作。

**結案後不可重開**：MVP 階段已結案 ticket 不支援重開。客戶後續再投訴時，業務 SHALL 建立新 ticket（已結案 ticket 不算入「最多 1 張」限制）。

完整 ticket 規格詳見 [after-sales-ticket spec](../after-sales-ticket/spec.md)。

#### Scenario: ticket 受理中填入 resolution 推進處理中

- **GIVEN** AfterSalesTicket.status = 受理中、resolution = NULL
- **WHEN** 業務填入 resolution = 退款 並點「送出決議」
- **THEN** status SHALL → 處理中
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「決議送出」、resolution 值）

#### Scenario: ticket 處理中業務手動結案

- **GIVEN** AfterSalesTicket.status = 處理中、resolution = 退款、關聯 OrderAdjustment 已執行
- **WHEN** 業務點擊「結案」
- **THEN** status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at、closed_by

#### Scenario: ticket 結案不影響 Order.status

- **GIVEN** Order.status = 已完成、AfterSalesTicket.status = 處理中
- **WHEN** 業務於 ticket 上推進結案
- **THEN** AfterSalesTicket.status SHALL → 已結案
- **AND** Order.status MUST 維持「已完成」不變

#### Scenario: ticket 內 OrderAdjustment 獨立運作

- **GIVEN** AfterSalesTicket.status = 處理中
- **AND** ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=此 ticket).status = 待主管審核
- **WHEN** 業務嘗試結案 ticket
- **THEN** 系統 SHALL 提示「ticket 內有未完結的 OrderAdjustment（待主管審核），建議完成後再結案」
- **AND** 系統允許強制結案（業務確認時）；OrderAdjustment 仍可獨立完成狀態機

### Requirement: 發票（Invoice）狀態機

Invoice SHALL 有獨立狀態機，狀態定義：

| 狀態 | 說明 |
|------|------|
| 開立 | 藍新 Mockup 開立成功；可被 SalesAllowance 引用；與收款的對應透過 BillingInstallment 中介（期次↔發票 1:1、期次↔收款 N:M）|
| 作廢 | 業務作廢（含作廢原因）；終態 |

狀態轉換：

```
開立 ─ 業務作廢 ──▶ 作廢
```

作廢後 ezpay_merchant_order_no 流水號 SHALL NOT 重用；同訂單若需重新開立發票，新發票流水號 SHALL +1。

#### Scenario: 發票開立後可作廢

- **GIVEN** Invoice.status = 開立
- **WHEN** 業務 / 諮詢點擊「作廢」並填入原因
- **THEN** status SHALL → 作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at、invalid_by

#### Scenario: 作廢後流水號不重用

- **GIVEN** Invoice #1 status = 作廢，ezpay_merchant_order_no = `O-25050601-INV-01`
- **WHEN** 業務於同訂單開立新 Invoice
- **THEN** 新 Invoice 的 ezpay_merchant_order_no SHALL = `O-25050601-INV-02`

#### Scenario: 作廢的發票不參與三方對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 作廢 的 Invoice，只加總 status = 開立 的 total_amount

### Requirement: 折讓單（SalesAllowance）狀態機

折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條）SHALL 有獨立狀態機，狀態定義（Mockup 階段精簡為兩態）：

| 狀態 | 說明 |
|------|------|
| 已確認 | 業務開立折讓並 Mockup 立即觸發確認；折讓正式生效，影響三方對帳；終態之一 |
| 已作廢 | 業務作廢已確認的折讓單（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立）；終態之一 |

狀態轉換：

```
（建立時直接寫入）─▶ 已確認 ─ 業務作廢折讓 ──▶ 已作廢
```

**Mockup 階段不使用「草稿」過渡態**：藍新 API 雖支援 Status = 0 不立即確認模式，但 Prototype 不模擬此情境（業務開立 = 自動已確認）。未來真實藍新串接若需要 Status = 0 等待買受人確認流程，另開 change 補「草稿 / 已取消」狀態。

已作廢的折讓單 SHALL NOT 再參與三方對帳。已作廢後該發票 SHALL 回到折讓前的剩餘可折讓金額狀態。

#### Scenario: 折讓開立後立即為已確認

- **WHEN** 業務開立 SalesAllowance
- **THEN** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API
- **AND** SalesAllowance.status SHALL 直接寫入「已確認」（不停留於草稿）
- **AND** issued_at 與 confirmed_at MUST 同時寫入

#### Scenario: 業務作廢已確認的折讓（undo 機制）

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務於折讓詳情頁點擊「作廢折讓」並填入原因（如：金額打錯）
- **THEN** status SHALL → 已作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at
- **AND** 該發票剩餘可折讓金額 SHALL 回到作廢前狀態（因為已作廢折讓不再扣減）

#### Scenario: 已作廢的折讓不參與對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 已作廢 的 SalesAllowance
- **AND** 系統 SHALL 只扣減 status = 已確認 的 |allowance_amount|

### Requirement: 諮詢單狀態機（v2 簡化）

諮詢單（ConsultationRequest）SHALL 依以下狀態流轉（v2 簡化：移除「諮詢中」「諮詢結束」過渡狀態，諮詢進行不需 status 追蹤；`result` 欄位移除，由 status 直接表達結局）：

待諮詢 → 已轉需求單 / 完成諮詢 / 已取消

其中「已轉需求單」可在後續因需求單流失而**更新為「完成諮詢」**（最終結局更新，反映實際資料流向）。

**狀態說明**：

- **待諮詢**：webhook 自動建單後的初始狀態（只建 ConsultationRequest 與 Payment，**不建任何訂單**），等待諮詢人員自我認領 `consultant_id`（諮詢人員自行認領，主管亦可代為認領，詳見 [consultation-request spec](../consultation-request/spec.md) § 諮詢人員認領）；所有諮詢結束分支動作（完成諮詢 / 轉需求單 / 取消）皆於此狀態下執行
- **已轉需求單**：諮詢人員選做大貨後的中間狀態（雖列為終態但可更新），系統建立 QuoteRequest，`linked_quote_request_id` 寫入；Payment 維持綁 ConsultationRequest 等需求單結局
- **完成諮詢**：終態，諮詢訂單建立完成（兩種收尾情境之一：不做大貨 / 需求單流失），`linked_consultation_order_id` 寫入
- **已取消**：終態，待諮詢狀態取消預約退費，已建諮詢訂單 + 退款 Payment

實際終態合併為「完成諮詢」（含兩種子情境）/「已轉需求單」（後續可能再更新為完成諮詢）/「已取消」。

角色權責：諮詢人員負責諮詢單建立後的自我認領、結束分支決策（業務若具諮詢權限可代理）；金流系統觸發 webhook 自動建單。諮詢進行階段不在 status 機（諮詢人員與客戶討論時無系統動作）。

逾時自動結案規則：OQ #4 已解 — Phase 1 不實作自動結案，由業務人工判斷處理。

#### Scenario: webhook 自動建單進入待諮詢（不建訂單）

- **WHEN** 客人於 surveycake 完成表單填寫並付款成功
- **THEN** 系統 SHALL 建立 ConsultationRequest（status = 待諮詢）
- **AND** 系統 SHALL 建立 Payment（linked_entity_type = ConsultationRequest、amount = 諮詢費）
- **AND** 系統 MUST NOT 建立任何 Order

#### Scenario: 待諮詢取消推進至已取消

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment 綁 ConsultationRequest
- **WHEN** 業務 / 諮詢人員點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上建立退款 Payment（amount = -諮詢費）
- **AND** 諮詢訂單 SHALL 推進至「已取消」終態（諮詢取消為「沒成交的生意」，見 § Requirement: 諮詢取消諮詢訂單終態收斂）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 諮詢人員自我認領

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且 `consultant_id` 為空
- **WHEN** 諮詢人員於諮詢單清單頁點擊某張未認領諮詢單的「認領」按鈕
- **THEN** 系統 SHALL 將該諮詢人員 user_id 寫入 `consultant_id`
- **AND** 狀態維持「待諮詢」（標示已分派）
- **AND** 詳見 [consultation-request spec](../consultation-request/spec.md) § Requirement: 諮詢人員認領 涵蓋併發衝突、主管代為認領等情境

#### Scenario: 完成諮詢 - 不做大貨（建諮詢訂單收尾）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、Payment 綁 ConsultationRequest
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢訂單）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑（已開發票 → 訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 推進至「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 轉需求單 - 做大貨（只建需求單，不建訂單）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、Payment 綁 ConsultationRequest
- **WHEN** 諮詢人員點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立 QuoteRequest（status = 需求確認中、linked_consultation_request_id 寫入）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已轉需求單」
- **AND** Payment MUST 維持綁 ConsultationRequest（等需求單結局決定才轉移）
- **AND** 系統 MUST NOT 建立任何 Order

#### Scenario: 需求單流失觸發 ConsultationRequest 結局更新

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單流失
- **WHEN** 系統處理需求單流失事件（updateQuoteStatus side-effect）
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢訂單）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」（最終結局）
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID
- **AND** `linked_quote_request_id` 維持保留（保留歷史足跡）

#### Scenario: 需求單成交業務轉訂單時 Payment 轉移至一般訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已成交
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單（order_type = 線下）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 系統 MUST NOT 建立諮詢訂單
- **AND** ConsultationRequest 狀態維持「已轉需求單」（成功進入大貨製作後不再更新）

#### Scenario: 諮詢單狀態大致不可逆，例外為「已轉需求單 → 完成諮詢」

- **GIVEN** ConsultationRequest 狀態為「完成諮詢」或「已取消」
- **WHEN** 任何角色嘗試變更狀態
- **THEN** 系統 MUST 拒絕

- **GIVEN** ConsultationRequest 狀態為「已轉需求單」
- **WHEN** 對應需求單流失（系統觸發，非人工）
- **THEN** 系統 SHALL 將狀態更新為「完成諮詢」並建立諮詢訂單收尾
- **AND** 任何角色 MUST NOT 手動變更「已轉需求單」狀態（只允許系統因需求單流失事件觸發更新）

### Requirement: BillingInstallment 雙維度狀態機

BillingInstallment SHALL 維護兩個獨立狀態維度，互相不耦合：

**開票維度（invoicing_status）**：
```
未開立 ──[業務一鍵開票]──▶ 已開立（linked_invoice_id 寫入、Invoice.source_billing_installment_id 寫入）
已開立 ──[Invoice 作廢]──▶ 已作廢（linked_invoice_id 設 NULL，可重新開票）
已作廢 ──[業務一鍵開票]──▶ 已開立（重啟）
```

**收款維度（payment_status，derived）**：
```
依未取消已完成 PaymentAllocation 累計推導：
  累計 = 0：未收
  0 < 累計 < scheduled_amount：部分收款
  累計 ≥ scheduled_amount：已收訖
```

兩維度推導獨立，支援：
- 先收後開：收款維度先到「已收訖」、開票維度仍「未開立」
- 先開後收：開票維度先到「已開立」、收款維度仍「未收」
- 開票後作廢重開：開票維度從「已開立」回「已作廢」、收款維度不動（保留稽核）
- 拆期：原期次 cancelled = true 不入兩維度推導；兩筆新期次各自獨立推導

#### Scenario: 先收後開雙維度獨立推進

- **GIVEN** BI-001（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收, cancelled=false）
- **WHEN** 業務登錄 Payment 30000 → 於入帳明細手動勾選該期次建 PaymentAllocation（allocated=30000）→ 業務切 Payment 為已完成
- **THEN** BI-001.payment_status SHALL = 已收訖（已完成 PaymentAllocation 累計達 30000）
- **AND** BI-001.invoicing_status SHALL 維持 = 未開立
- **WHEN** 業務於 BI-001「一鍵開票」
- **THEN** BI-001.invoicing_status SHALL → 已開立
- **AND** BI-001.payment_status 維持 = 已收訖

#### Scenario: 發票作廢開票維度回退、收款維度不動

- **GIVEN** BI-002（invoicing_status=已開立, linked_invoice_id=INV-002, payment_status=已收訖）
- **WHEN** 業務於 INV-002 詳情頁作廢（填入作廢原因「統編誤填」）
- **THEN** INV-002.status SHALL = 作廢
- **AND** BI-002.invoicing_status SHALL → 已作廢、linked_invoice_id 設 NULL
- **AND** BI-002.payment_status SHALL 維持 = 已收訖（收款歷史保留）

#### Scenario: 拆期原期次 cancelled 不入推導

- **GIVEN** BI-003.scheduled_amount = 78000、業務點「拆此期」拆為 BI-003-A（2500）+ BI-003-B（75500）
- **WHEN** 系統執行拆期
- **THEN** BI-003.cancelled SHALL = true、cancel_reason = 「拆兩期」
- **AND** BI-003 SHALL NOT 入兩維度狀態推導（cancelled = true 期次過濾掉）
- **AND** BI-003-A / BI-003-B 各自獨立推導兩維度（初始 invoicing_status = 未開立、payment_status = 未收）

### Requirement: BillingInstallment 取代 PaymentPlan 狀態機（廢止 v1.13 PaymentPlan.status）

系統 SHALL 廢止 v1.13 PaymentPlan.status 三態（未收 / 部分收款 / 已收訖），由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925、過濾條件改為「未取消已完成 PaymentAllocation」）。

**BREAKING**：v1.13 PaymentPlan.status 三態（未收/部分收款/已收訖）廢止，由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925，過濾條件改為「未取消已完成 PaymentAllocation」）。

**Migration**：Prototype store 移除 derivePlanStatus helper，改為 deriveBillingInstallmentPaymentStatus helper。

#### Scenario: BillingInstallment.payment_status 由 PaymentAllocation 推導

- **GIVEN** BillingInstallment BI-001（scheduled_amount = 30000）
- **AND** PaymentAllocation PA-001（billing_installment_id=BI-001, allocated_amount=20000, payment.paymentStatus=已完成）
- **WHEN** 系統計算 BI-001.payment_status
- **THEN** 系統 SHALL 推導 payment_status = 部分收款（已分配 20000 < scheduled 30000）
- **WHEN** PaymentAllocation PA-002（allocated_amount=10000, payment.paymentStatus=已完成）追加
- **THEN** 系統 SHALL 推導 payment_status = 已收訖（已分配 30000 = scheduled 30000）

### Requirement: BillingInstallment 取代 PlannedInvoice 狀態機

系統 SHALL 廢止 v1.13 PlannedInvoice.status 三態（預計開立 / 已開立 / 已取消），由 BillingInstallment.invoicing_status 三態（未開立 / 已開立 / 已作廢）+ cancelled boolean 取代。

**BREAKING**：v1.13 PlannedInvoice.status 三態（預計開立/已開立/已取消）廢止，由 BillingInstallment.invoicing_status 三態（未開立/已開立/已作廢）+ cancelled boolean 取代：
- PlannedInvoice.status = 預計開立 → invoicing_status = 未開立 + cancelled = false
- PlannedInvoice.status = 已開立 → invoicing_status = 已開立 + cancelled = false
- PlannedInvoice.status = 已取消 → cancelled = true + cancel_reason 補寫
- 新增：invoicing_status = 已作廢（Invoice 作廢觸發回退，PlannedInvoice 既有設計無此態）

#### Scenario: BillingInstallment.invoicing_status 狀態流轉

- **GIVEN** BillingInstallment BI-001（invoicing_status = 未開立、cancelled = false）
- **WHEN** 業務於 BI-001 點「一鍵開立發票」、系統建立 Invoice INV-001 並回寫 BI-001.linked_invoice_id
- **THEN** BI-001.invoicing_status SHALL = 已開立
- **WHEN** INV-001 被作廢
- **THEN** BI-001.invoicing_status SHALL 回退至「已作廢」、BI-001.linked_invoice_id SHALL 清空
- **WHEN** 業務於 BI-001 點「取消期次」並補 cancel_reason
- **THEN** BI-001.cancelled SHALL = true、業務 SHALL 不再可於該期次新增開票或核銷動作

### Requirement: OrderAdjustment 狀態機修訂（補收正項跳過審核中間態）

系統 SHALL 沿用 v1.13 OrderAdjustment 狀態機主結構（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消），但 SHALL 新增 requires_supervisor_approval derived field 決定狀態流轉路徑：補收正項 OA SHALL 跳過審核中間態直達已執行、退款負項 OA SHALL 沿用主管核可路徑。

v1.13 OrderAdjustment 狀態機保留主結構：草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消。**新增 requires_supervisor_approval derived field 決定狀態流轉路徑**：

| OA 類型 | requires_supervisor_approval | 狀態流轉 |
|---------|----------------------------|---------|
| 補收正項（amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項}）| false | **草稿 → 已執行（跳過待主管審核 + 已核可）**；approved_by = 業務 user_id、executed_at = now；應收 +N 立即認列，**不綁 Payment** |
| 退款負項（amount < 0）| true | 草稿 → 待主管審核 → 已核可 / 已退回 → 已執行（沿用 v1.13）；綁定退款 Payment 切已完成累計達 OA.amount 才推進已執行 |
| 諮詢取消退費（系統內生，amount = -1000 固定）| false | **草稿 → 已核可**（系統建立直接已核可，approved_by = system、executed_at = NULL）；退款 Payment 切已完成累計達 -1000 推進已執行（見 § Requirement: 諮詢取消退費 OA 系統建已核可，取代既有「系統建直接已執行」）|
| 規格變更（amount = 0）| - | 不建 OA（沿用既有規則）|

**對稱破壞理由**：對齊台灣印刷業實務分權（主管把關現金流出方向、不把關客戶下單追加方向）。spec 中明示「補收 OA 立即認列應收、退款 OA 必須綁退款動作」兩條獨立 invariant。

#### Scenario: 補收 OA 跳過審核中間態直達已執行

- **GIVEN** 業務建立 OA-010（amount=+8000, adjustment_type=加印追加, linked_after_sales_ticket_id=null）
- **WHEN** 業務點「儲存並執行」
- **THEN** 系統 SHALL 設定 OA-010.requires_supervisor_approval = false
- **AND** OA-010.status SHALL 直接 = 已執行（跳過「待主管審核」與「已核可」中間態）
- **AND** OA-010.approved_by = 業務 user_id、executed_at = now
- **AND** 應收 SHALL 立即 +8000

#### Scenario: 退款 OA 沿用主管核可 + 綁退款 Payment 推進已執行

- **GIVEN** 業務建立 OA-011（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）
- **WHEN** 業務送審
- **THEN** OA-011.status SHALL = 待主管審核
- **WHEN** 業務主管核可
- **THEN** OA-011.status SHALL = 已核可
- **WHEN** 業務於 OA-011 介面建退款 Payment(-5000, 處理中) + 補對帳附件 + 切已完成
- **THEN** 系統 SHALL 驗證對應已完成 Payment 累計 = -5000 = OA-011.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-011.status → 已執行、executedAt = now

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

**BREAKING**：v1.13 spec「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則廢止。BillingInstallment 變更 SHALL NOT 觸發訂單狀態回退，改為：

1. 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / BILLING_INSTALLMENT_CREATED）含 operator / timestamp / old_value / new_value
2. BillingInstallment.change_count derived field 累計 due_date + expected_invoice_date 變更次數
3. 訂單狀態維持不變（業務操作不阻塞）

事後稽核透過：CEO 指標 4「期次變更次數 per-installment 平均」+ Slack 通知主管（補收 OA 大額閾值）+ ActivityLog 完整軌跡三管道。

#### Scenario: 業務修改期次日期不觸發回審

- **GIVEN** BillingInstallment BI-020.due_date = 2026-06-01、訂單狀態 = 製作中（已過業務主管審核）
- **WHEN** 業務修改 BI-020.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-020.change_count SHALL = 1
- **AND** Order.status SHALL 維持 = 製作中（**MUST NOT** 回退至「業務主管審核」）

#### Scenario: 業務拆期不觸發回審

- **GIVEN** 訂單狀態 = 製作中、BI-021.scheduled_amount = 78000
- **WHEN** 業務拆 BI-021 為 BI-021-A + BI-021-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件
- **AND** Order.status SHALL 維持 = 製作中（不回審）

