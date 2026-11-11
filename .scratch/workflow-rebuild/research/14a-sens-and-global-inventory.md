# 14a Sens 與全域環境逐項去留盤點

主對話抽查（2026-11-11）：相符：`memory/erp/linear-drafts` 126 檔；自動推送 hook 只在 `.claude/settings.local.json` 第 207 行；`~/.claude/skills/gstack` 145MB。更正：`docs/superpowers` 實際 22 檔（本檔寫 24）；wiki 卡引用 `memory/erp/plans` 240 張、`wiki-normalization` 194 張（本檔寫 239、193）。其餘數字未逐項查證。


盤點日期：2026-11-11。只讀。基準工作樹：`/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491`（分支 claude/workflow-rebuild-05-aa3491）。前置：[03 盤點](03-environment-inventory.md)（以其檔頭「主對話查證」為準，本檔不重查其已查項）。

判準：今天從零建立這個專案，會不會放這個檔。引用數算法：`git grep -l -F -- <路徑或檔名> -- . ":!.scratch/workflow-rebuild" ":!memory/Sens_wiki/wiki/log.md" ":!*/CHANGELOG.md"`，扣除自身與自身資料夾；wiki 卡引用數另算 `git grep -l -F -- <資料夾> -- memory/Sens_wiki/wiki ":!memory/Sens_wiki/wiki/log.md"`。行數算法：`wc -l`（資料夾為 `git ls-files` 列出之檔的行數總和）。最後提交日：`git log -1 --format=%ad --date=short -- <路徑>`；不在 git 者寫 mtime。

一項 = 一列。資料夾若成批判定，寫成一列並標檔數。

## 一、摘要

| 類別 | 項數 | 留 | 改寫 | 併入 | 刪 | 待判 |
|---|---|---|---|---|---|---|
| 二、repo 根目錄、docs、GLOSSARY-MAP | 41 | 4 | 3 | 0 | 31 | 3 |
| 三、memory/ 除 Sens_wiki 以外 | 29 | 4 | 0 | 1 | 16 | 8 |
| 四、.claude、.githooks、.scratch | 65 | 33 | 4 | 1 | 18 | 9 |
| 五、使用者層 ~/.claude/ | 22 | 9 | 1 | 0 | 6 | 5 |
| （含於五）使用者層記憶卡 143 張中判定 | — | 0 | 8 | 0 | 38 | 2 |
| 合計（不含記憶卡列） | 157 | 50 | 8 | 2 | 71 | 25 |

另：六、範本專查 為跨類別的交叉清單，不重複計入上表。記憶卡列的刪項 = 卡數（不是檔案列數）；算法見 § 五之附表。「—」去留的 1 列（~/.claude/agents/ 不存在）未計入。

## 二、repo 根目錄、docs、GLOSSARY-MAP

| 路徑 | 行數 | 用途 | 讀者 | 最後提交 | 被引用（檔數：前 3 檔） | 與誰重複或矛盾 | 去留 | 理由 |
|---|---|---|---|---|---|---|---|---|
| .gitignore | 32 | 忽略 .DS_Store、.env、settings.local.json、.obsidian/ 等 | 程式（git） | 2026-08-01 | 1：config.mjs | 第 5-7 行註解仍稱 CLAUDE.md 是分層規則正本（現為 AGENTS.md）；第 32 行 `tools/superpowers`（該目錄不存在） | 改寫 | 兩處註解與規則指向已不存在的 CLAUDE.md、tools/superpowers；忽略規則本身仍需要 |
| .mcp.json | 16 | 專案層 MCP 伺服器：notion、figma、figma-desktop | 程式（Claude Code） | 2026-03-27 | 1：claudedev-文章逐篇摘錄.md | figma-desktop（127.0.0.1:3845）本工作階段 ECONNREFUSED；notion 與 figma 另有全域連接器（見本工作階段 MCP 清單） | 改寫 | 三個伺服器中 figma-desktop 連不上；保留哪幾個取決於 Notion、Figma 是否仍使用（oq-manage Notion 推送已暫停），須 Miles 決定，列入待判前先標改寫 |
| AGENTS.md | 157 | 專案入口：分層、工作入口、陷阱表、版控 | 模型、人 | 2026-11-04 | 載入檔（全工作階段）；另被 .claude 與 wiki 多處引用 | 與 ~/.claude/CLAUDE.md、記憶卡 32 張有同義句（見 03 盤點 § 二之 2、3）；第 157 行起 docs/adr/ 不存在 | 改寫 | 主對話每次載入；陷阱表與正本分層須重寫（03 盤點已判 32 列全部有他處同義句） |
| GLOSSARY-MAP.md | 10 | 多領域詞彙表入口，指向 ERP 與編輯器兩份詞彙表 | 模型 | 2026-11-04 | 4：AGENTS.md、domain.md、grill.md… | 與 docs/agents/domain.md 配套 | 留 | matt 流程的 domain-modeling 與 grill-with-docs 讀它；從零建專案也會放 |
| docs/agents/domain.md | 37 | 告訴 matt 工程類 skill 如何讀本 repo 領域文件 | 模型 | 2026-11-04 | 1：AGENTS.md | 第 10 行引用 docs/adr/，該資料夾不存在（AGENTS.md 同） | 留 | matt 流程 setup 產物，skill 依賴；其中 docs/adr 缺項屬 domain.md 自述「不存在則靜默略過」 |
| docs/agents/issue-tracker.md | 30 | 記錄議題與規劃單用本機 Markdown（.scratch） | 模型 | 2026-11-04 | 1：AGENTS.md | AGENTS.md § Agent skills 重述同一路徑 | 留 | matt 流程 setup 產物 |
| docs/agents/triage-labels.md | 15 | 五個分類標籤預設 | 模型 | 2026-11-04 | 1：AGENTS.md | AGENTS.md § Triage labels 重述 | 留 | matt 流程 setup 產物 |
| docs/state-machine-flowcharts.md | 237 | 2026-04 的狀態機流程圖（mermaid） | 人 | 2026-04-02 | 1：production-stage-alignment-diff-matrix.md | wiki/erp/06-state-machines 已是狀態機正本；僅被 production-stage-alignment-diff-matrix.md 引用（該檔同列為刪） | 刪 | 前提消失：狀態機正本已在 wiki 06 層，唯一引用者本身可刪 |
| docs/superpowers/plans/2026-06-03-delta-consolidated.md | 54 | superpowers 時期（2026-06～07）的計畫或設計：訂單對外發布 — 完整 delta（執行 worklist） | 人（歷史） | 2026-06-03 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-03-order-external-sync-and-publish-skill.md | 488 | superpowers 時期（2026-06～07）的計畫或設計：訂單模組對外資料更新 + 迭代發布 Skill 強化 實作計畫 | 人（歷史） | 2026-06-03 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-03-phase0-delta-worklist.json | 554 | superpowers 時期（2026-06～07）的計畫或設計：2026-06-03-phase0-delta-worklist.json | 人（歷史） | 2026-06-03 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-03-phase3-field-delta-worklist.md | 63 | superpowers 時期（2026-06～07）的計畫或設計：Phase 3 資料欄位 DB delta worklist（2026-06-03） | 人（歷史） | 2026-06-03 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-03-phase4-linear-delta-draft.md | 61 | superpowers 時期（2026-06～07）的計畫或設計：Phase 4 Linear delta 草稿（2026-06-03） | 人（歷史） | 2026-06-03 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-brd-architecture-and-audit.md | 58 | superpowers 時期（2026-06～07）的計畫或設計：BRD 架構準則統整 + 商業邏輯卡稽核計畫 | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-brd-restructure.md | 159 | superpowers 時期（2026-06～07）的計畫或設計：BRD 商業邏輯層重構計畫 | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-business-processes-spec-migration.md | 317 | superpowers 時期（2026-06～07）的計畫或設計：business-processes/spec.md 搬遷計劃 | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-order-spec-cleanup.md | 452 | superpowers 時期（2026-06～07）的計畫或設計：訂單管理模組規格精簡 Implementation Plan | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-order-spec-restructure-phase2.md | 593 | superpowers 時期（2026-06～07）的計畫或設計：訂單模組規格重構（第二階段）實作計畫 | 人（歷史） | 2026-06-10 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-09-state-machines-spec-migration.md | 221 | superpowers 時期（2026-06～07）的計畫或設計：state-machines/spec.md 完整抽離計劃 | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-06-11-business-scenario-unit.md | 659 | superpowers 時期（2026-06～07）的計畫或設計：業務情境單元 Implementation Plan | 人（歷史） | 2026-06-11 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/plans/2026-07-06-prepress-review-prototype-migration.md | 1368 | superpowers 時期（2026-06～07）的計畫或設計：審稿模組搬移 erp repo prototype 實作計畫 | 人（歷史） | 2026-07-06 | 1：production-stage-alignment-diff-matrix.md | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-08-sdd-diagnosis-findings.md | 82 | superpowers 時期（2026-06～07）的計畫或設計：SDD 現況診斷發現（階段 2 產出） | 人（歷史） | 2026-06-08 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-08-sdd-improvement-blueprint.md | 152 | superpowers 時期（2026-06～07）的計畫或設計：SDD 工作流程改善藍圖 | 人（歷史） | 2026-06-08 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-08-sdd-research-findings.md | 90 | superpowers 時期（2026-06～07）的計畫或設計：SDD 最佳實踐研究發現（階段 1 產出） | 人（歷史） | 2026-06-08 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-08-sdd-workflow-improvement-design.md | 134 | superpowers 時期（2026-06～07）的計畫或設計：SDD 工作流程健檢與改善 — 執行設計 | 人（歷史） | 2026-06-08 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-09-review-return-and-confirm-design.md | 176 | superpowers 時期（2026-06～07）的計畫或設計：審稿流程擴充：合格後返回重審 + 已確認可製作 | 人（歷史） | 2026-06-09 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-10-wiki-log-consolidation-design.md | 75 | superpowers 時期（2026-06～07）的計畫或設計：設計：wiki 單一操作史收斂 + 發布狀態撤離 | 人（歷史） | 2026-06-10 | 2：changelog.md、notion-publish-manifest.md | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md | 119 | superpowers 時期（2026-06～07）的計畫或設計：業務情境單元設計（合併 07-scenarios 與 13-user-stories） | 人（歷史） | 2026-06-11 | 1：2026-06-11-business-scenario-unit.md | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-07-06-prepress-review-prototype-migration-design.md | 182 | superpowers 時期（2026-06～07）的計畫或設計：審稿模組搬移 erp repo prototype 設計文件 | 人（歷史） | 2026-07-06 | 1：2026-07-06-prepress-review-prototype-migration.md | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| docs/superpowers/specs/2026-07-07-linear-delivery-architecture-design.md | 56 | superpowers 時期（2026-06～07）的計畫或設計：Linear 交付文件架構收斂設計 | 人（歷史） | 2026-07-07 | 0 | OpenSpec、SDD 工作流前提已消失；superpowers 外掛已停用（~/.claude/settings.json enabledPlugins false） | 刪 | 0 檔引用（內部互引除外）；對應工作已完成或改走 .scratch 規劃單 |
| factory-brd-audit-report-2026-07-22.md | 116 | 根目錄雜檔：工廠階段商業現況盤點：矛盾清單（2026-07-22） | 人（歷史） | 2026-07-22 | 2：factory-business-current-state-2026-07-22.md、過去規劃盤點.md | — | 刪 | 2026-07 工廠 BRD 稽核報告；只被同日的 factory-business-current-state 與重構盤點紀錄引用 |
| factory-business-current-state-2026-07-22.md | 101 | 根目錄雜檔：工廠階段業務現況彙整（2026-07-22） | 人（歷史） | 2026-07-22 | 3：production-stage-high-level-design.md、過去規劃盤點.md、production-stage-openspec-cleanup-plan.md | — | 刪 | 2026-07 工廠現況紀錄；wiki log 與歸檔計畫引用其名，無正本卡引用 |
| openspec-vault-reconcile-report-2026-05-30.md | 250 | 根目錄雜檔：OpenSpec → Obsidian 商業邏輯收斂回補報告 | 人（歷史） | 2026-05-31 | 0 | — | 刪 | OpenSpec 對帳報告；OpenSpec 已退場，0 引用 |
| order-invoice-manual-test-notes.md | 593 | 根目錄雜檔：訂單與發票金額進位實測筆記 | 人（歷史） | 2026-08-21 | 1：BI-027-發票改多品項時的金額口徑.md | — | 待判 | 實測筆記；被已封存 OQ BI-027 引用為來源。缺：該 OQ 的來源欄是否可改為卡內自含 |
| production-stage-alignment-diff-matrix.md | 1244 | 根目錄雜檔：生產階段三方差異矩陣（wiki 基準 × openspec × prototype） | 人（歷史） | 2026-08-12 | 7：production-stage-seg1-design.md、production-stage-seg2-alignment.md、production-stage-seg2-design.md… | — | 刪 | 2026-08 生產階段對齊差異矩陣（1244 行）；僅被 plans 封存稿引用 |
| production-stage-dispatch-waybill-asis.md | 126 | 根目錄雜檔：派單／運單後端實作盤點（as-is，2026-08-11） | 人（歷史） | 2026-08-11 | 3：production-stage-seg3-design.md、production-stage-seg3-grill.md、production-stage-handover.md | — | 刪 | 2026-08 派單／運單現況；AGENTS 要求派單類規劃改讀 sensation-api 程式碼，不讀此檔 |
| production-stage-handover.md | 170 | 根目錄雜檔：生產階段校正 Handover（段 1 完成 → 段 2 接手） | 人（歷史） | 2026-10-04 | 1：production-stage-seg4-grill.md | — | 刪 | 2026-10-04 交接稿；僅被 plans 封存稿引用 |
| production-stage-openspec-cleanup-plan.md | 129 | 根目錄雜檔：生產階段 openspec 清整計畫 | 人（歷史） | 2026-10-04 | 2：SHP-006-出貨模組spec待建立.md、過去規劃盤點.md | — | 刪 | OpenSpec 清整計畫；OpenSpec 已退場 |
| production-stage-seg1-manual-artifact.html | 9561 | 根目錄雜檔：production-stage-seg1-manual-artifact.html | 人（歷史） | 2026-10-26 | 6：README.md、manual-brief-common.md、report-qc-shipping.md… | — | 待判 | 操作手冊單一 HTML（9560 行）；被 manual-audit、manual-writing-rules 引用。缺：手冊以 Artifact 固定網址發布後，本檔是否仍是編輯來源 |
| production-stage-seg1-manual.html | 918 | 根目錄雜檔：production-stage-seg1-manual.html | 人（歷史） | 2026-08-06 | 0 | — | 刪 | 2026-08 手冊舊版（918 行）；0 引用，已由 -artifact 版取代 |
| decks/（6 檔） | 6 檔 / 1732 行 | 2026-05 簡報與示意圖（售後設計比較、齊套規則架構、泳道圖等） | 人（歷史） | 2026-05-19 | 1：scope-boundary.md（其餘由 diff-matrix 引用） | after-sales-design-comparison.html 被 wiki scope-boundary.md 引用；其餘 5 檔僅被 diff-matrix 引用 | 待判 | 缺：scope-boundary.md 對該 HTML 的引用是否為必要出處；其餘 5 檔可刪 |

## 三、memory/ 除 Sens_wiki 以外

| 路徑 | 行數 | 用途 | 讀者 | 最後提交 | 被引用（檔數：前 3 檔） | 與誰重複或矛盾 | 去留 | 理由 |
|---|---|---|---|---|---|---|---|---|
| memory/MEMORY.md | 6 | repo 內舊記憶索引（6 行，只列 2 筆） | —（無人讀） | 2026-03-25 | 0 | 第 3 列指向不存在的 feedback_oq_management.md；與 ~/.claude/.../memory/MEMORY.md 是兩份不同索引（03 盤點 § 三之 5） | 刪 | 0 檔引用；索引項一筆失效、一筆指向已判刪的 notion-mcp-guidelines |
| memory/shared/non-business-terms.md | 36 | 流程用語與工具詞核准用法對照（36 行） | 模型（子代理任務書指名必讀） | 2026-11-04 | 30：erp-researcher.md、plan-auditor.md、SKILL.md… | 與 ~/.claude/CLAUDE.md 用語段（語言與用語，第 3-20 行）部分重疊；句法另在 ste100-pm.md 第 42 行引用本檔 | 留 | 多檔引用（AGENTS、各 skill、2 個子代理定義，檔數見引用欄）；從零建立也需要「核准用語」表 |
| memory/shared/派工任務書範本.md | 70 | 派子代理的任務書範本（70 行） | 模型（主對話） | 2026-11-04 | 8：推演者派工單.md、稽核者派工單.md、判讀派工單.md… | AGENTS.md 工作入口表第 44 行重述其用途；skill 各自再寫「任務書須指名讀 non-business-terms」 | 留 | AGENTS 與多個 skill 引用（檔數見引用欄）。近 60 天產出檔案：0（任務書不存檔，見 vault-ingest/SKILL.md 第 21 行） |
| memory/shared/notion-mcp-guidelines.md | 104 | Notion MCP 操作指引（104 行，2026-07） | 模型 | 2026-07-06 | 1：MEMORY.md | oq-manage 稱 Notion Follow-up DB 推送暫停 | 刪 | 引用者只有已判刪的 memory/MEMORY.md；Notion 推送暫停 |
| memory/shared/ui-business-rules.md | 251 | 介面業務規則（251 行） | 模型、人 | 2026-10-27 | 2：scope-boundary.md、ui-wording.md | 被 ui-wording.md 與 wiki scope-boundary.md 引用；內容是否與 wiki 規則重複未查證 | 待判 | 缺：251 行逐段對 wiki 規則卡比對；AGENTS 正本分層只認 wiki 為業務規則正本 |
| memory/shared/ui-wording.md | 29 | 介面用字規則（29 行） | 模型、測試程式 | 2026-11-04 | 8：scenario-catalog.md、_setup.mjs、shipping.spec.mjs… | erp-prototype-tests/tests/e2e/14-query-ui/ui-wording.spec.mjs 讀取 | 留 | 測試程式直接引用（見引用欄） |
| memory/erp/bom-card-restructure-20261028/ | 2 檔 / 101 行 | BOM 卡重構的 grill 與落點表（2 檔） | 人（歷史）、必要時模型 | 2026-10-28 | wiki 卡 4 張；skill/AGENTS/測試 0 檔 | — | 刪 | 完成的 grill 工作稿；拍板已落卡。wiki 4 張卡 source 欄引用此路徑，刪除前須改 source 字串（`source` 只能是出處指標，見 wiki_lint S15） |
| memory/erp/erp-mes-standard-alignment-20261028/ | 10 檔 / 1572 行 | ERP/MES 標準對照研究稿（10 檔，4 個 HTML） | 人（歷史）、必要時模型 | 2026-10-29 | wiki 卡 1 張；skill/AGENTS/測試 0 檔 | — | 刪 | 研究產物已進 raw 卡；過程稿與說明用 HTML 無後續讀者。raw 卡 4 張引用路徑，wiki 卡 1 張 |
| memory/erp/feature-draft-20261004/ | 4 檔 / 2925 行 | 工單與需求單 Feature 票試寫（4 檔） | 人（歷史）、必要時模型 | 2026-10-05 | wiki 卡 0 張；skill/AGENTS/測試 0 檔 | — | 刪 | 0 引用；Linear 是交付正本 |
| memory/erp/linear-drafts/ | 126 檔 / 23197 行 | Linear 交付草稿與任務書（126 檔，14 個交付批次資料夾） | 人（歷史）、必要時模型 | 2026-10-26 | wiki 卡 3 張；skill/AGENTS/測試 0 檔 | — | 刪 | Linear 是對開發的唯一交付正本（AGENTS § 正本分層）；草稿近 60 天新增 126 檔、11-04 後 0 檔。wiki 3 張卡引用 |
| memory/erp/manual-audit-20260923/ | 41 檔 / 27960 行 | 操作手冊對照 Prototype 的稽核與重寫工作稿（41 檔，含 JSON 輸入輸出） | 人（歷史）、必要時模型 | 2026-10-04 | wiki 卡 8 張；skill/AGENTS/測試 0 檔 | — | 待判 | 缺：操作手冊工作流是否持續。wiki 8 張 OQ 卡的 source-link 引用；wiki-amend/references/下游更正表.md 第 12 行把操作手冊（manual-writing-rules.md）列為下游 |
| memory/erp/manual-vs-prototype-audit-20260907.md | 130 | 手冊（41 頁）對 Prototype 的比對稿（2026-09） | 人（歷史） | 2026-09-08 | 0 | 被 manual-audit-20260923 取代 | 刪 | 0 引用；9 月舊版比對 |
| memory/erp/manual-writing-rules.md | 95 | 操作手冊撰寫規則（95 行） | 模型（寫手冊時） | 2026-10-04 | 4：下游更正表.md、QR-010-需求單成本評估的實務分工與系統把關落差.md、manual-brief-common.md… | — | 待判 | 被 wiki-amend/references/下游更正表.md 與 1 張封存 OQ 引用；缺：操作手冊是否為本專案持續交付物 |
| memory/erp/notion-publish-manifest.md | 38 | Notion 發布清單（38 行，2026-06-11） | — | 2026-06-11 | 2：2026-06-10-wiki-log-consolidation-design.md、wiki-schema.md | Notion 推送暫停（oq-manage） | 刪 | 被 wiki-schema.md 與 2026-06 設計稿提及；發布流程已停 |
| memory/erp/plans/_archives/2026/2026/ | ? | 已封存規劃稿（grill、design、audit）：2026 | 人（歷史） | — | wiki 卡 0 張 | AGENTS.md：規劃單做完不合併、不當長期正本；拍板內容應已落 wiki 卡 | 待判 | wiki 卡 0 張的 source 欄引用此路徑；缺：source 欄引用是否可改為「某日拍板」字串而不指檔案 |
| memory/erp/production-dispatch-report-transfer-20261006/ | 1 檔 / 198 行 | 生產段分派、報工、轉交 grill 決策（1 檔 198 行） | 人（歷史）、必要時模型 | 2026-10-20 | wiki 卡 53 張；skill/AGENTS/測試 0 檔 | — | 待判 | wiki 卡引用數見右欄；缺：source 欄改寫方式 |
| memory/erp/production-quantity-audit-20261026/ | 5 檔 / 1793 行 | 印件生產階段數量帳重構 grill（5 檔；記憶卡標進行中，待裁決 P1-P7） | 人（歷史）、必要時模型 | 2026-10-28 | wiki 卡 28 張；skill/AGENTS/測試 0 檔 | — | 留 | 記憶卡 project_production_quantity_audit_grill_20261026 標進行中；結案前不動 |
| memory/erp/skill-rewrite-20261029/評測集/ | 46 檔 / 5982 行 | erp-plan、erp-audit 觸發與稽核評測集（回放集、缺陷注入、觸發結果 jsonl、重放腳本） | 模型（評測時）、人 | 2026-11-04 | skill 3 檔（erp-audit/SKILL.md、references/評測集.md、erp-plan/CHANGELOG.md） | erp-audit/references/評測集.md 指向此處；SKILL.md 第 23 行引用稽核回放集 | 待判 | erp-audit 去留與評測做法由後續決策票決定；缺：新流程是否沿用此評測方式 |
| memory/erp/skill-rewrite-20261029/重構計畫-初稿.md | 1551 | skill 重構工作稿：重構計畫-初稿 | 人（歷史） | 2026-11-04 | 0 | — | 刪 | skill 重構的批次計畫；已執行完（記憶卡：批次 0.5～7 已合併）；各 skill CHANGELOG 引用其名（歷史敘述） |
| memory/erp/skill-rewrite-20261029/過去規劃盤點.md | 443 | skill 重構工作稿：過去規劃盤點 | 人（歷史） | 2026-10-29 | 2：基線結果.md、重構計畫-初稿.md | — | 刪 | 重構前盤點；各 skill CHANGELOG 引用其名（歷史敘述） |
| memory/erp/skill-rewrite-20261029/OpenSpec升級比對.md | 75 | skill 重構工作稿：OpenSpec升級比對 | 人（歷史） | 2026-10-29 | 1：重構計畫-初稿.md | — | 刪 | OpenSpec 升級比對；OpenSpec 已退場；各 skill CHANGELOG 引用其名（歷史敘述） |
| memory/erp/skill-rewrite-20261029/claudedev-建議清單-raw草稿.md | 238 | skill 重構工作稿：claudedev-建議清單-raw草稿 | 人（歷史） | 2026-10-29 | 0 | — | 刪 | claude.dev 建議清單草稿；已進 raw 卡；各 skill CHANGELOG 引用其名（歷史敘述） |
| memory/erp/skill-rewrite-20261029/claudedev-文章逐篇摘錄.md | 701 | skill 重構工作稿：claudedev-文章逐篇摘錄 | 人（歷史） | 2026-10-29 | 3：2026-10-29-claude-research-claude.dev對Claude5世代的使用建議.md、claudedev-建議清單-raw草稿.md、重構計畫-初稿.md | — | 刪 | 文章摘錄；已進 raw 卡；各 skill CHANGELOG 引用其名（歷史敘述） |
| memory/erp/wiki-iteration-20261004/ | 9 檔 / 3214 行 | 訂單與工單商業情境迭代的 grill、稽核、設計稿（9 檔） | 人（歷史）、必要時模型 | 2026-10-06 | wiki 卡 1 張；skill/AGENTS/測試 0 檔 | — | 刪 | 記憶卡標已落卡提交 05498b6；wiki 1 張卡引用 |
| memory/erp/wiki-normalization-20261104/掛鉤檢查項.md | 47 | wiki_lint 檢查項代號與意義正本 | 模型、程式（wiki_lint.py 註解指向） | 2026-11-05 | 5：wiki_lint.py、grill.md、第7批-待裁決.md… | wiki_lint.py 第 4 行註明「定稿後移入」規範卡 | 併入 | 移入 wiki 規範（卡片撰寫共用規範或 wiki-schema）後原檔刪；此為移入動作而非新規則 |
| memory/erp/wiki-normalization-20261104/工具/source_pointer.py | 40 | source 欄轉出處指標的一次性腳本 | 程式 | 2026-11-04 | 0 | — | 刪 | 遷移批次的一次性工具；0 引用 |
| memory/erp/wiki-normalization-20261104/（批次盤點、待裁決、範圍、能力問題、稅務法條、角色與權限等 51 檔） | 54 檔 / 20447 行 | wiki 正規化第 1-7 批工作稿與遷移前後能力問答對照 | 人（歷史）、Miles 回覆出處 | 2026-11-11 | wiki 卡 193 張 | wiki 卡 source 欄引用 193 張（Miles 回覆日期出處，如「第5批-待裁決.md § 三 T3」） | 待判 | 遷移批 7 未結、批 8 未開始（03 盤點 § 十）；缺：遷移結案後是否整批刪、source 欄改寫方式 |
| memory/erp/wiki-tag-golden-set.md | 91 | 領域 tag 檢索驗收題庫（91 行，已驗收 10/10） | 人、模型（回歸測試用） | 2026-10-14 | 0 | — | 待判 | 0 檔引用；卡內自述保留供 tag 調整時回歸測試。缺：新流程是否還依 tag 檢索 |
| memory/erp/workflow-change-as-design-carrier-20261022.md | 50 | 以 change 資料夾為設計載體的流程拍板（W1-W8，50 行） | — | 2026-10-23 | 2：過去規劃盤點.md、重構計畫-初稿.md | 與 AGENTS.md「規劃單是 .scratch/<主題>/spec.md」矛盾（記憶卡 03 盤點判翻案） | 刪 | 前提（OpenSpec change）已消失；現行流程在 AGENTS.md 工作入口表 |

## 四、.claude、.githooks、.scratch

| 路徑 | 行數 | 用途 | 讀者 | 最後提交 | 被引用（檔數：前 3 檔） | 與誰重複或矛盾 | 去留 | 理由 |
|---|---|---|---|---|---|---|---|---|
| .claude/agents/plan-auditor.md | 30 | erp-audit 派用的稽核者、推演者、懷疑者（30 行；model: opus） | 模型（子代理） | 2026-11-04 | 7：SKILL.md、稽核者派工單.md、評測集.md… | 第 10 行「模型暫定 opus，待 D8」；AGENTS § 模型分工、~/.claude/settings.json（CLAUDE_CODE_SUBAGENT_MODEL=opus[1m]）三處並存 | 改寫 | 近 60 天派用 17 次；待 D8 句已過期。3 份 skill 引用 |
| .claude/agents/erp-researcher.md | 30 | erp-plan 調研經同意後的調研子代理（30 行；model: sonnet） | 模型（子代理） | 2026-11-04 | 7：調研判斷.md、SKILL.md、調研派工單.md… | 與已啟用外掛 mattpocock-skills:research 目的重疊；與 vault-ingest/references/調研派工單.md 成對 | 待判 | 近 60 天派用 4 次；缺：mattpocock research skill 近 60 天使用次數（03 盤點未列） |
| .claude/settings.json | 77 | 專案設定：PostToolUse 跑 wiki_lint --hook、允許清單 53 項 | 程式（Claude Code） | 2026-11-04 | 2：claudedev-文章逐篇摘錄.md、重構計畫-初稿.md | 7 項過期允許（03 盤點 § 五之 2） | 改寫 | hook 與必要允許保留；7 項過期（不存在的 nvm 路徑、erp-spec skill、不在本 repo 的路徑）移除 |
| .claude/settings.local.json | 約 179 允許＋2 hook | 本機設定（gitignored）：Stop 空 hook、push hook、允許 179 項 | 程式（Claude Code） | 未進版控（.gitignore 第 17 行） | AGENTS.md 提及功能；.gitignore 第 17 行 | push hook 即 AGENTS.md 所稱「提交後 hook 自動推送」；179 項中 58 項過期，另有 Bash(grep:*)、Bash(python3:*) 大範圍規則使細項冗餘 | 併入 | 需要的唯一功能是 git commit 後自動 push：併入 settings.json 後整檔刪（Stop 的 `exit 0` 無作用） |
| .claude/worktrees/beautiful-neumann-a844ac/.claude/settings.local.json | 11 | 誤入版控的舊工作樹設定副本 | — | 2026-06-10 | 0 | 與 .gitignore 規則並存（03 盤點 § 五） | 刪 | git ls-files 顯示被追蹤；內容屬已不存在的工作樹 |
| .claude/launch.json | 35 | 預覽伺服器設定：erp(3000)、erp-verify(3020)、erp-shipment-logistics(3031) | 程式（preview_start） | 2026-10-27 | 1：production-stage-handover.md | 第三筆指向 /Users/b-f-03-029/erp-shipment-logistics，該目錄不存在 | 改寫 | 刪第三筆；前兩筆服務 Prototype 預覽 |
| .githooks/pre-commit | 8 | 暫存區有 wiki 卡時跑 wiki_lint --staged（8 行） | 程式（git） | 2026-11-04 | 0 | 與 settings.json 的 PostToolUse hook 跑同一支腳本；7 個工作樹 core.hooksPath 被覆寫為空目錄（03 盤點 § 五），這道檢查在那裡不生效 | 留 | 提交前最後一道機械檢查；從零建立仍需要（hooksPath 問題另案） |
| .claude/skills/defuddle/SKILL.md | 41 | 外部通用 skill：defuddle（SKILL.md） | 模型 | 2026-05-31 | 1：重構計畫-初稿.md | — | 刪 | 網頁轉 Markdown 通用 skill；全期 1 次（2026-07-28）；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/erp-audit/CHANGELOG.md | 23 | erp-audit 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/erp-audit/SKILL.md | 75 | erp-audit 的入口說明（erp-audit） | 模型 | 2026-11-04 | 1：README.md | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：0 次 Skill 呼叫（11-04 由 plan-audit 與 misjudgement-record 合併；舊名近 60 天合計 10 次）；本身依賴 評測集（待判） |
| .claude/skills/erp-audit/references/推演者派工單.md | 57 | erp-audit 參考檔：推演者派工單 | 模型 | 2026-11-04 | 4：plan-auditor.md、SKILL.md、重構計畫-初稿.md… | — | 留 | 同上 |
| .claude/skills/erp-audit/references/稽核者派工單.md | 57 | erp-audit 參考檔：稽核者派工單 | 模型 | 2026-11-04 | 5：plan-auditor.md、SKILL.md、任務書-新skill-注入版2.md… | — | 留 | 稽核派工起手；與推演者派工單結構相近但判定不同 |
| .claude/skills/erp-audit/references/評測集.md | 52 | erp-audit 參考檔：評測集 | 模型 | 2026-11-04 | 19：SKILL.md、誤判要素.md、SKILL.md… | — | 待判 | 指向 memory/erp/skill-rewrite 評測集；缺：新流程是否沿用此評測 |
| .claude/skills/erp-audit/references/誤判要素.md | 60 | erp-audit 參考檔：誤判要素 | 模型 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | — | 留 | Miles 指出誤判時的建檔規範；11 月 4 日由 misjudgement-record 併入 |
| .claude/skills/erp-audit/scripts/收件檢查.py | 106 | erp-audit 參考檔：收件檢查.py | 程式 | 2026-11-04 | 10：SKILL.md、設計收件.md、shipment-draft-and-qc-queue-audit-r1.md… | — | 留 | 27 次執行；機械檢查 spec.md 七節標題 |
| .claude/skills/erp-plan/CHANGELOG.md | 39 | erp-plan 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/erp-plan/SKILL.md | 77 | erp-plan 的入口說明（erp-plan） | 模型 | 2026-11-04 | 3：平行盤點.workflow.js、skill改寫準則.md、新版-出貨批次列印與下載中心.md | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：近 60 天 3 次（含舊名 39 次中的 22 次） |
| .claude/skills/erp-plan/references/平行盤點.workflow.js | 135 | erp-plan 參考檔：平行盤點.workflow.js | 程式 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | — | 留 | 10 次使用；平行盤點多領域 |
| .claude/skills/erp-plan/references/盤點方法.md | 55 | erp-plan 參考檔：盤點方法 | 模型 | 2026-11-04 | 6：SKILL.md、平行盤點.workflow.js、audit-failure-patterns.md… | — | 留 | erp-plan 盤點步驟 |
| .claude/skills/erp-plan/references/衝突檢查.md | 33 | erp-plan 參考檔：衝突檢查 | 模型 | 2026-11-04 | 4：SKILL.md、盤點方法.md、2026-06-08-sdd-diagnosis-findings.md… | — | 留 | 矛盾偵測（與 vault-audit 維度 1、AGENTS 停下規則同主題，見 03 盤點 § 四之 3） |
| .claude/skills/erp-plan/references/設計收件.md | 61 | erp-plan 參考檔：設計收件 | 模型 | 2026-11-04 | 8：SKILL.md、AGENTS.md、ERP 資料結構總覽.md… | — | 留 | spec.md 內容落點與自檢；近 60 天 .scratch 新增 spec.md 3 份 |
| .claude/skills/erp-plan/references/調研判斷.md | 41 | erp-plan 參考檔：調研判斷 | 模型 | 2026-11-04 | 6：SKILL.md、平行盤點.workflow.js、盤點方法.md… | 與 .claude/agents/erp-researcher.md 成組 | 待判 | 與 erp-researcher、調研派工單成組；缺：mattpocock research skill 是否取代 |
| .claude/skills/frontend-design/SKILL.md | 42 | 外部通用 skill：frontend-design（SKILL.md） | 模型 | 2026-03-23 | 1：重構計畫-初稿.md | — | 刪 | 前端設計通用 skill；全期 0 次；Prototype 在 erp repo；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/json-canvas/SKILL.md | 244 | 外部通用 skill：json-canvas（SKILL.md） | 模型 | 2026-06-10 | 1：重構計畫-初稿.md | — | 刪 | JSON Canvas 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/json-canvas/references/EXAMPLES.md | 329 | 外部通用 skill：json-canvas（EXAMPLES.md） | 模型 | 2026-06-10 | 0 | — | 刪 | JSON Canvas 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/linear-delivery/SKILL.md | 151 | linear-delivery 的入口說明（linear-delivery） | 模型 | 2026-11-04 | 3：2026-06-03-order-external-sync-and-publish-skill.md、任務書.md、重構計畫-初稿.md | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：近 60 天 12 次 |
| .claude/skills/linear-delivery/references/CHANGELOG.md | 156 | linear-delivery 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/linear-delivery/references/blocked-cases-log.md | 277 | linear-delivery 參考檔：被擋案例紀錄（規範演化原料） | 模型 | 2026-11-05 | 3：SKILL.md、落點表.md、重構計畫-初稿.md | — | 待判 | 案例紀錄（277 行，只追加）；缺：是否屬 skill 本體；SKILL 與 CHANGELOG 引用 |
| .claude/skills/linear-delivery/references/範例 - Linear 交付.md | 388 | linear-delivery 參考檔：範例 - Linear 交付 | 模型 | 2026-11-04 | 7：SKILL.md、範本 - Linear 交付.md、規範 - Linear 交付.md… | — | 留 | 範例卡（388 行）；與範本、規範成三件組 |
| .claude/skills/linear-delivery/references/範本 - Linear 交付.md | 198 | linear-delivery 參考檔：範本 - Linear 交付 | 模型 | 2026-11-04 | 3：SKILL.md、規範 - Linear 交付.md、任務書.md | — | 留 | Linear 交付範本 |
| .claude/skills/linear-delivery/references/規範 - Linear 交付.md | 339 | linear-delivery 參考檔：規範 - Linear 交付 | 模型 | 2026-11-04 | 5：SKILL.md、範例 - Linear 交付.md、範本 - Linear 交付.md… | — | 留 | Linear 交付規範（339 行） |
| .claude/skills/obsidian-bases/SKILL.md | 497 | 外部通用 skill：obsidian-bases（SKILL.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Bases 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md | 173 | 外部通用 skill：obsidian-bases（FUNCTIONS_REFERENCE.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Bases 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/obsidian-markdown/SKILL.md | 196 | 外部通用 skill：obsidian-markdown（SKILL.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Markdown 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/obsidian-markdown/references/CALLOUTS.md | 58 | 外部通用 skill：obsidian-markdown（CALLOUTS.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Markdown 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/obsidian-markdown/references/EMBEDS.md | 63 | 外部通用 skill：obsidian-markdown（EMBEDS.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Markdown 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/obsidian-markdown/references/PROPERTIES.md | 61 | 外部通用 skill：obsidian-markdown（PROPERTIES.md） | 模型 | 2026-06-10 | 0 | — | 刪 | Obsidian Markdown 通用 skill；全期 0 次；AGENTS.md、wiki AGENTS、其他 skill 均未引用；可由外掛或重新安裝取得 |
| .claude/skills/oq-manage/CHANGELOG.md | 28 | oq-manage 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/oq-manage/SKILL.md | 71 | oq-manage 的入口說明（oq-manage） | 模型 | 2026-11-04 | 5：README.md、OQ運作總覽.md、規範 - OQ.md… | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 改寫 | 使用證據：近 60 天 18 次；內含不存在路徑 memory/Sens_wiki/CLAUDE.md（已改名 AGENTS.md） |
| .claude/skills/oq-manage/references/去重方法.md | 35 | oq-manage 參考檔：去重方法 | 模型 | 2026-11-04 | 3：SKILL.md、待裁決清單格式.md、重構計畫-初稿.md | — | 留 | 開 OQ 前查重 |
| .claude/skills/oq-manage/references/待裁決清單格式.md | 40 | oq-manage 參考檔：待裁決清單格式 | 模型 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | — | 留 | 列待裁決項給 Miles 的格式 |
| .claude/skills/oq-manage/references/整理報告格式.md | 29 | oq-manage 參考檔：整理報告格式 | 模型 | 2026-11-04 | 2：SKILL.md、基線結果.md | — | 留 | mode E 報告與門檻值唯一出處；vault-audit 維度 8 引用 |
| .claude/skills/vault-audit/CHANGELOG.md | 20 | vault-audit 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/vault-audit/SKILL.md | 77 | vault-audit 的入口說明（vault-audit） | 模型 | 2026-11-04 | 4：2026-06-08-sdd-diagnosis-findings.md、README.md、changelog.md… | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：近 60 天 1 次；腳本 authority_check 260 次、wiki_lint 184 次 |
| .claude/skills/vault-audit/references/判讀派工單.md | 49 | vault-audit 參考檔：判讀派工單 | 模型 | 2026-11-04 | 3：SKILL.md、稽核維度.md、重構計畫-初稿.md | — | 留 | vault-audit 判讀子代理任務書 |
| .claude/skills/vault-audit/references/稽核維度.md | 225 | vault-audit 參考檔：稽核維度 | 模型 | 2026-11-04 | 38：誤判要素.md、SKILL.md、判讀派工單.md… | — | 留 | 健檢維度 225 行；門檻 lint_error_codes、lint_done_domains 現為「無」（03 盤點 § 五之 3） |
| .claude/skills/vault-audit/scripts/authority_check.py | 431 | vault-audit 參考檔：authority_check.py | 程式 | 2026-10-20 | 11：SKILL.md、稽核維度.md、mechanical_check.py… | — | 留 | 260 次執行；權責結構格式檢查 |
| .claude/skills/vault-audit/scripts/mechanical_check.py | 745 | vault-audit 參考檔：mechanical_check.py | 程式 | 2026-11-04 | 4：SKILL.md、wiki_lint.py、基線結果.md… | — | 留 | 26 次執行；被 wiki_lint.py import |
| .claude/skills/vault-audit/scripts/wiki_lint.py | 549 | vault-audit 參考檔：wiki_lint.py | 程式 | 2026-11-05 | 14：settings.json、SKILL.md、稽核維度.md… | — | 留 | 184 次手動執行＋寫入 hook＋pre-commit；機械檢查核心 |
| .claude/skills/vault-ingest/CHANGELOG.md | 17 | vault-ingest 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/vault-ingest/SKILL.md | 77 | vault-ingest 的入口說明（vault-ingest） | 模型 | 2026-11-04 | 6：2026-10-29-claude-research-PrintVis承接印刷業務範圍的覆蓋與導入方法.md、2026-10-29-claude-research-SAP承接印刷業務範圍的覆蓋與導入方法.md、2026-10-29-claude-research-Salesforce承接印刷業務範圍的覆蓋與導入方法.md… | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：近 60 天 1 次 |
| .claude/skills/vault-ingest/references/去處表.md | 39 | vault-ingest 參考檔：去處表 | 模型 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | — | 留 | raw 分流去處 |
| .claude/skills/vault-ingest/references/掃描報告格式.md | 30 | vault-ingest 參考檔：掃描報告格式（mode C） | 模型 | 2026-11-04 | 5：稽核維度.md、mechanical_check.py、SKILL.md… | — | 留 | mode C 門檻值唯一出處；稽核維度 9 引用 |
| .claude/skills/vault-ingest/references/查證紀錄格式.md | 30 | vault-ingest 參考檔：查證紀錄格式 | 模型 | 2026-11-04 | 3：SKILL.md、範本 - Raw 素材.md、重構計畫-初稿.md | — | 留 | claude-research 寫入 raw 前抽查；最近 9 張新 claude-research 卡適用 |
| .claude/skills/vault-ingest/references/調研派工單.md | 49 | vault-ingest 參考檔：調研派工單 | 模型 | 2026-11-04 | 5：erp-researcher.md、調研判斷.md、SKILL.md… | 與 .claude/agents/erp-researcher.md 成組 | 待判 | 與 erp-researcher、調研判斷成組；缺：mattpocock research skill 是否取代 |
| .claude/skills/wiki-amend/CHANGELOG.md | 28 | wiki-amend 的改版紀錄（只追加層） | 人（歷史） | 2026-11-04 | 5：SKILL.md、SKILL.md、changes.md… | 與 git log 重複；全域 CLAUDE.md 要求歷史放只追加層，但專案未指名載體 | 刪 | git log 已有每次改動；內含評測數據行（erp-plan CHANGELOG 第 31 行、erp-audit CHANGELOG 第 15 行）原始檔在 memory/erp/skill-rewrite 評測集，刪前確認 |
| .claude/skills/wiki-amend/SKILL.md | 83 | wiki-amend 的入口說明（wiki-amend） | 模型 | 2026-11-04 | 3：wiki-amend-taskbook.md、wiki-amend-taskbook.md、第7批-盤點.md | 七個 SKILL.md 都各寫一次「任務書須指名讀 non-business-terms」；陷阱表歷史事件在 erp-plan 與 wiki-amend 重複（03 盤點 § 四之 3） | 留 | 使用證據：近 60 天 26 次 |
| .claude/skills/wiki-amend/references/下游更正表.md | 33 | wiki-amend 參考檔：下游更正表 | 模型 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | — | 留 | 改卡後須同步的下游表 |
| .claude/skills/wiki-amend/references/落點判準.md | 108 | wiki-amend 參考檔：落點判準 | 模型 | 2026-11-04 | 4：SKILL.md、重構計畫-初稿.md、第7批-待裁決.md… | — | 留 | 108 行；一個事實落一張卡的判準 |
| .claude/skills/wiki-amend/references/連帶分析.md | 41 | wiki-amend 參考檔：連帶分析 | 模型 | 2026-11-04 | 2：SKILL.md、重構計畫-初稿.md | erp-plan/SKILL.md 產出表「連帶影響」 | 留 | 與 erp-plan 盤點報告的連帶影響段落重疊（03 盤點 § 四之 3）；wiki-amend 為連帶分析的唯一入口 |
| .scratch/experience-handover/ | 10 檔 / 507 行 | 規劃單工作目錄：experience-handover | 人、模型 | 2026-11-05 | wiki 卡 14 張；skill/AGENTS 0 檔 | AGENTS.md：規劃單一次性，不合併 | 待判 | 10 檔（precheck、grill、spec、audit r1-r3、issues 4 張）；缺：是否已實作完成。AGENTS：規劃單做完不當長期正本；wiki 卡 source 欄有引用 |
| .scratch/l1-feedback-optimization/ | 6 檔 / 1027 行 | 規劃單工作目錄：l1-feedback-optimization | 人、模型 | 2026-11-05 | wiki 卡 21 張；skill/AGENTS 0 檔 | AGENTS.md：規劃單一次性，不合併 | 待判 | 6 檔；同上 |
| .scratch/quote-versions/ | 14 檔 / 641 行 | 規劃單工作目錄：quote-versions | 人、模型 | 2026-11-05 | wiki 卡 32 張；skill/AGENTS 0 檔 | AGENTS.md：規劃單一次性，不合併 | 待判 | 14 檔（含 issues 8 張）；同上 |
| .scratch/matt-migration/ | 1 檔 / 84 行 | 規劃單工作目錄：matt-migration | 人、模型 | 2026-11-04 | wiki 卡 0 張；skill/AGENTS 1 檔 | AGENTS.md：規劃單一次性，不合併 | 待判 | 1 檔 skill改寫準則.md（84 行）；缺：改寫準則是否被 workflow-rebuild 取代 |
| .scratch/workflow-rebuild/ | 20 檔 / 1839 行 | 本次工作環境重建的地圖、15 張票、調研（20 檔） | 人、模型 | 2026-11-11 | 0（自身入口） | — | 留 | 進行中；Miles 2026-11-11 決定以此為接續入口 |

## 五、使用者層 ~/.claude/

| 路徑 | 行數 | 用途 | 讀者 | 最後提交 | 被引用（檔數：前 3 檔） | 與誰重複或矛盾 | 去留 | 理由 |
|---|---|---|---|---|---|---|---|---|
| ~/.claude/CLAUDE.md | 46 | 全域偏好：語言、用語、表達限制、推論、轉述查證、文件迭代 | 模型（所有專案） | 2026-11-04(mtime) | AGENTS.md | AGENTS.md 第 9 行聲明「本檔不重述」；用語段與 memory/shared/non-business-terms.md、ste100-pm.md 用詞段（第 37-44 行）三處並存 | 留 | 全域偏好唯一正本；若重建，內容分層須與 AGENTS 對齊 |
| ~/.claude/output-styles/ste100-pm.md | 66 | 回覆句法規則唯一正本（STE100 PM） | 模型（主對話；子代理經 hook） | 2026-11-04(mtime) | AGENTS.md、settings.json、hook | 與 CLAUDE.md 語氣段、表達限制段有交集 | 留 | settings.json outputStyle 載入；SubagentStart hook 讀取；AGENTS.md 與 3 份 skill 引用 |
| ~/.claude/hooks/ste100-subagent-context.py | 30 | SubagentStart：把輸出風格全文送給子代理 | 程式 | 2026-11-04(mtime) | — | — | 留 | 子代理只能經此取得輸出風格；30 行 |
| ~/.claude/skills/obsidian-cli/SKILL.md | 106 | Obsidian CLI 使用說明 | 模型 | 2026-05-19(mtime) | — | — | 留 | 近 60 天 25 次呼叫（多為子代理）；AGENTS 與 wiki-amend、vault-audit、oq-manage 指定使用；改卡名用 CLI 才不斷反向連結 |
| ~/.claude/skills/gstack/（83 項、145MB） | 1074 檔 | 外部：無頭瀏覽器 QA skill 套件 | 模型 | 2026-05-15(mtime) | — | 與 Browser、claude-in-chrome 工具重疊 | 刪 | 近 60 天 0 次（03 盤點 § 七）；本專案不寫程式、Prototype 測試用 Playwright（erp-prototype-tests） |
| ~/.claude/skills/synced/（docs、docx、pdf、pptx、xlsx、skill-creator、morning、import-memory、google-workspace） | 219 檔 | 平台同步的官方 skill | 模型 | 2026-10-29(mtime) | — | — | 留 | 由平台同步（目錄內為託管內容），非使用者維護；不屬重設範圍 |
| ~/.claude/skills-disabled/openspec/（25 項、8.7MB） | 679 檔 | 已停用的 OpenSpec skill 組 | — | 2026-03-29(mtime) | — | OpenSpec 已退場（repo 無 openspec 資料夾） | 刪 | 停用已 8 個月（mtime 2026-03-29）；opsx:*／openspec-* 呼叫近 60 天 14／12 次為舊紀錄，來源即此組 |
| ~/.claude/skills-disabled/impeccable（符號連結→~/.agents/skills/impeccable） | 61 檔 | 已停用的設計 skill | — | 2026-05-18(mtime) | — | — | 刪 | 停用；本專案不寫前端。只刪連結；~/.agents/ 目標未盤點（未查證） |
| ~/.claude/agents/ | — | 使用者層子代理定義 | — | — | — | — | — | 目錄不存在；子代理定義只在專案 .claude/agents/ 2 檔 |
| ~/.claude/mods/erp-test-map/（5 檔，hooks/register.tsx 641 行） | 5 檔 | 自製外掛：ERP 測試進度與涵蓋地圖面板 | 程式 | 2026-11-04(mtime) | — | dev-mods/4a9e…/erp-test-map 為開發副本（差異只有 tsconfig.json 與 types/） | 待判 | 記憶卡 reference_erp_test_map_mod 記「39 站逐站顯示待下次 smoke 確認」；缺：近 60 天 Miles 是否開啟該面板 |
| ~/.claude/dev-mods/（1.6MB） | 11 檔 | erp-test-map 的開發副本 | 程式 | 2026-11-04(mtime) | — | 與 mods/erp-test-map 內容相同（diff -rq 只列 tsconfig.json、types/ 兩項差異） | 刪 | mods 是啟用版；開發副本重複 |
| ~/.claude/erp-test-progress/（live.json、results.json） | 2 檔 | erp-test-map 外掛資料 | 程式 | 2026-11-05(mtime) | — | — | 待判 | 隨 erp-test-map 去留 |
| ~/.claude/settings.json | 171 | 使用者層設定：model、hooks、permissions、enabledPlugins | 程式 | 2026-11-04(mtime) | — | 允許 42 項中 6 項過期（erp-spec 兩條、erp-test-case、doc-audit、nvm 路徑 2）；env CLAUDE_CODE_SUBAGENT_MODEL=opus[1m] 與 AGENTS § 模型分工、plan-auditor.md model: opus 並存 | 改寫 | 過期允許移除；48 個停用外掛條目隨外掛移除（見下列）；SubagentStart hook 保留 |
| ~/.claude/settings.json.bak-20261027、.bak-20261104 | 179 | 設定備份 | — | 2026-10-27(mtime) | — | 與現行 settings.json 差：env.CLAUDE_CODE_PLUGIN_DIRS 與 hooks 為 11-04 新增 | 刪 | 備份在 git 之外且已有 11-04 後的現行版；2 檔 |
| ~/.claude/runcat-statusline.py（84 行）、runcat-usage.json | 84 | 狀態列腳本 | 程式 | 2026-07-23(mtime) | — | — | 留 | settings.json statusLine 指向；個人偏好 |
| 外掛 andrej-karpathy-skills@karpathy-skills（1.0.0） | — | 寫程式行為準則 | 模型 | — | — | — | 留 | AGENTS.md 工作入口列「寫或改程式碼」指定載入；近 60 天 7 次 |
| 外掛 mattpocock-skills@mattpocock（1.3.2） | — | matt 流程 skill 組（grilling、tdd、research、code-review 等） | 模型 | — | — | mattpocock-skills:research 與 erp-researcher 重疊 | 留 | 工作流程骨幹；grilling 近 60 天 12 次 Skill＋斜線 25 次 |
| 外掛 product-management@knowledge-work-plugins（1.2.0） | — | 產品管理 skill 組（brainstorm、write-spec 等） | 模型 | — | — | 與 matt 的 to-spec、grilling 功能近似 | 待判 | 03 盤點只記啟用，無使用次數；缺：近 60 天 Skill 呼叫次數 |
| 外掛 watch@claude-video（0.2.0） | — | 影片轉畫面與逐字稿 | 模型 | — | — | — | 待判 | 記憶卡 reference_claude_video_watch_plugin 記 ffmpeg 補丁；缺：近 60 天使用次數 |
| 外掛 eli5@claude-community（1.0.0） | — | 白話圖解 skill | 模型 | — | — | — | 待判 | 缺：近 60 天使用次數；無專案文件引用 |
| 外掛 pm-skills 47 個與 superpowers@claude-plugins-official（共 48 項） | 48 條目 | settings.json 中全數 false 的外掛 | — | — | — | — | 刪 | enabledPlugins 值為 false；installed_plugins.json 仍保留安裝（plugins/ 資料夾 83MB） |
| ~/.claude/backups、cache、file-history(23MB)、session-env(1783 項)、sessions、shell-snapshots、projects(2.4GB 對話紀錄)、history.jsonl、policy-limits*、remote-settings*、.claude.json 等 | 5 檔 | 執行期與系統管理資料 | 程式（Claude Code） | 2026-11-11(mtime) | — | — | 留 | 非設定；不屬重設範圍。projects/ 是 03 盤點使用證據的來源 |

### 五之附表：記憶卡去留清單（來源：03 盤點 § 三之 2、3、4 的判定欄，未重讀各卡）

目錄：`~/.claude/projects/-Users-b-f-03-029-Sens/memory/`。目前 `ls | wc -l` = 145，03 盤點記 144（143 張卡＋MEMORY.md）；多出的檔含 11-11 新增的兩張（project_workflow_rebuild_map_20261111、feedback_report_in_chat_and_handoff），其餘差異未查證。

**刪｜過期或進行中前提消失（4 張）**

| 卡 | 依據 |
|---|---|
| project_business_scenario_unit | 進行（疑似過期），Phase B 由 wiki 正規化承接 |
| project_mes_architecture_planning | 進行（疑似過期），段 1-4 已 archive |
| project_sdd_workflow_improvement | 進行（過期），SDD 前提消失 |
| project_vault_convergence_backlog | 進行（過期），OQ 分流已由 oq-manage 承接 |

**刪｜完成（過期）（4 張）**

| 卡 | 依據 |
|---|---|
| project_openspec_cleanup_batch1 | OpenSpec 已退場 |
| project_order_module_v45_rewrite | Linear v4.5，格式後續改 v5、v6 |
| project_state_machine_refactor_workflow | 四方比對含 openspec，前提消失 |
| project_workflow_skill_fit | 舊 12 skill 評級，集合已重切 |

**刪｜翻案（3 張）**

| 卡 | 依據 |
|---|---|
| project_delivery_date_naming_20260911 | 卡內自述第 2、9、10、14 條已於 09-21 翻案；現行見 delivery_date_redefinition |
| project_planning_flow_reform | plan-design／plan-audit 流程已由 skill 重構取代 |
| project_workflow_change_as_design_carrier_20261022 | OpenSpec change 為載體，現行為 .scratch 規劃單（同名檔另在 memory/erp，亦判刪） |

**刪｜只記完成紀錄（判定「完成」，未逐字核對有無勿重問決策）（20 張）**

| 卡 | 依據 |
|---|---|
| project_entity_charter_gap_list | 判定「完成」 |
| project_erp_manual_dev_verified | 判定「完成」 |
| project_invoice_view_drawer_done | 判定「完成」 |
| project_manual_prototype_sync_grill_20260923 | 判定「完成」 |
| project_mes_production_stage_planning | 判定「完成」 |
| project_mock_chain4_urgent_multipart | 判定「完成」 |
| project_order_workorder_wiki_iteration_grill_20261004 | 判定「完成」 |
| project_payment_worklists_delivery | 判定「完成」 |
| project_production_management_linear_20261005 | 判定「完成」 |
| project_prompt_audit_grill_20260923 | 判定「完成」 |
| project_prototype_ui_consistency_fix_20260907 | 判定「完成」 |
| project_quote_item_drawer_regroup_20260923 | 判定「完成」 |
| project_quote_linear_delivery_prototype_standard_20261004 | 判定「完成」 |
| project_quote_to_order_gap_fix | 判定「完成」 |
| project_shipment_print_download_center_grill_20261023 | 判定「完成」 |
| project_wiki_cleanup_by_domain | 判定「完成」 |
| project_wiki_write_entry_consolidation | 判定「完成」 |
| project_work_order_creation_delivery | 判定「完成」 |
| project_work_order_detail_layout_done | 判定「完成」 |
| project_work_order_linear_delivery_prototype_standard_20261005 | 判定「完成」 |

**刪｜feedback 過期或矛盾（7 張）**

| 卡 | 依據 |
|---|---|
| feedback_impact_score_gun_framework | 引用 pm-guideline.md，repo 內不存在 |
| feedback_implement_all_spec_requirements | 前提 OpenSpec change 已退場 |
| feedback_linear_ticket_wiki_only | 寫「不看 prototype」，與 linear-delivery 規範取材含 Prototype 矛盾 |
| feedback_linear_v4_ticket_format | v4，現行 v6.x |
| feedback_oq_naming_convention | 針對 Notion Follow-up DB，推送已暫停 |
| feedback_read_architecture_card_first | 要求讀 raw 設計收斂記錄，與 erp-plan「設計者不讀 raw」相反；AGENTS 陷阱表列 15 仍引用，須同步改 |
| feedback_search_scope | 限 /Sens，與 AGENTS 讀碼範圍矛盾 |

**改寫（部分翻案或數值矛盾，不是整張刪）（8 張）**

| 卡 | 依據 |
|---|---|
| project_print_item_delivery_date_20260908 | 命名部分已被 09-21 取代 |
| project_workflow_boundary_grill_20261004 | OpenSpec 前提段落過期 |
| project_workflow_v2_delivery | 現由 AGENTS 承載 |
| project_shipment_logistics_split_grill_20261020 | G31-G36「無批次拋單」被 10-22 卡推翻；索引說明未更新 |
| feedback_model_split_opus_for_agents | 模型分工數值在 5 處不一致（03 盤點 § 三之 4 第 4 列） |
| feedback_linear_fix_restructure_not_append | 含與 AGENTS 衝突的模型分工句 |
| project_erp_repo_prototype_workflow | 分支與 PR 說法三處不一（第 10 列） |
| feedback_check_sensation_api_asis | 後端名稱 sensation-api 與 sens-print-core 不一致（第 11 列） |

**待判（2 張）**

| 卡 | 依據 |
|---|---|
| project_ppc_course_to_wiki_20260917 | 進行（中斷）；成果在 rescue/ppc-course-stash-20261027 分支，Miles 另有決定 |
| project_rule_card_normalization_20261027 | 與 wiki 正規化規則組部分重疊，03 盤點未查證是否被取代 |

另：MEMORY.md 索引（150 行）隨卡刪除同步刪列；`feedback_linear_task_prefix.md` 不在索引內（03 盤點 § 三之 1），判定為 S（已在 linear-delivery 規範），本檔列為待判但未入上表（缺：與索引分離的原因）。

## 六、範本專查

範圍：全 repo 檔名含「範本」「模板」「template」者（`git ls-files | grep -iE "範本|模板|template"`，共 19 檔），加上功能上是產出用範本的「派工單」「格式」「設計收件」檔。「近 60 天產出」= 2026-09-12 起以該範本寫出的檔，算法：`git log --since=2026-09-12 --diff-filter=A --name-only -- <目錄>`，再依檔頭 `type:` 分類（wiki 卡）；以 HEAD 檔案為準，近 60 天新增但已不存在者另計 39 檔。

| 範本 | 行數 | 產出什麼 | 被誰引用 | 近 60 天產出 | 去留 | 理由 |
|---|---|---|---|---|---|---|
| memory/Sens_wiki/wiki/範本/範本 - 角色.md | 60 | 03-roles 角色卡 | 規範 - 角色.md、範例 - 角色.md | 0（近 60 天無新建 role 卡） | 留 | 近 60 天無新建，但 role 卡 21 張仍會修訂；規範 - 角色引用 |
| memory/Sens_wiki/wiki/範本/範本 - 商業規則.md | 78 | 04 營運規則卡 | wiki-schema.md、卡片撰寫共用規範.md、規範 - 商業邏輯.md | 新建 300 張（多半為 wiki 正規化拆卡，見 § 八） | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 服務藍圖.md | 64 | 服務藍圖卡 | 卡片撰寫共用規範.md、規範 - 商業邏輯.md、範例 - 服務藍圖.md | 新建 9 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 活動清單.md | 57 | 活動清單卡 | wiki-schema.md、規範 - 商業邏輯.md、規範 - 活動清單.md、範例 - 活動清單.md | 新建 39 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 資料結構總覽.md | 86 | 資料結構總覽卡 | wiki-schema.md、規範 - 資料結構總覽.md、範例 - 資料結構總覽.md | 新建 3 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 參考模型.md | 48 | 11-review-knowledge 參考模型卡 | wiki-amend/references/落點判準.md、wiki-schema.md、審查知識路由.md | 新建 4 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 實體.md | 97 | 05-entities 實體卡 | 規範 - 實體.md、範例 - 實體.md | 新建 6 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 狀態機.md | 111 | 06-state-machines 狀態機卡 | 規範 - 狀態機.md、範例 - 狀態機.md | 新建 8 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 業務情境.md | 93 | 07-scenarios 情境卡 | 規範 - 業務情境.md、範例 - 業務情境.md | 新建 7 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - 規則組.md | 54 | 規則組卡 | 規範 - 商業邏輯.md（僅 1 檔）；範例 - 規則組.md 檢索無（範例卡不含範本字串） | 新建 25 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - OQ.md | 60 | 08-open-questions OQ 卡 | oq-manage/SKILL.md、規範 - OQ.md、範例 - OQ.md | 新建 63 張 | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/Sens_wiki/wiki/範本/範本 - Raw 素材.md | 56 | raw/ 素材卡 | vault-ingest/SKILL.md、vault-ingest/references/調研派工單.md | 新建 9 張（均為 claude-research） | 留 | 近 60 天仍有產出或仍被規範引用；從零建立也需要各卡型一張範本 |
| memory/shared/派工任務書範本.md | 70 | 主對話派子代理的任務書 | AGENTS.md、erp-audit 2 份派工單、vault-audit 判讀派工單、vault-ingest 調研派工單、審查知識路由.md（含 CHANGELOG 與 wiki log 在內共 11 檔） | 0 個檔（任務書不存檔；vault-ingest/SKILL.md 第 21 行）；子代理派用：plan-auditor 17、erp-researcher 4、general-purpose 483（近 60 天） | 留 | 引用最廣的範本；是否「照範本」派工未逐筆查證 |
| .claude/skills/linear-delivery/references/範本 - Linear 交付.md | 198 | Linear 交付 project／Feature／Task 結構 | linear-delivery/SKILL.md、規範 - Linear 交付.md | memory/erp/linear-drafts 近 60 天新增 126 檔（11-04 後 0 檔）；Linear 端產出未查證 | 留 | 交付範本；實際產出在 Linear，非本 repo |
| .claude/skills/erp-plan/references/設計收件.md | 61 | spec.md 落點與自檢（節名照 matt to-spec 範本） | erp-plan/SKILL.md、AGENTS.md | .scratch 下 spec.md 3 份、precheck.md 3 份（11-04～11-05） | 留 | matt to-spec 範本本身在外掛內，不在本 repo（未查證其行數） |
| .claude/skills/erp-audit/references/稽核者派工單.md、推演者派工單.md | ? | erp-audit 派工起手 | erp-audit/SKILL.md、plan-auditor.md | .scratch 下 audit-r*.md 共 8 份；plan-auditor 派用 17 次 | 留 | — |
| .claude/skills/vault-audit/references/判讀派工單.md | 49 | vault-audit 判讀派工 | vault-audit/SKILL.md | vault-audit 近 60 天 1 次呼叫 | 留 | — |
| .claude/skills/vault-ingest/references/調研派工單.md | 49 | 調研子代理任務書 | vault-ingest/SKILL.md、erp-plan/references/調研判斷.md、erp-researcher.md | 近 60 天 raw 新增 9 張 claude-research 卡；erp-researcher 派用 4 次 | 待判 | 與 mattpocock-skills:research 的取捨未定 |
| .claude/skills/oq-manage/references/待裁決清單格式.md、整理報告格式.md | ? | OQ 清單與整理報告 | oq-manage/SKILL.md | 報告只在對話產出，未落檔（整理報告格式 § mode E「只產報告」）；是否存檔未查證 | 留 | — |
| .claude/skills/vault-ingest/references/掃描報告格式.md、查證紀錄格式.md | ? | raw 掃描報告與查證紀錄 | vault-ingest/SKILL.md、稽核維度.md、範本 - Raw 素材.md | 近 60 天 vault-ingest 1 次；查證紀錄在 raw 卡內 | 留 | — |
| wiki 範例卡 10 張（範例 - 角色／商業規則／服務藍圖／活動清單／規則組／實體／資料結構總覽／狀態機／業務情境／OQ，共 1126 行） | 10 檔 / 1126 行 | 各卡型示範 | 對應規範卡；vault-audit 維度 12 以範例卡為勾稽對象 | 近 60 天新增 2 張（type: example） | 待判 | 與同卡型的規範卡、範本卡三件並存；缺：維度 12 是否可只對範本勾稽 |
| wiki 規範卡 9 張（規範 - 詞彙表 85、角色 219、商業邏輯 504、活動清單 278、實體 312、資料結構總覽 143、狀態機 302、業務情境 317、OQ 216，共 2376 行） | 9 檔 / 2376 行 | 各卡型規則 | wiki-amend、vault-audit、卡片撰寫共用規範 | —（規則卡，不產出檔） | 留 | 寫卡的規則來源；不讀內容，未判重疊 |
| 非範本但名稱含「模板」「範本」的 wiki 內容卡：引用是起手範本.md（39）、尺寸範本.md（52）、封存 OQ ORD-010、ORD-011、XM-006（備註模板，各 59、67、74） | ? | 業務內容（配方展開規則、尺寸、備註模板） | wiki 內部 | — | 留 | 內容卡，不是產出用範本；不納入範本判定 |

## 七、可直接刪除清單

前提與依賴見 § 八。路徑一行一項；資料夾以結尾斜線表示整個資料夾；`memory/erp/` 下標示的資料夾若為 wiki 卡 source 欄引用者，刪前先處理引用（§ 八第 1 項）。

### 7.1 repo 內與使用者層檔案

```
docs/state-machine-flowcharts.md
docs/superpowers/plans/2026-06-03-delta-consolidated.md
docs/superpowers/plans/2026-06-03-order-external-sync-and-publish-skill.md
docs/superpowers/plans/2026-06-03-phase0-delta-worklist.json
docs/superpowers/plans/2026-06-03-phase3-field-delta-worklist.md
docs/superpowers/plans/2026-06-03-phase4-linear-delta-draft.md
docs/superpowers/plans/2026-06-09-brd-architecture-and-audit.md
docs/superpowers/plans/2026-06-09-brd-restructure.md
docs/superpowers/plans/2026-06-09-business-processes-spec-migration.md
docs/superpowers/plans/2026-06-09-order-spec-cleanup.md
docs/superpowers/plans/2026-06-09-order-spec-restructure-phase2.md
docs/superpowers/plans/2026-06-09-state-machines-spec-migration.md
docs/superpowers/plans/2026-06-11-business-scenario-unit.md
docs/superpowers/plans/2026-07-06-prepress-review-prototype-migration.md
docs/superpowers/specs/2026-06-08-sdd-diagnosis-findings.md
docs/superpowers/specs/2026-06-08-sdd-improvement-blueprint.md
docs/superpowers/specs/2026-06-08-sdd-research-findings.md
docs/superpowers/specs/2026-06-08-sdd-workflow-improvement-design.md
docs/superpowers/specs/2026-06-09-review-return-and-confirm-design.md
docs/superpowers/specs/2026-06-10-wiki-log-consolidation-design.md
docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md
docs/superpowers/specs/2026-07-06-prepress-review-prototype-migration-design.md
docs/superpowers/specs/2026-07-07-linear-delivery-architecture-design.md
factory-brd-audit-report-2026-07-22.md
factory-business-current-state-2026-07-22.md
openspec-vault-reconcile-report-2026-05-30.md
production-stage-alignment-diff-matrix.md
production-stage-dispatch-waybill-asis.md
production-stage-handover.md
production-stage-openspec-cleanup-plan.md
production-stage-seg1-manual.html
memory/MEMORY.md
memory/shared/notion-mcp-guidelines.md
memory/erp/bom-card-restructure-20261028/
memory/erp/erp-mes-standard-alignment-20261028/
memory/erp/feature-draft-20261004/
memory/erp/linear-drafts/
memory/erp/manual-vs-prototype-audit-20260907.md
memory/erp/notion-publish-manifest.md
memory/erp/skill-rewrite-20261029/重構計畫-初稿.md
memory/erp/skill-rewrite-20261029/過去規劃盤點.md
memory/erp/skill-rewrite-20261029/OpenSpec升級比對.md
memory/erp/skill-rewrite-20261029/claudedev-建議清單-raw草稿.md
memory/erp/skill-rewrite-20261029/claudedev-文章逐篇摘錄.md
memory/erp/wiki-iteration-20261004/
memory/erp/wiki-normalization-20261104/工具/source_pointer.py
memory/erp/workflow-change-as-design-carrier-20261022.md
.claude/worktrees/beautiful-neumann-a844ac/.claude/settings.local.json
.claude/skills/defuddle/SKILL.md
.claude/skills/erp-audit/CHANGELOG.md
.claude/skills/erp-plan/CHANGELOG.md
.claude/skills/frontend-design/SKILL.md
.claude/skills/json-canvas/SKILL.md
.claude/skills/json-canvas/references/EXAMPLES.md
.claude/skills/linear-delivery/references/CHANGELOG.md
.claude/skills/obsidian-bases/SKILL.md
.claude/skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md
.claude/skills/obsidian-markdown/SKILL.md
.claude/skills/obsidian-markdown/references/CALLOUTS.md
.claude/skills/obsidian-markdown/references/EMBEDS.md
.claude/skills/obsidian-markdown/references/PROPERTIES.md
.claude/skills/oq-manage/CHANGELOG.md
.claude/skills/vault-audit/CHANGELOG.md
.claude/skills/vault-ingest/CHANGELOG.md
.claude/skills/wiki-amend/CHANGELOG.md
~/.claude/skills/gstack/
~/.claude/skills-disabled/openspec/
~/.claude/skills-disabled/impeccable
~/.claude/dev-mods/
~/.claude/settings.json.bak-20261027
~/.claude/settings.json.bak-20261104
（外掛，經設定移除）pm-skills@pm-skills 47 個與 superpowers@claude-plugins-official
```

### 7.2 記憶卡（38 張；刪卡後同步刪 MEMORY.md 索引列）

```
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_business_scenario_unit.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_mes_architecture_planning.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_sdd_workflow_improvement.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_vault_convergence_backlog.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_openspec_cleanup_batch1.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_order_module_v45_rewrite.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_state_machine_refactor_workflow.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_workflow_skill_fit.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_delivery_date_naming_20260911.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_planning_flow_reform.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_workflow_change_as_design_carrier_20261022.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_entity_charter_gap_list.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_erp_manual_dev_verified.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_invoice_view_drawer_done.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_manual_prototype_sync_grill_20260923.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_mes_production_stage_planning.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_mock_chain4_urgent_multipart.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_order_workorder_wiki_iteration_grill_20261004.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_payment_worklists_delivery.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_production_management_linear_20261005.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_prompt_audit_grill_20260923.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_prototype_ui_consistency_fix_20260907.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_quote_item_drawer_regroup_20260923.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_quote_linear_delivery_prototype_standard_20261004.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_quote_to_order_gap_fix.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_shipment_print_download_center_grill_20261023.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_wiki_cleanup_by_domain.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_wiki_write_entry_consolidation.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_work_order_creation_delivery.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_work_order_detail_layout_done.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/project_work_order_linear_delivery_prototype_standard_20261005.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_impact_score_gun_framework.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_implement_all_spec_requirements.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_linear_ticket_wiki_only.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_linear_v4_ticket_format.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_oq_naming_convention.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_read_architecture_card_first.md
~/.claude/projects/-Users-b-f-03-029-Sens/memory/feedback_search_scope.md
```

## 八、待判與未查證

### 8.1 待判（表內 25 列＋記憶卡 2 張＋六之 3 列）

| 節 | 路徑 | 缺什麼資訊 |
|---|---|---|
| 二 | order-invoice-manual-test-notes.md | 實測筆記；被已封存 OQ BI-027 引用為來源。缺：該 OQ 的來源欄是否可改為卡內自含 |
| 二 | production-stage-seg1-manual-artifact.html | 操作手冊單一 HTML（9560 行）；被 manual-audit、manual-writing-rules 引用。缺：手冊以 Artifact 固定網址發布後，本檔是否仍是編輯來源 |
| 二 | decks/ | 缺：scope-boundary.md 對該 HTML 的引用是否為必要出處；其餘 5 檔可刪 |
| 三 | memory/shared/ui-business-rules.md | 缺：251 行逐段對 wiki 規則卡比對；AGENTS 正本分層只認 wiki 為業務規則正本 |
| 三 | memory/erp/manual-audit-20260923/ | 缺：操作手冊工作流是否持續。wiki 8 張 OQ 卡的 source-link 引用；wiki-amend/references/下游更正表.md 第 12 行把操作手冊（manual-writing-rules.md）列為下游 |
| 三 | memory/erp/manual-writing-rules.md | 被 wiki-amend/references/下游更正表.md 與 1 張封存 OQ 引用；缺：操作手冊是否為本專案持續交付物 |
| 三 | memory/erp/plans/_archives/2026/2026/ | wiki 卡 0 張的 source 欄引用此路徑；缺：source 欄引用是否可改為「某日拍板」字串而不指檔案 |
| 三 | memory/erp/production-dispatch-report-transfer-20261006/ | wiki 卡引用數見右欄；缺：source 欄改寫方式 |
| 三 | memory/erp/skill-rewrite-20261029/評測集/ | erp-audit 去留與評測做法由後續決策票決定；缺：新流程是否沿用此評測方式 |
| 三 | memory/erp/wiki-normalization-20261104/ | 遷移批 7 未結、批 8 未開始（03 盤點 § 十）；缺：遷移結案後是否整批刪、source 欄改寫方式 |
| 三 | memory/erp/wiki-tag-golden-set.md | 0 檔引用；卡內自述保留供 tag 調整時回歸測試。缺：新流程是否還依 tag 檢索 |
| 四 | .claude/agents/erp-researcher.md | 近 60 天派用 4 次；缺：mattpocock research skill 近 60 天使用次數（03 盤點未列） |
| 四 | .claude/skills/erp-audit/references/評測集.md | 指向 memory/erp/skill-rewrite 評測集；缺：新流程是否沿用此評測 |
| 四 | .claude/skills/erp-plan/references/調研判斷.md | 與 erp-researcher、調研派工單成組；缺：mattpocock research skill 是否取代 |
| 四 | .claude/skills/linear-delivery/references/blocked-cases-log.md | 案例紀錄（277 行，只追加）；缺：是否屬 skill 本體；SKILL 與 CHANGELOG 引用 |
| 四 | .claude/skills/vault-ingest/references/調研派工單.md | 與 erp-researcher、調研判斷成組；缺：mattpocock research skill 是否取代 |
| 四 | .scratch/experience-handover/ | 10 檔（precheck、grill、spec、audit r1-r3、issues 4 張）；缺：是否已實作完成。AGENTS：規劃單做完不當長期正本；wiki 卡 source 欄有引用 |
| 四 | .scratch/l1-feedback-optimization/ | 6 檔；同上 |
| 四 | .scratch/quote-versions/ | 14 檔（含 issues 8 張）；同上 |
| 四 | .scratch/matt-migration/ | 1 檔 skill改寫準則.md（84 行）；缺：改寫準則是否被 workflow-rebuild 取代 |
| 五 | ~/.claude/mods/erp-test-map/ | 記憶卡 reference_erp_test_map_mod 記「39 站逐站顯示待下次 smoke 確認」；缺：近 60 天 Miles 是否開啟該面板 |
| 五 | ~/.claude/erp-test-progress/ | 隨 erp-test-map 去留 |
| 五 | 外掛 product-management@knowledge-work-plugins | 03 盤點只記啟用，無使用次數；缺：近 60 天 Skill 呼叫次數 |
| 五 | 外掛 watch@claude-video | 記憶卡 reference_claude_video_watch_plugin 記 ffmpeg 補丁；缺：近 60 天使用次數 |
| 五 | 外掛 eli5@claude-community | 缺：近 60 天使用次數；無專案文件引用 |
| 五附表 | project_ppc_course_to_wiki_20260917.md | 進行（中斷）；成果在 rescue/ppc-course-stash-20261027 分支，Miles 另有決定 |
| 五附表 | project_rule_card_normalization_20261027.md | 與 wiki 正規化規則組部分重疊，03 盤點未查證是否被取代 |

六之待判：`調研派工單.md`（與 mattpocock research 取捨未定，已在四列入）、wiki 範例卡 10 張（維度 12 勾稽對象）。

### 8.2 刪除前的依賴事實

| # | 事實 | 算法或出處 |
|---|---|---|
| 1 | `memory/erp/` 下多數資料夾被 wiki 卡的 `source` 欄以路徑字串引用：plans 封存 239 張、wiki-normalization 193 張、production-dispatch 53 張、production-quantity 28 張、manual-audit 8 張、bom-card-restructure 4 張、linear-drafts 3 張。刪資料夾不會讓 wiki_lint S5（只檢查 wikilink 與標題）報錯，但出處字串會指向不存在的檔 | `git grep -l -F -- <資料夾> -- memory/Sens_wiki/wiki ":!memory/Sens_wiki/wiki/log.md"`；plans 的 683 次出現為 `git grep -c` 加總 |
| 2 | AGENTS.md 與 docs/agents/domain.md 引用 `docs/adr/`，該資料夾不存在 | `ls docs/adr` 回報不存在；domain.md 自述缺檔靜默略過 |
| 3 | 刪 `feedback_read_architecture_card_first` 須同步改 AGENTS.md 陷阱表列 15（03 盤點 § 三之 3 備註） | 03 盤點 |
| 4 | 刪 settings.local.json 前須先把 git commit 後自動 push 的 hook 併入 settings.json，否則 AGENTS.md § 版本控管「提交後 hook 自動推送」失效 | .claude/settings.local.json PostToolUse 第 2 項 |
| 5 | 7 個工作樹 `core.hooksPath` 被覆寫為空目錄，pre-commit 在那裡不生效（03 盤點 § 五之 1） | 03 盤點，未重查 |
| 6 | 七個專案 skill 的 CHANGELOG 含評測數據行：erp-plan/CHANGELOG.md 第 31 行、erp-audit/CHANGELOG.md 第 15 行 | grep |

### 8.3 未查證

- 引用數為字串比對，可能多算（檔名泛用如 AGENTS.md）或少算（以相對名或 wikilink 引用 skill 檔者，已改用不含副檔名的檔名比對，仍可能漏）。
- 近 60 天產出檔案的分類以 HEAD 檔頭 `type:` 為準；商業規則卡新建 300 張大概率來自 wiki 正規化拆卡，未逐一確認非人工新寫。
- 近 60 天使用證據沿用 03 盤點的對話紀錄統計，未重算；product-management、watch、eli5 三個外掛與 mattpocock-skills:research 的使用次數 03 盤點未列，本檔未補。
- matt `to-spec` 範本在外掛內，行數與近 60 天產出未獨立查證；以 `.scratch/*/spec.md` 3 份代表。
- `~/.agents/skills/impeccable` 連結目標未盤點；`~/.claude/plugins/` 83MB、`projects/` 2.4GB 只列大小，不判內容。
- 其他工作樹是否各有 settings.local.json 副本，未查。
- `.claude/skills/*/references` 檔案之間的重疊只引用 03 盤點 § 四之 3，未逐行重新比對。
- erp-prototype-tests/（203 檔）與 `memory/Sens_wiki/AGENTS.md`、`raw/` 不在本次範圍，沿用 03 盤點。
- 記憶卡「完成」判定 20 張依 03 盤點，未逐字核對卡內是否仍有「勿重問」決策；刪前建議抽查。
- 手冊類資料（production-stage-seg1-manual-artifact.html、manual-audit）是否仍為持續交付物，取決於 Miles；Artifact 固定網址的內容與本檔關係未查。

