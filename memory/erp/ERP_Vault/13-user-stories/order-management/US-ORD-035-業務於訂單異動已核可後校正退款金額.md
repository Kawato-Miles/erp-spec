---
type: user-story
us-id: US-ORD-035
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[../../03-roles/業務]]"
priority: medium
stage: business-only
status: draft
created-at: 2026-05-30
last-reviewed: 2026-05-30
source:
  - openspec/specs/order-management/spec.md#訂單異動（OrderAdjustment）建立與審核
  - openspec/specs/after-sales-ticket/spec.md#已核可狀態下業務可改金額
related-spec: openspec/specs/order-management/spec.md
related-scenarios:
  - "[[訂單異動流程]]"
related-business-logic:
  - "[[訂單異動規則]]"
related-entities:
  - "[[../../05-entities/訂單]]"
related-test-cases: []
---

# US-ORD-035 業務於訂單異動已核可後校正退款金額

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
在退款[[訂單異動規則|訂單異動]]已取得業務主管核可、但款項尚未實際退出去之前，調整這筆退款的金額而不必重新送主管審核

### 以便
退款前若客戶與公司就退多少達成新的共識（例如折讓比例談定、運費爭議釐清），業務能即時把金額校正到正確值，不必為了一個已獲主管原則同意的退款重跑一輪審核而拖延退款時程；同時保留「主管核可金額 vs 當前金額」對照供事後監督，金額誤差降到單筆校正即收斂

### 前置條件
- 退款訂單異動為負項（退款方向），且已由[[../../03-roles/業務主管]]核可、進入「已核可」狀態
- 該退款的款項尚未實際退出去（對應退款款項尚未切「已完成」、異動單尚未推進「已執行」）
- 校正後的金額仍為退款方向（負項）

### 業務流程

1. 退款訂單異動經[[../../03-roles/業務主管]]核可後停在「已核可」，等實際退款款項退出去
2. 退款前業務與客戶就退款金額達成新共識（金額需調整）
3. 業務直接校正該退款訂單異動的金額，不必重新送主管審核，狀態維持「已核可」
4. 系統保留「主管核可金額 vs 當前金額」對照與本次金額異動軌跡（時間、操作者、舊金額、新金額、異動當時狀態），供[[../../03-roles/業務主管]]事後監督
5. 業務之後建立實際退款款項並切「已完成」，累計金額達校正後金額時，系統推進該退款訂單異動至「已執行」、正式自訂單應收扣除

### 成功條件（acceptance criteria）

1. 退款訂單異動在「已核可」狀態下，業務校正金額後狀態維持「已核可」，不退回「待主管審核」、不需重新送審
2. 每次金額校正寫入金額異動軌跡（時間 / 操作者 / 舊金額 / 新金額 / 異動當時狀態），且「主管核可金額 vs 當前金額」對照可被[[../../03-roles/業務主管]]事後查核
3. 校正僅限「已核可且尚未執行」；異動單已推進「已執行」後金額鎖定、業務不可再校正
4. 校正後實際退款款項切「已完成」、累計金額達校正後金額時，系統推進異動至「已執行」並依校正後金額扣除訂單應收（諮詢取消自動建的退款異動同樣適用此校正空間，沿用同一規則）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：待 Prototype 定案後補 -->

> 階段 1（stage=business-only）：UI 操作層待對應 Prototype 功能定案後補（觸發 [[erp-user-story]] mode B 補完並改 stage 為 ui-bound）。

### 介面入口
- 待補

### 操作步驟
- 待補

### 介面元素
- 待補

## 來源（provenance）

- [order-management spec § 訂單異動（OrderAdjustment）建立與審核](../../../../openspec/specs/order-management/spec.md)：金額編輯閘門「已核可（未執行）→ 可（不重新送審）」+ Scenario「業務於已核可狀態調整金額」
- [after-sales-ticket spec § 已核可狀態下業務可改金額](../../../../openspec/specs/after-sales-ticket/spec.md)：OA 進入「已核可」後業務於 ticket 內可改 current_amount、不需重新送審、對照欄位即時顯示
- 規則正本（補退不對稱分權與「已核可可改金額不重審」R6）見 [[訂單異動規則]]（business-logic 規則正本）
