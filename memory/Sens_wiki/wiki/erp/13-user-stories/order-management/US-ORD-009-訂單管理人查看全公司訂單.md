---
type: user-story
us-id: US-ORD-009
module:
  - order-management
role:
  - "[[訂單管理人]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單列表與分享權限"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq:
  - "[[ORD-1-Notion-US-ORD-005編碼重複處理]]"
related-test-cases: []
prerequisites:
  - 使用者角色為訂單管理人
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/32e3886511fa8173b479fd92ef1c89cf
---

# US-ORD-009 訂單管理人查看全公司訂單

> 本卡為原 Notion 上重複編碼 US-ORD-005 重新編號（補既有 ORD-009 缺號）。詳見 [[ORD-1-Notion-US-ORD-005編碼重複處理]]。

## 業務情境

### 作為
[[訂單管理人]]

### 我希望
能於訂單列表預設看到全公司所有訂單並可多維度篩選

### 以便
統一掌握全公司訂單進度，識別延誤或需要介入的訂單

### 前置條件
- 使用者角色為訂單管理人

### 業務流程

1. 訂單管理人登入後，訂單列表預設顯示全公司所有訂單（不限於自己建立的）
2. 訂單管理人依需要套用多維度篩選（業務負責人 / 訂單狀態 / 訂單類型 / 付款狀態 / 售後狀態 / 交期起訖區間 / 關鍵字），篩選僅作用於當前角色可見訂單集、不擴大可見範圍，並可一鍵清空篩選
3. 訂單管理人開啟訂單詳情追蹤進度
4. 角色視角切換不需額外設定（角色決定預設視野）：
   - 訂單管理人：預設看全公司
   - 業務角色：預設只看自己建立的訂單（依 [[US-ORD-008-訂單列表分享與代理]] 授權外可額外看到被授權的）

### 成功條件

1. 訂單管理人列表頁預設顯示全公司所有訂單（不限於自己建立的）
2. 業務角色列表頁預設只顯示自己的訂單（含被授權的）
3. 篩選功能可依業務負責人 / 訂單狀態 / 訂單類型 / 付款狀態 / 售後狀態 / 交期起訖區間 / 關鍵字任意組合，且僅作用於當前角色可見訂單集（不擴大可見範圍）
4. 角色視角差異由系統依角色自動套用，無需手動切換
5. 付款狀態篩選以訂單層付款狀態（未付款 / 部分付款 / 已付款 / 已退款）為比較基準；交期篩選以訂單交期為比較基準，不跨印件聚合
6. 點擊清空篩選時，所有篩選條件（含關鍵字與交期起訖）重置為預設並回到列表第一頁

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單列表與分享權限」L248+
- 原 Notion User Story DB `US-ORD-005`（編碼重複版，2026-05-22 重新編號為 US-ORD-009 並遷入）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單列表與分享權限角色視角差異
- 編碼重新處理（原 Notion US-ORD-005 重複 → 重新編號 US-ORD-009，沿用 AR-2 模式）
- 邊界：個別訂單授權由 [[US-ORD-008]] 處理；本卡涵蓋角色預設視野

### 第二輪（2026-06-03，對齊 2026-06-02-enhance-order-list-filter change）

- 篩選欄位集細化：業務負責人 / 訂單狀態 / 訂單類型 / 付款狀態 / 售後狀態 / 交期起訖區間 / 關鍵字（取代舊「業務 / 狀態 / 交期 / 客戶」）
- 補當前角色可見集守衛：篩選僅作用於當前角色可見訂單集、不擴大可見範圍
- 補付款狀態以訂單層比較、交期以訂單交期不跨印件聚合之比較基準
- 補一鍵清空篩選（重置含關鍵字與交期起訖並回列表第一頁）
- spec 編碼對齊：本 change 將原 US-ORD-005 視角差異需求對映至 US-ORD-009
