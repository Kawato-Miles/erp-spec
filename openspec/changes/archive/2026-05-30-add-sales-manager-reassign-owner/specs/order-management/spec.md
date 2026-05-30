## MODIFIED Requirements

### Requirement: 訂單詳情頁業務負責人 row 簡化

訂單詳情頁「資訊」Tab 內的「訂單資訊」卡中，業務負責人 row 的呈現 SHALL 依視角分流：

- 對**業務 / 諮詢視角**，value 區 SHALL 僅顯示業務負責人姓名純文字，MUST NOT 包含「分享 / 轉單」按鈕或任何 inline 動作按鈕。業務的臨時協助 / 代理授權 SHALL 完全由「分享」Tab 內的 PermissionManagement 元件承接（沿用 US-ORD-004 機制）。
- 對**業務主管視角**，業務負責人 row SHALL 顯示「改派負責人」入口（改 owner，限業務主管）。改派與分享為兩種獨立機制：分享不改 owner（業務本人可做）、改派改 owner（限業務主管）。詳見 § Requirement: 訂單負責業務改派 與 [user-roles § 業務主管改派負責業務職責](../user-roles/spec.md)。

既有「Supervisor 重新指定訂單業務主管」流程（重新指定該訂單的審核業務主管 `approved_by_sales_manager_id`）屬不同語意，與本次「改派負責業務（`sales_id`）」為兩件事，不互相取代。

#### Scenario: 業務查看訂單資訊卡業務負責人 row

- **WHEN** 業務於訂單詳情頁「資訊」Tab 查看「訂單資訊」卡的業務負責人 row
- **THEN** value 區 SHALL 僅顯示業務負責人姓名（或當無業務負責人時顯示 `-`）
- **AND** value 區 MUST NOT 顯示「分享 / 轉單」按鈕或任何 inline 動作按鈕

#### Scenario: 業務需要分享訂單檢視 / 編輯權限

- **GIVEN** 業務想授予同事檢視 / 編輯訂單的權限
- **WHEN** 業務切到「分享」Tab
- **THEN** PermissionManagement 元件 SHALL 提供搜尋同事 + 授予檢視 / 編輯權限的完整流程
- **AND** 業務 SHALL NOT 需要回到「資訊」Tab 觸發任何業務負責人 row 內的按鈕

#### Scenario: 業務主管於業務負責人 row 改派

- **WHEN** 業務主管於訂單詳情頁「資訊」Tab 查看業務負責人 row
- **THEN** value 區 SHALL 顯示「改派負責人」入口（業務 / 諮詢視角不顯示此入口）
- **AND** 點擊 SHALL 開啟改派 Dialog（見 § Requirement: 訂單負責業務改派）

## ADDED Requirements

### Requirement: 訂單負責業務改派

業務主管 SHALL 可於訂單詳情頁改派訂單負責業務（`sales_id`）。改派為改 owner 的管理動作，與「分享」（不改 owner、業務可做、US-ORD-004）為兩種獨立機制。改派的通用規則（理由分類五值必填、五要素留痕、候選人以 Role 模組權限篩選、全公司範圍、改派不改狀態）沿用 [user-roles § 業務主管改派負責業務職責](../user-roles/spec.md)。本 Requirement 定義訂單模組特有規則。

**允許改派狀態**：訂單 `status ≠ 已取消` 即可改派（含已完成），對齊「訂單未取消即可編輯」粗粒度規則。理由：售後服務的負責人衍生自訂單負責人，業務離職後完成訂單的售後須能改派接手。已取消訂單禁改派（無售後意義）。

**售後負責人衍生**：售後服務的負責業務衍生自訂單負責業務（非獨立欄位）。改派訂單 `sales_id` SHALL 連帶轉移該訂單後續售後事件的歸屬至新負責業務。

**電商訂單防呆**：電商來源訂單若無負責業務（`sales_id` 為空），改派入口 SHALL disabled（電商訂單負責人機制後階段才開發）。

#### Scenario: 業務主管改派進行中訂單負責業務

- **GIVEN** 訂單 `status ∉ {已取消}`、有 `sales_id`
- **WHEN** 業務主管點「改派負責人」、選新負責人（候選 = 具訂單管理權限的使用者）、必選理由分類、確認
- **THEN** 系統 SHALL 更新 `sales_id` 為新負責人
- **AND** SHALL 寫入活動紀錄五要素（原 / 新負責人、改派時間、理由分類與補述、操作主管）
- **AND** MUST NOT 改變訂單狀態

#### Scenario: 業務主管改派已完成訂單（售後歸屬連帶轉移）

- **GIVEN** 訂單 `status = 訂單完成`、原業務已離職
- **WHEN** 業務主管以理由分類「離職交接」改派負責業務給接手業務
- **THEN** 系統 SHALL 允許改派（完成訂單未取消）
- **AND** 該訂單後續售後事件的負責業務 SHALL 衍生為新負責人
- **AND** SHALL 寫入活動紀錄五要素

#### Scenario: 已取消訂單禁止改派

- **GIVEN** 訂單 `status = 已取消`
- **WHEN** 業務主管開啟該訂單詳情頁
- **THEN** 「改派負責人」入口 SHALL disabled
- **AND** SHALL 顯示提示（已取消訂單無法改派）

#### Scenario: 電商訂單無負責業務時改派 disabled

- **GIVEN** 電商來源訂單 `sales_id` 為空
- **WHEN** 業務主管開啟該訂單詳情頁
- **THEN** 「改派負責人」入口 SHALL disabled
- **AND** SHALL 顯示提示（電商訂單尚無負責業務，無法改派）

#### Scenario: 改派理由分類驅動分享成員與通知

- **WHEN** 業務主管以不同理由分類改派訂單
- **THEN** 理由 = 離職交接時，系統 SHALL 清空該訂單既有分享成員（sharedMembers）、且 SHALL NOT 通知原負責人（已離職）
- **AND** 理由 ∈ {長假代理、工作負荷平衡、客戶要求換窗口、其他} 時，系統 SHALL 保留既有分享成員、且 SHALL 知會原負責人
- **AND** 任一理由皆 SHALL 通知新負責人（Slack mock + 活動紀錄）
