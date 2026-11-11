# R-P4b 重查結果

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 矛盾 | 5 | 家較新 4、記憶卡較新 1 |
| 部分 | 17 | 已有家 16、仍缺 1 |
| 抽查 | 9 | 同義 9 |
| 找不到 | 13 | 仍缺 12、已有家 1 |
| 合計 | 44 | |

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_production_stage_seg2_done.md | E2 | 矛盾 | 家較新 | — | 2026-08-11 | git log -S：「各算各的」2026-08-26 cf65cf2（齊套取數單位定為生產任務）首次進 wiki，晚於卡 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯/完成數取最慢工序.md:26 | 同一道工序有多筆任務時各算各的、不合併不加總 | 卡的「同工序加總」是 08-11 舊口徑；現行改為同工序多筆任務不加總，量大分廠走拆印件。 |
| project_production_stage_seg2_done.md | E3 | 部分 | 已有家 | — | 2026-08-11 | — | memory/Sens_wiki/wiki/erp/05-entities/印件.md:123 | `生產任務.生產任務狀態 ∉ {已作廢, 報廢}` 的 [[生產任務]] | 報廢不計、已作廢連要求排除：完成數欄取數範圍已寫。已取消工單不進：已取消工單不進齊套.md:23。「打樣不進」無逐字句：打樣工單掛在打樣印件自己的累計（打樣週期歸零.md:24），不併入大貨印件，屬結構結果，不是獨立缺口。 |
| project_production_stage_seg2_done.md | E6 | 抽查 | 同義 | — | 2026-08-11 | — | memory/Sens_wiki/wiki/erp/05-entities/轉交單.md:40 | 作廢這類例外由決定數量的人收掉——數量是誰決定的，錯了就由誰收掉 | 建單歸生管：廠務.md:35；作廢由生管：場內外流轉活動清單 ACT-FLW-011（04-business-logic/服務藍圖/生產流程群組/場內外流轉活動清單.md:46）。與卡同義。 |
| project_production_stage_seg2_done.md | E10 | 找不到 | 仍缺 | 否決 | 2026-08-11 | log.md:1621-1623（2026-09-24「場內轉交規則改版：取消回運單」，Miles 2026-09-23 grill P1～P7） | memory/Sens_wiki/wiki/log.md:1621 | — | 回運單概念已被 2026-09-24 拍板取消（送錯站現場直接搬、到料量只增不減），家的說法是「沒有回運單」，卡的規則已失效，不是漏掉的規則。 |
| project_production_stage_seg2_done.md | E12 | 部分 | 已有家 | — | 2026-08-11 | — | memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md:98 | 材料成本由材料型任務報工的生產數量累計承接 | 「領用量」欄已取消，改由材料型任務報工的生產數量承接（物料消耗記錄已封存：05-entities/_archives/物料消耗記錄.md:23）。決策意旨（材料成本取任務實際投入）已有家。 |
| project_production_stage_seg2_done.md | E14 | 部分 | 已有家 | — | 2026-08-11 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/成本計算規則/單位只用來顯示.md:27 | 只用來顯示，不參與計價與換算；生產任務不設單位欄位 | 「工序產出單位」字樣於 2026-10-06 977bb80（生產段分派、報工、轉交收斂）移除；現行是數量照實填、單位取製程類主檔設定只供顯示。目標數量不再綁「產出單位」概念。 |
| project_production_stage_seg2_done.md | E16 | 部分 | 已有家 | — | 2026-08-11 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/成本計算規則/成本計算規則.md:64 | 材料三分支（M1-M5）：材料費＝單張價 × **供應商原料張數** | 「領用量×單價」改為「供應商原料張數×單張價」（張數＝任務目標數量÷開料數進位）；比第一輪找到的 OQ 附帶句更正式。 |
| project_production_stage_seg2_done.md | E18 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-11 | — | — | — | 此待辦（主規格停機敘述與 Prototype 不同步）已無對象：報工停機兩欄已移除，OEE 本輪不做（04-business-logic/領域知識/生產績效指標.md:117），OpenSpec 主規格已棄用。 |
| project_production_stage_seg2_done.md | E19 | 抽查 | 同義 | — | 2026-08-11 | — | memory/shared/non-business-terms.md:30 | 寫「狀態向上傳遞」或「自動推進」 | 卡是清整待辦、家是用語規則；wiki 現行卡內已無 bubble-up（僅 log.md 與封存 PI-006 出現），待辦已完成。 |
| project_production_stage_seg2_done.md | E20 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-11 | — | — | — | warehouse_qty 只出現在 decks/kitting-rule-architecture.svg（舊簡報圖），wiki 與規劃單皆無；屬實作層欄位，印件層現以完成數欄承接（log.md:1309 改名）。 |
| project_production_stage_seg3_done.md | F3 | 矛盾 | 家較新 | — | 2026-08-12 | git log -S：「異常出貨單…視為未收尾」2026-10-20 2f95346（出貨單裝箱資料與物流單拆分落卡）首次出現；log.md:2962 記 08-12 口徑為「排除異常與已作廢」 | memory/Sens_wiki/wiki/erp/06-state-machines/印件印製狀態.md:104 | 異常出貨單不是終態、視為未收尾，還有異常出貨單時不轉已送達 | 卡的「排除異常」是 08-12 舊口徑；現行只排除草稿與已作廢，異常出貨單擋住收尾。 |
| project_production_stage_seg3_done.md | F8 | 抽查 | 同義 | — | 2026-08-12 | — | memory/Sens_wiki/wiki/erp/06-state-machines/派單狀態.md:35 | 對外包生產任務執行「交付產線」時系統自動切換並記錄發稿時間 | 與卡同義：交付產線是唯一觸發點。 |
| project_production_stage_seg3_done.md | F11 | 找不到 | 仍缺 | 否決 | 2026-08-12 | log.md:688-692（2026-10-20 23:30 出貨單裝箱資料與物流單拆分：「刪…每箱幾個」） | memory/Sens_wiki/wiki/log.md:688 | — | 「每箱幾個」欄已於 2026-10-20 刪除，改裝箱資料子表（每箱箱規、長寬高、照片），主品項概念隨欄位消失；規則已失效，不是漏掉。 |
| project_production_stage_seg3_done.md | F13 | 矛盾 | 記憶卡較新 | 流程環境 | 2026-08-11（feedback_check_sensation_api_asis 記 Miles 2026-08-11 確認；seg3 卡 2026-08-12） | AGENTS.md 此句來自 2026-11-04 a6d1b8e 專案入口重寫，沿用舊記憶卡檔名，其間無翻案拍板；.claude/skills/linear-delivery/SKILL.md:77 現行以 sens-print-core 為後端現況；/Users/b-f-03-029/sensation-api/CLAUDE.md 自述為 Sensation Sprint 電商平台後端 | AGENTS.md:48 | 派單、貨運、運費類照舊先查 sensation-api | 家沒跟上：ERP 後端是 sens-print-core，sensation-api 是 EC 後台。AGENTS.md:48 與陷阱表:101 兩處需更正。正確事實目前記在 feedback 卡 feedback_check_sensation_api_asis（非 project 卡，不隨移出）與本卡。 |
| project_production_stage_seg4a_done.md | G1 | 部分 | 已有家 | — | 2026-08-13 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則/補做在原印件發起.md:23 | 於原工單加開補做生產任務 | 廢補印印件型別：只補做、不另建印件.md:24；補做走原工單：同上。「工序級起補推算」已被取代：數量交給印務填、系統不推算（數量換算規則.md:48）。另注意：grill G12（2026-10-27，memory/erp/production-quantity-audit-20261026/grill.md:32）改補做為「不建新任務、填補做數量＋狀態補做」，wiki 尚未同步，仍寫加開補做任務；屬 wiki 內部待對齊，非本列缺口。 |
| project_production_stage_seg4a_done.md | G3 | 部分 | 已有家 | — | 2026-08-13 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則/建單限訂單終態.md:25 | 售後服務單限訂單已進終態才能建立 | 卡的「建單零前提」已過期：2026-08-28 3404530（log.md:2253）改為限訂單終態。「受理與決議兩段」仍成立（受理不設前提以外的把關.md:24、決議不依訂單或印件狀態擋.md:25）。 |
| project_production_stage_seg4a_done.md | G4 | 找不到 | 仍缺 | 否決 | 2026-08-13 | git log -S：「決議段不依訂單狀態」2026-08-28 664ade7（售後補做送達限制移除） | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則/決議不依訂單或印件狀態擋.md | — | 家寫「決議處理方式的全部選項都可選；決議段不依訂單狀態或印件狀態擋」（:25），已取代卡的「決議選項即時顯示可否」。規則已翻案，不是漏掉。 |
| project_production_stage_seg4a_done.md | G8 | 抽查 | 同義 | — | 2026-08-13 | — | memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md:43 | 尚無實際投入事實＝場內任務無任何報工、外包任務其 [[派單]] 尚未發稿（無成本） | 與卡同義：場內看報工、外發看發稿。第一輪寫的 38-39 行已位移，現為第 43 行。 |
| project_production_stage_seg4a_done.md | G9 | 部分 | 已有家 | — | 2026-08-13 | — | memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md:219 | 尚未確認的工單異動自 [[生管]] 待確認佇列移除、不得再確認 | 「排除標記」是實作用語，家寫成自待確認佇列移除。終態任務不改狀態：生產任務狀態.md 轉換表只有待處理或製作中可轉已作廢、報廢（:101-103），已完成不在其內。 |
| project_production_stage_seg4a_done.md | G13 | 部分 | 已有家 | — | 2026-08-13 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則/補做不可同時改稿改規格.md:24 | 客戶要改內容一律走新訂單流程，不在售後路徑 | 家限於售後路徑下改內容走新訂單；終態前的訂單改規格走印件明細（07-scenarios/訂單印件規格維護.md:30）。卡的語境是售後，與家同義。 |
| project_production_stage_seg4a_done.md | G15 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-13 | — | — | — | 六項另案待辦（補印用詞掃描、C2 訂單維護、C3 單據分享、A 類金額加 BI-25、A1 設備停機、4B 輸入清單位置）無一在 wiki。BI-25 已有封存 OQ（08-open-questions/_archives/2026/BI-25-補收與退款認列時點是否維持核可即生效.md）；「補印」在 ERP 詞彙表.md:576 仍有詞條。 |
| project_production_stage_seg4b_done.md | H3 | 部分 | 已有家 | — | 2026-08-17 | log.md:2758（2026-08-17 段 4B 拍板落卡，免審輪次時點改印件建立時） | memory/Sens_wiki/wiki/erp/05-entities/審稿輪次.md:41 | 現行算法為印件建立時，邊界時點見 [[AR-018-免審稿合格輪次送審時間的邊界時點]] | 前半（印件建立時建輪）已有家。後半「無審稿後檔案與縮圖」已被取代：審稿輪次.md:83 寫免審輪完稿縮圖必填、審稿後檔案選填，依據 Miles 2026-11-05 回覆（線上單免審稿印件事後補傳完稿縮圖.md 卡頭 source）。 |
| project_production_stage_seg4b_done.md | H4 | 部分 | 仍缺 | 商業規則 | 2026-08-17 | — | — | — | 取消免審時，已建的免審輪怎麼處理（帶檔輪回「未判定」待人審、純空輪留歷史）wiki 全庫搜「未判定」「空輪」「純空」皆無；家只寫「已分派後依新值決定下一輪是否走審稿」（印件.md:107、每輪起始檢查.md:30），沒講既有免審輪。 |
| project_production_stage_seg4b_done.md | H5 | 部分 | 已有家 | — | 2026-08-17 | — | memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md:82 | 審稿段內「等待審稿」與「待補件」**允許雙向互換** | 待分派依稿件分流：印件審稿狀態.md:80-81；其餘子狀態單向：訂單狀態.md:84。「六規則」是計數、「待補件」是訂單狀態名（非印件審稿狀態名），不是缺口。 |
| project_production_stage_seg4b_done.md | H6 | 部分 | 已有家 | — | 2026-08-17 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/審稿分派規則/分派流程只有一條.md:24 | 線上單由系統分派，線下單由 [[訂單管理人]] 或 [[審稿主管]] 分派 | 線上單首次上傳自動分派（線上單首次上傳時自動分派.md:24），人工分派只剩線下單，等於待分派佇列與手動分派限線下單。 |
| project_production_stage_seg4b_done.md | H7 | 找不到 | 已有家 | — | 2026-08-17 | — | memory/Sens_wiki/wiki/erp/05-entities/人員.md:49 | 請假／值班這類臨時狀態不設欄位 | 與卡同義：不設在崗欄，請假期間人員仍啟用，分派時執行者自行判斷。第一輪只搜「在崗」「請假」，漏看此句。 |
| project_production_stage_seg4b_done.md | H9 | 找不到 | 仍缺 | 流程環境 | 2026-08-17 | — | — | — | 「wiki 不標實作進度」只有 log.md:2758 動機句提及（實作時程屬規劃單層）；邊界檔 erp/00-meta/scope-boundary.md:10 只講「避免實作層內容雙重維護」，不等於此句。「維護介面延後」是待辦，wiki 不寫。 |
| project_production_stage_seg4b_done.md | H11 | 抽查 | 同義 | — | 2026-08-17 | — | memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/AR-6-退件率分母是否排除技術退件.md:60 | 退件率把全部不合格輪次都算進去，技術性退件**不排除** | 與卡同義。家是封存 OQ 結論；現行審稿輪次.md:59 只把技術性退件列為退件原因之一，未寫排除。 |
| project_production_stage_seg4b_done.md | H13 | 找不到 | 仍缺 | 商業規則 | 2026-08-17 | 工單.md:49 該句 2026-07-30 1b14a32 即存在，早於卡；未找到之後翻案的證據 | memory/Sens_wiki/wiki/erp/05-entities/工單.md | — | 卡寫「B2C 生產任務由印務建」；家寫線上單審稿通過後「系統依印件帶入的部件與部件配方自動建工單並帶入生產任務」（工單.md:49）、工單狀態.md:114 亦列系統建工單。兩說方向相反，建議並排呈 Miles 裁決，勿自行調和。 |
| project_production_stage_seg4b_done.md | H16 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-17 | — | — | — | 同 G15，另加英文識別正名、main specs 清整、通知機制三項，皆為待辦清單，wiki 無。 |
| project_production_ui_correction_grill_20261012.md | I5 | 抽查 | 同義 | — | 2026-10-12 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/品檢規則/品檢修正總數不超過原筆.md:24 | 修正後本筆通過數量加不通過數量，不得大於本筆原通過數量加原不通過數量 | 與卡同義。 |
| project_production_ui_correction_grill_20261012.md | I8 | 部分 | 已有家 | — | 2026-10-12 | log.md:688-692（2026-10-20 刪「每箱幾個」） | memory/Sens_wiki/wiki/erp/05-entities/出貨單.md:90 | 逐條填、不預填（預填會讓清點把關失效） | 揀貨數量逐條記在明細：已有家。「每箱幾個」與「無主品項」已隨 2026-10-20 拆分刪除（改裝箱資料子表），規則失效。 |
| project_production_ui_correction_grill_20261012.md | I9 | 矛盾 | 家較新 | — | 2026-10-12 | git log -S：「不再檢查揀貨相符」2026-10-23 8080388（shipment-print-download-center wiki 落卡）首次出現 | memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md:163 | 不符未解除前，系統擋下 [[出貨單]] OP-SHP-023 確認可出貨 | 卡的「擋拋單、出貨確認、交付確認」是 10-12 舊口徑；現行只擋確認可出貨，確認後數量鎖住、物流單動作不再檢查。 |
| project_production_ui_correction_grill_20261012.md | I13 | 部分 | 已有家 | — | 2026-10-12 | — | production-floor/_components/WorkReportRecords.js:167 | 最左兩欄固定：完稿縮圖（該印件當前合格輪次的完稿）、報工照片 | 報工紀錄表兩欄 fixed left 已核（:167-:195）。轉交單表的縮圖欄（TransferTicketTable.js:193、:207）未核是否固定最左。行號為檔案現況。 |
| project_production_ui_correction_grill_20261012.md | I15 | 部分 | 已有家 | — | 2026-10-12 | erp 4df9bd54（2026-11-04）把 width 由 960 改 1184 | production-floor/_components/TaskDetailDrawer.js:100 | PanelDrawer 無寬度選項，比照其他側板寫數字 | 「待前端補 PanelDrawer 寬度選項」的待辦仍在程式註解；寬度數字已由 960 改為 1184，卡的 960 過期。 |
| project_production_ui_correction_grill_20261012.md | I17 | 部分 | 已有家 | — | 2026-10-12 | — | memory/Sens_wiki/wiki/erp/07-scenarios/報工與修正.md:49 | 不在所有生產任務與我的生產任務清單內（[[生產任務]] 具名清單段），只能在工單上報工 | 外包任務沒有工作介面報工入口，已有家。erp repo 發現清單第 12 條未查（本列不依賴它）。 |
| project_production_ui_correction_grill_20261012.md | I18 | 抽查 | 同義 | — | 2026-10-12 | — | memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md:87 | 報工修正紀錄（每筆報工可有多筆，每次修正、每個被改的欄位一筆） | 與卡同義。 |
| project_production_ui_correction_grill_20261012.md | I19 | 找不到 | 仍缺 | 否決 | 2026-10-12（grill 41～45 題） | log.md:1309-1311（2026-10-13 05:00「出貨單拿掉重量」，推翻同日第 45 題補填範圍） | memory/Sens_wiki/wiki/log.md:1309 | — | 重量欄已於 2026-10-13 整個刪除，補填規則一併消失；不是漏掉。 |
| project_production_ui_correction_grill_20261012.md | I25 | 找不到 | 仍缺 | 否決 | 2026-10-14（第 66、72 題） | log.md:577-578（2026-10-23 23:40：出貨人員刪補附送達憑證、物流單刪送達憑證）；物流單.md:97 寫「送達確認與交付確認不附照片」 | memory/Sens_wiki/wiki/log.md:577 | — | 補附送達憑證已於 2026-10-23 取消，物流單不再有送達憑證；不是漏掉。 |
| project_production_ui_correction_grill_20261012.md | I26 | 部分 | 已有家 | — | 2026-10-14（第 62～71 題） | — | memory/Sens_wiki/wiki/erp/04-business-logic/受控清單.md:92 | 任一張工單的負責人或分享成員都算，不因那張工單已進終態而失去資格 | 與卡同義，且是跨單據通則；第一輪寫的印件.md:93 沒有此句。 |
| project_production_ui_correction_grill_20261012.md | I29 | 抽查 | 同義 | — | 2026-10-14（第 72～81 題） | — | memory/Sens_wiki/wiki/erp/05-entities/品檢紀錄.md:45 | 不通過數量大於 0 時必選，未選無法送出 | 與卡同義。 |
| project_production_ui_correction_grill_20261012.md | I30 | 找不到 | 仍缺 | 介面 | 2026-10-14（第 72～81 題） | — | — | — | MOCK-DATA-CHAIN.md:188 現以靜態樣本寫入物流商回傳（在途、配達）事件，「出貨完畢」狀態已隨 2026-10-20 拆分消失；「物流回傳不模擬」本身無明文。屬 Prototype 取捨，無業務影響。 |
| project_production_ui_correction_grill_20261012.md | I38 | 抽查 | 同義 | — | 2026-10-20 | — | memory/Sens_wiki/wiki/erp/08-open-questions/PT-069-開工後要改需轉交標記時的處置路徑.md:8 | status: open | PT-069 與 XM-018 皆 status: open（XM-018 在第 11 行），與卡「待裁」同義。 |
| project_production_ui_correction_grill_20261012.md | I40 | 矛盾 | 家較新 | — | 2026-10-14 | AGENTS.md:113 陷阱表記 2026-10-23；feedback_tests_smoke_and_module_only 卡（2026-10-23）寫合併或開 PR 前也不主動跑全套 | AGENTS.md:130 | 全套 `npm test` 只在 Miles 指示時跑 | 卡的「全套畫面測試合併前補跑」是 10-14 待辦，已被 10-23 拍板取代。 |
