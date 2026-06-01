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
- 變更：退役 ERP 主題同層競爭舊入口 `00-meta/README.md`（SSOT 反模式，外部 backlink=0），獨有內容遷入 [[vault-charter]] §七（人類首次閱讀順序）/ §八（工具），「不在此 Vault」表確認與 vault-charter §六 重複故直接刪；ERP 入口 [[erp_index|indexx]] §三 高量層改連各層 README / 子索引（MOC：08-OQ / 13-US / 14-reviews / 11-review-knowledge 4 個 README + 4 個 10-references *-index + 6 個 09-canvases）；[[wiki/erp/08-open-questions/README|OQ 索引]] 補登 13 張孤兒 OQ；root `CLAUDE.md` 商業層查詢改走 ERP 入口 index（由「載入決策表」router）+ 補正 `01-products/erp/`→`01-products/` stale 路徑。orphans 49→27、unresolved 168→168（零新增壞鏈）。
- 衝突：無。另案待辦：glossary-graphic-editor 仍留 ERP 02-domain（Miles 只搬 product-vision，圖編術語去留待決）、同名卡（QC / README ×11 / _template）根治（alias vs 改名，開 OQ）、US 17 孤兒建模組 MOC、root index「圖編 cavans→canvas / 待建」待 canvas 主題入口建立後更新。

## [2026-05-31] 同步 | 圖編移出 ERP 成獨立 canvas 主題 + ERP 願景目錄扁平化路徑補正
- 變更：圖編願景卡移至 [[wiki/編輯器/product-vision]]（脫離 ERP 成獨立主題），總目錄入口改連、ERP registry 移除該行；ERP 願景扁平化（`01-products/erp/*` → `01-products/*`）後補正 9 檔共 15 處路徑；主題名 cavans → canvas 統一（index / log / `.claude/rules`）。
- 衝突：無。

## [2026-05-31] 同步 | 操作模式上移 .claude/rules + ERP_Vault→Sens_wiki 路徑遷移補完
- 變更：知識庫操作模式由 `memory/Sens_wiki/CLAUDE.md` 上移為 `.claude/rules/sens-wiki.md`（path-scoped `memory/Sens_wiki/**`、啟動可靠載入、進版控），原子檔已刪；全 repo 活躍檔（root CLAUDE.md + 17 `.claude` + 13 wiki 卡 + 5 活躍 spec + shared）的 `ERP_Vault→Sens_wiki` 路徑依三層分類修正（L1 raw/assets→vault 根、L2 通用掃描→`wiki/`、L3 erp 內容→`wiki/erp/`）。
- 衝突：無（歷史 archive 61 檔與概念名「ERP_Vault / Vault」未動，屬刻意排除，見根 CLAUDE.md 計畫 § H）。

## [2026-05-31] 同步 | 建立 Sens_wiki 操作框架與雙主題結構
- 變更：新增根目錄操作模式 CLAUDE.md（已於同日上移為 `.claude/rules/sens-wiki.md`，見下方 entry）；初始化本操作史與 [[index|總目錄]]；確立雙主題（ERP / 圖編 canvas）並列、共用 `raw/` 與 `assets/`；ERP 既有 16 層內容卡沿用、未動。
- 衝突：無。

## [2026-06-01] 納入 | user-story 單階段化 + test-case 內移對齊
- 變更：[[erp-user-story]] skill 收斂兩階段→單階段（移除 UI 操作易變層 / stage / ui-binding），成功條件改 Gherkin 框架（含正向達成型 + 禁止/守衛型）；[[erp-test-case]] skill 重寫對齊 5/31 索引卡架構（source↑user-story + Notion 正文 + 三模式）；58 張 user-story 卡批次移除 stage/UI 段、H2 改「業務情境」；16 張真實 UI 內容抽存 [[_migration-ui-from-userstory]]；wiki-schema（§一/四 type=user-story/維度13/§十一）、[[_template]]、15-test-cases [[README]] 同步；CLAUDE.md 路由表 + 載入表補 test-case Vault 正本 row。
- 衝突：[[2026-05-30-test-case-內移vault-skill稽核]] 原建議「正文內移 vault」與 Miles 5/31 定案「正文留 Notion、Vault 只索引」不同，已標 resolved 並註明差異（A-7 憲法句不翻轉）。

## [2026-06-01] 同步 | wiki↔OpenSpec 分工契約收斂 CLAUDE.md 單一處 + 17 卡單一正本化 + CLAUDE.md 去胖
- 變更：分工契約只在 root `CLAUDE.md` 宣告一次（新增 § wiki 與 OpenSpec 分工），[[wiki-architecture]] / [[vault-charter]] / `.claude/rules/sens-wiki.md` 三處重述改單行指向；9 實體卡（需求單 / 訂單 / 印件 / 工單 / 生產任務 / 任務 / 諮詢單 / 售後服務 砍與 OpenSpec § Data Model 重複欄位表、留業務 WHY + implemented-by；出貨單僅修死引用不砍）+ 8 狀態卡（訂單 / 工單 / 生產任務 / 印件 / 諮詢單 / 需求單 / 任務 砍狀態列舉留轉換動機；分期請款補 implemented-by）單一正本化；諮詢單修 stale 諮詢費 1000→2000；`CLAUDE.md` 去胖 555→444（Spec 規格檔清單 → `memory/erp/spec-registry.md`、ERP/共用資源/工具/Prototype 進度 → `memory/shared/resource-index.md`、術語 hot-cache 砍剩指標、行為規則措辭原樣）；標籤矛盾「（正本）」→「（實作規格正本，相對 Notion 發布版）」；`openspec/config.yaml` main spec 數 7→23。commits 04e295c / 6893bf9 / 965f246。
- 衝突：無。另案待辦：出貨單（OpenSpec 無 Data Model）見 [[SHP-006-出貨模組spec待建立]]；QC 實體 / 狀態卡（QCRecord 廢止併入生產任務 + NCR）退役策展見 [[QC-002-QC兩張wiki卡退役或保留]]；`index → erp_index` 改名飛行中，故 index / log 排序未動。

## [2026-06-01] 同步 | ORD-027 解（方案 A）+ 縮寫 OEC/OA 中文化
- 變更：[[ORD-027-訂單額外費用凍結時點與審核通過成交鎖定對齊]] 標 resolved（Miles 採方案 A，訂單額外費用凍結點前移至審核通過），檔名由 ORD-027-OEC… 改為 ORD-027-訂單額外費用…（去縮寫）；align-business-consultation-coverage-gaps change（order-management / state-machines delta + proposal + tasks）內縮寫 OEC→訂單額外費用、OA→訂單異動全數中文化（Miles：縮寫日後看不懂）。
- 保留不動：資料模型物件式 OrderExtraCharge(...) / OrderAdjustment(...)（與 Data Model 一致）、MODIFIED Requirement 標題（archive sync 對應鍵）、跨檔 Requirement 名稱引用「諮詢取消退費 OA 系統建已核可」。
- 衝突：發現 main spec Requirement 標題「諮詢取消退費 OA 系統建已核可」仍含 OA 縮寫，且被 [[訂單異動規則]] / [[訂單異動狀態]] frontmatter source 錨點引用——全域改名屬另案，未在本 change 處理。

## [2026-06-01] 同步 | 撰寫規約：implemented-by 不綁 Requirement 標題錨點
- 變更：[[wiki-schema]] § 4.0（implemented-by 定義 + 新增「不用標題錨點寫關聯」規則 + 7 處範本範例去錨點）、[[wiki-architecture]]（前進標準 + 過渡期修法措辭）、5 張範本（_template-test-case / _template-role / _template / _template-scenario / _template-business-logic）範例值去 `#Requirement: <標題>` 改為 spec 檔層。
- 理由：OpenSpec Requirement 標題會改名（縮寫中文化等），標題錨點一改即斷鏈、反過來卡住改名（ORD-027 教訓）。關聯改指 spec 檔層級，Requirement 名稱只當文字描述。
- 範圍：僅規約 + 範本（前瞻）。既有已寫標題錨點的卡 Miles 指示先留著、不回頭批量改。
- 衝突：無。
