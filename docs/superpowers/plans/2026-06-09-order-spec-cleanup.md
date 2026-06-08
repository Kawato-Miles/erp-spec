# 訂單管理模組規格精簡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將訂單管理 spec（4,504 行 / 115 Requirement）精簡至約 2,600 行，移除 UI 實作細節、廢止內容、冗餘重複，使規格聚焦於業務規則與系統行為。

**Architecture:** 三階段：(1) 搬遷 18 個 UI Requirement 至 DESIGN.md §10 模組專屬 UI 規格段，spec 內以引用取代；(2) 移除 3 個已廢止 section；(3) 合併 8 組冗餘 Requirement。每階段完成後 commit，確保可回溯。

**Tech Stack:** Markdown 文件編輯（OpenSpec spec.md + Prototype DESIGN.md）

**重要約束：**
- 本計劃為純文件整理，不涉及程式碼變更
- spec 引用其他模組的相對路徑（`../state-machines/spec.md` 等）不可破壞
- Data Model 段落（L4011-4504）本次不動，確保資料模型完整性
- 每個 Task 完成後驗證：grep 確認無斷裂引用

---

### Task 1: 在 DESIGN.md 新增 §10 模組專屬 UI 規格（訂單管理）

**Files:**
- Modify: `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`（在 §9 版本記錄 之前插入 §10）

**目的：** 建立搬遷目標位置，承載從 spec 搬出的 UI 版型內容。

- [ ] **Step 1: 在 DESIGN.md §9 之前插入 §10 段落骨架**

在 `## 9. 版本記錄` 行之前插入：

```markdown
## 10. 模組專屬 UI 規格

> 本段承載各模組從 OpenSpec spec 搬遷出的 UI 版型 / 面板結構 / Dialog 規格。
> 業務規則留在 OpenSpec spec，UI 實作細節移至此處。
> 引用方式：spec 內以 `見 DESIGN.md §10.1.N` 指向對應小節。

### 10.1 訂單管理模組

<!-- Task 2-4 逐批填入子小節 -->
```

- [ ] **Step 2: Commit 骨架**

```bash
git add /Users/b-f-03-029/sens-erp-prototype/DESIGN.md
git commit -m "docs: DESIGN.md 新增 §10 模組專屬 UI 規格骨架

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 搬遷第一批 UI Requirement（詳情頁版型 7 個）

**Files:**
- Modify: `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`（§10.1 內新增子小節）
- Modify: `/Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md`

**搬遷清單（含行號）：**

| # | Requirement | spec 行號 | DESIGN.md 小節 |
|---|------------|----------|---------------|
| 1 | 訂單詳情頁 Tabs 化版型 | 472-523 | §10.1.1 |
| 2 | 訂單詳情頁業務負責人 row 簡化 | 525-552 | §10.1.2 |
| 3 | 訂單詳情頁印件清單表格結構 | 553-632 | §10.1.3 |
| 4 | 印件詳情 Side Panel | 633-775 | §10.1.4 |
| 5 | 訂單詳情頁印件區「印件類型」欄位 | 2309-2323 | §10.1.5 |
| 6 | 訂單詳情頁訂單備註 section | 2324-2360 | §10.1.6 |
| 7 | 訂單備註與 payment_terms_note 共存策略 | 2431-2448 | §10.1.7 |

**搬遷原則：**
- 完整搬遷 Requirement 正文 + 所有 Scenario（含 UI 佈局 Scenario）
- spec 原位替換為 2-3 行摘要 + 引用連結

- [ ] **Step 1: 將 7 個 UI Requirement 完整內容寫入 DESIGN.md §10.1.1-§10.1.7**

每個小節格式：

```markdown
#### 10.1.N [Requirement 名稱]

> 搬遷自 `openspec/specs/order-management/spec.md`，原 Requirement 名稱保留。

[完整內容，含所有 Scenario，原封不動搬遷]
```

- [ ] **Step 2: 修改 spec.md — 將 7 個 Requirement 替換為摘要 + 引用**

替換範本（每個 Requirement 統一格式）：

```markdown
### Requirement: [名稱]

[業務意圖一句話摘要]。UI 版型與佈局細節見 [DESIGN.md §10.1.N](/Users/b-f-03-029/sens-erp-prototype/DESIGN.md)。
```

**具體替換：**

1. **訂單詳情頁 Tabs 化版型**（L472-523 → 3 行）：
   「訂單詳情頁 SHALL 採用 Tabs 化版型，包含 6 個 Tab：資訊 → 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄。Tab 順序、資訊卡排列、條件顯示規則見 DESIGN.md §10.1.1。」

2. **業務負責人 row 簡化**（L525-552 → 3 行）：
   「業務負責人 row 依視角分流：業務視角僅顯示姓名純文字，業務主管視角顯示「改派負責人」入口（見 § 訂單負責業務改派）。UI 呈現細節見 DESIGN.md §10.1.2。」

3. **印件清單表格結構**（L553-632 → 3 行）：
   「訂單詳情頁「印件清單」Tab 的表格 SHALL 採單層 row 結構共 14 欄。欄位定義、操作欄按鈕條件顯示規則見 DESIGN.md §10.1.3。」

4. **印件詳情 Side Panel**（L633-775 → 3 行）：
   「印件清單「檢視」按鈕 SHALL 開啟右側 Side Panel，承載印件資訊 / 印件檔案 / 相關工單 / 審稿紀錄四區塊。Panel 結構與呈現規則見 DESIGN.md §10.1.4。」

5. **印件區「印件類型」欄位**（L2309-2323 → 2 行）：
   「訂單詳情頁印件區 SHALL 顯示「印件類型」欄位（打樣 / 大貨 / 補印），補印與大貨混合排列不獨立分組。UI 呈現見 DESIGN.md §10.1.5。」

6. **訂單備註 section**（L2324-2360 → 3 行）：
   「訂單詳情頁「資訊 Tab」SHALL 含「訂單備註」section，容納 order_note / delivery_note / payment_note 三欄位。編輯走獨立 Dialog（非沿用 OrderInfoEditDialog）。UI 呈現見 DESIGN.md §10.1.6。」

7. **備註與 payment_terms_note 共存策略**（L2431-2448 → 2 行）：
   「payment_note 與 payment_terms_note 同時顯示、位置與 Label 區分（見 DESIGN.md §10.1.7）。payment_terms_note 唯讀，payment_note 依角色與時機開放編輯。」

- [ ] **Step 3: 驗證**

```bash
# 確認 spec 內引用的 §10.1.N 都對得上 DESIGN.md
grep -c "DESIGN.md §10.1" /Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md
# 預期: 7

# 確認 DESIGN.md 內有 7 個子小節
grep -c "#### 10.1\." /Users/b-f-03-029/sens-erp-prototype/DESIGN.md
# 預期: 7
```

- [ ] **Step 4: Commit**

```bash
cd /Users/b-f-03-029/Sens && git add openspec/specs/order-management/spec.md
cd /Users/b-f-03-029/sens-erp-prototype && git add DESIGN.md
# 分兩個 repo commit
```

---

### Task 3: 搬遷第二批 UI Requirement（帳務 / 收款面板 6 個）

**Files:** 同 Task 2

**搬遷清單：**

| # | Requirement | spec 行號 | DESIGN.md 小節 |
|---|------------|----------|---------------|
| 8 | 一般收款列表編輯入口 | 2526-2557 | §10.1.8 |
| 9 | 退款 Payment 切已完成顯示銷貨折讓弱提示 | 2558-2597 | §10.1.9 |
| 10 | 訂單列表印件子層展開 | 3390-3429 | §10.1.10 |
| 11 | 發票 Tab 雙層展開 | 3452-3480 | §10.1.11 |
| 12 | 發票詳情 Side Panel | 3481-3508 | §10.1.12 |
| 13 | 發票開立 Dialog 版型 | 3509-3528 | §10.1.13 |

- [ ] **Step 1: 寫入 DESIGN.md §10.1.8-§10.1.13**

- [ ] **Step 2: 修改 spec.md 替換為摘要 + 引用**

**具體替換：**

8. **一般收款列表編輯入口**（L2526-2557 → 3 行）：
   「OrderPaymentSection 收款紀錄列表每筆 row 操作欄 SHALL 有「編輯」按鈕，開啟 PaymentEditDialog（共用 PaymentEditPanel）。阻擋規則：已完成 → 處理中反向不通過、需走取消重建。UI 呈現見 DESIGN.md §10.1.8。」

9. **退款 Payment 弱提示**（L2558-2597 → 3 行）：
   「退款 Payment 切已完成後，系統 SHALL 顯示非阻擋式弱提示引導開立 SalesAllowance。提示位置：PaymentEditDialog inline banner + 訂單詳情頁 sticky 提示。UI 呈現見 DESIGN.md §10.1.9。」

10. **訂單列表印件子層展開**（L3390-3429 → 3 行）：
    「訂單列表 SHALL 支援 inline expandable row 展開印件子層（5 欄：印件名稱 / 審稿狀態 / 印件狀態 / 交期 / 操作），支援搜尋命中自動展開。UI 呈現見 DESIGN.md §10.1.10。」

11. **發票 Tab 雙層展開**（L3452-3480 → 3 行）：
    「發票 Tab 的發票列表 SHALL 採雙層展開：父層 8 欄（發票）、子層 5 欄（折讓單）。發票級操作集中於父層操作欄。UI 呈現見 DESIGN.md §10.1.11。」

12. **發票詳情 Side Panel**（L3481-3508 → 2 行）：
    「發票「檢視」按鈕 SHALL 開啟發票詳情 Side Panel（唯讀 / 800px），含發票資訊 / 買受人 / 品項明細 / 對應收款四區塊。UI 呈現見 DESIGN.md §10.1.12。」

13. **發票開立 Dialog 版型**（L3509-3528 → 2 行）：
    「發票開立 Dialog SHALL 720px 寬、固定 header/footer、表單可滾動。商品明細 SHALL 透過五欄輸入元件填寫。UI 呈現見 DESIGN.md §10.1.13。」

- [ ] **Step 3: 驗證 + Commit**

---

### Task 4: 搬遷第三批 UI Requirement（混合型拆分 5 個）

**Files:** 同 Task 2

**這批是混合型 Requirement：業務規則留 spec、UI 細節搬 DESIGN.md。**

| # | Requirement | spec 行號 | 處理方式 |
|---|------------|----------|---------|
| 14 | 雙欄計價輸入與顯示 | 1860-1975 | 計算公式 + 輸入規則留 spec；Info Banner 色碼 / flex / 字級搬 §10.1.14 |
| 15 | 訂單詳情頁編輯型 Section 統一編輯時機與角色 | 2832-2900 | 角色權限表 + 編輯時機規則留 spec；Dialog 名稱 / helper function 搬 §10.1.15 |
| 16 | 訂單詳情頁售後服務 Tab 入口 | 2214-2226 | 跨模組引用留 2 行；UI 行為 搬 §10.1.16 |
| 17 | 印件詳情頁工單與生產任務區塊 | 2227-2272 | 齊套性視圖業務規則留 spec；UI 佈局搬 §10.1.17 |
| 18 | 印件詳情頁批次報工入口 | 2273-2295 | 權限規則留 spec；UI 重用元件搬 §10.1.18 |

- [ ] **Step 1: 拆分混合型 Requirement**

**雙欄計價（L1860-1975）— 留 spec 的部分：**

```markdown
### Requirement: 雙欄計價輸入與顯示

訂單 SHALL 採雙欄計價，所有金額欄位同時儲存 `_with_tax` 與 `_without_tax` 兩個值，並於 `Order.tax_amount` 記錄總稅額。

**輸入規則：**
- 線下訂單：業務輸入**未稅金額**，系統依稅率（預設 5%）反推含稅
- 線上訂單：EC 帶入**含稅金額**，系統反推未稅

**計算公式（稅率 r，預設 r = 0.05）：**
with_tax = round(without_tax × (1 + r))
without_tax = round(with_tax / (1 + r))
tax_amount = total_with_tax − total_without_tax

rounding 採整數（小數 0 位，與會計慣例一致）。

退款 / 折讓 / OrderAdjustment 金額 SHALL 沿用雙欄結構；實際收款 Payment.amount 不拆雙欄。

UI 顯示規則（模式 A1 分項表格 + summary 水平 4 欄）見 DESIGN.md §10.1.14。

#### Scenario: 線下單業務輸入未稅金額
[保留原 Scenario L1917-1923]

#### Scenario: 線上單 EC 帶入含稅金額
[保留原 Scenario L1925-1931]

#### Scenario: 雙欄寫入失敗的一致性保護
[保留原 Scenario L1968-1972]
```

搬走的 UI Scenario（L1933-1966: 金額組成分項區 / summary 水平 4 欄 / Info Banner / 折抵 row / 待審核呈現）→ DESIGN.md §10.1.14。

**編輯型 Section 統一（L2832-2900）— 留 spec 的部分：**

```markdown
### Requirement: 訂單詳情頁編輯型 Section 統一編輯時機與角色

4 個編輯型 Section（訂單資訊 / 訂單備註 / 出貨資訊 / 發票設定）：

**統一編輯時機**：`order.status !== '已取消'` 即可編輯。

**統一角色規則**：
[保留角色權限表 L2844-2851]

**廢止**：v1.7「製作後 toast 提示」MUST 移除。

UI 呈現（Dialog 對應、條件顯示）見 DESIGN.md §10.1.15。

#### Scenario: 已取消訂單 4 個 Section 編輯按鈕 disabled
[保留]
```

搬走的 UI Scenario：L2857-2898（5 個 UI 操作 Scenario）→ DESIGN.md §10.1.15。

- [ ] **Step 2: 寫入 DESIGN.md §10.1.14-§10.1.18**

- [ ] **Step 3: 驗證 + Commit**

---

### Task 5: 移除已廢止內容（3 個 section）

**Files:**
- Modify: `/Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md`

- [ ] **Step 1: 移除 PlannedInvoice Data Model（L4273-4280）**

整段已標「已廢止，由 BillingInstallment 取代」。移除後在原位留一行引用：

```markdown
### PlannedInvoice — 已廢止

> 已由 BillingInstallment 取代。完整欄位對應見 [state-machines spec](../state-machines/spec.md) § BillingInstallment。
```

- [ ] **Step 2: 移除 PaymentPlan Data Model（L4356-4359）**

同上：

```markdown
### PaymentPlan — 已廢止

> 已由 BillingInstallment 取代。
```

- [ ] **Step 3: 移除「付款計畫變更分階段稽核」（L3922-3971）**

此 Requirement 引用已廢止的 PaymentPlan 實體，且稽核邏輯已被「期次變更稽核軌跡」（L3078-3089）完整取代。移除後在原位留引用：

```markdown
### Requirement: 付款計畫變更分階段稽核 — 已廢止

> 付款計畫（PaymentPlan）已由 BillingInstallment 取代。分階段稽核邏輯見 § Requirement: 期次變更稽核軌跡。
```

- [ ] **Step 4: 驗證無斷裂引用**

```bash
# 確認 spec 內部引用 PaymentPlan / PlannedInvoice 的地方只剩 Data Model 區的廢止標記
grep -n "PaymentPlan\|PlannedInvoice" /Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md
```

- [ ] **Step 5: Commit**

---

### Task 6: 合併冗餘 Requirement — 第一組（諮詢訂單帳務 3 合 1）

**Files:**
- Modify: `/Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md`

**合併對象：**
- 「諮詢訂單發票時間點處理」（L1544-1571）
- 「諮詢訂單收尾自動建 BillingInstallment 規則」（L1573-1634）
- 「諮詢取消對帳邏輯」（L1636-1672）

→ 合併為「**諮詢訂單帳務處理（發票 / 期次 / 對帳）**」

- [ ] **Step 1: 建立合併後的 Requirement**

合併策略：
1. 以「諮詢訂單帳務處理」為主標題
2. 下分三個子段落（發票時間點 / 自動建期次 / 對帳邏輯），用 `####` 子標題區分
3. 去除三段之間的重複描述（如「consultation_invoice_option 廢止」在兩段各出現一次 → 只留一次）
4. Scenario 全數保留（去重後約 10 個 → 保留不重複的 8 個）

- [ ] **Step 2: 刪除原三段，替換為合併後的單一 Requirement**

- [ ] **Step 3: Commit**

---

### Task 7: 合併冗餘 Requirement — 第二組（BillingInstallment 4 合 1）

**合併對象：**
- 「期次↔發票 1:1 嚴格約束 + 一鍵開票繼承」（L3041-3058）
- 「拆票 = 拆期」（L3059-3077）
- 「期次變更稽核軌跡」（L3078-3090）
- 「期次雙維度狀態」（L3091-3119）

→ 合併為「**請款期次（BillingInstallment）行為規則**」

- [ ] **Step 1: 合併為一個 Requirement，四個子段落**

- [ ] **Step 2: Commit**

---

### Task 8: 合併冗餘 Requirement — 第三組（KPI 指標 4 合 1）

**合併對象：**
- 「收款 / 開票領域營運管理 KPI」（L3295-3324）
- 「訂單收款變更率指標」（L3325-3338）
- 「收款逾期天數指標」（L3339-3358）
- 「諮詢退款 OA 不計入收款變更率」（L3555-3566）

→ 合併為「**營運管理 KPI 定義**」

注意：「應收帳款帳齡底層欄位」（L1398-1418）的 overdue_days 與「收款逾期天數指標」重複定義 → 前者保留帳齡篩選功能需求，指標定義統一在合併後的 KPI 段。

- [ ] **Step 1: 合併為一個 Requirement**

- [ ] **Step 2: 移除 L1398-1418 中與 overdue_days 重複的定義，改為引用**

- [ ] **Step 3: Commit**

---

### Task 9: 合併冗餘 Requirement — 第四到第八組（訂單備註 / 發票作廢 / 退款 / 補收 OA）

**合併清單：**

| 組 | 合併對象 | 合併為 |
|----|---------|-------|
| 4 | 訂單備註三類分欄 + 訂單訂單備註 Data Model + 訂單階段訂單備註編輯權限與時機 | **訂單備註** |
| 5 | 發票作廢（L978）+ 發票作廢與折讓 UI 與規則（L3818） | **發票作廢與折讓** |
| 6 | 退款流程三組件組合 + 主訂單退款三組件進度展示 | **退款流程三組件** |
| 7 | 補收 OA 跳過審核 + 補收 OA 大額閾值監督 | **補收 OA 規則** |
| 8 | 訂單列表與分享權限 + 訂單列表角色可見範圍 | **訂單列表權限與可見範圍** |

- [ ] **Step 1: 逐組合併**

每組策略：
- 合併為單一 `### Requirement:` 標題
- 用 `####` 子標題保留各面向
- 去重（同一 Scenario 出現在兩個 Requirement → 保留一份）
- 保留所有不重複的 Scenario

- [ ] **Step 2: 驗證 + Commit**

---

### Task 10: 最終驗證與收尾

**Files:**
- Read: `/Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md`

- [ ] **Step 1: 行數驗證**

```bash
wc -l /Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md
# 目標: < 2,800 行
```

- [ ] **Step 2: Requirement 數量驗證**

```bash
grep -c "^### Requirement:" /Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md
# 目標: < 75（從 115 降至約 70）
```

- [ ] **Step 3: 斷裂引用檢查**

```bash
# 確認 spec 內所有相對路徑引用仍有效
grep -oP '\(\.\./.+?\)' /Users/b-f-03-029/Sens/openspec/specs/order-management/spec.md | sort -u
# 逐一確認檔案存在

# 確認 DESIGN.md 引用編號連續
grep "#### 10.1\." /Users/b-f-03-029/sens-erp-prototype/DESIGN.md
# 預期: 10.1.1 到 10.1.18 連續
```

- [ ] **Step 4: Requirement 目錄比對**

列出清整後的完整 Requirement 清單，與原 115 個逐一比對：
- 每個原 Requirement 都能對應到「保留 / 搬遷 / 合併 / 移除」四者之一
- 無遺漏、無重複

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: 訂單管理模組規格精簡（4504→~2600 行）

- 搬遷 18 個 UI Requirement 至 DESIGN.md §10
- 移除 3 個已廢止 section（PlannedInvoice / PaymentPlan / 付款計畫變更分階段稽核）
- 合併 8 組冗餘 Requirement
- Data Model 段落未動，業務規則完整保留

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 風險與注意事項

1. **跨模組引用**：其他模組 spec（consultation-request / after-sales-ticket / state-machines）可能引用本 spec 的 Requirement 名稱或行號。合併/改名後需確認外部引用不斷裂。
2. **Prototype 程式碼引用**：Prototype 元件可能在註解中引用 spec 行號（如 `// spec L633`），清整後行號位移，但這些為開發者便利參考、不影響功能。
3. **後續 wiki 比對**：Miles 表示清整後會再比對 wiki 商業需求，本計劃不含此步驟。
