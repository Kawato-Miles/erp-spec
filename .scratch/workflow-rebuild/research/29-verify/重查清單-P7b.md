# P7b 重查清單

共 37 列。第一輪明細在同資料夾 `P7.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_workflow_rebuild_map_20261111.md | 5 | 抽查 | 規則 | 工作管理放本 repo Markdown，不放 Linear；Linear 只收交付給開發的內容 | map.md「已確定的事實」 | 「工作管理放本 repo 的 Markdown 檔，不放 Linear。Linear 只收交付給開發的內容」 |
| project_workflow_rebuild_map_20261111.md | 9 | 找不到 | 待辦 | 這張卡在地圖抵達目的地後刪除 | — | 搜過：map.md、issues 中的「刪除」「抵達」。屬記憶卡自身壽命，不是商業決策；封存此卡即已達成 |
| project_erp_manual_dev_verified.md | 2 | 部分 | 流程 | 範圍：做到報工；款項發票要做；多入口全列出；內容須與 prototype 相同 | 手冊規則 § 一、§ 四第 4 條 | 「按鈕、頁籤、欄位…prototype 程式碼逐字」「多入口同步並列」。「做到報工」「款項發票要做」界線沒寫（且品檢出貨後來加入） |
| project_erp_manual_dev_verified.md | 3 | 找不到 | 規則 | 款項是訂單管理的子階層，不是獨立單元 | — | 搜過：子階層、獨立單元、款項與發票。`manual-audit-20260923/README.md:52` 只把「款項與發票」當成一個單元列名 |
| project_erp_manual_dev_verified.md | 4 | 找不到 | 否決 | 已捨棄：派單外發、排程指標、中台待退款與帳務異常清單 | — | 搜過：捨棄、外發、待退款。`grill-decisions.md` P7 只說外發先不處理 |
| project_erp_manual_dev_verified.md | 7 | 部分 | 規則 | 第二輪用詞：刪與本頁無直接關係的補充；口語判斷改功能性描述；禁比喻與「順手」「刻意」 | 手冊規則 § 六 | 「禁比喻、禁『順手』『刻意』」。「刪題外話」「口語改功能性描述（提供／顯示／列出）」沒寫 |
| project_erp_manual_dev_verified.md | 9 | 部分 | 規則 | 目標句動詞用理解、分辨、判斷、找到、完成、操作、核對；禁「說出」「看懂」「知道有哪些」 | 手冊規則 § 三 | 「動詞用完成、把…推進到…」「動詞用理解、分辨、判斷、找到」。沒有禁用詞清單，也沒有「操作、核對」 |
| project_erp_manual_dev_verified.md | 10 | 部分 | 規則 | 步驟內禁參數式寫法（「{工作包編號}」「N 張」「WO-…」），改寫成實例數字 | 手冊規則 § 六 | 「全文不用具體單號…改寫成『這張需求單』『該印件』」。「{…}」「N 張」參數式沒寫 |
| project_erp_manual_dev_verified.md | 11 | 抽查 | 規則 | 狀態表欄名用「負責角色」，不用「球在誰手上」 | 手冊規則 § 三 overview | 「每列 [狀態, 負責角色, 這個狀態在等什麼…]」 |
| project_erp_manual_dev_verified.md | 14 | 部分 | 介面 | 側欄不顯示單元標題；主題群標題保留、可收合、手風琴；選取項左側藍條 3px 加淺藍底 | `工作樹/production-stage-seg1-manual-artifact.html:100,105` | 成品有 `border-left:3px solid transparent` 的側欄項樣式。其餘（不顯示單元標題、手風琴）規則檔沒寫，成品實作未逐項核對 |
| project_erp_manual_dev_verified.md | 18 | 部分 | 介面 | 概覽維持 SVG 流程圖；流程圖不必畫全部狀態 | 手冊規則 § 三 overview | 「預設 SVG 流程圖箭頭上的字是業務事件」。「不必畫全部狀態」沒寫（表格反而要列例外狀態） |
| project_erp_manual_dev_verified.md | 20 | 部分 | 規則 | 欄位表不精簡、照表單實況列齊（唯讀帶入欄可合併一列） | 手冊規則 § 三 fields | 「照表單實況完整列齊，不精簡」。缺「唯讀帶入欄可合併一列」 |
| project_erp_manual_dev_verified.md | 21 | 部分 | 介面 | 「預期結果」拿掉勾勾圖示，改一般項目符號 | 手冊規則 § 三 check | 「段名『預期結果』」。圖示處置沒寫 |
| project_erp_manual_dev_verified.md | 23 | 抽查 | 規則 | 一章一目標；同一決定的兩個方向算一個 | 手冊規則 § 二 | 「同一決定的兩個方向算一件工作（送審與收回、核可與退回…）」 |
| project_erp_manual_dev_verified.md | 25 | 部分 | 規則 | 長句拆分：步驟、注意、入口三處扣介面字串後超 30 字即拆，列舉句豁免 | 手冊規則 § 四第 7 條 | 「扣掉『』內介面字串後，操作指示 25 字內、說明句 30 字內」。入口與注意兩處、列舉句豁免沒寫 |
| project_erp_manual_dev_verified.md | 27 | 部分 | 規則 | 每頁情境在 prototype 要有可直接操作的假資料（鏈八早期階段資料） | `Proto/MOCK-DATA-CHAIN.md:141` | 「鏈八是早期階段樣本，另見該節」。「每頁情境要有可操作假資料」這條規則沒寫 |
| project_erp_manual_dev_verified.md | 28 | 矛盾 | 規則 | prototype 需求單：評估完成限指定印務主管 | wiki/04-business-logic/服務藍圖/線下接單流程群組/報價評估活動清單.md:51 | 家：「ACT-EST-026 確認成本到齊、可以報價｜業務、諮詢｜自己負責｜OP-QR-007 評估完成」。卡：「評估完成限指定印務主管」。（同批卡 project_manual_prototype_sync_grill 的 D1 已改為業務、諮詢按評估完成，卡內自己不一致） |
| project_erp_manual_dev_verified.md | 32 | 部分 | 流程 | 寫法規範：目錄參考 Omnichat docs；概覽參考 Trailhead；範式 q-overview／q-create；kind 為 overview／howto | 手冊規則:4、§ 三 | 找到「範式單元：需求單管理七頁」與 overview／howto 兩種頁。Omnichat、Trailhead 參考來源沒寫 |
| project_erp_manual_dev_verified.md | 33 | 矛盾 | 規則 | 新內容一律在 Dev 環境實測，以 Dev 實際行為為準；與 wiki 矛盾停下呈報 | 手冊規則 § 一 | 家：「按鈕、頁籤、欄位…prototype 程式碼逐字」「值域衝突…先照 prototype 畫面寫」。卡（2026-08-18 拍板約定）：「以 Dev 實際行為為準」。同卡 2026-09-05 起又寫「內容須與 prototype 相同」 |
| project_erp_manual_dev_verified.md | 34 | 找不到 | 流程 | 只用 Miles 全權限帳號，審核類動作全指派 Miles；登入由 Miles 完成 | — | 搜過：全權限、審核類動作、指派 Miles |
| project_erp_manual_dev_verified.md | 35 | 找不到 | 流程 | 測試單據加「測試」前綴、留在 Dev 庫不刪；不新建客戶；稿件用自產測試檔 | — | 搜過：測試前綴、不新建客戶、自產 |
| project_erp_manual_dev_verified.md | 37 | 部分 | 流程 | 模型分工：Fable 實測與裁決、Sonnet high 機械撰寫、Opus 稽核 | `工作樹/AGENTS.md`「模型分工」 | 家：「子代理：實作、wiki 修正、稽核｜Opus high」「子代理：查找、摘錄…Sonnet」。手冊撰寫歸 Opus 還是 Sonnet，沒有明說 |
| project_erp_manual_dev_verified.md | 39 | 部分 | 規則 | 建立訂單的預設審核業務主管是後端規則「最早建立的 approve_order 權限持有者」，手冊不寫死，寫「預設值須核對並視需要改派」 | wiki/05-entities/訂單.md:80 | 「審核業務主管｜系統於草稿建立時指派」。預設者怎麼選沒寫（卡說手冊也不該寫，但 wiki 端沒有說明） |
| project_erp_manual_dev_verified.md | 40 | 抽查 | 規則 | 名詞分層：狀態、角色、實體依 wiki；按鈕、欄位逐字依 prototype；值域衝突先照 prototype | 手冊規則 § 一 | 「狀態名、角色名、實體名｜wiki」「值域衝突…先照 prototype 畫面寫」 |
| project_erp_manual_dev_verified.md | 48 | 抽查 | 規則 | 帳務公司兩值 | wiki/05-entities/需求單.md:64 | 「用哪家公司名義接單、開發票與收款（感官或柏樂）」 |
| project_erp_manual_dev_verified.md | 49 | 部分 | 規則 | 登錄印件不填成本估算 | wiki/05-entities/需求單.md:108 | 「成本估算…由 OP-QR-003 編輯需求單填」。填入來源只列編輯，沒明寫「登錄印件時不填」 |
| project_erp_manual_dev_verified.md | 50 | 部分 | 規則 | 難易度把關依現況維持，QR-011 記後續改非必填 | wiki/05-entities/需求單.md:115；wiki/08-open-questions/_archives/2026/QR-011-…md | 欄位列只寫「整數（1-10）」「由 OP-QR-001…填」，沒寫必填與否。QR-011 已 `status: answered`（2026-11-05），裁決內容未讀全，卡內說法是否仍成立未查證 |
| project_erp_manual_dev_verified.md | 51 | 找不到 | 流程 | 執行順序：規則檔 → 需求單七頁 → Miles 審 → 其餘五單元兩輪（Sonnet 表面、Opus 重寫）；稽核腳本跑到零項才合併；第一輪就要求跑稽核腳本 | — | 搜過：稽核腳本、audit_merge、零項、兩輪。腳本在已過期的暫存目錄；手冊規則 § 七、八只講改寫方式與回報格式 |
| project_erp_manual_dev_verified.md | 53 | 矛盾 | 規則 | 訂單層付款彙總 未付款／部分付款／已付款（未改） | wiki/05-entities/訂單.md:147 | 家：「付款狀態｜未付款 / 部分付款 / 已付款 / 已退款」（四值）。卡：「未付款／部分付款／已付款」（三值）。另一張卡 D17 寫「付款狀態補已退款」 |
| project_erp_manual_dev_verified.md | 55 | 找不到 | 流程 | 手冊 Artifact 網址固定不換 | — | 見「外部資源的位置」 |
| project_erp_manual_dev_verified.md | 56 | 找不到 | 流程 | Dev 環境網址與實測用途 | — | 見「外部資源的位置」 |
| project_manual_prototype_sync_grill_20260923.md | 1 | 部分 | 流程 | 流程判準：D 類全裁完再寫手冊；照 wiki 者先改 Prototype、照 Prototype 者改 wiki；對齊類當場裁、新設計類走規劃流程 | `工作樹/AGENTS.md`「正本分層」；手冊規則 § 七 | 「欄位與狀態的新增修改是商業決策，先改 wiki 卡，再寫規劃單」「手冊與 prototype、wiki 三方矛盾時停下呈報」。三項判準本身只在 `manual-audit-20260923/grill-decisions.md`「流程判準」表（工作資料夾） |
| project_manual_prototype_sync_grill_20260923.md | 3 | 部分 | 規則 | 轉交規則：取消回運單 | wiki/05-entities/轉交單.md:61 | 搜 wiki 全文已無「回運單」操作，但沒有一句寫明「取消回運單、送錯直接現場搬」 |
| project_manual_prototype_sync_grill_20260923.md | 8 | 部分 | 規則 | 生管發現設錯：系統外通知印務，生管不能改 | 製程規劃活動清單.md:49-51 | 活動表沒有列生管（未列即不可做）。「系統外通知印務」沒寫 |
| project_manual_prototype_sync_grill_20260923.md | 9 | 抽查 | 規則 | 需轉交標記維持現行鎖定（有報工或有未結束轉交單即鎖） | wiki/05-entities/生產任務.md:66 | 「已有報工或存在在途的轉交單時鎖定」 |
| project_manual_prototype_sync_grill_20260923.md | 10 | 找不到 | 規則 | 外發：回台後轉交細節先不處理；外發在工單上也是生產任務，報工與轉交同一套規則 | — | 搜過：外發、轉交（轉交單卡、場內外流轉活動清單） |
| project_manual_prototype_sync_grill_20260923.md | 18 | 抽查 | 待辦 | 待辦：待確認清單、vault-audit、工單異動補做（D10） | `工作樹/memory/erp/manual-audit-20260923/followups.md`；`grill-decisions.md` D10 | 「待 Miles 確認（不擋進度）」「D10｜交付後工單異動｜B：手冊本批不寫…Prototype 補做另開工作」。vault-audit 建議沒有紀錄 |
