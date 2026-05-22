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
- 今日建議 3 條（PM 推演售後情境 / 修治理債 / active change 收斂）
- 昨日進度涵蓋 21 個 commit（reclassify-qc archive、refine-after-sales-refund archive、refine-supplementary-print-skip-review archive、add-order-note-section archive、vault-audit 全量、vault-insight 產 2 個 high insight）
- 警示：12 個 active change 累積、raw 0 張（本週剛建）

## [2026-05-21 11:30] skill-revision | daily-brief / weekly-review 設計反饋

**輸入 / 觸發**：Miles 對首次試跑 daily-brief 結果的反饋（措辭「這兩個資訊跟我沒關係 / 後續不用再給」「判斷標準不是快速完成 / 是相依性和優先度」）

**輸出 / 異動**：
- `.claude/skills/daily-brief/SKILL.md`：新增強制規則 6 / 7 / 8（禁附產出位置 / 禁附預估時間 / 排序 MUST 用相依性 > 優先度 > 時效性、MUST NOT 用快速完成）；Step 2 排序原則改寫；Step 3 產出規格改為「source + 下一步 + 相依性說明」；§ 七 Anti-Pattern 表加 3 row
- `.claude/skills/weekly-review/SKILL.md`：同步新增強制規則 7 / 8 / 9；Step 3 / Step 6 同步改寫；§ 八 Anti-Pattern 表加 3 row
- `14-reviews/daily/_template.md`：欄位從「預估時間」改為「相依性」
- `14-reviews/weekly/_template.md`：欄位從「預估完成」改為「相依性」
- [[../14-reviews/daily/2026-05-21]]：依新規約重寫整張卡（建議排序從原「priority high 在前」改為「相依性鏈：收斂 active → PM 推演 → 治理債」；移除三條建議的「產出位置」與「預估時間」欄位；改寫「為何現在做」措辭去除「快速完成」字眼）

**備註**：
- 反饋本質：daily-brief / weekly-review 給的「產出位置」「預估時間」對 Miles 沒幫助；「快速完成」不是合法的排序依據（估時不準）
- skill 紀律演化：兩個 skill 從 5 / 6 條強制規則擴為 8 / 9 條；Anti-Pattern 防線收窄
- 未來檢查：下次 daily-brief / weekly-review 跑時 verify 是否仍有違反

## [2026-05-21 18:00] structural-change | 新增 13-user-stories 目錄 + erp-user-story skill + 審稿模組 pilot

**輸入 / 觸發**：Miles 反映「User Story 匯出 Notion 耗 Token、Vault 不是正本，要納入 Vault 統一管理」+ 兩階段撰寫紀律需求（業務情境穩定層 / UI 操作易變層，避免 Prototype 變動造成 user story 失效）

**輸出 / 異動**：

Schema / 治理層：
- `00-meta/wiki-schema.md`：新增 `type=user-story`（type enum / frontmatter schema / 目錄允許 type / 命名規約 / 維度 13 lint 規則 / Anti-Pattern）；MODULE 前綴新增 AR / MM / PM / BM
- `00-meta/sync-workflow.md`：新增「§ 二之二、流程 1-B：Vault → Notion User Story DB（單向推送）」；修正 § 二步驟 4 「User Story（自 OpenSpec spec § Scenarios）」 為「User Story（自 Vault `13-user-stories/<module>/`）+ Acceptance Scenarios（自 OpenSpec spec § Scenarios）」

入口 / 模板：
- `13-user-stories/README.md`：新建（type=meta 入口，含定位 / 兩階段紀律 / 命名規約 / 目錄結構 / Provenance 規約 / 工作流 / 與 OpenSpec change 整合 / 業界來源）
- `13-user-stories/_template.md`：新建（type=meta 標準模板，含完整 frontmatter + 兩階段 H2 範本 + INVEST 自審 + Lint 自檢清單）

Skill：
- `.claude/skills/erp-user-story/SKILL.md`：新建（Mode A 新增 / Mode B 補 UI / Mode C 推送 Notion；8 條 Anti-Pattern 強制規則；Notion property mapping；與 oq-manage / erp-test-case / vault-audit 整合）

Pilot — 審稿模組（11 張 user story 卡）：
- `13-user-stories/prepress-review/US-AR-001-審核稿件.md` 到 `US-AR-011-打樣後重新處理稿件.md` 共 11 張
- 從 [Notion User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d) 抓 AR 前綴 11 條目重寫（不是直譯）
- US-AR-002 在 Notion 有編碼重複（兩個不同條目），其中「打樣後重新處理稿件」重新編號為 US-AR-011
- US-AR-010 B2C 會員角色不在 03-roles/，role 暫用純文字標 + 引 OQ

OQ：
- `08-open-questions/AR-1-B2C會員是否納入正式角色.md`：B2C 會員是否新增為角色 / 跨 ERP / EC 視角處理選項
- `08-open-questions/AR-2-Notion-US-AR-002編碼重複處理.md`：Notion 端編碼衝突的處理方式

CLAUDE.md：
- § 快速索引 § 載入原則表格：「使用者故事 / 業務情境」列必讀改為 Vault `13-user-stories/<module>/`
- § ERP 資源表格：「User Story（業務故事集）」正本改為 Vault `13-user-stories/`
- § ERP 討論主動路由：新增「新增 / 修改 User Story」列 → erp-user-story skill
- § PM 工作原則 § 8 用語一致性：補「User Story 禁中英夾雜」例與 wiki link
- § 工具表格：補 erp-user-story skill 索引

**驗收結果**（pilot 11 張卡）：
- 英文欄位名 grep（payment / printItem / orderAdjustment / quoteRequest / workOrder / productionTask / reviewRound / paymentPlan / afterSalesTicket）：0 命中（PASS）
- UI 措辭 grep（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）：業務情境段 0 命中（PASS）
- frontmatter 必填項：11 張全填齊（type / us-id / module / role / priority / stage / status / created-at / last-reviewed / source）（PASS）
- source 防自迭代：11 張 source 全無指向其他 user-story 卡（PASS）
- acceptance criteria 數量：11 張全部在 2-5 條範圍（PASS，分布 3-5 條）

**備註**：
- 概念釐清：CLAUDE.md 原宣告「User Story 正本 = OpenSpec spec § Scenarios」實為錯誤；spec § Scenarios 是 requirement-level Given/When/Then 工程驗收，不是 user story 故事格式；本次修正釐清為「Vault 13-user-stories（business-level） + OpenSpec § Scenarios（Acceptance Scenarios）互補」
- 兩階段紀律：業務情境穩定層保證 Prototype 改版時 user story 主文不動；UI 操作易變層含 ui-binding 版本標記，Prototype 改版時只更新此段
- Anti-Model-Collapse：每張 user story 必填 source ≥ 1 條 + 禁指向其他 user story；對應 Karpathy LLM Wiki 防自迭代原則
- pilot 範圍：僅審稿模組 11 張；其他模組（QR / ORD / CR / AS / WO / PT / QC / SHP / MM / PM / BM）82 條目待 pilot 驗收後逐步遷移
- Notion 端尚未推送：mode C 待 Miles 觸發；確認 schema 驗證可行性後執行

## [2026-05-21 12:30] skill-revision | daily-brief / weekly-review 結構改為「現況 / Next action」兩段條列化

**輸入 / 觸發**：Miles 對重寫後 daily brief 的二次反饋（措辭「Brief 結構改成 Action Title + 現況 + Next action」「內容條列化，類似會議記錄」「明確說明原因，這樣我才能判斷」）

**輸出 / 異動**：
- `.claude/skills/daily-brief/SKILL.md`：Step 3 產出結構改為「現況 / Next action」兩段條列化模板；新增強制規則 9 / 10（禁長句段落、現況/Next action 職責分離）；§ 七 Anti-Pattern 表加 2 row；強制規則 3 措辭「禁無下一步」改為「禁無 Next action」
- `.claude/skills/weekly-review/SKILL.md`：Step 6 同步改寫；新增強制規則 10 / 11；§ 八 Anti-Pattern 表加 2 row；強制規則 3 措辭改寫
- `14-reviews/daily/_template.md`：建議行動段重寫為新模板（現況 / Next action 兩段 + 條列化）
- `14-reviews/weekly/_template.md`：下週重點段同步改寫
- [[../14-reviews/daily/2026-05-21]]：再次重寫 3 條建議（套用新結構：每條 Action 標題 + 現況條列 + Next action 條列；相依性併入現況段）

**備註**：
- 反饋本質：原「為何現在做 / 下一步 / 相依性」三段太散，長句段落式難以掃；改為「現況（事實 + 相依性）/ Next action（執行動作）」兩段，會議紀錄式條列化讓 Miles 能快速判斷
- skill 紀律演化：daily 從 8 → 10 條強制規則；weekly 從 9 → 11 條
- 結構約束：「現況段是事實 / 原因」、「Next action 段是執行動作」 — MUST 職責分離不混淆

## [2026-05-21 13:00] skill-revision | 相依性格式改為「阻擋 / 被阻擋」兩 sub-bullet

**輸入 / 觸發**：Miles 對結構重寫後的三次反饋（措辭「相依性應該是要知道該工作與其他工作的關係，所以會是阻擋 / 被阻擋」）

**輸出 / 異動**：
- `.claude/skills/daily-brief/SKILL.md`：Step 3 結構模板「相依性」從一行「上游/下游/平行/獨立」改為兩 sub-bullet「阻擋 / 被阻擋」；紀律段明示「兩格可只填一格、無相依時寫『相依性：獨立』」
- `.claude/skills/weekly-review/SKILL.md`：Step 6 同步改寫
- `14-reviews/daily/_template.md`：相依性欄位改為兩 sub-bullet
- `14-reviews/weekly/_template.md`：同步
- [[../14-reviews/daily/2026-05-21]]：3 條建議的相依性段重寫為「阻擋 / 被阻擋」格式（建議 1 阻擋建議 2 + 整合 change propose、被阻擋無；建議 2 阻擋 Insight 1 Action 2、被阻擋建議 1；建議 3 獨立）

**備註**：
- 反饋本質：「上游 / 下游」措辭抽象，Miles 認為直白的「阻擋（誰被我擋）/ 被阻擋（誰擋我）」更符合工作關係的語意
- 用法：兩格可獨立填寫，無相依時改寫「相依性：獨立」一行不展開
- 第三次結構演化：daily 規則仍維持 10 條（措辭調整），weekly 維持 11 條

## [2026-05-21 18:30] weekly-review | 2026-W21（首次試跑）

**輸入 / 觸發**：Miles 觸發「試試每週的」（weekly-review skill v0.1 首次試跑，週四提前產出）

**輸出 / 異動**：[[../14-reviews/weekly/2026-W21]]

**備註**：
- 本週學到 5 條：售後 reactive 補丁循環需 PM 推演 / Karpathy + Yu 共存可不重組 vault / skill 設計需迭代不需閉門 / 跨層次穩定性分離範式（user story 兩階段）/ PRC 用語滲透需 CLAUDE.md 範例庫
- 本週完成：68 commit、13 change archive、43 OQ 新增 / 5 解答、5 個新 skill 建置、Vault Phase A-E + 三大新中樞（raw / 14-reviews / 13-user-stories）
- 下週重點 3 條（套阻擋 / 被阻擋格式）：收斂 active change 列表 / 推演售後情境 + propose 整合 change（涵蓋 4 個高優 OQ）/ 修治理債
- 涵蓋區間 2026-05-18 ~ 2026-05-24（本週尚未結束，僅週四提前產出；本週 daily 卡僅 1 張）

## [2026-05-21 19:00] skill-revision | daily / weekly review 擴充反思類非待辦面向

**輸入 / 觸發**：Miles 反饋「目前提供的只有局限在整理待辦有點沒有價值」+「上網查這種 weekly / daily 的機制，除了整理待辦外，是否有其他使用用途」+ 給的參考 Yu 全景監獄

**輸出 / 異動**：
- `.claude/skills/daily-brief/SKILL.md`：新增 Step 3.5「今日反目標」+ Step 4「昨日進度 + 決策紀錄 + 學到」三段；強制規則加 11 / 12 / 13（反目標禁空洞 / 決策段只記設計決策 / 學到禁超過 2 條）
- `.claude/skills/weekly-review/SKILL.md`：新增 Step 5.5「未完成原因分析」+ Step 5.6「決策品質回顧」+ Step 6.5「Pre-mortem 預警」；強制規則加 12 / 13 / 14（未完成原因多問一層為什麼 / 決策品質聚焦邏輯 / Pre-mortem 風險具體）
- `14-reviews/daily/_template.md`：結構重組為「今日（建議行動 / 反目標）+ 昨日（進度 / 決策 / 學到）」
- `14-reviews/weekly/_template.md`：新增三段並重編 section 編號（七段：本週學到 / 本週完成 / 未完成原因 / 決策品質 / 下週重點 / Pre-mortem / 開放議題）
- [[../14-reviews/daily/2026-05-21]]：補三段反思內容（反目標 3 條 / 決策紀錄 2 條 / 學到 2 條）
- [[../14-reviews/weekly/2026-W21]]：補三段反思內容（未完成原因 3 條 / 決策品質 3 條 / Pre-mortem 3 條）

**反饋本質**：原 daily/weekly review 只覆蓋「整理待辦」面向，Miles 認為價值有限。研究 Yu 全景監獄 + GTD + Forte Labs + Obsidian Periodic Notes 後識別出 7 個「非待辦」面向；Miles 選 6 個加入（不加四檔標記、不加 Lead vs Lag 指標）

**skill 紀律演化（一日內五次）**：
- daily：5 → 8（5cf781b）→ 10（e8dfc57）→ 10（223bd99 措辭）→ **13**（本次）
- weekly：6 → 9（5cf781b）→ 11（e8dfc57）→ 11（223bd99 措辭）→ **14**（本次）

**備註**：本次擴充把 daily/weekly review 從「執行層工具」升級為「執行 + 反思 + 預警」三層工具。對應 Yu Wenhao 全景監獄文章核心觀念：「看見自己」（執行層 / 決策層 / 認知層三層可見性）

## [2026-05-22 16:00] structural-change | user story 訂單模組 12 張 v2 完整校對（Plan Part 2 完成）

**輸入 / 觸發**：Plan Part 2 順序「諮詢單 → 需求單 → 訂單」第三階段（訂單，最後一階段）

**輸出 / 異動**：

12 張 user-story 卡 v2（訂單模組全部，含編碼重整）：
- US-ORD-001 業務主管訂單審核
- US-ORD-002 業務送出報價單給客戶
- US-ORD-003 業務上傳回簽檔案
- US-ORD-004 訂單印件管理（含免審稿快速路徑連動）
- US-ORD-005 訂單發票與配送資訊編輯
- US-ORD-006 訂單三種備註管理（500 字 + 模板選擇器）
- US-ORD-007 訂單複製功能（沿用 QR-009 帳務公司重新推導紀律）
- US-ORD-008 訂單列表分享與代理（與需求單授權元件一致）
- **US-ORD-009 訂單管理人查看全公司訂單**（原 Notion 重複 US-ORD-005 重新編號）
- US-ORD-010 補收款訂單建立（主從關聯 + 主訂單合計）
- US-ORD-011 訂單取消與退款（top-down 連鎖 + 退款三狀態 + 折讓單分離）
- US-ORD-012 線下單客戶資料關聯帶出（已開發票快照例外）

1 新 OQ：
- [[../08-open-questions/ORD-1-Notion-US-ORD-005編碼重複處理]]（已 answered，沿用 AR-2 模式）

**驗收結果**（12 張卡）：
- 英文欄位名 / UI 措辭 / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」字數：15-24 字（全 ≤ 30）
- acceptance criteria：4-5 條（全 PASS）

**Plan Part 2 整體完成**：
- 4 模組 user story v2/v3 校對完成：審稿 11 + 諮詢 6 + 需求單 13 + 訂單 12 = **42 張**
- 衍生 OQ 12 個（AR-1~12 已答 2 + CR-1~3 開 + ORD-1 已答）= 9 個 open
- audit-log 6 段紀錄（pilot of pilot / 審稿 4 批 / 諮詢 / 需求單 / 訂單）
- 紀律演化：user-story-spec § 五累計 5 條規約（含 Anchor 例外條款）+ wiki-schema 維度 13 lint 規則 + review-loading-checklist § 三 1 個誤判案例

**備註**：
- 諮詢單採「v2 + 雙視角 + v3」雙階段；需求單 / 訂單採「v2 + lint」單階段（紀律已內化）
- 累積 open OQ：9 個（AR-5/6/7/8/9/10/11/12 + CR-1/2/3，已扣除 ORD-1 / AR-1 / AR-2 已 answered）
- 下一步建議：Miles 解答 OQ → 推送 Notion mode C / 推進 ERP 其他模組（QC / WO / PT / SHP 等）

## [2026-05-22 15:00] structural-change | user story 需求單模組 13 張 v2 完整校對

**輸入 / 觸發**：Plan Part 2 順序「諮詢單 → 需求單 → 訂單」第二階段（需求單）

**策略調整**：相較諮詢單模組「直接寫 v2 + 雙視角審查 + v3」，需求單模組採「直接寫 v2 + lint 驗證」單階段流程，跳過雙視角審查（理由：(a) 紀律已內化、(b) Miles 已說「依你建議繼續」、(c) QR 模組複雜度低於諮詢單跨模組金流、(d) Miles 可於 commit 後抽查反饋）

**輸出 / 異動**：

13 張 user-story 卡 v2（需求單模組全部）：
- US-QR-001 建立需求單（含帳務公司自動推導 v3.2 設計）
- US-QR-002 管理需求單進度（已評估成本 → 議價 → 成交 / 流失，無業務主管核可閘門）
- US-QR-003 管理需求單印件（多印件、毛利率、預計產線、難易度）
- US-QR-004 管理需求單參考資料（多附件 + 版本保留）
- US-QR-005 待評估報價通知（即時通訊整合 + 討論串連結回寫）
- US-QR-006 申請重新評估報價（議價中 → 待評估、歷史報價保留）
- US-QR-007 需求單成交轉訂單（雙向關聯、預計產線帶入、諮詢付款轉移）
- US-QR-008 需求單流失歸因（必選 LOV、不可逆、諮詢來源觸發建諮詢訂單）
- US-QR-009 複製需求單（依新接單公司重新推導帳務公司）
- US-QR-010 分享需求單給同事參考（檢視權限）
- US-QR-011 設定需求單職務代理人（編輯權限 + 活動紀錄歸屬實際操作者）
- US-QR-012 設定評估印務主管（角色限定 + 鎖定 lifecycle）
- US-QR-013 評估需求單報價（印務主管視角，待辦清單過濾 + 唯讀外欄位 + 報價紀錄）

**驗收結果**（13 張卡）：
- 英文欄位名 / UI 措辭 / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」字數：14-29 字（全 ≤ 30）
- acceptance criteria：3-5 條（全 PASS）

**備註**：
- 採單階段流程比審稿 / 諮詢單模組更高效（無雙視角審查、無 v3 修正）
- 未開新 OQ（spec v3.2 已涵蓋多次迭代設計，無重大歧義）
- 已校對累計 30 張（審稿 11 + 諮詢 6 + 需求單 13）；剩餘 12 張（訂單）
- 累積 open OQ 仍為 11 個（無新增）

## [2026-05-22 14:00] structural-change | user story 諮詢單模組 6 張 v3 完整校對

**輸入 / 觸發**：Plan Part 2 擴大至諮詢單模組（依 Miles 指示「諮詢單 → 需求單 → 訂單」順序）；採「直接從 spec + Notion 整合寫 v2 → 雙視角審查 → v3」單階段流程

**輸出 / 異動**：
- 6 張 v3 卡（US-CR-001 ~ 006，commit 71ee3a0）
- 3 新 OQ：CR-1（自派 vs 他派 spec 業務模式衝突 high）/ CR-2（consultation_topic 客戶原始填寫 vs 諮詢備註 high）/ CR-3（部分退費 / 取消理由 / 退款 SLA low）
- US-CR-001「作為」從 B2C 客戶改為值班業務（受益者視角）
- US-CR-004 ~ 006 補 ActivityLog 稽核 + 業務化金流描述

**驗收**：6 張卡 lint 全 PASS（英文欄位 0 / UI 措辭 0 / frontmatter 必填齊 / 我希望 ≤ 30 字 / AC 2-5 條）

**備註**：
- 採單階段流程比審稿模組「v1 → v2」雙階段省一輪 commit
- 累積 open OQ 達 11 個（AR-5~12 + CR-1~3）；剩餘 25 張卡（需求單 13 + 訂單 12）
- CR-1 / CR-2 揭露 spec 級設計議題（業務模式 / 資料模型），priority high 待 Miles 解答

## [2026-05-21 22:00] structural-change | user story 批 4 校對（US-AR-001 anchor v2）+ Anchor 紀律演化

**輸入 / 觸發**：Plan Part 2 批次 4 執行（anchor 故事最後校對，串接所有 v2 子故事）

**輸出 / 異動**：

US-AR-001 anchor v2：
- [[../13-user-stories/prepress-review/US-AR-001-審核稿件]]：「我希望」縮 38 → 20 字、補破例派工降級路徑（spec L77-86）/ 原審稿員不在崗主管覆寫（spec L326-345）/ ActivityLog 跨輪次稽核載體（spec L347-393）/ 步驟 7 並行監控（貫穿步驟 3-6 全程而非順序步驟）/ 步驟 6 移除「合格 → 自動建工單」下游連鎖反應改 wiki link 引情境 6 / 前置條件拆兩條 / 免審稿快速路徑併入步驟 1 / 新增「相關業務情境」段引 US-AR-011 / frontmatter 補 related-oq（AR-8 / AR-10 / AR-11）/ 成功條件 5「子流程與本主骨幹整合無斷點」覆蓋 9 張子故事

user-story-spec § 五紀律演化：
- 新增「Anchor 故事例外條款」（5 條規約）：Anchor 故事 Independent 不適用 / Small ≤ 30 字例外允許但 MUST 用整體抽象描述 / 下游連鎖反應仍須 wiki link / 成功條件含子故事整合 / related-oq 反向追溯子故事衍生 OQ
- 應用情境：模組存在「總分」結構（anchor 描述循環，子故事描述動作）；單一 US 拆出 anchor 屬過度設計

**驗收結果**（US-AR-001 anchor）：
- 英文欄位名 grep / UI 措辭 grep / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」20 字（anchor 例外允許）；5 條 acceptance criteria
- **跨卡引用 10/10 全 PASS**：US-AR-002 / 003 / 004 / 005 / 006 / 007 / 008 / 009 / 010 / 011 名稱全部對齊 v2 檔名

**備註**：
- 整批 Part 2 完成：11 張卡 v2 全部校對通過（US-AR-001 anchor + US-AR-002 ~ 011 共 10 張子故事）
- Anchor 紀律演化是雙視角審查發現的紀律 gap（spec § 五原本未涵蓋 anchor 故事的特殊性），透過 senior-pm 段 3 建議補入；屬「審查程式自我演化」案例
- 累積 open OQ 達 8 個（AR-5/6/7/8/9/10/11/12），需 Miles 解答後才能進入 Notion 推送或下個模組 user story 校對

## [2026-05-21 21:00] structural-change | user story 批 3 校對（US-AR-009 / 010 / 011 v2）

**輸入 / 觸發**：Plan Part 2 批次 3 執行（補件迴圈與跨模組系列）

**輸出 / 異動**：

3 張 user-story 卡 v2：
- [[../13-user-stories/prepress-review/US-AR-009-B2B業務代客戶補件]]：「我希望」縮 48 → 19 字、補業務權限邊界 / 原審稿員不在崗主管覆寫 / 補件檔案 round_id NULL 暫存 / 修正既存 client_note ActivityLog 稽核、移除下游連鎖反應改 wiki link 引 US-AR-007
- [[../13-user-stories/prepress-review/US-AR-010-B2C會員補件流程]]：「我希望」縮 53 → 22 字、補跨系統介面契約 EC↔ERP / 歷史輪次清單細粒度 / 原審稿員不在崗主管覆寫 / 狀態轉移 ActivityLog、role 純文字標記符合 AR-1 拍板（Lint 例外）
- [[../13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件]]：「我希望」縮 52 → 24 字、「作為」改業務（雙視角共識）、補根因判定者與實體機制（引 OQ AR-12）、與 US-AR-009 / 010 業務本質差異說明（跨階段重新進入審稿 vs 同週期補件）

2 新 OQ：
- [[../08-open-questions/AR-11-補件停滯處理機制與輪次上限]]（priority medium，跨 US-AR-009 / 010；合併輪次上限 / 停滯 SLA / 棄單處理三個共通痛點）
- [[../08-open-questions/AR-12-打樣後新稿件實體機制與根因判定]]（priority high，spec 級設計議題；新印件 vs 新審稿輪次 + 根因判定者）

**驗收結果**（批 3 三張卡）：
- 英文欄位名 grep / UI 措辭 grep / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」字數：US-AR-009 23 字、US-AR-010 23 字、US-AR-011 30 字（全 ≤ 30 字 PASS）
- acceptance criteria：009 5 條 / 010 5 條 / 011 4 條（全 PASS）

**備註**：
- AR-12 揭露 spec 級設計議題（合格終態 vs 新審稿輪次的實體機制選擇），涉及資料模型，priority high
- US-AR-011 「作為」從審稿員改為業務，雙視角共識；觸發點與承接者角色不同的典型案例（紀律演化候選）
- 累積 open OQ 達 8 個（AR-5/6/7/8/9/10/11/12），距 batch 4 anchor 校對僅 1 張卡，仍繼續執行
- 已校對 v2 卡累計 10 張，剩餘 1 張：US-AR-001（anchor）

## [2026-05-21 20:00] structural-change | user story 批 2 校對（US-AR-003 / 004 / 008 v2）

**輸入 / 觸發**：Plan Part 2 批次 2 執行（審稿主管系列）

**輸出 / 異動**：

3 張 user-story 卡 v2：
- [[../13-user-stories/prepress-review/US-AR-003-維護審稿人員能力等級]]：對齊 spec § 審稿人員能力欄位 L22-26 四要素 ActivityLog（時間 / 操作者 / 舊值 / 新值）、成功條件 1 補「必填」、business-logic 補難易度機制
- [[../13-user-stories/prepress-review/US-AR-004-覆寫印件分派]]：「我希望」縮 31 → 17 字、補批次選取、補離職員工阻擋、補活動紀錄 wiki link、識別 spec 內部不一致（自動破例 vs 覆寫拒絕）
- [[../13-user-stories/prepress-review/US-AR-008-追蹤部門審稿完成紀錄]]：成功條件 1 拆三條、補對帳明細具體欄位 + Summary Bar 聚合（spec L545-549 + L654）、補 ReviewRound 活動紀錄、「以便」量化「5 分鐘內調出印件」

2 新 OQ：
- [[../08-open-questions/AR-9-新審稿員建立時能力等級初值]]（priority medium）
- [[../08-open-questions/AR-10-主管覆寫分派是否允許破例派工]]（priority high，spec 內部不一致）

**驗收結果**（批 2 三張卡）：
- 英文欄位名 grep / UI 措辭 grep / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」字數：US-AR-003 19 字、US-AR-004 17 字、US-AR-008 24 字（全 ≤ 30 字 PASS）
- acceptance criteria：003 3 條 / 004 4 條 / 008 5 條（全 PASS）

**備註**：
- AR-10 揭露 spec L77-86 與 L102-108 內部不一致（自動破例派工 vs 覆寫拒絕能力不足者），屬 spec 級設計矛盾需業務拍板
- 累積 open OQ 達 6 個（AR-5/6/7/8/9/10），觸發 plan Part 2 Risk 9「≥ 5 OQ 暫停」閾值；commit 後給 Miles 整批報告，等決定是否繼續批 3 / 4
- 已校對 v2 卡累計 7 張：US-AR-002 / 003 / 004 / 005 / 006 / 007 / 008；剩 4 張：US-AR-001（anchor）/ 009 / 010 / 011（補件迴圈與跨模組）

## [2026-05-21 19:00] structural-change | user story 批 1 校對（US-AR-002 / 005 / 006 v2）

**輸入 / 觸發**：Plan Part 2 批次 1 執行（US-AR-007 v2 pilot of pilot 通過後擴大）

**輸出 / 異動**：

3 張 user-story 卡 v2：
- [[../13-user-stories/prepress-review/US-AR-002-設定印件難易度與免審稿]]：補 4 條 high gap（必填驗證 / 成交後不可修改 / 免審稿下游連鎖 / 以便邊界）+ frontmatter related-business-logic
- [[../13-user-stories/prepress-review/US-AR-005-監控當日審稿工作量]]：補 3 高 gap（3 指標計算口徑 / 4 格 vs 3 格邊界釐清 / drill-down 路徑）+ 2 medium 業務化（移除 UI 規格混入）；「我希望」縮為 25 字
- [[../13-user-stories/prepress-review/US-AR-006-比對審稿人員績效]]：「我希望」縮 32 → 25 字 / 移除「≥ 2 位審稿員」前置誤植 / 成功條件 1 拆三條 / 補「低樣本不標異常」spec L632 核心設計 / 補次排序「件數降冪」+ 平均處理時間「含排隊時間僅作參考」

3 新 OQ：
- [[../08-open-questions/AR-6-退件率分母是否排除技術退件]]（priority medium，跨 005/006/007）
- [[../08-open-questions/AR-7-審稿主管監控異常閾值定義]]（priority low，跨 005/006）
- [[../08-open-questions/AR-8-免審稿適用條件與核可機制]]（priority medium，跨 002）

**驗收結果**（批 1 三張卡）：
- 英文欄位名 grep / UI 措辭 grep / frontmatter 必填 / source 防自迭代 全 PASS
- 「我希望」字數：US-AR-002 29 字、US-AR-005 25 字、US-AR-006 25 字（全 ≤ 30 字 PASS）
- acceptance criteria：002 4 條 / 005 4 條 / 006 5 條（全 PASS）

**備註**：
- 雙 agent 平行審查 6 calls 共識率高（同題目雙視角獨立得出相近 gap，如「以便」量化、「低樣本不標異常」），驗證雙視角審查模式對 user story 校對有效
- 衍生 OQ 跨多張 user-story 共用（AR-6 跨 005/006/007 三張、AR-7 跨 005/006 兩張），代表後續 user story 校對品質會因 OQ 解答而連動提升
- 下批：US-AR-003 / 004 / 008（審稿主管系列）

## [2026-05-22 11:00] vault-audit | focus（4 維度） | add-payment-status-and-decouple-oa-execution change archive 前驗證

**模式**：focus（4 維度），focus 在本 change 影響的 4 個 Vault 卡 + 3 個新 OQ。其他 6 個維度（過時 / 孤立 / 缺連結 / 數據缺口 / 角色 alignment / KPI 對照）非本 change 影響範圍、保留待後續全量 audit。

**結果**：
- 維度 1 矛盾：OK ✓（訂單.md 與付款發票邏輯.md 對 paymentStatus / OA 已執行推進條件描述一致；既有 refine-after-sales-refund 與本 change 兩處引用共存無矛盾）
- 維度 6 規則：OK ✓（3 個新 OQ 命名符合 `ORD-NNN-<簡述>.md` 格式；無 inline `[!question]` 或「待補」措辭）
- 維度 7 對齊：OK ✓（spec change 名在 Vault 4 處引用：訂單.md / 付款發票邏輯.md / ORD-003 / ORD-004）
- 維度 8 OQ 健康度：OK ✓（3 個新 OQ frontmatter 完整：oq-id / status / priority / raised-at / source-link / expected-resolution-at 全有）

**主要發現**：
- 本 change 的 7 個 Vault 變動（4 既有卡 modify + 3 新 OQ）全部符合既有 wiki-schema 規約
- spec ↔ Vault 雙向引用完整（spec 引用 Vault 卡作為背景；Vault 卡引用 spec 為實作位置 + 標註 change 來源）
- 3 個新 OQ 的 raised-at 均為 2026-05-21（本 change 提案日），priority 均 medium，expected-resolution-at 均 2026-Q3，集中分佈合理

**下一步建議**：
- 本 audit focus 通過 → 可進入 `/opsx:archive` 階段
- 後續建議跑全量 vault-audit（10 維度）整體健康檢查；本次未涵蓋的維度 2 / 3 / 4 / 5 / 9 / 10 留下次

## [2026-05-21 21:00] skill-revision | Phase 3：vault-audit 維度 11/12 + vault-insight 加 raw 素材

**輸入 / 觸發**：Miles 選下一步 B（直接進 Phase 3）

**輸出 / 異動**：
- `.claude/skills/vault-audit/SKILL.md`：
  - description 更新「10 維度 → 12 維度」「Karpathy 6 + Sens 4 → Karpathy 6 + Sens 6」
  - 觸發時機加 5 / 6（raw 累積 ≥ 10 自動建議 / 本月 daily 缺 ≥ 工作日 50% 自動建議）
  - § 三新增維度 11「Raw 健康度」（status=raw > 90/180 天 / reviewed 超期 / 同主題累積 ≥ 3 / claude-research 或 miles-upload 缺 raw-source-link / miles-upload 缺 attached-files；含 Bash）
  - § 三新增維度 12「Review 規律性」（本月 daily < 工作日 × 50% / 本月無 weekly / 本週 daily 缺 ≥ 2 / 上週無 weekly；含 Bash）
- `.claude/skills/vault-insight/SKILL.md`：
  - 強制規則加第 5 條「禁讀 status=raw 的 raw 卡」（對應 vault-ingest 防線 4）
  - Step 2「讀目標素材」表格加 raw row 與「raw 累積（vault-audit 維度 11 觸發）」row + Bash 過濾範例
  - Step 3 跨主題模式識別新增「3.6 Raw 跨主題累積」段
  - Step 4 insight 卡 frontmatter 加 `related-raw` 欄位
- `00-meta/wiki-schema.md`：type=insight frontmatter 加 `related-raw` 欄位（明示 MUST 是 status=ingested 或 reviewed 的 raw 卡）

**備註**：
- 完成 vault-ingest skill 文件中第二階段預告的「vault-audit 維度 11 / 12 + vault-insight 加 raw 為素材」
- vault-audit 從 10 → **12 維度**；vault-insight 強制規則從 4 → **5 條**
- 完整實作 Anti-Model-Collapse 防線 4：vault-insight 與 raw 整合但過濾 status=raw

## [2026-05-22 13:00] audit | 全量 | 12 維度（含新增 11 / 12 首次跑）

**模式**：全量（含 Phase 3 新加維度 11 / 12 首次運作驗證）

**觸發**：Miles 選 A — 驗證 vault-audit 維度 11 / 12 能正常運作 + dogfood 本日大量異動後的 vault 健康狀態

**結果**：

- 維度 1 矛盾：OK ✓（核心概念分布抽樣：齊套 35 卡 / QC 47 卡 / 印件 86 卡 / 工單 72 卡 / 審稿 70 卡；無明顯矛盾）
- 維度 2 過時宣稱：OK ✓（0 卡 last-reviewed > 90 天 + status: active）
- 維度 3 孤立頁面：（沿用 5/20 audit 結果 Warning，本次 obsidian CLI 需 app 開啟未詳跑；7 個真 orphan）
- 維度 4 缺失連結：（沿用 5/20 audit 結果 OK，過濾 vault 外引用後 0 dangling）
- 維度 5 數據缺口：OK ✓（entity 卡與 OQ 卡必填欄位齊全）
- 維度 6 規則遵守：OK ✓（grep 0 個 inline [!question] callout / 0 個「待補 / 待釐清」措辭，僅 audit-log + wiki-schema 等元數據檔提及這些字串屬合法引用）
- 維度 7 Vault ↔ OpenSpec 對齊：OK ✓（過濾 schema 範例佔位符 + change archive 目錄引用後 0 broken）
- 維度 8 OQ 健康度：**Warning**（46 status=open；缺 expected-resolution-at 8+ OQ — 8 個 AR-5/6/7/8/9/10/11/12 + 既有 ORD-001/PI-001/002/PT-001/002/SHP-005/XM-002/003 部分仍未補；缺 source-link 2 個 AFT-1/AFT-2 為命名遷移殘留）
- 維度 9 角色 alignment：**Warning**（持平，_alignment-report 仍有 OpenSpec 缺漏角色未補建）
- 維度 10 KPI / Phase：**Warning**（持平，01-products/erp/kpi/ 目錄仍只有 README placeholder，未建 KPI 卡）
- **維度 11 Raw 健康度（新，首次跑）**：OK ✓（raw/ 0 張 status=raw / reviewed / ingested 卡；本週剛建尚無實際素材，無 source 違反、無同主題累積）
- **維度 12 Review 規律性（新，首次跑）**：OK ✓（本月 daily 1 張 + weekly 1 張；首日上線狀態屬「第一次月份不適用」依 SKILL.md 預定義為 OK）

**整體狀態**：**Warning**（8 OK / 4 Warning / 0 Error）

**主要發現**：
1. **新加維度 11 / 12 首次跑 Bash 正常運作**，邏輯判定正確（無 raw 卡 → OK；首日上線不適用 → OK）— Phase 3 驗證通過
2. **維度 8 OQ 健康度從 Warning（9 缺 ETA）升至 Warning（17+ 缺 ETA）**：本日新增 9 個 AR / ORD 系列 OQ 部分缺 expected-resolution-at；屬本日積壓非 vault-audit 維度設計缺陷
3. 維度 9 / 10 持平於 5/20 audit 結果（角色 alignment / KPI 卡未建）— 屬本週前已記錄治理債，非新議題
4. 本日 24 個 commit + 8 個 change archive 後 vault 健康度仍維持「Warning 而非 Error」，代表演化壓力下治理層保持穩定

**下一步建議**：
- 持續補 OQ expected-resolution-at（含本日新增 9 個 AR / ORD 系列）— 對應 [[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]] Action 3
- 維度 3 / 4 待 obsidian CLI 配合 app 開啟時補測
- 維度 11 / 12 待實際有 raw 卡與多週 daily 累積後再次驗證閾值合理性
- 維度 9 / 10 屬長期治理債，不急但需排入後續計畫（非本週重點）

## [2026-05-22 18:00] structural-change | 紀律演化「禁 anchor 故事 + prerequisites 欄位」+ 拆 3 卡

**輸入 / 觸發**：Miles 反饋「US-AR-001 anchor 違反 user story 獨立性原則（INVEST Independent），不應存在統合所有 story 的卡」

**紀律演化（user-story-spec § 五 + wiki-schema § type=user-story + 13-user-stories/README § 二之二）**：
- 移除「Anchor 故事例外條款」（2026-05-21 增加的折衷規約）
- 新增「禁 anchor 故事」紀律：跨多角色 / 多動作的端到端流程 MUST 由 07-scenarios 處理（範圍 2026-05-22 擴展為「跨模組或跨角色」）
- 新增 frontmatter `prerequisites` 欄位：記錄 user story 間「A 完成才能 B」相依性，禁用 anchor 故事代替表達

**3 張卡處理**：
- [[../13-user-stories/prepress-review/US-AR-001-審核稿件]] **已刪除**；內容移至 [[../07-scenarios/README#情境 14：審稿流程端到端（單模組跨角色）]]
- [[../13-user-stories/consultation-request/US-CR-001-諮詢單自動建立]] 重寫為「業務查看並指派新諮詢單」（業務動作）；webhook 自動建單機制移至 prerequisites
- [[../13-user-stories/order-management/US-ORD-011-訂單取消與退款]] 重寫為「業務取消訂單與退款申請」（業務動作）；會計動作拆出
- **新增** [[../13-user-stories/order-management/US-ORD-013-會計執行退款處理]]（會計動作；用 prerequisites 連結至 US-ORD-011）

**07-scenarios/README 範圍擴展**：新增情境 14「審稿流程端到端（單模組跨角色）」；註明 07-scenarios 2026-05-22 範圍擴展為「跨模組或跨角色的端到端流程」（不再限於跨模組）

**引用清理**：US-AR-002 / US-AR-011 既有 wiki link 引 US-AR-001 改為引 07-scenarios 情境 14

**驗收結果**（修改的 5 張卡 + 1 張新增）：
- 英文欄位 / UI 措辭 / frontmatter / source / 我希望 ≤ 30 字 / AC 2-5 條 全 PASS
- US-AR-001 已刪除（os.path.exists = False）

**待補**：
- 07-scenarios 情境 15「諮詢單自動建立 webhook 串接」（US-CR-001 對應跨角色情境）
- 07-scenarios 情境 16「訂單取消與退款端到端」（US-ORD-011 + US-ORD-013 對應跨角色情境）
- 既有 42 張 v2 卡的 prerequisites 欄位補入（量大；建議下次修改時逐張補，不回頭批量補）

**備註**：
- Miles 的反饋對齊 INVEST Independent 原則，糾正 senior-pm 之前建議的「Anchor 例外條款」折衷錯誤
- 紀律演化軌跡：anchor 例外（2026-05-21）→ 全面禁止（2026-05-22）
- 累計 user story v2/v3 數量：42 → 41（US-AR-001 刪除 - 1）+ 1（US-ORD-013 新增）= **42 張**

## [2026-05-22 19:00] structural-change | 補 07-scenarios 情境 15 / 16 + 批次補 39 張卡 prerequisites

**輸入 / 觸發**：Miles 指示「依建議先做 1/2」（補 07-scenarios 情境 15/16 + 補 42 張卡 prerequisites）

**輸出 / 異動**：

07-scenarios/README 新增 2 情境：
- 情境 15「諮詢單自動建立 webhook 串接（跨系統跨角色）」：涵蓋客戶 / 金流平台 / ERP webhook / 業務 / 諮詢人員 5 角色端到端；對應 [[../13-user-stories/consultation-request/US-CR-001-諮詢單自動建立|US-CR-001]] prerequisites 的跨系統情境
- 情境 16「訂單取消與退款端到端（跨角色多模組連鎖）」：涵蓋業務 / 系統 / 會計 3 角色 + top-down 連鎖；對應 [[../13-user-stories/order-management/US-ORD-011-訂單取消與退款|US-ORD-011]] + [[../13-user-stories/order-management/US-ORD-013-會計執行退款處理|US-ORD-013]] 拆分後的端到端情境

39 張既有卡批次補 prerequisites（已有 3 張：US-CR-001 / US-ORD-011 / US-ORD-013）：
- 審稿模組 10 張（US-AR-002 ~ 011）
- 諮詢單模組 5 張（US-CR-002 ~ 006）
- 需求單模組 13 張（US-QR-001 ~ 013）
- 訂單模組 11 張（US-ORD-001 ~ 010 + 012，含 US-ORD-009）
- Python 腳本批次處理（每張卡依預先設計的 mapping 補 1-3 條 prerequisites）

US-CR-001 / US-ORD-011 / US-ORD-013 卡內 related-scenarios 引用更新：從 placeholder「待補」改為已存在的情境 15 / 16 wiki link

**驗收結果**：
- 42 張卡全 PASS（frontmatter 必填齊 + 全部已有 prerequisites 欄位）
- 0 張卡破壞既有結構

**累計狀態**：
- 42 張 user story v2/v3，全部含 prerequisites 欄位
- 16 個 07-scenarios 情境（原 13 + 新增情境 14/15/16）
- 9 個 open OQ（待 Miles 開新對話處理）

**備註**：
- prerequisites 欄位讓 user story 間的相依性可辨識，不再依賴 anchor 故事的「業務流程段」串接
- 07-scenarios 範圍擴展為「跨模組或跨角色的端到端流程」（不再限跨模組），新增情境 14/15/16 屬此擴展用途

## 三、相關卡

- [[../00-meta/wiki-schema|Wiki Schema]] — Vault 治理規則
- [[../00-meta/scope-boundary|Scope Boundary]] — Vault 收 / 不收
- [[../12-insights/README|12-insights 總覽]] — insight 清單
- `.claude/skills/vault-audit/SKILL.md` — audit skill
- `.claude/skills/vault-insight/SKILL.md` — insight skill
