## 1. OQ 補抓與三視角審查

- [ ] 1.1 透過 Notion MCP（或 `oq-manage` skill）查詢 OQ Follow-up DB，列出與 C1 相關的未解 OQ 清單（關鍵字：QC、品檢、補生產、報工修正、入庫、齊套性、放行、議價、退款、shortfall）；將命中 OQ 連結補入 design.md § Open Questions
- [ ] 1.2 平行呼叫 `senior-pm` + `ceo-reviewer` + `erp-consultant` 三視角審查 proposal / design / delta specs
- [ ] 1.3 依三視角審查建議調整 specs 或 design（如審查方向涉及範疇變更，回到 propose 階段重議）
- [ ] 1.4 在 Notion OQ DB 新增本次討論衍生的 OQ：OQ-C1-1（最終工單判斷邏輯）、OQ-C1-3（Task layer 是否新增 scope / is_inspection_task）

## 2. Spec 主檔同步準備（歸檔前）

- [ ] 2.1 production-task 主 spec § Data Model 新增欄位定義：`type`（列舉，必填）、`scope`（列舉，必填）、`passed_quantity`（整數，僅 type = qc / final_inspection）、`failed_quantity`（整數，同上）、`upstream_production_task_id`（FK，僅 type = qc）
- [ ] 2.2 production-task 主 spec § Phase 2 預留功能 確認「QC 不通過補建生產任務」相關描述（屬 C3 範疇，C1 不變語意但需註記後續調整）
- [ ] 2.3 qc 主 spec 改寫為薄層說明：Purpose 區更新（「QCRecord 已併入 ProductionTask 框架」）、保留 § QC 角色權限邊界（MODIFIED 版本）、其餘 Requirements 標示 REMOVED 並提供 Migration 連結
- [ ] 2.4 state-machines 主 spec Purpose 區引言更新（「QC 單狀態機已移至獨立 qc capability」→「QC / 品檢任務狀態 = ProductionTask 狀態，定義於 production-task capability」）
- [ ] 2.5 user-roles 主 spec § QC 角色編輯限制 重寫對應 delta spec 內容；§ 完整權限對照表 QC 角色「任務」欄改為 R/W

## 3. Prototype mock data 更新

- [ ] 3.1 在 `sens-erp-prototype` 盤點既有 QCRecord 使用點（檔案路徑、引用元件）
- [ ] 3.2 移除 QCRecord mock data，改以 type = `qc` 的 ProductionTask 承載對應結構（保留 `passed_quantity` / `failed_quantity` / `upstream_production_task_id` 欄位映射）
- [ ] 3.3 新增 type = `final_inspection`、scope = `print_item` 的 ProductionTask mock data，覆蓋至少 2 個既有印件
- [ ] 3.4 本地 `npm run dev` + `npm run test:e2e` 驗證 mock 資料結構不破壞既有頁面渲染；通過後 `git push` 同步 Lovable

## 4. 業務情境（Notion）更新

- [ ] 4.1 在 [Notion 業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05) 新增品檢相關業務情境（至少 2 筆：正常全通過 / 部分不通過）
- [ ] 4.2 QC 既有業務情境檢視，將「QCRecord 建立」改為「ProductionTask (type = qc) 建立」，並更新引用路徑

## 5. 文件一致性稽核

- [ ] 5.1 執行 `doc-audit` skill 檢查跨檔案引用一致性
- [ ] 5.2 處理 audit 發現的引用斷鏈與不一致（特別是 business-scenarios、order-management、work-order 中可能引用 QCRecord 或 qc capability 的段落）
- [ ] 5.3 更新 CLAUDE.md § Spec 規格檔清單 中 production-task / qc / state-machines / user-roles 的「狀態」欄與「版本」欄

## 6. 歸檔

- [ ] 6.1 執行 `openspec status` 確認所有 artifact 為 done
- [ ] 6.2 執行 `/opsx:verify` 驗證 spec 變更內部一致性
- [ ] 6.3 執行 `/opsx:archive` 歸檔 change（delta specs 合併回 main specs）
- [ ] 6.4 確認 git commit 包含完整 change diff，並依 CLAUDE.md commit 格式撰寫訊息

## 7. 後續 Change 啟動準備

- [ ] 7.1 在後續討論中啟動 C2 `simplify-production-task-completion`（依 C1 完成後的 type / scope 欄位設計報工即完成邏輯與「製作中」狀態移除）
- [ ] 7.2 在 C2 完成後啟動 C3 `add-production-task-rework`（補生產 / Rework 副流程）
- [ ] 7.3 在 C2 完成後啟動 C4 `move-warehousing-to-print-item-layer`（入庫上移到印件層、齊套性公式變更）；C3 與 C4 可平行進行
- [ ] 7.4 C4 完成後整批調整 Prototype QC / 品檢相關 UI 元件（避免 C1-C4 期間反覆異動）
