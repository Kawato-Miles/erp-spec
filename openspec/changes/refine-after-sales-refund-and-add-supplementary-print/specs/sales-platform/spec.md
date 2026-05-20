## MODIFIED Requirements

### Requirement: 業務平台印件總覽

業務平台 SHALL 提供印件總覽功能，讓業務跨訂單檢視自己負責的所有印件，回應客戶查詢、開立發票參考、生產進度追蹤等業務工作需求。

**內容基準**：業務平台印件總覽的欄位、篩選 Tab、列表呈現、印件展開顯示工單列表等視覺與資料內容，**初版完全沿用中台版** — 即 [work-order spec § Requirement: 印務主管印件總覽（防掉單）](../work-order/spec.md)、[§ Requirement: 印務主管審核待辦](../work-order/spec.md)、[§ Requirement: 印務印件篩選](../work-order/spec.md) 三條 Requirement 中關於「欄位顯示」「篩選 Tab」「印件展開」的描述。

**[本 change 確認] 沿用「印件類型」欄位與 filter**：

本 change 於中台版「印務主管印件總覽（防掉單）」新增「印件類型」欄位 + filter 三選項（詳見 [work-order spec § Requirement: 印務主管印件總覽（防掉單）](../work-order/spec.md)）。依「沿用中台版」原則，業務平台印件總覽 SHALL 自動繼承此欄位與 filter，無需獨立規範。

**業務平台版差異**：

1. **過濾規則**（系統自動套用，業務不可解除）：印件總覽 SHALL 僅顯示印件所屬訂單滿足 `Order.sales_id = current_user.id` 的印件
2. **動作可見性**（業務 Role 純檢視）：
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作）
   - SHALL NOT 顯示「審核工單」相關操作（屬印務主管動作）
   - 印件展開後的工單列表項目 SHALL NOT 可點擊（業務不導航至工單詳情頁，符合 [user-roles spec § 業務與諮詢角色的工單查閱限制](../user-roles/spec.md)）
3. **預設 Tab**：業務平台版預設 SHALL NOT 套用任何篩選 Tab（顯示全部印件），與中台版預設「等待中優先未建工單」不同
4. **[本 change 新增] 印件類型 filter 預設值**：業務平台版 SHALL 預設「印件類型」filter 三選項全選（顯示全部三種印件類型），業務可自由收斂

#### Scenario: 業務於業務平台檢視自己負責印件總覽

- **WHEN** 業務角色登入並進入業務平台印件總覽
- **THEN** 系統 SHALL 顯示所有 `Order.sales_id = current_user.id` 的訂單下印件
- **AND** SHALL NOT 顯示其他業務負責訂單下的印件
- **AND** 預設 SHALL 不套用任何篩選 Tab（顯示全部印件）
- **AND** 預設 SHALL 「印件類型」filter 三選項全選

#### Scenario: 業務切換篩選 Tab

- **WHEN** 業務於業務平台印件總覽切換至「製作完成」Tab
- **THEN** 系統 SHALL 僅顯示業務負責訂單下印製狀態為「製作完成」的印件
- **AND** 篩選 Tab 的可用選項 SHALL 與中台版相同（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）

#### Scenario: 業務以印件類型 filter 鎖定補印追蹤（新規）

- **GIVEN** 業務 A 負責 100 筆印件（80 大貨、15 打樣、5 補印）
- **WHEN** 業務 A 於業務平台印件總覽的印件類型 filter 取消勾選「大貨」「打樣」只保留「補印」
- **THEN** 列表 SHALL 僅顯示 5 筆補印印件（業務 A 訂單下）
- **AND** 業務 A SHALL 可優先追蹤補印的審稿 / 工單 / 出貨進度

#### Scenario: 業務展開印件查看工單列表（純檢視）

- **WHEN** 業務於業務平台印件總覽點擊某印件展開
- **THEN** 系統 SHALL 顯示該印件下所有工單的狀態與負責印務（內容與中台版相同）
- **AND** 工單列表項目 MUST NOT 可點擊導航至工單詳情頁

#### Scenario: 業務嘗試執行印務主管動作被擋

- **WHEN** 業務於業務平台印件總覽尋找「分配印件」按鈕
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 若業務透過 URL 直接呼叫對應 API，系統 MUST 回傳權限不足錯誤

#### Scenario: 業務看不到他人負責訂單的印件

- **GIVEN** 業務 A 與業務 B 為不同使用者，訂單 X 的 `sales_id = B`
- **WHEN** 業務 A 登入業務平台並進入印件總覽
- **THEN** 訂單 X 下的所有印件 MUST NOT 出現於業務 A 的印件總覽

#### Scenario: 業務點擊印件名稱進入印件詳情頁

- **WHEN** 業務於業務平台印件總覽點擊某印件的印件名稱
- **THEN** 系統 SHALL 導航至該印件的印件詳情頁
- **AND** 業務 SHALL 可於印件詳情頁查閱審稿紀錄等印件深度資訊（印件詳情頁屬印件模組，非工單模組，不違反業務 MUST NOT 導航至工單模組的限制）
