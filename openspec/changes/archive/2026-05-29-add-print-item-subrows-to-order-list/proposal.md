## Why

業務接客戶來電的查找路徑與系統呈現之間有落差：客戶以「訂單」為入口（記得的是訂單編號／公司／案名），但實際要回答的是訂單裡**某個印件**的狀態——典型語句是「我的 OOO 訂單裡，那個 XXX 印件現在怎樣了」。

[印件](../../../memory/erp/ERP_Vault/05-entities/印件.md) 是 [訂單](../../../memory/erp/ERP_Vault/05-entities/訂單.md) 的一對多子實體（`Order.printItems`），且印件有[雙維度狀態](../../../memory/erp/ERP_Vault/06-state-machines/印件狀態.md)：審稿維度（稿子審到哪）+ 印製維度（印件做到哪）。客戶來電問的正是這兩件事。但現行訂單列表是單層、以訂單為粒度，[業務](../../../memory/erp/ERP_Vault/03-roles/業務.md) 必須「點進訂單詳情頁 → 找到印件清單 → 看那一筆印件」才能回答，多一次跳轉。

**成功標準**：業務回應客戶印件查詢的操作，從「搜訂單 → 進詳情頁 → 找印件」三步，降為「搜尋 → 展開（命中印件時自動展開）」；且在訂單列表一頁同時看到該印件的審稿與印製兩個狀態，不需離開列表。

本變更為 `/openspec-explore` 探索後的提案，四項設計決策已在探索階段與 PM 拍板（見 design.md）。

## What Changes

- 訂單列表（OrderList）父層維持現有 12 欄不變，第一欄加展開箭頭（父層既有的「印件數」欄天然對應子層筆數）。
- 新增可展開**印件子層**（inline 展開，沿用既有 `ErpExpandableRow`）；子層 7 欄：縮圖／印件名稱+協力標籤／印件類型／**審稿狀態**／**印製狀態**／交期／操作（檢視 → 開啟既有 `PrintItemDetailSidePanel`）。
- 子層**審稿狀態、印製狀態兩欄分開**呈現（雙維度），讓業務一次回答客戶兩個問題。
- 訂單列表搜尋框範圍**納入印件名稱／編號**，採 filter 模式：命中時列表只剩含該印件的訂單、自動展開該訂單、高亮命中印件。
- 子層**排除**兩類欄位：生產相關（生產數量／產線／難易度／工單數／排程／負責印務）＋ 父層訂單已有（案名／客戶／訂單編號）。
- 一般瀏覽時子層預設全收合（僅搜尋命中印件時自動展開）。
- **訂單列表角色可見範圍分流**：業務（業務平台語境）僅見「自己負責 ∪ 被分享」的訂單；業務主管（中台語境）見全公司訂單。沿用既有 `isSalesView` 分流模式 + `Order.sharedMembers`。修正 OrderList 目前對業務無過濾的現況落差，使印件子層的可見範圍對業務正確收斂。
- 父層訂單列其餘既有行為與欄位不變，子層為新增能力；對業務角色而言可見訂單範圍將收斂（全公司 → 自己的+分享），屬行為修正而非 BREAKING（修正既有與需求的落差）。

## Capabilities

### New Capabilities

（無——本變更沿用既有共用元件，不引入新 capability）

### Modified Capabilities

- `order-management`: ADD Requirement「訂單列表印件子層展開」。order-management spec 目前無「訂單列表」層級的 Requirement（既有印件清單 Requirement 屬訂單詳情頁），本變更新增列表頁的子層展開與搜尋擴展行為規格。

## Impact

- **Spec**：`order-management`（ADD 1 個 Requirement + Scenarios）。
- **Prototype**：`sens-erp-prototype/src/pages/OrderList.tsx`（父層套 `ErpExpandableRow` 加印件子層、搜尋邏輯擴展為「訂單層欄位 ∪ 印件名稱／編號」的 filter + 命中自動展開）。
- **重用元件（不另造）**：`ErpExpandableRow`（已用於 ModificationList／ProductionTaskList／PrintItemDashboard／OperatorTasks）、`PrintItemDetailSidePanel`（與訂單詳情頁同一元件，保證一致）、審稿狀態／印製狀態 Badge（印件詳情頁既有）。
- **無資料模型變動**：`Order.printItems`（一對多）與印件雙維度狀態欄位皆現成。
- **Prototype（過濾分流）**：OrderList 加角色分流過濾（移植 PrintItemDashboard `isSalesView` 模式 + `Order.sharedMembers` 查詢），業務 own∪shared、業務主管全部。
- **OQ**：ORD-023（訂單列表 vs 印件總覽分工，open）；ORD-024（業務範圍過濾，Miles 已拍板「業務 own∪shared、業務主管全部」，本 change 實作，resolved）。
- **Vault 缺口（本 change 一併補）**：`07-scenarios/` 補「業務按訂單查印件」端到端情境卡；`03-roles/業務.md` 評估是否補「對外回應客戶印件查詢」職責。
