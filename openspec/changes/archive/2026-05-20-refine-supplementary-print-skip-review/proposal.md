## Why

[refine-after-sales-refund-and-add-supplementary-print](../archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/) 歸檔後，Miles 在實際走查業務情境時發現一個違反業界實務的設計瑕疵：

**現有實作**：業務於 ticket 內建補印 PrintItem 時，系統把審稿欄位**全部重置**（`reviewStatus = '尚未送印'`、`reviewRounds = []`、`reviewFiles = []`、`currentRoundId = null`、`assignedReviewerId = null`）。意思是補印印件**必須重新走完整審稿流程**才能進入製作。

**業務實務**：印刷業售後補印 99% 情境下，客戶反映的是「印件瑕疵 / 物流破損 / 規格不符」等**製造問題**，**稿件本身沒問題**。業務不應該再走一次審稿（沒意義 + 拖累交期）。

**業界 MES 驗證**：
- PrintNow：「reorder 同一稿件可 skip proofing 直接 to production」為業界標準
- PrintEPS / Tharstern：「skip artwork approval」為內建功能、用於 reorder / reprint 情境
- Printavo：「自動 approval for repeat orders」最佳實務
- 較新的 MES（含 Tharstern）採「自動通過審稿輪次」方案保留歷史軌跡

**真正要解決的問題**：補印印件 = 沿用原印件最終合格稿件 = 跳過審稿環節 + 直接進入製作維度等待中（讓印務主管立即可分配工單）。

背景對應 [Vault 印件實體卡](../../../memory/erp/ERP_Vault/05-entities/印件.md)、[Vault 售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)。

## What Changes

### 補印印件審稿自動通過機制

- **MODIFIED**：`addReprintPrintItemFromTicket` 建立補印印件時：
  - `reviewStatus` 由「尚未送印」改為「合格」（直接終態）
  - `reviewFiles` 由空陣列改為**複製來源印件的 `reviewFiles`**（保留全部稿件歷史檔案）
  - `reviewRounds` 由空陣列改為**複製來源印件的 `reviewRounds`** + 新增一筆「自動通過輪次」（標註 `auto_approved = true`、`source_print_item_id = 來源印件 ID`、`reason = '售後補印自動通過 — 沿用原印件合格稿件'`）
  - `currentRoundId` 指向新增的「自動通過輪次」
  - `reviewActivityLogs` 由空陣列改為 append 一筆「售後補印自動通過審稿」事件（含來源印件 ID + ticket 編號）
  - `assignedReviewerId` 維持 null（無需指派審稿員）
  - `skipReview` 維持 false（避免與既有「業務手動勾選免審稿」語意混淆；本 change 用「自動通過輪次」表達補印跳審稿）
  - `printItemStatus = '待生產'`（不變；印件總覽顯示為「等待中」由印務主管分配工單）

### Spec 描述同步

- **MODIFIED**：`after-sales-ticket` spec § Requirement: 與 PrintItem 關聯（補印觸發）
  - 將「補印 PrintItem 走原 PrintItem 完整生命週期（審稿 → 工單 → 生產任務 → QC → 出貨）」改為「補印 PrintItem 跳過審稿環節，直接進入製作維度（工單 → 生產任務 → QC → 出貨）；審稿透過自動通過輪次完成」
  - 加入 Scenario：「業務於 ticket 內建補印 PrintItem 自動通過審稿」

### Prototype Type 註解同步

- `types/order.ts` PrintItemType `'補印印件'` 註解更新：「走『跳過審稿（自動通過輪次）→ 工單 → 排程 → 生產任務 → QC → 出貨』流程」

### 不在範圍

- **補印改稿情境**：若客戶要求改稿（補印同時改規格），不在本 change 範圍。實務上此情境應走「規格變更」OrderAdjustment 而非「補印」（OQ-SP-1 留待釐清是否需要區分入口）
- 補印印件的工單建立 / 排程 / 生產任務流程：本 change 只動審稿環節，下游不動
- 「審稿合格但稿件實際有問題」情境：補印印件自動通過後若印務發現稿件問題需 escalate 處理（OQ-SP-2 留釐清處理路徑）

## Capabilities

### New Capabilities

無新建 capability。

### Modified Capabilities

- `after-sales-ticket`：MODIFIED 補印審稿環節描述（跳過 → 自動通過輪次 + 沿用原稿）

## Impact

### 前端
- `src/store/useErpStore.ts` 內 `addReprintPrintItemFromTicket` 改寫

### Type
- `src/types/order.ts` PrintItemType 註解同步

### 規格文件
- `openspec/specs/after-sales-ticket/spec.md` § Requirement: 與 PrintItem 關聯（補印觸發）

### 使用者
- **業務 / 諮詢**：建補印後不需要再上傳稿件、不需等審稿合格才看到印件進入製作
- **審稿員**：補印印件不會出現在審稿工作清單（不被誤分配）
- **印務主管**：建補印的同一時刻在「印件總覽」看到此印件（狀態 = 等待中），可立即分配工單
- **會計 / 客服**：若客戶事後查「補印用哪版稿件」，可透過 ticket → 補印印件 → reviewFiles 反查

### 成功指標

| 指標 | 目標 |
|------|------|
| 業務從建補印到印務主管可分配工單的延遲 | ≤ 0 秒（同 transaction 完成；目前需要審稿員整輪流程） |
| 補印印件可追溯來源稿件 | 100%（reviewRounds 含 source_print_item_id） |
| 補印不出現在審稿工作清單 | 100%（reviewStatus = 合格，不在等待審稿列表） |

### 風險

| 風險 | 處理 |
|------|------|
| 自動通過審稿無人複核稿件問題 | 印務分配工單時若發現稿件問題可中止；補印仍可走「不合格」狀態（業務 / 主管手動推進）|
| 「補印改稿」情境誤判 | OQ-SP-1 留釐清；初版業務若要改稿應走「規格變更」OrderAdjustment，不走補印路徑 |
| 舊資料補印（v0.4 期間建立但走完整審稿）| 不 backfill；新建補印自動跳審稿 |
