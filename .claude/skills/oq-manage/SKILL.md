---
name: oq-manage
description: >
  OQ（Open Question）管理 skill。
  觸發時機：發現設計不確定項、Miles 說「新增 OQ」「這個要記下來」「有個問題要確認」，
  或任何 Spec / 規劃 / 討論中需要新增、查詢、更新 OQ 時（不限於 Spec 撰寫情境）。
  此 skill 強制執行去重邏輯：新增前先搜尋相似 OQ，由 Claude 分析並建議，由 Miles 決定。
  不適用：已確認的決策記錄、術語定義更新、一般討論備忘。
---

# OQ 管理

統一管理 ERP 模組的 Open Questions（Notion Follow-up DB）。

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| A：查詢 | 討論開始前 / 確認特定模組的未解 OQ |
| B：新增（含去重）| 識別到不確定項 / Miles 說「新增 OQ」|
| C：更新 | OQ 已解答 / 說明需補充 |

---

## Notion Follow-up DB 資訊

- 資料庫 URL：https://www.notion.so/32c3886511fa808e9754ea1f18248d92
- OQ view URL：https://www.notion.so/32c3886511fa808e9754ea1f18248d92?v=32c3886511fa8081878c000cab1b455b

---

## 模式 A：查詢

```
mcp__notion__notion-query-database-view
view_url: https://www.notion.so/32c3886511fa808e9754ea1f18248d92?v=32c3886511fa8081878c000cab1b455b
篩選：任務類型=Open Question + 狀態=未開始 + Feature=對應模組（若有）
```

查詢後列出：序號（OQ ID）、任務名稱、優先順序。

---

## 模式 B：新增（強制去重流程）

**禁止跳過任何步驟。**

### Step B1：描述問題

確認以下要素（若 Miles 未完整提供，補充詢問）：
- 問題是什麼（不確定的設計事項）
- 涉及模組（QR / ORD / WO / JOB / XM）
- 問題來源（討論連結、Notion 頁面、Slack 訊息）

### Step B2：搜尋相似 OQ（去重）

1. 查詢該模組（同時包含 XM）的所有未解 OQ
2. 分析語意相似度，依以下標準分類：

| 相似度 | 判斷標準 | 建議動作 |
|--------|---------|---------|
| 高（疑似重複）| 核心問題相同，只是描述角度不同 | 建議更新現有 OQ，不新增 |
| 中（部分重疊）| 同一主題但問題面向不同 | 列出現有 OQ，讓 Miles 決定合併或新增 |
| 低（無重疊）| 問題性質明顯不同 | 建議新增 |

3. **回報格式**：

```
[去重分析]
相似度：高 / 中 / 低
現有相關 OQ：
  - OQ-ORD-005：訂單審核權限是否分層（狀態：未開始）

建議：合併至現有 OQ / 新增 / 由你決定
原因：（一句話說明判斷依據）
```

4. **等待 Miles 確認後**才執行 Step B3（新增）或 Step C（更新現有 OQ）。

### Step B3：建立新 OQ

確認新增後，執行：

**查詢現有最大序號：**
```
mcp__notion__notion-query-database-view
view_url: https://www.notion.so/32c3886511fa808e9754ea1f18248d92?v=32c3886511fa8081878c000cab1b455b
篩選：Feature=對應模組（或 XM）
排序：序號 遞減
取第一筆 → 解析數字 → +1 → 補齊三位數
```

**序號格式：** `{MODULE}-{NNN}`（三位數補零，如 `ORD-008`）

**建立頁面：**
```
mcp__notion__notion-create-pages
資料庫：https://www.notion.so/32c3886511fa808e9754ea1f18248d92
屬性：
  - 任務名稱：純問題描述（不含序號）
  - 序號：{MODULE}-{NNN}
  - 任務類型：Open Question
  - 狀態：未開始
  - 優先順序：高 / 中 / 低
  - Feature：對應模組頁面（relation）
  - 參考資料連結：問題來源的原始連結（必填）
```

---

## 模式 C：更新

### OQ 已解答

```
mcp__notion__notion-update-page
page_id: {OQ 頁面 ID}
更新：
  - 狀態 → 已完成
  - 決議與理由：填寫最終決策結論與判斷依據（必填；這是 BRD 引用的唯一正本）
    格式：「決議：[採用方案 X / 確認做法]。理由：[1-2 句說明判斷依據]。」
  - 說明欄：可補充討論過程或替代方案比較（選填，保留原有說明）
```

> BRD 引用格式：在功能說明中以括號標注 OQ 連結，例如「採系統自動執行審稿狀態轉換（詳見 OQ-ORD-008）」。決策細節不重複寫入 BRD，以 OQ 為正本。

### OQ 說明補充

```
mcp__notion__notion-update-page
page_id: {OQ 頁面 ID}
更新：說明欄（追加新資訊，保留原有內容）
```

### OQ 有依賴關係

建立後補設 `相關問題` relation，指向所依賴的 OQ 頁面。

---

## 模組前綴對照

| 模組 | 前綴 |
|------|------|
| 需求單 | QR |
| 訂單管理 | ORD |
| 工單管理 | WO |
| 印件 | PI |
| 生產任務 | PT |
| 出貨單 | SHP |
| 跨模組 | XM |
