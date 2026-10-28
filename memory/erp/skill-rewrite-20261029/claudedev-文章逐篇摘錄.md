# claude.dev 文章調研：Claude 5 世代模型的用法

調研日期：2026-10-29。來源限制：只用 `https://claude.dev` 網域頁面。

## 方法與可靠度說明

- 清單來源：`https://claude.dev/sitemap.xml`（16 篇 `/blog/` 文章）、首頁與 `/terminal/` 的近期文章清單、WebSearch 搜尋結果。三處互相對得上，共 16 篇。
- `/blog/` 首頁只列 10 篇，另有「Load more」按鈕。`/blog/page/2/` 與 `/posts` 回傳 404。其餘 6 篇由 sitemap 補齊。
- 搜尋工具對 `site:claude.dev` 語法無效，結果混入其他網站。改用網域篩選參數限定 `claude.dev` 後，結果才全部來自 claude.dev。本檔不採用其他網域的任何內容。
- WebFetch 回傳的是小型模型整理的摘要，不是原始 HTML。下列引文是摘要工具回傳的原文片段，未逐字對照原始頁面。只有文章 1（以 `.md` 版本取得近乎全文）的引文較可信。主對話引用前請自行對照。
- 發布日期以頁面標示為準。sitemap 的 lastmod 是另一個日期（文章 1 至 8、16 多為 2026-09-24），不當作發布日期。
- 日期疑點（未查證）：文章 2（頁面 2026-06-03）連到文章 1（頁面 2026-07-24）。文章 3（頁面 2026-06-02）連到文章 10（頁面 2026-09-28）。頁面日期與內文連結的先後不一致，原因不明。

## 總表

| 編號 | 標題 | URL | 日期 | 涵蓋主題 |
|------|------|-----|------|----------|
| 1 | The new rules of context engineering for Claude 5 generation models | https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/ | 2026-07-24 | 1, 2, 3, 4, 5, 6, 7, 8 |
| 2 | Lessons from building Claude Code: How we use skills | https://claude.dev/blog/lessons-from-building-claude-code-how-we-use-skills/ | 2026-06-03 | 1, 3, 4, 5, 6, 7 |
| 3 | A harness for every task: dynamic workflows in Claude Code | https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/ | 2026-06-02 | 1, 2, 3, 4, 6, 7 |
| 4 | Using Claude Code: The unreasonable effectiveness of HTML | https://claude.dev/blog/using-claude-code-the-unreasonable-effectiveness-of-html/ | 2026-05-20 | 1, 3, 4, 5, 6, 7 |
| 5 | Lessons from building Claude Code: Prompt caching is everything | https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/ | 2026-04-30 | 1, 2, 4, 7 |
| 6 | Seeing like an agent: how we design tools in Claude Code | https://claude.dev/blog/seeing-like-an-agent/ | 2026-04-10 | 1, 3, 4, 7, 8 |
| 7 | Getting the most out of Opus 5.5 in Claude and Claude Code | https://claude.dev/blog/getting-the-most-out-of-opus-5-5/ | 2026-09-22 | 1, 2, 4, 5, 6, 7, 8 |
| 8 | Using Claude Code: Spending your effort | https://claude.dev/blog/spending-your-effort/ | 2026-09-25 | 6, 8 |
| 9 | What a task costs on Opus 5.5 | https://claude.dev/blog/what-a-task-costs-on-opus-5-5/ | 2026-09-25 | 1, 2, 3, 4, 6, 7, 8 |
| 10 | Building with Claude Sonnet 5.5 | https://claude.dev/blog/building-with-claude-sonnet-5-5/ | 2026-09-28 | 1, 4, 6, 7, 8 |
| 11 | Automating eval design and hillclimbing with Claude | https://claude.dev/blog/automating-eval-design-and-hillclimbing/ | 2026-09-28 | 3, 6, 8 |
| 12 | Getting started with Claude Code mods | https://claude.dev/blog/getting-started-with-claude-code-mods/ | 2026-10-01 | 4, 6, 7 |
| 13 | Claude Code in the cloud: a field guide to cloud sessions | https://claude.dev/blog/claude-code-in-the-cloud/ | 2026-10-06 | 1, 2, 3, 4, 5, 6, 7 |
| 14 | Building effective agent automations | https://claude.dev/blog/building-effective-agent-automations/ | 2026-10-08 | 5, 6, 7 |
| 15 | How the Claude Code team does code review | https://claude.dev/blog/solving-code-review-at-anthropic/ | 2026-10-15 | 1, 2, 3, 4, 6, 7 |
| 16 | How we made claude.ai 3x faster in two weeks | https://claude.dev/blog/how-we-made-claude-ai-faster/ | 2026-09-23 | 6, 7 |

非文章頁：`https://claude.dev/mods/`（mods 介紹頁，頁面未標日期，內容只涉及 hooks，歸入文章 12 的補充）、`https://claude.dev/terminal/`（文章清單頁，無指引內容）、`https://claude.dev/`（首頁，文章清單）。

主題編號：1 情境工程、2 CLAUDE.md、3 skill 與 agent 說明檔、4 sub-agent 與多代理、5 記憶與知識庫、6 評分與稽核、7 工具使用與權限、8 Claude 5 世代模型行為差異。

---

## 文章 1：The new rules of context engineering for Claude 5 generation models

- URL：https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/
- 標題：The new rules of context engineering for Claude 5 generation models
- 發布日期：2026-07-24（作者 Thariq Shihipar；頁面內文寫 Claude Opus 5 與 Claude Fable 5）
- 主張：提示只是 Claude 所得情境的一小部分。系統提示、skill、CLAUDE.md、記憶一起組成情境。Anthropic 發現自己對 Claude Code 限制過多。新世代模型刪掉 80% 以上的系統提示後，編碼評測沒有可量測的退步。
- 建議做法：
  - 用判斷取代規則。"newer models have better judgement and can handle these decisions well"
  - 設計工具介面，不給範例。"giving examples actually constrains them to a certain exploration space"
  - 漸進式揭露。"loading the right context at the right times"
  - 工具用法寫在工具說明，不在系統提示重複。"put instructions on how to use tools in the tool descriptions"
  - 記憶交給自動記憶。"Claude now automatically saves memories that are relevant to the work"
  - 參考資料用豐富形式：HTML 成品、測試套件、他處函式、評分準則（rubric）。"Claude can handle increasingly more complicated references"
  - 評分準則加驗證代理，檢驗品味。"verify your taste in a particular field"
  - CLAUDE.md 保持輕量，篇幅花在程式庫的陷阱。"Keep your CLAUDE.md lightweight"
  - 驗證步驟獨立成 skill，從 CLAUDE.md 引用。"create a verification skill and reference it from your CLAUDE.md"
  - skill 當輕量指引。長 skill 拆成多檔。"Think of skills as lightweight guides"
  - skill 放團隊或產品專屬的見解與知識。"skills encode particular opinions, knowledge, or best practices"
  - 參考資料優先用程式碼形式。"a HTML mockup of a design will generally produce better results"
  - 用 `/doctor`（內文亦寫 `claude doctor`，兩種寫法並存）瘦身 skill 與 CLAUDE.md。
- 反模式：
  - 過度約束。"we were overconstraining Claude Code"
  - 多處指令互相衝突。"several conflicting messages in a single request"
  - 把 CLAUDE.md 或 SKILL.md 當成收錄所有已知做法的總庫。"central repository for every known practice"
  - 陳述顯而易見的事。"Avoid stating 'the obvious' things Claude should know"
  - 舊時代的強硬護欄。"give particularly strong guidance that might not always be true"
  - 用 `#` 熱鍵把記憶寫進 CLAUDE.md（頁面稱已過時，改自動記憶）。
- 涵蓋主題：1, 2, 3, 4, 5, 6, 7, 8
- 對專案的直接建議：
  - CLAUDE.md：只留 repo 用途與程式庫陷阱。刪掉 Claude 看檔案結構就知道的內容。多組驗證指示改成 skill 並引用。
  - skill 說明檔：寫成輕量指引。只在重要處加限制。長 skill 拆多檔，用樹狀檔案分時載入。
  - sub-agent 派工：頁面只提「評分準則加驗證代理」一項。其餘無。
  - 稽核流程：評分準則可當參考資料交給驗證代理，讓 Claude 檢驗品味。

## 文章 2：Lessons from building Claude Code: How we use skills

- URL：https://claude.dev/blog/lessons-from-building-claude-code-how-we-use-skills/
- 標題：Lessons from building Claude Code: How we use skills
- 發布日期：2026-06-03（作者 Thariq Shihipar；見總說明的日期疑點）
- 主張：skill 是資料夾，內含指示、腳本、資產與資料，不只是 markdown 檔。Anthropic 內部有數百個 skill，分九類。驗證類 skill 對輸出品質影響最大。skill 靠真實失敗累積陷阱（gotchas）而進步。description 是觸發條件。
- 九類 skill：程式庫與 API 參考、產品驗證、資料取得與分析、業務流程與團隊自動化、程式碼鷹架與範本、程式碼品質與審查、CI/CD 與部署、操作手冊（runbook）、基礎設施維運。
- 建議做法：
  - 每個 skill 清楚屬於一類。"The best skills fit cleanly into one."
  - 先把驗證 skill 做到極致。"spend a week just making your verification skills excellent"
  - 寫讓 Claude 跳出慣性思考的內容。"out of its normal way of thinking"
  - 陷阱段是訊號最高的內容，隨失敗更新。"The highest-signal content in any skill is the Gotchas section."
  - skill 是資料夾，並告知檔案清單。"Tell Claude what files are in your skill."
  - SKILL.md 當樞紐，用「症狀對應檔案」表指向輔助檔。
  - 只寫目標與限制，不寫每一步。"State the goal and the constraints, not every step."
  - 設定資訊存 `config.json`，缺值時詢問使用者並存下。"store this setup information in a config.json file"
  - 選擇題改用 AskUserQuestion 工具。
  - description 寫觸發時機並列出觸發詞。"include triggers for the skill"
  - 資料型記憶：追加式日誌、JSON 或 SQLite，放穩定目錄 `${CLAUDE_PLUGIN_DATA}`。"Some skills can include a form of memory by storing data within them."
  - 給 Claude 腳本與輔助函式庫，陷阱寫進 docstring。"One of the most powerful tools you can give Claude is code."
  - 隨用隨掛的 hook（只在 skill 啟用期間生效），如 `/careful` 擋 `rm -rf`、`/freeze` 限制編輯範圍。
  - 小團隊把 skill 放 repo 的 `./.claude/skills`。大組織用外掛市集，因為每個進 repo 的 skill 都增加情境負擔。
  - skill 之間以名稱互相引用。
  - 用 PreToolUse hook 記錄 skill 使用量，找出觸發不足的 skill。
  - 好 skill 多半從幾行與一個陷阱開始。"Most of our best skills began as a few lines and a single gotcha."
- 反模式：
  - 貪多的 skill。"the ones that try to do too much"
  - 重述 Claude 預設行為。"adds context without adding value"
  - 逐步指令式的過度約束（例：六條編號 git 指令）。
  - description 寫成摘要。"the description field is not a summary"
- 涵蓋主題：1, 3, 4（`adversarial-review` 啟用全新視角的 sub-agent，一筆帶過）, 5, 6（驗證與審查類 skill；無正式評測方法）, 7（隨用隨掛 hook、AskUserQuestion）
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：description 寫觸發時機與觸發詞。陷阱段持續累積。用資料夾分檔加症狀對應表。只寫目標與限制。
  - sub-agent 派工：審查類 skill 可啟用全新視角的 sub-agent。
  - 稽核流程：驗證與審查各自成 skill。用 hook 記錄使用量。

## 文章 3：A harness for every task: dynamic workflows in Claude Code

- URL：https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/
- 標題：A harness for every task: dynamic workflows in Claude Code
- 發布日期：2026-06-02（作者 Thariq Shihipar、Sid Bidasaria；見總說明的日期疑點）
- 主張：動態工作流讓 Claude 為特定任務寫一支 JavaScript 腳本，由腳本生成並協調多個 sub-agent。單一長情境會出現三種失誤：偷懶、偏愛自己的結果、目標漂移。各 sub-agent 有獨立情境視窗，可抵消這些問題。工作流多耗 token，只適合複雜、高價值的任務。
- 建議做法：
  - 分類後行動。"Use a classifier agent to decide on the type of task."
  - 展開再合成。"Split up a task into many smaller steps, run an agent on each step."
  - 對抗式驗證，每個被派出的代理各配一個獨立驗證代理。"run a separate spawned agent to adversarially verify its output"
  - 產生後過濾（依評分準則或驗證）。
  - 競賽：多個代理用不同做法做同一件事，兩兩評比。
  - 迴圈直到停止條件成立。
  - 排序用比較判斷。"comparative judgment is more reliable than absolute scoring"
  - 規則遵循：每條規則一個驗證者，加「懷疑者」代理濾掉誤報。從歷次工作階段萃取反覆出現的更正，寫回 CLAUDE.md。
  - 不受信任內容隔離：無權限的讀取代理負責閱讀，行動代理只看摘要。
  - 給審查代理一份評分準則，說明好的解法長什麼樣。"Give a review agent a rubric for what a good solution looks like."
  - 在提示裡設 token 預算。
  - 工作流可存進 skill 資料夾，當範本而非逐字腳本。
  - 遷移用 worktree 隔離，並提醒代理不用耗資源的指令。
- 反模式：
  - 每個任務都用工作流。"they are not needed for every task and may end up using significantly more tokens"
  - 一般編碼任務配五人審查團。"most traditional coding tasks do not need a panel of 5 reviewers"
  - 一次提示排序上千列，品質下降。
  - 單一情境長任務的三種失誤：偷懶（"declares the job done after partial progress"）、偏愛自己的結果、目標漂移（壓縮摘要可能弄丟「不要做 X」的限制）。
- 涵蓋主題：1, 2, 3, 4（核心）, 6, 7（讀取代理與行動代理的權限隔離；`isolation` 選項）
- 對專案的直接建議：
  - CLAUDE.md：可從歷次工作階段萃取反覆更正，寫回 CLAUDE.md。
  - skill 說明檔：工作流可放 skill 資料夾（SKILL.md 加 `.workflow.js`），當範本使用。
  - sub-agent 派工：獨立情境、結構化輸出、獨立驗證者、worktree 隔離。先問「是否真的需要更多算力」。
  - 稽核流程：每項規則一個驗證者，加懷疑者濾誤報。評分準則交審查代理。比較判斷優於絕對評分。

## 文章 4：Using Claude Code: The unreasonable effectiveness of HTML

- URL：https://claude.dev/blog/using-claude-code-the-unreasonable-effectiveness-of-html/
- 標題：Using Claude Code: The unreasonable effectiveness of HTML
- 發布日期：2026-05-20（作者 Thariq Shihipar，文中聲明為個人意見）
- 主張：Markdown 超過約一百行就難讀，也難分享，且無法表達豐富視覺。作者改用 HTML 當輸出格式。HTML 可含表格、SVG、互動控制，並以連結分享。讀 HTML 計畫能讓人更仔細檢視 Claude 的選擇。
- 建議做法：
  - 預設用 HTML 當輸出。"I've started preferring HTML as an output format instead of Markdown"
  - 先想清楚成品的用途。"knowing what you want the artifact to do"
  - 規格與計畫用 HTML。"Create a thorough implementation plan in a HTML file"
  - 探索時並列多種做法。"Generate 6 distinctly different approaches"
  - 程式碼審查渲染 diff 並加邊註。"Render the actual diff with inline margin annotations"
  - 圖用 SVG。
  - 一次性編輯器以匯出收尾。"The trick is always to end with an export"
  - 保留 HTML 當日後參考。"I tend to keep these files around as references for the future"
  - 實作時開新工作階段並傳入這些檔。"create a new session and pass in all of these files"
  - 讓驗證代理讀這些檔。"I'll also ask the verification agent to read in the files"
  - 反覆出現的模式可做成 skill。
- 反模式：
  - 長 Markdown。"I find it difficult to read a Markdown file of more than a hundred lines"
  - 用 Unicode 估色、用 ASCII 圖。
  - 以附件分享 Markdown。
  - 被動讀計畫。"I'd noticed I was reading plans less closely"
- 涵蓋主題：1, 3（一筆帶過）, 4（一筆帶過：驗證代理）, 5（HTML 檔當持久參考）, 6（審查與驗證）, 7（MCP 取得情境）
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：反覆出現的 HTML 模式可做成 skill。
  - sub-agent 派工：規格檔可交給驗證代理與新工作階段當輸入。
  - 稽核流程：審查用「diff 加嚴重度邊註」的呈現。

## 文章 5：Lessons from building Claude Code: Prompt caching is everything

- URL：https://claude.dev/blog/lessons-from-building-claude-code-prompt-caching-is-everything/
- 標題：Lessons from building Claude Code: Prompt caching is everything
- 發布日期：2026-04-30（作者 Thariq Shihipar）
- 主張：提示快取以前綴比對運作。內容的順序與穩定性直接決定快取命中。Claude Code 圍繞快取命中率設計，命中率掉了就當事故處理。計畫模式、工具延後載入、壓縮都以快取限制為前提設計。
- 建議做法：
  - 靜態在前、動態在後。順序：系統提示與工具、CLAUDE.md、工作階段情境、對話訊息。"static content first, dynamic content last"
  - 更新資訊用訊息帶入（`<system-reminder>`），不改提示。"Consider if you can pass in this information via messages"
  - 換模型用 sub-agent 交接。"the best way to do it is with subagents"
  - 計畫模式保留全部工具，用 EnterPlanMode 與 ExitPlanMode 工具切換。"keep _all_ tools in the request at all times"
  - 工具用延後載入，不用移除。"Use tool search to defer instead of remove"
  - 壓縮用「快取安全分叉」：沿用母情境的系統提示與工具，再追加壓縮提示。"cache-safe forking"
  - 監控快取命中率。"Monitor your cache hit rate like you monitor uptime."
- 反模式：
  - 靜態系統提示放精細時間戳記。
  - 工具順序不固定。
  - 工作階段中途改工具集。"Changing the tool set in the middle of a conversation"
  - 對話進行到一半換成 Haiku（重建快取反而更貴）。
  - 壓縮用獨立 API 呼叫配自己的系統提示。"the cost trap"
- 涵蓋主題：1, 2（只提 CLAUDE.md 是每專案的快取層）, 4（模型交接、Explore agent 用 Haiku、分叉）, 7（工具延後載入）
- 對專案的直接建議：
  - CLAUDE.md：CLAUDE.md 屬於每專案的快取層。頻繁修改會使其後內容的快取失效（由文章的前綴規則推得，非文中明示）。
  - skill 說明檔：無。
  - sub-agent 派工：需要換模型時用 sub-agent 交接。分叉要共用母情境的前綴。
  - 稽核流程：無。

## 文章 6：Seeing like an agent: how we design tools in Claude Code

- URL：https://claude.dev/blog/seeing-like-an-agent/
- 標題：Seeing like an agent: how we design tools in Claude Code
- 發布日期：2026-04-10（作者 Thariq Shihipar）
- 主張：工具設計取決於模型的能力。要靠讀輸出與實驗來學會模型能力。以前有用的工具，模型進步後可能變成限制。最重要的工具，是讓 Claude 自己找情境的那些。
- 建議做法：
  - 工具要貼合模型的能力。"You want to give it tools that are shaped to its own abilities."
  - 先觀察再設計。"You pay attention, read its outputs, experiment."
  - 結構化互動用專屬工具（AskUserQuestion）。
  - 模型進步後重新檢視假設。"constantly revisit previous assumptions"
  - 讓模型自己找情境。"the ones that let Claude find its own context"
  - 用漸進式揭露增加能力，不增加工具。"add new functionality without adding a tool"
  - 新增工具門檻要高。"The bar to add a new tool is high."
  - 查文件交給 sub-agent。"The subagent does the doc-searching in its own context."
- 反模式：
  - 把新用途塞進既有工具（ExitPlanTool 加提問讓 Claude 混淆）。
  - 靠自由格式輸出（Claude 會加句、漏選項、放棄結構）。
  - 僵硬的待辦提醒（Claude 以為必須照清單走）。
  - 預先索引檢索（RAG）當預設。"Claude was _given_ this context instead of finding the context itself."
  - 把文件塞進系統提示（情境腐化）。
- 涵蓋主題：1, 3（Agent Skills 當漸進式揭露的載體）, 4（Claude Code Guide sub-agent；Task 工具取代 TodoWrite 供 sub-agent 共用）, 7, 8（模型進步使工具需重審；內文連到文章 1）
- 對專案的直接建議：
  - CLAUDE.md：不要把文件塞進常駐指令。改讓 Claude 搜尋載入。
  - skill 說明檔：用漸進式揭露（巢狀檔案）擴充能力。
  - sub-agent 派工：文件密集的查詢交給 sub-agent。
  - 稽核流程：無。

## 文章 7：Getting the most out of Opus 5.5 in Claude and Claude Code

- URL：https://claude.dev/blog/getting-the-most-out-of-opus-5-5/
- 標題：Getting the most out of Opus 5.5 in Claude and Claude Code
- 發布日期：2026-09-22（作者 Addy Osmani）
- 主張：Opus 5.5 有三點不同：獨立執行更久、回報更直白、每次回覆前都先思考。文章涵蓋提示、長任務導引、結果檢查。另說明新的生物與網路安全防護：被標記的訊息會轉給較舊模型。
- 建議做法：
  - 一則訊息給完整任務並講明終點。"Give the whole task in one message."
  - CLAUDE.md 寫「繼續做」規則。"When a step doesn't need my input, keep going."
  - 只在無法繼續或破壞性操作前停下詢問。"Stop and ask only when you can't continue without me"
  - 破壞性指令保留權限提示。"Keep permission prompts on for destructive commands too."
  - 大型稽核或遷移拆給 sub-agent，並檢查每份回報的證據。"check its evidence before you accept it"
  - 任務清單存檔（如 TASKS.md），讀檔不讀捲動紀錄。
  - 在 CLAUDE.md 規定摘要格式。"End every run with three headings: Blocked on me, Changed, Found."
  - 人工審查前先跑審查。"List only problems you'd block the merge for."
  - 要求標出無法確認之處。"Mark anything you couldn't confirm, and say where you looked."
  - 已定案的答案要求不回頭重講。
- 反模式：
  - 加「想仔細一點」「一步一步想」。"Remove 'think carefully,' 'think step by step,'"
  - 籠統設計指示。"avoid a generic look" 只是換一個預設。
  - 要求在回覆中展示推理。"Don't ask it to show its reasoning in the reply."
  - 長對話中重翻已定案答案。
  - 接受執行中途的停下回報（模型有時會停下回報而不繼續）。
- 涵蓋主題：1, 2, 4, 5（間接：任務檔）, 6, 7（權限提示；未談 hooks 與 MCP）, 8
- 對專案的直接建議：
  - CLAUDE.md：寫停下與繼續規則、摘要格式。範例：「結束時分三段：Blocked on me、Changed、Found」。
  - skill 說明檔：無。
  - sub-agent 派工：每個服務交給一個 sub-agent。收到回報先查證據。最後匯整成一張表（服務、是否受影響、證據）。
  - 稽核流程：「只列你會擋下合併的問題」；每項附檔案、行號、錯在哪、如何重現。

## 文章 8：Using Claude Code: Spending your effort

- URL：https://claude.dev/blog/spending-your-effort/
- 標題：Using Claude Code: Spending your effort
- 發布日期：2026-09-25（作者 Thariq Shihipar）
- 主張：effort（努力程度）近似於你想花在任務上的算力。effort 越高，Claude 越會自己判斷與驗證，對邊界情況多的任務最有幫助。低 effort 適合需要人在迴圈中的快速起點。max 適合完全自主的工作。依據作者自測與 Opus 5.5、Fable 5.1 的 Terminal-Bench 3.0 結果。
- 建議做法：
  - 依任務選 effort。Low：快速、在迴圈中。Medium：一般工程。High：需要驗證或有邊界情況。Max：完全自主。
  - 功能開發流程：訪談出規格、低 effort 實作與迭代、高 effort 驗證與測試。
  - 邊界情況多的工作用高 effort。"higher effort is best for tasks with lots of hidden edge cases"
  - 探索階段用低 effort 了解 Claude 的構想。
  - 用 `/effort` 在對話中途切換。
  - 規格含糊時，先比較多種做法再選。
- 反模式（文章無明列，以下是最接近的警告）：
  - 驗證型工作用低 effort。低 effort 嘗試 "did not check that its new test would have caught the original bug"
  - 期待 effort 補救錯誤做法。effort "does not fix when the model has the wrong approach"
- 涵蓋主題：6, 8
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：無。
  - sub-agent 派工：無。
  - 稽核流程：低 effort 實作後先審查，再用高 effort 驗證。修錯誤時先重現失敗，並確認新測試在不完整修補下會失敗。

## 文章 9：What a task costs on Opus 5.5

- URL：https://claude.dev/blog/what-a-task-costs-on-opus-5-5/
- 標題：What a task costs on Opus 5.5
- 發布日期：2026-09-25（作者 Addy Osmani）
- 主張：Opus 5.5 的牌價比 Opus 5 低：輸入與輸出各便宜 20%，快取讀取便宜 60%。成本由輪數、快取讀取、輸出（含思考，以輸入的 5 倍計）與模型決定。一般工作負載約低 40%，但每任務用多少 token 因工作而異，建議在自己的任務上量測。
- 建議做法：
  - 給模型自我檢查的方法。"giving the model a way to check its work"
  - 一次收集、批次呼叫工具。
  - 中等 effort 起步，卡住再升 high，xhigh 與 max 只用在量測過有增益之處。"keep xhigh and max for work where you've measured a gain"
  - Opus 5.5 當日常主力。"Use Opus 5.5 for work you supervise."
  - 結果比 token 價格重要時升到 Fable 5.1。xhigh 同一問題失敗兩次就切換。"If Opus 5.5 on xhigh hits the same problem twice, switch."
  - 只有查找類工作降到 Sonnet 或 Haiku。"Move down to Sonnet or Haiku for lookups, not for writing code."
  - 搜尋、讀日誌、讀測試輸出用小模型，改碼留給 Opus 5.5。
  - 在 sub-agent 定義裡設 `model: haiku` 或 `model: sonnet`。
  - 團隊要小、每項任務要自成一體。"Keep teams small, keep each task self-contained"
  - 遷移時跑 `/claude-api prompt-audit`，檢查 skill 與 CLAUDE.md 的提示反模式。
  - 換模型前先 `/compact` 或開新工作階段並附簡短計畫。
  - 無關任務之間用 `/clear`。
  - 跨檔變更用計畫模式。
  - 在真實任務上各跑一次並比較 `/usage`。
- 反模式：
  - 為舊模型寫的提示。"can make Opus 5.5 write more and repeat tool calls"
  - 儀式性指示（強制六步驟、草稿本規則、驗證兩次）。
  - 沿用 Opus 5 的 effort 設定。"don't carry over a level you chose for Opus 5"
  - 簡單任務拉高 effort。
  - 殘留舊情境。"Much of that context is left over from earlier work"
  - 暫停超過快取壽命；工作階段中途增減 MCP 伺服器（快取失效）。
  - 完成前才壓縮；休息後才壓縮。
  - 工作階段後段才開快速模式。
  - 小模型寫碼，會"sends the main model after the wrong file"
  - 只修一層，沒讀到第二個呼叫端。
- 涵蓋主題：1, 2, 3, 4, 6, 7, 8
- 補充（主對話已於 2026-10-29 在文章頁逐字核對相符）：Fable 5.1 牌價每百萬 token 輸入 10 美元、輸出 50 美元，為 Opus 5.5 的 2.5 倍。適合不受監督的長任務、程式庫中無先例的問題、協調多個 sub-agent 的大型變更。
- 對專案的直接建議：
  - CLAUDE.md：每行每輪都重送。成本文件建議少於 200 行。
  - skill 說明檔：用 `/claude-api prompt-audit` 檢查。skill 內建驗證，讓模型自查。
  - sub-agent 派工：sub-agent 有獨立情境視窗，只回傳摘要。在定義檔設 `model`；定義檔的設定優先於 `CLAUDE_CODE_SUBAGENT_MODEL`。agent 團隊在計畫模式下約耗 7 倍 token。
  - 稽核流程：結束時看 `/usage` 的快取占比。長任務結尾回報「改了什麼、發現什麼、需要你什麼」。

## 文章 10：Building with Claude Sonnet 5.5

- URL：https://claude.dev/blog/building-with-claude-sonnet-5-5/
- 標題：Building with Claude Sonnet 5.5
- 發布日期：2026-09-28（作者 Addy Osmani）
- 主張：Sonnet 5.5 是 Claude 5.5 家族第二個模型。比 Sonnet 5 更聰明、更省 token、快 30%，單價不變。多數任務成本最多低 30%。Opus 5.5 留給需要審慎判斷的長程複雜工作。本文偏 API 遷移。
- 建議做法：
  - 範圍明確的日常工作用 Sonnet 5.5。"Use Sonnet 5.5 for well-scoped everyday tasks like fixing bugs."
  - 有明確規格時最合適。"fits best when the task has a clear spec."
  - effort 先起跑、評測，再選。除非是代理式或對延遲敏感的負載，否則從 `high` 開始。
  - xhigh 與 max 只用在評測顯示有增益之處。
  - 遷移時移除舊的繞路寫法，再重跑評測，之後才調整。"remove them and re-run your evals before tuning anything else."
  - 回報完成前跑一次真正執行該變更的檢查。"run a real check that exercises the change before reporting it done."
  - 用 `thinking.display` 顯示進度，不要求寫出推理。
  - 依區塊類型讀取回應，不依索引。
  - 用 `tool_choice: auto` 加 `strict: true` 工具，並在提示說明何時呼叫。
  - 重複執行的明確代理任務（調查、審查、起草）適合 Sonnet 5.5；長程代理式編碼適合 Opus 5.5。
- 反模式：
  - 要求模型在回應中寫出推理。
  - `content[0].text` 讀法（思考區塊可能排在前面）。
  - `thinking: {"type": "disabled"}`（回 400 錯誤）。
  - `tool_choice` 用 `any` 或 `tool`（回 400 錯誤）。
  - 請求間更改頂層 effort（快取失效）。
  - 保留 Sonnet 5 的繞路提示（如「不要偷懶」）。
  - 用較舊模型當 Sonnet 5.5 的顧問（advisor）。
  - 以為 Claude Code 可關閉思考。
- 涵蓋主題：1, 4（advisor 工具；Sonnet 5.5 與 Opus 5.5 的分工）, 6（遷移後重跑評測；真實檢查段落）, 7（`tool_choice`、strict 工具）, 8
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：無（只提到 `/claude-api migrate` 會呼叫內建 skill）。
  - sub-agent 派工：重複執行的明確任務可用 Sonnet 5.5。Claude Code 的 `sonnet` 別名預設 medium effort。
  - 稽核流程：「完成前跑真實檢查」可寫成系統提示的一段。移除舊繞路寫法後重跑評測。

## 文章 11：Automating eval design and hillclimbing with Claude

- URL：https://claude.dev/blog/automating-eval-design-and-hillclimbing/
- 標題：Automating eval design and hillclimbing with Claude
- 發布日期：2026-09-28（作者 Lance Martin）
- 主張：好的評測難設計，改善時也容易自欺。文章給出設計與爬坡（hillclimbing，反覆改動再評分）原則，並示範 `/claude-api build-eval` 與 `/claude-api hillclimb`。用訓練與測試切分防止過度配適。兩個範例：成本從每張 4.6 美分降到 1.9 美分且準確率升到 87.8%（主對話核對原文後更正，子代理原寫「約降 5 倍」）；某 skill 的評測通過率從 66% 升到約 88%。
- 建議做法：
  - 任務要貼近正式環境。
  - 能力梯度：更強模型配更高 effort 應得更高分，否則懷疑任務含糊或評分者失準。
  - 留有餘裕：頂尖模型分數應 "well below 100%"。好任務是 "two domain experts would reach the same verdict"。
  - 難題由人判定為難，並能說明難在哪。"Pick hard cases because a human judged them hard."
  - 能用程式檢查就不用 LLM 評審；開放式輸出才用 LLM 評審。
  - 評分準則寫成可檢查的陳述，不用 1 至 5 分量表。"rubric written as checkable claims (not a 1-to-5 scale)"
  - 評審不應是被測模型。成對比較時隨機排序、不告知哪個是基準。
  - 信任評分者前先讀一批已評分的紀錄。"read a sample of scored transcripts"
  - 爬坡：切訓練與測試集，每輪只看訓練集失敗，提出一個針對根因的修補。兩邊都升才保留。
  - 適合爬坡的標的：prompt、skill、工具說明（迭代便宜、可歸因）。
  - 先量噪音；增益在噪音內就建議不合併。
- 反模式：
  - 只挑今天模型會失敗的案例。
  - 不加考慮地要求「改善表現」。
  - 訓練集進步而測試集持平。
  - 把失敗內容貼進提示。
  - 為基準加入正式環境用不到的工具（獎勵駭客）。
- 涵蓋主題：3（skill 是爬坡標的；skill 觸發率）, 6（核心）, 8（Opus 5.5 與 Sonnet 5 的成本與 effort 取捨）
- 範例要點：提示稽核移除強制工具呼叫儀式、草稿本步驟與矛盾規則後，準確率從 74.4%（起點 Opus 4.8 預設高 effort，已核對）升到 87.8%，成本從每張 4.6 美分降到 1.9 美分（終點的模型與 effort 未逐字核對）。
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：description 的觸發率可當評測指標，用爬坡調整。
  - sub-agent 派工：無。
  - 稽核流程：評分準則寫成可檢查的陳述。評審用不同於被測者的模型。先驗證評分者。改動時保留測試集防過度配適。

## 文章 12：Getting started with Claude Code mods

- URL：https://claude.dev/blog/getting-started-with-claude-code-mods/
- 標題：Getting started with Claude Code mods
- 發布日期：2026-10-01（作者 Addy Osmani）。補充頁：https://claude.dev/mods/（頁面未標日期）
- 主張：mod 是以外掛形式發布、在工作階段內執行的小型 JavaScript 或 TypeScript 模組。它能觀察事件、改寫或拒絕工具呼叫、在終端機繪製介面。與設定檔 hook 不同，mod 每工作階段載入一次、保有狀態。需要 Claude Code 2.1.287 以上。
- 建議做法：
  - 倚賴 Claude Code 寫出的型別。"Lean on the types Claude Code writes for you."
  - 資料存 `$.state`，不存模組變數。"keep data in `$.state`, not in module variables."
  - 沒東西可畫時放行。"Pass when you have nothing to draw."
  - 硬性封鎖用權限規則。"Use permission rules for a hard block."
  - 除錯用 `claude --debug`。
  - 安裝 mod 如同安裝套件，先讀 repo、只裝可信來源。
  - 驗證與測試：`claude plugin validate`、`claude plugin test`。
- 反模式：
  - 把歷史存在模組層級變數（熱重載會重置）。
  - 把 Blast Radius 當權限系統。"It's a safety net, not a permission system."（它讀指令文字，`$(…)`、別名、腳本可繞過）
  - 終端機圖示用 emoji。
- 涵蓋主題：4（部分：`e.agentId` 辨識 sub-agent 事件）, 6（部分：驗證與測試指令）, 7（深入：`tool.call` 攔截、權限規則；未談 MCP）
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：無。
  - sub-agent 派工：無。
  - 稽核流程：危險指令要硬性封鎖時用權限規則，不靠 mod 的攔截。

## 文章 13：Claude Code in the cloud: a field guide to cloud sessions

- URL：https://claude.dev/blog/claude-code-in-the-cloud/
- 標題：Claude Code in the cloud: a field guide to cloud sessions
- 發布日期：2026-10-06（作者 Addy Osmani）
- 主張：雲端工作階段每項任務在全新虛擬機上執行，repo 複製到新分支。省去共用工作樹、個人憑證與筆電不能休眠三項本機依賴。成果是一個可轉成 PR 的分支。環境設定與 Claude 自己能跑檢查，和提示一樣重要。
- 建議做法：
  - 每項任務寫成自成一體的工單：問題、完成狀態、證明。"Write each task as a self-contained ticket"
  - 指名能證明完成的指令。"Name the command that proves the task is done."
  - 要求修根因而非只改測試。
  - 先在本機對好做法，再交雲端執行。
  - 先讀摘要與證據，再看 diff。
  - 小而獨立的工作階段。"Small, separate sessions are easier to review and cheaper to throw away."
  - 並行任務沿檔案邊界切分。
  - 啟動雲端前先 push。長任務邊做邊 commit。
  - 機器層設定用安裝腳本（必須 exit 0）。專案層步驟用 SessionStart hook，寫在 repo 的 `.claude/settings.json`。
  - 指令寫進 CLAUDE.md。"Put the commands in CLAUDE.md."
  - 團隊設定進 repo：skill 與指令在 `.claude/`，專案 MCP 在 `.mcp.json`。
  - 網路存取選最窄的一級。秘密不放共用環境變數。
  - 工作階段共享給團隊；commit 帶 `Claude-Session` 標記。
- 反模式：
  - 環境變數對所有使用者可見，卻存放共用秘密。
  - 以為個人 `~/.claude` 會到雲端。"Your personal `~/.claude` doesn't reach the cloud VM."
  - 沒 push 就啟動。
  - 以為服務程序在快取還原後仍存在。
  - 以為多個並行工作階段彼此知情。
  - 以為 Claude 會收到合併衝突通知。
  - 以為網路設為 None 就沒有資料離開虛擬機。
  - 把需要本機資源（VPN、GPU、本機資料庫）的任務硬放雲端。
- 涵蓋主題：1, 2, 3, 4（並行工作階段；Projects 協調對話）, 5（對話可還原，未 commit 的檔案不會）, 6（完成證明、diff 審查）, 7（權限模式、hooks、`.mcp.json`、網路允許清單）
- 對專案的直接建議：
  - CLAUDE.md：寫測試與執行指令。CLAUDE.md、rules、skill、agents、commands 隨 repo 前往雲端。
  - skill 說明檔：skill、指令、agents 提交到 `.claude/`。
  - sub-agent 派工：每項任務一個工作階段、自成一體、指名證明指令；並行任務沿檔案邊界切分。
  - 稽核流程：先讀證據再看 diff；要求「修根因，不只改測試」。

## 文章 14：Building effective agent automations

- URL：https://claude.dev/blog/building-effective-agent-automations/
- 標題：Building effective agent automations
- 發布日期：2026-10-08（作者 Lance Martin、CJ Avilla）
- 主張：排程代理容易悄悄失敗：失去來源存取而沒人發現，或忽略讀者偏好。文章以 Claude Managed Agents（測試版）上的範例 `daily-brief` 示範。每個設計選擇都針對一種失敗模式。
- 建議做法：
  - 代理用自己的、範圍受限的憑證。"Give the agent its own, scoped credentials."
  - 從上次停下處讀起（書籤檔），不讀固定時間窗。"Read from where you left off."
  - 確認貼文成功後才記錄。"Confirm the post landed before recording it."
  - 簡報要短，不確定就略過。"When unsure, leave it out."
  - 貼文前重新檢查仍開啟的項目。"never hedge an item's status: assert it or drop it"
  - 連結一律複製來源欄位，不手組。
  - 唯讀處給唯讀權限，並設每次執行的花費上限（先設一般執行的三到五倍再收緊）。
  - 每次執行重新讀取偏好。"Re-read your preferences every run."
  - 偏好存唯讀記憶庫；讀不到就停止，不用預設值硬跑。
  - 狀態存可讀寫的記憶庫（書籤、帳本、執行紀錄）。
  - 在部署檔指定時區。
- 反模式：
  - 讀固定窗（如「過去 24 小時」）。
  - 把讀取失敗當成平靜的一天。"Don't mistake a failed read for a quiet day."
  - 把偏好副本寫死在提示。"a copy of the preferences is baked into the prompt"
  - 過時狀態。"One stale 'still waiting on you' costs more trust than ten missing items."
  - 上限設太低，看起來像簡報變安靜。
  - 重複貼同一份簡報，或記錄了沒貼成功的貼文。
- 涵蓋主題：5（偏好與狀態兩個記憶庫）, 6（逐項重新驗證、執行紀錄、帳本；無正式評測）, 7（保管庫注入憑證、`always_allow`、網路允許清單）。sub-agent、skill、CLAUDE.md：文章未涵蓋。
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：代理檔 `agent.md` 的 frontmatter 含名稱、模型、MCP 伺服器、工具；內文是八個編號步驟。
  - sub-agent 派工：無。
  - 稽核流程：每項回報前重新驗證現況，肯定或剔除，不含糊。讀取失敗要明講。

## 文章 15：How the Claude Code team does code review

- URL：https://claude.dev/blog/solving-code-review-at-anthropic/
- 標題：How the Claude Code team does code review
- 發布日期：2026-10-15（作者 Addy Osmani、Morgan Westlee Lunt、Qing Wang）
- 主張：Claude 寫了 Claude Code 約 90% 的程式碼。團隊追求在不增加撤回與事故的前提下，用最少的人工審查時間。審查是連續且多半自動化：人看方向、風險、架構與所有權。
- 審查管線：
  | 層 | 內容 |
  |----|------|
  | PR 前驗證 | Claude 跑測試、建置、linter；sub-agent 在全新情境審 diff |
  | 必要 CI | 紅燈擋合併 |
  | AI 審查 | 多個代理並行找缺陷；另一組驗證代理對每項發現投票，票數夠才貼出 |
  | 安全審查 | 獨立一輪；任一審查有未解項就擋合併 |
  | 風險分級核准 | 分類器定等級；低風險免人工、中風險一人、高風險二人 |
  | 合併佇列與漸進發布 | 旗標、先員工後全體 |
  | 快速回滾 | 旗標可不經部署關閉 |
- 建議做法：
  - 給 Claude 能執行的東西。"We give Claude something it can run"
  - 重複出現的發現移到源頭（skill、lint 規則、指示檔）。"Fix it at the source"
  - 用 `REVIEW.md` 當審查評分準則，由程式碼擁有者撰寫：定義各區域的失敗長相、限制 nit 數量、列出略過路徑、要求證據。"ask for a file and line as evidence"
  - 每項發現都要回應（修正或附理由結案）。"Every finding has to be answered"
  - 驗證代理投票當評審；風格、診斷、清理類發現直接丟棄。
  - 依回應方式分類每則留言（已修、錯誤、刻意、無關緊要），並在已知乾淨的 PR 上測誤報。
  - 把事故與撤回的 PR 做成評測集，每日跑；審查器的 prompt、工具或模型改動，分數升才保留。"Turn incidents and reverts into an eval set."
  - 按風險決定審查力度（Quick、Standard、Deep）。
  - 限制審查輪數；前幾輪之後只審新 diff。
  - 風險分級從變更本身判定，不看作者。
  - 先嚴後鬆，依證據放寬。"Start strict and loosen with evidence."
  - 用 CODEOWNERS 與分支保護；驗證 REVIEW.md 數週後再擴大。
  - 量人工時間，以撤回與事故率為護欄。
- 反模式：
  - 代理作者與代理審查者互相無限忙碌。"An agent author and an agent reviewer can keep each other busy indefinitely."
  - 審查器重複標舊程式碼（約 59% 的標記是舊程式碼）。
  - 預設多輪審查。
  - 機器人核准取代必要的人工核准。"Never let a bot's approval replace a required human's"
  - 在已完成的 PR 上才提方向變更。
  - 為例行錯誤把資深工程師拉出深度工作。
  - 承認的缺口：尚無斷路器。
- 涵蓋主題：2（CLAUDE.md 要短、審查器每次載入）, 3（內部 skill：找缺陷、簡化 diff、端對端檢查）, 4（並行找缺陷、驗證者投票、全新情境審查）, 6（核心）, 7（hooks 跑格式化與 linter、CODEOWNERS、合併佇列）, 1（審查器每次載入 CLAUDE.md，故須精簡）
- 對專案的直接建議：
  - CLAUDE.md：保持短並用指標指向其他文件。審查器會標出違反慣例與過時行。
  - skill 說明檔：重複的審查意見移進 skill、lint 或指示檔。
  - sub-agent 派工：審查用「多代理找缺陷加獨立驗證者投票」。作者代理與審查代理之間要有輪數上限。
  - 稽核流程：`REVIEW.md` 當評分準則，要求證據、限制 nit、摘要先給數量。事故轉評測集。按風險分級決定人工介入。

## 文章 16：How we made claude.ai 3x faster in two weeks

- URL：https://claude.dev/blog/how-we-made-claude-ai-faster/
- 標題：How we made claude.ai 3x faster in two weeks
- 發布日期：2026-09-23（作者 Raymond Wang、Sam Attard、Issac G.）
- 主張：兩週衝刺讓 claude.ai 載入約快 3 倍。主要由 Claude Tag（測試版，內部研究模型，文中稱約與 Opus 5.5 相當）在單一 Slack 頻道內完成。人設定目標、取捨並核准每項變更。超過 3,000 項變更合併，無客戶可見事故。核心洞見：量得到，就改得動。
- 建議做法：
  - 先量測，再讓模型爬坡。"With Claude, measuring something makes it tractable."
  - 先證明代理指標與使用者延遲相關，再信任它。"we threw it out rather than let Claude climb the wrong hill"
  - 每個基準做成棘輪：只能往下，PR 讓數值變差就在 CI 失敗。
  - 有風險的使用者可見變更放在短命旗標後，分階段發布。
  - 先寫單元測試再做最佳化；至少一位人工核准。
  - 每條工作串有具名的人類負責人且範圍窄。
  - 代理過度保守時明確要求更大膽。"the targets are not the stopping point"
  - 使用者可感知的取捨由人依前後錄影裁決。
- 反模式：
  - 在未驗證的指標上爬坡。
  - 只信彙總指標（CLS 看似良好，仍有 31% 的載入在可輸入後位移）。
  - 預設謹慎讓代理把發現開成工單、縮小範圍。"By default, Claude is careful about scope."
  - 只靠實驗室測試（無介面的 Chrome 漏掉一個瀏覽器行為）。
  - 旗標堆積（近兩百個旗標需要清理）。
- 涵蓋主題：6（基準、棘輪、CI 閘門、自動審查加人工核准、現場監控）, 7（部分：用 Datadog MCP 伺服器分析用量）。CLAUDE.md、skill、sub-agent、記憶：文章未涵蓋。
- 對專案的直接建議：
  - CLAUDE.md：無。
  - skill 說明檔：無。
  - sub-agent 派工：文章描述的是 Claude Tag 在 Slack，不是 Claude Code。頻道層級的常駐指示是目標與監控項，並非 sub-agent 設定。
  - 稽核流程：每個指標先驗證與真實結果相關。指標做成只降不升的棘輪。

---

## 彙整：主題 × 建議 × 出處編號

### 主題 1 情境工程

| 建議 | 出處 |
|------|------|
| 用判斷取代規則；刪除過度約束；避免互相衝突的指令 | 1 |
| 工具用法寫在工具說明，不在系統提示重複；不給範例，改設計介面 | 1 |
| 用漸進式揭露分時載入情境（樹狀檔案、延後載入工具、獨立 skill） | 1, 6 |
| 讓模型自己搜尋找情境，不預先塞入 | 6 |
| 靜態在前、動態在後；更新資訊用訊息帶入；不要中途改工具集或換模型 | 5 |
| 參考資料用豐富形式（HTML、測試套件、程式碼、評分準則） | 1, 4 |
| 殘留舊情境會增加成本；無關任務間 `/clear`；休息前壓縮 | 9 |
| 長任務用任務檔（TASKS.md）撐過摘要壓縮 | 7 |
| 每個 sub-agent 用獨立情境避免汙染與壓縮遺失 | 3 |

### 主題 2 CLAUDE.md 與專案指令

| 建議 | 出處 |
|------|------|
| 保持輕量；寫 repo 用途與程式庫陷阱；不寫顯而易見的事 | 1 |
| 多組驗證指示改成 skill 並從 CLAUDE.md 引用 | 1 |
| 寫「繼續做」與「停下詢問」規則；破壞性操作前停下 | 7 |
| 在 CLAUDE.md 規定每次結束的摘要格式 | 7 |
| 每行每輪重送；成本文件建議少於 200 行 | 9 |
| 測試與執行指令寫進 CLAUDE.md，隨 repo 到雲端；個人 `~/.claude` 不會到雲端 | 13 |
| 保持短並用指標；審查器每次載入 | 15 |
| 從歷次工作階段萃取反覆更正，寫回 CLAUDE.md | 3 |
| CLAUDE.md 是每專案的快取層，改動影響其後快取 | 5 |
| 用 `/doctor` 或 `/claude-api prompt-audit` 檢查過度約束與舊寫法 | 1, 9 |
| 不再用 `#` 熱鍵把記憶寫入 CLAUDE.md | 1 |

### 主題 3 skill 與 agent 說明檔

| 建議 | 出處 |
|------|------|
| description 寫觸發時機與觸發詞，不寫摘要 | 2 |
| 陷阱（gotchas）段訊號最高，隨失敗持續累積 | 2 |
| skill 是資料夾；SKILL.md 當樞紐，用症狀對應檔案表；告知檔案清單 | 2, 1 |
| 只寫目標與限制，不寫每一步；不重述 Claude 預設行為 | 2, 1 |
| 一個 skill 屬一類；驗證類 skill 影響最大 | 2 |
| 長 skill 拆多檔；只在重要處加限制 | 1 |
| skill 放團隊或產品專屬的見解 | 1, 2 |
| 設定存 `config.json`；資料型記憶存日誌、JSON、SQLite | 2 |
| 工作流可放 skill 資料夾，當範本 | 3 |
| 小團隊 skill 進 repo；大組織用市集；每個 skill 都增加情境負擔 | 2 |
| 用評測與爬坡調整 skill 觸發率與內容 | 11 |
| agent 檔 frontmatter 含名稱、模型、MCP 伺服器、工具；內文為編號步驟 | 14 |
| 在 sub-agent 定義檔設 `model` | 9 |
| 建 skill 前先用 `/claude-api prompt-audit` 檢查 | 9 |

### 主題 4 sub-agent 與多代理分工

| 建議 | 出處 |
|------|------|
| 大型稽核或遷移每個單位一個 sub-agent；收到回報先查證據；最後匯整成表 | 7 |
| 工作流模式：分類後行動、展開再合成、對抗式驗證、競賽、迴圈 | 3 |
| 每個被派出的代理配一個獨立驗證者；懷疑者代理濾誤報 | 3, 15 |
| 工作流不是每個任務都需要；先問是否真的需要更多算力 | 3 |
| 不受信任內容用無權限的讀取代理隔離 | 3 |
| sub-agent 獨立情境、只回摘要；查找類用小模型、改碼留給大模型 | 9, 6 |
| 團隊要小、任務自成一體；agent 團隊約耗 7 倍 token | 9 |
| 換模型時用 sub-agent 交接；分叉共用母情境前綴 | 5 |
| 每任務一個工作階段；並行任務沿檔案邊界切分 | 13 |
| 文件密集的查詢交給 sub-agent | 6 |
| 審查：多代理找缺陷加驗證者投票；全新情境審 diff；限制審查輪數 | 15 |
| 重複執行的明確任務用 Sonnet 5.5；長程代理式編碼用 Opus 5.5 | 10 |

### 主題 5 記憶與知識庫

| 建議 | 出處 |
|------|------|
| 記憶交給自動記憶 | 1 |
| skill 可內建資料型記憶（日誌、JSON、SQLite），放 `${CLAUDE_PLUGIN_DATA}` | 2 |
| 偏好存唯讀記憶庫、狀態存可讀寫記憶庫；每次執行重讀偏好；讀不到就停止 | 14 |
| 偏好副本不寫死在提示 | 14 |
| 任務檔存檔，讀檔不讀捲動紀錄 | 7 |
| HTML 檔留作日後參考 | 4 |
| 對話可在虛擬機回收後還原，未 commit 的檔案不會 | 13 |

### 主題 6 評分與稽核流程

| 建議 | 出處 |
|------|------|
| 評分準則加驗證代理，檢驗品味 | 1, 3 |
| 評分準則寫成可檢查的陳述；評審不是被測模型；先讀已評分紀錄驗證評分者 | 11 |
| 比較判斷優於絕對評分 | 3 |
| `REVIEW.md` 由擁有者撰寫：失敗長相、nit 上限、略過路徑、要求證據 | 15 |
| 驗證代理投票濾掉風格與清理類發現；測誤報 | 15 |
| 事故與撤回做成評測集；改動後分數升才保留 | 15 |
| 審查輪數設上限；風險分級決定人工介入；先嚴後鬆 | 15 |
| 人工審查前先跑審查：只列會擋合併的問題，附檔案、行號、重現方式 | 7 |
| 要求標出無法確認之處 | 7 |
| 完成前跑真實檢查；遷移後移除舊繞路寫法並重跑評測 | 10 |
| 任務附證明完成的指令；先讀證據再看 diff；修根因 | 13 |
| 低 effort 實作後審查，再用高 effort 驗證 | 8 |
| 指標先證明與真實結果相關；做成棘輪 | 16 |
| 每項回報前重新驗證現況，肯定或剔除 | 14 |
| 切訓練與測試集防過度配適；增益在噪音內不合併 | 11 |

### 主題 7 工具使用與權限

| 建議 | 出處 |
|------|------|
| 新增工具門檻要高；工具貼合模型能力；結構化互動用專屬工具 | 6 |
| 工具用延後載入，不移除；不中途改工具集 | 5, 1 |
| 破壞性指令保留權限提示 | 7 |
| 硬性封鎖用權限規則；mod 攔截只是安全網 | 12 |
| 隨用隨掛的 hook 擋危險指令或限制編輯範圍 | 2 |
| 無人值守時 MCP 工具要預先 `always_allow`，並配唯讀權杖 | 14 |
| 代理用範圍受限的憑證；秘密不放共用環境變數 | 14, 13 |
| 網路存取選最窄的一級；hooks 與 `.mcp.json` 放 repo | 13 |
| 讀取代理與行動代理做權限隔離 | 3 |
| CODEOWNERS、分支保護、合併佇列 | 15 |
| 工作階段中途增減 MCP 伺服器會使快取失效 | 9 |
| `tool_choice: auto` 加 `strict: true` 工具 | 10 |

### 主題 8 Claude 5 世代模型行為差異

| 建議或觀察 | 出處 |
|------------|------|
| 新世代模型判斷更好；Claude Code 系統提示刪去 80% 以上而評測無退步 | 1 |
| Opus 5.5：獨立執行更久、回報直白、每次回覆前先思考 | 7 |
| 不要加「想仔細一點」類提示；不要求在回覆展示推理 | 7, 10 |
| 舊提示的儀式性指示會讓 Opus 5.5 多寫、重複呼叫工具 | 9 |
| effort 依任務選；不沿用 Opus 5 的設定 | 8, 9 |
| Opus 5.5 當日常主力；Fable 5.1 用於結果比價格重要時；Sonnet 5.5 用於範圍明確的任務 | 9, 10 |
| Sonnet 5.5 預設思考；舊的 API 寫法會回 400 錯誤 | 10 |
| 被標記的訊息改由較舊模型處理 | 7 |
| 模型進步後，舊工具可能變成限制，需重新檢視 | 6 |

---

## claude.dev 未見

| 項目 | 結果 |
|------|------|
| Mythos 相關公告或遷移指南 | claude.dev 未見。搜尋 "Mythos" 只回傳文章 1 與 15，兩篇內文皆未提及 |
| Fable 5.1 的專屬公告或使用指南 | claude.dev 未見。Fable 5.1 只出現在文章 8、9 內。文章 1 連到的 Fable 指南位於 claude.com（非 claude.dev），未採用 |
| Opus 5.5 的專屬遷移指南 | claude.dev 未見。最接近的是文章 7、9 |
| 專門講 CLAUDE.md 怎麼寫的獨立文章 | claude.dev 未見。CLAUDE.md 建議散見文章 1、7、9、13、15。文章 7 連到 claude.com 的 CLAUDE.md 文章，未採用 |
| sub-agent 定義檔（agent frontmatter）的撰寫指南 | claude.dev 未見。只有文章 14 的 `agent.md` 範例與文章 9 的 `model:` 設定 |
| `fork` 的使用指南 | claude.dev 未見。文章 5 談「快取安全分叉」（壓縮用），文章 3 未提 fork |
| 專門的記憶與知識庫（wiki）文章 | claude.dev 未見。只有文章 1（自動記憶）、2（skill 內建記憶）、14（記憶庫）的片段 |
| 繁體中文版文章 | claude.dev 未見。中文關鍵字搜尋無 claude.dev 結果 |
| 2025 年下半年的相關文章 | claude.dev 未見。sitemap 的 16 篇最早為 2026-04-10 |
| 文章清單的分頁網址 `/posts`、`/blog/page/2/` | 兩個網址皆回傳 404 |
