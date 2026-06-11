---
name: vault-audit
description: >
  ERP_Vault 自審稽核 skill。對 `memory/Sens_wiki/wiki/` 執行 12 維度健康檢查（Karpathy LLM Wiki lint 模式 + Sens 特化），產出對話報告 + 追加 wiki/log.md 一筆（動作=健檢、標籤=audit）。
  觸發時機：
    1. Miles 說「跑 vault audit」「Vault 健康檢查」「audit vault」
    2. 主動收尾發現 ≥ 5 個 Vault 卡異動時建議
    3. change archive 後建議
    4. 每 20+ commit 後建議
    5. raw 累積 ≥ 10 張 status=raw 時自動建議（維度 9 觸發）
    6. 本月 daily review 缺 ≥ 工作日 50% 時自動建議（維度 10 觸發）
  範圍鐵則：**只讀 `memory/Sens_wiki/wiki/`＋`memory/Sens_wiki/raw/`（raw 唯讀）。MUST NOT 掃描或開啟 OpenSpec、Prototype、memory/ 其他目錄**——跨層對齊與進度追蹤不是 lint，分別歸 OpenSpec 工作流與 vault-insight。
  輸出：對話報告 + 追加 `memory/Sens_wiki/wiki/log.md` 一筆（動作=健檢、標籤=audit；追加式、最新在上、禁覆寫）。
  不適用：OpenSpec spec 稽核、Prototype 程式碼稽核（用 e2e 測試）、KPI 進度追蹤（用 vault-insight / weekly-review）、純對話內容稽核。
---

# vault-audit

ERP_Vault 的 lint：找出**矛盾／過時／孤島／死鏈／缺欄位／違規**。對標 Karpathy LLM Wiki 模式的 lint 操作。

## 〇、定位（每條維度都從這裡推導）

- **lint 只管 wiki 自身的健康**：卡與卡之間對不對得上、連結活不活、欄位齊不齊、規約守沒守。
- **lint 不做的事**：跨層對齊（wiki↔OpenSpec 的內容一致性屬 spec 撰寫時的四方比對）、進度追蹤（KPI／Phase 對照屬 vault-insight 與 weekly-review）、解答問題（OQ 解答權在 Miles）。
- **範圍鐵則**：檔案讀取限 `memory/Sens_wiki/wiki/` 與 `memory/Sens_wiki/raw/`（唯讀）。維度 7 驗 frontmatter 引用的外部路徑時只做「檔案存在與否」測試（`test -f`），不開啟、不解析其內容。
- 發現的問題**只報告不擅修**（mode C 修復須 Miles 確認）；矛盾依鐵則並排比對呈報，不自行調和。

## 一、三種執行模式

| 模式 | 觸發句 | 用途 |
|------|--------|------|
| **A 全量** | 「跑 vault audit」「audit vault」「全量稽核」 | 12 維度全掃 |
| **B 單維度** | 「跑維度 N audit」「只查孤島」 | 針對性檢查 |
| **C 修復** | 「audit 並修復」「audit + fix」 | 全掃＋可自動修復項經 Miles 確認後執行 |

## 二、12 個稽核維度

> 維度 1-6 為通用 lint（Karpathy），7-12 為 Sens 特化。每維度產出：命中清單＋判定（OK / Warning / Error；維度 11 為 Info）。

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

判定：OK＝0 孤島（README／index／範本性質檔除外）；Warning＝1-3；Error＝> 3。

### 維度 4：死鏈（未解析連結）

**目的**：`[[連結]]` 指到不存在的卡，讀者點了撲空。

```bash
obsidian eval "Object.keys(app.metadataCache.unresolvedLinks).filter(k => Object.keys(app.metadataCache.unresolvedLinks[k]).length)"
```

判定：OK＝0；Warning＝1-5（占位連結用角括號形式不計）；Error＝> 5。

### 維度 5：frontmatter 完整性

**目的**：缺必填欄位的卡進不了載入決策表與領域 grep。

方法：依 [[wiki-schema]] 現行必填——`type`／`module`（中文 enum）／`business-domain`（適用 type）／`status`／`last-reviewed`；正本卡（03/04/05/06）另須 `source`。同時列英文 module token 殘留（轉換期舊卡隨異動統一，列 Info 供順手清理）。注意：`related-spec` 是合法的補充參照欄位（wiki-schema 明文「非正確性來源」），不是廢欄位、不列偵測。
判定：OK＝0 缺；Warning＝1-5；Error＝> 5。

### 維度 6：規約遵守

**目的**：操作紀律（OQ 開檔、繁中語意化）靠巡檢守住。

1. 無 inline `[!question]` callout、無「待確認／待釐清／需確認／尚未確認／待補」inline 措辭（OQ 須開獨立卡；引用既有 OQ 卡的 wiki link 不算違規）：

```bash
grep -rn "\[!question\]" memory/Sens_wiki/wiki/ --include="*.md" | grep -v "08-open-questions/"
grep -rn "（待補\|（待釐清\|（待確認" memory/Sens_wiki/wiki/ --include="*.md" | grep -v "08-open-questions/" | grep -v "待 \[\["
```

2. 命名繁中語意化：卡名與段落禁直譯、禁中英夾雜（rules § 五）；OQ 卡命名 `<前綴>-<NNN>-<簡述>`。
3. 正文禁迭代史堆疊（「A 已棄用 → 改 B」並陳）。

判定：OK＝0 違規；Warning＝1-3；Error＝> 3（觸發建議 `oq-manage` mode D 遷出）。

### 維度 7：出鏈有效性與方向

**目的**：frontmatter 的 `source`／`implemented-by` 是依據鏈，斷了或指錯方向都會誤導下游。

1. **路徑存在**：`implemented-by` 指的外部檔案路徑做 `test -f`（只測存在、不開啟內容——範圍鐵則）。
2. **方向正確**：`source` 禁指 OpenSpec／Prototype（正確性根據只能往上：拍板／權責表／04 規則卡／法規）、禁指同層或下層卡。

```bash
grep -rn "openspec/\|sens-erp-prototype/" memory/Sens_wiki/wiki/ --include="*.md" | grep -A0 "source:"  # source 區塊內出現實作路徑即 Error
```

判定：OK＝路徑全存在且方向正確；Warning＝1-3 斷路徑；Error＝source 指實作層（違反引用方向鐵則）。

### 維度 8：OQ 健康度

**目的**：OQ 是待裁決佇列，過期與缺欄位會讓裁決漏接。

檢查：open 且 raised-at > 30 天無進度；缺 `expected-resolution-at`／`source-link`；priority high 長期擱置。
判定：OK＝全健康；Warning＝1-3 需跟催；Error＝> 3（建議跑 `vault-insight` 找系統性議題）。

### 維度 9：Raw 健康度（唯讀檢查，禁動 raw/ 任何檔）

**目的**：素材放到過期、防線欄位缺漏，會讓 ingest 失去可溯源性。

檢查（讀 `memory/Sens_wiki/raw/` frontmatter）：
- status=raw 超過 180 天＝Error、超過 90 天＝Warning
- status=reviewed 超過 5 天未確認＝Warning
- 同主題（topic-tag）累積 ≥ 3 張＝Warning（建議 vault-ingest mode B 或 vault-insight）
- source=claude-research／miles-upload 缺 `raw-source-link`、miles-upload 缺 `attached-files`＝Error（Anti-Model-Collapse 防線）

判定：OK＝無超期無違反；Warning／Error 如上。raw 累積 ≥ 10 張另建議跑 vault-ingest mode C。

### 維度 10：Review 規律性

**目的**：daily／weekly 回顧卡（`14-reviews/`）斷更代表回顧機制失靈。

檢查：本月 daily 卡數 < 已過工作日 × 50%＝Error；本月無 weekly＝Error；本週 daily 缺 ≥ 2 工作日＝Warning；上週無 weekly＝Warning。剛上線無歷史資料的月份自動 OK。

### 維度 11：標題錨點（只查本輪異動卡，Info 不計分）

**目的**：`implemented-by`／`source` 綁 `#Requirement: <標題>` 錨點，Requirement 改名即斷鏈（ORD-027 教訓）。存量卡不回頭批量改，只提示本輪異動卡。

```bash
base=$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)
changed=$( { git diff --name-only "$base" HEAD -- 'memory/Sens_wiki/wiki/'; git diff --name-only -- 'memory/Sens_wiki/wiki/'; } | sort -u )
for f in $changed; do [ -f "$f" ] && grep -qE 'spec\.md#Requirement:' "$f" && echo "INFO: $f 含標題錨點，建議改指 spec 檔層"; done
```

### 維度 12：log 條目完整性（只查本輪異動的正本卡）

**目的**：wiki/log.md 是唯一只追加操作史，正本卡異動沒留條目＝溯源斷。

檢查：本輪 git 異動的 03/04/05/06 目錄卡，逐卡在 `wiki/log.md` 找含 `[[卡名]]` 的條目；實質異動條目「動機」行須非空（健檢／納入類免）。
判定：OK＝全有條目且動機非空；Warning＝缺條目或動機空白。

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
- 可自動修復項（mode C）/ 需 Miles 裁決項 / 建議跑 vault-insight 項
```

4. **追加 wiki/log.md 一筆**（動作=健檢、標籤=audit；最新在上）：

```markdown
## [YYYY-MM-DD HH:MM] 健檢(audit) | 全量／單維度（N）／修復，12 維度 X 通過
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
| `vault-insight` | 維度 8 系統性議題、KPI／Phase 進度對照（原維度 10 職責）→ 移交 insight |
| `vault-ingest` | 維度 9 raw 超期／累積 → 建議 mode B／C |
