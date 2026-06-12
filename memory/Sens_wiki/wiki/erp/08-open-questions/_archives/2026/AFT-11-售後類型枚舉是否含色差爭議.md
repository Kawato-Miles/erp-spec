---
type: open-question
module:
  - 售後服務
oq-id: AFT-11
status: answered
priority: medium
audience: internal
raised-at: 2026-06-11
raised-by: 稽核 agent（售後服務實體卡憲章稽核時發現）
source-link: openspec/specs/after-sales-ticket/spec.md（核心欄位表 vs case_category Requirement 兩處不一致）
related-vault:
  - "[[售後服務]]"
expected-resolution-at: 2026-06-30
answered-at: 2026-06-12
answered-by: Miles
---

# 問題描述

OpenSpec 售後規格內部對「售後類型」枚舉值自相矛盾：

- 核心欄位表（spec 第 34 行）列 **6 值**：印件瑕疵／規格不符／物流問題／工法限制／交期延誤／其他
- 售後類型分類 Requirement（spec 第 171-183 行）列 **7 值**：多了「**色差爭議**」（並註明其責任歸屬難認定的特殊性）

[[售後服務]] 實體卡欄位表暫採 6 值版（依核心欄位表），待拍板後三方同步（spec 兩處＋實體卡）。

影響：售後類型供管理切片（「哪類問題最常發生」）；漏「色差爭議」會讓印刷業最常見的爭議類型混進「其他」，切片失真。

# 待解答

- [x] 「色差爭議」是否為正式售後類型（7 值版為準）？或併入印件瑕疵／其他（6 值版為準）？

# 候選方案

- 方案 A（傾向）：採 7 值含色差爭議——色差是印刷業高頻爭議且責任歸屬特殊，獨立分類對管理切片有意義；拍板後同步 spec 第 34 行與實體卡。
- 方案 B：採 6 值，色差爭議併入印件瑕疵；拍板後修 spec 第 171-183 行。

# 決議

Miles 拍板（2026-06-12）：採 **7 值、加上「色差爭議」**（方案 A）——色差為印刷業高頻爭議且責任歸屬最難認定，獨立分類供管理切片。
落地：[[售後服務]] 欄位表「售後類型」列已加色差爭議；spec 售後類型 Requirement 本為 7 值、核心欄位表已退場改指 wiki，三方一致，無需再回寫。
