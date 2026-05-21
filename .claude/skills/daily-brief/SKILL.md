---
name: daily-brief
description: >
  ERP Vault 每日進度回顧 + 今日建議行動 skill。
  寫入位置：Vault `memory/erp/ERP_Vault/14-reviews/daily/<YYYY-MM-DD>.md`（2026-05-21 新增）。
  觸發時機：
    1. Miles 說「開工」「daily」「daily brief」「今日要做什麼」「今日 brief」「今天該做什麼」
    2. Miles 早上開始 ERP 規劃工作前主動觸發
  此 skill 強制產出兩段內容：今日建議行動（≤ 3 條）+ 昨日進度摘要。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁止空洞讚美（「執行順利」「進度良好」等無 actionable 內容）
    2. 禁無 source（每個觀察 MUST 指向具體 commit / OQ / 卡 / change）
    3. 禁無下一步（「今日建議行動」每條 MUST 帶具體可開始的第一步）
    4. 禁與 audit-log 重複（複述既有事件時引用而非重寫）
    5. 禁編造（git log / audit-log / OpenSpec / Vault 沒寫的事 MUST NOT 出現在 brief）
    6. 禁附「產出位置」（如「該寫進 07-scenarios/」之類）— Miles 知道往哪寫，重複資訊
    7. 禁附「預估時間」（如「1.5-2 小時 / 情境」）— 估時不準，浪費資訊
    8. 排序 MUST 用「相依性 > 優先度 > 時效性」，MUST NOT 用「快速完成」當排序依據
  不適用：週度回顧（用 weekly-review）、跨主題模式提煉（用 vault-insight）、Vault 健康稽核（用 vault-audit）。
---

# daily-brief

ERP_Vault 每日進度回顧與今日建議行動 skill。對應 Yu Wenhao 全景監獄「晨間 Brief」+ PARA Periodic Notes 模式的 daily review 角色。

---

## 一、定位

### 1.1 為什麼需要

Miles 是印刷業 PM，每日須在多模組（需求單 / 訂單 / 工單 / 印件 / 生產任務 / QC / 出貨 / 售後）之間切換。沒有 daily brief 時容易：

- 忘記昨日做到哪裡（重複動或漏動）
- 不知今日該優先做什麼（被當下訊息牽著走）
- 看不到本週有期限的 OQ（過期才發現）
- 不知未完成 change 進度

Daily brief 解決：每日早上一個指令，5 分鐘內看清楚「昨日 + 今日」。

### 1.2 核心原則

> **「今日建議是基於 Vault 已有資料的推論，不是 LLM 自己想出來的。」**

每條今日建議 MUST 可追溯到具體 source（進行中 change / 本週有期限 OQ / 未結案 raw / 未踐 insight action）。

### 1.3 與既有 skill 分工

| Skill | 範疇 | 觸發頻率 |
|-------|------|---------|
| **daily-brief** | 日級回顧（今日 + 昨日）| 每日（高）|
| `weekly-review` | 週級回顧（本週 + 下週）| 每週（中）|
| `vault-audit` | Vault 健康度（10 維度 lint）| 月度 / 事件後（中）|
| `vault-insight` | 跨主題模式提煉 | 月度 / Phase 切換（低）|

---

## 二、觸發信號

| 觸發詞 | 場景 |
|--------|------|
| 「開工」 | Miles 早上開始工作（Yu 全景監獄風格）|
| 「daily」 | 簡短 |
| 「daily brief」 | 明確 |
| 「今日要做什麼」 / 「今天該做什麼」 | 自然語句 |
| 「今日 brief」 | 中英混用 |

**主動建議觸發**（不強制）：
- Miles 在 06:00-10:00 區間發第一條訊息時，Claude 可主動建議「要跑 daily brief 嗎？」（**不直接執行**，等 Miles 同意）

---

## 三、產出位置與檔名

**目錄**：`memory/erp/ERP_Vault/14-reviews/daily/`
**檔名**：`<YYYY-MM-DD>.md`（範例 `2026-05-21.md`）

**檔案存在處理**：
- 若當日檔已存在 → 詢問 Miles 是否覆寫 / 追加 / 取消
- 預設追加新段落（避免覆寫已有反饋）

---

## 四、Frontmatter（type=review，review-kind=daily）

```yaml
---
type: review
review-kind: daily
status: active
created-at: YYYY-MM-DD              # 即當日
period:
  start: YYYY-MM-DD                 # 昨日（涵蓋 commit / event 起點）
  end: YYYY-MM-DD                   # 今日
module:
  - cross-module
related-vault:                       # 本日涉及的既有 vault 卡（自動收集）
  - "[[<wiki link>]]"
related-commits:                     # 昨日 commit hash 列表
  - <hash>
related-changes:                     # 今日提及的 openspec change
  - <change-id>
---
```

---

## 五、資料來源（六項）

執行 daily-brief 時依序收集：

### 5.1 昨日 commits

```bash
cd /Users/b-f-03-029/Sens
git log --since="24 hours ago" --pretty=format:"%h|%s|%an" --no-merges
```

- 取 commit hash 短碼、標題、作者
- 排除 merge commits

### 5.2 昨日 audit-log 事件

```bash
grep -A 3 "^## \[$(date -v-1d +%Y-%m-%d)" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/00-meta/audit-log.md
```

- 收 ingest-A / ingest-B / ingest-C / oq / change-archive / audit / insight / misjudgement / sync 事件

### 5.3 本週 OQ（有期限或新增）

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions/
grep -l "status: open" *.md | xargs grep -l "expected-resolution-at:.*2026-W"  # 本週解決期限
```

或：
- raised-at 在本週（過去 7 日內）
- expected-resolution-at 在本週

### 5.4 進行中 OpenSpec change

```bash
ls -la /Users/b-f-03-029/Sens/openspec/changes/  # active changes（非 archive）
```

排除 `archive/` 目錄下的。

### 5.5 Raw 狀態統計

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/raw/
grep -l "status: raw" *.md | wc -l       # 待處理
grep -l "status: reviewed" *.md | wc -l   # 處理中
```

### 5.6 12-insights 未踐 action

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/12-insights/
grep -l "status: open\|status: in-progress" *.md
```

讀其中「下一步建議」section，找未完成 action。

---

## 六、五步驟流程

```
Step 1：收集六項資料來源（§ 五）
  - 平行執行 6 個 bash / grep / read
  - 整理出昨日活動 + 本週狀態快照

Step 2：分析「今日建議行動」候選
  - 從進行中 change 的 tasks.md 找未完成項
  - 從本週有期限 OQ 找逾期或臨近項
  - 從未結案 raw 找累積到該精練的卡
  - 從 12-insights 未踐 action 找該推進的項
  - **排序**：**相依性（blocking）> 優先度（priority enum）> 時效性（deadline 倒數）**
    - 相依性：A 做完了 B 才能做（如「Insight 1 Action 1 推演」必須先於「Action 2 整合 change propose」）→ 把上游排前面
    - 優先度：依既有 priority high / medium / low 標籤
    - 時效性：deadline 越近越前
    - **MUST NOT 用「快速完成」「容易做完」當排序依據**（估時不準）

Step 3：產出今日建議（≤ 3 條，每條附 source + 下一步 + 相依性說明）
  - 禁無 source
  - 禁無下一步
  - 禁籠統（「繼續做 X」要改為「執行 X 的第 N 步：YY」）
  - **禁附產出位置**（Miles 知道往哪寫）
  - **禁附預估時間**（估時不準）
  - 「相依性說明」格式：「上游：X / 下游：Y / 平行：Z」三選填，無相依時寫「獨立」

Step 4：產出昨日進度摘要
  - Commits（從 git log）
  - Vault 異動事件（從 audit-log）
  - OQ 異動（從 grep）
  - Change 進度（從目錄狀態）
  - **直接引用 audit-log，不重寫**

Step 5：寫入 daily 卡 + 追加 audit-log
  - 複製 14-reviews/daily/_template.md
  - 填 frontmatter
  - 填兩段內容
  - 追加 audit-log：
    ## [YYYY-MM-DD HH:MM] daily-brief | <主題簡述>

    **輸入 / 觸發**：Miles 觸發
    **輸出 / 異動**：[[../14-reviews/daily/<YYYY-MM-DD>]]
    **備註**：今日建議 N 條
```

---

## 七、Anti-Pattern 紀律

| Anti-pattern | 違反 | 範例（錯）| 範例（對） |
|--------------|------|----------|-----------|
| 空洞讚美 | 強制規則 1 | 「昨日執行順利，繼續加油」| 「昨日 commit 3 筆，主軸 vault-ingest 完成 Mode A」|
| 無 source | 強制規則 2 | 「今日該做訂單異動」| 「今日該做 [[order-management v1.7]] 的 tasks.md 第 4 項：欄位 X 重整」|
| 無下一步 | 強制規則 3 | 「持續推進售後 ticket」| 「下一步：跑 `/opsx:apply refine-supplementary-print-skip-review` 的 task 2」|
| 與 audit-log 重複 | 強制規則 4 | 把 audit-log 整段複製進 daily | 引用「昨日 audit-log 條目 [[../00-meta/audit-log#2026-05-20]]」+ 摘要 1 句 |
| 編造 | 強制規則 5 | 「本週你應該專注 KPI」（無 source）| 拒絕產出，或標「無 source 候選，建議手動補」|
| **附產出位置** | 強制規則 6 | 「產出位置：`07-scenarios/` 開新卡」「寫入 `04-business-logic/`」 | 不寫（Miles 知道往哪寫）|
| **附預估時間** | 強制規則 7 | 「預估時間：1.5-2 小時 / 情境」「預估：30 分鐘」 | 不寫（估時不準）|
| **用「快速完成」當排序依據** | 強制規則 8 | 「建議 2 排前面因為可快速完成」「先做 fix 性質的容易項」 | 用「相依性 > 優先度 > 時效性」排序，理由說「Insight 1 Action 1 是 Action 2 的上游」這類|

---

## 八、與既有 skill 銜接

| Skill | 銜接 |
|-------|------|
| `vault-audit` | daily 不觸發 audit。但若 audit-log 維度顯示閾值達標（≥ 5 卡異動 / ≥ 15 OQ）→ 在「警示與提醒」段引用 |
| `vault-insight` | daily 不觸發 insight。但若 12-insights 有未踐 action 進入今日建議 → 在 source 引用 insight 卡 |
| `vault-ingest` | daily 不觸發 ingest。但若 raw 累積 ≥ 10 → 在「警示與提醒」建議跑 mode C |
| `oq-manage` | daily 不觸發 OQ 新增。但若昨日有 OQ 異動 → 在「昨日進度」引用 |
| `weekly-review` | daily 是 weekly 的素材；weekly 跑時讀本週 7 張 daily |

---

## 九、Workflow 範例

### 範例 A：Miles 早上開工

Miles 早上 09:00 進入 ERP 規劃工作，發訊息：「開工」

1. Claude 識別觸發信號 → 啟動 daily-brief
2. **Step 1**：平行收集 6 個資料來源
   - 昨日 git log：3 commits（vault-ingest 相關）
   - audit-log：5 個 ingest-A / ingest-B / change-archive 事件
   - 本週 OQ：8 個 status=open，3 個 expected-resolution-at 在本週
   - 進行中 change：2 個（after-sales-ticket-v0.6 / order-management-v1.8）
   - Raw：2 張 status=raw、0 張 reviewed
   - Insights 未踐：2 個（「售後 ticket reactive 補丁循環」剩 1 個 action）
3. **Step 2-3**：產出今日建議（3 條）：
   - 行動 1：跑 `/opsx:apply order-management-v1.8` 的 task 3（理由：本週前要完成；下一步：開 src/components/order/ ... 寫第一個按鈕）
   - 行動 2：解答 OQ [[ORD-008]]（理由：expected-resolution-at 是 5/24；下一步：讀 [[訂單審核權限]] 卡後在 OQ 寫 answered-at + 答案）
   - 行動 3：精練 [[2026-05-19-claude-research-tharstern-rma-flow]]（理由：累積 2 張售後相關 raw，可拆解；下一步：跑 vault-ingest Mode B）
4. **Step 4**：產出昨日摘要
5. **Step 5**：寫入 `14-reviews/daily/2026-05-21.md` + 追加 audit-log

### 範例 B：當日檔已存在

Miles 12:00 又喊：「daily」（早上已跑過）

1. Claude 偵測 `14-reviews/daily/2026-05-21.md` 已存在
2. 詢問 Miles：「當日 brief 已有，要 (a) 追加中午更新段落 (b) 覆寫 (c) 取消？」
3. 依 Miles 選擇執行

### 範例 C：拒絕無 source 建議

Miles 喊：「daily」，但本週都沒 commit / 沒 OQ 異動 / 沒進行中 change

1. Claude 跑完六步驟收集，發現「今日建議行動」找不到具體 source
2. **不編造**「你該專注 X」這類空洞建議
3. 回應：「目前 Vault 與 OpenSpec 找不到具體可推的今日建議。可能你本週尚未起手，或上週都已完成。建議手動指定今日重點，或跑 `weekly-review` 看上週狀態。」
4. 仍寫入 daily 卡（昨日摘要段照產，今日建議段標「無 source 候選」）

---

## 十、Anti-Pattern 提醒總結

| Anti-pattern | 違反條款 |
|--------------|---------|
| 「執行順利」「進度良好」 | § 七 空洞讚美 |
| 「今天該做訂單」（無 wiki link / change-id） | § 七 無 source |
| 「持續推進 X」（無下一步）| § 七 無下一步 |
| 把 audit-log 整段複製 | § 七 與 audit-log 重複 |
| 沒有 source 還是硬編建議 | § 七 編造（拒絕產出）|
| daily 跑跨主題模式提煉 | 越權（該走 vault-insight）|
| daily 寫健康度評估 | 越權（該走 vault-audit）|

---

## 十一、相關卡

- [[../../memory/erp/ERP_Vault/14-reviews/README|14-reviews 入口]]
- [[../../memory/erp/ERP_Vault/14-reviews/daily/_template|Daily Brief 模板]]
- [[../../memory/erp/ERP_Vault/00-meta/wiki-schema|Wiki Schema]] § 一 type=review / § 四 frontmatter / § 七命名規約
- [[../../memory/erp/ERP_Vault/00-meta/audit-log|Audit Log]] — daily-brief 寫入記錄
- `.claude/skills/weekly-review/SKILL.md` — Weekly Review skill（互補）
- `.claude/skills/vault-audit/SKILL.md` — Vault 健康稽核
- `.claude/skills/vault-insight/SKILL.md` — 跨主題模式提煉

---

## 十二、版本與升級紀錄

| 版本 | 日期 | 變動 |
|------|------|------|
| v0.1 | 2026-05-21 | 初版（兩段產出：今日建議行動 / 昨日進度摘要 + 5 道防 Anti-Pattern 紀律 + 6 項資料來源 + 5 步驟流程 + 3 個 workflow 範例） |
