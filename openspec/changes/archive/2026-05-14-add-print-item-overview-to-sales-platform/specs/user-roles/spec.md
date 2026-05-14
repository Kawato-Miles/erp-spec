## ADDED Requirements

### Requirement: 業務 Role 業務平台功能存取

業務角色（Role = 業務）SHALL 可使用業務平台內所有開放給業務 Role 的功能。本次納入：[sales-platform spec § Requirement: 業務平台印件總覽](../sales-platform/spec.md) — 純檢視，自動套用 `Order.sales_id = current_user.id` 過濾。

業務 Role 對業務平台印件總覽的存取 SHALL 不違反既有 § Requirement: 業務與諮詢角色的工單查閱限制 — 業務平台印件總覽屬於業務平台容器內的自有功能，業務透過此功能查閱印件層彙整資料（不導航至工單模組詳情頁），與「業務 MUST NOT 提供導航至工單模組的連結」原則一致。

業務 Role 同時 SHALL 可進入印件詳情頁（`/print-items/:id`）查閱審稿紀錄等印件深度資訊。印件詳情頁是跨 capability 的 UI 元件（涉及印件 / 審稿 / 工單 / QC / 轉交單 / 出貨單 / 活動紀錄資訊），既有 spec 尚未拆出獨立「印件 read model」capability。本 change 開放業務 / 諮詢進入印件詳情頁時，僅可見「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab（其他生產相關 Tab 隱藏，見 [sales-platform spec § Requirement: 業務平台印件詳情頁 Tab 閹割](../sales-platform/spec.md)），實質上業務 / 諮詢看到的內容不含工單模組任何資訊，與「業務 MUST NOT 導航至工單模組」原則一致。

**會計 Role 不在本次開放範圍**：會計（accountant）雖屬業務平台（依既有 § 平台歸屬分類），但其職責限定於 § Requirement: 會計角色資料存取範圍 定義的「報價單 / 訂單模組（讀取）+ 對帳檢視」，不含印件相關功能。會計 MUST NOT 取得業務平台印件總覽 / 印件詳情頁的存取權。

後續新增業務平台功能 SHALL 在本 Requirement 列舉清單中補充，並於 [sales-platform spec](../sales-platform/spec.md) 內以對應 Requirement 詳細描述。

#### Scenario: 業務登入後可使用業務平台印件總覽

- **WHEN** 業務角色登入系統
- **THEN** 業務平台側邊欄 SHALL 顯示「印件總覽」入口
- **AND** 業務點擊入口 SHALL 導航至業務平台印件總覽頁面
- **AND** 該頁面 SHALL 自動套用 `Order.sales_id = current_user.id` 過濾（業務不可解除）

#### Scenario: 業務 Role 不可使用中台版印件總覽

- **WHEN** 業務角色嘗試以 URL 直接訪問中台版印件總覽（[work-order spec § 印務主管印件總覽](../work-order/spec.md) 對應路由）
- **THEN** 系統 MUST 回傳權限不足錯誤
- **AND** 業務 SHALL 僅能透過業務平台路徑使用印件總覽功能

#### Scenario: 業務 Role 可進入印件詳情頁查閱審稿紀錄

- **WHEN** 業務於業務平台印件總覽點擊某印件名稱
- **THEN** 系統 SHALL 導航至該印件詳情頁（`/print-items/:id`）
- **AND** 業務 SHALL 可查閱該印件的審稿紀錄、規格、檔案等資訊
- **AND** 業務於印件詳情頁僅可見「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab（工單 / QC / 轉交單 / 出貨單 Tab 隱藏，見 [sales-platform spec § 業務平台印件詳情頁 Tab 閹割](../sales-platform/spec.md)）
- **AND** 實質上業務看到的內容不含工單模組任何資訊，不違反 § 業務與諮詢角色的工單查閱限制 原則

#### Scenario: 會計 Role 不在本次印件相關功能開放範圍

- **WHEN** 會計角色登入系統
- **THEN** 業務平台側邊欄 MUST NOT 顯示「印件總覽」入口
- **AND** 會計 Role 嘗試以 URL 直接訪問 `/sales/print-items` 或 `/print-items/:id`，系統 MUST 回傳權限不足錯誤
- **AND** 會計權限沿用既有 § Requirement: 會計角色資料存取範圍 限定

#### Scenario: 業務平台印件總覽純檢視

- **WHEN** 業務於業務平台印件總覽查看印件
- **THEN** 系統 MUST NOT 顯示「分配印件」「審核工單」等動作按鈕（屬印務主管權限）
- **AND** 印件展開後的工單列表項目 MUST NOT 可點擊（不導航至工單詳情頁，符合既有「業務不導航至工單模組」原則）
