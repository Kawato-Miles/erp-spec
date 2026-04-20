## ADDED Requirements

### Requirement: BOM 分類以 Tab 呈現

系統 SHALL 在工單詳情頁（WorkOrderDetail）與新增生產任務頁（AddProductionTasks）中，將材料 / 工序 / 裝訂三類以 Tab 切換呈現，預設停在「材料」Tab。Tab 標籤 SHALL 顯示該類別當前筆數。

#### Scenario: 工單詳情頁 BOM Tab 切換

- **WHEN** 印務打開工單詳情頁，該工單底下生產任務分佈為 3 筆材料、2 筆工序、1 筆裝訂
- **THEN** 系統 SHALL 顯示三個 Tab：「材料 (3)」「工序 (2)」「裝訂 (1)」，預設停在「材料」
- **AND** 系統 SHALL 在每個 Tab 內僅渲染對應分類的生產任務表格（其他分類隱藏）

#### Scenario: 新增生產任務頁 Tab 切換

- **WHEN** 印務進入新增生產任務頁，三個分類草稿行（rows）各自獨立維護
- **THEN** 系統 SHALL 顯示三個 Tab：「材料 (N)」「工序 (N)」「裝訂 (N)」，N 為各分類當前草稿筆數，預設停在「材料」
- **AND** 切換 Tab 不會影響其他分類已填的草稿內容
- **AND** 每個 Tab 右上角 SHALL 提供「新增一筆」按鈕，新增的 row 僅加入當前 Tab 的草稿陣列

#### Scenario: 分類為空時顯示 empty state

- **WHEN** 印務在工單詳情頁切換到某分類 Tab（例如裝訂），而該工單無裝訂生產任務
- **THEN** 系統 SHALL 顯示「尚無裝訂項目」的 empty state 文字
- **AND** Tab 標籤的筆數徽章 SHALL 顯示 (0)
