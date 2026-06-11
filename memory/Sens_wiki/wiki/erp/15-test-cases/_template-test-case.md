---
type: meta
status: draft
last-reviewed: 2026-05-31
---

# 驗收項目卡（test-case）撰寫範本

> 給撰寫 UAT 業務層驗收項目卡（type=test-case）時複製套用，**這份範本同時是事後檢查的依據（寫的時候照著填，vault-audit 時照著勾）**。
>
> 對齊 [[erp_index]] § 二分層體系（驗收項目 = 最細的一層）+ § 七各層怎麼寫（前提→動作→驗收結果三段）+ `04-business-logic/_template-business-logic.md`（test-case 職責）+ [[wiki-schema#十一、卡類型內容職責邊界]]。
>
> **這類卡最關鍵的分工（讀前必懂）**：驗收項目卡的**正文（前置 / 步驟 / 預期結果）存 Notion ERP Test Case DB，Vault 內不放正文**。Vault 這張卡只承載 frontmatter（含往上指依據的 user-story `source` + 往下指被誰實作的 `implemented-by`）+ 相關連結；對應的 user-story 卡以 frontmatter `related-test-cases` 欄位填 Notion URL 回連。換言之：本目錄（`15-test-cases/<module>/`）的卡是「驗收索引卡」（指向 Notion 正文 + 往上指對應的 user-story），不是驗收正文本身。
>
> 推動步驟：本目錄（`15-test-cases/` 與其下 `<module>/` 子目錄）待建與試點遷入；增修進各位階的機制見 `wiki-amend` skill。本範本為先行定案的撰寫 / 檢查依據。

複製下方「範本開始 / 範本結束」之間的內容，存為 `15-test-cases/<module>/TC-<MODULE>-<NNN>-<簡述>.md`。`<module>` 對齊 [[wiki-schema#二、module Enum（多選）]]；`<MODULE>` 前綴對齊 [[wiki-schema#七、命名規約]]（QR / ORD / CR / AS / WO / PT / AR / QC / SHP / MM / PM / BM / XM）。

---

## 一、這類卡的定位（驗收項目，為什麼這樣設計）

| 維度 | 內容 |
|------|------|
| 定位 | 對某具體輸入作出可勾稽的驗收結論 |
| Sens type | `test-case`（UAT 業務層）|
| 職責 | 某具體輸入下的可勾稽**驗收結論**（最小單位、案例之間不重疊且合起來涵蓋所有情況、happy / edge 分區、明確結束點）|
| 往上指依據（source）| `user-story`（操作步驟）—— 驗收依操作步驟，**source 嚴禁指同層 / business-logic / OpenSpec**（依 § 四依據往上、實作往下；依據只往上指更上層的卡）|
| 往下指實作（implemented-by）| OpenSpec spec 檔層，不綁標題錨點 / Prototype 端對端測試（Playwright spec）—— 導航 / 覆蓋，不承載對不對 |
| 正文落點 | **Notion ERP Test Case DB**（Vault 不放正文）|
| 撰寫風格 | 前提→動作→驗收結果三段（前置條件 / 測試步驟 / 預期結果）|

依據鏈中本卡的位置（對齊 [[erp_index]]）：

```
驗收項目（本卡）TC-<MODULE>-NNN：某具體輸入 → 可勾稽驗收值
  │ source ▲（往上指操作步驟）
操作步驟  US-<MODULE>-NNN（user-story，單一角色執行某規則的步驟）
```

---

## 二、Frontmatter 範本（必填欄位標註）

> 共同 5 欄對齊 [[wiki-schema#四、各 type 必填 Frontmatter 欄位]]；往上指依據（source）、往下指實作（implemented-by）兩欄對齊 [[erp_index]]，為這類卡的前進標準。

```yaml
---
type: test-case                       # 固定值，必填
tc-id: TC-<MODULE>-<NNN>              # 必填，唯一鍵；NNN 三位補零（如 TC-ORD-001）
module:                               # 必填，對齊 wiki-schema § 二 module enum
  - <module>
business-domain:                      # 必填（test-case 屬商業邏輯正本卡群），對齊 wiki-schema § 二B 6 領域之一
  - <pre-sales | order-management | prepress | production | fulfillment-after-sales | billing-cash | cross-domain>
status: draft | active | deprecated   # 必填
last-reviewed: YYYY-MM-DD             # 必填
source:                               # 必填 ≥ 1，往上指依據（這張卡為什麼對）；MUST 指 user-story 卡（驗收依操作步驟）
  - "[[../13-user-stories/<module>/US-<MODULE>-<NNN>-<簡述>]]"
implemented-by:                       # 往下指被誰實作 / 覆蓋，不承載對不對；指 OpenSpec spec 檔層，不綁標題錨點 / Prototype e2e
  - "openspec/specs/<module>/spec.md"
  - "sens-erp-prototype/tests/e2e/<spec>.spec.ts"   # 若已實作
provenance-commit: <SHA>             # 可選但建議：記上次對齊 commit，供 stale 偵測
last-passed-at: YYYY-MM-DD           # 可選：上次驗收通過日期（UAT 執行後回填）
---
```

**欄位規約重點**：
- `source` 往上指依據 user-story（操作步驟），**嚴禁**指同層 test-case / 下層 / business-logic / OpenSpec（會讓依據鏈斷在驗收這一層、回不到最上層的依據，且接成一圈）。
- `implemented-by` 往下指實作 OpenSpec spec 檔層，不綁標題錨點 + Prototype e2e；本欄不參與對不對，只供導航。
- `source` 往上、`implemented-by` 往下，兩個方向不會接回自己 → 結構上不可能讓依據鏈繞回原點。
- **遷移誠實標注**：現況 user-story 卡的 `related-test-cases` 多為空（`[]`）、本目錄尚未建。新卡優先補齊 source / implemented-by；補不出上層 user-story 的標 `source-gap`（暫時補不出上層依據，標記待之後補）待專輪（§ 十一待拍板），過渡期保留但不假裝有依據。

---

## 三、章節骨架（佔位符 + 每節「該寫 / 不該寫」一句指引）

> 共同 4 段（一句話定位 / 這張卡要回答的問題 / 營運背景 / 相關連結 / 來源）對齊 `04-business-logic/_template-business-logic.md` 的共同骨架；這類卡特有的前提→動作→驗收結果三段（前置條件 / 測試步驟 / 預期結果）對齊 [[erp_index]]。
>
> **這三段的正文存 Notion**；Vault 卡內僅以「指引佔位」呈現結構（讓讀者知道 Notion 那邊該長什麼樣 + 供檢查勾稽），**不在 Vault 重抄 Notion 正文**。

--- 範本開始 ---

```markdown
---
type: test-case
tc-id: TC-XX-NNN
module:
  - <module>
business-domain:
  - <領域>
status: draft
last-reviewed: 2026-MM-DD
source:
  - "[[../13-user-stories/<module>/US-XX-NNN-<簡述>]]"
implemented-by:
  - "openspec/specs/<module>/spec.md"
---

# TC-XX-NNN <標題：被驗收的對象，名詞片語，繁體中文>

> 一句話定位：本卡驗收哪張操作步驟（user-story）的哪個情境、屬哪個業務領域，並聲明「本卡正文存 Notion、Vault 僅承載索引與往上指依據」。
> 該寫：驗收對象 + 對應 user-story + 領域。不該寫：規則動機長篇（屬 business-logic）。

## 這張卡要回答的問題

> 先列本卡要回答的關鍵驗收問題，每個問題在 Notion 正文有對應的驗收結論。判斷「這張卡完整了沒」= 每個問題是否都有對應的 happy / edge 驗收項覆蓋（給數字，非「大致 OK」）。
> 該寫：以問題列出本卡須勾稽的驗收點（如「補收正項是否真的免主管審核、直達已執行？」「退款金額為負時系統是否擋下並要求走退款款項？」）。不該寫：問題的答案敘述（答案在 Notion 正文的預期結果）。

- <驗收問題 1，對應某 happy / edge 項>
- <驗收問題 2>

## 營運背景

> 為什麼需要驗收這件事（連回 user-story 的營運動機，2-3 句、業務語言、無實作術語）。主管 / PM 入口：讀完應能判斷「這個驗收點對不對應到我們的生意」。
> 該寫：這個驗收點對應營運上的什麼把關 / 風險。不該寫：UI 操作步驟、欄位英文名當主詞。

<2-3 句業務語言>

## 測試案例索引（正文存 Notion）

> 本段是 Notion 正文的「結構鏡像 + 勾稽檢查點」，**不重抄 Notion 正文**。逐案列：案例編號（對齊 Notion）+ 一行情境摘要 + happy / edge 標記。實際前提→動作→驗收結果三段（前置 / 步驟 / 預期）填在 Notion。
> 該寫：案例清單 + happy / edge 分區 + 自證案例之間不重疊、合起來涵蓋所有情況。不該寫：完整前置 / 步驟 / 預期正文（在 Notion）。

### Happy Path（正常情境）

| 案例編號 | 情境摘要（一行）| Notion 連結 |
|---------|---------------|------------|
| <TC-XX-NNN-H1> | <一行業務情境，含具體輸入值>| <Notion URL #案例> |

### Edge Case（邊界 / 異常情境，與 happy 實體分區）

| 案例編號 | 情境摘要（一行）| Notion 連結 |
|---------|---------------|------------|
| <TC-XX-NNN-E1> | <一行邊界 / 異常情境，含具體觸發值>| <Notion URL #案例> |

> 前提→動作→驗收結果三段在 Notion 正文的撰寫規約（給填 Notion 時對照，Vault 不重抄）：
> - **前置條件（前提，可觀測具體值）**：觸發此驗收的可觀測前置狀態，用具體值非抽象範圍（「訂單 #ORD-2026-0512 狀態=訂單完成、已開發票 1000、應收 1000」，非「訂單已完成且有發票」）。
> - **測試步驟（動作，業務動作）**：執行的業務動作，**禁 UI 點擊措辭**（寫「業務對該訂單發起補收 6000」，非「點訂單詳情頁→按新增訂單異動→選補收→輸入 6000→按送出」）。
> - **預期結果（驗收結果，可勾稽驗收值）**：可勾稽的具體驗收值，**非「做了沒」**（寫「訂單異動狀態=已執行、應收由 1000 變 7000、未產生待主管審核項」，非「補收成功」）。

## 相關連結

> 語意分類雙向可達（對齊 writing-guide 原則 7 五類）。本卡至少回連 source 的 user-story；其餘視驗收涉及範圍補。
> 該寫：分類 wiki link。不該寫：純文字提及概念卻不設連結（連到不存在的卡）。

- 操作步驟（source 往上指依據）：[[../13-user-stories/<module>/US-XX-NNN-<簡述>]]
- 相關規則（規則正本）：[[../04-business-logic/<規則卡>]]
- 相關狀態（驗收涉及的狀態轉換）：[[../06-state-machines/<狀態機卡>]]
- 相關角色（執行 / 把關此驗收的角色）：[[../03-roles/<角色卡>]]
- 相關實體（驗收作用的資料實體）：[[../05-entities/<實體卡>]]

## 來源

> 連回可獨立驗證的外部出處（user-story 操作步驟 + 其指向的真實業務情境 / 拍板 OQ）。禁指向其他同層 test-case 卡。
> 末行加迭代脈絡指標（正文零迭代史）。

- 操作步驟：[[../13-user-stories/<module>/US-XX-NNN-<簡述>]]
- 真實業務情境素材：<[[../04-business-logic/<情境卡>]] 或 Notion 業務情境 DB §>
```

--- 範本結束 ---

---

## 四、案例編號命名規約（用業務語意命名，不用流水號）

> 對齊 [[erp_index]]。

- 這類卡的「案例編號」（如 `TC-XX-NNN-H1` / `-E1`）採**語意 + 序列**標記，**H = happy、E = edge** 的語意前綴穩定不變；序號在同一分區內遞增。
- 改某案例內容只改 Notion 正文，**案例編號（連結指向的位置）不變、不重排、不重用**，使 user-story `related-test-cases` 與回連連結不斷。
- 刪除某案例時編號**退役（不重用）**，避免歷史連結指向錯誤的案例。
- 不使用無語意流水號（如 `case-1`）作為跨卡引用的定位點。

---

## 五、不可違反的硬規則 vs 可視情況調整的彈性（本卡標注）

**不可違反（硬規則）**：
- 禁中英夾雜（英文欄位 / 實體名一律介面中文，技術詞括號附註）。
- 營運背景段禁工程術語 / 英文欄位名當主詞。
- `source` 禁指同層 / business-logic / 下層 / OpenSpec（只往上指 user-story 操作步驟）。
- Vault 卡內**禁放 test-case 正文**（前置 / 步驟 / 預期正文在 Notion）。
- 禁放 SIT / UT 等技術測試（這類卡只收 UAT 業務層驗收）。
- happy path 與 edge case **分成兩張表**（不混在同一表）。
- 正文零迭代史（歷史見 wiki/log.md 與 git）。
- 識別到不確定項 MUST 開獨立 OQ（[[oq-manage]] mode B），禁 inline 標注 / 禁 `[!question]` callout。

**可視情況調整（明示彈性，禁作者私自偏離）**：
- 單一操作步驟（user-story）對應的驗收案例數量不固定：簡單規則可只 1 個 happy + 1 個 edge；複雜規則（如補退不對稱、對帳一致性）可多個 edge 分項，以**案例之間不重疊、合起來涵蓋所有情況**為準、非以數量為準。
- 無邊界情境的驗收卡（如純查詢型驗收）edge 區可標「無邊界案例（N/A）」並說明理由，不強湊。
- 「相關連結」五類非每類必填，依本卡實際涉及範圍補（但 source 往上指依據的 user-story 必連）。

---

## 六、自審檢查清單（撰寫完逐項打勾，這份清單同時是 vault-audit 的檢查依據）

> 寫的時候當檢查表、事後當檢查尺。對齊 vault-audit 維度 14（卡類型內容職責邊界）在這類卡的展開。

**Frontmatter**
- [ ] 共同 5 欄全填（type=test-case / tc-id / module / business-domain / status / last-reviewed）。
- [ ] `source` ≥ 1 且指向 user-story 卡；**未指**同層 test-case / business-logic / 下層 / OpenSpec。
- [ ] `implemented-by` 指 OpenSpec spec 檔層，不綁標題錨點 / Prototype e2e（導航用，可暫缺但建議補）。
- [ ] manifest（`memory/erp/notion-publish-manifest.md`）已有本卡列（正文落點 URL 在 manifest，不入 frontmatter）。
- [ ] 補不出上層 user-story 者已標 `source-gap`（不假裝有依據）。

**內容職責邊界（維度 14 在這類卡的展開）**
- [ ] Vault 卡內**未放** test-case 正文（前置 / 步驟 / 預期的完整內容在 Notion，Vault 僅索引）。
- [ ] **未含** SIT / UT 技術測試內容。
- [ ] **未含** user-story 格式範本（作為 / 我希望 / 以便）/ 規則本體與計算公式（屬 business-logic）。

**要回答的問題與覆蓋**
- [ ] 「這張卡要回答的問題」段每個問題都有對應的 happy / edge 驗收項覆蓋（給數字，非「大致 OK」）。
- [ ] happy path 與 edge case **分成兩張表**。
- [ ] 邊界案例**之間不重疊、合起來涵蓋所有情況**、有明確結束點；無邊界時已標 N/A 並說明。

**撰寫風格（前提→動作→驗收結果，對 Notion 正文亦適用）**
- [ ] 前置條件用**可觀測具體值**（真實編號 / 金額 / 狀態），非抽象範圍。
- [ ] 測試步驟用**業務動作**，**禁 UI 點擊措辭**（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Side Panel / 表格欄位 / 篩選器）。
- [ ] 預期結果為**可勾稽驗收值**（具體狀態 / 金額變化 / 一定要成立的規則），**非「做了沒 / 成功了沒」**。

**共同（所有層）**
- [ ] 營運背景段無實作術語當主詞、無中英夾雜（技術詞括號附註）。
- [ ] 正文零迭代史（歷史見 wiki/log.md 與 git）；正文零「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」inline OQ 措辭（→ [[oq-manage]] mode B）。
- [ ] 相關連結雙向可達、語意分類；至少回連 source 往上指依據的 user-story；沒有連到不存在的卡、也不是沒人連到的孤島卡。
- [ ] 案例編號採語意前綴（H / E），不重排 / 不重用 / 退役不回收。
- [ ] **最後驗收**：營運背景與「這張卡要回答的問題」抽一句，問「Miles / 主管不看程式碼能否懂這在驗什麼」。

---

## 七、極簡填寫示意（佔位符示意，非真實內容）

> 僅示意結構與 happy / edge 分區、前提→動作→驗收結果三段的措辭分寸；真實內容（真實編號 / 金額 / Notion URL）留帶實例階段填。

```markdown
---
type: test-case
tc-id: TC-ORD-001
module:
  - 訂單管理
business-domain:
  - 款項與發票
status: draft
last-reviewed: 2026-MM-DD
source:
  - "[[../13-user-stories/order-management/US-ORD-NNN-<補收免審>]]"
implemented-by:
  - "openspec/specs/order-management/spec.md"
---

# TC-ORD-001 <補收正項免審直達已執行之驗收>

> 一句話定位：驗收 [[../13-user-stories/order-management/US-ORD-NNN-<補收免審>]] 之補收免審；屬款項與發票（billing-cash）；正文存 Notion，本卡僅索引與往上指依據。

## 這張卡要回答的問題

- <補收正項是否免主管審核、直達已執行？>（對應 H1）
- <退款負項是否被擋下並要求走退款款項路徑？>（對應 E1）

## 營運背景

<客戶主動加印屬營運上不該被主管流程卡住交期的情況，須驗收補收正項免審；反向退款涉現金流出須把關，須驗收被攔。>

## 測試案例索引（正文存 Notion）

### Happy Path（正常情境）

| 案例編號 | 情境摘要（一行）| Notion 連結 |
|---------|---------------|------------|
| TC-ORD-001-H1 | <某已完成訂單，業務發起補收某正額 → 直達已執行> | <Notion URL> |

### Edge Case（邊界 / 異常情境）

| 案例編號 | 情境摘要（一行）| Notion 連結 |
|---------|---------------|------------|
| TC-ORD-001-E1 | <同訂單發起負額（退款）→ 被攔、改走退款款項路徑> | <Notion URL> |

## 相關連結

- 操作步驟（source 往上指依據）：[[../13-user-stories/order-management/US-ORD-NNN-<補收免審>]]
- 相關規則：[[../04-business-logic/<訂單異動規則>]]
- 相關狀態：[[../06-state-machines/訂單異動狀態]]
- 相關角色：[[../03-roles/業務]]、[[../03-roles/業務主管]]
- 相關實體：[[../05-entities/訂單]]

## 來源

- 操作步驟：[[../13-user-stories/order-management/US-ORD-NNN-<補收免審>]]
- 真實業務情境素材：[[../04-business-logic/payment-invoice-scenarios]] §<對應情境>
```

---

## 八、參考

- [[erp_index]] — Wiki 結構與撰寫規範（驗收項目這層的定位、依據往上實作往下、撰寫風格、推動步驟）
- `04-business-logic/_template-business-logic.md` — test-case 職責（正文存 Notion、source 指 user-story）
- [[wiki-schema#十一、卡類型內容職責邊界]] — 維度 14 lint 依據
- [[wiki-schema#七、命名規約]] — 模組前綴與檔名規約
- `07-scenarios/_template-business-scenario.md` — 業務情境範本（驗收的上游單元；原 user-story 已併入業務情境，本範本的 source 對象與分工待對齊輪更新）
- [[log]] — 全知識庫唯一操作史（卡的歷史 = 搜 `[[卡名]]` + git）
- [[oq-manage]] — 識別不確定項時開獨立 OQ 卡
