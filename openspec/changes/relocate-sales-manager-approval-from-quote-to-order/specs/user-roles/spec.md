## MODIFIED Requirements

### Requirement: 業務主管角色職責

業務主管 SHALL 負責**訂單建立後、報價單外發前的成交條件審核**：與業務確認收款條件、報價金額、交期合理後，將線下訂單從「待業務主管審核」推進至「報價待回簽」。業務主管 MUST NOT 介入需求單流程任何狀態轉換（需求確認、成本評估、議價、成交 / 流失皆由業務獨立執行）。

業務主管的核准決策範圍 MUST 限於「訂單指定的業務主管 = 自己」的訂單；MUST NOT 跨業務主管核准他人指定範圍的訂單。業務主管 SHALL 擁有需求單模組的只讀權限（提供部門總覽能力）；MUST NOT 編輯需求單內容、推進需求單狀態、或執行成交 / 流失動作。

業務主管 SHALL 歸屬於中台平台（與印務主管、審稿主管、Supervisor、訂單管理人、EC商品管理對稱），登入後 SHALL 看見中台介面入口。業務主管的工作模式為每日進系統處理「訂單審核」待辦（對齊印務主管模式）。

業務主管的利害關係程度 SHALL 為「高」，因「待業務主管審核 → 報價待回簽」為訂單流程關鍵推進節點，未通過則報價單無法外發給客人簽回。

**資料可見範圍**：

| 頁面 | 業務主管可見範圍 |
|------|----------------|
| 需求單列表頁（`/`）| 所有需求單（只讀，提供部門總覽能力）|
| 需求單詳情頁（`/quote/{id}`）| 所有需求單（只讀，無業務主管專屬動作按鈕）|
| 訂單列表頁（`/orders`）| 所有訂單（提供部門總覽能力）|
| 訂單審核待辦頁（`/sales-manager/approvals`）| `order.approved_by_sales_manager_id = self` AND `status ∈ {待業務主管審核, 報價待回簽, 已回簽, 已取消}` |
| 訂單詳情頁（`/orders/{id}`）| 所有訂單可瀏覽；「核准訂單」按鈕僅在 `approved_by_sales_manager_id = self` 時顯示 |

詳細訂單可見範圍規則見 [order-management spec](../order-management/spec.md) § 業務主管於訂單模組的資料可見範圍。

業務主管的中台側選單 SHALL 包含：
1. **諮詢管理**（與業務同等可見）
2. **需求單管理 → 需求單列表**（單一 sub item，只讀檢視）
3. **訂單管理 → [訂單列表、訂單審核、訂單異動審核]**（三個 sub item）

業務主管登入後的預設首頁 SHALL = `/sales-manager/approvals`（訂單審核待辦頁）。

若同一使用者兼具業務與業務主管兩角色（如資深業務兼任業務主管），可見範圍 SHALL 取兩者聯集。

#### Scenario: 業務主管登入後看到中台介面與訂單審核待辦頁

- **WHEN** 業務主管使用業務主管角色登入 ERP
- **THEN** 系統 SHALL 自動導航至 `/sales-manager/approvals`（訂單審核待辦頁）
- **AND** 該頁面 SHALL 預設套用篩選 `order.approved_by_sales_manager_id = self AND status = 待業務主管審核`
- **AND** 列表 SHALL 按「進入待業務主管審核時間」ASC 排序
- **AND** UI SHALL 顯示等待天數欄位

#### Scenario: 業務主管核准訂單推進至報價待回簽

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 SHALL 將該核准動作寫入 OrderActivityLog（操作者 = 業務主管、事件描述包含「核准訂單（成交條件審核）」）

#### Scenario: 業務主管不可核准他人指定的訂單

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於訂單詳情頁點擊「核准訂單」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 業務主管 SHALL 看不到該訂單於自己的訂單審核待辦清單

#### Scenario: 業務主管不直接編輯需求單內容

- **WHEN** 業務主管於需求單詳情頁查看內容
- **THEN** 系統 SHALL 以唯讀方式呈現印件規格、成本、報價、客戶資料、收款備註等欄位
- **AND** 系統 MUST NOT 提供業務主管編輯印件、修改報價、執行成交 / 流失的入口
- **AND** 系統 MUST NOT 顯示業務主管專屬動作按鈕（核可進入議價、核准成交等均下架）

#### Scenario: 業務主管不直接編輯訂單內容（除核准動作外）

- **WHEN** 業務主管於訂單詳情頁查看內容
- **THEN** 系統 SHALL 以唯讀方式呈現印件、付款、發票、活動紀錄等欄位
- **AND** 系統 MUST NOT 提供業務主管編輯訂單一般欄位的入口
- **AND** 系統 SHALL 提供業務主管「核准訂單」單向動作入口（限自己被指定的訂單）；業務主管不核准時透過 Slack thread 與業務溝通，不於 ERP 內留 comment（細粒度權限見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單）
