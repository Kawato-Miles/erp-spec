## ADDED Requirements

### Requirement: 印件詳情頁資訊分組（四分類區塊）

系統 SHALL 在印件詳情頁（`/print-items/:printItemId`）以四個獨立 `ErpDetailCard` 區塊呈現印件資料，卡片順序固定為 **A → B → C → D**：

1. **所屬訂單（A）**：當前印件的訂單關聯上下文。SHALL 包含訂單編號（連結至訂單詳情）、案名、客戶。MUST NOT 含印件編號、印件狀態、審稿狀態、印件類型等印件屬性（避免與 B 重複）。
2. **印件資訊（B）**：印件實體屬性，三頁共用相同欄位集。區塊頂端 SHALL 以兩顆 Badge 並排顯示「印件狀態」「審稿狀態」，下方 SHALL 以 `ErpInfoTable` 列出印件編號、印件類型、產品名稱、紙張/材質、製程內容、規格備註、包裝備註、出貨方式、訂單來源。
3. **稿件資料（C）**：審稿維度屬性。SHALL 包含難易度（Badge）、當前輪次、免審稿快速路徑；下方 SHALL 以 `ErpSummaryGrid cols={3}` 呈現原始印件檔 / 審稿後印件檔 / 縮圖三個並列區塊（重用 `buildArtworkSummaryItems`）。
4. **印製資料（D）**：跨工單聚合交期、排程、進度。SHALL 包含訂購數量、交貨日期、預計產線，以及以 `ErpSummaryGrid` 呈現的印件層聚合「**累計**預計總數 / **累計**完成數 / **累計**入庫數 / 工單完成」（label 前綴「累計」，傳達跨工單聚合語意）。

印件詳情頁 SHALL 顯示全部四個區塊。B / C 區塊 SHALL 使用共用元件 `PrintItemSpecCard` / `PrintItemArtworkCard`（吃 ViewModel interface），確保與工單 / 審稿詳情頁語彙一致。

「印件狀態」SHALL 由 `derivePrintItemStatusFromWOs(工單清單)` 派生，輸入集合 MUST 排除 `status === '已取消'` 的工單（工單狀態機中不存在「已作廢」；「已作廢」為生產任務層狀態）。若 store 尚未載入該印件的全部關聯工單，B 卡 Badge SHALL 顯示 loading skeleton 而非以不完整集合派生。

#### Scenario: 業務在印件詳情頁查看完整印件資料

- **WHEN** 業務開啟 `/print-items/PI-001`
- **THEN** 頁面 SHALL 依序顯示四張獨立卡：所屬訂單 / 印件資訊 / 稿件資料 / 印製資料
- **AND** 印件資訊卡頂端 SHALL 顯示印件狀態與審稿狀態兩顆 Badge 並排
- **AND** 印件資訊卡 MUST NOT 在 `ErpInfoTable` 中重複列出印件狀態或審稿狀態
- **AND** 所屬訂單卡 MUST NOT 顯示印件編號或印件類型
- **AND** 印製資料卡 `ErpSummaryGrid` 的 label SHALL 為「累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成」

#### Scenario: 印件未建立任何工單時印製資料區塊數值

- **GIVEN** 印件 PI-002 尚無任何關聯工單
- **WHEN** 業務開啟該印件詳情頁
- **THEN** 印製資料卡的「累計預計總數 / 累計完成數 / 累計入庫數」SHALL 顯示為 0
- **AND** 「工單完成」SHALL 顯示「0 / 0 張」
- **AND** 印件狀態 Badge SHALL 顯示「稿件未上傳」或由派生邏輯決定的初始狀態，而非隱藏

#### Scenario: 印件無稿件檔案時稿件資料區塊呈現

- **GIVEN** 印件 PI-003 尚無任何 `reviewFiles`
- **WHEN** 任一角色開啟該印件詳情頁
- **THEN** 稿件資料卡 SHALL 仍顯示難易度、當前輪次、免審稿快速路徑的 `ErpInfoTable`
- **AND** 原始 / 審稿後 / 縮圖三區塊 SHALL 隱藏或顯示「尚無檔案」佔位

#### Scenario: 印件關聯工單含已取消狀態時派生結果

- **GIVEN** 印件 PI-004 關聯三張工單：WO-A（製作中）、WO-B（已完成）、WO-C（已取消）
- **WHEN** 業務開啟該印件詳情頁
- **THEN** 系統 SHALL 呼叫 `derivePrintItemStatusFromWOs([WO-A.status, WO-B.status])` 派生印件狀態（排除 WO-C）
- **AND** B 卡印件狀態 Badge SHALL 顯示基於兩張有效工單的派生結果，不被 WO-C 污染
