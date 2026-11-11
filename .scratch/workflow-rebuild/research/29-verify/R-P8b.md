# R-P8b 重查結果

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 抽查 | 5 | 同義 4；不同義 1 |
| 找不到 | 9 | 已有家 1；仍缺 8 |
| 部分 | 10 | 已有家 2；仍缺 7；家較新 1（重查時發現與家矛盾，改判） |
| 矛盾 | 8 | 家較新 8 |
| 合計 | 32 | 同義 4；不同義 1；已有家 3；家較新 9；仍缺 15；記憶卡較新 0；判不出 0 |

仍缺 15 列的分類：商業規則 2；否決 4；介面 3；紀錄或待辦 6；流程環境 0。

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_quote_to_order_gap_fix.md | 1 | 抽查 | 同義 | — | 2026-09-02 | wiki log.md 2026-09-02 15:30 納入紀錄寫明同一拍板 | memory/Sens_wiki/wiki/erp/05-entities/需求單.md:78 | 選項與 [[訂單]]、[[印件]] 的出貨方式同一組 | 需求單層欄、三值、與訂單及印件同一組選項都在；轉訂單帶入見訂單.md:74 與印件.md:97 |
| project_quote_to_order_gap_fix.md | 2 | 找不到 | 仍缺 | 否決 | 2026-09-02 | — | — | — | wiki 正文只剩三值，沒有「整疊／折好不另處理」；僅 memory/Sens_wiki/wiki/log.md:2084 的動機段提到舊值域不同。否決句本來不進正文 |
| project_quote_to_order_gap_fix.md | 4 | 部分 | 仍缺 | 商業規則 | 2026-09-02 | — | — | — | 用途說明預設「需求單參考附件」已有家（訂單.md:199）；缺「轉入的附件可刪除」。訂單.md:199 與訂單其他附件保存情境卡都只寫可上傳、可改用途說明，沒寫可否刪除。缺口小 |
| project_quote_to_order_gap_fix.md | 7 | 矛盾 | 家較新 | — | 2026-09-02 | 08-open-questions/_archives/2026/QR-008 寫明 2026-10-12 Miles 拍板採 A 案，業務主管對需求單為全公司 | memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/售前單據檢視活動清單.md:36 | 查閱全公司在途的報價與議價 | 兩句講同一件事且真矛盾（部門總覽 對 全公司）。卡內「部門總覽唯讀」是 2026-09-02 的舊結論，QR-008 決議推翻。唯讀、不編輯的部分兩邊一致 |
| project_quote_to_order_gap_fix.md | 9 | 找不到 | 已有家 | — | 2026-09-02 | 該行屬 blocked-cases-log 案例紀錄，位於 linear-delivery skill 內 | .claude/skills/linear-delivery/references/blocked-cases-log.md:102 | 起草前先問清楚票數與節數的預期，不要先鋪大再收 | 第一輪只搜了 skill 規範本體與範本，漏掉案例紀錄檔。句子同義；但它在案例紀錄，不在規範本體 |
| project_work_order_creation_delivery.md | 2 | 部分 | 已有家 | — | 2026-08-19 | 規範 - Linear 交付.md 現行版 § Task 票單一歸屬 | .claude/skills/linear-delivery/references/規範 - Linear 交付.md:62 | 出現多個主要歸屬，代表 Feature 票切太細，回頭以功能顆粒重切 | 「多重歸屬＝主票切太細」同義。切分軸線已由「工作範圍」改為「需求主題、功能顆粒」（同檔:37、:42），較新，不算缺 |
| project_work_order_creation_delivery.md | 3 | 部分 | 仍缺 | 介面 | 2026-08-19 | — | — | — | Prototype review-queue/page.js:88 只依送審時間早者在前排序，沒有先依交期；情境目錄 scenario-catalog.md:1841 同。wiki 規範 - 商業邏輯.md:336 明定清單排序歸 Prototype、不進 wiki。「同交期」條件在現行 Prototype 不存在，Miles 若仍要這條，是 Prototype 缺口 |
| project_work_order_creation_delivery.md | 4 | 部分 | 仍缺 | 否決 | 2026-08-19 | — | — | — | 成本計算規則.md:42 已寫工單側與 EC 沿用同一套邏輯。缺「全套移植、不接引擎 API」，屬開發實作選擇，wiki 全庫搜移植、計價引擎、引擎 API 均無 |
| project_work_order_creation_delivery.md | 5 | 矛盾 | 家較新 | — | 2026-08-19 | 記憶卡 project_work_order_cost_color_lines_20260916 寫明 2026-09-16 拍板「材料費／工序費／裝訂費／設備費四欄刪除、退為引擎內部算式」；wiki 該句 2026-09-17 提交（PT-056）已存在 | memory/Sens_wiki/wiki/erp/05-entities/計價快照.md:43 | 各組成在此合為一數、不各自列欄 | 真矛盾，卡內四分項是舊口徑 |
| project_work_order_creation_delivery.md | 6 | 矛盾 | 家較新 | — | 2026-08-19 | wiki 08-open-questions/_archives/2026/PT-043 寫明 2026-09-03 Miles 取消：報工不填工時，工時費率與每小時折舊沒有用途，設備卡刪相關欄 | memory/Sens_wiki/wiki/erp/05-entities/計價快照.md:61 | 工時費、設備折舊與開機費分攤不入實際成本 | 真矛盾。卡內「折舊與人力時費率在實際成本側」已被 2026-09-03 拍板推翻 |
| project_work_order_creation_delivery.md | 9 | 抽查 | 不同義 | — | 2026-08-26 | 成本計算規則.md:57 與生產任務.md:107-110、:120 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/成本計算規則/成本計算規則.md:57 | 任務目標數量即備料張（由印務自行計算） | 後半「張數取自材料型任務目標數量」同義。前半「不設任務層計價輸入欄」不同義：生產任務.md:107-110 現有計價面積、每件時間、台數、頁數四個手填輸入欄（記憶卡 project_bom_pricing_input_one_row_20261013 的 2026-10-13 拍板）。只有張數不設欄（生產任務.md:120）。前半是舊結論 |
| project_work_order_creation_delivery.md | 12 | 矛盾 | 家較新 | — | 2026-08-19 | git 首見「系統不自動帶」為 2026-09-03 提交「生產任務標準化第六輪落卡」，訊息寫明「展開不自動前置」 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則/前置由印務手設.md:24 | 每個生產任務的前置任務清單由 [[印務]] 在製程規劃時逐筆手動設定，系統不自動帶 | 真矛盾，卡內預設帶線性鏈是舊裁決 A |
| project_work_order_detail_layout_done.md | 1 | 部分 | 仍缺 | 介面 | 2026-09-02 | — | — | — | 完成判定規則（生產數量累計達目標數量）已有家，在生產任務狀態.md:96；缺的是「完成量」比值。卡內第七輪（2026-09-03）已改為只列「生產數量 / 目標」與良品／不良品、無百分比，Prototype 現況同（ProductionTasksTable.js:479-517）。比值不再有效，不建議補家 |
| project_work_order_detail_layout_done.md | 2 | 找不到 | 仍缺 | 介面 | 2026-09-02 | — | — | — | 已過期，不需補家。2026-09-20 拍板把摘要卡任務進度換成預估利潤率（記憶卡 project_work_order_detail_company_alignment_20260920 第 2 題）；scenario-catalog.md:3904 寫「摘要卡沒有任務進度格」，Prototype 無此格 |
| project_work_order_detail_layout_done.md | 4 | 找不到 | 仍缺 | 否決 | 2026-09-02 | — | — | — | wiki 全庫與情境目錄搜領用量、領用，只有印刷成本結構.md:70 的備料換算（無關）。報工紀錄欄位表沒有領用量欄，Prototype 也無，等於已實現，但沒有明文「不設」 |
| project_work_order_detail_layout_done.md | 8 | 抽查 | 同義 | — | 2026-09-02 | 現行版 | memory/Sens_wiki/wiki/erp/05-entities/生產領域資料結構總覽.md:72 | 外包任務：產出數量同樣＝報工累計——[[印務]] 報工，回廠點收數量欄為對照憑據 | 外發由印務報工、回廠點收不寫報工，與卡同義。「不分場內外發、不分任務種類」由報工只有 OP-TSK-010 一個操作（生產任務.md:185 無任務種類條件）與生產任務.md:120「標準化結構」支撐。第一輪引的 ACT-MFG-005 只講印務在工單上報工，沒提外發，不是最佳句 |
| project_work_order_detail_layout_done.md | 10 | 部分 | 已有家 | — | 2026-09-02 | 現行版 | memory/Sens_wiki/wiki/erp/03-roles/外包廠商.md:27 | 生產任務的報工由工單主責在工單上回報，廠商只回報派單上的進程 | 同義於「無供應商自助報工管道」。報工紀錄.md:55 提交管道值域只有三種入口，供應商不在其中。PT-026 門戶仍為未結 OQ，不改變現況 |
| project_work_order_detail_layout_done.md | 11 | 部分 | 仍缺 | 否決 | 2026-09-02 | — | — | — | 報工紀錄.md:62-66 數量檢核寫「不符時擋下」且只列三項（生產數量大於 0、不得漏填產出、產出不得多於投入），沒有對目標數量的檢核，可推得無超量阻擋；但無「不設超量警示」的明文。已完成任務不能再新增報工（生產任務.md:185） |
| project_work_order_detail_layout_done.md | 14 | 矛盾 | 家較新 | — | 2026-09-03（第七輪） | 記憶卡 project_work_order_detail_company_alignment_20260920 第 2 題（2026-09-20）換掉任務進度與顏色費用合計；Prototype 提交 ae6070fd（2026-09-21）、013a1bec（2026-09-21 刪實際利潤率） | erp-prototype-tests/docs/scenario-catalog.md:3904 | 摘要卡沒有任務進度格與顏色費用合計格，只有預估利潤率一格 | 真矛盾。現行重點卡格為目標數量、印件預計交期、印件內部完成日、工單預排完成日、工單實際完成日、預估利潤率、負責印務（WorkOrderSummary.js:162-252），七格但內容已換 |
| project_work_order_detail_layout_done.md | 16 | 矛盾 | 家較新 | — | 2026-09-02（第三、四輪） | erp 提交 6a8ea94a（2026-09-21）「生產任務清單改用共用元件 GroupedTable，依印件部位分群」；09-20 記憶卡「09-21 追加」同寫 | work-orders/_components/detail/ProcessTab.js:82 | 三層表格（印件部位群組 → 任務列 → 展開列）套共用元件 GroupedTable | 真矛盾。卡內單一表不分層是舊版 |
| project_work_order_detail_layout_done.md | 17 | 矛盾 | 家較新 | — | 2026-09-04 | Prototype 註解寫明 2026-10-06 Miles 拍板報工紀錄卡改為歷程卡；卡內同段自己也寫 2026-09-04 改為兩個 PanelBlock、皆不收合（推翻 Collapse 版） | work-orders/_components/ProductionTasksTable.js:790 | 歷程卡（Miles 2026-10-06 拍板由「報工紀錄」改為「歷程」） | 真矛盾。現況為「生產任務資訊」卡加「歷程」卡，寬度 7 比 3 水平排列（:738），無 Collapse |
| project_work_order_detail_layout_done.md | 21 | 抽查 | 同義 | — | 2026-09-04 | 現行版 | work-orders/_components/detail/ProcessTab.js:559 | 批次報工（{selectedReportableFloorTasks.length}） | 三項都在：勾選列（:68、:603 rowSelection）、批次報工鈕（:559）、列操作報工圖示（:464-468） |
| project_work_order_detail_layout_done.md | 23 | 矛盾 | 家較新 | — | 2026-09-04 | 記憶卡 project_officer_files_to_print_item_20260924（2026-09-24 grill）搬到印件層；wiki 2026-09-29 提交「印務印件檔案與檔案備註從工單搬到印件層」 | memory/Sens_wiki/wiki/erp/05-entities/印件.md:93 | 一個印件一份清單，旗下每張 [[工單]] 的工單詳情都顯示同一份 | 真矛盾。工單層欄、限負責印務都是舊結論；現行為印件層欄、任一工單負責人與印務主管可維護、不設狀態限制 |
| project_work_order_detail_layout_done.md | 30 | 找不到 | 仍缺 | 商業規則 | 2026-09-03 | — | — | — | wiki 工單.md:101-105 只講單據內容與正式列印於製程審核完成後開放；輸出活動清單.md:43 的生管列印活動名稱是「工單異動確認後重印紙本工單」，字面讀成以異動為前提。只有情境目錄 scenario-catalog.md:2013-2018（8.22）寫生管可列印、不看負責人，未明說不以異動為前提。可能與活動清單字面矛盾，需 Miles 確認 |
| project_work_order_detail_layout_done.md | 32 | 部分 | 家較新 | — | 2026-09-03～04（卡末「已裁」段，未載日） | 記憶卡 project_bom_pricing_input_one_row_20261013 寫明 2026-10-13 翻案：改為手填面積、每件時間、台數、頁數（B3 下拉），系統以手填值查格；wiki 生產任務.md 同日對齊 | memory/Sens_wiki/wiki/erp/05-entities/生產任務.md:120 | 價格矩陣的哪一格由系統以這個數值與目標數量查得，任務上不另挑區間 | 第一輪判部分，重查發現與家真矛盾：卡內「挑區間列、不填數字」是舊結論 |
| project_work_order_detail_layout_done.md | 33 | 部分 | 仍缺 | 紀錄或待辦 | 2026-09-03～04（卡末「已裁」段，未載日） | — | — | — | 運費關稅記派單側已有家（派單.md:27、:95 有分攤運費與分攤關稅）。但「不進生產任務」已被 2026-11-05 的 PT-073（status open）取代：Miles 當日回覆先不考慮，運費關稅要不要攤進印件成本待派單模組重構時決定，原本互相矛盾的句子已刪。舊拍板不再生效，由 OQ 承接，不需補家 |
| project_work_order_detail_layout_done.md | 34 | 找不到 | 仍缺 | 紀錄或待辦 | 未載日（卡 modified 2026-09-04） | — | — | — | 三項待辦都已不成立或已解：良品數照實填（報工紀錄.md:43、:98；齊套邏輯.md:75 材料型照實回報）；卡內已裁系統未上線無存量任務，回標不成立；提交管道 wiki 現為三種入口（報工紀錄.md:55），openspec 已不是正本。不需補家 |
| project_work_order_detail_layout_done.md | 36 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-09-02（第二輪） | — | — | — | .scratch、docs、AGENTS.md 搜三個元件名均無追蹤。現況（packages/shared）：StatCards 已有 caption 副值插槽（StatCards.js:80），已解；值元素不斷行、RadioButtonGroup 無 disabled、UploadFileItem 無唯讀仍無。屬前端共用元件待辦 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 1 | 抽查 | 同義 | — | 2026-10-05 | 現行 Prototype | work-orders/_components/detail/TaskFormDialog.js:128 | 產線：這筆任務歸哪一條產線，場內與外發一律必填 | 卡內缺產線欄的待辦已落地，欄位存在且必填。待辦本身已結束 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 2 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-10-05 | — | — | — | 仍不一致：MOCK-DATA-CHAIN.md:506、:539 寫鏈五已填兩筆、合計 15,205，mock-data.js:161 寫四筆任務皆已填。.scratch、memory/shared、docs 無追蹤。屬 Prototype mock 文件待辦 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 3 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-10-05 | — | — | — | 仍不一致：mock-data.js:1203 材料任務 spoilage_rate 為 3，bom-master-mock.js:263 主檔 default_spoilage_rate 為 2.5。無追蹤。屬 Prototype mock 待辦 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 4 | 部分 | 仍缺 | 紀錄或待辦 | 2026-10-05 | — | — | — | 現行 wiki 品項主檔.md:76 範例單位已含「才」、沒有「件」，面積查價單位為平方公分或平方公尺（生產任務.md:107）；原矛盾已自然消解，但沒有明文裁決。不建議列入裁決 |
