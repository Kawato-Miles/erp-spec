# 訂單模組對外資料更新 + 迭代發布 Skill 強化 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把近期訂單管理迭代（已 archive 的 change）的差異，精準同步到三個對外面（Notion User Story DB / Notion 資料欄位 DB / Linear 訂單管理 project），並把「依迭代差異更新」這套做法固化進發布 skill，補上早期 Notion 推送缺少的品質閘門。

**Architecture:** 先確保內部正本到位（Vault 訂單 user story 卡對齊最新 spec），再算出「自上次發布以來受影響的對外條目清單（delta）」，據此只更新受影響項而非整段覆蓋。三個對外面各走既有推送管道（erp-user-story mode B / sync-workflow 流程 1 / linear-delivery），但前置一個共用的「迭代差異偵測」步驟，並把 linear-delivery 既有的 /goal + Rubric 品質機制移植到 Notion 推送路徑。最後把驗證過的流程回寫進 skill。

**Tech Stack:** Markdown（Vault 卡 / OpenSpec spec / skill 檔）、Notion MCP（notion-fetch / notion-query-database-view / notion-update-page / notion-create-pages / notion-update-data-source）、Linear MCP（save_project / save_issue）、openspec CLI、git。

---

## 執行決策鎖定（2026-06-03，分析 Workflow 後）

分析 Workflow（`wf_85049a6d-8c3`）+ 補檢已完成，完整 delta 見 `2026-06-03-delta-consolidated.md` + `2026-06-03-phase0-delta-worklist.json`。Miles 拍板：

1. **Schema 正本**：先補 OpenSpec § Data Model 表（Payment/BillingInstallment/OrderAdjustment 等 7 實體無獨立表）再推 Notion → **新增 Phase 0.5**。
2. **Linear issue**：照實際代號 FE-261/BE-170/BE-171/FE-260/BE-169/DE-52 更新（非原估 FE-259/BE-168）。
3. **覆蓋缺口**：補建 US-ORD-036（業務主管改派負責業務）。
4. 自動處理：Phase 0 衍生 OQ（US-ORD-013 退款角色、US-ORD-026 錨點）走 oq-manage mode B；資料欄位英文名沿用 DB 既有 snake_case。

**修訂後 Phase 順序**：Phase 0（Vault 改 20 卡 + 建 US-ORD-036）→ **Phase 0.5（補 OpenSpec Data Model 表，正本到位）** → Phase 1（SOP+Rubric）→ Phase 2（Notion USDB 建 19 更 8）→ Phase 3（Notion 資料欄位 DB，源自補齊後的 Data Model）→ Phase 4（Linear 六 issue + project + OA UML）→ Phase 5（固化 skill）。

**實際 delta 數字**（取代下方背景表的估值）：Vault needs-edit 20 / aligned 9；Notion USDB toCreate 18(+US-ORD-036=19) / toUpdate 8；資料欄位 lovAdd ~15 / lovDelete 2（OrderPaymentRecord、PlannedInvoice）。

> 註：因屬跨多階段工程且偵測到帳號接近 session 限額，採「frequent commit、可中斷續做」執行；每完成一批即 commit，未竟部分以本計畫 + worklist 續做。

---

## 背景：本次差異圖譜（執行前已查證的事實）

| 對外面 | 現況 | 差異邊界 |
|--------|------|---------|
| Notion User Story DB（`32c3886511fa808d8cb7db5c7af8ce6d`）| 訂單模組僅有 US-ORD-001~012（缺 009）；US-ORD-013、020~035 共 23 張**完全不存在**；001~012 可能內容飄移 | 落後到 ~5/20 前（帳務/期次/收退款批次未進）|
| Notion 資料欄位 DB（`32c3886511fa803e9f30edbb020d10ce`）| Order 實體停留在 route-C 前付款模型（`payment_status`/`payment_method`/`paid_at`/`payment_detail` + `待 ORD-002` 過時註記）；`資料表` enum 缺 `OrderAdjustment`/`OrderAdjustmentItem`/`OrderExtraCharge`/`OrderActivityLog`/`BillingInstallment`/`SalesAllowance` 等近期實體（僅到舊 `OrderPaymentRecord`）| 落後整個 5/22 帳務重構 |
| Linear 訂單管理 project（`af83dbd3`）| 2026-06-01 首次交付 | 落後 `refactor-order-receivable-refund-model`（6/02）+ `enhance-order-list-filter`（6/02）兩個 change |

**正本來源（單一正本鐵則）：**
- User Story 正本 = Vault `13-user-stories/order-management/`（35 張卡）→ 推 Notion User Story DB
- 欄位 / 狀態 正本 = OpenSpec `order-management/spec.md` § Data Model + `prototype-data-store/spec.md` + `state-machines/spec.md` → 推 Notion 資料欄位 DB
- 商業推理正本 = Vault `04-business-logic/` `05-entities/`（route-C archive 時已對齊，本計畫不重做）

**關鍵邊界（迭代差異發布的鐵則）：只反映「已 archive」的 change。** 以下 5 個觸及訂單的 change 仍 active（未進 main spec），本次發布**不納入**：`fix-order-print-item-actions`、`refactor-print-item-detail-split-platform-routing`、`refine-print-item-allocation-mixed-mode`、`add-consultation-activity-log`、`add-pending-receivables-and-invoicing-pages`。

**Notion vs Linear 差異邊界不同**（Miles 拍板）：Linear 用「6-01 交付後」（2 個 change）；Notion 用「5/22 批次」（實測 DB 落後到 5/20 前）。

---

## 檔案結構（本計畫會建立 / 修改的檔案）

**Phase 0 — 內部正本對齊（Vault）**
- Modify: `memory/Sens_wiki/wiki/erp/13-user-stories/order-management/US-ORD-*.md`（依對齊檢查表，僅改飄移的卡）

**Phase 1 — 迭代差異發布流程草稿（skill 骨架先立）**
- Create: `.claude/skills/erp-user-story/references/notion-publish-rubric.md`（Notion 發布 4 維度 Rubric，仿 linear-delivery）
- Create: `memory/Sens_wiki/wiki/erp/00-meta/iteration-delta-publish.md`（迭代差異偵測 SOP，三邊共用，sync-workflow 引用）

**Phase 2 — Notion User Story DB（訂單）**
- 外部：Notion User Story DB（create 23 + update 飄移項）
- Modify: 對應 Vault 卡 frontmatter `notion-published-at` / `notion-page-url` 回填

**Phase 3 — Notion 資料欄位 DB（訂單實體）**
- 外部：Notion 資料欄位 DB（資料表 enum 加選項 + create 新欄位 + update 改名欄位 + 標記廢止欄位）

**Phase 4 — Linear 訂單管理**
- 外部：Linear project `af83dbd3` 描述 + 受影響 issue（FE-259 / BE-168 等）

**Phase 5 — 固化 skill（強化既有，option 3）**
- Modify: `.claude/skills/erp-user-story/SKILL.md`（Step B1 加 change-driven delta + 強制回填 + 引用 Notion Rubric）
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/sync-workflow.md`（新增「流程 1-C：迭代差異推送」）
- Modify: `.claude/skills/linear-delivery/SKILL.md`（Step 1 加 delta 邊界判斷：只取 archived change）
- Modify（視需要）：`CLAUDE.md` § ERP 討論主動路由（新增「對外發布」row）

---

## Phase 0：內部正本對齊（Vault 訂單 user story 卡 vs 最新 spec）

> Miles 指示：「wiki 的訂單 user story 不確定有沒有依照 wiki/spec 更新到最新，這個要先處理，再往外送」。對外推送前，Vault 正本必須先到位，否則把舊內容推出去。

### Task 0.1：建立「對齊檢查表」（哪些卡要查、查什麼）

**Files:**
- 讀：`openspec/changes/archive/2026-05-2*/`、`2026-05-30-*/`、`2026-06-0*/` 各 change 的 `specs/order-management/spec.md` delta
- 讀：`memory/Sens_wiki/wiki/erp/13-user-stories/order-management/US-ORD-*.md`（35 張）

- [ ] **Step 1：列出「5/22 以來 archived 訂單 change → 受影響 user story」對照**

逐一讀以下 archived change 的 order-management delta，標出每個 change 改了哪個業務行為，對應到哪張 US-ORD 卡：

```
2026-05-22-add-payment-status-and-decouple-oa-execution     → US-ORD-001(審核), 011/013(退款)
2026-05-26-align-invoice-line-items-to-ezpay-spec           → US-ORD-021(開發票)
2026-05-26-refine-consultation-cancellation-and-invoice-flow→ US-CR-*, US-ORD-011
2026-05-28-relax-order-detail-edit-conditions               → US-ORD-004/005(印件/發票編輯時機)
2026-05-28-unify-billing-installment-and-reconciliation-csv → US-ORD-020~025(期次/收款/CSV)
2026-05-29-refine-invoice-tab                               → US-ORD-021
2026-05-30-converge-consultation-cancel-to-order-cancel-flow→ US-ORD-011(取消退款)
2026-06-01-align-business-consultation-coverage-gaps        → US-CR-*, US-ORD-*
2026-06-02-refactor-order-receivable-refund-model           → US-ORD-011/013/026/027/035(收退款/OA/明細時點)
```

- [ ] **Step 2：產出對齊檢查表（寫進對話，不落檔）**

每張受影響卡標：`卡名 | last-reviewed | 受哪個 change 影響 | 是否需更新（待查/已對齊/需改）`。
驗證：表格涵蓋上述所有 archived change，且每個 change 至少對應 1 張卡（無遺漏）。

### Task 0.2：逐卡核對並修正飄移（重點：收退款 / 期次 / 編輯時機）

**Files:**
- Modify: 受影響的 `US-ORD-*.md`（依檢查表，僅改需改的）

- [ ] **Step 1：核對 route-C 直接影響的 5 張卡**

逐張讀 US-ORD-011（訂單取消與退款）/ US-ORD-013（會計執行退款處理）/ US-ORD-026（補收 OA 免核可直接執行）/ US-ORD-027（業務主管核可退款訂單異動）/ US-ORD-035（已核可後校正退款金額），對照 route-C 核心設計：
- 明細時點分界 = 終態集合 {訂單完成, 已取消}（完成前可直接增減、終態後走 OA）
- OA「已執行」= 核可後應收調整即生效（移除「綁 Payment 累計」+ 回退機制）
- 退款核銷對帳「應退差額」；款項用語「收款→款項」

對每張卡檢查業務情境敘述 + Gherkin 成功條件是否含**已淘汰機制**（回退機制 / 綁 Payment 累計 / 舊「收款」用語）。

- [ ] **Step 2：核對 unify-billing 影響的期次卡（US-ORD-020~025）**

對照 `2026-05-28-unify-billing-installment-and-reconciliation-csv` delta，確認期次（BillingInstallment）/ 14 欄對帳 CSV / 收款核銷分配的業務敘述與 spec 一致。

- [ ] **Step 3：修正飄移卡（block-level，只改變動段）**

對「需改」的卡：改寫飄移段落，更新 frontmatter `last-reviewed: 2026-06-03`。依 CLAUDE.md § 文件迭代「收斂本體」原則——舊敘述直接改寫掉，不並陳新舊。

- [ ] **Step 4：驗證——無已淘汰機制殘留**

Run:
```bash
grep -rlE "回退機制|綁 ?Payment 累計|累計達.*已執行" memory/Sens_wiki/wiki/erp/13-user-stories/order-management/
```
Expected: 無輸出（route-C 已淘汰的機制不應出現在任何訂單 user story 卡）。
若有輸出 → 回 Step 3 修正該卡。

- [ ] **Step 5：commit**

```bash
cd /Users/b-f-03-029/Sens
git add memory/Sens_wiki/wiki/erp/13-user-stories/order-management/
git commit -m "fix: 訂單 user story 卡對齊 5/22-6/02 archived change（收退款/期次/編輯時機）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 1：迭代差異發布流程草稿（skill 骨架先立）

> 先把「依迭代差異更新」的方法寫成可被執行與稽核的文件，後續 Phase 2-4 即依此草稿執行（邊做邊驗證流程），Phase 5 再固化。把 linear-delivery 的 /goal + Rubric 品質機制移植到 Notion。

### Task 1.1：建立 Notion 發布 Rubric（仿 linear-delivery rubric.md）

**Files:**
- 讀：`.claude/skills/linear-delivery/references/rubric.md`（4 維度模板來源）
- Create: `.claude/skills/erp-user-story/references/notion-publish-rubric.md`

- [ ] **Step 1：寫 Notion 發布 4 維度 Rubric**

內容如下（完整寫入，非佔位）：

```markdown
# Notion 發布品質 Rubric（User Story DB / 資料欄位 DB）

> 仿 linear-delivery Rubric。推送 Notion 前由 senior-pm 評審（執行者 / 評審分離），任一維度非「通過」即不推送；維度 4 為一票否決。評分尺度：通過 / 部分 / 未通過。

## /goal 5 元素（每次推送前複製套用）

| 元素 | Notion 推送的填法 |
|------|------------------|
| Outcome | 受 delta 影響的 Notion 條目（User Story / 欄位）全部新增或更新到位，且經 senior-pm 判 4 維度全通過 |
| Verification | senior-pm 跑本 Rubric 4 維度 + 對照 Vault 正本 / OpenSpec Data Model 逐條查證 |
| Constraint | 只動 delta 清單內的條目；以 us-id / (資料表+英文名稱) 為唯一鍵 update，禁建重複；不外露 openspec 路徑 |
| Iteration Policy | 未通過 → 修正 → 重新評審；硬上限 3 輪；卡住問 Miles |
| Error Handling | 正本未定義就停下記 oq-manage mode B + 標「另案處理」，不自編 |

## 4 維度

| # | 維度 | 一句話 | 性質 |
|---|------|--------|------|
| 1 | 正本對齊 | User Story 條目逐欄對齊 Vault 卡；欄位條目逐欄對齊 OpenSpec Data Model | 一般 |
| 2 | delta 完整性 | delta 清單內每一條都已處理（新增 / 更新 / 標廢止），無遺漏、無越界改 delta 外條目 | 一般 |
| 3 | 唯一鍵紀律 | 以 us-id / (資料表+英文名稱) 配對，既有 update 不重建；回填追蹤欄位（notion-published-at / notion-page-url）| 一般 |
| 4 | 真實性（不捏造）| 正本未定義的欄位 / 行為不自編填入；過時註記（如「待 ORD-002」）清掉而非沿用 | 一票否決 |

## 具體禁令（評審逐條抓）

- 禁把 active（未 archive）change 的內容推到對外面（只反映 archived change）
- 禁沿用已淘汰機制敘述（回退機制 / 綁 Payment 累計 / 舊「收款」用語）
- 禁保留過時 OQ 註記（「待 ORD-xxx」應已解或清掉）
- 禁建重複條目（同 us-id / 同 資料表+英文名稱 已存在時必 update）

## 演化紀錄

- 2026-06-03 v1.0：建立。從 linear-delivery rubric 衍生，補「正本對齊」與「delta 完整性」兩維度（Notion 特有）。
```

驗證：
```bash
test -f .claude/skills/erp-user-story/references/notion-publish-rubric.md && grep -c "維度" .claude/skills/erp-user-story/references/notion-publish-rubric.md
```
Expected: 檔案存在，「維度」出現 ≥ 4 次。

### Task 1.2：建立「迭代差異偵測 SOP」（三邊共用）

**Files:**
- Create: `memory/Sens_wiki/wiki/erp/00-meta/iteration-delta-publish.md`

- [ ] **Step 1：寫迭代差異偵測 SOP**

完整寫入（frontmatter 依 sens-wiki 規範 + 關聯區）：

```markdown
---
title: "迭代差異發布 SOP"
type: meta
status: 有效
last-reviewed: 2026-06-03
---

# 迭代差異發布 SOP（對外資料只更新受影響項）

> 解決「整段覆蓋往外」的問題：發布前先算出「自上次發布以來，哪些對外條目受 archived change 影響」，只更新受影響項。

## 一、邊界鐵則

- **只反映 archived change**：`openspec/changes/archive/` 內的 change 才算「已發布到 main spec」。active change（`openspec/changes/<name>/`）不納入對外發布。
- **三邊基準時點各自記錄**：每個對外面有自己的「上次發布時點」（見 § 三）。

## 二、delta 計算（四步）

1. **定上次發布時點**：
   - Notion User Story DB → 取對應 Vault 卡 frontmatter `notion-published-at` 最舊值；若全空 → 查 Notion DB 實際缺哪些 us-id。
   - Notion 資料欄位 DB → 比對 DB `資料表` enum 與 OpenSpec Data Model 實體清單的差集。
   - Linear → 取 project 上次 linear-delivery 交付日期。
2. **撈該時點後 archived change**：`ls openspec/changes/archive/` 篩日期 ≥ 基準。
3. **逐 change 抽 delta spec**：讀 `specs/<capability>/spec.md` 的 ADDED/MODIFIED/REMOVED/RENAMED，對映到對外條目（user story / 欄位 / Linear issue）。
4. **產 delta 清單**：每個對外面一張表 `條目 | 動作(新增/更新/標廢止) | 來源 change | 正本位置`。

## 三、路由（delta 清單 → 推送管道）

| 對外面 | 推送管道 | 品質閘門 |
|--------|---------|---------|
| Notion User Story DB | [[erp-user-story]] mode B | notion-publish-rubric（senior-pm 評審）|
| Notion 資料欄位 DB | sync-workflow 流程 1-C | notion-publish-rubric |
| Linear project/issue | [[linear-delivery]] | linear-delivery rubric |

## 四、回填追蹤（強制，修正當前失血）

推送成功後 MUST 回填正本的追蹤欄位（user story 卡 `notion-published-at` / `notion-page-url`）。未回填則下次 delta 偵測失準（當前所有訂單卡 `notion-published-at` 為空即此問題）。

## 關聯區域

- [[sync-workflow]] — 三邊同步總流程（本 SOP 為其 delta 偵測前置）
- [[vault-charter]] — 單一正本規則
```

驗證：`obsidian` 無死鏈（或 `grep -o "\[\[[^]]*\]\]"` 的目標卡都存在）。

- [ ] **Step 2：sync-workflow 與 index/log 維護**

更新 `wiki/index.md` 加入新卡、`wiki/log.md` 追加「納入」紀錄（依 sens-wiki § 四）。

- [ ] **Step 3：commit**

```bash
git add .claude/skills/erp-user-story/references/notion-publish-rubric.md memory/Sens_wiki/wiki/erp/00-meta/iteration-delta-publish.md memory/Sens_wiki/wiki/index.md memory/Sens_wiki/wiki/log.md
git commit -m "feat: 新增迭代差異發布 SOP + Notion 發布 Rubric（移植 linear-delivery 品質閘門）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2：更新 Notion User Story DB（訂單）

> 依 Phase 1 SOP 執行第一個對外面，同時驗證 SOP 是否好用（Miles：「主要要試看看迭代的方式」）。

### Task 2.1：產出 User Story delta 清單 + 跑 lint

**Files:**
- 讀：`memory/Sens_wiki/wiki/erp/13-user-stories/order-management/US-ORD-*.md`（Phase 0 已對齊）

- [ ] **Step 1：產 delta 清單**

對照「Vault 35 張 active 卡」vs「Notion 現有 US-ORD-001~012（缺 009）」：
- 新增：US-ORD-009、013、020~035（共 24 張，含 009）
- 更新：001~012 中 Phase 0 標記為「需改」的卡

- [ ] **Step 2：對 delta 清單每張卡跑 lint（erp-user-story Step A7）**

檢查：INVEST、中英夾雜、全卡禁 UI 措辭、Gherkin 成功條件齊備。任一失敗 → 中止，修正後重來。
驗證：lint 全數通過（逐張列 pass）。

### Task 2.2：senior-pm 評審（推送前品質閘門）

- [ ] **Step 1：調用 senior-pm 跑 notion-publish-rubric**

餵 delta 清單 + 各卡內容 + `notion-publish-rubric.md`，要求逐維度給通過/部分/未通過 + evidence-anchored。
- [ ] **Step 2：未通過 → 修正 → 重評（硬上限 3 輪）**
驗證：senior-pm 判 4 維度全「通過」。未過禁進 Task 2.3。

### Task 2.3：推送 Notion（create + update）+ 回填

**Files:**
- 外部：Notion User Story DB（`32c3886511fa808d8cb7db5c7af8ce6d`）
- Modify: 對應 Vault 卡 frontmatter

- [ ] **Step 1：property mapping 推送**

依 erp-user-story Step B3 mapping（us-id→編碼、標題→名稱、role→作為 relation、我希望/以便/前置條件/流程說明/成功條件、priority→優先度、module→涉及模組、related-spec→Feature relation）。以 `編碼` 為唯一鍵：存在 update、不存在 create。

- [ ] **Step 2：回填 Vault frontmatter**

每張推送成功的卡填 `notion-published-at: 2026-06-03` + `notion-page-url: <URL>`。

- [ ] **Step 3：驗證——Notion 訂單 user story 條數 = Vault active 訂單卡數**

Run（推送後重查 Notion）：
```
notion-query-database-view（依模組分 view）→ grep '"編碼":"US-ORD' → sort -u → 計數
```
Expected: Notion US-ORD 編碼數 = Vault `13-user-stories/order-management/` 內 status=active 卡數（35）。差額為 0。
另抽查 3 張新增卡（US-ORD-013 / 030 / 035）內容與 Vault 卡逐欄一致。

- [ ] **Step 4：commit（Vault 回填）**

```bash
git add memory/Sens_wiki/wiki/erp/13-user-stories/order-management/
git commit -m "docs: 推送 24 條訂單 user story 至 Notion 發布版 + 回填追蹤欄位

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3：更新 Notion 資料欄位 DB（訂單實體）

> 正本 = OpenSpec Data Model。資料欄位 DB 落後整個 5/22 帳務重構：缺新實體、Order 付款欄位過時、有過時 OQ 註記。

### Task 3.1：產出欄位 delta 清單（OpenSpec Data Model vs Notion DB）

**Files:**
- 讀：`openspec/specs/order-management/spec.md` § Data Model、`openspec/specs/prototype-data-store/spec.md`、`openspec/specs/state-machines/spec.md`（OA 狀態）

- [ ] **Step 1：列 OpenSpec 訂單域實體 vs Notion `資料表` enum 差集**

Notion 現有 enum（訂單域）：Order、OrderItem、PrintItem、PrintItemFile、OrderPaymentRecord（舊）。
OpenSpec 定義但 Notion 缺：`OrderAdjustment`、`OrderAdjustmentItem`、`OrderExtraCharge`、`OrderActivityLog`、`Payment`（款項，取代 OrderPaymentRecord）、`BillingInstallment`（請款期次）、`SalesAllowance`（折讓）。
（逐一以 OpenSpec spec 查證實體確存在後才列入；不存在的不臆造——維度 4 真實性。）

- [ ] **Step 2：列 Order 實體欄位 delta**

對照 spec：標記過時欄位（如付款模型已遷 store.payments 的舊欄位）、改名欄位、`待 ORD-002` 等過時註記要清。逐欄列 `欄位 | 動作 | spec 依據行號`。

### Task 3.2：senior-pm 評審 + 推送資料欄位 DB

**Files:**
- 外部：Notion 資料欄位 DB（`32c3886511fa803e9f30edbb020d10ce`）；data source `collection://32c38865-11fa-806e-a150-000b003e9f71`

- [ ] **Step 1：senior-pm 跑 notion-publish-rubric（4 維度全通過才推）**
- [ ] **Step 2：擴充 `資料表` select enum**

用 `notion-update-data-source` 對 `資料表` property 新增缺的選項（OrderAdjustment / OrderAdjustmentItem / OrderExtraCharge / OrderActivityLog / Payment / BillingInstallment / SalesAllowance）。

- [ ] **Step 3：新增 / 更新欄位條目**

新實體欄位 `notion-create-pages`（每筆：中文名稱 / 英文名稱 / 型別 / 必填 / 唯讀 / 唯一識別碼 / 資料表 / 說明與範例 / 相關模組 relation→訂單）；Order 過時欄位 `notion-update-page`（改名 / 清過時註記 / 標廢止）。以 `(資料表 + 英文名稱)` 為唯一鍵。

- [ ] **Step 4：驗證——新實體存在 + 無過時註記**

Run（重查訂單 view）：
```
notion-query-database-view（訂單 view）→ grep '"資料表":"OrderAdjustment"' 應有命中
→ grep '待 ORD-002' 應無命中
```
Expected: 新實體欄位出現；過時 OQ 註記清零；Order 付款欄位與 spec 一致。

---

## Phase 4：更新 Linear 訂單管理 project + issues

> 差異邊界 = 6-01 交付後（route-C + enhance-order-list-filter）。走 linear-delivery 既有 Step 1-6。

### Task 4.1：算 Linear delta（只 2 個 change）

**Files:**
- 讀：`openspec/changes/archive/2026-06-02-refactor-order-receivable-refund-model/specs/`、`2026-06-02-enhance-order-list-filter/specs/`

- [ ] **Step 1：抽兩 change delta → 對映 Linear 條目**

route-C → project 描述「功能邏輯」段（收退款 / OA 已執行即生效 / 明細時點分界 / 三方對帳）+ 狀態機 UML（OA 狀態機 MODIFIED：核可即生效、移除回退）；FE-259（訂單列表/詳情）+ BE-168（訂單 API）。
enhance-order-list-filter → FE-259（列表篩選）。
驗證：每個 delta Requirement 都對映到 project 段落或某 issue（無遺漏）。

### Task 4.2：linear-delivery 產草稿 + senior-pm 評審 + 寫入

- [ ] **Step 1：依 delivery-template 改 project 描述受影響段 + 受影響 issue 描述**（只動 delta 段，整段覆寫 project 描述時 MUST 重傳完整描述避免回退既有內容）
- [ ] **Step 2：senior-pm 跑 linear-delivery rubric（4 維度全通過）**
- [ ] **Step 3：寫入**

`save_project` 帶 `state: Planned`（防 Kick off）；`save_issue` 只傳 id + description（保留 estimate/assignee/cycle）。
- [ ] **Step 4：驗證**

請 Miles 開 project 頁確認 mermaid 渲染 + 收退款 / 列表篩選內容到位。

---

## Phase 5：固化 skill（強化既有，option 3）

> 把 Phase 1-4 驗證過的流程回寫進既有 skill。Miles：「參考 linear-delivery 的方式」把品質機制補進 Notion 路徑。

### Task 5.1：強化 erp-user-story mode B（加 change-driven delta + 強制回填 + Rubric 閘門）

**Files:**
- Modify: `.claude/skills/erp-user-story/SKILL.md`

- [ ] **Step 1：改寫 Step B1（待推送清單）**

現有 B1 僅以 frontmatter（notion-published-at 空 / >60 天 / last-reviewed 更新）判定。加入 change-driven delta：「先依 [[iteration-delta-publish]] 算出受 archived change 影響的卡，與 frontmatter 判定取聯集」。

- [ ] **Step 2：在 B2 後插入「B2.5 senior-pm 評審」**

引用 `references/notion-publish-rubric.md`，執行者 / 評審分離，4 維度全通過才進 B3。

- [ ] **Step 3：強化 B5 回填為 MUST + 失血警語**

明文：未回填會導致下次 delta 偵測失準（引當前訂單卡全空為教訓）。

- [ ] **Step 4：驗證**

```bash
grep -c "iteration-delta-publish\|notion-publish-rubric" .claude/skills/erp-user-story/SKILL.md
```
Expected: ≥ 2（兩處引用都在）。

### Task 5.2：sync-workflow 新增「流程 1-C：迭代差異推送」

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/sync-workflow.md`

- [ ] **Step 1：在「流程 1-B」後新增「流程 1-C」段**

內容：觸發時點（重大 change archive 後）、步驟（引 [[iteration-delta-publish]] 算 delta → 路由三邊 → Rubric 閘門 → 回填）、與流程 1 / 1-B 的關係（1-C 是「只更新受影響項」的精準版，1 是首次 / 全量彙整）。
- [ ] **Step 2：驗證** `grep "流程 1-C" sync-workflow.md` 有命中；index/log 維護。

### Task 5.3：linear-delivery 加 delta 邊界 + CLAUDE.md 路由

**Files:**
- Modify: `.claude/skills/linear-delivery/SKILL.md`（Step 1 加「只取 archived change 算 delta，active change 不交付」）
- Modify: `CLAUDE.md`（§ ERP 討論主動路由 加「對外發布 / 迭代同步」row：觸發信號「推 X 到 Notion/Linear」「同步發布」→ 依 [[iteration-delta-publish]]）

- [ ] **Step 1：改 linear-delivery Step 1**（加 archived-only 邊界一句）
- [ ] **Step 2：CLAUDE.md 路由表加 row**（block-level，只加一列）
- [ ] **Step 3：驗證** 兩檔 grep 命中新增內容。

- [ ] **Step 4：commit（Phase 5 整批）**

```bash
git add .claude/skills/erp-user-story/SKILL.md memory/Sens_wiki/wiki/erp/00-meta/sync-workflow.md .claude/skills/linear-delivery/SKILL.md CLAUDE.md memory/Sens_wiki/wiki/index.md memory/Sens_wiki/wiki/log.md
git commit -m "feat: 發布 skill 補迭代差異更新流程 + Notion 品質閘門（強化既有 skill）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 收尾（依 CLAUDE.md § 主動收尾）

- [ ] OQ 掃描：本次若識別不確定項（如某實體 spec 未定義）→ oq-manage mode B
- [ ] ≥ 5 Vault 卡異動 → 建議 Miles 跑 vault-audit
- [ ] 更新 memory：本次「迭代發布流程」結論寫入 memory（project 類）

---

## 自審（writing-plans Self-Review）

1. **Spec 覆蓋**：四個 deliverable（Vault 對齊 / USDB / 欄位 DB / Linear）+ skill 強化（option 3）皆有對應 Phase。Miles 的「先處理 wiki user story」= Phase 0；「試迭代方式」= Phase 1 SOP + Phase 2-4 套用；「參考 linear-delivery 補 Notion 品質」= Task 1.1 Rubric + 5.1 閘門。
2. **佔位掃描**：各 verify 步驟均為可執行（grep / notion 計數 / openspec）；skill 與 SOP 內容已full 寫出非 TBD。
3. **型別一致**：唯一鍵命名一致（user story = `編碼`/us-id；欄位 = `資料表 + 英文名稱`）；Rubric 維度編號 1-4 跨 Phase 一致。

## 已知風險 / 待確認

- **R1**：Phase 3 新實體清單須以 OpenSpec spec 實查為準（Task 3.1 Step 1 已要求逐一查證）；若某實體（如 PlannedInvoice）spec 未明確定義 → 標另案、不臆造（Rubric 維度 4）。
- **R2**：Notion 資料欄位 DB 用 `notion-update-data-source` 改 enum 屬結構變更，建議推送前請 Miles 確認新增選項清單。
- **R3**：Linear delta（Task 4.1）若 route-C 的 OA 狀態機 UML 需重畫，須 Miles 眼見確認 mermaid 渲染。
