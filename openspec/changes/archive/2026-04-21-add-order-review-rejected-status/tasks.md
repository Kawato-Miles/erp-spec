## 1. Spec 審查（三視角）— 已完成 Round 1+2，共識收斂

- [x] 1.1 `senior-pm` / `ceo-reviewer` / `erp-consultant` 三視角 Round 1+2 討論完成
- [x] 1.2 OQ 查詢完成（[XM-006 審稿不合格通知管道](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 既存未解，列入後續 change）
- [x] 1.3 共識修正項目（命名「待補件」/ 規則 4 修正 / 追加印件走新訂單 / 技術債記帳 / 通知協同）寫入 proposal + design + delta spec
- [ ] 1.4 最終 artifacts 完稿後 senior-pm 最後過目（本 change 歸檔前一次，非 Round 3 討論）

## 2. Spec 正式化

- [ ] 2.1 跑 `openspec validate add-order-review-rejected-status --strict` 通過
- [ ] 2.2 grep 檢查 `specs/state-machines/spec.md` delta 本文應零出現「審稿不合格」字面量（Requirements / Scenarios 一律用「待補件」；proposal 與 design 的歷史敘述 / XM-006 OQ 名稱可保留）
- [ ] 2.3 Scenarios 明示涵蓋 S1~S5 + S10 + QC 邊界（scope 驗證）

## 3. Prototype 實作（`sens-erp-prototype` repo）

### 3.1 型別與 Badge
- [ ] 3.1.1 `src/types/order.ts` `OrderStatus` 加「待補件」字面量
- [ ] 3.1.2 `src/components/order/OrderStatusBadge.tsx` 新增「待補件」樣式（紅色系，對齊 `ReviewDimensionStatusBadge`「不合格」色票 `#FDE8E8` / `#B91C1C`）
- [ ] 3.1.3 `src/pages/OrderList.tsx` `ALL_STATUSES` 陣列加「待補件」於「等待審稿」之後

### 3.2 Bubble-up util
- [ ] 3.2.1 `src/store/useErpStore.ts` 新增 `deriveOrderReviewStatus(current, printItems)` util（依 design.md D4 實作，含規則 4「至少一件送審過」前提）
- [ ] 3.2.2 新增 `applyOrderReviewBubbleUp(orders)` 或擴充現有 `applyOrderBubbleUp` 合併呼叫（tasks 判斷哪個合理）
- [ ] 3.2.3 單元測試：各種印件狀態組合 → 正確派生 Order.status

### 3.3 Action 觸發串接
- [ ] 3.3.1 `submitReviewForPrintItem` 結尾呼叫 bubble-up
- [ ] 3.3.2 `onResupplyCompleted`（`OrderDetail.tsx` / `MockEcOrderDetail.tsx` 的 onResupply 寫回處）呼叫 bubble-up
- [ ] 3.3.3 `uploadArtworkFile`（印件首次上傳稿件時可能觸發「稿件未上傳 → 等待審稿」）呼叫 bubble-up
- [ ] 3.3.4 `confirmSignBack`：確認新邏輯與現有自動分配 + 免審稿路徑相容

### 3.4 Mock 資料與情境驗證
- [ ] 3.4.1 `src/data/mockOrders.ts` 補一筆「待補件」狀態訂單示範（包含至少一件不合格印件）
- [ ] 3.4.2 `scenarioCoverage.test.ts` 或獨立測試檔補五情境斷言：
  - **A（S3 / S4）**：單印件不合格 → Order 進「待補件」→ 補件 → Order 回「等待審稿」→ 合格 → Order 進「製作等待中」
  - **B**：多印件其中一件不合格 → Order 維持「待補件」直到該件補件並通過
  - **C**：免審稿訂單 → Order 不經過「待補件」
  - **D（打樣 NG 原訂單新增免審稿印件）**：原訂單處於製作段 → 棄用原印件 + 於**原訂單**新增免審稿印件 → Order 維持當前製作段狀態（bubble-up 不觸發）
  - **D'（同印件追加製作走新訂單，X6 out of scope）**：客戶追加製作量 → 開**新訂單** → 原訂單狀態不受影響；新訂單正常走 bubble-up
  - **E（S10）**：混合「免審稿合格 + 需審稿未上傳」→ Order 維持「稿件未上傳」直到需審稿印件上傳稿件（狀態轉為「等待審稿」）
- [ ] 3.4.3 移除「並行補件 race condition」測試（S11 已從 scope 移除）

## 4. UI 驗證（Lovable）

- [ ] 4.1 `OrderList` 顯示「待補件」訂單時 Badge 為紅色、可被篩選
- [ ] 4.2 `OrderDetail` 頁面訂單狀態區呈現「待補件」無錯位
- [ ] 4.3 業務補件完成後，`OrderList` 該訂單由「待補件」變為「等待審稿」（real-time reflect）
- [ ] 4.4 審稿人員送出最後一件合格後，Order 進「製作等待中」（離開審稿段）
- [ ] 4.5 免審稿路徑 Order 狀態從「已付款」/「已回簽」直達「製作等待中」，無跳「待補件」
- [ ] 4.6 混合免審稿 + 需審稿未上傳訂單顯示為「稿件未上傳」（非誤派為「等待審稿」）
- [ ] 4.7 推送 Lovable 後由 Miles 手動驗證

## 5. 歸檔前檢查

- [ ] 5.1 `openspec validate add-order-review-rejected-status --strict` 通過
- [ ] 5.2 Prototype 驗證通過
- [ ] 5.3 `doc-audit` skill 跨檔案一致性檢查
- [ ] 5.4 `/opsx:archive`

## 6. 歸檔後

- [ ] 6.1 `CLAUDE.md` § Spec 規格檔清單檢視 order-management / state-machines 版本是否需更新標記
- [ ] 6.2 判斷是否推 Notion Spec 發布版本（累積數個 change 後批次推送）
- [ ] 6.3 **立即推進 [OQ XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 後續 change**（審稿不合格通知管道）—— 避免「待補件」長期無下游消費者淪為 zombie status（design.md D8）
- [ ] 6.4 建立風險追蹤項：若後續出現「第 2 個段落內例外維度需求」（退貨 hold / 急單 hold / 客訴 hold），立案時 MUST 重新評估是否重構為正交維度模型（design.md D7）
