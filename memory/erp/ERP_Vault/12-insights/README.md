---
type: meta
status: active
last-reviewed: 2026-05-19
---

# Insights 總覽

> 跨主題模式識別與下一步建議。由 [`vault-insight` skill](../../../.claude/skills/vault-insight/SKILL.md) 產出。
>
> 與 OQ 的區別：
> - **OQ**：單一未解問題（誰也回答）→ `08-open-questions/`
> - **Insight**：**多個 OQ / 觀察的模式整合 + 下一步建議**（識別系統性議題）→ 本目錄

## 一、Insight 清單（依日期）

> 由 vault-insight skill 自動追加。Miles 可手動更新 status 欄位。

| 日期 | 主題 | status | priority | actions 數 | 對應卡 |
|------|------|--------|----------|------------|--------|
| — | （尚無 insight）| — | — | — | — |

## 二、Status 統計

- open: 0
- in-progress: 0
- resolved: 0
- cancelled: 0

## 三、近期執行

> （尚無執行紀錄）

## 四、觸發指引

執行 vault-insight 的時機：

| 觸發 | 信號 | 動作 |
|------|------|------|
| **手動** | Miles 說「跑 insight」「找下一步」「找系統性議題」 | 直接執行 |
| **OQ 累積** | `08-open-questions/` 達 15 個 open | Claude 建議 Miles 跑 |
| **Phase 切換** | phases.md 更新 / 北極星指標達標 | Claude 建議 Miles 跑 |
| **change archive 後** | `/opsx:archive` 完成 | Claude 建議 Miles 跑 |
| **audit 接續** | vault-audit 發現 ≥ 5 個 error | Claude 自動建議 |

## 五、Anti-Pattern 提醒

每個 insight MUST 符合：

- ✓ 有具體 source（指向卡 / OQ / spec / commit）
- ✓ 有具體下一步 action（誰 / 何時 / 做什麼）
- ✓ 不重複既有 insight 主題（除非有新證據）
- ✗ 禁空洞讚美（「Vault 結構良好」這類）
- ✗ 禁無 action 的純觀察

## 六、Insight 生命週期

```
open → in-progress（已開始執行 action） → resolved（action 完成）
                                              ↓
                                            移至 _archives/<YYYY>/
```

或：

```
open → cancelled（議題不再適用）
```

## 七、相關

- [[../00-meta/audit-log|Audit Log]] — 追加式日誌（含每次 audit / insight 紀錄）
- [[../00-meta/wiki-schema|Wiki Schema]] — Vault 治理規則
- [[../08-open-questions/README|OQ 總覽]] — 個別問題清單
- `.claude/skills/vault-insight/SKILL.md` — Skill 詳細工作流
- `.claude/skills/vault-audit/SKILL.md` — 配套 audit skill
