---
type: meta
status: active
last-reviewed: 2026-05-28
---

# 業務領域分類框架（business-domain Taxonomy）

> Vault 卡的「業務領域」分類正本。每張卡 frontmatter `business-domain` 欄位的 enum 值來源。
> 對應稽核時的「載入哪些卡」決策入口（與 [[erp-planning-audit-framework]] 雙軸結構之軸 1 對應）。
> 採業界 7 領域標準（Tharstern / PrintVis / Printavo / DDD Bounded Context 共識）經調整為 6 領域 + 跨領域共用層（Master Data 進共用層 / QC 併進 Production）。

## 一、設計原則

1. **按業務能力（business capability）分類，不按組織單位 / 部門** — DDD Bounded Context 主流；按部門分類會打散同一知識
2. **6 個 L1 領域 + 跨領域共用層** — 6 領域是「業務流程的子能力」，共用層是「跨領域基礎參考資料」
3. **跨領域共用層強制自動載入** — 任何稽核 MUST 自動載入共用層，不需 Claude 手動判斷
4. **觸發詞 → 領域自動 mapping** — 用觸發詞清單實現「Miles 講某詞 Claude 自動載某領域」
5. **領域邊界爭議由演化資料記錄** — 邊界判斷有爭議時記入 § 四，作為後續演化依據

## 二、6 領域定義 + 範疇邊界 + 對應資源 + 觸發詞

### L1.1 商務前置（Pre-sales）

- **範疇**：報價評估 / 諮詢 / 客戶議價前的商業互動
- **對應 OpenSpec 模組**：`quote-request` / `consultation-request`
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/業務.md` § 售前評估 / `03-roles/諮詢.md`
  - 實體：`05-entities/需求單.md` / `05-entities/諮詢單.md`
  - 狀態機：`06-state-machines/需求單狀態.md` / `06-state-machines/諮詢單狀態.md`
  - 業務邏輯：`04-business-logic/報價邏輯.md` / `04-business-logic/難易度機制.md`
  - User Story：`13-user-stories/quote-request/` / `13-user-stories/consultation-request/`
- **觸發詞**：「諮詢」「報價」「需求單」「議價」「諮詢費」「成交」

### L1.2 訂單管理（Order Management）

- **範疇**：訂單建立 / 修改 / 異動 / 變更（不含售後 ticket）
- **對應 OpenSpec 模組**：`order-management`（不含 Payment / Invoice 邏輯 — 屬 L1.6）
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/業務.md` § 線下訂單管理 / `03-roles/業務主管.md`
  - 實體：`05-entities/訂單.md`（核心欄位 / 狀態 / OrderAdjustment 部分）
  - 狀態機：`06-state-machines/訂單狀態.md`
  - User Story：`13-user-stories/order-management/`（非款項 / 非售後 / 非生產類）
- **觸發詞**：「訂單」「訂單異動」「OA」「訂單備註」「訂單取消」

### L1.3 印前審稿（Prepress）

- **範疇**：稿件審查 / 打樣 / 完稿驗收 / 印件規格
- **對應 OpenSpec 模組**：`prepress-review`
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/審稿.md`
  - 實體：`05-entities/印件.md`
  - 狀態機：`06-state-machines/印件狀態.md`
  - 業務邏輯：`04-business-logic/免審決策樹.md` / `審稿分配規則.md` / `稿件管理規則.md` / `打樣流程.md` / `印件檔案備註上限.md`
  - User Story：`13-user-stories/prepress-review/`
- **觸發詞**：「審稿」「打樣」「稿件」「印件規格」「審稿輪次」「ReviewRound」

### L1.4 生產執行（Production）

- **範疇**：工單派工 / 生產排程 / 任務追蹤 / **QC（已併入 ProductionTask）** / 完成度計算
- **對應 OpenSpec 模組**：`work-order` / `production-task`（含 QC type）/ `scheduling-center` / `schedule-backtrack` / `task-dispatch-board` / `work-package`
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/印務.md` / `Supervisor.md` / `生管.md` / `師傅.md` / `QC.md` / `外包廠商.md` / `中國廠商.md`
  - 實體：`05-entities/工單.md` / `生產任務.md` / `QC.md`（已併 ProductionTask）
  - 狀態機：`06-state-machines/工單狀態.md` / `生產任務狀態.md` / `任務狀態.md` / `QC 狀態.md`
  - 業務邏輯：`04-business-logic/齊套邏輯.md` / `數量換算規則.md` / `印件生產流程.md`
- **觸發詞**：「工單」「任務」「派工」「排程」「QC」「品檢」「補印」「工序」「入庫」「NCR」「Disposition」

### L1.5 履約與售後（Fulfillment & After-sales）

- **範疇**：出貨配送 / 售後 ticket / 客訴 / 退換補印（補印 PrintItem 屬此領域觸發 → 但 entity 屬 Prepress；跨領域）
- **對應 OpenSpec 模組**：出貨單（規劃中）/ `after-sales-ticket`
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/出貨.md`
  - 實體：`05-entities/出貨單.md` / `售後服務.md`
  - 狀態機：`06-state-machines/出貨單狀態.md`
- **觸發詞**：「出貨」「配送」「售後」「客訴」「ticket」「補印」「退貨」「客戶不良」

### L1.6 款項與發票（Billing & Cash）

- **範疇**：收款 / 開票 / 對帳 / 退款 / OA 推進 Payment / SalesAllowance / PlannedInvoice / 應收帳款管理
- **對應 OpenSpec 模組**：`order-management` § Payment-Invoice 段（與 L1.2 同 spec 但邏輯切分）
- **對應 Vault 卡（範例）**：
  - 角色：`03-roles/會計.md`（主要對帳）/ `03-roles/業務.md` § 款項 / `03-roles/諮詢.md` § 諮詢費
  - 實體：`05-entities/訂單.md` § Payment / Invoice / OrderAdjustment / SalesAllowance / PlannedInvoice 段 / `售後服務.md` § OA-Payment 段
  - 業務邏輯：`04-business-logic/付款發票邏輯.md`（含 13 情境索引）
  - 來源：`04-business-logic/payment-invoice-scenarios.md`（13 業務情境 475 行，同目錄）
  - 法規（本 plan 新建）：`04-business-logic/發票法規硬約束-ezPay-MIG.md`
- **觸發詞**：「款項」「發票」「收款」「對帳」「OA」「Payment」「Invoice」「PlannedInvoice」「退款」「補收」「折讓」「期次」「老化」「應收」「應付」「SalesAllowance」「PaymentInvoice」

## 三、跨領域共用層（任何稽核 MUST 自動載入）

跨領域共用層的卡不屬任何單一領域，frontmatter 標 `business-domain: cross-domain`。

| 共用層分類 | Vault 對應 | 載入理由 |
|----------|----------|---------|
| **角色（Roles）** | `03-roles/`（16 角色） | 任何模組討論都涉及角色 R&R |
| **術語（Domain）** | `02-domain/glossary-erp.md` / `glossary-shared.md` / `glossary-graphic-editor.md` / `printing-industry.md` | 跨領域共用語言 |
| **跨模組情境（Scenarios）** | `07-scenarios/`（16 跨模組情境）| 端到端跨領域業務情境 |
| **狀態機（State Machines）** | `06-state-machines/`（9 張）+ `openspec/specs/state-machines/spec.md` | 跨實體狀態鏈 |
| **產品 KPI / 願景** | `01-products/`（vision / phases / kpi / impact-score）| 任何規劃需對齊產品目標 |
| **Master Data**（**本 plan 第六輪反饋拍板進入共用層**）| `material-master` / `process-master` / `binding-master` / `equipment` spec + 對應 Vault 實體卡 | 跨領域基礎參考資料：Pre-sales 報價 / Prepress 規格 / Production 排程都用 |
| **跨模組商業流程** | wiki `04-business-logic/`（原 business-processes/spec.md 已廢除 2026-06-09，內容遷至 wiki + 各模組 spec）| 跨模組規則彙整 |

## 四、邊界判斷規則（領域歸屬有爭議時）

當一張卡的領域歸屬有爭議時，依下列規則判斷：

1. **以主要使用場景為準**：問「這張卡 80% 的使用情境屬哪個領域」，採該領域
2. **跨多領域 → cross-domain**：若涉及 ≥ 2 個領域且互不從屬，標 cross-domain
3. **業務流程穿越多領域 → 以源頭為準**：如「補印」起源於售後（L1.5）但 entity 在 Prepress（L1.3）→ 補印業務邏輯歸 L1.5、補印 PrintItem entity 標 cross-domain
4. **款項是否總屬 L1.6**：是。即使在訂單實體上的 Payment / Invoice 子欄位，仍屬 L1.6 領域邏輯
5. **QC 是否屬 L1.5**：否。QC 已併入 ProductionTask（type=qc / scope=print_item），屬 L1.4 Production 子集
6. **Master Data 是否屬 L1.4**：否。Master Data 跨領域使用，屬共用層

## 五、與 OpenSpec 模組的對應

| Vault 業務領域 | OpenSpec spec 模組 |
|-------------|----------------|
| L1.1 Pre-sales | `quote-request` / `consultation-request` |
| L1.2 Order Management | `order-management`（不含 Payment-Invoice 段）|
| L1.3 Prepress | `prepress-review` |
| L1.4 Production | `work-order` / `production-task` / `scheduling-center` / `schedule-backtrack` / `task-dispatch-board` / `work-package` / `qc`（薄層）|
| L1.5 Fulfillment & After-sales | 出貨（規劃中）/ `after-sales-ticket` |
| L1.6 Billing & Cash | `order-management` § Payment-Invoice 段 |
| Cross-domain | `business-processes` / `state-machines` / `user-roles` / `business-scenarios` / `sales-platform` / `material-master` / `process-master` / `binding-master` / `equipment` |

## 六、演化資料

> 本段累積本框架使用過程中發現的邊界爭議 / 新領域需求 / 分類錯誤案例。

| 日期 | 議題 | 處理 |
|------|------|------|
| 2026-05-28 | 框架建立 | 採 6 領域 + 跨領域共用層；QC 併進 Production；Master Data 進共用層；領域分類經 Miles 第五輪拍板 |

（後續累積實證 + 邊界爭議）

## 七、來源

- 業界研究：Tharstern / PrintVis / Printavo / Avanti Print MIS / DDD Bounded Context（Martin Fowler）
- LeanIX Business Capability Map（製造業 L1 分類）
- Miles 第五輪反饋（Master Data 進共用層 / QC 進 Production）
- Miles 第六輪反饋（User Story 在「目標 → 實作 → 稽核」路徑樞紐）
- Karpathy LLM Wiki Vault（jason-effi-lab/karpathy-llm-wiki-vault）：型態×模組二維啟發
- YouTube Claude Code /goal 影片（執行者與稽核者分離）

## 相關卡

- [[erp-planning-audit-framework]] — 稽核框架（雙軸）
- [[wiki-schema]] — frontmatter 規範
- [[erp_index]] — LLM 入口頁
- [[scope-boundary]] — Vault 收 / 不收
