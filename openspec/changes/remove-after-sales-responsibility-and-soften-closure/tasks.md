# Tasks: remove-after-sales-responsibility-and-soften-closure

## 1. spec 同步（main specs 對齊 delta）

- [x] 1.1 執行 `/opsx:sync` 將三份 delta（after-sales-ticket / business-scenarios / prototype-data-store）合入 main specs，確認 MODIFIED 依 exact-title 取代、REMOVED 移除責任歸屬 Requirement
- [x] 1.2 手動修訂 after-sales-ticket spec Purpose 段（delta 不涵蓋非 Requirement 區塊）：移除 responsibility 措辭、管理切片改述為「售後類型分組＋退款異動單總額推導」、修復 OQ-NOTIFY-1 / OQ-AST-3 指向已封存 change 的斷鏈（改指 wiki OQ 卡或標註已封存出處）
- [x] 1.3 驗證：`grep -n "responsibility\|責任歸屬" openspec/specs/after-sales-ticket/spec.md openspec/specs/business-scenarios/spec.md openspec/specs/prototype-data-store/spec.md` 僅剩 REMOVED 溯源或零命中

## 2. Prototype 測試先行（先紅後綠）

- [ ] 2.1 更新售後測試斷言（`src/test/after-sales/myAfterSalesGroups.test.ts` 等）：移除 responsibility 相關斷言；新增「結案時有未完結下游動作顯示提醒並允許結案」「客訴內容修改寫入活動紀錄（含前後全文）」「結案後客戶回饋可改留痕」情境覆蓋測試，期望值取自 delta Scenario 的 THEN 描述——此時測試 SHALL 失敗（紅）
- [ ] 2.2 新增 Playwright 情境：售後單詳情三組件未完成點「結案」→ 提醒 dialog 列出未完結項目 → 確認後成功結案（期望值取自「三組件未完成時結案顯示提醒但允許強制結案」Scenario）

## 3. Prototype 實作（至測試通過）

- [ ] 3.1 `src/types/afterSalesTicket.ts`：移除 responsibility 型別欄位
- [ ] 3.2 `src/data/mockAfterSalesTickets.ts` 與 `src/test/helpers/storeTestUtils.ts`（factory）：移除 responsibility mock 值
- [ ] 3.3 `AfterSalesTicketDetail.tsx` / `AfterSalesSection.tsx`：移除責任歸屬顯示與編輯；結案按鈕改軟提示（未完結異動單／未出貨完成補印印件清單 dialog、確認後結案）；客訴內容與結案後客戶回饋改可編輯＋活動紀錄留痕
- [ ] 3.4 `MyAfterSales.tsx` / `SalesManagerAfterSales.tsx`：移除責任歸屬篩選器與表格欄（主管頁 12 欄改 11 欄）
- [ ] 3.5 `useErpStore.ts`：移除 responsibility 相關邏輯；活動紀錄補「修改客訴內容」「修改結案後客戶回饋」「強制結案（含未完結清單）」事件
- [ ] 3.6 驗證：`npm run type-check` 通過（tsc -p tsconfig.app.json，root config 為 references-only 假陰性）＋ 2.1/2.2 測試全數通過（綠）＋ `grep -rn "responsibility" src/` 零命中

## 4. 收尾

- [ ] 4.1 `/opsx:verify` 驗證實作與 artifacts 一致
- [ ] 4.2 `/opsx:archive` 歸檔本 change
