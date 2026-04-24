## 1. 訂單詳情頁印件列操作欄清理

- [ ] 1.1 於 `src/pages/OrderDetail.tsx` 移除印件列操作欄的 Trash（Trash2 icon）按鈕 JSX 與相關 event handlers
- [ ] 1.2 於 `src/pages/OrderDetail.tsx` 移除印件列操作欄的 Eye 按鈕 JSX 與相關 event handlers
- [ ] 1.3 清理 `src/pages/OrderDetail.tsx` 不再使用的 `Trash2`、`Eye` icon imports（`lucide-react`）
- [ ] 1.4 確認 `useErpStore` 內若有未實作的 `deletePrintItem` stub，一併移除
- [ ] 1.5 視覺檢查：印件列操作欄只保留「補件（狀態依賴）」與「編輯」按鈕

## 2. 編輯 Panel 元件

- [ ] 2.1 建立 `src/components/order/EditOrderPrintItemPanel.tsx`，參考 `src/components/quote/EditPrintItemPanel.tsx` 的 Side Panel 結構
- [ ] 2.2 Panel props 定義：`{ open, onOpenChange, printItem, orderStatus, onSave }`
- [ ] 2.3 Panel 表單狀態初始化：從 props 的 `printItem` 建立 local form state（`useState<OrderPrintItem>`）
- [ ] 2.4 白名單欄位渲染（可編輯）：
  - 2.4.1 印件名稱（Input text）
  - 2.4.2 員工備註（Textarea）
  - 2.4.3 難易度（DifficultyLevelInput，沿用 prepress-review 既有元件）
  - 2.4.4 免審稿（Checkbox）
  - 2.4.5 規格備註（Textarea）
  - 2.4.6 印件檔案備註（Textarea，含字數上限 `CLIENT_NOTE_MAX_LENGTH`）
  - 2.4.7 預計產線（多選 tag，沿用 quote 端 `expectedProductionLines` UI）
  - 2.4.8 出貨方式（Input text）
  - 2.4.9 預計交貨日期（Input type=date；條件 disabled 見 task 2.6）
  - 2.4.10 包裝說明（Input text）
- [ ] 2.5 金額類欄位渲染（永遠 disabled）：
  - 2.5.1 購買數量、單位、成本總額、報價總額以 disabled Input 呈現
  - 2.5.2 金額類區塊下方顯示引導文字：「金額變更請走：建立補收款訂單（支援正負項處理增減）；若需全然取消訂單請使用訂單頂部取消訂單按鈕」
- [ ] 2.6 動態鎖定邏輯：
  - 2.6.1 `orderStatus === '已取消' || orderStatus === '訂單完成'` → Panel 所有可編輯欄位 disabled，頂部顯示提示「訂單已結束，無法編輯」
  - 2.6.2 印件印製狀態為「已送達」時，預計交貨日期欄位 disabled
- [ ] 2.7 儲存行為：
  - 2.7.1 「確認」按鈕 onClick：呼叫 `onSave(form)` 並關閉 Panel
  - 2.7.2 「取消」按鈕 onClick：不儲存直接關閉 Panel
- [ ] 2.8 報價待回簽狀態額外 Toast：
  - 2.8.1 儲存成功後若 `orderStatus === '報價待回簽'`，彈出 Toast「報價待回簽階段的印件修改需同步更新報價單，請至報價單產生新版次」

## 3. Store action 實作

- [ ] 3.1 於 `src/store/useErpStore.ts` 新增 `updateOrderPrintItem(printItemId, changes, actor)` action 介面
- [ ] 3.2 白名單過濾邏輯：action 內定義白名單欄位常數；收到非白名單欄位時以 `console.warn` 提示（正式系統建議 throw，Prototype 先 warn）
- [ ] 3.3 Immer / state 更新：找到對應印件 → 套用 changes → 更新 store
- [ ] 3.4 ActivityLog 寫入：
  - 3.4.1 計算修改欄位清單（比對 before / after）
  - 3.4.2 產生 before / after 摘要（文字類超過 80 字截斷）
  - 3.4.3 寫入訂單 `ActivityLog`，事件類型 `PRINT_ITEM_EDITED`
- [ ] 3.5 Source of truth 驗證：因印件資料集中在 `useErpStore` 的 PrintItem 物件，更新後所有 selector 自動 reactive 同步（不需主動通知下游）

## 4. 訂單詳情頁整合

- [ ] 4.1 於 `src/pages/OrderDetail.tsx` 印件列操作欄新增「編輯（Pencil）」按鈕
- [ ] 4.2 按鈕 onClick：`e.stopPropagation()` + 設定 `editingPrintItem` state + 開啟 Panel
- [ ] 4.3 終態訂單下按鈕 disabled + tooltip「訂單已結束，無法編輯」
- [ ] 4.4 在頁面最底部 render `EditOrderPrintItemPanel`，綁定 state
- [ ] 4.5 Panel 的 onSave 呼叫 `useErpStore.updateOrderPrintItem`

## 5. 訂單頂部變更路徑導引 info icon

- [ ] 5.1 於 `ErpPageHeader` actions 區塊中，「取消訂單」按鈕左側新增 Lucide `Info` 圖示按鈕（14px）
- [ ] 5.2 包裝為 shadcn `Tooltip` 或 `Popover`，hover 時顯示變更決策樹
- [ ] 5.3 Tooltip 內容依 spec 「訂單變更路徑導引」Requirement 定義的 4 條路徑：
  - 印件加項 → 建立補收款（正值）
  - 印件減項 → 建立補收款（負值 / 退款）
  - 規格改動 → 印件列編輯按鈕
  - 全然取消訂單 → 右側取消訂單按鈕
- [ ] 5.4 視覺對齊訂單頁其他 info / 說明圖示的顏色與大小

## 6. 下游顯示同步驗證

- [ ] 6.1 於工單詳情頁 `src/pages/WorkOrderDetail.tsx` 檢查印件相關欄位是否透過 selector / useMemo 即時讀取印件最新值
- [ ] 6.2 於生產任務列表 `src/pages/ProductionTaskList.tsx` 檢查印件相關欄位顯示是否即時同步
- [ ] 6.3 於出貨單區塊檢查印件相關欄位顯示是否即時同步
- [ ] 6.4 若發現任何下游頁面使用獨立快照（非 selector 讀取），改為 selector 即時讀取
- [ ] 6.5 工單 / 生產任務 / 出貨單頁面的印件欄位 MUST 為 read-only（不提供編輯入口）

## 7. Lovable 環境驗證

- [ ] 7.1 Push 至 `sens-erp-prototype` main 分支
- [ ] 7.2 於 Lovable 部署環境驗證：點擊印件名稱 link 正確導向 `/print-items/:id`
- [ ] 7.3 於 Lovable 環境驗證：操作欄不再出現 Trash 與 Eye 按鈕
- [ ] 7.4 於 Lovable 環境驗證：點擊編輯按鈕開啟 Panel，非金額欄位可改、金額欄位 disabled
- [ ] 7.5 於 Lovable 環境驗證：終態訂單下編輯按鈕 disabled
- [ ] 7.6 於 Lovable 環境驗證：編輯儲存後 ActivityLog 顯示 `PRINT_ITEM_EDITED` 事件
- [ ] 7.7 於 Lovable 環境驗證：訂單頂部 info icon hover 顯示 4 條變更路徑
- [ ] 7.8 於 Lovable 環境驗證：編輯後跳轉到工單 / 生產任務頁面顯示同步最新值
- [ ] 7.9 若 `/print-items/:id` 頁面於「訂單視角」下顯示資訊不符業務需求，記錄於 Known Issues（不於本 change 修）

## 8. Spec sync 與 OQ 登記

- [ ] 8.1 Lovable 驗證通過後執行 `opsx:archive`，將 delta spec 合併回 `openspec/specs/order-management/spec.md`
- [ ] 8.2 於 Notion Follow-up DB 新增 3 條 OQ 追蹤：
  - 8.2.1 業務誤建是否也可走負數補收款（而非強制取消訂單）
  - 8.2.2 數量微調 +/- 5% 的高頻場景是否應放寬白名單
  - 8.2.3 編輯併發保護（業務 A 編輯中、業務 B 改狀態）
- [ ] 8.3 執行 `doc-audit` 檢查跨檔案一致性
- [ ] 8.4 更新 `Sens` repo 的 `CLAUDE.md` 若有需要（例如訂單管理 spec 版本號）

## 9. 已知議題記錄

- [ ] 9.1 確認以下項目僅作為 Known Issues 記錄、不於本 change 修：
  - `/print-items/:id` 頁面在「訂單視角」vs「審稿視角」的資訊需求差異
  - 編輯時「預計交貨日期」改至更早日期是否觸發急件費提示
  - 編輯時「出貨方式」變更是否影響運費重算
  - 難易度在工單建立後改動是否應鎖定
  - ActivityLog 是否新增 `targetType / targetId` 欄位
