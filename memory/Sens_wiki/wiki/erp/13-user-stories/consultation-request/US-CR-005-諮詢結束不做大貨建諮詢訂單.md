---
type: user-story
us-id: US-CR-005
module:
  - consultation-request
  - order-management
role:
  - "[[諮詢]]"
priority: high
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-29
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢結束分支"
  - "openspec/specs/order-management/spec.md#Requirement: 諮詢訂單收尾自動建 BillingInstallment 規則"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[諮詢單]]"
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-CR-002-諮詢人員認領諮詢單]] 或 [[US-CR-001-諮詢單自動建立]]：諮詢單已認領"
  - 客戶確認不繼續做大貨
---

# US-CR-005 諮詢結束不做大貨建諮詢訂單

## 業務情境

### 作為
[[諮詢]]

### 我希望
能於客戶確認不做大貨時收尾諮詢並建立諮詢訂單結算諮詢費

### 以便
諮詢費正式入帳，會計對帳清楚，無懸而未決的付款紀錄

### 前置條件
- 諮詢單已認領並完成諮詢（狀態為「待諮詢」含已分派）
- 客戶確認不繼續做大貨

### 業務流程

1. 諮詢人員與客戶確認諮詢結束且客戶不做大貨
2. 諮詢人員執行「完成諮詢（不做大貨）」
3. 系統建立諮詢訂單（訂單類型為「諮詢訂單」、客戶資料來自諮詢單、總額為諮詢費）
4. 系統在諮詢訂單上建立諮詢費的其他費用明細
5. 系統將付款紀錄從諮詢單轉移至諮詢訂單（修改綁定實體類型與 ID）
6. 系統自動建立諮詢費的待開票收款項目（金額為諮詢費 2000 元、來源類型為「諮詢結束不做大貨」）；系統**不自動開立發票**（客戶在外部表單選的發票時點選項僅作客戶意向參考、不驅動系統開票）
7. 諮詢單狀態推進至「完成諮詢」終態；諮詢訂單因付款已轉移、應收即等於已收，**即時推進至「訂單完成」終態（不經「已開發票」中間態，該狀態已廢止）**；諮詢訂單關聯欄位寫入新建諮詢訂單 ID
8. 諮詢人員於需要時將該待開票收款項目手動一鍵開立為發票；未開票風險由訂單詳情頁對帳「應收大於發票淨額」差額警示兜底提醒
9. 系統寫入活動紀錄（事件描述「完成諮詢、建立諮詢訂單」+ 諮詢人員姓名 + 諮詢訂單編號 + 付款紀錄轉移軌跡）

### 成功條件

1. 諮詢人員執行「完成諮詢（不做大貨）」後系統建立諮詢訂單（類型為諮詢訂單、總額為諮詢費），客戶資料自動帶入
2. 付款紀錄從諮詢單轉移至諮詢訂單（綁定實體類型與 ID 更新），原諮詢單不再持有付款紀錄
3. 系統自動建立諮詢費待開票收款項目（不自動開立發票）；諮詢人員於需要時手動一鍵開立發票，未開票由對帳差額警示兜底
4. 諮詢單狀態推進至「完成諮詢」終態，諮詢訂單即時推進至「訂單完成」終態（不經「已開發票」中間態，該狀態已廢止）
5. 諮詢訂單與諮詢單建立雙向關聯（諮詢訂單在諮詢單可追溯、諮詢單於詳情顯示對應訂單）；完成諮詢、付款轉移、開票皆寫入活動紀錄供事後稽核

## 來源（provenance）

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢結束分支」L112-128 + § Requirement「諮詢費發票時間點處理」L283-300
- 原 Notion User Story DB `US-CR-005`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L119-128 補入：建諮詢訂單 + 其他費用明細 + 付款紀錄轉移 + 雙向關聯
- 對齊 spec L283-300 補入發票時點兩種處理：
  - issue_now：諮詢訂單立即開立諮詢費發票
  - defer_to_main_order：不做大貨情境下因無主訂單可合併，仍單筆開立諮詢費發票（與 spec L290 一致）
- 注意：不做大貨情境下兩種發票時點實際處理一樣（都開立諮詢費發票），差異只在做大貨情境（成交轉訂單時 defer_to_main_order 才合併開票）
- 業務流程 step 5「付款紀錄綁定實體類型與 ID 更新」對應 spec `linked_entity_type` / `linked_entity_id` 欄位異動

### 第二輪（2026-05-29 收斂 Step 3，對齊 refine-consultation-cancellation + unify-billing 後新模型）

落後一世代（原卡用 invoice_option 驅動自動開票 + 「已開發票」中間態），對齊現行 spec：

- 移除 invoice_option（issue_now / defer_to_main_order）驅動發票自動化：invoice_option 已降為純客戶意向參考、不驅動系統開票（refine-consultation-cancellation-and-invoice-flow 廢止）
- 移除「已開發票」中間態：諮詢訂單即時推進「訂單完成」（state-machines 諮詢訂單路徑簡化廢止「已開發票」）
- 系統改為自動建「待開票收款項目（BillingInstallment，source_type=諮詢結束不做大貨）」、不自動開立發票；諮詢人員於需要時手動一鍵開票（order-management § 諮詢訂單收尾自動建 BillingInstallment 規則）
- source frontmatter 第二條由已廢止的「諮詢費發票時間點處理」改指 order-management § 諮詢訂單收尾自動建 BillingInstallment 規則
