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

**[本 change 變更] 「已執行」推進機制**：

OrderAdjustment 的「已執行」推進不再透過業務手動點按鈕觸發，改為由「業務於 ticket 內建立關聯退款 Payment」事件**自動推進**（詳見 [order-management spec § Requirement: 收款記錄（Payment）](../order-management/spec.md)）。具體機制：

- OA 進入「已核可」狀態後，ticket 詳情頁的「關聯 OrderAdjustment 卡片」SHALL 顯示「建立退款 Payment」入口按鈕（取代原「執行」按鈕）
- 業務點擊後開啟退款 Payment 建立 dialog，填入退款日期 / 對帳附件 / 對帳備註（詳見 order-management spec）
- 提交後系統於同一 transaction 建立 Payment + 推進 OA 至「已執行」+ 更新 ticket 卡片顯示「已執行（透過 Payment-{payment_no} 推進）」

**[本 change 變更] 「已核可」狀態下業務可改金額**：

OrderAdjustment 進入「已核可」狀態後，業務於 ticket 內仍 SHALL 可點「編輯金額」修改 `current_amount`，**不需重新送審**，狀態維持「已核可」。對照欄位即時顯示「主管核可金額 vs 當前金額」（詳見 order-management spec）。

#### Scenario: 退款場景 ticket 內加掛 OrderAdjustment 並透過 Payment 推進已執行

- **GIVEN** ticket.resolution = 退款、status = 處理中
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 開啟 OrderAdjustment 建單表單，預填 adjustment_type = 退印、linked_after_sales_ticket_id = 此 ticket
- **AND** 業務填入 amount = -5000、明細 = 「退印瑕疵部分」
- **AND** OrderAdjustment SHALL 走草稿 → 待主管審核 → 已核可
- **AND** 已核可後 ticket 卡片 SHALL 顯示「建立退款 Payment」按鈕
- **AND** 業務點按鈕，dialog 顯示 → 業務填入 refund_date / reconciliation_attachment / reconciliation_note 並提交
- **AND** 系統 SHALL 同一 transaction 建立 Payment(-5000, type=refund) + 推進 OA 至「已執行」
- **AND** 視需要開立 SalesAllowance 關聯該退款 Payment（若已開過發票跨期，本 change 不處理 SalesAllowance 自動建立邏輯，留 OQ-4）

#### Scenario: 業務於 ticket 內改已核可 OA 金額

- **GIVEN** ticket AS-001 內有關聯 OA-001（status = 已核可、approved_amount = -5000）
- **WHEN** 業務於 ticket 卡片點「編輯金額」並改為 -4800
- **THEN** OA-001.current_amount SHALL 更新為 -4800
- **AND** OA-001.status SHALL 維持「已核可」（不需重新送審）
- **AND** ticket 卡片對照欄位 SHALL 顯示「主管核可金額 -$5,000｜當前金額 -$4,800｜業務已調整 +$200」
- **AND** 後續業務點「建立退款 Payment」時 dialog 預設 amount = -4800（current_amount）

#### Scenario: 補印收費場景 ticket 內加掛 OrderAdjustment（手動建補費 OA）

- **GIVEN** ticket.resolution = 補印、responsibility = 客戶承擔、case_category = 規格不符
- **WHEN** 業務於 ticket 內建補印 PrintItem 後**手動**點「建立補印費異動單」
- **THEN** 系統 SHALL 開啟 OrderAdjustment 建單表單，預填 adjustment_type = 補退、linked_after_sales_ticket_id = 此 ticket
- **AND** 業務填入 amount = +補印費（業務手動算）、明細 = 「補印工本費」
- **AND** 業務送審 → 主管核可 →（若 OA 為正金額即客戶補繳則走正常 Payment 路徑、若為退款型才走本 change 新增的退款 Payment 自動推進路徑）
- **AND** PrintItem 走原審稿 / 工單流程
- **AND** 系統 SHALL NOT 自動帶建補費 OA（與 responsibility 解耦，避免聯動複雜，OQ-6）

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

---

### Requirement: 與 PrintItem 關聯（補印觸發）

補印場景下，業務 SHALL 於 ticket 內建立補印 PrintItem。系統建 PrintItem 時：

- 自動寫入 `PrintItem.type = '補印印件'`（refine-after-sales-refund-and-add-supplementary-print change 新增，詳見 [prototype-shared-ui spec § PrintItemTypeLabel 共用元件](../prototype-shared-ui/spec.md) 三值列舉設計）
- 自動寫入 `related_after_sales_ticket_id` FK，供下游工單流程回溯來源

**[本 change 變更] 補印審稿自動通過 + 沿用原稿**：

補印 PrintItem **不走人工審稿流程**，系統建立時自動完成審稿環節：

| 欄位 | 行為 |
|------|------|
| `reviewStatus` | 直接設為 `'合格'`（不經「等待審稿」「審稿中」中間態） |
| `reviewFiles` | **複製來源印件的 `reviewFiles`**（保留全部稿件歷史檔案，供印務查閱） |
| `reviewRounds` | **複製來源印件的 `reviewRounds`** + 新增一筆「售後補印自動通過輪次」 |
| `currentRoundId` | 指向新增的「售後補印自動通過輪次」 |
| `assignedReviewerId` | 維持 `null`（無需指派審稿員） |
| `skipReview` | 維持 `false`（避免與既有「業務手動勾選免審稿」語意混淆；本 change 用「售後補印自動通過輪次」表達補印跳審稿）|
| `reviewActivityLogs` | 複製來源印件的歷史 ActivityLog + append 一筆「售後補印自動通過審稿」事件（含來源印件 ID + ticket 編號 + 自動通過時間） |
| `printItemStatus` | 設為 `'待生產'`（印件總覽顯示為「等待中」狀態，印務主管立刻可分配工單） |

**「售後補印自動通過輪次」**的 `ReviewRound` 欄位規範：

- `source = '售後補印'`（新增 enum 值，區別於 `'審稿'` / `'免審稿'`）
- `sourcePrintItemId` 指向來源印件 ID（新增 optional 欄位）
- `submittedBy = '系統'`、`submittedAt = 當下`
- `submittedNote = '售後補印自動通過 — 沿用 PI-XXX 合格稿件'`
- `reviewerId = null`、`reviewedAt = 當下`
- `result = '合格'`
- `roundNo` = 來源印件的最後一輪 + 1（接續原序號）

**業務情境涵蓋範圍**：

- **適用**：原稿無問題的補印（印件瑕疵 / 物流破損 / 規格符合）— 占售後補印 99% 情境
- **不適用**：補印同時改稿（規格變更）— 此情境應走「規格變更」OrderAdjustment 而非補印路徑（OQ-SP-1 留釐清是否需要區分入口）
- **例外處理**：若印務分配工單時發現稿件實際有問題，可走既有「補件 / 不合格」狀態機回退處理（OQ-SP-2）

#### Scenario: 業務於 ticket 內建補印 PrintItem 自動通過審稿

- **GIVEN** ticket.resolution = 補印、原印件 PI-001 reviewStatus = '合格'、currentRoundId 指向 Round-3（合格輪次）
- **WHEN** 業務於 ticket 內點「建立補印印件」、選來源印件 PI-001、填補印數量 50 並提交
- **THEN** 系統 SHALL 建立補印 PrintItem PI-002，type = '補印印件'、related_after_sales_ticket_id 寫入
- **AND** PI-002.reviewStatus SHALL = '合格'（直接終態）
- **AND** PI-002.reviewFiles SHALL = 複製 PI-001.reviewFiles（含 Round-3 的合格稿件檔案）
- **AND** PI-002.reviewRounds SHALL = 複製 PI-001.reviewRounds + 新增一筆 Round-4（source = '售後補印'、result = '合格'、sourcePrintItemId = PI-001、submittedNote 含「沿用 PI-001 合格稿件」）
- **AND** PI-002.currentRoundId SHALL 指向新增的 Round-4
- **AND** PI-002.assignedReviewerId SHALL = null
- **AND** PI-002.printItemStatus SHALL = '待生產'
- **AND** PI-002.reviewActivityLogs SHALL append「售後補印自動通過審稿」事件
- **AND** PI-002 SHALL 立刻出現在印務主管「印件總覽」的「等待中」分類（無需經過審稿員）
- **AND** PI-002 SHALL NOT 出現在審稿員的「等待審稿」工作清單

#### Scenario: 補印 PrintItem 印務分配工單

- **GIVEN** PI-002（補印印件）printItemStatus = '待生產'、currentRoundId 指向 Round-4（自動通過）
- **WHEN** 印務主管於印件總覽點 PI-002 的「分配印件」
- **THEN** 系統 SHALL 允許印務主管建立工單（與大貨印件流程同）
- **AND** 工單建立時稿件來源 SHALL 為 PI-002.reviewFiles 中 currentRoundId 對應檔案（= 沿用 PI-001 的最終合格稿件）

#### Scenario: 補印自動通過審稿後可追溯來源稿件

- **GIVEN** PI-002 由 PI-001 自動產生補印
- **WHEN** 客服 / 印務 / 業務於 PI-002 詳情頁查閱
- **THEN** 系統 SHALL 顯示 reviewRounds 列表（含複製自 PI-001 的歷史 + 自動通過輪次）
- **AND** 自動通過輪次 SHALL 標示「售後補印自動通過 — 沿用 [PI-001](../print-items/PI-001) 合格稿件」可點擊跳轉來源印件
- **AND** 來源印件追溯路徑：PI-002 → Round-4.sourcePrintItemId = PI-001

#### Scenario: 補印自動通過後印務發現稿件實際有問題（例外處理）

- **GIVEN** PI-002 透過自動通過建立、印務主管分配工單後印務發現稿件版本實際有錯
- **WHEN** 印務 escalate 給業務 / 審稿主管
- **THEN** 業務 SHALL 可於 PI-002 詳情頁觸發「重新審稿」動作（透過既有「補件」路徑）
- **AND** 補件後 PI-002 走原審稿流程（指派審稿員 → 審稿）
- **AND** 此例外情境留 OQ-SP-2 進一步釐清標準動作流程

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
     業務離職實務替代方案見 [OQ AFT-1](../../../memory/Sens_wiki/wiki/erp/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md)。 -->

### Requirement: 業務主管全公司售後管理頁

系統 SHALL 提供「業務主管全公司售後管理頁」（路由 `/sales-manager/after-sales`），業務主管登入後 SHALL 可從中台 sidebar 進入。該頁列出**全公司**所有 AfterSalesTicket（**不過濾**負責業務主管管轄範圍 `Order.approved_by_sales_manager_id = self`），作為業務主管在 Slack 與業務跟催售後事件處理的決策入口，並與業務平台「我的售後服務作業頁」呈對稱結構。

本 Requirement 與業務平台「我的售後服務作業頁」Requirement 對稱，但服務不同目的：
- 業務 / 諮詢的「我的售後服務」：個人作業視角（行動驅動），範圍 `opened_by = self`
- 業務主管的「售後服務」：全公司監督視角（跟催驅動），範圍**無 owner filter**

頁面 layout SHALL 嚴格對齊 [Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：「搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁」模式，禁止按狀態拆多張表或用卡片分組呈現資料。範式參考：[QuoteListPage](../../../../sens-erp-prototype/src/components/quote/QuoteListPage.tsx)（canonical reference）+ [MyAfterSales](../../../../sens-erp-prototype/src/pages/MyAfterSales.tsx)（對稱結構參考）。

**頁面結構 SHALL 包含三個區段**：

1. **搜尋與篩選 Card**（單一 Card 內含三組元素）：
   - 搜尋框：訂單編號 / 案名 / 客戶名稱 / 售後單號（部分匹配、不分大小寫）
   - 篩選 grid（兩行 4 欄）：第一行 next action select / status select / case_category select / responsibility select；第二行 業務 / 諮詢負責人 select / 受理區間 date range / 預留 / 預留
   - StatusCard grid（3 張數字卡）：逾期 / 待填決議 / 待結案，數字依篩選後結果顯示（`filtered={true}` 標記）

2. **操作列**：`flex justify-end`，含「重設篩選」按鈕（依篩選 active 狀態 disabled）

3. **單一資料表**：`<ErpTableCard scrollX>` 包 `<table className="erp-table">`，依下列 12 欄順序：

   | # | 欄位 | 寬度 | 資料來源 | 說明 |
   |---|------|------|----------|------|
   | 1 | # | 56px | 行號 | 依分頁顯示 |
   | 2 | 售後單號 | 140px | `caseNo` | AS-YYYYMMDD-XX，font-mono |
   | 3 | 訂單編號 | 130px | `Order.orderNo` | ORD-...，font-mono |
   | 4 | 客戶 / 案名 | auto | `Order.clientName` / `Order.caseName` | 兩行顯示，案名 line-clamp-1 |
   | 5 | 業務 / 諮詢負責人 | 110px | `openedBy`（含 hover tooltip 顯示角色）| 新欄（與業務版差異點）|
   | 6 | 受理時間 | 110px | `openedAt` | 相對時間（如「5 天前」）|
   | 7 | 最後活動時間 | 110px | `updatedAt` | 相對時間，新欄（與業務版差異點）|
   | 8 | 售後類型 | 100px | `caseCategory` | 文字 |
   | 9 | 責任歸屬 | 90px | `responsibility` | 文字 |
   | 10 | 決議 | 90px | `resolution` | 文字（NULL 顯示「—」）|
   | 11 | next action | 110px | `calcAfterSalesActionGroup(...)` | Badge（逾期紅 / 待填決議黃 / 待建關聯動作藍 / 待結案淺藍）|
   | 12 | 狀態 | 100px | `status` | StatusBadge（受理中黃 / 處理中藍 / 逾期紅疊加）|

4. **整行可點擊**：點擊 ticket 任一 cell（含表格內部）SHALL 導航至 `/orders/:orderId?tab=afterSales&ticket=:ticketId`。本頁 MUST NOT 提供獨立「操作」欄按鈕（與「我的售後服務」差異點，理由為 12 欄擁擠 + 整行點擊已涵蓋唯一動作）。

5. **分頁**：`<ErpPagination>`，PAGE_SIZE = 10（與 MyAfterSales / ConsultationRequestList 一致）。

**範圍過濾規則**（系統自動套用，使用者不可解除）：
- 預設 status filter ∈ {受理中, 處理中}（排除已結案）
- 使用者 SHALL 可透過 status select 篩選為「全部」或「已結案」查歷史
- **無 owner filter**：列出全公司所有 ticket，使用者可透過「業務 / 諮詢負責人」filter 自行收斂

next action 分組定義沿用 [after-sales-ticket spec § Requirement: 我的售後服務作業頁](../../../specs/after-sales-ticket/spec.md) 的四組（逾期 / 待填決議 / 待建關聯動作 / 待結案），互斥；逾期優先於其他三組。

**預設排序**：`opened_at` 升序（最久未處理優先），與「我的售後服務」一致。

**動作可見性**：
- 業務主管 SHALL 為純檢視角色，本頁 MUST NOT 顯示「建立 ticket」「修改 resolution」「結案」「建立關聯 OA / PrintItem」「批次轉派」「批次結案」等動作按鈕
- 主管若需介入特定 ticket SHALL 透過 Slack 與業務 / 諮詢線下協調
- 跳轉至訂單詳情頁售後 Tab 後，仍 SHALL 為唯讀視角（訂單詳情頁的售後 Tab 自身權限控制負責隱藏編輯按鈕）

**sidebar 入口**：
- 中台 sidebar「訂單管理_業務主管」group 第 4 個 sub item（前三個為訂單列表 / 訂單審核 / 訂單異動審核）
- **無數字徽章**：業務主管無 `opened_by = self` 概念，徽章難定義有意義的計算範圍；業界 ERP supervisor view 通常用「進入後摘要卡」取代 sidebar 徽章

**「最後活動時間」欄資料來源**：
- 本 change 沿用既有 `AfterSalesTicket.updatedAt`（涵蓋所有 transitions + appendComplaintLog + slack_thread_url 變更等業務事件）
- 未來若主管反映語意混淆（如下游 OA / Payment 建立未反映在 updatedAt），可升級為 `last_activity_at` derived field 聚合 ticket / 關聯 OA / PrintItem 補印 / Payment 等下游事件的最新 timestamp
- 相關 OQ：[AFT-9](../../../memory/Sens_wiki/wiki/erp/08-open-questions/) 持續觀察

**舊路由 redirect 處理**：
- 既有 `/sales-manager/after-sales-tickets` 路由（add-my-after-sales-action-page-and-remove-owner-transfer change 2026-05-19 歸檔 REMOVED）SHALL 由系統 redirect 至本 change 新路由 `/sales-manager/after-sales` + Toast 提示「已升級為全公司售後管理頁」
- 此處理避免主管書籤 / 殘留 Slack 連結引用舊路由失效

#### Scenario: 業務主管進入「售後服務」頁

- **GIVEN** 業務主管 A 登入中台、全公司有未結案 ticket 12 張（含逾期 2 張、待填決議 4 張、待結案 6 張）、其中 7 張為非 A 管轄部門
- **WHEN** A 從 sidebar「訂單管理」group 點擊「售後服務」
- **THEN** 系統 SHALL 導航至 `/sales-manager/after-sales`
- **AND** 頁面 SHALL 顯示 12 張未結案 ticket（**不過濾**負責業務主管，含 A 管轄與非 A 管轄）
- **AND** 摘要卡 SHALL 顯示：逾期 2 / 待填決議 4 / 待結案 6
- **AND** 表格 SHALL 依 `opened_at` 升序排序，預設第 1 頁顯示 10 張
- **AND** 第 5 欄「業務 / 諮詢負責人」SHALL 顯示各 ticket 的 `opened_by` 人名（hover 顯示角色業務 / 諮詢）

#### Scenario: 業務主管查看非管轄業務的售後 ticket

- **GIVEN** 業務主管 A 進入全公司售後管理頁、列表中含一張 ticket AS-20260520-03 屬於業務主管 B 管轄部門（`Order.approved_by_sales_manager_id = B`）
- **WHEN** A 點擊該 ticket 任一 cell
- **THEN** 系統 SHALL 允許跳轉至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260520-03`（唯讀）
- **AND** 訂單詳情頁售後 Tab MUST NOT 顯示「建立 ticket」「修改 resolution」「結案」「建立關聯 OA」等動作按鈕
- **AND** A MUST NOT 對該 ticket 執行任何系統內編輯動作
- **AND** A 若需介入處理 SHALL 透過 Slack 與業務主管 B 或 ticket `opened_by` 業務 / 諮詢線下協調

#### Scenario: 業務主管點擊「逾期」摘要卡套用 next action filter

- **GIVEN** 業務主管進入「售後服務」頁，無 filter 套用，table 顯示 12 張未結案 ticket
- **WHEN** 主管點擊頂端「逾期 2」摘要卡
- **THEN** table SHALL 套用 `nextAction = '逾期'` filter
- **AND** table SHALL 僅顯示 2 張逾期 ticket
- **AND** 「逾期」摘要卡 SHALL 視覺強調（border 或背景加深）標示為 active
- **AND** 其他 StatusCard 數字 SHALL 依篩選後結果重新計算（待填決議 0 / 待結案 0）

#### Scenario: 再點同一摘要卡取消 filter（toggle）

- **GIVEN** 「逾期」摘要卡為 active，table 已套用 `nextAction = '逾期'` filter
- **WHEN** 主管再點「逾期」摘要卡
- **THEN** filter SHALL 取消
- **AND** table SHALL 恢復顯示全部 12 張 ticket
- **AND** 「逾期」摘要卡 SHALL 取消 active 視覺強調
- **AND** StatusCard 數字恢復為未篩選狀態（逾期 2 / 待填決議 4 / 待結案 6）

#### Scenario: 業務主管用「業務 / 諮詢負責人」filter 收斂為單一負責人

- **GIVEN** 業務主管進入「售後服務」頁、全公司未結案 ticket 含業務 Alice 5 張、諮詢 Bob 3 張、業務 Charlie 4 張
- **WHEN** 主管於「業務 / 諮詢負責人」filter 選擇「Alice」
- **THEN** table SHALL 僅顯示 `opened_by = Alice` 的 5 張 ticket
- **AND** 摘要卡 SHALL 依 Alice 的 ticket 範圍重新計算數字

#### Scenario: 業務主管篩選 status = 已結案 查歷史

- **GIVEN** 業務主管進入「售後服務」頁、預設 status filter ∈ {受理中, 處理中}
- **WHEN** 主管於 status filter 切換為「已結案」
- **THEN** table SHALL 顯示全公司 status = 已結案 的 ticket（不限時間範圍）
- **AND** 摘要卡 SHALL 依已結案 ticket 重新計算（「逾期」「待填決議」「待結案」對已結案 ticket 多為 0）
- **AND** 主管 SHALL 可進一步用「受理區間」date range 收斂為特定月份 / 季度

#### Scenario: 業務主管整行點擊跳轉訂單詳情頁

- **GIVEN** table 中有一行 ticket AS-20260512-01，所屬訂單 ORD-2026-005
- **WHEN** 業務主管點擊該行任一 cell（除「業務 / 諮詢負責人」hover tooltip 外）
- **THEN** 系統 SHALL 導航至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260512-01`
- **AND** 訂單詳情頁 SHALL 自動切到「售後服務」Tab 並展開該 ticket
- **AND** 業務主管於詳情頁仍 SHALL 為唯讀視角

#### Scenario: 「最後活動時間」欄顯示相對時間

- **GIVEN** ticket AS-20260520-01 受理時間 = 5 天前、3 天前業務修改了 resolution、`updatedAt` 為 3 天前
- **WHEN** 業務主管查看 table 第 7 欄「最後活動時間」
- **THEN** 該欄 SHALL 顯示「3 天前」
- **AND** 同行第 6 欄「受理時間」SHALL 顯示「5 天前」
- **AND** 兩欄差異 SHALL 讓主管識別此 ticket 仍有近期活動（非停滯）

#### Scenario: 業務 / 諮詢 / 會計 / 其他中台角色 visit `/sales-manager/after-sales` 被拒絕

- **WHEN** 業務 / 諮詢 / 會計 / Supervisor 訂單管理人 / 印務主管 / 審稿主管 / EC商品管理 等非業務主管角色透過 URL 直接訪問 `/sales-manager/after-sales`
- **THEN** 系統 MUST 拒絕並重定向至該角色首頁
- **AND** 中台 sidebar MUST NOT 對這些角色顯示「售後服務」入口
- **AND** 業務 / 諮詢仍 SHALL 從業務平台「我的售後服務」入口檢視自己的 ticket
- **AND** 會計仍 SHALL 從訂單詳情頁售後 Tab 唯讀查閱單張 ticket

#### Scenario: 舊路由 `/sales-manager/after-sales-tickets` redirect 至新路由

- **GIVEN** 業務主管書籤或 Slack 內舊連結指向 `/sales-manager/after-sales-tickets`
- **WHEN** 主管點擊舊連結
- **THEN** 系統 SHALL 自動 redirect 至 `/sales-manager/after-sales`
- **AND** SHALL 顯示 Toast「已升級為全公司售後管理頁」（時長 5 秒）
- **AND** 主管 SHALL 直接看到新頁完整內容（無需重新點擊）

#### Scenario: 列表為空狀態

- **GIVEN** 全公司無未結案 ticket（資料庫初始化 / 全部結案 / 篩選過嚴）
- **WHEN** 業務主管進入「售後服務」頁
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」row
- **AND** 摘要卡 SHALL 顯示 0
- **AND** 若 filter active SHALL 提示「重設篩選」；若 filter 未 active 且全公司確實無 ticket SHALL 顯示說明「全公司目前無未結案售後 ticket，可切換 status filter 查歷史已結案紀錄」

#### Scenario: 分頁顯示與切換

- **GIVEN** 全公司未結案 ticket 25 張
- **WHEN** 業務主管進入「售後服務」頁
- **THEN** table SHALL 顯示第 1 頁 10 張
- **AND** `<ErpPagination>` SHALL 顯示「1 / 3 頁」
- **WHEN** 主管點擊下一頁
- **THEN** table SHALL 切換至第 2 頁 10 張

#### Scenario: 業務主管 sidebar 不顯示數字徽章

- **GIVEN** 業務主管 A 登入中台、全公司有 12 張未結案 ticket
- **WHEN** A 查看中台 sidebar「訂單管理_業務主管」group
- **THEN** 「售後服務」sub item MUST NOT 顯示數字徽章
- **AND** 主管 SHALL 點擊進入頁面後從 StatusCard 摘要卡掌握全公司未結案數
- **AND** 此設計與業務 / 諮詢「我的售後服務」sidebar 顯示數字徽章的對稱差異 SHALL 明示於本 Requirement

### Requirement: 售後 ticket 內建 OA 連動 BillingInstallment（取代 PaymentPlan / PlannedInvoice 連動）

系統 SHALL 沿用 v0.6 AfterSalesTicket → OA → Payment + 折讓 / 作廢連動鏈主結構，且 SHALL 對齊 v1.14 結構性變更：補收 OA 跳過審核中間態 + 退款 OA 沿用主管核可 + 補收場景由業務新增 BillingInstallment 取代 PaymentPlan + 退款 Payment MUST NOT 建立 PaymentAllocation 以保留正向期次稽核歷史。

v0.6 既有「AfterSalesTicket → OA → Payment + 折讓/作廢」連動鏈主結構保留，本 change 沿用：
- 訂單完成後補收（客戶承擔）：ticket 內建 OA(+N) → 跳過審核中間態直達已執行（補收 OA 新規則）→ 業務新增 BillingInstallment 承載補收應收 → 開票 + 收款核銷
- 訂單完成後退款：ticket 內建 OA(-N) → 業務主管核可 → 業務於 OA 介面建退款 Payment（處理中）+ 補對帳附件 + 切已完成 → 系統推進 OA 已執行 → 發票端折讓 / 作廢
- 補印免費（公司認賠）：ticket 內建補印 PrintItem（沿用既有設計、不建 OA）

對齊本 change 結構性變更：
- ticket 內建 OA 沿用「補收正項跳過審核 / 退款負項主管核可」對稱破壞規則（補收進期次、退款不進期次）
- ticket 內補收場景由業務新增 BillingInstallment（取代既有「業務新增 PaymentPlan」）
- 退款 Payment 不建 PaymentAllocation（不進正向期次，保留 BillingInstallment 稽核歷史）

#### Scenario: 訂單完成後客戶承擔補印費 ticket 內建 OA 立即執行

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=客戶承擔, resolution=補印）
- **WHEN** 業務於 ticket 內建 OA-200（amount=+3000, adjustment_type=補退, linked_after_sales_ticket_id=ticket.id）並點「儲存並執行」
- **THEN** OA-200.status SHALL = 已執行（跳過審核中間態）
- **AND** 應收 SHALL +3000
- **AND** 業務 MAY 新增 BillingInstallment「售後補印費 3000」承載補收應收
- **AND** 業務於該期次一鍵開票 + 收款核銷後 → ticket 結案

#### Scenario: 訂單完成後售後退款 ticket 內建 OA 沿用主管核可

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=客戶投訴, resolution=退款）
- **WHEN** 業務於 ticket 內建 OA-201（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）並送審
- **THEN** OA-201.status SHALL = 待主管審核
- **WHEN** 業務主管核可 + 業務建退款 Payment + 切已完成
- **THEN** 系統推進 OA-201 = 已執行、應收 -5000
- **AND** 退款 Payment MUST NOT 建 PaymentAllocation（不進正向期次）
- **AND** 業務於 INV 詳情頁建 SalesAllowance（refund_payment_id 關聯退款 Payment）
- **AND** 業務確認客戶滿意 → 點 ticket「結案」

#### Scenario: 補印免費場景沿用既有設計（不建 OA + 不影響 BillingInstallment）

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=公司認賠, resolution=補印）
- **WHEN** 業務於 ticket 內建補印 PrintItem
- **THEN** 系統 MUST NOT 建立 OrderAdjustment
- **AND** 訂單應收 / BillingInstallment / 發票 / 收款 SHALL 完全不變動
- **AND** 不出現對帳警示 banner（無 OA 執行）

