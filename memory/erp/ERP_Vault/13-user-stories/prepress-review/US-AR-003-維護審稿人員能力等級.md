---
type: user-story
us-id: US-AR-003
module:
  - prepress-review
role:
  - "[[03-roles/審稿主管]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿人員能力欄位"
  - "[[04-business-logic/審稿分配規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/審稿分配規則]]"
  - "[[04-business-logic/難易度機制]]"
related-entities:
  - "[[05-entities/印件]]"
related-oq:
  - "[[AR-9-新審稿員建立時能力等級初值]]"
related-test-cases: []
prerequisites:
  - "審稿員已建立於系統"
  - "審稿主管角色已分派"
---

# US-AR-003 維護審稿人員能力等級

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能設定每位審稿員可承擔的最高印件難易度

### 以便
系統自動分派時不把超出能力的印件派給審稿員，保持分派合理性與審稿品質

### 前置條件
- 審稿部門人員已建立於系統
- 新審稿員建立時的等級初值規則待 [[AR-9-新審稿員建立時能力等級初值]] 解答

### 業務流程

1. 審稿主管查看審稿部門所有審稿員清單與當前能力等級
2. 審稿主管依審稿員實際表現與經驗，調整其能力等級（1-10 整數）；含升等（依表現提升）與降等（如審稿品質持續下滑時主管手動降）
3. 系統紀錄調整事件，含 spec § Requirement「審稿人員能力欄位」L22-26 要求的四要素：**時間 / 操作者 / 舊值 / 新值**
4. 等級變更僅影響未來自動分派；既有未完成分派維持原指派（依 spec L24）

### 成功條件

1. 每位審稿員有可維護的能力等級欄位（1-10 整數，**必填，未填不可儲存**）
2. 等級調整事件留有活動紀錄（含時間、操作者、舊值、新值）供事後追蹤
3. 等級調整後新進印件即時套用新等級進行能力門檻判定；既有未完成分派維持原指派（避免中途換手影響審稿員工作節奏）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/prepress/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5 § Requirement「審稿人員能力欄位」L6-26（三個 Scenario：必填 / 範圍 / 調整記錄）
- [[04-business-logic/審稿分配規則]]：能力門檻在自動分派的應用
- [[04-business-logic/難易度機制]]：1-10 等級對應
- 原 Notion User Story DB `US-AR-003`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 B+，識別 4 gap；senior-pm INVEST 5 PASS / 1 WARN，4 問題 + 4 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| ActivityLog 對齊 spec 四要素（時間 / 操作者 / 舊值 / 新值）| erp-consultant G1（medium）| 已採納：業務流程 step 3 + 成功條件 2 |
| 成功條件 1 補「必填」| erp-consultant G2（medium）| 已採納 |
| 業務流程 step 2 補升 / 降等觸發描述 | senior-pm 問題 3（low）| 已採納 |
| 成功條件 3 否定句改正面陳述 | senior-pm 問題 2（low）| 已採納：「等級調整後新進印件即時套用」 |
| frontmatter `related-entities` 空 | erp-consultant G3 / senior-pm 問題 4（low）| 已採納：補 [[05-entities/印件]]（審稿員實體卡尚未建，先連印件） |
| 新審稿員建立時等級初值 | senior-pm 未捕捉痛點 1（high）| 已採納：開 OQ [[AR-9-新審稿員建立時能力等級初值]]；前置條件引 OQ |
| 「以便」量化 | senior-pm 問題 1（medium）| **未採納**：本 US 業務價值來自「分派合理性」，量化基準（命中率 / 越界率）屬下游 KPI |
| 「reason」是否要記錄調整原因（spec 未要求）| erp-consultant G1 | **未採納記錄為強制**：spec 未要求 reason，本 US 保持四要素為主；reason 是否業務上有需求屬獨立議題 |
| 「依退件率自動建議降級」機制 | senior-pm 未捕捉痛點 3 | **未採納**：屬下游進階功能，現階段不入；如後續需求明確再開新 US |
| 「能力等級判定 SOP」業務規則 | senior-pm 未捕捉痛點 2 | **未採納**：屬人員培訓 SOP，不屬系統設計範疇 |
| frontmatter `related-oq` 欄位 | erp-consultant G4（low）| 已採納：補 [[AR-9]] |
