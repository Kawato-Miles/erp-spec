# Anthropic 官方對環境設定與新模型寫法的建議（調研 20）

調研日期：2026-11-12。只用 Anthropic 官方來源。本檔只記錄官方說了什麼，不提設計方案。

引句標示規則：
- 「逐字」：我抓回的內容中直接看到的原文。
- 「引句取自摘要」：該頁抓取工具只回傳摘要，引句出自摘要文字，我沒有看到頁面全文。
- 引句中的 Markdown 反引號與連結標記已去除，字詞未改。

抓取狀況：下列頁面抓到全文（逐字）：code.claude.com 的 memory、best-practices、features-overview、sessions、worktrees、context-window、agent-teams、output-styles、plugins/overview、hooks-guide（以搜尋片段核對）、permissions（片段）；platform.claude.com 的 claude-prompting-best-practices、prompting-claude-fable-5-2、prompting-claude-fable-5、prompting-claude-opus-5-5、prompting-claude-opus-5、prompting-claude-sonnet-5-5、whats-new-opus-5-5、agent-skills/best-practices。
下列頁面只有摘要（引句取自摘要）：code.claude.com 的 skills、sub-agents（前段）；claude.com 部落格 steering-claude-code；anthropic.com 工程文章 effective-context-engineering、effective-harnesses-for-long-running-agents。

## 一、摘要

1. 官方明說 CLAUDE.md 只該放「Claude 無法從程式碼讀出的事」，並把目標長度訂為每檔 200 行以內；過長會降低遵循度。
2. 官方明說 CLAUDE.md 與其他提示一樣是「脈絡」不是「強制」；必須零例外的規則要改用 hook、拒絕規則（deny rule）或管理設定。
3. 官方明說「加 IMPORTANT 不會救」；一條規則一直被忽略，要不是檔案太長，就是它屬於 hook。
4. 官方有針對 Claude 5 家族的逐模型提示指南（Fable 5.2、Opus 5.5、Sonnet 5.5、Haiku 5.5 各有一頁）。其中 Fable 5.2 與 Fable 5 兩頁明確要求「遷移時檢視並刪減為舊模型寫的指令、skill、記憶與備註」。
5. Fable 5.2 頁明說：該模型「嚴格照字面遵循」累積的謹慎指令，累積的「never」規則會讓它過度要求核准或不做例行工作；建議刪掉理由已不成立的條目，並把絕對規則改寫成「寫明範圍與理由」。
6. Fable 5 頁明說：為舊模型寫的 skill 常「過度規定」（too prescriptive），可能降低輸出品質；Fable 5.2 頁明說：像「每句 20 字以內」這類硬性寫作限制可能讓文句變得斷裂。
7. 「全大寫強調要降調」的原文出處是 Opus 4.5／4.6（舊兩代）的段落，不是 Claude 5 家族。找不到針對 Claude 5 家族直接談 MUST 或 IMPORTANT 的句子，我不外推。
8. 自動記憶（auto memory）每次啟動只載入 MEMORY.md 的前 200 行或前 25KB（先到者為準）；官方建議每條一行、細節放主題檔、合併或刪除過時條目。
9. 子代理、agent teams 都標明消耗大量 token；官方建議先確認輕量做法是否足夠，且自訂子代理應專注單一任務、只給必要工具。
10. 長任務的官方做法：用檔案與 git 保存狀態、新工作階段從檔案讀回進度、一任務一工作階段、並行工作用工作樹（worktree）隔離。

## 二、CLAUDE.md 與 AGENTS.md

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| 只放 Claude 讀程式碼找不到的資訊；判斷法：能讀到且會去讀，就不寫 | https://code.claude.com/docs/en/best-practices.md 「Only write down what Claude can't find by reading the repo」（逐字） | 全部 Claude Code 模型 | 同頁列出該寫的四類：驗證指令、容易誤導處、不在 repo 的決策、已更正兩次的事 |
| 目標每個 CLAUDE.md 少於 200 行；更長會耗脈絡並降低遵循度 | https://code.claude.com/docs/en/memory.md 「Longer files consume more context and reduce adherence.」（逐字） | 同上 | 超過會在啟動與 /status 出現警告；各檔合計超過「合併上限」也會警告，但合併上限數值我沒看到（未查證） |
| 每一行都占每個任務的注意力 | best-practices.md 「every line in it takes a little of Claude's attention」（逐字） | 同上 | 這是「少即是多」的官方理由 |
| 何時新增：同一錯誤第二次出現、審查發現、重複打同一段更正、新同事也需要 | memory.md 「Claude makes the same mistake a second time」（逐字） | 同上 | 另見 features-overview「Build your setup over time」表：以觸發條件決定何時加 |
| 內容類型：建置指令、慣例、專案結構、「always do X」規則；多步驟程序或只關某一區的規則，移到 skill 或路徑限定規則 | memory.md 「Keep it to facts Claude should hold in every session」（逐字） | 同上 | |
| 寫具體可驗證的句子 | memory.md 「Use 2-space indentation」與對照的「Format code properly」（逐字） | 同上 | 官方的好壞對照例 |
| 內部矛盾時 Claude 隨機選一條；要定期清除過時或衝突指令 | memory.md 「Claude may pick one arbitrarily」（逐字） | 同上 | 使用者層與專案層規則衝突時也一樣：「Neither set overrides the other」 |
| 官方提供自動稽核：`/doctor prompt-audit` 找「為舊模型寫的指令」、不存在的檔案、互相矛盾的檔案 | memory.md 「instructions written for older models」（逐字） | Claude Code v2.1.283 以上 | 預設涵蓋 CLAUDE.md、AGENTS.md、rules、skills、子代理、輸出風格；只提報告，不自動改 |
| `/doctor` 會建議刪掉「能從程式碼推出的內容」，保留陷阱、理由、與工具預設不同的慣例 | memory.md 「it cuts content Claude can derive from the codebase」（逐字） | 同上 | 「陷阱、理由、非預設慣例」留下 |
| 分層與載入順序：由廣到窄（管理層、使用者層、專案層、本機 CLAUDE.local.md）；子目錄 CLAUDE.md 在 Claude 讀到該目錄檔案時才載入 | memory.md 「in load order, from broadest scope to most specific」（逐字） | 同上 | 路徑限定規則（`.claude/rules/` 加 `paths:`）只在讀到符合檔案時載入 |
| 匯入（@path）只幫助整理，不減少脈絡成本 | memory.md 「help you organize a long file but don't reduce its context cost」（逐字） | 同上 | 匯入深度上限四層 |
| 無路徑條件的規則檔等同寫進 CLAUDE.md | https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more 「An unscoped rule is mechanically identical to putting the content in CLAUDE.md」（引句取自摘要） | 同上 | |
| 部落格建議：CLAUDE.md 少於 200 行並指定負責人，否則「沒有人刪除」使其膨脹 | 同上 「Keep CLAUDE.md under 200 lines, give it an owner」（引句取自摘要） | 同上 | |
| AGENTS.md：專案沒有任何 CLAUDE.md／CLAUDE.local.md 時，Claude 直接讀 AGENTS.md | memory.md 「By default, Claude reads AGENTS.md only when you have no CLAUDE.md」（逐字，原文含反引號） | Claude Code v2.1.277 以上 | 使用者層 ~/.claude/CLAUDE.md 與 .claude/rules/ 不算數，仍與 AGENTS.md 並載；專案內只要出現 CLAUDE.md 或 CLAUDE.local.md，AGENTS.md 就不被讀，除非把設定「Project instructions」改成 claude-md-and-agents-md |
| 想與其他工具共用 AGENTS.md：在 CLAUDE.md 內寫 `@AGENTS.md` 匯入，或建立符號連結 | memory.md 「you can still keep it as the one file every tool shares」（逐字，節錄） | 同上 | 連結在 Windows 有限制；用 SessionStart hook 印出 AGENTS.md 的舊做法應移除（「remove it」） |
| 以 CLAUDE.md 傳達的內容是「使用者訊息」，不保證嚴格遵循 | memory.md 「there's no guarantee of strict compliance」（逐字） | 同上 | 對照第四章 hook |
| 若 CLAUDE.md 的 commit／PR 規則與 Claude Code 內建規則衝突，可關內建規則 | memory.md 「includeGitInstructions」設定段（逐字提到設定名） | 同上 | 與 Miles 的 commit 格式規則有關 |

## 三、skill

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| description 要同時寫「做什麼」與「何時用」，要具體、含關鍵詞 | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md 「should include both what the Skill does and when to use it」（逐字） | 全部 skill | 用第三人稱：「Always write in third person」（逐字）；避免「Helps with documents」這類空泛描述 |
| description 長度上限 1,024 字元；Claude Code 清單中 description 與 when_to_use 合計截斷在 1,536 字元 | 同頁 「Maximum 1,024 characters」（逐字）；https://code.claude.com/docs/en/skills.md 「truncated at 1,536 characters in the skill listing」（引句取自摘要） | 平台文件與 Claude Code 各有一個上限 | 重點用例寫在最前面：「Put the key use case first」（引句取自摘要） |
| SKILL.md 本文少於 500 行，其餘拆到別的檔 | 平台 best-practices 「Keep the SKILL.md body under 500 lines for optimal performance.」（逐字）；skills.md 同句（引句取自摘要） | 全部 skill | |
| 漸進揭露（progressive disclosure）：啟動只載名稱與 description，需要時才讀 SKILL.md 與參考檔 | 平台 best-practices 「At startup, only the metadata (name and description) from all Skills is pre-loaded.」（逐字） | 全部 skill | 參考檔自 SKILL.md 起只深一層：「Keep references one level deep from SKILL.md」（逐字）；超過 100 行的參考檔頂端放目錄 |
| 腳本（scripts）：預寫腳本比讓 Claude 臨時生成更可靠、省 token；明寫「執行」或「當參考讀」 | 同頁 「Make clear in your instructions whether Claude should」run 或 read（逐字，節錄） | 全部 skill | 腳本只有輸出占脈絡 |
| 預設假設 Claude 很聰明；只補它沒有的資訊；逐段自問是否值得 token | 同頁 「Default assumption: Claude is already very smart」（逐字） | 全部 skill | 官方稱脈絡視窗是「a public good」 |
| 依任務脆弱度調整指令的自由度：脆弱操作用精確腳本，開放任務給方向 | 同頁 「Match the level of specificity to the task's fragility and variability.」（逐字） | 全部 skill | |
| 先寫評測再寫文件：先看無 skill 時哪裡失敗，再寫最少指令補缺口 | 同頁 「Create evaluations BEFORE writing extensive documentation.」（逐字） | 全部 skill | 並用 Haiku、Sonnet、Opus 都測 |
| 避免時效性資訊；舊做法放「old patterns」摺疊區 | 同頁 「Avoid time-sensitive information」（逐字） | 全部 skill | 官方沒有談 CHANGELOG 檔（未查證） |
| 用語一致：同一概念全篇同一個詞 | 同頁 「Choose one term and use it throughout the Skill」（逐字） | 全部 skill | |
| 何時用 skill 而非 CLAUDE.md：整段已成程序而非事實；內容只偶爾需要 | skills.md 「when a section of CLAUDE.md has grown into a procedure rather than a fact」（引句取自摘要）；features-overview.md 「Put it in a skill if it's reference material Claude needs sometimes」（逐字） | Claude Code | skill 本文只在使用時載入；description 每回合都在脈絡中 |
| `disable-model-invocation: true`：Claude 不能自行啟動，只由你輸入 `/名稱` 觸發；描述也不進脈絡 | https://code.claude.com/docs/en/best-practices.md 「Claude then can't start the skill on its own」（逐字）；features-overview.md 「Use disable-model-invocation: true for skills with side effects.」（逐字） | Claude Code | 有副作用的流程（發布、交付）適用；features-overview 表明：使用者專用 skill「零成本」直到被叫用 |
| 其他 frontmatter：`user-invocable`（背景知識不給使用者叫）、`allowed-tools`、`context: fork`（在分支子代理中執行）、`paths`（限制啟用範圍）、`model` | skills.md 「Set to fork to run in a forked subagent context.」（引句取自摘要） | Claude Code | 欄位值的完整語意我只看到摘要，細節未查證 |
| 壓縮後的 skill：每個最多保留 5,000 token、合計 25,000 token；截斷保留檔案開頭 | https://code.claude.com/docs/en/context-window.md 「capped at 5,000 tokens per skill and 25,000 tokens total」（逐字） | Claude Code | 同頁：「put the most important instructions near the top of SKILL.md」（逐字） |
| skill 也適用「只寫 Claude 找不到的」 | best-practices.md 「only write down what Claude can't find on its own」（逐字） | Claude Code | |

## 四、子代理（subagent）

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| 適合：長輸出不想留在主對話、平行獨立工作、要沒看過寫作過程的審查者、需要較少工具 | https://code.claude.com/docs/en/best-practices.md 列出四種情境（逐字，節錄：「Keeping long output … out of your main conversation」） | Claude Code | |
| 成本：主要是 token；新子代理要重新蒐集脈絡，可能比原地做還慢 | 同頁 「it can end up slower than doing the task where you are」（逐字） | Claude Code | 官方還說：「not a smarter answer」（逐字，指預設同模型同任務下只得到平行或新視角） |
| 定義檔是帶 YAML frontmatter 的 Markdown；只有 name 與 description 必填；不認得的欄位會被忽略 | https://code.claude.com/docs/en/sub-agents.md 「Only name and description are required.」（引句取自摘要） | Claude Code | 常用欄位：tools、model、permissionMode、skills、memory、isolation、hooks 等 |
| 工具用允許清單限制；限制由 Claude Code 強制，不是靠提示請求 | best-practices.md 「that limit is enforced by Claude Code rather than requested in a prompt」（逐字） | Claude Code | 範例：reviewer 只給 Read、Grep、Glob |
| 簡單工作用較小模型：在定義檔設 `model: haiku` | best-practices.md 「Set model: haiku in a subagent's definition if its work is simple」（逐字，節錄） | Claude Code | 預設可用 inherit（沿用主對話模型） |
| 設計重點：單一任務、description 要能單獨指向這個子代理、限制工具、納入版本控管 | sub-agents.md 「Design focused subagents: each subagent should excel at one specific task」（逐字） | Claude Code | description 合計預算 15,000 token（同頁文字，逐字見「15,000-token description budget」） |
| description 占脈絡，要簡短；想促成主動委派可寫「use proactively」 | sub-agents.md 「Those descriptions take up context, so keep them short.」（引句取自摘要） | Claude Code | |
| 子代理從乾淨脈絡起跑，看不到對話歷史；會載入 CLAUDE.md 與 git 狀態（內建 Explore、Plan 例外） | features-overview.md 「Fresh, isolated context」（逐字，表格）；sub-agents.md 「Explore and Plan start without your CLAUDE.md files」（引句取自摘要） | Claude Code | 輸出風格不套用到子代理：output-styles.md 「styles don't change how they respond」（逐字） |
| 官方的過度使用提醒（Claude Code 面）：許多子代理各回傳詳細結果會耗脈絡 | sub-agents.md 「can consume significant context」（引句取自摘要） | Claude Code | |
| 官方的過度使用提醒（模型面，Opus 4.6）：可能在 grep 就夠時也啟動子代理 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md 「Claude Opus 4.6 has a strong tendency to use subagents」（逐字） | Opus 4.6 | 官方附一段「何時該用、何時不該用」的範例提示 |
| 官方的過度使用提醒（模型面，Opus 5）：比舊模型更常委派；可用環境變數設上限 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5.md 「Claude Opus 5 delegates to subagents more readily than prior models.」（逐字） | Opus 5 | 上限變數：CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH、CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS（同頁逐字） |
| 官方的過度使用提醒（模型面，Fable 5.2）：若 system prompt、skill、agent 檔裡有「叫它委派」的句子，先檢視這些行 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2.md 「If your system prompt, skills, or agent files tell the model to delegate, review those lines first.」（逐字） | Fable 5.2 | 同頁：子代理「can account for a large part of what a session costs」，要查預設跑哪個模型 |
| Fable 5 反向：它更可靠地派發與維持平行子代理，鼓勵明確說明何時委派 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5.md 「Claude Fable 5 dispatches parallel subagents more readily than prior models.」（逐字） | Fable 5 | 同頁建議：獨立的新脈絡驗證者子代理通常勝過自我批改（見第七章） |
| agent teams（實驗功能）比子代理更耗 token；先確認輕量做法 | https://code.claude.com/docs/en/agent-teams.md 「Agent teams add coordination overhead and use significantly more tokens than a single session.」（逐字） | Claude Code，預設關閉 | 同頁：兩位隊員改同一檔會覆蓋（「leads to overwrites」） |
| 注意：官方子代理頁說子代理「預設可再啟動子代理」 | sub-agents.md 「By default, a subagent can spawn subagents of its own」（引句取自摘要） | Claude Code | 與「子代理不能再派子代理」的常見說法相反；以官方頁為準，但該段我只看到摘要 |

## 五、hook

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| hook 提供決定性控制：動作一定會發生，不靠模型選擇 | https://code.claude.com/docs/en/hooks-guide.md 「certain actions always happen rather than relying on the LLM to choose to run them」（逐字） | Claude Code | |
| 一定要發生（或一定不能發生）的事用 hook、拒絕規則或管理設定；CLAUDE.md 只是指引 | https://code.claude.com/docs/en/best-practices.md 「CLAUDE.md is for guidelines, and Claude is allowed to decide a guideline doesn't apply.」（逐字） | Claude Code | 官方舉例：「Never read .env」「Always run the formatter after editing」「Don't touch the migrations folder」 |
| 規則被忽略時，加強語氣不是解法 | best-practices.md 「adding IMPORTANT probably won't fix it」（逐字） | Claude Code | 同頁：「that's a sign the line belongs in a hook」（逐字） |
| 護欄寫進 hook：CLAUDE.md 或 skill 內的「never edit .env」只是請求 | https://code.claude.com/docs/en/features-overview.md 「is a request, not a guarantee」（逐字） | Claude Code | 同頁：「Put guardrails in hooks.」（逐字） |
| 何時用 hook 而非 skill：動作每次都一樣做、不需要 Claude 思考 | features-overview.md 「Use a hook when the action must happen the same way every time」（逐字） | Claude Code | 例：存檔格式化、擋 `rm -rf /`、結束時發 Slack |
| 不要過度：hook 只給「零例外」的規則；偏好留在 CLAUDE.md | best-practices.md 「a hook is for a rule with zero exceptions」（逐字） | Claude Code | 反向也成立：「if you have hooks for things that are only preferences, delete them」（逐字） |
| 強制集要小：每個 hook 與拒絕規則偶爾會誤觸，要有人維護 | best-practices.md 「Whatever the scope, keep the enforced set small.」（逐字） | Claude Code | 同頁：「If you ever find yourself at forty of them, most are probably preferences」（逐字） |
| 真正強制要用 command 或 http 型 hook；prompt 與 agent 型 hook 由另一個模型判斷，不是決定性的 | best-practices.md 「so it isn't deterministic either」（逐字） | Claude Code | 可加 `onFailure: "block"` 讓 hook 當掉時也擋下動作 |
| Stop hook 可在結束前跑型別檢查並退回工作；連續擋八次後系統會放行 | best-practices.md 「blocks eight stops in a row」（逐字，節錄） | Claude Code | 可用 CLAUDE_CODE_STOP_HOOK_BLOCK_CAP 調高 |
| 壓縮後重新注入關鍵脈絡：SessionStart hook 搭配 compact matcher | hooks-guide.md 「re-inject critical context after every compaction」（逐字） | Claude Code | |
| hook 的脈絡成本為零，除非它回傳輸出 | features-overview.md 「Zero unless the hook returns output」（逐字，表格） | Claude Code | hook 輸出會進入脈絡：「Hook output lands in context.」（逐字） |
| 權限優先序：拒絕、詢問、允許；PreToolUse hook 不能繞過拒絕或詢問規則 | https://code.claude.com/docs/en/permissions.md 「Rules are evaluated in order: deny, then ask, then allow.」（逐字）；「PreToolUse hook decisions don't bypass permission rules.」（逐字） | Claude Code | |
| 自動模式（auto mode）是分類器判斷，不是硬規則；「never」規則要放拒絕規則或 hook | best-practices.md 「your "never" rules belong in deny rules or hooks」（逐字） | Claude Code | 無法擋腳本內部開檔；要 OS 層限制用沙箱（`/sandbox`） |

## 六、自動記憶（auto memory）

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| 分工：CLAUDE.md 是你寫的指令與規則；自動記憶是 Claude 自己寫的學習與模式；兩者都每次啟動載入並視為脈絡 | https://code.claude.com/docs/en/memory.md 「Claude treats them as context, not enforced configuration.」（逐字） | Claude Code | 要寫進 CLAUDE.md，需明說「add this to CLAUDE.md」；說「remember」則存進自動記憶 |
| 記憶有四種類型：user、feedback、project、reference | memory.md 列出四類（逐字，frontmatter 的 type 欄） | Claude Code | project 類是「Claude can't derive from the code or git history」的進行中工作、期限、決策 |
| Claude 不存能從程式碼推出的內容，也不存 CLAUDE.md 已經寫的 | memory.md 「Claude skips anything it can derive from the codebase」（逐字） | Claude Code | |
| 位置：`~/.claude/projects/<project>/memory/`；同一 git repo 的所有工作樹與子目錄共用一個記憶目錄；只在本機 | memory.md 「share one auto memory directory」（逐字，節錄） | Claude Code | 可用 `autoMemoryDirectory` 改位置；用 `autoMemoryEnabled` 開關 |
| 每次啟動只載入 MEMORY.md 前 200 行或前 25KB，先到者為準；超過的內容啟動時不載入 | memory.md 「The first 200 lines of MEMORY.md, or the first 25KB, whichever comes first」（逐字） | Claude Code | Claude 應把細節移到主題檔，MEMORY.md 保持精簡 |
| 清理：每條一行、細節放主題檔、合併或刪除過時條目；系統在寫入後會提醒超限 | memory.md 「merge or drop stale entries」（逐字，節錄） | Claude Code | 超限時寫入仍成功，但會回傳要求重寫索引的錯誤 |
| 檔案是純 Markdown，隨時可編輯或刪除；`/memory` 可瀏覽 | memory.md 「Auto memory files are plain markdown you can edit or delete at any time.」（逐字） | Claude Code | 記憶檔不受 `cleanupPeriodDays` 清理，要自己刪 |
| 主對話的自動記憶不載入子代理；子代理有自己的 `memory` 欄位與獨立目錄 | memory.md 「The main conversation's auto memory isn't loaded into subagents」（逐字） | Claude Code | |
| Fable 5 的記憶寫法建議：一則一檔、首行一句摘要、記更正也記確認過的做法、不存 repo 已記錄的、更新而非複製、刪除錯的 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5.md 「Store one lesson per file with a one-line summary at the top.」（逐字） | Fable 5（對照 Opus 4.8） | 同段：「delete notes that turn out to be wrong」（逐字） |
| 記憶與備註會累積謹慎指令；遷移前刪除理由已不成立者 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2.md 「delete the cautions whose reason no longer holds」（逐字） | Fable 5.2（對照 Fable 5.1、Opus 5.5） | 同段：模型自己寫的備註也算；系統已卡住可「restarting it with its memory and notes trimmed」，並保留原件（逐字） |

## 七、長任務與跨工作階段

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| 無關任務之間用 `/clear`；壓縮時可附重點 `/compact focus on …` | https://code.claude.com/docs/en/best-practices.md 「/clear between unrelated tasks.」（逐字） | Claude Code | 同頁：「after two failed corrections run /clear and write a better prompt」（逐字，節錄） |
| 自動壓縮會保留什麼：專案根 CLAUDE.md 與無條件規則、自動記憶從磁碟重新注入；路徑限定規則與子目錄 CLAUDE.md 要等再次讀到檔案才重載 | https://code.claude.com/docs/en/context-window.md 「Re-injected from disk」（逐字，表格） | Claude Code | 壓縮後必須持續的規則：「If a rule must persist across compaction」要移除 `paths:` 或放根 CLAUDE.md（逐字） |
| 以檔案保存規格：先訪談後寫 SPEC.md，再開新工作階段照它實作 | best-practices.md 「start a fresh session to build from it」（逐字） | Claude Code | |
| 跨天工作：`/rename 名稱`，之後 `claude --resume 名稱`；`claude --continue` 接最近一個 | best-practices.md 「picks it back up later, checkpoints included」（逐字） | Claude Code | 恢復後會還原對話、模型、權限模式；旗標如 --add-dir 要重傳（https://code.claude.com/docs/en/sessions.md） |
| 用檔案與 git 讓新脈絡視窗自己接續；清空脈絡時可考慮「全新開始」而非壓縮 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md 「Claude's latest models are extremely effective at discovering state from the local filesystem.」（逐字，原文為彎引號撇號） | 官方稱「latest models」，含 Fable 5.2 等（該頁開頭列出） | 同段建議：首個脈絡視窗另用不同提示建框架、測試用結構化格式（如 tests.json）、進度用自由文字、用 git 追蹤 |
| 狀態資料用結構化格式（JSON）；進度筆記用自由文字；用 git 當狀態檢查點 | 同頁 「Use git for state tracking」（逐字，小標題） | 同上 | |
| 長任務的工程文章做法：初始化代理寫進度檔，後續工作階段先讀 git 紀錄與進度檔 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents 「Read the git logs and progress files to get up to speed」（引句取自摘要） | 非 Claude Code 專屬的代理設計文章；撰寫時間未查證 | 同文：一次只做一個功能 |
| 脈絡不是越多越好：長脈絡有「context rot」；維持最小必要資訊 | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents 「the minimal set of information that fully outlines your expected behavior」（引句取自摘要） | 通用 | 同文：結構化筆記（NOTES.md）、壓縮、子代理架構 |
| 無人值守前先問五題：知道完成長怎樣、能否自檢、能碰什麼、何時停、成果交給誰簽核 | best-practices.md 「Does it know what done looks like?」（逐字） | Claude Code | 同頁：「have a person approve the result at the end」（逐字，節錄） |
| 文字結尾的回合當作「報告」而非完成；用檢查清單檔追蹤未完項；連續自動催促兩三次後要停 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5.md 「Treat a text-only end of turn as a report」（逐字，節錄） | Opus 5.5（對照 Opus 5） | 「Keep the task's parts in a checklist the model updates, such as a to-do tool or a file.」（逐字） |
| Fable 5 在長任務中需要「落實進度宣稱」：回報前對照本工作階段的工具結果 | prompting-claude-fable-5.md 「Before reporting progress, audit each claim against a tool result from this session.」（逐字） | Fable 5 | 官方稱此句幾乎消除捏造的狀態回報 |
| 避免向模型顯示剩餘 token 倒數，會觸發「建議開新工作階段」 | prompting-claude-fable-5.md 「Avoid surfacing explicit context-budget counts where possible.」（逐字） | Fable 5 | Fable 5.2 頁亦說移除提示中的大額 token 預算可降成本、效能相同 |
| 平行工作用工作樹，各有自己的檔案與分支 | https://code.claude.com/docs/en/worktrees.md 「gives it a separate copy of the files to edit」（逐字，節錄） | Claude Code | `claude --worktree 名稱`；乾淨且未命名的工作樹離開時自動刪除；`.worktreeinclude` 複製 .env 等被忽略檔 |
| 工作樹共用：自動記憶（同 repo）、專案範圍外掛、核准規則寫入主檢出的 settings.local.json | worktrees.md 「A worktree gets its own files and branch, but it shares the following with the main checkout」（逐字） | Claude Code | CLAUDE.md 與 .claude/rules 從工作樹載入；hook 路徑 `${CLAUDE_PROJECT_DIR}` 不跟著工作樹走，要讀 hook 輸入的 `cwd` |
| 多工作階段協作：跨工作階段訊息；agent teams 僅限獨立可分割的工作，從研究與審查開始 | https://code.claude.com/docs/en/agent-teams.md 「Start with research and review」（逐字，小標題） | Claude Code（agent teams 為實驗功能） | 隊員不繼承主持人的對話歷史；每人分不同檔案 |
| 官方的「迭代式 skill 開發」：用一個 Claude 寫 skill、另一個全新 Claude 實測 | 平台 skill best-practices 「Claude A」「Claude B」流程（逐字，小標題） | 全部 skill | |

## 八、模型更新帶來的寫法改變

先交代範圍：官方有逐模型提示指南。查到的 Claude 5 家族頁面如下。

| 模型 | 頁面 | 本次取得狀況 |
|---|---|---|
| Fable 5.2 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2 | 全文（逐字） |
| Fable 5（對照 Opus 4.8） | .../prompting-claude-fable-5 | 全文（逐字） |
| Opus 5.5（對照 Opus 5） | .../prompting-claude-opus-5-5 | 全文（逐字） |
| Opus 5（對照 Opus 4.8） | .../prompting-claude-opus-5 | 全文（逐字） |
| Sonnet 5.5（對照 Sonnet 5） | .../prompting-claude-sonnet-5-5 | 全文（逐字） |
| Haiku 5.5（對照 Haiku 4.5） | .../prompting-claude-haiku-5-5 | 只在總覽頁看到列的一行摘要，未抓全文（未查證內容） |

| 主題 | 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|---|
| 指令遵循精確度 | 照字面遵循；舊模型的指令要重檢視 | prompting-claude-fable-5-2.md 「Claude Fable 5.2 follows these instructions closely」（逐字） | Fable 5.2 | 指累積在記憶、備註、指令檔、代理間訊息裡的謹慎指令 |
| 指令遵循精確度 | 簡短指令即可引導多數行為，不必逐項列舉 | prompting-claude-fable-5.md 「Instruction-following is improved enough that you can steer most behaviors with a brief instruction」（逐字，節錄） | Fable 5（對照 Opus 4.8） | 官方例：一句「先講結果」的簡短指令效果等同列出每種情況 |
| 指令遵循精確度 | 字面遵循可能讓過濾型指令少報 | prompting-claude-opus-5.md 「might follow that instruction literally and report less」（逐字） | Opus 5（對照 Opus 4.8） | 官方建議改成「全報，另做一步過濾」；Opus 4.8 頁亦列「literal instruction following」（總覽頁表格） |
| 指令遵循精確度 | 核准規則要列出確切動作，模型照寫的執行 | prompting-claude-fable-5-2.md 「name the exact actions they cover, because the model applies them as written」（逐字） | Fable 5.2 | 官方測試：規則裡列「對外發訊息」需核准，模型把約一半的例行請求都擋住 |
| 強調語氣（全大寫 MUST、CRITICAL） | 對 Opus 4.5／4.6：把攻擊性措辭降調，因為它們對 system prompt 更敏感，易過度觸發 | claude-prompting-best-practices.md 「The fix is to soften any aggressive language.」（逐字） | Opus 4.5、Opus 4.6（不是 Claude 5） | 官方例：把「CRITICAL: You MUST use this tool when...」改成「Use this tool when...」 |
| 強調語氣 | Claude Code 官方：加 IMPORTANT 多半無效，問題在檔案太長或該用 hook | best-practices.md 「adding IMPORTANT probably won't fix it」（逐字） | Claude Code 現行文件，未標模型 | 這是 Claude Code 文件，不是模型提示指南 |
| 強調語氣 | 針對 Claude 5 家族直接談 MUST／IMPORTANT／全大寫的句子：未找到 | 我讀過 Fable 5.2、Fable 5、Opus 5.5、Opus 5、Sonnet 5.5 五頁，沒有看到 | Claude 5 家族 | 不外推。Fable 5.2 頁有一句相關：「rewrite absolute rules so that they state their scope and reason」（逐字） |
| 解釋理由 | 提供指令背後的動機，Claude 能類推 | claude-prompting-best-practices.md 「explaining to Claude why such behavior is important」（逐字，節錄） | 全部現行模型 | 官方對照：「NEVER use ellipses」較弱，說明「會被朗讀引擎讀」較強 |
| 解釋理由 | 給原因，不只給請求；長期運作的代理尤其要 | prompting-claude-fable-5.md 「Give the reason, not only the request」（逐字，小標題） | Fable 5 | 附範本：說明大任務、對象、產出用途 |
| 解釋理由 | 絕對規則要寫範圍與理由；例外要寫進規則本身 | prompting-claude-fable-5-2.md 「Write the exception into the rule.」（逐字，小標題） | Fable 5.2 | 官方測試：另寫一行「已核准的步驟有許可」效果不大，規則本身寫「要先取得許可」才有效 |
| 範例的影響 | 3 至 5 個相關、多樣、用標籤包起來的範例最可靠 | claude-prompting-best-practices.md 「Include 3–5 examples for best results.」（逐字） | 全部現行模型 | 該頁另說：若技術指名特定模型，要在自己的評測重測才能用於別的模型 |
| 範例的影響 | 正面範例比「不要怎樣」的指令有效 | prompting-claude-opus-5.md 「Positive examples of the communication style you want tend to be more effective」（逐字） | Opus 5 | 前端頁另說：指名要避免的具體樣式有效，泛稱「avoid a generic AI look」只是換一種預設（Opus 5.5 頁） |
| 過度工程傾向 | Opus 4.5／4.6 會多加檔案、抽象層、彈性；用「只做被要求的」提示壓制 | claude-prompting-best-practices.md 「have a tendency to overengineer」（逐字，節錄） | Opus 4.5、Opus 4.6 | 官方給完整範本提示 |
| 過度工程傾向 | Fable 5 在高努力度會多做整理或重構；提供「不要超出任務」的範本 | prompting-claude-fable-5.md 「Don't add features, refactor, or introduce abstractions beyond what the task requires.」（逐字） | Fable 5 | |
| 過度工程傾向 | Sonnet 5.5 傾向加測試、文件、輔助檔，所有努力度都有，越高越多 | prompting-claude-sonnet-5-5.md 「tends to add tests, documentation, and small supporting files」（逐字，節錄） | Sonnet 5.5 | 若要限縮只做被要求的，官方給兩段提示的第二段 |
| 過度工程傾向 | Fable 5.2 對「這份程式碼是你的」一句很敏感；加上它會合併重複與順手修，token 約 1.5 倍 | prompting-claude-fable-5-2.md 「This codebase is yours」（逐字，範例句開頭） | Fable 5.2 | 若使用者擁有程式碼且要最小改動則不要加；放在別處的「no drive-by refactors」規則不會抵銷 |
| 過度工程傾向 | Opus 5 會自行擴大任務範圍；且自己驗證，加驗證指令反而過度驗證 | prompting-claude-opus-5.md 「instructions like these cause over-verification on Claude Opus 5」（逐字） | Opus 5 | 官方建議移除「用子代理驗證」類句子；Fable 5 頁相反：獨立新脈絡驗證者常勝過自我批改 |
| 平行工具呼叫 | 現行模型會自行平行呼叫獨立工具，可用提示調到接近百分之百或降低 | claude-prompting-best-practices.md 「Claude's latest models run independent tool calls in parallel.」（逐字） | 現行模型 | 官方附範本；Fable 5.1 在長代理迴圈要每輪用回合範圍的系統訊息重送（該頁逐字，未抓 Fable 5.1 全頁） |
| 思考與努力度 | 努力度（effort）是主要旋鈕；等級名稱在各模型間不是同樣的思考量，要重跑掃描 | prompting-claude-fable-5-2.md 「rerun your effort sweep instead of carrying over a setting」（逐字） | Fable 5.2（預設 high） | Opus 5.5 預設 medium；Sonnet 5.5 預設 high（各該頁逐字）。Claude Code 的預設努力度未查證 |
| 思考與努力度 | 要少思考，降努力度；叫模型「少想」不可靠 | prompting-claude-sonnet-5-5.md 「Asking the model in the system prompt to think less doesn't reliably reduce its thinking.」（逐字） | Sonnet 5.5 | Fable 5.2 頁：「answer directly」類句子在 medium 以上沒用，要移除（逐字，Review instructions 段） |
| 思考與努力度 | 低努力度較易提早停手；要寫「做完整件事」的提示 | prompting-claude-fable-5-2.md 「more often at low and medium effort」（逐字，節錄） | Fable 5.2、Sonnet 5.5 | 官方測試：加提示後提早收工約減半，輸出 token 增約 30% |
| 長時間自主工作 | Fable 5 單回合可跑很久；要調整逾時、串流、進度顯示；可考慮非同步檢查 | prompting-claude-fable-5.md 「Longer turns by default」（逐字，小標題） | Fable 5 | |
| 長時間自主工作 | Fable 5.2 的謹慎指令會累積；要清備註、列出無須核准的步驟 | prompting-claude-fable-5-2.md 「Keep caution from piling up」（逐字，小標題） | Fable 5.2 | 官方測試：一則「永不重試」的舊備註讓重試率從幾乎全部降到約四成 |
| 為舊模型寫的內容 | 遷移時全面檢視：標準委派指令、token 預算、改寫歷史的工具碼、思考指令、寫作風格規則、累積的規則與記憶 | prompting-claude-fable-5-2.md 「Review instructions written for earlier models」（逐字，小標題） | Fable 5.2（對照 Fable 5.1、Opus 5.5） | 該頁「Where to start」第二步：讀你帶過來的 system prompt、skill、代理檔、記憶、備註（逐字） |
| 為舊模型寫的內容 | 為舊模型寫的 skill 常過度規定，可能降低品質 | prompting-claude-fable-5.md 「Skills developed for prior models are often too prescriptive」（逐字，節錄） | Fable 5（對照 Opus 4.8） | 同段：模型能自己更新 skill；能力提升是「re-evaluate which instructions, tools, and guardrails are still needed」的契機（同頁逐字） |
| 為舊模型寫的內容 | 硬性寫作字數限制會讓 Fable 5.2 的文字斷裂 | prompting-claude-fable-5-2.md 「can make its prose choppy」（逐字） | Fable 5.2 | 官方例：「one instruction per sentence, in 20 words or fewer」。同頁另建議報告「Write mostly in the style of ASD-STE100 Simplified Technical English」（逐字）；兩句並存，限度不同：前者是硬上限，後者是「mostly」 |
| 為舊模型寫的內容 | 提示或 skill 若要求模型把推理寫進回應，可能被 `reasoning_extraction` 拒絕 | prompting-claude-fable-5.md 「Don't instruct Claude to reproduce its reasoning in the response.」（逐字） | Fable 5、Fable 5.2、Opus 5、Opus 5.5、Sonnet 5.5（各頁都有同類段落） | 官方建議改讀 summarized thinking 區塊；可要求簡短說明或行動摘要 |
| 通用基準（所有現行模型） | 清楚直接；用「給沒有脈絡的新同事看」測試 | claude-prompting-best-practices.md 「Show your prompt to a colleague with minimal context」（逐字，節錄） | 全部現行模型 | |
| 通用基準 | 移植到新模型時不要照搬 anti-laziness 提示；舊提示可能過度觸發 | claude-prompting-best-practices.md 「Tune anti-laziness prompting」（逐字，小標題） | Claude 4.6 以後（該頁原文寫 Claude 4.6 models） | |
| 溝通風格 | 最新模型較簡潔、較少冗長摘要；Opus 5 例外：預設較長，要明確要求簡短 | claude-prompting-best-practices.md 「Claude Opus 5 is an exception on verbosity」（逐字） | 現行模型；Opus 5 | Fable 5 頁：「Terse shorthand is fine between tool calls」但最終報告要寫給沒看過過程的人（逐字） |
| 完成回報 | Fable 5.2 的最終報告要自成一體；官方給範本含「mostly STE100」 | prompting-claude-fable-5-2.md 「Make reports easy to follow」（逐字，小標題） | Fable 5.2 | |
| 本表缺口 | Claude 5 家族中，沒有一頁用「MUST 已不再需要」這類措辭；Haiku 5.5 頁未讀；Fable 5.2 的 what's-new 頁未讀 | — | — | 標為未查證，見第十一章 |

## 九、外掛、輸出風格、權限

| 官方建議 | 出處與引句 | 適用對象或模型 | 備註 |
|---|---|---|---|
| 每個功能都吃脈絡，太多會產生雜訊並讓 skill 觸發失準 | https://code.claude.com/docs/en/features-overview.md 「it can also add noise that makes Claude less effective」（逐字） | Claude Code | 同頁表：CLAUDE.md 與輸出風格「Every request」；skill「Low (descriptions every request)」；hook 零 |
| 已啟用的外掛屬於每個工作階段，不只你用它的那次；可叫用的 skill、agent 的名稱與描述每回合都在脈絡 | https://code.claude.com/docs/en/plugins/overview.md 「An enabled plugin is part of every session」（逐字） | Claude Code | 可看「Context cost」估計、`/plugin` 的 Installed 頁籤「Not used recently」群、`claude plugin disable` 停用 |
| 沒有外掛需求就不用外掛：skill、子代理、hook、MCP 單獨即可運作 | plugins/overview.md 「Skills, subagents, hooks, and MCP servers all work on their own, without a plugin.」（逐字） | Claude Code | 外掛用於打包與分享 |
| 用 `/usage` 看各 skill、子代理、外掛、MCP 伺服器占多少 | best-practices.md 「it breaks your usage down by skill, subagent, plugin, and MCP server」（逐字） | Pro、Max、Ultra、Team、Enterprise | 超過 10% 會標示 |
| 不想讓 skill 描述進脈絡：`disable-model-invocation: true`；別人寫的 skill 用 `skillOverrides` | features-overview.md 「skillOverrides」（逐字，表格註腳） | Claude Code | |
| 輸出風格：設定整個工作階段的角色、語氣、回應格式；適合「你一直要它更短、更詳細或固定格式」 | https://code.claude.com/docs/en/output-styles.md 「sets Claude's role, tone, and response format for every response in a session」（逐字） | Claude Code | features-overview「Build your setup over time」表同樣列此觸發條件 |
| 輸出風格只是指令，不保證；一定要發生的事用 hook | output-styles.md 「It doesn't guarantee that something always happens or never happens」（逐字，節錄） | Claude Code | |
| 輸出風格每個請求都送，吃輸入 token（快取後降低）；自訂風格預設會去掉內建的軟體工程指令，除非 `keep-coding-instructions: true` | output-styles.md 「Claude Code sends the active style's instructions with every request.」（逐字） | Claude Code | 風格只套用主對話與分支（fork）；一般子代理用自己的 system prompt，風格不套用 |
| 風格與 CLAUDE.md 分工：CLAUDE.md 放「該知道什麼」，輸出風格放「怎麼回應」 | features-overview.md 「CLAUDE.md carries what Claude should know, and an output style sets how Claude responds.」（逐字） | Claude Code | 兩者都是指令，都不強制 |
| 權限規則依序評估：拒絕、詢問、允許；先中先贏，具體度不改順序 | https://code.claude.com/docs/en/permissions.md 「rule specificity doesn't change the order」（逐字） | Claude Code | 寬的拒絕規則會蓋掉窄的允許規則 |
| 各層設定檔：個人偏好放使用者層或 settings.local.json；`.claude/settings.json` 隨 repo 共享；管理設定不可被個人覆蓋 | best-practices.md 「.claude/settings.json and the hooks in it belong to the repo.」（逐字） | Claude Code | 「Yes, and don't ask again」會寫入主檢出的 `.claude/settings.local.json`（permissions.md，逐字提到） |
| 新工作階段預設進入 auto mode，由分類器審查風險動作 | best-practices.md 「new terminal and VS Code sessions start in auto mode」（逐字，節錄） | Claude Code | 預設行為與你的設定是否覆寫：未查證 |
| 保持小而精的整體：官方 `/doctor` 可找未使用的 skill、MCP、外掛 | 官方該功能的細節我只在你環境的 skill 清單說明中看到，未抓官方頁面 | Claude Code | 未查證 |

## 十、對照 Miles 現況（只列事實與官方建議的相反處，不提方案）

資料來源：我讀了 AGENTS.md 行數、各 skill 目錄、MEMORY.md 位元組數，其餘依你提供的描述。

| 項目 | Miles 現況 | 官方相反或相衝突處 | 把握度 |
|---|---|---|---|
| MEMORY.md 超出載入上限 | 152 行、28,110 位元組（我實測）。官方上限：前 200 行或前 25KB，先到者為準 | 位元組超限。以 25,000 位元組計，約第 132 行之後；以 25,600 計，約第 136 行之後，啟動時不載入。行數沒超過 | 高（數值實測；25KB 取 25,000 或 25,600 兩種算法皆超限） |
| AGENTS.md 長度 | 157 行，在官方「少於 200 行」目標內。但全域 CLAUDE.md 另有 47 行，並載；合併上限官方文字有提但我沒看到數值 | 單檔不衝突。合併是否超限：未查證 | 中 |
| 陷阱表 32 列 | 每列帶日期出處，內容多為過去發生的錯誤與已知規則的提醒 | 官方「Only write down what Claude can't find」只收讀不到的資訊；Fable 5.2 要求「delete the cautions whose reason no longer holds」並把絕對規則寫成「範圍與理由」。官方沒有談「日期欄」本身；陷阱表有無已失效列，我沒逐列核對 | 中 |
| 規則重複 | 同一規則同時出現在 AGENTS.md、全域 CLAUDE.md、記憶卡（AGENTS.md 陷阱表的「出處」欄多處指向記憶卡名，如 feedback_*）、skill | 官方：自動記憶「skips anything your CLAUDE.md files already say」；矛盾時「Claude may pick one arbitrarily」。重複本身官方未直接禁止，但矛盾的風險來自重複 | 中 |
| 強調字 | AGENTS.md 與全域 CLAUDE.md 使用 MUST、MUST NOT、「禁止」、粗體 | 官方 Claude Code 文件：加強調多半無效，該用 hook。Fable 5.2：模型照字面遵循；絕對規則要寫範圍與理由。對 Claude 5 的「MUST 是否有害」官方無直接句子 | 中 |
| 零例外規則寫在文字裡 | 例：主檢出不切分支、不得 `git stash` 裸用、破壞性動作前停下、輸出禁 emoji、記憶卡「勿重問」 | 官方：必須零例外的規則用 hook、拒絕規則或管理設定。你設定檔有 hooks 與 permissions 鍵，但這些規則哪些已落在 hook：未查證 | 低 |
| 輸出風格含硬性字數 | STE100 風格檔寫「說明句不超過 30 字，操作指示不超過 25 字」，並透過 SubagentStart hook 把全文注入每個子代理 | Fable 5.2 頁點名這類規則：「can make its prose choppy」，並說遷移時先移除不需要的風格規則。同頁也建議報告用「mostly STE100」。官方對「注入所有子代理」無說法；官方說輸出風格不套用到子代理 | 中 |
| 子代理定義 | 兩個（erp-researcher、plan-auditor） | 與官方「專注單一任務」一致；是否限制 tools 我未讀檔案，未查證 | 低 |
| 記憶卡數量 | 146 個檔（含索引），MEMORY.md 索引條目 144 筆（以行首「- [」計） | 官方只談索引上限與「合併或刪除過時條目」；索引中大量條目標「已完成／已歸檔／已結案」，屬已完成的專案進度紀錄。官方記憶類型含 project，但要求內容是「Claude can't derive」的進行中工作與決策；已結案者是否仍需要，官方沒有判準句 | 中 |
| skill 結構 | 十二個資料夾；自寫七個（erp-audit、erp-plan、oq-manage、vault-audit、vault-ingest、wiki-amend、linear-delivery）SKILL.md 皆 71 至 151 行，低於 500 行；description 以位元組算 243 至 1,204（中文每字三位元組，字元數約為三分之一） | 行數與 description 長度都在官方上限內，不衝突 | 高 |
| CHANGELOG 放 skill 目錄 | 十二個資料夾中六個有 CHANGELOG.md（我數得） | 官方沒有談 CHANGELOG（未查證）。官方 skill 指引說「避免時效性資訊」，歷史應放「old patterns」摺疊區；檔案只有被讀才占脈絡 | 低 |
| AGENTS.md 與 skill 描述的路由重複 | AGENTS.md「工作入口」表把情境對應到 skill；skill 的 description 也寫了「用：…不用：…」觸發條件 | 官方：觸發靠 description；CLAUDE.md 放每次都要知道的事。兩處都寫觸發條件，官方沒有直接禁止，但 skill 描述每回合都載入 | 中 |
| 為舊模型寫的內容 | 多個 skill 與 AGENTS.md 寫於 2026-08 至 11 月 | 官方要求遷移到 Fable 5.2 時逐一檢視（見第八章）；`/doctor prompt-audit` 是官方檢查工具（v2.1.283 以上），你是否已跑過：未查證 | 中 |
| AGENTS.md 讀取條件 | 專案只有 AGENTS.md，沒有專案 CLAUDE.md（依你提供的檔案清單） | 符合官方「沒有 CLAUDE.md 才直接讀 AGENTS.md」。注意：若加入專案 CLAUDE.md 或 CLAUDE.local.md，AGENTS.md 預設就不再被讀 | 高 |
| 工作樹與記憶 | 代理一律在工作樹作業 | 官方：同 repo 的工作樹共用一個自動記憶目錄，所以並行工作階段寫入同一份記憶；與你「並行工作階段」的做法需自行確認互相覆蓋風險（官方未談衝突處理） | 低 |

## 十一、未查證

| 編號 | 項目 | 缺什麼 |
|---|---|---|
| 1 | Haiku 5.5 提示指南內容 | 只看到總覽頁的一行摘要，沒抓全文 |
| 2 | Fable 5.2 的 what's-new 頁、Opus 5.5 與 Sonnet 5.5 的遷移指南 | 未抓；遷移指南主要談 API 破壞性變更，與環境設定關聯較小，但我沒逐頁確認 |
| 3 | Fable 5.1 提示指南 | 只在總覽頁與其他頁的連結看到，未抓全文 |
| 4 | skills.md 後段（技能清單預算、description 被截短的段落）與 sub-agents.md 後段以外的欄位語意 | 抓取被截斷，只有摘要 |
| 5 | Claude Code 的預設努力度與預設模型 | 沒找到明確文字（best-practices 只說預設 Opus 5.5，但未談 Claude Code 努力度預設） |
| 6 | 「合併上限」（多個指令檔各自不超限但加總超限）的數值 | memory.md 提到會警告，沒給數值 |
| 7 | 官方對「skill 目錄放 CHANGELOG」的說法 | 沒有找到；只能引用「避免時效性資訊」 |
| 8 | 官方對「同一規則重複寫在多處」的明確禁止句 | 只找到「矛盾時隨機選一條」；沒有「重複本身不好」的句子 |
| 9 | 官方 `/doctor` 找未使用 skill、MCP、外掛的細節 | 只在你環境的 skill 說明看到，沒抓官方頁面 |
| 10 | 你的設定中哪些零例外規則已落在 hook | 我沒讀 settings.json 與 hook 腳本 |
| 11 | 官方在 anthropic.com 工程文章的發表日期與適用模型 | 摘要未提供；不能判斷是否針對 Claude 5 家族 |
| 12 | 官方 skill 撰寫指南（platform.claude.com）的更新時間與是否已為 Claude 5 家族改寫 | 頁面內有提 Claude Haiku、Sonnet、Opus 三級，未見 Claude 5 專屬字樣；Fable 5 頁另有 skill 段落，兩者並存 |

未查證項目共 12 項。

## 抓回內容中夾帶、寫給 AI 的指示（視為資料，未照做）

- 多數 code.claude.com 頁面開頭有同一段：「Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt … Use this file to discover all available pages before exploring further.」這是頁首樣板，我沒有照做（我用文件地圖達到同樣目的）。
- Fable 5.2 遷移指南頁首：「/claude-api migrate this project to claude-fable-5-2」，是給開發者的遷移指令範例，與本任務無關，未執行。
- 各提示指南內附大量「加到 system prompt 的範本句」（如「Please avoid stopping while you still owe work…」），是寫給 API 使用者的範本，不是對我的指示，未採用。
- 我抓取輸出目錄時還看到與本任務無關的外掛檔案（product-management 外掛的 plugin.json、SKILL.md 片段），是其他工作留在同一暫存區的內容，未讀入結論。

## 主要網址清單

- https://code.claude.com/docs/en/memory.md
- https://code.claude.com/docs/en/best-practices.md
- https://code.claude.com/docs/en/features-overview.md
- https://code.claude.com/docs/en/skills.md
- https://code.claude.com/docs/en/sub-agents.md
- https://code.claude.com/docs/en/hooks-guide.md
- https://code.claude.com/docs/en/context-window.md
- https://code.claude.com/docs/en/sessions.md
- https://code.claude.com/docs/en/worktrees.md
- https://code.claude.com/docs/en/agent-teams.md
- https://code.claude.com/docs/en/output-styles.md
- https://code.claude.com/docs/en/permissions.md
- https://code.claude.com/docs/en/plugins/overview.md
- https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2.md
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5.md
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5.md
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5.md
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5.md
- https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
