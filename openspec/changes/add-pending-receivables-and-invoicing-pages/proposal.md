## Why

業務目前用 Excel + 個人記憶追款 / 追開票，無系統列管入口。13 個業務情境分析（[Notion follow-up「提供收款情境」](https://www.notion.so/3573886511fa80b39093d8c76b57737a)）顯示：發票指定月份開立、跨期作廢 / 折讓、頭尾款追款、申請後付款追蹤等情境，業務都需要「該追什麼一目了然」的入口才能有效處理。本 change 補完這個缺口：新增「待收款」「待開發票」兩個獨立列管模組於 ERP 主導覽，作為業務 / 業務主管 / 會計三角色的日常工作起點。

依賴 [refactor-order-adjustment-and-cleanup change](../refactor-order-adjustment-and-cleanup/proposal.md) 的 OrderAdjustment 行為基礎與「對帳警示 banner 觸發」邏輯。本 change 額外引入 `PaymentPlan.expected_invoice_date` 欄位（業務排程開票日期）作為待開發票模組的排序依據。

直接服務 Phase 2 / 3 北極星指標「訂單流程完整完成率」的「業務追款 / 追開票動作可被系統追蹤」子指標。

## What Changes

- 新增 `pending-receivables` capability（待收款列管模組）：
  - 主導覽獨立頁，列出所有未收 PaymentPlan
  - 顯示訂單編號 / 客戶 / 期次待收金額 / 預計收款日 / 逾期天數 / 負責業務 / 帳務公司
  - 三色警示（依 `overdue_days` 黃 / 紅警示）
  - 唯讀視圖，所有寫入操作於訂單詳情頁完成
  - 篩選與排序：客戶 / 業務 / 帳務公司 / 預計收款日 / 逾期天數 / 訂單狀態
- 新增 `pending-invoicing` capability（待開發票列管模組）：
  - 主導覽獨立頁，列出應開金額大於零的訂單
  - 應開金額計算引用 [order-management spec § 三方對帳檢視面板](../../specs/order-management/spec.md) 的「應收總額 − 發票淨額」公式（不另定義）
  - 顯示訂單編號 / 客戶 / 應開金額 / 預計開票日 / 負責業務 / 帳務公司
  - 列項提供「開立發票」按鈕跳轉訂單詳情頁，跳轉時應開金額 MUST 由訂單詳情頁 backend 重新計算（不採用 列管模組 列表上展示的快取值，避免並發更新導致少開）
- `PaymentPlan` 新增 `expected_invoice_date` 欄位（選填，業務排程用）：
  - 不影響 Invoice 實體開立流程（仍由業務手動於訂單詳情頁觸發）
  - 僅作為待開發票模組的排序與提醒來源
  - 未填者待開發票模組以 `scheduled_date` 替代排序
- 業務 / 業務主管 / 會計於兩個 列管模組 的權限矩陣：
  - 業務：個人 view（僅見自己負責訂單）
  - 業務主管：部門 view（見自己部門所有業務的訂單）
  - 訂單管理人 / 會計 / Supervisor：全公司 view（見全公司訂單）
  - 業務 / 業務主管 / 訂單管理人 / Supervisor 於待開發票模組可跳轉開立；會計於待開發票模組無開立按鈕（依既有「會計嘗試開立發票被擋」Requirement）
- 新增「待收款 / 待開發票模組業務流程」於 business-processes spec：定義業務日常追款 / 追開票工作流，明示兩模組為唯讀列管視圖

## Capabilities

### New Capabilities

- `pending-receivables`：待收款列管模組，提供業務 / 會計即時掌握所有未收款項目（依 PaymentPlan 衍生），含逾期排序與篩選
- `pending-invoicing`：待開發票列管模組，提供業務即時掌握所有應開未開的訂單金額，含預計開票日排序

### Modified Capabilities

- `order-management`：PaymentPlan 加 `expected_invoice_date` 欄位 + 對應 Scenario
- `user-roles`：待收款 / 待開發票兩模組角色可見範圍與權限矩陣（個人 / 部門 / 全公司三 view）
- `business-processes`：待收款 / 待開發票模組業務流程（唯讀列管視圖，所有寫入操作於訂單詳情頁完成）

## Impact

- **依賴**：本 change 依賴 [refactor-order-adjustment-and-cleanup change](../refactor-order-adjustment-and-cleanup/proposal.md) 的 OrderAdjustment 雙身份設計與「對帳警示 banner 觸發條件」邏輯。前者 change 需先歸檔，本 change 才能進入實作
- **程式碼層**：新增 pending-receivables 與 pending-invoicing 兩 capability 的查詢 API，PaymentPlan 加一欄位
- **資料移轉**：PaymentPlan.expected_invoice_date 為 NULL 允許新欄位，既有資料不需回填
- **UI 層**：ERP 主導覽新增兩個獨立頁入口；PaymentPlan 編輯介面增加「預計開票日」欄位（選填）
- **API 層**：兩個 列管模組 頁的查詢 API；pending-invoicing 跳轉訂單詳情頁時 backend 重算應開金額
- **Prototype 層**：[sens-erp-prototype](https://github.com/Kawato-Miles/sens-erp-prototype) 對應主導覽兩個獨立頁與 PaymentPlan 編輯欄位 mock 補上
- **效能風險**：未來訂單量大時兩個列表頁的查詢效能 → Mitigation：底層查詢與訂單列表的「應收帳款帳齡篩選」共用 derived field（`overdue_days`），加上 `expected_invoice_date` 索引；MVP 不需考慮，待真實量級再優化
- **不在範疇**：CEO 視角現金流預測（未來 30/60/90 天預計開票金額曲線，後期 dashboard）、列管模組 升級路徑（業務備註欄、責任歸屬、自動升級，後期強化）、上游約束機制（急單溢價、客戶售後頻率 banner，未來 epic）、列管模組 採用率成功 / 失敗指標（上線後量測階段定義）
