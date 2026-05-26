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
  - 「桌面走查 / 端到端走查」→ 改為「推演 / 端到端推演」（walkthrough 直譯為「走查」屬 PRC 用語，台灣不自然；PM 事前演練流程用「推演」）
  - 「Prototype 走查」→ 改為「Prototype 試用」（事後操作介面檢視，語意比「走查」精準）
  - 「dogfood / dogfooding」→ 改為「親身試用」或「自用試跑」（自己用自己的產品 / 流程；對話與描述用中文，僅 source enum 等技術 token 可保留 `prototype-dogfood`）
- Spec 中的角色名稱、流程步驟應符合公司實際用語與台灣行業慣例
- **User Story 內容禁中英夾雜**：欄位名 / 實體名一律用介面中文（payment → 付款紀錄、printItem → 印件、orderAdjustment → 訂單異動、quoteRequest → 需求單、workOrder → 工單、productionTask → 生產任務、reviewRound → 審稿輪次、paymentPlan → 付款計畫、afterSalesTicket → 售後服務單 等），詳見 [[memory/erp/ERP_Vault/13-user-stories/README]] § 二

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
  8. **若本次對話累積 ≥ 1 條可寫入 raw 的素材（Prototype 試用反饋 / Miles 觀察 / 研究筆記 / 對話 highlight）→ 觸發 `vault-ingest` mode A**（claude-self-capture 須 Miles 確認、claude-research 須附真實 raw-source-link）
  9. **若本次對話結束時累積 status=raw ≥ 10 張 → 主動建議 Miles 跑 `vault-ingest` mode C**（批次掃描 raw 待處理清單）
- 判斷標準：本次對話是否決定了任何設計、欄位、流程、角色的新內容或修正 → 有則執行，無則跳過
- Spec / BRD / 欄位 / 流程 / 角色有任何異動或設計方向確立時，主動收尾前觸發三視角多輪討論（依 `memory/erp/ERP_Vault/11-review-knowledge/protocols/multi-agent-discussion-protocol.md`，Vault 內 [[multi-agent-discussion-protocol]] 執行），再執行 `doc-audit`；純 OQ 文字更新或措辭修正跳過。觸發強度依 § ERP 討論主動路由 § 變動性質五級分級判斷
- 三視角討論的觸發不限於正式寫 Spec：只要討論中有設計傾向出現（即使未觸發 erp-spec），也應啟動；三個 agent 先載入全部背景知識再進行輪次討論
- Stop hook 的收尾清單為備用提醒，主要靠此原則主動驅動

### ERP 討論主動路由（每次 ERP 相關討論開始時自動判斷）

> 判斷標準：Miles 的訊息涉及 ERP 任何模組、業務流程、或產品決策時，先判斷討論類型，再決定主動帶入哪個 agent。不等 Miles 明確要求。

| 討論類型 | 觸發信號（範例） | 主動行動 |
|---------|----------------|---------|
| 商業目標 / 痛點探索 | 「流程很慢」「客戶老是問」「想要做 XX」「現在的問題是…」 | `senior-pm`（前期介入）單 agent 啟動；視議題範圍升級為序列協作 |
| 功能設計有傾向（尚無 change）| 「我覺得應該這樣設計」「這個邏輯你怎麼看」「XX 要怎麼處理」 | `/opsx:explore` → 序列協作 Phase 1（依 [[sequential-design-collaboration]]）；或 [[lightweight-review-mode]] 單 agent 輕量 |
| 規格撰寫 / 變更 | 「寫 spec」「新增功能」「修改 XX 規格」「規劃文件」 | `/opsx:propose` → 序列協作 Phase 1-4 完整流程（含 OQ 查詢 + PM 釐清 + CEO 指標 + 顧問實作 + PM 匯報整體設計方案）|
| 規格草稿驗收前審查 | `/opsx:verify` 前需最終確認 | **過渡期保留**三視角平行（`senior-pm` + `ceo-reviewer` + `erp-consultant`，依 [[multi-agent-discussion-protocol]]）|
| 系統一致性 / 狀態機確認 | 「會不會跟 XX 衝突」「這個狀態怎麼設計」「資料怎麼連」 | `erp-consultant` 單 agent 輕量審查（依 [[lightweight-review-mode]]）+ 讀取 `openspec/specs/state-machines/spec.md` |
| **識別到不確定項（任何時機）** | 「這個需確認」「先列 OQ」「待釐清」「待補」「[!question]」 | **立即觸發 `oq-manage` mode B 開獨立檔**（含去重流程），原處改 wiki link 引用；**不可只 inline 標注或用 callout** |
| **識別到 agent 誤審（任何時機）** | 「審錯了」「方向錯了」「規則太學術」「以後別這樣審」「記下來」「這是誤審」| **立即觸發 `misjudgement-record` mode B 寫入對應誤審卡**（自動分類至跨 agent 通用 / ERP 命名 / CEO 誤區 + 去重 + 四要素提取）；**不可只口頭說「下次注意」** |
| **Vault 健康檢查 / audit** | 「跑 vault audit」「audit vault」「Vault 健康」/ 主動：≥ 5 Vault 卡異動 / change archive 後 / 每 20+ commit | 觸發 `vault-audit` skill（10 維度），產對話報告 + 追加 `00-meta/audit-log.md` |
| **跨主題模式 / 下一步提煉** | 「跑 insight」「找下一步」「找系統性議題」/ 主動：OQ 累積 ≥ 15 / Phase 切換 / change archive / audit ≥ 5 error | 觸發 `vault-insight` skill，產 `12-insights/<YYYY-MM-DD>-<主題>.md` 並追加 audit-log |
| **Raw 素材收集 / 研究筆記** | 「存進 raw」「我要記」「先收集」「研究一下 X」「這份檔案存 raw」「把這個 PDF / 訪談 / 截圖收進來」/ Claude 完成 WebFetch 研究後 / Claude 主動識別「值得記」 | 觸發 `vault-ingest` mode A 寫入 `raw/<YYYY-MM-DD>-<source>-<topic>.md`（claude-self-capture **須 Miles 確認**，claude-research **須附真實 raw-source-link**，miles-upload **須原檔搬 `_attachments/` + 出處**）|
| **批次掃描 raw** | 「看 raw」「掃 raw」「raw 待處理」/ 主動：累積 ≥ 10 張 status=raw | 觸發 `vault-ingest` mode C，產三狀態清單 + 同主題累積警示 + 過期警告 |
| **精練 raw 卡** | 「精練 [檔名]」「ingest 這張」「拆解 raw」 | 觸發 `vault-ingest` mode B（含 oq-manage mode B / vault-insight 協同觸發判斷；cards diff **須 Miles 確認** 才動既有卡）|
| **每日進度回顧** | 「開工」「daily」「daily brief」「今日要做什麼」「今日 brief」「今天該做什麼」 | 觸發 `daily-brief` skill，產 `14-reviews/daily/<YYYY-MM-DD>.md`（今日建議行動 ≤ 3 條 + 昨日進度摘要）並追加 audit-log |
| **每週回顧** | 「週末整理」「weekly review」「本週回顧」「下週重點」「本週做了什麼」「這週學到什麼」 | 觸發 `weekly-review` skill，產 `14-reviews/weekly/<YYYY-WNN>.md`（本週學到 3-5 條 + 本週完成 + 下週重點 ≤ 3 條）並追加 audit-log |
| **新增 / 修改 User Story** | 「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」「推 user story 到 Notion」/ 識別到 spec 需求須具體化為業務故事 | 觸發 `erp-user-story` skill：mode A 新增（INVEST 自審 + 兩階段紀律 + 中英夾雜 lint） / mode B 補 UI 操作層（Prototype 定案後） / mode C 推送 Notion（單向、以 us-id 為鍵）；產 `13-user-stories/<module>/US-XX-NNN-<簡述>.md` |

#### 變動性質五級分級（2026-05-26 改寫：序列協作取代設計階段三視角）

判斷「規格 / 設計變動性質」決定觸發強度，避免「任何改動都啟動完整協作」過載：

| 變動性質 | 判斷標準 | 設計階段觸發 | 驗收前審查觸發 |
|---------|---------|-------------|---------------|
| 純措辭 / OQ 文字 | 不改設計、不改欄位、不改狀態轉換 | 不觸發 agent | 不觸發 |
| 局部欄位調整（單模組內）| 新增 / 修改單一欄位、不影響跨模組 | 單 agent 輕量審查（`erp-consultant`，依 [[lightweight-review-mode]]）| 不觸發 |
| 流程節點調整（單模組內）| 新增 / 移動單一狀態節點、不改下游 | 序列協作 Phase 1+3（PM + 顧問，跳過 Phase 2 CEO）依 [[sequential-design-collaboration]] | 不觸發 |
| 結構性變更 | 新增實體、新增跨模組關聯、改變狀態機父子層、新增角色 | 序列協作 Phase 1-4 完整流程依 [[sequential-design-collaboration]] | `/opsx:verify` 前三視角審查依 [[multi-agent-discussion-protocol]] |
| 商業邏輯 / KPI / Phase 範疇 | 影響 product-vision / phases / KPI | 序列協作 Phase 1-4 完整流程（Phase 2 CEO 主審 KPI 對齊）依 [[sequential-design-collaboration]] | `/opsx:verify` 前三視角審查 |

**判斷者**：Claude 給「建議分級 + 理由」，Miles 確認；分級錯誤時記錄到 Vault `11-review-knowledge/_shared/`（累積為「升級誤判記錄」演化資料）。

**與 OpenSpec change 整合（2026-05-26 更新）**：
- `/opsx:explore` → 序列協作 Phase 1（單 PM，依 [[sequential-design-collaboration]]）
- `/opsx:propose` § Why/Background → 序列協作 Phase 1-4 完整流程（PM 匯報整體設計方案後接續 propose）
- `/opsx:continue` → 視議題範疇依 [[lightweight-review-mode]] 或序列協作
- `/opsx:verify` 前 → 三視角審查 BRD 草稿（**過渡期保留**，依 [[multi-agent-discussion-protocol]]）
- `/opsx:archive` 前 → 不觸發 agent，執行 `doc-audit`

**路由注意事項**：
- 同一段討論若跨越多個類型（如從痛點探索轉入設計討論），在類型轉換時主動帶入對應 agent
- 純澄清 / 查詢（「XX 術語是什麼」「狀態機在哪裡」）不觸發 agent，直接回答
- 已在執行 OpenSpec change 工作流時，agent 呼叫遵循 config.yaml rules，不重複觸發
- 序列協作 Phase 4 由 PM 匯報「整體設計方案 + 砍掉的功能清單 + 逐條回應 challenge」，**MUST NOT** 由 Claude 協調者自行彙整
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
config.yaml rules 會自動注入 OQ 查詢、序列協作（PM 釐清 → CEO 指標 → 顧問實作 → PM 匯報），驗收前再執行三視角審查。
- 設計階段協議：[[sequential-design-collaboration]]
- 驗收前審查協議：[[multi-agent-discussion-protocol]]（過渡期保留）

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
| 使用者故事 / 業務情境 | Vault `13-user-stories/<module>/`（**User Story 內部正本，2026-05-21 新增**）+ Vault `07-scenarios/README.md`（跨模組端到端情境）| 各模組 spec § Scenarios（Acceptance Scenarios，Given/When/Then 工程驗收）、Vault `03-roles/` |
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
| User Story（業務故事集）| **Vault `memory/erp/ERP_Vault/13-user-stories/`**（內部正本，2026-05-21 改寫）；Notion 發布版本：https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d；OpenSpec spec § Scenarios 為 requirement-level Acceptance Scenarios（Given/When/Then 工程驗收）非 user story |
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
| 需求單 | `openspec/specs/quote-request/spec.md` | https://www.notion.so/3293886511fa80998ac0e8cdf555da68 | v3.4 | 草稿（v3.4：align-invoice-line-items-to-ezpay-spec 2026-05-26 歸檔 — MODIFIED Data Model「QuoteRequestItem.unit 欄位」inline 9 項 → 引用 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md)（11 項，補「式 / 組」雜支用）+ ADDED Requirement「需求單印件單位來自共用 LOV」（2 Scenario）；對齊 ezPay API ItemUnit Varchar(2) 中文 2 字限制；連動 prototype 改 EditPrintItemPanel 用 UnitSelect 元件；v3.3：resolve-consultation-request-gaps-cr-1-cr-2 2026-05-22 歸檔 — MODIFIED「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」對齊 CR-2 雙欄位 consultant_note 設計：requirement_note 帶入規則改為 consultation_topic + consultant_note 雙區塊合併（`[客戶原話]` + `[諮詢人員筆記]`，consultant_note 為空時省略筆記區塊）；GIVEN「已指派 consultant_id」→「已認領 consultant_id」對齊 CR-1 純自派；Data Model 表格 L540「需求備註」row 同步更新雙區塊 mapping 說明（人工同步）；v3.2 simplify-quote-billing-company-mapping 2026-05-15 歸檔延續）|
| 訂單管理 | `openspec/specs/order-management/spec.md` | https://www.notion.so/32c3886511fa806bad41d755349b0567 | v1.12 | 草稿（v1.12：remove-aging-payment-supervisor-dashboard 2026-05-26 歸檔 — MODIFIED Requirement「處理中 Payment 老化追蹤」拆「業務主管 sidebar 入口」+「清單頁欄位」+ Scenario「業務主管查看老化處理中 Payment 清單」（Scenarios 4 → 3）+ 設計理由補註主管追蹤跨訂單老化清單改採 csv 匯出後 Excel 篩選方式（csv 機制另議於 [[ORD-022-Payment-csv匯出機制]]）；保留 row Badge「老化 N 天」+ 7 天閾值 + 判定條件（處理中 + 未取消 + > 7 天）；連動 prototype 拆 AgingPaymentsPage.tsx / App.tsx 路由 / AppSidebar 入口 / useErpStore.getAgingPendingPayments selector；isPaymentAging helper 與 createdAt 欄位保留；ORD-021 resolved with two-stage decision；不跑序列協作（流程節點調整單模組內、Miles 指示輕量處理）；v1.11：align-invoice-line-items-to-ezpay-spec 2026-05-26 歸檔 — ADDED Requirement「發票品項符合 ezPay 與電子發票法規硬約束」（6 Scenario：五欄全必填 / itemAmount = count × unitPrice 自動計算 disabled / count Int(5) ≤ 99999 / unitPrice 整數 lint 擋小數 / unit 來自共用 LOV dropdown / unitPrice label 依 Category 切換稅基）+ ADDED Requirement「PlannedInvoice 品項鏈式預填」（4 Scenario：從訂單印件預填 / 印件異動無連動 / Invoice 一鍵開立沿用 PlannedInvoice items / 手動開立不提供印件帶入按鈕）+ MODIFIED Requirement「發票開立（藍新 Mockup）」補品項五欄送藍新對應規則 + B2C 含稅 Scenario + ADDED Data Model「InvoiceItem」（五欄子結構表，對應 ezPay PostData ItemName/ItemCount/ItemUnit/ItemPrice/ItemAmt）+ ADDED Data Model「PlannedInvoice」（完整表格 + 狀態機，spec 過去未定義本次補齊）+ MODIFIED Data Model Invoice.items 由 JSON → InvoiceItem[]；外部硬約束：ezPay API EZP_INVI_1.2.2 + 財政部電子發票整合服務平台 MIG（raw 卡 [[2026-05-26-miles-upload-ezpay-invoice-api-spec]]）；連動 prototype 3 commits（共用 UnitOption / UnitSelect / InvoiceItemTable / 兩 Dialog 改造 / mock backfill）；不跑三視角審查（Miles 指示）；v1.10：refine-consultation-cancellation-and-invoice-flow 2026-05-26 歸檔 — 諮詢取消改半額退費（50%、寫死 in code、不分時機 / 主動方）+ MODIFIED「訂單建立」諸 Scenario（諮詢費 1000→2000 對齊既有實體定義、諮詢取消觸發補 OA(-1000, 諮詢取消退費, 已核可) + 退款 Payment(處理中) + PlannedInvoice(1000) + 移除 SalesAllowance 自動建）+ MODIFIED「OrderAdjustment.adjustment_type 完整 enum」8→9 值（新增「諮詢取消退費」系統內生 type、業務 UI 過濾）+ MODIFIED「諮詢訂單發票時間點處理」完全廢止 invoice_option 自動化、改為純客戶意向參考 + MODIFIED「諮詢取消對帳邏輯」新公式（應收 1000 = 收款淨額 1000）+ ADDED「諮詢訂單收尾自動建 PlannedInvoice 規則」（PlannedInvoice 實體欄位 + 三情境金額表）+ 連動 consultation-request / state-machines / business-processes 對齊；解 CR-3 三議題（部分退費 / 取消理由 / 退款 SLA）；CR-4~CR-8 衍生決議寫入 design.md；不跑三視角審查（Miles 指示）；v1.9：add-side-panel-shared-components 2026-05-25 歸檔 — MODIFIED「印件詳情 Side Panel（PrintItemDetailSidePanel）」size `xl` → `2xl`（720px → 800px、對齊 Figma node-id 8977:269607）+ Body 四區塊改用 SidePanel 共用元件組裝（SidePanelBody / SidePanelSection / SidePanelInfoTable / SidePanelFileList / SidePanelThumbnailList），不再 inline 寫 ErpInfoTable / 自寫 hr 與 padding；新增 3 個 Scenario（dialog 800 + section hr / 多檔垂直疊放 / 縮圖 48x48 水平排列）；連動 prototype-shared-ui ADDED「SidePanel 共用元件組」+「ErpSidePanel size variant 擴充」+ DESIGN.md §0.1 line 52 修訂 + 新增 §1.5 規範章節 + ORD-018 OQ「混合型 SidePanel 規範時機」；三視角審查通過（senior-pm + ceo-reviewer + erp-consultant），Rule of Three premature abstraction trade-off 紀錄於 design § D6；v1.8：add-review-rounds-to-print-item-side-panel 2026-05-25 歸檔 — MODIFIED「印件詳情 Side Panel（PrintItemDetailSidePanel）」Body 三區塊 → 四區塊：apply 階段為對齊 Figma node-id 8977:269607 重做 — 移除 ErpDetailCard 外框、改 inline 用 ErpInfoTable（不再透過 PrintItemSpecCard / PrintItemArtworkCard）、新增第四區塊「審稿紀錄」7 欄表格（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註），文案規則含「系統免審」/「系統沿用」/「待分派」、結果欄文字加色（不合格 #dc2626 / 待審 #C97A00 / 合格 預設色）、備註 line-clamp-2 + title tooltip、空狀態「此印件尚未送審」；size lg → xl（720px）；連動修 prepress-review spec § ReviewRound source enum 兩值 → 三值（含「售後補印」、refine-supplementary-print-skip-review 漏的 spec drift fix）；新增 5 個 Scenario（多輪混合 / 免審稿 / 售後補印 / 空狀態 / 備註截斷）；v1.7：refine-order-detail-tabs 2026-05-21 歸檔 — MODIFIED「訂單階段印件規格編輯時機」（製作後業務發起異動動線分為兩條：金額異動 → 訂單異動 Tab、印件規格異動 → 業務通知印務從工單異動處理；row-level「申請異動」按鈕完全移除）；MODIFIED「雙欄計價輸入與顯示」（顯示規則改採業界 ERP / MES 模式 A1 — 分項 ErpTable 四欄（分項 / 數量摘要 / 未稅小計 / 含稅小計）+ 底部 summary stack 三層（小計未稅 / 營業稅 5% / 應收總額），取代原 order_source 動態主從切換邏輯）；ADDED「訂單詳情頁業務負責人 row 簡化」（移除「分享 / 轉單」按鈕、純文字顯示）；ADDED「訂單詳情頁印件清單表格結構」（從 20 欄 + ErpExpandableRow 兩層展開改為 14 欄單層 + 縮圖首欄 120px 方形 + 操作欄含「檢視」按鈕；5 個低頻欄移入 Side Panel：預計產線 / 難易度 / 出貨方式 / 稿件 / 工單數）；ADDED「印件詳情 Side Panel（PrintItemDetailSidePanel）」（沿用 PrintItemSpecCard + PrintItemArtworkCard 共用元件 + 6 欄相關工單表格 + 「開啟完整詳情頁」link）；新增 3 個 OQ（ORD-015~017）；v1.6 add-order-note-section-with-template-tool 2026-05-20 歸檔延續）|
| 諮詢單 | `openspec/specs/consultation-request/spec.md` | — | v0.3 | 草稿（v0.3：refine-consultation-cancellation-and-invoice-flow 2026-05-26 歸檔 — 8 MODIFIED + 1 ADDED：MODIFIED「諮詢單實體與表單欄位」新增 cancel_reason_category 必填 enum 6 值（找到其他廠商 / 預算問題 / 需求改變 / 時間無法配合 / 諮詢人員無法出席 / 其他（原因請參考備註））+「諮詢人員認領」/「諮詢人員筆記欄位」措辭由「主管 / 諮詢主管」對齊為「業務主管」（業務主管 = 諮詢主管同一人）+「諮詢結束分支」/「需求單流失觸發建諮詢訂單收尾」補自動建 PlannedInvoice(2000) 不自動開 Invoice +「諮詢取消觸發建諮詢訂單與退費」大幅改寫（半額退費 + 自動建 OA(-1000, 諮詢取消退費, 已核可, approved_by=system) + 退款 Payment(處理中) + PlannedInvoice(1000) + dialog 防呆 cancel_reason_category 必選）+「諮詢費發票時間點處理」完全簡化（invoice_option 降為純客戶意向參考、不再驅動發票自動化）+「諮詢單活動紀錄」事件型別補 cancel_reason_category；ADDED「諮詢取消權限」（限當前 consultant_id + 業務主管、業務不可、5 Scenarios）；解 CR-3 三議題（部分退費 50% / 取消理由 6 enum / 退款 SLA 由金流處理 + 通知由諮詢人員手動）；不跑三視角審查（Miles 指示）；v0.2：resolve-consultation-request-gaps-cr-1-cr-2 2026-05-22 歸檔 — 解 OQ CR-1（諮詢分派模式拍板純自派：REMOVED「諮詢人員指派」+ ADDED「諮詢人員認領」含主管代為認領 / 併發衝突 / 區隔顯示等 4 Scenarios + MODIFIED「諮詢費付款成功觸發自動建單」Slack 通知改諮詢人員群組廣播 + MODIFIED「諮詢結束分支」/「諮詢單轉需求單欄位帶入」/「諮詢單活動紀錄」Scenarios「已指派」→「已認領」+ ActivityLog 事件型別補諮詢人員認領 / 主管代為認領 / 諮詢備註修改）+ 解 OQ CR-2（諮詢備註定位採雙欄位 consultant_note：MODIFIED「諮詢單實體與表單欄位」新增 consultant_note 系統內生欄位 + consultation_topic 加註客戶原話唯讀 + ADDED「諮詢人員筆記欄位」Requirement 含 5 Scenarios + MODIFIED「諮詢單轉需求單欄位帶入」mapping 規則改 consultation_topic + consultant_note 雙區塊合併寫入 requirement_note，consultant_note 為空時省略筆記區塊）；連動修訂 state-machines / quote-request / business-processes 對齊；v0.1 add-consultation-request-and-revise-approval-gate 延續）|
| 售後服務 | `openspec/specs/after-sales-ticket/spec.md` | — | v0.6 | 草稿（v0.6：add-sales-manager-after-sales-page 2026-05-26 歸檔 — ADDED「業務主管全公司售後管理頁」Requirement（中台路由 `/sales-manager/after-sales`、12 欄表格新增「業務 / 諮詢負責人」hover tooltip + 「最後活動時間」相對時間、3 摘要卡 toggle filter、6 篩選器含 status / 業務 / 諮詢負責人、整行可點擊跳訂單詳情頁售後 Tab、純檢視無編輯動作、無 owner filter 顯示全公司、無 sidebar 數字徽章、預設 status filter「未結案」可切已結案查歷史、舊路由 `/sales-manager/after-sales-tickets` redirect + Toast、12 個 Scenarios 含跨部門紀律邊界 / 摘要卡 toggle / 業務 / 諮詢 / 會計 RoleGuard 拒絕等）；新建 OQ AFT-9「最後活動時間 derived field 升級條件」（沿用 updatedAt prototype 階段足夠，未來語意污染風險留 OQ 觀察）；連動 user-roles spec MODIFIED 業務主管角色職責補「中台售後服務檢視」職責 + 明示「檢視範圍 = 全公司唯讀 / 核可決策範圍 = 部門內」並存的職責邊界 + ADDED Scenario「業務主管查看非管轄業務的售後 ticket 紀律邊界」；序列協作 Phase 1 PM 釐清 + Phase 3 顧問實作（流程節點調整單模組內，跳過 Phase 2 CEO + 驗收前審查）+ Phase 4 PM 匯報 6 反向 challenge 決議；v0.5：refine-supplementary-print-skip-review 2026-05-20 歸檔 — MODIFIED「與 PrintItem 關聯（補印觸發）」補印 PrintItem 跳過審稿環節改採「自動通過輪次」（沿用來源印件最終合格稿件 + ReviewRoundSource 擴 enum 加「售後補印」+ ReviewRound 加 sourcePrintItemId 標明來源）；reviewStatus 直接設為「合格」、reviewFiles 拷貝來源、reviewRounds 拷貝來源 + append 自動通過輪次、reviewActivityLogs append「狀態轉移」事件；無需指派審稿員、印務主管立即可在印件總覽分配工單；對齊業界 MES（Tharstern / PrintEPS / Printavo / PrintNow）reorder 跳 artwork approval 主流；v0.4：refine-after-sales-refund-and-add-supplementary-print 2026-05-20 歸檔 — MODIFIED「與 OrderAdjustment 關聯」OA「已執行」推進機制改綁退款 Payment 建立事件 + 「已核可」狀態下業務可改金額不重新送審；MODIFIED「與 PrintItem 關聯」補印 PrintItem.type 自動設「補印印件」 + 跨頁面 PrintItemTypeLabel 識別 + ticket 詳情頁「補印印件清單區」獨立分組（方便反查）+ 舊資料補印不 backfill；v0.3：refactor-my-after-sales-to-standard-list-pattern 2026-05-19 歸檔 — MODIFIED 我的售後服務作業頁 Requirement（layout 對齊 DESIGN.md § 6.1 列表頁規範 + QuoteListPage 範式 B：搜尋 + 篩選 + StatusCard 同一 Card + ErpTableCard + ErpPagination 三件套；next action 從「分組卡片」改為「11 欄獨立 table 欄位」；摘要卡點擊改為 toggle next action filter；新增分頁與更多 Scenarios）；連動寫入 [11-review-knowledge/_shared/review-loading-checklist § 三](memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md) 跨 agent 通用誤審案例「列表頁版型範式」；v0.2：add-my-after-sales-action-page-and-remove-owner-transfer 2026-05-19 歸檔 — ADDED 我的售後服務作業頁（`/my-after-sales` 業務 / 諮詢個人作業視圖、sidebar 數字徽章）、業務 / 諮詢角色售後 ticket 權限範圍（諮詢顯式繼承業務 owner 行為）；MODIFIED AfterSalesTicket 實體（移除 owner_transfer_log 欄位 + opened_by 描述明確化）；REMOVED 業務看板「我的未結案售後」分桶、業務離職 / 請假時 ticket 負責人轉派（業務離職實務替代留 OQ AFT-1）；v0.1 add-after-sales-ticket 2026-05-18 歸檔 — 新建：AfterSalesTicket 容器替代 OrderAdjustment(phase=after_completion) 雙重身份；訂單已完成後客訴 / 不良 / 規格不符 → ticket（受理中 → 處理中 → 已結案），下游動作 0..N OrderAdjustment + 0..N PrintItem；case_category 7 enum、responsibility 3 enum；訂單列表售後欄位；ticket 內直接建關聯 OA / 補印 PrintItem dialog；既有 phase=after_completion 歷史 OA 反向遷移為 legacy_migrated ticket；OrderAdjustment 移入 useErpStore.orderAdjustments 達跨頁面同步）|
| 工單管理 | `openspec/specs/work-order/spec.md` | https://www.notion.so/32c3886511fa80f98a43def401d1edce | v0.7 | 草稿（v0.7：refine-after-sales-refund-and-add-supplementary-print 2026-05-20 歸檔 — MODIFIED「印務主管印件總覽（防掉單）」新增「印件類型」欄位 + filter 三選項（業務平台印件總覽自動繼承）；v0.6：reclassify-qc-and-add-inspection 2026-05-20 歸檔延續）|
| 生產任務 | `openspec/specs/production-task/spec.md` | https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94 | v0.4 | 草稿（v0.4：reclassify-qc-and-add-inspection 2026-05-20 歸檔 — C1 of 4 sequential changes；新增 type/scope/requires_inspection/require_transfer/previous_production_task_ids 欄位 + QC PT 自動建立規則（每印件強制 1 個 scope=print_item）+ 品檢 PT 規劃規則 + NCR 實體與 Disposition 機制（rework/use_as_is/scrap，含 use_as_is 退款邊界明示）+ ActivityLog 稽核鉤子；廢止 QCRecord 獨立實體；ProductionTaskWorkRecord 新增 passed_quantity/failed_quantity；v0.3 add-production-task-transfer 2026-04-24 歸檔延續）|
| 稿件審查 | `openspec/specs/prepress-review/spec.md` | https://www.notion.so/32c3886511fa80eab36aded242f6deb9 | v1.6 | 草稿（v1.6：resolve-prepress-review-gaps-ar-10-ar-12 2026-05-23 歸檔 — 解 OQ AR-10（主管覆寫嚴格門檻 + UI 層阻擋：MODIFIED「審稿主管覆寫分配」補「能力不足者 SHALL 不出現於主管覆寫候選清單」UI 層預先過濾 + 補設計理由段（自動派工破例 vs 主管覆寫嚴格動機差異）+ Scenario rename / 新增可選清單為空時 UI 提示）+ 解 OQ AR-12（打樣後新稿件實體機制 + 根因判定：對齊 Prototype 既有實作 — sampleResult 中文 enum / 打樣 WorkOrder 詳情頁觸發 / PrintItemStatus = '已棄用' 棄用機制 / rebuildPrintItemForSampleNG 棄用 + clone；ADDED「打樣結果業務判定」/「印件追溯欄位」/「打樣後棄用原印件建新印件」三個 Requirement；新增 `PrintItem.derived_from_print_item_id` 結構化追溯 FK 補 Prototype 既有 notes 文字追溯的反向查詢能力）；連動修訂 business-processes / state-machines 對齊；衍生新 OQ AR-13「打樣 NG-製程問題下游處理機制」（待業務累積案例）；Prototype 後續實作待辦：主管覆寫 Dialog UI 層阻擋 + derived_from_print_item_id 結構化 FK；v1.5 refine-prepress-review-scope 2026-04-22 補歸檔延續）|
| 狀態機（跨模組）| `openspec/specs/state-machines/spec.md` | https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 | — | 草稿（2026-05-26 refine-consultation-cancellation-and-invoice-flow 歸檔 MODIFIED「訂單狀態機」§ 諮詢訂單路徑簡化（廢止「已開發票」中間狀態、廢止 invoice_option 對狀態機分支影響）+ 補 4 個諮詢相關 Scenarios（不做大貨即時推進完成 / 流失即時推進完成 / 半額退費維持「製作等待中」待退款 Payment 切已完成 / 退款完成推進訂單完成）；2026-05-23 resolve-prepress-review-gaps-ar-10-ar-12 歸檔 MODIFIED「印件狀態機（雙維度）」補既有 PrintItemStatus = '已棄用' 觸發場景（NG-稿件問題自動棄用）+ 新增 Scenario「已棄用印件雙維度狀態保留作為稽核軌跡」+ MODIFIED「印件打樣特殊流程」對齊 Prototype 中文 enum（OK / NG-製程問題 / NG-稿件問題）+ 三分支 Scenarios；2026-05-22 resolve-consultation-request-gaps-cr-1-cr-2 歸檔 MODIFIED「諮詢單狀態機（v2 簡化）」+「訂單狀態機」對齊純自派；2026-05-20 reclassify-qc-and-add-inspection 歸檔 MODIFIED「跨實體狀態向上傳遞鏈」+「完成度計算」）|
| 商業流程（跨模組）| `openspec/specs/business-processes/spec.md` | https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a | — | 草稿（2026-05-26 refine-consultation-cancellation-and-invoice-flow 歸檔 MODIFIED「諮詢前置流程端到端規則」ASCII 流程圖補半額退費路徑 / OA 自動建 / 退款 Payment 處理中 / PlannedInvoice 自動建 / cancel_reason_category 寫入 / 諮詢人員後續手動動作 + 對帳邏輯更新四情境公式（應收 / 收款 / 發票淨額由諮詢人員手動）+ invoice_option 欄位定位變更段（純客戶意向參考、不驅動系統行為）；2026-05-23 resolve-prepress-review-gaps-ar-10-ar-12 歸檔 MODIFIED「打樣流程規則」對齊 Prototype 中文 enum + 觸發時機改為打樣 WorkOrder 已完成後業務判定 sampleResult + 引用 prepress-review spec Requirements + 三個 Scenarios（打樣通過後業務手動建大貨工單 / 打樣失敗因 NG-製程問題 / 打樣失敗因 NG-稿件問題自動棄用 + clone）；2026-05-22 resolve-consultation-request-gaps-cr-1-cr-2 歸檔 MODIFIED「諮詢前置流程端到端規則」ASCII 流程圖對齊純自派；2026-05-20 reclassify-qc-and-add-inspection 歸檔 MODIFIED「四層計算精確流程」）|
| 業務情境（跨模組）| `openspec/specs/business-scenarios/spec.md` | https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 | — | 草稿 |
| 使用者角色（跨模組）| `openspec/specs/user-roles/spec.md` | https://www.notion.so/32c3886511fa8144b38adc9266395d15 | — | 草稿（2026-05-26 add-sales-manager-after-sales-page 歸檔 MODIFIED「業務主管角色職責」補「中台售後服務檢視」職責措辭 + 明示「檢視範圍 = 全公司 ticket 唯讀（提供跨主管協作可視性）」與「核可決策範圍 = 訂單指定的業務主管 = 自己」並存的職責邊界 + ADDED Scenario「業務主管查看非管轄業務的售後 ticket 紀律邊界」（主管 SHALL 可跳訂單詳情頁售後 Tab 唯讀、MUST NOT 編輯非自己管轄 ticket、需介入 SHALL 透過 Slack 協調）；2026-05-20 reclassify-qc-and-add-inspection 歸檔 MODIFIED QC 角色描述（QC = 印件入庫檢查 + 工序中間品檢執行者，任務模組權限 R/W）；2026-05-14 add-print-item-overview-to-sales-platform 歸檔新增「業務 Role 業務平台功能存取」Requirement）|
| 業務平台（容器 spec）| `openspec/specs/sales-platform/spec.md` | — | v0.3 | 草稿（v0.3：refine-after-sales-refund-and-add-supplementary-print 2026-05-20 歸檔 — MODIFIED「業務平台印件總覽」沿用中台版新增「印件類型」欄位 + filter（三選項預設全選），業務平台版 filter 預設值差異描述；v0.2：add-my-after-sales-action-page-and-remove-owner-transfer 2026-05-19 歸檔 — ADDED 業務平台「我的售後服務」入口 Requirement（業務 / 諮詢可見 + 過濾規則 / 動作可見性 / 預設體驗 + 移除舊「售後服務單轉派」sidebar 入口）；v0.1 2026-05-14 add-print-item-overview-to-sales-platform 歸檔 — 新建容器 spec + 業務平台容器定位 / 業務平台印件總覽 / 業務平台印件詳情頁 Tab 閹割三條 Requirement）|
| 材料主檔（BOM 底層）| `openspec/specs/material-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| 工序主檔（BOM 底層）| `openspec/specs/process-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| 裝訂主檔（BOM 底層）| `openspec/specs/binding-master/spec.md` | — | v0.1 | 草稿（ERP 中台已實作）|
| Prototype 資料層（跨模組工程）| `openspec/specs/prototype-data-store/spec.md` | — | — | 草稿（2026-04-20 e2e + 2026-04-21 data-consistency-audit）|
| Prototype 共用 UI（跨模組工程）| `openspec/specs/prototype-shared-ui/spec.md` | — | — | 草稿（2026-05-26 align-invoice-line-items-to-ezpay-spec 歸檔 ADDED「共用單位 LOV」Requirement（11 項：張/本/冊/份/個/卷/盒/套/批/式/組 + 4 Scenario：發票 Dialog 顯示完整 / 需求單 dropdown 同步 / 字符長度全部符合 ezPay Varchar(2) / 共用 LOV 變更時所有引用處同步）；對應 src/types/shared.ts UNIT_OPTIONS + UnitSelect 共用元件；2026-05-25 add-side-panel-shared-components 歸檔 ADDED 2 個 Requirement：「SidePanel 共用元件組（Figma 8977:269607 對齊）」（5 個元件 SidePanelBody / SidePanelSection / SidePanelInfoTable re-export / SidePanelFileList / SidePanelThumbnailList，含 13 項驗收清單 + 6 項禁用 anti-pattern + 編輯型 SidePanel 豁免規則）+「ErpSidePanel size variant 擴充」（新增 size=`2xl`=800px、既有 sm/md/lg/xl/full 不動）；連動修 order-management spec § 印件詳情 Side Panel + DESIGN.md §0.1 line 52 + §1.5 新章節；新增 ORD-018 OQ「混合型 SidePanel 規範時機」；2026-05-20 refine-after-sales-refund-and-add-supplementary-print 歸檔新增 2 個 Requirement：「PrintItemTypeLabel 共用元件」（三值通用 — 打樣 / 大貨 / 補印，補印 hover + click 跳轉 ticket，禁用補印專屬徽章維持設計系統一致性）+「列表頁印件類型欄位通用設計」（適用列表清單與訂單列表（OrderList）不適用之說明）；2026-04-21 fix-erp-summary-grid-info-icon-overflow 起點；2026-05-06 refactor-detail-pages-to-subheader-tab-layout 歸檔新增「印件詳情頁 Tabs 化版型」Requirement；2026-05-19 align-payment-list-pages-to-quote-list-pattern 歸檔新增 5 個 Requirement：「列表頁標準佈局 / StatusCard 元件支援字串型 count 與篩選中標記 / 款項管理列表頁對齊基準範本 / 諮詢單列表頁對齊基準範本 / QuoteListPage canonical reference 自身對齊新規範」；同步補強 sens-erp-prototype/DESIGN.md § 6.1 範式 B 模板 + 12 條共同準則 + 操作性判定 + 12 項稽核清單；OQ-2 標明 capability 歸屬待後續決定）|
| QC | `openspec/specs/qc/spec.md` | — | v0.2 | 草稿（v0.2：reclassify-qc-and-add-inspection 2026-05-20 歸檔 — 大幅收斂為薄層；REMOVED 9 個既有 Requirement（QC 單實體定位 / 狀態機 / 建立流程 / 可申請上限 / 結果記錄 / 通過數分層 / pt_qc_passed 觸發 / 異動行為 / 與出貨關聯）；MODIFIED「QC 角色權限邊界」；QC 業務語意已併入 production-task capability，QC = 印件層 ProductionTask type=qc/scope=print_item，每印件強制 1 個）|
| 派工看板 | `openspec/specs/task-dispatch-board/spec.md` | — | — | 草稿（2026-05-20 refine-after-sales-refund-and-add-supplementary-print 歸檔 MODIFIED「工序卡片內任務明細表」新增「印件類型」欄位（緊鄰印件名稱、三值通用 PrintItemTypeLabel）+ 工序卡片頂部 filter 三選項；2026-05-19 task-dispatch-prototype 歸檔合併 8 個 Requirement 為 prototype 初版基線；後續排程模組重構另開 change）|
| 排程中心 | `openspec/specs/scheduling-center/spec.md` | — | — | 草稿（2026-05-19 scheduling-center 歸檔 8 個 Requirement 為 prototype 初版基線；archive 前修正：移除「設備資料表」requirement 改以獨立 Data Model section；後續重構另開 change）|
| 工單回推排程 | `openspec/specs/schedule-backtrack/spec.md` | — | — | 草稿（2026-05-19 schedule-backtrack-prototype 歸檔 4 個 Requirement 為 prototype 初版基線；後續重構另開 change）|
| 設備主檔 | `openspec/specs/equipment/spec.md` | — | — | 草稿（2026-05-19 scheduling-center 歸檔新建 1 個 Requirement「設備主檔管理」+ Data Model section；對齊 material-master / binding-master 模式；後續重構另開 change）|
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
| **ERP User Story Skill**（兩階段撰寫紀律：業務情境 / UI 操作，含 INVEST 自審、中英夾雜 lint、Notion 推送 mode C）| `.claude/skills/erp-user-story/SKILL.md` |
| OQ 管理 Skill（含去重）| `.claude/skills/oq-manage/SKILL.md` |
| **誤審記錄 Skill**（三視角審查 agent 誤審案例庫，含分類 / 去重 / 四要素提取）| `.claude/skills/misjudgement-record/SKILL.md` |
| 文件稽核 Skill（含自我演化，聚焦 OpenSpec 層）| `.claude/skills/doc-audit/SKILL.md` |
| **Vault 自審 Skill**（10 維度稽核，產 audit-log）| `.claude/skills/vault-audit/SKILL.md` |
| **Vault Insight Skill**（跨主題模式 + 下一步建議，產 12-insights）| `.claude/skills/vault-insight/SKILL.md` |
| **Vault Ingest Skill**（Raw 素材承接與精練，Mode A/B/C + Anti-Model-Collapse 四道防線）| `.claude/skills/vault-ingest/SKILL.md` |
| **Daily Brief Skill**（每日進度回顧 + 今日建議行動，5 道 Anti-Pattern 防護）| `.claude/skills/daily-brief/SKILL.md` |
| **Weekly Review Skill**（本週學到 / 本週完成 / 下週重點，6 道 Anti-Pattern 防護）| `.claude/skills/weekly-review/SKILL.md` |
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
