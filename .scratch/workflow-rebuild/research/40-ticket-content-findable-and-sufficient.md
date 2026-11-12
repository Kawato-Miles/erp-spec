# 票 40：票與規格怎麼寫，單看一個來源也足夠、AI 也找得到

調研日期：2026-11-12。本檔只列出處與原文句，不替 Miles 選擇，不推測。
查證方式：網頁以腳本下載後轉成純文字，再讀取相關章節；引句取自這份純文字，逐字照抄，不是搜尋摘要。PDF 以 `pdftotext` 轉文字後讀取。
「全文」表示整頁正文讀完；「部分」表示只讀與本題相關的章節；「只有摘要」表示只有搜尋結果的摘要，沒讀到原文。
票 13、18、30 已查到的內容（GitLab、Adzic、Cagan 2006 單一主表徵、Linear 文件頁、Barden、aihero 等）不重做，只在第六節的對照中以「票 13／18／30 已查」指回。
用詞：「正本」即唯一權威版本；「沿用的規則」指票所依據、但規則本身寫在別處（本專案是 wiki 卡）的業務規則。

## 一、來源清單

| 編號 | 網址 | 作者或機構 | 讀取程度 |
|------|------|-----------|---------|
| S1 | https://linear.app/docs/parent-and-sub-issues | Linear（官方文件） | 全文 |
| S2 | https://linear.app/docs/project-documents | Linear（官方文件） | 全文 |
| S3 | https://linear.app/docs/projects | Linear（官方文件） | 部分（概覽、文件、連結段） |
| S4 | https://linear.app/docs/search | Linear（官方文件） | 全文 |
| S5 | https://linear.app/docs/issue-templates | Linear（官方文件） | 全文 |
| S6 | https://linear.app/method/write-issues-not-user-stories | Linear Method（官方） | 全文 |
| S7 | https://linear.app/method/introduction | Linear Method（官方） | 部分（規格與議題段） |
| S8 | https://linear.app/docs/coding-sessions | Linear（官方文件，雲端編碼代理） | 部分（概覽、指引、寫有效議題段；環境設定與計費段略讀） |
| S9 | https://linear.app/docs/linear-agent | Linear（官方文件） | 部分（概覽至指引段，其後被截斷） |
| S10 | https://linear.app/developers/agent-interaction | Linear Developers（官方） | 部分（細讀提示詞（promptContext）段；其餘段落只用關鍵字檢索） |
| S11 | https://linear.app/docs/mcp | Linear（官方文件，MCP 伺服器） | 部分（設定段與範例提示詞段） |
| S12 | https://linear.app/now/coding-sessions-for-linear-agent | Linear（官方部落格） | 部分（以關鍵字讀取相關段落） |
| S13 | https://linear.app/docs/issue-relations（實際回傳「Issue properties」目錄頁） | Linear（官方文件） | 只有目錄一行：關聯頁內文未取得 |
| S14 | https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/best-practices-for-using-copilot-to-work-on-tasks | GitHub（官方文件） | 部分（議題範圍、任務選擇、自訂指示檔段） |
| S15 | https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues | GitHub（官方文件） | 部分（至「Efficient communication」） |
| S16 | https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues | GitHub（官方文件） | 全文 |
| S17 | https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies | GitHub（官方文件） | 全文 |
| S18 | https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/using-artifacts-with-issues | GitHub（官方文件，公開預覽功能） | 全文 |
| S19 | https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls | GitHub（官方文件） | 部分（議題與提取請求參照段） |
| S20 | https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/planning-and-tracking-work-for-your-team-or-project | GitHub（官方文件） | 部分（拆工作段） |
| S21 | https://www.atlassian.com/software/jira/guides/agentic-engineering/context-engineering | Atlassian（官方指南，Jira 產品頁） | 全文（結尾常見問題段後半未讀） |
| S22 | https://www.atlassian.com/blog/development/rovo-dev-in-jira-as-my-spec-driven-executor | Atlassian 部落格（Inside Atlassian，2026-05-13；頁面文字未署作者名） | 部分（工作流程段） |
| S23 | https://www.atlassian.com/agile/product-management/requirements | Dan Radigan，Atlassian（Agile Coach） | 部分（PRD 應含內容與效益段） |
| S24 | https://www.atlassian.com/agile/project-management/definition-of-ready | Atlassian（Agile Coach） | 部分（定義與 INVEST 段） |
| S25 | https://www.atlassian.com/agile/project-management/epics-stories-themes | Atlassian（Agile Coach） | 部分（定義段） |
| S26 | https://www.atlassian.com/agile/project-management/user-stories | Atlassian（Agile Coach） | 部分（三個 C 段） |
| S27 | https://support.atlassian.com/jira-software-cloud/docs/link-issues/ | Atlassian（官方文件） | 部分（連結類型段） |
| S28 | https://www.nasa.gov/wp-content/uploads/2023/08/nasa-work-breakdown-structure-handbook.pdf | NASA，《NASA Work Breakdown Structure (WBS) Handbook》NASA/SP-20210023927，2021-11 | 部分（3.3.3、3.3.4、3.4.4 三節；全書 2163 行未全讀） |
| S29 | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Anthropic（工程部落格） | 部分（系統提示詞與即時取得（just in time）情境段） |
| S30 | https://code.claude.com/docs/en/best-practices | Anthropic（Claude Code 官方文件） | 部分（告訴 Claude 它看不到的事、CLAUDE.md、技能段） |
| S31 | https://www.svpg.com/revisiting-the-product-spec/ | Marty Cagan（SVPG，2006） | 全文 |
| S32 | https://www.svpg.com/the-end-of-requirements/ 與 https://www.svpg.com/requirements-are-not/ | Marty Cagan（SVPG） | 全文（兩篇都短） |
| S33 | https://www.lennysnewsletter.com/p/my-favorite-templates-issue-37 | Lenny Rachitsky | 全文，但只是範本名稱與連結清單，沒有範本內容 |

沒讀到的來源（原因照實記錄）：

| 來源 | 狀況 |
|------|------|
| PMI 官方網頁（pmi.org 的 WBS 部落格、WBS 圖書館文章、《Practice Standard for Work Breakdown Structures》頁） | 抓取回 HTTP 403，拒絕自動讀取；已停止，沒有改用其他方式繞過。PMI 標準本文為付費。第六節「專案管理」只能引用 NASA 手冊，不能代表 PMI。只有搜尋摘要提到 PMI 把 WBS 字典描述為消除工作包歧義的細節、100% 規則，沒有原文句可引 |
| IIBA BABOK 與 IIBA 商業分析標準網站（4.4、5.1 任務卡） | 頁面跳轉到登入頁（HTTP 302）、任務卡 PDF 回 HTTP 401；需 IIBA 帳號，未登入、未讀。只有搜尋摘要稱 BABOK v3 的 5.1 為追溯需求、5.2 為維護需求（含重用），沒有原文句可引 |
| IREB《CPRE Foundation Level Handbook》 | 下載連結回傳的是網頁而不是 PDF，沒取得本文 |
| Lenny Rachitsky〈Examples and templates of 1-Pagers and PRDs〉（2021-08-31） | 付費牆，只讀到標題與開頭，範本內容未讀 |
| Lenny 清單所連的各家 PRD 範本（Figma、Product Hunt、Intercom 等） | 未逐一抓取 |
| Linear 議題關聯（Issue relations）官方頁內文 | 網址回傳的是「Issue properties」目錄頁，只得到一行說明（見 S13）；票 30 同樣記載 404 |

## 二、專案管理：WBS、工作包、WBS 字典、需求追溯（以 NASA 手冊為主，PMI 未取得）

| 做法 | 出處與原文句 | 說明 |
|------|-------------|------|
| WBS 字典定義每個元素的內容，目的是不漏、不重 | S28 §3.4.4。"A WBS dictionary lists and defines the WBS element contents." 接著："...to eliminate duplication and overlap of work assignments." | 字典的用途是確保工作範圍都已列出、工作分派不重疊 |
| 越低層，描述越細 | S28 §3.4.4。"The lower the level of a WBS element, the greater the level of descriptive detail needed." | 上層寫得粗，最底層（工作包附近）寫得最細 |
| 底層元素的內容必須寫明技術內容與需求 | S28 §3.3.4。"the technical content and requirements for each work product must be clearly specified and documented." | 到了指派責任的那一層，工作內容與需求要明確成文 |
| 字典寫到「能連到詳細文件」即可 | S28 §3.4.4。"The WBS dictionary element content descriptions should be clear enough to assist in providing a link to the detailed technical documents." | 字典不是複寫詳細技術文件，而是清楚到能連過去 |
| 字典條目含「相關規格的編號與名稱」欄 | S28 §3.4.4 元素定義清單。"Specification (number and title) associated with the WBS element (if applicable)" | 每個元素記下它依據的規格文件，用編號加名稱指過去 |
| 字典是受控文件，改動要核准 | S28 §3.4.4。"A WBS dictionary ... should be a controlled document, and as such, should be maintained as a baseline document with revisions being reviewed and approved" | 字典本身有版本控管與變更審查 |
| 工作只拆到夠管理就停 | S28 §3.3.4。"Each product branch within the WBS only needs to be subdivided as far as needed to allow for adequate management, insight, and control." | 沒有統一的最小粒度；停在能管理、能掌握進度的層級 |
| 工作包是控制帳之下的細項 | S28 §3.3.4。"A WP provides further detail on work content that is considered near-term, while a PP defines far-term work at a summary level." | 近期工作寫到工作包的細度，遠期只寫摘要（規劃包） |
| 需求對照矩陣：需求與 WBS 元素互相對得上 | S28 §3.3.3。"A look across the matrix from the WBS element perspective can quickly identify elements with no corresponding requirement." | 從 WBS 元素往需求看，找出沒有需求依據的工作 |
| 同一矩陣反向檢查 | S28 §3.3.3。"A look across the matrix from the requirements document or documents perspective will indicate any areas where work scope has not been included in the WBS." | 從需求往 WBS 看，找出沒被任何工作涵蓋的需求 |
| WBS 與需求文件必須對得上 | S28 §3.3.3。"correlation must exist between WBS content definition and all referenced requirement and specification documents." | 追溯的方向是 WBS 內容指向被引用的需求與規格文件 |

來源未載：WBS 字典條目要不要把規格內容抄進字典。手冊只說字典要清楚到「能連到」詳細文件，沒有明說「禁止抄」。

## 三、商業分析：需求追溯、重用、分層（BABOK 未取得）

| 項目 | 狀況 |
|------|------|
| BABOK 5.1 追溯需求、5.2 維護需求（含重用） | 未讀到原文（需 IIBA 登入）。本節沒有可引的一手原文句 |
| ISO/IEC/IEEE 29148 的上下向追溯與追溯矩陣 | 票 13 第三節已查（試閱頁 14 頁）；本次沒有重讀，不重複列 |
| 以其他一手來源補位 | 第二節 NASA 手冊的需求對照矩陣是「需求與工作項對得上」的一手做法；第四節 Cagan 談規格作為單一主表徵與多類讀者 |

## 四、產品管理與議題工具

### 4.1 規格、父子議題與任務票各層寫到多細

| 做法 | 出處與原文句 | 說明 |
|------|-------------|------|
| 產品層細節放專案，不放任務票 | S6。"One reason user stories are complicated and difficult to scope is because they bring what should be product-level details into the task level." | Linear 認為把產品層細節帶進任務層，是用戶故事難寫難估的原因 |
| 產品經驗在產品層討論，任務層不重述 | S6。"They’ll understand the user experience intuitively, so you don’t need to clarify it at the task level." | 前提是專案團隊已深度參與規格討論 |
| 任務票的最低標準 | S6。"It needs to be clear enough so that the assignee can perform it and also give enough context so that teammates who need to know understand what work is being done." | 夠執行者做事，也夠相關隊友知道在做什麼 |
| 描述選填，只寫完成任務所需 | S6。"Descriptions should be optional–not required–and can include relevant thoughts or context as well as links to deeper discussions." | 描述裡放脈絡，更深的討論放連結 |
| 引用而不摘要；附連結 | S6。"Link to the customer conversation so that if more information is needed, it’s easy to get." | 原話與連結並用，需要時往下追 |
| 不是任務就不進議題追蹤 | S6。"If it’s not a task, then it doesn’t belong in the issue tracker." | 票 18 已列；此處補上完整上下文：不是任務的東西應放文件或對話 |
| 規格的內容 | S7。"The purpose of a spec is to briefly communicate the “why”, “what” and “how” of the project to the rest of the team." | 規格短，講為何、做什麼、怎麼做 |
| 子議題的用途 | S1。"Consider creating sub-issues when a set of work is too large to be a single issue but too small to be a project." | 票 18 已列；此頁另載子議題繼承規則見下一列 |
| 子議題繼承父議題的哪些屬性 | S1。"Sub-issues inherit the parent issue’s team, priority, and project." 與 "Labels are not inherited." | 繼承團隊、優先度、專案；標籤不繼承。頁面未說描述會繼承 |
| 專案概覽的組成 | S3。"Here, you’ll find a brief project summary, project properties, any associated documents and links, a detailed project description, and a list of project milestones." | 專案頁本身就掛文件與連結 |
| 專案文件可連到議題 | S3。"Documents use the same Markdown as issues and have similar editing capabilities including tagging others and linking to issues." | 專案文件與議題互相可引 |
| 大型工作以一張議題連到小議題 | S20。"You can use an issue to track progress on a large initiative or project, which is then linked to the smaller issues." | GitHub 的做法：大議題連小議題 |
| 子議題顯示與父議題的關係，可到八層 | S16。"Your sub-issues show their relationship to the parent issue allowing you to track your work across GitHub." 另 "You can add up to 100 sub-issues per parent issue and create up to eight levels of nested sub-issues." | 層數上限八層；頁面未規定每層該寫多細 |
| 以故事、史詩分層 | S25。"Epics are large bodies of work that can be broken down into a number of smaller tasks (called stories)." | 史詩大、故事小 |
| 故事的內容 | S26。"The 3 C’s of user stories are Card, Conversation, and Confirmation." 另 "Confirmation is the acceptance criteria that define when the story is complete." | 驗收條件屬於故事層；故事下再拆任務時放哪層，頁面未說 |

### 4.2 一條需求怎麼從上層追到下層、PRD 與票怎麼連

| 做法 | 出處與原文句 | 說明 |
|------|-------------|------|
| PRD 列出或連到故事 | S23（Dan Radigan）。"List or link to the user stories involved." | PRD 的故事段可以列出，也可以只連過去 |
| PRD 大量用連結 | S23。"We embed a lot of links within our product requirements documents." 並說明這樣能 "progressively disclose the information to the reader as needed." | 用連結讓讀者按需往下看 |
| PRD 作為一個史詩的入口頁 | S23。"The product requirements document becomes the “landing page” for everything related to the set of problems within a particular epic." | 一頁、一個入口 |
| 故事進 Jira 後，PRD 與工作項雙向連結並顯示狀態 | S23。"The two-way syncing between Confluence and Jira means we automatically get to see each work item's current status right from the requirements page." | 作者描述的是 Confluence 與 Jira 的整合功能 |
| 反模式：需求更新了開發不知道 | S23。"Designers and developers don't know when requirements have been updated" | Atlassian 列為要避免的反模式；頁面同列「需求從不更新」 |
| PRD 留給開發的空間 | S23。"They can focus on higher-level requirements and leave implementation details to the development team" | PRD 寫高階需求，實作細節交給開發 |
| 工作項連到規格、RFC、決策記錄 | S21。"Link the work item to related work items, the code, and the Confluence pages that hold the spec, the RFC, or the decision record." | Atlassian 針對 AI 代理的指南 |
| 工作項只收目標與驗收條件 | S21。"Put the goal in the description and the acceptance criteria in a checklist." | 描述放目標，驗收條件做成清單 |
| 就緒定義：工作項要自成一體 | S24（INVEST 的 Independent）。"Whatever backlog item you're working on must not depend on any other task. It must be self-contained." | 這裡的 independent 指不依賴其他任務；頁面沒有談是否可引用規則文件 |
| 就緒定義：成功條件可測 | S24。"Specify the success and completion criteria based on business and user needs." | 對應 INVEST 的 Testable |
| 一個作者的做法：任務同時是技術規劃 | S22（部落格，作者未署名於頁面文字）。"For me, a task was never just a business description of a unit of change; it was already a technical plan." | 單一工程師的個人流程，不是 Atlassian 的產品規定 |
| 工作項描述要寫出代碼庫位置 | S22。"Ensure you mention your repository in the description – just “Use {workspace}/{repository name} repository“ should suffice!" | 說明代理要在描述裡找得到倉庫 |
| 議題間關聯有哪些類型 | S27。"Work items can have the following link types:" 接著列出 blocks、relates to 等 | 關聯類型由 Jira 管理員可設定；頁面未說關聯是否會把被連議題的內容帶給實作者 |
| 阻擋關係 | S17。"Issue dependencies let you define issues that are blocked by, or blocking, other work." | GitHub 的阻擋關係；頁面談的是進度阻擋，不是規則引用 |
| 議題中提到另一議題會自動建立連結 | S15。"Mentioning an issue in another issue or pull request will create references between them" | 但 S19 註明："Autolinked references are not created in wikis or files in a repository." 即倉庫檔案與 wiki 不會自動連 |

來源未載：Linear 官方是否規定「議題描述要連到哪個規格」。S2、S3 只說可以掛文件與連結。

### 4.3 有具名作者的產品需求文件寫法

| 做法 | 出處與原文句 | 說明 |
|------|-------------|------|
| 規格要有單一主表徵 | S31（Cagan，2006）。"there needs to be a single master representation of the spec, to minimize confusion, ambiguity and versionitis." | 票 13、30 已列；此處補同頁的下一句主張，見下列 |
| 規格補充放 wiki 的理由是找得到 | S31。"The biggest reason is that everyone on the product team knows where to find the latest answers at any time, rather than having various random versions of documents floating around." | 理由是「知道去哪找最新答案」 |
| 規格有多類讀者 | S31。"there are several critical consumers of the spec – engineering, QA, customer service, marketing, site operations, sales" | 票 13 已列；規格的讀者不只開發 |
| 規格會改，要跟著最新決策 | S31。"the spec should change to reflect the very latest decisions." | 規格不是一次寫完 |
| 要求是限制條件 | S32（Cagan，The End Of Requirements）。"Most requirements are not actually requirements, and the rest are better thought of as constraints." 同篇："there is no question that every business has very real constraints." | Cagan 把需求多半視為限制條件，商業上的限制確實存在；他沒有談限制條件要寫在哪一層 |
| 產品需求文件範本清單 | S33（Lenny）。"Kevin Yien’s PRD template (PM at Square)—Love this whole template, particularly the “Non-Goals” section" | 只是清單，範本內容未讀，不能從這裡引任何寫法 |

## 五、給 AI 讀的票：官方怎麼建議

| 做法 | 出處與原文句 | 說明 |
|------|-------------|------|
| 把議題當成給代理的提示詞 | S14（GitHub）。"it's useful to think of the issue you assign to Copilot as a prompt." | 議題內容就是代理的起點 |
| 議題應含的三項 | S14。"A clear description of the problem to be solved or the work required." "Complete acceptance criteria on what a good solution looks like" "Directions about which files need to be changed." | 問題描述、完整驗收條件、要改的檔案方向 |
| 代理也能自己找檔案 | S14。"Even if you don't specify exact file paths in a task, the agent can often discover the right code on its own." | 檔案路徑可省；來源談的是程式碼，不是業務規則文件 |
| 涉及大量業務邏輯的任務由人自己做 | S14 列在「Issues that you may choose to work on yourself」下。"Tasks that involve substantial business logic" | GitHub 建議這類任務不交給代理；來源未說明業務邏輯寫在哪 |
| 倉庫層的指示放固定檔案 | S14。"By adding custom instructions to your repository, you can guide Copilot on how to understand your project and how to build, test and validate its changes." 檔案含 `/.github/copilot-instructions.md`、`**/AGENTS.md`、`/CLAUDE.md` | 通用規則放倉庫檔，不放每張議題 |
| 議題可附加持久的規劃、研究、連結 | S18（GitHub，公開預覽）。"Issue artifacts are named pieces of content attached to an issue. They provide a durable place to keep plans, research, decisions, prototypes, and reference material as context alongside your work." | 附加內容隨議題，有版本歷史 |
| 附加內容可為「具名連結」 | S18。"Link (link): A named link to content elsewhere, such as a discussion, prototype, or Slack or Teams thread." | 連結也算議題的附加內容 |
| 代理能讀這些附加內容 | S18。"Agents and developer tools can also use the built-in GitHub MCP server, the REST API, or GitHub CLI to read and manage artifacts." | 代理經 MCP、REST API 讀取 |
| 議題定義越清楚，代理越少探索 | S8（Linear）。"The more clearly an issue defines the desired outcome, scope, and constraints, the less time Linear spends exploring the codebase or inferring requirements." | 要寫目標、範圍、限制 |
| 範例：以名稱指向既有行為 | S8 的「well-scoped」範例。"Reuse the existing includeArchivedProjects filtering behavior used elsewhere in search rather than implementing archived project filtering independently." | 範例用既有旗標的名稱要求代理沿用，沒有把邏輯抄進票；同範例也寫 "Do not modify search ranking, pagination, or project search behavior." |
| 代理從議題已連結的脈絡開始 | S12（Linear 部落格）。"The coding session starts with the context already connected to the issue: the original request, customer signal, product decisions, related work, and discussion." | 官方稱「相關工作」也在脈絡裡；頁面未列具體哪些關聯類型 |
| 交給代理的提示詞含哪些內容 | S10（Linear 開發者文件）。"a formatted string containing the session’s relevant context, such as issue details, comments, and guidance." | 同頁範例含議題標題、描述、標籤、父議題標題與描述、專案名稱。以關鍵字檢索整頁，只有「儲存庫建議」段提到 linked issues，提示詞說明與範例未列關聯議題與文件 |
| 工作區層級的指引自動交給代理 | S10。"(Guidance refers to any instructions configured at the workspace, parent team, or team level—such as preferred repositories or task constraints.)" 另 S9："Use guidance to make outputs consistent with conventions in your workspace." | 通用慣例放指引，不放每張議題 |
| 指引可引用文件 | S2。"If you mention a document an agent guidance field, the agent can reference the instructions in that document before performing another action." | 指引欄可用 @ 提及文件，代理可參照；議題描述也可用 @ 提及文件（S2："Reference documents in issue descriptions, comments, agent guidance fields and even in other documents"） |
| Linear 的 AI 工作的資料範圍 | S9。"Linear Agent works with your existing workspace data, including teams and sub-teams, initiatives and projects (with milestones and cycles), issues and their relationships, comments, activity history, and documents." | 這是 Linear 自己的代理；列出「議題與其關聯」「文件」 |
| MCP 範例提示詞：從議題描述與連結脈絡出發 | S11 範例提示詞。"Start from the referenced issue, use its description and any linked context as the starting point" | 這是官方範例提示詞，不是對議題寫法的規定 |
| 議題搜尋涵蓋標題、描述、留言 | S4。"Search looks for issues and documents across the full workspaces and matches the issue ID or terms in the title, description, or comments." | 規則名若寫在描述裡，工作區搜尋找得到；同頁「快速搜尋」"will only search by title (not description or comments)" |
| 給代理的議題當作規格寫 | S21（Atlassian）。"Write the Jira work item as the spec, with acceptance criteria the agent is judged against." | 同 4.2 |
| 連結，不要貼上 | S21 小節標題。"Shared context: link the work, don't paste it" 與步驟 "Let the agent inherit context instead of pasting it." | Atlassian 官方的明確主張；同頁理由見下一列 |
| 低訊號脈絡包含重複內容 | S21。"Low-signal context is the stale, off-topic, or duplicated content the model still has to read" | 重複內容被列為低訊號脈絡 |
| 代理從議題及其連結脈絡起跑 | S21。"It starts from the work item and its linked context, not the whole codebase." 另 "The agent inherits the context around the task, not just the ticket text." | 此頁的前提是 Atlassian 的 Teamwork Graph 會把連結的頁面帶進脈絡，屬產品功能；用別的工具不一定成立 |
| 把標準連到共用頁面 | S21。"Point to a shared standard. Link the convention it should follow to a Confluence page so the next agent and teammate use the same source." | 標準寫一處，各處連 |
| 代理用輕量識別符動態載入 | S29（Anthropic）。"maintain lightweight identifiers (file paths, stored queries, web links, etc.) and use these references to dynamically load data into context at runtime using tools." | 這是代理設計的原則；Claude Code 以此取得資料 |
| 即時取得的代價 | S29。"runtime exploration is slower than retrieving pre-computed data." 與 "Without proper guidance, an agent can waste context by misusing tools, chasing dead-ends, or failing to identify key information." | 引用要有人（或指引）告訴代理去哪找 |
| 最小資訊不等於短 | S29。"(Note that minimal does not necessarily mean short; you still need to give the agent sufficient information up front" | 句子後半被截，完整句為「還是要在一開始給代理足夠的資訊」 |
| 只寫代理看不到的 | S30（Claude Code 文件）。"Only write down what Claude can’t find by reading the repo, or what it would otherwise spend time rediscovering every session." | 該頁列出代理看不到的例子，第一項是 "A decision your team made in a meeting" |
| 具體提示詞要寫出完成的樣子 | S30。"If you name the file, describe the symptom, and say what “fixed” looks like up front, you usually save yourself a round of corrections later." | 給代理的任務要說明「完成」是什麼 |
| 手邊有東西就交給代理，不要描述 | S30。"If you already have the thing Claude needs, hand it over instead of describing it:" 下一列 "A file: type @ and the path to include the file contents in your message." | 檔案可直接用 @ 帶進來；這是在代理的工作階段，不是在議題追蹤工具 |
| 長程序放技能，按需讀取 | S30。"For a skill Claude can start on its own, it sees the name and description in every session, but only reads the full file when the task calls for it." | 名稱與說明常駐，全文按需讀；對應「寫規則名、內文放別處」的做法，但來源談的是技能檔，不是票 |

來源未載：Linear、GitHub、Atlassian 官方文件都沒有明說「議題只寫規則名、不寫規則內容」是否足夠；GitHub 的 S14 沒有談議題與業務規則文件的關係。

## 六、對照：四種寫法各有哪些來源支持或反對

四種寫法的定義：

- 甲：任務票完全不寫沿用的規則。
- 乙：寫一句規則名（只有名稱，沒有連結、沒有內容）。
- 丙：用關聯或連結指過去（議題關聯、議題內的連結、附加內容、@ 提及文件）。
- 丁：把規則內容抄進票。

格內「S 數字」對應第一節來源；「票 13／18／30」表示該句在先前調研檔已查，本次未重讀。「來源未談」表示這個格子的問題，找到的來源沒有討論。

### 6.1 單看票夠不夠做事

| 寫法 | 來源的說法 |
|------|-----------|
| 甲 不寫 | 支持：S6 稱產品層細節不該帶進任務層（"so you don’t need to clarify it at the task level."），前提是團隊已深度參與規格討論。反對：S30 稱代理只能靠自己找得到的內容，要寫的是它找不到的（"Only write down what Claude can’t find by reading the repo"）；S14 把涉及大量業務邏輯的任務列為不建議交代理。兩個反對來源談的是程式倉庫內的資訊，沒有談業務規則文件 |
| 乙 規則名 | 支持：S8 的範例以既有旗標名稱要求代理沿用（來源談的是程式碼內的既有行為）；S30 的技能機制是名稱與說明常駐、內文按需讀。反對：S29 稱即時取得需要有人讓代理知道去哪找（"Without proper guidance, an agent can waste context..."）。來源未談：規則名本身不附連結時，單看票夠不夠 |
| 丙 關聯或連結 | 支持：S21 稱代理從議題及其連結脈絡開始；S12 稱 Linear 代理的脈絡含相關工作；S23 稱 PRD 以連結「漸進揭露」。限制：S21 的前提是 Atlassian 的 Teamwork Graph 把連結頁帶進脈絡；S10 的提示詞範例未列出關聯議題與文件；S13 的關聯頁內文未取得，S27、S17 只說明關聯類型與進度阻擋，沒說被連議題的內容會不會交給實作者 |
| 丁 抄進票 | 支持：S22 的作者習慣把任務寫成技術規劃，能隔數週仍接得上；S24 的 INVEST 要求項目自成一體（"It must be self-contained."），但那句談的是不依賴其他任務；S14 要求議題含完整驗收條件。反對：S21 的「連結，不要貼上」；S6 要求描述只寫完成任務所需（"Write only as much as you need to share..."） |

### 6.2 AI 找不找得到

| 寫法 | 來源的說法 |
|------|-----------|
| 甲 不寫 | 來源未談 |
| 乙 規則名 | S4：工作區搜尋比對標題、描述、留言，描述中的規則名搜尋找得到；快速搜尋只比對標題。S30：技能的名稱與說明每次工作階段都在，全文需要時才讀。來源未談：議題裡的規則名是否會被代理主動拿去查 |
| 丙 關聯或連結 | S11 的範例提示詞以描述與「連結脈絡」為起點；S9 稱 Linear 代理處理議題及其關聯、文件；S18 稱 GitHub 代理可經 MCP、REST API 讀取議題附加內容；S2 稱指引欄與議題描述可 @ 提及文件，代理可參照指引提及的文件。反對／限制：S19 稱倉庫檔案與 wiki 不產生自動連結；S10 的提示詞範例未列關聯議題與文件；S29 稱即時取得速度較慢，需要引導 |
| 丁 抄進票 | S4 搜尋範圍涵蓋描述，內容本身就在描述中；S10 稱提示詞含議題詳情；S8 稱代理從議題開始工作。來源未談：抄進票是否讓代理更容易找到相關規則的其他出處 |

### 6.3 內容會不會分歧

| 寫法 | 來源的說法 |
|------|-----------|
| 甲 不寫 | 來源未談 |
| 乙 規則名 | 來源未談規則名重命名後票上的舊名會怎樣。S28 的 WBS 字典用「規格編號加名稱」記錄依據，字典為受控文件，改動需核准（"should be maintained as a baseline document with revisions being reviewed and approved"） |
| 丙 關聯或連結 | S23 稱 Confluence 與 Jira 雙向連結會顯示工作項現況；其反模式清單列「開發不知道需求更新了」（"Designers and developers don't know when requirements have been updated"）；S31 稱單一主表徵與集中放置讓團隊知道去哪找最新答案；S2 稱文件有版本歷史、S18 稱附加內容有版本歷史。限制：以上都只記錄變更，沒說連結端如何得知被連內容已改，票 13 同樣註明未載如何防止分歧 |
| 丁 抄進票 | 反對：S21 把重複內容歸為低訊號脈絡；S28 稱字典用來「消除重複與重疊」；票 13 已查 Cagan 2006（單一主表徵）、Adzic（複製貼上與交叉連結造成麻煩，已更正為轉述 Nagy）、GitLab（議題描述為正本）。支持：S22 作者的個人做法是任務即技術規劃，頁面沒談規格改動後怎麼同步 |

### 6.4 各層文件分工（來源各自的說法，供對照；不列成建議）

| 層 | 來源的說法 |
|------|-----------|
| 需求文件（PRD、規格） | S23：PRD 是史詩的入口頁，列出或連到故事，高階需求寫在這，實作細節留給開發。S7：規格短，講為何、做什麼、怎麼做。S31：規格有多類讀者，要集中、可更新 |
| 工作分解（WBS、專案、史詩） | S28：越低層描述越細；字典寫到能連到詳細文件；只拆到夠管理為止。S3：專案頁掛文件與連結。S20：大議題連小議題 |
| 任務票 | S6：夠執行者做事，也讓相關隊友知道在做什麼；描述選填、只寫必要的。S14、S8：給代理的議題要有問題描述、驗收條件、範圍與限制。S21：目標加驗收條件，其餘連過去 |
| 上下追溯 | S28：需求對照矩陣，雙向檢查「無需求依據的工作」與「沒被涵蓋的需求」。S23：PRD 與工作項雙向連結。ISO 29148 的上下向追溯見票 13。BABOK 未取得 |

## 七、沒找到的

- PMI 的 WBS、工作包、WBS 字典、需求追溯矩陣原文：HTTP 403，只有搜尋摘要，無引句。
- BABOK 對需求追溯、重用、分層的原文：需登入，無引句。
- Linear 議題關聯官方頁內文：只取得目錄頁一行。
- Lenny 的 PRD 範本內容：付費牆；範本連結清單未逐一讀取。
- Linear、GitHub、Atlassian 官方「議題只寫規則名是否足夠」或「議題裡引用別處規則要寫到什麼程度」：沒有任何一頁直接談。
- 業界「票內抄規則」「票內只寫規則名」「票內連到規則」三者的分歧率、漏讀率數據：沒找到。
- 依票 40「完成的樣子」第二項的實測設計（兩種寫法各寫一張票給受測代理）：本次任務只做調研，未設計。
