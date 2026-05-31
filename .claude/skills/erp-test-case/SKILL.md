---
name: erp-test-case
description: >
  ERP 模組 UAT 驗收項目（test-case）撰寫與管理 skill。
  正本：Vault `memory/Sens_wiki/wiki/erp/15-test-cases/`（索引卡，2026-05-31 架構）。
  正文（前置 / 步驟 / 預期）存 Notion ERP Test Case DB；Vault 索引卡只承載 frontmatter（往上指 user-story 依據 + 往下指 OpenSpec/Prototype 實作）+ happy/edge 案例索引 + 相關連結。
  觸發時機：Miles 說「寫 test case」「建立測試案例」「寫 [模組] 測試」「補 test case」「推 test case 到 Notion」，
  或任何需要為 ERP 模組建立 / 更新 UAT 驗收項目時。
  此 skill 強制：驗收種子取自 user-story 的 Gherkin 成功條件（正向→happy、守衛→edge）；UI 點擊層歸 Prototype e2e、不寫進 test case 步驟（步驟為業務動作）。
  **強制規則（禁止以下 anti-pattern）**：
    1. Vault 索引卡內禁放 test-case 正文（前置 / 步驟 / 預期完整內容在 Notion，Vault 只索引）
    2. `source` MUST 指 user-story 卡（驗收依操作步驟）；禁指同層 test-case / business-logic / 下層 / OpenSpec
    3. 測試步驟禁 UI 點擊措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Side Panel / 表格欄位 / 篩選器）；步驟為業務動作，UI 點擊歸 Prototype e2e
    4. happy path 與 edge case 分成兩張表（不混同一表）
    5. 識別到不確定項 MUST 觸發 [[oq-manage]] mode B 開獨立 OQ 卡，不可只 inline 標注
    6. 建立 / 更新後 MUST 回填對應 user-story 卡 frontmatter `related-test-cases` 的 Vault wiki link（雙向可達）
    7. 禁中英夾雜（英文欄位 / 實體名一律介面中文，技術詞括號附註）
    8. Notion 推送單元以 `tc-id` 為唯一鍵；既有 update、不存在 create，禁建重複
  不適用：SIT / UT 測試設計、Prototype 功能驗證（屬 Playwright e2e）、純 QA 技術討論、requirement-level 工程驗收（屬 OpenSpec spec § Scenarios）。
---

# ERP Test Case（驗收項目）管理

印刷業 ERP 系統 UAT 業務層驗收項目的撰寫與管理。**索引正本在 Vault**（`15-test-cases/`），**正文在 Notion** ERP Test Case DB。

撰寫 / 稽核基準正本：[[../../memory/Sens_wiki/wiki/erp/15-test-cases/_template-test-case|_template-test-case]]。

---

## 架構（2026-05-31 定案）

| 層 | 落點 | 內容 |
|----|------|------|
| 驗收索引卡 | Vault `15-test-cases/<module>/TC-<MODULE>-<NNN>-<簡述>.md` | frontmatter（source↑user-story、implemented-by↓OpenSpec/Prototype）+ happy/edge 案例索引表 + 相關連結 |
| 驗收正文 | Notion ERP Test Case DB | 前置條件 / 測試步驟 / 預期結果（前提→動作→驗收結果三段）|
| UI 點擊操作 | Prototype 端對端測試（Playwright spec）| 由索引卡 `implemented-by` 指向 |

依據鏈：`test-case`（驗收項目，source↑）→ `user-story`（操作步驟）→ `business-logic`（規則正本）。Test Scenario 分組由**目錄（module）+ 卡內 happy/edge 索引**承擔，不另立 scenario 卡（2026-06-01 定案）。

---

## UAT 核心原則

| 原則 | 說明 |
|------|------|
| 使用者視角 | 步驟與預期結果從業務操作行為出發，非系統內部邏輯 |
| 業務動作非 UI 點擊 | 步驟寫「業務對訂單發起補收 6000」，非「點詳情頁→按新增→輸入→送出」（UI 點擊歸 Prototype e2e）|
| 可驗證性 | 預期結果為可勾稽具體值（狀態名 / 金額變化 / 是否允許），非「應該正確 / 成功了沒」|
| 前置條件明確 | 用可觀測具體值（真實編號 / 金額 / 狀態），非抽象範圍 |
| happy / edge 分區 | 正常情境與邊界 / 異常情境分兩張表，案例之間不重疊、合起來涵蓋所有情況 |
| 避免 SIT/UT | 不測 API 回應碼、DB schema、程式邏輯分支 |

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| **A：新增 Test Case** | Miles 說「寫 test case」「建立測試案例」「寫 [模組] 測試」/ 識別到某 user-story 成功條件須具體化為驗收 |
| **B：補充 / 更新** | Miles 說「補 test case」「加 edge case」/ user-story 成功條件更新後同步驗收 |
| **C：推送 Notion** | Miles 說「推 test case 到 Notion」「同步 test case」|

---

## 模式 A：新增 Test Case

### Step A1：確認模組與來源 user-story

- 此驗收屬哪個模組？（對齊 [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema#二、module Enum（多選）|module enum]]）
- 對應哪張 user-story 卡（驗收的操作步驟來源）？一張 TC 對一張 user-story 的某情境群。
- 查現有最大 NNN（掃 `15-test-cases/<module>/`），從下一號開始；ID `TC-<MODULE>-<NNN>`（NNN 三位補零）。

### Step A2：讀取背景

- **來源 user-story 卡**（`13-user-stories/<module>/US-<MODULE>-<NNN>`）：取其 Gherkin 成功條件作為驗收種子——**正向達成型 → happy path、禁止/守衛型 → edge case**。
- 對應 spec `openspec/specs/<module>/spec.md` § Requirements（補充驗收標準）。
- 規則正本卡 `04-business-logic/<...>`（守衛規則的判斷依據）。

### Step A3：建立 Vault 索引卡

1. 複製 [[../../memory/Sens_wiki/wiki/erp/15-test-cases/_template-test-case|_template-test-case]] 範本內容。
2. 填 frontmatter（type=test-case / tc-id / module / business-domain / status / last-reviewed / source↑user-story / implemented-by↓ / notion-page-url 先留待 Step A4 後回填）。
3. 寫「這張卡要回答的問題」（以驗收問題列出，對應 happy/edge）。
4. 寫「營運背景」（2-3 句業務語言，連回 user-story 動機）。
5. 填「測試案例索引」：happy / edge 兩張表，逐案列案例編號（`TC-XX-NNN-H1` / `-E1`，語意前綴 H/E 不重排不重用）+ 一行情境摘要（含具體輸入值）。**正文不寫在此**。
6. 填「相關連結」（至少回連 source 的 user-story）。

### Step A4：建立 Notion 正文

於 Notion ERP Test Case DB 逐案建立正文頁（前提→動作→驗收結果三段）：

- **前置條件**：可觀測具體值（「訂單 #ORD-2026-0512 狀態=訂單完成、已開發票 1000、應收 1000」）。
- **測試步驟**：業務動作，**禁 UI 點擊措辭**（「業務對該訂單發起補收 6000」）。
- **預期結果**：可勾稽驗收值（「訂單異動狀態=已執行、應收由 1000 變 7000、未產生待主管審核項」）。

Notion DB 與屬性見 § Notion 對應。建立後取得各案例 Notion URL，回填 Vault 索引卡的 happy/edge 表「Notion 連結」欄與 frontmatter `notion-page-url`。

### Step A5：回填 user-story 雙向連結

對應 user-story 卡 frontmatter `related-test-cases` 補上本 TC 的 **Vault wiki link**：

```yaml
related-test-cases:
  - "[[../../15-test-cases/<module>/TC-<MODULE>-<NNN>-<簡述>]]"
```

（2026-06-01 由 Notion URL 改 Vault wiki link，與 [[erp-user-story]] 對齊。）

### Step A6：識別不確定項

撰寫中發現不確定（驗收邊界待釐清 / 規則待確認）→ **MUST 觸發 [[oq-manage]] mode B 開獨立 OQ 卡**，索引卡以 wiki link 引用，禁 inline 標注。

### Step A7：跑 lint

對照 [[../../memory/Sens_wiki/wiki/erp/15-test-cases/_template-test-case#六、自審檢查清單|_template-test-case § 六 自審清單]] 逐項檢查。關鍵：

```bash
# Vault 索引卡禁含正文步驟細節（步驟正文在 Notion）
# 測試步驟禁 UI 點擊措辭
grep -E "按鈕|下拉|彈窗|點擊|分頁|Tab|Side Panel|篩選器|表格欄位" <索引卡>
```

source 須指 user-story、happy/edge 分兩表、案例編號語意前綴。任一違反 → 修正才能 commit。

### Step A8：commit

```
feat: 新增 [模組] Test Case TC-XX-NNN <標題>

- 驗收 user-story US-XX-NNN 之 <情境>
- happy N 案 / edge M 案；正文落 Notion
- 已回填 US-XX-NNN related-test-cases wiki link

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 模式 B：補充 / 更新

- 加 edge case：在 happy/edge 表新增案例編號（不重排既有編號），補 Notion 正文，更新 `last-reviewed`。
- user-story 成功條件更新後：對照新增 / 調整對應驗收案例，維持「案例之間不重疊、合起來涵蓋所有情況」。
- 退役案例：編號退役不回收（避免歷史連結指向錯誤案例）。

---

## 模式 C：推送 Notion

### Step C1：列待推送清單

掃 `15-test-cases/<module>/`，列 status=active 且 `notion-page-url` 空 / 正文有更新者，報 Miles 確認範圍。

### Step C2：Notion 對應

**ERP Test Case DB**：https://www.notion.so/2b93886511fa817fbd65e7608726f036

| Vault 索引卡 | Notion property | 備註 |
|-------------|-----------------|------|
| `tc-id` | ID | 唯一鍵（`TC-<MODULE>-<NNN>`）|
| 標題 H1 | 文件名稱 | 動詞 / 名詞片語 |
| `module` | 功能模組 | 缺選項先 ALTER COLUMN |
| happy 案 | 類型=Core / Smoke | P0/P1 + 高影響風險 |
| edge 案 | 類型=Extended | P2 + 中/低 |
| 前後台 | Dashboard | ERP 固定電腦版 |

正文頁面格式（前置 / 步驟 / 預期三段）見 § Notion 正文格式。

### Step C3：配對 tc-id

以 `tc-id` 為唯一鍵：既有 → update、不存在 → create，**禁建重複**。

### Step C4：回填與 commit

回填 Vault 索引卡 `notion-page-url`（與各案例 URL）；commit 推送清單。

---

## Notion 正文格式（前置 / 步驟 / 預期）

每個 Test Case 的 Notion 頁面內容固定格式：

```
[描述段落：條列此 TC 驗證的核心重點，2-4 個要點，bullet list]

[code block（plain text）：與描述段落相同]

### 測試資料：

<callout icon="💡" color="gray_bg">
	前置條件：[系統初始狀態、帳號角色、測試資料；可觀測具體值]
</callout>

### 步驟：

1. [業務動作，禁 UI 點擊措辭]
2. ...

### 預期結果：

1. [可勾稽驗收值，對應步驟]
2. ...
```

> 描述段落 bullet（`-`）；code block 設 `plain text`；callout 用 `<callout icon="💡" color="gray_bg">`；步驟與預期 numbered list 且一一對應。

---

## 參考資源

> 完整 Notion URL 索引見 `memory/shared/notion-index.md`（唯一正本）。

| 資源 | 路徑 |
|------|------|
| Vault 索引卡正本 | `memory/Sens_wiki/wiki/erp/15-test-cases/<module>/` |
| 撰寫 / 稽核範本 | [[../../memory/Sens_wiki/wiki/erp/15-test-cases/_template-test-case]] |
| ERP Test Case DB（Notion 正文） | https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| 來源 user-story（驗收種子） | [[erp-user-story]] + `13-user-stories/<module>/` |
| 各模組 OpenSpec spec（正本） | `openspec/specs/{模組}/spec.md` |
| 不確定項處理 | [[oq-manage]] |
