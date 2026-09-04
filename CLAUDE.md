# Memory

## Me
Miles，印刷業 PM，負責兩個產品：**ERP 系統**（生產排程 / 採購 / 倉儲）與**線上編輯器**（B2B SaaS 印刷稿件生成平台）。

---

## 產品

| 產品 | 簡稱 | 說明 |
|------|------|------|
| **ERP 系統** | ERP | 涵蓋生產排程、採購、倉儲、客戶訂單管理 |
| **線上編輯器** | 線上編輯器 | B2B SaaS，客戶上傳圖片後依內容產生製作稿件（刀模線、壓克力開孔位置、固定版型套圖等） |

→ 深度術語：`memory/Sens_wiki/wiki/跨產品/印刷業共用術語表.md`（行業語言）、`memory/Sens_wiki/wiki/編輯器/線上編輯器術語表.md`。ERP 各實體、狀態、規則的定義不另立詞彙表，以各正本卡的一句話定位段為準

---

## PM 工作模式

### PM 技能（依情境主動觸發）

| 情境 | 技能 |
|------|------|
| 撰寫功能規格 / PRD | `product-management:write-spec` |
| 關係人更新 / 週報 / 決策備忘 | `product-management:stakeholder-update` |
| Roadmap 規劃 / 優先排序 | `product-management:roadmap-update` |
| 整理用戶訪談 / 研究資料 | `product-management:synthesize-research` |
| KPI 設計 / 指標分析 | `product-management:metrics-review` |
| 競品分析 | `product-management:competitive-brief` |
| 產品點子發想 / 問題空間探索 | `product-management:product-brainstorming` |
| Sprint 規劃 / 容量估算 | `product-management:sprint-planning` |

### 生產力工具

| 情境 | 技能 |
|------|------|
| 追蹤本次討論的待辦 | `productivity:task-management` |
| 新增術語 / 更新記憶檔 | `productivity:memory-management` |
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
  - 商業流程（wiki `04-business-logic/`）：業務流程與核心規則
  - 狀態機（wiki `06-state-machines/` 各狀態機卡 + 各模組 spec 內嵌狀態機 Requirement）：需求單 / 訂單 / 工單 / 印件 / 任務 / 生產任務 / QC / 出貨單
  - Notion 業務情境 DB：具體業務情境驗證
  - 使用者角色（wiki `03-roles/`）：確認角色權責
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
- 修訂理由寫進 `wiki/log.md`，正文不留迭代史

**6. 角色驗證優於假設**
- 流程中的每個動作都應明確指定執行角色（Who）
- Spec 撰寫時必須讀使用者角色（wiki `03-roles/`），確認角色權責是否合理
- 反例：「業務出貨」、「印務質檢」（角色錯誤）
- 正例：逐一檢查流程步驟 → 對照 wiki 角色卡的角色權責 → 若發現矛盾，先修正 wiki 角色卡再撰寫 Spec
- 應用場景：設計訂單 / 工單 / 出貨 / QC 等涉及跨角色協作的流程時，必檢

**7. 文件格式與呈現精簡**
- 表格與流程圖應使用純文字或標準 Markdown 符號（如 `→`）表達邏輯
- 避免過度視覺化，專注內容本身

**8. 用語一致性與台灣在地化**
> 通則（繁體中文、禁中英夾雜、避免 PRC 用語、技術詞括號附註）正本在全域 `~/.claude/CLAUDE.md` § 語言與用語，本節只列 Sens 專屬對照。
- 範例修正：
  - 「狀態快照」→ 改為「狀態說明」（台灣不使用 Snapshot 直譯）
  - 文件中的列表項目應使用「說明」或「描述」而非外來用詞
  - 「桌面走查 / 端到端走查」→ 改為「推演 / 端到端推演」（walkthrough 直譯為「走查」屬 PRC 用語，台灣不自然；PM 事前演練流程用「推演」）
  - 「Prototype 走查」→ 改為「Prototype 試用」（事後操作介面檢視，語意比「走查」精準）
  - 「dogfood / dogfooding」→ 改為「親身試用」或「自用試跑」（自己用自己的產品 / 流程；對話與描述用中文，僅 source enum 等技術 token 可保留 `prototype-dogfood`）
- Spec 中的角色名稱、流程步驟應符合公司實際用語與台灣行業慣例
- **業務情境卡的欄位名 / 實體名對照**：一律用介面中文（payment → 款項紀錄、printItem → 印件、orderAdjustment → 訂單異動、quoteRequest → 需求單、workOrder → 工單、productionTask → 生產任務、reviewRound → 審稿輪次、paymentPlan → 付款計畫、afterSalesTicket → 售後服務單 等），詳見 [[wiki/erp/07-scenarios/規範 - 業務情境]]

**9. ERP 系統術語統一規範（業務友善）**
- 所有技術術語應轉化為業務容易理解的表達方式
- **術語對應表**（v1.0，2026-03-03）：
  - 「Bubble-up」→「狀態向上傳遞」或「自動推進」（描述狀態如何從下層向上流動）
  - 「聚合」→「統計」、「統計邏輯」或「合併計算」（描述多層數據的匯總）
  - 「min() 聚合」→「最少工單原則」或「基於 BOM 結構的齊套性邏輯 (Kitting Logic)」（描述取最小值的邏輯）
  - 「守衛條件（guard）」→「轉換條件」（狀態機轉換表與圖說用）；權限類前提用「把關條件」（2026-08-04 拍板，wiki 已全庫改詞）
  - 「閘門（gate）」→「門檻」「把關條件」或「順序限制」（依語境；台灣不慣用閘門直譯）
- 應用位置：Notion 業務情境 DB、狀態機 spec、商業流程 spec 等所有相關文件
- 每次修訂術語須同步更新所有相關文件，確保語境一致
- 本對應表即為此規約的正本（wiki 不另立 ERP 術語表）

**11. 跨頁面引用規則（Notion / BRD 引用）**
- BRD / Spec / 討論文件內所有跨頁面引用，一律使用 `[可讀名稱](URL)` 格式，讓讀者可直接點擊跳轉
- 不得只寫名稱不附連結，也不得只寫 URL 不附名稱
- 所有 Notion 資源名稱與 URL 的完整對照，統一維護於 `memory/shared/notion-index.md`（唯一正本）；URL 異動時先更新此檔，再同步各 skill / agent
- 常用引用格式範例見 `memory/shared/notion-index.md` 各資源的「BRD 引用格式範例」欄

**10. 主動收尾（討論結束前自動執行）**
- 凡涉及 Spec / BRD / 需求 / OQ 的實質討論，在對話收斂後主動執行下列收尾動作，**不等 Miles 提示**：
  1. 查 Vault `memory/Sens_wiki/wiki/erp/08-open-questions/`，新增或解答本次涉及的 OQ（透過 `oq-manage` skill 模式 B / C）
  2. **掃描本次變動的 Vault / Spec 檔是否含 `[!question]` callout、`## Open Questions` section 或 inline OQ 措辭（「待確認」「待釐清」「需確認」「尚未確認」「待補」），發現則觸發 `oq-manage` mode D 遷出為獨立 OQ 卡後才能 commit**
  3. 更新對應 OpenSpec spec / Vault 卡（若有內容異動）
  4. 確認 CLAUDE.md § Spec 規格檔清單是否需補充
  5. 確認 memory/ 相關檔案是否需更新
  6. **若本次有 ≥ 5 個 Vault 卡異動 → 主動建議 Miles 跑 `vault-audit`**（14 維度自審）
  8. **若本次對話累積 ≥ 1 條可寫入 raw 的素材（Prototype 試用反饋 / Miles 觀察 / 研究筆記 / 對話 highlight）→ 觸發 `vault-ingest` mode A**（claude-self-capture 須 Miles 確認、claude-research 須附真實 raw-source-link）
  9. **若本次對話結束時累積 status=raw ≥ 10 張 → 主動建議 Miles 跑 `vault-ingest` mode C**（批次掃描 raw 待處理清單）
  10. **設計確認後、進入 `/opsx:propose` 前 MUST 先更新 wiki 商業邏輯卡**（依 `erp-planning-pre-check` 產出的「propose 前須先更新的 wiki 卡清單」執行），確保 ERP_Vault 商業邏輯正本（04-business-logic / 05-entities / 06-state-machines / 07-scenarios）先於 OpenSpec 定案。wiki 是 BRD（商業邏輯正本），OpenSpec 是 PRD（實作規格），正確順序是先定 BRD 再寫 PRD（review-return-and-confirm-production 教訓：wiki 回補放 archive 後導致 spec 混入狀態列舉、重複維護）
- 判斷標準：本次對話是否決定了任何設計、欄位、流程、角色的新內容或修正 → 有則執行，無則跳過
- Spec / BRD / 欄位 / 流程 / 角色有任何異動或設計方向確立時，主動收尾前依 § ERP 討論主動路由 § 變動性質兩級分級觸發 `plan-audit` 稽核；純 OQ 文字更新或措辭修正跳過
- 協作討論的觸發不限於正式寫 Spec：只要討論中有設計傾向出現，也應啟動；agent 先載入全部背景知識再進行
- Stop hook 的收尾清單為備用提醒，主要靠此原則主動驅動

### ERP 討論主動路由（每次 ERP 相關討論開始時自動判斷）

> 判斷標準：Miles 的訊息涉及 ERP 任何模組、業務流程、或產品決策時，先判斷討論類型，再決定主動帶入哪個 agent。不等 Miles 明確要求。

| 討論類型 | 觸發信號（範例） | 主動行動 |
|---------|----------------|---------|
| 商業目標 / 痛點探索 | 「流程很慢」「客戶老是問」「想要做 XX」「現在的問題是…」 | 主對話直接探索：讀對應領域 Vault `04-business-logic/` ＋查 OQ；出現設計傾向時建議 Miles 下 `/grill` 進入正式規劃流 |
| 功能設計有傾向（尚無 change）| 「我覺得應該這樣設計」「這個邏輯你怎麼看」「XX 要怎麼處理」 | `/opsx:explore` → **輕量商業邏輯衝突檢查**（讀對應領域 Vault `04-business-logic/` + 查 OQ、產衝突筆記、攤 A 繞過/B 推翻/C 待釐清 處置選項）；衝突筆記交後續 grill 與 plan-design 承接 |
| 規格撰寫 / 變更 | 「寫 spec」「新增功能」「修改 XX 規格」「規劃文件」 | **新規劃流**（正本 wiki [[審查知識路由]] § 三）：`erp-planning-pre-check` 盤點 → grill 需求對齊（Miles 下 `/grill`，缺拍板紀錄不得進設計）→ 主對話設計（`plan-design` 五必含段）→ `plan-audit` 稽核（rubric 三值判定＋證據，量尺 [[規劃品質評分準則]]）→ 修正至全過 → Miles 拍板 → `wiki-amend` 落卡 → `/opsx:propose` |
| 規格草稿驗收前審查 | `/opsx:verify` 前需最終確認 | 不另啟動（一致性由 plan-audit 標準 5 於設計階段涵蓋）|
| 系統一致性 / 狀態機確認 | 「會不會跟 XX 衝突」「這個狀態怎麼設計」「資料怎麼連」 | 主對話讀 wiki `06-state-machines/` 各狀態機卡 + 各模組 spec 內嵌狀態機 Requirement 直接比對回答；涉及設計變動時進新規劃流（局部級）|
| **規劃 ERP 功能 know-how 稽核（任何模組討論前）** | 「規劃」「設計」「修改 X 邏輯」+ 業務領域觸發詞（諮詢 / 報價 / 訂單 / 工單 / 審稿 / QC / 出貨 / 售後 / 款項 / 發票 / 收款 / 對帳 / OA / Payment / Invoice / PlannedInvoice / 退款 / 補收 / 折讓 / 期次 / 老化 等）| **第一句 MUST 跑 `erp-planning-pre-check` skill**（依 [[business-domain-taxonomy]] 檢索規約判領域——語意不確定先問 Miles——查領域 tag + `領域/全域` 出卡名清單、呈現後載入 → 雙軸量化稽核 6 領域 × 6 卡類型）+ ack 量化矩陣結果（每格 N/M/K 三數字，禁「大致 OK」非量化結論）+ **MUST 列 BI-/ORD- 雙系列 open OQ 清單** + **MUST 依連帶矩陣列出本次變動的連帶影響範圍**（七實體）+ 修補既有卡（**禁新建抽象卡**，動筆步轉介 `wiki-amend`）+ Step 5 閉環驗證 + 反模式追蹤；執行者與稽核者分離（sub-agent 跑稽核 + 主對話 agent 跑修補）|
| **識別到不確定項（任何時機）** | 「這個需確認」「先列 OQ」「待釐清」「待補」「[!question]」 | **立即觸發 `oq-manage` mode B 開獨立檔**（含去重流程），原處改 wiki link 引用；**不可只 inline 標注或用 callout** |
| **識別到稽核誤判（任何時機）** | 「審錯了」「這不是缺漏」「分級判錯了」「規則太學術」「記下來」「這是誤判」| **立即觸發 `misjudgement-record` mode B 寫入 [[稽核誤判記錄]]**（去重 + 四要素提取，通則化者同步修 [[規劃品質評分準則]]）；**不可只口頭說「下次注意」** |
| **Vault 健康檢查 / audit** | 「跑 vault audit」「audit vault」「Vault 健康」/ 主動：≥ 5 Vault 卡異動 / change archive 後 / 每 20+ commit | 觸發 `vault-audit` skill（14 維度，範圍只讀 wiki/＋raw/ 唯讀；要改正本卡轉介 `wiki-amend`），產對話報告含「建議調查的新問題／該補的素材」段 + 追加 wiki/log.md（健檢(audit)） |
| **Raw 素材收集 / 研究筆記** | 「存進 raw」「我要記」「先收集」「研究一下 X」「這份檔案存 raw」「把這個 PDF / 訪談 / 截圖收進來」/ Claude 完成 WebFetch 研究後 / Claude 主動識別「值得記」 | 觸發 `vault-ingest` mode A 寫入 `raw/<YYYY-MM-DD>-<source>-<topic>.md`（claude-self-capture **須 Miles 確認**，claude-research **須附真實 raw-source-link**，miles-upload **須原檔搬 `_attachments/` + 出處**）|
| **批次掃描 raw** | 「看 raw」「掃 raw」「raw 待處理」/ 主動：累積 ≥ 10 張 status=raw | 觸發 `vault-ingest` mode C，產三狀態清單 + 同主題累積警示 + 過期警告 |
| **精練 raw 卡** | 「精練 [檔名]」「ingest 這張」「拆解 raw」 | 觸發 `vault-ingest` mode B（含 oq-manage mode B 協同觸發判斷；cards diff **須 Miles 確認**，正本卡寫入轉介 `wiki-amend`）|
| **寫或改 wiki 正本卡（唯一入口）** | 「寫進 wiki」「更新 wiki」「對齊 wiki」「補一張情境卡」「寫業務情境」「補 [模組] 情境」/ 日常查詢的高價值答案要固化成正本卡 / 其他 skill 判完落點要動 03／04／05／06／07 任一張卡 | 觸發 `wiki-amend`：先過它的 § 〇 硬性載入清單（[[wiki/erp/00-meta/卡片撰寫共用規範]] § 二／§ 三／§ 四／§ 四之二 ＋ 該卡型 `規範 - <單元名>` ＋ 對應骨架 ＋ 範例卡），再判落點、撰寫、稽核、追加 wiki/log.md。**不再有繞過 skill 直接寫正本卡的路徑** |
| **對外發布 / 迭代同步**（依這次更新同步 Notion / Linear）| 「依這次更新同步」「推迭代差異」「同步發布」「更新外部資料」「推 X 到 Notion / Linear」 | 算 delta（只取 archived change、active 不外露）→ 內部正本先到位 → 路由（業務情境卡對外推送若需要另做 skill（外部對接 wiki）；Linear → `linear-delivery`，中台 vs 業務平台 project 分流）→ 每面寫入前列清單給 Miles → 強制回填追蹤 |
| **使用工程紀律框架（mattpocock）** | 「brainstorm / 對齊」「跑 TDD」「除錯」「code review」（限 prototype / erp repo 實作階段） | 實作前 MUST 先 `grilling` 對齊需求（軟強制，補回原 Superpowers SessionStart 消失的強制段；PM 規格階段對齊走新規劃流的 grill 段，不重複）；再依動作調用 mattpocock skill——TDD→`tdd`、除錯→`diagnosing-bugs`、程式碼審查→`code-review`。工程紀律優先於速度 |

#### 變動性質兩級分級（2026-08-05 切換：主對話設計＋rubric 稽核）

| 變動性質 | 判斷標準 | 稽核形態 |
|---------|---------|---------|
| 純措辭 / OQ 文字 | 不改設計、不改欄位、不改狀態轉換 | 不觸發稽核 |
| 局部變動 | 單模組欄位、單流程節點，不動跨模組 | 單一稽核者跑完整 rubric（`plan-audit`）|
| 結構性變更 | 新增實體、跨模組關聯、狀態機層級變動、新增角色、影響 KPI / Phase 範疇 | rubric ＋ 雙盲對抗式情境推演（含資源流出把關、現場操作成本兩個立場鏡頭）|

**判斷者**：稽核開跑前先亮「判定＋一句話理由」給 Miles；**判不準 MUST 直接問 Miles，不自行猜**；判錯案例經 `misjudgement-record` 記入 [[稽核誤判記錄]]。

**與 OpenSpec change 整合（2026-08-05 更新）**：
- `/opsx:explore` → 輕量商業邏輯衝突檢查（衝突筆記交後續 grill 與 plan-design 承接）
- `/opsx:propose` → 前置條件：設計已過 plan-audit 全過＋Miles 拍板＋wiki 已落卡；proposal 承接拍板後設計，不重跑釐清
- `/opsx:continue` / `/opsx:verify` 前 → 不另啟動稽核（一致性由 plan-audit 標準 5 於設計階段涵蓋）
- `/opsx:archive` 前 → 不觸發稽核

**路由注意事項**：
- 純澄清 / 查詢（「XX 術語是什麼」「狀態機在哪裡」）不觸發任何流程，直接回答
- 設計產出缺五必含段（含 grill 拍板紀錄段）時，plan-audit 收件即退件——grill 的強制力來自這道閘門
- 稽核評分表全過後原樣呈 Miles，不由主對話改寫或美化
- 規格撰寫統一透過 OpenSpec change 工作流
- `erp-planning-pre-check` 與寫卡入口的消歧判準：問「這次是要規劃還沒定案的東西，還是把已定案的內容落卡」。前者跑 pre-check（規劃前盤點影響範圍與 know-how 缺口），後者直接走 `wiki-amend`；一段討論先規劃後落卡時兩個都跑，pre-check 在前

---

### OQ 工作流（Vault 為內部正本，2026-05-19 v2）

> **正本**：Vault `memory/Sens_wiki/wiki/erp/08-open-questions/`——平層只放 status=open（待裁決佇列），拍板即封存 `_archives/<年>/`（v3，2026-06-11）。狀態嚴格三值（open / answered / cancelled）。audience 開卡必判：internal＝開發迭代待確認議題；external＝要與業務單位確認的商業層面未知內容。**現階段（2026-08-04 起）一律以 internal 處理、暫停 Notion Follow-up DB 對外推送**，恢復對外流程由 Miles 另行指示。
> 所有 OQ 操作（查詢 / 新增 / 解答封存 / 遷出 / 批次整理五 mode）統一觸發 `oq-manage` skill 執行。

**三個固定動作，每次討論需求 / 寫 Spec 時自動執行：**

| 時機 | 動作 |
|------|------|
| 討論開始前 | 觸發 `oq-manage`（模式 A：查詢），列出本次涉及模組的未解答 OQ（從 Vault `08-open-questions/` 讀取），讓 Miles 確認帶入討論 |
| 討論中 | 識別到不確定項 **立即觸發 `oq-manage` mode B 開檔**（含去重流程），**禁止只在當前回應 inline 標注或用 `[!question]` callout** |
| 討論收斂後 | 觸發 `oq-manage`（模式 B 新增 / 模式 C 更新），寫入 Vault markdown 卡 |

- Vault OQ 目錄：`memory/Sens_wiki/wiki/erp/08-open-questions/`（內部正本）
- Notion Follow-up DB（對外確認版）：https://www.notion.so/32c3886511fa808e9754ea1f18248d92
- Vault → Notion 推送由 Miles 觸發（對外發布 SOP 見各 skill 內自帶邏輯）

---

### 如何開始 Spec 迭代

> **OpenSpec 為規格管理工具**，所有規格變更透過 change 工作流進行。

**① 探索（Why）** → `/opsx:explore`
釐清問題、驗證方向。讀此部分（§ 核心原則）理解設計思維。

**② 建立變更（How to write）** → `/opsx:propose` 或 `/opsx:new` + `/opsx:continue`
系統自動引導產出 proposal → delta specs → design → tasks。
config.yaml rules 會自動注入 OQ 查詢與 proposal 前置條件（設計已過 plan-audit 稽核＋Miles 拍板＋wiki 已落卡）。
- 設計與稽核流程正本：wiki [[審查知識路由]] § 三＋[[規劃品質評分準則]]

**③ 實作與驗證（How to verify）** → `/opsx:apply` + `/opsx:verify`
依 tasks 執行 Prototype 建置，驗證實作符合 specs。

**④ 歸檔（Archive）** → `/opsx:archive`
delta specs 合併回 main specs，歸檔 change。

**⑤ 發布（Publish）** → 交付至 Linear
累積數個 change 後，觸發 `linear-delivery` skill 將更新後的 main specs 交付至 Linear（對開發的唯一正本，內容自包含）。

---

## 版本控管規範（Git）

**Commit 格式**：`{prefix}: {繁體中文描述}`

| Prefix | 使用時機 |
|--------|---------|
| `feat:` | 新增文件、功能描述 |
| `fix:` | 修正錯誤、補漏、澄清歧義 |
| `refactor:` | 結構調整，內容不變 |
| `docs:` | 更新說明性備註 |

**結尾必加**：當前執行模型的署名（格式 `Co-Authored-By: {現行模型名} <noreply@anthropic.com>`，依系統提示中的實際模型填寫，不寫死版本）
**每次修改 `memory/` 或 `.claude/agents/` 後，連同 CLAUDE.md 一起 commit，commit 完成後 hook 會自動 push。**
→ Commit 格式範例見 `memory/erp/spec-iteration-workflow.md` § 迭代後 § Step 3

---

## Plan mode 撰寫規範

> 進入 Plan mode（Shift+Tab Twice 或 /plan）後產出的 plan 檔，須符合以下雙層結構。
> 完整模板：[memory/shared/plan-template.md](memory/shared/plan-template.md)

### 為什麼需要

Plan mode 是 PM 與 Claude 對齊「要做什麼」的最後閘門。Plan 必須 PM 看得懂（業務語言）且 Agent 執行得了（技術細節），雙層共一份避免不同步、避免 PM 跳過閘門。

### 必遵守規則（MUST）

1. **依模板撰寫**：A 業務段（A1 As-is/To-be 表 + A2 PM 工作體驗變動 + A3 對 PM 平時工作流影響 + A4 決策點 + A5 OQ）+ B 技術段（B1 修改檔案 + B2 資料/結構變動 + B3 可重用元件 + B4 驗證）
2. **業務段 A 禁用工程術語當主詞**：
   - 禁止檔名（`.ts` / `.tsx` / `.py` 等）當主詞
   - 禁止程式碼物件（interface / type / function / class）名當主詞
   - 必要時用括號附註，例：「印件編輯權限規則（technical: canEditPrintItemInSidePanel）」
3. **A4 決策點顯式呈現**：每項議題附「選項 + 建議 + 理由」三件套
4. **技術段 B 精簡**：只列 Agent 執行需要的最小資訊（檔案路徑 + 一句話描述），不重複 A 段內容
5. **B4 驗證方式必須可執行且有成功條件**：每項驗證須含 (a) 具體指令（`grep` / `ls` / `npm test` / `playwright test` 等）或具體操作（開啟某頁面 / 點某按鈕）(b) 明確的成功條件（命令輸出含 X / 畫面出現 Y / 測試 N 項通過）；禁用「跑測試」「手動驗證」「確認檔案正確」等模糊描述
6. **拍板前自審 6 項**：(1) A1-A5 齊備 (2) 業務段無工程術語當主詞 (3) A4 三件套齊備 (4) B 段未重複 A 段 (5) B4 每項驗證皆可執行且有成功條件 (6) 是否屬「不適用情境」

### 不適用情境（免雙層）

- 純錯字 / 措辭修正（< 5 行 plan）
- 純查詢 / 研究類任務（無實作動作）
- `/opsx:apply` 階段（tasks 清單已是執行依據，方向已 verify）

### 與既有規範關係

- 與新規劃流（grill 對齊 → plan-design → plan-audit）相容；雙層 Plan 是 OpenSpec 探索之前的方向對齊
- 與「OQ 工作流」相容；A5 段對應 oq-manage skill 觸發
- 與 karpathy-guidelines § 4「Goal-Driven Execution」相容；雙層 Plan 是該原則的展開

---

## 常用印刷業術語（熱快取）

→ 完整術語：`memory/Sens_wiki/wiki/跨產品/印刷業共用術語表.md`

---

## ERP 高頻術語（熱快取）

→ ERP 的實體、狀態、規則定義**不設術語表**：查定義直接讀對應正本卡的「一句話定位」段，依 `[[business-domain-taxonomy]]` § 檢索規約定位（入口 `memory/Sens_wiki/wiki/erp/00-meta/erp_index.md`）。印刷業行業語言見 `memory/Sens_wiki/wiki/跨產品/印刷業共用術語表.md`

---

## 線上編輯器高頻術語（熱快取）

→ 完整術語：`memory/Sens_wiki/wiki/編輯器/線上編輯器術語表.md`

---

## 偏好

- 全域偏好（回覆風格、語言與用語、文件迭代分層）正本在 `~/.claude/CLAUDE.md`；sub-agent 不會自動拿到該檔，需要遵守時明讀
- Spec 格式：**OpenSpec**（`openspec/specs/`）為工作版本（正本）；對開發的發布以 Linear 為唯一正本（經 `linear-delivery` skill 交付，內容自包含，不再使用 Notion 作為 BRD 發布版）。變更管理使用 OpenSpec change 工作流
- **Prototype / 介面設計**：Prototype 一律在 `erp` repo（本地路徑 `/Users/b-f-03-029/erp`，統一 design system、前端直串，開分支＋前端主管 PR 合併；工作模式見 memory `project_erp_repo_prototype_workflow`，實作 MUST 經 repo 內 skill `prototype-from-prompt`）。舊 repo `sens-erp-prototype` 與 Lovable 已於 2026-08-12 拍板**全面棄用**，不再考慮、不再對齊
- **ERP 平台限制**（2026-09-04 修訂）：辦公角色（業務、印務、生管、會計等）僅支援電腦版（桌機瀏覽器）；**現場回報介面例外開放手機寬度**，範圍寫死於五個介面——師傅報工、品檢記錄、貨運單點收秤重、揀貨裝箱回報、出貨／送達確認（師傅、品檢人員、揀貨人員、出貨人員四角色在現場以手機寬度操作同一套頁面）；廠務轉交回報走 Slack 表單通道（正本在系統、通知帶單預填、保留補登路徑、身分對映四前提）。決策脈絡見 Vault OQ PT-001 決議（已封存）
- 優先非同步溝通
- 寫或改程式碼時載入 skill `andrej-karpathy-skills:karpathy-guidelines`

---

## wiki 與 OpenSpec 分工（唯一正本，勿在他處重述）

- **wiki（BRD 層，memory/Sens_wiki/wiki/）= 商業需求單一正本**：商業目標 / 痛點 / 營運原則 / 業務規則與恆定約束（invariant）/ 角色分權動機 / 領域知識 / KPI / OQ / **業務可見欄位表**（實體卡 `05-entities/`）/ **狀態列舉**（狀態機卡 `06-state-machines/`）。回答 why、「什麼必須成立」、以及「介面上看到什麼資料」。
- **OpenSpec（PRD 層，openspec/）= 系統行為規格單一正本**：功能 Requirement / 驗收 Scenario（Given/When/Then）/ 狀態轉換規則（guard 條件 + 觸發事件）/ 角色權限規格 / change 工作流。回答 how（系統在什麼條件下做什麼），驅動 Prototype 與 Linear 交付。**不再包含 Data Model 欄位表與狀態列舉**（已遷移至 wiki）。
- **單一正本鐵則（同一內容只有一個家）**：
  - **欄位正本歸 wiki**：實體卡 `05-entities/` 的「欄位（業務可見）」段。欄位的新增與修改是商業決策，直接在 wiki 維護，不經 OpenSpec change 工作流。
  - **狀態列舉正本歸 wiki**：狀態機卡 `06-state-machines/` 的「狀態列舉」段。狀態的新增與修改同上。
  - **轉換規則正本歸 OpenSpec**：狀態在什麼條件下怎麼變（Requirement + Scenario），留在各模組 spec。
  - **業務規則正本歸 wiki**：商業邏輯卡 `04-business-logic/`。
  - **角色 R&R 正本歸 wiki**：角色卡 `03-roles/`。
  - OpenSpec spec MUST NOT 複寫 wiki 欄位表或狀態列舉（改為引用 wiki 卡）。wiki 卡 MUST NOT 複寫 OpenSpec 的轉換規則或 Scenario。
- **Prototype＝介面與互動正本（交付層，2026-07-15 新增）**：頁面結構與版型、操作動線、元件呈現以 Prototype 為準；mock 資料的值、API 形狀、權限的後端強制不在其權威範圍（此邊界僅此一處宣告，交付文件不另附邊界表）。交付到 Linear 時不設 Prototype 參照格，交付文件亦不文字重述操作動線。設計票（DE 票）不再產出，操作方式與介面由 Prototype 承載。
- **引用方向**：OpenSpec change 的 Why 段以相對連結引 wiki 卡（下游引上游）。wiki 不承載與實作文件的對應（frontmatter 不設 `implemented-by`／`module` 等實作對應欄位，實作對應屬 PRD 層）。wiki 的 `source` 禁指 openspec/specs/（違者報錯）。
- 細部「收 / 不收」邊界見 [scope-boundary](memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md)。**本分工僅此一處宣告；wiki 各卡與 .claude/rules 不得再重述。**

---

## 快速索引

### 載入原則（Task 開始時依類型選擇最小必要檔案）

> **2026-05-19 重大更新**：商業需求 KM 中樞為 `memory/Sens_wiki/wiki/`（Vault），實作 / UI / 演算法不在此（見 [Vault scope-boundary](memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md)）。
> AI 撰寫 OpenSpec change 時必須先讀 Vault 對應卡（見「商業層查詢」row），在 change proposal `## Why` / `## Background` 段以相對路徑或 wiki link 引用 Vault 節點。
> **撰寫 OpenSpec change 的層級順序（2026-06-09 更新）**：先讀 wiki 商業邏輯 + 欄位表 + 狀態列舉（ERP_Vault 商業需求正本，含實體卡欄位與狀態機卡列舉）→ 再 openspec 行為規格（Requirement / Scenario / 轉換規則）→ 最後 code。wiki 是商業需求正本（含欄位與狀態），openspec 是行為契約，順序不可顛倒。欄位或狀態的新增 / 修改先更新 wiki 卡，再視需要於 openspec 補對應 Requirement。

| Task 類型 | 必讀 | 視需要 |
|----------|------|--------|
| **商業層查詢**（商業目標 / 角色 / 商業邏輯 / 實體關聯 / 狀態機 / 跨模組情境）| 讀 wiki 總入口 [wiki/index.md](memory/Sens_wiki/wiki/index.md)，依 `[[business-domain-taxonomy]]` 檢索規約定位對應領域卡（判領域 → 領域 tag 查卡名清單 → 呈現 → 載入；入口即 router，不在此重列深路徑） | OpenSpec spec § Requirements（功能規格） |
| **撰寫 OpenSpec change**（背景對齊）| Vault `04-business-logic/` + `05-entities/` + `03-roles/` 對應卡 → 引用至 proposal `## Why` | Notion 索引（`10-references/notion-index.md`） |
| **撰寫 Spec / PRD** | 觸發 OpenSpec change 工作流（`/opsx:propose` 或 `/opsx:new`），背景資料由 Vault 對應卡引用 | 迭代時參考 `memory/erp/spec-iteration-workflow.md` |
| 情境驗證 / 補情境 | Vault `07-scenarios/`（業務情境卡；三層：骨架 `wiki/範本/範本 - 業務情境`／規範 `規範 - 業務情境`／範例 `範例 - 業務情境`）+ 業務情境 spec（`openspec/specs/business-scenarios/spec.md`）| Vault `03-roles/`（角色責任分配）|
| 確認 / 解答 Open Question | Vault `08-open-questions/`（**內部正本，2026-05-19 改寫**）+ 觸發 `oq-manage` skill | Notion OQ DB（對外確認版，見 § OQ 工作流）|
| 業務情境 | Vault `07-scenarios/`（業務情境卡；三層：骨架 `wiki/範本/範本 - 業務情境`／規範 `規範 - 業務情境`／範例 `範例 - 業務情境`）| 各模組 spec § Scenarios（Acceptance Scenarios，Given/When/Then 工程驗收）、Vault `03-roles/` |
| **審查方法論 / 框架查詢** | Vault `11-review-knowledge/`（入口 [審查知識路由](memory/Sens_wiki/wiki/erp/11-review-knowledge/審查知識路由.md)）| `plan-design`／`plan-audit` skill |
| **Prototype 製作** | erp repo 內 skill `/Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md`（設計規範唯一入口）+ 對應 Spec + 狀態機 spec | Notion 測試案例 DB：https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| Prototype 驗證 / 反饋 | `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/` 對應模組 + 同 repo `ACCEPTANCE.md` | — |

### 資源導航

- wiki 總入口（商業需求 KM 中樞）：[wiki/index.md](memory/Sens_wiki/wiki/index.md)
- Notion URL 唯一正本：`memory/shared/notion-index.md`
- OpenSpec 規格目錄：`openspec/specs/`（20 個模組，目錄結構即自描述）
- Prototype repo：`/Users/b-f-03-029/erp`（實作入口：`.claude/skills/prototype-from-prompt/SKILL.md`；驗收：`apps/erp/src/app/(prototype)/ACCEPTANCE.md`）
