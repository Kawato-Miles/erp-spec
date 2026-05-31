---
type: user-story
us-id: US-AR-005
module:
  - prepress-review
role:
  - "[[審稿主管]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿主管工作台 L1 今日卡片"
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿總覽時間區間篩選與 Summary Bar"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[審稿分配規則]]"
related-entities:
  - "[[印件]]"
related-oq:
  - "[[AR-6-退件率分母是否排除技術退件]]"
  - "[[AR-7-審稿主管監控異常閾值定義]]"
related-test-cases: []
prerequisites:
  - 審稿主管已登入系統
  - 部門當日有審稿活動進行中
---

# US-AR-005 監控當日審稿工作量

## 業務情境（穩定層）

### 作為
[[審稿主管]]

### 我希望
能即時看當日審稿部門的新進、已合格、不合格 3 個指標

### 以便
快速察覺當日運作異常並及早調度，降低印件積壓風險

### 前置條件
- 審稿主管已登入系統

### 業務流程

1. 審稿主管登入系統後查看部門當日即時狀況
2. 系統呈現當日 3 個核心指標：
   - **新進稿件數**：印件首輪送審時間落在今日的印件總數
   - **已合格數**：審稿時間落在今日且結果為「合格」的審稿輪次數
   - **不合格數**：審稿時間落在今日且結果為「不合格」的審稿輪次數（**是否含技術退件待 [[AR-6-退件率分母是否排除技術退件]] 解答**）
3. 審稿主管依指標識別當日異常（異常閾值定義待 [[AR-7-審稿主管監控異常閾值定義]] 解答）
4. 識別異常後，後續調度動作不在本 user story 範疇，由下游 user story 承接：
   - 人員覆寫分派：[[US-AR-004-覆寫印件分派]]
   - 績效比對辨識異常審稿員：[[US-AR-006-比對審稿人員績效]]
   - 跨時間區間完成紀錄查詢：[[US-AR-008-追蹤部門審稿完成紀錄]]

> **本 user story 範疇邊界**：本 US 涵蓋 3 個指標（新進 / 合格 / 不合格）；spec § L1 今日卡片實際描述為 4 格（含「待派工」），「待派工」指標屬於 [[US-AR-004-覆寫印件分派]] 的觸發點，由該 user story 涵蓋。

### 成功條件

1. 審稿主管登入後可查看當日新進稿件數、已合格數、不合格數 3 個核心指標
2. 各指標計算口徑符合業務流程 step 2 定義（以審稿輪次為計數單位、含明確時間錨點）
3. 主管處理部門其他作業時，仍能即時察覺指標變動，無需主動回到監控頁（持續性需求；UI 解法由 Prototype 階段決定）
4. 主管識別異常後可從指標進入具體印件清單（與 [[US-AR-008-追蹤部門審稿完成紀錄]] 互通）

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5：
  - § Requirement「審稿主管工作台 L1 今日卡片」L578-598（L1 4 格定義）
  - § Requirement「審稿總覽時間區間篩選與 Summary Bar」L530-576（指標計算口徑）
  - § Requirement「審稿主管工作台」L394-431（背景）
- [[審稿分配規則]]：分派邏輯與待派工觸發
- 原 Notion User Story DB `US-AR-005`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 6/10（中度落差），識別 6 gap；senior-pm INVEST 5 PASS / 1 部分 FAIL Testable，3 問題。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 補「3 個指標計算口徑」（spec L584-586 / L400-402）| erp-consultant G2（high）| 已採納：業務流程 step 2 明示新進 / 合格 / 不合格的計算對象（Round 數）與時間錨點 |
| 「4 格 vs 3 格」spec 邊界（spec L583 明示 4 格含「待派工」）| erp-consultant G1（high）| 已採納「本 US 涵蓋 3 格」邊界決策：業務流程加註說明「待派工」歸 [[US-AR-004]] |
| 成功條件 2「指標即時更新」屬 UI 規格混入 | senior-pm P1（medium）| 已採納：改為「指標計算口徑符合 step 2 定義」業務化描述 |
| 成功條件 3「切換工作區指標保持可見」屬 UI 規格 | senior-pm P2（medium）| 已採納：改為「持續性需求；UI 解法由 Prototype 階段決定」業務化描述 |
| 下游連鎖反應「調度人力」未引下游 US | erp-consultant G4（medium）| 已採納：業務流程 step 4 引 [[US-AR-004]] / [[US-AR-006]] / [[US-AR-008]] |
| frontmatter relation 空陣列 | erp-consultant G5（medium）| 已採納：補 related-business-logic + related-entities |
| 補 drill-down 路徑（指標 → 印件清單）| senior-pm 未捕捉痛點 3 | 已採納：成功條件 4 補入「與 [[US-AR-008]] 互通」 |
| 「以便」量化 / 異常閾值定義 | senior-pm P3（medium）| **暫定處理**：開 OQ [[AR-7]]，「以便」保持定性「快速察覺異常並及早調度」，量化待 OQ 解答 |
| 退件率含 / 不含技術退件 | erp-consultant 段 4 設計模式對照「狀態碼結構化」未明示 | 暫定處理：開 OQ [[AR-6]]，業務流程 step 2 內聯引 OQ |
| 更新頻率 SLA（spec 用「即時」但無 refresh interval）| erp-consultant G3（medium）| **未採納**：refresh interval 屬實作 SLA，不適合放業務情境段；UI 解法定案時於 Prototype 階段補 |
| 「歷史比較基準」拆獨立 US | senior-pm 未捕捉痛點 2 | **未採納**：屬下游 dashboard 進階功能，現階段不入本 US；後續若需求明確再開新 US |

### 第二輪審查衍生 OQ

- [[AR-6-退件率分母是否排除技術退件]]（priority medium，跨 US-AR-005 / 006 / 007）
- [[AR-7-審稿主管監控異常閾值定義]]（priority low，跨 US-AR-005 / 006）

### 暫不處理（Miles 拍板）

- refresh interval SLA：屬實作層級，Prototype 階段補
- 歷史比較基準（拆獨立 US）：屬下游 dashboard 進階功能，需求未明確時不拆
