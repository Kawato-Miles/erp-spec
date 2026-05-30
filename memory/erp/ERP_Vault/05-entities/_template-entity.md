---
type: meta
status: draft
last-reviewed: 2026-05-31
---

# 資料卡撰寫範本（entity 層）

> 給 Miles 與 agent 撰寫 `05-entities/` 卡時複製套用，也是 doc-audit / vault-audit 稽核此類卡的勾稽基準（一份兩用：撰寫時照著填、事後照著勾）。
>
> 分層定位：entity = 資料層的「資料實體」載體（見 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）|wiki-architecture § 分層體系]]）。職責極窄——只承載**欄位 / 關聯 / 狀態名**，行為規則指向 [[business-logic-writing-guide|business-logic]] 卡、狀態細節指向 state-machine 卡。
> 共同骨架見 [[business-logic-writing-guide]] § 四（共通骨架）+ [[business-logic-writing-guide#4.0 各類卡的單一職責（六層由大到細、只連不重抄）|§ 4.0（各類卡的單一職責）]] + [[wiki-schema]] § 四（frontmatter）+ § 十一（內容職責邊界）。本範本是這套骨架在資料層的落地。

複製以下 `--- 模板開始 ---` 與 `--- 模板結束 ---` 之間的內容，存為 `05-entities/<實體中文名>.md`。

---

--- 模板開始 ---

```markdown
---
type: entity
module:
  - <模組，對齊 wiki-schema § 二 module enum>
business-domain:
  - <6 領域之一，對齊 wiki-schema § 二B；跨領域用 cross-domain>
status: draft
last-reviewed: YYYY-MM-DD
source:
  # 往上指依據（這張卡為什麼對）。只准指更上層卡 / 外部已驗證的依據（Miles 拍板 / 印刷業實務 / 法規，不再往上追）。
  # 嚴禁指同層 entity / 下層 user-story / OpenSpec。entity 的 source 通常指承載其行為規則的 business-logic 正本卡。
  - "[[<更上層卡，如某 business-logic 規則卡>]] 或 <外部依據>"
implemented-by:
  # 往下指被誰實作（導航用）。指 OpenSpec Requirement 標題層 / prototype 型別檔。不決定這張卡對不對。
  - "openspec/specs/<模組>/spec.md#Data Model: <實體名>"
  - "sens-erp-prototype/src/types/<...>.ts"
provenance-commit: <SHA>   # 可選但建議：記上次對齊 commit，供 doc-audit stale 偵測
# --- 過渡期相容（既有卡尚未遷移 source/implemented-by 時保留，語意等同 implemented-by 弱版）---
# related-spec: openspec/specs/<模組>/spec.md
# related-prototype: sens-erp-prototype/src/types/<...>.ts
---

# <實體中文名>（<EntityNameInCode>）

> 一句話定位：這個實體對應公司營運上的什麼東西、屬哪個業務領域、為什麼需要它獨立存在。
> 規則正本歸屬聲明：本卡只承載欄位 / 關聯 / 狀態名；行為規則正本在 [[<business-logic 卡>]]、狀態細節正本在 [[<state-machine 卡>]]，本卡只引用不重述。

## 這張卡要回答的問題

> 先列這張卡要回答的關鍵問題，每題在正文有對應明確結論。判斷「卡完整了沒」= 每題是否都有結論（取代「大致 OK」非量化結論）。entity 卡的問題聚焦「資料層面」，行為 / 流程問題移到 business-logic / scenario。
> 範例問題（依實體替換，刪除不適用者）：
> - 這個實體為什麼要獨立存在（不併入鄰近實體）？
> - 哪些欄位是非顯然的、需要說明「為什麼要存」？
> - 它跟哪些實體有關聯、關聯的基數（1:1 / 1:N / N:M）是什麼？
> - 它有沒有狀態？狀態正本在哪張 state-machine 卡？

## 營運背景

> 該寫：這個實體對應公司營運上的什麼東西、為什麼需要它獨立存在，2-3 句業務語言。主管 / PM 入口，讀完應能判斷「我們對這個業務物件的理解對不對」。
> 不該寫：實作術語當主詞（資料表 / FK / JSON 欄位）、業務流程敘述（→ business-logic / scenario）、欄位逐一說明（留下方「核心欄位」表）。

<2-3 句。例：「售後服務單是訂單已完成後客訴 / 不良 / 規格不符的受理容器，獨立於訂單異動，讓完成後的善後事件有專屬的受理 → 處理 → 結案軌跡。」>

## 核心欄位

> 該寫：實體的關鍵欄位 + 一句話說明。非顯然營運理由的欄位，在「說明」欄補一句「為什麼要存這個欄位」（如 `payment_terms_note`「從需求單帶入並鎖定——避免成交後收款條件被竄改」）。欄位承載的業務規則用 wiki link 指向 business-logic 卡。
> 不該寫：完整型別 / 長度 / 約束（屬 OpenSpec Data Model，本卡用 implemented-by 導航）、欄位背後的計算公式（→ business-logic）。

| 欄位 | 說明 |
|------|------|
| `id` / `<業務編號>` | 系統 ID / 使用者看見的編號 |
| `status` | 狀態（見 [[<state-machine 卡>]]）|
| `<欄位 A>` | <說明；承載的規則見 [[<business-logic 卡>]]> |
| `<欄位 B（非顯然）>` | <說明 + 一句「為什麼要存這個欄位」> |

## 關鍵關聯

> 該寫：實體間的關聯（含基數 1:1 / 1:N / N:M）+ 每個被關聯實體的 wiki link，雙向可達。這是 entity 卡的核心職責。
> 不該寫：關聯背後的業務流程（→ scenario）、關聯觸發的規則（→ business-logic，本卡只 wiki link 指過去）。

- 包含 `<子實體>[]`（1:N）：<一句說明> → [[<子實體卡>]]
- 關聯 [[<實體 X>]]（N:1，`<fk 欄位>`）：<一句說明>
- <某狀態 / 某事件下> → [[<實體 Y>]]：<一句說明，規則見 [[<business-logic 卡>]]>

## 相關狀態機

> 該寫：本實體 status 對應的 state-machine 卡 wiki link（若實體有狀態）。
> 不該寫：完整狀態清單 / 轉換條件 / 轉換圖（狀態細節正本在 state-machine 卡，本卡只指過去，不重述）。

- [[<state-machine 卡>]]

## 相關連結

> 語意分類，雙向可達（被指向的卡也應回連本卡）。依五類設 wiki link，刪除不適用類別。

- 上層情境（07-scenarios）：[[<情境卡>]] — 本實體被哪個端到端情境串起
- 下層步驟（13-user-stories）：[[<US-XX-NNN>]] — 本實體被哪些角色執行步驟落實
- 相關角色（03-roles）：[[<角色卡>]] — 哪些角色操作 / 把關本實體
- 相關規則（04-business-logic）：[[<business-logic 卡>]] — 本實體欄位 / 關聯承載的業務規則正本
- 相關實體（05-entities）：[[<相鄰實體卡>]] — 與本實體直接關聯的其他實體

## 來源

> 連回可獨立驗證的外部出處（OpenSpec Data Model / 業務情境 / 訪談 / 法規 / 拍板 OQ）。禁指向其他同層 entity 卡當正確性來源。
> 末行固定加「迭代脈絡見 …」——正文零迭代史（迭代史進 changelog）。

- OpenSpec [<模組>/spec.md](../../../../openspec/specs/<模組>/spec.md) § Data Model
- Prototype `src/types/<...>.ts`
- 迭代脈絡見 [[business-logic-changelog#<實體中文名>]]
```

--- 模板結束 ---

## 連結指向位置的命名規約（entity 層適用範圍）

> 對齊 [[wiki-architecture#各層怎麼寫|wiki-architecture § 各層怎麼寫]]：用名稱當連結指向的位置，改名只改內容、位置不變，連結不會斷。

- entity 卡**通常不承載條文 / 規則編號**（條文在 business-logic 卡），故一般無 `#R1` 類定位點需求。
- 若需從他卡精準引用本卡某欄位 / 某關聯（如 changelog 指「本實體某欄位的演進」），用**業務語意命名**（`#<欄位中文名>` 或 `#關鍵關聯`），**不用流水號、不重排、不重用**。
- 改欄位說明只改內容、定位點不變 → 既有反向連結（backlink）不斷。

## 需要說明設計理由時的寫法（entity 層適用範圍）

> 對齊 [[business-logic-writing-guide]] § 四（共通骨架）+ [[wiki-architecture#各層怎麼寫|wiki-architecture § 各層怎麼寫]]。

- entity 卡**多為事實陳述**（這個實體有哪些欄位 / 關聯），通常**不需寫規則論證**（規則論證在 business-logic 卡）。
- 唯一需要簡短理由的場景：**「為什麼這個實體要獨立存在 / 不併入鄰近實體」**的設計決策。此時先寫被駁回的方案（如「為何不把售後事件併回訂單異動」）＋ 駁回理由，再給最後採用的做法。寫在「營運背景」段或「這張卡要回答的問題」對應結論，**不另開長篇論述段**（避免越界成 business-logic）。

## 不可違反的硬規則 vs 可視情況調整的彈性（entity 層）

> 對齊 [[business-logic-writing-guide]] § 四（共通骨架）。範本明示「不可違反」與「可因案調整」兩層，禁作者私自偏離。

**不可違反（硬規則）**：
- 禁中英文夾雜（技術名詞括號附註，不得當主詞）。
- 營運背景段禁實作術語當主詞（資料表 / FK / JSON）。
- entity 卡 MUST NOT 寫業務流程敘述 / user-story / 完整狀態轉換邏輯（→ 對應卡）。
- `source` 禁指同層 entity / 下層 user-story / OpenSpec。
- 正文零迭代史（迭代史在 [[business-logic-changelog]]）。
- 同一概念只有一張正本卡——欄位承載的規則只在 business-logic 卡寫完整版，entity 卡只引用。

**可因案調整（可視情況調整的彈性）**：
- **無狀態實體**（如純參照 / 純子實體）可省略「相關狀態機」段。
- **無子實體 / 關聯極簡**的實體，「關鍵關聯」段可只列一兩條。
- **「這張卡要回答的問題」段**：純事實型實體（欄位 / 關聯一目了然、無設計爭議）可用敘述代替問題清單，但仍須能回答「為什麼獨立存在」。
- **過渡期 frontmatter**：既有卡尚未遷移 `source` / `implemented-by` 時，暫留 `related-spec` / `related-prototype`（語意等同 implemented-by 弱版）；新卡 / 被 change 異動的卡優先補 `source`，補不出標 `source-gap` 待專輪。

## Lint 自檢清單（撰寫完逐項打勾，亦為稽核基準）

> 同一份既是撰寫檢查表，也是 doc-audit / vault-audit 稽核維度（對齊 [[wiki-schema]] § 六維度 5 / 14、§ 十一 entity row）。

- [ ] **frontmatter 共同欄全填**：type=entity / module / business-domain / status / last-reviewed。
- [ ] **溯源欄**：`source` 不指同層 entity / 下層 user-story / OpenSpec；entity 通常指承載其行為規則的 business-logic 正本卡或外部原點。`implemented-by` 指 OpenSpec Data Model / prototype 型別檔（過渡期可用 related-spec / related-prototype 代）。
- [ ] **這張卡要回答的問題**：每個問題正文有對應結論（含「為什麼獨立存在」）。
- [ ] **營運背景**：2-3 句、無實作術語當主詞、無中英夾雜、無業務流程敘述。
- [ ] **核心欄位**：非顯然欄位在說明欄補「為什麼要存」；欄位承載的規則用 wiki link 指 business-logic（未把規則本體寫進說明欄）。
- [ ] **關鍵關聯**：標明基數（1:1 / 1:N / N:M）+ wiki link；未寫關聯背後的業務流程 / 規則本體。
- [ ] **相關狀態機**：有狀態的實體已 wiki link 指 state-machine 卡；未在本卡重述狀態清單 / 轉換條件 / 轉換圖。
- [ ] **越界檢查**（[[wiki-schema]] § 十一 entity row）：未寫入業務流程敘述（→ business-logic / scenario）/ user-story 格式模板（作為 / 我希望 / 以便）/ test-case 範本 / 完整狀態轉換邏輯。
- [ ] **正文零迭代史**：無「vN 推翻 / 廢止舊…」inline change 標註（→ [[business-logic-changelog]]）；無「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」inline OQ 措辭（→ [[oq-manage]] mode B 開獨立 OQ 卡）。
- [ ] **相關連結**：依語意分類（上層情境 / 下層步驟 / 相關角色 / 相關規則 / 相關實體）、雙向可達、沒有連到不存在的卡（dangling）、不是沒有任何卡連到它的孤島卡（orphan）。
- [ ] **來源**：連回外部可驗證出處；末行有「迭代脈絡見 [[business-logic-changelog#<實體中文名>]]」。
- [ ] **最後驗收**：營運背景抽一句，問「Miles / 主管不看程式碼能否懂這個實體是什麼、為什麼存在」。

## 極簡填寫示意（佔位符，非真實內容）

> 僅示意骨架填法；真實實體內容留撰寫實際卡時填。

```markdown
---
type: entity
module:
  - <模組-X>
business-domain:
  - <領域-Y>
status: draft
last-reviewed: YYYY-MM-DD
source:
  - "[[<X 規則卡>]]"
implemented-by:
  - "openspec/specs/<模組-X>/spec.md#Data Model: <實體-Z>"
  - "sens-erp-prototype/src/types/<檔名>.ts"
---

# <實體-Z>（<EntityZ>）

> 一句話定位：<實體-Z> 是 <領域-Y> 中承載 <某營運物件> 的單據，獨立於 [[<鄰近實體>]] 以便 <某營運理由>。本卡只寫欄位 / 關聯 / 狀態名，行為規則正本在 [[<X 規則卡>]]。

## 這張卡要回答的問題
- <實體-Z> 為什麼不併入 [[<鄰近實體>]]？→ 結論見「營運背景」。
- 哪些欄位是非顯然的？→ `<欄位-B>`，見核心欄位表。

## 營運背景
<2-3 句佔位：公司營運上 <某情況> 需要一個獨立容器追蹤 <某事>，故設 <實體-Z>。不併入 [[<鄰近實體>]] 是因 <一句駁回理由>。>

## 核心欄位
| 欄位 | 說明 |
|------|------|
| `id` / `<業務編號>` | 系統 ID / 使用者看見的編號 |
| `status` | 狀態（見 [[<Z 狀態>]]）|
| `<欄位-A>` | <說明；規則見 [[<X 規則卡>]]> |
| `<欄位-B>` | <說明 + 為什麼要存這個欄位> |

## 關鍵關聯
- 關聯 [[<鄰近實體>]]（N:1，`<fk>`）：<一句說明>
- 包含 `<子實體>[]`（1:N）→ [[<子實體卡>]]

## 相關狀態機
- [[<Z 狀態>]]

## 相關連結
- 上層情境：[[<情境卡>]]
- 相關角色：[[<角色卡>]]
- 相關規則：[[<X 規則卡>]]
- 相關實體：[[<鄰近實體>]]

## 來源
- OpenSpec [<模組-X>/spec.md](../../../../openspec/specs/<模組-X>/spec.md) § Data Model
- Prototype `src/types/<檔名>.ts`
- 迭代脈絡見 [[business-logic-changelog#<實體-Z>]]
```

## 參考

- [[business-logic-writing-guide]] — 共同骨架 + § 4.0（各類卡的單一職責，含 entity）+ § 4.3 entity 章節範式
- [[wiki-architecture]] — 分層體系（entity = 資料層）+ 依據往上實作往下 + 連結指向位置的命名
- [[wiki-schema#type=entity]] — frontmatter 正式規格
- [[wiki-schema#十一、卡類型內容職責邊界]] — entity row 越界判讀（維度 14 lint 依據）
- [[需求單]] — 既有 entity 卡實例（核心欄位 / 關鍵關聯 / 相關狀態機 / 相關角色寫法參考）
