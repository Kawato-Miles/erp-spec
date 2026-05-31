---
type: user-story
us-id: US-CR-004
module:
  - consultation-request
  - quote-request
role:
  - "[[諮詢]]"
priority: high
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢結束分支"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢單轉需求單欄位帶入"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[諮詢單]]"
  - "[[需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-CR-002-諮詢人員認領諮詢單]] 或 [[US-CR-001-諮詢單自動建立]]：諮詢單已認領"
  - 客戶確認要做大貨
---

# US-CR-004 諮詢結束做大貨轉需求單

## 業務情境

### 作為
[[諮詢]]

### 我希望
能完成諮詢後執行「轉需求單」讓諮詢成果接續報價流程

### 以便
省去重新建單 9 個欄位（8 客戶資料 + 諮詢主題）與重新分派業務，諮詢人員自動成為新需求單負責業務、維持客戶關係連續性

### 前置條件
- 諮詢單已認領並完成諮詢（狀態為「待諮詢」含已分派）
- 客戶確認要做大貨

### 業務流程

1. 諮詢人員與客戶確認諮詢結束且客戶要做大貨
2. 諮詢人員執行「轉需求單（做大貨）」
3. 系統建立新需求單（狀態為「需求確認中」）並依下列規則帶入欄位：
   - 客戶資料：8 個欄位（客戶類型 / 統編 / 公司名 / 聯絡人 / 手機 / 電子郵件 / 公司電話 / 分機）直接 mapping
   - 諮詢討論記錄：諮詢主題 mapping 至需求單的需求備註（可後續業務編輯）
   - 數量級距預填：依客戶在外部表單選的級距預填印件數量中間值（1-100 → 50、101-300 → 200、301-500 → 400、501-1000 → 750、1000+ → 1500，皆可手動調整）
   - 印件規格細節：諮詢單不蒐集，由「需求確認中」狀態下諮詢人員（即新需求單負責業務）與客戶交互填入
   - 來源關聯：寫入需求單的「來自諮詢單」反向關聯欄位
4. 系統將新需求單的負責業務設定為當前諮詢人員（自動接手）
5. 諮詢單狀態推進至「已轉需求單」終態；系統寫入活動紀錄（事件描述「轉需求單」+ 諮詢人員姓名 + 新需求單編號）
6. 系統 **不建立任何訂單**；付款紀錄維持綁諮詢單（等需求單結局明確時才轉移）
7. 後續需求單流程詳見 [quote-request spec](../../../../openspec/specs/quote-request/spec.md)：
   - 需求單成交且業務轉訂單 → 付款紀錄轉移至一般訂單，主訂單上建諮詢費的其他費用明細
   - 需求單流失 → 系統建諮詢訂單收尾、付款紀錄轉移至諮詢訂單（詳見 [[07-scenarios]] 或 spec § 需求單流失觸發建諮詢訂單收尾）

### 成功條件

1. 諮詢人員執行「轉需求單（做大貨）」後系統建立新需求單，客戶資料 8 個欄位 + 諮詢主題自動帶入無需重新輸入；需求單詳情頁顯示「來自諮詢單 [諮詢單編號]」可追溯連結
2. 印件預填數量為客戶在外部表單選擇的級距中間值（5 個級距對應 5 個預填值，可手動調整）
3. 新需求單的負責業務自動設定為當前諮詢人員（即諮詢人員自動成為負責業務）
4. 諮詢單狀態推進至「已轉需求單」終態，活動紀錄寫入「轉需求單」事件
5. 系統 **不建立任何訂單**，付款紀錄維持綁諮詢單（等需求單結局明確時才轉移）

## 來源（provenance）

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢結束分支」L112-141 + § Requirement「諮詢單轉需求單欄位帶入」L143-181
- 原 Notion User Story DB `US-CR-004`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L143-156 欄位 mapping 表補入：8 客戶資料欄位 / 諮詢主題 → 需求備註 / 數量級距 5 個對應預填值 / 印件規格細節由後續業務填 / 反向關聯
- 補入「諮詢人員自動成為負責業務」（spec L156）
- 補入「不建立任何訂單」「付款紀錄維持綁諮詢單」核心設計（spec L138-139）
- 補入 spec L158-161 下游路徑（成交轉訂單 / 流失建諮詢訂單）
- 諮詢主題 → 需求備註：對應 spec `consultation_topic` → `requirement_note` 欄位 mapping
