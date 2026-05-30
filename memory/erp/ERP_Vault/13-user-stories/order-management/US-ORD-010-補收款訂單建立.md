---
type: user-story
us-id: US-ORD-010
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-28
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單建立"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "主訂單已建立"
  - "業務為主訂單擁有者或職務代理人"
---

# US-ORD-010 補收款訂單建立

> **模型對齊狀態（2026-05-29 收斂 Step 3d）**：本卡「補收款訂單（parent_order_id 主從關聯）模式」與 [[US-ORD-026-業務建補收OA免主管核可直接執行]]「補收訂單異動（OrderAdjustment）模式」**並存**。現行 spec 與 as-built prototype 的補收採 **OA 模式**（沿用既有訂單異動流程、不另開補收款訂單；對齊 MEMORY「補收等場景能用既有流程涵蓋就不另開例外路徑」）。本「補收款訂單」模式是否保留為獨立情境（如大額追加另立子訂單）或標為 deprecated，**待 Miles 拍板**；拍板前本卡 status 暫不變動。

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於主訂單一鍵建立補收款訂單並保留主從關聯

### 以便
急件費 / 版費 / 加印費等補收款項目可獨立追蹤付款流程，業務感受是「在此單補收」

### 前置條件
- 主訂單已建立
- 業務為主訂單擁有者或職務代理人

### 業務流程

1. 業務於主訂單詳情執行「建立補收款」
2. 系統建立補收款訂單並關聯至主訂單（parent_order_id 指向主訂單）
3. 業務填寫補收款項目與金額（如：急件費 / 版費）
4. 補收款訂單獨立走付款流程（可獨立收款 / 開發票）
5. 主訂單頁面顯示補收款訂單清單與**合計金額**（= 所有相關補收款訂單金額加總）
6. 業務可於主訂單建立多筆補收款訂單（無限制數量）

### 成功條件

1. 業務可於主訂單一鍵建立補收款訂單，自動關聯至主訂單
2. 補收款訂單可獨立走付款流程，不影響主訂單付款狀態
3. 主訂單頁面顯示補收款訂單合計金額（隨補收款新增 / 修改 / 刪除即時更新）
4. 業務可於同一主訂單建立多筆補收款訂單

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單建立」L21+（含補收款訂單建立邏輯）
- 原 Notion User Story DB `US-ORD-010`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單建立補收款訂單模式（parent_order_id 主從關聯）
- 補主訂單合計金額即時計算
- 邊界：補收款訂單付款流程同一般訂單（不在本卡擴充）
