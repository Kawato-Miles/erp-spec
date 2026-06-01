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
  不適用：GitHub Issues 交付（用 notion-to-github）、OpenSpec / wiki 內部一致性稽核（用 doc-audit / vault-audit）、規劃前 know-how 稽核（用 erp-planning-pre-check）。
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
| OpenSpec / wiki 內部一致性稽核 | `doc-audit` / `vault-audit` |
| 規劃前 know-how 稽核 | `erp-planning-pre-check` |

---

## 交付任務的 /goal 結構（5 元素）

每次交付前，先把任務寫成這 5 元素（讓產出可被評審稽核、未達標可迭代）：

| 元素 | 本 skill 的填法 |
|------|----------------|
| **Outcome（最終成果）** | Linear project 描述（What）+ 各角色 Task issue（How）+ 狀態機 UML 齊備，且 Rubric 4 維度全數通過 |
| **Verification（驗證方式）** | 跑 `references/rubric.md` 4 維度評分；逐條對照「絕對不要」禁令清單 |
| **Constraint（限制條件）** | 只改本次交付的 project 描述與指定 issue 描述；**絕對不動** issue 的 estimate / assignee / cycle / priority / milestone / labels；不外露 OpenSpec 路徑 |
| **Iteration Policy（迭代策略）** | 每輪記錄：改了哪個容器、哪些維度未通過、下一步修正方向 |
| **Error Handling（錯誤處理）** | 規格來源未定義某邏輯（無法不捏造）→ 停下來觸發 `oq-manage` mode B 記 OQ + 交付文件標「另案處理」，並回報 Miles 卡點，不硬編 |

---

## 工作流程

```
交付進度：
- [ ] Step 1：抓已定案規格（OpenSpec spec + 狀態機 + 對外正本連結）
- [ ] Step 2：依自包含標準模板產出交付草稿（不抓單一既有 issue 當對照）
- [ ] Step 3：實作者自審（對照 Rubric 禁令清單）
- [ ] Step 4：評審稽核（sub-agent 跑 Rubric 評分，執行者 / 評審分離）
- [ ] Step 5：未通過則迭代修正，直到 4 維度全通過
- [ ] Step 6：寫入 Linear（save_project / save_issue）+ 回報 URL 與 mermaid 渲染確認
```

### Step 1：抓已定案規格

- 讀對應模組 OpenSpec spec（Purpose / Requirements / Data Model）與 `state-machines/spec.md`（狀態節點 / 轉換 / 觸發）
- 取得**對外正本連結**：Notion BRD URL（spec Purpose 段「來源 BRD」）、Notion 資料欄位 DB URL（篩選該模組）
- 確認目標 Linear project / issue（list_projects / list_issues）與其既有欄位（避免覆蓋）

### Step 2：依自包含標準模板產出（核心校正）

依 `references/delivery-template.md` 的標準模板產出。

> **MUST NOT** 拿「另一個需求 / issue 的內容」當對照範本 —— 實例會被修改或刪除，對照即失效。標準模板是從多個既有交付物**精煉出的自包含結構**，更新走版本控管（見本檔 § Rubric 與模板演化）。

- **project 描述 = 模組層 What**：概述（指 Notion BRD）/ 使用情境（Use Case + Key Feature 分 Phase）/ Spec（Design / 功能邏輯 / 資料欄位指 Notion DB / FE / BE）/ 狀態機 UML
- **Task issue = 角色層 How**：概述（指回 project 段落 + 負責範圍）+ 實作細節 checklist
- 禁中英夾雜（英文識別碼用「中文（英文）」格式）

### Step 3：實作者自審

主對話 agent（實作者）對照 `references/rubric.md` 4 維度的「絕對不要」禁令清單逐條自查，修掉明顯違規。

### Step 4：評審稽核（執行者 / 評審分離）

開一個 sub-agent 當**評審**，餵入交付草稿 + `references/rubric.md`，要求逐維度給「通過 / 部分 / 未通過」+ 引用違反的具體禁令 + 修正方向。**實作者與評審 MUST 分離**（同一 agent 自審易盲點，呼應 erp-planning-pre-check 模式）。

> 規模小的單 issue 微調 MAY 由主 agent 自審即可，不強制開評審 sub-agent；結構性交付（新 project / 多 issue / 含狀態機）SHALL 開評審。

### Step 5：迭代至通過

依評審回報修正 → 重評，直到 4 維度全「通過」。維度 4（真實性）任一處捏造即整體不通過（一票否決）。記錄每輪 Iteration Policy。

### Step 6：寫入 Linear

依 § Linear 操作 know-how 寫入，回報每個容器 URL + 請 Miles 確認 mermaid 渲染。

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
2. **記錄皺眉原因**：Miles / 評審看了會皺眉的具體原因全記下（= 新禁令雛形）
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
