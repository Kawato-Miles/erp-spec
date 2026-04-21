## Context

本 change 修補 `add-prepress-review` 與印件狀態機完成後，Order 層尚未承接「印件審稿被退件」這層語意的缺口。印件層 5 狀態齊備但未 bubble-up，業務在訂單列表看「等待審稿」時無法區分「尚未送審 / 不合格待補 / 補件後重審」三種情境，動線斷裂。

本 change 的 artifacts 經過 senior-pm / ceo-reviewer / erp-consultant 三視角兩輪討論後收斂，主要調整：
- 命名從「審稿不合格」改為「待補件」（對齊業務 JTBD 語意）
- Bubble-up 規則簡化為 4 條（實作時發現 erp-consultant 原提「至少一件送審過」前提多餘 —— 「等待審稿」本身就隱含稿件已上傳，EC 混合情境中未上傳印件狀態是「稿件未上傳」而非「等待審稿」，規則不會誤觸發）
- 邊界情境釐清：打樣 NG 原訂單新增免審稿印件 **in scope**；同印件追加製作走新訂單 **out of scope**（X6）
- 明確與通知機制（OQ XM-006）的協同路徑
- 增加技術債記帳段落（D7）

## Design Decisions

### D1：命名「待補件」而非「審稿不合格」或「不合格」

**選項**：
- A. Order.status 直接用「不合格」
- B. Order.status 用「審稿不合格」
- C. Order.status 用「待補件」

**決定：C**

**理由**：
1. **業務 JTBD 對齊**：業務在 OrderList 關心「我下一步要做什麼」，不是「發生了什麼事件」。「待補件」直接是動作語意，老闆 / 業務 / 客戶都看得懂
2. **避免雙紅 Badge 認知衝突**：印件層已有「不合格」紅 Badge，若 Order 層也用「審稿不合格」紅 Badge，同頁顯示業務會誤判為兩個不同問題（erp-consultant Round 1 挖出）
3. **刪除矛盾理由**：原設計說「用『審稿不合格』是為 QC 不合格預留命名空間」，但又明確聲明 QC 不合格不冒 Order 層 — 自相矛盾。命名不需為不存在的狀態預留
4. **現場導入阻力**：「不合格」會讓業務心態抗拒（「我又沒做錯為什麼叫不合格」）；「待補件」是中性動作描述

**反對意見**：失去「審稿退件」的技術上下文。反駁：Order.status 受眾是業務 + OrderList 使用者，不是審稿人員；技術上下文在印件層與 ActivityLog 已充分保留。

**邊界聲明維持**：QC 不合格不冒到 Order 層（訂單永遠沒有 QC 不合格狀態）。此原則與命名選擇獨立。

### D2：Bubble-up 決策表

**派生規則**（優先序，4 條）：

| # | 條件 | Order.status |
|---|------|--------------|
| 1 | 存在任一印件 `reviewDimensionStatus = '不合格'` | 待補件 |
| 2 | 所有印件 `reviewDimensionStatus = '合格'` | 製作等待中（進入製作段）|
| 3 | 存在任一印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'` | 等待審稿 |
| 4 | 其他（全部「稿件未上傳」；或「合格」+「稿件未上傳」混合）| 稿件未上傳 |

**規則 3 的設計驗證（erp-consultant Round 1 的擔憂實作後發現多餘）**：
- 原擔憂：EC 混合訂單（免審稿合格 + 需審稿印件）會誤派為「等待審稿」
- 實作驗證：需審稿但尚未上傳稿件的印件，`reviewDimensionStatus` 為 `'稿件未上傳'`，不是 `'等待審稿'`。規則 3 集合檢查不會被觸發，自然落到規則 4 「稿件未上傳」
- 結論：「等待審稿」狀態本身即隱含「稿件已上傳、等待審稿人員動作」；不需要再檢查 `reviewRounds.length` 是否有送審紀錄

**「已補件」印件視為「等待審稿」的原理**：
- 業務視角的關鍵是「球在誰手上」：
  - 待補件 → 球在**業務**（要上傳補件檔）
  - 等待審稿 → 球在**審稿人員**（不管是新件還是重審件）
- 「已補件」和「等待審稿」對業務動線而言等價
- 印件層仍保留「已補件」狀態供審稿人員區分（印件層不動）

### D3：訂單狀態不可逆原則修訂

**現況** `state-machines/spec.md` Requirement: 訂單狀態不可逆：
> 訂單狀態向前推進後 MUST NOT 回退至先前狀態

**問題**：「待補件 → 等待審稿」（補件完成）字面上是回退，違反原則。

**決定**：修訂為段落級別不可逆，段落內子狀態可互換：

```
訂單段落（付款段 → 審稿段 → 製作段 → 出貨段）間 MUST NOT 回退。
審稿段內子狀態（等待審稿 ↔ 待補件）SHALL 允許雙向互換。
其他段落內子狀態維持單向推進。
```

**理由**：
- 不可逆原則的真正業務目的是防止「付款又回未付款」「製作又回審稿」這類重大回退
- 審稿段內來回是審稿流程本質（不合格 → 補件 → 重審是正常迴圈）
- 明確區分段落 / 子狀態兩層，讓未來段落若也有子狀態互換時有規則可循

**governance 注意**：此修訂不為其他段落開先例（製作段工單異動 / 出貨段異常 / 客訴 hold 等）。未來若這類需求出現，優先評估重構為正交維度模型（見 D7），而非援引本條修訂要求再開例外。

### D4：Bubble-up 觸發點

**現況** `useErpStore.ts:31-73`：
- `deriveOrderStatus(currentOrderStatus, orderWos)` — 僅處理製作階段
- `applyOrderBubbleUp(orders, workOrders)` — 套用製作階段 bubble-up

**決定**：新增獨立 util `deriveOrderReviewStatus(currentStatus, printItems)`，與現有 `deriveOrderStatus` 並列。結構對齊 existing pattern：

```ts
function deriveOrderReviewStatus(
  current: Order['status'],
  printItems: Pick<OrderPrintItem, 'reviewDimensionStatus'>[],
): Order['status'] | null {
  const reviewPhaseStates: Order['status'][] = ['稿件未上傳', '等待審稿', '待補件'];
  if (!reviewPhaseStates.includes(current)) return null;
  if (printItems.length === 0) return null;

  const statuses = printItems.map(pi => pi.reviewDimensionStatus);

  if (statuses.some(s => s === '不合格')) return '待補件';
  if (statuses.every(s => s === '合格')) return '製作等待中';
  if (statuses.some(s => s === '等待審稿' || s === '已補件')) return '等待審稿';
  return '稿件未上傳'; // 規則 4：全部「稿件未上傳」或「合格」+「稿件未上傳」混合
}
```

**觸發串接（統一透過 `updateOrder`）**：
- `updateOrder(orderId, updater)` action 內部自動套 `applyOrderReviewBubbleUpForOrder`，所有透過 `updateOrder` 改動印件狀態的路徑都自動 bubble-up
- `submitReviewForPrintItem` 內部 `set()` 後明確呼叫一次（不透過 `updateOrder`）
- `uploadArtworkFile` 內部 `set()` 後明確呼叫一次（不透過 `updateOrder`）
- `confirmSignBack`：維持現有首次進入審稿段的手動邏輯（含免審稿快速路徑判斷），本次不動

**邊界情境處理**：

| 情境 | 觸發路徑 | Order.status 變化 |
|------|---------|------------------|
| 打樣 NG 棄用 + 原訂單新增免審稿印件（in scope）| `updateOrder` 改 printItems | Order 已離開審稿段 → bubble-up 檢查 `reviewPhaseStates` 不 match → return null → **Order 維持當前製作段狀態** |
| 同印件追加製作（X6，out of scope）| 走新訂單，不碰原訂單 | 原訂單不動；新訂單正常走 bubble-up |
| 原訂單仍在審稿段時新增印件 | `updateOrder` 改 printItems | 走 bubble-up 規則，依新印件狀態集合派生 |

本 change 不提供「原訂單審稿段退回」的 API，避免破壞不可逆原則。

### D5：與免審稿快速路徑互動

**現況** `state-machines/spec.md:130`：
> 免審稿快速路徑：當訂單下所有印件的 review_status 皆為「合格」（含免審稿設定）時，訂單 SHALL 從「已付款」或「已回簽」直接進入「製作等待中」，跳過「稿件未上傳」與「等待審稿」。

**決定**：免審稿快速路徑**不經過「待補件」**。規則不變。

**混合情境（D2 規則 4）補充**：若訂單部分印件免審稿（直達「合格」）+ 部分需審稿（「稿件未上傳」），訂單不走快速路徑（因為有印件尚未合格），走 bubble-up 規則 4 → Order.status = 「稿件未上傳」，等需審稿那件上傳稿件後 `reviewDimensionStatus` 變為「等待審稿」再走規則 3。

### D6：邊界聲明 — QC 不合格 / 審稿人員工作台 / 並行補件不走 Order 層

**明確記錄**（避免後續誤擴展）：

1. **QC 不合格**：訂單永遠沒有 QC 不合格狀態。QC 不合格在生產任務層被吸收，不 bubble-up（Miles 明確確認）
2. **審稿人員工作台**：審稿人員的 JTBD 是「我有多少印件要審」，看印件層 `reviewDimensionStatus` 工作台即可。本 change 不影響審稿人員工作台
3. **並行補件**：業務實務上一訂單一業務負責，不存在兩位業務同時對同一訂單不同印件補件的 race condition。本 change 不需處理並行衝突

### D7：技術債記帳 — 未來重構為正交維度模型的觸發條件

**背景**：erp-consultant 在三視角討論指出，本 change 的單維度 Order.status 壓扁模型若未來出現 N+1 段落內例外維度（退貨 hold、急單 hold、客訴 hold），會導致狀態值爆炸（例如需要「製作中 + 退貨 hold」「出貨中 + 客訴 hold」等複合狀態）。業界成熟實踐是**正交維度模型**：
- SAP S/4HANA：General Status（不可逆骨幹）+ User Status（可循環子維度）雙軌
- Oracle EBS：`order_lines.flow_status_code` + `hold_sources` 分離進度與例外

**決定（本 change 維持壓扁單維度）**：
- Prototype 階段目標是驗證狀態模型對業務的感知，不是蓋完備 ERP
- 正交維度會增加 1-2 週 data model 變動，對印刷廠規模過度工程
- 審稿段「等待審稿 ↔ 待補件」互換是已知唯一需要段落內雙向流轉的情境

**記帳聲明**：
- 若未來出現**第 2 個段落內例外維度需求**（例如退貨 hold、急單 hold、客訴 hold），**MUST** 在該 change 立案時重新評估是否重構為正交維度模型
- 重構觸發條件：
  - 需要同時表達「主狀態 + 例外維度」且兩者獨立流轉
  - 需要查詢「處於 X 主狀態 AND 被 Y 例外 hold」的訂單集合
- 不重構的後果：Order.status 狀態值不斷膨脹、OrderList 篩選器複雜化、bubble-up 規則難以維護

**明確不列入本 change**：實際重構工作 / Data Model 變動。本 D7 是風險披露 + 未來決策觸發點，不是工作項目。

### D8：與通知機制（OQ XM-006）的協同路徑

**背景**：ceo-reviewer 在三視角討論質疑，「待補件」狀態若沒有下游消費者（KPI / 工作台 / 自動通知），就是 SAP 社群稱之為 zombie status 的 UI-only 信號，性價比存疑。同時既存 [OQ XM-006「審稿不合格的通知管道與內容模板」](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 未解決，正好對應此疑慮。

**決定**：
- 本 change 建立「待補件」作為**通知事件的觸發源節點**（SAP Status Management + Output Management 雙軌的狀態節點端）
- 實際通知發送（Email / 站內訊息 / SLA 追蹤）由 XM-006 推進的後續 change 綁定
- 本 change 的 tasks 6.x 新增行動項：歸檔後**立即推進 XM-006 後續 change**，避免「待補件」長期無下游消費者

**若通知始終未綁定**：
- 「待補件」退化為 UI-only 信號，採用率依賴業務主動檢視 OrderList 習慣
- senior-pm 的成功指標（列表識別時間、漏補件率）將無法達標
- 此為已知風險，由 Miles 承擔決策後果

## Alternatives Considered

### A1：在印件層合併「已補件」為「等待審稿」

**拒絕理由**：審稿人員需要區分「新件」vs「重審件」。印件層 Badge 視覺差異（已補件藍脈動 / 等待審稿橘脈動）對審稿人員有用，不應為 Order 層簡潔犧牲。

### A2：新增 Order 層「已補件」狀態（三段式）

即 Order 有「待補件 → 已補件 → 等待審稿」三段。

**拒絕理由**：業務視角下「已補件」和「等待審稿」等價（球都在審稿人員），多一個狀態增加業務認知成本、OrderList 篩選複雜，收益不清楚。

### A3：Order 層用 Badge 徽章而非狀態（保留「等待審稿」但加副標示）

**拒絕理由**：
- 狀態機是第一等公民，應承載此語意
- 篩選、排序、統計都依賴狀態欄位
- Badge 方案破壞資料模型純淨性

### A4：正交維度模型（erp-consultant Round 1 主張）

主狀態 `Order.status`（不可逆）+ `Order.exception_flags`（可循環）分離。

**拒絕理由**：
- Prototype 階段正交維度投入 1-2 週對驗證業務感知無幫助
- 對印刷廠 ERP 規模過度工程（不是 SAP / Oracle 規模）
- 當前僅審稿段唯一一個段落內例外，不足以觸發正交重構

**保留為未來重構選項** — 見 D7 觸發條件。

### A5：暫緩本 change，先做圖編器 Preflight 或通知機制（ceo-reviewer Round 1 傾向）

**拒絕理由**：
- Prototype 階段沒有現有流量可 log Baseline（ceo-reviewer Round 2 修正立場為「兩者互補」）
- Preflight 減少根因但無法涵蓋所有退件類型（erp-consultant Round 2 補充：內容錯誤、客戶改稿、業務主觀判斷佔 20-30% 無法預防）
- 通知機制與狀態節點互補而非互斥（SAP 雙軌實證）

## Risks & Open Questions

### 風險
- 現有 mock 資料中部分 Order.status 在新規則下可能需要重算（check `data-consistency-audit` 是否有類似處理）
- 若有測試針對「Order.status 不可逆」單向斷言嚴格，需放寬
- 若 XM-006 後續 change 長期未推進，「待補件」淪為 zombie status 風險

### Open Questions（已於三視角討論收斂，不再列入待解）
- ~~正交維度 vs 壓扁模型~~ — D7 記帳，本 change 走壓扁
- ~~Baseline 驗證 vs 直接推進~~ — Prototype 階段無 log 價值，直接推進
- ~~命名審稿不合格 vs 待補件~~ — D1 採「待補件」

### 後續 change 待推進
- XM-006「審稿不合格的通知管道與內容模板」— 本 change 歸檔後立即推進
