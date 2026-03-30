## 1. Delta Specs 修正

- [x] 1.1 修正狀態機 delta spec § 收回 Requirement：「生管」→「印務」

## 2. Prototype 實作

- [x] 2.1 工單詳情頁新增「異動」按鈕（前置條件：工單狀態為工單已交付或製作中）
- [x] 2.2 異動編輯介面：生產任務編輯（新增/作廢/報廢/修改欄位）
- [x] 2.3 異動送出表單：「是否需重新審核製程」toggle + 異動原因（必填）
- [x] 2.4 生管日程面板異動確認區：顯示異動類型（不需審核/需重新審核）、來源狀態、確認後路徑提示
- [x] 2.5 工單詳情頁異動歷史列表：顯示 modificationType、sourceStatus、changesSummary
- [x] 2.6 供應商平台：任務作廢/報廢狀態呈現（跳過 — 屬 supplier-portal change 範圍，本次僅確保 type 支援）
- [x] 2.7 模擬資料準備（mockWorkOrders + mockSchedulePanel 已更新新欄位）

## 3. 驗證

- [x] 3.1 驗證不需審核路徑：異動 → 生管確認 → 返回原狀態
- [x] 3.2 驗證需重新審核路徑：異動 → 生管確認 → 重新確認製程 → 送審 → 審核
- [x] 3.3 驗證異動期間製作中任務持續運作（修正 bug：製作中任務不修改屬性）
- [x] 3.4 驗證供應商平台作廢/報廢呈現
- [x] 3.5 跨文件一致性：delta specs vs design vs prototype 行為一致
