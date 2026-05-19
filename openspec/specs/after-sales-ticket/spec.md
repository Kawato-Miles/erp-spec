## Purpose

售後服務模組 -- 訂單已完成後的客訴 / 不良 / 規格不符 / 物流問題 / 工法限制 / 交期延誤等售後事件的承載容器。
業務與業務主管於 Slack 線下討論決議，ERP 僅記錄結果（resolution / responsibility / case_category / Slack thread URL）並追蹤結案。

**問題**：
- OrderAdjustment v1.2 雙重身份設計（during_order / after_completion）無法承載售後事件的「決議階段」「事件容器」「結案語意」三個業務需求
- 缺少 case_category / responsibility 結構化分類，售後事件無法用於業務分類、ticket 列表篩選、接手 / 操作判斷

**目標**：
- 主要：提供售後事件從受理到結案的 lifecycle 容器（受理中 → 處理中 → 已結案），讓 OrderAdjustment 回歸純金額異動載具
- 次要：透過 case_category + responsibility 結構化分類，支援未來「公司認賠金額 / 月」「哪類瑕疵最常發生」等管理切片

- 來源 BRD：尚未建立（v0.1 由 add-after-sales-ticket change 歸檔 2026-05-18 產生）
- Prototype：`sens-erp-prototype/src/components/order/AfterSalesSection.tsx` + `AfterSalesTicketDetail.tsx` + `MyAfterSalesBucket.tsx`
- 相依模組：訂單管理（OrderAdjustment / PrintItem / Payment / SalesAllowance）、業務情境（情境 1-3 改用 ticket 路徑）

---
## Requirements

### Requirement: AfterSalesTicket 實體與欄位

系統 SHALL 提供 AfterSalesTicket 實體，作為訂單已完成後客訴 / 不良 / 規格不符 / 物流問題 / 工法限制 / 交期延誤等售後事件的承載容器。一張 AfterSalesTicket 屬於單一 Order，記錄業務 / 諮詢與業務主管討論後的決議結果、責任歸屬、售後類型分類，並關聯下游動作（OrderAdjustment / PrintItem / SalesAllowance）。

**核心欄位：**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單；強制 `Order.status = 已完成` |
| `case_no` | string | Y | 售後服務單編號（系統產生，格式：AS-YYYYMMDD-XX）|
| `opened_at` | timestamp | Y | 建立時間 |
| `opened_by` | FK -> 使用者 | Y | 建立者（業務 / 諮詢）|
| `customer_complaint` | text | Y | 客訴內容 / 售後事件描述 |
| `case_category` | enum | Y | 售後類型分類（印件瑕疵 / 規格不符 / 物流問題 / 工法限制 / 交期延誤 / 其他）|
| `responsibility` | enum | Y | 責任歸屬（公司認賠 / 客戶承擔 / 共同分擔）|
| `resolution` | enum | N | 決議處理方式（不處理 / 退款 / 補印 / 退款+補印），決議前為 NULL |
| `slack_thread_url` | URL | N | 業務 / 諮詢與主管討論的 Slack thread URL，手動貼入 |
| `additional_complaint_log` | array<{logged_at, note}> | N | 客戶後續補述紀錄（escape hatch），預設空陣列 |
| `customer_feedback_note` | text | N | 結案後客戶回饋備註（不主動詢問）|
| `status` | enum | Y | 受理中 / 處理中 / 已結案（狀態機，見「AfterSalesTicket 狀態機」Requirement）|
| `closure_status` | enum | Y | 未結案 / 已結案（derived from status）|
| `closed_at` | timestamp | N | 結案時間，結案後寫入 |
| `closed_by` | FK -> 使用者 | N | 結案者 |
| `legacy_migrated` | boolean | N | 標記是否為從歷史 OrderAdjustment(phase=after_completion) 遷移而來 |

**關聯欄位（反向關聯）：**

| 關聯 | 說明 |
|------|------|
| `linked_adjustments` | 0..N 個 OrderAdjustment（透過 OrderAdjustment.linked_after_sales_ticket_id）|
| `linked_print_items` | 0..N 個 PrintItem（補印用，透過 PrintItem.related_after_sales_ticket_id）|

#### Scenario: 業務 / 諮詢於已完成訂單建立 AfterSalesTicket

- **GIVEN** Order.status = 已完成、completion_date = 2026-03-15、訂單尚無關聯 AfterSalesTicket
- **WHEN** 業務或諮詢於 2026-05-06 點擊訂單詳情頁的「建立售後服務單」
- **THEN** 系統 SHALL 開啟 AfterSalesTicket 建單表單
- **AND** 必填 `customer_complaint`、`case_category`、`responsibility`
- **AND** 可選填 `slack_thread_url`
- **AND** 系統 SHALL 寫入 `case_no`（AS-20260506-XX）、`opened_at`、`opened_by` = 當前使用者
- **AND** 新 AfterSalesTicket.status SHALL = 受理中
- **AND** resolution SHALL = NULL（決議前）

#### Scenario: AfterSalesTicket 建單時 Order 必須已完成

- **GIVEN** Order.status ≠ 已完成（例：生產中、出貨中）
- **WHEN** 業務 / 諮詢嘗試點擊「建立售後服務單」
- **THEN** 系統 MUST 拒絕並提示「訂單尚未完成，請使用『建立訂單異動單』處理生產期間的異動」
- **AND** 系統 MUST NOT 建立 AfterSalesTicket

### Requirement: 業務 / 諮詢角色售後 ticket 權限範圍

本 spec 中所有 Requirement / Scenario 提及「業務」執行的售後 ticket 動作（建立 ticket、送出決議、修改 `case_category` / `responsibility` / `resolution`、append `additional_complaint_log`、貼 Slack URL、結案等）SHALL 等價適用於「諮詢」角色。

依 [user-roles spec § Requirement: 諮詢角色額外職責](../user-roles/spec.md) 既有原則，諮詢角色 SHALL 具備與業務角色相同的模組權限。本 Requirement 在 after-sales-ticket spec 內顯式化此原則，避免讀者誤以為諮詢角色不在範圍。

#### Scenario: 諮詢於已完成訂單建立 AfterSalesTicket

- **GIVEN** Order.status = 已完成、訂單尚無關聯 AfterSalesTicket、當前使用者為諮詢角色
- **WHEN** 諮詢點擊訂單詳情頁的「建立售後服務單」
- **THEN** 系統 SHALL 開啟 AfterSalesTicket 建單表單（與業務操作流程相同）
- **AND** `opened_by` 寫入當前諮詢使用者
- **AND** 新 ticket 出現於該諮詢的「我的售後服務」作業頁

#### Scenario: 諮詢可送出決議與結案他人開立的 ticket

- **GIVEN** AfterSalesTicket 由業務 Alice 開立、status = 受理中、resolution = NULL
- **WHEN** 諮詢 Bob 於業務 Alice 休假期間打開該 ticket 並填入 resolution = 退款 點「送出決議」
- **THEN** 系統 SHALL 允許（諮詢具備與業務相同的權限）
- **AND** ActivityLog 記錄事件描述 = 「決議送出」、操作人 = Bob

#### Scenario: 諮詢可 append additional_complaint_log

- **GIVEN** AfterSalesTicket.status = 處理中、`opened_by` = 業務 Alice
- **WHEN** 諮詢 Bob 於客戶來電後 append 補述
- **THEN** 系統 SHALL 允許
- **AND** ActivityLog 記錄補述者為 Bob

### Requirement: 一個 Order 最多關聯 1 張 AfterSalesTicket

系統 SHALL 強制一個 Order 同時只能存在 1 張未結案 AfterSalesTicket。業務嘗試建第二張未結案 ticket 時，系統 MUST 拒絕並提示使用既有 ticket 的 `additional_complaint_log` 記錄後續客訴。

結案後若客戶再投訴，業務 SHALL 可建立新的 AfterSalesTicket（已結案 ticket 不算入「最多 1 張」限制），但需審視是否屬於「應在原 ticket 內補述」的情境。

#### Scenario: 訂單已有未結案 ticket 時拒絕新建

- **GIVEN** Order ORD-001 已有 1 張 AfterSalesTicket 處於「處理中」狀態
- **WHEN** 業務再次點擊「建立售後服務單」
- **THEN** 系統 MUST 拒絕新建
- **AND** 系統 SHALL 顯示提示「此訂單已有未結案售後服務單 AS-XXX，請點擊進入或於 additional_complaint_log 補述客戶後續反映」
- **AND** 系統 SHALL 提供連結直接跳至既有 ticket

#### Scenario: 訂單既有 ticket 已結案後允許新建

- **GIVEN** Order ORD-002 既有 AfterSalesTicket AS-001 status = 已結案
- **WHEN** 業務點擊「建立售後服務單」
- **THEN** 系統 SHALL 允許建單
- **AND** 新 ticket 與舊 ticket 共存於 Order 下，業務可於訂單詳情頁切換查看

### Requirement: AfterSalesTicket 狀態機

AfterSalesTicket SHALL 採用三狀態機，無核可關卡（業務與主管在 Slack 線下討論，系統只記錄結果）：

| 狀態 | 說明 |
|------|------|
| 受理中 | 已建立 ticket，業務尚未填入 resolution |
| 處理中 | 業務已填入 resolution 並送出決議；下游動作（OrderAdjustment / PrintItem 補印）可建立與執行 |
| 已結案 | 業務手動點「結案」推進的終態 |

狀態轉換：

```
受理中 ─ 送出決議（填 resolution）──▶ 處理中
處理中 ─ 業務點結案 ────────────────▶ 已結案
處理中 ─ 業務修改 resolution ───────▶ 處理中（同態，但允許 resolution 變更）
已結案 ─ 不可重開 ──────────────────▶ X
```

`closure_status` 為 derived field：`status = 已結案` → `closure_status = 已結案`；否則 `closure_status = 未結案`。

#### Scenario: 受理中 ticket 填入 resolution 推進處理中

- **GIVEN** AfterSalesTicket.status = 受理中、resolution = NULL
- **WHEN** 業務填入 resolution = 退款 並點「送出決議」
- **THEN** status SHALL → 處理中
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「決議送出」、resolution 值）

#### Scenario: 處理中 ticket 業務手動結案

- **GIVEN** AfterSalesTicket.status = 處理中、resolution = 退款、關聯 OrderAdjustment 已執行、退款 Payment 已建立
- **WHEN** 業務點擊「結案」
- **THEN** status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at = 當下時間、closed_by = 操作業務
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「結案」）

#### Scenario: 處理中 ticket 修改 resolution

- **GIVEN** AfterSalesTicket.status = 處理中、resolution = 退款
- **WHEN** 業務發現客戶要求改為「退款+補印」，於 ticket 上修改 resolution
- **THEN** resolution SHALL 更新為「退款+補印」
- **AND** status SHALL 維持「處理中」
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「resolution 變更」、舊值、新值）

#### Scenario: 已結案 ticket 不可重開

- **GIVEN** AfterSalesTicket.status = 已結案
- **WHEN** 業務嘗試於 UI 操作「重開」
- **THEN** 系統 MUST 拒絕並提示「已結案 ticket 不可重開，請建立新售後服務單處理新客訴」
- **AND** 業務 SHALL 可建立新 ticket（既有結案 ticket 不阻擋）

### Requirement: 售後類型分類（case_category）

`case_category` SHALL 採固定 enum，作為業務分類與 ticket 列表篩選 / 接手判斷的依據：

| enum 值 | 適用情境 |
|---------|---------|
| 印件瑕疵 | 印刷品質問題（飛墨、背印、脫膜、污漬、套色不準等客觀偏差）|
| 色差爭議 | 客戶主觀認定色差但公司認為合格的爭議情境（責任歸屬難認定）|
| 規格不符 | 規格寫錯、與打樣有出入、紙材替代未告知客戶 |
| 物流問題 | 運送破損、寄錯地址、延遲送達、宅配公司失誤 |
| 工法限制 | 工法評估後無法達成、需用替代方案、技術限制 |
| 交期延誤 | 製作延誤、無法準時交貨 |
| 其他 | 不屬上述六類的情境（業務於 customer_complaint 詳述）|

`case_category` 一經建立 SHALL 可由業務於 status = 受理中 或 處理中 時修改（覆寫舊值），結案後不可修改。

#### Scenario: 業務建立 ticket 時填入 case_category

- **WHEN** 業務於建單表單下拉選單選擇 case_category = 印件瑕疵
- **THEN** 系統 SHALL 寫入該值
- **AND** 未來統計查詢可依 case_category 分組

#### Scenario: 業務於處理中修改 case_category

- **GIVEN** ticket.status = 處理中、case_category = 印件瑕疵
- **WHEN** 業務發現實際是規格問題，改填 case_category = 規格不符
- **THEN** 系統 SHALL 允許修改
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「case_category 變更」、舊值、新值）

#### Scenario: 已結案 ticket 不可修改 case_category

- **GIVEN** ticket.status = 已結案
- **WHEN** 業務嘗試修改 case_category
- **THEN** 系統 MUST 拒絕（UI 該欄位設為唯讀）

### Requirement: 責任歸屬（responsibility）

`responsibility` SHALL 採固定三 enum，作為決議「補印是否收費」「退款是否由公司吸收」的操作依據：

| enum 值 | 說明 |
|---------|------|
| 公司認賠 | 公司方造成（瑕疵 / 規格寫錯 / 工法限制 / 交期延誤 / 物流失誤），費用由公司吸收 |
| 客戶承擔 | 客戶方造成（補檔錯誤 / 規格客戶確認過 / 客戶接受瑕疵但要求補印），費用由客戶承擔 |
| 共同分擔 | 雙方協商各承擔部分（例：客戶補檔加上公司加工失誤），業務於 customer_complaint 補述細節 |

`responsibility` 修改規則與 `case_category` 相同（受理中 / 處理中 可改，已結案不可改）。

#### Scenario: 公司認賠 + 補印免費

- **GIVEN** ticket.case_category = 印件瑕疵、responsibility = 公司認賠
- **WHEN** 業務填入 resolution = 補印 並建關聯 PrintItem
- **THEN** 系統 SHALL NOT 自動建立 OrderAdjustment（補印免費，無金額異動）
- **AND** PrintItem 走原審稿 / 工單 / 出貨流程，費用由公司內部吸收

#### Scenario: 客戶承擔 + 補印收費

- **GIVEN** ticket.case_category = 印件瑕疵、responsibility = 客戶承擔
- **WHEN** 業務填入 resolution = 補印 並建關聯 PrintItem（補印 100 份）
- **THEN** 系統 SHALL 提示「客戶承擔，請於 ticket 內建立補印費 OrderAdjustment」
- **AND** 業務點「建立補印費異動單」一鍵建 OrderAdjustment(adjustment_type=補退, amount=+補印費)
- **AND** 新 OrderAdjustment.linked_after_sales_ticket_id 自動寫入此 ticket

### Requirement: Slack thread URL 留痕

AfterSalesTicket SHALL 提供 `slack_thread_url` 欄位，業務於建單後將 Slack 討論串 URL 貼入。系統 NOT 記錄討論內容，僅提供回連入口。

業務 / 主管於 ticket 詳情頁點擊 URL 可開啟 Slack thread 查看完整討論脈絡。

#### Scenario: 業務於建單後貼入 Slack URL

- **GIVEN** ticket 已建立、status = 受理中
- **WHEN** 業務於 ticket 詳情頁的 slack_thread_url 欄位貼入 Slack thread URL
- **THEN** 系統 SHALL 寫入該值並驗證 URL 格式
- **AND** ticket 詳情頁顯示「Slack 討論串」按鈕，點擊 SHALL 於新分頁開啟該 URL

#### Scenario: 系統不主動發 Slack 通知（MVP）

- **GIVEN** ticket 已建立
- **THEN** 系統 MUST NOT 主動向任何 Slack channel 發送 webhook 通知
- **AND** Slack 通知由業務人工於 Slack 上 @ 主管發起
- **AND** 未來若整合 Slack channel 標準化（見 [OQ-NOTIFY-1](../../changes/add-after-sales-ticket/design.md#oq-notify-1)），可改為系統主動發 webhook

### Requirement: 與 OrderAdjustment 關聯（金額異動執行）

退款 / 補印收費場景下，業務 SHALL 於 ticket 內建立關聯的 OrderAdjustment。OrderAdjustment 加新欄位 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）標示其源自哪張售後 ticket。

OrderAdjustment 仍走既有狀態機（草稿 → 待主管審核 → 已核可 → 已執行），業務主管在 OrderAdjustment 層級審核金額。AfterSalesTicket 本身無核可關卡。

#### Scenario: 退款場景 ticket 內加掛 OrderAdjustment

- **GIVEN** ticket.resolution = 退款、status = 處理中
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 開啟 OrderAdjustment 建單表單，預填 adjustment_type = 退印、linked_after_sales_ticket_id = 此 ticket
- **AND** 業務填入 amount = -5000、明細 = 「退印瑕疵部分」
- **AND** OrderAdjustment SHALL 走草稿 → 待主管審核 → 已核可 → 已執行
- **AND** 業務執行 OrderAdjustment 後 SHALL 於發票區建退款 Payment(-5000)
- **AND** 視需要開立 SalesAllowance 關聯該退款 Payment（若已開過發票跨期）

#### Scenario: 補印收費場景 ticket 內加掛 OrderAdjustment

- **GIVEN** ticket.resolution = 補印、responsibility = 客戶承擔、case_category = 規格不符
- **WHEN** 業務於 ticket 內建補印 PrintItem 後點「建立補印費異動單」
- **THEN** 系統 SHALL 預填 OrderAdjustment(adjustment_type=補退, amount=+補印費, linked_after_sales_ticket_id=此 ticket)
- **AND** 業務送審 → 主管核可 → 業務執行
- **AND** PrintItem 走原審稿 / 工單流程

#### Scenario: 補印免費場景不建 OrderAdjustment

- **GIVEN** ticket.resolution = 補印、responsibility = 公司認賠
- **WHEN** 業務於 ticket 內建補印 PrintItem
- **THEN** 系統 SHALL NOT 自動建立 OrderAdjustment
- **AND** ticket 內顯示「免費補印，無金額異動」標示
- **AND** PrintItem 走原審稿 / 工單流程

#### Scenario: ticket 內 OrderAdjustment 取消後提示業務確認 resolution

- **GIVEN** ticket.resolution = 退款、status = 處理中、關聯 OrderAdjustment 處於草稿或已退回狀態
- **WHEN** 業務於 OrderAdjustment 點「取消」推進至「已取消」終態
- **THEN** ticket.resolution SHALL 維持原值（系統不自動清空）
- **AND** ticket 詳情頁的「關聯動作」區塊 SHALL 顯示提示「該決議的下游動作已取消，請確認是否變更 resolution 或重新建立關聯動作」
- **AND** 業務 SHALL 可選擇：(a) 修改 resolution 為其他值（不處理 / 補印）、(b) 重新建立關聯 OrderAdjustment、(c) 維持現狀

### Requirement: 與 PrintItem 關聯（補印觸發）

補印場景下，業務 SHALL 於 ticket 內建立補印 PrintItem。系統建 PrintItem 時自動寫入 `related_after_sales_ticket_id` FK，供下游審稿 / 工單流程回溯來源。

補印 PrintItem 走原 PrintItem 完整生命週期（審稿 → 工單 → 生產任務 → QC → 出貨），系統不為其建立特殊路徑。

#### Scenario: 業務於 ticket 內建補印 PrintItem

- **GIVEN** ticket.resolution = 補印 或 退款+補印
- **WHEN** 業務於 ticket 內點「建立補印印件」並填入規格（品名、數量、紙材等）
- **THEN** 系統 SHALL 建 PrintItem，related_after_sales_ticket_id = 此 ticket
- **AND** PrintItem SHALL 出現在訂單詳情頁印件區塊，標示「補印（來自 AS-XXX）」
- **AND** PrintItem SHALL 走原審稿流程（指派審稿員 → 審稿 → 合格送印）

#### Scenario: 補印 PrintItem 完成後 ticket 不自動結案

- **GIVEN** 補印 PrintItem 已通過 QC、出貨完成
- **WHEN** 系統推進 PrintItem 至完成
- **THEN** ticket.status MUST 維持「處理中」
- **AND** 系統 SHALL NOT 自動將 ticket 推進至「已結案」
- **AND** 業務 SHALL 確認客戶滿意後手動點「結案」

#### Scenario: 補印 PrintItem 於審稿 / 工單階段被取消

- **GIVEN** ticket.resolution = 補印、補印 PrintItem 處於審稿或工單階段
- **WHEN** 補印 PrintItem 因規格無法達成 / 客戶反悔 等原因被取消（PrintItem.status = 已取消）
- **THEN** ticket 詳情頁「關聯動作」區塊 SHALL 標示該 PrintItem 為「已取消」
- **AND** ticket.status 與 ticket.resolution SHALL 維持原值
- **AND** 系統 SHALL 顯示提示「補印已取消，請於 ticket 內重新建立補印印件或變更 resolution」
- **AND** 業務 SHALL 可選擇：(a) 於 ticket 內重新建補印 PrintItem、(b) 修改 resolution 為其他值（不處理 / 退款）、(c) 維持現狀並結案

### Requirement: additional_complaint_log（escape hatch）

ticket SHALL 提供 `additional_complaint_log`（陣列欄位），讓業務在「最多 1 張 ticket」限制下記錄客戶後續補述：

```
additional_complaint_log: [
  { logged_at: "2026-05-08", note: "客戶來電補述：除瑕疵外，物流也送錯地址" },
  { logged_at: "2026-05-10", note: "客戶接受退款 + 補印解決方案" }
]
```

業務於 ticket 任何階段（受理中 / 處理中 / 已結案）皆 SHALL 可 append 新紀錄，但既有紀錄不可修改 / 刪除。

#### Scenario: 業務於處理中 append 客戶補述

- **GIVEN** ticket.status = 處理中、additional_complaint_log = []
- **WHEN** 業務於 ticket 詳情頁點「補述客戶反映」並填入「客戶來電要求加賠 1000」
- **THEN** 系統 SHALL append 新紀錄（logged_at = 當下、note = 該文字）
- **AND** 既有紀錄不可修改
- **AND** ActivityLog 記錄「append complaint log」事件

#### Scenario: 已結案 ticket 仍可 append（但不可重開）

- **GIVEN** ticket.status = 已結案
- **WHEN** 業務想記錄結案後客戶再聯繫的內容
- **THEN** 系統 SHALL 允許 append additional_complaint_log
- **AND** ticket 仍維持「已結案」狀態
- **AND** 若客戶確實有新爭議需處理，業務 SHALL 建立新 ticket

### Requirement: 訂單詳情頁售後服務 Tab

訂單詳情頁 SHALL 新增「售後服務」Tab（沿用 [refactor-detail-pages-to-subheader-tab-layout](https://github.com/Kawato-Miles/sens-erp-prototype) 既有 Tab 模式），與「資訊」「印件」「對帳」「活動紀錄」並列。

Tab 顯示內容：
- 訂單關聯的 AfterSalesTicket 列表（最多 1 張未結案 + 0..N 張已結案）
- 「建立售後服務單」按鈕（僅 Order.status = 已完成 且無未結案 ticket 時可點擊）
- 各 ticket 卡片顯示：case_no、案件摘要、case_category、responsibility、resolution、status、closed_at（若已結案）

#### Scenario: 已完成訂單顯示售後服務 Tab

- **GIVEN** Order.status = 已完成
- **WHEN** 業務於訂單詳情頁切到「售後服務」Tab
- **THEN** Tab 內容 SHALL 顯示訂單關聯的 AfterSalesTicket 列表
- **AND** 若無 ticket，Tab 顯示「尚無售後服務紀錄」+「建立售後服務單」按鈕
- **AND** 若有未結案 ticket，「建立售後服務單」按鈕 SHALL 為 disabled 並提示「此訂單已有未結案 ticket」

#### Scenario: 未完成訂單售後服務 Tab 隱藏入口

- **GIVEN** Order.status ≠ 已完成
- **WHEN** 業務切到「售後服務」Tab
- **THEN** Tab 內容 SHALL 顯示「訂單未完成時無售後服務」+ 引導文「請使用『訂單異動單』處理生產期間異動」
- **AND** 「建立售後服務單」按鈕 MUST 隱藏

### Requirement: 訂單列表售後狀態欄位與篩選器

訂單列表 SHALL 新增「售後」欄位，依關聯 AfterSalesTicket 狀態推導徽章：

| 訂單關聯 ticket 狀態 | 「售後」欄位徽章 |
|---------------------|----------------|
| 無 ticket | 空白（不顯示徽章）|
| 至少 1 張未結案 ticket（受理中 / 處理中）| 「售後處理中」徽章（黃色）|
| 所有 ticket 皆已結案 | 「售後已結案」徽章（綠色）|

當未結案 ticket 開立時間距今超過 N 天（預設 7 天，見 [OQ-AST-3](../../changes/add-after-sales-ticket/design.md#oq-ast-3)）SHALL 改顯示紅色徽章「售後逾期」。

訂單列表 SHALL 提供「售後狀態」篩選器：全部 / 無 / 售後處理中 / 售後逾期 / 售後已結案。

#### Scenario: 訂單有未結案 ticket 顯示「售後處理中」黃徽章

- **GIVEN** Order.status = 已完成、關聯 AfterSalesTicket.status = 處理中、opened_at = 5 天前
- **WHEN** 使用者開啟訂單列表
- **THEN** 該訂單的「售後」欄 SHALL 顯示「售後處理中」黃色徽章

#### Scenario: 訂單未結案 ticket 超過 7 天顯示紅徽章

- **GIVEN** Order.status = 已完成、關聯 AfterSalesTicket.status = 處理中、opened_at = 10 天前
- **WHEN** 使用者開啟訂單列表
- **THEN** 該訂單的「售後」欄 SHALL 顯示「售後逾期」紅色徽章

#### Scenario: 業務篩選售後逾期訂單

- **WHEN** 業務於訂單列表點擊篩選器「售後逾期」
- **THEN** 列表 SHALL 列出所有 opened_at 距今 > 7 天的未結案 ticket 對應訂單
- **AND** 排序 SHALL 依 opened_at 升序（最久未處理優先）

### Requirement: 我的售後服務作業頁

系統 SHALL 提供「我的售後服務」作業頁（路由 `/my-after-sales`），業務 / 諮詢登入後 SHALL 可從業務平台 sidebar 進入。該頁列出當前使用者開立且 `status ≠ 已結案` 的 AfterSalesTicket，加強「漏單沒處理」的信號，提供 next action 提示協助業務 / 諮詢快速判斷下一步操作。

頁面 layout SHALL 對齊 [Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：「搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁」模式，禁止按狀態拆多張表或用卡片分組呈現資料。範式參考：[QuoteListPage](../../../../sens-erp-prototype/src/components/quote/QuoteListPage.tsx)（canonical reference）。

**頁面結構 SHALL 包含三個區段**：

1. **搜尋與篩選 Card**（單一 Card 內含三組元素，與既有列表頁慣例一致）：
   - 搜尋框：訂單編號 / 案名 / 客戶名稱（部分匹配、不分大小寫）
   - 篩選 grid（4 欄）：next action select / case_category select / responsibility select / 受理區間 date range
   - StatusCard grid（3 張數字卡）：逾期 / 待填決議 / 待結案，數字依篩選後結果顯示（filtered={true} 標記）

2. **操作列**：`flex justify-end`，含「刷新」「重設篩選」等動作

3. **單一資料表**：`<ErpTableCard>` 包 `<table className="erp-table">`，依下列欄位順序：

   | 欄位 | 寬度 | 說明 |
   |---|---|---|
   | # | 56px | 行號（依分頁）|
   | caseNo | 140px | AS-YYYYMMDD-XX |
   | 訂單編號 | 130px | ORD-... |
   | 客戶 / 案名 | auto | clientName · caseName |
   | 受理時間 | 110px | 相對時間（5 天前）|
   | 售後類型 | 100px | case_category |
   | 責任歸屬 | 90px | responsibility |
   | 決議 | 90px | resolution（NULL 時顯示 `—`）|
   | next action | 110px | 逾期 / 待填決議 / 待建關聯動作 / 待結案 |
   | status | 100px | status badge（受理中黃 / 處理中藍 / 逾期紅）|
   | 操作 | 60px | `[→]` 跳訂單詳情頁售後 Tab |

4. **分頁**：`<ErpPagination>`，PAGE_SIZE = 10（與 ConsultationRequestList 一致）

next action 分組 SHALL 採用下列定義（互斥；逾期優先於其他三組），以「獨立 table 欄位」形式呈現每行 ticket 的 next action 值：

| 分組 | 條件 |
|------|------|
| 逾期 | `opened_at` 距今 `> DEFAULT_RED_LIGHT_DAYS (7 天)` 且 `status ≠ 已結案` |
| 待填決議 | `status = 受理中` 且 `resolution = NULL` 且非逾期 |
| 待建關聯動作 | `status = 處理中` 且 `resolution ∈ {退款, 補印, 退款+補印}` 且該 resolution 對應下游動作（OrderAdjustment / 補印 PrintItem）尚未建立 且非逾期 |
| 待結案 | `status = 處理中` 且（對應下游動作已執行 或 `resolution = 不處理`）且非逾期 |

預設排序：`opened_at` 升序（最久未處理優先）。

sidebar 入口 SHALL 持續顯示當前使用者未結案 ticket 數字徽章（任何頁面都可見），徽章為 0 時 SHALL NOT 顯示徽章但保留入口。

#### Scenario: 業務進入「我的售後服務」頁

- **GIVEN** 業務 Alice 名下有未結案 ticket 5 張（逾期 1 張 / 待填決議 2 張 / 待結案 2 張）
- **WHEN** Alice 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 導航至 `/my-after-sales`
- **AND** 頁面 SHALL 顯示頂端待辦摘要：逾期 1 / 待填決議 2 / 待結案 2
- **AND** table SHALL 列出 5 張 ticket，依 opened_at 升序排序
- **AND** 每行 SHALL 顯示對應的 next action 欄位值

#### Scenario: 諮詢進入「我的售後服務」頁

- **GIVEN** 諮詢 Bob 名下有未結案 ticket 3 張
- **WHEN** Bob 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 顯示與業務角色相同的頁面結構（同 table、同摘要卡、同篩選器）
- **AND** table 僅 SHALL 含 `opened_by = Bob AND status ≠ 已結案` 的 ticket

#### Scenario: 點擊摘要卡套用 next action filter

- **GIVEN** 業務 Alice 進入「我的售後服務」頁，無 filter 套用、table 顯示全部 5 張未結案 ticket
- **WHEN** Alice 點擊頂端「逾期 1」摘要卡
- **THEN** table 套用 `nextAction = '逾期'` filter
- **AND** table 僅 SHALL 顯示「逾期」分組的 1 張 ticket
- **AND** 「逾期」摘要卡視覺強調（border 或背景加深）標示為 active
- **AND** 其他 StatusCard 數字 SHALL 依篩選後結果重新計算（待填決議 0 / 待結案 0）

#### Scenario: 再點同一摘要卡取消 filter（toggle）

- **GIVEN** 「逾期」摘要卡為 active，table 已套用 `nextAction = '逾期'` filter
- **WHEN** Alice 再點「逾期」摘要卡
- **THEN** filter SHALL 取消
- **AND** table SHALL 恢復顯示全部 5 張 ticket
- **AND** 「逾期」摘要卡 SHALL 取消 active 視覺強調
- **AND** StatusCard 數字恢復為未篩選狀態

#### Scenario: 點 ticket 行跳訂單詳情頁售後 Tab

- **GIVEN** table 中有一行 ticket `AS-20260512-01`，所屬訂單 `ORD-2026-005`
- **WHEN** 使用者點擊該行或操作欄的 `[→]` 按鈕
- **THEN** 系統 SHALL 導航至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260512-01`
- **AND** 訂單詳情頁 SHALL 自動切到「售後服務」Tab 並展開該 ticket

#### Scenario: 篩選器組合運作

- **GIVEN** 使用者名下 ticket 含「印件瑕疵」「規格不符」「物流問題」三類
- **WHEN** 使用者於 case_category 篩選器選擇「印件瑕疵」
- **THEN** table SHALL 僅顯示 `case_category = 印件瑕疵` 的 ticket
- **AND** 頂端 StatusCard 數字 SHALL 依篩選後結果重新計算

#### Scenario: next action 與 case_category 篩選同時套用

- **GIVEN** 使用者點「逾期」摘要卡套用 `nextAction = '逾期'` filter
- **WHEN** 使用者再於 case_category 篩選器選擇「印件瑕疵」
- **THEN** table SHALL 同時套用兩個 filter（`nextAction = '逾期' AND case_category = '印件瑕疵'`）
- **AND** filter 為 AND 邏輯（取交集）

#### Scenario: 訂單編號搜尋

- **WHEN** 使用者於搜尋欄輸入 `ORD-2026-005`
- **THEN** table SHALL 僅顯示 `order_id`、`order.orderNo`、`order.caseName` 或 `order.clientName` 部分匹配的 ticket
- **AND** 搜尋 SHALL 不分大小寫

#### Scenario: 分頁顯示與切換

- **GIVEN** 使用者名下有 25 張未結案 ticket（含 1 張逾期）
- **WHEN** 使用者進入「我的售後服務」頁
- **THEN** table SHALL 顯示第 1 頁 10 張 ticket
- **AND** `<ErpPagination>` SHALL 顯示「1 / 3 頁」
- **WHEN** 使用者點擊下一頁
- **THEN** table SHALL 切換至第 2 頁 10 張 ticket

#### Scenario: 列表為空狀態

- **GIVEN** 業務 Alice 無未結案 ticket
- **WHEN** Alice 進入「我的售後服務」
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」row
- **AND** 頂端待辦摘要數字 SHALL 全部顯示 0
- **AND** SHALL 顯示說明文：「售後 ticket 需先在訂單已完成後從訂單詳情頁的『售後服務』Tab 建立」

#### Scenario: 篩選後無結果

- **GIVEN** 業務 Alice 名下有 3 張 ticket，全部為「印件瑕疵」
- **WHEN** Alice 套用 case_category = 「物流問題」filter
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」
- **AND** 提示 SHALL 引導使用者重設篩選

#### Scenario: sidebar 入口顯示未結案數字徽章

- **GIVEN** 業務 Alice 名下有未結案 ticket 5 張（含 1 張逾期）
- **WHEN** Alice 登入後查看 sidebar
- **THEN** 「我的售後服務」入口 SHALL 顯示數字徽章「5」
- **AND** 徽章 SHALL 於任何頁面都可見（不限於首頁）
- **AND** Alice 結案 1 張後徽章 SHALL 即時更新為「4」

#### Scenario: sidebar 入口徽章為 0 時不顯示

- **GIVEN** 諮詢 Bob 名下無任何未結案 ticket
- **WHEN** Bob 登入後查看 sidebar
- **THEN** 「我的售後服務」入口 SHALL 保留顯示（不隱藏入口）
- **AND** 數字徽章 SHALL NOT 顯示

### Requirement: AfterSalesTicket 活動紀錄

系統 SHALL 為 AfterSalesTicket 寫入完整 ActivityLog，涵蓋以下事件：

- 建立 ticket（含 case_category、responsibility 初始值）
- 填入 / 修改 resolution
- 填入 / 修改 case_category
- 填入 / 修改 responsibility
- 貼入 / 修改 slack_thread_url
- append additional_complaint_log
- 建立關聯 OrderAdjustment（含 OrderAdjustment.id）
- 建立關聯補印 PrintItem（含 PrintItem.id）
- 結案

#### Scenario: 業務查閱 ticket 活動紀錄

- **WHEN** 業務於 ticket 詳情頁切到「活動紀錄」區塊
- **THEN** 系統 SHALL 顯示完整事件歷程（操作人、操作時間、事件描述）
- **AND** 修改類事件 SHALL 同時顯示舊值與新值

<!-- 「業務離職 / 請假時 ticket 負責人轉派」Requirement 已於
     add-my-after-sales-action-page-and-remove-owner-transfer change（2026-05-19 歸檔）
     REMOVED。
     業務離職實務替代方案見 [OQ AFT-1](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md)。 -->
