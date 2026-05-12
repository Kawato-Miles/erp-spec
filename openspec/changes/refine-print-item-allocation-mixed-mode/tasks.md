## 1. Spec 對齊與依賴確認

- [x] 1.1 確認 `useErpStore.ts` L1617-1694 自動建草稿邏輯為 B2B 空草稿正確帶入 `region: '台灣'` 預設值（已驗證 L567 `region: '台灣'`）
- [x] 1.2 確認 `WorkOrderDetail` Data Model 已有 `assignedTo` 欄位（types/workOrder.ts L347 `assignedTo: string`）
- [x] 1.3 確認 `WorkOrderDetail.activityLogs` 結構支援本 change 新增的兩類 action 文案（types/workOrder.ts L262-267 `WorkOrderActivityLog: id / timestamp / user / action`）

## 2. Store Action 補完

- [x] 2.1 重用既有 `assignWorkOrder(woId, assignedTo, supervisor)` action（useErpStore.ts L2305-2335，已實作 `assignedTo` 寫入 + activityLogs 條目）
- [x] 2.2 新增 `addManualWorkOrderDraft(printItemId, { type, region, officerName })` action：建立空草稿（status='草稿'，tasks=[]），自動帶入 `targetQty` = 印件 `orderedQty`、`unit` = 印件 `unit`、`quantityPerPrintItem` = 1，並 append 工單與訂單層 `activityLogs`
- [x] 2.3 新 action 同步更新 order 的 `workOrders` summary、`workOrderCount`、印件層 `workOrderCount` 與 order 層 `activityLogs`
- [x] 2.4 修正 `buildAutoCreatedWorkOrder`（UAT 後追加，對齊 design Decision 9）：將 `status` 從 `'製程確認中'` 改為 `'草稿'`、`assignedTo` 從 `PRODUCTION_STAFF[0]` 改為 `''`、`supervisor` 從 `PRODUCTION_MANAGERS[0]` 改為 `''`，對齊 work-order spec § 工單草稿建立 L47

## 3. AssignPrintItemDialog 元件改造

- [x] 3.1 `AssignPrintItemDialog.tsx`：移除「目前 prototype 僅關閉 dialog」註解；將 `onConfirm` 改為必填 prop（移除 optional `?`）
- [x] 3.2 新增 prop `existingDrafts: ExistingDraft[]` 與 `printItemSource: 'B2C' | 'B2B'`（決定下半追加區是否顯示）
- [x] 3.3 上半區塊渲染既有草稿列，每列顯示工單編號、類型（唯讀 Badge）、地區（唯讀 Badge）、生產任務數量、來源標籤（自動建立 / 手動建立 Badge）、印務指派下拉（必填）
- [x] 3.4 下半區塊（僅 B2B）「追加新工單」按鈕與類型 / 地區 / 印務三欄
- [x] 3.5 Dialog 標題新增「N/M 工單已指派印務」進度徽章
- [x] 3.6 `handleConfirm` 產出結構化 `AssignmentResult`（`existingAssignments: Record<workOrderId, officerName>` + `newWorkOrders: Array<{ type, region, officer }>`）
- [x] 3.7 提交校驗——既有草稿留空印務 → 反白標示未完成列 + disable 確認按鈕；下半追加項三欄不全 → disable

## 4. 呼叫點補 onConfirm 實作

- [x] 4.1 `PrintItemDetail.tsx`：傳入 `existingDrafts`（從 `relatedWOs.filter(w => w.status === '草稿')` 派生）與 `printItemSource`（從 `printItem.orderSource` 取）；補 `onConfirm` handler，依 `AssignmentResult` 呼叫 `assignWorkOrder` 與 `addManualWorkOrderDraft`
- [x] 4.2 `PrintItemDashboard.tsx`：派生 `dialogContext` useMemo（`existingDrafts` + `printItemSource`），補 `onConfirm` handler
- [x] 4.3 兩個呼叫點：「分配印件」按鈕在印件非「等待中」狀態下 `disabled`，並設置 `title` 提示文案

## 5. 印件總覽優先顯示邏輯

- [x] 5.1 `PrintItemDashboard.tsx`：擴充排序邏輯——第一級「工單數 = 0」、第二級「等待中且至少 1 張工單未指派印務」均置頂
- [x] 5.2 兩類印件已透過排序順序區分（不另加額外 badge，避免與既有印件狀態 badge 視覺衝突）

## 6. 文案修正

- [x] 6.1 `AssignPrintItemDialog.tsx`：移除「將為此印件建立 N 張工單草稿」，改為「既有工單草稿（N 張待指派）」+「追加新工單（將追加 M 張新工單草稿）」
- [x] 6.2 確認按鈕文案：純指派時「確認指派（N 張）」、混合模式「確認分配（N 位指派 + M 張追加）」

## 7. Prototype 驗證（依 design 之 Migration Plan 步驟 3）

- [ ] 7.1 部署至 Lovable 後，建立 B2C 印件 mock data：審稿合格 → 進入分配 Dialog 應只看到 1 張既有草稿、無下半區塊
- [ ] 7.2 建立 B2B 印件 mock data：審稿合格 → 進入分配 Dialog 應看到 1 張既有空草稿（含「自動建立」標籤）+ 下半「追加新工單」按鈕
- [ ] 7.3 驗證提交後：B2C 工單草稿總數 = 1（不增加）；B2B 工單草稿總數 = 1 + 追加項數量
- [ ] 7.4 驗證 ActivityLog 寫入：工單詳情頁 / 印件詳情頁可看到「印務主管指派印務 [name]」與「印務主管追加新工單草稿並指派印務 [name]」
- [ ] 7.5 驗證非等待中印件「分配印件」按鈕 disabled
- [ ] 7.6 驗證印件總覽優先顯示：B2C「有草稿但未指派」與 B2B「工單數 = 0」均置頂

## 8. OQ 同步

- [ ] 8.1 在 Notion Follow-up DB 新增三個 OQ：「退回審稿後既有草稿命運」、「審稿合格 → 印務接手主動觸發機制」、「印件分配完成狀態欄位升格」（對齊 proposal § 衍生 OQ）
- [ ] 8.2 在 Notion Follow-up DB 將 PI-012「防掉單對帳機制」標記為「部分解答」，本 change 兌現 Dialog 視覺收斂與印件總覽優先顯示，對帳報表 / 主動觸發留待 OQ-NEW-2

## 9. 文件稽核與歸檔

- [ ] 9.1 觸發 `doc-audit` skill：跨檔案一致性檢查（work-order spec / business-processes spec / user-roles spec）
- [ ] 9.2 通過 `openspec validate refine-print-item-allocation-mixed-mode --strict`
- [ ] 9.3 透過 `/opsx:archive` 歸檔本 change，spec delta 合併入 `openspec/specs/work-order/spec.md`
- [ ] 9.4 更新 CLAUDE.md § Spec 規格檔清單：work-order 模組版本與狀態
