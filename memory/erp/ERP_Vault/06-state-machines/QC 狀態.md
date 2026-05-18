---
type: state-machine
module:
  - qc
related-spec: openspec/specs/state-machines/spec.md
status: active
last-reviewed: 2026-05-19
---

# QC 狀態（QCStatus）

> [[QC]] 的狀態機。**QC 完成後自動觸發工單完成度重算（齊套性邏輯）**。

## 狀態清單

```
待執行 → 執行中 → 已完成
                ↓
            已作廢
```

## 主要轉移觸發

| From → To | 觸發 | 推進方式 |
|-----------|------|---------|
| - → 待執行 | 印務建立 QC 單 | 手動 |
| 待執行 → 執行中 | QC 人員開始檢驗 | 手動 |
| 執行中 → 已完成 | QC 人員填寫結果 | **自動觸發工單完成度重算** |
| 待執行 / 執行中 → 已作廢（印務）| 印務主動作廢（理由文字必填）| 手動 |
| 任何狀態 → 已作廢（連鎖）| 對應[[生產任務]]作廢 | **自動連鎖** |

## 自動觸發

| 觸發點 | 自動行為 |
|--------|---------|
| QC 完成時 | 觸發工單完成度重算（齊套性邏輯，見 [[齊套邏輯]]）|
| 生產任務作廢 | QC 單自動作廢 |

## 作廢規則

- **印務作廢**：理由文字必填，限中文 6 字 / 英文 20 字內（藍新限制）
- **連鎖作廢**：生產任務作廢時系統自動帶動 QC 單作廢，無需印務操作

## 影響工單完成度

```
pt_qc_passed = 所有已完成 QC 紀錄的 passed_quantity 加總
工單完成度 = floor(min over 影響成品生產任務 of (pt_qc_passed / quantity_per_work_order))
```

詳見 [[齊套邏輯]] § 二、四層計算精確流程 § 層級 1。

## QC 數量限制

```
可 QC 數量 ≤ 報工數量 - 其他 QC 單已申請數量
```

## 相關業務邏輯

- [[齊套邏輯]]
- [[數量換算規則]]
- [[印件生產流程]] § 七、QC 數量限制

## 關聯狀態機

- [[生產任務狀態]]（向下：作廢連鎖）
- [[工單狀態]]（向上：QC 通過驅動工單完成度）

## 來源

- OpenSpec [state-machines/spec.md § QC 狀態](../../../../openspec/specs/state-machines/spec.md)
- OpenSpec [qc/spec.md](../../../../openspec/specs/qc/spec.md)
