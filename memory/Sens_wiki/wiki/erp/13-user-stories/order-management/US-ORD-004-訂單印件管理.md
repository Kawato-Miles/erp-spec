---
type: user-story
us-id: US-ORD-004
module:
  - order-management
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 多印件管理"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單階段印件規格編輯時機"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
  - "[[印件]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 訂單未進入終態（status ∉ {訂單完成, 已取消}）
  - 業務為訂單擁有者或職務代理人
---

# US-ORD-004 訂單印件管理

## 業務情境

### 作為
[[業務]]

### 我希望
能於訂單詳情新增 / 編輯多筆印件並設定規格 / 數量 / 單價（含調降）/ 免審稿標記

### 以便
訂單成立後仍可調整印件結構，免審稿印件可加速生產；訂單未進入終態前規格與金額皆可直接調整，印件費與應收即時重算

### 前置條件
- 訂單未進入終態（status ∉ {訂單完成, 已取消}）
- 業務為訂單擁有者或職務代理人

### 業務流程

1. 業務於訂單詳情查看印件清單（印件清單以單層 row 呈現，操作欄提供編輯印件 / 補件 / 檢視，無申請異動鈕）
2. 訂單未進入終態（非訂單完成 / 已取消）時，業務可直接新增 / 編輯印件規格（規格說明 / 數量 / 單位 / 難易度）與單價（含調降），系統即時重算印件費與訂單應收
3. 業務為每筆印件設定獨立規格 / 數量 / 單價 / 免審稿標記
4. 免審稿印件自動跳過審稿環節，直接建立合格的審稿輪次（依 [[US-AR-002-設定印件難易度與免審稿]] 免審稿快速路徑）
5. 業務調降單價或數量致印件費減少時，系統寫入訂單活動紀錄事件 pre_completion_amount_decrease（弱把關、不阻擋、不送業務主管核可，主管事後可於活動紀錄查見）
6. 訂單進入終態（訂單完成 / 已取消）後，所有印件欄位（含金額）唯讀；金額異動改走「訂單異動」建立訂單異動單（補收 / 退款）
7. 系統寫入印件 ActivityLog（事件描述：印件新增 / 修改 + 業務姓名 + 變更內容）

### 成功條件

1. 業務可於訂單詳情新增多筆印件，每筆獨立設定規格 / 數量 / 單價 / 免審稿
2. 免審稿印件自動跳過審稿環節進入製程審核（連動 [[US-AR-002]]）
3. 訂單未進入終態時，業務直接調整印件規格與單價，系統即時重算印件費與訂單應收；金額調降寫 pre_completion_amount_decrease 留痕（不阻擋）
4. 訂單進入終態（訂單完成 / 已取消）後印件欄位唯讀，金額異動走訂單異動單（補收 / 退款）
5. 印件異動寫入 ActivityLog 供事後稽核

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「多印件管理」L157+ + § Requirement「訂單階段印件規格編輯時機」L1821+
- 原 Notion User Story DB `US-ORD-004`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 多印件管理 + § 訂單階段印件規格編輯時機（v1.7 refine-order-detail-tabs 歸檔變更）
- 補免審稿連動 [[US-AR-002]]
- 邊界：金額異動由訂單異動流程處理（不在本卡）；規格編輯由本卡涵蓋

### 第二輪（2026-06-03，對齊 2026-06-02-refactor-order-receivable-refund-model 路 C）

- 編輯時機界線由「製作前 / 製作完成階段 + 售價門控」收斂為以訂單終態（status ∉ {訂單完成, 已取消}）為界：未進終態業務可直接改規格與單價（含調降），印件費與應收即時重算
- 廢止「金額 / 規格分離、金額一律走訂單異動」舊門控；完成前金額可直接改、不走訂單異動，金額走訂單異動僅限訂單完成 / 已取消終態後
- 補金額調降弱把關留痕機制 pre_completion_amount_decrease（不阻擋、不送核可、主管事後可查）
- 補終態唯讀分支；印件清單改單層 row，操作欄無申請異動鈕（對齊 2026-05-28-relax-order-detail-edit-conditions）
