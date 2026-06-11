---
name: wiki-amend
status: active
description: >
  explore 定案後 wiki 增修機制 skill。當 explore 定案涉及商業邏輯變動時，在進入 propose 之前先更新 wiki（ERP_Vault）商業邏輯正本，確保 BRD 先行、再往下設計實作規格。
  正本方法論：[[erp_index]]（位階 / 溯源 / 引用方向）+ 04-business-logic/_template-business-logic.md（§4.0 原子化職責 / §4.1 共通骨架）+ [[wiki-schema]]（§四 frontmatter / §十一 內容職責邊界）+ wiki/log.md（唯一操作史）。
  觸發時機：
    1. explore 定案後、propose 之前，判斷涉及商業邏輯變動時
    2. Miles 說「更新 wiki」「對齊 wiki」「wiki 回補」「先把商業邏輯寫進 wiki」
  範圍：**只處理「商業邏輯變動增修進 wiki 各位階」**。
  輸出：對話報告（建議 + 影響分析 + 優缺點三件套）+ 增修 / 新增 wiki 卡 + 追加 wiki/log.md + 標明哪些卡被異動。
  不適用：規劃前 know-how 稽核（用 erp-planning-pre-check）、Vault 整體健康稽核（用 vault-audit）、純查詢術語 / 狀態機、識別不確定項（用 oq-manage mode B）、raw 素材精練（用 vault-ingest）。
---

# explore 定案後 wiki 增修機制（wiki-amend）

---

## 一、定位與範圍

### 為什麼需要這個 skill

正確的設計順序是：**wiki（BRD 商業邏輯）→ OpenSpec（實作規格）→ Prototype（實作）**。

商業邏輯變動應在 explore 定案後、進入 propose 之前就寫進 wiki，而不是 archive 之後才回補。原因：

1. wiki 是商業邏輯正本（BRD 層），propose 撰寫 delta spec 時需要引用 wiki 卡作為依據。如果 wiki 沒先到位，delta spec 缺乏商業邏輯根據。
2. explore 階段已釐清「要改什麼商業邏輯」，此時資訊最完整、最適合寫入。
3. 避免 archive 後回補的老問題——同一規則散在多卡改一處漏其他處（converge change 漏對齊 wiki 6 卡教訓）。

本 skill 把「explore 定案後的商業邏輯增修進 wiki」做成**結構性流程**：歸類決策樹判位階 → 涵攝邏輯判歸既有卡 vs 新增 → 依各位階 Template 撰寫 / 迭代 → 自審稽核 → 標明哪些卡被異動 + 追加 wiki/log.md。

### 觸發判斷

不是每個 change 都會動到商業邏輯。以下為判斷標準（對應 CLAUDE.md 變動性質五級分級）：

| 變動性質 | 需要觸發 wiki-amend？ |
|---------|---------------------|
| 純措辭 / OQ 文字 | 否 |
| 局部欄位調整（單模組內、不影響商業規則）| 否 |
| 純 UI / 互動調整（加篩選器、改排版）| 否 |
| 既有邏輯的 Prototype 實作（邏輯已在 wiki）| 否 |
| 新增 / 修改業務規則 | 是 |
| 新增 / 修改實體關聯 | 是 |
| 狀態機節點 / 轉換變更 | 是 |
| 角色權責調整 | 是 |
| 商業邏輯 / KPI / Phase 範疇 | 是 |

### 核心設計理念：authoring guide = audit rubric 一份兩用

本 skill 的各位階 Template 與自審清單，**同一份既是「寫 wiki 時照著填」（authoring guide）也是「vault-audit 照著勾」（audit rubric）**。寫的標準與審的標準同源。

### 範圍切分（與既有 skill 分工）

| 稽核 / 增修對象 | 由哪個 skill / workflow 負責 |
|----------------|----------------------------|
| **規劃 ERP 功能前**的 know-how 缺漏稽核（補既有真實狀況）| `erp-planning-pre-check`（雙軸 6 領域 × 7 卡類型）|
| **explore 定案後**把商業邏輯變動**增修進 wiki 各位階**| **本 skill（wiki-amend）** |
| ERP_Vault **整體健康檢查**（12 維度，定期 / 週期）| `vault-audit` |
| 識別到不確定項（待確認 / 待釐清）| `oq-manage` mode B（開獨立 OQ 卡，禁 inline）|
| raw 素材精練成卡 | `vault-ingest` mode B |

### 不可違反 vs 明示彈性（核心常規 + 明示彈性破口）

**不可違反（最高層級硬規則，極少且硬）**：

- 禁中英夾雜（技術詞須括號附註，不得當主詞 / 形容詞 / 主動詞）。
- 業務語言段禁工程術語（檔名 / interface / type / function / class）當主詞。
- 識別到不確定項 MUST 觸發 `oq-manage` mode B 開獨立 OQ 卡（禁 inline、禁 `[!question]` callout）。
- `source` frontmatter 禁指同層 / 下層 / OpenSpec（只往上指更高位階卡 / 外部已驗證原點）。
- 正本卡正文零迭代史（歷史見 wiki/log.md 與 git）。
- 規則單一正本（Single Source of Truth）：同規則只在正本卡寫本體，他卡 wiki link 引用不複寫。

**可因案調整（明示彈性破口）**：

- 局部欄位調整（單模組內）：通常只 MODIFIED 對應 entity 卡單一 section，不觸發跨位階回補。
- 無爭議事實段落可用敘述代替問句（「這張卡要回答的問題」段非強制每段皆問句形式）。

---

## 二、SOP（五步，explore 定案後、propose 之前執行）

### Step 0：守門（先問三題，任一為「是」即不進 wiki）

1. 是 UI 規範 / 視覺 token / step-by-step Requirement / 演算法？→ 不進 wiki（留 DESIGN.md / OpenSpec / code，依 [[scope-boundary]]）。
2. 是「不確定項」（待確認 / 待釐清 / 需確認 / 待補）？→ 不寫進任一位階卡，立即觸發 `oq-manage` mode B 開 `08-open-questions/` 獨立卡（最高層級硬規則）。
3. 是 LLM 自編、無外部可驗證來源的內容？→ 不寫（Anti-Model-Collapse）；若是已驗證但未精練素材 → 走 `vault-ingest` 進 `raw/`。

### Step 1：從 explore 結論識別商業邏輯變動

讀取 explore 定案結論，識別哪些商業邏輯有變動，標記為新增 / 修改 / 移除：

| 變動類型 | wiki 動作 |
|---------|----------|
| 修改既有規則 / 狀態 / 關聯 | 就地改既有正本卡對應 section（block-level，不整卡重寫）|
| 新增規則 / 實體 / 狀態 / 角色 / 情境 | 過 § 四「新增 vs 掛既有」三門檻判新卡 vs 掛既有；新實體須補 cross-link |
| 移除規則 / 狀態 | 刪正本卡對應條文 + 沿 backlink 反查所有引用處確認引用不再懸空 |

### Step 2：五步式變更影響分析，攤開回補清單

沿 directional anchor 反查，**列出本次變動的回補清單**（Jama 五步 + Sens 連帶矩陣）：

1. 沿七實體連帶矩陣（[[付款發票邏輯#五B、七實體連帶矩陣]]）攤開連帶影響範圍。
2. 沿正本卡 backlink 反查所有 wiki link 引用該規則的下游卡（規則卡 / state-machine / entity / role / scenario / user-story）。
3. 量化每個受影響領域（雙軸 6 領域 × 6 卡類型，每格 N/M/K 三數字；**禁「大致 OK」非量化結論**，對齊 CLAUDE.md）。
4. 比較回補的 benefit / 工時 / 風險定優先。
5. 產出「wiki 商業邏輯卡回補清單」。

### Step 3：各位階回補寫法（block-level、單一正本）

依 § 三歸類決策樹判位階 → 依 § 四判歸既有卡 vs 新增 → 依 § 五各位階 Template 撰寫 / 迭代。回補落點與寫法：

| 位階 | 回補落點 | 寫法 |
|------|---------|------|
| 營運原則（operating-principle）| 僅當變動影響 product-vision / 分權方向時動（極少）| 改原則措辭 MUST Miles 拍板；source 終止於外部原點不再上溯 |
| 共用規則 / 業務規則（business-logic）| 規則正本卡對應 section / 規則條 | 改「規則 / 營運動機」欄；單一正本——同規則只此處改，他處 wiki link 自動反映 |
| 狀態（state-machine）| 狀態清單 / 轉換 section | 只改狀態 / 轉換 / 觸發；規則動機指 business-logic 正本，不重述規則本體 |
| 流程（scenario）| 對應情境 section | 改角色傳遞 / 狀態鏈；每步規則 wiki link 指 business-logic，不複寫 |
| 資料（entity）| 核心欄位 / 關聯 section | 改欄位 / 關聯；行為規則指 business-logic |
| 角色（role）| 職責 / 邊界 section | 改職責動作；分權判準指 business-logic |
| 操作步驟（user-story）| 業務情境段（穩定層）/ UI 操作段（易變層）| 業務規則變 → 改穩定層；Prototype 變 → 只改易變層、stage 標記同步 |

### Step 4：追加 wiki/log.md

在 `memory/Sens_wiki/wiki/log.md` 追加一筆（最新在上），格式如下（動作=納入、標籤=amend）：

```
## [YYYY-MM-DD HH:MM] 納入(amend) | <一句話簡述>
- 變更：[[卡A]] 一句話、[[卡B]] 一句話
- 動機：<explore 定案的業務理由，當下自足；得連 [[OQ卡]]>
- 衝突：無（或：與 [[C]] 衝突，已開 [[OQ]]）
```

寫法要求：

- 變更行 MUST 逐卡 `[[卡名]]` + 一句話（禁粗寫整批帶過）。
- 動機行必填，寫 explore 定案的業務理由，當下自足；**禁止引用下游 OpenSpec change 作為動機**（BRD 先行，記條目時 change 尚不存在）。
- 卡 → 議題反查 = 在 log.md 搜 `[[卡名]]`；議題 → 卡 = 該條目的變更行。卡正文不帶任何迭代史尾行。

### Step 5：自審驗證（Template 自審清單）

wiki 回補完成後，依 § 5.2 自審清單逐項勾，確保每張異動卡符合 Template 規範。

> **「完美是良善之敵」收尾紀律**：自審 PASS 即可進入 propose，殘餘 polish 進 follow-up。

---

## 三、歸類決策樹（新內容進來 → 哪位階）

> 法官 rubric 第一原則「議題驅動的預設結構」：歸類前先把新內容拆成「問句」，每個問句獨立判位階。原則「結構須事前定好」：歸類在動筆寫卡前完成，不邊寫邊改落點。

### 第 1 步：判位階（沿「問句的抽象度」由高到低）

依新內容回答的問句性質，對照六位階單一職責（04-business-logic/_template-business-logic.md §4.0、[[erp_index]]）：

| 新內容回答的問題 | 可否驗算 | 位階 | type / 載體 | 目錄 |
|----------------|---------|------|------------|------|
| 「公司在這件事上的價值 / 分權方向是什麼」（不可驗算、Miles 拍板）| 否 | 營運原則 | operating-principle | `01-products/operating-principles.md`（待建）|
| 「這個領域所有規則共用、一定要成立的底線是什麼」（如對帳一致性 應收 = 發票淨額 = 收款淨額）| 是 | 共用規則 | business-logic（共用規則卡）| `04-business-logic/` |
| 「什麼情況套什麼規則」（單一 if-then 要件 + 計算公式）| 是 | 業務規則 | business-logic（規則正本卡）| `04-business-logic/` |
| 「這條規則展開成什麼資料狀態 / 跨模組流程 / 角色職責 / 實體欄位」| — | 流程・狀態・角色・資料 | state-machine / scenario / role / entity | `06 / 07 / 03 / 05-*` |
| 「某角色為落實某規則，要執行哪些步驟」| — | 操作步驟 | user-story | `13-user-stories/<module>/` |

### 切分判準（最易混的三組）

- **共用規則 vs 業務規則**（business-logic 內部，[[erp_index]]）：問「這是『跨多條規則共用、被破壞則整個領域失效』的底線，還是『單一決策點的 if-then』？」前者共用規則（如對帳一致性），後者業務規則（如 補收免審）。
- **流程・狀態・角色・資料四選一**（04-business-logic/_template-business-logic.md §4.0.1）：
  - 回答「資料的狀態怎麼變（狀態清單 / 轉換條件 / 觸發事件）」→ state-machine。
  - 回答「一件事從頭到尾、跨角色傳遞怎麼走完」→ scenario（口訣：「這是一段有先後順序、跨角色傳遞的旅程嗎？」是 → scenario）。
  - 回答「這個角色做什麼 / 把關什麼」→ role。
  - 回答「這個實體有哪些欄位 / 關聯 / 狀態名」→ entity。
- **business-logic vs scenario**（最易混，Miles 2026-05-30 特別要求）：「這是一條 if-then 規則嗎？」是 → business-logic；「這是跨角色傳遞的旅程嗎？」是 → scenario。同一主題會同時有兩種卡（訂單異動既有規則卡也有退款 → 折讓端到端情境卡），互補不重複。

---

## 四、新增一條獨立卡 vs 掛既有卡（明確判準）

> 預設立場（呼應 CLAUDE.md「禁新建抽象卡」+ feedback「修補既有卡」+ DeepDocs「It only updates what needs to be updated」）：**先試掛既有，過硬門檻才新增**。
> 誤判代價：誤 add 成 modify → 平行重複內容未來不同步；誤 modify 成 add → 新內容硬塞舊卡造成語意污染。

### 三道硬門檻（AND，全過才新增獨立卡）

| 門檻 | 判準（問句）| 過 = 傾向新增 | 不過 = 掛既有 |
|------|------------|--------------|--------------|
| 涵攝失敗 | 「既有任一卡的職責範圍 + 既有規則語意，能否把這條新內容讀懂並涵蓋？」| 否（語意不被涵蓋）| 是（是既有規則的細化 / 例子 / 邊界）|
| Rule of Three | 「未來是否會有『另一張卡 / 另一個 change / 另一條 OQ』需要**單獨引用**這條內容？」| 是（將被多處引用）| 否（只單處使用，如寫死常數）|
| 位階 / 職責純度 | 「這條內容塞進候選既有卡會不會造成越界（規則塞進 state-machine、Data Model 塞進 business-logic）？」| 是（會越界 → 須獨立到正確 type）| 否（同 type 同職責，可併）|

### 新增的下限（原子性，04-business-logic/_template-business-logic.md 原則 6）

即使過了三門檻，也不可拆過頭：

- **一張卡至少能被「一位角色在一個情境下獨立讀懂並執行」**。
- 一條規則的四要素（觸發條件 + 審核路徑 + 終態 + 不變條件 invariant）MUST 留同一張卡，不可再拆。
- 反例：把「補收免審」的「免審」與「直達已執行」拆兩張卡 → 違反原子下限。

### 掛既有卡時的落點精度（block-level 回補、非整檔）

掛既有卡時**精準到 section / 規則條**，不整卡重寫：

- 改既有規則 → 改該規則的「規則 / 營運動機」欄，標明改了哪條（語意 slug）。
- 補例子 → 加到該規則「具體例子」段。
- 補關聯 → 加到「相關連結」段對應語意類別。

### 判準速查（三類典型）

1. **新規則但同領域**（如「諮詢結束未做大貨退費」規則）→ 涵攝失敗 + 會被 scenario / user-story 引用 + 屬 business-logic 職責 → **新增 business-logic 規則卡**，給語意 slug 錨點。
2. **既有規則的金額調整**（如半額退費 50% 改 40%）→ 涵攝成功（仍是「諮詢取消退費」規則）→ **掛既有卡**改規則欄 + 追加 wiki/log.md 一筆。
3. **跨多角色端到端新流程**（如「退款 → 折讓 / 作廢重開」全鏈）→ 屬 scenario 職責、會被多 user-story 引用 → **新增 scenario 卡**，規則步驟 wiki link 指既有 business-logic 卡（不複寫規則本體）。

### 新增後強制（避免新卡變孤島）

新增獨立卡 MUST 同時：

- 補 `source`（往上指更高位階 / 外部原點，禁指同層 / 下層 / OpenSpec）。
- 補 `implemented-by`（往下指 OpenSpec Requirement 標題層，導航用）。
- 與被拆出的母卡 / 引用卡互設 wiki link（雙向可達，否則 vault-audit 維度 3 報 orphan）。
- 若源自某 explore 議題 → 在 wiki/log.md 追加一筆（納入(amend)），變更行含該新卡 `[[卡名]]`。

---

## 五、各位階 Template（一致水平）

> Template 元規格保證六位階一致——不同人 / agent 寫同類卡落在同一結構。對齊 [[wiki-schema]] § 四 frontmatter + § 十一內容職責邊界 + 04-business-logic/_template-business-logic.md §4.0 / §4.1。

### 5.0 共同骨架（所有位階套用）

**Frontmatter 共同欄位**（對齊 [[wiki-schema]] § 四）：

- `type`（該位階 type）/ `module` / `business-domain`（role / business-logic / entity / state-machine / scenario / user-story 必填）/ `status`（draft / active / deprecated）/ `last-reviewed`。

**溯源雙欄（[[erp_index]] 單向溯源，前進標準）**：

- `source`：往**上游** = 正確性根據。只准指更高位階卡 / 外部已驗證原點。**嚴禁指同層 / 下層 / OpenSpec**。
- `implemented-by`：往**下游** = 導航 / 覆蓋。指 OpenSpec Requirement 標題層 / prototype。不承載正確性。
- `provenance-commit`（可選但建議）：記上次對齊的 commit SHA，供 vault-audit stale 偵測。

**正文共同段**（對齊 04-business-logic/_template-business-logic.md §4.1）：

1. 一句話定位（卡頂 `>` 引言）：是什麼、屬哪位階 / 哪業務領域、規則正本歸屬聲明。
2. `## 這張卡要回答的問題`：列這張卡要回答的關鍵業務問句，每個問句正文有對應結論（判斷「卡完整了沒」= 每個問句是否都有結論，取代「大致 OK」非量化結論）。
3. `## 營運背景`：公司營運上遇到什麼情況才有這張卡，2-4 句業務語言、無實作術語當主詞。
4. `## 相關連結`：依五類（上層情境 / 下層步驟 / 相關角色 / 相關規則 / 相關狀態 / 相關實體）設 wiki link，語意分類、雙向可達。
5. `## 來源`：連回可獨立驗證外部出處；卡不帶任何迭代史尾行（歷史見 wiki/log.md 與 git）。

**語意 slug 錨點**（[[erp_index]]）：規則 / 狀態 / 條文用語意 slug（`#補收免審`），不用流水號（R1）、不重排、不重用。改規則只改內容、slug 不變 → backlink 不斷。

**規則卡推理結構**：

- 規則型卡逐條照「意圖 → 既有規則 / 一定要成立的底線（引用更高位階卡）→ 套用本案 → 結論」四步寫，與 04-business-logic/_template-business-logic.md 原則 1 的「意圖 → 規則 → 營運動機」分欄對齊。
- 設計理由先寫被駁回的方案 / 立場，再逐條給駁回理由並承認被採納的好建議（記下設計取捨，不只記結論）。

### 5.1 各位階特有章節

| 位階 / type | 載體路徑（含落地狀態）| 特有章節 | MUST NOT（越界禁項）|
|------------|---------------------|---------|---------------------|
| 營運原則 / operating-principle | `01-products/operating-principles.md`（待建）+ `_template-operating-principle.md`（待建）| `## 原則陳述`（一句話價值 / 分權方向）+ `## 分權方向`（誰把關什麼、誰不被阻擋）+ `## 為什麼這是最上層、不再往上追`（說明為何此原則是最上層依據、不再上溯）。source 終止於外部原點（Miles 拍板 + 印刷業實務）、禁再上溯、禁指任何內部卡；status 轉 active 須 Miles 拍板；無 implemented-by | 可驗算的底線（屬共用規則 business-logic）|
| 共用規則 / 業務規則 / business-logic | `04-business-logic/` + `_template-business-logic.md`（待建）| 規則型：`## 規則與營運動機`（逐條照意圖 → 規則 → 營運動機）+ `## 具體例子`（1-3 個真實格式含具體數字，正例 + 邊界反例，禁 UI 措辭）+ `## 一定要成立的規則`（可驗算）+ `## 邊界`。索引型額外：`## 分類概覽` + `## 連帶矩陣`（七實體 depends-on / affects）。規則用語意 slug；共用規則卡標「領域一定要成立的底線」、業務規則 source 可往上指共用規則卡 | 跨模組完整流程（→ scenario）/ 狀態轉換圖（→ state-machine）/ 角色職責清單（→ role）/ user-story 模板 / 完整實體 Data Model（→ entity）|
| 狀態 / state-machine | `06-state-machines/` + `_template-state-machine.md`（待建）| `## 狀態清單`（含「狀態 / 說明 / 對應營運需求」三欄）+ `## 狀態轉換`（流程圖 / 轉換規則）+ `## 關鍵狀態 / 轉換的營運動機`（逐條：轉換 → 動機 → 1 例子）+ `## 與其他狀態機 / 實體的關係`。轉換動機 wiki link 指 business-logic 正本 | 規則本體 / 計算公式 / 跨情境例子（→ business-logic）/ UI 措辭 / 業務情境敘述（→ scenario）|
| 流程 / scenario | `07-scenarios/` + `_template-scenario.md`（待建）| `## 情境清單`（逐情境：情境名 → 觸發狀況 → 角色傳遞 / 狀態鏈 → 1 例子含真實編號 / 金額）+ `## 範疇外`（不涵蓋的情境 + 走哪張卡）。每步「依某規則」wiki link 指 business-logic 正本 | 規則本體與計算公式（→ business-logic）/ 單一步驟細節（→ user-story）|
| 角色 / role | `03-roles/` + `_template-role.md`（待建）| `## 基本資料` + `## 主要工作職責`（非顯然把關理由補營運動機）+ `## 職責邊界`（每條附「為什麼這樣切」）+ `## 關切點` + `## 預期阻力`。分權判斷準則細則指 business-logic 正本。Lint 例外：外部使用者角色（B2C 會員）允許 role 為純文字非 wiki link | 跨角色流程細節（→ scenario）/ 實體欄位定義（→ entity）/ 分權規則判斷準則細則（→ business-logic）|
| 資料 / entity | `05-entities/` + `_template-entity.md`（待建）| `## 核心欄位`（非顯然營運理由的欄位在說明欄補「為什麼要存」）+ `## 關鍵關聯` + `## 相關狀態機`（指 state-machine 卡）。欄位承載規則 wiki link 指 business-logic | 業務流程敘述（→ business-logic / scenario）/ user-story / 完整狀態轉換邏輯（→ state-machine）|
| 操作步驟 / user-story | `13-user-stories/<module>/` + `_template.md`（**既有**，依本元規格更新：補「這張卡要回答的問題」段 + source / implemented-by 對齊 + 自審 checklist 全面化）| 兩階段紀律：`## 業務情境（穩定層）`（作為 / 我希望 / 以便 / 前置條件 / 業務流程 / 成功條件 2-5 條）+ `## UI 操作（易變層）`（stage=ui-bound 才填）+ `## 來源`。source ≥ 1 條且禁指其他 user-story 卡；stage 標記；us-id | 業務情境段含 UI 措辭 / 中英夾雜 / 跨多角色端到端流程（→ scenario）/ 規則本體（以 source 引用 business-logic）|

### 5.2 Template 自審清單（一份兩用：撰寫檢查 = vault-audit 稽核維度）

每張回補 / 新增的卡，逐項勾：

- [ ] frontmatter 共同欄 + 位階特有欄全填；`source` 不指同層 / 下層 / OpenSpec。
- [ ] 「這張卡要回答的問題」段每個問句正文有對應結論（取代「大致 OK」）。
- [ ] 營運背景段無實作術語當主詞、無中英夾雜（技術詞括號附註）。
- [ ] 正文零迭代史（歷史見 wiki/log.md 與 git）、無任何迭代史尾行；正文零「待確認 / 待釐清」inline OQ 措辭（→ oq-manage mode B）。
- [ ] 越界檢查（04-business-logic/_template-business-logic.md §4.0 越界表）：未寫入不屬本 type 職責的內容。
- [ ] 相關連結雙向可達、語意分類；無 dangling link、非 orphan。
- [ ] 規則單一正本：未在第二張卡複寫規則本體。
- [ ] 「隔壁鄰居測試」：營運背景抽一句，問「Miles / 主管不看程式碼能否懂」。

---

## 六、每次增修必附「建議 + 影響分析 + 優缺點」（Miles 硬要求）

> 每筆增修（無論掛既有或新增）MUST 在對話中附三件套給 Miles 決定，**不可逕自寫入既有卡 / 新建卡**。沒把握判斷要明說「不知道、背景不足」，**不假裝**（對齊全域偏好「agent 無把握時明說」+ vault-ingest 防線「禁 LLM 自迭代」）。

| 件套 | 內容 |
|------|------|
| **建議** | 歸哪位階、掛既有卡哪個 section 還是新增、給什麼語意 slug |
| **影響分析** | 依 Step 2 變更影響分析，沿七實體連帶矩陣 + backlink 列出連帶影響的卡清單（量化 N/M/K，不可「大致 OK」）|
| **優缺點** | 掛既有 vs 新增的 trade-off（如掛既有避免碎片化但可能職責不純；新增職責純但增 cross-link 維護成本）|

> **不知道時的處置**：若無法判斷某變動歸哪位階 / 是否涵攝，MUST 明說「此項背景不足，無法判斷，建議開 OQ 或請 Miles 拍板」，並走 `oq-manage` mode B；禁自行猜一個位階硬塞。

---

## 七、如何標明哪些卡被異動（雙向可反查）

- **議題 → 卡**：在 wiki/log.md 該條目的變更行（逐卡 `[[卡名]]`）。
- **卡 → 議題**：在 wiki/log.md 搜 `[[卡名]]`（命中的所有條目，最新在上）+ `git log --follow` 卡檔。
- **directional anchor 標記**：被異動的正本卡 frontmatter 補 `implemented-by`（往下指 spec Requirement）+ 建議補 `provenance-commit`（記上次對齊的 commit SHA）；vault-audit 可 grep「某 spec Requirement 有 delta 但無任一 wiki 卡 provenance-commit 更新」→ 報 stale。
- **對話報告**：本 skill 收尾在對話中列「本次異動卡清單」（卡名 + 新增 / 修改 / 移除 + 一句話變更），供 Miles 確認 + commit message 引用。

---

## 八、驗證基準（前進標準 + 兜底）

| 驗證維度 | 基準 | 兜底機制 |
|---------|------|---------|
| source 方向 | 只往上指（更高位階卡 / 外部原點），禁指同層 / 下層 / OpenSpec | vault-audit 偵測 source 指 OpenSpec 報 Error |
| 無循環 | 結構上單向不成環（source 與 implemented-by 永不同向）| vault-audit 可加成環偵測 |
| 下不抵觸上 | 業務規則不抵觸共用規則、共用規則不抵觸營運原則 | 三視角審查 / 人審層勾稽推理是否跳過既有規則 |
| Template 自審 | § 5.2 八項全過 | 同清單既撰寫檢查也 vault-audit 稽核維度 |

---

## 九、與其他規範 / skill 的關係

- **CLAUDE.md § 主動收尾第 10 條**：change archive 後 wiki 對齊由本 skill 機制保障；但主要觸發時機已提前至 explore 定案後。每次增修 MUST 追加 wiki/log.md 一筆（唯一操作史）。
- **`erp-planning-pre-check`**：規劃**前**補既有 know-how 缺漏；本 skill 規劃**中**（explore 定案後）增修商業邏輯進 wiki。兩者一前一中、不重疊。
- **`vault-audit`**：定期 / 週期整體健康（12 維度）；本 skill point-of-change 即時回補。兩者一定期一即時。
- **`oq-manage`**：本 skill Step 0 守門識別不確定項時觸發 mode B。
- **`vault-ingest`**：本 skill Step 0 守門識別「已驗證未精練素材」時轉介進 raw。
- **`erp-user-story`**：user-story 位階回補可委由該 skill（兩階段紀律 + 中英夾雜 lint + INVEST 自審）。

---

## 十、誠實標注（落地路徑待建項，不假裝）

> 本 skill 採用的部分位階 type 與目錄為 [[erp_index]] 標注的**待建項**，現況尚未存在。本 skill 不要求一次全建，採「新卡 / 被變動異動的卡優先補」漸進策略。

| 項目 | 現況 | 落地依據 |
|------|------|---------|
| `operating-principle` type | [[wiki-schema]] 現用 `product-vision` type 承載營運原則層；`operating-principle` 曾為候選**目標 type 名**，已決議沿用 `product-vision`、不新增此 type（決策脈絡見 `08-open-questions/` 拍板紀錄 + wiki/log.md）| [[erp_index]]（營運原則層沿用 product-vision type 之註）|
| `01-products/operating-principles.md` | **尚未建立**（現有 product-vision.md / success-metrics.md 等）| [[erp_index]] |
| 各位階 `_template-*.md`（business-logic / state-machine / scenario / role / entity / operating-principle）| **尚未建立**（僅 user-story `_template.md` 既有）| 04-business-logic/_template-business-logic.md § 四範式（待落地為獨立 template 檔）|
| `source` / `implemented-by` frontmatter | 現況 0 張 business-logic 卡有此雙欄，全部僅 `related-spec`（指 OpenSpec，方向顛倒）| [[erp_index]] 試點；`related-spec` 過渡期保留，語意等同 implemented-by 弱版；補不出 source 的標 `source-gap` 待專輪 |
| `provenance-commit` frontmatter | **尚未納入** wiki-schema | [[erp_index]]（drift 偵測建議，待 schema 補）|

> **遷移誠實原則**：本 skill 是「前進標準」（新卡照此填）。既有卡的全面遷移屬 [[erp_index]] 試點範圍，本 skill 不要求一次全改。執行時若遇待建項尚未就緒（如 operating-principle 卡不存在但變動影響營運原則層），MUST 在對話中明說「此位階載體尚未建立，建議先觸發落地路徑或請 Miles 拍板」，不假裝已有。
