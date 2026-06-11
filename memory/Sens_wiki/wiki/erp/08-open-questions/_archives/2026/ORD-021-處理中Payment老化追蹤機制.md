---
type: open-question
module:
  - 訂單管理
oq-id: ORD-021
status: answered
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: Miles + senior-pm 前期介入
answered-at: 2026-05-26
answered-by: Miles
source-link: openspec/changes/archive/2026-05-26-complete-payment-status-ui-and-followups/design.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
  - [[ORD-022-Payment-csv匯出機制]]
related-change: complete-payment-status-ui-and-followups
expected-resolution-at: 2026-05-26
---

# ORD-021：處理中 Payment 老化追蹤機制

## 背景

add-payment-status-and-decouple-oa-execution change 引入 paymentStatus（處理中 / 已完成）讓業務可「先填一半、陸續補齊資料」。但若業務嫌麻煩規避（建了「處理中」就忘了回來切「已完成」），會造成：

- 對帳長期掛帳、OA 永遠不推進已執行
- 比現狀（建立即完成）更糟，因為現狀至少 OA 會立即推進

senior-pm 前期介入指出此「業務嫌麻煩規避」風險，但 plan 與 change 範圍不含老化追蹤機制（留 follow-up）。

## 問題

處理中 Payment 超過 X 天未切「已完成」時，系統應如何提醒？

候選做法：

1. **被動列表標示**：列表頁標示「處理中 N 天」（如 N > 7 變紅、N > 14 變更醒目）
2. **主管看板可見度**：業務主管打開訂單列表時看到「處理中 Payment 超過 X 天清單」（看板形式）
3. **主動推播提醒**：Slack 通知對應業務或主管「Payment-XXX 處理中已 N 天，請補齊資料或取消」
4. **以上組合**：被動列表標示 + 主管看板 + Slack 通知

## 待釐清

- 老化閾值 X 的合理值（業務真實處理金流的合理時程）
- 不同 paymentMethod 是否有不同閾值（如：銀行轉帳 vs 信用卡 vs 退款）
- 主管角色定義（業務主管 / 印務主管 / 會計）對「處理中老化」的關注度
- 是否需要與訂單其他「未完成項目」清單（出貨待出、印件待補件等）合併到統一的「待辦事項」儀表板

## 影響範圍

- 影響業務日常操作（被動列表 vs 主動推播差異大）
- 影響主管工作量（是否要每天看處理中清單）
- 影響「老化率」KPI 監測（design.md § 成功指標）

## 來源

- senior-pm agent 前期介入指出「業務嫌麻煩規避」風險（2026-05-21）
- change `add-payment-status-and-decouple-oa-execution` design.md § Risks 1 + § Open Questions OQ 1

## 答覆

### 2026-05-26 收斂兩階段決策

**第一階段（complete-payment-status-ui-and-followups change，2026-05-26 上午歸檔）**：

- 採候選做法 1 + 2 組合：「被動列表標示 + 主管看板可見度」
- 老化閾值固定 7 天（對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期）
- 不分 paymentMethod、單一閾值
- 訂單詳情頁 row 顯示 amber Badge「老化 N 天」
- 業務主管 sidebar「老化處理中 Payment」清單頁入口（業務主管 / 諮詢主管 / supervisor role 可見）
- 跨訂單聚合 selector `getAgingPendingPayments` 提供清單頁資料

**第二階段（remove-aging-payment-supervisor-dashboard change，2026-05-26 下午歸檔）**：

- 主管看板入口移除 — Miles 評估後決定收回「主管看板」這條：跨訂單聚合的「老化清單頁」在 ERP 系統內維護成本與 Excel 匯出後篩選的彈性不對等；業務主管更習慣用 Excel 對 Payment row data 做臨機篩選、排序、樞紐分析，系統內固定欄位的清單頁反而限制彈性
- 改採 csv 匯出方式進行（csv 匯出機制另議，見 [[ORD-022-Payment-csv匯出機制]]）
- row Badge「老化 N 天」保留：訂單層級的單訂單內提示仍有價值（業務看訂單時不需離開頁面就知道有 Payment 老化），保留
- 拆除細項：AgingPaymentsPage.tsx、sidebar「老化處理中 Payment」navLink、useErpStore.getAgingPendingPayments selector

### 最終決策摘要

- **保留**：row Badge「老化 N 天」（單訂單內、業務焦點對齊）+ 7 天閾值 + 判定條件（處理中 + 未取消 + > 7 天）
- **拆除**：主管看板 sidebar 入口 + 清單頁 + 跨訂單聚合 selector
- **替代**：csv 匯出後 Excel 篩選（機制另議於 ORD-022）
- **失敗判定指標**：KPI「處理中 Payment 老化率」UAT 累積數據後 > 20% → 機制失敗、需重新設計（指標保留於 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)）

### 相關 change

- `2026-05-22-add-payment-status-and-decouple-oa-execution`（引入 paymentStatus 雙態、留下 OQ）
- `2026-05-26-complete-payment-status-ui-and-followups`（雙層提示機制初版）
- `2026-05-26-remove-aging-payment-supervisor-dashboard`（拆主管看板）
