## MODIFIED Data Model

### QuoteRequestItem（需求單印件項目）— `unit` 欄位改引用共用 LOV

> 整個 QuoteRequestItem 表格其他欄位不變，僅 `unit` 欄位「說明」與「型別」更新，從 inline 寫死 9 項改為引用 `prototype-shared-ui` 共用單位 LOV。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 單位 | unit | 列舉 | | | 引用 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md)（11 項：張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批 / 式 / 組）|

**變更前**：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 單位 | unit | 單選 | | | 張/本/冊/份/個/卷/盒/套/批 |

**變更理由**：

- 抽出至共用 LOV 後新增「式」「組」兩項，補製版費 / 雜支 / 組合包裝場景缺口
- 鏈式帶入「需求單印件 → 訂單印件 → PlannedInvoice → Invoice」時單位天生對齊，無需映射層
- 統一 LOV 後未來擴充選項只動一處

## ADDED Requirements

### Requirement: 需求單印件單位來自共用 LOV

需求單編輯頁的印件項目「單位」欄位 SHALL 為 dropdown 元件，選項來自 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md)。業務 SHALL NOT 自由輸入文字。

#### Scenario: 需求單印件 dropdown 顯示完整 11 項

- **GIVEN** 業務於需求單編輯頁新增 / 編輯印件項目
- **WHEN** 業務點擊「單位」欄位
- **THEN** dropdown SHALL 顯示 11 個選項，順序為「張、本、冊、份、個、卷、盒、套、批、式、組」
- **AND** 業務選擇後 SHALL 寫入 QuoteRequestItem.unit

#### Scenario: 既有需求單資料 unit 值在新 LOV 內可正常顯示

- **GIVEN** 既有需求單印件已存有 `unit` 為 LOV 內值（如「張」/「本」）
- **WHEN** 業務開啟編輯頁
- **THEN** 系統 SHALL 在 dropdown 中正確選中該值
- **AND** 系統 MUST NOT 顯示「未知單位」錯誤
