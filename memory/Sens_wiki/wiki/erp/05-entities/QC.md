---
type: entity
module:
  - 品檢
  - 生產任務
business-domain:
  - 生產執行
related-spec: openspec/specs/qc/spec.md
status: active
last-reviewed: 2026-05-19
---

# QC（QCRecord）

> 對生產任務的品質檢驗紀錄。**QC 通過數**驅動工單完成度計算。

## 核心欄位

| 欄位 | 說明 |
|------|------|
| `id` | 系統 ID |
| `production_task_id` | 所屬生產任務 → [[生產任務]] |
| `target_quantity` | 申請 QC 的數量 |
| `passed_quantity` | QC 通過數 |
| `failed_quantity` | QC 不通過數 |
| `status` | 狀態（見 [[QC 狀態]]）|
| `inspector_id` | QC 人員 → [[wiki/erp/05-entities/QC]] 角色 |
| `cancelled_reason` / `cancelled_by` / `cancelled_at` | 作廢相關 |

## 關鍵關聯

- 屬於 `ProductionTask` → [[生產任務]]
- 透過 `production_task_id` 間接關聯 [[工單]]
- 關聯 `Inspector`（[[wiki/erp/05-entities/QC]] 角色）

## 核心邏輯

```
pt_qc_passed = 所有已完成 QC 紀錄的 passed_quantity 加總
工單完成度 = floor(min over 影響成品生產任務 of (pt_qc_passed / quantity_per_work_order))
```

詳見 [[齊套邏輯]] § 二、四層計算精確流程。

## QC 數量限制

```
可 QC 數量 ≤ 報工數量 - 其他 QC 單已申請數量
```

範例：報工 1000、已有 QC 申請 700 → 新 QC 單最多可申請 300。

## QC 結果規則

- **通過**：`passed_quantity` 計入入庫數量
- **不通過**：`failed_quantity` 不計入入庫
- **入庫數量僅在 QC 通過後才計入**

## 作廢規則

| 觸發點 | 行為 |
|--------|------|
| 印務主動作廢（理由文字必填）| 狀態 → 已作廢 |
| 生產任務作廢 | **關聯 QC 單自動作廢**（連鎖反應）|

## 相關業務邏輯

- [[齊套邏輯]]
- [[印件生產流程]] § 七、QC 數量限制
- [[數量換算規則]]

## 相關狀態機

- [[QC 狀態]]

## 相關角色

- [[wiki/erp/05-entities/QC]]：執行檢驗、填寫結果
- [[印務]]：建立 QC 單、作廢

## 來源

- OpenSpec [qc/spec.md](../../../../openspec/specs/qc/spec.md)（草稿；原 business-processes/spec.md 已廢除，QC 數量限制遷至 qc spec）
