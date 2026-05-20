## MODIFIED Requirements

### Requirement: 與 PrintItem 關聯（補印觸發）

補印場景下，業務 SHALL 於 ticket 內建立補印 PrintItem。系統建 PrintItem 時：

- 自動寫入 `PrintItem.type = '補印印件'`（refine-after-sales-refund-and-add-supplementary-print change 新增，詳見 [prototype-shared-ui spec § PrintItemTypeLabel 共用元件](../prototype-shared-ui/spec.md) 三值列舉設計）
- 自動寫入 `related_after_sales_ticket_id` FK，供下游工單流程回溯來源

**[本 change 變更] 補印審稿自動通過 + 沿用原稿**：

補印 PrintItem **不走人工審稿流程**，系統建立時自動完成審稿環節：

| 欄位 | 行為 |
|------|------|
| `reviewStatus` | 直接設為 `'合格'`（不經「等待審稿」「審稿中」中間態） |
| `reviewFiles` | **複製來源印件的 `reviewFiles`**（保留全部稿件歷史檔案，供印務查閱） |
| `reviewRounds` | **複製來源印件的 `reviewRounds`** + 新增一筆「售後補印自動通過輪次」 |
| `currentRoundId` | 指向新增的「售後補印自動通過輪次」 |
| `assignedReviewerId` | 維持 `null`（無需指派審稿員） |
| `skipReview` | 維持 `false`（避免與既有「業務手動勾選免審稿」語意混淆；本 change 用「售後補印自動通過輪次」表達補印跳審稿）|
| `reviewActivityLogs` | 複製來源印件的歷史 ActivityLog + append 一筆「售後補印自動通過審稿」事件（含來源印件 ID + ticket 編號 + 自動通過時間） |
| `printItemStatus` | 設為 `'待生產'`（印件總覽顯示為「等待中」狀態，印務主管立刻可分配工單） |

**「售後補印自動通過輪次」**的 `ReviewRound` 欄位規範：

- `source = '售後補印'`（新增 enum 值，區別於 `'審稿'` / `'免審稿'`）
- `sourcePrintItemId` 指向來源印件 ID（新增 optional 欄位）
- `submittedBy = '系統'`、`submittedAt = 當下`
- `submittedNote = '售後補印自動通過 — 沿用 PI-XXX 合格稿件'`
- `reviewerId = null`、`reviewedAt = 當下`
- `result = '合格'`
- `roundNo` = 來源印件的最後一輪 + 1（接續原序號）

**業務情境涵蓋範圍**：

- **適用**：原稿無問題的補印（印件瑕疵 / 物流破損 / 規格符合）— 占售後補印 99% 情境
- **不適用**：補印同時改稿（規格變更）— 此情境應走「規格變更」OrderAdjustment 而非補印路徑（OQ-SP-1 留釐清是否需要區分入口）
- **例外處理**：若印務分配工單時發現稿件實際有問題，可走既有「補件 / 不合格」狀態機回退處理（OQ-SP-2）

#### Scenario: 業務於 ticket 內建補印 PrintItem 自動通過審稿

- **GIVEN** ticket.resolution = 補印、原印件 PI-001 reviewStatus = '合格'、currentRoundId 指向 Round-3（合格輪次）
- **WHEN** 業務於 ticket 內點「建立補印印件」、選來源印件 PI-001、填補印數量 50 並提交
- **THEN** 系統 SHALL 建立補印 PrintItem PI-002，type = '補印印件'、related_after_sales_ticket_id 寫入
- **AND** PI-002.reviewStatus SHALL = '合格'（直接終態）
- **AND** PI-002.reviewFiles SHALL = 複製 PI-001.reviewFiles（含 Round-3 的合格稿件檔案）
- **AND** PI-002.reviewRounds SHALL = 複製 PI-001.reviewRounds + 新增一筆 Round-4（source = '售後補印'、result = '合格'、sourcePrintItemId = PI-001、submittedNote 含「沿用 PI-001 合格稿件」）
- **AND** PI-002.currentRoundId SHALL 指向新增的 Round-4
- **AND** PI-002.assignedReviewerId SHALL = null
- **AND** PI-002.printItemStatus SHALL = '待生產'
- **AND** PI-002.reviewActivityLogs SHALL append「售後補印自動通過審稿」事件
- **AND** PI-002 SHALL 立刻出現在印務主管「印件總覽」的「等待中」分類（無需經過審稿員）
- **AND** PI-002 SHALL NOT 出現在審稿員的「等待審稿」工作清單

#### Scenario: 補印 PrintItem 印務分配工單

- **GIVEN** PI-002（補印印件）printItemStatus = '待生產'、currentRoundId 指向 Round-4（自動通過）
- **WHEN** 印務主管於印件總覽點 PI-002 的「分配印件」
- **THEN** 系統 SHALL 允許印務主管建立工單（與大貨印件流程同）
- **AND** 工單建立時稿件來源 SHALL 為 PI-002.reviewFiles 中 currentRoundId 對應檔案（= 沿用 PI-001 的最終合格稿件）

#### Scenario: 補印自動通過審稿後可追溯來源稿件

- **GIVEN** PI-002 由 PI-001 自動產生補印
- **WHEN** 客服 / 印務 / 業務於 PI-002 詳情頁查閱
- **THEN** 系統 SHALL 顯示 reviewRounds 列表（含複製自 PI-001 的歷史 + 自動通過輪次）
- **AND** 自動通過輪次 SHALL 標示「售後補印自動通過 — 沿用 [PI-001](../print-items/PI-001) 合格稿件」可點擊跳轉來源印件
- **AND** 來源印件追溯路徑：PI-002 → Round-4.sourcePrintItemId = PI-001

#### Scenario: 補印自動通過後印務發現稿件實際有問題（例外處理）

- **GIVEN** PI-002 透過自動通過建立、印務主管分配工單後印務發現稿件版本實際有錯
- **WHEN** 印務 escalate 給業務 / 審稿主管
- **THEN** 業務 SHALL 可於 PI-002 詳情頁觸發「重新審稿」動作（透過既有「補件」路徑）
- **AND** 補件後 PI-002 走原審稿流程（指派審稿員 → 審稿）
- **AND** 此例外情境留 OQ-SP-2 進一步釐清標準動作流程

