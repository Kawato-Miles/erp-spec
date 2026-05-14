## Why

業務目前無法跨訂單追蹤自己負責的印件 — 客戶來電詢問印件進度、業務開立發票時參考印件層資料、跨訂單追蹤生產與出貨進度時，都必須逐單開啟訂單詳情頁，無對應彙整視圖。本 change 在「業務平台」引入印件總覽功能；ERP 既有的中台 + 平台架構已在 [user-roles spec § Requirement: 平台歸屬分類](../../specs/user-roles/spec.md) 定義（六個平台：業務平台 / 中台 / 印務平台 / 審稿平台 / 工廠平台 / 中國供應商平台），本次同時新建 `sales-platform` capability 作為業務平台功能集合的正式 spec 容器，後續諮詢 / 工廠等平台可比照建立各自 capability。

## What Changes

- 新建 `sales-platform` capability：作為「業務平台」這個容器的 spec，本次納入「印件總覽（業務平台版）」一條 Requirement
- 業務平台印件總覽：
  - 內容初版與中台版（既有 [work-order spec § Requirement: 印務主管印件總覽](../../specs/work-order/spec.md)）完全相同（欄位 / 篩選 Tab / 列表呈現一致），後續依使用回饋再調整閹割範圍
  - 自動套用 `Order.sales_id = current_user.id` 過濾，僅顯示業務自己負責訂單下的印件
  - 純檢視：不開放「分配印件」「審核工單」等動作
  - 預設不套 Tab 篩選（與中台版「等待中優先未建工單」不同）
- 修改 `user-roles` spec：
  - 既有 § Requirement: 平台歸屬分類已定義六個平台與角色歸屬，本次不重複架構說明
  - 新增 § Requirement: 業務 Role 業務平台功能存取（列出業務平台可用功能；本次納入印件總覽純檢視）
  - 不修改既有 § 業務與諮詢角色的工單查閱限制（業務平台印件總覽屬業務平台自有功能，不違反「不導航至工單模組」原則）
- 不修改 `work-order` spec：既有印件總覽 Requirement（印務主管 / 中台使用）行為不變；中台版與業務平台版的對應關係由 sales-platform spec 內的 Requirement 描述引用

## Capabilities

### New Capabilities
- `sales-platform`：業務平台容器 spec，承載業務角色可使用的功能（本次納入印件總覽，後續可擴充其他業務平台功能）

### Modified Capabilities
- `user-roles`：既有 § 平台歸屬分類不變更（架構章節已存在）；新增 § Requirement: 業務 Role 業務平台功能存取（本次納入印件總覽純檢視）

## Impact

- **新檔案**：`openspec/specs/sales-platform/spec.md`
- **修改檔案**：
  - `openspec/specs/user-roles/spec.md`（新增 § 業務 Role 業務平台功能存取 Requirement）
- **Data Model**：不變更（不新增欄位、不修改 PrintItem / Order / WorkOrder 結構）
- **狀態機**：不變更
- **Prototype 影響**：業務平台路由 + 印件總覽頁面（沿用既有印務主管印件總覽元件，加上 `sales_id = self` 過濾與動作隱藏）— 實作在後續 task 階段
- **Breaking Changes**：無
- **後續延伸 change**（不在本次 scope）：
  - 諮詢平台容器 spec + 諮詢 Role
  - 工廠平台容器 spec + 印務 Role
  - 業務平台印件總覽閹割範圍（依使用回饋決定砍哪些欄位 / 功能）
  - 業務開立發票「剩餘可開金額」需求 — 回 [extend-invoice-issuance-flexibility](../extend-invoice-issuance-flexibility/) change 處理
