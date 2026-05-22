---
type: open-question
module:
  - consultation-request
oq-id: CR-1
status: open
priority: high
audience: internal
raised-at: 2026-05-22
raised-by: erp-consultant-agent
source-link: US-CR-002 諮詢單批 a 雙視角審查
related-vault:
  - "[[13-user-stories/consultation-request/US-CR-002-諮詢人員認領諮詢單]]"
related-oq: []
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

## 待 Miles 確認

實務上諮詢分派採哪個模式？是否需要諮詢主管監看待認領積壓 + 強制指派權限？
