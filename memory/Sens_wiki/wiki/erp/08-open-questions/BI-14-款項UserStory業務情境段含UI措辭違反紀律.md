---
type: open-question
module:
  - order-management
business-domain:
  - billing-cash
oq-id: BI-14
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: erp-planning-pre-check skill 第一輪實證（backfill 時識別）
source-link: /Users/b-f-03-029/.claude/plans/prototype-effervescent-sutton.md
related-vault:
  - "[[audit-failure-patterns]]"
  - "[[user-story-spec]]"
related-oq:
  - BI-12
expected-resolution-at: 2026-06-15
---

# BI-14 款項 User Story 業務情境段含 UI 措辭違反紀律（8 張）

## 議題

2026-05-28 backfill business-domain 時識別到 8 張款項相關 User Story 的「業務情境（穩定層）」段含 UI 措辭，違反 erp-user-story skill 紀律（業務情境穩定層禁含 UI 措辭，UI 措辭應限於「UI 操作（易變層）」H2）。對應 [[wiki-schema]] 維度 13 Error 條件。

## 違規卡清單

| 卡 | 違規 UI 措辭 |
|----|------------|
| US-ORD-022-業務拆期保留稽核軌跡 | 「拆此期按鈕」「Dialog」 |
| US-ORD-024-會計匯出14欄對帳CSV | 「匯出 CSV 按鈕」「預覽」 |
| US-ORD-025-業務查看期次原始vs現況對照 | 「對照顯示」「視覺差異」「紅色標記」 |
| US-ORD-026-業務建補收OA免主管核可直接執行 | 「直接執行按鈕」「emerald 提示橫幅」「amber 警示」 |
| US-ORD-027-業務主管核可退款訂單異動 | 「待主管審核列表」「Dialog」「sky 提示橫幅」 |
| US-ORD-028-業務查看溢收預收未分配 | 「badge 標示」「對帳 UI」 |
| US-ORD-031-期次規劃invariant警示與大額補收紅標 | 「警示橫幅」「amber 警示」「BellRing」 |
| US-ORD-032-製作後印件規格異動通知印務 | 「Side Panel」「Info Banner」「Toast」「disabled」 |

## 根因

這 8 張卡多為 2026-05-28 unify-billing-installment change + relax-order-detail change 隨附建立（US-ORD-020~032）。建立時把 UI 細節寫進業務情境段，未遵守「業務情境穩定層 / UI 操作易變層」兩階段分離紀律。對應 [[audit-failure-patterns]] 反模式 **Scope creep**（UI 易變層內容漂移進穩定層）。

## 處理方式（待批次）

依 Miles 拍板「標 OQ 批次處理」：

1. 逐卡把業務情境段內的 UI 措辭移到 H2「UI 操作（易變層）」段（stage=ui-bound 的卡）
2. stage=business-only 的卡：UI 措辭直接刪除（業務情境段保持純業務動作）
3. 重寫後跑 vault-audit 維度 13 lint 確認通過
4. 完成後追加 audit-log

## 處理優先順序

- 屬「卡內容修補」非「結構缺漏」，可在後續批次處理
- 與 [[BI-12]]（related-test-cases 配對）可同批處理

## 來源稽核軸

- 軸 1 領域：Billing & Cash（7 張）+ Order Management（US-ORD-032）
- 軸 2 卡類型：User Story
- 反模式類型：Scope creep（UI 易變層漂移進業務穩定層）

## 相關紀錄

- 識別於：2026-05-28 Billing & Cash 第一輪稽核 backfill 階段
- audit-failure-patterns 反模式：Scope creep
- erp-user-story skill 紀律：業務情境段禁 UI 措辭
