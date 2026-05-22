---
type: user-story
us-id: US-CR-001
module:
  - consultation-request
role:
  - "[[03-roles/業務]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢費付款成功觸發自動建單"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
related-oq: []
related-test-cases: []
---

# US-CR-001 諮詢單自動建立

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]（值班業務）

> 「作為」採受益者視角（業務）而非觸發者（客戶）：客戶填表動作在 surveycake 系統外，本 user story 描述的是 ERP 收到 webhook 後業務看到「待指派諮詢單自動出現於清單」的價值。

### 我希望
客戶完成付款後，諮詢單自動建立並出現在待指派清單

### 以便
線上進案不依賴人工開單、不漏單，且諮詢費收款即時入帳

### 前置條件
- 客戶於外部諮詢報名表單（surveycake）完成填寫並支付諮詢費
- 金流平台 webhook 通道正常

### 業務流程

1. 客戶於外部表單填寫 14 個必填欄位（詳見 [[05-entities/諮詢單]] 欄位定義；含客戶資料 / 諮詢主題 / 預約資訊 / 數量級距 / 諮詢費發票時點選項）並完成付款
2. 金流平台透過 webhook 將付款成功事件 + 表單內容傳送至 ERP
3. 系統建立諮詢單（狀態為「待諮詢」、寫入 14 表單欄位）
4. 系統建立付款紀錄（金額 = 諮詢費、綁定至諮詢單）
5. 系統 **不建立任何訂單**（訂單於諮詢結局明確時才依結局建立，詳見 [[US-CR-004-諮詢結束做大貨轉需求單]] / [[US-CR-005-諮詢結束不做大貨建諮詢訂單]] / [[US-CR-006-諮詢取消預約退費]]）
6. 系統**不在 webhook 階段開立發票**（即便客戶選擇「立即開立」也延後至諮詢結局明確、訂單建立後才開立；因 webhook 階段無訂單可掛發票）
7. 系統寫入活動紀錄（事件描述：諮詢單與付款記錄自動建立 webhook + payload 摘要）
8. 系統通知值班業務進行諮詢人員指派
9. 例外處理：若 webhook payload 欄位名 / 結構與預期不符，系統拒絕建單並通知工程值班「表單可能已異動，需更新 mapping」；客戶錢已收取的補救機制由工程值班依異常情境人工處理（重複 webhook / 失敗重送的防護待後續釐清）

### 成功條件

1. 客戶完成付款後，系統自動建立諮詢單（狀態為「待諮詢」）含 14 表單欄位；webhook 收到後即時建立（業務 SLA 待後續釐清）
2. 系統同步建立付款紀錄綁定至諮詢單，但**不建立任何訂單、不開立發票**（即便客戶選擇「立即開立」）
3. 系統寫入活動紀錄含 payload 摘要供事後稽核
4. 若 webhook payload 結構異動，系統拒絕建單並通知工程值班，**不產生半建狀態**
5. 業務於諮詢單清單可看到新建未指派的諮詢單，可進行指派或讓諮詢人員自行認領（[[US-CR-002-諮詢人員認領諮詢單]]）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/consultation/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢費付款成功觸發自動建單（不建訂單）」L69-95 + § Requirement「諮詢費發票時間點處理」L279-294（不在 webhook 階段開立發票設計）
- 原 Notion User Story DB `US-CR-001`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

對齊 spec L69-95 補入：14 表單欄位 / 不建任何訂單原則 / webhook 異動偵測。

### 第二輪（2026-05-22 v3，雙視角審查後）

erp-consultant 8.5/10 + senior-pm INVEST 5 PASS / 1 WARN，整合：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「作為」觸發者 vs 受益者錯位（客戶在 surveycake 動作，ERP 受益者是業務）| senior-pm 問題 1（high）| 已採納：改為「值班業務」（受益者視角）+ 「我希望」改為「客戶完成付款後諮詢單自動出現在待指派清單」 |
| 「Invoice 不在 webhook 階段開立」反直覺設計（spec L78）未提 | erp-consultant G2（medium）| 已採納：業務流程 step 6 + 成功條件 2 明示 |
| 「5 分鐘內」SLA 無依據 | senior-pm 問題 2（medium）| 已採納：移除「5 分鐘」改「即時建立」+ 「業務 SLA 待後續釐清」 |
| 14 表單欄位未列舉 | erp-consultant G1（medium）| 已採納：業務流程 step 1 補 wiki link 引 [[05-entities/諮詢單]] |
| 成功條件 5「諮詢人員可看到列表」屬下游連鎖 | senior-pm 問題 3（medium）| 已採納：改為業務（受益者）視角「業務於諮詢單清單可看到新建未指派的諮詢單」 |
| webhook 失敗補救 / idempotency / 通知 SLA | senior-pm 痛點 | **暫不開 OQ**：屬執行層 SLA / 工程細節，業務流程 step 9 已標「待後續釐清」 |
| 企業客必填驗證 | erp-consultant G3 | **未採納**：留在 spec § 企業客必填欄位 Scenario 層，user story 不重複描述驗證細節 |
