## ADDED Requirements

### Requirement: 印件詳情頁資訊分組（四分類區塊）

系統 SHALL 在印件詳情頁（`/print-items/:printItemId`）以四個獨立 `ErpDetailCard` 區塊呈現印件資料，卡片順序固定為 **A → B → C → D**：

1. **所屬訂單（A）**：當前印件的訂單關聯上下文。SHALL 包含訂單編號（連結至訂單詳情）、案名、客戶。MUST NOT 含印件編號、印件類型、印製狀態、審稿狀態等印件屬性（避免與 B 重複）。
2. **印件資訊（B）**：印件實體屬性，欄位集合對齊**需求單 PrintItem**（`quote-request` spec）+ 訂單階段系統欄位。三頁共用相同欄位集。以 `ErpInfoTable cols={2}` 呈現 11 個欄位：印件編號、印件類型、**印製狀態（Badge）**、**審稿狀態（Badge）**、難易度（Badge）、免審稿快速路徑、訂單來源、出貨方式、**預計產線**、規格備註、包裝備註。狀態以 label/value row 格式呈現（而非裸 Badge 排於卡頂端），每個狀態前都有明確 label。**規格備註與包裝備註因內容較長，SHALL 獨佔整列（`span: 2`）**。當前輪次不在 B 卡範圍（審稿輪次資訊由審稿詳情頁的 Stepper 承擔）。生產任務相關欄位（紙張/材質、製程內容、產品名稱等）**不在本卡範圍**，對應到工單或生產任務詳情頁呈現。
3. **印件檔案（C）**：印件檔案區。以 `ErpSummaryGrid cols={3}` 呈現原始印件檔 / 審稿後印件檔 / 縮圖三個並列區塊（重用 `buildArtworkSummaryItems`）。本卡聚焦「最終印製檔案參考」。**無檔案時仍維持三欄位顯示**，cell 內以「—」佔位，不隱藏整組 layout。
4. **生產資訊（D）**：印件層的**工單齊套視角**—— 多張關聯工單彙總為印件整體生產進度（與工單詳情頁 D 卡的「生產任務齊套」視角不同）。SHALL 包含訂購數量、交貨日期，以及印件層聚合「累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成」（label 前綴「累計」，傳達跨工單聚合語意）。**預計產線不在本卡範圍**（屬印件屬性，歸 B 卡）。

印件詳情頁 SHALL 顯示全部四個區塊。B / C 區塊 SHALL 使用共用元件 `PrintItemSpecCard` / `PrintItemArtworkCard`（吃 ViewModel interface），確保與工單 / 審稿詳情頁語彙一致。

「印製狀態」SHALL 由 `derivePrintItemStatusFromWOs(工單清單)` 派生，輸入集合 MUST 排除 `status === '已取消'` 的工單（工單狀態機中不存在「已作廢」；「已作廢」為生產任務層狀態）。若 store 尚未載入該印件的全部關聯工單，B 卡「印製狀態」欄位 SHALL 顯示 loading skeleton 而非以不完整集合派生。

#### Scenario: 業務在印件詳情頁查看完整印件資料

- **WHEN** 業務開啟 `/print-items/PI-001`
- **THEN** 頁面 SHALL 依序顯示四張獨立卡：所屬訂單 / 印件資訊 / 印件檔案 / 生產資訊
- **AND** 印件資訊卡 SHALL 以 `ErpInfoTable` 呈現 11 個欄位（含預計產線），印製狀態與審稿狀態各佔一個 label/value row
- **AND** 印件資訊卡 MUST NOT 顯示紙張/材質、製程內容、產品名稱等生產任務相關欄位
- **AND** 印件資訊卡的規格備註與包裝備註欄位 SHALL 獨佔整列（`span: 2`），以容納較長內容
- **AND** 生產資訊卡 MUST NOT 顯示預計產線（已歸 B 卡印件屬性）
- **AND** 所屬訂單卡 MUST NOT 顯示印件編號或印件類型
- **AND** 印件檔案卡 MUST NOT 顯示難易度、當前輪次、免審稿快速路徑（已歸 B 卡）
- **AND** 製作狀況卡的聚合數字 label SHALL 為「累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成」

#### Scenario: 印件未建立任何工單時生產資訊區塊數值

- **GIVEN** 印件 PI-002 尚無任何關聯工單
- **WHEN** 業務開啟該印件詳情頁
- **THEN** 生產資訊卡的「累計預計總數 / 累計完成數 / 累計入庫數」SHALL 顯示為 0
- **AND** 「工單完成」SHALL 顯示「0 / 0 張」
- **AND** 印件資訊卡的印製狀態 Badge SHALL 顯示「等待中」或由派生邏輯決定的初始狀態

#### Scenario: 印件無稿件檔案時印件檔案區塊呈現

- **GIVEN** 印件 PI-003 尚無任何 `reviewFiles`
- **WHEN** 任一角色開啟該印件詳情頁
- **THEN** 印件檔案卡 SHALL 仍顯示三個欄位：原始印件檔 / 審稿後印件檔 / 縮圖
- **AND** 每個欄位 cell 內 SHALL 顯示「—」佔位
- **AND** MUST NOT 隱藏整組 layout 或改用 `ErpEmptyState`

#### Scenario: 印件關聯工單含已取消狀態時派生結果

- **GIVEN** 印件 PI-004 關聯三張工單：WO-A（製作中）、WO-B（已完成）、WO-C（已取消）
- **WHEN** 業務開啟該印件詳情頁
- **THEN** 系統 SHALL 呼叫 `derivePrintItemStatusFromWOs([WO-A.status, WO-B.status])` 派生印製狀態（排除 WO-C）
- **AND** 印件資訊卡「印製狀態」Badge SHALL 顯示基於兩張有效工單的派生結果，不被 WO-C 污染
