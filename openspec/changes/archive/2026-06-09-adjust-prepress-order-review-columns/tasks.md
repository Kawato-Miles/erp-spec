## 1. 訂單層欄位調整（OrderReviewView.tsx 母列）

- [x] 1.1 訂單母列新增「案名」欄（`order.caseName`），依 spec 順序置於「客戶」與「客戶交期」之間（訂單編號 / 客戶 / 案名 / 交期 / 距交期）。驗證：dev server 開 `/prepress/by-order`，母列出現案名欄且值正確。
- [x] 1.2 移除訂單母列「審稿停留 / 退件率」欄（含表頭與資料 cell，移除對 `computeOrderReviewDwellDays` / `computeOrderRejectionRate` 的引用）。驗證：母列不再出現停留天數 / 退件率；列表頂部「逾期訂單數」summary 仍保留（`isOrderOverdueInReview` 不動）。

## 2. 印件層欄位調整（OrderReviewView.tsx 子列）

- [x] 2.1 移除印件子列「印件狀態」欄（`pi.printItemStatus` + `PrintItemStatusBadge`），保留「審稿狀態」（`reviewDimensionStatus` + `ReviewDimensionStatusBadge`）為唯一狀態標示。驗證：展開訂單後子列不再出現印製維度狀態。
- [x] 2.2 印件子列新增 4 欄（取自「我的待審」ReviewerInbox、扣除訂單層重疊）：印件編號（`pi.printItemNo`）、難易度（`pi.difficultyLevel` + `DifficultyLevelBadge`）、客戶稿件備註（`pi.clientNote`）、印件交期（`pi.deliveryDate`）。驗證：展開訂單後子列出現此 4 欄且值正確；客戶稿件備註過長時以既有截斷樣式呈現。
- [x] 2.3 確認子列「負責審稿」維持既有「我 / 其他審稿」標示語意（本次不改為顯示姓名），「去審 / 唯讀」操作不變。驗證：自己負責印件顯示「去審」可跳轉，非自己負責顯示唯讀。

## 3. 孤兒函式與測試清理（prepressReview.ts）

- [x] 3.1 移除 `utils/prepressReview.ts` 的 `computeOrderReviewDwellDays`、`computeOrderRejectionRate`（移除欄位後成孤兒）。保留 `computeOrderDeadline` / `computeOrderDaysToDeadline` / `isOrderOverdueInReview`（距交期 + 逾期 summary 仍用）。驗證：`grep computeOrderReviewDwellDays\|computeOrderRejectionRate src/` 無剩餘引用。
- [x] 3.2 移除 `utils/__tests__/prepressReview.test.ts` 中對應的單元測試（停留天數 describe 3 項 + 退件率 describe 2 項）。驗證：`npm test -- prepressReview` 通過、無 import 失效。

## 4. 驗證與一致性

- [x] 4.1 跑單元測試：`npm test`，全部通過（含調整後的 prepressReview 測試）。
- [x] 4.2 跑審稿 e2e：`npx playwright test prepressReview`，21 項通過（store/邏輯層不受欄位調整影響，驗證無回歸）。
- [x] 4.3 視覺驗證（preview）：開 `/prepress/by-order`，訂單層有案名、無停留/退件率；展開後印件層有印件編號/難易度/客戶稿件備註/印件交期、無印件狀態。截圖佐證。
- [x] 4.4 spec 一致性自查：prepress-review 兩 Requirement 與 prototype 欄位對齊；user-roles 審稿主管職責已移除脈絡視圖的停留天數監看項。確認無 spec 描述與 prototype 漂移。
