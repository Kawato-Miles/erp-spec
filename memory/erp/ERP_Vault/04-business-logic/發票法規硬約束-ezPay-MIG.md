---
type: business-logic
module:
  - order-management
  - after-sales-ticket
  - consultation-request
  - cross-module
business-domain:
  - billing-cash
related-spec: openspec/specs/order-management/spec.md
status: active
last-reviewed: 2026-05-28
---

# 發票法規硬約束（ezPay + 財政部 MIG）

> 跨模組「錢」相關背景知識：ezPay 電子發票 API + 財政部 MIG 法規硬約束。
> **必讀條件**：任何模組討論「開發票 / 作廢 / 折讓 / 退款 / 對帳」MUST 先讀本卡。
> 來源：[[../raw/2026-05-26-miles-upload-ezpay-invoice-api-spec]]（已 ingested，本卡為精練版）。
> 設計動機：原精練埋在 `order-management/spec.md` L2969+ 屬「單模組規格拍板」，但 ezPay / MIG 是跨模組外部硬約束（業務 / 諮詢 / 售後 / 會計都受影響），須獨立成 Vault know-how 卡。

## 一、外部硬約束來源

| 來源 | 文件 / 版本 | 適用範圍 |
|------|-----------|---------|
| **ezPay 電子發票** | 簡單行動支付股份有限公司「電子發票技術串接手冊」標準版 EZP_INVI_1.2.2（2024-04-22）| 開立 / 作廢 / 折讓 / 作廢折讓 / 查詢 |
| **財政部 MIG** | 電子發票整合服務平台 Message Implementation Guideline | ezPay 上游監管；每日 01:00 上傳前日資料、06:00 起回應 |
| **適用平台**：印刷業 ERP 訂單規劃時不可抵觸的外部規格（雙重來源 — 中華民國法規 + 第三方 API）|

**串接網址**：
- 測試：`https://cinv.ezpay.com.tw/Api/invoice_issue`
- 正式：`https://inv.ezpay.com.tw/Api/invoice_issue`

## 二、發票品項五欄硬約束（核心，影響所有開票邏輯）

來源：PDF pages 24-25, §4-(一)-3。**五欄全部必填**（單項或多項用 `|` 分隔）。

| 參數 | 中文 | 必填 | 型態 | 約束 / 行為 |
|------|------|------|------|------------|
| `ItemName` | 商品名稱 | V | Varchar(30) | 例 `商品一\|商品二` |
| `ItemCount` | 商品數量 | V | **Int(5)** | **純整數**，最大 99999；例 `1\|2` |
| `ItemUnit` | 商品單位 | V | Varchar(2) | **中文 2 字 / 英數 6 字**（如「個 / 件 / 本 / 張」）；例 `個\|本` |
| `ItemPrice` | 商品單價 | V | **Int(10)** | **純整數**。Category=B2B 為**未稅**金額；Category=B2C 為**含稅**金額；例 `200\|100` |
| `ItemAmt` | 商品小計 | V | Int(10) | 計算方式 = `ItemCount × ItemPrice`，**必須完全相等**才會通過 ezPay 檢核；例 `200\|200` |
| `ItemTaxType` | 商品課稅別 | （混合稅才必填）| Int(2) | 僅 TaxType=9（混合應稅與免稅或零稅率）時用，B2C 限定；1=應稅 / 2=零稅率 / 3=免稅 |

**平台檢核硬規則**（PDF page 19, §3-(四)-4）：
> 1. 「商品小計 = 商品數量 × 商品單價」（自動驗證）
> 2. 「發票金額 = 銷售額 + 稅額」（自動驗證）
>
> 兩條都是硬性，違反一律不開立。

## 三、B2B vs B2C 行為差異

| 欄位 | B2B（買受人營業人）| B2C（買受人個人）|
|------|-----------------|----------------|
| `Category` | B2B | B2C |
| `BuyerUBN`（統編）| 必填，純數字 8 碼 | 非必填 |
| `CarrierType / CarrierNum`（載具）| 不適用 | 0=手機條碼 / 1=自然人憑證 / 2=ezPay 載具 |
| `LoveCode`（捐贈碼）| 不適用 | 3-7 碼純數字；與 CarrierType **互斥**（兩擇一）|
| `PrintFlag`（列印旗標）| 必填 Y | 在無載具且無捐贈碼時必填 Y |
| `TaxType` | 1=應稅 / 2=零稅率 / 3=免稅 | + 9=混合（限 B2C）|
| `TaxRate`（稅率）| 應稅一般填 5 / 零稅率 / 免稅填 0 | 同 |
| **`ItemPrice` 語意** | **未稅**金額 | **含稅**金額 |

**設計啟示**：印刷業 ERP 報價 / 計價時 ItemPrice 在 B2B 與 B2C 場景需切換顯示（未稅 vs 含稅），UI 須提示。

## 四、作廢 / 折讓 / 字軌規則

來源：PDF §5-8。

### 4.1 作廢發票

- **時限**：限「奇數月 14 日前」可作廢前兩月開立的發票（例：7/14 前可作廢 5/1-6/30 開立的）
- **超過時限**：MUST 改走折讓單（SalesAllowance）流程，不可作廢
- **作廢原因**：填寫長度限制（中文 6 字 / 英文 20 字內，**藍新限制**）

### 4.2 折讓單（SalesAllowance）

- **建立後**可選「立即確認」或「先暫存待對方確認再確認」
- **確認後隔日**上傳財政部
- **作廢折讓**：確認折讓後若需作廢可執行，隔日上傳財政部

### 4.3 字軌規則

- 字軌期間：兩月為一期（如「1-2 月」「3-4 月」「5-6 月」「7-8 月」「9-10 月」「11-12 月」）
- 每期前 14 天可作廢前期發票
- 跨期 MUST 走折讓單流程

## 五、上傳時程

來源：PDF page 19。

| 時間 | 行為 |
|------|------|
| 每日 01:00 | ezPay 上傳前日 00:00-23:59 開立發票資料至財政部 |
| 每日 06:00 起 | 財政部回應上傳結果，ezPay 通知商家 |
| 折讓 / 作廢折讓 | 確認後隔日上傳 |

**設計啟示**：發票開立後不能立即作廢（隔日才上傳財政部，但 ezPay 自身已記錄）；對帳邏輯需考量「ezPay 已開」≠「財政部已收」的時間差。

## 六、印刷業實務 vs ezPay 規格衝突點

| 衝突點 | ezPay 規定 | 印刷業實務 | 處理方式（Miles 已確認）|
|--------|-----------|-----------|----------------------|
| **單價小數** | `ItemPrice` 限 Int（純整數）| DM 0.5 元/張、傳單 2.5 元/張常見 | 不換算；前端 lint 擋小數（業務自行調整為「批 / 式」計價）|
| **品項拆解** | 自由分項 | 多印件 + 多收費類型（製版 / 印刷 / 後加工 / 運費）| 業務 / 諮詢自由輸入，預設從訂單印件帶入但可改 |
| **數量上限** | `ItemCount` Int(5)=99999 | 超大量 DM / 名片可能爆 | 拆多項或改單位（如「千張」）|
| **單位字數** | 限中文 2 字 / 英數 6 字 | 「組合包裝」「特殊規格」太長 | 限 dropdown 強制合規（[[../../../openspec/specs/prototype-shared-ui/spec.md|prototype-shared-ui spec]] § 共用單位 LOV）|
| **退款方向** | 作廢 / 折讓兩種，不可「負額發票」| 想直接負額紀錄 | MUST 走折讓單流程 |

## 七、連帶實體關聯（連帶矩陣）

> 任何「開發票 / 退款 / 補收 / 折讓 / OA」異動 MUST 連帶檢查下列實體。

| 主動實體 | 連帶實體 | 影響規則 |
|---------|---------|---------|
| **Invoice 開立** | `InvoiceItem`（五欄）/ `PaymentInvoice` junction / `PlannedInvoice`（鏈式預填）| 五欄硬約束 + 鏈式預填規則 |
| **Invoice 作廢** | `SalesAllowance`（超過時限改折讓）/ `Payment`（退款 Payment 反向）| 作廢期限 14 天 + 超期走折讓 |
| **SalesAllowance 確認** | `Invoice`（折讓金額）/ `Payment.refundPaymentId`（退款 Payment 反向關聯）| 折讓單跨 Invoice / Payment 紀錄 |
| **Payment 退款（負值）** | `OrderAdjustment.adjustment_type=退款`（執行）/ `SalesAllowance`（金額對齊）/ `Invoice`（作廢或折讓）| OA 推進 + SalesAllowance 反向 |
| **OrderAdjustment 已執行** | `Payment`（綁退款 Payment 建立事件）/ `Invoice`（作廢或折讓）/ `SalesAllowance`（建立）| Payment 累計推進 OA |
| **PlannedInvoice 自動建** | `Order`（諮詢訂單）/ `Invoice`（一鍵開立沿用 items[]）| 鏈式預填 + 不自動開立發票 |
| **AfterSalesTicket 退款** | OA (responsibility=公司認賠 / 補退) / Payment / SalesAllowance | 跨售後 ticket 容器 |

**七實體連帶圖**：
- Payment ↔ OA / PaymentPlan / Invoice / SalesAllowance
- Invoice ↔ PlannedInvoice / PaymentInvoice junction / ezPay 約束 / SalesAllowance
- OA ↔ Payment / 補收 / 折讓 / 售後 / 訂單異動
- SalesAllowance ↔ Invoice / Payment（refund）
- AfterSalesTicket ↔ OA / PrintItem / Payment / Invoice

## 八、加密與安全（補充）

- 所有 PostData 用 AES-256-CBC 加密 + HashKey / HashIV
- 回應有 CheckCode 用 SHA256 驗證合法性
- **規劃啟示**：ERP 端不需深入加密細節，但需注意「ezPay 已開」≠「ezPay 已上傳財政部」≠「商家已收到回應」三個時點的對帳邏輯

## 九、來源

- 原始 raw 卡：[[../raw/2026-05-26-miles-upload-ezpay-invoice-api-spec]]（status=ingested，本卡為精練版）
- ezPay 規格文件：EZP_INVI_1.2.2（2024-04-22）
- 財政部 MIG 規範（透過 ezPay 文件轉述）
- 對應 OpenSpec change：`2026-05-26-align-invoice-line-items-to-ezpay-spec`（archive，已將部分內容寫入 order-management spec L2969+）
- Miles 第六輪反饋拍板：跨模組「錢」相關背景知識獨立成 Vault know-how 卡（不埋在 spec）

## 十、相關卡

- [[付款發票邏輯]]（13 業務情境索引）
- [[../05-entities/訂單]]（訂單實體 / Payment / Invoice / OrderAdjustment / SalesAllowance / PlannedInvoice 段）
- [[../05-entities/售後服務]]（OA-Payment 段）
- [[../03-roles/會計]]（對帳 / 發票開立角色）
- [[../03-roles/業務]]（款項追款）
- [[payment-invoice-scenarios]]（13 業務情境細節，同目錄）
- [[../00-meta/business-domain-taxonomy]] § L1.6 Billing & Cash
- [[../../../../openspec/specs/order-management/spec.md|order-management spec]] § 「發票品項符合 ezPay 與電子發票法規硬約束」（L2969+）
- [[../../../../openspec/specs/prototype-shared-ui/spec.md|prototype-shared-ui spec]] § 共用單位 LOV
