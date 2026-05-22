## Why

User story v2 校對過程中（2026-05-22）識別到諮詢單模組兩項 spec ↔ user story 不一致：

- **CR-1（諮詢分派模式）**：[consultation-request spec](../../specs/consultation-request/spec.md) L98-108「業務或值班人員指派」（純他派）與 [US-CR-002](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單.md) 描述的「諮詢人員自我認領」（純自派）業務模式衝突。詳見 [CR-1 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-1-諮詢分派模式自派他派或混合.md)
- **CR-2（諮詢備註欄位定位）**：spec L26 `consultation_topic` 為客戶 surveycake 原話、L150 mapping 至需求單 `requirement_note` 才能編輯；但 [US-CR-003](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度.md) 描述「諮詢人員可編輯諮詢備註」對應欄位 spec 未明示。詳見 [CR-2 OQ](../../../memory/erp/ERP_Vault/08-open-questions/CR-2-consultation_topic欄位定位.md)

不解 → user story v2 校對停留草稿、相關 spec 條文與 user story 持續引用未解 OQ、後續 Prototype 與測試案例階段卡關。本次拍板方案已於 [規劃文件](../../../.claude/plans/user-story-squishy-moonbeam.md) 確定，本 change 落實 spec 修訂。

對應 Vault 商業背景卡：[諮詢單實體](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)、[諮詢角色](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)。

## What Changes

### A. CR-1：諮詢分派模式改純自派

- Requirement「諮詢人員指派」rename 為「諮詢人員認領」
- 條文改為：諮詢人員 SHALL 於 ConsultationRequest 建立後（status = 待諮詢）自行認領，將 `consultant_id` 寫入自身 user_id；認領完成後狀態 SHALL 維持「待諮詢」，僅標示已分派
- 移除「業務或值班人員指派」措辭
- Scenario「業務指派諮詢人員」改為「諮詢人員認領諮詢單」
- 補設計理由：諮詢量規模小不需 round-robin 自動派工、諮詢人員依專長與當前負載自主決策、沿用既有分流；若未來發生「冷門案件無人接」現象，另開 change 補兜底機制

### B. CR-2：新增 `consultant_note` 雙欄位

- ConsultationRequest 實體系統內生欄位段新增 `consultant_note`：text（最長 2000 字，非必填）— 諮詢人員與客戶溝通記錄
- 新增 Requirement「諮詢人員筆記欄位」：
  - 編輯權限：諮詢人員（current `consultant_id`）+ 主管
  - 編輯時機：諮詢單狀態為「待諮詢」（已認領後）
  - 編輯規則：可多次儲存，每次寫入 ActivityLog（from / to / actor / timestamp）
  - 跨人交接：同模組諮詢人員可互相查閱 `consultant_note` + ActivityLog 歷次變更
- L26 表格保留 `consultation_topic` 客戶原話設定不變（必填 + 唯讀）
- Requirement「諮詢單轉需求單欄位帶入」延伸：`consultation_topic` + `consultant_note` 合併 mapping 至需求單 `requirement_note`，雙區塊格式：
  ```
  [客戶原話]
  <consultation_topic>

  [諮詢人員筆記]
  <consultant_note>
  ```
- 業務在需求單 `requirement_note` 上可再編輯（既有規則不變）

## Capabilities

### New Capabilities

無（本 change 全為既有 capability 補齊）。

### Modified Capabilities

- `consultation-request`：諮詢人員指派改認領（CR-1）+ 新增 `consultant_note` 欄位與轉需求單 mapping 延伸（CR-2）+ ActivityLog 事件型別補諮詢人員認領 / 主管代為認領 / 諮詢備註修改
- `state-machines`：諮詢單狀態機「待諮詢」狀態說明改為自我認領、角色權責措辭對齊，並同步更新「業務指派諮詢人員」Scenario 為「諮詢人員自我認領」+ 涉及諮詢的 Scenarios GIVEN 措辭「已指派」→「已認領」（CR-1 下游同步）
- `quote-request`：「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」兩 Requirement mapping 描述對齊雙區塊格式（CR-2 下游同步）
- `business-processes`：「諮詢前置流程端到端規則」ASCII art 流程圖「業務指派 consultant_id」→「諮詢人員自我認領 consultant_id」+ 補 consultant_note 編輯說明 + 補需求單 requirement_note 雙區塊 mapping 提示（CR-1 + CR-2 下游同步）

## Impact

- **specs（4 個 modified）**：consultation-request（主要）+ state-machines（諮詢單狀態機 + 訂單狀態機諮詢相關 Scenarios 措辭對齊）+ quote-request（mapping Requirements 對齊雙區塊）+ business-processes（諮詢前置流程端到端規則 ASCII 流程圖措辭對齊）
- **資料模型表格人工同步**（archive 後）：[quote-request spec § Data Model QuoteRequest 表格 L515](../../specs/quote-request/spec.md) `requirement_note` 欄位「諮詢轉需求單時自 ConsultationRequest.consultation_topic 帶入」說明改為「自 consultation_topic + consultant_note 以雙區塊格式合併帶入」（Data Model 表格不在 OpenSpec delta 範圍內）
- **OQ closure**：[CR-1](../../../memory/erp/ERP_Vault/08-open-questions/CR-1-諮詢分派模式自派他派或混合.md)、[CR-2](../../../memory/erp/ERP_Vault/08-open-questions/CR-2-consultation_topic欄位定位.md) archive 後標 status=closed + 補決議段
- **User Story 同步**：[US-CR-002](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單.md)、[US-CR-003](../../../memory/erp/ERP_Vault/13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度.md) 移除「待 OQ 解答」措辭、補決議結果
- **Vault 卡同步**：[諮詢單實體卡](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md) 新增 `consultant_note` 欄位描述
- **Prototype 影響**（後續另案實作）：諮詢單詳情頁改自我認領入口、新增 `consultant_note` 編輯欄位、需求單 `requirement_note` 帶入格式調整
