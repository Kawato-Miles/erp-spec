# P4a 重查清單

共 41 列。第一輪明細在同資料夾 `P4.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_production_dispatch_report_transfer_grill_20261006.md | A8 | 部分 | 否決 | 報工的人工註記全刪 | W05-entities/報工紀錄.md:43-54（欄位表無此欄） | 欄位表只有生產數量、良品、不良、不良原因、照片、備註；沒有明文寫「人工註記已取消」 |
| project_production_dispatch_report_transfer_grill_20261006.md | A9 | 抽查 | 規則 | 點收單一動作 | W06-state-machines/轉交單狀態.md:81 | 每條明細各新增一筆點收紀錄；不做部分明細點收 |
| project_production_dispatch_report_transfer_grill_20261006.md | A17 | 抽查 | 規則 | 實體卡欄位定義含算式與同筆檢核 | W05-entities/規範 - 實體.md:35 | 業務使用者看得到的欄位（含欄位的算式與同一筆資料內的檢核） |
| project_production_dispatch_report_transfer_grill_20261006.md | A18 | 部分 | 流程 | 執行順序固定 wiki、OpenSpec change、測試與 mock、Prototype、Linear；測試只跑受影響章節加 smoke | AGENTS.md:47,130 | 流程順序已無 OpenSpec 步驟；「改哪章跑哪章」已寫（AGENTS.md:130） |
| project_production_management_prototype_fix.md | B1 | 部分 | 介面 | 選單群組改「生產管理」，子項為生產任務管理／工作包管理／轉交管理／轉交單管理／點收佇列 | P_lib/menu-model.js:117-134 | 群組名「生產管理」相符；子項現為「所有生產任務、我的生產任務、所有工作包、我的工作包、待轉交任務、所有轉交單、我的轉交單、點收佇列」（檔內註解註明 2026-10-06 拍板） |
| project_production_management_prototype_fix.md | B4 | 矛盾 | 規則 | 「主管」同權全開 | W07-scenarios/生產管理單元可見範圍.md:41；P production-floor/_lib/permissions.js:340 | 王大明（Supervisor）…唯讀；Supervisor 在生產管理只有唯讀檢視 |
| project_production_management_prototype_fix.md | B10 | 抽查 | 規則 | 工作包欄位只留編號、指派師傅、預計完成日、備註、確樣需求 | W05-entities/工作包.md:40-48 | 欄位表五欄（確樣需求現名「確樣備註」） |
| project_production_management_prototype_fix.md | B11 | 部分 | 否決 | 刪聚合條件、上機日、上機設備、拼版結果、分攤基礎、開機費 | W05-entities/工作包.md:74 | 只寫「不承載設備、成本、狀態與報工」；聚合條件、上機日、拼版結果、分攤基礎、開機費未逐項點名 |
| project_production_management_prototype_fix.md | B17 | 部分 | 流程 | help 說明取自 wiki 欄位表，STE100 句法 | P production-floor/dispatch/page.js:376 | help 文字存在；STE100 對欄位說明的要求，AGENTS.md 未寫（只寫回覆風格） |
| project_production_management_prototype_fix.md | B18 | 部分 | 流程 | mock 全 ERP 重建，只做場內正流程一般訂單，不含外發、補做、中國派單；先出資料主鏈給 Miles 確認 | AGENTS.md:129；P MOCK-DATA-CHAIN.md | MOCK-DATA-CHAIN.md 是 mock 唯一正本；「只做場內正流程」範圍句未寫 |
| project_production_management_prototype_fix.md | B21 | 抽查 | 規則 | 帳務異常清單只列「發票待折讓或作廢」「超收」兩型 | R帳務/對帳一致性/差額怎麼分型.md:23 | 帳務異常只認兩型 |
| project_production_management_prototype_fix.md | B27 | 部分 | 介面 | 生產任務管理表欄位與欄序對齊工單詳情頁（前四欄固定左側，前置與下游不顯示） | P production-floor/dispatch/page.js:249-406 | 欄序大致相符；現況多「工作包」欄、「印件預計交期」改稱「印件內部完成日」、「投產目標」改稱「目標數量」 |
| project_production_management_prototype_fix.md | B28 | 部分 | 介面 | 印件預計交期保留在生產任務管理表 | P production-floor/dispatch/page.js:358 | 欄名現為「印件內部完成日」 |
| project_production_management_prototype_fix.md | B31 | 抽查 | 介面 | 報工對話框：每任務一列 Table、九欄不捲動、單筆批次同介面、標題「報工：工作包編號」 | P production-floor/_components/WorkReportDialog.js:82,174-287 | 工單／印件、任務、目標數量、已報數量、生產數量、良品、不良品、不良原因、照片（另有備註欄 :314） |
| project_production_management_prototype_fix.md | B35 | 部分 | 流程 | 執行一律派 sub-agent 且必用 skill，主對話禁手寫內容 | AGENTS.md:50-60,127 | 實作須經 prototype-from-prompt；模型分工表把「落卡」列在主對話；「主對話禁手寫內容」未寫 |
| project_production_quantity_audit_grill_20261026.md | C5 | 抽查 | 規則 | G5 算式一律寫在產出它的欄位旁；規則卡只留政策、動機、底線 | W05-entities/規範 - 實體.md:120 | 欄位的算式一律寫在本卡「算式」欄，不論運算元來自本筆資料或別的實體 |
| project_production_quantity_audit_grill_20261026.md | C12 | 矛盾 | 規則 | G12 補做不建新任務：對要補的任務填補做數量、目標增加、狀態轉「補做」；翻案 08-27「加開整串補做任務」 | 家：W07-scenarios/QC不通過補生產.md:34；W06-state-machines/工單狀態.md:124；W06-state-machines/生產任務狀態.md:34-40（五狀態無「補做」）；W04…/完成數取最慢工序.md:26 | 家的原文：「系統開立工單異動，並在原工單下加開整串補做生產任務」；另一處：「補做在原任務上繼續累計良品」。卡：「不建新任務…狀態轉『補做』」 |
| project_production_quantity_audit_grill_20261026.md | C13 | 找不到 | 規則 | G12 整筆已報廢的任務重做走加開新任務 | — | 搜過：整筆已報廢、報廢.*重做、加開新任務、重做 |
| project_production_quantity_audit_grill_20261026.md | C15 | 抽查 | 規則 | G15 完工良品數取數範圍不寫打樣週期條件 | W05-entities/印件.md:125 | 取數範圍：本印件的 [[品檢紀錄]] |
| project_production_quantity_audit_grill_20261026.md | C18 | 部分 | 否決 | G19／G20 完成數與待驗量不加轉交條件；待驗清單是上限、會列現場還沒到的量，接受；甲案否決 | W05-entities/印件.md:244；G:76-95 | 印件.md：「只看製作事實，不看轉交與點收」。「待驗清單是上限、接受帳上有現場沒到」與甲案否決理由只在 grill.md |
| project_production_quantity_audit_grill_20261026.md | C23 | 部分 | 待辦 | P1 補做任務承接哪一筆原任務、記在哪一欄 | G:83 | 只在 grill.md 待裁決表；08-open-questions 無對應卡 |
| project_production_quantity_audit_grill_20261026.md | C24 | 部分 | 待辦 | P2 同廠分機開兩筆任務時完成數低報一半 | G:84 | 只在 grill.md；08-open-questions 無卡。R齊套邏輯/完成數取最慢工序.md:26 只寫「各算各的、不合併不加總；量大要分廠做的走拆印件」，未提同廠分機 |
| project_production_quantity_audit_grill_20261026.md | C26 | 部分 | 待辦 | P4 「批」當購買數量時品檢與出貨粒度太粗 | G:86 | 只在 grill.md 標「另案」；08-open-questions 無卡（搜過：批、粒度、品檢粒度） |
| project_production_quantity_audit_grill_20261026.md | C27 | 抽查 | 待辦 | P5 既有 34 張實體卡換七欄 | W05-entities/*.md | 35 張實體卡欄位表皆為七欄（已完成） |
| project_production_quantity_audit_grill_20261026.md | C28 | 部分 | 待辦 | P6 數量帳落點表逐卡重構 | G:228-245（落點表 G21）；R生產數量一致性/ | 落點表與新立規則卡已有；「逐卡重構」其餘部分無進度紀錄 |
| project_production_quantity_audit_grill_20261026.md | C29 | 部分 | 待辦 | P7 打樣流程重構（少量打樣、打樣印件走完整審稿與工單、重來分兩類、通過才進大貨） | G:87；W08-open-questions/PT-074-打樣流程重構時要合併的規則.md | PT-074 只收三項待合併矛盾；打樣新需求只在 grill.md |
| project_production_quantity_audit_grill_20261026.md | C30 | 部分 | 待辦 | P8 補做設計（補做狀態轉換、工作包換包、工單與印件狀態退回、派單）；「每張工單至少一筆計入」在補做時的影響待談 | G:32（G12 列待補做設計 R2 至 R5）；W08-open-questions/PT-076-外包大貨不良的補做流程.md | grill.md 無 P8 條目；PT-076 只管外包大貨不良；無 OQ 卡 |
| project_production_quantity_audit_grill_20261026.md | C31 | 部分 | 待辦 | 清理代理列出七處仍留舊語（補做整段流程、補做來源欄、加開補做生產任務、每份產出倍率、與印件數量無關、到多少做多少、讀完） | W05-entities/報工紀錄.md:59；W04…/豐田式生產管理對映.md:38；R工序相依性規則/前置到料即可報工.md:28；W07-scenarios/QC不通過補生產.md:34 | 舊措辭仍在 wiki；清單本身不在工作資料夾或 OQ；「每份產出倍率」已清 |
| project_production_stage_restructure.md | D4 | 找不到 | 否決 | 「提前品檢」特例廢止 | — | 搜過：提前品檢、提前、分次驗（分次驗見 D2） |
| project_production_stage_restructure.md | D5 | 矛盾 | 規則 | 待驗清單＝品檢站在站量（轉交單明細按印件彙總） | W05-entities/印件.md:244 | 家的原文：「印件.待驗量 大於 0，或本印件存在品檢紀錄；只看製作事實，不看轉交與點收」。卡：「待驗清單＝品檢站在站量」 |
| project_production_stage_restructure.md | D6 | 部分 | 規則 | 「最後一道」＝工序依賴圖終點（依賴掛生產任務、可跨工單） | R工序相依性規則/前置可跨工單.md | 前置可跨工單已寫；「最後一道＝依賴圖終點」定義未寫（搜過：最後一道、終點） |
| project_production_stage_restructure.md | D9 | 部分 | 規則 | 品檢缺口補做：印務從品檢紀錄發起、預帶全工序可刪、數量預填不通過數、走工單異動、回原品檢累計複驗 | W07-scenarios/QC不通過補生產.md:34 | 寫了工單異動加開整串補做任務；缺口量取印件「缺口」欄（購買數量減完工良品數），不是不通過數；「可刪」未寫 |
| project_production_stage_restructure.md | D10 | 矛盾 | 規則 | 客戶照收：業務直接編輯印件下修數量、下限＝已出貨數、金額走減量退款 | W05-entities/印件.md:156 | 家的原文：「照收＝修正品檢紀錄，把不通過改為通過」。卡：「業務直接編輯印件下修數量」 |
| project_production_stage_restructure.md | D11 | 部分 | 規則 | 報廢：計損耗、不動任務狀態 | W05-entities/印件.md:127；W06-state-machines/生產任務狀態.md:142 | 報廢數＝缺口處置中判定報廢的累計；處置紀錄掛印件層、不另開單據。「計損耗」未直接寫 |
| project_production_stage_restructure.md | D13 | 矛盾 | 規則 | 加量承接：業務在訂單新增加印件、原印件鎖定、金額走加印追加異動（PT-009 封存） | W08-open-questions/PT-048-加量處理正本矛盾-加開新印件與原單改量並存.md:25-27 | 家的原文：「前者說加量以新印件承載…後者說原印件數量可直接改、生產側走原工單異動。兩者不能同時為真」（OQ 已開，status: open） |
| project_production_stage_restructure.md | D14 | 矛盾 | 規則 | 出貨：轉「異常」即自動回補額度（SHP-010） | R齊套邏輯/可出貨額度只隨佔用量回補.md:25,27；W08-open-questions/_archives/2026/SHP-010-異常出貨單可出貨額度是否回補.md:45 | 現行規則卡：「出貨單轉『異常』不回補」；SHP-010 決議：「出貨單轉『異常』即自動回補可出貨額度」 |
| project_production_stage_restructure.md | D16 | 部分 | 規則 | 出貨：合箱、七態、憑證、揀貨清點 7/20 拍板不變 | W05-entities/出貨單.md:43 | 合箱已寫（同訂單多印件可合箱、不可跨訂單）；七態與送達憑證搜不到（搜過：憑證、簽收、補附） |
| project_production_stage_restructure.md | D17 | 抽查 | 規則 | 現場回報通道：師傅、品檢、揀貨、出貨四角色用 ERP 行動版 | AGENTS.md:128 | 現場回報介面…開放手機寬度（現為五個介面，含貨運單點收秤重） |
| project_production_stage_restructure.md | D21 | 矛盾 | 規則 | 滾動轉交：廠務勾多行成一單；整單批次回報（照片多張掛單頭、數量掛行可修） | W03-roles/廠務.md:35；W06-state-machines/轉交單狀態.md:80 | 廠務.md：「建單與數量決策歸生管…廠務在開始搬運與抵達站點都不填量」；轉交單狀態：「逐條明細上傳簽收照片，每條至少一張」 |
| project_production_stage_restructure.md | D24 | 部分 | 待辦 | 待辦：三張情境卡（滾動轉交、揀貨裝箱出貨、分批出貨端到端） | W07-scenarios/場內轉交與修正.md；W07-scenarios/出貨與送達.md | 前兩張已有；「分批出貨端到端」無獨立情境卡（ui_correction 卡稱已移新對話） |
| project_production_stage_restructure.md | D25 | 找不到 | 待辦 | 待辦：prototype QCRecord 對齊（PT-004） | — | 搜過：PT-004、QCRecord；08-open-questions 無此卡 |
