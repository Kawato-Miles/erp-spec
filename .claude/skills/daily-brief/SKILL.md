---
name: daily-brief
description: >
  ERP Vault 每日進度回顧 skill：今日建議行動（≤ 3 條）+ 昨日進度摘要兩段產出，寫入 Vault `14-reviews/daily/<YYYY-MM-DD>.md`。
  觸發：Miles 說「開工」「daily」「daily brief」「今日要做什麼」「今日 brief」「今天該做什麼」，或早上開始 ERP 規劃工作前主動建議。
  不適用：週度回顧（用 weekly-review）、跨主題模式提煉（用 vault-insight）、Vault 健康稽核（用 vault-audit）。
  強制規則（13 條 anti-pattern 禁令）與流程見本文。
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

**目錄**：`memory/Sens_wiki/wiki/erp/14-reviews/daily/`
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

### 5.2 昨日 log.md 事件

```bash
grep -A 3 "^## \[$(date -v-1d +%Y-%m-%d)" /Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/log.md
```

- 收 ingest-A / ingest-B / ingest-C / oq / audit / insight / misjudgement / sync / amend 標籤條目

### 5.3 本週 OQ（有期限或新增）

```bash
cd /Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/08-open-questions/
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
cd /Users/b-f-03-029/Sens/memory/Sens_wiki/raw/
grep -l "status: raw" *.md | wc -l       # 待處理
grep -l "status: reviewed" *.md | wc -l   # 處理中
```

### 5.6 12-insights 未踐 action

```bash
cd /Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/12-insights/
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

Step 3：產出今日建議（≤ 3 條，每條兩段「現況 / Next action」+ 條列化）

  結構模板：
  ```
  ### <具體 action 標題>

  - **現況**：
     - <事實 1：當前狀態 / 觸發背景 / 影響範圍>
     - <事實 2：附 source wiki link / commit / change-id>
     - 相依性：
        - 阻擋：<本 action 完成才能輪到的下游 action / 卡 / change>
        - 被阻擋：<必須先完成才能輪到本 action 的上游 action / 卡 / change>
  - **Next action**：
     - <具體執行動作 1：明確可開始的第一步>
     - <具體執行動作 2：後續延伸動作（可選）>
  ```

  紀律：
  - 禁無 source（現況段事實 MUST 附具體 wiki link / commit hash / change-id）
  - 禁無 Next action
  - 禁籠統（「繼續做 X」要改為「執行 X 的第 N 步：YY」）
  - **禁附產出位置**（Miles 知道往哪寫）
  - **禁附預估時間**（估時不準）
  - 內容**MUST 條列化**（類似會議紀錄），每 bullet 一條事實或動作，不用長句段落
  - **現況段是描述事實**，**Next action 段是執行動作**，MUST NOT 混淆（為何要做的原因放現況、做什麼放 Next action）
  - 「相依性」格式：兩個 sub-bullet「阻擋 / 被阻擋」（無相依時直接寫「相依性：獨立」一行）
    - 阻擋：表示「本 action 是哪些東西的上游」（解了本 action 才能輪到那些）
    - 被阻擋：表示「本 action 被哪些東西阻塞」（那些先解才能輪到本 action）
    - 兩格可只填一格（如建議 1 沒有上游阻塞，「被阻擋」可不列或留空）

Step 3.5：產出今日反目標（Anti-goals，0-3 條）

  > 「今日要避免做的事」— 防 scope creep / 避免被當下訊息牽走 / 守紀律
  > 從本週重點 + 反 Sens 慣性弱點推出

  結構模板：
  ```
  - 不<動詞>：<簡述 + 防什麼>
  ```

  範例：
  - 不開新 change：先收斂既有 12 個 active change（防分散）
  - 不寫新 spec：先消化未答 OQ（防 OQ 積壓）
  - 不調整 skill 規約：本週已改 4 次，先 dogfood 觀察一週（防紀律震盪）

  紀律：
  - 反目標 MUST 對應本日 / 本週可能發生的具體誘惑或慣性，禁空洞（「不浪費時間」「不分心」屬無內容）
  - 0 條也可（若當日無特別需守的紀律）

Step 4：產出昨日進度摘要 + 決策紀錄 + 學到（三段並列）

  ### 4.1 進度摘要（既有）
  - Commits / Vault 異動事件 / OQ 異動 / Change 進度

  ### 4.2 昨日決策紀錄
  > 昨日做了哪些設計 / 範疇 / 取捨決策？記錄理由防止未來重複討論。

  結構模板：
  ```
  - **決策**：<決策標題>
     - 脈絡：<為何要做這決策 / 觸發背景>
     - 選擇：<最終選了什麼>
     - 理由：<為何這選擇 / 排除了什麼選項>
     - source：[[<相關卡 / commit / change>]]
  ```

  紀律：
  - 只記「設計 / 範疇 / 取捨」決策，不記執行細節（「決定先寫 A 還是 B」屬執行不屬決策）
  - 每條 MUST 附 source（決策當時的觸發點：commit / 對話 / spec 段落）
  - 禁編造（若昨日無重大決策可寫「無」）

  ### 4.3 昨日學到 1-2 條
  > 昨日即時抓的觀察（與 Weekly「本週學到」差異：daily 是當下抓、weekly 是跨日累積後提煉）

  結構模板：
  ```
  - **觀察**：<簡述>
     - 來源：[[<相關卡 / commit / 事件>]]
     - 暫存提示：未來 weekly review 時可重看是否累積成系統性議題
  ```

  紀律：
  - 1-2 條，禁超過 3 條（daily 是即時抓，不是大整理）
  - 禁空洞（「今天學到要謹慎」「今天學到溝通很重要」屬無內容）
  - 禁無 source

Step 5：寫入 daily 卡 + 追加 wiki/log.md 一筆
  - 複製 14-reviews/daily/_template.md
  - 填 frontmatter
  - 填兩段內容
  - 追加 wiki/log.md 一筆（動作=健檢、標籤=daily），加在檔首說明分隔線下方（最新在上）：
    ## [YYYY-MM-DD HH:MM] 健檢(daily) | <主題簡述>
    - 變更：[[../erp/14-reviews/daily/<YYYY-MM-DD>]] 產出今日建議 N 條 + 昨日摘要
    - 動機：（健檢類免填）
    - 衝突：無
```

---

## 七、Anti-Pattern 紀律

| Anti-pattern | 違反 | 範例（錯）| 範例（對） |
|--------------|------|----------|-----------|
| 空洞讚美 | 強制規則 1 | 「昨日執行順利，繼續加油」| 「昨日 commit 3 筆，主軸 vault-ingest 完成 Mode A」|
| 無 source | 強制規則 2 | 「今日該做訂單異動」| 「今日該做 [[order-management v1.7]] 的 tasks.md 第 4 項：欄位 X 重整」|
| 無下一步 | 強制規則 3 | 「持續推進售後 ticket」| 「下一步：跑 `/opsx:apply refine-supplementary-print-skip-review` 的 task 2」|
| 與 log.md 重複 | 強制規則 4 | 把 log.md 整段複製進 daily | 引用「昨日 log.md 2026-05-20 條目」+ 摘要 1 句 |
| 編造 | 強制規則 5 | 「本週你應該專注 KPI」（無 source）| 拒絕產出，或標「無 source 候選，建議手動補」|
| **附產出位置** | 強制規則 6 | 「產出位置：`07-scenarios/` 開新卡」「寫入 `04-business-logic/`」 | 不寫（Miles 知道往哪寫）|
| **附預估時間** | 強制規則 7 | 「預估時間：1.5-2 小時 / 情境」「預估：30 分鐘」 | 不寫（估時不準）|
| **用「快速完成」當排序依據** | 強制規則 8 | 「建議 2 排前面因為可快速完成」「先做 fix 性質的容易項」 | 用「相依性 > 優先度 > 時效性」排序，理由說「Insight 1 Action 1 是 Action 2 的上游」這類|
| **未條列化（長句段落式）** | 強制規則 9 | 「為何現在做：當前 12 個 active change 同時開展，不收斂會反向影響 daily brief 視野...」（一整段長句）| 「現況：- 12 個 active change 同時開展 - 相依性：上游（解了才能做建議 2）」（條列）|
| **現況與 Next action 混淆** | 強制規則 10 | 在 Next action 段寫「為何要做」原因；或在現況段寫「該執行什麼步驟」| 原因放現況段、執行動作放 Next action 段，職責分離 |

---

## 八、與既有 skill 銜接

| Skill | 銜接 |
|-------|------|
| `vault-audit` | daily 不觸發 audit。但若 log.md 條目顯示閾值達標（≥ 5 卡異動 / ≥ 15 OQ）→ 在「警示與提醒」段引用 |
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
   - log.md：5 個 ingest-A / ingest-B / oq 事件
   - 本週 OQ：8 個 status=open，3 個 expected-resolution-at 在本週
   - 進行中 change：2 個（after-sales-ticket-v0.6 / order-management-v1.8）
   - Raw：2 張 status=raw、0 張 reviewed
   - Insights 未踐：2 個（「售後 ticket reactive 補丁循環」剩 1 個 action）
3. **Step 2-3**：產出今日建議（3 條）：
   - 行動 1：跑 `/opsx:apply order-management-v1.8` 的 task 3（理由：本週前要完成；下一步：開 src/components/order/ ... 寫第一個按鈕）
   - 行動 2：解答 OQ [[ORD-008]]（理由：expected-resolution-at 是 5/24；下一步：讀 [[訂單審核權限]] 卡後在 OQ 寫 answered-at + 答案）
   - 行動 3：精練 [[2026-05-19-claude-research-tharstern-rma-flow]]（理由：累積 2 張售後相關 raw，可拆解；下一步：跑 vault-ingest Mode B）
4. **Step 4**：產出昨日摘要
5. **Step 5**：寫入 `14-reviews/daily/2026-05-21.md` + 追加 wiki/log.md 一筆（健檢(daily)）

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
| 把 log.md 整段複製 | § 七 與 log.md 重複 |
| 沒有 source 還是硬編建議 | § 七 編造（拒絕產出）|
| daily 跑跨主題模式提煉 | 越權（該走 vault-insight）|
| daily 寫健康度評估 | 越權（該走 vault-audit）|

---

## 十一、相關卡

- [[../../memory/Sens_wiki/wiki/erp/14-reviews/回顧機制總覽|回顧機制總覽]]
- [[../../memory/Sens_wiki/wiki/erp/14-reviews/daily/_template|Daily Brief 模板]]
- [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema|Wiki Schema]] § 一 type=review / § 四 frontmatter / § 七命名規約
- [[../../memory/Sens_wiki/wiki/log|操作史 log.md]] — daily-brief 寫入記錄（動作=健檢、標籤=daily）
- `.claude/skills/weekly-review/SKILL.md` — Weekly Review skill（互補）
- `.claude/skills/vault-audit/SKILL.md` — Vault 健康稽核
- `.claude/skills/vault-insight/SKILL.md` — 跨主題模式提煉

---

## 十二、版本與升級紀錄

| 版本 | 日期 | 變動 |
|------|------|------|
| v0.1 | 2026-05-21 | 初版（兩段產出：今日建議行動 / 昨日進度摘要 + 5 道防 Anti-Pattern 紀律 + 6 項資料來源 + 5 步驟流程 + 3 個 workflow 範例） |
