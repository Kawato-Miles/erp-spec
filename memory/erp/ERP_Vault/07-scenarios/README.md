---
type: scenario
module:
  - cross-module
related-spec: openspec/specs/business-scenarios/spec.md
related-notion: https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05
status: active
last-reviewed: 2026-05-19
---

# 跨模組業務情境（總覽）

> 13 個端到端情境，驗證 ERP 全流程跨模組狀態一致性。**OpenSpec spec 為情境細節正本**（business-scenarios spec.md，706 行），本卡為 Vault 索引。

## 13 個情境清單

| # | 情境名 | 涉及主要模組 | 涉及主要實體 | OpenSpec 行 |
|---|--------|-------------|-------------|-------------|
| 1 | [[#情境 1：全流程驗證\|全流程驗證]] | quote / order / work-order / production-task / qc / shipping | 需求單 → 訂單 → 工單 → 生產任務 → QC → 出貨單 | L12 |
| 2 | [[#情境 2：打樣決策流程\|打樣決策流程]] | work-order / prepress-review | 工單（打樣 vs 大貨）、印件 | L77 |
| 3 | [[#情境 3：製程審核與工單收回\|製程審核與工單收回]] | work-order | 工單（草稿 ↔ 製程確認中 ↔ 製程審核完成）| L123 |
| 4 | [[#情境 4：工單異動與任務層級管理\|工單異動與任務層級管理]] | work-order / production-task | 工單、任務、生產任務（異動路徑）| L188 |
| 5 | [[#情境 5：QC 與出貨\|QC 與出貨]] | qc / order / shipping | QC、入庫、出貨單 | L280 |
| 6 | [[#情境 6：同印件補件後再審\|同印件補件後再審]] | prepress-review | 印件、ReviewRound（補件迴圈）| L334 |
| 7 | [[#情境 7：兩帳務公司多期付款與發票合併\|兩帳務公司多期付款與發票合併]] | order / quote-request | 訂單、Payment、Invoice、PaymentPlan | L390 |
| 8 | [[#情境 8：訂單異動加印追加 + 折讓退款\|訂單異動加印追加 + 折讓退款]] | order / after-sales-ticket | OrderAdjustment、Invoice、SalesAllowance | L436 |
| 9 | [[#情境 9：作廢發票後重新開立（改買受人）\|作廢發票後重新開立]] | order | Invoice（作廢 → 重開）| L489 |
| 10 | [[#情境 10：已完成訂單售後服務\|已完成訂單售後服務]] | after-sales-ticket / order | AfterSalesTicket、OrderAdjustment、PrintItem | L522 |
| 11 | [[#情境 11：售後事件「不處理」結局\|售後不處理]] | after-sales-ticket | AfterSalesTicket（responsibility / resolution）| L588 |
| 12 | [[#情境 12：售後事件「補印免費」\|售後補印免費]] | after-sales-ticket / work-order | AfterSalesTicket + 補印 PrintItem（公司認賠）| L618 |
| 13 | [[#情境 13：售後事件「補印收費」\|售後補印收費]] | after-sales-ticket / order | AfterSalesTicket + 補印 PrintItem + OrderAdjustment（補收）| L660 |
| 14 | [[#情境 14：審稿流程端到端（單模組跨角色）\|審稿流程端到端]] | prepress-review | 印件、ReviewRound、ActivityLog（業務 / 審稿主管 / 系統 / 審稿員 / 補件方 5 角色）| — |

## 情境 1：全流程驗證

- **核心驗證**：訂單從建立 → 出貨完成的完整狀態鏈
- **跨層級**：訂單 → [[印件]] → [[工單]] → [[任務]] → [[生產任務]] → [[QC]] → [[出貨單]]
- **狀態向上推進測試**：[[齊套邏輯]] 觸發各層狀態轉移

## 情境 2：打樣決策流程

- **核心驗證**：[[打樣流程]] OK / NG 分支
- **3 個分支**：OK / NG（製程問題）/ NG（稿件問題）

## 情境 3：製程審核與工單收回

- **核心驗證**：[[工單狀態]] 製程確認中 ↔ 重新確認製程 ↔ 草稿（收回）
- **角色**：[[印務]] 填寫送審、[[印務主管]] 審核 / 退回

## 情境 4：工單異動與任務層級管理

- **核心驗證**：工單異動 bubble-up 至[[工單狀態]]、向下傳遞至[[任務狀態]]
- **特殊路徑**：異動 → 已確認異動內容 → 製作中

## 情境 5：QC 與出貨

- **核心驗證**：[[QC]] 通過驅動入庫 → [[出貨單]] 出貨上限 = min(各工單入庫)
- **數量規則**：[[齊套邏輯]] § 三、情境 3

## 情境 6：同印件補件後再審

- **核心驗證**：[[印件狀態]] 審稿維度 不合格 → 已補件 → 再審 → 合格 / 不合格
- **多輪 ReviewRound**：歷史保留、`current_round_id` 指最新（見 [[稿件管理規則]]）

## 情境 7：兩帳務公司多期付款與發票合併

- **核心驗證**：訂單對應兩帳務公司、PaymentPlan 多期、Invoice N:M
- **詳見**：[[付款發票邏輯]] § F1-F8

## 情境 8：訂單異動加印追加 + 折讓退款

- **核心驗證**：OrderAdjustment（phase=during_order）+ 折讓單 + 退款 Payment
- **詳見**：[[付款發票邏輯]] § C4、A2、A3

## 情境 9：作廢發票後重新開立（改買受人）

- **核心驗證**：Invoice 作廢 → 重開（字軌不重用、流水號 +1）
- **詳見**：[[付款發票邏輯]] § F4、F7

## 情境 10：已完成訂單售後服務（AfterSalesTicket 路徑）

- **核心驗證**：訂單已完成後走 [[售後服務]] 容器，取代 OrderAdjustment(phase=after_completion) 雙重身份
- **下游動作**：0..N OrderAdjustment + 0..N 補印 PrintItem

## 情境 11：售後不處理

- **核心驗證**：ticket resolution=不處理，無下游動作，訂單應收 / 發票不變

## 情境 12：售後補印免費（公司認賠）

- **核心驗證**：responsibility=公司認賠、resolution=補印
- **行為**：建補印 PrintItem，**不建 OrderAdjustment**（amount=0 不屬金額變動）

## 情境 13：售後補印收費（客戶承擔）

- **核心驗證**：responsibility=客戶承擔 或 共同分擔、resolution=補印 或 退款+補印
- **行為**：建補印 PrintItem + 關聯 OrderAdjustment(adjustment_type=補退)，業務主管核可仍存在

## 情境 14：審稿流程端到端（單模組跨角色）

> **2026-05-22 新增**：本情境取代原 [[13-user-stories/prepress-review/US-AR-001-審核稿件|US-AR-001 anchor]]（已移除）；對應 user-story-spec § 五「禁 anchor」紀律。07-scenarios 範圍 2026-05-22 擴展為「跨模組或跨角色的端到端流程」（不限跨模組），本情境屬「單模組（prepress-review）跨多角色」的端到端串接示範。

- **核心驗證**：審稿模組從業務填難易度到合格終態的完整循環，涉及 5 角色多動作串接
- **涉及角色**：[[03-roles/業務]] + [[03-roles/審稿主管]] + 系統（自動分派 / ActivityLog）+ [[03-roles/審稿]] + 補件方（業務 / B2C 會員）
- **流程串接**：
  1. **業務填難易度**（[[13-user-stories/prepress-review/US-AR-002-設定印件難易度與免審稿|US-AR-002]]）：業務於需求單標註難易度與是否免審稿
  2. **審稿主管維護能力等級**（[[13-user-stories/prepress-review/US-AR-003-維護審稿人員能力等級|US-AR-003]]）+ **異常覆寫**（[[13-user-stories/prepress-review/US-AR-004-覆寫印件分派|US-AR-004]]）
  3. **系統自動分派**：依「能力最接近難易度 → 進行中負擔最少」挑選審稿員；候選集為空時破例派工（待 [[AR-10-主管覆寫分派是否允許破例派工]] 解答）
  4. **審稿員執行審稿**（[[13-user-stories/prepress-review/US-AR-007-執行印件審稿|US-AR-007]]）：合格 / 不合格判定 + 10 項退件原因分類
  5. **補件迴圈**：[[13-user-stories/prepress-review/US-AR-009-B2B業務代客戶補件|US-AR-009]] B2B / [[13-user-stories/prepress-review/US-AR-010-B2C會員補件流程|US-AR-010]] B2C；原審稿員不在崗主管覆寫（[[US-AR-004]]）
  6. **合格終態** → 印件審稿終止進入製程審核；後續內容變更須棄用 + 建新印件（情境 6 路徑）
  7. **並行監控**（貫穿步驟 3-6，審稿主管）：[[13-user-stories/prepress-review/US-AR-005-監控當日審稿工作量|US-AR-005]] 監控當日 + [[13-user-stories/prepress-review/US-AR-006-比對審稿人員績效|US-AR-006]] 績效比對 + [[13-user-stories/prepress-review/US-AR-008-追蹤部門審稿完成紀錄|US-AR-008]] 對帳追溯
- **特殊路徑**：免審稿（[[US-AR-002]] 標記）→ 系統建合格輪次 → 跳至步驟 6
- **跨階段重新進入**：合格後若打樣不合格且根因為稿件問題 → [[13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件|US-AR-011]]（與步驟 5 補件迴圈業務本質不同：本情境是「同週期內補件」、US-AR-011 是「跨階段重新進入新審稿週期」）

## 涉及角色（跨情境）

幾乎涉及 [[03-roles/_alignment-report|全部 16 角色]]，主要驅動者：

- [[業務]] / [[諮詢]]：建單、報價、補單、處理售後
- [[印務主管]] / [[印務]]：建工單、製程審核
- [[審稿]] / [[審稿主管]]：審稿
- [[生管]] / [[師傅]]：派工 / 執行
- [[QC]] / [[出貨]]：品檢 / 出貨

## 用於產生 Test Case

每個情境衍生 → Notion ERP Test Case DB。詳見 [memory/erp/payment-invoice-scenarios.md § 使用本文件產生 User Story / Test Case 的建議](../../payment-invoice-scenarios.md)。

## 來源

- OpenSpec [business-scenarios/spec.md](../../../../openspec/specs/business-scenarios/spec.md)（706 行，13 個 Requirement）
- Notion [業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05)
