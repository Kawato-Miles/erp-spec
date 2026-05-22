---
type: user-story
us-id: US-AR-010
module:
  - prepress-review
  - order-management
role:
  - "B2C 會員（外部使用者）"  # AR-1 已解答（選 C：B2C 會員不入 ERP role 體系），role 採純文字而非 wiki link
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: B2C 會員補件"
  - "openspec/specs/prepress-review/spec.md#Requirement: 補件回原審稿人員"
  - "[[04-business-logic/稿件管理規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
  - "[[05-entities/訂單]]"
related-oq:
  - "[[AR-1-B2C會員是否納入正式角色]]"
  - "[[AR-11-補件停滯處理機制與輪次上限]]"
related-test-cases: []
---

# US-AR-010 B2C 會員補件流程

## 業務情境（穩定層）

### 作為
B2C 會員（外部使用者）

> AR-1 已解答（[[AR-1-B2C會員是否納入正式角色]]，2026-05-21 選 C）：B2C 會員不入 ERP role 體系，採純文字標記。

### 我希望
能在 EC 會員中心查看退件原因並重新上傳稿件補件

### 以便
B2C 訂單補件不需業務轉傳檔案介入，降低業務處理負擔並維持補件時效

### 前置條件
- B2C 訂單印件審稿不合格
- B2C 會員已收到退件通知

### 業務流程

1. B2C 會員登入 EC 會員中心，查看訂單印件狀態為「待補件」
2. 系統顯示歷史輪次清單（最新在上），含每輪：輪次序號 / 結果 / 退件原因分類 / 審稿備註 / 時間
3. 會員依最新一輪審稿意見修正稿件後重新上傳
4. EC 系統呼叫 ERP 介面回寫新稿件（檔案先暫存於印件層，於審稿員下次送審時與新的審稿輪次綁定）
5. 系統將印件狀態轉為「已補件」，並記錄狀態轉移於印件活動紀錄供稽核
6. 後續審稿員側流程詳見 [[US-AR-007-執行印件審稿]]；原審稿員不在崗時改由審稿主管覆寫指派（[[US-AR-004-覆寫印件分派]]）
7. 業務於 ERP 訂單詳情可同步看到補件完成狀態（時間、檔案）

> **補件停滯處理 / 棄單處理 / 輪次上限**：待 [[AR-11-補件停滯處理機制與輪次上限]] 解答後補入。

### 成功條件

1. B2C 會員可在 EC 會員中心查看歷史輪次清單（最新在上，含輪次序號 / 結果 / 退件原因分類 / 審稿備註 / 時間）
2. B2C 會員可在 EC 會員中心上傳新稿件完成補件
3. EC 上傳後 ERP 端同步收到該稿件並暫存待綁定（跨系統介面契約）
4. 補件完成後印件狀態自動轉為「已補件」，記錄狀態轉移於活動紀錄
5. 業務於 ERP 訂單詳情可見補件完成狀態（時間 / 檔案）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：EC 會員中心對應檔案（待 Prototype 定案後補；ERP 端 sens-erp-prototype/src/components/order/） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5：
  - § Requirement「B2C 會員補件」L270-294（EC 重新上傳 / 歷史審稿備註清單 / 不再顯示 client_note）
  - § Requirement「補件回原審稿人員」L326-345
  - § ReviewRound L272 + L281 跨系統介面契約（EC→ERP）+ round_id NULL 暫存綁定
- [[04-business-logic/稿件管理規則]]
- 原 Notion User Story DB `US-AR-010`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 8.2/10，識別 4 gap；senior-pm INVEST 5 PASS / 1 FAIL Small，4 問題 + 5 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「我希望」53 字超 30 字 | senior-pm 問題 1（high）| 已採納：縮為 22 字「能在 EC 會員中心查看退件原因並重新上傳稿件補件」 |
| 補「跨系統介面契約」EC↔ERP（spec L272 + L281）| erp-consultant G1（medium）| 已採納：業務流程 step 4 + 成功條件 3 |
| 補歷史 review_note 清單細粒度（spec L288：輪次序號 / 結果 / 退件原因分類 / 審稿備註 / 時間）| erp-consultant G2（medium）| 已採納：業務流程 step 2 + 成功條件 1 |
| 補「原審稿員不在崗主管覆寫」（spec L338-343）| erp-consultant G3（low）| 已採納：業務流程 step 6 引 [[US-AR-004]] + [[07-scenarios#情境 6]] |
| frontmatter related-oq 補 AR-1（已 answered 保留 traceability）| erp-consultant G4（low）| 已採納 |
| 補「狀態轉移寫入 ActivityLog 稽核」（spec L347-358）| erp-consultant 段 4 設計模式「稽核鉤子」| 已採納：業務流程 step 5 + 成功條件 4 |
| 成功條件 3「自動回到原審稿員待審列表」屬下游連鎖反應 | senior-pm 問題 3 + 跨卡邊界 | 已採納：移除下游連鎖措辭，改 wiki link 引 [[US-AR-007]] |
| 補件停滯處理 / 棄單機制 / 輪次上限 | senior-pm 痛點 3 / 4 | 已採納：合併開 OQ [[AR-11-補件停滯處理機制與輪次上限]] |
| 「以便」量化 | senior-pm 問題 2（medium）| **部分採納**：以便量化「降低業務介入」屬下游 KPI，本卡保持業務價值描述 |
| 稿件規格指引（B2C 不懂出血 / CMYK）| senior-pm 痛點 1 | **未採納為強制**：屬 EC UI 內嵌設計（mode B 處理），不在本 US 業務情境段 |
| 退件原因翻譯（客戶語言版）| senior-pm 痛點 2 | **未採納為強制**：屬 EC UI / 內容設計，現階段保持「呈現審稿員填寫的審稿備註」原樣 |
| role 純文字 vs US-AR-009 wiki link 不一致 | senior-pm 問題 4（low）| **已說明**：AR-1 拍板 C 方案（B2C 不入 ERP role 體系），純文字標記為一致性例外（wiki-schema § 維度 13 Lint 例外） |
