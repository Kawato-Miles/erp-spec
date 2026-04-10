## Why

前次 change（custom-order-creation）新增「客製單」類型並在 ERP 建立手動建單功能（CreateOrderPanel）。決策變更：客製單日後統一從 EC 端建立後同步至 ERP，ERP 不再提供手動建單入口。order_type 仍維持三選一（線下 / 線上EC / 客製單），因 EC 端需區分一般訂單與客製單。此 change 移除 ERP 端客製單建立功能，保留客製單作為訂單類型分類。

## What Changes

- 移除「業務在 ERP 手動建立客製單」功能（CreateOrderPanel、訂單列表「新增訂單」入口）
- 移除客製單 ERP 建立專屬 Requirement：顧客資訊、發票設定、物流設定、金額試算
- 移除客製單確認觸發中「業務手動標記已付款」Scenario（Phase 1 手動推進不再需要）
- 狀態機客製路徑改為 EC 同步進入（與線上路徑共用），移除 Phase 1 手動推進描述
- 商業流程移除「客製單建立規則」（ERP 端建立規則）
- Prototype 移除 CreateOrderPanel 元件與客製單 mock 資料中的手動建立相關內容
- order_type 維持三選一（線下 / 線上EC / 客製單），不變動
- demo-data 中客製單範例調整為 EC 同步來源

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `order-management`：移除客製單 ERP 建立功能相關 Requirement（建立入口、顧客資訊、發票、物流、金額試算、手動確認付款），保留 order_type 三選一
- `state-machines`：客製路徑改為 EC 同步進入，移除 Phase 1 手動推進描述
- `business-processes`：移除客製單建立規則

## Impact

- Prototype（`sens-erp-prototype`）：移除 CreateOrderPanel 元件、移除「新增訂單」按鈕、OrderType 保留「客製單」但移除手動建立流程
- Notion [訂單 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567)：下次推送時需同步更新
- Notion [狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)：下次推送時需同步更新
- demo-data：客製單範例調整來源描述
