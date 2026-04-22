## Context

`refine-prepress-review-scope` 補 `client_note` / `review_note` 擴充後，`add-order-review-rejected-status` 補 Order 層 bubble-up 後，審稿模組的業務表達幾乎完整，但底層 `ReviewRound` 資料模型仍不對稱：

- Round 只綁**審稿端**（reviewerId / result / reviewNote / reviewedFiles）
- **業務端**（送審 / 補件）的檔案與備註散落到 `PrintItemFile.roundId = null` 浮動狀態 + `PrintItemActivityEvent.note` 事件欄位

本 change 把 Round 重構為**完整承載一輪「業務送審 → 審稿人員審查」迴圈**的聚合。這是 Prototype 階段「驗證資料模型對業務表達力」的收尾工作，為後續 KPI / 自動化 / 圖編 Preflight 對映打好基礎。

## Design Decisions

### D1：Round 作為「業務送審 + 審稿人員審查」的完整聚合

**選項**：
- A. Round 只綁審稿端，業務端用 PrintItemFile（現況，保留）
- B. Round 綁業務端 + 審稿端完整迴圈（選 Q）
- C. 不用 Round 概念，PrintItemFile + ReviewEvent 扁平化事件（選 P）

**決定：B**

**理由**：
1. **業務語言對齊**：印刷業實務會說「第 N 版」「審了第三輪」，Round 是真實業務單位
2. **資料綁定明確**：補件檔、補件備註、退件原因、審稿後檔案、合格備註全部綁在**同一個 Round**；不用時間戳推斷或外鍵 join
3. **ActivityLog 瘦身**：`稿件上傳` / `補件完成` 事件冗餘（時戳由 Round.submittedAt 承載），可移除
4. **與 P 方案的比較（Miles Q4 追問）**：P 方案能做同樣統計（平均幾輪合格 / 審稿人員工作量），但**綁定邏輯靠推斷**；Round 方案**綁定隨結構走**。本質差異是語意清晰度而非功能

**反對意見**：多一層結構，型別增加。反駁：對 Prototype 規模而言型別成本可忽略；語意清晰度的長期回報 > 型別成本。

### D2：Round 狀態 = `result` 欄位的 getter（不建獨立狀態機）

**問題**：Round 作為 aggregate 後，會不會引入獨立狀態機（「待審 → 已審合格 / 已審不合格」）的維護成本？

**決定**：Round 狀態**直接派生自 `result` 欄位**，不額外建狀態機欄位：

```ts
function getRoundStatus(round: Round): '待審' | '合格' | '不合格' {
  if (round.result === null) return '待審';
  return round.result; // '合格' | '不合格'
}
```

**理由**：
- 沒有「待審 → 合格」之外的路徑需要管理（不像工單有收回 / 異動等複雜路徑）
- `result = null` 本身就是「業務送審但審稿人員未完成」的完整語意表達
- 多一個狀態機欄位反而增加同步維護成本（兩個欄位要對齊）

**約束**（型別層強制）：
- `result !== null` 必須同時 `reviewedAt !== null` 且 `reviewerId !== null`（免審稿路徑例外：`reviewerId = null`）
- `result === null` 必須 `reviewedAt === null` 且 `reviewerId === null` 或 `reviewerId` 已分派但未審

### D3：印件層 `reviewDimensionStatus` 保留 denormalized（雙層設計）

**問題**：印件的「審稿狀態」是由 Round[] 派生還是印件層存一份快取？

**決定**：印件層保留 `reviewDimensionStatus` 欄位（5 狀態），由 action 維護同步（denormalized）。

**理由**（Miles 確認）：
1. **印件是單據實體**（跟訂單 / 工單一樣）應該有自己的狀態欄位
2. **查詢效能**：訂單列表、審稿工作台、印件 Badge 等地方要快速讀取狀態，不用遍歷 rounds
3. **UI 語意穩定**：`reviewDimensionStatus` 是面向 UI 的穩定詞彙（例如「已補件」表達「補件後重審」），不會因為 Round 結構變動而跟著變

**同步規則**（action 層負責）：

| 觸發 action | Round 變化 | 印件 `reviewDimensionStatus` 變化 |
|------------|-----------|-------------------------------|
| `uploadArtworkFile`（首次上傳稿件）| 建 Round 1（待審）| 稿件未上傳 → 等待審稿 |
| `submitReviewForPrintItem`（result=合格）| 當前 Round.result='合格' | 等待審稿 / 已補件 → 合格 |
| `submitReviewForPrintItem`（result=不合格）| 當前 Round.result='不合格' | 等待審稿 / 已補件 → 不合格 |
| `startResupplyRound`（業務補件完成）| 建 Round N+1（待審）| 不合格 → 已補件 |
| 免審稿快速路徑 | 建 Round 1（source=免審稿、result=合格）| 稿件未上傳 → 合格 |

**一致性保證**：
- 所有改變印件審稿狀態的 action 必須**同時**更新 Round + `reviewDimensionStatus`
- 測試斷言：每個情境驗證後 Round 最新狀態與 `reviewDimensionStatus` 對齊

### D4：PrintItemFile.roundId 改為必填（移除浮動狀態）

**現況**：補件檔 `roundId = null`，等審稿人員下次送審才綁 Round（spec 原設計）

**問題**：
- 查詢「這份檔案屬於哪一輪」需要時間戳推斷（若 round 尚未產生則難以對應）
- 業務補件檔在資料層處於「無主」狀態，跟「業務上傳的印件檔」邏輯上同類但呈現不同
- 綁 Round 的時機要額外邏輯判斷

**決定**：所有 `PrintItemFile.roundId` MUST 為非空 string。

**實作路徑**：
1. 業務首次上傳稿件（`uploadArtworkFile`）→ action **先**建 Round 1（待審）→ 檔案綁 Round 1 的 `submittedFiles`
2. 業務補件完成（`startResupplyRound`）→ action **先**建 Round N+1（待審）→ 新檔案綁 Round N+1 的 `submittedFiles`
3. 審稿人員完成審核（`submitReviewForPrintItem`）→ 上傳的審稿後檔案 / 縮圖 → 綁當前 Round 的 `reviewedFiles`

**不變**：審稿後檔案 / 縮圖的 `fileRole` 區分維持 `'印件檔' / '審稿後檔案' / '縮圖'` 三值。

### D5：ActivityLog 事件清理（移除 `稿件上傳` / `補件完成`）

**現況** `PrintItemActivityType`（9 種）：
- `稿件上傳` ❌ 移除
- `自動分配` ✅ 保留
- `破例派工` ✅ 保留
- `主管覆寫` ✅ 保留
- `送出審核` ✅ 保留
- `補件完成` ❌ 移除
- `狀態轉移` ✅ 保留
- `審稿備註修改` ✅ 保留（ISO 9001 稽核）
- `稿件備註修改` ✅ 保留（ISO 9001 稽核）

**移除理由**：
- `稿件上傳`：由 Round.submittedAt + submittedFiles + submittedBy 完整表達「誰在何時上傳了什麼檔」
- `補件完成`：同上，由新 Round 的 submittedAt + submittedFiles + submittedNote 完整表達

**保留理由**：
- 分配 / 覆寫 / 破例：非 Round 迴圈內的管理動作，不屬於任何 Round
- 送出審核：跨 Round 的審稿人員動作時戳（不同於 Round.reviewedAt，這是「將本輪審完的決策」）
- 狀態轉移：印件層狀態變化事件（獨立維度）
- 備註修改（兩類）：稽核需求，事件本身是歷次修改的 diff 紀錄

### D6：Round 狀態的型別層約束（TypeScript）

```ts
type Round =
  | {
      // 待審
      roundNo: number;
      submittedAt: string;
      submittedBy: string;
      submittedFiles: PrintItemFile[];
      submittedNote?: string;
      reviewedAt: null;
      reviewerId: string | null;  // null = 免審稿 / 待分配
      result: null;
    }
  | {
      // 已審合格
      roundNo: number;
      submittedAt: string;
      submittedBy: string;
      submittedFiles: PrintItemFile[];
      submittedNote?: string;
      reviewedAt: string;
      reviewerId: string | null;  // null = 免審稿
      result: '合格';
      reviewNote?: string;
      reviewedFiles?: PrintItemFile[];
    }
  | {
      // 已審不合格
      roundNo: number;
      submittedAt: string;
      submittedBy: string;
      submittedFiles: PrintItemFile[];
      submittedNote?: string;
      reviewedAt: string;
      reviewerId: string;  // 不合格路徑必有 reviewer
      result: '不合格';
      rejectReasonCategory: RejectReasonCategory;
      reviewNote?: string;
      // 不合格路徑通常無 reviewedFiles（審稿人員只在合格時上傳終稿）
    };
```

TypeScript discriminated union 強制 `result` 值 vs `reviewedAt` / `reviewerId` / `rejectReasonCategory` 的一致性，編譯期擋下不一致狀態。

### D7：UI 展示三個強化位置

對應 `add-order-review-rejected-status` 討論時 Miles 提過的 L1/L2/L3 位置：

1. **L1 — `ActivityLogTimeline` 清理（移除「稿件上傳 / 補件完成」事件渲染）**：事件本身已不存在，補件備註原先吞掉的 Bug 自然消失
2. **L2 — `ReviewRoundTimeline` 加「送審備註」欄位**：每輪顯示 `submittedNote`（業務送 / 補件）+ `reviewNote`（審稿回），兩欄明確分開
3. **L3 — `SubmitReviewDialog`（審稿人員）頂部顯示上一輪 submittedNote**：對稱於 `ResupplyDialog` 顯示「上一輪退件摘要」。審稿人員按「完成審核」時，看到業務補件時寫了什麼（例如「已調整出血至 3mm，請再次確認」）

### D8：免審稿路徑的 Round 1 產生規則（Q5 確認）

系統在**印件建立時**自動建 Round 1：

| 欄位 | 值 |
|------|-----|
| `roundNo` | 1 |
| `submittedAt` | 印件建立時間 |
| `submittedBy` | `'系統'` |
| `submittedFiles` | 印件建立時提供的檔案（B2B 需求單 / B2C EC 上傳）|
| `submittedNote` | null / 空 |
| `reviewedAt` | 同 `submittedAt` |
| `reviewerId` | null |
| `result` | `'合格'` |
| `reviewNote` | null / 「免審稿路徑，系統自動合格」|
| `reviewedFiles` | **null**（免審稿沒有審稿人員加工後的檔案；下游工單取終稿時判斷 `source === '免審稿' ? submittedFiles : reviewedFiles`）|

**UI 說明**：`ReviewRoundTimeline` 顯示這輪時應標示 `source = 免審稿`（而非一般審稿路徑）。

**下游取檔規則**：工單建立時取「終稿」的邏輯 MUST 判斷 `source`：
- `source === '審稿'`：取 `Round.reviewedFiles`（審稿後檔案 + 縮圖）
- `source === '免審稿'`：取 `Round.submittedFiles`（客戶原檔即終稿）

此規則避免免審稿印件下游取不到檔案（因 reviewedFiles 為 null）。

## Alternatives Considered

### A1：P 方案 — 扁平事件流（Miles Q4 追問時考慮）

PrintItemFile + ReviewEvent 扁平清單，不用 Round。

**拒絕理由**：雖然能做同樣統計，但：
- 業務語言不對齊（「第 N 輪」是實務用語）
- 綁定邏輯靠時間戳推斷或外鍵
- 補件備註沒有自然位置（要新增欄位）

### A2：雙狀態機（印件 + Round 各有獨立狀態機）

Round 建獨立狀態機欄位（待審 → 已審合格 / 已審不合格）。

**拒絕理由**（D2）：狀態由 `result` 欄位派生已足夠；獨立狀態機欄位增加同步維護成本。

### A3：純派生的印件審稿狀態（每次查詢時才從 Round[] 算）

印件層不存 `reviewDimensionStatus`，UI 查詢時才遍歷 rounds 計算。

**拒絕理由**（D3 / Miles 確認）：印件作為單據實體應有自己狀態欄位；查詢效能考量（列表、Badge、篩選）。

## Risks & Open Questions

### 風險
- Mock 資料遷移範圍大（緩解：seed 重建而非增量修正）
- 測試斷言大規模重寫（緩解：scenarioCoverage 先定義新結構的關鍵斷言）
- UI 元件多處 refactor（緩解：分批 push 到 Lovable，每批驗證後再動下一批）

### Open Questions（本 change 範圍內）— 已於 2026-04-22 Round 1 審查後收斂

- **OQ-A ✅ 採「本 change 順手清理」**：legacy `reviewStatus` 欄位（含相容值 `待審稿` / `審稿中` / `免審稿`）在本 change 移除。Prototype 階段清理成本低，保留會累積「最新 Round result=合格 但 legacy reviewStatus=審稿中」的雙軌矛盾。見 tasks 3.1.4。
- **OQ-B ✅ 採「Round 1 先建、`reviewerId=null`，分派 action 稍後補」**：首次上傳稿件時若未分派審稿人員，Round 1 以 `reviewerId=null` 建立；後續由 `confirmSignBack` 或 `assignReviewer` action 單獨更新欄位（不新建 Round）。審稿人員工作台查詢條件：`assignedReviewerId === current_user && result === null`，未分派印件自然不會出現在任何人工作台。
- **OQ-C ✅ 採「嚴格：補件必須有新檔」**：業務補件 MUST 提供至少一份新印件檔（`submittedFiles.length >= 1`）；只改備註不算補件。Miles 明確確認「補件就是要一起提供檔案」的業務語意。若未來實際情境需要「送審備註補充」，另提 change 評估獨立事件型別。

### 型別 / 實作層約束（Round 1 erp-consultant 提出的技術強化，已採納為實作標準）

1. **免審稿 `reviewedFiles = null`**（非指向 `submittedFiles`）：
   - 理由：免審稿沒有審稿人員背書，`reviewedFiles` 語意是「審稿人員加工後的下游生產基準」，不該被客戶原檔污染
   - 下游工單取終稿邏輯：`source === '免審稿' ? submittedFiles : reviewedFiles`
   - 對齊 SAP QM Skip（免檢）實踐：auto-approved 不生成「審核後物料」
2. **測試 invariant assertion**：每個情境驗證結尾 assert `printItem.reviewDimensionStatus === derive(printItem.rounds)`，防止 Round[] 與 denormalized 狀態欄位不同步。屬工程品質基本實踐。
3. **工作台查詢乾淨化**：不另加 `assignmentStatus` 欄位，沿用 `reviewerId` null / 已分派二元判斷即可；工作台 filter `assignedReviewerId === me && result === null` 正確表達「我的待審」。
