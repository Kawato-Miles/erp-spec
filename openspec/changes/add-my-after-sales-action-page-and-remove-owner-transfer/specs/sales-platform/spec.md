## ADDED Requirements

### Requirement: 業務平台「我的售後服務」入口

業務平台 SHALL 於 sidebar 提供「我的售後服務」入口（路由 `/my-after-sales`），業務 / 諮詢角色 SHALL 可見並進入。會計角色 MUST NOT 看到此入口（會計依 [user-roles spec § 會計角色職責](../user-roles/spec.md) 對 AfterSalesTicket 為「查閱不操作」，可從訂單詳情頁的售後 Tab 唯讀查閱）。

該入口對應的作業頁詳細行為定義於 [after-sales-ticket spec § Requirement: 我的售後服務作業頁](../after-sales-ticket/spec.md)。

**業務平台版定位**：

1. **過濾規則**（系統自動套用，使用者不可解除）：作業頁 SHALL 僅顯示 `opened_by = current_user.id` 的 AfterSalesTicket，使用者不可看到其他業務 / 諮詢負責的 ticket
2. **動作可見性**（業務 / 諮詢純檢視 + 單向跳轉）：
   - SHALL NOT 顯示「批次轉派」「批次結案」等管理員動作
   - SHALL NOT 顯示其他人 ticket 的卡片
   - 卡片操作 SHALL 限於「跳轉至訂單詳情頁售後 Tab」「依 next action CTA 跳對應操作區塊」
3. **預設體驗**：頁面進入 SHALL 預設顯示頂端待辦摘要（逾期 / 待填決議 / 待結案）+ 依 next action 分組列表，使用者不需切換 view

業務平台 sidebar SHALL 同步移除 `/sales-manager/after-sales-tickets`（「售後服務單轉派」）入口（依 [after-sales-ticket spec § Requirement: 業務離職 / 請假時 ticket 負責人轉派](../after-sales-ticket/spec.md) 已 REMOVED）。

#### Scenario: 業務於業務平台 sidebar 看到「我的售後服務」入口

- **GIVEN** 業務 Alice 登入業務平台
- **WHEN** Alice 查看 sidebar 導航
- **THEN** 系統 SHALL 顯示「我的售後服務」入口
- **AND** 點擊入口 SHALL 導航至 `/my-after-sales`

#### Scenario: 諮詢於業務平台 sidebar 看到「我的售後服務」入口

- **GIVEN** 諮詢 Bob 登入業務平台
- **WHEN** Bob 查看 sidebar 導航
- **THEN** 系統 SHALL 顯示「我的售後服務」入口（與業務相同）
- **AND** 點擊後進入的作業頁僅顯示 `opened_by = Bob` 的 ticket

#### Scenario: 會計於業務平台 sidebar 看不到「我的售後服務」入口

- **GIVEN** 會計登入業務平台
- **WHEN** 會計查看 sidebar 導航
- **THEN** 系統 MUST NOT 顯示「我的售後服務」入口
- **AND** 若會計透過 URL 直接 visit `/my-after-sales`，系統 MUST 拒絕並重定向

#### Scenario: 業務看不到其他業務的 ticket

- **GIVEN** 業務 Alice 與業務 Charlie 各自有未結案 ticket
- **WHEN** Alice 進入「我的售後服務」作業頁
- **THEN** 列表 MUST 僅顯示 `opened_by = Alice` 的 ticket
- **AND** Charlie 的 ticket MUST NOT 出現於 Alice 的作業頁
- **AND** 頂端待辦摘要數字 SHALL 僅基於 Alice 的 ticket 計算

#### Scenario: 業務 / 諮詢看不到「批次轉派」管理員動作

- **WHEN** 業務 / 諮詢於「我的售後服務」作業頁查看任何 ticket 卡片
- **THEN** 系統 MUST NOT 顯示「批次轉派」「轉派負責人」「批次結案」等管理員操作按鈕
- **AND** 卡片操作 SHALL 限於跳轉至訂單詳情頁售後 Tab

#### Scenario: 舊「售後服務單轉派」sidebar 入口已移除

- **GIVEN** 業務主管 / Supervisor 角色登入業務平台
- **WHEN** 該角色查看 sidebar 導航
- **THEN** 系統 MUST NOT 顯示「售後服務單轉派」入口
- **AND** 若直接 visit `/sales-manager/after-sales-tickets`，系統 MUST 拒絕（404 或重定向至首頁）
