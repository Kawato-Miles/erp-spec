---
type: open-question
module:
  - 售後服務
  - 訂單管理
oq-id: AFT-3
status: open
priority: low
audience: internal
raised-at: 2026-05-20
raised-by: senior-pm (前期介入)
source-link: openspec/changes/archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/售後服務]]
  - [[../05-entities/訂單]]
related-oq:
  - ORD-002
related-change: refine-after-sales-refund-and-add-supplementary-print
related-insight:
  - 2026-05-20-售後ticket-reactive-補丁循環
expected-resolution-at: 2026-Q3
---

# AFT-3：OA 已核可後業務改金額是否需主動通知主管

## 背景

本 change（`refine-after-sales-refund-and-add-supplementary-print`）將 OrderAdjustment 編輯閘門放寬到「已核可（未執行）」也可改金額不重審。Miles 決策：純信任 + 對照欄位 + audit log 三層構成半透明監督（不加 ×110% 閾值閘門，留 ORD-002）。

senior-pm 前期介入時指出：純信任 + 對照欄位是「被動監督」（主管要主動打開訂單頁才看到調整），不是業界主流做法。業界（如 Ordway）主流是「金額閾值加審」或「主動推播通知主管」。

## 問題

OA 已核可後業務修改金額（不重審），系統是否要主動推播通知主管？

候選做法：

1. **不通知**（目前設計）：主管被動打開訂單頁的異動清單才看到對照欄位
2. **Slack / email 推播**：每次業務改金額觸發推播給主管
3. **每日異動摘要**：每天彙整給主管所有業務在已核可狀態下的金額調整
4. **超過閾值才推播**：例如異動 ≥ 核可金額 × 10% 才推播（與 ORD-002 結合）

## 影響範圍

- 不影響本 change 主流程（已決定純信任 + audit log）
- 影響主管管理體驗（資訊負荷 vs 監督敏感度）
- 影響業務操作體驗（被推播 = 心理壓力）

## 待釐清

- 業務在已核可狀態實際會改金額的頻率（待 UAT 後實證）
- 主管管理 N 個業務時，N 個推播是否造成干擾
- 是否與 ORD-002 閾值閘門合併設計（閾值內不通知、超過閾值才通知 + 強制重審）

## 來源

- senior-pm 前期介入 第 4 段風險 A
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § 決策 1 + OQ-1
