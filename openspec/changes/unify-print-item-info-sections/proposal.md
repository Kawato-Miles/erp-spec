## Why

**真正要解決的痛點**：目前公司管理印件製作進度是用 **Slack 訊息回報**，印務把進度發在群組、管理層再彙整回系統，造成管理與印務間每天要花大量時間做資訊同步。根因是 ERP 內部沒有「以印件為主語」的完整詳情視圖——印務與管理層無法在 ERP 中直接讀到印件的完整狀態與進度，只好退回 Slack。

**次要問題**：三個詳情頁（工單 / 印件 / 審稿）各自演化，顯示的印件資料嚴重不一致：印件詳情頁缺紙張/材質、製程內容、規格備註、包裝備註、訂單來源、免審稿路徑；審稿詳情頁缺訂購數量、預計產線、進度聚合；工單詳情頁完全沒有印件規格與審稿狀態，只有可跳轉的印件名稱。且三頁都把所有欄位攤平在單一 `ErpInfoTable`，無法以「區塊」為單位依模組語境隱藏整組資訊。即使工單頁想補齊印件規格，也沒有統一語彙可套用（可能出現「工單頁寫『印件規格』、印件頁寫『印件備註』但實際是同樣內容」的欄位命名不一致）。

**本 change 的價值層級**：
1. **高價值**：工單詳情頁補齊印件規格 + 稿件資料 → 印務開工單直接判讀印件正確性，不需跳頁；管理層開工單直接掌握進度，不需等 Slack 回報
2. **中價值**：三頁統一「印件資訊」語彙（印件狀態、審稿狀態、印件編號、紙張/材質等），避免跨頁誤讀
3. **基礎建設**：抽共用元件，未來訂單頁印件 Tab 或報價單印件預覽可重用

## What Changes

- 將印件 Info 統一切成四個語意清楚的區塊：**A 系統資訊 / B 印件資訊 / C 稿件資料 / D 印製資料**，四區塊各以獨立 `ErpDetailCard` 承載
- A 卡 title 依詳情頁單據類型動態命名（避免「基本資訊」語意模糊）：
  - 印件詳情頁 A → **「所屬訂單」**
  - 工單詳情頁 A → **「工單資訊」**（保留既有 STATUS_STEPS 步驟條）
  - 審稿詳情頁 A → **「審稿任務」**
- 三頁依所屬模組決定區塊組合與順序：
  - 印件詳情頁（工單管理模組）：A → B → C → D
  - 工單詳情頁（工單管理模組）：**A → D → B → C**（印務開工單第一眼要看進度，D 卡優先；B/C 不預設收合）
  - 審稿詳情頁（審稿模組）：A → B → C（無 D）
- 欄位歸屬（與 Miles 定案）：
  - 印件編號 / 印件狀態 / 審稿狀態 → 全歸 **B**
  - 訂單編號 / 案名 / 客戶 → **A**，依單據類型動態帶出
  - 進度（完成數 / 入庫數 / 工單完成）→ **D**
  - 印件的製程內容 / 製程說明 → **B**（審稿、印務都要看）
- B 區塊頂端以兩顆 Badge 並排顯示「印件狀態 + 審稿狀態」，下方接 `ErpInfoTable`
- 抽出兩個共用元件 `PrintItemSpecCard`（B 區塊）、`PrintItemArtworkCard`（C 區塊）供三頁共用；A、D 各頁自組（內容因單據類型而異）
- 共用元件型別抽 ViewModel interface（`PrintItemSpecViewModel` / `PrintItemArtworkViewModel`），僅含 B/C 卡顯示所需欄位，避免鎖死 `OrderPrintItem`，為未來報價單印件預覽、訂單頁印件 Tab 保留擴展空間
- 印件頁 D 卡的進度欄位加「累計」前綴（「累計完成數 / 累計入庫數」），與工單頁 D 卡（單工單數字）語意區分，避免跨頁比對混淆
- 顯示邏輯以「模組」為單位，不做 User 級權限控管（使用者能進此頁代表模組開放）
- 本次不改資料結構、不改狀態機、不改 API，純屬詳情頁資訊重組與視覺切分

**不在本次範圍**：
- 訂單詳情頁（`OrderDetail.tsx`）的印件 Tab 與 `MockEcOrderDetail.tsx`（B2C 會員頁）不納入
- B 區塊欄位補齊（如印件詳情頁補紙張/材質等）屬顯示層修正，不影響資料模型

## Capabilities

### New Capabilities

無。本次不引入新 capability。

### Modified Capabilities

- `order-management`：印件詳情頁資訊分組規範（四區塊 A/B/C/D 組合）納入模組顯示規範
- `work-order`：工單詳情頁新增「印件資訊」「稿件資料」兩個區塊（透過 `wo.printItemId` 查 `PrintItem` 呈現）；印件狀態由 `derivePrintItemStatusFromWOs` 派生顯示

> 審稿詳情頁（ReviewerDetail）目前未有獨立 capability spec，其資訊分組規範僅於 Prototype 與 DESIGN.md 反映，不在本次 OpenSpec delta 範圍內。

## Impact

- **前端 Prototype**：
  - 新增 `src/components/shared/PrintItemSpecCard.tsx`、`src/components/shared/PrintItemArtworkCard.tsx`
  - 修改 `src/pages/PrintItemDetail.tsx`、`src/pages/prepress/ReviewerDetail.tsx`、`src/pages/WorkOrderDetail.tsx`
  - 重用既有資產：`PrintItemStatusBadge`、`ReviewDimensionStatusBadge`、`DifficultyLevelBadge`、`buildArtworkSummaryItems`、`derivePrintItemStatusFromWOs`、`ErpDetailCard` / `ErpInfoTable` / `ErpSummaryGrid`
- **後端 / API**：無異動
- **資料模型**：無異動
- **規格文件**：
  - `openspec/specs/order-management/spec.md` 新增「印件詳情頁資訊分組」子節
  - `openspec/specs/work-order/spec.md` 新增「工單詳情頁資訊分組」子節（含工單頁新顯示印件規格與稿件資料的規範）
  - `DESIGN.md` §0.1 補一條「詳情頁資訊四分類」原則
- **使用者影響**：
  - 印務（工單詳情頁使用者）首次在工單頁看到印件規格與稿件資料，可直接確認印件是否與實際印製規格一致，不需跳頁
  - 管理層可透過「印件詳情頁」直接掌握印件製作進度，不再仰賴 Slack 回報彙整
  - 審稿人員（審稿詳情頁使用者）資訊可見範圍維持不變，僅重組為三張卡
  - 業務（印件詳情頁使用者）可一次看齊印件所有屬性，不再缺欄位
- **成功指標**（UAT 觀察項，Prototype 階段不量化）：
  - **主指標**：管理層在 Slack 詢問印務「某印件進度」的次數 → 顯著下降（目標：歸零或僅限例外）
  - **次指標**：印務在工單詳情頁為了確認印件規格而跳轉至印件詳情頁的次數 → 顯著下降
  - **一致性**：工單詳情頁 B 卡顯示的「印件狀態 Badge」與印件總覽頁永遠一致（由 `derivePrintItemStatusFromWOs` 派生路徑統一保證）
  - **欄位對齊**：比對工單頁 B 卡欄位與訂單詳情頁印件 Table 欄位，若有命名或內容差異（「工單寫印件規格、印件寫印件備註」型）MUST 消除
- **風險**：
  - 工單詳情頁頁面變長（多兩張卡），透過「D 卡前置（A→D→B→C）」緩解——印務第一眼仍看到進度
  - 三頁的 B / C 卡內容一致性仰賴抽出的共用元件，若未來有「工單頁需看更多印件資訊」需求，需擴充元件 props 而非另寫一份
  - 派生狀態在 store hydration 空窗期可能顯示不完整，需在元件層以 loading skeleton 處理
