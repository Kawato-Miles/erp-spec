---
type: open-question
module:
  - 印前審稿
oq-id: AR-6
status: open
priority: medium
audience: external
raised-at: 2026-05-21
raised-by: erp-consultant-agent
source-link: US-AR-006 / US-AR-005 批 1 雙視角審查
related-vault:
  - "[[US-AR-005-監控當日審稿工作量]]"
  - "[[US-AR-006-比對審稿人員績效]]"
  - "[[US-AR-007-執行印件審稿]]"
related-oq: []
expected-resolution-at: 2026-Q3
---

# AR-6 退件率分母是否排除技術退件

## 問題

US-AR-007 已明示「技術性退件分類獨立統計，不計入不合格率 KPI」（spec § ReviewRound L183-189）。但 spec § 審稿人員對比表 L600-636 描述「退件率」指標時未明示是否排除技術退件。涉及兩個指標的計算口徑：

1. **US-AR-005「監控當日審稿工作量」§ 不合格數**：當日「不合格 Round」是否含技術退件？
2. **US-AR-006「比對審稿人員績效」§ 退件率**：退件率 = 不合格 Round / 已審 Round，分母 / 分子是否排除技術退件？

erp-consultant + senior-pm 雙視角同步指出此 gap，影響 KPI 公式正確性。

## 影響

- 若不排除：審稿員績效會被「客戶提供損毀稿件」等技術因素拖累，違反 US-AR-007 的「不污染品質 KPI 分母」精神
- 若排除：US-AR-005 不合格數的視覺顯示是否要分流呈現「品質不合格 + 技術退件」兩數字？
- 影響 US-AR-005 / US-AR-006 / US-AR-007 三張卡的 acceptance criteria 描述
- 影響後續 Notion KPI DB 對應指標卡的定義

## 選項

| 選項 | 規則 | 影響 |
|------|------|------|
| A | 退件率 = 不合格 Round（不含技術退件）/ 已審 Round（不含技術退件）| 純品質指標，與 US-AR-007 KPI 精神一致；技術退件數另立指標 |
| B | 退件率 = 不合格 Round（含技術退件）/ 已審 Round（含技術退件）| 反映審稿員總體判定動作量 |
| C | 退件率 = 不合格 Round（不含技術退件）/ 已審 Round（含技術退件）| 分母含技術退件壓低退件率，可能美化績效 |
| D | 兩個指標都呈現（「品質退件率」+「總退件率」）| 完整透明，但儀表板複雜化 |

## 暫定處理

- US-AR-005 acceptance criteria 引此 OQ wiki link
- US-AR-006 acceptance criteria 引此 OQ wiki link 並補一條「退件率計算分母範圍待 [[AR-6-退件率分母是否排除技術退件|AR-6]] 解答」
- US-AR-007 維持「技術退件分類獨立統計，不計入不合格率 KPI」描述不變（已對齊選項 A 精神）

## 待 Miles 確認

選哪個方案？或補新方案？
