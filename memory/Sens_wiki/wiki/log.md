---
type: meta
status: active
last-reviewed: 2026-05-31
---

# Sens 知識庫操作史

只追加（append-only），每次操作後記一筆，最新在上。
格式：`## [YYYY-MM-DD] <動作> | <一句話簡述>`，動作 = 納入 / 查詢 / 健檢 / 同步；下記「變更」與「衝突」兩行。

---

## [2026-05-31] 健檢 | ERP 入口層收斂單一 index + 退役競爭舊 README + 補連修 22 孤兒
- 變更：退役 ERP 主題同層競爭舊入口 `00-meta/README.md`（SSOT 反模式，外部 backlink=0），獨有內容遷入 [[vault-charter]] §七（人類首次閱讀順序）/ §八（工具），「不在此 Vault」表確認與 vault-charter §六 重複故直接刪；ERP 入口 [[wiki/erp/00-meta/index|index]] §三 高量層改連各層 README / 子索引（MOC：08-OQ / 13-US / 14-reviews / 11-review-knowledge 4 個 README + 4 個 10-references *-index + 6 個 09-canvases）；[[wiki/erp/08-open-questions/README|OQ 索引]] 補登 13 張孤兒 OQ；root `CLAUDE.md` 商業層查詢改走 ERP 入口 index（由「載入決策表」router）+ 補正 `01-products/erp/`→`01-products/` stale 路徑。orphans 49→27、unresolved 168→168（零新增壞鏈）。
- 衝突：無。另案待辦：glossary-graphic-editor 仍留 ERP 02-domain（Miles 只搬 product-vision，圖編術語去留待決）、同名卡（QC / README ×11 / _template）根治（alias vs 改名，開 OQ）、US 17 孤兒建模組 MOC、root index「圖編 cavans→canvas / 待建」待 canvas 主題入口建立後更新。

## [2026-05-31] 同步 | 圖編移出 ERP 成獨立 canvas 主題 + ERP 願景目錄扁平化路徑補正
- 變更：圖編願景卡移至 [[wiki/canvas/product-vision]]（脫離 ERP 成獨立主題），總目錄入口改連、ERP registry 移除該行；ERP 願景扁平化（`01-products/erp/*` → `01-products/*`）後補正 9 檔共 15 處路徑；主題名 cavans → canvas 統一（index / log / `.claude/rules`）。
- 衝突：無。

## [2026-05-31] 同步 | 操作模式上移 .claude/rules + ERP_Vault→Sens_wiki 路徑遷移補完
- 變更：知識庫操作模式由 `memory/Sens_wiki/CLAUDE.md` 上移為 `.claude/rules/sens-wiki.md`（path-scoped `memory/Sens_wiki/**`、啟動可靠載入、進版控），原子檔已刪；全 repo 活躍檔（root CLAUDE.md + 17 `.claude` + 13 wiki 卡 + 5 活躍 spec + shared）的 `ERP_Vault→Sens_wiki` 路徑依三層分類修正（L1 raw/assets→vault 根、L2 通用掃描→`wiki/`、L3 erp 內容→`wiki/erp/`）。
- 衝突：無（歷史 archive 61 檔與概念名「ERP_Vault / Vault」未動，屬刻意排除，見根 CLAUDE.md 計畫 § H）。

## [2026-05-31] 同步 | 建立 Sens_wiki 操作框架與雙主題結構
- 變更：新增根目錄操作模式 CLAUDE.md（已於同日上移為 `.claude/rules/sens-wiki.md`，見下方 entry）；初始化本操作史與 [[wiki/index|總目錄]]；確立雙主題（ERP / 圖編 canvas）並列、共用 `raw/` 與 `assets/`；ERP 既有 16 層內容卡沿用、未動。
- 衝突：無。
