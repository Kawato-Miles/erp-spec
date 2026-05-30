---
type: meta
status: active
last-reviewed: 2026-05-31
---

# Wiki 結構與撰寫規範（商業需求管理）

> Sens ERP 商業需求 Wiki（ERP_Vault）的資訊架構正本：定義分層、依據鏈、引用方向、撰寫風格、範本機制、增修紀律。
> 全 Wiki 最高**文件管理規範**（其餘 meta 卡 [[wiki-schema]]、[[business-logic-writing-guide]]、[[scope-boundary]] 為本規範的展開）。
> 設計時參考了分層管理（上層管下層、下層不牴觸上層）、上游需求文件與下游實作規格的分工、變更後同步回補等既有實務（參考來源見末節）。

## 為什麼需要這份結構規範

Sens Wiki 反覆吃過三種虧：(1) 同一條規則散在多張卡、改一處漏其他處（如「converge change 漏對齊 wiki 6 卡」）；(2) 卡的「來源」指向 OpenSpec（下游當上游正確性來源，方向顛倒）；(3) 層級混亂（state-machine 卡夾帶業務規則）。本規範用「上層管下層、下層不牴觸上層」的分層管理概念為範本，把「往上指依據、連結不繞回自己、下不牴觸上」做成**結構性保證**而非靠自律。

## 分層體系（營運原則 → 驗收項目，由大到細）

每層只負責自己該負責的細緻度（營運原則定價值、共用規則定領域底線、業務規則定要件、流程／狀態／角色／資料定執行形式、驗收項目定個案）。上層不下放到個案、下層不僭越定價值。

| 分層 | Sens type / 載體 | 職責 | 目錄 |
|------|-----------------|------|------|
| 營運原則（最高層）| 營運原則（`product-vision` type）| 公司最高商業價值 / 分權方向（不可驗算、Miles 拍板）| `01-products/erp/operating-principles.md`（待建）|
| 共用規則 | `business-logic`（領域共用規則卡）| 某領域所有規則都一定要遵守的底線（可驗算）| `04-business-logic/` |
| 業務規則 | `business-logic`（規則正本卡）| 具體單點 if-then 要件 + 計算公式 | `04-business-logic/` |
| 流程／狀態／角色／資料 | `scenario` / `state-machine` / `role` / `entity` | 要件展開為流程 / 狀態 / 角色 / 資料 | `07/06/03/05-*` |
| 操作步驟 | `user-story` | 單一角色執行某規則的步驟 | `13-user-stories/<module>/` |
| 驗收項目 | `test-case`（UAT 業務層）| 某具體輸入下的可勾稽驗收結論 | `15-test-cases/<module>/`（待建）|

> `business-logic` 這個 type 橫跨「共用規則 / 業務規則」兩層（見 § business-logic 內部分層），靠卡的角色與 frontmatter 區分，不另立 type。

## business-logic 內部分層：共用規則 vs 業務規則

business-logic 這層不扁平：共用規則統攝某領域所有規則的共通底線，業務規則定具體條文。對應：

| 分層 | 性質 | 例 | 可驗算 |
|------|------|----|-------|
| 營運原則 | 商業價值 / 分權方向（公司既定的選擇、不再往上追，Miles 拍板）| 「現金流出須把關、客戶加單不阻擋」 | 否 |
| 共用規則 | 領域所有規則都一定要遵守的底線 | 對帳一致性「應收 = 發票淨額 = 收款淨額」 | 是 |
| 業務規則 | 具體單點 if-then 要件 | R1 補收免審 / R2 退款送審 / R5 應收公式 | 是 |

- **對帳一致性 = 共用規則**：跨訂單 / 訂單異動 / 收款 / 發票多處規則，是 billing-cash 領域不可破壞的底線；可驗算（數學一致性），故非營運原則（營運原則是不可驗算的價值方向）。**獨立成卡** `04-business-logic/對帳一致性.md`，各業務規則 `source` 往上指它。
- **業務規則不牴觸共用規則**：任何金額認列規則（R5 應收公式、發票規則、收款規則）都不得破壞對帳一致性 → 各業務規則 `source` 可往上指共用規則卡。
- **共用規則不牴觸營運原則**：對帳一致性服務於更高的營運價值。
- **為何 business-logic 不當營運原則**：營運原則是規則的「為什麼對」（最上層的依據），business-logic 是「對在哪」（可驗算要件）。若規則自己當最上層，依據鏈就斷在規則這層、回不到最上層的依據。

## 依據往上、實作往下，連結不繞回自己

連結不繞回自己不靠自律，靠「依據鏈往上指、實作鏈往下指，兩個方向不會接成一圈」：

- **兩個語意不同、永不同向的欄位**：
  - `source`（往**上**指這張卡為什麼對 = 依據）：只准指更上層卡、最上層的依據（來自老闆拍板與印刷業實務）。**嚴禁指同層 / 下層 / OpenSpec**。
  - `implemented-by`（往**下**指這張卡被誰實作 = 導航 / 覆蓋）：指 OpenSpec capability / Requirement、prototype、test-case。不承載正確性。
- 因兩欄位永不同向 → 結構上不可能 A.source→B 且 B.source→A。
- **依據鏈的最上層**：營運原則的 source 指到「Miles 拍板 + 印刷業實務」（最上層的依據、不再往上追），不無限後退、不繞回。
- **事後檢查兜底**：一致性靠 `doc-audit-archive` + `vault-audit` 事後 lint（可加「檢查有沒有繞回自己」+ 偵測 source 指向 OpenSpec 報 Error），不靠寫卡者自律。

依據鏈：`test-case.source → user-story → business-logic 業務規則 → business-logic 共用規則 → 營運原則 → 最上層的依據`，每層只往上、下不牴觸上。

## 兩種最高層分開：營運原則 vs 文件管理規範

Vault 有兩種互不混淆的「最高層」，須避免兩者內容互相滲透（文件管理規則塞進營運原則、或營運價值散落文件管理規範）。

| 最高層 | 載體 | 讀者 | 內容職責 | 不該放什麼 |
|--------|------|------|---------|-----------|
| **營運原則** | `01-products/erp/operating-principles.md`（分層體系最高層，§ 分層體系「營運原則」列）| 業務主管 / PM | 只放**商業價值與分權方向**（如「現金流出須把關、客戶加單不阻擋」），不可驗算、Miles 拍板 | 文件怎麼寫 / 怎麼指依據 / Vault 與 OpenSpec 誰權威——這些屬文件管理，不進此檔 |
| **文件管理規範** | 本規範（wiki-architecture）+ 專案 CLAUDE.md | Claude / 撰寫者 / 稽核者 | 分層、依據鏈、引用方向、範本、增修紀律；「**Vault（企業營運需求）> OpenSpec（產品實作規格）權威**」「Vault 是商業邏輯正本、OpenSpec 是實作規格」屬此 | 不放具體商業價值取捨（那屬營運原則）|

**為何分開**：「Vault > OpenSpec 權威」是「文件之間誰是正本」的管理判準，不是公司營運上的價值取捨；放進營運原則會讓業務主管讀到與其決策無關的文件管理規則，也讓營運原則失去「純商業價值」的純度。對應 § 營運需求（Obsidian）與實作規格（OpenSpec）的分工——分工規則（下游引上游、上游 source 絕不指 OpenSpec）全屬文件管理規範。

## 營運需求（Obsidian）與實作規格（OpenSpec）的分工

- Obsidian ERP_Vault = **企業營運需求（BRD）正本**（上游，回答 why/what）；OpenSpec = **產品實作規格（PRD）**（下游，回答 how）。
- **下游引上游當背景**（產品實作規格的 change `## Why` wiki link 引 Vault 卡）= 對。
- **上游（Vault）的 source 絕不指 OpenSpec**（上游不引下游當正確性）。Vault 往 OpenSpec 只用 `implemented-by`（導航）。
- **撰寫層級順序**（對齊 CLAUDE.md）：先讀 wiki 商業邏輯（Vault 正本）→ 再 OpenSpec 實作規格 → 最後 code；順序不可顛倒。
- 過渡期實證問題：約 12+ 張 business-logic 卡的「來源」段系統性指向 OpenSpec（顛倒），且現況 0 張卡有 `source` / `implemented-by`、全部僅有 `related-spec`（即下游當上游的弱版）→ 修法：移到 `implemented-by`（連 Requirement 標題層），真 source 改指營運原則 / 拍板 OQ，補不出的標 `source-gap` 待專輪。

## 各層怎麼寫

- **營運原則（最高層，type=`product-vision`）**：一句話商業價值 / 分權方向，不可驗算；source 指到最上層的依據（Miles 拍板 + 印刷業實務）。
- **business-logic**：if-then 要件，意圖 → 規則 → 營運動機分欄；規則的連結指向位置用業務語意命名（`#補收免審`，不用 R 流水號，不重排不重用）。
- **scenario（流程）**：跨模組角色傳遞 + 狀態鏈；一情境一卡（覆蓋率可比對）；判斷口訣「跨角色傳遞的旅程」。
- **user-story / test-case**：前提→動作→驗收結果三段；驗收措辭用**可觀測具體值**非「做了沒」；正常情況與例外情況**分區放**；案例之間不重疊、合起來涵蓋所有情況 + 明確結束點；「怎麼做」與「為什麼」分層（步驟只留執行所需、動機另置）。

## 完整依據鏈範例（訂單異動補收免審）

```
驗收項目  TC：#ORD-2026-0512 補收 +6000 → 直達已執行、不綁款項（可勾稽驗收值）
  │ source ▲
操作步驟  US-ORD-026 業務建補收 OA 免主管核可直接執行
  │ source ▲
業務規則  [[訂單異動規則#補收免審]]（R1：金額>0 且類型∈… → 免審直達已執行）
  │ source ▲
共用規則  [[對帳一致性]]（補收 +N 後 應收 = 發票淨額 = 收款淨額 仍成立）
  │ source ▲
營運原則  [[operating-principles#現金流出須把關]]（加單方向不阻擋）
  │ source ▲
最上層依據 Miles 拍板（補退不對稱）+ 台灣印刷業實務分權
```
每層 source 只往上、下不牴觸上；R1 另以 `implemented-by` 往下導航到 OpenSpec `order-management/spec.md § 補收 OA 跳過審核中間態`（不參與正確性、不繞回自己）。補收（R1）與退款（R2）方向相反卻同樣往上指到營運原則 → 營運原則這層避免同一條規則散在多張卡、改一處漏其他處。

## 寫卡方法與範本機制

> 把「新內容該歸哪層、掛既有卡還是新增、change 後怎麼回補、各層卡長什麼樣」做成可重複套用的方法，避免不同人 / agent 寫同類卡落點不一。
> 核心做法：**這份範本同時是「寫的時候照著填」和「事後照著檢查」**——每層範本同時是撰寫時照著填，與事後 doc-audit / vault-audit 照著勾。本節定範本清單與共同骨架；歸類決策樹、新增 vs 掛既有判準、change 後增修機制的詳細執行步驟（含 fan-out 稽核）詳見 `wiki-amend` skill。

### 範本清單

| 分層 | type | 範本路徑（新建除非註明）| 特有章節重點 |
|------|------|------|------|
| 營運原則 | product-vision | `01-products/erp/_template-operating-principle.md`（對應正本檔 `operating-principles.md` 亦待建）| 原則陳述（一句話價值，不可驗算）+ 分權方向（誰把關 / 誰不被阻擋）+ 為什麼這是最上層、不再往上追；source 指到最上層的依據、禁指內部卡、無 `implemented-by`；status 轉 active 須 Miles 拍板。註：營運原則層沿用既有 `product-vision` type，不新增 `operating-principle` type |
| 共用規則 / 業務規則 | business-logic | `04-business-logic/_template-business-logic.md` | 規則與營運動機（意圖→規則→為什麼）+ 具體例子（真實數字、正例+邊界反例）+ 一定要成立的規則（invariant）+ 邊界；規則正本歸屬聲明 + 業務語意命名的連結位置；共用規則卡標「領域所有規則都一定要遵守的底線」、業務規則可往上指共用規則 |
| 流程／狀態／角色／資料 | state-machine | `06-state-machines/_template-state-machine.md` | 狀態清單（狀態/說明/對應營運需求三欄）+ 狀態轉換（ASCII 流程）+ 關鍵轉換營運動機 + 與其他狀態機關係；轉換規則動機 wiki link 指 business-logic，不寫規則本體 |
| 流程／狀態／角色／資料 | scenario | `07-scenarios/_template-scenario.md` | 情境清單（觸發→角色傳遞 / 狀態鏈→具體例子含真實編號）+ 範疇外；每步「依某規則」wiki link 指 business-logic，不複寫規則 |
| 流程／狀態／角色／資料 | role | `03-roles/_template-role.md` | 基本資料 + 主要工作職責（非顯然把關補動機）+ 職責邊界（每條附「為什麼這樣切」）+ 關切點 + 預期阻力；分權判準指 business-logic；外部使用者角色 role 允許純文字 |
| 流程／狀態／角色／資料 | entity | `05-entities/_template-entity.md` | 核心欄位（非顯然欄位補「為什麼要存」）+ 關鍵關聯 + 相關狀態機；欄位業務規則 wiki link 指 business-logic、狀態指 state-machine |
| 操作步驟 | user-story | `13-user-stories/_template.md`（**沿用既有**，依本共同規格更新：補「這張卡要回答的問題」段 + source/implemented-by 對齊 + 自審 checklist 全面化為稽核維度）| 業務情境（穩定層，作為/我希望/以便/前置條件/業務流程/成功條件）+ UI 操作（易變層，stage=ui-bound 才填）+ 來源；source 禁指其他 user-story 卡、業務情境段禁 UI 措辭 / 禁中英夾雜 |
| 驗收項目 | test-case | `15-test-cases/_template-test-case.md`（對應 `15-test-cases/<module>/` 目錄亦待建）| 前置條件（可觀測具體值）+ 測試步驟（業務動作、禁 UI 點擊措辭）+ 預期結果（可勾稽驗收值）；**Vault 內只放 frontmatter + source（指 user-story）+ 連結，正文存 Notion**；正常／例外分區、案例之間不重疊且合起來涵蓋所有情況 |

### Template 元規格（七支共同骨架）

所有層的範本共用骨架，保證一致：

1. **Frontmatter 共同 5 欄**：`type` / `module` / `business-domain` / `status` / `last-reviewed`（對齊 [[wiki-schema#四、各 type 必填 Frontmatter 欄位]]）。
2. **往上指依據、往下指實作的雙欄（前進標準）**：`source`（往上指更上層卡 / 最上層的依據，**禁指同層 / 下層 / OpenSpec**）+ `implemented-by`（往下指 OpenSpec Requirement 標題層 / prototype / test-case，不承載正確性）+ 可選 `provenance-commit`（記上次對齊 commit SHA，供過時偵測）。
   - **遷移誠實標注（不假裝）**：現況 0 張商業邏輯卡有 source / implemented-by，全僅有 `related-spec`（§ 營運需求（Obsidian）與實作規格（OpenSpec）的分工 顛倒問題）。共同規格採 source / implemented-by 為前進標準，但**不要求一次全改**——新卡 / 被 change 異動的卡優先補，補不出 source 的標 `source-gap` 待專輪。`related-spec` 過渡期保留，語意等同 `implemented-by` 弱版。
3. **正文共同段**：(a) 一句話定位（卡頂引言 + 規則正本歸屬聲明）；(b) `## 這張卡要回答的問題`（以問句清單當骨架，每問句正文有對應結論，判斷「卡完整了沒」= 每問句是否都有結論，取代「大致 OK」非量化結論）；(c) `## 營運背景`（業務語言、無實作術語、無中英夾雜，主管 / PM 入口）；(d) `## 相關連結`（語意分類雙向 wiki link）；(e) `## 來源`（連回外部出處 + 末行 `迭代脈絡見 [[business-logic-changelog#<卡名>]]`，正文零迭代史）。
4. **連結指向位置用業務語意命名**：規則 / 狀態 / 條文的連結位置用業務語意命名（`#補收免審`），不用流水號、不重排、不重用；改規則只改內容、定位點不變 → backlink 不斷。
5. **規則與理由的寫法（可逐步勾稽）**：規則型卡每條規則寫「意圖→規則→為什麼」（套用既有規則→本案→結論，讓稽核可勾稽「推理有沒有跳過既有規則」）；設計理由先寫被駁回方案 + 逐條駁回理由，再承認被採納的好建議。
6. **自審稽核點（一份兩用的稽核面）**：範本末段附「Lint 自檢清單」，同一份既是撰寫檢查表也是 doc-audit / vault-audit 稽核維度（對齊 vault-audit 維度 13 / 14 的全面化）。
7. **不可違反的硬規則 vs 可視情況調整的彈性**：範本標注兩層——**不可違反的硬規則**：禁中英夾雜 / 業務段禁工程術語當主詞 / 識別不確定項 MUST 開獨立 OQ（禁 inline）/ source 禁指下游 / 正文零迭代史 / 規則單一正本不複寫；**可視情況調整的彈性**：純 UI change 可跳過序列協作四階段（對應 refine-invoice-tab 輕量處理）、局部欄位調整單 agent 輕量審查、無爭議事實段可用敘述代問句。彈性破口明示在範本，禁作者私自偏離。

### 歸類與增修機制

新內容該歸哪層、掛既有卡還是新增、change 結束後怎麼把 delta 增修進各位階（含歸類決策樹、新增 vs 掛既有的三道硬門檻、六步增修流程與 fan-out 稽核），詳見 `wiki-amend` skill。原則骨架：歸類前先把新內容拆成問句逐句判分層（守門三題任一為是即不進 Vault）；預設先試掛既有卡（呼應「禁新建抽象卡」），過硬門檻才新增獨立卡；change 一歸檔當下就回補不累積，沿七實體連帶矩陣與正本卡 backlink 攤「wiki 商業邏輯卡回補清單」，精準改到該段、一條規則只在一張卡寫完整，同步 changelog 並跟程式碼一起審。

## 增修卡片時必守的紀律

每次增修 Vault 卡片（無論掛既有或新增），MUST 附下列、且誠實面對不確定。

1. **每筆增修須附三件套**：
   - **建議**：歸哪一層、掛既有卡哪個 section 還是新增、連結位置怎麼命名。
   - **影響分析**：依 `wiki-amend` skill「改一處要連帶檢查會影響哪些卡」，沿七實體連帶矩陣 + 正本卡 backlink 列出連帶影響的卡清單，**量化 N/M/K，禁「大致 OK」非量化結論**。
   - **優缺點**：掛既有 vs 新增的取捨（如掛既有避免碎片化但可能職責不純；新增職責純但增加跨卡連結的維護成本）。
2. **無把握判斷時明說「不知道、背景不足」，不假裝**：缺乏足夠背景時不得編造結論充數；該補背景就觸發 `erp-planning-pre-check` 稽核或開 OQ，禁用模糊措辭掩蓋認知缺口（對應 CLAUDE.md「遇到不知道 MUST 立即再跑 pre-check，不能繞過去自編」）。

## 參考來源（設計時參考的外部實務，非卡內用語）

設計這套結構時，參考了分層管理（上層管下層、下層不牴觸上層）、上游需求文件與下游實作規格的分工、規格用範例呈現、變更後同步回補、變更日誌等既有實務。這些只是設計者查的參考，不當卡內或正文用語。
