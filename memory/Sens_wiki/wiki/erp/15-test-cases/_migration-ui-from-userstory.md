---
type: meta
status: draft
last-reviewed: 2026-06-01
---

# 單階段化遷移：自 user-story 抽出的 UI 操作內容（待 seed test-case / Prototype e2e）

> 2026-06-01 user-story 單階段化時，自 8 張 ui-bound 卡抽出的 UI 操作（易變層）內容。
> 用途：seed 對應 test-case 卡（業務級驗收）與 Prototype 端對端測試（UI 點擊層）。完成後本檔可刪。

## [[US-ORD-020-業務建立請款期次]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/BillingInstallmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 「請款期次（v2 統一規劃）」區塊 → 「新增期次」按鈕

### 操作步驟
- 點「新增期次」開 BillingInstallmentEditDialog
- 填入描述 / 預計金額 / 應收日 / 預計開票日（選填）/ 備註
- 點「建立期次」儲存

### 介面元素
- BillingInstallmentEditDialog 表單欄位：description / scheduledAmount / dueDate / expectedInvoiceDate / note
- 訂單應收 vs 期次合計差額警示橫幅（amber-50 + AlertCircle）
```

## [[US-ORD-021-業務於期次一鍵開立發票]]

```
## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderInvoiceSection.tsx（task 4.5 整合中）-->

> task 4.5 整合 OrderInvoiceSection 後填寫具體 UI 步驟。
```

## [[US-ORD-022-業務拆期保留稽核軌跡]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/BillingInstallmentSplitDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 請款期次列表 → 該期「拆此期」按鈕（兩條入口共用此 Dialog）

### 介面元素
- BillingInstallmentSplitDialog 顯示原期次資訊 + A/B 兩期表單 + 即時合計校驗（不等時 disable 儲存）
```

## [[US-ORD-023-業務登錄收款核銷分配]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/PaymentAllocationDialog.tsx -->

> 待 task 4.5/4.6 OrderInvoiceSection 整合後接入完整 Payment 登錄流程。
```

## [[US-ORD-024-會計匯出14欄對帳CSV]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/finance/ReconciliationCsvExportDialog.tsx + sens-erp-prototype/src/pages/finance/Receivables.tsx -->

### 介面入口
- 財務 / 應收款項頁 → 操作列「匯出對帳 CSV」按鈕

### 操作步驟
- 點按鈕開 ReconciliationCsvExportDialog
- 選日期範圍、篩選 → 預覽 → 點「匯出 CSV」下載

### 介面元素
- ReconciliationCsvExportDialog 含日期 / 帳務公司 / 業務 / 含作廢 篩選 + 14 欄預覽 + 匯出按鈕含計數
```

## [[US-ORD-025-業務查看期次原始vs現況對照]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OriginalVsCurrentDateLabel.tsx + BillingInstallmentListCard.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 請款期次列表 → 每期 row 的應收日 / 預計開票日欄位

### 介面元素
- OriginalVsCurrentDateLabel 共用元件：依 originalValue vs currentValue 顯示單一日期或雙日期對照
```

## [[US-ORD-026-業務建補收OA免主管核可直接執行]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderAdjustmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁 → 訂單異動區塊 → 「新增異動」按鈕

### 操作步驟
- 在新增異動對話框選要跟客戶多收錢的類型、填金額與原因明細，按「直接執行」就生效

### 介面元素
- 新增異動對話框顯示綠色提示橫幅「補收正項 — 直接執行（免主管核可）」（橫幅原文照畫面，畫面上的「補收正項」就是指這筆是要跟客戶多收的錢，可直接生效、免主管核可）
- 多收金額很大時顯示黃橘色警示橫幅，提示「業務主管將收到事後通知」
```

## [[US-ORD-027-業務主管核可退款訂單異動]]

```
## UI 操作（易變層）

<!-- 此段對應的程式檔位置（給工程對應用，業務主管可略過）已記在卡片最上方 implemented-by 欄位 -->

### 介面入口
- 訂單詳情頁 → 訂單異動區塊 → 待主管審核中的退款異動該列 → 點開核可 / 退回視窗

### 操作步驟
- 業務主管在核可 / 退回視窗檢視退款原因與明細後，按「核可」或「退回」

### 介面元素
- 核可 / 退回視窗上方會出現一條藍色提示，寫著「這是退款，要退錢給客戶——需要主管核可才能往下走」
```

## [[US-ORD-028-業務查看溢收預收未分配]]

```
## UI 操作（易變層）

<!-- ui-binding: draft -->

> 對帳 / 訂單款項區塊「預收（未分配）」顯示與業務後續處理入口待 task 4.x 後續整合時細化。
```

## [[US-ORD-029-會計收到月結差錯訂單警示]]

```
## UI 操作（易變層）

<!-- ui-binding: draft -->

> 月結批次觸發者與時點待 BI-8 OQ 拍板（會計手動 / 定時批次 / 混合）。
```

## [[US-ORD-030-F1預開發票拆票實作金額調整退款]]

```
## UI 操作（易變層）

<!-- ui-binding: draft -->

> 全鏈路涉及 OrderPaymentSection / OrderInvoiceSection / OrderAdjustmentSection 多區塊跨流程，UI 路徑待 task 4.5-4.14 整合後填寫。
```

## [[US-ORD-031-期次規劃invariant警示與大額補收紅標]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderBillingInstallmentSection.tsx + OrderAdjustmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 「請款期次（v2 統一規劃）」區塊頂部警示橫幅
- 訂單異動編輯 Dialog → 大額補收觸發 amber 警示 + BellRing 提示

### 介面元素
- OrderBillingInstallmentSection 內 invariant 警示橫幅含 action button「建立期次」
- OrderAdjustmentEditDialog 大額補收 amber 橫幅 + BellRing 圖示
```

## [[US-ORD-032-製作後印件規格異動通知印務]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/pages/OrderDetail.tsx + src/components/order/EditOrderPrintItemPanel.tsx -->

### 介面入口
- 訂單詳情頁「訂單項目」Tab → 印件清單表格 row 操作欄「編輯印件」按鈕

### 操作步驟
1. 業務點訂單詳情頁「訂單項目」Tab 上的印件「編輯印件」按鈕
2. Side Panel 開啟、顯示 Info Banner「規格類欄位仍可編輯（系統將自動通知印務 / 印務主管 / 訂單管理人）；售價變更需走訂單異動 Tab」
3. 業務修改規格備註 / 購買數量 / 單位 / 難易度任一欄位後點「確認」
4. Side Panel 關閉，畫面顯示 Toast「印件已更新，已通知印務團隊」+ 通知對象姓名清單

### 介面元素
- 印件清單操作欄「編輯印件」按鈕：v1.13 後不再限製作前才顯示，訂單未取消即顯示
- Side Panel Info Banner：訂單進入製作階段時顯示提示
- Side Panel 售價欄位：disabled + Tooltip「訂單已進入製作階段，售價變更需走『訂單異動』Tab 建立補收 / 折讓單」
- Toast：含通知對象姓名清單（印務 / 印務主管 / 訂單管理人 fallback 業務）
```

## [[US-ORD-033-上傳訂單其他附件標註用途]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/pages/OrderDetail.tsx Tab 9 + src/components/order/OrderAttachmentUploadDialog.tsx -->

### 介面入口
- 訂單詳情頁「檔案」Tab → 「其他訂單附件」Section 右上「上傳其他附件」按鈕

### 操作步驟
1. 業務點訂單詳情頁「檔案」Tab 內「其他訂單附件」Section 右上「上傳其他附件」按鈕
2. Dialog「上傳其他訂單附件」開啟，含檔名輸入框、用途 textarea（200 字上限必填）
3. 業務填寫檔名（含副檔名）+ 用途說明後點「確認上傳」
4. Dialog 關閉，畫面顯示 Toast「附件已上傳」
5. 附件清單立即顯示新檔案，含檔名、用途、上傳者、上傳時間、下載連結

### 介面元素
- Section 標題「其他訂單附件」+ 「上傳其他附件」按鈕：訂單未取消且當前使用者具編輯權限時 enabled
- Dialog 標題「上傳其他訂單附件」+ 副說明「承載非回簽用途的訂單相關文件（合約 / 規格說明 / 客戶聲明 / 補充說明等）」
- 用途 textarea：含 200 字字數計數
- 附件清單 row：檔名 + 用途（「用途：xxx」）+ 上傳者 + 上傳時間 + 下載連結
- 空狀態：「尚無其他訂單附件；點上方『上傳其他附件』加入合約 / 規格說明 / 客戶聲明等文件」
```

## [[US-ORD-034-業務查訂單下印件狀態]]

```
## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/pages/OrderList.tsx -->

### 介面入口
- 訂單管理 → 訂單列表

### 操作步驟
- 於搜尋框輸入訂單編號／客戶／案名，或印件名稱／編號定位訂單
- 展開訂單列查看印件子層（印件名稱／審稿狀態／印件狀態／交期）
- 於子層操作欄檢視單一印件，開啟印件詳情側欄（含稿件縮圖、相關工單、審稿紀錄）

### 介面元素
- 訂單列可展開列（展開後顯示印件子層）
- 印件子層 5 欄表格
- 印件詳情側欄
```

## [[US-ORD-035-業務於訂單異動已核可後校正退款金額]]

```
## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應系統畫面路徑：待系統畫面設計定案後補 -->

> 畫面操作說明：等系統畫面設計定案後再補。目前這張卡只寫到業務情境，畫面怎麼操作這段，等系統畫面設計定案後再補上。

### 介面入口
- 待補

### 操作步驟
- 待補

### 介面元素
- 待補
```

