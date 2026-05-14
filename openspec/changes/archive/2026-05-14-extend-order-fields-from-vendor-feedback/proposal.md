## Why

2026-05-08 印務需求單位於 [訂單模組 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567) 留下 26 條欄位備註，反映現行 ERP 設計與線下實務的差距。其中最大缺口是線下單以未稅計價（公司營業額統計基礎）、線上單以含稅計價（EC 零售概念），目前 spec 的金額欄位全部以含稅為單一基準，無法支撐線下對帳；其餘缺口包括聯絡人結構、備註分類、印件規格 / 數量 / 報價於訂單階段的編輯時機、發票 ezpay 連結、折讓 / 收款多檔附件、預計收款日必填等。

此輪調整為線下訂單從 Ragic 遷移至 ERP 的最後一公里，未在 Phase 2 / 3 之前收斂會造成上線後立即需返工。

## What Changes

**訂單主表（Order）**
- 新增 `contact_id` FK → 廠客聯絡人（訂單只帶單一窗口聯絡人）
- 拆 `notes` 為 `customer_note`（線上專）／`internal_note`（共有）／`production_note`（線下專）三欄
- 補 `internal_complete_date` 定義（= 客戶預計收件日 − 1 day，即出貨端寄出日）
- **BREAKING** 金額欄位改雙欄計價：新增 `subtotal_without_tax` / `other_fee_without_tax` / `shipping_fee_without_tax` / `consult_fee_without_tax` / `discount_without_tax` / `total_without_tax` + `tax_amount`；既有 `_with_tax` 欄位保留；輸入端依 `order_source` 切換主欄，寫入時兩值同步
- 補 `sales_id` 可編輯規則（訂單未進入製作前允許業務 / 訂單管理人改派，支援轉單）

**印件（PrintItem）**
- `unit` 由「自動帶入」改為「自動帶入（可編輯）」，訂單階段業務可調整
- `difficulty_level` 訂單階段允許手動覆寫（保留繼承來源紀錄）

**付款計畫（PaymentPlan）**
- `scheduled_date` 改為必填，避免追款篩選遺漏

**發票（Invoice）**
- 補完整 Data Model（spec 目前缺）
- 新增 derived 欄位 `ezpay_invoice_url`（藍新平台單張發票連結）
- 不收 `print_flag`（預設不索取紙本，客戶自行下載）

**收款 / 折讓附件（新子表）**
- 新增 `SalesAllowanceFile` 子表（折讓單回簽檔，多檔上傳）
- 新增 `PaymentFile` 子表（對帳檔案，多檔上傳）

**Requirement 新增 / 修改**
- 線下單上傳回簽檔案後自動推進訂單狀態為「已回簽」
- 訂單階段印件規格 / 數量 / 報價編輯時機（回簽前自由改、回簽後走 OrderAdjustment 補收 / 退款）
- 訂單階段允許改派負責業務（轉單情境）
- 出貨單一對一綁訂單；跨訂單同收件人由揀貨員工自行合併寄出，不做資料模型支援
- 訂單類型 enum 維持「一般 / 諮詢 / 點數」，月結 / 訂閱制不在 Phase 1 / 2 / 3 範圍

**Prototype 同步**
- `sens-erp-prototype` Order mock data 補雙欄計價值
- Order UI 依 `order_source` 切換主欄顯示（線下顯示未稅、線上顯示含稅）

**新 Open Question（同步 Notion Follow-up DB）**
- 線上單 case_name 自動生成規則（線下單由業務於需求單填寫已收斂，線上端規則待後續討論）

## Capabilities

### New Capabilities
（無，本次為既有 capability 的擴充）

### Modified Capabilities
- `order-management`: Order / PrintItem / PaymentPlan / Invoice / SalesAllowance / Payment Data Model 擴充；新增雙欄計價、回簽自動推進、訂單階段印件編輯時機、轉單、出貨綁訂單等 Requirement
- `state-machines`: 線下訂單狀態機補「上傳回簽檔案 → 已回簽」自動推進路徑（不變更狀態總集，僅補一條 transition）

## Impact

**Code / Data**
- Order schema 新增 7 個欄位（contact_id + 6 個 _without_tax 欄位 + tax_amount）
- Order schema 變動 1 欄位（notes 拆三欄，需資料遷移腳本）
- PrintItem schema 不變更欄位定義，調整 unit / difficulty_level 編輯權限
- PaymentPlan.scheduled_date constraint 改 NOT NULL（需檢查既有資料）
- Invoice Data Model 首次完整定義
- 新增 SalesAllowanceFile / PaymentFile 兩張表

**Specs**
- `openspec/specs/order-management/spec.md`：Data Model 與多條 Requirement
- `openspec/specs/state-machines/spec.md`：訂單狀態機 transition 補一條

**Prototype**
- `sens-erp-prototype/src/data/orders.ts`（或對應 mock 檔）：雙欄計價值
- Order 詳情頁金額區塊：依 order_source 切換顯示主欄
- 補 contact_id 顯示欄位
- 補 notes 三欄位

**Notion**
- 訂單模組 BRD 在歸檔時同步更新（拆 notes、雙欄計價、Invoice Data Model 等）
- Follow-up DB 新增 1 OQ（線上單 case_name 規則）
- 收尾時將本次解答的討論串在 Notion 標 resolved

**Dependencies**
- 依賴 `add-after-sales-ticket` 與 `extend-invoice-issuance-flexibility` 兩個進行中 change 是否影響 Invoice / OrderAdjustment 設計，需於三視角審查階段確認是否有衝突
