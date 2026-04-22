## Why

詳情頁 Tab（切內容區：生產任務 / QC / 異動 / 活動紀錄）目前在兩處各自手寫相同一大段 class：

- `QuoteDetailPage.tsx:204-234`（需求單詳情頁）
- `WorkOrderDetail.tsx` 新近 Tab（工單詳情頁）

兩處的 class 完全相同：
```tsx
<div className="rounded-lg border border-border bg-card">
  <Tabs>
    <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0 px-2">
      <TabsTrigger className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5">
        label（count）
      </TabsTrigger>
      ...
    </TabsList>
    <div className="p-5">
      <TabsContent>...</TabsContent>
      ...
    </div>
  </Tabs>
</div>
```

未來訂單詳情、印件詳情、生產任務詳情等頁面加 Tab 時，會繼續複製這段。這屬於「已有固定 pattern 但未元件化」的技術債，應該抽成共用元件（DESIGN.md §1.4 Organism 層），讓後續使用者只傳 `items` 與 `children` 就拿到標準視覺。

另一個動機：上個 change 實作時曾誤把 `ErpStatusTabs`（列表頁狀態切換器）套用到詳情頁 Tab，反映「沒有明確元件 → 選擇空間 → 容易挑錯」。明確抽出 `ErpDetailTabs` 後，DESIGN.md 決策樹可直接指向正確元件，避免再犯。

## What Changes

**新增 Organism 元件**：
- `ErpDetailTabs`（`src/components/layout/ErpDetailTabs.tsx`）：包裝 shadcn `Tabs`，內建外層卡片容器、TabsList 底線式切換、body p-5 padding
- sub-component `ErpDetailTabs.Content`：包裝 shadcn `TabsContent`（class 已內建）
- 支援 `items` 宣告式 API：`{ value, label, count?, hidden? }[]`

**套用兩處**：
- `QuoteDetailPage.tsx` 的 Tabs（items / snapshots / permissions / logs）改用 `ErpDetailTabs`
- `WorkOrderDetail.tsx` 的 Tabs（tasks / qc / modifications / activity）改用 `ErpDetailTabs`

**DESIGN.md §1.4**：
- 新元件加入 Organism 層清單
- §1.4.4 決策樹補「詳情頁 Tab（切內容區）」場景 → `ErpDetailTabs`
- 明確與 `ErpStatusTabs`（列表頁狀態切換）的語意邊界

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

無 spec-level 行為變更（純 UI 元件抽出）。

## Impact

- **新增**：`sens-erp-prototype/src/components/layout/ErpDetailTabs.tsx`
- **修改**：
  - `sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx`（遷移到 `ErpDetailTabs`）
  - `sens-erp-prototype/src/pages/WorkOrderDetail.tsx`（遷移到 `ErpDetailTabs`）
  - `sens-erp-prototype/DESIGN.md` §1.4 新增 `ErpDetailTabs` + 更新決策樹
- **不受影響**：
  - 業務邏輯、資料模型、狀態機、商業流程
  - OpenSpec specs（純 UI，無 requirement 變更）
  - shadcn `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` 本身
  - `ErpStatusTabs`（列表頁狀態切換，不動）
  - 巢狀 Tab（如 WorkOrderDetail 生產任務展開內的材料/工序/裝訂三色 Tab）— 屬色盤範疇，留 P2c
- **使用者體驗**：
  - 無可見變化（純內部 refactor，DOM 結構與 class 完全相同）
- **行為相容**：
  - 兩頁原本用 `<Tabs defaultValue>` uncontrolled 模式，`ErpDetailTabs` 同樣支援
  - Tab count badge 用括號格式（`生產任務（N）`），維持既有呈現
