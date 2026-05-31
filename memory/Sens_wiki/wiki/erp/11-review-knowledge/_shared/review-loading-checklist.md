---
type: meta
status: active
last-reviewed: 2026-05-29
last-case-added: 2026-05-29
---

# 背景載入規則 + 設計理解摘要 + 防誤審記錄

> 三視角審查 Agent 必讀。本卡集中三件事：(1) 每個 agent 該載入什麼背景、(2) 開始審查前的設計理解摘要要求、(3) 過去誤審案例庫。

## 一、各 Agent 背景載入範圍

每個 agent 只載入與其視角直接相關的資源，**MUST NOT** 重複載入其他 agent 已覆蓋的範圍。

**跨視角衝突依協議分流處理（2026-05-28 更新）**：
- 在 [[sequential-design-collaboration]] 中：由 Phase 4 PM verify consistency 集中處理（CEO 指標 ↔ 顧問實作對齊表、PM 範疇 ↔ 顧問實作對齊表）
- 在 [[multi-agent-discussion-protocol]] 中（過渡期保留，verify 前審查）：由 Round 2「跨視角質疑」步驟顯式提出

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

### 2026-05-21「frontmatter 缺 module」誤審

- **誤審 agent**：erp-consultant
- **誤審內容**：審查 US-AR-007 v1（pilot of pilot 雙視角審查 round 1）時，於「段 2 發現的具體 gap 清單」列 G4「frontmatter 缺 `module: [prepress-review]` 欄位」並建議補入
- **實際情況**：US-AR-007 v1 frontmatter 第 4-5 行已含 YAML list 形式的 `module:\n  - prepress-review`，是合法格式。agent 可能誤把 `module:` 與下一行縮排 `- prepress-review` 判讀為「key 存在但 value 空」，或掃過快漏看
- **教訓**：
  1. 審查 frontmatter 缺失項時 MUST 引用「具體鍵 + 期望值 + 實際值（含原始文字）」三項，不能只說「缺 X」
  2. YAML list 縮排形式（`key:\n  - value`）是合法值，不是「缺值」；agent 解讀 YAML 時 MUST 認知此形式
  3. 對 frontmatter 字段值的「缺 / 不缺」判定，MUST 先 grep / read 確認對應行內容再宣告
  4. **規則**：審查 frontmatter 必填項時，agent MUST 在報告引用「frontmatter Line N: `key: value`」形式，不能僅以「缺 X」一句帶過
- **適用 agent**：跨 agent 通用（任何審查 Vault 卡 frontmatter 的場景）
- **相關情境**：[[US-AR-007-執行印件審稿]] 雙視角審查（2026-05-21）

### 2026-05-29「諮詢取消退款 OA 可調誤綁人工核可」誤審

- **誤審 agent**：senior-pm（序列協作 Phase 1）
- **誤審內容**：釐清「諮詢取消退款 OA(-1000) 的金額彈性與審核路徑」時，假設「金額可調 → 必須綁人工主管核可」（否則業務可繞過核可隨意改退款金額、留沒人把關的洞），把「可調」與「人工事前核可」綁定成「成對二擇一」決策（B+B 可調+主管核可 / A+A 鎖死+系統自動）
- **實際情況**：既有規則「OrderAdjustment 已核可後修改不需重新送審」（order-management spec § 業務於已核可狀態調整金額 L1184-1191，refine-after-sales-refund 既有設計）——「核可」把關的是「建立時的金額」，「已核可後調整金額」是既有免重審能力（顯示「核可金額 vs 當前金額」對照 + audit log）。Miles 原話糾正：「之前說的訂單異動要審核，是『負項建立時要審核』，但『審核後的修改就不用審核』，訂單目前就是這個規則」+「調整訂單異動的金額時，主管不需要核可才對」。所以「可調」與「人工核可」本可解耦：諮詢取消 OA 系統建「已核可」（approved_by=system 免人工）即同時滿足「系統審核通過 + 可調」，根本不需引入人工核可關卡
- **教訓**：
  1. 設計 OrderAdjustment 審核流程 / 金額可調性時，agent MUST 先查「已核可後修改不需重審」既有規則（order-management § 業務於已核可狀態調整金額），不要憑直覺假設「金額可調必須綁人工事前核可」
  2. 「核可」把關的是「建立時的金額」；「已核可後調整」是既有免重審能力——兩者是不同關卡，把它們綁成同一決策（可調就要核可）是過度推論
  3. 對「系統內生 OA」（如諮詢取消半額退費），系統 approved_by=system 直接已核可即可同時達成「免人工 + 可調」，毋須引入人工核可
  4. **規則**：提「可調 → 需核可」這類綁定前，MUST 先確認既有狀態機是否已有「核可後可改」的免重審設計；把「事前核可」與「事後可調」當成互斥綁定，是漏查既有規則的過度推論
- **適用 agent**：跨 agent 通用（任何設計 OrderAdjustment / 審核流程 / 金額可調性的場景）
- **相關 change**：converge-consultation-cancel-to-order-cancel-flow（序列協作 Phase 1 + C-1 拍板）

## 四、change propose 前的端到端推演準則（vault-insight 2026-05-20 新增）

對應 [Vault Insight 2026-05-20 售後 ticket reactive 補丁循環](2026-05-20-售後ticket-reactive-補丁循環.md) 的教訓：售後 ticket 模組 1.5 個月內連續 5 個 change 都因「Miles 推演 → 發現新 gap」開單，根因是 propose 階段缺端到端 user journey 整合驗證。

### 4.1 何時須含端到端推演

change 涉及以下任一情境時，propose 階段 MUST 在 `## Why` 或 `## Background` 段附端到端推演紀錄連結：

| 觸發情境 | 範例 |
|---------|------|
| 涉及 ≥ 2 個角色銜接 | 業務 ↔ 主管 / 業務 ↔ 印務 / 業務 ↔ 會計 |
| 跨流程節點（≥ 2 個 entity 狀態機協作）| OA ↔ Payment / PrintItem ↔ WorkOrder ↔ ProductionTask |
| 售後 / 異動 / 退款 / 補印類型 ticket 流程 | AfterSalesTicket 模組任何 change |
| Phase 切換相關（北極星指標相關）| material-master / order-management 等核心模組 |

### 4.2 推演方式（推演，不採實體 workshop）

Sens 採 **PM 推演** 模式，**不安排跨角色實體 workshop**（2026-05-20 Miles 確認原則）：

| 角色 | 推演職責 |
|------|---------|
| Miles（PM）| 主導：依商業情境清單逐一推演、識別 gap、補 OQ、決定範疇 |
| Claude | 協助：依推演結果整理紀錄、產 07-scenarios 卡草稿、識別跨情境模式 |
| 業務 / 諮詢 / 印務 / 會計 | 不主動拉入 workshop；Miles 推演時若需確認某情境，透過個別非同步詢問（Slack / 對話）取得實務輸入 |

推演紀錄寫入 `07-scenarios/<情境名>.md`，內容含：

1. **情境定義**：客戶反映類型 + responsibility + resolution 組合
2. **逐步追蹤**：客戶反映 → 業務開單 → 決議 → 主管核可 → 執行 → 印件 / 退款 / 發票 → 結案 → 客戶確認
3. **跨角色銜接點**：每一步標明操作角色 + 預期操作步數 + 卡點 / 待釐清
4. **OQ 對應**：推演中發現的 gap 開 OQ 並反向連結

propose `## Why` 段 wiki link 引用 `[[../07-scenarios/<情境名>]]`。

### 4.3 推演 vs scenario spec 的區別

- **OpenSpec spec § Scenarios**：本 change 範圍內的 user story（單一 change 視角）
- **07-scenarios/ 卡**：跨 change 累積的端到端 user journey（多 change 連動視角，含未來 change 範圍）

推演紀錄 MUST 在 07-scenarios/ 卡（不限於本 change 範圍），spec § Scenarios 只覆蓋本 change 落實的部分。

### 4.4 例外（不需推演）

- 純措辭 / typo 修正
- 單一欄位異動（不影響跨角色 / 跨流程）
- Prototype 工程細節（如 e2e 測試、UI tweaks）

## 五、新增誤審案例的流程

**MUST 觸發 `misjudgement-record` skill mode B**（不可手動寫入避免格式不一致）。skill 自動完成：

1. **分類**：依誤審類型自動歸位至三個目標卡之一（本卡 § 三 / [[erp-naming-misjudgements]] / [[ceo-review-pitfalls]]）
2. **去重**：搜尋既有案例，相似度高建議擴充而非新增
3. **四要素提取**：案例情境 / 誤審內容 / 實際情況（Miles 原話）/ 教訓
4. **強制規則**：教訓 MUST 用具體場景，MUST NOT 學術理由
5. **更新 frontmatter** `last-reviewed`

詳見 [`.claude/skills/misjudgement-record/SKILL.md`](../../../../../.claude/skills/misjudgement-record/SKILL.md)。

## 六、相關卡

- [[prototype-stage-context]] — 階段背景
- [[language-conventions]] — 用語規範
- [[insight-discipline]] — Insight 規範
- [[cross-agent-checklist]] — 跨 agent checklist
- [[multi-agent-discussion-protocol]] — 多 Agent 輪次討論協議
- [[erp-naming-misjudgements]] — ERP 顧問命名誤審記錄（專屬）
- [[ceo-review-pitfalls]] — CEO 審查誤區（專屬）
