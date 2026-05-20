## MODIFIED Requirements

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

- 自動寫入 `PrintItem.type = '補印印件'`（**本 change 新增**，詳見 [prototype-shared-ui spec § PrintItemTypeLabel 共用元件](../prototype-shared-ui/spec.md) 三值列舉設計）
- 自動寫入 `related_after_sales_ticket_id` FK，供下游審稿 / 工單流程回溯來源

補印 PrintItem 走原 PrintItem 完整生命週期（審稿 → 工單 → 生產任務 → QC → 出貨），系統不為其建立特殊路徑。

**[本 change 新增] PrintItem 補印識別 invariant**：

系統 MUST 強制以下不變式：

- `PrintItem.type = '補印印件' → PrintItem.related_after_sales_ticket_id IS NOT NULL`
- 反向不一定成立（舊資料中 v0.1~v0.3 期間透過 dialog 建的補印 `related_after_sales_ticket_id` 非空但 `type = '大貨印件'`，**不 backfill**，視為大貨）

**[本 change 新增] 補印 PrintItem 跨頁面識別**：

補印 PrintItem 於所有出現的列表頁 / 訂單詳情頁印件區 SHALL 透過 `PrintItemTypeLabel` 元件呈現「補印」標籤（不再使用「補印（來自 AS-XXX）」文字標示），標籤 hover 顯示來源 ticket 編號、click 跳轉 ticket 詳情頁。

**[本 change 新增] ticket 詳情頁「補印印件清單區」**：

ticket 詳情頁 SHALL 新增獨立分組「補印印件清單區」，列出該 ticket 衍生的所有補印 PrintItem。清單區呈現規範：

- 列出 `where PrintItem.related_after_sales_ticket_id = current_ticket.id AND type = '補印印件'`
- 每筆顯示：印件名稱、規格摘要（材料 / 工序 / 裝訂）、當前狀態（審稿中 / 工單已建 / 製作中 / 已完成 / 已取消）、建立時間、跳轉「印件詳情頁」連結
- 排序：建立時間倒序（最近建的在最上）
- 區塊位置：ticket 詳情頁主內容區塊中段，在「關聯 OrderAdjustment 卡片」之後

業務 / 諮詢從 ticket 反查所衍生的補印 SHALL 透過此清單區一次看到全部，不需要逐筆點開印件詳情驗證。

#### Scenario: 業務於 ticket 內建補印 PrintItem 帶 type = 補印印件

- **GIVEN** ticket.resolution = 補印 或 退款+補印
- **WHEN** 業務於 ticket 內點「建立補印印件」並填入規格（品名、數量、紙材等）
- **THEN** 系統 SHALL 建 PrintItem，related_after_sales_ticket_id = 此 ticket
- **AND** PrintItem.type SHALL 自動設為「補印印件」（業務在 dialog 內不需手選）
- **AND** PrintItem SHALL 出現在訂單詳情頁印件區塊，「印件類型」欄位顯示 `PrintItemTypeLabel(type='補印印件', relatedAfterSalesTicketId=...)`
- **AND** PrintItem SHALL 走原審稿流程（指派審稿員 → 審稿 → 合格送印）

#### Scenario: ticket 詳情頁補印印件清單區顯示

- **GIVEN** ticket AS-001 衍生 3 筆補印 PrintItem（PI-101 / PI-102 / PI-103，各於不同時間建立）
- **WHEN** 業務 / 諮詢打開 ticket AS-001 詳情頁
- **THEN** 「補印印件清單區」SHALL 顯示 3 筆補印
- **AND** 排序 SHALL 為 PI-103 → PI-102 → PI-101（建立時間倒序）
- **AND** 每筆 SHALL 顯示印件名稱、規格摘要、當前狀態、跳轉印件詳情連結
- **AND** 清單區數量 SHALL = `count(PrintItem where related_after_sales_ticket_id = AS-001 AND type = '補印印件')`

#### Scenario: 列表頁補印標籤跳轉 ticket

- **GIVEN** 訂單列表 / 業務平台印件總覽 / 派工看板 / 工單列表中存在 PI-101（type = 補印印件，related_after_sales_ticket_id = AS-001）
- **WHEN** 業務於任一列表頁 click PI-101 的「補印」標籤
- **THEN** 系統 SHALL 導航至 ticket AS-001 詳情頁

#### Scenario: 補印 PrintItem 完成後 ticket 不自動結案

- **GIVEN** 補印 PrintItem 已通過 QC、出貨完成
- **WHEN** 系統推進 PrintItem 至完成
- **THEN** ticket.status MUST 維持「處理中」
- **AND** 系統 SHALL NOT 自動將 ticket 推進至「已結案」
- **AND** 業務 SHALL 確認客戶滿意後手動點「結案」

#### Scenario: 補印 PrintItem 於審稿 / 工單階段被取消

- **GIVEN** ticket.resolution = 補印、補印 PrintItem 處於審稿或工單階段
- **WHEN** 補印 PrintItem 因規格無法達成 / 客戶反悔 等原因被取消（PrintItem.status = 已取消）
- **THEN** ticket 詳情頁「補印印件清單區」SHALL 標示該 PrintItem 為「已取消」（取代原「關聯動作」區塊的描述）
- **AND** ticket.status 與 ticket.resolution SHALL 維持原值
- **AND** 系統 SHALL 顯示提示「補印已取消，請於 ticket 內重新建立補印印件或變更 resolution」
- **AND** 業務 SHALL 可選擇：(a) 於 ticket 內重新建補印 PrintItem、(b) 修改 resolution 為其他值（不處理 / 退款）、(c) 維持現狀並結案

#### Scenario: 舊資料補印（v0.1~v0.3 期間建立）視為大貨不 backfill

- **GIVEN** 舊資料中 PI-099（建立於 v0.2 期間、related_after_sales_ticket_id = AS-099、type = '大貨印件'）
- **WHEN** 業務於 v0.4（本 change 上線後）打開 AS-099 ticket 詳情頁
- **THEN** PI-099 SHALL NOT 出現在「補印印件清單區」（因為 type ≠ 補印印件）
- **AND** PI-099 在訂單詳情頁印件區的「印件類型」欄位 SHALL 顯示「大貨」（按 type 真實值）
- **AND** 系統 SHALL NOT 自動 backfill PI-099 的 type
