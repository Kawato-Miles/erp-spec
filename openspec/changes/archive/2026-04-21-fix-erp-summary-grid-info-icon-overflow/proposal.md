## Why

審稿主管 KPI 面板（[SupervisorDashboard.tsx](../../../sens-erp-prototype/src/pages/prepress/SupervisorDashboard.tsx)）的 7 項指標每個都在 `ErpSummaryGrid` 欄位帶 `hint` 說明文字，理論上應以 Info icon + Tooltip 呈現；但底層共用元件 [ErpSummaryGrid.tsx](../../../sens-erp-prototype/src/components/layout/ErpSummaryGrid.tsx) 因固定 `labelWidth` + `whitespace-nowrap` + 外層 `overflow-hidden` 三者疊加，導致 Info icon 被擠出可見區、Tooltip 被切，實質上看不到說明。由於此元件同時用於 WorkOrderDetail / PrintItemDetail 等多處且大部分欄位都會用 Info icon 說明欄位含義，需從元件層一次修到位，確保後續任何使用 `hint` 的場景都能正常顯示。

本 change 僅修跑版（不採 PM 副標方案），與指標規劃議題 [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 解耦並行。

## What Changes

- **修正** `ErpSummaryGrid` 元件 label 區寬度策略：`labelWidth` 從「固定 104px 預設」改為「自動撐開 + 可選最小寬」，避免長中文 label + Info icon 被固定寬擠壓
- **修正** label 區 `whitespace-nowrap` 策略：確保 Info icon 不被 label 文字擠出可見區
- **修正** 外層 `overflow-hidden` 對 Tooltip 的裁切：改採不影響 Radix Tooltip popover 浮出的方式達成 rounded 裁切（例如各 cell 自裁、Tooltip 用 Portal escape）
- **驗證** 現有所有使用點視覺無回歸：SupervisorDashboard（KPI 7 項）、WorkOrderDetail、PrintItemDetail、訂單與印件其他 summary grid 使用點（cols=2/3/4 均需驗）
- **不變更** `ErpSummaryGrid` 的對外 API 語意（`items` / `cols` / `hint` 等欄位含義保持相容）

## Capabilities

### New Capabilities

- `prototype-shared-ui`: Prototype 共用 UI 元件的呈現規範（例如欄位摘要格線、資訊提示 icon、Tooltip 行為等共用元件應滿足的可驗收呈現 invariants）。本 change 先為 `ErpSummaryGrid` 的 `hint`（Info icon + Tooltip）建立可見性與完整性要求，作為後續共用元件規格化的起點。此 capability 不包含業務邏輯，僅規範共用元件的呈現合約。

### Modified Capabilities

（無。本 change 不涉及任何業務模組 spec（quote-request / order-management / work-order / production-task / prepress-review / state-machines / business-processes / user-roles）的行為或規則變更。）

## Impact

**程式碼**：
- 主要：[sens-erp-prototype/src/components/layout/ErpSummaryGrid.tsx](../../../sens-erp-prototype/src/components/layout/ErpSummaryGrid.tsx)
- 驗證使用點（非逐一列舉）：[SupervisorDashboard.tsx](../../../sens-erp-prototype/src/pages/prepress/SupervisorDashboard.tsx)、[WorkOrderDetail.tsx](../../../sens-erp-prototype/src/pages/WorkOrderDetail.tsx)、其他 `ErpSummaryGrid` import 處

**API 與依賴**：
- 無 API 變更
- 無新增套件依賴（仍使用既有 shadcn/ui Tooltip + Radix Portal）

**OpenSpec Specs**：
- 不動任何 spec

**驗證環境**：
- 使用者無本地開發環境；所有 UI 驗證推上 Lovable 預覽（參見 memory `feedback_prototype_no_build`）
- 驗證應涵蓋桌機瀏覽器（ERP 僅支援桌機）

**關聯 OQ**：
- [PI-010 — 審稿主管 KPI 面板指標規劃確認](https://www.notion.so/3483886511fa819b96e1cb3b34108790)：追蹤 KPI 指標 L1/L2 重構、退件原因圖表改造、PM 副標方案取捨，**與本 change 解耦**

**過程註記**：
- 依使用者明確指示，本 change 不執行三視角 agent 審查（senior-pm / ceo-reviewer / erp-consultant）；理由：純 UI 元件跑版修正、無 spec 變更、業務決策已由 [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 另案承接
