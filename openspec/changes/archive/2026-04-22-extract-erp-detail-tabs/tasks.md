## 1. 新建 ErpDetailTabs 元件

- [x] 1.1 新建 `src/components/layout/ErpDetailTabs.tsx`
  - Props：
    - `items: { value: string; label: React.ReactNode; hidden?: boolean }[]`
    - `defaultValue?: string` / `value?: string` / `onValueChange?: (v: string) => void`（對齊 shadcn Tabs API）
    - `className?: string`（可覆寫外殼容器 class）
    - `children: React.ReactNode`（TabsContent 列表，呼叫端用 `ErpDetailTabs.Content`）
  - 內部結構：`<div className="rounded-lg border border-border bg-card"><Tabs><TabsList>...{triggers}</TabsList><div className="p-5">{children}</div></Tabs></div>`
- [x] 1.2 Sub-component `ErpDetailTabs.Content`：包裝 shadcn `TabsContent`，預設 `className="mt-0"`（因外層已有 p-5）
- [x] 1.3 Trigger 渲染：items.filter(i => !i.hidden).map → `<TabsTrigger value={i.value} className="...固定 class...">{i.label}</TabsTrigger>`
- [x] 1.4 `npx tsc --noEmit` 通過

## 2. 套用至 QuoteDetailPage

- [x] 2.1 讀 `src/components/quote/QuoteDetailPage.tsx:204-234` 了解現狀
- [x] 2.2 Remove shadcn `Tabs` / `TabsList` / `TabsTrigger` 的 import（保留 `TabsContent` 或改用 `ErpDetailTabs.Content`）
- [x] 2.3 將 `<div className="rounded-lg border bg-card"><Tabs>...` 改為 `<ErpDetailTabs defaultValue="items" items={...}>`
  - items 中 `snapshots` 傳 `hidden: !isSales`
  - label 維持括號格式：`印件報價（${n}）` / `報價紀錄（${n}）` / `權限管理（${n}）` / `活動紀錄`
- [x] 2.4 `<div className="p-5"><TabsContent>...` 改為直接 `<ErpDetailTabs.Content value="items">...</ErpDetailTabs.Content>` 4 個 content（順序不變：items / snapshots / permissions / logs）
- [x] 2.5 `npx tsc --noEmit` 通過

## 3. 套用至 WorkOrderDetail

- [x] 3.1 讀 `src/pages/WorkOrderDetail.tsx` 找目前 Tab 位置（line 805 附近）
- [x] 3.2 Remove `Tabs / TabsList / TabsTrigger` import（保留巢狀 Tab 用的 shadcn Tabs，只移除主 Tab 部分）
- [x] 3.3 將外層 `<div className="rounded-lg border-border bg-card"><Tabs defaultValue="tasks">` 改為 `<ErpDetailTabs defaultValue="tasks" items={...}>`
  - 4 個 items：`tasks` / `qc` / `modifications` / `activity`
  - label 用括號 count 格式（沿用現有做法）：`生產任務（${wo.tasks.length}）` / `QC 記錄（${wo.qcRecords.length}）` / `異動紀錄（${wo.modifications.length}）` / `活動紀錄`
- [x] 3.4 四個 `<TabsContent value="...">` 改為 `<ErpDetailTabs.Content value="...">`
- [x] 3.5 注意：WorkOrderDetail 內還有**巢狀 Tab**（line 1077-1092，生產任務展開內的材料/工序/裝訂三色 Tab），**不動**（屬 P2c 色盤範疇）
- [x] 3.6 `npx tsc --noEmit` 通過

## 4. DESIGN.md §1.4 更新

- [x] 4.1 `sens-erp-prototype/DESIGN.md` §1.4.3 Organism 清單新增 `ErpDetailTabs` 條目
  - 用途：「詳情頁內容切換（切換內容區），外層含卡片容器 + 底線式 TabsList + body padding；對齊 QuoteDetailPage / WorkOrderDetail 既有 pattern」
- [x] 4.2 §1.4.4 決策樹補「詳情頁 Tab（切內容區）」場景 → `ErpDetailTabs`（與「列表頁狀態切換」的 `ErpStatusTabs` 明確區分）

## 5. 驗收（Lovable 瀏覽器）

- [x] 5.1 QuoteDetailPage：Tab 切換正常、4 個 TabsContent 內容完整、snapshots tab 僅業務可見、count 顯示正確
- [x] 5.2 WorkOrderDetail：主 Tab 切換正常、4 個 TabsContent 內容完整、巢狀 Tab（生產任務展開內）未受影響
- [x] 5.3 兩頁視覺 pixel-level 一致於遷移前（外殼卡片 / 底線 active / body padding / active color）
- [x] 5.4 DevTools 檢查：兩頁不再出現 inline 寫死 `rounded-none border-b-2 border-transparent data-[state=active]:border-primary` 這段 trigger class

## 6. Commit + Push

- [x] 6.1 提交 Prototype 變更至 `sens-erp-prototype` main
- [x] 6.2 完成 5.x 驗收後歸檔 change
