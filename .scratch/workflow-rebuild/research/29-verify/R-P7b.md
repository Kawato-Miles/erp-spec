# R-P7b 重查結果

重查時間：2026-11-12。清單 37 列，本檔 37 列。
家的根目錄：`/Users/b-f-03-029/Sens/.claude/worktrees/blissful-leavitt-e539ef/`（以下路徑從根算起）。Prototype 路徑從 `(prototype)/` 算起。
備註：wiki 用詞是「外包」，詞彙表把「外發」列為避免用詞。記憶卡的「外發」即 wiki 的「外包」。

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 抽查 | 7 | 同義 7 |
| 找不到 | 9 | 已有家 2、仍缺 7 |
| 部分 | 18 | 已有家 13、仍缺 5 |
| 矛盾 | 3 | 家較新 3 |
| 合計 | 37 | 同義 7、已有家 15、家較新 3、仍缺 12 |

「仍缺」12 列的分類：流程環境 9、否決 1、介面 1、紀錄或待辦 1。商業規則 0，記憶卡較新 0。

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_workflow_rebuild_map_20261111.md | 5 | 抽查 | 同義 | — | 2026-11-11 | — | .scratch/workflow-rebuild/map.md:26 | 工作管理放本 repo 的 Markdown 檔，不放 Linear。 | 同一件事。卡多寫的「議題狀態不能改」在同檔第 27 行有同義句。 |
| project_workflow_rebuild_map_20261111.md | 9 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-11-11 | — | — | — | 重搜 map.md、issues、AGENTS.md：地圖只寫抵達判準，沒有「抵達後刪這張卡」。這是記憶卡自身壽命。票 29 已定 project 類卡全部移出記憶，此句失去對象，建議不列給 Miles。 |
| project_erp_manual_dev_verified.md | 2 | 部分 | 已有家 | — | 2026-09-05 | — | memory/erp/manual-writing-rules.md:17 | prototype 程式碼逐字 | 「內容須與 prototype 相同」「多入口」有家：第 17 行與 § 三 entries 欄。「做到報工」已被卡內 2026-09-23 納入品檢出貨取代，現行範圍見 manual-audit-20260923/README.md 單元表，不算缺口。 |
| project_erp_manual_dev_verified.md | 3 | 找不到 | 已有家 | — | 2026-09-05 | — | production-stage-seg1-manual-artifact.html:371 | 訂單成立到確認製作細節，含款項與發票對帳 | 手冊本體把款項與發票放在單元二訂單管理之下，只有單元一至五。與卡一致。README 表格另列「款項與發票」只是修正項目分組，不改手冊結構。 |
| project_erp_manual_dev_verified.md | 4 | 找不到 | 仍缺 | 否決 | 2026-09-05 | — | — | — | 重搜「捨棄」「外發」「待退款」「帳務異常」：無。這是手冊範圍的否決（派單外發、排程指標、中台待退款與帳務異常清單不寫進手冊），wiki 正文本來不寫。 |
| project_erp_manual_dev_verified.md | 7 | 部分 | 仍缺 | 流程環境 | 2026-09-05 | — | — | — | 「禁比喻、禁順手、刻意」已在 manual-writing-rules.md:83。仍缺「刪與本頁無直接關係的補充」「口語判斷改功能性描述（提供、顯示、列出）」兩條。第 76 行只管常見問題，不涵蓋全文。 |
| project_erp_manual_dev_verified.md | 9 | 部分 | 仍缺 | 流程環境 | 2026-09-05 | — | — | — | 規則檔 :37 與 :50 各列一部分動詞。仍缺「操作、核對」與禁用詞（說出、看懂、知道有哪些）。屬手冊寫法細節，價值低。 |
| project_erp_manual_dev_verified.md | 10 | 部分 | 仍缺 | 流程環境 | 2026-09-05 | — | — | — | 規則檔 :81 只禁具體單號。仍缺「步驟內禁參數式寫法（{工作包編號}、N 張）」。README 第 21 行「建立 N 張單」顯示這類寫法仍存在於草稿。 |
| project_erp_manual_dev_verified.md | 11 | 抽查 | 同義 | — | 2026-09-05 | — | memory/erp/manual-writing-rules.md:51 | 每列 [狀態, 負責角色, 這個狀態在等什麼 | 規則檔指定欄名為「負責角色」，與卡同義。「不用球在誰手上」未另寫，但已由指定欄名取代。 |
| project_erp_manual_dev_verified.md | 14 | 部分 | 已有家 | — | 2026-09-05 | — | production-stage-seg1-manual-artifact.html:79 | .unit-head{display:none} | 手冊本體已實作：單元標題隱藏（:79）、主題群標題可收合並只展開目前所在群組（openRoleOf）、選取項左側藍條 3px 加淺藍底（:100-101）。介面決策的家是成品本身。 |
| project_erp_manual_dev_verified.md | 18 | 部分 | 仍缺 | 介面 | 2026-09-07 | — | — | — | 「概覽用 SVG 流程圖」有家：規則檔 :52。仍缺「流程圖不必畫全部狀態，重點是讀者的心智模型正確」。規則檔 :51 只要求表格列齊例外狀態。 |
| project_erp_manual_dev_verified.md | 20 | 部分 | 已有家 | — | 2026-09-07 | — | memory/erp/manual-writing-rules.md:42 | 照表單實況完整列齊，不精簡 | 主句有家。括號內「唯讀帶入欄可合併一列」是可選做法，且規則檔 fields 已設「唯讀」欄、2026-09-23 草稿也逐欄補唯讀欄，不算缺口。 |
| project_erp_manual_dev_verified.md | 21 | 部分 | 已有家 | — | 2026-09-07 | — | production-stage-seg1-manual-artifact.html:241 | padding:0 0 0 22px;max-width:68ch;list-style:disc} | 手冊本體的「預期結果」清單樣式為一般圓點（ul.result），沒有勾勾圖示。段名見規則檔 :43。 |
| project_erp_manual_dev_verified.md | 23 | 抽查 | 同義 | — | 2026-09-07 | — | memory/erp/manual-writing-rules.md:25 | 同一決定的兩個方向算一件工作（送審與收回、核可與退回、合格與不合格） | 與卡同義，另有第 24 行「一頁＝一件工作」。 |
| project_erp_manual_dev_verified.md | 25 | 部分 | 已有家 | — | 2026-09-07 | — | memory/erp/manual-writing-rules.md:65 | 扣掉「」內介面字串後，操作指示 25 字內、說明句 30 字內 | 步驟有家。入口與注意兩處由通用輸出風格 ste100-pm.md:22 涵蓋（說明句 30 字內）。列舉句豁免同檔 :30「各項都是名詞片語…可以留在同一句」。 |
| project_erp_manual_dev_verified.md | 27 | 部分 | 已有家 | — | 2026-09-07 | — | MOCK-DATA-CHAIN.md:1029 | 讓操作手冊每一頁情境都有可直接操作的紀錄。 | 同義句在鏈八節首。 |
| project_erp_manual_dev_verified.md | 28 | 矛盾 | 家較新 | — | 2026-09-07 | 2026-09-24：QR-010 決議採 B，評估完成改由業務、諮詢執行（QR-010 answered-at 2026-09-24）；grill-decisions.md D1 同。活動清單 ACT-EST-026 隨後於 2026-10-13 入庫（git -S）。 | memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/QR-010-需求單成本評估的實務分工與系統把關落差.md:55 | 採 B：「評估完成」改由業務部門（業務、諮詢）執行 | 兩邊說法真的不同。卡的「限指定印務主管」是 2026-09-07 的 Prototype 行為，2026-09-24 grill 翻案。活動清單 :51（報價評估活動清單.md）現行寫業務、諮詢。 |
| project_erp_manual_dev_verified.md | 32 | 部分 | 仍缺 | 流程環境 | 2026-09-05 | — | — | — | 範式單元與 overview、howto 兩種頁有家（規則檔 :4、:30、:48）。仍缺手冊目錄與概覽的參考來源（Omnichat docs、Trailhead）。全庫只出現在 raw 調研，不在規範檔。屬設計參考，價值低。 |
| project_erp_manual_dev_verified.md | 33 | 矛盾 | 家較新 | — | 2026-08-18 | 2026-09-05：同卡寫「內容須與 prototype 相同」；2026-09-08：規則檔現行版（git 首次提交 2026-09-08）把按鈕、欄位改為依 prototype 程式碼，值域衝突先照 prototype。 | memory/erp/manual-writing-rules.md:18 | 先照 prototype 畫面寫 | 兩邊說法不同。「以 Dev 實際行為為準」是 2026-08-18 的做法，被 2026-09-05 之後取代。「與 wiki 矛盾停下呈報」仍有效：規則檔 :91。 |
| project_erp_manual_dev_verified.md | 34 | 找不到 | 仍缺 | 流程環境 | 2026-08-18 | — | — | — | 重搜全權限、審核類、指派 Miles：全庫無。這是 Dev 環境實測約定。2026-09-05 起手冊改依 prototype 撰寫（規則檔 :69 還禁寫 Dev），此約定已失效，建議不列給 Miles。 |
| project_erp_manual_dev_verified.md | 35 | 找不到 | 仍缺 | 流程環境 | 2026-08-18 | — | — | — | 重搜測試前綴、不新建客戶、自產：無。同樣是 Dev 實測約定，已隨改依 prototype 失效。MOCK-DATA-CHAIN.md:1029 的「不新建客戶」針對 prototype 假資料，不是同一條。 |
| project_erp_manual_dev_verified.md | 37 | 部分 | 已有家 | — | 2026-08-18 | 模型分工 2026-09-15 重定（卡 feedback_subagent_tier_blind_test_20260915） | AGENTS.md:56 | 子代理：實作、wiki 修正、稽核 | Fable 裁決見 :54。手冊撰寫歸 Opus（實作類）。卡寫的「Sonnet high 機械撰寫」是 2026-08-18 舊分工，已被取代，不算缺口。 |
| project_erp_manual_dev_verified.md | 39 | 部分 | 已有家 | — | 2026-08-18 | — | production-stage-seg1-manual-artifact.html:1166 | 「審核業務主管」是系統預設值。審核通過前，業務主管或主管可改派。 | 手冊本體已寫「系統預設值…可改派」，等同卡要求的措辭，且不寫死內部規則。預設者怎麼選（最早建立的 approve_order 持有者）只在後端程式碼，wiki 訂單.md:80 只寫「系統於草稿建立時指派」。是否補 wiki 屬 Miles 裁量，低優先。 |
| project_erp_manual_dev_verified.md | 40 | 抽查 | 同義 | — | 2026-09-08 | — | memory/erp/manual-writing-rules.md:18 | 先照 prototype 畫面寫 | 三層（wiki、prototype 逐字、值域衝突照 prototype）在 :15、:17、:18 完整對應。 |
| project_erp_manual_dev_verified.md | 48 | 抽查 | 同義 | — | 2026-09-08 | — | memory/Sens_wiki/wiki/erp/05-entities/需求單.md:64 | 用哪家公司名義接單、開發票與收款（感官或柏樂） | 兩值（感官、柏樂）同義。 |
| project_erp_manual_dev_verified.md | 49 | 部分 | 已有家 | — | 2026-09-08 | — | memory/Sens_wiki/wiki/erp/05-entities/需求單.md:108 | 由 OP-QR-003 編輯需求單填 | 成本估算的填入來源只列編輯需求單，沒列建立需求單（對照難易度列 :115 兩者並列）。等於登錄印件時不填。屬由省略推得，非明寫。 |
| project_erp_manual_dev_verified.md | 50 | 部分 | 已有家 | — | 2026-09-08 | 2026-11-05：QR-011 已 answered，難易度改選填、全系統不擋。卡的「依現況維持」被取代。 | memory/Sens_wiki/wiki/erp/06-state-machines/需求單狀態.md:112 | 需求單階段可填難易度與免審稿判定 | 現行是選填。QR-011 決議（_archives/2026/QR-011-…md「決議」段）否決「成交前補擋」。卡的過渡做法已過期，不算缺口。 |
| project_erp_manual_dev_verified.md | 51 | 找不到 | 仍缺 | 流程環境 | 2026-09-08 | — | — | — | 重搜稽核腳本、audit_merge、零項、兩輪：只有 manual-audit-20260923/README.md:143「跑手冊稽核腳本…到零項」。腳本已隨暫存目錄遺失。手冊重寫已完成，順序是歷史。仍缺的是「分派改寫任務第一輪就要求跑稽核腳本」這條教訓。 |
| project_erp_manual_dev_verified.md | 53 | 矛盾 | 家較新 | — | 2026-09-08 | 2026-09-23：grill D17「付款狀態補已退款」照 wiki，Prototype 改四值。wiki 四值字串 2026-06-03 已在（git -S，commit f3f74c8）。 | memory/Sens_wiki/wiki/erp/05-entities/訂單.md:147 | 未付款 / 部分付款 / 已付款 / 已退款 | 兩邊說法不同。卡的三值是 2026-09-08 Prototype 現況，並註「未改」。D17 之後 Prototype 對齊 wiki 的四值。 |
| project_erp_manual_dev_verified.md | 55 | 找不到 | 仍缺 | 流程環境 | 未標（卡 2026-09-23 修改） | — | — | — | 重搜 Artifact 網址關鍵字 77d8ebd7：全庫只在記憶卡。README :144 只寫「重新發布同一個 Artifact 網址」，沒有網址。票 29 已記為外部資源位置，要留。 |
| project_erp_manual_dev_verified.md | 56 | 找不到 | 仍缺 | 流程環境 | 2026-08-18 | — | — | — | 重搜 dev-dashboard：只在尺寸範本卡的外部來源（不同用途）與 log.md。Dev 環境網址與實測用途只在記憶卡。票 29 已記為外部資源位置，要留。 |
| project_manual_prototype_sync_grill_20260923.md | 1 | 部分 | 已有家 | — | 2026-09-23 | — | memory/erp/manual-audit-20260923/grill-decisions.md:8 | C：照 wiki 者先改 Prototype；照 Prototype 者改 wiki 卡 | 三項判準在 grill-decisions.md「流程判準」表（:7 全裁完再寫、:8 改向、:9 逐項判性質）。這是本次手冊修訂的工作紀錄，不是常設規範。通用原則在 AGENTS.md「欄位與狀態的新增修改是商業決策，先改 wiki 卡」。 |
| project_manual_prototype_sync_grill_20260923.md | 3 | 部分 | 已有家 | — | 2026-09-23 | wiki 卡 source 載明 Miles 2026-09-23 拍板 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/生產單據分工規則/貨送錯站不另開單.md:25 | 系統不另開一張單把貨搬回來：現場溝通後直接把貨搬到正確的站 | 即「取消回運單、送錯直接現場搬」。搜「回運」只剩這張卡與轉交單.md:46 的連結。 |
| project_manual_prototype_sync_grill_20260923.md | 8 | 部分 | 已有家 | — | 2026-09-23 | — | memory/Sens_wiki/wiki/erp/03-roles/生管.md:42 | 目的站點設錯時，生管在系統外通知印務修改 | 「系統外通知印務、生管不能改」都有：同行「只管現場執行、不改任務內容」。第一輪只查活動清單所以漏。 |
| project_manual_prototype_sync_grill_20260923.md | 9 | 抽查 | 同義 | — | 2026-09-23 | — | memory/Sens_wiki/wiki/erp/05-entities/生產任務.md:66 | 已有報工或存在在途的轉交單（[[轉交單狀態]]）時鎖定 | 同義。差異：卡寫「未結束」，wiki 寫「在途」（轉交單狀態 :46 定義為貨還沒被下游收下，不含已點收）。實務上同一範圍。 |
| project_manual_prototype_sync_grill_20260923.md | 10 | 找不到 | 已有家 | — | 2026-09-23 | — | memory/Sens_wiki/wiki/erp/05-entities/轉交單.md:42 | 建單、搬運、點收三段機制相同 | wiki 稱「外包」。轉交單.md:42 把外包生產任務列為轉交來源，與場內同一套機制。報工：報工規則/交付看時間不看狀態.md:21「外包任務也報得了工」。「回台後轉交細節先不處理」是暫不處理，不是規則。 |
| project_manual_prototype_sync_grill_20260923.md | 18 | 抽查 | 同義 | — | 2026-09-23 | — | memory/erp/manual-audit-20260923/grill-decisions.md:24 | B：手冊本批不寫，刪工單概覽角色表那一句；Prototype 補做另開工作 | 待確認清單 followups.md 與 D10 都在。vault-audit 建議沒有專條，但 AGENTS.md 收尾回報表已有通則。屬待辦紀錄，價值低。 |
