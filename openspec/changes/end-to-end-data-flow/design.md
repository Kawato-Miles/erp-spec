## Context

Prototype 原有兩套 React Context（QuoteContext、OrderContext）管理需求單與訂單，工單以下 ~15 個頁面各自 import 靜態 mock data。各 mock 檔使用不同 ID 體系（mockWorkOrders 用 `demo-pt-XX`、mockDispatch 用 `demo-dpt-XX`），頁面之間的資料完全隔離。

此外，OrderDetail 的訂單狀態推進原為每個狀態配一個手動按鈕，違反[狀態機 spec](../../specs/state-machines/spec.md) 的 bubble-up 設計 — 訂單狀態在審稿段之後應由下層模組（印件、工單、出貨）狀態變化自動推進。

## Goals / Non-Goals

**Goals:**
- 在同一 session 內，從建立需求單一路操作到師傅報工，資料即時傳遞
- 既有 Demo 假資料（大方文創禮盒組等 4 筆訂單）保留為 seed data
- 訂單狀態推進符合狀態機 spec：人工按鈕僅限「確認回簽」與「取消訂單」
- 印件總覽顯示所有已進入製作流程的訂單印件（含尚無工單的）

**Non-Goals:**
- 不實作後端 API / 資料持久化（session-only state）
- 不實作完整 bubble-up 自動推進鏈（審稿 → 製作 → 出貨）— 留待各模組 Prototype 完善後逐步接入
- 不統一 DispatchBoard / SchedulePanel / SchedulingCenter 的 view-specific types — 這些頁面維持 mock import
- 不處理行動裝置適配

## Decisions

### D1: Zustand 取代 React Context

**選擇**: 單一 Zustand store（`src/store/useErpStore.ts`）

**替代方案**: 多個互相連結的 React Context

**理由**:
- Zustand 不需 Provider 包裹，可逐頁遷移，不必一次改完 App.tsx
- 單一 `set()` 可原子更新跨實體（如 `convertQuoteToOrder` 同時更新 quote.linkedOrderId + 新增 order）
- Context 跨模組通訊需要額外的 event bus 或 nested providers，Zustand 天然支援

### D2: 保留 canonical types + selector 衍生 view types

**選擇**: Store 儲存 canonical types（ProductionTask、WorkOrderDetail），各頁面透過 selector 函式衍生 view types（DispatchProductionTask、SchedulePanelTask）

**替代方案**: 統一所有 types 為一個 mega-type

**理由**:
- view types 需要跨實體 denormalized join（如 DispatchProductionTask 需要 clientName、deliveryDate），放在 canonical type 會造成更新異常
- selector 函式集中在 `src/store/selectors/`，容易找到和維護
- 已有的 view-specific mock 檔（mockDispatchBoard、mockSchedulePanel 等）型別差異過大，強制統一投資報酬率低

### D3: Seed data 從既有 mock 檔案組裝

**選擇**: `src/store/seedData.ts` 匯入所有 mock 檔案，組裝初始 store state。mockDispatch 的派工欄位（scheduledDate、workPackageId 等）合併回 mockWorkOrders 的 ProductionTask。

**理由**:
- 保留既有 Demo 情境（打樣 NG 重建、齊套性計算等），不需重寫假資料
- ID 對齊（`demo-dpt-XX` → `demo-pt-XX`）在 Phase 0 一次處理完

### D4: 訂單狀態推進 — confirmSignBack action

**選擇**: OrderDetail 僅保留「確認回簽」與「取消訂單」按鈕。`confirmSignBack` action 按下後依印件審稿狀態自動決定下一步：
- 所有印件 `reviewStatus` 為「合格」或「免審稿」→ 直接進入「製作等待中」（免審稿快速路徑，對應[狀態機 spec](../../specs/state-machines/spec.md) § 訂單狀態機 § 免審稿快速路徑）
- 否則 → 進入「稿件未上傳」

**理由**:
- 符合狀態機 spec：審稿段之後的狀態推進皆由下層 bubble-up 驅動
- 尚未實作的 bubble-up 留為空缺，不用 mock 按鈕假裝

### D5: 印件總覽三資料來源

**選擇**: PrintItemDashboard 的 `buildUnifiedData` 從三個來源收集印件：
1. `mockPipelineItems`（靜態 pipeline data）
2. WorkOrderSummary group by printItemId（有工單的進度追蹤）
3. Orders 中已進入製作流程（製作等待中及之後）的印件（以 orders 為權威來源，去重已收集的）

**理由**:
- 來源 1+2 覆蓋既有 Demo 資料，來源 3 補充新建訂單的印件
- 不是「只篩選無工單」，而是確保所有應顯示的印件都出現

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 頁面混合新舊模式（store vs mock import） | DispatchBoard / SchedulePanel / SchedulingCenter 維持 mock import，在不影響主流程前提下逐步遷移 |
| WorkOrderDetail 1700 行遷移複雜 | 所有 setWo 呼叫改為 updateWorkOrder(id, updater)，保持 updater 函式簽名一致 |
| Selector 效能（每次 render 重新 join） | 使用 useMemo 穩定衍生結果，必要時加 useShallow |
| 訂單狀態在審稿後無法推進（bubble-up 未實作） | 已知限制，訂單會停在「稿件未上傳」直到後續模組實作完成 |
| seed data ID 對齊可能遺漏 | Phase 0 用 grep 確認所有 `demo-dpt-` 引用已替換，其他 mock 檔無引用 |
