## ADDED Requirements

### Requirement: 一般收款列表編輯入口

業務 / 諮詢 SHALL 可於訂單詳情頁 `OrderPaymentSection` 收款紀錄列表的每一 row 操作欄上找到單一「編輯」按鈕；點擊後系統 SHALL 開啟 `PaymentEditDialog`（重用與 OA 編輯介面內 Payment Edit 一致的 `PaymentEditPanel` 共用元件），業務於 dialog 內 SHALL 可補對帳附件、實際完成日（paidAt）、切換 paymentStatus（處理中 ↔ 已完成）並通過 UI / store 雙重驗證。

阻擋規則沿用 store 既有設計（已完成 → 處理中 反向 SHALL NOT 通過、需走「取消 → 重建」）、UI 層 SHALL 在 dialog 內即時提示「請改用『取消』功能後重建新 Payment」。

**設計理由**：原 change `add-payment-status-and-decouple-oa-execution` 於 store action 層完成 paymentStatus 雙態邏輯，但 OrderPaymentSection 列表 row 操作欄完全無編輯按鈕，業務若先建處理中 Payment 後無 UI 入口可補齊資料切已完成，核心 user story「客戶說已匯但對帳未到、先填一半再補齊」UI 走不通。

#### Scenario: 業務先填一半再補齊資料切已完成（UI 走通）

- **GIVEN** 業務於訂單詳情頁建一筆處理中 Payment P-009（amount = +30000, paymentStatus = '處理中', paidAt = null, attachments = []）
- **WHEN** 業務於收款紀錄列表 P-009 row 操作欄點「編輯」按鈕
- **THEN** 系統 SHALL 開啟 PaymentEditDialog 載入 P-009 當前資料
- **WHEN** 業務補入 paidAt = 2026-05-25、上傳對帳單.pdf、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-009.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000

#### Scenario: 編輯 dialog 阻擋已完成 → 處理中反向切換

- **GIVEN** Payment P-010 paymentStatus = '已完成'
- **WHEN** 業務於收款列表 P-010 row 點「編輯」、嘗試切 paymentStatus → '處理中'、點擊「儲存」
- **THEN** 系統 SHALL 在 dialog 內即時顯示驗證錯誤「已完成 Payment 不可改回處理中，請改用『取消』功能後重建新 Payment」
- **AND** 系統 SHALL NOT 寫入變更
- **AND** P-010.paymentStatus SHALL 維持 '已完成'

#### Scenario: OrderPaymentSection 與 OA 編輯介面共用 PaymentEditPanel

- **GIVEN** PaymentEditPanel 共用元件已從 OrderAdjustmentEditDialog 抽出至獨立檔
- **WHEN** 業務分別於（a）OrderPaymentSection 列表 row 點「編輯」、（b）OA 編輯 dialog 內 Payment row 點「編輯」
- **THEN** 兩處 dialog 載入內容 SHALL 一致（同一 PaymentEditPanel 元件）
- **AND** 驗證邏輯、UI 行為、阻擋規則皆完全相同

### Requirement: 退款 Payment 切已完成顯示銷貨折讓弱提示（二者並存）

退款型 Payment（paymentMethod = '退款'）切「已完成」事件後，系統 SHALL 顯示非阻擋式弱提示「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance（銷貨折讓）」，提示位置採二者並存：

1. **PaymentEditDialog inline banner**：切已完成成功後在 dialog 內顯示 banner，提供「我知道了（關閉提示）」與「前往 Invoice 詳情頁建 SalesAllowance」兩個 action button
2. **訂單詳情頁對帳面板下方 sticky 提示**：訂單詳情頁載入時若該訂單存在「至少一筆未取消已完成退款 Payment 且訂單對應 Invoice 累計 - 已確認 SalesAllowance 累計 > 退款 Payment 累計絕對值」（即有發票尚未折讓對應）→ SHALL 顯示 sticky 提示，提供「前往建 SalesAllowance」action button

弱提示 SHALL NOT 阻擋業務任何操作、僅提供建議行動。對應 SalesAllowance 建立後 sticky 提示 SHALL 自動消失。

**設計理由**：兩處提示時序互補：dialog inline 處理即時情境（業務注意力在 dialog 內、看到 banner 立即決定下一步）、sticky 處理「業務當下沒空、離開 dialog 後忘了」情境（刷新訂單詳情頁仍能看到）。對應 SalesAllowance 建立後 sticky 消失避免重複嘮叨。

#### Scenario: 業務切退款 Payment 已完成 PaymentEditDialog inline banner

- **GIVEN** 退款 Payment P-011（amount = -5000, paymentStatus = '處理中'）
- **WHEN** 業務於 OA 編輯介面內點 P-011「編輯」、補資料、切 paymentStatus → '已完成'、點擊「儲存」並成功通過驗證
- **THEN** PaymentEditDialog SHALL 顯示 inline banner「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance」
- **AND** banner SHALL 提供「我知道了」「前往 Invoice 詳情頁」兩個按鈕
- **AND** banner SHALL NOT 阻擋業務關閉 dialog 或其他操作

#### Scenario: 訂單詳情頁對帳面板 sticky 提示出現

- **GIVEN** 訂單已開立 Invoice 累計 = 1000、SalesAllowance 累計 = 0
- **AND** 該訂單已有未取消已完成退款 Payment 累計 = -500
- **WHEN** 業務刷新訂單詳情頁
- **THEN** 對帳面板下方 SHALL 顯示 sticky 提示「此訂單有已完成退款 -500 元、但 Invoice 累計尚未折讓對應」
- **AND** sticky 提示 SHALL 提供「前往建 SalesAllowance」action button

#### Scenario: 對應 SalesAllowance 建立後 sticky 提示消失

- **GIVEN** 訂單已完成退款 -500、後續建 SalesAllowance -500 已確認
- **WHEN** 業務刷新訂單詳情頁
- **THEN** sticky 提示 SHALL NOT 再顯示（已折讓對應）
- **AND** 對帳面板維持顯示對帳數字 + 處理中 / 已完成 breakdown

#### Scenario: 補收 Payment 切已完成不顯示弱提示

- **GIVEN** 補收 Payment P-012（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中'）
- **WHEN** 業務於 OA 編輯介面內切 P-012 paymentStatus → '已完成'
- **THEN** PaymentEditDialog SHALL NOT 顯示銷貨折讓弱提示（補收非退款情境不需折讓）

### Requirement: 處理中 Payment 老化追蹤

Payment 滿足以下條件時系統 SHALL 視為「老化處理中 Payment」：

- `paymentStatus = '處理中'`
- `cancelled = false`
- `createdAt < now - 7 天`（依自然日計算，閾值 resolve [[ORD-021-處理中Payment老化追蹤機制]]）

老化判定後系統 SHALL：

1. **訂單詳情頁 row 視覺標示**：OrderPaymentSection 收款紀錄列表 row 顯示 amber Badge「老化 N 天」，N = `floor((now - createdAt) / 86400000)`
2. **業務主管 sidebar 入口**：新增「老化處理中 Payment」清單頁入口（業務主管 / 諮詢主管 / supervisor role 可見），列出全公司所有符合老化條件的 Payment
3. **清單頁欄位**：訂單編號 / 業務負責人 / 處理中天數 / 金額 / paymentMethod / 對應 OA 連結（若有）/ 「跳轉訂單詳情頁」action

老化閾值 7 天為初版固定值，未來累積 KPI「處理中 Payment 老化率」UAT 數據後可調整。

**設計理由**：原 change 引入 paymentStatus 雙態後，業務先建處理中 Payment 屬於「實際金流尚未發生、待確認」的中間態。若無老化追蹤、業務忘了補齊資料 → Payment 永遠停留處理中 → 對帳數字虛胖（應收找不到對應已完成 Payment）。7 天閾值對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期。

#### Scenario: 處理中 Payment 超過 7 天顯示老化 Badge

- **GIVEN** Payment P-013 createdAt = now - 8 天、paymentStatus = '處理中'、cancelled = false
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** P-013 row SHALL 顯示 amber Badge「老化 8 天」

#### Scenario: 處理中未滿 7 天不顯示老化 Badge

- **GIVEN** Payment P-014 createdAt = now - 5 天、paymentStatus = '處理中'
- **WHEN** 業務刷新訂單詳情頁
- **THEN** P-014 row SHALL NOT 顯示老化 Badge（未達閾值）

#### Scenario: 業務主管查看老化處理中 Payment 清單

- **GIVEN** 公司內有 3 筆 createdAt > 7 天的處理中 Payment 分屬 3 個訂單
- **WHEN** 業務主管點擊 sidebar「老化處理中 Payment」
- **THEN** 系統 SHALL 顯示 3 row（含訂單編號 / 業務負責人 / 處理中天數 / 金額 / paymentMethod / 對應 OA 連結）
- **AND** 主管點 row 的「跳轉訂單詳情頁」action SHALL 跳轉至對應訂單詳情頁、滾動到 OrderPaymentSection

#### Scenario: 已取消 Payment 不列入老化追蹤

- **GIVEN** Payment P-015 createdAt = now - 10 天、paymentStatus = '處理中'、cancelled = true
- **WHEN** 老化追蹤掃描
- **THEN** P-015 SHALL NOT 顯示老化 Badge（cancelled 排除）
- **AND** P-015 SHALL NOT 出現於老化清單頁

### Requirement: 處理中 Payment 不入會計帳本（GL 邊界規範）

處理中 Payment SHALL NOT 影響 General Ledger 應收應付帳本：

- 處理中 Payment 僅在訂單詳情頁三方對帳面板顯示為「處理中（合計）」資訊軸（既有實作沿用）
- 已完成才入 GL 應收應付帳本
- 對帳面板「處理中（合計）」軸下方 SHALL 補註「不入 GL 應收應付帳本」說明文字 + hover tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

當前 Prototype 階段無正式 GL 系統，本規範作為未來導入 GL 時的入帳邊界規範（resolve [[ORD-019-會計處理中Payment應收應付處理]]）。

**設計理由**：會計準則要求應收應付認列須有「實際交易發生」事實依據（對帳附件）。處理中 Payment 屬於業務預登記、未有事實依據，不應入 GL 避免月結 / 季結報表虛胖。雙重保護：對帳面板顯示處理中合計（業務 / 會計可見、便於追蹤）+ GL 不入帳。

#### Scenario: 對帳面板處理中合計軸顯示「不入 GL」說明

- **WHEN** 業務 / 會計開啟訂單詳情頁對帳面板
- **THEN**「處理中（合計）」軸下方 SHALL 顯示說明文字「不入 GL 應收應付帳本」
- **AND** 業務 / 會計 hover 該說明 SHALL 顯示 tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

#### Scenario: 處理中 Payment 不影響應收應付推導

- **GIVEN** 訂單應收 30000、已完成 Payment 累計 20000、處理中 Payment 累計 10000
- **WHEN** 系統推導 Order.payment_status（既有設計、僅累計已完成 Payment）
- **THEN** Order.payment_status 推導 SHALL 僅計入已完成 20000、處理中 10000 不入
- **AND** 對帳面板「應收應付差額」計算 SHALL 不含處理中金額

### Requirement: Payment 邏輯刪除（取消已完成 Payment 保留稽核軌跡）

Payment Data Model SHALL 新增以下三個欄位：

| 欄位 | 類型 | 必填 | 預設 | 說明 |
|------|------|------|------|------|
| cancelled | boolean | 必填 | false | 是否已取消（邏輯刪除旗標）|
| cancelReason | string | 選填 | '' | 取消原因（cancelled = true 時 SHALL 為非空字串）|
| cancelledAt | string \| null | nullable | null | 取消時點（cancelled = true 時必填 ISO 8601 timestamp）|

`cancelPayment(paymentId, options)` action 行為依 paymentStatus 分支：

- **paymentStatus = '處理中'**：直接從 `Order.payments` 陣列刪除（物理刪除、無稽核需求）
- **paymentStatus = '已完成'**：邏輯刪除（設 `cancelled = true`、`cancelReason`、`cancelledAt = now`），SHALL NOT 從陣列移除；同時觸發 OA 回退邏輯（若關聯 OA 已執行且累計重算不再達 OA.amount，OA 回退至 '已核可'、executedAt = null）

`calcOACompletedPaymentsTotal` 與對帳面板收款淨額計算 SHALL 排除 `cancelled = true` 的 Payment。

訂單詳情頁 OrderPaymentSection 列表 SHALL 預設隱藏 `cancelled = true` 的 Payment，提供「顯示已取消」toggle 切換可見性；已取消 row 顯示時 SHALL 標示 grey Badge「已取消」+ cancelReason hover tooltip。

既有 mock data SHALL backfill `cancelled = false`、`cancelReason = ''`、`cancelledAt = null`（一次性 migration）。

（resolve [[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]）

**設計理由**：已完成 Payment 代表「實際金流已發生且對帳已過」，物理刪除會造成稽核軌跡缺失（無法回查「為什麼這筆 Payment 不見了」）。處理中 Payment 屬於「業務預登記未實際發生」，刪除等同放棄此登記、無稽核需求。雙態分支符合「實際發生事件不可抹除」會計準則。

#### Scenario: 取消處理中 Payment 直接物理刪除

- **GIVEN** Payment P-016 paymentStatus = '處理中'、Order.payments 含 P-016
- **WHEN** 業務於 OA 編輯介面內點 P-016「取消」、確認
- **THEN** 系統 SHALL 從 Order.payments 陣列移除 P-016（物理刪除）
- **AND** Order.payments SHALL NOT 含 P-016

#### Scenario: 取消已完成 Payment 邏輯刪除保留稽核軌跡 + OA 回退

- **GIVEN** Payment P-017 paymentStatus = '已完成'、amount = -5000、linkedOrderAdjustmentId = OA-001
- **AND** OA-001.status = '已執行'、amount = -5000
- **AND** Order.payments 含 P-017
- **WHEN** 業務於 OA 編輯介面內點 P-017「取消」、填入 cancelReason = '對帳資料填錯'、確認
- **THEN** 系統 SHALL 設 P-017.cancelled = true、cancelReason = '對帳資料填錯'、cancelledAt = now
- **AND** Order.payments SHALL 仍含 P-017（邏輯刪除、不從陣列移除）
- **AND** 系統 SHALL 重算 OA-001 對應未取消已完成 Payment 累計 = 0（P-017 排除）≠ OA-001.amount
- **AND** OA-001.status SHALL 回退至 '已核可'、executedAt = null

#### Scenario: 已取消 Payment 預設隱藏 + toggle 顯示

- **GIVEN** Order.payments 含 P-017（cancelled = true）+ P-018（cancelled = false）
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** 列表 SHALL 僅顯示 P-018（預設隱藏已取消）
- **WHEN** 業務點「顯示已取消」toggle 切換為顯示
- **THEN** 列表 SHALL 同時顯示 P-017（含 grey Badge「已取消」+ cancelReason hover tooltip）

#### Scenario: 對帳收款淨額排除已取消 Payment

- **GIVEN** Order.payments 含 P-017（cancelled = true、amount = +5000、paymentStatus = '已完成'）+ P-018（cancelled = false、amount = +3000、paymentStatus = '已完成'）
- **WHEN** 業務開啟對帳面板
- **THEN** 收款淨額 SHALL = 3000（僅計入未取消 + 已完成）
- **AND** 已完成一般收款 breakdown SHALL = 3000

#### Scenario: 取消已完成 Payment 但累計仍達 OA.amount 維持已執行

- **GIVEN** OA-002 amount = -10000、status = '已執行'
- **AND** 關聯已完成 Payment P-019（amount = -5000）+ P-020（amount = -5000）
- **WHEN** 業務取消 P-019、填入 cancelReason、確認
- **THEN** P-019.cancelled SHALL = true
- **AND** 重算 OA-002 累計（排除 cancelled）= -5000 ≠ OA-002.amount
- **AND** OA-002.status SHALL 回退至 '已核可'、executedAt = null

#### Scenario: cancelReason 必填驗證

- **GIVEN** Payment P-021 paymentStatus = '已完成'
- **WHEN** 業務點 P-021「取消」、未填 cancelReason 直接點「確認」
- **THEN** 系統 SHALL 顯示驗證錯誤「取消原因為必填」
- **AND** 系統 SHALL NOT 寫入 cancelled = true
- **AND** P-021 維持 paymentStatus = '已完成'、cancelled = false
