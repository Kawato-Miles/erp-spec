## Why

訂單款項與發票實務存在 13 個典型情境（來源：[Notion follow-up「提供收款情境」](https://www.notion.so/3573886511fa80b39093d8c76b57737a)）。本 change 處理其中「訂單異動職責分工」與「補收款場景路徑收斂」兩塊缺口：整合既有 OrderAdjustment 為訂單異動單與售後服務單兩種業務情境，並廢除過早預留的補收款訂單欄位。業務缺乏「該追款 / 該開票」列管入口的問題另由後續 change `add-pending-receivables-and-invoicing-pages` 處理。

現況補收款場景分散在「訂單異動」「補收款訂單」「OrderExtraCharge」三條路徑，邊界模糊導致業務操作不一致。本 change 收斂為單一路徑（OrderAdjustment + adjustment_phase），並補上對帳警示的時點觸發邏輯（執行時點跨期）以涵蓋業界（SAP / NetSuite）公認的「跨期調整」場景。

## What Changes

- OrderAdjustment 新增 `adjustment_phase` 欄位（自動由建單時 `Order.status` 推算），UI 名稱依 phase 切換為「訂單異動單（during_order）」或「售後服務單（after_completion）」，可選 `adjustment_type` 範圍依 phase 不同
- OrderAdjustment 新增明細概念（`item_type`: print_item / fee 等），讓單筆異動可分項記錄
- OrderAdjustment 新增 `adjustment_type` 完整 enum 列舉與 phase 限制（業務層校驗，API + UI 雙重防護）
- 售後服務單行為限制：不新增 PrintItem、不觸發新工單，執行後顯示建議式提示「請至訂單詳情頁的發票區處理（作廢 / 折讓）」
- 對帳警示 banner 觸發條件改用「執行時點跨期」（`OrderAdjustment.executed_at > Order.completed_at`）而非僅依 phase，涵蓋 phase = during_order 但實際跨期執行的場景
- 訂單異動加印 / 規格變更走既有審稿 / 工單流程（業務手動到訂單詳情頁編輯 PrintItem），OrderAdjustment 只負責金額憑證
- 新增 Decision：訂單異動 vs 工單異動職責分工（有金額變動 → 訂單異動單；無金額變動 → 工單異動，含成本上升公司吸收場景）
- 新增 Decision：OrderExtraCharge vs OrderAdjustment.fee 時間邊界（OrderExtraCharge 限訂單成立時即確定，訂單成立後新增的費用走 OrderAdjustment）
- 新增「補收款場景判定表」於 design.md，列舉廢除 is_supplemental 後各補收場景的處理路徑
- **BREAKING** 廢除 `Order.is_supplemental` + `Order.parent_order_id` 欄位，補收款訂單預留概念退場，補收場景全走訂單異動單
- 整合既有 Requirement「已完成訂單仍可建立 OrderAdjustment（售後服務）」併入 `adjustment_phase` 設計

## Capabilities

### Modified Capabilities

- `order-management`：OrderAdjustment 雙重身份（adjustment_phase + 明細）、adjustment_type 完整 enum + phase 限制、OrderExtraCharge vs OrderAdjustment.fee 時間邊界、對帳警示觸發改為執行時點跨期、廢除 is_supplemental + parent_order_id
- `state-machines`：OrderAdjustment 狀態機補上 phase 行為差異註記、對帳警示觸發條件改為 `executed_at > completed_at`
- `business-processes`：新增「訂單異動 vs 工單異動職責分工」Decision；售後服務單發票處理建議式提示流程；對帳警示觸發條件對齊
- `user-roles`：售後服務單角色操作權責補充

## Impact

- **程式碼層**：order-management 模組修訂，新增 OrderAdjustmentItem 子實體（明細），Order 資料表移除兩欄位
- **資料移轉**：既有 OrderAdjustment 全部回填 `adjustment_phase = during_order`（因 spec 在歷史上未啟用售後服務語意）；廢除 `Order.is_supplemental` + `parent_order_id` 前需確認沒有資料引用（理論上現況零引用）
- **UI 層**：訂單詳情頁的 OrderAdjustment 表單（含 phase 顯示、明細編輯、執行後提示）；訂單詳情頁的售後服務單執行後 banner
- **API 層**：訂單詳情頁「對帳檢視面板」公式不變（既有 spec 已定義），警示 banner 觸發條件改為執行時點跨期
- **Prototype 層**：[sens-erp-prototype](https://github.com/Kawato-Miles/sens-erp-prototype) 對應 OrderAdjustment 表單 mock 補上
- **既有 spec 影響**：與既有「應收帳款帳齡底層欄位」「PaymentPlan 變更觸發回審」「對帳檢視面板」等 Requirement 相容
- **依賴關係**：本 change 後續 `add-pending-receivables-and-invoicing-pages` change 將新增待收款 / 待開發票模組與 PaymentPlan.expected_invoice_date 欄位，依賴本 change 的 OrderAdjustment 新行為與對帳警示觸發邏輯
- **不在範疇**：兩個 列管模組 模組（轉至 `add-pending-receivables-and-invoicing-pages`）、業務拆分印件數量開多張發票（轉至下個發票相關 change）、跨訂單合併出貨（人工協調）、跨訂單混合匯款對帳工具（後期會計工具強化）、大貨重新報價（屬需求單議價階段）
