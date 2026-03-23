---
name: notion-to-github
description: >
  將 Notion spec 頁面轉換為 GitHub Issue，並設定 Project 欄位。
  觸發時機：Miles 說「開 Issue」「Notion 轉 Issue」「建立 GitHub Issue」，或提供 Notion 頁面連結並要求建立 Issue。
  此 skill 自動完成：讀取 Notion 頁面 → 解析業務內容 → 建立 GitHub Issue → 加入 Project 並設定欄位。
---

# Notion → GitHub Issue 轉換

將 Notion spec 頁面的業務內容轉換為 GitHub Issue，加入 sensationsprint 專案管理 Project。

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
- [ ] Step 3：整理 Issue body（業務內容）
- [ ] Step 4：建立 GitHub Issue
- [ ] Step 5：加入 Project 並設定欄位
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

### Step 3：整理 Issue body（業務內容）

**包含**（業務可讀內容）：
- 問題陳述（背景痛點、受影響使用者、現有解法缺陷）
- 目標與成功指標（KPI 表格）
- 使用者故事（User Stories，含驗收條件）
- 功能需求（Functional Requirements 表格）
- 待確認項目（Open Questions）

**排除**（技術細節，保留在 Notion）：
- 資料模型 / DB Schema
- 測試案例（Test Cases）
- API 規格
- 非功能需求（NFR）
- UX 互動設計細節

**Body 結尾必加 Notion 連結**：
```markdown
---
> Spec 版本：{版本號}（{最後更新日}）｜PM：{PM 名稱}
> [完整規格書（Notion）]({notion_page_url})
```

---

### Step 4：建立 GitHub Issue

```bash
gh issue create \
  --repo sensationsprint/backlog \
  --title "[ Feature ] - {平台} - {功能描述}" \
  --body "{body 內容}"
```

**預設不帶入**：Labels、Assignee、Milestone。

---

### Step 5：加入 Project 並設定欄位

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

| GitHub 欄位 | 預設值 | 備註 |
|------------|--------|------|
| Repo | `sensationsprint/backlog` | 固定 |
| Labels | 不設定 | — |
| Assignee | 不設定 | — |
| Milestone | 不設定 | — |
| Project | `PVT_kwDOCJVQiM4AVSfE`（專案管理） | 固定 |
| Status | Backlog（`f57e7ecf`） | 預設 |
| Priority | P2（`6fd04d62`） | 可由 Notion 優先度覆寫：P0=`662124fe` / P1=`98204a83` / P3=`ec9d3ee1` |
| Platform | 依平台對應表 | 預設 ERP（`fd47d6d0`） |

---

## Priority 對應（Notion → GitHub）

| Notion 優先度 | GitHub Priority | option ID |
|--------------|----------------|-----------|
| 高 | P1 | `98204a83` |
| 中 | P2 | `6fd04d62` |
| 低 | P3 | `ec9d3ee1` |
| 未設定 | P2 | `6fd04d62` |
