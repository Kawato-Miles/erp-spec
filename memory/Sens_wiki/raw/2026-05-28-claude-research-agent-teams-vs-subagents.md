---
type: raw
status: raw
created-at: 2026-05-28
source: claude-research
captured-by: claude-on-task
module:
  - cross-module
topic-tag:
  - agent-collaboration
  - claude-code
  - sub-agent
  - agent-teams
  - orchestrator-worker
related-vault:
  - "[[sequential-design-collaboration]]"
  - "[[multi-agent-discussion-protocol]]"
  - "[[dispatch-prompt-template]]"
raw-source-link: |
  https://code.claude.com/docs/en/agent-teams
  https://www.anthropic.com/engineering/multi-agent-research-system
  https://www.channel.tel/blog/claude-code-subagents-orchestrator-pattern
  https://www.mindstudio.ai/blog/claude-code-agent-teams-vs-sub-agents
  https://claude.com/blog/building-agents-with-the-claude-agent-sdk
---

# Claude Code Sub-agent vs Agent Teams 業界最佳實踐調研

## 原始素材

### 來源 1：Anthropic Claude Code Agent Teams 官方文件

URL：https://code.claude.com/docs/en/agent-teams

WebFetch 摘要：

**核心架構差異**：

| 項目 | Subagents | Agent Teams |
|:----|:---------|:-----------|
| Context | Own context window; results return to the caller | Own context window; fully independent |
| Communication | Report results back to the main agent only | Teammates message each other directly |
| Coordination | Main agent manages all work | Shared task list with self-coordination |
| Best for | Focused tasks where only the result matters | Complex work requiring discussion and collaboration |
| Token cost | Lower: results summarized back to main context | Higher: each teammate is a separate Claude instance |

> "Use subagents when you need quick, focused workers that report back. Use agent teams when teammates need to share findings, challenge each other, and coordinate on their own."

**Agent Teams 啟用條件**：experimental flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`，需 Claude Code v2.1.32+。

**最佳實踐**：
- 「Start with 3-5 teammates for most workflows」
- 「Having 5-6 tasks per teammate keeps everyone productive」
- 「Three focused teammates often outperform five scattered ones」

**已知限制**：
- No session resumption with in-process teammates (`/resume` 不支援)
- Task status can lag (teammate 有時忘標 completed)
- One team at a time
- No nested teams
- Lead is fixed (無法 promote teammate to lead)

**使用場景**：「Research and review / New modules or features / Debugging with competing hypotheses / Cross-layer coordination」

**何時不該用**：「For sequential tasks, same-file edits, or work with many dependencies, a single session or subagents are more effective.」

### 來源 2：Anthropic Multi-Agent Research System

URL：https://www.anthropic.com/engineering/multi-agent-research-system

WebFetch 摘要：

> "A multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on internal research evaluations."

**關鍵 takeaway**：
1. Orchestrator-Worker Pattern 是 Anthropic 自家採用的架構
2. Token efficiency：「token usage by itself explains 80% of the variance」
3. **Detailed task descriptions prevent duplicated work**（避免子 agent 重複工作的關鍵）
4. Agents are stateful and errors compound — 需要完整 observability
5. LLM-as-judge evaluation 用於 free-form research outputs

**重要 quote**：
> "Early prototypes spawned excessive subagents, performed endless searches, and created redundant work. The team addressed this through refined prompt engineering rather than rigid rules."

→ 對應到我們的協議：dispatch prompt 設計（refined prompt engineering）比硬性規則更有效。

### 來源 3：Channel.tel — Claude Code Subagents & Orchestrator Pattern

URL：https://www.channel.tel/blog/claude-code-subagents-orchestrator-pattern

WebFetch 摘要：

**Four-Phase Implementation**：
1. Clarify — 識別 affected projects 與 dependencies
2. Plan Inside-Out — backend → SDK → UI（DRY onion）
3. Dispatch with Context Packets — 每個 sub-agent 接收：project path、CLAUDE.md、rules files、task description、build/test commands
4. Verify Consistency — orchestrator 檢查 type alignment、imports、null cases

**Dispatch Prompt 強調**：
> "The dispatch prompt is the single most important artifact in the orchestrator pattern."

包含元素：
- Read first: 特定檔案
- Context bridging: 上游輸出
- Explicit tests: 具體測試需求
- Key rules repeated: 關鍵規則寫在 task 描述中（不是埋在文件深處）
- Blast-radius guardrails: 標明風險變更

**Common Failure Modes**：

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| Lossy context hand-offs | Nuance lost between orchestrator and subagent | Over-specify constraints; include "why" and "except when" |
| Type mismatches across layers | SDK types disagree with API responses | Explicit Phase verification checklist |
| Rules ignored | Important patterns buried 200+ lines deep | Repeat critical rules in task description |
| Coordination bottleneck | Too many subagents (8+) in one session | Split into multiple PRs; keep sessions under 8 tasks |

**Subagents vs. Agent Teams（成本）**：
- Subagents: 2-3x baseline token cost
- Agent Teams: ~7x token cost

### 來源 4：MindStudio — Claude Code Agent Teams vs Sub-Agents

URL：https://www.mindstudio.ai/blog/claude-code-agent-teams-vs-sub-agents

WebFetch 摘要：

**Sub-Agent 適用**：
- Tasks have clear sequential dependencies
- Complex reasoning requires visibility into all prior steps
- Pipelines are short (3-4 steps)
- Auditability and complete decision traces matter

**Agent Teams 適用**：
- Workloads decompose into independent parallel subtasks
- Processing large documents or data batches simultaneously
- Workflows involve dozens of steps where orchestrator context would balloon
- Specialized agent roles need minimal handoff overhead

**Token cost 比較**：「For large parallel workloads with 10+ agents, teams can achieve 3-5x cheaper token efficiency」（與 Sub-agent 的對比，當 agent 數量極多時）。

### 來源 5：Anthropic Claude Agent SDK

URL：https://claude.com/blog/building-agents-with-the-claude-agent-sdk
（原 anthropic.com 已 redirect）

WebFetch 摘要：

**Agent Feedback Loop**：
1. Gather context — Search files, semantic search, or deploy subagents
2. Take action — Execute via tools, scripts, or code generation
3. Verify work — Use rules, visual feedback, or LLM evaluation
4. Iterate — Refine based on feedback

**核心建議**：「Give your agents a computer, allowing them to work like humans do」

**Subagents 在 SDK 中的定位**：「Enable parallel processing and isolated context windows」。

## 第一輪初步分析（Claude 寫）

- 觀察：
  1. Anthropic 自家 multi-agent research system 採 **orchestrator-worker pattern**（即 sub-agent 模式），達 90.2% 比單 agent 提升。這支持我們繼續用 sub-agent 模式而非升級 Agent Teams
  2. Dispatch prompt 在業界被明確稱為「最重要的 artifact」，5 區塊結構（read-first、context bridging、key rules、guardrails）有業界共識
  3. Lossy context hand-off 是最常見 failure mode → 業界解法「over-specify constraints、include why and except when、repeat critical rules in task description」對應到我們的 [[dispatch-prompt-template]] 設計
  4. Agent Teams ~7x token cost、experimental、`/resume` 不支援，且 peer-to-peer 與我們「PM 單一收斂點」原則衝突
- 候選相關卡：[[sequential-design-collaboration]] / [[dispatch-prompt-template]] / [[multi-agent-discussion-protocol]]
- 候選 OQ 候補：無（本研究已完成決策）
- 候選升級路徑：insight（已產出 [[2026-05-28-agent-teams-evaluation]]）

## 待精練（Mode B 處理）

- [x] 已升級為 insight 卡：[[2026-05-28-agent-teams-evaluation]]
- [x] 已用於改寫 [[sequential-design-collaboration]] 與新建 [[dispatch-prompt-template]]
- [ ] 未來規劃工作流時可重新參考（Miles 指示「後續規劃工作流時可以參考」）

## 精練去處（Mode B 完成後填）

- [[2026-05-28-agent-teams-evaluation]] — 已分析、含未來採用觸發條件
- [[sequential-design-collaboration]] — 2026-05-28 大改採用本研究的 orchestrator-worker pattern + dispatch prompt 結構
- [[dispatch-prompt-template]] — 2026-05-28 新建，採用本研究的 5 區塊結構
