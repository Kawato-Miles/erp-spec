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
- [ ] Step 0.5：觸發 senior-pm（前期介入模式），確認問題框架
- [ ] Step 1：確認範圍與問題定義
- [ ] Step 2：載入必要背景資源
- [ ] Step 3：觸發 product-management:feature-spec skill
- [ ] Step 4：依模板撰寫草稿
- [ ] Step 4.5：三視角審查（senior-pm + ceo-reviewer + erp-consultant 平行執行）
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

### Step 0.5：觸發 senior-pm（前期介入模式）

**在確認範圍之前，先觸發 `senior-pm` agent 執行問題框架報告。**

目的：確保 Spec 動筆前，問題定義、使用者需求、成功指標方向是正確的。

```
觸發：
- Agent: senior-pm（傳入需求背景描述 + 涉及模組）
- 模式：前期介入模式（Step 0.5）
```

收到問題框架報告後：
1. 確認「開始 Spec 前必須確認的問題」是否需要先解答（若有，轉為 OQ 或與 Miles 確認後再繼續）
2. 以問題框架報告的結論作為 Step 1 確認範圍的輸入

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
| 所有 ERP Spec | Notion 產品目標（https://www.notion.so/32c3886511fa81359354e33087d23f23）（KPI 對齊）；KPI DB（https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f）（各模組可量化指標） |
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

**BRD 內容**（Notion）：問題陳述、商業目標、範疇、設計決策（若有）、相依性與風險、變更紀錄

**Notion Properties 同步規則（每次建立或更新 BRD 時執行）：**

文件元資料不寫入 BRD body，統一透過 `mcp__notion__notion-update-page` 維護頁面屬性欄：

| Property 欄位 | 對應值 | 更新時機 |
|--------------|--------|---------|
| Version | 當前版本號（如 `v0.1`） | 每次 BRD 有實質內容異動 |
| Status | `草稿` / `審核中` / `核准` | 狀態變更時 |
| Last Edited | 當日日期 | 每次更新 |
| Related Modules | 下游 / 依賴模組 | 首次建立，異動時更新 |
| Target Version | 預計商業 Phase（如 `Phase 1`） | 首次建立 |

skill/agent 讀取元資料：`mcp__notion__notion-fetch`（讀 properties）或 `CLAUDE.md § Spec 規格檔清單`（本地快速索引）。

> KPI 指標維護於 [KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)（以 Feature 篩選），撰寫 BRD 時需對照確認指標已建立；User Story 維護於 [User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d)（以 Feature 篩選），撰寫 BRD 時需確認相關 Story 已存在或同步新增。兩者均不在 BRD 頁面內展示。

> BRD 完成後，執行 `notion-to-github` skill 建立 GitHub PRD Issues（Parent + Sub-issues）。

**重要預設規則：**

| 規則 | 說明 |
|------|------|
| 角色驗證優先 | 撰寫流程說明時，逐一檢查執行者角色是否符合 Notion User Story DB（https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d）與 Notion 使用者情境；若有矛盾立即停止並回報用戶修正 |
| 關聯 User Story | BRD 的使用者情境段落應引用 Notion User Story DB，不直接寫故事描述；若創建新 User Story，應同步新增至 Notion DB |
| 資料模型以 Notion 為正本 | 欄位定義統一維護於 Notion 資料欄位 DB（https://www.notion.so/32c3886511fa803e9f30edbb020d10ce）；PRD 不重複定義欄位；涉及新增 / 修改欄位時，先更新 Notion DB，再在 PRD 中記錄異動欄位的 Notion 連結與業務規則 |
| 新增欄位須填 `排序` 值 | 在 Notion 資料欄位 DB 新增欄位時，必須填寫 `排序` 欄位（數字），依 UI 閱讀順序排列：從 `id`（= 1）開始，依序為識別碼 → 所屬上層 FK → 核心業務欄位 → 狀態 / 金額 / 計算欄位 → 備註類 → 系統時間戳（created_at / updated_at）。各資料表使用 100 為間距（QuoteRequest = 1–99、QuoteRequestItem = 101–199 …），新欄位插入時取所在區段的空號即可 |
| 測試計畫不寫 | 測試案例獨立維護於 Notion ERP Test Case DB；Spec 完成後觸發 `erp-test-case` skill 建立對應 TC |
| Ragic = 歷史基準 | Ragic 視為遷移前系統，**不納入新系統設計**；僅用於遷移前後 KPI 對比 |
| 需求格式 | 「系統應…（System shall）」，每條需求含可測試驗收條件 |
| 避免模糊詞 | 不用「更好」「更快」「某些情況」，改為具體數字或行為 |

### Step 4.5：三視角多輪討論（Senior PM + CEO + ERP 顧問）

BRD 草稿完成後，在 OQ 同步前執行。依「三視角多輪討論協議」執行，三個 agent 自主討論至收斂後才輸出給 Miles。

協議全文：`.claude/agents/knowledge/multi-agent-discussion-protocol.md`

**三個 Agent 的審查重心：**

| Agent | 審查重心 |
|-------|---------|
| senior-pm | 問題定義品質、使用者需求對齊、KPI 可量化性、範疇邊界清晰度 |
| ceo-reviewer | 業務可行性、現場運作合理性、導入阻力與 ROI |
| erp-consultant | 狀態機完整性、資料一致性、系統設計與現有架構的一致性 |

**執行步驟：**

```
Round 1（平行）：
- Agent: senior-pm（傳入 BRD 草稿全文 + Notion 連結，指定「Round 1」）
- Agent: ceo-reviewer（同上）
- Agent: erp-consultant（同上）

Round 2（平行，帶入 Round 1 全文）：
- Agent: senior-pm（傳入 BRD + CEO Round 1 + ERP顧問 Round 1，指定「Round 2」）
- Agent: ceo-reviewer（傳入 BRD + PM Round 1 + ERP顧問 Round 1，指定「Round 2」）
- Agent: erp-consultant（傳入 BRD + PM Round 1 + CEO Round 1，指定「Round 2」）

收斂判斷（Claude 執行）：
- 若仍有「不同意」且影響結論 → 執行 Round 3
- 否則 → 進入最終彙整

Round 3（視需要，僅針對未解爭議）：同 Round 2 格式

最終彙整（依協議格式輸出給 Miles）
```

**收到彙整結論後：**
1. 必須處理項目：依 `multi-agent-discussion-protocol.md` § 討論後寫入流程處理
   - BRD 內容修改 → 觸發 senior-pm Mode B（規劃 → Miles 確認 → 執行）
   - 轉為 OQ → 觸發 `oq-manage` skill
   - 記錄已知風險 → Claude 新增後請 Miles 確認
2. 未解爭議：列出選項交 Miles 決定
3. 確認無重大問題後才進入 Step 5

### Step 5：識別與同步 Open Questions（Notion）

OQ 唯一正本在 Notion Follow-up DB。

**撰寫 Spec 中識別到不確定項時，觸發 `oq-manage` skill（模式 B：新增）。**

OQ 建立格式、去重流程、序號規則，統一依 `oq-manage` SKILL.md 執行，不在此重複定義。

### Step 6：Task 結束同步檢查 + 稽核

Spec 完成後，觸發 `doc-audit` skill 執行完整稽核：

```
觸發：doc-audit skill（強制，不判斷是否需要）
```

`doc-audit` skill 涵蓋：
- 索引層稽核（`audit-erp-docs.sh`）
- 跨檔案邏輯一致性檢查（狀態機 / 商業流程 / OQ / 欄位 / 角色 / User Story / CLAUDE.md）
- 自我演化：識別是否有新內容需加入稽核清單

詳見 `.claude/skills/doc-audit/SKILL.md`。

---

## 格式與風格規範

- **語言**：繁體中文（技術術語保留英文，如 WO、BOM、FK、UUID、API）
- **使用者故事**：`作為 [角色]，我想要 [功能]，以便 [目的]`
- **優先級**：P0（必做）/ P1（重要）/ P2（Nice-to-have）

### Phase 命名規範（避免混用）

ERP 文件中「Phase」有兩個層級：

| 層級 | 定義 | 範例 |
|------|------|------|
| **商業 Phase**（產品路線圖）| 產品目標 § 三 定義的整體開發階段（Phase 1 = BOM、Phase 2 = 線下訂單、Phase 3 = EC 整合）| 商業 Phase 2 |
| **模組 Phase**（功能迭代）| 單一模組內的功能分批交付 | Phase 1、Phase 2 |

**規則**：
1. **同文件脈絡內**直接寫 `Phase 1` / `Phase 2`，讀者清楚是指本文件所定義的 Phase，無需加前綴
2. **跨文件引用**時，必須加上來源標題前綴 + 來源連結，避免混淆
   - 引用商業 Phase：`商業 Phase 2`（連結至[產品目標 § 三](https://www.notion.so/32c3886511fa81359354e33087d23f23)）
   - 引用其他模組的 Phase：`工單管理模組 Phase 1`（連結至該模組 Spec）
3. KPI 目標期限引用商業 Phase 時，寫完整描述：`商業 Phase 2 上線後第 N 個月`

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

> GitHub PRD Issues（Parent + Sub-issues）由 `notion-to-github` skill 負責建立，`erp-spec` 不建立 GitHub Issues。

---

## 參考資源

| 資源 | 路徑 |
|------|------|
| **Notion URL 索引（唯一正本）** | `memory/shared/notion-index.md` |
| BRD 模板（Notion） | `references/brd-template.md` |
| PRD Parent Issue 模板（GitHub，模組層） | `.claude/skills/notion-to-github/references/prd-parent-template.md` |
| PRD Sub-issue 模板（GitHub，子功能層） | `.claude/skills/notion-to-github/references/prd-sub-template.md` |
| ERP 全局資料模型 | Notion 資料欄位 DB：https://www.notion.so/32c3886511fa803e9f30edbb020d10ce |
| 通用工作原則 | `memory/shared/principles.md` |
| UI 設計系統（Ant Design 規範） | `memory/shared/ui-design-system.md` |
| ERP 產品目標 / KPI | Notion 產品目標：https://www.notion.so/32c3886511fa81359354e33087d23f23 |
| 成功指標 KPI DB | Notion KPI DB（各模組可量化指標，以 Feature 篩選）：https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f |
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
