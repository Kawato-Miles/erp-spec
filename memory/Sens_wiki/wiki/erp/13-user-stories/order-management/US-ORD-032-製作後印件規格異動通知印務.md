---
type: user-story
us-id: US-ORD-032
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[業務]]"
priority: high
status: draft
created-at: 2026-05-28
last-reviewed: 2026-06-03
source:
  - openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § 製作後印件規格異動系統自動通知
  - openspec/changes/relax-order-detail-edit-conditions/proposal.md § Why
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[印件]]"
  - "[[工單]]"
related-test-cases: []
---

# US-ORD-032 製作後印件規格異動觸發系統自動通知印務

## 業務情境

### 作為
[[業務]]

### 我希望
在訂單進入製作階段後仍可直接調整印件規格描述、購買數量、單位、難易度等欄位，並由系統自動將異動內容通知工單負責印務、印務主管、訂單管理人。

### 以便
不需透過 Slack / 電話通知印務並等待印務從工單異動單流程處理，加速規格變更生效與下游確認，同時保留稽核軌跡確認誰在何時改了什麼欄位、通知對象是誰。

### 前置條件
- 訂單狀態已超過製作前階段（已進入製作等待中、工單已交付、製作中、製作完成、出貨中、訂單完成 任一狀態）
- 訂單未取消
- 業務為該訂單負責業務、或諮詢、或訂單管理人，且為該訂單對應使用者
- 異動欄位屬規格類（規格備註 / 購買數量 / 單位 / 難易度）；售價不在此範圍（須走訂單異動）

### 業務流程

1. 業務於訂單詳情頁的印件清單區找到需要調整的印件
2. 業務開啟該印件的編輯介面並調整規格類欄位
3. 業務送出後，系統直接套用調整內容、更新印件規格
4. 系統自動將異動內容（含變更前後對照、操作者、時間戳）寫入訂單活動紀錄
5. 系統推送異動通知給工單負責印務、印務主管、訂單管理人；訂單管理人未指派時，以該訂單負責業務替補訂單管理人一席（工單負責印務、印務主管仍照常通知）
6. 收到通知的印務確認是否需依新規格調整生產任務、製程或材料配置

### 成功條件（acceptance criteria）

1. 業務於製作後階段對印件規格類欄位的調整能直接生效，不需通過業務主管核可
2. 系統推送的通知含「操作者姓名 / 印件名稱 / 變更欄位前後對照」三項可辨識資訊
3. 訂單管理人未指派時，由訂單負責業務替補該席接收通知（工單負責印務、印務主管仍照常通知），不靜默失敗
4. 訂單活動紀錄記錄每筆規格異動的變更前後對照與實際通知對象清單
5. 售價欄位於製作後仍維持唯讀並引導去訂單異動流程，不在本流程處理
6. 工單負責印務未指派時，通知對象略過工單負責印務，仍通知印務主管與訂單管理人（或其替補的訂單負責業務），並於訂單活動紀錄留替補註記

## 來源（provenance）

- openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § Requirement「製作後印件規格異動系統自動通知」
- openspec/changes/relax-order-detail-edit-conditions/proposal.md § Why（v1.7 翻轉理由：業務反映通知印務的非同步成本過高）
- openspec/changes/relax-order-detail-edit-conditions/design.md § D6 通知對象 + fallback 規則
