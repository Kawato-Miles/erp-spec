# P9b 重查清單

共 36 列。第一輪明細在同資料夾 `P9.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_shipment_print_download_center_grill_20261023.md | 1 | 部分 | 規則 | G1 送達憑證欄位整個刪除，送達確認與交付確認不附照片 | W05-entities/物流單.md（欄位表） | 物流單、出貨單欄位表已無送達憑證欄；沒有「不附照片」的明文句。W05-entities/範例 - 實體.md:73 仍有（凍結快照）。搜過：送達憑證、補附、不附照片 |
| project_shipment_print_download_center_grill_20261023.md | 5 | 抽查 | 否決 | G3 不做取消串接；重新同步刪除 | W04-business-logic/外部約束/EC 物流串接約束.md:50 | 「串接沒有向物流商取消托運的功能，作廢只改 ERP 這一端」 |
| project_shipment_print_download_center_grill_20261023.md | 8 | 矛盾 | 規則 | G6 未作廢物流單都可印，沒拋單就缺標籤 | W06-state-machines/下載檔案狀態.md（轉換條件表第一列）；P qc-shipping/shipments/page.js:50 | 家：「只能列印拋單狀態為拋單成功的物流單；涵蓋範圍內任一筆不能列印時整批不受理」。卡：「未作廢物流單都可印，沒拋單就缺標籤」 |
| project_shipment_print_download_center_grill_20261023.md | 9 | 矛盾 | 規則 | G7、G8 下載中心狀態五態：等待中、處理中、部分成功、成功、失敗 | W06-state-machines/下載檔案狀態.md（狀態列舉）；P qc-shipping/_lib/download-files.js:3 | 家：四態「處理中」「成功」「部分成功」「失敗」，註明「（沒有等待中）」（2026-10-27 拍板）。卡：五態含等待中。成功與部分成功可下載兩邊一致 |
| project_shipment_print_download_center_grill_20261023.md | 11 | 矛盾 | 規則 | G11 下載中心全員可見，另有建立人欄與篩選 | W04-business-logic/服務藍圖/單據存取流程群組/出貨與售後檢視活動清單.md:58；W05-entities/下載檔案.md（建立者欄） | 家：「ACT-VDLV-016｜查看列印檔的產出結果｜出貨人員｜全公司」。卡 G11 全員可見，卡 G15 又寫只開出貨人員（G15 與家一致）；建立人欄有 |
| project_shipment_print_download_center_grill_20261023.md | 12 | 矛盾 | 規則 | G12 下載中心不設保存期限、新到舊 | W05-entities/下載檔案.md（檔案欄第 4 點）；P qc-shipping/download-center/page.js:36 | 家：「檔案保存 7 天」；「檔案保存 7 天，只列 7 天內建立的紀錄；新到舊排列」。卡：「不設保存期限」 |
| project_shipment_print_download_center_grill_20261023.md | 17 | 抽查 | 規則 | G17 每筆物流單一頁出貨明細＝整張出貨單印件與數量，不放裝箱資料 | W05-entities/物流單.md:58 | 「加一頁出貨明細（所屬出貨單全部印件與數量，不放裝箱資料）」 |
| project_shipment_print_download_center_grill_20261023.md | 20 | 部分 | 規則 | G22 箱序三位數不重排、唯讀；新增時預顯示下一序號 | W05-entities/出貨單.md:101 | 「三位數，不重排」；「文字（唯讀）」。缺：新增時預顯示下一序號 |
| project_shipment_print_download_center_grill_20261023.md | 21 | 矛盾 | 規則 | G23 選項改名「自訂箱規」，名稱必填、預設帶「自訂箱規」 | W05-entities/出貨單.md:102 | 家：「選自訂箱規時不指向任何一筆箱規、不存名稱」。卡：「名稱必填、預設帶『自訂箱規』」 |
| project_shipment_print_download_center_grill_20261023.md | 24 | 矛盾 | 規則 | H1、H5 新增出貨單狀態「可出貨」；物流單初始狀態同名 | W06-state-machines/出貨單狀態.md:46；W06-state-machines/物流單狀態.md:50 | 家：出貨單「已確認｜確認可出貨後進入」；物流單貨態初始「待出貨」。卡：狀態名「可出貨」 |
| project_shipment_print_download_center_grill_20261023.md | 26 | 矛盾 | 規則 | H3 鎖明細數量、揀貨數量、增刪箱；箱規、長寬高、照片、備註在物流單離廠前仍可改 | W06-state-machines/出貨單狀態.md:46 | 家：「出貨明細數量、揀貨數量與裝箱資料自此不能修正」。卡後半：箱規等在離廠前可改 |
| project_shipment_print_download_center_grill_20261023.md | 27 | 找不到 | 規則 | H4 撤回確認可出貨（揀貨人員；限全部物流單仍在可出貨；系統刪物流單不走作廢） | — | 搜過：撤回確認可出貨、撤回確認、OP-SHP-024（W 全庫排除封存） |
| project_shipment_print_download_center_grill_20261023.md | 28a | 部分 | 規則 | H7 實際出貨日刪除 | W05-entities/出貨單.md（欄位表） | 欄位表已無此欄，無明文刪除句；範例卡仍有（凍結快照）。搜過：實際出貨日 |
| project_shipment_print_download_center_grill_20261023.md | 30 | 抽查 | 規則 | H9、H10 北極星改「印件準時完工率」，比對完工日與印件內部完成日 | W01-products/北極星指標.md:22-24 | 「分子＝…完工日不晚於印件內部完成日的大貨印件數」 |
| project_shipment_print_download_center_grill_20261023.md | 31 | 找不到 | 規則 | 部分離廠後新增箱取消（推翻 10-22 G49） | — | 搜過：新增箱、取消新增箱、部分離廠；已確認後裝箱資料不可修正（見 #26），但無明文 |
| project_shipment_print_download_center_grill_20261023.md | 40 | 抽查 | 規則 | Q3 北極星第二項改「管做不做得出來」 | W01-products/北極星指標.md:13 | 「一項管賺不賺錢，一項管做不做得出來」 |
| project_wiki_cleanup_by_domain.md | 1 | 找不到 | 流程 | 清整工作流：依領域一域一循環、雙盲矛盾偵測、衝擊分析只寫連帶 wiki 卡、讀卡範圍、不碰清單 | — | 搜過：雙盲、一域一循環、衝擊分析、`S`.claude/skills/vault-audit/ 全檔 |
| project_wiki_cleanup_by_domain.md | 2 | 部分 | 流程 | 修改權限三級分流：純機械直接修；要新寫或刪內容停下；矛盾一律停下 | W00-meta/卡片撰寫共用規範.md § 三（停下鐵則）、:255 | 「矛盾呈報固定格式」。缺：純機械項直接修、只列數字 |
| project_wiki_cleanup_by_domain.md | 5 | 矛盾 | 規則 | source 一律不寫決策者與日期（全庫 22 張已清除；下次寫卡不再帶） | W00-meta/wiki-schema.md:109；W06-state-machines/下載檔案狀態.md（source 欄） | 家：「source 每筆只寫出處指標：拍板日期、紀錄檔路徑、題號，例如 Miles 2026-10-13 拍板（…）」。卡：「不寫決策者與日期」 |
| project_wiki_cleanup_by_domain.md | 6 | 部分 | 規則 | 能力型情境卡的 source 得指角色卡或實體卡，標明段名 | W07-scenarios/規範 - 業務情境.md:172、:247 | 家：「正本在活動清單卡或實體卡時得指之，但 MUST 標明段名」（角色卡已換為活動清單卡） |
| project_wiki_cleanup_by_domain.md | 8 | 找不到 | 否決 | insight 機制退場、vault-insight skill 刪除；診斷歸 vault-audit 建議段、待裁決歸 OQ、工作流待辦歸 memory | — | 搜過：vault-insight、12-insights、insight（`S`AGENTS.md、`S`.claude、W00-meta）；只在 changelog.md 命中。現行 `S`.claude/skills 無 vault-insight，但無明文；「工作流待辦歸 memory」與 2026-11-12 新規則相反 |
| project_wiki_cleanup_by_domain.md | 12 | 矛盾 | 規則 | 數量正本三分：單一數量定義與算式歸實體卡欄位、跨欄位底線與判定歸齊套邏輯、層間換算歸數量換算規則 | W04-business-logic/營運規則/訂單到交付/齊套邏輯/齊套邏輯.md:52、:82 | 家：「各層數量之間任何時候都要成立的底線在 [[生產數量一致性]]」。卡：底線與判定歸齊套邏輯 |
| project_wiki_cleanup_by_domain.md | 14 | 抽查 | 規則 | 狀態機術語白話化：守衛條件→轉換條件；閘門→門檻、把關條件、順序限制 | `S`memory/shared/non-business-terms.md:14、:29 | 「守衛（guard）｜改寫｜…用『轉換條件』」；「閘門（gate）｜改寫」 |
| project_wiki_cleanup_by_domain.md | 18 | 矛盾 | 規則 | 齊套不取小 | W04-business-logic/營運規則/訂單到交付/齊套邏輯/齊套邏輯.md:52 | 家：「生產完成度的帳以最慢工序為準」。卡：「齊套不取小」 |
| project_wiki_cleanup_by_domain.md | 23 | 部分 | 規則 | 需求單評估印務主管換人權責歸負責業務（刪 Supervisor 解鎖條） | W06-state-machines/需求單狀態.md:86 | 「送出後評估印務主管的人選仍可改（見 [[需求單]]）」。缺：換人權責歸誰的明文。搜過：換人、重新選定、重新指定 |
| project_wiki_cleanup_by_domain.md | 24 | 抽查 | 規則 | PT-025：打樣序列不設系統管制 | W04-business-logic/營運規則/訂單到交付/打樣流程/序列強制.md:26 | 「先建大貨工單作為準備不在此限，系統不設管制也不提醒」 |
| project_wiki_cleanup_by_domain.md | 25 | 部分 | 否決 | PT-025：工單建立來源欄位先不做 | W05-entities/工單.md:42 | 「建立來源」只有段落表，無欄位；無「不做欄位」的明文 |
| project_wiki_cleanup_by_domain.md | 29 | 部分 | 規則 | ORD-028：業務平台不閹割，只藏會計月結對帳檢視 | W03-roles/業務.md:38 | 「開發票、登記收款與追款歸業務」。缺：「只藏會計月結對帳檢視」的明文。搜過：閹割、月結對帳、對帳檢視 |
| project_wiki_cleanup_by_domain.md | 33 | 找不到 | 待辦 | 殘留待辦：編輯器 6 卡 tag 無規約正本、XM-006 英文 token、OQ 平層逾期 20 張、raw 19 張、ORD-012／BI-005／PT-040 | — | 搜過：`S`.scratch、`S`memory/erp；2026-08-04 狀態，未逐張核對現況 |
| project_wiki_write_entry_consolidation.md | 2 | 抽查 | 否決 | 不做評分表，保留全通過制、不計分 | W00-meta/卡片撰寫共用規範.md:285 | 「全通過制、不計分」 |
| project_wiki_write_entry_consolidation.md | 9 | 矛盾 | 規則 | sub-agent 拿不到任何 CLAUDE.md；全域偏好對 sub-agent 不生效，唯一機制是 skill 硬性載入清單 | `S`AGENTS.md:9 | 家：「子代理經使用者層 SubagentStart hook 收到全文」；「子代理會載入該檔（內建 Explore、Plan 例外）」。卡：「sub-agent 拿不到任何 CLAUDE.md，實測 context 內 0 份」 |
| project_wiki_write_entry_consolidation.md | 10 | 部分 | 規則 | CLAUDE.md 注入機制：祖先鏈與 paths glob 等價，一 session 只注入一次，對 sub-agent 生效 | `S`memory/Sens_wiki/AGENTS.md:5 | 「讀寫本目錄樹下任何檔案時生效」。缺：一 session 一次、paths glob 等價。搜過：祖先鏈、paths、注入 |
| project_wiki_write_entry_consolidation.md | 11 | 部分 | 規則 | obsidian-cli 一律載入 skill、任何文件不列指令例子；位置參數會被靜默丟掉 | `S`.claude/skills/wiki-amend/SKILL.md:47 | 「一律用 obsidian-cli，指令語法以該 skill 為準」。缺：「不列指令例子」與靜默丟參數的陷阱（後者屬外掛 skill 內容，未讀） |
| project_wiki_write_entry_consolidation.md | 13 | 抽查 | 規則 | 孤島與死鏈判定範圍：排除封存 OQ、raw、canvas、vault 外 markdown link | `S`.claude/skills/vault-audit/references/稽核維度.md:53、:58-59 | 「raw/ 全層、09-canvases/、08-open-questions/_archives/」；「不計：指向 vault 外的相對路徑 markdown 連結」 |
| project_wiki_write_entry_consolidation.md | 16 | 部分 | 流程 | 存量用詞正名預設隨異動逐步收（維度 14） | `S`.claude/skills/vault-audit/references/稽核維度.md:26 | 維度 14 存在（`d14_warn_max`）。缺：「預設隨異動逐步收」明文 |
| project_wiki_write_entry_consolidation.md | 17 | 找不到 | 待辦 | 8 agent 盲測 12 項缺口（wiki-amend 載入規範、維度 12 跑不完、last-reviewed 異動不更新等） | — | 搜過：last-reviewed 更新規則（W00-meta/wiki-schema.md 僅見欄位）；其餘缺口未逐條核對現況（卡註明勿重跑） |
