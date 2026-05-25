## MODIFIED Requirements

### Requirement: 審稿主管覆寫分配

審稿主管 SHALL 可將任一進行中的印件從原審稿人員轉指派給其他審稿人員，以處理例外情況（原審稿人員離職、請假、或分配錯誤）。

覆寫時，目標審稿人員的 `max_difficulty_level` MUST ≥ 印件 `difficulty_level`。**能力不足者 SHALL 不出現於主管覆寫的審稿人員候選清單**（UI 層預先過濾，而非事後拒絕），讓主管在做決定前就看到約束。覆寫後，印件 SHALL 從原審稿人員的待審列表移除，加入新指派者的待審列表，並記錄覆寫事件至 ActivityLog（含 from_user、to_user、reason）。

**設計理由（為何主管覆寫嚴格擋，自動派工卻允許破例）**：
- 自動派工的「破例派工」（spec § 印件自動分配機制「降級路徑」）是系統不得已的降級 — 無人能力夠時保證印件不卡住，留 ActivityLog 給主管事後監看做人力決策
- 主管手動覆寫是「主動行為」，不應比自動派工更寬鬆 — 避免主管隨意覆寫造成審稿品質問題
- 兩條 path 規則不同是因動機不同（系統降級 vs 主管主動），不是設計矛盾

**實作層落差說明**：Prototype 既有實作 `overrideAssignment`（[src/utils/prepressReview.ts:461](../../../sens-erp-prototype/src/utils/prepressReview.ts)）目前採「事後拒絕」（能力不足 → throw error）；本 Requirement 要求改為 UI 層阻擋，後續 Prototype 改動需在覆寫 Dialog 候選清單預先過濾能力不足者，使主管在打開 Dialog 時看到的清單已過濾。

#### Scenario: 覆寫至合格能力的審稿人員

- **GIVEN** 印件 `difficulty_level = 5`，原指派給審稿人員 A
- **AND** 審稿人員 B 的 `max_difficulty_level = 8`
- **WHEN** 審稿主管將印件從 A 覆寫指派給 B 並填寫 reason
- **THEN** 系統 SHALL 完成轉指派
- **AND** 記錄 ActivityLog：時間、主管、from=A、to=B、覆寫 reason

#### Scenario: 覆寫候選清單預先過濾能力不足者

- **GIVEN** 印件 `difficulty_level = 8`
- **AND** 系統中審稿人員 C `max_difficulty_level = 5`、審稿人員 D `max_difficulty_level = 10`
- **WHEN** 審稿主管打開覆寫 Dialog 檢視候選清單
- **THEN** 系統 SHALL 於候選清單中**僅顯示**審稿人員 D（與其他 `max_difficulty_level ≥ 8` 的審稿員）
- **AND** 系統 MUST NOT 於候選清單顯示審稿人員 C（能力不足，UI 層預先過濾）
- **AND** 系統無須事後拒絕 — 主管根本選不到能力不足者

#### Scenario: 覆寫未填 reason 被拒

- **WHEN** 審稿主管執行覆寫但未填寫 reason
- **THEN** 系統 SHALL 拒絕並提示 reason 為必填
- **AND** 對齊「不合格未填備註被拒」的設計模式

#### Scenario: 可選清單為空時 UI 提示

- **GIVEN** 印件 `difficulty_level = 10`
- **AND** 系統中所有審稿人員的 `max_difficulty_level` 均 < 10（例如最高為 8）或原審稿員已離職停用
- **WHEN** 審稿主管打開覆寫 Dialog
- **THEN** 候選清單 SHALL 為空
- **AND** UI SHALL 顯示 actionable 提示「無可選審稿人員，請先調整審稿員能力等級或恢復原審稿員」
- **AND** 系統 MUST NOT 顯示空白清單讓主管陷入無路可走

---

## ADDED Requirements

### Requirement: 打樣結果業務判定

業務（owner of 訂單）SHALL 於**打樣印件**（與大貨印件同時建立，見 [business-processes spec § 打樣流程規則](../business-processes/spec.md)）對應的**打樣 WorkOrder**（`WorkOrder.type = 打樣`，見 [work-order spec L825](../work-order/spec.md)）推進至「已完成」後，於該打樣 WorkOrder 詳情頁判定打樣結果。

**欄位定義**（PrintItem 新增）：
- `sampleResult` enum（`待確認` / `OK` / `NG-製程問題` / `NG-稿件問題`）— 預設 `待確認`（新建印件初始值）；業務判定後寫入對應結果

**觸發位置**：打樣 WorkOrder 詳情頁（**不是印件詳情頁**；對齊 Prototype 既有實作 [src/pages/WorkOrderDetail.tsx](../../../sens-erp-prototype/src/pages/WorkOrderDetail.tsx)）

**觸發條件**：
- `WorkOrder.type = 打樣`
- `WorkOrder.status = 已完成`
- 對應 PrintItem 的 `sampleResult = 待確認`（尚未判定）

**判定者**：業務（current user，order owner）

**各 enum 分支後續流程**：

- **OK**（打樣通過）→ 開放大貨流程；業務後續手動建大貨工單。系統不自動觸發任何下游動作（保留業務決定權）
- **NG-製程問題**（打樣品質問題，稿件本身無問題）→ 業務 UI 自行於同打樣印件下建新打樣 WorkOrder 重做；系統不自動建新工單（保留業務決定權；ng_process 下游自動化處理機制細節待 OQ AR-13 解後實作）
- **NG-稿件問題**（稿件本身有問題，需重新處理稿件）→ 系統 SHALL 自動觸發「打樣後棄用原印件建新印件」流程（見下方 Requirement）

**判定不可逆**：判定後 `sampleResult` 鎖定，不可由業務再次修改（避免規避稽核軌跡）。若判定錯誤需更正，須由業務主管走 ActivityLog 修正流程（本 spec 不展開細節）。

**ActivityLog 記錄**：判定動作 SHALL 寫入訂單層 ActivityLog（`Order.activityLogs`），格式為「填打樣結果：{result}（工單 {workOrderNo}）」（對齊 Prototype 既有實作）；印件層 ActivityLog（PrintItemActivityEvent）不引入新事件型別。

#### Scenario: 業務判定 OK

- **GIVEN** 打樣印件 X 對應的打樣 WorkOrder 已推進至「已完成」、`sampleResult = 待確認`
- **WHEN** 業務於打樣 WorkOrder 詳情頁點擊「填打樣結果」按鈕，選擇 `OK` 並儲存
- **THEN** 系統 SHALL 寫入 `PrintItem.sampleResult = OK`
- **AND** 系統 MUST NOT 自動觸發任何下游動作（業務後續手動建大貨工單）
- **AND** 訂單層 ActivityLog SHALL 建立「填打樣結果：OK（工單 {workOrderNo}）」事件

#### Scenario: 業務判定 NG-製程問題

- **GIVEN** 打樣印件 X 對應的打樣 WorkOrder 已推進至「已完成」、`sampleResult = 待確認`
- **WHEN** 業務於打樣 WorkOrder 詳情頁選擇 `NG-製程問題` 並確認
- **THEN** 系統 SHALL 寫入 `PrintItem.sampleResult = NG-製程問題`
- **AND** 系統 MUST NOT 自動建新打樣 WorkOrder（業務 UI 自行建）
- **AND** 訂單層 ActivityLog SHALL 建立「填打樣結果：NG-製程問題（工單 {workOrderNo}）」事件
- **AND** UI SHALL 提示業務「請建立新的打樣工單（同印件）」

#### Scenario: 業務判定 NG-稿件問題

- **GIVEN** 打樣印件 X 對應的打樣 WorkOrder 已推進至「已完成」、`sampleResult = 待確認`
- **WHEN** 業務於打樣 WorkOrder 詳情頁選擇 `NG-稿件問題`、確認對話框後儲存
- **THEN** 系統 SHALL 寫入 `PrintItem.sampleResult = NG-稿件問題`
- **AND** 系統 SHALL 自動觸發 § 打樣後棄用原印件建新印件 流程
- **AND** 訂單層 ActivityLog SHALL 建立「填打樣結果：NG-稿件問題（工單 {workOrderNo}）」事件

#### Scenario: 判定後不可由業務再次修改

- **GIVEN** 打樣印件 X `sampleResult = OK`（已判定）
- **WHEN** 業務嘗試於打樣 WorkOrder 詳情頁再次修改 `sampleResult`
- **THEN** 系統 MUST 拒絕修改並提示「打樣結果已填，如需更正請聯絡業務主管」
- **AND** UI SHALL 隱藏「填打樣結果」按鈕（僅 `sampleResult = 待確認` 時顯示）

#### Scenario: 大貨印件無 sampleResult 欄位顯示

- **GIVEN** 大貨印件 Z（與打樣印件同時建立但屬大貨工單，非打樣印件）
- **WHEN** 業務於大貨 WorkOrder 詳情頁檢視
- **THEN** UI SHALL 不顯示「填打樣結果」按鈕（觸發條件 `WorkOrder.type = 打樣` 不成立）
- **AND** 大貨印件 `sampleResult` 欄位保留為 `待確認`（無業務語意；不會被使用）

#### Scenario: 打樣 WorkOrder 未完成不可判定

- **GIVEN** 打樣印件 X 對應的打樣 WorkOrder 仍在「製作中」（尚未推進至「已完成」）
- **WHEN** 業務嘗試於打樣 WorkOrder 詳情頁判定 `sampleResult`
- **THEN** 系統 MUST 拒絕並提示「工單尚未完成，不可填打樣結果」
- **AND** UI SHALL 隱藏「填打樣結果」按鈕

---

### Requirement: 印件追溯欄位

PrintItem 實體 SHALL 新增 `derived_from_print_item_id` FK 欄位（FK PrintItem，nullable），作為印件 clone 自其他印件時的**結構化追溯關聯**。

**欄位定義**：
- `derived_from_print_item_id` FK PrintItem nullable
- 一般新建印件（業務手動建立 / Quote 轉訂單 / EC 訂單建立等）為 NULL
- clone 建立時（如 NG-稿件問題觸發棄用 + 建新印件）寫入原印件 ID

**用途**：
- **正向追溯**：新印件詳情頁可顯示「來自原印件 [X 編號]」連結（透過 derived_from_print_item_id 直接訪問）
- **反向查詢**：原印件詳情頁可透過 reverse query（`WHERE derived_from_print_item_id = 原印件 ID`）找到所有自其衍生的新印件，無需另建反向 FK

**與既有 notes 追溯互補**：Prototype 既有實作（[src/store/useErpStore.ts:2563](../../../sens-erp-prototype/src/store/useErpStore.ts)）已用 `notes` 文字「（由 X NG-稿件問題重建）」表達追溯關聯；新增 FK 提供結構化查詢能力，兩者並存：notes 為人類可讀文字，FK 為機器可查詢欄位。

**clone 場景識別（本 spec 範圍內）**：目前唯一 clone 場景為「NG-稿件問題」觸發的「打樣後棄用原印件建新印件」流程；未來其他 clone 場景（如客戶異動稿件需求、印件規格錯誤修正等）另開 change 擴充使用此欄位。

#### Scenario: 一般新建印件 derived_from_print_item_id 為 NULL

- **WHEN** 系統建立新印件（業務手動建立 / Quote 轉訂單 / EC 訂單建立等非 clone 場景）
- **THEN** `derived_from_print_item_id` MUST 為 NULL

#### Scenario: clone 建立印件 derived_from_print_item_id 寫入原印件 ID

- **GIVEN** 印件 X 因 NG-稿件問題觸發棄用 + clone 流程
- **WHEN** 系統 clone 原印件 X 建立新印件 Y
- **THEN** 新印件 Y 的 `derived_from_print_item_id` MUST = X.id

#### Scenario: 新印件詳情頁顯示追溯連結

- **GIVEN** 印件 Y 的 `derived_from_print_item_id = X.id`
- **WHEN** 任何角色開啟印件 Y 詳情頁
- **THEN** UI SHALL 顯示「來自原印件 [X 編號]（NG-稿件問題重建）」可點擊連結

#### Scenario: 原印件詳情頁反向查詢衍生新印件

- **GIVEN** 原印件 X 已棄用、由其 clone 出新印件 Y（Y.derived_from_print_item_id = X.id）
- **WHEN** 任何角色開啟原印件 X 詳情頁
- **THEN** UI SHALL 透過 reverse query 顯示「已衍生新印件 [Y 編號]」可點擊連結

---

### Requirement: 打樣後棄用原印件建新印件

當業務判定 `sampleResult = NG-稿件問題`（稿件問題）時，系統 SHALL 自動觸發棄用原打樣印件 + clone 新打樣印件流程，對齊 spec § 審稿人員審稿作業「合格為終態，後續需變更內容須透過棄用原印件 + 建立新印件」既定設計。

**系統動作（atomic transaction）**：

1. **原打樣印件**：
   - `printItemStatus` 轉 `已棄用`（沿用既有 PrintItemStatus enum，**不引入** `lifecycle_status` 獨立欄位 — 對齊 Prototype 既有實作）
   - `notes` 加註「（NG-稿件問題已棄用，改由 [新印件號] 重新審稿）」
2. **系統 clone 原打樣印件至新打樣印件**：
   - **保留欄位**（業務屬性與訂單關聯）：印件規格（productName / paperMaterial / processContent / specNotes / orderedQty / unit / shippingMethod / deliveryDate / packagingNotes 等）+ 客戶資訊 + 訂單關聯（orderId / sourceItemNo）+ difficultyLevel + type（仍為打樣印件）
   - **reset 欄位**（審稿維度與印製維度）：reviewStatus = `稿件未上傳` / reviewDimensionStatus = `稿件未上傳` / reviewRounds = [] / currentRoundId = null / reviewFiles = [] / reviewActivityLogs = [] / sampleResult = `待確認` / printItemStatus = `待生產` / producedQty = 0 / warehouseQty = 0 / shippedQty = 0 / artworkCount = 0 / workOrderCount = 0 / fileName = null
   - **新印件編號**：`{訂單編號}_{遞增三位流水號}`（依訂單內既有印件數 + 1）
3. **新印件 `derived_from_print_item_id = 原印件 id`**（結構化追溯 FK，本 change 新增；見 § 印件追溯欄位）
4. **新印件 `notes`**：沿用原印件 + 加註「（由 [原印件 ID] NG-稿件問題重建）」
5. **新印件 printItemCount + 1**：訂單 printItemCount 計數遞增
6. **訂單層 ActivityLog**：寫入「NG-稿件問題：棄用 [原印件號]，建立新印件 [新印件號]」事件
7. **新打樣印件後續流程**：等待業務重新上傳稿件 → 進入審稿流程（走自動分派演算法 / 走免審稿快速路徑依業務情境）

**追溯關聯（單向）**：
- 新印件 → 原印件：透過 `derived_from_print_item_id` 直接訪問
- 原印件 → 新印件：透過 reverse query 取得（見 § 印件追溯欄位）

#### Scenario: NG-稿件問題觸發棄用 + clone

- **GIVEN** 打樣印件 X 對應的打樣 WorkOrder 已完成、`sampleResult = 待確認`、`printItemStatus = 已完成`
- **WHEN** 業務判定 `sampleResult = NG-稿件問題`
- **THEN** 系統 SHALL atomic 執行：
  - 原打樣印件 X：`printItemStatus = 已棄用` + notes 加註棄用說明
  - 建立新打樣印件 Y：clone X 業務屬性 + reset 審稿維度與印製維度 + `derived_from_print_item_id = X.id` + notes 加註重建說明
  - 訂單 `printItemCount + 1`
  - 訂單層 ActivityLog 寫入「NG-稿件問題：棄用 [X 印件號]，建立新印件 [Y 印件號]」
- **AND** 新打樣印件 Y `sampleResult` MUST 為 `待確認`
- **AND** 新打樣印件 Y `printItemStatus` MUST 為 `待生產`
- **AND** 新打樣印件 Y `reviewStatus` MUST 為 `稿件未上傳`

#### Scenario: clone 保留業務屬性 reset 審稿與印製維度

- **GIVEN** 原印件 X：orderedQty = 500、paperMaterial = 250g 銅版、difficultyLevel = 7、specNotes = "客戶要求特殊色"、reviewStatus = 合格、printItemStatus = 已完成、currentRoundId = round-99
- **WHEN** 系統因 X.sampleResult = NG-稿件問題 而 clone X 至新印件 Y
- **THEN** 新印件 Y SHALL 保留：orderedQty = 500、paperMaterial = 250g 銅版、difficultyLevel = 7、specNotes = "客戶要求特殊色"
- **AND** 新印件 Y SHALL reset：reviewStatus = 稿件未上傳、reviewDimensionStatus = 稿件未上傳、reviewRounds = []、currentRoundId = null、sampleResult = 待確認、printItemStatus = 待生產、producedQty = 0、artworkCount = 0、workOrderCount = 0、fileName = null

#### Scenario: 原印件棄用後不再參與後續流程

- **GIVEN** 原印件 X 因 NG-稿件問題棄用、`printItemStatus = 已棄用`
- **WHEN** 系統檢查印件 X 是否參與後續流程（工單建立 / 出貨 / 完成度計算 / 審稿員待審列表）
- **THEN** 系統 MUST NOT 將印件 X 納入：
  - 新工單建立的候選印件清單
  - 出貨清單
  - 訂單完成度計算（已棄用印件不計入分母）
  - 審稿員待審列表
- **AND** 印件 X 仍可於印件詳情頁直接訪問（稽核用途）

#### Scenario: NG-稿件問題後可能再次發生（多次重建）

- **GIVEN** 原印件 X 因 NG-稿件問題衍生新印件 Y、新印件 Y 經審稿合格進入打樣完成
- **WHEN** 業務判定 Y.sampleResult = NG-稿件問題
- **THEN** 系統 SHALL 再次觸發棄用 + clone：Y → printItemStatus = 已棄用 + 新印件 Z
- **AND** Z.derived_from_print_item_id = Y.id（不直接指向 X，保持追溯鏈每層 1 跳）
- **AND** Z 等待業務重新上傳稿件
