## ADDED Requirements

### Requirement: 業務 Role 業務平台功能存取

業務角色（Role = 業務）SHALL 可使用業務平台內所有開放給業務 Role 的功能。本次納入：[sales-platform spec § Requirement: 業務平台印件總覽](../sales-platform/spec.md) — 純檢視，自動套用 `Order.sales_id = current_user.id` 過濾。

業務 Role 對業務平台印件總覽的存取 SHALL 不違反既有 § Requirement: 業務與諮詢角色的工單查閱限制 — 業務平台印件總覽屬於業務平台容器內的自有功能，業務透過此功能查閱印件層彙整資料（不導航至工單模組詳情頁），與「業務 MUST NOT 提供導航至工單模組的連結」原則一致。

業務 Role 同時 SHALL 可進入印件詳情頁（`/print-items/:id`）查閱審稿紀錄等印件深度資訊。印件詳情頁屬印件模組（非工單模組），開放給業務 Role 與「業務 MUST NOT 導航至工單模組」原則無衝突。業務於印件詳情頁的可見內容與可執行動作 SHALL 由各印件詳情頁 Tab 自身的角色判斷規範（如工單 Tab 內的工單項目仍不可點擊至工單詳情頁）。

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
- **AND** 印件詳情頁屬印件模組（非工單模組），開放給業務 Role 不違反 § 業務與諮詢角色的工單查閱限制 原則

#### Scenario: 業務平台印件總覽純檢視

- **WHEN** 業務於業務平台印件總覽查看印件
- **THEN** 系統 MUST NOT 顯示「分配印件」「審核工單」等動作按鈕（屬印務主管權限）
- **AND** 印件展開後的工單列表項目 MUST NOT 可點擊（不導航至工單詳情頁，符合既有「業務不導航至工單模組」原則）
