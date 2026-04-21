## 1. Spec 審查（三視角 + OQ）

- [ ] 1.1 OQ 查詢：跑 `oq-manage`（模式 A）確認 Notion Follow-up DB 對應 Round 模型 / ActivityLog 清理的既存 OQ
- [ ] 1.2 三視角輕量審查（資料模型重構風險低，不必走 2 輪完整討論；主要 validate 型別 + 同步規則）
  - `senior-pm`：驗證業務動線對齊（印件建立 → 送審 → 審稿 → 合格 / 不合格迴圈）
  - `erp-consultant`：驗證型別層約束、mock 遷移策略、ActivityLog 清理邊界
  - `ceo-reviewer`：驗證工作量與回報（是否值得現在重構）
- [ ] 1.3 三題 Open Questions 收斂（OQ-A 清理 reviewStatus / OQ-B Round 1 reviewerId 時序 / OQ-C 補件僅改備註）

## 2. Spec 正式化

- [ ] 2.1 撰寫 `specs/prepress-review/spec.md` delta（MODIFIED: ReviewRound 資料模型 / 印件 ActivityLog 事件型別 / 審稿人員送審作業 / 補件 Requirements）
- [ ] 2.2 `openspec validate refactor-review-round-model --strict` 通過

## 3. Prototype 實作（`sens-erp-prototype` repo）

### 3.1 型別層
- [ ] 3.1.1 `src/types/prepressReview.ts` ReviewRound 重構為 discriminated union（D6）
- [ ] 3.1.2 `src/types/prepressReview.ts` PrintItemActivityType 移除 `稿件上傳` / `補件完成` 兩值
- [ ] 3.1.3 `src/types/workOrder.ts` PrintItemFile.roundId 改為必填 string
- [ ] 3.1.4（若 OQ-A 採納）`src/types/order.ts` 清理 legacy ReviewStatus（`待審稿` / `審稿中` / `免審稿` 相容值）

### 3.2 Store actions（新結構）
- [ ] 3.2.1 `uploadArtworkFile` 改為先建 Round 1（待審）再把檔案綁 Round 1 `submittedFiles`
- [ ] 3.2.2 `submitReviewForPrintItem` 改為**更新當前 Round 的審稿端欄位**（不是新建 Round）；合格路徑繼續觸發建工單
- [ ] 3.2.3 新增 `startResupplyRound(printItemId, files, note, actor)` — 業務補件完成時建新 Round N+1（待審），新檔案綁 `submittedFiles`，`submittedNote` 存備註
- [ ] 3.2.4 `confirmSignBack`：免審稿路徑時系統自動建 Round 1（source=免審稿、result=合格、submittedBy=系統、reviewedFiles=客戶原檔）
- [ ] 3.2.5 所有 action 結尾保留 `applyOrderReviewBubbleUpForOrder` 呼叫（不影響 Order 層）
- [ ] 3.2.6 單元測試：各種情境組合 → Round 結構與印件狀態欄位同步

### 3.3 UI 元件（三個強化位置）
- [ ] 3.3.1 `ReviewRoundTimeline` 加欄位：送審時間、送審者、送審備註（分成 submittedNote / reviewNote 兩欄）
- [ ] 3.3.2 `SubmitReviewDialog` 頂部加「上一輪送審備註」區塊（對稱於 ResupplyDialog 的退件摘要）
- [ ] 3.3.3 `ActivityLogTimeline` 移除 `稿件上傳` / `補件完成` 的渲染分支（或保留但標為 deprecated 等 mock 遷移完刪）
- [ ] 3.3.4 `ResupplyDialog` onResupply callback 改呼叫 `startResupplyRound` action（不再寫 ActivityLog `補件完成` 事件）

### 3.4 Mock 資料遷移
- [ ] 3.4.1 建 helper `migrateLegacyRounds(printItem)`：把舊 Round + 浮動檔案 + ActivityLog 事件轉為新結構
- [ ] 3.4.2 `src/data/mockPrepressReview.ts` seed 重建所有 Round 符合新結構
- [ ] 3.4.3 `src/data/mockOrders.ts` / `mockQuotes.ts` seed 連動
- [ ] 3.4.4 `src/test/scenarios/scenarioCoverage.test.ts` 斷言改為驗新結構（每個情境驗 Round 狀態 + 印件層 `reviewDimensionStatus` 對齊）
- [ ] 3.4.5 所有 `PrintItemFile.roundId = null` 實例清零（TypeScript 編譯期檢查）

### 3.5 回歸驗證
- [ ] 3.5.1 五情境（A 單件 / B 多件 / C 免審稿 / D 打樣 NG 原訂單新免審稿 / E EC 混合）全部通過
- [ ] 3.5.2 Order 層「待補件」bubble-up 不受影響（前 change 成果）
- [ ] 3.5.3 補件備註在三個位置可見（ReviewRoundTimeline / SubmitReviewDialog / ResupplyDialog）
- [ ] 3.5.4 `稿件上傳` / `補件完成` ActivityLog 事件全部消失（全域 grep 驗證）

## 4. UI 驗證（Lovable）

- [ ] 4.1 推送 Lovable 後 Miles 手動驗證
  - 補件流程完整走一次：審稿人員審不合格 → 業務看退件摘要補件 + 填 submittedNote → 審稿人員打開 SubmitReviewDialog 看上一輪 submittedNote → 合格送審
  - ReviewRoundTimeline 顯示三輪清楚的送審 / 審稿紀錄
  - ActivityLog 只剩分配 / 覆寫 / 狀態轉移 / 備註修改等事件
- [ ] 4.2 免審稿快速路徑：Round 1 source=免審稿，Timeline 顯示正確

## 5. 歸檔前檢查

- [ ] 5.1 `openspec validate refactor-review-round-model --strict` 通過
- [ ] 5.2 Prototype 驗證通過
- [ ] 5.3 `doc-audit` 跨檔案一致性
- [ ] 5.4 `/opsx:archive`

## 6. 歸檔後

- [ ] 6.1 判斷是否推 Notion Spec 發布版本（審稿模組 BRD v0.2 → v0.3 可能需要補 Data Model 章節）
- [ ] 6.2 推進 [OQ XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 後續 change（補通知機制，降低「待補件」zombie status 風險）
- [ ] 6.3 若 OQ-A 未在本 change 清理 `reviewStatus` legacy，記入後續清理工作
