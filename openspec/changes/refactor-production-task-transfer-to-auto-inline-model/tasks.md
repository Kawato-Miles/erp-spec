## 1. TypeScript 型別與 Store 重構

- [ ] 1.1 `ProductionTask` 型別新增欄位：`transferRequired: boolean`、`transferConfig?: TransferConfig`、`dependsOn: DependencyEdge[]`（dependsOn 為物件陣列）
- [ ] 1.2 新增 `TransferConfig` interface（含 targetType / destinationLineId / destinationVendorId / deliveryMethod / carrierName / handlerName）
- [ ] 1.3 新增 `DependencyEdge` interface：`{ upstreamProductionTaskId: string, consumptionRatio: number }`
- [ ] 1.4 `TransferTicket` 型別維持 Header 結構（狀態三態：運送中 / 已送達 / 已作廢）；移除任何先前版本曾引入的 `productionTaskId` / `quantity` 直接欄位 / `autoSealed` 欄位 / 「待印務確認」狀態
- [ ] 1.5 `TransferTicketLine` 型別：`{ id, transferTicketId: string (必填、非 null), sourceWorkRecordId, sourceProductionTaskId, sourceProductionTaskName, destinationProductionTaskId: string (必填), destinationProductionTaskName, printItemId, quantity, createdAt }`（每張 Header 含一筆 Line，1:1）
- [ ] 1.6 移除任何先前版本引入的 `prerequisiteMet` 儲存欄位（佇列量改為計算衍生值）
- [ ] 1.7 確認 `TransferTicket.signaturePhotos` 為檔案陣列（Prototype 階段以 image URL placeholder 模擬）
- [ ] 1.8 Store 移除：`addTransferTicket`（手動建單）、`computeLineQuantityLimit`、任何「待交接池」相關 slice / action、`autoSealEndOfDay` / `confirmAutoSealedHeader`
- [ ] 1.9 Store 新增 action：
  - [ ] 1.9.1 `autoCreateTransferTicketOnReport(workRecordId)`：報工後對該 PT 的每條下游依賴邊建立 Header（運送中）+ 一筆 Line
  - [ ] 1.9.2 `confirmTransferDelivered(ticketId, signaturePhotos)`：印務標已送達，必填簽收照片，寫入 actualDate / confirmedBy
  - [ ] 1.9.3 `cancelTransferTicket(ticketId, reason)`：印務作廢，寫入 cancelledAt / cancelledBy / cancelledReason

## 2. 佇列量計算與依賴判定 helper

- [ ] 2.1 實作 `computeQueueQuantity(downstreamPtId, edge): number`：依公式即時計算
  - 已送達 Line 累計（限 Header.status='已送達'）− 下游 pt_produced_qty × edge.consumptionRatio
- [ ] 2.2 實作 `getAllEdgeQueues(pt): { upstreamPtId, queue, ratio }[]`：列出所有依賴邊及佇列量
- [ ] 2.3 實作 `isReadyToDispatch(pt): boolean`：所有依賴邊佇列 ≥ 1（`pt.dependsOn.length === 0` 視為就緒）
- [ ] 2.4 實作 `consumeQueueOnReport(ptId, reportedQty)`：報工時依各邊消耗比例「概念上」扣帳（透過 pt_produced_qty 直接累加，公式自然反映）
- [ ] 2.5 實作 `detectDependencyCycle(ptId, candidateUpstream, store): boolean`：DFS 依賴傳遞閉包檢查
- [ ] 2.6 實作 `getDependentPTs(ptId): ProductionTask[]`：查上游被誰引用（用於阻擋作廢）
- [ ] 2.7 實作 UI 重新渲染 trigger：訂閱 transferTickets / workRecords / dependsOn 變化，自動刷新佇列量顯示

## 3. Mock 資料遷移

- [ ] 3.1 列出現有 mock 中所有 TransferTicket（v0.3 結構）
- [ ] 3.2 既有 TransferTicket 維持為 Header；其 lines 陣列保留並符合新 Line schema（每筆 Line 補 destinationProductionTaskId / destinationProductionTaskName / sourceWorkRecordId 引用）
- [ ] 3.3 移除既有 mock 中任何 `autoSealed` 欄位（已取消）
- [ ] 3.4 確保 mock 中至少有部分 TransferTicket 為「已送達」狀態（含 signaturePhotos placeholder URL，例：`/mock/signature-photo-1.jpg`）
- [ ] 3.5 更新 mock `ProductionTask` 新增 `transferRequired` 欄位（依工序類型推論）
- [ ] 3.6 更新 mock `ProductionTask` 新增 `transferConfig` 欄位（依工序目的地推論）
- [ ] 3.7 更新 mock `ProductionTask.dependsOn` 為物件陣列：依 BOM 工序順序推論 + 設預設消耗比例
- [ ] 3.8 移除任何先前 mock 中的 `prerequisiteMet` 欄位
- [ ] 3.9 新增至少一個「精裝書多印件 + 跨依賴邊」mock 範例（封面 P1 + 內頁 P2 → 裝訂）
- [ ] 3.10 新增至少一個「分批裝訂」mock 情境（裝訂任務 100 本、已報工 30、剩 70 本待後續料到）

## 4. 印件詳情頁「轉交單」Tab UI 改動

- [ ] 4.1 移除「新增轉交單」按鈕
- [ ] 4.2 新增說明文字「轉交單由報工事件自動建立。廠務送達後由印務在此頁面標記已送達。」
- [ ] 4.3 Header 卡片展開可看包含的 Line 明細：顯示「來源 PT 名 → 目的 PT 名 + 數量」
- [ ] 4.4 「運送中」狀態 Header 卡片提供「標記已送達」操作按鈕
- [ ] 4.5 「標記已送達」Dialog：包含**簽收照片必填上傳區**（至少 1 張）+ 選填備註欄
- [ ] 4.6 簽收照片以 ImageUpload 元件呈現（Prototype 階段以 placeholder URL 模擬）
- [ ] 4.7 「已送達」狀態的 Header 卡片顯示簽收照片縮圖、可點擊放大
- [ ] 4.8 「已送達」狀態 Header 不可再修改 signaturePhotos
- [ ] 4.9 「運送中」狀態 Header 卡片提供「作廢」按鈕（彈出原因填寫）
- [ ] 4.10 確認 Tab 位置維持「QC 紀錄 → 轉交單 → 出貨單」之間

## 5. 生產任務編輯頁 UI 擴充

- [ ] 5.1 新增 `transferRequired` Checkbox 欄位（排工階段可編輯）
- [ ] 5.2 新增 `transferConfig` 表單區塊（僅在 `transferRequired=true` 時顯示）
  - [ ] 5.2.1 targetType RadioGroup（內部產線 / 外部廠商）
  - [ ] 5.2.2 destinationLineId / destinationVendorId Select（依 targetType 切換）
  - [ ] 5.2.3 deliveryMethod Select
  - [ ] 5.2.4 carrierName TextInput（deliveryMethod=貨運行時顯示且必填）
  - [ ] 5.2.5 handlerName TextInput（選填）
- [ ] 5.3 新增「依賴邊」管理區塊
  - [ ] 5.3.1 顯示目前依賴邊列表（每邊：上游 PT 名 + 消耗比例輸入 + 註解「下游每生產 1 單位需消耗該上游多少單位」）
  - [ ] 5.3.2 「新增依賴邊」對話框：選擇上游 PT（限同印件、transferRequired=true 的 PT）+ 填消耗比例
  - [ ] 5.3.3 即時呼叫 `detectDependencyCycle` 驗證，環形時阻擋並顯示錯誤訊息
  - [ ] 5.3.4 每條邊提供「依工序類型建議消耗比例」按鈕（裁切=1、裝訂依本書印件用量推算等）
  - [ ] 5.3.5 **新建 PT 時依 BOM `process_master.sort_order` 自動建議 dependsOn**：自動帶入 sort_order = 自身 - 1 且 transferRequired=true 的 PT（含預設消耗比例），印務可調整或刪除
  - [ ] 5.3.6 第一次基於某依賴邊報工時跳 confirm 對話框：「依此倍率本次報工將消耗上游 [N 單位]，是否確認？」防止標錯導致佇列大量誤算
- [ ] 5.4 狀態轉為「待處理」時驗證 `transferRequired=true` 需 `transferConfig` 必填欄位完整
- [ ] 5.5 狀態轉為「待處理」時驗證每條依賴邊的 `consumptionRatio` 必填且 > 0

## 6. 派工板 UI 擴充

- [ ] 6.1 任務列下方渲染依賴邊三欄迷你表格（上游 PT / 佇列量 / 消耗比例）
- [ ] 6.2 任一依賴邊佇列 = 0 任務套用禁用樣式（灰階 + 「依賴未滿足」Badge）
- [ ] 6.3 佇列量 = 0 的列以紅色強調；佇列量為負的列以橙色強調 + 「補料不足」標籤
- [ ] 6.4 被禁用任務的勾選框 disabled
- [ ] 6.5 Tooltip 於懸停被禁用勾選框時顯示具體哪些邊佇列為 0
- [ ] 6.6 新增「僅顯示可派工」切換
- [ ] 6.7 標頭計數顯示「可派工 N / 依賴未滿足 M」
- [ ] 6.8 上游 TransferTicket 送達 → 下游佇列即時刷新（訂閱 store 變化）
- [ ] 6.9 建立工作包 action 前置檢查：若含「任一依賴邊佇列 = 0」任務則拒絕並提示

## 7. 報工流程整合

- [ ] 7.1 報工對話框（WorkReportDialog）submit 後：
  - [ ] 7.1.1 寫入 ProductionTaskWorkRecord
  - [ ] 7.1.2 累加 pt_produced_qty
  - [ ] 7.1.3 若 transferRequired=true 且非終端工序，呼叫 `autoCreateTransferTicketOnReport`
- [ ] 7.2 `autoCreateTransferTicketOnReport` 邏輯：
  - [ ] 7.2.1 查找該 PT 作為上游被哪些 PT 引用（即下游清單）
  - [ ] 7.2.2 為每個下游建立**一張獨立 Header**（狀態 = 運送中、欄位 clone from transferConfig）+ 一筆 Line（destinationProductionTaskId = 該下游 PT.id、quantity = reportedQuantity）
  - [ ] 7.2.3 若該 PT 為**終端工序**（不被任何 PT 引用為上游），**不建立任何 TransferTicket**
- [ ] 7.3 報工提交前檢查依賴邊佇列：若任一依賴邊佇列 < 1 + 為首次報工，拒絕（保證師傅打開即可動工）
- [ ] 7.4 報工成功後 Toast 顯示「已建立轉交單 TT-XXX」（若有建立）

## 8. TransferTicket 狀態變更整合

- [ ] 8.1 `confirmTransferDelivered` action：
  - [ ] 8.1.1 驗證 signaturePhotos 至少 1 張
  - [ ] 8.1.2 將 Header 狀態改為「已送達」、寫 actualDate / confirmedBy / signaturePhotos
  - [ ] 8.1.3 阻擋對「已作廢」狀態的 Header 執行此 action
- [ ] 8.2 `cancelTransferTicket` action：將 Header 狀態改為「已作廢」、寫 cancelledAt / cancelledBy / cancelledReason
- [ ] 8.3 兩 action 後系統 trigger UI 重新計算所有相關下游 PT 的佇列量

## 9. 情境覆蓋測試（scenarioCoverage.test.ts）

- [ ] 9.1 新增情境：印刷任務報工 200 → 自動建立 Header（運送中）+ 一筆 Line
- [ ] 9.2 新增情境：兩次報工建立兩張獨立 Header（各含一筆 Line）
- [ ] 9.3 新增情境：印務標記已送達必填簽收照片（未上傳被阻擋、上傳後狀態變已送達）
- [ ] 9.4 新增情境：transferRequired=false 任務報工 → 不建 Header
- [ ] 9.5 新增情境：終端工序（裝訂）報工 → 不建 Header；印件成品累計量由 affects_product MIN 計算
- [ ] 9.6 新增情境：依賴邊佇列計算（已送達 − 已消耗）
- [ ] 9.7 新增情境：所有依賴邊佇列 ≥ 1 任務可派工
- [ ] 9.8 新增情境：任一依賴邊佇列 = 0 派工被阻擋（首次報工硬擋）
- [ ] 9.9 新增情境：上游 Header 確認送達 → 下游佇列即時更新解鎖
- [ ] 9.10 新增情境：上游 Header 作廢後佇列重新計算（已作廢 Line 不計入）
- [ ] 9.11 新增情境：分批裝訂第一批（30 本）+ 第二批（70 本）佇列消耗追蹤，全程系統不擋
- [ ] 9.12 新增情境：環形依賴阻擋（A→B→A 與 A→B→C→A 都被拒）
- [ ] 9.13 新增情境：跨印件依賴阻擋
- [ ] 9.14 新增情境：transferRequired=false 任務作為依賴目標被阻擋
- [ ] 9.15 新增情境：上游被引用時作廢被阻擋
- [ ] 9.16 新增情境：transferConfig 中途變更不影響已建 Header（已建 carrierName 不動，後續報工新建用新值）
- [ ] 9.17 新增情境：佇列負值允許但 UI 警示
- [ ] 9.18 新增情境：印件多終端工序成品 MIN 齊套（套書多冊）

## 10. 資料一致性稽核

- [ ] 10.1 更新 `dataConsistency.test.ts` 的 `TRACKED_PARITY_FIELDS`：新增 `transferRequired`、`transferConfig`、`dependsOn`
- [ ] 10.2 更新跨層欄位稽核：`TransferTicketLine.sourceProductionTaskId` / `destinationProductionTaskId` 為新跨層欄位
- [ ] 10.3 確認 `prerequisiteMet` 欄位徹底移除（不應出現在任何 type / mock / 測試中）
- [ ] 10.4 確認 `autoSealed` 欄位徹底移除（不應出現在任何 type / mock / 測試中）
- [ ] 10.5 執行 `npm run test` 確認所有情境通過

## 11. 文件稽核與歸檔前檢查

- [ ] 11.1 執行 `openspec validate --strict refactor-production-task-transfer-to-auto-inline-model`，確認無警告
- [ ] 11.2 觸發 `doc-audit` skill 檢查跨檔案一致性
- [ ] 11.3 更新 [生產任務 BRD v0.3](https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94) 為新版本推送（歸檔後執行）
- [ ] 11.4 更新 CLAUDE.md § Spec 規格檔清單中 production-task 版本說明

## 12. Prototype 目視驗證（Lovable 推送後）

- [ ] 12.1 印件詳情頁「轉交單」Tab 顯示無「新增轉交單」按鈕
- [ ] 12.2 報工後「轉交單」Tab 即時出現新 Header（狀態=運送中）
- [ ] 12.3 「運送中」Header 點「標記已送達」彈出對話框、簽收照片必填
- [ ] 12.4 上傳照片後 Header 狀態變「已送達」、卡片顯示照片縮圖可放大
- [ ] 12.5 生產任務編輯頁可見 transferRequired / transferConfig / 依賴邊（含消耗比例 + 註解）欄位
- [ ] 12.6 新建 PT 時依 BOM sort_order 自動建議 dependsOn 預填
- [ ] 12.7 第一次基於某依賴邊報工時跳 confirm 對話框
- [ ] 12.8 派工板任務列下方顯示依賴邊佇列量三欄表格
- [ ] 12.9 派工板被禁用任務顯示灰階 + Badge + 勾選框 disabled（硬擋）
- [ ] 12.10 上游送達後派工板下游佇列量即時刷新
- [ ] 12.11 分批裝訂情境：30 本完成後佇列扣減、第二批 70 本繼續，全程系統不擋
- [ ] 12.12 終端工序（裝訂）報工不建 Header；印件成品累計量由 affects_product MIN 計算
- [ ] 12.13 跨印件依賴 / 環形依賴 / 引用 transferRequired=false 任務 各自被阻擋

## 13. 角色變更溝通與 UAT 訓練

- [ ] 13.1 編寫「印務新流程一頁紙」：v0.3「手動建轉交單」→ 新模型「報工自動建單 + 廠務通知後標已送達 + 必填簽收照片」差異對照
- [ ] 13.2 UAT 開場 demo 腳本：含「報工自動建單」「廠務送達 → 印務標已送達 + 上傳簽收照片」「分批裝訂」「依賴邊與佇列量」四個情境
- [ ] 13.3 「轉交單」Tab 首次造訪引導式 Tooltip（解釋「自動建立」與「標記已送達」流程）
- [ ] 13.4 派工板「依賴邊佇列為 0 不能派工」的視覺與文案對印務 / 生管說明
- [ ] 13.5 用量倍率（消耗比例）填寫指南：依工序類型建議值清單 + 標錯偵測機制說明
- [ ] 13.6 廠務 / 印務協作 SOP：廠務送達後「以何種管道」通知印務（Slack / 電話 / LINE 任一）；印務未收到通知主動聯繫廠務
