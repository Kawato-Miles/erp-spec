## Why

現況 `ReviewRound` 資料模型**只綁審稿端行為**（`reviewerId / result / reviewNote / reviewedFiles`），而業務端的送審 / 補件行為被拆散到兩個容器：

- `PrintItemFile.roundId = null` 的**浮動檔案**（業務補件檔等下次送審才綁 Round）
- `PrintItemActivityEvent`（類型 `補件完成` 的 `note` 欄位承載業務補件備註）

造成三個具體缺陷：

1. **補件備註 UI 顯示 Bug**：業務在 `ResupplyDialog` 填的補充備註寫入 `PrintItemActivityEvent.note`，但 [`ActivityLogTimeline.tsx:117-118`](../../../../../sens-erp-prototype/src/components/prepress-review/ActivityLogTimeline.tsx:117) 渲染「補件完成」事件時只顯示「某某完成第 N 輪補件（X 份檔案）」，**note 內容被吞掉**。審稿人員重審時看不到業務想說什麼
2. **檔案浮動語意不一致**：補件階段上傳的 `PrintItemFile.roundId = null`，等審稿人員下次送審時才被綁 Round。查詢「這筆檔案屬於哪一輪」需要時間戳推斷或外鍵 join，綁定邏輯散落
3. **ActivityLog 事件冗餘**：`稿件上傳` / `補件完成` 兩類事件本質只是「業務動作發生」的時戳紀錄，Round 結構完整後應由 `Round.submittedAt` 直接承載

**業務動線本質**（Miles 現場描述的四步）：

```
1️⃣ 印件建立 + 上傳印件檔案 + 填稿件備註（client_note）
2️⃣ 審稿人員審查第 N 輪：合格 / 不合格（不合格附退件原因 + 審稿備註）
3️⃣ 若不合格 → 業務 / 會員補件（上傳新檔 + 填補件備註）
4️⃣ 每輪留歷史紀錄
```

每一次「業務送審 → 審稿人員審查」是一個**語意單位**（= 一輪 Round）。印刷業實務語言也用「第 N 版」「審了第三輪」這樣的計數。Round 不是抽象概念，是業務本來就會數的單位。

**本 change 目的**：把 Round 重構為**完整承載「業務送審 + 審稿人員審查」一輪迴圈**的聚合，消除檔案浮動 / 備註散落 / ActivityLog 冗餘三個結構性缺陷，一次解決補件備註 UI Bug + 未來資料演化基礎。

## What Changes

### 重構（`ReviewRound` 資料模型）

**新增業務端欄位**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `submittedAt` | datetime | 本輪業務送審時間（首次送審 = 印件上傳時間；補件 = 業務完成補件時間；免審稿 = 印件建立時間）|
| `submittedBy` | user id / '系統' | 本輪送審者（B2B 業務 / B2C 會員 / 免審稿時為「系統」）|
| `submittedFiles` | `PrintItemFile[]` | 本輪送審綁定的印件檔案 |
| `submittedNote?` | text (500 字, 非必填) | 本輪送審 / 補件備註。首次送審通常留空，補件時用來告訴審稿人員「這次改了什麼」|

**審稿端欄位維持並微調**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `reviewedAt?` | datetime, nullable | 審稿完成時間；null = 業務已送審、審稿人員尚未完成 |
| `reviewerId?` | user id, nullable | 審稿人員；免審稿路徑為 null |
| `result?` | `'合格' \| '不合格' \| null` | 審稿結果；null = 待審 |
| `rejectReasonCategory?` | LOV (10 項) | 退件原因分類（僅 `result = '不合格'` 時填）|
| `reviewNote?` | text (1000 字, 非必填) | 審稿備註（合格 / 不合格每輪皆可填，送出後原審稿人員可修改；對齊 refine-prepress-review-scope）|
| `reviewedFiles?` | `PrintItemFile[]` | 審稿後檔案 + 縮圖（合格時審稿人員上傳）|

**Round 狀態派生**（不建獨立狀態機）：
```
Round 狀態 = 
  result === null      → '待審'       （業務已送審，審稿人員未完成）
  result === '合格'    → '合格'
  result === '不合格'  → '不合格'
```
Round 狀態是 `result` 欄位的 getter，沒有獨立狀態機維護成本。

### 重構（`PrintItemFile.roundId` 綁定規則）

- **移除「roundId = null」的浮動狀態**：所有 `PrintItemFile` MUST 綁定到某個 Round
- **業務首次上傳稿件**：自動建 Round 1（待審），檔案綁 Round 1 的 `submittedFiles`
- **業務補件**：自動建 Round N+1（待審），新檔案綁 Round N+1 的 `submittedFiles`
- **審稿人員上傳審稿後檔案 / 縮圖**：綁當前 Round 的 `reviewedFiles`

### 清理（`PrintItemActivityEvent` 事件型別）

**移除的事件**（由 Round 結構承載）：
- `稿件上傳` → 由 `Round.submittedAt` + `Round.submittedFiles` 承載
- `補件完成` → 由新 Round 建立（`submittedAt` + `submittedFiles` + `submittedNote`）承載

**保留的事件**（非 Round 迴圈內的行為）：
- `自動分配` / `破例派工` / `主管覆寫`
- `送出審核` / `狀態轉移`
- `審稿備註修改` / `稿件備註修改`（ActivityLog 稽核事件）

### 維持（印件層審稿狀態）

印件層 `reviewDimensionStatus` 5 狀態不變：`稿件未上傳 / 等待審稿 / 不合格 / 已補件 / 合格`。

**狀態由 action 維護**（denormalized，而非每次查詢時才推導）。action 觸發點：
- 業務首次上傳稿件 → `稿件未上傳` → `等待審稿`
- 審稿完成 合格 → `等待審稿` / `已補件` → `合格`
- 審稿完成 不合格 → `等待審稿` / `已補件` → `不合格`
- 業務補件完成 → `不合格` → `已補件`
- 免審稿路徑 → `稿件未上傳` → `合格`（建 Round 1 source=免審稿、result=合格）

### UI 強化（補件備註顯示的三個位置，一次做完）

1. **`ReviewRoundTimeline` 加「送審備註」欄位**：每輪顯示 `submittedNote` + `reviewNote`（兩欄明確分開；業務送 vs 審稿回）
2. **`SubmitReviewDialog`（審稿人員）頂部顯示上一輪 submittedNote**：對稱於 `ResupplyDialog` 顯示「上一輪退件摘要」—— 審稿人員重審時看到業務補件時寫了什麼
3. **`ActivityLogTimeline` 清理**：移除「稿件上傳 / 補件完成」事件渲染邏輯（事件本身已不存在）；原先吞掉 note 的 Bug 自然消失

### 免審稿快速路徑

系統在印件建立時自動建 Round 1：
- `submittedAt` = 印件建立時間
- `submittedBy` = `'系統'`
- `submittedFiles` = 印件建立時的檔案（若有）
- `reviewedAt` = 同 `submittedAt`（同一時刻）
- `reviewerId` = null
- `result` = `'合格'`
- `reviewedFiles` = 由客戶上傳的原檔作為終稿（Q5 選項 a：不需要審稿人員複製一份）

## Impact

### Spec 變更

| Spec | 變更類型 | 重點 |
|------|---------|------|
| `prepress-review/spec.md` | MODIFIED（主要）| ReviewRound 資料模型重構 / PrintItemFile.roundId 非 null / ActivityLog 事件清理 / UI 強化 Requirements |
| `order-management/spec.md` | — | 不影響（Order 審稿段 bubble-up 繼續運作）|
| `state-machines/spec.md` | — | 不影響（印件審稿狀態機 5 狀態不變）|
| `business-processes/spec.md` | — | 不影響（§ 5.5 稿件備註規則繼續適用）|

### Code 變更（Prototype）

**型別層**：
- `src/types/prepressReview.ts` — ReviewRound 重構、PrintItemActivityType 清理
- `src/types/workOrder.ts` — PrintItemFile.roundId 改為必填 (string)

**Store actions**（全部需要配合新結構重寫）：
- `src/store/useErpStore.ts`
  - `uploadArtworkFile` — 建 Round 1，檔案綁 Round 1
  - `submitReviewForPrintItem` — 更新當前 Round 的審稿端欄位（不是新建 Round）
  - 新增 `startResupplyRound`（業務補件完成）— 建新 Round N+1

**UI 元件**：
- `ReviewRoundTimeline.tsx` — 加「送審時間 / 送審者 / 送審備註」欄位
- `SubmitReviewDialog.tsx` — 頂部加「上一輪送審備註」區塊
- `ActivityLogTimeline.tsx` — 移除稿件上傳 / 補件完成事件渲染
- `ResupplyDialog.tsx` — onResupply 改為觸發 `startResupplyRound` action

**資料遷移**：
- `src/data/mockPrepressReview.ts` / `mockOrders.ts` / `mockQuotes.ts` seed 重建對應到新 Round 結構
- `src/test/scenarios/scenarioCoverage.test.ts` 斷言全面調整

### 不影響
- Order 層「待補件」狀態 + bubble-up 邏輯（前 change 成果繼續使用）
- 工單 / 任務 / 生產任務 / QC / 出貨
- 需求單印件 `client_note`（跟印件走、不跟 Round 走）
- 商業流程 § 5.5 稿件備註規則

## Out of Scope

- Order 層狀態機調整（已於 `add-order-review-rejected-status` 完成）
- QC 不合格（永遠不 bubble-up 到 Order）
- 審稿主管 KPI 面板
- 審稿退件通知（OQ [XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 獨立 change）
- 舊 `reviewStatus` legacy 欄位（相容值 `待審稿` / `審稿中` / `免審稿`）— 可在本 change 順手清理或另議

## Risks

| 風險 | 機率 | 影響 | 緩解 |
|------|------|------|------|
| Mock 資料遷移範圍大 | 高 | 中 | 建 helper 將舊 Round + 浮動檔案 + ActivityLog 事件轉為新結構；Seed 重建取代增量修正 |
| 測試斷言大規模重寫 | 高 | 中 | scenarioCoverage 先定義新結構的關鍵斷言，再逐情境調整 |
| Round 狀態 = result 欄位的約束漏洞 | 低 | 低 | TypeScript 型別強制 `result !== null ↔ reviewedAt !== null` |
| 審稿人員工作流 UI 斷裂 | 低 | 高 | SubmitReviewDialog 頂部補「上一輪送審備註」區塊；Lovable 驗證對比前後體感 |
| refactor 範圍超過預期 | 中 | 高 | 先做型別 + 核心 action，UI 調整分批；不追求一次 push 完成 |

## Success Criteria

1. `PrintItemFile.roundId` 永遠非 null（型別層強制 + scenario 測試驗證）
2. 補件備註（`Round.submittedNote`）在三個 UI 位置可見：`ReviewRoundTimeline` 欄位、`SubmitReviewDialog` 頂部、補件 Dialog 本身
3. `PrintItemActivityEvent` 不再出現 `稿件上傳` / `補件完成` 型別
4. 原五情境驗證通過：單件審稿迴圈 / 多件部分不合格 / 免審稿 / 打樣 NG 新印件 / EC 混合免審稿（沿用 add-order-review-rejected-status 的 A~E 情境）
5. Order 層「待補件」bubble-up 不受資料結構改動影響（回歸測試）
