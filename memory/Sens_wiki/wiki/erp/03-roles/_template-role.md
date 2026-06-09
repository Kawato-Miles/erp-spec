---
type: meta
status: draft
last-reviewed: 2026-05-31
---

# 角色卡撰寫範本

> 角色卡（`type=role`，`03-roles/`）撰寫範本。對齊 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）|wiki-architecture 分層體系]]（角色屬「流程／狀態／角色／資料」這一層：把上層的營運價值與業務規則，展開為「誰做什麼、誰把關什麼」的執行形式）。
>
> 這份範本同時是「寫的時候照著填」和「事後照著檢查」：撰寫時照著填，事後 `vault-audit` 照著勾。共同骨架保證六層範本一致——不同人／agent 寫同類卡落在同一結構。
>
> 與其他規約的分工：[[wiki-schema#四、各 type 必填 Frontmatter 欄位|wiki-schema § 四]] 管 frontmatter 必填欄位；[[wiki-schema#十一、卡類型內容職責邊界（2026-05-28 新增）|wiki-schema § 十一]] 管卡類型內容邊界；[[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|business-logic-writing-guide § 4.0]]＋[[business-logic-writing-guide#4.5 role 卡（角色職責，前置營運痛點）|§ 4.5]] 管 role 卡正文撰寫範式。本範本是上述三者在角色卡這一層的交集落地。

## 一、這類卡的職責（先讀，再填）

`type=role` 單一職責：**這個角色做什麼、把關什麼**（職責動作 + 權限 + 職責邊界 + 痛點）。撰寫前 MUST 讀：

- [[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|business-logic-writing-guide § 4.0]]（role 的「該寫 / MUST NOT 寫」越界表）
- [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）|wiki-architecture § 分層體系]]（role 在分層體系中的位置：流程／狀態／角色／資料這一層，下不牴觸上）

**role 卡的該寫 / MUST NOT 寫**（[[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|§ 4.0]] 越界表）：

| 該寫（職責內容）| MUST NOT 寫（越界 → 移到哪張卡）|
|----------------|------------------------------|
| 職責動作 + 權限 + 職責邊界 + 關切點 + 預期阻力 | 跨角色端到端流程細節（→ [[../07-scenarios]] scenario 卡）|
| 「這角色做什麼 / 把關什麼」的**動作歸屬層** | 分權規則的判斷準則細則（如補收免審 vs 退款送審「為什麼這樣分」→ `04-business-logic` 規則正本卡，role 卡只寫「業務建立異動單、退款送主管核可」這層歸屬）|
| | 實體欄位定義（→ `05-entities` entity 卡）|

## 二、Frontmatter 範本

```yaml
---
type: role
module:
  - <主要模組>                  # 對齊 wiki-schema § 二 module enum（可多選）
business-domain:
  - <6 領域之一或 cross-domain>  # 必填；多數角色屬 cross-domain，對齊 wiki-schema § 二B
status: draft | active | deprecated
last-reviewed: YYYY-MM-DD

# ── source / implemented-by（前進標準，見 § 二補充說明）──
source:                          # 往上指依據（這張卡為什麼對）。只准指更上層的卡 / 真實外部素材
  - "[[現金流出把關]] 或 [[發票收款彈性]] 或 <外部素材：Notion 角色權責表 / 使用者拍板>"
implemented-by:                  # 往下指被誰實作 / 導航。指 OpenSpec spec 檔層，不綁標題錨點 / prototype / test-case，不承載正確性
  - "openspec/specs/<對應模組>/spec.md"
provenance-commit: <SHA>         # 可選但建議：記上次對齊的 commit，供 stale 偵測
related-notion: <Notion 核心角色權責 DB 連結>      # 若有
---
```

### § 二補充：source / implemented-by 的前進標準與遷移彈性（誠實標注，不假裝）

- **前進標準**：新卡 / 被 change 異動的 role 卡優先補 `source` / `implemented-by`（對齊 [[wiki-architecture#依據往上、實作往下，連結不繞回自己|wiki-architecture § 依據往上、實作往下]]，兩欄一個往上指依據、一個往下指實作，方向不會接回自己）。
- **role 卡 source 該指哪**：往上指「該角色分權方向的商業規則來源」——如 [[現金流出把關]]、[[發票收款彈性]]、Notion 角色權責表、使用者拍板。**MUST NOT 指 OpenSpec**。
- **遷移彈性**：補不出 `source` 的標 `source-gap` 待專輪補齊。

## 三、正文章節骨架

> 共同 4 段（一句話定位 / 這張卡要回答的問題 / 營運背景 / 相關連結 + 來源，對齊共同骨架）＋ role 卡特有 5 章節（基本資料 / 主要工作職責 / 職責邊界 / 關切點 / 預期阻力，對齊 [[business-logic-writing-guide#4.5 role 卡（角色職責，前置營運痛點）|§ 4.5]] 與既有 16 張 role 卡骨幹）。每節附「該寫 / 不該寫」一句指引。

```markdown
> <一句話定位>：這個角色是誰、在哪個平台（中台 / 業務平台 / 外部）、屬哪業務領域、與哪些近似角色易混淆須區隔（如「業務主管 ≠ Supervisor」）。
>   不該寫：職責清單（留主要工作職責段）。

## 這張卡要回答的問題

> 列這張卡要回答的關鍵業務問句，每句在正文有對應明確結論。判斷「卡完整了沒」= 每個問句是否都有結論（取代「大致 OK」非量化結論）。
> role 卡的問句聚焦「做什麼 / 把關什麼 / 邊界切在哪 / 阻力是什麼」，而非「規則為什麼這樣定」（規則論證在 business-logic 正本卡）。
> 該寫：3-6 個具體問句，如「這角色把關哪個環節？」「核可範圍是部門內還是全公司？」「跟 X 角色的權責怎麼切？」
> 不該寫：含「待確認 / 待釐清」措辭的開放問句——那是 OQ，MUST 走 [[oq-manage]] mode B 開獨立卡，此段只放「本卡已能回答」的問句。

- 這個角色每日在系統處理哪幾類事？（→ 主要工作職責段）
- 它把關 / 推進哪個流程節點？把關失敗會擋住什麼？（→ 基本資料利害關係程度 + 主要工作職責）
- 它的核可 / 編輯 / 檢視範圍各是部門內還是全公司？（→ 職責邊界段）
- 跟哪個近似角色易混淆、權責怎麼切？（→ 一句話定位 + 職責邊界）

## 營運背景 / 角色定位

> 這個角色在公司營運上要解決什麼、把關什麼。2-4 句，業務語言，無實作術語當主詞。
> 該寫：營運上為什麼需要這個角色、它守住哪道關（如「業務主管守成交條件這道關，避免報價金額 / 收款條件 / 交期未經把關就外發」）。
> 不該寫：工程術語當主詞、中英夾雜（技術詞括號附註）、職責逐條（留下一段）。

## 基本資料

> 該寫：平台歸屬、利害關係程度（高 / 中 / 低，附一句為什麼這個程度）、參與階段、各模組權限（任務操作 / 報價單訂單 / 工單 / 需求單 等，標 R / W / R/W / X）。
> 不該寫：權限背後的判斷準則細則（屬 business-logic，此處只標 R/W/X 動作層）。

- **平台**：<中台 / 業務平台 / 外部>
- **利害關係程度**：<高 / 中 / 低>（<一句話理由，連回流程關鍵節點或營運影響>）
- **參與階段**：<評估 / 製作 / 審稿 / 對帳 ...>
- **任務操作**：<R / W / R/W / X>
- **報價單 / 訂單**：<R / W / R/W / X>
- **工單**：<R / W / R/W / X>
- **需求單**：<R / W / R/W / X>

## 主要工作職責

> 該寫：逐項職責動作（這角色實際做什麼）；每項**非顯然**的把關 / 動作 MUST 補一句「營運動機」（為什麼公司要這樣安排，連回痛點 / 角色實務 / KPI）。
> 不該寫：跨角色完整流程（→ scenario）；分權「為什麼這樣分」的判斷準則細則（→ business-logic 正本卡，此處 wiki link 引用 + 只寫本角色的動作歸屬）。

1. **<職責動作 A>**：<做什麼>。<營運動機：為什麼要這樣做 / 把關什麼>
2. **<職責動作 B（含分權的，引用規則正本）>**：<本角色的動作歸屬，如「核可退款負項異動單；補收正項由業務直接執行、主管不經手」>。分權判斷準則（X 免審 vs Y 送審為何不對稱）見 [[../04-business-logic/<規則正本卡>]]，本卡只寫動作歸屬層
3. ...

## 職責邊界

> 該寫：每條邊界（核可範圍 / 檢視範圍 / 不介入什麼），且每條 MUST 附「為什麼這樣切」（營運動機）。
> 不該寫：只列邊界不附理由（[[business-logic-writing-guide#六、營運驗證寫法 該做 / 不該做|該做 / 不該做]] 明列為不該做）。

- **<某動作>範圍 = 部門內 / 全公司**：<邊界陳述>。<為什麼這樣切，如「核可範圍限部門內，因跨部門核可會破壞責任歸屬」>
- **不介入 <某流程>**：<陳述>。<為什麼>

## 關切點

> 該寫：這個角色在意系統提供什麼（本身即營運驗證素材——主管讀了能說「對，我就在意這個」）。
> 不該寫：UI 操作細節（按鈕 / 彈窗）。

- <關切點 1>
- <關切點 2>

## 預期阻力

> 該寫：導入系統時這個角色可能的抗拒點（如「審核從口頭 / Slack 改系統操作，初期操作不熟增加確認時間」）。
> 不該寫：空洞描述（「可能不適應」屬無內容）；無則寫「（未在來源中標記）」。

<預期阻力描述，或「（未在來源中標記）」>

## 相關連結

> 語意分類（對齊共同骨架第 4 點 + [[business-logic-writing-guide#原則 7：完整關聯——卡內提到的每個概念都設 wiki link，雙向可達，且語意分類|writing-guide 原則 7]] 五類），雙向可達、不連到不存在的卡、也不是沒有任何卡連到它的孤島卡。
> 該寫：本角色提到的每個被 Vault 收錄的概念都設 wiki link，且標關聯方向。
> 不該寫：丟一串連結不分類；連到 vault 外（用相對路徑 markdown link，見 wiki-schema § 八）。

### 相關業務邏輯
- [[../04-business-logic/<規則正本卡>]]（本角色把關 / 執行哪條規則；判斷準則正本在該卡，本卡只寫動作歸屬）

### 相關狀態
- [[../06-state-machines/<狀態機卡>]]（本角色推進 / 把關哪個狀態轉換）

### 相關情境
- [[../07-scenarios/README#<情境 X>]]（本角色在哪個端到端情境中傳遞）

### 相關 OQ
- [[../08-open-questions/<MODULE>-<NNN>-<簡述>]]（與本角色職責 / 邊界相關的待確認項）

## 來源

> 連回可獨立驗證的外部出處；MUST NOT 指向其他 role 卡。末行加 changelog 指向。
> 該寫：Notion 角色權責表 / OpenSpec user-roles spec § Requirement / Miles 拍板 / 對應 change。
> 不該寫：把另一張 role / business-logic 卡當正確性來源（循環論證）；正文留迭代史（→ changelog）。

- <[Notion 核心角色權責表 - X](URL) / OpenSpec user-roles spec § Requirement: X / Miles YYYY-MM-DD 拍板>
- 對應 OpenSpec change：<change-id>（若有）
- 迭代脈絡見 [[business-logic-changelog#<本角色卡名>]]
```

## 四、極簡填寫示意（佔位符，非真實內容）

> 真實內容留「帶實例階段」。以下用 `<...>` 佔位符示意結構，勿當真實資料。

```markdown
---
type: role
module:
  - <module-a>
business-domain:
  - cross-domain
source:
  - "<Notion 角色權責表 - 角色X> / Miles <YYYY-MM-DD> 拍板"
implemented-by:
  - "openspec/specs/<對應模組>/spec.md"
status: draft
last-reviewed: <YYYY-MM-DD>
---

# <角色X>

> <角色X> 為 <平台> 角色，守 <某道關>；注意 <角色X> ≠ <近似角色Y>（<Y 的定位>）。

## 這張卡要回答的問題

- <角色X> 每日處理哪幾類待辦？
- 它把關哪個流程節點？把關失敗會擋住什麼？
- 它的核可範圍是部門內還是全公司？

## 營運背景 / 角色定位

<角色X> 在 <某環節> 守關，避免 <某營運風險>。<2-4 句業務語言>。

## 基本資料

- **平台**：<平台>
- **利害關係程度**：<高>（<理由>）
- **參與階段**：<階段>
- **任務操作**：<X>
- **報價單 / 訂單**：<R/W>
- **工單**：<X>
- **需求單**：<R>

## 主要工作職責

1. **<職責A>**：<做什麼>。<營運動機>
2. **<職責B（含分權）>**：<本角色動作歸屬>。判斷準則見 [[../04-business-logic/<規則正本卡>]]

## 職責邊界

- **<某動作>範圍 = <部門內>**：<陳述>。<為什麼這樣切>

## 關切點

- <關切點1>

## 預期阻力

<阻力描述，或「（未在來源中標記）」>

## 相關連結

### 相關業務邏輯
- [[../04-business-logic/<規則正本卡>]]（本角色把關該規則，動作歸屬層）

### 相關 OQ
- [[../08-open-questions/<MODULE>-<NNN>-<簡述>]]

## 來源

- <Notion 角色權責表 - 角色X>（URL）
- 迭代脈絡見 [[business-logic-changelog#<角色X>]]
```

## 五、不可違反的硬規則 vs 可視情況調整的彈性（role 卡標注）

> 對齊共同骨架「不可違反的硬規則 vs 可視情況調整的彈性」。彈性破口明示在此，禁作者私自偏離。

### 5.1 不可違反（最高層硬規則）

- 業務段（營運背景 / 基本資料 / 主要工作職責 / 職責邊界）**禁工程術語當主詞**、**禁中英夾雜**（技術詞括號附註）。
- 識別到不確定項 **MUST 走 [[oq-manage]] mode B 開獨立 OQ 卡**（禁 inline「待確認 / 待釐清」、禁 `> [!question]` callout）。
- `source` **禁指下游 / 同層 / OpenSpec**（指 OpenSpec 屬 [[wiki-architecture#營運需求（Obsidian）與實作規格（OpenSpec）的分工|§ 營運需求與實作規格的分工]] Error）。
- **正文零迭代史**（迭代史進 [[business-logic-changelog]]）。
- **規則單一正本不複寫**：分權判斷準則細則只在 `04-business-logic` 正本卡，role 卡只寫動作歸屬 + wiki link 引用（[[business-logic-writing-guide#原則 6：規則正本歸屬——每條業務規則的完整定義只在一張卡，其餘卡引用不複製|writing-guide 原則 6]]）。

### 5.2 可因案調整（明示彈性破口）

- **角色卡通常只寫職責歸屬，不寫規則論證**：role 卡的職責是「動作歸屬」非「規則論證」，規則論證留 business-logic 正本卡。**僅在「某條職責邊界為何這樣切」需要展開設計理由時**，於該邊界處先寫被駁回的切法 + 駁回理由，再寫最後採用的切法，不強制全卡都展開規則理由。
- **「這張卡要回答的問題」段可用敘述代替**：無爭議、職責單純的角色（如純檢視角色），問句段可精簡為 1-2 句敘述定位。
- **role 為純文字的 lint 例外**：外部使用者角色（如 B2C 會員 / EC 註冊會員）允許 `role` 為純文字而非 wiki link 至 `03-roles/`（對齊 [[wiki-schema#維度 13：User Story 撰寫紀律（Phase 3 待 vault-audit 實作）|wiki-schema 維度 13 Lint 例外]] 與 [[AR-1-B2C會員是否納入正式角色|AR-1]] 決策）。
- **預期阻力可標「（未在來源中標記）」**：來源未提供時不強編。

## 六、自審稽核清單（寫的時候照著填、事後照著檢查：撰寫完逐項打勾 = 稽核基準）

> 同一份既是撰寫檢查表，也是 `vault-audit` 維度 14（卡類型內容職責邊界）的稽核維度。撰寫完逐項勾選。

**frontmatter**
- [ ] 共同欄全填（type=role / module / business-domain / status / last-reviewed）。
- [ ] `source` 不指同層（其他 role 卡）/ 下層 / OpenSpec；新卡 / 被改卡優先補 source + implemented-by，補不出標 `source-gap`。
- [ ] 既有卡 `related-spec` 過渡保留可，但不得當 `source`（語意是 implemented-by 弱版）。

**內容職責邊界（維度 14）**
- [ ] 正文**無**跨角色端到端流程細節（→ scenario）。
- [ ] 正文**無**分權規則判斷準則細則（→ business-logic 正本卡，本卡只寫動作歸屬 + 引用）。
- [ ] 正文**無**實體欄位定義（→ entity 卡）。
- [ ] 正文**無** user-story 格式模板（作為 / 我希望 / 以便）/ test-case 範本。

**共同骨架**
- [ ] 「這張卡要回答的問題」段每個問句正文有對應結論（無「待確認」開放問句——那是 OQ）。
- [ ] 營運背景 + 基本資料 + 主要工作職責 + 職責邊界皆無工程術語當主詞、無中英夾雜。
- [ ] 主要工作職責每項非顯然動作補了營運動機。
- [ ] 職責邊界每條附了「為什麼這樣切」。
- [ ] 正文零迭代史（迭代史在 [[business-logic-changelog]]）；正文零 inline OQ 措辭（→ [[oq-manage]] mode B）；無 `> [!question]` callout。

**相關連結 + 來源**
- [ ] 相關連結語意分類（相關業務邏輯 / 狀態 / 情境 / OQ），雙向可達、不連到不存在的卡、也不是沒有任何卡連到它的孤島卡。
- [ ] 來源指可獨立驗證外部出處，不指其他 role 卡；末行有 `迭代脈絡見 [[business-logic-changelog#<卡名>]]`。

**最後驗收（抽一句問主管看不看得懂）**
- [ ] 營運背景 / 職責邊界抽一句，問「Miles / 主管不看程式碼能否懂這角色做什麼、把關什麼」。

## 七、相關規約

- [[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|business-logic-writing-guide § 4.0]] — role 越界表（該寫 / MUST NOT 寫）
- [[business-logic-writing-guide#4.5 role 卡（角色職責，前置營運痛點）|business-logic-writing-guide § 4.5]] — role 卡正文撰寫範式
- [[wiki-schema#type=role|wiki-schema § 四 type=role]] — frontmatter 必填正式規格
- [[wiki-schema#十一、卡類型內容職責邊界（2026-05-28 新增）|wiki-schema § 十一]] — 卡類型內容職責邊界（維度 14 lint 依據）
- [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）|wiki-architecture § 分層體系]] — role 在分層體系中的位置（流程／狀態／角色／資料這一層）
- [[wiki-architecture#依據往上、實作往下，連結不繞回自己|wiki-architecture § 依據往上、實作往下]] — source / implemented-by 兩欄語意
- [[oq-manage]] — 識別不確定項時開獨立 OQ 卡
- [[business-logic-changelog]] — 迭代史獨立檔（正文零迭代史）
