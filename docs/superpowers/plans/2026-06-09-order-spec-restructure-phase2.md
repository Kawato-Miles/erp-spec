# 訂單模組規格重構（第二階段）實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 order-management/spec.md 拆分為三個 spec（order-management / order-billing / order-adjustment），並將訂單與印件的 Data Model 正本從 OpenSpec 遷移至 wiki 實體卡，同時搬遷 state-machines/spec.md 中訂單相關段落。

**Architecture:** 四階段依序執行：A 拆 spec → C 狀態機搬遷 → B Data Model 遷 wiki → D 規則同步。拆 spec 先定結構（新 spec 的 Requirement 歸屬），狀態機段落搬進目標 spec 後，再把業務欄位表遷入 wiki 實體卡，最後更新所有引用規則。

**Tech Stack:** Markdown 文件重構，無程式碼。OpenSpec spec + Obsidian wiki（ERP_Vault）。

---

## 前置確認

執行前確認以下條件成立：

1. `openspec/specs/order-management/spec.md` 為 3810 行（第一階段完成狀態）
2. `openspec/specs/order-billing/` 和 `openspec/specs/order-adjustment/` 尚不存在
3. wiki 實體卡「訂單.md」和「印件.md」存在且不含業務欄位表

---

## Task 1: 建立 order-billing spec（帳務 Requirement 搬遷）

**Files:**
- Create: `openspec/specs/order-billing/spec.md`
- Modify: `openspec/specs/order-management/spec.md`

以下 Requirement 從 order-management 搬入 order-billing（依主題分群）：

**發票群組：**
- 帳務公司管理（BillingCompany）（L648）
- 發票開立（藍新 Mockup）（L664）
- 發票作廢與折讓（L706）
- Invoice 折讓衍生標籤（derived，不入狀態機）（L760）
- 折讓單（SalesAllowance）建立、確認、作廢（L803）
- Invoice Data Model 與 ezpay 連結（L1805）
- SalesAllowanceFile 折讓回簽附件（L1850）
- 發票品項符合 ezPay 與電子發票法規硬約束（L2288）
- 發票 Tab 雙層展開（發票列表 + 折讓單子層）（L2925）
- 發票詳情 Side Panel（InvoiceDetailSidePanel）（L2929）
- 發票開立 Dialog 版型（Figma 9041:297881 對齊）（L2933）
- 發票金額誤差核銷規則（L3182）

**收款群組：**
- 退款 Payment 與折讓分離（先記退款，再開折讓）（L832）
- Payment 跨實體轉移（L1256）
- Payment 修正路徑（已完成不可改回處理中）（L2099）
- 一般收款列表編輯入口（L2146）
- 退款 Payment 切已完成顯示銷貨折讓弱提示（二者並存）（L2150）
- 處理中 Payment 老化追蹤（L2154）
- 處理中 Payment 不入會計帳本（GL 邊界規範）（L2188）
- Payment 邏輯刪除（取消已完成 Payment 保留稽核軌跡）（L2213）
- 收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導（L2909）
- 退款流程三組件（L3214）

**期次群組：**
- 請款期次（BillingInstallment）統一實體（L2539）
- 請款期次（BillingInstallment）行為規則（L2558）
- 收款核銷分配（PaymentAllocation 業務手動入帳）（L2639）
- BillingInstallment 品項鏈式預填（L2353）

**對帳群組：**
- 三方對帳檢視面板（L1082）
- 會計批次對帳檢視（L1138）
- 對帳警示 banner 觸發條件（L1428）
- 三方對帳警示 banner（期次規劃 invariant）（L2712）
- 對帳差錯偵測涵蓋已取消但有開立發票訂單（L2937）
- 對帳 CSV 匯出（14 欄定稿）（L2771）
- 應收帳款帳齡底層欄位與訂單列表帳齡篩選（L1163）

**計價 / KPI / 諮詢帳務 / 跨 OA 群組：**
- 雙欄計價輸入與顯示（L1712）
- 訂單金額 Data Model 雙欄擴充（L1970）
- 營運管理 KPI 定義（收款 / 開票）（L2814）
- OrderActivityLog 擴充 6 個事件型別（L2890）
- 諮詢訂單帳務處理（發票 / 期次 / 對帳）（L1309）
- PaymentFile 收款對帳附件（L1886）
- 補收 OA 規則（免審 + 大額監督）（L2674）
- 退款 OA（負項）沿用業務主管核可 + 不進期次（L2724）
- 廢止「付款計畫變更觸發訂單回業務主管審核」（L2759）
- 既有資料 Migration（一次性 backfill）（L2122）
- 付款計畫變更分階段稽核 — 已廢止（L3280）

**搬遷後 order-billing 的 Data Model 段落：**
- ERD（billing 子圖：Invoice / InvoiceItem / SalesAllowance / SalesAllowanceFile / Payment / PaymentAllocation / PaymentFile / BillingInstallment / BillingActivityEvent）
- 對應 9 個實體表

**步驟：**

- [ ] **Step 1.1: 建立 order-billing spec 骨架**

  建立 `openspec/specs/order-billing/spec.md`，包含：
  - 標準 OpenSpec 標頭（版本 v0.1、描述、相關 spec 引用）
  - `## Requirements` 段
  - `## Data Model` 段（ERD + 實體表預留位置）

- [ ] **Step 1.2: 逐群搬遷 Requirement 至 order-billing**

  從 order-management/spec.md 剪下上列 Requirement（含其下所有 Scenario），貼入 order-billing/spec.md `## Requirements` 段。保持 Requirement 在原 spec 中的相對順序。

  **搬遷時的跨 spec 引用處理**：
  - Requirement 內引用其他 Requirement 標題的，改為跨 spec 引用格式 `[Requirement 標題](../order-management/spec.md#requirement-xxx)` 或 `[Requirement 標題](../order-billing/spec.md#requirement-xxx)`
  - 引用 Data Model 段的（如 `§ Payment`、`§ BillingInstallment`），若 Data Model 也搬到 order-billing，引用不需改；若引用的 Data Model 留在 order-management（如 `§ Order`），改為跨 spec 引用

- [ ] **Step 1.3: 搬遷 billing Data Model 至 order-billing**

  從 order-management/spec.md § Data Model 剪下以下實體表：
  - Invoice / InvoiceItem / SalesAllowance / SalesAllowanceFile / Payment / PaymentAllocation / PaymentFile / BillingInstallment / BillingActivityEvent / PaymentPlan（已廢止）/ PlannedInvoice（已廢止）

  在 order-billing 建立 billing 子圖 ERD（從原 ERD 提取 billing 關聯部分）。

  **order-management ERD 更新**：原 ERD 移除 billing 實體，改為邊界標記 `→ 見 order-billing/spec.md`。

- [ ] **Step 1.4: order-management 留下 billing 引用標記**

  在 order-management 原 Requirement 位置留下引用標記：

  ```markdown
  > 帳務相關 Requirement（發票 / 折讓 / 收款 / 期次 / 對帳 / KPI）已搬遷至 [order-billing/spec.md](../order-billing/spec.md)。
  ```

- [ ] **Step 1.5: 驗證 order-billing 完整性**

  Run: `grep -c "^### Requirement:" openspec/specs/order-billing/spec.md`

  Expected: 約 40 個 Requirement（發票 12 + 收款 10 + 期次 4 + 對帳 7 + 計價/KPI/跨OA 11）。實際數字以搬遷後計數為準。

  Run: `grep -c "^### Requirement:" openspec/specs/order-management/spec.md`

  Expected: 原 87 個（101 − 14 非 Requirement 行標題）減去搬出數量。

- [ ] **Step 1.6: Commit**

  ```bash
  git add openspec/specs/order-billing/spec.md openspec/specs/order-management/spec.md
  git commit -m "refactor: 從 order-management 拆出 order-billing spec（帳務 Requirement + Data Model）"
  ```

---

## Task 2: 建立 order-adjustment spec（異動 Requirement 搬遷）

**Files:**
- Create: `openspec/specs/order-adjustment/spec.md`
- Modify: `openspec/specs/order-management/spec.md`

以下 Requirement 從 order-management 搬入 order-adjustment：

1. 訂單異動（OrderAdjustment）建立與審核（L860）
2. OrderAdjustment.adjustment_type 完整 enum（L1038）
3. OrderExtraCharge vs OrderAdjustment.fee 時間邊界（L1468）
4. 業務主管批次審核 OrderAdjustment（user story）（L1185）
5. 業務一鍵開發票（user story）（L1153）

**搬遷後 order-adjustment 的 Data Model 段落：**
- OrderAdjustment / OrderAdjustmentItem 兩個實體表（從 order-management 剪下）

**注意**：OrderExtraCharge 留在 order-management（訂單建立時的費用明細，非事後異動）。

**步驟：**

- [ ] **Step 2.1: 建立 order-adjustment spec 骨架**

  建立 `openspec/specs/order-adjustment/spec.md`，包含：
  - 標準 OpenSpec 標頭（版本 v0.1）
  - `## Requirements` 段
  - `## Data Model` 段

- [ ] **Step 2.2: 搬遷 5 個 Requirement + 2 個 Data Model 實體表**

  從 order-management 剪下上列 5 個 Requirement（含 Scenario）+ OrderAdjustment / OrderAdjustmentItem 實體表。

  **跨 spec 引用處理**：
  - OA Requirement 引用 Order 欄位的（如 `Order.totalAmount`），改為跨 spec 引用
  - OA Requirement 引用 billing Requirement 的（如補收 OA），已在 Task 1 搬到 order-billing，引用改指 order-billing

- [ ] **Step 2.3: order-management 留下 adjustment 引用標記**

  ```markdown
  > 訂單異動相關 Requirement（OA 建立審核 / adjustment_type / 時間邊界 / 批次審核）已搬遷至 [order-adjustment/spec.md](../order-adjustment/spec.md)。
  ```

- [ ] **Step 2.4: 驗證**

  Run: `grep -c "^### Requirement:" openspec/specs/order-adjustment/spec.md`

  Expected: 5

- [ ] **Step 2.5: Commit**

  ```bash
  git add openspec/specs/order-adjustment/spec.md openspec/specs/order-management/spec.md
  git commit -m "refactor: 從 order-management 拆出 order-adjustment spec（異動 Requirement + Data Model）"
  ```

---

## Task 3: 登記新 spec 至 config.yaml 與 spec-registry

**Files:**
- Modify: `openspec/config.yaml`
- Modify: `memory/erp/spec-registry.md`

- [ ] **Step 3.1: 更新 config.yaml**

  在 `context:` 段 `OpenSpec Specs` 描述中加入 order-billing 和 order-adjustment。

- [ ] **Step 3.2: 更新 spec-registry.md**

  新增兩行：

  ```markdown
  | 訂單帳務 | `openspec/specs/order-billing/spec.md` | — | v0.1 | 草稿 |
  | 訂單異動 | `openspec/specs/order-adjustment/spec.md` | — | v0.1 | 草稿 |
  ```

  更新 order-management 版本號（v1.19 → v1.20 或依慣例遞增）。

- [ ] **Step 3.3: Commit**

  ```bash
  git add openspec/config.yaml memory/erp/spec-registry.md
  git commit -m "refactor: 登記 order-billing、order-adjustment 至 config.yaml 與 spec-registry"
  ```

---

## Task 4: 狀態機段落搬遷（state-machines → order-management）

**Files:**
- Modify: `openspec/specs/state-machines/spec.md`
- Modify: `openspec/specs/order-management/spec.md`

從 state-machines/spec.md 搬出以下訂單相關段落（轉換規則搬到 order-management，狀態列舉已在 wiki 訂單狀態卡）：

| 段落 | 行範圍（約） | 目標 |
|------|------------|------|
| 訂單狀態機 | L184-330 | order-management § Requirements（新 Requirement 或合併既有「訂單狀態機」Requirement） |
| 訂單狀態不可逆 | L331-352 | order-management § Requirements |
| 訂單審稿段 Bubble-up 派生 | L752-811 | order-management § Requirements |
| 諮詢取消終態收斂 | L1271-1294 | order-management § Requirements |
| 負責業務改派的狀態約束 | L1325-1356 | order-management § Requirements |
| 訂單前段審核通過狀態 | L1357-末 | order-management § Requirements |

**暫不動的 OA 相關段落（留在 state-machines）：**
- OA 狀態機（L812-890）
- OA 修訂（L1211-1245）
- 諮詢退費 OA 系統建已核可（L1295-1324）

**步驟：**

- [ ] **Step 4.1: 確認 order-management 已有「訂單狀態機」Requirement**

  order-management/spec.md L201 已有 `### Requirement: 訂單狀態機`（引用 state-machines spec）。
  搬遷時將 state-machines 的完整內容合併進此 Requirement，取代原有的簡短引用。

- [ ] **Step 4.2: 搬遷 6 個段落**

  逐段從 state-machines/spec.md 剪下，合併至 order-management/spec.md 對應位置。

  **合併策略**：
  - 「訂單狀態機」完整段（含三條前段路徑、共用段、免審快速路徑）→ 取代 order-management L201 的簡短引用
  - 「訂單狀態不可逆」→ 新增為 order-management 獨立 Requirement
  - 其餘 4 段 → 各為獨立 Requirement

- [ ] **Step 4.3: state-machines 留下引用標記**

  在 state-machines/spec.md 原段落位置留：

  ```markdown
  > 訂單狀態機相關 Requirement 已搬遷至 [order-management/spec.md](../order-management/spec.md#requirement-訂單狀態機)。
  ```

- [ ] **Step 4.4: 更新 wiki 訂單狀態卡 `implemented-by`**

  修改 `memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md` frontmatter：

  ```yaml
  implemented-by:
    - "openspec/specs/order-management/spec.md#Requirement: 訂單狀態機"
    - "openspec/specs/order-management/spec.md#Requirement: 訂單狀態不可逆"
    - "openspec/specs/order-management/spec.md#Requirement: 諮詢取消諮詢訂單終態收斂（訂單完成 → 已取消）"
  ```

  同步更新「來源」段的 OpenSpec 連結（從 state-machines → order-management）。

- [ ] **Step 4.5: 驗證**

  Run: `grep -c "訂單" openspec/specs/state-machines/spec.md` — 確認訂單段落已移除（只剩引用標記）

  Run: `grep "訂單狀態機" openspec/specs/order-management/spec.md` — 確認完整內容已合併

- [ ] **Step 4.6: Commit**

  ```bash
  git add openspec/specs/state-machines/spec.md openspec/specs/order-management/spec.md memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md
  git commit -m "refactor: 訂單狀態機段落從 state-machines 搬遷至 order-management"
  ```

---

## Task 5: Data Model 遷移 — wiki 訂單實體卡

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/05-entities/訂單.md`
- Modify: `openspec/specs/order-management/spec.md`

將 Order 實體的**業務可見欄位**從 OpenSpec Data Model 遷移至 wiki 訂單實體卡。

**遷移規則（依 memory 記錄的架構方向）：**
- **遷入 wiki**：業務可見欄位表（`| 介面欄位 | 說明 | 欄位形態 | 來源 | 可否修改 |`）+ 實體關係 + 狀態列舉
- **不遷移**：id / created_at / updated_at / FK 技術欄位 / 技術遺留欄位
- **OpenSpec 保留**：轉換規則（Given/When/Then + guard 條件）

**步驟：**

- [ ] **Step 5.1: 在訂單實體卡新增「業務欄位表」段**

  在 `memory/Sens_wiki/wiki/erp/05-entities/訂單.md` 的「需要解釋的資料」段之後、「相關單據」段之前，新增：

  ```markdown
  ## 業務欄位表

  > 完整欄位明細正本。技術欄位（id / FK / created_at / updated_at）不列入。
  > 轉換規則（Given/When/Then）見 OpenSpec [order-management/spec.md](../../../../openspec/specs/order-management/spec.md) § Requirements。

  | 介面欄位 | 說明 | 欄位形態 | 來源 | 可否修改 |
  |---------|------|---------|------|---------|
  | 訂單編號 | 系統自動產生 | 文字 | 系統 | 否 |
  | 訂單類型 | 線下 / 線上(EC) / 諮詢 | 單選 | 系統 / 來源 | 否 |
  | 狀態 | 依 [[訂單狀態]] | 單選 | 系統 | 否 |
  | 客戶 | 下單客戶 | 關聯 | 需求單帶入 | 否 |
  | 負責業務 | 負責這張訂單的業務人員 | 關聯 | 建立時帶入 | 改派可變更 |
  | 來源需求單 | 從哪張需求單成交 | 關聯 | 成交時帶入 | 否 |
  | 來源諮詢單 | 從哪次諮詢來的 | 關聯 | 諮詢收尾帶入 | 否 |
  | 帳務公司 | 發票開立主體（藍新） | 關聯 | 需求單帶入 | 否（成立後鎖定） |
  | 案名 | 專案名稱 | 文字 | 需求單帶入 | 是 |
  | 審核業務主管 | 訂單審核的主管 | 關聯 | 草稿建立時指派 | 審核通過後鎖定 |
  | 是否需審核 | 線下單預設需審核 | 布林值 | 系統設定 | 否 |
  | 收款條件備註 | 從需求單帶入並鎖定，避免成交後被竄改 | 文字 | 需求單帶入 | 審核通過後鎖定 |
  | 上次核准備註快照 | 主管核准時的條件快照，退回重審時對照用 | 文字 | 系統 | 否 |
  | 送審時間 | 業務送主管審核的時間 | 日期時間 | 系統 | 否 |
  | 報價單外發時間 | 業務送報價單給客戶的時間 | 日期時間 | 系統 | 否 |
  | 訂單複製來源 | 這張訂單是從哪張複製的 | 關聯 | 複製時帶入 | 否 |
  | 客戶交期 | 客戶確認的最終交期 | 日期 | 手動 | 是（完成前） |
  | 審稿前預計出貨日 | 預計出貨（審稿前版本） | 日期 | 手動 | 是（完成前） |
  | 審稿後預計出貨日 | 預計出貨（審稿後版本） | 日期 | 手動 | 是（完成前） |
  | 內部製作截止日 | 內部製作截止 | 日期 | 手動 | 是（完成前） |
  | 付款狀態 | 未付款 / 已付款 / 部分退款 / 已退款（derived） | 單選 | 系統推導 | 否 |
  | 回簽時間 | 線下單客戶回簽時間 | 日期時間 | 上傳首份回簽檔或手動 | 否 |
  | 訂單總額（含稅） | 含稅金額合計 | 金額 | 計算 | 否 |
  | 訂單總額（未稅） | 未稅金額合計 | 金額 | 計算 | 否 |
  | 稅額 | = 含稅 − 未稅 | 金額 | 計算 | 否 |
  | 稅率 | 訂單適用稅率（預設 5%） | 數字 | 系統 | 否 |
  | 折扣金額 | 含稅折扣 | 金額 | 手動 | 是（完成前） |
  | 紅利金額 | 含稅紅利 | 金額 | 手動 | 是（完成前） |
  | 運費（含稅 / 未稅） | 運費雙欄 | 金額 | 手動 | 是（完成前） |
  | 諮詢費（含稅 / 未稅） | 諮詢費雙欄 | 金額 | 手動 | 是（完成前） |
  | 其他費用（含稅 / 未稅） | 其他費用雙欄 | 金額 | 手動 | 是（完成前） |
  | 是否急件 | 急件標記 | 布林值 | 手動 | 是 |
  | 是否補收款訂單 | 此訂單為補收款用 | 布林值 | 系統 | 否 |
  | 主訂單 | 補收款主訂單 | 關聯 | 系統 | 否 |
  | 窗口聯絡人 | 客戶窗口聯絡人 | 關聯 | 需求單帶入 | 線下可切換 |
  | 客戶備註 | 線上單客戶填寫 | 文字 | 客戶 | 否 |
  | 內部員工備註 | 公司內部備註，客戶不可見 | 文字 | 手動 | 是 |
  | 製作備註 | 線下單製作 / 交易 / 出貨備註 | 文字 | 手動 | 是 |
  ```

  以上欄位表從 OpenSpec Data Model: Order 精煉而來，排除技術欄位，用業務語言描述。

- [ ] **Step 5.2: 更新訂單實體卡其他段落**

  - 移除「需要解釋的資料」段開頭的「完整清單以下方 `implemented-by` 指向的 OpenSpec 規格 § Data Model: Order 為正本，本卡不重抄」，改為「業務欄位表見下方 § 業務欄位表，為業務可見欄位正本」
  - 更新 frontmatter `implemented-by`：移除 `"openspec/specs/order-management/spec.md#Data Model: Order"` 行（正本已在本卡）
  - 更新 `last-reviewed: 2026-06-09`
  - 「來源」段移除指向 OpenSpec Data Model 的引用

- [ ] **Step 5.3: OpenSpec order-management Data Model 段精簡**

  order-management/spec.md § Data Model 的 Order 實體表，改為引用 wiki：

  ```markdown
  ### Order

  > 業務欄位正本已遷移至 wiki 實體卡 [[訂單]]（`memory/Sens_wiki/wiki/erp/05-entities/訂單.md` § 業務欄位表）。
  > 以下僅保留技術欄位備忘（id / FK / 時間戳 / 遺留欄位），完整業務欄位見 wiki。
  ```

  保留技術欄位表（id / created_at / updated_at / FK 對照 / 遺留欄位），或視行數直接全刪改為純引用。

- [ ] **Step 5.4: 同步處理 OrderItem / OrderAttachment / OrderSignedFile / OrderExtraCharge**

  這四個子實體的業務欄位：
  - **OrderItem**：欄位極少（5 欄），直接寫入 wiki 訂單實體卡的「關鍵關聯」段補充，不獨立成卡
  - **OrderAttachment / OrderSignedFile**：附件類子實體，欄位結構性質強，在訂單卡「關鍵關聯」段補充說明即可
  - **OrderExtraCharge**：在訂單卡「關鍵關聯」段說明「包含其他費用明細[]（1:N）→ 訂單建立時的非印件費用（運費 / 急件費 / 諮詢費等）」

- [ ] **Step 5.5: 驗證**

  確認 wiki 訂單卡有「業務欄位表」段且欄位數 ≥ 30。
  確認 OpenSpec Order 段已改為引用或精簡至技術欄位。

- [ ] **Step 5.6: Commit**

  ```bash
  git add memory/Sens_wiki/wiki/erp/05-entities/訂單.md openspec/specs/order-management/spec.md
  git commit -m "refactor: 訂單 Data Model 業務欄位正本遷移至 wiki 實體卡"
  ```

---

## Task 6: Data Model 遷移 — wiki 印件實體卡

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/05-entities/印件.md`
- Modify: `openspec/specs/order-management/spec.md`

將 PrintItem / PrintItemExpectedLine / PrintItemFile 的業務可見欄位遷移至 wiki 印件實體卡。

**步驟：**

- [ ] **Step 6.1: 在印件實體卡新增「業務欄位表」段**

  在 `memory/Sens_wiki/wiki/erp/05-entities/印件.md` 的「需求單帶過來後的同步行為」段之後、「關鍵關聯」段之前，新增：

  ```markdown
  ## 業務欄位表

  > 完整欄位明細正本。技術欄位（id / FK / created_at / updated_at）不列入。
  > 轉換規則見 OpenSpec [order-management/spec.md](../../../../openspec/specs/order-management/spec.md) § Requirements。

  | 介面欄位 | 說明 | 欄位形態 | 來源 | 可否修改 |
  |---------|------|---------|------|---------|
  | 名稱 | 印件名稱 | 文字 | 需求單帶入 | 是 |
  | 類型 | 打樣 / 大貨 / 補印 | 單選 | 建立時決定 | 否 |
  | 規格備註 | 印刷規格說明 | 文字 | 手動 | 是 |
  | 單位 | 個 / 冊 / 張 / 式 | 單選 | 手動 | 是（訂單階段） |
  | 購買數量 | 客戶購買數量 | 數字 | 需求單帶入 | 是 |
  | 目標數量 | 跨工單加總（derived） | 數字 | 系統 | 否 |
  | 生產數量 | 報工累計（derived） | 數字 | 系統 | 否 |
  | 入庫數量 | QC 通過（derived） | 數字 | 系統 | 否 |
  | 出貨數量 | 出貨累計（derived） | 數字 | 系統 | 否 |
  | 累計已出貨數量 | 多印件分次出貨追蹤 | 數字 | 系統 | 否 |
  | 預計產線 | 多選產線 | 多選 | 手動 | 是 |
  | 審稿狀態 | 稿件未上傳 / 等待審稿 / 已補件 / 合格（見 [[印件狀態]]） | 單選 | 系統 | 否 |
  | 生產狀態 | 等待中 / 工單已交付 / ... / 已棄用（見 [[印件狀態]]） | 單選 | 系統 | 否 |
  | 打樣結果 | 待確認 / OK / NG-製程問題 / NG-稿件問題 | 單選 | 審稿 | 打樣印件專用 |
  | 稿件上傳開放 | 是否開放客戶上傳 | 布林值 | 手動 | 是 |
  | 首次稿件上傳時間 | 首次上傳稿件的時間 | 日期時間 | 系統 | 否 |
  | 成品縮圖 | 審稿人員上傳的成品縮圖 | 文字（網址） | 審稿人員 | 是 |
  | 難易度 | 審稿難易度（1-10） | 數字 | 需求單繼承 | 是（parity 同步） |
  ```

  **PrintItemFile 子實體**摘要寫在「關鍵關聯」段：
  - 包含稿件檔案[]（1:N）→ 每件印件的上傳檔案（印件檔 / 縮圖兩種角色），按審稿輪次分組

- [ ] **Step 6.2: 更新印件實體卡其他段落**

  - 移除 `implemented-by` 中的 `"openspec/specs/order-management/spec.md#Data Model: PrintItem"` 行
  - 更新定位語句，改為「業務欄位表見下方 § 業務欄位表」
  - 更新 `last-reviewed: 2026-06-09`
  - 「來源」段移除指向 OpenSpec Data Model 的引用

- [ ] **Step 6.3: OpenSpec order-management Data Model 段精簡**

  PrintItem / PrintItemExpectedLine / PrintItemFile 實體表改為引用 wiki：

  ```markdown
  ### PrintItem

  > 業務欄位正本已遷移至 wiki 實體卡 [[印件]]（`memory/Sens_wiki/wiki/erp/05-entities/印件.md` § 業務欄位表）。
  > 以下僅保留技術欄位備忘。
  ```

- [ ] **Step 6.4: 驗證**

  確認 wiki 印件卡有「業務欄位表」段且欄位數 ≥ 15。

- [ ] **Step 6.5: Commit**

  ```bash
  git add memory/Sens_wiki/wiki/erp/05-entities/印件.md openspec/specs/order-management/spec.md
  git commit -m "refactor: 印件 Data Model 業務欄位正本遷移至 wiki 實體卡"
  ```

---

## Task 7: 規則同步更新

**Files:**
- Modify: `CLAUDE.md`
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md`
- Modify: `memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md`

- [ ] **Step 7.1: 更新 CLAUDE.md § wiki 與 OpenSpec 分工**

  目前：
  ```
  系統設計細節（欄位 / 狀態列舉 / 權限 / 驗收）只寫在 OpenSpec
  ```

  改為：
  ```
  業務可見欄位表 + 狀態列舉 = wiki 實體卡 / 狀態機卡正本；
  功能 Requirement（含轉換規則 Given/When/Then、guard 條件、驗收 Scenario）= OpenSpec 正本。
  ```

  同步更新「載入原則」表的「資料模型」row，從「各模組 spec § Data Model」改為「Vault `05-entities/` + 各模組 spec § Data Model（技術欄位）」。

- [ ] **Step 7.2: 更新 scope-boundary.md**

  § 一「資料模型實體與欄位」row 說明從「10 個實體卡」擴充為含業務欄位表。

  § 二 不收段新增說明：「OpenSpec Data Model 段僅保留技術欄位備忘（id / FK / 時間戳），業務欄位正本在 wiki 實體卡」。

- [ ] **Step 7.3: 更新實體卡模板 _template-entity.md**

  在「核心欄位」段之後新增「業務欄位表」段模板：

  ```markdown
  ## 業務欄位表

  > 完整欄位明細正本。技術欄位（id / FK / created_at / updated_at）不列入。
  > 轉換規則見 OpenSpec [<模組>/spec.md](../../../../openspec/specs/<模組>/spec.md) § Requirements。

  | 介面欄位 | 說明 | 欄位形態 | 來源 | 可否修改 |
  |---------|------|---------|------|---------|
  | ... | ... | ... | ... | ... |
  ```

  更新 Lint 自檢清單，新增一項：
  ```
  - [ ] **業務欄位表**（已遷移的實體）：欄位數 ≥ 實體主要欄位數；無技術欄位（id/FK/timestamp）；說明欄用業務語言。
  ```

- [ ] **Step 7.4: 驗證**

  Run: `grep "業務欄位表" CLAUDE.md` — 確認分工段已更新
  Run: `grep "業務欄位表" memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md` — 確認模板已更新

- [ ] **Step 7.5: Commit**

  ```bash
  git add CLAUDE.md memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md memory/Sens_wiki/wiki/erp/05-entities/_template-entity.md
  git commit -m "refactor: 更新正本歸屬規則（業務欄位表歸 wiki、技術欄位留 OpenSpec）"
  ```

---

## Task 8: 跨 spec 引用完整性檢查

**Files:** 無新增修改，純驗證

- [ ] **Step 8.1: 檢查 order-management 內部引用**

  Run: `grep -n "§ Payment\|§ Invoice\|§ BillingInstallment\|§ OrderAdjustment" openspec/specs/order-management/spec.md`

  Expected: 所有引用已改為跨 spec 引用（指向 order-billing 或 order-adjustment），或已移除。

- [ ] **Step 8.2: 檢查 order-billing 內部引用**

  Run: `grep -n "§ Order\b" openspec/specs/order-billing/spec.md`

  Expected: 引用指向 `../order-management/spec.md`。

- [ ] **Step 8.3: 檢查 wiki 實體卡反向連結**

  確認訂單.md 和印件.md 被其他卡正確連結（至少被 `06-state-machines/訂單狀態.md` 和 `04-business-logic/` 相關卡連到）。

- [ ] **Step 8.4: 更新 memory 記錄**

  更新 `project_order_spec_restructure.md`，標記第二階段完成、記錄最終行數與 Requirement 數。

- [ ] **Step 8.5: Final Commit**

  ```bash
  git add -A
  git commit -m "refactor: 訂單模組規格重構第二階段完成（拆 spec + 狀態機搬遷 + Data Model 遷 wiki）"
  ```

---

## 自檢結果

**Spec 覆蓋**：memory 記錄的四大塊（A 拆 spec / C 狀態機搬遷 / B Data Model 遷 wiki / D 規則同步）均有對應 Task。

**Placeholder 掃描**：Step 5.1 / 6.1 的業務欄位表已填入具體欄位內容，非佔位。

**一致性**：
- wiki 實體卡格式遵循 `_template-entity.md` 骨架
- 新 spec 登記在 config.yaml 和 spec-registry
- 跨 spec 引用在 Task 8 統一驗證
