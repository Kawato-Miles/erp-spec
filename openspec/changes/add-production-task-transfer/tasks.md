# add-production-task-transfer — Tasks

## 0. Baseline 測量（與開發平行啟動，上線前 1 週完成）

- [ ] 0.1 Miles 協調 2 位印務參與，告知為期 5 個工作日的追蹤調查
- [ ] 0.2 由 Miles 每日下班前 5 分鐘口頭詢問：(a) 今天追了幾次物件 (b) 大概花多久 (c) 有沒有等貨 / 送錯，填於事件登記表
- [ ] 0.3 彙整 5 天數據：平均每日追蹤次數 / 時間、等貨次數、送錯次數
- [ ] 0.4 計算 Baseline 量化金額：`印務時薪 × 追蹤時間 + 下一站空等工時 × 產線人時成本 + 送錯次數 × 平均重做成本`
- [ ] 0.5 Baseline 數據寫入歸檔 notes，作為成功指標 ROI 追蹤起點

> 備註：本章節為非代碼任務，由 Miles 協調印務訪談。代碼實作與 Baseline 平行進行，互不相依。

## 1. 型別與資料層

- [x] 1.1 新增 `src/types/transfer.ts` 定義 `TransferTicket`、`TransferTicketStatus`（運送中 / 已送達 / 已作廢）、`TransferTargetType`（內部產線 / 外部廠商）、`TransferDeliveryMethod`、`RevocationType`（送錯目的地 / 數量不符 / 品質不符 / 其他）、`TransferRevocationLog` 型別
- [x] 1.2 在 `src/types/workOrder.ts` 的 `ProductionTask` 型別新增 `transferRequired?: boolean`（optional 以相容既有 mock；實務透過 `isTransferRequired` helper 推算）；**MUST NOT** 在 ProductionTask 新增其他 transfer_* 欄位
- [x] 1.3 在 Prototype mock store 新增 `transferTickets` + `transferRevocationLogs` state 與對應 actions（addTransferTicket、confirmTransferDelivered、revokeTransferTicket、cancelTransferTicket）
- [x] 1.4 既有 mock ProductionTask 保持不動（採 `isTransferRequired` helper 由 factory + process 推算預設，避免大規模改動 mock 資料）
- [x] 1.5 在 `src/lib/data-consistency/crossLayerAssertions.ts` 評估：**不納入**。理由：TransferTicket 為生產任務單層組合實體，聚合邏輯封裝於 `src/lib/transfer/aggregateTransferStatus.ts`，無跨層欄位一致性需求。未來若加入工單層彙總（類 QC 單工單詳情頁聚合）時重新評估

## 2. 聚合邏輯與工具函式

- [x] 2.1 實作 `src/lib/transfer/aggregateTransferStatus.ts`：`getTransferBadgeStatus`（業務 Badge 聚合）+ `deriveProductionTaskStatus`（技術狀態推導）
- [x] 2.2 實作 `src/lib/transfer/validateTransferQuantity.ts`：計算可申請轉交量上限與建單驗證
- [x] 2.3 實作 `src/lib/transfer/buildSlackSummary.ts`：摘要模板 + `copySlackSummary` 封裝剪貼簿 API
- [x] 2.4 實作 `src/lib/transfer/crossStationProcesses.ts`：跨站類工序清單、`isTransferRequired`、`isTransferRequiredLocked` helper，標 TODO 指向未來 Process 主檔 `is_cross_station` 欄位
- [x] 2.5 三個函式單元測試：`src/test/transfer/` 共 34 個測試通過（聚合 17、上限 11、摘要 6），覆蓋空 Ticket、全作廢、分批、撤回後、缺省欄位占位等邊界

## 3. TransferTicket UI 元件（`src/components/task-dispatch/transfer/`）

- [x] 3.1 `TransferTicketList.tsx`：列表 + 分區標題 + 摘要統計 + 「新增轉交單」按鈕；依 `isTransferRequired` 決定是否渲染
- [x] 3.2 `TransferTicketDialog.tsx`：建單表單，`targetType` radio 切換條件欄位、目的下拉、運送方式、貨運行名稱條件顯示、target_quantity 即時驗證可申請上限、廠內執行者純文字、備註、預計轉交日、簽收照片 placeholder 說明
- [x] 3.3 Dialog 儲存時自動 `buildSlackSummary` + `navigator.clipboard.writeText` + Toast「已複製至剪貼簿，可貼到 Slack」
- [x] 3.4 `TransferTicketCard.tsx`：展開詳情含目的地、運送方式、廠內執行者、預計/實際日、備註、作廢原因、撤回紀錄時序、操作按鈕（確認送達 / 撤回 / 作廢 / 重新複製 Slack 摘要）
- [x] 3.5 `TransferRevokeDialog.tsx`：revocation_type select（4 選項）+ reason textarea（type = 其他時必填）；append log、重置欄位、狀態回運送中
- [x] 3.6 `TransferCancelDialog.tsx`：採 AlertDialog（符合 DESIGN.md「刪除須二次確認」）+ reason textarea
- [x] 3.7 預填行為：`TransferTicketList` 以同任務最近一筆 Ticket 的 `deliveryMethod` 作為 Dialog 預設值

## 4. ProductionTaskDrawer 整合

- [x] 4.1 在 `src/components/task-dispatch/ProductionTaskDrawer.tsx` 新增「轉交單」分區，僅在 `isTransferRequired(task) = true` 時渲染
- [x] 4.2 分區內容：標題「轉交單」+ 狀態提示文字 + `TransferTicketList`（該任務的 Ticket 陣列）
- [x] 4.3 `transferRequired` 顯示策略採 read-only（鎖定 true 顯示「外包 / 中國廠必經」；自有 / 加工顯示「依工序類別推薦」）；**toggle 切換 UI 延後至建立流程改造**
- [x] 4.4 SheetTitle 加入轉交業務 Badge（待轉交 / 已轉交 / 待建立轉交單），基於 `getTransferBadgeStatus` 聚合結果

## 5. ProductionTaskList Badge

- [x] 5.1 修改 `src/pages/ProductionTaskList.tsx` 任務列狀態 cell，在 `ProductionTaskStatusBadge` 旁依聚合計算顯示轉交 Badge
- [x] 5.2 任一 Ticket 運送中 → 黃色 Badge「待轉交」
- [x] 5.3 所有非作廢 Ticket 已送達（至少一張）→ 綠色 Badge「已轉交」
- [x] 5.4 `transferRequired = false` 或全部 Ticket 作廢 → 不顯示轉交 Badge（`getTransferBadgeStatus` 回傳「無」時 render null）

## 6. 生產任務狀態機聚合整合

- [x] 6.1 聚合邏輯 `deriveProductionTaskStatus` 已提供，UI 層（Drawer / List）透過 React store 訂閱自動 re-render 讀取最新聚合；**pt.status 實際欄位不變更**（顯示層以業務 Badge 表達，符合 design D2 的「非侵入式」精神）
- [ ] 6.2 外包 / 中國廠「製作完畢」觸發「待建立轉交單」子態 — **延後**。supplier-portal change 尚未完整 apply；等該 change 完成時於 supplier-portal action 補一行 `if (transferRequired) productionTask.businessBadge = '待建立轉交單'`
- [x] 6.3 Ticket 狀態變更後生產任務狀態重新聚合：由 Zustand store 訂閱自動完成（React 於 transferTickets 變動時重新執行 `getTransferBadgeStatus`）
- [ ] 6.4 生產任務作廢 / 報廢連動 Ticket — **延後**。既有 addModification 邏輯複雜且作廢為低頻情境；等有實際情境需求時另開 change 整合

## 7. transfer_required 推薦勾選

- [x] 7.1 `isTransferRequired` helper 提供依 factory + process 的自動推薦邏輯；既有生產任務建立流程無需額外修改（新建任務 transferRequired 為 undefined 時 helper 自動推算）
- [x] 7.2 跨站類判定使用 `crossStationProcesses.ts` 清單（印刷 / 上光 / 模切 / 燙金 / UV / 裁切 / 印刷 CMYK / 印刷 Pantone 金）

> 備註：手動 toggle 覆蓋 UI 延後至未來 Process 主檔 change 一併處理（含 `is_cross_station` 欄位遷移）

## 8. 情境驗證（Prototype E2E）

> **驗證方式**：Miles 偏好「Prototype 不本地跑、測試都走 Lovable」。代碼層驗證已由 tsc 型別檢查 + 新增 34 個單元測試通過。以下 UI 情境於 push 至 Lovable 後依序驗證並回填狀態。

- [ ] 8.1 情境 A（廠內自送）：自有工廠印刷任務 pt_produced_qty=1000 → 印務建 Ticket（target=1000、內部產線=手工產線B區、handler_name=阿明）→ 自動複製 Slack 摘要 → 貼到本地檔案確認格式 → 印務點「確認送達」→ 生產任務業務 Badge 顯示「已轉交」
- [ ] 8.2 情境 B（貨運行）：外包廠模切任務 → 印務建 Ticket（target=520、目的廠商=智盛、運送=貨運行、carrier=金城）→ 確認送達 → 業務 Badge「已轉交」
- [ ] 8.3 情境 C（外包廠商自取）：同 B 但運送=供應商自取 + 簽收照片 placeholder → 確認送達
- [ ] 8.4 分批轉交情境：pt_produced_qty=1000，印務先建 Ticket A（target=600）確認送達 → 再建 Ticket B（target=400）確認送達 → 業務 Badge 從「待轉交」→「已轉交」
- [ ] 8.5 撤回情境：情境 A 確認後，印務點撤回選「送錯目的地」填原因 → Ticket 狀態回「運送中」→ TransferRevocationLog 寫入一筆（Card 撤回紀錄時序可見）→ 重新確認 → Ticket「已送達」
- [ ] 8.6 作廢情境：印務建 Ticket 後發現目的廠商選錯 → 點作廢（AlertDialog 二次確認）→ 狀態「已作廢」+ 紀錄保留 → 再開新 Ticket → 可申請上限計算排除已作廢 target
- [ ] 8.7 上限阻擋情境：Ticket A（target=600）運送中，印務建 Ticket B target=500 → 系統阻擋（600+500 > 1000）→ 改 target=400 可建立
- [ ] 8.8 權限情境：本 change 依設計由印務單一確認；Prototype 中 currentUser 切換後 Drawer 內按鈕仍顯示（權限管制由實際系統上線時 role-based access 處理，本 change 不實作）
- [ ] 8.9 supplier-portal 銜接情境：**延後**至 supplier-portal change 完整 apply 後整合驗證

## 9. 文件同步

- [x] 9.1 執行 `openspec validate add-production-task-transfer --strict`：通過
- [ ] 9.2 觸發三視角 Round 2 審查（方案 B 重寫後）— **延後至 Prototype E2E 驗證後**（避免程式碼未驗證前做設計審查產生空轉）
- [ ] 9.3 依審查結果修訂 proposal / design / specs
- [ ] 9.4 歸檔前執行 `doc-audit` skill 檢查跨檔案一致性
- [ ] 9.5 更新 CLAUDE.md § Spec 規格檔清單（`production-task` 版本號 +1，標註本 change 新增 TransferTicket 實體）

## 10. 歸檔前檢核

- [ ] 10.1 確認附件 OQ #01 / #04 / #05 於 design.md D3 / D6 / D7 / D10 已關閉
- [ ] 10.2 確認 PT-002 / XM-010 / XM-011 / PT-003 / WO-013 五筆延後 OQ 在 Notion 狀態「未開始」，描述與本 change 的關係清晰
- [ ] 10.3 確認 `supplier-portal` change 與本 change 對「外包廠觸發」的銜接邏輯一致（本 change 引入「待建立轉交單」子態，需供應商端無衝突）
- [ ] 10.4 整理 TransferTicket UI 的 Chrome / Safari 桌機端剪貼簿 API 相容性測試結果（於 Lovable 測試）
- [ ] 10.5 記錄 Baseline 測量結果與本 change 上線前後的指標對比規劃

---

## 實作總結（2026-04-22）

**已完成代碼層**：§ 1-5 全部 + § 6-7 輕量路徑  
**驗證**：tsc --noEmit 0 errors、新增單元測試 34/34 通過、既有 11 個失敗測試為實作前既有 broken（與本 change 無關）  
**新增檔案**：
- `src/types/transfer.ts`
- `src/lib/transfer/`（crossStationProcesses / aggregateTransferStatus / validateTransferQuantity / buildSlackSummary）
- `src/components/task-dispatch/transfer/`（TransferTicketList / Card / Dialog / RevokeDialog / CancelDialog / transferOptions / index）
- `src/test/transfer/`（3 個 test files）

**修改檔案**：
- `src/types/workOrder.ts`（ProductionTask 加 optional `transferRequired`）
- `src/store/useErpStore.ts`（新增 state 與 4 actions）
- `src/store/seedData.ts`（Pick + 初始空陣列）
- `src/components/task-dispatch/ProductionTaskDrawer.tsx`（轉交分區 + 業務 Badge）
- `src/pages/ProductionTaskList.tsx`（任務列 Badge）

**延後項目**（已於對應 tasks 標示）：
- § 6.2 supplier-portal 銜接（等 supplier-portal apply 完整）
- § 6.4 生產任務作廢連動 Ticket（等實際情境觸發）
- § 7 手動 toggle UI（等 Process 主檔 change）
- § 8 UI E2E 驗證（Lovable 部署後）
- § 9.2-9.5 Round 2 審查與文件同步（UI 驗證後）
