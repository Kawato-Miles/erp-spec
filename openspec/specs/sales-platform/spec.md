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

**印件屬性欄位與 filter**：中台版「印務主管印件總覽（防掉單）」的「印件屬性」欄位與 filter，其值域為打樣印件與大貨印件二值（列舉正本見 wiki [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) 欄位表）。依「沿用中台版」原則，業務平台印件總覽 SHALL 自動繼承此欄位與 filter，無需獨立規範；業務平台版 SHALL NOT 自行擴充印件屬性的可選值。

**業務平台版差異**：

1. **過濾規則**（系統自動套用，業務不可解除）：印件總覽 SHALL 僅顯示印件所屬訂單滿足 `Order.sales_id = current_user.id` 的印件
2. **動作可見性**（業務 Role 純檢視）：
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作）
   - SHALL NOT 顯示「審核工單」相關操作（屬印務主管動作）
   - 印件展開後的工單列表項目 SHALL NOT 可點擊（業務不導航至工單詳情頁，業務與諮詢角色無工單詳情頁存取權限）
3. **預設 Tab**：業務平台版預設 SHALL NOT 套用任何篩選 Tab（顯示全部印件），與中台版預設「等待中優先未建工單」不同
4. **印件屬性 filter 預設值**：業務平台版 SHALL 預設「印件屬性」filter 二選項全選（顯示打樣與大貨全部印件），業務可自由收斂

**售後補做的追蹤**：業務要追客戶反映後補做的進度時，SHALL 以售後服務單為入口（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)），SHALL NOT 於印件總覽以印件屬性篩選——補做不建新印件，補做量長在原印件旗下工單的補做生產任務上。

**變更理由**: 一處與統一補做案（拍板 25）相斥——原條文的印件屬性 filter 寫三選項（含補印）、預設值寫「三選項全選」，並附一條以補印為篩選對象的追蹤 Scenario；補印印件型別本次廢除、wiki 印件卡值域已改二值，三選項會讓業務平台的 filter 與中台版正本對不上。追蹤 Scenario 改為以打樣為篩選對象（filter 行為不變），並補上售後補做的正確追蹤入口。過濾規則、動作可見性、預設 Tab 三項差異皆不變。

#### Scenario: 業務於業務平台檢視自己負責印件總覽

- **WHEN** 業務角色登入並進入業務平台印件總覽
- **THEN** 系統 SHALL 顯示所有 `Order.sales_id = current_user.id` 的訂單下印件
- **AND** SHALL NOT 顯示其他業務負責訂單下的印件
- **AND** 預設 SHALL 不套用任何篩選 Tab（顯示全部印件）
- **AND** 預設 SHALL 「印件屬性」filter 二選項全選

#### Scenario: 業務切換篩選 Tab

- **WHEN** 業務於業務平台印件總覽切換至「製作完成」Tab
- **THEN** 系統 SHALL 僅顯示業務負責訂單下印製狀態為「製作完成」的印件
- **AND** 篩選 Tab 的可用選項 SHALL 與中台版相同（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）

#### Scenario: 業務以印件屬性 filter 鎖定打樣追蹤

- **GIVEN** 業務 A 負責 100 筆印件（85 大貨、15 打樣）
- **WHEN** 業務 A 於業務平台印件總覽的印件屬性 filter 取消勾選「大貨」只保留「打樣」
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

固定區塊：頁首（印件編號與名稱、審稿維度狀態、印製維度狀態）、印件基本資訊、印件檔案、數量與進度。欄位定義的正本見 wiki [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)，本 spec 不複寫欄位表。**固定區塊 SHALL NOT 再設成本區塊**——金額一律收進「報價與利潤」Tab。

Tab（中台生產角色：印務、印務主管、Supervisor）：**審稿紀錄 / 活動紀錄 / 工單與生產任務 / 品檢紀錄與缺口處置 / 報價與利潤**。系統 SHALL NOT 提供獨立的「QC 紀錄」Tab——品檢紀錄掛印件層，內容歸「品檢紀錄與缺口處置」Tab。

**「報價與利潤」Tab SHALL 呈現下列七欄，全部為未稅金額**：印件小計、預計成本、實際成本、預估利潤、預估利潤率、實際利潤、實際利潤率。四個利潤欄的算式與分母口徑的正本見 wiki [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md) § 規則 4，本 spec SHALL NOT 複寫算式。本 Tab SHALL NOT 顯示稅額、SHALL NOT 顯示含稅金額——稅額只在訂單層計算並取整（見 [order-billing spec](../order-billing/spec.md)），印件層各自取整會與訂單層對不上。

**預估利潤率與實際利潤率 SHALL 各自依三段門檻標示**：35% 以上、20% 至 35%、20% 以下。門檻值的正本見同一張 wiki 卡。標示 SHALL 只是讀數提示，SHALL NOT 擋下任何動作、SHALL NOT 觸發審核或通知。

**可見範圍 SHALL 為**：

| 角色 | 「報價與利潤」Tab | 可見欄位 |
|---|---|---|
| 印務、印務主管、Supervisor | 可見 | 七欄全見 |
| 業務、業務主管 | 可見 | 只見印件小計、預估利潤、預估利潤率、實際利潤、實際利潤率五欄；預計成本與實際成本兩欄 SHALL NOT 出現 |
| 諮詢、會計、訂單管理人、審稿相關角色、現場角色 | 不可見 | 整個 Tab SHALL NOT 出現 |

業務 SHALL 只看得到自己負責訂單（或被分享訂單）旗下印件的本 Tab，範圍過濾沿用 § 業務平台印件總覽。不可見時 SHALL 整個 Tab 不出現，系統 SHALL NOT 顯示空值、SHALL NOT 顯示「權限不足」字樣。

業務平台角色（業務 / 業務主管 / 諮詢 / 會計）查看印件詳情頁時，「工單與生產任務 / 品檢紀錄與缺口處置」SHALL 隱藏，原因為業務 / 諮詢工作流不需直接介入生產層細節，且開放這些 Tab 可能誘發業務跨層介入印務排程（破窗效應）。因此業務與業務主管 SHALL 見三個 Tab（審稿紀錄 / 活動紀錄 / 報價與利潤）、諮詢與會計 SHALL 見兩個 Tab（審稿紀錄 / 活動紀錄）。審稿相關角色與現場角色 SHALL 見四個 Tab（審稿紀錄 / 活動紀錄 / 工單與生產任務 / 品檢紀錄與缺口處置）。

**保留內容的業務理由**：

- **印件基本資訊與印件檔案（固定區塊）**：規格 / 客戶 / 交期 / 訂單關聯 / 審稿討論串與製作討論串連結 / 印件檔案 — 業務回應客戶詢問所需
- **數量與進度（固定區塊）**：購買數量到累計送達數的數量帳 — 業務回答「做到哪、能出多少」所需
- **審稿紀錄**：審稿輪次與結果歷史 — 業務追蹤審稿進度、回應客戶稿件問題
- **活動紀錄**：印件層所有事件 — 業務查問題追溯
- **報價與利潤**：這一件賣多少、賺多少 — 業務判斷要不要接下一批同款貨、印務判斷製程怎麼安排划不划算

中台版（印務主管 / 印務 / Supervisor）印件詳情頁的 Tab 數量與內容不受業務平台閹割規則影響。

**Priority**: P1

**Rationale**: 印件在審稿與生產兩處各有一種呈現時，會出現「哪一邊才是這件印件的全貌」的問題；合併為一頁後再依角色收斂可見範圍，業務答得出客戶的問題，又不會踩進印務的排程決策。金額改收進一個獨立 Tab，是因為公司參考文件要的是「這一件賣多少、成本多少、賺多少」一次讀完，原本散在固定區塊的成本區塊只答得出一半。業務與業務主管看得到利潤、看不到成本兩欄，是 Miles 2026-09-21 的拍板：業務要判斷這一款值不值得再接，看利潤就夠；成本明細是印務的工作資料。由小計與利潤可反推成本一事已知並接受，欄位層不另設遮罩。印務看得到利潤率，是因為摘要與這一頁是他安排製程時的判斷依據。不列稅額與含稅金額，是因為稅只在訂單層算一次並取整，印件層各自取整會讓兩層對不上帳。

#### Scenario: 業務進入印件詳情頁看到三個 Tab

- **WHEN** 業務角色從業務平台印件總覽點擊印件名稱進入自己負責訂單的印件詳情頁
- **THEN** 系統 SHALL 顯示「審稿紀錄 / 活動紀錄 / 報價與利潤」三個 Tab
- **AND** 系統 SHALL NOT 顯示「工單與生產任務」與「品檢紀錄與缺口處置」兩個 Tab

#### Scenario: 業務於報價與利潤頁籤只見五欄

- **GIVEN** 一件印件的小計 50,000 元、預計成本 42,000 元、實際成本 45,150 元
- **WHEN** 業務開啟該印件的「報價與利潤」Tab
- **THEN** 畫面 SHALL 顯示印件小計 50,000、預估利潤 8,000、預估利潤率 16.0%、實際利潤 4,850、實際利潤率 9.7%
- **AND** 畫面 SHALL NOT 出現預計成本與實際成本兩欄

#### Scenario: 印務於報價與利潤頁籤見七欄

- **GIVEN** 同一件印件
- **WHEN** 印務、印務主管或 Supervisor 開啟該印件的「報價與利潤」Tab
- **THEN** 畫面 SHALL 同時顯示印件小計、預計成本、實際成本與四個利潤欄

#### Scenario: 利潤率依三段門檻標示且不擋動作

- **GIVEN** 一件印件的預估利潤率為 16.0%、另一件為 38.0%
- **WHEN** 印務檢視兩件的「報價與利潤」Tab
- **THEN** 前者 SHALL 標示為 20% 以下那一段、後者 SHALL 標示為 35% 以上那一段
- **AND** 系統 SHALL NOT 因落在任何一段而擋下編輯、建工單或推進狀態

#### Scenario: 不可見角色整個頁籤不出現

- **WHEN** 訂單管理人、諮詢、會計或現場角色開啟印件詳情頁
- **THEN** 系統 SHALL NOT 顯示「報價與利潤」Tab
- **AND** 系統 SHALL NOT 以空值或「權限不足」字樣呈現該 Tab

#### Scenario: 頁籤不列稅額與含稅金額

- **WHEN** 任一可見角色開啟「報價與利潤」Tab
- **THEN** 七欄 SHALL 皆為未稅金額
- **AND** 畫面 SHALL NOT 出現稅額欄或含稅金額欄

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

