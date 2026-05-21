## Why

訂單詳情頁（`/orders/:id`）三個 Tab 累積了影響日常使用的呈現問題：（a）資訊 Tab 的「分享 / 轉單」按鈕已被「分享」Tab（PermissionManagement 元件，US-ORD-004）完整取代，但按鈕仍存在並以 toast 指引使用者多跳一步；（b）印件清單 Tab 表格已膨脹到 20 欄、縮圖落在第 18 欄、使用兩層展開呈現相關工單（子表 6 欄），對「業務深入檢視單筆印件」的核心任務造成視覺密度過高 + 互動成本爆增；（c）金額及付款 Tab 的「金額組成」區塊把「未稅 / 含稅」雙金額擠在同 cell 內（DualPriceCell），擠壓認知並違反業界 ERP / MES（SAP / NetSuite / Odoo / Dynamics 365）主流的「分項區單欄 + 底部 summary stack」設計模式。

對應商業背景 — 訂單為 ERP 核心實體（見 [訂單.md](../../../memory/erp/ERP_Vault/05-entities/訂單.md)），訂單詳情頁是業務 / 諮詢 / 業務主管 / 訂單管理人四個角色每日多次進入的高頻畫面；印件（[印件.md](../../../memory/erp/ERP_Vault/05-entities/印件.md)）為訂單下的核心生產單位，印件清單是該頁的主視覺；金額組成涵蓋訂單異動 / 折抵 / 紅利 / 發票對齊（見 [付款發票邏輯.md](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)），是業務 / 會計每日對帳的關鍵入口。本 change 為 UI / UX 結構性調整，不改 Data Model / 不改狀態機 / 不改商業邏輯，僅優化呈現與動線。

## What Changes

- **MODIFIED 訂單詳情頁業務負責人 row**：移除「分享 / 轉單」按鈕，只顯示業務名稱。臨時協助與轉單動線完整由分享 Tab 承接（沿用 US-ORD-004 PermissionManagement 機制）。
- **MODIFIED 訂單詳情頁印件清單 Tab 表格結構**：
  - 表格從 20 欄精簡至 14 欄主表（縮圖 / 印件名稱 / 規格備註 / 類型 / 印件狀態 / 審稿狀態 / 打樣結果 / 購買數量 / 售價 / 生產數量 / 入庫數量 / 出貨數量 / 交期 / 操作）
  - 縮圖移至首欄、尺寸從 40px 放大至 120px 方形
  - 規格備註從第 14 欄提前至第 3 欄（緊跟印件名稱）
  - 移除兩層展開（ErpExpandableRow）與工單嵌套表格；改為操作欄新增「檢視」按鈕、點擊開右側 Side Panel
  - 5 個移除欄位（預計產線 / 難易度 / 出貨方式 / 稿件檔案 / 工單數）移入 Side Panel 對應區塊
- **REMOVED 印件清單「申請異動」按鈕**：原邏輯（製作後操作欄顯示「申請異動」toast 引導去訂單異動 Tab）整段移除。業務後續發起印件相關異動的動線：
  - 金額異動 → 訂單異動 Tab 建立 OrderAdjustment（既有流程）
  - 印件規格異動 → 業務通知印務、印務從工單異動處理（沿用 work-order spec § 工單異動流程 既有 Requirement）
  - 下方 Info Banner 保留作為頁面層級提示
- **ADDED 印件詳情 Side Panel（PrintItemDetailSidePanel）**：
  - 容器：ErpSidePanel size=lg、direction=right
  - Header：印件名稱 + PrintItemTypeLabel + 印件狀態 Badge + 「開啟完整詳情頁」link
  - Body 三區塊：印件資訊（PrintItemSpecCard 共用元件）+ 印件檔案（PrintItemArtworkCard 共用元件）+ 相關工單清單（搬既有 sub table 6 欄）
- **MODIFIED 金額組成區塊呈現（採業界 ERP / MES 模式 A1）**：
  - 分項區從 ErpInfoTable + DualPriceCell 改為 `ErpTableCard` + `.erp-table` 四欄結構（分項名稱 / 數量摘要 / 未稅小計 / 含稅小計）
  - 折抵 / 紅利 / 負值異動 row：金額前綴 `−` + `text-destructive`
  - 待審核異動 row：金額欄改顯「待核可」chip + tooltip
  - 底部 summary stack 三層（小計未稅 / 營業稅 5% / = 應收總額含稅）
  - 應收總額視覺強調用 `text-2xl font-bold text-foreground`（取代既有 `text-emerald-600`，對齊 DESIGN.md 「品牌色不用於金額本身」原則）
  - 付款狀態 PaymentStatusBadge 從分項 row 移出至 summary stack 結尾
  - DualPriceCell 元件改名為 AmountCell（語意化、移除 primary/secondary 切換邏輯）
- **MODIFIED DESIGN.md 補五條規範**：
  - § 0.1「實體狀態欄優先於屬性欄」（既有狀態欄位置慣例固化）
  - § 0.1「縮圖 / 圖像欄置於資料列首欄」（圖像作為視覺錨點先於文字欄）
  - § 6「子表規模 > 6 欄或 > 5 row 時不採用 ErpExpandableRow，改開 Side Panel」（兩層展開使用判準）
  - § 1.4.4 使用情境決策樹補一行「列表 row 詳細資訊預覽（不離頁）」→ ErpSidePanel
  - § 6「金額明細採模式 A1：分項 ErpTable 四欄 + 底部 summary stack」（對齊 SAP / NetSuite / Odoo / Dynamics 365 業界主流）

## Capabilities

### New Capabilities

無。本 change 不引入新 capability。

### Modified Capabilities

- `order-management`：訂單詳情頁業務負責人 row（移除轉單按鈕）、印件清單 Tab 表格結構（單層 row + 縮圖首欄 + Side Panel 模式）、印件清單「申請異動」按鈕移除、印件詳情 Side Panel（PrintItemDetailSidePanel 容器與三區塊內容）、金額組成區塊呈現（單欄金額 + summary stack）

## Impact

**Affected Specs**：
- `openspec/specs/order-management/spec.md` — Delta spec：MODIFIED × 3 / REMOVED × 1 / ADDED × 1

**Affected Code**（Prototype `sens-erp-prototype` repo）：
- `src/pages/OrderDetail.tsx` — 移除轉單按鈕（行 394-416）/ 重構印件清單表格（行 644-918，移除 ErpExpandableRow + 14 欄 + 120px 縮圖 + 新增 SidePanel state）
- `src/components/order/PrintItemDetailSidePanel.tsx` — **新增**（沿用 ErpSidePanel + PrintItemSpecCard + PrintItemArtworkCard）
- `src/components/order/OrderPaymentSection.tsx` — 金額組成區塊改模式 A1（行 491-576 + 1181-1217 DualPriceCell → AmountCell）

**Affected Design System**：
- `sens-erp-prototype/DESIGN.md` — 補五條規範（§ 0.1 × 2、§ 6 × 2、§ 1.4.4 × 1）

**Affected Roles**（依 [03-roles/](../../../memory/erp/ERP_Vault/03-roles/)）：
- 業務 / 諮詢 / 業務主管 / 訂單管理人：訂單詳情頁日常使用者，UX 直接受影響
- 印務：「印件規格異動」改由業務通知 + 印務從工單異動處理（沿用既有 work-order spec § 工單異動流程，非新增動線）

**不在範疇**：
- 訂單列表頁、印件詳情頁、工單詳情頁等其他畫面
- 訂單異動單（OrderAdjustment）內部欄位 / 流程 — 本次只調金額組成「呈現」，不改 OrderAdjustment 實體
- 預計付款（PaymentPlan）/ 收款紀錄（Payment）區塊 — 保留現況，本次僅重整金額組成區塊
- 狀態機 / Data Model / 商業邏輯 — 不變動

**Notion 推送**：本 change 歸檔後，order-management spec 的發布版本（https://www.notion.so/32c3886511fa806bad41d755349b0567）需手動同步至 v0.6。
