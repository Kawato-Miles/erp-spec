---
name: vault-ingest
description: >
  用：Miles 說「存進 raw」「我要記」「先收集」「這份檔案存 raw」「這份訪談紀錄存進 raw」「把這個 PDF、訪談、截圖收進來」；Claude 完成研究任務後；Claude 識別到值得記的素材（先問 Miles）；erp-plan 的調研建議經 Miles 同意，要派調研；Miles 說「精練 [檔名]」「ingest 這張」「拆解 raw」；Miles 說「看 raw」「掃 raw」「raw 待處理」，或 raw 待處理累積達門檻。
  不用：已精練的知識更新（直接改既有卡，正本卡走 wiki-amend）；明確未解問題（用 oq-manage）；介面規範（留 Prototype 的 DESIGN.md）；稽核誤判（用 erp-audit）。
---

# vault-ingest

## 目標

外部與對話素材先進 `memory/Sens_wiki/raw/`，經 Miles 確認後才精練進 wiki。
調研素材附真實來源與查證紀錄。業界做法精練後只進審查知識層的參考模型卡，不進業務正本卡。

## 產出

| 產出 | 落點 | 誰寫 |
|------|------|------|
| raw 卡（mode A） | `memory/Sens_wiki/raw/<YYYY-MM-DD>-<source>-<主題繁中名詞>.md` | 主對話 |
| 查證紀錄段（claude-research 必有） | raw 卡內，原始素材段之後 | 主對話 |
| 調研任務書 | 派工訊息，不存檔 | 主對話 |
| 調研草稿 | scratchpad | `erp-researcher`（`.claude/agents/erp-researcher.md`） |
| 精練提案 cards diff（mode B） | 對話 | 主對話 |
| raw 卡狀態與精練去處段 | raw 卡 frontmatter 與卡末 | 主對話 |
| 掃描報告（mode C） | 對話；不動檔 | 主對話 |
| log 一筆 | `memory/Sens_wiki/wiki/log.md`，標籤 ingest-A、ingest-B 或 ingest-C | 主對話 |

## 限制

| 防線 | 規則 | 為何 |
|------|------|------|
| 1. 自捕捉須確認 | captured-by=claude-self 時 MUST 先問「我把這段存 raw 嗎？理由：…」，Miles 同意才寫 | 防 Claude 自己決定什麼值得記，噪音氾濫 |
| 2. 研究須真實來源 | source=claude-research 時 raw-source-link MUST 填真實 WebFetch URL／文件來源；無外部來源不寫 | 防編造看似合理但無出處的「研究結論」 |
| 2b. 上傳須附原檔 | source=miles-upload 時原檔 MUST 搬 `raw/_attachments/<檔名>`＋frontmatter `attached-files` 列檔名＋raw-source-link 填原始出處；卡內文寫摘要重點（不貼全文）並標「原檔見 [[_attachments/<檔名>]]」 | 原始頁面刪了也找得回，永遠可追溯 |
| 3. 精練須逐項批准 | mode B 的 cards diff 僅是提案，每張卡 Miles 看過說 OK 才動；禁「批准＋自動套用」一鍵流程 | 防跨卡連鎖更新時過度發揮、磨平細節 |
| 4. 合成不讀未驗證素材 | 讀 raw 做跨卡合成時只取 status=ingested／reviewed，禁讀 status=raw | 防未驗證素材自我放大（self-amplification） |

- 被要求「總結既有 vault 內容存進 raw」時拒絕：讀 vault、自己編、再存 raw 是自我迭代。改在對話給總結，或把合成寫進對應正本卡。
- claude-research 卡 MUST 附真實來源網址，且有主對話抽查的查證紀錄段；沒有查證紀錄段不寫入。
- 業務正本卡（03～07）不收業界做法。業界做法只進參考模型卡（`11-review-knowledge/參考模型/`）。
- 精練寫入 03～07 正本卡轉 `wiki-amend`；寫入參考模型卡走 [[審查知識路由]] § 四。本 skill 只改 raw 卡。
- 明確未解問題改走 `oq-manage` mode B，不寫 raw。
- raw 卡內不用 `[!question]` callout；與 oq-manage 共用此禁令。
- 調研子代理任務書 MUST 指名先讀句法兩檔：`/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`、`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`。
- 本 skill 的門檻值只寫在 `references/掃描報告格式.md`。

## 順序

| 步 | mode | 動作 |
|----|------|------|
| 1 | A | 確認來源：source 與 captured-by 對應（miles 對 miles-dialogue、prototype-dogfood、miles-upload；claude-on-task 對 claude-research、mes-study；claude-self 對 claude-self-capture） |
| 2 | A | 分流：明確未解問題轉 oq-manage；同主題已有 raw 卡，建議合併 |
| 3 | A | 調研時先派 `erp-researcher`，收回草稿後抽查 |
| 4 | A | 從骨架寫卡；claude-research 卡加查證紀錄段 |
| 5 | A | log 一筆（ingest-A）；不立即精練 |
| 6 | B | 讀 raw 卡與候選相關卡全文，判去處 |
| 7 | B | 提 cards diff，Miles 逐項批准 |
| 8 | B | 轉 `wiki-amend` 或 11 層寫入入口；回填 raw 卡；log 一筆（ingest-B） |
| 9 | C | 產掃描報告，不動檔；log 一筆（ingest-C） |

## 情況對應檔案

| 情況 | 讀哪個檔 |
|------|---------|
| 寫 raw 卡 | wiki 骨架 `memory/Sens_wiki/wiki/範本/範本 - Raw 素材.md`（複製起手，不複寫） |
| 調研派工 | `references/調研派工單.md` |
| 查證調研草稿 | `references/查證紀錄格式.md` |
| 分流或判精練去處 | `references/去處表.md` |
| 批次掃描 | `references/掃描報告格式.md` |

## 陷阱

| 陷阱 | 出處 |
|------|------|
| 摘要工具回傳的不是原文：子代理寫「約降 5 倍」，原文是每張 4.6 美分降到 1.9 美分 | 2026-10-29 [[2026-10-29-claude-research-claude.dev對Claude5世代的使用建議]] 查證紀錄段 |
| ingested-to 指向的卡被刪，raw 卡沒回填：2026-06-14 調研卡有 4 張去處已不存在 | 2026-10-29 重構計畫 § 2.9 |
| 同主題素材分散多張 raw 卡，精練時要跨卡合成：派單與物流現況分在 2026-06-15 兩張、2026-07-30、2026-09-22 四張 | raw 目錄檔名；寫卡前先查同主題 raw 卡並建議合併 |
