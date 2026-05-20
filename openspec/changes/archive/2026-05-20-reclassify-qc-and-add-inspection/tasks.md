## 1. OQ 補抓與三視角審查

- [ ] 1.1 透過 Notion MCP（或 `oq-manage` skill）查詢 OQ Follow-up DB，列出與 C1 相關的未解 OQ 清單（關鍵字：QC、品檢、補生產、報工修正、入庫、齊套性、放行、議價、退款、shortfall、NCR、Disposition）；將命中 OQ 連結補入 design.md § Open Questions
- [ ] 1.2 平行呼叫 `senior-pm` + `ceo-reviewer` + `erp-consultant` 三視角審查 proposal / design / delta specs
- [ ] 1.3 依三視角審查建議調整 specs 或 design（如審查方向涉及範疇變更，回到 propose 階段重議）
- [ ] 1.4 在 Notion OQ DB 新增本次討論衍生的 OQ：OQ-C1-1 ~ OQ-C1-6（詳見 design.md § Open Questions）

## 2. Spec 主檔同步準備（歸檔前）

- [ ] 2.1 production-task 主 spec § Data Model 新增欄位定義：`type`（列舉：production / qc / inspection）、`scope`（列舉：work_order_task / print_item）、`requires_inspection`（布林）、`require_transfer`（布林）、`previous_production_task_ids`（FK array）
- [ ] 2.2 production-task 主 spec § Data Model 在 ProductionTaskWorkRecord 新增欄位：`passed_quantity`（整數，僅 type = qc / inspection）、`failed_quantity`（系統計算）
- [ ] 2.3 production-task 主 spec § Data Model 新增 NCR 實體定義（含 source_work_record_id、defect_quantity、disposition、disposition_at / by、status 等欄位）
- [ ] 2.4 qc 主 spec 改寫為薄層說明：Purpose 區更新（「QCRecord 已併入 ProductionTask 框架；QC 重新定義為印件入庫檢查」）、保留 § QC 角色權限邊界（MODIFIED 版本）、其餘 Requirements 標示 REMOVED 並提供 Migration 連結
- [ ] 2.5 state-machines 主 spec Purpose 區引言更新（「QC 單狀態機已移至獨立 qc capability」→「QC / 品檢任務狀態 = ProductionTask 狀態，定義於 production-task capability」）
- [ ] 2.6 user-roles 主 spec § QC 角色編輯限制 重寫對應 delta spec 內容；§ 完整權限對照表 QC 角色「任務」欄改為 R/W

## 3. 業務情境（Notion）更新

- [ ] 3.1 在 [Notion 業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05) 新增 QC / 品檢相關業務情境：
  - 標準流程（QC 全通過 + 不需品檢）
  - 印件層 QC 部分不通過 → NCR Disposition Rework / Use-As-Is / Scrap 三情境各一
  - 工序層 inspection 不通過 → NCR Disposition Rework 情境
  - 分批驗收（多筆 WorkRecord 累計）情境
- [ ] 3.2 QC 既有業務情境檢視：將「QCRecord 建立」改為「QC PT 自動建立」、「QC 任務由印務建立」改為「inspection PT 由印務在規劃期加入」，並更新引用路徑
- [ ] 3.3 補充「分批提前出貨」情境：業務 → 印務 → 生管 → 師傅多次 WorkRecord 累計流程（含 QC 分批驗收）

## 4. 文件一致性稽核

- [ ] 4.1 執行 `doc-audit` skill 檢查跨檔案引用一致性
- [ ] 4.2 處理 audit 發現的引用斷鏈與不一致（特別是 business-scenarios、order-management、work-order 中可能引用 QCRecord 或舊 QC 概念的段落）
- [ ] 4.3 更新 CLAUDE.md § Spec 規格檔清單 中 production-task / qc / state-machines / user-roles 的「狀態」欄與「版本」欄

## 5. 歸檔

- [ ] 5.1 執行 `openspec status` 確認所有 artifact 為 done
- [ ] 5.2 執行 `/opsx:verify` 驗證 spec 變更內部一致性
- [ ] 5.3 執行 `/opsx:archive` 歸檔 change（delta specs 合併回 main specs）
- [ ] 5.4 確認 git commit 包含完整 change diff，並依 CLAUDE.md commit 格式撰寫訊息

## 6. 後續 Change 啟動準備

- [ ] 6.1 在後續討論中啟動 C2 `simplify-production-task-completion`（依 C1 完成後的 type / scope 欄位設計報工即完成邏輯與「製作中」狀態移除）
- [ ] 6.2 在 C2 完成後啟動 C3 `add-production-task-rework`（補生產 / Rework 副流程，含 NCR Disposition = Rework 的具體實現、議價交付 Use-As-Is 與業務退款串接）
- [ ] 6.3 在 C2 完成後啟動 C4 `move-warehousing-to-print-item-layer`（入庫上移到印件層、齊套性公式變更為 `pi_warehouse_qty = sum(QC PT.passed)`）；C3 與 C4 可平行進行
- [ ] 6.4 待 C3 / C4 完成後整批調整 Prototype QC / 品檢相關 UI 元件與 mock data（避免 C1-C4 期間反覆異動）

## Prototype 變動範圍（本 C1 不執行，僅記錄）

依 Miles 指示，**C1 不執行 Prototype 變動**，以下為未來執行時的參考清單（待 C3 / C4 完成後整批執行）：

- 盤點 `sens-erp-prototype` 既有 QCRecord 使用點（檔案路徑、引用元件）
- 移除 QCRecord mock data，改以 type = `qc`、scope = `print_item` 的 ProductionTask 承載
- 新增 type = `inspection`、scope = `work_order_task` 的 ProductionTask mock data（覆蓋至少 2 個既有印件，含中間品檢情境）
- 在 ProductionTaskWorkRecord mock data 新增 `passed_quantity` / `failed_quantity` 欄位
- 新增 NCR 實體 mock data（覆蓋 pending 與 resolved 各種 disposition 情境）
- 本地 `npm run dev` + `npm run test:e2e` 驗證 mock 資料結構不破壞既有頁面渲染；通過後 `git push` 同步 Lovable
