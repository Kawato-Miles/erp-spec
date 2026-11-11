# 04：matt 流程全貌（mattpocock-skills 1.3.2）

主對話抽查（2026-11-11）：對照外掛原文，使用者啟動型 skill 的數量（engineering 11、productivity 5）、`implement-spec` 的任務圖與子代理流程、`handoff` 寫到系統暫存目錄、`retro` 的檢查類別、CHANGELOG 對「呼叫 Skill 工具只適用模型可啟動的 skill」的說明，五處相符。其餘未抽查。


調研對象：`/Users/b-f-03-029/.claude/plugins/cache/mattpocock/mattpocock-skills/1.3.2/`（下稱「matt 外掛」）。
本專案設定：`docs/agents/` 三檔、`AGENTS.md`、`GLOSSARY-MAP.md`。
引句皆為英文原文，每句不超過 15 個字詞；檔名相對於 matt 外掛根目錄，`skills/engineering/` 簡寫為 `eng/`，`skills/productivity/` 簡寫為 `prod/`，`skills/in-progress/` 簡寫為 `wip/`。
原文沒寫的行為，一律標「原文未說明」；依內文做的判讀，標「判讀」。

## 一、摘要

1. matt 的主流程是：想法 → `grill-with-docs` → （需要可執行答案時）`prototype` → `to-spec` → `to-tickets` → `implement` 或 `implement-spec` → `retro`；建置內部自動呼叫 `tdd` 與 `code-review`。
2. 大題目（一個工作階段裝不下、路還看不清）走 `wayfinder`：先畫地圖，每個工作階段只解一張決策票；地圖清空後交回主流程的 `to-spec`，不直接建置。
3. matt 沒有「自動串接」：11 個 engineering skill 與 5 個 productivity skill 只能由使用者輸入名稱啟動，且「使用者啟動型 skill」不能呼叫另一個使用者啟動型 skill。主流程每一步都是使用者（或 `chief-of-staff` 這類 in-progress 協調者）親手接。
4. 「接續」靠檔案與追蹤器狀態：地圖、票的 `Status:` 行、spec、`GLOSSARY.md`、ADR、`handoff` 檔。沒有一個 skill 負責「讀全部狀態後決定下一步」，原文未說明。
5. 階段邊界（phase boundary）有五個選項：繼續、`/clear`、`handoff`、子代理、`/compact`；決策樹由上而下，預設落點是 `/compact`。
6. 驗證靠三件事：`tdd`（先紅後綠，只在事先商定的測試接縫上寫測試）、`code-review`（標準軸與規格軸，兩個平行子代理，不合併排序）、`retro`（只對環境提改善，不改程式）。
7. matt 沒有對「規格本身」的稽核步驟。規格的品質只靠三個人工關卡：`grilling` 結束要使用者確認、`to-spec` 要使用者確認測試接縫、`to-tickets` 要使用者核准拆法。
8. matt 的詞彙表（`GLOSSARY.md`）只放用語定義，不放規則、欄位、狀態；「其餘決定只留在對話」，由 `to-spec` 接走。本專案把規則、欄位、狀態放 wiki 卡，這是結構性差異。
9. matt 的議題追蹤器支援本機 Markdown（`.scratch/`）、GitHub、GitLab；本專案已選本機 Markdown，且設定檔與 matt 種子範本逐字相同（以 `diff` 驗證）。Linear 不在 matt 流程內。
10. 在 `in-progress/`（未隨外掛發布）的有：`chief-of-staff`、`claude-handoff`、`software-factory`、`loop-me`、`setup-ts-deep-modules`、三個 `writing-*`。`implement-spec`、`retro`、`handoff`、`wayfinder` 已在外掛內。
11. matt 沒有、本專案必須自補的步驟（詳見第八節）：對規格與 wiki 的稽核、業務規則的長期正本與落卡、不確定項管理、對 Linear 的交付、Prototype 的長期維護、中斷後「讀全部狀態決定下一步」的接續器、本機模式下實作票的完成狀態。

## 二、skill 總表

欄位說明：
- 「僅使用者啟動」指 frontmatter 有 `disable-model-invocation: true`；「否」表示模型與使用者皆可啟動。
- 「人在場／獨立」：標「原」為原文明示；標「讀」為依內文判讀，原文未標示。HITL 即人在場，AFK 即代理獨立完成。
- 「呼叫」只列 SKILL.md 內明寫的「Call the Skill tool」或相對路徑讀取。

### 2.1 engineering（外掛內，使用者啟動型）

| 名稱 | 目的 | 輸入 | 產出與落點 | 僅使用者啟動 | 呼叫 | 人在場／獨立 |
|------|------|------|-----------|------------|------|-------------|
| `ask-matt` | 路由：問哪個 skill 或流程適用 | 使用者描述的處境 | 只給建議，不寫檔 | 是 | 無（路由文字，不呼叫） | 人在場（讀） |
| `setup-matt-pocock-skills` | 每個 repo 設定一次：議題追蹤器、分類標籤、領域文件佈局 | repo 現況（`git remote`、`AGENTS.md`、`GLOSSARY.md`、`docs/adr/`、`.scratch/`） | `docs/agents/issue-tracker.md`、`domain.md`、`triage-labels.md`（僅當 `triage` 已裝）；在 `CLAUDE.md` 或 `AGENTS.md` 寫 `## Agent skills` 區塊 | 是 | 無 | 人在場（原：逐段詢問、先給草稿讓使用者改，才寫入） |
| `grill-with-docs` | 訪談釐清計畫，並即時寫詞彙表與 ADR | 想法或計畫 | `GLOSSARY.md`（逐項即時更新）、`docs/adr/`；其餘決定只留對話 | 是 | `grilling`、`domain-modeling`（各呼叫一次） | 人在場（原） |
| `triage` | 把外來議題與外部 PR 走過狀態機 | 追蹤器上的議題 | 狀態標籤、agent brief 留言、`needs-info` 筆記、`.out-of-scope/` | 是 | `grilling`、`domain-modeling`（步驟 4） | 人在場（維護者）；產出供 AFK 代理取用 |
| `improve-codebase-architecture` | 掃描程式碼庫，找出加深模組的機會 | 程式碼庫、git 歷史、`GLOSSARY.md`、ADR | 暫存目錄的 HTML 報告；使用者選定後進入訪談 | 是 | `codebase-design`、`grilling`、`domain-modeling` | 人在場（原：先問「想探索哪個」） |
| `to-spec` | 把當前對話合成 spec 並發布 | 對話與程式碼庫理解 | 發布到追蹤器；本機為 `.scratch/<feature>/spec.md`；貼 `ready-for-agent` | 是 | 無 | 與使用者確認測試接縫（原），其餘獨立（讀） |
| `to-tickets` | 拆成垂直切片票並標阻擋關係 | 計畫、spec 或對話；或 spec 路徑、議題編號 | 本機：`.scratch/<feature>/issues/<NN>-<slug>.md`；真追蹤器：一票一議題加原生阻擋連結 | 是 | 無 | 人在場（原：逐項詢問，迭代到使用者核准） |
| `implement` | 實作一張票或一份 spec | 票參照或 spec | 程式碼，提交到當前分支 | 是 | `tdd`、`code-review` | 測試接縫須使用者確認（原，來自 `tdd`）；其餘獨立（讀） |
| `implement-spec` | 在單一整合分支上實作整份 spec | spec 與其票 | 整合分支；票依追蹤器方式關閉；追蹤器以 PR 結案或使用者要求時才開草稿 PR | 是 | `tdd`（由實作子代理呼叫）、`code-review` | 代理獨立（讀：背景子代理；docs 稱無互動確認接縫的步驟） |
| `wayfinder` | 大題目：畫地圖、逐票解決 | 模糊的大想法 | 地圖（`wayfinder:map`）、決策票、解答、Decisions so far | 是 | `grilling`、`domain-modeling`、`research`、`prototype`（依票型） | 混合（原：grilling 與 prototype 人在場、research 獨立、task 兩者皆可） |
| `retro` | 回顧工作階段，對代理環境提改善 | 工作階段紀錄（預設當前） | 只列候選清單（依嚴重度）；使用者挑了才改 | 是 | `writing-for-agents` | 人在場（原：只提議） |

### 2.2 engineering（外掛內，模型可啟動型）

| 名稱 | 目的 | 輸入 | 產出與落點 | 僅使用者啟動 | 呼叫 | 人在場／獨立 |
|------|------|------|-----------|------------|------|-------------|
| `prototype` | 拋棄式原型回答一個設計問題 | 設計問題 | 邏輯題：單一 HTML 檔；介面題：同一路由多個變體；採納後原型留在 `prototype/<name>` 分支，答案併回真程式 | 否 | 無 | 人在場（原：使用者試玩並反應） |
| `diagnosing-bugs` | 難 bug 的診斷迴圈 | 症狀 | 回歸測試、清除除錯記號；正確假設寫入提交訊息 | 否 | 無 | 大致獨立（讀：假設清單先給使用者看，但「Don't block」） |
| `research` | 背景代理查一手來源，寫帶引用的 Markdown | 問題 | 依 repo 既有慣例存放的單一 Markdown | 否 | 無（啟動背景代理） | 代理獨立（原：wayfinder 標 AFK） |
| `tdd` | 先紅後綠的迴圈與好測試準則 | 已商定的測試接縫 | 測試與最小實作 | 否 | `codebase-design`（接縫形狀有疑時） | 接縫須使用者確認（原） |
| `domain-modeling` | 主動建立詞彙表與 ADR | 對話 | `GLOSSARY.md`、`docs/adr/` | 否 | 無 | 人在場（讀） |
| `codebase-design` | 深模組詞彙與原則 | 無 | 詞彙參考，無產出 | 否 | 無 | 不適用 |
| `code-review` | 對固定點起的差異做雙軸審查 | 固定點（commit、分支、tag）、spec 來源 | 回報在對話中（`## Standards`、`## Spec` 兩段），不寫檔 | 否 | 兩個平行子代理（不呼叫 skill） | 代理獨立（讀：`PHASE-BOUNDARIES.md` 以自動審查為子代理標準案例） |
| `pr` | PR 本文的形狀 | 變更 | PR 本文：Summary、Evidence、Merge Danger | 否 | 無 | 獨立（讀） |
| `wizard` | 產生互動式 bash 精靈，帶人走只有人能做的步驟 | 程序 | 一個 bash 檔 | 否 | 無 | 人在場（原） |

### 2.3 productivity

| 名稱 | 目的 | 輸入 | 產出與落點 | 僅使用者啟動 | 呼叫 | 人在場／獨立 |
|------|------|------|-----------|------------|------|-------------|
| `grill-me` | 無 repo 時的訪談（不留檔） | 計畫或設計 | 無檔案 | 是 | `grilling` | 人在場（原） |
| `grilling` | 訪談原語：決策樹、輪次、每題附建議答案 | 計畫、決定、想法 | 對話；事實交子代理查 | 否 | 無（事實查找派子代理） | 人在場（原） |
| `handoff` | 把對話壓成交接文件 | 對話；選填「下一階段要做什麼」 | OS 暫存目錄下一個 Markdown 檔 | 是 | 無 | 人在場（讀） |
| `teach` | 跨多個工作階段教學 | 想學的主題 | 目前目錄成為教學工作區（`MISSION.md`、`lessons/` 等） | 是 | 無 | 人在場（讀） |
| `to-questionnaire` | 把自己答不了的決定寫成問卷給別人 | 使用者對「寄給誰、要回什麼」的答覆 | 目前目錄 `to-questionnaire-<slug>.md` | 是 | 無 | 人在場（原） |
| `wait-what` | 訊息沒傳達時，用簡明英文與詞彙表重講 | 上一則訊息 | 對話 | 是 | 無（讀 `GLOSSARY.md`） | 人在場（原） |
| `writing-for-agents` | 撰寫給代理讀的文件（skill、AGENTS.md） | 文件 | 規範參考 | 否 | 無 | 不適用 |

### 2.4 in-progress（`plugin.json` 的 `skills` 陣列不含；使用者啟動型）

| 名稱 | 目的 | 輸入 | 產出與落點 | 呼叫 | 人在場／獨立 |
|------|------|------|-----------|------|-------------|
| `chief-of-staff` | 單一長工作階段內協調子代理，追求長期目標 | 長期目標 | 所有工作交子代理；記憶存於 wiki（`index.md` 加每主題一頁） | 以相對路徑讀 `../retro/SKILL.md`、`../to-spec/SKILL.md`、`../to-tickets/SKILL.md`、`../implement-spec/SKILL.md` | 使用者持續對話（原：用背景代理以便保持對話） |
| `claude-handoff` | 把對話交給新的背景代理並立即接手 | 對話 | 暫存目錄的交接檔，並以 `claude --bg --name "<名稱>"` 啟動 | 無 | 交接後代理獨立（讀） |
| `software-factory` | 設計「軟體工廠」的共用語言 | 使用者的問題 | 詞彙與設計問題清單，不執行任何東西 | 無 | 人在場（讀；與訪談並用） |
| `loop-me` | 以訪談產出工作流程規格 | 要設計的流程 | `workflows/*.md`、`NOTES.md` | 執行 `/grilling` | 人在場（原） |
| `setup-ts-deep-modules` | 在 TypeScript repo 接上 dependency-cruiser | repo | 設定與規則 | `codebase-design` | 讀：與程式碼庫相關，本專案無對應 |
| `writing-beats`、`writing-fragments`、`writing-shape` | 文章寫作三段（片段、節拍、成形） | 原始素材 | 文章檔 | 無 | 人在場（原：皆為訪談式） |

### 2.5 misc 與 deprecated

- `misc/`：`git-guardrails-claude-code`、`migrate-to-shoehorn`、`scaffold-exercises`、`setup-pre-commit`。frontmatter 沒有 `disable-model-invocation`，屬模型可啟動型；`SCOPE.md` 寫明此目錄「frozen and unmaintained」。
- `deprecated/`：空目錄（`skills/deprecated/README.md`）。`docs/engineering/resolving-merge-conflicts.md` 標「Archived」，已於 v1.3.0 自外掛移除。

### 2.6 啟動型規則（全部 skill 通用）

原文（`README.md`）：「A user-invoked skill may invoke model-invoked skills, but never another user-invoked one.」
結果：`grill-with-docs` 可呼叫 `grilling`（模型可啟動型），但 `to-spec` 不能由 `grill-with-docs` 接著呼叫。`.agents/invocation.md` 說明：使用者啟動型 skill 沒有描述欄位，只有人能觸及。

## 三、主流程

### 3.1 一般題目（一個工作階段裝得下，或可拆票逐張做）

| # | 階段 | skill | 怎麼接下一步 | 原文依據 |
|---|------|-------|-------------|---------|
| 0 | 一次性前置 | `setup-matt-pocock-skills` | 每個 repo 執行一次；其餘 engineering skill 假設已設定 | `eng/setup-matt-pocock-skills/SKILL.md`：「Run once before first use of the other engineering skills.」 |
| 1 | 釐清 | `grill-with-docs`（無工作目錄時 `grill-me`） | 使用者確認達成共識後，才可行動 | `eng/ask-matt/SKILL.md`：`/grill-with-docs` sharpens the idea by interview. `prod/grilling/SKILL.md`：「Do not act on it until the user confirms」 |
| 2 | 分支：問題需要可執行的答案嗎 | `handoff` 出、`prototype`、`handoff` 回 | 原型在自己的目錄，用 `handoff` 把結論帶回原討論串 | `eng/ask-matt/SKILL.md` 步驟 2 |
| 3a | 分支：多工作階段的建置 | `to-spec` → `to-tickets` | spec 與票發布到追蹤器；步驟 1 至 3 同一個不中斷的上下文 | `eng/ask-matt/SKILL.md`：「Keep steps 1–3 in one unbroken context window」 |
| 3b | 分支：單一工作階段可完成 | `implement`（同一視窗） | 不寫 spec | `docs/engineering/to-spec.md`：「Decided, and the work fits one context window」→ `implement`，跳過 spec |
| 4a | 建置，逐票 | `implement`，每票之間 `/clear` | 本機追蹤器：一票一檔，使用者手動依阻擋關係由先到後；真追蹤器：阻擋邊變原生連結 | `eng/ask-matt/SKILL.md` 步驟 3 |
| 4b | 建置，整份 | `implement-spec` | 讀票成任務圖，對可取用票集合（frontier）平行派實作子代理，落到一個整合分支 | `eng/implement-spec/SKILL.md`：「They are a **task graph**」 |
| 5 | 建置內部 | `tdd`、`code-review`（皆由 `implement` 自動呼叫） | 完成後提交 | `eng/implement/SKILL.md`：Once done, call the Skill tool with "code-review" |
| 6 | 開 PR | `pr`（模型可啟動型，代理寫 PR 時自取） | 無 | `eng/ask-matt/SKILL.md`：「It's model-invoked」 |
| 7 | 回顧 | `retro` | 在要回顧的工作階段、清空前執行；清空後改指向該階段的紀錄 | `eng/ask-matt/SKILL.md` 脈絡衛生段 |

### 3.2 大題目（wayfinder 路）

適用條件（`docs/engineering/wayfinder.md`）：一個工作階段裝不下，且路還看不清。判準是工作階段數，不是專案大小。

| # | 階段 | skill | 怎麼接下一步 | 原文依據 |
|---|------|-------|-------------|---------|
| 0 | 前置 | `setup-matt-pocock-skills` | 寫出「Wayfinding operations」段；沒追蹤器則預設本機 Markdown | `eng/wayfinder/SKILL.md`：「default to the local-markdown tracker」 |
| 1 | 命名終點 | `wayfinder`（內呼叫 `grilling`、`domain-modeling`） | 終點決定範圍，先定終點 | `eng/wayfinder/SKILL.md` 步驟 1 |
| 2 | 廣度優先訪談，找出霧 | `wayfinder` | 若沒有霧（一個工作階段做得完），不建地圖，停下問使用者 | 同上，步驟 2 |
| 3 | 建地圖與可明確表述的票 | `wayfinder` | 先建票、第二輪才接阻擋邊（票要先有編號）；看不清的留在 Not yet specified | 同上，步驟 3、4 |
| 4 | 對每張 research 票派子代理 | `wayfinder` → `research` | 研究結果存 `research/<name>` 分支，推送但不開 PR、不合併 | 同上，步驟 5 |
| 5 | 結束繪製工作階段 | `wayfinder` | 繪製只做一個工作階段，不順手解任何票 | 同上，步驟 6 |
| 6 | 逐票解決（每次一票） | `wayfinder`（使用者以地圖網址或編號啟動） | 取第一張 frontier 票、先認領、依標籤的票型解決、寫解答、關票、在地圖追加一行指標、新增票、讓霧畢業 | 同上，「Work through the map」；「never resolve more than one ticket per session」 |
| 7 | 地圖清空 | `to-spec #<地圖>` | 把互相連結的決策折成一份可建置的計畫 | `docs/engineering/wayfinder.md`：to-spec collapses those linked decisions into one spec |
| 8 | 拆票 | `to-tickets` | 同一般題目 | 同上 |
| 9 | 建置、回顧 | `implement` 或 `implement-spec`；`retro` | 同一般題目 | 同上 |

票型與解法（`eng/wayfinder/SKILL.md`）：

| 票型 | 模式 | 解法 |
|------|------|------|
| `research` | AFK | 子代理呼叫 `research`；唯一可以同一工作階段解多張的票型 |
| `prototype` | HITL | 呼叫 `prototype`，把原型當資產連到票 |
| `grilling` | HITL | 預設票型；呼叫 `grilling` 與 `domain-modeling`；「the agent never stands in for the human's side」（代理不得自問自答） |
| `task` | 兩者皆可 | 只做「讓決策得以進行」的手動前置（例如開通權限）；不交付終點本身 |

兩項界線：
- 規劃，不施工。原文：「produce decisions, not deliverables」。地圖清空時「it hands off, it doesn't build」（`eng/ask-matt/SKILL.md`）。
- 地圖是索引，不是倉庫。原文：「The map is an **index**, not a store.」決策只住在它的票裡，地圖只放一行摘要與連結。

### 3.3 其他入口（匯入主流程）

| 起點 | skill | 匯入主流程之處 | 依據 |
|------|-------|---------------|------|
| 別人（使用者以外）建立的議題、外部 PR | `triage` | 產出 `ready-for-agent` 議題，之後由 `implement` 取用 | `eng/ask-matt/SKILL.md`：「Triage is only for issues **you didn't create**」；`to-tickets` 產的票不必 triage |
| 難解的 bug | `diagnosing-bugs` | 修完後在同工作階段跑 `retro`；若發現「沒有可鎖住它的接縫」，交給 `improve-codebase-architecture` | `eng/ask-matt/SKILL.md` |
| 程式碼庫健康 | `improve-codebase-architecture` | 選定候選後在 `grill-with-docs` 進入主流程 | 同上 |
| 需要先查資料 | `research` | 成果帶進 `grill-with-docs` | 同上 |
| 答案在別人腦中 | `to-questionnaire` | 回覆當作 `grill-with-docs` 或 `to-spec` 的素材 | 同上 |

## 四、連續執行與交接

### 4.1 matt 的設計：不自動串接

- 主流程每一步由使用者輸入 skill 名稱。原因來自啟動型規則（2.6 節）：使用者啟動型 skill 之間不能互相呼叫。
- 實際自動發生的呼叫只有：`implement` → `tdd`、`code-review`；`wayfinder` → 依票型的 skill；`grill-with-docs` → `grilling`、`domain-modeling`；`triage` → `grilling`、`domain-modeling`；`implement-spec` 內部派子代理。
- `chief-of-staff` 繞過限制的方式是「以相對路徑讀另一個 skill 的 SKILL.md 並照做」。`.changeset/chief-of-staff-shared-wiki-procedures.md`：「reading each skill by relative path so they can stay user-invoked」。
- 因此，「只給需求，代理就依狀況持續往下」在 matt 外掛內只有兩處接近：`implement-spec`（建置段）與 `chief-of-staff`（in-progress）。其餘需要人輸入下一個 skill。

### 4.2 階段邊界：五個選項

來源：`eng/ask-matt/PHASE-BOUNDARIES.md`。階段是一個工作階段內的一塊工作（釐清、建置、測試）。邊界是兩個階段之間的空檔，決策只在邊界做；階段中途「continue, or split the rest into subagents」。

決策樹（由上而下，第一個「是」就採用）：

| 順位 | 問題 | 是 → |
|------|------|------|
| 1 | 能在本工作階段繼續嗎？（下一階段把本階段當一手來源，或剩餘 smart zone（約 15 萬 token）夠用） | 繼續 |
| 2 | 現有上下文對下一階段全無用處？ | `/clear` |
| 3 | 需要攜帶？（換工具、換目錄、給同事、從階段中分出旁支） | `handoff` |
| 4 | 任務可在人不在時做完？ | 子代理 |
| 5 | 其餘 | `/compact`（附指示說明下一階段要什麼） |

原文：「`/compact` is the **default**, not the first reach.」

### 4.3 各機制怎麼運作

| 機制 | 運作方式 | 在哪個目錄 | 原文依據 |
|------|---------|-----------|---------|
| `handoff` | 把對話寫成一個 Markdown 檔，存 OS 暫存目錄（`$TMPDIR`、`/tmp`），不放工作區；含「suggested skills」段；已寫在 spec、ADR、議題、提交、diff 的內容不重抄，以路徑或網址指向；遮蔽機密；可帶引數說明下一階段用途 | 外掛內（productivity） | `prod/handoff/SKILL.md`：「Do not duplicate content already captured in other artifacts」 |
| `claude-handoff` | 同 `handoff` 的摘要，但接著用 `claude --bg --name "..." -- "$(cat <檔>)"` 啟動背景代理，從目前工作目錄起跑；使用者以 `claude agents` 管理 | in-progress | `wip/claude-handoff/SKILL.md` |
| `chief-of-staff` | 一個長工作階段，使用者是長期目標的 DRI（直接責任人）；所有工作交子代理（背景、全新上下文）；與子代理只傳「上下文指標」；記憶存 wiki（先找共用 wiki，沒有才與使用者約定位置）；wiki 寫「歷史、不是現況」，每條主張標日期、涉及程式碼的標提交；可建議週期排程；每五個子代理工作階段約跑一次 `retro`（優先挑出問題的）；大塊工作走 `to-spec` → `to-tickets` → 發布到追蹤器 → `implement-spec`；每次動手前先想「如何改善環境」 | in-progress | `wip/chief-of-staff/SKILL.md`：「All work should be done in subagents.」「The wiki is a historical record.」 |
| `implement-spec` | 讀 spec 與票成任務圖；（選用）一個探索子代理把筆記存到 repo 外；建整合分支；每票一個全新實作子代理，各在自己的工作樹與分支，先確認基於整合分支、以 `tdd` 實作、回報前把整合分支尖端併入自己；由合併子代理併入整合分支；frontier 變動就再派；全部完成後對整合分支跑一次 `code-review`，所有發現交給一個全新子代理修；清理工作樹 | 外掛內（engineering） | `eng/implement-spec/SKILL.md`：「Start every subagent with a fresh context window.」 |
| `retro` | 讀指定（預設當前）工作階段的紀錄；依七類找候選：導航、自動檢查、編碼標準、全域 AGENTS.md、工具經濟、無效指令、資訊取得；依嚴重度列給使用者；不自行修改 | 外掛內（engineering） | `eng/retro/SKILL.md`：「You are suggesting improvements to the coding agent's environment」 |
| `software-factory` | 只提供設計用語：任務（task）、觸發（trigger）、執行（run）、執行機（runner）、議題追蹤器、工單來源、git 主機、協調器（orchestrator）、可觀測平台；一次只加一個自動觸發並先限流；每個任務回答五問（誰觸發、讀寫哪些服務、接著觸發什麼、人在哪裡重新進入、什麼阻止重複做）；不含任何執行程式 | in-progress | `wip/software-factory/SKILL.md`：「A run never waits for a human」 |
| `wayfinder` | 見 3.2 節；跨工作階段的狀態全在地圖與票 | 外掛內（engineering） | 同上 |

兩者關係：
- `handoff` 與 `claude-handoff` 是同一份摘要規則的兩個出口（檔案、或檔案加背景代理）。
- `retro` 是 `chief-of-staff` 的一個程序，也是主流程的最後一步。
- `implement-spec` 是 `chief-of-staff` 處理大塊工作時的建置程序。
- `software-factory` 是「把整條流程變成由追蹤器狀態變化觸發」的設計語言；原文只給詞彙與範例任務（`EXAMPLE-TASKS.md`），不含實作。

### 4.4 代理怎麼知道下一步做什麼

原文未說明有一個統一機制。逐處看來源：

| 情況 | 下一步的來源 | 依據 |
|------|-------------|------|
| 主流程 | 使用者輸入下一個 skill 名稱；`ask-matt` 是給人查的路由 | `eng/ask-matt/SKILL.md` |
| `wayfinder` | 地圖（Destination、Decisions so far、Not yet specified）加 frontier 查詢；未指定票時「you pick the next decision, not the user」 | `eng/wayfinder/SKILL.md`「Work through the map」 |
| 逐票建置 | 票檔與阻擋關係；本機由人手動依序；真追蹤器任何阻擋者已完成的票都可取 | `eng/ask-matt/SKILL.md` 步驟 3 |
| `implement-spec` | 任務圖與 frontier；`docs/engineering/implement-spec.md` 另提醒：GitHub 的阻擋計數在票關閉時才降，建議協調者自己追蹤已併入的票 | 同左 |
| 新工作階段接手 | `handoff` 檔（含 suggested skills 段）；或 spec、票、地圖上的「上下文指標」 | `prod/handoff/SKILL.md` |
| `chief-of-staff` | wiki 的 `index.md` 與頁面（決策前先查） | `wip/chief-of-staff/SKILL.md` |
| `triage` | 先讀既有 triage 筆記，不重問已解決的問題 | `eng/triage/SKILL.md`「Resuming a previous session」 |

### 4.5 一個工作階段做多少

| 對象 | 規定 | 依據 |
|------|------|------|
| `wayfinder` 的票 | 一票大小以「one 100K token agent session」為準；每個工作階段只解一票（research 例外） | `eng/wayfinder/SKILL.md` |
| `to-tickets` 的票 | 每片「sized to fit in a single fresh context window」 | `eng/to-tickets/SKILL.md` |
| `implement` | 一票一個工作階段，票與票之間 `/clear`（上一票的上下文可丟） | `eng/ask-matt/SKILL.md` |
| 釐清到拆票 | 同一視窗不中斷；若逼近 smart zone，在最近的階段邊界 `/compact` | 同上 |
| 實作子代理 | 每票一個全新子代理；程式碼審查後的修正也用全新子代理 | `eng/implement-spec/SKILL.md`；`.changeset/implementer-fresh-per-ticket.md` |
| `chief-of-staff` | 一個長工作階段，不切；工作都派出去以保護自己的上下文 | `wip/chief-of-staff/SKILL.md` |

兩個大小數字並存：票以 10 萬 token 為準、smart zone 約 15 萬 token。原文未說明兩者關係。

### 4.6 in-progress 的狀態

- `skills/in-progress/README.md`：「The plugin won't give you these.」要用須另以 `npx skills@latest add mattpocock/skills --skill=<名稱>` 安裝。
- `CLAUDE.md`（matt 外掛）：in-progress 為「beta: public on purpose, feedback wanted, not shipped in the plugin」；這些 skill「可能無預警變更或消失」（README）。
- 目前目錄內有：`chief-of-staff`、`claude-handoff`、`loop-me`、`setup-ts-deep-modules`、`software-factory`、`writing-beats`、`writing-fragments`、`writing-shape`。
- `implement-spec`、`retro`、`handoff`、`wayfinder` 在 `plugin.json` 的 `skills` 陣列內，屬正式發布。

## 五、議題追蹤抽象

### 5.1 追蹤器設定檔要提供的操作

來源：`eng/setup-matt-pocock-skills/issue-tracker-github.md`、`issue-tracker-local.md`；skill 內的用語：「publish to the issue tracker」、「fetch the relevant ticket」。

| 操作 | 哪些 skill 用 | GitHub 範本寫法（對照用） | 本機 Markdown 寫法（原文） |
|------|-------------|------------------------|--------------------------|
| 發布（publish） | `to-spec`、`to-tickets`、`wayfinder` | `gh issue create` | 在 `.scratch/<feature-slug>/` 建新檔（目錄不存在就建） |
| 讀票（fetch） | `implement`、`to-tickets`、`code-review` | `gh issue view <n> --json ...` | 讀被指的檔案；使用者通常給路徑或編號 |
| 列出 | `triage`、frontier 查詢 | `gh issue list --label ...` | 掃描 `.scratch/<effort>/issues/` |
| 子票（child） | `to-tickets`（來源是既有議題時）、`wayfinder` | 原生 sub-issue | 地圖檔加「每票一個子檔」；本機沒有真正的親子欄位，原文未說明以何欄表示 |
| 阻擋（blocking） | `to-tickets`、`wayfinder` | 原生 issue dependencies | 票檔近頂端一行 `Blocked by: NN, NN`；列出的檔案全為 `resolved` 才算不被擋 |
| 認領（claim） | `wayfinder` | `gh issue edit <n> --add-assignee @me`（工作階段第一個寫入） | 設 `Status: claimed` 並存檔，在任何工作之前 |
| frontier 查詢 | `wayfinder`、`implement-spec` | 開啟、無開啟中阻擋者、無指派者；依地圖順序取第一張 | 掃 `issues/`：開啟、未被擋、未認領；編號最小者優先 |
| 解決（resolve） | `wayfinder` | 留言加關票，再於地圖追加指標 | 在票檔加 `## Answer`、設 `Status: resolved`、在 `map.md` 的 Decisions so far 追加指標（摘要加連結） |
| 留言 | `triage`、`wayfinder` | `gh issue comment` | 附加在檔尾 `## Comments` 之下 |
| 標籤 | `triage`、`to-spec`、`to-tickets`、`wayfinder` | `gh issue edit --add-label` | 票檔近頂端 `Status:` 行（值為標籤字串）；`Type:` 行記票型 |
| 關閉 | `implement-spec`（「the way the issue tracker closes work」） | `gh issue close` | 本機實作票如何標完成，原文未說明；原文只定義了 wayfinder 票的 `claimed`／`resolved` |
| 地圖檔 | `wayfinder` | 帶 `wayfinder:map` 標籤的單一議題 | `.scratch/<effort>/map.md` |

另有：`.scratch/<feature>/spec.md` 為 spec 的位置（本機）。真追蹤器則 spec 是一張議題。

### 5.2 triage 狀態機

來源：`eng/triage/SKILL.md`。

- 兩個分類角色：`bug`、`enhancement`。
- 五個狀態角色：

| 標籤 | 用途 | 去向 |
|------|------|------|
| `needs-triage` | 維護者需要評估；未標籤的議題通常先到這 | → `needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix` |
| `needs-info` | 等回報者補資訊 | 回報者回覆後 → `needs-triage` |
| `ready-for-agent` | 規格完整，可交 AFK 代理 | 終點 |
| `ready-for-human` | 需人來實作（需判斷、外部存取、設計決定、手動測試） | 終點 |
| `wontfix` | 不處理；已實作者不寫 `.out-of-scope/`，被拒的改進才寫 | 終點 |

- 規則：每個已 triage 的議題恰有一個分類角色、一個狀態角色；狀態角色互相衝突時先問維護者。維護者可隨時覆寫；不尋常的轉換要先確認。
- 每則 triage 張貼的留言以固定聲明開頭：「This was generated by AI during triage.」
- 驗證步驟：先確認宣稱成立（bug 要依回報步驟重現），再訪談，再套結果。
- `triage` 只用於「你沒建立」的議題（見 3.3 節）。

### 5.3 不用 triage 時哪些 skill 仍貼標籤

| skill | 貼什麼 | 依據 |
|-------|-------|------|
| `to-spec` | `ready-for-agent`，「no need for additional triage」 | `eng/to-spec/SKILL.md` 步驟 3 |
| `to-tickets` | 真追蹤器：預設貼 `ready-for-agent`（除非另有指示）；本機範本：`Status: ready-for-agent` | `eng/to-tickets/SKILL.md` 步驟 5 與範本 |
| `wayfinder` | 只貼 `wayfinder:<type>` 與 `wayfinder:map`，「never a triage label」 | `eng/wayfinder/SKILL.md` |

`setup-matt-pocock-skills` 在 `triage` 未安裝時略過標籤段與 `triage-labels.md`。但 `to-spec`、`to-tickets` 仍引用 `ready-for-agent`；原文對「未裝 `triage` 時這個標籤字串由誰定義」未說明。（本專案已裝，標籤檔存在。）

### 5.4 本專案現況

- `docs/agents/issue-tracker.md` 與 matt 的 `issue-tracker-local.md` 逐字相同（`diff` 無差異）。`triage-labels.md` 亦逐字相同。
- `docs/agents/domain.md` 與 matt 範本不同處：改為多脈絡佈局、用詞彙表中文檔名、ADR 全部系統級放 `docs/adr/`。
- AGENTS.md 的 Agent skills 區塊寫明議題與規劃單用本機 Markdown。Linear 不是 matt 流程的追蹤器；它是 `linear-delivery` 的交付目標。

## 六、領域文件

### 6.1 檔案佈局

來源：`eng/domain-modeling/SKILL.md`。

- 單一脈絡：根目錄 `GLOSSARY.md` 加 `docs/adr/`。
- 多脈絡：根目錄 `GLOSSARY-MAP.md`（原文：「If a GLOSSARY-MAP.md exists at the root, the repo has multiple contexts.」）。ADR 可分系統級（根）與脈絡級（`src/<context>/docs/adr/`）。
- 檔案「lazily」建立：有東西可寫才建。沒有 `GLOSSARY.md` 就在第一個詞彙決定時建；沒有 `docs/adr/` 就在第一份 ADR 需要時建。

### 6.2 寫入規則

| 內容 | 去處 | 規則 | 依據 |
|------|------|------|------|
| 詞彙（專案自己的字） | `GLOSSARY.md`，詞彙一決定就寫，不批次 | 格式：`**詞**:` 一至二句定義、`_Avoid_:` 列不用的同義詞；只收本脈絡特有的概念，不收通用程式概念；可依主題分組；要有主見，同概念只選一個詞 | `GLOSSARY-FORMAT.md` |
| 詞彙表不得含什麼 | — | 「`GLOSSARY.md` should be totally devoid of implementation details.」不是 spec、不是草稿紙、不是實作決定的倉庫 | `eng/domain-modeling/SKILL.md` |
| 重大決策 | `docs/adr/NNNN-slug.md`，流水號 | 三條件同時成立才提議：難以反轉、沒有脈絡會讓人意外、真實取捨的結果；格式只需 1 至 3 句（脈絡、決定、原因），可選 Status、Considered Options、Consequences | `ADR-FORMAT.md` |
| 其餘決定 | 只留在對話，之後由 `to-spec` 接走 | 原文（docs）：Everything else you decided → 「The conversation, and nowhere else」 | `docs/engineering/grill-with-docs.md` |
| 與詞彙表衝突的用語 | 立刻指出 | 「Your glossary defines 'cancellation' as X, but you seem to mean Y.」 | `eng/domain-modeling/SKILL.md` |
| 模糊或一詞多義 | 提議標準詞 | 同上 | 同上 |
| 用情境檢驗 | 發明邊界案例，逼使用者說清概念界線 | 同上 | 同上 |
| 對照程式碼 | 使用者描述行為時查程式碼是否一致，矛盾就提出 | 同上 | 同上 |

唯讀取用的規則（`setup-matt-pocock-skills/domain.md`）：
- 探索前先讀 `GLOSSARY.md`（或 `GLOSSARY-MAP.md` 指到的）與相關 ADR；檔案不存在就靜默繼續，不提醒、不建議建。
- 輸出用詞彙表的詞，不用其 `_Avoid_` 列的同義詞。
- 輸出與既有 ADR 衝突時明說，不默默覆蓋。
- 「讀詞彙表取字」是一行習慣，不是 `domain-modeling`；只有主動改模型時才是（`.agents/invocation.md`「Passive vs active domain work」）。

### 6.3 一個事實放哪裡（matt 的分法）

| 事實類型 | 家 |
|---------|----|
| 專案用語的定義 | `GLOSSARY.md` |
| 難反轉、令人意外、有取捨的決定 | ADR |
| 本次要做什麼、使用者故事、實作決定、測試決定、範圍外 | spec（發布到追蹤器；`to-spec` 範本七段） |
| 一片可驗收的工作 | 票（含驗收條件、阻擋關係） |
| 大題目的決策與其依據 | wayfinder 地圖與決策票 |
| 被拒絕的改進請求與理由 | `.out-of-scope/<概念>.md`（`triage`） |
| 代理環境的改善 | `AGENTS.md`（僅導航指標）、`CODING_STANDARDS.md`（審查者讀）、自動檢查（`retro`） |
| 長期協調者的記憶 | wiki（`chief-of-staff`，寫歷史不寫現況） |

規格模板（`eng/to-spec/SKILL.md`）：Problem Statement、Solution、User Stories、Implementation Decisions、Testing Decisions、Out of Scope、Further Notes。實作決定「不放檔案路徑與程式碼片段」（會過期）；例外是原型產出的、比文字更精確的狀態機、reducer、schema，可內嵌並註明出自原型。

## 七、驗證機制

| 機制 | 在哪一步 | 做什麼 | 依據 |
|------|---------|-------|------|
| 對齊訪談 | 步驟 1 | 決策樹逐輪問，每題附建議答案；結束前使用者要確認共識 | `prod/grilling/SKILL.md` |
| 測試接縫（seam）先議定 | `to-spec` 與 `tdd` | `to-spec` 先畫出測試接縫並與使用者確認；偏好既有接縫、最高層接縫、「理想數量是一個」；`tdd`：「Test only at pre-agreed seams.」 | `eng/to-spec/SKILL.md`；`eng/tdd/SKILL.md` |
| `tdd` | 建置 | 先紅再綠；一次一片；只測外部行為；禁止與實作耦合、同義反覆（預期值由同一算式算出）、橫向切片（先寫完全部測試）；只在系統邊界 mock；「Refactoring is not part of the loop.」（重構屬審查階段） | `eng/tdd/SKILL.md`、`tests.md`、`mocking.md` |
| 型別檢查與測試 | `implement` | 定期型別檢查與單檔測試，結束時跑一次全套 | `eng/implement/SKILL.md` |
| `code-review` 雙軸 | 建置完成後 | 兩個平行全新子代理：**標準軸**（是否符合 repo 文件化的編碼標準，加 12 種 Fowler 程式碼異味基準；repo 標準優先，異味一律是判斷題）；**規格軸**（缺漏或部分實作、沒被要求的行為即範圍蔓延、看似實作但實作有誤；每項引規格原句）。分兩段呈報，不合併、不重排；結尾每軸一句：發現數與該軸最嚴重一項。原文：「Do **not** merge or rerank findings」 | `eng/code-review/SKILL.md` |
| 為何兩軸 | — | 遵守所有標準卻做錯東西：標準過、規格不過；做對了卻破壞慣例：規格過、標準不過 | 同上「Why two axes」 |
| 診斷迴圈 | bug | 先建立「在這個 bug 上轉紅」的迴圈（可重現、快、確定、代理可執行）才准假設；假設 3 至 5 個可證偽；回歸測試先於修正，且只在「正確接縫」寫；沒有正確接縫本身就是發現 | `eng/diagnosing-bugs/SKILL.md` |
| `triage` 驗證宣稱 | 外來議題 | bug 先依步驟重現；PR 先取出跑測試 | `eng/triage/SKILL.md` 步驟 3 |
| PR 證據 | 開 PR | Evidence 段要 before／after（截圖最佳、執行輸出次之）；Merge Danger 判單向門或雙向門與影響範圍 | `eng/pr/SKILL.md` |
| `retro` | 事後 | 對環境提改善：機械性錯誤變決定性檢查（lint、型別、提交前掛鉤、CI），判斷題才寫進編碼標準；「standards belong to the reviewer, not the implementer」 | `eng/retro/SKILL.md`；`docs/engineering/retro.md` |
| `implement-spec` 收尾 | 全部票完成後 | 對整合分支跑一次 `code-review`；`docs` 警告：審查若在票未全落地時跑，未建的票會被當失敗 | `eng/implement-spec/SKILL.md`；`docs/engineering/implement-spec.md` |

### 對「規格本身」的稽核

原文沒有這個步驟。逐項看：

- `to-spec`：「Do NOT interview the user; just synthesize what you already know.」；docs 說「the spec does not validate or decide anything」，若 spec 寫了使用者沒說過的事是缺陷。
- `code-review` 規格軸：比對的是程式碼 diff 與 spec，不是 spec 是否正確。
- `docs/engineering/grill-with-docs.md` 的使用者回報提到：後續步驟會把精確答案軟化成較弱的文字（排序保證、否定需求、數值預設），建議「re-read the spec against your own answers」。這是使用者自己要做的建議，不是 skill 內建步驟。
- 規格正確性的人工把關只有三處：`grilling` 結束的確認、`to-spec` 的測試接縫確認、`to-tickets` 的拆法核准。

## 八、與本專案的落差

本專案產出不是程式碼，而是 wiki 卡、規劃單、Prototype、Linear 票。以下只列對應與缺口，不設計解法。

### 8.1 逐步驟對應

| matt 步驟 | matt 的假設 | 本專案現有對應 | 缺口 |
|-----------|------------|---------------|------|
| `setup-matt-pocock-skills` | repo 有程式碼、可選 GitHub／GitLab／本機 | 已完成；`docs/agents/` 三檔、AGENTS.md 區塊 | 無（三檔與種子範本相同或已改寫為多脈絡） |
| `grill-with-docs` | 訪談中即時寫 `GLOSSARY.md`；與「程式碼」對照；ADR 少量；其餘決定留對話 | `grill-with-docs` 已用；拍板內容走 `wiki-amend` 落卡（把定案內容寫進 wiki 正本卡）；詞彙表為 wiki 內的中文檔名 | matt 的詞彙表只放用語；本專案的規則、欄位、狀態、情境放 wiki 卡，matt 無對應。`domain-modeling` 的「對照程式碼」在本專案要對照什麼，原文未說明（可能是 wiki 卡與 Prototype）。`domain-modeling` 寫死檔名 `GLOSSARY.md`，本專案詞彙表檔名是 `ERP 詞彙表.md`、`線上編輯器詞彙表.md`，原文未說明它如何對映 |
| 前置盤點 | matt 無 | `erp-plan` 盤點（衝突檢查、分級、調研建議） | matt 完全沒有「動手前對既有正本做衝突與影響盤點」的步驟 |
| `prototype` | 原型是拋棄式；採納後原型存 `prototype/<name>` 分支，主分支只留決策 | Prototype 在 erp repo，是長期保存的介面互動正本，經 PR 合併；需經 erp repo 的 `prototype-from-prompt` skill | 角色相反：matt 的原型用完即棄，本專案的 Prototype 是交付物。matt 的邏輯原型（單一 HTML 推狀態機）可對應到驗證 wiki 狀態機卡，但本專案現行流程沒有這一步，原文也未說明該怎麼對 |
| `to-spec` | spec 含 Testing Decisions；先與使用者確認測試接縫；跑在程式碼庫上 | `to-spec` 產 `.scratch/<主題>/spec.md`，做完不合併、不當長期正本；欄位表、狀態列舉、業務規則句不進規劃單（引用 wiki 卡） | matt 的 spec 是長期決策紀錄；本專案規劃單是一次性。「測試接縫」在本專案無明確對應（可對照 `erp-prototype-tests/` 的情境條目，原文未說明） |
| `to-tickets` | 垂直切片穿過 schema、API、UI、測試；先預備重構 | `to-tickets` 垂直切片票，標依賴 | 「穿過每一層」在本專案要穿過哪些層（wiki、Prototype、測試、Linear），原文未說明 |
| 規格稽核 | 無 | `erp-audit` | matt 無此步驟；本專案整段自補 |
| 建置 | `implement` 內含 `tdd`、型別檢查、全套測試、提交到當前分支 | `implement` 實作 Prototype（erp repo）；只跑 `npm run test:smoke` 與改到的章，全套只在 Miles 指示時跑 | 對 wiki 卡的「實作」是 `wiki-amend` 寫卡，matt 無對應。`tdd` 先紅後綠在本專案要紅的是情境目錄條目；AGENTS.md 現行「先補情境目錄與測試」 |
| 平行建置 | `implement-spec`：工作樹加整合分支加合併子代理 | 代理一律用工作樹；分支完成直接快轉合併 master，不開 PR（erp repo 例外，走 PR） | 本專案沒有整合分支概念；多票平行時的合併與衝突處理，現行流程未寫 |
| `code-review` | 標準軸讀編碼標準；規格軸讀 spec；比對 git diff | AGENTS.md 流程內有 `code-review` | 本專案「編碼標準」是什麼（wiki 撰寫規範卡？Prototype 的 DESIGN.md？），原文未說明；規格軸要比對的規格是規劃單還是 wiki 卡，也未定 |
| `pr` | PR 本文含截圖與測試證據 | erp repo 走 PR（`prototype-from-prompt`） | 無新增缺口；本專案 PR 規則另有「Prototype 的 PR 不關聯 Linear issue」 |
| `triage` | 處理外部回報者的議題 | 本專案無外部回報者 | 「識別到不確定項」本專案用 `oq-manage` 開 OQ 卡；matt 無不確定項管理，最近的是 `needs-info`，但語意是等回報者 |
| `wayfinder` | 大題目的地圖加決策票，存本機 `.scratch/<effort>/` | `.scratch/workflow-rebuild/map.md` 正在用；ERP 規劃的入口表未提 `wayfinder` | AGENTS.md 工作入口對「一個工作階段裝不下的 ERP 大題目」無列項（現行以 `erp-plan` 盤點加 `grill-with-docs` 為單一路徑） |
| 詞彙與 ADR | `GLOSSARY.md`、`docs/adr/` | wiki 詞彙表；`docs/adr/` 目錄在本專案不存在（也未在主檢出） | matt 規定「lazily」，所以不存在不是缺口；但 AGENTS.md 寫「重大決策寫 ADR（`docs/adr/`）」，兩者一致 |
| `retro` | 對程式碼環境提改善：自動檢查、編碼標準、AGENTS.md 精簡 | AGENTS.md 的「陷阱」表加收尾回報；`vault-audit`（知識庫健檢） | 沒有「讀工作階段紀錄找環境改善點」的對應步驟。機械性檢查在 wiki 與規劃單上要用什麼工具，原文未說明 |
| `diagnosing-bugs`、`improve-codebase-architecture`、`codebase-design`、`setup-ts-deep-modules` | 針對程式碼 | 無對應；Prototype 的測試失敗才可能用到 `diagnosing-bugs` | 本專案不寫實作程式碼，這四個 skill 無對應需求 |
| `research` | 背景代理查一手來源，存 Markdown | `vault-ingest`、`erp-researcher` 子代理（附網址與原文句） | 無新增缺口 |
| `handoff` | 暫存目錄的交接檔 | `memory/shared/派工任務書範本.md` | 本專案的交接以任務書與 `.scratch/` 為主；沒有「接手新工作階段」的標準入口 |
| 交付 | 無（matt 的票就是工作單，不外送） | `linear-delivery`：專案、里程碑、Feature 票、前後端 Task 子票；取材 wiki、Prototype、情境目錄，不取材 `.scratch/` | matt 無此步驟。本專案的票（`.scratch/issues/`）與交付的票（Linear）不是同一批 |

### 8.2 規格與 wiki 的關係

| 項目 | matt | 本專案 |
|------|------|--------|
| 長期正本 | `GLOSSARY.md`、ADR、程式碼、測試 | wiki 卡、情境目錄加測試 |
| spec 的壽命 | 決策紀錄，留在追蹤器 | 一次性，做完不合併 |
| 業務規則的家 | 原文未說明（程式碼本身或 spec 的 Implementation Decisions） | wiki 的 `04-business-logic` 等層 |
| 詞彙表內容 | 只有用語，「devoid of implementation details」 | 同樣用 matt 格式，但另有欄位表、狀態機、情境骨架等卡 |
| 拍板落點 | 詞彙進 `GLOSSARY.md`、大決策進 ADR，其餘留在對話再進 spec | 拍板先 `wiki-amend` 落卡，再寫規劃單 |

### 8.3 AGENTS.md 現行流程與 matt 原設計的差異

現行：`erp-plan` 盤點 → `grill-with-docs`（中途 `oq-manage`）→ `wiki-amend` → `to-spec` → `erp-audit` → `to-tickets` → `implement` → `code-review` → `linear-delivery`。

| 位置 | matt 原設計 | 本專案現行 | 差異 |
|------|------------|-----------|------|
| 第 1 步之前 | 無 | `erp-plan` 盤點 | 多出一步 |
| 訪談中 | 詞彙與 ADR 即時寫入 | `oq-manage` 即時開 OQ 卡，且禁止在卡內標注待確認 | 多出不確定項分流 |
| 訪談與 `to-spec` 之間 | 無（決定留對話，直接進 `to-spec`） | `wiki-amend` 先把拍板落到 wiki 卡 | 多出一步，且順序為「先落卡、再寫規劃單」 |
| `to-spec` 之後 | 直接 `to-tickets` | `erp-audit` 稽核規劃單 | 多出一步 |
| 原型分支 | 步驟 2 的可選分支（`prototype`） | 實作階段在 erp repo 以 `prototype-from-prompt` 進行 | 位置與性質不同（見 8.1） |
| `implement` 之後 | `code-review`，然後可選 `pr`、`retro` | `code-review`，然後 `linear-delivery` | 多出交付步驟；缺 `retro`、`pr` 不在順序內 |
| 大題目 | `wayfinder` 作為另一條路 | 流程順序未列；`.scratch/workflow-rebuild/` 實際使用 | 流程順序未涵蓋 |
| 同一工作階段內的上下文 | 步驟 1 至 3 一個視窗不中斷 | 未規定 | 原文（AGENTS.md）未說明 |

## 九、存疑與原文未說明處

1. **自動串接**：matt 外掛內沒有把主流程連成一條的 skill。`ask-matt` 只是給人查的路由。若要「只給需求就持續往下」，matt 原文只提供 `chief-of-staff`（in-progress）的做法：讀相對路徑執行其他 skill。
2. **`chief-of-staff` 未列於 README**：`skills/in-progress/README.md` 的清單有 7 個 skill，不含 `chief-of-staff`；目錄與 changeset 都有它。是否正式屬 in-progress，原文未說明。
3. **本機模式下的中斷接續**：`issue-tracker-local.md` 定義了 `claimed`／`resolved`。工作階段認領後中斷，這張票卡在 `claimed`；有無「認領逾期」或「重新認領」規則，原文未說明。GitHub 模式靠指派者，同樣沒有逾期規則。
4. **本機實作票的完成狀態**：本機範本的 `Status:` 只列標籤角色與 wayfinder 的 `claimed`／`resolved`；`to-tickets` 產的實作票做完怎麼標，`implement` 怎麼更新，原文未說明。`implement-spec` 寫「resolve each ticket the way the issue tracker closes work」，但本機的關閉寫法只對 wayfinder 票有定義。
5. **`implement` 的 `/clear`**：`ask-matt` 說逐票實作時票與票之間 `/clear`；`implement/SKILL.md` 本身沒有任何清空指示。清空由使用者做。
6. **人在場或獨立的標示**：只有 `wayfinder` 的票型明文標 HITL／AFK；`ready-for-agent` 標籤的定義用到 AFK。其他 skill 的分類本檔多為判讀。
7. **`grill-with-docs` 寫檔不穩**：`docs/engineering/grill-with-docs.md` 記錄兩個已知問題：被包進其他編排層時寫檔那一半不會發生；`SKILL.md` 只有一行委派，只載入 `grilling` 而漏 `domain-modeling` 時沒有紙本紀錄。這些是使用者回報，不是 skill 保證。
8. **決定被軟化**：同檔記錄：只在對話中的決定交給 `to-spec` 時，精確答案（排序保證、否定需求、數值預設）會被軟化。matt 外掛內沒有對應檢查。
9. **`wayfinder` 的已知失敗**：`docs/engineering/wayfinder.md` 記錄：代理在地圖中途寫正式程式（Notes 欄由被限制的代理自己寫，可自行加例外）；27 張票排到第 13 張時後面已失效；平行處理兩張 grilling 票時一邊會問另一邊已答的問題；已關決策發現錯誤時無官方做法，代理傾向繞過而非挑戰。這些是使用者回報與 docs 的說明，不是 SKILL.md 的規則。
10. **本機追蹤器的建議**：同檔：「Local markdown puts the artifacts in your repo, which is not recommended」，理由是 repo 內的材料容易意外留存；本專案已選本機。
11. **`implement-spec` 審查迴圈**：docs 記錄審查加修正的迴圈曾跑數小時，且 SKILL.md 沒有「修完後何時停」的規則；GitHub 的阻擋計數在票關閉時才降，導致中途 frontier 過時。
12. **票大小與視窗大小**：票以 10 萬 token 為準（`wayfinder`），smart zone 約 15 萬 token（`PHASE-BOUNDARIES.md`），兩者關係原文未說明。
13. **詞彙表檔名**：`domain-modeling` 與 `GLOSSARY-FORMAT.md` 寫死 `GLOSSARY.md`；本專案 `docs/agents/domain.md` 改寫了消費端規則（讀取時用中文檔名），但「寫入時」`domain-modeling` 如何找到 `ERP 詞彙表.md` 而不另建 `GLOSSARY.md`，原文未說明。
14. **matt 自己的詞彙表不一致**：外掛根目錄 `GLOSSARY.md` 以 `ready-for-afk` 為 triage 角色範例，與實際 skill 與設定檔的 `ready-for-agent` 不同；以 skill 與 `triage-labels.md` 為準。
15. **`software-factory`**：原文只提供語言、範例任務與各服務選型調查，不含觸發器、協調器或執行機的實作；本專案若要「追蹤器狀態變化觸發下一步」，matt 外掛內沒有現成可用的元件。
16. **`.in_use/` 目錄**：外掛快取內有 `.in_use/` 數個檔案，用途原文未說明，與流程無關，未納入。
17. **未讀範圍**：`node_modules/`、`.github/` 的工作流程檔、`skills/**/agents/openai.yaml`（只用其存在作為啟動型旁證，未逐檔核對）。`docs/` 下的人類向頁面（`aihero.dev` 說明）只用於補充常見問題與已知限制，凡引用處已標示為 docs。
