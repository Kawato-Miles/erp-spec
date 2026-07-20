# Tasks: remove-after-sales-responsibility-and-soften-closure

## 1. spec 同步（main specs 對齊 delta）

- [x] 1.1 執行 `/opsx:sync` 將三份 delta（after-sales-ticket / business-scenarios / prototype-data-store）合入 main specs，確認 MODIFIED 依 exact-title 取代、REMOVED 移除責任歸屬 Requirement
- [x] 1.2 手動修訂 after-sales-ticket spec Purpose 段（delta 不涵蓋非 Requirement 區塊）：移除 responsibility 措辭、管理切片改述為「售後類型分組＋退款異動單總額推導」、修復 OQ-NOTIFY-1 / OQ-AST-3 指向已封存 change 的斷鏈（改指 wiki OQ 卡或標註已封存出處）
- [x] 1.3 驗證：`grep -n "responsibility\|責任歸屬" openspec/specs/after-sales-ticket/spec.md openspec/specs/business-scenarios/spec.md openspec/specs/prototype-data-store/spec.md` 僅剩 REMOVED 溯源或零命中

## 2. Prototype 測試先行（先紅後綠）

- [x] 2.1 更新售後測試斷言（`src/test/after-sales/myAfterSalesGroups.test.ts` 等）：移除 responsibility 相關斷言；新增「結案時有未完結下游動作顯示提醒並允許結案」「客訴內容修改寫入活動紀錄（含前後全文）」「結案後客戶回饋可改留痕」情境覆蓋測試（`closureReminderAndAudit.test.ts`，8 條），期望值取自 delta Scenario 的 THEN 描述——先紅（8 failed）後綠
- [x] 2.2 新增 Playwright 情境（`e2e/after-sales-close-reminder.spec.ts`）：售後單詳情退款異動單未完結點「結案」→ 提醒 dialog 列出未完結項目 → 確認後成功結案＋活動紀錄附清單

## 3. Prototype 實作（至測試通過）

- [x] 3.1 `src/types/afterSalesTicket.ts`：移除 responsibility 型別欄位；新增 `getUnfinishedAfterSalesDownstream` 結案提醒清單 helper；順修既有斷匯入（PrintItem → OrderPrintItem）
- [x] 3.2 `src/data/mockAfterSalesTickets.ts` 與 `src/test/helpers/storeTestUtils.ts`（factory）：移除 responsibility mock 值；resetStore 補清 orderAdjustments / afterSalesTickets（跨測試洩漏既有缺口）
- [x] 3.3 `AfterSalesTicketDetail.tsx` / `AfterSalesSection.tsx`：移除責任歸屬顯示與編輯；結案 dialog 改軟提示（動態列未完結異動單／未完成補印印件、確認後結案）；客訴內容任何階段可編輯＋結案後客戶回饋區塊（皆留痕）
- [x] 3.4 `MyAfterSales.tsx` / `SalesManagerAfterSales.tsx`：移除責任歸屬篩選器與表格欄
- [x] 3.5 `useErpStore.ts`：移除 responsibility 相關邏輯（含 ownerTransferLog 殘留）；新增 `updateAfterSalesTicketText`（修改留痕）；結案寫入活動紀錄（強制結案附未完結清單）
- [x] 3.6 驗證：單元 245 項全數通過、e2e 全套 150 項通過；type-check 錯誤 67 → 61（未新增、修掉 6 個既有）；lint 淨零新增；`grep -rn "responsibility" src/` 僅剩 change 名稱註解；瀏覽器實測結案提醒 dialog 與活動紀錄留痕

## 4. 收尾

- [x] 4.1 `/opsx:verify` 驗證實作與 artifacts 一致（Completeness：任務全勾、三份 delta 全數落地；Correctness：28 項單元＋售後 e2e 26 項對應 Scenario；Coherence：方案 A／軟提示／留痕皆依 design 決策，補印提醒錨點在 Prototype 以印件粗粒度狀態（非已完成／已取消／已棄用）映射「未出貨完成」，屬 mock 資料層既有粗粒度）
- [x] 4.2 `/opsx:archive` 歸檔本 change（delta 已於任務 1.1 sync 至 main specs）
