## 1. 資料模型與寫入 action

- [ ] 1.1 `src/types/order.ts` 擴充 `Order` 型別，新增 `prepressApprovedAt?: string` 與 `primaryContributorId?: string | null` 兩欄位（optional，初始 NULL）
- [ ] 1.2 `src/utils/prepressReview.ts` 新增 `identifyPrimaryContributor(order): string | null`（含 D2 的三層 tie-break：件數 → 收尾者 → reviewerId 字典序）
- [ ] 1.3 新增 `maybeWriteOrderPrepressApproval(order): Order`：判定訂單是否首次達成全合格；滿足條件時回傳新 Order（含 `prepressApprovedAt` + `primaryContributorId`）；否則回傳原 Order
- [ ] 1.4 `src/store/useErpStore.ts` 的 submitReview action（result='合格' 分支）呼叫 `maybeWriteOrderPrepressApproval`，將 Order 更新寫回 state
- [ ] 1.5 同上，`confirmSignBack` / skipReview 建立免審 Round 的 action 也呼叫此 hook（確保混合訂單正確）
- [ ] 1.6 確保 `maybeWriteOrderPrepressApproval` 的 immutability：只在 `prepressApprovedAt === null` 時寫入；既有值不覆寫不清空

## 2. Dashboard 指標計算 util（純函式）

- [ ] 2.1 `countOrderApprovalsByReviewer(orders, range): Map<reviewerId, count>`：區間內 `prepressApprovedAt` 落區間 × `primaryContributorId` 分組計數
- [ ] 2.2 `countOrderApprovalsByCustomer(orders, range): Map<customerId, count>`：同上按客戶分組
- [ ] 2.3 `computeAverageDwellDays(orders, range): number`：區間內 `prepressApprovedAt` 落區間的訂單，`avg(prepressApprovedAt - Order.createdAt)`，單位天（保留 1 位小數）
- [ ] 2.4 `countHighResupplyOrders(orders, threshold = 3): number`：當前有任一印件 `rounds.length > threshold` 且 `reviewDimensionStatus != '合格'` 的訂單數（不受時間區間影響）
- [ ] 2.5 `countResupplyRejectionsByReviewer(orders, range): Map<reviewerId, { printItemCount, roundCount }>`：`roundNo >= 2 且 result = '不合格'` 的 Round 聚合
- [ ] 2.6 `countFirstRoundRejectionsByReviewer(orders, range): Map<reviewerId, { printItemCount, roundCount }>`：所有 `result = '不合格'` 的 Round 聚合（含首審，與 2.5 並列）
- [ ] 2.7 `aggregateCustomerDashboardStats(orders, range)`：整合訂單合格、退件印件、補件後退件次數、反覆退件訂單數，按客戶分組

## 3. 單元測試（覆蓋 design.md 所有邊界）

- [ ] 3.1 `maybeWriteOrderPrepressApproval` 測試：首次寫入、已寫入不覆寫、全免審不寫入、混合 skipReview 訂單、從未達成保持 NULL（5 scenario）
- [ ] 3.2 `identifyPrimaryContributor` 測試：單一 reviewer、主要貢獻者明顯、平手收尾、重審改派、三人跨輪、同秒 tie-break 字典序（6 scenario）
- [ ] 3.3 凍結規則測試：寫入後重審退件不清空、Dashboard 統計歷史不變（2 scenario）
- [ ] 3.4 `computeAverageDwellDays` 測試：多筆訂單平均、單一訂單、區間內無訂單回 0（3 scenario）
- [ ] 3.5 `countHighResupplyOrders` 測試：閾值 3 邊界（= 3 不計、> 3 計）、合格印件不計、不受時間區間影響（3 scenario）
- [ ] 3.6 補件後退件歸屬測試：稿反覆被退、跨 reviewer、Round 1 不計首審歸屬（3 scenario）
- [ ] 3.7 退件率排除 `source='免審稿'` Round 測試
- [ ] 3.8 離職 reviewer 歷史統計保留測試（primaryContributorId 不受 reviewer.active 變動）

## 4. SupervisorDashboard UI 擴充

- [ ] 4.1 於既有 `SupervisorDashboard.tsx` L1 今日營運 4 格卡片下方新增「審稿環節經營指標」2 格 highlight card（平均滯留天數、退件 >3 輪訂單數）
- [ ] 4.2 擴充「審稿人員對比表」欄位：新增訂單合格數、退件印件數、退件次數、補件後退件印件數、補件後退件次數 5 欄；並列呈現
- [ ] 4.3 對比表時間範圍加入「不限」選項；預設值改為「本月」
- [ ] 4.4 對比表排序改為**預設依姓名字母序**；新增 header 點擊排序功能（降冪 → 升冪 → 回預設的三態切換）
- [ ] 4.5 對比表離職 reviewer 處理：當期無 Round → 不顯示 row；有歷史統計時姓名旁加「（已離職）」標註
- [ ] 4.6 新增 Tab「客戶審稿成果」，對應欄位：客戶 / 訂單合格數 / 退件印件數 / 補件後退件次數 / 反覆退件訂單數；預設依反覆退件訂單數降冪
- [ ] 4.7 「補件後退件」與「平均處理時間」欄位 header 加 tooltip 警示（僅作觀察用 / 含排隊時間）
- [ ] 4.8 **MUST NOT** 保留任何「審稿王」「冠軍」「最佳」等排名性質元件

## 5. 審稿總覽時間維度統一（Spec 併入，Prototype 已完成）

> Prototype 已於前一 commit 實作（`b34aa4e refactor(審稿): 統一日期維度為「審稿完成時間」並拆分 Summary`），本區塊僅負責驗證實作與 spec 完全對齊。

- [ ] 5.1 確認 `matchesReviewerListTimeRange` 實作符合 spec「時間區間語意統一定義」
- [ ] 5.2 確認 ReviewerInbox / InProgressItems 時間區間欄位含「不限」選項、預設「不限」
- [ ] 5.3 確認 Summary Bar 拆分成「手上工作量 · 待處理」+「完成統計 · {區間}」兩組
- [ ] 5.4 驗證六個 Scenario：審稿員打開 Inbox / 主管打開待審印件 / 審稿員切本月對帳 / 主管列出某審稿員某月訂單合格數 / 切換時間即時重算 / 同印件多次出現

## 6. Prototype 驗證（Lovable）

- [ ] 6.1 push 到 Lovable，main branch 部署生效
- [ ] 6.2 以 mock 資料觸發四個業務情境驗證：
  - 情境 A：小陳獨立完成訂單 → Order.prepressApprovedAt 寫入 + 對比表訂單合格數 +1
  - 情境 B：印件反覆退件（Round 1 退 → Round 2 退 → Round 3 合格）→ 退件次數 / 補件後退件次數差異可見
  - 情境 C：跨月訂單（9/28 首印件合格、10/2 最後印件合格）→ `Order.prepressApprovedAt = 10/2`，10 月 Dashboard 訂單合格數 +1，9 月不計
  - 情境 D：9/20 達成合格寫入後、10/1 因客戶變更重建新印件退件 → `Order.prepressApprovedAt` 不清空；Dashboard「退件後重審中訂單數」+1（若有實作）；9 月歷史不變
- [ ] 6.3 主管登入驗證：
  - 審稿環節經營指標 2 格 highlight card 呈現
  - 對比表無排名元件、預設依姓名、支援 header 排序
  - 客戶審稿成果表 Tab 切換正常
  - 時間範圍切換資料即時重算
- [ ] 6.4 確認整頁**沒有**「審稿王」「冠軍」「最佳」字樣或元件

## 7. Spec 同步與歸檔

- [ ] 7.1 驗證實作與三份 delta spec 所有 Scenario 一致（prepress-review / order-management / business-processes）
- [ ] 7.2 執行 `openspec validate extend-prepress-supervisor-dashboard --strict` 通過
- [ ] 7.3 觸發 doc-audit skill 檢查跨檔案一致性
- [ ] 7.4 將 design.md 的 OQ-1 / OQ-2 / OQ-3 / OQ-4 遷移至 Notion Follow-up DB
- [ ] 7.5 歸檔後用 `/opsx:sync` 將 delta 合併回主 spec（三個 capability）
- [ ] 7.6 Miles 決定是否推送至 Notion Feature Database 發布版本
