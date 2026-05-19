---
type: meta
status: active
last-reviewed: 2026-05-19
last-case-added: 2026-05-19
---

# 背景載入規則 + 設計理解摘要 + 防誤審記錄

> 三視角審查 Agent 必讀。本卡集中三件事：(1) 每個 agent 該載入什麼背景、(2) 開始審查前的設計理解摘要要求、(3) 過去誤審案例庫。

## 一、各 Agent 背景載入範圍

每個 agent 只載入與其視角直接相關的資源，**MUST NOT** 重複載入其他 agent 已覆蓋的範圍。跨視角的關聯問題透過 [[multi-agent-discussion-protocol]] § Round 2「跨視角質疑」步驟顯式提出。

| Agent | 載入範圍 | 不需主動載入 |
|-------|---------|------------|
| [senior-pm](../../../../../.claude/agents/senior-pm.md) | 產品目標、User Story、使用者情境（角色權責）、Notion KPI DB | 狀態機細節、技術流程 |
| [ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md) | BRD 本體、KPI DB、商業流程（高層摘要） | User Story 細節、狀態機 |
| [erp-consultant](../../../../../.claude/agents/erp-consultant.md) | 狀態機（上層 + 下層）、商業流程（完整）、資料模型實體 | 產品目標、User Story DB |
| 全部 | `_shared/` 全部 5 卡（含本卡 + [[prototype-stage-context]]、[[language-conventions]]、[[insight-discipline]]、[[cross-agent-checklist]]）| — |

## 二、設計理解摘要（防誤審強制步驟）

開始審查前，**MUST** 在輸出開頭以「**設計理解摘要**」段落（3-5 句）總結對待審查 spec / 待規劃需求的理解：

| 必填項 | 說明 |
|--------|------|
| 解決什麼問題 | 商業問題 / 系統問題 / 使用者問題 |
| 核心機制 | 資料流、狀態流、關鍵實體 + 關聯 |
| 與既有系統整合點 | 依賴哪些其他模組 / change |

**若對任何核心機制不確定**，**MUST** 直接在摘要中標記：

```
不確定 X，假設 Y
```

**不允許跳過此步驟直接審查**。

## 三、防誤審記錄（持續累積）

### 2026-04-XX「Payment 跨訂單轉移」誤審

- **誤審 agent**：ceo-reviewer / erp-consultant
- **誤審內容**：把 spec「Payment 跨訂單轉移」誤讀為「OrderAdjustment 抵扣」，挑出「三方對帳破洞」
- **實際 spec 設計**：不存在該問題（Payment 是直接轉移，不涉及抵扣機制）
- **教訓**：
  1. 基於 spec 文字快速掃讀就斷言商業 / 技術風險 → 在用戶端造成額外確認成本
  2. **規則**：開始審查前 **MUST** 寫設計理解摘要；若不確定機制，**MUST** 在摘要中以「不確定 X，假設 Y」標記
  3. **適用 agent**：所有三個 agent

### 2026-05-08「期次待收金額」與「watchlist」命名誤審

- **誤審 agent**：erp-consultant
- **詳見**：[[erp-naming-misjudgements]]（ERP 顧問專屬，因涉及 5 秒測試規則）
- **本卡只記跨 agent 通用教訓**：英文 ERP 術語 / 學術名稱衝突推論在 Miles 直接溝通時失敗

### 2026-05-19「我的售後服務」列表頁版型範式誤審

- **誤審 agent**：senior-pm（前期介入時未指出 layout 應對照 DESIGN.md § 6.1）/ erp-consultant（設計審查時未掃 DESIGN.md § 6.1 清單）
- **誤審內容**：
  - explore 階段 Miles 說「layout 可以用需求單詳情頁的形式即可」
  - design D1 直接決議「依 next action 分組」而非「依 status 排序」
  - spec 寫「依 next action 分組的 ticket 列表」
  - prototype 實作為「分組 + 卡片」（`MyAfterSalesActionCard.tsx`，div / button 結構），沒用 ErpTableCard + table + ErpPagination 標準三件套
- **實際情況**：
  Miles 原話反饋：「我的售後服務 layout 介面不太對，正確要用 table 呈現，目前不是統一的 table 樣式」「找出為什麼會跑偏，有不清楚可以問我，確保後續產出 UI / UX 一致」。違反 DESIGN.md § 6.1 第 42 條「列表頁採『搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁』模式，不得按狀態拆多張表」+「列表頁狀態主篩 MUST 用 select，MUST NOT 用卡片或 Tab 分組呈現資料」。Miles「layout 用詳情頁形式」指的是容器版型（AppLayout + 標題 + breadcrumb + spacing），不是內部資料呈現方式
- **教訓**：
  1. 列表頁的「容器版型」可參考其他頁，但「資料呈現範式」必須先對照 DESIGN.md § 6.1 列表頁規範清單，禁止憑直覺自由發揮
  2. 當 Miles 提到「layout 用 XX 形式」時，先釐清是指容器層（AppLayout / 標題 / breadcrumb / spacing / Card 間距）還是資料層（table / 卡片 / 分組 / 列表結構）。詳情頁可用卡片分組（§ 6.3 範式，QuoteDetailPage），列表頁禁止卡片分組（§ 6.1 第 42 條）
  3. 「業務優先級提示」「分組導航」這類 UX 需求在列表頁應該透過 table 欄位 / filter / sortable / status badge 解決，而不是把資料拆成多張卡片
  4. **規則**：規劃任何新列表頁時，erp-consultant agent MUST 先讀 DESIGN.md § 6.1 + 對照三個 canonical reference（QuoteListPage / OrderList / ConsultationRequestList），確認新頁的「資料層結構」是否對齊 ErpTableCard + table + ErpPagination 三件套，再展開設計
- **適用 agent**：senior-pm（前期介入）+ erp-consultant（設計審查）
- **相關 change**：[add-my-after-sales-action-page-and-remove-owner-transfer](../../../../../openspec/changes/archive/2026-05-19-add-my-after-sales-action-page-and-remove-owner-transfer/)（2026-05-19 歸檔 v0.2）；修正 change：refactor-my-after-sales-to-standard-list-pattern（後續開立）

## 四、新增誤審案例的流程

**MUST 觸發 `misjudgement-record` skill mode B**（不可手動寫入避免格式不一致）。skill 自動完成：

1. **分類**：依誤審類型自動歸位至三個目標卡之一（本卡 § 三 / [[erp-naming-misjudgements]] / [[ceo-review-pitfalls]]）
2. **去重**：搜尋既有案例，相似度高建議擴充而非新增
3. **四要素提取**：案例情境 / 誤審內容 / 實際情況（Miles 原話）/ 教訓
4. **強制規則**：教訓 MUST 用具體場景，MUST NOT 學術理由
5. **更新 frontmatter** `last-reviewed`

詳見 [`.claude/skills/misjudgement-record/SKILL.md`](../../../../../.claude/skills/misjudgement-record/SKILL.md)。

## 五、相關卡

- [[prototype-stage-context]] — 階段背景
- [[language-conventions]] — 用語規範
- [[insight-discipline]] — Insight 規範
- [[cross-agent-checklist]] — 跨 agent checklist
- [[multi-agent-discussion-protocol]] — 多 Agent 輪次討論協議
- [[erp-naming-misjudgements]] — ERP 顧問命名誤審記錄（專屬）
- [[ceo-review-pitfalls]] — CEO 審查誤區（專屬）
