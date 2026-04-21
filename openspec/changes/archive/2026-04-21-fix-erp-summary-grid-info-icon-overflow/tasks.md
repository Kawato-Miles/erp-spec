## 1. 前置調查

- [x] 1.1 於 `/Users/b-f-03-029/sens-erp-prototype/src/` Grep `ErpSummaryGrid` 使用點，盤點所有需驗證頁面（至少涵蓋 `SupervisorDashboard.tsx`、`WorkOrderDetail.tsx`，並列出其他命中檔案）
  - 命中：`ErpSummaryGrid.tsx`（本身）、`WorkOrderDetail.tsx`、`PrintItemDetail.tsx`、`SupervisorDashboard.tsx`、`PrintItemArtworkCard.tsx`（shared）、`CurrentArtworkCard.tsx`（prepress-review）
- [x] 1.2 檢視 `sens-erp-prototype/src/components/ui/tooltip.tsx` 是否已預設使用 Radix Portal；若未啟用，於 2.4 明確補上
  - 檢視結果：專案 `tooltip.tsx` 未包 Portal；已於 2.4 透過加 export `TooltipPortal` 並在 `ErpSummaryGrid` 使用處明確包裹方式補上

## 2. 共用元件修正（ErpSummaryGrid.tsx）

- [x] 2.1 擴充 `labelWidth` prop 型別為 `number | 'auto'`，預設值改為 `'auto'`（對應 design.md D1）
- [x] 2.2 label 區 style 邏輯：
  - `labelWidth === 'auto'` → `style={{ minWidth: 104 }}`，不設 `width`（由內容撐開）
  - `labelWidth: number` → 保留原 `style={{ width: labelWidth }}`（向後相容）
- [x] 2.3 保留 label 區 `shrink-0`（對應 D4）與 label 文字 `whitespace-nowrap`（對應 D2）
- [x] 2.4 Tooltip 呈現：確認或補上 `TooltipPortal`，讓 popover render 到 body 層，繞過根層 `overflow-hidden` 的裁切（對應 D3 選項 B）
  - `tooltip.tsx` 新增 `TooltipPortal = TooltipPrimitive.Portal` export；`ErpSummaryGrid.tsx` 使用 `<TooltipPortal>` 包裹 `<TooltipContent>`
- [x] 2.5 保留根層 `overflow-hidden` 以維持 `rounded-lg` 邊角視覺
- [x] 2.6 確認對外 API（`items`、`cols`、`hint`、`labelWidth`、`className`）語意相容，不破壞既有使用處
  - `labelWidth` 仍接受 `number`（向後相容舊行為）；`items`、`cols`、`hint`、`className` 未變更

## 3. 使用點驗證（推 Lovable 後逐一檢視）

- [x] 3.1 Push 變更至 Lovable 環境
  - Commit 9c8a696 已 push origin/main（sens-erp-prototype），Lovable 應自動同步
- [x] 3.2 驗證 `SupervisorDashboard` KPI 概覽 Tab：7 項指標 Info icon 全可見；hover 任一 icon 顯示完整 Tooltip 不被切（對應 prototype-shared-ui § Info icon 可見性 § 長中文 label Scenario；§ Tooltip 可完整顯示 § Tooltip 超出 cell Scenario）
  - 初版（9c8a696，labelWidth='auto' + 各 cell 獨立撐開）Miles 回報「KPI 欄位寬度不一」；調整為統一計算最寬 label 策略（83243e0），Miles 驗證通過
- [x] 3.3 驗證 `WorkOrderDetail` 整體進度摘要：版面與修改前視覺一致、欄位左邊緣對齊、無寬度跳動（對應 prototype-shared-ui § 視覺無回歸 § 工單詳情 Scenario）
- [x] 3.4 依 1.1 清單逐一檢視其他使用點：無寬度異常、欄位未對齊、Info icon 不可見或 Tooltip 被切等回歸症狀（對應 prototype-shared-ui § 視覺無回歸 § 其他詳情頁 Scenario）
- [x] 3.5 視窗寬度測試：縮放瀏覽器寬度至邊界情況，驗證 Tooltip 位置自動翻轉方向（對應 prototype-shared-ui § Tooltip 可完整顯示 § 視窗寬度變化 Scenario）
- [x] 3.6 短 label 對齊驗證：找一處使用短 label（2-4 字）的 `ErpSummaryGrid`（例：`WorkOrderDetail` 的「完成比」類欄位），確認同列左邊緣對齊（對應 prototype-shared-ui § Info icon 可見性 § 短 label Scenario）
  - 最終採統一最寬 label 策略（D1 最終決策 B），min-width 104 仍為保底

## 4. 收尾

- [x] 4.1 執行 `openspec validate fix-erp-summary-grid-info-icon-overflow`，確認無 error
- [x] 4.2 Commit 變更（`sens-erp-prototype` repo，prefix 用 `fix:`，繁體中文描述）
  - Commit hash: 9c8a696（初版）+ 83243e0（D1 最終策略 B）
- [x] 4.3 向 Miles 回報 Lovable 驗證結果，確認是否進入 archive 流程
  - 2026-04-21 Miles 指示「這個 change 可以封存」
- [x] 4.4 Archive 時：延伸 capability `prototype-shared-ui` 併入 main specs，後續共用元件呈現規範可於此 capability 持續累積
  - 建立 `openspec/specs/prototype-shared-ui/spec.md`（由本 change delta 提升）
