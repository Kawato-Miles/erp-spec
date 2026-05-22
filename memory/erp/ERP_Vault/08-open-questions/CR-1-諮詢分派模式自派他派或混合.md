---
type: open-question
module:
  - consultation-request
oq-id: CR-1
status: closed
priority: high
audience: internal
raised-at: 2026-05-22
raised-by: erp-consultant-agent
resolved-at: 2026-05-22
resolved-by: Miles
source-link: US-CR-002 諮詢單批 a 雙視角審查
resolution-change: resolve-consultation-request-gaps-cr-1-cr-2
related-vault:
  - "[[13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單]]"
related-oq: []
expected-resolution-at: 2026-Q2
---

# CR-1 諮詢分派模式：自派 / 他派 / 混合

## 問題

[`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) L100 描述「**業務或值班人員**指派諮詢人員」屬「他人指派（push）」模式；但 [[13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單|US-CR-002]] 描述「**諮詢人員自行認領**」屬「自派（pull）」模式。

erp-consultant + senior-pm 雙視角同步指出此業務模式衝突。

## 影響

- spec L102-108 Scenario 只覆蓋「業務指派」單一路徑，缺對應「諮詢人員自我認領」Scenario
- US-CR-002 業務流程與 spec 不同步
- 影響後續 Prototype 設計（兩套流程並存或單一流程？）
- 影響諮詢人員 KPI 設計（是否依「主動接案數」評估？）

## 選項

| 選項 | 規則 | 業務含義 |
|------|------|---------|
| A | **單一自派**：諮詢人員自我認領，無人指派 | 諮詢人員自主接案；冷門案件可能無人接 |
| B | **單一他派**：業務 / 值班人員指派，諮詢人員被動接受 | 集中分派、避免冷門積壓；諮詢人員自主性低 |
| C | **混合模式（業界主流）**：值班預派為主 + 諮詢人員空檔自我認領為輔 | 兼具公平性與彈性；流程較複雜 |
| D | **依案件分類**：高優先 / 大客戶由業務指派、一般案件諮詢人員認領 | 重要案件確保品質、一般案件分散負載 |

業界印刷 MIS（Tharstern / Printavo）多採選項 C 或 D。

## 暫定處理

- US-CR-002 業務流程暫採「自派」模式，引此 OQ wiki link
- spec L100 暫不改，待 Miles 拍板後同步更新

## 決議（2026-05-22）

**拍板選項 A：純自派**

諮詢人員自我認領 `consultant_id`，**無業務 / 值班人員指派路徑**。

**設計理由**：
- 諮詢量規模小，不需 round-robin 自動派工兜底
- 諮詢人員依專長 + 當前負載自主決策更符合既有日常運作
- US-CR-002「以便」段已明示「沿用既有分流不需自動派工」
- 若未來發生「冷門案件無人接」現象，再開新 change 補兜底機制（暫不過度設計）

**實作範圍**：
- consultation-request spec：REMOVED「諮詢人員指派」+ ADDED「諮詢人員認領」（含 4 個 Scenarios：自我認領 / 併發衝突 / 區隔顯示 / 主管代為認領）
- consultation-request spec：MODIFIED「諮詢費付款成功觸發自動建單」Slack 通知對象從值班業務改為諮詢人員群組廣播
- consultation-request spec：MODIFIED「諮詢結束分支」+「諮詢單轉需求單欄位帶入」+「諮詢單活動紀錄」Scenarios GIVEN「已指派」→「已認領」、ActivityLog 事件型別補「諮詢人員認領 / 主管代為認領」
- state-machines spec：MODIFIED「訂單狀態機」+「諮詢單狀態機（v2 簡化）」對齊認領語意
- business-processes spec：MODIFIED「諮詢前置流程端到端規則」ASCII 流程圖措辭對齊
- quote-request spec：MODIFIED「從諮詢單轉建需求單」GIVEN「已認領」

**主管代為認領**：保留主管彈性 — 諮詢主管可代為認領（指定某諮詢人員為 `consultant_id`），不視為「他派」而視為「主管代為操作的特殊認領」，ActivityLog 標示操作者與被指派者。

**resolution change**：[resolve-consultation-request-gaps-cr-1-cr-2](../../../../openspec/changes/archive/2026-05-22-resolve-consultation-request-gaps-cr-1-cr-2/)（2026-05-22 archive）
