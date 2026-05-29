## Context

本變更源於 `/openspec-explore` 探索，解決業務接客戶來電以「訂單」為入口查「印件」狀態的查找落差（動機見 [proposal.md](proposal.md)）。核心決策在探索階段與 PM 拍板，並經 ERP 顧問單輪系統一致性審查補強；審查過程揭露一個原探索未涵蓋的需求面，PM 隨之拍板擴大範疇（見 D6）。

現況關鍵：OrderList 為單層 12 欄；App 路由僅一條 `/orders`，業務、諮詢、業務主管角色**共用同一個 OrderList 元件**（介面當時做了統一）。但**需求上訂單列表是兩個語境**：業務平台（業務／諮詢使用）與中台（業務主管使用）。印件為訂單一對多子實體，具審稿、印製雙維度狀態，狀態值定義於 state-machines spec。

## Goals / Non-Goals

**Goals:**
- 訂單列表加印件子層（inline 展開），子層同時呈現審稿狀態與印件狀態兩維度。
- 搜尋範圍納入印件名稱／編號，filter 模式 + 命中自動展開。
- 訂單列表角色可見範圍分流：業務（業務平台語境）見「自己負責 ∪ 被分享」訂單、業務主管（中台語境）見全公司訂單（沿用既有 `isSalesView` 模式 + `Order.sharedMembers`）。
- 100% 沿用既有元件（ErpExpandableRow / ReviewDimensionStatusBadge / PrintItemStatusBadge / PrintItemDetailSidePanel / PrintItemTypeLabel），不造新輪子、不動資料模型。

**Non-Goals:**
- 不新增 sales-platform Requirement——訂單列表角色可見範圍屬其核心權限規則，歸 order-management；OrderList 為跨平台共用元件，非業務平台特化閹割頁。
- 不動印件／訂單實體、狀態機、角色定義。
- 子層不放編輯入口（純檢視，編輯走詳情頁，符合業界高風險資料展開列原則）。
- 不實作訂單分享的編輯 UI（`sharedMembers` 維護已存在於 OrderDetail 分享 Tab，本變更只消費它做過濾）。

## Decisions

### D1. 子層呈現：inline 展開列，沿用 ErpExpandableRow
探索拍板。理由：掃視多訂單印件概況最快、範式成熟（ModificationList／ProductionTaskList／PrintItemDashboard／OperatorTasks 已用）。
- 實作細節：`colSpan` 須傳 **13**（含新增 toggle 欄），父層原 12 欄後移；OrderList 既有兩個 `cell-sticky-left`（訂單編號 left:0、案名 left:150）偏移量須因 toggle 欄寬重算，否則橫向捲動欄位錯位。proposal「父層維持 12 欄不變」指欄位內容，非實體欄數。

### D2. 子層欄位與命名：5 欄，符合列表頁子表規範
印件名稱（含印件類型標籤 + 協力標籤）/ **審稿狀態** / **印件狀態** / 交期 / 操作（檢視→PrintItemDetailSidePanel）。
- **DESIGN.md line 52 衝突解法（apply 階段拍板）**：原探索設計 7 欄含縮圖，踩中「子表 ≥6 欄或含圖片 SHALL 改 Side Panel」規範。Miles 拍板精簡至 5 欄、去縮圖，符合 ErpExpandableRow 適用範圍——規範理由「避免 row 高度爆增」對訂單列表子層同成立，且 row 矮反而一頁掃更多印件。縮圖移至「檢視」開啟的 PrintItemDetailSidePanel（深看時呈現）；印件類型由獨立欄併入印件名稱欄（PrintItemTypeLabel）。
- 顧問校正：印製維度欄名採「**印件狀態**」（與印件總覽 PrintItemDashboard 一致），非原「印製狀態」，避免同狀態跨頁兩種欄名。
- Badge 重用：審稿維度用 `ReviewDimensionStatusBadge`、印製維度用 `PrintItemStatusBadge`（PrintItemDetailSidePanel 已同時用）；印件類型用 `PrintItemTypeLabel`。一律重用，禁另造。
- 排除：縮圖（移至 Side Panel）＋ 生產相關（生產數量／產線／難易度／工單數／排程／負責印務）＋ 父層訂單已有（案名／客戶／訂單編號）。

### D3. 子層顯示範圍：訂單下全部印件（已棄用除外）
顧問 challenge 採納。訂單列表是客戶查詢入口，已完成／已送達印件**也要可查**（客戶常問已送達那筆的簽收）。**不**沿用印件總覽「製作完成隱藏」過濾（那是生產防掉單看板語意）。此為兩個入口的語意差異，須在 spec 明示。

### D4. 搜尋：訂單層欄位 ∪ 印件名稱／編號的 filter，命中自動展開
探索拍板 + 顧問補邊界：
- 命中後 `setPage(1)`（沿用 OrderList 既有換頁 pattern）。
- 結果集內所有命中訂單預設展開、高亮命中印件列。
- 清空搜尋時收合所有展開、回未過濾全集（展開狀態以 Set 管理，與 PrintItemDashboard 一致）。

### D5. Side Panel 資料源補齊（顧問挖出的實作缺口）
`PrintItemDetailSidePanel` 需 5 個 props（order / relatedWorkOrders / afterSalesTickets / reviewerNames / reviewerNameOf）。OrderList 目前僅取 orders／afterSalesTickets，須一併從 store 取 `workOrders` 與 reviewer 名單解析（移植 OrderDetail 現成寫法）；否則子層「檢視」開出的 Side Panel「相關工單」與「審稿紀錄」會空白——而審稿紀錄正是業務要看的。

### D6. 訂單列表角色分流過濾（PM 拍板擴大範疇）
顧問審查揭露：OrderList 目前零角色過濾（OrderList.tsx 48-82），業務看到全公司訂單——與需求不符。PM 拍板釐清需求並納入本變更：
- **規則**：業務（業務平台語境）見「`order.salesPerson === currentUser.name` ∪ `sharedMembers` 含 currentUser」；諮詢比照業務；業務主管（中台語境）不過濾、見全部。
- **實作**：移植 PrintItemDashboard 既有 `isSalesView`（`role === 'sales' || role === 'consultant'`）分流模式，過濾邏輯內聯於 OrderList 既有 `useMemo`；`sharedMembers` 欄位已存在（order.ts），無需新資料結構。
- **spec 歸屬**：order-management（訂單列表角色可見範圍是核心權限規則）。
- **與印件子層的關係**：印件子層可見印件 = 過濾後可見訂單的印件，過濾收斂後業務展開只看自己的+分享的印件——這是本變更「業務查印件」情境正確上線的前提。

## Risks / Trade-offs

- [業務範圍過濾正確性] 業務應見 own∪shared、業務主管見全部 → Mitigation：沿用 `isSalesView` + `sharedMembers`，e2e 驗證業務看不到他人未分享訂單、業務主管看全部。
- [兩個印件入口分工] 訂單列表（業務平台=業務查自己的+分享、中台=業務主管全部）vs 印件總覽（業務查自己的印件生產） → Mitigation：OQ ORD-023 用業務動作切分釘住分工。
- [sticky 欄位錯位] 加 toggle 欄後 `cell-sticky-left` 偏移 → Mitigation：實作時重算 left 值，e2e 驗證橫向捲動無錯位。

## Migration Plan

無資料遷移（無 schema 變動，`sharedMembers` 已存在）。Prototype 直接改 `OrderList.tsx`。回退 = 移除子層、搜尋擴展與角色過濾分流，父層基本行為不受影響。

## Open Questions

- **ORD-023**（answered）：訂單列表 vs 印件總覽分工——Miles 確認訂單入口顯示全部印件（含已完成）、印件入口隱藏製作完成，兩入口定位如 OQ 卡記錄。
- **ORD-024**（resolved）：訂單列表業務平台/中台分流——Miles 拍板「業務見 own∪shared、業務主管見全部」，本變更 D6 實作。OQ 卡標 resolved 作決策軌跡。
