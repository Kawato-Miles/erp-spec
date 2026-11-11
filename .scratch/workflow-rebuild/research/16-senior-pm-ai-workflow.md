# 票 16：資深產品經理的 AI 工作流、工程回到規劃端、契約對齊、測試顆粒度、一人專案管理

主對話抽查（2026-11-11）：相符：Playwright 官方對 `--only-changed`、`--shard`、`--grep` 的說明；Teresa Torres 文章的兩句引句與她的檔案組織方式。未能查證：Linear 與 GitHub 整合的官方文件頁，主對話抓回的內容只有給 AI 的連線提示，沒有文件本文；本檔第三節該列的機制描述以「未由主對話查證」看待。調研員自述抓取工具只回小模型摘要，引句取自摘要中的引號片段，可信度低於逐字比對。其餘未抽查。

調研日期：2026-11-11。接續票 13（`13-pm-delivery-workflow.md`），票 13 已查過的來源（Linear Method、Shape Up、GitLab、Cagan 2006 與 2025 的原型文章、Adzic 調查、Cucumber BDD 頁、spec-kit、Kiro、Böckeler）不重查，本檔只補新的。
查證方式：引句皆為抓回原文後逐字看到的片段，每句不超過 15 個英文字詞。抓取工具會先由小模型摘要頁面；本檔只把摘要中用引號標出的原文片段當引句，其餘為轉述。「未載」表示該來源沒有談這一點。
來源類型：第一手＝作者本人描述自己的做法；官方＝工具或標準的官方文件；行銷／二手＝廠商宣傳、第三方轉述、付費牆預覽。
注意：Linear 文件頁的抓回內容夾帶一段寫給 AI 代理、要求連接 MCP 伺服器的文字，未照做。

## 一、摘要

1. 找得到的資深產品經理第一手做法，共通點是「檔案即脈絡」：以純文字（Markdown）檔放在本機或 git 程式庫，由 Claude Code 讀寫（Torres、Astronomer 的產品經理）。這些例子的對象多是產品經理自己的研究與任務，不是與工程對齊的規格。
2. 與工程交接的第一手描述很少。Lenny 週報的槓桿階梯把「代理提交程式碼，工程師審查並合併」列為最高階；Astronomer 的產品經理提出一個命令列工具的小修改，由工程師審查後合併。
3. Anthropic 官方稱 Claude Code 團隊「以原型取代文件優先」，並稱產品經理做原型與評測（evals）。這是廠商自述，不是獨立驗證。
4. 追蹤工具各異：Torres 與 Astronomer 用 Markdown 待辦；一位部落格作者用 GitHub 議題；Peter Yang 的課程大綱列 Linear MCP；Dennis Yang 由 PRD 檔產生 Jira 票（二手）。沒有找到「一人團隊同一件事只記一處」的明文準則，只有 Astronomer 的「Markdown 放 git」原則。
5. 工程實作回到規劃端，官方有現成機制：Linear 與 GitHub 整合可用議題編號與關鍵字（magic words）自動連結並改狀態；Claude Code 的 GitHub Action 可在合併請求留言、或排程產生「昨日提交摘要」。
6. 由程式碼更新文件的現成產品（Mintlify、GitHub 的 gh-aw）都走「代理開合併請求、人審查」；Mintlify 的程式碼觸發自動化需要企業版方案。
7. 契約對齊的主流做法是以 OpenAPI 為唯一來源，產生型別、Zod 結構、MSW 假資料處理器；前提是後端要發布並維持準確的 OpenAPI 檔。Evil Martians 的文章明說假資料行為仍要手寫維護。
8. Pact 的契約由「消費端的測試」產生，不是人手寫；需要雙方程式庫都有測試。產品經理不維護後端程式庫時，無法單方使用。
9. 測試顆粒度的業界語言：Gherkin 以 Feature 下設 Rule、Rule 下設 Example，每個 Example 同時是可執行測試；Fowler 主張端對端測試減到最少，並把每個測試放到金字塔盡可能低的層。
10. Playwright 官方提供依改動挑測試（`--only-changed`）、依標題篩選（`--grep`）、分片（`--shard`）與工作程序數（`--workers`）；官方文件沒有列出「套件變慢的常見原因」清單，只有隔離、模擬第三方、只裝需要的瀏覽器等做法。

## 二、問題 1：資深產品經理的 AI 工作流實例

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 產品經理把全部工作放在本機 git 程式庫的 Markdown 檔（`people/`、`customers/`、`daily/`、`work/`），Claude Code 讀寫；會議逐字稿由自訂技能（skill）寫入人物檔與每日紀錄；待辦與追蹤全在 Markdown，不用 Jira | 第一手（公司部落格，作者姓名抓回內容未載） | astronomer.io/blog/what-happens-when-a-pm-runs-a-coding-agent-almost-full-time/。「Markdown in a git repo, not rich text in a locked-down SaaS tool.」 | 一人使用；該文說系統為單人設計，作者計畫日後讓部分變成協作 | 抓回內容未載與工程如何對齊規格；本檔唯一「同庫記一處」的第一手例子 |
| 同一位作者：用 Claude Code 起草一個命令列工具的小修改，工程師審查後合併；來源是客服團隊標記的客戶需求 | 第一手 | 同上。引句：未取得（轉述） | 小型、範圍清楚的程式碼變更 | 只描述一例；審查規範未載 |
| Teresa Torres：許多小而專注的脈絡檔加索引檔，全域 CLAUDE.md 指示何時載入哪個檔；任務管理也用 Markdown | 第一手（本人網站）與 Lenny 週報的節目摘要（二手） | producttalk.org/claude-code-what-it-is-and-how-its-different/。「your files are your context」；「You own your data」。節目摘要：lennysnewsletter.com/p/this-week-on-how-i-ai-claude-code | 產品探索、研究與寫作類工作 | 兩處皆未談與工程的交接；完整配方在付費內容（抓回頁面未載） |
| 一位產品經理（部落格作者，姓名未確認）：以 GitHub 命令列工具讓 Claude 直接讀寫 GitHub 議題；Notion 放文件；CLAUDE.md 放慣例與範本 | 第一手（電子報） | buttondown.com/nuno/archive/pming-with-claude-code。「This gives me read and write access to my GitHub issues directly from Claude.」 | 追蹤已在 GitHub 議題的團隊 | 抓回內容只有片段；未談交接與原型 |
| Lenny 週報的「槓桿階梯」：最高階是代理提交程式碼，工程師審查並合併；適合文案修改與小介面調整 | 週報文章（作者署名未確認）；部分付費牆 | lennysnewsletter.com/p/how-top-pms-increase-their-leverage。「An engineer picks up the PR, reviews, and merges your code into the product.」 | 小範圍、可由工程師快速審查的變更 | 追蹤與事實來源章節在付費牆內，未讀 |
| Anthropic 官方：Claude Code 團隊以原型取代文件優先；寫好規格後丟給 Claude Code 看能不能做出來；產品經理做原型與評測；站會改成展示 | 官方（廠商自述，兼具行銷性質） | claude.com/blog/product-management-on-the-ai-exponential。「Our team has largely replaced documentation-first thinking with prototype-first thinking.」 | 產品本身是 AI 工具、團隊小、成員工程能力強 | 抓回內容未載追蹤工具；是廠商自己的團隊，不能推及一般企業系統 |
| Anthropic 官方的各團隊案例：產品設計團隊把設計檔交給 Claude Code 自主迭代、設計師審查；產品工程團隊把 Claude Code 當「第一站」；法務團隊做出電話樹原型 | 官方（廠商案例） | claude.com/blog/how-anthropic-teams-use-claude-code。「work autonomously, then review solutions before final refinements」；「without needing to rely on other engineering teams for assistance」 | 各團隊有自己的工作流程可套用 | 抓回內容寫明設計團隊的工程交接、法務的交接與合併請求均未載；完整 PDF 報告未讀 |
| Peter Yang：先做原型再寫 PRD；工具為 Claude Projects、Google AI Studio、Obsidian＋Cursor、Linear MCP | 本人課程頁（大部分付費牆） | creatoreconomy.so/p/full-course-the-ai-stack-we-use-for-prototyping-strategy-personal-os-aman-tal。「Prototype before you write the PRD.」 | 新功能探索階段 | 最終文件存放處與工程交接，抓回可見內容皆未載 |
| Dennis Yang（Chime）：以 Cursor 寫 PRD 並放原始碼管控，透過 MCP 推到 Confluence、Notion，並由 PRD 自動建 Jira 票 | 二手（Lenny 週報的節目簡介，節目由 ChatPRD 的 How I AI 系列製作） | lennysnewsletter.com/p/cursor-is-a-much-better-product-manager。「source-controlled markdown files might replace traditional SaaS tools」 | 使用 Jira 與 Confluence 的團隊 | 簡介頁推論多於陳述；逐字稿未取得。部分第三方文章另稱他用 Claude Code 把 PRD 變原型，該說法只見於二手文章 |
| Gusto 團隊十週做出新產品線：不用 Jira、Figma、規格文件；合併請求本身即提案；Figma 以外的設計師做出帶功能旗標的介面與假回應，工程師換成真實行為 | 行銷（ChatPRD 的 How I AI 系列，含贊助與行動呼籲） | chatprd.ai/how-i-ai/how-gusto-built-a-new-product-line-in-10-weeks-with-claude-code-no-jira-and-no-docs。「We had no Jira board where we tracked stories or tracked work.」 | 五人資深工程師加設計師的小團隊 | 該文自述需要資深人員、夜間與週末；數據出自當事人與公司內部資料；文中未指名事實來源 |
| Marty Cagan（2025 SVPG）：AI 讓產品經理角色更重要但更難；程式與設計提速不必然帶來更好的結果 | 第一手（SVPG 文章） | svpg.com/ai-product-management-2-years-in/。「more essential but also more difficult」 | 判斷 AI 工具該不該直接交給產品經理 | 該文沒談原型當規格與工程交接；搜尋結果中「prototype as spec」的說法只見二手，未抓到 SVPG 原文 |

## 三、問題 2：工程實作如何回到規劃端

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| Linear 與 GitHub：分支名含議題編號；合併請求標題或描述、提交訊息中，在議題編號前加關鍵字（如 fixes），Linear 自動連結並改狀態；關鍵字分「結案」「非結案」「僅關聯」三類；同一合併請求可連多張議題；多個合併請求連同一議題時，最後一個達標才改狀態；可在議題編號前寫 skip 或 ignore 阻止連結 | 官方 | linear.app/docs/github。設定名稱「Automatically link or create issues on merge」；狀態名稱「On PR or commit merge」。其餘為轉述 | 工程團隊願意在分支名、提交訊息、合併請求中放議題編號 | 靠工程師遵守寫法；自動比對的連結為「貢獻」關係，不觸發合併狀態（頁面轉述）；一手逐字未驗證（見第八節） |
| Linear 依團隊設定「合併請求草稿、開啟、請求審查、可合併、已合併」各自對應的議題狀態，預設開啟為進行中、合併為完成；可依目標分支（支援正規表示式）設不同規則 | 官方 | 同上。引句：未取得（轉述） | 團隊要在 Linear 設定自動化 | 失敗的檢查（含非必要檢查）可能擋住「可合併」狀態（頁面轉述） |
| Linear 的編碼工作階段（coding sessions）：把議題指派給代理，在雲端環境寫與測，回傳草稿合併請求供審查 | 官方文件頁抓取失敗（404）；內容僅見搜尋結果摘要 | linear.app/docs/coding-sessions（抓取 404）。搜尋摘要稱需付費方案、耗用工作區 AI 額度 | 工程端願意讓代理改程式庫 | 未查證；與 Miles 的情境（正式程式庫由工程團隊負責）關係存疑 |
| Claude Code 的 GitHub Action：在合併請求或議題留言提及 `@claude`，可分析程式、實作並推送提交；也可排程，例如每日產生「昨日提交與開啟議題」摘要 | 官方 | code.claude.com/docs/en/github-actions。「analyze code, implement changes, and push commits」；排程範例提示「Generate a summary of yesterday's commits and open issues」 | 對該程式庫有管理員權限可安裝（官方文件：需要管理員權限） | 安裝要取得該 GitHub 應用程式的整組權限；文件要求「review Claude's changes before merging」；消耗 Actions 分鐘與 API 額度 |
| Mintlify：來源程式庫的合併請求合併時觸發文件更新，代理開文件合併請求；審查者預設為程式變更的作者 | 官方文件（廠商產品） | mintlify.com/docs/agent/workflows。「Runs when a pull request merges in one or more connected source code repositories.」 | 文件是 Mintlify 站；需連接來源程式庫 | 抓回內容寫明需企業版方案；Mintlify 的文件站與 Miles 的知識庫不是同一種東西 |
| GitHub Agentic Workflows（gh-aw）：在 Actions 內以純文字描述工作流，列有「Daily Documentation Updater」，描述為「Updates docs from recent code changes」 | 官方（技術預覽版） | github.github.com/gh-aw/ | 能在目標程式庫跑 Actions | 抓回頁面未說明是否掃描已合併的合併請求；為預覽版，行為可能改變 |
| 文件與程式同庫、同審查（票 13 已查） | 官方／社群 | 見 `13-pm-delivery-workflow.md` 第三節 | 同庫 | Miles 的知識庫在另一程式庫（Sens），不適用 |
| 產品經理自行在程式庫提小修改（Astronomer 例，見第二節） | 第一手 | 見第二節 | 工程團隊願意審查產品經理的合併請求 | 只有一例 |

## 四、問題 3：原型資料與後端資料對齊、欄位驗證只寫一份

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| OpenAPI 為共同契約：以與語言無關的格式描述 HTTP 介面，含資料結構與型別、限制；工具可據以產生文件、客戶端、伺服器、測試 | 官方（規格本文） | spec.openapis.org/oas/latest.html。「defines a standard, programming language-agnostic interface description for HTTP APIs」 | 有 HTTP 介面，且有人維護這份檔 | 規格檔誰寫、誰維護，規格本文未規定 |
| 以 OpenAPI 產生前端型別、Zod 結構、假資料處理器：Evil Martians 範例中，表單規則由產生的 Zod 結構提供，MSW 處理器使用產生的型別，契約變動後重新產生並由 TypeScript 指出壞掉的地方 | 第一手（工程顧問公司部落格） | evilmartians.com/chronicles/lifes-too-short-to-hand-write-api-types-openapi-driven-react。引句：規格被稱為「the source of truth」（原文片段） | 前端為 TypeScript；後端發布準確的 OpenAPI 檔（網址或本機檔） | 文中自述：假資料行為與狀態需手寫；記憶體內假資料重新載入即重置；規格錯則型別、結構、假資料同樣錯；只涵蓋前端半邊 |
| 由 OpenAPI 檔直接啟動假資料伺服器：Prism 讀 OpenAPI v2／v3 與 Postman Collection，提供假伺服器與請求驗證；也可作為驗證代理，比對真實 API 與文件的差異 | 官方（專案頁面） | github.com/stoplightio/prism。「Life-like mock servers from any API specification document.」 | 手上有 OpenAPI 檔；原型只需讀取回應 | 回應預設取自規格內範例（搜尋摘要，未驗證）；驗證代理需要可連的真實後端；專案頁未載是否仍積極維護 |
| 用 MSW 在網路層攔截請求：瀏覽器用 Service Worker，Node 用類別擴充；同一組模擬可用於開發、整合與端對端測試 | 官方 | mswjs.io/docs/。「intercept actual production requests on the network level」；「the same API mocks during development, integration and end-to-end testing」 | 前端程式碼已用 fetch 等客戶端呼叫 API | 官方頁未提 OpenAPI 整合（轉接靠第三方工具，如 Orval、Kubb，只見搜尋結果，未驗證） |
| Zod 當單一來源：一份結構同時驗證資料並提供型別；內建轉成 JSON Schema | 官方 | zod.dev。「TypeScript-first schema validation with static type inference.」 | 前後端同為 TypeScript，可共用套件 | 官方頁未明說前後端共用做法；前後端語言不同則不適用；方向要二選一，搜尋結果警告兩個方向並用會漂移（二手，未驗證） |
| Pact（消費者驅動契約測試）：消費端的測試向模擬提供者註冊互動並產出契約檔，提供者端再以該契約驗證；契約是從測試產生，不是另寫 | 官方 | docs.pact.io/getting_started/how_pact_works。引句：未取得（轉述）；比較頁 docs.pact.io/getting_started/comparisons 稱手寫契約「This creates a potential for drift.」 | 前後端兩邊的程式庫都能寫與跑測試 | 官方頁寫明：Pact 不用於功能測試，不應依賴提供者回傳的特定資料；兩邊都要有測試 |
| 產品經理端的欄位規格表（資料字典）：欄位定義、型別、可否為空、可接受值、範圍與唯一性規則 | 二手（廠商範本，經搜尋摘要） | docsie.io 的資料字典範本；playcode.io 的資料字典部落格（後者推銷自家範本包）。均未抓原頁 | 作為給人讀的規格 | 搜尋結果沒找到「給工程師的產品經理欄位規格」權威範本；範本屬資料分析領域，未必適用業務表單 |

「產品經理不維護後端程式庫」時：
- OpenAPI 檔與 Prism：產品經理可在自己的程式庫放一份 OpenAPI 檔並用 Prism 啟動假伺服器，不需後端程式庫；但這份檔與後端實際行為是否一致，需另有機制（如 Prism 驗證代理，要能連到真實後端）。
- Evil Martians 的做法與 Pact：明文要求後端發布準確契約，或雙方都有測試，產品經理單方無法成立。

## 五、問題 4：產品經理看情境與測試的顆粒度

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| Gherkin 階層：Feature 之下可有 Rule，Rule 下列出說明該規則的 Example；Example 是最具體的一層，同時是可執行測試 | 官方 | cucumber.io/docs/gherkin/reference/。「one or more scenarios that illustrate the particular rule」 | 想把業務規則與範例分層、讓範例可被執行 | 一個 Feature 底下可能有很多 Rule；頁面未載建議數量 |
| 測試金字塔：單元測試最多，端對端測試減到最少、只留少數高價值使用者旅程；每個測試放到金字塔盡可能低的層 | 第一手（Fowler 網站文章） | martinfowler.com/articles/practical-test-pyramid.html。「reduce the number of end-to-end tests to a bare minimum」；「Having a low-level test is better than having a high-level test.」 | 後端為主、層次完整的系統 | 文章以服務與後端為主；未載以原型為目標的情況 |
| 端對端測試的代價：慢且易不穩 | 第一手 | 同上。「notoriously flaky」 | — | 未提供量化門檻 |
| 驗收測試與金字塔正交：可寫在任何層 | 第一手 | 同上。抓回摘要稱驗收測試「completely orthogonal to your test pyramid」（摘要引句，未逐字核對全文） | 想把「業務可見的驗收條目」與「測試所在層」分開 | 未載如何對映 |
| 依改動挑測試（test impact analysis）：記錄每個測試執行到哪些程式碼，改動後只跑相關測試 | 第一手（Fowler 網站文章） | martinfowler.com/articles/rise-test-impact-analysis.html。「a modern way of speeding up the test automation phase of a build」 | 有程式碼覆蓋率或相依資料，能建對映表 | 最初建對映表成本高；依賴非程式碼輸入（資源檔）的測試可能被漏掉；若常改動被多數測試使用的程式，節省有限 |
| Playwright 依改動挑測試：`--only-changed` 只跑相對 git 參照有改動的測試檔 | 官方 | playwright.dev/docs/test-cli。「Only run test files that have been changed between 'HEAD' and 'ref'.」 | 測試檔與被測程式在同一 git 程式庫 | 只看「測試檔」是否改動，不分析被測程式；僅支援 git（官方頁） |
| Playwright 依標題篩選：`--grep` | 官方 | 同上。「Only run tests matching this regular expression」 | 想自訂子集（如冒煙測試）時，命名需有規約 | 官方頁只給篩選旗標，未載「冒煙子集」的建議做法（未查證專用標籤文件） |
| Playwright 平行與分片：預設以檔案為單位平行；單一檔案內依序執行；`fullyParallel` 讓檔內測試也平行；`--shard` 跨機器切分；建議分片時開 `fullyParallel` 使分配平均 | 官方 | playwright.dev/docs/test-parallel：「By default, test files are run in parallel」；「Tests in a single file are run in order, in the same worker process.」。playwright.dev/docs/test-sharding：「it is recommended to use `fullyParallel: true` when aiming for balanced distribution across shards」 | 測試彼此獨立；有多台機器或多核心 | 官方：在 CI 限制工作程序數；「keep your tests isolated」；不建議使用 serial 模式 |
| Playwright 官方列出的加速與穩定做法：測試彼此隔離；以網路 API 模擬外部相依；只裝需要的瀏覽器；用網頁優先斷言（自動等待）；「Consider setting up Sharding to make CI faster」 | 官方 | playwright.dev/docs/best-practices。「Each test should be completely isolated from another test and should run independently.」 | 一般 Playwright 套件 | 官方頁未列「套件變慢的常見原因」，只給做法；常見原因的歸納屬第三方部落格，未抓取（見第八節） |

## 六、問題 5：一人產品經理加 AI 代理的專案管理

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 全部放 Markdown 與 git：待辦、每日紀錄、人物與客戶檔同一程式庫 | 第一手（Astronomer） | 見第二節第一列。「Markdown in a git repo, not rich text in a locked-down SaaS tool.」 | 只有一個人用 | 作者自述系統為單人設計，協作需另做 |
| Markdown 任務管理加索引檔，不開瀏覽器 | 第一手（Torres）與二手摘要 | producttalk.org 與 Lenny 節目摘要（見第二節）。節目摘要引句：「I didn't have to open a web browser.」 | 一人、任務多為個人工作 | 與團隊追蹤工具如何同步，兩處皆未載 |
| 追蹤放 GitHub 議題，由代理經命令列工具讀寫 | 第一手（部落格） | 見第二節。 | 團隊已用 GitHub 議題 | 抓回片段未載與 Notion 文件的關係，也就是「同一件事記兩處」的處理未載 |
| 追蹤放 Linear，代理經 MCP 管任務 | 本人課程頁大綱（付費牆） | creatoreconomy.so（見第二節）。列為「Linear MCP for managing tasks」（摘要轉述） | 團隊用 Linear | 付費牆，細節未讀 |
| 由 PRD 檔單向產生 Jira 票，PRD 放原始碼管控 | 二手（Lenny 節目簡介） | 見第二節 | 有 Jira | 只有簡介；單向產生後票內容被改，是否回寫，未載 |
| 以合併請求為追蹤單位，不設看板 | 行銷（Gusto 案例） | 見第二節。 | 小團隊、全員是資深工程師 | 文章自述是一次實驗 |
| Linear 與 GitHub 自動連結避免狀態重複輸入：合併即改為完成 | 官方 | 見第三節 | 工程端在提交中放議題編號 | 靠工程師遵守寫法 |
| Linear Method 的專案負責人、短規格；Shape Up 的不留待辦 | 見票 13 | 見 `13-pm-delivery-workflow.md` 第二節 | — | 見票 13 |

「同一件事不記兩處」的明文準則：本次只找到 Astronomer 的「Markdown 放 git」原則與 Linear 的自動連結，沒有找到專談一人產品經理防重複記錄的第一手準則。

## 七、對照 Miles 的五個痛點

| 痛點 | 查到的對應做法 | 需要的前提 |
|------|---------------|-----------|
| 1. wiki、原型、工程實作三者資料完全對不齊 | (a) 以 OpenAPI 檔為共同契約，由它產生型別、Zod 結構、MSW 假資料處理器（Evil Martians）。(b) Prism 讀 OpenAPI 啟動假伺服器，並可作驗證代理比對真實 API。(c) 規格、文件與程式碼同庫（票 13）。(d) Pact：契約由測試產生 | (a) 後端要發布並維持準確的 OpenAPI 檔；(b) 驗證代理要能連到真實後端；(d) 前後端程式庫都要有 Pact 測試。三項都需要工程團隊配合；產品經理單方只能做出自己這邊的 OpenAPI 檔與假伺服器，無法保證與後端一致 |
| 2. 工程最常問介面操作規則：欄位防呆不一樣、原型資料與後端資料不同 | (a) OpenAPI 結構已含型別與限制，Evil Martians 的做法由它產生 Zod 結構，表單規則取自契約；(b) 欄位規格表（資料字典）給人讀；(c) Zod 單一結構同時驗證並提供型別（官方頁；前後端共用做法未明說）；(d) 假資料處理器使用產生的型別 | OpenAPI 與 Zod 兩條路徑都要前後端用同一語言工具鏈，或後端發布 OpenAPI；Evil Martians 自述假資料行為仍需手寫。欄位規格表沒有找到權威範本，且不能自動檢查 |
| 3. 工程提交進不了規劃釐清流程，不知道工程做了什麼 | (a) Linear 與 GitHub 官方整合：提交與合併請求自動連回議題並改狀態；(b) Claude Code 的 GitHub Action：排程產生「昨日提交與開啟議題」摘要，或在合併請求留言；(c) Mintlify、gh-aw：合併請求合併後由代理開文件更新合併請求；(d) 產品經理自己提小修改的做法（Astronomer、Lenny 階梯） | (a) 工程師在分支名、提交訊息、合併請求放議題編號；(b) 需要程式庫管理員安裝 GitHub 應用程式與機密變數（官方文件）；(c) Mintlify 為企業版方案且針對 Mintlify 文件站，gh-aw 為預覽版，是否能更新 Miles 的 wiki 未查證；所有「代理開合併請求」的做法仍需有人審查，才不會讓錯誤內容進正本 |
| 4. Linear 上的規格是從 wiki 與原型重寫的，本身是另一份會對不齊的東西 | (a) Linear Method 與 GitLab：連結而非複寫（票 13）；(b) Dennis Yang：由 PRD 檔單向產生 Jira 票（二手）；(c) Gusto：不設看板，合併請求即提案（行銷）；(d) Linear 文件掛在專案與議題上（票 13） | (a) 唯一正本要有明確位置並可被連結；(b) 二手來源，產生後是否回寫未載；(c) 小團隊與資深人員，不一定適用；無任何來源直接回答「議題內容與 wiki 如何自動同步」，該題未查證 |
| 5. 只認得商業層情境，不知測試顆粒度；全套測試一跑半天 | (a) Gherkin 的 Feature、Rule、Example 分層，Example 即可執行測試；(b) Fowler：端對端測試減到最少，每個測試放到盡可能低的層；(c) Playwright：`--grep` 篩子集、`--only-changed` 依 git 改動挑測試檔、`--shard` 與 `--workers` 提高平行度；(d) 依改動挑測試（Fowler）；(e) 隔離測試、模擬外部相依、只裝需要的瀏覽器（Playwright 官方） | (c) `--only-changed` 需測試檔與被測程式在同一 git 程式庫，且只看測試檔是否改動；(a) 要有人把情境對映成 Rule 與 Example 的階層；(b) 金字塔低層的測試要先存在；分片需多台機器或多核心。測試為什麼慢，官方沒有診斷清單，需另行量測 |

## 八、未查證與存疑

未查證（共 19 項）：

1. Cat Wu 在 Lenny's Podcast 的完整內容：抓回頁面在介紹後即付費牆，逐字稿與要點未取得。
2. Sachin Rekhi 〈Claude Code for Product Managers〉：付費牆，只有搜尋摘要。
3. Aakash Gupta 的相關文章（含〈How to Ship Your First Pull Request as a PM〉）：付費牆，只有預覽摘要，且該文「8.5 週」說法未核。
4. Colin Matthews：沒有找到他本人的第一手描述，只知道他在 Lenny 的課程中擔任講師（搜尋結果）。
5. Peter Yang 的工程交接與文件存放處：付費牆，可見內容未載。
6. Marty Cagan「prototype as spec」與補充文件的說法：只見二手轉述；SVPG 的 FAQ 頁與〈AI Product Management 2 Years In〉均未載原型或工程交接。
7. Linear 編碼工作階段官方文件：頁面抓取 404，內容僅見搜尋結果摘要。
8. Linear 談「代理與議題」的官方專文：沒有找到專文，只有編碼工作階段與整合清單的搜尋結果。
9. Gojko Adzic 自己寫的「能力、規則、範例」階層：沒有找到；本檔改引 Cucumber 官方 Gherkin 參考（Feature、Rule、Example）。*Writing Great Specifications* 的「Abilities and Business Needs」只見搜尋摘要，且是另一本書。
10. Pact 與 OpenAPI 的官方比較：Pact 比較頁沒有談 OpenAPI；也沒找到 OpenAPI 側的官方說法。
11. Playwright 官方「套件變慢的常見原因」清單：官方只給隔離、模擬、分片等做法；歸納原因的第三方部落格（如 Currents、Bug0、TestDino）未抓取。
12. Playwright 冒煙測試子集的官方專用文件：只確認 `--grep` 旗標，未抓取標籤與註記文件。
13. Prism 官方文件的動態回應旗標（`--dynamic`）與維護狀態：僅見搜尋結果。
14. 產品經理端欄位規格表的權威範本：只找到廠商範本（Docsie、Playcode），均未抓原頁。
15. Dennis Yang 逐字稿：只取得 Lenny 週報節目簡介與搜尋摘要，簡介本身稱推論成分多。
16. Linear 與 GitHub 官方整合頁的逐字：抓回為小模型摘要，且夾帶寫給 AI 代理的文字；關鍵字、狀態名稱以外的描述未逐字核對。
17. Mintlify 的「合併請求不審查直接合併」模式：僅見搜尋摘要，抓回頁面對是否由人審查「未明說」，只轉述審查者預設為程式變更的作者。
18. Linear 的程式碼存取開關（需開啟才能看差異內容）：僅見搜尋摘要，未抓原頁。
19. 產品經理「讀程式庫、提交、合併請求以了解現況」的第一手：只找到 Astronomer 一例，且該例讀的是自己的筆記庫，而非工程團隊的程式庫。

存疑：
- Anthropic 的兩篇文章是廠商談自家團隊，且 Claude Code 團隊本身是工程導向，不宜推及一般企業 ERP 的產品經理。
- Gusto 案例來自 ChatPRD 的節目系列，含贊助與行動呼籲；效率數據未獨立驗證。
- Lenny 週報槓桿階梯文章的作者署名與付費牆內容未確認。
- Evil Martians 文章是整個系列的其中一篇；後端側做法在第四部，未讀。
- 抓取工具提供的是小模型摘要；本檔引句限於摘要中以引號標出的片段，已避免引用摘要的轉述。
