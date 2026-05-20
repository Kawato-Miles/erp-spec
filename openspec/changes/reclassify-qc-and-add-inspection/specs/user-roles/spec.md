## MODIFIED Requirements

### Requirement: 模組存取權限模型

系統 SHALL 對每個角色定義四個模組（需求單、報價單/訂單、工單、任務）的存取層級。權限層級分為 R/W（可讀寫）與 X（無存取權限）。

**「R/W」為粗粒度標示**，意義為「該角色於該模組內擁有讀取與寫入能力」。實際細粒度權限（可讀哪些資料、可寫哪些欄位、可執行哪些動作）由各模組 spec 的 Requirement 規範。例如業務主管於需求單模組為 R/W，但細粒度上僅可核可特定狀態且自己被指定的需求單，這類細節由 [quote-request spec](../quote-request/spec.md) 的對應 Requirement 定義。

新增角色時 SHALL 同時於 user-roles spec 設定粗粒度 R/W 標示，並於對應模組 spec 補充細粒度行為 Requirement。

#### Scenario: 角色存取無權限模組

WHEN 角色的模組權限為 X
THEN 系統 SHALL 不顯示該模組的任何入口，且任何 API 請求 MUST 回傳權限不足錯誤

#### Scenario: 角色存取可讀寫模組

WHEN 角色的模組權限為 R/W
THEN 系統 SHALL 允許該角色查看與編輯該模組中其職責範圍內的資料
AND 細粒度權限（可讀範圍、可寫欄位、可執行動作）SHALL 由各模組 spec 的 Requirement 規範

#### Scenario: 完整權限對照表

WHEN 系統配置角色權限
THEN 各角色的模組權限 SHALL 依下表設定：

| 角色 | 需求單 | 報價單/訂單 | 工單 | 任務 |
|------|--------|------------|------|------|
| Supervisor | R/W | R/W | R/W | R/W |
| 訂單管理人 | X | R/W | R/W | R/W |
| 業務 | R/W | R/W | X | X |
| 諮詢 | R/W | R/W | X | X |
| 業務主管 | R/W | X | X | X |
| 會計 | X | R/W | X | X |
| 審稿主管 | X | X | X | X |
| 審稿 | X | X | X | X |
| 印務主管 | R/W | X | R/W | X |
| 印務 | X | X | R/W | R/W |
| 生管 | X | X | X | R/W |
| 師傅 | X | X | X | R/W |
| 中國廠商 | X | X | X | R/W |
| 外包廠商 | X | X | X | R/W |
| QC | X | X | R/W | R/W |
| 出貨 | X | X | R/W | R/W |
| EC商品管理 | X | X | X | X |

QC 角色於 C1 後對「任務」模組由 X 改為 R/W（之前為 X），因為 QC 任務與品檢任務改以 ProductionTask 承載（屬於「任務」模組），QC 人員需於任務模組內查看與更新被指派的任務。細粒度限制詳見 § QC 角色編輯限制。

---

### Requirement: 業務與諮詢角色的工單查閱限制

業務與諮詢角色的工單模組權限為 X（無直接存取），但 SHALL 可透過訂單詳情頁面查閱工單狀態與 QC / 品檢任務摘要。

#### Scenario: 業務從訂單頁面查閱工單狀態

WHEN 業務角色開啟訂單詳情頁面
THEN 系統 SHALL 顯示該訂單關聯工單的狀態摘要（唯讀）
AND SHALL 顯示 QC / 品檢任務摘要（唯讀；含 type = `qc`（印件入庫檢查）與 `inspection`（工序中間品檢）的 ProductionTask 結果概要）
AND MUST NOT 提供導航至工單模組的連結

#### Scenario: 業務角色可轉單

WHEN 業務角色在需求單或訂單中執行轉單操作
THEN 系統 SHALL 允許將該單據指派給其他業務或諮詢角色

---

### Requirement: QC 角色編輯限制

QC 角色（兼任品檢執行）SHALL 擁有工單模組與任務模組的 R/W 權限。

工單模組可編輯範圍 MUST 限於 QC 任務（type = `qc`，印件入庫檢查）與品檢任務（type = `inspection`，工序中間品檢）的結果欄位，不可修改工單其他內容；任務模組可編輯範圍 MUST 限於被指派的 QC PT 與 inspection PT，不可修改 production 任務或其他人指派的任務。

QC PT（每印件強制 1 個）由系統在工單規劃完成後自動建立；inspection PT 由印務在工單規劃時對特定 production PT 加入。QC 角色僅能執行已建立的任務、提交 ProductionTaskWorkRecord（reported_quantity + passed_quantity，系統自動計算 failed_quantity）。QC / inspection 任務生命週期詳見 [production-task spec § ProductionTaskWorkRecord 結果欄位](../production-task/spec.md) 與 [qc spec § QC 角色權限邊界](../qc/spec.md)。

#### Scenario: QC 人員記錄檢驗結果

WHEN QC 角色於任務模組或工單詳情頁開啟被指派的 QC PT 或 inspection PT
THEN 系統 SHALL 提供 `reported_quantity` 與 `passed_quantity` 填寫介面（每筆 WorkRecord 提交時填）
AND 系統 SHALL 自動計算 `failed_quantity = reported_quantity - passed_quantity` 並寫入 WorkRecord
AND QC 角色 SHALL 可多次提交 WorkRecord（支援分批驗收，累計到 PT.pt_qc_passed）
AND MUST NOT 允許修改 `pt_target_qty`、`assigned_operator`、工單的製程 / 數量 / 排程等欄位
AND MUST NOT 允許建立新 QC PT（由系統自動建立）
AND MUST NOT 允許建立新 inspection PT（由印務在規劃期建立）
