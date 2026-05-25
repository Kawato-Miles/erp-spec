## 1. Spec 修訂驗證

- [x] 1.1 對照 [proposal.md](proposal.md) 確認 MODIFIED「審稿主管覆寫分配」delta 涵蓋 UI 層阻擋措辭 + 設計理由段 + 候選清單為空 Scenario
- [x] 1.2 對照 [proposal.md](proposal.md) 確認 MODIFIED「印件 ActivityLog」delta 涵蓋新增 3 個事件型別（打樣結果判定 / 打樣後棄用 / 自原印件建立）
- [x] 1.3 對照 [proposal.md](proposal.md) 確認 ADDED「PrintItem 生命週期欄位」delta 涵蓋 lifecycle_status + derived_from_print_item_id 欄位定義 + reviewDimensionStatus 分維度說明 + 3 個 Scenarios
- [x] 1.4 對照 [proposal.md](proposal.md) 確認 ADDED「打樣結果業務判定」delta 涵蓋 proofing_result + proofing_result_note 欄位 + 3 enum 分支 + 判定不可逆 + 觸發時機改為「打樣 WorkOrder 製作完成」 + 6 個 Scenarios（新增大貨印件不可判定 Scenario）
- [x] 1.5 對照 [proposal.md](proposal.md) 確認 ADDED「打樣後棄用原印件建新印件」delta 涵蓋 clone 範圍（保留 / reset 欄位明示）+ atomic transaction + 追溯關聯 + 4 個 Scenarios
- [x] 1.6 執行 `openspec validate resolve-prepress-review-gaps-ar-10-ar-12` 確認 delta 格式無錯誤
- [x] 1.7 apply 階段補修：cross-spec 衝突後新增 business-processes + state-machines delta（MODIFIED「打樣流程規則」+「印件狀態機（雙維度）」+「印件打樣特殊流程」），同步修訂 prepress-review delta 觸發時機（從「打樣 ProductionTask 完成」改為「打樣 WorkOrder 製作完成」），重跑 validate 確認 3 個 delta 通過
- [x] 1.8 apply 階段大幅重寫對齊 Prototype 既有實作：Prototype 已實作 sampleResult / 打樣 WorkOrder 詳情頁判定 UI / rebuildPrintItemForSampleNG 棄用 + clone 流程；本 change 範疇收斂為「補 spec 對齊既有實作」+「新增 derived_from_print_item_id 結構化追溯 FK」；取消原設計 `lifecycle_status` / `proofing_result` / `proofing_result_note` / 印件層 ActivityLog 新事件型別；spec delta 全面對齊 Prototype 中文 enum 命名（`'待確認' | 'OK' | 'NG-製程問題' | 'NG-稿件問題'`）+ 觸發位置（打樣 WorkOrder 詳情頁）+ 棄用機制（既有 PrintItemStatus = '已棄用'）；重跑 validate 通過

## 2. Cross-spec 一致性檢查

- [x] 2.1 檢查 [state-machines spec](../../specs/state-machines/spec.md) 印件狀態機（雙維度）：本 change 採「lifecycle_status 為第三屬性（非狀態機維度）」設計，已加入 specs/state-machines/spec.md delta MODIFIED 補相關說明
- [x] 2.2 檢查 [state-machines spec § 印件打樣特殊流程](../../specs/state-machines/spec.md)：已加入 delta MODIFIED 對齊新 enum（ok / ng_artwork / ng_process）+ 涵蓋三個業務判定分支 Scenarios + 棄用全部打樣印件 Scenario
- [x] 2.3 檢查 [business-processes spec § 打樣流程規則](../../specs/business-processes/spec.md)：已加入 specs/business-processes/spec.md delta MODIFIED 對齊新 enum + 補引用 prepress-review spec Requirements + 觸發時機改為「打樣 WorkOrder 製作完成」
- [x] 2.4 檢查 [production-task spec](../../specs/production-task/spec.md)：既有 spec 無「打樣 ProductionTask 屬性」概念，「打樣 vs 大貨」由 WorkOrder.type 區分（work-order spec L825）；本 change 觸發時機已改為「打樣 WorkOrder 製作完成」對齊既有設計，production-task 不需修訂
- [x] 2.5 檢查 [user-roles spec § 業務角色職責](../../specs/user-roles/spec.md)：業務角色「評估、訂購、審稿、打樣印製、出貨（全部）」已涵蓋打樣判定動作，無須補額外職責描述

## 3. OQ closure（archive 後執行）

- [ ] 3.1 [AR-10 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-10-主管覆寫分派是否允許破例派工.md) frontmatter `status` 改為 `closed`、補「決議」段（拍板 UI 層阻擋 + 設計理由）
- [ ] 3.2 [AR-12 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-12-打樣後新稿件實體機制與根因判定.md) frontmatter `status` 改為 `closed`、補「決議」段（議題 1 棄用 + 建新印件 / 議題 2 三值 enum / ng_process 留 AR-13）

## 4. 新開 OQ AR-13（archive 後執行）

- [ ] 4.1 觸發 `oq-manage` mode B 新開 AR-13「打樣 ng-製成問題下游處理機制」，含 candidate 候選方案（建新打樣 ProductionTask 重做 / 轉 NCR 走 production-task spec disposition / 其他）+ raised-at = 2026-05-23 + priority = medium + expected-resolution-at = 2026-Q3
- [ ] 4.2 AR-13 OQ frontmatter `related-vault` 補對應 user story 引用（US-AR-011 可能需要 wiki link 引到 AR-13）

## 5. User Story 同步（archive 後執行）

- [ ] 5.1 [US-AR-004](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-004-覆寫印件分派.md) 業務流程 step 4「能力門檻策略待 AR-10 解答」措辭移除、補入 AR-10 拍板結果（UI 層阻擋）；成功條件 4 同步更新
- [ ] 5.2 [US-AR-004](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-004-覆寫印件分派.md) `related-oq` frontmatter 保留 AR-10（追溯），新增校對紀錄段「第三輪（AR-10 closed 後 v3）」
- [ ] 5.3 [US-AR-011](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件.md) 業務流程 step 1 + step 3 引 AR-12 解答（議題 1 + 議題 2）；補「ng_artwork 觸發 → 棄用 + clone 新印件 + 自動分派」流程描述
- [ ] 5.4 [US-AR-011](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件.md) `related-oq` frontmatter 保留 AR-12（追溯）+ 補 AR-13（衍生）；新增校對紀錄段「第三輪（AR-12 closed 後 v3）」

## 6. Vault 卡同步（archive 後執行）

- [ ] 6.1 [05-entities/印件](../../../memory/erp/ERP_Vault/05-entities/印件.md) 新增 `derived_from_print_item_id` 欄位描述（本 change 唯一新增 FK）+ 補 `sampleResult` 欄位描述（Prototype 既有但 Vault 卡未描述）+ 補 `PrintItemStatus = '已棄用'` 觸發場景（NG-稿件問題）+ 追溯機制說明（FK + notes 雙重追溯）
- [ ] 6.2 [05-entities/印件](../../../memory/erp/ERP_Vault/05-entities/印件.md) `last-reviewed` frontmatter 更新為 2026-05-23
- [ ] 6.3 [04-business-logic/打樣流程](../../../memory/erp/ERP_Vault/04-business-logic/打樣流程.md) 補業務判定 enum（三值）+ ng_artwork 觸發棄用建新流程 + ng_process 留 AR-13 暫不處理
- [ ] 6.4 [04-business-logic/審稿分配規則](../../../memory/erp/ERP_Vault/04-business-logic/審稿分配規則.md) 補主管覆寫 UI 層阻擋設計理由（自動派工破例 vs 主管覆寫嚴格的動機差異）

## 7. 工程索引同步（archive 後執行）

- [ ] 7.1 CLAUDE.md § Spec 規格檔清單：稿件審查 v1.5 → v1.6（補本 change archive 紀錄）

## 8. doc-audit 一致性驗證（archive 後執行）

- [ ] 8.1 執行 `doc-audit` 確認 prepress-review spec 與 Vault 卡 / 其他 spec 跨檔案一致性
- [ ] 8.2 若 doc-audit 發現額外不一致項目，回頭補修對應檔案後重跑

## 9. 追溯總結

- [ ] 9.1 確認所有變動檔案皆已同步、無遺漏（spec 1 + OQ 2 closed + 1 新開 + user story 2 + Vault 卡 3 + CLAUDE.md）
- [ ] 9.2 在 audit-log（[ERP_Vault/00-meta/audit-log.md](../../../memory/erp/ERP_Vault/00-meta/audit-log.md)）追加本 change archive 紀錄
