## ADDED Requirements

### Requirement: 工單詳情頁資訊分組（四分類區塊）

系統 SHALL 在工單詳情頁（`/work-orders/:id`）以四個獨立 `ErpDetailCard` 區塊呈現資料，卡片順序為 **A → D → B → C**（印務第一動作是看進度，D 卡前置）：

1. **工單資訊（A）**：當前工單的系統欄位。SHALL 包含工單編號、工單類型、工單狀態（沿用 STATUS_STEPS 步驟條）、關聯訂單（連結）、關聯印件（連結至印件詳情）、負責印務、印務主管、建立日期。MUST NOT 含印件編號、印件類型、印件規格等印件屬性（避免與 B 重複）。MUST NOT 重複顯示 D 卡的交貨日期與生產數量（避免 A/D 欄位交集）。
2. **印製資料（D）**：**本工單層**進度與排程（非印件層聚合）。SHALL 包含目標數量、工單交貨日期、每份印件需產、生產數量、入庫數量、完成度百分比，以及排程摘要（預估完成日、工單交期預警）。label 使用單工單語境命名（不加「累計」前綴）。
3. **印件資訊（B）**：透過 `wo.printItemId` 查詢對應 `PrintItem`，以與印件詳情頁 / 審稿詳情頁**完全相同**的欄位集呈現。頂端兩顆 Badge（印件狀態 + 審稿狀態），下方 `ErpInfoTable` 列出印件編號、印件類型、產品名稱、紙張/材質、製程內容、規格備註、包裝備註、出貨方式、訂單來源。
4. **稿件資料（C）**：與印件詳情頁 / 審稿詳情頁相同內容，含難易度、當前輪次、免審稿快速路徑以及原始 / 審稿後 / 縮圖三區塊。

B 與 C 區塊 SHALL 重用共用元件 `PrintItemSpecCard` / `PrintItemArtworkCard`（吃 ViewModel interface），確保三頁（工單 / 印件 / 審稿）資料語彙一致。B / C 卡 MUST NOT 預設收合。

「印件狀態」SHALL 由 `derivePrintItemStatusFromWOs` 派生，輸入集合 MUST 為「該印件下所有工單排除已取消」：`workOrders.filter(w => w.printItemId === wo.printItemId && w.status !== '已取消')`。派生來源集合未完整載入時，B 卡 Badge SHALL 顯示 loading skeleton。

若該印件同時關聯打樣工單與大貨工單，B 卡印件狀態 Badge SHALL 附 tooltip 揭露派生基礎（例：「基於 3 張工單派生：打樣 1 張 / 大貨 2 張」），避免印務誤判。

當 `wo.printItemId` 查無對應 PrintItem（資料異常）時，B 與 C 卡 SHALL 顯示 `ErpEmptyState`「查無對應印件」，不得 crash；A 與 D 卡仍正常渲染。

#### Scenario: 印務開啟工單詳情頁看到進度與印件規格

- **WHEN** 印務開啟某工單詳情頁（該工單關聯至印件 PI-001）
- **THEN** 頁面 SHALL 依序顯示四張卡：工單資訊 / 印製資料 / 印件資訊 / 稿件資料
- **AND** 印務滾動至第二張卡時 SHALL 看到本工單的生產數量、入庫數量、完成度
- **AND** 印件資訊卡 SHALL 顯示 PI-001 的完整印件屬性（編號、類型、紙張/材質、製程內容等）
- **AND** 稿件資料卡 SHALL 顯示 PI-001 的難易度、當前輪次與稿件檔案
- **AND** 印務 MUST NOT 需要跳轉至印件詳情頁才能看到印件規格

#### Scenario: 工單查無對應印件時 B / C 卡呈現

- **GIVEN** 工單 WO-999 因資料異常，`printItemId` 指向不存在的印件
- **WHEN** 印務開啟該工單詳情頁
- **THEN** 工單資訊卡 SHALL 正常顯示工單自身資料
- **AND** 印製資料卡 SHALL 正常顯示本工單進度
- **AND** 印件資訊卡與稿件資料卡 SHALL 顯示 `ErpEmptyState`，提示「查無對應印件」
- **AND** 頁面 MUST NOT crash

#### Scenario: 工單詳情頁印件狀態與印件總覽頁一致

- **GIVEN** 印件 PI-001 關聯四張工單：WO-A（製作中）、WO-B（已完成）、WO-C（製程審核完成）、WO-D（已取消）
- **WHEN** 印務分別從印件總覽頁與 WO-A 工單詳情頁的「印件資訊」卡查看印件狀態
- **THEN** 兩處顯示的印件狀態 Badge SHALL 完全一致，皆由 `derivePrintItemStatusFromWOs([WO-A.status, WO-B.status, WO-C.status])` 派生（WO-D 被排除）

#### Scenario: 印件同時有打樣與大貨工單時 Badge tooltip

- **GIVEN** 印件 PI-005 關聯一張打樣工單（WO-P，已完成）與兩張大貨工單（WO-M1、WO-M2，製作中）
- **WHEN** 印務開啟 WO-M1 工單詳情頁
- **THEN** B 卡印件狀態 Badge SHALL 附 tooltip 顯示「此狀態基於 3 張工單派生：打樣 1 張 / 大貨 2 張」
- **AND** 印務 SHALL 可據此判讀派生狀態的語意基礎

## MODIFIED Requirements

### Requirement: 工單詳情頁任務分組呈現

系統 SHALL 在工單詳情頁以「任務（Task）」為分組單位呈現生產任務清單。任務依廠商自動分組（由生產任務的工序設定決定），印務不需手動歸入。

工單詳情頁 SHALL 包含以下區塊（依序）：
- 四分類資訊卡：工單資訊（A）/ 印製資料（D）/ 印件資訊（B）/ 稿件資料（C）（詳見「工單詳情頁資訊分組」requirement）
- 任務清單（依廠商分組，每組可展開/收合），位於四卡之後
- 每個任務顯示：廠商名稱、工廠類別（自有/加工/外包/中國廠商）、任務狀態、交付狀態、所含生產任務列表

印務 SHALL 可在任務分組內新增、編輯、刪除生產任務。新增生產任務時，系統 SHALL 依工序設定自動歸入對應廠商的任務分組。

#### Scenario: 印務查看工單的任務分組

- **WHEN** 印務開啟工單詳情頁
- **THEN** 系統 SHALL 以任務（Task）為分組顯示生產任務，每組標示廠商名稱與工廠類別
- **AND** 每組 SHALL 可展開查看該任務下的所有生產任務

#### Scenario: 新增生產任務自動歸入任務分組

- **WHEN** 印務在工單詳情頁新增一筆生產任務，選擇的工序對應廠商為「蒝大雅」
- **THEN** 系統 SHALL 自動將該生產任務歸入「蒝大雅」任務分組
- **AND** 若該廠商尚無任務分組，系統 SHALL 自動建立新的任務分組
