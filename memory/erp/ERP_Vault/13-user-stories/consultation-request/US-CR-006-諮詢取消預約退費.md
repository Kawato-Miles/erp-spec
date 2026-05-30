---
type: user-story
us-id: US-CR-006
module:
  - consultation-request
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-30
source:
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢取消觸發建諮詢訂單與退費"
  - "openspec/specs/consultation-request/spec.md#Requirement: 諮詢單實體與表單欄位"
  - "openspec/changes/archive/2026-05-30-converge-consultation-cancel-to-order-cancel-flow/proposal.md"
related-spec: openspec/specs/consultation-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/諮詢單]]"
  - "[[05-entities/訂單]]"
related-oq:
  - "[[CR-3-諮詢取消三項擴充議題]]"
related-test-cases: []
prerequisites:
  - "諮詢單狀態為「待諮詢」（含已認領未認領）"
  - "客戶確認取消預約"
---

# US-CR-006 諮詢取消預約退費

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於客戶在「待諮詢」階段取消預約時系統化處理退費

### 以便
退費流程系統化避免人工算錯或漏退，並依發票時點正確處理開票與折讓

### 前置條件
- 諮詢單狀態為「待諮詢」（含已認領未認領）
- 客戶確認取消預約
- **離開「待諮詢」狀態後不可退費**（已轉需求單 / 完成諮詢 / 已取消的諮詢單無法執行本流程）

### 業務流程

1. 諮詢人員（或業務主管）與客戶確認取消諮詢預約
2. 操作者執行「取消諮詢」，並選定取消原因分類（六選一必選，未選不可送出）
3. 系統建立諮詢訂單（訂單類型為「諮詢訂單」、客戶資料來自諮詢單、總額為諮詢費 2000 元）
4. 系統在諮詢訂單上建立諮詢費的其他費用明細（金額 2000 元）
5. 系統將付款紀錄從諮詢單轉移至諮詢訂單（金額維持正值 2000 元、狀態維持已完成）
6. 系統自動建立退款訂單異動（金額為負 1000 元、異動類型為「諮詢取消退費」、狀態直接為「已核可」、核可人為系統、尚未標記執行）——半額退費為系統內生預設值，操作者於善後時可依實際調整退款金額（沿用一般退款異動「已核可後修改不需重新送審」規則）
7. 系統自動建立退款付款紀錄（金額為負 1000 元、付款方式為退款、狀態為處理中、關聯上述退款訂單異動）
8. **系統不自動開立任何發票、不自動建立銷貨折讓單、不自動建立待開發票**（廢除諮詢專屬自動建待開發票；留存的 1000 元收入由操作者循一般訂單取消發票開立路徑於需要時手動開立）
9. 諮詢訂單狀態直接推進至「已取消」終態（諮詢取消是沒成交的生意、語意為已取消而非完成；不經製作中間態）；退款付款紀錄維持「處理中」作為已取消後的善後金流動作
10. 諮詢單狀態推進至「已取消」終態（不可逆），取消原因分類與新建諮詢訂單編號寫入諮詢單
11. 善後金流（不影響已取消終態）：操作者與第三方金流確認刷退完成後，將退款付款紀錄標記為「已完成」；系統重算該異動對應已完成退款累計達負 1000 元，同步推進退款訂單異動狀態至「已執行」並寫入執行時間
12. 操作者於需要時手動開立諮詢費發票（金額依客戶需求決定、建議 1000 元）；未開票風險由訂單詳情頁對帳「應收大於發票淨額」差額警示兜底提醒
13. 系統寫入活動紀錄（事件描述「諮詢取消退費」+ 操作者姓名 + 取消時間 + 諮詢訂單編號 + 取消原因分類 + 退款金額）
14. 例外處理：若諮詢單已離開「待諮詢」狀態（已轉需求單 / 完成諮詢 / 已取消），系統拒絕本動作並提示「諮詢結束分支已執行，無法退費」

> **設計依據**：本流程於 2026-05-30 `converge-consultation-cancel-to-order-cancel-flow` 歸檔收斂——諮詢訂單終態由「訂單完成」改「已取消」（解業務掃列表誤讀成交痛點）、退款訂單異動由系統建「已核可」（取代既有一建即「已執行」，修正「已執行卻配處理中退款」的一致性破洞）、廢除諮詢專屬自動建待開發票（善後歸一一般訂單取消流程）。半額退費比例（CR-3 決議）與金流數字（收 2000、退 1000、淨 1000）不變。

### 成功條件

1. 操作者於諮詢單「待諮詢」狀態執行「取消諮詢」並選定取消原因分類後，系統建立諮詢訂單並完成付款紀錄轉移
2. 諮詢訂單上有正值諮詢費付款紀錄（2000 元、轉移自諮詢單）+ 系統自動建立的退款訂單異動（負 1000 元、已核可）+ 退款付款紀錄（負 1000 元、處理中）；應收 1000 元 = 收款淨額 1000 元
3. 系統不自動開立諮詢費發票、不自動建立銷貨折讓單、不自動建立待開發票；留存 1000 元收入由操作者於需要時手動開立發票，未開票由對帳差額警示兜底提醒
4. 操作者與第三方金流確認刷退完成後將退款付款紀錄切「已完成」，系統推進退款訂單異動至「已執行」；此善後金流不再變動諮詢訂單「已取消」終態
5. 諮詢訂單與諮詢單狀態皆推進至「已取消」終態不可逆；離開「待諮詢」狀態後系統拒絕重複取消動作；取消原因分類與取消動作寫入活動紀錄供事後稽核

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

- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢取消觸發建諮詢訂單與退費」（半額退費 1000 + 自動建退款 OA 已核可 + 退款 Payment 處理中 + MUST NOT 自動開發票 / 折讓 / 待開發票 + 諮詢訂單已取消終態）
- [`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) § Requirement「諮詢取消半額退費自動建請款期次（取代既有自動建 PlannedInvoice）」（MUST NOT 自動建待開發票、source_type=consultation_cancellation enum 保留供手動標示）
- [`openspec/changes/archive/2026-05-30-converge-consultation-cancel-to-order-cancel-flow/proposal.md`](../../../../openspec/changes/archive/2026-05-30-converge-consultation-cancel-to-order-cancel-flow/proposal.md)（諮詢取消收斂到一般訂單取消流程的設計理由與商業背景）
- 原 Notion User Story DB `US-CR-006`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 「作為」改為業務（spec L249「業務點擊取消諮詢」；原 Notion 標諮詢角色，但實際執行者是業務）
- 對齊 spec L246-268 補入兩個發票時點子情境：
  - issue_now：開發票 + 折讓單沖銷
  - defer_to_main_order：不開發票、特殊對帳邏輯（應收 = 已沖銷 = 0）
- 對齊 spec L270-275 補入「離開待諮詢狀態後不可取消」例外處理
- 業務流程 step 6 補退款付款紀錄「金額為負諮詢費」業務化描述
- 「不可逆」明示在前置條件與成功條件 5（spec L242「已取消終態」）
- 注意：spec L257 提到 defer_to_main_order 情境下諮詢訂單三方對帳細節參照 [order-management spec § 諮詢取消對帳邏輯]，本 user story 僅描述業務面，對帳實作細節留 order-management 模組

### 第二輪（2026-05-30 v3，依 converge-consultation-cancel-to-order-cancel-flow 歸檔重寫核心）

落後兩世代（原卡為 v0.1 諮詢費 1000 全額退 + 訂單完成終態 + issue_now 自動開發票 + 折讓沖銷），一次對齊至 converge 收斂版：

- 諮詢訂單終態「訂單完成」→「已取消」（解業務掃列表誤讀成交痛點）
- 退費「負諮詢費（全額）」→「半額退 1000」（諮詢費 2000、收 2000 退 1000、淨 1000；對齊 v1.10 諮詢費 1000→2000）
- 移除 issue_now 自動開發票 + 折讓單沖銷分支：系統不自動開立發票 / 銷貨折讓單 / 待開發票，留存 1000 收入由操作者手動開票、未開票由對帳差額警示兜底
- 補退款訂單異動系統建「已核可」（核可人為系統、尚未執行）+ 退款付款紀錄切已完成才推進異動「已執行」（修正既有「一建即已執行卻配處理中退款」的一致性破洞）
- 補取消原因分類六選一必選（CR-3 決議，refine-consultation-cancellation-and-invoice-flow 引入）
- 「作為」維持業務（具諮詢權限）；操作者描述對齊「諮詢人員或業務主管」（取消權限見 consultation-request § Requirement: 諮詢取消權限）
- source frontmatter 更新指向 converge change + consultation-request 新版兩個 Requirement；移除已廢止的「諮詢費發票時間點處理」source（invoice_option 已不驅動發票自動化）
