# 調研 19：跨需求追蹤與工作階段交接的現成方案

主對話抽查（2026-11-12）：相符：matt `handoff` 原文寫明存到作業系統暫存目錄、不放工作區，且設為只能由使用者啟動；productivity 外掛的 `task-management` 用工作目錄下單一 `TASKS.md`。公開方案（CCPM、Backlog.md、BMAD、各交接 skill）的描述主對話沒有對照原始檔，採用前要再讀。星數未驗證。

- 調研日：2026-11-12
- 範圍：本機已安裝的外掛與 skill、GitHub 公開方案、Claude Code 內建功能
- 方法：本機檔案逐一讀原文；公開程式庫以 GitHub 介面（API）取得星數與最後提交日，再讀 README 與核心指令檔；官方文件下載為 Markdown 後閱讀。沒讀到的一律標「未查證」。
- 引句規則：每句不超過 15 個英文字詞，逐字取自原文；不引者以轉述表示。
- 本檔只報現成的有什麼、怎麼運作、缺什麼，不設計新方案。

需求對照（以下簡稱「條件」）：

| 代號 | 條件 |
|------|------|
| a | 跨需求追蹤：同時多個需求處於不同階段，代理隨時答得出每個在哪、卡誰、下一步 |
| b | 工作階段交接：對話滿了，新對話從檔案接續，不靠使用者重述 |
| 條件一 | 工作記在 git 程式庫的 Markdown 檔 |
| 條件二 | 不用 Linear 管自己的工作 |
| 條件三 | 使用者不下指令，代理自己判斷 |
| 條件四 | 一人使用 |

---

## 一、摘要

1. 沒有任何一個現成方案同時滿足 a、b 與四項條件。最接近 a 的是 CCPM 與 BMAD 第 7 版預覽版的產品負責人（PO）代理；最接近 b 的是 matt 外掛的 `handoff` 與數個第三方交接 skill。
2. matt 外掛內有兩套可直接對映需求追蹤的機制：`wayfinder`（地圖檔加票檔）與本機 Markdown 票檔慣例（Sens 的 `docs/agents/issue-tracker.md` 已採用）。這套機制以「一個主題一張地圖」為單位，不是跨主題的總覽。
3. matt 的 `handoff` 把檔案寫到作業系統暫存目錄，不放工作區（原文規定）；官方說明提醒重開機會清空。與「從 repo 檔案接續」衝突。
4. matt 的 `chief-of-staff`（in-progress，beta）最接近「一個長期代理自己維護記憶」：記憶存成 wiki，每條主張標日期，寫歷史不寫現況。這與 Miles 全域規範「本體只呈現當前生效內容」方向相反。
5. 本次讀到的「交接」skill 多數由使用者下指令觸發（matt `handoff`、`claude-handoff` 設為不可由模型自動呼叫；gstack、REMvisual、392fyc 皆為使用者指令）。說明寫明模型可自動啟用的是 softaworks 的 `session-handoff`、continuous-claude-v3、superpowers；追蹤類則有 CCPM、beads、Backlog.md、Anthropic `task-management`。
6. Claude Code 內建的 Projects（專案）功能最貼近「只給需求，代理分派並追蹤」，但處於公開測試版，且狀態存在雲端，不在 git 程式庫的 Markdown 檔；官方文件載明不支援終端機命令列版。
7. 內建壓縮（compact）後，專案根目錄的 CLAUDE.md 與自動記憶會從磁碟重新注入；對話中的細節指示可能遺失。官方建議把持久規則放進 CLAUDE.md。
8. 官方外掛庫（claude-plugins-official）與 anthropics/skills 都沒有跨需求追蹤的 skill。Anthropic 的 productivity 外掛用單一 `TASKS.md` 加確認機制，沒有「階段」與「卡誰」欄位的定義，且寫明「不經確認不自動新增」。
9. 星數與提交日顯示：matt、superpowers、spec-kit、BMAD、beads、Backlog.md、CCPM 近期都在更新；Task Master 最後提交為 2026-04-28，較舊。
10. 資料庫型方案（beads 用 Dolt、continuous-claude 用 PostgreSQL）不是 Markdown，違反條件一。

---

## 二、本機已安裝

### 2.1 外掛與 skill 全名清單

來源：`~/.claude/plugins/installed_plugins.json` 與 `~/.claude/plugins/cache/`。

| 外掛（版本） | skill 名稱 |
|------|------|
| mattpocock-skills 1.3.2（快取另有 1.2.0 舊版） | engineering：ask-matt、code-review、codebase-design、diagnosing-bugs、domain-modeling、grill-with-docs、implement、implement-spec、improve-codebase-architecture、pr、prototype、research、retro、setup-matt-pocock-skills、tdd、to-spec、to-tickets、triage、wayfinder、wizard。productivity：grill-me、grilling、handoff、teach、to-questionnaire、wait-what、writing-for-agents。in-progress：chief-of-staff、claude-handoff、loop-me、setup-ts-deep-modules、software-factory、writing-beats、writing-fragments、writing-shape。misc：git-guardrails-claude-code、migrate-to-shoehorn、scaffold-exercises、setup-pre-commit |
| superpowers 5.1.0 | brainstorming、dispatching-parallel-agents、executing-plans、finishing-a-development-branch、receiving-code-review、requesting-code-review、subagent-driven-development、systematic-debugging、test-driven-development、using-git-worktrees、using-superpowers、verification-before-completion、writing-plans、writing-skills |
| product-management 1.2.0（knowledge-work-plugins） | competitive-brief、metrics-review、product-brainstorming、roadmap-update、sprint-planning、stakeholder-update、synthesize-research、write-spec |
| productivity 1.3.1（來自 claude.ai 帳號同步，路徑 `~/.claude/plugins/synced/.../productivity`，不在 installed_plugins 清單） | memory-management、start、task-management、update（另附 dashboard.html） |
| pm-skills（47 個獨立安裝項，deanpeters/Product-Manager-Skills，提交 70fb6c4e4163） | acquisition-channel-advisor、ai-shaped-readiness-advisor、altitude-horizon-framework、business-health-diagnostic、company-research、context-engineering-advisor、customer-journey-map、customer-journey-mapping-workshop、director-readiness-advisor、discovery-interview-prep、discovery-process、eol-message、epic-breakdown-advisor、epic-hypothesis、executive-onboarding-playbook、feature-investment-advisor、finance-based-pricing-advisor、finance-metrics-quickref、jobs-to-be-done、lean-ux-canvas、opportunity-solution-tree、pestel-analysis、pol-probe、pol-probe-advisor、positioning-statement、positioning-workshop、prd-development、press-release、prioritization-advisor、problem-framing-canvas、problem-statement、product-sense-interview-answer、product-strategy-session、proto-persona、recommendation-canvas、roadmap-planning、saas-economics-efficiency-metrics、saas-revenue-growth-metrics、skill-authoring-workflow、storyboard、tam-sam-som-calculator、user-story、user-story-mapping、user-story-mapping-workshop、user-story-splitting、vp-cpo-readiness-advisor、workshop-facilitation |
| andrej-karpathy-skills 1.0.0 | karpathy-guidelines |
| watch 0.2.0（claude-video） | watch |
| eli5 1.0.0（claude-community） | eli5 |
| `~/.claude/skills/gstack`（版本檔 1.39.0.0） | 子目錄共 60 餘項，與追蹤、交接有關者：context-save、context-restore、learn、retro、ship、autoplan、plan-eng-review、plan-ceo-review；其餘為瀏覽器、設計、稽核、部署類（autoplan、benchmark、browse、canary、careful、codex、cso、design 系列、investigate、land-and-deploy、qa 系列、review 等） |
| `~/.claude/skills`（其他） | obsidian-cli |
| `~/.claude/skills/synced` | docs、docx、google-workspace、import-memory、morning、pdf、pptx、skill-creator、xlsx |
| `~/.claude/mods/erp-test-map` | 不是 skill，是 Claude Code 介面外掛（mod，畫面側欄） |

pm-skills 47 項中，與「追蹤」字面相關者只有 `roadmap-planning`、`epic-breakdown-advisor`、`workshop-facilitation`；已讀其說明與前段內容。`workshop-facilitation` 的進度標籤（如「第 x 題共 8 題」）只存在單次對話內，沒有檔案；其餘項目是框架型提問 skill，未發現跨工作階段狀態檔（以搜尋字樣 handoff、TASKS.md、across sessions 檢查，命中者皆為一般用語，未逐一展開讀完）。

### 2.2 與追蹤、交接有關的本機項目（逐項）

#### matt `handoff`（`mattpocock-skills/1.3.2/skills/productivity/handoff/SKILL.md`）

| 欄位 | 內容 |
|------|------|
| 解決問題 | b |
| 狀態存放 | 單一 Markdown 檔，寫到作業系統暫存目錄（`$TMPDIR`，否則 `/tmp`），明文規定不放目前工作區 |
| 新階段如何接續 | 使用者在新階段指向該檔；官方說明頁建議「指向檔案，不要貼進 shell 指令」。skill 內容含「suggested skills」段 |
| 引句 | "so a fresh agent can continue the work" |
| 觸發 | 使用者下指令。前置資料標 `disable-model-invocation: true`，模型不會自行呼叫 |
| 避免重複記錄 | 明文規定已寫在規格、計畫、決策紀錄、議題、提交、差異檔的內容用路徑或網址指向，不複製。引句："Do not duplicate content already captured in other artifacts" |
| 外部服務 | 無 |
| 成熟度 | 外掛 1.3.2（2026-11-04 安裝）；`mattpocock/skills` 程式庫 GitHub 介面回報星數 321723、最後推送 2026-11-11、MIT |
| 已知限制 | 官方說明頁（`docs/productivity/handoff.md`）自述：暫存目錄不持久（重開機會清空 `/private/tmp`）；「捕捉了做什麼，沒捕捉為什麼」是常見批評；模型可能把未驗證的信念寫成事實，下一階段不會重查 |
| 條件一 | 不符（暫存目錄，非 repo） |
| 條件二 | 符合 |
| 條件三 | 不符（使用者下指令） |
| 條件四 | 符合 |

#### matt `claude-handoff`（in-progress，`skills/in-progress/claude-handoff/SKILL.md`）

| 欄位 | 內容 |
|------|------|
| 解決問題 | b |
| 狀態存放 | 同 `handoff`，寫入暫存目錄後以命令列背景啟動新代理，檔案內容成為新代理的第一個提示 |
| 新階段如何接續 | 自動：新的背景代理一開始就帶著摘要。使用者以 `claude agents` 管理 |
| 引句 | "Hand the current conversation off to a fresh background agent" |
| 觸發 | 使用者下指令（`disable-model-invocation: true`） |
| 外部服務 | 無 |
| 成熟度 | 位於 in-progress；該目錄 README 寫明「可能無預警變更或消失」，不在外掛內，須另以命令列安裝 |
| 已知限制 | 摘要成為提示字串；SKILL 內提醒用檔案傳遞以免 shell 展開反引號與 `$` |
| 條件一 | 不符 |
| 條件二 | 符合 |
| 條件三 | 不符 |
| 條件四 | 符合 |

#### matt `wayfinder`（`skills/engineering/wayfinder/SKILL.md`，加 `docs/engineering/wayfinder.md` 與 `issue-tracker-local.md`）

| 欄位 | 內容 |
|------|------|
| 解決問題 | a 的一部分（單一大型主題內的決策追蹤）與 b（跨工作階段靠地圖檔接續） |
| 狀態存放 | 本機模式：`.scratch/<主題>/map.md`（目的地、備註、已定決策索引、未明確區、範圍外）；每個決策一個 `.scratch/<主題>/issues/NN-slug.md`，檔內有 `Type:`、`Status:`（claimed 或 resolved）、`Blocked by:` 行，答案寫在 `## Answer` 段 |
| 新階段如何接續 | 載入地圖，查「最前緣」（未被阻擋、未被認領的票）。未指定票時由代理選。引句："you pick the next decision, not the user" |
| 觸發 | 使用者輸入 `/wayfinder`（前置資料標不可由模型自動呼叫）；單一階段內由代理自行選票 |
| 避免重複記錄 | 地圖是索引，不是倉庫。引句："a decision lives in exactly one place, its ticket" |
| 外部服務 | 無（本機模式）；可選 GitHub 或 GitLab 子議題 |
| 成熟度 | 外掛正式發布項目（在 `plugin.json` 的 skills 陣列）；官方說明頁有「常見問題」 |
| 已知限制 | 官方說明頁自述最常見的失敗：代理在地圖階段開始寫正式程式碼（因備註由代理自己寫，可自行放行）；27 張票做到第 13 張後面的票失去意義（過度先期規劃）；每題三段落的長問法造成決策疲勞；已關閉決策被推翻時無官方做法。每個階段只解一張票（研究票例外） |
| 與條件對照 | 一：符合（本機模式）。二：符合。三：部分符合（地圖與票檔狀態由代理維護，但啟動靠使用者輸入指令）。四：符合。缺口：地圖以「一個主題」為單位，沒有跨主題總覽；票型只有研究、原型、訪談、任務四種，不含「等使用者看原型」「已開票給工程」「待驗收」等階段 |

Sens 工作樹已採用：`docs/agents/issue-tracker.md` 的「Wayfinding operations」段與該檔相同；`.scratch/workflow-rebuild/map.md` 即為實例。

#### matt `to-tickets`、`implement-spec`、`implement`、`triage`

| 欄位 | 內容 |
|------|------|
| 解決問題 | 追蹤程式實作票的狀態與阻擋關係；對 Miles「設計、原型」階段不直接適用 |
| 狀態存放 | `to-tickets`：本機寫 `.scratch/<主題>/issues/<NN>-<slug>.md`，每檔有 `Blocked by`、`Status: ready-for-agent` 與驗收勾選框。`triage`：以 `Status:` 行標五種狀態（needs-triage、needs-info、ready-for-agent、ready-for-human、wontfix） |
| 接續 | `implement-spec` 原文："Start every subagent with a fresh context window." 協調者讀規格與票，建任務圖，只用「上下文指標」與子代理溝通 |
| 觸發 | 使用者輸入指令（皆為不可由模型自動呼叫） |
| 限制 | `triage` 原文要求每則貼到議題的留言都以固定免責句開頭，本機模式下的寫法未讀 |
| 與條件對照 | 一：符合（本機模式）。二：符合。三：不符。四：符合 |

#### matt `chief-of-staff`（in-progress，`skills/in-progress/chief-of-staff/SKILL.md`）

| 欄位 | 內容 |
|------|------|
| 解決問題 | a 與 b 兩者的設計意圖：一個長工作階段的協調者，使用者是長期目標的直接責任人 |
| 狀態存放 | 一個 wiki：資料夾內互相連結的 Markdown 頁，`index.md` 列全部頁面並附一行摘要，一頁一件事（決策、反覆問題、使用者偏好）。引用的議題、PR、逐字稿、子代理報告不複製、不編輯，只引用 |
| 新階段如何接續 | 先找共用 wiki；做決策前先讀 `index.md` 與其指向的頁面。引句："Look for a shared wiki first" |
| 觸發 | 使用者輸入指令（不可由模型自動呼叫）；啟動後協調者自行派子代理、建議排程 |
| 避免重複記錄 | 來源不複製；新知識寫入時要更新「它觸及的每一頁與索引」。「寫歷史不寫現況」：每條主張標日期，涉及程式碼標提交，舊主張標為已被取代而不改寫。引句："The wiki is a historical record." |
| 外部服務 | 無 |
| 成熟度 | in-progress（beta）；CHANGELOG 1.3.2 記載更新為「LLM wiki」寫法；本次未找到獨立的使用成效紀錄 |
| 已知限制 | 原文要求所有工作都派子代理；一個長工作階段自身仍會壓縮，遺失靠 wiki 補。每五個子代理階段約跑一次 `retro` |
| 與條件對照 | 一：符合。二：符合。三：符合（設計目標即由協調者自行判斷）。四：符合。衝突：「寫歷史、舊主張標已取代不改寫」與 Miles 全域規範「收斂層本體只呈現當前生效內容、不堆疊歷史」方向相反 |

#### matt `loop-me`、`software-factory`、`retro`、`ask-matt`

| 項目 | 讀到的內容 |
|------|-----------|
| `loop-me`（in-progress） | 一個有狀態的訪談階段，產出「工作流」規格檔 `workflows/*.md`，加 `NOTES.md` 記使用者世界與術語。詞彙含「檢查點」「brief（決策用摘要）」，並主張「推遲檢查點」：引句 "defer the checkpoint as far as it will go"。產出是規格，不是運行中的追蹤狀態 |
| `software-factory`（in-progress） | 只提供設計用語與五個提問（誰觸發、讀寫哪些服務、接著觸發什麼、人在哪裡重新進入、什麼阻止重複做），不含執行程式。引句："A run never waits for a human" |
| `retro` | 讀指定階段的紀錄，依七類找環境改善候選，列給使用者，不自行修改 |
| `ask-matt` 的階段邊界（`PHASE-BOUNDARIES.md`） | 五選項決策樹：繼續、清空、交接、子代理、壓縮；壓縮是預設但不是第一個考慮。本檔已由 `04-matt-flow.md` 第四節整理，不重述 |

#### Anthropic `productivity` 外掛（`task-management`、`memory-management`、`start`、`update`）

| 欄位 | 內容 |
|------|------|
| 解決問題 | a（單一清單）與工作記憶（人名、術語、專案代號） |
| 狀態存放 | 目前工作目錄的 `TASKS.md`（四區：Active、Waiting On、Someday、Done；每筆 `- [ ] **標題** - 脈絡、對象、期限`）；`CLAUDE.md` 當熱快取（約 50 至 80 行），`memory/` 放詞彙表、人、專案、脈絡頁；另有可讀寫同一份 `TASKS.md` 的 `dashboard.html` |
| 新階段如何接續 | task-management 說明："Reference this when the user asks about their tasks" |
| 觸發 | `task-management` 與 `memory-management` 標 `user-invocable: false`，由模型依使用者問題自動引用；`/start`、`/update` 由使用者下指令 |
| 避免重複記錄 | 熱快取與詞彙表分層，常用升級、過時降級；但「專案」在 `CLAUDE.md`、`memory/projects/`、`glossary.md` 都可能出現 |
| 外部服務 | 預設連接 Slack、Notion、Asana、Linear、Atlassian、monday、ClickUp 等（`.mcp.json`），可不連；`update` 會從專案追蹤工具抓指派給使用者的任務 |
| 成熟度 | 版本 1.3.1；`anthropics/knowledge-work-plugins` 星數 35444、最後推送 2026-11-11、Apache-2.0。此外掛由帳號同步，非本機安裝清單項目 |
| 已知限制 | README 稱主要為 Cowork 設計，「也能在 Claude Code 運作」；`update` 引句："Never auto-add tasks or memories without user confirmation"；沒有需求階段、阻擋原因、下一步的欄位定義 |
| 條件一 | 符合（`TASKS.md`） |
| 條件二 | 部分（預設會同步 Linear 等，可不連） |
| 條件三 | 不符（新增須確認，`update` 須指令） |
| 條件四 | 符合 |

#### Anthropic `product-management` 外掛

讀完 `roadmap-update`、`sprint-planning`、`stakeholder-update`；`write-spec`、`product-brainstorming`、`synthesize-research`、`metrics-review`、`competitive-brief` 讀前段。

| 欄位 | 內容 |
|------|------|
| 解決問題 | 文件產出（路線圖更新、衝刺計畫、利害關係人更新），不是狀態追蹤 |
| 狀態存放 | 無檔案。`roadmap-update` 沒連專案追蹤工具時，引句："Ask the user to describe their current roadmap or paste/upload it" |
| 接續 | 無 |
| 觸發 | 使用者以斜線指令啟動 |
| 外部服務 | 選用：專案追蹤工具、聊天、知識庫、分析工具（`CONNECTORS.md`） |
| 成熟度 | 1.2.0，2026-05-31 安裝 |
| 與條件對照 | 一：不符（無狀態檔）。三：不符。可借用部分：路線圖「現在、下一步、之後」三欄格式與「狀態：進行中、有風險、卡住、完成、已取消」五態列舉（`roadmap-update` 內） |

#### superpowers 5.1.0（`~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0`）

已讀：`executing-plans`、`writing-plans`、`subagent-driven-development`、`using-superpowers`（前段）、`dispatching-parallel-agents`（前段）、`using-git-worktrees`（前段）、`RELEASE-NOTES.md`、`hooks/hooks.json`。

| 欄位 | 內容 |
|------|------|
| 解決問題 | 單一功能的「計畫、逐任務執行、審查」；b 只在「計畫檔存在」意義上成立，a 不處理 |
| 狀態存放 | 計畫檔預設存 `docs/superpowers/plans/YYYY-MM-DD-<功能>.md`，任務用勾選框；執行進度記在工作階段內的任務清單，不寫回檔案（`executing-plans` 說「Create TodoWrite」） |
| 新階段如何接續 | `executing-plans` 說明（獨立工作階段執行計畫）："Load plan, review critically, execute all tasks, report when complete." |
| 觸發 | 模型自動：`using-superpowers` 要求「有 1% 可能適用就必須呼叫」；另有 SessionStart 鉤子（啟動、清除、壓縮時執行）注入 |
| 避免重複記錄 | 無機制；`writing-plans` 要求每步含完整程式碼，計畫檔內容與程式碼會重複 |
| 外部服務 | 無 |
| 成熟度 | 5.1.0（2026-04-30 發布）；`obra/superpowers` 星數（GitHub 介面）316126、最後推送 2026-11-03、MIT |
| 已知限制 | `subagent-driven-development` 引句："Do not pause to check in with your human partner between tasks." 與 Miles 需求的「他問現在做什麼」相容，但無跨需求視角；原文含「絕不在主分支上開工」之類硬規則 |
| 條件對照 | 一：部分（計畫檔是 Markdown，進度不是）。二：符合。三：符合（自動呼叫）。四：符合。本專案 `docs/superpowers/plans/` 與 `specs/` 已有 2026-06 至 07 的歷史計畫（讀前段，確認是一次性計畫與設計文件，不含跨需求狀態檔） |

#### gstack 的 `context-save`、`context-restore`、`learn`

已讀：兩個 skill 的指令主體（略過共通前導段）。

| 欄位 | 內容 |
|------|------|
| 解決問題 | b |
| 狀態存放 | `~/.gstack/projects/<專案代號>/checkpoints/<時間>-<標題>.md`，位於家目錄，不在程式庫。檔頭含 `status`（in-progress 或 completed）、`branch`、`timestamp`、`files_modified`；內文四段：摘要、已做決策、剩餘工作（依優先序）、備註。檔案只追加、不覆寫 |
| 新階段如何接續 | `context-restore` 預設載入最近一份，跨所有分支。引句："load the most recent saved context across ALL branches" |
| 觸發 | 使用者下指令（說「save progress」等）；前導段另有「持續檢查點模式」：以 `WIP:` 前綴自動提交並在提交訊息內夾註決策與剩餘工作，須先開啟設定 |
| 避免重複記錄 | 檔案只追加；舊檔不標已取代，靠時間戳排序。無去重機制 |
| 外部服務 | 無必要；前導段含遙測與 gbrain 同步設定（只讀到標題與腳本片段，未逐行讀完） |
| 成熟度 | 本機 gstack 版本檔 1.39.0.0；未查其上游星數 |
| 已知限制 | 狀態在 repo 外；`context-save list` 預設只列當前分支，`context-restore` 不分分支 |
| 條件對照 | 一：不符（家目錄）。二：符合。三：不符（使用者下指令）。四：符合 |

#### Claude Code 介面外掛 `~/.claude/mods/erp-test-map`

只讀 `plugin.json`、`hooks.json` 與 `register.tsx` 前 50 行。內容是「ERP 畫面測試的即時進度與涵蓋地圖」：讀測試回報器寫出的 `live.json`，每秒檢查，並把 wiki 情境卡、情境目錄、測試結果對映成畫面。與需求追蹤無關，但顯示一個既有做法：以介面外掛（mod）在側欄即時呈現檔案狀態。未讀 mod 的 API 文件，不評論可行性。

#### 本機其他

| 項目 | 結論 |
|------|------|
| `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/ralph-loop`（官方外掛快照，非已安裝） | 以停止鉤子（Stop hook）擋住結束並重送同一提示，狀態檔 `.claude/ralph-loop.local.md`（前置資料含 `iteration`、`max_iterations`、`completion_promise`、`session_id`）；引句："Claude's previous work persists in files"。適合「迭代到完成」的單一任務，不是跨需求追蹤 |
| 同上 `claude-md-management` | `revise-claude-md` 指令：回顧當次工作階段，提出要加入 CLAUDE.md 的一行式補充，須顯示差異並經使用者核可（讀指令前 50 行） |
| 同上 `session-report` | 產生 token 用量 HTML 報告，與追蹤無關 |
| `knowledge-work-plugins/engineering` 的 `standup`、`operations` 的 `status-report`（marketplace 快照） | 由提交、票、聊天組成「昨天、今天、卡住」與「狀態報告」格式；無持久狀態 |
| Sens `docs/superpowers/` | `plans/` 十三份、`specs/` 八份歷史計畫與設計，皆一次性文件；`plans/2026-06-03-phase0-delta-worklist.json` 是一次性工作清單 |
| Sens `docs/agents/` | 本機 Markdown 票據與 wayfinder 慣例、五個分類標籤、領域文件讀取規則（已讀全文） |

---

## 三、公開方案

星數、最後推送日取自 2026-11-12 對 GitHub 介面的查詢。

### 3.0 查證對象是否存在

| 名稱 | 結果 |
|------|------|
| anthropics/claude-code | 存在；星數 155284；最後推送 2026-11-11。本檔以官方文件站與本機的外掛庫快照取代逐檔閱讀此程式庫 |
| anthropics/claude-plugins-official | 存在；星數 46874；最後推送 2026-11-11；Apache-2.0。內部外掛 `plugins/` 共 36 項（本機快照），無跨需求追蹤類；`external_plugins/` 有 linear、github、gitlab、asana 等追蹤工具連接器（屬 Linear 類，不符條件二，未讀） |
| anthropics/skills | 存在；星數 192941；最後推送 2026-11-06。skill 清單：academy-guide、algorithmic-art、brand-guidelines、canvas-design、claude-api、discernment-nudge、doc-coauthoring、docx、frontend-design、internal-comms、mcp-builder、pdf、pptx、skill-creator、slack-gif-creator、theme-factory、web-artifacts-builder、webapp-testing、xlsx；無追蹤類 |
| anthropics/knowledge-work-plugins | 存在；星數 35444；最後推送 2026-11-11；Apache-2.0。外掛：bio-research、cowork-plugin-management、customer-support、data、design、engineering、enterprise-search、finance、human-resources、legal、marketing、operations、partner-built、pdf-viewer、product-management、productivity、sales、small-business |
| obra/superpowers | 存在，見 2.2 |
| steveyegge/beads | 舊網址已轉址；現在位置 `gastownhall/beads` |
| MrLesk/Backlog.md | 存在 |
| eyaltoledano/claude-task-master | 存在 |
| automazeio/ccpm | 存在 |
| github/spec-kit | 存在 |
| bmad-code-org/BMAD-METHOD | 存在 |

### 3.1 beads（gastownhall/beads，原 steveyegge/beads）

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/gastownhall/beads`；命令列工具 `bd`，需先安裝程式 |
| 解決問題 | a 與 b：給代理的「依賴關係圖」議題追蹤，取代雜亂的 Markdown 計畫。引句："It replaces messy markdown plans with a dependency-aware graph" |
| 狀態存放 | Dolt（版本控制的 SQL 資料庫）。預設嵌入模式，資料在 `.beads/embeddeddolt/`。`.beads/issues.jsonl` 只是匯出檔，README 明說它 "not the source of truth or a backup" |
| 新階段如何接續 | `bd init` 寫入 `AGENTS.md` 片段並安裝 Claude Code 鉤子；代理跑 `bd prime` 取得工作流脈絡與持久記憶，`bd ready` 列無阻擋的任務，`bd update <id> --claim` 認領 |
| 觸發 | 模型依 `AGENTS.md` 指示自行呼叫；鉤子由 `bd setup claude` 安裝（鉤子內容未讀） |
| 避免重複記錄 | 單一資料庫為正本；雜湊式編號避免多代理合併衝突；有「壓縮」機制把舊的已關閉任務摘要化 |
| 外部服務 | 無必要；跨機器同步經 git 遠端的 `refs/dolt/data` |
| 成熟度 | 星數（轉址後）28672；最後推送 2026-11-10；MIT；有 Homebrew、npm 發行 |
| 已知限制 | 結構化資料庫，不是 Markdown；升級跨 schema 時有「只由一個指定副本執行遷移」的流程；README 另有安全與 HTTP 後端的長篇說明 |
| 條件一 | 不符（Dolt 資料庫） |
| 條件二 | 符合 |
| 條件三 | 符合（自動呼叫） |
| 條件四 | 符合（有隱身模式 `--stealth`，不提交檔案到主 repo） |

### 3.2 Backlog.md（MrLesk/Backlog.md）

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/MrLesk/Backlog.md`；命令列工具 `backlog`（npm 套件 `backlog.md`） |
| 解決問題 | a（看板、依賴、里程碑）與 b（任務檔含計畫、筆記、最終摘要） |
| 狀態存放 | 專案內 `backlog/` 資料夾，一任務一個 `.md` 檔；前置資料含 `id`、`title`、`status`、`assignee`、`labels`、`dependencies`、`references`、`modified_files`、`priority`、`type`、`ordinal`，內文有「描述」「驗收條件」「完成定義」區塊 |
| 新階段如何接續 | MCP 概覽指令寫明：任務要能讓沒看過對話的人接手。引句："Tasks must include enough context for someone without the current conversation to start work." |
| 觸發 | 模型自動：`backlog init` 寫一份短指示檔叫代理先跑 `backlog instructions overview`（或註冊 MCP 伺服器）；由代理依指示建任務、改狀態 |
| 避免重複記錄 | 完成的任務留在 git 當永久紀錄；封存而不刪；任務內分「留言」（討論）、「實作筆記」（執行進度）、「最終摘要」三處，各有用途。不得手動改檔：MCP 說明有 "Never edit markdown files directly" |
| 外部服務 | 無。README 稱 "no server, no account, no telemetry" |
| 成熟度 | 星數 7355；最後推送 2026-11-10；最新發行 v1.55.3（2026-10-23）；MIT；自身專案用它管理（已讀其任務檔） |
| 已知限制 | 一任務一情境視窗為設計前提（README 流程：一次一任務、一任務一 PR）；偏向工程實作任務，欄位無「等使用者看原型」之類階段，狀態由設定檔定義；跨需求總覽靠看板與 `task_list` 篩選 |
| 條件一 | 符合（Markdown 在 repo） |
| 條件二 | 符合 |
| 條件三 | 部分符合（代理自行操作，但流程預設在三個檢查點等使用者審；未讀 task-execution 指南全文） |
| 條件四 | 符合 |

### 3.3 Task Master（eyaltoledano/claude-task-master）

| 欄位 | 內容 |
|------|------|
| 位置 | 套件 `task-master-ai`；MCP 伺服器或命令列 |
| 解決問題 | a（任務、依賴、下一個任務），源頭是需求文件（PRD）拆解 |
| 狀態存放 | `tasks.json`（官方文件頁：主任務資料）與逐任務純文字檔；PRD 放 `.taskmaster/docs/prd.txt`。完整目錄路徑文件頁未載（經抓取工具摘要，未逐字核對，見「未查證」） |
| 新階段如何接續 | 向代理問「下一個該做的任務」（`next` 指令）；核心工具有 `get_tasks`、`next_task`、`set_task_status` 等 |
| 觸發 | 使用者在聊天說話後由 MCP 工具執行 |
| 外部服務 | 需要至少一組模型服務金鑰（Anthropic、OpenAI 等），或 Claude Code 命令列；研究功能建議用 Perplexity |
| 成熟度 | 星數 28345；最後推送 2026-04-28（距今約六個半月）；最新發行 0.43.1（2026-03-31）；授權為 MIT 加商用限制條款（Commons Clause），GitHub 介面回報 NOASSERTION |
| 已知限制 | JSON 為主，非 Markdown；需另外的模型呼叫；README 重點在由 PRD 生成任務，不含「階段」概念；較舊 |
| 條件一 | 不符（JSON） |
| 條件二 | 符合 |
| 條件三 | 部分 |
| 條件四 | 符合 |

### 3.4 CCPM（automazeio/ccpm）

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/automazeio/ccpm`；現為 Agent Skill，入口 `skill/ccpm/SKILL.md`，參考檔在 `references/`，15 支 bash 指令稿；舊的 `/pm:*` 斜線指令版在 `v1` 分支 |
| 解決問題 | a 與 b：PRD、技術 epic、任務、GitHub 議題、平行代理，加「標準站會、卡住、下一個」報表 |
| 狀態存放 | `.claude/prds/<名>.md`（`status: backlog、active、completed`）；`.claude/epics/<名>/epic.md`（`status: backlog、in-progress、completed`、`progress`、`prd`、`github`）；任務檔 `<N>.md`（`status: open、in-progress、closed`、`depends_on`、`parallel`、`conflicts_with`）；`updates/<議題>/progress.md` 記各代理進度；完成的 epic 移到 `archived/` |
| 新階段如何接續 | 狀態在檔案。引句："project state lives in files, not in your head or chat history" |
| 觸發 | 模型自動：引句 "CCPM activates automatically when your agent detects PM intent."；`track.md` 規定：追蹤類查詢必須直接執行指令稿，不由模型自己重組，並且寫明 "The LLM is not needed for these" |
| 避免重複記錄 | 有衝突：README 一處寫 "Files are the source of truth"，另一處寫「用 GitHub 議題當唯一真相來源」。同步之後檔名改成議題編號，檔內 `github` 欄指向議題；`validate.sh` 檢查前置資料一致、孤兒檔、缺失的 GitHub 連結 |
| 外部服務 | 同步與關閉功能需 `gh`（GitHub 命令列）與 GitHub 程式庫。README 的「本機對遠端」表：PRD、規劃、拆解、執行、進度可全在本機；最終交付物在 GitHub |
| 成熟度 | 星數 8443；最後推送 2026-11-04；MIT。README 的「已證實成效」數據（如減少 89% 切換時間）為自述，未查證其來源 |
| 已知限制 | 流程假設最終要開 GitHub 議題；`conventions.md` 寫明不得向範本程式庫自身寫入；任務檔數量預設不超過 10 個（每個 epic）；階段詞彙是軟體開發用語（PRD、epic、issue），沒有「設計、原型、等使用者看」 |
| 條件一 | 符合（檔案優先） |
| 條件二 | 符合（GitHub 同步為選用，Linear 未使用） |
| 條件三 | 符合（說話自動啟用） |
| 條件四 | 符合；但以 GitHub 協作為預設情境 |

### 3.5 spec-kit（github/spec-kit）

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/github/spec-kit`；`templates/commands/tasks.md`、`implement.md`；每個功能一個 `specs/<功能>/` 資料夾 |
| 解決問題 | 單一功能的 規格、計畫、任務；a 不處理（無跨功能彙整） |
| 狀態存放 | `tasks.md`：依使用者故事分階段的勾選清單。`implement` 原文："make sure to mark the task off as [X] in the tasks file" |
| 新階段如何接續 | 指令稿 `check-prerequisites` 依目前 git 分支判斷是哪個功能資料夾，讀回 `FEATURE_DIR`、`TASKS` 等路徑（回傳 JSON） |
| 觸發 | 使用者依序輸入 `/speckit-constitution`、`-specify`、`-plan`、`-tasks`、`-implement`、`-converge`（README 寫「一次一個」） |
| 外部服務 | 無必要 |
| 成熟度 | 星數 149322；最後推送 2026-11-11；最新發行 v1.4.0（2026-11-10）；MIT |
| 已知限制 | 功能以分支名識別；多個進行中的功能無總表；擴充鉤子可執行任意指令（`.specify/extensions.yml`） |
| 條件一 | 符合 |
| 條件二 | 符合 |
| 條件三 | 不符（逐指令） |
| 條件四 | 符合 |

### 3.6 BMAD-METHOD 第 7 版預覽（bmad-code-org/BMAD-METHOD）

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/bmad-code-org/BMAD-METHOD` 主分支；`skills/bmad-agent-po/`（代號 Sofia 的產品負責人代理）、`skills/bmad-build/`、`skills/bmad/` |
| 解決問題 | a 與 b：PO 代理「拆需求成 epic 與故事、管看板、驗證票樹、變更時重排」；`bmad` 中樞回答「接下來該做什麼」 |
| 狀態存放 | 預設「repo 儲存」：票是 `output_folder` 下的 Markdown 檔，加每個 epic 的 `tickets.toml`；一份「計畫檔」前置資料有 `status`（draft、ready-for-dev、in-progress、in-review、built、done、blocked、dropped）、`baseline_revision`、`risk` 等。進行中的主題為「initiative」，由使用者層設定檔 `_bmad/custom/config.user.toml` 的 `active_initiative` 指名。可改接 GitHub、Jira、Linear、Notion、Trello |
| 新階段如何接續 | 指令稿 `tickets.py next`（依下一步分組列出未完成票）與 `status`（全部票）。`build` 流程原文："Persist progress via plan frontmatter and in-memory variables" |
| 觸發 | 使用者叫出代理或對 `bmad` 技能提問；PO 說明檔要求提交由使用者的「同意」觸發，且「開始做」是另一次同意 |
| 避免重複記錄 | 票的規則與狀態只在票檔（repo 儲存）；PO 的 `references/board.md` 寫明不得手動由 `status` 字推導狀態，必須取 `tickets.py` 的輸出 |
| 外部服務 | 需要 Python 3.10 以上與 `uv`（執行指令稿）；Node.js 用於舊版安裝器；追蹤工具可選 |
| 成熟度 | 第 6.12 版為穩定版（2026-10-14 發行）；第 7 版為預覽 alpha，README 寫："Expect breaking changes between updates." 預計 2026 年 11 月中釋出；星數 55263；最後推送 2026-11-11；授權 GitHub 介面回報 NOASSERTION（README 寫 MIT） |
| 已知限制 | alpha；體系大（技能數十項）；`config.user.toml` 是否被 git 忽略未查證；預設代理做完一張票要使用者同意 |
| 條件一 | 符合（repo 儲存預設） |
| 條件二 | 符合（Linear 為可選） |
| 條件三 | 部分（多數轉換需使用者「同意」） |
| 條件四 | 符合 |

### 3.7 清單外的候選（搜尋所得，已讀 README 或核心檔者）

#### 3.7.1 REMvisual/claude-handoff

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/REMvisual/claude-handoff`；兩個 skill（`/handoff`、`/handoffplan`），另有「`/compact-handoff` 介面外掛」 |
| 問題 | b |
| 狀態存放 | 預設 `plans/handoffs/HANDOFF_<主題>_<日期>.md`（在 repo）。八段：目標、現況、已試過什麼、關鍵決策（含被否決者）、證據、使用者回饋、接下來、快速開始。多份交接以鏈標籤與序號相連 |
| 接續 | skill 結束時給一段可貼進新工作階段的提示，內容是讀哪個檔、從「接下來」段開始（使用者貼上） |
| 觸發 | 使用者下指令（README 的用法） |
| 避免重複 | 以鏈序號接續；「已試過什麼」段保留失敗做法；與 beads 任務並用時讀取進行中的任務 |
| 外部服務 | 無必要（beads 選用） |
| 成熟度 | 星數 73；最後推送 2026-11-11；MIT |
| 限制 | 使用者要貼提示；細節寫了很多，檔案大 |
| 條件 | 一：符合。二：符合。三：不符。四：符合 |

#### 3.7.2 softaworks/agent-toolkit 的 `session-handoff`

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/softaworks/agent-toolkit`，`skills/session-handoff/SKILL.md`（已讀全文），含建立、驗證、列出、檢查陳舊度四支 Python 指令稿 |
| 問題 | b |
| 狀態存放 | `.claude/handoffs/YYYY-MM-DD-HHMMSS-<主題>.md`（在 repo）；可用 `--continues-from` 串成鏈 |
| 接續 | 先列出交接檔、檢查陳舊度（新鮮、略舊、舊、很舊，依時間、提交數、變動檔、分支偏離），再讀檔、核對環境，引句：Start with "Immediate Next Steps" item #1 |
| 觸發 | 說明寫「模型自動」：使用者要求、情境視窗快滿、完成重大里程碑時啟用；另有「做了 5 次以上檔案編輯後主動建議」 |
| 避免重複 | 鏈接並可標舊檔「已取代」 |
| 外部服務 | 無（需 Python） |
| 成熟度 | 星數 2665；最後推送 2026-03-05（較舊）；MIT |
| 限制 | 驗證器規則：引句 "Do not finalize a handoff with secrets detected or score below 70."；這是單一工作的交接，無跨需求視角 |
| 條件 | 一：符合。二：符合。三：部分（有自動啟用說明）。四：符合 |

#### 3.7.3 392fyc/claude-handoff

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/392fyc/claude-handoff`；Claude Code 外掛（`/handoff`），只用 Python 標準庫 |
| 問題 | b |
| 狀態存放 | Claude 自動記憶目錄內的交接文件，內容是「自足的起始提示」 |
| 接續 | 新工作階段的 SessionStart 鉤子讀取交接文件並注入為額外脈絡，不需複製貼上；可選擇自動開新終端機分頁 |
| 觸發 | 只在使用者輸入 `/handoff` 時；README 明寫不在 SessionEnd、PreCompact 自動觸發 |
| 成熟度 | 星數 1；最後推送 2026-04-25；MIT |
| 條件 | 一：部分（自動記憶目錄在家目錄下的專案資料夾，非 repo）。二：符合。三：不符。四：符合 |

#### 3.7.4 parcadei/continuous-claude-v3

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/parcadei/continuous-claude-v3`；109 個 skill、32 個代理、30 個鉤子 |
| 問題 | b 與跨階段學習 |
| 狀態存放 | 交接為 YAML（`thoughts/shared/handoffs/*.yaml`），另有「連續性帳本」與記憶系統：預設以 Docker 跑 PostgreSQL（含向量索引） |
| 接續 | 鉤子在啟動時載入帳本與交接；口號："Compound, don't compact." |
| 觸發 | 鉤子與 skill 自動；「收工」說法會觸發 `create_handoff`（標為必要技能） |
| 外部服務 | Docker、PostgreSQL；Perplexity 等為選用 |
| 成熟度 | 星數 3950；最後推送 2026-01-26（約十個月前）；MIT |
| 條件 | 一：不符（YAML 與資料庫）。二：符合。三：符合。四：符合，但太重 |

#### 3.7.5 dannysmith/taskdn

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/dannysmith/taskdn`；規格 `tdn-specs/S1-core.md`，命令列工具 `tdn`，Claude Code 外掛 `tdn-claude-plugin`，另有 Obsidian 外掛與桌面應用（alpha） |
| 問題 | a（個人任務、專案、領域三層，皆為檔案） |
| 狀態存放 | 任務、專案、領域各一個 Markdown 檔（YAML 前置資料）。任務狀態：inbox、icebox、ready、in-progress、blocked、dropped、done；專案狀態：planning、ready、blocked、in-progress、paused、done；專案可用 `blocked-by` 指向其他專案；目錄在 `~/.taskdn.json` 設定，可在 Obsidian 保管庫內 |
| 接續 | 外掛教 Claude 以 `tdn` 查詢；提供 `/tdn:today` 指令 |
| 觸發 | 使用者說話，模型依外掛的 skill 引用；斜線指令使用者下 |
| 外部服務 | 無（需安裝 `tdn`） |
| 成熟度 | 星數 22；最後推送 2026-10-22；授權 GitHub 介面回報 NOASSERTION；README 標命令列、外掛、規格為穩定，桌面為 alpha |
| 限制 | 設計給個人任務，不含工作階段交接；沒有「需求在原型階段」的欄位但可自訂狀態值（規格要求實作不得拒絕未知狀態值） |
| 條件 | 一：符合（可放在 repo 或保管庫）。二：符合。三：部分。四：符合（明確為個人使用設計） |

#### 3.7.6 wbopan/cotask

| 欄位 | 內容 |
|------|------|
| 位置 | `github.com/wbopan/cotask`；Claude Code 外掛，加本機網頁儀表板 |
| 問題 | a：多個平行工作階段的任務管理 |
| 狀態存放 | 專案根目錄單一 `TASKS.md`，符號 `[ ]` 待辦、`[/]` 進行中、`[x]` 完成、`[-]` 備援清單；每筆有驗收條件（AC）與完成備忘（CM）；任務可綁定進行中的工作階段，儀表板顯示執行中、閒置、等待授權 |
| 接續 | 指令 `/starting-task #標籤` 認領並開工；`/creating-task` 建任務 |
| 觸發 | 使用者下指令 |
| 外部服務 | 僅 macOS（使用鑰匙圈與 AppleScript）、Node.js；Ghostty 選用 |
| 成熟度 | 星數 32；最後推送 2026-03-25；MIT |
| 限制 | 單檔、單專案；設計理念寫明「人在迴圈內」 |
| 條件 | 一：符合。二：符合。三：不符。四：符合 |

#### 3.7.7 僅見搜尋摘要、未讀原文者

`rb17080/session-handoff`（在 repo 根目錄寫 `HANDOFF.md`）、`ostikwhy-blip/claude-code-handoff-skill`、`csabakecskemeti/skill-vault` 內的 `projectz`、`runtm-ai/claudecode-for-pms`、`motlin/markdown-tasks`、`chachamaru127 plans-management`。以上只有搜尋結果的描述，沒有讀 README 或 skill 檔，一律列入「未查證」，不評分。

---

## 四、內建功能

來源：`code.claude.com/docs`（2026-11-12 下載為 Markdown 後閱讀）。

| 功能 | 官方說明的用途 | 限制（文件所載） |
|------|---------------|-----------------|
| 工作階段接續（resume、continue） | 工作階段是綁定專案目錄的已儲存對話，「Claude Code stores it locally as you work」。`claude --continue` 重開最近一個；`claude --resume` 開選單；`claude --resume <名稱>` 直接接續。還原對話、模型、權限模式、有效目標（`/goal`）、未過期的工作階段排程 | 以 `claude -p` 或 Agent SDK 建立的對話不出現在選單與 `--continue`；背景工作與以 `--add-dir` 加入的目錄、外掛目錄等旗標不還原；長對話久未用，接續時可能跳出消耗額度提醒 |
| 壓縮（compact） | 接近上限時自動摘要；`/compact` 可加焦點說明；CLAUDE.md 可設「Compact Instructions」段 | 官方原文："detailed instructions from early in the conversation may be lost"。壓縮後專案根目錄 CLAUDE.md、自動記憶、規劃模式的計畫「Re-injected from disk」；子目錄的 CLAUDE.md 與有 `paths:` 的規則改為按需重載；只重讀最近的五個檔；啟動鉤子（SessionStart）符合 `compact` 來源者會再執行 |
| 記憶檔（CLAUDE.md、AGENTS.md、自動記憶） | CLAUDE.md 是使用者寫的持續指示；自動記憶是 Claude 自己寫的筆記，分 user、feedback、project、reference 四型。`CLAUDE.local.md` 放個人且不入版控的偏好 | 官方建議每個 CLAUDE.md 目標 200 行內（"target under 200 lines per CLAUDE.md file"）；自動記憶每次載入前 200 行或 25KB；Claude 只存「無法從程式碼或 git 歷史推得」的資訊；有 CLAUDE.md 時預設不讀 AGENTS.md（可改設定） |
| 背景任務 | 背景 bash 指令與背景子代理在壓縮後仍執行，Claude Code 會提醒哪些仍在跑；`/tasks` 列出 | 工作階段結束後，背景工作在接續時只顯示「未完成」的註記，不重啟 |
| 排程任務 | 三種：雲端排程任務（不需本機開機、最短間隔 1 小時）、桌面排程任務、`/loop`（工作階段內、最短 1 分鐘） | "Tasks are session-scoped."（`/loop`）；雲端排程任務「research preview」（研究預覽）；雲端任務看不到本機檔案（全新複製） |
| 子代理與多工作階段 | 子代理：同一工作階段內的委派者，在獨立情境回傳摘要。Agent view（`claude agents`）：一個畫面看所有背景工作階段與需要輸入者。Agent teams：領導與隊員共用任務清單。Projects（專案）：一個協調對話，自動開「執行緒」並追蹤。動態工作流程：腳本編排大量子代理。跨工作階段訊息：Claude 可列出並傳訊給你的其他工作階段 | Agent view 為 research preview；Agent teams "experimental and disabled by default"；Projects 為公開測試版（Pro、Max、Ultra），不在終端機命令列版，狀態在雲端，不能把本機自行開的工作階段加進去，不能分享給他人；子代理預設可再開子代理，深度上限三層 |
| 任務清單工具（TaskCreate、TaskGet、TaskList、TaskUpdate） | Claude 的待辦清單，狀態為 pending、in progress、completed，可有依賴。"Tasks persist across context compactions" | 只在支援的模型預設提供；一般只存在該工作階段內；設環境變數 `CLAUDE_CODE_TASK_LIST_ID` 可指名 `~/.claude/tasks/` 下的資料夾以跨工作階段共用（該位置在家目錄，非 repo）。團隊任務清單存 `~/.claude/tasks/{團隊名}/` |
| 工作樹（worktree） | 每個工作階段在獨立的 git 工作樹，互不覆蓋；用 `--worktree` 旗標、`.worktreeinclude` 複製未追蹤檔 | 引句："A worktree is a fresh checkout"；需重新初始化環境；Agent teams 不為隊員隔離工作樹 |
| 工作階段摘要（`/recap`） | 離開一陣子再回來，顯示一行摘要；`/recap` 隨時產生 | 上限 400 字元；使用者自己下指令才執行 |
| 鉤子（hooks） | 在編輯、結束、需要輸入時自動執行指令；SessionStart 鉤子可在啟動、清除、壓縮後重新注入脈絡 | 本次只讀鉤子與壓縮相關句，未讀完鉤子指南全文 |

---

## 五、三類歸納

### 5.1 可直接採用

| 項目 | 理由（依據上文） |
|------|-----------------|
| matt `wayfinder` 的本機慣例（地圖檔、票檔、Status、Blocked by、前緣查詢） | 已在 Sens 工作樹使用；Markdown 在 repo、不用 Linear、一人可用。限制：以單一主題為單位；啟動靠使用者輸入指令 |
| Claude Code 內建壓縮後重新注入（CLAUDE.md、自動記憶、SessionStart 鉤子） | 官方載明，零安裝；只涵蓋「每次都要知道的」常駐內容，不含逐需求狀態 |
| Claude Code 內建接續（`--continue`、`--resume`） | 官方功能；僅還原同一目錄的對話，對話本身仍會壓縮 |
| Backlog.md | 條件一、二、四全符合；任務檔自足、封存、依賴、看板；由代理經 MCP 或指示檔操作，接近條件三。缺口：欄位為工程任務導向，狀態值需在設定中自訂才貼近設計、原型階段（設定方式本次未讀完整） |
| CCPM | 條件一至四符合；有現成的「站會、卡住、下一個」指令稿，由模型依意圖自動啟用，狀態在 `.claude/` 的 Markdown。缺口：假設終點是 GitHub 議題、有兩處「真相來源」說法衝突、階段詞彙為軟體開發 |

「可直接採用」只表示機制與條件符合度高，不代表無需調整；每項缺口已列出。

### 5.2 可借用部分機制

| 項目 | 可借用的機制 | 不照單全收的原因 |
|------|-------------|-----------------|
| matt `handoff` 與 `claude-handoff` | 「已存在別處的內容只指向、不複製」；含「建議使用的 skill」段；避免機密 | 檔案在暫存目錄，重開機會消失；由使用者下指令 |
| matt `chief-of-staff` | 單一長工作階段只協調、工作派子代理；記憶以 `index.md` 加一頁一件事的 wiki；決策前先查索引；以「上下文指標」與子代理溝通；每條主張標日期 | 「寫歷史、不改寫舊主張」與 Miles 的收斂規範方向相反；in-progress，可能無預警變更 |
| matt `loop-me` 的「推遲檢查點」與「決策用摘要（brief）」 | 與「他只問現在該做什麼」對應：代理做到最後才請使用者看，並附決策用摘要 | 是訪談出規格的 skill，不是運行追蹤 |
| matt `software-factory` 的五個提問 | 設計任務時問：誰觸發、讀寫哪些服務、接著觸發什麼、人在哪裡重新進入、什麼阻止重複做 | 只是設計用語 |
| REMvisual `claude-handoff` 的「已試過什麼」「關鍵決策含被否決者」段與鏈序號 | 失敗做法最貴；交接檔放 repo | 使用者要貼提示；檔案偏長 |
| softaworks `session-handoff` 的陳舊度檢查 | 接續前比對時間、提交數、變動檔、分支偏離，標新鮮到很舊 | 單一工作交接，無跨需求視角；最後提交 2026-03 |
| CCPM 的「查詢類操作一律跑指令稿、不讓模型重組」 | 讓「每個需求在哪」的回答穩定、不耗字數 | 指令稿是 bash，綁定它的檔案結構 |
| BMAD 第 7 版 PO 代理的「initiative（進行中主題）」「票樹」「`next` 分組」「依據狀態欄而非自行推導」 | 與跨需求追蹤最貼近的設計 | alpha、依賴 Python 與 `uv`、大多轉換要使用者同意 |
| Anthropic `roadmap-update` 的五態與現在、下一步、之後格式 | 狀態詞彙可借 | 無持久檔案 |
| Anthropic `task-management` 的「等待中」區與「自某日起」標記 | 「卡誰、卡多久」的欄位寫法 | 單檔、新增須確認 |
| taskdn 的任務、專案、領域三層檔案與狀態列舉（inbox、ready、blocked 等）、`blocked-by` | Obsidian 友善；個人使用 | 無交接機制；授權標示不明 |
| cotask 的 `[ ]` `[/]` `[x]` 符號與「驗收條件加完成備忘」 | 單檔簡潔 | 僅 macOS 與儀表板；單專案 |
| ralph-loop 的停止鉤子加狀態檔 | 讓代理持續到完成條件 | 同一提示重送，不適用多需求 |
| gstack `context-save` 的檔頭欄位（status、branch、files_modified）與四段內文、只追加 | 欄位設計可參考 | 存家目錄、使用者下指令 |
| Claude Code 的 `/goal`、`/recap`、Agent view、跨工作階段訊息 | 官方內建，可疊加 | 多為預覽或實驗；各項限制見第四節 |

### 5.3 不適用

| 項目 | 理由 |
|------|------|
| beads | 狀態在 Dolt 資料庫，違反「記在 Markdown」（JSONL 僅為匯出） |
| continuous-claude-v3 | 需 Docker 與 PostgreSQL；YAML；體系龐大；最後提交約十個月前 |
| Task Master | JSON 為主；需另備模型金鑰；授權有商用限制；最後提交較舊 |
| spec-kit | 以功能分支識別，無跨功能總覽；逐指令由使用者驅動；解決的是「規格到程式」 |
| superpowers 的計畫與執行 | 計畫檔是 Markdown，但進度只在工作階段內任務清單；對象是程式實作 |
| Claude Code Projects | 貼近目標，但公開測試版、狀態在雲端、不在 repo、終端機版不支援、僅雲端或遠端控制的執行緒（官方文件載明） |
| 官方外掛庫的追蹤工具連接器（linear、asana、github、gitlab 等） | 屬 Linear 類，違反條件二；且為連接外部服務 |
| anthropics/skills | 無追蹤類 skill |
| pm-skills 47 項 | 框架型提問，無跨工作階段狀態檔（已讀三項，其餘以字樣檢查） |
| matt `handoff`、`claude-handoff` 當作「從 repo 檔案接續」的正本 | 寫到暫存目錄，官方說明承認會消失 |
| 392fyc/claude-handoff | 星數 1、檔案在家目錄的自動記憶位置；需使用者下指令 |
| gstack 的狀態檔作為正本 | 存 `~/.gstack`，不在 repo |

---

## 六、未查證

共 16 項。

| 編號 | 項目 | 缺什麼 |
|------|------|--------|
| 1 | Task Master 的 `tasks.json` 完整目錄路徑與全部狀態值 | 只取得文件頁經抓取工具的摘要，未逐字核對，且該頁未載路徑；README 未提 |
| 2 | BMAD 第 7 版：`config.user.toml` 是否被 git 忽略、`tickets.py` 內部邏輯、`bmad-build` 的其餘步驟檔 | 只讀 PO 的 `workflow.md`、`board.md`、`repo-ticketing.toml`、`initiative.md` 與 `bmad-build` 的 `workflow.md`、`plan-template.md` |
| 3 | BMAD 官方文件站上跨工作階段說明頁 | 文件站抓取結果說該頁未涵蓋此題；其他頁未讀 |
| 4 | Backlog.md 的任務執行與完成指南全文（`task-execution`、`task-finalization`）與 `CLI-INSTRUCTIONS.md` | 只讀 README 與 MCP 概覽 |
| 5 | beads 的 Claude Code 鉤子實際內容與官方文件站（beads.gascity.com） | 只讀 README；`bd setup claude` 寫入什麼未讀 |
| 6 | `rb17080/session-handoff`、`ostikwhy-blip/claude-code-handoff-skill`、`projectz`、`runtm-ai/claudecode-for-pms`、`motlin/markdown-tasks`、`chachamaru127 plans-management` | 只有搜尋結果描述；README 或 skill 原文未讀（rb17080 的 `SKILL.md` 路徑回傳 404） |
| 7 | gstack 前導段（遙測、gbrain 同步、持續檢查點的開關）與其餘 skill（如 `retro`、`ship`、`autoplan`） | 只讀 `context-save`、`context-restore`、`learn` 的主體 |
| 8 | superpowers 其餘 skill（`brainstorming`、`finishing-a-development-branch` 等）與完整 `using-git-worktrees` | 只讀六個相關 skill 的前段或全文 |
| 9 | pm-skills 47 項中除 `roadmap-planning`、`epic-breakdown-advisor`、`workshop-facilitation` 外的內容 | 只以字樣檢查 |
| 10 | anthropics/claude-code 程式庫本身與官方外掛庫的 `external_plugins` | 以文件站與本機快照取代；外部連接器未讀 |
| 11 | Claude Code 桌面應用的工作階段管理頁（Miles 實際使用的介面）與鉤子指南全文、`/goal` 全文 | 只讀開頭或相關句 |
| 12 | Sens 專案內自有 skill（`oq-manage`、`erp-plan` 等） | 不在本次範圍 |
| 13 | `erp-test-map` 外掛的完整程式與介面外掛 API 文件 | 只讀前 50 行與設定檔 |
| 14 | `chief-of-staff` 的實際使用成效 | 只有 skill 原文與 CHANGELOG，無外部使用回報 |
| 15 | CCPM README「已證實成效」數據的來源 | 自述，未找到依據 |
| 16 | GitHub 介面回報的星數是否準確（如 superpowers 316126、mattpocock/skills 321723） | 取自介面欄位，未交叉驗證 |

---

## 附：讀到的含 AI 指示的內容（視為資料，未照做）

| 來源 | 指示摘要 |
|------|---------|
| superpowers `using-superpowers`（`EXTREMELY-IMPORTANT` 段） | 要求「有 1% 可能適用就必須呼叫 skill」，且「沒有選擇」 |
| superpowers `subagent-driven-development` 紅旗清單 | 要求不暫停詢問、不在主分支開工、不平行派多個實作子代理等 |
| gstack 各 skill 前導段與 `HARD GATE` | 要求先跑前導腳本、不得實作程式碼、依設定自動提交 |
| beads README 的 `AGENTS.md` 範本 | 要求「不要用 Markdown 待辦清單追蹤任務」 |
| Backlog.md MCP 概覽 | 要求只透過 MCP 工具操作，不直接改 Markdown |
| CCPM `SKILL.md` | 要求追蹤類操作一律直接跑指令稿 |
| spec-kit `tasks.md`、`implement.md` | 要求依擴充鉤子檔執行指令、完成任務後標記 `[X]` |
| continuous-claude-v3 README | 把 `create_handoff` 標為「必須使用」的關鍵 skill |
| matt `chief-of-staff` | 要求「竭力改善環境」、所有工作派子代理 |
| 網頁搜尋工具結果尾端 | 一段要求回覆中必須附上來源連結的提醒（工具自身提示，不影響內容） |
