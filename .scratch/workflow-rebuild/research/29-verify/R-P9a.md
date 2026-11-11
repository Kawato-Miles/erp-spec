# R-P9a 重查結果

## 統計

| 重查原因 | 列數 | 各結論的列數 |
|---|---|---|
| 矛盾 | 6 | 家較新 6 |
| 找不到 | 10 | 仍缺 8、家較新 1、已有家 1 |
| 部分 | 9 | 仍缺 3、已有家 5、家較新 1 |
| 抽查 | 2 | 同義 2 |
| 合計 | 27 | 家較新 8、仍缺 11、已有家 6、同義 2、記憶卡較新 0 |

仍缺 11 列的分類：商業規則 1、否決 3、流程環境 2、紀錄或待辦 5。

## 明細

| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家（路徑:行號） | 原文句 | 說明 |
|---|---|---|---|---|---|---|---|---|---|
| project_mes_production_stage_planning.md | 3 | 矛盾 | 家較新 | — | 2026-07-28 | 2026-09-16 提交 `工單成本口徑收斂落卡 17 張——計價快照改任務小計與各顏色費用`（git log -S 該說法首次出現）；MEMORY.md 索引「工單成本呈現收斂（2026-09-16 結案）」同寫計價快照改任務小計加五筆顏色費用 | memory/Sens_wiki/wiki/erp/05-entities/計價快照.md:43 | 各組成在此合為一數、不各自列欄 | 兩句講同一件事（計價快照凍結什麼）。記憶卡的金額四分項是 07-28 版本，08-18 曾改凍引擎四分項，09-16 再改為任務小計加顏色費用逐色凍結，家是最新。「不凍參數組」仍成立，家只凍金額。 |
| project_mes_production_stage_planning.md | 4 | 找不到 | 仍缺 | 否決 | 2026-07-28 | — | memory/Sens_wiki/wiki/erp/05-entities/計價快照.md:34 | — | 重搜在製品、成品庫存、成本差異、成品帳。成本差異部分：計價快照.md:34 寫「預估與實際的並排對照是衍生內容，不建獨立實體」，算有家。成品庫存部分：實體卡已封存到 05-entities/_archives/成品庫存.md，內文「目前沒有庫存管理，等庫存管理規劃時再處理」（2026-11-06），是延後而非否決。在製品：只有參考模型卡提到業界做法，沒有本系統不建的明文。缺的是「在製品不建」這半句。 |
| project_mes_production_stage_planning.md | 6 | 矛盾 | 家較新 | — | 2026-07-28 | 2026-09-03 提交 `生產任務標準化第六輪落卡（刪工時與稼動率…）`，時間稼動率自此從指標移除；2026-09-20 利潤率取代毛利率（MEMORY.md 索引「利潤率改名＋印件口徑」） | memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md:117 | 報工不收實際工時，設備主檔也不維護班內工時，分子分母都沒有事實來源，本輪不做。 | 同一件事（本系統的指標清單），家少了時間稼動率、多了漏單率與工單準時。OEE 三率留掛點這半句家也有（同卡 :117「一併留掛點」）。記憶卡是 07-28 舊結論。 |
| project_mes_production_stage_planning.md | 7 | 部分 | 仍缺 | 紀錄或待辦 | 2026-07-28 | 倒推預填這半句已被翻案：2026-09-03 提交寫「不做自動排程與需求量計算」（數量換算規則 :87「自動排程與由印件預計交期倒推任務日期 → 不做」、生產任務.md:68「手填，系統不預填」） | memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組.md:74 | — | 兩半句分開判。「手動排」已有家（印務.md:38「系統不代為排程」）。「唯一系統預填是交期倒推」是家較新（家明寫不倒推）。仍缺的只剩「三視角負荷可視化」：產線視角有一句（產線.md:37），另兩個視角沒有定義，單據存取流程群組.md:74 寫「排程與工廠總覽…尚未規劃」，屬未來功能待規劃，不是現行商業規則。 |
| project_mes_production_stage_planning.md | 8 | 找不到 | 家較新 | — | 2026-07-28 | 2026-09-03 提交 `生產任務標準化第六輪落卡（…任務狀態五值…）` 首次出現「不映射到」；2026-10-06 提交 977bb80 再收斂 | memory/Sens_wiki/wiki/erp/05-entities/生產任務.md:223 | 外部進程不映射到本任務 | 記憶卡說外發在途自動映射，家明寫外部進程由派單狀態追蹤、不映射到生產任務（規則卡「外包以派單與貨運單承載」同）。方向相反，家較新，記憶卡的做法已被取代，不算缺口。 |
| project_mes_production_stage_planning.md | 10 | 找不到 | 仍缺 | 否決 | 2026-07-28 | — | memory/Sens_wiki/wiki/erp/01-products/ERP與MES建置專案.md:23 | — | 重搜 Phase、分期、完整系統邊界、相依性排。wiki 只有專案層的 Phase 1 到 3，沒有「生產階段設計不做 Phase 切分」。屬否決型，wiki 正文本來不寫；且專案層現已有 Phase，這條很可能已失效。 |
| project_mes_production_stage_planning.md | 11 | 找不到 | 仍缺 | 流程環境 | 2026-07-28 | — | AGENTS.md:56 | — | 重搜序列協作、過度設計、直接與 Miles 對齊。AGENTS.md、skill、規範檔都沒寫。只有 wiki 變更紀錄（changelog.md）有舊的序列協作紀錄，是歷史。AGENTS.md「停下與繼續」已涵蓋「不需 Miles 決策就繼續做」，與本條精神接近但不是同一句。 |
| project_mock_chain4_urgent_multipart.md | 2 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-09-04 | — | — | — | 重搜倒車、八家外發、暫緩、倒車入庫。只有 raw 卡「公司實際印務用工單範例」有倒車入庫專輯 PDF，沒有「Prototype 暫緩不做」的紀錄。屬待辦。 |
| project_mock_chain4_urgent_multipart.md | 4 | 抽查 | 同義 | — | 2026-09-04 | — | (prototype)/MOCK-DATA-CHAIN.md:343 | 不存急件欄。頁面以 `isUrgentPrintItemNo(orders, print_item_no)` 回讀印件的是否急件 | 兩句同義：工單、任務、工作包、報工不新增急件欄，標籤回讀印件是否急件。差異只在記憶卡寫「凍結快照」，家 :27 已改為「不存任何天數快照」、即時推算，不影響本條結論。 |
| project_mock_chain4_urgent_multipart.md | 7 | 矛盾 | 家較新 | — | 2026-09-04 | erp repo 2026-10-06 提交 8e6d5ef5（目的站點與產線改產線標籤值域）首次出現「不另設設備站點」；09-04 的鏈四提交 3480b3dc 才有摺紙與精裝站點 | (prototype)/MOCK-DATA-CHAIN.md:390 | 鏈四轉交單目的地取裝訂產線的後加工站（見「產線與站點」） | 同一件事（鏈四是否新增站點）。10-06 站點改為產線底下的值域後，家改成不另設站點，記憶卡的「站點加摺紙與精裝」已失效。 |
| project_mock_chain4_urgent_multipart.md | 12 | 部分 | 仍缺 | 商業規則 | 2026-09-04 | — | memory/Sens_wiki/wiki/erp/05-entities/印件.md:97 | — | 已有家的三塊：出貨方式三值（需求單.md:78）、單頭與印件層各自一欄（:78、:112）、聯絡人單選（需求單.md:59）。仍缺兩塊：（一）轉訂單時印件層優先、印件空白才退回單頭的取值順序，家只寫「由需求單轉訂單自印件項目帶入」與「新增印件空白時取訂單的出貨方式」，沒寫轉訂單的退回；（二）建需求單時窗口聯絡人依客戶預設帶主要窗口，廠客.md:77 有「主要窗口」標記，但沒有任何卡寫建單預設帶它。Q-022 開放問題也沒涵蓋。 |
| project_mock_chain4_urgent_multipart.md | 13 | 找不到 | 仍缺 | 流程環境 | 2026-09-04 | — | (prototype)/MOCK-DATA-CHAIN.md:1 | — | 重搜過時、示意數字、不得保留、殘留。MOCK-DATA-CHAIN.md、AGENTS.md、erp-prototype-tests/README.md、erp 的 skill 均無。屬代理維護 mock 文件的做法。 |
| project_production_management_linear_20261005.md | 1 | 部分 | 仍缺 | 紀錄或待辦 | 2026-10-05 | — | memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/生產流程群組/工單產生與分派活動清單.md:24 | — | 業務面已有家（活動清單：把每張工單交給一位印務，屬工單產生與分派）。缺的是「Linear 上這件事放哪個 project」的歸屬，只在 Linear 與已刪的草稿目錄，linear-delivery 的 blocked-cases-log.md 只記評分過程。 |
| project_production_management_linear_20261005.md | 3 | 矛盾 | 家較新 | — | 2026-10-05 | 2026-10-06 grill 拍板紀錄（T9）與提交 977bb80 `生產段分派、報工、轉交正流程收斂落卡`；wiki 變更紀錄寫「工序相依性規則 刪前置受影響整條」 | memory/erp/production-dispatch-report-transfer-20261006/grill-decisions.md:63 | 刪除「前置受影響」整條規則；每筆任務只標示自己的狀況 | 記憶卡說前置受影響警示列留後續批次，隔天 grill 決定整條規則刪除。家較新，記憶卡的待辦已作廢。 |
| project_production_management_linear_20261005.md | 4 | 矛盾 | 家較新 | — | 2026-10-05 | 2026-10-14 提交 80c8a84 `第 63～65 題落卡（…印務主管隨時可改目的站點與產線…）`；MEMORY.md 索引「生產與出貨介面修正…2026-10-12～14」 | memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/生產流程群組/製程規劃活動清單.md:51 | 協助指定生產任務的目的站點與產線 | 同一件事（印務主管改站點與產線的時機與範圍）。記憶卡限製程審核完成或其後、製程確認中只限負責人與分享編輯；家為全公司範圍、任務作廢或報廢前皆可改（印務主管.md:43「隨時可協助改」）。家較新。 |
| project_production_management_linear_20261005.md | 5 | 部分 | 已有家 | — | 2026-10-05 | — | memory/Sens_wiki/wiki/erp/06-state-machines/工單狀態.md:120 | 製程確認中：審核尚未開始 | 條件相同（主管尚未開始審核才能收回），只是字面不同。用語統一是 Linear 票文的寫法，wiki 的狀態機卡已有同義句。 |
| project_production_management_linear_20261005.md | 7 | 找不到 | 已有家 | — | 2026-10-05 | — | memory/Sens_wiki/wiki/erp/05-entities/轉交單.md:48 | Slack 表單做不到逐條上傳簽收照片時，改在系統端上傳。 | 記憶卡的「可行性待查」已被 wiki 以備案句承接：做不到就改系統端上傳（簽收照片欄見轉交單.md:85）。查證本身是系統外作業，不再有商業缺口。 |
| project_production_management_linear_20261005.md | 8 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-10-05 | — | erp-prototype-tests/docs/scenario-catalog.md:2657 | — | 重搜歷程頁籤、歷程 Tab、FE sub-issue。情境目錄 10.43 有工單詳情的「歷程」頁籤測試，但沒有「是否另開前端子票」的紀錄。屬 Linear 待辦。 |
| project_prompt_audit_grill_20260923.md | 3 | 矛盾 | 家較新 | — | 2026-09-23 | 2026-10-12 提交 ecf46fa `Linear 交付規範 v6.0…審查改依嚴重度分類並加盲測`（git log -S 該停止條件首次出現）；MEMORY.md 索引「Linear 三層格式改版 grill 拍板（2026-10-12）」 | .claude/skills/linear-delivery/references/規範 - Linear 交付.md:308 | 前兩類問題筆數合計連 2 輪沒有減少，就停下回報 Miles | 同一件事（何時停止評分循環）。記憶卡以總分判停，家改以問題筆數判停；10 輪安全上限（:309）一致。家較新。 |
| project_prompt_audit_grill_20260923.md | 4 | 部分 | 已有家 | — | 2026-09-23 | — | AGENTS.md:56 | 子代理：實作、wiki 修正、稽核 \| Opus high | 此表格列把稽核者定為 Opus high，涵蓋「模型 opus 加 effort high」。plan-auditor.md 寫 model: opus，但 effort 未寫在檔內，由 AGENTS.md 指定。erp-precheck-audit 已不存在，不需承接。 |
| project_prompt_audit_grill_20260923.md | 6 | 抽查 | 同義 | — | 2026-09-23 | — | /Users/b-f-03-029/.claude/CLAUDE.md:35 | 回答使用該領域的精確術語；使用者用語不精確時，在答案中改用正確術語並附一句對照 | 同義：答案中改用精確術語，家多一句附對照。 |
| project_prompt_audit_grill_20260923.md | 7 | 找不到 | 仍缺 | 否決 | 2026-09-23 | — | — | — | 重搜 superpowers：wiki、規範檔、AGENTS.md 都沒有。環境現況與記憶卡不一致：settings.json 有 `superpowers@claude-plugins-official: false`（停用），但 installed_plugins.json 仍有安裝紀錄，並未刪除。屬環境設定，記憶卡移走後無處可查。 |
| project_prompt_audit_grill_20260923.md | 9 | 部分 | 家較新 | — | 2026-09-23 | 2026-10-12 提交 ecf46fa（範例改凍結快照取材 PM-1215，收錄範圍表首次出現「PM-1215 的後端票與前端票」）；MEMORY.md 索引同日 grill | .claude/skills/linear-delivery/references/範例 - Linear 交付.md:22 | PM-1215 的後端票與前端票 | 記憶卡 09-23 限三項（project、一張 Feature、一張 Task）。10-12 改版後收錄範圍為 project 描述、milestone、一張 Feature、後端票加前端票，家較新，三項限制已失效。 |
| project_prototype_ui_consistency_fix_20260907.md | 1 | 部分 | 已有家 | — | 2026-09-07 | — | (prototype)/work-orders/_components/detail/InfoHint.js:7 | 說明文字的統一載體：說明句不佔版面，改掛在小標右側的提示圖示上，滑鼠移上才顯示。 | 介面規則的家是 Prototype，此元件與註解即承載。使用處有 InfoHint（工單詳情三處）與 TooltipLabel（派單詳情等）。「一律」的全模組範圍沒有條文，僅靠元件實作；若要對新頁面也生效，需靠 prototype-from-prompt 在實作時沿用。 |
| project_prototype_ui_consistency_fix_20260907.md | 2 | 部分 | 已有家 | — | 2026-09-07 | — | (prototype)/orders/production-detail-queue/page.js:182 | 操作欄走圖示鈕（沿用工單詳情頁生產任務表的拼法：MaterialIcon ＋ 無字按鈕 ＋ Tooltip | Prototype 多處註解與實作都是圖示鈕加提示（工單詳情 ProcessTab、工作包管理、需求單詳情、發票入口、出貨列）。對話框底部用文字鈕是刻意區分（useShipmentActions.js:311）。ui-business-rules.md 第 8 節仍寫行內可用 Text/Link，與此條不同，但該檔日期 2026-04-19 較舊。 |
| project_prototype_ui_consistency_fix_20260907.md | 3 | 部分 | 已有家 | — | 2026-09-07 | — | (prototype)/recipes/print-items/detail/page.js:261 | 標頭：元件與尺寸對齊正式訂單詳情頁（(dashboard)/order/detail 的 OrderDetailHeader） | 八個詳情頁的標頭同一拼法（arrow_back 無字鈕、Title level 4，見 work-orders/detail/page.js:952、print-items/detail/page.js:440）。Prototype 註解已寫基準是 OrderDetailHeader。 |
| project_prototype_ui_consistency_fix_20260907.md | 5 | 找不到 | 仍缺 | 紀錄或待辦 | 2026-09-07 | — | — | — | 重搜 DetailPageHeader、TooltipLabel、#999。erp repo 的 packages/shared/components/common/TooltipLabel.js:10 仍寫死 `#999`，也沒有 DetailPageHeader。待辦仍成立，但屬前端待辦，不在 Sens 工作資料夾。 |
