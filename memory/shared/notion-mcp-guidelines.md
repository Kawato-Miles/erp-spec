# Notion MCP 操作指引

> 適用所有涉及 Notion 的 Skill（erp-spec、oq-manage、doc-audit、notion-to-github 等）。
> 每次呼叫 Notion MCP 工具前，先對照本頁檢查清單，避免失敗浪費 Token。
>
> 官方文件：https://developers.notion.com/guides/mcp/mcp-supported-tools

---

## 一、工具速查（依操作意圖選用）

| 意圖 | 最佳工具 | 備註 |
|------|---------|------|
| 讀取頁面 / DB 結構 | `notion-fetch` | 必做前置：建立或更新前先 fetch 確認 schema |
| 搜尋頁面或 DB | `notion-search` | 速率限制 30 次/分鐘（較嚴格）|
| 建立頁面（含 DB 內） | `notion-create-pages` | 支援批量、模板；DB 頁面需 `data_source_id` |
| 更新頁面屬性 / 內容 | `notion-update-page` | 更新 content 前必須先 fetch 取得 old_str |
| 複製頁面（以模板為基礎）| `notion-duplicate-page` | 非同步完成，需等待 |
| 移動頁面至新父層 | `notion-move-pages` | 支援批量 |
| 查詢 DB 資料 | `notion-query-database-view` | 先 fetch DB 取 view URL |
| 跨多個 DB 聚合查詢 | `notion-query-data-sources` | **不可用**（需 Enterprise，目前為 Business）|
| 新增 / 讀取評論 | `notion-create-comment` / `notion-get-comments` | 支援頁面層 / 區塊層 / 回覆 |
| 建立新 DB | `notion-create-database` | 需定義 schema（欄位、類型） |
| 修改 DB 結構（新增欄位等）| `notion-update-data-source` | 用 `data_source_id` |
| 建立 / 修改 DB View | `notion-create-view` / `notion-update-view` | 支援表格、看板、日曆、表單等 10 種 |
| 查詢工作區使用者 | `notion-get-users` / `notion-get-teams` | 查指派人員 / 確認成員 |

**速率限制**：一般工具 180 次/分鐘（3 次/秒）；`notion-search` 獨立限制 30 次/分鐘。

---

## 二、操作前置步驟（必做）

| 操作 | 必要前置 |
|------|---------|
| 建立 DB 頁面 | `notion-fetch` DB → 取得 `data_source_id` + schema（欄位名稱、select 選項）|
| 更新 DB 頁面 properties | `notion-fetch` DB schema 確認欄位名稱與 select 選項 |
| 更新頁面 content（update_content）| `notion-fetch` 頁面取得完整現有內容，old_str 需完全一致 |
| 查詢 DB | `notion-fetch` DB 取得 view URL → 用 `notion-query-database-view` |
| 讀取頁面 | 直接 fetch，無特殊前置 |

---

## 三、已知錯誤模式

### 錯誤 1：`expected record, received string`（properties 整體失效）

**原因**：properties JSON 中含有格式錯誤的 Unicode 跳脫序列，導致整個 properties 被解析為字串。

**觸發範例**：`\u5夥`（`\u` 後必須恰好 4 個十六進位字元；`夥` = U+5925，正確為 `\u5925`）

**防範**：直接使用 UTF-8 字面字元（最安全），不手動寫 `\uXXXX`。

---

### 錯誤 2：Select 值不存在

**原因**：Select / Multi-select 的值必須完全符合 schema 定義的 option 名稱（大小寫敏感）。

**防範**：fetch DB schema 後，從 `options` 清單複製確切名稱，不自行拼寫。

---

### 錯誤 3：特殊欄位名稱衝突

**原因**：欄位名稱為 `id` 或 `url`（不分大小寫）時，直接使用會被系統保留字覆蓋。

**防範**：加上 `userDefined:` 前綴，例如 `userDefined:URL`。

---

### 錯誤 4：`update_content` old_str 比對失敗

**原因**：old_str 與頁面實際內容不完全一致（多一個空格、換行不同等）。

**防範**：更新前必須 fetch 頁面，將 old_str 從 fetch 結果中直接複製，不憑記憶填寫。

---

### 錯誤 5：`notion-create-pages` 使用 `database_id` 而非 `data_source_id`

**原因**：DB 有多個 data source 時，`database_id` 無法明確指定目標 collection。

**防範**：從 fetch DB 結果中取 `collection://` URL，去掉前綴後作為 `data_source_id`。

---

## 四、屬性格式規則

| 屬性類型 | 正確格式 |
|---------|---------|
| Checkbox | `__YES__` 或 `__NO__` |
| Date | `date:{欄位}:start`、`date:{欄位}:end`（可選）、`date:{欄位}:is_datetime`（0 或 1）|
| Select / Multi-select | 字串，必須符合 schema options |
| Number | JavaScript 數字（非字串）|
| Title | 欄位名稱對應字串值 |

---

## 五、平行呼叫原則

- 多筆獨立的 update / create 可平行發出，節省時間
- 若第二筆依賴第一筆的回傳值（如建立後更新），必須循序執行
- 平行呼叫失敗時，只需重送失敗的那筆，不需全部重送
