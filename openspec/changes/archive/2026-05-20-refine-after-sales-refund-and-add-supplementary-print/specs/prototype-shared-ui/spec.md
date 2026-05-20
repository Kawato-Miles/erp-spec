## ADDED Requirements

### Requirement: PrintItemTypeLabel 共用元件

Prototype SHALL 提供 `PrintItemTypeLabel` 共用元件用於統一呈現 `PrintItem.type` 三值（打樣印件 / 大貨印件 / 補印印件），於所有印件列表頁 / 印件詳情頁 / 訂單詳情頁印件區 / ticket 詳情頁的補印清單區一致使用，避免散落於各模組各自實作徽章造成設計系統脫節。

**元件規範**：

- **輸入**：`type: '打樣印件' | '大貨印件' | '補印印件'`、`relatedAfterSalesTicketId?: string`、`relatedAfterSalesTicketNo?: string`
- **三值呈現**：
  - `打樣印件`：藍色系標籤，文字「打樣」
  - `大貨印件`：灰色 / 中性色系標籤，文字「大貨」
  - `補印印件`：橙色 / 強調色系標籤，文字「補印」
- **互動行為**：
  - `打樣` / `大貨`：純展示，無 hover / click
  - `補印`：hover 顯示 tooltip「補印（{relatedAfterSalesTicketNo}）」；click 跳轉 ticket 詳情頁
- **無障礙**：元件 MUST 設置 `aria-label` 描述印件類型，補印額外標示「來自售後服務單 {relatedAfterSalesTicketNo}」

**禁用方式（避免設計系統脫節）**：

- MUST NOT 為「補印」設計專屬徽章元件（如 `SupplementaryPrintBadge`），所有印件類型走統一元件
- MUST NOT 在補印旁加額外 emoji / 圖示作為「特殊識別」（與 [global UI 規範禁止 emoji](../../../memory/shared/ui-business-rules.md) 一致）

#### Scenario: 列表頁顯示三種類型

- **GIVEN** 業務平台印件總覽列表有 3 筆印件：打樣 / 大貨 / 補印各一
- **WHEN** 列表渲染
- **THEN** 每筆印件 SHALL 在「印件類型」欄位顯示 `PrintItemTypeLabel`
- **AND** 三筆標籤顏色 SHALL 不同（藍 / 灰 / 橙）
- **AND** 三筆標籤文字 SHALL 分別為「打樣」「大貨」「補印」

#### Scenario: 補印標籤 hover 顯示來源 ticket

- **GIVEN** 列表中有一筆補印印件 `relatedAfterSalesTicketNo = AS-202605-0042`
- **WHEN** 業務 hover 該筆「補印」標籤
- **THEN** 系統 SHALL 顯示 tooltip「補印（AS-202605-0042）」

#### Scenario: 補印標籤 click 跳轉 ticket

- **GIVEN** 列表中有一筆補印印件 `relatedAfterSalesTicketId = ticket-uuid-001`
- **WHEN** 業務 click 該筆「補印」標籤
- **THEN** 系統 SHALL 導航至 `/after-sales-tickets/ticket-uuid-001` 對應的 ticket 詳情頁

#### Scenario: 打樣 / 大貨標籤不可互動

- **GIVEN** 列表中有一筆大貨印件
- **WHEN** 業務 hover 或 click「大貨」標籤
- **THEN** 系統 SHALL NOT 顯示任何 tooltip 或導航

---

### Requirement: 列表頁印件類型欄位通用設計

所有印件列表頁 / 含印件清單的列表頁 SHALL 統一新增「印件類型」欄位，欄位內以 `PrintItemTypeLabel` 元件顯示三值。同時 SHALL 在篩選器（filter）中提供「印件類型」三選項（打樣 / 大貨 / 補印），業務可單選或多選。

**適用列表頁清單**（印件級列表頁與印件出現位置；訂單級列表頁不適用）：

| 列表頁 | spec 引用 | 備註 |
|--------|---------|------|
| 訂單詳情頁印件區（表格內）| [order-management spec](../order-management/spec.md) | 同一訂單下印件總表，不需 filter |
| 業務平台印件總覽 | [sales-platform spec](../sales-platform/spec.md) | 沿用中台版「印務主管印件總覽（防掉單）」內容 + filter 預設值差異 |
| 印務主管印件總覽（防掉單） | [work-order spec](../work-order/spec.md) | 中台版印件總覽，業務平台 / 印務平台沿用 |
| 工單列表 | [work-order spec](../work-order/spec.md) | 每個工單對應一個印件，反查 PrintItem.type |
| 派工看板工序卡片內任務明細 | [task-dispatch-board spec](../task-dispatch-board/spec.md) | 任務對應印件，反查 type |
| ticket 詳情頁補印印件清單區 | [after-sales-ticket spec](../after-sales-ticket/spec.md) | 清單區直接顯示補印 PrintItem |

**訂單列表（OrderList）不適用**：訂單下可能有多筆印件（含不同 type），訂單級列表頁無單一「印件類型」可顯示。若需在訂單列表標示「訂單含補印」， 另開 follow-up change 設計「訂單級補印標示」（聚合欄位設計）。

**欄位呈現規範**：

- 欄位寬度：足以完整顯示「補印（AS-202605-0042）」標籤，最小寬度 96px
- 欄位位置：建議緊鄰「印件名稱」或「印件編號」欄位之後（讓使用者第一眼看到「這是什麼類型的印件」）
- 排序：印件類型欄位 SHALL 支援排序（依字母順序 / 內部排序權重「補印 > 打樣 > 大貨」皆可，由各列表頁自行決定）
- filter UI：採用 chip-style multi-select 篩選器，預設三選項全選

**訂單詳情頁印件區特殊規則**：

- 該區為同訂單下印件的總表，補印與大貨混合排列，**不獨立分組**
- 補印靠「印件類型」欄位識別，**不額外加分隔線 / 區塊標題**
- 不需要 filter（同訂單印件數量有限，加 filter 反而干擾），但欄位 MUST 顯示

#### Scenario: 業務於業務平台印件總覽用印件類型 filter 篩選

- **GIVEN** 業務平台印件總覽列表有 100 筆印件（80 大貨、15 打樣、5 補印）
- **WHEN** 業務於 filter 取消勾選「大貨」「打樣」只保留「補印」
- **THEN** 列表 SHALL 僅顯示 5 筆補印印件
- **AND** filter 狀態 SHALL 顯示「印件類型：補印（1/3 已選）」

#### Scenario: 派工看板工序卡片顯示印件類型欄位

- **GIVEN** 派工看板某工序卡片內有 10 筆任務，對應 7 筆大貨印件、3 筆補印印件
- **WHEN** 印務主管展開該工序卡片的任務明細表
- **THEN** 任務明細表 SHALL 在「印件類型」欄位顯示三筆「補印」標籤
- **AND** 印務主管 SHALL 可 hover「補印」標籤看到來源 ticket 編號

#### Scenario: 訂單詳情頁印件區補印與大貨混合排列

- **GIVEN** 訂單 SO-001 有 4 筆印件（2 大貨 + 2 補印，補印來自 AS-001）
- **WHEN** 業務於訂單詳情頁印件區檢視
- **THEN** 4 筆印件 SHALL 在同一張表格內呈現（按建立時間或印件編號排序）
- **AND** 「印件類型」欄位 SHALL 三值並列（2 個「大貨」+ 2 個「補印」）
- **AND** 系統 SHALL NOT 加任何分組標題 / 分隔線區隔補印與大貨
