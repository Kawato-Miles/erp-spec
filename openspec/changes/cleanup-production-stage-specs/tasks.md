# 批一實作任務（M1＋M2＋M3＋M6 校對）

## 1. 前置裁決（apply 前必須先完成）

- [x] 1.1 產出生產領域 31 張 open OQ 的四類清單（已被拍板涵蓋／擋批一／擋批二／不擋），附每張的出處與擋路理由
- [x] 1.2 Miles 裁決擋批一的 OQ；已知候選：`PT-006` 工單欄位修改規則、`PT-021` 外發生產任務數量取數與到料判定、`XM-009` 合批派工合併邏輯、`PT-007` 前置受影響警示通知對象與形式
- [x] 1.3 `PT-032` 判議題不成立、封存（六值經查證為派單自身欄位），並開新 OQ 記派案平台與 MES 的迭代銜接
- [x] 1.4 依裁決結果回填本 change 的 delta（受影響的 Requirement 與 Scenario）

## 2. spec 落地（sync 至 main specs）

- [x] 2.1 `work-order` 依 delta 重寫（17 removed／13 modified／4 added）
- [x] 2.2 新建 `production-execution` main spec（12 條 Requirement）
- [x] 2.3 新建 `production-overview` main spec（7 條 Requirement）
- [x] 2.4 刪除五個 capability 目錄：`production-task`／`work-package`／`task-dispatch-board`／`scheduling-center`／`schedule-backtrack`
- [x] 2.5 `equipment` 與 BOM 三類主檔依 delta 修改
- [x] 2.6 M6 三份依 delta 修改（角色門控、展開行為歸屬、落點與覆蓋語意、跨工單前置）
- [x] 2.7 更新 `openspec/config.yaml` 的 main spec 數量與模組敘述

## 3. Prototype 對齊（`erp` repo，分支 `prototype/production-stage`）

依 `prototype-from-prompt` skill 指向的規範執行（`Designs.md` §6.5 鐵則、`docs/recipes/`、`docs/component-catalog.md`、`(prototype)/README.md` 放置規則），不直推 main。
已 push 至 `origin/prototype/production-stage`（commit `71fa425`、`c4885ea`），PR 待 Miles 決定時機。

- [x] 3.1 M6 識別字與路由改名：`recipes/styles` → `recipes/print-items`、`MOCK_STYLES`／`style_no`／`style_name`／`styleSegments`／`STYLE_STATUS_META`／`findStyle` 等改為印件配方語彙
- [x] 3.2 `expansion.js` 落點改第一張工單（`drafts[0]`），並自動建立印件層工序段的跨工單前置
- [x] 3.3 引用展開改為覆蓋語意：覆蓋該印件全部既有工單，非全草稿時擋下並提示走工單異動
- [x] 3.4 展開動作的角色門控改為印務主管；配方主檔維護維持限印務、主管唯讀
- [x] 3.5 M1 製程規劃 Tab 的相依編輯支援選擇別張工單的生產任務（跨工單前置）
- [x] 3.6 M1 補交期倒推預填（沿相依鏈逆推、跨工單走、印務可改且不被覆寫）
- [x] 3.7 M2 派工看板的前置檢查涵蓋跨工單前置，擋下時明示是哪一張工單的哪一筆任務
- [x] 3.8 M3 卡點呈現跨工單前置的擋單來源（不只顯示「等待前置」）

## 4. 驗收（verify 前逐項跑，成功條件皆為零命中或明確通過）

- [x] 4.1 過時概念殘留：`grep -rn "QC 單\|QC PT\|品檢 PT\|任務層\|BOM 行項目\|供應商自助報工\|工單區域\|NCR\|拼版試算" openspec/specs/` → **批一範圍**（`work-order`／`production-execution`／`production-overview`／M6 三份／`equipment`／BOM 三類主檔）零命中，唯 `production-execution` 兩處為「任務層已於 2026-07-28 移除」的說明語境、屬合法引用。外圍 spec（`qc`／`business-scenarios`／`order-management`／`prepress-review`）的命中屬批二範圍（決策 6），批二完成後才適用整庫零命中
- [x] 4.2 欄位表未回流：`grep -rln "^## Data Model" openspec/specs/` → 判準改為**看段落內容**而非段落標題：批一範圍零命中「業務可見欄位表」。三主檔（`material-master`／`process-master`／`binding-master`）的 `## Data Model` 段已於先前回流時瘦身為實作層計價結構（`PricingRule*` 表與 `pricing_selection` JSON 形狀），業務欄位正本已在 wiki 三張主檔卡、段首明文聲明，屬合法保留
- [x] 4.3 狀態列舉未回流：逐份確認狀態機 Requirement 只寫轉換規則、不列狀態值
- [x] 4.4 wiki 未指向實作：`grep -rnE "openspec/|src/types|src/pages|\.tsx" memory/Sens_wiki/wiki/` → **正本卡**（`03-roles`／`04-business-logic`／`05-entities`／`06-state-machines`／`07-scenarios`）零命中，含 Prototype 原始碼路徑（原判準只查 `openspec/`，抓不到型別檔導航）。豁免：`11-review-knowledge`（審查方法論的工作導航）、`08-open-questions`（`source-link` 記識別出處）、`log.md`（只追加層）
- [x] 4.5 廢除的 capability：`ls openspec/specs/` 不含五個廢除項；且 main specs 內無任何指向它們的引用
- [x] 4.6 Prototype 對照：M1 至 M6 逐頁核對完成，兩向缺口共 28 項已攤出並定處置——A 類（Prototype 有、spec 無）5 項、B 類（spec 有、Prototype 無）23 項。批一補做 7 項（工單分派與改派、印件總覽待收斂清單與四篩選、相依預設線性鏈、報工管道與權限歸屬、前置受影響標示、M6 展開 blocker、完工判定規則）；併批二 3 項、交付前補 10 項，皆列入 `(prototype)/ACCEPTANCE.md` § 已知限制
- [x] 4.7 對抗式找漏（單線逐份讀，未用 workflow）：該砍沒砍 12 項、該補沒補 3 項。已修——落點矛盾（`print-item-recipe` 的「最後一張」與 Prototype 兩處文案）、「三主檔」措辭 7 處、`BOM 配方` 舊命名、wiki 工單三卡的殘留與矛盾 6 處、M3 頁面用詞與折損率措辭、設計文件 § 1.3／2.1／2.2 回填、判準界定 3 項。色數口徑三方不一致屬商業決策，開 `PT-038` 未靜默覆寫
- [x] 4.8 verify consistency 三張對照表：狀態列舉（工單九值／生產任務七值）wiki↔spec↔Prototype 三方一致；六份 spec 皆無欄位表、以正本邊界段引 wiki；四項矛盾處置完畢（異動數量口徑依 `PT-009` 改寫 spec、工單狀態卡建立來源與改派敘述依現行決策改寫、色數開 `PT-038`）；設計文件 § 1.3 兩項待決均已處置
