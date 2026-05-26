---
type: insight
module:
  - cross-module
status: open
priority: high
raised-at: 2026-05-26
raised-by: vault-insight skill
triggered-by: change-archive（align-invoice-line-items-to-ezpay-spec）
related-vault:
  - "[[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]]"
related-oq:
  - ORD-018
  - ORD-019
  - ORD-020
related-raw:
  - "[[../raw/2026-05-26-miles-upload-ezpay-invoice-api-spec]]"
expected-action-at: 2026-06-15
---

# 2026-05-26：archive 工具假設與 Vault Schema 對齊缺口

## 背景

本次 `align-invoice-line-items-to-ezpay-spec` change archive 後執行 doc-audit 發現 CRITICAL：openspec CLI 的 `archive` 內建 sync **完全不處理 `## ADDED/MODIFIED Data Model` section**，導致 InvoiceItem 子結構表格 + PlannedInvoice 完整表格 + Invoice.items 欄位描述全部漏合進 main spec。

這不是孤例。最近 3 個 archive 事件均揭示「**openspec CLI 工具的隱性假設 ≠ 我們 spec schema 的實際約定**」：

1. 2026-05-25 `complete-payment-status-ui-and-followups` archive：tasks.md 未全勾、e2e 全部未跑、archive 仍正常完成 → 漏實作核心 user story
2. 2026-05-25 同事件：OQ id 撞號（ORD-018 被兩個無關主題共用） → OQ id 衝突檢測缺
3. **2026-05-26 本次**：`## ADDED Data Model` section 漏合 + 跨 change 同期 archive 對同一實體（PlannedInvoice）有 camelCase vs snake_case 多版本描述衝突

每次都「archive 後才用 doc-audit 抓出問題回頭修」— 屬於 reactive 補救而非 proactive hard gate。

## 觀察

具體事實清單：

1. **本次 align-invoice-line-items-to-ezpay-spec archive 漏合**（doc-audit v1.4 新採納維度）
   - delta `specs/order-management/spec.md` 內含 `## ADDED Data Model` 兩個 entity + `## MODIFIED Data Model` 一個欄位變更
   - `openspec archive` CLI 完成後報「+ 2 added ~ 1 modified」**只計 Requirements，未提 Data Model**
   - main spec § Data Model 內 Invoice.items 仍是 JSON、無 InvoiceItem 子結構、無 PlannedInvoice 表格
   - 已於 commit `a5bfee5` 手動修補 + doc-audit v1.4 採納 source: openspec/specs/order-management/spec.md

2. **跨 change 同期 archive 對同一實體 PlannedInvoice 描述衝突**（同日兩 change）
   - `refine-consultation-cancellation-and-invoice-flow`（先 archive，2026-05-26）：在「諮詢訂單收尾自動建 PlannedInvoice 規則」Requirement 內以 camelCase + 9 欄簡述 PlannedInvoice 實體
   - `align-invoice-line-items-to-ezpay-spec`（後 archive，2026-05-26）：在 `## ADDED Data Model` 以 snake_case + 12 欄（含 items[]）完整定義 PlannedInvoice
   - 命名風格不一致（camelCase vs snake_case）+ 欄位完整度不一致（9 欄 vs 12 欄）
   - 兩處同時存在於 main spec、無 cross-link、需後續整併
   - 已於 commit `a5bfee5` 整併（L1771 改為 cross-link 至 § Data Model）

3. **2026-05-26 audit-log「complete-payment-status-ui-and-followups 治理收尾」事件揭示 archive 缺乏 hard gate**
   - 引用：「archive 時的『tasks.md 全部勾選』應為 hard gate；本次跳過導致 1 個 BREAKING change 翻轉後 stale 測試與漏實作項目」
   - 引用：「e2e 失敗應為 archive 阻擋條件；本次 archive 時 tasks.md § 10 全部未勾選、e2e 14 條未跑、archive 仍完成」
   - 引用：「OQ 撞號（ORD-018）反映 OQ 命名前綴自動化不足」
   - source: [[../00-meta/audit-log#2026-05-26-18-00-event-complete-payment-status-ui-and-followups-治理收尾]]

4. **既有 insight [[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]] 已指出類似議題**
   - 該 insight 觀察：archive 流程沒檢查「OQ 是否已 resolve / archive」
   - 同樣是「archive 工具假設與 Vault schema 約定不對齊」根因
   - status 仍 open（未 resolve）

5. **首張「外部硬約束 raw」屬性與一般 raw 不同**（次要觀察）
   - 本次 [[../raw/2026-05-26-miles-upload-ezpay-invoice-api-spec]] 為「法規 + 第三方 API 雙重硬約束」屬性
   - 與一般 raw（claude-research / prototype-dogfood / miles-dialogue）的「可協商 / 可演化」性質根本不同
   - 目前 wiki-schema 無 `binding-type` 區分（待累積 ≥ 2 張同屬性才升級為 schema 變更）

## 推論

**根因**：openspec CLI 工具的內建 sync 機制是針對「**Requirements-as-contract**」設計，與我們實際使用的 schema（**Requirements + Data Model + 其他子段都是 contract**）有結構性 mismatch。每次 archive 都依賴 doc-audit 後補才能發現缺口，屬於 reactive 補救。

**模式**：「archive 工具假設 ≠ Vault schema 約定」是個系統性議題，不是個別事件：

| 假設斷裂層 | openspec CLI 假設 | 實際約定 |
|----------|------------------|---------|
| 結構層 | 只有 Requirements 是 contract | Requirements + Data Model + （未來會出現）Scenarios cross-link / 角色 / 計算公式 等也是 contract |
| 流程層 | archive 不檢查 tasks.md / e2e / OQ resolve | 我們約定這些是 archive 前置條件（雖 CLI 不擋） |
| 識別層 | OQ id 假設業務自管不撞號 | 缺自動衝突檢測 |
| 跨 change 層 | 兩個 delta 各自 sync，不檢查同實體 / 同 Requirement 重疊 | 兩個 change 同期 archive 對同實體可能多版本描述 |

**痛點**：reactive 修補成本累積 — 每次 doc-audit 後手動修補需要 30-60 分鐘 + 整併工作；長期持續會累積技術債。

## 下一步建議

每條 action 含負責人 + 時程 + 預期結果 + 驗證方式。

### Action 1：建立 archive 前 hard gate 自查清單（短期，立即可做）

- **負責人**：Miles（拍板）+ Claude（執行於 opsx:archive skill）
- **時程**：下次 archive（≤ 1 週）前完成 skill 更新
- **做什麼**：在 `.claude/skills/openspec-archive-change/SKILL.md` 加入「archive 前 hard gate 5 項自查」：
  1. tasks.md 是否全部勾選？未勾項是否有明確 reason 標注？
  2. e2e（若該 change 改 Prototype）是否已通過？
  3. delta 內 `## ADDED/MODIFIED Data Model` section 是否手動驗證合入主 spec？
  4. 同期 archive 的其他 change 是否對同實體有重疊？若有，整併規則？
  5. OQ id 衝突檢測（如 ORD-XXX 是否已被使用）？
- **預期結果**：archive 流程主動阻擋 / 警告，不再依賴 archive 後 doc-audit 後補
- **驗證**：下次 archive 跑此清單、發現至少 1 個 mismatch 並 fixed

### Action 2：openspec CLI 漏合 Data Model 工程議題分流（中期）

- **負責人**：Claude 與 Miles 討論決策方向
- **時程**：≤ 4 週
- **做什麼**：以下三選一：
  - (a) 給 openspec CLI repo 發 issue / PR（外部依賴，較難）
  - (b) 自製 archive 補強腳本 `.claude/skills/openspec-archive-change/scripts/sync-data-model.sh` 處理 ADDED/MODIFIED Data Model 自動合入
  - (c) 改 spec schema：將 Data Model 內容拆為獨立 Requirement（如「Requirement: InvoiceItem 實體欄位定義」），讓 openspec sync 認得
- **預期結果**：擇一執行後，archive 不再漏合 Data Model
- **驗證**：人為製造一個含 ADDED Data Model 的 test change，跑 archive 驗證合入是否完整

### Action 3：[[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]] insight resolve 路徑

- **負責人**：Miles
- **時程**：與 Action 1 合併處理（同次 skill 更新）
- **做什麼**：將 Action 1「archive 前 hard gate 自查清單」內加入「OQ 是否已 resolve / archive」一項；標 2026-05-20 該 insight 為 resolved；更新 audit-log
- **預期結果**：兩個 insight 在同一次 skill 更新中一起解
- **驗證**：跑 vault-audit 檢查 12-insights/ open insight 數量 -1（從 3 降至 2）

### Action 4（已內化，無需追加）

doc-audit v1.4 已於本次 archive 修補 commit `a5bfee5` 採納「Data Model section sync」維度（本 insight Observation 1 對應的 reactive 防線）。Action 1-3 是 proactive 防線，與 v1.4 互補。

## 涉及

- [[../12-insights/2026-05-20-change-archive-OQ收尾流程缺口]]（同根因 insight）
- [[../00-meta/audit-log]]（2026-05-25 audit 與 2026-05-26 事件紀錄）
- [[../raw/2026-05-26-miles-upload-ezpay-invoice-api-spec]]（本次觸發 raw 卡）
- `.claude/skills/doc-audit/SKILL.md` v1.4（已修補 reactive 防線）
- `.claude/skills/openspec-archive-change/SKILL.md`（Action 1 修改目標）
- `openspec/specs/order-management/spec.md` § Data Model § InvoiceItem § PlannedInvoice（本次 commit `a5bfee5` 修補結果）
- OQ ORD-018 / ORD-019 / ORD-020（撞號 / 邏輯刪除 / 會計分支 — 同期 reactive 修補的另兩個治理債）

## 後續更新

<!-- status 變化時追加 -->
