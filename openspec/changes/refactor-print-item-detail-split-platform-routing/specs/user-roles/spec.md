## ADDED Requirements

### Requirement: 印件詳情頁存取路徑分流

印件詳情頁 SHALL 依使用者角色分流為三條獨立 routing，避免單一頁面用 `isSalesView` 等條件分支控制 Tab 顯示與動作可見性。本 Requirement 對齊 [§ 平台歸屬分類](spec.md) 既有三平台對應（中台 / 業務平台 / 印務平台），延伸到印件詳情頁的具體路徑規範。

**中台路徑**（`/print-items/:id`）：
- 適用角色：Supervisor、訂單管理人、審稿主管、印務主管、業務主管、EC 商品管理
- 內容：完整 7 Tab（資訊 / 審稿紀錄 / 工單 / QC 紀錄 / 轉交單 / 出貨單 / 活動紀錄）+ Sub-header 生產進度 strip + 訂單錨點 strip + 管理層動作（分配印件、審核工單）
- 詳細呈現規則：見 [order-management spec § 印件詳情頁中台版資訊架構](../order-management/spec.md)

**業務平台路徑**（`/sales/print-items/:id`）：
- 適用角色：業務（sales）、諮詢（consultant）、會計
- 內容：3 Tab（資訊 / 審稿紀錄 / 活動紀錄）+ Sub-header 僅訂單錨點 strip（無生產進度 strip）+ 純檢視（無報工、無管理動作）
- 詳細呈現規則：見 [sales-platform spec § 業務平台印件詳情頁](../sales-platform/spec.md)

**印務平台路徑**（`/production/print-items/:id`）：
- 適用角色：印務（production_staff）
- 內容：完整 7 Tab + Sub-header 生產進度 strip + 訂單錨點 strip + 印務聚焦動作（報工 / 批次報工 / 勾選 PT）；隱藏管理層動作（分配印件 / 審核工單）
- 詳細呈現規則：見 [production-platform spec § 印務平台印件詳情頁](../production-platform/spec.md)

**Role-based redirect 規則**：
- 業務 / 諮詢 / 會計訪問 `/print-items/:id`（中台路徑）或 `/production/print-items/:id`（印務平台路徑）時，系統 SHALL 自動 redirect 至 `/sales/print-items/:id`
- 印務訪問 `/print-items/:id` 或 `/sales/print-items/:id` 時，系統 SHALL 自動 redirect 至 `/production/print-items/:id`
- 中台角色（Supervisor / 訂單管理人 / 審稿主管 / 印務主管 / 業務主管 / EC 商品管理）訪問 `/sales/print-items/:id` 或 `/production/print-items/:id` 時，系統 SHALL 自動 redirect 至 `/print-items/:id`

**對既有條件分支的影響**：本 Requirement 引入後，`PrintItemDetail.tsx` 內基於 `currentUser.role === 'sales' || 'consultant'` 的 `isSalesView` 條件分支邏輯 SHALL 移除。實作改為共用 page 元件 + 三個 route entry（由 `platform` prop 控制 Tab 列表 + Sub-header 範圍 + 動作可見性）。

**後續其他單位平台拆 routing 時的擴充模式**：審稿平台 / 工廠平台 / 中國供應商平台後續若需提供印件詳情頁的精簡版或聚焦版，SHALL 透過獨立 routing 拆解（如 `/prepress/...`、`/factory/...`、`/cn-supplier/...`），MUST NOT 在中台頁面內加 role 條件分支。

#### Scenario: 印務主管點擊印件總覽進入中台印件詳情頁

- **WHEN** 印務主管從印件總覽（`/work-orders/print-items`）點擊一筆印件
- **THEN** 系統 SHALL 導航至 `/print-items/:id`（中台路徑）
- **AND** 頁面 SHALL 顯示完整 7 Tab + 生產進度 strip + 訂單錨點 strip + 「分配印件」按鈕

#### Scenario: 印務點擊印件總覽進入印務平台印件詳情頁

- **WHEN** 印務從印件總覽點擊一筆自己負責或協作的印件
- **THEN** 系統 SHALL 導航至 `/production/print-items/:id`（印務平台路徑）
- **AND** 頁面 SHALL 顯示完整 7 Tab + 生產進度 strip + 訂單錨點 strip + 報工相關操作（針對自己負責工單）
- **AND** SHALL NOT 顯示「分配印件」按鈕

#### Scenario: 業務點擊業務平台印件總覽進入業務平台印件詳情頁

- **WHEN** 業務從業務平台印件總覽（`/sales/print-items`）點擊一筆印件
- **THEN** 系統 SHALL 導航至 `/sales/print-items/:id`（業務平台路徑）
- **AND** 頁面 SHALL 顯示 3 Tab + 訂單錨點 strip（無生產進度 strip）

#### Scenario: 諮詢與會計沿用業務平台路徑

- **WHEN** 諮詢或會計從業務平台印件總覽點擊一筆印件
- **THEN** 系統 SHALL 導航至 `/sales/print-items/:id`（業務平台路徑）
- **AND** 頁面 SHALL 與業務角色完全一致

#### Scenario: 業務直接訪問中台 URL 被自動 redirect 至業務平台

- **WHEN** 業務 Alice 點擊既有書籤指向 `/print-items/P-001`（中台路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'sales'` 後自動 redirect 至 `/sales/print-items/P-001`
- **AND** Alice MUST NOT 看到中台版完整 7 Tab 介面
- **AND** 瀏覽器 URL bar SHALL 反映 redirected path

#### Scenario: 印務直接訪問中台 URL 被自動 redirect 至印務平台

- **WHEN** 印務 Charlie 點擊既有書籤指向 `/print-items/P-001`（中台路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'production_staff'` 後自動 redirect 至 `/production/print-items/P-001`
- **AND** Charlie MUST NOT 看到中台管理層介面（無「分配印件」按鈕）
- **AND** 瀏覽器 URL bar SHALL 反映 redirected path

#### Scenario: 印務主管直接訪問印務平台 URL 被自動 redirect 至中台

- **WHEN** 印務主管嘗試訪問 `/production/print-items/P-001`（印務平台路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'production_manager'` 後自動 redirect 至 `/print-items/P-001`（中台路徑）
- **AND** 印務主管 MUST NOT 看到印務聚焦版介面（避免錯失「分配印件」管理動作）

#### Scenario: 業務主管 / Supervisor / 訂單管理人 / 審稿主管 / EC 商品管理沿用中台路徑

- **WHEN** 上述中台角色從任一入口（印件總覽 / 直接訪問）進入印件詳情頁
- **THEN** 系統 SHALL 一律導航至中台路徑 `/print-items/:id`
- **AND** 頁面 SHALL 顯示完整 7 Tab + 管理層動作（屬中台範圍）

#### Scenario: 後續其他單位平台拆 routing 時沿用此模式

- **GIVEN** 後續規劃審稿平台 / 工廠平台 / 中國供應商平台的印件詳情頁聚焦版時
- **WHEN** 需要為其角色提供精簡版或聚焦版的印件詳情頁
- **THEN** SHALL 透過獨立 routing 拆解（如 `/prepress/print-items/:id`、`/factory/print-items/:id`），MUST NOT 在中台頁面內加 role 條件分支
- **AND** 中台頁面 SHALL 保持單一視角（管理層全功能版）
