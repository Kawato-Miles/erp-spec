---
type: meta
status: active
last-reviewed: 2026-05-21
---

# Raw 素材承接層

> **「raw 是已驗證素材的歸檔，不是 LLM 自編內容的暫存。每張 raw 卡都應該能回答：誰看過、誰確認過、來源是什麼。」**
>
> Yu Wenhao Anti-Model-Collapse 核心原則：「思考在對話裡發生，歸檔是思考完的結果。」

## 一、定位

Karpathy LLM Wiki 模式中的「raw 層」對應位置。承接尚未精練但已驗證的素材，供 `vault-ingest` skill 在後續精練步驟拆解到既有 12 編號目錄。

**收什麼**：
- Prototype 走查反饋（已被 Miles 確認的觀察）
- Claude 被指派研究後產出（含真實 WebFetch / 對外資料來源）
- Miles 對話中的觀察與設計傾向（未升級為 OQ 但值得記）
- MES / ERP 競品研究筆記（含真實出處）
- Claude 主動建議「值得記」的素材（須 Miles 確認後才寫入）

**不收什麼**：
- 明確未解問題 → 走 [[../08-open-questions/README|OQ]] 不進 raw
- LLM 自編內容（無真實外部來源）→ 拒絕寫入（防 Model Collapse）
- 已精練的知識 → 直接進 04-business-logic / 05-entities / 06-state-machines 等對應目錄
- UI 規範 / 演算法 / 功能 Requirement → 留 Prototype DESIGN.md / src/utils/ / OpenSpec

## 二、檔案命名規約

格式：`<YYYY-MM-DD>-<source-slug>-<主題 slug>.md`

`source-slug` 五值（對應 frontmatter `source`）：
- `miles-dialogue` — Miles 對話中的觀察
- `claude-research` — 被指派研究任務的產出（**raw-source-link 必填**）
- `claude-self-capture` — Claude 對話中主動建議（**須 Miles 確認**）
- `prototype-dogfood` — Prototype 走查反饋
- `mes-study` — 競品 / MES 業界研究

範例：
- `2026-05-21-prototype-dogfood-狀態卡點擊區域64px過小.md`
- `2026-05-21-claude-research-tharstern-rma-flow.md`
- `2026-05-21-miles-dialogue-訂單備註異動歷史未來範疇.md`

## 三、Status 演進

| status | 意義 | 觸發 |
|--------|------|------|
| `raw` | 剛寫入，待精練 | vault-ingest Mode A 寫入時預設 |
| `reviewed` | Mode B 已分析，等待 Miles 確認 cards diff | Mode B step 3 完成 |
| `ingested` | 內容已寫入既有 vault 卡 / 升級為 OQ 或 insight | Mode B step 6 完成 |
| `cancelled` | 不適用 / 重複 / 誤觸發 | Miles 指示或 Mode B 識別為冗餘 |

`status: ingested` 的 raw 卡**保留**為歷史證據（不刪檔），供未來追溯。

## 四、觸發指引

### 寫入 raw（vault-ingest Mode A）
- Miles 主動：「存進 raw」「我要記」「先收集」「研究一下 X」
- Claude 被指派研究：完成 WebFetch / WebSearch 後**自主寫入**（claude-on-task）
- Claude 主動建議：對話中識別「值得記」→ **必須先問 Miles** 才寫入

### 拆解 raw → 既有 vault 卡（vault-ingest Mode B）
- Miles 主動：「精練 [檔名]」「ingest 這張」「拆解 raw」
- Mode C 批次掃描後挑卡處理

### 批次掃描（vault-ingest Mode C）
- Miles 主動：「看 raw」「掃 raw」「raw 待處理」
- 主動收尾：累積 ≥ 10 張 status=raw 時 Claude 主動建議

## 五、Anti-Model-Collapse 四道防線

| 風險 | 防呆規則 |
|------|---------|
| Claude 自迭代（讀 vault → 編 raw → 再讀） | `claude-self-capture` 必須 Miles 確認；自主寫入只在 `claude-on-task`（被指派研究）情境 |
| LLM 編造「研究結論」 | `claude-research` 必須附真實 `raw-source-link`（WebFetch URL / 文件來源），無來源不寫 |
| 跨卡更新時過度自由 | Mode B step 3「提議 cards diff」**只是提案**，Miles 確認後才動既有卡 |
| Raw 噪音進入 insight | `vault-insight` 只讀 `status: ingested` 或 `reviewed`，**不讀** `status: raw` |

## 六、與既有 skill 銜接

| Skill | 銜接點 |
|-------|-------|
| [oq-manage](../../../.claude/skills/oq-manage/SKILL.md) | Mode A 識別「明確未解問題」時改走 oq-manage mode B；Mode B step 4 觸發 oq-manage mode B 開 OQ 卡 |
| [vault-audit](../../../.claude/skills/vault-audit/SKILL.md) | 第二階段擴維度 11「raw 健康度」自動掃 status=raw > 90 / 180 天 |
| [vault-insight](../../../.claude/skills/vault-insight/SKILL.md) | 第二階段加 raw（過濾 raw status）為素材來源 |
| [misjudgement-record](../../../.claude/skills/misjudgement-record/SKILL.md) | 完全不交叉；誤審不存 raw |

## 七、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] — type=raw frontmatter 規格、status enum、命名規約
- [[../00-meta/scope-boundary|Scope Boundary]] — 進 raw vs 進 OQ vs 進 vault 卡的判斷準則
- [[../00-meta/vault-charter|Vault Charter]] — 三邊治理章程
- [[../00-meta/audit-log|Audit Log]] — 所有 ingest 操作的時序日誌
- [[_template|Raw 卡模板]] — Mode A 寫入時複製此檔結構
- `.claude/skills/vault-ingest/SKILL.md` — vault-ingest skill 主檔（三 mode 流程）
