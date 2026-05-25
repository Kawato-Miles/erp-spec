## Context

訂單詳情頁印件 Tab 第一層已於 2026-05-21 [refine-order-detail-tabs](../archive/2026-05-21-refine-order-detail-tabs/) 完成 14 欄主表精簡，印件詳情 Side Panel（`PrintItemDetailSidePanel`）由「檢視」按鈕觸發、承載「印件資訊（PrintItemSpecCard）/ 印件檔案（PrintItemArtworkCard）/ 相關工單表格」三區塊。

當前 SidePanel 缺少審稿輪次歷史，業務 / 印務角色須切換到完整詳情頁才能看「印件經歷哪幾輪審稿、退件原因為何、最終誰判合格」。本變更於既有結構末尾新增第四「審稿紀錄」區塊，沿用「相關工單」表格樣式，補齊 SidePanel 作為「印件補充資訊」載體的職責。

業務 ground truth：
- 多輪送審歷史完整保留為印件層業務常態（[[../../memory/erp/ERP_Vault/04-business-logic/稿件管理規則]] § 五 / 情境 2）
- ReviewRound `source` 三值（`審稿` / `免審稿` / `售後補印`）對應三種建立路徑（[[../../memory/erp/ERP_Vault/05-entities/印件]] § 印件類型 / `prepressReview.ts:30`）
- ReviewRound 模型自 [refactor-review-round-model](../archive/) + [refine-supplementary-print-skip-review](../archive/2026-05-20-refine-supplementary-print-skip-review/) 起包含完整業務 / 審稿雙端欄位（`prepressReview.ts:67-111`）

設計面參考：Figma node-id `8977:269607` 已對齊現有三區塊，本變更為「Figma 三區塊保留 + 末尾補加審稿紀錄表格」。

## Goals / Non-Goals

**Goals:**
- 在 SidePanel 內補齊審稿輪次摘要，讓業務 / 印務不需跳完整詳情頁即可掌握審稿歷史
- 7 欄表格樣式與既有「相關工單」一致，視覺節奏不斷裂
- 三種 `source` 文案差異化（讓使用者一眼分辨「真的有人審 vs 系統免審 vs 系統沿用補印」）
- 既有結構不動（印件資訊 / 印件檔案 / 相關工單三區塊零異動）

**Non-Goals:**
- **不**抽 `ReviewRoundTable` / `ReviewResultBadge` 共用元件（YAGNI；SidePanel 6-7 欄與完整詳情頁 12 欄是不同視覺密度的同類資料、不通用）
- **不**修改 ReviewRound 資料模型（純消費既有欄位）
- **不**修改印件完整詳情頁 § 審稿紀錄 Tab（既有 12 欄完整版維持）
- **不**動 ActivityLog 事件層顯示（保留在完整詳情頁 Tab 範疇）
- **不**動印件 Tab 第一層 14 欄主表
- **不**處理 ORD-016 view/edit Panel 並行邊界（與本變更正交）

## Decisions

### D1：整體 layout inline 寫對齊 Figma（apply 階段重做）

**問題**（apply 階段 Miles 視覺對齊發現）：
原本決策「沿用既有 `PrintItemSpecCard` + `PrintItemArtworkCard` 共用元件」推論 Figma 設計已對齊現有三區塊，但實際視覺對比後發現：
1. `PrintItemSpecCard` / `PrintItemArtworkCard` 都被 `ErpDetailCard` 圓角外框包裝，與 Figma 「無外框、僅標題接內容」結構不同
2. `PrintItemArtworkCard` 用 `ErpSummaryGrid cols={3}` 把「原始 / 審稿後 / 縮圖」排成 3 個 grid cell，與 Figma 「3 行 table 結構、每 cell 內水平排列檔案項」不同
3. 既有共用元件混用 ErpDetailCard + ErpSummaryGrid，整體偏向 dashboard card 風格、不是 Figma 的 excel-style table 風格

**修訂選擇（D1'）**：**直接 inline 寫 4 個 section**，不再透過 `PrintItemSpecCard` / `PrintItemArtworkCard` / `ErpDetailCard` 共用元件。各 section 結構：
- Section header：`<h3 className="text-base font-semibold mb-2">` + section 名稱（無外框、無 background card）
- **Section 1（印件資訊）**：用既有 `ErpInfoTable` 元件（已是 Figma 左灰右白 2 欄 table 結構）
  - 上半 `<ErpInfoTable items={systemItems}>`：訂單編號 / 案名 / 客戶 3 行單欄
  - 下半 `<ErpInfoTable cols={2} items={printItemItems}>`：印件編號 / 印件類型 / 審稿狀態 / 難易度 / 印製狀態 / 免審稿快速路徑 / 訂單來源 / 出貨方式 / 預計產線 等 2 列 grid + 規格備註 / 檔案備註 / 包裝備註 span=2 跨欄
- **Section 2（印件檔案）**：用 `ErpInfoTable items={fileItems}` 3 行、cell value 為 `<FileChips files kind>` helper 元件，內部 `flex items-center gap-X flex-wrap` 水平排列檔案 link / 縮圖
- **Section 3（相關工單）**：`<table className="erp-table">` 6 欄表格（沿用既有結構）
- **Section 4（審稿紀錄）**：`<table className="erp-table">` 7 欄表格（本變更新增）

**理由**：
- `ErpInfoTable` 既有元件本身已是 Figma 「左灰右白 + 細邊框 + rounded-lg」結構，不需新增共用元件
- 移除 `ErpDetailCard` 外框後 layout 完全對齊 Figma，無 card-on-card 視覺
- 4 個 section 各自獨立 inline 寫，便於未來精準調整任一 section 而不牽動共用元件
- 印件詳情頁仍可用 `PrintItemSpecCard` / `PrintItemArtworkCard`（共用元件針對「完整詳情頁」場景使用、SidePanel 為輕量補充資訊載體，採不同 layout 是合理 variant 分流）

**替代方案 A：修改 `PrintItemSpecCard` / `PrintItemArtworkCard` 共用元件對齊 Figma**
- 否決：影響面廣（5+ 消費點都會牽動），且 SidePanel 與印件完整詳情頁本來就是不同 variant、強制統一反而失彈性

**替代方案 B：給共用元件加 `variant` props（如 `variant: 'card' | 'inline'`）**
- 否決：過度設計、SidePanel 一處變體不夠抽 variant 成本

### D1b：審稿紀錄表格樣式（inline `.erp-table`）

**選擇**：在 PrintItemDetailSidePanel.tsx 內直接寫 `<table className="erp-table">` + thead / tbody，與既有第三區塊「相關工單」結構一致。

**理由**：相關工單與審稿紀錄都是「實體層級表格」，採同樣 `.erp-table` class 視覺一致；不抽共用元件（YAGNI、未來印件完整詳情頁若也要 7 欄 SidePanel-style 版本再抽）。

### D2：表格 7 欄（含備註欄、保留送審方式）

**選擇**：輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註，共 7 欄。

**理由**（Miles 於 plan 階段拍板）：
- 業務檢視 SidePanel 時最關心「為什麼被退」（備註 + 退件分類並呈）
- 保留「送審方式」（`source`）讓 `審稿` / `免審稿` / `售後補印` 視覺一目了然，比僅靠「審稿人員」欄文案推斷可靠
- 7 欄略多於「相關工單」6 欄、需略寬留白，但仍可於 SidePanel `size=lg` 寬度承載

**替代方案 A：6 欄不含備註**（推送看完整詳情頁）
- 否決：使用者進 SidePanel 後再跳完整詳情頁才看退件原因，動線重複

**替代方案 B：6 欄不含送審方式**（reviewer 欄文案推斷）
- 否決：使用者需多看一眼「審稿人員」欄文案才能判斷 source、認知負荷上升

### D3：結果欄文字加色（不新增 Badge 元件）

**選擇**：`<span>` 配 destructive / 橘色 / default 文字色，**不**新增 `ReviewResultBadge` 共用元件。

**色碼**（對齊 prepress-review 慣例）：
- `合格` → default（沿用 `.erp-table td` 預設色）
- `不合格` → `#dc2626`（destructive 紅，沿用 shadcn theme `destructive` token）
- `待審`（`result = null`，補件後未審完）→ `#C97A00`（橘色，沿用 prepress-review 既有色碼）

**理由**：
- 既有 prepress-review 完整詳情頁的結果欄即採文字加色（非 Badge），SidePanel 與完整詳情頁視覺風格對齊
- 新增 Badge 元件會把本變更升級為「流程節點調整 → 雙 agent 審查」，性價比低
- `Prototype src/components/shared/` 目前 14 個共用元件無 `ReviewResultBadge`，本次不擴充 surface

### D4：審稿人員欄文案策略

**選擇**：依 `source` + `reviewerId` 雙重判斷：

| source | reviewerId | 文案 |
|--------|-----------|------|
| `審稿` | 有值 | 審稿人員姓名（透過 `reviewerNames` lookup）|
| `審稿` | null | 「待分派」|
| `免審稿` | null | 「系統免審」|
| `售後補印` | null | 「系統沿用」|

**理由**：
- 三個 source 業務語意不同，統一寫「系統」會丟失「為什麼是系統」的脈絡
- 「待分派」覆蓋一般審稿尚未分派場景，與「系統免審」/「系統沿用」明確區分（前者是流程未進、後者是流程跳過）

**替代方案：統一顯示「系統」並由「送審方式」欄背負語意**
- 否決：使用者需雙欄交叉判斷、認知負荷上升

### D5：reviewer name lookup 策略（**implementation 階段修訂**）

**問題**：`PrintItemDetailSidePanel` 既有 `reviewerNames: string[]` props，本變更新增「審稿人員」欄需 by-id lookup（多輪審稿可能對應不同 reviewer）。

**implementation 階段發現**（apply 階段更新）：
1. `reviewerNames: string[]` 在 `PrintItemArtworkCard` → `CurrentArtworkCard.buildArtworkSummaryItems` 鏈中**已 deprecated**（`CurrentArtworkCard.tsx:54` 註解明示「保留以維持簽章相容，但內部不再使用」；2026-04-21 data-consistency-audit change 已改用 `fileRole='審稿後檔案'` 顯式標記）
2. `OrderDetail.tsx:1432-1436` 內**已有 `reviewerNameOf: (rid: string | null) => string` helper**，包含 `REVIEWER_SUPERVISOR` 與 `PREPRESS_REVIEWERS` 完整 by-id lookup 邏輯
3. 改造 `reviewerNames` prop 型別會牽動 6 個檔案（`PrintItemDetailSidePanel` / `PrintItemArtworkCard` / `CurrentArtworkCard` / `OrderDetail` / `WorkOrderDetail` / `ReviewerDetail` / `PrintItemDetail`），且動到 deprecated prop 不必要

**修訂選擇（D5'）**：**新增 `reviewerNameOf: (rid: string | null) => string` prop** 傳給 `PrintItemDetailSidePanel`，直接複用 OrderDetail.tsx 已有的 helper。`reviewerNames: string[]` deprecated prop 不動。

```tsx
// OrderDetail.tsx 已有，直接傳給 SidePanel
const reviewerNameOf = (rid: string | null) => {
  if (rid === null) return '系統';  // SidePanel 內依 source 覆寫為「系統免審 / 系統沿用 / 待分派」
  if (rid === REVIEWER_SUPERVISOR.id) return REVIEWER_SUPERVISOR.name;
  return PREPRESS_REVIEWERS.find((r) => r.id === rid)?.name ?? rid;
};
```

**SidePanel 內審稿人員欄文案邏輯**：
```tsx
function getReviewerLabel(round: ReviewRound, reviewerNameOf: (rid: string | null) => string) {
  if (round.source === '免審稿') return '系統免審';
  if (round.source === '售後補印') return '系統沿用';
  if (round.reviewerId === null) return '待分派';
  return reviewerNameOf(round.reviewerId);
}
```

**理由**：
- 不動 deprecated prop（`reviewerNames: string[]` 無變動、6 個傳入點零異動）
- 跨檔影響從 6 縮為 2（僅 `PrintItemDetailSidePanel.tsx` + `OrderDetail.tsx` 新增一個 prop pass）
- 複用既有 helper（含 supervisor 處理）、零重複邏輯
- 若未來其他頁面（WorkOrderDetail 等）也要顯示審稿紀錄，傳同一個 helper signature 即可、不需引入 Record 結構

**替代方案 A：改 `reviewerNames` 為 `Record<string, string>`**（原 plan D5）
- 否決：動 deprecated prop、跨 6 檔影響、低效

**替代方案 B：在 SidePanel 內加 inline helper 直接用 PREPRESS_REVIEWERS 常量**
- 否決：違反 dumb component 原則、SidePanel 與審稿員常量直接耦合

### D6：排序與空狀態

**排序**：`reviewRounds.sort((a, b) => b.roundNo - a.roundNo)`（最新在最上）。

**空狀態**：`reviewRounds.length === 0` 顯示 `<p className="py-3 text-center text-muted-foreground text-sm">此印件尚未送審</p>`，與既有第三區塊「尚無工單」（`PrintItemDetailSidePanel.tsx:185-187`）視覺一致；**不**用 `ErpEmptyState`（該元件預設 padding 過重、不適合 SidePanel 內表格區塊）。

### D7：備註欄顯示策略

**選擇**：`<td className="line-clamp-2 max-w-[200px]" title={round.reviewNote}>`，CSS 截斷 2 行 + 原生 `title` attribute hover tooltip 顯示完整 1000 字。

**理由**：
- `reviewNote` 最長 1000 字（`prepressReview.ts:117`），SidePanel 內 wrap 多行會破壞表格節奏
- 原生 `title` tooltip 無需引入 shadcn `<Tooltip>` 元件、零依賴
- `line-clamp-2` Tailwind 內建、無需自訂 CSS

### D8：退件分類欄合格 / 待審時顯示「—」

**選擇**：`{round.rejectReasonCategory || '—'}`，與既有 `ReviewRoundTimeline`（如存在）模式一致；合格 / 待審輪次無退件分類欄位值。

## Risks / Trade-offs

| 風險 | Mitigation |
|------|-----------|
| **R1**：D5 改造 `reviewerNames` 型別會牽動既有 PrintItemArtworkCard 等消費點 | tasks.md 內列為前置步驟、改造前先 grep `reviewerNames` 找出所有消費點同步改 |
| **R2**：SidePanel 4 區塊垂直堆疊後內容過長，可能在小螢幕（13" MacBook）需頻繁滾動 | ERP 平台僅支援桌機（≥ 13"）、SidePanel `size=lg` 寬度 ≥ 600px、垂直 scroll 為既有設計；本變更不引入新滾動行為 |
| **R3**：7 欄略寬於 SidePanel 寬度 | **apply 階段最終解（取代原 overflow-x-auto）**：SidePanel size 從 `lg`（600px）改為 `xl`（720px），審稿紀錄表格實測 631px 完整顯示無溢出；不需 overflow-x-auto / whitespace-nowrap 補強（已移除）|
| **R6**（apply 新增）：本變更從「沿用既有共用元件」轉為「inline 寫 layout」可能導致未來其他 SidePanel 變更時樣式分歧 | 4 個 section inline 寫於 PrintItemDetailSidePanel.tsx 內，未來其他類似 SidePanel（如工單 / 訂單詳情 SidePanel）若也要對齊 Figma table 風格，可參照此檔案直接複製或抽共用 SectionTitle helper；目前 SidePanel 只有印件 1 個 variant、抽元件 YAGNI |
| **R4**：與 ORD-016（view/edit Panel 並行邊界）交集 — 本變更擴增 SidePanel 內容、若未來採 ORD-016 候選方案 C（編輯併入 SidePanel），會增加共存複雜度 | 本變更與 ORD-016 正交（純檢視內容增量），不前置鎖死 ORD-016 解法；ORD-016 解決時若採方案 C，新增的審稿紀錄區塊與「編輯模式切換」並存仍是垂直堆疊、無衝突 |
| **R5**：待審輪次 `result = null` 在「結果」欄要顯示什麼？沿用 prepress-review 完整詳情頁顯示「待審」即可 | 文案：「待審」橘色 `#C97A00`；對應 `result === null` 場景（補件後新建 Round 在審稿人員未審完前） |

## Migration Plan

不適用（純 UI 增量、無資料遷移）。

## Open Questions

無新 OQ。既有 [[../../memory/erp/ERP_Vault/08-open-questions/ORD-016-印件SidePanel與編輯Panel並行邊界]] 與本變更正交，**不在本 change scope 解決**（保留 `expected-resolution-at: 2026-06-15`）。

D5 reviewer name lookup 策略已收斂（改 `Record<string, string>`），不留 OQ。
