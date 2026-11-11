# P8a 重查清單

共 31 列。第一輪明細在同資料夾 `P8.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_invoice_view_drawer_done.md | 4 | 部分 | 規則 | 「奇數月 14 日」是 ezPay 平台操作時限、不是法規 | wiki/04-business-logic/營運規則/帳務/付款發票邏輯/發票開錯與交易變動的處置.md:37 | 是否已申報與平台的作業時限由 ezPay 判斷（缺：沒寫「奇數月 14 日」也沒寫它非法規） |
| project_invoice_view_drawer_done.md | 5 | 部分 | 規則 | 欄位基準＝帳務卡發票欄位表；排除「開立方式」「後續處理狀態」 | wiki/05-entities/帳務.md:60-90 | 發票欄位表未列這兩欄（缺：沒有明文排除句；「發票開立方式」只在需求單.md:77、廠客.md:91） |
| project_invoice_view_drawer_done.md | 10 | 抽查 | 介面 | 發票主表兩欄：折讓衍生＋剩餘可折讓 | proto/…/billing/InvoiceSection.js:233-243 | title: '折讓衍生（含稅）'、'剩餘可折讓（含稅）' |
| project_invoice_view_drawer_done.md | 18 | 抽查 | 規則 | 成交條件「鎖定」限對客承諾基準，與完成前可直接調價不衝突 | wiki/07-scenarios/訂單成立確認.md:37；wiki/04-business-logic/營運規則/訂單到交付/明細時點分界/訂單進終態前明細可直接增減.md:25 | 收款條件備註自此鎖定，金額明細不因核可而鎖 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 8 | 抽查 | 規則 | 點收填實際量、搬運不填；差額留明細 | wiki/05-entities/轉交單.md:40、:44 | 負責廠務只執行搬運與回報…也不填量；差額留在明細上看得見 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 14 | 部分 | 否決 | 第二輪否決：取消凍結、結案、補點收、代補點收、數量異常標記、貨已在現場、多收、處理中 | wiki/07-scenarios/場內轉交與修正.md:95 | 短少不另設結案、凍結量或數量異常標記（缺：代補點收、貨已在現場、處理中無否決句；轉交單.md:86 反而有「多於時的處置」） |
| project_order_workorder_wiki_iteration_grill_20261004.md | 17 | 矛盾 | 規則 | 已送達的轉交單不可作廢 | 見缺口清單 | 見缺口清單 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 19 | 矛盾 | 規則 | 訂單維護只有業務與業務主管 | 見缺口清單 | 見缺口清單 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 20 | 部分 | 規則 | 業務主管不看交期 | wiki/06-state-machines/訂單狀態.md:43 | 審核看的項目列舉不含交期（缺：沒有「不看交期」明文；送審條件:187 要印件預計交期） |
| project_order_workorder_wiki_iteration_grill_20261004.md | 21 | 抽查 | 規則 | 零件訂單由業務手動完成 | wiki/07-scenarios/訂單成立確認.md:55；wiki/04-business-logic/服務藍圖/出貨與交付流程群組/訂單完成活動清單.md:32 | 沒有任何印件的訂單…手動推進到「訂單完成」；ACT-DONE-001 業務、諮詢 自己負責 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 29 | 抽查 | 介面 | 點收佇列與轉交單管理子母表；點收後列留著可修改 | proto/production-floor/transfers/page.js:84；receiving/page.js:28 | 子母表（Miles 2026-10-06 拍板）：母層一列一張單，子層列明細 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 30 | 部分 | 規則 | 生產管理單元依兩範圍權限拆分；權限名稱（管理○○共 8、排程工廠總覽檢視 2、檢視生產管理（全公司））；印務七站全選、生管依線、師傅負責 | wiki/07-scenarios/生產管理單元可見範圍.md 主流程表 | 所屬產線看他的所屬產線，自己負責看負責欄位；印務六條產線加品檢線全選（缺：權限碼名稱與數量 wiki 無；Prototype receiving/page.js:28 有「管理點收佇列（產線）」） |
| project_order_workorder_wiki_iteration_grill_20261004.md | 31 | 部分 | 規則／介面 | 工作包可取消、指派師傅唯讀推導、派工頁列全部任務 | wiki/05-entities/工作包.md:35-36、:45 | 取消工作包即刪除…；指派師傅建立後不可改（缺：「派工頁列全部任務」未找到） |
| project_order_workorder_wiki_iteration_grill_20261004.md | 37 | 找不到 | 否決 | 否決：備註確認對話 | — | 搜過：確認對話、備註確認 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 39 | 找不到 | 否決 | 否決：此刻制轉交狀態 | — | 搜過：此刻制、轉交狀態（wiki 為依數量推導，卡的「此刻制」意思不明，列給 Miles） |
| project_order_workorder_wiki_iteration_grill_20261004.md | 41 | 抽查 | 待辦 | 待辦：收款項目狀態拆開發票／收款兩卡；應收總額 0 時預計金額可填 0 | wiki/06-state-machines/收款項目開發票狀態.md、收款項目收款狀態.md；wiki/05-entities/帳務.md:147 | 應收總額為 0 時可填 0，本欄不設下限 |
| project_order_workorder_wiki_iteration_grill_20261004.md | 42 | 找不到 | 待辦 | 待辦：審核業務主管寫入時點兩卡說法；資料結構總覽待稽核；OpenSpec 九份規格；歷程頁籤是否另開 FE 票；erp 分支推送 | — | 搜過：.scratch/ 與 memory/erp/ 無對應追蹤（多為舊 project 與舊 OpenSpec，疑已過期） |
| project_payment_worklists_delivery.md | 7 | 抽查 | 介面 | 待開發票依預計開發票日排序 | proto/payment/_lib/derive.js:67 | 排序：依預計開發票日，空值排最後 |
| project_payment_worklists_delivery.md | 9 | 矛盾 | 規則 | 待開發票另加「訂單未取消」限定 | 見缺口清單 | 見缺口清單 |
| project_payment_worklists_delivery.md | 16 | 部分 | 規則 | 待開發票與帳務異常沿用訂單可見範圍（持「檢視全部訂單」看全公司；否則審核業務主管、被分享、持「檢視訂單」加自己負責） | wiki/04-business-logic/服務藍圖/單據存取流程群組/訂單與帳務檢視活動清單.md:73-78、:95-100 | 活動表以角色＋範圍（自己負責／被分享／全公司）表達（缺：權限碼名稱、審核業務主管範圍） |
| project_payment_worklists_delivery.md | 17 | 矛盾 | 規則 | 應收款項維持獨立權限碼「檢視應收款項」，不依使用者過濾 | 見缺口清單 | 見缺口清單 |
| project_payment_worklists_delivery.md | 18 | 部分 | 規則 | 匯出：應收＝逐張發票明細十五欄；待退款對齊會計 Excel 三列表頭二十四欄；權限需同時持檢視訂單與檢視全部訂單 | proto/payment/refund-payout/page.js:62 | 匯出版面對齊會計既有 Excel 表（三列表頭、六區塊、二十四欄）（缺：應收十五欄、權限條件 wiki 與 Prototype 皆無） |
| project_payment_worklists_delivery.md | 20 | 抽查 | 流程 | 規則家在訂單功能節；款項四票與 project 皆不寫，Task 票直接引規則名 | skill/references/規範 - Linear 交付.md:54 | 沿用規則不寫 |
| project_payment_worklists_delivery.md | 21 | 部分 | 流程 | 稽核者用 Opus、草稿用 Sonnet | AGENTS 模型分工表 | 子代理：實作、wiki 修正、稽核＝Opus high；查找、摘錄＝Sonnet（缺：「草稿」未列） |
| project_quote_item_drawer_regroup_20260923.md | 5 | 矛盾 | 規則 | 需求單可填日期欄改名「印件內部完成日」，唯讀只留印件預計交期 | 見缺口清單 | 見缺口清單 |
| project_quote_item_drawer_regroup_20260923.md | 8 | 抽查 | 否決 | 不採用：出貨方式八值 | wiki/05-entities/需求單.md:78 | 自取／專車配送／第三方物流 |
| project_quote_item_drawer_regroup_20260923.md | 9 | 找不到 | 否決 | 不採用：免審稿原因、評估備註 | — | 搜過：免審稿原因、免審稿說明、評估備註 |
| project_quote_item_drawer_regroup_20260923.md | 10 | 部分 | 否決 | 不採用：業務改填預計交期 | wiki/05-entities/需求單.md:112 | 印件預計交期…選填、逐列填寫（缺：無否決句；現行正本是業務逐列填寫，與範例「業務改填」是否同義無法判斷） |
| project_quote_item_drawer_regroup_20260923.md | 11 | 部分 | 介面 | 印務版附件用一般連結列檔名（共用上傳元件無唯讀模式） | proto/quote-prototype/detail/page.js:829-836 | 列表欄有檔名連結（缺：側板唯讀版附件未見，:1744 起只有可編輯上傳） |
| project_quote_linear_delivery_prototype_standard_20261004.md | 2 | 矛盾 | 流程 | Feature 票頭權限表三欄「權限名稱、動作、範圍」；範圍四詞「全公司、自己負責、被指派、被分享」 | 見缺口清單 | 見缺口清單 |
| project_quote_linear_delivery_prototype_standard_20261004.md | 7 | 找不到 | 待辦 | 外發派單延後 | — | 搜過：外發派單（.scratch、skill、docs、wiki 皆無） |
