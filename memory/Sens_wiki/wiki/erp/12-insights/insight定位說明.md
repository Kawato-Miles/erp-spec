---
type: meta
status: active
last-reviewed: 2026-06-13
---

# Insight 定位說明

> 跨主題模式識別與下一步建議。由 [`vault-insight` skill](../../../../.claude/skills/vault-insight/SKILL.md) 產出。

## 定位

| 機制 | 是什麼 | 位置 |
|------|--------|------|
| **OQ** | 單一未解問題（待裁決） | `08-open-questions/` |
| **Insight** | 多個 OQ / 觀察的模式整合 + 下一步建議（識別系統性議題） | 本目錄 |

## 查詢方式（不維護人工清單）

> 本檔不放 Insight 清單快照——靜態清單必過時。要看現況：

- 現有 open insight：grep 本目錄 `status: open`
- 健康狀況：`vault-audit`

## 相關

- [[OQ運作總覽]] — OQ 操作手冊
- [[log|操作史]] — 追加式日誌（含每次 insight 紀錄）
- [[wiki-schema|Wiki Schema]] — Vault 治理規則
- `.claude/skills/vault-insight/SKILL.md` — 觸發指引、紅旗清單、輸出範本（操作正本）
- `.claude/skills/vault-audit/SKILL.md` — 配套 audit skill
