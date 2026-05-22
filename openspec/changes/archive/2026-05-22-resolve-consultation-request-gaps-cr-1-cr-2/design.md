## Context

本 change 解 OQ CR-1（諮詢分派模式）+ OQ CR-2（諮詢備註欄位定位），落實 user story v2 校對中發現的 spec ↔ user story 不一致。拍板方案見 [規劃文件](../../../.claude/plans/user-story-squishy-moonbeam.md)。

商業背景：
- [諮詢單實體](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)：ConsultationRequest 既有欄位與生命週期
- [諮詢角色](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)：諮詢人員權責與認領動機
- [CR-1 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-1-諮詢分派模式自派他派或混合.md)：分派模式選項分析（Tharstern / Printavo 業界對照）
- [CR-2 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-2-consultation_topic欄位定位.md)：欄位定位選項分析（覆寫 / 雙欄位 / ActivityLog / 版本化）

## Goals / Non-Goals

**Goals**：

- CR-1：諮詢單分派模式 spec 改為「諮詢人員自我認領」單一路徑，移除「業務 / 值班人員指派」措辭
- CR-2：ConsultationRequest 實體新增 `consultant_note` 欄位作為諮詢人員與客戶溝通記錄
- CR-2：`consultation_topic` 客戶 surveycake 原話保留唯讀（對齊 ISO 9001 客戶指示可追溯）
- CR-2：諮詢轉需求單時 `consultation_topic` + `consultant_note` 合併 mapping 至需求單 `requirement_note`
- spec 修訂結束後 4 張 OQ / user story 同步 close 與校對措辭清理

**Non-Goals**：

- 不處理冷門諮詢案件無人認領的兜底機制（暫不過度設計，未來若發生再開 change 補）
- 不在需求單側新增獨立諮詢筆記欄位（避免冗餘，業務在需求單可再編輯 `requirement_note`）
- 不處理 `consultant_note` 細部 RBAC（沿用既有諮詢人員 + 主管權限模型）
- 不變動 `consultation_topic` 與 14 表單蒐集欄位的客戶 surveycake 取得流程
- 不變動既有 Payment / Invoice / OrderExtraCharge 機制

## Decisions

### D1：CR-1 採純自派而非混合

- **選項**：純自派 / 純他派 / 混合（自派為主超時轉指派）/ 依案件分類
- **拍板**：純自派
- **理由**：
  - 諮詢量規模小，不需 round-robin 自動派工兜底
  - US-CR-002「以便」段已明示「沿用既有分流不需自動派工」
  - 諮詢人員依專長 + 當前負載自主決策更符合既有日常運作
  - 未來若發生「冷門案件無人接」現象，再開新 change 補兜底機制

### D2：CR-2 採雙欄位 `consultant_note` 而非覆寫 `consultation_topic`

- **選項**：覆寫 / 雙欄位 / ActivityLog / 版本化
- **拍板**：雙欄位
- **理由**：
  - 覆寫方案違反 ISO 9001 客戶原話可追溯不可竄改原則
  - ActivityLog 方案備註散落於活動紀錄，違反 US-CR-003 step 6「跨人交接接手者可看到歷次備註」要求
  - 版本化方案 schema 複雜，過度設計
  - 雙欄位對齊印刷 MIS / CRM 業界主流（客戶原話唯讀 + 業務筆記可編輯）

### D3：`consultant_note` 轉需求單採合併 mapping 至 `requirement_note` 而非獨立欄位

- **選項**：合併到 `requirement_note` 雙區塊 / 在需求單新增獨立欄位 / 只 mapping `consultant_note`
- **拍板**：合併到 `requirement_note` 雙區塊格式
- **理由**：
  - 避免在需求單新增冗餘欄位（與既有 `requirement_note` 角色重疊）
  - 合併後業務在需求單可再編輯（既有規則不變，不需新增規則處理 `consultant_note` 同步）
  - 雙區塊格式（`[客戶原話]` + `[諮詢人員筆記]`）清楚分離兩個來源
  - 若只 mapping `consultant_note` 會遺失客戶原話追溯（同 D2 理由）

### D4：cross-spec 同步修訂範圍涵蓋 state-machines + quote-request

- **背景**：apply 階段檢查發現 state-machines spec（諮詢單狀態機 + 訂單狀態機諮詢相關 Scenarios）與 quote-request spec（「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」兩 Requirement）引用了本 change 修訂的 mapping 來源 / 認領語意，存在 cross-spec 不一致
- **選項**：A 加入本 change 範疇擴張 / B 另開 follow-up change / C archive 後手動補修
- **拍板**：A 加入本 change
- **理由**：
  - 兩個 cross-spec 修訂與本 change 內聚邏輯一致（state-machines 是 CR-1 認領語意的下游、quote-request 是 CR-2 mapping 來源的下游）
  - 一個 change 內統一處理可避免中間時段 spec 之間描述不一致
  - 另開 follow-up change（選項 B）會拉長對齊週期、增加 archive 後又開 change 修同主題的 overhead
  - archive 後手動補修（選項 C）違反 documentation-driven 精神
- **trade-off**：本 change 範疇從「單 spec」擴張為「3 specs」，但變更性質仍屬同一主題（諮詢分派模式 + 諮詢備註欄位的下游影響），不違反 OpenSpec change 內聚原則

## Risks / Trade-offs

- **[Risk] 冷門諮詢案件無人認領** → [Mitigation] 短期靠諮詢人員自律 + 列表預設依 `created_at` ASC 確保最早建立的最先被看到；中期若發生再開兜底 change
- **[Risk] `consultant_note` 跨人交接時的權限可見性歧義** → [Mitigation] 明示「同模組諮詢人員可互相查閱」於 Requirement 描述，避免實作期歧義
- **[Trade-off] 需求單 `requirement_note` 變雙區塊格式可能被業務手動修改格式** → [Mitigation] 設定為純文字傳輸，業務可自由編輯，下游 spec / Prototype 不依賴格式 parsing；雙區塊只是 mapping 預設格式

## Migration Plan

無資料庫遷移考量（Prototype 階段尚未有 production data）。

archive 後同步動作：

1. close OQ [CR-1](../../../memory/erp/ERP_Vault/08-open-questions/CR-1-諮詢分派模式自派他派或混合.md) + [CR-2](../../../memory/erp/ERP_Vault/08-open-questions/CR-2-consultation_topic欄位定位.md)（補決議段）
2. 同步 user story [US-CR-002](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單.md) + [US-CR-003](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度.md)（移除「待 OQ 解答」措辭 + 補決議結果）
3. Vault [05-entities/諮詢單.md](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md) 新增 `consultant_note` 欄位描述
4. doc-audit 跑一次驗證跨檔案一致性

## Open Questions

無（拍板方案已明確）。本 change 不引入新 OQ。
