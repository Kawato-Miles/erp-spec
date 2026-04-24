# add-production-task-transfer — Design

## Context

印件完工到下一棒的運送是 ERP 系統外的真空地帶。本 change 歷經三輪方向迭代，收斂為「**印件級獨立單據 + 多生產任務 line**」的設計：

- **方案 A**（Round 1 第一版）：欄位塞 ProductionTask 主表 — 三視角審查指出違反業界 MES 實務（SAP Material Document / Oracle Move Transaction）
- **方案 B**（Round 2 重寫）：生產任務級 TransferTicket + 單一 productionTaskId FK — Miles 指出入口錯（印務不進生產任務層）且不支援「合併多生產任務轉交」的業務實況
- **方案 C**（最終）：**印件級 TransferTicket + lines[]**，類 QC 單 / 出貨單 模式，入口在印件詳情頁 Tab

## Goals / Non-Goals

### Goals

1. 建立印件級轉交單實體，作為跨站運送的系統憑證
2. 支援一印件多張單（分批轉交對應分批出貨）
3. 支援同一張單跨多個生產任務（合併運送），但不跨印件
4. 報工後才可轉交；每條 line 的量不超過生產任務報工未轉交額度
5. 提供 PT-002 Slack Webhook 落地前的自動複製橋接
6. 主流程 MVP 先跑通「印件有轉交單」可查、可建、可確認、可作廢

### Non-Goals

1. **不做撤回機制**（主流程跑通後再設計）
2. **不做 `transferRequired` flag 與跨站類工序清單**
3. **不做生產任務狀態機連動**（轉交是印件層憑證，不影響報工 / QC 狀態）
4. **不做工單詳情頁入口**
5. **不做印件層狀態總覽 / 建議行動清單**（UI 簡化到 Tab 即可）
6. 不做 Slack Webhook 推送（PT-002 延後）
7. 不做 user-roles 廠務角色補強（XM-010）、business-scenarios 鏈路情境（XM-011）
8. 不做 supplier-portal 觸發整合、日程面板篩選、紙本列印

## Decisions

### D1：TransferTicket 關聯印件（printItemId FK），可跨工單、不可跨印件

**決策**：TransferTicket.printItemId 作為主關聯；lines[] 可含同印件下任意工單的生產任務，但所有 lines 的 productionTaskId MUST 屬同一 printItemId。

**理由**：
- Miles 指出印務活動範圍在印件 / 工單層，合併多生產任務轉交是實務常態
- 跨印件會讓管理複雜度爆炸（Miles 明示不允許）
- 跨工單但同印件是業務自然（例：印件 A 自有廠印刷 100 + 外包廠模切 100，合併送手工線壓紋）

**替代方案**：
- 生產任務級 TransferTicket（方案 B）— 不支援合併，Miles 拒絕
- 跨印件 TransferTicket — 管理複雜度過高，Miles 拒絕

### D2：生產任務狀態機**不**受轉交影響

**決策**：轉交只是印件層憑證，生產任務維持「報工達標 → 已完成」的既有邏輯。

**理由**：
- Miles High Level 目標中「已完成」的含義該由**印件層完成度**聚合表達（報工完成度 + 轉交完成度），不是把兩件事綁在生產任務狀態上
- 生產任務狀態機責任純：報工 / QC
- 若要讓印務掌握「做完但沒送」，未來印件層再加聚合指標；MVP 不需要

### D3：主流程**不**做撤回機制

**決策**：TransferTicket 狀態機僅含：運送中 → 已送達 / 已作廢。不提供「已送達 → 運送中」撤回路徑。

**理由**：
- Miles 指示：主流程跑通後再設計撤回
- 作廢已能救濟誤建；若送錯重送，實務可作廢原單 + 開新單表達（雖然歷史紀錄略冗，但主流程夠用）

### D4：作廢為必要誤建救濟（保留）

**決策**：Ticket 於「運送中」狀態可由印務作廢；AlertDialog 二次確認、reason 必填、target_quantity 不計入其他單上限。

**理由**：
- 建單錯誤是實務常見（目的地、數量、廠商選錯）
- 類 QC 單作廢模式，印務認知負擔低

### D5：Slack 通知以連結欄位表達（對齊需求單模式）

**決策**：`TransferTicket.slackMessageUrl?: string`。正式上線後由 Webhook 自動發 Slack 通知，印務取得訊息 URL 後回填；Prototype 階段**純編輯欄，不實作 Webhook**。

**UI 配置**：
- 建單 Dialog：選填 URL 欄位
- 詳情 Dialog：顯示 + 編輯（inline）
- 主列表：ExternalLink icon 欄位（有值才顯示）

**理由**：
- Miles 指示：通知機制由正式環境 Webhook 負責，ERP 只需儲存連結作事後查找
- 對齊 `QuoteRequest.slackLink` 既有模式，一致的視覺與編輯行為
- 移除先前「剪貼簿自動複製 + 印務手貼」的中介步驟（會被跳過、紀錄脫鉤）

**替代方案**（已淘汰）：
- 自動複製剪貼簿 + 印務手貼 Slack — CEO 指出會被跳過；且 Webhook 落地後重複
- 全文 Slack 摘要模板儲存於欄位 — 事後引用價值不如直接跳到原 Slack 訊息

### D6：line-level 上限（per 生產任務）

**決策**：建單 / 編輯時，每條 line.quantity 獨立驗證：

```
line.quantity <= pt.ptProducedQty
              − sum(同印件其他非作廢 Ticket 中該 PT 的 line.quantity)
```

**理由**：
- Miles 第 4 點：「報工後才可以轉交，不可大於報工數 − 已轉交數」
- 作廢不計入占用（符合 QC 單模式）
- 編輯模式透過 excludeTicketId 排除本單自身

### D7：UI 採 QC 單 / 出貨單 Tab 模式

**決策**：印件詳情頁的 Tab 順序 = 審稿 → 工單 → QC → **轉交** → 出貨 → 活動紀錄。Tab 內容 = 摘要 + 新增按鈕 + Ticket 卡片列表。

**理由**：
- 類 QC 單 Tab 維持視覺一致性
- 依 DESIGN.md §0「Tab 順序依業務流先後」：審稿 → 生產（工單 / QC）→ 運送（轉交 / 出貨）→ 總覽
- 每張 Ticket 卡片展示 lines 明細 + 操作按鈕，主流程夠用

### D8：移除 flag、跨站類清單、Drawer 分區、ProductionTaskList Badge

**決策**：
- 移除 `ProductionTask.transferRequired` 欄位
- 刪除 `src/lib/transfer/crossStationProcesses.ts`
- 從 `ProductionTaskDrawer` 移除轉交分區與業務 Badge
- 從 `ProductionTaskList` 任務列移除轉交 Badge

**理由**：
- Miles 指示：印務不進生產任務層，轉交只在印件層露出
- Flag 的提醒功能在主流程 MVP 不必要；有 Ticket = 走轉交流程已夠

### D9：簽收照片沿用欄位，未來再拆

**決策**：TransferTicket.signaturePhotos 為檔案陣列；Prototype 階段以 placeholder 說明「暫不實作上傳」。

**理由**：
- Miles 指示「維持欄位」
- 法律級追溯需求觸發時再拆 TransferAttachment 獨立表

## Risks / Trade-offs

**風險 1：作廢歷史紀錄略冗**（無撤回功能時送錯重送要作廢 + 開新單）
→ 可接受：主流程簡化優先，後續依實務回饋決定是否補撤回

**風險 2：印件跨多工單的轉交單建立時 UX 負擔**（要瀏覽所有可抽量的 PT）
→ 緩解：Dialog 內列表顯示每個 PT 的 workOrderNo + 已報工 + 可申請上限，印務快速篩選

**風險 3：移除生產任務狀態機連動後，印務可能混淆「已完成生產任務 vs 未轉交」**
→ 緩解：未來印件層補報工 / 轉交雙完成度指標；MVP 透過 Tab 計數讓印務知道「有轉交單」

**風險 4：Slack 自動複製受瀏覽器手勢限制**
→ 緩解：建單按鈕本身即為手勢；失敗時 Toast 顯示失敗 + 提示重新複製按鈕

## Open Questions

本 change 範疇內全數解答（D1-D9）。

後續 change 處理：
- 撤回機制（主流程跑通後）
- 印件層報工 / 轉交雙完成度指標
- supplier-portal 觸發整合
- 其他延後 OQ：PT-002 / XM-010 / XM-011 / PT-003 / WO-013
