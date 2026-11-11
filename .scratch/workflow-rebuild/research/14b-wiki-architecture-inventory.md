# 14b wiki 架構面盤點

主對話抽查（2026-11-11）：相符：全庫 935 個 .md；`ERP 詞彙表` 2216 行、`log.md` 4873 行、`wiki-schema` 576 行；`index.md` 第 17 行讀者定位原文；實測例子甲的卡清單。其餘數字未逐項查證。


盤點對象：`memory/Sens_wiki/` 的架構面內容（目錄、規範、範本、索引、卡片類型、檢查腳本），不含業務內容本身。
基準：工作樹 HEAD（`39108c3`），盤點日 2026-11-11。只讀，未改任何既有檔。
引用上次盤點時簡稱「03 盤點」，檔案為 `.scratch/workflow-rebuild/research/03-environment-inventory.md` 第九、十節。

## 一、摘要

1. 全庫 935 個 `.md`（`find memory/Sens_wiki -name "*.md" | wc -l`）。其中 erp 現行卡 632 張（排除封存），管「怎麼寫」的檔 6966 行（算法見第三節），另有操作史 `log.md` 4873 行（1.1 MB）與封存的 `changelog.md` 1473 行。
2. 已併入 HEAD 的批 6 讓卡數高於 03 盤點：wiki 現為 892 張，03 盤點為 847。`git merge-base --is-ancestor 14e0e79 HEAD` 成立，03 盤點第十節「批 6 未併入 master」已過時。
3. 架構面的主要成本不在檔案數，而在層疊：每種卡型最多有骨架、規範、範例、欄位表（`wiki-schema`）、不收清單（`wiki-schema` § 十一）、稽核維度（規範加 vault-audit 維度表）六處定義，同一規則要同 commit 改多處。
4. 讀者定位矛盾：`wiki/index.md` 第 17 行寫「結構只服務於人；機器可解析的結構……wiki 不為此妥協」，與 Miles 現在的前提（讀者是 AI 模型）相反。憲章需要重寫。
5. 結構負擔實測：「需求單待評估成本誰能做什麼」至少讀 7 張卡、849 行；「印件預計交期規則」至少讀 9 張卡、691 行（再加情境卡 791 行）。兩例的詞彙定義若走 `ERP 詞彙表`（2216 行）都再加 2216 行。
6. 三張超大卡：`ERP 詞彙表` 2216 行、`ERP 資料結構總覽` 1457 行、`wiki-schema` 576 行。erp 現行卡（不含封存）的行數中位數只有 42。
7. 檔案間有可驗證的矛盾與過時內容，共 12 處（第三節末「矛盾與過時清單」）。
8. 去留小計（30 項，檔案群算一項）：留 6、改寫 16、併入 3、刪 2、待判 3。可直接刪 1602 行，併入後可刪 316 行。
9. OQ：平層 80 張全是 open、audience 全是 internal；封存 234 張。`oq-manage` 規範與 `OQ運作總覽` 對外確認流程的說法互相矛盾。
10. 其他頂層資料夾：`編輯器` 8 張（最後實質內容修改 2026-08-31，最近一次提交 2026-11-04 是改名）、`跨產品` 1 張，仍有效但幾乎不更新。

## 二、目錄樹與卡數

算法：對每個資料夾 `find <路徑> -name "*.md" | wc -l`；`type` 用 Python 讀 frontmatter；近 60 天提交數 `git log --since=2026-09-12 --oneline -- <路徑> | wc -l`。「直屬」只算該資料夾第一層。

| 路徑 | 直屬 | 含子層 | 60 天提交 | 用途 | type 分布 |
|------|-----|-------|----------|------|-----------|
| `memory/Sens_wiki/AGENTS.md` | 1 | 1 | 2 | 知識庫操作入口 | 無 frontmatter |
| `raw/` | 41 | 42 | 12 | 已驗證但未精練的素材；`_attachments/` 為 PDF、docx | raw 40、meta 1（README） |
| `wiki/`（根） | 2 | 892 | 268 | 總目錄 `index.md`、操作史 `log.md` | meta 2 |
| `wiki/erp/`（根） | 2 | 869 | 252 | ERP 詞彙表與其規範 | glossary 1、meta 1 |
| `wiki/erp/00-meta/` | 6 | 6 | 55 | 共用規範、schema、入口、邊界、分類框架、封存 changelog | meta 6 |
| `wiki/erp/01-products/` | 3 | 3 | 13 | 北極星指標、專案範疇、痛點 | product-vision 1、phase 1、metric 1 |
| `wiki/erp/03-roles/` | 21 | 21 | 87 | 角色定位與分工理由 | role 19、meta 1、example 1 |
| `wiki/erp/04-business-logic/` | 8 | 397 | 150 | 流程架構、受控清單、服務藍圖、活動清單、營運規則、領域知識、外部約束 | business-rule 311、activity-list 41、rule-group 28、service-blueprint 9、example 4、meta 2、controlled-list 1、process-architecture 1 |
| 　`服務藍圖/` | — | 50 | — | 9 條藍圖加 41 張活動清單 | 見上 |
| 　`營運規則/` | — | 331 | — | 3 個領域（售前 36、帳務 45、訂單到交付 250）、28 個規則組資料夾，303 張規則卡 | 見上 |
| 　`外部約束/`、`領域知識/` | — | 5、3 | — | 法規與外部系統約束、行業知識 | business-rule |
| `wiki/erp/05-entities/` | 42 | 45 | 170 | 實體欄位與操作、資料結構總覽；`_archives/` 3 張 | entity 36、structure-overview 5、meta 2、example 2 |
| `wiki/erp/06-state-machines/` | 23 | 23 | 93 | 狀態列舉與轉換 | state-machine 21、meta 1、example 1 |
| `wiki/erp/07-scenarios/` | 45 | 45 | 126 | 跨角色端到端情境 | scenario 43、meta 1、example 1 |
| `wiki/erp/08-open-questions/` | 83 | 317 | 97 | 待裁決問題；平層 80 張 open，`_archives/2026/` 234 張 | open-question 314、meta 2、example 1 |
| `wiki/erp/11-review-knowledge/` | 4 | 10 | 22 | 規劃品質量尺、誤判記錄、參考模型、稽核素材 | meta 3、review-knowledge 3、reference-model 3、misjudgement-record 1 |
| `wiki/範本/` | 12 | 12 | 21 | 起手骨架 | 各型 1 張（raw、role、service-blueprint、activity-list、structure-overview、open-question、state-machine、scenario、rule-group、reference-model、entity、business-rule） |
| `wiki/編輯器/` | 2 | 8 | 1 | 線上編輯器產品的詞彙表與自訂刀模卡 | product-vision 1、glossary 1、business-rule 3、entity 1、state-machine 1、scenario 1 |
| `wiki/跨產品/` | 1 | 1 | 3 | 印刷業共用術語表 | glossary 1 |

校驗：type 計數合計 921，加範本 12、`AGENTS.md` 與 `raw/_attachments/01_workflow` 各 1，等於 935。
編號缺口：目錄編號沒有 02、09、10（03 盤點未提）。`審查知識路由.md` 第 10、14 行仍寫「01～10 業務層」「在 02～07」。

卡片規模：erp 現行卡（排除 `_archives`）632 張，合計 47,486 行，中位數 42 行。算法：Python 走訪 `wiki/erp` 排除 `_archives` 後 `wc -l`。最大三張為 `ERP 詞彙表` 2216、`changelog` 1473（封存）、`ERP 資料結構總覽` 1457。

## 三、規範與範本逐檔表

行數算法：`wc -l`。「60 天提交」同第二節。「被引用」欄：skill 欄位算法為在 `.claude/skills/`、`.claude/agents/`、專案與 wiki 兩份 `AGENTS.md` 內搜檔名；「卡」欄為 wiki 內（不含 `log.md`、`changelog.md`）提到該檔名的卡數。skill 名稱依檔案路徑判定，未逐處確認是實質依賴還是附帶提及。

判準欄是「今天從零建立給 AI 讀、要當測試依據的需求知識庫，會不會放這個檔」。

### 3.1 入口、總目錄、操作史

| 檔 | 行 | 60天 | 規定了什麼 | 被引用 | 重複或矛盾 | 去留與理由 |
|----|---|-----|-----------|-------|-----------|-----------|
| `memory/Sens_wiki/AGENTS.md` | 60 | 2 | 目錄讀寫權限（L9-16）；連結、命名、業務編號禁 `#`（L18-25）；寫入後更新 index 與 log（L27-41）；陷阱（L43-50）；工作流入口（L52-60） | 專案 AGENTS、wiki-amend、vault-audit | L14 `assets/` 目錄不存在；L15「加上 change 資料夾內的檔」，change 流程已廢；L48 禁以 grep 稽核，但 `OQ運作總覽` L34-35 教人 grep | 改寫：入口檔必須有，但要去掉已不存在的目錄與流程 |
| `wiki/index.md` | 95 | 32 | 憲章：本質、讀者、兩判準、單元定位模式（L11-50）；基石檔（L52-55）；主題入口與手寫卡名清單（L57-95） | AGENTS（兩份）、wiki-amend | L17 讀者是不參與開發的 PM，與 AI 讀者前提相反；L79 手寫 41 張活動清單名，與腳本產生的 `erp_index` 清單重複；L89 用 `[[wiki/編輯器/product-vision]]` 路徑式連結，違反 `AGENTS.md` L21 | 改寫：憲章保留但讀者與「機器結構不妥協」整段重寫；手寫清單與 `erp_index` 擇一 |
| `wiki/log.md` | 4873 | 225 | 全庫唯一只追加層；每次動 wiki 追加一筆，變更逐卡、動機必填（L1-12 與 `AGENTS.md` L29-41）。878 條（`grep -c "^## \[" log.md`），1,130,914 位元組 | 9 個 skill 與 `AGENTS.md`；wiki 22 張卡 | L12 仍寫「vault 根 `CLAUDE.md` § 四」，已改名 AGENTS.md；`last-reviewed: 2026-06-02` 但持續追加 | 待判：缺 Miles 是否仍要「用 `[[卡名]]` 搜歷史」。若 `git log` 加提交訊息已能承載動機，則可刪 |

### 3.2 `00-meta/`

| 檔 | 行 | 60天 | 規定了什麼 | 被引用 | 重複或矛盾 | 去留與理由 |
|----|---|-----|-----------|-------|-----------|-----------|
| `卡片撰寫共用規範.md` | 347 | 12 | 骨架、規範、範例三層及七條治理鐵則（L11-29）；骨架通用性評分表（L31-48）；撰寫流程與落點表（L72-119）；跨卡撰寫順序（L121-138）；正規化與用語統一（L140-202）；停下鐵則（L204-222）；撰寫紀律十二條（L224-240）；共用稽核維度 L1（L242-270）；禁止清單 F1-F9（L272-286）；機械自檢 S1-S15、X1-X9（L288-336） | wiki 卡 34 張；erp-plan、wiki-amend、vault-audit、AGENTS | L242-270 的 L1-1 至 L1-13 與 vault-audit 的「維度 1 至 17」兩套編號並存（`wiki-schema` L445 自述不重複維度清單，但共用規範再列一套）；L267-268 的 L1-13 排在 L1-12 之前；L31-48 的評分表只在新增骨架時用 | 改寫：核心（落點表、正規化、L1、機械自檢）保留；一次性治理的評分表與撰寫流程中重述 skill 步驟的部分可縮 |
| `wiki-schema.md` | 576 | 17 | 21 種 type 的值域（L12-35）；module 值域（L49-62）；領域 tag 格式（L64-76）；status 值域（L78-90）；各 type 必填欄位（L92-420，腳本讀這一節）；目錄允許的 type（L422-441）；命名規約（L449-521）；連結規約（L523-527）；anti-pattern（L529-539）；與其他規範關係（L541-551）；各卡型內容職責（L553-576） | wiki 卡 29 張；vault-audit（腳本解析它）、wiki-amend、AGENTS | § 一 enum 表（L12-35）沒有 `example`，但 L122 定義、腳本 `mechanical_check.py` L378、L403 處理；§ 二 module 值域只剩 OQ 與 raw 使用（canon 卡已移除，`mechanical_check.py` L49 `REMOVED_ON_CANON`）；L493 Insight 卡命名，wiki 已無 insight 類型；§ 六（L443-447）只指向 skill，沒有內容；§ 十一內容職責表（L553-576）與各規範「不收清單」同義三處並存；L98、L553 的日期敘述屬迭代史 | 改寫：欄位值域與必填欄位（§一至§五）是腳本的資料來源必須留；刪 Insight、空殼 §六、重複的 §九與 §十一 |
| `business-domain-taxonomy.md` | 124 | 5 | 領域 tag enum（六領域加全域，L33-82）；邊界判斷（L83-92）；新增領域準則（L94-108）；檢索規約四步（L24-31）；演化紀錄（L110-118） | 6 個引用：專案 AGENTS、erp-audit、erp-plan、oq-manage、vault-audit、wiki AGENTS；wiki 卡 30 張 | L110-118 演化紀錄屬迭代史，違反共用規範 L1-4；`erp_index` L121 仍稱「6 領域 + 跨領域共用層」，已被 L77 的「全域」哨兵取代 | 改寫：tag 與檢索規約是現行運作的核心，刪演化紀錄 |
| `scope-boundary.md` | 154 | 6 | 收什麼（L12-58）；不收：UI、演算法、驗收測試、規劃單與 Linear、過程決策（L60-117）；判斷對照表（L119-137）；違反案例（L139-149） | 專案 AGENTS、vault-audit、vault-ingest、wiki-amend；wiki 卡 8 張 | L98-108「系統行為規格與交付」整段與專案 AGENTS § 正本分層重複；L75 殘留「原承載卡已隨舊三 agent 審查體系刪除」，屬歷史；L66 把 Prototype 規範入口寫成 skill 路徑 | 改寫：保留「收／不收」判準；實作側分界交給專案 AGENTS 單一處 |
| `erp_index.md` | 130 | 31 | 分層結構與連結方向（L15-43）；檢索方式（L47-49）；卡片清單由腳本產生（L53-115）；治理工具（L116-125）；變動紀律（L127-130） | vault-audit 腳本（`wiki_lint.py` L32 `ERP_INDEX`）；wiki 卡 21 張 | L21-26 分層表與 `wiki-schema` L38-47 分層對應表同義；L121 同上過時；清單由腳本重寫，60 天內 31 次提交多為機械更新 | 改寫：只留腳本產生的清單；分層與連結方向各留一處 |
| `changelog.md` | 1473 | 1 | 已凍結封存（2026-06-10）；內容為舊操作史 | 3 張 wiki 卡；skill 內的 changelog 字樣多為 skill 自身的 CHANGELOG.md，未逐一確認 | 與 `log.md` 同為操作史，且 L1-L5 自述停止維護 | 刪：git 歷史已保留，AI 讀者不會讀 1473 行封存檔 |

### 3.3 單元規範（各資料夾內，9 份）

七份單元規範（角色、商業邏輯、活動清單、實體、狀態機、業務情境、OQ）採同一組骨架：〇定位、判斷表、前提確認、撰寫規則、修改前檢查、邊際情境、停下條件、產出格式、不收清單、擴張準則、稽核維度、禁止清單、機械自檢、相關卡（標題見各檔 `grep -n "^## "`）。資料結構總覽與詞彙表規範較短。
逐字重複少：以 28 字以上整行比對（Python，排除標點與空白）只有 22 組相同行，多為「相關卡」連結行與兩句共通導語。重複主要是結構與語意重複，不是逐字重複。

| 檔 | 行 | 60天 | 規定了什麼（重點） | 被引用 | 去留與理由 |
|----|---|-----|-----------------|-------|-----------|
| `03-roles/規範 - 角色.md` | 219 | 6 | 角色卡定位（職位、分工理由，不寫能力清單）；判斷表；稽核維度；機械自檢 | vault-audit；卡 8 | 改寫：稽核維度與機械自檢和腳本、vault-audit 並存，需擇一正本 |
| `04-business-logic/規範 - 商業邏輯.md` | 504 | 21 | 一份規範管服務藍圖（§三）、商業規則（§四）、規則組拆卡（§四之二）；分類判斷表（§二）；目錄結構（§十四）；稽核維度（§十三）；機械自檢（§十六） | vault-audit、wiki-amend；卡 15 | 改寫：同一份涵蓋三種卡型，並與 `規範 - 活動清單` 在同一資料夾，哪個卡型找哪份要靠判斷表 |
| `04-business-logic/規範 - 活動清單.md` | 278 | 8 | 活動表六欄（編號、活動、執行角色、範圍、依據欄位、操作）；執行者與範圍值域指向受控清單 | vault-audit；卡 12；authority_check.py | 改寫：同上 |
| `05-entities/規範 - 實體.md` | 312 | 16 | 欄位表固定欄位；操作段與編號；欄位算式歸本卡；不寫角色名 | vault-audit、wiki-amend；卡 10 | 改寫：同上 |
| `05-entities/規範 - 資料結構總覽.md` | 143 | 9 | 關聯與基數唯一正本；領域視角三視圖 | erp-plan；卡 6 | 留：短，且對應 5 張實際卡 |
| `06-state-machines/規範 - 狀態機.md` | 302 | 10 | 狀態列舉正本；UML 轉換表；觸發操作指向實體操作段 | vault-audit；卡 10 | 改寫：同上 |
| `07-scenarios/規範 - 業務情境.md` | 317 | 12 | 情境三變體（接力型、能力型、排程型）；活動欄指向活動清單 | vault-audit；卡 9 | 改寫：同上 |
| `08-open-questions/規範 - OQ.md` | 216 | 5 | OQ 卡格式、取號、去重；L46 audience 現階段一律 internal | oq-manage、vault-audit；卡 5 | 改寫：L46 與 `OQ運作總覽` L25、L38-41 矛盾 |
| `erp/規範 - 詞彙表.md` | 85 | 2 | 詞條格式、相近詞判定、避免用詞 | wiki-amend；卡 4 | 留：`ERP 詞彙表` 是用語正本，需要格式規範 |

稽核維度三處並存：規範內的 L2、L3，共用規範的 L1，`.claude/skills/vault-audit/references/稽核維度.md`（225 行）的維度 1 至 17。
機械自檢兩處並存：各規範的「機械自檢」段（以 `規範 - 實體` L256-300 為例，45 行），與 `wiki_lint.py` S1-S15。兩處逐項重疊程度未查證。

### 3.4 骨架與範例（22 份）

| 群 | 份 | 行 | 60天 | 規定了什麼 | 被引用 | 去留與理由 |
|----|---|---|-----|-----------|-------|-----------|
| `wiki/範本/範本 - <型>`（12 張） | 12 | 864（48 至 111） | 21（全群） | 各型起手樣板：frontmatter 樣板加段落標題加填寫提示；L21 治理鐵則規定骨架與 `wiki-schema` § 四同 commit 對齊 | linear-delivery、oq-manage、vault-ingest、wiki-amend；卡 20 | 留：寫新卡的起手檔，AI 複製最省事。注意欄位定義在 `wiki-schema` 與骨架各一份；其中 10 張 `last-reviewed` 為 `{{date}}` 佔位 |
| `範例 - <型>`（10 張，分散在各資料夾） | 10 | 1126（66 至 198） | 82（全群，各檔提交數加總） | 展示合規成品；不與來源卡同步、不揹正確性；豁免孤島與 frontmatter lint（共用規範 L25-28） | linear-delivery、vault-audit、wiki-amend；卡 31 | 待判：AI 撰寫時範例有示範價值，但每次規範改版要同 commit 更新 10 份；缺「有範例與無範例的寫卡品質差」證據 |

### 3.5 `11-review-knowledge/`

| 檔 | 行 | 60天 | 規定了什麼 | 被引用 | 重複或矛盾 | 去留與理由 |
|----|---|-----|-----------|-------|-----------|-----------|
| `審查知識路由.md` | 79 | 14 | 目錄與去留表（L16-27）；規劃流九步（L29-41）；分級表輕量、局部、結構性（L43-51）；正本重構流六階段（L53-68）；11 層寫入入口與參考模型寫法（L70-74） | 專案 AGENTS、erp-audit、erp-plan、vault-ingest、vault-audit、wiki-amend、wiki AGENTS；卡 11 | 規劃流與分級在專案 AGENTS § 工作入口、`erp-plan` skill、本卡三處；L10、L14 的「01～10」「02～07」編號與現況不符；L24-26 自己已建議封存三張 `_shared` 檔 | 改寫：流程正本應只在一處，本卡只留 11 層目錄 |
| `規劃品質評分準則.md` | 132 | 8 | 設計準則、六項收件條件、判定值與輪數、檢核陳述（5 類共 20 項）、業界比對、對抗推演、稽核者紀律、門檻值（L120-125 全庫唯一出處） | erp-audit、erp-plan、linear-delivery、oq-manage、wiki-amend；卡 10 | 無明顯重複 | 留：稽核量尺，且被規劃與稽核雙向使用；可當測試依據的重點檔 |
| `帳務規劃連帶矩陣.md` | 99 | 6 | 13 種收付款情境索引；七實體連帶矩陣 | erp-plan、wiki-amend；卡 11 | 與 `07-scenarios` 帳務情境卡、`ERP 資料結構總覽` 的重疊程度未比對 | 待判：缺它與情境卡、總覽卡的逐項比對 |
| `稽核誤判記錄.md` | 74 | 4 | 禁用推論模式與誤判案例，`erp-audit` 追加 | erp-audit、vault-audit、wiki-amend；卡 9 | 無 | 留：累積案例，被 4 個 skill 使用 |
| `_shared/audit-failure-patterns.md` | 176 | 2 | 稽核反模式；`last-reviewed: 2026-05-28`，超過 `stale_days` 90 | 僅 erp-plan；卡 4 | 與 `稽核誤判記錄` 主題重疊；`erp-plan/CHANGELOG.md` L26 已把有案例條目移入 SKILL | 併入：`稽核誤判記錄`（有案例條目已在 erp-plan 陷阱段，其餘併入後刪） |
| `_shared/archive-completeness-misjudgement.md` | 93 | 0 | 封存完整性誤判案例；frontmatter 仍掛 `senior-pm`、`ceo-reviewer`、`erp-consultant` 等已除役 agent | erp-audit 的 `references/誤判要素.md` L40；卡 1（路由） | 屬案例卡，與誤判記錄同類 | 併入：`稽核誤判記錄`；併入前先改 erp-audit 的 L40 引用 |
| `_shared/e2e-planning-checklist.md` | 129 | 0 | 端對端測試規劃檢核；`last-reviewed: 2026-05-20` | skill 0 張；卡 1（路由） | `scope-boundary` L86-96 說測試屬 `erp-prototype-tests/`，與本檔放在 wiki 矛盾；路由 L26 已建議移走或刪除 | 刪：零 skill 引用；`erp-prototype-tests/` 是否已有等價檢核表未查證 |
| `參考模型/{售前,生產執行,訂單管理}.md` | 49、80、42 | 5（全群） | 業界做法、守恆量、公司偏離；每條附 raw 出處 | 評分準則 § 五；路由 L23 | 只有三領域；六領域另三領域缺 | 留：評分準則 § 五的素材來源 |

### 3.6 其他管「怎麼寫」的檔

| 檔 | 行 | 60天 | 規定了什麼 | 被引用 | 重複或矛盾 | 去留與理由 |
|----|---|-----|-----------|-------|-----------|-----------|
| `08-open-questions/OQ運作總覽.md` | 47 | 1 | OQ 平層與封存結構；三條軸線（狀態、audience、封存）；查詢方式；Notion 同步策略 | skill 0；卡 2 | L34-35 教人 grep，與 `AGENTS.md` L48 矛盾；L25、L38-41 的 external 與 Notion 同步，與 `規範 - OQ` L46「一律 internal」矛盾；`last-reviewed: 2026-06-13` | 併入：`規範 - OQ`（結構與軸線只剩一處，矛盾順便消） |
| `raw/README.md` | 114 | 1 | 定位、命名、status 演進、觸發指引、附件、四道防線、skill 銜接 | vault-ingest | 命名與欄位在 `wiki-schema` L392-420、L497-510 與 `範本 - Raw 素材` 再寫一份；L90「Anti-Model-Collapse」引文 | 改寫：它實際是 raw 的規範，與 `wiki-schema` 去重 |

### 3.7 矛盾與過時清單（可逐行驗證）

| # | 位置 | 問題 |
|---|------|------|
| 1 | `index.md` L17 與 L38 | 讀者是 PM、「機器可解析的結構不妥協」，與 AI 讀者前提相反 |
| 2 | `AGENTS.md` L14、L15 | `assets/` 不存在；change 資料夾流程已廢（專案 AGENTS 改用 `.scratch/<主題>/`） |
| 3 | `OQ運作總覽.md` L34-35 與 `AGENTS.md` L48 | 一個教 grep、一個禁用 |
| 4 | `OQ運作總覽.md` L25、L38-41 與 `規範 - OQ.md` L46 | 對外確認與 Notion 推送，另一份寫現階段一律 internal；實測平層 80 張 audience 全為 internal |
| 5 | `wiki-schema.md` L12-35 與 L122、`mechanical_check.py` L378 | `example` 不在 enum 表內，卻被定義與處理 |
| 6 | `wiki-schema.md` L49-62、`mechanical_check.py` L49 | module 值域仍列，canon 卡已不准用，只剩 OQ 316 張與 raw 使用（`grep -rl "^module:"` 在 03、04、05、06、07 為 0，08 為 316/317） |
| 7 | `erp_index.md` L121 與 `business-domain-taxonomy.md` L77 | 「跨領域共用層」已改成「全域」哨兵 |
| 8 | `log.md` L12 | 仍指 `CLAUDE.md`，已改名 AGENTS.md |
| 9 | `審查知識路由.md` L10、L14 | 「01～10」「02～07」，實際編號為 00、01、03 至 08、11 |
| 10 | `scope-boundary.md` L98-108 與專案 AGENTS § 正本分層 | 規劃單、測試、Linear 的分界寫兩處 |
| 11 | `scope-boundary.md` L86-96 與 `e2e-planning-checklist.md` | 測試屬 `erp-prototype-tests/`，檢核表卻放 wiki |
| 12 | `卡片撰寫共用規範.md` L267-268 | L1-13 排在 L1-12 之前，編號與順序不一致 |

另一項來源鏈風險：卡 `source` 欄引用 `.scratch/` 路徑的有 54 張，引用 `memory/erp/` 路徑的有 336 張（Python 讀 frontmatter，erp 排除 `_archives`）。專案 AGENTS 說 `.scratch` 規劃單「做完不合併」，這些依據路徑的長期有效性未查證。

## 四、卡片類型表

欄位檢查來源：`wiki-schema` § 四 的 yaml 區塊由 `mechanical_check.py` 解析成必填欄位表（L304 回傳 `required`）。三支腳本分工：

| 腳本 | 行 | 檢查什麼 |
|------|---|---------|
| `.claude/skills/vault-audit/scripts/wiki_lint.py` | 549 | 寫入時單卡 S1-S15 與跨卡 X1-X9 |
| `.claude/skills/vault-audit/scripts/mechanical_check.py` | 745 | vault-audit 機械維度 2、5、6、7、8、9、10、11、17（值域、孤島、死鏈、過時、OQ、raw 等） |
| `.claude/skills/vault-audit/scripts/authority_check.py` | 431 | 活動清單、實體操作段、狀態機觸發操作、情境活動欄的格式與關聯（OP、ACT 編號） |

| 類型 `type` | 張數 | 骨架 | 規範 | 範例 | 必填欄位（`wiki-schema` § 四） | 欄位由誰檢查 |
|------------|-----|-----|-----|-----|-------------------------|------------|
| entity 實體 | 37 | 有 | `規範 - 實體` | 有 | type、tags、source、status、last-reviewed | wiki_lint S1；mechanical_check；authority_check |
| state-machine 狀態機 | 22 | 有 | `規範 - 狀態機` | 有 | 同上 | 同上 |
| scenario 情境 | 44 | 有 | `規範 - 業務情境` | 有 | 同上加 variant | 同上 |
| role 角色 | 19 | 有 | `規範 - 角色` | 有 | type、tags、source、status、last-reviewed | wiki_lint S1；mechanical_check |
| business-rule 商業規則 | 314 | 有 | `規範 - 商業邏輯` | 有 | type、mutability、tags、source、status、last-reviewed | wiki_lint S1、S9-S13；mechanical_check |
| rule-group 規則組 | 28 | 有 | `規範 - 商業邏輯` § 四之二 | 有 | type、tags、source、status、last-reviewed | wiki_lint X2（成員與索引一致） |
| service-blueprint 服務藍圖 | 9 | 有 | `規範 - 商業邏輯` § 三 | 有 | type、tags、source、status、last-reviewed | wiki_lint S1；authority_check |
| activity-list 活動清單 | 41 | 有 | `規範 - 活動清單` | 有 | type、blueprint、stage、tags、source、status、last-reviewed | authority_check（活動編號與六欄） |
| controlled-list 受控清單 | 1 | 無 | 無獨立規範（`規範 - 商業邏輯` 提及 3 次） | 無 | type、tags、source、status、last-reviewed | wiki_lint S1；authority_check（值域） |
| process-architecture 流程架構 | 1 | 無 | 無獨立規範（`規範 - 商業邏輯` 提及 7 次） | 無 | 同上 | wiki_lint S1 |
| structure-overview 資料結構總覽 | 5 | 有 | `規範 - 資料結構總覽` | 有 | 同上 | wiki_lint S11（基數只能在全系統總覽）；mechanical_check |
| glossary 詞彙表 | 3 | 無 | `規範 - 詞彙表` | 無 | type、module、status、last-reviewed | wiki_lint S7、S8、S14 |
| open-question OQ | 314 | 有 | `規範 - OQ` | 有 | type、module、tags、oq-id、status、priority、audience、raised-at、raised-by、source-link、related-vault 等 17 欄 | mechanical_check（取號、前綴、停留天數） |
| raw 素材 | 40 | 有 | `raw/README.md` | 無 | type、status、created-at、source、captured-by、module、topic-tag、related-vault、raw-source-link 等 | mechanical_check（status、停留） |
| reference-model 參考模型 | 3 | 有 | 路由 § 四（無獨立規範） | 無 | type、status、last-reviewed、source | mechanical_check |
| review-knowledge | 3 | 無 | 無 | 無 | 未在 § 四 yaml 區塊列出（§ 一 L33 僅列用途） | 未查證 |
| misjudgement-record | 1 | 無 | 無 | 無 | 同上 | 未查證 |
| product-vision、phase、metric | 2、1、1 | 無 | 無 | 無 | type、module、status、last-reviewed | mechanical_check |
| meta | 22 | 無 | 無 | 無 | type、status、last-reviewed | mechanical_check；實際 `審查知識路由`、`規劃品質評分準則`、`稽核誤判記錄` 多帶 `module: 跨模組`，超出 schema 列的三欄 |
| example 範例 | 10 | — | 共用規範 § 一 | — | type、example-of、snapshot-source、synced-with-template、status、last-reviewed | mechanical_check L378、L403 豁免 |

觀察：
- 有骨架、規範、範例三件的只有 8 型（實體、狀態機、情境、角色、商業規則、規則組、服務藍圖、活動清單）。其餘各型（含 meta、example）至少缺一件，但沒有造成可見故障，因為這些型的卡只有 1 至 5 張。
- `source` 在 608 張卡出現。狀態機 `需求單狀態` 的 `source` 一欄就有 10 筆（L5-16），每筆為拍板日期加路徑，維護與稽核（S15）成本高；是否被任何稽核者實際用來查驗未查證。
- `last-reviewed` 每張卡都有，且 `vault-audit` 維度 2 以 90 天為門檻判過時。人工維護日期的實際查核價值未查證。

## 五、兩個實測例子

方法：以 AI 讀者的角度，從起點卡開始，只跟著卡內的 `[[連結]]` 與角色、操作、規則指向走，直到問題可回答。行數為整卡 `wc -l`（`/private/tmp/claude-501/.../c.py` 的計數）。誠實說明：起點卡與 `印件日期規則` 全文讀過，其餘卡以 `grep -n` 取相關行確認連結與規定，沒有每張全文讀完；若全文讀完，行數即為下表合計。

### 甲：需求單在「待評估成本」狀態下，誰可以做什麼

| 序 | 開啟的卡 | 行 | 為什麼要讀 |
|---|---------|---|-----------|
| 1 | `需求單狀態`（狀態機） | 133 | 找到該狀態的進出轉換與觸發操作：OP-QR-007 評估完成、OP-QR-009 重新評估報價；L116「誰能做」指去活動清單 |
| 2 | `報價評估活動清單` | 73 | 執行角色與範圍：業務、諮詢（自己負責）與所有角色（被分享（編輯））；frontmatter `status: draft` |
| 3 | `需求單`（實體） | 177 | OP-QR-003、006、007 的前提與欄位可改時機（多欄寫「成交或流失前可改」，沒有依「待評估成本」限縮） |
| 4 | `報價版本`（實體） | 91 | L76 寫可改與鎖定跟著需求單狀態走，要回頭看 1 |
| 5 | `受控清單` | 220 | 「被分享（編輯）」「自己負責」的範圍定義與「未列即不可做」 |
| 6 | `印務主管`（角色） | 80 | 評估印務主管以被分享（編輯）身分只協助成本、不推進需求單（L45） |
| 7 | `業務`（角色） | 75 | 業務在自己負責範圍可推進需求單 |
| 合計 | 7 張 | 849 | 不含 `ERP 詞彙表`（2216）；若要讀狀態定義再加 2216，合計 3065 |

結果：答案要把 6 張以上的卡交叉拼成：沒有任何一張卡直接寫「待評估成本時角色 X 可做 Y」。另有一條會影響答案的缺口落在 OQ：`QR-018` 標示成本估算可改時機後端未依狀態限縮；因為 OQ 排除在檢索範圍外（`business-domain-taxonomy` 演化紀錄 2026-07-31），AI 若只走規劃檢索會讀不到。

### 乙：印件預計交期的規則

| 序 | 開啟的卡 | 行 | 為什麼要讀 |
|---|---------|---|-----------|
| 1 | `印件日期規則`（規則組索引） | 52 | 入口：列兩條規則，並指向其他五個主題 |
| 2 | `印件預計交期依階段必填` | 47 | 訂單狀態與動作對印件預計交期可否為空 |
| 3 | `印件日期人工修改配套` | 49 | 改印件預計交期時內部完成日、工單日期如何跟上 |
| 4 | `印件`（實體） | 273 | 欄位定義與內部完成日算式（只用到約 3 列，卻要載入整卡） |
| 5 | `工作天規則`（規則組索引） | 76 | 算式用到的工作天算法 |
| 6 | `加減工作天的數法` | 44 | 加減天數的具體數法 |
| 7 | `急件規則`（規則組索引） | 67 | 急件與日期的關係入口 |
| 8 | `急件對日期的影響` | 43 | 急件是否扣日期（L32：線下單已含趕件，不再扣） |
| 9 | `急件要確認印件預計交期` | 40 | 急件時需確認預計交期 |
| 小計 | 9 張 | 691 | 不含情境與詞彙表 |
| 10 | `訂單印件規格維護`（情境） | 100 | 改日期欄的操作過程；加上後合計 791 |
| 11 | `ERP 詞彙表` | 2216 | 詞義 `#印件預計交期`；若載入整卡，合計 3007 |

另外：`印件日期規則` 的 `source` 引用 `訂單異動規則`「拆卡前版本 1d528ac」與 `memory/erp/wiki-normalization-20261104/第6批-待裁決.md`，`印件` 卡 source 還寫 `訂單異動規則`（`訂單異動規則` 目前為帳務下的規則組，不再是印件日期正本）。這是 `source` 欄停在拆卡前的證據之一，是否已被稽核抓到未查證。

兩個例子的共同點：規則正本已拆成一條一卡，正確性靠 `[[連結]]` 串起來；代價是 AI 要先判斷哪些連結值得跟，漏讀一張就可能答錯（例如甲例的 `QR-018`）。

## 六、OQ 與 raw

### 6.1 `08-open-questions/`

| 項 | 數字 | 算法 |
|---|-----|------|
| 平層 OQ 卡 | 80（全 open） | Python 讀 `type: open-question` 且不在 `_archives` |
| 平層規範與範例 | `規範 - OQ`、`範例 - OQ`、`OQ運作總覽` | 檔名 |
| 封存 | 234：answered 215、cancelled 19，全在 `_archives/2026/` | 同上 |
| 優先度（平層） | medium 54、low 25、high 1 | 同上 |
| audience（平層） | internal 80、external 0 | 同上 |
| 前綴分布（平層加封存） | PT 76、ORD 68、BI 32、SHP 27、QR 26、XM 18、AR 17、AFT 17、CR 12、PI 11、QC 10 | 檔名前綴計數 |
| 平層 open 的停留天數 | 中位數 48 天，最長 175 天，超過 90 天者 9 張 | 以 `raised-at` 對 2026-11-11 計算 |
| `notion-url` 有值 | 0 張 | `grep -rl "^notion-url"` |

與 03 盤點一致：平層 80 張、封存 234 張（215 加 19）。03 盤點「平層 active 1 張」是規範或範例卡的 status，不是 OQ 卡，本次實測平層 OQ 全為 open。
規範檔三份：`規範 - OQ`（216 行）、`範例 - OQ`（80 行）、`範本 - OQ`（60 行），加 `OQ運作總覽`（47 行）；OQ 欄位定義另在 `wiki-schema` L342-375，OQ 前綴與命名在 `wiki-schema` L454-470。一種卡型的規定分布在 5 處。
OQ 流程有兩個矛盾（見 3.7 第 3、4 項）。

### 6.2 `raw/`

| 項 | 數字 | 算法 |
|---|-----|------|
| `.md` | 41（40 張卡加 README） | `ls raw/*.md` |
| status | raw 20、reviewed 11、ingested 9、active 1（README） | 讀 frontmatter |
| 附件 | `_attachments/` 內 PDF 與 docx 為主，另有 3 個子資料夾（其中 `02_ERP 工作流程與辦法`、`03_外部文件與法規` 為空） | `ls raw/_attachments` |
| 被 wiki 卡引用（不含 log） | 26 / 40 | Python 在 wiki 內搜檔名 |
| 最後提交 | 2026-11-05 | `git log -1 --format=%cs -- raw` |

停在 `raw` 狀態的 20 張依 `vault-ingest` 規則不能被合成（只取 ingested 與 reviewed），即全庫約一半素材目前不可用。規範：`raw/README.md`（114 行）、`範本 - Raw 素材`（56 行）、`wiki-schema` type=raw（L392-420）與命名（L497-510）。

## 七、其他頂層資料夾

| 路徑 | 卡數 | 最後提交日 | 最後一次實質內容修改 | 是否仍在用 |
|------|-----|----------|------------------|-----------|
| `wiki/編輯器/` | 8 | 2026-11-04（改名詞彙表） | 2026-08-31（`自訂刀模稿件完成`） | 有內容，更新頻率低；`product-vision` 為 draft placeholder（26 行，`last-reviewed: 2026-05-19`）；03 盤點指出遷移計畫未涵蓋這 7 張。60 天提交 1 |
| `wiki/跨產品/` | 1（`印刷業共用術語表`，109 行） | 2026-11-05（第 3 批審稿正規化） | 2026-07-30 | 仍在用，ERP 詞彙表與它分工明確 |
| `wiki/範本/` | 12 | 2026-11-11 | 2026-11-11 | 在用（見 3.4） |
| `memory/erp/`（wiki 外，供對照） | 385 個檔 | 2026-11-11 | 同左 | 活躍，60 天提交 211；放規劃與正規化工作檔 |
| `memory/shared/`（wiki 外，供對照） | 5 個檔 | 2026-11-04 | 同左 | 在用 |

## 八、去留小計與可刪清單

### 8.1 小計（30 項，檔案群算一項）

| 判定 | 項數 | 項目 |
|-----|-----|------|
| 留 | 6 | `規範 - 詞彙表`；`規範 - 資料結構總覽`；`範本` 12 張；`規劃品質評分準則`；`稽核誤判記錄`；`參考模型` 3 張 |
| 改寫 | 16 | `wiki/AGENTS.md`；`index.md`；`erp_index`；`scope-boundary`；`wiki-schema`；`business-domain-taxonomy`；`卡片撰寫共用規範`；七份單元規範（角色、商業邏輯、活動清單、實體、狀態機、業務情境、OQ）；`審查知識路由`；`raw/README.md` |
| 併入 | 3 | `audit-failure-patterns` 併入 `稽核誤判記錄`；`archive-completeness-misjudgement` 併入 `稽核誤判記錄`；`OQ運作總覽` 併入 `規範 - OQ` |
| 刪 | 2 | `changelog`；`e2e-planning-checklist` |
| 待判 | 3 | `log.md`；`範例` 10 張；`帳務規劃連帶矩陣` |

注意：改寫項共 16 項不等於都要大改。其中 `wiki-schema`、`卡片撰寫共用規範`、`index.md` 三項改動範圍最大，其餘多為去重與修正過時字句。

### 8.2 可刪清單（行數）

| 檔 | 行 | 條件 | 刪前要改的引用 |
|----|---|-----|--------------|
| `00-meta/changelog.md` | 1473 | 直接刪 | `erp_index` 治理工具表（L125）與 wiki 內 3 張卡的提及；`log.md` 說明列 |
| `11-review-knowledge/_shared/e2e-planning-checklist.md` | 129 | 直接刪（若 `erp-prototype-tests/README.md` 已有等價檢核表則更無疑慮，未查證） | `審查知識路由` L26 |
| `11-review-knowledge/_shared/audit-failure-patterns.md` | 176 | 併入後刪 | `erp-plan` SKILL.md；`審查知識路由` L24 |
| `11-review-knowledge/_shared/archive-completeness-misjudgement.md` | 93 | 併入後刪 | `erp-audit/references/誤判要素.md` L40；`審查知識路由` L25 |
| `08-open-questions/OQ運作總覽.md` | 47 | 併入後刪 | `erp_index` 卡片清單（由腳本重生）；`OQ運作總覽` 被 2 張卡提及 |
| 小計 | 直接刪 1602；併入後刪 316；合計 1918 | — | — |

若 `log.md`（4873 行）經 Miles 判定可刪，再加 4873 行。

## 九、待判與未查證

### 9.1 待判（3 項）

| 項 | 缺什麼 |
|---|-------|
| `log.md` | 缺 Miles 是否仍需要「用 `[[卡名]]` 搜歷史與動機」；需比對 `git log` 提交訊息能否承載同樣動機 |
| `範例` 10 張 | 缺有範例與無範例時 AI 寫卡品質的對照；這是新舊流程比較，需實測一次 |
| `帳務規劃連帶矩陣` | 缺與 `07-scenarios` 帳務情境、`ERP 資料結構總覽` 的逐項重疊比對 |

### 9.2 未查證

- 各規範「機械自檢」段指令與 `wiki_lint.py` S1-S15 的逐項重疊程度。
- 規範「稽核維度」（L2、L3）與 `稽核維度.md` 維度 1 至 17 的逐項對映。
- `review-knowledge`、`misjudgement-record` 兩型的必填欄位：`wiki-schema` § 四未列 yaml 區塊，腳本是否檢查未讀。
- skill 引用欄只比對檔名字串，沒有逐處確認引用是實質依賴還是附帶提及。
- 卡 `source` 欄中 `.scratch/`、`memory/erp/` 路徑是否仍可解析（54 與 336 張）；`vault-audit` 維度 15 是否已覆蓋。
- 03 盤點的 wiki 卡數（847）與本次（892）差 45，推定來自批 6 併入；沒有逐卡對帳。
- 甲、乙兩例的行數是整卡行數；起點卡與 `印件日期規則` 以外為取相關行確認，沒有逐張全文讀完。
- `ERP 詞彙表` 2216 行、`ERP 資料結構總覽` 1457 行各自內部結構（392 個標題；詞條粒度）未逐段審視。
- `範本` 與 `wiki-schema` § 四 欄位定義是否目前一致，未比對。
