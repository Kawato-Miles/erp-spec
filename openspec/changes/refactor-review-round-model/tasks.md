## 1. Spec 審查（三視角 + OQ）— 已完成

- [x] 1.1 OQ 查詢（2026-04-22）：Notion Follow-up DB 無新發現；[file_role 枚舉](https://www.notion.so/3473886511fa812e9189fbc4625b54f8) / [打樣 NG 補件策略](https://www.notion.so/32d3886511fa8123a592c78223483225) 均於先前 change 已定案
- [x] 1.2 三視角輕量審查（2026-04-22，單輪收斂，無方向爭議）
  - `senior-pm`：業務動線對齊；Success Criteria 補 SubmitReviewDialog 頂部 submittedNote + Timeline 外部可讀性兩項 UAT 指標
  - `erp-consultant`：型別 discriminated union 完整性、免審稿 reviewedFiles 語意污染、D3 同步表觸發點補強
- [x] 1.3 三題 Open Questions 收斂：
  - **OQ-A ✅**：本 change 順手清理 legacy `reviewStatus`（見 3.1.4）
  - **OQ-B ✅**：Round 1 先建 `reviewerId=null`，分派 action 稍後 update（見 3.2.4）
  - **OQ-C ✅**：補件 MUST 有新檔（見 spec delta § 業務補件建立新 Round / § 補件僅改備註 SHALL 被拒絕）

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
- [ ] 3.2.4 `confirmSignBack` 拆兩路：
  - **免審稿路徑**：印件建立時系統自動建 Round 1（source=免審稿、result=合格、submittedBy=系統、**reviewedFiles=null**、submittedFiles=客戶原檔）
  - **需審稿路徑**：Round 1 已由 `uploadArtworkFile` 建（reviewerId=null 或已分派）；`confirmSignBack` 只 update Round 1 的 `reviewerId` 為分派結果，**不新建 Round**
- [ ] 3.2.5 下游工單建立時取終稿的邏輯補 source 判斷：`source === '免審稿' ? submittedFiles : reviewedFiles`
- [ ] 3.2.6 所有 action 結尾保留 `applyOrderReviewBubbleUpForOrder` 呼叫（不影響 Order 層）
- [ ] 3.2.7 單元測試：各種情境組合 → Round 結構與印件狀態欄位同步
- [ ] 3.2.8 `startResupplyRound` 必須驗證 `files.length >= 1`，否則拒絕並回傳 `{ success: false, error: '補件必須提供至少一份新印件檔' }`

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
- [ ] 3.5.5 **Invariant assertion**（測試工程基本水準）：每個情境驗證結尾斷言 `printItem.reviewDimensionStatus === derive(printItem.rounds)`，防止 Round[] 與印件狀態欄位不同步
- [ ] 3.5.6 `ResupplyDialog` 只填備註不上傳檔案的邊界測試：SHALL 被 `startResupplyRound` 拒絕
- [ ] 3.5.7 免審稿印件的 `Round.reviewedFiles` 為 null 驗證；下游工單取檔用 `submittedFiles`（依 source 判斷）

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
