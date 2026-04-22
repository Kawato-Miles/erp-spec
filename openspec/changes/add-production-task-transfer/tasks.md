# add-production-task-transfer — Tasks

## 0. Baseline 測量（上線前 1 週，與開發平行；由 Miles 協調）

- [ ] 0.1 Miles 協調 2 位印務參與為期 5 個工作日的追蹤調查
- [ ] 0.2 由 Miles 每日下班前口頭詢問：追貨次數 / 時間 / 等貨 / 送錯，填於登記表
- [ ] 0.3 彙整數據，計算 Baseline 量化金額（公式：印務時薪 × 時間 + 空等 × 產線成本 + 送錯 × 重做成本）
- [ ] 0.4 寫入歸檔 notes 作為成功指標 ROI 基準

## 1. 型別與資料層

- [x] 1.1 重寫 `src/types/transfer.ts`：TransferTicket.printItemId FK + lines: TransferTicketLine[]；移除 TransferRevocationLog / RevocationType / 撤回相關欄位
- [x] 1.2 移除 `src/types/workOrder.ts` 的 `ProductionTask.transferRequired` optional 欄位
- [x] 1.3 store 簡化：`transferTickets` state；actions 僅保留 `addTransferTicket` / `confirmTransferDelivered` / `cancelTransferTicket`；移除 `revokeTransferTicket` + `transferRevocationLogs`
- [x] 1.4 `src/store/seedData.ts` 的 Pick 移除 `transferRevocationLogs`、return 移除對應欄位

## 2. 工具函式

- [x] 2.1 `src/lib/transfer/aggregateTransferStatus.ts`：簡化為印件級 `getPrintItemTransferBadge`（待轉交 / 已轉交 / 無）；移除 `deriveProductionTaskStatus`
- [x] 2.2 `src/lib/transfer/validateTransferQuantity.ts`：改為 line-level，提供 `computeLineQuantityLimit` + `validateTransferTicketLines`，涵蓋「報工 − 其他非作廢單占用」公式與重複 PT / 非整數驗證
- [x] 2.3 `src/lib/transfer/buildSlackSummary.ts`：改為多 line 彙整格式（「印刷 100 + 模切 100」+ 總數）
- [x] 2.4 刪除 `src/lib/transfer/crossStationProcesses.ts`（transferRequired flag 與跨站工序清單已不需）
- [x] 2.5 單元測試：27 個測試通過（印件 Badge 6 / line 上限 14 / Slack 摘要 7）

## 3. UI 元件（`src/components/task-dispatch/transfer/`）

- [x] 3.1 `TransferTicketList.tsx`：印件級 props、摘要統計、新增按鈕、Ticket 卡片列表；移除 readOnly / 生產任務層 API
- [x] 3.2 `TransferTicketDialog.tsx`：多 line 選取器 — 列出印件下所有有報工的 PT，每行一個 quantity input + 即時上限顯示；總數自動彙總；儲存前 `validateTransferTicketLines` + 自動複製 Slack 摘要
- [x] 3.3 `TransferTicketCard.tsx`：展開 lines 明細（每條 line 一行顯示任務名 + 數量）+ 操作按鈕（確認送達 / 作廢 / 重新複製）；移除撤回按鈕與撤回紀錄區
- [x] 3.4 `TransferCancelDialog.tsx`：保留 AlertDialog 二次確認
- [x] 3.5 刪除 `TransferRevokeDialog.tsx`（主流程不做撤回）
- [x] 3.6 `transferOptions.ts` 移除 REVOCATION_TYPE_OPTIONS
- [x] 3.7 `index.ts` barrel 更新

## 4. 印件詳情頁 Tab 新增

- [x] 4.1 `src/pages/PrintItemDetail.tsx` 聚合：`piTransferTickets` + `piAvailableProductionTasks`（報工 > 0 的 PT 陣列）
- [x] 4.2 Tab Trigger：新增「轉交單（N）」，位置介於 QC 紀錄與出貨單之間（符合 DESIGN.md §0 Tab 順序業務流先後）
- [x] 4.3 Tab Content：渲染 `TransferTicketList`（props: printItem + availableProductionTasks）

## 5. 舊設計移除

- [x] 5.1 `ProductionTaskDrawer.tsx` 移除轉交分區 + 業務 Badge + 相關 imports
- [x] 5.2 `ProductionTaskList.tsx` 移除轉交 Badge + `transferTickets` 訂閱 + `getTransferBadgeStatus` import
- [x] 5.3 `mockDispatch.ts` 移除轉交測試 WorkPackage + DispatchTask seed（恢復空陣列）

## 6. 驗證

- [x] 6.1 `npx tsc --noEmit` — 0 errors
- [x] 6.2 `npx vitest run src/test/transfer/` — 27 測試全通過
- [ ] 6.3 Lovable 部署後印件詳情頁 UAT：開 Tab、建單（多 line）、確認送達、作廢、Slack 摘要複製、跨工單合併單、上限阻擋

## 7. 文件同步

- [x] 7.1 `openspec validate add-production-task-transfer --strict`
- [ ] 7.2 Round 2 三視角審查（方案 C 重寫後 — UAT 通過再做，避免空轉）
- [ ] 7.3 `doc-audit` skill（歸檔前執行）
- [ ] 7.4 更新 CLAUDE.md § Spec 規格檔清單（production-task 版本 +1）

## 8. 歸檔前檢核

- [ ] 8.1 PT-002 / XM-010 / XM-011 / PT-003 / WO-013 五筆延後 OQ 於 Notion 狀態維持「未開始」
- [ ] 8.2 確認 Lovable 桌機 Chrome / Safari 剪貼簿 API 相容性
- [ ] 8.3 記錄 Baseline 結果與上線後指標對比規劃

---

## 重構說明（2026-04-22）

本 change 歷經三輪方向迭代，最終落腳**印件級 TransferTicket + lines**（方案 C）：

- **方案 A（Round 1）**：欄位塞 ProductionTask 主表 — 被三視角審查指出違反業界 MES 實務
- **方案 B（Round 2）**：生產任務級 TransferTicket（單一 productionTaskId） — Miles 指出入口錯（印務不進生產任務層）且不支援合併多生產任務轉交
- **方案 C（最終）**：印件級 TransferTicket（printItemId FK + lines[] 支援同印件多 PT） — 符合 Miles 的核心邏輯「印務活動範圍在工單 / 印件層、一張單可含多生產任務（例如自有廠 100 + 外包 100 合併送手工線）」

MVP 主流程簡化：不做撤回、不做 transferRequired flag、不做生產任務狀態連動、UI 採類 QC 單 Tab 模式。後續依實務回饋擴充。
