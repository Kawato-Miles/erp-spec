# R-P9b 重查結果

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 矛盾 | 11 | 家較新 9、不是矛盾 2 |
| 部分 | 11 | 已有家 6、仍缺 5 |
| 找不到 | 6 | 已有家 1、家較新 1、仍缺 4 |
| 抽查 | 8 | 同義 8 |
| 合計 | 36 | 家較新 10、不是矛盾 2、已有家 7、仍缺 9、同義 8 |

仍缺 9 列的分類：介面 1、否決 2、流程環境 4、紀錄或待辦 2、商業規則 0。記憶卡較新 0 列。

shipment 27 屬「找不到」列，但判「家較新」：家已刪除該操作，不是缺口（見該列說明）。

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_shipment_print_download_center_grill_20261023.md | 1 | 部分 | 已有家 | — | 2026-10-23 | 2026-10-23 落卡，memory/Sens_wiki/wiki/log.md:578 記「物流單刪送達憑證」 | memory/Sens_wiki/wiki/erp/05-entities/物流單.md:97 | 送達確認與交付確認不附照片 | 第一輪漏看這一句。送達憑證欄在物流單與出貨單欄位表都已不存在，全庫搜尋只剩範例卡凍結快照與 log |
| project_shipment_print_download_center_grill_20261023.md | 5 | 抽查 | 同義 | — | 2026-10-23 | 2026-10-27 EC 物流串接約束現況改 ERP 自建串接，仍寫無取消（log.md:543） | memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/EC 物流串接約束.md:50 | 串接沒有向物流商取消托運的功能，作廢只改 ERP 這一端 | 「不做取消串接」與此句同義。「重新同步刪除」在全庫已無殘留，刪除記在 log.md:578 |
| project_shipment_print_download_center_grill_20261023.md | 8 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「只拋單成功可列印與下載」；提交 60a9187（2026-10-27） | memory/Sens_wiki/wiki/erp/06-state-machines/下載檔案狀態.md:72 | 只能列印拋單狀態為拋單成功的物流單 | 卡說未作廢都可印，已被 2026-10-27 對齊後端第一版實作改掉。Prototype download-files.js:4 同寫此規則 |
| project_shipment_print_download_center_grill_20261023.md | 9 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「下載檔案狀態 刪等待中、初始為處理中」；Miles 2026-10-27 拍板（卡 source 欄） | memory/Sens_wiki/wiki/erp/06-state-machines/下載檔案狀態.md:27 | 初始；列印物流單時系統每產一份檔案就建立一筆下載檔案，即進入，並開始產檔 | 現行四態，初始是處理中。第一輪引的「沒有等待中」字樣在 2026-11-11 正規化改寫時已移除，正文只剩四態列舉 |
| project_shipment_print_download_center_grill_20261023.md | 11 | 矛盾 | 不是矛盾 | — | 2026-10-23 | — | (prototype)/qc-shipping/_lib/download-files.js:5 | 有入口的人看得到全部人的紀錄，也可只篩自己的（建立人篩選）。 | 卡的「全員可見」指有入口的人看得到所有人的紀錄；wiki 活動 ACT-VDLV-016 範圍欄「全公司」、建立者欄都與此一致，限出貨人員也與卡 G15 一致。建立人篩選屬介面，Prototype 有 |
| project_shipment_print_download_center_grill_20261023.md | 12 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「下載檔案 檔案保存 7 天」 | memory/Sens_wiki/wiki/erp/05-entities/下載檔案.md:41 | 檔案保存 7 天 | 卡說不設保存期限，已被改為保存 7 天。「新到舊」排序 wiki 無明文，只在 Prototype（download-center/page.js:36），屬介面 |
| project_shipment_print_download_center_grill_20261023.md | 17 | 抽查 | 同義 | — | 2026-10-23 | 2026-10-23 落卡（log.md:578「物流單檔案含出貨明細」） | memory/Sens_wiki/wiki/erp/05-entities/物流單.md:58 | 加一頁出貨明細（所屬出貨單全部印件與數量，不放裝箱資料） | 與卡 G17 同義 |
| project_shipment_print_download_center_grill_20261023.md | 20 | 部分 | 仍缺 | 介面 | 2026-10-23 | — | memory/Sens_wiki/wiki/erp/05-entities/出貨單.md:101 | — | wiki 已有「三位數，不重排」與唯讀。缺的是「新增時預顯示下一序號」，屬介面；Prototype logistics-rules.js:134 已有取下一個箱序的函式 |
| project_shipment_print_download_center_grill_20261023.md | 21 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「自訂箱規不存名稱且長寬高必填」 | memory/Sens_wiki/wiki/erp/05-entities/出貨單.md:102 | 選自訂箱規時不指向任何一筆箱規、不存名稱 | 卡的「名稱必填、預設帶自訂箱規」已被推翻。選項名稱「自訂箱規」本身兩邊一致 |
| project_shipment_print_download_center_grill_20261023.md | 24 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「可出貨改名已確認、等待出貨改名待出貨」 | memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md:46 | 確認可出貨後進入，系統同時依出貨方式產生物流單 | 出貨單狀態名由「可出貨」改為「已確認」；物流單初始貨態改為「待出貨」（物流單狀態.md:51）。「新增一個確認可出貨的狀態」這件事本身仍成立 |
| project_shipment_print_download_center_grill_20261023.md | 26 | 矛盾 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「裝箱回報修正只在已裝箱且整批取代」 | memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md:46 | 出貨明細數量、揀貨數量與裝箱資料自此不能修正 | 卡後半說箱規、長寬高、照片、備註在離廠前仍可改，已被推翻：確認可出貨後裝箱資料整體不能修正（出貨單狀態.md:169 同寫） |
| project_shipment_print_download_center_grill_20261023.md | 27 | 找不到 | 家較新 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「刪撤回轉換」「操作段刪 OP-SHP-024」；log.md:535 寫「確認可出貨後沒有撤銷路徑」 | memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md:169 | 裝箱資料與數量都不能修正，箱保留為裝箱紀錄 | 撤回確認可出貨已在 2026-10-27 整個刪除，不是缺口。wiki 正文沒有「不能撤回」的明文，只是狀態圖與操作段不再有撤回。任務書四選一之外的用法，主對話可改歸「記憶卡過期」 |
| project_shipment_print_download_center_grill_20261023.md | 28a | 部分 | 仍缺 | 否決 | 2026-10-23 | 2026-10-23 落卡，log.md:578「出貨單 刪實際出貨日」 | — | — | 實際出貨日在 wiki 全庫（排除 log 與範例卡）已無蹤跡；刪除只記在 log。這是刪欄位的否決，wiki 正文本來不寫，不需補 |
| project_shipment_print_download_center_grill_20261023.md | 30 | 抽查 | 同義 | — | 2026-10-23 | 2026-10-23 落卡（log.md:578「北極星指標 第二項改印件準時完工率」） | memory/Sens_wiki/wiki/erp/01-products/北極星指標.md:25 | 分子＝期間內有完工日、且完工日不晚於印件內部完成日的大貨印件數 | 卡說比對「製作完成日」，wiki 用「完工日」，指同一個欄位（印件完工日欄），名稱已改為印件準時完工率 |
| project_shipment_print_download_center_grill_20261023.md | 31 | 找不到 | 已有家 | — | 2026-10-23 | 2026-10-27 00:40，log.md:543「出貨單狀態 裝箱回報修正只在已裝箱」 | memory/Sens_wiki/wiki/erp/05-entities/出貨單.md:97 | 確認可出貨之後不能修正，要撤掉一箱時改走作廢該箱所屬物流單 | 確認可出貨後裝箱資料整體不能修正，包含新增箱；部分離廠後新增箱已無入口，比卡的「取消」更嚴 |
| project_shipment_print_download_center_grill_20261023.md | 40 | 抽查 | 同義 | — | 2026-10-23 | 2026-10-23 落卡（log.md:578） | memory/Sens_wiki/wiki/erp/01-products/北極星指標.md:13 | 一項管賺不賺錢，一項管做不做得出來 | 與卡 Q3 同義 |
| project_wiki_cleanup_by_domain.md | 1 | 找不到 | 仍缺 | 流程環境 | 2026-07-30（工作流）；卡尾修改 2026-08-04 | — | — | — | 一域一循環、雙盲矛盾偵測、衝擊分析範圍、讀卡範圍、不碰清單是 2026-07 至 08 月清整專案的做法。現行 vault-audit 改為子代理判讀加懷疑者複核、只報不修（.claude/skills/vault-audit/SKILL.md:27-29），已是另一套設計，不建議補回 |
| project_wiki_cleanup_by_domain.md | 2 | 部分 | 仍缺 | 流程環境 | 2026-07-30 | — | memory/Sens_wiki/wiki/erp/00-meta/卡片撰寫共用規範.md:248 | — | 矛盾停下呈報已有家（共用規範 § 三第 2 條）。缺的是「純機械直接修只列數字」；現行 vault-audit 規定只報不修、一律轉介（SKILL.md:27），與三級分流不同，建議不補 |
| project_wiki_cleanup_by_domain.md | 5 | 矛盾 | 家較新 | — | 2026-07-30 | 提交 b7457e0（2026-11-04）首次出現「每筆只寫出處指標」，log.md:209 記 Miles 2026-11-04～05 拍板 wiki 正規化；現行卡 source 欄皆帶「Miles 日期 拍板」 | memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md:109 | `source` 每筆只寫出處指標：拍板日期、紀錄檔路徑、題號 | 家明文要寫拍板日期，與卡的「不寫決策者與日期」相反。提交訊息標「待 Miles 拍板」，log 未逐句寫明這一條，證據屬間接，把握中等 |
| project_wiki_cleanup_by_domain.md | 6 | 部分 | 已有家 | — | 2026-07-30 | 角色卡改為活動清單卡是 2026-10-14 權責重構（MEMORY 索引「wiki 權責結構重構」） | memory/Sens_wiki/wiki/erp/07-scenarios/規範 - 業務情境.md:247 | 能力型正本在活動清單卡或實體卡時得指之，但 MUST 標明段名 | 規則仍在，只是「角色卡」換成「活動清單卡」 |
| project_wiki_cleanup_by_domain.md | 8 | 找不到 | 仍缺 | 否決 | 2026-08-04 | — | .claude/skills/vault-audit/SKILL.md:20 | — | insight 機制在現行檔案中已不存在：.claude/skills 無 vault-insight，wiki 根目錄無 12-insights，AGENTS.md 與規範檔無相關詞。診斷歸 vault-audit 報告建議段有家（SKILL.md:20）。「工作流待辦歸 memory」已被 2026-11-12 新規則取代。這是否決，不建議補 |
| project_wiki_cleanup_by_domain.md | 12 | 矛盾 | 家較新 | — | 2026-08-03 | 2026-10-28 01:12 新立生產數量一致性，log.md:412；2026-10-26 16:30 拍板算式歸實體卡算式欄（log.md 同日條目） | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯/齊套邏輯.md:52 | 各層數量之間任何時候都要成立的底線在 [[生產數量一致性]] | 底線改歸生產數量一致性；層間換算歸數量換算規則（部件倍率、跨任務比較依倍率換算）；定義與算式歸實體卡。卡的三分只剩「定義與算式歸實體卡」仍成立 |
| project_wiki_cleanup_by_domain.md | 14 | 抽查 | 同義 | — | 2026-08-04 | 2026-08-04 拍板，寫在 non-business-terms 同行 | memory/shared/non-business-terms.md:14 | 狀態機轉換表與圖說用「轉換條件」；權限類前提用「把關條件」 | 與卡同義；閘門一詞見同檔第 29 行 |
| project_wiki_cleanup_by_domain.md | 18 | 矛盾 | 不是矛盾 | — | 2026-08-04 | — | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯/齊套邏輯.md:52 | 出貨的帳另由品檢把關，可出貨額度以最終品檢通過的完工良品數為基數 | 卡的「齊套不取小」出自 2026-08-04 拍板「可出貨前提為完成品檢」（log.md:3224），指出貨不取多工單最小值。家同一段前半的「最慢工序為準」講生產完成度，兩者是兩本帳，不衝突 |
| project_wiki_cleanup_by_domain.md | 23 | 部分 | 已有家 | — | 2026-08-04 | 2026-08-04 拍板，log.md:3205 記刪 Supervisor 解鎖條、以欄位表為準 | memory/Sens_wiki/wiki/erp/05-entities/需求單.md:73 | 一般欄位；送評估之後仍可改；成交或流失後不可修改 | 欄位為一般欄位，負責業務可改；活動 ACT-EST-001（報價評估活動清單.md:33）寫明指定或更換評估印務主管由業務、諮詢「自己負責」。換人權責歸負責業務因此有家 |
| project_wiki_cleanup_by_domain.md | 24 | 抽查 | 同義 | — | 2026-08-04 | 2026-08-04 拍板，PT-025 封存 OQ 決議段 | memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/打樣流程/序列強制.md:26 | 先建大貨工單作為準備不在此限，系統不設管制也不提醒 | 與卡同義。PT-025 封存卡 08-open-questions/_archives/2026/PT-025-工單建立來源正本清單與打樣序列守衛.md:46 也寫同一結論 |
| project_wiki_cleanup_by_domain.md | 25 | 部分 | 已有家 | — | 2026-08-04 | 2026-08-04 拍板，log.md:3205 | memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/PT-025-工單建立來源正本清單與打樣序列守衛.md:46 | 工單不增設「建立來源」結構化欄位，先不做 | 家是封存 OQ 的決議段，不在工單卡正文（否決本來不寫正文）。工單.md:42 只有建立來源段落表，無欄位，與此一致 |
| project_wiki_cleanup_by_domain.md | 29 | 部分 | 已有家 | — | 2026-08-04 | 2026-08-04 拍板，log.md:3205 前後的 ORD-028 封存 | memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/ORD-028-業務平台訂單詳情頁Tab閹割範圍.md:63 | 只隱藏「會計月結對帳檢視與對帳匯出」 | 家是封存 OQ 的決議段，全句為「不閹割：業務平台的訂單詳情頁功能與中台版相同…只隱藏…」。XM-016 開放卡:32 也寫「業務平台的訂單詳情頁不閹割」。第一輪沒搜到是因為只查角色卡 |
| project_wiki_cleanup_by_domain.md | 33 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-04 | — | — | — | 2026-08-04 當日待辦快照。ORD-012、BI-005、PT-040、XM-006 仍以開放 OQ 卡存在（08-open-questions/ 下各有一張），已有家；編輯器 6 卡 tag、OQ 逾期 20 張、raw 19 張是當日數字，已過期，不建議補 |
| project_wiki_write_entry_consolidation.md | 2 | 抽查 | 同義 | — | 2026-08-01 | 規範仍在 | memory/Sens_wiki/wiki/erp/00-meta/卡片撰寫共用規範.md:285 | 全通過制、不計分 | 與卡同義 |
| project_wiki_write_entry_consolidation.md | 9 | 矛盾 | 家較新 | — | 2026-08-01 | 提交 12b04d9（2026-11-04）首次寫入 AGENTS.md「子代理會載入該檔」與 SubagentStart hook | AGENTS.md:9 | 子代理會載入該檔（內建 Explore、Plan 例外） | 卡的實測（子代理拿不到任何 CLAUDE.md）是 2026-08 的工具行為，現行已改由全域檔載入加 hook 送達 |
| project_wiki_write_entry_consolidation.md | 10 | 部分 | 仍缺 | 流程環境 | 2026-08-01 | — | memory/Sens_wiki/AGENTS.md:5 | — | 這是工具行為觀察，不是 Miles 的決策。「祖先鏈與 paths 等價、一 session 注入一次」只有研究檔 .scratch/workflow-rebuild/research/20-anthropic-setup-guidance.md:41 涵蓋「讀到檔案才載入」。「對子代理生效」與家的現況不符，不建議補 |
| project_wiki_write_entry_consolidation.md | 11 | 部分 | 已有家 | — | 2026-08-01 | 2026-08-01 實測寫入，AGENTS.md 陷阱表 | memory/Sens_wiki/AGENTS.md:47 | 指令名與參數語法一律以 skill `obsidian-cli` 為準 | 同行前半寫「省略參數時，靜默改查目前開啟的檔，回一份看似合理的錯答案」，即靜默丟參數的陷阱。「任何文件不列指令例子」由「語法以 skill 為準」承接，各 skill 均不列例子 |
| project_wiki_write_entry_consolidation.md | 13 | 抽查 | 同義 | — | 2026-08-01 | 現行維度 3、4 | .claude/skills/vault-audit/references/稽核維度.md:53 | `raw/` 全層、`09-canvases/`、`08-open-questions/_archives/` | 同檔第 59 行另寫不計 vault 外相對路徑連結。與卡同義 |
| project_wiki_write_entry_consolidation.md | 16 | 部分 | 仍缺 | 流程環境 | 2026-08-01（當時待裁） | — | .claude/skills/vault-audit/references/稽核維度.md:160 | — | 卡本來是待裁問題，非拍板。其後 2026-08-04 已批次正名，2026-11 起全庫正規化，預設不再成立，建議不補 |
| project_wiki_write_entry_consolidation.md | 17 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-08-01 | — | — | — | 12 項缺口多數已被後續修掉（維度數、稽核範圍、孤島判定等）。仍查無明文的是「last-reviewed 異動時要不要更新」：wiki-schema 與共用規範只列欄位，稽核維度.md:48 仍以它判過時。卡註明勿重跑盲測，其餘不建議補 |
