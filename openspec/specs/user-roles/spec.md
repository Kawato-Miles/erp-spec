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
| 中台 | Supervisor、訂單管理人、審稿主管、印務主管、業務主管、EC商品管理 |
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

- **WHEN** 使用者在 Prototype 的角色切換選單選擇業務主管
- **THEN** 系統 SHALL 自動導航至 `/sales-manager/approvals`（需求單核可頁）
- **AND** 側選單 SHALL 顯示「需求單管理」單一 group，含「需求單核可」與「需求單列表」兩個 sub item

- **WHEN** 使用者在 Prototype 的角色切換選單選擇業務
- **THEN** 系統 SHALL 自動導航至業務平台首頁（`/` 需求單列表頁）
- **AND** 側選單 SHALL 僅顯示「需求單管理 → 需求單列表」單一 group + sub item（不含訂單管理；Miles 2026-04-27 修正）

---

### Requirement: 模組存取權限模型

系統 SHALL 對每個角色定義四個模組（需求單、報價單/訂單、工單、任務）的存取層級。權限層級分為 R/W（可讀寫）與 X（無存取權限）。

**「R/W」為粗粒度標示**，意義為「該角色於該模組內擁有讀取與寫入能力」。實際細粒度權限（可讀哪些資料、可寫哪些欄位、可執行哪些動作）由各模組 spec 的 Requirement 規範。例如業務主管於需求單模組為 R/W，但細粒度上僅可核可特定狀態且自己被指定的需求單，這類細節由 [quote-request spec](../quote-request/spec.md) 的對應 Requirement 定義。

新增角色時 SHALL 同時於 user-roles spec 設定粗粒度 R/W 標示，並於對應模組 spec 補充細粒度行為 Requirement。

#### Scenario: 角色存取無權限模組

WHEN 角色的模組權限為 X
THEN 系統 SHALL 不顯示該模組的任何入口，且任何 API 請求 MUST 回傳權限不足錯誤

#### Scenario: 角色存取可讀寫模組

WHEN 角色的模組權限為 R/W
THEN 系統 SHALL 允許該角色查看與編輯該模組中其職責範圍內的資料
AND 細粒度權限（可讀範圍、可寫欄位、可執行動作）SHALL 由各模組 spec 的 Requirement 規範

#### Scenario: 完整權限對照表

WHEN 系統配置角色權限
THEN 各角色的模組權限 SHALL 依下表設定：

| 角色 | 需求單 | 報價單/訂單 | 工單 | 任務 |
|------|--------|------------|------|------|
| Supervisor | R/W | R/W | R/W | R/W |
| 訂單管理人 | X | R/W | R/W | R/W |
| 業務 | R/W | R/W | X | X |
| 諮詢 | R/W | R/W | X | X |
| 業務主管 | R/W | X | X | X |
| 會計 | X | R/W | X | X |
| 審稿主管 | X | X | X | X |
| 審稿 | X | X | X | X |
| 印務主管 | R/W | X | R/W | X |
| 印務 | X | X | R/W | R/W |
| 生管 | X | X | X | R/W |
| 師傅 | X | X | X | R/W |
| 中國廠商 | X | X | X | R/W |
| 外包廠商 | X | X | X | R/W |
| QC | X | X | R/W | R/W |
| 出貨 | X | X | R/W | R/W |
| EC商品管理 | X | X | X | X |

QC 角色於 C1 後對「任務」模組由 X 改為 R/W（之前為 X），因為 QC 任務與品檢任務改以 ProductionTask 承載（屬於「任務」模組），QC 人員需於任務模組內查看與更新被指派的任務。細粒度限制詳見 § QC 角色編輯限制。

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

業務與諮詢角色的工單模組權限為 X（無直接存取），但 SHALL 可透過訂單詳情頁面查閱工單狀態與 QC / 品檢任務摘要。

#### Scenario: 業務從訂單頁面查閱工單狀態

WHEN 業務角色開啟訂單詳情頁面
THEN 系統 SHALL 顯示該訂單關聯工單的狀態摘要（唯讀）
AND SHALL 顯示 QC / 品檢任務摘要（唯讀；含 type = `qc`（印件入庫檢查）與 `inspection`（工序中間品檢）的 ProductionTask 結果概要）
AND MUST NOT 提供導航至工單模組的連結

#### Scenario: 業務角色可轉單

WHEN 業務角色在需求單或訂單中執行轉單操作
THEN 系統 SHALL 允許將該單據指派給其他業務或諮詢角色

---

### Requirement: 業務 Role 業務平台功能存取

業務角色（Role = 業務）SHALL 可使用業務平台內所有開放給業務 Role 的功能。本次納入：[sales-platform spec § Requirement: 業務平台印件總覽](../sales-platform/spec.md) — 純檢視，自動套用 `Order.sales_id = current_user.id` 過濾。

業務 Role 對業務平台印件總覽的存取 SHALL 不違反既有 § Requirement: 業務與諮詢角色的工單查閱限制 — 業務平台印件總覽屬於業務平台容器內的自有功能，業務透過此功能查閱印件層彙整資料（不導航至工單模組詳情頁），與「業務 MUST NOT 提供導航至工單模組的連結」原則一致。

業務 Role 同時 SHALL 可進入印件詳情頁（`/print-items/:id`）查閱審稿紀錄等印件深度資訊。印件詳情頁是跨 capability 的 UI 元件（涉及印件 / 審稿 / 工單 / QC / 轉交單 / 出貨單 / 活動紀錄資訊），既有 spec 尚未拆出獨立「印件 read model」capability。本 change 開放業務 / 諮詢進入印件詳情頁時，僅可見「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab（其他生產相關 Tab 隱藏，見 [sales-platform spec § Requirement: 業務平台印件詳情頁 Tab 閹割](../sales-platform/spec.md)），實質上業務 / 諮詢看到的內容不含工單模組任何資訊，與「業務 MUST NOT 導航至工單模組」原則一致。

**會計 Role 不在本次開放範圍**：會計（accountant）雖屬業務平台（依既有 § 平台歸屬分類），但其職責限定於 § Requirement: 會計角色資料存取範圍 定義的「報價單 / 訂單模組（讀取）+ 對帳檢視」，不含印件相關功能。會計 MUST NOT 取得業務平台印件總覽 / 印件詳情頁的存取權。

後續新增業務平台功能 SHALL 在本 Requirement 列舉清單中補充，並於 [sales-platform spec](../sales-platform/spec.md) 內以對應 Requirement 詳細描述。

#### Scenario: 業務登入後可使用業務平台印件總覽

- **WHEN** 業務角色登入系統
- **THEN** 業務平台側邊欄 SHALL 顯示「印件總覽」入口
- **AND** 業務點擊入口 SHALL 導航至業務平台印件總覽頁面
- **AND** 該頁面 SHALL 自動套用 `Order.sales_id = current_user.id` 過濾（業務不可解除）

#### Scenario: 業務 Role 不可使用中台版印件總覽

- **WHEN** 業務角色嘗試以 URL 直接訪問中台版印件總覽（[work-order spec § 印務主管印件總覽](../work-order/spec.md) 對應路由）
- **THEN** 系統 MUST 回傳權限不足錯誤
- **AND** 業務 SHALL 僅能透過業務平台路徑使用印件總覽功能

#### Scenario: 業務 Role 可進入印件詳情頁查閱審稿紀錄

- **WHEN** 業務於業務平台印件總覽點擊某印件名稱
- **THEN** 系統 SHALL 導航至該印件詳情頁（`/print-items/:id`）
- **AND** 業務 SHALL 可查閱該印件的審稿紀錄、規格、檔案等資訊
- **AND** 業務於印件詳情頁僅可見「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab（工單 / QC / 轉交單 / 出貨單 Tab 隱藏，見 [sales-platform spec § 業務平台印件詳情頁 Tab 閹割](../sales-platform/spec.md)）
- **AND** 實質上業務看到的內容不含工單模組任何資訊，不違反 § 業務與諮詢角色的工單查閱限制 原則

#### Scenario: 會計 Role 不在本次印件相關功能開放範圍

- **WHEN** 會計角色登入系統
- **THEN** 業務平台側邊欄 MUST NOT 顯示「印件總覽」入口
- **AND** 會計 Role 嘗試以 URL 直接訪問 `/sales/print-items` 或 `/print-items/:id`，系統 MUST 回傳權限不足錯誤
- **AND** 會計權限沿用既有 § Requirement: 會計角色資料存取範圍 限定

#### Scenario: 業務平台印件總覽純檢視

- **WHEN** 業務於業務平台印件總覽查看印件
- **THEN** 系統 MUST NOT 顯示「分配印件」「審核工單」等動作按鈕（屬印務主管權限）
- **AND** 印件展開後的工單列表項目 MUST NOT 可點擊（不導航至工單詳情頁，符合既有「業務不導航至工單模組」原則）

---

### Requirement: 諮詢角色額外職責

諮詢角色 SHALL 具備與業務角色相同的模組權限，並額外負責 EC 客服問題處理。

#### Scenario: 諮詢角色處理 EC 客服問題

WHEN 諮詢角色收到 EC 客服相關問題
THEN 系統 SHALL 提供客服問題處理介面
AND 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

---

### Requirement: 會計角色職責（補增售後 ticket 紀錄查閱）

會計角色 MUST 僅能存取報價單 / 訂單模組（讀取）+ 對帳檢視（讀取與匯出），可查看範圍 SHALL 限於基本資料、付款紀錄、發票紀錄、折讓紀錄、訂單異動紀錄、AfterSalesTicket 紀錄。會計 MUST NOT 直接執行發票開立、作廢、折讓、ticket 建立 / 結案等操作（這些動作由業務 / 諮詢執行）。

會計的核心職責為**對帳**：透過訂單詳情頁的對帳檢視面板與後台批次對帳檢視，確認三方金額（應收 / 發票淨額 / 收款淨額）一致。會計查閱 AfterSalesTicket 紀錄的目的為：
1. 確認跨期 OrderAdjustment（linked_after_sales_ticket_id 非空）對應的 ticket 已正確記錄客訴源頭與 responsibility
2. 對帳警示 banner 觸發時可回溯至對應 ticket 查看 case 詳情
3. 月度公司認賠金額統計（依 responsibility = 公司認賠 篩選關聯 OrderAdjustment 已執行金額）

#### Scenario: 會計查閱訂單售後紀錄

- **GIVEN** 訂單已完成且有關聯 AfterSalesTicket
- **WHEN** 會計開啟訂單詳情頁的「售後服務」Tab
- **THEN** 系統 SHALL 顯示 ticket 列表（唯讀）
- **AND** 會計 SHALL 可點擊 ticket 查看 customer_complaint、case_category、responsibility、關聯 OrderAdjustment
- **AND** 會計 MUST NOT 看到「建立售後服務單」「結案」「修改 resolution」等操作按鈕

#### Scenario: 會計依公司認賠 responsibility 統計月度認賠額

- **WHEN** 會計於後台對帳檢視頁需要統計 2026 年 5 月公司認賠總額
- **THEN** 系統 SHALL 提供查詢介面：filter AfterSalesTicket.responsibility = 公司認賠 AND 關聯 OrderAdjustment.executed_at 落於 2026-05
- **AND** 結果 SHALL 顯示 sum of |OrderAdjustment.amount|（絕對值）

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
- 唯讀：其他印務負責的工單（僅在跨印務印件場景下，透過印件總覽與印件詳情頁查看進度）

**印件總覽**：
- 讀取：可查看印件總覽，並使用「只顯示我參與的印件」篩選
- 判斷邏輯：印件下有任何 WorkOrder.assigned_to 等於當前印務
- 跨印務印件：可查看同印件下其他印務負責的工單進度，但 MUST NOT 編輯

**印件詳情頁**：
- 入口：印件總覽（`/work-orders/print-items`）點擊印件進入
- 讀取：可完整查看該印件下所有工單與生產任務的明細與進度，不因工單負責人不同而隱藏
- 報工：僅可對自己負責工單（WorkOrder.assigned_to 等於當前印務）下的生產任務執行單筆或批次報工；其他工單下的生產任務報工按鈕與勾選框 MUST 為禁用狀態
- 編輯邊界：印件詳情頁 MUST NOT 提供 QC 單建立、工單異動、生產任務建立 / 編輯等工單層操作，這些操作仍於工單詳情頁進行

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

#### Scenario: 印務於印件詳情頁追蹤跨工單狀況

- **WHEN** 印務開啟一個跨印務印件的詳情頁
- **THEN** 系統 SHALL 完整顯示該印件下所有工單與生產任務的明細（含他人負責工單）
- **AND** 印務 SHALL 可對自己負責工單下的生產任務執行單筆或批次報工
- **AND** 對非自己負責工單下的生產任務，報工操作 MUST 為禁用狀態

#### Scenario: 印務主管權限與印務一致

- **WHEN** 印務主管開啟印件詳情頁
- **THEN** 系統 SHALL 套用與印務角色相同的權限規則：完整讀取、報工受工單負責人約束
- **AND** 印務主管 MUST NOT 因主管身份取得跨工單代報工權限

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

QC 角色（兼任品檢執行）SHALL 擁有工單模組與任務模組的 R/W 權限。

工單模組可編輯範圍 MUST 限於 QC 任務（type = `qc`，印件入庫檢查）與品檢任務（type = `inspection`，工序中間品檢）的結果欄位，不可修改工單其他內容；任務模組可編輯範圍 MUST 限於被指派的 QC PT 與 inspection PT，不可修改 production 任務或其他人指派的任務。

QC PT（每印件強制 1 個）由系統在工單規劃完成後自動建立；inspection PT 由印務在工單規劃時對特定 production PT 加入。QC 角色僅能執行已建立的任務、提交 ProductionTaskWorkRecord（reported_quantity + passed_quantity，系統自動計算 failed_quantity）。QC / inspection 任務生命週期詳見 [production-task spec § ProductionTaskWorkRecord 結果欄位](../production-task/spec.md) 與 [qc spec § QC 角色權限邊界](../qc/spec.md)。

#### Scenario: QC 人員記錄檢驗結果

WHEN QC 角色於任務模組或工單詳情頁開啟被指派的 QC PT 或 inspection PT
THEN 系統 SHALL 提供 `reported_quantity` 與 `passed_quantity` 填寫介面（每筆 WorkRecord 提交時填）
AND 系統 SHALL 自動計算 `failed_quantity = reported_quantity - passed_quantity` 並寫入 WorkRecord
AND QC 角色 SHALL 可多次提交 WorkRecord（支援分批驗收，累計到 PT.pt_qc_passed）
AND MUST NOT 允許修改 `pt_target_qty`、`assigned_operator`、工單的製程 / 數量 / 排程等欄位
AND MUST NOT 允許建立新 QC PT（由系統自動建立）
AND MUST NOT 允許建立新 inspection PT（由印務在規劃期建立）

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
| 業務主管 | 評估 |
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

### Requirement: 業務主管角色職責

業務主管 SHALL 負責**訂單建立後、報價單外發前的成交條件審核**：與業務確認收款條件、報價金額、交期合理後，將線下訂單從「待業務主管審核」推進至「報價待回簽」。業務主管 MUST NOT 介入需求單流程任何狀態轉換（需求確認、成本評估、議價、成交 / 流失皆由業務獨立執行）。

業務主管的核准決策範圍 MUST 限於「訂單指定的業務主管 = 自己」的訂單；MUST NOT 跨業務主管核准他人指定範圍的訂單。業務主管 SHALL 擁有需求單模組的只讀權限（提供部門總覽能力）；MUST NOT 編輯需求單內容、推進需求單狀態、或執行成交 / 流失動作。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理「訂單審核」「訂單異動審核」「售後服務檢視」三類待辦（對齊印務主管模式）。

業務主管的利害關係程度 SHALL 為「高」，因「待業務主管審核 → 報價待回簽」為訂單流程關鍵推進節點，未通過則報價單無法外發給客人簽回。

**訂單異動審核範疇**：業務主管 SHALL 負責 OrderAdjustment（訂單異動單）的金額核可（草稿 → 待主管審核 → 已核可 / 已退回）。此職責不分 OrderAdjustment 是否關聯 AfterSalesTicket（含 linked_after_sales_ticket_id 為 NULL 的訂單期間異動，與非 NULL 的售後 ticket 內加掛異動，皆走相同核可流程）。

**售後服務 ticket 的角色定位**：業務主管 SHALL **不參與 AfterSalesTicket 系統流程**（無 ticket 核可關卡）。業務主管與業務於 Slack 線下討論售後事件處理方式，討論結果由業務於 ticket 上記錄（resolution、slack_thread_url）。業務主管在售後流程的決策影響力透過：
1. ticket 內若加掛 OrderAdjustment（退款 / 補印收費），業務主管於 OrderAdjustment 層級審核金額
2. Slack 上的討論（外於 ERP 系統）

**[本 change ADDED] 業務主管中台「售後服務」檢視頁職責**：

業務主管 SHALL 可於中台「售後服務」頁（路由 `/sales-manager/after-sales`）以**唯讀視角**檢視**全公司**所有 AfterSalesTicket（跨業務主管管轄範圍），作為他在 Slack 與業務跟催售後事件處理進度的決策入口。本頁面範圍為「**檢視範圍 = 全公司 ticket 唯讀**」，與業務主管的「**核可決策範圍 = 訂單指定的業務主管 = 自己**」職責邊界並存：

- **檢視範圍（全公司）**：所有業務 / 諮詢開立的 ticket，無論訂單的 `approved_by_sales_manager_id` 是否為當前主管。理由：售後事件處理品質為公司整體服務水準指標，主管以全局視角識別異常情境（逾期久未跟催 / 跨業務責任不清 / 公司認賠金額異常）後透過 Slack 跨部門協調。
- **核可決策範圍（部門內）**：當售後 ticket 內加掛 OrderAdjustment（退款 / 補印收費）時，主管於 OrderAdjustment 層的核可動作仍 MUST 限「OrderAdjustment 所屬訂單的 `approved_by_sales_manager_id` = 自己」。本 change 不改 OrderAdjustment 核可權限規則。

業務主管 MUST NOT 在「售後服務」頁執行任何 ticket 編輯動作（修改 resolution / 結案 / 建立關聯 OA / 補述）。所有 ticket 編輯動作仍由業務 / 諮詢於訂單詳情頁的售後 Tab 執行。本頁面為純檢視 + 跳轉入口。

業務主管 SHALL 可於後台「訂單列表」依「售後狀態」篩選器查看部門內未結案售後訂單（既有功能保留），與本 change 新增的「售後服務」全公司檢視頁互補：
- 「訂單列表 + 售後狀態 filter」：order-centric，限「部門內」（`approved_by_sales_manager_id = self`），找特定訂單時使用
- 「售後服務」檢視頁：ticket-centric，全公司範圍，掃描整體售後狀況時使用

頁面具體行為（路由 / 篩選器 / 表格欄位 / 摘要卡 / Scenarios）定義於 [after-sales-ticket spec § Requirement: 業務主管全公司售後管理頁](../after-sales-ticket/spec.md)。

#### Scenario: 業務主管核可訂單異動單

- **GIVEN** OrderAdjustment.status = 待主管審核、approved_by_sales_manager_id = 業務主管 A
- **WHEN** 業務主管 A 於後台「待審核訂單異動」頁點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管不直接操作 AfterSalesTicket

- **WHEN** 業務主管嘗試於 AfterSalesTicket 詳情頁操作「結案」「修改 resolution」「建立關聯 OrderAdjustment」
- **THEN** 系統 MUST 拒絕（按鈕設為 disabled）
- **AND** 提示「售後服務單由業務操作；如需介入請於 Slack 與業務討論」

#### Scenario: 業務主管查看部門內售後處理中訂單

- **WHEN** 業務主管於訂單列表選擇篩選器「售後處理中 / 售後逾期」+ approved_by_sales_manager_id = self
- **THEN** 列表 SHALL 列出該主管管轄業務負責的有未結案售後 ticket 訂單

#### Scenario: 業務主管查看全公司未結案售後 ticket

- **GIVEN** 業務主管 A 登入中台、全公司有未結案 AfterSalesTicket 12 張（含 5 張為 A 管轄部門、7 張為其他主管管轄部門）
- **WHEN** A 從中台 sidebar「訂單管理_業務主管」group 點擊「售後服務」
- **THEN** 系統 SHALL 導航至 `/sales-manager/after-sales`
- **AND** 頁面 SHALL 顯示全公司 12 張未結案 ticket（**不過濾**負責業務主管管轄範圍）
- **AND** A SHALL 可透過「業務 / 諮詢負責人」filter 自行收斂至特定業務 / 諮詢的 ticket

#### Scenario: 業務主管查看非管轄業務的售後 ticket 紀律邊界

- **GIVEN** 業務主管 A 進入全公司售後管理頁、列表中含 ticket AS-20260520-03 屬於業務主管 B 管轄部門（`Order.approved_by_sales_manager_id = B`）
- **WHEN** A 點擊該 ticket 跳轉至訂單詳情頁售後 Tab
- **THEN** 系統 SHALL 允許跳轉（唯讀視角）
- **AND** A MUST NOT 對該 ticket 執行任何系統內編輯動作（建立 / 修改 resolution / 結案 / 建關聯 OA / 補述）
- **AND** 訂單詳情頁售後 Tab MUST NOT 對 A 顯示編輯按鈕（即使 A 是業務主管角色，但訂單 `approved_by_sales_manager_id ≠ A`）
- **AND** A 若需介入處理 SHALL 透過 Slack 與業務主管 B 或 ticket `opened_by` 業務 / 諮詢線下協調
- **AND** 此 Scenario 明確區分「**檢視範圍 = 全公司唯讀**」與「**核可決策範圍 = 部門內**」並存的紀律邊界

### Requirement: 業務 / 諮詢的發票操作權責

業務 / 諮詢 SHALL 負責訂單付款 / 發票全流程操作：建立 PaymentPlan、記錄 Payment、開立 Invoice、作廢 Invoice、開立 / 作廢 SalesAllowance、建立 OrderAdjustment。所有操作 MUST 留 Activity log（誰、何時、操作類型、原因），供會計事後稽核與三方對帳使用。

#### Scenario: 業務於訂單詳情頁開立發票

- **GIVEN** 業務於訂單詳情頁
- **WHEN** 業務點擊「開立發票」並填表送出
- **THEN** 系統 SHALL 允許並建立 Invoice 紀錄
- **AND** Activity log MUST 記載「[時間] [業務] 開立發票 #INV-XXX 金額 XX,XXX」

#### Scenario: 業務作廢發票全程留痕

- **WHEN** 業務作廢 Invoice
- **THEN** 系統 MUST 在 Invoice 紀錄寫入 invalid_by、invalid_at、invalid_reason
- **AND** Activity log MUST 記載作廢動作

#### Scenario: 諮詢操作權責同業務

- **WHEN** 諮詢角色於訂單詳情頁執行付款 / 發票操作
- **THEN** 系統 SHALL 允許（諮詢與業務在此操作範圍同權）

### Requirement: 業務主管審核 OrderAdjustment 權責

業務主管 SHALL 負責審核 OrderAdjustment（含核可、退回）。業務主管 MUST NOT 直接執行訂單異動（建立 / 執行由業務 / 諮詢負責）。業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看待審清單，依負責業務、adjustment_type、訂單編號篩選。

#### Scenario: 業務主管核可訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回訂單異動需填原因

- **WHEN** 業務主管點擊「退回」
- **THEN** 系統 SHALL 強制要求填入退回原因（reject_reason）才允許送出
- **AND** OrderAdjustment.status SHALL → 已退回

#### Scenario: 業務主管不可建立訂單異動

- **WHEN** 業務主管於訂單詳情頁查看
- **THEN** 系統 SHALL NOT 顯示「建立訂單異動」按鈕
- **AND** 系統 SHALL 僅顯示「審核待審異動」入口

### Requirement: 業務主管審核付款計畫變更權責

業務主管 SHALL 負責審核因 PaymentPlan 變更（新增 / 刪除 / 修改期別）導致訂單回到「業務主管審核」狀態的訂單。沿用 [archived change: add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 的核可機制。

#### Scenario: 業務主管核可 PaymentPlan 變更後訂單恢復

- **GIVEN** 訂單因 PaymentPlan 變更回到「業務主管審核」
- **WHEN** 業務主管於訂單詳情頁核可
- **THEN** 訂單狀態 SHALL 恢復至變更前的後續狀態
- **AND** Activity log MUST 記載核可動作

### Requirement: 系統管理員維護 BillingCompany 主檔

系統管理員 SHALL 負責 BillingCompany 主檔的維護（新增、停用、設定 is_default）。一般使用者（業務、諮詢、會計、業務主管）僅能讀取。

#### Scenario: 系統管理員新增帳務公司

- **WHEN** 系統管理員於後台「帳務公司管理」頁新增 BillingCompany
- **THEN** 系統 SHALL 要求填入 name、tax_id、ezpay_merchant_id、address、phone
- **AND** 系統 MUST 驗證 ezpay_merchant_id 唯一性

#### Scenario: 系統管理員設定預設帳務公司

- **WHEN** 系統管理員設定某 BillingCompany.is_default = true
- **THEN** 系統 SHALL 自動將原預設的那筆 is_default 設為 false（同時間僅一筆 is_default = true）

#### Scenario: 一般使用者僅能讀取 BillingCompany

- **WHEN** 業務 / 諮詢 / 會計 / 業務主管登入
- **THEN** 系統 SHALL NOT 顯示「帳務公司管理」入口
- **AND** 需求單 / 訂單建立時的下拉選單 SHALL 僅顯示 is_active = true 的清單供選擇

### Requirement: 諮詢角色職責

諮詢角色 SHALL 為公司內獨立職位（專人專責），非業務兼任。諮詢角色 SHALL 具備與業務角色完全相同的模組權限與資料可見範圍 — MUST 可檢視全公司所有需求單 / 訂單，與業務在系統內無差別。

諮詢人員 SHALL 以 `consultant_id` 身分接 ConsultationRequest，諮詢結束「轉需求單」時，新建需求單的負責業務（owner）MUST 直接設定為當前 `consultant_id`。系統內 MUST NOT 提供「諮詢人員 → 業務」的角色切換動作；同一案件從諮詢到出貨完成，諮詢人員 SHALL = 該案件的業務負責人。

諮詢角色 SHALL 額外負責：

1. **EC 客服問題處理**（既有職責）
2. **諮詢單流程**（本 change 新增）：
   - 接收 webhook 自動建立的諮詢單分派
   - 諮詢結束「完成諮詢（不做大貨）」或「轉需求單（做大貨）」分支動作
   - 諮詢取消（限「待諮詢」狀態）

#### Scenario: 諮詢角色處理 EC 客服問題

- **WHEN** 諮詢角色收到 EC 客服相關問題
- **THEN** 系統 SHALL 提供客服問題處理介面
- **AND** 諮詢角色 SHALL 可查閱相關需求單與訂單資料以回覆客戶

#### Scenario: 諮詢角色執行諮詢單流程

- **GIVEN** 諮詢角色被指派為某 ConsultationRequest 的 `consultant_id`
- **WHEN** 諮詢角色開啟諮詢單詳情頁
- **THEN** 系統 SHALL 提供「完成諮詢（不做大貨）」與「轉需求單（做大貨）」兩個分支按鈕（狀態 = 待諮詢）
- **AND** 待諮詢狀態提供「取消諮詢」按鈕（觸發退費流程）

#### Scenario: 諮詢角色查閱諮詢單列表

- **WHEN** 諮詢角色登入並進入諮詢單列表頁
- **THEN** 系統 SHALL 預設篩選 `consultant_id = self`
- **AND** 列表 SHALL 顯示自己負責的諮詢單（含待諮詢、已轉需求單、完成諮詢、已取消）

#### Scenario: 諮詢角色查閱所有需求單與訂單

- **WHEN** 諮詢角色開啟需求單列表頁或訂單列表頁
- **THEN** 系統 SHALL 顯示全公司所有需求單 / 訂單（與業務角色相同範圍）
- **AND** 諮詢角色 MUST NOT 受限於「自己負責」的篩選

#### Scenario: 諮詢結束轉需求單時 consultant_id 自動成為需求單負責業務

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id = U1`
- **WHEN** 諮詢人員 U1 點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立新 QuoteRequest
- **AND** 新需求單的負責業務（owner）MUST = U1
- **AND** 系統 MUST NOT 提供「指派其他業務」選項（owner 自動帶入諮詢人員）

### Requirement: 業務角色職責（補增售後服務 ticket 操作）

業務 SHALL 負責需求單建立、報價、訂單建立、訂單異動單建立與執行、付款計畫管理、發票開立、收款記錄、訂單售後服務 ticket 全程操作。

業務於售後服務 ticket 上的職責：

1. **建立 ticket**：於訂單詳情頁「售後服務」Tab 建立 AfterSalesTicket，填入 customer_complaint、case_category、responsibility
2. **Slack 討論**：於 Slack 上 @ 業務主管討論處理方式，討論完成後將 Slack thread URL 貼入 ticket.slack_thread_url
3. **填入 resolution**：依 Slack 討論結果於 ticket 上填入 resolution（不處理 / 退款 / 補印 / 退款+補印）並送出決議
4. **建立關聯動作**：
   - 退款場景：於 ticket 內建關聯 OrderAdjustment(退印, -金額) → 提交業務主管審核 → 執行 → 於發票區建退款 Payment + 開 SalesAllowance
   - 補印免費場景：於 ticket 內建補印 PrintItem，走原審稿 / 工單流程
   - 補印收費場景：於 ticket 內建關聯 OrderAdjustment(補退, +補印費) + 建補印 PrintItem
5. **結案**：確認客戶滿意 / 所有下游動作完成後，點 ticket 上「結案」按鈕推進 ticket.status → 已結案
6. **append complaint log**：客戶後續補述時於 ticket 上 append additional_complaint_log（任何狀態皆可，但既有紀錄不可改）

業務於業務看板「我的未結案售後」分桶 SHALL 看到自己 opened_by = self 且 status ≠ 已結案 的 ticket，避免遺漏結案。

#### Scenario: 業務建立 AfterSalesTicket 完整流程

- **GIVEN** 業務 Alice 負責的訂單 ORD-001 狀態 = 已完成
- **WHEN** 客戶投訴後 Alice 於訂單詳情頁建立 AfterSalesTicket
- **THEN** 系統 SHALL 寫入 opened_by = Alice、case_no、opened_at
- **AND** Alice SHALL 必填 customer_complaint、case_category、responsibility
- **AND** ticket.status SHALL = 受理中

#### Scenario: 業務於 ticket 內建關聯 OrderAdjustment

- **GIVEN** AfterSalesTicket.resolution = 退款、status = 處理中
- **WHEN** 業務 Alice 於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 開啟 OrderAdjustment 表單，預填 linked_after_sales_ticket_id = 此 ticket、adjustment_type = 退印
- **AND** Alice 填入 amount 與明細後送審，OrderAdjustment 走原狀態機

#### Scenario: 業務結案 ticket

- **GIVEN** AfterSalesTicket.status = 處理中、關聯 OrderAdjustment 已執行、退款 Payment 已建立
- **WHEN** 業務 Alice 確認客戶滿意後點「結案」
- **THEN** ticket.status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at = 當下、closed_by = Alice

### Requirement: 業務主管角色職責調整（廢止付款計畫變更回審 + 僅核可退款負項 OA）

業務主管角色職責 SHALL 在訂單款項範疇進行以下調整：

**廢止職責**：
- **不再**因「付款計畫（PaymentPlan）變更觸發訂單回審」進行審核（v1.13 spec L951 規則廢止，BillingInstallment 變更改為留軌跡不回審）

**保留職責**：
- 核可退款負項 OrderAdjustment（amount < 0）：沿用 v1.13 設計、唯一審核 gate
- 訂單其他面向核可職責（如 quote 報價金額大幅異動、客戶信用紀錄等，沿用既有 spec）

**新增職責**：
- 事後監督業務補收 OA 大額閾值警示（透過 Slack 通知接收業務 [name] 建立大額補收 OA +N 元的提醒、發現異常時與業務溝通修正、不阻擋業務操作）

#### Scenario: 業務修改期次日期不觸發業務主管審核

- **GIVEN** 訂單已過業務主管審核進入製作中、業務修改 BillingInstallment 的 due_date
- **WHEN** 系統寫入 DUE_DATE_CHANGED ActivityLog 事件
- **THEN** 業務主管 SHALL NOT 收到審核請求
- **AND** 訂單狀態維持製作中

#### Scenario: 業務主管核可退款負項 OA

- **GIVEN** 業務建立 OA-100（amount=-5000, adjustment_type=退印, status=待主管審核）
- **WHEN** 業務主管於 OA 編輯介面點「核可」
- **THEN** OA-100.status SHALL = 已核可
- **AND** approved_by = 業務主管 user_id、approved_at = now

#### Scenario: 業務主管收到大額補收 OA 事後通知

- **GIVEN** 補收 OA 大額閾值設為 50000（系統設定值）
- **WHEN** 業務建立 OA-101（amount=+60000）並執行
- **THEN** 業務主管 SHALL 收到 Slack 通知「業務 [name] 建立大額補收 OA +60000 元於訂單 [order_no]」
- **AND** 業務主管 MAY 事後檢視 OA-101 + 與業務溝通（不阻擋操作）

### Requirement: 業務角色職責調整（補收 OA 免主管核可直接執行）

業務角色職責 SHALL 在訂單款項範疇新增「補收 OA 直接執行」職責：
- 業務 MAY 建立補收正項 OA（amount > 0, adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項}）並直接執行、無需業務主管核可
- 業務 SHALL 對所建補收 OA 內容負責；超過大額閾值（建議起始 50000）的 OA 觸發業務主管事後監督通知
- 業務 SHALL 沿用既有「建立退款負項 OA → 送業務主管核可」流程，無變動

#### Scenario: 業務直接執行補收 OA

- **GIVEN** 訂單期間客戶要求加印 +8000
- **WHEN** 業務建立 OA（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** 系統 SHALL 直接執行（跳過審核中間態）
- **AND** 業務 MAY 後續新增 BillingInstallment「加印款 8000」承載該補收應收

### Requirement: 諮詢人員角色職責沿用業務（諮詢取消善後手動開票）

系統 SHALL 沿用 consultation-request 既有諮詢人員角色職責設計，並對齊 converge-consultation-cancel-to-order-cancel-flow（2026-05-30 歸檔）：諮詢取消觸發時系統 **MUST NOT 自動建立待開發票（BillingInstallment / PlannedInvoice）**（廢除諮詢專屬自動建期次）+ 諮詢人員 SHALL 於需要時循一般訂單取消發票開立路徑手動開立諮詢費 Invoice + 諮詢人員 MAY 與業務角色等價執行訂單款項操作。

諮詢人員角色職責沿用既有設計，對齊本收斂如下：
- 諮詢取消觸發時，系統自動建立 OA(-1000, status=已核可, approved_by=system) + 退款 Payment(-1000, 處理中)；**MUST NOT 自動建立 BillingInstallment / PlannedInvoice**
- 諮詢人員 SHALL 於需要時手動開立諮詢費 Invoice（留存 1000 元收入）；未開票由對帳「應收 > 發票淨額」差額警示兜底提醒
- 諮詢人員 MAY 與業務角色等價執行訂單款項操作（依 after-sales-ticket § 諮詢角色等價原則）

#### Scenario: 諮詢取消善後諮詢人員手動開票

- **GIVEN** 諮詢人員或業務主管於諮詢取消 dialog 確認、cancel_reason_category 已選
- **WHEN** 系統執行半額退費連動鏈
- **THEN** 系統 SHALL 自動建立 OA(-1000, 已核可) + 退款 Payment(-1000, 處理中)
- **AND** 系統 MUST NOT 自動建立 BillingInstallment 或 PlannedInvoice（廢除諮詢專屬自動建待開發票）
- **AND** 諮詢人員 SHALL 於需要時循一般訂單取消發票開立路徑手動開立諮詢費 Invoice（留存 1000 元收入）
- **AND** `source_type = consultation_cancellation` enum 保留供業務手動建期次時標示來源

### Requirement: 會計角色職責新增（CSV 匯出 + 月結對帳閉環）

會計角色職責 SHALL 在訂單款項範疇新增以下內容：

**CSV 匯出**：
- 會計 SHALL 定期（建議月底 + 月結對帳週期）匯出 14 欄對帳 CSV
- CSV 一列 = 一張已開立發票，含應收日 / 開立日 / 收款日 / 收款狀態 / 月底基準 / 帳期天數
- 會計 SHALL 對照 CSV + 銀行對帳單完成月結對帳

**月結對帳閉環**：
- 月結批次 SHALL 自動跑「三方對帳差錯訂單清單」（CEO 指標 2，限定 Order.status = 已完成 且 應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額）
- 警示清單推送給會計檢視（不另建會計反饋系統，CEO Challenge 1 採 (c) 路徑）
- 會計發現差錯時 SHALL 透過 Slack 通知對應訂單業務 / 諮詢處理（人工閉環）

**未來職責**（OQ-BI-2 待 Miles 拍板）：
- 月結閉檔批次操作（locked_by_period_close = true）—— Phase 1 階段預設不啟用、後續 change 處理

#### Scenario: 會計月底匯出對帳 CSV

- **WHEN** 會計於對帳模組選 2026-05-01 ~ 2026-05-31 範圍、點「匯出 CSV」
- **THEN** 系統 SHALL 列出範圍內所有 Invoice.status=開立 的發票紀錄
- **AND** 14 欄資料完整（含繼承來源期次的應收日 + 備註）
- **AND** CSV UTF-8 with BOM 編碼

#### Scenario: 會計收到月結差錯訂單警示

- **GIVEN** 月結批次跑指標 2「三方對帳差錯訂單數」、發現訂單 ORD-001（已完成、應收 ≠ 發票淨額）
- **WHEN** 系統推送警示清單
- **THEN** 會計 SHALL 收到清單含 ORD-001
- **AND** 會計 SHALL 透過 Slack 通知對應業務 / 諮詢追查差錯原因（人工閉環）

