# ERP 使用者角色與權限規格

來源: [使用者權責](https://www.notion.so/32c3886511fa8144b38adc9266395d15) + 核心角色權責表 DB (Notion 發布版本)

## Purpose

定義 ERP 系統中所有使用者角色的權責範圍、模組存取權限與平台歸屬，作為系統權限設計與功能開發的規範依據。確保每個角色僅能存取其職責所需的模組與操作，符合最小權限原則。
## Requirements
### Requirement: 平台歸屬分類

系統 SHALL 將所有角色歸屬至以下六個平台之一：業務平台、中台、印務平台、審稿平台、工廠平台、中國供應商平台。每個角色 MUST 有且僅有一個平台歸屬。

#### Scenario: 角色登入後看到對應平台介面

WHEN 使用者以特定角色登入系統
THEN 系統 SHALL 僅顯示該角色所屬平台的介面與功能入口

#### Scenario: 平台歸屬對照表

WHEN 系統初始化角色設定
THEN 各角色的平台歸屬 SHALL 依下表配置：

| 平台 | 角色 |
|------|------|
| 中台 | Supervisor、訂單管理人、審稿主管、印務主管、EC商品管理 |
| 業務平台 | 業務、諮詢、會計 |
| 印務平台 | 印務 |
| 審稿平台 | 審稿 |
| 工廠平台 | 生管、師傅、外包廠商、QC、出貨 |
| 中國供應商平台 | 中國廠商 |

#### Scenario: 師傅平台存取限制

WHEN 師傅登入 ERP
THEN 師傅 SHALL 僅能存取師傅任務平台功能
AND 系統 MUST 隱藏其他 ERP 模組選單

#### Scenario: 工廠平台統一入口

- **WHEN** 系統初始化角色設定
- **THEN** 生管、師傅、外包廠商、QC、出貨 SHALL 歸屬於工廠平台
- **AND** 工廠平台內依角色顯示對應功能：生管看到日程面板；師傅看到師傅任務平台

#### Scenario: Prototype User 切換對應

- **WHEN** 使用者在 Prototype 的角色切換選單選擇生管
- **THEN** 系統 SHALL 自動導航至工廠平台首頁（日程面板）
- **AND** 側選單 SHALL 僅顯示工廠平台功能

- **WHEN** 使用者在 Prototype 的角色切換選單選擇師傅
- **THEN** 系統 SHALL 自動導航至師傅任務平台
- **AND** 側選單 SHALL 僅顯示師傅任務平台功能

---

### Requirement: 模組存取權限模型

系統 SHALL 對每個角色定義四個模組（需求單、報價單/訂單、工單、任務）的存取層級。權限層級分為 R/W（可讀寫）與 X（無存取權限）。

#### Scenario: 角色存取無權限模組

WHEN 角色的模組權限為 X
THEN 系統 SHALL 不顯示該模組的任何入口，且任何 API 請求 MUST 回傳權限不足錯誤

#### Scenario: 角色存取可讀寫模組

WHEN 角色的模組權限為 R/W
THEN 系統 SHALL 允許該角色查看與編輯該模組中其職責範圍內的資料

#### Scenario: 完整權限對照表

WHEN 系統配置角色權限
THEN 各角色的模組權限 SHALL 依下表設定：

| 角色 | 需求單 | 報價單/訂單 | 工單 | 任務 |
|------|--------|------------|------|------|
| Supervisor | R/W | R/W | R/W | R/W |
| 訂單管理人 | X | R/W | R/W | R/W |
| 業務 | R/W | R/W | X | X |
| 諮詢 | R/W | R/W | X | X |
| 會計 | X | R/W | X | X |
| 審稿主管 | X | X | X | X |
| 審稿 | X | X | X | X |
| 印務主管 | R/W | X | R/W | X |
| 印務 | X | X | R/W | R/W |
| 生管 | X | X | X | R/W |
| 師傅 | X | X | X | R/W |
| 中國廠商 | X | X | X | R/W |
| 外包廠商 | X | X | X | R/W |
| QC | X | X | R/W | X |
| 出貨 | X | X | R/W | R/W |
| EC商品管理 | X | X | X | X |

---

### Requirement: Supervisor 角色行為限制

Supervisor SHALL 擁有所有模組的 R/W 權限，但 MUST NOT 直接編輯業務資料。Supervisor 的存取定位為 Dashboard 總覽、Forecast 預測與 KPI 追蹤。

#### Scenario: Supervisor 查看全域 Dashboard

WHEN Supervisor 登入系統
THEN 系統 SHALL 顯示涵蓋產能透明度、訂單追蹤、生產進度的 Dashboard 介面

#### Scenario: Supervisor 不直接編輯資料

WHEN Supervisor 進入任何模組的詳細頁面
THEN 系統 SHALL 以唯讀模式呈現資料，不提供直接編輯按鈕
AND Supervisor 的操作紀錄 MUST 僅包含查看行為

---

### Requirement: 業務與諮詢角色的工單查閱限制

業務與諮詢角色的工單模組權限為 X（無直接存取），但 SHALL 可透過訂單詳情頁面查閱工單狀態與 QC 紀錄摘要。

#### Scenario: 業務從訂單頁面查閱工單狀態

WHEN 業務角色開啟訂單詳情頁面
THEN 系統 SHALL 顯示該訂單關聯工單的狀態摘要（唯讀）
AND SHALL 顯示 QC 紀錄摘要（唯讀）
AND MUST NOT 提供導航至工單模組的連結

#### Scenario: 業務角色可轉單

WHEN 業務角色在需求單或訂單中執行轉單操作
THEN 系統 SHALL 允許將該單據指派給其他業務或諮詢角色

---

### Requirement: 諮詢角色額外職責

諮詢角色 SHALL 具備與業務角色相同的模組權限，並額外負責 EC 客服問題處理。

#### Scenario: 諮詢角色處理 EC 客服問題

WHEN 諮詢角色收到 EC 客服相關問題
THEN 系統 SHALL 提供客服問題處理介面
AND 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

---

### Requirement: 會計角色資料存取範圍

會計角色 MUST 僅能存取報價單/訂單模組，且可查看範圍 SHALL 限於基本資料與付款紀錄。

#### Scenario: 會計查看訂單付款紀錄

WHEN 會計角色開啟報價單/訂單模組
THEN 系統 SHALL 僅顯示訂單基本資料與付款紀錄相關欄位
AND MUST NOT 顯示生產相關詳情（如印件規格、BOM 等）

#### Scenario: 會計處理發票

WHEN 會計角色需要開立發票
THEN 系統 SHALL 提供發票開立功能
AND SHALL 自動帶入訂單的金額與客戶資料

---

### Requirement: 審稿主管與審稿角色階段限制

審稿主管與審稿角色 SHALL 僅在審稿階段參與流程。審稿主管負責案件分派，審稿人員負責稿件內容確認與製作。

#### Scenario: 審稿主管分派審稿案件

WHEN 訂單進入審稿階段
THEN 審稿主管 SHALL 可將審稿案件指派給審稿人員
AND 系統 SHALL 記錄分派時間與指派對象

#### Scenario: 審稿人員確認稿件

WHEN 審稿人員收到指派的審稿案件
THEN 系統 SHALL 提供稿件檢視與標註介面
AND 審稿人員 SHALL 可標記稿件為合規或需修改

---

### Requirement: 印務主管角色職責

印務主管 SHALL 擁有需求單與工單模組的 R/W 權限，負責售前製程與成本評估、印製工單製程審核、BOM 表管理、建立工單草稿，以及分配工單給印務人員。

#### Scenario: 印務主管進行售前成本評估

WHEN 需求單進入評估階段且需要製程評估
THEN 印務主管 SHALL 可查閱需求單內容
AND SHALL 可填寫製程與成本評估結果

#### Scenario: 印務主管建立工單草稿

WHEN 訂單確認後需要建立工單
THEN 印務主管 SHALL 可建立工單草稿
AND SHALL 可設定工單的製程、BOM 表與排程
AND SHALL 可將工單指派給印務人員

---

### Requirement: 印務角色職責

印務角色 SHALL 擁有工單與任務模組的 R/W 權限，負責建立工單中的生產任務、追蹤工單執行狀態，以及管理工單異動。

**工單管理**：
- 讀寫：工單內容填寫、生產任務建立與編輯、製程送審、異動發起
- 唯讀：其他印務負責的工單（僅在跨印務印件場景下，透過印件總覽查看進度）

**印件總覽**：
- 讀取：可查看印件總覽，並使用「只顯示我參與的印件」篩選
- 判斷邏輯：印件下有任何 WorkOrder.assigned_to 等於當前印務
- 跨印務印件：可查看同印件下其他印務負責的工單進度，但 MUST NOT 編輯

**生產任務**：
- 讀寫：所負責工單下的生產任務建立、編輯、排序（sort_order）
- 唯讀：產線（production_line_id，由 BOM 帶入不可修改）、生產任務詳情中的稿件檔案與成品縮圖（引用自印件層）

#### Scenario: 印務建立生產任務

WHEN 印務角色開啟已指派的工單
THEN 系統 SHALL 允許印務建立該工單下的生產任務
AND SHALL 可設定生產任務的製程參數與排程

#### Scenario: 印務管理工單異動

WHEN 工單需要異動（如數量變更、製程調整）
THEN 印務 SHALL 可發起工單異動申請
AND 系統 SHALL 記錄異動原因與變更內容

#### Scenario: 印務查看參與的印件

- **WHEN** 印務在印件總覽使用「只顯示我參與的印件」篩選
- **THEN** 系統 SHALL 僅顯示印件下有 WorkOrder.assigned_to 等於當前印務的印件
- **AND** 印務 SHALL 可查看同印件下其他工單的進度但 MUST NOT 編輯

#### Scenario: 印務為生產任務調整排序

- **WHEN** 印務在工單詳情頁編輯生產任務
- **THEN** 印務 SHALL 可調整排序（sort_order）
- **AND** 排序 SHALL 限制在同一 category 內拖曳
- **AND** production_line_id SHALL 顯示為唯讀（由 BOM 帶入，印務不可修改）

---

### Requirement: 生管角色編輯限制

生管角色 SHALL 僅擁有任務模組的 R/W 權限，且可編輯範圍 MUST 限於以下欄位：
- 師傅指派（assigned_operator）
- 實際設備（actual_equipment）
- 報工相關欄位（報工數量、報工工時、缺陷數量、備註）
- 提前分派標記（is_early_dispatched）
- 異動確認操作

生管 MUST NOT 修改生產任務的製程參數、規格、目標數量、計畫設備（planned_equipment）或排程日期（scheduled_date）等規劃層欄位。

生管角色 SHALL 額外擁有以下與供應商報價相關的權限：

| 新增權限 | 說明 |
|---------|------|
| 確認供應商報價 | 審核並確認供應商提交的單價 |
| 退回供應商報價 | 退回不合理報價並填寫原因 |
| 查看報價比較 | 查看同一任務多家供應商的報價（若有） |

#### Scenario: 生管更新任務進度

- **WHEN** 生管角色開啟任務詳情頁面
- **THEN** 系統 SHALL 允許編輯：assigned_operator、actual_equipment、報工欄位、is_early_dispatched
- **AND** MUST NOT 允許修改：製程參數、規格、目標數量、planned_equipment、scheduled_date

#### Scenario: 生管安排工作任務

- **WHEN** 生管角色在日程執行面板進行分派操作
- **THEN** 系統 SHALL 允許指派師傅、覆蓋設備、提前分派、批次報工
- **AND** 系統 SHALL 提供任務排程介面供生管調整執行順序

---

### Requirement: 師傅角色權責

師傅角色 SHALL 擁有以下權限：

| 權限 | 說明 |
|------|------|
| 查看自身生產任務 | 僅限 assigned_operator 為自己的生產任務 |
| 自助報工 | 填寫完成數量、報工工時（選填）、報工備註（選填） |
| 查看任務排程 | 查看今日與明日的任務排程（唯讀） |

師傅 MUST NOT 擁有以下權限：
- 修改排程（設備、日期）
- 修改目標數量
- 查看其他師傅的任務
- 存取 ERP 其他模組

#### Scenario: 師傅執行生產任務

WHEN 師傅角色查看指派的生產任務
THEN 系統 SHALL 顯示任務的製程參數、規格與數量
AND 師傅 SHALL 可更新任務的執行狀態與完成數量

#### Scenario: 師傅角色權限驗證

- **WHEN** 師傅嘗試存取非自身任務或修改排程資訊
- **THEN** 系統 MUST 回傳權限不足錯誤

---

### Requirement: 外包廠商角色權責

外包廠商角色 SHALL 擁有以下權限：

| 權限 | 說明 |
|------|------|
| 查看分派任務 | 僅限 assigned_factory 為該廠商的生產任務 |
| 報價 | 填寫單價報價（未確認前可修改） |
| 報工 | 回報完成數量、標記製作完畢 |
| 查看報價歷史 | 查看自己提交的報價紀錄 |

外包廠商 MUST NOT 擁有以下權限：
- 查看其他供應商的任務或報價
- 修改排程、目標數量
- 存取工廠平台中生管或師傅的功能

#### Scenario: 外包廠商回報生產進度

WHEN 外包廠商角色執行生產任務
THEN 系統 SHALL 提供報工介面
AND 外包廠商 SHALL 可更新任務完成狀態

#### Scenario: 外包廠商存取限制驗證

- **WHEN** 外包廠商嘗試存取非自身任務或查看其他供應商資料
- **THEN** 系統 MUST 回傳權限不足錯誤

#### Scenario: 廠商角色資料隔離

WHEN 外部廠商角色登入系統
THEN 系統 MUST 僅顯示指派給該廠商的任務
AND MUST NOT 顯示其他廠商或內部角色的任何資料

---

### Requirement: 中國廠商角色權責

中國廠商角色 SHALL 擁有與外包廠商相同的權限範圍，差異在於：
- 平台歸屬為「中國供應商平台」（獨立於工廠平台）
- 生產任務路徑含「已送集運商」中間狀態

#### Scenario: 中國廠商進行任務報價

WHEN 中國廠商角色收到報價請求
THEN 系統 SHALL 提供報價填寫介面
AND 中國廠商 SHALL 可查看任務規格以進行報價

#### Scenario: 中國廠商標記已送集運商

- **WHEN** 中國廠商在中國供應商平台將製作完畢的生產任務標記出貨
- **THEN** 生產任務狀態 SHALL 從「製作中」變為「已送集運商」

---

### Requirement: QC 角色編輯限制

QC 角色 SHALL 擁有工單模組的 R/W 權限，但可編輯範圍 MUST 限於 QC 紀錄，不可修改工單其他內容。QC 單的建立動作 MUST 由印務執行，QC 角色僅能執行已建立的 QC 單、填寫結果並提交；QC 單生命週期詳見 [qc capability § QC 角色權限邊界](../qc/spec.md)。

#### Scenario: QC 人員記錄檢驗結果

WHEN QC 角色開啟工單的品質檢驗頁面
THEN 系統 SHALL 提供 QC 紀錄填寫介面
AND QC 角色 SHALL 可記錄檢驗結果、異常描述與處理方式
AND MUST NOT 允許修改工單的製程、數量或排程等欄位
AND MUST NOT 允許建立新 QC 單（QC 單建立權屬印務）

### Requirement: 出貨角色階段限制

出貨角色 SHALL 擁有工單與任務模組的 R/W 權限，且 SHALL 僅在出貨階段參與流程，負責依訂單進行出貨與管理出貨單。

#### Scenario: 出貨人員建立出貨單

WHEN 工單進入出貨階段
THEN 出貨角色 SHALL 可建立出貨單
AND 系統 SHALL 自動帶入工單與訂單的相關資料（品項、數量、收件資訊）

#### Scenario: 出貨人員管理出貨進度

WHEN 出貨角色開啟出貨單列表
THEN 系統 SHALL 顯示待出貨與已出貨的清單
AND 出貨角色 SHALL 可更新出貨狀態與物流資訊

---

### Requirement: EC商品管理角色職責

EC商品管理角色 SHALL 不直接存取需求單、報價單/訂單、工單、任務等模組，其職責限於 EC 商品主檔管理與 ERP 資料同步確認。

#### Scenario: EC商品管理同步商品資料

WHEN EC 商品主檔有更新需求
THEN EC商品管理角色 SHALL 可編輯商品主檔（含 BOM 商品資料）
AND 系統 SHALL 提供 ERP 資料同步狀態確認介面

---

### Requirement: 利害關係程度分級

系統 SHALL 依據角色的利害關係程度（高、中、低）決定通知優先順序與資訊揭露程度。

#### Scenario: 高利害關係角色收到即時通知

WHEN 與角色職責相關的重要狀態變更發生（如訂單狀態異動、工單異動）
THEN 利害關係程度為「高」的角色 SHALL 收到即時通知

#### Scenario: 低利害關係角色收到摘要通知

WHEN 與角色職責相關的狀態變更發生
THEN 利害關係程度為「低」的角色（中國廠商、外包廠商）SHALL 僅收到與其指派任務相關的通知
AND MUST NOT 收到系統全域的狀態變更通知

---

### Requirement: 階段參與範圍限制

系統 SHALL 依據角色的參與階段設定，限制角色可操作的流程階段。未列入參與階段的角色 MUST NOT 出現在該階段的操作介面中。

#### Scenario: 參與階段對照表

WHEN 系統配置角色的階段存取權限
THEN 各角色的參與階段 SHALL 依下表設定：

| 角色 | 參與階段 |
|------|---------|
| Supervisor | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 訂單管理人 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 業務 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 諮詢 | 評估、訂購、審稿、打樣印製、出貨（全部） |
| 會計 | 審稿 |
| 審稿主管 | 審稿 |
| 審稿 | 審稿 |
| 印務主管 | 評估、打樣印製 |
| 印務 | 打樣印製 |
| 生管 | 打樣印製 |
| 師傅 | 打樣印製 |
| 中國廠商 | 打樣印製 |
| 外包廠商 | 打樣印製 |
| QC | 打樣印製 |
| 出貨 | 出貨 |
| EC商品管理 | BOM商品資料同步 |

#### Scenario: 非參與階段角色無法操作

WHEN 流程處於某角色未參與的階段
THEN 該角色 MUST NOT 在該階段的任務指派、操作按鈕或審核流程中出現

