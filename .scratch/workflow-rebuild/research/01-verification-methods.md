# 需求與設計產出的品質驗證方法調研（raw 骨架草稿）

調研日：2026-11-11。標註「摘要工具，未逐字核對」者，是網頁讀取工具回傳的摘要，不是我讀到的原文。
一手原文（ISO 29148 全文、INCOSE 指南全文、BABOK 全文）都取不到，相關判準只能列二手轉述，已標明。
主對話抽查（2026-11-11）：spec-kit checklist、spec-kit analyze、DePaul 對照矩陣頁、Kiro 屬性測試頁、arXiv 2608.21298 摘要頁，五筆引句與原頁相符。其餘引句未抽查。

## 一、結論摘要

1. 公認的需求品質判準有兩層：單條需求（必要、無歧義、單一、可驗證等）與需求集合（完整、一致、可行）。現行稽核偏重「集合的完整與一致」，單條需求的「可驗證」與「無歧義」較少查。
2. 業界把「驗證」（verify，寫得對不對、夠不夠細、內部一致）與「確認」（validate，有沒有為利害關係人創造價值）分開。後者無法由文件稽核代替。
3. 系統分析工具中，實體與流程對照矩陣、狀態轉換表覆蓋、決策表、追溯矩陣可寫成程式自動檢查，且查的正是「設計本身有沒有漏」。
4. 實體生命史與資料流檢查可半自動：結構可程式查，事件是否合理需領域判斷。
5. 驗收條件（Given/When/Then）的價值在於把需求變成可執行例子；「寫得出可判定的 Then」本身就是可驗證性的檢查。
6. 原型測試與真實使用者驗證無法由代理替代。公開資料顯示小樣本重複測試即可抓出多數可用性問題。
7. 規格驅動開發工具（spec-kit、Kiro）的內建檢查，主要是歧義、矛盾、需求與任務覆蓋缺口，屬結構與一致性檢查，不判定設計對不對。
8. 公開研究顯示：以 LLM 當評審有位置偏差等偏誤；一項 34 人對照實驗指出 LLM 輔助降低新手找出需求缺陷的準確度（摘要來自 arXiv 摘要頁）。
9. 結論：稽核檢核項應從「齊不齊」轉向「可判定性」「覆蓋矩陣」「轉換完整性」，並保留人工領域判斷與真實使用者驗證的位置。

## 二、方法清單表

可否程式化：是＝可寫成腳本；半＝腳本查結構、人判內容；否＝需人。

| 方法 | 查什麼缺陷 | 何時用 | 可否程式化 | 領域判斷 | 真實使用者 | 來源 |
|------|-----------|--------|-----------|---------|-----------|------|
| 需求單條特性檢查（29148／INCOSE） | 歧義、複合需求、無法驗證、不必要 | 每條需求寫完 | 半（模糊詞、複合句可查；必要性需判斷） | 需要 | 否 | 二手，見 3.1 |
| 需求集合特性檢查 | 彼此矛盾、遺漏、不可同時成立 | 規格定稿前 | 半 | 需要 | 否 | 二手，見 3.1 |
| 驗證（verify）與確認（validate） | 前者查品質；後者查價值 | 兩階段分開 | 驗證半；確認否 | 確認需要 | 確認常需要 | IIBA（僅搜尋摘要），見 3.2 |
| CRUD 對照矩陣 | 實體無建立、無讀取、無修改、無刪除的流程 | 實體與流程定稿後 | 是 | 解讀缺口需要 | 否 | DePaul、KU Leuven，見 3.3 |
| 狀態轉換表覆蓋 | 缺少合法轉換、缺少非法轉換處理 | 有狀態機時 | 是 | 非法轉換是否合理需要 | 否 | ISTQB，見 3.4 |
| 決策表 | 條件組合遺漏、動作矛盾 | 規則有多條件時 | 是 | 組合的業務結果需要 | 否 | ISTQB，見 3.4 |
| 需求追溯矩陣 | 需求無對應設計或驗收；驗收無對應需求 | 全程 | 是 | 對應是否貼切需要 | 否 | Gotel and Finkelstein，見 3.5 |
| 實體生命史 | 實體事件順序缺漏、檢查事件未入生命史 | 實體多、有狀態時 | 半 | 需要 | 否 | Berrisford，見 3.6 |
| 資料流檢查 | 資料無來源、無去處 | 流程設計時 | 半 | 需要 | 否 | 未查證 |
| Given/When/Then 驗收條件 | 需求不可判定、缺前置情境 | 每條需求 | 半（格式可查；內容需判斷） | 需要 | 否 | Cucumber、Fowler，見 3.7 |
| 完成定義（DoD）與就緒定義（DoR） | 品質門檻不明；項目未達可開工 | 每次交付 | 半 | 需要 | 否 | Scrum Guide、Agile Alliance，見 3.8 |
| 審查會（Fagan inspection） | 設計與程式的缺陷，依角色與出場條件 | 重大設計 | 否 | 需要 | 否 | Fagan 1976（僅書目，原文未讀到），見 3.9 |
| 原型測試 | 可用性、流程是否合用 | 原型完成後 | 否 | 需要 | 需要 | NN/g，見 3.10 |
| spec-kit analyze 與 checklist | 重複、歧義、覆蓋缺口、術語漂移 | 規格與任務產出後 | 半（本身用 LLM） | 需要 | 否 | GitHub，見 3.11 |
| Kiro Analyze Requirements 與屬性測試 | 矛盾、歧義、隱含假設、邊界缺口 | 需求後、設計前 | 半 | 需要 | 否 | Kiro 文件，見 3.11 |

## 三、各方法細節與引句

### 3.1 需求特性（ISO/IEC/IEEE 29148、INCOSE）

- 標準本文與 INCOSE 指南本文都取不到（iso.org 與 incose.org 回應 403）。以下特性清單來自搜尋摘要轉述學術論文，摘要工具，未逐字核對。
- 單條需求（轉述 29148）：必要（necessary）、適切（appropriate）、無歧義（unambiguous）、完整（complete）、單一（singular）、可行（feasible）、可驗證（verifiable）、正確（correct）、符合（conforming）、可追溯（traceable）。來源：https://arxiv.org/pdf/2502.18617（搜尋摘要，未逐字核對）。
- 可驗證性的標準指引很少。轉述句："verifiability is enhanced when the requirement is measurable"（同上，摘要工具，未逐字核對）。
- 29148 不是強制法規標準，也無認證機構。出處為某廠商頁面，摘要工具，未逐字核對。
- INCOSE 指南把每個特性對應到一至多條撰寫規則。規則條數有 40 與 44 兩種說法，版本不同。現行版為 V4（2023），摘要表在 https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf（403，未讀到）。
- 白話：每條需求要能被獨立判定「寫得對不對」；整份規格要沒有互相打架或缺塊。
- 集合層特性（完整、一致、可行、有界）僅為我在工具回覆中看到的一般性說法，未查證。

### 3.2 驗證（verify）與確認（validate）（BABOK）

- IIBA 任務卡與知識中心頁面需登入，皆未讀到原文。
- 搜尋摘要轉述任務卡："ensure that requirements and designs specifications and models meet quality standards"（摘要工具，未逐字核對）。來源 https://www.iiba.org/contentassets/f488c7f5c5254ab2a14bd78177425012/task-card-verify-req-and-designs.pdf。
- 驗證查細節足夠、內部一致、品質高；通常由主題專家參與（同上轉述）。
- 確認：二手來源 microtool 說 "Validation concerns the value that a requirement creates for the stakeholders"（二手）。https://www.microtool.de/en/knowledge-base/requirements-in-business-analysis/
- BABOK v3 任務編號（7.3 與 7.4 或 7.2 與 7.3）來源矛盾，未查證。
- 九項驗證特性（含 atomic、complete）只見 cprime 部落格轉述，未查證。

### 3.3 CRUD 對照矩陣

- 查：每個實體是否都有建立、讀取、修改、刪除的流程。缺一個字母，代表可能漏了流程。
- 引句（DePaul 課程頁，摘要工具，未逐字核對）："at least one C, one R, one U, and one D entry"。https://condor.depaul.edu/jbernste/is315_CRUDmatrix.htm
- 起源：搜尋摘要稱 KU Leuven 論文說矩陣由 Martin 在資訊工程中提出（https://lirias.kuleuven.be/retrieve/119111，未讀到原文）。
- 同一實體有多個建立流程，可能是資料重複來源。DePaul 頁轉述。
- 注意：沒有 D 不一定是缺陷（例如帳務資料只作廢不刪除）。這是領域判斷。「無 C 即無來源」是業界慣用啟發式，非標準規定（搜尋工具自述）。
- 可程式化：是。輸入實體與流程清單，輸出缺格。

### 3.4 狀態轉換表與決策表

- ISTQB 詞彙表定義（搜尋摘要，未逐字核對）：狀態轉換測試是 "test conditions are state transitions or sequences of them"；決策表測試是設計測試案例以涵蓋條件組合與動作。https://glossary.istqb.org/en_US/term/state-transition-testing（頁面本文取不到）。
- 狀態表：每個事件在每個狀態下的合法與非法轉換之網格。來源為 ISTQB 3.4 版發行說明（搜尋摘要）。
- 查：每個狀態對每個事件是否有明確結果（含非法）；決策表條件組合是否全列、有無兩列條件相同但動作不同。
- 可程式化：是。狀態列舉與轉換條件若結構化，可自動產生「狀態乘事件」缺格。非法格是否該拒絕需領域判斷。

### 3.5 需求追溯矩陣

- 定義（搜尋摘要轉述 Gotel and Finkelstein 1994，未逐字核對）："the ability to describe and follow the life of a requirement"。https://discovery.ucl.ac.uk/749/（403，未讀到）。
- 該文結論（轉述）：多數追溯問題源於需求規格定稿前的追溯不足。
- 查：需求有無對應設計與驗收；驗收有無對應需求。
- spec-kit 的 analyze 範本已含此類檢查，見 3.11。
- 可程式化：是（對應關係是否貼切仍需人判斷）。

### 3.6 實體生命史

- 引句（Berrisford 頁，摘要工具，未逐字核對）："Any event that checks an object's state must appear"（原句為完整一句，我只截取前半，見該頁）。https://grahamberrisford.com/AM%203%20Models%20and%20rules/22%20Business%20rules/03.htm
- 起源：Jackson 提出，SSADM 採用，每實體一份生命史（維基百科轉述，非高可信，僅參考）。
- 查：實體從建立到終止的事件順序有無缺漏；每個檢查事件是否在生命史中。
- 可程式化：半。事件與實體對照可查；順序是否合乎業務需判斷。

### 3.7 Given/When/Then

- Cucumber 官方（摘要工具，未逐字核對）：Given 是 "initial context of the system"；When 是 "an event, or an action"；Then 是 "an expected outcome, or result"。https://cucumber.io/docs/gherkin/reference/
- Fowler：以具體例子指定系統行為。"specifying a system's behavior using SpecificationByExample"（摘要工具，未逐字核對）。https://martinfowler.com/bliki/GivenWhenThen.html
- 查：每條需求至少有一個可判定通過或未通過的 Then；前置情境是否明列。
- 可程式化：格式可（有 Given、When、Then 三段）；Then 是否可觀察需人判斷。

### 3.8 完成定義與就緒定義

- Scrum Guide（摘要工具，未逐字核對）："required to conform to the Definition of Done"。https://scrumguides.org/scrum-guide.html
- Agile Alliance：DoD 是達標前提的清單，也是團隊共識（摘要工具）。https://www.agilealliance.org/glossary/definition-of-done/
- 就緒定義（DoR）：Scrum Guide 沒有定義名為 DoR 的產物，只有「可在一個衝刺內完成的項目視為 ready」之說法（摘要工具，未逐字核對）。DoR 作為獨立標準的一手來源未查到，標未查證。
- 可程式化：DoD 的勾選項若為機械條件（測試通過、連結存在）可程式化；品質判斷項否。

### 3.9 審查會（Fagan inspection）

- 書目：Fagan 1976, IBM Systems Journal 15(3):182-211。https://ieeexplore.ieee.org/document/5388086。
- 全文 PDF 為掃描影像，工具讀不到文字。以下僅為搜尋摘要轉述，未逐字核對：每個開發作業要定義出場條件（exit criteria）；活動分為概覽、準備、檢查、重做、追蹤；錯誤按類型分類以改進流程。
- 角色與缺陷偵測數字，原文未讀到，未查證。
- 可程式化：否，需人。AI 代理可充當準備階段的前置檢查，但見 3.11 的限制。

### 3.10 原型測試

- NN/g："found 85% of the usability problems"（指首輪五人測試；摘要工具，未逐字核對）；"After creating the new design, you need to test again."（同）。https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- 該文並未專門討論原型，只談小樣本重複測試。
- 可程式化：否。需要真實使用者。

### 3.11 規格驅動開發與 AI 代理稽核

| 工具 | 檢查機制（一手來源） | 已知限制 |
|------|------------------|---------|
| GitHub spec-kit analyze | 範本寫明唯讀；查重複、歧義、不足規格、憲章衝突、需求無任務、任務無需求、術語漂移；嚴重度分四級 | 範本只產生報告；未見對「設計是否正確」的檢查 |
| spec-kit checklist | 範本稱檢核表是 "UNIT TESTS FOR REQUIREMENTS WRITING"，且 "NOT for verification/testing" | 查的是需求寫法，不查實作 |
| Kiro Analyze Requirements | 查邏輯矛盾、歧義措辭、衝突限制、隱含假設、邊界缺口 | 文件稱 "takes minutes, not seconds"；選用；手改後要重跑 |
| Kiro 屬性測試 | 屬性是 "a universal statement about how your system should behave" | 文件自述 "evidence of correctness, not a proof"；"Identifying and defining useful properties takes work" |
| OpenSpec | 每條需求配 WHEN/THEN 情境；人審計畫後才寫程式 | 文件稱 "works best with high-reasoning models"；我讀到的頁面未見驗證指令說明，未查證 |

來源（以上引句皆摘要工具，未逐字核對）：
- https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/analyze.md
- https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/checklist.md
- https://kiro.dev/docs/specs/analyze-requirements/
- https://kiro.dev/docs/specs/correctness/
- https://github.com/Fission-AI/OpenSpec

第三方評論（非原廠，高可信度中等）：Martin Fowler 站上的文章（摘要工具，未逐字核對）指出 spec-kit 產出 "very verbose and tedious to review"；"I frequently saw the agent ultimately not follow all the instructions"；工具需要 "a very good spec review experience"。https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html

學術證據：
- LLM 當評審：Zheng 等人研究 "position, verbosity, and self-enhancement biases"；GPT-4 與人類偏好一致率超過 80%（摘要工具，未逐字核對）。https://arxiv.org/abs/2306.05685
- 34 人對照實驗：LLM 輔助 "negatively affects smell detection accuracy"，作者結論集中於新手檢查者（摘要工具，未逐字核對；arXiv 編號 2608.21298，我無法獨立確認該頁面真實性以外的內容）。https://arxiv.org/abs/2608.21298

## 四、可轉成稽核檢核項的候選陳述

每條可判定通過或未通過。標 A 為可程式化，B 為半自動，C 為需人。

| 編號 | 陳述 | 類別 | 依據 |
|------|------|------|------|
| V1 | 每條需求句只含一個應做的事（無「且」「以及」並列兩個動作） | B | 單一性（3.1） |
| V2 | 需求句不含未量化的模糊詞（例如「快速」「適當」「大量」） | B | Kiro 歧義例（3.11） |
| V3 | 每條需求至少有一條 Given/When/Then，且 Then 描述可觀察結果 | B | 3.7 |
| V4 | 實體清單中，每個實體在流程對照矩陣都有建立流程；缺建立流程者已標註理由 | A | 3.3 |
| V5 | 每個實體都有讀取、修改、終止（刪除或作廢）流程，缺者已標註理由 | A | 3.3 |
| V6 | 狀態機中每個「狀態乘事件」格都有結果，非法轉換已列明處理 | A | 3.4 |
| V7 | 每個狀態轉換都有明確轉換條件 | A | 3.4 |
| V8 | 多條件規則已列成決策表，且無兩列條件相同而動作不同 | A | 3.4 |
| V9 | 每條需求至少對應一條驗收；每條驗收至少對應一條需求 | A | 3.5 |
| V10 | 每個實體的生命史中，每個「檢查狀態」的事件都已列入 | B | 3.6 |
| V11 | 規格內沒有兩條需求在同一條件下要求互斥結果 | C | 一致性（3.1） |
| V12 | 每條需求可追溯到業務目的（必要性） | C | 必要（3.1） |
| V13 | 已區分「寫得對」（驗證）與「值得做」（確認）兩類檢查，確認類有指定判定人 | C | 3.2 |
| V14 | 重大設計經至少一位非作者的人審過，並記錄缺陷類型 | C | 3.9 |
| V15 | 涉及畫面流程的設計，有一輪真實使用者或原型試用紀錄 | C | 3.10 |
| V16 | AI 稽核的發現，有一次人工抽查比對，記錄誤報與漏報 | C | 3.11 學術證據 |
| V17 | 稽核報告區分「文件結構問題」與「設計本身問題」 | C | 本調研結論，非外部標準 |

## 五、未查證與存疑項

| 項目 | 狀況 |
|------|------|
| ISO/IEC/IEEE 29148 條文原文 | iso.org 回 403；只有二手轉述。需要購買或取得標準全文 |
| INCOSE 撰寫指南規則原文與條數 | incose.org 回 403；條數有 40 與 44 兩說，未解 |
| BABOK v3 驗證與確認任務編號、九項特性 | IIBA 需登入；任務編號來源矛盾 |
| 需求集合層特性 | 只有工具自述的一般說法，沒有可引的一手原句 |
| Fagan 1976 角色與缺陷偵測數字 | 全文為掃描影像，讀不到文字 |
| CRUD 矩陣在 Martin 原書的說法 | 只有二手轉述；「缺 D 即缺陷」屬啟發式 |
| 就緒定義（DoR）的一手來源 | Scrum Guide 未定義 DoR；未找到其他一手來源 |
| 資料流檢查（DFD 平衡等） | 本輪未查 |
| INVEST 準則、使用者故事驗收寫法 | 本輪未查 |
| OpenSpec 的驗證機制 | 取得的頁面未描述；未查證 |
| LLM 稽核規格的誤報率與漏報率 | 未找到直接針對規格稽核的量化研究。上列兩項是鄰近證據 |
| 搜尋結果中其他 2026 年 arXiv 論文（如規格層級推理評測） | 只見標題與搜尋摘要，未讀，不採用 |
| 摘要工具引句 | 本檔大多引句來自摘要工具，需要在採用前由主對話抽查原頁 |
