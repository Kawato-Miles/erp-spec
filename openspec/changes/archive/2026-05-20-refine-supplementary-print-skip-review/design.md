## Context

[refine-after-sales-refund-and-add-supplementary-print](../archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/) 歸檔後 Miles 發現補印實作違反業界實務 + 業務情境：補印需重新走完整審稿，但 99% 售後補印情境是原稿沒問題、只是製造瑕疵 / 物流破損 / 規格不符。業界 MES（Tharstern / PrintEPS / Printavo / PrintNow）普遍預設「reorder / reprint 跳過 artwork approval 直接到 production」。

商業背景對應 [Vault 印件實體卡](../../../memory/erp/ERP_Vault/05-entities/印件.md)、[Vault 售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)。

## Goals / Non-Goals

**Goals**：

1. 補印印件建立同時完成審稿環節（reviewStatus = 合格、可立即被印務主管分配工單）
2. 沿用來源印件的最終合格稿件（reviewFiles 拷貝），印務知道用哪版稿件製作
3. 保留完整審稿歷史軌跡（reviewRounds 拷貝來源 + 新增自動通過輪次，標明 sourcePrintItemId）
4. 補印不出現在審稿員「等待審稿」工作清單（避免誤分配）

**Non-Goals**：

- 補印改稿情境（規格變更）：應走「規格變更」OrderAdjustment 而非補印（OQ-SP-1）
- 補印工單建立 / 排程 / 生產任務流程：只動審稿環節，下游不動
- 「審稿合格但稿件實際有問題」例外情境：留 OQ-SP-2 釐清

## Decisions

### 決策 1：採「自動通過輪次」方案（業界派系二）

**背景**：業界 MES 對「跳審稿」有兩種派系：
- 派系一硬跳過（reviewStatus 直接合格、不建輪次）
- 派系二自動通過輪次（複製來源稿件 + 新建輪次標註自動通過）

**選擇**：派系二（自動通過輪次）

**替代方案考慮**：

| 方案 | 為何不採用 |
|------|----------|
| 派系一硬跳過 | 無審稿歷史軌跡；客戶事後查「用哪版稿件」只能反查 source_print_item_id，無 ReviewRound 紀錄 |
| 業務勾選「跳審稿 / 走審稿」| 補印情境 99% 是「跳審稿」，加 checkbox 反而增加業務操作步數；「補印改稿」情境屬於規格變更不應在補印路徑內 |
| `skipReview = true` | 與既有「業務手動勾選免審稿」語意混淆；既有 skipReview 是 quote → order 階段就決定，補印是 ticket 階段才產生 |

**核心理由**：

- 業界 Tharstern 等較新 MES 採派系二，因合規 / 客訴追溯需求要審稿歷史可查
- 自動通過輪次保留 sourcePrintItemId，事後查「PI-002 補印的稿件來自哪個輪次」一目了然
- 沿用既有 ReviewRound 模型（只擴 source enum + 加 sourcePrintItemId optional 欄位），不破壞既有審稿狀態機

### 決策 2：ReviewRoundSource 擴 enum 加 '售後補印' 值

**背景**：既有 `ReviewRoundSource = '審稿' | '免審稿'`。補印自動通過該歸哪類？

**選擇**：擴 enum 為 `'審稿' | '免審稿' | '售後補印'` 三值

**替代方案考慮**：

| 方案 | 為何不採用 |
|------|----------|
| 複用 `'免審稿'` | 語意混淆：免審稿是業務在 quote → order 階段「主動決定不審」（如重複下單常規品）；補印自動通過是「ticket 階段沿用已合格稿件」，兩者建立時機 / 觸發角色 / 業務語意完全不同 |
| 加 `autoApproved: boolean` 欄位 | 與 source 維度正交，但實際上「自動通過 vs 人工審稿」這個維度的真正承載者就是 source（人工 = 審稿 / 系統規則 = 免審稿 / 售後補印），扁平 boolean 不如分類 enum 清晰 |

### 決策 3：reviewFiles 全部拷貝 vs 只拷貝最終合格輪次的檔案

**選擇**：全部拷貝來源印件的 `reviewFiles`

**替代方案考慮**：

| 方案 | 為何不採用 |
|------|----------|
| 只拷貝最終合格輪次的檔案 | 印務 / 客服查詢時看不到完整稿件歷史；若印務發現稿件問題回退時無法看到前幾輪的稿件版本對比 |
| 不拷貝、靠 sourcePrintItemId 引用 | 補印 PrintItem 詳情頁 UI 需要 join 來源印件才能顯示稿件，前端複雜度增加；資料模型純度高但 prototype 階段不必要 |

**核心理由**：補印的稿件 = 原印件最終合格稿件 + 完整歷史檔案軌跡（追溯 / 對比用），複製全部 reviewFiles 對前端最友善 + 對審計最完整。

### 決策 4：reviewRounds 全部拷貝 + 新增自動通過輪次

**選擇**：複製來源印件的全部 `reviewRounds` + 新建一筆「售後補印自動通過輪次」（roundNo = 來源最後一輪 + 1）

**替代方案考慮**：

| 方案 | 為何不採用 |
|------|----------|
| 只新建自動通過輪次（不拷貝歷史輪次） | 與決策 3 同理，會失去歷史審稿軌跡 |
| 不新建自動通過輪次（只拷貝歷史） | currentRoundId 應該指向「補印的當前合格輪次」，若指向來源的合格輪次，反查時混淆「這個 round 是誰的？」|

**核心理由**：補印自身需要一個 currentRoundId 指向，且必須能區分「來源的合格輪次」vs「補印的自動通過輪次」。新增 Round 標 source = '售後補印' + sourcePrintItemId 指向來源是最清晰的設計。

### 決策 5：printItemStatus 不變（維持 '待生產'）

**背景**：「印件總覽」用印製維度狀態作為篩選 Tab，業務 / 印務看到的「等待中」對應 prototype 內 `printItemStatus = '待生產'`。

**選擇**：補印 PrintItem 建立時 `printItemStatus = '待生產'`（不變）

**理由**：印件總覽的篩選 Tab 把 `'待生產'` 顯示為「等待中」（待建工單）。補印印件建立後自動通過審稿、印製狀態 = 待生產 = 印件總覽「等待中」分類 = 印務主管立即可分配工單。

## Risks / Trade-offs

| 風險 | 影響 | 處理 |
|------|------|------|
| 自動通過審稿無人複核稿件問題 | 補印用了有問題的稿件、印務發現後需 rework | 補印仍可走「不合格 / 補件」狀態機回退（業務 / 主管手動推進）；OQ-SP-2 釐清標準動作 |
| 「補印改稿」情境誤判 | 業務在補印 dialog 內想改稿（少見）| OQ-SP-1 留釐清；初版業務需改稿應走「規格變更」OrderAdjustment 不是補印 |
| ReviewRoundSource enum 擴值影響 | 既有審稿邏輯需處理新值 | UI / 篩選邏輯加「售後補印」分類；既有業務情境（審稿 / 免審稿）不變 |
| 舊資料補印（v0.4 期間建立但走完整審稿）| 顯示為「審稿中」與新邏輯不一致 | 不 backfill；新建補印自動跳審稿；舊資料維持原邏輯 |

## Migration Plan

### Prototype 階段
- 直接修改 `addReprintPrintItemFromTicket` 邏輯
- 既有 v0.4 期間建立的補印（走完整審稿）維持原狀，不 backfill
- 既有業務 / 諮詢的補印 UI 不變（業務操作步驟無變化，差別在系統內部處理）

### 舊資料處理
- 不 backfill
- v0.4 期間建立的補印 PrintItem 若 reviewStatus ≠ '合格'，業務需手動點選對應動作（指派審稿員 → 補件 → 合格）走完原流程

### Rollback
- prototype 階段直接 git revert

## Open Questions

| OQ ID | 議題 | 處理時機 |
|-------|------|---------|
| OQ-SP-1 | 「補印改稿」情境（補印同時改規格）入口設計 | 留釐清；初版業務應走「規格變更」OrderAdjustment 不是補印 |
| OQ-SP-2 | 補印自動通過後印務發現稿件實際有問題的標準處理動作 | 補件路徑可走但需釐清流程；留下一輪確認 |
| OQ-SP-3 | 補印印件詳情頁 UI 是否需要視覺強調「來源稿件 PI-XXX 連結」？ | implement 時依稿件區塊既有 UI 慣例補強 |
