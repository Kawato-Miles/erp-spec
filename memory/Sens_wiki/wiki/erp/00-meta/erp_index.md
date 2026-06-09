---
type: meta
status: active
last-reviewed: 2026-05-31
---

# ERP 主題入口（載入決策 + 卡片清單）

> ERP 主題的 LLM 載入決策入口與卡片 registry。規劃前先讀「一、載入決策表」決定載入哪些卡。
> 跨主題總目錄見 [[index]] ；`raw/`、`assets/` 在 vault 根（跨主題共用），不在本主題下。
> 操作史見 [[log]]（跨主題）與 [[audit-log]]（ERP 時序），本頁不再手動維護 changelog。

## 一、載入決策表（規劃前先讀）

依本次討論主題識別領域 → 載入對應目錄 + 跨領域共用層。

| 業務領域 | 應載入 |
|---------|-------|
| **L1.1 Pre-sales** | `03-roles/業務.md` / `諮詢.md` + `04-business-logic/報價邏輯.md` / `難易度機制.md` + `05-entities/需求單.md` / `諮詢單.md` + `06-state-machines/需求單狀態.md` / `諮詢單狀態.md` + `13-user-stories/quote-request/` / `consultation-request/` + 共用層 |
| **L1.2 Order Management** | `03-roles/業務.md` / `業務主管.md` + `05-entities/訂單.md`（非 Payment 段）+ `06-state-machines/訂單狀態.md` + `13-user-stories/order-management/`（非款項類）+ 共用層 |
| **L1.3 Prepress** | `03-roles/審稿.md` + `04-business-logic/免審決策樹.md` / `審稿分配規則.md` / `稿件管理規則.md` / `打樣流程.md` / `印件檔案備註上限.md` + `05-entities/印件.md` + `06-state-machines/印件狀態.md` + `13-user-stories/prepress-review/` + 共用層 |
| **L1.4 Production** | `03-roles/印務.md` / `Supervisor.md` / `生管.md` / `師傅.md` / `QC.md` / `外包廠商.md` / `中國廠商.md` + `04-business-logic/齊套邏輯.md` / `數量換算規則.md` / `印件生產流程.md` + `05-entities/工單.md` / `生產任務.md` / `QC.md` + `06-state-machines/工單狀態.md` / `生產任務狀態.md` / `任務狀態.md` / `QC 狀態.md` + 共用層 |
| **L1.5 Fulfillment & After-sales** | `03-roles/出貨.md` + `05-entities/出貨單.md` / `售後服務.md` + `06-state-machines/出貨單狀態.md` + 共用層 |
| **L1.6 Billing & Cash** | `03-roles/會計.md` / `業務.md`§款項 / `諮詢.md`§諮詢費 + `04-business-logic/付款發票邏輯.md` / `發票法規硬約束-ezPay-MIG.md` + `05-entities/訂單.md`§Payment-Invoice / `售後服務.md`§OA-Payment + `13-user-stories/order-management/`（款項類）+ `04-business-logic/payment-invoice-scenarios.md`（13 情境）+ 共用層 |
| **跨領域共用層**（任何稽核必載入）| `03-roles/`（角色 R&R）+ `02-domain/`（術語）+ `07-scenarios/`（跨模組情境）+ `06-state-machines/`（含 cross-module 狀態）+ `01-products/`（KPI / 願景）+ `openspec/specs/business-processes/spec.md` + Master Data（material / process / binding / equipment spec）|

## 二、卡片清單（registry）

### 產品與領域（01-products / 02-domain）
- [[wiki/erp/01-products/product-vision|產品願景（ERP）]] — ERP 願景與範疇
- [[operating-principles]] — 營運原則（最高層，分權方向）
- [[success-metrics]] — 成功指標 / KPI
- [[impact-score-framework]] — Impact Score（G.U.N. 框架）
- [[phases]] — 產品 Phase 範疇
- [[pain-points]] — 痛點分析
- [[stakeholders]] — 利害關係人
- [[printing-industry]] — 印刷業背景知識
- [[glossary-erp]] — ERP 術語 / [[glossary-shared]] — 共用術語 / [[glossary-graphic-editor]] — 圖編術語

### 角色（03-roles）
- [[業務]] — 接單 / 報價 / 訂單 / 款項追收
- [[業務主管]] — 改派負責業務、核可退款、跨部門售後檢視
- [[諮詢]] — 諮詢單認領、諮詢費、轉需求單
- [[訂單管理人]] — 訂單建立與維護
- [[會計]] — 開票 / 收款 / 對帳 / CSV 匯出
- [[審稿人員]] — 稿件審查執行
- [[審稿主管]] — 審稿分配與覆寫
- [[印務]] — 工單與印件製作
- [[印務主管]] — 印件總覽防掉單、工單分配
- [[生管]] — 生產排程與產線
- [[師傅]] — 工序現場執行
- [[品檢人員]] — 印件入庫檢查 + 工序中間品檢
- [[Supervisor]] — 生產線主管（跨工序督導）
- [[出貨]] — 出貨單與物流
- [[外包廠商]] — 委外加工夥伴
- [[中國廠商]] — 中國代工夥伴
- [[EC 商品管理]] — 電商商品上架管理

### 業務邏輯（04-business-logic）
- [[付款發票邏輯]] — 款項 / 發票 / 對帳規則索引卡
- [[對帳一致性]] — 應收＝發票淨額＝收款淨額（共用規則）
- [[報價邏輯]] — 需求單報價評估
- [[齊套邏輯]] — 基於 BOM 的最少工單原則
- [[數量換算規則]] — 印件 / 印張 / 數量換算
- [[難易度機制]] — 印件難易度評級
- [[訂單異動規則]] — OA 建立 / 審核 / 補退不對稱
- [[稿件管理規則]] — 稿件檔案與版本
- [[審稿分配規則]] — 自動派工 + 主管覆寫
- [[免審決策樹]] — 何時跳過審稿
- [[打樣流程]] — 打樣判定與後續分支
- [[印件生產流程]] — 印件四層生產
- [[印件檔案備註上限]] — 檔案 / 備註數量上限
- [[發票法規硬約束-ezPay-MIG]] — ezPay + 財政部 MIG 法規
- [[payment-invoice-scenarios]] — 13 款項發票情境素材（產 US / TC 用）
- [[明細時點分界]] — 何時鎖定明細走異動單
- [[報價印件填寫原則]] — 報價階段印件拆分合併原則
- [[供應商報價規則]] — 外包廠商報價審核流程
- [[諮詢收尾規則]] — 諮詢費四分支收尾規則
- [[售後服務規則]] — 售後五步流程與決議分流

### 資料實體（05-entities）
- [[需求單]] — 客戶報價需求
- [[諮詢單]] — 諮詢前置單
- [[訂單]] — 訂單（含款項 / 發票段）
- [[印件]] — 印件（雙維度狀態）
- [[工單]] — 生產工單
- [[生產任務]] — 工序任務（含 QC / 品檢）
- [[任務]] — 下層任務單位
- [[wiki/erp/05-entities/QC|QC（實體）]] — 品檢（已併入生產任務）
- [[出貨單]] — 出貨 / 物流
- [[售後服務]] — 售後 ticket 容器

### 狀態機（06-state-machines）
- [[需求單狀態]] / [[諮詢單狀態]] / [[訂單狀態]] / [[訂單異動狀態]] — 前置與訂單
- [[印件狀態]]（雙維度）/ [[工單狀態]] / [[生產任務狀態]] / [[任務狀態]] / [[QC 狀態]] — 生產與審稿
- [[出貨單狀態]] — 履約
- [[分期請款狀態]]（開票 × 收款雙維度）— 款項

### 跨模組情境（07-scenarios）
- [[訂單異動流程]] — 訂單異動端到端情境

### 洞察（12-insights）
- [[2026-05-29-款項發票四來源一致性比對]]
- [[2026-05-30-test-case-內移vault-skill稽核]]
- [[2026-05-28-agent-teams-evaluation]]
- [[2026-05-26-archive工具假設與Vault-Schema對齊缺口]]
- [[2026-05-25-SidePanel視覺對齊迭代成本與元件抽象時機]]
- [[2026-05-20-售後ticket-reactive-補丁循環]]
- [[2026-05-20-change-archive-OQ收尾流程缺口]]

## 三、高量 / 生成層（指向各層 README / 子索引，不列每卡）

> 高量 / 生成層不在本入口逐卡列，改連各層 README / 子索引（MOC）；各卡由所屬層 README 收束。

- **待確認問題（OQ）**：[[wiki/erp/08-open-questions/README|OQ 索引]]（`08-open-questions/`，前綴 ORD / BI / AR / AFT / XM / CR / PT / PI / SHP / QC）
- **使用者故事**：[[wiki/erp/13-user-stories/README|US 中樞與撰寫紀律]]（`13-user-stories/<module>/`：quote-request / order-management / prepress-review / consultation-request）
- **驗收項目**：`15-test-cases/<module>/`（無獨立 README）
- **每日 / 每週回顧**：[[wiki/erp/14-reviews/README|回顧層說明]]（`14-reviews/daily/`、`weekly/`）
- **外部索引**（`10-references/`）：[[decks-index]] — 過程圖解 / [[notion-index]] — Notion 資源 / [[openspec-index]] — OpenSpec spec 對照 / [[prototype-index]] — Prototype 對照
- **審查方法論**：[[wiki/erp/11-review-knowledge/README|審查方法論入口]]（`_shared` / `pm` / `ceo` / `erp` / `protocols`）
- **視覺化（`09-canvases/`）**：[[角色×流程-swimlane.canvas|角色×流程 swimlane]] / [[狀態機全景.canvas|狀態機全景]] / [[實體關聯網.canvas|實體關聯網]] / [[模組依賴.canvas|模組依賴]] / [[商業情境-traceability.canvas|商業情境 traceability]] / [[prototype-業務邏輯對應.canvas|prototype 業務邏輯對應]]

## 四、治理工具

| 資源 | 用途 |
|------|------|
| [[business-domain-taxonomy]] | 6 領域 + 跨領域共用層定義 + 觸發詞清單 |
| [[erp-planning-audit-framework]] | 稽核框架（雙軸 + 5 SOP 含閉環）|
| [[wiki-schema]] | frontmatter 規範（含 business-domain enum）|
| [[scope-boundary]] | Vault 收 / 不收 |
| [[vault-charter]] | Vault 章程 |
| [[sync-workflow]] | 三邊同步（Vault / OpenSpec / Notion）|
| [[audit-log]] | ERP 稽核時序紀錄 |
| [[audit-failure-patterns]] | 稽核反模式追蹤 |

## 五、變動紀律

- 任何卡新增 / 修改 / 移除 MUST 同步更新本 index 對應段落，並於 [[log]] 記一筆。
- 異動 ≥ 5 張卡觸發 `vault-audit`；達 ≥ 10 張觸發 `vault-insight`。
