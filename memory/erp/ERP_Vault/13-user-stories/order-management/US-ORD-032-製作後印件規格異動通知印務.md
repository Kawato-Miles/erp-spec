---
type: user-story
us-id: US-ORD-032
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[../../03-roles/業務]]"
priority: high
stage: business-only
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - "openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § 製作後印件規格異動系統自動通知"
  - "openspec/changes/relax-order-detail-edit-conditions/proposal.md § Why"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[../../05-entities/印件]]"
  - "[[../../05-entities/工單]]"
related-test-cases: []
---

# US-ORD-032 製作後印件規格異動觸發系統自動通知印務

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

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
5. 系統推送異動通知給工單負責印務、印務主管、訂單管理人；訂單管理人未指派時退化為通知該訂單負責業務
6. 收到通知的印務確認是否需依新規格調整生產任務、製程或材料配置

### 成功條件（acceptance criteria）

1. 業務於製作後階段對印件規格類欄位的調整能直接生效，不需通過業務主管核可
2. 系統推送的通知含「操作者姓名 / 印件名稱 / 變更欄位前後對照」三項可辨識資訊
3. 訂單管理人未指派時，通知對象自動退化為訂單負責業務（不靜默失敗）
4. 訂單活動紀錄記錄每筆規格異動的變更前後對照與實際通知對象清單
5. 售價欄位於製作後仍維持唯讀並引導去訂單異動流程，不在本流程處理

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/pages/OrderDetail.tsx + src/components/order/EditOrderPrintItemPanel.tsx -->

### 介面入口
- 訂單詳情頁「訂單項目」Tab → 印件清單表格 row 操作欄「編輯印件」按鈕

### 操作步驟
1. 業務點訂單詳情頁「訂單項目」Tab 上的印件「編輯印件」按鈕
2. Side Panel 開啟、顯示 Info Banner「規格類欄位仍可編輯（系統將自動通知印務 / 印務主管 / 訂單管理人）；售價變更需走訂單異動 Tab」
3. 業務修改規格備註 / 購買數量 / 單位 / 難易度任一欄位後點「確認」
4. Side Panel 關閉，畫面顯示 Toast「印件已更新，已通知印務團隊」+ 通知對象姓名清單

### 介面元素
- 印件清單操作欄「編輯印件」按鈕：v1.13 後不再限製作前才顯示，訂單未取消即顯示
- Side Panel Info Banner：訂單進入製作階段時顯示提示
- Side Panel 售價欄位：disabled + Tooltip「訂單已進入製作階段，售價變更需走『訂單異動』Tab 建立補收 / 折讓單」
- Toast：含通知對象姓名清單（印務 / 印務主管 / 訂單管理人 fallback 業務）

## 來源（provenance）

- openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § Requirement「製作後印件規格異動系統自動通知」
- openspec/changes/relax-order-detail-edit-conditions/proposal.md § Why（v1.7 翻轉理由：業務反映通知印務的非同步成本過高）
- openspec/changes/relax-order-detail-edit-conditions/design.md § D6 通知對象 + fallback 規則
