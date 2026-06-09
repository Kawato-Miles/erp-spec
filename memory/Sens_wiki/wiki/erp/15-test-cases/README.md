---
title: 15-test-cases 入口
type: meta
status: active
last-reviewed: 2026-06-01
---

# 15-test-cases（UAT 驗收項目）入口

ERP 系統 UAT 業務層驗收項目（type=test-case）的 **Vault 索引正本**。本層卡為「驗收索引卡」：承載 frontmatter（依據鏈）+ happy/edge 案例索引 + 相關連結；**正文（前置 / 步驟 / 預期）存 Notion ERP Test Case DB**，Vault 不放正文。

## 一、定位與依據鏈

驗收項目是分層體系最細的一層（見 [[erp_index]]）。依據鏈：

```
test-case（驗收項目，source↑）→ user-story（操作步驟）→ business-logic（規則正本）
```

- **source ↑** 指對應 user-story 卡（驗收依操作步驟，MUST 指 user-story、禁指同層 / business-logic / OpenSpec）。
- **implemented-by ↓** 指 OpenSpec Requirement 標題層 / Prototype 端對端測試（Playwright spec，UI 點擊層歸此）。
- 對應 user-story 以 frontmatter `related-test-cases` 回連本層卡 wiki link（雙向可達，2026-06-01 由 Notion URL 改 Vault wiki link）。

## 二、撰寫與命名

- 範本 / 自審正本：[[_template-test-case]]（寫的時候照填、事後照檢查）。
- 目錄：`15-test-cases/<module>/`；檔名 `TC-<MODULE>-<NNN>-<簡述>.md`（NNN 三位補零）；MODULE 前綴見 [[wiki-schema#七、命名規約]]。
- Test Scenario 分組由「目錄（module）+ 卡內 happy/edge 索引」承擔，不另立 scenario 卡（2026-06-01 定案）。
- 撰寫步驟為**業務動作、禁 UI 點擊措辭**（UI 點擊歸 Prototype e2e）；happy / edge 分兩張表。

## 三、操作

由 [[erp-test-case]] skill 管理（mode A 新增 / B 補充更新 / C 推送 Notion）。驗收種子取自 [[wiki/erp/13-user-stories/README|user-story]] 的 Gherkin 成功條件（正向→happy、守衛→edge）。

## 關聯區域

- [[_template-test-case]] — 撰寫 / 稽核範本
- [[wiki/erp/13-user-stories/README]] — 上層操作步驟（驗收種子來源）
- [[wiki-schema#type=test-case]] — frontmatter 正式 schema
- [[erp_index]] — 分層體系與依據鏈
- [[_migration-ui-from-userstory]] — 單階段化遷移自 user-story 抽出的 UI 內容（待 seed）
- [[erp-test-case]] — 管理 skill
