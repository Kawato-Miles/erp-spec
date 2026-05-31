---
type: reference
module:
  - cross-module
status: active
last-reviewed: 2026-05-19
---

# Notion 資源索引

> 完整 Notion URL 索引維護在 `memory/shared/notion-index.md`（唯一正本）。本卡為 Vault 內的快速入口。

## 一、ERP 核心資源

| 資源 | URL | Vault 對應 |
|------|-----|----------|
| 產品目標 | https://www.notion.so/32c3886511fa81359354e33087d23f23 | [[wiki/erp/01-products/product-vision]]、[[pain-points]]、[[success-metrics]] |
| 使用者權責 | https://www.notion.so/32c3886511fa8144b38adc9266395d15 | [[_alignment-report]]、`03-roles/*.md` |
| 業務情境 DB | https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 | [[wiki/erp/07-scenarios/README]] |
| 數量換算規則 | https://www.notion.so/32c3886511fa81e9a77adbd21cfc9d4a | [[數量換算規則]] |
| KPI DB | https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f | [[wiki/erp/01-products/kpi/README]] |
| Impact Score DB | https://www.notion.so/d8ae867eb00947439a9c0fc47de52e84 | [[impact-score-framework]] |
| Follow-up DB（OQ + Task）| https://www.notion.so/32c3886511fa808e9754ea1f18248d92 | [[wiki/erp/08-open-questions/README]] |
| 資料欄位 DB | https://www.notion.so/32c3886511fa803e9f30edbb020d10ce | `05-entities/*.md` |
| 測試案例 DB | https://www.notion.so/2b93886511fa817fbd65e7608726f036 | [[付款發票邏輯]] § 九 |
| Feature DB（發布版 BRD）| https://www.notion.so/2823886511fa83d08c16815824afd2b7 | — |

## 二、模組 BRD（Notion 發布版）

| 模組 | Notion URL | Vault 對應 spec |
|------|-----------|----------------|
| 需求單 | https://www.notion.so/3293886511fa80998ac0e8cdf555da68 | `openspec/specs/quote-request/` |
| 訂單管理 | https://www.notion.so/32c3886511fa806bad41d755349b0567 | `openspec/specs/order-management/` |
| 工單管理 | https://www.notion.so/32c3886511fa80f98a43def401d1edce | `openspec/specs/work-order/` |
| 生產任務 | https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94 | `openspec/specs/production-task/` |
| 稿件審查 | https://www.notion.so/32c3886511fa80eab36aded242f6deb9 | `openspec/specs/prepress-review/` |
| 商業流程（跨模組） | https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a | `openspec/specs/business-processes/` |
| 狀態機（跨模組） | https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 | `openspec/specs/state-machines/` |

## 三、Collection URL（用於 query database view）

| Collection | URL | DB title |
|------------|-----|---------|
| 核心角色權責表 | `collection://32c38865-11fa-80bc-b88c-000b86bdc3c0` | 16 角色 + 權限矩陣 |
| KPI | `collection://32e38865-11fa-8011-b3d2-000bc2ff77fb` | 各模組 KPI |
| Impact Score | `collection://32e38865-11fa-8080-aed6-000b7646c008` | 功能優先度評分 |

## 四、同步方向

依 [[vault-charter#三、Source of Truth 規則|Vault Charter]]：

- **Vault → Notion**：重要里程碑後 Miles 觸發彙整推送
- **Notion → Vault**：公司同仁反饋 → Miles 給連結 → Claude 更新
- **不做自動 sync**

## 五、來源

- 原始正本：`memory/shared/notion-index.md`
