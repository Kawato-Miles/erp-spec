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

**每次討論的預設視角**：使用者價值 × 商業目標 × 技術可行性，三者平衡。
回應前先確認問題定義，不預設解法；有 Open Question 時主動標記，不靜默跳過。

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

### Spec 撰寫默認原則

每次撰寫 Spec 時，以下原則**自動生效，無需重複說明**：

| 原則 | 說明 |
|------|------|
| `product-management:feature-spec` 默認觸發 | 撰寫任何 Spec / PRD 前，**必須先調用此 skill**，確保 PM mindset 完整納入：問題陳述、使用者故事、成功指標（KPI）、非目標（Out of Scope） |
| Ragic 為 Pre-ERP 歷史基準（ERP Spec 適用） | ERP Spec 中，Ragic 一律視為遷移前的歷史系統，**不納入設計考量**；保留用途僅為「遷移前 vs. 遷移後」指標對比基準 |

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

### 同步原則（每次 Task 結束前確認）

| 修改對象 | 必須連帶檢查 |
|---------|------------|
| `state-machines.md` 或 `state-machines-ops.md` | `scenarios.md` 附錄、`open-questions.md`（是否解決待確認項）|
| `open-questions.md` 確認某問題 | 對應 `state-machines*.md` 是否已補設計、`scenarios.md` 是否補情境；**各 Spec 第 12 章（OQ 參照節點）狀態摘要需同步更新** |
| `scenarios.md` 新增 / 修改情境 | `user-scenarios.md`（對應角色是否需補情境）|
| `user-scenarios.md` | `scenarios.md` 附錄（情境索引是否同步）|
| 任何欄位 / 狀態名稱異動 | `glossary.md`（術語是否需新增 / 修正）|
| Task 中識別新 Open Question | 跨模組 / 架構問題 → 合併至專案 `open-questions.md`（續接最大編號、標明來源）；局部問題可留 Spec 內顯示 |
| `open-questions.md` 有 OQ 解答 | 定期移至 `open-questions-archive.md`，正本只保留 ⏳ 待確認項目 |
| `docs/data-model.md` 某模組欄位異動 | 對應 Spec 第 7 章（若有欄位異動紀錄）是否需連帶更新 |
| 新增 `memory/erp/` 或 `memory/shared/` 資源檔案 | **CLAUDE.md 快速索引**（ERP 資源 / 共用資源表補欄位）；**SKILL.md 參考資源**（補路徑）；執行稽核腳本確認 |
| 新增 ERP 功能模組（新業務領域，非既有模組擴充）| **SKILL.md 印刷 ERP 特定注意事項**（補模組行）；**SKILL.md Step 2 載入必要背景資源**（補對應狀態機類型）|

### 自我稽核（發現異常時或定期執行）

執行以下指令，自動偵測 `memory/` 下的文件是否已正確索引：

```bash
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```

稽核涵蓋五項檢查：
1. `memory/erp/*.md` → CLAUDE.md 快速索引 ERP 資源
2. `memory/shared/*.md` → CLAUDE.md 共用資源
3. 關鍵 ERP 資源 → SKILL.md 參考資源
4. `memory/erp/*.md` → SKILL.md 中是否有任何提及（提示）
5. `SKILL.md` → CLAUDE.md 工具索引

**建議執行時機**：新增文件後、定期（每週）、或發現文件不一致時。

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
- Spec 格式：使用 `.claude/skills/erp-spec/SKILL.md` 規範
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
| 共用術語（完整） | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
| 圖編術語（完整） | `memory/graphic-editor/glossary.md` |

### 工具
| 資源 | 路徑 |
|------|------|
| ERP Spec Skill | `.claude/skills/erp-spec/SKILL.md` |
| Spec 模板 | `.claude/skills/erp-spec/references/spec-template.md` |
| ERP 全局資料模型 | `docs/data-model.md` |
