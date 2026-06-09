---
type: reference
module:
  - cross-module
status: active
last-reviewed: 2026-05-19
---

# OpenSpec 索引

> Vault 中所有實體 / 狀態機 / 業務邏輯卡引用的 OpenSpec specs 對照表。

## 一、跨模組基礎規格

| Spec | Vault 對應 |
|------|-----------|
| [config.yaml](../../../openspec/config.yaml) § 產品背景與目標 | [[wiki/erp/01-products/product-vision]]、[[phases]] |
| ~~business-processes/spec.md~~（已廢除 2026-06-09，商業規則遷 wiki、系統行為遷各模組 spec） | [[齊套邏輯]]、[[數量換算規則]]、[[印件生產流程]]、[[打樣流程]]、[[稿件管理規則]] |
| ~~state-machines/spec.md~~（已廢除 2026-06-09，狀態機拆分至各模組 spec） | `06-state-machines/*.md`（9 個狀態機卡） |
| ~~user-roles/spec.md~~（已廢除 2026-06-09，角色職責遷 wiki、系統行為遷各模組 spec） | `03-roles/`（16 角色卡，見 [[_alignment-report]]）|
| [business-scenarios/spec.md](../../../openspec/specs/business-scenarios/spec.md) | [[wiki/erp/07-scenarios/README]] |

## 二、各模組 Spec

| Spec | 版本 | Vault 對應實體 / 狀態機 |
|------|------|------------------------|
| [quote-request/spec.md](../../../openspec/specs/quote-request/spec.md) | v3.2 | [[需求單]]、[[需求單狀態]] |
| [order-management/spec.md](../../../openspec/specs/order-management/spec.md) | v1.4 | [[訂單]]、[[印件]]、[[訂單狀態]]、[[印件狀態]]、[[出貨單]]、[[出貨單狀態]] |
| [consultation-request/spec.md](../../../openspec/specs/consultation-request/spec.md) | v0.1 | [[諮詢單]]、[[諮詢單狀態]] |
| [after-sales-ticket/spec.md](../../../openspec/specs/after-sales-ticket/spec.md) | v0.1 | [[售後服務]] |
| [work-order/spec.md](../../../openspec/specs/work-order/spec.md) | v0.5 | [[工單]]、[[工單狀態]] |
| [production-task/spec.md](../../../openspec/specs/production-task/spec.md) | v0.3 | [[生產任務]]、[[任務]]、[[生產任務狀態]]、[[任務狀態]] |
| [prepress-review/spec.md](../../../openspec/specs/prepress-review/spec.md) | v1.5 | [[稿件管理規則]]、[[審稿分配規則]]、[[免審決策樹]]、[[難易度機制]]、[[印件檔案備註上限]] |
| [qc/spec.md](../../../openspec/specs/qc/spec.md) | 草稿 | [[品檢人員]]、[[QC 狀態]] |
| material-master / process-master / binding-master | v0.1 | BOM 底層（Phase B 未深入） |

## 三、Prototype 工程 spec

| Spec | 用途 |
|------|------|
| `prototype-data-store/spec.md` | Prototype 資料層 |
| `prototype-shared-ui/spec.md` | Prototype 共用 UI |

→ **不入 Vault**（屬實作層，見 [[scope-boundary]]）。

## 四、引用規則

依 [[wiki-schema]] § 六：

- Vault 卡用相對路徑 markdown link 連到 OpenSpec spec
- **不用 wiki link**（Obsidian 不解析 vault 外部）
- 範例：`[work-order/spec.md § 齊套性](../../../openspec/specs/work-order/spec.md)`
