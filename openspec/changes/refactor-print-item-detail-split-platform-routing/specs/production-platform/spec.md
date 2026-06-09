## ADDED Requirements

### Requirement: 印務平台容器定位

`production-platform` capability SHALL 作為「印務平台」這個平台容器內所有功能 spec 的集合。印務平台承載印務（production_staff）角色的工作介面（角色定義見 wiki [印務](../../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)）。

本 capability 提供：
- 印務平台版功能 spec 的歸屬規範（避免散落於 order-management / work-order / production-task 等模組 spec）
- 印務平台版與中台版的差異描述模式（過濾規則 / 動作可見性 / 預設 UI）
- 各印務平台功能的具體行為 Requirement

本 capability 內的每條 Requirement SHALL 描述「該功能在印務平台的呈現方式、範圍規則、動作可見性」，並在內容初版完全沿用中台版時，引用中台版功能 spec 作為內容基準（避免重複描述）。

印務平台版與中台版（管理層使用：Supervisor / 訂單管理人 / 審稿主管 / 印務主管 / 業務主管 / EC 商品管理）的差異 SHALL 至少明確：
- **過濾規則**：印務平台依登入印務身分自動套用範圍過濾（如「印件下有 `WorkOrder.assigned_to = current_user` 或跨印務協作印件」）
- **動作可見性**：印務平台隱藏管理層動作（如分配印件、審核工單、QC 建立）；保留印務聚焦動作（報工、批次報工、勾選 PT）
- **預設 Tab / 排序**：印務平台可有與中台版不同的預設體驗

新增印務平台功能 SHALL 在此 capability 內以新 Requirement 形式加入；不在 order-management / work-order / production-task 等模組 spec 內加印務平台特化 Requirement。

#### Scenario: 印務平台功能 spec 歸屬

- **WHEN** 新增任何印務平台專屬功能（印務角色使用的介面）
- **THEN** 該功能 spec SHALL 以 Requirement 形式記載於 `production-platform` capability
- **AND** 內容初版若沿用中台版功能，SHALL 引用中台版 spec 路徑作為內容基準

#### Scenario: 印務平台版與中台版差異描述

- **WHEN** 印務平台功能初版沿用中台版內容
- **THEN** 對應 Requirement SHALL 明確列出三項差異：過濾規則、動作可見性、預設 Tab / 排序
- **AND** SHALL NOT 重複描述沿用內容（避免雙處維護）

---

### Requirement: 印務平台印件詳情頁

印務平台 SHALL 提供印件詳情頁，路徑 `/production/print-items/:id`，給印務（production_staff）角色使用。本頁為中台印件詳情頁（`/print-items/:id`）的印務聚焦版，沿用 production-platform capability 既有差異描述模式（過濾規則 / 動作可見性 / 預設 Tab）。

**內容基準**：印務平台印件詳情頁的 Tab 結構、Sub-header strip（生產進度 + 訂單錨點）、資訊呈現規則 SHALL 完全沿用中台版（見 [order-management spec § 印件詳情頁中台版資訊架構](../order-management/spec.md)），含 7 個 Tab（資訊 / 審稿紀錄 / 工單 / QC 紀錄 / 轉交單 / 出貨單 / 活動紀錄）+ Sub-header 生產進度 strip + 訂單錨點 strip。

**印務平台版差異**：

1. **過濾規則**（系統自動套用，印務不可解除）：本頁 SHALL 僅顯示「印件下有 `WorkOrder.assigned_to = current_user`」或「跨印務協作印件（印件下其他工單由他人負責，本人有至少一張工單）」的印件；不相關印件 MUST NOT 可訪問
2. **動作可見性**（印務聚焦動作可見、管理層動作隱藏）：
   - SHALL 顯示「報工」「批次報工」「勾選 PT」（依 production-task spec § 印件詳情頁報工入口 守門規則）
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作，限中台）
   - SHALL NOT 顯示「審核工單」相關操作（屬印務主管動作，限中台）
   - 「QC 建立 / 工單異動 / 生產任務建立 / 編輯」入口維持中台版邏輯（依 [print-item-detail-progress change archive](../../changes/archive/2026-05-18-print-item-detail-progress/) decision，印件詳情頁本來就不提供這些入口，僅工單詳情頁提供）
3. **跨印務協作可見性**：印件下他人負責工單的生產任務 SHALL 完整可見（沿用中台版透明化原則），報工動作受 [production-task spec § 印件詳情頁報工入口](../production-task/spec.md) 「工單負責人」守門
4. **預設 Tab**：與中台版一致，預設「資訊」Tab

**移除 `isSalesView` 條件分支與印務 routing 拆解**：本 Requirement 引入後，`PrintItemDetail.tsx` 內基於 `currentUser.role === 'sales' || 'consultant'` 的 `isSalesView` 條件分支邏輯 SHALL 移除。印務的 routing 從 `/print-items/:id`（中台）移至 `/production/print-items/:id`（印務平台），由共用 page 元件 + 三個 route entry（中台 / 業務平台 / 印務平台）由 `platform` prop 控制 Tab 列表與動作可見性。

**印務身分的 redirect 規則**：印務使用者點擊或直接訪問 `/print-items/:id`（中台版路徑）時，系統 SHALL 自動 redirect 至 `/production/print-items/:id`（印務平台版），避免印務誤入管理層介面。

#### Scenario: 印務於印務平台檢視自己負責印件詳情

- **GIVEN** 印務 Charlie 為工單 WO-001 的 `WorkOrder.assigned_to`，工單 WO-001 屬於印件 P-001
- **WHEN** Charlie 從印務平台印件總覽（或 work-order spec § 印務主管印件總覽 入口）點擊印件 P-001
- **THEN** 系統 SHALL 導航至 `/production/print-items/P-001`
- **AND** 頁面 SHALL 顯示完整 7 Tab（資訊 / 審稿紀錄 / 工單 / QC 紀錄 / 轉交單 / 出貨單 / 活動紀錄）
- **AND** Sub-header SHALL 顯示生產進度 strip + 訂單錨點 strip
- **AND** SHALL 顯示「報工」「批次報工」相關操作（針對 Charlie 負責工單下的 PT）

#### Scenario: 印務於印務平台檢視跨印務協作印件

- **GIVEN** 印件 P-002 含工單 WO-002（印務 Charlie 負責）與 WO-003（印務 Dave 負責）
- **WHEN** Charlie 開啟印件 P-002 詳情頁（`/production/print-items/P-002`）
- **THEN** 系統 SHALL 完整顯示 WO-002 與 WO-003 下所有生產任務的明細（含 Dave 負責的部分）
- **AND** SHALL 對 WO-002 下生產任務啟用報工按鈕
- **AND** SHALL 對 WO-003 下生產任務禁用報工按鈕並提示「此工單由其他印務負責，無法在此報工」

#### Scenario: 印務嘗試操作管理層動作被擋

- **WHEN** 印務 Charlie 於印務平台印件詳情頁任一 Tab
- **THEN** 系統 MUST NOT 顯示「分配印件」按鈕（屬印務主管動作，僅中台可見）
- **AND** MUST NOT 顯示「審核工單」相關操作

#### Scenario: 印務直接訪問中台 URL 被 redirect

- **WHEN** 印務 Charlie 點擊既有書籤指向 `/print-items/P-001`（中台路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'production_staff'` 後自動 redirect 至 `/production/print-items/P-001`
- **AND** Charlie MUST NOT 看到中台管理層介面（如分配印件按鈕）
- **AND** 瀏覽器 URL bar SHALL 反映 redirected path

#### Scenario: 印務嘗試訪問非自己負責或非協作印件被擋

- **WHEN** 印務 Charlie 嘗試直接訪問 `/production/print-items/P-099`，但印件 P-099 下所有工單的 `WorkOrder.assigned_to ≠ Charlie.id` 且 Charlie 在此印件無協作關係
- **THEN** 系統 SHALL 拒絕存取，顯示「找不到此印件或無權查看」訊息
- **AND** MUST NOT 顯示印件內容
