# P8b 重查清單

共 32 列。第一輪明細在同資料夾 `P8.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_quote_to_order_gap_fix.md | 1 | 抽查 | 規則 | 出貨方式在需求單層與印件層都帶入，三處選項統一三值 | wiki/05-entities/訂單.md:74；印件.md:97；需求單.md:78 | 自取／專車配送／第三方物流；由需求單 OP-QR-011 轉訂單帶入 |
| project_quote_to_order_gap_fix.md | 2 | 找不到 | 否決 | 需求單原「整疊／折好」不另處理 | — | 搜過：整疊、折好 |
| project_quote_to_order_gap_fix.md | 4 | 部分 | 規則 | 參考附件轉入訂單其他附件，用途說明「需求單參考附件」，可刪除 | wiki/05-entities/訂單.md:199 | 用途說明取該檔案的參考附件說明，空著時記為「需求單參考附件」（缺：「可刪除」未寫） |
| project_quote_to_order_gap_fix.md | 7 | 矛盾 | 規則 | 業務主管對需求單為部門總覽唯讀（非全公司） | 見缺口清單 | 見缺口清單 |
| project_quote_to_order_gap_fix.md | 9 | 找不到 | 流程 | 起草前先問票數與節數預期 | — | 搜過：票數、節數、預期（skill 全檔） |
| project_work_order_creation_delivery.md | 2 | 部分 | 流程 | 主票切分軸線＝工作範圍；sub 多重歸屬＝主票切太細 | 規範 - Linear 交付.md:37、:42 | 一票一個需求主題；一節裝一個動作（缺：沒有「sub 多重歸屬」判準） |
| project_work_order_creation_delivery.md | 3 | 部分 | 規則 | 審核待辦同交期取送審較早者 | proto/work-orders/review-queue/page.js:88 | 送審時間早者在前（缺：「同交期」條件 wiki、Prototype 皆無） |
| project_work_order_creation_delivery.md | 4 | 部分 | 規則 | ERP 與 EC 同一套計價引擎，全套移植、不接引擎 API | wiki/04-business-logic/營運規則/訂單到交付/成本計算規則/成本計算規則.md:42 | EC 商品成本與工單側成本沿用同一套邏輯（缺：移植、不接 API 屬實作選擇，wiki 無） |
| project_work_order_creation_delivery.md | 5 | 矛盾 | 規則 | 計價快照四分項＝材料費／工序費／裝訂費／設備費 | 見缺口清單 | 見缺口清單 |
| project_work_order_creation_delivery.md | 6 | 矛盾 | 規則 | 折舊攤提與人力時費率只在實際成本側 | 見缺口清單 | 見缺口清單 |
| project_work_order_creation_delivery.md | 9 | 抽查 | 規則 | 翻案後：不設任務層計價輸入欄，張數取自材料型任務目標數量 | 成本計算規則.md:57 | 任務目標數量即備料張；供應商原料張數＝ceil(目標數量 ÷ 開料數) |
| project_work_order_creation_delivery.md | 12 | 矛盾 | 規則 | 前置相依預設帶線性鏈 | 見缺口清單 | 見缺口清單 |
| project_work_order_detail_layout_done.md | 1 | 部分 | 規則 | 完成量＝生產數量÷目標數量（投入口徑一致） | wiki/06-state-machines/生產任務狀態.md:96 | 生產數量累計達目標數量時系統自動判定完成（缺：「完成量」比值算式未寫） |
| project_work_order_detail_layout_done.md | 2 | 找不到 | 規則 | 任務進度＝已完成÷總數，分母排除已作廢 | — | 搜過：任務進度（wiki 工單與生產任務卡；Prototype 摘要現已無此格） |
| project_work_order_detail_layout_done.md | 4 | 找不到 | 規則 | 領用量欄刪除 | — | 搜過：領用量（僅 領域知識/印刷成本結構.md:70 的備料換算，無關） |
| project_work_order_detail_layout_done.md | 8 | 抽查 | 規則 | 報工單一流程：不分場內外發、不分材料／工序／裝訂；外發由印務手填同一表單 | wiki/04-business-logic/服務藍圖/生產流程群組/製作與報工活動清單.md:42 | ACT-MFG-005 在工單上回報旗下任務的製作數量 |
| project_work_order_detail_layout_done.md | 10 | 部分 | 規則 | 無供應商自助管道 | wiki/05-entities/報工紀錄.md:55 | 提交管道：師傅自助／生產管理頁面代報／印務於工單詳情頁（缺：沒有排除句；PT-026 門戶為未結 OQ） |
| project_work_order_detail_layout_done.md | 11 | 部分 | 規則 | 無超量警示與阻擋 | 報工紀錄.md:62-66 | 數量檢核表只列生產數量必填、不得漏填產出（缺：無超量明文） |
| project_work_order_detail_layout_done.md | 14 | 矛盾 | 介面 | 重點卡七格（目標數量／訂單交期／預計交期／預計完工日／實際完工日／任務進度／負責印務），不做日期對比 | 見缺口清單 | 見缺口清單 |
| project_work_order_detail_layout_done.md | 16 | 矛盾 | 介面 | 生產任務表為單一表，印件部位為欄位（不分層） | 見缺口清單 | 見缺口清單 |
| project_work_order_detail_layout_done.md | 17 | 矛盾 | 介面 | 展開層：合併描述表＋「報工內容（n）」Collapse 預設收合 | 見缺口清單 | 見缺口清單 |
| project_work_order_detail_layout_done.md | 21 | 抽查 | 介面 | 印務報工入口：列可複選＋「批次報工（n）」＋列操作「報工」 | ProcessTab.js:551-559、:68 | 批次報工（{selectedReportableFloorTasks.length}） |
| project_work_order_detail_layout_done.md | 23 | 矛盾 | 規則 | 工單新增「印務印件檔案」「檔案備註」兩欄，限負責印務、入口在印件檔案面板 | 見缺口清單 | 見缺口清單 |
| project_work_order_detail_layout_done.md | 30 | 找不到 | 規則 | 生管列印不以異動為前提 | — | 搜過：列印、異動 前提（wiki/05-entities/工單.md:101-104 只講單據內容，未談列印前提） |
| project_work_order_detail_layout_done.md | 32 | 部分 | 規則 | 已裁：計價輸入挑主檔區間列（材料挑面積區間列、裝訂挑台數／頁數階梯列），不填數字 | wiki/05-entities/品項主檔.md:111-113 | 面積區間、格價（缺：「印務挑列、不填數字」未寫） |
| project_work_order_detail_layout_done.md | 33 | 部分 | 規則 | 已裁：貨運單運費關稅記派單側委外成本，不進生產任務四分項 | wiki/05-entities/貨運單.md:22；計價快照.md:62 | 運費與關稅按重量佔比攤到各筆貨（缺：「不進生產任務」未寫） |
| project_work_order_detail_layout_done.md | 34 | 找不到 | 待辦 | 待辦：材料型報工良品口徑；存量任務 needs_transfer 回標；報工管道值域 spec 5 種 vs wiki 4 種 | — | 搜過：良品口徑、needs_transfer、管道值域（wiki 報工紀錄.md:55 為三種）；工作資料夾無追蹤 |
| project_work_order_detail_layout_done.md | 36 | 找不到 | 待辦 | 待辦：共用元件缺口（StatCards 副值插槽與值元素不斷行、RadioButtonGroup 無 disabled、UploadFileItem 無唯讀） | — | 搜過：.scratch 無追蹤；Prototype WorkOrderSummary.js:94 以區域樣式暫解 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 1 | 抽查 | 待辦 | 待辦：Prototype 缺產線欄 | proto/work-orders/_components/detail/TaskFormDialog.js:128-130 | 產線：這筆任務歸哪一條產線，場內與外發一律必填（已落地） |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 2 | 找不到 | 待辦 | 待辦：MOCK-DATA-CHAIN 鏈五（兩筆／15,205）與 mock（四筆／18,972）不一致 | — | 仍不一致：proto/MOCK-DATA-CHAIN.md:539「已填兩筆…15,205」對 proto/work-orders/_lib/mock-data.js:161「四筆任務皆已填」；搜過：.scratch、memory/erp 無追蹤 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 3 | 找不到 | 待辦 | 待辦：WO-2026-0901 材料放損率 3% 對主檔 2.5% | — | proto/work-orders/_lib/mock-data.js:1500 仍用 3%；主檔 2.5% 未查到；無追蹤 |
| project_work_order_linear_delivery_prototype_standard_20261005.md | 4 | 部分 | 待辦 | 待辦：面積類單位 wiki「件」對 Prototype「才」 | wiki/05-entities/品項主檔.md:76 | 單位…（如張、個、才、本）（缺：未見「件」與「才」的裁決紀錄） |
