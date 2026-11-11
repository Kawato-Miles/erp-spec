# P7a 重查清單

共 37 列。第一輪明細在同資料夾 `P7.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_linear_format_redesign_grill_20261012.md | 8 | 抽查 | 規則 | 管理權責與操作權限分開寫 | wiki/04-business-logic/受控清單.md § 管理權責與操作權限（約 :64-68） | 「管理權責是誰對單據負責…操作權限是誰在系統上能動某張單」 |
| project_linear_format_redesign_grill_20261012.md | 11 | 矛盾 | 規則 | Supervisor 可改派四種單據 | wiki/04-business-logic/服務藍圖/人力調度與職務代理流程群組/改派負責人活動清單.md 活動表 | 家：ACT-RAS-001～004 四個活動，執行角色含 Supervisor，對象是需求單接單業務、諮詢單諮詢人員、訂單接單業務、訂單審核業務主管（三種單據）；ACT-RAS-005、006 工單改派只列印務主管。卡：「Supervisor 可改派四種單據」。可能只是「四個活動」與「四種單據」的用語落差，但兩邊數字不同，不判誰對 |
| project_linear_format_redesign_grill_20261012.md | 17 | 抽查 | 規則 | project 加範圍用詞段 | 規範 § 三 第 7 條（:77 附近） | 「範圍用詞段：Feature 權限表用到的資料範圍用詞，都要在 project 描述的『範圍用詞』段定義」 |
| project_linear_format_redesign_grill_20261012.md | 22 | 部分 | 規則 | v7：分享對象限五角色 | 受控清單.md:58-61 | 找到通則：「分享成員的候選限下列角色：對該單據至少有一列不靠分享的活動」。需求單實際是哪些角色，卡內未列舉，也沒有「五」這個數；要從活動清單推導 |
| project_prototype_test_strategy_20260908.md | 2 | 找不到 | 否決 | ACCEPTANCE.md 廢除，內容轉測試碼，不設過渡期 | — | 搜過：ACCEPTANCE、驗收清單、過渡。AGENTS、README、docs、`memory/shared` 都沒有。erp 內該檔已不存在，檔頭只寫「本目錄不再維護文字版驗收表」（`Proto/MOCK-DATA-CHAIN.md:3`） |
| project_prototype_test_strategy_20260908.md | 3 | 找不到 | 否決 | 取消「留目視」類別；hover、圖示化、手機寬度皆寫成 Playwright；主觀美感不列驗收 | — | 搜過：目視、hover、美感、主觀。AGENTS 只有「現場回報介面開放手機寬度」，未涉及測試 |
| project_prototype_test_strategy_20260908.md | 4 | 找不到 | 流程 | 已廢除功能的驗收條目直接刪，歷史靠 commit 訊息 | — | 搜過：廢除、退役、直接刪。README 第 8 條只講 handoff 後刪除 |
| project_prototype_test_strategy_20260908.md | 5 | 抽查 | 規則 | 測試專案放 Sens repo；erp repo 一個檔案都不加，不動 erp skill 與 `(prototype)/README.md` | `工作樹/AGENTS.md`「Prototype 與測試」末條；README:3 | 「erp repo 不放測試檔、不動 erp skill 與 `(prototype)/README.md`」 |
| project_prototype_test_strategy_20260908.md | 9 | 矛盾 | 否決 | 逆流程與附加流程（退回、收回、取消連鎖、補做、售後、作廢、異動、短出、沖銷）不寫測試、記待辦綁 OQ | README:39 | 家：「主流程未定案的逆流程與附加流程先不規劃測試…主流程定案後，寫進情境卡主副流程的逆流程照常寫測試」。卡：「逆流程與附加流程不寫測試、記待辦綁 OQ」。情境目錄現況另有第十六章「逆流程與附加流程待辦」 |
| project_prototype_test_strategy_20260908.md | 10 | 部分 | 流程 | 無樣本條目：預設從現有鏈用畫面操作推狀態；推不到才提補鏈逐筆問 | README 撰寫規約第 4 條 | 「要先推狀態的情境，前置步驟寫在同一條測試開頭」。缺「推不到才提補鏈逐筆問」 |
| project_prototype_test_strategy_20260908.md | 11 | 矛盾 | 否決 | 範圍：不做線上單；外發與派單、品檢、出貨、售後、諮詢先不看 | `erp-prototype-tests/docs/scenario-catalog.md` 章目 | 家：目錄現有「十一、品檢」「十二、出貨與送達」「十三、外發與派單」三章。卡：「外發與派單、品檢、出貨、售後、諮詢先不看」。線上單：目錄 :857 仍列「線上單」值域，無「不做線上單」的明文 |
| project_prototype_test_strategy_20260908.md | 14 | 矛盾 | 規則 | smoke 為主流程一條 33 站；終點訂單製作完成，品檢出貨不含 | `erp-prototype-tests/docs/main-flow.md:7,13`；README 執行表 | 家：「共 39 站」「終點：訂單完成。品檢與出貨含一條專車配送路徑（第 34～39 站）」。卡：「33 站」「終點訂單製作完成，品檢出貨不含」 |
| project_prototype_test_strategy_20260908.md | 17 | 抽查 | 規則 | smoke：業務退回重審例外納入 | main-flow.md:11；README:39 | 「業務退回（第 14 站）屬逆流程，例外納入」 |
| project_prototype_test_strategy_20260908.md | 20 | 部分 | 流程 | `pkill -f "next dev --port 3020"` 會殺到自己的 shell，要寫成 `302[0]` | README:27 | 家寫「就先 `pkill -f "next dev --port 3020"`」，沒有「會殺到自己」與 `302[0]` 的提醒 |
| project_prototype_test_strategy_20260908.md | 24 | 矛盾 | 流程 | 全套只在分支合併回 develop 或開 PR 前跑一次；影響全站時例外（2026-09-21 拍板 A） | README 檢核表「合併或開 PR 前」；AGENTS「Prototype 與測試」 | 家：「不另跑全套；PR 說明附 smoke 與影響章結果。全套 `npm test` 只在 Miles 指示時跑」。卡：「全套只在分支合併回 develop 或開 PR 前跑一次」 |
| project_prototype_test_strategy_20260908.md | 26 | 找不到 | 流程 | 狀態顯示名照 wiki，但先查前後端實作是否一致 | — | 搜過：前後端、實作是否一致、狀態顯示名。AGENTS「讀碼範圍」寫「規劃與實作只讀 Prototype」，與「先查前後端」不同方向 |
| project_prototype_test_strategy_20260908.md | 28 | 抽查 | 規則 | 分享權限：需求單、訂單、工單都要兩層（檢視／代理） | 受控清單.md:48-56；分享與職務代理活動清單 | 「被分享（檢視）」「被分享（編輯）」，分享成員欄見需求單、訂單、工單卡 |
| project_prototype_test_strategy_20260908.md | 29a | 找不到 | 否決 | 先不做：諮詢訂單自動結算 | — | 搜過：自動結算、諮詢訂單結算 |
| project_prototype_test_strategy_20260908.md | 29b | 找不到 | 否決 | 先不做：訂單複製建單 | — | 搜過：複製訂單、訂單複製。注意：wiki 現有 OP-ORD-008「複製訂單」（`印件複製規則.md:49`），與「先不做」可能已不同步 |
| project_prototype_test_strategy_20260908.md | 29c | 找不到 | 否決 | 先不做：審稿人員能力等級維護 | — | 搜過：能力等級、審稿人員等級。注意：詞彙表:2157 寫審稿主管「設定每位審稿人員的能力等級」 |
| project_prototype_test_strategy_20260908.md | 30 | 部分 | 規則 | 收款拆期不是獨立功能，在訂單付款計畫直接拆 | wiki/05-entities/帳務.md:177；收款項目規劃活動清單.md:51 | 「不設拆期與刪除兩種事件類型」。沒有「拆期在訂單付款計畫直接做」這句 |
| project_prototype_test_strategy_20260908.md | 31 | 找不到 | 流程 | 派 Sonnet 子代理的任務書要寫「禁止轉派」 | — | 搜過：轉派、再派、不得再派；`memory/shared/派工任務書範本.md` 全文無 |
| project_erp_repo_prototype_workflow.md | 4 | 部分 | 否決 | MUST NOT 用自寫實作計畫預先鎖死 UI 選型後叫子代理照做 | SKILL.md:39,56 | 「元件選型與拼法｜Agent（照 catalog / recipe）」「不要即興組版」。沒有禁止「自寫計畫鎖死 UI 再派子代理」這句 |
| project_erp_repo_prototype_workflow.md | 5 | 矛盾 | 規則 | 唯一長期分支是 `prototype/production-stage`；`dispatch-and-shipping` 已快轉合回，後續只用 production-stage | 三邊並列，見下 | 見「缺口與矛盾清單」C3-5 |
| project_erp_repo_prototype_workflow.md | 6 | 找不到 | 規則 | 版本管理改用 Tag；何時打、叫什麼由 Miles 指示，不自行打；0.2.x 是 main 正式版號，prototype 不可沿用 | — | 搜過：Tag、tag、0.2、版號（AGENTS、erp 兩個 skill、README）。erp 現有 tag 0.2.28～0.2.31 |
| project_erp_repo_prototype_workflow.md | 10 | 找不到 | 規則 | mock 欄位命名用 snake_case（貼近後端 schema） | — | 搜過：snake_case、欄位命名（erp skill、AGENTS、README、MOCK-DATA-CHAIN）。只有 `Proto/README.md:30` 講 store action 命名 |
| project_erp_repo_prototype_workflow.md | 11 | 找不到 | 否決 | Prototype 段不設統一交付評分標準（rubric），勿再當缺口重提 | — | 搜過：rubric、評分標準（erp skills、AGENTS、README） |
| project_erp_repo_prototype_workflow.md | 12 | 部分 | 流程 | 本機驗證登入把關：白名單只含五個路由，其餘轉登入；agent 勿改白名單，請 Miles 登入 | `erp-prototype-tests/README.md`「本機登入」；`erp/packages/shared/hooks/useAuthGuard.js:52-63` | 家有「建 `.env.local` 寫入 ERP_TEST_USERNAME…Playwright 會先登入一次」。缺「agent 勿改白名單、請 Miles 登入」。程式碼現況：白名單 `['/components','/orders','/after-sales','/prepress-review','/sample-resource']` 受旗標控制 |
| project_erp_repo_prototype_workflow.md | 13 | 抽查 | 規則 | 整頁跳轉會重置 mock 狀態；驗證鏈用側欄點擊切頁，不用網址列 | README 撰寫規約第 3 條 | 「mock 與模擬角色存在記憶體，整頁載入即重置…之後一律 `gotoInApp` 與 `switchRole`」 |
| project_skill_rewrite_c5_20261029.md | 5 | 部分 | 規則 | D9：產出（wiki 卡、spec）固定格式、結構化，規範／骨架／範例保留；產出前推理改判斷式 | wiki/00-meta/卡片撰寫共用規範.md:91 | 找到「共用骨架（所有正本卡型一致）」與各類範例卡。「推理照判斷式」沒有 |
| project_skill_rewrite_c5_20261029.md | 6 | 找不到 | 規則 | OpenSpec：進 SDD 依原生框架；污染嚴重就從官方重抓 | — | 搜過：OpenSpec、openspec、SDD、原生（AGENTS、skills、wiki 00-meta）。工作樹無 `openspec/`；AGENTS 現行用 `.scratch/<主題>/spec.md`；票 15 已把 OpenSpec skill 組移出。卡未自述過期，疑似已被取代，未查證 |
| project_skill_rewrite_c5_20261029.md | 7 | 找不到 | 待辦 | specs 24 模組 21,798 行完整重構，另立計畫 | — | 搜過：specs 重構。工作樹無 specs 資料夾，也沒有重構計畫 |
| project_skill_rewrite_c5_20261029.md | 9 | 找不到 | 規則 | D15 A：OpenSpec 升級 CLI 並重新產生 skill，保留自訂 schema | — | 同第 6 列 |
| project_skill_rewrite_c5_20261029.md | 10 | 找不到 | 規則 | skill 共用骨架：description 只寫何時用與不用；六段；SKILL.md 上限 90 行、references 每檔 60 行 | — | 搜過：90 行、60 行、六段、共用骨架、description 只寫。現況：`linear-delivery/SKILL.md` 150 行、規範檔遠超 60 行，與卡內數字不同（規則本身不在任何檔，不能判矛盾） |
| project_skill_rewrite_c5_20261029.md | 13 | 抽查 | 規則 | oq-manage：一律 internal；久置只從 raised-at 起算 | `.claude/skills/oq-manage/SKILL.md:32`；`references/整理報告格式.md:11` | 「`audience` 一律填 internal」「open 久置天數｜30 天；自 `raised-at` 起算」 |
| project_skill_rewrite_c5_20261029.md | 17 | 部分 | 待辦 | 待辦：Miles 用下一個真實主題試用新流程 | `.scratch/workflow-rebuild/map.md` Destination | 「抵達判準：用一個真實需求走完整流程」。方向相近，不是同一件事 |
| project_skill_rewrite_c5_20261029.md | 18 | 找不到 | 待辦 | 待辦：稽核判定改發現層級比對；介面類誤觸發 C078、C031 觀察；6 張 raw 升 reviewed；audit-failure-patterns 封存或改寫；Linear 範例更新另案 | — | 搜過：發現層級、C078、升 reviewed、audit-failure-patterns。該檔仍在 `wiki/11-review-knowledge/_shared/`，但無處置紀錄 |
