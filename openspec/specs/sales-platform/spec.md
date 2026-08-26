# 業務平台規格

來源: [add-print-item-overview-to-sales-platform change](../../changes/archive/) (待歸檔)

## Purpose

`sales-platform` capability 作為「業務平台」這個平台容器內所有功能 spec 的集合。業務平台承載業務、諮詢、會計三個角色的工作介面（會計依其職責限定，可使用功能子集；各角色職責見 wiki [03-roles/](../../../memory/Sens_wiki/wiki/erp/03-roles/)）。

本 capability 提供：
- 業務平台版功能 spec 的歸屬規範（避免散落於 order-management / quote-request 等模組 spec）
- 業務平台版與中台版的差異描述模式（過濾規則 / 動作可見性 / 預設 UI）
- 各業務平台功能的具體行為 Requirement

後續諮詢平台、工廠平台、印務平台等容器可比照建立各自 capability spec。
## Requirements
### Requirement: 業務平台容器定位

`sales-platform` capability SHALL 作為「業務平台」這個平台容器內所有功能 spec 的集合。業務平台承載業務、諮詢、會計三個角色的工作介面（各角色職責見 wiki [03-roles/](../../../memory/Sens_wiki/wiki/erp/03-roles/)）。

本 capability 內的每條 Requirement SHALL 描述「該功能在業務平台的呈現方式、範圍規則、動作可見性」，並在內容初版完全沿用中台版時，引用中台版功能 spec 作為內容基準（避免重複描述）。

業務平台版與中台版（C Level + 各模組主管使用）的差異 SHALL 至少明確：
- **過濾規則**：業務平台依登入者身分自動套用範圍過濾（如 `Order.sales_id = current_user.id`）
- **動作可見性**：業務平台依角色 Role 隱藏動作按鈕（純檢視 / 限定動作）
- **預設 Tab / 排序**：業務平台可有與中台版不同的預設體驗

新增業務平台功能 SHALL 在此 capability 內以新 Requirement 形式加入；不在 order-management / quote-request 等模組 spec 內加業務平台特化 Requirement。

#### Scenario: 業務平台功能 spec 歸屬

- **WHEN** 新增任何業務平台專屬功能（業務 / 諮詢 / 會計使用的介面）
- **THEN** 該功能 spec SHALL 以 Requirement 形式記載於 `sales-platform` capability
- **AND** 內容初版若沿用中台版功能，SHALL 引用中台版 spec 路徑作為內容基準

#### Scenario: 業務平台版與中台版差異描述

- **WHEN** 業務平台功能初版沿用中台版內容
- **THEN** 對應 Requirement SHALL 明確列出三項差異：過濾規則、動作可見性、預設 Tab / 排序
- **AND** SHALL NOT 重複描述沿用內容（避免雙處維護）

---

### Requirement: 業務平台印件總覽

業務平台 SHALL 提供印件總覽功能，讓業務跨訂單檢視自己負責的所有印件，回應客戶查詢、開立發票參考、生產進度追蹤等業務工作需求。

**內容基準**：業務平台印件總覽的欄位、篩選 Tab、列表呈現、印件展開顯示工單列表等視覺與資料內容，**初版完全沿用中台版** — 即 [work-order spec § Requirement: 印務主管印件總覽（防掉單）](../work-order/spec.md)、[§ Requirement: 印務主管審核待辦](../work-order/spec.md)、[§ Requirement: 印務印件篩選](../work-order/spec.md) 三條 Requirement 中關於「欄位顯示」「篩選 Tab」「印件展開」的描述。

**印件類型欄位與 filter**：中台版「印務主管印件總覽（防掉單）」的「印件類型」欄位與 filter，其值域為打樣印件與大貨印件二值（列舉正本見 wiki [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) 欄位表）。依「沿用中台版」原則，業務平台印件總覽 SHALL 自動繼承此欄位與 filter，無需獨立規範；業務平台版 SHALL NOT 自行擴充印件類型的可選值。

**業務平台版差異**：

1. **過濾規則**（系統自動套用，業務不可解除）：印件總覽 SHALL 僅顯示印件所屬訂單滿足 `Order.sales_id = current_user.id` 的印件
2. **動作可見性**（業務 Role 純檢視）：
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作）
   - SHALL NOT 顯示「審核工單」相關操作（屬印務主管動作）
   - 印件展開後的工單列表項目 SHALL NOT 可點擊（業務不導航至工單詳情頁，業務與諮詢角色無工單詳情頁存取權限）
3. **預設 Tab**：業務平台版預設 SHALL NOT 套用任何篩選 Tab（顯示全部印件），與中台版預設「等待中優先未建工單」不同
4. **印件類型 filter 預設值**：業務平台版 SHALL 預設「印件類型」filter 二選項全選（顯示打樣與大貨全部印件），業務可自由收斂

**售後補做的追蹤**：業務要追客戶反映後補做的進度時，SHALL 以售後服務單為入口（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)），SHALL NOT 於印件總覽以印件類型篩選——補做不建新印件，補做量長在原印件旗下工單的補做生產任務上。

**變更理由**: 一處與統一補做案（拍板 25）相斥——原條文的印件類型 filter 寫三選項（含補印）、預設值寫「三選項全選」，並附一條以補印為篩選對象的追蹤 Scenario；補印印件型別本次廢除、wiki 印件卡值域已改二值，三選項會讓業務平台的 filter 與中台版正本對不上。追蹤 Scenario 改為以打樣為篩選對象（filter 行為不變），並補上售後補做的正確追蹤入口。過濾規則、動作可見性、預設 Tab 三項差異皆不變。

#### Scenario: 業務於業務平台檢視自己負責印件總覽

- **WHEN** 業務角色登入並進入業務平台印件總覽
- **THEN** 系統 SHALL 顯示所有 `Order.sales_id = current_user.id` 的訂單下印件
- **AND** SHALL NOT 顯示其他業務負責訂單下的印件
- **AND** 預設 SHALL 不套用任何篩選 Tab（顯示全部印件）
- **AND** 預設 SHALL 「印件類型」filter 二選項全選

#### Scenario: 業務切換篩選 Tab

- **WHEN** 業務於業務平台印件總覽切換至「製作完成」Tab
- **THEN** 系統 SHALL 僅顯示業務負責訂單下印製狀態為「製作完成」的印件
- **AND** 篩選 Tab 的可用選項 SHALL 與中台版相同（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）

#### Scenario: 業務以印件類型 filter 鎖定打樣追蹤

- **GIVEN** 業務 A 負責 100 筆印件（85 大貨、15 打樣）
- **WHEN** 業務 A 於業務平台印件總覽的印件類型 filter 取消勾選「大貨」只保留「打樣」
- **THEN** 列表 SHALL 僅顯示 15 筆打樣印件（業務 A 訂單下）
- **AND** 業務 A SHALL 可優先追蹤打樣的審稿 / 工單 / 出貨進度
- **AND** filter 的可選項目 SHALL 只有打樣與大貨二值

#### Scenario: 業務追蹤售後補做進度

- **GIVEN** 業務 A 負責的一件大貨印件經售後服務單決議補做、印務已於原工單加開補做生產任務
- **WHEN** 業務 A 於業務平台印件總覽檢視
- **THEN** 該印件 SHALL 仍以大貨印件列示一筆，SHALL NOT 另生一筆補做或補印類型的印件
- **AND** 業務 A 追補做進度 SHALL 以該筆售後服務單為入口

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

### Requirement: 業務平台印件詳情頁 Tab 閹割

印件詳情頁 SHALL 為單一統一頁面——審稿視角與生產視角合併於同一頁，系統 SHALL NOT 另設第二種印件檢視（原印件總覽的印件檢視抽屜 SHALL 併入本頁）。頁面 SHALL 由 Tab 之上的固定區塊與 Tab 兩部分組成：

固定區塊：頁首（印件編號與名稱、審稿維度狀態、印製維度狀態）、印件基本資訊、印件檔案、數量與進度、成本。欄位定義的正本見 wiki [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)，本 spec 不複寫欄位表。

Tab（中台角色）：**審稿紀錄 / 活動紀錄 / 工單與生產任務 / 品檢紀錄與缺口處置**。系統 SHALL NOT 提供獨立的「QC 紀錄」Tab——品檢紀錄掛印件層，內容歸「品檢紀錄與缺口處置」Tab。

業務平台角色（業務 / 業務主管 / 諮詢 / 會計）查看印件詳情頁時，僅 SHALL 顯示兩個 Tab：**審稿紀錄 / 活動紀錄**。「工單與生產任務 / 品檢紀錄與缺口處置」SHALL 隱藏，原因為業務 / 諮詢工作流不需直接介入生產層細節，且開放這些 Tab 可能誘發業務跨層介入印務排程（破窗效應）。上述四角色以外者（中台生產角色、審稿相關角色、現場角色、Supervisor）SHALL 顯示四個 Tab。

成本區塊 SHALL 只對 印務 / 印務主管 / Supervisor 顯示，其中毛利率 SHALL 只對 印務主管 / Supervisor 顯示；其餘角色整塊不顯示（不顯示為空值）。Supervisor 納入可見的原因為該角色屬高階經營監督，成本與毛利即其視角。

**保留內容的業務理由**：

- **印件基本資訊與印件檔案（固定區塊）**：規格 / 客戶 / 交期 / 訂單關聯 / 審稿討論串與製作討論串連結 / 印件檔案 — 業務回應客戶詢問所需
- **數量與進度（固定區塊）**：購買數量到累計送達數的數量帳 — 業務回答「做到哪、能出多少」所需
- **審稿紀錄**：審稿輪次與結果歷史 — 業務追蹤審稿進度、回應客戶稿件問題
- **活動紀錄**：印件層所有事件 — 業務查問題追溯

中台版（印務主管 / 印務 / Supervisor）印件詳情頁的 Tab 數量與內容不受業務平台閹割規則影響。

**Priority**: P1

**Rationale**: 印件在審稿與生產兩處各有一種呈現時，會出現「哪一邊才是這件印件的全貌」的問題；合併為一頁後再依角色收斂可見範圍，業務答得出客戶的問題，又不會踩進印務的排程決策。

#### Scenario: 業務進入印件詳情頁僅看到兩個 Tab

- **WHEN** 業務角色從業務平台印件總覽點擊印件名稱進入印件詳情頁
- **THEN** 系統 SHALL 顯示「審稿紀錄 / 活動紀錄」兩個 Tab
- **AND** 「工單與生產任務 / 品檢紀錄與缺口處置」SHALL 隱藏
- **AND** 預設顯示「審稿紀錄」Tab

#### Scenario: 業務看不到成本區塊

- **WHEN** 業務角色進入印件詳情頁
- **THEN** 成本區塊 SHALL 整塊不出現
- **AND** 系統 SHALL NOT 以空值或遮罩方式呈現該區塊
- **AND** 頁首、印件基本資訊、印件檔案、數量與進度四個固定區塊 SHALL 正常顯示

#### Scenario: 諮詢進入印件詳情頁與業務一致

- **WHEN** 諮詢角色從業務平台印件總覽點擊印件名稱進入印件詳情頁
- **THEN** 系統 SHALL 顯示與業務相同的兩個 Tab（審稿紀錄 / 活動紀錄）與相同的固定區塊可見範圍

#### Scenario: 中台角色看到完整四個 Tab

- **WHEN** 印務主管 / 印務 / Supervisor 進入印件詳情頁
- **THEN** 系統 SHALL 顯示「審稿紀錄 / 活動紀錄 / 工單與生產任務 / 品檢紀錄與缺口處置」四個 Tab
- **AND** 系統 SHALL NOT 提供獨立的「QC 紀錄」Tab
- **AND** 業務平台閹割規則 MUST NOT 套用至這些中台角色

#### Scenario: 三個入口導向同一頁

- **WHEN** 使用者自印件總覽列、審稿列表列或訂單詳情印件列點擊同一件印件
- **THEN** 系統 SHALL 導向同一個印件詳情頁
- **AND** 系統 SHALL NOT 以抽屜或第二種版面呈現印件資訊

### Requirement: 業務平台「我的售後服務」入口

業務平台 SHALL 於 sidebar 提供「我的售後服務」入口（路由 `/my-after-sales`），業務 / 諮詢角色 SHALL 可見並進入。會計角色 MUST NOT 看到此入口（會計對 AfterSalesTicket 為「查閱不操作」，可從訂單詳情頁的售後 Tab 唯讀查閱；會計角色職責見 wiki [會計](../../../memory/Sens_wiki/wiki/erp/03-roles/會計.md)）。

該入口對應的作業頁詳細行為定義於 [after-sales-ticket spec § Requirement: 我的售後服務作業頁](../after-sales-ticket/spec.md)。

**業務平台版定位**：

1. **過濾規則**（系統自動套用，使用者不可解除）：作業頁 SHALL 僅顯示 `opened_by = current_user.id` 的 AfterSalesTicket，使用者不可看到其他業務 / 諮詢負責的 ticket
2. **動作可見性**（業務 / 諮詢純檢視 + 單向跳轉）：
   - SHALL NOT 顯示「批次轉派」「批次結案」等管理員動作
   - SHALL NOT 顯示其他人 ticket 的卡片
   - 卡片操作 SHALL 限於「跳轉至訂單詳情頁售後 Tab」「依 next action CTA 跳對應操作區塊」
3. **預設體驗**：頁面進入 SHALL 預設顯示頂端待辦摘要（逾期 / 待填決議 / 待結案）+ 依 next action 分組列表，使用者不需切換 view

業務平台 sidebar SHALL 同步移除 `/sales-manager/after-sales-tickets`（「售後服務單轉派」）入口（依 [after-sales-ticket spec § 業務離職 / 請假時 ticket 負責人轉派 已 REMOVED](../after-sales-ticket/spec.md)）。

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

