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
| Notion spec 轉 GitHub Issue | `notion-to-github` |
| OQ 查詢 / 新增 / 更新（含去重）| `oq-manage` |

---

## PM 工作原則（指導 Task / Spec 執行）

> 確保 ERP Prototype 著重於**規格、邏輯、問題、指標**的驗證，而非過早實作程式碼。

### 核心原則

**1. Prototype 優先於實現**
- 目標：驗證「實際需要製作的產品是什麼」與「隱藏的問題是什麼」
- 做法：優先產出規格、流程圖、計算邏輯、情境驗証，**不寫實作程式碼**
- 反例：直接給出程式碼範例、SQL schema、API 簽名
- 正例：設計欄位邏輯、驗證計算流程、列舉邊界情況

**2. 邏輯驗證優於空談**
- 每次設計決策都應附帶：具體例子、計算驗証、情境測試
- 反例：「這樣設計比較好」（缺乏驗証）
- 正例：「例子 1、2 驗算結果如下…」、「情境 6 中基於 BOM 結構的齊套性邏輯適用…」

**2.5 對照參考文件優於隔離設計**
- Spec / PRD 撰寫前必須讀且對照以下文件，確保認知對齊：
  - 商業流程（`openspec/specs/business-processes/spec.md`）：業務流程與核心規則
  - 狀態機 § 上層（`openspec/specs/state-machines/spec.md`）：需求單 / 訂單 / 工單 / 印件
  - 狀態機 § 下層（同上檔案）：任務 / 生產任務 / QC / 出貨單
  - Notion 業務情境 DB：具體業務情境驗證
  - 使用者角色（`openspec/specs/user-roles/spec.md`）：確認角色權責
- 反例：憑印象寫 Spec、沒檢查狀態機與業務流程一致性
- 正例：讀完上述文件 → 對照情境驗證邏輯 → 在 Spec 中標記相關參考位置

**3. 問題優先於方案**
- 發現設計缺陷時，先清楚描述「問題是什麼」，再提出修正方案
- 反例：直接給出 A、B、C 三個方案，模糊問題背景
- 正例：「當一個任務內有多個生產任務時，倍數無法個別定義 → 修正：新增 ProductionTask 層的 quantity_per_work_order」

**4. 指標量化優於定性判斷**
- 設計時應考慮：如何度量是否達成目標？
- 範例：「印件完成數計算精確度」、「避免 N 份工單遺漏」、「支援複雜場景（一任務多生產任務）」
- 應用：異動流程驗証時，要檢查「quantity_per_work_order 調整後是否正確重算」

**5. 文件即規格**
- 所有決策應記錄在相關檔案（商業流程 spec、各模組 spec Data Model、Notion 業務情境 DB）
- 設計時應對照檔案檢查一致性（如本次發現 Notion 資料欄位 DB 缺欄位）
- 每次修訂應註記版本與理由

**6. 角色驗證優於假設**
- 流程中的每個動作都應明確指定執行角色（Who）
- Spec 撰寫時必須讀使用者角色（`openspec/specs/user-roles/spec.md`），確認角色權責是否合理
- 反例：「業務出貨」、「印務質檢」（角色錯誤）
- 正例：逐一檢查流程步驟 → 對照使用者角色 spec 的角色權責 → 若發現矛盾，先修正 user-roles spec 再撰寫 Spec
- 應用場景：設計訂單 / 工單 / 出貨 / QC 等涉及跨角色協作的流程時，必檢

**7. 文件格式與呈現精簡**
- 所有文件移除 emoji 或視覺符號（如 ✅、❌），保持內容精簡、易讀
- 表格與流程圖應使用純文字或標準 Markdown 符號（如 `→`）表達邏輯
- 避免過度視覺化，專注內容本身

**8. 用語一致性與台灣在地化**
- 所有文件使用**繁體中文**，確保用語符合台灣業界習慣
- 避免國際英文直譯或外來詞，優先採用在地常用術語
- 範例修正：
  - 「狀態快照」→ 改為「狀態說明」（台灣不使用 Snapshot 直譯）
  - 文件中的列表項目應使用「說明」或「描述」而非外來用詞
- Spec 中的角色名稱、流程步驟應符合公司實際用語與台灣行業慣例

**9. ERP 系統術語統一規範（業務友善）**
- 所有技術術語應轉化為業務容易理解的表達方式
- **術語對應表**（v1.0，2026-03-03）：
  - 「Bubble-up」→「狀態向上傳遞」或「自動推進」（描述狀態如何從下層向上流動）
  - 「聚合」→「統計」、「統計邏輯」或「合併計算」（描述多層數據的匯總）
  - 「min() 聚合」→「最少工單原則」或「基於 BOM 結構的齊套性邏輯 (Kitting Logic)」（描述取最小值的邏輯）
- 應用位置：Notion 業務情境 DB、狀態機 spec、商業流程 spec 等所有相關文件
- 每次修訂術語須同步更新所有相關文件，確保語境一致
- 詳見 `memory/erp/glossary.md` 的完整術語表

**11. 跨頁面引用規則（Notion / BRD 引用）**
- BRD / Spec / 討論文件內所有跨頁面引用，一律使用 `[可讀名稱](URL)` 格式，讓讀者可直接點擊跳轉
- 不得只寫名稱不附連結，也不得只寫 URL 不附名稱
- 所有 Notion 資源名稱與 URL 的完整對照，統一維護於 `memory/shared/notion-index.md`（唯一正本）；URL 異動時先更新此檔，再同步各 skill / agent
- 常用引用格式範例見 `memory/shared/notion-index.md` 各資源的「BRD 引用格式範例」欄

**10. 主動收尾（討論結束前自動執行）**
- 凡涉及 Spec / BRD / 需求 / OQ 的實質討論，在對話收斂後主動執行下列收尾動作，**不等 Miles 提示**：
  1. 查 Vault `memory/erp/ERP_Vault/08-open-questions/`，新增或解答本次涉及的 OQ（透過 `oq-manage` skill 模式 B / C）
  2. **掃描本次變動的 Vault / Spec 檔是否含 `[!question]` callout、`## Open Questions` section 或 inline OQ 措辭（「待確認」「待釐清」「需確認」「尚未確認」「待補」），發現則觸發 `oq-manage` mode D 遷出為獨立 OQ 卡後才能 commit**
  3. 更新對應 OpenSpec spec / Vault 卡（若有內容異動）
  4. 確認 CLAUDE.md § Spec 規格檔清單是否需補充
  5. 確認 memory/ 相關檔案是否需更新
  6. **若本次有 ≥ 5 個 Vault 卡異動 → 主動建議 Miles 跑 `vault-audit`**（10 維度自審）
  7. **若本次有 change archive / Phase 切換 / OQ 累積達 15 個 open → 主動建議 Miles 跑 `vault-insight`**（跨主題模式識別 + 下一步）
- 判斷標準：本次對話是否決定了任何設計、欄位、流程、角色的新內容或修正 → 有則執行，無則跳過
- Spec / BRD / 欄位 / 流程 / 角色有任何異動或設計方向確立時，主動收尾前觸發三視角多輪討論（依 `memory/erp/ERP_Vault/11-review-knowledge/protocols/multi-agent-discussion-protocol.md`，Vault 內 [[multi-agent-discussion-protocol]] 執行），再執行 `doc-audit`；純 OQ 文字更新或措辭修正跳過。觸發強度依 § ERP 討論主動路由 § 變動性質五級分級判斷
- 三視角討論的觸發不限於正式寫 Spec：只要討論中有設計傾向出現（即使未觸發 erp-spec），也應啟動；三個 agent 先載入全部背景知識再進行輪次討論
- Stop hook 的收尾清單為備用提醒，主要靠此原則主動驅動

### ERP 討論主動路由（每次 ERP 相關討論開始時自動判斷）

> 判斷標準：Miles 的訊息涉及 ERP 任何模組、業務流程、或產品決策時，先判斷討論類型，再決定主動帶入哪個 agent。不等 Miles 明確要求。

| 討論類型 | 觸發信號（範例） | 主動行動 |
|---------|----------------|---------|
| 商業目標 / 痛點探索 | 「流程很慢」「客戶老是問」「想要做 XX」「現在的問題是…」 | `senior-pm`（前期介入）+ `ceo-reviewer` 平行呼叫 |
| 功能設計有傾向（尚無 change）| 「我覺得應該這樣設計」「這個邏輯你怎麼看」「XX 要怎麼處理」 | `/opsx:explore` 或 `senior-pm` + `erp-consultant` 輕量審查 |
| 規格撰寫 / 變更 | 「寫 spec」「新增功能」「修改 XX 規格」「規劃文件」 | `/opsx:propose`（含 OQ 查詢 + senior-pm 前期介入 + 三視角審查）|
| 規格草稿審查 | change 的 specs + design 完成後 | 三視角平行（`senior-pm` + `ceo-reviewer` + `erp-consultant`）|
| 系統一致性 / 狀態機確認 | 「會不會跟 XX 衝突」「這個狀態怎麼設計」「資料怎麼連」 | `erp-consultant` + 讀取 `openspec/specs/state-machines/spec.md` |
| **識別到不確定項（任何時機）** | 「這個需確認」「先列 OQ」「待釐清」「待補」「[!question]」 | **立即觸發 `oq-manage` mode B 開獨立檔**（含去重流程），原處改 wiki link 引用；**不可只 inline 標注或用 callout** |
| **識別到 agent 誤審（任何時機）** | 「審錯了」「方向錯了」「規則太學術」「以後別這樣審」「記下來」「這是誤審」| **立即觸發 `misjudgement-record` mode B 寫入對應誤審卡**（自動分類至跨 agent 通用 / ERP 命名 / CEO 誤區 + 去重 + 四要素提取）；**不可只口頭說「下次注意」** |
| **Vault 健康檢查 / audit** | 「跑 vault audit」「audit vault」「Vault 健康」/ 主動：≥ 5 Vault 卡異動 / change archive 後 / 每 20+ commit | 觸發 `vault-audit` skill（10 維度），產對話報告 + 追加 `00-meta/audit-log.md` |
| **跨主題模式 / 下一步提煉** | 「跑 insight」「找下一步」「找系統性議題」/ 主動：OQ 累積 ≥ 15 / Phase 切換 / change archive / audit ≥ 5 error | 觸發 `vault-insight` skill，產 `12-insights/<YYYY-MM-DD>-<主題>.md` 並追加 audit-log |

#### 變動性質五級分級（2026-05-19 新增，對應 [[lightweight-review-mode]] § 二）

判斷「規格 / 設計變動性質」決定觸發強度，避免「任何改動都三視角」過載：

| 變動性質 | 判斷標準 | 觸發 |
|---------|---------|------|
| 純措辭 / OQ 文字 | 不改設計、不改欄位、不改狀態轉換 | 不觸發 agent |
| 局部欄位調整（單模組內）| 新增 / 修改單一欄位、不影響跨模組 | 單 agent 輕量審查（`erp-consultant`，依 [[lightweight-review-mode]]）|
| 流程節點調整（單模組內）| 新增 / 移動單一狀態節點、不改下游 | 雙 agent（`erp-consultant` + 對應角色 `senior-pm` or `ceo-reviewer`，依 [[lightweight-review-mode]]）|
| 結構性變更 | 新增實體、新增跨模組關聯、改變狀態機父子層、新增角色 | 三視角完整輪次（依 [[multi-agent-discussion-protocol]]）|
| 商業邏輯 / KPI / Phase 範疇 | 影響 product-vision / phases / KPI | 三視角 + 必含 `ceo-reviewer`（KPI 對齊維度由 CEO 主審，依 [[ceo-review-framework]] § 6）|

**判斷者**：Claude 給「建議分級 + 理由」，Miles 確認；分級錯誤時記錄到 Vault `11-review-knowledge/_shared/`（累積為「升級誤判記錄」演化資料）。

**與 OpenSpec change 整合**：
- `/opsx:explore` → senior-pm 前期介入模式（單 agent）
- `/opsx:propose` § Why/Background → 依範疇取雙 / 三視角
- `/opsx:verify` 前 → 三視角審查 BRD 草稿
- `/opsx:archive` 前 → 不觸發 agent，執行 `doc-audit`

**路由注意事項**：
- 同一段討論若跨越多個類型（如從痛點探索轉入設計討論），在類型轉換時主動帶入對應 agent
- 純澄清 / 查詢（「XX 術語是什麼」「狀態機在哪裡」）不觸發 agent，直接回答
- 已在執行 OpenSpec change 工作流時，agent 呼叫遵循 config.yaml rules，不重複觸發
- ~~`erp-spec` skill 已停用~~，規格撰寫統一透過 OpenSpec change 工作流

---

### OQ 工作流（Vault 為內部正本，2026-05-19 v2）

> **正本變更**：OQ 統一維護在 Vault `memory/erp/ERP_Vault/08-open-questions/`（v2，2026-05-19）。Notion Follow-up DB 降為對外確認版（彙整推送時更新）。
> 所有 OQ 操作（查詢 / 新增 / 更新）統一觸發 `oq-manage` skill 執行（已改寫，見 `.claude/skills/oq-manage/SKILL.md`）。

**三個固定動作，每次討論需求 / 寫 Spec 時自動執行：**

| 時機 | 動作 |
|------|------|
| 討論開始前 | 觸發 `oq-manage`（模式 A：查詢），列出本次涉及模組的未解答 OQ（從 Vault `08-open-questions/` 讀取），讓 Miles 確認帶入討論 |
| 討論中 | 識別到不確定項 **立即觸發 `oq-manage` mode B 開檔**（含去重流程），**禁止只在當前回應 inline 標注或用 `[!question]` callout** |
| 討論收斂後 | 觸發 `oq-manage`（模式 B 新增 / 模式 C 更新），寫入 Vault markdown 卡 |

- Vault OQ 目錄：`memory/erp/ERP_Vault/08-open-questions/`（內部正本）
- Notion Follow-up DB（對外確認版）：https://www.notion.so/32c3886511fa808e9754ea1f18248d92
- Vault → Notion 推送依 [ERP_Vault sync-workflow](memory/erp/ERP_Vault/00-meta/sync-workflow.md)，由 Miles 觸發

---

### 如何開始 Spec 迭代

> **OpenSpec 為規格管理工具**，所有規格變更��過 change 工作流進行。

**① 探索（Why）** → `/opsx:explore`
釐清問題、驗證方向。讀此部分（§ 核心原則）理解設計思維。

**② 建立變更（How to write）** → `/opsx:propose` 或 `/opsx:new` + `/opsx:continue`
系統自動引導產出 proposal → delta specs → design → tasks。
config.yaml rules 會自動注入 OQ 查詢、senior-pm 前期介入、三視角審查等原則。

**③ 實作與驗證（How to verify）** → `/opsx:apply` + `/opsx:verify`
依 tasks 執行 Prototype 建置，驗證實作符合 specs。

**④ 歸檔（Archive）** → `/opsx:archive`
delta specs 合併回 main specs，歸檔 change。

**⑤ 發布（Publish）** → 手動推送至 Notion
累積數個 change 後，手動將更新後的 main specs 同步至 Notion BRD（發布版本）。

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
**每次修改 `memory/` 或 `.claude/agents/` 後，連同 CLAUDE.md 一起 commit，commit 完成後 hook 會自動 push。**
→ Commit 格式範例見 `memory/erp/spec-iteration-workflow.md` § 迭代後 § Step 3

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
- Spec 格式：**OpenSpec**（`openspec/specs/`）為工作版本（正本），Notion Feature Database 為發布版本。變更管理使用 OpenSpec change 工作流
- **Prototype / 介面設計**：Prototype 實作在 GitHub Repo `sens-erp-prototype`（本地路徑 `/Users/b-f-03-029/sens-erp-prototype`），技術棧為 React + TypeScript + Tailwind + shadcn/ui
- **ERP 平台限制**：ERP 系統僅支援電腦版（桌機瀏覽器），不規劃行動裝置版，所有 ERP 模組適用
- 回應風格：重點優先，條列清楚，避免冗詞
- 優先非同步溝通

---

## 快速索引

### 載入原則（Task 開始時依類型選擇最小必要檔案）

> **2026-05-19 重大更新**：商業需求 KM 中樞為 `memory/erp/ERP_Vault/`（Vault），實作 / UI / 演算法不在此（見 [Vault scope-boundary](memory/erp/ERP_Vault/00-meta/scope-boundary.md)）。
> AI 撰寫 OpenSpec change 時必須先讀 Vault 對應卡（見「商業層查詢」row），在 change proposal `## Why` / `## Background` 段以相對路徑或 wiki link 引用 Vault 節點。

| Task 類型 | 必讀 | 視需要 |
|----------|------|--------|
| **商業層查詢**（商業目標 / 角色 / 商業邏輯 / 實體關聯 / 狀態機 / 跨模組情境）| `memory/erp/ERP_Vault/`（Vault README / 章程 / 對應領域目錄） | OpenSpec spec § Requirements（功能規格） |
| **撰寫 OpenSpec change**（背景對齊）| Vault `04-business-logic/` + `05-entities/` + `03-roles/` 對應卡 → 引用至 proposal `## Why` | `09-canvases/` 視覺化、Notion 索引（`10-references/notion-index.md`） |
| 訂單 / 需求單 / 審稿 / 工單設計 | Vault `06-state-machines/` 對應狀態機卡 + `05-entities/` 對應實體卡 | 商業流程 spec（`openspec/specs/business-processes/spec.md`） |
| QC / 任務 / 生產任務 / 出貨設計 | 同上（含 QC / 任務 / 生產任務 / 出貨單實體與狀態機） | 同上 |
| 跨層流程（含上下層）| Vault `06-state-machines/` 全部 + 狀態機 spec（`openspec/specs/state-machines/spec.md`）| — |
| **撰寫 Spec / PRD** | 觸發 OpenSpec change 工作流（`/opsx:propose` 或 `/opsx:new`），背景資料由 Vault 對應卡引用 | 迭代時參考 `memory/erp/spec-iteration-workflow.md` |
| 情境驗證 / 補情境 | Vault `07-scenarios/README.md` + 業務情境 spec（`openspec/specs/business-scenarios/spec.md`）| Vault `03-roles/`（角色責任分配）|
| 確認 / 解答 Open Question | Vault `08-open-questions/`（**內部正本，2026-05-19 改寫**）+ 觸發 `oq-manage` skill | Notion OQ DB（對外確認版，見 § OQ 工作流）|
| 使用者故事 / 業務情境 | 各模組 spec § Scenarios（已嵌入）+ Vault `07-scenarios/README.md` | Vault `03-roles/` |
| **審查方法論 / 框架查詢**（agent 用哪個審查框架 / 5 設計模式 / 命名規則 / 多視角討論協議）| Vault `11-review-knowledge/`（入口 [README](memory/erp/ERP_Vault/11-review-knowledge/README.md)，分 `_shared/` 共用 + `pm/` `ceo/` `erp/` 視角專屬 + `protocols/` 流程協議）| 對應 agent.md（`.claude/agents/<name>.md`，定義觸發與輸出格式）|
| 術語查詢 | Vault `02-domain/glossary-*.md`（內部正本）| `memory/erp/glossary.md`（舊 memory 檔，未來降為指向 Vault） |
| 產品目標 / KPI | Vault `01-products/erp/product-vision.md`、`success-metrics.md`、`impact-score-framework.md` | Notion 產品目標（對外確認版）：https://www.notion.so/32c3886511fa81359354e33087d23f23 |
| 角色 R&R | Vault `03-roles/`（16 角色含 _alignment-report） | OpenSpec `user-roles/spec.md`（5 角色，待補齊）|
| 資料模型（查詢 / 新增 / 修改 / 移除欄位或資料表）| Vault `05-entities/` + 各模組 spec § Data Model | Notion 資料欄位 DB（**降為發布版，2026-05-19**）：https://www.notion.so/32c3886511fa803e9f30edbb020d10ce |
| BOM 底層（材料 / 工序 / 裝訂）| `openspec/specs/material-master/spec.md` + `openspec/specs/process-master/spec.md` + `openspec/specs/binding-master/spec.md` | 各模組 spec § Data Model |
| **Prototype 製作** | `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`（視覺 + UX + §0 業務規範，唯一權威）+ `memory/shared/ui-business-rules.md`（框架無關業務規範細則）+ `memory/shared/prototype-guidelines.md`（工作流程）+ 對應 Spec + Notion 業務情境 DB + 狀態機 spec | 使用者角色 spec、Notion 測試案例 DB：https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| Prototype 驗證 / 反饋 | `/Users/b-f-03-029/sens-erp-prototype/src/` 對應模組 + `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md` + `memory/shared/prototype-guidelines.md` § 五 | — |

### ERP 資源
> 完整 Notion URL 索引與引用格式：`memory/shared/notion-index.md`
> **2026-05-19 新增**：商業需求 KM 中樞為 `memory/erp/ERP_Vault/`（Vault 為內部正本，Notion 降為對外確認版）

| 資源 | 路徑 |
|------|------|
| **ERP_Vault（商業需求 KM 中樞）** | `memory/erp/ERP_Vault/`（入口：[00-meta/README.md](memory/erp/ERP_Vault/00-meta/README.md)、章程：[vault-charter.md](memory/erp/ERP_Vault/00-meta/vault-charter.md)、邊界：[scope-boundary.md](memory/erp/ERP_Vault/00-meta/scope-boundary.md)、同步：[sync-workflow.md](memory/erp/ERP_Vault/00-meta/sync-workflow.md)、**Schema**：[wiki-schema.md](memory/erp/ERP_Vault/00-meta/wiki-schema.md)、**Audit Log**：[audit-log.md](memory/erp/ERP_Vault/00-meta/audit-log.md)） |
| **Vault 自審 / Insight** | `vault-audit` skill（10 維度稽核）+ `vault-insight` skill（跨主題模式 + 下一步）；產出至 [audit-log.md](memory/erp/ERP_Vault/00-meta/audit-log.md) 與 [12-insights/](memory/erp/ERP_Vault/12-insights/) |
| Spec 迭代工作流（實施細節、檔案清單、驗證標準）| `memory/erp/spec-iteration-workflow.md` |
| 產品目標（商業目標 / KPI / 範疇） | `openspec/config.yaml` § 產品背景與目標（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa81359354e33087d23f23 |
| 成功指標 KPI DB（各模組可量化指標，以 Feature 欄位篩選）| Notion KPI DB：https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f |
| 業務流程（核心規則）| `openspec/specs/business-processes/spec.md`（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a |
| 狀態機（上層 + 下層）| `openspec/specs/state-machines/spec.md`（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 |
| 數量換算計算規則（Prototype 設計參考）| Notion 數量換算規則：https://www.notion.so/32c3886511fa81e9a77adbd21cfc9d4a |
| 情境驗證（端到端狀態追蹤）| `openspec/specs/business-scenarios/spec.md`（正本）；Notion 發布版本：https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 |
| User Story（業務故事集）| 各模組 spec § Scenarios（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d |
| 使用者角色（角色權責定義）| `openspec/specs/user-roles/spec.md`（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa8144b38adc9266395d15 |
| 待確認事項（OQ） | Notion Follow-up DB：https://www.notion.so/32c3886511fa808e9754ea1f18248d92 |
| 術語表（完整）| `memory/erp/glossary.md` |
| 測試案例 | Notion ERP Test Case DB：https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| 出貨邏輯診斷（邊界情況 / 常見漏洞）| Notion 出貨邏輯診斷：https://www.notion.so/32c3886511fa81cfac16c4720b888ca2 |
| 訂單款項與發票 13 業務情境（產 user story / test case 原始材料）| `memory/erp/payment-invoice-scenarios.md` |

### 共用資源
| 資源 | 路徑 |
|------|------|
| **Notion 資源索引（URL 唯一正本）** | `memory/shared/notion-index.md` |
| 角色層通用原則（Spec 撰寫 / OQ 管理 / PM 視角） | `memory/shared/principles.md` |
| UI 設計系統（業務規範 / 視覺 Token / UX 模式 / 元件清單，唯一權威）| `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`（Spec 撰寫前讀 §0 業務規範；Prototype 製作前完整讀） |
| UI 業務規範細則（框架無關：禁 Emoji / 刪除流程 / Info Banner / Toast / Loading / 頁面模板 / 按鈕優先級 / 狀態標籤）| `memory/shared/ui-business-rules.md` |
| Prototype 工作流程（製作 / 驗證 / 同步規則） | `memory/shared/prototype-guidelines.md` |
| impeccable 設計稽核 skill 使用指引（ERP 場景指令選擇決策樹）| `memory/shared/impeccable-usage.md` |
| 共用術語（完整） | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
| 圖編術語（完整） | `memory/graphic-editor/glossary.md` |

### Spec 規格檔清單
> **規格正本**：OpenSpec（`openspec/specs/`），工作版本在此維護與迭代。
> **發布版本**：Notion Feature Database，確認後推送。
> Notion Feature Database：https://www.notion.so/2823886511fa83d08c16815824afd2b7

| 模組 | OpenSpec Spec | Notion BRD（發布版本） | 版本 | 狀態 |
|------|--------------|----------------------|------|------|
| 需求單 | `openspec/specs/quote-request/spec.md` | https://www.notion.so/3293886511fa80998ac0e8cdf555da68 | v3.2 | 草稿（v3.2：simplify-quote-billing-company-mapping 2026-05-15 歸檔 — 帳務公司由接單公司硬推導（SSP/KAD → bc-ssp、BRO/EC → bc-bro），業務不再手動選帳務公司；REMOVED「帳務公司指定」/「接單公司與帳務公司對應提示」、ADDED「帳務公司自動推導」、billing_company_id 欄位由業務必填改為系統推導唯讀；v3.1 諮詢轉需求單 + 帳務公司指定內容延續）|
| 訂單管理 | `openspec/specs/order-management/spec.md` | https://www.notion.so/32c3886511fa806bad41d755349b0567 | v1.4 | 草稿（v1.4：refine-order-edit-gate-and-consultation 2026-05-15 歸檔 — v1.3 跟班修正：諮詢訂單收尾情境收斂為兩種（「不做大貨」涵蓋諮詢人員直接點不做大貨 + 需求單流失歸類為不做大貨；「待諮詢取消（退費）」）、REMOVED 訂單階段改派負責業務 Requirement（業務協助走 US-ORD-004 分享 / 正式轉單走 Supervisor 既有機制）、訂單編輯閘門從「已回簽」改為「製作等待中（含）」（審稿段內可自由編輯）；v1.3 雙欄計價 / 三類附件 / Invoice Data Model 延續）|
| 諮詢單 | `openspec/specs/consultation-request/spec.md` | — | v0.1 | 草稿（v0.1：add-consultation-request-and-revise-approval-gate 2026-05-07 歸檔 — 新建：surveycake webhook 自動建單、雙出口（諮詢訂單 / 轉需求單）、Payment 跨實體轉移、待諮詢取消退費等 10 個 Requirement）|
| 售後服務 | `openspec/specs/after-sales-ticket/spec.md` | — | v0.2 | 草稿（v0.2：add-my-after-sales-action-page-and-remove-owner-transfer 2026-05-19 歸檔 — ADDED 我的售後服務作業頁（`/my-after-sales` 業務 / 諮詢個人作業視圖、頂端待辦摘要、next action 分組、sidebar 數字徽章）、業務 / 諮詢角色售後 ticket 權限範圍（諮詢顯式繼承業務 owner 行為）；MODIFIED AfterSalesTicket 實體（移除 owner_transfer_log 欄位 + opened_by 描述明確化）；REMOVED 業務看板「我的未結案售後」分桶（首頁 widget 屬資訊架構錯位，由 sidebar 數字徽章替代）、業務離職 / 請假時 ticket 負責人轉派（業務主管不介入此情境，業務離職實務替代留 OQ AFT-1）；v0.1 add-after-sales-ticket 2026-05-18 歸檔 — 新建：AfterSalesTicket 容器替代 OrderAdjustment(phase=after_completion) 雙重身份；訂單已完成後客訴 / 不良 / 規格不符 → ticket（受理中 → 處理中 → 已結案），下游動作 0..N OrderAdjustment + 0..N PrintItem；case_category 7 enum、responsibility 3 enum；訂單列表售後欄位；ticket 內直接建關聯 OA / 補印 PrintItem dialog；既有 phase=after_completion 歷史 OA 反向遷移為 legacy_migrated ticket；OrderAdjustment 移入 useErpStore.orderAdjustments 達跨頁面同步）|
| 工單管理 | `openspec/specs/work-order/spec.md` | https://www.notion.so/32c3886511fa80f98a43def401d1edce | v0.5 | 草稿（v0.5：refactor-detail-pages-to-subheader-tab-layout 2026-05-06 歸檔 — MODIFIED 詳情頁 Tab 使用共用元件（4→5 Tabs 含資訊首位）+ ADDED 工單詳情頁 Tabs 化版型，三張資訊卡進資訊 Tab，退回原因獨立 InfoBanner）|
| 生產任務 | `openspec/specs/production-task/spec.md` | https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94 | v0.3 | 草稿（v0.3：add-production-task-transfer 2026-04-24 歸檔 — 新增印件級 TransferTicket + TransferTicketLine 實體、線上彙整多生產任務轉交流程；主流程 MVP 不含撤回 / transferRequired flag）|
| 稿件審查 | `openspec/specs/prepress-review/spec.md` | https://www.notion.so/32c3886511fa80eab36aded242f6deb9 | v1.5 | 草稿（v1.5：refine-prepress-review-scope 2026-04-22 補歸檔 — client_note / review_note 擴充 / 印件詳情頁最新審稿備註顯示 等 Requirements 正式 sync 入主 spec，補完 2026-04-20~22 審稿模組五個 change 的完整歸檔）|
| 狀態機（跨模組）| `openspec/specs/state-machines/spec.md` | https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 | — | 草稿 |
| 商業流程（跨模組）| `openspec/specs/business-processes/spec.md` | https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a | — | 草稿 |
| 業務情境（跨模組）| `openspec/specs/business-scenarios/spec.md` | https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 | — | 草稿 |
| 使用者角色（跨模組）| `openspec/specs/user-roles/spec.md` | https://www.notion.so/32c3886511fa8144b38adc9266395d15 | — | 草稿（2026-05-14 add-print-item-overview-to-sales-platform 歸檔新增「業務 Role 業務平台功能存取」Requirement）|
| 業務平台（容器 spec）| `openspec/specs/sales-platform/spec.md` | — | v0.2 | 草稿（v0.2：add-my-after-sales-action-page-and-remove-owner-transfer 2026-05-19 歸檔 — ADDED 業務平台「我的售後服務」入口 Requirement（業務 / 諮詢可見 + 過濾規則 / 動作可見性 / 預設體驗 + 移除舊「售後服務單轉派」sidebar 入口）；v0.1 2026-05-14 add-print-item-overview-to-sales-platform 歸檔 — 新建容器 spec + 業務平台容器定位 / 業務平台印件總覽 / 業務平台印件詳情頁 Tab 閹割三條 Requirement）|
| 材料主檔（BOM 底層）| `openspec/specs/material-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| 工序主檔（BOM 底層）| `openspec/specs/process-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| 裝訂主檔（BOM 底層）| `openspec/specs/binding-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| Prototype 資料層（跨模組工程）| `openspec/specs/prototype-data-store/spec.md` | — | — | 草稿（2026-04-20 e2e + 2026-04-21 data-consistency-audit）|
| Prototype 共用 UI（跨模組工程）| `openspec/specs/prototype-shared-ui/spec.md` | — | — | 草稿（2026-04-21 fix-erp-summary-grid-info-icon-overflow 起點；2026-05-06 refactor-detail-pages-to-subheader-tab-layout 歸檔新增「印件詳情頁 Tabs 化版型」Requirement；2026-05-19 align-payment-list-pages-to-quote-list-pattern 歸檔新增 5 個 Requirement：「列表頁標準佈局 / StatusCard 元件支援字串型 count 與篩選中標記 / 款項管理列表頁對齊基準範本 / 諮詢單列表頁對齊基準範本 / QuoteListPage canonical reference 自身對齊新規範」；同步補強 sens-erp-prototype/DESIGN.md § 6.1 範式 B 模板 + 12 條共同準則 + 操作性判定 + 12 項稽核清單；OQ-2 標明 capability 歸屬待後續決定）|
| QC | `openspec/specs/qc/spec.md` | — | — | 草稿 |
| 派工看板 | `openspec/specs/task-dispatch-board/spec.md` | — | — | 草稿 |
| 工作包 | `openspec/specs/work-package/spec.md` | — | — | 草稿 |

### Prototype 實作進度
> Prototype 統一在 `sens-erp-prototype` Repo（本地：`/Users/b-f-03-029/sens-erp-prototype`）
> GitHub：https://github.com/Kawato-Miles/sens-erp-prototype

| 模組 | 路徑 | 功能 | 狀態 |
|------|------|------|------|
| 需求單 | `src/components/quote/` | 需求單列表 + 編輯頁 + 報價評估 | 建置中（由 Lovable 遷移） |
| 訂單管理 | 尚未建立 | 訂單列表 + 工單與印件合併生產進度二層展開 | 待建置 |
| 材料 / 工序 / 裝訂主檔 | ERP 中台（Figma 稿為準）| 三層結構 + 計價規則；Prototype 不建置 | 已實作（中台）|

### 工具
| 資源 | 路徑 |
|------|------|
| **Notion MCP 操作指引**（防錯清單）| `memory/shared/notion-mcp-guidelines.md` |
| ~~ERP Spec Skill~~（已停用，改用 OpenSpec change 工作流）| `.claude/skills/erp-spec/SKILL.md` |
| ERP Test Case Skill | `.claude/skills/erp-test-case/SKILL.md` |
| OQ 管理 Skill（含去重）| `.claude/skills/oq-manage/SKILL.md` |
| **誤審記錄 Skill**（三視角審查 agent 誤審案例庫，含分類 / 去重 / 四要素提取）| `.claude/skills/misjudgement-record/SKILL.md` |
| 文件稽核 Skill（含自我演化，聚焦 OpenSpec 層）| `.claude/skills/doc-audit/SKILL.md` |
| **Vault 自審 Skill**（10 維度稽核，產 audit-log）| `.claude/skills/vault-audit/SKILL.md` |
| **Vault Insight Skill**（跨主題模式 + 下一步建議，產 12-insights）| `.claude/skills/vault-insight/SKILL.md` |
| Senior PM 規劃驅動 Agent | `.claude/agents/senior-pm.md` |
| CEO 審查 Agent | `.claude/agents/ceo-reviewer.md` |
| ERP 顧問審查 Agent | `.claude/agents/erp-consultant.md` |
| Notion → GitHub Issue Skill | `.claude/skills/notion-to-github/SKILL.md` |
| BRD 模板（Notion） | `.claude/skills/erp-spec/references/brd-template.md` |
| PRD Parent Issue 模板（GitHub，模組層） | `.claude/skills/notion-to-github/references/prd-parent-template.md` |
| PRD Sub-issue 模板（GitHub，子功能層） | `.claude/skills/notion-to-github/references/prd-sub-template.md` |
| ERP 全局資料模型 | 各模組 spec § Data Model（正本）；Notion 資料欄位 DB（查詢用）：https://www.notion.so/32c3886511fa803e9f30edbb020d10ce |
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
