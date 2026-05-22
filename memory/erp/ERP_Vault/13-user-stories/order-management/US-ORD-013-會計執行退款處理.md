---
type: user-story
us-id: US-ORD-013
module:
  - order-management
role:
  - "[[03-roles/會計]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 退款 Payment 與折讓分離（先記退款，再開折讓）"
  - "openspec/specs/order-management/spec.md#Requirement: 折讓單（SalesAllowance）建立、確認、作廢"
related-spec: openspec/specs/order-management/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 16：訂單取消與退款端到端（跨角色多模組連鎖）]]"
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
prerequisites:
  - "[[US-ORD-011-訂單取消與退款]]：業務已取消訂單並發起退款申請（狀態：退款申請）"
related-oq: []
related-test-cases: []
---

# US-ORD-013 會計執行退款處理

> **新增紀錄（2026-05-22）**：本卡為 [[US-ORD-011-訂單取消與退款]] 拆分新增；依「user story 單角色單動作」紀律，業務動作（取消 + 退款申請）與會計動作（執行退款 + 折讓）拆為兩張 user story。

## 業務情境（穩定層）

### 作為
[[03-roles/會計]]

### 我希望
能處理業務發起的退款申請並完成銀行退款與折讓單建立

### 以便
退款流程系統化追蹤，會計沖銷與發票折讓對應正確

### 前置條件
- 業務已執行 [[US-ORD-011-訂單取消與退款]] 並發起退款申請（訂單退款狀態：退款申請）
- 會計角色已登入系統

### 業務流程

1. 會計於退款待辦清單查看「退款申請」狀態的訂單
2. 會計檢視訂單退款金額與付款紀錄（含原收款方式 / 金額）
3. 會計執行銀行退款（系統外動作）：依原收款方式退款給客戶
4. 會計於系統內標記「退款處理中」狀態（銀行作業期間）
5. 銀行作業完成後，會計於系統內標記「已退款」終態
6. 系統依發票狀態自動處理折讓單：
   - 已開立發票 → 系統自動建立折讓單關聯退款付款紀錄（先記退款再開折讓，依 spec L1159+ 紀律）
   - 未開立發票 → 不需建立折讓單
7. 系統寫入活動紀錄（事件描述：退款執行 + 會計姓名 + 銀行作業時間 + 退款金額）

### 成功條件

1. 會計可於退款待辦清單看到所有「退款申請」狀態的訂單
2. 會計可標記「退款處理中」狀態反映銀行作業期間
3. 銀行作業完成後會計可標記「已退款」終態（不可逆）
4. 已開發票的訂單於標記「已退款」時系統自動建立折讓單關聯退款付款紀錄
5. 退款執行寫入活動紀錄供事後稽核（含時間 / 操作會計 / 退款金額）

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「退款 Payment 與折讓分離（先記退款，再開折讓）」L1159+ + § Requirement「折讓單（SalesAllowance）建立、確認、作廢」L1130+
- 從 [[US-ORD-011-訂單取消與退款]] 拆出（2026-05-22 紀律演化）

## 校對紀錄

### 第一輪（2026-05-22 新增）

依「user story 單角色單動作」紀律從 US-ORD-011 拆出：
- US-ORD-011 涵蓋業務動作（取消 + 退款申請）
- US-ORD-013（本卡）涵蓋會計動作（執行退款 + 折讓單建立）
- 兩張卡透過 prerequisites 標相依性
- 端到端串接由 07-scenarios 補情境 16
