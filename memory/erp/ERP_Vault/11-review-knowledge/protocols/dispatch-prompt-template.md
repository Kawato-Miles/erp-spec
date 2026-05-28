---
type: meta
status: active
last-reviewed: 2026-05-28
---

# Dispatch Prompt Template — Sub-agent 呼叫 5 區塊標準

> Claude 協調者呼叫三個 sub-agent（senior-pm / ceo-reviewer / erp-consultant）時，prompt **MUST** 依本卡 5 區塊組裝，降低 lossy context hand-off 風險。
> **適用協議**：[[sequential-design-collaboration]] Phase 1-4 全部呼叫、[[multi-agent-discussion-protocol]] Round 1-N 呼叫（過渡期保留）、[[lightweight-review-mode]] 單 agent 呼叫。
> **業界依據**：Anthropic Multi-Agent Research System 強調「detailed task descriptions prevent duplicated work」；業界文獻明確指出「dispatch prompt 是 orchestrator-worker pattern 中最重要的 artifact」。

## 一、定位

### 為什麼需要本卡

過去呼叫 sub-agent 的 prompt 結構由協調者臨機組裝，導致：
- agent 重複載入 `_shared/` 5 卡 → token 浪費
- 前序 Phase 輸出傳遞不完整 → lossy context hand-off
- 紀律提醒散落在 agent.md，agent 看到的 dispatch prompt 沒重述 → 違反紀律機率升高
- 變動性質分級資訊未傳給 agent → agent 無法依風險強度調整審查深度

### 與其他協議的關係

- [[sequential-design-collaboration]]：本卡 § 3 範例覆蓋 Phase 1-4 全部 dispatch 場景
- [[multi-agent-discussion-protocol]]（過渡期）：Round 1-N 呼叫亦 MUST 依本卡組裝，僅標記從 `[PHASE]` 改為 `[ROUND]`
- [[lightweight-review-mode]]：單 agent 呼叫亦適用，標記用 `[MODE: LIGHTWEIGHT]`
- [[senior-pm-write-mode]]：本卡的 `[PROTOCOL][PHASE][ROUND]` 標記與 senior-pm-write-mode 的 `[MODE]` 標記**正交**，可疊加使用（如 Phase 4 PM 觸發寫入時兩標記並列）

---

## 二、5 區塊標準

### 區塊 1：呼叫標記（必填）

明示本次呼叫的協議、Phase、Round：

```
[PROTOCOL: SEQUENTIAL]
[PHASE: <1 | 2 | 3 | 4>]
[ROUND: <1 | 2>]
```

**變體**：
- 多 agent 討論（過渡期）：`[PROTOCOL: MULTI-AGENT]` + `[ROUND: <1 | 2 | 3>]`
- 單 agent 輕量：`[MODE: LIGHTWEIGHT]`
- 疊加寫入：上述任一 + `[MODE: PLAN]` 或 `[MODE: EXECUTE | plan]`

### 區塊 2：Read-first 清單（必填）

明示協調者已注入哪些共用背景（agent 不需重複載），以及 agent 仍需主動讀的視角專屬卡：

```
Read-first（協調者已注入，agent 不需重複讀）：
- [[prototype-stage-context]]
- [[language-conventions]]
- [[insight-discipline]]
- [[cross-agent-checklist]]
- [[review-loading-checklist]]

Agent 仍需主動讀（視角專屬）：
- [[<framework-card>]]（如 [[ceo-review-framework]] / [[erp-review-framework]] / [[pm-review-framework]]）
- [[<protocol-card>]]（本協議卡）
- [<spec-link>]（議題對應 spec）
- Vault `08-open-questions/` 該模組現有 OQ
```

**設計**：協調者把 `_shared/` 5 卡內容**摘要注入 prompt**，agent 不需用 Read 工具再開檔。視角專屬卡仍由 agent 主動讀（因內容專屬且改動較頻繁）。

### 區塊 3：Context bridging（必填）

前序 Phase / Round 輸出的傳遞，**MUST 全文 + 摘要雙寫**：

```
前序輸出（全文）：
---
[前序 Phase / Round 全文逐字引用]
---

前序輸出（協調者摘要，1-2 句）：
[協調者用 1-2 句摘要前序輸出的核心結論，幫 agent 快速定位]
```

**紀律**：
- 協調者 **MUST NOT** 對前序輸出做刪減 / 改寫 / 合併
- 摘要僅作導讀，不取代全文
- 跨多個前序 Phase 時（如 Phase 4 收斂），每個 Phase 分別列「全文 + 摘要」

### 區塊 4：Key rules 重述（必填）

紀律 **MUST** 在 dispatch prompt 中重述，不可只引用 agent.md（業界證據：agent 看不到自己 agent.md 全文時紀律遵守率下降）：

```
Key rules（本次呼叫 MUST 遵守）：

通用紀律（依 [[sequential-design-collaboration]] § 二，5 條）：
1. MUST NOT 否定 Miles 提出的商業需求
2. MUST NOT 提「製作效益不高 / ROI 太低」這類否定
3. PM 在 Phase 4 MUST 列「砍掉的功能清單」
4. PM 在 Phase 4 MUST 對每個 challenge 逐條回應
5. PM 在 Phase 4 MUST 輸出 verify consistency 兩張對照表

本 Phase 專屬禁止項：
- [依 Phase 列出，例如 Phase 2 CEO 禁止項：「MUST NOT 否定 Miles 商業需求」「補需求 MUST 標明『管理層補需求』」]
```

### 區塊 5：Blast-radius guardrails（必填）

明示本次變動性質分級 + 對應紀律強度，依 CLAUDE.md § ERP 討論主動路由「變動性質五級分級」：

```
Blast-radius guardrails：
- 本次變動性質分級：[純措辭 / 局部欄位 / 流程節點 / 結構性變更 / 商業邏輯 KPI Phase 範疇]
- 影響範圍：[單模組 / 跨模組 / 跨層]
- 對應紀律強度：[輕量單輪 / 序列協作 Phase 1+3 跳過 CEO / 序列協作 Phase 1-4 完整]
- 不可變動：Miles 提出的商業需求（紀律 1）
```

---

## 三、Dispatch Prompt 範例（三組）

### 範例 1：Phase 2 第 1 輪呼叫 ceo-reviewer

```
[PROTOCOL: SEQUENTIAL]
[PHASE: 2]
[ROUND: 1]

任務：依 Phase 1 PM 輸出，從管理層視角補需求 / KPI。你不是審查者，是管理層需求提出方。

Read-first（已注入）：
- [[prototype-stage-context]] [[language-conventions]] [[insight-discipline]] [[cross-agent-checklist]] [[review-loading-checklist]]

Agent 仍需主動讀：
- [[ceo-review-framework]]（6 維度作為思考維度）
- [[ceo-review-pitfalls]]（避免已知誤區）
- [[sequential-design-collaboration]]（本協議）
- Notion KPI DB：https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f

前序輸出（全文）：
---
[Phase 1 senior-pm 輸出全文]
---

前序輸出（摘要）：
PM 釐清的商業需求範疇為 [X]，標記了 [N] 個隱含假設，主要影響角色為 [Y]。

Key rules：
通用紀律：
1. MUST NOT 否定 Miles 提出的商業需求
2. MUST NOT 提「製作效益不高 / ROI 太低」這類否定
本 Phase CEO 專屬禁止：
- MUST NOT 提抽象評論
- 補的需求 MUST 標明「管理層補需求」（非改 Miles 原需求）
- 指標 MUST 可量化、附資料來源 / 公式 / 值域
- challenge 區塊強制存在，無 challenge 時寫「無 challenge」

Blast-radius guardrails：
- 變動性質：商業邏輯 / KPI 範疇
- 影響範圍：跨模組
- 紀律強度：序列協作 Phase 1-4 完整
- 不可變動：Miles 商業需求

輸出格式：依 ceo-reviewer.md § 序列協作 Phase 2 格式
```

### 範例 2：Phase 2 第 2 輪呼叫 ceo-reviewer（PM 啟動第 2 輪）

```
[PROTOCOL: SEQUENTIAL]
[PHASE: 2]
[ROUND: 2]

任務：依 PM 給的修正範圍（基於你第 1 輪輸出後的評估），補 / 修正管理需求。

Read-first（已注入）：同範例 1

Agent 仍需主動讀：同範例 1

前序輸出（全文）：
---
[Phase 1 senior-pm 全文]
---
[Phase 2 第 1 輪 CEO 全文]
---
[PM 給的修正範圍 + 第 2 輪啟動理由]
---

前序輸出（摘要）：
PM 評估第 1 輪後，因 [PM 列的 3 條 MUST 啟動條件 / 自判理由] 啟動第 2 輪，預期修正方向為 [Z]。

Key rules：同範例 1

Blast-radius guardrails：同範例 1

輸出格式：依 ceo-reviewer.md § 序列協作 Phase 2 第 2 輪格式
```

### 範例 3：Phase 3 第 1 輪呼叫 erp-consultant

```
[PROTOCOL: SEQUENTIAL]
[PHASE: 3]
[ROUND: 1]

任務：依 PM + CEO 統合需求做設計。你不是審查者，是統合需求設計者。

Read-first（已注入）：同範例 1

Agent 仍需主動讀：
- [[erp-review-framework]]（6 維度作為思考維度）
- [[erp-design-patterns]]（5 設計模式必對照）
- [[erp-naming-rules]]（改名 / 新術語 5 秒測試）
- [[erp-naming-misjudgements]]（命名誤審記錄）
- [[sequential-design-collaboration]]（本協議）
- 狀態機 spec：openspec/specs/state-machines/spec.md
- 商業流程 spec：openspec/specs/business-processes/spec.md
- 議題對應 spec：[依議題列]

前序輸出（全文）：
---
[Phase 1 senior-pm 全文]
---
[Phase 2 CEO 第 1 輪 + 可能的第 2 輪全文]
---
[PM 統合需求摘要]
---

前序輸出（摘要）：
PM + CEO 統合需求為 [統合需求摘要]，含 CEO 補的管理需求 [W] 與指標 [V]。

Key rules：
通用紀律：1-5 條
本 Phase 顧問專屬禁止：
- MUST NOT 否定 Miles 商業需求
- MUST NOT 否定 CEO 補的管理需求（除非與 Miles 商業需求衝突，此時 challenge 標註）
- challenge 區塊若發現「CEO 指標 X 無法被實作測量」MUST 明示給 PM（取代 Phase 2.5 回流）
- 改名 / 新術語 MUST 過 [[erp-naming-rules]] 5 秒測試

Blast-radius guardrails：同範例 1

輸出格式：依 erp-consultant.md § 序列協作 Phase 3 格式
```

---

## 四、協調者組裝 checklist

每次呼叫 sub-agent 前，協調者 **MUST** 自查：

- [ ] 區塊 1：標記三項齊全（PROTOCOL + PHASE + ROUND）
- [ ] 區塊 2：Read-first 注入 / 主動讀清單明確分列
- [ ] 區塊 3：前序輸出**全文 + 摘要**雙寫
- [ ] 區塊 4：通用紀律 5 條 + 本 Phase 專屬禁止項列出
- [ ] 區塊 5：變動性質分級 + 影響範圍 + 紀律強度 + 不可變動項列出
- [ ] Phase 2/3 第 2 輪呼叫：MUST 含 PM 啟動理由與預期修正方向

協調者 **MUST NOT**：
- 對前序輸出做刪減 / 改寫 / 合併（紀律 2）
- 略過任一區塊（即使內容為「無」也 MUST 列區塊）
- 自行對 sub-agent 輸出做彙整（紀律 3：唯一 reporter 是 Phase 4 PM）

---

## 五、相關卡

- [[sequential-design-collaboration]] — 序列協作協議主卡（本卡 5 區塊的使用情境）
- [[multi-agent-discussion-protocol]] — 多 agent 輪次討論（過渡期保留）
- [[lightweight-review-mode]] — 單 agent 輕量審查
- [[senior-pm-write-mode]] — Senior PM 寫入流程（`[MODE]` 標記與本卡正交）
- [[review-loading-checklist]] — 各 Agent 背景載入範圍（Read-first 區塊組裝依據）
- [[cross-agent-checklist]] — 跨 agent 共用 checklist
