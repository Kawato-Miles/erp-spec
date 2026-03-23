---
name: OQ 統一管理原則
description: 所有待確認問題、follow-up 設計問題應統一到 open-questions.md，不散落在 Spec「下一步行動」或回應建議中
type: feedback
---

所有待確認的設計問題、業務決策問題、跨模組 follow-up 都應寫入 `memory/erp/open-questions.md`，以此為唯一正本管理。

**Why:** 問題散落在 Spec「下一步行動」、Claude 回應建議、文件備注等多處，難以統一追蹤與優先排序。OQ 已有結構化格式（ID、優先、狀態、影響模組），是最適合的追蹤位置。

**How to apply:**
- Spec「下一步行動」只放開發流程 action items（設計師審查、補充 test-cases.md、開發評估等），不放待確認的設計問題
- 待確認設計問題一律寫入 open-questions.md，Spec § 12 用參照節點格式引用
- 回應中不要在末尾列「建議下一步」的 OQ 確認清單，應說「見 open-questions.md 快速審視表」
