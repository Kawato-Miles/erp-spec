---
name: linear-delivery
description: >
  把已定案的規格交付到 Linear（巢狀：project 薄目錄 + milestone 需求主題 + Feature 票 + Task 票，四層 WBS 嚴格去重），依自包含標準模板（v5.0）產出，交付前以 Rubric 評分稽核（執行者與評審分離、合格 10 / 10）才發布。對開發而言 Linear 為交付正本、wiki 為欄位與狀態正本、Prototype 為介面與互動正本；OpenSpec 為 PM 內部工作版本不外露。
  觸發：Miles 說「交付到 Linear」「發布給開發」「把 X 模組交付給開發」「調整 Linear 上的 project / issue」「依評分稽核交付文件」。
  不適用：Vault 整體健康稽核（用 vault-audit）、規劃前 know-how 稽核（用 erp-planning-pre-check）。
  強制規則（7 條 anti-pattern 禁令）與 Rubric 流程見本文與 references/。
---

# Linear 交付與評分稽核（linear-delivery）

## 定位

把**已定案的規格**交付到 Linear，讓開發團隊拿到可動工的需求；交付前用 Rubric 評分把關品質。

- **正本邊界**：對開發而言，**Linear 為交付正本（內容自包含）＋ wiki 為欄位與狀態正本（開發團隊直接查閱實體卡與狀態機卡，交付不複寫）＋ Prototype 為介面與互動正本（操作動線與版型以 Prototype 為準，交付不文字重述、不附 Prototype 參照格；為準／不為準邊界正本在 CLAUDE.md 分工宣告，交付不另附邊界表）**；Notion 已停用為 BRD。OpenSpec spec 是 PM 內部工作版本，交付內容 MUST NOT 外露 `openspec/...` 路徑。
- **方法論來源**：Gary Chen《/goal 功能怎麼用》影片 —— 「實作者 + 評審」雙角色 + 提示詞 5 元素 + Rubric 6 步驟。對齊 CLAUDE.md karpathy § 4「Goal-Driven Execution」與 `erp-planning-pre-check` 的「執行者 / 稽核者分離」。

### 與其他 skill 分工

| 對象 | skill |
|------|-------|
| 交付到 **Linear**（project + issue）+ 評分把關 | 本 skill |
| Vault 整體健康稽核 | `vault-audit` |
| 規劃前 know-how 稽核 | `erp-planning-pre-check` |

---

## 交付任務的 /goal 結構（5 元素）

每次交付前，先把任務寫成這 5 元素（讓產出可被評審稽核、未達標可迭代）：

| 元素 | 本 skill 的填法 |
|------|----------------|
| **Outcome（最終成果）** | Linear project 薄目錄（功能票清單）+ milestone（需求主題）+ Feature 票（使用者故事＋商業邏輯＋驗收條件，一票一功能、規則帶短名）+ Task 票（職能實作契約＋驗收，不複寫商業規則）+ 狀態機 UML + 結構件（測試決策章／Label 三軸／票段落齊備／Task 掛對 parent）齊備，且 Rubric 符合性評分達**合格分數 10 / 10**（由與實作者分離的評分 sub-agent 判定，非實作者自判）|
| **Verification（驗證方式）** | 由評分 sub-agent 跑 `references/rubric.md` 5 維度符合性評分（每維度 0-2 分，合格 = 10 分且 D4 = 2）；逐條對照「絕對不要」禁令清單 |
| **Constraint（限制條件）** | 只改本次交付的 project 描述與指定 issue 描述；**既有票絕對不動** estimate / assignee / cycle / priority / milestone / labels（新開票另計——新票 MUST 設 milestone 與 Label 三軸）；不外露 OpenSpec 路徑 |
| **Iteration Policy（迭代策略）** | 修完 MUST 重新評審（餵完整草稿、不暗示改動）；每輪記錄第 N 輪改了什麼 / 哪些維度未過 / 下一步；達標才停、硬上限 3 輪、卡住停下問 Miles |
| **Error Handling（錯誤處理）** | 規格來源未定義某邏輯（無法不捏造）→ 停下來觸發 `oq-manage` mode B 記 OQ + 交付文件標「另案處理」，並回報 Miles 卡點，不硬編 |

### /goal prompt 範例（每次交付前複製套用）

> 每次交付前，把任務複製成下方 /goal、替換 `<...>` 占位，作為本次交付的 Goal 宣告，據此跑 Step 1-6。確保每次「完工標準 / 驗證 / 限制 / 迭代 / 錯誤處理」一致。風格對齊 dispatch-prompt-template（標準 + 具體範例）。

**通用模板（複製改占位即用）**：

```text
# /goal：交付「<模組名>」到 Linear（project <project-id>）

## Outcome（完工標準）
<模組> 的 project 描述（模組層 What）+ milestone（需求主題）+ Feature 票（一票一功能，含使用者故事、商業邏輯、驗收條件）+ Task 票（How 層，含行為要求、驗收測試、Blocked by）齊備〔狀態密集模組另含每個狀態機 UML〕，且 references/rubric.md 5 維度符合性評分（D1 正本邊界 / D2 分層顆粒度 / D3 完整性 / D4 真實性 / D5 交付結構完整性）達合格分數 10 / 10。實作者不得自判完成。

## Verification（驗證方式）
由評分 sub-agent 跑 references/rubric.md：逐維度給 2 / 1 / 0 分 + evidence-anchored（引用草稿具體位置）+ 違反禁令 + 修正方向。合格 = 10 分，D4 真實性一票否決（必為 2）。

## Constraint（限制條件）
- 交付內容自包含、跨單據只以 Linear 識別碼互指；MUST NOT 外露 openspec 路徑、內部檔名或 PM 內部術語
- 依 references/delivery-template.md 自包含模板產出；MUST NOT 抓單一既有 issue 當對照
- save_project 帶 state:<交付前原狀態> 防 Kick off；覆寫既有票時 save_issue 只傳 id + description，保留 estimate / assignee / cycle / priority / milestone / labels；新開票 MUST 設 milestone 與 Label 三軸
- 視圖層模組（複用中台）沿用中台狀態機、不另繪

## Iteration Policy（迭代策略）
評分未達 10 分 → 修正 → MUST 重新評分（餵完整修正後草稿、不暗示改了什麼）→ 直到 10 / 10。每輪記「第 N 輪改了什麼 / 哪維度失分 / 下一步」。

## Error Handling（錯誤處理）
- 規格來源未定義（無法不捏造）→ 記 oq-manage mode B + 交付文件標「另案處理」（不扣分）
- 連 2 輪同維度未滿分 / 滿 3 輪未達 10 分 → 停下回報 Miles（已試什麼 / 卡哪 / 需要什麼），不放水 / 不降標 / 不表面改字騙過關

在符合性評分達 10 / 10 之前，持續迭代不要停；卡住則停下與 Miles 討論。
```

**已填示範：業務平台 - 訂單管理（2026-06-01 第一個真實案例）**：

```text
# /goal：交付「業務平台 - 訂單管理」到 Linear（project af83dbd3）

## Outcome（完工標準）
業務平台 - 訂單管理的 project 描述（模組層 What）+ FE-259（訂單列表與詳情）/ BE-168（訂單 API）/ FE-258（售後頁）/ BE-167（售後 API）四個 Task issue 齊備；業務平台為視圖層、沿用中台訂單管理狀態機不另繪；經評分 sub-agent 判 references/rubric.md 4 維度全「通過」。實作者不得自判完成。

## Verification（驗證方式）
由評分 sub-agent 跑 references/rubric.md：逐維度給通過 / 部分 / 未通過 + evidence-anchored（實際 Read sales-platform / order-management / after-sales-ticket spec 查證每條規則來源）+ 違反禁令 + 修正方向。D4 真實性一票否決。

## Constraint（限制條件）
- 交付內容自包含、跨單據只以 Linear 識別碼互指；不外露 openspec 路徑（案發當時規則為 Notion / Linear 雙正本，2026-07-06 起 Notion 停用為 BRD）
- 依 references/delivery-template.md 自包含模板產出；不抓單一既有 issue 當對照
- save_project 帶 state: Planned（業務平台交付前原狀態）防 Kick off；save_issue 只傳 id + description，保留 assignee（Yana / Eric）/ estimate / cycle 等
- 業務平台為視圖層，沿用中台訂單 / 印件 / 售後服務單狀態機、不另繪

## Iteration Policy（迭代策略）
評審未通過 → 修正 → 重新跑評分 sub-agent 評審（餵完整修正後草稿、不暗示改了什麼）→ 直到 4 維度全通過。
（實跑紀錄）第 1 輪 senior-pm 判 D1 通過 / D2 部分 / D3 部分 / D4 通過：FE-258 漏 next action 第四組「待建關聯動作」、摘要卡 3 張 vs next action 欄 4 值顆粒度混淆、BE-167/168 依賴段重述 project 已宣告內容 → 修正三項 → 第 2 輪全新 senior-pm 獨立重評 → 4 維度全通過 → 寫入。

## Error Handling（錯誤處理）
訂單詳情頁 Tab 閹割範圍 sales-platform spec 未定義（只定義印件詳情頁閹割）→ 記 oq-manage mode B（ORD-028）+ 交付文件標「另案處理」（D4 不扣分、不捏造閹割清單）。

在評分 sub-agent 判 4 維度全「通過」之前持續迭代不要停 —— 本案第 2 輪達標才寫入。
```

---

## 工作流程

```
交付進度：
- [ ] Step 1：抓已定案規格（OpenSpec spec + 狀態機 + 對外正本連結）
- [ ] Step 2：依自包含標準模板產出交付草稿（不抓單一既有 issue 當對照）
- [ ] Step 3：實作者自審（對照 Rubric 禁令清單）
- [ ] Step 4：符合性評分（評分 sub-agent 跑 Rubric，執行者 / 評分者分離、evidence-anchored）
- [ ] Step 5：剛性閉環 — 未達 10 分 → 修正 → 重新評分，直到 10 / 10（硬上限 3 輪、卡住問 Miles、不放水）
- [ ] Step 6：通過才寫入 Linear（save_project / save_issue）+ 回報 URL 與 mermaid 渲染確認
```

### Step 1：抓已定案規格

- 讀對應模組 OpenSpec spec（Purpose / Requirements / 轉換規則 Scenario）與 wiki 狀態機卡（`06-state-machines/`，狀態列舉與轉換的正本；舊 `state-machines/spec.md` 已除役）
- **欄位不進交付內容**：欄位正本在 wiki 實體卡（`05-entities/`），開發團隊直接查閱 wiki；交付文件不產資料欄位段、不複寫欄位表
- 確認目標 Linear project / issue（list_projects / list_issues）與其既有欄位（避免覆蓋）
- **迭代交付（非首次）只反映 archived change**：若為「依這次更新同步」的迭代交付，算 delta 時只取 `openspec/changes/archive/` 內的 change，**active（未 archive）change 不交付**（尚未進 main spec）
- **中台 vs 業務平台 project 分流**：核心邏輯 + 狀態機變動的正本在**中台** project，業務平台為視圖層僅沿用、不另繪狀態機。交付前確認 delta 目標 project 正確（核心 change 投中台，勿誤投視圖層）
- **project 依平台實際模組開，勿按內容主題自創**：開新 project 前 MUST 確認該平台真有對應模組；平台上不存在的模組，內容以「情境擴充段」併入該平台既有 project（2026-07-07 實測：業務平台無審稿管理模組，誤開「業務平台 - 審稿管理」被 Miles 撤銷，審稿情境改以擴充段併入「業務平台 - 訂單管理」）
- **每條規則先標家，沿用規則不寫進票**：抓規格時，每條要寫進 Feature 票的規則，標它的 wiki 正本卡與該卡的領域標籤。下列任一成立即判為「沿用規則」：正本卡領域不等於本 project 領域；同平台既有 Feature 票已有該規則的功能節（開票前用 list_issues 掃同平台 Feature 票的功能節名）。沿用規則的處置：本 project 的 Feature 票不寫、project 描述不寫，Task 票以規則名直接引用（如「依訂單的可見範圍過濾」），不加「見某票」指路句；只有本票獨有的例外才留在本票。規則跨兩張以上 Feature 票重複，代表拆法錯或規則家在別的功能，先修拆法（2026-09-02 款項管理實測：訂單可見範圍規則家在 PM-1085，卻被寫進三張清單票與 project 描述，六輪評分三輪在此打轉）

### Step 2：依自包含標準模板產出（核心校正）

依 `references/delivery-template.md` 的標準模板產出。

撰寫前 MUST 讀 `/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`（受控句法正本）與 `/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`（非商業術語對照）；交付草稿的每一句話依其撰寫。若草稿由 sub-agent 代寫，dispatch prompt MUST 附上這兩檔路徑（sub-agent 拿不到 CLAUDE.md 與 output style）。

> **MUST NOT** 拿「另一個需求 / issue 的內容」當對照範本 —— 實例會被修改或刪除，對照即失效。標準模板是從多個既有交付物**精煉出的自包含結構**，更新走版本控管（見本檔 § Rubric 與模板演化）。

- **巢狀結構（v4）**：project 薄目錄（概述、Use Case、功能票清單每條附票名＋用戶故事式範圍句＋原生提及、Out of Scope、測試決策、另案、狀態機）→ milestone（需求主題名，禁日期批次名）→ Feature 票（每個功能一節，每節固定四段：節名／使用者故事／結構化規則／驗收條件，每節收合）→ Task 票（職能實作，parent 掛 Feature 票或該功能的原 Task 票）→ 需要再往下 Sub-Task／Bug。操作方式與介面呈現歸 Prototype（交付不文字重述、不附參照格）、欄位歸 wiki 實體卡；細則見 references/delivery-template.md v4.0
- **Task 票 = How 層**：背景（使用者故事）＋算式（有才寫，進程式碼區塊）＋規則（該職能的實作契約——只寫這個職能要保證的行為，對應商業規則以 Feature 票規則短名括註、不複寫本體；禁手段詞，手段由開發決定）＋驗收（落在受測介面）＋範圍（只取用的依賴與不做的項目）；不寫指路句、不寫 Blocked by 段
- **標題與 Label**：標題格式 `[ Feature ] - <功能語意>`／`[ Task ] - <功能語意>`（前綴保留），前綴之後只寫功能語意，**禁「（前端）」「（後端）」字樣**；職能由 Label 三軸承載——Role（Backend／Frontend／Design／PM）、Product（ERP／EC／編輯器）、Type（Feature／Task／Bug），皆為工作區既有分組、不自創新值；Type 軸必掛且與標題前綴一致
- **禁 meta 導覽句**：不寫「實作由本票底下的 sub-issue 承載」「本票是○○的商業邏輯與驗收條件正本」類句子——巢狀關係、Blocked by 與 Label 即資訊本體（與 D1 禁 wiki 指路句同族）
- **長段用收合區塊**：超過 10 行的流程表格、狀態機圖、逐條規則清單收進收合區塊；批次套用前 MUST 先以一張票試寫，確認 Linear 與 GitHub 同步票（details 元素）兩面渲染正常
- **票主體是正本、留言是修正紀錄**（WBS 原則）：內容與定案不符一律直接改票主體，不因票已完成而保留錯的內容；主體被修訂處附留言連結；要不要另開票依修正性質判定，開票前先問 Miles。缺陷的留言**分兩則不合併**——訂正紀錄（改了什麼、依據哪張 wiki 卡）與實測修正（標題帶日期、首行 tag 負責人、現況問題對期望行為、修正規則條列，禁寫程式碼檔案位置）。細則見 references/delivery-template.md § 二之二
- **開票順序**：milestone → Feature 票（PM team、不轉隊）→ 覆寫 project 描述回填識別碼 → 依 blockers-first 開 Task 票並轉隊、掛 parent → blocking 關係建在 Task 層（見 references/delivery-template.md § 七）
- **迭代交付擴充既有 project 描述時，MUST 融入既有段落結構**：新情境在原清單上加條目（Use Case 原 3 條加第 4 條、Key Feature 加項、功能邏輯說明清單加規則、Design 動線加線），缺的標準區塊（如驗收條件）可新增；**MUST NOT 在描述尾端另起一個平行的完整區塊**（概述＋使用情境＋Spec 全套重來一輪；2026-07-07 業務平台訂單管理審稿擴充實測：附加「審稿情境擴充」完整區塊被 Miles 退回，改融入各段）
- 禁中英夾雜（英文識別碼用「中文（英文）」格式）

### Step 3：實作者自審

主對話 agent（實作者）對照 `references/rubric.md` 5 維度的「絕對不要」禁令清單逐條自查，修掉明顯違規。

自審 MUST 含：有業務可觀測結果的功能是否已附驗收條件、驗收條件是否 outcome 導向且二元可勾稽、是否誤把通用品質門檻（Definition of Done）混入驗收條件、驗收條件條目是否殘留內部路徑或檔名；以及結構件——測試決策章是否在（且測試先行說明只此一處、票內不重複引言）、每張 Feature 票是否只裝一個功能顆粒且功能節四段齊備（節名／使用者故事／規則／驗收條件）且規則帶短名、是否掛 milestone 與 Label 三軸、標題是否誤帶職能字樣、是否殘留 meta 導覽句、每張 Task 票段落是否齊備（背景／規則／驗收／範圍；規則無手段詞且未複寫商業規則本體、驗收每條標受測介面）、parent 是否掛對 Feature 票、是否誤開設計票、誤附邊界表或誤寫 Blocked by 段。**結構性交付缺結構件者不得發布（由 D5 承接評分）。**

### Step 4：符合性評分（執行者 / 評分者分離）

調用一般 **sub-agent** 當**評分者**，餵入交付草稿 + `references/rubric.md`，明確要求「擔任交付文件評分者、依 rubric.md 5 維度逐維度給 2 / 1 / 0 分 + 引用違反的具體禁令 + **每維度引用草稿具體位置為證據（evidence-anchored，非空泛評語）** + 修正方向；合格分數 = 10 分且 D4 必為 2」。**實作者與評分者 MUST 分離**（同一 agent 自審易盲點，呼應 erp-planning-pre-check 模式）。

**評分聚焦 rubric 符合性、不重跑上游查證**（2026-07-06 Miles 拍板）：交付內容自 BRD（wiki）/ PRD（OpenSpec）整理而來、上游已定案，不需 senior-pm 深度真實性查證；D4 的評分方式是檢查「交付文件內的規則能否對應到整理來源、缺料處是否已標另案處理」，不重新審查上游設計本身。

**重評獨立性（第 2 輪起 MUST）**：重評時 MUST 餵**完整修正後草稿**、MUST NOT 暗示「改了什麼 / 上輪哪維度被扣」，讓評分者如完全獨立的 supervisor 重新判（對齊 /goal 完全獨立評審、防誘導與 leniency bias 放水）。

> 規模小的單 issue 微調 MAY 由主 agent 自審即可，不強制調用評分者；結構性交付（新 project / 多 issue / 含狀態機）SHALL 調用評分 sub-agent。

### Step 5：迭代至通過（剛性閉環）

這是 Goal 的核心 —— **評分未達 10 分就重複修改、修到達標為止**，實作者不能自判完成：

- 評分未達 10 分 → 修正草稿 → **MUST 重新跑 Step 4（評分 sub-agent 重評）**；**禁止用實作者自審代替重評、禁止未重評就進 Step 6 寫入**
- 重複「評分 → 修正 → 重評」直到 10 / 10；維度 4（真實性）任一處捏造即 0 分（一票否決，總分必不達標）
- 每輪 MUST 記 Iteration Policy：第 N 輪改了什麼 / 哪些維度失分 / 下一步修正方向
- 評分未滿 2 分的項目 MUST 追加進 `references/blocked-cases-log.md`（不論最終是否達標，當 Rubric 迭代原料）

**防 reward hacking（核心）**：達標標準鎖死在 `rubric.md`，**MUST NOT 為了收斂而放水、降標或表面改字騙過關**；修正 MUST 是「真實修正」（評分者以 evidence-anchored 驗證實質改善，非字面挪移）。

**終止與 Error Handling**：
- 達標（10 / 10）→ 進 Step 6
- **硬上限 3 輪**：連續 2 輪同一維度未滿分、或達 3 輪仍未達 10 分 → 停下回報 Miles（列「已試什麼 / 卡在哪 / 需要你提供什麼」），不無限迴圈、不放水
- 遇 spec 缺口無法不捏造 → 記 `oq-manage` mode B + 標「另案處理」（屬合法缺口顯性化，不扣分）

### Step 6：寫入 Linear（達標才寫）

**前提閘門：Step 4 符合性評分達 10 / 10 才可寫入；未達 MUST NOT 寫入。** 依 § Linear 操作 know-how 寫入，回報每個容器 URL + 請 Miles 確認 mermaid 渲染。

---

## 評分稽核（Rubric）

完整 5 維度評分標準、具體禁令、正反案例見 **`references/rubric.md`**。摘要：

| # | 維度 | 一句話 | 性質 |
|---|------|--------|------|
| 1 | 正本邊界 | 交付內容自包含、只以 Linear 互指，不外露 OpenSpec 與內部檔名 | 一般 |
| 2 | 分層與顆粒度 | project 寫完整 What、issue 寫該角色 How，不重複不空洞 | 一般 |
| 3 | 完整性 | 必要區塊齊備；狀態密集模組每個狀態機附 UML | 一般 |
| 4 | 真實性（不捏造）| 來源未定義就記 OQ 標另案，不自編 | **一票否決** |
| 5 | 交付結構完整性 | 結構件齊備：一票一功能顆粒／測試決策章／功能票清單原生提及／milestone 與 Label 三軸／Feature 功能節四段／Task 段落齊備（背景・規則・驗收・範圍）／Task 掛對 parent，且標題不帶職能字樣、長段用收合、不另開設計票、不另附邊界表、不另寫 Blocked by 段 | 一般 |

評分尺度：每維度 **通過 2 分 / 部分 1 分 / 未通過 0 分**，滿分 10。**合格分數 = 10 分（且維度 4 必為 2），未達即不發布**；維度 4 任一處捏造直接擋。

---

## Rubric 與模板演化（影片 6 步驟 SOP）

當交付出現新型錯誤、或要新增 / 調整評分維度時，依此 SOP 演化 `references/rubric.md` 與 `delivery-template.md`：

1. **跑基準**：對新模組讓交付草稿自由產出，看初始品質落點
2. **記錄皺眉原因**：Miles / 評審看了會皺眉的具體原因全記下（= 新禁令雛形）→ 記進 `references/blocked-cases-log.md`（append-only 原料層，每次被擋即追加）
3. **分門別類**：收斂為 3-4 個大維度（避免維度爆炸）
4. **提供具體拒絕案例（核心）**：把抽象要求轉成精確的「絕對不要做的事」（禁令越具體，評審越好抓違規）
5. **多樣化引導**：標準模板提供多個可行結構 / 風格方向，避免過度擬合單一範例
6. **餵評審運行**：更新後的 Rubric 放入 Step 4 評審；初期人工校準評審判準與 Miles 是否一致，有落差回頭微調

每次演化在 `references/rubric.md` 末「演化紀錄」追加版本與理由。

---

## Linear 操作 know-how（實測經驗，避免重犯）

| 主題 | 注意事項 |
|------|---------|
| **新 issue MUST 先開在 PM team 再轉對應 team** | PM team 掛有「同步建立 GitHub backlog issue」自動化；直接開在 FE / BE team 不會產生 GitHub 同步票（2026-07-07 中台審稿交付實測：直開 FE / BE 的票被 Miles 刪除重開）。正確流程：`save_issue` 帶 `team: "PM"` 建立 → 再 `save_issue` 帶 `id` + `team: "Front-End"` 或 `"Back-End"` 轉移（識別碼會換新，如 PM-790 → FE-354；GitHub 附件保留） |
| **轉隊會靜默解除 project 關聯** | 目標 team 不在該 project 的 teams 清單時，轉隊當下 issue 的 project 關聯被靜默拿掉、不報錯（2026-08-19 工單管理交付實測：六票轉 FE / BE 後全部脫離 project，Miles 發現才補救）。正確流程：開票前先 `save_project` 帶 `addTeams` 把 FE / BE 加進 project → 轉隊 → 轉隊後逐票驗回傳的 `projectId` 非空；補關聯時 project 缺該 team 會回「Discrepancy between issue team and state, cycle or project」 |
| **save_project 觸發狀態跳轉** | 更新 project 描述時 Linear 自動化會把 status 從 Backlog 帶到「Kick off」。`save_project` MUST 同時帶 `state: "Backlog"`（或交付前的原狀態）抑制，避免擅自推進看板 |
| **欄位保留紀律（既有票覆寫）** | 覆寫既有票時 `save_issue` 只傳 `id` + `description`；estimate / assignee / cycle / priority / milestone / labels 不傳即不動。交付只改「需求內容」，不碰排程與分派。**例外**：Project 全域規劃 milestone 時既有票一律補掛（含已完成的票），此時可傳 milestone；標題前綴與 Label 三軸的補齊同屬結構件，亦可傳 |
| **新開票 MUST 設 milestone 與 Label** | 新票依 v4 結構件建立時同時設 milestone（Feature 票）與 Label 三軸（Type／Product／Role）；Label 值取工作區既有分組、不自創。此為結構件、與上一列的既有票保留紀律不衝突 |
| **設 parent 用 UUID、不要用識別碼** | `save_issue` 的 `parentId` 傳識別碼時可能不生效或被還原，傳該票的 UUID 才穩定。寫入後逐票驗回傳的 `parentId` 是否落定 |
| **issue 互指寫純識別碼即可** | 描述內直接寫識別碼（如 `PM-1084`、`BE-169`）寫入後 Linear 會自動補成原生提及元素，**不必先查該票的 UUID**（2026-08-28 訂單模組重寫實測）。猜錯 UUID 反而會被降級成純 markdown 連結。提及某 issue 可能 touch 其 `updatedAt`（內容不變，屬良性 backlink）|
| **改長內容用整份重傳，不用 patch** | `save_issue` 的 `patch` 對中文 `old_string` 常回「not found」而整批 abort（2026-08-28 實測多次）。只插一段用 `insert_before` 錨定較穩；要改多處或重排編號時直接重傳完整 `description` |
| **引用 project MUST 用原生提及，禁純文字與 markdown 連結** | issue 內文引用 project 時 MUST 產生 Linear 原生提及（渲染為 @project 名 的卡片）。寫法：description 內直接寫 `<project id="<project UUID>" href="<project URL>/overview">中台 - 訂單管理</project>` 元素（2026-08-03 FE-377 實測可直接寫入並正常渲染）；「本 project」純文字與 markdown `[名稱](URL)` 皆禁止（markdown 連結不會轉成原生提及，曾被 Miles 退回）。此規則僅限 Linear 內部資源（project / issue）；wiki 卡在票內維持純文字引用、不外連 GitHub（2026-08-03 誤連被要求 rollback）|
| **進行中 issue 不覆寫** | 已有內容且 In Progress 的 issue（含 v1.x 時期的設計票遺產）不覆寫，只由 project 描述引用 |
| **mermaid 渲染需眼見確認** | 狀態機用 ` ```mermaid ` `stateDiagram`；Linear 應渲染成圖，但 MUST 請 Miles 開頁面確認；若顯示為程式碼則改其他形式 |
| **大型描述覆寫** | `save_project` description 是整段覆寫（非 append）；更新某段時 MUST 重傳完整描述，避免回退既有內容 |

---

## 範本與 Rubric 檔案

| 檔案 | 內容 |
|------|------|
| `references/delivery-template.md` | 自包含標準模板（project 描述 + Task issue + 狀態機規範）|
| `references/rubric.md` | 5 維度評分標準 + 具體禁令 + 正反案例 + 演化紀錄 |
| `references/blocked-cases-log.md` | 被擋案例 append-only log（Rubric 迭代原料；每次評審擋下即追加，累積後提煉）|
