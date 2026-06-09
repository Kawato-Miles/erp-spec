# state-machines/spec.md 完整抽離計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 `openspec/specs/state-machines/spec.md` 的 24 條 Requirement 完整抽離至 wiki 卡與模組 spec，然後刪除 state-machines/spec.md。日後不再保留此跨模組 spec。

**Architecture:** 四階段執行：A wiki 先行（矛盾修正 + 缺失卡新建 + 狀態列舉正本建立）→ B Scenario 搬模組 spec → C spec 內部矛盾清理 → D 刪除 state-machines/spec.md + 斷連結修復。

**Tech Stack:** Markdown 文件重構，無程式碼。OpenSpec spec + Obsidian wiki（ERP_Vault）。

**前置依賴**：business-processes/spec.md 搬遷已完成（2026-06-09）。

---

## 前置確認

1. `openspec/specs/state-machines/spec.md` 存在（24 條 Requirement）
2. wiki `06-state-machines/` 下已有：訂單狀態（含列舉正本）、印件狀態（含列舉正本）、訂單異動狀態（含列舉正本）、分期請款狀態（含列舉正本）、工單狀態、任務狀態、生產任務狀態、出貨單狀態、QC 狀態、諮詢單狀態
3. wiki `06-state-machines/` 缺失：售後服務狀態、發票狀態、折讓單狀態

---

## Phase A：wiki 先行

### 原則

- 每張狀態機 wiki 卡 MUST 有 `## 狀態列舉（正本）` 段（對齊訂單狀態卡格式）
- 已有列舉正本的卡（訂單 / 印件 / 訂單異動 / 分期請款）→ 確認一致
- 沒有列舉正本的卡 → 新增 `§ 狀態列舉（正本）` 段
- 缺失的卡 → 新建

### Task A1：新建 3 張缺失的 wiki 狀態機卡

**Files:**
- Create: `memory/Sens_wiki/wiki/erp/06-state-machines/售後服務狀態.md`
- Create: `memory/Sens_wiki/wiki/erp/06-state-machines/發票狀態.md`
- Create: `memory/Sens_wiki/wiki/erp/06-state-machines/折讓單狀態.md`

| 新建卡 | 來源 spec 行號 | 狀態列舉 |
|--------|--------------|---------|
| 售後服務狀態 | L739 | 受理中 / 處理中 / 已結案（三態 + 無核可關卡 + 結案手動 + 不阻擋主訂單 + 不可重開） |
| 發票狀態 | L799 | 開立 / 作廢（兩態 + 流水號不重用 + 作廢不參與三方對帳） |
| 折讓單狀態 | L834 | 已確認 / 已作廢（兩態 + 台灣統一發票使用辦法第 20 條 + Mockup 階段不用草稿態） |

- [ ] **Step 1: 讀 spec 中三條 Requirement 的描述段**
- [ ] **Step 2: 建三張卡（frontmatter + § 狀態列舉正本 + § 營運動機 + § 相關連結），遵循訂單狀態卡格式**
- [ ] **Step 3: 確認每張新卡至少被一張既有卡連到（禁孤島）**
- [ ] **Step 4: Commit**

### Task A2：補齊現有卡的狀態列舉正本段

以下 wiki 卡已有內容但缺 `## 狀態列舉（正本）` 段（營運動機段有寫狀態但未結構化為正本表格）：

| wiki 卡 | 現況 | 需補的列舉 |
|---------|------|----------|
| 需求單狀態.md | 有營運動機，指向 spec 為列舉正本 | 需新增 § 狀態列舉正本（需求確認中/待評估成本/報價中/核價中/議價中/成交/流失） |
| 工單狀態.md | 有營運動機，指向 spec 為列舉正本 | 需新增 § 狀態列舉正本（草稿/製程確認中/製程審核完成/工單已交付/製作中/已完成/已取消） |
| 任務狀態.md | 有營運動機 | 需新增 § 狀態列舉正本（待交付/已交付/製作中/已完成 + 異動路徑） + **補「作廢」終態 + bottom-up 作廢規則** |
| 生產任務狀態.md | 有營運動機 | 需新增 § 狀態列舉正本（待處理/製作中/已完成/已取消 四路徑依工廠類型） |
| 出貨單狀態.md | 有完整路徑表格 | 表格已有但需加「正本」宣告語 + **補「出貨單掛訂單層」設計決策** |
| 諮詢單狀態.md | 有營運動機 | 需新增 § 狀態列舉正本（待諮詢/已轉需求單/完成諮詢/已取消 四態） |

- [ ] **Step 1: 逐卡讀現有內容**
- [ ] **Step 2: 新增 § 狀態列舉（正本）段（對齊訂單狀態卡格式：宣告語 + 狀態表格）**
- [ ] **Step 3: 補任務狀態.md 的「作廢」終態 + bottom-up 作廢規則**
- [ ] **Step 4: 補出貨單狀態.md「出貨單掛訂單層」段**
- [ ] **Step 5: 更新所有卡的 `last-reviewed`**
- [ ] **Step 6: Commit**

### Task A3：修正 wiki 矛盾 + 缺漏

| 項目 | wiki 卡 | 修正內容 |
|------|---------|---------|
| 諮詢取消退費 OA 推進條件 | 訂單異動狀態.md | 「諮詢人員確認執行」→ 改為「諮詢人員將退款收款紀錄切已完成 → 系統自動重算累計達標 → 推進 OA 已執行」（對齊 order-management spec L283-288） |
| 齊套邏輯 `requires_inspection` 分支 | 齊套邏輯.md | 層級 1 補 `requires_inspection` 分支：TRUE 取品檢通過量、FALSE 取報工累計量 + 補 C1/C4 入庫公式差異 |

- [ ] **Step 1: 讀 order-management spec L283-288 確認推進條件**
- [ ] **Step 2: 修正訂單異動狀態.md**
- [ ] **Step 3: 讀 state-machines spec L66-112 確認齊套邏輯完整細節**
- [ ] **Step 4: 修正齊套邏輯.md**
- [ ] **Step 5: Commit**

---

## Phase B：Scenario 搬模組 spec

### 原則

同 business-processes 搬遷模式：
- 保留完整 Requirement 標題 + Scenario
- 描述段精簡為純系統行為（移除 why / 狀態列舉，改引用 wiki 卡）
- 目標 spec 已有同名 Requirement → 合併
- 確認有 Priority + Rationale

### Task B1：搬到 work-order/spec.md（5 條）

| # | Requirement | spec 行號 |
|---|------------|----------|
| 5 | 工單狀態機 | L195 |
| 6 | 工單收回（Withdraw）| L243 |
| 7 | 工單異動流程 | L255 |
| 8 | 任務異動狀態機 | L317 |
| 11 | 任務狀態機 | L526 |

- [ ] **Step 1: 讀 5 條完整 Requirement + 讀 work-order/spec.md 確認無同名衝突**
- [ ] **Step 2: 精簡描述段（移除狀態列舉、角色職責，改引用 wiki）**
- [ ] **Step 3: Append 到 work-order/spec.md**
- [ ] **Step 4: Commit**

### Task B2：搬到 order-management/spec.md（3 條 + 向上傳遞鏈）

| # | Requirement | spec 行號 | 備註 |
|---|------------|----------|------|
| 1 | 跨實體狀態向上傳遞鏈 | L13 | 跨模組，拆：向上傳遞鏈搬 order-management |
| 3 | 層級建立順序 | L114 | Scenario 搬 order-management |
| 13 | 出貨單狀態機 | L623 | |
| 14 | 出貨單掛訂單層 | L650 | |

印件印製維度的 Scenario（從印件狀態機 L344 拆出）也搬到 order-management。

- [ ] **Step 1-4: 同 Task B1 模式**

### Task B3：搬到 prepress-review/spec.md（2 條）

| # | Requirement | spec 行號 |
|---|------------|----------|
| 9 | 印件狀態機（雙維度）— 審稿維度 Scenario | L344 |
| 10 | 印件打樣特殊流程 | L493 |

注意：印件狀態機需拆搬——審稿維度 Scenario 搬 prepress-review、印製維度 Scenario 搬 order-management（Task B2）。

- [ ] **Step 1: 讀印件狀態機完整 Requirement，區分審稿維度 vs 印製維度 Scenario**
- [ ] **Step 2: 審稿維度 Scenario append prepress-review（確認無重複——review-return-and-confirm-production 已搬過部分）**
- [ ] **Step 3: 印件打樣特殊流程 append prepress-review**
- [ ] **Step 4: Commit**

### Task B4：搬到 production-task/spec.md（1 條 + 完成度計算）

| # | Requirement | spec 行號 | 備註 |
|---|------------|----------|------|
| 2 | 完成度計算（齊套性邏輯）| L66 | 跨模組，拆：完成度計算搬 work-order |
| 12 | 生產任務狀態機 | L555 | 搬 production-task |

修正：完成度計算搬 work-order（非 production-task），與 Task B1 合併處理。

- [ ] **Step 1: 生產任務狀態機 append production-task/spec.md**
- [ ] **Step 2: 完成度計算 append work-order/spec.md**
- [ ] **Step 3: Commit**

### Task B5：搬到 order-billing/spec.md（3 條）

| # | Requirement | spec 行號 |
|---|------------|----------|
| 17 | 發票（Invoice）狀態機 | L799 |
| 18 | 折讓單（SalesAllowance）狀態機 | L834 |
| 20 | BillingInstallment 雙維度狀態機 | L971 |

- [ ] **Step 1-4: 同 Task B1 模式**

### Task B6：搬到其他模組 spec（4 條）

| # | Requirement | spec 行號 | 目標 |
|---|------------|----------|------|
| 4 | 需求單狀態機 | L139 | quote-request/spec.md |
| 15 | OA 狀態機（合併 L660 + L1059） | L660+L1059 | order-adjustment/spec.md |
| 16 | AfterSalesTicket 狀態機 | L739 | after-sales-ticket/spec.md |
| 19 | 諮詢單狀態機（v2 簡化）| L874 | consultation-request/spec.md |

OA 狀態機需先合併 L660 主 Requirement 與 L1059 修訂 Requirement（移除 L1059 重疊的舊 Scenario）。

- [ ] **Step 1: 合併 L660 + L1059 為一個統一的 OA 狀態機 Requirement**
- [ ] **Step 2: 逐條搬到目標 spec**
- [ ] **Step 3: Commit**

---

## Phase C：spec 內部矛盾清理

在搬遷過程中同步處理（不另開 Task）：

| 矛盾 | 位置 | 處理方式 |
|------|------|---------|
| 退款 OA 推進條件 | L688 vs L1083-1092 | 合併 L660+L1059 時清理 Scenario 對齊「核可即生效」 |
| 工單收回目標狀態 | L204 vs L250 | 搬 work-order 時統一（確認正確行為後取一） |

---

## Phase D：刪除 + 斷連結修復

### Task D1：刪除 state-machines/spec.md

- [ ] **Step 1: 確認 24 條全部已搬遷（grep 計數）**
- [ ] **Step 2: 刪除 `openspec/specs/state-machines/`**
- [ ] **Step 3: Commit**

### Task D2：斷連結修復

- [ ] **Step 1: grep 所有引用 state-machines/spec.md 的檔案**
  ```bash
  grep -rn "state-machines/spec.md" openspec/ memory/ CLAUDE.md .claude/ | grep -v "archive/"
  ```
- [ ] **Step 2: 逐一更新引用（改指新模組 spec 或 wiki 卡）**
- [ ] **Step 3: 更新 config.yaml（若有引用）**
- [ ] **Step 4: 更新 spec-registry.md（標記廢除）**
- [ ] **Step 5: Commit**

### Task D3：最終驗證

- [ ] **Step 1: 確認無斷連結**
- [ ] **Step 2: 確認所有 wiki 狀態機卡都有 § 狀態列舉（正本）**
- [ ] **Step 3: Final Commit**

---

## 工單收回目標狀態（卡點備註）

Phase B 搬 work-order 時需確認：工單收回後狀態是回「草稿」（描述段 L204）還是回「製程確認中」（Scenario L250）？Miles 需拍板。

## 已識別但不在本次處理的 OQ

- BI-20：三方對帳公式精確度差異（已建 OQ，待後續處理）
