## ADDED Requirements

### Requirement: 共用單位 LOV

Prototype SHALL 提供一份跨模組共用的「單位」LOV（List Of Values，下拉選項枚舉），供所有需要記錄「品項單位」的場景引用（包含但不限於需求單品項、訂單印件、預計發票品項、發票品項）。LOV 內容 SHALL 符合 ezPay 電子發票 API `ItemUnit` 限制（中文 ≤ 2 字 / 英數 ≤ 6 字），以支援未來真實串接時的合規性。

**LOV 內容（11 項，順序為事實正本）**：

```
張、本、冊、份、個、卷、盒、套、批、式、組
```

各選項說明：

| 單位 | 說明 |
|------|------|
| 張 | 散頁類（名片、DM、海報、傳單）|
| 本 | 裝訂類（書本、手冊）|
| 冊 | 多本合輯（套冊、年鑑）|
| 份 | 套件類（簡章、提案書）|
| 個 | 立體 / 非紙類（紙箱、紙袋、貼紙）|
| 卷 | 連續類（捲筒貼紙、貼紙卷）|
| 盒 | 包裝整盒（名片整盒 = 100 張）|
| 套 | 多件組合銷售（套裝禮盒）|
| 批 | 業務內部批號計算（如 1 批 = 1 印張）|
| 式 | 雜支 / 無法以件計價（製版費、運費、設計費）|
| 組 | 多件組合且不分拆銷售（組合包裝、配套）|

實作建議（Prototype）：以 TypeScript `as const` 陣列或 enum 匯出 `UnitOption` 型別，置於 `src/types/shared.ts` 或 `src/types/unitOption.ts`；同時提供 `UnitSelect` 共用元件（基於 shadcn/ui `Select`）供各 Dialog 引用。

#### Scenario: 共用 LOV 在發票開立 Dialog 出現完整 11 項

- **GIVEN** 業務於訂單詳情頁點擊「開立發票」
- **WHEN** 業務點擊品項列的「單位」欄位
- **THEN** dropdown SHALL 顯示 11 個選項，順序為「張、本、冊、份、個、卷、盒、套、批、式、組」
- **AND** 業務 SHALL NOT 自由輸入文字（防止填入超出 ezPay Varchar(2) 限制的值）

#### Scenario: 共用 LOV 在需求單品項出現完整 11 項

- **GIVEN** 業務於需求單編輯頁新增 / 編輯印件
- **WHEN** 業務點擊「單位」欄位
- **THEN** dropdown SHALL 顯示同一份 11 項 LOV
- **AND** 既有需求單資料若 `unit` 為 LOV 內值 SHALL 正常回填顯示

#### Scenario: 共用 LOV 字符長度全部符合 ezPay 限制

- **GIVEN** 共用單位 LOV 已定義
- **WHEN** 系統檢核每個選項的中文字數
- **THEN** 11 個選項全部 SHALL 為 1 中文字（≤ ezPay `ItemUnit` Varchar(2) 中文 2 字上限）
- **AND** 未來擴充 LOV 選項時 SHALL 強制檢核新增項 ≤ 2 中文字 / ≤ 6 英數字

#### Scenario: 共用 LOV 變更時所有引用處同步

- **GIVEN** 未來 LOV 新增一項（如「打」）
- **WHEN** 開發者於 `src/types/shared.ts` 加入該項
- **THEN** 需求單品項 / 訂單印件 / 預計發票 / 發票品項所有 `UnitSelect` 引用處 SHALL 自動可見新選項
- **AND** 既有資料的 `unit` 欄位 SHALL NOT 受影響
