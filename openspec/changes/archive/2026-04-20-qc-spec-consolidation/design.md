## 決策定版（三視角審查後）

原分支 `claude/zealous-bardeen-16ede8`（commit `8ad96e7`）已完成三視角審查（senior-pm + ceo-reviewer + erp-consultant），本 change 承接下列定案：

### D1：獨立 `qc` capability 作為 Single Source of Truth

- **背景**：QC 規則散落於 6 個 spec，彼此矛盾
- **決策**：建立獨立 `qc` capability，其他 capability 的 QC 段改為引用
- **理由**：集中權威來源，避免再次發散；Prototype 實作可直接對照單一 spec

### D2：異動期間 QC 完成度計算持續運作

- **背景**：M1 — 工單異動狀態下，QC 流程是否應暫停，各 spec 描述不一
- **決策**：QC 流程於異動期間持續運作；未受異動影響的生產任務其 QC 單建立與執行均不被阻擋；完成度計算即時重算
- **理由**：異動通常僅影響部分生產任務，阻擋整張工單的 QC 會壓抑產能；受異動影響的生產任務透過「作廢自動連動」處理

### D3：QC 可申請上限 = 報工數量 - 其他有效 QC 單已申請數量

- **背景**：M2 — 可申請上限公式多版本
- **決策**：公式統一為 `報工數量 - 其他有效 QC 單已申請數量`，其中「有效」= 狀態 IN ('待執行', '執行中', '已完成')，**排除「已作廢」**
- **理由**：QC 單業務語意為「檢驗已生產的成品」，必須有實際報工才能建立；已作廢單不應佔用配額

### D3b：QC 單狀態機新增「已作廢」終態

- **背景**：D3 公式需區分「有效」與「已作廢」，原狀態機無作廢路徑
- **決策**：QC 單狀態機新增「已作廢」終態；印務可主動作廢；生產任務作廢時自動帶動其下 QC 單作廢
- **理由**：閉合狀態機、明確異動期間 QC 單處理、保留稽核紀錄

### D4：刪除 `QCDetail` 空殼實體

- **背景**：M3 — QCDetail 定義僅有 placeholder，從未落實
- **決策**：直接刪除 QCDetail；QC 結果以 QCRecord 的 `passed_quantity` / `failed_quantity` 聚合值表達
- **理由**：減少實體複雜度；未來若需逐件判定、缺陷代碼分類、抽樣規則等進階功能，以新 change 擴充 qc capability（屆時再決定是否重建 QCDetail）
- **BREAKING**：對既有 Prototype mock / 文件若提及 QCDetail 者須同步清理

### D5：QC 單 FK = `production_task_id`（工單層僅 UI 入口）

- **背景**：M5 — QC 單歸屬不清
- **決策**：QC 單直接關聯生產任務（`production_task_id`）；工單詳情頁的 QC 單列表透過 `ProductionTask → WorkOrder` 關聯彙總
- **理由**：QC 的業務對象是「單一生產任務的批次檢驗」，關聯生產任務更貼近業務；工單層僅為 UI 觸發與顯示入口

### D6：「入庫數量」分層命名

- **背景**：M4 — 生產任務 / 工單 / 印件層的「入庫數量」同名異義，讀者無法辨識哪層已齊套
- **決策**：分層命名：
  - 生產任務層：`pt_qc_passed`（QC 通過數加總，**未齊套**）
  - 工單層：`wo_warehouse_qty`（齊套後件數）
  - 印件層：`pi_warehouse_qty`（跨工單聚合件數）
- **理由**：讀者在任何 spec 看到欄位名即可直接判斷層級與是否已齊套；業務用語「入庫數量」保留為互用詞，但正式欄位以上述三名為準

---

## 非此 change 範圍

以下工作另起 change 或 task：

- Prototype 對齊（UI 雙欄位、QC 人員選擇、可申請餘額提示、QCRecord 欄位 rename）
- Notion BRD 推送（新增 QC 頁面、同步四個 main spec 發布版本）
- 五筆待新增 OQ（QC 撤銷 / rework chain / 通知機制 / 多工序聯檢 / 報工語意治理）將於 QC 模組後續 change 啟動時建立
