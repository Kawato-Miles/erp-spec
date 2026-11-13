# 票 43 調研：代理回報給決策者的圖解與溝通做法

調研日期：2026-11-13。角色：只蒐集與摘錄，不給設計建議，不排名。

## 主對話查證進度（2026-11-13）

本檔是子代理的初稿。主對話已讀完檔頭所列候選的全文（論文只讀摘要），結論在票 43 的 Answer。其餘來源只做引文比對。

- 已抓 23 份原始檔，逐句比對 101 句英文引文，85 句相符。
- 複查後確認存在、只是排版不同的有 4 句：sparklabx 的安裝提示句、Wikipedia 的 BLUF 定義句、Healey 的兩句。
- 來源沒抓、所以沒比對的有 10 句：sparklabx 的 `diagram-types.md` 與看圖自查句、plantuml 的 `from-source-code.md`、digital.gov、AHRQ 的標題、本機 pm-skills 三個描述句、技能清單的描述句、搜尋結果的一句。
- 抓了但找不到的有 2 句：Minto 官網的第二句、PubMed 那一句（頁面被擋，只抓到 130 位元組）。
- 採用前主對話要讀全文的候選：`discernment-nudge`、本機 `stakeholder-update`、`policy-memo`、`executive-briefing`、infrasity 的 `service-blueprint`、j-clegg 的 `METHODOLOGY.md`、NN/g 的服務藍圖文章、Buçinca 與 Bansal 兩篇的摘要。

## 範圍與限制

讀法標記：「全文」指檔案整份讀完；「部分」指只讀到所標示的範圍；「僅搜尋摘要」指只看到搜尋結果的描述，沒開檔。

| 項目 | 狀態 |
|------|------|
| 星數、最後推送日、授權 | 用 `gh api repos/<owner>/<repo>` 取得（2026-11-13）。授權欄為 null 者，表示 GitHub 未偵測到授權檔；SKILL.md 檔頭另有授權聲明者另註 |
| 圖解 skill：jgraph/drawio-mcp | SKILL.md 部分讀（第 1 至 275 行，加上「XML well-formedness」之後到結尾）。「匯出命令」到「XML format」之間的段落未讀。其引用的 `shared/xml-essentials.md`、`shared/mermaid-reference.md` 未讀 |
| 圖解 skill：sparklabx/drawio-ai-kit | `SKILL.md`、`references/bpmn.md`、`references/diagram-types.md`、`references/style-guide.md`、`workflows/` 三檔讀全文。`references/principles.md` 只讀前 60 行、`references/api.md` 只讀前 50 行。`docs/`、`src/`、`catalog/` 未讀 |
| 圖解 skill：Agents365-ai/365-skills plantuml-skill | SKILL.md 與 4 份 references 全文 |
| 圖解 skill：markdown-viewer/skills documd-visuals | `SKILL.md`、`goals/process-and-workflow.md`、`goals/software-behaviour.md` 全文。`engines/`、`examples/`、`styles/`、`catalog/` 未讀 |
| 服務藍圖 skill | infrasity-labs `service-blueprint` 全文；j-clegg `SKILL.md` 全文（`METHODOLOGY.md`、`SCHEMA.md`、`RENDERING.md` 未讀）；ghaida/intent `blueprint` 只讀前約 9000 字元（全檔 30252 位元組）加關鍵字搜尋 |
| 決策者溝通 skill | mohitagw15856 的 `policy-memo`、`executive-summary`、`compression-craft.md` 全文；anthropics/claude-agent-sdk-demos `executive-briefing` 全文；anthropics/skills `internal-comms` 的 SKILL.md 全文（`examples/` 未讀）；`discernment-nudge` 全文；menkesu `exec-comms` 部分（前 7000 字元加關鍵字搜尋） |
| 一手與權威來源 | 多數網站對自動抓取回 403。取得原文者標明；其餘標「未取得原文」。抓取工具回傳的引文未再人工對照網頁 |
| 本機 skill | 全文：`stakeholder-update`、`eli5`。部分：`design-critique`（前 90 行）。只讀描述：`customer-journey-map`、`storyboard`、`recommendation-canvas` |
| 未查到 | 專門講「用商業案例說明風險」的權威定義（只查到事前驗屍法 premortem 的部分原文）；Anthropic 官方 skills 程式庫內沒有圖解類 skill；`artifact-diagramming`、`dataviz`、`artifact-design` 在本機 `~/.claude` 下找不到 SKILL.md 檔 |
| 沒有執行任何來源檔案或指令 | 來源內沒有針對本調研代理的指示文字 |

## 問題 1：圖解類 skill

### 1.1 候選清單（至少 6 個）

| # | 候選 | 網址 | 星數 | 最後推送 | 授權 | 技術 | 涵蓋 | 讀法 |
|---|------|------|------|---------|------|------|------|------|
| 1 | jgraph/drawio-mcp（skill `drawio`） | https://github.com/jgraph/drawio-mcp | 5824 | 2026-11-11 | Apache-2.0 | Mermaid 或 draw.io XML，輸出 `.drawio`，可匯出 PNG/SVG/PDF | 流程圖、循序圖、類別圖、狀態圖、ER 圖等 | 部分 |
| 2 | sparklabx/drawio-ai-kit（skill `drawio`，含 BPMN） | https://github.com/sparklabx/drawio-ai-kit | 672 | 2026-10-12 | MIT | Node 腳本加排版引擎，輸出 `.drawio` | 雲端架構、BPMN 泳道 | 大部分 |
| 3 | Agents365-ai/365-skills（`plantuml-skill`） | https://github.com/Agents365-ai/365-skills | 100 | 2026-11-02 | API 回 null；SKILL.md 檔頭寫 MIT | PlantUML，經 Kroki API 轉 PNG/SVG | 循序、元件、類別、ER、活動、使用案例、狀態、C4 | 全文 |
| 4 | markdown-viewer/skills（`documd-visuals`） | https://github.com/markdown-viewer/skills | 3402 | 2026-10-05 | CC-BY-4.0 | Markdown 內的 `plantuml`、`vega`、`echarts`、`infographic` 區塊與 HTML | 流程、BPMN、類別、狀態、循序、C4、ER、ArchiMate 等 | SKILL.md 全文，子檔部分 |
| 5 | Agents365-ai/drawio-skill | https://github.com/Agents365-ai/drawio-skill | 10750 | 2026-11-10 | MIT | draw.io XML | 見其 `references/diagram-types.md`（未讀） | 未讀 |
| 6 | antoinebou12/uml-mcp（`.github/skills/` 下多個 skill） | https://github.com/antoinebou12/uml-mcp | 110 | 2026-11-13 | MIT | PlantUML、Mermaid，經 MCP 伺服器 | UML 類 | 僅列檔名 |
| 7 | tech-leads-club/agent-skills（`excalidraw-studio`、`mermaid-studio`） | https://github.com/tech-leads-club/agent-skills | 7163 | 2026-11-12 | NOASSERTION | Excalidraw、Mermaid | 流程圖、ER 圖 | 僅搜尋摘要 |
| 8 | github/awesome-copilot（`draw-io-diagram-generator`、`plantuml-ascii`） | https://github.com/github/awesome-copilot | 41104 | 2026-11-13 | MIT | draw.io、PlantUML | 見搜尋摘要 | 僅搜尋摘要 |
| 9 | a5c-ai/babysitter（`bpmn-generator`） | https://github.com/a5c-ai/babysitter | 1909 | 2026-11-01 | MIT | BPMN 2.0 | BPMN 建立、驗證、匯出 | 僅搜尋摘要 |
| 10 | melodic-software/claude-code-plugins（`process-modeling`、`plantuml-syntax`、`uml-modeling`） | https://github.com/melodic-software/claude-code-plugins | 30 | 2026-11-13 | MIT | 指引型，無產圖工具 | BPMN、流程圖、泳道 | 僅搜尋摘要 |
| 11 | imxv/Pretty-mermaid-skills | https://github.com/imxv/Pretty-mermaid-skills | 1576 | 未查 | 未查 | Mermaid，輸出 SVG 或終端 ASCII | 6 種圖 | 僅搜尋摘要（星數來自 `gh search repos`） |
| 12 | WH-2099/mermaid-skill | https://github.com/WH-2099/mermaid-skill | 300 | 未查 | 未查 | Mermaid | 所有 Mermaid 圖種 | 僅搜尋摘要（星數來自 `gh search repos`） |

Anthropic 官方 skills 程式庫（https://github.com/anthropics/skills，193845 星，最後推送 2026-11-06，授權欄 null）的 `skills/` 目錄只有這些：`academy-guide`、`algorithmic-art`、`brand-guidelines`、`canvas-design`、`claude-api`、`discernment-nudge`、`doc-coauthoring`、`docx`、`frontend-design`、`internal-comms`、`mcp-builder`、`pdf`、`pptx`、`skill-creator`、`slack-gif-creator`、`theme-factory`、`web-artifacts-builder`、`webapp-testing`、`xlsx`。沒有圖解專用 skill（`canvas-design`、`web-artifacts-builder` 未讀）。

### 1.2 服務藍圖專用 skill（獨立列出，因為上列多數沒有服務藍圖）

| 候選 | 網址 | 星數 | 最後推送 | 授權 | 產出形式 | 讀法 |
|------|------|------|---------|------|---------|------|
| infrasity-labs/dev-gtm-claude-skills `service-blueprint` | https://github.com/infrasity-labs/dev-gtm-claude-skills | 165 | 2026-06-28 | MIT | 文字（無圖檔產出工具） | 全文 |
| j-clegg/service-blueprint-skill | https://github.com/j-clegg/service-blueprint-skill | 1 | 2026-01-22 | MIT | HTML 或 Mermaid | SKILL.md 全文，其餘檔未讀 |
| ghaida/intent `blueprint` | https://github.com/ghaida/intent | 256 | 2026-11-01 | CC0-1.0 | 自含 HTML，或 Figma、pencil（經 MCP） | 部分 |
| rampstackco/claude-skills `journey-mapping` | https://github.com/rampstackco/claude-skills | 1067 | 2026-11-08 | MIT | 範本檔 | 僅搜尋摘要 |
| prorise-cool `service-blueprinting` | https://github.com/prorise-cool/prorise-claude-skills | 24 | 2026-03-15 | null | 範本 | 僅搜尋摘要 |

### 1.3 讀完的 4 個圖解 skill

#### A. jgraph/drawio-mcp，`plugins/claude-code/skills/drawio/SKILL.md`（24452 位元組，部分讀）

- 做什麼：把圖寫成原生 `.drawio` 檔。原文：「Generate draw.io diagrams as native `.drawio` files. Author each diagram either as **Mermaid** (concise text that the draw.io desktop CLI converts and lays out for you) or as **draw.io XML** directly.」
- 圖種：Mermaid 欄列出「Flowcharts, sequence, class, state, ER, gantt, mindmap, timeline, user journey, quadrant, C4, git graph, pie, and other standard types」。檔內沒有出現服務藍圖、泳道、BPMN 字樣（只讀到的範圍內）。
- 技術與工具：需要 draw.io 桌面版命令列（Mermaid 轉檔、ELK 自動排版、匯出）。原文：「Prefer Mermaid when the desktop CLI is available and the request is one of the standard types above.」沒有桌面版時改用 XML。
- 指令與遠端抓取（原文記錄）：
  - 轉檔：`drawio -x -f xml -o diagram.drawio diagram.mmd`
  - 抓遠端參考檔：「fetch and follow the shared Mermaid reference ... https://raw.githubusercontent.com/jgraph/drawio-mcp/main/shared/mermaid-reference.md」
  - 查圖示：「`node <skill-folder>/scripts/find-shapes.js "aws4 lambda" "github" "slack"`」，該檔說明為「Node.js 18+, network」
  - 修復腳本：用 `node -e` 內嵌腳本改寫 `.drawio` 檔
  - 網址輸出：用 `node -e` 產生 `https://app.diagrams.net/#R...` 連結並用 `open "$URL"` 開啟
- 何時不用：「Exception: in a chat that shows diagrams inline (VS Code's or Cursor's own chat, Claude.ai, ChatGPT) where the draw.io MCP server's create_diagram tool is available, call that tool instead」
- 產出形式：`.drawio` 檔；可匯出 PNG、SVG、PDF（嵌入原始圖資料，仍可編輯）。
- 安裝（只記錄，搜尋結果所述，未對照 README）：`npx skills add jgraph/drawio-mcp --skill drawio --agent claude-code`。

#### B. sparklabx/drawio-ai-kit，`skills/drawio/`（部分讀，見範圍）

- 做什麼：用 Node 腳本宣告「什麼在什麼裡面」，由排版引擎算座標。原文：「You build the diagram by writing a small Node script that uses the `drawio-ai` engine. The engine places every box and routes every arrow. You only declare *what* is inside *what*.」
- 涵蓋：AWS、Azure、GCP、Databricks、多雲，以及「BPMN / swimlane」（讀 `references/bpmn.md`，範本 `build_bpmn.mjs`）。`diagram-types.md` 的圖種都是雲端架構類（pipeline、hierarchy、network、hubspoke、hybrid、mesh、sequence 為「Numbered request walkthrough over an architecture」）。沒有 UML 活動圖、狀態圖、使用案例圖。
- BPMN 規則（`references/bpmn.md` 原文）：「BPMN = a **business process**: "who does what, in what order, with what decisions?"」；驗證契約含「Sequence flow stays inside its pool. Crossing a pool boundary → error. Use message flow instead.」與「Gateways need ≥2 outgoing flows」；配色：「Colour carries BPMN semantics only (red = error/terminate).」
- 工具與指令（原文記錄）：
  - 先檢查：`command -v drawio-ai >/dev/null 2>&1 && drawio-ai root || echo "MISSING"`
  - 缺少時：「Tell the user to install it, then try again: `npm i -g drawio-ai-kit`」，並寫明「Never run `npm i -g` yourself.」
  - 建置：`drawio-ai search`、`drawio-ai scaffold`、`drawio-ai run`、`drawio-ai validate`、`drawio-ai render`（轉 PNG 需 draw.io 桌面版）
- 自我檢查：「Open the PNG from step 4 (the image read tool). List **every** problem you see in one pass」，上限 2 次看圖。
- 禁止：「Never hand-write draw.io XML or x/y coordinates.」
- 產出形式：`.drawio`（預設），PNG 於要求時產出。
- 安裝（搜尋結果所述）：`npx -y skills add sparklabx/drawio-ai-kit --skill drawio-bpmn --agent claude-code`。注意：儲存庫內路徑是 `skills/drawio`，搜尋結果寫的 `drawio-bpmn` 名稱未在已讀檔案中看到，未查證。搜尋結果另說掃描器標註「installs packages at runtime」。

#### C. Agents365-ai/365-skills，`plugins/plantuml/skills/plantuml-skill/`（全文）

- 做什麼：寫 `.puml`，經 Kroki API 轉 PNG/SVG。原文：「Generates .puml files and exports to PNG/SVG via Kroki API (no local install required).」
- 圖種表（原文）：Sequence、Component、Class、ER / Entity、Activity（「workflows, business processes」）、Use Case、State、C4 Context、Mind Map、Gantt。沒有泳道（swimlane）、BPMN、服務藍圖。
- 自動觸發：檔頭有 `disable-model-invocation: true`；內文列有主動觸發條件：「Explaining a system with 3+ interacting components」。
- 自我檢查：Step 5 要檢查 HTTP 狀態與檔案是否為圖片（「Never report success on a blind `curl`」）；Step 6 用視覺能力看圖，檢查表含「Label truncation / overrun」「Edge spaghetti」「Wrong diagram type」，上限 2 輪。
- 資料外送（原文）：「The default below (public Kroki) **uploads the `.puml` source to kroki.io** — for sensitive diagrams use a local backend instead, and never silently fall back.」`references/rendering-backends.md`：「The user should never have to guess whether their diagram crossed the network.」
- 指令（原文記錄）：`curl -s -w "%{http_code}" -o diagram.png -X POST https://kroki.io/plantuml/png -H "Content-Type: text/plain" --data-binary "@diagram.puml"`；本機替代：`docker run -d -p 8000:8000 yuzutech/kroki` 或 `java -jar plantuml.jar diagram.puml`
- 其他模式：從原始碼產圖（`references/from-source-code.md`：「read the code, don't guess」）、把 Markdown 內的 PlantUML 轉成圖片。
- 產出形式：`.puml` 加 PNG/SVG。
- 安裝（搜尋結果所述）：`npx skills add agents365-ai/365-skills --skill plantuml-skill`。

#### D. markdown-viewer/skills，`documd-visuals/SKILL.md`（13621 位元組，SKILL.md 全文）

- 做什麼：路由型 skill，依「讀者目標」挑引擎，圖寫成 Markdown 內的文字區塊，由檢視器即時繪製。原文：「**Figures are text, in place.** A fence (`plantuml` · `vega` · `echarts` · `infographic`) or bare HTML written into the Markdown *is* the figure」
- 圖種：流程與 BPMN（「process and workflow (approval, BPMN)」）、類別圖、狀態機、循序圖、C4、ER、ArchiMate。`goals/process-and-workflow.md` 的「Don't」：「A process with no decision points drawn as a list」「Swimlanes that mix roles and systems」。
- 決策文件類目標：`internal-documents`（memo、brief）、`comparison-and-selection`（decision record、trade-off）、`incident-management`，引擎為 html-css 與 infographic（目標檔未讀）。
- 規則（原文）：「Every figure answers one question — put it in the prose or the block's `title`.」「Not recommended: mermaid / canvas / drawio / dot.」
- 限制（原文）：「Interactive charts (tooltip, zoom, brush)」不可，改以標註取代。
- 需要的工具：要用其檢視器才會即時繪製（「install **docu.md Markdown Viewer**」）；匯出才需要 `npx @markdown-viewer/documd in.md out.docx`（Node 18+、Chrome）。
- 安裝：檔內沒有 skill 安裝指令；只有上述檢視器與 `npx @markdown-viewer/documd` 指令。

### 1.4 服務藍圖專用 skill 摘錄

**infrasity-labs `service-blueprint`（全文，4008 位元組）**
- 五層（原文）：「1. **Physical evidence** ... 2. **User actions** ... 3. **Frontstage actions** ... 4. **Backstage actions** ... 5. **Support processes**」。
- 三條線（原文）：「**Line of interaction**: separates user actions from frontstage」「**Line of visibility**: separates frontstage (visible to user) from backstage (invisible)」「**Line of internal interaction**: separates backstage from support processes」。
- 讀圖（原文）：「**Gaps between lanes**: where frontstage promises something backstage can't deliver」。
- 做法（原文）：「Keep scope narrow; a focused blueprint of one scenario is more useful than a sprawling map of everything」。
- 產出形式：沒有指定圖檔工具；僅方法說明。

**j-clegg/service-blueprint-skill `SKILL.md`（全文，2598 位元組）**
- 原文：「Generate professional service blueprints following established methodology from Nielsen Norman Group, UK Government Digital Service, and Practical Service Design.」
- 輸出：「HTML」或「Mermaid」。檢查表：「Structure: All 5 lanes, all 3 lines」「Analysis: Moments of truth (★) and failure points (!) marked」。
- 儲存庫尚有 `METHODOLOGY.md`、`SCHEMA.md`、`RENDERING.md`、`assets/style.css`、`examples/`，這些未讀。

**ghaida/intent `blueprint`（部分，前約 9000 字元）**
- 先問輸出形式。原文：「Would you like a visualization of this blueprint?」選項：「**HTML** (default)」「**Figma**」「**pencil**」「**No** — markdown only」。
- HTML 規則（原文）：「Write one self-contained HTML file ... No external CSS, no external fonts, no JS.」
- 橫向分層：Frontstage、Backstage、Support，並有 line of interaction、line of visibility 等虛線；檔內說明用透明度層級（frontstage 1.0、backstage 0.85、support 0.6）表達層次。後段另有「use Mermaid syntax where helpful」。
- 與 Figma 或 pencil 連線需要 MCP 伺服器。

## 問題 2：處理「對主管或決策者說明」的 skill

候選（至少 4 個）與讀法：

| # | 候選 | 網址或路徑 | 星數 | 最後推送 | 授權 | 讀法 |
|---|------|-----------|------|---------|------|------|
| 1 | mohitagw15856/pm-claude-skills：`policy-memo`、`executive-summary` | https://github.com/mohitagw15856/pm-claude-skills | 1545 | 2026-11-12 | MIT | 全文 |
| 2 | anthropics/claude-agent-sdk-demos：`executive-briefing` | https://github.com/anthropics/claude-agent-sdk-demos | 2808 | 2026-08-27 | null | 全文 |
| 3 | 本機 product-management 外掛：`stakeholder-update` | 本機路徑見問題 5 | 不適用 | 不適用 | 不適用 | 全文 |
| 4 | menkesu/awesome-pm-skills：`exec-comms` | https://github.com/menkesu/awesome-pm-skills | 460 | 2026-10-06 | NOASSERTION | 部分 |
| 5 | anthropics/skills：`internal-comms` | https://github.com/anthropics/skills | 193845 | 2026-11-06 | null（每個 skill 另附 LICENSE.txt） | SKILL.md 全文 |
| 6 | anthropics/skills：`discernment-nudge`（問題 4 也用到） | 同上 | 同上 | 同上 | 同上 | 全文 |

### 2.1 mohitagw15856 `policy-memo`（全文）

路徑：`plugins/pm-gov/skills/policy-memo/SKILL.md`（3598 位元組）。
- 結構（原文）：「**Bottom line (BLUF)** — 2–3 sentences: the issue, your recommended option, and the key reason. A busy reader should get the decision from this alone.」
- 選項（原文）：「2–4 realistic options (including status quo). For each: what it is, pros, cons, cost/feasibility, and who's affected.」
- 結尾（原文）：「**Next step / decision requested** — exactly what you're asking the reader to approve.」
- 反例（原文）：「Do not present a fake menu (one real option + straw men) — options must be genuine」「Do not hedge into non-recommendation — name a choice and own the trade-off」。
- 產出形式：文字備忘錄與比較表。無外部工具。

### 2.2 mohitagw15856 `executive-summary`（全文，含 `references/compression-craft.md`）

路徑：`plugins/pm-cross/skills/executive-summary/SKILL.md`（6131 位元組）、同目錄 `references/compression-craft.md`（2109 位元組）。`templates/summary-frame.md` 未讀。
- 核心原則（原文）：「An executive summary is NOT a summary of the document. It is a standalone document」。
- 輸入需求（原文）：「**Decision or action needed** (what should the reader do after reading?)」。
- 結構：Bottom line up front、Background、Key findings、Options considered（表）、Recommendation、Immediate next steps（含負責人與日期）、Risks of inaction。
- 評分表（原文）：「Score any output of this skill before handing it over; 32+ is ship-quality.」四個面向各 0 至 10 分。
- 壓縮要點（`compression-craft.md` 原文）：「Numbers with baselines — "churn to 4.1%" means nothing; "churn 3.2% → 4.1% since March" is a summary in itself」；「Write the ONE sentence you'd say if you met the exec in an elevator holding this doc」。
- 長度：技能說明「busy executives can read in under 3 minutes」。
- 產出形式：文字。

### 2.3 anthropics/claude-agent-sdk-demos `executive-briefing`（全文）

路徑：`research-agent/.claude/skills/executive-briefing/SKILL.md`（4114 位元組）。
- 原文：「Start with the conclusion. Executives are busy - lead with what matters.」
- 一頁格式分段：BOTTOM LINE、KEY FINDINGS、IMPLICATIONS、RECOMMENDED ACTIONS（行動、負責人、時程）、RISKS & CONSIDERATIONS。
- 信心標示（原文）：「Always indicate confidence level」，分 HIGH、MEDIUM、LOW。
- 做法（原文）：「Round numbers for readability (say "$2.3M" not "$2,347,892")」。
- 附錄（原文）：「create a separate appendix file」。
- 產出形式：文字（含框線字元的純文字版面）。

### 2.4 本機 `stakeholder-update`（全文，見問題 5）

### 2.5 其他讀到的部分

- menkesu `exec-comms`（部分）：描述寫「Draws on 296 insights from 90 Lenny's Podcast guests」。步驟 1 診斷最多問 4 題；Play A 第 2 步：「Tag the ask in the first line. Pick one: FYI, problem, request for help」；第 3 步：「Put the TLDR on top, Context under it.」；第 4 步：「State *my recommendation is X* first.」；第 7 步：「Convert bullet fragments to full sentences, which exposes unfinished thinking」；第 8 步：「Done when a stranger can state the point and the ask in one breath.」；反模式：「Burying the lead because you have not found it」。後段（Play B 以後、反模式全文）未全讀。
- anthropics/skills `internal-comms`（SKILL.md 全文，1511 位元組）：依溝通類型載入 `examples/` 下的指引檔，類型含「3P updates (Progress, Plans, Problems)」「Leadership updates」「Incident reports」。`examples/*.md` 未讀，不知其內文要求。

## 問題 3：成熟做法的一手或權威來源

| 主題 | 來源 | 取得狀態 | 原文句 |
|------|------|---------|--------|
| 服務藍圖標準結構 | Sarah Gibbons，Nielsen Norman Group，〈Service Blueprints: Definition〉，發表 2017-08-27，最後審閱 2026-07-15。https://www.nngroup.com/articles/service-blueprints-definition/ | 取得（抓取工具回傳引文） | 「a diagram that visualizes the relationships between different service components」；層：「Customer Actions」「Frontstage Actions」「Backstage Actions」「Processes」「Evidence」；線：「Line of interaction」「Line of visibility」「Line of internal interaction」。例句：Line of visibility「Separates all service activities that are visible to the customer from those that are not visible.」 |
| 服務藍圖（NN/g 與 skill 的差異） | 同上；對照 infrasity skill | 取得 | NN/g 把最後一層叫 Evidence，第二層以後叫 Processes；infrasity skill 把 Physical evidence 放第一層、第五層叫 Support processes。層名與順序在兩者不同 |
| 服務藍圖起源 | Shostack, G.L. (1984). 〈Designing Services That Deliver〉，Harvard Business Review | 只在 j-clegg skill 的參考文獻看到書目，未取得原文 | 無 |
| 結論先行（BLUF） | 美國陸軍規章 AR 25-50（Preparing and Managing Correspondence）。以 Wikipedia〈BLUF (communication)〉引用的 2013-05-17 版文字為準 | 規章 PDF 抓取失敗（403 或空白）；原文來自 Wikipedia 轉引，非一手 | 「Army writing will be concise, organized, and to the point. Two essential requirements include putting the main point at the beginning of the correspondence (bottom line up front)...」。Wikipedia 定義：「Bottom Line Up Front, or BLUF, is the practice of beginning a message with its key information (the "bottom line").」 |
| 金字塔原理 | Barbara Minto 官方網站（Minto Books International, Inc.）https://www.barbaraminto.com/ | 只取得概念頁的兩句；結構細節（答案先行、分組、邏輯順序）未取得一手原文 | 「your thinking will be easy for a reader to grasp if you present the ideas organized as a pyramid under a single point.」；「the powerful and compelling process for producing everyday business documents.」（引文為抓取工具回傳） |
| 決策備忘錄寫法 | Jason Healey，〈Memo Writing for Senior Leadership〉，2017-09-11，哥倫比亞大學課程頁 https://www.cs.columbia.edu/~smb/classes/f17/Files/Writing_Memo_Guidance.html | 取得（抓取工具回傳引文） | 「The first paragraph of your memo should state the purpose of the memo.」；「Lay out several different policy options, followed by an explanation of why your recommendation is the best option.」；「The memo should end with a clear recommended course of action.」；讀者：「receive a lot of paper」 |
| 決策備忘錄（政府範本） | 美國國防部 Executive Services Directorate〈Action Memo Guidance〉 | 抓取 403，未取得原文 | 搜尋摘要稱範本含「Decision Requested」與偏好、替代、維持現狀三種選項；未對照原文 |
| 用案例說明風險 | Gary Klein，〈Performing a Project Premortem〉，Harvard Business Review，2007 年 9 月。https://hbr.org/2007/09/performing-a-project-premortem | 只取得摘要句，全文未取得 | 「In a premortem, team members assume that the project they are planning has just failed」。尚未查到專門講「以商業案例說明衝擊、應對、結果」的權威來源，此欄為最接近的一手來源 |
| 風險溝通步驟 | 本機 `stakeholder-update` skill（非權威來源，屬 skill 內容） | 全文 | 見問題 5 |
| 平實語言 | digital.gov〈Plain language guide series〉 | 該頁沒有「最重要資訊先寫」的條文，僅有「content for the public is written for its specific audience」 | 與主題關聯弱 |

## 問題 4：檢查讀者是否真的理解，而不是照單全收

| 項目 | 來源 | 取得狀態 | 原文句 |
|------|------|---------|--------|
| 認知強制功能（cognitive forcing function） | Buçinca, Malaya, Gajos，〈To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making〉，arXiv:2102.09692，2021-02-19。https://arxiv.org/abs/2102.09692 | 取得摘要兩句 | 「cognitive forcing significantly reduced overreliance compared to the simple explainable AI approaches.」；「people assigned the least favorable subjective ratings to the designs that reduced the overreliance the most.」 |
| 解釋反而增加接受率 | Bansal 等 8 人，〈Does the Whole Exceed its Parts? The Effect of AI Explanations on Complementary Team Performance〉，arXiv:2006.14779，2020-06-26（v3 於 2021-01-12）。https://arxiv.org/abs/2006.14779 | 取得摘要句 | 「explanations increased the chance that humans will accept the AI's recommendation, regardless of its correctness.」；互補表現「were not increased by explanations.」 |
| 自動化偏誤（automation bias）與自滿（complacency） | Parasuraman 與 Manzey，〈Complacency and bias in human use of automation: an attentional integration〉，Human Factors，2010。PubMed 21077562 | 取得一句（經 Europe PMC）；摘要全文未取得 | 「Complacency and automation bias represent different manifestations of overlapping automation-induced phenomena.」。摘要大意（抓取工具轉述，非原文）：偏誤在輔助系統不完美時造成遺漏與誤判兩類錯誤，訓練不能完全防止 |
| 回述法（teach-back） | AHRQ Health Literacy Universal Precautions Toolkit，Tool 5「Use the Teach-Back Method」；AHRQ TeamSTEPPS 的 Teach-Back 工具頁 | 兩個頁面與工具包 PDF 抓取皆 403，未取得原文。只有搜尋摘要轉述（非原文）：請對方用自己的話複述資訊 | 未取得原文，不引句 |
| 過度信任與批判思考 | Lee、Sarkar 等，〈The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers〉，CHI 2025（微軟研究院） | 僅搜尋摘要，未讀原文 | 搜尋摘要轉述：對生成式 AI 信心較高與較少批判思考相關，自信較高與較多批判思考相關。調查 319 位知識工作者、936 個案例，屬自填報告 |
| 在對話中提示使用者查證 | anthropics/skills `discernment-nudge`（全文） | 全文 | 目的（原文）：「People often take an AI answer at face value, especially when it's confidently written and well-structured.」；做法：「append 2-3 short follow-up questions, each tied to something specific in what you just produced」；格式（原文）：固定開頭句「A few things worth a second look:」；限制：「Do this at most once per conversation.」；三個習慣來自「AI Fluency framework」：「Checking facts」「Questioning reasoning」「Noticing missing context」；不使用的情況包含使用者已要求「double-check」或要求精簡版（「Just the headline」） |

此 skill 要求代理在回答後附問題，由使用者自己決定是否追問；檔內沒有追蹤使用者是否有效理解的機制。其他追蹤「改進有沒有效」的做法：未查到。

## 問題 5：本機已安裝的相關 skill（只讀檔）

根目錄：`/Users/b-f-03-029/.claude/plugins/`。

| 路徑 | 做什麼 | 原文句 | 讀法 |
|------|--------|--------|------|
| `cache/knowledge-work-plugins/product-management/1.2.0/skills/stakeholder-update/SKILL.md`（14677 位元組） | 依對象與頻率產出利害關係人更新，含狀態燈號、風險溝通、決策記錄、會議主持 | 主管版：「TL;DR, status color (G/Y/R), key progress tied to goals, decisions made, risks with mitigation, specific asks, and next milestones. Keep it under 300 words.」；「Lead with the conclusion, not the journey.」；風險五步：「State the risk clearly」「Quantify the impact」「State the likelihood」「Present the mitigation」「Make the ask」；提示：「Asks must be specific: "Decision on X by Friday" not "support needed."」；也要求先詢問更新類型與對象，並可從已連線的工具撈資料 | 全文 |
| `cache/claude-community/eli5/1.0.0/skills/eli5/SKILL.md`（321 位元組） | 產出圖多字少的 HTML 說明頁 | 「Explain like I'm someone who knows nothing about this topic, using a HTML artifact with big pictures and few words.」 | 全文 |
| `plugins/synced/0f89b860-e7f7-4f8c-80a5-2f6f4d9e3d8f_f7ca619d-5258-428f-9d47-30c9f3552e4a/design/skills/design-critique/SKILL.md`（3923 位元組） | 對設計稿做結構化評論，輸出含嚴重度表 | 「Be specific: "The CTA competes with the navigation" not "the layout is confusing"」；輸出範本用三色圓點表示嚴重度（本調研不重現圖示） | 前 90 行，其餘為輸出範本結尾 |
| `cache/pm-skills/customer-journey-map/70fb6c4e4163/SKILL.md`（14139 位元組） | 建立顧客旅程圖 | 描述：「Create a customer journey map across stages, touchpoints, actions, emotions, and metrics.」 | 只讀描述 |
| `cache/pm-skills/storyboard/70fb6c4e4163/SKILL.md`（11022 位元組） | 六格分鏡，講使用者從問題到解法 | 描述：「Create a six-frame storyboard that shows a user's journey from problem to solution.」 | 只讀描述 |
| `cache/pm-skills/recommendation-canvas/70fb6c4e4163/SKILL.md`（13813 位元組） | 以結果、假設、風險、定位評估 AI 產品構想 | 描述：「Evaluate an AI product idea across outcomes, hypotheses, risks, and positioning.」 | 只讀描述 |
| `cache/knowledge-work-plugins/product-management/1.2.0/skills/write-spec/`、`metrics-review/`、`product-brainstorming/` | 與本題關聯較遠 | 未讀 | 未讀 |
| `plugins/synced/.../design/skills/design-handoff/`、`ux-copy/`、`accessibility-review/`、`design-system/` | 設計交付、文案、無障礙、設計系統 | 未讀 | 未讀 |
| `cache/mattpocock/mattpocock-skills/1.2.0/skills/productivity/handoff/SKILL.md`、`1.3.2/.../handoff/SKILL.md` | 交接 | 未讀 | 未讀 |

找不到的檔：`artifact-diagramming`、`dataviz`、`artifact-design` 在 `/Users/b-f-03-029/.claude` 與 `~/Library/Application Support/Claude` 下沒有 SKILL.md 檔。本次工作階段的技能清單有它們的一行描述，其中 `artifact-diagramming`：「Diagramming know-how for Artifacts - when a picture earns its place, how to draw one that shows the real mechanism, and the inline-SVG mechanics that keep it legible in both themes.」此為清單描述，不是檔案內文，未讀內文。

`cache/` 下的 `superpowers/brainstorming` 與 `knowledge-work-plugins` 的 `competitive-brief` 也在關鍵字搜尋中出現，與本題關聯弱，未讀。

## 比較表

| 來源 | 類型 | 熱門程度（星數） | 產出形式 | 讀了全文與否 |
|------|------|-----------------|---------|-------------|
| jgraph/drawio-mcp `drawio` | 圖解 skill | 5824 | `.drawio`、PNG、SVG、PDF；Mermaid 或 XML | 部分 |
| sparklabx/drawio-ai-kit `drawio` | 圖解 skill（含 BPMN 泳道、雲端架構） | 672 | `.drawio`、PNG | 大部分（principles、api 只讀開頭） |
| Agents365-ai/365-skills `plantuml-skill` | 圖解 skill（UML） | 100 | `.puml`、PNG、SVG（外送 kroki.io） | 全文 |
| markdown-viewer/skills `documd-visuals` | 圖解與文件 skill（路由型，含 BPMN、UML、備忘錄卡片） | 3402 | Markdown 內文字區塊與 HTML | SKILL.md 全文，子檔部分 |
| Agents365-ai/drawio-skill | 圖解 skill | 10750 | `.drawio` | 未讀 |
| antoinebou12/uml-mcp | 圖解 skill（UML，經 MCP） | 110 | PlantUML、Mermaid | 未讀 |
| tech-leads-club/agent-skills | 圖解 skill（Excalidraw、Mermaid） | 7163 | `.excalidraw`、Mermaid | 僅搜尋摘要 |
| github/awesome-copilot | 圖解 skill 集合 | 41104 | draw.io、PlantUML | 僅搜尋摘要 |
| a5c-ai/babysitter `bpmn-generator` | 圖解 skill（BPMN） | 1909 | BPMN 2.0 | 僅搜尋摘要 |
| melodic-software/claude-code-plugins | 圖解指引 skill | 30 | 指引文字 | 僅搜尋摘要 |
| infrasity-labs `service-blueprint` | 服務藍圖方法 skill | 165 | 文字 | 全文 |
| j-clegg/service-blueprint-skill | 服務藍圖產圖 skill | 1 | HTML、Mermaid | SKILL.md 全文，其餘未讀 |
| ghaida/intent `blueprint` | 服務藍圖與系統地圖 skill | 256 | 自含 HTML、Figma、pencil | 部分 |
| mohitagw15856 `policy-memo` | 決策者溝通 skill | 1545 | 文字備忘錄 | 全文 |
| mohitagw15856 `executive-summary` | 決策者溝通 skill | 1545 | 文字 | 全文 |
| anthropics/claude-agent-sdk-demos `executive-briefing` | 決策者溝通 skill | 2808 | 純文字一頁簡報 | 全文 |
| menkesu/awesome-pm-skills `exec-comms` | 決策者溝通 skill | 460 | 文字重寫與評分 | 部分 |
| anthropics/skills `internal-comms` | 內部溝通 skill | 193845（程式庫） | 文字 | SKILL.md 全文，範例未讀 |
| anthropics/skills `discernment-nudge` | 提示使用者查證的 skill | 193845（程式庫） | 回答後附 2 至 3 個問題 | 全文 |
| 本機 `stakeholder-update` | 決策者溝通 skill | 不適用 | 文字 | 全文 |
| 本機 `eli5` | 圖像說明 skill | 不適用 | HTML | 全文 |
| 本機 `design-critique` | 設計評論 skill | 不適用 | 文字表格 | 前 90 行 |
| NN/g 服務藍圖定義 | 權威來源 | 不適用 | 文章 | 取得引文（抓取工具回傳） |
| AR 25-50（經 Wikipedia 轉引） | 權威來源（二手轉引） | 不適用 | 規章 | 未取得規章原文 |
| Barbara Minto 官網 | 權威來源 | 不適用 | 網頁 | 只取得概念頁兩句 |
| Healey 備忘錄指引（哥倫比亞大學課程頁） | 決策備忘錄指引 | 不適用 | 網頁 | 取得三句 |
| Klein 事前驗屍法（HBR） | 風險想像法 | 不適用 | 文章 | 只取得摘要句 |
| Buçinca 等、Bansal 等、Parasuraman 與 Manzey | 研究 | 不適用 | 論文 | 只取得摘要句 |
| AHRQ 回述法 | 權威來源 | 不適用 | 工具包 | 未取得原文 |
