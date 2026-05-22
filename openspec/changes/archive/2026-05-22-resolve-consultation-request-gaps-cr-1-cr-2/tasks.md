## 1. Spec 修訂驗證

- [x] 1.1 對照 [proposal.md](proposal.md) 確認 MODIFIED「諮詢單實體與表單欄位」delta 涵蓋 consultant_note 欄位定義與 consultation_topic 唯讀說明
- [x] 1.2 對照 [proposal.md](proposal.md) 確認 REMOVED「諮詢人員指派」+ ADDED「諮詢人員認領」delta 完整移除「業務或值班人員指派」措辭
- [x] 1.3 對照 [proposal.md](proposal.md) 確認 MODIFIED「諮詢單轉需求單欄位帶入」delta 雙區塊 mapping 格式正確
- [x] 1.4 對照 [proposal.md](proposal.md) 確認 ADDED「諮詢人員筆記欄位」delta 涵蓋編輯權限 / 編輯時機 / 編輯規則 / 跨人交接四面向
- [x] 1.5 執行 `openspec validate resolve-consultation-request-gaps-cr-1-cr-2` 確認 delta 格式無錯誤
- [x] 1.6 對照 [proposal.md](proposal.md) 確認 MODIFIED state-machines「諮詢單狀態機（v2 簡化）」+「訂單狀態機」delta 涵蓋 CR-1 認領語意對齊（待諮詢狀態說明、角色權責、Scenarios 措辭）
- [x] 1.7 對照 [proposal.md](proposal.md) 確認 MODIFIED quote-request「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」delta 涵蓋 CR-2 雙區塊 mapping 對齊
- [x] 1.8 重跑 `openspec validate` 確認新增 state-machines + quote-request delta 通過
- [x] 1.9 verify 階段補修：consultation-request delta 加 MODIFIED「諮詢單活動紀錄」（ActivityLog 事件型別表 + 認領事件 Scenario）+ business-processes delta MODIFIED「諮詢前置流程端到端規則」（ASCII 流程圖「業務指派 consultant_id」→「諮詢人員自我認領」）
- [x] 1.10 重跑 `openspec validate` 確認補修後 delta 通過
- [x] 1.11 verify 階段二次補修：consultation-request delta 加 MODIFIED「諮詢費付款成功觸發自動建單」（Slack 通知對象從值班業務改為諮詢人員群組廣播）+ MODIFIED「諮詢結束分支」（Scenarios GIVEN「已指派」→「已認領」）
- [x] 1.12 重跑 `openspec validate` 確認二次補修後最終 delta 通過 — 4 個 spec / 9 個 Requirement 變更（5 MODIFIED + 1 REMOVED + 2 ADDED in consultation-request；2 MODIFIED in state-machines；2 MODIFIED in quote-request；1 MODIFIED in business-processes）

## 2. Cross-spec 一致性檢查

- [x] 2.1 檢查 [state-machines spec](../../specs/state-machines/spec.md) 諮詢單狀態機 + 訂單狀態機諮詢相關 Scenarios（已加入 specs/state-machines/spec.md delta，MODIFIED 兩個 Requirement 對齊 CR-1 認領語意）
- [x] 2.2 檢查 [user-roles spec](../../specs/user-roles/spec.md) 諮詢角色 R&R 是否需更新（不需更新 — 認領動作屬諮詢日常職責隱含，user-roles spec § Requirement: 諮詢角色額外職責 已涵蓋）
- [x] 2.3 檢查 [order-management spec](../../specs/order-management/spec.md) § Payment 跨實體轉移 是否受影響（不受影響 — Payment polymorphic 關聯與跨實體轉移流程不變，諮詢分派模式與備註欄位不影響 Payment 規則）
- [x] 2.4 檢查 [quote-request spec](../../specs/quote-request/spec.md) `requirement_note` 欄位定義（已加入 specs/quote-request/spec.md delta，MODIFIED「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」對齊雙區塊 mapping；Data Model 表格 L515 由 task 5.3 archive 後人工同步）
- [x] 2.5 verify 階段補檢：[business-processes spec](../../specs/business-processes/spec.md) §「諮詢前置流程端到端規則」L863「業務指派 consultant_id」與 CR-1 衝突（已加入 specs/business-processes/spec.md delta MODIFIED 對齊）
- [x] 2.6 verify 階段補檢：[consultation-request spec L332](../../specs/consultation-request/spec.md) §「諮詢單活動紀錄」事件描述「指派諮詢人員」措辭與 CR-1 衝突（已在 consultation-request delta 加 MODIFIED 對齊）
- [x] 2.7 verify 階段二次補檢：[consultation-request spec L88](../../specs/consultation-request/spec.md) §「諮詢費付款成功觸發自動建單」Scenario「Slack 通知給值班業務指派 consultant_id」措辭與 CR-1 衝突（已加 MODIFIED 對齊）
- [x] 2.8 verify 階段二次補檢：[consultation-request spec L121 / L132](../../specs/consultation-request/spec.md) §「諮詢結束分支」Scenarios GIVEN「已指派 consultant_id」措辭與 CR-1 衝突（已加 MODIFIED 對齊）

## 3. OQ closure（archive 後執行）

- [x] 3.1 [CR-1 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-1-諮詢分派模式自派他派或混合.md) frontmatter `status` 改為 `closed`、補「決議」段（拍板純自派 + 設計理由）
- [x] 3.2 [CR-2 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-2-consultation_topic欄位定位.md) frontmatter `status` 改為 `closed`、補「決議」段（拍板雙欄位 consultant_note）

## 4. User Story 同步（archive 後執行）

- [x] 4.1 [US-CR-002](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單.md) 業務流程「分派模式議題」段移除、補入 CR-1 拍板結果（純自派）
- [x] 4.2 [US-CR-002](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單.md) `related-oq` frontmatter 保留 CR-1（追溯），新增校對紀錄段「第三輪（CR-1 closed 後 v4）」
- [x] 4.3 [US-CR-003](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度.md) 業務流程 step 4「待 CR-2 解答」措辭移除、補入 CR-2 拍板結果（雙欄位 consultant_note）
- [x] 4.4 [US-CR-003](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度.md) `related-oq` frontmatter 保留 CR-2（追溯），新增校對紀錄段「第三輪（CR-2 closed 後 v4）」

## 5. Vault 卡同步（archive 後執行）

- [x] 5.1 [05-entities/諮詢單](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md) 新增 `consultant_note` 欄位描述（與 `consultation_topic` 並列；雙欄位設計理由）
- [x] 5.2 [05-entities/諮詢單](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md) `last-reviewed` frontmatter 更新為今日日期
- [x] 5.3 [quote-request spec § Data Model QuoteRequest 表格 L515](../../specs/quote-request/spec.md) `requirement_note` 欄位「諮詢轉需求單時自 ConsultationRequest.consultation_topic 帶入」說明改為「自 consultation_topic + consultant_note 以雙區塊格式合併帶入」（Data Model 表格不在 OpenSpec delta 範圍，archive 工具不會自動處理，須人工同步）

## 6. doc-audit 一致性驗證（archive 後執行）

- [x] 6.1 執行 `doc-audit` 確認 consultation-request spec 與 Vault 卡 / 其他 spec 跨檔案一致性
- [x] 6.2 若 doc-audit 發現額外不一致項目，回頭補修對應檔案後重跑

## 7. 追溯總結

- [x] 7.1 確認 4 張變動檔案（spec / 2 OQ / 2 user story / 1 Vault 卡）皆已同步、無遺漏
- [x] 7.2 在 audit-log（[ERP_Vault/00-meta/audit-log.md](../../../memory/erp/ERP_Vault/00-meta/audit-log.md)）追加本 change archive 紀錄
