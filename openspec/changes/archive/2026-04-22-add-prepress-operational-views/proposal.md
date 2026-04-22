## Why

Miles 訪談審稿主管時浮現三層痛點：

**痛點 1（主管視角）— 看總量**：主管每天早上想知道「今日待處理 / 合格 / 不合格筆數」，目前 `InProgressItems`（審稿總覽）只有 status / reviewer / difficulty 篩選，缺時間區間與 summary bar，主管需要手動計數。

**痛點 2（主管視角）— 抓異常**：審稿人員曾發生「全部退件」刷工時的偷懶 pattern（看起來在工作但沒認真審）。光看整體 KPI（7 項）抓不到，需要**個人 vs 同儕對比**（每位審稿員的件數、退件率、平均處理時間）才能肉眼辨識。

**痛點 3（審稿員視角）— 對帳**：審稿與印務兩個部門交接時曾發生「審稿完成 10 筆、印務只收到 9 筆」的掉單情境。審稿員需要自證「這些我都送審過」，目前只能手動計數。掉單根源另議（見 [OQ PI-012](https://www.notion.so/34a3886511fa81adb3bed2fd9d70e3e5)），本 change 先給審稿員**對帳工具**。

本 change 對應既存 [OQ PI-010「審稿主管 KPI 面板指標規劃（L1/L2 分層 + 可攔截退件量化）」](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 的 L1（即時營運）部分 + 個人對比表。L2（可攔截標記、客戶排行、補件 loop × 客戶）與 L3 留後續 change。

## What Changes

### 擴充（`InProgressItems` 審稿總覽列表）

1. **時間區間篩選**（預設今日）：今日 / 本週 / 本月 / 自訂。篩選邏輯：該印件的 ReviewRound 任一 `reviewedAt` 落在區間內（審稿員角度的「我今天審過這件」語意）。搭配既有 status 篩選可列出完成紀錄明細供對帳。
2. **狀態篩選擴充**：除現有「等待審稿 / 不合格 / 已補件」外，加「合格」選項（原本列表硬篩只顯示進行中，現在支援查詢已合格印件供對帳）。
3. **Summary bar**：列表頂部顯示當前篩選結果的 `待處理 N｜合格 N｜不合格 N` 三格聚合數字，跟篩選連動即時重算。
4. **列表粒度維持印件**（一印件一列），每列可點入印件詳情查歷史輪次；不改為 Round 粒度以保留主管視角的直覺。

### 新增（`SupervisorDashboard` 審稿主管工作台）

1. **L1 今日營運卡片**（置於 Tabs 上方，永遠可見）：
   - 待派工（difficultyLevel 未填或 assignedReviewerId 為 null 的印件）
   - 今日新進稿（印件 ReviewRound.submittedAt 在今日）
   - 今日合格（ReviewRound.reviewedAt 在今日 && result = '合格'）
   - 今日不合格（ReviewRound.reviewedAt 在今日 && result = '不合格'）

2. **個人對比表**（新 Tab 或「審稿人員」Tab 擴充）：
   - 欄位：審稿員姓名 / 件數 / 退件率 / 平均處理時間
   - 時間範圍切換：今日 / 本週 / 本月（預設今日）
   - **處理時間公式 α**：`reviewedAt - submittedAt` 平均（含排隊時間；簡單但會受審稿員負擔影響而膨脹 — 僅作參考指標）
   - **退件率**：該審稿員 `result = '不合格'` Round 數 / `reviewedAt !== undefined` Round 總數
   - **排序**：退件率降冪（異常自然排到頂端）
   - **不標示 ⚠️ 異常徽章**（Baseline 未知，避免閾值寫錯誤導；純展示 + 排序由主管肉眼判斷）

### 新 util（store / utils）

- `aggregateReviewStatsByReviewer(rounds, timeRange)` — 依 reviewerId 聚合件數 / 退件率 / 平均處理時間
- `filterPrintItemsByReviewTimeRange(items, timeRange)` — 依 ReviewRound 時間篩印件
- `summarizeReviewCountsByStatus(items)` — 計算待處理 / 合格 / 不合格筆數

## Impact

### Spec 變更

- `prepress-review/spec.md` MODIFIED：審稿人員工作台 / 審稿主管工作台 Requirements 擴充 + 新增時間區間篩選、summary bar、個人對比表 Requirements

### Code 變更（Prototype）

- `src/pages/prepress/InProgressItems.tsx`：加時間區間、status 擴充、summary bar
- `src/pages/prepress/SupervisorDashboard.tsx`：加 L1 卡片、個人對比表（可能新 Tab）
- `src/utils/prepressReview.ts`：新增三個 aggregator utils
- `src/test/scenarios/`：補 aggregator 單元測試

### 不影響

- Round 資料結構（前 change `refactor-review-round-model` 已定）
- 印件審稿狀態機（5 狀態不變）
- Order 層 bubble-up（前 change `add-order-review-rejected-status` 繼續運作）
- ReviewerInbox（審稿員自己的收件匣，本 change 不動）
- 現有 7 項 KPI（`computeReviewKpi` 保留於 KPI 概覽 Tab）

## Out of Scope

- **印務感知新單的根源機制**（[OQ PI-012](https://www.notion.so/34a3886511fa81adb3bed2fd9d70e3e5) 獨立 change）— 本 change 只給審稿員對帳工具，不解決「印務為何沒收到工單」
- **L2 策略檢討指標**：退件原因可攔截標記、客戶 × 首審通過率、補件 loop × 客戶、個人負擔 P50/P90（見 [OQ PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790)）
- **處理時間公式 β**（`reviewedAt - 上件 reviewedAt` 審稿員本人專注時間）— 需跨日 / 斷點規則，本 change 用簡單 α
- **絕對閾值 / 異常 ⚠️ 標示**：Baseline 未知，採純展示排序；實際 UAT 跑一段時間後再考慮閾值
- **ReviewerInbox 加完成紀錄 Tab**：原規劃但審稿員透過 InProgressItems filter 即可達成
- **SLA / 過載警示**：依賴公司定義的 SLA 閾值，[OQ PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 待主管確認

## Success Criteria

1. 主管 08:30 進 InProgressItems 看 summary bar 知道今日工作量（待處理 / 合格 / 不合格 三數字）
2. 主管進 SupervisorDashboard 看個人對比表，排序前段（退件率高）的審稿員即疑似異常，可進一步查核
3. 審稿員被印務問「你這週審了幾筆合格」→ 進 InProgressItems 用 reviewerId=自己 + 時間區間=本週 + status=合格 列具體印件編號清單對帳
4. UI 切換時間範圍（今日 / 本週 / 本月）summary 與個人對比表即時重算，無遲滯

## Risks

| 風險 | 機率 | 影響 | 緩解 |
|------|------|------|------|
| Baseline 未知，主管看指標無方向 | 中 | 中 | 第一階段純展示 + 排序；UAT 收集一週後再定閾值 |
| 處理時間公式 α 受審稿員負擔影響會膨脹 | 高 | 低 | 標示為「參考指標」；未來可補 β 公式作為進階 |
| 個人對比樣本數太少（< 3 審稿員）| 低 | 低 | 顯示全部，無相對比較意義時主管自行判斷 |
| 審稿員對帳可能發現系統掉單無法追究 | 中 | 中 | 本 change 只提供對帳工具；掉單根源由 PI-012 後續 change 解 |
