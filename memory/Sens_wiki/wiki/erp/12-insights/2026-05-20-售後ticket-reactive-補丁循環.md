---
type: insight
module:
  - 售後服務
  - 訂單管理
  - 跨模組
status: open
priority: high
raised-at: 2026-05-20
raised-by: vault-insight skill
triggered-by: audit-接續 + change-archive（refine-after-sales-refund-and-add-supplementary-print + refine-supplementary-print-skip-review 連續歸檔）
related-vault:
  - "[[售後服務]]"
  - "[[訂單]]"
  - "[[印件]]"
related-oq:
  - AFT-1
  - AFT-2
  - AFT-3
  - AFT-4
  - AFT-5
  - XM-001
  - XM-004
  - XM-005
related-spec: openspec/specs/after-sales-ticket/spec.md
expected-action-at: 2026-06-15
---

# 2026-05-20：售後 ticket 模組的 reactive 補丁循環 — 需端到端推演

## 背景

vault-audit 接續觸發；OQ 累計 32 個（28 open + 4 answered）；售後 ticket 模組在 1.5 個月內連續 5 個 change 落地，每個 change 都浮現新 gap，呈現典型 reactive 補丁模式。senior-pm 在 refine-after-sales-refund-and-add-supplementary-print 前期介入時已預先標識此議題（[XM-004 OQ](XM-004-售後流程端到端推演.md)），本 insight 收斂為具體 action 計畫。

## 觀察

### 1. 售後 ticket 模組 5 個 change 演化軌跡

| 日期 | change | 觸發原因 | 浮現的新 gap |
|------|--------|---------|-------------|
| 2026-05-18 | `add-after-sales-ticket` v0.1 | 取代 OrderAdjustment(phase=after_completion) 雙重身份 | 業務 / 諮詢個人作業視圖缺 |
| 2026-05-19 | `add-my-after-sales-action-page-and-remove-owner-transfer` v0.2 | 補我的售後作業頁 | 列表頁版型不一致 |
| 2026-05-19 | `refactor-my-after-sales-to-standard-list-pattern` v0.3 | 列表頁對齊 QuoteListPage 範式 | OA 編輯閘門過嚴 / 退款流程斷裂 / 補印識別缺 |
| 2026-05-20 | `refine-after-sales-refund-and-add-supplementary-print` v0.4 | 三項 Miles 反饋（退款 / 已執行 / 補印） | 補印審稿應跳過（業務情境驗證） |
| 2026-05-20 | `refine-supplementary-print-skip-review` v0.5 | Miles 業務推演發現補印審稿違反業界實務 | （目前未浮現新 gap）|

5 個 change 連續歸檔，每個間隔 < 24 小時，每次都因「Miles 業務推演」浮現新 gap。

### 2. 售後相關 OQ 累計 11 個（占 28 open OQ 的 39%）

| OQ ID | 主題 | priority |
|-------|------|---------|
| [AFT-1](AFT-1-業務離職轉派.md) | 業務離職轉派 | — |
| [AFT-2](AFT-2-逾期分級.md) | 逾期分級 | — |
| [AFT-3](AFT-3-OA已核可改金額是否通知主管.md) | OA 已核可改金額通知 | low |
| [AFT-4](AFT-4-補印優先度規則.md) | 補印優先度 | medium |
| [AFT-5](AFT-5-補費OA由誰建立.md) | 補費 OA 由誰建 | medium |
| [XM-001](XM-001-款項管理頁面業務最重要決策.md) | 款項管理頁面決策 | — |
| [XM-004](XM-004-售後流程端到端推演.md) | 售後流程端到端推演（本 insight 直接前身）| medium |
| [XM-005](../08-open-questions/XM-005-Use-As-Is 退款流程串接.md) | Use-As-Is 退款流程 | **high** |

### 3. XM-004 OQ 自我預警

OQ 內 senior-pm 已具體指出：「連續四個 change 都在改 ticket 模組，且每次都暴露新的 gap，這暗示規劃時可能少了『ticket 內部端對端流程推演』這個步驟。」

### 4. 缺乏「業務 / 諮詢 / 印務 / 會計」跨角色端對端推演紀錄

Vault 內無「售後 ticket 完整流程跨角色推演」的文件（無對應 [[../07-scenarios/]] 卡）。每次 change 的 Scenario 只覆蓋本 change 範圍，未做整體 user journey 整合驗證。

## 推論

售後 ticket 模組進入「**Miles 推演 → 發現 gap → 開 change → archive → 推演 → 再發現 gap**」的補丁循環。根因有兩層：

**第一層（直接）**：每個 change 規劃時只覆蓋本次 Miles 提出的議題，未做「端到端流程整合驗證」。

**第二層（結構性）**：缺乏「售後 ticket 完整 user journey」基準文件（含所有角色、所有 resolution 分支、所有例外情境），導致每次都是「點狀補丁」非「整體理解」。

預計若不打破循環，未來會繼續浮現 gap（XM-001 款項管理頁面 / XM-005 Use-As-Is 退款流程 / AFT-2 逾期分級 / AFT-1 業務離職等都有跡象）。

## 下一步建議

> [!info] 2026-05-20 actions 調整（Miles 反饋）
> 原 Action 1「跨角色實體 workshop」移除（Sens 不採實體 workshop 模式）。本 insight 改以「PM + Claude 推演」+「整合 change propose」兩步推進，不依賴實體會議。

### Action 1：PM 桌面端到端推演 8 個售後情境（priority high）

- **負責人**：Miles（PM 主導）+ Claude（協助整理）
- **時程**：2026-05-26 前完成
- **方式**：PM 推演，不開實體會議
- **內容**：
  1. 走 8 個情境組合（resolution 4 種 × responsibility 3 種，篩選實際發生的 8 個）
  2. 每情境逐步追蹤：客戶反映 → 業務開單 → 決議 → 主管核可 → 執行 → 印件 / 退款 / 發票 → 結案 → 客戶確認
  3. 在每一步標明：操作角色、預期操作步數、卡點、跨角色銜接點、目前 spec / Prototype 是否支援
  4. 比對 5 個既有售後相關 archived change 是否完整覆蓋這 8 個情境
- **預期產出**：`07-scenarios/售後ticket-端到端流程.md` 基準文件
- **驗證**：產出後 XM-004 OQ 可標 in-progress

### Action 2：依推演結果一次性 propose 整合 change（priority high）

- **負責人**：Miles（PM）+ Claude（draft）
- **時程**：2026-06-03 ~ 2026-06-08
- **內容**：彙整推演發現的 gap，propose 整合 change `refine-after-sales-flow-end-to-end`
- **不在範圍**：個別小調整（UI 細節 / 措辭）
- **在範圍**：架構級議題（業務離職轉派替代方案 / 逾期分級 / Use-As-Is 退款 / 款項管理操作流程）
- **預期產出**：1 個 OpenSpec change（apply + archive），一次性 resolve AFT-1 / AFT-2 / XM-001 / XM-005 四個 OQ
- **驗證**：4 個 OQ status 從 open → answered

### Action 3：把 11 個售後相關 OQ 連結至本 insight（priority low，已完成）

- **負責人**：Claude
- **時程**：2026-05-20 已完成（本次 vault-insight 同 commit）
- **內容**：5 個 OQ 加 `related-insight: 2026-05-20-售後ticket-reactive-補丁循環` 至 frontmatter（AFT-1/2/3/4/5、XM-001、XM-005；AFT-6/7/8 已 answered 不需）
- **狀態**：completed

## 涉及

### Vault 卡
- [[售後服務]]
- [[訂單]]
- [[印件]]
- [[付款發票邏輯]]

### OQ
- [[AFT-1-業務離職轉派]]
- [[AFT-2-逾期分級]]
- [[AFT-3-OA已核可改金額是否通知主管]]
- [[AFT-4-補印優先度規則]]
- [[AFT-5-補費OA由誰建立]]
- [[XM-001-款項管理頁面業務最重要決策]]
- [[XM-004-售後流程端到端推演]]
- [[XM-005-Use-As-Is 退款流程串接]]

### Spec
- `openspec/specs/after-sales-ticket/spec.md`（v0.5）
- `openspec/specs/order-management/spec.md`（v1.5）

### Archive 路徑
- `openspec/changes/archive/2026-05-18-add-after-sales-ticket/`
- `openspec/changes/archive/2026-05-19-add-my-after-sales-action-page-and-remove-owner-transfer/`
- `openspec/changes/archive/2026-05-19-refactor-my-after-sales-to-standard-list-pattern/`
- `openspec/changes/archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/`
- `openspec/changes/archive/2026-05-20-refine-supplementary-print-skip-review/`

## 後續更新

（status 變化時追加）

- 2026-05-20：建卡 status = open
- 2026-05-20：Miles 反饋移除實體 workshop action（Sens 不採實體會議模式）；Action 1 改為「PM 推演」、原 4 actions 收斂為 3；Action 3（OQ backlink）完成
