# add-production-task-transfer — Tasks

## 1. 型別與資料層

- [ ] 1.1 在 `src/types/dispatch.ts` 的 `DispatchProductionTask` 型別新增轉交欄位（`transfer_required`、`transfer_target_type`、`transfer_destination_line_id`、`transfer_destination_vendor_id`、`transfer_delivery_method`、`transfer_carrier_name`、`transfer_handler_name`、`transfer_notes`、`transfer_expected_date`、`transfer_actual_date`、`transfer_confirmed_by`、`transfer_signature_photos`）
- [ ] 1.2 建立 `src/types/transfer.ts` 定義 `TransferTargetType`、`TransferDeliveryMethod` enum 與 `TransferRevocationLog` 型別（`id`、`production_task_id`、`operator_id`、`timestamp`、`reason`、`before_transfer_actual_date`、`before_transfer_confirmed_by`）
- [ ] 1.3 在 Prototype mock store 新增 `transferRevocationLogs` slice；所有既有 mock ProductionTask 補 `transfer_required`（外包/中國=true，自有/加工=false）
- [ ] 1.4 在 `src/lib/data-consistency/crossLayerAssertions.ts` 審視是否需納入轉交欄位（依 design D6 判斷為不需要，仍需寫入註解說明）

## 2. 狀態機邏輯

- [ ] 2.1 在生產任務狀態轉換邏輯中新增「製作中 → 運送中」轉換條件：`transfer_required = true` 且轉交必填欄位已填
- [ ] 2.2 新增「運送中 → 已完成」轉換由「確認已轉交」觸發，自動寫入 `transfer_actual_date`、`transfer_confirmed_by`
- [ ] 2.3 補自有工廠「製作中 → 已完成」路徑條件：`transfer_required = false` 時直接完成；`transfer_required = true` 時 MUST 經過運送中
- [ ] 2.4 外包廠 / 中國廠的既有「運送中」狀態保留，補轉交欄位必填驗證

## 3. ProductionTaskDrawer 轉交分區

- [ ] 3.1 新增「轉交」分區元件至 `src/components/task-dispatch/ProductionTaskDrawer.tsx`
- [ ] 3.2 實作 `transfer_required` toggle，依 `factory_type` 預設值（外包/中國預設 true 且不可關閉、自有/加工預設 false 可切換）
- [ ] 3.3 實作 `transfer_target_type` radio（內部產線 / 外部廠商）與條件顯示邏輯（依 spec Scenario: 內部 / 外部欄位組合）
- [ ] 3.4 實作「目的產線」下拉（含「倉庫入庫」選項）、「目的廠商」下拉（自動帶聯絡人 / 電話 / 地址，預填上次同供應商紀錄）
- [ ] 3.5 實作「運送方式」下拉（廠內自送 / 貨運行 / 供應商自取 / 其他）與「貨運行名稱」條件顯示（運送方式=貨運行時顯示）
- [ ] 3.6 實作「廠內執行者」純文字輸入欄位（廠務姓名，記錄用，不 relation User）
- [ ] 3.7 實作「轉交備註」、「預計轉交日」欄位
- [ ] 3.8 實作「簽收照片」多檔上傳（外部廠商任務時顯示）
- [ ] 3.9 實作「確認已轉交」按鈕：填寫驗證 + 寫入 `transfer_actual_date`、`transfer_confirmed_by` + 狀態推進至已完成
- [ ] 3.10 實作權限控制：外部任務（外包/中國廠）MUST NOT 顯示確認按鈕給非印務角色

## 4. 轉交撤回機制

- [ ] 4.1 在 Drawer 新增「撤回轉交」按鈕（僅對已完成 + 有 transfer_actual_date 的任務顯示，且僅印務可見）
- [ ] 4.2 實作撤回 Dialog：原因必填 textarea + 確認按鈕
- [ ] 4.3 撤回動作寫入 `TransferRevocationLog`；重置 `transfer_actual_date`、`transfer_confirmed_by` 為 null；狀態回「運送中」
- [ ] 4.4 Drawer 新增「撤回紀錄」摺疊區顯示歷次撤回（operator、timestamp、reason）

## 5. Slack 摘要一鍵複製

- [ ] 5.1 實作 `src/lib/transfer/buildSlackSummary.ts` 工具函式，依 spec 範例格式產生摘要字串，欄位缺失時以「—」占位
- [ ] 5.2 在 ProductionTaskDrawer 轉交分區新增摘要預覽區塊（僅在「運送中」狀態顯示）
- [ ] 5.3 實作「複製」按鈕，使用 `navigator.clipboard.writeText`，成功後顯示 shadcn Toast「已複製」
- [ ] 5.4 欄位缺失（如 `transfer_handler_name` 未填）不 block 複製功能

## 6. ProductionTaskList Badge

- [ ] 6.1 修改 `src/pages/ProductionTaskList.tsx` 任務列，在主狀態 Badge 旁新增轉交 Badge
- [ ] 6.2 狀態為「運送中」→ 顯示黃色 Badge「待轉交」
- [ ] 6.3 狀態為「已完成」且 `transfer_actual_date` 有值 → 顯示綠色 Badge「已轉交」
- [ ] 6.4 `transfer_required = false` MUST NOT 顯示轉交 Badge

## 7. WorkReportDialog 銜接

- [ ] 7.1 在 `src/components/task-dispatch/WorkReportDialog.tsx` 報工成功時判斷：若報工完後累計達 `pt_target_qty` 且 `transfer_required = true`
- [ ] 7.2 顯示「前往轉交確認」按鈕，點擊後關閉 WorkReportDialog 並開啟 ProductionTaskDrawer 的轉交分區
- [ ] 7.3 若 `transfer_required = false` 或未達目標數量，不顯示此按鈕

## 8. 情境驗證（Prototype E2E）

- [ ] 8.1 情境 A（廠內自送）：建立自有工廠生產任務 → 開 `transfer_required` → 目的產線=手工產線B區 → 廠內執行者=阿明 → 儲存 → 狀態變運送中 → 師傅在 Drawer 點確認 → 狀態變已完成、已轉交 Badge 顯示
- [ ] 8.2 情境 B（貨運行）：建立外包廠生產任務（運送中）→ 目的廠商=智盛加工 → 運送方式=貨運行 → 貨運行名稱=金城 → 印務確認 → 狀態變已完成
- [ ] 8.3 情境 C（外包廠商自取）：建立外包廠生產任務 → 目的廠商 → 運送方式=供應商自取 → 上傳簽收照片 → 印務確認 → 狀態變已完成
- [ ] 8.4 撤回情境：情境 A 完成後印務撤回，原因「貨物送錯」→ 狀態回運送中 → `TransferRevocationLog` 寫入 → 重新確認 → 狀態再度已完成
- [ ] 8.5 Slack 摘要情境：情境 A/B/C 各複製一次，貼到文字檔確認格式正確
- [ ] 8.6 權限情境：師傅帳號登入任務平台，外包廠任務 MUST NOT 顯示確認按鈕

## 9. Baseline 測量（上線前 2 週，由 Miles 協調）

- [ ] 9.1 抽樣 2 位印務，記錄每日口頭 / LINE / Slack 追蹤物件的次數與時間（連續 10 個工作日）
- [ ] 9.2 彙整 Baseline 數據：平均每日次數、平均每次時間、延遲送達率
- [ ] 9.3 將 Baseline 寫入 [add-production-task-transfer 歸檔時的 rollout notes] 作為後續 KPI 追蹤起點

## 10. 文件同步

- [ ] 10.1 執行 `openspec validate add-production-task-transfer --strict`
- [ ] 10.2 觸發三視角審查（senior-pm + ceo-reviewer + erp-consultant 平行執行）
- [ ] 10.3 依審查結果修訂 proposal / design / specs
- [ ] 10.4 歸檔前執行 `doc-audit` skill 檢查跨檔案一致性
- [ ] 10.5 更新 CLAUDE.md § Spec 規格檔清單（`production-task` 版本號 +1，標註本 change 異動內容）

## 11. 歸檔前檢核

- [ ] 11.1 確認附件 OQ #01 / #04 / #05 於 design.md D3 / D4 / D5 已關閉，Notion OQ DB 若有對應紀錄則更新狀態
- [ ] 11.2 確認 PT-002 / XM-010 / XM-011 / PT-003 / WO-013 五筆延後 OQ 在 Notion Follow-up DB 狀態為「未開始」且與本 change 的 referring 關係清晰
- [ ] 11.3 確認 `supplier-portal` change 與本 change 對「外包廠運送中」的語意無衝突
