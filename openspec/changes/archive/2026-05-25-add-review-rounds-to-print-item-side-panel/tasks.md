## 1. 前置調查與 reviewer lookup helper 接線（D5' 修訂）

> **apply 階段修訂**：原 D5 改為 D5'（不動 deprecated `reviewerNames: string[]`、新增 `reviewerNameOf` prop 直接複用 OrderDetail.tsx 既有 helper）。詳見 design.md § D5。

- [x] 1.1 grep `reviewerNames` 找出消費點（**發現**：6 個檔案使用、但 `PrintItemArtworkCard → CurrentArtworkCard.buildArtworkSummaryItems` 鏈中 `reviewerNames` 已 deprecated；`OrderDetail.tsx:1432-1436` 內已有 `reviewerNameOf` by-id helper）
- [x] 1.2 確認 `OrderDetail.tsx` 既有 `reviewerNameOf: (rid: string | null) => string` helper（覆蓋 `REVIEWER_SUPERVISOR` + `PREPRESS_REVIEWERS` + null 三 case），可直接複用
- [ ] 1.3 在 `PrintItemDetailSidePanel.tsx` Props interface 新增 `reviewerNameOf: (rid: string | null) => string` prop
- [ ] 1.4 在 `OrderDetail.tsx` PrintItemDetailSidePanel 呼叫處新增 `reviewerNameOf={reviewerNameOf}`（hoist 既有 helper 至元件 top scope 以重用、目前定義在 ResupplyDialog 渲染函式內）

## 2. PrintItemDetailSidePanel 新增「審稿紀錄」第四區塊

- [ ] 2.1 在 `src/components/order/PrintItemDetailSidePanel.tsx` 第三 ErpDetailCard「相關工單」結尾（line 189）後新增第四 `<ErpDetailCard title="審稿紀錄">`
- [ ] 2.2 inline 撰寫 `<table className="erp-table">` + thead 7 欄（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註）
- [ ] 2.3 實作 tbody map：`[...printItem.reviewRounds].sort((a, b) => b.roundNo - a.roundNo).map(round => ...)`
- [ ] 2.4 實作審稿人員欄文案規則（依 D4）：
  - `source = '審稿'` + `reviewerId` 有值 → `reviewerNames[reviewerId]`
  - `source = '審稿'` + `reviewerId` 為 null → 「待分派」
  - `source = '免審稿'` → 「系統免審」
  - `source = '售後補印'` → 「系統沿用」
- [ ] 2.5 實作結果欄文字加色（依 D3 色碼）：
  - `result = '合格'` → 預設色
  - `result = '不合格'` → `style={{ color: '#dc2626' }}`
  - `result = null`（待審）→ `style={{ color: '#C97A00' }}`，文字「待審」
- [ ] 2.6 實作退件分類欄：`{round.rejectReasonCategory || '—'}`
- [ ] 2.7 實作備註欄：`<td className="line-clamp-2 max-w-[200px]" title={round.reviewNote}>{round.reviewNote || '—'}</td>`
- [ ] 2.8 實作空狀態：`reviewRounds.length === 0` 顯示 `<p className="py-3 text-center text-muted-foreground text-sm">此印件尚未送審</p>`（沿用第 3 區塊「尚無工單」樣式）
- [ ] 2.9 更新檔案頂部 jsdoc 註解（line 28-32 「三區塊」描述改為「四區塊」並列出新區塊）

## 3. e2e 測試擴充（refine-order-detail-tabs.spec.ts）

- [x] 3.1 在 `sens-erp-prototype/e2e/refine-order-detail-tabs.spec.ts` 既有「點檢視按鈕開啟 PrintItemDetailSidePanel + 三區塊」test 擴充第四區塊斷言（驗證「審稿紀錄」標題可見 + ORD-20260415-01 印件 reviewRounds=[] → 「此印件尚未送審」空狀態，**同時 cover § 3.3**）
- [x] 3.2 新增 test「審稿紀錄區塊顯示 reviewRounds 7 欄表格 + 結果加色 + 退件分類 + 備註 tooltip」：用 ORD-20260419-04（B2B 大方文創，印件含 1 輪 source=審稿/不合格 reviewRound 含 reviewNote）→ 開 SidePanel → 斷言 thead 7 欄 + 第 1 輪在 row 0 + 結果欄 = 「不合格」+ inline style color #dc2626 + 退件分類 = 「出血不足」+ 備註欄 line-clamp-2 class + title attribute 含完整 reviewNote。**同時 cover § 3.6 備註 tooltip**
- [x] 3.3 「審稿紀錄空狀態」測試已併入 § 3.1（ORD-20260415-01）
- [ ] 3.4 **TODO（mock data 不足）**：新增 test「免審稿輪次審稿人員 = 系統免審」需 mock data 含 source=`免審稿` 印件含對應 ReviewRound；目前 mock 無此範例（spec Scenario 已描述、e2e file 已加 TODO 註解）
- [ ] 3.5 **TODO（mock data 不足）**：新增 test「售後補印輪次審稿人員 = 系統沿用」需 mock data 含 source=`售後補印` 補印 PrintItem 含對應 ReviewRound；目前 mock 無此範例（spec Scenario 已描述、e2e file 已加 TODO 註解）
- [x] 3.6 「備註 hover tooltip」測試已併入 § 3.2
- [x] 3.7 跑 `npx playwright test e2e/refine-order-detail-tabs.spec.ts`：**7 個 test 全部通過、console.error / pageerror 為零**

## 4. Figma 視覺對齊驗證

- [x] 4.1 preview_start `vite-dev` 在 localhost:8080；resize viewport 至 1440x900 確認 SidePanel size=lg 寬度 600px
- [x] 4.2 開 `/orders/ORD-20260419-04?tab=printItems` → 點檢視印件詳情按鈕 → SidePanel 開啟、四區塊正確渲染
- [x] 4.3 驗證 4 個 anchor：
  - **區塊間距**：4 個 section 使用 `space-y-6` = 24px 垂直間距、與 Figma 一致 ✓
  - **標題字級**：各 section 用 `<h3 className="text-base font-semibold mb-2">`、無 ErpDetailCard 外框 ✓
  - **7 欄寬度節奏**：apply 重做後 SidePanel size 從 lg 升為 xl（720px），審稿紀錄表格實測 631px 完整顯示無溢出（已移除 overflow-x-auto / whitespace-nowrap）✓
  - **結果欄文字色碼**：「不合格」inline style `color: rgb(220, 38, 38)` = `#dc2626` 經 DOM inspect 驗證 ✓
- [x] 4.4 design.md § R3 / D1 更新：原 overflow-x-auto mitigation 廢棄，改為 SidePanel size lg → xl；D1 從「沿用 PrintItemSpecCard / PrintItemArtworkCard 共用元件」改為「直接 inline 用 ErpInfoTable 寫 4 個 section」

## 4b. SidePanel layout 重做對齊 Figma（apply 階段 Miles 視覺對齊發現後執行）

> **背景**：初版實作沿用 PrintItemSpecCard / PrintItemArtworkCard / ErpDetailCard 共用元件，但實際視覺對比 Figma node-id `8977:269607` 後發現外框過多、ErpSummaryGrid 不對齊 Figma 「左灰右白 2 欄 table」結構、印件檔案沒水平排列、SidePanel size 偏窄。Miles 要求「side bar 要和 figma 完全一樣」、本節記錄重做動作。

- [x] 4b.1 重寫 `PrintItemDetailSidePanel.tsx`：
  - 移除 ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard 包裝
  - 4 個 section 採 `<section><h3>...</h3>{內容}</section>` 結構
  - Section 1 印件資訊：兩個 ErpInfoTable（系統欄位單欄 + 印件屬性 cols=2 + 備註 span=2 跨欄）
  - Section 2 印件檔案：ErpInfoTable 3 行 + `FileChips` 內部水平 flex 排列
  - Section 3 / 4 維持 `.erp-table` 表格
- [x] 4b.2 SidePanel size lg → xl（600px → 720px）
- [x] 4b.3 移除 overflow-x-auto / whitespace-nowrap（不再需要）
- [x] 4b.4 OrderDetail.tsx 已既有傳 `reviewerNameOf` prop，無需異動
- [x] 4b.5 e2e 全部 7 個 test 通過、console.error / pageerror 為零（h3 內含「印件資訊 / 印件檔案 / 相關工單 / 審稿紀錄」標題，既有 getByText 斷言仍生效）
- [x] 4b.6 dev server 視覺確認：dialog 720px、審稿紀錄表格 631px overflow=0、各 section 對齊 Figma 樣式

## 5. 主動收尾（依 CLAUDE.md § 主動收尾）

- [x] 5.1 觸發 `doc-audit` skill：Step 1 索引層通過（1 條 ℹ️ 與本變更無關）+ Step 2 跨檔案邏輯一致性全通過（source enum 三值在 prepress-review spec / 印件實體卡 / Prototype prepressReview.ts 三處對齊）+ Step 3 無新稽核維度需求
- [x] 5.2 確認本次無 Vault 卡異動（純 UI 層 + spec drift fix、不觸發 `vault-audit`）
- [x] 5.3 確認本次無新 OQ、無解答既有 OQ；ORD-016 與本變更正交（不觸發 `oq-manage`）
- [x] 5.4 **archive 前 spec drift 修正完成**：`openspec/specs/prepress-review/spec.md:126` § ReviewRound 資料模型 § source enum 已從「審稿 / 免審稿」擴為「**審稿 / 免審稿 / 售後補印**」+ 補述「售後補印 source 由 after-sales-ticket 模組於補印 PrintItem 建立同 transaction 系統自動產生（refine-supplementary-print-skip-review 2026-05-20 歸檔），沿用來源印件最終合格稿件、reviewerId 為 NULL、result 自動 = 合格、`sourcePrintItemId` 指向來源印件；詳見 [印件實體業務語意](../../../memory/erp/ERP_Vault/05-entities/印件.md) § 補印印件特殊規則」+ submitted_at 補述售後補印路徑時間
- [ ] 5.5 確認 CLAUDE.md § Spec 規格檔清單訂單管理列的版本與狀態（archive 時更新為 v1.8）
- [x] 5.6 確認 ERP_Vault 內既有卡（[[../../memory/erp/ERP_Vault/05-entities/印件]] / [[../../memory/erp/ERP_Vault/04-business-logic/稿件管理規則]] 等）無需異動（純 UI 層變更、不動商業語意）

## 6. 三視角審查（specs / design 完成後執行，依變動性質分級）

- [x] 6.1 已執行 `erp-consultant` 單 agent 輕量審查（propose 階段尾聲、specs / design 完成後）：5 條發現（1 Medium、4 Low/Confirm）；對照誤審案例無重蹈
- [x] 6.2 未觸發 senior-pm / ceo-reviewer：本變更業務目標 / 商業 KPI 無交集、Miles 於 plan 階段已收斂問題框架
- [x] 6.3 erp-consultant Medium 發現「prepress-review spec L126 source enum 落後實作（兩值 vs 實作三值）」→ 已於 § 5.4 修正；Low 發現「補印 source tooltip」建議 prototype 試用後再決、不在本 change 範圍；其餘 Confirm 項無修訂
