---
type: user-story
us-id: US-ORD-012
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[業務]]"
priority: low
status: active
created-at: 2026-05-22
last-reviewed: 2026-06-03
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單聯絡人"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 客戶資料已建立於廠客模組
  - 訂單類型為線下單（非 B2C 自助下單）
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/3673886511fa815dba16e32395c82d3e
---

# US-ORD-012 線下單客戶資料關聯帶出

## 業務情境

### 作為
[[業務]]

### 我希望
線下單訂單的客戶資料採關聯帶出而非寫死

### 以便
客戶改名 / 統編變更時不需逐張訂單修改，資料一致性自動保證

### 前置條件
- 客戶資料已建立於廠客模組
- 訂單類型為線下單（非 B2C 自助下單）

### 業務流程

1. 業務於建立訂單時選擇客戶（從廠客模組關聯）
2. 訂單客戶欄位以廠客模組關聯呈現（非寫死快照）
3. 訂單處於「草稿」～「審核通過」～「報價待回簽」等製作前階段時，廠客資料異動後（如：客戶改名、統編變更、地址變更），訂單客戶顯示自動同步更新；同步動作不觸發訂單回業務主管審核
4. 鎖定點：訂單進入「製作中」狀態或已建立任一出貨單後，停止自動同步（避免出貨單 / 紙本工單與系統訂單客戶名稱不一致）；該訂單詳情頁顯示「客戶資料已變更為 X，本訂單因已進入製作不同步」提示，新建訂單則使用新值
5. 發票例外：已開立發票的訂單，發票買受人資料（名稱 / 統編 / 地址）保留開立當時快照，不被廠客資料異動覆寫（依中華民國稅務規則，發票買受人為法定紀錄）；後續新開立發票才使用新值

### 成功條件

1. 訂單客戶欄位採廠客模組關聯，非寫死快照
2. 製作前階段（草稿～報價待回簽）廠客資料異動後既有訂單客戶顯示同步更新，且同步不觸發回業務主管審核
3. **訂單進入「製作中」或已建立任一出貨單後**停止自動同步，訂單保留製作前的客戶值並顯示變更提示
4. **已開發票的訂單**保留發票買受人開立當時快照，不被廠客模組異動覆寫；新開發票才用新值
5. 客戶資料同步至訂單顯示時於訂單活動紀錄記載「客戶資料同步：欄位 X 由 A 變更為 B」

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單聯絡人」L1762+
- 原 Notion User Story DB `US-ORD-012`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單聯絡人關聯模式
- 補「已開發票快照」邊界（會計法規要求發票客戶資料不可被後續異動覆寫）
- 邊界：廠客模組本身的客戶資料維護不在本卡範疇

### 第二輪（2026-06-03，依 archived change 2026-06-01-align-business-consultation-coverage-gaps 對齊）

- 對齊 § Requirement「訂單客戶資料關聯帶出」最新行為
- 補入原卡缺漏的**製作中 / 出貨單鎖定點**：訂單進入「製作中」或已建立任一出貨單後停止自動同步，保留製作前值並顯示變更提示，新建訂單用新值（業務流程 step 4、成功條件 3）
- 補「同步動作不觸發回業務主管審核」與「同步寫入訂單活動紀錄」兩條成功條件
- 發票快照範圍明確化為買受人名稱 / 統編 / 地址，並補「新開發票用新值」
- 「靜態快照」措辭改為「寫死快照」對齊 spec 用語
