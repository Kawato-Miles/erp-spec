# P3b 重查清單

共 34 列。第一輪明細在同資料夾 `P3.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_work_order_qty_color_costing_done.md | 2 | 矛盾 | 規則 | 場內沿工序相依鏈自末端倒推 ceil(下游需收×(1＋放損率))；材料型＝ceil(首道場內工序目標×用量倍率)＋固定開機損 | W:05-entities/生產任務.md:100；W:04-business-logic/營運規則/訂單到交付/數量換算規則/部件倍率.md:27 | 卡：沿鏈倒推。W：預計生產「手填，系統不預填、不倒推」；倍率「不用來推算工單目標數量」。（疑被 2026-08-26 放損拆欄取代，見 project_work_order_task_editing_done） |
| project_work_order_qty_color_costing_done.md | 4 | 矛盾 | 規則 | 末端需求＝工單目標×每份工單需生產數量（預設 1，材料可小數如 0.125） | W:05-entities/生產任務.md:105；W:…/數量換算規則/部件倍率.md:31 | 卡：材料可小數。W：每份工單需生產數量「預設 1，整數」；「倍率不會出現小數」 |
| project_work_order_qty_color_costing_done.md | 5 | 部分 | 規則 | 工單層目標不含放損 | W:05-entities/工單.md:123；W:05-entities/生產任務.md:102 | 工單目標數量＝「這張工單要生產的總數」；生產任務目標數量＝預計生產＋放損。沒有明文「工單層不含放損」 |
| project_work_order_qty_color_costing_done.md | 6 | 部分 | 規則 | 印件「預計投入量」欄廢除 | W:05-entities/印件.md（欄位表無此欄）；W:log.md:2627 | 印件卡沒有此欄；log 只有「移除預計投入量列舉」（齊套邏輯）。沒有明文廢除句。搜過：預計投入量（現行卡零命中） |
| project_work_order_qty_color_costing_done.md | 7 | 矛盾 | 規則 | 完成判定三變體：場內工序／裝訂＝投入≥目標；材料＝報工即完成；外發＝產出≥目標；齊套完成數維持產出口徑 | W:06-state-machines/生產任務狀態.md:48、:96 | 四種廠商類別走同一條路徑……一律由報工推進；報工的生產數量累計達目標數量時系統自動判定完成。（卡 feedback_production_task_standardized 亦記「三變體已推翻 2026-09-02」） |
| project_work_order_qty_color_costing_done.md | 8 | 矛盾 | 規則 | 放損低於預期＝生管直接手動完成（僅生管、歷程留痕、僅「製作中」可按，不走異動不修目標） | W:06-state-machines/生產任務狀態.md:97；W:04-business-logic/服務藍圖/生產流程群組/製作與報工活動清單.md（ACT-MFG-017、018） | 手動完成存在且留痕、不改任務內容（一致）。但執行角色：生管（所屬產線）＋代行的印務、印務主管，不是「僅生管」；findings-20260908.md 10.16 亦記「把印務列入可操作四角色」 |
| project_work_order_qty_color_costing_done.md | 9 | 矛盾 | 規則 | 已完成任務報工作廢系統擋下（B4 延伸） | W:04-business-logic/營運規則/訂單到交付/報工規則/報工修正不設結束後凍結.md:24；W:06-state-machines/生產任務狀態.md:99 | 卡：擋下。W：所屬工單已「已完成」之後仍可修正，不另設凍結；「已完成 → 製作中」由修正或作廢報工觸發 |
| project_work_order_qty_color_costing_done.md | 10 | 抽查 | 規則 | 報工門檻＝目標數量（不再乘放損、不重複加開機損） | W:06-state-machines/生產任務狀態.md:96；W:05-entities/生產任務.md（生產數量欄） | 生產數量累計達目標數量；任務自身的完成判定取這個累計達目標數量 |
| project_work_order_qty_color_costing_done.md | 11 | 部分 | 規則 | 開機損加在張層（件層加開機損＝把廢紙當成品） | W:05-entities/設備.md:77 | 固定開機損載體是「最低損耗張數」（張）；沒有「不加在件層」的明文與理由。搜過：張層、件層、廢紙 |
| project_work_order_qty_color_costing_done.md | 14 | 矛盾 | 規則 | 印刷工序照八法配價（可 0 元表） | W:成本計算規則.md:41 | 卡：可 0 元表。W：主檔價格一律必填、不設 0 元價格表 |
| project_work_order_qty_color_costing_done.md | 17 | 矛盾 | 規則 | 放損不設獨立計價乘數，經上機張數（含放損）間接進入計價；上機張數維持手填 | W:成本計算規則.md:84；W:log.md:2492 | 卡：上機張數手填。W：P5 張數＝「該工序任務自己的目標數量」；log：生產任務卡已「刪上機張數……四個計價輸入欄」。「間接進入計價」一半有（生產領域資料結構總覽.md:74） |
| project_work_order_qty_color_costing_done.md | 20 | 部分 | 規則 | Mock 體檢：外發放損率 mock 全歸零；WO-2026-0316 局部上光改場內；「未指派供應商擋交付」示範案例拆除（規則仍在） | W:05-entities/派單.md:64 | 規則仍在（「交付產線時要求已指派」）；mock 歸零與改場內未核對 |
| project_work_order_qty_color_costing_done.md | 22 | 抽查 | 待辦 | 待辦：「同交期取送審較早者」次序鍵、「未設放損率視為 0」兩條來源待標註 | P:work-orders/review-queue/page.js:87-88；W:05-entities/工序主檔.md:64 | 送審時間早者在前；預設放損率「建立工序時必填、預設 0」 |
| project_work_order_qty_color_costing_done.md | 24 | 部分 | 待辦 | 既存落差：計價方式七值對八值；project 描述用語不一致 | W:成本計算規則.md:41 | 八法有（工序八法 P1-P8）；七值是舊 spec，已不在工作樹；Linear project 描述屬外部系統，未查證 |
| project_work_order_task_editing_done.md | 2 | 矛盾 | 規則 | 急件選項掛印件（必填、天數快照凍結、EC 購買時設定即等同） | W:05-entities/印件.md:99-100；W:04-business-logic/營運規則/訂單到交付/急件規則/急件對日期的影響.md:28 | 卡：印件層急件選項必填。W：是否急件為是／否；「購買的急件選項」只有線上單有；線下單是否急件不影響任何日期。（疑被 2026-10-27 急件新定義取代） |
| project_work_order_task_editing_done.md | 3 | 矛盾 | 規則 | 訂單「是否急件」降為純注記；印件新增唯讀推導欄「訂單交期（扣除急件）」；工單預計交期承接此欄 | W:…/急件規則/急件對日期的影響.md:28；W:…/急件規則/急件標注的傳遞範圍.md:27；W:05-entities/工單.md:78 | 卡：交期扣減。W：「線下單：是否急件不影響任何日期」；訂單、工單的急件標注一律取自上一層 |
| project_work_order_task_editing_done.md | 4 | 矛盾 | 規則 | 變更通知旗下工單負責印務 | T:888-893（4.6） | 卡：變更時通知。T：改印件預計交期重算並同步非終態工單、改是否急件只留痕，皆不通知 |
| project_work_order_task_editing_done.md | 7 | 矛盾 | 規則 | 放損率唯讀、僅工序任務顯示 | W:05-entities/生產任務.md:104 | 材料規格、工序、裝訂方式三類主檔項目都有預設放損率，三類任務都帶得到值 |
| project_work_order_task_editing_done.md | 8 | 矛盾 | 規則 | 預填只一次、手改不重算上游、不做上下游對照顯示 | W:05-entities/生產任務.md:100 | 卡：預填一次。W：手填，系統不預填、不倒推；（不重算、不比對一半一致：「系統不做上下游比對」） |
| project_work_order_task_editing_done.md | 10 | 部分 | 規則 | 材料任務放損欄＝僅開機損（運轉損已含在預計生產基數） | W:05-entities/生產任務.md:101 | 放損手填、固定開機損只作估算參考；沒有「材料任務放損僅開機損」的明文。搜過：運轉損、材料型 放損 |
| project_work_order_task_editing_done.md | 11 | 部分 | 規則 | 生產任務預計開工日取消自動倒推預填，全面改印務手填 | W:04-business-logic/營運規則/訂單到交付/數量換算規則/數量換算規則.md:87；W:05-entities/生產任務.md:68 | 「由印件預計交期倒推任務日期 → 不做；任務的預計完成日由印務手填」。欄位已是「任務預計完成日」，wiki 無「預計開工日」欄 |
| project_work_order_task_editing_done.md | 12 | 矛盾 | 介面 | 清單改單一平列卡片（取消分段、可交錯）；新增先選類型 | T:1430（7.9）、:1446（7.11） | 卡：平列卡片、先選類型。T 7.9：依印件部位分群的三層表格；7.11：新增生產任務一開就選主檔 |
| project_work_order_task_editing_done.md | 15 | 部分 | 規則 | 匯出版客戶顯示名稱、廠商與放損照紙本保留 | P:work-orders/print/page.js:36、:446；W:08-open-questions/PT-049-工單匯出版式的實務驗證方式.md:22 | 明細有「廠商」欄；版式「比照紙本工作印製傳單」。客戶顯示名稱、放損是否保留沒有明文 |
| project_work_order_task_editing_done.md | 16 | 找不到 | 規則 | R10：內部製作截止日維持不動，生產側以工單預計交期為準 | — | 搜過：內部製作截止日、內部製作截止（W 現行卡零命中，僅 W:08-open-questions/_archives/2026/ORD-044-…）。詞已被「印件內部完成日」取代，無法對應 |
| project_work_order_task_editing_done.md | 17 | 抽查 | 待辦 | 待辦殘留：PT-048、ORD-044、PT-049、PT-047 | W:08-open-questions/PT-048-…md:10；PT-049-…md:8；_archives/2026/ORD-044-…、PT-047-… | PT-048、PT-049 status: open；ORD-044、PT-047 已封存 |
| project_work_order_task_editing_done.md | 18 | 找不到 | 待辦 | main spec 29 處歷史遺留「變更理由」欄待另案清除 | — | 搜過：變更理由（W、工作樹）。OpenSpec 已不在工作樹 |
| project_work_order_visibility_sharing_20260907.md | 1 | 部分 | 規則 | 工單列表：印務只帶「負責人＝自己」或「分享成員含自己」；未分派不列；印務主管與其他角色全部 | P:work-orders/_lib/permissions.js:360-372；T:1790（7.47）；W:07-scenarios/單據分享與職務代理.md:33 | P 有實作；T 7.47：「工單列表不含 WO-2026-0907」；W 只有「移除即時生效……列表不再帶出，詳情仍可開」（只涵蓋分享移除）。W:…/生產單據檢視活動清單.md ACT-VPRD-027 寫印務查閱「全公司工單」，與列表收窄的關係沒說明；wiki 沒有「列表只帶自己的」規則句。搜過：列表只帶、工單列表（P 註解引用的「印務角色卡 § 負責的單據」已不存在） |
| project_work_order_visibility_sharing_20260907.md | 4 | 部分 | 介面 | 停用理由不揭露負責人姓名 | P:work-orders/_lib/permissions.js:503 | 取樣一處（確樣需求）的理由文字不含姓名；其餘停用理由未逐一核對 |
| project_work_order_visibility_sharing_20260907.md | 5 | 矛盾 | 規則 | 列印、生產管理頁代報、指派師傅為角色級不收窄 | W:04-business-logic/服務藍圖/單據存取流程群組/輸出活動清單.md:40-43；W:…/製作與報工活動清單.md:40-41 | 卡：列印不收窄。W：列印工單單據（ACT-OUT-002）限印務「自己負責」與「被分享（編輯）」，另有印務主管、生管重印。代報與指派師傅（ACT-MFG-003/004、ACT-DSP-002/004）範圍為「所屬產線」，與卡一致 |
| project_work_order_visibility_sharing_20260907.md | 6 | 矛盾 | 規則 | 印件列表：印務只列旗下至少一張列表可見工單的印件；展開列與詳情頁籤列全部工單 | P:print-items/_lib/usePrintItemsFilter.js:57-61；W:…/訂單與帳務檢視活動清單.md（ACT-VORD-017） | 卡：收窄。P：不再依旗下有沒有自己負責或被分享的工單收窄，印務看全公司印件；W：印務「全公司」查閱印件 |
| project_work_order_visibility_sharing_20260907.md | 7 | 部分 | 規則 | 分享兩層級（檢視／編輯（代理））；負責人或編輯成員可管理；即時生效不留痕 | W:05-entities/工單.md:75；W:…/分享與職務代理活動清單.md:36-37 | 兩層級、管理者、「新增、改層級、移除即時生效」都有；「不留痕」沒有明文（只有 W:07-scenarios/單據分享與職務代理.md:39「活動紀錄歸屬實際操作者」） |
| project_work_order_visibility_sharing_20260907.md | 9 | 找不到 | 規則 | 原負責人不自動成為分享成員 | — | 搜過：原負責人、自動成為、改派 分享成員（W:05-entities/工單.md、07-scenarios、改派負責人活動清單）。只有「離職交接清空、其餘保留」，沒有這句 |
| project_work_order_visibility_sharing_20260907.md | 11 | 矛盾 | 否決 | 送審／核可／交付操作者留痕本次不加；要完整代理留痕另開 OQ | W:05-entities/工單.md:75；W:07-scenarios/單據分享與職務代理.md:39；W:08-open-questions（無對應 OQ） | 卡：不加。W：編輯（代理）「動作記在成員名下」；判準「活動紀錄歸屬實際操作者本人」。搜過：代理留痕、操作者留痕（08-open-questions 零命中，OQ 未開） |
| project_work_order_visibility_sharing_20260907.md | 12 | 部分 | 待辦 | 既存缺陷另案：訂單 prototype 改派缺理由分類與清空分享；派單頁動作無負責人把關；售後服務單跨訂單列表只認建單者 | T:1281（6.5）；W:08-open-questions/AFT-16-售後服務單可見範圍後端以建立者判定與wiki跟著訂單不一致.md | 訂單改派已有理由分類與清空分享（T 6.5）；售後一項有 AFT-16；「派單頁動作無負責人把關」搜不到。搜過：派單頁、負責人把關 |
