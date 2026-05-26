## 1. 型別層：共用 UnitOption 與資料模型升級

- [x] 1.1 新增 `src/types/shared.ts`（或 `src/types/unitOption.ts`）匯出 `UnitOption` 型別，內容為 11 項 const tuple：`['張', '本', '冊', '份', '個', '卷', '盒', '套', '批', '式', '組'] as const`
- [x] 1.2 匯出 `UNIT_OPTIONS` 陣列常數（順序為事實正本）+ 工具 `isUnitOption(v: string): v is UnitOption`
- [x] 1.3 修 `src/types/invoice.ts`：`InvoiceItem.unit` 型別從 `string` 改為 `UnitOption`（既有 InvoiceItem 介面其他欄位保持不變）
- [x] 1.4 修 `src/types/plannedInvoice.ts`：
  - 加 `items: InvoiceItem[]` 欄位
  - `scheduledAmount` 改為 derived（保留欄位但加 JSDoc 標明 = `sum(items.map(i => i.itemAmount))`）
  - 加 helper `calcScheduledAmount(items: InvoiceItem[]): number`
- [x] 1.5 修 `src/types/quote.ts` / `src/types/order.ts` 中 `unit` 欄位型別（從 `string | null` 改為 `UnitOption | null`）

## 2. 共用 UI 元件：UnitSelect dropdown

- [x] 2.1 新增 `src/components/shared/UnitSelect.tsx`，基於 shadcn/ui `Select` 元件，items 來自 `UNIT_OPTIONS`
- [x] 2.2 元件 API：`{ value: UnitOption | undefined, onChange: (v: UnitOption) => void, placeholder?: string, disabled?: boolean, className?: string }`
- [ ] 2.3 寫元件 stories / smoke 測試：渲染 11 項、選擇後 onChange 被呼叫、disabled 時不可互動（task 8 一起以 e2e 驗證取代 unit story）

## 3. 開立發票 Dialog 三欄改造

- [x] 3.1 修 `src/components/order/OrderInvoiceSection.tsx` 開立發票 Dialog 的品項列（L1518-1599 範圍）：
  - 從 2 欄（name + 金額）改為 4 欄（name + count + unit + unitPrice + itemAmount disabled 顯示）
  - count 用 number input + 整數驗證（min=1, max=99999, step=1）
  - unit 用 `<UnitSelect>` 元件
  - unitPrice 用 number input + 整數驗證（step=1，禁小數）
  - itemAmount 自動計算 = count × unitPrice，input disabled 樣式
- [x] 3.2 unitPrice 欄位 label 依 `category` 切換：B2B 顯示「單價（未稅）」/ B2C 顯示「單價（含稅）」
- [x] 3.3 表單驗證：五欄全部必填 + count 整數 + unitPrice 整數 + 「count × unitPrice = itemAmount」自動成立
- [x] 3.4 業務嘗試輸入小數時顯示具體錯誤訊息（如「單價必須為正整數；如為小數計價建議改用較大單位」）
- [x] 3.5 業務嘗試輸入 count > 99999 時顯示「數量上限 99999；超量請拆分多筆品項或改用更大單位」
- [x] 3.6 「新增品項」/「移除品項」按鈕保留

## 4. PlannedInvoice Dialog 支援 items[]

- [x] 4.1 修 `src/components/order/` 內 PlannedInvoice 建立 / 編輯 Dialog（找到對應元件後修）：
  - 加「品項明細」section（預設展開）
  - 沿用 task 3 的品項列元件（count + unit + unitPrice + itemAmount）
  - 加「從訂單印件帶入」按鈕（呼叫帶入邏輯，見 task 5）
- [x] 4.2 PlannedInvoice 表單頂部「描述」「預計開立日」保留；「預計金額（含稅）」改為 derived 顯示（自動計算 = sum(items.itemAmount)），業務無法手動修改
- [x] 4.3 加 hint 文字「品項複製自訂單印件，後續印件異動需手動同步」

## 5. 鏈式品項預填邏輯

- [x] 5.1 寫 `src/utils/invoiceItemPrefill.ts`：
  - `buildInvoiceItemsFromPrintItems(printItems: PrintItem[]): InvoiceItem[]` — 將訂單印件清單轉為 InvoiceItem 候選（name = 印件名稱、count = 印件數量、unit = 印件單位、unitPrice = 印件未稅單價、itemAmount 自動計算）
  - `buildInvoiceItemsFromPlannedInvoice(planned: PlannedInvoice): InvoiceItem[]` — 沿用 PlannedInvoice.items（深拷貝避免引用共用）
- [x] 5.2 PlannedInvoice 建立 Dialog「從訂單印件帶入」按鈕呼叫 `buildInvoiceItemsFromPrintItems`，並支援勾選 / 取消勾選逐筆
- [x] 5.3 開立發票 Dialog「一鍵開立」按鈕（既有，從 PlannedInvoice 列表觸發）呼叫 `buildInvoiceItemsFromPlannedInvoice` 預填 items
- [ ] 5.4 開立發票 Dialog「手動開立（不關聯預計）」**不提供**「從訂單印件帶入」按鈕（保持單一入口；業務若需印件帶入應走 PlannedInvoice 路徑）
- [x] 5.5 預填後 PlannedInvoice / 訂單印件異動 SHALL NOT 連動下游品項（驗證已建立的下游不被改動）

## 6. 需求單對齊改造

- [x] 6.1 找 `src/components/quote/` 內需求單編輯頁印件「單位」欄位元件，從原本 select（9 項）改為 `<UnitSelect>`（11 項）
- [x] 6.2 既有需求單 mock 資料 `unit` 值檢查 — 若為 LOV 內值（張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批）不需動，若為 LOV 外值則 backfill 為 LOV 內最接近值

## 7. mock 資料 backfill

- [x] 7.1 掃 `src/data/` 內 mock invoice 資料：若 InvoiceItem 缺 `count` / `unit` / `unitPrice` 任一欄則 backfill（count=1、unit='式'、unitPrice=itemAmount）
- [x] 7.2 掃 mock plannedInvoice 資料：補 `items: []` 欄位（既有 description + scheduledAmount 改為 derived，items 起始為空，業務需重新規劃）
- [x] 7.3 補若干 demo mock 資料示範典型情境：
  - 從訂單印件帶入的 PlannedInvoice（items 含 3 筆對應 3 印件）
  - 雜支 PlannedInvoice（items 含「製版費 1 式 2000 元」「運費 1 式 500 元」）
  - 純訂金 PlannedInvoice（items 含「訂金 1 式 30000 元」）

## 8. Prototype 試用驗證

- [x] 8.1 跑 Playwright e2e smoke：開立發票流程（開 Dialog → 加品項 → 驗證五欄輸入 → 開立成功）
- [ ] 8.2 跑 Playwright e2e：PlannedInvoice 從印件帶入流程（建 PlannedInvoice → 點「從訂單印件帶入」→ 勾選 → 確認 items 寫入）
- [ ] 8.3 跑 Playwright e2e：一鍵開立流程（PlannedInvoice → 一鍵開立 → 驗證 Invoice.items 預填）
- [ ] 8.4 驗證業務嘗試輸入小數 / 負數 / 超量 99999 時錯誤訊息正確顯示
- [ ] 8.5 驗證 unitPrice label 隨 category 切換（B2B → 未稅；B2C → 含稅）
- [ ] 8.6 驗證 itemAmount 業務無法直接編輯（disabled 樣式 + 唯讀）
- [ ] 8.7 驗證需求單 dropdown 出現完整 11 項（不漏「式」「組」）
- [ ] 8.8 Prototype 試用：選一張 demo 訂單從 PlannedInvoice → Invoice 鏈式建立完整跑一遍，截圖留證

## 9. 收尾

- [x] 9.1 commit 1：型別 + 共用 UnitOption + UnitSelect 元件（tasks 1-2）
- [x] 9.2 commit 2：開立發票 Dialog 三欄改造（task 3）
- [x] 9.3 commit 3：PlannedInvoice Dialog + 鏈式帶入邏輯（tasks 4-5）
- [x] 9.4 commit 4：需求單對齊 + mock 資料 backfill（tasks 6-7）
- [x] 9.5 commit 5：e2e 驗證調整（task 8）
- [ ] 9.6 跑 `/opsx:verify align-invoice-line-items-to-ezpay-spec` 確認實作符合 specs
- [ ] 9.7 跑 `/opsx:archive align-invoice-line-items-to-ezpay-spec` 歸檔
- [ ] 9.8 archive 後更新 CLAUDE.md § Spec 規格檔清單對應 row（order-management v1.10 / quote-request v3.4 / prototype-shared-ui 新增 1 個 Requirement）
- [ ] 9.9 archive 後 ERP_Vault raw 卡 `2026-05-26-miles-upload-ezpay-invoice-api-spec.md` status 由 `raw` 更新為 `ingested`（觸發 vault-ingest mode B 寫精練去處 wiki link）
