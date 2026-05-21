---
type: meta
status: active
last-reviewed: 2026-05-20
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
| 2026-05-20 | 售後 ticket reactive 補丁循環 | open | high | 3（Miles 移除 workshop action）| [[2026-05-20-售後ticket-reactive-補丁循環]] |
| 2026-05-20 | change archive OQ 收尾流程缺口 | open | high | 4 | [[2026-05-20-change-archive-OQ收尾流程缺口]] |

## 二、Status 統計

- open: 2
- in-progress: 0
- resolved: 0
- cancelled: 0

## 三、近期執行

### 2026-05-20 售後 ticket reactive 補丁循環（vault-audit 接續）

售後 ticket 模組 1.5 個月內連續 5 個 change（v0.1~v0.5）+ 11 個相關 OQ 累積；XM-004 OQ 已預警「ticket 內部端對端流程推演」缺步驟。主要 action：**PM 推演 8 情境**（5/26 前，Sens 不採實體 workshop 模式）→ propose 整合 change（6/3~6/8）一次性 resolve AFT-1/2/XM-001/XM-005 四個 OQ。

### 2026-05-20 change archive OQ 收尾流程缺口（vault-audit 接續）

`/opsx:archive` 工作流缺「OQ 收尾」步驟，導致：7 個 QC 重構期 OQ 變孤兒、XM-006 撞號、3 個 OQ source-link 過期、9 個 OQ 缺 expected-resolution-at、OQ 命名規約不一致。主要 action：更新 archive skill 加 OQ 收尾步驟（5/22 前）+ 修本次發現的 6 個 OQ + 統一命名規約。

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
