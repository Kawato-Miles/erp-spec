---
type: open-question
module:
  - order-management
oq-id: ORD-002
status: open
priority: low
audience: internal
raised-at: 2026-05-20
raised-by: senior-pm (前期介入)
source-link: openspec/changes/refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../06-state-machines/訂單狀態]]
related-oq:
  - AFT-3
related-change: refine-after-sales-refund-and-add-supplementary-print
expected-resolution-at:
---

# ORD-002：OA 已核可後是否設「金額異動 ≥ 核可金額 × X% 需重新送審」閘門

## 背景

本 change 將 OA 編輯閘門放寬到「已核可可改金額不重審」。Miles 決策：初版純信任 + 對照欄位 + audit log，不加閾值閘門。

senior-pm 前期介入指出：業界（Ordway 等 SaaS 退款管理系統）主流做法是「金額閾值加審」 — 異動超過某百分比自動降回草稿要求重審，避免業務繞過主管授權做大幅調整。

## 問題

是否要設「OA 已核可後業務修改金額 ≥ 主管核可金額 × X% 自動觸發重新送審」閘門？

候選做法：

1. **不設閾值**（目前設計，初版）
2. **設 × 110% 重審**：異動超過 10% 自動降回草稿
3. **設 × 120% 重審**：異動超過 20% 自動降回草稿
4. **設絕對金額閾值**：異動 ≥ $1000 自動降回草稿（不論百分比）
5. **雙閾值**：百分比 OR 絕對金額（取低者）

## 影響範圍

- 不影響本 change 主流程（初版不做閾值）
- 影響業務濫用風險（小幅調整 vs 大幅調整邊界）
- 影響業務操作體驗（閾值內無干擾、閾值外被強制重審）

## 待釐清

- 印刷業實務上業務調整退款金額的常見幅度（待 UAT 實證）
- X% 的合理值（10% / 20% / 其他）
- 是否考慮絕對金額閾值（小金額訂單百分比閾值無意義）
- 與 AFT-3 推播通知設計的整合方式

## 待業務濫用實證觸發條件

實證閾值：以下任一情境發生即考慮加閘門

- audit log 顯示 ≥ 3 名業務曾在已核可狀態下調整金額 ≥ 核可金額 × 110%
- 業務主管反映「不知道業務改了金額才發現對帳不平」
- 客訴 / 內部爭議涉及「業務調整金額未告知主管」≥ 1 起

## 來源

- senior-pm 前期介入 第 4 段風險 A
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § 決策 1 + OQ-2
- 業界參考：[Ordway - Automate SaaS Refunds Best Practices](https://ordwaylabs.com/resources/faqs/automate-saas-refunds-canceled-subscriptions/)
