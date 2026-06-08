---
name: linear-delivery
description: >
  把已定案的規格交付到 Linear（project 描述 + 各角色 Task issue），依「自包含標準模板」產出、並以 Rubric 評分稽核到通過才發布。
  定位：規格確認後對開發團隊的交付物製作 + 品質把關。對開發與公司而言 Notion / Linear 為正本，OpenSpec 為 PM 內部工作版本不外露。
  觸發時機：Miles 說「交付到 Linear」「發布給開發」「把 X 模組交付給開發」「調整 Linear 上的 project / issue」「依評分稽核交付文件」。
  此 skill 強制：先精煉模板再產出（不抓單一既有 issue 當對照）+ 交付前跑 Rubric 評分（執行者與評審分離）+ 缺口顯性化不捏造。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁在交付內容寫 `openspec/specs/...` 或任何 PM 內部工作版本引用（正本邊界）
    2. 禁拿「另一個需求 / issue 的內容」當對照範本（實例會變動 / 消失即失效）；MUST 依 references/delivery-template.md 自包含標準模板產出
    3. 禁把實作細節（How）寫進 project 描述（What 層）；禁讓 Task issue 只剩「指回 project」一句而無該角色實作要點
    4. 狀態密集模組禁交付沒有狀態機 UML 的文件；禁畫 spec 未定義的狀態轉換（捏造）
    5. 來源未定義時禁自編規則填入交付文件 MUST 停下來記 oq-manage mode B + 標「另案處理」
    6. 交付前 MUST 跑 references/rubric.md 4 維度評分；任一維度未通過禁發布；維度 4（真實性）為一票否決
  不適用：GitHub Issues 交付（用 notion-to-github）、Vault 整體健康稽核（用 vault-audit）、規劃前 know-how 稽核（用 erp-planning-pre-check）。
---

# Linear 交付與評分稽核（linear-delivery）

## 定位

把**已定案的規格**交付到 Linear，讓開發團隊拿到可動工的需求；交付前用 Rubric 評分把關品質。

- **正本邊界**：對開發與公司而言，**Notion / Linear 為正本**，OpenSpec spec 是 PM 內部工作版本，交付內容 MUST NOT 外露 `openspec/...` 路徑。
- **方法論來源**：Gary Chen《/goal 功能怎麼用》影片 —— 「實作者 + 評審」雙角色 + 提示詞 5 元素 + Rubric 6 步驟。對齊 CLAUDE.md karpathy § 4「Goal-Driven Execution」與 `erp-planning-pre-check` 的「執行者 / 稽核者分離」。

### 與其他 skill 分工

| 對象 | skill |
|------|-------|
| 交付到 **Linear**（project + issue）+ 評分把關 | 本 skill |
| 交付到 **GitHub** Issues | `notion-to-github` |
| Vault 整體健康稽核 | `vault-audit` |
| 規劃前 know-how 稽核 | `erp-planning-pre-check` |

---

## 交付任務的 /goal 結構（5 元素）

每次交付前，先把任務寫成這 5 元素（讓產出可被評審稽核、未達標可迭代）：

| 元素 | 本 skill 的填法 |
|------|----------------|
| **Outcome（最終成果）** | Linear project 描述（What）+ 各角色 Task issue（How）+ 狀態機 UML 齊備，且 Rubric 4 維度經 senior-pm 評審判**全「通過」**才算完成（非實作者自判）|
| **Verification（驗證方式）** | 由 senior-pm（PM agent）評審跑 `references/rubric.md` 4 維度評分；逐條對照「絕對不要」禁令清單 |
| **Constraint（限制條件）** | 只改本次交付的 project 描述與指定 issue 描述；**絕對不動** issue 的 estimate / assignee / cycle / priority / milestone / labels；不外露 OpenSpec 路徑 |
| **Iteration Policy（迭代策略）** | 修完 MUST 重新評審（餵完整草稿、不暗示改動）；每輪記錄第 N 輪改了什麼 / 哪些維度未過 / 下一步；達標才停、硬上限 3 輪、卡住停下問 Miles |
| **Error Handling（錯誤處理）** | 規格來源未定義某邏輯（無法不捏造）→ 停下來觸發 `oq-manage` mode B 記 OQ + 交付文件標「另案處理」，並回報 Miles 卡點，不硬編 |

### /goal prompt 範例（每次交付前複製套用）

> 每次交付前，把任務複製成下方 /goal、替換 `<...>` 占位，作為本次交付的 Goal 宣告，據此跑 Step 1-6。確保每次「完工標準 / 驗證 / 限制 / 迭代 / 錯誤處理」一致。風格對齊 dispatch-prompt-template（標準 + 具體範例）。

**通用模板（複製改占位即用）**：

```text
# /goal：交付「<模組名>」到 Linear（project <project-id>）

## Outcome（完工標準）
<模組> 的 project 描述（模組層 What）+ 各角色 Task issue（角色層 How）齊備〔狀態密集模組另含每個狀態機 UML〕，且經 senior-pm 評審判 references/rubric.md 4 維度（D1 正本邊界 / D2 分層顆粒度 / D3 完整性 / D4 真實性）全「通過」。實作者不得自判完成。

## Verification（驗證方式）
由 senior-pm（PM agent）跑 references/rubric.md：逐維度給通過 / 部分 / 未通過 + evidence-anchored（引用草稿具體位置）+ 違反禁令 + 修正方向。D4 真實性一票否決。

## Constraint（限制條件）
- 交付內容只引用 Notion BRD / Notion 資料欄位 DB / Linear 互指；MUST NOT 外露 openspec 路徑或 PM 內部術語
- 依 references/delivery-template.md 自包含模板產出；MUST NOT 抓單一既有 issue 當對照
- save_project 帶 state:<交付前原狀態> 防 Kick off；save_issue 只傳 id + description，保留 estimate / assignee / cycle / priority / milestone / labels
- 視圖層模組（複用中台）沿用中台狀態機、不另繪

## Iteration Policy（迭代策略）
評審未通過 → 修正 → MUST 重新跑 senior-pm 評審（餵完整修正後草稿、不暗示改了什麼）→ 直到 4 維度全通過。每輪記「第 N 輪改了什麼 / 哪維度未過 / 下一步」。

## Error Handling（錯誤處理）
- 規格來源未定義（無法不捏造）→ 記 oq-manage mode B + 交付文件標「另案處理」（不算未通過）
- 連 2 輪同維度未過 / 滿 3 輪未全通過 → 停下回報 Miles（已試什麼 / 卡哪 / 需要什麼），不放水 / 不降標 / 不表面改字騙過關

在 senior-pm 判 4 維度全「通過」之前，持續迭代不要停；卡住則停下與 Miles 討論。
```

**已填示範：業務平台 - 訂單管理（2026-06-01 第一個真實案例）**：

```text
# /goal：交付「業務平台 - 訂單管理」到 Linear（project af83dbd3）

## Outcome（完工標準）
業務平台 - 訂單管理的 project 描述（模組層 What）+ FE-259（訂單列表與詳情）/ BE-168（訂單 API）/ FE-258（售後頁）/ BE-167（售後 API）四個 Task issue 齊備；業務平台為視圖層、沿用中台訂單管理狀態機不另繪；經 senior-pm 評審判 references/rubric.md 4 維度全「通過」。實作者不得自判完成。

## Verification（驗證方式）
由 senior-pm（PM agent）跑 references/rubric.md：逐維度給通過 / 部分 / 未通過 + evidence-anchored（實際 Read sales-platform / order-management / after-sales-ticket spec 查證每條規則來源）+ 違反禁令 + 修正方向。D4 真實性一票否決。

## Constraint（限制條件）
- 交付內容只引用 Notion BRD / Notion 資料欄位 DB / Linear 互指；不外露 openspec 路徑
- 依 references/delivery-template.md 自包含模板產出；不抓單一既有 issue 當對照
- save_project 帶 state: Planned（業務平台交付前原狀態）防 Kick off；save_issue 只傳 id + description，保留 assignee（Yana / Eric）/ estimate / cycle 等
- 業務平台為視圖層，沿用中台訂單 / 印件 / 售後服務單狀態機、不另繪

## Iteration Policy（迭代策略）
評審未通過 → 修正 → 重新跑 senior-pm 評審（餵完整修正後草稿、不暗示改了什麼）→ 直到 4 維度全通過。
（實跑紀錄）第 1 輪 senior-pm 判 D1 通過 / D2 部分 / D3 部分 / D4 通過：FE-258 漏 next action 第四組「待建關聯動作」、摘要卡 3 張 vs next action 欄 4 值顆粒度混淆、BE-167/168 依賴段重述 project 已宣告內容 → 修正三項 → 第 2 輪全新 senior-pm 獨立重評 → 4 維度全通過 → 寫入。

## Error Handling（錯誤處理）
訂單詳情頁 Tab 閹割範圍 sales-platform spec 未定義（只定義印件詳情頁閹割）→ 記 oq-manage mode B（ORD-028）+ 交付文件標「另案處理」（D4 不扣分、不捏造閹割清單）。

在 senior-pm 判 4 維度全「通過」之前持續迭代不要停 —— 本案第 2 輪達標才寫入。
```

---

## 工作流程

```
交付進度：
- [ ] Step 1：抓已定案規格（OpenSpec spec + 狀態機 + 對外正本連結）
- [ ] Step 2：依自包含標準模板產出交付草稿（不抓單一既有 issue 當對照）
- [ ] Step 3：實作者自審（對照 Rubric 禁令清單）
- [ ] Step 4：評審稽核（senior-pm 跑 Rubric 評分，執行者 / 評審分離、evidence-anchored）
- [ ] Step 5：剛性閉環 — 未通過 → 修正 → 重新評審，直到 senior-pm 判 4 維度全通過（硬上限 3 輪、卡住問 Miles、不放水）
- [ ] Step 6：通過才寫入 Linear（save_project / save_issue）+ 回報 URL 與 mermaid 渲染確認
```

### Step 1：抓已定案規格

- 讀對應模組 OpenSpec spec（Purpose / Requirements / Data Model）與 `state-machines/spec.md`（狀態節點 / 轉換 / 觸發）
- 取得**對外正本連結**：Notion BRD URL（spec Purpose 段「來源 BRD」）、Notion 資料欄位 DB URL（篩選該模組）
- 確認目標 Linear project / issue（list_projects / list_issues）與其既有欄位（避免覆蓋）
- **迭代交付（非首次）只反映 archived change**：若為「依這次更新同步」的迭代交付，依 [iteration-delta-publish](../../../memory/Sens_wiki/wiki/erp/00-meta/iteration-delta-publish.md) 算 delta，只取 `openspec/changes/archive/` 內的 change，**active（未 archive）change 不交付**（尚未進 main spec）
- **中台 vs 業務平台 project 分流**：核心邏輯 + 狀態機變動的正本在**中台** project，業務平台為視圖層僅沿用、不另繪狀態機。交付前確認 delta 目標 project 正確（核心 change 投中台，勿誤投視圖層）

### Step 2：依自包含標準模板產出（核心校正）

依 `references/delivery-template.md` 的標準模板產出。

> **MUST NOT** 拿「另一個需求 / issue 的內容」當對照範本 —— 實例會被修改或刪除，對照即失效。標準模板是從多個既有交付物**精煉出的自包含結構**，更新走版本控管（見本檔 § Rubric 與模板演化）。

- **project 描述 = 模組層 What**：概述（指 Notion BRD）/ 使用情境（Use Case + Key Feature 分 Phase）/ Spec（Design / 功能邏輯 / 資料欄位指 Notion DB / FE / BE）/ 狀態機 UML
- **Task issue = 角色層 How**：概述（指回 project 段落 + 負責範圍）+ 實作細節 checklist
- 禁中英夾雜（英文識別碼用「中文（英文）」格式）

### Step 3：實作者自審

主對話 agent（實作者）對照 `references/rubric.md` 4 維度的「絕對不要」禁令清單逐條自查，修掉明顯違規。

### Step 4：評審稽核（執行者 / 評審分離）

調用 **senior-pm（PM agent）** 當**評審**（取代通用 sub-agent），餵入交付草稿 + `references/rubric.md`，明確要求「擔任交付文件評審、依 rubric.md 4 維度逐維度給通過 / 部分 / 未通過 + 引用違反的具體禁令 + **每維度引用草稿具體位置為證據（evidence-anchored，非空泛評語）** + 修正方向」（**非**跑其序列協作 / BRD 審查模式）。**實作者與評審 MUST 分離**（同一 agent 自審易盲點，呼應 erp-planning-pre-check 模式）。

**重評獨立性（第 2 輪起 MUST）**：重評時 MUST 餵**完整修正後草稿**、MUST NOT 暗示「改了什麼 / 上輪哪維度被扣」，讓 senior-pm 如完全獨立的 supervisor 重新判（對齊 /goal 完全獨立評審、防誘導與 leniency bias 放水）。

> **為何用 senior-pm 而非通用 sub-agent**：通用 agent 對 ERP spec 細節不熟，D4 真實性查證易誤判（實測：通用評審把 order-management「訂單列表最長逾期天數篩選」誤判為無據捏造，混淆了它與已移除的「Payment 老化主管聚合」，在一票否決維度卡最久仍判錯）。senior-pm 熟 ERP spec / Vault，能正確查證來源真偽。
>
> 規模小的單 issue 微調 MAY 由主 agent 自審即可，不強制調用評審；結構性交付（新 project / 多 issue / 含狀態機）SHALL 調用 senior-pm 評審。

### Step 5：迭代至通過（剛性閉環）

這是 Goal 的核心 —— **評審判未通過就重複修改、修到通過為止**，實作者不能自判完成：

- 評審任一維度非「通過」→ 修正草稿 → **MUST 重新跑 Step 4（senior-pm 重評）**；**禁止用實作者自審代替重評、禁止未重評就進 Step 6 寫入**
- 重複「評審 → 修正 → 重評」直到 senior-pm 判 4 維度全「通過」；維度 4（真實性）任一處捏造即整體不通過（一票否決）
- 每輪 MUST 記 Iteration Policy：第 N 輪改了什麼 / 哪些維度仍未過 / 下一步修正方向
- 評審判「部分 / 未通過」的項目 MUST 追加進 `references/blocked-cases-log.md`（不論最終是否達標，當 Rubric 迭代原料）

**防 reward hacking（核心）**：達標標準鎖死在 `rubric.md`，**MUST NOT 為了收斂而放水、降標或表面改字騙過關**；修正 MUST 是「真實修正」（評審以 evidence-anchored 驗證實質改善，非字面挪移）。

**終止與 Error Handling**：
- 達標（4 維度全通過）→ 進 Step 6
- **硬上限 3 輪**：連續 2 輪同一維度仍未過、或達 3 輪仍未全通過 → 停下回報 Miles（列「已試什麼 / 卡在哪 / 需要你提供什麼」），不無限迴圈、不放水
- 遇 spec 缺口無法不捏造 → 記 `oq-manage` mode B + 標「另案處理」（屬合法缺口顯性化，不算未通過）

### Step 6：寫入 Linear（通過才寫）

**前提閘門：Step 4 評審判 4 維度全「通過」才可寫入；未通過 MUST NOT 寫入。** 依 § Linear 操作 know-how 寫入，回報每個容器 URL + 請 Miles 確認 mermaid 渲染。

---

## 評分稽核（Rubric）

完整 4 維度評分標準、具體禁令、正反案例見 **`references/rubric.md`**。摘要：

| # | 維度 | 一句話 | 性質 |
|---|------|--------|------|
| 1 | 正本邊界 | 只引用開發看的正本（Notion / Linear），不外露 OpenSpec | 一般 |
| 2 | 分層與顆粒度 | project 寫完整 What、issue 寫該角色 How，不重複不空洞 | 一般 |
| 3 | 完整性 | 必要區塊齊備；狀態密集模組每個狀態機附 UML | 一般 |
| 4 | 真實性（不捏造）| 來源未定義就記 OQ 標另案，不自編 | **一票否決** |

評分尺度：每維度 **通過 / 部分 / 未通過**。**交付前任一維度非「通過」即不發布**；維度 4 任一處捏造直接擋。

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
| **save_project 觸發狀態跳轉** | 更新 project 描述時 Linear 自動化會把 status 從 Backlog 帶到「Kick off」。`save_project` MUST 同時帶 `state: "Backlog"`（或交付前的原狀態）抑制，避免擅自推進看板 |
| **欄位保留紀律** | `save_issue` 只傳 `id` + `description`；estimate / assignee / cycle / priority / milestone / labels 不傳即不動。交付只改「需求內容」，不碰排程與分派 |
| **issue 互指自動關聯** | 描述內寫 issue 識別碼（如 FE-260 / BE-169）Linear 會自動轉成可點擊 cross-reference；提及某 issue 可能 touch 其 `updatedAt`（內容不變，屬良性 backlink）|
| **DE / 進行中 issue 不覆寫** | 已有內容且 In Progress 的 issue（如設計工作）不覆寫，只由 project 描述引用 |
| **mermaid 渲染需眼見確認** | 狀態機用 ` ```mermaid ` `stateDiagram`；Linear 應渲染成圖，但 MUST 請 Miles 開頁面確認；若顯示為程式碼則改其他形式 |
| **大型描述覆寫** | `save_project` description 是整段覆寫（非 append）；更新某段時 MUST 重傳完整描述，避免回退既有內容 |

---

## 範本與 Rubric 檔案

| 檔案 | 內容 |
|------|------|
| `references/delivery-template.md` | 自包含標準模板（project 描述 + Task issue + 狀態機規範）|
| `references/rubric.md` | 4 維度評分標準 + 具體禁令 + 正反案例 + 演化紀錄 |
| `references/blocked-cases-log.md` | 被擋案例 append-only log（Rubric 迭代原料；每次評審擋下即追加，累積後提煉）|
