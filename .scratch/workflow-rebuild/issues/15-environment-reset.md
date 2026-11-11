# 15：環境清場

Type: task
Status: claimed
Blocked by: 14

## Question

依「架構面內容完整盤點」的去留清單，刪除或封存已失效、重複、互相矛盾的架構面內容，留下最小可用的環境。
範圍只含代理環境（AGENTS.md、記憶卡、skill、hook、設定、範本、散檔）；不動 wiki 內容卡與在途工作樹。
erp 程式庫不動：不是 Miles 維護的範圍，他只用其中製作 Prototype 與部署到 dev 的 skill（Miles 2026-11-11）。
刪除前把清單給 Miles 確認。完成後記錄刪了什麼、留了什麼。

## Comments

### 2026-11-12 進行中：清單已分類，等 Miles 確認

現況已對照 `research/14a-sens-and-global-inventory.md` § 七核對：7.1 的 repo 內路徑與 7.2 的 38 張記憶卡全部存在。尚未刪任何檔。

本票打算執行（等 Miles 確認）：

| 類別 | 內容 | 處理 |
|---|---|---|
| A 舊流程的計畫與報告 | `docs/superpowers/` 22 檔、`docs/state-machine-flowcharts.md`、根目錄 8 個報告檔（14a § 7.1 所列）、`memory/MEMORY.md`、`memory/shared/notion-mcp-guidelines.md`、`memory/erp/` 3 個散檔 | repo 內刪除 |
| B 已完成工作的工作稿 | `memory/erp/linear-drafts/` 126 檔、`feature-draft-20261004/` 4、`wiki-iteration-20261004/` 9、`bom-card-restructure-20261028/` 2、`erp-mes-standard-alignment-20261028/` 10、`skill-rewrite-20261029/` 5 個散檔、`wiki-normalization-20261104/工具/source_pointer.py` | repo 內刪除；wiki 卡與 raw 卡的出處字串不改（9 張 wiki 卡、5 張 raw 卡，另根目錄報告檔 11 張 wiki 卡、3 張 raw 卡） |
| C 用不到的 skill 與重複檔 | repo 內 5 個通用 skill（defuddle、frontend-design、json-canvas、obsidian-bases、obsidian-markdown）12 檔、誤入版控的舊工作樹設定 1 檔；repo 外 `~/.claude/skills/gstack/`、`~/.claude/skills-disabled/`、`~/.claude/dev-mods/`、兩份設定備份 | repo 內刪除；repo 外搬到封存資料夾 |
| D skill 的改版紀錄 | 7 個專案 skill 的 CHANGELOG | 刪除；同步拿掉 `linear-delivery/SKILL.md` 第 130 行、`vault-audit/SKILL.md` 第 65 行的引用 |
| E 記憶卡 | 14a § 7.2 的 38 張，索引同步刪 38 列（28,482 位元組降到 21,774） | 搬到封存資料夾 |

封存位置（預定）：`~/.claude/archive/env-reset-20261112/`。

本票不做、留給後面的票：

- `AGENTS.md`、8 張要改寫的記憶卡、兩份設定檔的過期允許項目：屬票 11（重寫環境）。
- `.claude/settings.local.json`：不併入 `settings.json`。該檔不進版控，工作樹沒有它；把自動推送 hook 搬進 `settings.json` 會讓每個工作樹一提交就推自己的分支，改變現行行為。留給票 11 決定。
- 被大量 wiki 卡出處欄引用的資料夾（`memory/erp/plans/` 240 張、`wiki-normalization-20261104/` 194 張、`production-dispatch-report-transfer-20261006/` 53 張、`production-quantity-audit-20261026/` 28 張）：先定出處欄寫法，另開票。
- `.scratch/` 下三個規劃主題與 `matt-migration`：在途工作，不動。
- wiki 規範、範本、範例卡（14b）：屬票 06。erp 程式庫（14c 的刪除項全在 erp）：不動。
- 使用者層設定中 48 個已停用外掛條目：不載入、無作用，不動。

要 Miles 決定：

1. A 到 E 是否照做。
2. 操作手冊是否持續維護（決定 `memory/erp/manual-audit-20260923/` 41 檔、`manual-writing-rules.md`、根目錄 `production-stage-seg1-manual-artifact.html` 的去留）。
3. 外掛 `product-management` 是否停用（近 60 天 Skill 呼叫 0 次、斜線指令 2 次；與 matt 的 `to-spec`、`grilling` 功能重疊）。`eli5`（近 60 天約 20 次）、`watch`（約 5 次）有在用，留。

### 2026-11-12 Miles 第一輪回覆

- 操作手冊要持續維護，預計改到 GitBook。手冊相關的檔本票全部不動：根目錄 `production-stage-seg1-manual-artifact.html`（已發布成品的原始檔）、`memory/erp/manual-writing-rules.md`、`memory/erp/manual-audit-20260923/`。
- 因此記憶卡 `project_erp_manual_dev_verified`、`project_manual_prototype_sync_grill_20260923` 移出封存清單。E 類改為 36 張，清場後留 112 張（feedback 59、project 51、reference 2）。
- 外掛 `product-management` 可以拿掉。做法：在專案 `.claude/settings.json` 的 `enabledPlugins` 設為 false。
- Miles 要的是 BA 與 SA 的能力，不是寫規格。已開調研票 28，並擋住票 08。
- 移動或開新對話時放進同一個側邊欄區段（已記入地圖 Notes 與記憶卡 `feedback_sessions_same_sidebar_group`）。
- 記憶檔圖解頁：https://claude.ai/artifact/2XGJGjBaFa77Ky7YTEuPKz
- A 到 E 是否照做，Miles 尚未明確回答。
