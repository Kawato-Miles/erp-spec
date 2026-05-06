## Why

ERP Prototype 的詳情頁因「Tabs 之上資訊卡 + Tab 內單層 Table + Tab 內子母 Table」三類內容堆疊在同一捲軸內，導致視覺長度失控（[WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx) 1974 行為全 ERP 最長頁、[OrderDetail.tsx](sens-erp-prototype/src/pages/OrderDetail.tsx) 1279 行、[PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx) 1145 行）。問題本質是 IA 把「業務狀態」與「詳細屬性」扁平化在同一視窗，使用者進入頁面要先捲過 600px+ 資訊區才能進到 Tab。

本 change 採最小化重構：**將原 Tabs 之上的資訊卡整段移入新增的「資訊」Tab 首位**，Tabs 之上僅留 `ErpPageHeader`（含實體名稱 + 狀態 Badge + 主動作）與條件性 InfoBanner（如工單退回原因），即可解除核心視覺長度痛點，無需新增共用元件或修改 sticky 行為。

範圍涵蓋 ERP 全部 4 個詳情頁：訂單、工單、印件、需求單，建立統一的「Tabs 化詳情頁版型」（DESIGN.md §6.3.1）。

> **設計反轉註記**：本 change 初版設計引入 `ErpDetailSubHeader`（rounded container + 4 欄 context-keeping metadata + 排程進度進度條），參考 [Figma 中台商品編輯頁](https://www.figma.com/design/ir3n64dyNMuAXG5Iy5R8el/ERP-中台設計?node-id=7187-300805) 的折衷版型。Lovable 視覺驗證後 Miles 評估「Sub-header 容器累贅、metadata 不需要」，反轉設計回到 `ErpPageHeader`。本 change 範圍收斂為純 Tabs 化 + 印件狀態 Badge bug 補修。詳細反轉理由見 [design.md](openspec/changes/refactor-detail-pages-to-subheader-tab-layout/design.md) D10。
>
> **範圍擴展註記**：apply 階段完成工單 / 印件 / 訂單 / 需求單 4 頁全套 Tabs 化（D11）。原獨立 change `refactor-order-detail-to-hero-tab-layout`（Sticky Hero + 6 Tab pilot，僅 1/46 task 完成）因設計反轉不再適用，已 abandon（目錄刪除）。
>
> **Change name 註記**：本 change name 仍為 `refactor-detail-pages-to-subheader-tab-layout`（提案階段命名），實作後因設計反轉，實質為「全 ERP 詳情頁 Tabs 化版型」。歸檔時若採 rename 成本高（git history、Notion OQ 引用），保留原名並依 design.md 內容追溯。

## What Changes

### 工單詳情頁重構（[WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx)）

- 既有 4 張資訊卡 → 移入新增「資訊」Tab 內單欄垂直排列（前 3 張：工單資訊 / 生產資訊 / 印件檔案）
- 「退回原因提示」（既有 line 798-807）改為 `ErpPageHeader` 下方獨立 InfoBanner（條件顯示）
- Tabs 由 4 個 → 5 個：`資訊（NEW）→ 生產任務 → QC 記錄 → 異動紀錄 → 活動紀錄`
- defaultValue：`資訊`
- `ErpPageHeader` 維持原狀（sticky；返回 + 工單編號 + Badges + 8 個依狀態主動作）

### 印件詳情頁重構（[PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx)）

- 既有 3 張資訊卡 → 移入新增「資訊」Tab 內單欄垂直排列
- Tabs 由 6 個 → 7 個：`資訊（NEW）→ 審稿紀錄 → 工單與生產任務 → QC 紀錄 → 轉交單 → 出貨單 → 活動紀錄`
- defaultValue：`資訊`
- **順手補修 bug**：`ErpPageHeader` 的 badges slot 補上 `PrintItemStatusBadge`（既有未顯示、違反 DESIGN.md §0.1 規範；既有 [PrintItemStatusBadge](sens-erp-prototype/src/components/shared/PrintItemStatusBadge.tsx) 元件 + `derivePrintItemStatusFromWOs` 工具已存在，本 change 直接 reuse 不新建）

### 訂單詳情頁重構（[OrderDetail.tsx](sens-erp-prototype/src/pages/OrderDetail.tsx)）

- 既有 5 張資訊卡（訂單資訊 / 金額及付款狀態 / 發票設定[條件] / 物流設定[條件] / 客戶資訊）從原 `grid grid-cols-[1fr_380px]` 兩欄佈局 → 移入新增「資訊」Tab 內單欄垂直排列
- Tabs 由 5 個 → 6 個：`資訊（NEW）→ 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄`
- defaultValue：`資訊`（從原 `printItems`）
- `ErpPageHeader` 主動作（B2C 前台 Demo / 確認回簽 / 變更路徑導引 Tooltip / 取消訂單）保留

### 需求單詳情頁重構（[QuoteDetailPage.tsx](sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx)）

- 既有 1 張基本資訊卡（含 StatusStepper + 主資訊欄位 + 報價金額橫排）→ 移入新增「資訊」Tab 內
- Tabs 由 4 個 → 5 個：`資訊（NEW）→ 印件報價 → 報價紀錄 → 權限管理 → 活動紀錄`
- defaultValue：`資訊`（從原 `items`）
- `ErpPageHeader` 主動作（角色 / 狀態相關按鈕：送印務評估 / 核可進入議價 / 成交 / 重新報價 / 流失 / 重新指定主管 等）保留
- 多個條件性 inline banner（業務側提示 / 等待核可 / 業務主管視角對照）位置不變（緊貼 `ErpPageHeader` 之下）

### DESIGN.md 規範修訂

- §0.1「印件三分類獨立 ErpDetailCard」：保留三分類規範，補語句「卡片可在『資訊』Tab 內或 Tabs 之上呈現，依詳情頁版型決定（詳見 §6.3）」
- §0.1「詳情頁 Header 只承載實體名稱 + 主動作」：補小例外允許「實體狀態 Badge 可放 header 緊貼標題後」（為印件狀態 Badge 補修留空間）
- §6.3 詳情頁模板新增 §6.3.1「Tabs 化詳情頁版型」骨架（與 §6.3 長捲版型並列；含三版型選擇判斷準則對照表：Sticky Hero + Tabs / Tabs 化版型 / 長捲版型）

## Capabilities

### New Capabilities

無。本 change 為既有 capability 的 IA 重構，不引入新 capability。

### Modified Capabilities

- `prototype-shared-ui`：新增「印件詳情頁 Tabs 化版型」requirement（暫掛此 capability，OQ-2 標明印件詳情頁 capability 歸屬待定）
- `work-order`：MODIFIED「詳情頁 Tab 使用共用元件」requirement（Tab 數量由 4 改 5，新增「資訊」Tab 為首位 + defaultValue）
- `order-management`：新增「訂單詳情頁 Tabs 化版型」requirement（5 → 6 Tabs + defaultValue="info"）
- `quote-request`：新增「需求單詳情頁 Tabs 化版型」requirement（4 → 5 Tabs + defaultValue="info"）

## Impact

### 受影響的程式碼（已實作）

- [WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx)（容器層重構）
- [PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx)（容器層重構 + 補狀態 Badge）
- [OrderDetail.tsx](sens-erp-prototype/src/pages/OrderDetail.tsx)（容器層重構，移除 grid-cols-[1fr_380px] 兩欄佈局）
- [QuoteDetailPage.tsx](sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx)（容器層重構）
- [DESIGN.md](sens-erp-prototype/DESIGN.md)（§0.1 三分類段補語句 / §0.1 Header 規範補例外 / §6.3.1 新增 Tabs 化版型）

### 不受影響

- 審稿任務詳情頁（不在本 change 範圍，OQ-3 標明後續評估）
- Tab 內子母 Table（工單異動紀錄 PT 異動快照 / 印件「工單與生產任務」4 層巢狀皆原樣保留）
- 業務邏輯 / 資料模型 / 角色權責（不觸及 state-machines / business-processes / user-roles spec）

### 風險與緩解

- **印件 Tab `reviewHistoryTabDefault` 動態預設邏輯失效**：原本依 `reviewDimensionStatus` 動態決定預設 Tab（審稿階段優先帶到「審稿紀錄」），改 `defaultValue="info"` 後此邏輯被取消。緩解：使用者進印件詳情頁先看資訊 Tab 是合理初始體驗；若驗收期反饋「審稿階段應預設審稿 Tab」，可後續迭代恢復動態邏輯（成本低）。
- **「資訊 Tab 變雜物倉」風險**：訂單頁 5 張資訊卡進 Tab 後高度可能超出（>1500px）。緩解：Lovable 驗收新增「資訊 Tab 內容高度 ≤ 1500px」檢查（訂單頁專案放寬，因含發票/物流條件性卡）。
- **既有 abandoned change 的歷史**：`refactor-order-detail-to-hero-tab-layout` 已從目錄刪除但 git history 仍可追溯。後續開發者若搜尋 ErpDetailHero 相關概念可能誤入，緩解：DESIGN.md §6.3.1 「版型選擇判斷準則」標明 Sticky Hero 為訂單 pilot 但**已 abandon、改採 Tabs 化**。
