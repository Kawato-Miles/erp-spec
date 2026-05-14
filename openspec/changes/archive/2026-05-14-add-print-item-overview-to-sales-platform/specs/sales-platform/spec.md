## ADDED Requirements

### Requirement: 業務平台容器定位

`sales-platform` capability SHALL 作為「業務平台」這個平台容器內所有功能 spec 的集合。業務平台依 [user-roles spec § Requirement: 平台歸屬分類](../user-roles/spec.md) 定義，承載業務、諮詢、會計三個角色的工作介面。

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

**業務平台版差異**：

1. **過濾規則**（系統自動套用，業務不可解除）：印件總覽 SHALL 僅顯示印件所屬訂單滿足 `Order.sales_id = current_user.id` 的印件
2. **動作可見性**（業務 Role 純檢視）：
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作）
   - SHALL NOT 顯示「審核工單」相關操作（屬印務主管動作）
   - 印件展開後的工單列表項目 SHALL NOT 可點擊（業務不導航至工單詳情頁，符合 [user-roles spec § 業務與諮詢角色的工單查閱限制](../user-roles/spec.md)）
3. **預設 Tab**：業務平台版預設 SHALL NOT 套用任何篩選 Tab（顯示全部印件），與中台版預設「等待中優先未建工單」不同

#### Scenario: 業務於業務平台檢視自己負責印件總覽

- **WHEN** 業務角色登入並進入業務平台印件總覽
- **THEN** 系統 SHALL 顯示所有 `Order.sales_id = current_user.id` 的訂單下印件
- **AND** SHALL NOT 顯示其他業務負責訂單下的印件
- **AND** 預設 SHALL 不套用任何篩選 Tab（顯示全部印件）

#### Scenario: 業務切換篩選 Tab

- **WHEN** 業務於業務平台印件總覽切換至「製作完成」Tab
- **THEN** 系統 SHALL 僅顯示業務負責訂單下印製狀態為「製作完成」的印件
- **AND** 篩選 Tab 的可用選項 SHALL 與中台版相同（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）

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

---

### Requirement: 業務平台印件詳情頁 Tab 閹割

業務 / 諮詢角色查看印件詳情頁時，僅 SHALL 顯示三個 Tab：**資訊 / 審稿紀錄 / 活動紀錄**。其他 Tab（工單 / QC 紀錄 / 轉交單 / 出貨單）SHALL 隱藏，原因為業務 / 諮詢工作流不需直接介入生產層細節（工單派工 / QC 結果 / 轉交流程 / 出貨單管理），且開放這些 Tab 可能誘發業務跨層介入印務排程（破窗效應）。

**保留 Tab 的業務理由**：
- **資訊**：印件基本資料（規格 / 客戶 / 交期 / 訂單關聯 / 印件檔案 / 生產資訊摘要）— 業務回應客戶詢問所需
- **審稿紀錄**：審稿輪次與結果歷史 — 業務追蹤審稿進度、回應客戶稿件問題
- **活動紀錄**：印件層所有事件（目前以審稿事件為主，未來可擴充）— 業務查問題追溯

中台版（印務主管 / 印務 / Supervisor）印件詳情頁 Tab 數量與內容不受本 Requirement 影響。

#### Scenario: 業務進入印件詳情頁僅看到三個 Tab

- **WHEN** 業務角色從業務平台印件總覽點擊印件名稱進入印件詳情頁
- **THEN** 系統 SHALL 顯示「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab
- **AND** 「工單 / QC 紀錄 / 轉交單 / 出貨單」四個 Tab SHALL 隱藏
- **AND** 預設顯示「資訊」Tab

#### Scenario: 諮詢進入印件詳情頁與業務一致

- **WHEN** 諮詢角色從業務平台印件總覽點擊印件名稱進入印件詳情頁
- **THEN** 系統 SHALL 顯示與業務相同的三個 Tab（資訊 / 審稿紀錄 / 活動紀錄）

#### Scenario: 中台角色印件詳情頁不受影響

- **WHEN** 印務主管 / 印務 / Supervisor 進入印件詳情頁
- **THEN** 系統 SHALL 顯示完整七個 Tab（資訊 / 審稿紀錄 / 工單 / QC 紀錄 / 轉交單 / 出貨單 / 活動紀錄）
- **AND** 業務平台閹割規則 MUST NOT 套用至這些中台角色
