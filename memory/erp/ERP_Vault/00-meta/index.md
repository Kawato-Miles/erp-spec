---
type: meta
status: active
last-reviewed: 2026-05-28
---

# ERP Vault 入口頁（LLM Index）

> Vault 14 目錄的「LLM 載入決策入口」。受 Karpathy LLM Wiki Vault 啟發。
> Claude 進入 ERP 規劃前先讀此頁，決定該載入哪些卡。
> 與 [[audit-log]] 並存：本頁是「現況入口」、audit-log 是「時序紀錄」。

## 一、Vault 主結構

```
ERP_Vault/
├── 00-meta/                    # Vault 治理（章程 / schema / 領域分類 / 稽核框架）
├── 01-products/                # 產品願景 / KPI / Phase
├── 02-domain/                  # 術語 / 產業背景
├── 03-roles/                   # 16 角色卡（業務 / 諮詢 / 印務 / QC / 會計 / Supervisor 等）
├── 04-business-logic/          # 11 業務規則卡（付款發票邏輯 / 齊套邏輯 / 報價邏輯 / 審稿規則等）
├── 05-entities/                # 10 實體卡（訂單 / 印件 / 工單 / 任務 等）
├── 06-state-machines/          # 9 狀態機卡
├── 07-scenarios/               # 16 跨模組情境（規劃中）
├── 08-open-questions/          # 74 OQ（BI/ORD/AR/AFT/CR/PI/PT/QC/SHP/XM）
├── 09-canvases/                # 5 Canvas（視覺化）
├── 10-references/              # 外部索引（Notion / OpenSpec / Prototype）
├── 11-review-knowledge/        # 審查方法論（_shared / pm / ceo / erp / protocols）
├── 12-insights/                # 5 累積 Insight
├── 13-user-stories/            # 56 User Story（4 模組）
├── 14-reviews/                 # Daily / Weekly 回顧
└── raw/                        # 2 已 ingested 卡
```

## 二、稽核載入決策表（核心入口）

依本次討論主題識別領域 → 載入對應目錄 + 跨領域共用層。

| 業務領域 | 應載入 |
|---------|-------|
| **L1.1 Pre-sales** | `03-roles/業務.md` / `諮詢.md` + `04-business-logic/報價邏輯.md` / `難易度機制.md` + `05-entities/需求單.md` / `諮詢單.md` + `06-state-machines/需求單狀態.md` / `諮詢單狀態.md` + `13-user-stories/quote-request/` / `consultation-request/` + 共用層 |
| **L1.2 Order Management** | `03-roles/業務.md` / `業務主管.md` + `05-entities/訂單.md`（非 Payment 段）+ `06-state-machines/訂單狀態.md` + `13-user-stories/order-management/`（非款項類）+ 共用層 |
| **L1.3 Prepress** | `03-roles/審稿.md` + `04-business-logic/免審決策樹.md` / `審稿分配規則.md` / `稿件管理規則.md` / `打樣流程.md` / `印件檔案備註上限.md` + `05-entities/印件.md` + `06-state-machines/印件狀態.md` + `13-user-stories/prepress-review/` + 共用層 |
| **L1.4 Production** | `03-roles/印務.md` / `Supervisor.md` / `生管.md` / `師傅.md` / `QC.md` / `外包廠商.md` / `中國廠商.md` + `04-business-logic/齊套邏輯.md` / `數量換算規則.md` / `印件生產流程.md` + `05-entities/工單.md` / `生產任務.md` / `QC.md` + `06-state-machines/工單狀態.md` / `生產任務狀態.md` / `任務狀態.md` / `QC 狀態.md` + 共用層 |
| **L1.5 Fulfillment & After-sales** | `03-roles/出貨.md` + `05-entities/出貨單.md` / `售後服務.md` + `06-state-machines/出貨單狀態.md` + 共用層 |
| **L1.6 Billing & Cash** | `03-roles/會計.md` / `業務.md`§款項 / `諮詢.md`§諮詢費 + `04-business-logic/付款發票邏輯.md` / `發票法規硬約束-ezPay-MIG.md`（規劃中）+ `05-entities/訂單.md`§Payment-Invoice / `售後服務.md`§OA-Payment + `13-user-stories/order-management/`（款項類）+ `04-business-logic/payment-invoice-scenarios.md`（13 情境）+ 共用層 |
| **跨領域共用層**（任何稽核必載入）| `03-roles/`（角色 R&R）+ `02-domain/`（術語）+ `07-scenarios/`（跨模組情境）+ `06-state-machines/`（含 cross-module 狀態）+ `01-products/`（KPI / 願景）+ `openspec/specs/business-processes/spec.md` + Master Data（material / process / binding / equipment spec）|

## 三、稽核框架與工具

| 資源 | 用途 |
|------|------|
| [[business-domain-taxonomy]] | 6 領域 + 跨領域共用層定義 + 觸發詞清單 |
| [[erp-planning-audit-framework]] | 稽核框架（雙軸 + 5 SOP 含閉環）|
| [[wiki-schema]] | frontmatter 規範（含 business-domain enum）|
| [[scope-boundary]] | Vault 收 / 不收 |
| [[vault-charter]] | Vault 章程 |
| [[sync-workflow]] | 三邊同步（Vault / OpenSpec / Notion）|
| [[audit-log]] | 稽核時序紀錄 |
| [[../11-review-knowledge/_shared/audit-failure-patterns]] | 稽核五大反模式追蹤（規劃中）|

## 四、各目錄當前核心議題（2026-05-28）

> 列各目錄正在處理的核心議題，幫助 LLM 快速定位。每月更新一次。

### 00-meta/
- 新增 business-domain-taxonomy（6 領域分類）
- 新增 erp-planning-audit-framework（雙軸稽核框架，規劃中）
- 新增本 index.md（LLM 入口頁）

### 01-products/erp/
- 產品 Phase 1-3 範疇（vision / phases / kpi / impact-score）
- 痛點分析（pain-points）+ 利害關係人（stakeholders）

### 03-roles/
- 16 角色完整定義 + alignment-report
- **規劃中修補**：業務 / 諮詢 / 會計 Role 卡補「款項追款流程」「業務面對客戶的決策場景」「月結對帳節奏」（Phase 2 稽核時）

### 04-business-logic/
- 11 業務邏輯卡分屬 4 領域：營運（付款發票邏輯）/ 業務（報價邏輯）/ 品質（4 張）/ 生產（4 張）
- **規劃中新增**：`發票法規硬約束-ezPay-MIG.md`（從 raw 卡濃縮，Phase 2 法規類型修補）
- **規劃中修補**：付款發票邏輯.md 補「連帶矩陣」章節（7 實體：Payment / Invoice / OA / SalesAllowance / PlannedInvoice / AfterSalesTicket / PaymentInvoice junction）

### 05-entities/
- 10 實體卡：訂單 / 需求單 / 諮詢單 / 印件 / 工單 / 生產任務 / QC / 出貨單 / 售後服務

### 06-state-machines/
- 9 狀態機卡：訂單 / 印件 / 工單 / 生產任務 / QC / 需求單 / 諮詢單 / 出貨單 / 任務

### 08-open-questions/
- 74 OQ 待處理（依模組前綴）
- **高密度新增**：BI-1~BI-11（2026-05-28 新增 11 條請款 OQ）+ ORD-* 系列
- 建議集中解答 session（本 plan 不處理，獨立排程）

### 11-review-knowledge/
- 審查方法論：_shared(8) / pm(4) / ceo(2) / erp(4) / protocols(5)
- **規劃中新增**：`_shared/audit-failure-patterns.md`（五大反模式追蹤，Phase 2 新增）

### 13-user-stories/
- 56 User Story 跨 4 模組（quote 13 / order 27 / prepress 10 / consultation 6）
- **關鍵缺漏**：`related-test-cases` 欄位 0/56；無「上層改下層需重審」機制
- **規劃中修補**：Billing & Cash 領域相關 User Story（如 US-ORD-010 / US-ORD-023）補 `business-domain: billing-cash` + `related-test-cases`（Phase 2 第一輪實證）

### raw/
- 2 已 ingested 卡（ezPay API spec / agent-teams）

## 五、最近更新（按時序）

> 重大 Vault 變動紀錄，由 [[audit-log]] 自動追加。本段列最近 10 條。

| 日期 | 變動 |
|------|------|
| 2026-05-28 | 本 plan 啟動：新增 6 領域分類框架 + 稽核框架 + Billing & Cash 第一輪實證（規劃中）|
| 2026-05-26 | refine-consultation-cancellation-and-invoice-flow change archive — 諮詢取消改半額退費 |
| 2026-05-26 | align-invoice-line-items-to-ezpay-spec change archive — ezPay 五欄硬約束 |
| 2026-05-26 | remove-aging-payment-supervisor-dashboard change archive — 老化清單頁移除 |
| 2026-05-26 | add-sales-manager-after-sales-page change archive — 業務主管全公司售後管理頁 |
| 2026-05-25 | add-side-panel-shared-components change archive — SidePanel 共用元件組 |
| 2026-05-23 | resolve-prepress-review-gaps-ar-10-ar-12 change archive — 主管覆寫嚴格門檻 + 打樣後新稿件實體機制 |
| 2026-05-22 | resolve-consultation-request-gaps-cr-1-cr-2 change archive — 諮詢純自派 + 雙欄位 consultant_note |
| 2026-05-22 | add-payment-status-and-decouple-oa-execution change archive — Payment.paymentStatus 新增 |
| 2026-05-21 | refine-order-detail-tabs change archive — 訂單詳情頁印件清單表格結構簡化 |

（後續自動 append）

## 六、Vault 變動紀律

- 任何卡新增 / 修改 / 移除 MUST 同步更新本 index.md 對應段落
- 每月最後一天執行 vault-audit + 更新本 index.md 「當前核心議題」段
- 異動量 ≥ 5 張卡時觸發 vault-audit；達 ≥ 10 張時觸發 vault-insight
