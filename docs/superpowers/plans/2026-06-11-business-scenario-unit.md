# 業務情境單元 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依設計文件 `docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md`，新建「業務情境」單元範本（合併 07-scenarios 與 13-user-stories），同步修改 03/04/05/06 範本、wiki-schema、erp_index 的交叉引用，退役舊範本與 README，追加 log。

**Architecture:** wiki 範本層重構，純 Markdown 文件工作，無程式碼。驗證手段 = grep 比對 + obsidian-cli 死鏈檢查。內容卡（59 張 US、16 個舊情境）本次不遷移（Phase B 分領域處理）。

**Tech Stack:** Obsidian Markdown（wiki link）、git、obsidian-cli。

**全域紀律（每個 Task 都適用）：**
- 全文繁體中文，禁中英夾雜（技術 token 如 frontmatter 欄位名除外）、禁 emoji。
- Edit 時 old_string 必須與檔案現況逐字一致；若比對失敗，先重讀該檔再修正，禁止憑記憶改寫整段。
- 所有修改完成後 commit 訊息格式 `{prefix}: {繁中描述}`，結尾加 `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`。

---

### Task 1: 新建業務情境範本

**Files:**
- Create: `memory/Sens_wiki/wiki/erp/07-scenarios/_template-business-scenario.md`

- [ ] **Step 1: 寫入範本全文**

以下為完整內容，逐字寫入（Write 工具）：

````markdown
---
type: meta
status: active
last-reviewed: 2026-06-11
---

# 業務情境卡撰寫範本

> 設計依據：[[index]] § Wiki 憲章（本質、第一讀者、兩判準、單元定位模式）＋ 與 `06-state-machines/_template-state-machine.md`、`03-roles/_template-role.md` 同構的治理機制；方法論依據：Cockburn《Writing Effective Use Cases》（主線＋延伸掛接、目標層級）、Domain Storytelling（誰－做什麼－交給誰的敘事句型）。
> 本範本依「雙向開發」迭代：每張卡走查時發現的缺口回饋範本。
> 本單元 2026-06-11 由原 07-scenarios（情境）與 13-user-stories（使用者故事）合併而成，設計定案見 `docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md`。

---

## 〇、業務情境卡是什麼（先懂定位再動筆）

> 本節目的：每條規則都從定位推導。Wiki 的本質、第一讀者、兩判準（紙本測試／商業語言）、BRD 自足與「範圍外＝防護欄」見 **[[index]] § Wiki 憲章**——本節只講業務情境單元的特定定位。

**業務情境卡是商業知識在「目標完成過程」維度的投影**——一個業務目標從觸發到收斂，誰（角色／外部系統／時間）依什麼順序做什麼、每一步憑什麼可觀測的業務結果判斷成立。純手工時代「客戶取消已付款訂單：業務簽單、主管核可、會計匯款、月底對平」這套過程就存在於簽核單與口頭默契中，完全過紙本測試。

**與鄰層的分工**（投影不互相複寫，正本只有一處）：

- 對服務藍圖（`04-business-logic/服務藍圖/`）：藍圖是流程的**型**——這類生意一般怎麼跑，5-10 個階段、不含判準；本卡是流程的**實例**——這一個目標怎麼走到完成，含判準。接力型卡頭標「具現自 [[某藍圖]] 階段 N-M」。
- 對商業規則（`04-business-logic/`）：判準本體（門檻數字、計算邏輯、為什麼這樣定）正本在規則卡；本卡步驟的判準＝一句關卡描述＋wiki link 指規則卡，**禁抄準則本體與門檻數字**。
- 對角色（`03-roles/`）：動作歸誰、為什麼歸他，正本在角色卡；本卡只寫動作的**時序接力**，角色名 wiki link 指過去，不重述歸屬理由。
- 對狀態機（`06-state-machines/`）：狀態詞彙與轉換正本在狀態機卡；本卡只引用狀態名（**一字不差**），禁出現轉換箭頭、守衛條件、狀態定義。
- 對實體（`05-entities/`）：欄位正本在實體卡；本卡點名實體 wiki link，不抄欄位表。
- 對痛點（`01-products/pain-points`）：痛點正本的流程級掛接點唯一在藍圖「現況痛點」段；本卡只寫 how，要連痛點以 wiki link 指回，不重述痛點現象。

**兩個判準在本單元的應用與已知陷阱**：

- 紙本測試：「會計月底核對三個數字」紙本時代也成立 → 收；「系統怎麼排程跑批」的技術細節 → 不收本體，但排程型卡須在「範圍外」點名（防實作腦補）。
- 陷阱一：**寫成第二份藍圖**——發現自己在描述「所有變體共通的骨架」即越界（那是型，歸藍圖）。
- 陷阱二：**把規則門檻抄進判準**——判準只寫「這步要通過什麼關卡」＋引用。
- 陷阱三：**每條路徑各開一張卡**——主成功過程為骨幹、岔路掛接（Cockburn：分開寫每條路徑冗長、重複、難維護）。
- 陷阱四：**以實作規格為情境正本**——本卡是 BRD，正文零實作規格引用；下游從本卡派生，不是本卡抄下游。

**本單元主要伺候的讀者情境**（依憲章五情境）：商業自足理解（一卡讀懂一件事怎麼做完）、規劃自查（改規則前反查哪些過程經過它）、AI 載入依據（防發明不存在的流程分支）、訪談確認（與業務核對「你們遇到 X 是不是這樣處理」）。

---

## 一、撰寫流程

```
辨識 → 歸位 → 確認前提 → 撰寫 → 稽核 → 定案
```

| 步驟 | 做什麼 | 這一步的產出 | 卡住時 |
|------|--------|------------|--------|
| **1. 辨識** | 這是一個業務目標的完成過程嗎？屬哪個變體？依 § 二判斷 | 開卡與否＋變體判定 | 走不通 → § 六 |
| **2. 歸位** | 檔名＝目標的繁中名詞片語，放 `07-scenarios/` | 檔名與落點 | 走不通 → § 六 |
| **3. 確認前提** | 依 § 三逐項確認 | 已確認清單（任一缺 → 停下問） | 停下問使用者 |
| **4. 撰寫** | 依 § 八格式填入，遵守 § 四規則 | 卡草稿 | 需要假設 → § 七 |
| **5. 稽核** | 依 § 十二維度自檢 | 逐項勾稽結果 | 不通過 → 回 3 或 4 |
| **6. 定案** | commit ＋ 追加 wiki/log.md（逐卡 `[[卡名]]`＋動機） | — | — |

---

## 二、判斷表

> 本節目的：不是每段敘述都該開情境卡；開錯卡會與鄰層搶正本。

### 這段內容需要開業務情境卡嗎（任一答「否」即不開）

| 順序 | 問自己 | 否的話 |
|------|--------|--------|
| 1 | 這是「一個業務目標的完成過程」嗎？（有觸發、有過程、有收斂） | 單一條件→動作的決策邏輯 → `04-business-logic/`；單據處境變化 → `06-state-machines/`；全程綱要 → 服務藍圖 |
| 2 | 過得了紙本測試嗎？（純手工時代這個目標與過程也存在） | 不開卡，屬實作規格層 |
| 3 | 同一目標已有情境卡嗎？ | 已有 → 併入既有卡為岔路或步驟，不新開（同一目標只有一張卡） |

### 變體判定（三選一，第一個命中即答案）

| 順序 | 問自己 | 變體 | 例 |
|------|--------|------|---|
| 1 | 觸發者是時間或系統事件（非人類角色發起）嗎？ | **排程型** | 月結對帳、逾期警示 |
| 2 | 過程跨多個位置交棒（含外部系統／外部方）嗎？ | **接力型** | 訂單取消退款、諮詢取消退費 |
| 3 | 都不是（單一角色一次坐定完成） | **能力型** | 訂單複製、登錄收款核銷 |

### 歸位

- 檔名＝目標的繁中名詞片語（如 `訂單取消退款.md`、`月結對帳.md`），放 `07-scenarios/`（平目錄）。
- 不用序號 ID（名稱即連結指向的位置；改名走連結維護流程）。

---

## 三、前提確認（MUST 全部已確認才能動筆）

> 本節目的：把「寫的時候才發現不知道」提前到動筆前。答不出來的就是默會知識缺口——停下問，不准編。

| 前提 | 確認狀態 |
|------|---------|
| 觸發是什麼？（角色動作／外部事件／時間）由此定變體 | 已確認 / 待確認 → 停下 |
| 過程經過哪些行為者？每步誰做？（**不可假設行為者**） | 已確認 / 待確認 → 停下 |
| 步驟順序與交棒點？ | 已確認 / 待確認 → 停下 |
| 每步判準：有規則背書的，規則正本在哪張商業規則卡？ | 已確認 / 找不到 → 先補 `04-business-logic/` 卡或開 OQ |
| 收斂狀態是哪個狀態名？（對應哪張狀態機卡） | 已確認 / 待確認 → 停下 |
| 有哪些岔路？（替代走法／例外處置） | 已確認 / 確認沒有（寫進範圍外） / 待確認 → 停下 |
| 接力型：具現自哪張藍圖的哪段？ | 已確認 / 無對應藍圖 → 與使用者確認是否屬新業務鏈（可能該先補藍圖） |

---

## 四、撰寫規則

> 本節目的：MUST 不容裁量、SHOULD 偏離須說明、MAY 自由。每條附理由，理解理由才能在沒涵蓋的情況正確裁量。

| 強度 | 規則 | 理由 |
|------|------|------|
| MUST | 每段內容過紙本測試與商業語言兩判準（§ 〇）；正文零實作規格引用 | 本卡是 BRD，第一讀者讀不到實作文件 |
| MUST | 步驟句型「〔行為者〕做〔業務動作〕」；行為者＝角色（wiki link 指 `03-roles/`）／外部系統或外部方（如金流平台）／系統 | 固定句型全卡一致；行為者缺席＝責任不明 |
| MUST | 每步判準寫**可觀測的業務結果完整句**（含具體狀態名／金額表達方式）；有規則正本的判準＝一句關卡描述＋ `[[規則卡#業務語意定位點]]`，**禁抄準則本體與門檻數字** | 規則只寫一次；可觀測才能被訪談確認與下游派生 |
| MUST | 狀態名、角色名、單據名與狀態機卡、角色卡、實體卡**一字不差**；只引用狀態名，禁轉換箭頭、守衛條件、狀態定義 | 詞彙先行；寫轉換就是第二份狀態機 |
| MUST | 主成功過程為唯一骨幹；岔路以「掛載步＋條件＋處置」掛接，禁為每條路徑開卡、禁岔路內複述主線 | 分開寫每條路徑冗長重複難維護（Cockburn additive） |
| MUST | 共用過程引用主情境（「自第 N 步起同 [[主情境卡]]」），禁複述 | 過程只寫一次，改一處即全通 |
| MUST | 接力型卡頭標「具現自 [[藍圖]] 階段 N-M」；卡內不出現「所有變體一般怎麼走」的型層敘述 | 型歸藍圖、實例歸本卡，搶正本即雙重維護 |
| MUST | 不寫痛點現象（要連痛點以 wiki link 指藍圖痛點段或 [[pain-points]]） | 痛點正本掛接點唯一在藍圖 |
| MUST | 寫「範圍外」段；**容易被實作腦補的主題點名「存在但不在本卡」**（如排程型的批次技術細節） | 範圍外是防下游過度設計與捏造的防護欄 |
| SHOULD | 整卡附 1 個真實業務格式的具體例子（編號／金額／角色），放概述或收斂段 | 抽象過程攤成可驗算實例，供訪談確認 |
| SHOULD | 非顯然的步驟順序附一句動機（為什麼先 A 後 B） | 防後人無意推翻有理由的順序 |
| MAY | 能力型短卡（2-3 步）省略「延伸岔路」段 | 顯然的事不必開段落 |

---

## 五、修改既有卡前的檢查

> 本節目的：過程描述是商業決策正本，改動是商業行為不是編輯行為。

| 修改類型 | 改之前要確認什麼 |
|---------|----------------|
| 改步驟順序／行為者／新增岔路 | 商業決策依據（管理層拍板／訪談定案）；沿引用反查連到本卡的卡 |
| 改某步判準 | 先確認是否其實是規則變動——是 → 先改 `04-business-logic/` 正本，本卡只跟著改引用 |
| 純措辭修正 | 不需商業依據，但仍須通過語言紀律稽核 |

---

## 六、邊際情境處理

> 本節目的：判斷表走不通時的標準出口，不准自行發明歸法。

| 卡住的情境 | 標準處理 |
|-----------|---------|
| 分不清該寫藍圖還是情境 | 問「我在描述所有變體共通的骨架（型），還是一個目標的具體走法（實例）？」答不出來 → 停下問 |
| 某步講不出行為者 | 停下問使用者，**禁止**寫「系統自動」充數 |
| 一個目標疑似跨兩個變體（如接力過程含定期子事務） | 以「整體過程的觸發者」定變體；定期子事務獨立成排程型卡，兩卡互引 |
| 目標粒度抓不準（一張卡越寫越長） | 過 § 十一擴張準則的三個量化判準 |
| 不確定內容歸本卡還是規則卡 | 問「這是『怎麼走完』（本卡）還是『怎麼判』（04）？」答不出來 → 停下 |
| 遷移舊卡（US／舊情境）時與實作規格或既有卡矛盾 | 停下，列出矛盾兩方呈報使用者裁決，**不自行調和** |

---

## 七、error handle（出現任一即停下）

> 本節目的：高風險點的強制人工確認。

1. **無來源依據**：過程或判準只有推測 → 停下
2. **矛盾**：與藍圖、規則卡、狀態機卡、角色卡或既有營運實務矛盾 → 停下，列出矛盾兩方
3. **需要假設**：必須假設「應該是這樣走」才能繼續 → 停下
4. **行為者不明** → 停下
5. **判準講不出可觀測結果**：某步「做完了沒」沒人說得出怎麼判 → 停下（這正是情境卡要逼出來的缺漏）
6. **超出已知**：要描述的過程超出已確認範圍 → 停下

處理方式：標記具體問題（「我不確定 X，因為 Y」）、向使用者提問附已知事實；**禁止**用「一般來說」「通常」「應該是」填充。改寫舊卡時發現的問題，保留舊內容另開 OQ。

---

## 八、產出格式

一張卡＝一個業務目標的完成過程。**檔名即標題**（卡內不寫 `# 標題`）。**正文零實作規格引用、無正文來源段**（正確性來源由 frontmatter `source` 承載；歷史查 wiki/log.md 與 git）。

**段落結構**（六段；「為誰」＝伺候的讀者情境）：

| 段落 | 內容 | 為誰 | 必/選 |
|------|------|------|-------|
| 概述 | 目標一句（誰要達成什麼＋為什麼值得）＋觸發＋變體＋接力型標「具現自 [[藍圖]] 階段 N-M」＋正本歸屬聲明 | 第一次接觸的 PM | * |
| 主成功過程 | 編號步驟：行為者＋業務動作＋成立判準（規則背書→一句關卡＋引用；純程序→直接寫可觀測業務結果） | 商業自足理解、規劃自查 | * |
| 延伸岔路 | 「掛載步＋條件＋處置」逐條；處置可引其他情境卡；共用過程「自第 N 步起同 [[主情境]]」 | 防漏例外、防另開卡 | * 能力型短卡可省 |
| 收斂狀態 | 成功保證：做完後世界處於什麼狀態（引狀態機卡狀態名一字不差） | 訪談確認 | * |
| 範圍外 | 不涵蓋什麼、屬於誰；易被實作腦補的主題點名「存在但不在本卡」 | 防下游捏造 | * |
| 相關卡 | 依分類列 wiki link（藍圖／規則／角色／實體／狀態機／情境），只列有連結的分類 | wiki 互連 | * |

**frontmatter**：

```yaml
type: scenario
variant: 接力型 | 能力型 | 排程型
module: [模組，中文值，見 wiki-schema § 二]
business-domain: [六領域之一或跨領域]
source:                # 往上＝正確性根據：服務藍圖／04 規則卡／拍板 OQ／外部依據（Miles 拍板、印刷業實務）；禁指同層、下層、實作文件
  - "[[<藍圖或規則卡>]]"
implemented-by:        # 往下＝導航中繼資料（非正文內容）：實作規格檔層；可多值、可留空
  - "openspec/specs/<模組>/spec.md"
status: draft | active
last-reviewed: YYYY-MM-DD
```

### 變體的段落調整

- **接力型**：全段落；概述必標「具現自 [[藍圖]] 階段 N-M」；行為者可含外部系統／外部方。
- **能力型**：可省「延伸岔路」；主成功過程可短至 2-3 步；無對應藍圖路徑時概述免標具現來源。
- **排程型**：觸發寫「時間／系統事件」（如「每月月結批次」）；過程常為人機混合（系統跑批 → 角色檢視 → 角色修正）；收斂狀態可為「核對完成的業務事實」而非單據狀態；批次的技術細節（排程器、重試）在「範圍外」點名「存在但屬實作規格」。

---

## 九、不收清單

> 本節目的：越界內容的路由表。發現越界：判斷歸屬 → 確認目標卡存在 → 已有則刪、沒有則搬移後刪。

| 不收 | 歸屬 | 判斷訊號 |
|------|------|---------|
| 判準本體、門檻數字、計算公式、「為什麼這樣定」 | `04-business-logic/` | 看到完整論證、公式、門檻數字 |
| 這類生意一般怎麼跑的全程綱要（型） | 服務藍圖 | 看到「所有變體共通」的階段層敘述 |
| 狀態轉換、守衛條件、狀態定義 | `06-state-machines/` | 看到轉換箭頭、「狀態 A → 狀態 B」、守衛條件 |
| 欄位名稱、欄位表 | `05-entities/` | 看到欄位逐一說明 |
| 動作歸屬的理由（為什麼是他做） | `03-roles/` | 看到「因為業務主管要把關所以…」的歸屬論證 |
| 痛點現象 | 藍圖痛點段＋ [[pain-points]] | 看到「現在這樣很痛／很慢／會漏」 |
| 介面操作 | 原型實作層 | 看到按鈕、彈窗、頁籤等介面措辭 |
| 工程驗收情境（Given/When/Then） | 實作規格層 | 看到 Gherkin 鷹架 |
| 外部介面契約本體（payload 對應、重試規格） | `04-business-logic/外部約束/` | 看到欄位對應表、API 規格 |

---

## 十、撰寫紀律

1. **過程只寫一次**：同一目標只有一張卡；共用過程引用主情境，禁複述
2. **規則回引不複寫**；**禁中英夾雜**（技術詞括號附註）；**禁實作術語當主詞**
3. **不確定項開 OQ**（`oq-manage` mode B），不留 inline 標注
4. **檔名即標題**；**正文零迭代史**（改了什麼見 wiki/log.md、為何決策見 OQ 卡）
5. **詞彙一致**：狀態名／角色名／單據名與各正本卡一字不差

---

## 十一、擴張準則

> 本節目的：卡的成長路徑有規則，不靠感覺。**卡過長是內容越界堆積或目標過大的症狀，處理是歸位或拆分，不是放行。**

| 情境 | 做法 |
|------|------|
| 新業務目標 | 新開卡（過 § 二判斷表） |
| 同目標的新岔路／新例外 | 併入既有卡的「延伸岔路」，不新開卡 |
| 主成功過程超過約 10 步 | 目標過大：與使用者評估拆成多個目標，或該內容其實是型（升藍圖議題） |
| 單一步驟判準超過 5 條 | 該步藏了規則：判準本體下沉 `04-business-logic/`，本卡留引用 |
| 延伸岔路超過約 4 條 | 主題過寬：與使用者評估依目標拆卡 |
| 平目錄卡量超過約 20 張 | 與使用者評估依業務領域拆子目錄，不擅自拆 |

---

## 十二、稽核維度（vault-audit 用；寫完逐項勾）

| # | 維度 | 通過標準 |
|---|------|---------|
| 1 | 結構對齊 | 六段齊備（含變體調整）；檔名即標題；無正文來源段 |
| 2 | 變體標記 | frontmatter `variant` 存在且與內容相符（排程型觸發非人類角色、接力型跨位置、能力型單角色） |
| 3 | 行為者完備 | 每步標明行為者（角色 wiki link／外部方／系統），無留白、無「系統自動」充數 |
| 4 | 判準可觀測 | 每步判準為可觀測業務結果完整句；規則背書的判準有 wiki link 且無準則複寫、無門檻數字 |
| 5 | 主幹掛接 | 單一主成功過程；岔路皆為「掛載步＋條件＋處置」；無平行重複路徑 |
| 6 | 共用引用 | 共用過程引用主情境，無複述 |
| 7 | 詞彙一致 | 狀態名／角色名／單據名與正本卡一字不差 |
| 8 | BRD 自足 | 正文零實作規格引用；每段過紙本測試 |
| 9 | 語言紀律 | 商業語言；無中英夾雜、無實作術語當主詞、無介面措辭、無 Gherkin 鷹架 |
| 10 | 痛點不重述 | 無痛點現象敘述；連痛點處皆為 wiki link |
| 11 | 藍圖切分 | 接力型標「具現自 [[藍圖]] 階段 N-M」；卡內無型層綱要敘述 |
| 12 | 範圍外防護 | 範圍外段存在；易被實作腦補的主題已點名 |
| 13 | 連結方向 | `source` 指藍圖／04 卡／拍板（禁同層、下層、實作文件）；相關卡雙向可達、無斷鏈 |

---

## 相關卡

- [[index]] § Wiki 憲章 — 本質、判準、單元定位模式（本範本的上位依據）
- [[wiki-schema]] — frontmatter 規範
- [[erp_index]] — 分層體系（業務情境＝目標完成過程層）
- [[log]] — 操作史（卡的歷史＝搜 `[[卡名]]`＋git）
- `04-business-logic/_template-business-logic.md` — 上層範本（規則與藍圖正本層）
- `06-state-machines/_template-state-machine.md`、`03-roles/_template-role.md` — 同構範本
````

- [ ] **Step 2: 驗證**

Run: `grep -c "^## " memory/Sens_wiki/wiki/erp/07-scenarios/_template-business-scenario.md`
Expected: 13（〇–十二共 13 個 H2，相關卡為第 14 個 → 輸出 14 也可，重點是含「〇、」「十二、」）
Run: `grep -n "Gherkin\|作為 / 我希望\|us-id" memory/Sens_wiki/wiki/erp/07-scenarios/_template-business-scenario.md`
Expected: 僅「九、不收清單」與「十二」維度 9 兩處提到 Gherkin（作為禁止訊號），無其他命中。

- [ ] **Step 3: Commit**

```bash
git add memory/Sens_wiki/wiki/erp/07-scenarios/_template-business-scenario.md
git commit -m "feat: 業務情境範本 v1——合併情境與使用者故事、三變體、憲章同構十二節

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 修改 03 角色範本交叉引用

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/03-roles/_template-role.md`

- [ ] **Step 1: 五處 Edit**（old → new，逐字比對）

(a) 定位節（原 L23 附近）：
- old: `- 跨角色的接力順序屬服務藍圖與情境卡；單一角色的操作步驟屬使用者故事。`
- new: `- 跨角色的接力順序屬服務藍圖（型）與業務情境卡（實例，接力型）；單一角色的操作步驟屬業務情境卡（能力型）。`

(b) 修改前檢查（原 L103）：
- old: `沿引用反查情境卡與使用者故事的連帶`
- new: `沿引用反查業務情境卡的連帶`

(c) 不收清單（原 L171）：
- old: `| 跨角色端到端流程 | 服務藍圖／\`07-scenarios/\` | 看到多角色接力敘述 |`
- new: `| 跨角色端到端流程 | 服務藍圖（型）／業務情境卡（實例，\`07-scenarios/\`） | 看到多角色接力敘述 |`

(d) 不收清單（原 L174）：
- old: `| 單一角色的操作步驟 | \`13-user-stories/\` | 看到「第 1 步…第 2 步…」 |`
- new: `| 單一角色的操作步驟 | 業務情境卡（能力型，\`07-scenarios/\`） | 看到「第 1 步…第 2 步…」 |`

(e) 撰寫紀律 1（原 L182）句尾補一句：
- old: `1. **動作歸屬只寫一次**：同一個把關動作不在兩張角色卡重複宣告主責（協作關係用「配合」語意註明）`
- new: `1. **動作歸屬只寫一次**：同一個把關動作不在兩張角色卡重複宣告主責（協作關係用「配合」語意註明）；業務情境卡步驟引用角色動作屬時序接力描述，不算第二次宣告主責`

- [ ] **Step 2: 驗證**

Run: `grep -n "13-user-stories\|使用者故事" memory/Sens_wiki/wiki/erp/03-roles/_template-role.md`
Expected: 零命中。

---

### Task 3: 修改 04 商業邏輯範本

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md`

- [ ] **Step 1: 五處 Edit**

(a) 可變性表（原 L46）外部約束措辭擴充：
- old: `| \`external\` | 外部約束（法規/第三方規格） | \`外部約束/\` | 只有外部來源變更時（如法規修訂、API 改版） |`
- new: `| \`external\` | 外部約束（法規/第三方規格/第三方介面契約，如金流 webhook 的欄位對應） | \`外部約束/\` | 只有外部來源變更時（如法規修訂、API 改版） |`

(b) § 三服務藍圖撰寫規則表新增一列（插在「MUST | 寫「範圍外」段」該列之後）：
- old: `| MUST | 寫「範圍外」段 |`
- new: `| MUST | 寫「範圍外」段 |\n| MUST | 藍圖停在階段層（型）：不寫業務判準、不展開步驟級完成過程——那是業務情境卡（實例）的職責 |`

(c) § 八藍圖相關卡列（原 L217）：
- old: `| 相關卡 | 依分類列出 wiki link（情境/角色/使用者故事/實體/狀態機），只列有連結的分類 |`
- new: `| 相關卡 | 依分類列出 wiki link（業務情境/角色/實體/狀態機），只列有連結的分類 |`

(d) § 九規則卡適用範圍列（原 L242）：
- old: `| 適用範圍 | 連結到服務藍圖的哪個階段生效 | * |`
- new: `| 適用範圍 | 連結到服務藍圖的哪個階段或哪些業務情境卡生效 | * |`

(e) § 十不收清單（原 L271）：
- old: `| 步驟級操作細節 | \`07-scenarios/\` 或 \`13-user-stories/\` | 看到「第 1 步...第 2 步...」 |`
- new: `| 步驟級操作細節 | 業務情境卡（\`07-scenarios/\`） | 看到「第 1 步...第 2 步...」 |`

- [ ] **Step 2: 驗證**

Run: `grep -n "13-user-stories\|使用者故事" memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md`
Expected: 零命中。

---

### Task 4: 修改 05 實體範本指向措辭

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md`

> 注意：05 範本整本仍是舊式（另案重構），本 Task 只改「指向已廢止單元」的措辭，不動其餘結構。

- [ ] **Step 1: 六處 Edit**

(a) 原 L50：
- old: `行為 / 流程問題移到 business-logic / scenario。`
- new: `行為 / 流程問題移到 business-logic / 業務情境卡。`

(b) 原 L60：
- old: `業務流程敘述（→ business-logic / scenario）`
- new: `業務流程敘述（→ business-logic / 業務情境卡）`

(c) 原 L85：
- old: `不該寫：關聯背後的業務流程（→ scenario）`
- new: `不該寫：關聯背後的業務流程（→ 業務情境卡）`

(d) 相關連結兩列併一列（原 L102-103）：
- old: `- 上層情境（07-scenarios）：[[<情境卡>]] — 本實體被哪個端到端情境串起\n- 下層步驟（13-user-stories）：[[<US-XX-NNN>]] — 本實體被哪些角色執行步驟落實`
- new: `- 相關業務情境（07-scenarios）：[[<業務情境卡>]] — 本實體被哪些業務情境的過程作用`

(e) 越界檢查（原 L164）：
- old: `未寫入業務流程敘述（→ business-logic / scenario）/ user-story 格式模板（作為 / 我希望 / 以便）/ test-case 範本 / 完整狀態轉換邏輯`
- new: `未寫入業務流程敘述（→ business-logic / 業務情境卡）/ 三段式句式（作為 / 我希望 / 以便，已廢止）/ test-case 範本 / 完整狀態轉換邏輯`

(f) 極簡示意（原 L219）：
- old: `- 上層情境：[[<情境卡>]]`
- new: `- 相關業務情境：[[<業務情境卡>]]`

- [ ] **Step 2: 驗證**

Run: `grep -n "13-user-stories\|US-XX-NNN\|下層步驟" memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md`
Expected: 零命中（範本內其餘 `user-story` 字樣若屬「已廢止」說明可保留）。

---

### Task 5: 修改 06 狀態機範本不收清單

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/06-state-machines/_template-state-machine.md`

- [ ] **Step 1: 兩處 Edit**

(a) 原 L223：
- old: `| 端到端跨角色旅程敘述 | \`07-scenarios/\`／服務藍圖 | 看到多角色接力的長篇情境 |`
- new: `| 端到端跨角色旅程敘述 | 業務情境卡（實例）／服務藍圖（型） | 看到多角色接力的長篇情境 |`

(b) 原 L224：
- old: `| 步驟級操作細節 | \`13-user-stories/\` | 看到「第 1 步…第 2 步…」 |`
- new: `| 步驟級操作細節 | 業務情境卡（能力型） | 看到「第 1 步…第 2 步…」 |`

- [ ] **Step 2: 驗證 + 批次 Commit（Task 2-5）**

Run: `grep -rn "13-user-stories" memory/Sens_wiki/wiki/erp/0{3,4,6}-*/_template-*.md`
Expected: 零命中。

```bash
git add memory/Sens_wiki/wiki/erp/03-roles/_template-role.md memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md memory/Sens_wiki/wiki/erp/06-state-machines/_template-state-machine.md
git commit -m "refactor: 四範本交叉引用改指業務情境單元——含藍圖切分線與動作歸屬豁免句

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 更新 wiki-schema

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md`

- [ ] **Step 1: 逐處 Edit**（執行前先 Read 該檔對應段，確認 old_string 逐字一致）

(a) § 二 type 表（原 L27-28）：
- old: `| \`scenario\` | 跨模組情境 | \`07-scenarios/\` |`
- new: `| \`scenario\` | 業務情境（目標完成過程；接力型／能力型／排程型） | \`07-scenarios/\` |`
- old: `| \`user-story\` | 業務 User Story（單一故事，單階段業務情境）| \`13-user-stories/\` |`
- new: `| \`user-story\` | 已廢止（2026-06-11 併入 scenario）；既有卡遷移期間保留 | \`13-user-stories/\`（遷移期） |`

(b) 分層表（原 L43-44）：
- old: `| 流程 / 狀態 / 角色 / 資料 | \`scenario\` / \`state-machine\` / \`role\` / \`entity\` | \`07\` / \`06\` / \`03\` / \`05\` |`
- new: `| 狀態 / 角色 / 資料 | \`state-machine\` / \`role\` / \`entity\` | \`06\` / \`03\` / \`05\` |`
- old: `| 操作步驟 | \`user-story\` | \`13-user-stories/\` |`
- new: `| 業務情境（過程） | \`scenario\` | \`07-scenarios/\` |`

(c) type=scenario frontmatter 區塊（原 L249-263）整段替換為新 schema：

```yaml
---
type: scenario
variant: 接力型 | 能力型 | 排程型      # 必填；判定見 07-scenarios/_template-business-scenario.md § 二
module:
  - <模組>
business-domain:
  - <六領域之一或跨領域>
source:                          # 往上層 = 正確性根據（服務藍圖 / business-logic 規則 / 拍板 OQ / 外部依據），禁指 OpenSpec / 同層 / 下層
  - "[[<藍圖或規則卡>]]"
implemented-by:                  # 往下層 = 導航（實作規格檔層），可多值 / 可留空
  - "openspec/specs/<模組>/spec.md"
status: draft | active
last-reviewed: YYYY-MM-DD
---
```

(d) type=user-story 段（原 L267 標題下）加廢止聲明（內容保留供遷移期 lint）：
- 在 `### type=user-story` 標題後插入一行：
  `> **已廢止（2026-06-11）**：user-story 併入 scenario（業務情境，能力型）。本段保留供遷移期既有卡 lint；新卡一律依 type=scenario。`

(e) 維度 13 標題後（原 L556 附近）插入同款廢止聲明：
  `> **已廢止（2026-06-11）**：隨 user-story 併入業務情境，本維度由業務情境範本 § 十二稽核維度取代；保留供遷移期既有卡 lint。`

(f) 目錄表（原 L470、L476-477）：
- old: `| \`07-scenarios/\` | \`scenario\` / \`meta\`（\`README.md\`）|`
- new: `| \`07-scenarios/\` | \`scenario\`（業務情境）/ \`meta\` |`
- 兩列 `13-user-stories` 行尾各補 `（遷移期，廢止單元）`。

(g) scenario-id 段（原 L661「### Scenario 卡 scenario-id」標題後）插入：
  `> **已廢止（2026-06-11）**：業務情境卡不再配 scenario-id（名稱即連結指向的位置）；既有 scenario-id 保留至遷移清理。`

- [ ] **Step 2: 驗證**

Run: `grep -n "已廢止（2026-06-11）" memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md | wc -l`
Expected: 4（user-story type 表列敘述不計，廢止聲明 blockquote 共 4 處：(d)(e)(g) 加 (a) 表列）→ 實際以 ≥ 3 處 blockquote 為準。

---

### Task 7: 更新 erp_index

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/erp_index.md`

- [ ] **Step 1: 逐處 Edit**

(a) 分層表（原 L24-25）：
- old: `| **流程 / 狀態 / 角色 / 資料** | \`scenario\` / \`state-machine\` / \`role\` / \`entity\` | 跨模組情境、狀態轉換、角色權責、實體欄位 | \`07\` / \`06\` / \`03\` / \`05\` |`
- new: `| **狀態 / 角色 / 資料** | \`state-machine\` / \`role\` / \`entity\` | 狀態轉換、角色權責、實體欄位 | \`06\` / \`03\` / \`05\` |`
- old: `| **操作步驟** | \`user-story\` | 角色在情境下的具體操作與驗收條件 | \`13-user-stories/\` |`
- new: `| **業務情境（過程）** | \`scenario\` | 業務目標的完成過程（接力型／能力型／排程型），判準內嵌、引用各正本 | \`07-scenarios/\` |`

(b) 依據鏈（原 L35）：
- old: `依據鏈：\`驗收項目 → 操作步驟 → 商業規則 → 商業規則（source）→ 使用者拍板 / 產業慣例 / 法規\``
- new: `依據鏈：\`驗收項目 → 業務情境 → 商業規則 → 使用者拍板 / 產業慣例 / 法規\``

(c) 載入決策表（原 L53-58）各列的 `13-user-stories/<module>/` 字樣，逐列改為 `07-scenarios/（業務情境；遷移期既有卡在 13-user-stories/<原 module>/）`——共 4 列（L1.1 / L1.2 / L1.3 / L1.6）。

(d) § 三情境段（原 L90-91）：
- old: `### 情境（07-scenarios）\n- [[訂單異動流程]]`
- new: `### 業務情境（07-scenarios）\n- [[訂單異動流程]]（其餘卡分領域遷移中，暫見 13-user-stories/ 與 07-scenarios/README）`

(e) 高量層（原 L95）：
- old: `- **使用者故事**：[[wiki/erp/13-user-stories/README|US 索引]]`
- new: `- **使用者故事（廢止單元，遷移期）**：\`13-user-stories/\`（新卡一律進 07-scenarios 業務情境）`

- [ ] **Step 2: 驗證 + 批次 Commit（Task 6-7）**

Run: `grep -n "操作步驟" memory/Sens_wiki/wiki/erp/00-meta/erp_index.md`
Expected: 零命中。

```bash
git add memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md memory/Sens_wiki/wiki/erp/00-meta/erp_index.md
git commit -m "refactor: wiki-schema 與 erp_index 對齊業務情境單元——user-story 標廢止、分層表與依據鏈更新

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: 修改兩張藍圖實卡相關卡段

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/線下訂單流程.md`
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/諮詢服務流程.md`

- [ ] **Step 1: 兩處 Edit**

(a) 線下訂單流程（原 L127-128）：
- old: `- 情境：\`07-scenarios/\` 各端到端情境\n- 使用者故事：\`13-user-stories/order-management/\`、\`13-user-stories/quote-request/\`、\`13-user-stories/prepress-review/\``
- new: `- 業務情境：\`07-scenarios/\`（本藍圖各階段的實例過程；遷移期既有使用者故事卡在 \`13-user-stories/\` 對應模組目錄）`

(b) 諮詢服務流程（原 L72）：
- old: `- 使用者故事：US-CR-001 ~ US-CR-006（\`13-user-stories/consultation-request/\`）`
- new: `- 業務情境：諮詢相關過程卡（遷移期：US-CR-001 ~ US-CR-006，\`13-user-stories/consultation-request/\`）`

---

### Task 9: 退役標記四檔

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/07-scenarios/_template-scenario.md`
- Modify: `memory/Sens_wiki/wiki/erp/07-scenarios/README.md`
- Modify: `memory/Sens_wiki/wiki/erp/13-user-stories/_template.md`
- Modify: `memory/Sens_wiki/wiki/erp/13-user-stories/README.md`

- [ ] **Step 1: 四檔各做兩個 Edit**

每檔：(i) frontmatter `status: active` → `status: deprecated`；(ii) 首個 H1 標題下插入廢止聲明 blockquote。

聲明文字（依檔微調）：
- `07-scenarios/_template-scenario.md`：`> **已廢止（2026-06-11）**：本範本由 [[_template-business-scenario]] 取代（07 與 13 合併為業務情境單元，設計見 docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md）。`
- `07-scenarios/README.md`：`> **已廢止（2026-06-11）**：情境單元重構為業務情境（範本 [[_template-business-scenario]]）。本卡 16 情境內容保留至分領域遷移完成；原「OpenSpec spec 為情境細節正本」之宣告廢除（wiki 為 BRD 正本），遷移時逐情境收回並逐筆核對。`
- `13-user-stories/_template.md`：`> **已廢止（2026-06-11）**：user-story 單元併入業務情境（能力型），新卡依 [[_template-business-scenario]]。既有 59 張卡保留至分領域遷移完成。`
- `13-user-stories/README.md`：`> **已廢止（2026-06-11）**：user-story 單元併入業務情境（[[_template-business-scenario]]）。本 README 的命名規約與推送流程隨之失效；Notion 對接由下游另行規劃。既有卡遷移期間保留原處。`

注意：`13-user-stories/README.md` 的 frontmatter `status` 現值為 `active`；`07-scenarios/README.md` 現值亦為 `active`；兩個舊範本 frontmatter `status` 各為 `active`。若實際值不符，以實際值為 old_string。

- [ ] **Step 2: 驗證**

Run: `grep -l "已廢止（2026-06-11）" memory/Sens_wiki/wiki/erp/07-scenarios/_template-scenario.md memory/Sens_wiki/wiki/erp/07-scenarios/README.md memory/Sens_wiki/wiki/erp/13-user-stories/_template.md memory/Sens_wiki/wiki/erp/13-user-stories/README.md | wc -l`
Expected: 4

---

### Task 10: 追加 wiki/log.md

**Files:**
- Modify: `memory/Sens_wiki/wiki/log.md`（只追加、最新在上、禁覆寫既有條目）

- [ ] **Step 1: 在檔案最上方（首個既有條目之前）插入一筆**（時間以執行當下為準）：

```markdown
## [2026-06-11 HH:MM] 納入(amend) | 業務情境單元定案——合併情境與使用者故事為單一卡型（三變體）
- 變更：[[_template-business-scenario]] 新建（業務情境範本，憲章同構十二節、接力型／能力型／排程型）、[[_template-role]] 不收清單與撰寫紀律改指業務情境並補「情境引用不算二次宣告主責」、[[_template-business-logic]] 補藍圖切分線（型不含判準）與外部約束介面契約措辭、[[_template-entity]] 指向措辭更新、[[_template-state-machine]] 不收清單改指業務情境、[[wiki-schema]] type=scenario 加 variant 並廢止 user-story／scenario-id、[[erp_index]] 分層表與依據鏈更新、[[線下訂單流程]] 與 [[諮詢服務流程]] 相關卡段改指業務情境、[[_template-scenario]]／[[07-scenarios/README]]／[[13-user-stories/_template]]／[[13-user-stories/README]] 標廢止
- 動機：07／13 兩層存在實證重複維護（13 業務流程段重述 07 接力），且兩單元未憲章化；Miles 拍板方案二（單一卡型、判準內嵌、廢序號與三段式與 Gherkin 鷹架、服務藍圖留 04 以「型／實例」切分），設計定案見 docs/superpowers/specs/2026-06-11-business-scenario-unit-design.md
- 衝突：無（既有 59 張 US 卡與 16 個舊情境保留原處，分領域遷移；遷移時與實作規格矛盾將逐筆呈報）
```

- [ ] **Step 2: 批次 Commit（Task 8-10）**

```bash
git add memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/ memory/Sens_wiki/wiki/erp/07-scenarios/ memory/Sens_wiki/wiki/erp/13-user-stories/_template.md memory/Sens_wiki/wiki/erp/13-user-stories/README.md memory/Sens_wiki/wiki/log.md
git commit -m "refactor: 藍圖實卡改指業務情境、四檔退役標記、log 記錄單元合併

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 11: 整體驗證輪（設計文件 § 十）

- [ ] **Step 1: 範本結構對照**

人工勾稽：新範本十二節（〇–十二）與定位節四題齊備，對照 06 範本結構逐節核對。

- [ ] **Step 2: 交叉引用清除驗證**

Run: `grep -rn "13-user-stories" memory/Sens_wiki/wiki/erp/03-roles/_template-role.md memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md memory/Sens_wiki/wiki/erp/06-state-machines/_template-state-machine.md`
Expected: 零命中。
Run: `grep -n "遷移期" memory/Sens_wiki/wiki/erp/00-meta/erp_index.md memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md | wc -l`
Expected: ≥ 5（遷移期標注皆已就位）。

- [ ] **Step 3: 新範本禁用詞驗證**

Run: `grep -n "us-id\|priority:" memory/Sens_wiki/wiki/erp/07-scenarios/_template-business-scenario.md`
Expected: 零命中。

- [ ] **Step 4: 死鏈檢查**

以 obsidian-cli 檢查本次修改的卡無 dangling link（指令依 `.claude/rules/sens-wiki.md`：`obsidian deadends` 或 `obsidian eval` 查 `metadataCache.unresolvedLinks`，範圍限本次異動檔）。若 obsidian-cli 不可用，fallback：`grep -o "\[\[[^]]*\]\]" <本次修改各檔> | sort -u` 人工核對連結目標存在。
Expected: 本次新增的 wiki link（[[_template-business-scenario]] 等）皆可解析；既有斷鏈（如有）不在本次範圍，記錄呈報。

- [ ] **Step 5: 變體判斷表口頭推演**

按新範本 § 二推演三例並記錄結果於回報：「訂單取消退款」→ 接力型；「訂單複製」→ 能力型；「月結對帳」→ 排程型。三例皆應第一個命中對應變體。

- [ ] **Step 6: 確認 git 狀態乾淨**

Run: `git -C /Users/b-f-03-029/Sens status --short`
Expected: 無未提交變更（hook 已自動 push）。
