# BRD 商業邏輯層重構計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重構 wiki 04-business-logic/ 為 BRD 合格的商業知識層——服務藍圖（A 類）+ 商業規則目錄（B 類），消除實作細節滲漏與內容重複。

**Architecture:** 依 Ronald Ross 原則（規則獨立於流程、規則只寫一次），將 04-business-logic/ 分為兩種卡型：A 類服務藍圖描述端到端業務鏈，B 類規則卡描述獨立的決策邏輯與領域知識。流程卡引用規則卡，不複寫。由上到下執行：先修正 01-products/ 頂層錯誤，再建服務藍圖，最後改寫既有規則卡。

**Tech Stack:** Obsidian Flavored Markdown（wiki link）、Git

**核心紀律：**
- 所有內容需與 Miles 確認，不可捏造
- 發現矛盾立即停下與 Miles 討論
- 規則只寫一次，其他地方用 `[[wiki link]]` 引用
- B 類規則卡明確排除：欄位定義、計算公式、枚舉值、API 規格、Prototype 引用、步驟級操作細節

---

### Task 1: 修正 01-products/ 頂層內容

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/01-products/phases.md`
- Modify: `memory/Sens_wiki/wiki/erp/01-products/pain-points.md`
- Modify: `memory/Sens_wiki/wiki/erp/01-products/stakeholders.md`
- Modify: `memory/Sens_wiki/wiki/erp/01-products/product-vision.md`
- Delete content: `memory/Sens_wiki/wiki/erp/01-products/operating-principles.md`（內容轉為 B 類規則卡後廢除）

**Miles 已確認的修正項：**

**phases.md:**
- [ ] Phase 1：補充「讓後續 MES 工單可基於 BOM 建立」目的，標記「進行中」
- [ ] Phase 2：明確為「線下單全流程走通」（諮詢/需求單→報價→審稿→生產報工→品檢→出貨→售後），目的取代 Ragic，標記「進行中」
- [ ] Phase 3：修正為「EC 訂單整合進 ERP」（原寫「生產效率優化分析」是錯的），標記「未開始」
- [ ] 未來 Phase：Dashboard、管理指標等，先跑流程再規劃
- [ ] 移除 Phase 3 § 對應模組中的「派工看板、產能分析、KPI dashboard」（與 memory 中 dashboard 延後決定矛盾）
- [ ] 不鎖死 3 個 Phase，標記後續會持續迭代

**pain-points.md:**
- [ ] 保留現有 3 大核心問題
- [ ] 新增痛點：線下單帳務收款複雜，全靠人工作業
- [ ] 新增痛點：審稿多次來回時，異常難以回追歷史
- [ ] 標記痛點清單會隨訪談迭代擴充

**stakeholders.md:**
- [ ] 移除：訂單管理人
- [ ] 新增至中台：業務主管（負責線下單審核）
- [ ] EC 商品管理改歸屬至 EC 後台（不在中台）
- [ ] 新增至工廠平台：轉交（負責場內製作完成項目移動，與品檢人員為獨立角色）
- [ ] 品檢人員備註：同一批人負責半成品 QC 與成品品檢
- [ ] 新增外包商平台（未來，同中國供應商平台模式）
- [ ] 修正平台數為 8 個

**product-vision.md:**
- [ ] Phase 3 引用修正後同步更新
- [ ] 確認其餘內容無捏造

**operating-principles.md:**
- [ ] 2 條原則（現金流出把關、發票收款彈性）轉為 B 類規則卡
- [ ] 原檔標記為 deprecated 或刪除（待 B 類卡建立後執行）

- [ ] Commit

---

### Task 2: 更新 04-business-logic 卡片模板與排除清單

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md`
- Modify: `memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md`

- [ ] 模板新增 A 類（service-blueprint）骨架：概述 / 流程階段 / 現況痛點 / 適用規則 / 範圍外 / 相關卡
- [ ] 模板新增 B 類（business-rule）骨架：規則 / 為什麼這樣定 / 適用範圍 / 領域知識 / 具體例子 / 例外情境 / 相關卡
- [ ] B 類加入明確「不收清單」：欄位定義 / 計算公式 / 枚舉值 / API 規格 / Prototype 引用 / 步驟級操作細節
- [ ] scope-boundary.md 補充工廠現場範圍外定義：機台操作（上機、換模、調色）/ 工廠內部排程（機台排隊、插單調序）。ERP 邊界到「派工指令送到工廠」和「師傅回報完工」。領料屬 ERP 範圍。
- [ ] Commit

---

### Task 3: 撰寫服務藍圖——諮詢服務流程

**Files:**
- Create: `memory/Sens_wiki/wiki/erp/04-business-logic/諮詢服務流程.md`

**前置：讀取現有相關卡確認事實基礎**
- [ ] 讀 `05-entities/諮詢單.md` + `06-state-machines/諮詢單狀態.md`
- [ ] 讀 `04-business-logic/諮詢收尾規則.md`
- [ ] 讀 `13-user-stories/consultation-request/` 全部 6 張

**撰寫服務藍圖（每階段需與 Miles 確認）：**
- [ ] 草擬諮詢服務流程的階段、角色交接、決策點
- [ ] 呈現給 Miles 確認——不確定的標記為待確認
- [ ] 依 Miles 回饋修正
- [ ] 填寫現況痛點（已知 + Miles 補充）
- [ ] 填寫範圍外
- [ ] 填寫適用規則（引用 B 類卡）
- [ ] Commit

---

### Task 4: 撰寫服務藍圖——線下訂單流程

**Files:**
- Create: `memory/Sens_wiki/wiki/erp/04-business-logic/線下訂單流程.md`

**前置：讀取現有相關卡確認事實基礎**
- [ ] 讀 `05-entities/訂單.md` + `06-state-machines/訂單狀態.md`
- [ ] 讀 `05-entities/工單.md` + `06-state-machines/工單狀態.md`
- [ ] 讀 `04-business-logic/印件生產流程.md`
- [ ] 讀相關 user stories

**撰寫服務藍圖（每階段需與 Miles 確認）：**
- [ ] 草擬線下訂單端到端流程：需求單→報價→訂單→審稿→生產→品檢→出貨→收款→售後
- [ ] 呈現給 Miles 確認
- [ ] 依 Miles 回饋修正
- [ ] 填寫現況痛點、範圍外、適用規則
- [ ] Commit

---

### Task 5: 改寫訂單相關 B 類規則卡（先行批次）

**Files:**
- Modify: 04-business-logic/ 中訂單相關的既有卡（逐張處理）

**處置分類（Miles 已確認）：**
| 卡 | 處置 |
|---|---|
| 訂單異動規則 | 微調為 B 類結構（已接近合格） |
| 明細時點分界 | 微調為 B 類結構（已接近合格） |
| 齊套邏輯 | 提升為 BRD 營運原則，計算公式下沉 |
| 數量換算規則 | 提升為 BRD 營運原則，公式下沉 |
| 印件生產流程 | 移除計算細節，保留流程概覽（部分內容可能併入服務藍圖） |
| 免審決策樹 | 移除欄位名與 Prototype 引用 |
| 現金流出把關 | 從 operating-principles.md 轉入（新建 B 類卡） |
| 發票收款彈性 | 從 operating-principles.md 轉入（新建 B 類卡） |
| payment-invoice-scenarios | 搬到 07-scenarios/ |
| 印件檔案備註上限 | 併入 05-entities/印件.md |

- [ ] 逐張改寫，每張完成後 commit
- [ ] 下沉的實作內容確認目標位置存在後再搬移
- [ ] 更新相關卡的 wiki link 引用

---

## 執行順序與檢查點

```
Task 1（修正頂層）
  ↓
Task 2（更新模板）
  ↓
Task 3（諮詢藍圖）←→ Miles 確認
  ↓
Task 4（線下單藍圖）←→ Miles 確認
  ↓
Task 5（改寫規則卡）←→ Miles 確認
```

每個 Task 完成後 commit + 與 Miles 確認再進入下一個。
