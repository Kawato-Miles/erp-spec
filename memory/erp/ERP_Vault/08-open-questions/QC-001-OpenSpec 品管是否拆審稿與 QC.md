---
type: open-question
module:
  - qc
  - prepress-review
  - cross-module
oq-id: QC-001
status: open
priority: medium
audience: internal
raised-at: 2026-05-19
raised-by: Miles
source-link: memory/erp/ERP_Vault/03-roles/_alignment-report.md (Phase A 角色清單對齊識別)
related-vault:
  - "[[QC]]"
  - "[[審稿]]"
  - "[[稿件管理規則]]"
related-oq: []
---

# QC-001：OpenSpec「品管」是否該拆為「審稿」+「QC」

## 問題描述

OpenSpec `user-roles/spec.md` 將「品管」定義為**單一角色**，但 Notion 核心角色權責 DB **拆分為兩個獨立角色**：

| 角色 | 階段 | 職責 |
|------|------|------|
| [[審稿]] | 製前（審稿階段）| 確認稿件合規、製作稿件 |
| [[QC]] | 製後（打樣印製階段）| 依訂單進行 QC，記錄檢驗結果 |

需決定：**OpenSpec 是否該拆「品管」為兩個角色？**

## 涉及範圍

- 模組：qc、prepress-review、cross-module、user-roles
- 相關卡：[[QC]]、[[審稿]]、[[稿件管理規則]]、[[審稿分配規則]]
- 影響範圍：
  - `openspec/specs/user-roles/spec.md` 拆分為兩角色
  - `openspec/specs/qc/spec.md` 角色描述
  - `openspec/specs/prepress-review/spec.md` 角色描述
  - 各模組 spec 中「品管」字樣的精確化

## 討論記錄

Phase A 角色清單對齊（_alignment-report.md）識別出 OpenSpec「品管」涵蓋 Notion DB 的審稿（製前）+ QC（製後）兩個角色。兩者：

- 平台不同：審稿（審稿平台） vs QC（工廠平台）
- 階段不同：審稿（製前 / 審稿階段） vs QC（製後 / 打樣印製階段）
- 利害程度不同：審稿（高） vs QC（中）
- 職責不同：審稿確認稿件合規 vs QC 檢驗成品

## 待解答

- [ ] 是否拆分？
- [ ] 若拆分，OpenSpec change 範圍（user-roles + qc + prepress-review）
- [ ] 若不拆分，如何在 OpenSpec spec 中區分兩種職責

## 候選方案

### 方案 A：拆分為「審稿」+「QC」兩個獨立角色

- 開 OpenSpec change：補建審稿、改寫 QC、user-roles 拆分
- 影響：3 個 spec 變動

### 方案 B：維持單一「品管」，內文補註

- OpenSpec 仍為「品管」但內文標註「含製前 / 製後兩種職責」
- 影響：較輕，但角色語意混淆風險仍在
