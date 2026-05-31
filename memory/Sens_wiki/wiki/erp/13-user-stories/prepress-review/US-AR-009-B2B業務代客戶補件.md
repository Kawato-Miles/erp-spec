---
type: user-story
us-id: US-AR-009
module:
  - prepress-review
  - order-management
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: B2B 業務補件"
  - "openspec/specs/prepress-review/spec.md#Requirement: 補件回原審稿人員"
  - "[[稿件管理規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[wiki/erp/07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[稿件管理規則]]"
related-entities:
  - "[[印件]]"
  - "[[訂單]]"
related-oq:
  - "[[AR-11-補件停滯處理機制與輪次上限]]"
related-test-cases: []
prerequisites:
  - "[[US-AR-007-執行印件審稿]]：審稿員提交不合格判定"
  - 業務已收到退件通知
---

# US-AR-009 B2B 業務代客戶補件

## 業務情境

### 作為
[[業務]]

### 我希望
在訂單詳情完成印件補件（含上傳新稿與補件說明）

### 以便
補件全程留稽核紀錄，取代過去散落在即時通訊軟體的傳檔；補件說明傳達修改重點，審稿員重審時不需再向業務追問

### 前置條件
- 訂單印件審稿不合格
- 業務已收到退件通知
- 業務僅能檢視訂單層級資料，不可檢視工單與生產任務（依業務角色權限邊界）

### 業務流程

1. 業務收到退件通知後，查看該印件的審稿不合格原因（10 項分類）與審稿備註
2. 業務判斷該印件是否繼續走補件流程；若客戶決定取消該印件，改走訂單異動流程（不在本 user story 範疇）
3. 業務與客戶聯繫，取得修改後的新稿件（聯繫過程在系統外）
4. 業務上傳新稿件至訂單對應印件；新稿件先暫存於印件層，於審稿員下次送審時與新的審稿輪次綁定
5. 業務（選填）填寫補件說明，描述本次修改重點
6. 業務送出補件，系統將印件狀態轉為「已補件」，並記錄補件動作於印件活動紀錄（操作業務 / 補件時間 / 上傳檔案）
7. 後續審稿員側流程詳見 [[US-AR-007-執行印件審稿]]；原審稿員不在崗時改由審稿主管覆寫指派（[[US-AR-004-覆寫印件分派]]）

> **補件停滯處理 / 輪次上限**：待 [[AR-11-補件停滯處理機制與輪次上限]] 解答後補入；目前無上限機制。

### 成功條件

1. 業務可在訂單詳情看到印件的退件原因（10 項分類）與審稿備註
2. 業務可在訂單詳情直接上傳新稿件完成補件，並選填補件說明
3. 補件完成後印件狀態自動轉為「已補件」
4. 補件動作留印件活動紀錄（操作業務 / 補件時間 / 上傳檔案），訂單詳情可回查
5. 業務僅能檢視訂單層級資料；既存稿件備註若需修改須至印件編輯介面執行，觸發活動紀錄稽核事件

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5：
  - § Requirement「B2B 業務補件」L298-324（業務於訂單詳情頁補件 / 不再顯示 client_note 編輯欄位）
  - § Requirement「補件回原審稿人員」L326-345（原審稿員不在崗主管覆寫）
  - § ReviewRound L281 補件檔案 round_id NULL 暫存綁定機制
- [[稿件管理規則]]：client_note 不可在補件階段更新
- 原 Notion User Story DB `US-AR-009`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 B，識別 5 gap；senior-pm INVEST 5 PASS / 1 FAIL Small，7 問題 + 6 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「我希望」48 字 + 三動作 | senior-pm P1（high）| 已採納：縮為 19 字「在訂單詳情完成印件補件（含上傳新稿與補件說明）」 |
| 補「原審稿員不在崗主管覆寫」分支（spec L338-343）| erp-consultant G1（high）| 已採納：業務流程 step 7 引 [[US-AR-004]] + [[07-scenarios#情境 6]] |
| 補「業務權限邊界」前置條件（不可檢視工單與生產任務）| erp-consultant G2（high）| 已採納：前置條件 + 成功條件 5 |
| 補「補件檔案 round_id NULL 暫存」（spec L281）| erp-consultant G4（medium）| 已採納：業務流程 step 4 簡述 |
| 補「修正既存 client_note 須觸發 ActivityLog」（spec L302 + L322）| erp-consultant G3（medium）| 已採納：成功條件 5 末段 |
| 業務流程 / 成功條件含下游連鎖反應 | senior-pm P3 / P4（high）| 已採納：移除「自動回送原審稿員待審清單」措辭，改 wiki link 引 [[US-AR-007]] |
| 補業務「決定是否補件」決策節點 | senior-pm P5（medium）| 已採納：業務流程 step 2 補「若客戶決定取消改走訂單異動」 |
| 補「補件動作稽核紀錄」成功條件 | senior-pm P7（medium）| 已採納：成功條件 4 |
| 補件次數上限 / 客戶不回應 / 補件延誤 | senior-pm 痛點 1-3 | 已採納：合併開 OQ [[AR-11-補件停滯處理機制與輪次上限]] |
| 「以便」量化 | senior-pm P2（medium）| **部分採納**：拆兩條業務價值（稽核 + 補件說明），量化基準（自助率）屬下游 KPI |
| B2C 補件業務代操作介入條件 | senior-pm 痛點 4 | **暫不開 OQ**：屬 US-AR-010 範疇衍生問題，併入 AR-11 場景討論 |
| 業務代補件需否客戶最終確認 | senior-pm 痛點 5 | **暫不開 OQ**：屬 B2B 業務 SOP 議題，不屬系統設計範疇 |
| 技術性退件對業務 UI 提示 | senior-pm 痛點 6 | **不採納**：屬 UI 層議題，由 Prototype 階段（mode B）處理 |
