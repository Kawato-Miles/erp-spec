---
type: meta
status: active
last-reviewed: 2026-06-02
---

# Sens 知識庫操作史

**全知識庫唯一只追加層**（ERP 舊 changelog 已於 2026-06-10 凍結封存）。每次動 `wiki/` 後記一筆，最新在上（新筆置於本說明列下方、既有條目最上方）；既有條目只增、不改、不刪。
格式：`## [YYYY-MM-DD HH:MM] <動作>(<標籤>) | <一句話簡述>`，動作 = 納入 / 查詢 / 健檢 / 同步；標籤 = ingest-A/B/C、amend、audit、pre-check、insight、daily、weekly、oq、misjudgement。
下記三行：「變更」（MUST 逐卡 `[[卡名]]` + 一句話，禁粗寫）、「動機」（實質異動正本卡必填，業務理由當下自足，得連 [[OQ卡]]；健檢 / 納入類免）、「衝突」。
完整規約見 `.claude/rules/sens-wiki.md` § 四。卡的歷史 = 搜 `[[卡名]]` 命中本檔條目 + git 歷史；決策脈絡見 OQ 卡。

---

## [2026-06-10 22:08] 納入(amend) | 需求單／諮詢單卡依範本 v3 清理：BRD 自足
- 變更：[[需求單狀態]] 刪正文三處實作規格引用＋「狀態轉換」文字流程圖段＋「來源」段，範圍外段首補「成交轉訂單資料帶入明細」防腦補點名；[[諮詢單狀態]] 刪正文三處實作規格引用＋文字流程圖段＋來源段，範圍外段首補「轉需求單／建諮詢訂單資料帶入明細」點名，另刪兩處「v2」內部版本代號（第一讀者不懂的內部用語，改「刻意不設」）。
- 動機：範本 v3 BRD 自足鐵則的存量清理（與 [[訂單狀態]] 同輪）；兩卡正文經驗證零實作引用，行數 98／83 皆低於粗標。
- 衝突：無。
- 變更：[[訂單狀態]] 依範本 v3 清理——正文四處實作規格引用全刪（狀態列舉引言、UML 圖前說明、轉換表內與表下注的歸納優先序指引）；「狀態轉換」文字流程圖段整段移除（mermaid 圖＋轉換表雙表徵）；「來源」段整段移除（正確性由 frontmatter source 承載）；範圍外段首補「歸納細則點名」（系統會自動歸納為業務承諾、詳細優先序屬實作規格勿自行發明——防實作腦補防護欄）；回簽時間條件改商業措辭（以首次回簽為準，成交時點認定）。
- 動機：範本 v3 定案 BRD 自足鐵則（第一讀者為不參與開發的 PM，正文不得依賴讀不到的實作文件）；訂單卡為 v3 驗證輪首卡。14 維度自審通過；正文 218 行經歸位檢查無可外移項（18 狀態三來路五段落的真實複雜度），不建議拆卡。
- 衝突：無。
- 變更：[[index|總目錄]] 新增「Wiki 憲章」章節（本質與第一讀者／五讀者情境表／紙本測試＋商業語言兩判準／BRD 自足與「範圍外＝防護欄」兩鐵則／單元定位模式四題——新增任何層級或範本前必讀，各單元範本直接引用不重述）；`_template-state-machine.md` § 〇瘦身（通用原則改引總目錄憲章，只留狀態機特定定位：狀態詞彙正本＋單據處境投影、與 04 及藍圖的分工、判準應用與投影混淆陷阱、伺候的讀者情境）。
- 動機：Miles 指示——wiki 本質調研成果上移總入口，讓後續單元範本（情境／使用者故事／驗收項目）與新主題（編輯器 BRD）直接引用，避免重新調研或重蹈覆轍；每次擴充 wiki 先有統一的 BRD 認知。
- 衝突：無。與 `.claude/rules/sens-wiki.md` 分工已在憲章開頭明示（憲章管內容原則、rules 管操作與格式）。

## [2026-06-10 22:50] 健檢 | 總目錄位階修正：操作史上移為知識庫基石檔
- 變更：[[index|總目錄]] 新增「知識庫基石檔（跨主題）」段並把 [[log]] 自 ERP 主題段上移至此；ERP 段治理規則行恢復只列主題專屬三卡。
- 衝突：無。Miles 指正：log 服務全知識庫而非單一主題，掛在 ERP 段下屬位階錯置。

## [2026-06-10 22:30] 納入(amend) | 收斂雙層 log 為單一操作史＋發布狀態撤出 wiki
- 變更：[[log]] 升為全知識庫唯一只追加層（檔首格式擴充：HH:MM＋次級標籤＋動機行）；[[changelog]] 原地凍結封存（status: archived＋停更宣告，內容原樣保留）；[[wiki-schema]] § 四加「frontmatter 禁含外部系統狀態欄位」鐵則＋§ 九加對應 Anti-Pattern、刪三處 notion 欄位範例；[[erp_index]] changelog 列改標凍結；[[index|總目錄]] 治理規則行改指 [[log]]；27 張正本卡（05 實體 ×11、06 狀態機 ×12、07 情境 ×1、13 US ×3）刪「迭代脈絡見 [[changelog]]」尾行；6 張範本（_template-entity / _template-role / _template-scenario / _template-state-machine / _template-test-case / 13 US _template）迭代史措辭改「歷史見 wiki/log.md 與 git」並刪 notion 欄位；[[訂單異動狀態]] 關聯行改新反查寫法；[[TC-ORD-001-補收免審直達已執行驗收]] 刪 business-logic-changelog 死引用；30 張卡的 notion-published-at / notion-page-url 現值遷入 `memory/erp/notion-publish-manifest.md`（新建，發布管線唯一狀態正本）後自卡刪除。
- 動機：Miles 拍板——雙層 log 同一異動記兩筆且卡片索引覆蓋率不到一成（承諾已破產）；發布狀態是管線家務不是商業知識，wiki 須獨立維護不與外部系統耦合；卡的迭代脈絡由「搜 [[卡名]] 命中本檔條目＋git 歷史」取代手工索引，決策脈絡歸 OQ 卡（BRD 層自足，OpenSpec 為下游不得作動機來源）。設計全文：`docs/superpowers/specs/2026-06-10-wiki-log-consolidation-design.md`。
- 衝突：無。配套同步（vault 外）：7 個 vault 治理 skill＋3 個發布 skill＋CLAUDE.md 路由表＋sens-wiki.md § 四改寫；vault-audit 新增維度 16「log 條目完整性」。

## [2026-06-10 21:03] 納入(amend) | 狀態機範本 v3：定位宣言＋BRD 自足全局重寫
- 變更：`_template-state-machine.md` 全局重寫——新增 § 〇定位宣言（wiki＝公司商業記憶、第一讀者＝不做 ERP 的 PM；狀態機卡＝狀態詞彙正本＋商業邏輯在單據處境維度的投影；內容判準＝紙本測試、表達判準＝商業語言；範圍外＝防實作腦補的防護欄，易腦補主題須點名「存在但不在本卡」）；產出格式收斂七段（刪文字流程圖表徵、刪正文來源段、正文零實作規格引用）；每節附目的句、每條 MUST 附理由；六步流程加每步產出欄；擴張準則改「過長→先歸位→仍長才評估拆卡」；稽核維度重編 14 項（新增 BRD 自足、範圍外防護）；UML 記法規約吸收 Miles 的複合狀態邊界取消轉換寫法。
- 動機：Miles 指示以 wiki 本質全局重思後拍板四裁決——BRD 必須自足（第一讀者讀不到實作文件）、刪文字流程圖保精簡可維護、讀者定義取代優先序排解、動機歸屬以商業語言為界；範本「照抄無理由」問題以每規則附理由根治（默會知識顯性化，源自 Human SOP 轉 agentic workflow 方法論）。
- 衝突：無。三張已寫卡（[[訂單狀態]]／[[需求單狀態]]／[[諮詢單狀態]]）尚未依 v3 清理（正文 OpenSpec 引用、來源段、文字流程圖段），下輪走查處理。

## [2026-06-10] 健檢 | 諮詢→需求單→訂單端到端比對：敘事層矛盾修正＋範本加維度 13
- 變更：[[訂單狀態]] 概述改條列式來路框架（修「三條前段路徑」歷史殘影、來路開放措辭）；order-management spec 兩處主文條列化（補需求單流失情境、Scenario 零變動）；[[訂單]] 實體卡三處來路措辭開放化；`_template-state-machine.md` 加前提確認「建立來路」問句＋撰寫 MUST「敘事不越界」＋稽核維度 13（經回測命中已知陽性＋盲測 13 卡零誤報驗證）。
- 衝突：規則層四條端到端鏈無矛盾；敘事層三矛盾（前段框架／兩種 vs 三種情境／訂單類型值域三處不一致）前二已修，第三項（客製單、一般 vs 線下正名）待 Miles 裁決。

## [2026-06-10] 同步 | 諮詢單卡走查：「已轉需求單」終態定格拍板＋三 spec 13 處同步
- 變更：[[諮詢單狀態]] 依新範本重寫（已轉需求單改終態定格、狀態承載商業出口分類、mermaid UML 段、module 中文化）；同步修 consultation-request spec 7 處、order-management spec 3 處、quote-request spec 2 處、[[諮詢收尾規則]]、[[需求單狀態]]。
- 衝突：spec 既有措辭矛盾（「已轉需求單」同檔既標終態、又有流失時更新為完成諮詢的規則）經 Miles 以方案三裁決——定格為真終態、刪流失回寫；統計推演（10 樣本五統計）佐證後拍板；無遺留。

## [2026-06-10] 同步 | 狀態機層重構：範本重寫＋訂單／需求單卡走查（含 OpenSpec 雙向同步）
- 變更：重寫 `_template-state-machine.md`（同構 04 範式＋mermaid UML 圖規約）、[[訂單狀態]]（補轉換圖表＋修過時語意＋打樣視角差）、[[需求單狀態]]（3 矛盾經 Miles 裁決後重寫＋補諮詢來源流失連動）；新增 [[QR-001-雙欄計價具體規則]]、[[QR-002-報價有效期限與議價規則]]（自 [[報價邏輯]] 遷出）；[[wiki-schema]] module enum 中文化；[[線下訂單流程]]／[[打樣流程]] 打樣段釐清；同步修 order-management spec 5 處、quote-request spec 2 處。
- 衝突：需求單卡與 spec 的 3 處矛盾（重評起點／流失出口範圍／逾期未回覆機制）經 Miles 裁決收斂；無遺留。

## [2026-06-09] 同步 | business-processes spec 商業規則回補 wiki（17 項）
- 變更：補充既有卡 7 項——[[訂單異動規則]]（+2 段：異動單只管金額售後走售後單 / 金額有無變動決定走哪條流程 + 2 例子）、[[付款發票邏輯]]（+3 段：§五C 發票異動三情境 / §五D 處理中款項不開折讓 / §五E 請款核銷四步流程）、[[對帳一致性]]（+2 段：期次規劃 invariant / 訂單應收三層構成）、[[發票法規硬約束-ezPay-MIG]]（+跨齊報稅期業務引導規則）。新建卡 5 張——[[報價印件填寫原則]] / [[供應商報價規則]] / [[諮詢收尾規則]] / [[售後服務規則]]。併入既有卡 2 項——[[印件生產流程]]（+§零 單據層級結構 / +§七B 分批出貨累計控制）。確認已有 3 項（QC 數量限制 / 入庫出貨規則 / 預計生產數量下限已在 [[印件生產流程]] §四/§五/§七）。更新 [[erp_index]] registry。
- 衝突：無

## [2026-06-03] 同步 | 訂單發布迭代 Phase 2：推送 Notion User Story DB（訂單 27 筆 + 回填追蹤）
- 變更：依 [[iteration-delta-publish]] 流程推送訂單 user story 至 Notion User Story DB——新增 17 筆（US-ORD-020~036）、更新 9 筆（001-007/011/012）、retag 1 筆（US-ORD-009：原 Notion 誤掛 US-ORD-005 的「全公司訂單查看」殼 retag 為 009，解重複編碼）；US-ORD-013 緩推（待 [[ORD-034-退款執行改業務後US-ORD-013卡結構|ORD-034]] retitle）。29 張卡（含 008/010 aligned）回填 notion-published-at/notion-page-url。推送前經 senior-pm notion-publish-rubric 兩輪評審（擋下並修正：007 inline 待開 OQ、036 UI 措辭、030/031/028 中英夾雜、013 緩推、005/009 重複殼處理）。
- 衝突：無（005/009 重複編碼經 retag 解決，驗證後 Notion 端 001~012 各一筆）。

## [2026-06-03] 同步 | 訂單發布迭代 Phase 1/5：補 US-ORD-036 + 建迭代發布 SOP/Rubric + 固化發布 skill
- 變更：補建 [[US-ORD-036-業務主管改派訂單負責業務]]（覆蓋缺口 add-sales-manager-reassign-owner）；新增 [[iteration-delta-publish]] SOP（只反映 archived change / 算 delta 只更新受影響項 / 強制回填追蹤）+ Notion 發布 Rubric（`.claude/skills/erp-user-story/references/notion-publish-rubric.md`，移植 linear-delivery /goal+Rubric）；固化 skill：erp-user-story mode B 加 change-driven delta（B1）+ senior-pm 評審閘門（B2.5）+ 強制回填（B5）、sync-workflow 新增流程 1-C、linear-delivery Step 1 加 archived-only 邊界 + 中台/業務平台 project 分流、CLAUDE.md 路由表加「對外發布/迭代同步」row。
- 衝突：無。

## [2026-06-03] 同步 | 訂單發布迭代 Phase 0：訂單 user story 卡對齊 5/22-6/02 archived spec + 開 5 OQ
- 變更：對齊 22 張訂單 user story 卡（US-ORD-001~007/009/011~013/020~022/024/026~027/029~032/035）至最新 archived change（訂單收退款模型重構 收退款 / unify-billing 期次 / relax 編輯時機 / 諮詢取消收斂 / 列表篩選），block-level 改寫 + 更新 last-reviewed + 校對紀錄；7 張確認 aligned（008/010/023/025/028/033/034）；US-ORD-013 退款執行角色依拍板改業務（會計→業務）；新增 [[ORD-032-訂單複製帳務公司直接複製或重新推導]]、[[ORD-033-兩條退款路徑關係與main-spec舊序列收斂]]、[[ORD-034-退款執行改業務後US-ORD-013卡結構]]、[[ORD-035-Payment缺完整DataModel實體表]]、[[ORD-036-訂單異動流程卡完成後加收路徑錨點待確認]]；US-ORD-007/013/026 回填 related-oq。
- 衝突：US-ORD-013 改 role 後檔名仍「會計執行退款處理」、與 US-ORD-011 職責重疊 → 開 ORD-034 待 retitle/合併；main spec § 訂單取消流程舊退款序列未對齊訂單收退款模型重構 → 開 ORD-033。

## [2026-06-02] 健檢 | 商業邏輯／狀態機卡範本過時舉例清理（訂單收退款模型重構 淘汰機制殘留）
- 變更：[[_template-business-logic]] §不變條件 與 [[_template-state-machine]] §轉換條件與觸發事件 兩處示範舉例，由訂單收退款模型重構 已淘汰的「退款已執行＝對應款項累計達金額」舊機制，改為結構恆定的中性例子（工單↔生產任務狀態聚合：「工單為已完成→其下所有生產任務皆為已完成」／「對應生產任務全部完成」）；教學意圖（可驗算 invariant 格式／系統自動推進判斷依據）不變。
- 理由：範本舉例綁定單一 change 的已淘汰設計會誤導照抄者、且讓本體殘留失效機制影子；改用非金流認列、最不易被 change 推翻的狀態聚合示範以根治再過時。當前正本見 [[訂單異動規則]] §退款已執行認列。
- 衝突：無。

## [2026-06-02] 同步 | 訂單收退款模型重構 收退款 change 後 wiki 商業邏輯卡對齊（task 7.2）
- 變更：收斂 [[訂單異動規則]]（退款「已執行」改主管核可即生效、移除累計達標／取消款項回退機制、退款物理錨點改對帳應退差額核銷、新增「訂單完成後金額異動路徑分流」與「款項紀錄直接建退款」兩規則、鐵則改脫鉤版＋新增第 5 條、例子 2-6 改寫＋補例子 9/10、implemented-by 與來源指向訂單收退款模型重構 change delta）；新增 [[明細時點分界]]（雙終態為明細鎖定分界，階段一直接增減／階段二走善後路徑）；business-logic-changelog 補兩卡 section。
- 衝突：無。OpenSpec 主 spec 仍含舊「累計達金額才已執行」線號（change 未 archive，訂單收退款模型重構 delta 待合回）；wiki 商業意義已為脫鉤版，來源以 change delta 路徑引、archive 後合回主 spec。

## [2026-06-01] 同步 | align- task 3.x 補發票情境（I7 / I10）
- 變更：[[payment-invoice-scenarios]] §8 補 I7「跨齊報稅期作廢失敗→引導折讓」明確錯誤訊息流程（cross-ref OpenSpec 發票作廢與折讓 UI 與規則）；新增 §9「多品項發票進位尾差核銷」(I10)，業務情境 + 規則指向 OpenSpec 發票金額誤差核銷規則（不複述驗算數字，避免雙正本）。
- 衝突：無。align- 文件任務（§1-5）至此全部完成；剩 §6 Prototype（須本機環境）+ BI-19/ORD-028（留待以後 change）。

## [2026-06-01] 同步 | align- archive 後 wiki 回補 + doc-audit
- 變更：[[訂單狀態]] 卡補「線下前段插入審核通過把關」營運動機（含 ORD-027 訂單額外費用凍結點前移、連 [[ORD-027-訂單額外費用凍結時點與審核通過成交鎖定對齊]]）、last-reviewed 更新；spec-registry 訂單管理 v1.18→v1.19、售後 v0.7→v0.8。
- doc-audit：4 main spec delta 合併驗證無誤、Data Model 無漏合；ADDED 殘留（廢止 stub vs 分階段稽核）歸 BI-19 收斂；索引層 3 個 ⚠️（impeccable-usage / notion-mcp-guidelines / principles 未列 CLAUDE.md）為 pre-existing 與本 change 無關、未處理。
- 衝突：BI-19 / ORD-028 兩欄位重疊維持 open（Miles 決定留待以後 change）。

## [2026-06-01] 健檢 | align- archive 合併後驗收發現兩處欄位重疊
- 變更：開 [[BI-19-付款計畫變更稽核與既有BillingInstallment變更追蹤重疊]]（high）+ [[ORD-028-印件shipment_quantity與既有pi_shipped_qty欄位重疊]]（medium）。
- 衝突：align- 新增的 change_count/original_expected_date 與 [[BI-1-原始日期基準凍結時點]] 已解的 BillingInstallment.changeCount 重疊（疑用統一前舊命名重造輪子）；shipment_quantity 與既有 pi_shipped_qty 重疊。兩者已合併進 main spec，待 Miles 裁決收斂方向。

## [2026-06-01] 健檢 | vault-audit 維度 15 加標題錨點 Info 檢查
- 變更：[[wiki-schema]] § 六維度 15 新增「提示（Info）條件」= implemented-by/source 含 `#Requirement:` 標題錨點；vault-audit SKILL 補維度 15（部分）可執行 grep（git 範圍限定本輪異動卡、Info 級不阻擋）。
- 理由：承接同日「不綁標題錨點」規約，給自動把關（不靠記性），且只提示本輪異動卡、不掃既有存量。
- 衝突：無。

## [2026-06-01] 同步 | 撰寫規約：implemented-by 不綁 Requirement 標題錨點
- 變更：[[wiki-schema]] § 4.0（implemented-by 定義 + 新增「不用標題錨點寫關聯」規則 + 7 處範本範例去錨點）、[[wiki-architecture]]（前進標準 + 過渡期修法措辭）、5 張範本（_template-test-case / _template-role / _template / _template-scenario / _template-business-logic）範例值去 `#Requirement: <標題>` 改為 spec 檔層。
- 理由：OpenSpec Requirement 標題會改名（縮寫中文化等），標題錨點一改即斷鏈、反過來卡住改名（ORD-027 教訓）。關聯改指 spec 檔層級，Requirement 名稱只當文字描述。
- 範圍：僅規約 + 範本（前瞻）。既有已寫標題錨點的卡 Miles 指示先留著、不回頭批量改。
- 衝突：無。

## [2026-06-01] 同步 | ORD-027 解（方案 A）+ 縮寫 OEC/OA 中文化
- 變更：[[ORD-027-訂單額外費用凍結時點與審核通過成交鎖定對齊]] 標 resolved（Miles 採方案 A，訂單額外費用凍結點前移至審核通過），檔名由 ORD-027-OEC… 改為 ORD-027-訂單額外費用…（去縮寫）；align-business-consultation-coverage-gaps change（order-management / state-machines delta + proposal + tasks）內縮寫 OEC→訂單額外費用、OA→訂單異動全數中文化（Miles：縮寫日後看不懂）。
- 保留不動：資料模型物件式 OrderExtraCharge(...) / OrderAdjustment(...)（與 Data Model 一致）、MODIFIED Requirement 標題（archive sync 對應鍵）、跨檔 Requirement 名稱引用「諮詢取消退費 OA 系統建已核可」。
- 衝突：發現 main spec Requirement 標題「諮詢取消退費 OA 系統建已核可」仍含 OA 縮寫，且被 [[訂單異動規則]] / [[訂單異動狀態]] frontmatter source 錨點引用——全域改名屬另案，未在本 change 處理。

## [2026-06-01] 同步 | wiki↔OpenSpec 分工契約收斂 CLAUDE.md 單一處 + 17 卡單一正本化 + CLAUDE.md 去胖
- 變更：分工契約只在 root `CLAUDE.md` 宣告一次（新增 § wiki 與 OpenSpec 分工），[[wiki-architecture]] / [[vault-charter]] / `.claude/rules/sens-wiki.md` 三處重述改單行指向；9 實體卡（需求單 / 訂單 / 印件 / 工單 / 生產任務 / 任務 / 諮詢單 / 售後服務 砍與 OpenSpec § Data Model 重複欄位表、留業務 WHY + implemented-by；出貨單僅修死引用不砍）+ 8 狀態卡（訂單 / 工單 / 生產任務 / 印件 / 諮詢單 / 需求單 / 任務 砍狀態列舉留轉換動機；分期請款補 implemented-by）單一正本化；諮詢單修 stale 諮詢費 1000→2000；`CLAUDE.md` 去胖 555→444（Spec 規格檔清單 → `memory/erp/spec-registry.md`、ERP/共用資源/工具/Prototype 進度 → `memory/shared/resource-index.md`、術語 hot-cache 砍剩指標、行為規則措辭原樣）；標籤矛盾「（正本）」→「（實作規格正本，相對 Notion 發布版）」；`openspec/config.yaml` main spec 數 7→23。commits 04e295c / 6893bf9 / 965f246。
- 衝突：無。另案待辦：出貨單（OpenSpec 無 Data Model）見 [[SHP-006-出貨模組spec待建立]]；QC 實體 / 狀態卡（QCRecord 廢止併入生產任務 + NCR）退役策展見 [[QC-002-QC兩張wiki卡退役或保留]]；`index → erp_index` 改名飛行中，故 index / log 排序未動。

## [2026-06-01] 納入 | user-story 單階段化 + test-case 內移對齊
- 變更：[[erp-user-story]] skill 收斂兩階段→單階段（移除 UI 操作易變層 / stage / ui-binding），成功條件改 Gherkin 框架（含正向達成型 + 禁止/守衛型）；[[erp-test-case]] skill 重寫對齊 5/31 索引卡架構（source↑user-story + Notion 正文 + 三模式）；58 張 user-story 卡批次移除 stage/UI 段、H2 改「業務情境」；16 張真實 UI 內容抽存 [[_migration-ui-from-userstory]]；wiki-schema（§一/四 type=user-story/維度13/§十一）、[[_template]]、15-test-cases [[README]] 同步；CLAUDE.md 路由表 + 載入表補 test-case Vault 正本 row。
- 衝突：[[2026-05-30-test-case-內移vault-skill稽核]] 原建議「正文內移 vault」與 Miles 5/31 定案「正文留 Notion、Vault 只索引」不同，已標 resolved 並註明差異（A-7 憲法句不翻轉）。

## [2026-05-31] 健檢 | ERP 入口層收斂單一 index + 退役競爭舊 README + 補連修 22 孤兒
- 變更：退役 ERP 主題同層競爭舊入口 `00-meta/README.md`（SSOT 反模式，外部 backlink=0），獨有內容遷入 [[vault-charter]] §七（人類首次閱讀順序）/ §八（工具），「不在此 Vault」表確認與 vault-charter §六 重複故直接刪；ERP 入口 [[erp_index|indexx]] §三 高量層改連各層 README / 子索引（MOC：08-OQ / 13-US / 14-reviews / 11-review-knowledge 4 個 README + 4 個 10-references *-index + 6 個 09-canvases）；[[wiki/erp/08-open-questions/README|OQ 索引]] 補登 13 張孤兒 OQ；root `CLAUDE.md` 商業層查詢改走 ERP 入口 index（由「載入決策表」router）+ 補正 `01-products/erp/`→`01-products/` stale 路徑。orphans 49→27、unresolved 168→168（零新增壞鏈）。
- 衝突：無。另案待辦：glossary-graphic-editor 仍留 ERP 02-domain（Miles 只搬 product-vision，圖編術語去留待決）、同名卡（QC / README ×11 / _template）根治（alias vs 改名，開 OQ）、US 17 孤兒建模組 MOC、root index「圖編 cavans→canvas / 待建」待 canvas 主題入口建立後更新。

## [2026-05-31] 同步 | 圖編移出 ERP 成獨立 canvas 主題 + ERP 願景目錄扁平化路徑補正
- 變更：圖編願景卡移至 [[wiki/編輯器/product-vision]]（脫離 ERP 成獨立主題），總目錄入口改連、ERP registry 移除該行；ERP 願景扁平化（`01-products/erp/*` → `01-products/*`）後補正 9 檔共 15 處路徑；主題名 cavans → canvas 統一（index / log / `.claude/rules`）。
- 衝突：無。

## [2026-05-31] 同步 | 操作模式上移 .claude/rules + ERP_Vault→Sens_wiki 路徑遷移補完
- 變更：知識庫操作模式由 `memory/Sens_wiki/CLAUDE.md` 上移為 `.claude/rules/sens-wiki.md`（path-scoped `memory/Sens_wiki/**`、啟動可靠載入、進版控），原子檔已刪；全 repo 活躍檔（root CLAUDE.md + 17 `.claude` + 13 wiki 卡 + 5 活躍 spec + shared）的 `ERP_Vault→Sens_wiki` 路徑依三層分類修正（L1 raw/assets→vault 根、L2 通用掃描→`wiki/`、L3 erp 內容→`wiki/erp/`）。
- 衝突：無（歷史 archive 61 檔與概念名「ERP_Vault / Vault」未動，屬刻意排除，見根 CLAUDE.md 計畫 § H）。

## [2026-05-31] 同步 | 建立 Sens_wiki 操作框架與雙主題結構
- 變更：新增根目錄操作模式 CLAUDE.md（已於同日上移為 `.claude/rules/sens-wiki.md`，見同日「操作模式上移」entry）；初始化本操作史與 [[index|總目錄]]；確立雙主題（ERP / 圖編 canvas）並列、共用 `raw/` 與 `assets/`；ERP 既有 16 層內容卡沿用、未動。
- 衝突：無。

## [2026-06-03] 同步 | doc-audit 對齊訂單收退款模型重構（archive sync 殘留清理）
- 變更：更新 [[發票法規硬約束-ezPay-MIG]] 連帶矩陣兩行（OA 已執行 / Payment 退款 → 訂單收退款模型重構 核可即生效、不綁累計推進）；新增 OQ [[ORD-037-諮詢取消退費OA累計推進是否被收退款重構核可即生效取代]]
- 衝突：諮詢取消退費 OA 累計推進（converge 5/30 / CR-5 拍板）與訂單收退款模型重構 核可即生效（6/02）跨 change 語意衝突，已開 ORD-037（related ORD-033 / CR-5 / ORD-003）待 Miles 拍板

## [2026-06-10] 納入 | 訂單狀態卡新增 UML 狀態機圖（Mermaid 內嵌）
- 變更：更新 [[訂單狀態]]（新增「狀態機圖（UML）」段，stateDiagram-v2：初始點＋建立分流 choice＋五段複合狀態＋歸納分流 choice＋雙終態；取消因 mermaid 引擎缺陷改逐段邊界拉線）
- 衝突：無