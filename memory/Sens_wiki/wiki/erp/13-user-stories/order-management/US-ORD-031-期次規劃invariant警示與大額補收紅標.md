---
type: user-story
us-id: US-ORD-031
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
  - "[[業務主管]]"
priority: medium
stage: ui-bound
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-031 期次規劃 invariant 警示與大額補收紅標

## 業務情境（穩定層）

### 作為
[[業務]]（接收警示）/ [[業務主管]]（接收大額補收事後通知）

### 我希望
業務建立補收正項異動後若尚未補建請款期次，系統警示「應收 vs 期次合計差額」提醒業務補建；同時大額補收觸發業務主管 Slack 通知做事後監督

### 以便
覆蓋 Phase 4 PM 匯報新增情境組合（期次規劃 invariant 警示 + 大額閾值監督 + 廢止事前回審後的留軌跡稽核）；補收 OA 立即執行不阻擋業務操作的同時，業務主管仍可掌握異常變動

### 前置條件
- 補收訂單異動已執行（應收 +N 立即認列）
- 訂單下未取消請款期次的金額合計 ≠ 訂單應收

### 業務流程
1. 業務建立補收正項異動（如：加印追加 +8K）→ 直接執行
2. 對帳檢視顯示警示橫幅「OA 已執行 N 元、但未對應期次規劃（差額 N）」+ action 「建立期次」
3. 業務點 action 開期次建立 Dialog，預填差額金額 → 儲存 → 警示消失
4. 若補收金額 > 大額閾值（SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD = 50000），系統同時：
   - 寫入活動紀錄紅標事件 high_amount_supplementary_charge
   - 推送 Slack 通知業務主管「業務 [name] 建立大額補收 OA +N 元於訂單 [order_no]」
5. 業務主管事後檢視 audit log 或 Slack 通知；若發現異常與業務 Slack 溝通修正（不阻擋業務操作）

### 成功條件（acceptance criteria）

1. invariant 警示觸發條件：訂單應收（含已執行 OA）≠ Σ BillingInstallment.scheduledAmount where cancelled=false（顧問 C-PM-2 採納）
2. 警示橫幅不阻擋業務後續操作（提示性、非 modal）；業務 MAY 忽略繼續工作
3. 大額閾值 derived from 系統常數 SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD（值待 OQ-BI-4 Miles 拍板實務值，目前起始 50000）
4. Slack 通知為 mock（prototype 階段不真實發送）；上線時整合實際 Slack API
5. 廢止 v1.13「付款計畫變更觸發訂單回業務主管審核」事前 gate，改採「留軌跡 + 警示提示 + Slack 通知」三管道事後稽核

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderBillingInstallmentSection.tsx + OrderAdjustmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 「請款期次（v2 統一規劃）」區塊頂部警示橫幅
- 訂單異動編輯 Dialog → 大額補收觸發 amber 警示 + BellRing 提示

### 介面元素
- OrderBillingInstallmentSection 內 invariant 警示橫幅含 action button「建立期次」
- OrderAdjustmentEditDialog 大額補收 amber 橫幅 + BellRing 圖示

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 三方對帳警示 banner（期次規劃 invariant）+ Requirement: 補收 OA 大額閾值監督機制
- design.md § Decisions D4 + D5 + Risks/Trade-offs § 補收 OA 免主管核可緩解
- 顧問 C-PM-2 + C-PM-3 採納
- [[BI-4-補收OA大額閾值定義]]
- [[BI-11-三方對帳警示banner觸發條件]]
