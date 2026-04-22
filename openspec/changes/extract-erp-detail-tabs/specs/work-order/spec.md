## ADDED Requirements

### Requirement: 詳情頁 Tab 使用共用元件

工單詳情頁的 Tab 切換（切換內容區：生產任務 / QC 記錄 / 異動紀錄 / 活動紀錄）SHALL 使用 `ErpDetailTabs` 共用元件，與需求單詳情頁 Tab 同一元件來源。

共用元件外觀規範由 DESIGN.md §1.4 Organism 清單與 §1.4.4 決策樹定義；本 requirement 確保工單詳情頁不再手寫 Tabs + TabsList + TabsTrigger 的 class 組合。

#### Scenario: 工單詳情頁 Tab 使用 ErpDetailTabs

- **WHEN** 使用者進入工單詳情頁
- **THEN** 頁面 Tab 區域 SHALL 由 `ErpDetailTabs` 元件渲染，DOM 結構包含外層卡片容器、底線式 TabsList、共用 body padding（與需求單詳情頁 Tab 一致）
- **AND** 頁面程式碼中 SHALL NOT 手寫 `<Tabs>` + `<TabsList>` + `<TabsTrigger>` 的 class 組合（由 `ErpDetailTabs` 元件統一提供）
