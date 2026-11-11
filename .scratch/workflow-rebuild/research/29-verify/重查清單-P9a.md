# P9a 重查清單

共 27 列。第一輪明細在同資料夾 `P9.md`（路徑縮寫表在該檔開頭）。


| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |
|---|---|---|---|---|---|---|
| project_mes_production_stage_planning.md | 3 | 矛盾 | 規則 | 計價快照簡化為金額四分項（材料／工時／設備／外包），不凍參數組 | W05-entities/計價快照.md:43、:44-46 | 家：「任務小計（不含顏色）…各組成在此合為一數、不各自列欄」＋顏色費用單黑／CMYK／Pantone 逐色凍結。卡：「金額四分項（材料／工時／設備／外包）」 |
| project_mes_production_stage_planning.md | 4 | 找不到 | 否決 | 成本差異、在製品、成品庫存不建 | — | 搜過：在製品、成品庫存、成本差異、庫存、不建。只在 W11-review-knowledge/參考模型/生產執行.md:32 有「在製品」，屬參考做法，不是本系統決定 |
| project_mes_production_stage_planning.md | 6 | 矛盾 | 規則 | 五指標：折損率、良率、時間稼動率、成本達成率、毛利率（OEE 三率留掛點） | W04-business-logic/領域知識/生產績效指標.md:34 | 家：「本輪納入下列指標：折損率、良率、成本達成率、利潤率、漏單率、工單準時」（無時間稼動率、無毛利率）。卡：五指標含時間稼動率、毛利率 |
| project_mes_production_stage_planning.md | 7 | 部分 | 規則 | 排程＝手動排＋三視角負荷可視化；唯一系統預填是交期倒推建議日期 | W03-roles/印務.md:38；W05-entities/產線.md:37；W04-business-logic/服務藍圖/單據存取流程群組.md:74 | 「系統不代為排程」；「產線視角以產線標籤分組彙總負荷」；「排程與工廠總覽…尚未規劃」。缺：三視角定義、交期倒推預填。搜過：三視角、倒推、手動排、工廠總覽 |
| project_mes_production_stage_planning.md | 8 | 找不到 | 規則 | 外發在途改由派單自動映射 | — | 搜過：外發在途、外發、在途 |
| project_mes_production_stage_planning.md | 10 | 找不到 | 否決 | 不做 Phase 切分，先定完整系統邊界 | — | 搜過：Phase、不做、切分。W01-products/ERP與MES建置專案.md:23、:46、:66 現有 Phase 1～3（專案層，非生產階段設計層），不判矛盾 |
| project_mes_production_stage_planning.md | 11 | 找不到 | 流程 | 工作方式：主對話直接與 Miles 對齊、不跑序列協作 | — | 搜過：序列協作、過度設計、`S`AGENTS.md「停下與繼續」「模型分工」。AGENTS.md 未寫此條 |
| project_mock_chain4_urgent_multipart.md | 2 | 找不到 | 待辦 | 倒車入庫（八家外發廠商）暫緩，未做 | — | 搜過：倒車、暫緩、八家外發 |
| project_mock_chain4_urgent_multipart.md | 4 | 抽查 | 規則 | 急件標籤讀印件是否急件，工單、任務、工作包、報工不新增欄位 | P MOCK-DATA-CHAIN.md:343 | 「不存急件欄。頁面以 isUrgentPrintItemNo(orders, print_item_no) 回讀印件的是否急件」（卡的「凍結快照」說法已被 :27 的「不存任何天數快照」取代） |
| project_mock_chain4_urgent_multipart.md | 7 | 矛盾 | 規則 | 站點新增摺紙與精裝 | P MOCK-DATA-CHAIN.md:390 | 家：「站點 TRANSFER_DESTINATIONS｜（不另設設備站點）」。卡：「站點加摺紙與精裝」 |
| project_mock_chain4_urgent_multipart.md | 12 | 部分 | 規則 | 需求單出貨方式三值對齊後端、單頭與印件層獨立、轉訂單印件優先退回單頭、聯絡人依客戶帶出預設主要窗口 | W05-entities/需求單.md:78、:112、:59；W05-entities/印件.md:97 | 「自取／專車配送／第三方物流」；「包裝備註：包裝方式補充說明」；「窗口聯絡人…單選（同客戶下的聯絡人）」。缺：優先退回單頭的條件、預設主要窗口 |
| project_mock_chain4_urgent_multipart.md | 13 | 找不到 | 流程 | 主鏈文件不得保留過時數字（sub-agent 會誤讀示意數字去「修」mock） | — | 搜過：過時、示意數字、不得保留；P MOCK-DATA-CHAIN.md、`S`AGENTS.md 均無 |
| project_production_management_linear_20261005.md | 1 | 部分 | 流程 | 印務的分派歸工單管理（Linear project 歸屬） | W04-business-logic/服務藍圖/生產流程群組/工單產生與分派活動清單.md:24 | 「把每張工單交給一位印務」。缺：Linear 上歸哪個 project 的歸屬紀錄（Linear 為正本，未讀） |
| project_production_management_linear_20261005.md | 3 | 矛盾 | 待辦 | 前置受影響警示列後續批次 | `S`memory/erp/production-dispatch-report-transfer-20261006/grill-decisions.md:63、:191 | 家：「刪除『前置受影響』整條規則」；「前置受影響（含人工標記延遲）｜拿掉（T9）」。卡：「前置受影響警示列後續批次」 |
| project_production_management_linear_20261005.md | 4 | 矛盾 | 規則 | 印務主管以全公司範圍改站點與產線，限製程審核完成或其後；製程確認中只有自己負責或被分享編輯可改 | W03-roles/印務主管.md:43；W05-entities/生產任務.md:190 | 家：「隨時可協助改目的站點與產線」；「任務轉『已作廢』『報廢』前皆可改」。卡：製程確認中限自己負責或被分享編輯 |
| project_production_management_linear_20261005.md | 5 | 部分 | 規則 | 收回用語統一為「主管尚未開始審核」 | W06-state-machines/工單狀態.md:120 | 「製程確認中：審核尚未開始」。用語與卡不同，條件相同 |
| project_production_management_linear_20261005.md | 7 | 找不到 | 待辦 | Slack 表單逐條照片可行性待查 | — | 搜過：逐條照片、Slack 表單；`S`.scratch、`S`memory/erp 只命中無關檔 |
| project_production_management_linear_20261005.md | 8 | 找不到 | 待辦 | 工單詳情歷程頁籤是否另開 FE sub-issue | — | 搜過：歷程頁籤、工單詳情歷程 |
| project_prompt_audit_grill_20260923.md | 3 | 矛盾 | 流程 | 停止條件：總分連 2 輪沒上升就停；10 輪安全上限 | 同上:308、:309 | 家：「前兩類問題筆數合計連 2 輪沒有減少，就停下回報 Miles」（以問題筆數判斷）；「10 輪」一致。卡：「總分連 2 輪沒上升」 |
| project_prompt_audit_grill_20260923.md | 4 | 部分 | 流程 | 稽核流程模型寫死 opus＋effort high | `S`.claude/agents/plan-auditor.md:4-8 | 「model: opus」；「模型暫定 opus，待 D8 量測結果決定」。缺：effort high；erp-precheck-audit 已不存在 |
| project_prompt_audit_grill_20260923.md | 6 | 抽查 | 流程 | 全域 CLAUDE.md 重述問題改為答案中用精確術語 | `/Users/b-f-03-029/.claude/CLAUDE.md` § 回覆規範 | 「回答使用該領域的精確術語；使用者用語不精確時，在答案中改用正確術語」 |
| project_prompt_audit_grill_20260923.md | 7 | 找不到 | 否決 | superpowers 14 個全刪，需要時再安裝 | — | 搜過：superpowers（`S` 下 md 與 json）。現行技能清單無 superpowers，但沒有明文 |
| project_prompt_audit_grill_20260923.md | 9 | 部分 | 流程 | 範例只收 project 描述、一張 Feature 票、一張 Task 票 | `S`.claude/skills/linear-delivery/references/範例 - Linear 交付.md:30、:73、:132、:144、:327 | 範例另含「狀態機」「Milestone」兩節。缺：「只收三項」的限制 |
| project_prototype_ui_consistency_fix_20260907.md | 1 | 部分 | 介面 | 欄位提示一律用標籤旁 Hint 圖示，不渲染成欄位下方文字 | P work-orders/_components/detail/InfoHint.js；`S`memory/shared/ui-wording.md:18 | 實作有 InfoHint；ui-wording 只規定「新增任何說明文字…須先經 Miles 同意」。缺：「一律標籤旁圖示」的規則句 |
| project_prototype_ui_consistency_fix_20260907.md | 2 | 部分 | 介面 | 所有列表操作欄一律 icon 鈕＋Tooltip，不用文字鈕 | P qc-shipping/_components/useShipmentActions.js:311 | 「列上為純圖示鈕」（僅出貨一處註解）。`S`memory/shared/ui-business-rules.md 沒有此規則。缺：全模組通則 |
| project_prototype_ui_consistency_fix_20260907.md | 3 | 部分 | 介面 | 詳情頁標頭以正式頁 OrderDetailHeader 為基準（arrow_back、Title 4、AppButton） | P work-orders/detail/page.js:952；P print-items/detail/page.js:440 | 多頁都用 arrow_back 圖示鈕；無規則句。搜過：OrderDetailHeader、DetailPageHeader |
| project_prototype_ui_consistency_fix_20260907.md | 5 | 找不到 | 待辦 | 待前端：抽通用 DetailPageHeader 進 packages/shared；TooltipLabel 的 #999 改吃 token | — | 搜過：DetailPageHeader、TooltipLabel、#999（Prototype 內）；屬前端待辦，不在 Sens 工作資料夾 |
