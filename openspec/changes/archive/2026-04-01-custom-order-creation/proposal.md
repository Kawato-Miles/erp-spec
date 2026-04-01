## Why

目前訂單建立僅支援兩條路徑：(1) 線下單由需求單成交後轉入；(2) EC 線上單 API 同步（Phase 2）。實務上 EC 會員來電要求印件調整（客製化需求），業務需在 ERP 手動建立訂單，但系統無此入口。此變更新增「客製單」訂單類型與手動建立功能，補齊第三條建立路徑。

## What Changes

- 新增訂單類型「客製單」（order_type 從二選一改為三選一：線下 / 線上EC / 客製單）
- 新增客製單建立入口：訂單列表頁「新增訂單」按鈕 → 右側 Sheet 面板填寫表單
- 客製單狀態機走線上單路徑（等待付款 → 已付款 → 共用段），Phase 1 付款由業務手動推進
- 客製單印件支援免審稿選項（勾選後 review_status 直接為「合格」）
- Prototype 新增 CreateOrderPanel 元件與客製單 mock 資料

## Capabilities

### New Capabilities

（無新增獨立 capability）

### Modified Capabilities

- `order-management`：新增客製單建立 Requirement + Scenarios，order_type 欄位新增「客製單」選項
- `state-machines`：訂單狀態機新增客製單路徑描述，免審稿跳過「等待審稿」邏輯
- `business-processes`：新增客製單建立規則（建立角色、必填欄位、印件資訊範圍）

## Impact

- **Spec**：order-management、state-machines、business-processes 三份 spec 需新增 / 修改相關段落
- **Prototype**：新增 CreateOrderPanel.tsx，修改 OrderList.tsx 連接按鈕，新增 mock 資料
- **狀態機**：order_type 新增值不影響既有線下 / 線上路徑，僅新增第三條入口
- **Phase 2 預留**：ERP → EC 反向同步（客製單同步回 EC 讓會員付款）留待 Phase 2
