## Context

訂單款項與發票場景源自 [Notion follow-up「提供收款情境」](https://www.notion.so/3573886511fa80b39093d8c76b57737a)（2026-05-08），蒐集 13 個典型業務情境。經 explore 階段與三視角審查後拆分為兩個 change，本 change 為其中之一：

- 前置 change `refactor-order-adjustment-and-cleanup`：聚焦 OrderAdjustment 重構與廢除補收款訂單預留欄位（資料結構層面）
- 本 change `add-pending-receivables-and-invoicing-pages`：聚焦待收款 / 待開發票兩個列管模組（行為改變層面），依賴前置 change

本 change 的核心是「行為改變賭注」：業務目前用 Excel + 個人記憶追款 / 追開票，引入新模組後是否真的會放棄 Excel 是設計風險，採用率將於上線後量測（採用指標見 OQ-1）。

當前 `order-management` spec 已建立 BillingCompany / PaymentPlan / Payment / Invoice / SalesAllowance / OrderAdjustment / OrderExtraCharge 七個核心實體與三方對帳檢視面板。本 change 在此基礎上補上兩個獨立列管視圖，並加 PaymentPlan.expected_invoice_date 欄位作為排序依據。

設計哲學延續：「列管模組為唯讀視圖，所有寫入操作於訂單詳情頁完成」（保持寫入入口單一），「應開金額公式引用既有三方對帳面板」（不重複定義以避免漂移）。

## Goals / Non-Goals

**Goals:**

- 業務 / 會計於主導覽即可掌握「該追款哪些」「該開票哪些」，不需逐筆翻訂單
- 兩個 列管模組 與訂單詳情頁對帳檢視面板資料即時一致（同公式來源）
- 三角色（業務 / 業務主管 / 會計）的可見範圍清楚（個人 / 部門 / 全公司三 view）
- 待開發票模組跳轉訂單詳情頁時 backend 重算應開金額，避免並發更新導致少開
- PaymentPlan.expected_invoice_date 提供業務排程開票的記錄，但不影響 Invoice 實體開立流程

**Non-Goals:**

- CEO 視角現金流預測（未來 30/60/90 天預計開票金額曲線）
- 列管模組 升級路徑（業務備註欄、責任歸屬、逾期自動升級給主管 / 會計）
- 上游約束機制（急單溢價自動提示、客戶歷史售後頻率 banner）
- 售後服務單根因分類欄位 + 月度根因報表
- 業務拆分印件數量開多張發票 Scenario（屬發票模組擴充，下個 change）
- 列管模組 採用率成功 / 失敗指標（上線後量測階段定義 baseline 與 target）
- 列管模組 列表的匯出 CSV 功能（MVP 先不做，業務 / 會計實際使用後再評估）

## Decisions

### D1：兩個 列管模組 為主導覽獨立頁而非訂單列表的篩選視圖

兩個模組各自為一個 OpenSpec capability（`pending-receivables` / `pending-invoicing`），於 ERP 主導覽佔獨立入口。

**替代方案**：作為訂單列表的篩選視圖（在訂單管理模組底下加 tab）。

**選擇理由**：
- 業務日常工作流：早上開 ERP → 看「該追款哪些」「該開票哪些」是高頻動作
- 藏在訂單模組底下會降低使用率（業務需先點進訂單再切 tab）
- 會計批次列管時不只看訂單，還包括「整月應收 / 應開」
- 主導覽獨立頁有助於後期擴充為部門級 dashboard（如業務主管看部門待收）

**權衡**：兩個獨立頁多了兩個導覽入口，可能讓主導覽列變長。緩解：與既有訂單列表的「應收帳款帳齡篩選」共用底層查詢，不重複維護資料邏輯。

### D2：PaymentPlan 加 `expected_invoice_date` 欄位而非新建 InvoicePlan 實體

`PaymentPlan` 新增 `expected_invoice_date`（日期，選填）作為業務排程用欄位。發票實際開立仍透過 `PaymentInvoice` junction 自由組合 Payment ↔ Invoice。

**替代方案**：建 `InvoicePlan` 實體 + `InvoicePlan ↔ PaymentPlan` junction（一對多）。

**選擇理由**：
- 一張 Invoice 可合併多次 Payment（既有設計），業務開立 Invoice 時自由勾選對應 Payment / PaymentPlan
- `expected_invoice_date` 只服務於「待開發票模組的排序與提醒」，不需作為實體
- 新增 InvoicePlan 會引入「開立 Invoice 時要不要對 InvoicePlan？」的設計負擔
- 輕量設計，未來若需求升級（如自動排程開票、milestone billing）再考慮升級為 InvoicePlan

**權衡**：當業務想為一張 Invoice 規劃多個 PaymentPlan 期次的合併開立時，`expected_invoice_date` 需於每筆 PaymentPlan 各自填寫。緩解：UI 提供「批次設定多筆 PaymentPlan 為同一個預計開票日」的快捷操作。

未來若引入 milestone billing（如「打樣完成 → 開 30%」「大貨完成 → 開 70%」這種非固定期次），`expected_invoice_date` 設計需重新評估升級為 InvoicePlan 實體（OQ-2）。

### D3：應開金額公式引用三方對帳面板（不重複定義）

`pending-invoicing` 的「應開金額」SHALL 引用 [order-management spec § 三方對帳檢視面板](../../specs/order-management/spec.md) 的「應收總額 − 發票淨額」公式：

```
應開金額 = (∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount)
        − (∑ 開立 Invoice.total_amount − ∑ 已確認 SalesAllowance.|allowance_amount|)
```

**替代方案**：在 pending-invoicing capability 自定義公式（如 `Order.total_with_tax + ∑OrderAdjustment − Invoice 淨額`）。

**選擇理由**：
- 自定義公式會在「印件費或 OrderExtraCharge 變動但 derived 欄位尚未重算」的瞬間出現不一致
- 公式單一來源避免漂移（spec 維護成本 + 未來邏輯變更時的同步成本）
- 業務看到的應開金額與訂單詳情頁對帳檢視面板的「應收 − 發票淨額」差額完全一致，避免認知混淆

**權衡**：兩個 capability 跨檔案引用增加閱讀成本。緩解：在 pending-invoicing spec 明示引用句並附 [order-management spec](../../specs/order-management/spec.md) 連結。

### D4：列管模組 跳轉訂單詳情頁時 backend 重算應開金額

業務於 pending-invoicing 列項點擊「開立發票」按鈕跳轉至訂單詳情頁時，發票表單預填的應開金額 MUST 由訂單詳情頁 backend 重新計算，**不採用 列管模組 列表上展示的快取值**。

**替代方案**：跳轉時直接傳遞 列管模組 列表上的應開金額作為發票表單預填值。

**選擇理由**：
- 並發更新場景：業務 A 在 列管模組 列表停留時，業務 B 在訂單上執行 OrderAdjustment(+20K)，業務 A 點擊跳轉若用快取值會少開 20K
- backend 重算成本低（單筆訂單查詢，不影響整體效能）
- 確保「業務開立的 Invoice 金額」始終基於最新狀態，避免事後對帳發現少開

**權衡**：跳轉到訂單詳情頁時需多一個 API 呼叫（重算應開金額）。緩解：與訂單詳情頁本身的「對帳檢視面板」共用查詢，不額外增加負擔。

### D5：三角色三 view 權限矩陣

兩個 列管模組 模組的可見範圍 SHALL 依使用者角色三層區分：

| 角色 | 可見範圍 | 寫入權限 |
|------|---------|---------|
| 業務 / 諮詢 | 個人 view（依 Order.sales_id） | 無 |
| 業務主管 | 部門 view（自己部門所有業務） | 無 |
| 訂單管理人 / 會計 / Supervisor | 全公司 view | 無（會計於 pending-invoicing 連跳轉開立按鈕都隱藏） |

**替代方案**：所有角色都看全公司，由業務自行判斷哪些是自己的訂單。

**選擇理由**：
- 業務看自己負責的訂單比看全公司清單更聚焦，避免資訊量過大造成「重要的事被淹沒」
- 業務主管的部門 view 對應「主管想看部門業務狀況」的真實需求
- 會計與訂單管理人需要全公司視角做月結對帳
- 會計於 pending-invoicing 不能直接跳轉開票（依既有 user-roles spec「會計嘗試開立發票被擋」Requirement），保持發票開立入口單一

**權衡**：實作上需依角色篩選底層查詢（業務 / 業務主管的 view 需 join Order.sales_id 與部門資料）。緩解：使用既有 user-roles 的「業務 / 業務主管於訂單模組的資料可見範圍」邏輯，不另定義篩選規則。

### D6：兩 列管模組 為唯讀視圖，所有寫入操作於訂單詳情頁完成

兩個 列管模組 模組 SHALL 為唯讀視圖，業務 / 業務主管 SHALL NOT 可於本模組執行任何寫入操作（如修改 PaymentPlan、記錄 Payment、開立 Invoice）。所有寫入操作 SHALL 跳轉至訂單詳情頁完成。

**替代方案**：在 列管模組 列項提供 inline 編輯（如直接記錄 Payment、開立 Invoice）。

**選擇理由**：
- 維持寫入入口單一（訂單詳情頁是唯一寫入位置）
- 寫入操作通常需要訂單完整脈絡（如記錄 Payment 需確認對應 PaymentPlan、發票時序），列管模組 列表頁無法提供
- 未來新增其他寫入相關功能（如付款計畫變更觸發回審）時，邏輯只需在訂單詳情頁維護
- 業務認知清楚：「列表 = 看資訊」「訂單詳情頁 = 操作資料」

**權衡**：業務需多一次點擊跳轉至訂單詳情頁。緩解：跳轉時 UI 預設展開對應區塊（如待收款跳轉預設展開「款項與發票」區塊並聚焦對應 PaymentPlan），減少操作步驟。

## Risks / Trade-offs

- **採用率風險（核心）**：業務目前用 Excel + 個人記憶追款，引入新模組後是否真的會放棄 Excel 是最大風險。三視角審查指出「dunning workflow 的失敗模式是『沒人說不好但沒人在用』」 → Mitigation：上線後 30 / 60 天量測採用率（DAU、跳轉占比），若低於閾值需評估 UX 或回退至訂單列表 + 篩選器方案；採用率指標於上線前 30 天量測 baseline
- **PaymentPlan.expected_invoice_date 業務填寫意願**：業務嫌麻煩可能不填，導致待開發票模組排序退化為 scheduled_date → Mitigation：UI 標示「未指定預計開票日（依預定收款日）」明確區分；不強制必填
- **應開金額即時計算的並發風險**：業務 A 在 列管模組 列表停留時，業務 B 執行 OrderAdjustment 修改應收 → Mitigation：D4 跳轉訂單詳情頁時 backend 重算（不用快取）
- **跨 capability 公式引用**：pending-invoicing 引用 order-management 的應收 / 發票淨額公式 → Mitigation：spec 明示引用句並附連結；未來若公式異動需同步檢查兩 capability spec
- **角色篩選的部門資料源**：業務主管的「部門 view」需 join 部門資料 → Mitigation：使用既有 user-roles 的「業務 / 業務主管於訂單模組的資料可見範圍」邏輯
- **效能風險**：未來訂單量大時兩個列表頁可能變慢 → Mitigation：與訂單列表「應收帳款帳齡篩選」共用底層 derived field，加上 `expected_invoice_date` 索引；MVP 不需考慮，待真實量級再優化
- **三色警示閾值設定**：依 `overdue_days` 黃 / 紅警示閾值（< 30 黃、≥ 30 紅）為固定值 → 未來若需依客戶 / 帳務公司動態調整需開新 change
- **列管模組 工作流的「升級路徑」缺失**：列表只給看，不通知主管 / 會計，業務看了不動還是不動 → 屬 CEO 視角識別的根因問題，留 OQ 給未來 列管模組 強化 change

## Migration Plan

1. **依賴 change 完成**：[refactor-order-adjustment-and-cleanup change](../refactor-order-adjustment-and-cleanup/proposal.md) 須先歸檔，本 change 才能進入實作（依賴其 OrderAdjustment 雙身份與對帳警示觸發邏輯）
2. **Schema migration**：
   - `PaymentPlan` 加 `expected_invoice_date` 欄位（NULL 允許）
3. **後端 API**：
   - pending-receivables 查詢 API（依角色篩選 + 排序）
   - pending-invoicing 查詢 API（引用三方對帳面板公式）
   - pending-invoicing 跳轉時 backend 重算應開金額
4. **UI 上線**：
   - ERP 主導覽新增兩個獨立頁入口
   - PaymentPlan 編輯介面增加「預計開票日」欄位
   - 列管模組 列表頁（含三色警示、篩選、排序）
5. **Prototype 同步**：[sens-erp-prototype](https://github.com/Kawato-Miles/sens-erp-prototype) 對應頁面與資料 mock 補上
6. **採用率 baseline 量測**：上線前 30 天透過 ETL 腳本掃描既有訂單，計算「業務透過訂單列表搜尋追款的點擊熱圖」作為 baseline
7. **採用率上線後量測**：上線後 30 / 60 天量測採用指標（DAU、跳轉占比、追款動作觸發來源），低於閾值需評估 UX 改善或回退方案

**Rollback 策略**：
- UI 層可下架兩個獨立頁入口（不影響資料）
- `PaymentPlan.expected_invoice_date` 為新欄位，保留即可
- 若採用率長期低於閾值，可降級為訂單列表的篩選 tab（`receivables-filter` / `invoicing-filter`）

## Open Questions

- **OQ-1（採用率指標）**：列管模組 上線後 30 / 60 天的採用率成功 / 失敗指標應為何？建議：第 30 天「待收款模組業務 DAU ≥ 60%」「逾期 ≥ 30 天 PaymentPlan 點擊查看率 ≥ 80%」；第 60 天「業務追款動作從待收款模組跳轉的占比 ≥ 50%」。上線前 30 天量測 baseline，上線後對照 baseline 計算 delta。
- **OQ-2（升級路徑）**：未來若引入 milestone billing（如打樣 / 大貨分階段開票），是否需從 PaymentPlan 升級為獨立 InvoicePlan 實體？暫留 OQ。
- **OQ-3（UX 細節）**：列表項目是否要支援批次操作（如批次跳轉 / 批次設定預計開票日）？建議 MVP 不做，業務實際使用後評估。
- **OQ-4（UX 細節）**：三色警示閾值（< 30 黃、≥ 30 紅）是否要可配置？建議 MVP 為固定值，未來依使用反饋調整。
- **OQ-5（後期強化）**：列管模組 列表是否要支援匯出 CSV 給會計做月結對帳？建議 MVP 先不做，等業務 / 會計實際使用後評估需求強度。
- **OQ-6（後期強化）**：列管模組 升級路徑（業務備註欄、責任歸屬、逾期自動升級給主管 / 會計）是否需引入？屬 CEO 視角識別的根因問題（業務看了不動還是不動），留待未來 列管模組 強化 change。
- **OQ-7（後期強化）**：CEO 視角的「現金流預測 dashboard」（未來 30/60/90 天預計開票金額曲線）是否需要？建議拆獨立 change（管理層 dashboard），與本 change 的「業務工作流列表」分離。
