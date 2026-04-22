## 0. 擴充 ErpSummaryGrid atom 支援 5/6 欄

- [x] 0.1 `src/components/layout/ErpSummaryGrid.tsx` 的 `cols` prop type 從 `2 | 3 | 4` 擴充為 `2 | 3 | 4 | 5 | 6`
- [x] 0.2 `gridColsClass` 對應新增 `cols === 5 ? 'grid-cols-5' : cols === 6 ? 'grid-cols-6' : 'grid-cols-4'`
- [x] 0.3 其他既有用法（2/3/4 欄）SHALL 不變
- [x] 0.4 `npx tsc --noEmit` 通過

## 1. 成本摘要（D1 + D7）

- [x] 1.1 將現有 `costSummary` useMemo 擴充為 `{ material, process, binding, setupFee, colorCost }` 5 欄物件
  - `material` / `process` / `binding` = 對應 rows 的 `unitPrice × qty` 加總（原邏輯）
  - `setupFee` = 所有 rows 的 `calculateSetupFee(equipment)` 加總（材料無設備 → 0；工序 / 裝訂視 row.equipment 而定）
  - `colorCost` = 工序 rows 的 `calculateColorCost(equipment, colorSpec, ptTargetQty)` 加總
    - `ptTargetQty = Number(r.qty || 0) × wo.targetQty`
    - 與 `handleSave` 組 ProductionTask 時的 `estimatedColorCost` 算法一致
- [x] 1.2 在 `ErpPageHeader` 下方新增 `<ErpSummaryGrid cols={5}>` 5 欄依序：`設備費 / 材料小計 / 工序小計 / 裝訂小計 / 色數加價`
  - 每欄 value = `NT$ {n.toLocaleString()}`，n === 0 時顯示 `—`
  - 不另列「總計」欄（Miles 決議）
- [x] 1.3 `ErpPageHeader` badges 移除原本的「預估成本 NT$ X」小字，只保留印件名稱 badge
- [x] 1.4 `npx tsc --noEmit` 通過

## 2. 工單資訊容器改 ErpDetailCard + ErpInfoTable（D3）

- [x] 2.1 讀 `src/components/layout/ErpDetailCard.tsx` 與 `src/components/layout/ErpInfoTable.tsx` 確認 API
- [x] 2.2 將現有「工單資訊」手寫 `<div className="bg-white border border-[#e3e4e5] rounded-xl p-5">` 改為 `<ErpDetailCard title="工單資訊" icon={Info}>`
- [x] 2.3 將現有 `grid grid-cols-[120px_1fr]` key-value 列表改為 `<ErpInfoTable items={[{ label: '工單編號', value: wo.workOrderNo }, ...]} />`
  - 項目：工單編號 / 印件名稱 / 數量 / 交貨日期 / 製程說明（若有）
- [x] 2.4 `npx tsc --noEmit` 通過

## 3. 三分類 Tab 容器改 ErpDetailCard（D4）

- [x] 3.1 讀 `ErpDetailCard` 確認是否支援「無 title」或「header slot 放 Tab bar」的組合
- [x] 3.2 若支援：將手寫 `<div className="bg-white border border-[#e3e4e5] rounded-xl">` 改為 `<ErpDetailCard>`（無 title 或 title="生產任務"）
- [ ] 3.3 若不支援：維持手寫 `<div>` 但所有 hex 改 token（`bg-card border-border rounded-xl`），並於 design.md 補記「ErpTabsCard 待後續 change 新建」
- [x] 3.4 `npx tsc --noEmit` 通過

## 4. 表格套 .erp-table class（D5）— 本次跳過

**跳過理由**：`.erp-table` 的 `td { padding: 16px; min-height: 52px }` 是為列表頁純文字單元格設計，套進 cell 內嵌 input 的表單列會讓每 row 高度從 ~28px 變 ~60px，屬於意料外的視覺重大改動。**建議待 P2 新 atom `.erp-form-table` 輔助 class**（同樣具備全站統一邊框 / hover，但 padding 保留密集）再套。

- [ ] ~~4.1 讀 `src/index.css` 確認 `.erp-table` 定義的樣式範圍~~（已讀，決定暫不套）
- [ ] ~~4.2 套 `className="erp-table"`~~（延 P2）
- [ ] ~~4.3 樣式衝突檢查~~
- [ ] ~~4.4 tsc~~

## 5. Hex → design token（D6）

- [x] 5.1 `src/pages/AddProductionTasks.tsx` 全檔案 grep hex (`#[0-9a-fA-F]{3,6}`)，列出所有命中點
- [x] 5.2 分類處理：
  - `#e3e4e5` → `border-border`
  - `#232324` → `text-foreground`
  - `#636466` → `text-muted-foreground`
  - `#f7f7f7` → `bg-muted`
  - `bg-white`（容器）→ `bg-card`
- [x] 5.3 不動：印件名稱 badge（`#f1fde8` / `#defacd` / `#3c9d13`）與 Tab 三色（amber/blue/green），於 design.md Open Questions 標註待 P2 處理
- [x] 5.4 `npx tsc --noEmit` 通過

## 6. 驗收（Lovable 瀏覽器）

- [x] 6.1 空狀態：初次進頁，5 欄摘要全顯示 `—`，三 Tab 皆空狀態
- [x] 6.2 材料 Tab 新增 2 筆 → 材料小計 = 2 筆合計；其他 4 欄維持 `—`
- [x] 6.3 工序 Tab 新增 1 筆（含設備、色數）→ 工序小計（不含加價）/ 設備費 / 色數加價三欄分別正確
- [x] 6.4 工單資訊卡片視覺與「工單詳情頁」的 Info 卡片（`ErpDetailCard`）一致
- [x] 6.5 三個分類表格樣式與「工單列表頁」（`.erp-table`）一致：邊框 / hover / header 灰底
- [x] 6.6 Tab 切換正常（三色 badge 維持現狀，P2 處理）
- [x] 6.7 既有新增 panel 與 inline 編輯不退化
- [x] 6.8 每筆 row 的 table 最右「預估成本」欄仍顯示 `NT$ rowCost + @unitPrice/unit（粗估）`（Miles 決議：逐筆明細由此欄承擔）
- [x] 6.9 瀏覽器 DevTools 檢查：無字面 hex 殘留（除 D6 豁免範圍）

## 7. Commit + Push

- [x] 7.1 提交 Prototype 變更至 `sens-erp-prototype` main，push 觸發 Lovable 同步
- [x] 7.2 完成 6.x 全部驗收後，於 Sens repo 歸檔 change（`/opsx:archive refactor-add-production-tasks-page`）
