---
type: open-question
module:
  - 售後服務
oq-id: AFT-2
status: open
priority: medium
audience: internal
raised-at: 2026-05-19
raised-by: Miles
notion-link:
expected-resolution-at: 2026-Q3
related-change: add-my-after-sales-action-page-and-remove-owner-transfer
related-insight:
  - 2026-05-20-售後ticket-reactive-補丁循環
---

# AFT-2：「逾期」是否分 7 / 14 / 30 三級

## 背景

`add-my-after-sales-action-page-and-remove-owner-transfer` change 新增「我的售後服務」作業頁，頂端待辦摘要含「逾期」分組（紅色徽章）。目前 MVP 沿用既有 spec 的單一閾值 `DEFAULT_RED_LIGHT_DAYS = 7 天`，超過 7 天即標紅。

## 問題

是否該分級「逾期」？

候選做法：

1. **單一閾值（MVP 採用）**：opened_at > 7 天即「逾期」，紅色徽章
2. **三級分級**：7 天黃燈（注意）/ 14 天橘燈（警告）/ 30 天紅燈（嚴重逾期）
3. **依 case_category 分閾值**：印件瑕疵類 3 天逾期、規格不符類 7 天逾期、其他類 14 天逾期

## 影響範圍

- UI：待辦摘要數字卡、卡片徽章顯示
- selector：`selectMyAfterSalesSummary` / 卡片排序邏輯
- 不影響 schema（閾值為前端常數）

## 待釐清

- 業務 / 諮詢實際使用後的反饋（會不會紅燈太多失去意義）
- 客戶端 SLA 期望（是否有「N 天內必須回應」的書面協議）
- 不同 case_category 的緊急程度差異（瑕疵類是否真的比物流類更急）
- 業界 ticket 系統的分級設計慣例（Zendesk / Freshdesk 的 SLA policy）

## 來源

- change `add-my-after-sales-action-page-and-remove-owner-transfer` plan § 5 個待 propose 階段細決議項目
- 既有 spec：[after-sales-ticket spec § 訂單列表售後狀態欄位與篩選器](../../../../openspec/specs/after-sales-ticket/spec.md)（DEFAULT_RED_LIGHT_DAYS = 7）
- 業界對照：客服 ticket 系統普遍採 SLA 分級
