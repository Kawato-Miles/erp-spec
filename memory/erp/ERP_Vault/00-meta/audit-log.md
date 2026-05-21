---
type: meta
status: active
last-reviewed: 2026-05-21
---

# Vault Audit Log

> 追加式日誌。記錄 Vault 所有重大操作。**禁止覆寫歷史**。
>
> 用途：
> - vault-audit 跑前讀此檔，避免重複報同樣議題
> - vault-insight 跑前讀此檔，識別「已落實」「進行中」「未落實」的議題演化
> - Miles 回顧 Vault 健康歷程與演化軌跡
> - 對應 Karpathy LLM Wiki 模式中的 `log.md` 角色

## 一、紀錄格式

### 涵蓋事件對照表（2026-05-21 起擴大）

原本只記 `audit` / `insight`，2026-05-21 起擴大記錄範圍涵蓋以下九類重大操作：

| 事件 | 觸發時機 | 標籤 |
|------|---------|------|
| Ingest A（寫入 raw） | vault-ingest Mode A 完成 | `ingest-A` |
| Ingest B（拆解 raw → vault） | Mode B 完成 | `ingest-B` |
| Ingest C（批次掃描）| Mode C 報告產生 | `ingest-C` |
| OQ 新增 / 解答 / 取消 | oq-manage skill 完成 | `oq` |
| Change archive | openspec change archive 後 | `change-archive` |
| Vault audit | vault-audit skill 完成（既有） | `audit` |
| Vault insight | vault-insight skill 完成（既有） | `insight` |
| 誤審記錄 | misjudgement-record 寫入 | `misjudgement` |
| 三邊同步 | Vault → Notion / OpenSpec → Vault | `sync` |
| Daily Brief 產出 | daily-brief skill 完成 | `daily-brief` |
| Weekly Review 產出 | weekly-review skill 完成 | `weekly-review` |

### 統一項目格式（2026-05-21 起新事件採用）

```markdown
## [YYYY-MM-DD HH:MM] <event-tag> | <主題簡述>

**輸入 / 觸發**：<wiki link 或 source>
**輸出 / 異動**：<wiki link 列表>
**備註**：<可選>
```

### audit 紀錄（既有格式保留）

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

### insight 紀錄（既有格式保留）

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

## [2026-05-20 18:30] audit | 補測 維度 3 / 4 | obsidian CLI

**模式**：補測（接續 18:00 audit）

**觸發**：Miles 開啟 obsidian CLI 後補做維度 3 孤立頁面 / 維度 4 缺失連結

**結果**：

### 維度 3 孤立頁面（obsidian orphans）：Warning

共 15 個 orphan，分類處理：

**A. False positive（canvas / index 檔）**：5 個
- `09-canvases/*.canvas` 共 5 個 — canvas 為 entry point 不需要 wiki link 反向引用，不算 orphan
- `10-references/prototype-index.md` — index 性質，不算 orphan
- `11-review-knowledge/README.md` — README 性質，不算 orphan

**B. 跨產品邊界正常孤立**：1 個
- `01-products/graphic-editor/product-vision.md` — 圖編 Vault 獨立，不在 ERP 引用圖內

**C. 真實 orphan（需 follow-up）**：7 個 OQ 卡
- `PT-002-QC 分批驗收派工數量機制.md`（QC 重構期間 OQ）
- `PT-003-NCR Rework 具體實現.md`（QC 重構期間 OQ）
- `PT-004-QCRecord 資料遷移.md`（QC 重構期間 OQ）
- `PT-005-QC 心智模型驗證.md`（QC 重構期間 OQ）
- `XM-005-Use-As-Is 退款流程串接.md`（QC 重構期間 OQ）
- `XM-006-降級為次級品出貨.md`（QC 重構期間 OQ）— 注意：兩個不同 XM-006 撞號（另一個是備註模板維護路徑）需處理
- 對應 reclassify-qc-and-add-inspection change（已 archive），但 OQ 卡未被 README 或其他卡引用

**XM-006 撞號**：兩個 OQ 共用 XM-006 編號（「降級為次級品出貨」+「備註模板維護路徑」）— 需修一個編號

### 維度 4 缺失連結（obsidian unresolved）：OK（過濾後）

unresolved 主要是 Vault 外引用（`.claude/agents/`、`openspec/specs/`、`openspec/changes/archive/`），這些是合法的「指向 Vault 外」引用，obsidian 在 vault 邊界內找不到合理。

**唯一需修**：3 個 OQ（PT-002/003、XM-006）的 source-link 指向 `openspec/changes/reclassify-qc-and-add-inspection/design.md`（active change 路徑），而該 change 已 archive。應改指向 `openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md`。

**主要發現（補測新增）**：
1. 6 個 QC 重構期間 OQ 孤立（無 backlink）— 應補納入 README OQ 清單表格或對應實體卡引用
2. XM-006 編號撞號 — 兩個不同 OQ 共用同一 ID
3. 3 個 OQ source-link 指向已 archive 的 change 路徑

**下一步建議（補測新增）**：
- 修 XM-006 撞號（重編其中一個為 XM-007）
- 補 6 個 QC 重構 OQ 進 README 清單表格 + 對應實體卡（如 [[QC]] / [[生產任務]]）建 backlink
- 修 3 個 OQ source-link 改指向 archive 路徑

## [2026-05-20 19:00] insight | audit-接續

**觸發**：vault-audit 接續（4 維度需 follow-up + OQ 累計 32 + 兩個 change 連續 archive）

**輸出**：
- [[../12-insights/2026-05-20-售後ticket-reactive-補丁循環]]（priority high，4 actions）
- [[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]]（priority high，4 actions）

**關鍵推論**：
1. 售後 ticket 模組進入「Miles 走查 → 發現 gap → 開 change → archive → 走查 → 再發現 gap」reactive 補丁循環，根因為缺乏端到端 user journey 基準文件；建議辦跨角色 workshop + 整合 change 一次性解 4 個高優 OQ
2. `/opsx:archive` 工作流缺 OQ 收尾步驟，導致孤兒 OQ / 撞號 / 過期 source-link / 缺 expected-resolution-at / 命名規約不一致五項治理債；建議更新 archive skill 加 OQ 收尾 checklist + 一次性回溯修舊資料

**下一步 actions 數**：共 8 個 actions（兩 insight 各 4 個），priority high actions 5 個，預估 6/15 前可全數完成。

## [2026-05-20 19:30] insight-revision | Miles 反饋

**觸發**：Miles 反饋「不會有實體的 workshop」+「後續的稽核也不用考慮 workshop」

**異動**：
- Insight 1（售後 ticket reactive 補丁循環）：移除原 Action 1「實體 workshop」；原 Action 1.2 改為「PM 桌面走查」（5/26 前）；原 Action 3 流程準則被併入既有 Action 1.3 不單獨列；actions 由 4 → 3
- review-loading-checklist § 四 修補：新增 4.2「走查方式（桌面走查，不採實體 workshop）」明示 Sens 不安排跨角色實體會議；改為 PM 主導 + Claude 協助 + 個別非同步詢問取得實務輸入

**影響範圍**：
- 12-insights/2026-05-20-售後ticket-reactive-補丁循環.md（含「後續更新」紀錄）
- 12-insights/README.md（actions 數 4 → 3）
- 11-review-knowledge/_shared/review-loading-checklist.md § 4.2

**對後續 vault-audit 的意涵**：審稿 / vault-audit 不再以「workshop」作為走查模式判定標準；改以「07-scenarios/ 卡是否存在 + PM 走查紀錄完整度」作判定。

## [2026-05-21 10:54] daily-brief | 2026-05-21

**輸入 / 觸發**：Miles 觸發「開工」（daily-brief skill v0.1 首次試跑）

**輸出 / 異動**：[[../14-reviews/daily/2026-05-21]]

**備註**：
- 今日建議 3 條（PM 桌面走查售後情境 / 修治理債 / active change 收斂）
- 昨日進度涵蓋 21 個 commit（reclassify-qc archive、refine-after-sales-refund archive、refine-supplementary-print-skip-review archive、add-order-note-section archive、vault-audit 全量、vault-insight 產 2 個 high insight）
- 警示：12 個 active change 累積、raw 0 張（本週剛建）

## [2026-05-21 11:30] skill-revision | daily-brief / weekly-review 設計反饋

**輸入 / 觸發**：Miles 對首次試跑 daily-brief 結果的反饋（措辭「這兩個資訊跟我沒關係 / 後續不用再給」「判斷標準不是快速完成 / 是相依性和優先度」）

**輸出 / 異動**：
- `.claude/skills/daily-brief/SKILL.md`：新增強制規則 6 / 7 / 8（禁附產出位置 / 禁附預估時間 / 排序 MUST 用相依性 > 優先度 > 時效性、MUST NOT 用快速完成）；Step 2 排序原則改寫；Step 3 產出規格改為「source + 下一步 + 相依性說明」；§ 七 Anti-Pattern 表加 3 row
- `.claude/skills/weekly-review/SKILL.md`：同步新增強制規則 7 / 8 / 9；Step 3 / Step 6 同步改寫；§ 八 Anti-Pattern 表加 3 row
- `14-reviews/daily/_template.md`：欄位從「預估時間」改為「相依性」
- `14-reviews/weekly/_template.md`：欄位從「預估完成」改為「相依性」
- [[../14-reviews/daily/2026-05-21]]：依新規約重寫整張卡（建議排序從原「priority high 在前」改為「相依性鏈：收斂 active → PM 走查 → 治理債」；移除三條建議的「產出位置」與「預估時間」欄位；改寫「為何現在做」措辭去除「快速完成」字眼）

**備註**：
- 反饋本質：daily-brief / weekly-review 給的「產出位置」「預估時間」對 Miles 沒幫助；「快速完成」不是合法的排序依據（估時不準）
- skill 紀律演化：兩個 skill 從 5 / 6 條強制規則擴為 8 / 9 條；Anti-Pattern 防線收窄
- 未來檢查：下次 daily-brief / weekly-review 跑時 verify 是否仍有違反

## 三、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] — Vault 治理規則
- [[../00-meta/scope-boundary|Scope Boundary]] — Vault 收 / 不收
- [[../12-insights/README|12-insights 總覽]] — insight 清單
- `.claude/skills/vault-audit/SKILL.md` — audit skill
- `.claude/skills/vault-insight/SKILL.md` — insight skill
