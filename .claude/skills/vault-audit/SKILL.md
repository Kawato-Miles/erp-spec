---
name: vault-audit
description: >
  ERP_Vault 自審稽核 skill：對 wiki 執行 13 維度健康檢查（Karpathy LLM Wiki lint + Sens 特化），產出對話報告並追加 wiki/log.md。
  觸發：Miles 說「跑 vault audit」「Vault 健康檢查」「audit vault」；主動建議時機——≥ 5 個 Vault 卡異動、change archive 後、每 20+ commit、raw 累積 ≥ 10 張 status=raw。
  不適用：OpenSpec spec 稽核、Prototype 程式碼稽核（用 e2e 測試）。
  範圍鐵則（只讀 wiki/＋raw/ 唯讀）與 13 維度定義見本文。
---

# vault-audit

ERP_Vault 的 lint：找出**矛盾／過時／孤島／死鏈／缺欄位／違規**。對標 Karpathy LLM Wiki 模式的 lint 操作。

## 〇、定位（每條維度都從這裡推導）

- **lint 只管 wiki 自身的健康**：卡與卡之間對不對得上、連結活不活、欄位齊不齊、規約守沒守。
- **lint 做兩件事**：診斷（卡與卡對不對得上、連結活不活、欄位齊不齊、規約守沒守）**與建議**（值得調查的新問題、該補的素材、該收割的 OQ 群）。建議只給方向，不排期、不指派——「誰在何時做」由 Miles 在對話中決定，落 OQ（待裁決）或 `memory/` project 卡（工作計畫）。
- **lint 不做的事**：跨層對齊（wiki↔OpenSpec 的內容一致性屬 spec 撰寫時的四方比對）、解答問題（OQ 解答權在 Miles）、產出獨立的診斷卡（診斷留在本 skill 的報告與 log，不在 `wiki/` 另立一類卡）。
- **範圍鐵則**：檔案讀取限 `memory/Sens_wiki/wiki/` 與 `memory/Sens_wiki/raw/`（唯讀）。維度 7 驗 frontmatter 引用的外部路徑時只做「檔案存在與否」測試（`test -f`），不開啟、不解析其內容。
- 發現的問題**只報告不擅修**（mode C 修復須 Miles 確認）；矛盾依鐵則並排比對呈報，不自行調和。

## 一、三種執行模式

| 模式 | 觸發句 | 用途 |
|------|--------|------|
| **A 全量** | 「跑 vault audit」「audit vault」「全量稽核」 | 13 維度全掃 |
| **B 單維度** | 「跑維度 N audit」「只查孤島」 | 針對性檢查 |
| **C 修復** | 「audit 並修復」「audit + fix」 | 全掃＋可自動修復項經 Miles 確認後執行 |

## 二、13 個稽核維度

> 維度 1-6 為通用 lint（Karpathy），7-13 為 Sens 特化。每維度產出：命中清單＋判定（OK / Warning / Error；維度 10 為 Info）。

### 維度 1：頁面間矛盾

**目的**：同一商業概念在不同卡的描述不能互相打架（矛盾常代表實務未被正確捕捉）。

方法：對核心概念（齊套邏輯／印件／工單／審稿／品檢／確認可執行／對帳）grep 出現的卡，比對描述差異。
判定：Error＝明確矛盾（A 卡寫 X、B 卡寫非 X）；Warning＝補充性差異；發現矛盾依鐵則開 OQ 並呈報，不自行調和。

### 維度 2：過時宣稱

**目的**：active 卡太久沒人看過，內容可信度下降。

```bash
threshold=$(date -v-90d +%Y-%m-%d 2>/dev/null || date -d "90 days ago" +%Y-%m-%d)
# 列出 status: active 且 last-reviewed < threshold 的卡
```

判定：OK＝全部 < 90 天；Warning＝1-5 卡過時；Error＝> 5 卡。

### 維度 3：孤島頁面

**目的**：沒有任何卡連到的卡等於不存在（禁孤島是共用標準）。

```bash
# 優先用 obsidian-cli（解析 vault 索引，grep 看不懂 wiki link）
obsidian deadends   # 或 obsidian eval 查 metadataCache 反向連結為 0 的卡
```

判定：OK＝0 孤島（README／index／`wiki/範本/` 骨架檔／各資料夾「範例 - 」卡除外——三層結構豁免見 [[卡片撰寫共用規範]] § 一鐵則 4）；Warning＝1-3；Error＝> 3。

### 維度 4：死鏈（未解析連結）

**目的**：`[[連結]]` 指到不存在的卡，讀者點了撲空。

```bash
obsidian eval "Object.keys(app.metadataCache.unresolvedLinks).filter(k => Object.keys(app.metadataCache.unresolvedLinks[k]).length)"
```

判定：OK＝0；Warning＝1-5（占位連結用角括號形式不計）；Error＝> 5。

### 維度 5：frontmatter 完整性

**目的**：缺必填欄位的卡進不了載入決策表與領域 grep。

方法：依 [[wiki-schema]] **各 type 的必填欄位表**檢查（禁用一體適用清單——open-question / raw 以 `raised-at` / `created-at` 承載時間，schema 未列 `last-reviewed`，不得檢缺）。通用必檢：`type`／`status`／`tags`（領域 tag，必標範圍見 [[business-domain-taxonomy]] § 領域 tag 標注規則）；`module` 與 `last-reviewed` 依該 type 的 schema 段；正本卡（03/04/05/06）另須 `source`。領域 tag 三項 lint：必標範圍內缺 tag／tag 值不在 taxonomy enum／濫標 `領域/全域`（實際只沾一兩個領域），皆計違規。同時列英文 module token 殘留（列 Info 供順手清理）；`business-domain` 欄位已全庫移除，偵測到即 Error（防舊範本回流），但 `08-open-questions/_archives/` 排除——封存卡依 schema § 四規約只增不改、保留拍板當時原貌。豁免：`wiki/範本/` 骨架檔（填空樣板）與 `type: example` 範例卡不檢必填欄位（[[卡片撰寫共用規範]] § 一鐵則 5；範例卡另由維度 12 勾稽）；`status: deprecated` 退役 stub 卡不檢 `source` 與 `tags`（schema § 四通則三）。已移除欄位偵測：六個正本卡型（entity／role／service-blueprint／business-rule／state-machine／scenario）偵測到 `module`／`implemented-by`／`related-spec` 即 Error（已全庫移除，防回流；OQ／raw 的 `module` 仍合法）。`title` 依 schema § 四通則一：只在檔名帶前綴而標題不含該前綴時填（如日期前綴檔名），`title` 值與檔名相同即冗餘、列 Warning；不列缺欄。空欄位（含空 list `[]`）依通則二列 Warning。
判定：OK＝0 缺；Warning＝1-5；Error＝> 5。

### 維度 6：規約遵守

**目的**：操作紀律（OQ 開檔、繁中語意化）靠巡檢守住。

1. 無 inline `[!question]` callout、無 inline OQ 措辭（OQ 須開獨立卡；引用既有 OQ 卡的 wiki link 不算違規）。

**pattern 範圍限「待補／待釐清」，不掛「待確認／需確認／尚未確認」**：後三者在正本卡大量作為業務語意（狀態名「待補件」、打樣結果值「待確認」、訂單異動狀態「金額尚待確認」、業務事實「尚未確認可製作」），全掃會產生數十筆假陽性而淹掉真違規（2026-07-30 實測：放寬版 40+ 筆命中僅 2 筆真違規）。後三者改由稽核者讀卡時人工判讀，不進機械掃描。排除項：同行含 `[[`（引用了 OQ 卡）、`待補件`（訂單狀態名）、規範卡（描述禁令本身）。

```bash
grep -rn "\[!question\]" memory/Sens_wiki/wiki/ --include="*.md" | grep -v "08-open-questions/"
grep -rnE "待補|待釐清" memory/Sens_wiki/wiki/erp/0[34567]*/ --include="*.md" | grep -v "08-open-questions/" | grep -v "\[\[" | grep -v "待補件" | grep -v "規範 - "
```

2. 命名繁中語意化：卡名與段落禁直譯、禁中英夾雜（rules § 五）；OQ 卡命名 `<前綴>-<NNN>-<簡述>`。
3. 正文禁迭代史堆疊（「A 已棄用 → 改 B」並陳）。
4. wiki link 禁別名（rules § 三）：`grep -rn "\[\[[^]]*|" memory/Sens_wiki/wiki/ --include="*.md"`，排除 log.md／changelog.md／`_archives/`（歷史層）。

判定：OK＝0 違規；Warning＝1-3；Error＝> 3（觸發建議 `oq-manage` mode D 遷出）。

### 維度 7：出鏈有效性與方向

**目的**：frontmatter 的 `source` 是依據鏈，指錯方向會誤導下游（`implemented-by` 已全庫移除，見維度 5）。

**方向正確**：`source` 禁指 OpenSpec／Prototype（正確性根據只能往上：拍板／權責表／04 規則卡／法規）、禁指同層或下層卡；scenario 卡的 source 得並列狀態機卡為參考資料，但不得為唯一來源。

**現況查證例外**：後端現行程式（sens-print-core／sensation-api 等已上線系統）得作為 `source` 的現況查證來源，與訪談同級——這類 source 回答「這些公式與參數憑什麼是對的」，刪了卡就變成無依據的宣稱。仍禁 OpenSpec spec 與 Prototype 原始碼（兩者是下游產物，方向顛倒）。正文引用照舊禁止，系統邊界要寫成商業語言（如「線上商品後台」「ERP 中台」），不寫 repo 名與 endpoint。

**正文亦禁外連實作路徑**：frontmatter 之外，卡的正文與表格也不得出現 OpenSpec spec 或 Prototype 原始碼的路徑連結（實作對應屬 PRD 層；change 會 archive 或作廢、路徑必然失效）。歷史層豁免：`log.md`／`changelog.md`／`_archives/`／`raw/`；`08-open-questions/` 的 `source-link` 得記發現問題的實作位置（OQ 是問題單、非正本卡）。

```bash
grep -rn -A3 "^source:" memory/Sens_wiki/wiki/ --include="*.md" | grep "openspec/\|sens-erp-prototype/"  # source 欄位（含 YAML 清單項）指實作路徑即 Error
grep -rn "openspec/\|sens-erp-prototype/\|/erp/apps/" memory/Sens_wiki/wiki/erp/0[34567]*/ --include="*.md" | grep -v "08-open-questions/" | grep -v "_archives/"  # 正本卡正文外連實作路徑即 Error
```

判定：OK＝方向全正確且正文無實作外連；Error＝`source` 指實作層、正本卡正文含實作路徑，或 source 鏈繞回自己（A 的 source 指 B、B 直接或間接指回 A；深鏈偵測邏輯待擴充，先查直接互指）。

### 維度 8：OQ 健康度

**目的**：OQ 是待裁決佇列，過期、缺欄位與佇列失真會讓裁決漏接。

檢查（平層 `08-open-questions/`，`_archives/` 不掃）：
1. status 非嚴格三值（resolved／closed／active 等違規寫法）或行內註解污染
2. 平層上 status=answered／cancelled 未封存（該移 `_archives/<年>/`）
3. open 且 raised-at > 30 天無進度；priority high 長期擱置
4. audience=external 缺 `expected-resolution-at`（external 必填）；缺 `source-link`

判定：OK＝全健康；Warning＝1-3 需跟催；Error＝> 3 或任何狀態違規／未封存（建議跑 `oq-manage` mode E 整理；open 量大時於建議段點出該收割的 OQ 群）。

### 維度 9：Raw 健康度（唯讀檢查，禁動 raw/ 任何檔）

**目的**：素材放到過期、防線欄位缺漏，會讓 ingest 失去可溯源性。

檢查（讀 `memory/Sens_wiki/raw/` frontmatter）：
- status=raw 超過 180 天＝Error、超過 90 天＝Warning
- status=reviewed 超過 5 天未確認＝Warning
- 同主題（topic-tag）累積 ≥ 3 張＝Warning（建議 vault-ingest mode B）
- source=claude-research／miles-upload 缺 `raw-source-link`、miles-upload 缺 `attached-files`＝Error（Anti-Model-Collapse 防線）

判定：OK＝無超期無違反；Warning／Error 如上。raw 累積 ≥ 10 張另建議跑 vault-ingest mode C。

### 維度 10：標題錨點（只查本輪異動卡，Info 不計分）

**目的**：`source` 或正文連結綁 `#Requirement: <標題>` 錨點，Requirement 改名即斷鏈（ORD-027 教訓）。存量卡不回頭批量改，只提示本輪異動卡。

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)
changed=$( { git -c core.quotepath=false diff --name-only "$base" HEAD -- 'memory/Sens_wiki/wiki/'; git -c core.quotepath=false diff --name-only -- 'memory/Sens_wiki/wiki/'; } | sort -u )   # quotepath=false 必加：中文路徑否則被轉義漏算
for f in $changed; do [ -f "$f" ] && grep -qE 'spec\.md#Requirement:' "$f" && echo "INFO: $f 含標題錨點，建議改指 spec 檔層"; done
```

### 維度 11：log 條目完整性（只查本輪異動的正本卡）

**目的**：wiki/log.md 是唯一只追加操作史，正本卡異動沒留條目＝溯源斷。

檢查：本輪 git 異動的 03/04/05/06 目錄卡，逐卡在 `wiki/log.md` 找含 `[[卡名]]` 的條目；實質異動條目「動機」行須非空（健檢／納入類免）。
判定：OK＝全有條目且動機非空；Warning＝缺條目或動機空白。

### 維度 12：撰寫規範勾稽（本輪異動卡＋全部範例卡）

**目的**：把各單元規範的「稽核維度」表真正接進 lint——寫卡宣稱合規不算數，稽核者逐項勾才算（執行者／稽核者分離，[[卡片撰寫共用規範]] § 二）。

檢查兩部分：
1. **本輪異動的正本卡**（範圍取法同維度 10）：稽核維度分三層，**L1＋L2＋L3 全通過才算完成**。先載入 L1 共用維度八條（`00-meta/卡片撰寫共用規範` § 四之二，所有卡型一體適用），再依卡的 type 載入該單元的 L2／L3——entity → `規範 - 實體` § 十、role → `規範 - 角色` § 十、state-machine → `規範 - 狀態機` § 十、scenario → `規範 - 業務情境` § 十二、service-blueprint／business-rule → `規範 - 商業邏輯` § 十三（含依 `mutability` 加勾的 L3 分型維度）、open-question → `規範 - OQ` § 九；以該單元「範例 - 」卡為通過樣本對照。存量未異動卡不掃（避免噪音，隨異動逐步覆蓋）。
2. **全部「範例 - 」卡**：`synced-with-template` 不得早於對應規範檔的最後實質修改（`git log -1 --format=%ad --date=short -- <規範檔>` 比對）；範例卡正文須與快照來源卡在最後同步時點一致性抽查（至少驗段落結構同構）。

判定：OK＝異動卡全數通過該型維度且範例卡同步日有效；Warning＝1-3 項未過；Error＝範例卡同步日早於規範修改（三層同 commit 鐵則被破壞）。

### 維度 13：規則複寫（同一規則多處實質重述）

**目的**：同一條規則寫在兩張卡上，改一處漏一處就變成矛盾——複寫是矛盾的前身，維度 1 只抓已經打架的，這條抓還沒打架但註定會打架的。正本原則見 [[erp_index]] § 增修紀律 3（規則只寫一次，其他層級引用不複寫）。

**範圍**：本輪異動的正本卡（03／04／05／06／07），取法同維度 10。存量未異動卡不掃。

**方法**（機械取證＋人工判讀，不可只靠 grep）：
1. 從異動卡逐條抽出它陳述的規則句（含數值、閾值、角色、狀態值、觸發條件）。
2. 每句取 2 至 3 個關鍵詞組合全庫搜（`obsidian search`，非 grep），排除歷史層與 OQ。
3. 命中第二處時判斷屬哪一類：
   - **實質重述**（兩處都在定義同一條規則）→ Error。處置：判定哪張是正本（依 [[scope-boundary]] 與各單元規範的正本歸屬），另一處改為 `[[卡名]]` 引用，只留該卡語境需要的一句話銜接。
   - **引用**（一處定義、另一處以 `[[卡名]]` 指過去）→ OK，不計違規。
   - **同名不同物**（兩處講的是不同實體的同名欄位或概念）→ Error，但處置是正名而非改引用（同名是混淆源本體）。

**已知高風險位置**（歷史上出過事，優先掃）：工單建立來源、狀態轉換的觸發角色、欄位的計算口徑、外包與委外的粒度定義。

判定：OK＝0 實質重述；Warning＝1-2 處；Error＝≥ 3 處或出現同名不同物。**發現時依鐵則並排呈報、不自行調和**（哪張是正本由 Miles 裁決）。

## 三、執行流程

1. **宣告範圍與模式**（全量／單維度 N／修復）。
2. **依序執行各維度**：Bash／obsidian-cli 取證 → 整理命中清單 → 判定。跳過任一維度必須標注原因。
3. **產出對話報告**：

```markdown
# Vault Audit 報告（YYYY-MM-DD HH:MM）

## 摘要
- 模式 / 總體狀態（OK / Warning / Error）/ 維度通過 X / 12

## 維度結果
### 維度 N <名稱>：<判定>
（命中筆數＋主要案例；OK 維度一行帶過）

## 主要發現（top 3-5）
## 建議下一步
- 可自動修復項（mode C）／需 Miles 裁決項
## 建議調查的新問題與該補的素材
- 值得調查的新問題：<被多張卡提及卻沒有自己頁面的概念、資料缺口、同類 OQ 聚成的系統性議題>；判定為待裁決的走 `oq-manage` mode B 開 OQ
- 該補的素材：<哪個主題缺訪談／法規／業界參照，建議去找什麼>；素材到手走 `vault-ingest` mode A
- 屬知識庫或工作流本身的待辦（非商業現況）：寫 `memory/` project 卡，不在 `wiki/` 留卡
```

4. **追加 wiki/log.md 一筆**（動作=健檢、標籤=audit；最新在上）：

```markdown
## [YYYY-MM-DD HH:MM] 健檢(audit) | 全量／單維度（N）／修復，13 維度 X 通過
- 變更：稽核 ERP_Vault，<總體狀態>；只列非 OK 維度與筆數
- 動機：免（健檢類）
- 衝突：無（或列發現的矛盾＋已開 OQ）
```

長敘事留在對話報告，不灌進 log。

## 四、修復模式（mode C）

| 可自動修復（仍須 Miles 確認） | 不可自動修復 |
|-----------|--------------|
| 補 frontmatter 缺欄位（依 wiki-schema 預設） | 頁面間矛盾（並排呈報 Miles 裁決） |
| 列過時卡的 review 提醒清單 | OQ 解答 |
| 為孤島卡建議連入位置 | source 方向錯誤的改向（涉及依據判斷） |
| 死鏈改向或建 stub（stub 須 status: draft、檔名即標題、不寫 H1） | 內容性缺口補寫 |

步驟：全量稽核 → 列可修復清單給 Miles 確認 → 執行 → log 記一筆（變更行註記修復項）。

## 五、Anti-Pattern（禁止行為）

- 讀取或解析 OpenSpec／Prototype／memory 其他目錄的檔案內容（路徑存在測試除外）
- 動 `raw/` 任何檔（唯讀層）
- 讀寫 `00-meta/changelog.md`（已凍結封存）
- 只追加 log 不產對話報告（Miles 看不到）
- 修復未經 Miles 確認直接動檔
- 誇大判定（OK 報成 Warning，信號疲勞）；跳過維度不標原因
- 發現矛盾自行調和改卡（鐵則：並排比對呈報）

## 六、與其他 skill 的協作

| Skill | 協作 |
|-------|------|
| `oq-manage` | 維度 1／6／8 發現矛盾、inline OQ、過期 OQ → 建議 mode B／C／D |
| `vault-ingest` | 維度 9 raw 超期／累積 → 建議 mode B／C |
