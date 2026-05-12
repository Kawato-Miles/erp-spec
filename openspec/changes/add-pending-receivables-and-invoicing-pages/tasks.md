## 1. 前置依賴

- [ ] 1.1 確認 [refactor-order-adjustment-and-cleanup change](../refactor-order-adjustment-and-cleanup/proposal.md) 已歸檔，OrderAdjustment 雙身份與對帳警示觸發邏輯已 sync 至 main spec
- [ ] 1.2 確認既有 PaymentPlan / OrderAdjustment / Invoice / SalesAllowance 三方對帳檢視面板邏輯為本 change 的依賴基礎

## 2. Prototype 資料層 mock

- [ ] 2.1 PaymentPlan mock 資料結構增加 `expected_invoice_date` 欄位（選填，型別為日期）
- [ ] 2.2 既有 PaymentPlan mock 資料的 `expected_invoice_date` 為 NULL（不回填，業務未填者使用 scheduled_date 替代排序）

## 3. Prototype UI 變更（pending-receivables 待收款模組）

- [ ] 3.1 ERP 主導覽新增「待收款」入口
- [ ] 3.2 待收款列表頁（欄位：訂單編號 / 客戶 / 應收金額 / 預計收款日 / 逾期天數 / 負責業務 / 帳務公司）
- [ ] 3.3 三色警示視覺呈現（依 overdue_days：< 0 無警示、0-29 黃、≥ 30 紅）
- [ ] 3.4 篩選功能（客戶 / 業務 / 帳務公司 / 預計收款日 / 逾期天數區間 / 訂單狀態）
- [ ] 3.5 排序功能（逾期天數 / 預計收款日 / 應收金額 / 客戶名稱）
- [ ] 3.6 列項點擊跳轉至訂單詳情頁的「款項與發票」區塊並聚焦對應 PaymentPlan
- [ ] 3.7 唯讀視圖：拒絕本模組內任何寫入操作

## 4. Prototype UI 變更（pending-invoicing 待開發票模組）

- [ ] 4.1 ERP 主導覽新增「待開發票」入口
- [ ] 4.2 待開發票列表頁（欄位：訂單編號 / 客戶 / 應開金額 / 預計開票日 / 負責業務 / 帳務公司）
- [ ] 4.3 應開金額即時計算引用 [order-management § 三方對帳檢視面板](../../specs/order-management/spec.md) 的「應收總額 − 發票淨額」公式（不另定義）
- [ ] 4.4 列項提供「開立發票」按鈕跳轉訂單詳情頁的發票表單
- [ ] 4.5 跳轉時 backend 重算應開金額（不採用 列管模組 列表上的快取值）作為發票表單預填值
- [ ] 4.6 預計開票日來源：取 PaymentPlan 中最近一筆未過期的 expected_invoice_date，若皆未填則用 scheduled_date 替代並標示「未指定預計開票日（依預定收款日）」
- [ ] 4.7 篩選功能（客戶 / 業務 / 帳務公司 / 預計開票日 / 應開金額區間 / 訂單狀態）
- [ ] 4.8 排序功能（預計開票日 / 應開金額 / 客戶 / 訂單編號）

## 5. Prototype UI 變更（PaymentPlan 編輯）

- [ ] 5.1 PaymentPlan 編輯介面增加「預計開票日」欄位（選填）
- [ ] 5.2 PaymentPlan 編輯介面提供「批次設定多筆 PaymentPlan 為同一預計開票日」快捷操作

## 6. 三角色三 view 權限實作

- [ ] 6.1 業務 / 諮詢於兩模組見個人 view（依 Order.sales_id）
- [ ] 6.2 業務主管於兩模組見部門 view（自己部門所有業務之訂單）
- [ ] 6.3 訂單管理人 / 會計 / Supervisor 於兩模組見全公司 view
- [ ] 6.4 會計於 pending-invoicing 隱藏「開立發票」跳轉按鈕（依既有「會計嘗試開立發票被擋」Requirement）

## 7. 業務情境驗證

- [ ] 7.1 驗證：業務日常追款工作流（早上開 ERP → 待收款 → 紅色警示 → 跳轉訂單 → 致電客戶）
- [ ] 7.2 驗證：業務每月初追開票工作流（待開發票 → 篩選 5 月 → 逐筆開立）
- [ ] 7.3 驗證：業務主管早會檢視部門待收款
- [ ] 7.4 驗證：會計月底批次列管應收（全公司 view + 帳務公司篩選）
- [ ] 7.5 驗證：應開金額並發更新（業務 A 在 列管模組 停留時，業務 B 執行 OrderAdjustment(+20K) → 業務 A 跳轉時 backend 重算為 120K，不用快取的 100K）
- [ ] 7.6 驗證：訂單異動執行後待開發票模組即時更新應開金額
- [ ] 7.7 驗證：未填 expected_invoice_date 的 PaymentPlan 退化用 scheduled_date 排序，UI 標示明確

## 8. 文件同步

- [ ] 8.1 確認應開金額公式於 pending-invoicing spec 與 order-management § 三方對帳檢視面板一致（同一公式單一來源）
- [ ] 8.2 確認三 view 角色權限與 user-roles 既有「業務 / 業務主管於訂單模組的資料可見範圍」一致
- [ ] 8.3 確認待開發票模組的「開立發票」按鈕跳轉行為與 user-roles 既有「會計嘗試開立發票被擋」Requirement 一致
- [ ] 8.4 Spec 修訂版本累積後手動推送至 Notion 發布版本

## 9. 三視角審查與採用率量測準備

- [ ] 9.1 spec / design 完成後三視角審查（senior-pm + ceo-reviewer + erp-consultant 平行）
- [ ] 9.2 上線前 30 天 baseline 量測腳本：業務透過訂單列表搜尋追款的點擊熱圖、業務追款動作（Payment 紀錄建立）的觸發來源
- [ ] 9.3 採用率指標定義（依 OQ-1 建議：第 30 天「待收款模組業務 DAU ≥ 60%」「逾期 ≥ 30 天 PaymentPlan 點擊查看率 ≥ 80%」；第 60 天「跳轉占比 ≥ 50%」）
- [ ] 9.4 上線後 30 / 60 天採用率對照 baseline 計算 delta，低於閾值評估 UX 改善或回退方案

## 10. 歸檔準備

- [ ] 10.1 spec 全文 strict 驗證通過（`openspec validate add-pending-receivables-and-invoicing-pages --strict`）
- [ ] 10.2 archive change，sync delta specs 至 main specs
