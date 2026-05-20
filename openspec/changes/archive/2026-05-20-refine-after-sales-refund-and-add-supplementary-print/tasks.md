## 1. 前置作業（共同 — Phase A/B/C 共用）

- [x] 1.1 觸發 `oq-manage` mode B 開立 9 個 OQ 卡（OQ-1 ~ OQ-9，含去重檢查；位置：`memory/erp/ERP_Vault/08-open-questions/`）
- [x] 1.2 觸發三視角審查 Round 1（senior-pm + ceo-reviewer + erp-consultant 平行；變動性質 = 結構性變更等級；依 [multi-agent-discussion-protocol](../../../memory/erp/ERP_Vault/11-review-knowledge/protocols/multi-agent-discussion-protocol.md)）
- [x] 1.3 整併三視角審查回饋到 proposal / design / specs（必要時 Round 2）
- [x] 1.4 三視角審查全部通過後 commit specs + design 變更（commit message: `docs: refine-after-sales-refund Task 1 — proposal/specs/design 三視角審查通過`）

## 2. Phase A：OrderAdjustment 編輯閘門放寬（對應反饋 1）

### Type / Store 層

- [x] 2.1 `src/types/order.ts` 擴充 `OrderAdjustment` 型別新增 `approved_amount`、`current_amount`、`approved_at`、`audit_log[]` 欄位
- [x] 2.2 `src/store/useErpStore.ts` 改寫 `updateOrderAdjustment`：允許 `status = 已核可` 狀態下改 `current_amount` 不需重新送審；每次異動 append `audit_log` entry（含 `adjusted_at` / `adjusted_by` / `previous_amount` / `new_amount` / `status_at_adjustment`）

### UI 層

- [x] 2.3 `OrderAdjustmentSection.tsx` 改寫：
  - 移除「執行」按鈕（已核可狀態不再顯示）
  - 已核可狀態新增「編輯金額」按鈕 + 編輯 dialog
  - 卡片顯示「主管核可金額 vs 當前金額」對照欄位，若 `current_amount ≠ approved_amount` 用視覺強調顯示「業務已調整 ${diff}」
- [x] 2.4 OA 卡片「活動紀錄」區塊顯示 audit log（時間倒序）

### Phase A 驗證

- [x] 2.5 Playwright e2e：建 OA → 主管核可（記錄 approved_amount）→ 業務改金額（current_amount 改變、status 維持已核可、audit log append）→ 主管在訂單頁看到對照欄位視覺強調 → 斷言 `ticket.linked_adjustments.length === 1`（成功指標 A）
- [x] 2.6 Playwright e2e：已執行 OA 嘗試點「編輯金額」→ 按鈕不顯示 / 金額欄位 disabled
- [x] 2.7 commit Phase A（commit message: `feat: refine-after-sales-refund Task 2 — OA 編輯閘門放寬 + 對照欄位 + audit log`）

## 3. Phase B：OA「已執行」綁退款 Payment 建立（對應反饋 2）

### Type / Store 層

- [x] 3.1 `src/types/order.ts` 擴充 `Payment` 型別新增 `refund_date`、`reconciliation_attachment[]`、`reconciliation_note`、`linked_order_adjustment_id` 欄位
- [x] 3.2 `src/store/useErpStore.ts` 新增 `createRefundPayment(orderAdjustmentId, amount, refundDate, attachments, note)` 方法：同一 transaction 建 Payment（type=refund）+ 推進關聯 OA 為已執行（status = '已執行', executedAt = now）+ 觸發訂單應收總額重算

### UI 層

- [x] 3.3 `OrderPaymentSection.tsx` 退款 Payment 建立 dialog 擴充欄位：退款日期（必填）、對帳附件（必填，至少 1 個）、對帳備註（選填）；submit 驗證對帳附件存在才能提交
- [x] 3.4 `AfterSalesTicketDetail.tsx` 在「關聯 OrderAdjustment 卡片」內，OA `status = 已核可` 時顯示「建立退款 Payment」按鈕，點擊開啟退款 Payment dialog（dialog 預設帶 OA.current_amount、linked_order_adjustment_id = OA.id）

### Phase B 驗證

- [x] 3.5 Playwright e2e：OA 已核可 → ticket 內點「建立退款 Payment」→ dialog 顯示 → 填日期 / 附件 / 備註 → 提交 → 驗證 Payment 建立（type=refund, linked_order_adjustment_id 寫入）+ OA 自動推進已執行（executedAt 寫入）+ 訂單應收總額正確重算（成功指標 B）
- [x] 3.6 Playwright e2e：退款 Payment dialog 未上傳對帳附件 → 提交被擋 → 系統顯示「對帳附件為必填」+ Payment 未建立 + OA 狀態未變
- [x] 3.7 Playwright e2e 資料一致性 invariant：跨多次跑 e2e 後，斷言「不存在 `OA.status = '已執行' AND adjustment_type IN (退印/補退) AND 無關聯 type=refund Payment`」（成功指標 B 補強）
- [x] 3.8 commit Phase B（commit message: `feat: refine-after-sales-refund Task 3 — 已執行綁退款 Payment 建立 + 對帳資料必填`）

## 4. Phase C：補印 PrintItem 識別資訊架構（對應反饋 3）

### Type / Store 層

- [x] 4.1 `src/types/order.ts` 擴充 `PrintItemType` 列舉值為 `'打樣印件' | '大貨印件' | '補印印件'`
- [x] 4.2 `src/store/useErpStore.ts` 新增 `createSupplementaryPrintItem(afterSalesTicketId, printItemInput)` 方法：建 PrintItem 自動帶 `type = '補印印件'` + `related_after_sales_ticket_id = afterSalesTicketId`
- [x] 4.3 確認 invariant：建立 PrintItem 時若 `type = '補印印件'` 但 `related_after_sales_ticket_id IS NULL`，store 拒絕並拋錯

### 共用元件

- [x] 4.4 新建 `src/components/shared/PrintItemTypeLabel.tsx` — 三值通用標籤（打樣藍 / 大貨灰 / 補印橙），補印時顯示來源 ticket 編號 tooltip + click 跳轉 ticket
- [x] 4.5 新建 `src/components/after-sales/SupplementaryPrintItemDialog.tsx` — 建補印 dialog（印件名稱、規格、數量、備註；可選原訂單既有印件複製規格）

### ticket 詳情頁

- [x] 4.6 `AfterSalesTicketDetail.tsx` 新增「建立補印印件」按鈕（與「建立退款異動單」並列），點擊開啟 SupplementaryPrintItemDialog
- [x] 4.7 `AfterSalesTicketDetail.tsx` 新增「補印印件清單區」獨立分組：列出 `where related_after_sales_ticket_id = current_ticket.id AND type = '補印印件'`、含印件名稱 / 規格摘要 / 當前狀態 / 跳轉印件詳情連結、排序建立時間倒序

### 訂單詳情頁印件區

- [x] 4.8 訂單詳情頁印件區表格新增「印件類型」欄位（用 `PrintItemTypeLabel`），補印與大貨混合排列、不獨立分組，不需 filter

### 列表頁（4 個）

- [x] 4.9 業務平台印件總覽列表頁加「印件類型」欄位 + filter（三選項預設全選）
- [x] 4.10 派工看板工序卡片內任務明細表加「印件類型」欄位 + filter
- [x] 4.11 工單列表 / 印務主管印件總覽（防掉單）頁加「印件類型」欄位 + filter
- [x] 4.12 訂單列表加「印件類型」欄位 + filter

### Phase C 驗證

- [x] 4.13 Playwright e2e：售後 ticket 內點「建立補印印件」→ Dialog 填印件資訊 → 提交 → 驗證 PrintItem.type = 補印印件 + related_after_sales_ticket_id 寫入
- [x] 4.14 Playwright e2e：ticket 詳情頁「補印印件清單區」即時顯示新建補印 + 點擊跳轉印件詳情；斷言清單區數量 = 透過 `related_after_sales_ticket_id` 反查的數量（成功指標 C 補強）
- [x] 4.15 Playwright e2e：訂單詳情頁印件區的表格出現新增補印 PrintItem，「印件類型」欄位顯示「補印」+ hover 顯示 AS 編號 + click 跳轉 ticket
- [x] 4.16 Playwright e2e：四個列表頁（業務平台印件總覽 / 派工看板 / 工單列表 / 訂單列表）「印件類型」欄位三值都顯示
- [x] 4.17 Playwright e2e：四個列表頁「印件類型」filter 篩選「補印」→ 只顯示補印；篩選「大貨」→ 不含補印；可複選（成功指標 C）
- [x] 4.18 Playwright e2e：補印印件走完整流程（建補印 → 審稿 → 工單建立 → 生產任務 → QC → 出貨）成功
- [x] 4.19 commit Phase C（commit message: `feat: refine-after-sales-refund Task 4 — 補印 PrintItem type + 識別 UI + 四列表頁 filter`）

## 5. 整合驗證

- [x] 5.1 跑全部 Playwright e2e（smoke + navigation + 流程 spec），確認無回歸
- [x] 5.2 console.error / pageerror 嚴格斷言 = 0
- [x] 5.3 觸發 `doc-audit` 檢查 OpenSpec 跨檔案邏輯一致性
- [x] 5.4 若本次累計 ≥ 5 個 Vault 卡異動 → 觸發 `vault-audit`（10 維度自審）
- [x] 5.5 視 audit-log 累積情況，視情況觸發 `vault-insight`（跨主題模式 + 下一步）

## 6. 歸檔與同步

- [x] 6.1 三視角審查確認 Prototype 實作對齊 BRD（Round 2 或 Round 3，視回饋）
- [x] 6.2 執行 `/opsx:verify` 確認 spec / design / tasks / Prototype 一致
- [x] 6.3 執行 `/opsx:archive` 歸檔本 change
- [x] 6.4 同步 main specs（delta → main 合併）：
  - `openspec/specs/order-management/spec.md`（OA + Payment + 訂單詳情頁印件區）
  - `openspec/specs/after-sales-ticket/spec.md`（OA 關聯 + PrintItem 關聯 + 補印清單區）
  - `openspec/specs/prototype-shared-ui/spec.md`（PrintItemTypeLabel + 列表頁印件類型欄位通用設計）
  - `openspec/specs/sales-platform/spec.md`（業務平台印件總覽 filter 預設值）
  - `openspec/specs/work-order/spec.md`（印務主管印件總覽印件類型欄位）
  - `openspec/specs/task-dispatch-board/spec.md`（工序卡片任務明細表印件類型欄位）
- [x] 6.5 更新 `/Users/b-f-03-029/Sens/CLAUDE.md` § Spec 規格檔清單版本號：
  - order-management → v1.5
  - after-sales-ticket → v0.4
  - prototype-shared-ui → 增列新 Requirement
  - sales-platform → v0.3
  - work-order / task-dispatch-board → 註明歸檔
- [x] 6.6 commit + push（commit message: `docs: refine-after-sales-refund-and-add-supplementary-print 歸檔 + main specs sync`）
- [x] 6.7 視時機推送 Notion 發布版本（累積數個 change 後決定）
