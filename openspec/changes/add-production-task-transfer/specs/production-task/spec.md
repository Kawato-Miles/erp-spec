# production-task — Delta Spec (add-production-task-transfer)

## MODIFIED Requirements

### Requirement: 生產任務狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 生產任務定義的規則進行狀態轉換。所有工廠類型在「運送中」狀態時 SHALL 記錄轉交資訊（目的地、對象、預計轉交日），由本 change 統一其語意。自有 / 加工廠若需要轉交，完工前須經「運送中」狀態；若不需要轉交，可直接從製作中進入已完成。生管指派師傅為欄位更新（assigned_operator），不觸發狀態變更。

#### Scenario: 自有工廠無轉交路徑

- **WHEN** 生產任務由自有工廠或加工廠執行，且 transfer_required = false
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 已完成
- **AND** 「製作中」由首次報工觸發

#### Scenario: 自有工廠需轉交路徑

- **WHEN** 生產任務由自有工廠或加工廠執行，且 transfer_required = true
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 運送中 → 已完成
- **AND** 進入「運送中」前 MUST 完成轉交需求欄位填寫
- **AND** 「已完成」由印務或師傅點擊「確認已轉交」觸發

#### Scenario: 外包廠路徑

- **WHEN** 生產任務由外包廠執行
- **THEN** 狀態路徑維持不變：待處理 → 製作中 → 運送中 → 已完成
- **AND** 「運送中」狀態 SHALL 記錄轉交資訊，轉交欄位 MUST 由印務填寫

#### Scenario: 中國廠商路徑

- **WHEN** 生產任務由中國廠商執行
- **THEN** 狀態路徑：待處理 → 製作中 → 已送集運商 → 運送中 → 已完成
- **AND** 「運送中」狀態 SHALL 記錄轉交資訊，轉交欄位 MUST 由印務填寫

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 生產任務狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 生產任務作廢（未進入生產）

- **WHEN** 生管在生產任務尚未進入「製作中」時取消
- **THEN** 狀態轉為「已作廢」（無成本）

#### Scenario: 生產任務報廢（已進入生產）

- **WHEN** 已進入「製作中」的生產任務被取消
- **THEN** 狀態轉為「報廢」，費用以報工數計算

## ADDED Requirements

### Requirement: 轉交需求欄位

生產任務 SHALL 新增轉交相關欄位，當 transfer_required = true 時必須填寫對應欄位方可從「製作中」進入「運送中」狀態。欄位動態顯示依據轉交對象類型（內部產線 / 外部廠商）與運送方式。

欄位清單：

| 欄位 | 英文名稱 | 型別 | 必填條件 | 說明 |
|------|---------|------|---------|------|
| 是否需要轉交 | transfer_required | 布林 | 永遠必填 | 自有 / 加工廠預設 false；外包廠 / 中國廠 MUST 為 true（無法關閉） |
| 轉交對象類型 | transfer_target_type | 單選 | transfer_required = true | 內部產線 / 外部廠商 |
| 目的產線 | transfer_destination_line_id | FK | transfer_target_type = 內部產線 | FK → ProductionLine（含倉庫入庫選項） |
| 目的廠商 | transfer_destination_vendor_id | FK | transfer_target_type = 外部廠商 | FK → Vendor，自動帶聯絡人 / 電話 / 地址 |
| 運送方式 | transfer_delivery_method | 單選 | 選填 | 廠內自送 / 貨運行 / 供應商自取 / 其他 |
| 貨運行名稱 | transfer_carrier_name | 文字 | transfer_delivery_method = 貨運行 | 純文字記錄用 |
| 廠內執行者 | transfer_handler_name | 文字 | 選填 | 廠務姓名（純文字，不接系統帳號，記錄用） |
| 轉交備註 | transfer_notes | 文字 | 選填 | 自由文字，提示範本：需附紙本工單 / 注意易碎 |
| 預計轉交日 | transfer_expected_date | 日期 | 選填 | — |
| 實際轉交日 | transfer_actual_date | 日期 | 系統自動 | 點擊「確認已轉交」時自動寫入當日 |
| 確認操作人 | transfer_confirmed_by | FK | 系統自動 | FK → User，自動帶入當前登入者 |
| 簽收照片 | transfer_signature_photos | 檔案陣列 | 選填 | 支援多張，外部廠商建議上傳 |

#### Scenario: transfer_required 預設值依工廠類型

- **WHEN** 建立新生產任務
- **THEN** 自有工廠 / 加工廠 SHALL 預設 transfer_required = false
- **AND** 外包廠 / 中國廠商 SHALL 預設 transfer_required = true 且不可改為 false

#### Scenario: 內部產線轉交欄位組合

- **WHEN** transfer_required = true 且 transfer_target_type = 內部產線
- **THEN** 系統 SHALL 顯示：目的產線（必填）、廠內執行者（選填）、轉交備註、預計轉交日
- **AND** 系統 MUST NOT 顯示：目的廠商、運送方式、貨運行名稱

#### Scenario: 外部廠商轉交欄位組合

- **WHEN** transfer_required = true 且 transfer_target_type = 外部廠商
- **THEN** 系統 SHALL 顯示：目的廠商（必填）、運送方式、貨運行名稱（條件顯示）、轉交備註、預計轉交日、簽收照片
- **AND** 系統 MUST NOT 顯示：目的產線、廠內執行者

#### Scenario: 貨運行名稱條件顯示

- **WHEN** transfer_delivery_method = 貨運行
- **THEN** 系統 SHALL 顯示貨運行名稱欄位
- **AND** 其他運送方式 MUST NOT 顯示貨運行名稱

### Requirement: 轉交確認操作

印務或指派師傅 SHALL 能在「運送中」狀態下點擊「確認已轉交」，系統 SHALL 自動寫入實際轉交日、確認操作人，並將生產任務狀態推進至「已完成」。產線任務（factory_type = 自有工廠 / 加工廠）允許師傅或印務任一方確認；外部任務（factory_type = 外包廠 / 中國廠商）僅印務可確認。

#### Scenario: 自有工廠產線師傅確認

- **WHEN** 自有工廠生產任務處於「運送中」狀態，指派師傅登入任務平台點擊「確認已轉交」
- **THEN** 系統 SHALL 記錄 transfer_actual_date = 當前日期、transfer_confirmed_by = 該師傅
- **AND** 生產任務狀態 SHALL 變為「已完成」

#### Scenario: 外包廠印務代確認

- **WHEN** 外包廠生產任務處於「運送中」狀態，印務在生產任務詳情頁點擊「確認已轉交」
- **THEN** 系統 SHALL 記錄 transfer_actual_date、transfer_confirmed_by
- **AND** 生產任務狀態 SHALL 變為「已完成」

#### Scenario: 確認前欄位驗證

- **WHEN** 使用者點擊「確認已轉交」但必填欄位未填
- **THEN** 系統 SHALL 顯示驗證錯誤並阻止狀態推進
- **AND** 必填欄位包含：transfer_target_type、目的產線或目的廠商（依類型）

#### Scenario: 外部任務禁止師傅確認

- **WHEN** 外包廠 / 中國廠商生產任務處於「運送中」，非印務使用者嘗試確認
- **THEN** 系統 MUST NOT 顯示「確認已轉交」按鈕給該使用者

### Requirement: 轉交撤回機制

印務 SHALL 能將「已完成」狀態的生產任務撤回至「運送中」，撤回時必填原因並寫入異動紀錄。撤回後 transfer_actual_date、transfer_confirmed_by 重置為 null，允許印務重新確認。師傅 MUST NOT 擁有撤回權限。

#### Scenario: 印務撤回並填寫原因

- **WHEN** 印務在「已完成」的生產任務點擊「撤回轉交」，並填寫原因「貨物送錯需重新安排」
- **THEN** 生產任務狀態 SHALL 變為「運送中」
- **AND** 系統 SHALL 寫入 TransferRevocationLog 紀錄：operator_id、timestamp、reason、before_transfer_actual_date
- **AND** transfer_actual_date 與 transfer_confirmed_by SHALL 重置為 null

#### Scenario: 撤回原因必填驗證

- **WHEN** 印務點擊「撤回轉交」但未填寫原因
- **THEN** 系統 SHALL 阻止撤回並顯示「撤回原因為必填」

#### Scenario: 師傅無撤回權限

- **WHEN** 師傅在任務平台查看「已完成」任務
- **THEN** 系統 MUST NOT 顯示「撤回轉交」按鈕給師傅

### Requirement: Slack 摘要一鍵複製

當印務確認轉交資訊填寫完成（狀態進入「運送中」時），系統 SHALL 於生產任務詳情頁顯示「Slack 摘要複製」區塊，產生標準化文字供印務手動貼至 Slack 通知廠務。本 Requirement 為 PT-002（Slack Webhook 自動推送）落地前的橋接機制，確保廠務通知流程不斷鏈。

摘要格式範例：

```
【轉交任務】
印件：{print_item_name}
任務：{production_task_id} {process_name} 完成 → {destination}
數量：{pt_produced_qty}
廠務：{transfer_handler_name}
備註：{transfer_notes}
```

#### Scenario: 摘要即時產生

- **WHEN** 生產任務進入「運送中」狀態
- **THEN** 系統 SHALL 在生產任務詳情頁顯示摘要區塊
- **AND** 摘要內容 SHALL 自動帶入對應欄位

#### Scenario: 一鍵複製

- **WHEN** 印務點擊摘要區塊的「複製」按鈕
- **THEN** 摘要文字 SHALL 寫入剪貼簿
- **AND** 系統 SHALL 顯示「已複製」Toast 提示

#### Scenario: 欄位缺失時以占位符處理

- **WHEN** 摘要欲帶入的欄位為 null（例如 transfer_handler_name 未填）
- **THEN** 系統 SHALL 於該位置顯示「—」或省略該行，不 block 複製功能

### Requirement: 轉交狀態列表顯示

生產任務列表 SHALL 以 Badge 顯示轉交狀態，讓印務可快速掃描「哪些任務待轉交」。Badge 與主狀態 Badge 並列顯示，不互相取代。

#### Scenario: 列表 Badge 顯示

- **WHEN** 生產任務狀態為「運送中」
- **THEN** 列表列 SHALL 顯示黃色 Badge「待轉交」
- **AND** 主狀態 Badge 維持顯示「運送中」

#### Scenario: 已完成後 Badge 切換

- **WHEN** 生產任務狀態為「已完成」且 transfer_actual_date 有值
- **THEN** 列表列 SHALL 顯示綠色 Badge「已轉交」
- **AND** 主狀態 Badge 顯示「已完成」

#### Scenario: 無轉交需求不顯示 Badge

- **WHEN** 生產任務 transfer_required = false
- **THEN** 列表列 MUST NOT 顯示轉交 Badge
