# 訂單付款發票重構 + 多帳務公司支援 — 技術設計

## Context

**現況問題**：

[openspec/specs/order-management/spec.md](../../specs/order-management/spec.md) 中 Order 表的付款發票欄位是平面化單筆設計（payment_status / payment_method / payment_detail / paid_at / invoice_unified_number），但 Requirement 文字（L115-139）已經宣稱支援多次付款、1-N 張發票、補收款，文字與資料模型嚴重脫節。

實務上業務 / 諮詢處理線下單付款時面對的情境：
- 多期付款（訂金 + 中期款 + 尾款）
- 發票時序自由（先開後付、後付先開、合併、拆分都會發生）
- 已開發票後客戶要求退印 → 折讓 + 退款
- 規格變更導致漲價 → 補收款
- 公司有兩個帳務主體，要對應藍新兩個 MerchantID_

現況 spec 的 `parent_order_id + is_supplemental`「補收款 = 子訂單」抽象，業務每次補收款都要在系統建一張子訂單，操作冗餘。

**約束**：
- Prototype 階段 Mockup 對接藍新 API 欄位，不做真實串接
- 不模擬國稅局申報期 / 跨期作廢限制
- UX 細節留待 [refactor-order-detail-to-hero-tab-layout](../refactor-order-detail-to-hero-tab-layout) 完成後再做
- 沿用 archive `2026-04-27-add-sales-manager-quote-approval` 的「核可後可解鎖、變更後重審」機制

**Stakeholders**：業務、諮詢、業務主管、會計（角色權責變更）、Miles（PM）、印務（不直接受影響但跨模組共用 Order 主訂單狀態機）

## 術語對照

實體識別碼依業界 ERP 標準保留英文（方便未來會計人員 / ERP 系統對接），但 spec 內文、UI 文案、業務討論一律使用中文。下列為對照表：

| 英文實體名 | 中文業務術語 | 法規依據 / 說明 |
|-----------|-------------|----------------|
| `BillingCompany` | 帳務公司 | 公司法人主體；本系統有兩家，各對應一個藍新（NewebPay / ezPay）商店帳號（MerchantID_）|
| `QuoteRequest` | 需求單 | 既有實體；本次新增 billing_company_id 必填欄位 |
| `Order` | 訂單 | 既有實體；本次新增 billing_company_id 並 deprecated 平面付款欄位 |
| `PaymentPlan` | 付款計畫期次 | 業務規劃的 N 期付款期程（如：訂金 30% / 尾款 70%） |
| `Payment` | 收款紀錄 | 實際入帳的收款 / 退款記錄（payment_method = 「退款」時 amount 為負）|
| `Invoice` | 統一發票 | 對應財政部統一發票，藍新平台開立 |
| `PaymentInvoice` | 收款 ↔ 發票對應 | M:N junction，記錄哪筆收款用哪張發票開 |
| `SalesAllowance` | **折讓單**（銷貨折讓證明單） | 依台灣[統一發票使用辦法第 20 條](https://law-out.mof.gov.tw/LawContent.aspx?id=GL011519)；發票已開後不能整張作廢時，附在原發票上的「部分減額憑證」，伴隨退款 |
| `OrderAdjustment` | 訂單異動 | 訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 其他原因導致的應收金額異動（取代「補收款 = 子訂單」抽象） |

「折讓單」實務應用：
- 業務情境：發票開立 100,000 後，客戶投訴 10,000 品質瑕疵 → 不能整張作廢（已交付 / 跨期），開折讓單 -10,000 抵扣，客戶申報時用發票 + 折讓單兩張一起算
- 不是發票，是發票的減額憑證
- 限負數，且累計金額 ≤ 原發票金額
- 一張發票可開多次折讓單，直到累計達到原發票金額（已完全折讓）

## Goals / Non-Goals

**Goals**：

1. 建立完整的付款 / 發票 / 折讓 / 訂單異動資料模型，取代平面欄位
2. 支援兩個帳務公司（兩個藍新 MerchantID_）獨立開立發票，需求單 / 訂單建立時就要選
3. 訂單異動（OrderAdjustment）獨立狀態機，不阻擋主訂單推進
4. Mockup 留存藍新對帳鍵，會計能在訂單詳情頁完成三方對帳（應收 = 發票淨額 = 收款淨額）
5. 補三個關鍵 user story：會計批次對帳、業務一鍵開發票、業務主管批次審核 OrderAdjustment

**Non-Goals**：

1. 不在範疇：訂單詳情頁 UX（hero tab refactor 後再做）
2. 不模擬：申報期 / 跨期作廢 / 載具中獎 / 紙本列印
3. 不串接：實際藍新 API、實際退款金流
4. 不遷移：歷史訂單既有資料維持平面欄位（除非後續另開遷移 change）
5. 不設計：發票作廢的二次審核機制（業務可單獨作廢）
6. 不設計：OrderAdjustment 已執行後的 PaymentPlan 自動重算（業務手動調整）
7. 不設計：發票「換開」捷徑（改買受人走作廢重開）

## Decisions

### D1：BillingCompany 為獨立實體，不綁 Customer

**選擇**：BillingCompany 獨立表；Customer 不綁定預設帳務公司；每張需求單 / 訂單建立時手動選 billing_company。

**為什麼不選 Customer 綁定 default**：客戶可能與兩家帳務公司都有業務（如部分透過製造主體開、部分透過商貿主體開），預設帶入會誤導，每張單獨立指定符合實務。

**為什麼不選 M:N 客戶 ↔ 帳務公司關聯表**：增加管理介面複雜度，但實際業務都是「每張單當下決定」，不需事前維護綁定關係。

**ezpay_merchant_id 唯一鍵**：BillingCompany 表上 ezpay_merchant_id 設唯一，避免兩家公司用同一個藍新商店代號（會違反藍新 MerchantOrderNo 不可重覆規則）。

### D2：MerchantOrderNo 編碼規則 + 複合唯一鍵

**選擇**：Invoice.ezpay_merchant_order_no 編碼為 `{order_no}-INV-{流水}`（限英數 + 底線、20 字元內），唯一性用複合鍵 `(billing_company_id, ezpay_merchant_order_no)`。

**為什麼**：
- 藍新規定 MerchantOrderNo 同一商店不可重覆 → 不同 BillingCompany 之間可重覆
- 一張訂單可能拆 N 張發票（合併 / 拆分 / 作廢重開），不能直接用 ERP `order_no`
- 用訂單編號做前綴，會計肉眼能對應到 ERP 訂單
- 流水起算 01，作廢的編號不重用（直接 +1，跟藍新字軌規則一致）

**為什麼不用 UUID**：藍新限制 20 字元，UUID 36 字元放不下；訂單編號通常 10-12 字元加 `-INV-NN` 後仍在 20 字元內。

### D3：Order 主訂單狀態機不變，OrderAdjustment 獨立狀態機

**選擇**：OrderAdjustment 有自己的狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消），主訂單流程不退回。

**為什麼**：
- 訂單可能已到「生產中」「出貨中」，金額異動不該阻擋這些狀態推進
- 主管審核 OrderAdjustment 時，業務應已預先告知客戶（單線溝通），不該卡主流程
- OrderAdjustment「已執行」時觸發應收金額更新，但不觸發主訂單狀態變化

**alternative 為什麼放棄**：把 OrderAdjustment 當訂單狀態的 sub-state（如「審核變更中」），會讓主狀態機變得複雜，且「異動」與「生產進度」是兩個正交軸線。

### D4：發票作廢業務可單獨執行（不加會計制衡）

**選擇**：業務 / 諮詢可單獨作廢發票，不需主管 / 會計核可。

**為什麼**：
- Miles 拍板：金額層次的把關放在 OrderAdjustment 主管審核（業務調動應收金額時主管會看到）
- 發票本身只要能符合藍新規則（同期未交付未申報），業務當下知道情境最快處理
- 加二次核可會拖慢日常作業，且會計事後仍可從對帳檢視面板抓異常

**已知風險**：會計部門可能反彈「業務權限過大」。緩解：在 user-roles spec 明文業務作廢需自填「作廢原因」並全程留痕（Activity log），會計批次查詢時能稽核。詳見 Risks 段。

### D5：OrderAdjustment 已執行後 PaymentPlan 不自動變動

**選擇**：OrderAdjustment「已執行」更新訂單應收總額後，PaymentPlan 不自動新增 / 修改期次；業務手動調整。

**為什麼**：
- 業務情境多元：加印的金額可能加到原末期、可能新開一期、可能客戶當場現付不入計畫
- 退印的金額可能扣未付期次、可能直接退已收款
- 自動規則無法涵蓋全部情境，反而造成業務需要每次手動撤銷自動行為
- 業務在訂單詳情頁可看到「應收總額 vs PaymentPlan 合計」差額，主動調整即可

### D6：改買受人走「作廢重開」路徑（不設計換開捷徑）

**選擇**：客戶要求改統編 / 改公司名等，業務作廢原發票，再開立新發票。不額外設計「換開」捷徑按鈕。

**為什麼**：
- 對應藍新 API 標準流程
- Prototype 階段保持實體最少，避免額外建模負擔
- 實務頻率不高，不值得多做動作

### D7：折讓不需主管審核

**選擇**：業務 / 諮詢可單獨開立折讓單，不需業務主管審核。

**為什麼**：
- Miles 拍板：折讓伴隨退款且金額有限制（不可超過原發票金額），藍新本身有限制
- 一致性考量退讓位給日常作業效率（與 D4 同理）

### D8：Mockup 字軌規則 + 不模擬申報期

**選擇**：

| 欄位 | Mockup 規則 | 範例 |
|------|------------|------|
| ezpay_invoice_trans_no | 17 碼時間戳格式（YYMMDD + 11 碼隨機） | 25050617583641325 |
| invoice_number | 兩碼大寫英文 + 8 碼數字遞增 | AB10000001 |
| random_num | 4 碼隨機數字 | 4253 |
| ezpay_allowance_no | "A" + 14 碼數字 | A25050611170500 |

**為什麼不模擬申報期**：
- 國稅局申報邏輯由藍新負責，ERP 不該重複實作
- 模擬申報期會引入「跨期不可作廢」「申報截止日」等規則，過度複雜化 Prototype
- 折讓本質就是「跨期或已申報的修正手段」，可作廢時走作廢、不可作廢時走折讓，由業務判斷或 UI 提示而非 ERP 強制

### D9：訂單異動分類型（OrderAdjustment.adjustment_type）

**選擇**：OrderAdjustment.adjustment_type 為單選列舉：規格變更 / 加印追加 / 退印 / 折扣 / 其他。

**為什麼**：
- 不同類型對應的後續動作不同（加印 → 開新發票；退印 → 折讓 + 退款）
- 分類後可在主管審核頁面分類顯示，主管批次審核時容易判斷
- 會計批次對帳時可分類統計
- 比起純文字 reason，類型更利於 KPI 與報表

### D10：Verification — 訂單詳情頁「對帳檢視面板」演示路徑

**選擇**：在訂單詳情頁右側設「對帳檢視」面板（非主流程 UI，只供會計 / 業務主管查閱），即時顯示三個總額 + 差額。

**Prototype 演示**：
```
┌──── 對帳檢視 ──────────────────┐
│ 訂單應收：120,000              │
│   = 訂單金額 100,000            │
│   + 訂單異動 +20,000            │
│                                │
│ 發票淨額：120,000              │
│   = 開立發票合計 130,000        │
│   - 已確認折讓 10,000           │
│                                │
│ 收款淨額：120,000              │
│   = 收款合計 130,000            │
│   - 退款 10,000                 │
│                                │
│ 三方差額：0  ← 對帳通過        │
└────────────────────────────────┘
```

差額 = 0 為通過；差額 ≠ 0 即為待對帳訂單。會計批次查詢頁可篩選「差額 ≠ 0」的訂單清單。

### D11：UX 細節不在範疇，但「對帳檢視面板」要做

**選擇**：訂單詳情頁的付款 / 發票 / 折讓 / 異動四個區塊 UX 留待 hero tab refactor 後做；但 D10 的「對帳檢視面板」要在本次 Prototype 做出來，否則 Verification 無法演示。

**為什麼**：對帳檢視是 Verification 的硬性要求；其他四個區塊只是資料呈現，可在 hero tab 重構時統一處理。

### D12：折讓與退款 Payment 分離（修正 OQ-1）

**選擇**：SalesAllowance（折讓單）SHALL NOT 自動建立 Payment 紀錄。實務流程改為：(1) 業務先記錄退款 Payment（Payment.payment_method = 「退款」，amount 為負數）；(2) 視情境決定走「開立折讓」（已開發票）或「作廢原發票重開」（適合作廢期內，配合 D6）。SalesAllowance.refund_payment_id 改為**業務手動關聯**（可空）。

**為什麼**：
- 業界（SAP / Oracle / NetSuite / Stripe）一致將 Credit Memo（折讓憑證）與 Refund（退款現金流）分離
- 折讓本身只是 AR 沖抵憑證，沒有現金流出；退款才是實際銀行扣款
- 自動建立會造成銀行對帳科目混亂、收款報表無法區分「實際現金流」與「沖抵」
- Miles 拍板：「實際操作上應該是先知道要退款，後續再依照內容處理折讓或作廢重開」

**對帳檢視面板分桶**：Payment 在面板上 SHALL 分兩桶顯示：
- 一般收款（payment_method ≠ 退款）：累計正項
- 退款（payment_method = 退款）：累計負項
- 收款淨額 = 一般收款 - |退款|

### D13：已完成訂單仍可建立 OrderAdjustment（售後服務情境）

**選擇**：訂單推進到「已完成」狀態後，業務 / 諮詢 SHALL 仍可建立 OrderAdjustment（典型情境：售後服務、客戶事後投訴需退款）。已完成訂單上的 OrderAdjustment 觸發應收總額更新後，對帳檢視面板 SHALL 顯示「歷史對帳需重新核對」banner，提示會計重新對帳並更新月結紀錄。

**為什麼**：
- Miles 拍板：「已完成可建議（建立），實務上就是售後服務，可能會有退款」
- 印刷業售後服務情境（品質投訴、補印）即使在訂單完成後仍會發生
- 強制不允許會逼業務開「補正訂單」繞遠路，與 OrderAdjustment 取代「補收款 = 子訂單」的初衷矛盾

**race condition 緩解**：
- 已完成訂單上執行 OrderAdjustment 後，系統 SHALL 在訂單詳情頁與對帳檢視面板顯示明顯 banner「歷史對帳需重新核對 — 訂單已於 [日期] 完成，異動於 [日期] 執行，請會計確認原月結紀錄」
- 不做「對帳鎖定 / 解鎖」狀態機（過度設計，會計人工確認即可）

### D14：應收帳款帳齡底層欄位（完整帳齡分析延後）

**選擇**：本次 Prototype 加應收帳款帳齡（AR aging）的底層欄位，不做完整的應收帳款帳齡分析（30/60/90 天分級報表）。

**底層欄位**：
- PaymentPlan 計算 derived field `overdue_days = TODAY - scheduled_date`（scheduled_date 為空時 overdue_days = NULL）
- 訂單列表 / 對帳檢視 加篩選欄位「最長逾期天數」（取訂單下所有未收 PaymentPlan 的 max(overdue_days)）

**為什麼**：
- ceo-reviewer 指出應收帳款帳齡是 CEO 最在乎的數字，現有 plan 完全缺席
- 完整帳齡分析（30/60/90 天分級 + 逾期通知 + 應收帳齡走勢）範疇過大，下一輪另開 change
- 底層欄位本次備齊避免下輪改表

**不做的部分**（延後另開 change）：
- 應收帳款帳齡分析表（30/60/90 天分級）
- 逾期自動通知業務
- 應收帳款帳齡走勢視覺化
- 應收帳款 Dashboard

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| **會計權責真空**：會計從操作者降為查詢者，業務可單獨開 / 廢 / 折讓發票，會計部門可能反彈 | (1) Activity log 全程留痕（誰、何時、為什麼）；(2) 會計批次對帳檢視可篩出異常訂單；(3) 依 D9 分類型方便會計分類稽核；(4) 後續若反彈再開二期 change 加「待會計確認」標記 |
| **業務調整 PaymentPlan 與應收總額不同步**：D5 不自動重算，業務可能漏調整 | 訂單詳情頁顯示「應收總額 vs PaymentPlan 未付期合計」差額提示，差額 ≠ 0 給黃色 banner |
| **發票作廢字軌不可重用，編號歪斜**：MerchantOrderNo 流水序號跳號（作廢 -01 後新開 -02 而非重用 -01） | 接受跳號（與藍新規則一致），會計理解；UI 顯示「歷次發票（含作廢）」清單，跳號可追溯 |
| **OrderAdjustment 與主訂單狀態並存可能造成「訂單已完成但異動未審核」尾巴** | 訂單推進到「已完成」狀態時，若仍有「待主管審核」OrderAdjustment，給 banner 提示但不阻擋；OrderAdjustment 可獨立完成 |
| **三方對帳邏輯計算複雜**：Invoice 含已作廢、SalesAllowance 含已作廢，計算時要排除 | 在 Prototype mock 計算函式內統一處理；status 過濾規則寫進 spec Requirement |
| **Mockup 假資料可能與真實藍新格式不一致**：Prototype 階段未串真實 API | 字軌規則嚴格按 D8，未來真實串接時直接替換生成函式即可 |

## Migration Plan

**新訂單適用，舊訂單維持平面欄位**：

1. 部署後新建立的需求單必須選 billing_company_id
2. 部署後新建立的訂單從需求單繼承 billing_company_id；舊訂單若無 billing_company_id 顯示「未指定」
3. 舊訂單上的 payment_status / payment_method / paid_at / invoice_unified_number 維持不動，UI 顯示「（舊資料）」標記，不允許用新流程操作（避免兩套並行造成資料不一致）
4. 補收款（parent_order_id + is_supplemental）已建立的子訂單維持，舊功能 deprecated 但可讀
5. 後續若要全面遷移，另開 `migrate-legacy-order-payment` change 處理

**Rollback 策略**：

OpenSpec change 階段可直接撤銷未歸檔；歸檔後若需 rollback，要另開反向 change（資料回填邏輯複雜不在本次設計範疇）。

## Open Questions

| OQ | 描述 | Reasonable Default |
|----|------|-------------------|
| OQ-1 | ~~SalesAllowance.refund_payment_id 是否 mock 一筆「退款 Payment」記錄？~~ | **已答（D12）**：折讓不自動建 Payment；業務先記錄退款 Payment（payment_method = 退款），再開立折讓單並手動關聯 refund_payment_id |
| OQ-2 | 兩家 BillingCompany 的預設值（is_default）由誰維護？需求單建立時若客戶沒指定，預設邏輯為何？ | is_default = true 那家為預設帶入；後台僅會計 / 系統管理員可設定；同時間僅一家 is_default = true |
| OQ-3 | 業務主管審核 OrderAdjustment 是否需要批次操作（如選 5 筆一次審）？ | Prototype 階段先做單筆審核；批次審核留待 user feedback 後另開 change |
| OQ-4 | 「應收金額 vs PaymentPlan 未付期合計」差額提示的閾值是多少？任何差額都提示，還是 > 1 元才提示？ | 差額 ≠ 0 即提示（包含 1 元誤差，避免漏網） |
| OQ-5 | OrderAdjustment「已執行」是否該觸發訂單詳情頁的活動紀錄事件？格式為何？ | 觸發 Activity log，格式：「[時間] [業務] 執行訂單異動 #ADJ-001（規格變更 +20,000）」 |
| OQ-6 | 接單公司（account_company：SSP / BRO / KAD / EC，4 家）與帳務公司（BillingCompany，2 家）的對應關係？是否要在系統內維護映射表（如：SSP → 帳務公司 A）？ | Prototype 階段不維護硬映射；需求單建立時兩個欄位獨立填寫；UI 提示「該接單公司近 30 天最常用的帳務公司」作為軟性引導；實際使用後若映射穩定再開 change 加映射表 |

以上 OQ 的 default 為 Prototype 階段建議值，實作時若有業務情境牴觸再回頭調整。
