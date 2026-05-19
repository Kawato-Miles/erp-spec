---
type: meta
status: active
last-reviewed: 2026-05-19
---

# Vault Audit Log

> 追加式日誌。每次 `vault-audit` / `vault-insight` 執行後追加一筆。**禁止覆寫歷史**。
>
> 用途：
> - vault-audit 跑前讀此檔，避免重複報同樣議題
> - vault-insight 跑前讀此檔，識別「已落實」「進行中」「未落實」的議題演化
> - Miles 回顧 Vault 健康歷程

## 一、紀錄格式

### audit 紀錄

```markdown
## [YYYY-MM-DD HH:MM] audit | <模式> | <維度數>

**模式**：全量 / 單維度（N） / 修復

**結果**：
- 維度 1 矛盾：<OK|Warning|Error>（命中數）
- 維度 2 過時：<status>（命中數）
- ...

**主要發現**：[3-5 句濃縮]

**下一步建議**：[1-3 條]
```

### insight 紀錄

```markdown
## [YYYY-MM-DD HH:MM] insight | <觸發來源>

**觸發**：manual / OQ-累積 / phase-切換 / change-archive / audit-接續

**輸出**：[[../12-insights/YYYY-MM-DD-主題slug]]

**關鍵推論**：[1-2 句濃縮]

**下一步 actions 數**：N
```

## 二、紀錄

> 第一筆 audit / insight 執行後追加於下。

<!-- 由 vault-audit / vault-insight skill 自動追加，禁止人工覆寫歷史 -->

## 三、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] — Vault 治理規則
- [[../00-meta/scope-boundary|Scope Boundary]] — Vault 收 / 不收
- [[../12-insights/README|12-insights 總覽]] — insight 清單
- `.claude/skills/vault-audit/SKILL.md` — audit skill
- `.claude/skills/vault-insight/SKILL.md` — insight skill
