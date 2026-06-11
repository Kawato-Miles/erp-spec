---
name: vault-ingest
description: >
  ERP_Vault raw 素材承接與精練 skill（素材進入知識庫的唯一閘門）。
  觸發時機：
    1. Miles 說「存進 raw」「我要記」「先收集」「這份檔案存 raw」（mode A）
    2. Claude 完成被指派的研究任務（WebFetch / WebSearch）後（mode A，自主）
    3. Claude 在對話中識別「值得記」的素材（mode A，MUST 先問 Miles）
    4. Miles 說「精練 [檔名]」「ingest 這張」「拆解 raw」（mode B）
    5. Miles 說「看 raw」「掃 raw」「raw 待處理」；或累積 ≥ 10 張 status=raw 時建議（mode C）
  範圍：寫入限 `memory/Sens_wiki/raw/`（mode A）與 Miles 確認後的 wiki 卡（mode B）；mode C 純報告不動檔。
  不適用：已精練的知識更新（直接改既有 vault 卡）、明確未解問題（走 oq-manage）、UI 規範（留 DESIGN.md）。
---

# vault-ingest

對應 Karpathy LLM Wiki 的 ingest 操作：**素材先進 raw 暫存、經 Miles 確認才精練進 wiki**。raw 是「已驗證素材的歸檔」，不是 LLM 自編內容的暫存——「思考在對話裡發生，歸檔是思考完的結果；進知識庫的每張卡都是驗證過的」（Yu Wenhao）。

## 〇、Anti-Model-Collapse 防線（本 skill 的靈魂，逐條強制）

| 防線 | 規則 | 為何 |
|------|------|------|
| 1. 自捕捉須確認 | captured-by=claude-self 時 MUST 先問「我把這段存 raw 嗎？理由：…」，Miles 同意才寫 | 防 Claude 自己決定什麼值得記，噪音氾濫 |
| 2. 研究須真實來源 | source=claude-research 時 raw-source-link MUST 填真實 WebFetch URL／文件來源；無外部來源不寫 | 防編造看似合理但無出處的「研究結論」 |
| 2b. 上傳須附原檔 | source=miles-upload 時原檔 MUST 搬 `raw/_attachments/<檔名>`＋frontmatter `attached-files` 列檔名＋raw-source-link 填原始出處；卡內文寫摘要重點（不貼全文）並標「原檔見 [[_attachments/<檔名>]]」 | 原始頁面刪了也找得回，永遠可追溯 |
| 3. 精練須逐項批准 | mode B 的 cards diff 僅是提案，每張卡 Miles 看過說 OK 才動；禁「批准＋自動套用」一鍵流程 | 防跨卡連鎖更新時過度發揮、磨平細節 |
| 4. insight 不讀 raw | vault-insight 只讀 status=ingested／reviewed，禁讀 status=raw | 防未驗證素材自我放大（self-amplification） |

**拒絕場景（防線 1＋2 的試金石）**：被要求「總結既有 vault 內容存進 raw」MUST 拒絕——讀 vault → 自己編 → 存 raw 是自迭代。替代：對話中直接給總結（不寫 raw）、或做有外部來源的研究再存、或走 vault-insight（讀 vault 合成是 insight 的事，產出進 12-insights 不進 raw）。

## 一、三個 mode（輸入 → 步驟 → 輸出）

| Mode | 輸入 | 輸出 |
|------|------|------|
| **A 寫入 raw** | 一段素材＋source／captured-by | raw 卡一張＋log 條目（ingest-A）＋下次精練建議 |
| **B 精練 raw → wiki** | 指定的 raw 卡 | cards diff 提案 →（Miles 批准後）既有卡更新＋raw 卡 status=ingested＋log 條目（ingest-B） |
| **C 批次掃描** | raw/ 全目錄 | 三狀態報告（待處理／處理中／已 ingest）＋同主題累積警示＋過期警告＋log 條目（ingest-C）；**不動檔** |

### Mode A：寫入 raw（五步）

1. **確認來源**：source 六選一（miles-dialogue／claude-research／claude-self-capture／prototype-dogfood／mes-study／miles-upload）＋captured-by 對應（miles／claude-on-task／claude-self）；claude-self-capture 先過防線 1。
2. **分析分流**：識別 module 與候選相關卡（grep）；**「明確未解問題」（「該怎麼處理 X」「Y 是否要 Z」句式）MUST 改走 oq-manage mode B、不寫 raw**；與既有 raw 同主題則建議合併。
3. **寫卡**：依 `raw/_template.md`；檔名 `<YYYY-MM-DD>-<source-slug>-<主題繁中名詞>.md`；「原始素材」一字不漏（miles-upload 走防線 2b 摘要式）、「第一輪初步分析」寫觀察與候選升級路徑、「待精練」留空。
4. **log 一筆**（納入(ingest-A)，動機免）。
5. **回報精練建議**：不立即 ingest；提示「累積同主題 3 張跑 mode C／B」。

### Mode B：精練（六步）

1. 讀目標 raw 卡＋其候選相關卡**全文**（不是摘要）。
2. 對照 `00-meta/scope-boundary.md` 判升級路徑：04 規則／05 實體／06 狀態機／07 情境／OQ（轉 oq-manage）／insight（≥ 3 張同主題，轉 vault-insight，先把素材卡升 status=reviewed）／不進 vault（status=cancelled 附理由）。
3. **提議 cards diff**（每張卡列 diff 預覽＋不適用部分附去處），等 Miles 逐項批准（防線 3）。Miles 說「再看看」→ status=reviewed；說「重新分析」→ 維持 raw 重跑。
4. OQ 候選 → 觸發 oq-manage mode B（去重）。
5. insight 級 → 觸發 vault-insight。
6. **Miles 說 OK 後**執行寫入：更新既有卡、raw 卡 status=ingested＋ingested-at＋ingested-to、卡末「精練去處」填 wiki link、log 一筆（ingest-B，逐卡 `[[卡名]]`）。

### Mode C：批次掃描（純報告）

列全部 status=raw 卡（依 source 分組、created-at 排序）→ 標記：同主題累積 ≥ 3 張（建議 mode B／insight）、status=raw > 30 天（建議處理或 cancelled）、status=reviewed > 5 天（提醒確認）→ 產報告＋log 一筆（ingest-C）。

## 二、進 raw／進 OQ／直接進卡（判斷表）

| 判斷 | 去處 |
|------|------|
| 能直接回答 What／Why 的已確認知識 | 直接寫既有 wiki 卡（不經 raw） |
| 明確未解問題（問句、「是否要」） | OQ（oq-manage mode B） |
| 還沒消化的已驗證觀察／反饋／研究筆記／外部檔案 | raw（本 skill mode A） |
| LLM 自編、無外部來源 | 拒絕（防線 2） |
| UI 規範細節 | Prototype DESIGN.md，不進 vault |

## 三、raw 卡 frontmatter

```yaml
---
type: raw
status: raw                # raw / reviewed / ingested / cancelled
created-at: YYYY-MM-DD
source: <六值之一>
captured-by: miles | claude-on-task | claude-self
module:
  - <中文 module 或 跨模組>
topic-tag:
  - <自由標籤>
related-vault:
  - "[[<候選相關卡>]]"
raw-source-link: <對話片段 / WebFetch URL / 原始檔出處>
attached-files:            # source=miles-upload 必填
  - "_attachments/<檔名>"
ingested-at: YYYY-MM-DD    # status=ingested 時填
ingested-to:
  - "[[<寫入的既有卡>]]"
---
```

**captured-by 與 source 對應**：miles → miles-dialogue／prototype-dogfood／miles-upload；claude-on-task → claude-research／mes-study；claude-self → claude-self-capture（須確認）。

## 四、紅旗清單（出現任一＝停下）

| 紅旗 | 違反 |
|------|------|
| Claude 沒問就自主寫 raw | 防線 1 |
| claude-research 卡無真實 raw-source-link | 防線 2 |
| mode B 沒給 cards diff 就動既有卡 | 防線 3 |
| 把明確問題存 raw（該走 OQ） | mode A 步 2 分流 |
| 總結既有 vault 存 raw | 防線 1＋2（自迭代） |
| 同主題重複開 raw 卡沒建議合併 | mode A 步 2 去重 |
| raw 卡內用 `[!question]` callout | 與 oq-manage 共用禁令 |

## 五、與其他 skill 的協作

| 銜接 | 怎麼做 |
|------|--------|
| oq-manage | mode A 步 2／mode B 步 4 的明確問題轉出；oq-manage 自記 log（oq 標） |
| vault-insight | mode B 步 5 的 insight 級累積轉出（素材卡先升 reviewed）；insight 卡 frontmatter `related-raw` 留追溯 |
| vault-audit | raw 健康（超期／防線違反／累積警示）由 audit 維度 9 巡檢，發現堆積建議跑 mode C |
| misjudgement-record | 完全不交叉：誤審不存 raw |
| OpenSpec change archive | archive 是 PRD 層事件不動 wiki；archive 時提醒跑 mode C 清積壓 |
