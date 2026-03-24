---
name: erp-test-case
description: >
  ERP 模組 UAT 測試案例撰寫 skill。
  觸發時機：Miles 說「寫 test case」「建立測試案例」「寫 [模組] 測試」「補 test case」，
  或任何需要為 ERP 模組建立驗收測試案例時。
  此 skill 自動完成：確認模組範圍 → 讀取 BRD 與 User Story →
  規劃 Test Scenario → 依標準格式逐筆建立 Test Case（Notion）。
  不適用：SIT / UT 測試設計、Prototype 功能驗證、純 QA 技術討論。
---

# ERP Test Case 撰寫

適用於印刷業 ERP 系統各模組的 UAT 驗收測試案例撰寫與建立。

---

## UAT 核心原則

**所有測試案例以業務操作視角撰寫，不測技術實作。**

| 原則 | 說明 |
|------|------|
| 使用者視角 | 步驟與預期結果從業務/使用者的操作行為出發，而非系統內部邏輯 |
| 可操作性 | 步驟需具體可執行，測試人員無需猜測「怎麼做」 |
| 可驗證性 | 預期結果需可直接觀察，不使用「應該正確」等模糊描述 |
| 前置條件明確 | 每個 TC 的初始狀態需清楚定義，含帳號角色、資料狀態 |
| 避免 SIT/UT 視角 | 不測 API 回應碼、DB schema、程式邏輯分支 |

---

## 撰寫工作流程

依序完成以下步驟：

```
Test Case 撰寫進度：
- [ ] Step 1：確認模組範圍與 ID 前綴
- [ ] Step 2：讀取 BRD + User Story（載入背景）
- [ ] Step 3：規劃 Test Scenarios（分組）
- [ ] Step 4：建立 Test Scenarios（Notion ERP Scenario DB）
- [ ] Step 5：逐筆撰寫並建立 Test Cases（Notion ERP Test Case DB）
- [ ] Step 6：確認屬性設定與連結正確
```

---

### Step 1：確認模組範圍與 ID 前綴

| 模組 | ID 前綴 | 功能模組選項值 |
|------|---------|--------------|
| 需求單 | QR | 需求單 |
| 訂單管理 | ORD | 訂單 |
| 工單管理 | WO | 工單 |
| 印件 | JOB | 印件 |

**ID 命名規則**：`T-{前綴}-{4位數字}` → 例：`T-QR-0001`、`T-ORD-0003`

先查詢現有最大號，從下一號開始：
```
mcp__notion__notion-query-database-view
view_url: https://www.notion.so/2b93886511fa817fbd65e7608726f036?v=2b93886511fa81f1b451000c7b406366
篩選：功能模組 = 對應模組
排序：ID 遞增
```

---

### Step 2：讀取 BRD + User Story

**必讀（最小必要）：**

1. **Notion BRD 頁面**（見 `CLAUDE.md` § Spec 規格檔清單 → 對應模組）
   - 重點：Phase 1 範疇、角色、核心流程
2. **Notion User Story DB**（篩選對應模組）
   - URL: https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d
   - 從 User Story 的「流程說明」與「成功條件」提取 TC 驗收標準

**不需額外讀取**：狀態機、業務情境 DB（Test Case 從 BRD 範疇出發，不做深度設計討論）

---

### Step 3：規劃 Test Scenarios（分組）

Test Scenario 是 Test Case 的上層分組，代表一個完整的業務情境群組。

**分組原則**：
- 以業務流程階段或功能群組為單位（通常 3-5 個 Scenario）
- 每個 Scenario 對應 2-5 個 Test Case

**常見分組模式（以需求單為例）**：
- 建立與資料管理
- 狀態推進流程
- 成交與流失
- 權限管理與輔助功能

---

### Step 4：建立 Test Scenarios（Notion）

**ERP Scenario DB 資訊：**
- 資料庫 URL: https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05
- Data Source ID: `2b938865-11fa-8181-9498-000b4db02dee`

**每個 Scenario 的必填屬性：**

| 屬性 | 值 |
|------|-----|
| 文件名稱 | 情境名稱（繁體中文） |
| ID | S-{前綴}-{NNN}（如 S-QR-001） |
| 選取 | 業務流程 |
| 摘要 | 一行說明此 Scenario 驗證的核心內容 |

建立後記錄各 Scenario 的 Notion URL（建立 Test Case 時需要做 relation 連結）。

---

### Step 5：逐筆建立 Test Cases（Notion）

**ERP Test Case DB 資訊：**
- 資料庫 URL: https://www.notion.so/2b93886511fa817fbd65e7608726f036
- Data Source ID: `2b938865-11fa-8173-bc0b-000be66620ff`

#### 5.1 分類原則

| 類型 | 數量建議 | 定義 |
|------|---------|------|
| Smoke Test | 2-3 個 | 模組最關鍵的 Happy Path，全部失敗則停止測試 |
| Core | 5-10 個 | 主要業務流程，含主要的成功與失敗路徑 |
| Extended | 3-5 個 | 邊界情況、權限隔離、資料驗證 |

#### 5.2 優先度與影響風險對應

| 類型 | 優先度 | 影響風險 |
|------|--------|---------|
| Smoke Test | P0 | 高 |
| Core（主流程） | P1 | 高或中 |
| Core（輔助功能） | P1 | 中 |
| Extended | P2 | 中或低 |

#### 5.3 屬性設定

| 屬性 | 設定值 |
|------|--------|
| 文件名稱 | TC 名稱（動詞開頭，繁體中文） |
| ID | T-{前綴}-{NNNN} |
| 優先度 | P0 / P1 / P2 |
| 影響風險 | 高 / 中 / 低 |
| 類型 | Smoke Test / Core / Extended |
| 功能模組 | 對應模組名稱（如「需求單」） |
| 前後台 | Dashboard（ERP 系統固定為電腦版 Dashboard） |
| Test Scenario | Relation → 對應 Scenario 頁面 URL |

> 若 `功能模組` 欄位缺少對應選項，需先執行 `ALTER COLUMN` 新增選項值再建立 TC。

#### 5.4 頁面內容格式（必須遵守）

每個 Test Case 的頁面內容依以下固定格式撰寫：

```
[描述段落：條列此 TC 驗證的核心重點，2-4 個要點]

[code block（plain text）：與上方描述段落內容相同]

### 測試資料：

<callout icon="💡" color="gray_bg">
	前置條件：[系統初始狀態、帳號角色、需要準備的測試資料]
	[其他測試用資料，如：金額、選項、檔案類型]
</callout>

### 步驟：

1. [具體操作步驟，以使用者動作描述]
2. ...

### 預期結果：

1. [可觀察的系統回應，直接對應步驟]
2. ...
```

**格式注意事項：**
- 描述段落使用 bullet list（`-`）
- code block 語言設為 `plain text`
- callout 使用 `<callout icon="💡" color="gray_bg">` 語法
- 步驟與預期結果使用 numbered list
- 預期結果應與步驟有清楚對應關係

---

### Step 6：確認屬性設定與連結正確

完成後逐一確認：

- [ ] 所有 TC 的 `Test Scenario` relation 已正確連結
- [ ] 所有 TC 的 `功能模組` 已設定（確認 DB schema 有對應選項）
- [ ] Smoke Test 均設定 P0 + 高影響風險
- [ ] TC 數量合理：Smoke 2-3 個，Core 5-10 個，Extended 3-5 個
- [ ] ID 無重複，格式符合 `T-{前綴}-{NNNN}`

---

## 參考資源

| 資源 | 路徑 |
|------|------|
| ERP Test Case DB | https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| ERP Scenario DB | https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 |
| BRD 各模組頁面 | 見 `CLAUDE.md` § Spec 規格檔清單 |
| User Story DB | https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d |
| 使用者情境（角色權責）| https://www.notion.so/32c3886511fa8144b38adc9266395d15 |
