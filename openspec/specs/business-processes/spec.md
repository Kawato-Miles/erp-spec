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

- 自動帶入（唯讀）：客戶基本資料、印件規格
- 自動帶入（可編輯）：交期與備註、付款資訊、訂金設定
- 不帶入：報價紀錄、活動紀錄

#### Scenario: 需求單轉訂單時客戶資料帶入

WHEN 使用者將需求單轉為訂單
THEN 系統 SHALL 自動帶入客戶基本資料與印件規格，且這些欄位為唯讀狀態

#### Scenario: 需求單轉訂單時交期可編輯

WHEN 使用者將需求單轉為訂單
THEN 系統 SHALL 自動帶入交期與備註、付款資訊、訂金設定，且這些欄位允許使用者編輯

#### Scenario: 需求單轉訂單時報價紀錄不帶入

WHEN 使用者將需求單轉為訂單
THEN 系統 SHALL 不帶入報價紀錄與活動紀錄至訂單

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

系統 SHALL 支援打樣工單與大貨工單的區分（透過 type 欄位），並遵循以下規則：

- 若需打樣，打樣印件與大貨印件 SHALL 同時建立
- 打樣決策結果處理：
  - OK：開放大貨上傳稿件
  - NG（製程問題）：同印件建新工單
  - NG（稿件問題）：建新打樣印件

#### Scenario: 打樣通過後開放大貨

WHEN 打樣結果為 OK
THEN 系統 SHALL 開放對應大貨印件的稿件上傳功能

#### Scenario: 打樣失敗因製程問題

WHEN 打樣結果為 NG 且原因為製程問題
THEN 系統 SHALL 允許在同一印件下建立新工單重新打樣

#### Scenario: 打樣失敗因稿件問題

WHEN 打樣結果為 NG 且原因為稿件問題
THEN 系統 SHALL 引導建立新打樣印件

---

### Requirement: 稿件管理規則

一個印件可包含多個檔案。工單建立時，系統 MUST 鎖定當時的合格稿件版本。

#### Scenario: 工單建立時鎖定稿件

WHEN 印務為某印件建立工單
THEN 系統 SHALL 鎖定該印件當時審稿通過的合格稿件，後續稿件變更不影響已建立的工單

---

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

- 層級 1 生產任務層：pt_qc_passed = sum(QCRecord.passed_quantity)，加總該生產任務所有 QC 紀錄的通過數量。
- 層級 2 任務層：篩選 affects_product = TRUE 的生產任務 -> 計算 pt_completion_ratio = floor(pt_qc_passed / pt.quantity_per_work_order) -> task_completion = min(所有 completion_ratio)，取最小值（齊套性邏輯）。
- 層級 3 工單層：wo_completion = min(該工單下所有任務的 task_completion)。
- 層級 4 印件層：wo_completion_ratio = floor(wo_completion / wo.quantity_per_print_item) -> pi_completion = min(所有工單的 wo_completion_ratio) -> 若 pi_completion >= 目標生產數量，則印件狀態推進為「製作完成」。

#### Scenario: 簡單 1:1:1 路徑計算

WHEN 印件含 1 工單（quantity_per_print_item = 1），工單含 1 任務，任務含 1 生產任務（quantity_per_work_order = 1、affects_product = TRUE），該生產任務 QC 通過數為 1000
THEN 層級 1 pt_qc_passed = 1000，層級 2 task_completion = floor(1000/1) = 1000，層級 3 wo_completion = 1000，層級 4 pi_completion = floor(1000/1) = 1000

#### Scenario: 複合任務（多生產任務各自倍數）

WHEN 一任務含生產任務 A（quantity_per_work_order = 2、affects_product = TRUE、QC 通過 2100）與生產任務 B（quantity_per_work_order = 1、affects_product = TRUE、QC 通過 900）
THEN 層級 2 計算：A 的 completion_ratio = floor(2100/2) = 1050，B 的 completion_ratio = floor(900/1) = 900，task_completion = min(1050, 900) = 900

#### Scenario: 多工單一印件

WHEN 印件含工單 A（quantity_per_print_item = 1000、wo_completion = 2100）與工單 B（quantity_per_print_item = 300、wo_completion = 700）
THEN 層級 4 計算：A 的 wo_completion_ratio = floor(2100/1000) = 2，B 的 wo_completion_ratio = floor(700/300) = 2，pi_completion = min(2, 2) = 2

---

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

### Requirement: 客製單建立規則

客製單由業務在訂單管理模組手動建立，適用情境為 EC 會員來電要求印件調整。系統 SHALL 依以下規則處理客製單建立：

- 建立角色：業務 / 諮詢業務
- 必填欄位：客戶名稱、至少一筆印件（含名稱、類型、數量）
- 選填欄位：接單業務、帳務公司、客戶交期、預計出貨日、內部完成時間、是否急件、備註、員工備註
- 印件欄位：名稱（必填）、類型（打樣/大貨，必填）、數量（必填）、單位（選填）、成本（選填）、金額含稅（選填）、免審稿（選填）、規格備註（選填）
- 顧客資訊：顧客姓名、會員類型、公司抬頭、統編、電話、信箱、地址（皆選填，可從 EC 會員搜尋帶入）
- 發票設定：是否開立（選填）、類型（二聯式/三聯式/捐贈）、對應欄位（載具/抬頭/統編/捐贈碼）
- 物流設定：出貨方式（宅配/自取/超取/貨運/快遞/其他，選填）、運費（選填）
- 金額設定：折扣碼、折扣金額、紅利折抵（選填）
- 建立後初始狀態：order_type = 客製單、status = 等待付款、payment_status = 未付款

#### Scenario: 業務建立客製單完整流程
- **WHEN** 業務在訂單列表頁點擊「新增訂單」，填寫客戶名稱與接單業務，新增一筆印件（名稱「活動海報」、類型「大貨」、數量 500）
- **THEN** 系統 SHALL 建立客製單，訂單編號自動產生，初始狀態為「等待付款」

#### Scenario: 客製單建立欄位驗證
- **WHEN** 業務未填寫客戶名稱或未新增任何印件即點擊「確認」
- **THEN** 系統 SHALL 阻擋建立並標示必填欄位錯誤

#### Scenario: 客製單與線下單建立方式區別
- **WHEN** 業務建立客製單
- **THEN** 系統 MUST NOT 要求關聯需求單（quote_request_id 為空），所有印件資訊由業務手動填寫，不從需求單帶入

