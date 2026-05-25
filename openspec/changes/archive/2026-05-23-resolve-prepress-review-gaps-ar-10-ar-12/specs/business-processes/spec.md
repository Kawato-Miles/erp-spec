## MODIFIED Requirements

### Requirement: 打樣流程規則

系統 SHALL 支援打樣工單與大貨工單的區分（透過 `WorkOrder.type` 欄位 enum 打樣 / 大貨，見 [work-order spec L825](../work-order/spec.md)），並遵循以下規則：

- 若需打樣，**打樣印件**與**大貨印件** SHALL 同時建立（兩個獨立 PrintItem 實體，各自走獨立審稿流程 + 對應獨立 WorkOrder）
- 打樣印件對應的打樣 WorkOrder 推進至「已完成」後，由業務（owner of 訂單）於打樣 WorkOrder 詳情頁判定打樣結果（`sampleResult` enum，見 [prepress-review spec § 打樣結果業務判定](../prepress-review/spec.md)）
- 打樣決策結果處理（對齊 Prototype 既有實作）：
  - `OK`：打樣通過；業務後續手動建大貨工單 / 進入大貨生產流程（系統不自動建）
  - `NG-製程問題`（製程問題）：業務 UI 自行於同打樣印件下建新打樣 WorkOrder 重做（系統不自動建，保留業務決定權；下游自動化處理機制細節待 OQ AR-13 解後實作）
  - `NG-稿件問題`（稿件問題）：系統 SHALL 自動觸發棄用原打樣印件 + clone 新打樣印件流程（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）；新打樣印件 `sampleResult = 待確認` / `printItemStatus = 待生產` / `reviewStatus = 稿件未上傳`，等待業務重新上傳稿件

#### Scenario: 打樣通過後業務手動建大貨工單

- **WHEN** 業務判定 `sampleResult = OK`
- **THEN** 系統 MUST NOT 自動建大貨工單
- **AND** 業務 SHALL 後續手動建大貨工單 / 進入大貨生產流程

#### Scenario: 打樣失敗因製程問題

- **WHEN** 業務判定 `sampleResult = NG-製程問題`（製程問題）
- **THEN** 系統 SHALL 允許在同一打樣印件下建立新打樣 WorkOrder 重新打樣
- **AND** 該打樣印件審稿維度狀態維持「合格」不動（稿件本身無問題）
- **AND** 系統 MUST NOT 自動建新打樣 WorkOrder（業務 UI 自行建，保留業務決定權）
- **AND** ng_process 下游自動化處理機制細節 SHALL 待 OQ AR-13 解後實作

#### Scenario: 打樣失敗因稿件問題

- **WHEN** 業務判定 `sampleResult = NG-稿件問題`（稿件問題）
- **THEN** 系統 SHALL 自動觸發棄用原打樣印件 + clone 新打樣印件流程：
  - 原打樣印件 `printItemStatus` 轉「已棄用」+ notes 加註棄用說明
  - 系統 clone 原打樣印件至新打樣印件（沿用印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度與印製維度）
  - 新打樣印件 `derived_from_print_item_id` 指向原打樣印件（結構化追溯，本 change 新增 FK 欄位）
  - 新打樣印件等待業務重新上傳稿件 → 進入審稿流程
- **AND** 流程細節詳見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)
