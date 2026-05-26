---
type: raw
status: ingested
created-at: 2026-05-26
ingested-at: 2026-05-26
ingested-via: openspec-change-archive
source: miles-upload
captured-by: claude-on-task
module:
  - cross-module
  - order-management
topic-tag:
  - external-spec
  - legal-binding
  - invoice
  - ezpay-api
  - tax-regulation
related-vault:
  - "[[../05-entities/README]]"
  - "[[../04-business-logic/README]]"
raw-source-link: |
  Miles 本地上傳：/Users/b-f-03-029/Downloads/EZP_INVI_1_2_2.pdf
  ezPay（簡單行動支付股份有限公司）電子發票技術串接手冊，文件版本 EZP_INVI_1.2.2，2024-04-22 發布
  原始檔已搬：_attachments/EZP_INVI_1.2.2.pdf
attached-files:
  - "_attachments/EZP_INVI_1.2.2.pdf"
---

# ezPay 電子發票 API 規格 v1.2.2（外部硬性約束）

## 原始素材

### 來源與定位

- **平台**：ezPay 電子發票加值服務平台（簡單行動支付股份有限公司）
- **文件**：電子發票技術串接手冊，標準版，EZP_INVI_1.2.2，2024-04-22
- **適用範圍**：開立、作廢、折讓、作廢折讓、查詢發票
- **法規源頭**：財政部電子發票整合服務平台 MIG（Message Implementation Guideline）規範。ezPay 是商用代理層，往上對接財政部，每日 01:00 上傳前日 00:00-23:59 發票資料，06:00 起回應上傳結果（PDF page 19）
- **印刷業 ERP 定位**：訂單規劃時不可抵觸的外部規格（雙重來源 — 中華民國法規 + 第三方 API）

### 串接網址（pages 20）

- 測試：`https://cinv.ezpay.com.tw/Api/invoice_issue`
- 正式：`https://inv.ezpay.com.tw/Api/invoice_issue`

### 開立發票三種方式（page 7-8）

| Status | 名稱 | 行為 |
|--------|------|------|
| 1 | 即時開立 | 傳參數後立即開立 |
| 0 | 等待觸發 | 暫存，待 `invoice_touch_issue` 觸發 |
| 3 | 預約自動開立 | 帶 `CreateStatusTime` 預計開立日期，到日自動開立 |

### 發票品項陣列（PDF pages 24-25，§4-(一)-3）

**五欄全部必填**（單項或多項，多項用 `|` 分隔）：

| 參數 | 中文 | 必填 | 型態 | 約束 / 行為 |
|------|------|------|------|------------|
| `ItemName` | 商品名稱 | V | Varchar(30) | 例 `商品一\|商品二` |
| `ItemCount` | 商品數量 | V | **Int(5)** | **純整數**，最大 99999；例 `1\|2` |
| `ItemUnit` | 商品單位 | V | Varchar(2) | **中文 2 字 / 英數 6 字**（如「個 / 件 / 本 / 張」）；例 `個\|本` |
| `ItemPrice` | 商品單價 | V | **Int(10)** | **純整數**。Category=B2B 為**未稅**金額；Category=B2C 為**含稅**金額；例 `200\|100` |
| `ItemAmt` | 商品小計 | V | Int(10) | 計算方式 = `ItemCount × ItemPrice`，**必須完全相等**才會通過 ezPay 檢核；例 `200\|200` |
| `ItemTaxType` | 商品課稅別 | （混合稅才必填）| Int(2) | 僅 TaxType=9（混合應稅與免稅或零稅率）時用，B2C 限定；1=應稅 / 2=零稅率 / 3=免稅 |

### 平台檢核規則（page 19，§3-(四)-4）

> 本平台系統開立發票金額計算僅檢核：
> 1. 「商品小計 = 商品數量 × 商品單價」
> 2. 「發票金額 = 銷售額 + 稅額」

兩條都是硬性，違反一律不開立。

### 其他相關欄位（B2B vs B2C 行為差異）

- **Category**：B2B（買受人為營業人）/ B2C（買受人為個人）
- **BuyerUBN**：B2B 必填純數字 8 碼；B2C 非必填
- **CarrierType / CarrierNum**：僅 B2C 適用（0=手機條碼 / 1=自然人憑證 / 2=ezPay 載具）
- **LoveCode**：捐贈碼，3-7 碼純數字，僅 B2C 適用；與 CarrierType 互斥
- **PrintFlag**：B2B 必填 Y；B2C 在無載具且無捐贈碼時必填 Y
- **TaxType**：1=應稅 / 2=零稅率 / 3=免稅 / 9=混合（限 B2C）
- **TaxRate**：應稅一般填 5，特種稅率帶規定值（不含 %）；零稅率、免稅填 0

### 作廢、折讓、查詢（PDF §5-8）

- **作廢發票**：限「奇數月 14 日前」可作廢前兩月開立的發票（例：7/14 前可作廢 5/1-6/30 開立的）
- **折讓**：開立後可選「立即確認」或「先暫存待對方確認再確認」；確認後隔日上傳財政部
- **作廢折讓**：確認折讓後若需作廢可執行，隔日上傳財政部
- **查詢**：兩種方式 — 回傳參數對應 / 平台網頁顯示

### 加密與安全（附件一二）

- 所有 PostData 用 AES-256-CBC 加密 + HashKey / HashIV
- 回應有 CheckCode 用 SHA256 驗證合法性

---

## 第一輪初步分析（Claude 寫）

### 觀察與既有 vault 的關聯

1. **既有 vault 完全沒有 invoice capability 卡**
   - `05-entities/` 沒有 invoice 實體卡
   - `04-business-logic/` 沒有「電子發票品項硬約束」/「ezPay 對接規約」這類業務邏輯卡
   - OpenSpec 內 `order-management/spec.md` 有 Invoice 實體 + `items: JSON` 但未展開欄位

2. **Prototype 資料模型已對齊 ezPay 但 UI 未對齊**
   - `src/types/invoice.ts:31` 已有 `name / count / unit / unitPrice / itemAmount` 五欄
   - `OrderInvoiceSection.tsx` 開立發票 Dialog（L1518-1599）品項輸入只有「名稱」+「金額」，缺 count / unit / unitPrice 三輸入
   - 推測：實際存的 count / unit / unitPrice 用了預設值（如 count=1、unit='式'、unitPrice=itemAmount），會違反「ItemCount × ItemPrice = ItemAmt」檢核

3. **PlannedInvoice 結構與 Invoice 不對稱**
   - `src/types/plannedInvoice.ts` 目前 PlannedInvoice 只有單 `description + scheduledAmount`，**沒有 items[]**
   - 但 Invoice 已有 items[]
   - Miles 設計意圖：訂單印件 → PlannedInvoice items → Invoice items 鏈式帶入，現況斷在 PlannedInvoice 層

4. **需求單單位欄位可作為發票單位下拉參考**
   - `quote-request/spec.md:569` 單位 LOV：張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批
   - 9 個選項全為 1 中文字，符合 ezPay 限 2 字約束
   - 但缺「式」（雜支用）、「組」、「令」（印刷常見計重單位）— 未來可能要擴充共用 LOV

### 印刷業實務 vs ezPay 規格的衝突點

| 衝突 | ezPay 規定 | 印刷業實務 | 處理方式（Miles 已確認） |
|------|-----------|-----------|----------------------|
| 單價小數 | ItemPrice 限 Int | DM 0.5 元/張、傳單 2.5 元/張常見 | 不換算，前端 lint 擋小數（業務自行調整為「批 / 式」計價） |
| 品項拆解 | 自由分項 | 多印件 + 多收費類型（製版 / 印刷 / 後加工 / 運費） | 業務 / 諮詢自由輸入，預設從訂單印件帶入但可改 |
| 數量上限 | ItemCount Int(5)=99999 | 超大量 DM / 名片可能爆 | 拆多項或改單位（如「千張」） |
| 單位字數 | 限中文 2 字 / 英數 6 字 | 「組合包裝」「特殊規格」太長 | 限 dropdown 強制合規 |

### 候選相關卡

- 既有：無 invoice 實體卡或業務邏輯卡，這張 raw 卡精練後會產生新 vault 卡（不是更新既有）
- 連動：[[../05-entities/order]]（若有）、[[../04-business-logic/billing-logic]]（若有）— 待 mode B 時建立 wiki link

### 候選 OQ 候補

- 無新 OQ（Miles 已在本次討論回答 A-F 六個關鍵問題，沒有殘留不確定項）

### 候選升級路徑

1. **04-business-logic/electronic-invoice-mandatory-rules.md**（新建）— 電子發票品項硬性約束 + 法規依據
2. **05-entities/invoice.md**（新建）— Invoice + InvoiceItem 實體 + 與 PlannedInvoice / Order / PrintItem 關聯
3. **OpenSpec change `align-invoice-line-items-to-ezpay-spec`**（新建）— Prototype 與 spec 同步補三欄 + PlannedInvoice 結構升級
4. 不升級為 12-insights（單一主題不適合 insight 卡）

---

## 待精練（Mode B 處理）

- [ ] 升級為 04-business-logic 新卡：「電子發票品項五欄硬性約束」
- [ ] 升級為 05-entities 新卡：「Invoice + InvoiceItem 實體 + 與 PrintItem / PlannedInvoice 關聯」
- [ ] 是否升級為 OQ：**否**（Miles 已決策）
- [ ] 是否累積成 insight：**否**（單議題）
- [ ] OpenSpec change 提案：`align-invoice-line-items-to-ezpay-spec`

## 精練去處（Mode B 完成後填）

2026-05-26 透過 OpenSpec change `align-invoice-line-items-to-ezpay-spec` archive 完成（非 vault-ingest mode B）：

- [[../../../openspec/changes/archive/2026-05-26-align-invoice-line-items-to-ezpay-spec/proposal.md|change proposal]] — Why / What / Capabilities / Impact 完整
- [[../../../openspec/changes/archive/2026-05-26-align-invoice-line-items-to-ezpay-spec/design.md|change design]] — D1-D6 設計決策（五欄結構照搬 / 跨模組共用 LOV / Category-aware label / 鏈式預填無連動 / mock backfill / Requirement 拆分）
- [[../../../openspec/specs/order-management/spec.md|order-management spec]] § 「發票品項符合 ezPay 與電子發票法規硬約束」+ §「PlannedInvoice 品項鏈式預填」+ Data Model「InvoiceItem」「PlannedInvoice」
- [[../../../openspec/specs/prototype-shared-ui/spec.md|prototype-shared-ui spec]] §「共用單位 LOV」
- [[../../../openspec/specs/quote-request/spec.md|quote-request spec]] §「需求單印件單位來自共用 LOV」+ MODIFIED QuoteRequestItem.unit Data Model
- Prototype 實作：[`src/types/shared.ts`](../../../../sens-erp-prototype/src/types/shared.ts) `UNIT_OPTIONS` + [`src/components/shared/UnitSelect.tsx`](../../../../sens-erp-prototype/src/components/shared/UnitSelect.tsx) + [`src/components/shared/InvoiceItemTable.tsx`](../../../../sens-erp-prototype/src/components/shared/InvoiceItemTable.tsx) + [`src/utils/invoiceItemPrefill.ts`](../../../../sens-erp-prototype/src/utils/invoiceItemPrefill.ts)

未升級為獨立 vault 卡（單一外部規格不需重複收錄；spec 已是內部正本，raw 卡保留作為法規 / API 規格的原始出處與歷史證據）。
