---
name: weekly-review
description: >
  ERP Vault 每週回顧 skill：本週學到 / 本週完成 / 下週重點。
  寫入位置：Vault `memory/erp/ERP_Vault/14-reviews/weekly/<YYYY-WNN>.md`（2026-05-21 新增）。
  觸發時機：
    1. Miles 說「週末整理」「weekly review」「本週回顧」「下週重點」「本週做了什麼」「這週學到什麼」
    2. Miles 週末整理工作時主動觸發（建議週日晚上）
  此 skill 強制產出三段內容：本週學到（3-5 條，提煉非複述）+ 本週完成（commits / change / OQ / raw / spec 統計）+ 下週重點（≤ 3 條）。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁止空洞讚美（「本週進度良好」「執行順利」等無 actionable 內容）
    2. 禁無 source（每個觀察 MUST 指向具體 commit / OQ / 卡 / change / raw / insight）
    3. 禁無下一步（「下週重點」每條 MUST 帶具體可開始的第一步）
    4. 禁複述（「本週學到什麼」MUST 提煉，不是「本週做了什麼」的複製）
    5. 禁與 audit-log / 本週 daily 卡重複（引用而非重寫）
    6. 禁編造（git log / audit-log / OpenSpec / Vault / 本週 daily 卡沒寫的事 MUST NOT 出現）
    7. 禁附「產出位置」（如「該寫進 07-scenarios/」）— Miles 知道往哪寫，重複資訊
    8. 禁附「預估時間 / 預估完成週幾」— 估時不準，浪費資訊
    9. 「下週重點」排序 MUST 用「相依性 > 優先度 > 時效性」，MUST NOT 用「快速完成」當排序依據
  不適用：日級回顧（用 daily-brief）、跨主題模式提煉（用 vault-insight）、Vault 健康稽核（用 vault-audit）。
---

# weekly-review

ERP_Vault 每週回顧 skill：本週學到 / 本週完成 / 下週重點。對應 Yu Wenhao 全景監獄「WAM（Weekly Accountability Meeting）」+ Karpathy weekly health check 思路。

---

## 一、定位

### 1.1 為什麼需要

Miles 一週工作後容易：

- 不記得本週究竟學到什麼（執行了但沒提煉）
- 看不出累積的同主題 raw 需要 vault-insight 處理
- 不知下週該往哪個方向使力（沒有週級的「重點選擇」）
- change archive / 新提的 OQ 散落在各日，缺週總覽

Weekly review 解決：每週末一個指令，把過去 7 天的執行**提煉成可重用的知識**，並指出下週使力點。

### 1.2 核心原則

> **「本週學到 ≠ 本週做了」 — 提煉是把『做 X 學到 Y』寫出 Y（具體原則 / 模式 / 反例）。**

每條本週學到 MUST 可追溯到本週的具體 raw / insight / 誤審記錄 / change archive，並提煉出「未來在 Z 場景應如何應用」。

### 1.3 與既有 skill 分工

| Skill | 範疇 | 觸發頻率 |
|-------|------|---------|
| `daily-brief` | 日級回顧（今日 + 昨日）| 每日（高）|
| **weekly-review** | 週級回顧（本週 + 下週）| 每週（中）|
| `vault-audit` | Vault 健康度（10 維度 lint）| 月度 / 事件後（中）|
| `vault-insight` | 跨主題模式提煉（系統性議題）| 月度 / Phase 切換（低）|

**關鍵分工**：weekly review **不挖系統性議題**（那是 vault-insight 的事），但**會識別「累積到 vault-insight 該跑」的信號**並建議 Miles。

---

## 二、觸發信號

| 觸發詞 | 場景 |
|--------|------|
| 「週末整理」 | Miles 週日晚上整理（推薦時段）|
| 「weekly review」 | 英文 |
| 「本週回顧」 | 中文 |
| 「下週重點」 | 想看未來 |
| 「本週做了什麼」 | 想看過去 |
| 「這週學到什麼」 | Miles 直接問（核心問題）|

**主動建議觸發**（不強制）：
- 每週日 18:00 後 Miles 第一次發訊息 → Claude 主動建議「要跑 weekly review 嗎？」
- 過了週日仍未跑 weekly → 下週一 daily-brief 中提醒「上週未跑 weekly review」

---

## 三、產出位置與檔名

**目錄**：`memory/erp/ERP_Vault/14-reviews/weekly/`
**檔名**：`<YYYY-WNN>.md`（ISO 週數兩位數補零；範例 `2026-W21.md`）

**ISO 週數計算**：
```bash
date +%G-W%V    # GNU date
date -j +%G-W%V # macOS date
# 範例輸出：2026-W21
```

**檔案存在處理**：
- 若該週檔已存在 → 詢問 Miles：(a) 追加新段落 (b) 覆寫 (c) 取消
- 預設追加（避免覆寫已有反思）

---

## 四、Frontmatter（type=review，review-kind=weekly）

```yaml
---
type: review
review-kind: weekly
status: active
created-at: YYYY-MM-DD              # 該週週日（週末整理日）
period:
  start: YYYY-MM-DD                 # 該週週一
  end: YYYY-MM-DD                   # 該週週日
module:
  - cross-module
related-vault:                      # 本週涉及的既有 vault 卡（自動收集，含 raw / insight / OQ）
  - "[[<wiki link>]]"
related-commits:                    # 本週 commit hash 列表
  - <hash>
related-changes:                    # 本週涉及的 openspec change
  - <change-id>
---
```

---

## 五、資料來源（八項）

執行 weekly-review 時依序收集：

### 5.1 本週 commits

```bash
cd /Users/b-f-03-029/Sens
git log --since="7 days ago" --pretty=format:"%h|%s|%an|%ad" --date=short --no-merges
```

- 收集 hash 短碼、標題、作者、日期
- 統計按 prefix 分組（feat: / fix: / docs: / refactor: 計數）

### 5.2 本週 audit-log 事件

```bash
grep -A 5 "^## \[" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/00-meta/audit-log.md \
  | awk '/^## \[/{date=$2; gsub(/[\[\]]/,"",date); if (date >= "<本週週一>" && date <= "<本週週日>") inside=1; else inside=0} inside'
```

- 統計 ingest-A / ingest-B / ingest-C / oq / change-archive / audit / insight / misjudgement / sync / daily-brief 各類型計數
- 識別重大事件（change archive / vault-insight / misjudgement）

### 5.3 本週 daily 卡（最重要的素材）

```bash
ls /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/14-reviews/daily/<本週週一日期>-*.md  # 本週所有 daily
```

- 讀本週每張 daily 的「昨日進度摘要」+「今日建議行動」段
- 從 daily 卡中找重複出現的主題 → 是「本週學到什麼」的素材

### 5.4 本週 raw 異動

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/raw/
grep -l "created-at: <本週區間>" *.md       # 本週新增 raw
grep -l "ingested-at: <本週區間>" *.md      # 本週 ingested
```

- 統計按 source 分組
- 識別同主題累積 ≥ 3 張 → 建議跑 vault-insight

### 5.5 本週 OQ 異動

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions/
grep -l "raised-at: <本週區間>" *.md         # 本週新增
grep -l "answered-at: <本週區間>" *.md       # 本週解答
```

### 5.6 本週 OpenSpec change 異動

```bash
cd /Users/b-f-03-029/Sens/openspec/changes/archive/
ls -la | grep <本週區間>     # 本週 archive 的 change
ls /Users/b-f-03-029/Sens/openspec/changes/ | grep -v archive  # active changes 現況
```

### 5.7 本週 Spec 異動

```bash
git log --since="7 days ago" --pretty=format:"%h %s" -- openspec/specs/ \
  | awk '!seen[$0]++'
```

識別哪些 spec 本週有實質更新。

### 5.8 12-insights 與 11-review-knowledge 異動

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/12-insights/
git log --since="7 days ago" -- .  # 本週新 insight

cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/11-review-knowledge/
git log --since="7 days ago" -- .  # 本週誤審記錄
```

---

## 六、六步驟流程

```
Step 1：收集八項資料來源（§ 五）
  - 平行執行 8 個 bash / grep / read
  - 整理出本週活動全景

Step 2：分析「本週學到」候選
  - 讀本週每張 daily 卡 → 找重複主題
  - 讀本週新 insight / 誤審記錄 → 提煉一句話
  - 讀本週 raw ingested 卡 → 找跨卡模式
  - 讀本週 change archive 卡 → 提煉設計選擇背後的原則
  - **把「做了 X」轉成「學到 Y（具體原則 / 模式 / 反例）」**

Step 3：分析「下週重點」候選
  - 從未完 change 找下週該推進項
  - 從本週末仍 open 的高優 OQ 找該答覆項
  - 從 12-insights 未踐 action 找該推進項
  - 從累積 raw 找該精練項
  - 從 vault-audit 警示找該處理項
  - **排序**：**相依性（blocking）> 優先度（priority enum）> 時效性（deadline 倒數）**
    - 相依性：A 做完了 B 才能做 → 把上游排前面
    - 優先度：依既有 priority high / medium / low 標籤
    - 時效性：deadline 越近越前
    - **MUST NOT 用「快速完成」「容易做完」當排序依據**（估時不準）

Step 4：產出本週學到（3-5 條，每條附 source + 應用場景）
  - 禁複述（不是「本週做了什麼」）
  - 禁空洞（不是「學到很多」）
  - 禁無 source

Step 5：產出本週完成（統計區）
  - Commits 計數 + prefix 分布 + 重點 commit
  - Change archive / OQ 解答 / Raw ingest 統計
  - Spec 異動
  - **直接引用 audit-log + 本週 daily 卡，不重寫**

Step 6：產出下週重點（≤ 3 條）+ 寫入 + 追加 audit-log
  - 每條附 source + 下一步 + 相依性說明
  - **禁附產出位置**（Miles 知道往哪寫）
  - **禁附預估時間 / 預估完成週幾**（估時不準）
  - 「相依性說明」格式：「上游：X / 下游：Y / 平行：Z」三選填，無相依時寫「獨立」
  - 寫入 14-reviews/weekly/<YYYY-WNN>.md
  - 追加 audit-log：
    ## [YYYY-MM-DD HH:MM] weekly-review | <主題簡述>

    **輸入 / 觸發**：Miles 觸發
    **輸出 / 異動**：[[../14-reviews/weekly/<YYYY-WNN>]]
    **備註**：學到 N 條、下週重點 M 條
```

---

## 七、本週學到 vs 本週做了 範例對照

| 本週做了什麼（不夠） | 本週學到什麼（提煉後） |
|-------------------|--------------------|
| 「我們 archive 了 reclassify-qc-and-add-inspection change」 | 「**QC 從獨立實體合併進 ProductionTask 後**，每印件強制 1 個 type=qc/scope=print_item 的 PT 既能保留入庫驗收語意，又能跟生產任務狀態機共用 — 未來新增『中間品檢』類型時可沿用此 type+scope 雙鍵模式」|
| 「我們解答了 3 個 OQ」 | 「**業務離職時 ticket 接手問題**得出『實務替代 = 同公司其他業務動手 + Slack 群通知』，**不需要系統內 owner_transfer 欄位** — 印證『實務替代優先於系統機制』原則（[[../11-review-knowledge/_shared/...]]）」|
| 「本週新增 5 張 raw」 | 「**Prototype dogfood 反饋集中在『密度切換』** — 3 張 raw 都指向同主題，下週該跑 vault-insight 看是不是「列表頁範式 B 漏了密度維度」這個系統性議題」|

---

## 八、Anti-Pattern 紀律

| Anti-pattern | 違反 | 範例（錯）| 範例（對） |
|--------------|------|----------|-----------|
| 空洞讚美 | 強制規則 1 | 「本週進度很好」| 「本週 archive 2 個 change，主軸是售後 ticket」|
| 無 source | 強制規則 2 | 「學到資料模型很重要」| 「[[../12-insights/2026-05-20-售後ticket-reactive-補丁循環]] insight 提煉出『缺端到端基準文件』根因」|
| 無下一步 | 強制規則 3 | 「下週繼續推進」| 「下一步：跑 `/opsx:apply order-management-v1.8` 第 4 task；相依性：獨立」|
| 複述（學到 = 做了） | 強制規則 4 | 「本週學到：我們做了 vault-ingest」| 「本週學到：Karpathy 的 raw 層 + Yu 防 Model Collapse 紀律可以共存 — 既能承接動態素材，又不會讓 LLM 自迭代」|
| 與本週 daily 重複 | 強制規則 5 | 整段複製某張 daily 的內容 | 引用「見 [[../14-reviews/daily/2026-05-21]] 今日建議行動 1」+ 摘要 1 句 |
| 編造 | 強制規則 6 | 「本週你應該感謝團隊」（無 source）| 拒絕產出，標「無 source 候選」|
| **附產出位置** | 強制規則 7 | 「下週重點 1 — 產出位置：`07-scenarios/` 開新卡」| 不寫產出位置（Miles 知道）|
| **附預估時間 / 完成週幾** | 強制規則 8 | 「下週重點 1 — 預估完成：週三」「預估 2 小時」| 不寫（估時不準）|
| **用「快速完成」當排序依據** | 強制規則 9 | 「下週重點 1 排前面因為可快速完成」| 用相依性說明，如「上游 — 不解此項，整合 change propose 會卡」|

---

## 九、與既有 skill 銜接

| Skill | 銜接 |
|-------|------|
| `daily-brief` | 本週所有 daily 卡是 weekly 最主要素材，讀取後從中找跨日主題 |
| `vault-audit` | weekly 不觸發 audit。但若 audit-log 顯示本月未跑 audit → 在「下週重點」建議跑 |
| `vault-insight` | weekly 不觸發 insight，但**主動建議**：若本週發現同主題 raw 累積 ≥ 3 / 或 OQ 累積 ≥ 15 → 在「下週重點」建議跑 vault-insight |
| `vault-ingest` | weekly 不觸發 ingest，但統計本週 raw 異動並識別累積警示 |
| `misjudgement-record` | weekly 讀本週新增的誤審記錄作為「本週學到」素材 |
| `openspec change archive` | weekly 統計本週 archive 的 change 並提煉「本週學到」 |

---

## 十、Workflow 範例

### 範例 A：Miles 週日晚上整理

Miles 週日 20:00 進入 ERP 規劃工作，發訊息：「週末整理」

1. Claude 識別觸發信號 → 啟動 weekly-review
2. **Step 1**：平行收集 8 個資料來源
   - 本週 commits：14 個（feat: 9 / docs: 3 / fix: 2）
   - audit-log 事件：2 change-archive、1 insight、5 ingest-A、3 oq、5 daily-brief
   - 本週 daily 卡：5 張（週一~週五）
   - 本週 raw：5 張新增 / 2 張 ingested
   - 本週 OQ：3 新增 / 2 解答 / 0 取消
   - Change archive：refine-after-sales-refund 與 refine-supplementary-print 兩個
   - Spec 異動：after-sales-ticket v0.4 / production-task v0.4 / quote-request v3.2
   - 新 insight：1 個（vault-ingest 工作流升級）
3. **Step 2**：分析本週學到（從 daily 找重複主題：售後 ticket 連續異動）
4. **Step 3**：分析下週重點（從 active changes 找未完項：order-management-v1.8）
5. **Step 4**：產出本週學到 4 條，每條附 source + 應用場景
6. **Step 5**：產出本週完成統計
7. **Step 6**：產出下週重點 3 條 + 寫入 `14-reviews/weekly/2026-W21.md` + 追加 audit-log

### 範例 B：本週沒跑 daily（沒素材）

Miles 從沒跑 daily，週日喊：「週末整理」

1. Claude 偵測 `14-reviews/daily/2026-05-xx.md` 本週只有 0-1 張
2. 警示 Miles：「本週只有 0 張 daily，本週學到段落素材會非常薄」
3. 改用 audit-log + git log 直接生成（範疇縮減）
4. 「本週學到」改為「2 條（基於 audit-log，建議下週開始跑 daily 累積素材）」
5. 仍寫入 weekly 卡，但在「警示」段標示「素材不足」

### 範例 C：本週發現同主題 raw 累積 ≥ 3

Miles 喊：「weekly review」，本週累積了 4 張售後相關 raw

1. **Step 1-3** 正常跑
2. **Step 3 下週重點** 自動加入一條：「跑 vault-insight 看『售後流程 reactive 補丁』是不是還在累積（4 張新 raw + 既有 insight）」
3. 寫入 weekly 卡

### 範例 D：上週沒跑 weekly review

下週一 Miles 跑 daily-brief，Claude 識別「上週 14-reviews/weekly/ 該有的檔不存在」

1. daily-brief「警示與提醒」段加：「上週未跑 weekly review，建議今日花 5 分鐘補跑」
2. 不強制（Miles 可選擇略過）

---

## 十一、Anti-Pattern 提醒總結

| Anti-pattern | 違反條款 |
|--------------|---------|
| 「本週進度良好」「執行順利」 | § 八 空洞讚美 |
| 「學到資料模型很重要」（無 wiki link）| § 八 無 source |
| 「下週繼續推進」（無下一步）| § 八 無下一步 |
| 「本週學到：我們做了 X」（複製做了什麼）| § 八 複述 |
| 把 daily 卡整段複製 | § 八 與 daily 重複 |
| 沒有 source 還是硬編學到 | § 八 編造（拒絕產出）|
| weekly 跑跨主題系統性議題分析 | 越權（該走 vault-insight）|
| weekly 寫 vault 健康度評估 | 越權（該走 vault-audit）|

---

## 十二、相關卡

- [[../../memory/erp/ERP_Vault/14-reviews/README|14-reviews 入口]]
- [[../../memory/erp/ERP_Vault/14-reviews/weekly/_template|Weekly Review 模板]]
- [[../../memory/erp/ERP_Vault/00-meta/wiki-schema|Wiki Schema]] § 一 type=review / § 四 frontmatter / § 七命名規約
- [[../../memory/erp/ERP_Vault/00-meta/audit-log|Audit Log]] — weekly-review 寫入記錄
- `.claude/skills/daily-brief/SKILL.md` — Daily Brief skill（本週素材來源）
- `.claude/skills/vault-audit/SKILL.md` — Vault 健康稽核
- `.claude/skills/vault-insight/SKILL.md` — 跨主題模式提煉（weekly 識別到累積信號時建議觸發）

---

## 十三、版本與升級紀錄

| 版本 | 日期 | 變動 |
|------|------|------|
| v0.1 | 2026-05-21 | 初版（三段產出：本週學到 / 本週完成 / 下週重點 + 6 道防 Anti-Pattern 紀律 + 8 項資料來源 + 6 步驟流程 + 學到 vs 做了對照表 + 4 個 workflow 範例） |
