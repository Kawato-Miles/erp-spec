---
type: open-question
module:
  - qc
  - prepress-review
  - cross-module
oq-id: QC-001
status: answered
priority: medium
audience: internal
raised-at: 2026-05-19
raised-by: Miles
answered-at: 2026-05-20
answered-by: Miles (依 erp-consultant Round 1 審查建議)
source-link: memory/Sens_wiki/wiki/erp/03-roles/_alignment-report.md (Phase A 角色清單對齊識別)
related-vault:
  - "[[wiki/erp/03-roles/QC]]"
  - "[[審稿]]"
  - "[[稿件管理規則]]"
related-oq: []
related-changes:
  - reclassify-qc-and-add-inspection (2026-05-20 歸檔)
---

# QC-001：OpenSpec「品管」是否該拆為「審稿」+「QC」

## 問題描述

OpenSpec `user-roles/spec.md` 將「品管」定義為**單一角色**，但 Notion 核心角色權責 DB **拆分為兩個獨立角色**：

| 角色 | 階段 | 職責 |
|------|------|------|
| [[審稿]] | 製前（審稿階段）| 確認稿件合規、製作稿件 |
| [[wiki/erp/03-roles/QC]] | 製後（打樣印製階段）| 依訂單進行 QC，記錄檢驗結果 |

需決定：**OpenSpec 是否該拆「品管」為兩個角色？**

## 涉及範圍

- 模組：qc、prepress-review、cross-module、user-roles
- 相關卡：[[wiki/erp/03-roles/QC]]、[[審稿]]、[[稿件管理規則]]、[[審稿分配規則]]
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

## 決議與理由

**決議**：QC-001 不需處理「拆品管」議題，原問題框架本身已不成立。

**理由**（依 erp-consultant Round 1 審查）：

OpenSpec 既有 spec 結構中，**QC 與 prepress-review 為兩個完全獨立的 capability**：
- `prepress-review/spec.md`：負責「製前稿件審查」（審稿角色執行）
- `qc/spec.md`：負責「製後印件入庫檢查」（QC 角色執行）

兩者本來就不在同一框架下，不存在「品管要不要拆」的問題。問題框架的誤解可能來自 Notion 核心角色權責 DB 將兩個角色都稱「品管」造成的概念混淆。

reclassify-qc-and-add-inspection（C1）於 2026-05-20 歸檔後，進一步明確 QC 角色定位：「印件入庫檢查 + 工序中間品檢」執行者，與審稿（prepress-review capability）為兩個完全不同的 capability 結構性分離。

**決策者**：Miles（2026-05-20，採 erp-consultant Round 1 審查建議）

**參考討論**：[reclassify-qc design.md § Review History](../../../../openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/design.md) 三視角審查 QC-001 處理分歧（senior-pm vs erp-consultant）
