# SDD 工作流程健檢與改善 — 執行設計

- 日期：2026-06-08
- 狀態：待 Miles 審閱
- 類型：brainstorming design doc（本次健檢的「執行設計」，非最終改善藍圖；藍圖是階段 3 的產出）

---

## 一、問題與目標

- 問題：OpenSpec 規格膨脹（order-management 已 4504 行，production-task 1777、state-machines 1415、business-processes 1366）導致交付與迭代時**漏改、產生內部矛盾**。
- 目標：從 SDD（spec-driven development）最佳實踐切入，診斷現況，產出**改善藍圖**。終局是改善整個工作流程，本次特別針對**前期規劃**與**後期稽核**兩階段的過時 skill 清整。
- 框架前提：**維持 OpenSpec**（架構不變），本次不是切檔案任務，是工作流程健檢。

### 範圍

- 範圍內：研究 SDD 最佳實踐（四面向）→ 診斷現況 → 改善藍圖。
- 範圍外：實際執行各改善項（拆 spec、砍/併 skill、改 config）—— 每項另走 OpenSpec change 或 writing-plans，不在本次 deliverable。

---

## 二、已定案決策（brainstorming 對齊結果）

| # | 決策 | 內容 |
|---|------|------|
| 1 | 計劃深度 | 診斷 + 改善藍圖（不寫逐步執行步驟，每項標「另走 change/plan」） |
| 2 | 研究焦點 | 四面向全收：規格顆粒度與模組化 / 一致性與防漂移 / 工作流程治理 / AI 輔助 SDD |
| 3 | 模型分工 | 研究 + 診斷用 Sonnet；計劃用 Opus 4.8 |
| 4 | 執行邊界 | 每階段停 + Miles 審閱（三段分開、中間以對話 gate，不做單一大 workflow） |
| 5 | 研究機制 | Workflow + Sonnet 自建管線（fan-out 搜尋 + 來源分級 + 對抗式查證），非 deep-research skill |
| 6 | 計劃執行者 | 主對話 agent（本身即 Opus 4.8）直接綜合，不另開 workflow |

---

## 三、三階段架構

| 階段 | 機制 | 模型 | 產出 | gate |
|------|------|------|------|------|
| 1 研究 | Workflow #1 | Sonnet | SDD 最佳實踐報告（每條標來源 + 可信度） | 給 Miles 看來源可信度評比 → 確認 |
| 2 診斷 | Workflow #2 | Sonnet | 現況診斷報告（問題 + 證據 + 嚴重度 + 落差） | 給 Miles 看診斷 → 確認 |
| 3 計劃 | 主 agent | Opus 4.8 | 改善藍圖 | 寫成 doc → Miles 審 |

---

## 四、階段 1：研究 workflow 設計

### 四面向研究主題

1. 規格顆粒度與模組化：一份 spec 多大算過大、按什麼維度拆（capability / feature / 關注點）、拆後如何組織與交叉引用。
2. 一致性與防漂移：單一正本原則、跨 spec 與跨層（商業層↔規格層）引用、避免規格漂移（spec drift）與矛盾的機制。
3. 工作流程治理：變更提案→審查→實作→歸檔的流程設計、並行變更（active change）收斂、避免合併時漏改。
4. AI/LLM 輔助 SDD：以 agent/skill 管理規格的脈絡（context）管理、指令與協議精簡、降低遵從負擔以防漂移。

### fan-out 結構

- 4 個 Sonnet agent，各負責一面向：上網搜尋（WebSearch）→ 抓取重要來源（WebFetch）→ 抽取可行主張（claim）→ **為每個來源分級可信度**。
- 1 個 Sonnet agent 做對抗式查證：對各面向關鍵主張嘗試反駁 / 找反例 / 評估證據強度，標記「站得住 / 存疑 / 推翻」。
- 綜合：彙整為一份最佳實踐報告，每條實踐標來源 + 可信度 + 對 OpenSpec 的適用性。

### 來源可信度分級標準

- 高：官方文件、知名實踐者的一手論述、同行評審或廣泛採用的方法論。
- 中：個人部落格、論壇、單一案例分享但作者可辨識且有脈絡。
- 低：無法溯源、二手轉述、與其他來源衝突且無佐證。

### 產出 schema（每面向 agent）

```
{
  面向,
  practices: [
    { claim, evidence, sources: [{ url, title, credibility(high/med/low), reason }],
      applicability_to_openspec }
  ]
}
```

---

## 五、階段 2：診斷 workflow 設計

輸入：階段 1 的最佳實踐報告（作為診斷基準）。

### 四面向診斷（對應研究四面向）

1. 顆粒度診斷：讀 24 個 spec 的結構（section 分布、混入的關注點種類），量化大小，找出過大 / 混多關注點者，對照最佳實踐的顆粒度原則。
2. 一致性診斷：抽查 wiki（商業正本）↔ openspec（規格正本）雙層同步、跨 spec 引用、找矛盾 / 漏改證據（含 11 個 active change 是否並行改同一 spec）。
3. 工作流程診斷：讀 config.yaml + CLAUDE.md 路由 + 11 active change + 72 archive，診斷流程治理問題（active change 為何堆積、漏改如何發生）。
4. AI 輔助診斷：盤點 skill 生態，找過時 / 重複 / 負擔過重者。重點對象——
   - 前期規劃：erp-planning-pre-check、erp-spec（已停用殘留）、oq-manage、三視角 agent（senior-pm / ceo-reviewer / erp-consultant）、5 份協議（sequential-design-collaboration / multi-agent-discussion-protocol〔已標 deprecated-verify-only〕/ lightweight-review-mode / dispatch-prompt-template / senior-pm-write-mode）。
   - 後期稽核：doc-audit、vault-audit、vault-insight、misjudgement-record。

### 產出 schema（每面向 agent）

```
{
  面向,
  findings: [
    { problem, evidence(具體檔案/行數/卡名), severity(high/med/low),
      best_practice_gap, affected_scope }
  ]
}
```

---

## 六、階段 3：改善藍圖結構（最終 deliverable）

由主 agent（Opus 4.8）綜合研究 + 診斷產出：

- A. 現況問題總覽：從診斷彙整，按嚴重度排序。
- B. SDD 最佳實踐對照：從研究，含來源可信度，標明哪些適用於 OpenSpec。
- C. 改善藍圖（四面向）：
  - C1 規格顆粒度：拆解原則 + 哪些 spec 該拆 + 拆解維度建議。
  - C2 一致性防漂移：機制建議。
  - C3 工作流程治理：變更流程改善。
  - C4 skill 清整清單：前期規劃 + 後期稽核，每個 skill 標「砍 / 併 / 留 / 改」+ 理由。
- D. 排序的改善項清單：每項標「問題 / 動作 / 另走 change 或 plan 執行 / 優先度 / 相依性」。

---

## 七、gate 定義（每階段停的判準）

- gate 1（研究後）：Miles 確認最佳實踐報告的來源可信度可接受、面向涵蓋無誤，方進診斷。可要求補搜或剔除低可信來源。
- gate 2（診斷後）：Miles 確認診斷問題屬實、嚴重度判斷合理、無遺漏，方進計劃。可要求補查。
- gate 3（計劃後）：Miles 審改善藍圖，確認方向；之後各改善項各自走正規流程執行。

---

## 八、不在本次範圍（避免 scope 膨脹）

- 不實際拆任何 spec、不砍任何 skill、不改 config.yaml 與 CLAUDE.md：這些是藍圖批准後的後續執行。
- 不重做 Notion / Linear 發布流程。
- 不處理 Prototype 程式碼。
