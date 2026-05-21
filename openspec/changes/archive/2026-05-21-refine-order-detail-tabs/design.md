## Context

訂單詳情頁（`/orders/:id`）為 ERP 中台高頻畫面，業務 / 諮詢 / 業務主管 / 訂單管理人四個角色每日多次進入。本 change 針對三個 Tab 的呈現問題進行優化：

- **資訊 Tab**：業務負責人 row 的「分享 / 轉單」按鈕（OrderDetail.tsx:403-413）為 refine-order-edit-gate-and-consultation change 早期遺留，當時的角色是「臨時協助 / 轉單動線指引」，但分享 Tab（PermissionManagement，US-ORD-004）成熟後完全取代此按鈕的功能，按鈕僅 toast 提示走分享 Tab 而無實際動作，造成「多餘一跳」的負面體驗。
- **印件清單 Tab**：表格累積至 20 欄、縮圖落在第 18 欄、使用 ErpExpandableRow 兩層展開呈現相關工單（子表 6 欄）。問題與業界 ERP 列表頁設計範式不符：（a）縮圖作為視覺錨點應在首欄（業界 NetSuite / Odoo / SAP 銷售訂單 line items 模式一致）；（b）子表 6 欄已超過 ErpExpandableRow 適用判準（≤ 5 欄、≤ 5 row），改用 Side Panel 模式更佳；（c）「申請異動」按鈕為 row-level 入口但實際只是 toast 指引、無實際動作。
- **金額及付款 Tab**：「金額組成」區塊（OrderPaymentSection.tsx:491-570）以 DualPriceCell（行 1181-1217）在每個分項 row 的單一 cell 內疊放「未稅 / 含稅」雙金額，違反業界 ERP / MES（SAP / NetSuite / Odoo 18 / Dynamics 365）主流的「分項區單欄 + 底部 summary stack」設計範式，且視覺擠壓、認知噪音高。

商業背景：訂單為 ERP 核心實體（見 [訂單.md](../../../memory/erp/ERP_Vault/05-entities/訂單.md)）、印件為訂單下的核心生產單位（見 [印件.md](../../../memory/erp/ERP_Vault/05-entities/印件.md)）、付款與發票邏輯見 [付款發票邏輯.md](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)。本 change 為純 UI / UX 結構性調整，不涉及 Data Model / 狀態機 / 商業邏輯變動。

## Goals / Non-Goals

**Goals**：

- 移除冗餘的「分享 / 轉單」按鈕，分享 / 代理授權動線完全收斂至分享 Tab
- 印件清單表格從 20 欄精簡至 14 欄主表 + 右側 Side Panel 漸進揭露，符合 cognitive load 控制原則
- 印件清單縮圖移首欄、放大至 120px 方形，符合「圖像作為視覺錨點」業界範式
- 印件規格異動的業務發起動線收斂為兩條（金額異動 → 訂單異動 Tab；規格異動 → 印務工單異動），row-level「申請異動」按鈕完全移除
- 金額組成區塊重設計為業界 ERP / MES 模式 A1：分項區 ErpTable 四欄並列 + 底部 summary stack（小計 / 稅額 / 應收總額三層）
- DESIGN.md 補五條規範使本次設計決策可被未來其他模組沿用

**Non-Goals**：

- 不變動 OpenSpec spec 既有 Data Model（PrintItem / Order / OrderAdjustment / Payment / PaymentPlan 欄位完全不動）
- 不變動 OpenSpec spec 既有狀態機（訂單狀態 / 印件狀態 / 工單狀態 / OrderAdjustment 狀態完全不動）
- 不變動角色 R&R（業務 / 諮詢 / 業務主管 / 訂單管理人 / 印務的職責不變）
- 不變動既有「訂單詳情頁 Tabs 化版型」Requirement 的 6 個 Tab 結構與順序
- 不重整訂單詳情頁其他 Tab（付款計畫 / 收款紀錄 / 訂單異動 / 售後服務 / 三方對帳 / 出貨單 / 檔案區 / 分享 / 活動紀錄）的內部結構
- 不調 OrderAdjustmentSection 表格欄位順序（不在本次反饋範圍）
- 不開設新元件 token（複用 ErpSidePanel + PrintItemSpecCard + PrintItemArtworkCard + ErpTableCard 既有共用元件）

## Decisions

### 決策 1：印件清單從兩層展開改為 Side Panel 模式

**選項 A（採用）**：主表單層 row（14 欄）+ 操作欄「檢視」按鈕 → 開右側 ErpSidePanel  
**選項 B**：保留 ErpExpandableRow，但縮圖移首欄、子表精簡 4 欄  
**選項 C**：用 Modal 取代 Side Panel

**選擇 A 的理由**：

- 兩層展開的子表 6 欄已超 DESIGN.md 建議的展開規模（≤ 5 欄、≤ 5 row）
- Side Panel 可塞下「印件資訊 + 印件檔案 + 工單清單」三區塊的完整檢視，不局限於工單嵌套表格
- 沿用既有 EditOrderPrintItemPanel 已驗證的 Side Panel 模式，無新元件成本
- Side Panel 不離頁、保留訂單詳情頁 context，比 Modal 對「業務需在多筆印件之間快速切換檢視」場景更友好
- Modal 會中斷工作流（強制焦點）、適合單次決策性動作而非檢視

**Side Panel 三區塊複用策略**：

| 區塊 | 複用元件 | 來源 |
|------|----------|------|
| 印件資訊 | `PrintItemSpecCard` | 既有共用元件，吃 ViewModel interface（印件詳情 / 工單詳情 / 審稿詳情三頁共用） |
| 印件檔案 | `PrintItemArtworkCard` | 既有共用元件 |
| 相關工單清單 | 自行構造 6 欄 ErpTable | 直接搬 OrderDetail.tsx:699-743 既有 sub table 內容 |

零新元件、零新 ViewModel；只需在 `src/components/order/PrintItemDetailSidePanel.tsx` 組裝。

### 決策 2：印件清單主表 14 欄精簡的核心任務定位

**選項 A（採用）**：核心任務 = 業務對單筆印件深入檢視，14 欄主表 + Side Panel 漸進揭露  
**選項 B**：核心任務 = 快速判斷生產進度異常，保留工單數 / 預計產線於主表（約 12-13 欄）  
**選項 C**：並存兩種 view 切換（精簡 / 詳細）

**選擇 A 的理由（由 Miles 拍板）**：

- 業務在訂單詳情頁印件清單的高頻動作是「對單筆印件做決策」（更新規格 / 處理補件 / 看打樣結果）而非「跨多筆掃描」
- 跨訂單掃描多筆印件的需求應在「業務平台印件總覽」（add-print-item-overview-to-sales-platform change 已實作）滿足，而非訂單詳情頁
- 並存兩種 view 切換引入 UI state + toolbar 複雜度，對單純 prototype 階段過度設計
- 漸進揭露符合 cognitive load 控制原則（DESIGN.md § 2.2）

**14 欄定義依據**：
- 主表保留：縮圖（視覺錨點）+ 印件名稱（識別）+ 規格備註（核心屬性）+ 類型 / 印件狀態 / 審稿狀態 / 打樣結果（狀態三類）+ 購買數量 / 售價 / 生產數量 / 入庫數量 / 出貨數量（數量四類 + 金額）+ 交期（時間）+ 操作（動作）
- 移至 Side Panel：預計產線 / 難易度 / 出貨方式（屬性屬性）+ 稿件檔案（檔案類）+ 工單數（在 Side Panel 直接顯示完整清單，不需數字摘要）

### 決策 3：縮圖欄 120px 方形

**選項 A（採用）**：120px × 120px 方形  
**選項 B**：80px × 80px 折衷  
**選項 C**：40px × 40px 維持現況、僅移首欄

**選擇 A 的理由（由 Miles 拍板）**：

- 印件縮圖是「業務 + 客戶確認稿件」的核心視覺資訊，40px 過小無法辨識細節
- 120px 提供清晰預覽，避免業務頻繁點開檔案
- 副作用（row 高度 ≥ 128px、5 筆印件 = 640px+ 主表高度）採以下手段緩解：
  - 其他欄位 `align-top` 對齊（與大縮圖視覺對齊）
  - 規格備註欄已用 `whiteSpace: normal` 支援多行（剛好填補 120px 高）
  - prototype 階段先做 120px 觀察實際體感，若反饋強烈再考慮降為 80px

### 決策 4：「申請異動」按鈕完全移除（業務發起動線改為自學）

**選項 A（採用）**：完全移除按鈕，業務需自學「金額異動 → 訂單異動 Tab；規格異動 → 通知印務」  
**選項 B**：保留按鈕但改為下拉選單（兩選項直接導航）  
**選項 C**：完全移除 + 加強 Info Banner 指引

**選擇 A 的理由（由 Miles 拍板）**：

- 業務團隊穩定、新進業務透過 onboarding 即可學習動線
- 按鈕完全移除可徹底斷絕「row-level 入口」與「Tab 層級流程」的雙重指引混淆
- 表格下方既有 Info Banner（「訂單已進入製作階段，調整需走訂單異動流程」）保留，作為頁面層級提示
- 動線改變屬「業務流程動線設計」而非「UI 清理」，需 spec 明示動線（已在 spec delta MODIFIED 中詳述）

**動線承接驗證**：
- 金額異動：work-order spec § 工單異動流程 line 147-241 已定義印務發起 / 業務主管核可路徑，order-management spec § 訂單異動（OrderAdjustment）建立與審核 line 938 定義訂單異動完整流程
- 規格異動：work-order spec § 工單異動流程 既有 Requirement 涵蓋「印務從工單異動處理印件規格變更」場景

### 決策 5：金額組成採業界 ERP / MES 模式 A1（雙欄並列變體）

**選項 A（採用）**：模式 A1 變體 — 分項區四欄並列（分項 / 數量摘要 / 未稅小計 / 含稅小計）+ 底部 summary stack  
**選項 B**：純模式 A — 分項區單欄（依 order_source 動態決定主顯）+ 底部 summary stack  
**選項 C**：保留 DualPriceCell 同 cell 雙金額但改視覺層次

**選擇 A1 的理由（由 Miles 拍板）**：

- 印刷業中台日常場景：業務報價時看未稅、會計對發票時看含稅、業務主管核可時兩者都看；同時呈現符合多角色協作
- 模式 B 的 order_source 動態切換主從欄位讓「業務在線上單看含稅、線下單看未稅」造成跨訂單類型認知不一致
- 雙欄分離為兩個獨立 cell 比同 cell 內雙行擠壓視覺輕量得多
- 含稅小計欄 `text-muted-foreground` 弱化呈現可保留資訊密度但不搶視覺焦點

**業界調研支撐**（資料來源：NetSuite SuiteTax docs / SAP B2B 報價合約 / Odoo 18 Invoice / Dynamics 365）：
- 模式 A 為主流（分項單欄 + summary stack 含 subtotal / tax / grand total）
- 模式 A1（雙欄）為地區性變體，適合多稅制 / 多角色協作場景
- 模式 B（每分項橫向 3 欄含未稅 / 稅額 / 含稅）僅見於稅務稽核介面、不適合日常交易頁

**summary stack 視覺強調**：
- 應收總額用 `text-2xl font-bold text-foreground`（非品牌色 / 非飽和綠）
- 對齊 DESIGN.md 既有原則「品牌色保留給互動與分隔線、金額本身不搶視覺」
- 取代既有 `text-emerald-600` 飽和綠（reflect 業界沒有「應收總額用主品牌色」的範式）

### 決策 6：DualPriceCell 重命名為 AmountCell

雙欄分離後 DualPriceCell 不再承擔「在同 cell 內疊兩個金額」的職責，留下 `negative / muted / emphasize` 三個視覺修飾 prop。重命名為 `AmountCell` 更符合語意（單純的金額 cell），降低未來閱讀者誤解。

### 決策 7：DESIGN.md 補五條規範

| 編號 | 規範 | 用途 |
|------|------|------|
| § 0.1 | 實體狀態欄優先於屬性欄 | 固化既有狀態欄位置慣例（未來其他列表頁可沿用） |
| § 0.1 | 縮圖 / 圖像欄置於資料列首欄 | 本次 + 未來商品列表頁等可沿用 |
| § 6 | 子表規模 > 6 欄或 > 5 row 時不採用 ErpExpandableRow，改開 Side Panel | 給其他模組（售後 ticket、工單）兩層展開 vs Side Panel 的判準 |
| § 1.4.4 | 使用情境決策樹補一行「列表 row 詳細資訊預覽（不離頁）」→ ErpSidePanel | 元件選擇決策樹完整 |
| § 6 | 金額明細採模式 A1：分項 ErpTable 四欄 + 底部 summary stack | 給未來發票 / 報價單 / 三方對帳等金額明細 section 一致設計 |

每條規範都從本 change 抽象出可重用模式，避免「為一個 change 重做一次決策」的浪費。

## Risks / Trade-offs

**[Risk 1]** 印件清單 14 欄 + Side Panel 對訂單管理人 / 業務主管「跨訂單掃描」場景變慢（每筆需點開檢視）
→ **Mitigation**：訂單管理人 / 業務主管的跨訂單掃描需求應於 add-print-item-overview-to-sales-platform change 提供的「業務平台印件總覽」承接，訂單詳情頁聚焦單筆深入檢視。若實作後反饋強烈，另開 change 引入「精簡 / 詳細」view 切換。

**[Risk 2]** 120px 縮圖讓主表 row 高度 ≥ 128px、5 筆印件主表高度 = 640px+
→ **Mitigation**：prototype 階段先做 120px 觀察實際體感；其他欄位 `align-top` 對齊與規格備註多行呈現可填補垂直空間。若反饋強烈降為 80px。

**[Risk 3]** 「申請異動」按鈕移除後新進業務需自學動線
→ **Mitigation**：表格下方既有 Info Banner 保留作為頁面層級提示；onboarding 文件需同步更新。

**[Risk 4]** 金額組成 A1 變體（雙欄並列）認知負擔比純 A 模式高
→ **Mitigation**：含稅小計欄 `text-muted-foreground` 弱化呈現、避免雙欄都搶視覺；summary stack 應收總額 `text-2xl font-bold` 強調最終焦點。

**[Risk 5]** Side Panel 開啟時與既有 EditOrderPrintItemPanel 並行衝突（業務同時點檢視 + 編輯）
→ **Mitigation**：兩個 Panel 共用 `selectedPrintItem*` state 但語意不同（view vs edit）；UI 確保同時只能開一個（state 互斥）。若實作時遇到複雜邊界另開 OQ 處理。

**[Trade-off]** Side Panel 預設 size=lg（約 480-560px）會擠壓主表可視寬度；若 Side Panel 開啟時想跨多筆對照變難
→ 接受此 trade-off：Side Panel 設計初衷就是「對單筆深入」、不是「多筆對照」；多筆對照仍透過主表 14 欄。

## Migration Plan

本 change 為純 UI / UX 變動，無資料遷移：

1. **Step 1**：Prototype 實作 OrderDetail.tsx 印件清單 + 業務負責人 row + OrderPaymentSection 金額組成
2. **Step 2**：新增 PrintItemDetailSidePanel 元件
3. **Step 3**：DualPriceCell 重命名為 AmountCell（含 import 全 repo 修正）
4. **Step 4**：DESIGN.md 補五條規範
5. **Step 5**：e2e 測試（依 feedback_prototype_playwright）
6. **Step 6**：三視角審查（senior-pm / ceo-reviewer / erp-consultant）
7. **Step 7**：歸檔 + 同步至 Notion 發布版本（order-management spec v0.6）

**Rollback**：本 change 純 UI 異動、無 schema 變更，rollback 為 git revert 對應 commits。

## Open Questions

從 senior-pm 前期介入與 plan 階段識別出的 OQ（已透過 oq-manage skill 寫入 Vault，未來追蹤）：

- **[[ORD-015-印件清單120px縮圖體感驗證|ORD-015]]**：120px 縮圖在 5+ 印件大訂單下的實際體感是否可接受？是否需降為 80px 折衷或提供 view 切換？驗證方式：prototype 上線後請 2-3 位業務試用 1 週。
- **[[ORD-016-印件SidePanel與編輯Panel並行邊界|ORD-016]]**：使用者開檢視 Panel 後又點編輯印件，UX 邊界是兩 Panel 互斥、允許並行、還是改為 Side Panel 內 inline 編輯模式？
- **[[ORD-017-金額組成混合稅率UI呈現|ORD-017]]**：印刷業免稅品（如書籍出版品）情境的金額組成 UI 呈現策略（分項 Badge / summary stack 分行 / 另開 view）；當前 change 採單一稅率假設，混合稅率場景另開 change 處理。

以下兩項本 change 已決議或待 visual review 即可，不開 OQ：

- 印件清單操作欄「檢視」按鈕 icon 選擇（Eye / FileSearch / ExternalLink）：Pass 1 採用 `Eye`，視 visual review 調整。
- DualPriceCell → AmountCell 重命名範圍：本 change 內完成，無需追蹤。
