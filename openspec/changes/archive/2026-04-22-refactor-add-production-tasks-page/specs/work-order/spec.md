## MODIFIED Requirements

### Requirement: 批次新增生產任務

系統 SHALL 支援生管透過 side panel 逐筆新增生產任務，新增完成後回填至工單內的生產任務表格；選擇製程後內容下拉自動篩選可用選項，同廠商之生產任務於「儲存」時自動分組為同一任務（Task），Task 名稱 SHALL 為廠商名稱。

**頁面層級 UI 規範**（本次 P1 補充）：
- 頁面骨架 SHALL 為 `AppLayout` → `ErpPageHeader` → `ErpSummaryGrid`（成本摘要）→ 雙欄區（左：工單資訊 + 分類 Tab / 右：拼版試算 sticky）
- `ErpPageHeader` badges SHALL 只保留印件名稱識別 badge，SHALL NOT 重複顯示成本數字（成本交由下方 `ErpSummaryGrid` 呈現）
- `ErpSummaryGrid` SHALL 緊接 `ErpPageHeader` 下方，**6 欄**依序：`設備費` / `材料小計` / `工序小計` / `裝訂小計` / `色數加價` / `總成本`
  - 每欄 value SHALL 為 `NT$ {localeNumber}`，無資料時顯示 `—`
  - 「材料小計 / 工序小計 / 裝訂小計」SHALL 為對應分類 rows 的 `unitPrice × qty` 加總，不含設備費與色數加價
  - 「設備費」SHALL 為所有 rows 的 `setupFee`（開機費）加總（複用 `calculateSetupFee` util）
  - 「色數加價」SHALL 為工序 rows 的 `colorCost` 加總（複用 `calculateColorCost` util）
  - 「總成本」SHALL 為 5 項加總，value SHALL 以 `text-base font-semibold tabular-nums` 加強視覺（其他 5 欄維持 `text-sm` 標準）
- 工單資訊區塊 SHALL 使用 `ErpDetailCard`（title="工單資訊"、Info icon） + `ErpInfoTable` 呈現工單編號 / 印件名稱 / 數量 / 交貨日期 / 製程說明等 key-value
- 三分類 Tab 外層容器 SHALL 使用 Organism 層共用容器元件（`ErpDetailCard` 或未來 `ErpTabsCard`）；內部 Tab 結構與色系於 P2 色盤 tokenize 後再更新
- 三個分類 Section 的 `<table>` SHALL 套用 `.erp-table` class（DESIGN.md §1.5），與全站列表頁視覺一致

**Design Token 規範**（本次 P1 補充）：
- 頁面外殼 / 容器 / key-value label / 分隔線等非 category 色 SHALL 使用 design token（`border-border` / `text-foreground` / `text-muted-foreground` / `bg-muted` / `bg-card`），SHALL NOT 直接寫 hex（`#e3e4e5` 等）
- Tab 三色 badge（amber/blue/green）、印件名稱綠 badge 於 P2 另行 tokenize，本次維持現狀

（既有 UI 規範 / 分組規範 / Scenario 維持不變，此處只補充頁面層級與 token 規範。）

#### Scenario: 頁面頂部成本摘要（6 欄分項 + 總成本）

- **WHEN** 生管於新增生產任務頁尚未輸入任何 draft
- **THEN** 頁面頂部 `ErpSummaryGrid` 6 欄 SHALL 全顯示 `—`
- **WHEN** 生管於材料 Tab 新增 2 筆 draft，合計 `unitPrice × qty = NT$ 1,500`
- **THEN** 「材料小計」SHALL 顯示 `NT$ 1,500`；「總成本」SHALL 同步顯示 `NT$ 1,500`；其他 4 欄 SHALL 維持 `—`
- **WHEN** 生管再於工序 Tab 新增 1 筆 `unitPrice × qty = NT$ 800`、選設備（setupFee=NT$ 200）、色數加價 NT$ 50
- **THEN** 「工序小計」SHALL 顯示 `NT$ 800`、「設備費」SHALL 顯示 `NT$ 200`、「色數加價」SHALL 顯示 `NT$ 50`；「總成本」SHALL 顯示 `NT$ 2,550`（5 項加總）

#### Scenario: 容器與表格視覺一致性

- **WHEN** 生管進入新增生產任務頁
- **THEN** 工單資訊區塊 SHALL 以 `ErpDetailCard` 樣式呈現（與工單詳情頁 / 訂單詳情頁的 Info 卡片視覺一致）
- **AND** 三個分類表格 SHALL 套 `.erp-table` class（邊框 / 偶數列底色 / header 灰底與全站列表頁一致）
- **AND** 頁面外殼 / 容器 / label 的顏色 SHALL 由 design token 提供，不得出現字面 hex（除 P2 範圍內的 Tab / badge 色系）
