---
name: wiki-amend
status: active
description: >
  wiki 正本卡（03-roles／04-business-logic／05-entities 含資料結構總覽 structure-overview／06-state-machines／07-scenarios）的唯一寫入入口：判落點、依 wiki 骨架與規範撰寫、追加 log.md。
  觸發：確定要寫或改 wiki 卡時，不限上游用什麼手段收斂需求；Miles 說「更新 wiki」「對齊 wiki」「寫進 wiki」「補一張情境卡」；其他 skill 要動正本卡時一律轉介進來（vault-ingest mode B、erp-planning-pre-check Step 4、vault-audit mode C、oq-manage 決議落地）。
  不適用：OQ 卡本身（用 oq-manage）、raw 素材層（用 vault-ingest）、規劃前盤點（用 erp-planning-pre-check）、整體健康稽核（用 vault-audit）、純查詢。
  硬性載入清單、落點判定、輸出格式（三件套 + log.md）見本文。
---

# wiki 正本卡寫入入口（wiki-amend）

---

## 〇、開工前 MUST 載入（不得跳過，不是「視需要」）

寫或改任何一張正本卡之前，逐項讀完：

| 順序 | 檔 | 拿什麼 |
|------|----|--------|
| 1 | [[卡片撰寫共用規範]] § 二 | 六步流程（辨識 → 歸位 → 確認前提 → 撰寫 → 稽核 → 定案）與各步卡住時的出口 |
| 2 | 同檔 § 三、§ 四、§ 四之二 | 停下鐵則四條、撰寫紀律五條、L1 共用稽核維度 |
| 3 | 該卡型的 `規範 - <單元名>` | 判斷表、前提確認、撰寫規則、產出格式、不收清單、L2／L3 稽核維度 |
| 4 | `wiki/範本/範本 - <單元名>` | 新卡從骨架複製起手 |
| 5 | 該單元 `範例 - <單元名>` | 稽核時的通過樣本 |
| 6 | `/Users/b-f-03-029/.claude/output-styles/ste100-pm.md` ＋ `memory/shared/non-business-terms.md` | 受控句法規則與非商業術語對照；卡內每一句話依其撰寫，與卡片結構規範衝突時以卡片規範為準 |

未載入前不得動筆。清單各檔的內容不在本 skill 複寫，本 skill 只管流程。

## 一、定位與範圍

### 這個 skill 管什麼

**所有正本卡的寫入都經這裡**：`03-roles/`、`04-business-logic/`、`05-entities/`、`06-state-machines/`、`07-scenarios/`。觸發點是「確定要寫 wiki 卡」，上游用什麼手段收斂需求不影響本 skill，對話討論、plan-audit 稽核通過後落卡、`/opsx:explore` 都算。

流程：判落點（哪張卡的哪一段）→ 依骨架與規範撰寫 → 稽核 → 標明異動卡 ＋ 追加 wiki/log.md。

**BRD 先於 PRD 是順序約束，不是觸發條件**：正本卡要在 OpenSpec delta spec 之前到位，因為 delta spec 的 `## Why` 要引用正本卡當依據。這條約束何時生效，與本 skill 何時被觸發是兩件事。

### 觸發判斷（以「要寫的內容屬哪個卡型」起算）

| 要寫的內容 | 卡型 | 走本 skill |
|-----------|------|-----------|
| 業務規則、計算口徑、領域知識、外部約束 | business-logic | 是 |
| 實體的業務可見欄位、關聯 | entity | 是 |
| 領域的實體關聯、單據流、資料流總覽 | structure-overview | 是 |
| 狀態列舉、轉換的營運動機 | state-machine | 是 |
| 一個目標的完成過程 | scenario | 是 |
| 角色職責與邊界 | role | 是 |
| 待確認的不確定項 | open-question | 否，走 `oq-manage` mode B |
| 未消化的已驗證素材 | raw | 否，走 `vault-ingest` mode A |
| UI 規範、演算法、Given／When／Then | 不進 wiki | 否，見 [[scope-boundary]] |
| 純措辭修正、不改設計 | 不限 | 否，直接改，仍須過 L1 語言紀律 |

### 核心設計理念：authoring guide = audit rubric 一份兩用

本 skill 的各位階 Template 與自審清單，**同一份既是「寫 wiki 時照著填」（authoring guide）也是「vault-audit 照著勾」（audit rubric）**。寫的標準與審的標準同源。

### 範圍切分（與既有 skill 分工）

| 稽核 / 增修對象 | 由哪個 skill / workflow 負責 |
|----------------|----------------------------|
| **規劃 ERP 功能前**的 know-how 缺漏稽核（補既有真實狀況）| `erp-planning-pre-check`（雙軸 6 領域 × 6 卡類型）|
| **寫或改任何一張正本卡**（03／04／05／06／07）| **本 skill（wiki-amend）**，其他 skill 一律轉介進來 |
| ERP_Vault **整體健康檢查**（14 維度，定期 / 週期）| `vault-audit`（唯讀，要改卡轉介本 skill）|
| 識別到不確定項（待確認 / 待釐清）| `oq-manage` mode B（開獨立 OQ 卡，禁 inline）|
| raw 素材精練成卡 | `vault-ingest` mode B |

### 不可違反 vs 明示彈性（核心常規 + 明示彈性破口）

**不可違反（最高層級硬規則，極少且硬）**：

- 禁中英夾雜（技術詞須括號附註，不得當主詞 / 形容詞 / 主動詞）。
- 業務語言段禁工程術語（檔名 / interface / type / function / class）當主詞。
- 識別到不確定項 MUST 觸發 `oq-manage` mode B 開獨立 OQ 卡（禁 inline、禁 `[!question]` callout）。
- `source` frontmatter 禁指實作文件（OpenSpec 等）；指向分工正本或外部已驗證原點，詳見 wiki-schema § 4.0。
- 正本卡正文零迭代史（歷史見 wiki/log.md 與 git）。
- 規則單一正本（Single Source of Truth）：同規則只在正本卡寫本體，他卡 wiki link 引用不複寫。

**可因案調整（明示彈性破口）**：

- 局部欄位調整（單模組內）：通常只 MODIFIED 對應 entity 卡單一 section，不觸發跨位階回補。
- 無爭議事實段落可用敘述代替問句（「這張卡要回答的問題」段非強制每段皆問句形式）。

---

## 二、SOP（五步，對齊六步流程的第 2 至 6 步）

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
2. 沿正本卡 backlink 反查所有 wiki link 引用該規則的下游卡（規則卡 / state-machine / entity / role / scenario）。
3. 量化每個受影響領域（雙軸 6 領域 × 6 卡類型，每格 N/M/K 三數字；**禁「大致 OK」非量化結論**，對齊 CLAUDE.md）。
4. 比較回補的 benefit / 工時 / 風險定優先。
5. 產出「wiki 商業邏輯卡回補清單」。

### Step 3：各位階回補寫法（block-level、單一正本）

依 § 三歸類決策樹判位階 → 依 § 四判歸既有卡 vs 新增 → 依 § 五各位階 Template 撰寫 / 迭代。回補落點與寫法：

**改動順序約束（先本體、後引用，強制）**：本次要寫或改的每句規則句，先依歸類決策樹與各單元規範的引用方向規則定出它的家（判型即判家，不另設正本標記）。第一動作是把本體寫進家卡的對應段；其餘受影響卡的動作限定兩種——把原句改成 `[[卡名]]` 引用、或更新該卡型規範允許的露出句（情境卡接力步的角色動作、狀態機轉換表的觸發）——禁止用自己的話重寫規則內容。落點表存量互斥檢查搜出兩處以上都像本體時，依停下鐵則並排呈報，不自行挑一處改。

| 位階 | 回補落點 | 寫法 |
|------|---------|------|
| 營運原則（operating-principle）| 僅當變動影響 product-vision / 分權方向時動（極少）| 改原則措辭 MUST Miles 拍板；source 終止於外部原點不再上溯 |
| 共用規則 / 業務規則（business-logic）| 規則正本卡對應 section / 規則條 | 改「規則 / 營運動機」欄；單一正本——同規則只此處改，他處 wiki link 自動反映 |
| 狀態（state-machine）| 狀態清單 / 轉換 section | 只改狀態 / 轉換 / 觸發；規則動機指 business-logic 正本，不重述規則本體 |
| 業務情境（scenario）| 一卡一目標完成過程（對應情境 section）| 變體判定與段落格式依 [[規範 - 業務情境]]；改角色傳遞 / 狀態鏈，每步規則 wiki link 指 business-logic，不複寫 |
| 資料（entity）| 核心欄位 / 關聯 section | 改欄位；**關聯（含基數）的正本在該領域資料結構總覽卡**（如 [[生產領域資料結構總覽]]）——動關聯先改總覽卡、實體卡「關鍵關聯」段只改視角摘要（落點表強制檢查此條）；行為規則指 business-logic |
| 角色（role）| 職責 / 邊界 section | 改職責動作；分權判準指 business-logic |

### Step 4：追加 wiki/log.md

在 `memory/Sens_wiki/wiki/log.md` 追加一筆——**新條目 MUST 插在檔首說明列下方（最新在上），禁用 `cat >>` 等檔尾追加指令**（2026-08-05 教訓：08-01 起六筆全被追加到檔尾、排序破損，經 Miles 授權一次性搬正）。格式如下（動作=納入、標籤=amend）：

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

### Step 5：自審驗證

寫完依 L1 共用維度（[[卡片撰寫共用規範]] § 四之二）＋ 該卡型的 L2／L3 維度逐項勾，以該單元「範例 - 」卡為通過樣本。維度清單不在本 skill 複寫。

**收斂掃描（必做）**：本次改動的每一句規則句，用 skill `obsidian-cli` 全庫搜尋關鍵詞，確認其餘出現處全部是引用或合法露出句、無第二份本體。發現第二份本體 → 回 Step 3 收斂；分不出哪份是本體 → 停下並排呈報。

> **「完美是良善之敵」收尾紀律**：自審 PASS 即可進入 propose，殘餘 polish 進 follow-up。

---

## 三、歸類決策樹（新內容進來 → 哪位階）

> 法官 rubric 第一原則「議題驅動的預設結構」：歸類前先把新內容拆成「問句」，每個問句獨立判位階。原則「結構須事前定好」：歸類在動筆寫卡前完成，不邊寫邊改落點。

### 第 1 步：判位階（沿「問句的抽象度」由高到低）

依新內容回答的問句性質，對照六位階單一職責（04-business-logic/規範 - 商業邏輯.md § 二 分類判斷表、[[erp_index]]）：

| 新內容回答的問題 | 可否驗算 | 位階 | type / 載體 | 目錄 |
|----------------|---------|------|------------|------|
| 「公司在這件事上的價值 / 分權方向是什麼」（不可驗算、Miles 拍板）| 否 | 營運原則 | operating-principle | `01-products/operating-principles.md`（待建）|
| 「這個領域所有規則共用、一定要成立的底線是什麼」（如對帳一致性 應收 = 發票淨額 = 收款淨額）| 是 | 共用規則 | business-logic（共用規則卡）| `04-business-logic/` |
| 「什麼情況套什麼規則」（單一 if-then 要件 + 計算公式）| 是 | 業務規則 | business-logic（規則正本卡）| `04-business-logic/` |
| 「這條規則展開成什麼資料狀態 / 跨模組流程 / 角色職責 / 實體欄位」| — | 流程・狀態・角色・資料 | state-machine / scenario / role / entity | `06 / 07 / 03 / 05-*` |
| 「某角色為落實某規則，要執行哪些步驟」（單角色單步驟＝業務情境能力型）| — | 業務情境 | scenario | `07-scenarios/` |

### 切分判準（最易混的三組）

- **共用規則 vs 業務規則**（business-logic 內部，[[erp_index]]）：問「這是『跨多條規則共用、被破壞則整個領域失效』的底線，還是『單一決策點的 if-then』？」前者共用規則（如對帳一致性），後者業務規則（如 補收免審）。
- **流程・狀態・角色・資料四選一**（依 [[wiki-schema]] § 十一 卡類型內容職責邊界）：
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

### 新增的下限（原子性；本節即正本）

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

1. **新規則但同領域**（如「諮詢結束未做大貨退費」規則）→ 涵攝失敗 + 會被業務情境卡引用 + 屬 business-logic 職責 → **新增 business-logic 規則卡**，給語意 slug 錨點。
2. **既有規則的金額調整**（如半額退費 50% 改 40%）→ 涵攝成功（仍是「諮詢取消退費」規則）→ **掛既有卡**改規則欄 + 追加 wiki/log.md 一筆。
3. **跨多角色端到端新流程**（如「退款 → 折讓 / 作廢重開」全鏈）→ 屬 scenario 職責、會被多張業務情境卡引用 → **新增 scenario 卡**，規則步驟 wiki link 指既有 business-logic 卡（不複寫規則本體）。

### 新增後強制（避免新卡變孤島）

新增獨立卡 MUST 同時：

- 補 `source`（指分工正本或外部原點，禁指實作文件；詳見 wiki-schema § 4.0）；wiki 不設 `implemented-by` 等實作對應欄位。
- 與被拆出的母卡 / 引用卡互設 wiki link（雙向可達，否則 vault-audit 維度 3 報 orphan）。
- 若源自某 explore 議題 → 在 wiki/log.md 追加一筆（納入(amend)），變更行含該新卡 `[[卡名]]`。

---

## 五、撰寫格式（正本在 wiki，本 skill 不複寫）

各卡型的段落結構、frontmatter 欄位、專業表示法、稽核維度，正本都在 wiki：

| 卡型 | 規範 | 骨架 | 範例 |
|------|------|------|------|
| business-logic | [[規範 - 商業邏輯]] | [[範本 - 服務藍圖]]、[[範本 - 商業規則]] | [[範例 - 服務藍圖]]、[[範例 - 商業規則]] |
| entity | [[規範 - 實體]] | [[範本 - 實體]] | [[範例 - 實體]] |
| structure-overview | [[規範 - 資料結構總覽]] | [[範本 - 資料結構總覽]] | [[範例 - 資料結構總覽]] |
| state-machine | [[規範 - 狀態機]] | [[範本 - 狀態機]] | [[範例 - 狀態機]] |
| scenario | [[規範 - 業務情境]] | [[範本 - 業務情境]] | [[範例 - 業務情境]] |
| role | [[規範 - 角色]] | [[範本 - 角色]] | [[範例 - 角色]] |

跨卡型共用的治理（六步流程、停下鐵則、撰寫紀律、L1 稽核維度、三層同 commit 鐵則）正本在 [[卡片撰寫共用規範]]。

**本 skill MUST NOT 複寫上表任何一份的內容**：段落清單、frontmatter 欄位、越界禁項、自審項目都不在這裡重述。要知道某卡型怎麼寫，讀 § 〇 載入清單指定的那幾份。

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
- **異動溯源**：wiki 不設 `implemented-by` 等實作對應欄位；卡的異動溯源靠 wiki/log.md 條目（搜 `[[卡名]]`）與 git 歷史，不在 frontmatter 標記。
- **對話報告**：本 skill 收尾在對話中列「本次異動卡清單」（卡名 + 新增 / 修改 / 移除 + 一句話變更），供 Miles 確認 + commit message 引用。

---

## 八、驗證基準（前進標準 + 兜底）

| 驗證維度 | 基準 | 兜底機制 |
|---------|------|---------|
| source 方向 | 指分工正本或外部原點，禁指實作文件（OpenSpec 等） | vault-audit 偵測 source 指 OpenSpec 報 Error |
| 無循環 | `source` 單向往上，結構上不成環 | vault-audit 維度 7 查直接互指 |
| 下不抵觸上 | 業務規則不抵觸共用規則、共用規則不抵觸營運原則 | 三視角審查 / 人審層勾稽推理是否跳過既有規則 |
| 稽核維度 | L1 共用八條 ＋ 該卡型的 L2／L3 全通過 | 同一份維度也是 vault-audit 維度 12 逐項勾的依據 |

---

## 九、與其他規範 / skill 的關係

- **`erp-planning-pre-check`**：規劃前盤點影響範圍與 know-how 缺口；它的 Step 4 修補既有卡時，動筆那一步轉介本 skill。
- **`vault-ingest`**：管 raw 素材層的收與讀；mode B 判完落點後寫卡動作轉介本 skill。本 skill 若識別到「已驗證但未精練的素材」則反向轉介進 raw。
- **`oq-manage`**：管 OQ 卡本身；本 skill 識別不確定項時觸發 mode B，OQ 拍板後決議落地到正本卡的動作轉介本 skill。
- **`vault-audit`**：唯讀稽核（14 維度）；mode C 要改卡時轉介本 skill。兩者一寫一讀。
- **BRD 先於 PRD**：正本卡要在 OpenSpec delta spec 之前到位，delta spec 的 `## Why` 引用正本卡當依據。每次增修 MUST 追加 wiki/log.md 一筆（唯一操作史）。

---

## 十、誠實標注（落地路徑待建項，不假裝）

> 本 skill 採用的部分位階 type 與目錄為 [[erp_index]] 標注的**待建項**，現況尚未存在。本 skill 不要求一次全建，採「新卡 / 被變動異動的卡優先補」漸進策略。

| 項目 | 現況 | 落地依據 |
|------|------|---------|
| `operating-principle` type | [[wiki-schema]] 現用 `product-vision` type 承載營運原則層；`operating-principle` 曾為候選**目標 type 名**，已決議沿用 `product-vision`、不新增此 type（決策脈絡見 `08-open-questions/` 拍板紀錄 + wiki/log.md）| [[erp_index]]（營運原則層沿用 product-vision type 之註）|
| `01-products/operating-principles.md` | **尚未建立**（現有 product-vision.md / success-metrics.md 等）| [[erp_index]] |
| 各位階 `規範 - <單元名>.md` | **已建**：規範 - 商業邏輯／規範 - 狀態機／規範 - 角色／規範 - 實體／規範 - 業務情境；**僅 `規範 - 營運原則.md` 尚未建立** | [[卡片撰寫共用規範]]（跨位階治理）＋各「規範 - 」卡 |
| `source` frontmatter | business-logic 卡已全數移除 `implemented-by`／`related-spec`／`module`（實作對應屬 PRD 層，wiki 不承載）；多數卡已有 `source` | 補不出 source 的標 `source-gap` 待專輪 |
| `provenance-commit` frontmatter | **尚未納入** wiki-schema | [[erp_index]]（drift 偵測建議，待 schema 補）|

> **遷移誠實原則**：本 skill 是「前進標準」（新卡照此填）。既有卡的全面遷移屬 [[erp_index]] 試點範圍，本 skill 不要求一次全改。執行時若遇待建項尚未就緒（如 operating-principle 卡不存在但變動影響營運原則層），MUST 在對話中明說「此位階載體尚未建立，建議先觸發落地路徑或請 Miles 拍板」，不假裝已有。
