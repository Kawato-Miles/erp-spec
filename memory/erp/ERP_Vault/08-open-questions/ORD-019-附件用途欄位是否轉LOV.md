---
type: open-question
module:
  - order-management
oq-id: ORD-019
status: open
priority: low
audience: internal
raised-at: 2026-05-28
raised-by: erp-consultant (Phase 3 設計挑戰) + senior-pm (Phase 4 收斂)
source-link: openspec/changes/relax-order-detail-edit-conditions/design.md § D4
related-vault:
  - "[[../05-entities/訂單]]"
related-oq: []
related-change: relax-order-detail-edit-conditions
expected-resolution-at: 2026-Q4
---

# ORD-019：OrderAttachment.purposeNote 上線前驗證是否轉 LOV

## 背景

`relax-order-detail-edit-conditions` change 新增 `OrderAttachment` 實體承載訂單其他附件（合約 / 規格說明 / 客戶聲明 / 補充說明等）。

議題 2 拍板採方案 A：「統一一個附件清單 + 上傳時填用途 free-text」，不分桶（不採合約 / 規格說明 / 聲明 / 其他四桶分類）。理由：Prototype 階段優先驗證上傳功能本身被使用的頻率，分類功能待真實使用累積樣本後再決定。

但 free-text 設計違反 [[../11-review-knowledge/erp/erp-design-patterns]] § 2「狀態碼結構化（LOV + 備註）」原則 — 若上線後 purposeNote 樣本分散（例：「客戶簽回」「客戶蓋章後簽回」「客戶 sign back」），會造成日後查找與分組統計困難。

## 問題

OrderAttachment.purposeNote 是否需上線前轉 `purposeType` enum（LOV）？

候選做法：

1. **維持 free-text**：日後不轉 LOV，業務自由填寫
   - 優點：靈活、不限制業務描述
   - 風險：樣本分散難分組，日後若要統計或自動分類需重做
2. **上線前轉 LOV**：定義 5-7 個固定選項（如「合約 / 規格說明 / 客戶聲明 / 收據 / 其他」），保留 purposeNote 作補充說明
   - 優點：分類清晰、可統計
   - 風險：LOV 選項定義錯誤需另外調整
3. **混合策略**：先 free-text 上線，累積樣本後評估
   - 已採用（本次 change）

## 等待條件 / 評估觸發點

累積 **≥ 20 筆 OrderAttachment.purposeNote 樣本後**（或上線前 1 個月，先觸發者為準），由 Miles 判定樣本群組是否能歸納為 5-7 個 LOV 選項，若可則上線前轉 LOV。

## 影響範圍

- spec § OrderAttachment Data Model：若轉 LOV 需新增 `purposeType` enum 欄位
- Prototype `OrderAttachmentUploadDialog.tsx`：textarea → Select + textarea 改為 Select + 可選備註
- 既有 purposeNote 資料需 backfill 為對應 enum（人工 / 規則分類）
- KPI 量測：若要做「附件用途分組統計」LOV 必要

## 待釐清

- prototype 試用累積 ≥ 20 筆樣本的時機點（業務實際開始上傳附件後多久能達到）
- LOV 選項是否含「諮詢相關」「售後相關」等業務情境分類（vs 純文件類型分類）
- 與既有 OrderSignedFile（回簽檔案）的 LOV 是否需對齊

## 來源

- erp-consultant Phase 3 設計挑戰 Challenge 6
- senior-pm Phase 4 收斂建議標記新 OQ
- openspec/changes/relax-order-detail-edit-conditions/design.md § D4 OrderAttachment 實體設計
