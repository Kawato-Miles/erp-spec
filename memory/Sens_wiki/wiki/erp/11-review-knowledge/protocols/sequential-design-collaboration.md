---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-30
---

# 序列式設計協作協議（Sequential Design Collaboration Protocol）

> 適用情境：CLAUDE.md § ERP 討論主動路由 中「規格撰寫 / 變更」「功能設計有傾向」類型討論，需要三 agent 共同為單一商業需求產出設計方案時。
> **定位**：`/opsx:explore` 與 `/opsx:propose` 階段的設計協作主協議；`/opsx:verify` 前不另啟動審查，由 Phase 4 verify consistency 涵蓋（舊三視角輪次協議已於 2026-07-06 除役）。
> **單一 agent 審查**：見 [[lightweight-review-mode]]。
> **2026-05-28 大改**：Phase 2/3 改 PM-中介來回（上限 2 次）、Phase 2.5 廢除、Phase 4 加 verify consistency。CEO / ERP 顧問角色定位變更（見 § 二之一）。

## 一、定位

### 為什麼需要本協議

舊三視角輪次討論協議（2026-07-06 除役）採「Round 1 平行 + Round 2-3 互審」模式。實務累積觀察：
- 三 agent 同步審查產出的回饋對最終決策實用性不足
- 需求無法收斂、輪次增加但無新 insight
- CEO 常出「製作效益不高」型否定意見，無法成為設計依據（已列入 [[ceo-review-pitfalls]] 但仍重複發生）

### 業界證據基礎

- LLM 平行協調死鎖率 25-95%、序列 0%（DPBench 2026）
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)：Orchestrator-Subagent Pattern，Lead Opus + Worker Sonnet 比 Single Opus 強 90.2%
- [Anthropic Agent Teams 官方文件](https://code.claude.com/docs/en/agent-teams)：Sub-agent 與 Agent Team 差異對照（本協議採 sub-agent 模式，含 PM 單一收斂點）
- Google Design Sprint Diverge-Converge：先發散後收斂的二相法
- CrewAI Reporter / Synthesizer Pattern：多角色工作後由單一 agent 匯總給人類決策

### 與舊協議的設計差異

| 項目 | 舊（multi-agent-discussion）| 新（sequential-design-collaboration）|
|------|---------------------------|------------------------------------|
| 啟動模式 | Round 1 平行 | PM 中介之線性序列（Phase 2/3 PM-相關方來回）|
| Agent 互審 | Round 2+ 每輪互審 | PM 中介來回，無 agent 互審 |
| CEO 角色 | 審查者 | 管理層需求提出方 |
| ERP 顧問角色 | 審查者 | 統合需求設計者 |
| 收斂主體 | Claude 判斷收斂 | PM 在 Phase 4 收斂 |
| 對使用者匯報 | Claude 彙整 | PM 匯報，含「砍掉的功能清單」 |
| 輪次上限 | 最少 2 輪、最多 3 輪 | Phase 2 ≤ 2 輪 + Phase 3 ≤ 2 輪 |
| 跨視角衝突處理 | Round 2 跨視角質疑 | Phase 4 PM verify consistency 集中處理 |
| 商業需求變動性 | 允許討論中修正需求 | **MUST NOT** 變動 Miles 提出的商業需求 |

---

## 二、核心紀律（不可違反的五項）

| 紀律 | 適用對象 | 違反後果 |
|------|---------|---------|
| **MUST NOT** 否定 Miles 提出的商業需求 | PM / CEO / 顧問 | 需求是輸入不是設計題目，否定屬越權 |
| **MUST NOT** 提「製作效益不高」這類否定 | CEO（主要）、顧問 | 不具設計依據、無法轉化為調整方向，屬已知誤審 pattern |
| PM 在 Phase 4 **MUST** 列「砍掉的功能清單」 | PM | 過濾決策必須透明，Miles 可追溯 |
| PM 在 Phase 4 **MUST** 對每個 challenge 逐條回應 | PM | 避免 PM 隱性過濾、下游 agent 工具人化 |
| PM 在 Phase 4 **MUST** 輸出 verify consistency 三張對照表 | PM | 集中處理跨 agent 不一致 + 既有規則全覆蓋分類，取代舊協議 Round 2 跨視角質疑 |

這五項在每個 Phase agent 提示中**強制重述**（依 [[dispatch-prompt-template]] § 4 key rules 區塊），不可省略。

## 二之一、角色定位變更（2026-05-28 新增）

新模型下三個 agent 在 sequential 協議中的角色重新定位（**不影響** [[lightweight-review-mode]] 中的審查者角色）：

| Agent | 舊定位（lightweight 審查者）| 新定位（sequential）|
|-------|-------------------------------|-------------------|
| senior-pm | 審查者 + 收斂者 | 中介者 + 收斂者 |
| ceo-reviewer | 審查者 | 管理層需求提出方 |
| erp-consultant | 審查者 | 統合需求設計者 |

**含意**：
- CEO 在 sequential Phase 2 不是「審查 PM 範疇」，而是「從管理層視角補需求 / KPI」。CEO 補的需求 MUST 標明「管理層補需求」（非改 Miles 原需求）
- ERP 顧問在 sequential Phase 3 不是「審查設計」，而是「依 PM + CEO 統合需求做設計」
- PM 在 sequential Phase 2/3 是中介者：傳遞、評估、判斷是否啟動第 2 輪、修正範圍

三 agent 的 6 / 5 維度框架（[[pm-review-framework]] / [[ceo-review-framework]] / [[erp-review-framework]]）在本協議中作為「**思考維度**」使用（思考要補什麼 / 設計什麼），不是「審查維度」。詳見各 framework 卡 § 一適用時機。

---

## 三、4-Phase 流程

### 觸發

Claude 協調者依 CLAUDE.md § ERP 討論主動路由 識別到本次討論為「規格撰寫 / 變更」或「結構性變更 / 商業邏輯」類型，且尚未進入 `/opsx:verify`，啟動本協議。

協調者呼叫各 Phase agent 時，prompt **MUST** 依 [[dispatch-prompt-template]] 5 區塊組裝，含 `[PROTOCOL: SEQUENTIAL]` + `[PHASE: N]` + `[ROUND: M]` 標記。

### Phase 1：PM 釐清商業需求範疇（senior-pm）

**輸入**：
- Miles 提出的商業需求原話
- 對應 Vault 業務卡（依議題從 `01-products/`、`04-business-logic/`、`03-roles/` 載入）
- 既有 OQ 中與本議題相關者

**PM 主任務**：
- 釐清需求範圍（業務動作 / 影響角色 / 例外情境）
- 標記隱含假設（PM 推測但 Miles 未明說的部分）
- **MUST NOT** 變動 Miles 的商業需求；僅可補完邊界、列假設

**輸出格式**：見 [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § 序列協作 Phase 1 格式

### Phase 2：PM ↔ CEO 補管理層需求（上限 2 次來回）

#### Phase 2 第 1 輪（必跑）

**輸入**：Phase 1 PM 輸出全文

**CEO 主任務**：依 [[ceo-review-framework]] 6 維度作為**思考維度**，**從管理層視角補需求**
- 對照 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)
- 區分 NSM / 營運指標 / 模組級 KPI 三層
- 指標 **MUST** 可量化、附資料來源 / 公式 / 值域（避免偽指標，依 [[ceo-review-framework]] § 6）
- 補的需求 **MUST** 標明「管理層補需求」（非改 Miles 原需求）

**CEO 紀律**：
- **MUST NOT** 提「製作效益不高」「ROI 太低不值得做」類否定
- **MUST NOT** 否定 Miles 已明說的商業需求
- 對 PM Phase 1 範疇若有 challenge，在 challenge 區塊註明（無需另起回流）

**PM 收到 CEO 第 1 輪輸出後評估**：
- 依「PM 第 2 輪 MUST 啟動 3 條 + 自判紀律」（見下）判斷是否啟動第 2 輪
- 若不啟動 → 寫「Phase 2 收斂於第 1 輪」+ 「PM + CEO 統合需求」摘要進入 Phase 3
- 若啟動 → 進 Phase 2 第 2 輪

#### Phase 2 第 2 輪（PM 自判啟動）

**PM 第 2 輪 MUST 啟動的 3 條**（任一條觸發即 MUST 啟動）：
1. 下游輸出遺漏主要需求項
2. 下游輸出與 Miles 原需求不一致
3. 跨模組衝突未被識別

**其他情況 PM 可自判啟動或收斂**，但啟動時 **MUST** 透明列：
- 「為何啟動第 2 輪」
- 「預期收到的修正方向」

**第 2 輪輸入**：Phase 1 PM 輸出 + CEO 第 1 輪輸出 + PM 給的修正範圍

**CEO 第 2 輪任務**：依 PM 修正範圍補 / 修正管理需求（沿用 CEO 第 1 輪紀律）

**PM 收第 2 輪輸出後**：MUST 統合需求收斂，**不再啟動第 3 輪**（強制進 Phase 3）

#### Phase 2 產出

「PM + CEO 統合需求」進 Phase 3。

**輸出格式**：見 [ceo-reviewer.md](../../../../../.claude/agents/ceo-reviewer.md) § 序列協作 Phase 2 格式 + [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § Phase 2 PM-中介者格式

### Phase 3：PM ↔ ERP 顧問設計（上限 2 次來回）

#### Phase 3 第 1 輪（必跑）

**輸入**：Phase 1 PM 輸出 + Phase 2 統合需求（含可能的第 2 輪）

**ERP 顧問主任務**：依 [[erp-review-framework]] 6 維度 + [[erp-design-patterns]] 5 設計模式作為**思考維度**，**依統合需求做設計**
- 對照狀態機（wiki `06-state-machines/` 各狀態機卡 + 各模組 spec 內嵌狀態機 Requirement） / wiki `04-business-logic/`（商業流程正本）/ 既有實體 spec
- 輸出實體變更 / 流程節點 / 狀態機 / 角色責任四層
- **列出所有受影響的既有 Requirement / 規則（跨 wiki ERP_Vault + openspec specs 雙層）**：逐條標 ADDED / MODIFIED / REMOVED + 理由；supersession（取代既有 Requirement / Scenario）**MUST** 標 MODIFIED 不可 ADDED（archive sync 按 exact-title 只增不刪，ADDED 取代會導致主 spec 新舊並存矛盾）

**顧問紀律**：
- **MUST NOT** 否定 Miles 商業需求
- **MUST NOT** 否定 CEO 補的管理需求（除非與 Miles 商業需求衝突，此時在 challenge 區塊標註）
- challenge 區塊若發現「CEO 指標 X 無法被實作測量」**MUST** 明示給 PM（取代舊 Phase 2.5 回流機制）
- 改名 / 新術語建議 **MUST** 過 [[erp-naming-rules]] 5 秒測試

**PM 收到顧問第 1 輪輸出後評估**：
- 依「PM 第 2 輪 MUST 啟動 3 條」判斷是否啟動第 2 輪
- 若顧問 challenge「指標無法量測」→ PM 在第 2 輪統合需求修正時 **MUST** 帶回 CEO 補強指標 + 修正後再給顧問（此情況屬第 2 輪 MUST 啟動條件第 3 條「跨模組衝突未被識別」之延伸）
- 若不啟動 → 寫「Phase 3 收斂於第 1 輪」進 Phase 4
- 若啟動 → 進 Phase 3 第 2 輪

#### Phase 3 第 2 輪（PM 自判啟動）

啟動條件同 Phase 2 第 2 輪（3 條 MUST + 自判 + 透明列理由與預期方向）。

**第 2 輪輸入**：Phase 1 + Phase 2 + 顧問第 1 輪 + PM 給的修正範圍（含可能的 CEO 指標補強內容）

**顧問第 2 輪任務**：依 PM 修正範圍修正設計（沿用 Phase 3 第 1 輪紀律）

**PM 收第 2 輪輸出後**：MUST 收斂進 Phase 4，**不再啟動第 3 輪**

#### Phase 3 產出

「整體設計方案」進 Phase 4。

**輸出格式**：見 [erp-consultant.md](../../../../../.claude/agents/erp-consultant.md) § 序列協作 Phase 3 格式 + [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § Phase 3 PM-中介者格式

### Phase 4：PM 集中收斂匯報 Miles（senior-pm 匯報模式）

**輸入**：Phase 1 / 2 / 3 全部輸出（含可能的第 2 輪）

**必填輸出**（六段，缺一不可）：

1. **商業需求對齊檢核**：對照 Miles 原始需求逐條檢查設計是否滿足，未滿足者 **MUST** 明確說明
2. **採納清單**：採納的 CEO 管理需求 + 採納的顧問實作方案
3. **砍掉的功能清單**（紀律 3）：哪些被砍 / 為什麼砍 / 砍掉後如何補（OQ / 後續 change / 不做）
   - 砍掉理由 **MUST NOT** 用「效益不高」「ROI 低」等措辭
4. **逐條回應 challenge**（紀律 4）：對 CEO / 顧問每個 challenge 標記「採納 / 部分採納 / 駁回」+ 具體理由
   - 駁回 **MUST NOT** 用「效益不高」措辭，**MUST** 引用商業需求 / 範疇 / 衝突的具體依據
5. **verify consistency 區塊**（紀律 5，2026-05-28 新增；2026-05-30 擴為三張表）：
   - CEO 指標 ↔ 顧問實作對齊表
   - PM 範疇 ↔ 顧問實作對齊表
   - **既有規則（wiki + openspec）↔ 本次設計 覆蓋 / 分類對照表**（2026-05-30 新增，欄位：既有規則出處（ERP_Vault 卡 / openspec spec Requirement）/ 本次處理方式 / delta op（ADDED / MODIFIED / REMOVED）/ 是否已對齊 wiki 正本）
   - 即使全部對齊（無不一致），三張表 **MUST** 列出
   - 不對齊項 **MUST** 標明處置（如「指標 X 未被實作覆蓋 → 開 OQ」）
   - 第三張表 supersession 列 **MUST** 標 MODIFIED（不可 ADDED）；任一既有規則「未對齊 wiki 正本」**MUST** 標處置（archive 後回補 wiki 商業邏輯卡）
6. **未解爭議 → OQ**：擬觸發 `oq-manage` mode B 開立的 OQ 清單

**「未滿足商業需求」的處理**（PM 自決，選 A 或 B 並在輸出明示選了哪條與理由）：
- **路徑 A**：駁回顧問方案，請協調者重跑 Phase 3（僅限「實作層可調整就能滿足」）
- **路徑 B**：寫成 OQ 交 Miles 裁決（「結構性衝突 / 需求本身須 Miles 拍板」）

**輸出格式**：見 [senior-pm.md](../../../../../.claude/agents/senior-pm.md) § 序列協作 Phase 4 格式

---

## 四、終止條件與輪次上限

| 條件 | 處置 |
|------|------|
| Phase 2 第 1 輪 PM 判定收斂 | 直接進 Phase 3 |
| Phase 2 第 2 輪結束 | 強制進 Phase 3，不可再來 |
| Phase 3 第 1 輪 PM 判定收斂 | 直接進 Phase 4 |
| Phase 3 第 2 輪結束 | 強制進 Phase 4，不可再來 |
| 任一 Phase 出現「需變動 Miles 商業需求」訊號 | 協調者 **MUST** 中止流程，回到 Miles 確認需求 |

**總輪次上限**：Phase 2 ≤ 2 + Phase 3 ≤ 2。

**Phase 2.5 廢除（2026-05-28）**：顧問發現 CEO 指標無法量測時，改在 Phase 3 第 1 輪 challenge 區塊明示，PM 在 Phase 3 第 2 輪統合需求修正時帶回 CEO。

---

## 五、Challenge 區塊規則（CEO 與顧問必填）

### 觸發門檻

CEO 與顧問的輸出 **MUST** 包含 challenge 區塊（區塊本身強制存在），內容可空。為空時 **MUST** 寫「無 challenge」而非省略區塊。

### 允許內容

| 類型 | 範例 |
|------|------|
| 上游遺漏角色 / 例外路徑 | 「PM Phase 1 範疇覆蓋業務、印務，但漏掉品檢角色的責任」|
| 上游決策與既有設計衝突 | 「CEO 補的指標 X 需在狀態機新增節點才能測量，與既有狀態機衝突」|
| 上游表達不明確 | 「PM 範疇『支援批次處理』未定義批次大小上限」|
| 顧問專屬：CEO 指標無法量測 | 「CEO 指標 Y 在資料模型中無對應實體可測量」→ PM 在第 2 輪帶回 CEO 補強 |

### 禁止內容

| 類型 | 為何禁止 |
|------|---------|
| 「製作效益不高 / ROI 太低」 | 屬否定設計題目本身、不是調整方向 |
| 「Miles 的需求應該改為 Y」 | 違反「不可變動商業需求」紀律 |
| 「CEO 補的管理需求應該砍掉」 | CEO 已是需求提出方，需求是否採納由 PM 在 Phase 4 集中處理 |
| 「整個設計方向錯誤但說不出具體問題」 | 抽象評論無法處理 |
| 「我同意」「沒問題」（非空但無內容）| 等於空 challenge，請寫「無 challenge」|

### PM 在 Phase 4 對 challenge 的處理

PM **MUST** 對每個 challenge（CEO + 顧問所有輪次）標記：採納 / 部分採納 / 駁回 + 具體理由。駁回 **MUST NOT** 用「效益不高」措辭。

---

## 六、與 OpenSpec opsx 工作流整合

| opsx 階段 | 觸發協議 |
|----------|---------|
| `/opsx:explore` | 啟動本協議 Phase 1（單 PM）|
| `/opsx:propose` § Why/Background | 啟動完整 Phase 1-4 |
| `/opsx:continue` 過程 | 視議題範圍依 [[lightweight-review-mode]] 或本協議 |
| `/opsx:verify` 前 | 不另啟動審查，由本協議 Phase 4 verify consistency 涵蓋 |
| `/opsx:archive` 前 | 不啟動本協議，執行 `vault-audit` skill |

---

## 七、執行流程（協調者觀點）

```
Claude 協調者識別需啟動本協議
        ↓
┌────────────────────────────────────────────┐
│ Phase 1：呼叫 senior-pm                     │
│   依 [[dispatch-prompt-template]] 5 區塊組裝│
│   標記 [PHASE: 1][ROUND: 1]                │
└────────────────────────────────────────────┘
        ↓ 收到 Phase 1 輸出
┌────────────────────────────────────────────┐
│ Phase 2 第 1 輪：呼叫 ceo-reviewer          │
│   標記 [PHASE: 2][ROUND: 1]                │
└────────────────────────────────────────────┘
        ↓ 收到 CEO 第 1 輪
   呼叫 senior-pm 評估（PM 中介者格式）
        ↓
   PM 判斷是否啟動 Phase 2 第 2 輪
   ┌────┴────┐
   │ 是      │ 否
   ↓         ↓
Phase 2    Phase 3 第 1 輪
第 2 輪
   ↓
   呼叫 senior-pm 統合
        ↓
┌────────────────────────────────────────────┐
│ Phase 3 第 1 輪：呼叫 erp-consultant        │
│   標記 [PHASE: 3][ROUND: 1]                │
└────────────────────────────────────────────┘
        ↓ 收到顧問第 1 輪（含 challenge 區塊）
   呼叫 senior-pm 評估（PM 中介者格式）
        ↓
   PM 判斷（含「指標無法量測 → 帶回 CEO」邏輯）
   ┌────┴────┐
   │ 是      │ 否
   ↓         ↓
Phase 3    Phase 4
第 2 輪
   ↓
   呼叫 senior-pm 統合
        ↓
┌────────────────────────────────────────────┐
│ Phase 4：呼叫 senior-pm（收斂匯報模式）     │
│   標記 [PHASE: 4]                          │
│   輸出六段：對齊檢核 / 採納 / 砍掉 /        │
│            逐條回應 / verify consistency /  │
│            未解爭議                         │
└────────────────────────────────────────────┘
        ↓
   交 Miles 決策 → opsx:propose 接續
```

### 協調者規則

- 各 Phase 呼叫時 **MUST** 依 [[dispatch-prompt-template]] 組裝 prompt
- 各 Phase 完整輸出 **MUST** 完整傳遞給下一 Phase，**MUST NOT** 由協調者再做彙整
- 協調者 **MUST NOT** 自行對 agent 輸出做合併、刪減、彙整；唯一 reporter 是 Phase 4 的 PM
- Phase 2/3 第 2 輪啟動由 PM 判斷，協調者依 PM 輸出決定下一步
- 「指標無法量測」訊號處置：協調者 MUST 把顧問 challenge 完整傳給 PM；PM 在 Phase 3 第 2 輪 dispatch 中 MUST 帶回 CEO 補強指標 + 修正範圍

---

## 八、Phase 4 PM 寫入路徑

Phase 4 完成後若需把設計方案寫進 OpenSpec change 或 Notion，沿用 [[senior-pm-write-mode]]：

- 一般情況：協調者依 PM 輸出觸發 Mode B Phase 1（PLAN）
- Miles 確認後協調者觸發 Mode B Phase 2（EXECUTE | plan）

未解爭議 OQ 由協調者觸發 `oq-manage` mode B（不歸 senior-pm-write-mode）。

---

## 九、行為規範（總結）

- 流程**MUST 序列**（Phase 1 → 2 → 3 → 4），**MUST NOT** 平行啟動三 agent
- CEO 與顧問 challenge 區塊**強制存在**，內容可空但區塊不可省略
- Phase 4 PM 的六段輸出（對齊檢核 / 採納 / 砍掉 / 逐條回應 / verify consistency / 未解爭議）**強制必填**
- 任何 Phase 試圖變動 Miles 商業需求時，協調者 **MUST** 中止流程
- 違反「禁止項」（效益不高否定 / 否定商業需求）的輸出，協調者 **MUST** 退回 agent 重新輸出
- 整個流程過程對 Miles 不可見，僅 Phase 4 PM 匯報呈現
- Phase 2/3 第 2 輪 PM 啟動 MUST 透明列「為何啟動」+「預期修正方向」

---

## 十、相關卡

- [[dispatch-prompt-template]] — Phase 呼叫 prompt 5 區塊標準
- [[lightweight-review-mode]] — 單 agent 輕量審查
- [[senior-pm-write-mode]] — Senior PM 寫入流程（Mode A / B）
- [[review-loading-checklist]] — 各 Agent 背景載入範圍 + 設計理解摘要紀律
- [[insight-discipline]] — Insight 不是讚美 / 必附 URL / 必附解法
- [[ceo-review-pitfalls]] — CEO 已知誤區（含「效益不高」否定的禁止依據）
- [[ceo-review-framework]] — CEO 6 維度（審查維度 / 思考維度並列）
- [[erp-review-framework]] — ERP 顧問 6 維度（審查維度 / 思考維度並列）
- [[pm-review-framework]] — PM 5 維度（審查維度 / 思考維度並列）
- [[erp-design-patterns]] — Phase 3 顧問 5 設計模式對照基準
- [[erp-naming-rules]] — 改名 / 新術語建議的 5 秒測試
- CLAUDE.md § ERP 討論主動路由 — 觸發路由主表
