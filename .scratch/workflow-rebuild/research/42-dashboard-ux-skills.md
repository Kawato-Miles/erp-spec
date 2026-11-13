# 票 42 調研：把關畫面組合的代理 skill（調研員撰寫，主對話已部分查證）

## 主對話查證範圍（2026-11-13）

- 引文比對：用指令抽出初稿的英文引文 228 句，與下載的原始檔比對，213 句相符。15 句不符的原因：7 句是原文中間夾了網頁標籤或標題，內容相符；3 句是程式庫的一句話簡介，來自 GitHub 介面，不在下載的檔案裡；1 句是抽取誤判；其餘 4 句（第 80、88、93、94 行，都在 Impeccable 一節）沒有再查，視為未查證。
- 主對話讀完全文：Ant Design 的 `for-agents.md` 與規範頁 `detail-page`、`data-list`、`research-list`、`buttons`、`data-entry`、`research-form`、`feedback`、`research-workbench`；`office-web-ui-system` 的 `SKILL.md`、`page-type-playbook`、`component-recipes`、`framework-adaptation`、`navigation-and-panels`。
- 只用關鍵字抽查：ui-skills 的 Tailwind 要求、ui-craft 的工具列按鈕規則與安裝指令、Impeccable 的下載行為、Ant Design 命令列工具的版本涵蓋。
- 細節層（第 9 節）：interface-design 全部 7 個檔與 Impeccable 的 10 個檔讀完全文，`critique.md` 只讀部分行，範圍見票 42 的 Answer。
- 其餘各節主對話沒有讀原始檔。星數、推送日期、授權都沒有重新查證。
- 更正：第 7 節關於版本的說法不完整，官方命令列工具內建第 4、5、6 版資料並可指定版本查詢。結論見票 42 的 Answer。


調研日期 2026-11-13。本檔只蒐集與摘錄，不給設計建議，不建議採用哪一個。
所有英文原文句皆逐字複製自下載到本機的檔案。星數與「最後推送日期」取自 GitHub API 當日回傳值；「最後推送日期」是整個程式庫最後一次推送，不等於該 skill 檔最後修改日。

## 範圍與限制

使用者技術前提：Next.js、React 19、Ant Design 5.22、styled-components；桌機瀏覽器；列表頁、詳情頁、表單、資料表、狀態流程。

| 項目 | 狀況 |
|------|------|
| pbakaus/impeccable | 讀的是原始碼目錄 `skill/`（`.claude/`、`.cursor/` 等各工具目錄是同一份的複本，未逐一比對）。全文讀完：`SKILL.src.md`、`routing.md`、`layout.md`、`operate.md`、`mode-operate.md`、`mode-read.md`、`craft-floor.md`、`craft.md`、`shape.md`、`critique.md`、`audit.md`、`component-review.md`、`region-map.md`、`polish.md`、`distill.md`、`harden.md`、`adapt.md`、`clarify.md`、`extract.md`（`mode-read.md`、`adapt.md` 的少數超長行在顯示時被截斷）。只讀部分：`new-work.md`（67KB，只讀第 1 至 36 行、第 56 行、第 98 至 101 行、第 137 至 153 行，另以關鍵字搜尋全檔）、`hooks.md`（前 2.5KB）、`init.md`（前 2.5KB）、`agents/impeccable-finish-reviewer.md`（前 7KB，共 16KB）、`scripts/impeccable`（前 30 行與下載相關行）。只讀開頭約 700 字：`typeset`、`colorize`、`onboard`、`bolder`、`quieter`、`delight`、`animate`、`overdrive`、`optimize`、`document`、`doctor`、`live`、`generate`、`visualize`、`mode-persuade`。完全沒讀：`live-setup.md`、`ios.md`、`android.md`、`adapt.native.md`、`audit.native.md`、`agents/` 其餘三個、`scripts/` 內資料與大型腳本、`docs/`、`tests/`、`crates/`。 |
| ibelick/ui-skills | 本程式庫自己託管的 9 個 SKILL.md 與 1 個參考檔全文讀完；網站內容 `src/content/design-md/ant-design.md` 全文讀完；`README.md`、`AGENTS.md` 全文讀完。`src/data/registry.ts`（54 萬字元的第三方 skill 目錄）、`src/data/playbook.ts` 只用關鍵字搜尋，未全讀；命令列程式 `bin/`、`src/lib/` 未讀。 |
| 其他候選（共 8 個） | 挑 3 個讀：office-web-ui-system、ui-craft、interface-design。前兩者只讀到下表標明的範圍。其餘候選只讀 SKILL.md 或只看說明與目錄。 |
| Ant Design 官方 | 文字內容讀完；但規範頁（`docs/spec/*.md`）的版型示意圖全是圖片，本次讀不到圖，只有文字。 |
| 查不到 | 沒有任何來源提到 Ant Design 5.22 專屬的代理指示檔；`https://5x.ant.design/llms.txt` 回傳 404，未查到 v5 專用的 llms.txt。沒有任何 skill 在文字中提到 styled-components 與 Ant Design 並用的情境（Impeccable 與 ui-craft 僅在偵測樣式方法時列出 styled-components）。 |
| 網路搜尋 | 搜尋工具回傳多為第三方目錄頁（claudeskills.info、skillsmp.com 等），本檔只採信直接從 GitHub 與 ant.design 讀到的檔案內容，目錄頁上的星數與描述不採用。 |

來源內出現的「請代理執行某事」的文字，已在各節「安裝與執行」處原文記下，本次一律未執行。

---

## 1. pbakaus/impeccable

- 網址：https://github.com/pbakaus/impeccable
- 星數 109,185；最後推送 2026-11-13；授權 Apache-2.0（程式庫 LICENSE 與 SKILL.src.md 的 `license: Apache 2.0`）
- 最新發行版標籤 `cli-v4.9.0`（2026-11-13）
- 程式庫說明原文：「The design vocabulary for your coding agent. Steer with polish and bolder, review with critique and audit, catch AI slop before it ships.」

### 檔案清單

單一 skill（`impeccable`），下列為 `skill/` 原始碼目錄。`SKILL.src.md` 是入口；`reference/` 內為 24 個指令各自的操作手冊與輔助檔；`agents/` 為 4 個子代理定義；`scripts/` 為啟動器與偵測引擎（執行檔，未讀內容）。讀取範圍見上方「範圍與限制」。

### 它要求代理做什麼（附原文）

| 結論 | 檔案路徑 | 原文句 |
|------|----------|--------|
| 先依「訪客模式」分類畫面；後台、儀表板屬 Operate | `skill/SKILL.src.md` | "**Operate:** the visitor completes a task. App UI, dashboards, editors, admin, settings, tools. Scanability, consistency, native expectations, and the real usage scene outrank expression. Brand lives in precise details." |
| 每個工作階段先跑啟動器載入專案脈絡 | `skill/SKILL.src.md` | "Run `<skill-base-dir>/scripts/impeccable context` once per session" |
| 編輯任何 UI 前，先讀品質底線檔 | `skill/SKILL.src.md` | "read [reference/craft-floor.md](reference/craft-floor.md) immediately before any UI edit, including small refinements." |
| 後台畫面依 Operate 規則：標準導覽、密度、一致性 | `skill/reference/operate.md` | "Standard navigation patterns: top bar + side nav, breadcrumbs, tabs, command palettes." |
| 同上 | `skill/reference/operate.md` | "Density. Tables with many rows, panels with many labels, dense information when users need it." |
| 元件語彙跨畫面一致 | `skill/reference/operate.md` | "Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong." |
| 不重新發明標準操作元件 | `skill/reference/operate.md` | "Reinventing standard affordances for flavor (custom scrollbars, weird form controls, non-standard modals)." |
| 不把互動視窗當第一選擇 | `skill/reference/operate.md` | "Modal as first thought. Modals are usually laziness. Exhaust inline / progressive alternatives first." |
| 響應式是結構性的 | `skill/reference/operate.md` | "Responsive behavior is structural (collapse sidebar, responsive table, breakpoint-driven columns), not fluid typography." |
| 列為「要避免的頁面骨架」 | `skill/reference/craft-floor.md` | "Same-size cards of icon plus heading plus text as the page structure. Cards are the lazy container; nested cards are always wrong." |
| 同上 | `skill/reference/craft-floor.md` | "The hero-metric template: big number, small label, supporting stats, accent." |
| 同上 | `skill/reference/craft-floor.md` | "A modal for a task that needs neither interruption nor protected focus." |
| 版面指令：先判讀閱讀順序（瞇眼測試） | `skill/reference/layout.md` | "**Reading order:** Apply the squint test. With detail blurred, can you still identify the primary element, the secondary element, and the major groups in order?" |
| 版面指令：分組靠距離而非容器 | `skill/reference/layout.md` | "Group by meaning. Use proximity before adding containers or decoration." |
| Operate 的結構規則 | `skill/reference/layout.md` | "**Operate + Read:** predictable structure, stable density, and navigable linearity are affordances." |
| 版面動手前要先寫出「空間論點」 | `skill/reference/layout.md` | "the primary reading or task path;" / "what belongs together and what must separate;" / "which element leads and which supports;" |
| 規劃指令：先訪談再寫簡報，不寫程式 | `skill/reference/shape.md` | "Discover what should be made and how it should work, then return a confirmed design brief without code." |
| 簡報內含階層與拓樸 | `skill/reference/shape.md` | "**Interaction and layout:** hierarchy, topology, responsiveness, affordances, feedback, and transitions; intent, not CSS." |
| 做完後的評審：兩個獨立評估，且須由兩個子代理執行 | `skill/reference/critique.md` | "Assessment A and B MUST run as two isolated sub-agents whenever a sub-agent/Task tool is exposed." |
| 評審含十項可用性啟發式評分與認知負荷檢查 | `skill/reference/critique.md` | "**Chunking**: Is information presented in digestible groups (≤4 items per group)?" |
| 後台類介面指定的測試人物 | `skill/reference/critique.md` | "Dashboard / admin \| Alex, Sam \| Power users, accessibility" |
| 技術稽核分五個面向，只記錄不修 | `skill/reference/audit.md` | "Don't fix issues; document them for other commands to address." |
| 收尾拋光：先對照既有設計系統與鄰近流程 | `skill/reference/polish.md` | "Match neighboring mental models, terminology, disclosure, routing, save behavior, and optimistic or pessimistic patterns." |
| 精簡指令的建議（通用，非後台專用） | `skill/reference/distill.md` | "**Clear hierarchy**: ONE primary action, few secondary actions, everything else tertiary or hidden" |
| 同上 | `skill/reference/distill.md` | "**Remove sidebars**: Move secondary content inline or hide it" |
| 同上 | `skill/reference/distill.md` | "**Linear flow**: Replace complex grids with simple vertical flow where possible" |
| 新畫面的建構路徑 | `skill/reference/new-work.md` | "An Operate or Read surface is code-led whatever the project records: working screens and documents come out better built than pictured." |

### 技術前提與衝突

- 假設 Tailwind、shadcn、特定字型或特定元件庫：未見硬性規定。在樣式探索處列出多種方式。原文：`skill/reference/document.md` 第 90 行 "**CSS-in-JS theme files**: styled-components, emotion, vanilla-extract, stitches; look for `theme.ts`, `tokens.ts`, or equivalent."；第 92 行 "**Component library**: scan the main button, card, input, navigation, dialog components. Note their variant APIs and default styles."
- 全部指示檔中搜尋 "Ant Design"、"antd"：沒有命中。
- 與 Ant Design 加 styled-components 可能有張力的句子（皆非明確禁止 Ant Design，僅記錄）：
  - `skill/reference/mode-operate.md`："Every control is a standard one the visitor already knows how to use, a web component on the web and the platform's native control in an app: buttons, tabs, inputs, selects, filters, tables with sortable headers, navigation that reads as navigation."（偏向支持標準元件）
  - `skill/reference/mode-operate.md`："A grey screen with one accent colour is the category default without the category's polish, not restraint."（對灰底單一強調色的評語）
  - `skill/reference/new-work.md` 第 100 行："Commit every atom: nav, buttons, inputs, and links are rebuilt in the form's vocabulary, and a stock component inside a committed form is a lapse."（此段位於「建立或取代視覺世界」的建構流程；同檔另說 Operate 畫面走程式碼優先；是否適用於既有元件庫專案，原文未明說）
  - `skill/reference/craft-floor.md` 的 Codex 專屬區塊："Card radii stay at 12–16px; pills are for small controls."（僅標記給 Codex 的區塊）
- 偵測器掛鉤掃描的副檔名原文：`skill/reference/hooks.md` "The hook runs the impeccable design detector on direct file edits to design-relevant files (`.tsx`, `.jsx`, `.html`, `.vue`, `.svelte`, `.astro`, `.css`, `.scss`, `.sass`, `.less`, `.ts`, `.js`)."；偵測器對執行期才產生樣式的元件庫（Ant Design 的 CSS-in-JS）能否判讀：未查到。
- 設計語言文件：此 skill 會寫 `PRODUCT.md`、`DESIGN.md`、`.impeccable/` 目錄（`init.md`、`document.md`、`critique.md` 的存檔步驟）。

### 頁面層級的組合

沒有列表頁、詳情頁、表單頁專用版型。有通則：閱讀順序、分組、密度、主要操作數量（上表）。全檔搜尋 "detail page|list page|form page" 無命中；只有 `adapt.md` 第 69 行 "Master-detail views (list + detail)"（平板適配建議）與 `extract.md` 第 18 行 "Composition patterns: Layout or interaction patterns that repeat (form rows, toolbar groups, empty states)"。主要操作位置：沒有明確規定（只有 `distill.md` 的「一個主要操作」）。

### 做之前或做之後

兩者都有。做之前：`shape`（訪談與簡報）、`new-work`、`layout`。做之後：`critique`（評分）、`audit`（技術稽核）、`polish`、`harden`、`detect`（偵測器）、結束時的 `impeccable-finish-reviewer` 子代理。另有編輯時自動觸發的偵測掛鉤。

### 安裝與執行（只記錄，未執行）

- README 原文："From your project root: `npx impeccable install`"
- SKILL.src.md 的 `allowed-tools` 原文："Bash(npx impeccable *)"
- 啟動器 `skill/scripts/impeccable`（shell 腳本）原文註解："The launcher runs a self-contained binary that ships next to it or is downloaded once on first run"（`SKILL.src.md`）；腳本內預設下載位址 `https://github.com/pbakaus/impeccable/releases/download`，並以 `engine-checksums.txt` 驗證雜湊值。
- 第三方二進位：`impeccable detect`、`live-server` 等皆需執行該二進位。
- 即時模式（`live`）會把腳本注入瀏覽器頁面。`critique.md` 原文："inject `http://localhost:PORT/detect.js`"。
- README 原文（即時模式的風險）："If none has polled in the last minute, it runs the `codex` CLI from your PATH instead (or `claude` when codex is missing), with approvals, permission checks, and sandboxing off (`--dangerously-bypass-approvals-and-sandbox` or `--permission-mode bypassPermissions`) and your environment inherited."
- README 原文（執行使用者專案腳本）："Applying copy edits runs your `package.json`'s optional `impeccable:manual-edit-validate` script with your permissions, so review it before using live mode in an unfamiliar repo."

---

## 2. ibelick/ui-skills

- 網址：https://github.com/ibelick/ui-skills
- 星數 11,016；最後推送 2026-11-12；授權 MIT
- 性質：一個技能目錄網站（含命令列與 MCP），自己託管 9 個 skill，另收錄大量第三方 skill 的連結（`src/data/registry.ts`）。

### 檔案清單

| 檔案 | 讀取範圍 |
|------|----------|
| `skills/baseline-ui/SKILL.md` | 全文 |
| `skills/improve-ui/SKILL.md`、`skills/improve-ui/references/plan-template.md` | 全文 |
| `skills/ui-skills-root/SKILL.md` | 全文 |
| `skills/component-canvas/SKILL.md`、`skills/create-canvas/SKILL.md` | 全文 |
| `skills/create-design-md/SKILL.md` | 全文 |
| `skills/fixing-accessibility/SKILL.md`、`skills/fixing-metadata/SKILL.md`、`skills/fixing-motion-performance/SKILL.md` | 全文 |
| `src/content/design-md/ant-design.md`（21KB） | 全文 |
| `README.md`、`AGENTS.md` | 全文 |
| `src/data/registry.ts`、`src/data/playbook.ts` | 只用關鍵字搜尋 |

### 它要求代理做什麼（附原文）

| 結論 | 檔案路徑 | 原文句 |
|------|----------|--------|
| 路由：先選最小可用的 skill 組合 | `skills/ui-skills-root/SKILL.md` | "Prefer 1 skill." / "Never use more than 3." |
| `baseline-ui`：快速清除 AI 風格的間距、層級、字型問題；可對單一檔案列出違規 | `skills/baseline-ui/SKILL.md` | "Review the file against all constraints below and output:" |
| 技術前提：硬性使用 Tailwind | `skills/baseline-ui/SKILL.md` | "MUST use Tailwind CSS defaults unless custom values already exist or are explicitly requested" |
| 同上：用既有元件優先 | `skills/baseline-ui/SKILL.md` | "MUST use the project's existing component primitives first" |
| 空狀態與強調色 | `skills/baseline-ui/SKILL.md` | "MUST give empty states one clear next action" / "SHOULD limit accent color usage to one per view" |
| 重要操作用警示對話框 | `skills/baseline-ui/SKILL.md` | "MUST use an `AlertDialog` for destructive or irreversible actions" |
| 資料對齊 | `skills/baseline-ui/SKILL.md` | "MUST use `tabular-nums` for data" |
| `improve-ui`：做完後的稽核，唯讀，只寫修改計畫到 `design-plans/` | `skills/improve-ui/SKILL.md` | "Never modify product source. Create or edit files only under `design-plans/`." |
| 同上：稽核對照該專案自己的設計證據，而不是通用理想 | `skills/improve-ui/SKILL.md` | "Audit one coherent product surface against the system that actually governs it." |
| 同上：層級、密度、主要操作這類判斷需要畫面證據，不能只看原始碼 | `skills/improve-ui/SKILL.md` | "Hierarchy, prominence, density, clarity, discoverability, usability, and perceived coherence require rendered or user evidence." |
| 同上：一次最多報三項 | `skills/improve-ui/SKILL.md` | "Order surviving findings by confidence, user impact, reach, and correction cost. Stop at three." |
| 同上：預設排除無障礙與功能類問題 | `skills/improve-ui/SKILL.md` | "Discard accessibility and HTML/ARIA semantic findings unless the user explicitly requests them." |
| 網站收錄的 Ant Design 設計語言檔（與 ant.design 官方 `design.md` 大小同為 21,175 位元組） | `src/content/design-md/ant-design.md` | 見第 7 節 |

`component-canvas`、`create-canvas`、`create-design-md`、`fixing-*`：分別是元件展示畫布、自由畫布、產生 DESIGN.md、無障礙、中繼資料、動畫效能。與畫面組合無關，只讀過內容。

### 技術前提與衝突

- `baseline-ui` 假設 Tailwind、`motion/react`、`cn`（clsx 加 tailwind-merge）。原文見上表與 "MUST use `cn` utility (`clsx` + `tailwind-merge`) for class logic"、"MUST use `motion/react` (formerly `framer-motion`) when JavaScript animation is required"。這些與使用者的 styled-components 並用情境直接衝突（`baseline-ui` 另一句 "unless custom values already exist" 僅針對 Tailwind 預設值）。
- `baseline-ui` 另有："NEVER use gradients unless explicitly requested"、"NEVER add animation unless it is explicitly requested"。
- `improve-ui`、`fixing-*` 無固定樣式方法前提；`fixing-motion-performance` 與 `fixing-accessibility` 皆寫 "do not migrate ... unless requested" 類語句。

### 頁面層級的組合

沒有。`baseline-ui` 的 Layout 只有 z-index 與 `size-*`；`improve-ui` 明確把層級、密度判斷留給畫面證據，不提供版型。

### 做之前或做之後

`ui-skills-root`：做之前（選 skill）。`baseline-ui`：兩者皆可（可套用於整個對話，或審查單檔）。`improve-ui`：做之後的稽核加計畫。

### 安裝與執行（只記錄，未執行）

- README 原文：`npx ui-skills start`、`npx ui-skills get baseline-ui`；MCP 位址 "https://www.ui-skills.com/mcp"。
- `skills/ui-skills-root/SKILL.md` 原文："This skill is shown by `npx ui-skills start` and is also available in the registry."
- `skills/create-design-md/SKILL.md` 原文："npx @google/design.md lint DESIGN.md"、"npx @google/design.md export --format <format> DESIGN.md"（執行遠端套件）。

---

## 3. anthropics/skills 內的 frontend-design

- 網址：https://github.com/anthropics/skills（路徑 `skills/frontend-design/SKILL.md`）
- 星數 193,846；最後推送 2026-11-06；授權：GitHub API 授權欄位空白，`skills/frontend-design/LICENSE.txt` 開頭為 Apache License 2.0；SKILL.md 寫 "license: Complete terms in LICENSE.txt"
- 讀取範圍：SKILL.md 全文；LICENSE.txt 只讀開頭

### 它要求代理做什麼（附原文）

| 結論 | 原文句 |
|------|--------|
| 先找出主題與主要工作 | "You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal." |
| 要求有鮮明的視覺個性；明說不要範本感 | "make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified." |
| 舉出預設範本特徵（包含儀表板常見的卡片套件） | "the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes as decoration;" |
| 先出計畫（色彩、字型、版面、原則）再自我檢視後才寫程式 | "Work in two passes. First, brainstorm a short design plan based on the client's design brief" |
| 結構要素要承載資訊 | "Visual structure is information." |
| 做完要自我審視並截圖 | "Critique your own work as you build, taking screenshots to review if your environment supports it" |
| 文案：動作名稱一致 | "A CTA says exactly what happens when it is used: "Save changes," not "Submit."" |

### 技術前提與衝突

未假設 Tailwind、shadcn 或特定元件庫。有字型選擇要求："Choose your typefaces deliberately, not the default families you would reach for on any other project"（對使用 Ant Design 預設字體堆疊的專案，這句沒有明說如何處理）。

### 頁面層級的組合

沒有列表、詳情、表單、資料表專用內容。只有針對網頁首屏的規則："For web designs, the hero is the first thing viewers will see."（以對外網頁為主）。主要操作位置：沒有。

### 做之前或做之後

兩者都有，偏做之前（先計畫再自我檢視），結尾有自我批判。

### 安裝

SKILL.md 內無安裝指令，無執行遠端內容的指令。

---

## 4. Dammyjay93/interface-design（讀完全部）

- 網址：https://github.com/Dammyjay93/interface-design
- 星數 5,968；最後推送 2026-06-20；授權 MIT
- 描述（SKILL.md frontmatter）："Craft-first interface design for dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces, and interactive products."；"Not for marketing pages, landing pages, campaigns, or brand-only work."

### 檔案清單

| 檔案 | 讀取範圍 |
|------|----------|
| `.claude/skills/interface-design/SKILL.md`（29.6KB） | 全文 |
| `.claude/commands/design-review.md`（10.9KB） | 全文 |
| `.claude/commands/design-deslop.md`（7.5KB） | 全文 |
| `reference/system-template.md`、`reference/examples/system-precision.md` | 全文 |
| `reference/examples/system-warmth.md` | 未讀 |
| `README.md` | 只讀安裝段 |

### 它要求代理做什麼（附原文）

| 結論 | 檔案路徑 | 原文句 |
|------|----------|--------|
| 每個畫面先指出唯一焦點 | `SKILL.md` | "Every screen has one thing the user came to do. That thing dominates — through size, contrast, position, or the space around it." |
| 層級靠大小、粗細、色彩階一起做 | `SKILL.md` | "Build from three levers together (size, weight, color/opacity), never size alone." |
| 密度先決定並用數字固定 | `SKILL.md` | "Decide the density up front and name the values: a tool panel at 12–16px padding feels workbench-tight; the same card at 24px feels like a brochure." |
| 比例要說明關係（側欄寬度） | `SKILL.md` | "A 280px sidebar next to full-width content says "navigation serves content." A 360px sidebar says "these are peers."" |
| 側欄與主內容同底色 | `SKILL.md` | "**Sidebars:** same background as canvas, not a different color." |
| 優先用專案既有的元件與設計系統 | `SKILL.md` | "**If the project has a design system, use it.** shadcn/`Button`, a CVA variant set, a theme, a component library — use `<Button variant="…">` and the existing variants before writing a one-off." |
| 不要重造既有元件 | `SKILL.md` | "The most common way AI degrades a codebase: it hand-rolls what already exists." |
| 每次寫元件前要先寫出意圖、層級、色盤、深度、間距 | `SKILL.md` | "**Every time** you write UI code — even small additions — state:" |
| 做完後的四項自檢 | `SKILL.md` | "**Swap test**"、"**Squint test**"、"**Signature test**"、"**Token test**" |
| 做完後的嚴格評審，附核准門檻，預設只判定不修改 | `.claude/commands/design-review.md` | "This review **judges by default**. Report findings and a verdict; only rebuild when the user asks." |
| 評審透鏡 A 為層級 | `design-review.md` | "Name the focal element. Does it actually win (size, weight, contrast, isolation), or sit equal to its neighbors?" |
| 評審對照該設計自己的意圖 | `design-review.md` | "*You review against the design's own intent, not a generic ideal.* A deliberately dense trading terminal is not failing for being dense." |
| 會被視為阻擋項 | `design-review.md` | "**Presumptive blockers** (unless the author justifies them against intent): no focal point · size-only or defaulted typography · monotone layout · timid or competing-accent palette · harsh or fragmented surfaces · missing states · structural hacks" |
| 快速清除版：只動本次差異 | `.claude/commands/design-deslop.md` | "Stay in the diff; these are the line-level signatures" |
| 結束時詢問是否把設計決定存成 `.interface-design/system.md` | `SKILL.md` | "Always offer to save: "Want me to save these patterns for future sessions?"" |

### 技術前提與衝突

- 假設 Tailwind 與 shadcn 的字眼出現在範例，但明說要符合專案既有方式。原文："Match the codebase's styling convention (Tailwind, CSS modules, CSS-in-JS), don't introduce your own."
- 與 Ant Design 加 styled-components 可能有張力的句子：
  - "**A battle-tested headless primitive** for anything stateful and hard to get right — select, combobox, dialog, popover, tooltip, dropdown menu, tabs, date picker."（頭條建議用無樣式原件，但前一層級仍是「專案有設計系統就用設計系統」）
  - "**Sidebars:** same background as canvas, not a different color."（與 Ant Design 預設側欄配色的關係：未查證）
  - 要求每個產品有「一個獨有的標誌性元素」："**Signature** — one element (visual, structural, or interaction) that could only exist for THIS product."
  - 要求避開預設字型："**Default typography** — system/Inter fonts and size-only hierarchy where a direction was set"。
- 全檔搜尋 "Ant Design"、"antd"：沒有命中。

### 頁面層級的組合

沒有列表頁、詳情頁、表單頁專用版型。只有通則：單一焦點、密度、比例、節奏。資料表有零星提及（tabular-nums、`system-precision.md` 的 Table Cell 範例）。主要操作位置：沒有明確規定。

### 做之前或做之後

兩者都有：做之前（Intent First、Product Domain Exploration）；做之後（`design-review`、`design-deslop`）。

### 安裝與執行（只記錄，未執行）

README 原文："npx skills add https://github.com/dammyjay93/interface-design --skill interface-design"。

---

## 5. educlopez/ui-craft（挑讀 3 之二，部分讀）

- 網址：https://github.com/educlopez/ui-craft
- 星數 452；最後推送 2026-11-13；授權 MIT
- 程式庫說明："Design engineering system for AI coding agents — ship UI with craft-level quality. Install as an agent skill."
- 結構：`.agents/skills/` 下 25 個以上 skill（`craft`、`critique`、`audit`、`polish`、`shape`、`brief`、`finalize`、`ui-craft-dense-dashboard`…）、主 skill `ui-craft`（38KB）與 33 個參考檔。

### 讀取範圍

| 檔案（均在 `.agents/skills/` 下） | 讀取範圍 |
|------|----------|
| `ui-craft-dense-dashboard/SKILL.md` | 全文 |
| `ui-craft/references/dashboard.md`（12KB）、`recipe-dashboard.md`（9.5KB） | 全文 |
| `ui-craft/references/layout.md`（13KB） | 約 85%（中段 3,229 字元在顯示時被截斷） |
| `ui-craft/SKILL.md`（38KB） | 只讀標題與選定行：第 39 至 45 行、第 121 至 131 行、第 220 行、第 244 行、第 322 至 400 行參考檔索引 |
| `ui-craft/references/coverage.md`（42KB） | 讀第 1 至 36 行、第 79 至 90 行、第 347 至 420 行，另列出全部章節標題 |
| `ui-craft/references/forms.md`、`review.md`、`finish-bar.md` | 只讀章節標題與關鍵字命中行（`finish-bar.md` 另讀 Pass 1） |
| `ui-craft/references/stack.md` | 只用關鍵字搜尋 |
| `README.md` | 讀開頭與安裝段 |
| 其餘（`critique/`、`audit/`、`brief/`、`shape/` 等 skill，`craft-intent.md`、`heuristics.md`、`personas.md`、`tokens.md`、`themes.md`、`state-design.md` 等參考檔） | 未讀 |

### 它要求代理做什麼（附原文）

| 結論 | 檔案 | 原文句 |
|------|------|--------|
| 有專屬「高密度儀表板」風格 skill，旋鈕固定 | `ui-craft-dense-dashboard/SKILL.md` | "**VISUAL_DENSITY = 9** — tight 4/8px grid; whitespace earns its place." |
| 版面結構：側欄加主內容區 | `references/dashboard.md` | "A dashboard needs a sidebar + main content area. The sidebar is the navigation spine." |
| 首屏內容類型數量 | `references/dashboard.md` | "Minimum 3 different content types visible per viewport (e.g., metric cards + chart + table)." |
| 不要四張以上等重指標卡 | `references/dashboard.md` | "Never show 4+ identical metric cards. Differentiate the primary metric." |
| 資訊分四個層級（一個主指標、2 至 4 個輔助、情境、深入查詢） | `references/dashboard.md` | "One hero. 2-4 supports. Context behind. Deep-dive one click away. Test by squinting at the dashboard: your eye should land on ONE thing first." |
| 資料表規則：表頭、對齊、虛擬捲動 | `references/dashboard.md` | "**Put `position: sticky; top: 0` on `thead` past ~15 rows.**" / "**Virtualize past 200 rows.**" / "**Alignment**: text left, numbers right, status center." |
| 工具列只用幽靈按鈕 | `references/dashboard.md` | "Ghost buttons for all filter controls — **never solid primary buttons in a toolbar.**" |
| 狀態用小圓點而非徽章 | `references/dashboard.md` | "Badges add visual noise and are an AI-slop pattern." |
| 三種命名版型（總覽、指揮台、分析）附 ASCII 線框 | `references/recipe-dashboard.md` | "Three named compositions. Don't invent a fourth unless the user's brief demands it" |
| 指揮台版型：表格佔畫面六成以上 | `references/recipe-dashboard.md` | "The table IS the product: the operator acts on rows." |
| 外框尺寸 | `references/recipe-dashboard.md` | "**Sidebar:** 240px (range 220-260)." / "**Topbar:** 56px (range 48-64)" |
| 驗收門檻（做完後逐項勾選，一項未過即未完成） | `references/recipe-dashboard.md` | "Ship only when every box checks. One unchecked = not done, no exceptions:" |
| 每個資料區要有空、載入、錯誤狀態 | `references/recipe-dashboard.md` | "Empty / loading / error states for EVERY data region" |
| 預設先偵測專案樣式方式，不對抗專案技術 | `SKILL.md` | "**Rules:** never fight the project's stack; never mix approaches." |
| 預設先問使用者 | `SKILL.md` | "**Ask before assuming** — never default accent, font, or style." |
| 完整度檢查（回答「這畫面少了什麼零件」），有 12 種畫面原型，含資料表、詳情頁、設定頁 | `references/coverage.md` | "It asks whether a screen has the parts screens of its kind need." |
| 詳情頁的零件：返回保留列表狀態、單一主要操作、編輯模式聲明、歷程、上下筆導覽 | `references/coverage.md`（`detail-view` 段） | "Breadcrumb or back control returning to the originating list with its filters, sort and page intact" / "The action the page exists for is visually separated from the field values around it" |
| 資料表的零件（標題含）：排序、列選取與批次列、篩選條件可見、分頁或虛擬捲動、列操作上限、欄位顯示、兩種空狀態、匯出 | `references/coverage.md`（`data-table` 段，只讀標題） | `### Row selection with a bulk action bar` / `### Both empty states, told apart`（章節標題） |
| 表單：單欄 | `references/forms.md`（關鍵字命中行） | "**Single column.** Multi-column forms break downward momentum" |
| 完整度報告不評分、不擋關 | `references/coverage.md` | "**Coverage never gates.** It does not fail a build and does not exit non-zero." |

### 技術前提與衝突

- 預設以 CSS 為主並附 Tailwind 對照。原文（`SKILL.md`）："Reference files are CSS-first with Tailwind translations."；偵測清單含 "styled-components/Emotion"。
- 與 Ant Design 加 styled-components 的衝突句子（原文）：
  - `references/recipe-dashboard.md`："Tables: headless (TanStack Table) + own markup; never a themed datagrid that fights the token system."
  - `references/recipe-dashboard.md`："Charts via Recharts/visx (React) or ECharts/Chart.js"、"**Libraries** (tools, not design authority — match the project's stack first)"
  - `references/dashboard.md`："Badges add visual noise and are an AI-slop pattern."
  - `references/dashboard.md`："Ghost buttons for all filter controls — **never solid primary buttons in a toolbar.**"
  - `references/dashboard.md`："Subtle background tint (e.g., `background: #f8fafc` / Tailwind: `bg-slate-50` ...) — NOT full black unless Dark Premium style."
  - `ui-craft-dense-dashboard/SKILL.md`："UI: IBM Plex Sans or Inter, 400 / 500." 與 "Body size: 13-14px default; 12px in dense tables is fine."
  - `SKILL.md`："One body font, optionally a second for display ... Inter/Geist/DM Sans are safe fallbacks when no brand font exists."
- 全部已讀檔案搜尋 "Ant Design"、"antd"：沒有命中（`stack.md` 的關鍵字搜尋只命中 Three.js 材質字眼）。

### 頁面層級的組合

有。儀表板三種版型（總覽、指揮台、分析）附 ASCII 線框與尺寸；詳情頁與資料表有「零件完整度」清單（`coverage.md`）；表單有欄位排列規則（`forms.md`）。列表頁以「指揮台版型的工作佇列表格」呈現；沒有獨立的「列表頁」模板。主要操作位置：詳情頁要求主要操作與欄位值視覺分離（上表），其餘未讀。

### 做之前或做之後

兩者都有。做之前：`recipe-dashboard.md` 的步驟 0 至 4、`/brief`、`/shape`。做之後：驗收門檻（10 項，`recipe-dashboard.md`）、`/finalize` 十道修整（`finish-bar.md`）、`coverage.md` 完整度檢查、`/critique`、`/audit`。

### 安裝與執行（只記錄，未執行）

- README 原文："curl -fsSL https://ui-craft.smoothui.dev/install | bash"
- README 原文："The script detects your OS/arch, downloads the latest release, verifies its checksum, and installs the `ui-craft` binary"
- 另有 `ui-craft install`、`brew install --cask educlopez/tap/ui-craft`、`npx skills add`、Claude Code 外掛。會安裝 MCP 閘門（`check_anti_slop`、`tokens_lint`、`acceptance_bar`、`score_ui`）與審查子代理。

---

## 6. thienanblog/awesome-ai-agent-skills 內的 office-web-ui-system（讀完全部）

- 網址：https://github.com/thienanblog/awesome-ai-agent-skills（路徑 `skills/office-web-ui-system/`，另有同內容複本在 `plugins/office-web-ui-skills/skills/office-web-ui-system/`）
- 星數 69；最後推送 2026-10-01；授權 Apache-2.0（程式庫）
- 描述（SKILL.md frontmatter）："Build or improve operational dashboards, admin tools, CRM/ERP, CRUD, reporting, and record-management interfaces. Use for dense workflows and dashboard reference matching; excludes marketing and unrelated consumer UI."

### 檔案清單與讀取範圍

| 檔案 | 讀取範圍 |
|------|----------|
| `SKILL.md`（4.2KB） | 全文 |
| `references/page-type-playbook.md`（6.9KB） | 全文 |
| `references/component-recipes.md`（9KB） | 全文 |
| `references/visual-language.md`（6.2KB） | 全文 |
| `references/navigation-and-panels.md`（3.2KB） | 全文 |
| `references/framework-adaptation.md`（5.8KB） | 全文 |
| `references/locator-class-contract.md`（3.4KB） | 全文 |
| `scripts/scan_ui_locators.py`（5.2KB） | 只讀前 40 行（Python 掃描腳本，未執行） |

### 它要求代理做什麼（附原文）

| 結論 | 檔案路徑 | 原文句 |
|------|----------|--------|
| 先建立「這頁的工作」，並從四種版型原型挑一 | `SKILL.md` | "Use dashboard/report, CRUD/list, workspace/detail, and form/wizard as composition guides." |
| 版面共同要求：標題、情境、主要操作、篩選、資料層級要清楚；表格與表單寬度優先 | `SKILL.md` | "Make title, context, primary action, filters, and data hierarchy clear. Preserve table and form width before adding supporting panels." |
| 沿用既有元件庫與外殼 | `SKILL.md` | "Adapt primitives to the installed framework and library; do not force a new shell, pill topbar, glass style, or dark theme onto a coherent existing product." |
| 版面視覺階層順序 | `references/visual-language.md` | "1. shell first 2. page title and context second 3. actions and filters third 4. data surface fourth" |
| 列表頁（CRUD / list）預設結構 | `references/page-type-playbook.md` | "page root / restrained header band or compact page header / action cluster / filter bar and search / table wrapper / mobile record cards if the data needs a narrower presentation"（原文為條列，此處以斜線串接） |
| 列表頁的操作位置 | `references/page-type-playbook.md` | "create, refresh, import, and batch actions live above the filter bar or beside the title" / "row actions stay inside the table or mobile cards" |
| 詳情頁（workspace / detail）預設結構與操作位置 | `references/page-type-playbook.md` | "primary record actions stay near the page header" / "local actions stay inside the panel or section they affect" |
| 表單頁預設結構與操作位置 | `references/page-type-playbook.md` | "save, continue, submit, and cancel remain close to the form context" / "do not bury primary form actions inside unrelated side content" |
| 儀表板操作位置 | `references/page-type-playbook.md` | "primary actions live in the page header area" / "export belongs with report controls, not mixed into row actions" |
| 版型選擇規則 | `references/page-type-playbook.md` | "If the table is the main product, choose CRUD/list." |
| 反模式（列表頁） | `references/page-type-playbook.md` | "huge decorative hero above a simple table" / "filters visually mixed with row actions" |
| 反模式（詳情頁） | `references/page-type-playbook.md` | "optional panels permanently consuming too much width" / "one giant undifferentiated page with no main vs support hierarchy" |
| 元件配方：只挑需要的 | `references/component-recipes.md` | "If every recipe appears on the same page, the page is probably overdesigned." |
| 驗證：實際開瀏覽器看畫面 | `SKILL.md` | "Check hierarchy, density, overflow, text fit, table interactions, keyboard-visible focus, and supported themes/responsive states." |
| 區域定位：為重要區塊加語意類別名稱 | `references/locator-class-contract.md` | "Use readable semantic classes when existing semantic markup, accessible names, component boundaries, or project locators do not identify a region clearly." |
| 子代理需要先獲准 | `SKILL.md` | "Delegation can increase usage: obtain explicit approval for the proposed agent count and scope before using subagents." |

### 技術前提與衝突

- 不假設特定元件庫；有專章 `framework-adaptation.md`，涵蓋 PrimeVue、Vue、React 與 shadcn、Laravel Blade、utility-first、component-library 專案。
- 與 Ant Design 的關係，原文（`framework-adaptation.md`）："Use the library for primitives, not for naming the whole UI." 與 "Do not let PrimeVue defaults decide the whole visual hierarchy. PrimeVue is the primitive layer, not the page-composition layer."（後者針對 PrimeVue）。
- 預設視覺語言偏向玻璃、漸層、藥丸型頂欄，但寫明要適應既有產品。原文（`visual-language.md`）："Use depth deliberately: blur, subtle gradients, soft shadows, glass surfaces." 與（`SKILL.md`）"do not force a new shell, pill topbar, glass style, or dark theme onto a coherent existing product."
- 全部已讀檔案搜尋 "Ant Design"、"antd"：沒有命中。styled-components：未提及（只提 CSS Modules 與 utility-first）。

### 頁面層級的組合

有，且是本次調研中唯一把「列表頁、詳情頁、表單頁」與「主要操作放哪裡」寫成逐頁型規則的非官方 skill（上表）。沒有資訊層級的量化規格（沒有尺寸、欄數）。

### 做之前或做之後

兩者都有。做之前：選版型、元件配方。做之後：`SKILL.md` 的「Verify the result」（開瀏覽器截圖比較、跑專案檢查）。

### 安裝與執行（只記錄，未執行）

SKILL.md 內無安裝指令。程式庫另有外掛清單與 `plugins/`，安裝步驟在程式庫 README（未讀）。選用的掃描腳本原文：`python3 "<skill-directory>/scripts/scan_ui_locators.py" "<project-root>" --match layout-sidebar`。

---

## 7. Ant Design 官方給代理的規範檔與頁面模式文件

來源：ant.design、github.com/ant-design/ant-design（星數 100,185、MIT、最後推送 2026-11-13）、github.com/ant-design/ant-design-cli（星數 261、MIT、最後推送 2026-11-12）、github.com/ant-design/antd-skill（星數 139、MIT、最後推送 2026-03-27）。

### 7.1 給代理的入口與機器可讀檔

| 資源 | 內容與讀取範圍 |
|------|------|
| `https://ant.design/docs/react/for-agents.md` | 全文（3.7KB）。提供一段可貼給代理的提示詞。 |
| `https://ant.design/llms.txt`（34.7KB） | 導覽檔，只讀開頭與關鍵字命中。列出 `docs/spec/*.md` 設計規範頁連結（見 7.3）、元件文件、`design.md`、`llms-full.txt`、`llms-semantic.md`。 |
| `https://ant.design/llms-full.txt`（2.1MB） | 只讀開頭與關鍵字搜尋。開頭原文："This file contains aggregated content from all component docs." 與 "> Total 75 components"。搜尋 "Detail Pages display the complete data" 與 "Design Patterns" 皆無命中：全文檔只含元件文件，不含頁面模式規範。 |
| `https://ant.design/design.md`（21,175 位元組） | 與 ibelick/ui-skills 內 `ant-design.md` 大小相同；本次讀的是後者全文，二者是否逐字相同：未逐字比對。內容為 Ant Design v6 預設亮色主題的設計語言。 |
| `https://ant.design/docs/react/cli.md`、`mcp.md` | 只讀 `mcp.md` 的關鍵字命中行（提示詞 `antd-page-generator`："Assists with component-based page creation"）；`cli.md` 只確認大小，未讀。 |
| `@ant-design/cli` 的 skill：`skills/antd/SKILL.md`（程式庫 ant-design/ant-design-cli） | 全文（9.5KB） |
| ant-design/antd-skill：`skills/antd/SKILL.md`、`skills/ant-design/SKILL.md`、README 開頭 | 全文 |
| ant-design/ant-design 程式庫內 `.agents/skills/`（changelog-collect、commit-msg、create-pr、issue-reply、test-review、version-release） | 僅確認存在，是貢獻者用，非使用者端；未讀 |

for-agents 提示詞原文：「This version may contain breaking changes. The component APIs, conventions, and file structure may differ from what is included in your training data. Before writing any code, please read https://ant.design/docs/react/for-agents.md and https://raw.githubusercontent.com/ant-design/ant-design-cli/main/skills/antd/SKILL.md, pay attention to deprecation warnings, and follow the instructions to use Ant Design.」與「If you can install skills, run: npx skills add ant-design/ant-design-cli」。

版本差異：目前官方站、`llms-full.txt`、`design.md`、`ant-design/SKILL.md` 都以 v6 為目標（`ant-design/SKILL.md`："Target: `antd@^6` + React 18-19"）。使用者是 5.22。`https://5x.ant.design/llms.txt` 回傳 404。`@ant-design/cli` 宣稱支援 v3 至 v6，並有 `--version` 旗標。

### 7.2 這些 skill 要求代理做什麼（附原文）

| 結論 | 檔案 | 原文句 |
|------|------|--------|
| 寫元件前一定先查 API | `ant-design-cli/skills/antd/SKILL.md` | "Before writing any antd component code, look up its API first — don't rely on memory." |
| 依專案版本查詢 | 同上 | "Match the user's version — Knowledge queries (`list/info/doc/demo/token/semantic/changelog`) support antd v4+." |
| 改完後跑 lint | 同上 | "Lint after changes — After writing or modifying antd code, run `antd lint` on the changed files to catch deprecated or problematic usage." |
| 主題用法：先全域 token，再元件 token，再 `classNames`/`styles` | `antd-skill/skills/ant-design/SKILL.md` | "Styling: tokens first, then `classNames`/`styles`; avoid global overrides." |
| 禁止依賴內部選擇器 | 同上 | "Do not rely on internal DOM or `.ant-*` selectors." |
| 回歸檢查表 | 同上 | "Table has stable `rowKey`; sort/filter/pagination entry is unified." |
| 要求 Pro 端路由與權限和後端一致 | 同上 | "Pro route/menu/access remain consistent with backend enforcement." |
| 範圍：只給決策指引 | 同上 | "Focus: decision guidance only; no end-user tutorials." |
| 設計語言文件的主題擴充原則 | `design.md` / ui-skills 副本 | "Avoid generating custom CSS rules that bypass tokens, algorithms, `theme.components`, CSS variables, or extracted static styles" |

### 7.3 官方設計指引中的頁面層級模式（`docs/spec/*.md`）

`llms.txt` 列出下列規範頁。讀取範圍與重點如下。這些頁的版型示意圖是圖片，本次讀不到。`data-list`、`navigation`、`research-*` 的 frontmatter 為 `skip: true`（是否顯示於官網導覽：未查證）。

| 頁面 | 讀取範圍 | 頁面層級重點（原文） |
|------|----------|------|
| `detail-page.md`（詳情頁，group: Design Patterns, type: Template Document） | 全文 | "Direct: Try to display the information as flat as possible. Do not hide or fold up the content if not necessary." / "Clear hierarchy: ... put information in levels and groups, following the principle of proximity." / 分隔方式："Non-column split lines: to separate relevant contents;" "Full-column split lines: to divide the content into multiple parts;" "Cards: to display information on one topic;" "Tabs: to put the information into groups according to some feature, such as version, intention, phase, etc." |
| 同上：模板選擇 | 同上 | "Basic Detail Pages directly show all the information at the same level of hierarchy. We suggest such method of displaying data." / 進階詳情頁："When the detail page has large and complex content, it has to be split into multiple tabs to guide users to browse information." |
| `data-list.md`（資料列表） | 全文 | 三種型式：Table（"Emphasis on browsing."）、List、Card list。分頁預設："Recommended by default. When used, when the content of the page is less than one page, the pager will not be displayed." 進詳情的開法："Expand the list on the same page"、"Drawer Expand"、"jump to independent page"。批次："When the user checks the item, the batch operation mode is triggered, and the list toolbar calls out the batch operation toolbar." 版面："List layouts are usually tiled from top to bottom, in the following order." 新增："New button in the upper right corner" |
| `research-list.md`（列表頁） | 全文 | 版面："Single Column Layout: Stack from top to bottom, with the data filtering module at the top." / "Two-Column Layout: Place the data filtering module in the sidebar when there are many filtering conditions and ample horizontal space." / "Page-level batch operations affect the entire page and can be placed at the bottom of the page." 模板："Template - Query Table"、"Standard List"、"Card List"、"Search List"、"Member Management" |
| `research-form.md`（表單頁） | 約九成（略過圖片與空行） | "Basic Layout: Arrange all the information to be filled out from top to bottom in a single column within one area" / 四種漸進版面："Basic Layout"、"Weak Grouping"、"In-Area Grouping"、"Card Grouping" / 設定頁："Number <7, grouping is not recommended;" "Number 7~15, grouping is recommended;" "Number >15, tab grouping is recommended." / 子項目編輯："Editable Table: Recommended when the number of form items is between 2 and 5" "Drawer Editing: Recommended when the number of form items is >8." |
| `buttons.md`（按鈕） | 全文 | "Primary Button ... There is at most one primary button per a button group." / "Text Button: Low emphasis and light-weight button type, such as actions in a table." / 置放："Page/Card/Section presents a subject, where it could be broken into 3 areas: Header ... Body ... Footer" / "Place buttons in the users' reading pattern for the ease of discovery" |
| `navigation.md` | 約九成 | "Side Navigation: ... It is suitable for multi-level, operation intensive and dashboard-like web apps." / "Top navigation ... It is suitable for landing pages and consumer facing web apps." / "Avoid using breadcrumb as much as you can, especially when page contains other navigation components sufficiently telling where users are." |
| `layout.md` | 全文 | "Left-Right Layout ... the common practice is to fix the left navigation bar and dynamically scale the right work area." / "The base unit of the grid is 8" / "Ant Design uses a 24-grid architecture." |
| `research-workbench.md`（工作台） | 全文 | "Display modules related to daily work, keeping the total number of modules between 5-9;" |
| `visualization-page.md`、`data-display.md`、`data-entry.md`、`feedback.md`、`proximity.md`、`alignment.md`、`overview.md`、`research-overview.md` | 只列章節標題或未讀 | 未讀內容 |

頁面模式文件中引用的範本網址（只記錄，未開啟）：`https://preview.pro.ant.design/profile/basic`、`.../profile/advanced`、`.../list/table-list`、`.../list/card-list`、`.../dashboard/monitor`、`.../user/login`。Ant Design Pro 程式庫（ant-design/ant-design-pro，星數 38,960）與 ProComponents（ant-design/pro-components，星數 4,856）只查了星數與授權，未讀內容。

### 7.4 技術前提與衝突

- 這組官方資源本身就是以 Ant Design 為前提；沒有與 Ant Design 衝突的規定。
- 與使用者技術組合相關的原文：`antd-skill/skills/ant-design/SKILL.md`："Provider baseline: CSR -> `ConfigProvider`; SSR -> `ConfigProvider` + `StyleProvider`."；"Provider: one root `ConfigProvider` unless strict isolation is required."
- 未提及 styled-components（兩個 skill 與 for-agents 全文搜尋無命中）。
- 版本風險：同 7.1，目標為 v6，使用者為 5.22。

### 7.5 頁面層級的組合

有（7.3），內容限於文字描述；列表頁、詳情頁、表單頁、資料列表、按鈕置放、工作台皆有。不是代理 skill 格式，是設計規範文件；`llms.txt` 只提供連結。沒有官方檔把這些規範包成給代理的檢查清單。

### 7.6 做之前或做之後

查詢類 skill（`antd`）是做之前與做之後（寫前查 API、寫後 `antd lint`）。設計規範頁（7.3）是做之前的參考；沒有做之後的檢查流程。

### 7.7 安裝與執行（只記錄，未執行）

- `ant-design/ant-design-cli/skills/antd/SKILL.md`："which antd || npm install -g @ant-design/cli"（原文："Before first use, check if the CLI is installed. If not, install it automatically:"）。允許的指令（frontmatter `allowed-tools`）含 "Bash(antd *)"、"Bash(npm install -g @ant-design/cli*)"。
- ant-design/antd-skill 的 `skills/antd/SKILL.md` 原文："Whenever you use any `antd` CLI command and notice something wrong, you should proactively initiate a bug report using `antd bug-cli`."，並寫明提交前需使用者確認："Show the report to the user: "I noticed an issue with the CLI while working. Here's a bug report — shall I submit it?""。ant-design-cli 版 SKILL.md 另有 "**Opt-out:** If the environment variable `ANTD_NO_AUTO_REPORT=1` is set, skip all bug-reporting suggestions entirely"。
- 官方 for-agents 提示詞中的安裝句：`npx skills add ant-design/ant-design-cli`；antd-skill README：`npx skills add ant-design/antd-skill`。
- MCP：`{"command": "npx", "args": ["-y", "@ant-design/cli", "mcp"]}`（`for-agents.md`）。
- `antd migrate 4 5 --apply ./src`：產生遷移提示詞（原文 "Generate agent-friendly auto-migration prompt (does not modify files)"）。

---

## 8. 其他候選（只讀 SKILL.md 或說明，未全讀）

| 候選 | 網址 | 星數／最後推送／授權 | 讀取範圍與重點 |
|------|------|------|------|
| nextlevelbuilder/ui-ux-pro-max-skill | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 148,845／2026-11-10／MIT | 讀 `README.md` 關鍵字行與 `.claude/skills/ui-ux-pro-max/SKILL.md` 關鍵字行，未全讀。含 `--density` 旗標（"Dense/dashboard (8-32px spacing scale)"）、22 種技術棧（含 shadcn，未見 Ant Design）、資料檔 `data/*.csv`；執行方式為 Python 查詢腳本。 |
| Leonxlnx/taste-skill | https://github.com/Leonxlnx/taste-skill | 114,555／2026-11-08／MIT | 只讀程式庫說明："Agent skills that give coding agents taste: art direction, reference images and a browser check instead of generic AI pages"。內容未讀。 |
| vercel-labs/agent-skills 內 web-design-guidelines | https://github.com/vercel-labs/agent-skills（路徑 `skills/web-design-guidelines/SKILL.md`） | 33,982／2026-11-12／授權欄位空白 | SKILL.md 全文；所引用的規則檔 `vercel-labs/web-interface-guidelines`（星數 1,165、MIT）的 `command.md`（8KB）只讀關鍵字行。內容偏無障礙、焦點、動畫、表單等低層規則，沒有頁面層級版型；原文："Fetch fresh guidelines before each review:" 並指向 `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`（每次審查都從遠端抓規則）。 |
| nexu-io/open-design 內 design-systems/dashboard | https://github.com/nexu-io/open-design | 107,434／2026-11-13／Apache-2.0 | 只看到檔案清單（`DESIGN.md`、`components.html`、`design-tokens.json`），內容未讀；它是設計系統檔，不是 SKILL.md（第三方目錄頁稱有 dashboard skill，未在程式庫內查證）。 |
| 第三方目錄頁提到的 skill（`admin-design`、`dashboard-design`、`office-web-ui-system` 副本等） | claudeskills.info、skillsmp.com 等 | 目錄頁數字不採信 | 只出現在搜尋結果摘要，未讀原始檔，本檔不列內容。 |

---

## 比較表

| 來源 | 熱門程度（星數） | 技術前提 | 有沒有頁面層級組合 | 做前或做後 | 與 Ant Design 是否衝突 |
|------|------|------|------|------|------|
| Impeccable | 109,185 | 未硬性綁特定樣式方法；偵測 `.tsx` 與 CSS；需下載並執行二進位 | 沒有列表／詳情／表單版型；有通則（閱讀順序、分組、密度、單一主要操作） | 兩者都有 | 未見硬性禁止；有張力句（見第 1 節）；對 Ant Design 與執行期 CSS-in-JS 的偵測支援：未查到 |
| ui-skills（baseline-ui 等） | 11,016 | `baseline-ui` 硬性 Tailwind、`motion/react`、`cn` | 沒有 | 前（路由）、兩者（baseline-ui）、後（improve-ui） | `baseline-ui` 與 styled-components 並用直接衝突；其餘無 |
| anthropics frontend-design | 193,846 | 無 | 沒有（偏對外網頁首屏） | 前為主，含自我批判 | 未見衝突 |
| interface-design（Dammyjay93） | 5,968 | 無硬性；範例用 Tailwind；優先沿用專案設計系統 | 沒有版型；有通則 | 兩者都有 | 未見硬性禁止；有張力句（見第 4 節） |
| ui-craft（educlopez） | 452 | CSS 為主附 Tailwind 對照；偵測 styled-components | 有：儀表板三版型、詳情頁與資料表完整度清單、表單規則 | 兩者都有 | 有明確衝突句：資料表要求自建（不用主題化資料格）、禁用徽章、工具列禁用實心主按鈕（見第 5 節） |
| office-web-ui-system | 69 | 無；有專章對應各框架 | 有：列表、詳情、表單、儀表板四型，含主要操作位置與反模式 | 兩者都有 | 未見衝突；預設玻璃／藥丸頂欄風格但明寫要適應既有產品 |
| Ant Design 官方（for-agents、llms.txt、CLI skill、spec 頁） | ant-design 100,185；CLI 261；antd-skill 139 | 以 Ant Design 為前提；目標版本 v6；未涵蓋 styled-components | 有（文字版）：詳情頁、列表頁、表單頁、資料列表、按鈕置放；圖片版型本次未讀到 | 查詢類為做前與做後；規範頁為做前 | 無衝突；版本落差：官方資源目標為 v6，使用者為 5.22 |
| ui-ux-pro-max | 148,845 | 22 種技術棧（未見 Ant Design）；Python 腳本 | 未讀 | 未讀（以查詢資料庫為主） | 未查證 |
| web-design-guidelines（Vercel） | 33,982 | 無 | 沒有 | 做後（審查） | 未見衝突；每次審查從遠端抓規則 |
| taste-skill | 114,555 | 未讀 | 未讀 | 未讀 | 未查證 |
| open-design dashboard | 107,434 | 未讀 | 未讀 | 未讀 | 未查證 |

## 未解與待主對話查證項

1. Impeccable 的偵測器與掛鉤在 Ant Design 加 styled-components 專案的實際表現，未實測，來源文字也未說明。
2. Ant Design 規範頁中圖片版型內容未讀到；`skip: true` 頁面在官網是否可見，未查證。
3. ui-craft 中未讀的參考檔（`craft-intent.md`、`state-design.md`、`components.md` 等）可能含更多頁面層級內容。
4. `ant.design/design.md` 與 ui-skills 內 `ant-design.md` 僅確認位元組數相同，未逐字比對。
5. 各 skill 與 Impeccable 的星數與日期為 2026-11-13 當日 API 值，之後會變動。

---

## 9. 細節層：主對話讀全文的摘錄（2026-11-13）

本節由主對話撰寫。讀取範圍見票 42 的 Answer。下表每一句原文都用指令與下載的原始檔逐字比對，26 句全部相符。

來源檔的根目錄：`/tmp/workflow-rebuild-ticket42-src-20261113/src/`。`D/SKILL.md` 不是 interface-design，是另一個畫圖 skill（`documd-visuals`），與本票無關。

### 原文句

| 主題 | 結論 | 檔案 | 原文句 |
|------|------|------|--------|
| 字級 | interface-design：字級由代理挑比例計算 | `.claude/skills/interface-design/SKILL.md` | Don't pick sizes by feel. Pick a ratio and step it |
| 字級 | interface-design：層級同時用字級、字重、顏色 | `.claude/skills/interface-design/SKILL.md` | Build from three levers together (size, weight, color/opacity), never size alone. |
| 字級 | interface-design：避開預設字型 | `.claude/skills/interface-design/SKILL.md` | **Default typography** — system/Inter fonts and size-only hierarchy where a direction was set |
| 衝突 | interface-design：每個介面都要不同 | `.claude/skills/interface-design/SKILL.md` | **no two interfaces should look the same.** |
| 提示文字 | interface-design：唯一談到文案的句子 | `.claude/commands/design-review.md` | Read every visible string as a user would — not for typos, for truth. |
| 衝突 | interface-design：專案設計系統已決定的事不算缺失 | `.claude/commands/design-review.md` | If the project's design system already decided it, it's a decision, not a defect. |
| 字級 | Impeccable：後台介面用固定字級 | `skill/reference/operate.md` | **Fixed rem scale, not fluid.** |
| 字級 | Impeccable：單一字族 | `skill/reference/operate.md` | **One family is often right.** |
| 字級 | Impeccable：級距小 | `skill/reference/operate.md` | **Tighter scale ratio.** 1.125–1.2 between steps is typical. |
| 字級 | Impeccable：同一種角色保持一致 | `skill/reference/typeset.md` | Keep repeated roles consistent across screens and states. |
| 字級 | Impeccable：至多 3 至 4 個字級 | `skill/reference/distill.md` | **Limit typography**: One font family, 3-4 sizes maximum, 2-3 weights |
| 字級 | Impeccable：不只靠字級分層級 | `skill/reference/typeset.md` | Combine size, weight, space, and tone deliberately instead of asking size alone to do all the work. |
| 提示文字 | Impeccable：說明文字不重述控制項；少見細節收起來 | `skill/reference/clarify.md` | Helper text answers an implicit question instead of restating the control. Use progressive disclosure for uncommon detail. |
| 提示文字 | Impeccable：灰字是範例不是標籤 | `skill/reference/clarify.md` | Use persistent labels; placeholders are examples, not labels. |
| 提示文字 | Impeccable：每件事只說一次 | `skill/reference/clarify.md` | Say each idea once. |
| 提示文字 | Impeccable：要求資料的理由只在不明顯時才說明 | `skill/reference/clarify.md` | Explain why information is requested only when it is not obvious. |
| 提示文字 | Impeccable：文案盡量短，但不刪意思與補救方式 | `skill/reference/clarify.md` | The final copy is as short as it can be without removing meaning or recovery. |
| 提示文字 | Impeccable：刪掉重複的文案 | `skill/reference/distill.md` | **Remove redundant copy**: No headers restating intros, no repeated explanations, say it once |
| 提示文字 | Impeccable：破壞性操作要寫出對象與後果 | `skill/reference/clarify.md` | For destructive actions, name the object and consequence. |
| 衝突 | Impeccable：內文至少 16px，附例外條件 | `skill/reference/typeset.md` | Use 1rem / 16px as the ordinary web body floor unless a dense role, platform convention, or user setting justifies otherwise. |
| 衝突 | Impeccable：灰底加單一強調色被評為不合格 | `skill/reference/mode-operate.md` | A grey screen with one accent colour is the category default without the category's polish, not restraint. |
| 衝突 | Impeccable：評審的說明文件一項把情境提示列為加分 | `skill/reference/critique.md` | Contextual help (tooltips, inline hints, guided tours) |
| 程式 | Impeccable：每個對話先執行啟動腳本 | `skill/SKILL.src.md` | Run `<skill-base-dir>/scripts/impeccable context` once per session |
| 程式 | Impeccable：啟動腳本會下載執行檔 | `skill/SKILL.src.md` | The launcher runs a self-contained binary that ships next to it or is downloaded once on first run |
| 程式 | Impeccable：字體檢查要跑偵測程式 | `skill/reference/typeset.md` | {{scripts_path}}/impeccable detect --json --scope type [target files or dirs] |
| 程式 | Impeccable：評審沒跑偵測程式就算失敗 | `skill/reference/critique.md` | A skipped detector is a failed critique run unless `impeccable detect` is missing or crashes after a real attempt |

### Prototype 現況的統計

統計日期 2026-11-13，範圍是 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/` 的 258 個 `.js` 與 `.jsx` 檔，讀的是主檢出當時的內容。數字是關鍵字命中的行數。

| 項目 | 搜尋樣式 | 命中行數 |
|------|---------|---------|
| 樣式表寫法的手寫字級 | `font-size:` 後接數字與 px | 12 |
| 行內寫法的手寫字級 | `fontSize:` 後接數字 | 88 |
| 套用 erp 字體階層 | `typography.` 或 `theme.typo` | 17 |
| 手寫字級的值 | 同上兩種寫法 | 11px：5、12px：68、13px：20、14px：2、16px：1、18px：1、22px：1、24px：2 |
| 手寫字重的值 | `font-weight:` 或 `fontWeight:` 後接數字 | 500：3、600：2、700：7 |
| 提示泡泡 | `<Tooltip` 或 `tooltip=` | 261（含引入行與 `<TooltipLabel`） |
| 欄位標籤旁的問號說明 | `<TooltipLabel` | 63 |
| 超過 20 個字的提示 | `title=` 或 `tooltip=` 的字串長度大於 20 | 55（`title=` 也會命中視窗標題，數字偏高） |
| 輸入框灰字 | `placeholder=` | 323 |
| 灰字重複欄位名稱 | `placeholder="請輸入` 或 `placeholder="請選擇` | 86 |
| 欄位下方說明 | `extra=` | 26 |
| 次要灰字 | `type="secondary"` | 306 |

- 各模組的手寫字級行數：work-orders 26、orders 21、recipes 13、print-items 12、production-floor 11、dispatch-orders 8、_components 3、after-sales 2、prepress-review 2、payment 1、quote-prototype 1、qc-shipping 0、sample-resource 0。
- erp 實際載入的字重是 400、500、700（`apps/erp/src/app/layout.js` 第 44 行的字型網址）。
- 13px 的例子：`orders/_components/detail/billing/ReconciliationPanel.js` 有 7 處 `fontSize: 13`。
- 長提示的例子在 `production-floor/transfers/page.js`，全文見票 42 的 Answer。
- erp 的 `prototype-from-prompt/SKILL.md` 用關鍵字（字級、font、typograph、提示、tooltip、placeholder、文案、extra）搜尋，沒有管字級與提示文字的句子。

### 字重與顏色（Miles 2026-11-13 擴大範圍後補查）

Miles 的原話「是字級沒錯，字重與顏色的選用也算」由上一個對話轉達。主對話在該對話的紀錄裡搜尋到這句原文。下表 8 句原文同樣逐字比對相符。

| 主題 | 結論 | 檔案 | 原文句 |
|------|------|------|--------|
| 字重 | interface-design：同一字級用字重分三層，用到 600 | `.claude/skills/interface-design/SKILL.md` | `value: 600 / primary`, `label: 500 / secondary`, `meta: 400 / muted` |
| 顏色 | interface-design：文字顏色四階各有用途 | `.claude/skills/interface-design/SKILL.md` | Primary, secondary, tertiary, muted (default / supporting / metadata / disabled). |
| 顏色 | interface-design：只用一個強調色 | `.claude/skills/interface-design/SKILL.md` | **One accent, used with intention**, beats five colors used without thought. |
| 顏色 | interface-design：色盤要從產品的世界找（與 erp 衝突） | `.claude/skills/interface-design/SKILL.md` | Your palette should feel like it came FROM somewhere, not applied TO something. |
| 字重 | Impeccable：至多 2 至 3 種字重 | `skill/reference/distill.md` | **Limit typography**: One font family, 3-4 sizes maximum, 2-3 weights |
| 顏色 | Impeccable：強調色只用在主要操作、目前選取、狀態指示 | `skill/reference/operate.md` | Accent color used for primary actions, current selection, and state indicators only, not decoration. |
| 顏色 | Impeccable：狀態用語要標準化 | `skill/reference/operate.md` | State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success, info. Standardize these. |
| 顏色 | Impeccable：語意色要搭配顏色以外的提示 | `skill/reference/distill.md` | keep semantic colors (success, warning, error) and pair each with a non-color cue |

| 項目 | 搜尋樣式 | 命中行數 |
|------|---------|---------|
| 手寫色碼 | 六碼色碼 | 25 行，24 種不同的值 |
| 取用 erp 色彩 token | `theme.colors.` | 100 |
| 狀態對照表裡的顏色名 | `color:` 後接色名字串 | default 51、success 24、blue 22、processing 18、green 17、gold 15、red 10、purple 10、error 10、orange 9、warning 8、cyan 8、geekblue 6、lime 3 |
| 用元件屬性加粗 | `<Text` 帶 `strong` | 28 |

- 手寫色碼的例子：`#1677ff`、`#ff4d4f`、`#fa8c16` 各 2 處，是 Ant Design 的預設色，不是 erp 的色彩 token（erp 主色是 `#2688ff`）。
- 狀態顏色名共 14 種。語意色名（default、success、processing、error、warning）約 111 行；調色盤色名（blue、green、gold、red、purple、orange、cyan、geekblue、lime）約 100 行。
- erp `Designs.md` 對「什麼情境用哪一個」的規定：字級沒有；字重只有「標題用 700」；顏色有用色紀律（主色只有藍、狀態色只用於狀態、紫色只作點綴）與 6.4 節（狀態用 `success` 或 `error` 的標籤），但沒有「哪個業務狀態用哪個顏色」與「文字四階各用在哪」。
