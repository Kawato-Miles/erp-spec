## 1. Type 層

- [x] 1.1 `src/types/prepressReview.ts` 擴 `ReviewRoundSource` 加 `'售後補印'` 值
- [x] 1.2 `src/types/prepressReview.ts` `ReviewRound` interface 加 `sourcePrintItemId?: string` optional 欄位（標明補印來源印件 ID）
- [x] 1.3 `src/types/order.ts` PrintItemType 補印印件註解同步：「跳過審稿（自動通過輪次）→ 工單 → 排程 → 生產任務 → QC → 出貨」

## 2. Store 層

- [x] 2.1 `src/store/useErpStore.ts` `addReprintPrintItemFromTicket` 改寫審稿欄位處理：
  - `reviewStatus = '合格'`
  - `reviewFiles` 拷貝來源印件
  - `reviewRounds` 拷貝來源印件 + append 自動通過輪次（source = '售後補印'、sourcePrintItemId = 來源 ID、submittedBy = '系統'、result = '合格'、roundNo = 來源最後一輪 + 1）
  - `currentRoundId` 指向新建的自動通過輪次
  - `assignedReviewerId = null`
  - `skipReview = false`（不變）
  - `reviewActivityLogs` 拷貝來源 + append「售後補印自動通過審稿」事件
  - `printItemStatus = '待生產'`（不變）

## 3. UI 層（最小改動）

- [x] 3.1 確認補印印件詳情頁能正確顯示自動通過輪次（既有 ReviewRound 列表 UI 應自然顯示）
- [x] 3.2 確認補印印件在審稿員「等待審稿」工作清單**不出現**（既有 filter 應自然排除 reviewStatus = '合格' 的印件）
- [x] 3.3 確認補印印件在印務主管「印件總覽」立刻出現於「等待中」分類（既有 filter 應自然包含 printItemStatus = '待生產'）

## 4. e2e 驗證

- [x] 4.1 Playwright e2e：業務於 ticket 內建補印 → 斷言新建 PI reviewStatus = '合格' + currentRoundId 非空 + reviewRounds 含自動通過輪次（source = '售後補印'、sourcePrintItemId = 來源印件）
- [x] 4.2 Playwright e2e：補印 PI 的 reviewFiles 數量 = 來源印件的 reviewFiles 數量（拷貝完整）
- [x] 4.3 Playwright e2e：補印 PI 不出現在 reviewer 的「等待審稿」清單（reviewStatus = '合格' 排除）
- [x] 4.4 Playwright e2e：補印 PI 立刻出現在印務主管「印件總覽」（依 printItemStatus = '待生產' 分類）
- [x] 4.5 console.error / pageerror 嚴格斷言 = 0
- [x] 4.6 全部既有 e2e 跑通無回歸

## 5. 歸檔與同步

- [x] 5.1 OpenSpec validate + archive
- [x] 5.2 sync main spec：`openspec/specs/after-sales-ticket/spec.md`（MODIFY § Requirement: 與 PrintItem 關聯（補印觸發））
- [x] 5.3 更新 CLAUDE.md § Spec 規格檔清單版本號（after-sales-ticket v0.4 → v0.5）
- [x] 5.4 commit + push

## 6. 開立 OQ 卡

- [x] 6.1 觸發 `oq-manage` mode B 開立 3 個 OQ 卡（含去重檢查）：
  - OQ-SP-1（PI- 命名空間或 AFT-）「補印改稿」情境入口設計
  - OQ-SP-2 補印自動通過後印務發現稿件問題的標準動作
  - OQ-SP-3 補印印件詳情頁 UI 是否需要視覺強調「來源稿件連結」
