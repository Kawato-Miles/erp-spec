# P4b 重查清單

共 44 列。第一輪明細在同資料夾 `P4.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_production_stage_seg2_done.md | E2 | 矛盾 | 規則 | 工序彙總：同工序加總 | R齊套邏輯/完成數取最慢工序.md:26 | 家的原文：「同一道工序有多筆任務時各算各的、不合併不加總」。卡：「同工序加總」 |
| project_production_stage_seg2_done.md | E3 | 部分 | 規則 | 報廢 0、已作廢連要求排除、打樣與已取消不進 | W05-entities/印件.md:123；R齊套邏輯/已取消工單不進齊套.md:23；R齊套邏輯/打樣週期歸零.md:24 | 作廢、報廢、已取消工單已排除；「打樣不進」搜不到，打樣印件另有自己的累計與週期歸零 |
| project_production_stage_seg2_done.md | E6 | 抽查 | 規則 | 生管建單與作廢 | W03-roles/廠務.md:35；W06-state-machines/轉交單狀態.md:82 | 建單與數量決策歸生管；OP-TT-009 作廢轉交單 |
| project_production_stage_seg2_done.md | E10 | 找不到 | 規則 | 回運單點收＝減記＋解除佔用 | — | 搜過：回運單、回運、減記、解除佔用 |
| project_production_stage_seg2_done.md | E12 | 部分 | 規則 | 材料型單欄領用量 | W05-entities/報工紀錄.md:37 | 只寫「要算材料成本得知道材料型任務實際投入多少料」；無「領用量」欄，投入量走生產數量 |
| project_production_stage_seg2_done.md | E14 | 部分 | 規則 | 任務目標數量＝該工序產出單位（B1） | W05-entities/生產任務.md:123；R成本計算規則/單位只用來顯示.md:27 | 單位取製程類主檔項目的設定、只用來顯示；「目標數量以工序產出單位計」未直接寫 |
| project_production_stage_seg2_done.md | E16 | 部分 | 規則 | 材料成本＝領用量×單價 | W08-open-questions/PT-042-拼版模數算法.md:43 | 只在 OQ 附帶句：「材料成本的算法（領用量 × 材料單價）」；成本規則卡與實體卡未寫 |
| project_production_stage_seg2_done.md | E18 | 找不到 | 待辦 | 遺留：A1 設備停機資料來源 | — | 搜過：停機、設備停機（僅生產績效指標.md:117 寫 OEE 不做） |
| project_production_stage_seg2_done.md | E19 | 抽查 | 待辦 | 遺留：A3 bubble-up 用詞全庫清整 | memory/shared/non-business-terms.md（Bubble-up 列） | 寫「狀態向上傳遞」或「自動推進」 |
| project_production_stage_seg2_done.md | E20 | 找不到 | 待辦 | 遺留：warehouse_qty 死欄位 | — | 搜過：warehouse_qty（屬實作層欄位，wiki 與 .scratch 皆無） |
| project_production_stage_seg3_done.md | F3 | 矛盾 | 規則 | R1 收尾判定＝排除異常作廢＋累計送達 ≥ 購買數量 | W06-state-machines/印件印製狀態.md:104 | 家的原文：「排除草稿與已作廢的出貨單之後，其餘出貨單全部已送達且累計送達數 ≥ 購買數量…異常出貨單…視為未收尾」。卡：「排除異常作廢」 |
| project_production_stage_seg3_done.md | F8 | 抽查 | 規則 | D2 甲：派單發稿＝交付產線單一觸發 | W06-state-machines/派單狀態.md:35 | 觸發點只有這一個 |
| project_production_stage_seg3_done.md | F11 | 找不到 | 規則 | 每箱幾個＝合箱填主品項 | — | 搜過：每箱幾個、主品項、合箱填。W05-entities/出貨單.md 現行欄位為箱規與長寬高；ui_correction 卡寫「每箱幾個逐條記在明細、無主品項」 |
| project_production_stage_seg3_done.md | F13 | 矛盾 | 流程 | 派單、貨運、運費類現況一律先查 sens-print-core（sensation-api 是 EC 後台） | AGENTS.md:48,101 | 家的原文：「派單、貨運、運費類照舊先查 sensation-api」。卡：「先查 sens-print-core（sensation-api 是 EC 後台）」 |
| project_production_stage_seg4a_done.md | G1 | 部分 | 規則 | 售後與補做統一：廢「補印」印件型別；補做永遠同一條（原工單加開任務、工序級起補推算） | W05-entities/範例 - 資料結構總覽.md:88；W07-scenarios/QC不通過補生產.md:34 | 不建新印件、不建新工單，在原工單加開補做任務；「工序級起補推算」搜不到 |
| project_production_stage_seg4a_done.md | G3 | 部分 | 規則 | 售後單建單零前提；受理與決議兩段 | R售後服務規則/建單限訂單終態.md:25；R售後服務規則/售後服務規則.md:31 | 家寫「售後服務單限訂單已進終態才能建立」與「受理不設前提以外的把關」；卡寫「建單零前提」，用詞不同 |
| project_production_stage_seg4a_done.md | G4 | 找不到 | 規則 | 把關下沉：決議選項即時顯示可否 | — | 搜過：即時、可否、不可選、決議選項 |
| project_production_stage_seg4a_done.md | G8 | 抽查 | 規則 | 取消分流：場內看報工、外發看發稿 | W06-state-machines/生產任務狀態.md:38-39 | 已作廢＝場內任務無任何報工、外包任務其派單…（已有實際投入事實→報廢） |
| project_production_stage_seg4a_done.md | G9 | 部分 | 規則 | 終態任務不改狀態；異動移除走排除標記 | W06-state-machines/訂單狀態.md:216 | 尚未確認的工單異動自待確認佇列移除；「排除標記」搜不到 |
| project_production_stage_seg4a_done.md | G13 | 部分 | 規則 | 改規格一律走新訂單 | W04…/帳務/訂單異動規則/訂單終態後金額異動路徑分流.md:28；W07-scenarios/訂單印件規格維護.md:30 | 終態後新生意另開新訂單；終態前改規格改印件明細。卡未限定時點 |
| project_production_stage_seg4a_done.md | G15 | 找不到 | 待辦 | 另案清單（補印用詞掃描、C2 訂單維護、C3 單據分享、A 類金額加 BI-25、A1 設備停機）；4B 輸入清單位置 | — | 搜過：七之一、handover、補印用詞掃描。handover 檔已在環境清場刪除；「補印」仍在 W ERP 詞彙表.md:576 |
| project_production_stage_seg4b_done.md | H3 | 部分 | 規則 | 免審輪＝印件建立時建；無審稿後檔案與縮圖 | W05-entities/審稿輪次.md:40；W08-open-questions/AR-018-免審稿合格輪次送審時間的邊界時點.md | 現行算法為印件建立時（邊界時點另開 OQ）；「無審稿後檔案與縮圖」與 R稿件管理規則/線上單免審稿印件事後補傳完稿縮圖.md 並存，未見明文取捨 |
| project_production_stage_seg4b_done.md | H4 | 部分 | 規則 | 取消免審分流：帶檔輪回未判定待人審、純空輪留歷史 | W05-entities/印件.md:107；R審稿分派規則/每輪起始檢查.md:30 | 已分派後依新值決定下一輪是否走審稿；「帶檔輪回未判定」「純空輪留歷史」搜不到（搜過：未判定、純空、空輪） |
| project_production_stage_seg4b_done.md | H5 | 部分 | 規則 | 派生六規則含待分派依稿件分流＋單向守衛；審稿段內只有等待審稿與待補件雙向 | W06-state-machines/印件審稿狀態.md:80-81 | 待分派依「稿件未上傳／已上傳」分流已寫；「派生六規則」「單向守衛」及「待補件」狀態名搜不到（現行為已補件、不合格） |
| project_production_stage_seg4b_done.md | H6 | 部分 | 規則 | 待分派佇列與手動分派限線下單 | W06-state-machines/印件審稿狀態.md:81；R審稿分派規則/線下單.md | 線上單首次上傳時自動分派；線下單手動分派；「限線下單」未明寫 |
| project_production_stage_seg4b_done.md | H7 | 找不到 | 否決 | 「在崗」欄不設 | — | 搜過：在崗、請假（僅 changelog 舊文出現） |
| project_production_stage_seg4b_done.md | H9 | 找不到 | 流程 | 能力等級維護介面延後、wiki 不標實作進度 | — | 搜過：維護介面、延後、實作進度（W07-scenarios/維護審稿人員能力等級.md 存在，未寫延後） |
| project_production_stage_seg4b_done.md | H11 | 抽查 | 規則 | 技術性退件不排除退件率（AR-6） | W08-open-questions/_archives/2026/AR-6-退件率分母是否排除技術退件.md:60 | 退件率把全部不合格輪次都算進去，技術性退件不排除 |
| project_production_stage_seg4b_done.md | H13 | 找不到 | 規則 | B2C 生產任務由印務建 | — | 搜過：B2C、線上單 生產任務建立 |
| project_production_stage_seg4b_done.md | H16 | 找不到 | 待辦 | 累計另案清單（補印用詞掃描、英文識別正名、main specs 清整、C2、C3、A 類金額、A1、通知機制） | — | 同 G15 |
| project_production_ui_correction_grill_20261012.md | I5 | 抽查 | 規則 | 品檢紀錄可修正：總數不超過本筆原合計 | R品檢規則/品檢修正總數不超過原筆.md:24 | 修正後本筆通過數量加不通過數量，不得大於本筆原通過數量加原不通過數量 |
| project_production_ui_correction_grill_20261012.md | I8 | 部分 | 規則 | 出貨單：揀貨數量與每箱幾個逐條記在明細、無主品項 | W06-state-machines/出貨單狀態.md:162 | 揀貨數量逐條已寫；「每箱幾個」現行出貨單無此欄（現為箱規與長寬高） |
| project_production_ui_correction_grill_20261012.md | I9 | 矛盾 | 規則 | 揀貨不符擋拋單、出貨確認、交付確認 | W06-state-machines/出貨單狀態.md:162-163 | 家的原文：「不符未解除前，系統擋下 OP-SHP-023 確認可出貨…確認後…各筆物流單的出貨動作不再檢查揀貨相符」。卡：「擋拋單、出貨確認、交付確認」 |
| project_production_ui_correction_grill_20261012.md | I13 | 部分 | 介面 | 縮圖兩欄（完稿＋單據照片）固定最左 | P production-floor/_components/ThumbImage.js；P work-orders/detail/page.js:197 | 縮圖元件存在；兩欄固定最左未逐頁核對 |
| project_production_ui_correction_grill_20261012.md | I15 | 部分 | 介面 | 側板寬 960，待前端補 PanelDrawer 寬度選項 | P production-floor/_components/TaskDetailDrawer.js:102 | 現況 width={1184}，非 960 |
| project_production_ui_correction_grill_20261012.md | I17 | 部分 | 規則 | 外包報工入口不做（記發現清單第 12 條） | W07-scenarios/報工與修正.md:49 | 外包任務只能在工單上報工；發現清單在 erp repo，未查 |
| project_production_ui_correction_grill_20261012.md | I18 | 抽查 | 規則 | 修正紀錄每個被改的欄位一筆 | W05-entities/報工紀錄.md:87 | 每次修正、每個被改的欄位一筆 |
| project_production_ui_correction_grill_20261012.md | I19 | 找不到 | 規則 | 重量補填到已送達 | — | 搜過：重量（出貨單、物流單、貨運單、出貨單狀態、物流單狀態） |
| project_production_ui_correction_grill_20261012.md | I25 | 找不到 | 規則 | 補附送達憑證限已送達；各出貨方式都可 | — | 搜過：補附、送達憑證、憑證、簽收（出貨單與物流單現行欄位無憑證；與 2026-10-20 拆分後的結構有關，該拆分卡不在本批） |
| project_production_ui_correction_grill_20261012.md | I26 | 部分 | 規則 | 多工單看任一張工單負責人或分享成員、不限終態 | W05-entities/印件.md:93 | 印務印件檔案在多張工單共用一份；「任一張工單負責人或分享成員、不限終態」未逐字核對 |
| project_production_ui_correction_grill_20261012.md | I29 | 抽查 | 規則 | 不通過原因必選 | W05-entities/品檢紀錄.md:45 | 不通過數量大於 0 時必選，未選無法送出 |
| project_production_ui_correction_grill_20261012.md | I30 | 找不到 | 介面 | 物流回傳不模擬，只補出貨完畢 mock | P MOCK-DATA-CHAIN.md | 搜過：出貨完畢、物流回傳 |
| project_production_ui_correction_grill_20261012.md | I38 | 抽查 | 待辦 | 待裁：XM-018、PT-069 | W08-open-questions/XM-018-查看類與指標類驗收條目沒有情境卡步驟可掛.md；W08-open-questions/PT-069-開工後要改需轉交標記時的處置路徑.md | 兩張皆 status: open |
| project_production_ui_correction_grill_20261012.md | I40 | 矛盾 | 待辦 | 待辦：全套畫面測試合併前補跑 | AGENTS.md:130 | 家的原文：「全套 npm test 只在 Miles 指示時跑」。卡：「全套畫面測試合併前補跑」 |
