---
name: doc-audit
description: >
  ERP 文件稽核 skill。
  觸發時機：Spec / BRD / 欄位 / 流程 / 角色有任何內容異動後自動執行；也可獨立觸發（週期性、發現不一致時）。
  此 skill 自動完成：執行索引層稽核腳本 → 執行跨檔案邏輯一致性檢查 → 識別是否有新內容需加入稽核清單（自我演化）→ 回報結果。
  不適用：純 OQ 文字更新、措辭修正、無文件異動的純討論。
---

# ERP 文件稽核（doc-audit）

## 定位

負責在每次文件異動後確保整體文件庫的一致性，並隨專案迭代自我演化稽核範圍。

**稽核層級（2026-05-30 擴展為雙層）**：archive 後稽核從「只 openspec」擴為 **openspec + wiki（ERP_Vault 商業邏輯卡）雙層**。

**與 vault-audit 的範圍分工**：

| 稽核對象 | 由哪個 skill 負責 |
|---------|-----------------|
| OpenSpec spec 層（delta sync / 跨檔案邏輯一致性）| 本 skill（doc-audit）|
| ERP_Vault **整體健康檢查**（12 維度）| `vault-audit` skill |
| ERP_Vault **商業邏輯卡對齊已 archive 的 change**（防 wiki 停留舊版）| 本 skill（doc-audit）archive 後雙層稽核涵蓋（見 Step 2「archive 後 wiki 商業邏輯卡對齊」維度）|

---

## 觸發時機

| 情境 | 策略 |
|------|------|
| erp-spec Step 6 完成 | 強制執行 |
| 主動收尾（原則 10）有 商業流程 / Spec / BRD / 欄位 / 流程 / 角色異動 | 預設執行（例外才跳過） |
| 純 OQ 文字更新、措辭修正 | 跳過 |
| 獨立觸發：「執行稽核」「檢查文件一致性」「週期稽核」 | 執行 |

---

## 工作流程

### Step 1：索引層稽核（bash）

```bash
bash .claude/skills/doc-audit/scripts/audit-erp-docs.sh
```

- 出現 ⚠️ → 依提示補充索引後繼續，補完再執行一次確認
- 出現 ℹ️ → 確認後決定是否補充，記錄判斷理由

### Step 2：跨檔案邏輯一致性檢查

按 `memory/erp/spec-iteration-workflow.md` § 迭代中「更新參考檔案 → 檢查跨檔案一致性」逐項驗證：

| 檢查維度 | 說明 |
|---------|------|
| 狀態機一致性 | Spec 中的狀態流轉是否與 Notion 狀態變化一致 |
| 商業流程一致性 | 角色、決策點、觸發條件是否與 Notion 商業流程一致 |
| OQ 關聯完整性 | 解析 Spec 中引用的 OQ ID → 觸發 `oq-manage`（模式 A）驗證 ID 是否存在；失效 ID 標記為需修正 |
| 欄位定義一致性 | Spec 中提及的欄位是否與 Notion 資料欄位 DB 一致（含排序值） |
| 角色一致性 | 流程中的執行者是否與 Notion 使用者情境一致 |
| User Story 關聯性 | BRD 引用的 US-XXX 是否存在於 Notion User Story DB |
| CLAUDE.md Spec 清單 | 新增或版本異動的 Spec 是否已更新 CLAUDE.md § Spec 規格檔清單 |
| 跨層自動觸發一致性 | 檢查 bottom-up 觸發鏈（生產任務 → 任務層 → 工單 → 印件 → 訂單）中每個觸發條件與狀態結果是否在狀態機文件與商業流程文件描述一致；重點關注逆流程場景（如作廢、退回、異動）可能造成的上下游競態衝突：同一層級同時有「向上完成」與「向上作廢」兩條 bottom-up 路徑時，優先順序是否已定義 |
| 平台容器 spec 一致性 | 新增或修改「平台容器 spec」（如 sales-platform / consultation-platform / factory-platform 等）時稽核：(1) 容器名稱與 user-roles spec § Requirement: 平台歸屬分類 對應（業務平台 / 中台 / 印務平台 / 審稿平台 / 工廠平台 / 中國供應商平台）；(2) 容器內每條 Requirement 是否引用對應的中台版功能 spec 作為內容基準（避免重複描述）；(3) 業務平台版與中台版差異點是否明確（過濾規則 / 動作可見性 / 預設 UI / Tab 閹割等）；(4) user-roles spec 是否同步開放對應 Role 使用該容器內功能（含同平台不同 Role 的差異處理，如業務平台內業務 / 諮詢開放、會計沿用既有限制） |
| Data Model section sync | `openspec archive` 內建 sync **只處理 `## ADDED Requirements` / `## MODIFIED Requirements`**，**不會自動合 `## ADDED Data Model` / `## MODIFIED Data Model` section**。archive 後**必須手動驗證**：(1) delta `specs/<capability>/spec.md` 是否含 `## ADDED Data Model` 或 `## MODIFIED Data Model` section；(2) 若有，對應內容是否已合進主 spec `openspec/specs/<capability>/spec.md` 的 `## Data Model` 段落；(3) 若漏合，手動補（含子實體 cross-link 修正、命名慣例對齊 snake_case / camelCase 差異）。同時注意：跨 change 同期 archive 時可能對同一實體有不同描述（如 PlannedInvoice 在 refine-consultation-cancellation-and-invoice-flow 內已有 camelCase 簡述、align-invoice-line-items-to-ezpay-spec 補 snake_case 完整定義），須整併至單一權威來源（§ Data Model），既有 Requirement 內描述改為 cross-link 引用 |
| ADDED 修訂既有 Requirement 的 archive sync 殘留 | 當 change 用「ADDED 新 Requirement 修訂/取代既有 Requirement 或 Scenario」（而非 MODIFIED 該既有 Requirement）時，`openspec archive` sync 只**新增** ADDED Requirement、**不會移除**被語意取代的舊 Requirement/Scenario，導致同一 main spec 內新舊兩套描述物理並存、直接矛盾。archive 後 **MUST 手動驗證**：(1) 每個 ADDED Requirement 是否語意上取代了某既有 Requirement/Scenario（尤其跨 spec 的狀態機 / 流程 / 對帳邏輯）；(2) 被取代的舊描述是否仍殘留主 spec；(3) 殘留則手動對齊新版或標 deprecated。**預防**：對「獨立、非巨大」的既有 Requirement（如「諮詢取消對帳邏輯」單條）應優先用 `## MODIFIED Requirements`（sync 會替換），只有對「巨大且多數內容不變」的 Requirement（如整個訂單狀態機）才用 ADDED 新 Requirement 修訂局部 + archive 後手動清理舊描述 |
| archive 後 wiki 商業邏輯卡對齊 | `openspec archive` sync 只處理 openspec delta → main spec，**完全不觸及 ERP_Vault**。wiki（ERP_Vault）是商業邏輯正本、openspec 是實作規格，archive 後若只對齊 openspec、漏 wiki，會導致 wiki 商業邏輯卡停留舊版（converge change 漏 wiki 6 卡教訓）。archive 後 **MUST 檢查** ERP_Vault 內提及本 change 主題的商業邏輯卡是否對齊已定案內容，涵蓋目錄：`04-business-logic/`（業務邏輯規則 / 連帶矩陣 / 計算邏輯）/ `05-entities/`（實體欄位 / 狀態 / 關聯）/ `06-state-machines/`（狀態機節點 / 轉換 / 終態）/ `07-scenarios/`（端到端情境）/ `13-user-stories/`（業務故事）。**做法**：用本 skill § 「archive 後雙層稽核 grep 片段」列出本主題在 openspec specs + ERP_Vault 商業邏輯卡的所有 Requirement / 規則 → 逐條比對 wiki 卡是否停留 archive 前舊版 → 停舊版則手動回補（依 `erp-planning-pre-check` skill pre-check 階段產出的「wiki 商業邏輯卡回補清單」執行）|

### Step 3：自我演化 — 識別新稽核維度

判斷本次異動是否引入了新的稽核需求：

| 異動類型 | 建議動作 |
|---------|---------|
| 新增 ERP 模組 | 建議在 Step 2 表格新增對應狀態機 / 流程檢查項；同步更新 oq-manage § 模組前綴對照 |
| 新增 Notion DB（資料來源）| 建議在 Step 2 新增對應一致性檢查維度 |
| 新增跨模組關係（如 A 模組狀態影響 B 模組）| 建議新增跨模組一致性檢查項 |
| 新增角色 | 建議在角色一致性檢查中補充該角色 |
| audit-erp-docs.sh 有新的 ⚠️ 類型未在 Step 2 覆蓋 | 建議補充至 Step 2 |
| 稽核中發現疑似新 OQ（設計不一致但無對應 OQ）| 觸發 `oq-manage`（模式 B：新增，含去重） |

**執行方式：**
1. 列出識別到的新稽核維度或新 OQ（若無則略過）
2. 說明建議加入的原因
3. 詢問 Miles 是否採納
4. 採納後：直接更新此 SKILL.md 對應段落，並 commit；新 OQ 由 oq-manage 模式 B 建立

### Step 4：回報結果

依序輸出：

```
[稽核結果]
索引層：X 個 ⚠️ 已修正 / 無問題
邏輯層：X 個不一致 / 全部通過
新增稽核項：X 個建議（已採納 / 待確認）
```

---

## archive 後雙層稽核 grep 片段（可重用）

> archive 後執行 Step 2「archive 後 wiki 商業邏輯卡對齊」維度時，用以下片段列出某主題在 openspec specs + ERP_Vault 商業邏輯卡的所有既有 `### Requirement:` / 規則，逐條比對 wiki 卡是否停留 archive 前舊版。將 `<主題關鍵字>` 換成本 change 主題（如「諮詢取消」「對帳」「期次」）。

```bash
# 1. openspec specs 層：列本主題所有 Requirement 標題與所在檔
grep -rn "### Requirement:" openspec/specs/ | grep "<主題關鍵字>"

# 2. wiki ERP_Vault 商業邏輯卡層：列本主題所在卡與行
grep -rn "<主題關鍵字>" \
  memory/Sens_wiki/wiki/erp/04-business-logic/ \
  memory/Sens_wiki/wiki/erp/05-entities/ \
  memory/Sens_wiki/wiki/erp/06-state-machines/ \
  memory/Sens_wiki/wiki/erp/07-scenarios/ \
  memory/Sens_wiki/wiki/erp/13-user-stories/

# 3. 比對：openspec 已定案的新規則（終態 / 狀態 / 公式）是否已同步進 wiki 卡；
#    wiki 卡仍寫 archive 前舊版者 MUST 手動回補（依 erp-planning-pre-check 產出的 wiki 回補清單）
```

---

## archive 後三類對抗式找漏 workflow（2026-05-30 新增，試點）

> Step 2 最後三個維度（**Data Model section 漏合 / ADDED sync 殘留 / wiki 商業邏輯卡停舊版**）是「需逐條語意比對 + 對抗式找漏」的片段——單 agent 序列檢查易遺漏（v1.4 / v1.5 / v1.6 三個 CRITICAL 都是「archive sync 漏掉什麼」）。archive 涉及多 spec + wiki 卡時，MAY 觸發 `/doc-audit-archive` workflow（腳本 `.claude/workflows/doc-audit-archive.js`）將三類 fan-out + 對抗式互審：

- 傳入 `args: { topic, changeRef, affectedSpecs }`（`topic` = 本 change 主題關鍵字）。
- workflow 內 3 個 **sonnet** agent 各偵測一類（ADDED 殘留 / Data Model 漏合 / wiki 停舊版）+ 1 個對抗式互審 agent 找三類漏掉的，回傳結構化「待回補清單」（location + issue + fixDirection + severity）。
- **嚴守 costCaveat 邊界（與 erp-planning-pre-check 同模式）**：
  - Step 1 索引層 `audit-erp-docs.sh` + 上方「grep 片段」**留 bash 零 agent**（先撈候選 Requirement / wiki 卡行）。
  - 實際**回補**（edit 主 spec / wiki 卡、整併 Data Model、清殘留）**留主對話 agent 在 workflow 外執行**（執行者 / 稽核者分離：workflow 偵測、主 agent 回補）。
  - Step 3 自我演化（問 Miles 採納新維度）留主對話 agent。
- **升級門檻**：archive 涉及多 spec + wiki 卡時用 workflow；**單檔小改 / 純措辭用既有序列檢查**（不值 ~10x token）。
- **前置 + fallback**：需 Claude Code 版本支援 Dynamic Workflows（約 v2.1.154+）；版本不足時 fallback 既有單 agent 序列檢查（功能不受阻）。

---

## 稽核範圍演化紀錄

> 每次採納新稽核維度後，在此記錄版本與理由，確保稽核範圍有跡可循。

| 版本 | 日期 | 新增稽核維度 | 原因 |
|------|------|------------|------|
| v1.0 | 2026-03-24 | 初版（狀態機 / 商業流程 / OQ / 欄位 / 角色 / User Story / CLAUDE.md）| 從 erp-spec Step 6 抽出獨立 skill |
| v1.1 | 2026-03-26 | audit-erp-docs.sh 更新：Check 1 加入 Notion 遷移 skip list；Check 3 改以 Notion URL 驗證關鍵資源；Check 4 補充遷移檔例外清單 | 消除已遷移 Notion 的本地檔案誤報，腳本與現行 Notion-first 架構對齊 |
| v1.2 | 2026-03-26 | 新增「跨層自動觸發一致性」稽核維度 | 任務層級作廢規則確立 bottom-up 機制後，生產任務 → 訂單之間存在多條 bottom-up 路徑，逆流程（作廢、退回、異動）時可能產生競態衝突，需獨立稽核項確保每條觸發鏈條件與結果在狀態機與商業流程文件中描述一致 |
| v1.3 | 2026-05-14 | 新增「平台容器 spec 一致性」稽核維度 | `add-print-item-overview-to-sales-platform` change 引入新 capability 類型「平台容器 spec」（首例為 sales-platform，承載業務平台所有功能 spec），未來會有諮詢 / 印務 / 審稿 / 工廠 / 中國供應商平台對應容器。需獨立稽核項確保容器名稱對齊 user-roles § 平台歸屬分類、容器內 Requirement 正確引用中台版功能 spec、平台版與中台版差異點明確、user-roles 同步開放對應 Role |
| v1.4 | 2026-05-26 | 新增「Data Model section sync」稽核維度 | `align-invoice-line-items-to-ezpay-spec` archive 後發現 CRITICAL bug：openspec CLI `archive` 內建 sync 只處理 `## ADDED/MODIFIED Requirements` section，**完全不處理** `## ADDED/MODIFIED Data Model` section。本次漏合 InvoiceItem 子結構（不存在於主 spec）+ PlannedInvoice 完整表格（與既有 refine-consultation-cancellation-and-invoice-flow camelCase 簡述衝突）+ Invoice.items 欄位描述（仍是 JSON 未改 InvoiceItem[]）。本維度強制 archive 後手動驗證 Data Model section 合入主 spec，含整併跨 change 同實體多版本描述至單一權威來源 |
| v1.5 | 2026-05-30 | 新增「ADDED 修訂既有 Requirement 的 archive sync 殘留」稽核維度 | `converge-consultation-cancel-to-order-cancel-flow` archive 後發現 9 CRITICAL：change 用「ADDED 新 Requirement 取代既有」（仿 unify-billing 慣例避免 copy 巨大訂單狀態機），但 archive sync 不移除被取代的舊 Requirement/Scenario，致 state-machines + order-management 內新舊終態（訂單完成 vs 已取消）/ OA 狀態（已執行 vs 已核可）並存矛盾；其中 order-management 三整條獨立諮詢取消 Requirement（發票時間點/收尾自動建/對帳邏輯）本應用 MODIFIED 卻漏改、business-processes 整段未納 delta（範圍遺漏）。本維度強制 archive 後驗證 ADDED 是否取代既有並手動清理殘留 |
| v1.6 | 2026-05-30 | 定位擴展為「openspec + wiki 雙層」+ 新增「archive 後 wiki 商業邏輯卡對齊」稽核維度 | converge archive 後 Miles 指出防範只看 openspec、漏 wiki 商業邏輯正本（converge change 漏對齊 ERP_Vault 6 卡）。wiki（ERP_Vault）是商業邏輯正本、openspec 是實作規格，archive sync 不觸及 ERP_Vault，只對齊 openspec 會致 wiki 卡停留舊版。本維度強制 archive 後檢查 ERP_Vault（04-business-logic / 05-entities / 06-state-machines / 07-scenarios / 13-user-stories）內提及本 change 主題的商業邏輯卡對齊已定案內容；同步釐清與 vault-audit 範圍分工（vault-audit = 整體健康檢查 / doc-audit archive = 商業邏輯卡對齊已 archive change）|
| v1.7 | 2026-05-30 | 三類語意比對維度（Data Model 漏合 / ADDED 殘留 / wiki 停舊版）新增 workflow 化試點接線（`/doc-audit-archive` fan-out + 對抗式互審）| skill-workflow-fit 分析（用 workflow 評估）評 doc-audit 為 medium：三類「archive sync 漏掉什麼」的對抗式找漏適合 fan-out + 互審（單 agent 序列易遺漏，正是 v1.4/v1.5/v1.6 三個 CRITICAL 成因），但嚴守 costCaveat — 範圍限單 change delta、索引 grep 留 bash 零 agent、實際回補留主對話 agent（執行者/稽核者分離）。新增 `.claude/workflows/doc-audit-archive.js`（3 偵測 + 1 互審 sonnet agent）+ 本 SKILL.md「archive 後三類對抗式找漏 workflow」段；升級門檻 archive 涉多 spec + wiki 才用、版本不足 fallback 既有序列檢查 |
