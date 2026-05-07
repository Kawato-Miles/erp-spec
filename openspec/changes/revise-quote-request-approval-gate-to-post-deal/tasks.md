## 1. spec 層（本 change）

- [x] 1.1 建立 OpenSpec change directory
- [x] 1.2 撰寫 proposal.md
- [x] 1.3 撰寫 design.md（D1-D6 設計決策、Risks、Migration Plan）
- [x] 1.4 撰寫 delta specs（quote-request / state-machines / user-roles）
- [x] 1.5 撰寫 tasks.md
- [x] 1.6 openspec validate --strict 通過
- [x] 1.7 commit + push（60deba3）

## 2. prototype 資料層（types + mock 映射）

- [x] 2.1 QuoteStatus enum 新增「待業務主管成交審核」「已核准成交」兩個狀態
- [x] 2.2 STATUS_STEPS 重新定義（5 步 → 7 步：加「主管審核」「核准成交」）
- [x] 2.3 STATUS_COLOR_MAP 新增兩個狀態的色彩
- [x] 2.4 既有 mock data：5 筆「成交」映射為「已核准成交」、1 筆改「待業務主管成交審核」、1 筆維持「成交」（demo 入口）
- [x] 2.5 mock 涵蓋 demo 入口（待業務主管成交審核 + 成交各 1 筆）

## 3. prototype store actions

- [x] 3.1 approveQuoteByManager 邏輯改 v3（'待業務主管成交審核' → '已核准成交'，函式名保留避免大量 UI rename）
- [x] 3.2 新增 submitQuoteForDealApproval（'議價中' / '成交' → '待業務主管成交審核'）
- [x] 3.3 markQuoteFirstViewedByManager 可見狀態調整為 ['待業務主管成交審核', '已核准成交', '流失']
- [x] 3.4 convertQuoteToOrder 前提從「成交」改為「已核准成交」
- [x] 3.5 convertQuoteToOrder 不再改 status 為「成交」（保持「已核准成交」+ 寫 linkedOrderId）

## 4. prototype 業務主管 UI

- [x] 4.1 SalesManagerApprovalListPage 篩選條件改為「待業務主管成交審核」
- [x] 4.2 等待天數計算依「進入待業務主管成交審核時間」
- [x] 4.3 業務主管可見狀態 enum 翻轉（['待業務主管成交審核', '已核准成交', '流失']）
- [x] 4.4 業務主管詳情頁「核可進議價」按鈕改為「核准成交」（QuoteDetailPage）

## 5. prototype 業務 UI

- [x] 5.1 「進入議價」按鈕：業務於「已評估成本」直接點（v3 無需主管核可）
- [x] 5.2 「成交」按鈕改為「成交（送業務主管審核）」呼叫 submitQuoteForDealApproval
- [x] 5.3 「建立訂單」按鈕條件改為 status === '已核准成交'
- [x] 5.4 業務側等待 banner 改為「等待 [業務主管姓名] 核准成交中」
- [x] 5.5 上次核准條件對照 banner 改在「待業務主管成交審核」狀態顯示

## 6. prototype StatusStepper

- [x] 6.1 步驟條從 5 步改為 7 步
- [x] 6.2 stepIcons 加 Handshake（成交）/ ShieldCheck（主管審核）
- [x] 6.3 getStepIndex 補新狀態的 step 索引（流失 = -1 維持原邏輯）

## 7. type-check + 測試

- [x] 7.1 npx tsc --noEmit 通過
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
