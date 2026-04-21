## 1. 抽出 useColorCostDerived hook（refactor，行為不變）

- [x] 1.1 新建 `sens-erp-prototype/src/components/workorder/useColorCostDerived.ts`，簽名 `useColorCostDerived(row: DraftRow, workOrderTargetQty: number)`
- [x] 1.2 hook 回傳物件：`selectedEquipment`、`supportsColors`、`front`、`back`、`ptTargetQty`、`setupFee`、`colorCost`、`supportedSpecialColors`、`showTwoColorWarning`、`colorDisabled`、`colorDisabledReason`
- [x] 1.3 重構 `AddProductionTasks.tsx` 的 `ContentRow`（line 757）內部 derive，改呼叫 hook；JSX 不動
- [x] 1.4 `npx tsc --noEmit` 通過；Lovable 驗證既有 inline 編輯色數行為不退化（切設備、改前/背面色數、toggle 特殊色、2–3 色警告顯示皆正常）

## 2. 建立 AddProductionTaskPanel

- [x] 2.1 新建 `sens-erp-prototype/src/components/workorder/AddProductionTaskPanel.tsx`，外框使用 `ErpSidePanel size="xl"`，title 依 `category` 動態（「新增材料任務」/「新增工序任務」/「新增裝訂任務」），footer = 取消 + 確認新增
- [x] 2.2 Props：`{ open, onOpenChange, category: ProcessCategory, workOrderTargetQty, onSubmit(row: DraftRow) }`
- [x] 2.3 local state `useState<DraftRow>(emptyRow())`；`useEffect` 當 `open` 轉 true 時 reset
- [x] 2.4 Section 1（BOM 選擇）：依 `category` 條件渲染材料三層 / 工序兩層 / 裝訂單層 `SearchableSelect`；尾端顯示唯讀廠商 + pricing method badge
- [x] 2.5 Section 2（計價選擇）：呼叫 `getPricingSelectionFields`，`grid-cols-2` 兩個 select；BOM 未選 → disabled + helper text；單軸 → 第二格隱藏
- [x] 2.6 Section 3（製作細節）：`Textarea`
- [x] 2.7 Section 4（數量與排程）：`grid-cols-2` 數量 / 單位 / 設備；開工日 / 工期（自有工廠）或完工日（外包廠）依 `deriveFactoryType` 切換；影響成品 `Checkbox` 單列
- [x] 2.8 Section 5（色數與特殊色，僅工序）：使用 `useColorCostDerived` hook；正/背面色數 `grid-cols-2`、特殊色 chip wrap、設備倍率摘要、開機費 / 色數加價即時顯示、2–3 色警告
- [x] 2.9 Section 6（預估成本摘要）：footer 上方唯讀顯示 unitPrice × qty + 開機費 + 色數加價
- [x] 2.10 驗證：`catalogId` 與 `qty > 0` 必填；採 `showValidation` pattern（按鈕仍可按，未填欄位高亮）；通過則呼叫 `onSubmit(row)` 並 `onOpenChange(false)`
- [x] 2.11 `npx tsc --noEmit` 通過

## 3. 串接至 AddProductionTasks.tsx

- [x] 3.1 移除三個 `useState<DraftRow[]>([emptyRow()])` 的預設 draft，改為 `useState<DraftRow[]>([])`
- [x] 3.2 新增頂層 state：`const [panelState, setPanelState] = useState<{ open: boolean; category: ProcessCategory }>({ open: false, category: '材料' })`
- [x] 3.3 Tab 內「新增一筆」按鈕 onClick 改為 `setPanelState({ open: true, category })`（三 Tab 各自帶對應 category）
- [x] 3.4 頁面底部（Tabs 外）渲染單一 `<AddProductionTaskPanel {...panelState} workOrderTargetQty={wo.targetQty} onOpenChange={o => setPanelState(s => ({ ...s, open: o }))} onSubmit={handleAppend} />`
- [x] 3.5 `handleAppend(row)`：依 `panelState.category` 分派至 `setMaterialRows / setProcessRows / setBindingRows`
- [x] 3.6 `MaterialSection / ProcessSection / BindingSection` 三者 `<tbody>` 支援空狀態：`rows.length === 0` 時渲染單一置中列「尚無資料，點擊右上『新增一筆』開始填寫」
- [x] 3.7 `canDelete` 邏輯移除「保留最後一筆」限制，允許刪至 0
- [x] 3.8 `npx tsc --noEmit` 通過

## 4. 驗收（Lovable 瀏覽器）

- [x] 4.1 三分類新增 flow 各走一次：材料（BOM 三層 + 計價選擇）、工序（BOM 兩層 + 設備 + 色數 + 特殊色）、裝訂（BOM 單層 + 計價選擇）
- [x] 4.2 pricing_selection 三態驗證：未選 BOM（disabled + helper text）、單軸（第二格隱藏）、雙軸（兩格並列）
- [x] 4.3 色數 disabled 驗證：未選設備（「請先選擇設備」）、設備不支援色數（「此設備僅計開機費」）
- [x] 4.4 排程欄位切換：自有工廠 → 顯示工期（天數）+ 自動計算完工日；外包廠 → 顯示完工日 date picker
- [x] 4.5 取消丟棄 draft：填一半按取消 → 下次重開 panel 欄位全空
- [x] 4.6 連續新增：submit 後 panel 關閉，再點「新增一筆」panel 欄位全空（不殘留前筆資料）
- [x] 4.7 空狀態：初次進頁三 Tab 都顯示空狀態；新增一筆後該 Tab 空狀態消失
- [x] 4.8 既有 inline 編輯不退化：改 table 既有列的 cell（BOM / qty / 設備 / 色數）皆能正常更新，預估成本即時重算
- [x] 4.9 儲存分組：panel 新增的 row 最終由 `handleSave` 依 factory 分組合併為 Task，`Task.name` 為廠商名稱

## 5. Commit + Push

- [x] 5.1 提交 Prototype 變更（`useColorCostDerived.ts`、`AddProductionTaskPanel.tsx`、`AddProductionTasks.tsx`）至 `sens-erp-prototype` repo，push 觸發 Lovable 同步
- [x] 5.2 完成 4.x 全部驗收後，於 Sens repo 歸檔 change（`/opsx:archive add-production-task-side-panel`）
