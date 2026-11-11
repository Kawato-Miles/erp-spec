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
