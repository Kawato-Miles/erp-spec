# business-processes/spec.md 搬遷計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 `openspec/specs/business-processes/spec.md` 的 42 條 Requirement 搬遷至對應 wiki 卡與模組 spec，然後廢除 business-processes spec + user-roles spec + 清理 config.yaml。

**Architecture:** 三階段執行：A 商業規則搬 wiki → B 系統行為搬模組 spec → C 廢除 spec + config 清理。搬遷時只搬內容、不重複（wiki 已有的不再貼一份，只確認一致後標註引用）。

**Tech Stack:** Markdown 文件重構，無程式碼。OpenSpec spec + Obsidian wiki（ERP_Vault）。

**背景**：
- wiki（BRD）是商業邏輯正本，OpenSpec（PRD）是系統行為規格正本
- business-processes/spec.md 混裝了商業規則與系統行為，違反單一正本原則
- user-roles/spec.md 的角色職責正本在 wiki `03-roles/`，同樣需廢除
- 搬遷分類依據見本次對話的盤點表（42 條分類：16 純商業規則 / 11 純系統行為 / 15 混合型）

---

## 前置確認

執行前確認以下條件：

1. `openspec/specs/business-processes/spec.md` 存在且為最新（最近 commit 含 review-return-and-confirm-production sync）
2. `openspec/specs/user-roles/spec.md` 存在
3. wiki `04-business-logic/` 下的對應卡已更新至最新（含本次 change 的矛盾修正）

---

## Phase A：商業規則搬 wiki（16 條純商業規則 + 15 條混合型的商業規則部分）

### 原則

- wiki 已有對應卡且內容一致 → 不搬，只在 spec 中標註「正本見 wiki [[卡名]]」
- wiki 已有但內容不完整 → 補到 wiki 卡，spec 中標註引用
- wiki 沒有對應卡 → 新建 wiki 卡或併入既有卡
- 混合型 Requirement 的商業規則部分 → 摘出併入 wiki 卡，系統行為部分留給 Phase B

### Task A1：確認 wiki 已有的商業規則（不需搬遷）

**Files:** 讀取，不修改

以下 Requirement 的商業規則內容已在 wiki 對應卡中，確認一致即可：

- [ ] **Step 1: 逐條比對確認一致**

| # | Requirement | 對應 wiki 卡 | 確認內容 |
|---|------------|-------------|---------|
| 4 | 印件數量計算規則 | [[數量換算規則]] + [[齊套邏輯]] | 三層計算一致 |
| 7 | 多工單出貨齊套性邏輯 | [[齊套邏輯]] § 三 情境 3 | SHP-002 公式一致 |
| 10 | 打樣流程規則 | [[打樣流程]] | 三分支一致 |
| 14 | 數量換算關鍵欄位定義 | [[數量換算規則]] | 三欄位定義一致 |
| 15 | 四層計算精確流程 | [[齊套邏輯]] § 二 | 四層公式一致（已修正 QCRecord → 報工紀錄） |
| 28 | 三方對帳計算規則 | [[對帳一致性]] | invariant 公式一致 |
| 38 | 補收/退款不對稱操作流 | [[訂單異動規則]] + [[明細時點分界]] | 分水嶺規則一致 |
| 41 | 三方對帳對齊驗證 | [[對帳一致性]] | 延伸驗證一致 |

若任一條不一致 → 以 spec（較新）為準更新 wiki 卡，記錄差異。

- [ ] **Step 2: Commit 確認紀錄（若有 wiki 更新）**

### Task A2：wiki 已有但需補充的商業規則

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/印件生產流程.md`
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/稿件管理規則.md`
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/付款發票邏輯.md`
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md`

| # | Requirement | 目標 wiki 卡 | 需補充內容 |
|---|------------|-------------|----------|
| 2 | 業務流程五大階段 | [[印件生產流程]] | 已有但過時（缺售後階段），Phase C 廢除 spec 時一起處理 |
| 11 | 稿件管理規則（混合）| [[稿件管理規則]] | 確認備註雙向切分 / 鎖定原則已完整 |
| 12 | 工單分派流程（混合）| [[印件生產流程]] | 確認「一工單一印務」規則已有 |
| 24 | 審稿階段流程（混合）| [[審稿分配規則]] + [[免審決策樹]] | 確認五步流程 / B2C-B2B 分流已有 |
| 25 | 補件流程（混合）| [[稿件管理規則]] | 確認 B2C/B2B 分流已有（矛盾 6 已修） |
| 26 | 訂單異動執行流程（混合）| [[訂單異動規則]] | 補「OA 回歸純金額載具」「售後走 AST」分流 |
| 27 | 發票異動流程（混合）| [[付款發票邏輯]] | 補發票作廢/折讓/改買受人三情境的業務判斷規則 |
| 32 | OA vs WO 職責分工 | [[訂單異動規則]] | 補「是否涉及金額變動」「是否已完成後」分流原則 |
| 35 | 處理中 Payment SalesAllowance 行為 | [[付款發票邏輯]] | 補「未實際發生的款項不開折讓」invariant |
| 37 | 請款與核銷流程（混合）| [[付款發票邏輯]] | 補「規劃→開票→登錄→核銷」四步流程 |
| 40 | 期次規劃 invariant（混合）| [[對帳一致性]] | 補 invariant 公式（∑期次 = 應收） |
| 42 | 跨齊報稅期作廢 vs 折讓（混合）| [[付款發票邏輯]] | 補「跨齊報稅期 MUST NOT 作廢」法規約束 |

- [ ] **Step 1: 讀每條 Requirement 的描述段 + 讀目標 wiki 卡，判斷需補充什麼**
- [ ] **Step 2: 逐卡補充（block-level edit，只改變動的段落）**
- [ ] **Step 3: 更新所有修改過的卡的 `last-reviewed` 為執行日期**
- [ ] **Step 4: Commit**

### Task A3：需新建或併入的商業規則 wiki 卡

**Files:**
- Modify or Create: wiki `04-business-logic/` 下的卡

| # | Requirement | 處理方式 | 目標 |
|---|------------|---------|------|
| 1 | 單據層級結構 | 併入 [[印件生產流程]] § 補充「單據層級」段 | 需求單→訂單→工單→任務的層級 invariant |
| 5 | QC 單數量限制 | 併入 [[數量換算規則]] | 「可 QC 數量 <= 報工 - 已申請」規則 |
| 6 | 入庫與出貨數量規則 | 併入 [[齊套邏輯]] 或 [[印件生產流程]] | 「QC 通過才入庫、出貨不超入庫」 |
| 9 | 預計生產數量下限 | 併入 [[印件生產流程]] § 四 | 已有此段，確認一致 |
| 19 | 分批出貨累計控制 | 新建 `04-business-logic/出貨規則.md` 或併入 [[印件生產流程]] | 「超過目標警告非阻擋」等出貨特有規則 |
| 22 | 報價單印件填寫原則 | 新建 `04-business-logic/報價印件填寫原則.md` | 同批合併 / 各別拆分 / 打樣大貨分開 |
| 23 | 供應商報價審核流程（混合）| 新建 `04-business-logic/供應商報價規則.md` | 報價→審核→確認/退回的業務流程規則 |
| 30 | 諮詢前置流程端到端（混合）| 新建 `04-business-logic/諮詢收尾規則.md` | 不做大貨/做大貨/流失/取消 四分支業務規則 |
| 31 | 訂單應收計算規則 | 併入 [[對帳一致性]] | 「印件費 + OEC + OA」三層構成 |
| 33 | 售後服務階段流程（混合）| 新建 `04-business-logic/售後服務規則.md` | 五步流程 / 無核可關卡 / 一訂單一未結案 ticket |

- [ ] **Step 1: 讀 spec 中每條 Requirement 的描述段，摘出商業規則部分**
- [ ] **Step 2: 判斷新建 vs 併入**
- [ ] **Step 3: 建卡或補入（遵循 wiki-schema frontmatter 規範 + business-logic-writing-guide 骨架）**
- [ ] **Step 4: 確認每張新卡至少被一張卡連到（禁孤島）**
- [ ] **Step 5: Commit**

---

## Phase B：系統行為搬模組 spec（11 條純系統行為 + 15 條混合型的系統行為部分）

### 原則

- 搬遷時保留完整 Requirement 標題 + 描述 + 所有 Scenario
- 搬入目標 spec 的 `## Requirements` 段末尾
- 描述段中的商業規則引述改為引用 wiki 卡（如「規則正本見 [[齊套邏輯]]」）
- 混合型 Requirement：描述段精簡為純系統行為（移除 why，只留 SHALL/MUST），Scenario 完整保留

### Task B1：搬到 order-management/spec.md

| # | Requirement | 備註 |
|---|------------|------|
| 3 | 需求單轉訂單欄位帶入規則 | 部分可能更適合 quote-request，先搬 order-management |
| 8 | 出貨單作廢回算（SHP-003） | |
| 18 | 出貨建立時機與防呆條件（混合）| 系統行為部分 |
| 20 | 出貨單與印件雙層狀態映射 | |
| 21 | 多印件合併出貨 | |

- [ ] **Step 1: 讀每條完整 Requirement（含所有 Scenario）**
- [ ] **Step 2: 精簡描述段（移除商業規則論述，改引用 wiki）**
- [ ] **Step 3: Append 到 order-management/spec.md `## Requirements` 段末尾**
- [ ] **Step 4: Commit**

### Task B2：搬到 order-billing/spec.md

| # | Requirement | 備註 |
|---|------------|------|
| 27 | 發票異動流程（混合）| 系統行為部分（折讓金額防呆、系統動作） |
| 34 | 業務先填一半再補齊（一般收款） | |
| 37 | 請款與核銷流程（混合）| 系統行為部分（BillingInstallment→Invoice 繼承） |
| 39 | 先收後開操作流 | |
| 40 | 期次規劃 invariant（混合）| 系統行為部分（警示 banner + action button） |
| 42 | 跨齊報稅期作廢 vs 折讓（混合）| 系統行為部分（UI 按鈕呈現、第三方呼叫） |

注意：order-billing/spec.md 可能尚未建立（訂單 spec 重構第二階段 Task 1）。若不存在，先建骨架再搬入。

- [ ] **Step 1: 確認 order-billing/spec.md 是否存在**
- [ ] **Step 2: 讀每條完整 Requirement**
- [ ] **Step 3: 精簡描述段，Append 到 order-billing/spec.md**
- [ ] **Step 4: Commit**

### Task B3：搬到 work-order/spec.md + production-task/spec.md

| # | Requirement | 目標 |
|---|------------|------|
| 13 | 生產任務帶入規則 | work-order/spec.md |
| 16 | 數量計算邊界防呆 | work-order/spec.md |
| 17 | 異動流程數量重算 | work-order/spec.md |

- [ ] **Step 1-3: 同 Task B1 模式**
- [ ] **Step 4: Commit**

### Task B4：搬到其他模組 spec

| # | Requirement | 目標 |
|---|------------|------|
| 23 | 供應商報價審核流程（混合）| production-task/spec.md 或 scheduling-center/spec.md（系統行為部分） |
| 24 | 審稿階段流程（混合）| prepress-review/spec.md（系統行為部分，部分 Scenario 可能已有） |
| 25 | 補件流程（混合）| prepress-review/spec.md（電商介接 ERP 的系統行為部分） |
| 26 | 訂單異動執行流程（混合）| order-adjustment/spec.md |
| 29 | 報價單印件填寫 — 帳務公司延伸 | quote-request/spec.md + order-management/spec.md |
| 30 | 諮詢前置流程端到端（混合）| consultation-request/spec.md + order-management/spec.md |
| 33 | 售後服務階段流程（混合）| after-sales-ticket/spec.md |
| 36 | Migration 期 OA invariant 過渡規則 | order-adjustment/spec.md |

注意：order-adjustment/spec.md 可能尚未建立（同 order-billing）。

- [ ] **Step 1: 確認目標 spec 是否存在**
- [ ] **Step 2: 逐條搬遷（精簡描述段 + 完整 Scenario）**
- [ ] **Step 3: 搬遷後確認目標 spec 中無標題衝突（同名 Requirement 合併而非重複新增）**
- [ ] **Step 4: Commit**

---

## Phase C：廢除 spec + config 清理

### Task C1：廢除 business-processes/spec.md

- [ ] **Step 1: 最終掃描確認 42 條 Requirement 皆已搬遷**

  ```bash
  grep -c "^### Requirement:" openspec/specs/business-processes/spec.md
  ```

  Expected: 42。確認每一條在 Phase A/B 中都有對應處理紀錄。

- [ ] **Step 2: 刪除 spec 檔**

  ```bash
  rm -rf openspec/specs/business-processes/
  ```

- [ ] **Step 3: 更新所有引用 business-processes/spec.md 的檔案**

  ```bash
  grep -rl "business-processes/spec.md" openspec/ memory/ CLAUDE.md
  ```

  將所有引用改為對應的新位置（wiki 卡或模組 spec）。

- [ ] **Step 4: Commit**

### Task C2：廢除 user-roles/spec.md

- [ ] **Step 1: 確認 user-roles/spec.md 中所有角色職責已在 wiki `03-roles/` 對應卡**
- [ ] **Step 2: 確認 user-roles/spec.md 中的 Scenario 已在對應模組 spec**

  user-roles/spec.md 的 Scenario（系統行為）需搬到對應模組 spec：
  - 審稿主管 / 審稿 → prepress-review/spec.md（多數已有）
  - 業務 / 諮詢 → order-management/spec.md + prepress-review/spec.md
  - 業務主管 → order-management/spec.md + after-sales-ticket/spec.md
  - 印務主管 → work-order/spec.md
  - 會計 → order-billing/spec.md

- [ ] **Step 3: 刪除 spec 檔**

  ```bash
  rm -rf openspec/specs/user-roles/
  ```

- [ ] **Step 4: 更新所有引用**
- [ ] **Step 5: Commit**

### Task C3：config.yaml 清理

**Files:**
- Modify: `openspec/config.yaml`
- Modify: `memory/erp/spec-registry.md`

- [ ] **Step 1: config.yaml context 段修正**

  移除第 51-56 行「已遷入 OpenSpec 的資源」中的：
  ```
  - 商業流程 → openspec/specs/business-processes/spec.md
  - 使用者角色 → openspec/specs/user-roles/spec.md
  ```

  改為：
  ```
  - 商業流程 → wiki 04-business-logic/（商業邏輯正本）
  - 使用者角色 → wiki 03-roles/（角色 R&R 正本）
  ```

- [ ] **Step 2: config.yaml rules 段清理 workaround 規則**

  移除 specs rules 第 81 行：
  ```
  - 新增或修改 Requirement 前，須確認與 state-machines / business-processes / user-roles specs 的一致性
  ```

  改為：
  ```
  - 新增或修改 Requirement 前，須確認與 wiki 對應卡（03-roles / 04-business-logic / 05-entities / 06-state-machines）的一致性
  ```

  移除 design rules 第 92-94 行：
  ```
  - 參照 business-processes spec 確認計算邏輯
  - 參照 user-roles spec 確認角色權責
  ```

  改為：
  ```
  - 參照 wiki 04-business-logic/ 確認計算邏輯與業務規則
  - 參照 wiki 03-roles/ 確認角色權責
  ```

- [ ] **Step 3: spec-registry.md 移除兩個 spec**

  移除 business-processes 和 user-roles 兩行。

- [ ] **Step 4: Commit**

### Task C4：最終驗證

- [ ] **Step 1: 確認無斷連結**

  ```bash
  grep -rn "business-processes/spec.md\|user-roles/spec.md" openspec/ memory/ CLAUDE.md .claude/
  ```

  Expected: 0 個結果（或僅在 archive 中）。

- [ ] **Step 2: 確認 wiki 卡反向連結完整**

  用 `obsidian-cli` 檢查新建的 wiki 卡是否被至少一張卡連到。

- [ ] **Step 3: Final Commit**

  ```bash
  git commit -m "refactor: 廢除 business-processes + user-roles spec，商業規則歸 wiki、系統行為歸模組 spec"
  ```

---

## 自檢結果

**覆蓋**：42 條 Requirement 全部有對應處理（Phase A 處理商業規則部分，Phase B 處理系統行為部分，Phase C 廢除 + 清理）。

**風險**：
- order-billing/spec.md 和 order-adjustment/spec.md 可能尚未建立（訂單 spec 重構第二階段），搬遷時需先建骨架
- 混合型 Requirement 的拆分需判斷力，商業規則 vs 系統行為的邊界可能模糊，遇到卡點停下來問 Miles
