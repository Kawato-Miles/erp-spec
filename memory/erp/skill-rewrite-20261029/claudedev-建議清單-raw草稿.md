---
type: raw
status: raw
created-at: 2026-10-29
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - 情境工程
  - skill 撰寫
  - sub-agent 派工
  - 稽核流程
  - Claude 5 世代
related-vault:
  - "[[審查知識路由]]"
  - "[[規劃品質評分準則]]"
  - "[[稽核誤判記錄]]"
raw-source-link: https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/（起點；全部 16 篇 URL 見下方總表）
---

# claude.dev 對 Claude 5 世代的使用建議（情境工程、CLAUDE.md、skill、sub-agent、稽核）

> 草稿狀態：待 Miles 確認後才以 vault-ingest mode A 寫入 `raw/`。確認前本檔只放在 `memory/erp/skill-rewrite-20261029/`。

## 原始素材

摘錄重點，非全文轉錄。來源只限 `https://claude.dev` 網域。逐篇的主張、建議、反模式與英文關鍵句見同資料夾 `claudedev-文章逐篇摘錄.md`。

### 來源總表

| 編號 | 標題 | URL | 頁面日期 |
|------|------|-----|----------|
| 1 | The new rules of context engineering for Claude 5 generation models | https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/ | 2026-07-24 |
| 2 | Lessons from building Claude Code: How we use skills | https://claude.dev/blog/lessons-from-building-claude-code-how-we-use-skills/ | 2026-06-03 |
| 3 | A harness for every task: dynamic workflows in Claude Code | https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/ | 2026-06-02 |
| 4 | Using Claude Code: The unreasonable effectiveness of HTML | https://claude.dev/blog/using-claude-code-the-unreasonable-effectiveness-of-html/ | 2026-05-20 |
| 5 | Lessons from building Claude Code: Prompt caching is everything | https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/ | 2026-04-30 |
| 6 | Seeing like an agent: how we design tools in Claude Code | https://claude.dev/blog/seeing-like-an-agent/ | 2026-04-10 |
| 7 | Getting the most out of Opus 5.5 in Claude and Claude Code | https://claude.dev/blog/getting-the-most-out-of-opus-5-5/ | 2026-09-22 |
| 8 | Using Claude Code: Spending your effort | https://claude.dev/blog/spending-your-effort/ | 2026-09-25 |
| 9 | What a task costs on Opus 5.5 | https://claude.dev/blog/what-a-task-costs-on-opus-5-5/ | 2026-09-25 |
| 10 | Building with Claude Sonnet 5.5 | https://claude.dev/blog/building-with-claude-sonnet-5-5/ | 2026-09-28 |
| 11 | Automating eval design and hillclimbing with Claude | https://claude.dev/blog/automating-eval-design-and-hillclimbing/ | 2026-09-28 |
| 12 | Getting started with Claude Code mods | https://claude.dev/blog/getting-started-with-claude-code-mods/ | 2026-10-01 |
| 13 | Claude Code in the cloud: a field guide to cloud sessions | https://claude.dev/blog/claude-code-in-the-cloud/ | 2026-10-06 |
| 14 | Building effective agent automations | https://claude.dev/blog/building-effective-agent-automations/ | 2026-10-08 |
| 15 | How the Claude Code team does code review | https://claude.dev/blog/solving-code-review-at-anthropic/ | 2026-10-15 |
| 16 | How we made claude.ai 3x faster in two weeks | https://claude.dev/blog/how-we-made-claude-ai-faster/ | 2026-09-23 |

清單來源：`https://claude.dev/sitemap.xml` 的 16 篇 `/blog/` 文章。首頁與 `/terminal/` 清單對得上。

### 建議清單（主題 × 建議 × 出處）

#### 主題 1：情境工程

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 用判斷取代規則。刪除過度約束。 | "newer models have better judgement and can handle these decisions well without explicit rules" | 1 |
| Claude Code 系統提示刪去八成以上，編碼評測無可量測退步。 | "We removed over 80% of Claude Code's system prompt for models like Claude Opus 5 and Claude Fable 5" | 1 |
| 不給範例，改設計介面。範例會限制探索空間。 | "giving examples actually constrains them to a certain exploration space" | 1 |
| 工具用法寫在工具說明，不在系統提示重複。 | "put instructions on how to use tools in the tool descriptions rather than the system prompt" | 1 |
| 漸進式揭露：一棵檔案樹，分時載入。 | "consider having a tree of files that can be loaded at the right time" | 1, 6 |
| 讓模型自己搜尋找情境，不預先塞入。 | "the ones that let Claude find its own context" | 6 |
| 靜態在前、動態在後。更新資訊用訊息帶入，不改提示。 | "static content first, dynamic content last" | 5 |
| 參考資料用豐富形式：HTML 成品、測試、程式碼、評分準則。 | "Claude can handle increasingly more complicated references" | 1, 4 |
| 單一長情境有三種失誤：偷懶、偏愛自己的結果、目標漂移。 | "Agentic laziness" / "Self-preferential bias" / "Goal drift" | 3 |
| 長任務用任務檔撐過壓縮，讀檔不讀捲動紀錄。 | "Keep a checklist in TASKS.md" | 7 |
| 無關任務之間清空。休息前壓縮並註明要留什麼。 | "Use /clear between unrelated tasks, and /compact at a break with a note on what to keep" | 9 |

#### 主題 2：CLAUDE.md 與專案指令

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 保持輕量。只寫 repo 用途，篇幅花在程式庫陷阱。 | "Keep your CLAUDE.md lightweight ... spend most of the tokens on gotchas" | 1 |
| 不寫 Claude 看檔案就知道的事。 | "Avoid stating 'the obvious' things Claude should know by looking at your file system" | 1 |
| 多組驗證指示拆成驗證 skill，從 CLAUDE.md 引用。 | "create a verification skill and reference it from your CLAUDE.md" | 1 |
| 寫「繼續做」與「停下詢問」規則。破壞性操作前停。 | "Stop and ask only when you can't continue without me, or before anything destructive" | 7 |
| 在 CLAUDE.md 規定每次結束的摘要格式。 | "End every run with three headings: Blocked on me, Changed, Found" | 7 |
| 每行每輪重送。成本文件建議少於 200 行。 | "The costs docs suggest keeping it under 200 lines" | 9 |
| CLAUDE.md 說專案是什麼：技術堆疊、慣例、目標、非目標。 | "the stack, the conventions, the goals and the non-goals" | 15 |
| 從歷次工作階段挖出反覆更正，對抗式驗證後才寫回。 | "would this rule have prevented a real mistake?" | 3 |
| 不再用 `#` 熱鍵把記憶寫進 CLAUDE.md，改自動記憶。 | "Claude now automatically saves memories that are relevant to the work" | 1 |
| 用 `/doctor` 或 `/claude-api prompt-audit` 瘦身與抓舊寫法。 | "use the command /doctor in Claude Code to rightsize your skills, and CLAUDE.md files" | 1, 9 |

#### 主題 3：skill 與 agent 說明檔

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| description 寫觸發時機與觸發詞，不寫摘要。 | "the description field is not a summary, it's a description of when to trigger this skill" | 2 |
| 陷阱（gotchas）段訊號最高，隨真實失敗累積。 | "The highest-signal content in any skill is the Gotchas section" | 2 |
| skill 是資料夾。SKILL.md 當樞紐，告知檔案清單。 | "Tell Claude what files are in your skill, and it will read them at appropriate times" | 2 |
| 只寫目標與限制，不寫每一步。 | "State the goal and the constraints, not every step" | 2 |
| 重述 Claude 預設行為的 skill 只增負擔。 | "A skill that restates what Claude would do by default adds context without adding value" | 2 |
| 一個 skill 只屬一類。貪多的 skill 會混淆代理。 | "The best skills fit cleanly into one; the ones that try to do too much straddle several" | 2 |
| 驗證類 skill 影響最大，值得花一週做好。 | "spend a week just making your verification skills excellent" | 2 |
| skill 當輕量指引。只在重要處加限制。 | "Think of skills as lightweight guides ... Avoid making them overconstrained, except in highly important areas" | 1 |
| 知識型 skill 寫能讓 Claude 跳出慣性的內容。 | "pushes Claude out of its normal way of thinking" | 2 |
| 好 skill 多半從幾行與一個陷阱開始。 | "Most of our best skills began as a few lines and a single gotcha" | 2 |
| 設定資訊存 skill 內的 config.json。 | "store this setup information in a config.json file in the skill directory" | 2 |
| sub-agent 定義檔可設 model，小模型做查找。 | "set model: haiku or model: sonnet in its definition" | 9 |
| 用評測與爬坡調 skill 內容；skill 是便宜又可歸因的爬坡標的。 | "On our evaluation, the skill started at 66%" → "~88%" | 11 |

#### 主題 4：sub-agent 與多代理分工

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 大型稽核或遷移拆給 sub-agent，逐份檢查證據。 | "When a subagent reports back, check its evidence before you accept it" | 7 |
| 每個被派出的代理配一個獨立驗證者。 | "run a separate spawned agent to adversarially verify its output against a rubric or criteria" | 3 |
| 規則遵循：一條規則一個驗證者，加懷疑者濾誤報。 | "one verifier per rule. Creating a skeptic persona subagent ... will help avoid too many false positives" | 3 |
| 排序用比較判斷，不用絕對評分。 | "comparative judgment is more reliable than absolute scoring" | 3 |
| 先問是否真的需要更多算力。一般任務不需要五人審查團。 | "most traditional coding tasks do not need a panel of 5 reviewers" | 3 |
| 工作流不是每個任務都需要，會多耗 token。 | "they are not needed for every task and may end up using significantly more tokens" | 3 |
| 小模型只做查找與摘要，不寫碼。誤讀會讓主模型追錯檔。 | "Move down to Sonnet or Haiku for lookups, not for writing code" | 9 |
| 團隊要小、任務自成一體、做完就關。 | "Keep teams small, keep each task self-contained, and shut teammates down when their part is done" | 9 |
| 代理團隊在計畫模式約耗七倍 token。 | "about seven times the tokens of a standard session when teammates run in plan mode" | 9 |
| 每項任務寫成自成一體的工單，指名證明完成的指令。 | "Name the command that proves the task is done" | 13 |
| 並行任務沿檔案邊界切分。 | "Small, separate sessions are easier to review and cheaper to throw away" | 13 |
| 審查：多代理找缺陷，另一組投票，票數夠才貼出。 | "a separate group votes on each finding, and it only gets posted if enough of them agree it's real" | 15 |
| 作者代理與審查代理會互相無限忙碌，要設輪數上限。 | "An agent author and an agent reviewer can keep each other busy indefinitely" | 15 |
| 換模型用 sub-agent 交接。分叉共用母情境前綴。 | "cache-safe forking" | 5 |
| 文件密集的查詢交給 sub-agent 在自己情境裡做。 | "The subagent does the doc-searching in its own context" | 6 |

#### 主題 5：記憶與知識庫

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 記憶交給自動記憶，不手寫進 CLAUDE.md。 | "Claude now automatically saves memories" | 1 |
| skill 可內建資料型記憶（日誌、JSON、SQLite）。 | "Some skills can include a form of memory by storing data within them" | 2 |
| 偏好存唯讀記憶庫、狀態存可讀寫記憶庫。每次執行重讀偏好。 | "Re-read your preferences every run" | 14 |
| 偏好副本不寫死在提示。讀不到就停，不用預設值硬跑。 | "a copy of the preferences is baked into the prompt"（反模式） | 14 |
| HTML 成品留作日後參考，開新工作階段時傳入。 | "I tend to keep these files around as references for the future" | 4 |
| claude.dev 未見：專門談 wiki 型知識庫的文章。 | — | — |

#### 主題 6：評分與稽核流程

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 評分準則寫成可檢查的陳述，不用 1 到 5 分量表。 | "a rubric written as checkable claims (not a 1-to-5 scale)" | 11 |
| 評審不是被測模型。 | "You pick the judge model, and it should not be the model you are testing" | 11 |
| 信任評分者前先讀一批已評分紀錄。 | "read a sample of scored transcripts before believing your evaluator" | 11 |
| 好任務：兩位領域專家會得到同一判決，且評分者查的都在任務裡寫明。 | "two domain experts would reach the same verdict and everything the grader checks is stated in the task" | 11 |
| 最強模型最高 effort 也要明顯低於 100%，否則量不出改動效果。 | "should be well below 100% on the evaluation" | 11 |
| 難題由人判定為難，並能說出難在哪。 | "a useful test is to be able to say why a task is hard before you include it" | 11 |
| 切訓練集與測試集。先量噪音，增益在噪音內不採用。 | "Use a train set that the hillclimber may read and a test set that is never seen" | 11 |
| 評分準則交給驗證代理，用來檢驗品味。 | "verify your taste in a particular field ... spinning up verifier agents with those rubrics" | 1 |
| 審查準則由擁有者寫：說失敗長相、限 nit 數、列略過路徑、要檔案與行號當證據。 | "cap the nits, list paths to skip, and ask for a file and line as evidence" | 15 |
| 每項發現都要回應：修掉或附理由結案。 | "Every finding has to be answered" | 15 |
| 重複出現的發現移到源頭：skill、lint 規則、指示檔。 | "we fix it at the source: in the skill, with a lint rule, or with updates to instructional files" | 15 |
| 事故與撤回做成評測集，改審查器後重新評分。 | "Turn incidents and reverts into an eval set, and rescore the reviewer whenever its prompts, tools or model change" | 15 |
| 風險分級從變更判，不看作者。先嚴後鬆。 | "set from the change rather than the author; start strict and loosen with evidence" | 15 |
| 審查只列會擋下合併的問題。 | "List only problems you'd block the merge for" | 7 |
| 要求標出無法確認之處與查過哪裡。 | "Mark anything you couldn't confirm, and say where you looked" | 7 |
| 給 Claude 能執行的東西，要它秀輸出而不是說做完了。 | "ask it to show the output instead of saying it's done" | 15 |
| 完成前跑一次真正執行該變更的檢查。 | "run a real check that exercises the change before reporting it done" | 10 |
| 低 effort 實作後先審查，再用高 effort 驗證。 | "higher effort is best for tasks with lots of hidden edge cases" | 8 |
| 指標先證明與真實結果相關，再做成只降不升的棘輪。 | "we threw it out rather than let Claude climb the wrong hill" | 16 |

#### 主題 7：工具使用與權限

| 建議 | 原文關鍵句 | 出處 |
|------|-----------|------|
| 新增工具門檻要高。用漸進式揭露加能力，不加工具。 | "The bar to add a new tool is high" | 6 |
| 結構化互動用專屬工具，不靠自由格式輸出。 | AskUserQuestion 的設計緣由 | 6 |
| 工具用延後載入，不移除。不中途改工具集。 | "Use tool search to defer instead of remove" | 5 |
| 破壞性指令保留權限提示。 | "Keep permission prompts on for destructive commands too" | 7 |
| 硬性封鎖用權限規則。mod 攔截只是安全網。 | "It's a safety net, not a permission system" | 12 |
| 隨用隨掛的 hook：只在 skill 啟用期間擋危險指令或限制編輯範圍。 | `/careful`、`/freeze` 範例 | 2 |
| 不受信任內容由無權限的讀取代理處理，行動代理只看摘要。 | 讀取代理與行動代理分離 | 3 |
| 代理用範圍受限的憑證。秘密不放共用環境變數。 | "Give the agent its own, scoped credentials" | 14, 13 |
| 工作階段中途增減 MCP 伺服器會使快取失效。 | — | 9 |

#### 主題 8：Claude 5 世代模型行為差異

| 建議或觀察 | 原文關鍵句 | 出處 |
|-----------|-----------|------|
| Opus 5.5：獨立執行更久、回報直白、每次回覆前先思考。 | "it works for longer on its own, it tells you plainly what it did, and it thinks before every reply" | 7 |
| 刪掉「想仔細一點」「一步一步想」類句子。 | "Remove 'think carefully,' 'think step by step,' and similar lines from your prompts and your saved instructions" | 7 |
| 不要求在回覆中展示推理。 | 段落標題 "Don't ask it to show its reasoning in the reply" | 7, 10 |
| 舊提示的儀式性指示讓 Opus 5.5 多寫、重複呼叫工具。 | "The audit removed ritual instructions that made the model write more and repeat tool calls" | 9 |
| effort 依任務選，不沿用舊模型的設定。從 medium 起，量到增益才用 xhigh 與 max。 | "Start at medium, and keep xhigh and max for work where you've measured a gain" | 8, 9 |
| 三層模型分工：小模型查找、Opus 5.5 日常主力、Fable 5.1 最難的工作。 | "a small one for lookups, Opus 5.5 for work you supervise closely, and a bigger one for the hardest tasks" | 9 |
| Fable 5.1 牌價每百萬 token 輸入 10 美元、輸出 50 美元，為 Opus 5.5 的 2.5 倍。 | "Fable 5.1 lists at $10 per million input tokens and $50 per million output, two and a half times the Opus 5.5 price" | 9 |
| Fable 5.1 適用：無人監督的長任務、程式庫無先例的問題、協調多個 sub-agent 的大變更。 | "long runs you won't supervise, problems with no existing pattern in the codebase, and large changes that coordinate many subagents" | 9 |
| Opus 5.5 在 xhigh 同一問題失敗兩次就切 Fable 5.1，解完切回。 | "If xhigh hits the same problem twice, switch to Fable 5.1. Switch back once it's solved" | 9 |
| Sonnet 5.5 適合範圍明確、有清楚規格的任務。 | "fits best when the task has a clear spec" | 10 |
| 被標記的訊息改由較舊模型處理。 | "most flagged messages move to an older model, and your work goes on there" | 7 |
| 模型進步後，舊工具可能變成限制，要重新檢視假設。 | "constantly revisit previous assumptions" | 6 |

### claude.dev 未見

| 項目 | 結果 |
|------|------|
| Mythos 相關公告或遷移指南 | 未見 |
| Fable 5.1 專屬公告或使用指南 | 未見。只在文章 8、9 內提及。文章 1 連到的 Fable 指南在 claude.com，依來源限制未採 |
| Opus 5.5 專屬遷移指南 | 未見。最接近文章 7、9 |
| 專講 CLAUDE.md 怎麼寫的獨立文章 | 未見。建議散見文章 1、7、9、13、15 |
| sub-agent 定義檔（agent frontmatter）撰寫指南 | 未見。只有文章 14 的 agent.md 範例與文章 9 的 model 設定 |
| fork 使用指南 | 未見。文章 5 只談壓縮用的快取安全分叉 |
| 專門的記憶與 wiki 型知識庫文章 | 未見 |
| 繁體中文版文章 | 未見 |
| 2025 年下半年文章 | 未見。sitemap 最早一篇 2026-04-10 |

### 時間範圍說明

文章 1（起點）頁面日期 2026-07-24，內文寫的是 Claude Opus 5 與 Claude Fable 5，早於 Opus 5.5（文章 7，2026-09-22）與 Fable 5.1 的公開。文章 7 到 15 才是 Opus 5.5、Sonnet 5.5、Fable 5.1 世代的文章。文章 2 到 6 屬更早的 Claude Code 設計系列。

## 查證紀錄（主對話 Fable 抽查）

| 文章 | 抽查方式 | 結果 |
|------|---------|------|
| 1 | 逐句比對 14 組關鍵句、章節標題、模型名 | 全部相符。內文模型名為 Opus 5 與 Fable 5 |
| 2 | 逐句比對 13 組關鍵句、九類名稱 | 全部相符。「六條編號 git 指令」只在圖片替代文字 |
| 3 | 逐句比對 12 組關鍵句、三種失誤、規則驗證段 | 全部相符。「token 預算」原文為 "explicit token usage budgets" |
| 7 | 逐句比對 14 組關鍵句、三點差異、sub-agent 段 | 全部相符 |
| 9 | 逐句比對 Fable 5.1 全部提及與 19 組關鍵句 | 全部相符。子代理標「未核對」的牌價與適用情境已在頁面確認 |
| 11 | 逐句比對 16 組關鍵句、章節標題 | 一處更正：成本範例是每張 4.6 美分降到 1.9 美分，不是五倍。子代理原寫「約降 5 倍」已改 |
| 15 | 逐句比對 17 組關鍵句、管線階段 | 全部相符。「90%」原文為 "about 90 percent" |

未抽查：4、5、6、8、10、12、13、14、16。這九篇的引文仍是子代理經 WebFetch 摘要工具取得，採用時標「未逐字核對」。

## 第一輪初步分析（Claude 寫）

- 觀察：文章 1、2、7、9 直接衝擊專案 CLAUDE.md（目前 375 行，含大量流程規則與路由表）與各 skill 的寫法（逐步指令、禁令清單、必含段）。
- 觀察：文章 3、11、15 與專案的 plan-audit 流程同向（執行者與稽核者分離、評分準則、獨立驗證者），但主張評分準則寫成可檢查的陳述、評審用不同模型、事故轉評測集。
- 觀察：文章 1 的「不給範例」與專案 wiki 的「規範 ＋ 骨架 ＋ 範例卡」三件組有張力，待裁決。
- 候選相關卡：[[審查知識路由]] / [[規劃品質評分準則]] / [[稽核誤判記錄]]
- 候選 OQ 候補：無（重構計畫的待裁決項放第三段計畫書，不開 OQ）
- 候選升級路徑：11 審查與協作知識

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）

## 精練去處（Mode B 完成後填）

<!-- Mode A 寫入時保留下方註解樣板不填。Mode B 完成後以實際 wiki link 清單取代整段註解 -->
