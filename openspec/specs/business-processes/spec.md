## Purpose

定義印刷業 ERP 系統的核心商業流程與計算規則，涵蓋單據層級結構、業務階段、欄位帶入邏輯、印件數量換算、打樣流程、工單分派，以及報價單填寫原則。本規格為所有模組共用的業務基礎規則。

來源：[商業流程](https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a)（Notion 發布版本）

---
## Requirements
### Requirement: 單據層級結構

系統 SHALL 遵循以下單據層級關係：需求單 -> 訂單（含 N 個印件） -> 工單（含 N 個任務） -> 任務（紙本工單，含 N 個生產任務）。

上層單據建立後，才能產生下層單據。

#### Scenario: 未建立訂單時嘗試建立工單

WHEN 使用者在尚未建立訂單的情況下嘗試建立工單
THEN 系統 SHALL 阻擋操作並提示「須先建立訂單才能建立工單」

#### Scenario: 訂單已建立後建立工單

WHEN 使用者已建立訂單且訂單包含印件
THEN 系統 SHALL 允許為該訂單建立對應工單

---

### Requirement: 業務流程五大階段

系統 SHALL 支援以下五大業務階段，並按順序推進：

1. 評估階段
2. 打單階段
3. 審稿階段
4. 打樣/印製階段
5. 出貨階段

#### Scenario: 階段順序推進

WHEN 一張需求單從評估階段開始處理
THEN 系統 SHALL 依序經過打單、審稿、打樣/印製、出貨階段，不得跳過中間階段

---

### Requirement: 需求單轉訂單欄位帶入規則

需求單轉為訂單時，系統 SHALL 依以下規則處理欄位帶入：

- **自動帶入（唯讀）**：客戶基本資料、印件規格
- **自動帶入（可編輯）**：交期與備註、付款資訊、訂金設定、案名（需求單 title → 訂單 case_name）
- **自動帶入（原值）**：各印件項目的預計產線（QuoteRequestItem.expected_production_lines → PrintItem.expected_production_lines）
- **不帶入**：報價紀錄、活動紀錄

**前置條件**：需求單 SHALL 為「成交」狀態才能執行轉訂單。業務主管 gate 由獨立 change `relocate-sales-manager-approval-from-quote-to-order` 在訂單階段處理（不影響本 Requirement 的轉訂單前提）。

**諮詢來源需求單的諮詢費處理**：當需求單 `linked_consultation_request_id` 非空時，系統 SHALL 於主訂單建立時自動執行：

1. 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment.linked_entity_type 與 linked_entity_id）
2. 在主訂單上建立一筆 `OrderExtraCharge(charge_type = consultation_fee, amount = 諮詢費, description = 諮詢單編號)`
3. 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，主訂單上立即開立諮詢費 Invoice
4. 系統 MUST NOT 建立諮詢訂單（諮詢結束做大貨需求單成交情境下諮詢訂單從未建立）

主訂單應收 = ∑ 印件費 + ∑ OrderExtraCharge（含諮詢費）；主訂單已收 = 轉移過來的諮詢費 Payment + 後續客人補繳；客人實際補繳 = 主訂單應收 - 諮詢費。三方對帳通過。

#### Scenario: 需求單轉訂單時客戶資料帶入

- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 自動帶入客戶基本資料與印件規格，且這些欄位為唯讀狀態

#### Scenario: 需求單轉訂單時交期可編輯

- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 自動帶入交期與備註、付款資訊、訂金設定，且這些欄位允許使用者編輯

#### Scenario: 需求單轉訂單時案名帶入

- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 將需求單的 title 帶入訂單的 case_name 欄位
- **AND** case_name SHALL 允許業務編輯

#### Scenario: 需求單轉訂單時預計產線帶入

- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 將各印件項目的預計產線帶入對應 PrintItem 的 expected_production_lines
- **AND** 帶入後印件的預計產線 SHALL 可繼續編輯

#### Scenario: 需求單轉訂單時報價紀錄不帶入

- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 不帶入報價紀錄與活動紀錄至訂單

#### Scenario: 諮詢來源需求單轉訂單同步處理 Payment 轉移與 OrderExtraCharge

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 2000、印件費 = 4000、Payment 綁 ConsultationRequest
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單
- **AND** 系統 SHALL 在主訂單上建立 OrderExtraCharge（charge_type = consultation_fee、amount = 1000）
- **AND** 系統 MUST NOT 建立諮詢訂單
- **AND** 主訂單應收總額 SHALL = 5000（印件費 4000 + 諮詢費 OrderExtraCharge 1000）
- **AND** 主訂單已收 SHALL = 1000（轉移過來的諮詢費 Payment）
- **AND** 主訂單待繳 SHALL = 4000

---

### Requirement: 印件數量計算規則

系統 MUST 以印件為單位統計生產完成數量。生產任務數量不等於印件數量，須經換算。

換算層級為：印件 -> 工單（每份印件生產數量） -> 生產任務（每份工單需生產數量）。

計算公式如下：

- 工單完成數 = floor(min(各「影響成品」生產任務的 QC 通過數 / 每份工單需生產數量))
- 印件完成數 = floor(min(各工單完成數 / 每份印件生產數量))

#### Scenario: 單一工單多生產任務的工單完成數計算

WHEN 一工單包含生產任務 A（QC 通過 2100，每份工單需生產數量 1000）與生產任務 B（QC 通過 600，每份工單需生產數量 300）
THEN 工單完成數 SHALL 為 floor(min(2100/1000, 600/300)) = floor(min(2.1, 2)) = 2

#### Scenario: 多工單的印件完成數計算

WHEN 印件包含工單 A（工單完成數 2，每份印件生產數量 1000）與工單 B（工單完成數 3，每份印件生產數量 300）
THEN 印件完成數 SHALL 為 floor(min(2/1, 3/1)) = 2（假設每份印件生產數量皆為 1）

---

### Requirement: QC 單數量限制

系統 MUST 確保 QC 可申請數量不超過允許範圍。

可 QC 數量 <= 報工數量 - 其他 QC 單已申請數量

#### Scenario: QC 可申請數量計算

WHEN 某生產任務報工數量為 1000，已有 QC 單申請 700
THEN 系統 SHALL 限制新 QC 單最多可申請 300

#### Scenario: QC 申請超過上限

WHEN 某生產任務報工數量為 1000，已有 QC 單申請 1000，使用者嘗試再申請 QC
THEN 系統 SHALL 阻擋操作並提示可 QC 數量不足

---

### Requirement: 入庫與出貨數量規則

系統 MUST 遵循以下規則：

- 入庫數量僅在 QC 通過後才計入
- 出貨數量不得超過入庫數量

#### Scenario: QC 未通過不計入庫

WHEN 某生產任務 QC 結果為不通過
THEN 該數量 SHALL 不計入入庫數量

#### Scenario: 出貨數量不得超過入庫

WHEN 某印件入庫數量為 500，使用者嘗試出貨 600
THEN 系統 SHALL 阻擋操作並提示出貨數量超過入庫數量

---

### Requirement: 多工單出貨以印件層級統計（齊套性邏輯）

當出貨涉及多個工單時（SHP-002），系統 MUST 以印件層級統計入庫數為基準，執行齊套性邏輯。

#### Scenario: 多工單出貨齊套性檢查

WHEN 一印件包含工單 A（入庫 500 份）與工單 B（入庫 300 份），且每份印件皆需工單 A 與工單 B 各一份
THEN 系統 SHALL 以最小入庫數 300 為該印件可出貨上限

---

### Requirement: 出貨單作廢回算（SHP-003）

出貨單作廢時，系統 MUST 重新計算可出貨額度。

新可出貨額度 = 入庫數量 - (已出貨數量 - 作廢數量)

#### Scenario: 出貨單作廢後額度回算

WHEN 某印件入庫 1000，已出貨 800，其中一筆出貨單（數量 200）被作廢
THEN 新可出貨額度 SHALL 為 1000 - (800 - 200) = 400

---

### Requirement: 預計生產數量下限

預計生產數量由印務決定 buffer，系統 MUST 確保預計生產數量不可小於印件所需數量。

#### Scenario: 預計生產數量低於印件所需

WHEN 印務設定預計生產數量為 900，但印件所需數量為 1000
THEN 系統 SHALL 阻擋並提示預計生產數量不得小於印件所需數量

#### Scenario: 預計生產數量含 buffer

WHEN 印件所需數量為 1000，印務設定預計生產數量為 1100（含 10% buffer）
THEN 系統 SHALL 允許此設定

---

### Requirement: 打樣流程規則

系統 SHALL 支援打樣工單與大貨工單的區分（透過 `WorkOrder.type` 欄位 enum 打樣 / 大貨，見 [work-order spec L825](../work-order/spec.md)），並遵循以下規則：

- 若需打樣，**打樣印件**與**大貨印件** SHALL 同時建立（兩個獨立 PrintItem 實體，各自走獨立審稿流程 + 對應獨立 WorkOrder）
- 打樣印件對應的打樣 WorkOrder 推進至「已完成」後，由業務（owner of 訂單）於打樣 WorkOrder 詳情頁判定打樣結果（`sampleResult` enum，見 [prepress-review spec § 打樣結果業務判定](../prepress-review/spec.md)）
- 打樣決策結果處理（對齊 Prototype 既有實作）：
  - `OK`：打樣通過；業務後續手動建大貨工單 / 進入大貨生產流程（系統不自動建）
  - `NG-製程問題`（製程問題）：業務 UI 自行於同打樣印件下建新打樣 WorkOrder 重做（系統不自動建，保留業務決定權；下游自動化處理機制細節待 OQ AR-13 解後實作）
  - `NG-稿件問題`（稿件問題）：系統 SHALL 自動觸發棄用原打樣印件 + clone 新打樣印件流程（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）；新打樣印件 `sampleResult = 待確認` / `printItemStatus = 待生產` / `reviewStatus = 稿件未上傳`，等待業務重新上傳稿件

#### Scenario: 打樣通過後業務手動建大貨工單

- **WHEN** 業務判定 `sampleResult = OK`
- **THEN** 系統 MUST NOT 自動建大貨工單
- **AND** 業務 SHALL 後續手動建大貨工單 / 進入大貨生產流程

#### Scenario: 打樣失敗因製程問題

- **WHEN** 業務判定 `sampleResult = NG-製程問題`（製程問題）
- **THEN** 系統 SHALL 允許在同一打樣印件下建立新打樣 WorkOrder 重新打樣
- **AND** 該打樣印件審稿維度狀態維持「合格」不動（稿件本身無問題）
- **AND** 系統 MUST NOT 自動建新打樣 WorkOrder（業務 UI 自行建，保留業務決定權）
- **AND** ng_process 下游自動化處理機制細節 SHALL 待 OQ AR-13 解後實作

#### Scenario: 打樣失敗因稿件問題

- **WHEN** 業務判定 `sampleResult = NG-稿件問題`（稿件問題）
- **THEN** 系統 SHALL 自動觸發棄用原打樣印件 + clone 新打樣印件流程：
  - 原打樣印件 `printItemStatus` 轉「已棄用」+ notes 加註棄用說明
  - 系統 clone 原打樣印件至新打樣印件（沿用印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度與印製維度）
  - 新打樣印件 `derived_from_print_item_id` 指向原打樣印件（結構化追溯，本 change 新增 FK 欄位）
  - 新打樣印件等待業務重新上傳稿件 → 進入審稿流程
- **AND** 流程細節詳見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)

---

### Requirement: 稿件管理規則

一個印件 SHALL 可包含多個檔案，並以 ReviewRound（審稿回合）為聚合單位管理。每次審稿人員送出審核皆 MUST 產生一筆 ReviewRound，聚合當輪的原稿、加工檔、縮圖與結果。

**備註欄位雙向切分**（本 change 明確化）：
- 印件 SHALL 持有 **`client_note`**（稿件備註）：會員（B2C）/ 業務（B2B）提供印件時寫給審稿人員的單向說明，印件 1:1、跟著印件走、**不跟 ReviewRound 輪次**。生命週期為印件首次建立時填寫，補件階段不再更新（詳見 [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)）。
- ReviewRound SHALL 持有 **`review_note`**（審稿備註）：審稿人員寫給補件方 / 後續角色的每輪備註，合格 / 不合格皆可填；每輪各自保留不覆寫；**送出後允許原審稿人員修改**，每次修改寫入印件 ActivityLog「審稿備註修改」事件，並於補件方在線時觸發即時通知（詳見 [prepress-review spec § 審稿備註修改稽核](../prepress-review/spec.md)）。
- 印件層 SHALL 透過 `current_round_id → review_note` 顯示最新一筆審稿備註給印務 / 後續角色；審稿備註修改會即時反映於此。

印件的合格稿件版本 SHALL 鎖定於合格輪次（`PrintItem.current_round_id` 指向的 Round）。工單建立時，系統 MUST 鎖定當時 current_round_id 指向的 Round 的**加工檔與縮圖**；後續該印件再經異動或補件重審（產生新輪次）時，已建立的工單 SHALL 不受影響，除非走工單異動流程。**備註不納入鎖定範圍**：工單只鎖檔案，不鎖備註；review_note 後續修改 SHALL 反映於印件層顯示與工單單據可見的最新內容（審稿糾正打錯字能即時傳到下游印務），ActivityLog 保留歷次修改供稽核還原。

歷史 ReviewRound SHALL 完整保留（含原稿、加工檔、備註現值、結果、時間、審稿人員），備註歷次修改紀錄由印件 ActivityLog 提供，供追溯與稽核使用。

#### Scenario: 工單建立時鎖定合格輪次檔案

- **WHEN** 印務為某印件建立工單
- **THEN** 系統 SHALL 鎖定該印件當時 `current_round_id` 指向的 ReviewRound 底下的加工檔與縮圖
- **AND** 後續該印件產生新輪次 SHALL **不**影響已建立的工單
- **AND** review_note 不納入鎖定範圍（見下方 scenario）

#### Scenario: 多輪送審歷史保留

- **GIVEN** 印件經歷 3 輪審稿（第 1 輪不合格、第 2 輪不合格、第 3 輪合格）
- **WHEN** 任一角色檢視印件詳情頁
- **THEN** 系統 SHALL 呈現全部 3 輪的完整紀錄（檔案、結果、備註現值）
- **AND** 備註歷次修改 SHALL 於印件 ActivityLog 中查詢

#### Scenario: 兩種備註欄位的讀取路徑

- **WHEN** 任一角色需查看印件上的文字備註
- **THEN** 系統 SHALL 依語意分流：
  - 會員 / 業務對審稿的稿件說明 → 讀 `PrintItem.client_note`
  - 審稿人員對補件方 / 下游的備註歷史 → 讀各輪 `ReviewRound.review_note`（各輪現值）
  - 印件層最新審稿結論 → 讀 `PrintItem.current_round_id → ReviewRound.review_note`
  - 備註歷次修改軌跡 → 讀印件 ActivityLog「審稿備註修改」事件

#### Scenario: 工單鎖定後審稿備註修改不影響檔案鎖定

- **GIVEN** 印件第 3 輪合格，工單已依此輪建立並鎖定加工檔與縮圖
- **WHEN** 審稿人員回頭修改第 3 輪的 review_note
- **THEN** 系統 SHALL 允許修改並寫入印件 ActivityLog
- **AND** 工單的**檔案**鎖定不受影響（檔案仍為建單當下版本）
- **AND** 工單單據顯示的「審稿備註」SHALL 反映最新版（讓糾正能傳到下游印務）
- **AND** 若需追查工單建立時的備註版本，SHALL 查印件 ActivityLog 的時間序列

### Requirement: 工單分派流程

工單分派 SHALL 依以下順序執行：審稿通過 -> 建工單草稿 -> 分派給印務 -> 印務填寫內容 -> 交付任務 -> 生管分派。

系統 MUST 遵循以下限制：
- 一張訂單可分派給多位印務
- 一張工單僅對應一位印務

#### Scenario: 一訂單多印務分派

WHEN 一張訂單包含三張工單
THEN 系統 SHALL 允許將三張工單分別分派給不同的印務人員

#### Scenario: 一工單僅對應一印務

WHEN 使用者嘗試將同一張工單分派給第二位印務
THEN 系統 SHALL 阻擋操作並提示一張工單僅能對應一位印務

---

### Requirement: 生產任務帶入規則

生產任務的帶入方式 SHALL 依印件類型區分：

- EC 自動產品：系統自動帶入生產任務
- 半客製產品：參照既有範本帶入，允許調整
- 全客製產品：印務手動建立生產任務

#### Scenario: EC 自動產品生產任務帶入

WHEN 工單對應的印件為 EC 自動產品
THEN 系統 SHALL 自動帶入對應的生產任務清單，無須印務手動建立

#### Scenario: 全客製產品生產任務建立

WHEN 工單對應的印件為全客製產品
THEN 系統 SHALL 由印務手動建立生產任務，不自動帶入

---

### Requirement: 數量換算關鍵欄位定義

系統 MUST 於數量換算流程中使用以下三個關鍵欄位，確保印件完成數計算正確：

- quantity_per_print_item（WorkOrder 層級）：完成 1 份印件需要多少份此工單。數值 MUST 大於 0。範例值：1000、0.5。
- quantity_per_work_order（ProductionTask 層級）：完成 1 份工單需要多少份此生產任務。數值 MUST 大於 0。範例值：1、2、0.5。
- affects_product（ProductionTask 層級）：該生產任務的 QC 通過數是否計入工單完成度。值為 TRUE 或 FALSE。

#### Scenario: 關鍵欄位數值驗證

WHEN 使用者設定 quantity_per_print_item 或 quantity_per_work_order 為 0 或負數
THEN 系統 SHALL 阻擋操作並提示「數值必須大於 0」

#### Scenario: 典型欄位設定

WHEN 印務為一張工單建立生產任務「印刷」，設定 quantity_per_work_order = 1、affects_product = TRUE
THEN 系統 SHALL 接受此設定，並將該生產任務的 QC 通過數納入工單完成度計算

---

### Requirement: 四層計算精確流程

系統 MUST 依照以下四層流程計算印件完成數，每層結果向上傳遞：

- 層級 1 生產任務層：`pt_qc_passed = sum(ProductionTaskWorkRecord.passed_quantity where production_task_id = pt.id AND status = '已完成' AND type IN ('qc', 'inspection'))`，加總該生產任務所有 QC / 品檢 WorkRecord 通過數量（依 reclassify-qc change QCRecord 廢止後修正：QC 結果由 ProductionTaskWorkRecord 承載，type=qc 為印件層、type=inspection 為工序層）
- 層級 2 任務層：篩選 affects_product = TRUE 的生產任務 -> 計算 pt_completion_ratio = floor(pt_qc_passed / pt.quantity_per_work_order) -> task_completion = min(所有 completion_ratio)，取最小值（齊套性邏輯）
- 層級 3 工單層：wo_completion = min(該工單下所有任務的 task_completion)
- 層級 4 印件層：wo_completion_ratio = floor(wo_completion / wo.quantity_per_print_item) -> pi_completion = min(所有工單的 wo_completion_ratio) -> 若 pi_completion >= 目標生產數量，則印件狀態推進為「製作完成」

#### Scenario: 簡單 1:1:1 路徑計算

- **WHEN** 印件含 1 工單（quantity_per_print_item = 1），工單含 1 任務，任務含 1 生產任務（quantity_per_work_order = 1、affects_product = TRUE），該生產任務 QC 通過數為 1000
- **THEN** 層級 1 pt_qc_passed = 1000，層級 2 task_completion = floor(1000/1) = 1000，層級 3 wo_completion = 1000，層級 4 pi_completion = floor(1000/1) = 1000

#### Scenario: 複合任務（多生產任務各自倍數）

- **WHEN** 一任務含生產任務 A（quantity_per_work_order = 2、affects_product = TRUE、QC 通過 2100）與生產任務 B（quantity_per_work_order = 1、affects_product = TRUE、QC 通過 900）
- **THEN** 層級 2 計算：A 的 completion_ratio = floor(2100/2) = 1050，B 的 completion_ratio = floor(900/1) = 900，task_completion = min(1050, 900) = 900

#### Scenario: 多工單一印件

- **WHEN** 印件含工單 A（quantity_per_print_item = 1000、wo_completion = 2100）與工單 B（quantity_per_print_item = 300、wo_completion = 700）
- **THEN** 層級 4 計算：A 的 wo_completion_ratio = floor(2100/1000) = 2，B 的 wo_completion_ratio = floor(700/300) = 2，pi_completion = min(2, 2) = 2

### Requirement: 數量計算邊界防呆

系統 MUST 針對數量計算過程中的邊界情況執行防呆檢查：

- 當一個任務內所有生產任務的 affects_product 皆為 FALSE 時，系統 SHALL 提示錯誤「至少需有一個生產任務影響成品」。
- quantity_per_work_order 範圍檢查：值 <= 0 時 SHALL 回傳 ERROR 阻擋儲存；值 > 10000 時 SHALL 顯示 WARNING 提醒印務確認。
- 當 pi_completion = 0 時，UI MUST 顯示缺口資訊，格式為「已完成 X / Y（缺口 Z）」。

#### Scenario: 所有生產任務 affects_product 為 FALSE

WHEN 印務建立一個任務，其所有生產任務的 affects_product 皆設為 FALSE
THEN 系統 SHALL 阻擋儲存並提示「至少需有一個生產任務影響成品」

#### Scenario: quantity_per_work_order 超出合理範圍

WHEN 印務設定某生產任務的 quantity_per_work_order 為 15000
THEN 系統 SHALL 顯示警告「數值超過 10000，請確認是否正確」，但允許儲存

#### Scenario: 印件完成數為 0 時顯示缺口

WHEN 印件目標為 1000，目前 pi_completion = 0，最接近完成的工單已完成 500 份
THEN UI SHALL 顯示「已完成 0 / 1000（缺口 1000）」，讓使用者明確知曉生產缺口

---

### Requirement: 異動流程數量重算

系統 MUST 在數量相關欄位異動時自動觸發重算：

- 新增生產任務時：系統 SHALL 以該任務現有生產任務的平均 quantity_per_work_order 為建議值，印務主管可覆寫。
- 修改 affects_product 時：系統 SHALL 重算工單完成數，並於修改前提示「修改將重新計算工單完成數，是否確認？」。

#### Scenario: 新增生產任務的建議值

WHEN 一任務已有生產任務 A（quantity_per_work_order = 2）與 B（quantity_per_work_order = 4），印務新增生產任務 C
THEN 系統 SHALL 預設 C 的 quantity_per_work_order 為 3（平均值），印務主管可修改

#### Scenario: 修改 affects_product 觸發重算

WHEN 印務將某生產任務的 affects_product 從 FALSE 改為 TRUE
THEN 系統 SHALL 提示「修改將重新計算工單完成數，是否確認？」，確認後重算工單完成數並更新印件完成數

---

### Requirement: 出貨建立時機與防呆條件

系統 MUST 依工單類型區分出貨前置條件：

- 打樣出貨：打樣工單 QC 須達標後方可建立出貨。
- 大貨出貨：印件狀態為「製作進行中」或「製作完成」皆可建立出貨。

出貨明細防呆規則：

- 本次出貨數量 MUST <= 該印件累計 QC 入庫數量 - 已出貨數量。
- 若該印件 QC 入庫數量 = 0，系統 SHALL 阻擋建立出貨明細。

#### Scenario: 打樣出貨防呆

WHEN 打樣工單尚未完成 QC 或 QC 未達標，使用者嘗試建立打樣出貨
THEN 系統 SHALL 阻擋操作並提示「打樣工單 QC 須達標後方可建立出貨」

#### Scenario: 大貨分批出貨防呆

WHEN 某印件累計 QC 入庫 800、已出貨 500，使用者嘗試建立出貨明細數量 400
THEN 系統 SHALL 阻擋操作並提示「本次出貨數量（400）超過可出貨餘額（300）」

#### Scenario: QC 入庫為 0 阻擋出貨

WHEN 某印件 QC 入庫數量為 0，使用者嘗試建立該印件的出貨明細
THEN 系統 SHALL 阻擋操作並提示「該印件尚無 QC 入庫，無法建立出貨明細」

---

### Requirement: 分批出貨累計控制

系統 MUST 對分批出貨進行累計控制：

- 累計限制（警告非阻擋）：跨所有出貨單的出貨明細數量總和（SUM 出貨明細數量）超過目標生產數量時，系統 SHALL 顯示警告但不阻擋。
- 累計送達判斷：當跨所有出貨單的送達數量總和（SUM 送達數量）>= 目標生產數量時，印件狀態 SHALL 推進為「已送達」。

#### Scenario: 分批出貨累計

WHEN 印件目標 1000，第一批出貨 600 已送達，第二批出貨 400 已送達，SUM 送達數量 = 1000
THEN 系統 SHALL 將印件狀態推進為「已送達」

#### Scenario: 超過目標警告

WHEN 印件目標 1000，已出貨累計 900，使用者建立新出貨明細數量 200（累計將達 1100）
THEN 系統 SHALL 顯示警告「累計出貨數量（1100）超過目標生產數量（1000）」，但允許建立

---

### Requirement: 出貨單與印件雙層狀態映射

系統 MUST 依出貨單狀態與累計送達情況，自動映射印件出貨狀態：

- 出貨單狀態為「出貨中」（自行配送）或「已出貨」（第三方物流）時，對應印件狀態 SHALL 為「出貨中」。
- 累計已送達數量 >= 目標生產數量時，印件狀態 SHALL 推進為「已送達」。
- 出貨單出現異常狀態時，印件 SHALL 維持「出貨中」，不自動變更。

#### Scenario: 狀態映射規則驗證

WHEN 某印件有兩筆出貨單，出貨單 A 狀態為「已送達」（送達 600），出貨單 B 狀態為「出貨中」（尚未送達），目標為 1000
THEN 印件狀態 SHALL 為「出貨中」，因累計送達 600 < 目標 1000

---

### Requirement: 多印件合併出貨

系統 MUST 支援一筆出貨單包含多個印件的合併出貨。出貨單結構 SHALL 採用明細結構：出貨單 { type, 出貨明細: [{ 印件 ID, 本次出貨數量 }] }。

每筆出貨明細 SHALL 獨立適用出貨防呆規則（本次出貨數量 <= 該印件可出貨餘額）。

#### Scenario: 合併出貨建立

WHEN 使用者建立一筆出貨單，包含印件 A（出貨 500）與印件 B（出貨 300），兩印件可出貨餘額分別為 600 與 400
THEN 系統 SHALL 允許建立此出貨單，出貨明細包含兩筆紀錄，各印件出貨數量皆未超過可出貨餘額

---

### Requirement: 報價單印件填寫原則

報價單建立印件時，MUST 遵循以下原則：

- 同批商品一起出貨：合併為一個印件
- 各別獨立出貨：拆為多個印件
- 打樣與大貨：分開建立

#### Scenario: 同批商品合併印件

WHEN 業務為同一批次出貨的商品建立報價單
THEN 業務 SHALL 將這些商品合併為一個印件

#### Scenario: 獨立出貨拆分印件

WHEN 業務為需各別獨立出貨的商品建立報價單
THEN 業務 SHALL 將每項商品拆為獨立印件

#### Scenario: 數量計算範例 -- 1式含多工單

WHEN 報價為 1 式 = 1000 個專輯 + 300 本歌詞本，印件數量為 1
THEN 系統 SHALL 建立工單 A（專輯，每份印件生產數量 = 1000）與工單 B（歌詞本，每份印件生產數量 = 300），印件完成數依齊套性邏輯計算

---

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

### Requirement: 審稿階段流程

業務流程「審稿階段」SHALL 遵循下列順序：

1. **觸發**：訂單付款成功（B2C）或訂單建立並付款（B2B）→ 系統執行自動分配演算法（見 prepress-review capability）
2. **首審**：被分配的審稿人員下載原稿、加工、上傳加工檔與縮圖、送審 → 結果為「合格」或「不合格」
3. **分支 A（合格）**：印件進入「合格」終態 → 系統依訂單來源分流建工單：
   - **B2C 訂單**：商品主檔已定義材料 / 工序 / 裝訂，系統 SHALL 自動建立工單並帶入生產任務（工單 + 生產任務一次建齊）
   - **B2B 訂單**：系統 SHALL 建立空工單草稿，生產任務由印務主管後續手動拆分（沿用 user-roles spec 既有「印務主管分配工單給印務」流程）
4. **分支 B（不合格）**：印件進入「不合格」狀態，ReviewRound 記錄 `reject_reason_category`（LOV 必填，見 PI-009）與 `review_note`（選填補充）→ 系統通知補件方（B2C 客戶 / B2B 業務），通知內容含分類與備註 → 補件方上傳補件 → 印件進入「已補件」→ 回到原審稿人員再審 → 回到步驟 2

免審稿印件 SHALL 跳過步驟 1-2，系統直接建立 `source=免審稿` 的 ReviewRound（見 prepress-review spec），印件狀態直接為「合格」，並按分支 A 流程繼續。

**合格為終態**：合格後若需變更印件內容 SHALL 透過「棄用原印件 + 建立新印件」處理，不回退至審稿階段。

#### Scenario: 付款後觸發自動分配

- **WHEN** 訂單付款成功
- **AND** 訂單內存在未走免審路徑的印件
- **THEN** 系統 SHALL 對每一筆印件執行自動分配演算法
- **AND** 分配結果 SHALL 記錄於該印件的 ActivityLog

#### Scenario: B2C 合格後自動建工單並帶入生產任務

- **GIVEN** 印件屬於 B2C 訂單，對應商品主檔已定義材料 / 工序 / 裝訂
- **WHEN** 審稿人員送審為「合格」（或免審路徑自動合格）
- **THEN** 系統 SHALL 自動建立工單
- **AND** 系統 SHALL 依商品主檔的工序定義自動建立對應生產任務
- **AND** 印務主管 SHALL 不需額外操作即可進入後續派工

#### Scenario: B2B 合格後建立空工單草稿

- **GIVEN** 印件屬於 B2B 訂單（自需求單建立）
- **WHEN** 審稿人員送審為「合格」
- **THEN** 系統 SHALL 建立一張空工單草稿（僅帶入印件基本資訊，生產任務為空）
- **AND** 印務主管 SHALL 於工單草稿中手動拆分生產任務並指派印務

#### Scenario: 免審稿印件跳過審稿階段並建立 source=免審稿 Round

- **GIVEN** 印件走免審稿快速路徑
- **WHEN** 訂單付款成功
- **THEN** 系統 SHALL 建立 `source=免審稿, result=合格, reviewer_id=NULL` 的 ReviewRound
- **AND** 設 PrintItem.current_round_id 指向此 Round
- **AND** 印件 SHALL 不進入自動分配與審稿人員待審列表
- **AND** 系統依 B2C / B2B 分流執行合格後建工單流程

---

### Requirement: 補件流程

當印件進入「不合格」狀態時，補件流程 SHALL 依訂單來源分流：

- **B2C 訂單**：補件由會員於電商前台自助完成；電商系統呼叫 ERP 介面回寫新檔並觸發狀態轉移
- **B2B 訂單**：補件由業務於 ERP 訂單詳情頁的印件入口完成

補件完成後，印件 SHALL 進入「已補件」狀態，並重新加入**原審稿人員**的待審列表（不重新執行自動分配）。若原審稿人員目前標註為不在崗，則待審案件 SHALL 於審稿主管覆寫清單中顯示，待主管轉指派後方能進入新審稿人員的待審列表。

#### Scenario: B2C 補件由電商前台觸發

- **GIVEN** B2C 印件處於「不合格」狀態
- **WHEN** 會員於電商前台上傳新檔案
- **THEN** 電商系統 SHALL 呼叫 ERP 補件介面
- **AND** ERP SHALL 新增補件檔案並將印件狀態轉為「已補件」

#### Scenario: B2B 補件由業務於訂單詳情頁觸發

- **GIVEN** B2B 印件處於「不合格」狀態
- **WHEN** 業務於訂單詳情頁點選該印件的「補件」入口並上傳新檔
- **THEN** ERP SHALL 新增補件檔案並將印件狀態轉為「已補件」

#### Scenario: 補件回原審稿人員

- **WHEN** 印件狀態由「不合格」轉為「已補件」
- **AND** 原審稿人員可用狀態為「在崗」
- **THEN** 系統 SHALL 將此印件加入原審稿人員的待審列表
- **AND** 系統 SHALL **不**重新執行自動分配演算法

### Requirement: 訂單異動執行流程

訂單成立後，業務 / 諮詢 SHALL 可建立 OrderAdjustment 處理應收金額異動。OrderAdjustment MUST 走獨立狀態機，**不影響主訂單狀態**。已執行時系統 SHALL 自動重算訂單應收總額，但 BillingInstallment（請款期次）SHALL NOT 自動變動。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止 v1.2 「雙重身份」設計（`adjustment_phase` + UI「售後服務單」）。OrderAdjustment 不再依 Order.status 推算 phase，所有 adjustment_type（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）皆可於任何 Order 狀態下選用。

**售後事件改走 AfterSalesTicket**：Order.status = 已完成後的客訴 / 不良 / 規格不符等售後事件改建 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。AfterSalesTicket 內部依 resolution（不處理 / 退款 / 補印 / 退款+補印）決定是否建關聯 OrderAdjustment：

- **不處理**：不建 OrderAdjustment（ticket 直接結案）
- **退款**：ticket 內建 OrderAdjustment(adjustment_type=退印, amount=-退款額, linked_after_sales_ticket_id=此 ticket)
- **補印免費**：不建 OrderAdjustment，僅建補印 PrintItem 走原審稿 / 工單流程
- **補印收費**：ticket 內建 OrderAdjustment(adjustment_type=補退, amount=+補印費, linked_after_sales_ticket_id=此 ticket) + 建補印 PrintItem

**建立與審核流程（本 change MODIFY 既有「業務點執行」描述為「Payment 切已完成累計達 OA.amount 自動推進」）**：

1. 業務於訂單詳情頁點擊「建立訂單異動單」（或於 AfterSalesTicket 內部建關聯異動），填入 adjustment_type、reason；新增多筆明細項（item_type = print_item / fee，描述、金額）
2. 系統自動加總 OrderAdjustment.amount = ∑明細金額
3. OrderAdjustment.status = 草稿；業務點擊「提交審核」後 → 待主管審核
4. 業務主管核可（→ 已核可）或退回（→ 已退回，業務修改後重交）
5. **業務於 OA 編輯介面建立關聯 Payment（處理中態）**：點 OA row 開編輯 dialog，下半「新增 Payment」入口，依 OA 正負自動預填 paymentMethod
   - OA 為退款型（amount < 0）：預填 paymentMethod = '退款'、amount ≤ 0
   - OA 為補收型（amount > 0）：預填 paymentMethod 為非「退款」項（如「銀行轉帳」）、amount ≥ 0
6. **業務後續補齊資料切「已完成」**：點 Payment row 編輯 dialog，補 paidAt、上傳對帳附件 ≥ 1 個、切 paymentStatus → '已完成'、點「儲存」
7. **系統自動推進 OA 至已執行**：對應 OA 的所有已完成 Payment 累計 amount = OA.amount（含符號比較）時，同 transaction 推進 OA.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點
8. 系統重算訂單應收總額；BillingInstallment（請款期次）不自動變動

**對稱化（本 change BREAKING 棄用「自動建補收 Payment」既有設計）**：補收 OA 與退款 OA 共用上述 5-7 步驟（業務手動建處理中 Payment + 切已完成）。原既有「執行加印 OA 系統自動建補收 Payment」邏輯廢止。

**執行後提示**：

- 含 item_type = print_item 的明細：顯示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- 執行時點晚於 Order.completed_at（執行時點跨越訂單完成日）：對帳檢視面板顯示警示 banner「歷史對帳需重新核對」（觸發條件詳見 [order-management spec § 對帳警示 banner 觸發條件](../order-management/spec.md)）
- AfterSalesTicket 關聯 OrderAdjustment 執行後：ticket 內「關聯 OrderAdjustment 卡片」更新狀態為「已執行」

**後續關聯動作**（業務手動）：

- 加印追加（amount > 0，訂單期間）：業務於訂單詳情頁編輯 PrintItem（新增一筆），走原審稿 / 工單流程；後續視情境開立發票（增開的 Invoice）
- 規格變更（amount 可正可負，訂單期間）：業務於訂單詳情頁編輯 PrintItem。判定原則：打樣 NG 稿件問題或追加印製數量則新建 PrintItem，其他規格變更修改原 PrintItem
- 退印 / 折扣（amount < 0）：若已開過發票，業務開立 SalesAllowance（折讓）+ 關聯退款 Payment；若發票尚可作廢則作廢重開
- 售後補印（ticket 觸發）：業務於 AfterSalesTicket 內建補印 PrintItem，走原審稿 / 工單流程；補印收費時 ticket 內另建關聯 OrderAdjustment
- 業務手動調整 BillingInstallment（請款期次，如新增一期 / 修改未收期金額）

**處理中 Payment 期間禁止觸發 SalesAllowance（resolve ORD-004）**：

業務在 OA 編輯介面建立處理中退款 Payment 時，若關聯訂單已開過發票，系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示。SalesAllowance 相關提示僅在退款 Payment 切「已完成」後觸發，避免「對帳資料未齊備就開折讓單」的會計不確定性。

#### Scenario: 加印追加完整流程（MODIFY 對稱化，棄用自動建補收 Payment）

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務建立 OrderAdjustment（adjustment_type = 加印追加，明細：item_type = print_item，描述 = 加印 200 份，金額 = +20,000）→ 提交審核 → 主管核可
- **THEN** OrderAdjustment.status SHALL → 已核可（NOT 自動建補收 Payment，棄用既有設計）
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件 + 至 OA 編輯介面建立補收 Payment」
- **AND** 業務後續手動：
  - (a) 至訂單詳情頁新增 PrintItem「加印 200 份」走審稿 / 工單流程
  - (b) **於 OA 編輯介面內點「新增 Payment」建補收 Payment P-002（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中'）**
  - (c) 客戶實際匯款後業務補 P-002 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
  - (d) 系統自動推進 OA → '已執行'、訂單應收總額增加 +20000
  - (e) 業務開立 Invoice #2（20,000）

#### Scenario: 退印完整流程（訂單期間、已開發票，MODIFY 兩階段）

- **GIVEN** Invoice #1 = 100,000 已開立、訂單未完成
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務建立 OrderAdjustment（adjustment_type = 退印，明細：item_type = fee，描述 = 品質投訴退款，金額 = -10,000）→ 提交審核 → 主管核可
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 業務於 OA 編輯介面建退款 Payment P-010（amount = -10,000, paymentMethod = '退款', paymentStatus = '處理中'）
- **AND** 系統 SHALL NOT 自動建立 SalesAllowance（處理中期間禁止觸發，resolve ORD-004）
- **WHEN** 業務實際匯款給客戶後，補 P-010 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
- **THEN** 系統自動推進 OA → '已執行'、訂單應收總額 = 90,000
- **AND** 業務後續手動：開立 SalesAllowance #1（-10,000，關聯 Invoice #1）+ 手動連結 SalesAllowance.refund_payment_id = P-010.id

#### Scenario: 售後退款完整流程（透過 AfterSalesTicket，MODIFY 兩階段）

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15、Invoice #1 = 100,000 已開立並跨期申報
- **WHEN** 客戶於 2026-05-21 反映 5,000 元瑕疵，業務於訂單詳情頁建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 退款）
- **THEN** AfterSalesTicket.status SHALL → 受理中 → 處理中
- **AND** 業務於 ticket 內建 OrderAdjustment OA-020(adjustment_type = 退印, amount = -5,000, linked_after_sales_ticket_id = 此 ticket) → 提交審核 → 主管核可
- **AND** 業務於 OA-020 編輯介面建退款 Payment P-020（amount = -5,000, paymentMethod = '退款', paymentStatus = '處理中'）
- **AND** OA-020 維持「已核可」狀態（處理中 Payment 不推進 OA）
- **WHEN** 業務實際匯款給客戶後，補 P-020 的 paidAt + 對帳附件、切 paymentStatus → '已完成'
- **THEN** 系統自動推進 OA-020.status → '已執行'、executedAt = P-020 切已完成的時點
- **AND** 因 OA-020.executed_at > Order.completed_at，對帳檢視面板 SHALL 顯示警示 banner
- **AND** 業務後續手動：開 SalesAllowance（-5,000，關聯 Invoice #1）+ 手動連結 SalesAllowance.refund_payment_id = P-020.id
- **AND** 業務確認客戶滿意後點「結案」推進 ticket.status → 已結案

#### Scenario: 售後不處理流程（透過 AfterSalesTicket）（不變，沿用既有）

- **GIVEN** 訂單 SO-003 狀態 = 已完成
- **WHEN** 客戶反映輕微瑕疵但不嚴重，業務於 ticket 上跟主管討論後決議「公司認賠不處理」
- **THEN** 業務建立 AfterSalesTicket（case_category = 印件瑕疵、responsibility = 公司認賠、resolution = 不處理）
- **AND** ticket.status SHALL → 處理中
- **AND** 系統 MUST NOT 建立 OrderAdjustment、PrintItem、Payment 任何下游動作
- **AND** 業務點「結案」推進 ticket.status → 已結案
- **AND** 訂單應收 / 發票 / 收款均不變動，三方對帳不受影響

#### Scenario: 訂單異動不阻擋主流程（不變，沿用既有）

- **GIVEN** 訂單狀態 = 生產中，OrderAdjustment.status = 待主管審核
- **WHEN** 工單交付完成觸發 bubble-up
- **THEN** 訂單狀態 SHALL 推進至「出貨中」
- **AND** OrderAdjustment 維持「待主管審核」獨立狀態

### Requirement: 發票異動流程（作廢、折讓、改買受人）

業務 / 諮詢 SHALL 處理發票異動的三種情境，依情境選擇對應流程：

**情境 A：發票錯誤可作廢**（同期未交付未申報，藍新 Mockup 階段不檢查申報期）
- 業務於 Invoice 詳情頁點擊「作廢」，填入 invalid_reason
- Invoice.status → 作廢
- 字軌號碼不重用，新發票流水 +1

**情境 B：客戶要求改買受人（如統編打錯）**
- 業務作廢原 Invoice（情境 A 流程）
- 業務開立新 Invoice（帶入正確買受人）
- 不額外設計「換開」捷徑

**情境 C：已開發票後客戶要求金額調整（先退款，再決定折讓 / 作廢）**

實務步驟（業務 / 諮詢 SHALL 依此順序）：
1. 業務於訂單詳情頁建立退款 Payment（amount 為負數、payment_method = 「退款」、可選關聯 BillingInstallment 請款期次）
2. 視情境決定後續：
   - **路徑 a（保留發票走折讓）**：適合已交付買方、跨期或不適合作廢的情境。業務於 Invoice 詳情頁點擊「開立折讓」，填入 allowance_amount（負數）、reason。系統 Mockup 兩段式：開立折讓 + 觸發確認折讓 → SalesAllowance.status = 已確認。業務手動關聯 SalesAllowance.refund_payment_id 至步驟 1 的退款 Payment。
   - **路徑 b（作廢重開）**：適合發票錯誤可作廢的情境（如金額誤填）。業務作廢原 Invoice、開立新 Invoice。退款 Payment 不需關聯 SalesAllowance（直接作為訂單級退款記錄）。
3. 已確認折讓可作廢（→ 已作廢，發票回到折讓前狀態，refund_payment_id 自動取消關聯）

**約束**：
- 折讓金額 |allowance_amount| MUST ≤ 該發票尚未折讓的剩餘金額
- 折讓 + 退款不需主管核可（業務 / 諮詢可單獨執行）
- 作廢不需主管核可（業務 / 諮詢可單獨執行）
- 系統 SHALL NOT 在折讓建立時自動建立 Payment（D12 折讓 / 退款分離原則）

#### Scenario: 客戶要求改公司名（情境 B）

- **GIVEN** Invoice #1 buyer_name = "錯誤公司名"，已開立
- **WHEN** 業務作廢 Invoice #1（reason = 公司名錯誤）
- **AND** 業務開立 Invoice #2（buyer_name = "正確公司名"）
- **THEN** Invoice #1.status SHALL = 作廢
- **AND** Invoice #2 SHALL 為新紀錄，ezpay_merchant_order_no 流水 +1

#### Scenario: 折讓 + 退款流程（情境 C 路徑 a）

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先建立退款 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance #1（allowance_amount = -10,000、reason = 品質投訴）
- **AND** 業務手動關聯 SalesAllowance.refund_payment_id = 步驟 1 的退款 Payment
- **THEN** SalesAllowance.status SHALL → 已確認
- **AND** Invoice #1 剩餘可折讓金額 SHALL = 90,000
- **AND** 系統 SHALL NOT 自動建立任何 Payment（折讓 / 退款分離原則）

#### Scenario: 折讓金額超過剩餘可折讓金額被擋

- **GIVEN** Invoice = 100,000 已有 SalesAllowance #1 = -50,000（已確認）
- **WHEN** 業務嘗試開立 SalesAllowance #2 = -60,000
- **THEN** 系統 SHALL 拒絕並提示「折讓金額不可超過發票剩餘 50,000」

### Requirement: 三方對帳計算規則

訂單詳情頁的對帳檢視面板與會計批次對帳檢視 SHALL 依下列規則計算三個總額：

```
應收總額 = Order.total_with_tax + ∑ OrderAdjustment.amount
          where OrderAdjustment.status = 已執行

發票淨額 = ∑ Invoice.total_amount where Invoice.status = 開立
        - ∑ |SalesAllowance.allowance_amount| where SalesAllowance.status = 已確認

收款淨額 = ∑ Payment.amount
          含正數（一般收款）與負數（退款）

差額 = 應收總額 - 發票淨額（衡量「未開發票」的金額）
差額 = 應收總額 - 收款淨額（衡量「未收款」的金額）
```

對帳通過條件：應收總額 = 發票淨額 = 收款淨額（三者一致，差額 = 0）。

**作廢的 Invoice / SalesAllowance 不參與計算**：避免雙重扣減。

#### Scenario: 對帳通過

- **GIVEN** Order.total_with_tax = 100,000、OrderAdjustment 無、開立 Invoice 合計 100,000、SalesAllowance 無、Payment 合計 100,000
- **WHEN** 系統計算三方對帳
- **THEN** 應收 = 發票淨額 = 收款淨額 = 100,000，差額 = 0

#### Scenario: 含異動 + 折讓 + 退款的對帳

- **GIVEN** Order.total_with_tax = 100,000、OrderAdjustment +20,000（已執行）、開立 Invoice 合計 130,000、已確認 SalesAllowance -10,000、Payment 合計 130,000、退款 Payment -10,000
- **WHEN** 系統計算三方對帳
- **THEN** 應收 = 120,000、發票淨額 = 120,000、收款淨額 = 120,000、差額 = 0

#### Scenario: 作廢發票不參與計算

- **GIVEN** 開立 Invoice #1 = 100,000、Invoice #2 = 100,000，其中 Invoice #1 已作廢
- **WHEN** 系統計算發票淨額
- **THEN** 發票淨額 SHALL = 100,000（僅計算 Invoice #2）

### Requirement: 報價單印件填寫原則 — 帳務公司延伸

需求單 / 報價單建立時 SHALL 同時指定接單公司（account_company）與帳務公司（billing_company_id）。兩者為**獨立欄位**，業務分別填寫；UI 軟性提示「該接單公司近期常用帳務公司」（不強制）。需求單成交轉訂單時，billing_company_id 隨之帶入訂單。

#### Scenario: 業務於需求單填寫接單公司與帳務公司

- **WHEN** 業務於需求單編輯頁分別選 account_company（如 SSP 感官）與 billing_company（如 帳務公司 A）
- **THEN** 系統 SHALL 寫入兩個獨立欄位
- **AND** UI SHALL 在 billing_company 選項顯示「該接單公司近 30 天最常用：[X]」軟性提示

### Requirement: 諮詢前置流程端到端規則

當客人於 surveycake 表單付款成功觸發 webhook 後，系統 SHALL 依以下端到端流程處理：

```
[客人] surveycake 填表 → 付款成功 (webhook)
        ↓
ConsultationRequest 自動建立 (status=待諮詢, cancel_reason_category=NULL)
+ Payment(linked_entity_type=ConsultationRequest, amount=+2000, status=已完成)
（不建任何 Order）
        ↓
諮詢人員自我認領 consultant_id (status=待諮詢)
（諮詢人員自行認領；業務主管亦可代為認領，詳見 consultation-request spec § 諮詢人員認領）
        ↓
諮詢人員與客戶討論（諮詢進行不在 status 機，v2 簡化）
（諮詢人員可於 consultant_note 編輯溝通記錄，客戶原話 consultation_topic 唯讀）
        ↓
諮詢人員「結束諮詢」分支：
  ├ 不做大貨 → 建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  │           Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  │           系統自動建 BillingInstallment(scheduled_amount=2000, description=「諮詢費」,
  │                                    due_date=當天, source_type=consultation_end_no_production,
  │                                    invoicing_status=未開立, created_by=system)
  │           （MUST NOT 自動開立 Invoice、不論 consultation_invoice_option 值）
  │           諮詢訂單即時推進至「訂單完成」
  │           ConsultationRequest 狀態 = 完成諮詢
  │           後續：諮詢人員手動將 BillingInstallment 一鍵開立 Invoice
  │
  └ 做大貨 → 建需求單 (status=需求確認中)
            ConsultationRequest 狀態 = 已轉需求單
            Payment 維持綁 ConsultationRequest
            （MUST NOT 建任何 Order、MUST NOT 建任何 BillingInstallment）
            （需求單 requirement_note 自 consultation_topic + consultant_note 雙區塊合併帶入）
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務「轉訂單」 (Order, type=線下)
            （訂單階段業務主管 gate 由獨立 change 處理）
                + Payment(+2000) 從 ConsultationRequest 轉移至一般訂單
                + 一般訂單建立 OrderExtraCharge(consultation_fee, +2000)
                + 諮詢費 BillingInstallment 不自動建（業務於主訂單既有發票時程規劃流程自行加入；
                  可參考 consultation_invoice_option 客戶意向決定獨立 / 併入其他 BillingInstallment）
                ↓
            訂單流程：報價待回簽 → ... → 訂單完成

需求單在議價中或更早任何狀態流失（做大貨分支的另一條路徑）：
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  → Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  → 系統自動建 BillingInstallment(scheduled_amount=2000, description=「諮詢費」,
                              due_date=當天, source_type=quote_lost,
                              invoicing_status=未開立, created_by=system)
  → （MUST NOT 自動開立 Invoice、不論 consultation_invoice_option 值）
  → 諮詢訂單即時推進至「訂單完成」
  → ConsultationRequest 狀態從「已轉需求單」更新為「完成諮詢」

待諮詢取消（半額退費）：
  → 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並確認
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  → Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單（status 維持已完成）
  → 系統自動建 OrderAdjustment(-1000, type=諮詢取消退費, status=已核可, approved_by=system,
                              executed_at=NULL, requires_supervisor_approval=false)
  → 系統自動建退款 Payment(-1000, paymentMethod=退款, paymentStatus=處理中,
                          linkedOrderAdjustmentId=上述 OA.id)
  → （MUST NOT 為諮詢取消自動建待開發票：留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）
  → （MUST NOT 自動開立 Invoice 或 SalesAllowance、不論 consultation_invoice_option 值）
  → 諮詢訂單 status 直接 = 已取消、paymentStatus = 已付款（諮詢取消不需製作 / 退款中間態）
  → ConsultationRequest 狀態 = 已取消、cancel_reason_category 寫入 dialog 選定值
  → 退款撥付：依原付款方式刷退、由第三方金流處理
  → 客戶通知：諮詢人員手動執行（不入系統）
        ↓
諮詢人員後續手動動作（諮詢訂單已是「已取消」、以下為已取消後的金流 / 稅務動作）：
  ├ 處理銀行退款金流 → 將退款 Payment 切「已完成」並上傳退款證明附件
  │   （累計達 -1000 推進 OA「已執行」；金流完結、不影響「已取消」終態）
  └ 業務手動開立 Invoice（金額由業務 / 諮詢人員依客戶需求決定，建議 1000 元；未開票由對帳差額警示兜底）
```

**諮詢費的對帳邏輯（本 change 後）**：

- 諮詢結束**不做大貨**：建諮詢訂單收尾，應收 = OEC(2000) = 收款 = 2000；發票淨額由諮詢人員手動開立決定（建議 2000 元）
- 諮詢結束**做大貨 + 需求單成交**：Payment 轉至一般訂單，一般訂單應收含 OEC(2000)，三方對帳通過；諮詢費 BillingInstallment 由業務於主訂單發票時程規劃自行加入
- 諮詢結束**做大貨 + 需求單流失**：建諮詢訂單收尾（複用「不做大貨」路徑），對帳通過；自動建 BillingInstallment 2000
- **待諮詢取消（半額退費）**：應收 = OEC(2000) + OA(-1000) = 1000（OA 退費處理中為已核可、退費完成推進已執行，皆計入應收）；收款淨額 = +2000 - 1000 = 1000（兩筆 Payment 都已完成）；發票淨額由業務 / 諮詢人員手動開立決定（建議 1000 元、系統不自動建待開發票、未開票由對帳差額警示兜底）；標示「對帳通過 - 退費完成」（既有 [order-management § 諮詢取消對帳邏輯](../order-management/spec.md)）；訂單終態 = 已取消（見 state-machines § 諮詢取消諮詢訂單終態收斂）

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾。複用單一收尾流程，不增加新訂單類型。諮詢費 Invoice 統一由諮詢人員 / 業務手動開立（廢止 `consultation_invoice_option` 對發票自動化的影響）；不做大貨 / 需求單流失情境系統自動建待開發票提醒、諮詢取消情境系統 MUST NOT 自動建待開發票（未開票由對帳差額警示兜底）。終態分流：不做大貨 / 需求單流失 = 訂單完成、諮詢取消 = 已取消。

**`consultation_invoice_option` 欄位定位變更**：本 change 後此欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示，**不再驅動系統行為**（不影響 Invoice / SalesAllowance / BillingInstallment 的自動建立或不建立）。業務於主訂單發票時程規劃時可參考此意向。

#### Scenario: 諮詢費走「不做大貨」分支端到端

- **GIVEN** 客人 surveycake 付諮詢費 2000 元（`consultation_invoice_option = defer_to_main_order`）
- **WHEN** webhook 觸發
- **THEN** 系統 SHALL 建立 ConsultationRequest（待諮詢）+ Payment（綁 ConsultationRequest、amount = +2000、status = 已完成）
- **AND** 系統 MUST NOT 建立任何 Order
- **WHEN** 諮詢人員結束諮詢選擇「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、description = 「諮詢費」、source_type = consultation_end_no_production、invoicing_status = 未開立）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 = 完成諮詢
- **AND** 諮詢人員 SHALL 後續手動將 BillingInstallment 一鍵開立 Invoice

#### Scenario: 諮詢費走「做大貨 + 需求單成交」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、後續需求單議價成交報價總額 4000 元（印件費）
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **AND** 系統 MUST NOT 建立任何 BillingInstallment
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 一般訂單應收 = 6000、已收 = 2000、待繳 = 4000
- **AND** 系統 MUST NOT 自動於主訂單建立諮詢費的 BillingInstallment（業務自行規劃）
- **AND** 業務 SHALL 可參考 `consultation_invoice_option` 客戶意向決定主訂單發票時程

#### Scenario: 諮詢費走「做大貨 + 需求單流失」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、Payment 綁 ConsultationRequest
- **WHEN** 後續需求單於議價中流失
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、description = 「諮詢費」、source_type = quote_lost、invoicing_status = 未開立）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 待諮詢取消半額退費端到端

- **GIVEN** 客人付諮詢費 2000 元（`consultation_invoice_option = issue_now` 或 `defer_to_main_order` 任一值）、ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id` = 諮詢人員 A
- **WHEN** 客人取消預約、諮詢人員 A 點擊「取消諮詢」按鈕、於 dialog 選定 `cancel_reason_category = 找到其他廠商` 並確認
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment(+2000) 從 ConsultationRequest 轉移
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id）
- **AND** 系統 MUST NOT 為諮詢取消自動建待開發票（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance（不論 `consultation_invoice_option` 值為何）
- **AND** 諮詢訂單 status SHALL 直接推進至「已取消」、paymentStatus = 已付款（諮詢取消不需製作 / 退款中間態）
- **AND** 退款 Payment 維持「處理中」（已取消後的金流動作）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** ConsultationRequest.cancel_reason_category SHALL = `找到其他廠商`
- **WHEN** 諮詢人員 A 處理銀行退款金流後、於 OA 編輯介面將退款 Payment 切「已完成」並上傳退款證明
- **THEN** 退款 Payment.paymentStatus SHALL 改為「已完成」（金流完結）
- **AND** 系統 SHALL 重算 OA 對應已完成 Payment 累計 = -1000 = OA.amount、推進 OA status → 已執行、executed_at = now
- **AND** 諮詢訂單 status MUST 維持「已取消」（退款 Payment 切已完成不再推進訂單狀態）
- **AND** 業務 / 諮詢人員 A SHALL 手動開立 Invoice（金額依客戶需求決定、系統不自動建待開發票）
- **AND** 諮詢人員 A SHALL 手動通知客戶退款已處理（不入系統）

---

### Requirement: 訂單應收計算規則（含諮詢費 OrderExtraCharge）

訂單應收計算 SHALL 以「印件費 + OrderExtraCharge + OrderAdjustment」三層構成，實際算式由 [order-management spec](../order-management/spec.md) § 三方對帳檢視面板 定義。

**三層構成**：

| 層級 | 概念 | 範例 |
|------|------|------|
| 印件費 | 訂單下各 PrintItem 的金額合計 | 名片印件 4000 |
| OrderExtraCharge | 訂單建立時即確定的其他費用明細 | 諮詢費 2000、運費 200、急件費 500 |
| OrderAdjustment | 訂單成立後的金額異動（需審核） | 規格變更 +500、退印 -300 |

**禁止的情境**：

- 諮詢費 OrderExtraCharge.amount > 0 但實際諮詢費 = 0 之類的不合理組合：系統 MUST 在建立時驗證 `OrderExtraCharge.amount = 對應 ConsultationRequest 的諮詢費`
- ConsultationRequest 的 Payment 已轉移後，再次嘗試從同一 ConsultationRequest 建立關聯訂單：系統 MUST 拒絕（透過 ConsultationRequest 與 Payment 1:1 關聯保證）

#### Scenario: 諮詢費 2000 + 印件 4000 主訂單應收計算

- **GIVEN** 主訂單印件費 = 4000、OrderExtraCharge(consultation_fee) = 1000、無其他費用、無 OrderAdjustment
- **WHEN** 系統計算應收
- **THEN** 主訂單應收 SHALL = 5000

#### Scenario: 諮詢費 + 運費 + 急件費組合

- **GIVEN** 主訂單印件費 = 4000、OrderExtraCharge: consultation_fee = 1000、shipping_fee = 200、rush_fee = 500
- **WHEN** 系統計算應收
- **THEN** 主訂單應收 SHALL = 5700

#### Scenario: 諮詢訂單應收 = 諮詢費

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee) = 1000、無印件、無其他費用
- **WHEN** 系統計算應收
- **THEN** 諮詢訂單應收 SHALL = 1000

#### Scenario: ConsultationRequest 的 Payment 已轉移後不可重複建立關聯訂單

- **GIVEN** ConsultationRequest CR-001 的 Payment 已轉移至訂單 A
- **WHEN** 系統嘗試從同一 ConsultationRequest CR-001 建立另一個關聯訂單 B
- **THEN** 系統 MUST 拒絕
- **AND** UI SHALL 顯示「此諮詢單已關聯訂單 [A]，無法重複建立關聯」

### Requirement: 訂單異動 vs 工單異動職責分工

業務遇到變更需求時，SHALL 依「是否涉及訂單金額變動（向客戶補收 / 退費）」與「是否屬於訂單已完成後的售後事件」決定走哪條流程：

- **訂單期間有金額變動**（向客戶補收 / 退費） → 訂單異動單（OrderAdjustment）
  - 例：加印追加（補收）、規格升級補收、訂單期間客戶投訴退款、加運費、急件費
  - 走 OrderAdjustment 獨立狀態機，業務主管審核後執行
  - 涉及印件變動時業務手動於訂單詳情頁編輯 PrintItem

- **訂單已完成後的售後事件** → 售後服務單（AfterSalesTicket）
  - 例：客訴瑕疵、客戶要求退款、補印（公司認賠或客戶承擔）、規格不符投訴、物流問題
  - 建 AfterSalesTicket → 業務與主管 Slack 討論決議（resolution）→ 視決議建關聯 OrderAdjustment / PrintItem → 業務手動結案
  - AfterSalesTicket 本身無核可關卡；ticket 內關聯的 OrderAdjustment 仍走主管核可

- **無金額變動**（含成本上升公司吸收，訂單期間） → 工單異動流程（既有工單機制）
  - 例：紙廠停產換紙（公司吸收）、訂單期間瑕疵補印、規格寫錯、工序順序調整、產線重派、不影響成品的微調
  - 走 [work-order spec](../work-order/spec.md) 的工單異動流程
  - 工單異動本身會反映於訂單成本欄位 / 利潤分析

「公司吸收成本」場景在訂單期間 SHALL 純走工單異動，不建立 `OrderAdjustment(amount=0)` 重複紀錄。原因：amount=0 不屬於「金額變動」，建立反而違反「金額變動為界」的判定邊界。成本變化資訊由工單流程承擔。

「公司吸收成本」場景在訂單已完成後 SHALL 走 AfterSalesTicket（resolution = 補印，responsibility = 公司認賠），不建 OrderAdjustment。ticket 仍提供「事件追蹤」「品質成本切片分析」價值，與「不建 amount=0 OrderAdjustment」原則不衝突。

#### Scenario: 加印追加判定為訂單異動

- **GIVEN** 客戶要求加印 200 份（向客戶補收 20,000）
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走訂單異動單（OrderAdjustment）
- **AND** 業務不應走工單異動流程

#### Scenario: 訂單已完成後客訴退款走 AfterSalesTicket

- **GIVEN** 訂單已完成、客戶投訴瑕疵要求退款 5,000
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走 AfterSalesTicket（resolution = 退款）
- **AND** ticket 內建 OrderAdjustment(adjustment_type=退印, amount=-5000, linked_after_sales_ticket_id=此 ticket)

#### Scenario: 訂單已完成後客訴公司認賠補印走 AfterSalesTicket

- **GIVEN** 訂單已完成、客戶反映瑕疵、公司認賠補印 100 份不收費
- **WHEN** 業務判定變更類型
- **THEN** 業務 SHALL 走 AfterSalesTicket（resolution = 補印、responsibility = 公司認賠）
- **AND** ticket 內建補印 PrintItem
- **AND** 系統 SHALL NOT 建立 OrderAdjustment（免費補印）

#### Scenario: 紙廠停產換紙公司吸收純走工單異動

- **GIVEN** 訂單生產期間紙廠停產，客戶接受替代紙、成本接近公司吸收（不向客戶補收）
- **WHEN** 業務 / 印務處理變更
- **THEN** 系統 SHALL 走「工單異動」（修改工單紙材）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment(amount=0) 或 AfterSalesTicket（訂單尚未完成）
- **AND** 訂單成本變化由工單流程承擔

#### Scenario: 工序順序調整不需訂單異動

- **GIVEN** 工序順序需要調整但不影響成品與成本
- **WHEN** 印務發起變更
- **THEN** 系統 SHALL 走「工單異動」
- **AND** 系統 NOT 要求建立 OrderAdjustment 或 AfterSalesTicket

#### Scenario: 訂單期間工單瑕疵補印公司吸收純走工單異動

- **GIVEN** 訂單生產期間工單發現飛墨瑕疵需補印，公司吸收補印成本
- **WHEN** 印務處理補印
- **THEN** 系統 SHALL 走「工單異動」（建立補印工單）
- **AND** 業務 SHALL NOT 建立 OrderAdjustment 或 AfterSalesTicket（訂單尚未完成）

### Requirement: 售後服務階段流程（AfterSalesTicket）

訂單已完成後（Order.status = 已完成）的客訴 / 不良 / 規格不符等售後事件 SHALL 走 AfterSalesTicket 流程。AfterSalesTicket 是訂單異動五大階段（需求 → 訂單 → 生產 → 出貨 → 售後）的最後階段，作為訂單已完成後事件的可追蹤容器。

**流程概觀**：

1. **受理**：業務於訂單詳情頁建立 AfterSalesTicket，填入 customer_complaint、case_category（印件瑕疵 / 規格不符 / 物流問題 / 工法限制 / 交期延誤 / 其他）、responsibility（公司認賠 / 客戶承擔 / 共同分擔）。ticket.status = 受理中
2. **討論**（系統外）：業務於 Slack @ 業務主管討論處理方式，討論完成後業務將 Slack thread URL 貼入 ticket.slack_thread_url
3. **決議**：業務於 ticket 填入 resolution（不處理 / 退款 / 補印 / 退款+補印）並點「送出決議」，ticket.status → 處理中
4. **執行下游動作**（依 resolution）：
   - 不處理：不建任何下游動作
   - 退款：業務於 ticket 內建關聯 OrderAdjustment(退印, -金額) → 走 OA 狀態機 → 業務於發票區建退款 Payment + 視需要開 SalesAllowance
   - 補印免費：業務於 ticket 內建補印 PrintItem → 走原審稿 / 工單流程
   - 補印收費：業務於 ticket 內建關聯 OrderAdjustment(補退, +金額) + 建補印 PrintItem
   - 退款+補印：同時走退款與補印路徑
5. **結案**（純手動）：業務確認客戶滿意 / 所有下游動作完成後，點 ticket 上的「結案」按鈕。ticket.status → 已結案

**特殊規則**：

- AfterSalesTicket 本身**無核可關卡**（業務與主管 Slack 線下討論，ERP 僅記錄結果）
- 一個 Order 最多 1 張未結案 ticket；結案後可建新 ticket
- Order.status 永遠保持「已完成」不回退（售後處理中為 UI 徽章，非主狀態）
- 補印場景中，補印 PrintItem 出貨完成 SHALL NOT 自動結案 ticket（需業務確認客戶滿意）
- ticket 內 OrderAdjustment 仍走業務主管審核（OrderAdjustment 既有狀態機不變）

完整規格詳見 [after-sales-ticket spec](../after-sales-ticket/spec.md)。

#### Scenario: 售後事件完整流程（退款場景）

- **GIVEN** Order.status = 已完成、客戶於 2026-05-06 反映瑕疵要求退款 5,000
- **WHEN** 業務於訂單詳情頁建立 AfterSalesTicket（case_category=印件瑕疵、responsibility=公司認賠、customer_complaint=「客戶反映 5,000 元印刷瑕疵」）
- **THEN** ticket.status SHALL = 受理中
- **AND** 業務於 Slack 與業務主管討論後將 thread URL 貼入 slack_thread_url
- **AND** 業務於 ticket 填 resolution = 退款 並點「送出決議」，ticket.status → 處理中
- **AND** 業務於 ticket 內建 OrderAdjustment(退印, -5000, linked_after_sales_ticket_id=此 ticket) → 走 OA 狀態機 → 已執行
- **AND** 業務於訂單發票區建退款 Payment(-5000) + 開 SalesAllowance(-5000, 關聯 Invoice #1) + 手動連結 refund_payment_id
- **AND** 業務確認客戶滿意後點 ticket 上「結案」，ticket.status → 已結案

#### Scenario: 售後事件完整流程（補印免費場景）

- **GIVEN** Order.status = 已完成、客戶反映規格不符要求補印 100 份、公司認賠
- **WHEN** 業務建立 AfterSalesTicket（case_category=規格不符、responsibility=公司認賠、resolution=補印）
- **THEN** ticket.status → 處理中
- **AND** 業務於 ticket 內點「建立補印印件」建 PrintItem(related_after_sales_ticket_id=此 ticket)
- **AND** PrintItem 走原審稿 → 工單 → 出貨流程
- **AND** 系統 MUST NOT 建立 OrderAdjustment（免費補印）
- **AND** 補印 PrintItem 出貨完成 SHALL NOT 自動結案 ticket
- **AND** 業務確認客戶滿意後點「結案」推進 ticket.status → 已結案

#### Scenario: 售後事件完整流程（不處理場景）

- **GIVEN** Order.status = 已完成、客戶反映輕微瑕疵但接受不處理
- **WHEN** 業務建立 AfterSalesTicket（case_category=印件瑕疵、responsibility=公司認賠、resolution=不處理）
- **THEN** ticket.status → 處理中
- **AND** 系統 MUST NOT 建立 OrderAdjustment、PrintItem、Payment
- **AND** 業務點「結案」推進 ticket.status → 已結案
- **AND** 訂單應收 / 發票 / 收款均不變動，三方對帳不受影響

---

### Requirement: 業務先填一半再補齊資料流程（一般收款）

業務 SHALL 可於訂單詳情頁建立一般收款 Payment 時先填部分資料（amount + paymentMethod），暫存為 paymentStatus = '處理中'；後續陸續補齊 paidAt + 對帳附件後切「已完成」，避免「等資料齊才敢建檔」造成的延誤與對帳真實性問題。

**處理中 Payment 對對帳與期次狀態的影響**：

- 處理中 Payment SHALL NOT 計入收款淨額（對帳公式只算已完成 Payment，見 [order-management spec § 三方對帳檢視面板](../order-management/spec.md)）
- 處理中 Payment SHALL NOT 影響 BillingInstallment 收款維度狀態推導（見 [order-management spec § 收款核銷分配（PaymentAllocation）](../order-management/spec.md)）
- 處理中 Payment SHALL NOT 觸發 SalesAllowance 自動建立或弱提示

#### Scenario: 業務在「客戶說已匯但對帳未到」情境先建處理中 Payment

- **GIVEN** 客戶 2026-05-21 告知「已匯款 30000」，業務需要先在系統留存紀錄但對帳單還未到
- **WHEN** 業務於訂單詳情頁 OrderPaymentSection 點「新增收款」，dialog 內填 amount = +30000、paymentMethod = '銀行轉帳'、於入帳明細勾選對應收款項目（PaymentAllocation）；paidAt 與 attachments 暫不填、點「儲存」
- **THEN** 系統 SHALL 通過驗證（處理中態必填項已齊）並建立 Payment P-030（paymentStatus = '處理中'）
- **AND** P-030 出現在收款列表標「處理中」狀態 badge
- **AND** 對帳收款淨額不變（處理中不計入）
- **AND** 對應 BillingInstallment 收款維度狀態不變（處理中不累計）

#### Scenario: 業務後續補齊資料切已完成

- **GIVEN** 處理中 Payment P-030（amount = +30000, paidAt = null, attachments = []）
- **WHEN** 2026-05-25 業務收到銀行對帳單，於收款列表點 P-030「編輯」、補 paidAt = 2026-05-23、上傳對帳單.pdf、切 paymentStatus → '已完成'、點「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-030.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000
- **AND** 對應 BillingInstallment 累計 = +30000，若達 scheduledAmount 則收款維度變「已收訖」

---

### Requirement: 處理中 Payment 期間 SalesAllowance 行為（resolve ORD-004 補 constraint）

業務於 OA 編輯介面建立處理中退款 Payment 時，若關聯訂單已開過發票，系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示。

SalesAllowance 相關提示僅在退款 Payment 切「已完成」後觸發，符合會計實務「未實際發生的款項不開折讓」的對帳邏輯。

#### Scenario: 處理中退款 Payment 不觸發 SalesAllowance 自動建立

- **GIVEN** 訂單 SO-040 已開立 Invoice #1 = 100,000、業務於 OA-040 編輯介面建退款 Payment P-040（amount = -5000, paymentStatus = '處理中'）
- **WHEN** P-040 建立完成
- **THEN** 系統 SHALL NOT 自動建立 SalesAllowance
- **AND** 系統 SHALL NOT 顯示弱提示「請至發票區建 SalesAllowance」
- **AND** 對帳面板 SHALL 顯示「處理中退款 5000（不計入）」

#### Scenario: 退款 Payment 切已完成後系統提示業務開 SalesAllowance

- **GIVEN** P-040 切 paymentStatus = '已完成'
- **WHEN** 系統處理切換事件
- **THEN** 系統 SHALL 顯示弱提示「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance 以維持發票淨額與收款淨額對齊」（弱提示，不阻擋業務）
- **AND** 業務 SHALL 可選擇至發票區建 SalesAllowance 或忽略提示
- **註**：SalesAllowance 完整流程不在本 change 範圍（ORD-004 完整自動建立 vs 手動建決策仍 open）

---

### Requirement: Migration 期 OA invariant 過渡規則

本 change 上線後執行既有 Payment backfill 為「已完成」（見 [order-management spec § 既有資料 Migration](../order-management/spec.md)）。Migration 期間 SHALL 滿足下列規則：

- Migration 前：既有「OA 已執行 → 必有關聯退款 Payment」invariant 隱含 Payment「已建立 = 已完成」語意
- Migration 中：所有 Payment backfill `paymentStatus = '已完成'`、`completedAt = createdAt`
- Migration 後：新 invariant「OA 已執行 → 必有關聯已完成 Payment 累計達 OA.amount」自動滿足（既有資料已 backfill）

Migration 不涉及 OA 狀態變動（既有已執行 OA 維持已執行）。

#### Scenario: Migration 後既有已執行 OA 仍滿足新 invariant

- **GIVEN** Migration 前資料庫有 OA-100（status = 已執行, amount = -5000）+ 對應退款 Payment P-100（amount = -5000, paymentStatus = null）
- **WHEN** 系統執行 Migration
- **THEN** P-100.paymentStatus SHALL 被 backfill 為 '已完成'、completedAt = P-100.createdAt
- **AND** OA-100 對應已完成 Payment 累計 = -5000 = OA-100.amount，滿足新 invariant
- **AND** OA-100.status 維持「已執行」（不變動）

### Requirement: 請款與核銷流程（合併規劃層雙實體 + 自動分配）

系統 SHALL 提供以下統一請款 + 核銷流程，取代 v1.13「PaymentPlan 建立 + PlannedInvoice 建立 + Invoice 開立 + Payment 登錄 + PaymentInvoice junction 勾選」五步驟分散流程：

```
規劃 BillingInstallment（一次建立含應收日 / 預計開票日 / 金額 / 品項 / 備註）
   ↓
一鍵開票（從 BillingInstallment 繼承應收日 / 備註 / 品項 → Invoice，期次↔發票 1:1）
   ↓
登錄 Payment（業務於入帳明細手動勾選收款項目 + 填金額，防呆入帳合計 ≤ 收款金額）
   ↓
Payment 切已完成 → BillingInstallment.payment_status derived 更新
```

業務在規劃階段一次建期次即同時定義「何時收 + 何時開票 + 開什麼品項」三個面向，不再雙頭維護。事實層 PaymentAllocation 取代 PaymentInvoice junction（發票↔期次 1:1、期次↔收款 N:M）。收款入帳由業務手動勾選收款項目 + 逐筆填金額、UI 即時校驗入帳合計 ≤ 收款金額、溢收進預收桶（Miles 拍板手動，系統不做自動依序填滿）。

#### Scenario: 完整請款 + 核銷流程（一期一票一款情境 A）

- **GIVEN** 訂單成立後總額 30000
- **WHEN** 業務建立 BillingInstallment BI-001（scheduled_amount=30000, due_date=2026-06-01, expected_invoice_date=2026-05-15, items=[訂金品項], note=「訂金 30%」）
- **AND** 業務於 BI-001 點「一鍵開立發票」→ 系統建立 Invoice INV-001（total_amount=30000, items=深拷貝, source_billing_installment_id=BI-001.id）
- **AND** 業務登錄 Payment P-001（amount=30000）→ 於入帳明細手動勾選 BI-001 填 30000 建 PaymentAllocation PA-001（payment_id=P-001, billing_installment_id=BI-001, allocated=30000, auto_allocated=false）
- **AND** 業務切 P-001 為已完成
- **THEN** BI-001.invoicing_status = 已開立、payment_status = 已收訖（兩維度均推進完成）
- **AND** 全流程業務操作步數從 v1.13 預估 ≥ 8 次降至 ≤ 4 次（CEO 指標 3）

### Requirement: 補收 / 退款不對稱操作流（訂單完成前後分容器）

系統 SHALL 提供以下兩條核心操作流，**訂單完成是路徑分水嶺**：未完成走 OA 直接建立、已完成必須先建 AfterSalesTicket 容器（OA 在 ticket 內建立、掛 linked_after_sales_ticket_id）。底層機制相同（OA + Payment + 折讓/作廢），ticket 只是容器 + 結案追蹤。

**補收（正項，免審核 + 進期次）**：
- 訂單完成前：業務直接建 OA(+N) → 跳過審核中間態直達已執行 → 業務新增 BillingInstallment 承載補收應收（或併入既有未開期次）→ 從期次一鍵開票 + 收款核銷（走情境 A）
- 訂單完成後：業務先建 AfterSalesTicket → ticket 內建 OA(+N, linked_after_sales_ticket_id) → 同樣跳過審核直達已執行 → 業務新增 BillingInstallment 承載補收應收 → 開票 + 收款核銷 → ticket 結案

**退款（負項，需業務主管核可 + 不進期次）**：
- 訂單完成前：業務直接建 OA(-N) → 送業務主管審核 → 已核可 → 業務於 OA 介面建退款 Payment（處理中）→ 補對帳附件切已完成 → 系統推進 OA 已執行 → 發票端折讓（跨月）/ 作廢重開（未跨月）；**退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次）
- 訂單完成後：業務先建 AfterSalesTicket → ticket 內建 OA(-N, linked_after_sales_ticket_id) → 同樣送業務主管審核 → 後續流程同上 → ticket 結案

#### Scenario: 訂單完成前補收 +8000 立即執行

- **GIVEN** 訂單在製作中、客戶要求加印 +8000
- **WHEN** 業務建立 OA-010（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** OA-010.status SHALL = 已執行（跳過審核中間態）
- **AND** 應收 SHALL = 100000 + 8000 = 108000
- **AND** Order 對帳檢視 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃」+ action「建立期次」
- **WHEN** 業務點 action 新增 BillingInstallment BI-010（scheduled_amount=8000）
- **AND** 業務於 BI-010 一鍵開票 + 客戶付款 + 切已完成
- **THEN** 補收流程完成，應收 = 發票淨額 = 收款淨額 = 108000

#### Scenario: 訂單完成後售後退款 -5000 透過 AfterSalesTicket

- **GIVEN** 訂單已完成、期2 尾款 70000 已開 INV-002 已收訖
- **WHEN** 業務建立 AfterSalesTicket（responsibility=客戶投訴, resolution=退款）+ ticket 內建 OA-020（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）並送審
- **AND** 業務主管核可 OA-020
- **AND** 業務於 OA 介面建退款 Payment P-020（amount=-5000, paymentMethod=退款, 處理中）+ 補對帳附件 + 切已完成
- **THEN** 系統推進 OA-020 = 已執行、應收 -5000
- **AND** P-020 MUST NOT 建立 PaymentAllocation（不進正向期次）
- **AND** BillingInstallment 期2 維持 payment_status = 已收訖、scheduled_amount = 70000（稽核保留）
- **WHEN** 業務於 INV-002 詳情頁建立 SalesAllowance（allowance_amount=-5000, refund_payment_id=P-020.id, status=已確認）
- **THEN** INV-002 自動顯示「已部分折讓 -5000」（既有 derived 折讓衍生標籤）
- **AND** 三方對帳對齊：應收 −5000 ｜ 發票淨額 −5000 ｜ 收款淨額 −5000
- **AND** 業務確認客戶滿意 → 點 ticket「結案」推進 ticket.status = 已結案

### Requirement: 先收後開操作流（雙維度狀態獨立）

系統 SHALL 支援「客戶先付款、業務後開票」情境：BillingInstallment 收款維度可先推進至「已收訖」、開票維度仍維持「未開立」；後續業務於該期次一鍵開票，開票維度才推進至「已開立」。雙維度互相獨立、不阻塞。

#### Scenario: 客戶先付訂金 30000 業務後開票

- **GIVEN** BI-030.scheduled_amount = 30000, invoicing_status = 未開立, payment_status = 未收
- **WHEN** 業務於 BI-030 登錄 Payment 30000、於入帳明細手動勾選 BI-030 建 PaymentAllocation、業務切 Payment 為已完成
- **THEN** BI-030.payment_status SHALL = 已收訖
- **AND** BI-030.invoicing_status SHALL 維持 = 未開立
- **WHEN** 業務後續點 BI-030「一鍵開立發票」
- **THEN** BI-030.invoicing_status SHALL → 已開立
- **AND** 兩維度均推進完成

### Requirement: 期次規劃 invariant + 三方對帳警示

訂單 SHALL 維護以下 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`。其中應收計算沿用 v1.13：`應收 = Σ 印件費 + Σ OrderExtraCharge.amount + Σ 已執行 OrderAdjustment.amount`。違反時對帳檢視（OrderReconciliationPanel）SHALL 顯示警示 banner「OA 已執行 N 元、但未對應期次規劃（差額 N）」+ action button「建立期次」（不阻擋業務操作、提示為主）。

#### Scenario: 補收 OA 已執行 + 未補建期次觸發警示

- **GIVEN** 訂單應收 = 印件費 100000 + 已執行 OA(+8000) = 108000
- **AND** Σ BillingInstallment.scheduled_amount where cancelled=false = 100000（業務未補建補收期次）
- **WHEN** 業務 / 會計查看 OrderReconciliationPanel
- **THEN** 系統 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃（差額 8000）」+ action「建立期次」
- **AND** 業務 MAY 點 action 開啟 BillingInstallment 新建 Dialog 預填 scheduled_amount = 8000

### Requirement: 三方對帳對齊驗證（含補收 / 退款場景）

系統 SHALL 沿用 v1.13 三方對帳 invariant 數學定義（應收 = 發票淨額 = 收款淨額、差額 = 0 對帳通過），補收 / 退款場景三方對齊邏輯 SHALL 延伸至本 change BillingInstallment + PaymentAllocation 結構而不破壞該 invariant。

三方對帳 invariant 沿用 v1.13 公式但延伸到本 change 結構：
- **應收**：Σ 印件費 + Σ OrderExtraCharge.amount + Σ 已執行 OrderAdjustment.amount
- **發票淨額**：Σ 已開立 Invoice.total_amount − Σ 已確認 SalesAllowance.|amount|（folded）
- **收款淨額**：Σ Payment.amount where paymentStatus = 已完成 且 linked_entity_type = Order（含正向收款 - 退款 Payment）

差額 = 應收 − 發票淨額 − 收款淨額；差額 = 0 時對帳通過。**補收 / 退款場景三方對齊邏輯沿用既有公式，新模型不影響該 invariant 數學定義**。

#### Scenario: 補收場景三方對帳對齊

- **GIVEN** 訂單應收 100000 → 補收 OA +8000 已執行 → 應收 108000
- **AND** 已開 2 張發票（INV-001 = 100000 + INV-002 = 8000）= 發票淨額 108000
- **AND** 已收 2 筆 Payment（100000 + 8000）= 收款淨額 108000
- **WHEN** 系統檢核三方對帳
- **THEN** 應收 108000 = 發票淨額 108000 = 收款淨額 108000、差額 = 0

#### Scenario: 退款場景三方對帳對齊（含折讓）

- **GIVEN** 訂單應收 100000 → 售後退款 OA -5000 已執行 → 應收 95000
- **AND** 已開 INV-001 = 100000 + SalesAllowance -5000 = 發票淨額 95000
- **AND** 已收 Payment +100000 + 退款 Payment -5000 = 收款淨額 95000
- **WHEN** 系統檢核三方對帳
- **THEN** 應收 95000 = 發票淨額 95000 = 收款淨額 95000、差額 = 0

