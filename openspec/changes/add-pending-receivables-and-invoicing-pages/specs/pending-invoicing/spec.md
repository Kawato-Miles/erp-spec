## ADDED Requirements

### Requirement: 待開發票列管模組總覽

系統 SHALL 於 ERP 主導覽提供獨立的「待開發票」頁面，列出所有「應開金額大於零」的訂單，支援業務即時掌握待開票工作。列表 SHALL 顯示以下欄位：訂單編號、客戶名稱、應開金額、預計開票日（取該訂單下所有 PaymentPlan 中最近一筆未過期的 `expected_invoice_date`，若皆未填則用 `scheduled_date` 替代）、負責業務、帳務公司。

#### Scenario: 業務於主導覽進入待開發票模組

- **WHEN** 業務點擊主導覽「待開發票」入口
- **THEN** 系統 SHALL 列出所有與該業務相關、應開金額大於零的訂單（依角色 view 篩選）
- **AND** 預設依預計開票日由近至遠排序（最早需開的優先）

#### Scenario: 預計開票日依 expected_invoice_date 排序

- **GIVEN** 訂單 SO-001 有 PaymentPlan #1 expected_invoice_date = 2026-05-15，PaymentPlan #2 expected_invoice_date = 2026-06-30
- **WHEN** 業務開啟待開發票模組
- **THEN** SO-001 列項的預計開票日 SHALL 顯示 2026-05-15（最近一筆未過期）

#### Scenario: 未填 expected_invoice_date 時退化用 scheduled_date

- **GIVEN** 訂單 SO-002 有 PaymentPlan #1 expected_invoice_date = NULL、scheduled_date = 2026-05-20
- **WHEN** 業務開啟待開發票模組
- **THEN** SO-002 列項的預計開票日 SHALL 顯示 2026-05-20
- **AND** 列項 SHALL 標示「未指定預計開票日（依預定收款日）」

### Requirement: 應開金額公式引用三方對帳檢視面板

`pending-invoicing` 的「應開金額」SHALL 引用 [order-management spec § 三方對帳檢視面板](../order-management/spec.md) 的「應收總額 − 發票淨額」公式：

```
應開金額 = (∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount)
        − (∑ 開立 Invoice.total_amount − ∑ 已確認 SalesAllowance.|allowance_amount|)
```

系統 SHALL NOT 在 pending-invoicing capability 自定義應開金額公式，避免與三方對帳面板產生資料漂移。任何 OrderAdjustment 執行、Invoice 開立 / 作廢、SalesAllowance 變動 SHALL 即時反映於兩處。

#### Scenario: 應開金額即時計算

- **GIVEN** 訂單 SO-001 印件費 100,000、無 OrderExtraCharge、已執行 OrderAdjustment +20,000、已開立 Invoice 合計 130,000、已確認 SalesAllowance -10,000
- **WHEN** 業務開啟待開發票模組
- **THEN** SO-001 的應開金額 SHALL = 應收總額（120,000）− 發票淨額（120,000）= 0
- **AND** SO-001 SHALL NOT 出現於待開發票列表（應開金額不大於零）

#### Scenario: 訂單異動執行後待開金額即時更新

- **GIVEN** 訂單 SO-002 應開金額顯示 100,000
- **WHEN** 業務於該訂單建立並執行 OrderAdjustment(amount = +20,000)
- **THEN** 待開發票模組 SHALL 即時更新 SO-002 應開金額為 120,000
- **AND** 訂單詳情頁對帳檢視面板的差額 SHALL 同步顯示 120,000

### Requirement: 待開發票列表的篩選與排序

待開發票列表 SHALL 提供以下篩選與排序操作：

- 篩選：客戶、負責業務、帳務公司、預計開票日區間、應開金額區間、訂單狀態
- 排序：預計開票日、應開金額、客戶名稱、訂單編號

#### Scenario: 業務篩選帳務公司

- **WHEN** 業務選擇篩選器「帳務公司 = 森紙股份有限公司」
- **THEN** 系統 SHALL 僅列出該帳務公司之應開金額大於零的訂單

#### Scenario: 業務依預計開票日區間篩選

- **WHEN** 業務選擇「預計開票日 = 2026-05-01 ~ 2026-05-31」
- **THEN** 系統 SHALL 列出預計開票日落在 5 月份的訂單

### Requirement: 列表項目跳轉訂單詳情並聚焦發票區（backend 重算）

每筆訂單列項 SHALL 提供「開立發票」按鈕，點擊後跳轉至對應 `Order` 詳情頁的發票區塊，預設打開發票表單供業務確認金額後送出。

跳轉至訂單詳情頁的發票表單時，應開金額 MUST 由訂單詳情頁 backend 重新計算，**不採用 列管模組 列表上展示的快取值**。原因：避免並發更新場景下（業務 A 在 列管模組 列表停留時，業務 B 執行 OrderAdjustment 修改應收）使用過時值導致少開 / 多開。

#### Scenario: 業務點擊「開立發票」按鈕跳轉並 backend 重算

- **GIVEN** 業務於 列管模組 列項看到 SO-001 應開金額 = 100,000
- **AND** 業務點擊前 5 秒，業務 B 於 SO-001 執行 OrderAdjustment(+20,000)
- **WHEN** 業務點擊「開立發票」按鈕
- **THEN** 系統 SHALL 導向 SO-001 詳情頁
- **AND** 預設展開發票區塊並開啟發票表單
- **AND** 表單預設帶入應開金額 SHALL 由訂單詳情頁 backend 重新計算 = 120,000（最新值）
- **AND** 業務 SHALL 可微調金額後送出（不限制必須等於應開金額）

#### Scenario: 業務於 列管模組 跳轉時 backend 重算

- **WHEN** 業務點擊待開發票列項的「開立發票」按鈕
- **THEN** 系統 SHALL 呼叫訂單詳情頁的應收 / 發票淨額 API 取得最新值
- **AND** 不採用 列管模組 列表上的快取應開金額作為發票表單預填值

### Requirement: 待開發票模組為唯讀視圖

待開發票模組 SHALL 為唯讀列管視圖，業務 SHALL 不可於本模組直接呼叫藍新 Mockup 開立 Invoice，僅可跳轉至訂單詳情頁的發票表單執行（保持發票開立入口單一）。

#### Scenario: 待開發票模組不提供開票寫入操作

- **WHEN** 業務嘗試於待開發票列項直接呼叫藍新 Mockup 開立 Invoice
- **THEN** 系統 SHALL 拒絕並引導業務至訂單詳情頁的發票表單
