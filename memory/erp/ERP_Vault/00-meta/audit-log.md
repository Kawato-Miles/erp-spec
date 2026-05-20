---
type: meta
status: active
last-reviewed: 2026-05-20
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

## [2026-05-20 18:00] audit | 全量 | 10 維度

**模式**：全量

**觸發**：`refine-after-sales-refund-and-add-supplementary-print` 與 `refine-supplementary-print-skip-review` 兩個 change 連續歸檔 + 17 個 Vault 檔案異動（10 新 OQ + 3 答覆 + 3 實體卡 + README）達 ≥ 5 Vault 卡異動門檻

**結果**：
- 維度 1 頁面間矛盾：**OK**（grep 層面無矛盾敘述）
- 維度 2 過時宣稱：**OK**（0 卡 last-reviewed > 90 天）
- 維度 3 孤立頁面：**無法判定**（bash for loop 處理含空白檔名失敗，多 false positive；需改用 obsidian CLI orphans）
- 維度 4 缺失連結：**Warning → Fixed**（14 unresolved，2 個關鍵 [[AFT-1-業務離職轉派]] / [[AFT-2-逾期分級]] 為本次新增 OQ 卡誤用錯誤前綴；已修為 [[after-sales-ticket-AFT-1-...]] / [[after-sales-ticket-AFT-2-...]]。其餘為 schema 範例 / placeholder / 跨檔路徑引用，不影響使用）
- 維度 5 數據缺口：**OK**（entity 卡 frontmatter 齊全）
- 維度 6 規則遵守：**OK**（無 inline `[!question]` / 待補措辭 / OQ 命名違規）
- 維度 7 Vault↔OpenSpec 對齊：**OK**（過濾 schema 佔位符後 0 broken spec）
- 維度 8 OQ 健康度：**Warning**（9 OQ 缺 expected-resolution-at / 2 OQ 缺 source-link 為舊命名遺留）
- 維度 9 角色 alignment：**Warning**（alignment-report 標 11 角色缺漏，user-roles spec 已有 26 Requirement，alignment-report 可能過期需重新對齊）
- 維度 10 KPI / Phase：**Warning**（phases.md + success-metrics.md 存在但 01-products/erp/kpi/ 目錄只有 README，KPI 卡尚未建立）

**整體狀態**：Warning（5 OK / 4 Warning / 1 無法判定）

**主要發現**：
1. 本次新增 OQ 卡（AFT-4 / XM-004）內對舊 AFT-1/2 wiki link 撞到命名前綴（舊命名 `after-sales-ticket-AFT-X` vs 新命名 `AFT-X`）；已 fix 兩處
2. 9 個 OQ 缺 expected-resolution-at 妨礙跨主題分析；建議 Miles 補預計解決時程
3. alignment-report 可能與現況 user-roles spec 脫節（spec 26 Requirement vs report 仍標 11 缺漏）
4. KPI 卡尚未建立（只有 README placeholder）

**下一步建議**：
- 跑 `vault-insight`（OQ 累計達 32 個 = 28 open + 4 answered，達觸發條件 ≥ 15）— 提煉系統性議題（特別是售後 ticket 連 4 個 change 的 reactive 補丁模式 → XM-004 已標問題）
- Miles 補 9 個 OQ 的 expected-resolution-at（ORD-001、PI-001/002、PT-001/002、SHP-005、XM-002/003/006）
- 更新 03-roles/_alignment-report.md 對齊 user-roles spec 現況（11 缺漏角色是否仍存在）
- 維度 3 改用 obsidian CLI（`obsidian orphans` 命令）重跑取得真實 orphan 清單

## 三、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] — Vault 治理規則
- [[../00-meta/scope-boundary|Scope Boundary]] — Vault 收 / 不收
- [[../12-insights/README|12-insights 總覽]] — insight 清單
- `.claude/skills/vault-audit/SKILL.md` — audit skill
- `.claude/skills/vault-insight/SKILL.md` — insight skill
