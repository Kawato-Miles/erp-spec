---
type: open-question
module:
  - order-management
business-domain:
  - billing-cash
oq-id: BI-12
status: open
priority: medium
audience: internal
raised-at: 2026-05-28
raised-by: erp-planning-pre-check skill 第一輪實證
source-link: /Users/b-f-03-029/.claude/plans/prototype-effervescent-sutton.md
related-vault:
  - "[[../00-meta/business-domain-taxonomy]]"
  - "[[../00-meta/erp-planning-audit-framework]]"
related-oq: []
expected-resolution-at: 2026-06-15
---

# BI-12 款項相關 User Story 批次 backfill business-domain + related-test-cases

## 議題

第一輪 Billing & Cash 稽核已示範 backfill 5 個 User Story（US-ORD-010 / 011 / 013 / 020 / 021）。剩餘 13 個款項相關 User Story 待批次 backfill：

- US-ORD-005-訂單發票與配送資訊編輯（發票部分屬 billing-cash，cross-domain）
- US-ORD-012-線下單客戶資料關聯帶出（cross-domain）
- US-ORD-022-業務拆期保留稽核軌跡
- US-ORD-023-業務登錄收款核銷分配
- US-ORD-024-會計匯出14欄對帳CSV
- US-ORD-025-業務查看期次原始vs現況對照
- US-ORD-026-業務建補收OA免主管核可直接執行
- US-ORD-027-業務主管核可退款訂單異動
- US-ORD-028-業務查看溢收預收未分配
- US-ORD-029-會計收到月結差錯訂單警示
- US-ORD-030-F1預開發票拆票實作金額調整退款
- US-ORD-031-期次規劃invariant警示與大額補收紅標
- US-ORD-032-製作後印件規格異動通知印務（cross-domain）

## 處理方式

待後續批次執行：

1. 逐卡 backfill `business-domain` frontmatter 欄位（billing-cash / cross-domain 依議題判斷）
2. 補 `related-test-cases` 欄位（從 Notion ERP Test Case DB 配對，若無對應 Test Case 標子 OQ）
3. 完成後追加到 audit-log.md

## 來源稽核軸

- 軸 1 領域：Billing & Cash
- 軸 2 卡類型：User Story
- 反模式類型：N/A（不是反模式，是工作量延伸）

## 相關紀錄

- 第一輪實證示範卡：US-ORD-010 / 011 / 013 / 020 / 021（已 backfill）
- 跨層影響：本批 backfill 完成後需同步檢查對應 Test Case 反向連結（解 0/56 → 18/56 缺漏問題）
