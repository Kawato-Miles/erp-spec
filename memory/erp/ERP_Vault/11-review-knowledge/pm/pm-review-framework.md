---
type: meta
status: active
last-reviewed: 2026-05-19
---

# PM BRD 審查 5 維度

> [senior-pm](../../../../../.claude/agents/senior-pm.md) BRD 審查模式（Step 4.5）的審查框架。BRD 草稿完成後，與 [ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md) 和 [erp-consultant](../../../../../.claude/agents/erp-consultant.md) 平行執行時依此框架輸出審查。

## 一、適用時機

| 觸發 | 動作 |
|------|------|
| BRD 草稿完成，進入三視角審查 | 依此 5 維度逐項審查 |
| Miles 單獨呼叫 [senior-pm](../../../../../.claude/agents/senior-pm.md) 審查既有 BRD | 依此 5 維度輸出單輪審查 |

## 二、5 個審查維度

載入背景後，從以下五個維度審查，**每個維度都必須有具體意見**：

### 1. 問題定義品質（核心）

- 這個 BRD 的「問題陳述」是否清楚描述了使用者的真實痛點？
- 問題定義有沒有跳過「為什麼」直接寫「要做什麼」？（症狀 vs 根本原因）
- 業界在這個問題上的解法是什麼？有沒有更根本的切入角度？（參照 WebSearch 結果）

### 2. 使用者需求對齊

- 每個功能需求都能對應到 [[user-story-spec|User Story DB]] 中的具體故事嗎？
- 有沒有功能是「技術上合理但使用者不會用」的設計？
- 有沒有遺漏了某個角色的核心需求？

### 3. 成功指標可量化性

- BRD 的 KPI 是否具體可測量？（「更快」不算，「從 X 分鐘縮短到 Y 分鐘」才算）
- KPI 是否對應到 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f) 中的商業目標？
- 有沒有指標是「做了就一定達成」的偽指標，而不是真正測試成效的指標？

### 4. 範疇邊界清晰度

- In Scope 的功能邊界是否足夠明確？
- Out of Scope 的說明是否能有效防止後續需求蔓延？
- 有沒有功能描述模糊到「可能是 Scope 內也可能不是」的地帶？

### 5. 優先順序合理性

- P0 / P1 / P2 的分配是否反映了真實的業務優先順序？
- 有沒有「全部都是 P0」的過度規劃？
- 有沒有某個關鍵功能被低估優先級，導致上線後必須緊急補做？

## 三、輸出格式

詳見 `.claude/agents/senior-pm.md` § 輸出格式 § BRD 審查模式。本卡只定義審查的「思考維度」，不重複具體輸出 template。

## 四、與其他視角的關係

| 維度 | 與 [[ceo-review-framework]] 的關係 | 與 [[erp-review-framework]] 的關係 |
|------|-----------------------------------|----------------------------------|
| 問題定義 | PM 看「問題定義是否清楚」；CEO 看「真正的問題是什麼」（業務深度）| ERP 看「系統設計 Insight」（系統深度）|
| 使用者需求對齊 | PM 看「需求是否覆蓋角色」；CEO 看「角色合不合理」；ERP 看「角色有沒有操作入口」 | 同左 |
| KPI 可量化性 | PM 看「KPI 是否可測量」；CEO 看「KPI 是否真實反映商業價值」（CEO 新增第 6 維度 KPI 對齊）| ERP 看「設計是否支援 KPI 達成」 |
| 範疇邊界 | PM 重點 | CEO 看「現場是否可行」；ERP 看「跨模組整合節點是否定義」 |
| 優先順序 | PM 重點 | CEO 看「導入阻力 vs ROI」 |

跨視角的關聯問題透過 [[multi-agent-discussion-protocol]] § Round 2「跨視角質疑」步驟顯式提出。

## 五、相關卡

- [[early-intervention-framework]] — 前期介入 5 維度（PM 另一種工作模式）
- [[user-story-spec]] — User Story 撰寫規格
- [[pm-data-map]] — PM 視角資料地圖
- [[cross-agent-checklist]] — 跨 agent 共用 checklist
- [[insight-discipline]] — Insight 規範
