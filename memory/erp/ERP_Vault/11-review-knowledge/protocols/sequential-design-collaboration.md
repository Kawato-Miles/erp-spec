---
type: meta
status: active
last-reviewed: 2026-05-26
---

# 序列式設計協作協議（Sequential Design Collaboration Protocol）

> 適用情境：CLAUDE.md § ERP 討論主動路由 中「規格撰寫 / 變更」「功能設計有傾向」類型討論，需要三 agent 共同為單一商業需求產出設計方案時。
> **過渡期定位**：取代 [[multi-agent-discussion-protocol]] 於 `/opsx:explore` 與 `/opsx:propose` 階段的呼叫；後者降為「最終驗收前審查」（`/opsx:verify` 前），不在新流程觸發。
> **單一 agent 審查**：見 [[lightweight-review-mode]]。

## 一、定位

### 為什麼需要新協議

現行 [[multi-agent-discussion-protocol]] 採「Round 1 平行 + Round 2-3 互審」模式。實務累積觀察：
- 三 agent 同步審查產出的回饋對最終決策實用性不足
- 需求無法收斂、輪次增加但無新 insight
- CEO 常出「製作效益不高」型否定意見，無法成為設計依據（已列入 [[ceo-review-pitfalls]] 但仍重複發生）

### 業界證據基礎

- LLM 平行協調死鎖率 25-95%、序列 0%（[DPBench 2026](https://arxiv.org/pdf/2602.13255)）
- [Anthropic Orchestrator-Subagent Pattern](https://blockchain.news/news/anthropic-multi-agent-coordination-patterns-framework)：PM 升格為編制者、子 agent 各司其職、單點匯報
- [Google Design Sprint Diverge-Converge](https://www.nngroup.com/articles/diverge-converge/)：先發散後收斂的二相法
- [CrewAI Reporter / Synthesizer Pattern](https://www.zenml.io/blog/crewai-vs-autogen)：多角色工作後由單一 agent 匯總給人類決策

### 與舊協議的設計差異

| 項目 | 舊（multi-agent-discussion）| 新（sequential-design-collaboration）|
|------|---------------------------|------------------------------------|
| 啟動模式 | Round 1 平行 | Phase 1-4 線性序列 |
| Agent 互審 | Round 2+ 每輪互審 | 副任務「對上游 challenge」（可空）|
| 收斂主體 | Claude 判斷收斂 | PM 在 Phase 4 收斂 |
| 對使用者匯報 | Claude 彙整 | PM 匯報，含「砍掉的功能清單」 |
| 輪次上限 | 最少 2 輪、最多 3 輪 | 第一輪 Phase 1→4 + 最多單次回流 |
| 商業需求變動性 | 允許討論中修正需求 | **MUST NOT** 變動 Miles 提出的商業需求 |

---

## 二、核心紀律（不可違反的四項）

| 紀律 | 適用對象 | 違反後果 |
|------|---------|---------|
| **MUST NOT** 否定 Miles 提出的商業需求 | PM / CEO / 顧問 | 需求是輸入不是設計題目，否定屬越權 |
| **MUST NOT** 提「製作效益不高」這類否定 | CEO（主要）、顧問 | 不具設計依據、無法轉化為調整方向，屬已知誤審 pattern |
| PM 在 Phase 4 **MUST** 列「砍掉的功能清單」 | PM | 過濾決策必須透明，Miles 可追溯 |
| PM 在 Phase 4 **MUST** 對每個 challenge 逐條回應 | PM | 避免 PM 隱性過濾、下游 agent 工具人化 |

這四項在每個 Phase agent 提示中**強制重述**，不可省略。

---

## 三、4-Phase 流程

### 觸發

Claude 協調者依 CLAUDE.md § ERP 討論主動路由 識別到本次討論為「規格撰寫 / 變更」或「結構性變更 / 商業邏輯」類型，且尚未進入 `/opsx:verify`，啟動本協議。

協調者呼叫方傳入的 prompt **MUST** 標記 `[PROTOCOL: SEQUENTIAL]`，並指明本次協議的 Phase 編號（1 / 2 / 3 / 4 / 2.5）。

### Phase 1：PM 釐清商業需求範疇（[senior-pm](../../../../../.claude/agents/senior-pm.md)）

**輸入**：
- Miles 提出的商業需求原話
- 對應 Vault 業務卡（依議題從 `01-products/erp/`、`04-business-logic/`、`03-roles/` 載入）
- 既有 OQ 中與本議題相關者

**主任務**：
- 釐清需求範圍（業務動作 / 影響角色 / 例外情境）
- 標記隱含假設（PM 推測但 Miles 未明說的部分）
- **MUST NOT** 變動 Miles 的商業需求；僅可補完邊界、列假設

**輸出格式**：見 [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § 序列協作 Phase 1 格式

### Phase 2：CEO 提觀測指標 + 反向挑戰（[ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md)）

**輸入**：
- Phase 1 PM 輸出全文

**主任務**：提出觀測指標
- 對照 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)
- 區分 NSM / 營運指標 / 模組級 KPI 三層
- 指標 **MUST** 可量化（避免偽指標，依 [[ceo-review-framework]] § 6）

**副任務（challenge 區塊，可空）**：對 PM 範疇提反向挑戰
- 允許：「需求隱含假設 X 與現場操作衝突，建議補強」
- 允許：「需求覆蓋角色 Y 未明列，建議納入」
- **MUST NOT** 提「製作效益不高」「ROI 太低不值得做」類否定
- **MUST NOT** 否定 Miles 已明說的商業需求

**輸出格式**：見 [ceo-reviewer.md](../../../../../.claude/agents/ceo-reviewer.md) § 序列協作 Phase 2 格式

### Phase 3：顧問規劃實作方案 + 反向挑戰（[erp-consultant](../../../../../.claude/agents/erp-consultant.md)）

**輸入**：
- Phase 1 PM 輸出 + Phase 2 CEO 輸出

**主任務**：實作設計
- 對照 5 設計模式（[[erp-design-patterns]]）
- 對照狀態機 spec / 業務流程 spec / 既有實體 spec
- 輸出實體變更 / 流程節點 / 狀態機 / 角色責任五層

**副任務（challenge 區塊，可空）**：對上游提反向挑戰
- 允許：「CEO 指標 X 無法被實作測量，建議改為 Y」
- 允許：「PM 範疇與既有狀態機衝突，建議補例外情境」

**衝突解法**：
- 若 CEO 指標無法量測 → 標記「需 CEO 重評指標 X」觸發 **Phase 2.5 回流**（最多一次）
- 若 PM 範疇須調整 → 寫進 challenge 區塊由 PM 在 Phase 4 處理

**輸出格式**：見 [erp-consultant.md](../../../../../.claude/agents/erp-consultant.md) § 序列協作 Phase 3 格式

### Phase 2.5：CEO 補強指標（回流，可選且最多一次）

**觸發**：Phase 3 顧問輸出標記「需 CEO 重評指標 X」

**輸入**：Phase 1 PM 輸出 + Phase 2 CEO 原輸出 + Phase 3 顧問的回流請求

**任務**：僅針對顧問提出的具體指標重新評估，提替代方案或保留並說明可量測路徑

**完成後**：回到 Phase 3 由顧問據此修訂實作方案，再進 Phase 4

**輪次上限**：整個流程**僅允許一次回流**。第二次出現「需 CEO 重評」訊號時，協調者 **MUST** 強制進 Phase 4，將該爭議列入 PM 的「未解爭議」由 Miles 裁決。

### Phase 4：PM 收斂為整體設計方案（[senior-pm](../../../../../.claude/agents/senior-pm.md) 匯報模式）

**輸入**：Phase 1 / 2 / 3（含可能的 2.5）全部輸出

**必填輸出**：
1. **商業需求對齊檢核**：對照 Miles 原始需求逐條檢查設計是否滿足，未滿足者 **MUST** 明確說明
2. **採納清單**：採納的 CEO 指標 + 採納的顧問實作方案
3. **砍掉的功能清單**：哪些被砍 / 為什麼砍 / 砍掉後如何補（OQ / 後續 change / 不做）
4. **逐條回應 challenge**：對 CEO / 顧問每個 challenge 標記「採納 / 部分採納 / 駁回」+ 具體理由
   - 駁回時 **MUST NOT** 用「效益不高」這類措辭，**MUST** 引用商業需求 / 範疇 / 衝突的具體依據
5. **未解爭議自動觸發 [[oq-manage]] mode B**：開 OQ 讓 Miles 決策

**「未滿足商業需求」的處理（PM 自決）**：

PM 自行判斷以下兩條路徑擇一執行，並在輸出明示選了哪條與理由：
- **路徑 A：駁回顧問方案，請協調者重跑 Phase 3**（僅限「實作層可調整就能滿足」的情況）
- **路徑 B：寫成 OQ 交 Miles 裁決**（「結構性衝突 / 需求本身須 Miles 拍板」的情況）

**輸出格式**：見 [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § 序列協作 Phase 4 格式

---

## 四、終止條件與輪次上限

| 條件 | 處置 |
|------|------|
| 第一輪 Phase 1→4 完成、無回流 | 正常結束，PM 匯報給 Miles |
| Phase 3 觸發 Phase 2.5 回流（第一次）| 跑完 Phase 2.5 → 3 → 4 後結束 |
| Phase 3 試圖觸發第二次回流 | 強制跳 Phase 4，將爭議列入 PM「未解爭議」 |
| 任一 Phase 出現「需變動 Miles 商業需求」訊號 | 協調者 **MUST** 中止流程，回到 Miles 確認需求 |

**總輪次上限**：第一輪 Phase 1→4 + 最多單次 Phase 2.5 回流。

---

## 五、Challenge 區塊規則（CEO 與顧問副任務）

### 觸發門檻

「**永遠允許但可空**」：每個 Phase 的 agent **MUST** 輸出 challenge 區塊（區塊本身強制存在），但內容可為空。為空時 **MUST** 寫「無 challenge」而非省略區塊。

### 允許內容

| 類型 | 範例 |
|------|------|
| 上游誤讀業務情境 | 「PM Phase 1 假設『所有業務都會用稿件審核』，但客服業務不會」|
| 上游遺漏角色 / 例外路徑 | 「需求覆蓋業務、印務，但漏掉品檢角色的責任」|
| 上游決策與既有設計衝突 | 「CEO 指標 X 需在狀態機新增節點才能測量，與既有狀態機衝突」|
| 上游表達不明確 | 「PM 範疇『支援批次處理』未定義批次大小上限」|

### 禁止內容

| 類型 | 為何禁止 |
|------|---------|
| 「製作效益不高 / ROI 太低」 | 屬否定設計題目本身、不是調整方向 |
| 「Miles 的需求應該改為 Y」 | 違反「不可變動商業需求」紀律 |
| 「整個設計方向錯誤但說不出具體問題」 | 抽象評論無法處理 |
| 「我同意」「沒問題」（非空但無內容）| 等於空 challenge，請寫「無 challenge」|

### PM 在 Phase 4 對 challenge 的處理

PM **MUST** 對每個 challenge（包含 CEO 的副任務 + 顧問的副任務）標記：

- **採納**：寫進設計方案，並在「採納清單」列出
- **部分採納**：說明採納部分與駁回部分，駁回理由 **MUST** 具體
- **駁回**：理由 **MUST** 引用商業需求 / 範疇 / 衝突的具體依據，**MUST NOT** 用「效益不高」措辭

---

## 六、與 OpenSpec opsx 工作流整合

### 過渡期雙軌（本期實作）

| opsx 階段 | 觸發協議 | 取代 / 並存 |
|----------|---------|------------|
| `/opsx:explore` | 啟動本協議 Phase 1（單 PM）| 取代 senior-pm 單獨呼叫 |
| `/opsx:propose` § Why/Background | 啟動完整 Phase 1-4 | 取代 [[multi-agent-discussion-protocol]] |
| `/opsx:continue` 過程 | 視議題範圍依 [[lightweight-review-mode]] 或本協議 | 並存 |
| `/opsx:verify` 前 | 啟動 [[multi-agent-discussion-protocol]] | **保留作為最終驗收前審查** |
| `/opsx:archive` 前 | 不啟動本協議，執行 `doc-audit` skill | 不變 |

### 後續淘汰路徑（不在本期）

1. 累積 3-5 個 change 使用新協議的結果
2. 比對誤審記錄（[[review-loading-checklist]] § 四 + `11-review-knowledge/_shared/` 誤審案例）確認新協議降低誤審
3. 確認穩定後：
   - [[multi-agent-discussion-protocol]] 標註 deprecated
   - 三個 agent.md 移除「輪次討論模式」段
   - 改寫 [[lightweight-review-mode]] 為「序列協作前的快速判斷」入口

---

## 七、執行流程（協調者觀點）

```
Claude 協調者識別需啟動本協議
        ↓
┌─────────────────────────────────────────┐
│ Phase 1：呼叫 senior-pm                  │
│  prompt 含 [PROTOCOL: SEQUENTIAL] +      │
│           [PHASE: 1] + Miles 需求原話     │
└─────────────────────────────────────────┘
        ↓ 收到 Phase 1 輸出
┌─────────────────────────────────────────┐
│ Phase 2：呼叫 ceo-reviewer               │
│  prompt 含 [PROTOCOL: SEQUENTIAL] +      │
│           [PHASE: 2] + Phase 1 全文       │
└─────────────────────────────────────────┘
        ↓ 收到 Phase 2 輸出
┌─────────────────────────────────────────┐
│ Phase 3：呼叫 erp-consultant             │
│  prompt 含 [PROTOCOL: SEQUENTIAL] +      │
│           [PHASE: 3] + Phase 1+2 全文     │
└─────────────────────────────────────────┘
        ↓ 檢查 Phase 3 是否標記「需回流 CEO」
   ┌────┴────┐
   │ 是      │ 否
   ↓         ↓
Phase 2.5  Phase 4
（單次）     ↓
   ↓        呼叫 senior-pm
Phase 3     prompt 含 [PROTOCOL: SEQUENTIAL] +
（修訂）            [PHASE: 4] +
   ↓               Phase 1+2(+2.5)+3 全文
Phase 4     ↓
   ↓        收到 PM 匯報（整體設計方案）
   匯報      ↓
        交 Miles 決策 → opsx:propose 接續
```

### 協調者規則

- 各 Phase 呼叫時 **MUST** 在 prompt 中明確標記 `[PROTOCOL: SEQUENTIAL]` + `[PHASE: N]`
- 各 Phase 完整輸出 **MUST** 完整傳遞給下一 Phase，**MUST NOT** 由協調者再做彙整
- 協調者 **MUST NOT** 自行對 agent 輸出做合併、刪減、彙整；唯一 reporter 是 Phase 4 的 PM
- Phase 2.5 觸發判斷：Phase 3 輸出含明確「需 CEO 重評指標 X」訊號 → 啟動；其他類型 challenge 留給 Phase 4 PM 處理

---

## 八、Phase 4 PM 寫入路徑

Phase 4 完成後若需把設計方案寫進 OpenSpec change 或 Notion，沿用 [[senior-pm-write-mode]]：

- 一般情況：協調者依 PM 輸出觸發 Mode B Phase 1（PLAN）
- Miles 確認後協調者觸發 Mode B Phase 2（EXECUTE | plan）

未解爭議 OQ 由協調者觸發 `oq-manage` mode B（不歸 senior-pm-write-mode）。

---

## 九、行為規範（總結）

- 流程**MUST 序列**（Phase 1 → 2 → 3 → 4），**MUST NOT** 平行啟動三 agent
- 每個 agent 的 challenge 區塊**強制存在**，內容可空但區塊不可省略
- Phase 4 PM 的「砍掉清單」與「逐條回應」皆**強制必填**
- 任何 Phase 試圖變動 Miles 商業需求時，協調者 **MUST** 中止流程
- 違反「禁止項」（效益不高否定 / 否定商業需求）的輸出，協調者 **MUST** 退回 agent 重新輸出
- 整個流程過程對 Miles 不可見，僅 Phase 4 PM 匯報呈現

---

## 十、相關卡

- [[multi-agent-discussion-protocol]] — 舊版三視角輪次討論（過渡期保留為驗收前審查）
- [[lightweight-review-mode]] — 單 agent 輕量審查
- [[senior-pm-write-mode]] — Senior PM 寫入流程（Mode A / B）
- [[review-loading-checklist]] — 各 Agent 背景載入範圍 + 設計理解摘要紀律
- [[insight-discipline]] — Insight 不是讚美 / 必附 URL / 必附解法
- [[ceo-review-pitfalls]] — CEO 已知誤區（含「效益不高」否定的禁止依據）
- [[erp-design-patterns]] — Phase 3 顧問 5 設計模式對照基準
- CLAUDE.md § ERP 討論主動路由 — 觸發路由主表
