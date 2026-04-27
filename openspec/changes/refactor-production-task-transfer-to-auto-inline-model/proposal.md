## Why

v0.3 [add-production-task-transfer](../../changes/archive/2026-04-24-add-production-task-transfer/) 於 2026-04-24 歸檔即發現兩項根本缺陷：(1) 印務在排工時已知工序流向，事後再手動建立 TransferTicket 是重複勞動，且與已存在的報工資料脫節；(2) 生產任務層無工序依賴約束，生管可能派發上游尚未完工的下游任務，師父因此收到做不了的活，造成派工雜訊與現場混亂。

本 change 透過「排工預填 + 報工自動產生 Line + 印務封單建 Header + 佇列量驅動依賴解鎖」重構轉交模型，讓系統承擔原本靠人工彌補的工作。

**設計演進歷史**（誠實揭露，避免後續維護者誤解）：
- v0.3（2026-04-24 歸檔即發現缺陷）：印件級 TransferTicket + 多筆 TransferTicketLine，印務手動建單
- 第一次重寫（同日 propose）：1:1 扁平化，報工自動建一張 Ticket — 後被三視角審查與業界研究指出偏離 Header + Line 通則
- 第二次重寫（同日 explore）：A' 引入「流水線 / 齊套邊」二類型 — 後被 Miles 指出齊套邊會擋住分批裝訂等業務常見情境
- **本版（最終）**：Header + Line + 依賴邊單一類型 + 多邊 AND + 佇列量計算

探索與決策完整脈絡見 [Open Question PT-004](https://www.notion.so/34c3886511fa811d93e3dcab755c00f5)。

## What Changes

- **BREAKING** 取消「印務手動建立 TransferTicket」流程，改為系統在報工事件觸發後自動建立
- **BREAKING** 取消 `TransferTicketLine` 實體（v0.3「一單多 line」結構），`TransferTicket` 扁平化直接綁單一 `ProductionTask` 的一次報工
- `ProductionTask` 新增欄位：`transferRequired` (布林)、`transferConfig` (物件，含 targetType / destinationVendorId 或 destinationLineId / deliveryMethod / carrierName)、`dependsOn` (FK 陣列)
- `ProductionTask` 狀態機新增「阻擋 (Blocked)」/「就緒 (Ready)」前置段，或以 `prerequisiteMet` 布林屬性化設計（由 design.md 決定）
- 引入流水線依賴解鎖：上游任一 `TransferTicket.status = 已送達` 即解鎖下游 `ProductionTask`（符合印刷邊印邊裁實務）
- `dependsOn` 新增時強制環形依賴防護（A→B→A 禁止）
- `dependsOn` 限制同印件內，不支援跨印件依賴
- `transferRequired = false` 的 `ProductionTask` 不能作為依賴目標也不受依賴約束（MES 模式，現場判斷料到位）
- 生管派工板顯示 Blocked 任務但禁用派工按鈕；師父 UI 天然只看到已派任務，無需特別過濾
- 轉交數量嚴格 = 報工數量，不允許人工介入調整（避免對帳錯誤）
- `transferConfig` 中途變更不回朔已建 `TransferTicket`，廠務依已建 Ticket 處理、有問題找印務
- `slackMessageUrl` 欄位保留於 `TransferTicket`（Prototype 不實作 Webhook，僅作為 URL 紀錄欄位）

## Capabilities

### Modified Capabilities
- `production-task`: 新增 `transferRequired` / `transferConfig` / `dependsOn` 欄位；`ProductionTask` 狀態機新增前置段；取消 `TransferTicketLine` 實體並扁平化 `TransferTicket`；取消「印務手動建 TransferTicket」Scenarios；新增「報工自動建 TransferTicket」Scenarios；新增「依賴解鎖」Scenarios
- `state-machines`: `ProductionTask` 狀態機章節擴張（新增阻擋/就緒或屬性化前置條件）；新增依賴解鎖規則；新增環形依賴防護規則
- `task-dispatch-board`: 派工顯示與交互規則變更（顯示 Blocked 任務但禁用派工按鈕、依賴就緒過濾邏輯）

## Impact

- **OpenSpec Specs 異動**：
  - [production-task/spec.md](../../specs/production-task/spec.md)（Data Model 與 Scenarios 大幅變更）
  - [state-machines/spec.md](../../specs/state-machines/spec.md)（`ProductionTask` 狀態機章節）
  - [task-dispatch-board/spec.md](../../specs/task-dispatch-board/spec.md)（過濾與交互邏輯）
- **Prototype 異動**（`sens-erp-prototype`）：
  - 印件詳情頁「轉交單 Tab」移除「新增 TransferTicket」建單 UI，改為唯讀顯示系統自動建立的清單
  - 生產任務編輯頁新增 `transferRequired` 勾選、`transferConfig` 表單區塊、`dependsOn` 前置任務選擇器（限同印件內 ProductionTask）
  - 派工板（task-dispatch）新增 Blocked 任務顯示樣式與派工按鈕停用狀態
  - 報工流程觸發自動建立 `TransferTicket` 的 store action
- **Notion 發布版本**：[生產任務 BRD](https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94) 將因本 change 更新（歸檔後手動推送）
- **OQ 關聯**：
  - [PT-004](https://www.notion.so/34c3886511fa811d93e3dcab755c00f5)：本 change 設計決策脈絡索引（已完成）
  - [PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca)：Slack 摘要自動產生（Prototype 範疇部分解答，維持開啟）
  - [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807)：日程面板「待轉交」篩選意義變更，待本 change 施工時重定（維持開啟）
- **延伸 OQ 不在本 change 範疇**：[XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875)（廠務系統外角色）、[XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa)（跨任務轉交鏈路情境）
- **無前置 change**
