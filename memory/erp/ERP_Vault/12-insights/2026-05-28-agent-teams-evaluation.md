---
type: insight
module:
  - cross-module
status: closed
priority: low
raised-at: 2026-05-28
raised-by: claude-research (vault-ingest mode A)
triggered-by: Miles 質疑「是否該用 Claude Agent Teams 取代 sub-agent 模式」+ 三 agent 協作優化討論
related-vault:
  - "[[../11-review-knowledge/protocols/sequential-design-collaboration]]"
  - "[[../11-review-knowledge/protocols/dispatch-prompt-template]]"
  - "[[../11-review-knowledge/protocols/multi-agent-discussion-protocol]]"
  - "[[../raw/2026-05-28-claude-research-agent-teams-vs-subagents]]"
related-oq: []
related-spec: 不涉及 spec
expected-action-at: 條件觸發時重評（見 § 四）
---

# 2026-05-28：Agent Teams vs Sub-agent 採用評估 — 暫不採用、保留未來觸發條件

## 背景

Miles 觀察到 ERP 三 review agent 協作有四個並列痛點（延遲長 / Token 燒 / 品質不穩 / 認知負擔），詢問是否該升級到 Claude Code Agent Teams（v2.1.32+ experimental feature）取代現有 sub-agent 模式。

本 insight 收斂為「不採用、保留觸發條件」的決策依據，與下一步觀察方向。

## 觀察

### 1. Agent Teams 與 Sub-agent 的核心差異

依 [[../raw/2026-05-28-claude-research-agent-teams-vs-subagents]] 第 1 / 4 來源：

| 項目 | Sub-agent（現用） | Agent Teams（experimental） |
|------|----------------|---------------------------|
| 通訊 | 只能 report back 給 orchestrator | teammate 之間可直接傳訊 |
| 協調 | orchestrator 集中管 | shared task list + 自我認領 |
| Token | 較低（2-3x baseline） | ~7x baseline |
| 適用 | 簡單獨立任務、序列依賴 | 需要互相挑戰、peer-review 的協作 |

### 2. Anthropic 自家 multi-agent research 用的也是 sub-agent

依 [[../raw/2026-05-28-claude-research-agent-teams-vs-subagents]] 第 2 來源：

> "A multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on internal research evaluations."

這 90.2% 提升來自 **orchestrator-worker pattern**（sub-agent 模式），不是 peer-to-peer（Agent Teams）。

### 3. Agent Teams 與 ERP 設計協作場景的不匹配

ERP 設計協作的本質：「PM 中介 CEO 補需求 / ERP 顧問做設計 → PM 收斂匯報 Miles」。PM 是單一收斂點（依 Miles 確認的協作模型）。

Agent Teams 的 peer-to-peer 通訊在此場景反而是缺點：
- 與我們已驗證失敗的舊 [[../11-review-knowledge/protocols/multi-agent-discussion-protocol]]（Round 2-3 互審）本質相同：peer 互審導致需求無法收斂、輪次增加無新 insight
- 與「PM 單一收斂點」設計原則衝突
- ~7x token cost 與 Miles 痛點「Token 燒太兇」直接衝突

### 4. Anthropic 官方對 Agent Teams 的「不該用」清單剛好對應 ERP 場景

依 [[../raw/2026-05-28-claude-research-agent-teams-vs-subagents]] 第 1 來源：

> "For sequential tasks, same-file edits, or work with many dependencies, a single session or subagents are more effective."

ERP 設計協作就是「sequential tasks」（Phase 1→2→3→4 序列）+「many dependencies」（每個 Phase 依賴前序輸出），完全落入「不該用 Agent Teams」的場景。

## 結論

**不採用 Agent Teams，繼續 sub-agent 模式 + 重塑 sequential 協議**（2026-05-28 已執行）。

具體執行：
1. [[../11-review-knowledge/protocols/sequential-design-collaboration]] 大改 — Phase 2/3 PM-中介來回上限 2 + Phase 4 verify consistency
2. 新建 [[../11-review-knowledge/protocols/dispatch-prompt-template]] — 5 區塊標準（採 Anthropic 官方建議結構）
3. [[../11-review-knowledge/protocols/multi-agent-discussion-protocol]] 標 `deprecated-verify-only`

## 四、未來採用 Agent Teams 的觸發條件

**滿足以下任一條才重啟評估**（不主動評估，等條件觸發）：

1. **ERP 場景出現「需要 ≥ 3 個 agent 平行 review 同一份大文件」的真實需求**（例如完整 BRD 章節獨立檢視）
2. **Token 預算寬鬆到可承受 7x 成本**（例如 Claude Pro Max 方案無限制使用 / 公司預算明確支援）
3. **Claude Code Agent Teams 脫離 experimental，支援 `/resume` 與 session 持久化**（目前已知限制：no session resumption / task status 滯後 / 一次只能管一個 team / 不支援 nested teams）
4. **ERP 開發進入 implementation 階段，需「frontend / backend / test 跨層 cross-layer coordination」**（Agent Teams 第四個官方 use case，與設計階段協作不同）

## 五、下一步建議

| Action | 負責人 | 時程 |
|--------|-------|------|
| 累積 3-5 個 change 使用新 sequential 協議（Phase 2/3 PM-中介來回 + Phase 4 verify consistency）後評估誤審率變化 | Miles + Claude 協調者 | 2026-06 內 |
| 若 Phase 4 verify consistency 兩張對照表足以取代 [[../11-review-knowledge/protocols/multi-agent-discussion-protocol]]，則完全 deprecate 後者 | Miles | 2026-06 內 |
| 觀察 Agent Teams 是否脫離 experimental（Claude Code release notes） | Claude（定期） | 條件觸發時 |
| 若觸發任一上述「未來採用條件」，重新跑 vault-insight 評估 | Miles | 條件觸發時 |

## 相關卡

- [[../raw/2026-05-28-claude-research-agent-teams-vs-subagents]] — 原始研究材料（含 5 個來源 URL）
- [[../11-review-knowledge/protocols/sequential-design-collaboration]] — 新主協議（採 sub-agent 模式）
- [[../11-review-knowledge/protocols/dispatch-prompt-template]] — Dispatch prompt 5 區塊標準
- [[../11-review-knowledge/protocols/multi-agent-discussion-protocol]] — 舊協議（deprecated-verify-only）
