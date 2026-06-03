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
status: draft
created-at: 2026-05-28
last-reviewed: 2026-06-03
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
  - openspec/changes/refactor-order-receivable-refund-model/specs/order-management/spec.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/3743886511fa81bba54af6ad41860264
---

# US-ORD-031 期次規劃 invariant 警示與大額補收紅標

## 業務情境

### 作為
[[業務]]（接收警示）/ [[業務主管]]（接收大額補收事後通知）

### 我希望
訂單應收與請款期次合計不一致時，系統警示「應收 vs 期次合計差額」提醒業務同步期次規劃（補收致應收上升 → 補建期次；完成前明細調降致應收下降 → 下修期次）；同時大額補收觸發業務主管 Slack 通知做事後監督

### 以便
覆蓋 Phase 4 PM 匯報新增情境組合（期次規劃 invariant 警示 + 大額閾值監督 + 廢止事前回審後的留軌跡稽核）；補收 OA 立即執行不阻擋業務操作的同時，業務主管仍可掌握異常變動

### 前置條件
- 應收與期次合計不一致，成因之一：補收訂單異動已執行（應收 +N 立即認列）或完成前明細／訂單額外費用調降致應收下降
- 訂單下未取消請款期次的金額合計 ≠ 訂單應收

### 業務流程
1. 業務建立補收正項異動（如：加印追加 +8K）→ 直接執行；或完成前以編輯印件／訂單額外費用調降致應收下降
2. 對帳檢視顯示警示橫幅：應收上升時「訂單異動已執行 N 元、但未對應期次規劃（差額 N）」+ 引導動作「建立期次」；應收下降（期次合計 > 應收）時「應收已下降、期次規劃需同步」引導
3. 業務依引導建立期次，預填差額金額 → 儲存（應收下降情形則下修既有期次金額）→ 警示消失
4. 若補收金額 > 大額閾值（系統常數，起始 50000），系統同時：
   - 寫入活動紀錄紅標事件（大額補收）
   - 推送 Slack 通知業務主管「業務 [姓名] 建立大額補收訂單異動 +N 元於訂單 [訂單編號]」
5. 業務主管事後檢視活動紀錄或 Slack 通知；若發現異常與業務 Slack 溝通修正（不阻擋業務操作）

### 成功條件（acceptance criteria）

1. 恆定約束警示觸發條件：訂單應收（含已執行訂單異動）≠ 未取消請款期次的金額合計（顧問 C-PM-2 採納）；雙向觸發 — 應收 > 期次合計 → 引導補建期次，期次合計 > 應收（完成前調降致應收下降）→ 引導下修期次
2. 警示橫幅不阻擋業務後續操作（提示性、非強制彈窗），業務可暫不處理續工作；但不得提供「忽略此差額」選項——差額只能靠實際補建／下修期次消除（路 C：補保護降級洞，與對帳「應退差額警示不可忽略」同精神）
3. 大額閾值取自系統常數（值待 [[BI-4-補收OA大額閾值定義|BI-4]] 拍板實務值，目前起始 50000）
4. Slack 通知為 mock（prototype 階段不真實發送）；上線時整合實際 Slack API
5. 廢止 v1.13「付款計畫變更觸發訂單回業務主管審核」事前 gate，改採「留軌跡 + 警示提示 + Slack 通知」三管道事後稽核

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 三方對帳警示 banner（期次規劃 invariant）+ Requirement: 補收 OA 大額閾值監督機制
- design.md § Decisions D4 + D5 + Risks/Trade-offs § 補收 OA 免主管核可緩解
- 顧問 C-PM-2 + C-PM-3 採納
- openspec/changes/refactor-order-receivable-refund-model/specs/order-management/spec.md § Requirement: 三方對帳檢視（路 C：完成前調降與期次同步引導 + 差額警示不可忽略）
- [[BI-4-補收OA大額閾值定義]]
- [[BI-11-三方對帳警示banner觸發條件]]

## 校對紀錄

- 2026-06-03 依 archived change refactor-order-receivable-refund-model（路 C）對齊：(1) 我希望／前置條件／業務流程／成功條件 1 由「僅補收上行」擴為雙向 invariant——完成前明細／訂單額外費用調降致應收下降、期次合計 > 應收時引導下修期次（refactor § 三方對帳檢視「完成前調降與期次同步引導」）；(2) 成功條件 2 原「業務 MAY 忽略繼續工作」改寫為「可暫不處理但 MUST NOT 提供『忽略此差額』選項」，對齊 refactor「差額警示不可忽略」保護降級洞精神，消除與正本矛盾；(3) frontmatter source 補 refactor change、last-reviewed 更新。大額補收紅標 + Slack 事後監督 + 廢止事前 gate 三段仍由 unify-billing 生效，未動。
