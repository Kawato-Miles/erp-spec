---
type: meta
status: active
last-reviewed: 2026-05-31
---

# Sens 知識庫操作史

只追加（append-only），每次操作後記一筆，最新在上。
格式：`## [YYYY-MM-DD] <動作> | <一句話簡述>`，動作 = 納入 / 查詢 / 健檢 / 同步；下記「變更」與「衝突」兩行。

---

## [2026-05-31] 同步 | 操作模式上移 .claude/rules + ERP_Vault→Sens_wiki 路徑遷移補完
- 變更：知識庫操作模式由 `memory/Sens_wiki/CLAUDE.md` 上移為 `.claude/rules/sens-wiki.md`（path-scoped `memory/Sens_wiki/**`、啟動可靠載入、進版控），原子檔已刪；全 repo 活躍檔（root CLAUDE.md + 17 `.claude` + 13 wiki 卡 + 5 活躍 spec + shared）的 `ERP_Vault→Sens_wiki` 路徑依三層分類修正（L1 raw/assets→vault 根、L2 通用掃描→`wiki/`、L3 erp 內容→`wiki/erp/`）。
- 衝突：無（歷史 archive 61 檔與概念名「ERP_Vault / Vault」未動，屬刻意排除，見根 CLAUDE.md 計畫 § H）。

## [2026-05-31] 同步 | 建立 Sens_wiki 操作框架與雙主題結構
- 變更：新增根目錄操作模式 CLAUDE.md（已於同日上移為 `.claude/rules/sens-wiki.md`，見下方 entry）；初始化本操作史與 [[wiki/index|總目錄]]；確立雙主題（ERP / 圖編 cavans）並列、共用 `raw/` 與 `assets/`；ERP 既有 16 層內容卡沿用、未動。
- 衝突：無。
