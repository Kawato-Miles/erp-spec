## ADDED Requirements

### Requirement: 工單詳情頁資訊分組（四分類區塊）

系統 SHALL 在工單詳情頁（`/work-orders/:id`）以三個獨立 `ErpDetailCard` 區塊呈現資料，卡片順序為 **工單資訊 → 生產資訊 → 印件檔案**：

1. **工單資訊（合併工單系統欄位 + 狀態步驟條 + 印件屬性）**：以單一卡承載當前工單的系統欄位與關聯印件的實體屬性，**卡內分為兩個獨立 `ErpInfoTable` 子區塊**，靠獨立邊框 + `space-y-5` 間距視覺區分。
   - **頂端步驟條**：`STATUS_STEPS`（工單流程 5 階段）
   - **A 段（工單系統欄位）**：工單編號、工單類型、關聯訂單（連結）、工單狀態、負責印務、印務主管、建立日期。MUST NOT 含印件名稱（避免與 B 段派生資料不一致）、製程說明（與印件製程重複）、交貨日期與生產/入庫數量（歸生產資訊卡）
   - **B 段（印件屬性）**：透過 `wo.printItemId` 查詢對應 `PrintItem`，以與印件詳情頁 / 審稿詳情頁**完全相同**的 11 欄位呈現：印件編號、印件類型、**印製狀態（Badge）**、**審稿狀態（Badge）**、難易度（Badge）、免審稿快速路徑、訂單來源、出貨方式、預計產線、規格備註、包裝備註。狀態以 label/value row 格式呈現，每個狀態前都有明確 label。規格備註與包裝備註 SHALL 獨佔整列（`span: 2`）。生產任務相關欄位（紙張/材質、製程內容、產品名稱）**不在本段範圍**
2. **生產資訊**：工單層的**生產任務齊套視角**—— 工單內的生產任務彙總為工單完成度（與印件詳情頁生產資訊卡的「工單齊套」視角不同）。**分兩層呈現（對齊印件詳情頁生產資訊結構）**：
   - **日期 / 排程類**：`ErpInfoTable cols={2}` 呈現交貨日期、預估完成日（含交期預警）、排程進度、每份印件需產
   - **數量 / 完成度類**：`ErpSummaryGrid` 並列呈現目標數量、生產數量、入庫數量、完成度

   完成度以**百分比文字**呈現，不放進度條。label 使用單工單語境命名（不加「累計」前綴）。
3. **印件檔案**：與印件詳情頁 / 審稿詳情頁相同內容，三區塊 `ErpSummaryGrid` 呈現原始印件檔 / 審稿後印件檔 / 縮圖。**無檔案時仍維持三欄位顯示**，cell 內以「—」佔位，不隱藏整組 layout。

工單資訊卡與印件檔案卡 SHALL 重用共用元件 `PrintItemSpecCard` / `PrintItemArtworkCard`（吃 ViewModel interface），確保三頁（工單 / 印件 / 審稿）資料語彙一致。`PrintItemSpecCard` 的 A 段 `systemItems` 於工單頁包含工單系統欄位、`topContent` 包含 STATUS_STEPS 步驟條。

「印製狀態」SHALL 由 `derivePrintItemStatusFromWOs` 派生，輸入集合 MUST 為「該印件下所有工單排除已取消」：`workOrders.filter(w => w.printItemId === wo.printItemId && w.status !== '已取消')`。派生來源集合未完整載入時，工單資訊卡 B 段的「印製狀態」欄位 SHALL 顯示 loading skeleton。

若該印件同時關聯打樣工單與大貨工單，工單資訊卡 B 段的「印製狀態」label 旁 SHALL 附 Info icon + tooltip 揭露派生基礎（例：「此狀態基於 3 張工單派生：打樣 1 張 / 大貨 2 張」），避免印務誤判。

當 `wo.printItemId` 查無對應 PrintItem（資料異常）時，工單資訊卡與印件檔案卡 SHALL 顯示 `ErpEmptyState`「查無對應印件」，不得 crash；生產資訊卡仍正常渲染。

#### Scenario: 印務開啟工單詳情頁看到進度與印件規格

- **WHEN** 印務開啟某工單詳情頁（該工單關聯至印件 PI-001）
- **THEN** 頁面 SHALL 依序顯示三張卡：工單資訊 / 生產資訊 / 印件檔案
- **AND** 工單資訊卡分兩個獨立 `ErpInfoTable` 子區塊：A 段（工單系統 7 欄位）+ B 段（11 欄印件屬性），頂端附 STATUS_STEPS 步驟條
- **AND** 工單資訊卡 MUST NOT 顯示「印件名稱」欄位（改由 B 段呈現實際印件屬性）
- **AND** 工單資訊卡 MUST NOT 顯示「製程說明」欄位（避免與印件層製程資訊重複）
- **AND** 生產資訊卡分兩層：`ErpInfoTable`（日期 / 排程類）+ `ErpSummaryGrid`（數量 / 完成度並列）
- **AND** 生產資訊卡完成度欄位以百分比文字（非進度條）呈現
- **AND** 規格備註與包裝備註欄位 SHALL 獨佔整列（span=2）
- **AND** 工單資訊卡 B 段 MUST NOT 顯示紙張/材質、製程內容、產品名稱等生產相關欄位
- **AND** 印件檔案卡 SHALL 顯示 PI-001 的原始 / 審稿後 / 縮圖三區塊，無檔案時 cell 內顯示「—」不隱藏 layout
- **AND** 印務 MUST NOT 需要跳轉至印件詳情頁才能看到印件規格

#### Scenario: 工單查無對應印件時 B / C 卡呈現

- **GIVEN** 工單 WO-999 因資料異常，`printItemId` 指向不存在的印件
- **WHEN** 印務開啟該工單詳情頁
- **THEN** 工單資訊卡 SHALL 顯示 `ErpEmptyState`「查無對應印件」
- **AND** 生產資訊卡 SHALL 正常顯示本工單進度
- **AND** 印件檔案卡 SHALL 顯示 `ErpEmptyState`，提示「查無對應印件」
- **AND** 頁面 MUST NOT crash

#### Scenario: 工單詳情頁印製狀態與印件總覽頁一致

- **GIVEN** 印件 PI-001 關聯四張工單：WO-A（製作中）、WO-B（已完成）、WO-C（製程審核完成）、WO-D（已取消）
- **WHEN** 印務分別從印件總覽頁與 WO-A 工單詳情頁的「印件資訊」卡查看印製狀態
- **THEN** 兩處顯示的印製狀態 Badge SHALL 完全一致（工單詳情頁的印製狀態位於工單資訊卡 B 段），皆由 `derivePrintItemStatusFromWOs([WO-A.status, WO-B.status, WO-C.status])` 派生（WO-D 被排除）

#### Scenario: 印件同時有打樣與大貨工單時 tooltip

- **GIVEN** 印件 PI-005 關聯一張打樣工單（WO-P，已完成）與兩張大貨工單（WO-M1、WO-M2，製作中）
- **WHEN** 印務開啟 WO-M1 工單詳情頁
- **THEN** 工單資訊卡 B 段「印製狀態」label 旁 SHALL 附 Info icon + tooltip 顯示「此狀態基於 3 張工單派生：打樣 1 張 / 大貨 2 張」
- **AND** 印務 SHALL 可據此判讀派生狀態的語意基礎

## MODIFIED Requirements

### Requirement: 工單詳情頁任務分組呈現

系統 SHALL 在工單詳情頁以「任務（Task）」為分組單位呈現生產任務清單。任務依廠商自動分組（由生產任務的工序設定決定），印務不需手動歸入。

工單詳情頁 SHALL 包含以下區塊（依序）：
- 三分類資訊卡：工單資訊（合併工單系統欄位 + 印件屬性）/ 生產資訊 / 印件檔案（詳見「工單詳情頁資訊分組」requirement）
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
