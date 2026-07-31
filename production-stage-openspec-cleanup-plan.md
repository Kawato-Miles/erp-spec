# 生產階段 openspec 清整計畫

> 狀態：執行中（2026-07-30 起）。決策經 grilling 逐題拍板，本檔為執行依據。
> 依據：`production-stage-high-level-design.md`（設計正本，§ 1.3 清整對照）＋`factory-business-current-state-2026-07-22.md`（現況彙整）。
> 參考來源紀律：`12-insights/2026-06-15-生產階段現況校正與as-is-tobe對齊.md` 不列入 read-first 清單，一律以上述兩份 7 月底文件為準。

## 一、為什麼做

openspec spec 經長期迭代累積矛盾與過時內容，與 wiki 現況脫節，導致規劃功能與交付時取到錯的前提。生產階段尚未交付 Linear，交付前先清整。

實測落差：生產相關 8 份 spec 共 3559 行 132 個 Requirement，其中 production-task 含已被推翻的 QC PT／品檢 PT／任務層／NCR／供應商自助報工／拼版試算，work-order 含 QC 單／工單區域／BOM 行項目與三條純 UI 條文。出貨與派單兩模組 spec 從未建立。

## 二、決策清單（25 項）

### 作業形式

| # | 決策 |
|---|---|
| 1 | 走 OpenSpec change 工作流，delta 採「整份 capability 重建」寫法：舊條列 REMOVED 標題清單、新條全寫 ADDED |
| 2 | capability 按模組重組（見 § 三） |
| 3 | 切兩批：批一＝M1＋M2＋M3；批二＝M4＋M5＋外圍段落 |
| 4 | 驗收＝機械檢查六項 ＋ verify consistency 三張對照表 ＋ 對抗式找漏 workflow |

### 範圍

| # | 決策 |
|---|---|
| 5 | M6 三份（印件配方／部件配方／配方展開）納入校對不重寫 |
| 6 | 外圍 spec 只改「提到已被本輪推翻的生產概念」段落（QC 單／任務層／供應商自助報工／舊轉交模型／BOM 行項目／工單區域），其他不碰 |
| 7 | `prototype-data-store` 與 `prototype-shared-ui` 刪除（技術棧規範隨 sens-erp-prototype 退場，erp repo 的 Designs.md 與 documentation-standards skill 接手） |
| 8 | 6 個觸及生產 spec 的 active change 直接刪目錄，不留註記 |
| 9 | Linear 三個空殼 project 直接刪（`工廠平台 - 品檢管理`／`出貨管理`／`任務管理`），交付另開一輪走 `linear-delivery` |
| 10 | wiki 去重複只掃生產領域（實體卡＋`04-business-logic/營運規則/訂單到交付/` 15 卡＋對應角色與狀態機卡）|

### 設計裁決

| # | 決策 |
|---|---|
| 11 | PT-037 採 A 案：廢止 BOM 行項目層。印件料工彙總改由印件詳情內頁跨工單彙總承接 |
| 12 | 印件詳情內頁搬 7 Tab、版型以 sens-erp-prototype `PrintItemDetail.tsx` 為準、內容對齊本輪重構；料工彙總放工單 Tab 內一段；列表 side panel 移除；用 `prototype-from-prompt` skill，禁手寫 |
| 13 | 產線：印件、BOM、設備三個掛點共用同一套產線標籤；設備卡「執行方決策在產線層」該句刪除；設備卡所屬產線改標籤形態 |
| 14 | 命名：印件款式→**印件配方**、BOM配方→**部件配方**；BOM＝材料／工序／裝訂三類合稱，措辭一律「BOM 三類」「BOM 項目」，廢掉「三主檔」，三張主檔卡名不變 |
| 15 | 款式層工序段落點改第一張工單；前置＝全部部件末段（跨工單時即跨工單前置）；不新增「湊齊依據」欄 |
| 16 | 工單建立分流：線下＝訂單管理人確認製作細節→系統建一張空草稿→印務主管引用配方展開或直接分派；線上＝系統依印件帶入的部件與 BOM 組成自動展開（現況該組成人工建於 EC 商品主檔）|
| 17 | 引用配方展開：執行者＝**印務主管**；每次引用＝**覆蓋**該印件所有既有工單；僅當全部工單皆為草稿時允許，否則擋下並提示走工單異動 |
| 18 | 工單建立來源正本落 `05-entities/工單.md` 新增「建立來源」段（五建一不建），其餘六處改 `[[工單]]` 引用 |
| 19 | 出貨與派單不預先另立流程卡，寫 spec 時缺什麼補進既有卡 |
| 20 | 遇 open OQ 只拍擋路的（判準＝不裁決就寫不出 Requirement 或 Scenario）；先產四類清單：已被拍板涵蓋／擋批一／擋批二／不擋 |
| 21 | wiki 正本卡一律寫**拍板後生效的內容**，卡內不並陳兩個時態；現況存 `raw/` 與現行 codebase |
| 22 | 派單的六值欄位正名為「委外製作情境」（現況介面名「工單屬性」為混淆源）|
| 23 | PT-032 判議題不成立、封存；改開新 OQ 記派案平台與 MES 的迭代銜接 |
| 24 | M5 前提：派案平台已實作，走**迭代銜接**，不是新建取代 |
| 25 | wiki 禁重複寫：`vault-audit` 新增「規則複寫」維度，命中即改為 `[[卡名]]` 引用 |

## 三、capability 重組對照

| 新 capability | 對應 | 來源 |
|---|---|---|
| `work-order` | M1 工單管理 | 重寫，吸收生產任務結構、展開、預估成本、補生產承接、交期倒推 |
| `production-execution` | M2 派工與現場執行 | 新建，吸收 production-task 的派工報工段＋work-package＋task-dispatch-board |
| `production-overview` | M3 排程與工廠總覽 | 新建，取代 scheduling-center（倒推歸 M1）|
| `qc` | M4 品檢 | 重寫，印件層品檢紀錄與缺口處置 |
| `shipment` | M4 出貨 | 新建，解 SHP-006 |
| `dispatch-order` | M5 派單 | 新建，迭代銜接既有派案平台 |
| `equipment`／`material-master`／`process-master`／`binding-master` | 沿用 | 微調 |
| M6 三份 | 沿用 | 只校對 |

廢除：`production-task`／`work-package`／`task-dispatch-board`／`scheduling-center`／`schedule-backtrack`／`prototype-data-store`／`prototype-shared-ui`。

## 四、執行步驟

| 步驟 | 內容 |
|---|---|
| 0 | 規範封口與機械清理（見 § 五）|
| 0.5 | 從 `sens-print-core` 爬派單與運單現況存 `raw/`，走 `vault-ingest` mode A |
| 1 | wiki 去重複掃描（生產領域）＋修已確認的錯（見 § 六）|
| 2 | M6 校對：補角色權限、展開行為歸屬收斂到 `recipe-expansion`、角色改印務主管、覆蓋語意、落點改第一張、跨工單前置 |
| 3 | OQ 四類清單呈報，Miles 集中裁決擋批一那批 |
| 4 | 批一 propose → apply → verify → archive（M1＋M2＋M3＋廢除）|
| 5 | Prototype 補印件詳情內頁 |
| 6 | 批二 propose → archive（M4＋M5＋外圍段落）|
| 7 | 收尾：OQ 封存、vault-audit 全量、Linear 交付另議 |

## 五、步驟 0 清單

1. 刪 6 個 active change 目錄：`refactor-production-task-transfer-to-auto-inline-model`／`scheduling-completion-date`／`equipment-pricing-model`／`refine-print-item-allocation-mixed-mode`／`unify-print-item-info-sections`／`refactor-print-item-detail-split-platform-routing`
2. 刪 2 份技術 spec：`prototype-data-store`／`prototype-shared-ui`
3. 刪 3 個 Linear 空殼 project
4. 清 5 處 wiki 指向 openspec 的殘留：
   - `wiki/erp/00-meta/erp_index.md:33`（連結方向表的 `implemented-by` 列）
   - `wiki/erp/00-meta/wiki-schema.md:420`（§ 八允許連 OpenSpec／Prototype）
   - `wiki/erp/04-business-logic/規範 - 商業邏輯.md:276`（反模式表把 `implemented-by` 列為正確去向）
   - `.claude/rules/sens-wiki.md:27`（§ 三外部連結）
   - `.claude/skills/vault-audit/SKILL.md:105`（稽核只查 frontmatter `source`，正文外連抓不到）
5. `vault-audit` 新增兩條維度：正文外連實作路徑、規則複寫
6. 改名：wiki 卡名（印件款式→印件配方、BOM配方→部件配方，用 `obsidian-cli` 維護連結）、capability 目錄名、Prototype 路由
7. BOM 措辭統一：廢掉「三主檔」「三主檔項目」，一律「BOM 三類」「BOM 項目」
8. `規範 - 商業邏輯` § 現況 段定位改為「痛點的事實基礎」，不作為與 to-be 並陳的另一時態

## 六、步驟 1 已確認要修的位置

| 位置 | 修法 |
|---|---|
| `05-entities/工單.md:39` | 刪掉六值敘述與「二值與六值收斂」宣稱；工單類型就是打樣與大貨兩值 |
| `05-entities/工單.md` | 新增「建立來源」段（五建一不建），成為唯一正本 |
| `05-entities/派單.md:33,54,104` | 六值改為派單自身屬性、正名「委外製作情境」；欄位段回補新粒度（廠商×工單、明細掛生產任務）；`104` 的實體歸屬改正 |
| `06-state-machines/派單狀態.md:16,113,123` | 三處「不同製作類型的工單各自建派單」等敘述改為派單自身屬性；13 值的實體歸屬依現況校正 |
| `04-business-logic/營運規則/訂單到交付/印件生產流程.md` | 四層結構圖刪任務層；配方層「未實作、留 MES 設計階段定」段改寫為已落地；用詞改 EC 商品主檔 |
| `06-state-machines/印件狀態.md:36` | 審稿維度「已確認可製作觸發工單建立」與同卡印製維度「製程已確認時工單得以產生」矛盾，改為印製維度得以開始推進 |
| `05-entities/設備.md:40,124` | 所屬產線改標籤形態；刪「執行方決策在產線層」句 |
| `05-entities/產線.md:25,39` | 刪「留 openspec 清整」待辦句；關聯段補 BOM 配方工序段掛點 |
| `04-business-logic/營運規則/訂單到交付/配方展開規則.md` | 落點規則句改第一張工單；新增款式層工序段跨工單前置自動建立；展開執行者改印務主管；引用＝覆蓋語意與草稿守衛 |
| `04-business-logic/營運規則/訂單到交付/工序相依性規則.md` | § 跨工單前置的「現況未實作」註記移除 |
| `05-entities/生產任務.md:89` | 前置依賴敘述補「可指向別張工單的生產任務」|
| `05-entities/印件配方.md` | 款式層工序段落點改第一張工單、說明句寫明前置＝全部部件完成 |

## 七、驗收判準

> 判準的適用範圍以**當批**為界：批一＝`work-order`／`production-execution`／`production-overview`／M6 三份／`equipment`／BOM 三類主檔；外圍 spec 的過時概念屬批二（決策 6），批二完成後才適用整庫條件。

| 檢查 | 指令 | 成功條件 |
|---|---|---|
| 過時概念殘留 | `grep -rn "QC 單\|QC PT\|品檢 PT\|任務層\|BOM 行項目\|供應商自助報工\|工單區域\|NCR\|拼版試算" openspec/specs/` | 當批範圍零命中（「任務層已移除」的說明語境除外）|
| 欄位表未回流 | `grep -rln "^## Data Model" openspec/specs/` | 當批範圍零命中 |
| 狀態列舉未回流 | 逐份確認狀態機 Requirement 只寫轉換規則 | 零命中列舉 |
| wiki 未指向實作 | `grep -rnE "openspec/\|src/types\|src/pages\|\.tsx" memory/Sens_wiki/wiki/` | 正本卡（03 至 07）零命中；豁免 `11-review-knowledge`、`08-open-questions`、`log.md` |
| 廢除的 capability | `ls openspec/specs/` | 不含七個廢除項 |
| Prototype 對照 | M1 至 M6 逐頁核對 | 兩向缺口逐項攤出並定處置（批一必補／併批二／交付前補）|
| 三方對照表 | wiki↔spec 欄位與狀態、spec↔Prototype 行為、設計文件 § 1.3↔實際處置 | 矛盾項皆有裁決或已開 OQ |
