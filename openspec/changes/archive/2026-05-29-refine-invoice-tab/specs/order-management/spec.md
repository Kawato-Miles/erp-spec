## ADDED Requirements

### Requirement: 發票 Tab 雙層展開（發票列表 + 折讓單子層）

訂單詳情頁發票 Tab 的發票列表 SHALL 採雙層展開呈現（沿用訂單列表印件子層的 `ErpExpandableRow` 範式）。父層 SHALL 精簡為 8 欄：toggle / 發票號碼 / 類別 / 金額（含稅）/ 買受人 / 狀態 / 折讓衍生標籤 / 操作；「對帳編號（藍新自訂）」與「開立人 / 時間」SHALL 移入發票詳情 Side Panel，不在父層顯示。

子層展開內容 SHALL 為該發票的折讓單（SalesAllowance）清單，精簡為 5 欄：折讓號 / 金額 / 原因 / 狀態 / 操作（作廢折讓 + 上傳回簽檔）。折讓的退款 Payment 關聯 SHALL 以「已關聯退款 / 未關聯退款」小標記呈現（不另立欄位）；該發票剩餘可折讓金額 SHALL 顯示於子層區塊標題。

發票級操作（檢視 / 開立折讓 / 作廢發票 / 下載）SHALL 集中於父層操作欄；子層 MUST NOT 放置發票級操作按鈕。操作欄的點擊 MUST NOT 觸發父列展開 / 收合。

#### Scenario: 父層精簡欄位與操作欄

- **WHEN** 業務於訂單詳情頁切換至發票 Tab
- **THEN** 發票列表父層 SHALL 顯示 8 欄（toggle / 發票號碼 / 類別 / 金額（含稅）/ 買受人 / 狀態 / 折讓衍生 / 操作）
- **AND** 父層 SHALL NOT 顯示「對帳編號」與「開立人 / 時間」欄
- **AND** 父層操作欄 SHALL 含「檢視」按鈕；發票狀態為「開立」時另含下載 / 開立折讓 / 作廢發票

#### Scenario: 展開有折讓的發票顯示折讓單子層

- **GIVEN** 一張已開立發票有至少一筆已確認折讓
- **WHEN** 業務點擊該發票父列展開
- **THEN** 子層 SHALL 顯示折讓單清單 5 欄（折讓號 / 金額 / 原因 / 狀態 / 操作）
- **AND** 已關聯退款 Payment 的折讓 SHALL 顯示「已關聯退款」標記、未關聯者顯示「未關聯退款」標記
- **AND** 子層區塊標題 SHALL 顯示該發票剩餘可折讓金額

#### Scenario: 展開無折讓的發票顯示空狀態

- **WHEN** 業務展開一張尚無折讓的發票
- **THEN** 子層 SHALL 顯示空狀態文字「尚無折讓紀錄」（已作廢且無折讓者顯示「此發票已作廢，無折讓紀錄」）
- **AND** 子層 MUST NOT 出現「開立折讓」按鈕（發票級操作僅於父層操作欄）

### Requirement: 發票詳情 Side Panel（InvoiceDetailSidePanel）

發票列表父層操作欄的「檢視」按鈕 SHALL 開啟發票詳情 Side Panel（唯讀，size=2xl / 800px，對齊 Figma node `8977:269607` 規格）。Side Panel SHALL 依 DESIGN.md §1.5 透過 SidePanel 共用元件組（SidePanelBody / SidePanelSection / SidePanelInfoTable / SidePanelTable）組裝，MUST NOT 使用詳情頁專用卡（ErpDetailCard 等）。

Side Panel SHALL 分四區塊：(1) 發票資訊（含對帳編號、藍新開立序號、防偽隨機碼、課稅別、開立人 / 時間、備註；作廢發票補作廢原因 / 作廢人 / 時間）、(2) 買受人資訊（類別 / 名稱 / 統編 / 地址 / 信箱；B2C 補載具 / 捐贈）、(3) 品項明細（五欄唯讀：商品名稱 / 數量 / 單位 / 單價 / 小計 + 銷售額 / 稅額 / 含稅總額）、(4) 對應收款（derived 自 PaymentAllocation，純展示）。

Side Panel 與發票列表子層的職責邊界：Side Panel SHALL 承載發票本身詳情，MUST NOT 含折讓單清單（折讓單清單僅於父層子層展開），兩者不重複。

#### Scenario: 點檢視開啟發票詳情 Side Panel 四區塊

- **WHEN** 業務點擊發票列表父層操作欄「檢視」
- **THEN** 系統 SHALL 開啟發票詳情 Side Panel
- **AND** Side Panel SHALL 顯示「發票資訊」「買受人資訊」「品項明細」「對應收款」四區塊標題
- **AND** Side Panel 標題列 SHALL 顯示發票號碼 + 類別 Badge + 狀態 Badge；發票狀態為「開立」時提供「下載發票」動作

#### Scenario: 品項明細五欄唯讀呈現

- **WHEN** 業務於 Side Panel 檢視品項明細區
- **THEN** 品項 SHALL 以五欄唯讀表格呈現（商品名稱 / 數量 / 單位 / 單價 / 小計）
- **AND** 單價欄標題 SHALL 依發票類別標示稅基（B2B 未稅 / B2C 含稅）
- **AND** 區塊底部 SHALL 顯示銷售額（未稅）/ 稅額 / 含稅總額

#### Scenario: 對應收款 derived 與先開後付提示

- **WHEN** 一張發票尚無核銷收款（先開後付情境）
- **THEN** Side Panel 對應收款區 SHALL 顯示提示「尚未核銷收款」（不顯示空表格）
- **AND** 已有核銷分配時 SHALL 列出收款 ID / 收款方式 / 收款時間 / 分配金額並顯示合計

### Requirement: 發票開立 Dialog 版型（Figma 9041:297881 對齊）

訂單詳情頁開立電子發票 Dialog SHALL 對齊 Figma node `9041:297881` 版型：Dialog 寬度 720px、最大高度 800px；標題列（header）與動作列（footer 取消 / 確認）SHALL 固定，中間表單內容區 SHALL 可獨立滾動；表單區塊之間（基本資訊 / 商品明細 / 備註）SHALL 以分隔線區分。

開立 Dialog 的商品明細 SHALL 透過五欄輸入元件（`InvoiceItemTable`：商品名稱 / 數量 / 單位 / 單價 / 小計）填寫，落實「發票品項符合 ezPay 與電子發票法規硬約束」Requirement；小計 SHALL 由系統計算（數量 × 單價）且唯讀。MUST NOT 以僅有「商品名稱 + 金額」兩欄、數量 / 單位寫死的簡化形式呈現。

#### Scenario: 開立 Dialog 版型（固定 header/footer + 滾動 body + 分隔線）

- **WHEN** 業務於發票 Tab 點擊「手動開立」開啟開立 Dialog
- **THEN** Dialog 寬度 SHALL 為 720px、標題列與取消 / 確認動作列 SHALL 固定
- **AND** 中間表單內容超出時 SHALL 可獨立滾動（header / footer 不隨之捲動）
- **AND** 基本資訊 / 商品明細 / 備註區塊之間 SHALL 以分隔線區分

#### Scenario: 商品明細五欄輸入

- **WHEN** 業務於開立 Dialog 編輯商品明細
- **THEN** 商品明細 SHALL 提供五欄（商品名稱 / 數量 / 單位 / 單價 / 小計）
- **AND** 業務 SHALL 可自由輸入數量與選擇單位（不再被寫死為數量 1 / 單位「式」）
- **AND** 小計欄 SHALL 由系統計算（數量 × 單價）並唯讀顯示
