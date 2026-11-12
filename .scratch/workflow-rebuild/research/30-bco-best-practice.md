# 票 30：題 B、C、O 的業界做法調研

> 主對話查證（2026-11-12）：引自 `13-pm-delivery-workflow.md` 第 27、34、44、45、46 行與 `18-issue-management-practice.md` 第 82 行的句子已對照原檔，相符。網頁引句由子代理取自抓取工具的摘要，主對話沒有逐字比對網頁；Claude Code hooks 頁的引句子代理稱取自頁面全文，主對話未查證。


調研日期：2026-11-12。本檔只列出處與原文句，不建議選甲或乙。
查證方式：網頁由抓取工具先經小模型摘要，引句取自摘要中以引號標出的片段，非整頁逐字比對。例外：Claude Code hooks 頁的引句取自抓回的頁面全文（存於本機暫存檔），可信度較高。引用本專案調研檔的句子，行號對應該檔現況。
標記：「未查證」表示沒有找到一手來源；「二手」表示來源不是原作者或官方。

## 題 B：票要不要重述或引用別處的規則

### 一、一手來源怎麼主張

| 主張 | 出處與原文句 | 備註 |
|------|-------------|------|
| 票只連結、不複寫 | `.scratch/workflow-rebuild/research/13-pm-delivery-workflow.md:44`。「Attach requests and feedback to the relevant issue」（Linear）；GitLab 溝通頁「The email or Slack message should not be the source of truth.」（同檔:34） | 兩句都在說「有一個正本，其他地方指向它」。Linear 那句談的是客戶回饋，不是規則，只能算旁證 |
| 複製貼上是反例 | 同檔:45。Adzic，gojko.net/2020/03/17/sbe-10-years.html，「copy-paste the scenarios to Jira tickets」 | Adzic 描述有團隊這樣做並造成麻煩（同檔轉述） |
| 單一主表徵 | 同檔:46。Cagan 2006，「there needs to be a single master representation of the spec」 | 原文談產品規格，不是票 |
| 長文放文件、掛在工作上 | 同檔:27。linear.app/docs/project-documents，「Use documents to keep long-form text attached to the work references.」 | 未載如何防止文件與議題分歧（同檔自註） |
| 反方：票是自包含的唯一正本 | 同檔:33。GitLab 手冊，「Issue descriptions shall always be maintained as the single source of truth.」 | 與上列「連回文件」並存：GitLab 以議題描述為正本，Linear 以文件為正本。兩家都只主張「一個家」，沒有一家直接回答「引用規則名一句」是否夠 |
| 反方：票是時點紀錄，不是現況正本 | `18-issue-management-practice.md:82`。Barden，benbarden.substack.com/p/tickets-are-transient-dont-use-them，「Tickets are transient. Don't use them as documentation.」 | 同檔自註：主張靠人定期更新文件，未給防漂移機制 |
| 規格比票長壽 | 同檔:84。aihero.dev/skills-to-spec，「The tickets are disposable and the spec is not,」 | 作者未署名；AI 代理工作流的看法 |
| 票之間的關聯功能 | https://linear.app/changelog/2020-03-04（搜尋摘要，非逐字）：Linear 提供「被擋住」「擋住」「相關」三種關聯 | 官方 Issue relations 頁抓取 404（`18-issue-management-practice.md:200` 同樣記載）。關聯只標出票與票的關係，來源未載它是否讓開發者看到被引用票的規則 |

### 二、擋「開發只看這張票而漏規則」的做法

| 做法 | 出處與原文句 | 限制 |
|------|-------------|------|
| 在票內放指向正本的連結，並維持正本唯一 | 見上表 13:44、13:27 | 連結端靠人維護（`13-pm-delivery-workflow.md` 同表「缺點」欄） |
| 用關聯功能把兩張票連起來，讓票頁面顯示相依 | Linear 2020-03-04 changelog（搜尋摘要） | 只顯示「有關」，不顯示規則內容；未查證關聯是否提示給實作者 |
| 把規則寫成可驗的情境，由測試擋漏 | `13-pm-delivery-workflow.md:47`，cucumber.io/docs/bdd/，「Producing system documentation that is automatically checked against the system's behaviour」 | 團隊需能維護自動化測試（同檔「缺點」欄：29% 使用者不自動化） |
| 規格結構對齊業務概念，一個規則的變更只動一處 | `13-pm-delivery-workflow.md:49`，「results in one small change in software」 | 需要穩定的領域模型 |

### 三、查不到的部分

- 業界「票內一句規則名引用」與「票完全不寫」兩種做法的比較：未查證，找不到任何官方頁談這個粒度。
- 「規格改了，票怎麼同步」：Linear、Atlassian 官方頁均未載（`18-issue-management-practice.md:86`）。
- 開發只看票而漏規則的發生率或調查數據：未查證。
- Linear 議題關聯官方頁原文：404，未取得。

## 題 C：預先設計未來需求

### 一、一手來源怎麼主張

| 主張 | 出處與原文句 | 備註 |
|------|-------------|------|
| 反對預先做（YAGNI） | https://martinfowler.com/bliki/Yagni.html，「Yagni originally is an acronym that stands for "You Aren't Gonna Need It".」 | Fowler 列四種成本：build、delay、carry、repair |
| 預先功能會增加持有成本 | 同頁，「The code for the presumptive feature adds some complexity to the software.」（摘要引句，Fowler 論述 cost of carry） | 持有成本在每個後續功能都要付，直到移除 |
| 預先猜的抽象多半會錯 | 同頁，「your current ideas of what abstractions you'll need will not match what you learn when you do actually need them.」 | |
| 適用條件：程式易改 | 同頁，「Yagni is only a viable strategy if the code is easy to change.」 | 這句也是反方的入口：資料已上線、改動成本高時，前提不成立 |
| 只限增加複雜度的預備 | 同頁，「yagni only applies when you introduce extra complexity now」；「it does not apply to effort to make the software easier to modify.」 | 預留欄位是否算「增加複雜度」，原文未談，未查證 |
| 資料庫可演進，不必預先定案 | https://martinfowler.com/articles/evodb.html，「techniques that allow a database design to evolve as an application develops.」 | 同文承認舊觀點：「For a long time, people in the database community considered database design as something that absolutely needs up-front planning.」 |
| 舊觀點的理由：上線後改結構痛苦 | 同頁，「Furthermore changing a schema after deployment resulted in painful data migration problems.」 | 這就是反方主張的出處：Fowler 轉述的是舊派理由，並非自己同意 |
| 延後決策，但只延後「不可逆」的 | Poppendieck 的最後負責時刻。書本原文未取得；二手摘要（Disciplined Agile 部落格，經搜尋摘要）：「scheduling irreversible decisions to the last possible moment.」 | 二手 |
| 最後負責時刻的批評 | Wirfs-Brock（wirfs-brock.com/blog/2011/01/18/agile-architecture-myths-2-architecture-decisions-should-be-made-at-the-last-responsible-moment，搜尋摘要）：「Just having a last-responsible moment mindset leaves me open to making late decisions.」 | 二手；批評的是延後過頭，並非主張預先設計 |
| 適用範圍：只用於改動成本高的決定 | DZone「lean tools last responsible」（搜尋摘要）：「The last responsible moment makes sense for decisions which are costly to change」 | 二手 |

### 二、擋「後面階段要回頭改已上線欄位」的做法

| 做法 | 出處與原文句 | 限制 |
|------|-------------|------|
| 每次結構變更盡量小 | evodb 頁，「Our usual rule is to make each database change as small as possible.」 | |
| 過渡期同時支援新舊結構 | 同頁，「A transition phase is a period of time when the database supports both the old access pattern and the new ones」 | 同頁自註：「It does add complexity, so it's important that it gets removed once downsteam systems have had time to migrate.」 |
| 結構變更與應用程式碼分開發布 | 同頁，「she can integrate the database change before updating the application code to use it」 | |
| 遷移腳本進版本控制 | 同頁，「a database migration script which is version controlled together with application code changes」 | |
| 前提：易改的程式碼靠重構、自測、持續交付 | Yagni 頁（摘要）：這些實務讓 YAGNI 可行 | 需要團隊已具備這些實務；本專案是 Prototype，是否具備未查證 |

### 三、查不到的部分

- 「ERP 這類資料模型變更成本高時，該預先設計」的一手主張：未查證。找到的反方只有 Fowler 轉述的舊派觀點與二手的最後負責時刻批評，沒有 ERP 領域的一手來源。
- Fowler 原文是否點名「對外介面等日後難加的項目不適用 YAGNI」：Yagni 頁摘要明言「The article doesn't mention costly-to-add-later items」，未查證。
- Fowler〈Who Needs an Architect〉的「難改的決定」句：PDF 無法解析，未查證。
- 本專案 `02-domain-principles.md`、`28-ba-sa-methods-practice.md`：以關鍵字搜尋（YAGNI、預留、延後、evolutionary 等）無命中，現有調研未涵蓋本題。

## 題 O：多代理在工作樹提交，自動推送與否

### 一、一手來源怎麼主張

| 主張 | 出處與原文句 | 備註 |
|------|-------------|------|
| 分支壽命短，最多數天 | https://trunkbaseddevelopment.com/short-lived-feature-branches/ ，「the branch should only last a couple of days.」；「Any longer than two days, and there is a risk of the branch becoming a long-lived feature branch.」 | 頁面談的是併入主幹的短命分支 |
| 工作樹的分支各自受同一限制 | 同頁，「Each branch in each worktree is still bound by the two-day rule, independently.」 | 直接對應多工作樹情境 |
| 至少每 24 小時提交到主幹 | https://trunkbaseddevelopment.com/ ，「all team members commit to trunk at least once every 24 hours.」 | 頁面談的是併入主幹，不是推到各自的分支；兩者不同 |
| 主幹只接受短命分支的收尾合併 | short-lived 頁，「Merges to main (trunk) are allowed only as part of closing out the short-lived feature branch.」 | 對應乙的「做完才推主分支」 |
| 分支併入後自動刪除 | GitHub 文件（enterprise-cloud 版，因 docs.github.com 現行版連結 404），https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches ，「You can have head branches automatically deleted after pull requests are merged in your repository.」；「Anyone with admin permissions to a repository can enable or disable the automatic deletion of branches.」 | 該設定針對合併請求（PR）的來源分支。本專案規則是「不開 PR、直接快轉推主分支」（AGENTS.md § 版本控管），此設定是否生效未查證 |
| 分支保護規則可能阻止自動刪除 | 同頁（搜尋摘要）：branch protection rules and repository rules can also prevent branches being automatically deleted | 搜尋摘要，非逐字 |

### 二、擋「代理忘記推，成果只留在本機」的做法

| 做法 | 出處與原文句 | 限制 |
|------|-------------|------|
| 以 Stop hook 在回合結束前檢查，發現有未推送提交就阻止結束 | https://code.claude.com/docs/en/hooks 。「`decision` | `"block"` prevents Claude from stopping. Omit to allow Claude to stop」；「A hook that blocks by exiting 2 routes the same way as `reason`: Claude receives the stderr message as the explanation for why it should continue.」 | Stop 事件是每個回合觸發，不是只在工作階段結束時觸發（同頁：「per turn: `UserPromptSubmit`, `Stop`, and `StopFailure`」） |
| 避免擋不下來的無限迴圈 | 同頁，「The `stop_hook_active` field is `true` when Claude Code is already continuing as a result of a stop hook. Check this value or process the transcript to avoid blocking on a condition that will never resolve.」 | 另有上限：`20-anthropic-setup-guidance.md:102`，「blocks eight stops in a row」，連擋八次後放行 |
| 子代理也有對應事件 | 同頁，「`SubagentStop` | Yes | Prevents the subagent from stopping」 | 本專案任務由子代理在工作樹執行，需確認 hook 掛在子代理事件上；掛法未查證 |
| 零例外規則用 hook，不用文字指示 | `20-anthropic-setup-guidance.md:94`，「certain actions always happen rather than relying on the LLM to choose to run them」；:95，「CLAUDE.md is for guidelines, and Claude is allowed to decide a guideline doesn't apply.」 | 同檔:99 提醒：hook 只給零例外規則，偏好不要設 hook |
| 檢查腳本應用 command 型 hook | `20-anthropic-setup-guidance.md:101`，「so it isn't deterministic either」（prompt 與 agent 型 hook 由另一個模型判斷） | |
| 腳本失敗時不會阻止結束 | hooks 頁（摘要）：Stop 的 `onFailure: "block"` 無效；原文句「exit code 2 on these events sends Claude back to keep working, and Claude can't repair a hook that won't run」 | 檢查腳本本身壞掉時會靜默放行，需另有監控；監控做法未查證 |
| SessionEnd 無法阻止結束 | hooks 頁，「SessionEnd hooks have no decision control. They can't block session termination but can perform cleanup tasks.」；預設逾時：「SessionEnd hooks have a default timeout of 1.5 seconds.」 | 可用來做結束時的推送動作，但不能擋；1.5 秒對網路推送偏短，可用 `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` 調整（同頁） |
| 以 git 為狀態檢查點，新工作階段從紀錄讀回 | `20-anthropic-setup-guidance.md:132`，「Use git for state tracking」；:133，「Read the git logs and progress files to get up to speed」 | 前提是成果已提交；未推送時只存在本機工作樹 |

### 三、查不到的部分

- 業界對「每次提交都推到遠端分支」與「做完才推」的頻率建議：trunk-based development 只談併入主幹的頻率與分支壽命，沒有談「推到自己的遠端分支」的頻率，未查證。
- 無 PR 流程下 GitHub 自動刪分支是否適用：未查證。
- 「Stop hook 檢查未推送提交」的現成範例：官方頁只給事件與欄位，沒有 git 範例；指令寫法（例如比對本地與遠端分支）是我的推論，未查證，未列入上表。
- 多代理並行推送同一遠端的衝突或競爭處理：未查證。
