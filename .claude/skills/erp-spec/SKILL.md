---
name: erp-spec
description: >
  印刷業 ERP 功能規格書（Spec / PRD）撰寫 skill。
  觸發時機：Miles 說「寫 ERP spec」「寫 ERP PRD」「ERP 規格書」「規劃 [模組] 的需求文件」，
  或討論任何 ERP 模組（需求單 / 訂單 / 工單 / 印件 / 生產任務 / QC / 出貨 / 採購 / 倉儲）的功能設計時。
  此 skill 自動完成：確認範圍 → 載入最小必要資源 → 觸發 product-management:feature-spec →
  依標準模板撰寫草稿 → 識別 OQ → 執行文件同步稽核 → commit。
  不適用：純流程討論（不需輸出文件）、只查詢術語或狀態機、圖編相關功能。
---

# ERP Spec 撰寫

適用於印刷業 ERP 系統各模組的功能規格書（Spec / PRD）撰寫。

---

## 撰寫工作流程

依序完成以下步驟，可在回應中附上 Checklist 讓 Miles 追蹤進度：

```
Spec 撰寫進度：
- [ ] Step 0：查詢 Notion OQ DB，列出本次相關 OQ
- [ ] Step 1：確認範圍與問題定義
- [ ] Step 2：載入必要背景資源
- [ ] Step 3：觸發 product-management:feature-spec skill
- [ ] Step 4：依模板撰寫草稿
- [ ] Step 5：識別與同步 Open Questions（Notion）
- [ ] Step 6：Task 結束同步檢查 + 稽核
```

### Step 0：查詢 Notion OQ DB

**每次討論需求或撰寫 Spec 前自動執行。**

1. 識別本次涉及的模組（依 Feature relation 篩選）
2. 查詢 Notion Follow-up DB OQ view，取得：任務類型=Open Question + 狀態=未開始 + 對應模組
3. 在回應中列出相關 OQ（ID、標題、優先），讓 Miles 確認哪些帶入討論

> 查詢工具：`mcp__notion__notion-query-database-view`，view_url 使用 OQ view：
> https://www.notion.so/32c3886511fa808e9754ea1f18248d92?v=32c3886511fa8081878c000cab1b455b

---

### Step 1：確認範圍與問題定義

若 Miles 未提供，**撰寫前**先確認：

| 問題 | 說明 |
|------|------|
| 核心痛點 | 這個功能要解決什麼問題？誰的問題？ |
| 使用者角色 | 業務、印務主管、排程、倉管、採購、系管？ |
| 範圍邊界 | 哪些在 scope？哪些明確 out of scope？ |
| 成功標準 | 上線後怎樣算成功？（對照 `product-goals.md` KPI） |
| 相關模組 | 需參考哪條狀態機？ |

> 若無法確認，保留 `TBD` 並標記為 OQ，不靜默跳過。

### Step 2：載入必要背景資源

依功能類型選取最小必要檔案：

| Spec 類型 | 必讀 |
|-----------|------|
| 需求單 / 訂單 / 工單 / 印件 | Notion 狀態變化 § 上層 + Notion 商業流程 + Notion 使用者情境 + Notion 業務情境 DB |
| 生產任務 / QC / 出貨單 | Notion 狀態變化 § 下層 + Notion 商業流程 + Notion 使用者情境 + Notion 業務情境 DB |
| 跨上下層流程 | Notion 狀態變化（上層 + 下層）+ Notion 商業流程 + Notion 使用者情境 + Notion 業務情境 DB |
| 所有 ERP Spec | Notion 產品目標（https://www.notion.so/32c3886511fa81359354e33087d23f23）（KPI 對齊） |
| Prototype / 介面設計規格 | `memory/shared/ui-design-system.md`（Ant Design 規範、元件、版型） |

**重要**：以下四個檔案是**所有 Spec 撰寫的必讀基礎**（提供邏輯、用戶與情境背景）：
- Notion 商業流程（https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a）→ 核心業務規則與決策邏輯
- Notion 使用者情境（https://www.notion.so/32c3886511fa8144b38adc9266395d15）→ 角色權責定義與權限範圍 **← 含角色驗證（Who 執行什麼動作）**
- Notion User Story DB（https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d）→ 具體的業務故事集（US-001 ~ US-015），供 Spec 關聯引用 **← 含各角色的操作流程與成功條件**
- Notion 業務情境 DB → PM 視角情境驗證與邊界案例（https://www.notion.so/3163886511fa808a9d9bda01dc812206）

**⚠️ 角色驗證檢查點**（避免「業務出貨」等角色混淆）：
- 撰寫時逐一檢查流程中的每個動作是否指定了正確的執行角色
- 對照 Notion 使用者情境（https://www.notion.so/32c3886511fa8144b38adc9266395d15）中各角色的權責範圍（業務、審稿、印務、生管、QC、出貨等）
- 若發現角色分工不合理，應先回報用戶修正 Notion 使用者情境，再續寫 Spec

通用原則（OQ 管理、Spec 撰寫規範、角色驗證）一律參照 `memory/shared/principles.md`，無需重複載入。

### Step 3：觸發 product-management:feature-spec

**每次撰寫 Spec 前必須先調用此 skill**，確保 PM mindset 完整納入：
- 問題陳述、使用者故事、成功指標（KPI）、非目標（Out of Scope）

### Step 4：依模板撰寫 BRD 草稿（Notion）

`erp-spec` skill 的唯一輸出物為 **Notion BRD**，GitHub PRD Issues 由 `notion-to-github` skill 負責建立。

| 輸出物 | 模板 | 存放位置 |
|--------|------|----------|
| BRD（商業需求文件） | `references/brd-template.md` | Notion Feature Database 對應頁面 |

Notion 頁面 ID 見 `CLAUDE.md` § Spec 規格檔清單。

**BRD 內容**（Notion）：問題陳述、商業目標、KPI（含商業目標對應欄）、範疇、使用者情境、相依性與風險、OQ 索引、變更紀錄

> BRD 完成後，執行 `notion-to-github` skill 建立 GitHub PRD Issues（Parent + Sub-issues）。

**重要預設規則：**

| 規則 | 說明 |
|------|------|
| 角色驗證優先 | 撰寫流程說明時，逐一檢查執行者角色是否符合 Notion User Story DB（https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d）與 Notion 使用者情境；若有矛盾立即停止並回報用戶修正 |
| 關聯 User Story | BRD 的使用者情境段落應引用 Notion User Story DB，不直接寫故事描述；若創建新 User Story，應同步新增至 Notion DB |
| 資料模型以 Notion 為正本 | 欄位定義統一維護於 Notion 資料欄位 DB（https://www.notion.so/32c3886511fa803e9f30edbb020d10ce）；PRD 不重複定義欄位；涉及新增 / 修改欄位時，先更新 Notion DB，再在 PRD 中記錄異動欄位的 Notion 連結與業務規則 |
| 測試計畫不寫 | 測試案例獨立維護於 Notion ERP Test Case DB；Spec 完成後觸發 `erp-test-case` skill 建立對應 TC |
| Ragic = 歷史基準 | Ragic 視為遷移前系統，**不納入新系統設計**；僅用於遷移前後 KPI 對比 |
| 需求格式 | 「系統應…（System shall）」，每條需求含可測試驗收條件 |
| 避免模糊詞 | 不用「更好」「更快」「某些情況」，改為具體數字或行為 |

### Step 5：識別與同步 Open Questions（Notion）

OQ 唯一正本在 Notion Follow-up DB，不再使用本地 `open-questions.md`。

**撰寫 Spec 中識別到不確定項時，依層級處置：**

| 類型 | 動作 |
|------|------|
| 功能局部問題（僅影響此模組）| 在 Notion 建立新 OQ 條目（Feature 指向對應模組）|
| 跨模組 / 架構問題 | 在 Notion 建立新 OQ 條目（Feature 留空或指向主要影響模組，ID 前綴用 XM）|

**OQ ID 命名規則**：`{MODULE}-{NNN}`，序號從 Notion DB 現有最大號 +1

**討論收斂後，依情況執行：**

| 情況 | 動作 |
|------|------|
| 新增 OQ | `mcp__notion__notion-create-pages`，填入任務名稱、說明（含 ID）、優先順序、狀態=未開始、Feature、參考資料連結（問題來源的原始連結，如 Notion 留言 URL、Slack 訊息連結） |
| OQ 已解答 | `mcp__notion__notion-update-page`，狀態 → 已完成；說明欄補充決策內容 |
| OQ 說明更新 | `mcp__notion__notion-update-page`，更新說明欄 |
| OQ 有依賴關係 | 建立後補設 `相關問題` relation |

**Section 12 格式（參照節點）**：
- 正本為 Notion OQ DB；Section 12 只顯示 ID + 一行摘要 + 狀態
- 有 OQ 時：列出 ID 清單；無 OQ 時：填「本模組目前無待確認事項」

### Step 6：Task 結束同步檢查 + 稽核

Spec 完成後，依序執行：

**① 連帯更新確認（完整同步規則）**

修改任何檔案時，應立即檢查連帯相關檔案。詳見：

**→ `memory/erp/spec-iteration-workflow.md` § 迭代中「修改任何檔案 → 連帯檢查相關檔案」**

Spec 完成時，按該檔案的 10 項規則逐項驗證即可。

**② 迭代驗證規則**

多檔案相互驗證規則（state-machines / business-process / scenarios / user-scenarios / test-cases / open-questions 之間的邏輯一致性檢查）詳見：

**→ `memory/erp/spec-iteration-workflow.md` § 迭代中「更新參考檔案 → 檢查跨檔案一致性」**

Spec 完成時，按該檔案的清單逐項驗證即可。

---

**③ 執行自我稽核腳本**

```bash
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```

稽核結果若出現 ⚠️，依提示補充索引後再 commit。ℹ️ 為提示項，確認後決定是否補充。

**注意**：此稽核腳本檢查「檔案索引」層面的一致性。邏輯一致性檢查見 `memory/erp/spec-iteration-workflow.md`。

**建議執行時機**：
- 迭代驗證（邏輯層）：Spec 完成後，按 spec-iteration-workflow.md § 迭代後執行
- 稽核腳本（索引層）：新增文件後、定期（每週）、或發現文件不一致時執行

---

## 格式與風格規範

- **語言**：繁體中文（技術術語保留英文，如 WO、BOM、FK、UUID、API）
- **使用者故事**：`作為 [角色]，我想要 [功能]，以便 [目的]`
- **優先級**：P0（必做）/ P1（重要）/ P2（Nice-to-have）

---

## 印刷 ERP 特定注意事項

| 模組 | 特殊考量 |
|------|----------|
| 生產排程 | 機台換線時間、版費成本、廢張比例、急單插入邏輯 |
| 採購 | 紙張規格多元（磅數 × 尺寸 × 類型）、供應商交期差異 |
| 倉儲 | FIFO 紙張管理、批次追蹤、保存條件 |
| 訂單管理 | 稿件狀態與生產狀態連動、交期計算需扣除假日 |
| 需求單 | 業務報價流程、成本評估（印務主管）、成交 / 流失分流 |

---

## 輸出物

1. **BRD（Notion 頁面）**：依 `references/brd-template.md` 結構，直接寫入 Notion Feature Database 對應頁面；著重商業目標、KPI、使用者情境、範疇
2. **OQ 索引（BRD § 待確認事項）**：顯示本模組與相關跨模組 OQ 的 ID + 摘要，正本在 Notion Follow-up DB

> GitHub PRD Issues（Parent + Sub-issues）由 `notion-to-github` skill 負責建立，`erp-spec` 不建立 GitHub Issues。

---

## 參考資源

| 資源 | 路徑 |
|------|------|
| BRD 模板（Notion） | `references/brd-template.md` |
| PRD Parent Issue 模板（GitHub，模組層） | `.claude/skills/notion-to-github/references/prd-parent-template.md` |
| PRD Sub-issue 模板（GitHub，子功能層） | `.claude/skills/notion-to-github/references/prd-sub-template.md` |
| ERP 全局資料模型 | Notion 資料欄位 DB：https://www.notion.so/32c3886511fa803e9f30edbb020d10ce |
| 通用工作原則 | `memory/shared/principles.md` |
| UI 設計系統（Ant Design 規範） | `memory/shared/ui-design-system.md` |
| ERP 產品目標 / KPI | Notion 產品目標：https://www.notion.so/32c3886511fa81359354e33087d23f23 |
| 狀態機（上層：需求單 / 訂單 / 工單） | Notion 狀態變化：https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 |
| 狀態機（下層：任務 / QC / 出貨） | 同上（頁面下半段）|
| 待確認事項（OQ） | Notion Follow-up DB：https://www.notion.so/32c3886511fa808e9754ea1f18248d92 |
| 情境驗證（PM 視角）| Notion 業務情境 DB：https://www.notion.so/3163886511fa808a9d9bda01dc812206 |
| User Story（業務故事集） | Notion User Story DB：https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d |
| 使用者情境（角色權責定義） | Notion 使用者情境：https://www.notion.so/32c3886511fa8144b38adc9266395d15 |
| 業務流程（核心規則） | Notion 商業流程：https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a |
| ERP 術語表 | `memory/erp/glossary.md` |
| 共用術語 | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
