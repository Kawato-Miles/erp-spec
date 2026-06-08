---
type: meta
status: active
last-reviewed: 2026-05-31
---

# User Story 卡範本（操作步驟層）

> 給 [[erp-user-story]] skill 與 Miles 手動撰寫時複製套用。這類卡的定位：操作步驟（單一角色執行某條規則的步驟，照著做的流程），見 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）]]。
> 本範本同時是「寫的時候照著填」與「事後照著檢查」。底部「自審稽核清單」同一份既是提交前自檢、也是 [[wiki-schema#維度 13：User Story 撰寫紀律（Phase 3 待 vault-audit 實作）|vault-audit 維度 13]] 的稽核維度。
> 規範正本：[[wiki/erp/13-user-stories/README]]（命名 / 來源）+ [[wiki-schema#type=user-story]]（frontmatter 正式 schema + 維度 13 lint）+ [[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|writing-guide § 4.0]]（各類卡的職責邊界）。本範本是上述三者在 user-story 這層的展開，不衝突。
>
> **單階段（2026-06-01 自兩階段收斂）**：user story 只寫業務情境（含 Gherkin 成功條件），不含 UI 操作層。介面驗收下移 [[erp-test-case]]（業務級）+ Prototype 端對端測試（UI 點擊層）。已移除 `stage` / `ui-binding` 欄位與「UI 操作（易變層）」段。

## 怎麼用這份範本

1. 複製下方 `--- 範本開始 ---` 與 `--- 範本結束 ---` 之間的內容。
2. 存為 `13-user-stories/<module>/US-<MODULE>-<NNN>-<簡述 slug>.md`（命名規約見 [[wiki/erp/13-user-stories/README#三、命名規約]]）。
3. 依各段「該寫 / 不該寫」一句指引填寫；佔位符 `<...>` 全部換成真實內容。
4. 提交前逐項打勾底部「自審稽核清單」。

## 不可違反的硬規則 vs 可視情況調整的彈性

> 對齊 [[business-logic-writing-guide]] 骨架七「不可違反的硬規則搭配可視情況調整的彈性」。下列兩層界線明示在範本，禁作者私自偏離。

### 不可違反（硬規則，極少且硬）
- 全卡**禁含 UI 措辭**（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）；UI 點擊操作不寫進 user story（歸 Prototype e2e），介面層級驗收歸 [[erp-test-case]]。
- 全卡**禁中英夾雜**：英文欄位名 / 實體名一律轉介面中文（付款紀錄 / 印件 / 訂單異動 / 需求單 / 工單 / 生產任務 / 審稿輪次 / 付款計畫 / 售後服務單 等），技術代號須以括號附註、不得當主詞。
- **規則本體不寫進 user-story 卡**：本卡只描述「角色怎麼執行某條規則的步驟」，規則的觸發條件 / 判斷 / 計算公式以 `source` 指向 [[../04-business-logic|business-logic]] 規則正本卡，不在本卡重述。
- `source` ≥ 1 條，且**禁指向其他 user-story 卡**（防止 AI 拿自己寫的東西當依據再生出新東西）；`source` 往上指依據（規則正本 / 最上層的依據），**不指同層 / 下層 / OpenSpec 當正確性根據**（見 [[wiki-architecture#依據往上、實作往下，連結不繞回自己]]）。
- **正文只寫現在的規則**（哪版改的 / 廢止什麼進 [[business-logic-changelog]]）；**正文不出現待釐清的問題措辭**（「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」識別到即觸發 [[oq-manage]] mode B 開獨立卡，原處改 wiki link）。
- **單一角色單一情境**：禁統合多角色 / 多動作的串接故事（跨多角色端到端流程 → [[wiki/erp/07-scenarios/README|07-scenarios]]）。

### 可視情況調整（彈性破口）
- **「這張卡要回答的問題」段**：若本故事的執行步驟全屬無爭議事實（無待拍板項），該段可只寫「無待回答問題」一行，不強行湊問題。
- **前置條件 / 業務流程**步驟數依故事複雜度增減；但成功條件維持 2-5 條 Gherkin 情境（超過 5 建議 split story），每條守單一 When + 單一 Then。
- **成功條件涵蓋類型**：依故事性質可只正向達成型、或併含禁止/守衛型（如「訂單完成後不可建訂單異動」），以可驗證為準。

---

--- 範本開始 ---

```markdown
---
type: user-story
us-id: US-<MODULE>-<NNN>                       # 沿用 Notion 既有編碼；MODULE 前綴見 README § 三
module:
  - <module>                                    # 對齊 wiki-schema § 二 module enum
business-domain:
  - <6 領域之一>                                # pre-sales / order-management / prepress / production / fulfillment-after-sales / billing-cash（cross-module 故事用 cross-domain）
role:
  - "[[../../03-roles/<角色卡>]]"               # wiki link 至 03-roles/；單一角色（外部 B2C 會員可純文字，見 wiki-schema 維度 13 Lint 例外）
priority: high | medium | low
status: draft | active | deprecated
created-at: 2026-MM-DD
last-reviewed: 2026-MM-DD
source:                                         # 往上指依據＝正確性根據，必填 ≥ 1；禁指其他 user-story 卡 / 禁指 OpenSpec 當正確性根據
  - "[[../../04-business-logic/<規則正本卡>#<業務語意定位點>]]"   # 本故事執行的規則正本（首選）
  - "<最上層的依據：Miles 拍板 / 印刷業實務 / raw 卡 / 訪談紀錄>" # 或可獨立驗證的外部出處
implemented-by:                                 # 往下指被誰實作＝導航 / 覆蓋（不承載正確性），可選
  - "openspec/specs/<module>/spec.md"
  - "sens-erp-prototype/tests/e2e/<spec>.spec.ts"  # Prototype 端對端測試（UI 點擊層歸此）
provenance-commit: <SHA>                         # 可選但建議：上次對齊的 commit，供 stale 偵測
related-spec: openspec/specs/<module>/spec.md   # 過渡期保留（語意＝implemented-by 弱版）；新卡優先填 source / implemented-by
related-scenarios:                              # 上層情境：本故事被哪個端到端情境串起（可選）
  - "[[../../07-scenarios/<情境卡>#<段>]]"
related-business-logic:                         # 相關規則：本故事執行的規則正本（可選；與 source 可重疊）
  - "[[../../04-business-logic/<規則卡>]]"
related-entities:                              # 相關實體：本故事作用的資料實體（可選）
  - "[[../../05-entities/<實體卡>]]"
related-test-cases:                            # 往下的驗收：Vault test-case 卡 wiki link（2026-06-01 由 Notion URL 改）
  - "[[../../15-test-cases/<module>/TC-<MODULE>-<NNN>-<簡述>]]"
prerequisites:                                 # 相依性：本 US 執行前須完成的前置（禁用串接故事代替）
  - "[[US-<MODULE>-<NNN>-<前置故事>]]"          # 其他 user story（具體 wiki link）
  - "<系統行為或角色準備動作的文字描述>"        # 如「系統自動分派完成」「審稿主管已維護能力等級」
source-gap: false                              # 補不出上層依據時設 true，待專輪回填
notion-published-at: 2026-MM-DD                 # 推送後填
notion-page-url: <URL>                          # 推送後填
---

# US-<MODULE>-<NNN> <標題：動詞 + 名詞片語，繁體中文>

> 一句話定位：本卡是「<角色>」執行「<哪條規則 / 哪個業務動作>」的操作步驟（單一角色單一情境）。規則本體見 source 指向的規則正本卡，本卡只管「這個角色怎麼一步步做到」。
> <該寫：這張卡是什麼、屬哪角色 / 哪業務領域、與規則正本的引用關係。不該寫：規則的判斷邏輯與計算公式（那是規則正本卡的職責）。>

## 這張卡要回答的問題

> 先列本故事要回答的關鍵執行問題，每個問題在下文有對應結論。判斷「這張卡完整了沒」＝每個問題都有對應結論（取代「大致 OK」非量化結論）。
> <該寫：本故事執行上尚需釐清 / 已拍板的關鍵問題（如「金額校正後要不要重新送審？」「補件第幾輪該升級？」），每題正文（前置條件 / 業務流程 / 成功條件）有對應結論。不該寫：規則本身對不對的辯論（那屬規則正本卡 / OQ）。無待回答問題時寫「無待回答問題」一行即可。>

- <問題 1：本故事在某步驟的執行決策？> → 結論見「<對應段落>」
- <問題 2：邊界情況怎麼處理？> → 結論見「成功條件第 N 條」

## 業務情境

> 純業務描述。**禁含 UI 措辭**（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）；**禁中英夾雜**（付款紀錄 / 印件 / 訂單異動 等介面中文）。UI 改版不動本卡（UI 點擊歸 Prototype e2e、介面層級驗收歸 [[erp-test-case]]）。

### 作為
[[../../03-roles/<角色名>]]
> <該寫：單一角色 wiki link。不該寫：多角色並列（多角色 → 拆成多張 user story 或進 07-scenarios）。>

### 我希望
<一句話業務動作；用介面中文；禁英文欄位名；建議 ≤ 30 字（INVEST 之 Small＝夠小）>
> <該寫：角色想完成的單一業務動作。不該寫：UI 操作步驟、規則判斷條件。>

### 以便
<業務價值；可量化更佳，如「補件迴圈 ≤ 3 輪」「審稿員 5 分鐘內可接到通知」>
> <該寫：這個動作的業務價值（為什麼值得做），對應 INVEST 之 Valuable（對使用者有價值）。這是本故事「為什麼要這樣做」的價值說明（規則為何這樣執行的價值根據以 source 連回規則正本，本段不重述規則）。不該寫：實作細節。>

### 前置條件
- <條件 1：執行本故事前系統 / 資料 / 角色須處於的狀態，業務語言>
- <條件 2>
> <該寫：前提→動作→驗收結果三段之「前提條件（觸發 / 前提）」，可觀測的業務狀態。不該寫：UI 措辭。複雜相依改用 frontmatter prerequisites。>

### 業務流程

> 描述「業務動作」而非「UI 操作」。例：「審稿員確認稿件符合印刷規格」（業務）vs「審稿員點擊『通過』按鈕」（UI）。對應前提→動作→驗收結果三段之「動作」。

1. <步驟 1，業務動作；步驟只留執行所需，動機放「以便」段，不在步驟夾長篇 why>
2. <步驟 2>
3. <步驟 3：若某步「依某規則」，以 wiki link 指向 [[../../04-business-logic/<規則卡>#<slug>]]，不重述規則本體>

### 成功條件（acceptance criteria）

> Gherkin 框架：每條寫成一個情境（Scenario / Given / When / Then）。2-5 條（超過 5 建議 split story）；每條守**單一 When + 單一 Then**（多個獨立 When → 拆條或 split story），Given 可疊加。業務 outcome 級、**禁 UI 措辭**（UI 點擊歸 Prototype e2e）；守衛規則本體以 wiki link 指 [[../../04-business-logic/<規則卡>]]，本段只寫「驗收得到什麼」。涵蓋正向達成型與禁止/守衛型。每條為一個 Test Case 取材種子（正向→happy / 守衛→edge）。

- 情境：<正向達成，一行描述>
  - Given <前置狀態，可多條>
  - When <單一業務動作，對應「我希望」>
  - Then <單一可觀測結果，如「產生與需求單一致的訂單草稿」>
- 情境：<禁止/守衛，一行描述>
  - Given <某狀態，如 訂單狀態=訂單完成>
  - When <嘗試某動作，如 業務嘗試建立訂單異動>
  - Then <不允許/被擋下，如 系統不允許建立>

## 來源

> 必填 ≥ 1 條，與 frontmatter `source` 對齊。指向規則正本卡 / 最上層的依據（raw / 訪談 / 法規 / 拍板 OQ / Miles 拍板）；**禁指向其他 user-story 卡**（防止 AI 拿自己寫的東西當依據再生）。往下指被誰實作（OpenSpec Requirement / Prototype）寫在 `implemented-by`，不混進 source。

- 規則正本：[[../../04-business-logic/<規則卡>#<slug>]]（本故事執行的規則完整定義在此）
- 最上層的依據 / 拍板：<Miles 拍板 / 印刷業實務 / [[../../08-open-questions/<OQ>]] / raw 卡>
- <若補不出上層依據：frontmatter 標 `source-gap: true`，於此註明缺口待專輪回填>

迭代脈絡見 [[business-logic-changelog#US-<MODULE>-<NNN> <標題>]]（正文只寫現在的規則）。
```

--- 範本結束 ---

## 極簡填寫示意（佔位符版，真實內容留帶實例階段）

> 僅示意各段該長什麼樣，非真實 user story。真實撰寫見既有卡（如 US-ORD-026 / US-ORD-035）。

```markdown
---
type: user-story
us-id: US-XX-099
module:
  - <module>
business-domain:
  - <領域>
role:
  - "[[../../03-roles/<角色>]]"
priority: medium
status: draft
created-at: 2026-MM-DD
last-reviewed: 2026-MM-DD
source:
  - "[[../../04-business-logic/<規則卡>#<slug>]]"
  - "<Miles 拍板 / raw 卡>"
implemented-by:
  - "openspec/specs/<module>/spec.md"
related-spec: openspec/specs/<module>/spec.md
source-gap: false
---

# US-XX-099 <動詞 + 名詞片語>

> 一句話定位：本卡是「<角色>」執行「<規則 / 動作>」的操作步驟。規則本體見 source。

## 這張卡要回答的問題
- <問題>？ → 結論見「成功條件第 N 條」

## 業務情境

### 作為
[[../../03-roles/<角色>]]

### 我希望
<單一業務動作，介面中文，≤ 30 字>

### 以便
<業務價值，可量化更佳>

### 前置條件
- <可觀測業務前提>

### 業務流程
1. <業務動作>
2. <依某規則時 wiki link 指 [[../../04-business-logic/<規則卡>#<slug>]]，不重述規則>

### 成功條件（acceptance criteria）
- 情境：<正向達成>
  - Given <前置狀態>
  - When <業務動作>
  - Then <可觀測結果>
- 情境：<禁止/守衛>
  - Given <某狀態>
  - When <嘗試某動作>
  - Then <不允許/被擋下>

## 來源
- 規則正本：[[../../04-business-logic/<規則卡>#<slug>]]
- 最上層的依據：<Miles 拍板 / raw / OQ>

迭代脈絡見 [[business-logic-changelog#US-XX-099 <標題>]]。
```

## 自審稽核清單（撰寫完逐項打勾，同為 vault-audit 維度 13 稽核基準）

> 一份兩用：寫的時候照著勾、審的時候照著驗。對齊 [[wiki-schema#維度 13：User Story 撰寫紀律（Phase 3 待 vault-audit 實作）|維度 13]] + [[wiki-schema#維度 14：卡類型內容職責邊界（2026-05-28 新增）|維度 14]] + [[business-logic-writing-guide#六、營運驗證寫法 該做 / 不該做|writing-guide § 六]]。分四面向。

### A. Frontmatter（schema 對齊）
- [ ] 共同必填全填：`type=user-story` / `us-id` / `module` / `business-domain` / `role` / `priority` / `status` / `created-at` / `last-reviewed`。
- [ ] `source` ≥ 1 條，且**不指向其他 user-story 卡**、**不指 OpenSpec 當正確性根據**（OpenSpec / Prototype 寫 `implemented-by`）。
- [ ] `source` 往上指依據（規則正本 / 最上層的依據）；補不出時 `source-gap: true` 並於來源段註明。
- [ ] `role` 為 wiki link 至 `03-roles/`（外部 B2C 會員例外，見維度 13 Lint 例外）。
- [ ] 跨故事相依以 `prerequisites` 記錄（非靠串接故事串起來）。

### B. 內容職責邊界（維度 14：操作步驟層單一職責）
- [ ] **單一角色單一情境**：非串接故事；跨多角色端到端流程已改放 07-scenarios。
- [ ] **規則本體未寫進本卡**：規則判斷 / 計算公式以 source / wiki link 引用規則正本，本卡只寫執行步驟。
- [ ] 業務情境段含「作為 / 我希望 / 以便 / 前置條件 / 業務流程 / 成功條件」全部 H3。
- [ ] 「這張卡要回答的問題」段每個問題正文（前置條件 / 業務流程 / 成功條件）有對應結論；無待拍板項時寫「無待回答問題」。

### C. 硬規則（不可違反）
- [ ] 全卡 grep 無 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）；UI 點擊歸 Prototype e2e。
- [ ] 全卡 grep 無未轉中文的英文欄位名（payment / printItem / orderAdjustment / quoteRequest / workOrder / productionTask / reviewRound / paymentPlan / afterSalesTicket 等）；技術代號皆括號附註不當主詞。
- [ ] 正文只寫現在的規則（改版歷史在 [[business-logic-changelog]]）；正文不出現待釐清的問題措辭（「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」→ 已觸發 [[oq-manage]] mode B 開卡、原處改 wiki link 引用）。
- [ ] 全卡無 emoji / 視覺符號。

### D. 可驗證性與可達性（前提→動作→驗收結果 + 完整關聯）
- [ ] 成功條件為 Gherkin 情境（每條含 Given/When/Then）；2-5 條；每條守單一 When + 單一 Then（多個獨立 When → 拆條或 split）；Then 用可觀測具體值（金額 / 狀態名 / 是否允許）非「做了沒」；涵蓋正向達成型，視情況含禁止/守衛型。
- [ ] 「我希望」≤ 30 字（INVEST 之 Small＝夠小、一個 Sprint 可完成）；「以便」明示業務價值（INVEST 之 Valuable＝對使用者有價值）。
- [ ] 卡內提到的每個被 Vault 收錄的概念（角色 / 規則 / 狀態 / 實體 / 情境）皆設 wiki link，語意分類（上層情境 / 相關規則 / 相關角色 / 相關實體 / 相關狀態），不連到不存在的卡（dangling），也不是沒有任何卡連到它的孤島卡（orphan）。
- [ ] 「最後驗收：抽一句問主管不看程式也看得懂嗎」：業務情境段抽一句，問「Miles / 主管不看程式碼能否懂這個角色在做什麼」。
- [ ] 命名符合 `US-<MODULE>-<NNN>-<slug>.md`；`related-spec` / `implemented-by` 指向實際存在的 spec 路徑。

## INVEST 對照（自審輔助）

> 撰寫時用 INVEST 六面向反思，對應上方稽核清單。

| 字母 | 含義 | 自審問題 | 對應稽核項 |
|------|------|---------|-----------|
| **I** | Independent（可獨立） | 可獨立交付？不靠串接故事撐起？相依以 prerequisites 記錄？ | B |
| **N** | Negotiable | 預留討論空間？未過度規範實作（UI）細節？ | C |
| **V** | Valuable | 「以便」明示業務價值、可向利害關係人解釋？ | D |
| **E** | Estimable | 描述夠具體可估規模？非含糊到無法估？ | D |
| **S** | Small | 一個 Sprint 可完成？acceptance criteria ≤ 5 條？「我希望」≤ 30 字？ | D |
| **T** | Testable | 成功條件可觀測具體值？Test Case 能直接從 acceptance criteria 設計？ | D |

## 參考

- [[wiki/erp/13-user-stories/README]] — 13-user-stories 入口（命名 / 來源 / 禁串接故事）
- [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）]] — 操作步驟層定位 + 往上指依據、連結不繞回自己
- [[wiki-schema#type=user-story]] — frontmatter 正式 schema
- [[wiki-schema#維度 13：User Story 撰寫紀律（Phase 3 待 vault-audit 實作）]] — 維度 13 lint 規則
- [[wiki-schema#維度 14：卡類型內容職責邊界（2026-05-28 新增）]] — 維度 14 內容職責邊界
- [[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）]] — 各類卡的職責邊界（user-story = role 執行 business-logic 的步驟）
- [[business-logic-changelog]] — 改版歷史獨立檔（正文只寫現在的規則）
- [[erp-user-story]] — 自動化 skill（mode A 新增 / mode B 補 UI / mode C 推 Notion）
- [[oq-manage]] — 識別到不確定項時觸發 mode B 開 OQ 卡
