---
name: erp-planning-pre-check
description: >
  ERP 規劃前 know-how 稽核 skill。Claude 規劃 ERP 功能前 MUST 跑稽核識別缺漏 / 錯誤，修補既有卡（不新建抽象卡），避免重複問已答過的真實狀況、設計跑偏。
  正本框架：`memory/Sens_wiki/wiki/erp/00-meta/erp-planning-audit-framework.md`
  領域分類：`memory/Sens_wiki/wiki/erp/00-meta/business-domain-taxonomy.md`（6 領域 + 跨領域共用層）

  觸發時機：
    1. Miles 說「規劃 X 功能」「設計 Y」「修改 Z 邏輯」「我要規劃 ...」「我想做 ...」
    2. CLAUDE.md 路由偵測到「款項 / 發票 / 收款 / 對帳 / OA / 退款 / 補收」等觸發詞
    3. 規劃中 Claude 遇到「不知道」MUST 立即再跑（不能繞過去自編）
    4. OpenSpec change 工作流（`/opsx:propose` / `/opsx:new`）背景對齊階段

  範圍：**只處理 ERP_Vault know-how 稽核**。
  輸出：對話報告（量化矩陣）+ 追加 audit-log.md + 修補既有卡 + 缺漏項標 OQ。
  不適用：純查詢術語 / 狀態機（不涉及規劃）、Vault 整體健康稽核（用 vault-audit）。

  **執行者與稽核者分離**（受 YouTube /goal 影片啟發）：稽核 sub-agent 跑稽核，主對話 agent 跑修補；MUST NOT 同 agent 自審。
---

# erp-planning-pre-check

ERP 規劃前 know-how 稽核工具。**禁繞過稽核直接設計 / 禁新建抽象卡 / 禁跨領域全讀 / 禁稽核與修補同 agent**。

---

## 一、定位與範圍

**目標**：規劃 ERP 功能前主動稽核既有 Vault know-how 卡（按業務領域 × 卡類型雙軸），識別缺漏 / 錯誤並修補既有卡，避免重複問已答過的真實狀況、設計跑偏。

**對標**：
- YouTube /goal 影片：執行者稽核者分離 + 閉環化 + evaluation 讓 AI 不停下來
- Karpathy LLM Wiki Vault：raw 不可變 + 型態×模組二維 + LLM 入口頁

**範圍**：
- 只處理 ERP_Vault know-how 稽核（規劃前準備層）
- 不處理 Vault 整體健康稽核（屬 vault-audit）

**Anti-pattern**（**MUST NOT**）：
- 禁止「新建抽象卡」（如「業務一日時間軸」「商業模式畫布」等 — Miles 第四輪明確否決）
- 禁止「繞過稽核直接設計」（任何規劃 MUST 先跑此 skill）
- 禁止「跨領域全部讀」（用 business-domain 標籤精準載入）
- 禁止「自編內容當已答」（缺漏項 MUST 標 OQ 等 Miles 確認）
- 禁止「Claude 手動判斷該載哪個領域」（用觸發詞 → 領域 mapping 自動）
- 禁止「稽核 + 修補同 agent」（執行者與稽核者分離）
- 禁止「非量化結論」（如「大致 OK」「再看看」— 量化矩陣強制 N/M/K 三數字）
- 禁止「跳過 Step 5 閉環驗證」

---

## 二、5 步驟 SOP（雙軸 + 閉環）

### Step 1：識別本次涉及的業務領域

**做法**：
- 從 Miles 訊息中提取觸發詞
- 用觸發詞 → 領域 mapping 自動判斷（不需 Claude 手動選）
- 從 6 領域中選 1-2 個（跨領域亦可）

**觸發詞 → 領域 mapping**（依 [[../../memory/Sens_wiki/wiki/erp/00-meta/business-domain-taxonomy]] § 二）：

| 觸發詞 | 領域 |
|--------|------|
| 諮詢 / 報價 / 需求單 / 議價 / 諮詢費 / 成交 | L1.1 Pre-sales |
| 訂單 / 訂單異動 / OA / 訂單備註 / 訂單取消 | L1.2 Order Management |
| 審稿 / 打樣 / 稿件 / 印件規格 / 審稿輪次 / ReviewRound | L1.3 Prepress |
| 工單 / 任務 / 派工 / 排程 / QC / 品檢 / 補印 / 工序 / 入庫 / NCR / Disposition | L1.4 Production |
| 出貨 / 配送 / 售後 / 客訴 / ticket / 退貨 / 客戶不良 | L1.5 Fulfillment & After-sales |
| 款項 / 發票 / 收款 / 對帳 / OA / Payment / Invoice / PlannedInvoice / 退款 / 補收 / 折讓 / 期次 / 老化 / 應收 / 應付 / SalesAllowance / PaymentInvoice | L1.6 Billing & Cash |

**範例**：「補收 OA 執行條件」→ 含「補收」「OA」→ L1.6 Billing & Cash + L1.2 Order Management（跨領域）

### Step 2：載入該領域內卡 + 跨領域共用層

**做法**：
- 用 `grep -l "business-domain: <領域>"` 載入該領域卡
- **同時自動載入跨領域共用層**（不需 Claude 判斷）：03-roles + 02-domain + 07-scenarios + 06-state-machines + 01-products + Master Data

**跨領域共用層清單**（任何稽核 MUST 載入）：
- `03-roles/`（全部 16 角色）
- `02-domain/glossary-*.md`
- `07-scenarios/`（16 跨模組情境）
- `06-state-machines/`（9 狀態機）
- `01-products/`（vision / phases / kpi / impact-score）
- Master Data：`material-master` / `process-master` / `binding-master` / `equipment` spec
- 跨模組商業流程：`openspec/specs/business-processes/spec.md`

### Step 3：逐卡類型稽核（7 類）

依雙軸矩陣對該領域 × 7 卡類型逐格檢查：

| 卡類型 | 稽核問題 |
|-------|---------|
| 1. 角色 | 該領域涉及的角色職責 / 權限 / 工作流是否完整？|
| 2. 實體 | 該領域核心實體欄位 / 狀態 / 關聯是否完整？與 spec 對齊？|
| 3. 流程 | 端到端業務流程是否從頭到尾每一步都明示？|
| 4. 情境 | 真實業務情境是否覆蓋？情境變體 / 邊界 case 是否含？|
| 5. **User Story** | 業務動作完整？acceptance criteria 2-5 條？**`related-test-cases` 欄位齊備**？erp-user-story 紀律？|
| 6. 業務邏輯 | 跨模組規則 / 連帶矩陣 / 計算邏輯是否完整？|
| 7. 法規 | 外部硬約束（ezPay / MIG）是否獨立成卡？|

**產出量化矩陣**：每格列「已涵蓋 N / 待修補 M / OQ K」三個明確數字。

**跨 ≥2 領域 fan-out 選項（2026-05-30 新增，workflow 試點）**：當本次稽核涉及 **≥2 領域**時，MAY 觸發 `/erp-precheck-audit` workflow（腳本 `.claude/workflows/erp-precheck-audit.js`）將各領域平行 fan-out：
- 傳入 `args: { topic, domains }`（domains 依 Step 1 判定）。
- workflow 內每領域一個 **sonnet** 稽核 agent 跑 7 卡矩陣 + 對抗式互審（adversarial）找漏，回傳結構化「量化矩陣 + 待修補清單 + OQ 候選 + 連帶實體 + wiki 回補卡」。
- 主對話 agent 拿 workflow 結果跑 **Step 4 修補**（執行者 / 稽核者分離不變：workflow 內 agent 稽核、主對話 agent 修補）。
- **單一領域 / 局部變動仍用既有單一稽核 sub-agent**（升級門檻：可重複 / 跨領域才用 workflow，控 token；對齊業界「兩三步能 hold 用 subagent、可擴展才用 workflow」）。
- **前置 + fallback**：需 Claude Code 版本支援 Dynamic Workflows（research preview，約 v2.1.154+）；**版本不足時 fallback 既有單 sub-agent 序列稽核**（功能不受阻，只是無平行加速）。

### Step 4：修補 / 標 OQ

**做法**：
- 修補：**在既有卡內 edit 補入缺漏**（不新建抽象卡）
- 缺漏項標 OQ（含「來源稽核軸（領域 × 卡類型）」標記）
- 跨層影響傳播檢查（商業需求 ↔ User Story ↔ spec ↔ Test Case 四層）

**修補例**：
- 業務 Role 卡缺「款項追款流程」→ edit `03-roles/業務.md` 補入該章節
- 付款發票邏輯.md 缺「連帶矩陣」→ edit 該卡補入 7 實體連帶章節
- User Story 缺 `related-test-cases` → edit frontmatter 補欄位（值若不確定先標 OQ 待後續配對）

**產出「propose 前須先更新的 wiki 卡清單」（2026-06-09 修正，原「定案後回補」改為「propose 前更新」）**：

- 稽核時 **MUST** 同時產出「涉及本主題的 ERP_Vault 商業邏輯卡清單」（`04-business-logic/` / `05-entities/` / `06-state-machines/` / `07-scenarios/` / `13-user-stories/` 內提及本主題的卡）
- **pre-check 階段不修這些卡**（本次規劃尚未定案，提前改卡屬 premature documentation）
- **設計確認後、進入 `/opsx:propose` 之前 MUST 先更新此清單中的 wiki 卡**（wiki 是 BRD 商業邏輯正本，OpenSpec 是 PRD 實作規格；正確順序是先定 BRD 再寫 PRD。教訓：review-return-and-confirm-production change 將 wiki 回補放在 archive 後，導致 OpenSpec spec 混入狀態列舉、wiki 與 spec 重複維護）
- 此清單與「Step 4 修補既有卡」的區別：Step 4 修補的是「現況 know-how 缺漏 / 錯誤」（補既有真實狀況）；本清單列的是「本次設計定案後將被改寫的 wiki 商業邏輯卡」（設計確認後、propose 前執行）

### Step 5：閉環驗證（**禁 false completion**）

**做法**：
- 回頭看 Step 3 量化矩陣，修補後格子是否真的從「待修補 M」轉「已涵蓋 N」
- 未轉成功則回 Step 4 補做（最多 3 輪，超過 3 輪標 OQ 待後續）
- 跨層影響重新檢查

**回合預算**：
- Step 3 + 4 + 5 一輪 ≤ 30 分鐘
- 同領域最多 3 輪（超過 3 輪標 OQ 等 Miles 決策）

---

## 三、輸出格式（量化稽核報告）

### 對話 ack 模板

```
已跑 erp-planning-pre-check skill：

涉及領域：<L1.X 名稱> + cross-domain
載入卡清單：<列出實際載入的卡，filter 不相關領域>

7 卡類型量化矩陣：
| | 角色 | 實體 | 流程 | 情境 | User Story | 業務邏輯 | 法規 |
|--|----|----|----|----|----|----|----|
| <領域 X> | N=?/M=?/K=? | ... | ... | ... | ... | ... | ... |

待修補（M 細項）：<列出 3-5 條最關鍵的>
待確認 OQ（K 細項）：<列出 BI-/ORD- 等 ID>
連帶矩陣影響範圍：<7 實體影響清單>
User Story related-test-cases 對應狀態：<已連結 / 待補 / OQ>
wiki 商業邏輯卡清單（涉及本主題、propose 前須先更新）：<列出 04-business-logic / 05-entities / 06-state-machines / 07-scenarios / 13-user-stories 內受影響卡；pre-check 不修，設計確認後 propose 前更新>

下一步：依稽核結果修補既有卡 + 標 OQ + Step 5 閉環驗證；wiki 商業邏輯卡待設計確認後、進入 propose 前更新（不在 pre-check 修、不等 archive 後才補）
```

### audit-log.md 追加

每次稽核完成 MUST 追加到 `memory/Sens_wiki/wiki/erp/00-meta/audit-log.md`：

```markdown
## YYYY-MM-DD <領域> 第一輪稽核（議題：<議題名稱>）

### 雙軸量化矩陣
| | 角色 | 實體 | 流程 | 情境 | User Story | 業務邏輯 | 法規 |
|--|...|...|...|...|...|...|...|

### 修補項清單
- <卡 X 補 ... >

### 新建 OQ 清單
- <OQ-ID>：<議題>

### wiki 商業邏輯卡清單（propose 前須先更新）
- <ERP_Vault 卡路徑>：<本次設計定案後將被改寫的內容摘要>

### Step 5 閉環驗證結果
- <格子變化紀錄>

### 反模式識別（若有）
- <反模式名稱>：<情況描述>（追加到 audit-failure-patterns.md）
```

---

## 四、執行者與稽核者分離紀律

**MUST**：
- 稽核 sub-agent 跑稽核（透過 Agent tool 啟動 sub-agent）
- 主對話 agent 跑修補（修補既有卡 / 新建法規卡 / 標 OQ）
- 稽核完成後 sub-agent 回報量化矩陣 + 待修補清單

**MUST NOT**：
- 同一 agent 既寫卡又稽核（self-amplification）
- 稽核 agent 直接修補既有卡（角色越界）

---

## 五、修補規則（不新建抽象卡紀律）

- **edit 既有卡** + 缺漏標 OQ
- **不新建抽象卡**（如「業務一日時間軸」「商業模式畫布」等 — Miles 第四輪明確否決）
- 例外：法規 / 外部硬約束類缺漏 → 可新建（如本 plan 的 `04-business-logic/發票法規硬約束-ezPay-MIG.md`），但 MUST 在 [[business-domain-taxonomy]] § 五登錄
- 連帶矩陣必填（業務邏輯類卡含「連帶實體 / 跨模組影響」章節）
- **User Story 必檢 `related-test-cases` 欄位**

---

## 六、跨層影響傳播規則

四層雙向追溯（商業需求 ↔ User Story ↔ spec ↔ Test Case）：

| 層級 | 上游影響 | 下游影響 |
|------|---------|---------|
| 商業需求 | — | User Story / spec / Test Case |
| User Story | 商業需求 | spec § Scenarios / Test Case |
| spec | User Story | Test Case |
| Test Case | spec / User Story | — |

**規則**：上層改 → MUST 重審下層；下層缺 → MUST 反向修補上層或標 OQ。

---

## 七、反模式識別與追蹤

詳見 `memory/Sens_wiki/wiki/erp/11-review-knowledge/_shared/audit-failure-patterns.md`（規劃中）。

五大反模式（YouTube /goal 影片）：
- **Scope creep**：範圍漂移
- **False completion**：假完成（Step 5 閉環驗證防止）
- **Dead loops**：死循環（OQ 反覆 ≥ 3 輪不收斂）
- **Immeasurable targets**：無法量化（量化矩陣防止）
- **Token exhaustion**：成本過高（單次 ≤ 2-3 領域防止）

識別到反模式時：
1. 追加到 audit-failure-patterns.md
2. 對話中明示「識別到反模式 X：<情況描述>」
3. 採取對應對策（拆稽核 / 標 OQ / 等 Miles 決策）

---

## 八、與其他 skill 的協作

| 其他 skill | 協作關係 |
|----------|---------|
| `vault-audit` | Vault 整體健康稽核（12 維度）— 本 skill 互補，本 skill 是規劃前準備 |
| `vault-insight` | 跨主題模式提煉 — 本 skill 識別反模式時可觸發 |
| `oq-manage` | 缺漏項 Step 4 標 OQ 走 mode B |
| `misjudgement-record` | 識別到 agent 誤審反模式時觸發 |
| `erp-user-story` | User Story 撰寫紀律 — 本 skill 軸 2 「User Story」卡類型稽核依此紀律 |

---

## 九、版本歷史

| 版本 | 日期 | 變動 |
|------|------|------|
| v1.0 | 2026-05-28 | 初版建立（6 領域 × 7 卡類型雙軸 + 5 SOP 含閉環 + 執行者稽核者分離 + 五大反模式追蹤）|
| v1.1 | 2026-05-30 | Step 4 + ack 模板 + audit-log 模板新增「wiki 商業邏輯卡清單 + 定案後回補清單」產出（pre-check 不修卡、交棒 archive 階段回補）。原因：converge change 漏對齊 wiki 6 卡 — 規劃時沒列受影響 wiki 卡，archive 後也就漏回補；補「pre-check 不修卡 → 定案後回補」配對步驟 |
