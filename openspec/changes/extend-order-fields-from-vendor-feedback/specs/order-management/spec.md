## MODIFIED Requirements

### Requirement: 訂單確認觸發

系統 SHALL 支援訂單確認觸發，線下單採「OR 觸發」設計，任一觸發條件成立即推進：

- **線下單觸發條件 A（手動）**：業務於訂單詳情頁點擊「確認回簽」按鈕
- **線下單觸發條件 B（自動）**：業務於訂單詳情頁「回簽檔案上傳區」成功上傳至少一份回簽檔案（建立 OrderSignedFile 紀錄）
- **線上單（含客製單）**：付款完成自動觸發（Phase 2，由 EC 同步）

任一觸發成立時，系統 SHALL 寫入 `Order.signed_at` = 觸發時間並推進狀態。

Prototype 補強：原實作為每個訂單狀態配一個手動推進按鈕，與[狀態機 spec](../state-machines/spec.md) 不符。修正為 OrderDetail SHALL 僅提供「確認回簽」與「取消訂單」兩個人工操作按鈕；審稿段之後的狀態推進（稿件未上傳 → 等待審稿 → 製作等待中 → ... → 訂單完成）SHALL 由下層模組 bubble-up 驅動。

#### Scenario: 線下單業務手動確認

- **WHEN** 客戶印回簽後，業務在訂單頁面標記「已回簽」
- **THEN** 訂單狀態從草稿轉為已確認
- **AND** 系統 SHALL 寫入 `Order.signed_at` = 操作時間

#### Scenario: 線下單上傳回簽檔案自動推進

- **GIVEN** 訂單狀態 = 報價待回簽
- **WHEN** 業務於訂單詳情頁「回簽檔案上傳區」上傳檔案，系統 SHALL 建立 OrderSignedFile 紀錄
- **THEN** 系統 SHALL 自動推進訂單狀態（依「正常路徑」或「免審稿快速路徑」決定下個狀態）
- **AND** 系統 SHALL 寫入 `Order.signed_at` = 上傳完成時間
- **AND** ActivityLog MUST 記錄「上傳回簽檔案自動推進」與操作人

#### Scenario: US-ORD-001 回簽後訂單確認推進

- **WHEN** 客戶印回簽後，業務在訂單頁面手動點擊「標記回簽」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「訂單確認」；活動紀錄 MUST 記錄操作人、操作類型與時間戳

#### Scenario: 線下訂單確認回簽（正常路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」或上傳回簽檔案
- **AND** 訂單下有印件的 reviewStatus 不為「合格」且不為「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「稿件未上傳」

#### Scenario: 線下訂單確認回簽（免審稿快速路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」或上傳回簽檔案
- **AND** 訂單下所有印件的 reviewStatus 皆為「合格」或「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」直接推進至「製作等待中」，跳過「稿件未上傳」與「等待審稿」

#### Scenario: 審稿段之後無手動推進按鈕

- **WHEN** 訂單狀態為「稿件未上傳」或之後的任何狀態
- **THEN** OrderDetail 頁面 MUST NOT 顯示狀態推進按鈕
- **AND** 狀態推進 SHALL 等待下層模組（印件審稿、工單、出貨）的 bubble-up 觸發

---

### Requirement: 出貨單管理

系統 SHALL 支援分批出貨、訂單內多印件合併出貨，並實施木桶原則出貨防呆：出貨數 <= 印件層累計 QC 入庫數。出貨單 MUST 一對一綁定單一訂單；跨訂單同收件人的合併寄出由揀貨人員於出貨作業階段自行處理，系統不提供跨訂單合併出貨單的資料模型支援。

#### Scenario: 分批出貨

- **WHEN** 印件部分完成，業務建立第一批出貨單
- **THEN** 系統允許出貨數量不超過該印件已入庫數量，記錄累計已出貨量

#### Scenario: 出貨防呆攔截

- **WHEN** 出貨人員填入的出貨數量超過印件可出貨數量
- **THEN** 系統阻擋並提示「出貨數量不可超過可出貨數量（QC 入庫數 - 已出貨數）」

#### Scenario: 出貨單一對一綁訂單

- **WHEN** 業務或揀貨人員嘗試於同一出貨單加入跨訂單的印件
- **THEN** 系統 SHALL 阻擋並提示「出貨單僅可包含同一訂單的印件；跨訂單合併寄出請於揀貨作業時自行整批處理」

#### Scenario: US-SH-001 自行出貨完整流程

- **WHEN** 業務建立出貨單並選擇「自行出貨」方式，新增出貨明細
- **THEN** 出貨單 SHALL 依序推進狀態：備料打包完成 → 車輛出發出貨中 → 確認送達（已送達）；系統 MUST 支援同訂單合併出貨（多印件同一出貨單）及分批出貨（同印件多次出貨）

#### Scenario: US-SH-002 第三方物流出貨完整流程

- **WHEN** 業務建立出貨單並選擇「第三方物流」方式，完成備料打包後移交物流商
- **THEN** 系統 SHALL 透過 API 自動接收物流商狀態更新：運送中 → 已送達；物流異常時系統 MUST 通知業務介入處理

---

### Requirement: 付款計畫建立（PaymentPlan）

業務 / 諮詢 SHALL 於訂單成立後（狀態 = 報價待回簽 或 訂單確認）建立付款計畫，定義一個訂單分成 N 期收款的金額與時程。每筆 PaymentPlan 紀錄期別、描述、預定金額、預計收款日。

`PaymentPlan.scheduled_date` SHALL 為必填欄位，避免追款篩選遺漏。

建立時各期金額合計 MUST = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)；若不等系統 SHALL 顯示差額提示。

#### Scenario: 業務建立兩期付款計畫

- **GIVEN** 訂單成立後總額 100,000
- **WHEN** 業務建立 PaymentPlan 訂金 30,000、尾款 70,000，並各填入 scheduled_date
- **THEN** 系統 SHALL 建立兩筆 PaymentPlan 紀錄（installment_no = 1, 2）

#### Scenario: 付款計畫合計與應收總額不符的提示

- **WHEN** 業務建立 PaymentPlan 各期合計 ≠ Order.total_with_tax + ∑(OrderAdjustment.amount)
- **THEN** 系統 SHALL 顯示「差額 X 元」提示，仍允許儲存

#### Scenario: 缺漏 scheduled_date 無法儲存

- **WHEN** 業務建立 PaymentPlan 未填入 scheduled_date
- **THEN** 系統 SHALL 阻擋儲存並提示「預計收款日為必填」

---

## ADDED Requirements

### Requirement: 訂單聯絡人

訂單 SHALL 帶單一窗口聯絡人（`Order.contact_id` FK → 廠客模組聯絡人主檔）。線下單於成交轉訂單時自動帶入需求單指定的窗口聯絡人；線上單由 EC 帶入後不可編輯（廠客 / EC CRM 無連動）。

廠客模組的「公司抬頭統編 + 多窗口聯絡人」兩層結構不在訂單層複現，訂單僅指向其中一個窗口的 contact_id。

#### Scenario: 線下單成交轉訂單帶入聯絡人

- **GIVEN** 需求單 QR-001 已指定窗口聯絡人 contact_id = C-100
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 將 Order.contact_id 設為 C-100
- **AND** 訂單詳情頁 SHALL 顯示該聯絡人的姓名 / 電話 / Email

#### Scenario: 業務變更訂單聯絡人

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽、contact_id = C-100
- **WHEN** 業務於訂單詳情頁切換聯絡人至 C-101（同客戶下的另一窗口）
- **THEN** 系統 SHALL 更新 Order.contact_id = C-101
- **AND** ActivityLog MUST 記錄聯絡人變更（舊值 / 新值 / 操作人 / 時間）

#### Scenario: 線上單聯絡人不可編輯

- **GIVEN** 訂單為線上單（order_source ∈ {線上, 線上自定義}）
- **WHEN** 業務嘗試於訂單詳情頁切換聯絡人
- **THEN** 系統 SHALL 禁用聯絡人切換 UI（唯讀），原因提示「線上單聯絡資料由 EC 帶入，ERP 廠客與 EC CRM 未連動」

---

### Requirement: 訂單備註三類分欄

訂單 SHALL 將備註拆為三個獨立欄位：

| 欄位 | 適用 | 用途 |
|------|------|------|
| `customer_note` | 僅線上單 | EC 前台購物車客戶下單時填寫的備註 |
| `internal_note` | 線上 / 線下皆有 | 內部員工備註，客戶不可見 |
| `production_note` | 僅線下單 | 訂單製作備註（製作 / 交易 / 出貨備註的彙整） |

UI 上 SHALL 依 order_source 條件顯示適用欄位，避免業務混淆。

#### Scenario: 線上單顯示客戶端備註

- **WHEN** 訂單為線上單
- **THEN** 訂單詳情頁 SHALL 顯示 `customer_note`（唯讀，自 EC 帶入）與 `internal_note`（可編輯）
- **AND** MUST NOT 顯示 `production_note`

#### Scenario: 線下單顯示製作備註

- **WHEN** 訂單為線下單
- **THEN** 訂單詳情頁 SHALL 顯示 `internal_note`（可編輯）與 `production_note`（可編輯）
- **AND** MUST NOT 顯示 `customer_note`

#### Scenario: 內部備註客戶端不可見

- **WHEN** EC 前台或任何客戶端介面查詢訂單
- **THEN** 系統 MUST NOT 暴露 `internal_note` 內容

---

### Requirement: 訂單階段印件規格編輯時機

訂單階段的印件規格（`spec_note`）/ 購買數量（`pi_ordered_qty`）/ 單位（`unit`）/ 難易度（`difficulty_level`）/ 報價單價的可編輯性 SHALL 依 `Order.status` 區分兩階段：

**階段一：訂單已建立 → 報價待回簽 → 已回簽前（不含已回簽）**

業務 / 訂單管理人 SHALL 可直接編輯上述欄位，系統直接更新 PrintItem / OrderItem 對應值；ActivityLog MUST 記錄變更。

**階段二：已回簽（含後續所有狀態，已取消狀態除外）**

業務 SHALL NOT 直接編輯上述欄位；變更 SHALL 透過 OrderAdjustment 流程處理（依變更類型選用對應 adjustment_type：規格變更 / 數量追加 / 數量減少 / 補退）。OrderAdjustment 經業務主管核可並執行後，系統 SHALL 同步更新 PrintItem / OrderItem 欄位並建立補收 / 退款 Payment。

訂單狀態 = 已取消的訂單，所有印件欄位 MUST 為唯讀，不允許異動。

#### Scenario: 回簽前業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁修改 `spec_note` 與 `pi_ordered_qty`
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** ActivityLog MUST 記錄變更內容、操作人、時間

#### Scenario: 回簽後業務調整印件規格走 OrderAdjustment

- **GIVEN** 訂單 SO-001 狀態 = 製作中
- **WHEN** 業務於印件詳情頁點擊「編輯」
- **THEN** 系統 SHALL 將「編輯」按鈕改為「申請異動」並提示「訂單已進入製作階段，調整需走訂單異動流程」
- **AND** 業務點擊「申請異動」後系統 SHALL 建立 OrderAdjustment 草稿，預填變更類型與差額

#### Scenario: OrderAdjustment 執行後同步印件欄位

- **GIVEN** OrderAdjustment OA-001 狀態 = 已核可、明細包含「PrintItem PI-001 規格變更：500g 銅版紙 → 350g 雪銅」
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 系統 SHALL 同步更新 PrintItem PI-001.spec_note
- **AND** 若異動含金額差，系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）

#### Scenario: 已取消訂單印件唯讀

- **GIVEN** 訂單 SO-001 狀態 = 已取消
- **WHEN** 業務開啟印件詳情頁
- **THEN** 所有印件欄位 MUST 為唯讀
- **AND** 系統 MUST NOT 顯示「編輯」或「申請異動」按鈕

---

### Requirement: 訂單階段改派負責業務（轉單）

業務 / 訂單管理人 SHALL 可於訂單未進入製作階段（狀態 ∈ {草稿, 報價待回簽, 訂單確認, 稿件未上傳, 等待審稿, 待補件}）變更 `Order.sales_id`，支援業務間轉單。

進入製作階段（狀態 = 製作等待中或之後）後，僅 Supervisor 角色 SHALL 可變更 sales_id；一般業務 / 訂單管理人 MUST 不可變更。

#### Scenario: 業務轉單給同事

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽、sales_id = U-100
- **WHEN** 業務於訂單詳情頁點擊「改派負責業務」並選擇 U-200
- **THEN** 系統 SHALL 更新 Order.sales_id = U-200
- **AND** ActivityLog MUST 記錄改派紀錄（舊值 / 新值 / 操作人 / 時間 / 原因，原因為選填）

#### Scenario: 製作階段後一般業務不可改派

- **GIVEN** 訂單 SO-001 狀態 = 製作中
- **WHEN** 一般業務嘗試於訂單詳情頁改派 sales_id
- **THEN** 系統 SHALL 禁用改派 UI 並提示「訂單已進入製作階段，請聯絡 Supervisor 改派」

#### Scenario: Supervisor 製作階段強制改派

- **GIVEN** 訂單 SO-001 狀態 = 製作中
- **WHEN** Supervisor 於訂單詳情頁改派 sales_id
- **THEN** 系統 SHALL 允許更新並記錄 ActivityLog

---

### Requirement: 雙欄計價輸入與顯示

訂單 SHALL 採雙欄計價，所有金額欄位（subtotal、other_fee、shipping_fee、consult_fee、discount、total）同時儲存 `_with_tax` 與 `_without_tax` 兩個值，並於 `Order.tax_amount` 記錄總稅額。

**輸入規則：**

- 線下訂單（order_source = 線下）：業務於需求單 / 訂單階段輸入**未稅金額**，系統依稅率（預設 5%）反推含稅；雙欄同步寫入。
- 線上訂單（order_source ∈ {線上, 線上自定義}）：EC 帶入**含稅金額**，系統反推未稅；雙欄同步寫入。

**顯示規則：**

- 訂單詳情頁金額區 SHALL 依 `order_source` 決定主顯欄位：線下顯示未稅為主、含稅為輔；線上顯示含稅為主、未稅為輔。
- 列表 / 報表查詢 SHALL 支援以任一基準篩選與排序。

**計算公式（稅率 r，預設 r = 0.05）：**

```
with_tax = round(without_tax × (1 + r))
without_tax = round(with_tax / (1 + r))
tax_amount = total_with_tax − total_without_tax
```

rounding 採整數（小數 0 位，與會計慣例一致）。

退款 / 折讓 / OrderAdjustment 金額 SHALL 沿用雙欄結構；實際收款 Payment.amount 不拆雙欄（含稅實收即為入帳金額）。

#### Scenario: 線下單業務輸入未稅金額

- **GIVEN** 業務於需求單成交轉訂單，需求單商品小計（未稅）= 100,000
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_without_tax = 100,000
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_with_tax = 105,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 5,000（總額層級）

#### Scenario: 線上單 EC 帶入含稅金額

- **GIVEN** EC 商品成交金額（含稅）= 5,250
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_with_tax = 5,250
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_without_tax = 5,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 250（總額層級）

#### Scenario: 訂單詳情頁線下單顯示

- **WHEN** 業務開啟線下單詳情頁
- **THEN** 金額區 SHALL 以未稅金額為主顯（粗體 / 大字）
- **AND** 含稅金額 SHALL 顯示為輔（小字）
- **AND** tax_amount SHALL 獨立一行顯示

#### Scenario: 訂單詳情頁線上單顯示

- **WHEN** 業務開啟線上單詳情頁
- **THEN** 金額區 SHALL 以含稅金額為主顯
- **AND** 未稅金額 SHALL 顯示為輔
- **AND** tax_amount SHALL 獨立一行顯示

#### Scenario: 雙欄寫入失敗的一致性保護

- **WHEN** 系統寫入金額時其中一欄寫入失敗
- **THEN** 系統 MUST rollback 整筆寫入並回報錯誤
- **AND** 訂單金額狀態 MUST 保持寫入前一致

---

### Requirement: 訂單類型 enum 範圍

`Order.order_type` SHALL 僅採以下 enum 值：

- `一般`：線下 / 線上一般訂單，需處理印件與出貨
- `諮詢`：諮詢訂單（不需印製，詳見 [consultation-request spec](../consultation-request/spec.md)）
- `點數`：EC 會員儲值訂單

月結訂單（EC 月結單）/ 訂閱制訂單不在 Phase 1 / 2 / 3 範圍。

`Order.order_source` SHALL 採以下 enum 值：`線下` / `線上` / `線上自定義`。

#### Scenario: 系統拒絕不在 enum 內的訂單類型

- **WHEN** 任何來源（API / Prototype / 資料遷移）嘗試建立 order_type = `月結` 或 `訂閱` 的訂單
- **THEN** 系統 SHALL 拒絕並回報「訂單類型不在 Phase 1 / 2 / 3 範圍」

---

### Requirement: 印件單位與難易度於訂單階段可編輯

`PrintItem.unit` 與 `PrintItem.difficulty_level` 於訂單階段 SHALL 為「自動帶入（可編輯）」：

- 線下單：自需求單繼承
- 線上單：自 EC 商品主檔繼承
- 業務於訂單階段（依本 spec § 訂單階段印件規格編輯時機規範）SHALL 可手動覆寫
- 覆寫 SHALL 記錄於 ActivityLog（舊值 / 新值 / 操作人 / 時間）

#### Scenario: 業務調整印件單位

- **GIVEN** 印件 PI-001 自需求單帶入 unit = 「冊」、訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁將 unit 改為 「式」
- **THEN** 系統 SHALL 更新 PrintItem.unit = 「式」
- **AND** ActivityLog MUST 記錄變更

#### Scenario: 業務調整印件難易度

- **GIVEN** 印件 PI-001 自需求單帶入 difficulty_level = 5、訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁將 difficulty_level 改為 7
- **THEN** 系統 SHALL 更新 PrintItem.difficulty_level = 7
- **AND** ActivityLog MUST 記錄變更（包含繼承來源值 5 與新值 7）

---

### Requirement: Invoice Data Model 與 ezpay 連結

訂單發票 SHALL 透過藍新（NewebPay / ezPay）電子發票平台開立。Invoice 子實體欄位定義如下（資料模型詳見本 spec § Data Model）：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `category` | Y | 發票種類：B2B / B2C |
| `buyer_name` | Y | 買受人名稱 |
| `buyer_ubn` | Y（B2B）| 買方統一編號（B2C 留空）|
| `buyer_address` | N | 買受人地址 |
| `buyer_email` | N | 發票寄送信箱 |
| `carrier_type` | N | 載具類別（B2C 適用）|
| `carrier_num` | N | 載具編號 |
| `tax_type` | Y | 課稅別：應稅 / 零稅率 / 免稅 |
| `tax_rate` | Y（auto）| 稅率，依 tax_type 自動帶入 |
| `sales_amount` | Y（auto）| 銷售額（未稅，自動計算）|
| `tax_amount` | Y（auto）| 稅額（自動計算）|
| `total_amount` | Y | 發票金額（含稅），業務可微調 |
| `items` | Y | 商品明細，自訂單印件帶入可編輯 |
| `comment` | N | 發票備註 |
| `status` | Y | 開立 / 作廢 |
| `invoice_number` | Y（藍新回傳）| 財政部核發的發票號碼 |
| `invalid_reason` | Y（作廢時）| 作廢原因，限中文 6 字或英文 20 字 |
| `ezpay_invoice_url` | Y（derived）| 藍新平台單張發票的連結 URL，呼叫藍新 API 取得，業務可從訂單詳情頁直接開啟下載 PDF |
| `folded` | Y（derived）| 此張發票已確認折讓的金額合計（∑ 已確認折讓單金額絕對值，排除已作廢）|
| `remaining` | Y（derived）| 此張發票尚可開立折讓的金額上限（= 發票金額 − 折讓累計）|
| `allowance_label` | Y（derived）| 折讓衍生標示，依折讓累計即時計算 |

Invoice MUST NOT 包含 `print_flag`（索取紙本）欄位；客戶 SHALL 統一至 ezpay 自行下載 PDF；業務若需代客寄信 / 列印，從 `ezpay_invoice_url` 開啟。

#### Scenario: 業務從訂單詳情頁開啟 ezpay 發票連結

- **GIVEN** 訂單 SO-001 已開立發票 INV-001、藍新已回傳 invoice_number
- **WHEN** 業務於訂單詳情頁的發票區點擊「下載發票」
- **THEN** 系統 SHALL 呼叫藍新 API 取得 `ezpay_invoice_url`
- **AND** 系統 SHALL 於新分頁開啟連結，供業務下載 PDF 或寄送客戶

#### Scenario: 客戶端不暴露索取紙本選項

- **WHEN** 任何客戶端介面（EC 前台、訂單確認 email、客戶查詢頁）顯示發票
- **THEN** 系統 MUST NOT 提供「索取紙本」選項
- **AND** SHALL 提供 ezpay 平台連結供客戶自行下載

---

### Requirement: SalesAllowanceFile 折讓回簽附件

每筆 SalesAllowance SHALL 支援多檔回簽檔案上傳，透過子表 `SalesAllowanceFile` 儲存。檔案用途包含：用印折讓單 PDF、客戶端折讓證明、其他補充文件。

`SalesAllowanceFile` 欄位：

| 欄位 | 型別 | 必填 | 唯讀 | 說明 |
|------|------|------|------|------|
| id | UUID | Y | Y | 主鍵 |
| sales_allowance_id | FK | Y | Y | FK → SalesAllowance |
| filename | 字串 | Y | | |
| file_url | 字串 | Y | Y | |
| file_size_kb | 整數 | Y | Y | |
| file_type | 字串 | Y | | MIME type（如 application/pdf, image/jpeg）|
| uploaded_by | FK | Y | Y | FK → 使用者 |
| uploaded_at | 日期時間 | Y | Y | |

業務 SHALL 可於折讓單詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次上傳 / 刪除動作。

#### Scenario: 業務上傳折讓單回簽檔

- **GIVEN** SalesAllowance SA-001 狀態 = 已確認、折讓金額 = -3,000
- **WHEN** 業務於折讓單詳情頁上傳「用印折讓單.pdf」
- **THEN** 系統 SHALL 建立 SalesAllowanceFile 紀錄
- **AND** 折讓單詳情頁 SHALL 顯示已上傳的檔案清單
- **AND** ActivityLog MUST 記錄上傳

#### Scenario: 業務上傳多份回簽檔案

- **GIVEN** SalesAllowance SA-001 已上傳「用印折讓單.pdf」
- **WHEN** 業務再上傳「客戶折讓證明.jpg」
- **THEN** 系統 SHALL 建立第二筆 SalesAllowanceFile 紀錄
- **AND** 兩筆檔案 SHALL 並列顯示

---

### Requirement: PaymentFile 收款對帳附件

每筆 Payment SHALL 支援多檔對帳檔案上傳，透過子表 `PaymentFile` 儲存。檔案用途包含：對帳截圖、收據照片、匯款信 PDF、第三方付款證明。

`PaymentFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `payment_id`）。

業務 SHALL 可於收款記錄詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次動作。

#### Scenario: 業務上傳收款對帳截圖

- **GIVEN** Payment P-001 狀態 = 已收訖、金額 = 30,000
- **WHEN** 業務上傳「銀行對帳截圖.png」
- **THEN** 系統 SHALL 建立 PaymentFile 紀錄
- **AND** 收款記錄 SHALL 顯示已上傳的檔案清單

---

### Requirement: OrderSignedFile 訂單回簽附件

每筆訂單 SHALL 支援多檔回簽檔案上傳，透過子表 `OrderSignedFile` 儲存。檔案用途為客戶印 / 簽名後回傳的報價 / 訂單確認文件。

`OrderSignedFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `order_id`）。

上傳至少一份 OrderSignedFile SHALL 觸發訂單狀態自動推進（詳見 § 訂單確認觸發），並寫入 `Order.signed_at` = 第一份上傳完成時間。

#### Scenario: 業務上傳回簽檔案觸發狀態推進

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽、無 OrderSignedFile
- **WHEN** 業務上傳「客戶回簽報價單.pdf」
- **THEN** 系統 SHALL 建立 OrderSignedFile 紀錄
- **AND** 系統 SHALL 推進訂單狀態（依正常 / 免審稿快速路徑）
- **AND** 系統 SHALL 寫入 Order.signed_at = 上傳完成時間

#### Scenario: 已回簽訂單追加上傳檔案

- **GIVEN** 訂單 SO-001 狀態 = 製作中、已有 OrderSignedFile
- **WHEN** 業務再上傳補充回簽文件
- **THEN** 系統 SHALL 建立新 OrderSignedFile 紀錄
- **AND** 訂單狀態 MUST NOT 變更（避免向後推進）
- **AND** Order.signed_at MUST NOT 覆寫

---

### Requirement: 內部製作截止日定義

`Order.internal_complete_date` 定義為內部出貨端寄出日期，預設值為 `delivery_date − 1 day`（客戶預計收件日的前一天）。

業務或印務 SHALL 可手動覆寫此預設值；ActivityLog MUST 記錄覆寫紀錄。

棄用欄位提示：原「工單印件完成時間」（位於工單層）已棄用，不再作為內部完工日期判斷依據；統一以本欄位作為印務與出貨溝通的時間基準。

#### Scenario: 系統依交期推算內部製作截止日

- **GIVEN** 訂單 SO-001 delivery_date = 2026-06-10、internal_complete_date 為空
- **WHEN** 業務儲存訂單
- **THEN** 系統 SHALL 自動寫入 Order.internal_complete_date = 2026-06-09

#### Scenario: 業務手動覆寫內部製作截止日

- **GIVEN** 訂單 SO-001 系統預設 internal_complete_date = 2026-06-09
- **WHEN** 業務手動改為 2026-06-08
- **THEN** 系統 SHALL 更新 Order.internal_complete_date = 2026-06-08
- **AND** ActivityLog MUST 記錄覆寫（系統預設值 / 業務覆寫值 / 操作人 / 時間）

---

### Requirement: 訂單金額 Data Model 雙欄擴充

Order Data Model 金額相關欄位 SHALL 同時包含 `_with_tax` 與 `_without_tax` 兩個基準的儲存：

| 業務語義 | 含稅欄位（既有保留）| 未稅欄位（新增）|
|---------|-------------------|----------------|
| 商品小計 | `subtotal_with_tax` | `subtotal_without_tax` |
| 其他費用小計 | `other_fee_with_tax` | `other_fee_without_tax` |
| 運費 | `shipping_fee_with_tax` | `shipping_fee_without_tax` |
| 諮詢費 | `consult_fee_with_tax` | `consult_fee_without_tax` |
| 折扣金額 | `discount_amount`（含稅）| `discount_without_tax` |
| 訂單總額 | `total_with_tax` | `total_without_tax` |
| 稅額 | — | `tax_amount`（= total_with_tax − total_without_tax）|

新增欄位 type 為 Decimal(12,2)，必填，預設 0；既有 `_with_tax` 欄位定義不變更。

OrderAdjustment.amount 與 OrderExtraCharge.amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

SalesAllowance.allowance_amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

Payment.amount 不拆雙欄（實際收款金額為含稅實收）。

#### Scenario: 既有訂單未稅欄位回填

- **GIVEN** 既有 Order 資料的 `_with_tax` 欄位有值、`_without_tax` 欄位為空
- **WHEN** 資料遷移腳本執行
- **THEN** 系統 SHALL 計算 `_without_tax = round(_with_tax / 1.05)` 並寫入
- **AND** 系統 SHALL 計算 `tax_amount = total_with_tax − total_without_tax` 並寫入
