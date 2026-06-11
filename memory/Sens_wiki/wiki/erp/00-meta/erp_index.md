---
type: meta
status: active
last-reviewed: 2026-06-10
---

# ERP 主題入口

> ERP Vault 的唯一入口。從這裡開始查找資料、理解架構、定位卡片。
> Vault 與 OpenSpec 的分工見專案 [CLAUDE.md](../../../../../CLAUDE.md) § wiki 與 OpenSpec 分工。

---

## 一、架構概述

### 分層結構

每層只負責自己該負責的細緻度。上層不下放到個案、下層不僭越定價值。

| 分層 | 載體 | 職責 | 目錄 |
|------|------|------|------|
| **產品策略** | `product-vision` / `phase` / `metric` | 願景、痛點、Phase、北極星指標、利害關係人 | `01-products/` |
| **商業邏輯** | `service-blueprint` / `business-rule` | 服務藍圖（端到端業務鏈）+ 商業規則（決策邏輯、領域知識、外部約束）| `04-business-logic/` |
| **狀態 / 角色 / 資料** | `state-machine` / `role` / `entity` | 狀態轉換、角色權責、實體欄位 | `06` / `03` / `05` |
| **業務情境（過程）** | `scenario` | 業務目標的完成過程（接力型／能力型／排程型），判準內嵌、引用各正本 | `07-scenarios/` |

### 連結方向

| 欄位 | 方向 | 語意 | 限制 |
|------|------|------|------|
| `source` | 往上 | 依據（這張卡為什麼對） | 只指更上層卡或外部來源。禁指同層、下層、OpenSpec |
| `implemented-by` | 往下 | 導航（被誰實作） | 指 OpenSpec / Prototype。不承載正確性 |

依據鏈：`業務情境 → 商業規則 → 使用者拍板 / 產業慣例 / 法規`

### 增修紀律

1. 每筆增修須附影響分析，不可用「大致沒問題」帶過
2. 無把握時明說不知道，該開 OQ 就開
3. 規則只寫一次，其他層級引用不複寫
4. 修改前檢查可變性（`mutability`），外部約束和領域知識不可因訪談而改

---

## 二、載入決策表（規劃前先讀）

依本次討論主題識別領域 → 載入對應目錄 + 跨領域共用層。
詳細領域定義與觸發詞見 [[business-domain-taxonomy]]。

| 業務領域 | 應載入 |
|---------|-------|
| **L1.1 售前** | `03-roles/業務.md` / `諮詢.md` + `04-business-logic/營運規則/售前/` + `05-entities/需求單.md` / `諮詢單.md` + `06-state-machines/需求單狀態.md` / `諮詢單狀態.md` + `07-scenarios/`（業務情境；遷移期既有卡在 `13-user-stories/quote-request/` / `consultation-request/`）+ 共用層 |
| **L1.2 訂單管理** | `03-roles/業務.md` / `業務主管.md` / `印務主管.md` + `05-entities/訂單.md` + `06-state-machines/訂單狀態.md` + `07-scenarios/`（業務情境，訂單管理八卡已遷入）+ 共用層 |
| **L1.3 印前審稿** | `03-roles/審稿.md` + `04-business-logic/營運規則/訂單到交付/` + `04-business-logic/領域知識/` + `05-entities/印件.md` + `06-state-machines/印件狀態.md` + `07-scenarios/`（業務情境；遷移期既有卡在 `13-user-stories/prepress-review/`）+ 共用層 |
| **L1.4 生產執行** | `03-roles/印務.md` / `生管.md` / `師傅.md` + `04-business-logic/領域知識/` + `05-entities/工單.md` / `生產任務.md` + `06-state-machines/工單狀態.md` / `生產任務狀態.md` / `任務狀態.md` + 共用層 |
| **L1.5 履約與售後** | `03-roles/出貨.md` + `05-entities/出貨單.md` / `售後服務.md` + `06-state-machines/出貨單狀態.md` + 共用層 |
| **L1.6 款項與發票** | `03-roles/會計.md` + `04-business-logic/營運規則/帳務/` + `04-business-logic/外部約束/` + `05-entities/帳務.md` + `07-scenarios/`（業務情境；遷移期既有卡在 `13-user-stories/order-management/` 款項類）+ 共用層 |
| **跨領域共用層**（必載） | `03-roles/` + `02-domain/` + `07-scenarios/` + `06-state-machines/` + `01-products/` + `04-business-logic/服務藍圖/` |

---

## 三、卡片清單

### 產品策略（01-products）
- [[wiki/erp/01-products/product-vision|產品願景]] / [[phases]] / [[success-metrics]] / [[impact-score-framework]] / [[pain-points]] / [[stakeholders]]

### 領域知識（02-domain）
- [[printing-industry]] / [[glossary-erp]] / [[glossary-shared]] / [[glossary-graphic-editor]]

### 角色（03-roles）
- [[業務]] / [[業務主管]] / [[諮詢]] / [[會計]] / [[審稿人員]] / [[審稿主管]] / [[印務]] / [[印務主管]] / [[生管]] / [[師傅]] / [[品檢人員]] / [[轉交]] / [[出貨人員]] / [[Supervisor]] / [[外包廠商]] / [[中國廠商]] / [[EC 商品管理]]

### 商業邏輯（04-business-logic）

**服務藍圖**：[[線下訂單流程]] / [[諮詢服務流程]] / [[帳務流程]]

**營運規則**：[[訂單異動規則]] / [[明細時點分界]] / [[售後服務規則]] / [[審稿分配規則]] / [[供應商報價規則]] / [[免審決策樹]] / [[難易度機制]] / [[報價邏輯]] / [[報價印件填寫原則]] / [[諮詢收尾規則]] / [[現金流出把關]] / [[發票收款彈性]] / [[對帳一致性]] / [[付款發票邏輯]]

**領域知識**：[[齊套邏輯]] / [[數量換算規則]] / [[印件生產流程]] / [[打樣流程]] / [[稿件管理規則]]

**外部約束**：[[發票法規硬約束-ezPay-MIG]]

### 實體（05-entities）
- [[需求單]] / [[諮詢單]] / [[訂單]] / [[印件]] / [[工單]] / [[生產任務]] / [[任務]] / [[出貨單]] / [[售後服務]] / [[帳務]]

### 狀態機（06-state-machines）
- [[需求單狀態]] / [[諮詢單狀態]] / [[訂單狀態]] / [[訂單異動狀態]] / [[印件狀態]] / [[工單狀態]] / [[生產任務狀態]] / [[任務狀態]] / [[QC 狀態]] / [[出貨單狀態]] / [[分期請款狀態]] / [[售後服務狀態]]

### 業務情境（07-scenarios）
- 款項與發票領域：[[訂單異動流程]] / [[請款期次規劃]] / [[期次開立發票]] / [[收款核銷分配]] / [[對帳與催收]] / [[諮詢費結算收尾]]
- 訂單管理領域：[[訂單成立確認]] / [[訂單印件規格維護]] / [[訂單客戶與聯絡資料維護]] / [[訂單三類備註維護]] / [[訂單複製建單]] / [[訂單其他附件保存]] / [[訂單負責業務改派]] / [[單據分享與職務代理]]（跨單據能力，訂單為落地例）
- 其餘領域分批遷移中，暫見 13-user-stories/ 與 07-scenarios/README

### 高量層（指向各層索引，不逐卡列）
- **OQ**：[[wiki/erp/08-open-questions/README|OQ 索引]]
- **使用者故事（廢止單元，遷移期）**：`13-user-stories/`（新卡一律進 07-scenarios 業務情境）
- **回顧**：`14-reviews/`

---

## 四、治理工具

| 資源 | 用途 |
|------|------|
| [[wiki-schema]] | frontmatter 規範 + lint 依據 |
| [[business-domain-taxonomy]] | 6 領域 + 跨領域共用層定義 |
| [[scope-boundary]] | Vault 收 / 不收邊界 |
| [[changelog]] | 已凍結封存（2026-06-10）；後續操作史見 [[log]] |

---

## 五、變動紀律

- 卡片新增 / 修改 / 移除 MUST 同步更新本入口對應段落
- 異動 ≥ 5 張卡建議跑 `vault-audit`
