---
type: user-story
us-id: US-ORD-007
module:
  - 訂單管理
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單複製功能"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq:
  - ORD-032
related-test-cases: []
prerequisites:
  - 業務遇到老客戶重複下單需求
  - 原訂單仍保留於系統（任意狀態）
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/3673886511fa815b85ddef2d0a942e36
---

# US-ORD-007 訂單複製功能

## 業務情境

### 作為
[[業務]]

### 我希望
能從歷史訂單一鍵複製建立新訂單

### 以便
老客戶「照上次一樣」的重複下單可快速建單，業務不需重輸入印件規格

### 前置條件
- 業務遇到老客戶重複下單需求
- 原訂單仍保留於系統（任何狀態，含已完成）

### 業務流程

1. 業務於訂單列表找到要複製的歷史訂單
2. 業務執行「複製訂單」
3. 系統建立新訂單並自動帶入：
   - 客戶資料（接單公司 / 帳務公司 / 統編 / 聯絡人）
   - 印件規格（含預計產線、難易度、免審稿標記）
   - 價格欄位（成本 / 報價 / 毛利率）
   - 付款條件
   - 開票公司 / 抬頭 / 統編
   - 配送地址 / 方式
   - 訂單三種備註
4. 系統直接帶入原訂單的開票公司 / 抬頭 / 統編（不重新推導）；業務於草稿態可自行調整（是否改以接單公司重新推導見 [[ORD-032-訂單複製帳務公司直接複製或重新推導|ORD-032]]）
5. 系統於新訂單寫入活動紀錄「訂單複製：來源訂單 #XXX」，並於來源訂單寫入活動紀錄「衍生訂單 #YYY」（雙向可追溯）
6. 新訂單狀態為「草稿」，業務可調整差異欄位（如：客戶要求新規格 / 數量調整）
7. 新訂單與原訂單建立關聯欄位作為複製來源追溯
8. 新訂單不帶入原訂單的工單 / 生產任務（待審核通過後由印務主管重新拆分）、不帶入稿件檔案（業務需重新確認客戶最新版稿件）、不複製原訂單活動紀錄（新訂單自複製事件起重新記錄）

### 成功條件

1. 業務可於訂單列表執行「複製訂單」建立新訂單，自動帶入客戶 / 印件規格 / 報價結構 / 付款條件 / 開票資訊 / 配送 / 三種備註
2. 系統直接帶入原訂單的開票公司 / 抬頭 / 統編，業務於草稿態可自行調整
3. 新訂單狀態為「草稿」，業務可進一步編輯
4. 新訂單與原訂單建立關聯，可追溯複製來源
5. 新訂單與來源訂單雙向各寫入一筆複製活動紀錄，互可追溯

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) § Requirement「訂單複製功能」
- 2026-06-01 align-business-consultation-coverage-gaps change 明定訂單複製功能（複製範圍 MUST / MUST NOT、開票資訊直接帶入、雙向活動紀錄）
- 原 Notion User Story DB `US-ORD-007`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 沿用 [[US-QR-009-複製需求單]] 帳務公司推導紀律（不直接複製）
- 補關聯追溯
- 邊界：訂單複製建立後一切流程同既有訂單（不在本卡擴充）

### 第二輪（2026-06-03，對齊 2026-06-01-align-business-consultation-coverage-gaps change）

- 複製範圍補齊至 delta MUST 複製項：付款條件、開票公司 / 抬頭 / 統編、配送地址 / 方式、訂單三種備註
- 開票資訊改為「直接帶入原訂單值（不重新推導）」，與 delta 對齊（原卡沿用需求單複製的重新推導紀律，與 delta 相反，未逕自保留，改標 OQ）
- 補雙向活動紀錄（新訂單記來源訂單、來源訂單記衍生訂單）至業務流程與成功條件
- 補 MUST NOT 複製邊界：工單 / 生產任務、稿件檔案、原訂單活動紀錄
- source / 錨點更新為 § Requirement「訂單複製功能」
