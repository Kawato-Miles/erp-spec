## Why

訂單管理人與業務在訂單列表要找「某位業務負責、某段交期內」的訂單時，現行列表只有「狀態 / 訂單類型 / 售後狀態」下拉加關鍵字搜尋，缺「業務負責人」與「交期」篩選，只能逐頁翻找或匯出比對。此為商業需求 [US-ORD-009 訂單管理人查看全公司訂單](../../../memory/Sens_wiki/wiki/erp/13-user-stories/order-management/US-ORD-009-訂單管理人查看全公司訂單.md) 的硬需求（系統 MUST 提供依業務負責人、訂單狀態、交期等條件篩選）。委外派單面板已具備同等豐富篩選，訂單列表體驗落後、跨模組不一致。

可見範圍規則見 [ORD-024 訂單列表業務平台中台分流過濾](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-024-訂單列表業務平台中台分流過濾.md)（業務只見自己負責∪被分享、訂單管理人 / 業務主管見全公司）；可篩欄位見 [訂單實體](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)。

## What Changes

- 訂單列表新增「業務負責人」下拉篩選（依訂單的業務負責人欄位）。
- 新增「交期」起訖日期區間篩選（篩訂單交期，即列表所示之交期欄位）。
- 新增「清空篩選」鍵（一鍵重置所有篩選並回到第一頁）。
- 搜尋框補左內嵌放大鏡 icon，對齊列表頁範式 B 與 Figma 中台設計 filter 區塊（node 9223:18748）。
- **規格編碼校正**：order-management 規格中「訂單列表全公司檢視與篩選」scenario 由舊號 US-ORD-005 對齊為 **US-ORD-009**（依 [ORD-1 編碼重複處理](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-1-Notion-US-ORD-005編碼重複處理.md) answered 決議；US-ORD-005 另指「訂單發票與配送資訊編輯」，與篩選無關）。
- 非破壞性：既有狀態 / 類型 / 售後 / 關鍵字篩選與角色可見範圍邏輯皆不變。

不在本次範疇（列第二階段）：快捷篩選（最新 / 即將到期 / 售後異常 等一鍵切換）、建立日期區間、可重用篩選元件抽取、篩選條件寫入網址。

## Capabilities

### New Capabilities

（無新增 capability）

### Modified Capabilities

- `order-management`: 「訂單列表與分享權限」Requirement —— 將「依業務負責人、訂單狀態、交期等條件篩選」由概括敘述細化為明列篩選欄位集（業務負責人 / 訂單狀態 / 訂單類型 / 售後狀態 / 交期區間 / 關鍵字 + 清空篩選），並把篩選 scenario 編碼對齊為 US-ORD-009。

## Impact

- **Prototype**：`/Users/b-f-03-029/sens-erp-prototype/src/pages/OrderList.tsx`（前端對既有訂單資料做條件過濾；版面須容納第 5 個篩選控制，逼近範式 B `grid-cols-4` 上限，須處理換行或交期區間跨欄）。
- **Spec**：`openspec/specs/order-management/spec.md` §「訂單列表與分享權限」Requirement（delta MODIFIED）。
- **測試**：新增 `/Users/b-f-03-029/sens-erp-prototype/e2e/order-list-filter.spec.ts`。
- **不變**：訂單實體 schema、訂單狀態機、角色權限、可見範圍邏輯（交期只篩訂單層 `order.deadline`，不擴成跨印件聚合查詢）。
- **相關 open OQ**：[XM-003 訂單管理人 vs 業務權責邊界](../../../memory/Sens_wiki/wiki/erp/08-open-questions/XM-003-訂單管理人%20vs%20業務權責邊界.md) —— 影響「業務負責人」下拉的「全公司視角」對象，但不阻擋本次（下拉是對當前角色可見訂單集再收斂，任何結論下皆成立）。
