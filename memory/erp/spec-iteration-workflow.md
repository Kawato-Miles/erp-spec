# ERP Spec / Prototype 迭代工作流（實施細節）

> **目的**：在 `memory/shared/principles.md` § 五的框架基礎上，定義 ERP 專項的迭代檢查清單、檔案依賴與驗證標準。
> **角色**：SKILL.md Step 6 的 ERP 實操版本（包含 ①③ 的完整規則）。迭代時只需查看本檔案，無需反覆切換 SKILL.md。
> **最後更新**：2026-02-24

---

## 迭代涉及的 ERP 參考檔案

| 檔案 | 用途 | 修改頻率 |
|------|------|--------|
| Notion 狀態變化 § 上層（https://www.notion.so/32c3886511fa81539eb9d3c97630caa0）| 上層流程的狀態定義（需求單、訂單、工單、印件） | 低（架構穩定） |
| Notion 狀態變化 § 下層（同上頁面）| 下層流程的狀態定義（任務、生產任務、QC、出貨） | 低（架構穩定） |
| Notion 業務情境 DB | PM 視角的情境驗證（業務邏輯驗證） | 中（常補充，正本在 Notion） |
| `user-scenarios.md` | 各角色的使用者故事（需求確認） | 中（常補充） |
| Notion 商業流程（https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a）| 核心業務規則（計算邏輯、計價方式等） | 中（迭代修改） |
| `data-model.md` | 全局資料模型（欄位定義） | 中（常新增） |
| `test-cases.md` | 測試案例（邊界情況驗證） | 中（迭代補充） |
| `open-questions.md` | 待確認事項（正本） | 高（邊迭代邊產生） |
| `product-goals.md` | 產品目標與 KPI | 低（季度更新） |
| `glossary.md` | ERP 術語表 | 低（名詞穩定） |

---

## 迭代前：定義驗證標準（ERP 專用模板）

在 Spec 頂部補充：

```markdown
## 本次迭代目標與驗證標準

### 目標
- [ ] 驗證 [具體邏輯/流程/計算]
- [ ] 解決 OQ-X （[問題摘要]）
- [ ] 補充 [缺失的參考文件]

### 涉及的模組
- [ ] 需求單 / 訂單管理（見 Notion 狀態變化 § 上層）
- [ ] 工單 / 生產排程（見 Notion 狀態變化 § 上層）
- [ ] 生產任務（見 Notion 狀態變化 § 下層）
- [ ] 其他 _________

### 驗證標準（檢查清單）
- [ ] Spec 新增欄位已同步至 docs/data-model.md ✓
- [ ] 狀態轉移已補充至 Notion 狀態變化（對應段落）✓
- [ ] 情境驗證已補充至 Notion 業務情境 DB ✓
- [ ] scenarios.md 情境對應的角色故事已補充至 user-scenarios.md ✓
- [ ] 業務規則已補充至 Notion 商業流程 ✓
- [ ] 跨文件邏輯無矛盾（Notion 狀態變化 ↔ 業務情境 ↔ test-cases）✓
- [ ] 新發現的邊界情況已記錄至 open-questions.md ✓
- [ ] 相關文件版本號已遞增 ✓
```

---

## 迭代中：邊做邊驗證（ERP 檢查清單）

### 1️⃣ 修改任何檔案 → 連帯檢查相關檔案

**核心原則**：修改某檔案時，應立即檢查以下相關檔案是否需同步

| 修改對象 | 必須連帶檢查 |
|----------|------------|
| Notion 狀態變化（上層 / 下層） | ☐ Notion 業務情境 DB（是否需補情境）<br/>☐ Notion OQ DB（是否解決待確認項） |
| `open-questions.md` 確認某問題 | ☐ 對應 `state-machines*.md` 是否已補設計<br/>☐ `scenarios.md` 是否補情境<br/>☐ 各 Spec 第 12 章 OQ 參照節點狀態 |
| Notion 業務情境 DB 新增/修改情境 | ☐ `user-scenarios.md`（對應角色是否需補情境） |
| `user-scenarios.md` 新增/修改故事 | ☐ Notion 業務情境 DB（情境索引是否同步） |
| 任何欄位/狀態名稱異動 | ☐ `glossary.md`（術語是否需新增/修正） |
| 新識別的 OQ | ☐ 跨模組/架構問題 → 合併至 `open-questions.md`<br/>☐ 局部問題可留 Spec 內顯示 |
| `open-questions.md` 有 OQ 解答 | ☐ 定期移至 `open-questions-archive.md`<br/>☐ 正本只保留 ⏳ 待確認項目 |
| `docs/data-model.md` 欄位異動 | ☐ 對應 Spec 第 7 章是否需連帶更新 |

### 2️⃣ 修改 Spec → 檢查關聯檔案（快速版）

此表是上方規則的 **ERP 實操簡化版**，迭代時快速參考：

| Spec 修改項 | 立即檢查 | 原因 |
|-----------|--------|------|
| **新增欄位** | docs/data-model.md | 欄位定義必須同步 |
| **新增狀態** | Notion 狀態變化（對應上層或下層段落）| 新狀態轉移必須定義 |
| **修改計算邏輯** | Notion 商業流程、Notion 業務情境 DB | 業務規則、驗證情境必須同步 |
| **新增邊界情況** | test-cases.md、open-questions.md | 邊界情況必須有測試或 OQ 記錄 |
| **涉及角色行為** | user-scenarios.md | 角色故事必須對應 |

### 3️⃣ 更新參考檔案 → 檢查跨檔案一致性

此表定義「修改某檔案時應檢查的邏輯」（邏輯層驗證）：

| 修改檔案 | 檢查對象 | 常見矛盾 |
|---------|--------|--------|
| **Notion 狀態變化** | Notion 業務情境 DB、test-cases.md、Notion 商業流程 | 新狀態無對應的情境驗證或測試 |
| **Notion 業務情境 DB** | user-scenarios.md、test-cases.md、Notion 狀態變化 | 情境假設與角色故事不符；邊界情況無測試 |
| **user-scenarios.md** | Notion 業務情境 DB、Notion 狀態變化、Notion 商業流程 | 角色故事與情境假設不一致；業務規則不符 |
| **Notion 商業流程** | Notion 業務情境 DB、Notion 狀態變化 | 規則異動未反映在情境或狀態機中 |
| **data-model.md** | 所有使用該欄位的 Spec | 欄位類型、必填性異動未反映在業務邏輯中 |
| **test-cases.md** | Notion 業務情境 DB、Notion 狀態變化、Notion OQ DB | 測試無對應情境；邊界缺陷未記為 OQ |


### 識別新問題 → 立即記錄

```markdown
# 新增至 open-questions.md

## OQ-X: [問題名稱]

**來源**：[模組] Spec 迭代，第 N 行
**層級**：○ 功能局部 / ● 跨模組 / ● 架構
**描述**：具體問題描述，包括邊界情況或依賴關係
**影響**：涉及哪些模組
**狀態**：⏳待確認
```

---

## 迭代後：稽核關卡（ERP 三步驟）

### Step 1：執行自動稽核

```bash
# ERP 稽核腳本
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```

稽核涵蓋：
- `memory/erp/*.md` 與 CLAUDE.md 快速索引的一致性
- 關鍵 ERP 檔案與 .claude/skills/erp-spec/SKILL.md 的一致性

**預期輸出**：✓ 通過或 ⚠️ 有警告（需補充索引）

### Step 2：檢查清單（對照迭代前定義的驗證標準）

**文件同步**：
- ☐ data-model.md 新增欄位已記錄，版本號遞增
- ☐ Notion 狀態變化 已更新（上層 / 下層對應段落）
- ☐ Notion 業務情境 DB 已補充新情境
- ☐ user-scenarios.md 新增角色故事已記錄，版本號遞增
- ☐ Notion 商業流程 已更新

**邏輯驗證**：
- ☐ 新狀態有對應的情境驗證
- ☐ 新情境有對應的角色故事
- ☐ 新邏輯規則未與既有規則衝突
- ☐ 新欄位的類型、必填性與業務邏輯一致

**OQ 管理**：
- ☐ 新發現的問題都已記錄至 open-questions.md
- ☐ 已解決的 OQ 已標記為已確認，並移至 open-questions-archive.md

### Step 3：Commit 時註記

```
feat: [ERP 模組] 迭代 Spec

## 迭代內容
[簡述本次迭代做了什麼]

## § 多檔案驗證已完成

### ① 連帶更新
- data-model.md：新增 [欄位名稱]
- Notion 狀態變化：新增 [狀態名稱]
- Notion 業務情境 DB：新增 [情境 ID 與名稱]
- [其他檔案]：[修改項目]

### ② 邏輯驗證
- Notion 狀態變化 ↔ Notion 業務情境 DB：✓ 一致
- Notion 業務情境 DB ↔ user-scenarios.md：✓ 一致
- user-scenarios.md ↔ Notion 商業流程：✓ 一致
- data-model.md ↔ Spec：✓ 一致

### ③ 自動稽核
- 執行：bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
- 結果：✓ 通過

## 解決與新增的 OQ
- 解決：OQ-X, OQ-Y （簡述內容）
- 新增：OQ-Z （簡述內容） / 無

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

---

## 常見陷阱（ERP 紅旗指標）

| 陷阱 | 特徵 | 修復 |
|------|------|------|
| **狀態孤立** | Notion 狀態變化 新增狀態，但業務情境 DB 無對應情境驗證 | 補充情境；若不需驗證，檢查狀態定義是否正確 |
| **邏輯矛盾** | Notion 狀態變化 允許的轉移，但 Notion 商業流程 的規則禁止 | 確認業務規則是否正確；同步 Notion 狀態變化 或 Notion 商業流程 |
| **角色遺漏** | scenarios.md 新增情境，但 user-scenarios.md 無對應角色故事 | 補充角色故事，或檢查該情境是否真的需要某角色參與 |
| **欄位孤立** | data-model.md 新增欄位，但無 Spec 章節說明用途 | 補充 Spec；若欄位暫時不用，移至「未來預留」欄位區 |
| **邊界無測試** | test-cases.md 發現邊界情況，但 Spec 未定義處理方式 | 新增 OQ 確認處理方式，或補充 Spec 定義 |
| **版本未遞增** | 修改了 .md 內容，但檔案頂部版本號未更新 | 遞增版本號（major.minor 格式），記錄修改理由 |

---

## 快速參考

### 完整迭代流程（5 分鐘版）

1. **迭代前** → 定義驗證標準（複製上方模板）
2. **迭代中** → 修改 Spec，對照「修改 Spec → 檢查關聯檔案」表格，逐項同步
3. **迭代後** → 執行稽核、檢查清單、Commit

### 涉及檔案速查

- **狀態、流程相關** → Notion 狀態變化（https://www.notion.so/32c3886511fa81539eb9d3c97630caa0）
- **邏輯、計算相關** → Notion 商業流程（https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a）
- **情境、邊界相關** → Notion 業務情境 DB / test-cases.md
- **數據結構相關** → docs/data-model.md
- **角色、需求相關** → user-scenarios.md
- **不確定項** → open-questions.md

### 稽核命令

```bash
# ERP 稽核腳本
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh

# 檢查 OQ 狀態
cat open-questions.md | grep "^##"
```

---

## 延伸閱讀

- **通用框架** → `memory/shared/principles.md` § 五
- **技術檢查規則** → `.claude/skills/erp-spec/SKILL.md` Step 6
- **快速索引** → `CLAUDE.md` § 快速索引 § ERP 資源
