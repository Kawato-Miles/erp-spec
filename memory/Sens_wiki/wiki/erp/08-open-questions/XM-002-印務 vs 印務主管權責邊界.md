---
type: open-question
module:
  - cross-module
  - work-order
  - production-task
oq-id: XM-002
status: open
priority: medium
audience: internal
expected-resolution-at: 2026-Q3  # 預設值，待 Miles 確認實際時程
raised-at: 2026-05-19
raised-by: Miles
source-link: memory/Sens_wiki/wiki/erp/03-roles/_alignment-report.md (Phase A 角色清單對齊識別)
related-vault:
  - "[[印務]]"
  - "[[印務主管]]"
  - "[[工單]]"
  - "[[生產任務]]"
related-oq: []
---

# XM-002：印務 vs 印務主管權責邊界

## 問題描述

Notion 核心角色權責 DB 區分 [[印務]] 與 [[印務主管]] 兩個角色，但兩者的權責邊界仍不清晰：

- 印務（執行）能**直接建生產任務**嗎？還是需印務主管批准？
- 印務主管的「審核」涵蓋哪些動作（工單建立 / 生產任務新增 / 工單異動 ...）？
- 兩者對 BOM 表的維護權限分工？

## 涉及範圍

- 模組：work-order、production-task、cross-module
- 相關卡：[[印務]]、[[印務主管]]、[[工單]]、[[生產任務]]、[[印件生產流程]]
- 影響範圍：工單分派流程、生產任務建立權限、製程審核流程

## 討論記錄

Phase A 角色清單對齊（_alignment-report.md）識別出 OpenSpec user-roles spec 僅有印務主管，無印務（執行層）角色。此邊界釐清關係到：

- 是否要在 OpenSpec user-roles spec 補建「印務」角色
- 工單分派流程 spec（business-processes/spec.md § 工單分派流程）的描述精度
- Prototype 權限驗證的設計

## 待解答

- [ ] 印務（非主管）能直接建生產任務嗎？
- [ ] 印務主管的審核範圍清單（哪些動作觸發審核）
- [ ] BOM 維護分工

## 候選方案

### 方案 A：印務可直接建，印務主管事後審核

- 優點：流程順暢、不卡關
- 缺點：審核變事後核對，較難回退

### 方案 B：印務建草稿，印務主管審核後才生效

- 優點：審核前置，責任明確
- 缺點：流程環節多、可能拖慢生產
