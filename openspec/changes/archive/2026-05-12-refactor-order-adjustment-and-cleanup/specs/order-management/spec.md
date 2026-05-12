## MODIFIED Requirements

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

OrderAdjustment 建立時系統 SHALL 依當下 `Order.status` 自動推算 `adjustment_phase`：

- `Order.status ≠ 已完成` → `adjustment_phase = during_order`，UI 顯示為「訂單異動單」
- `Order.status = 已完成` → `adjustment_phase = after_completion`，UI 顯示為「售後服務單」

`adjustment_phase` 一經建立 MUST NOT 變動，即使 Order 後續狀態變化（包括回退、再完成等）。`adjustment_phase` 限制可用的 `adjustment_type`（完整 enum 與限制詳見「OrderAdjustment.adjustment_type 完整 enum 與 phase 限制」Requirement）。

OrderAdjustment SHALL 支援多筆明細項（OrderAdjustmentItem 子實體），每筆明細記錄 `item_type`（print_item / fee）、描述、金額。OrderAdjustment.amount 為所有明細金額加總（系統自動計算）。

#### Scenario: 業務建立加印追加異動

- **GIVEN** 訂單 SO-001 狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁點擊「建立訂單異動單」
- **THEN** 系統 SHALL 自動推算 `adjustment_phase = during_order`、UI 標題顯示「訂單異動單」
- **AND** 業務 SHALL 可選 `adjustment_type = 加印追加`
- **AND** 業務新增明細「item_type = print_item，描述 = 加印 200 份，金額 = +20,000」
- **AND** OrderAdjustment.amount SHALL 自動加總為 +20,000
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務於已完成訂單建立售後服務單

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15
- **WHEN** 業務於 2026-05-06 點擊「建立售後服務單」
- **THEN** 系統 SHALL 自動推算 `adjustment_phase = after_completion`、UI 標題顯示「售後服務單」
- **AND** 業務可選 `adjustment_type` SHALL 限制於 退印 / 折扣 / 補退 / 其他
- **AND** 業務嘗試選擇「加印追加」時 SHALL 被拒絕並提示「售後服務單不可新增印件」

#### Scenario: 業務主管核可訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務執行已核可的訂單異動

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行（終態）
- **AND** 訂單應收總額 MUST 更新（Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動

#### Scenario: 訂單異動不阻擋主訂單推進

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

#### Scenario: 訂單異動執行後生產內容變更提示

- **GIVEN** OrderAdjustment 含 print_item 類型明細（例如加印追加、規格變更）
- **WHEN** 業務點擊「執行」
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 提示為非阻擋式（業務可關閉提示繼續），系統 NOT 自動建立或修改 PrintItem

#### Scenario: adjustment_phase 建立後不可變動

- **GIVEN** OrderAdjustment 建立時 adjustment_phase = during_order，Order.status = 生產中
- **WHEN** Order 推進至已完成、業務再執行 OrderAdjustment
- **THEN** OrderAdjustment.adjustment_phase SHALL 維持 during_order
- **AND** 系統 NOT 觸發 phase 重新推算

## ADDED Requirements

### Requirement: 售後服務單行為限制與發票處理提示

`adjustment_phase = after_completion` 的 OrderAdjustment（業務面：售後服務單）SHALL 遵循以下行為限制：

1. **不可選 adjustment_type 為「加印追加」「加運費」「急件費」**：售後服務單僅做金額調整，不啟動新的生產 / 物流動作
2. **執行後不觸發 PrintItem 建立或修改提示**：售後服務情境下生產已完成，無新增印件需求
3. **執行後若執行時點跨越訂單完成日，對帳檢視面板顯示警示 banner**：依「對帳警示 banner 觸發條件」Requirement 觸發
4. **執行後顯示發票處理建議式提示**：「此筆異動涉及金額變動，請至訂單詳情頁的發票區處理（作廢 / 折讓）」。提示為非問句、非自動跳轉，業務自行判斷時序與合規期決定處理方式

主訂單狀態 SHALL 維持「已完成」不回退，系統 SHALL NOT 引入「對帳鎖定 / 解鎖」狀態機（會計人工確認即可）。

#### Scenario: 售後服務單執行後對帳警示與發票提示同時顯示

- **GIVEN** 訂單 SO-002 狀態 = 已完成、completion_date = 2026-03-15
- **WHEN** 業務於 2026-05-06 建立並執行售後服務單（adjustment_type = 退印、amount = -5,000、reason = 客戶事後品質投訴）
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 訂單應收總額 SHALL 更新
- **AND** 因 executed_at（2026-05-06）> completion_date（2026-03-15），對帳檢視面板 SHALL 顯示警示 banner
- **AND** 系統 SHALL 顯示提示「此筆異動涉及金額變動，請至訂單詳情頁的發票區處理（作廢 / 折讓）」
- **AND** 提示為非問句、非自動跳轉

#### Scenario: 主訂單狀態維持已完成不回退

- **GIVEN** OrderAdjustment(adjustment_phase = after_completion) 在已完成訂單上執行
- **THEN** 訂單主狀態 SHALL 維持「已完成」
- **AND** 系統 SHALL NOT 觸發任何訂單狀態回退

#### Scenario: 售後服務單禁止選擇加印類型

- **GIVEN** 業務於已完成訂單建立 OrderAdjustment（adjustment_phase 自動 = after_completion）
- **WHEN** 業務嘗試選擇 adjustment_type = 加印追加
- **THEN** 系統 SHALL 拒絕並提示「售後服務單不可新增印件，僅可做金額調整」

### Requirement: OrderAdjustment.adjustment_type 完整 enum 與 phase 限制

`OrderAdjustment.adjustment_type` SHALL 採用以下完整 enum 列舉，並依 `adjustment_phase` 限制可選範圍：

| adjustment_type | during_order 可選 | after_completion 可選 |
|----------------|------------------|----------------------|
| 規格變更 | 是 | 否 |
| 加印追加 | 是 | 否 |
| 退印 | 是 | 是 |
| 折扣 | 是 | 是 |
| 加運費 | 是 | 否 |
| 急件費 | 是 | 否 |
| 補退 | 否 | 是 |
| 其他 | 是 | 是 |

限制 SHALL 在 API 與 UI 雙重防護（業務層校驗，非資料庫 enum constraint，方便未來擴充）。業務透過 API 直接送出不合 phase 的 type 時 SHALL 被拒絕並回傳 400 錯誤。

#### Scenario: API 拒絕不合 phase 的 adjustment_type

- **GIVEN** Order.status = 已完成（推算 phase = after_completion）
- **WHEN** 業務透過 API 送出 OrderAdjustment(adjustment_type = 加印追加)
- **THEN** 系統 SHALL 拒絕並回傳 400 錯誤
- **AND** 錯誤訊息 SHALL 為「售後服務單不可選擇加印追加」

#### Scenario: UI 隱藏不合 phase 的 adjustment_type 選項

- **GIVEN** 業務於已完成訂單開啟「建立售後服務單」表單
- **WHEN** 業務點擊 adjustment_type 下拉選單
- **THEN** 系統 SHALL 僅顯示 退印 / 折扣 / 補退 / 其他 四個選項
- **AND** 加印追加 / 規格變更 / 加運費 / 急件費 SHALL 不在下拉清單中

### Requirement: 對帳警示 banner 觸發條件

訂單詳情頁的對帳檢視面板 SHALL 於以下條件成立時顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」：

```
任一 OrderAdjustment 滿足：
  Order.completed_at IS NOT NULL
  AND OrderAdjustment.status = 已執行
  AND OrderAdjustment.executed_at > Order.completed_at
```

觸發條件 SHALL NOT 依 `adjustment_phase` 判斷，因為 phase = during_order 但跨期執行的場景（業務於訂單未完成時建單，主管核可後業務拖到訂單完成後才執行）同樣需要警示。Order 尚未完成時（completed_at IS NULL），banner 不觸發（一律視為訂單期內調整）。

#### Scenario: phase = during_order 但跨期執行觸發警示

- **GIVEN** OrderAdjustment 建立時 Order.status = 生產中（phase = during_order，executed_at 尚未設定）
- **AND** 業務主管核可後 Order 推進至已完成（completed_at = 2026-03-15）
- **WHEN** 業務於 2026-05-06 點擊「執行」（executed_at = 2026-05-06）
- **THEN** 因 executed_at（2026-05-06）> completed_at（2026-03-15），對帳檢視面板 SHALL 顯示警示 banner
- **AND** banner 文字 SHALL = 「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行，請會計確認原月結紀錄」

#### Scenario: 訂單未完成時不觸發警示

- **GIVEN** OrderAdjustment 已執行（executed_at = 2026-05-06）
- **AND** Order.completed_at IS NULL（尚未完成）
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 系統 SHALL NOT 顯示警示 banner

### Requirement: OrderExtraCharge vs OrderAdjustment.fee 時間邊界

`OrderExtraCharge` SHALL 限於「訂單成立時即確定」的費用使用，定義為訂單建立至「訂單確認」狀態之間（含）的費用記錄。訂單成立後（進入「報價待回簽」之後）新增的費用 SHALL 走 `OrderAdjustment` 的 `item_type = fee` 明細，即使費用類型相同（如後加運費）。

時間邊界明確：

- 訂單建立時 / 報價評估階段 → 業務可新增 OrderExtraCharge（運費 / 急件費等）
- 訂單進入「報價待回簽」之後 → OrderExtraCharge 凍結，不可新增；業務需走 OrderAdjustment

UI SHALL 在訂單已成立後隱藏「新增 OrderExtraCharge」按鈕，引導業務走 OrderAdjustment 流程。系統 SHALL 在 API 層拒絕訂單成立後的 OrderExtraCharge 寫入請求。

#### Scenario: 業務於訂單成立前加運費走 OrderExtraCharge

- **GIVEN** 訂單 SO-001 處於「報價評估」階段
- **WHEN** 業務新增 200 元運費
- **THEN** 系統 SHALL 建立 OrderExtraCharge(charge_type = shipping_fee, amount = 200)
- **AND** 不需業務主管審核

#### Scenario: 業務於訂單成立後加運費走 OrderAdjustment

- **GIVEN** 訂單 SO-001 處於「生產中」階段
- **WHEN** 業務發現需要補收 200 元運費
- **THEN** UI SHALL 隱藏「新增 OrderExtraCharge」按鈕
- **AND** 業務 SHALL 建立 OrderAdjustment(adjustment_type = 加運費，明細：item_type = fee，amount = 200)
- **AND** 該 OrderAdjustment 走業務主管審核流程

#### Scenario: API 拒絕訂單成立後新增 OrderExtraCharge

- **GIVEN** 訂單 SO-001 處於「報價待回簽」之後狀態
- **WHEN** 系統收到 OrderExtraCharge 寫入請求
- **THEN** 系統 SHALL 拒絕並回傳 400 錯誤
- **AND** 錯誤訊息 SHALL 為「訂單已成立，新增費用請走訂單異動單流程」

## REMOVED Requirements

### Requirement: 已完成訂單仍可建立 OrderAdjustment（售後服務）

**Reason**：本 Requirement 的功能已被 MODIFIED「訂單異動（OrderAdjustment）建立與審核」與 ADDED「售後服務單行為限制與發票處理提示」「對帳警示 banner 觸發條件」三條 Requirement 取代，由 `adjustment_phase` 機制與「執行時點跨期」觸發邏輯統一處理「訂單異動 / 售後服務」雙重身份。原獨立 Requirement 與新設計重複，移除以避免資訊分散。

**Migration**：原 Requirement 中的核心行為（已完成訂單可建 OrderAdjustment、對帳警示 banner、主訂單不回退）已完整保留於新 Requirement 內，無資料層異動。既有 OrderAdjustment 記錄需於 schema migration 階段回填 `adjustment_phase = during_order`（參見 `tasks.md` 移轉步驟）。對帳警示 banner 觸發條件由「phase = after_completion」改為「executed_at > completed_at」，可涵蓋更多時間錯位場景，原 Requirement 涵蓋情境完全包含於新邏輯。

## ADDED Data Model

### OrderAdjustment 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 異動階段 | adjustment_phase | 單選 | Y | Y | `during_order` / `after_completion`；建單時依 Order.status 自動推算，建後不變動 |

### OrderAdjustmentItem（訂單異動明細）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬訂單異動 | order_adjustment_id | FK | Y | Y | FK -> OrderAdjustment |
| 明細類型 | item_type | 單選 | Y | | `print_item`（涉及印件）/ `fee`（其他費用） |
| 描述 | description | 字串 | Y | | 業務填入，如「加印 200 份」「加運費」 |
| 金額 | amount | 小數 | Y | | 可正可負；OrderAdjustment.amount = ∑明細 amount |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

## REMOVED Data Model

### Order 移除欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 主訂單 | parent_order_id | FK | | | 補收款主訂單 |
| 是否補收款訂單 | is_supplemental | 布林值 | Y | | 是否補收款訂單 |

**Reason**：補收款訂單概念退場，所有補收款場景改走 OrderAdjustment（含 `during_order` 與 `after_completion` 兩個 phase 涵蓋訂單未完成 / 已完成的補收）。預留欄位若保留將造成未來開發者誤用。

**Migration**：移除前須執行資料引用掃描 `SELECT count(*) FROM orders WHERE is_supplemental = true OR parent_order_id IS NOT NULL`，理論上現況零引用（線下單未實作補收款訂單功能）。若有非零引用需先評估資料保留方式（轉為 OrderAdjustment 或刪除），確認後再移除欄位。
