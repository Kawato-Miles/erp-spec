# R-P7a 重查結果

路徑縮寫：`TD` ＝ `erp-prototype-tests/`；`SB` ＝ `memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/`。明細的「家」欄一律寫從根算起的完整路徑，下列縮寫只用於說明欄。

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 抽查 | 7 | 同義 7 |
| 矛盾 | 6 | 家較新 5、記憶卡較新 1 |
| 找不到 | 16 | 已有家 2、仍缺 14（否決 5、流程環境 7、紀錄或待辦 2） |
| 部分 | 8 | 已有家 3、仍缺 5（全為流程環境） |
| 合計 | 37 | 同義 7、家較新 5、記憶卡較新 1、已有家 5、仍缺 19（否決 5、流程環境 12、紀錄或待辦 2） |

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_linear_format_redesign_grill_20261012.md | 8 | 抽查 | 同義 | — | 2026-10-12 | 現行受控清單卡 | memory/Sens_wiki/wiki/erp/04-business-logic/受控清單.md:199 | 管理權責與操作權限分開寫，因為能動單據的人，不一定是負責的人；責任留在負責人，追溯時才找得到該回答的人。 | 同一卡 :64-68 另有定義段，兩處都支持「分開寫」。 |
| project_linear_format_redesign_grill_20261012.md | 11 | 矛盾 | 家較新 | — | 2026-10-12 | 提交 3dc3674（2026-10-12）訊息「售後服務單不改派」；舊稿 grill-decisions.md X4c 列四種單據（諮詢單、需求單、訂單、售後服務單），盲測後修正為不含售後服務單；卡內同段也寫了 3dc3674 的修正 | memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/人力調度與職務代理流程群組/改派負責人活動清單.md:44 | 售後服務單沒有改派，負責人跟著所屬訂單的接單業務，見 [[售後服務單]] | 卡的「四種單據」是盲測前的舊稿。現行是需求單、諮詢單、訂單三種，另可重新指定訂單審核業務主管，共四個活動（ACT-RAS-001 至 004）。工單改派只由印務主管做（ACT-RAS-005、006）。不是缺口。 |
| project_linear_format_redesign_grill_20261012.md | 17 | 抽查 | 同義 | — | 2026-10-12（v6.1 起） | 現行規範檔 | .claude/skills/linear-delivery/references/規範 - Linear 交付.md:80 | Feature 權限表用到的資料範圍用詞，都要在 project 描述的「範圍用詞」段定義。 | 原文句是該行去掉粗體段名後的前半句。 |
| project_linear_format_redesign_grill_20261012.md | 22 | 部分 | 已有家 | — | 2026-10-20 | 提交 a6336e4（2026-10-14）「G66 落卡：分享候選依活動列判斷」，早於卡的 v7 日期 | memory/Sens_wiki/wiki/erp/04-business-logic/受控清單.md:58 | 分享成員的候選限下列角色：對該單據至少有一列不靠分享的活動（範圍為全公司、自己負責或所屬產線）。 | 卡裡的「五角色」是依此通則對需求單推出的結果，不是獨立規則。wiki 改寫成通則、不帶數量，與 AGENTS 的規則名稱不帶數量一致。具體角色名單由各活動清單推導，需求單沒有逐一列舉。 |
| project_prototype_test_strategy_20260908.md | 2 | 找不到 | 已有家 | — | 2026-09-08 | erp 提交 1b34000（2026-09-08）刪 ACCEPTANCE.md 並改檔頭 | (prototype)/MOCK-DATA-CHAIN.md:3 | 驗收清單即測試碼，本目錄不再維護文字版驗收表。 | 「廢除、內容轉測試碼」有家。「不設過渡期」是當次執行方式，已完成，不需要規則。 |
| project_prototype_test_strategy_20260908.md | 3 | 找不到 | 仍缺 | 否決 | 2026-09-08 | 搜過目視、美感、主觀、hover、手機、圖示：TD/README.md 與 docs、AGENTS、docs、memory/shared、skills 皆無 | — | — | 缺的是「不留目視類別、不列主觀美感」的明文。README 只寫 Playwright 測「切角色、進頁面、點按鈕、驗預期結果」。 |
| project_prototype_test_strategy_20260908.md | 4 | 找不到 | 仍缺 | 流程環境 | 2026-09-08 | 搜過廢除、退役、直接刪：README 第 8 條只講模組搬到正式區後刪 e2e | — | — | 缺的是「已廢除功能的驗收條目直接刪、歷史靠提交訊息」。 |
| project_prototype_test_strategy_20260908.md | 5 | 抽查 | 同義 | — | 2026-09-08 | 現行 AGENTS | AGENTS.md:132 | erp repo 不放測試檔、不動 erp skill 與 `(prototype)/README.md`。 | 「測試專案放 Sens repo」另見 erp-prototype-tests/README.md:3。 |
| project_prototype_test_strategy_20260908.md | 9 | 矛盾 | 家較新 | — | 2026-09-08 | 提交 e4a8afe（2026-10-05）「測試 README 逆流程條文改寫」，之後才出現「主流程定案後照常寫測試」 | erp-prototype-tests/README.md:39 | 主流程未定案的逆流程與附加流程先不規劃測試 | 卡寫的是 2026-09-08 一刀切「逆流程不寫測試」。2026-10-05 改成：主流程未定案才先不測，已定案的照常寫測試。「綁 OQ」仍在：TD/docs/scenario-catalog.md 第十六章表有「追蹤依據」欄（無對應 OQ 或 AFT-14 等）。 |
| project_prototype_test_strategy_20260908.md | 10 | 部分 | 仍缺 | 流程環境 | 2026-09-08 | 搜過 README 撰寫規約第 4 條與情境目錄：「前置步驟寫在同一條測試開頭」有，「推不到才提補鏈、逐筆問」無 | — | — | 缺的是「推不到狀態時停下來問」這一段。性質是首輪撰寫期處理無樣本條目的辦法，轉換期債務已清完，影響輕微。 |
| project_prototype_test_strategy_20260908.md | 11 | 矛盾 | 家較新 | — | 2026-09-08 | 提交 3bdf7e7（2026-10-23）改寫第十二章出貨三十一節；提交 8c5fe02（2026-11-11）履約與售後卡遷移同步目錄；README 已把全部情境卡當分母 | erp-prototype-tests/README.md:29 | 分母：每張業務情境卡都應有對應情境節與測試 | 卡的「先不看」是 2026-09-08 當次範圍。目錄現有品檢（十一）、出貨與送達（十二）、外發與派單（十三）三章。「不做線上單」沒有明文；目錄 4.20 與 :929 仍有線上單樣本。 |
| project_prototype_test_strategy_20260908.md | 14 | 矛盾 | 家較新 | — | 2026-09-08 | 提交 3bdf7e7（2026-10-23）訊息「主流程延伸到 39 站」 | erp-prototype-tests/docs/main-flow.md:13 | 終點：訂單完成。品檢與出貨含一條專車配送路徑（第 34～39 站） | 卡的「33 站、品檢出貨不含」是 2026-09-08 版本，已被 10-23 延伸取代。README 執行表也寫 39 站。 |
| project_prototype_test_strategy_20260908.md | 17 | 抽查 | 同義 | — | 2026-09-08 | 現行站表 | erp-prototype-tests/docs/main-flow.md:11 | 業務退回（第 14 站）屬逆流程，例外納入 | README:39 亦有同一例外。 |
| project_prototype_test_strategy_20260908.md | 20 | 部分 | 仍缺 | 流程環境 | 2026-09-08 | 搜全工作樹（排除 node_modules、29-verify）：302[0] 與「殺到自己」皆零命中 | — | — | 缺的是「pkill 寫成 302[0] 才不會殺到自己的殼層」。README:20 只有一般寫法。屬操作小提醒。 |
| project_prototype_test_strategy_20260908.md | 24 | 矛盾 | 家較新 | — | 2026-09-21（拍板 A） | 提交 424007b（2026-10-23）「測試只跑 smoke 與改到的模組，全套由 Miles 指示」；AGENTS 陷阱表同日記一筆 | erp-prototype-tests/README.md:64 | 不另跑全套；PR 說明附 smoke 與影響章結果。全套 `npm test` 只在 Miles 指示時跑 | 記憶卡索引也有 2026-10-23 的 feedback_tests_smoke_and_module_only 取代此條。 |
| project_prototype_test_strategy_20260908.md | 26 | 找不到 | 仍缺 | 流程環境 | 2026-09-08 | 搜過顯示名、前後端、實作是否一致：僅 06-state-machines 規範有「轉換標籤」一行無關 | — | — | 缺的是「顯示名照 wiki、但先查前後端是否一致」。AGENTS「讀碼範圍」現行是只讀 Prototype、Miles 要求才讀真實前後端，方向不同。這是 2026-09-08 當次核對辦法，狀態名稱的正本本來就在 wiki 06 層。 |
| project_prototype_test_strategy_20260908.md | 28 | 抽查 | 同義 | — | 2026-09-08 | 現行情境卡 | memory/Sens_wiki/wiki/erp/07-scenarios/單據分享與職務代理.md:53 | 與本卡完全相同的授權與代理機制適用於訂單、需求單、[[工單]]，並非各單據各有一套 | 兩層（檢視、編輯（代理））見同卡 :31；受控清單 :54-55 定義兩個範圍用詞。 |
| project_prototype_test_strategy_20260908.md | 29a | 找不到 | 仍缺 | 否決 | 2026-09-08 | 搜過自動結算、諮詢訂單結算：wiki 現有〔諮詢費結算收尾〕卡，寫完成諮詢後系統建諮詢訂單並轉收款，發票手動開立 | — | — | 「先不做」的明文不在 wiki。後來 wiki 已規劃諮詢費結算收尾，這條多半已被取代，建議不補。 |
| project_prototype_test_strategy_20260908.md | 29b | 找不到 | 仍缺 | 否決 | 2026-09-08 | 搜過複製訂單、訂單複製、複製建單：wiki 現有 OP-ORD-008 複製訂單（訂單.md:231）與情境卡〔訂單複製建單〕，提交 1599477（2026-10-13）起 | — | — | 「先不做」已被翻案：訂單複製建單已落卡並有測試。不是缺口。 |
| project_prototype_test_strategy_20260908.md | 29c | 找不到 | 仍缺 | 否決 | 2026-09-08 | 搜過能力等級：wiki 有情境卡〔維護審稿人員能力等級〕（2026-06 起）與〔人員能力等級維護活動清單〕 | — | — | 「先不做」是 2026-09-08 對 Prototype 範圍的暫緩。wiki 本來就定義此功能，不衝突，也不需補。 |
| project_prototype_test_strategy_20260908.md | 30 | 部分 | 已有家 | — | 2026-09-08 | 現行規則卡 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯/收款項目重新規劃不設阻擋.md:29 | 兩條拆期路結果一樣，多一個功能只是多一種入口。 | 同卡 :25 寫「一期改收多期，系統不做合計判斷」。帳務.md:177 另有「不設拆期與刪除兩種事件類型」。「不獨立設拆期功能」的意旨已在。 |
| project_prototype_test_strategy_20260908.md | 31 | 找不到 | 仍缺 | 流程環境 | 2026-09-08 | 搜過轉派、再派、不得再派、不可再派；memory/shared/派工任務書範本.md 無相關句（該範本依票 30 已拍板刪除） | — | — | 缺的是「派 Sonnet 子代理的任務書要寫禁止轉派」。 |
| project_erp_repo_prototype_workflow.md | 4 | 部分 | 仍缺 | 流程環境 | 2026-07-07 | 搜 erp skill 全文與 AGENTS：正向規則有，禁令無 | — | — | 已有家的是正向規則：AGENTS.md:127「實作 MUST 經 repo 內 skill」，skill 第 1、3 步「元件選型由 Agent 照 catalog」「不要即興組版」。缺的是具體禁令：不得先自寫計畫鎖死 UI 選型再叫子代理照做。 |
| project_erp_repo_prototype_workflow.md | 5 | 矛盾 | 記憶卡較新 | 流程環境 | 2026-10-13 | erp skill 該行 git blame 為 2026-09-16（f6d78484，早於卡）；AGENTS 只寫「開分支加前端主管 PR 合併」，未寫分支名。erp 現況：topic 分支（shipment-logistics-split 10-21、print-item-copy-rule 10-29、l1 兩條 11-04）皆已併回 production-stage | /Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md:69 | prototype 一律在 `prototype/<name>` 分支上做,從 `main` 拉出。 | 該 skill 是前端主管的檔，Sens 不動，所以 Sens 側只有 AGENTS 一句「開分支加前端主管 PR」。10-13 之後仍有 topic 分支，但都已併回；「唯一長期分支」仍成立，「後續只用 production-stage」不能照字面讀。分支策略在 Sens 側沒有家。 |
| project_erp_repo_prototype_workflow.md | 6 | 找不到 | 仍缺 | 流程環境 | 2026-10-13 | 搜過 AGENTS、docs、memory/shared、skills、wiki 00-meta、erp skills 與 prototype README：無 Tag 規則。erp tag 0.2.28 為 2026-10-15、0.2.31 為 2026-10-29，皆在卡之後 | — | — | 缺的是「版本用 Tag、何時打由 Miles 指示、代理不自行打、0.2.x 是 main 版號」。 |
| project_erp_repo_prototype_workflow.md | 10 | 找不到 | 已有家 | — | 未標明 | erp skill 現行文字 | /Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md:98 | 前端換 API 時對不上。mock 貼近後端 schema。 | 同檔 :59 寫「盡量貼近後端 schema（欄位名、巢狀結構）」。「snake_case」字樣沒有，但後端欄位名即 snake_case（MOCK-DATA-CHAIN 用 expected_delivery_date），貼近後端欄位名已涵蓋。 |
| project_erp_repo_prototype_workflow.md | 11 | 找不到 | 仍缺 | 否決 | 2026-07-07 | 搜過 rubric、評分標準：erp skills、AGENTS、README 無 | — | — | 缺的是「Prototype 段不設統一交付評分標準、勿當缺口重提」。wiki 的規劃品質評分準則是規劃稿用，與此無關。 |
| project_erp_repo_prototype_workflow.md | 12 | 部分 | 仍缺 | 流程環境 | 2026-09-17 | TD/README.md 本機登入段由提交 08c9096（2026-09-16）加入；useAuthGuard.js 白名單現況仍是五個路由、受旗標控制 | — | — | 已有家：README 寫「建 .env.local 放帳密，Playwright 先登入一次」，是自動測試用的替代辦法。缺的是「代理不改白名單、內建瀏覽器要走受限頁請 Miles 登入」。 |
| project_erp_repo_prototype_workflow.md | 13 | 抽查 | 同義 | — | 2026-09-17 | 現行 README | erp-prototype-tests/README.md:35 | mock 與模擬角色存在記憶體，整頁載入即重置。 | README 規定一律 gotoInApp 與 switchRole，禁用 pushState 導頁，與「側欄點擊切頁、不用網址列」同旨。 |
| project_skill_rewrite_c5_20261029.md | 5 | 部分 | 仍缺 | 流程環境 | 2026-10-29 | 共用規範 :93 已有「每張正本卡固定三段，其餘段落由各單元規範自訂」 | — | — | 已有家的是前半：產出固定格式、骨架與範例保留。缺的是後半「產出前的推理改判斷式」。這是寫提示詞的取向，重寫已完成，影響輕微。 |
| project_skill_rewrite_c5_20261029.md | 6 | 找不到 | 仍缺 | 流程環境 | 2026-10-29 | 提交 b454935（2026-11-04）「OpenSpec 退場，刪 openspec/、12 個 openspec-* skill」；提交 12b04d9 同日改寫 AGENTS 移除 OpenSpec；票 15 把 OpenSpec skill 組移到 user-level 封存 | — | — | 已被取代，不是真缺口：規劃單改為 `.scratch/<主題>/spec.md`，不再走 OpenSpec。 |
| project_skill_rewrite_c5_20261029.md | 7 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-10-29 | 同上：openspec/ 含 specs 已於 2026-11-04 刪除，AGENTS 與 skill 沒有 specs 重構計畫 | — | — | 這條待辦隨 OpenSpec 退場失效。若 Miles 要重做規格庫，是新議題。 |
| project_skill_rewrite_c5_20261029.md | 9 | 找不到 | 仍缺 | 流程環境 | 2026-10-29 | 同第 6 列 | — | — | 已被取代：OpenSpec CLI 與 skill 已整組退場。 |
| project_skill_rewrite_c5_20261029.md | 10 | 找不到 | 仍缺 | 流程環境 | 2026-10-29 | 搜過 90 行、60 行、六段、description 只寫：無規則。現況 SKILL.md 最長 linear-delivery 150 行，其餘 71 至 82 行；references 有多檔超過 60 行 | — | — | 缺的是 skill 共用骨架與行數上限。現行 skill 描述多寫「用」與「不用」，但規則本身不在任何檔，上限也不成立。 |
| project_skill_rewrite_c5_20261029.md | 13 | 抽查 | 同義 | — | 2026-11-04（批次 5） | 現行 skill | .claude/skills/oq-manage/SKILL.md:32 | `audience` 一律填 internal。 | 「久置自 raised-at 起算」在 references/整理報告格式.md:11，同樣同義。 |
| project_skill_rewrite_c5_20261029.md | 17 | 部分 | 已有家 | — | 2026-11-04 | 工作流程重建票 12 與 map 目的地，2026-11-12 | .scratch/workflow-rebuild/issues/12-trial-run.md:9 | 用一個真實需求走完整流程。 | 卡指的「新流程」已被重建後的流程取代，票 12 是它的承接，判準 map.md:8 另寫「記錄 Miles 投入的時間與用量」。意旨同為真實主題試跑。 |
| project_skill_rewrite_c5_20261029.md | 18 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-11-04 | 搜過發現層級、C078、C031、升 reviewed：皆無。audit-failure-patterns 卡仍在 _shared，審查知識路由.md:24 有「建議封存」但無處置 | — | — | 五項待辦（稽核改發現層級比對、C078 與 C031 觀察、6 張 raw 升 reviewed、audit-failure-patterns 處置、Linear 範例更新）都沒有追蹤處。第 4 項僅有路由卡一句建議。 |
