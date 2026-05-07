## 1. spec 層（本 change，已完成）

- [x] 1.1 建立 OpenSpec change directory
- [x] 1.2 撰寫 proposal.md（Why / What Changes / Capabilities / Impact）
- [x] 1.3 撰寫 design.md（D1-D6 設計決策、Risks、Migration Plan）
- [x] 1.4 撰寫 delta specs（quote-request / state-machines / user-roles）
- [x] 1.5 撰寫 tasks.md
- [ ] 1.6 openspec validate --strict 通過

## 2. prototype 資料層（types + mock 映射）

- [ ] 2.1 `src/types/quote.ts`：QuoteStatus enum 新增 `'待業務主管成交審核' | '已核准成交'` 兩個狀態
- [ ] 2.2 `src/types/quote.ts`：STATUS_STEPS 重新定義（從 5 步改為 7 步）
- [ ] 2.3 `src/types/quote.ts`：STATUS_COLOR_MAP 新增兩個狀態的色彩
- [ ] 2.4 既有 mock data（mockQuotes.ts 等）：原 `status = '成交'` 的需求單映射為 `'已核准成交'`（作為「歷史已審核」假設）
- [ ] 2.5 mock 中至少新增 2 筆 `status = '待業務主管成交審核'` 的需求單作為 demo 入口

## 3. prototype store actions

- [ ] 3.1 `src/store/useErpStore.ts`：移除 `approveQuoteByManager`（v2 議價前核可）
- [ ] 3.2 `src/store/useErpStore.ts`：新增 `approveDealByManager`（成交後核准）
  - 前提：status = '待業務主管成交審核'、approved_by_sales_manager_id = currentUser.name、approval_required = true
  - 寫入 lastApprovedPaymentTermsNote、推進至「已核准成交」
- [ ] 3.3 `src/store/useErpStore.ts`：新增 `markQuoteFirstViewedByManagerForDealReview`（對齊 v3 時點，取代原 v2 markQuoteFirstViewedByManager）
- [ ] 3.4 `src/store/useErpStore.ts`：修改 `convertQuoteToOrder` 前提從 `'成交'` 改為 `'已核准成交'`
- [ ] 3.5 `src/store/useErpStore.ts`：updateQuoteStatus 加新 status 的合法轉換規則（議價中 → 成交、成交 → 待業務主管成交審核、待業務主管成交審核 → 已核准成交 / 流失）

## 4. prototype 業務主管 UI

- [ ] 4.1 `src/pages/SalesManagerApprovals.tsx`：篩選條件改為 `status = '待業務主管成交審核'`
- [ ] 4.2 `src/pages/SalesManagerApprovals.tsx`：等待天數計算依據改為「進入待業務主管成交審核時間」
- [ ] 4.3 `src/components/quote/SalesManagerApprovalListPage.tsx`：對應更新
- [ ] 4.4 業務主管詳情頁的「核可進議價」按鈕移除、新增「核准成交」按鈕（QuoteDetailPage.tsx）

## 5. prototype 業務 UI

- [ ] 5.1 `src/components/quote/QuoteDetailPage.tsx`：「進入議價」按鈕移除業務主管核可前提
- [ ] 5.2 議價中「成交」按鈕：點擊後狀態推進至「待業務主管成交審核」（不是直接到「成交」）
- [ ] 5.3 「轉訂單」按鈕條件改為 `status === '已核准成交'`
- [ ] 5.4 詳情頁「等待業務主管核可中」UI：顯示時點改為「待業務主管成交審核」狀態
- [ ] 5.5 「重新評估報價」流程：移除業務主管再次核可需求（議價中可直接重新評估）

## 6. prototype StatusStepper

- [ ] 6.1 `src/components/quote/StatusStepper.tsx`：步驟條從 5 步改為 7 步（含「待業務主管成交審核」與「已核准成交」）
- [ ] 6.2 步驟對應的 stepIcons 補齊
- [ ] 6.3 流失狀態的處理（流失可發生在多個狀態，stepper 顯示策略）

## 7. type-check + 測試

- [ ] 7.1 `npx tsc --noEmit` 通過
- [ ] 7.2 手動測試：完整跑一次「需求確認中 → ... → 已核准成交 → 轉訂單」流程
- [ ] 7.3 手動測試：「待業務主管成交審核 → 流失」路徑
- [ ] 7.4 手動測試：諮詢來源需求單於不同狀態流失，皆觸發建諮詢訂單

## 8. doc-audit + 整合

- [ ] 8.1 與 `add-consultation-request-and-revise-approval-gate` change 對齊：兩個 change 都引用「已核准成交」狀態，確認 spec 文字一致
- [ ] 8.2 doc-audit skill 檢查跨 spec 一致性
- [ ] 8.3 確認 CLAUDE.md § Spec 規格檔清單需更新（quote-request 進入 v3.0 標記）

## 9. 歸檔（與 add-consultation-request-and-revise-approval-gate 一起歸檔）

- [ ] 9.1 兩個 change 同時 archive（避免中間態 spec 不一致）
- [ ] 9.2 推送至 Notion Feature Database：
  - 需求單 Notion 頁面更新至 v3.0
  - 業務主管角色說明更新

## 10. Agent 機制改善（已於 add-consultation-request-and-revise-approval-gate change e5ca38d 完成）

- [x] 10.1 ceo-reviewer / senior-pm / erp-consultant 加專案階段背景 / 語言規範 / 設計理解 step
- [x] 10.2 ceo-reviewer 加常見誤區段落
