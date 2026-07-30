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

- [x] 4.1 過時概念殘留：`grep -rn "QC 單\|QC PT\|品檢 PT\|任務層\|BOM 行項目\|供應商自助報工\|工單區域\|NCR\|拼版試算" openspec/specs/` → 零命中
- [x] 4.2 欄位表未回流：`grep -rln "^## Data Model" openspec/specs/` → 生產相關 spec 零命中
- [x] 4.3 狀態列舉未回流：逐份確認狀態機 Requirement 只寫轉換規則、不列狀態值
- [x] 4.4 wiki 未指向實作：`grep -rn "openspec/" memory/Sens_wiki/wiki/` → 零命中
- [x] 4.5 廢除的 capability：`ls openspec/specs/` 不含五個廢除項；且 main specs 內無任何指向它們的引用
- [ ] 4.6 Prototype 對照：M1 至 M6 逐頁核對，無「Prototype 做了但 spec 沒寫」與「spec 寫了但 Prototype 沒做」
- [ ] 4.7 對抗式找漏：以 workflow 跑多個 agent 專找「該砍沒砍、該補沒補」，找到的項目回填後重跑 4.1 至 4.6
- [ ] 4.8 verify consistency 三張對照表（wiki↔spec 欄位與狀態、spec↔Prototype 行為、設計文件 § 1.3↔實際處置）
