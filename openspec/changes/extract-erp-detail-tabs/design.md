## Context

詳情頁 Tab 與列表頁狀態 Tab 是兩個不同語意的 Tab，目前兩者狀態：

| 類別 | 目的 | 現況 |
|------|------|------|
| **列表頁狀態 Tab** | 篩選狀態（全部 / 進行中 / 已完成） | 已抽成 `ErpStatusTabs`（`src/components/layout/ErpStatusTabs.tsx`），支援 underline / pill variant、count badge、disabled |
| **詳情頁 Tab** | 切換詳情頁內的不同內容區（基本資訊 / QC / 異動 / 活動紀錄 etc.） | **未抽元件**，`QuoteDetailPage` 與 `WorkOrderDetail` 兩處手寫相同 class |

本 change 只處理第二類。

現有手寫樣式（兩頁完全相同）：
- 外殼：`<div className="rounded-lg border border-border bg-card">`
- Tabs：shadcn `<Tabs>` + `className="w-full"`
- TabsList：`bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0 px-2`
- TabsTrigger：`rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5`
- Body：`<div className="p-5">` 包所有 TabsContent

限制：
- 桌機瀏覽器專用
- 不本地 build，所有 UI 驗證透過 Lovable
- Prototype 技術棧 React + TS + Tailwind + shadcn/ui

## Goals / Non-Goals

**Goals:**
- 收斂「詳情頁 Tab」為一個可重用 organism，未來新的詳情頁 Tab 直接用元件，不必複製 class
- 明確與 `ErpStatusTabs` 的語意邊界（列表頁 vs 詳情頁），DESIGN.md §1.4 決策樹指向正確元件
- 兩頁視覺 100% 維持現狀（純 refactor）

**Non-Goals:**
- 其他 Tab 變體（例如巢狀 Tab 三色 badge）— 屬色盤範疇，P2c 處理
- 擴充 `ErpStatusTabs` 或修改 shadcn Tabs 本身
- WorkOrderDetail 內巢狀的材料/工序/裝訂三色 Tab（line 1094-1096）— 色盤 P2c 一併處理

## Decisions

### D1 — API 形式：宣告式 `items` + sub-component `Content`

**決定**：
```tsx
<ErpDetailTabs
  defaultValue="items"
  items={[
    { value: 'items', label: `印件報價（${n}）` },
    { value: 'snapshots', label: `報價紀錄（${snapshotCount}）`, hidden: !isSales },
    { value: 'permissions', label: `權限管理（${n}）` },
    { value: 'logs', label: '活動紀錄' },
  ]}
>
  <ErpDetailTabs.Content value="items">...</ErpDetailTabs.Content>
  <ErpDetailTabs.Content value="snapshots">...</ErpDetailTabs.Content>
  ...
</ErpDetailTabs>
```

**設計原則**：
- `items` array 宣告 tab 清單（與 `ErpStatusTabs` API 一致）
- Label 由呼叫端決定（不做 `count` prop 因為括號格式 `label（N）` 是一種慣例，彈性交還呼叫端；`hidden` 支援條件項目（例如 QuoteDetailPage 的 snapshots 僅業務可見）
- Content 用 sub-component JSX 結構（對齊 shadcn `TabsContent` 使用直覺，`value` prop 對應 items 的 value）
- 外殼容器 + TabsList + body padding 全部由元件處理，呼叫端只管 content

**替代方案**：
- **完全 items-based（tab content in array）**：`items={[{ value, label, content: <>...</> }]}`
  - 否決：失去 JSX 結構感，Content 內部 hooks / 狀態宣告會跑出 component 範圍
- **包裝 shadcn Tabs + TabsList + Trigger 各自匹配**：呼叫端仍要寫 Trigger
  - 否決：元件化不夠徹底，沒解決「每次手寫 class」問題

### D2 — uncontrolled 模式為主，支援 controlled

**決定**：支援兩種模式（對齊 shadcn Tabs API）：
- uncontrolled：傳 `defaultValue`（目前兩頁的用法）
- controlled：傳 `value` + `onValueChange`（未來需要外部控制時可用，如 URL sync）

**實作**：直接把 `value` / `defaultValue` / `onValueChange` 傳給內部 `<Tabs>`。

### D3 — 底層仍用 shadcn Tabs，不重寫

**決定**：元件內部用 shadcn `<Tabs>` / `<TabsList>` / `<TabsTrigger>` / `<TabsContent>`，不重寫 Radix 互動邏輯。

**理由**：
- 既有 Tab 行為（鍵盤導航、focus、aria）由 Radix 處理，不需重造
- 只做「class + layout 組合」的封裝，符合「organism 包 atom」定位
- 未來 shadcn / Radix 升級能自動受益

### D4 — `ErpDetailTabs.Content` 輕量包裝

**決定**：
```tsx
ErpDetailTabs.Content = (props: React.ComponentProps<typeof TabsContent>) => (
  <TabsContent {...props} className={cn('mt-0', props.className)} />
);
```

**理由**：
- 呼叫端不直接 import shadcn TabsContent，API 收斂在 `ErpDetailTabs` namespace
- 預設 `mt-0`（因為外層 body 已有 `p-5`，TabsContent 不需再加上 margin）
- 呼叫端仍可覆寫 className

### D5 — `items.hidden` 支援條件 tab

**決定**：item 加 `hidden?: boolean` prop；為 true 時 TabsTrigger 不渲染。

**實務情境**：QuoteDetailPage 的「報價紀錄」tab 只有業務可見（`{isSales && <TabsTrigger>`），`hidden: !isSales` 正好對應。

**替代方案**：呼叫端 `items.filter(...)` — 否決原因：需多一層 boilerplate，`hidden` 宣告式更直覺。

## Risks / Trade-offs

- **抽出後使用點失誤率**：新元件首次上線，兩頁遷移有一次性 regression 風險 → 驗收時對比 before/after 視覺 + 功能（切 tab、count 更新、content 切換）
- **API 鎖定後擴充成本**：若日後需要「TabList 右側放 action 按鈕」（例如某頁想放「全部展開」），現在 API 不支援 → 留為 future extension，必要時加 `actions` slot prop
- **Content 要求 value 匹配 items**：呼叫端若打錯 value 字串，shadcn 會悄悄忽略該 Content（無 runtime error）→ 建議 items value 用 literal type / enum 型別約束，實作時加 type helper

## Migration Plan

- 本變更僅影響 Prototype 前端，無資料遷移、無 schema 變動
- 部署流程：push 至 `sens-erp-prototype` main → Lovable 自動同步 → 瀏覽器驗證
- 回滾策略：git revert commit；若新元件有 bug，兩頁可暫時回退到手寫版（git diff 查回）

## Open Questions

- **Q1**：是否需要 `actions` slot prop（TabsList 右側放按鈕）？目前兩頁沒用到，本 change 不加，未來需要時擴充
- **Q2**：WorkOrderDetail 內巢狀 Tab（生產任務展開內的材料/工序/裝訂三色 Tab）是否也用 `ErpDetailTabs`？**不**，巢狀 Tab 的三色 badge 屬色盤範疇（P2c），本 change 不動
