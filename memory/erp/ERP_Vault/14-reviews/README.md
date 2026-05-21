---
type: meta
status: active
last-reviewed: 2026-05-21
---

# 14-reviews — Daily / Weekly Review

> 每日 / 每週時序回顧，補上 Karpathy LLM Wiki 模式中常見但本 Vault 原本沒有的「行動派回顧」層。
>
> 對應參考：Yu Wenhao 全景監獄「晨間 Brief」 + Karpathy weekly health check + PARA Periodic Notes 模式。

## 一、定位

| 層 | 對應 |
|------|------|
| **Daily Brief** | 「今天該做什麼」+「昨天做了什麼」 — 每日工作開始時觸發 |
| **Weekly Review** | 「這週學到什麼」+「這週完成什麼」+「下週重點」 — 每週末整理 |

**與既有機制的分工**：

| 既有 | 範疇 | 本層 |
|------|------|------|
| `vault-audit` | Vault 健康度（10 維度健檢，月度級）| Review 是個人工作節律（日 / 週級）|
| `vault-insight` | 跨主題模式提煉（月度 / Phase 切換）| Weekly Review 是執行回顧（週度）|
| `audit-log` | Vault 治理層的時序日誌（事件追加）| Review 是面向 Miles 的工作回顧（人類可讀）|
| `12-insights/` | 跨主題系統性議題 + action（持久）| Review 是時間切片快照（短期）|

## 二、子目錄

```
14-reviews/
├── README.md              # 本檔
├── daily/
│   ├── _template.md       # daily-brief skill 寫入模板
│   └── <YYYY-MM-DD>.md    # 每日 review 卡
└── weekly/
    ├── _template.md       # weekly-review skill 寫入模板
    └── <YYYY-WNN>.md      # 每週 review 卡（NN 為 ISO 週數兩位數）
```

## 三、檔名規約

- daily：`<YYYY-MM-DD>.md`（範例 `2026-05-21.md`）
- weekly：`<YYYY-WNN>.md`（範例 `2026-W21.md`，NN 為 ISO 週數兩位數補零）

ISO 週數規則：每週週一為一週開始；跨年 Edge case 依 ISO 8601。

## 四、觸發指引

| skill | 觸發信號 | 產出 |
|-------|---------|------|
| `daily-brief` | 「開工」「daily」「daily brief」「今日要做什麼」「今日 brief」 | `daily/<YYYY-MM-DD>.md` |
| `weekly-review` | 「週末整理」「weekly review」「本週回顧」「下週重點」 | `weekly/<YYYY-WNN>.md` |

## 五、內容範圍

### Daily Brief（兩段結構）

1. **今日建議行動**（≤ 3 條）
   - 基於進行中 change / 本週有期限 OQ / 未結案 raw 推出
   - 每條附「為什麼建議現在做」+ 候選下一步
2. **昨日進度摘要**
   - 昨日 commit（git log）
   - 昨日 audit-log 事件（ingest / OQ / change archive / 誤審）
   - 昨日 OQ 異動

### Weekly Review（三段結構）

1. **本週學到什麼**（3-5 條）
   - 從 raw / insight / 誤審記錄 / change archive 提煉
   - 重點是**提煉**不是**複述**：把「做了 X」轉成「學到 Y」
2. **本週完成什麼**
   - commit 統計與主題
   - change archive / OQ 解答 / raw ingest 統計
   - spec 異動
3. **下週重點**（≤ 3 條）
   - 基於未完 change / 高優 OQ / Phase 進度 / 未踐 insight action 推出

## 六、Anti-Pattern 紀律

| Anti-pattern | 為什麼禁 |
|-------------|---------|
| 空洞讚美（「本週進度良好」「執行順利」）| 沒 actionable 內容 |
| 無 source（觀察沒指向具體 commit / OQ / 卡） | 無法追溯 |
| 無下一步（daily 無建議行動、weekly 無下週重點）| 違背回顧的目的 |
| 與 audit-log 重複（複述既有事件）| 應引用而非重寫 |
| 「本週學到」寫成「本週做了」| 學到 vs 做了，前者要提煉 |

## 七、與既有 skill 銜接

| Skill | 銜接點 |
|-------|-------|
| `vault-audit` | 第二階段擴維度 12「Review 規律性」（本月 daily < 工作日 50% / 本月無 weekly → 警示）|
| `vault-insight` | weekly review 累積發現系統性議題時建議跑 vault-insight |
| `vault-ingest` | daily 提到的 raw 候選 → 隔日跑 mode B 拆解；weekly 識別同主題 raw 累積 ≥ 3 → 觸發升級 |
| `audit-log` | daily-brief / weekly-review 完成後寫一條（`daily-brief` / `weekly-review` 標）|

## 八、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] § 一 type=review / § 四 frontmatter 規格 / § 七命名規約
- [[../00-meta/scope-boundary|Scope Boundary]] § 一 + § 三判斷準則
- [[../00-meta/vault-charter|Vault Charter]] § 一 2026-05-21 升級說明
- [[../00-meta/audit-log|Audit Log]] — daily-brief / weekly-review 寫入記錄
- `.claude/skills/daily-brief/SKILL.md` — Daily Brief skill
- `.claude/skills/weekly-review/SKILL.md` — Weekly Review skill
- `daily/_template.md` — Daily 卡模板
- `weekly/_template.md` — Weekly 卡模板
