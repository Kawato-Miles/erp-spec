# Memory

## Me
Miles，印刷業 PM，負責兩個產品：**ERP 系統**（生產排程 / 採購 / 倉儲）與**線上圖編輯器**（B2B SaaS 設計工具）。

---

## 產品

| 產品 | 簡稱 | 說明 |
|------|------|------|
| **ERP 系統** | ERP | 涵蓋生產排程、採購、倉儲、客戶訂單管理 |
| **線上圖編輯器** | 圖編 / 圖編器 | B2B SaaS，讓印刷客戶自助設計稿件 |

→ 深度術語：`memory/erp/glossary.md`、`memory/graphic-editor/glossary.md`

---

## PM 工作模式

### PM 技能（依情境主動觸發）

| 情境 | 技能 |
|------|------|
| 撰寫功能規格 / PRD | `product-management:feature-spec` |
| 關係人更新 / 週報 / 決策備忘 | `product-management:stakeholder-comms` |
| Roadmap 規劃 / 優先排序 | `product-management:roadmap-management` |
| 整理用戶訪談 / 研究資料 | `product-management:user-research-synthesis` |
| KPI 設計 / 指標分析 | `product-management:metrics-tracking` |
| 競品分析 | `product-management:competitive-analysis` |

### 生產力工具

| 情境 | 技能 |
|------|------|
| 追蹤本次討論的待辦 | `productivity:task-management` |
| 新增術語 / 更新記憶檔 | `productivity:memory-management` |

---

## PM 工作原則（指導 Task / Spec 執行）

> 確保 ERP Prototype 著重於**規格、邏輯、問題、指標**的驗證，而非過早實現代碼。

### 核心原則

**1. Prototype 優先於實現**
- 目標：驗證「實際需要製作的產品是什麼」與「隱藏的問題是什麼」
- 做法：優先產出規格、流程圖、計算邏輯、情境驗証，**不寫實現代碼**
- 反例 ❌：直接給出程式碼範例、SQL schema、API 簽名
- 正例 ✅：設計欄位邏輯、驗證計算流程、列舉邊界情況

**2. 邏輯驗證優於空談**
- 每次設計決策都應附帶：具體例子、計算驗証、情境測試
- 反例 ❌：「這樣設計比較好」（缺乏驗証）
- 正例 ✅：「例子 1、2 驗算結果如下…」、「情境 6 中木桶理論適用…」

**3. 問題優先於方案**
- 發現設計缺陷時，先清楚描述「問題是什麼」，再提出修正方案
- 反例 ❌：直接給出 A、B、C 三個方案，模糊問題背景
- 正例 ✅：「當一個任務內有多個生產任務時，倍數無法個別定義 → 修正：新增 ProductionTask 層的 quantity_per_work_order」

**4. 指標量化優於定性判斷**
- 設計時應考慮：如何度量是否達成目標？
- 範例：「印件完成數計算精確度」、「避免 N 份工單遺漏」、「支援複雜場景（一任務多生產任務）」
- 應用：異動流程驗証時，要檢查「quantity_per_work_order 調整後是否正確重算」

**5. 文件即規格**
- 所有決策應記錄在相關檔案（business-process.md、data-model.md、scenarios.md）
- 設計時應對照檔案檢查一致性（如本次發現 data-model.md 缺欄位）
- 每次修訂應註記版本與理由

### 執行檢查清單

**Task 開始前**
- [ ] 理解目標：此 Task 是為了「驗證什麼」？（邏輯、需求、問題？）
- [ ] 載入上下文：相關的文件檔案是否已讀？（scenarios.md、business-process.md？）
- [ ] 預期輸出：此 Task 應產出「規格文件」、「驗証報告」還是「流程圖」？

**Task 執行中**
- [ ] 逐層驗証：設計是否涵蓋了「所有情境」與「邊界情況」？
- [ ] 避免程式碼：計算邏輯用偽碼或伪代碼表達，不寫實現代碼
- [ ] 追蹤問題：若發現新問題（如本次的倍數個別定義），立即記錄為「缺陷」或「OQ」

**Task 完成後**
- [ ] 文件同步：相關的 .md 檔案是否同步更新？
- [ ] 版本記錄：data-model.md、scenarios.md 的版本號是否遞增？
- [ ] 追蹤清單：是否列出後續待辦（state-machines.md 補充、open-questions.md 澄清）？

### 文件同步與稽核規則（Spec / Prototype 迭代必執行）

Spec 或 Prototype 完成後，依序執行三層檢查，確保參考文件的一致性。完整規則見 `.claude/skills/erp-spec/SKILL.md` Step 6。

**① 連帶更新確認（完整同步規則）**

修改任何文件時，應連帶檢查與更新其他相關檔案：

| 修改對象 | 連帶檢查項 |
|---------|----------|
| `state-machines.md` / `state-machines-ops.md` | `scenarios.md` 附錄、`open-questions.md` |
| `open-questions.md` 確認問題 | 對應 `state-machines*.md` 補設計、`scenarios.md` 補情境、各 Spec 第 12 章同步 |
| `scenarios.md` 新增/修改情境 | `user-scenarios.md`、`test-cases.md`、`open-questions.md`（邊界情況標記） |
| `data-model.md` 欄位異動 | 對應 Spec 第 7 章、各使用該欄位的模組 Spec |
| 任何名稱異動 | `glossary.md` 術語更新 |

**② 多檔案相互驗證（邏輯一致性檢查）**

確保 state-machines / business-process / scenarios / user-scenarios / test-cases / open-questions 無邏輯矛盾：

| 修改對象 | 驗證檢查清單 |
|---------|-----------|
| **state-machines.md** | ☐ scenarios.md 情境是否仍符合新狀態轉移<br/>☐ test-cases.md 測試條件是否對應<br/>☐ user-scenarios.md 角色流程是否受影響<br/>☐ business-process.md 規則是否一致 |
| **scenarios.md** | ☐ 涉及狀態轉移是否都在 state-machines.md 定義<br/>☐ 是否有對應的 test-cases.md 測試<br/>☐ 角色行為是否與 user-scenarios.md 一致<br/>☐ 邊界情況是否在 open-questions.md 標記 |
| **test-cases.md** | ☐ 測試的狀態轉移是否在 state-machines.md 存在<br/>☐ 對應情境是否在 scenarios.md 驗證<br/>☐ 發現缺陷是否新增至 open-questions.md |
| **business-process.md** | ☐ 規則的狀態影響是否在 state-machines.md 反映<br/>☐ 實施情境是否在 scenarios.md 驗證<br/>☐ 角色責任是否與 user-scenarios.md 一致 |
| **user-scenarios.md** | ☐ 狀態轉移是否在 state-machines.md 定義<br/>☐ 假設/邊界是否與 scenarios.md 一致<br/>☐ 業務規則是否在 business-process.md 記錄 |

**常見矛盾模式（紅旗指標）**：
- ❌ state-machines.md 新增狀態，但 test-cases.md 沒有對應測試 → **補充測試**
- ❌ scenarios.md 假設和 user-scenarios.md 角色行為不符 → **檢查誰更正確，並統一**
- ❌ test-cases.md 發現邊界情況，但 open-questions.md 沒標記 → **新增 OQ**
- ❌ business-process.md 異動後，scenarios.md 和 state-machines.md 沒同步 → **逐項檢查補齊**

**執行方式**：
1. Spec 完成後，對照上表逐項檢查
2. 發現矛盾時，標記並記錄在 open-questions.md
3. 檢查通過後，在 Spec 末尾註記「§ 多檔案驗證已完成」

**③ 執行自我稽核腳本**

```bash
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```

稽核涵蓋五項：
1. `memory/erp/*.md` 與 CLAUDE.md 快速索引 ERP 資源的一致性
2. `memory/shared/*.md` 與 CLAUDE.md 共用資源的一致性
3. 關鍵 ERP 資源與本 SKILL.md 參考資源的一致性
4. `memory/erp/*.md` 與本 SKILL.md 提及的一致性
5. 本 SKILL.md 與 CLAUDE.md 工具索引的一致性

出現 ⚠️ 時依提示補充索引；ℹ️ 為提示項，確認後決定是否補充。

**建議執行時機**：
- ②：Spec 完成後，在 commit 前執行
- ③：新增文件後、定期（週一）、或發現文件不一致時執行

---

## 版本控管規範（Git）

**Commit 格式**：`{prefix}: {繁體中文描述}`

| Prefix | 使用時機 |
|--------|---------|
| `feat:` | 新增文件、功能描述 |
| `fix:` | 修正錯誤、補漏、澄清歧義 |
| `refactor:` | 結構調整，內容不變 |
| `docs:` | 更新說明性備註 |

**結尾必加**：`Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
**每次修改 memory/ 後，連同 CLAUDE.md 一起 commit。**
→ 文件同步規則與稽核腳本詳見 `.claude/skills/erp-spec/SKILL.md` Step 6

---

## 常用印刷業術語（熱快取）

| 縮寫 / 術語 | 意思 |
|-------------|------|
| 完稿 | Print-ready file，可直接送印的設計稿 |
| 出血 | Bleed，印刷裁切邊界外延伸的安全區域（通常 3mm） |
| 色彩模式 | CMYK（印刷）vs RGB（螢幕） |
| 網點 / 網花 | Halftone，印刷色調表現方式 |
| 拼版 | Imposition，多份稿件排列在同一印張上 |
| 印張 | Sheet，一次印刷的紙張單位 |
| 打樣 | Proofing，印刷前的樣稿確認 |
| 數位打樣 | Digital proof，螢幕 / 噴墨模擬色彩 |
| 色差 | Delta E / ΔE，色彩偏移量 |
| 紙張磅數 | GSM（每平方公尺克重） |
| 模切 | Die-cutting，按輪廓裁切紙張 |
| 上光 | Coating/Varnish，表面保護處理 |
| 燙金 | Foil stamping，金屬箔燙壓 |

→ 完整術語：`memory/shared/glossary.md`

---

## ERP 高頻術語（熱快取）

| 縮寫 / 術語 | 意思 |
|-------------|------|
| 工單 | Work Order，生產排程的基本單位 |
| BOM | Bill of Materials，物料清單 |
| MRP | Material Requirements Planning，物料需求計劃 |
| 排程 | Scheduling，生產時程安排 |
| 在製品 | WIP（Work In Progress） |
| 庫存盤點 | Stock-taking |
| 採購單 / PO | Purchase Order |
| 交期 | Lead time，從下單到交貨的時間 |

→ 完整術語：`memory/erp/glossary.md`

---

## 圖編高頻術語（熱快取）

| 縮寫 / 術語 | 意思 |
|-------------|------|
| 模板 | Template，預設設計稿供客戶編輯 |
| 素材庫 | Asset library，圖片 / 圖示 / 字型資源 |
| PDF 輸出 | 客戶完成設計後匯出完稿用 |
| 安全線 | Safety margin，版面設計安全邊界 |
| 預覽 | Preview，即時渲染設計成品 |
| 協作編輯 | Collaborative editing，多人同時編輯 |
| 白墨 | White ink layer，深色材質印刷用 |

→ 完整術語：`memory/graphic-editor/glossary.md`

---

## 偏好

- 文件語言：**繁體中文**
- Spec 格式：使用 `.claude/skills/erp-spec/SKILL.md` 規範 / 規格檔案在 `spec/`
- **Prototype / 介面設計**：UI 設計系統定義在 `memory/shared/ui-design-system.md`（Ant Design 5.x），Prototype 實作檔案在 `code/`
- 回應風格：重點優先，條列清楚，避免冗詞
- 優先非同步溝通

---

## 快速索引

### 載入原則（Task 開始時依類型選擇最小必要檔案）

| Task 類型 | 必讀 | 視需要 |
|----------|------|--------|
| 訂單 / 需求單 / 審稿 / 工單設計 | `state-machines.md` | `business-process.md` |
| QC / 任務 / 生產任務 / 出貨設計 | `state-machines-ops.md` | `business-process.md` |
| 跨層流程（含上下層）| `state-machines.md` + `state-machines-ops.md` | — |
| 撰寫 Spec / PRD | 對應 `state-machines*.md` + `.claude/skills/erp-spec/SKILL.md` + **`product-management:feature-spec`（必觸發）** | `business-process.md`、`product-goals.md` |
| 情境驗證 / 補情境 | `scenarios.md` + 對應 `state-machines*.md` section | `user-scenarios.md` |
| 確認 / 解答 Open Question | `open-questions.md` + 對應 `state-machines*.md` | — |
| 使用者故事 / 角色需求 | `user-scenarios.md` | `scenarios.md` |
| 術語查詢 | `glossary.md` | — |
| 產品目標 / KPI | `product-goals.md` | — |
| 資料模型查詢 / 欄位確認 | `docs/data-model.md` | — |
| **Prototype 製作** | `memory/shared/prototype-guidelines.md` + 對應 Spec + scenarios.md + state-machines.md | `ui-design-system.md`、`user-scenarios.md`、`test-cases.md` |
| Prototype 驗證 / 反饋 | `code/[prototype].html` 內的反饋記錄 + `memory/shared/prototype-guidelines.md` § 五 | `spec/*.md`、`open-questions.md` |

### ERP 資源
| 資源 | 路徑 |
|------|------|
| 產品目標（商業目標 / KPI / 範疇） | `memory/erp/product-goals.md` |
| 業務流程（核心規則）| `memory/erp/business-process.md` |
| 狀態機（上層：需求單 / 訂單 / 工單 / 印件）| `memory/erp/state-machines.md` |
| 狀態機（下層：任務 / 生產任務 / QC / 出貨單）| `memory/erp/state-machines-ops.md` |
| 情境驗證（PM 視角步驟流程）| `memory/erp/scenarios.md` |
| 使用者情境（角色需求故事）| `memory/erp/user-scenarios.md` |
| 待確認事項 | `memory/erp/open-questions.md` |
| 待確認事項（已解答封存）| `memory/erp/open-questions-archive.md` |
| 術語表（完整）| `memory/erp/glossary.md` |
| 測試案例（⚠️ 較舊，設計穩定後再清理）| `memory/erp/test-cases.md` |

### 共用資源
| 資源 | 路徑 |
|------|------|
| **角色層通用原則**（Spec 撰寫 / OQ 管理 / PM 視角） | `memory/shared/principles.md` |
| **UI 設計系統**（Ant Design 元件 / Token / 版型規範）| `memory/shared/ui-design-system.md` |
| **Prototype 工作流程**（製作 / 驗證 / 同步規則） | `memory/shared/prototype-guidelines.md` |
| **Prototype 實作檔** | `code/` |
| **規格檔案** | `spec/` |
| 共用術語（完整） | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
| 圖編術語（完整） | `memory/graphic-editor/glossary.md` |

### 工具
| 資源 | 路徑 |
|------|------|
| ERP Spec Skill | `.claude/skills/erp-spec/SKILL.md` |
| Spec 模板 | `.claude/skills/erp-spec/references/spec-template.md` |
| ERP 全局資料模型 | `docs/data-model.md` |
