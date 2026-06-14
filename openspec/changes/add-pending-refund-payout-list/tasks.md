## 1. 資料層：退款收款帳號欄位

- [ ] 1.1 `types/payment.ts` Payment 新增「退款收款帳號」欄位（選填字串，戶名／銀行／帳號合一），補欄位註解指向 wiki 帳務卡為正本
- [ ] 1.2 `data/` 退款款項 mock 補退款收款帳號（真實格式，如「王小明／國泰世華／013-1234-567890」），並確保有 ≥ 2 筆「款項狀態＝處理中、款項類型＝退款」的退款款項（含同一訂單拆兩筆分期退的情境）供清單顯示

## 2. 退款款項建立表單

- [ ] 2.1 `components/order/PaymentEditPanel.tsx` 當款項類型＝退款時顯示「退款收款帳號」輸入欄；款項類型＝收款時不顯示、不寫入
- [ ] 2.2 驗證：建立退款款項時填入退款收款帳號後可正確寫入並回讀

## 3. 待出金退款清單頁

- [ ] 3.1 新增 `pages/finance/PendingRefundPayouts.tsx`，鏡像 `Receivables.tsx` 唯讀列表範式（FilterCard + ErpTableCard）
- [ ] 3.2 清單資料源＝過濾「款項狀態＝處理中 且 款項類型＝退款」的收款紀錄逐筆呈現（一筆一列；同一訂單多筆退款出多列）
- [ ] 3.3 清單欄位：來源訂單／客戶／退款金額／退款收款帳號／負責業務／帳務公司／處理中老化天數（沿用 `isPaymentAging` 7 天）
- [ ] 3.4 `App.tsx` 新增路由 `/finance/pending-refund-payouts`；`components/layout/AppSidebar.tsx` finance 群新增「待出金退款」入口，置於待開發票／應收款項旁
- [ ] 3.5 可見範圍：會計（全公司）、業務主管（彙整）；其餘角色不顯示此導覽項
- [ ] 3.6 清單頁加說明文字：「本清單僅列已建立的處理中退款；漏建退款需另靠對帳『應收 > 收款淨額』差額抓出」（避免會計誤把清單當應退全集）

## 4. 出金操作 side panel

- [ ] 4.1 清單列提供「檢視」動作，點擊開 side panel，內嵌既有款項編輯能力（重用 PaymentEditPanel 的已完成切換 + 匯款證明附件上傳，不複製邏輯）
- [ ] 4.2 會計於 side panel 切「已完成」並上傳匯款證明後，該筆 SHALL 自清單即時移出（依 store reactivity）
- [ ] 4.3 驗證：切已完成後重新整理清單，該筆不再出現

## 5. 驗證

- [ ] 5.1 型別檢查通過：`npm run type-check`（或 `tsc -p tsconfig.app.json`）無錯誤
- [ ] 5.2 新增 Playwright smoke：開啟「待出金退款」頁能載入、列出處理中退款款項、無 console.error / pageerror
- [ ] 5.3 對照 delta spec § 待出金退款清單 四個 Scenario 逐條人工確認 Prototype 行為一致
