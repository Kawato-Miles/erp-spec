---
type: user-story
us-id: US-ORD-011
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
priority: high
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-28
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單取消流程"
related-spec: openspec/specs/order-management/spec.md
related-scenarios:
  - "[[wiki/erp/07-scenarios/README#情境 16：訂單取消與退款端到端（跨角色多模組連鎖）]]"
related-business-logic: []
related-entities:
  - "[[訂單]]"
prerequisites:
  - 訂單存在（任意狀態，依 spec § 訂單取消流程允許任意狀態取消）
related-oq: []
related-test-cases: []
---

# US-ORD-011 業務取消訂單與退款申請

> **重寫紀錄（2026-05-22）**：原卡涵蓋「業務取消 + 系統 top-down 連鎖 + 業務退款申請 + 會計執行退款 + 已退款」跨多角色多動作，違反「user story 單角色單動作」紀律。本卡重新定位為**業務動作**（取消 + 退款申請）；會計執行退款部分拆出為 [[US-ORD-013-會計執行退款處理]]；端到端跨角色串接由 07-scenarios 情境 16 處理。

## 業務情境

### 作為
[[業務]]

### 我希望
能取消訂單並對已收款訂單提退款申請

### 以便
正式終止訂單並啟動退款流程，下游工單 / 任務 / 生產任務由系統連鎖終止避免製作浪費

### 前置條件
- 訂單存在（任意狀態均可取消）
- 業務為訂單擁有者或職務代理人

### 業務流程

1. 業務於訂單詳情執行「取消訂單」
2. 訂單狀態轉「已取消」終態（不可逆）；系統自動 top-down 連鎖終止下游（屬系統行為，業務無需手動處理）：
   - 所屬工單全數轉「已取消」
   - 任務全數轉「已作廢」
   - 生產任務依生產進度分流：尚未進入生產 → 「已作廢」/ 已進入生產 → 「報廢」（成本依已報工數量計算）
3. 業務判斷該訂單是否需退款（依已收款狀態決定）
4. 若需退款，業務於訂單發起退款申請（狀態：退款申請）
5. 退款申請後進入會計處理流程（詳見 [[US-ORD-013-會計執行退款處理]]）；業務本卡範疇結束

### 成功條件

1. 業務可於任意狀態執行「取消訂單」，訂單狀態轉「已取消」終態不可逆
2. 系統自動 top-down 連鎖終止下游工單 / 任務 / 生產任務（業務無需手動處理）
3. 已進入生產的生產任務轉「報廢」（成本依已報工數量計算）；尚未進入的轉「已作廢」
4. 業務可對已收款訂單發起退款申請；退款申請寫入活動紀錄供事後追蹤
5. 取消動作與下游連鎖終止清單寫入活動紀錄供事後稽核

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單取消流程」L204+
- 原 Notion User Story DB `US-ORD-011`（2026-05-22 重寫；原跨角色內容拆分至 US-ORD-013）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

對齊 spec § 訂單取消流程完整 top-down 連鎖；含「業務發起退款 → 會計執行 → 已退款」三狀態。

### 第二輪（2026-05-22 v3，「禁 anchor + 單角色單動作」紀律演化後）

| 修正項 | 處理 |
|--------|------|
| 業務 + 會計兩角色動作違反單角色紀律 | 已採納：拆出 [[US-ORD-013-會計執行退款處理]] 涵蓋會計動作 |
| 退款三狀態跨角色 | 已採納：本卡涵蓋業務發起申請（退款申請狀態），會計執行 / 標記已退款由 ORD-013 涵蓋 |
| 折讓單建立邏輯 | 已採納：屬會計處理範疇，移至 ORD-013 |
| 端到端流程串接（業務 → 系統 → 會計）| 待補：07-scenarios 補情境 16「訂單取消與退款端到端」（本次未做，待 Miles 確認後補入） |
| 新增 prerequisites 欄位 | 已採納（紀律演化示範） |
