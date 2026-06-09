---
type: user-story
us-id: US-ORD-010
module:
  - 訂單管理
business-domain:
  - 款項與發票
role:
  - "[[業務]]"
priority: medium
status: deprecated
created-at: 2026-05-22
last-reviewed: 2026-05-29
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單建立"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 主訂單已建立
  - 業務為主訂單擁有者或職務代理人
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/32e3886511fa81d59023fbc75271b7bb
---

# US-ORD-010 補收款訂單建立

> **已廢止（deprecated，2026-05-29 收斂 Step 3d，Miles 拍板）**：補收統一走 [[US-ORD-026-業務建補收OA免主管核可直接執行]]「補收訂單異動（OrderAdjustment）模式」（正項免審直達已執行 + 自動帶請款期次 + 開發票，連獨立發票需求都靠期次↔發票 1:1 涵蓋）。本「補收款訂單（parent_order_id 子訂單）模式」是 spec 與 as-built prototype 都未採用的平行路徑，違反「補收用既有流程、不另開例外路徑」原則（MEMORY），故廢止。其原涵蓋需求的歸屬：純費用補收（急件費 / 版費 / 折扣）→ 補收 OA；加印需生產 → 訂單內加印件（製作中）或售後補印（AfterSalesTicket → 補印 PrintItem）。本卡保留作歷史，不再作為現行需求依據。

## 業務情境

### 作為
[[業務]]

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

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單建立」L21+（含補收款訂單建立邏輯）
- 原 Notion User Story DB `US-ORD-010`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單建立補收款訂單模式（parent_order_id 主從關聯）
- 補主訂單合計金額即時計算
- 邊界：補收款訂單付款流程同一般訂單（不在本卡擴充）
