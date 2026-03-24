---
name: notion-to-github
description: >
  將 Notion BRD 頁面轉換為 GitHub PRD Issues（Parent Issue + Sub-issues），並設定 Project 欄位。
  定位：BRD 完成後建立開發用 Issues；商業背景以 Notion 連結呈現，不重複複製內容。
  觸發時機：Miles 說「開 Issue」「Notion 轉 Issue」「建立 GitHub Issue」，或提供 Notion 頁面連結並要求建立 Issue。
  此 skill 自動完成：讀取 Notion BRD → 依模板建 Parent Issue（模組層）→ 依 BRD 範疇建 Sub-issues（子功能層）→ 加入 Project 並設定欄位。
---

# Notion → GitHub PRD Issues 轉換

將 Notion BRD 頁面轉換為 GitHub PRD Issues（Parent + Sub-issues），加入 sensationsprint 專案管理 Project。

---

## 前置條件

確認 `gh` 具備 `project` scope（只需設定一次）：
```bash
gh auth refresh -h github.com -s project
```

---

## 工作流程

```
轉換進度：
- [ ] Step 1：讀取 Notion 頁面
- [ ] Step 2：解析標題與平台
- [ ] Step 3：整理 Parent Issue body（依 prd-parent-template）
- [ ] Step 4：建立 Parent Issue
- [ ] Step 4b：依 BRD 範疇建立 Sub-issues（依 prd-sub-template）
- [ ] Step 5：Parent Issue 加入 Project 並設定欄位
```

---

### Step 1：讀取 Notion 頁面

使用 `notion-fetch` 工具取得頁面完整內容。

---

### Step 2：解析標題與平台

**Issue 標題格式**：`[ Feature ] - {平台} - {功能描述}`

**平台對應規則**（從 Notion 頁面內容或所屬 Project 判斷）：

| 內容特徵 | Issue 標題平台段 | GitHub Project Platform |
|---------|----------------|------------------------|
| ERP 模組（工單 / 訂單 / 需求單 / QC 等） | `ERP - 中台` | ERP |
| ERP 業務人員操作介面 | `ERP - 業務平台` | ERP |
| 線上圖編輯器 | `編輯器` | 編輯器 |
| 感官 / 理想電商 | `EC - {平台名}` | EC |
| 白牌 | `白牌` | 白牌 |

**功能描述**：從 Notion 頁面標題或 `功能名稱` 欄位取得模組名稱。

---

### Step 3：整理 Parent Issue body（依 prd-parent-template）

模板：`.claude/skills/notion-to-github/references/prd-parent-template.md`

**填入規則：**
- `背景與商業目標`：貼入 Notion BRD URL
- `資料欄位`：Notion 資料欄位 DB 連結（固定，加模組名稱說明）
- `功能邏輯說明`：從 BRD § 範疇（In Scope）整理成條列說明
- `UI / FE / BE`：留 TBD，由開發階段各角色補入
- `Sub-issues`：等 Step 4b 建完後補入 Issue 號

---

### Step 4：建立 Parent Issue

**Issue Title 格式**：`[ Feature ] - {平台} - {模組名稱}`

```bash
gh api graphql -f query='
mutation {
  createIssue(input: {
    repositoryId: "R_kgDOKbOGzg"
    title: "[ Feature ] - {平台} - {模組名稱}"
    body: "{parent body 內容}"
    issueTypeId: "IT_kwDOCJVQiM4BNidc"
  }) {
    issue { id number title }
  }
}'
```

**預設不帶入**：Labels、Assignee、Milestone。

---

### Step 4b：建立 Task Sub-issues（依角色）

模板：`.claude/skills/notion-to-github/references/prd-sub-template.md`

**Sub-issue 拆分規則**：
- 依角色（Backend / Frontend / Design）各建一個 Sub-issue
- 若 BRD 有明確 Phase 拆分，每個角色 × Phase 各建一個（如：後端 Phase 1、後端 Phase 2）

**Sub-issue Title 格式**：`[ Task ] - {角色} - {模組名稱} - {Phase（若有）}`
- 例：`[ Task ] - 後端 - 需求單管理模組 - Phase 1`

**角色 Label 對應：**
| 角色 | Label | Label ID |
|------|-------|----------|
| 後端 | `Backend` | `LA_kwDOKbOGzs8AAAABqEeT5A` |
| 前端 | `Frontend` | `LA_kwDOKbOGzs8AAAACGVRnYQ` |
| 設計 | `Design` | `LA_kwDOKbOGzs8AAAACRooYDQ` |

**IssueType：** Task（`IT_kwDOCJVQiM4BNidW`）

**用 GraphQL 建立（同時設定 type、label、parent）：**
```bash
gh api graphql -f query='
mutation {
  createIssue(input: {
    repositoryId: "R_kgDOKbOGzg"
    title: "[ Task ] - {角色} - {模組名稱} - Phase {N}"
    body: "{sub body 內容}"
    issueTypeId: "IT_kwDOCJVQiM4BNidW"
    labelIds: ["{label_id}"]
    parentIssueId: "{parent_issue_node_id}"
  }) {
    issue { id number title }
  }
}'
```

Sub-issue 建完後，每個 Sub-issue 都接續 Step 5 加入 Project（設定與 Parent Issue 相同：Priority = P2、Platform = ERP）。

---

### Step 5：加入 Project 並設定欄位

> Parent Issue 與每個 Sub-issue 都執行此步驟。

**5a. 取得新建 Issue 的 node ID：**
```bash
gh api repos/sensationsprint/backlog/issues/{issue_number} --jq '.node_id'
```

**5b. 加入 Project：**
```bash
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCJVQiM4AVSfE"
    contentId: "{issue_node_id}"
  }) {
    item { id }
  }
}'
```
→ 記下回傳的 `item.id`（格式：`PVTI_...`）

**5c. 設定 Status = Backlog：**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOCJVQiM4AVSfE"
    itemId: "{item_id}"
    fieldId: "PVTSSF_lADOCJVQiM4AVSfEzgNmnzI"
    value: { singleSelectOptionId: "f57e7ecf" }
  }) { projectV2Item { id } }
}'
```

**5d. 設定 Priority = P2（預設）：**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOCJVQiM4AVSfE"
    itemId: "{item_id}"
    fieldId: "PVTSSF_lADOCJVQiM4AVSfEzg55_Qo"
    value: { singleSelectOptionId: "6fd04d62" }
  }) { projectV2Item { id } }
}'
```

**5e. 設定 Platform（依 Step 2 對應）：**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOCJVQiM4AVSfE"
    itemId: "{item_id}"
    fieldId: "PVTSSF_lADOCJVQiM4AVSfEzgy1GCw"
    value: { singleSelectOptionId: "{platform_option_id}" }
  }) { projectV2Item { id } }
}'
```

**Platform option ID 對照表：**
| 平台 | option ID |
|------|-----------|
| ERP | `fd47d6d0` |
| 編輯器 | `b9321498` |
| EC | `7ea96968` |
| 白牌 | `1c000751` |

---

## 欄位預設值一覽

### Parent Issue（Feature）

| GitHub 欄位 | 預設值 | 備註 |
|------------|--------|------|
| Repo | `sensationsprint/backlog` | 固定 |
| IssueType | Feature（`IT_kwDOCJVQiM4BNidc`） | 固定 |
| Labels | 不設定 | — |
| Assignee | 不設定 | — |
| Milestone | 不設定 | — |
| Project | `PVT_kwDOCJVQiM4AVSfE`（專案管理） | 固定 |
| Status | Backlog（`f57e7ecf`） | 預設 |
| Priority | P2（`6fd04d62`） | 可由 Notion 優先度覆寫：P0=`662124fe` / P1=`98204a83` / P3=`ec9d3ee1` |
| Platform | 依平台對應表 | 預設 ERP（`fd47d6d0`） |

### Sub-issue（Task）

| GitHub 欄位 | 預設值 | 備註 |
|------------|--------|------|
| Repo | `sensationsprint/backlog` | 固定 |
| IssueType | Task（`IT_kwDOCJVQiM4BNidW`） | 固定 |
| Labels | 依角色：Backend / Frontend / Design | 見角色 Label 對應表 |
| Parent | Parent Issue node ID | 建立時帶入 `parentIssueId` |
| Assignee | 不設定 | — |
| Milestone | 不設定 | — |
| Project | `PVT_kwDOCJVQiM4AVSfE`（專案管理） | 固定，建立後用 Step 5 加入 |
| Status | Backlog（`f57e7ecf`） | 預設 |
| Priority | P2（`6fd04d62`） | 固定 |
| Platform | ERP（`fd47d6d0`） | 固定 |

---

## Priority 對應（Notion → GitHub）

| Notion 優先度 | GitHub Priority | option ID |
|--------------|----------------|-----------|
| 高 | P1 | `98204a83` |
| 中 | P2 | `6fd04d62` |
| 低 | P3 | `ec9d3ee1` |
| 未設定 | P2 | `6fd04d62` |
