# 14c 原型與測試盤點（erp 程式庫架構面檔、測試目錄、情境與測試對照）

主對話抽查（2026-11-11）：相符：erp 三份指引 70、32、237 行；OpenSpec 區塊與 `openspec/` 殘留；兩套 skill 目錄各 7 個；情境目錄 462 節；抽查四張零引用情境卡。未查證：最近一次測試結果（工作樹內找不到 `results.json`，檔只在主檢出本機）；`__checks__` 腳本數（查到 3 個資料夾，未數檔）。其餘數字未逐項查證。


盤點日：2026-11-11。唯讀。數字附算法；沒有實際查到的寫「未查證」。腳本都在工作階段暫存資料夾（`.../scratchpad/chain.py`、`stats.py`、`stats2.py`、`sec6.py`），沒有寫進任一程式庫。

## 一、摘要

| # | 結論 |
|---|------|
| 1 | erp 程式庫有三組給代理看的指引：根目錄 `AGENTS.md`（70 行）、根目錄 `CLAUDE.md`（32 行）、`.claude/CLAUDE.md`（237 行）。前兩者開頭的 OpenSpec 管理區塊逐字相同，且指示代理遇到「規劃、spec、change、proposal」字眼就讀 `openspec/AGENTS.md`；`openspec/` 實際只有一個 2026-03-18 的 change（移到 pnpm 單一程式庫）。這與 Sens 的規劃流（`.scratch/<主題>/spec.md`）互相衝突。 |
| 2 | erp 有兩套技能目錄：`.claude/skills/`（7 個技能，含 Miles 流程核心的 `prototype-from-prompt`、`prototype-publish`）與 `.agents/skills/`（7 個 Codex 包裝版，內容與前者不同，另多 `project-guidance`）。Miles 的流程只提到前者。 |
| 3 | `MOCK-DATA-CHAIN.md` 1382 行：約 657 行是表格列（資料清單與少量算式表），約 70 至 150 行是規則敘述，另有 80 行散文帶「（2026-xx-xx …）」日期括號、359 行含年月日。資料清單與各模組 `mock-data.js`（合計 15745 行）是同一批資料寫兩處。被 48 個 Sens 檔、erp 內 10 個檔引用，其中 Sens 內現行檔（排除 `memory/erp` 底下的規劃歸檔與稽核報告、`.scratch`）有 19 個。 |
| 4 | 原型分支與開 PR 的說法有三種（Sens `AGENTS.md` 兩處、erp 技能兩處），git 現況是：`prototype/production-stage` 長期存在，並以 PR 方式併入 main（2026-10-28 的 #253 為 squash）；另有 `develop` 供測試機發布。 |
| 5 | Sens `erp-prototype-tests/` 版控檔 218 個：`tests/` 底下 203 個（測試檔 189，畫面 97、純函式 92；章內輔助檔 12、`_helpers.mjs` 1、`auth.setup.mjs` 1），`tests/` 之外 15 個（設定、文件、腳本、回報器）。算法：`git ls-files erp-prototype-tests \| wc -l` 與 `git ls-files erp-prototype-tests/tests \| wc -l`。情境目錄 `###` 節 462 節（唯一節號 460 個，7.26、10.19 各兩節），第十六章另有 21 條表列待辦，不是 `###` 節。 |
| 6 | 情境目錄統計表寫「正流程 459、合計 480」，實際 `###` 節 462；差在第十四章表列 47、實際 50（14.48 至 14.50 未更新）。先前 03 號盤點的「差 17 條」成因：480 是 459 加第十六章 21 條；`###` 標題 462 不含第十六章。 |
| 7 | 情境與測試對照：462 節中 454 節有標題以同一節號開頭的測試；8 節沒有（其中 6 節在目錄內另列測試路徑或在其他檔出現節號）；僅 7.43 與 15.14 兩節完全找不到測試。第十六章 21 條皆無測試。fixme 測試 4 條（1.1、5.9、6.3、6.6），無 skip、todo。 |
| 8 | 45 張 wiki 情境卡（含 2 張規範與範例）中，6 張非規範卡完全不被情境目錄任何 `###` 節或第十六章表列引用；另 2 張（訂單異動流程、退款執行）只被第十六章待辦引用。 |
| 9 | 462 節中 153 節的「依據」行沒有任何 07 情境卡名（引用的是規則卡、實體卡、活動清單卡等）。以卡名統計的覆蓋率因此只看得到 309 節。 |
| 10 | 最近一次測試結果只留在本機：`~/.claude/erp-test-progress/results.json`，2026-11-05 一輪，畫面測試 191 條記錄：通過 187、失敗 2、略過 2；`live.json` 該輪 57 條：通過 55、失敗 0、略過 2。兩檔不一致，成因未查證。 |

## 二、erp 程式庫架構面檔逐項表

路徑起點 `/Users/b-f-03-029/erp`。行數用 `wc -l`；最後提交日用 `git log -1 --format=%ad --date=short -- <檔>`（取最後一筆，所在分支 `prototype/production-stage`）。AGENTS.md 規定「erp repo 不放測試檔、不動 erp skill 與 `(prototype)/README.md`」，故下列檔多屬前端團隊持有；去留欄是「從零建立會不會放」的判斷，動手前需前端主管同意，另在第八節標示。

### 2.1 根目錄與 `.claude/`、`.agents/`

| 檔 | 行數 | 用途 | 最後提交 | 去留 | 理由 |
|---|---|---|---|---|---|
| `AGENTS.md` | 70 | 前 20 行是 OpenSpec 管理區塊；其後為 Codex 雙軌指引（技術慣例的正本表、`.agents` 與 `.claude` 的邊界）與設計系統指向 `Designs.md` | 2026-07-13 | 待判 | 內容服務 Codex 雙軌；Miles 流程只用 Claude。前端團隊是否仍用 Codex 未查證 |
| `CLAUDE.md` | 32 | OpenSpec 區塊（與 `AGENTS.md` 前 20 行逐字相同）加設計系統指向 `Designs.md` | 2026-06-10 | 待判 | 與 `AGENTS.md` 重複；從零建立只會留一份入口 |
| `.claude/CLAUDE.md` | 237 | 開發指南：快速命令、架構、工廠模式、開發規範、CI/CD | 2026-04-09 | 待判 | 與 `docs/DEVELOPMENT_GUIDE.md`、`docs/ARCHITECTURE_GUIDE.md` 是否重複未查證（`AGENTS.md` 稱技術慣例正本在 `docs/`） |
| `.claude/settings.local.json` | 7 | 個人本機權限（允許 `git restore *`） | 未進版控 | 留 | 不屬專案內容 |
| `.claude/commands/openspec/apply.md` | 28 | OpenSpec 指令 | 2026-03-18 | 刪 | 見下列 `openspec/` |
| `.claude/commands/openspec/archive.md` | 32 | 同上 | 2026-03-18 | 刪 | 同上 |
| `.claude/commands/openspec/proposal.md` | 33 | 同上 | 2026-03-18 | 刪 | 同上 |
| `openspec/`（8 個版控檔：`AGENTS.md` 522 行、`project.md`、`changes/migrate-to-pnpm-monorepo/` 5 檔） | 約 522 加 7 檔 | OpenSpec 規格流程與一個已完成的移轉 change | 2026-03-18 | 刪 | Sens 規劃流不用 OpenSpec；唯一 change 是 03-18 的移轉；`prepress-review/README.md` 引用的 `specs/prepress-review` 不存在（`openspec/` 下只有 `AGENTS.md`、`changes`、`project.md`） |
| `.claude/skills/prototype-from-prompt/SKILL.md` | 114 | 把 PM 需求變成 `(prototype)/` 頁面的流程；含分支規則、PR 標題格式 | 2026-09-16 | 留 | Miles 流程核心（Sens `AGENTS.md` 指名 MUST 經此技能） |
| `.claude/skills/prototype-publish/SKILL.md` | 131 | 「發布」流程：分支以 merge commit 併入 develop 觸發測試機部署 | 2026-10-15 | 留 | 同上 |
| `.claude/skills/prototype-publish/scripts/preflight.sh` | 63 | 發布前檢查腳本 | 2026-09-16 | 留 | 發布技能附屬 |
| `.claude/skills/design-qa/SKILL.md` | 240 | Figma 與實頁視覺比對 | 2026-04-21 | 待判 | Miles 流程未提到 Figma 稽核；是否仍有人用未查證 |
| `.claude/skills/figma-analyze/SKILL.md` | 244 | Figma 規格擷取 | 2026-04-21 | 待判 | 同上 |
| `.claude/skills/figma-feature/SKILL.md` | 219 | Figma 轉功能實作 | 2026-04-21 | 待判 | 同上 |
| `.claude/skills/documentation-standards/SKILL.md` | 178 | 技術文件撰寫標準 | 2026-02-02 | 待判 | 服務 `docs/` 技術文件，非原型流程 |
| `.claude/skills/workflow-pr-review/SKILL.md` | 491 | PR 審查流程 | 2026-04-09 | 待判 | 前端團隊審 PR 用；Miles 流程未引用 |
| `.agents/skills/` 7 個 `SKILL.md`（design-qa 21、documentation-standards 20、figma-analyze 22、figma-feature 23、project-guidance 36、prototype-from-prompt 21、workflow-pr-review 25） | 168 | Codex 包裝版；與 `.claude/skills/` 同名檔內容不同（`diff -rq` 確認 6 檔相異）；`project-guidance` 只存在這側 | 2026-07-12 | 待判 | Codex 雙軌是否保留是前端團隊決定 |
| `.husky/pre-commit` | 1 | 提交前掛鉤 | 未查證 | 留 | 兩軌共用 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 31 | PR 範本（`prototype-from-prompt` 要求照填四節） | 未查證 | 留 | 技能引用 |
| `.github/workflows/ci.yml`（37）、`design-tokens.yml`（45） | 82 | CI 與設計權杖同步 | 未查證 | 留 | 從零建立也會有 |
| `.github/workflows/claude.yml`（57）、`claude-code-review.yml`（157）、`claude-docs-update.yml`（72） | 286 | 以 Claude 觸發審查與文件更新 | `claude.yml` 2026-02-06；其餘未查證 | 待判 | 是否仍啟用未查證（不讀遠端設定） |
| `Designs.md` | 264 | 視覺系統正本（Ant Design 加 styled-components，權杖來源） | 2026-10-05 | 留 | 技能與 `(prototype)/README.md` 都要求先讀 |
| `README.md` | 155 | 專案說明 | 2026-03-18 | 待判 | 未逐行核對與現況差異 |
| `MIGRATION.md` | 82 | 單一程式庫移轉說明 | 2026-03-18 | 刪 | 移轉已於 2026-03-18 完成，屬歷史紀錄 |
| `docs/pm-prototype-workflow.md`（19 個版控檔在 `docs/`：6 份指南、`recipes/` 2 份、`component-catalog.md`、`plans/`、`superpowers/` 等） | 未逐檔量 | 原型操作流程與元件目錄 | `pm-prototype-workflow.md` 2026-09-16；`docs/plans`、`docs/superpowers` 2026-07-24 | 待判 | `(prototype)/README.md` 引用 `pm-prototype-workflow.md`、`component-catalog.md`、`recipes/`，這三者留；`plans/`、`superpowers/`（8 檔）是否仍用未查證 |

### 2.2 `apps/erp/src/app/(prototype)/` 說明類檔

| 檔 | 行數 | 用途 | 最後提交 | 去留 | 理由 |
|---|---|---|---|---|---|
| `README.md` | 38 | route group 說明、放置規則（模組層與腳手架層）、handoff 流程 | 2026-06-12 | 留 | 技能引用；Sens 規定不動 |
| `MOCK-DATA-CHAIN.md` | 1382 | mock 資料主鏈（九條鏈加鏈外資料、主檔、核對表） | 2026-11-05 | 待判 | 見第三節：資料清單與 `mock-data.js` 重複，規則敘述與 wiki 重複，帶日期的改版紀錄混在本文 |
| `prepress-review/README.md` | 21 | 審稿模組需求正本、依賴與 handoff 注意 | 2026-09-11 | 改寫 | 引用 `openspec specs/prepress-review`（不存在）；「模組依賴 orders」那段有用 |
| `DESIGN.md` | 不存在 | 任務要求查「任何 DESIGN.md」；`find` 整個 `(prototype)/` 只有上述 3 個 `.md`，根目錄的是 `Designs.md` | — | — | — |

### 2.3 `(prototype)/` 下的 mock 與 `_lib`

算法：`find <模組> -name 'mock-data*.js'` 與 `find <模組> -path '*_lib*' -type f` 後 `wc -l`。`orders`、`quote-prototype` 的 `mock-data.js` 在模組根，不在 `_lib/`；其餘在 `_lib/`（故 `_lib` 行數含 mock）。`_lib` 檔數含 `__checks__/` 內的檢查腳本。

| 模組 | 版控檔數 | `mock-data.js` 行數 | `_lib` 檔數 | `_lib` 行數 | permissions 檔 | store 檔 | constants 檔 |
|---|---|---|---|---|---|---|---|
| `orders` | 60 | 5021（模組根） | 20 | 6291 | 1 | 1 | 0 |
| `work-orders` | 48 | 2729 | 28 | 11379 | 1 | 1 | 0 |
| `production-floor` | 33 | 4541 | 13 | 8930 | 1 | 1 | 0 |
| `print-items` | 34 | 285 | 10 | 1904 | 1 | 1 | 0 |
| `qc-shipping` | 22 | 1040 | 11 | 4123 | 0 | 1 | 0 |
| `quote-prototype` | 11 | 1512（模組根） | 6 | 978 | 1 | 1 | 1 |
| `dispatch-orders` | 13 | 62 | 8 | 1521 | 1 | 2 | 0 |
| `recipes` | 13 | 520 | 4 | 1072 | 1 | 1 | 0 |
| `payment` | 9 | 35 | 5 | 298 | 0 | 0 | 0 |
| `prepress-review` | 8 | 無（讀 `orders` 的 mock） | 1 | 221 | 0 | 0 | 0 |
| `after-sales`、`sample-resource` | 各 1 | 無 | 0 | 0 | 0 | 0 | 0 |
| 腳手架 `_lib/`（13 檔） | 13 | 無 | 13 | 6572（`access-activities.js` 佔 5155，由 Sens 腳本產生） | `access-control.js` 210 | `sessionStore.js` 89、`notificationStore.js` 58 | 0 |
| 腳手架 `_components/` | 2 | 無 | — | — | — | — | — |
| 合計 `mock-data.js` | 9 個 | 15745 | | | | | |

`constants` 檔只有 `quote-prototype` 一個；Sens 的 AGENTS 與 README 提到的「`_lib`（constants、permissions、store）」三種檔，現況並非每個模組都有。

另有 `__checks__/` 檢查腳本 10 個檔共 3649 行（`work-orders` 6 檔、`production-floor` 1、`orders` 1，加載入器），位於 erp 程式庫內，與 Sens `AGENTS.md`「erp repo 不放測試檔」並存；其中 `mock-consistency.check.mjs`（1145 行）讀 `MOCK-DATA-CHAIN.md`。

## 三、MOCK-DATA-CHAIN 分段

檔案 `apps/erp/src/app/(prototype)/MOCK-DATA-CHAIN.md`，`wc -l` 為 1382 行（腳本以 `split('\n')` 得 1383 個元素，末行為空）。

### 3.1 分段與行類型（`chain.py` 逐行啟發式分類）

分類法：以 `^#{1,2} ` 切段；每行判成六類之一。「資料」＝以 `|` 開頭（含 `> |`）的表格列；「歷史」＝非表格、含「（…2026-mm…）」括號且帶新增、拍板、改版、落地、改名、更正等字樣；「規則」＝非表格、含算式、規則、條件、權限、只能、一律、必填等字樣；「其他」＝其餘敘述；另列標題與空白。這是粗估：長段落同一行常同時是規則與帶日期標記，腳本只能擇一。

| 行號 | 行數 | 段落 | 資料 | 規則 | 歷史 | 其他 | 標題 | 空白 |
|---|---|---|---|---|---|---|---|---|
| 1-193 | 193 | 開頭說明（交期欄位算式表、各種改版說明、八條鏈總表、交期逐段推導） | 82 | 21 | 22 | 5 | 2 | 61 |
| 194-242 | 49 | 鏈一 ORD-2026-0601 | 25 | 0 | 0 | 3 | 6 | 15 |
| 243-291 | 49 | 鏈二 ORD-2026-0710 | 23 | 0 | 0 | 5 | 5 | 16 |
| 292-331 | 40 | 鏈三 ORD-2026-0815 | 19 | 1 | 0 | 3 | 4 | 13 |
| 332-483 | 152 | 鏈四 ORD-2026-0820（含 est_cost 落地表） | 88 | 3 | 0 | 10 | 12 | 39 |
| 484-542 | 59 | 鏈五 ORD-2026-0901 | 30 | 1 | 0 | 4 | 6 | 18 |
| 543-573 | 31 | 鏈六 ORD-2026-0903 | 17 | 0 | 0 | 2 | 3 | 9 |
| 574-620 | 47 | 鏈七 ORD-2026-0904 | 25 | 1 | 0 | 5 | 3 | 13 |
| 621-683 | 63 | 鏈外：待審核工單列表（2026-09-04 新增） | 12 | 5 | 0 | 34 | 1 | 11 |
| 684-757 | 74 | 鏈外：錨例訂單 ORD-2026-0803 | 26 | 3 | 0 | 21 | 6 | 18 |
| 758-779 | 22 | 鏈外：ORD-2026-0814（2026-10-05 新增） | 14 | 2 | 0 | 0 | 1 | 5 |
| 780-801 | 22 | 鏈外：ORD-2026-0813（2026-10-05 新增） | 14 | 1 | 0 | 1 | 1 | 5 |
| 802-857 | 56 | 鏈外：ORD-2026-0812（2026-10-05 新增） | 31 | 3 | 1 | 1 | 5 | 15 |
| 858-870 | 13 | 鏈外：ORD-2026-0816（2026-10-28 新增） | 6 | 2 | 0 | 0 | 1 | 4 |
| 871-885 | 15 | 鏈外：ORD-2026-0817（2026-10-29 新增） | 6 | 2 | 0 | 1 | 1 | 5 |
| 886-898 | 13 | 鏈外：訂單離開草稿後新增印件 | 6 | 0 | 1 | 1 | 1 | 4 |
| 899-1025 | 127 | 跨鏈共用主檔（廠客、設備、材料、站點、人員、分享成員、確樣需求） | 69 | 7 | 4 | 5 | 8 | 34 |
| 1026-1108 | 83 | 鏈八：早期階段樣本（2026-09-08 新增） | 25 | 6 | 0 | 23 | 4 | 25 |
| 1109-1168 | 60 | 鏈九 ORD-2026-0921 | 28 | 2 | 0 | 5 | 6 | 19 |
| 1169-1183 | 15 | 下載檔案模擬資料 | 6 | 1 | 0 | 2 | 1 | 5 |
| 1184-1292 | 109 | 全鏈核對表（2026-09-22） | 66 | 3 | 0 | 1 | 13 | 26 |
| 1293-1315 | 23 | 各模組列表預期看到什麼 | 18 | 0 | 0 | 0 | 1 | 4 |
| 1316-1333 | 18 | 從 wiki 取用的情境卡與規則卡清單 | 0 | 4 | 0 | 9 | 1 | 4 |
| 1334-1383 | 50 | 波 1b 生產任務主檔對照表（2026-09-03） | 21 | 2 | 0 | 6 | 6 | 15 |
| 合計 | 1383 | | 657 | 70 | 28 | 147 | 98 | 383 |

### 3.2 對三類的粗估

| 類別 | 粗估行數 | 依據與誤差 |
|---|---|---|
| 資料清單（單據編號、狀態、數值） | 約 646 | 表格列 657，扣掉開頭 7-17 行的交期算式表 11 行（那 11 行屬規則）。表格列內也夾帶規則句（例如各鏈「關鍵欄位」欄），無法逐格拆 |
| 規則敘述（算式、條件、權限） | 約 81 至 150 | 腳本判定 70 行，加算式表 11 行；另 147 行「其他」中有鏈外資料與鏈八的敘述段，部分屬規則；107 行非表格散文超過 200 字，多為一整段規則 |
| 改版紀錄（帶日期的說明） | 約 28 至 110 | 嚴格判定 28 行；非表格散文中有 80 行含「（…2026-mm…）」括號，全檔共 359 行含年月日（含資料列中的日期值，不全是紀錄）。九個標題直接帶新增日期（鏈外五段、鏈八、全鏈核對表、波 1b、鏈四與鏈五的 est_cost 落地表小節），說明文字多半同時是規則 |
| 標題、空白 | 98 加 383 | 精確值 |

### 3.3 被誰引用（`grep -rl MOCK-DATA-CHAIN`，排除 `.git`、`node_modules`、`.next`、`out`）

| 位置 | 檔數 | 內容 |
|---|---|---|
| erp 程式庫（主檢出，不含 4 個 `.claude/worktrees/` 副本） | 10 | 本檔自己、8 個 `mock-data.js`（檔頭註解，`orders`、`quote-prototype`、`work-orders`、`dispatch-orders`、`production-floor`、`print-items`、`recipes`、`qc-shipping`）、`work-orders/_lib/__checks__/mock-consistency.check.mjs`（1 次） |
| Sens 根目錄 `AGENTS.md` | 1 | 「mock 唯一正本；改 mock 先改它、再改各模組 `mock-data.js`、最後跑 `erp-prototype-tests/`」 |
| Sens `erp-prototype-tests/` | 16 | `README.md`、`docs/scenario-catalog.md`、`docs/findings-20260908.md`、`scripts/impact.mjs`（動到時印提醒）、5 個純函式測試檔、7 個畫面測試檔 |
| Sens `.claude/skills/linear-delivery/references/blocked-cases-log.md` | 1 | 歷史紀錄 |
| Sens wiki | 1 | `08-open-questions/QR-019-…`（待裁決卡，「裁決後要同步的位置」） |
| Sens `memory/erp/` | 27 | `plans/_archives/2026/` 11 份、`manual-audit-20260923/` 底下多份、`production-dispatch-report-transfer-20261006/grill-decisions.md`、`linear-drafts/…/changes.md`、一份 `.html` |
| Sens `.scratch/` | 2 | 本輪研究與 `experience-handover` 票 |
| Sens 合計 | 48 | 算法：`grep -rl MOCK-DATA-CHAIN . --exclude-dir=.git --exclude-dir=node_modules \| wc -l` |

矛盾與重複：（一）Sens `AGENTS.md` 說本檔是 mock 唯一正本，順序是先改本檔、再改 `mock-data.js`；同一批單據編號、狀態、數值在兩處都有，兩處之間靠 `mock-consistency.check.mjs` 與測試比對，不是單一來源。（二）本檔開頭的交期欄位算式表（2026-10-27 急件新定義）與 wiki 規則卡是同一組規則，Sens 的分層規定規則句只放 wiki。（三）erp 內 `.claude/worktrees/` 的 4 個副本各帶一份本檔，內容是否與主檢出一致未查證。

## 四、分支現況

唯讀指令：`git branch`、`git branch -r`、`git log`、`git status`、`git worktree list`、`git for-each-ref`、`git rev-list --count`。未執行 `git fetch`，遠端分支資訊以本機既有的遠端追蹤參照為準。

### 4.1 現況

| 項目 | 事實 |
|---|---|
| 目前分支 | `prototype/production-stage`，與 `origin/prototype/production-stage` 同步，工作區乾淨（`git status --short` 0 行）；最新提交 `6e75fa07`（2026-11-05） |
| 本機分支（9） | `main`（`52982c7f`，2026-10-29）、`prototype/production-stage`、`prototype/dispatch-and-shipping`、`prototype/l1-optimization`、`prototype/l1-ui-naming-fix`、`prototype/print-item-copy-rule`、`prototype/shipment-logistics-split`、`claude/print-item-qty-fields-d7b9e8`、`claude/proto-sync-dev-ui-44392e` |
| 遠端分支 | 251 條：`feat/` 118、`docs/` 84、`fix/` 23、`prototype/` 6、`integrate/` 5、`refactor/` 3、`ci/` 2、`chore/` 2、`staging/`、`release/` 各 1，另有 `main`、`develop`、`HEAD` |
| 長期分支（依現況判斷） | `main`、`develop`（遠端最後提交 2026-11-05）、`release`、`staging` 為團隊線；原型線為 `prototype/production-stage`。記憶卡稱「唯一長期分支 `prototype/production-stage`」，但本機另有 5 條 `prototype/*` 都有對應遠端分支 |
| 與 main 的差距 | `git rev-list --count origin/main..origin/prototype/production-stage` 得 432；反向 0。但本機 `origin/main` 參照停在 2026-10-29（`52982c7f`），而 `prototype/production-stage` 上有 2026-10-28「`[FEAT] - integrate latest production-stage prototype into main (#253)`」的 squash 與「`chore: merge main into prototype/production-stage after squash (#253)`」。432 是否仍成立需 fetch 後確認，未查證 |
| 工作樹（`git worktree list`） | 5 個：主檢出，加 `l1-optimization`、`print-item-copy-rule`、`print-item-qty-fields-d7b9e8`（detached）、`proto-sync-dev-ui-44392e`（detached） |

### 4.2 最近十筆提交（`git log --oneline -10 --format='%h %ad %s' --date=short`，取目前分支）

| 提交 | 日期 | 摘要 |
|---|---|---|
| `6e75fa07` | 2026-11-05 | Prototype 介面對齊 Dev（需求單、訂單、審稿三模組） |
| `4df9bd54` | 2026-11-04 | L1 回饋甲乙類修正（檔案顯示通則、待評估成本、已棄用列灰底、審稿批次下載與三組命名） |
| `d6f9dc6e` | 2026-11-04 | Merge `origin/main` into `claude/l1-ui-naming-fix-e07ad2` |
| `52982c7f` | 2026-10-29 | Merge pull request #232（`feat/fe596-dispatch-thumbnail-preview`） |
| `4ab72b12` | 2026-10-29 | 印件複製依欄位性質帶入 |
| `8c5aa531` | 2026-10-28 | merge main into prototype/production-stage after squash (#253) |
| `3635be87` | 2026-10-28 | `[FEAT] - integrate latest production-stage prototype into main (#253)` |
| `49398cce` | 2026-10-28 | 印件列表與詳情 ESLint 格式修正 |
| `0f9249af` | 2026-10-28 | 急件第二輪 |
| `fdeb7e17` | 2026-10-27 | 印件列表與詳情帶急件標注；修正交期鏈驗算腳本第 5 段 |

### 4.3 文件對分支與 PR 的說法，對照 git 現況

| 來源 | 說法 | 與 git 現況 |
|---|---|---|
| Sens `AGENTS.md` 第 127 行（Prototype 與測試） | 「開分支加前端主管 PR 合併」 | 與 #253 的 squash 合併吻合 |
| Sens `AGENTS.md` 第 123 行（版本控管） | Sens 分支快轉合併 master、不開 PR；「erp repo 不適用，仍走 PR」 | 對 erp 同上，吻合 |
| erp `prototype-from-prompt` 第 69 行 | 原型一律在 `prototype/<name>` 分支，從 `main` 拉出；跟上正式頁改動用 `git merge origin/main`、不用 rebase；絕不把 develop 併進原型分支 | 吻合：2026-10-28 與 2026-11-04 兩筆「Merge … origin/main」 |
| erp `prototype-from-prompt` 第 70 行與 `prototype-publish` | PM 說「發布」，分支以 merge commit 併進 `develop` 觸發測試機部署；上 main 由 Reynold 處理，不在 PM 流程內 | `develop` 存在且最後提交 2026-11-05；但 main 側歷史顯示有 `[FEAT] - …(#253)` 這類由 PM 流程產出的 PR 標題，「上 main 不在 PM 流程內」是否仍準確未查證 |
| erp `prototype-from-prompt` 第 71-73 行 | 發 PR 時標題用英文 `[FEAT] - <描述>`、內文照 PR 範本四節 | `3635be87` 標題符合 |
| 記憶卡 `project_erp_repo_prototype_workflow` | 唯一長期分支 `prototype/production-stage` | 本機另有 5 條 `prototype/*` 與 2 條 `claude/*` |

三種說法的歸納：（一）原型分支以 PR 併入 main；（二）原型分支以 merge commit 併入 `develop` 發布到測試機，不經 PR；（三）Sens 自己的程式庫分支快轉合併、不開 PR。三者各管不同目的地（main、develop、Sens master），文件沒有同處說清楚。git 現況兩條路都存在。

## 五、測試目錄架構面檔逐項表

路徑起點 `Sens/erp-prototype-tests/`（工作樹路徑為 `/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491/erp-prototype-tests/`）。行數 `wc -l`、最後提交 `git log -1`。引用算法：`grep -rlE <檔名或指令> . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=_archives`，排除 `.scratch`。

| 檔 | 行數 | 用途 | 被誰引用 | 最後提交 | 去留 | 理由 |
|---|---|---|---|---|---|---|
| `README.md` | 67 | 三層執行指令、依據文件表、撰寫規約、執行注意、迭代檢核表 | 根 `AGENTS.md`、`memory/erp/manual-audit-20260923/prototype-brief-common.md` | 2026-11-04 | 改寫 | 執行路徑寫死 `/Users/b-f-03-029/Sens/erp-prototype-tests`；撰寫規約編號排成 1 至 6、7、9、8；迭代檢核表與根 `AGENTS.md`「Prototype 與測試」兩處重述同一組流程 |
| `docs/scenario-catalog.md` | 4472 | 情境目錄（驗收條目）：16 章、462 節加第十六章 21 條表列加統計段 | 根 `AGENTS.md`、`memory/shared/派工任務書範本.md`、多份 `memory/erp/linear-drafts/` | 2026-11-11 | 改寫 | 統計表與實際節數不符（見第六節 6.6）；末段「不列入」「刪除」敘述是歷史紀錄；7.26、10.19 節號重複；「說明」45 節混入 wiki 對不上的註記 |
| `docs/main-flow.md` | 58 | 主流程 smoke 39 站站表 | `README.md`、`00-main-flow/main-flow.spec.mjs` | 2026-11-04 | 留 | smoke 測試的站表正本 |
| `docs/findings-20260908.md` | 87 | 2026-09-08 首輪撰寫的發現；第四節自稱已收進共用工具與 README | `README.md`、`scenario-catalog.md`、根 `AGENTS.md`（fixme 條目須在此有紀錄） | 2026-10-20 | 待判 | 4 條 fixme 在此各有一列（1.1、5.9、6.3 兩列、6.6）；全文是 2026-09-08 的歷史紀錄，是否仍作為 fixme 台帳由 Miles 定 |
| `scripts/full.mjs` | 61 | 全套測試：Vitest 加 Playwright 依章節分批、每批重啟伺服器 | `package.json`（`npm test`） | 2026-11-04 | 留 | 全套入口 |
| `scripts/impact.mjs` | 73 | 把 erp 改動對映到章與測試；動到 mock 時提醒 | `README.md`、根 `AGENTS.md` | 2026-11-04 | 留 | 改動後的對映入口 |
| `scripts/gen-access-activities.mjs` | 46 | 由 wiki 活動清單卡產生 erp `(prototype)/_lib/access-activities.js`（5155 行） | `access-activities.test.mjs`、`scenario-catalog.md` | 2026-10-15 | 留 | 活動表資料的產生器；會寫入 erp 程式庫（與「erp 不放檔」並存，需注意） |
| `scripts/lib/activity-cards.mjs` | 46 | 讀活動清單卡的共用函式 | `gen-access-activities.mjs`、`access-activities.test.mjs` | 2026-10-15 | 留 | 上列腳本附屬 |
| `reporters/live-progress.mjs` | 136 | Playwright 回報器：把進度寫到 `~/.claude/erp-test-progress/`，給本機「測試進度與涵蓋地圖」外掛讀 | `playwright.config.mjs`、`scripts/full.mjs` | 2026-11-04 | 待判 | 只服務本機外掛 `~/.claude/mods/erp-test-map`；外掛是否仍要保留需 Miles 定 |
| `config.mjs` | 28 | 指向 erp 路徑與登入資訊（寫死 `/Users/b-f-03-029/erp`，可由 `ERP_ROOT` 覆寫） | `vitest.config.mjs`、`playwright.config.mjs`、`auth.setup.mjs`、`impact.mjs` 等 8 檔 | 2026-09-16 | 留 | 路徑單一出口 |
| `playwright.config.mjs` | 40 | 畫面測試設定（3020 埠、自動啟動 erp 開發伺服器、回報器） | `package.json` | 2026-11-04 | 留 | 必要設定 |
| `vitest.config.mjs` | 34 | 純函式測試設定（別名指向 erp） | `package.json` | 2026-10-27 | 留 | 必要設定 |
| `package.json` | 19 | 腳本：`test`、`test:unit`、`test:e2e`、`test:smoke`、`test:module`、`test:e2e:ui`、`impact` | — | 2026-10-21 | 留 | `test:module` 與 `test:e2e` 指令相同（皆 `playwright test`） |
| `package-lock.json` | 1647 | 鎖定版本 | — | 2026-09-08 | 留 | — |
| `.gitignore` | 5 | 忽略 `node_modules`、`test-results`、`playwright-report`、`.auth`、`.env.local` | — | 2026-09-16 | 留 | — |
| `tests/e2e/_helpers.mjs` | 241 | `openAs`、`switchRole`、`gotoInApp` 等共用工具 | 105 個測試檔（`grep -rlE _helpers tests \| wc -l`） | 2026-10-15 | 留 | 全部畫面測試依賴 |
| `tests/e2e/auth.setup.mjs` | 21 | 登入一次並沿用狀態 | `playwright.config.mjs` | 2026-10-15 | 留 | — |
| 章內輔助檔 12 個（`_local.mjs` 三個、`_setup.mjs` 兩個、`_ch07.mjs`、`_ch10.mjs`、`_flow-helpers.mjs`、`_retry.mjs`、`_page-helpers.mjs`、`_local-helpers.mjs`、`_fixtures.mjs`） | 2740 | 各章共用工具 | 同章測試檔 | 見 `git log -- tests` 最後 2026-11-11 | 留 | `README.md` 撰寫規約第 5 點規定章內工具檔命名 |
| `test-results/`（本檔不入版控） | — | Playwright 輸出；主檢出內 `.last-run.json` 寫 `status: passed`、`failedTests: []`（2026-11-05 15:43） | — | 未進版控 | 留 | 見 6.7 |

另：`tests/e2e/helpers.spec.mjs`（12 行）與 `tests/e2e/smoke.spec.mjs`（7 行）是測試檔，內容分別驗「切角色保留記憶體狀態」與「工單列表頁可開」，標題都沒有節號。測試檔本身不判去留。

位於 Sens 之外、但與測試直接相關：

| 位置 | 用途 | 備註 |
|---|---|---|
| `~/.claude/mods/erp-test-map/`（`plugin.json`、`hooks/register.tsx` 28124 位元組、`register.test.tsx`、`types/index.d.ts`） | Claude 介面外掛，讀回報器輸出，顯示涵蓋地圖；2026-11-04 安裝 | 待判；記憶卡稱「39 站逐站顯示待下次 smoke 確認」 |
| `~/.claude/erp-test-progress/{live,results}.json` | 回報器輸出 | 2026-11-05 15:43 最後寫入 |
| `/Users/b-f-03-029/sens-erp-prototype/`（獨立程式庫，含 `e2e/` 49 個項目、`DESIGN.md` 138336 位元組、`CLAUDE.md`） | 不同的、更早的原型程式庫，最後修改 2026-07-21 | 與本盤點範圍無直接關係；是否仍使用未查證 |

## 六、情境與測試對照

### 6.0 方法與限制

| 項目 | 做法 |
|---|---|
| 卡清單 | `ls memory/Sens_wiki/wiki/erp/07-scenarios/`：45 個檔，其中 `範例 - 業務情境`、`規範 - 業務情境` 是規範與範例，不是情境卡，統計欄位中標注但不計入「零引用」 |
| 目錄節 | `docs/scenario-catalog.md` 以正規式 `^### (\d+\.\d+) ` 取節；本體到下一個 `###` 或 `##` 為止；「依據」取 `^- 依據：` 該行 |
| 卡引用 | 依據行含卡名字串即算引用（純字串比對）。07 卡名與其他層卡名無同名（逐卡 `find` 檢查，0 組同名），故無跨層誤判；但依據行寫簡稱或別名的不會被計入 |
| 測試標題 | 以正規式取 `test(`、`test.fixme(`、`test.skip(`、`describe(`、`it(`、`it.each(` 的第一個字串引數：共 2223 個（畫面 `test` 434、`test.fixme` 4、`describe` 1；純函式 `it` 1400、`describe` 358、`it.each` 26） |
| 有測試（標題法） | 至少一個標題以 `數字.數字` 開頭且等於該節號 |
| 有測試（寬鬆法） | 標題法成立，或目錄該節本體列出 `tests/…mjs` 路徑，或 tests 內任一檔出現該節號（`(?<![\d.])節號(?!\d)`） |
| 落差標記 | 節本體含 `^- 未實作`、「待裁決」、「待補畫面測試」、「（wiki 無對應卡）」。「說明」另計，因為「說明」是註記 Prototype 與 wiki 用語或路徑差異，不一定是落差。「待裁決」只有 1 節含此字樣，其他待拍板內容用「待 ORD-xxx 拍板」「待裁決」以外的寫法，未計入 |
| 第十六章 | 以表格列（`| 16.n | 情境 | 依據 | …`）取 21 條，不是 `###` 節，另列欄位 |

### 6.1 總表（每張 wiki 情境卡一列）

欄位定義：節數＝「依據」行含該卡名的 `###` 節數；有測試＝該節至少一條測試標題以同一節號開頭；無測試（標題法）＝節數減有測試；無測試（寬鬆法）＝標題、目錄內列出的測試路徑、tests 內任何檔出現該節號，三者皆無；落差標記＝該節帶「未實作」「待裁決」「待補畫面測試」「（wiki 無對應卡）」任一；含說明＝上述再加「說明」；第十六章＝第十六章表列（無獨立節）依據含該卡的條數。

| 卡名 | 節數 | 有測試 | 無測試（標題法） | 無測試（寬鬆法） | 落差標記 | 含說明 | 第十六章條數 |
|---|---|---|---|---|---|---|---|
| QC不通過補生產 | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| 出貨與送達 | 51 | 51 | 0 | 0 | 2 | 7 | 1 |
| 印件審稿 | 11 | 11 | 0 | 0 | 1 | 2 | 1 |
| 印製派單審核 | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| 品檢通過入庫 | 27 | 27 | 0 | 0 | 0 | 0 | 0 |
| 售後受理與決議 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 單據分享與職務代理 | 9 | 9 | 0 | 0 | 0 | 1 | 0 |
| 報工與修正 | 21 | 20 | 1 | 0 | 2 | 4 | 0 |
| 場內轉交與修正 | 44 | 44 | 0 | 0 | 2 | 7 | 2 |
| 外包與回廠點收 | 3 | 3 | 0 | 0 | 0 | 0 | 2 |
| 對帳與催收 | 4 | 4 | 0 | 0 | 2 | 2 | 0 |
| 工單異動與生產任務調整 | 5 | 5 | 0 | 0 | 0 | 1 | 3 |
| 工單製程審核 | 12 | 12 | 0 | 0 | 0 | 2 | 3 |
| 工單製程規劃 | 29 | 29 | 0 | 0 | 0 | 3 | 0 |
| 打樣後稿件問題重審 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| 打樣決策與重新打樣 | 2 | 2 | 0 | 0 | 0 | 2 | 0 |
| 收款核銷分配 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 收款項目規劃 | 9 | 9 | 0 | 0 | 2 | 2 | 0 |
| 收款項目開立發票 | 15 | 15 | 0 | 0 | 1 | 3 | 0 |
| 改派審稿人員 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| 查找含急件印件的訂單 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 生產任務接收與派工 | 22 | 22 | 0 | 0 | 1 | 1 | 0 |
| 生產數量錯誤的逐層修正 | 8 | 8 | 0 | 0 | 2 | 2 | 1 |
| 生產管理單元可見範圍 | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| 範例 - 業務情境（規範／範例，非情境） | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 結案紀錄與留存資訊維護 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 維護審稿人員能力等級 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 規範 - 業務情境（規範／範例，非情境） | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 訂單其他附件保存 | 2 | 2 | 0 | 0 | 1 | 1 | 0 |
| 訂單印件規格維護 | 19 | 19 | 0 | 0 | 2 | 2 | 0 |
| 訂單取消 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 訂單客戶條款組維護 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 訂單客戶與聯絡資料維護 | 2 | 2 | 0 | 0 | 1 | 1 | 0 |
| 訂單成立確認 | 9 | 9 | 0 | 0 | 1 | 2 | 1 |
| 訂單接單業務改派 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 訂單異動流程 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| 訂單複製建單 | 3 | 3 | 0 | 0 | 1 | 1 | 1 |
| 訂單資訊分區編輯 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 諮詢受理與出口分流 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 諮詢費結算收尾 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 退款執行 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 需求單參考附件保存 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| 需求單報價成交 | 13 | 13 | 0 | 0 | 1 | 3 | 0 |
| 需求單流失 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| 需求單複製建單 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 合計（同一節可引多卡，故重複計） | 366 | 365 | 1 | 0 | 22 | 49 | 21 |

目錄 `###` 節共 462 節（唯一節號 460 個；7.26 與 10.19 各出現兩次）。依據行未含任何 07 情境卡名的節 153 節（依據引用規則卡、實體卡、活動清單卡等其他層，或標「wiki 無對應卡」）；含至少一張 07 情境卡名的節 309 節。
依據未含 07 情境卡的節，各章分布：第1章 12、第2章 8、第3章 3、第4章 10、第5章 4、第6章 5、第7章 21、第8章 9、第9章 4、第10章 11、第11章 9、第12章 11、第13章 1、第14章 29、第15章 16。

### 6.2 零引用的 wiki 情境卡

| 卡名 | 目錄節引用 | 第十六章引用 | 目錄內的處置說明 |
|---|---|---|---|
| 售後受理與決議 | 0 | 0 | 目錄全文 grep 卡名 0 次，tests grep 0 次 |
| 結案紀錄與留存資訊維護 | 0 | 0 | 目錄全文 grep 卡名 0 次，tests grep 0 次 |
| 維護審稿人員能力等級 | 0 | 0 | 目錄全文出現 1 次，在「不列入」段：Prototype 沒有維護介面 |
| 訂單客戶條款組維護 | 0 | 0 | 目錄全文 grep 卡名 0 次，tests grep 0 次 |
| 訂單異動流程 | 0 | 3 | 僅第十六章表列引用（16.x 三條，待辦） |
| 諮詢受理與出口分流 | 0 | 0 | 目錄全文 grep 卡名 0 次，tests grep 0 次 |
| 諮詢費結算收尾 | 0 | 0 | 目錄全文 grep 卡名 0 次；目錄「不列入」段以說明文字帶過（Prototype 沒有自動建諮詢訂單） |
| 退款執行 | 0 | 2 | 僅第十六章表列引用（16.27、16.28） |

### 6.3 每節是否有測試

標題法（測試標題以節號開頭）下，無測試的節 8 節：

| 節號 | 標題 | 目錄內列的測試路徑數 | tests 內任何檔出現節號的檔數 |
|---|---|---|---|
| 1.17 | 需求單印件項目的單位選項照後端數量主檔，最後加「張」 | 1 | 1 |
| 4.16 | 訂單印件的單位選項與需求單同一組 | 1 | 3 |
| 7.32 | 已核可工單的排程超期標示（2026-10-27 補異動狀態） | 1 | 1 |
| 7.43 | 主檔維護預設放損率與是否印刷類工序（正式系統主檔頁，Prototype 無對應，無畫面測試） | 0 | 0 |
| 10.21 | 任務實際完成日取進入已完成的時間，今日到期與逾期以工作天標示 | 1 | 0 |
| 10.47 | 送出不在入口範圍的任務被擋下、不寫稽核日誌 | 2 | 2 |
| 13.2 | 派單編號旁帶所屬印件的急件圖標，印件取消勾選或棄用後隨之更新（rush-order-definition 新增） | 1 | 1 |
| 15.14 | 兩個事實時間的日期格式化（純函式） | 0 | 0 |

寬鬆法下仍無任何測試的節 2 節：7.43 主檔維護預設放損率與是否印刷類工序（正式系統主檔頁，Prot、15.14 兩個事實時間的日期格式化（純函式）。

標 fixme 的測試（`test.fixme`；全 tests 目錄 grep `fixme|\.skip|todo` 後排除字串誤中，只有 4 條，無 `skip`、`todo` 的測試）：

| 節號 | 檔案:行 |
|---|---|
| 1.1 | tests/e2e/01-quote/quote-request.spec.mjs:39 |
| 5.9 | tests/e2e/05-prepress-review/supplement.spec.mjs:59 |
| 6.6 | tests/e2e/06-work-order-draft/pending-assign.spec.mjs:19 |
| 6.3 | tests/e2e/06-work-order-draft/work-order-assign.spec.mjs:38 |

第十六章表列 21 條：tests 內出現其節號的條數 0（皆無測試，屬目錄標定的「待辦」）。

### 6.4 測試找不到對應目錄節

畫面測試 `test(...)`、`test.fixme(...)` 共 439 條，標題節號不在目錄的 4 條：

| 檔案:行 | 標題 |
|---|---|
| tests/e2e/00-main-flow/main-flow.spec.mjs:217 | 主流程：一件印件從需求單到訂單完成 |
| tests/e2e/03-payment/invoices.spec.mjs:229 | 發票區沒有發票時，說明開立入口在收款項目列 |
| tests/e2e/helpers.spec.mjs:4 | 切角色與站內導頁保留記憶體狀態 |
| tests/e2e/smoke.spec.mjs:4 | 工單列表頁可開 |

純函式測試檔 92 個，其 `describe`／`it` 標題皆無目錄節號的檔 5 個：

- tests/unit/orders/confirm-producible-roles.test.mjs
- tests/unit/qc-shipping/shippable-quota.test.mjs
- tests/unit/quote/unit-options.test.mjs
- tests/unit/work-orders/rules-print-item-officer-files-guard.test.mjs
- tests/unit/work-orders/target-qty.test.mjs

另有標題以「16.0」「38.0」開頭的 `it`，是數值（利潤率字串），不是節號，已視為誤判（檔 `tests/unit/print-items/rules-print-item-profit.test.mjs`）。

### 6.5 目錄標記出現位置

**說明（45 節）**：1.1 業務建需求單、逐筆填印件項目後送印務評估；1.2 印務主管回填成本、業務按評估完成，系統留一筆報價；1.9 需求單狀態只出現六個值，顯示名依 wiki；1.14 需求單列表可見範圍依活動清單：業務主管、印務主管；1.17 需求單印件項目的單位選項照後端數量主檔，最後加「；1.18 業務建立需求單，接單業務為本人，必填欄位未填無法；2.16 業務主管核准畫面帶出四格備註與各期收款項目，核准；3.6 已開立的發票作廢重開；3.11 三方對帳與跨訂單四張清單；3.16 藍新回傳失敗或逾時轉開立失敗，列在發票區並顯示原；4.16 訂單印件的單位選項與需求單同一組；5.2 線下單的稿由業務代傳，審稿人員由訂單管理人指派（；5.10 業務填打樣結果 OK，放行大貨投產；5.11 打樣結果 NG-製程問題，系統自動在原印件下建新；6.13 交期一路留空時工單相關畫面照實留白、不當機（ru；7.16 選擇器的篩選：分類側欄、名稱、品牌與廠商（原編號；7.23 生產任務的任務預計完成日晚於工單的印件內部完成日；7.35 生產任務表的欄寬與展開列依內容配比，兩個事實時間；7.37 印件已送達後仍可補傳檔案；非負責的印務入口停用；8.2 印務主管核可製程，工單轉製程審核完成（場內加工；；8.4 印務主管在待審核工單列表逐列核可或退回（原編號 ；8.6 印務列印紙本工單，版式與欄位範圍固定且不含價格（；8.11 同一件印件的兩張工單，紙本表頭印出同一份品檢需求；8.12 印件的兩欄都沒填時，紙本表頭各印破折號且不擋下列；9.9 工廠總覽的三個視角各自取數（原編號 24）；10.3 轉交單子母表、五個狀態與明細（原編號 23）；10.5 報工權限綁在工作歸屬上：工單詳情看負責或編輯分享；10.16 生管手動把做不滿的任務標為完成（原編號 160，；10.20 已被品檢驗過的良品不可作廢報工，也不可調降良品；10.32 生產任務轉交狀態推導：先做完再分批、邊做邊送、在；10.35 報工修正與作廢共用擋下條件：在途與已點收量、下游；10.40 建轉交單選負責廠務與預計轉交日，系統只通知負責廠；10.61 一次報多筆時任一筆被擋下，整批都不寫入；改好後整；11.12 印件的品檢需求沒填時顯示破折號，驗收照樣記得下去；12.2 業務建草稿再建立出貨單，額度在成立那一刻檢核並整；12.7 三種出貨方式的送達各走各的路，送達確認與交付確認；12.13 先做完的那一批可以先出，整件還在製作中也推得動出；12.48 確認可出貨與改明細、裝箱回報修正的併發：先成立者；12.50 第三方物流拋單成功後只依物流商回傳推進貨態：不經；12.52 下載檔案狀態：處理中、成功、部分成功、失敗，異常；14.1 工單列表查詢與篩選（原編號 1）；14.9 印件詳情頁的兩本帳與報價與利潤都要有數字（原編號；14.27 有工單但一筆生產任務都沒有時，兩個預估欄顯示無值；15.4 材料數量與售價是同一個量級（原編號 111）；15.11 有工單但無任何生產任務時印件預計成本視同空值（純

**未實作（14 節）**：2.3 已回簽後追加上傳回簽檔；2.5 訂單客戶與窗口聯絡人維護；2.8 已取消訂單的三類備註與其他附件鎖定；3.1 業務規劃收款項目分期；3.11 三方對帳與跨訂單四張清單；3.12 出貨後指定期限付款的盯收；3.21 開立失敗是業務端終態：業務不能補登、再送或作廢，；9.17 工單取消後任務轉終態、留在所有生產任務且不可打包；10.45 多前置取最小值；前置未到料時提示指出在等哪張工單；10.47 送出不在入口範圍的任務被擋下、不寫稽核日誌；10.50 整筆報到錯的任務作廢後重報；10.54 一次勾多筆建單任一張超額即全部擋下；10.56 逐層修正主流程：五色印刷良品 500 改 480；10.57 逐層修正副流程：上游已完成或還在做、卡在還沒點收

**待裁決（1 節）**：1.1 業務建需求單、逐筆填印件項目後送印務評估

**待補畫面測試（11 節）**：1.1 業務建需求單、逐筆填印件項目後送印務評估；2.29 複製訂單不帶已棄用印件；免審稿照帶原值，免審者直；4.9 印件已棄用後是否急件與印件預計交期唯讀；印製維度；4.12 訂單預計交貨日期依全數離廠滾動、逾期未出不跳筆（；4.13 印件逾期、訂單部分延遲與整單逾期三種標示，部分延；5.14 待審訂單模組母列顯示印件預計交期，子列印件預計交；6.13 交期一路留空時工單相關畫面照實留白、不當機（ru；7.32 已核可工單的排程超期標示（2026-10-27 ；10.21 任務實際完成日取進入已完成的時間，今日到期與逾期；13.2 派單編號旁帶所屬印件的急件圖標，印件取消勾選或棄；15.13 工單完成後的準時標示取凍結值（純函式）

**（wiki 無對應卡）（7 節）**：7.17 任務表單改成頂端固定區加三個頁籤（原編號 177；7.18 缺漏檢查按確定後才亮，清單可點跳（原編號 178；14.5 欄位說明圖示（原編號 20）；14.11 清單上的編號可以直接點開詳情（原編號 181）；14.44 子母表樣式五處一致：出貨管理、訂單出貨單頁籤、訂；14.45 介面字樣檢查：對話框標題、送出鈕、批次動作照介面；15.1 編號只有一種格式（原編號 73）

### 6.6 目錄統計與實際節數

| 項目 | 目錄統計表 | 實際（`grep -cE '^### [0-9]+\.[0-9]+ '`） |
|---|---|---|
| 第一章至第十五章 | 459 | 462（第十四章表列 47、實際 50） |
| 第十六章 | 21 | 21（表格列，不是 `###`） |
| 合計 | 480 | 483 |
| 缺號 | — | 2.18、12.14、12.25、12.31、12.47 空號（後四個目錄內有說明不遞補；2.18 未查證）；重複節號 7.26、10.19 各兩節 |

### 6.7 最近一次測試結果

| 來源 | 內容 |
|---|---|
| `Sens/erp-prototype-tests/test-results/.last-run.json`（主檢出，2026-11-05 15:43） | `status: passed`，`failedTests: []` |
| `~/.claude/erp-test-progress/live.json`（2026-11-05 15:43） | 該輪：開始 07:29:33Z、結束 07:43:13Z，共 57 條，已結束 57，通過 55、失敗 0、略過 2；`repoRoot` 為 `/Users/b-f-03-029/Sens` |
| `~/.claude/erp-test-progress/results.json`（記錄時間 2026-11-05 06:44Z 至 07:43Z） | 每條測試最近一次結果，共 191 條（只含畫面測試）：通過 187、失敗 2（兩條都在 `03-payment`）、略過 2（`01-quote`、`05-prepress-review` 各 1，即 1.1、5.9 的 fixme） |
| 純函式測試（Vitest）最近結果 | 未查證（沒有留存檔） |
| 其他日期的結果 | 未查證；`Sens` 工作樹內沒有 `test-results/` |

兩份結果對不上：`live.json` 失敗 0，`results.json` 失敗 2；後者累積多輪，前者是最後一輪 57 條。失敗的兩條的標題、是否為舊輪遺留，未查證。


## 七、去留小計與可刪清單

算法：以第二節與第五節表格的「列」為單位統計（一列可含多檔）；第二節 2.1 共 25 列、2.2 共 3 列（`DESIGN.md` 列不計）、第五節 19 列，加 Sens 外的 `~/.claude/mods/erp-test-map` 1 列，合計 48 列。

| 去留 | 列數 | 項目 |
|---|---|---|
| 留 | 24 | `.claude/settings.local.json`、`prototype-from-prompt`、`prototype-publish`（加 `preflight.sh`）、`.husky/pre-commit`、PR 範本、`ci.yml` 與 `design-tokens.yml`、`Designs.md`、`(prototype)/README.md`；測試目錄的 `main-flow.md`、`full.mjs`、`impact.mjs`、`gen-access-activities.mjs`、`activity-cards.mjs`、`config.mjs`、`playwright.config.mjs`、`vitest.config.mjs`、`package.json`、`package-lock.json`、`.gitignore`、`_helpers.mjs`、`auth.setup.mjs`、章內輔助檔、`test-results/` |
| 刪 | 5 | `.claude/commands/openspec/` 三檔、`openspec/` 整個資料夾（8 檔）、`MIGRATION.md` |
| 改寫 | 3 | `prepress-review/README.md`、`erp-prototype-tests/README.md`、`docs/scenario-catalog.md` |
| 待判 | 16 | 見第八節 |

可刪清單（每項為檔案群；除 `MIGRATION.md` 外都是 OpenSpec 殘留，erp 程式庫由前端團隊持有，刪除需其同意）：

| 檔案群 | 行數 | 刪除理由（事實） |
|---|---|---|
| `.claude/commands/openspec/apply.md`、`archive.md`、`proposal.md` | 93 | 只服務 OpenSpec；2026-03-18 後未再提交 |
| `openspec/AGENTS.md` | 522 | 同上；而 `AGENTS.md`、`CLAUDE.md` 指示代理遇「規劃、spec、change、proposal」字眼就讀它，與 Sens 的規劃流（`erp-plan`、`.scratch/<主題>/spec.md`）衝突 |
| `openspec/project.md`、`openspec/changes/migrate-to-pnpm-monorepo/`（5 檔） | 未逐檔量 | 唯一 change，內容是 2026-03-18 的單一程式庫移轉，已完成 |
| `MIGRATION.md` | 82 | 同一次移轉的說明，2026-03-18 後未再提交 |

刪除上列後，`AGENTS.md` 與 `CLAUDE.md` 開頭的 OpenSpec 管理區塊（兩檔各約 20 行，逐字相同）會成為死連結；這兩檔屬「待判」，應同時處理。

## 八、待判與未查證

### 8.1 待判（16 項）

| # | 項目 | 拿不準的原因 |
|---|---|---|
| 1 | erp `AGENTS.md` | Codex 雙軌指引；前端團隊是否仍用 Codex 未查證 |
| 2 | erp `CLAUDE.md` | 與 `AGENTS.md` 開頭重複；兩檔誰留需看前端團隊 |
| 3 | erp `.claude/CLAUDE.md`（237 行） | 與 `docs/*_GUIDE.md` 的重複程度未逐段比對 |
| 4 | erp `.claude/skills/design-qa` | Figma 流程，Miles 流程未提；他人是否使用未查證 |
| 5 | erp `.claude/skills/figma-analyze` | 同上 |
| 6 | erp `.claude/skills/figma-feature` | 同上 |
| 7 | erp `.claude/skills/documentation-standards` | 服務 `docs/` 技術文件 |
| 8 | erp `.claude/skills/workflow-pr-review` | 前端團隊審 PR |
| 9 | erp `.agents/skills/`（7 檔） | Codex 雙軌 |
| 10 | erp `.github/workflows/claude*.yml`（3 檔） | 是否仍啟用，不讀遠端設定，未查證 |
| 11 | erp `README.md`（155 行） | 未逐行核對與現況差異 |
| 12 | erp `docs/`（19 個版控檔，其中 `plans/`、`superpowers/` 共 8 檔） | 是否仍用未查證；`pm-prototype-workflow.md`、`component-catalog.md`、`recipes/` 判留 |
| 13 | `(prototype)/MOCK-DATA-CHAIN.md`（1382 行） | 唯一正本聲明、與 `mock-data.js` 的重複、與 wiki 規則的重複，三者並存；拆分或縮減由 Miles 定 |
| 14 | `erp-prototype-tests/docs/findings-20260908.md` | 根 `AGENTS.md` 規定 fixme 條目要在 `findings-*.md` 有紀錄，現存 4 條 fixme 在此有列；留作台帳或併入情境目錄由 Miles 定 |
| 15 | `erp-prototype-tests/reporters/live-progress.mjs` | 只服務本機外掛 |
| 16 | `~/.claude/mods/erp-test-map/` | 外掛；2026-11-04 安裝，記憶卡稱逐站顯示待確認 |

### 8.2 未查證

| 項目 | 缺什麼 |
|---|---|
| `origin/main` 與 `origin/prototype/production-stage` 的真實差距 | 未執行 `git fetch`；本機 `origin/main` 停在 2026-10-29 |
| erp 內 `.claude/worktrees/` 4 個副本的 `MOCK-DATA-CHAIN.md` 是否與主檢出相同 | 未逐一 diff |
| `.husky/`、`.github/` 各檔最後提交日 | 未逐檔查 |
| `docs/` 其餘 19 個版控檔的行數與內容 | 只查了 `pm-prototype-workflow.md` 存在 |
| `.claude/CLAUDE.md` 與 `docs/*_GUIDE.md` 的重複內容 | 未逐段比對 |
| 純函式測試（Vitest）最近一次結果 | 沒有留存檔 |
| `results.json` 兩條失敗的標題，與 `live.json` 失敗 0 不一致的成因 | 未展開 |
| 目錄 2.18 是否為空號 | 只確認標題序列缺號，沒讀目錄的刪除紀錄 |
| 依據行簡稱、別名未被卡名比對計入的情況 | 只做純字串比對；153 節的依據行內容（規則卡、實體卡、活動清單卡）未逐一分類 |
| `/Users/b-f-03-029/sens-erp-prototype/` 是否仍使用 | 與本盤點範圍無關，只記存在 |
