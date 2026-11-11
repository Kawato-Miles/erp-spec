# 30：AGENTS.md 與設定檔去重

Type: task
Status: open
Blocked by: 29

## Question

把不依賴後面決策票的去重提前做（Miles 2026-11-12：環境的設置與去重要提前）。流程怎麼走是票 09 的事，本票不改流程，只去重與消除矛盾。

- `AGENTS.md` 陷阱表 32 列：每列在記憶卡或 skill 都有同義句（票 03）。一個事實只留一個家，其餘刪除或改成引用。
- 票 03 列出的 12 組矛盾（例：模型分工在 5 處數值不一致、後端名稱兩種寫法、分支與 PR 說法三處不一）：並排列給 Miles 裁決，不自行調和。裁決後改到只剩一種說法。
- `AGENTS.md` 與 `docs/agents/domain.md` 引用不存在的 `docs/adr/`；`.gitignore` 註解指向已不存在的 `CLAUDE.md` 與 `tools/superpowers`；`oq-manage/SKILL.md` 引用已改名的路徑。
- 設定檔的過期項目：`.claude/settings.json` 7 項、`~/.claude/settings.json` 6 項過期允許；`.claude/launch.json` 第三筆指向不存在的目錄；`.mcp.json` 的 `figma-desktop` 連不上。
- `.claude/settings.local.json`（不進版控，只在主檢出）裡的提交後自動推送 hook 要不要搬進 `settings.json`：搬了會讓每個工作樹一提交就推自己的分支。列選項給 Miles。
- 票 29 標出「只在記憶卡有、該搬到別處」的做事方法，搬進對應的檔。

明細在 `research/14a-sens-and-global-inventory.md`（改寫列）與 `research/03-environment-inventory.md`。改 `~/.claude/` 下的檔之前先備份到 `~/.claude/archive/`。
完成後記錄改了哪些檔、裁決了哪些矛盾。依決策票結論的重寫仍歸票 11。

## Comments

### 2026-11-12 Miles 拍板：刪掉派工任務書範本（由票 29 的對話記入）

- 決定：`memory/shared/派工任務書範本.md` 刪掉，在本票處理。
- 理由：官方認同任務書的內容（子代理看不到對話歷史；放手前要答五題：知道完成長怎樣、能否自檢、能碰什麼、何時停、成果交給誰簽核），但沒有要求用填空表。現行模型用簡短指令就能引導。出處見 `research/20-anthropic-setup-guidance.md` § 四、§ 七、§ 八。
- 做法：五題濃縮成 `AGENTS.md` 的兩三行。四個附加段（寫 wiki 卡、Prototype、調研、稽核）各自搬回對應的 skill，搬之前逐段核對有沒有漏。
- 同步要改的引用處（2026-11-12 實測）：`AGENTS.md` 第 44、121 行；`.claude/skills/vault-audit/references/判讀派工單.md`；`.claude/skills/erp-audit/references/稽核者派工單.md`、`推演者派工單.md`；`.claude/skills/vault-ingest/references/調研派工單.md`。
- 風險：寫 wiki 卡與 Prototype 兩個附加段有實質限制（不准動規範卡、要列測試影響）。漏搬會讓子代理改到不該改的檔。

### 2026-11-12 票 29 交來的事項

票 29 已結案。記憶目錄剩 55 張卡：feedback 50、reference 5。下列事項歸本票。

待搬的 feedback 卡 38 張：

- 名單與每張卡該搬到哪個檔：`research/29-verify/F1.md`、`F2.md`、`F3.md` 的「總表」，看「建議的家」欄。
- 搬完刪卡，並刪記憶索引檔 `MEMORY.md` 的對應列（`AGENTS.md` § 記憶目錄）。
- `AGENTS.md` 陷阱表還有 6 列的出處寫「記憶卡 feedback_…」（no_over_design_on_oq、meaningful_guards、jidoka_stop_first_design、trace_fact_source_chain、check_sensation_api_asis、linear_issue_via_pm_team）。這 6 張卡目前都在。卡搬走時，同步把出處改成日期或刪掉該列。
- 留下的卡裡有指向已封存 project 卡的 `[[project-…]]` 連結，搬卡時一併清掉。

與現行規則相反的 feedback 卡 12 張，並排列給 Miles 裁決：

check_sensation_api_asis、features_mece_no_rules_in_project、industry_best_practice_first、linear_comment_format、linear_fix_restructure_not_append、linear_task_prefix、model_split_opus_for_agents、oq_closure_resolve_then_archive、production_task_standardized、prototype_layout_follow_source、prototype_pr_no_linear_link、wiki_link_not_text_path。

- 每張卡與哪一句現行規則相反，見 `F1.md` 至 `F3.md` 各卡的小節。
- `feedback_linear_task_prefix.md` 不在 `MEMORY.md` 索引內。

要 Miles 裁決的兩條（票 29 重查判定「記憶卡較新」）：

| 題目 | 兩邊的說法 | 證據 |
|---|---|---|
| ERP 後端現況正本的名稱 | 記憶卡 `feedback_check_sensation_api_asis` 與已封存的 seg3 卡：ERP 後端是 sens-print-core，sensation-api 是 EC 後台。`AGENTS.md` 第 59、112 行與 `erp-plan/SKILL.md` 第 32 行：先查 sensation-api | `research/29-verify/重查彙整-待裁決.md` 的 `project_production_stage_seg3_done` F13 列；`linear-delivery/SKILL.md:77` 以 sens-print-core 為後端現況 |
| erp 的 Prototype 分支做法 | 已封存的記憶卡 `project_erp_repo_prototype_workflow`：唯一長期分支 prototype/production-stage。erp 的 skill `prototype-from-prompt/SKILL.md:69`：一律在 `prototype/<name>` 分支，從 main 拉出。`AGENTS.md` 第 138 行：開分支加前端主管 PR 合併，沒寫分支名 | 同檔的 `project_erp_repo_prototype_workflow` 5 列 |

陷阱表要刪的一列：

- `AGENTS.md` 第 111 行「還不要提交的改動先暫存；並行工作階段會一起提交」。前提已不成立：代理一律在自己的工作樹作業，每個工作樹有自己的暫存區。對應的記憶卡 `feedback_no_staging_before_commit` 已封存。

票 29 已改掉的部分（本票不用再做）：

- 陷阱表 4 列的出處原本指向已封存的記憶卡，已改成日期（輸出簡體中文字元、文件矛盾自行調和、設計前漏讀架構正本卡、改卡名用 git mv）。
- 「停下與繼續」段刪掉「記憶卡標『勿重問』者直接沿用」。記憶目錄已沒有任何卡含「勿重問」。

`docs/adr/` 的處理等 Miles 裁決：

- 本票 Question 第三點把 `docs/adr/` 列為「引用不存在的資料夾」。matt 的 `domain-modeling` skill 原文是用到才建（Create the `docs/adr/` directory lazily: only when the first ADR is needed），`docs/agents/domain.md` 也寫資料夾不存在就照常進行。所以資料夾不存在不算錯。
- 要不要保留這個引用，取決於 Miles 對票 29 Answer「決策紀錄」一節的裁決。裁決前不動。

### 2026-11-12 Miles 裁決：決策紀錄採用，`docs/adr/` 的引用保留

- Miles 採用票 29 Answer「決策紀錄」一節的做法。分工已寫進 `AGENTS.md` 正本分層表的「決策紀錄」一列。
- 本票 Question 第三點的 `docs/adr/` 引用不用刪。資料夾用到才建，現在不存在是正常的。

### 2026-11-12 `.claude/settings.json` 新增記憶目錄寫入檢查（票 29 加的，本票清設定檔時保留）

- `.claude/settings.json` 的 `hooks.PreToolUse` 有一筆「記憶目錄寫入檢查」，指令稿在 `.claude/hooks/memory_write_guard.py`。它擋下寫進記憶目錄的 project 類卡。說明見票 29 Answer。
- 記憶目錄現在是 feedback 50 張、reference 5 張，沒有 project 類。上一段留言寫的「project 2、reference 3」已改成這個數字。
- Miles 已同意 `AGENTS.md`「記憶目錄」一節的用字。

