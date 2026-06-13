---
type: meta
status: active
last-reviewed: 2026-05-28
---

# ERP 規劃前 know-how 稽核框架

> 「**規劃 ERP 前必跑稽核 + 修補既有卡**」的方法論正本。
> 配套 skill：[[../../../../.claude/skills/erp-planning-pre-check/SKILL.md|erp-planning-pre-check]]
> 配套分類：[[business-domain-taxonomy]]（6 領域）+ [[wiki-schema]]（frontmatter）
> 受 Karpathy LLM Wiki Vault + YouTube /goal 影片啟發。

## 一、目的與適用範圍

**目的**：Claude 規劃 ERP 功能前，主動稽核既有 Vault know-how 卡，識別缺漏 / 錯誤並修補既有卡（**不新建抽象卡**），避免重複問已答過的真實狀況、避免設計跑偏。

**適用範圍**：
- Miles 說「規劃 X 功能」「設計 Y」「修改 Z 邏輯」時
- CLAUDE.md 路由「款項 / 發票 / 收款 / 對帳 / OA / 退款 / 補收」等觸發詞偵測到時
- 規劃中遇到「Claude 不知道」MUST 立即再跑稽核（不能繞過去自編）
- OpenSpec change 工作流（`/opsx:propose` / `/opsx:new`）背景對齊階段

**不適用**：
- 純查詢術語 / 狀態機（不涉及規劃）
- Vault 整體健康度稽核（屬 vault-audit skill）

## 二、雙軸稽核框架

### 軸 1：業務領域（6 領域 + cross-domain）

對應 [[business-domain-taxonomy]]：

| 領域 | 觸發詞 | 載入目錄 |
|------|--------|---------|
| L1.1 Pre-sales | 諮詢 / 報價 / 需求單 / 議價 | 03-roles + 04-business-logic + 05-entities + 06-state-machines + 07-scenarios（filter pre-sales） |
| L1.2 Order Management | 訂單 / 異動 / 訂單備註 | 同上（filter order-management） |
| L1.3 Prepress | 審稿 / 打樣 / 稿件 / 印件規格 | 同上（filter prepress） |
| L1.4 Production | 工單 / 任務 / 派工 / 排程 / QC / 補印 / 工序 / 入庫 | 同上（filter production） |
| L1.5 Fulfillment & After-sales | 出貨 / 配送 / 售後 / 客訴 / ticket | 同上（filter fulfillment-after-sales） |
| L1.6 Billing & Cash | 款項 / 發票 / 收款 / 對帳 / OA / Payment / Invoice / PlannedInvoice / 退款 / 補收 / 折讓 | 同上（filter billing-cash） |
| Cross-domain | 任何稽核 MUST 自動載入 | 03-roles（全）+ 02-domain + 07-scenarios + 06-state-machines + 01-products + Master Data |

### 軸 2：卡類型（6 類）

對應 Vault 既有目錄結構：

| 卡類型 | 對應 Vault 目錄 / 來源 | 稽核問題 |
|-------|---------------------|---------|
| **1. 角色** | `03-roles/` | 該領域涉及的角色職責 / 權限 / 工作流是否完整？面對客戶決策場景是否寫清楚？|
| **2. 實體** | `05-entities/` + OpenSpec spec § Data Model | 該領域核心實體欄位 / 狀態 / 關聯是否完整？資料模型是否與 spec 對齊？|
| **3. 流程（服務藍圖）** | `04-business-logic/服務藍圖/` + 各模組 spec | 該領域所屬的端到端業務鏈（型）是否有藍圖且階段齊備？角色交接 / 決策點是否清楚？|
| **4. 業務情境** | `07-scenarios/`（業務情境卡 + 領域專屬情境檔）| 該領域的目標完成過程是否有卡（接力型 / 能力型 / 排程型）？步驟判準是否為可觀測業務結果？延伸岔路是否涵蓋已知例外？|
| **5. 業務邏輯** | `04-business-logic/` | 跨模組規則 / 連帶矩陣 / 計算邏輯是否完整？|
| **6. 法規 / 外部硬約束** | `04-business-logic/` 內法規類卡 | 外部硬約束（ezPay / MIG / 國稅局等）是否獨立成卡（非埋在 spec）？|

### 雙軸量化矩陣

每次稽核產出「領域 × 卡類型」矩陣，每格列「已涵蓋 N / 待修補 M / OQ K」三個明確數字。

範例（Billing & Cash 領域第一輪稽核）：

| | 角色 | 實體 | 流程 | 業務情境 | 業務邏輯 | 法規 |
|--|------|------|------|---------|---------|------|
| Billing & Cash | N=3/M=2/K=1 | N=5/M=3/K=2 | N=2/M=1/K=0 | N=13/M=0/K=2 | N=1/M=1/K=3 | N=0/M=1/K=0 |

**禁「大致 OK」「再看看」等非量化結論**（受 YouTube /goal 影片啟發）。

## 三、5 步驟 SOP（含閉環驗證）

### Step 1：識別本次涉及的業務領域

- 用觸發詞 → 領域 mapping 自動判斷（不需 Claude 手動選）
- 從 6 領域中選 1-2 個（跨領域亦可）
- 例：「補收 OA 執行條件」→ Billing & Cash + Order Management（跨領域）

### Step 2：載入該領域內卡 + 跨領域共用層

- 用 frontmatter `business-domain` grep 該領域卡
- **同時自動載入跨領域共用層**（不需 Claude 判斷）
- 跨領域共用層：03-roles 全部 + 02-domain + 07-scenarios + 06-state-machines + 01-products + Master Data

### Step 3：逐卡類型稽核（6 類）

- 依雙軸矩陣逐格檢查
- **量化產出**每格「已涵蓋 N / 待修補 M / OQ K」三個明確數字

### Step 4：修補 / 標 OQ

- 修補：**在既有卡內 edit 補入缺漏**（不新建抽象卡）
- 缺漏項標 OQ（含「來源稽核軸（領域 × 卡類型）」標記）
- 跨層影響傳播檢查（商業需求 ↔ 業務情境 ↔ spec 三層雙向追溯）

### Step 5：閉環驗證（**禁 false completion**）

- 回頭看 Step 3 量化矩陣，修補後格子是否真的從「待修補 M」轉「已涵蓋 N」
- 未轉成功則回 Step 4 補做（最多 3 輪，超過 3 輪標 OQ 待後續處理）
- 跨層影響重新檢查

## 四、修補規則

- **edit 既有卡** + 缺漏標 OQ
- **不新建抽象卡**（受 Miles 第四輪反饋拍板：明明就有角色 / 業務情境等參考資料，缺漏代表既有卡內容有缺或有錯）
- 連帶矩陣必填（業務邏輯類卡含「連帶實體 / 跨模組影響」章節）
- 缺漏項標 OQ 後 Miles 確認再修補（避免逼答產生不準內容）

## 五、稽核產出格式（量化矩陣）

### 報告模板

```markdown
## ERP 規劃前稽核報告：<議題名稱>

**日期**：YYYY-MM-DD
**議題**：<本次要規劃的 ERP 功能>
**識別領域**：<從 6 領域中選 1-2 個> + cross-domain

### 雙軸量化矩陣

| | 角色 | 實體 | 流程 | 業務情境 | 業務邏輯 | 法規 |
|--|------|------|------|---------|---------|------|
| <領域 X> | N=?/M=?/K=? | ... | ... | ... | ... | ... | ... |
| cross-domain | ... | ... | ... | ... | ... | ... | ... |

### 已涵蓋（N 細項）
- ...

### 待修補（M 細項）
- <卡 X 缺 ...>（修補方式：edit 補入 ...）

### 待確認 OQ（K 細項）
- <OQ-ID>：<議題描述>（來源稽核軸：領域 × 卡類型）

### Step 5 閉環驗證結果
- 修補後格子變化：<格子 A>「待修補 M=3 → 已涵蓋 N=8」/ <格子 B>「未轉成功，已標 OQ」
- 跨層影響檢查：<商業需求 / 業務情境 / spec 三層追溯結果>

### 反模式識別
- <若識別到稽核五大反模式之一，追加到 audit-failure-patterns.md>
```

## 六、跨層影響稽核（商業需求 ↔ 業務情境 ↔ spec）

三層雙向追溯規則：

| 層級 | 上游影響檢查 | 下游影響檢查 |
|------|-------------|-------------|
| **商業需求**（KPI / Phase / 痛點）| — | 哪些業務情境 / spec 受影響？|
| **業務情境**（過程步驟 + 判準）| 是否仍對齊上游商業需求？| 是否有對應 spec § Scenarios？|
| **spec § Requirements / Scenarios** | 是否覆蓋業務情境的步驟判準？| — |

**規則**：上層改動 → MUST 重審所有下層；下層發現缺漏 → MUST 反向修補上層或標 OQ。

## 七、執行者與稽核者分離紀律

> 受 YouTube /goal 影片啟發（separate agent that works from one that decides it's done）。

- **稽核 sub-agent 跑稽核**（如 `erp-planning-pre-check` skill 在 sub-agent context 跑）
- **主對話 agent 跑修補**（修補既有卡 / 新建法規卡 / 標 OQ）
- **MUST NOT 由同一 agent 既寫卡又稽核**（self-amplification 風險）
- 對應現有設計：`vault-audit` 與 `vault-insight` skill 分離 + 序列協作 PM / CEO / 顧問分離

## 八、稽核回合 / 時間預算

> 避免「全 Vault 一次全跑」變 token 黑洞且結論失焦。

- 單次稽核 ≤ 2-3 個領域（超過拆多次）
- 單次 Step 4 修補回合 ≤ 3 輪（超過 3 輪未閉環則標 OQ 待後續）
- 一次稽核時間預算 60-120 分鐘
- 跨領域議題優先拆 + 並行稽核（不同 sub-agent context）

## 九、演化資料

> 累積稽核過程中發現的反模式 / 邊界爭議 / 分類錯誤案例。

### 9.1 五大反模式追蹤

詳見 [[audit-failure-patterns]]（規劃中）。簡述：

| 反模式 | 描述 | 對策 |
|--------|------|------|
| **Scope creep** | 範圍漂移（如「業務情境」吃掉「使用者角色」職責）| 嚴格依雙軸分類；發現越界回卡類型本職 |
| **False completion** | 假完成（看似涵蓋卻漏 edge case）| Step 5 閉環驗證；跨層影響檢查 |
| **Dead loops** | 死循環（OQ 反覆討論不收斂）| 對應 OQ ≥ 15 觸發 vault-insight；超過 3 輪標 OQ 等 Miles 決策 |
| **Immeasurable targets** | 無法量化（卡空泛無 acceptance criteria）| 量化矩陣產出格式強制 N/M/K 三數字 |
| **Token exhaustion** | 成本過高（如「狀態機」跨模組稽核）| 拆多次稽核；分批執行 |

### 9.2 邊界爭議紀錄

| 日期 | 議題 | 處理 |
|------|------|------|
| 2026-05-28 | 框架建立 | 採 6 領域 + 跨領域共用層；QC 併進 Production；Master Data 進共用層 |

（後續累積實證）

## 十、與其他規範的關係

| 規範 | 角色 |
|------|------|
| [[business-domain-taxonomy]] | 6 領域定義 + 觸發詞清單（本框架軸 1 的依據）|
| [[wiki-schema]] | frontmatter `business-domain` 欄位定義（本框架的執行載體）|
| [[erp_index]] | LLM 載入決策入口（本框架 Step 2 的對照表）|
| `vault-audit` skill | Vault 整體健康稽核（12 維度）— 與本框架不同：vault-audit 是「日常 Vault 健康」、本框架是「規劃前準備」|
| `vault-insight` skill | 跨主題模式提煉 — 與本框架互補 |
| `oq-manage` skill | OQ 管理 — 本框架 Step 4 缺漏項標 OQ 走 oq-manage mode B |
| `misjudgement-record` skill | 誤審記錄 — 本框架識別到誤審反模式時觸發 |
| [[audit-failure-patterns]] | 稽核五大反模式追蹤卡（規劃中，本框架 § 9.1 紀錄正本）|

## 十一、來源

- Miles 多輪反饋（第四 / 五 / 六輪拍板）
- 業界研究：Tharstern / PrintVis / Printavo / DDD Bounded Context
- Karpathy LLM Wiki Vault（型態 × 模組二維 + 00-meta/index.md 啟發）
- YouTube Claude Code /goal 影片（執行者稽核者分離 + 閉環化 + 五大反模式）
