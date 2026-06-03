---
type: user-story
us-id: US-ORD-036
module:
  - order-management
business-domain:
  - order-fulfillment
role:
  - "[[業務主管]]"
priority: medium
status: active
created-at: 2026-06-03
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單負責業務改派"
  - "openspec/specs/user-roles/spec.md#業務主管改派負責業務職責"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 訂單存在且未取消（status ≠ 已取消，含已完成）
  - 操作者具業務主管角色
---

# US-ORD-036 業務主管改派訂單負責業務

> 改派（改 owner，限業務主管）與分享（不改 owner、業務本人可做，US-ORD-004 / US-ORD-008）為兩種獨立機制。改派負責業務（`sales_id`）與既有「Supervisor 重新指定審核業務主管（`approved_by_sales_manager_id`）」亦為兩件事，不互相取代。

## 業務情境

### 作為
[[業務主管]]

### 我希望
能於訂單詳情頁將訂單負責業務改派給另一位業務，並必選改派理由分類、留下稽核軌跡

### 以便
業務離職交接、長假代理、工作負荷平衡或客戶要求換窗口時，訂單與其後續售後事件能轉由接手業務負責，不中斷服務

### 前置條件
- 訂單存在且未取消（status ≠ 已取消，含已完成訂單仍可改派——售後負責人衍生自訂單負責人，業務離職後完成訂單的售後須能改派接手）
- 操作者具業務主管角色（業務 / 諮詢視角不顯示改派入口）
- 該訂單有負責業務（電商來源訂單 sales_id 為空時改派入口停用）

### 業務流程

1. 業務主管於訂單詳情頁「資訊」Tab 的訂單資訊卡，於業務負責人 row 看到「改派負責人」入口（業務 / 諮詢視角不顯示此入口）
2. 點擊「改派負責人」開啟改派 Dialog
3. 業務主管選擇新負責業務（候選 = 具訂單管理權限的使用者，全公司範圍）
4. 業務主管必選改派理由分類（離職交接 / 長假代理 / 工作負荷平衡 / 客戶要求換窗口 / 其他）並可補述
5. 確認後系統更新訂單 `sales_id` 為新負責人；改派不改變訂單狀態
6. 系統依理由分類處理分享成員與通知：
   - 理由 = 離職交接：清空該訂單既有分享成員、不通知原負責人（已離職）
   - 理由 ∈ {長假代理、工作負荷平衡、客戶要求換窗口、其他}：保留既有分享成員、知會原負責人
   - 任一理由皆通知新負責人（Slack 通知 + 活動紀錄）
7. 系統寫入活動紀錄五要素（原負責人 / 新負責人 / 改派時間 / 理由分類與補述 / 操作主管）
8. 該訂單後續售後事件的負責業務衍生為新負責人（售後負責人非獨立欄位）

### 成功條件

1. 業務主管於未取消訂單（含已完成）點「改派負責人」、選新負責人（候選 = 具訂單管理權限使用者）、必選理由分類、確認後，系統更新 `sales_id` 為新負責人且訂單狀態不變
2. 改派寫入活動紀錄五要素（原 / 新負責人、改派時間、理由分類與補述、操作主管）供事後稽核
3. 改派已完成訂單後，該訂單後續售後事件的負責業務衍生為新負責人
4. 理由 = 離職交接時，系統清空該訂單既有分享成員且不通知原負責人；其餘理由保留分享成員並知會原負責人；任一理由皆通知新負責人
5. （守衛型）訂單已取消時「改派負責人」入口停用，並提示「已取消訂單無法改派」
6. （守衛型）電商來源訂單無負責業務（sales_id 為空）時改派入口停用，並提示「電商訂單尚無負責業務，無法改派」
7. （守衛型）業務 / 諮詢視角不顯示「改派負責人」入口（改派限業務主管；業務本人的臨時協助走「分享」機制）

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) § Requirement「訂單負責業務改派」、§ Requirement「訂單詳情頁業務負責人 row 簡化」（2026-05-30-add-sales-manager-reassign-owner）
- [`openspec/specs/user-roles/spec.md`](../../../../openspec/specs/user-roles/spec.md) § 業務主管改派負責業務職責（改派通用規則：理由五值必填、五要素留痕、候選人 Role 篩選、全公司範圍、改派不改狀態）

## 校對紀錄

### 第一輪（2026-06-03 新增）

依訂單發布迭代覆蓋缺口稽核補建：archived change `2026-05-30-add-sales-manager-reassign-owner` 原無對應 user story 卡（critic 揭露覆蓋缺口）。涵蓋業務主管改派負責業務（改 owner）動作，與分享機制（US-ORD-004/008，不改 owner）、Supervisor 重新指定審核業務主管（approved_by_sales_manager_id）區隔。
