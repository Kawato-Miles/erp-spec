## Why

QC 相關規格散落於 6 個 spec（state-machines、business-processes、business-scenarios、work-order、production-task、user-roles），彼此存在五項矛盾：

- **M1 異動期間計算**：異動狀態下 QC 是否持續運作，各 spec 描述不一
- **M2 可申請上限公式**：QC 單批次目標數量上限的計算，多個 spec 公式不同
- **M3 Data Model 空殼**：QCRecord / QCDetail 欄位定義僅有 placeholder，實作無從對齊
- **M4 入庫數量跨層同名異義**：生產任務 / 工單 / 印件層的「入庫數量」同名但語意不同
- **M5 實體歸屬含糊**：QC 單究竟掛於工單還是生產任務，FK 設計未明確

這些矛盾導致 Prototype 各自表述，實作風險高。本 change 將 QC 規格統一收斂至獨立 capability（`qc`），作為 QC 規則的 Single Source of Truth，其他 capability 的 QC 段落改為引用。

**來源**：本 change 內容來自 `claude/zealous-bardeen-16ede8` 分支 commit `8ad96e7`（2026-04-19）— 原以直接修改 main spec 形式執行，現反向封裝為正規 OpenSpec change 保留變更歷史與歸檔軌跡。

## What Changes

- **ADDED capability**：`qc` — 10 個 Requirement 涵蓋實體定位、狀態機、建立流程、可申請上限、結果記錄、通過數/入庫分層、QC 完成觸發、異動期間行為、QC 與出貨關聯、QC 角色權限
- **MODIFIED capability `work-order`**：
  - MODIFIED 「QC 單建立」：加外化引用（實體定位與可申請上限公式引用至 qc capability）
  - MODIFIED 「QC 執行與結果記錄」：加外化引用（狀態機與結果欄位引用至 qc capability）；Scenario WHEN 子句由「逐件抽驗填入通過/不通過結果」改為「填入通過數量與不通過數量」
- **MODIFIED capability `state-machines`**：
  - MODIFIED 「完成度計算」：補 `pt_qc_passed` 欄位引用至 qc capability
  - REMOVED 「QC 單狀態機」：移至 qc capability
- **MODIFIED capability `user-roles`**：
  - MODIFIED 「QC 角色編輯限制」：明示 QC 單建立權屬印務、QC 角色僅執行；新增 Scenario AND 子句「MUST NOT 允許建立新 QC 單」
- **BREAKING**：刪除 `QCDetail` 空殼實體（從未落實；未來逐件判定、缺陷代碼分類、抽樣規則等進階功能另開 change 於 qc capability 新增）

## Impact

- **新增檔案**：`openspec/specs/qc/spec.md`（archive 時自動建立）
- **修改檔案**：`openspec/specs/work-order/spec.md`、`openspec/specs/state-machines/spec.md`、`openspec/specs/user-roles/spec.md`
- **連帶同步修改**（超出 delta spec 機制範圍，archive 後手動處理）：
  - `state-machines/spec.md` Purpose 段「涵蓋實體」移除「QC 單」，並新增「QC 單狀態機已移至獨立 qc capability」說明段
  - `work-order/spec.md` § Data Model 的 `QCRecord` / `QCDetail` 兩段改為引用 qc capability（並註明 QCDetail 已移除）
  - `user-roles/spec.md` 前段 QC 角色限制描述補「不建立 QC 單」
  - `CLAUDE.md` § Spec 規格檔清單新增 QC 模組；§ 載入原則新增 QC 設計類型（**master 上已在其他 commit 完成**，確認一致即可）
- **Prototype 對齊**（非本 change 範圍，另起 task）：QCRecord 欄位 rename、通過 / 不通過雙欄位 UI、QC 人員選擇、可申請餘額提示
