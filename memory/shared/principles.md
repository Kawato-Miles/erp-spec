# 工作原則（Working Principles）

> **角色層通用原則**，適用於所有產品與專案，不限 ERP 或圖編器。
> 專案特定規範見各專案記憶檔（`memory/erp/`、`memory/graphic-editor/` 等）。
>
> 最後更新：2026-02-24

---

## 一、Spec 撰寫

| 原則 | 說明 |
|------|------|
| `product-management:feature-spec` 必觸發 | 撰寫任何 Spec / PRD 前，**必先調用此 skill**，確保 PM mindset 完整：問題陳述、使用者故事、成功指標（KPI）、非目標 |
| Open Question 主動標記 | Spec 撰寫中識別的設計待確認項，主動標記為 OQ，不靜默跳過 |
| 前系統為對比基準 | 若有既有前身系統（如 Ragic、舊平台），一律視為「遷移前歷史基準」，**不納入新系統設計**；僅用於遷移前後的指標對比 |

---

## 二、Open Question 管理

**核心原則：各專案的 `open-questions.md` 為該專案 OQ 的唯一正本。**
所有 Task 或 Spec 中識別的新問題，必須集中管理，避免散落各處造成遺漏或重複載入。

### 2.1 新 OQ 產生時

| 規則 | 說明 |
|------|------|
| 判斷層級 | 評估 OQ 是「功能局部問題」還是「跨模組 / 架構問題」 |
| 局部問題 | 可保留在對應 Spec 的 Open Questions 章節，作為**顯示用**，不強制同步至中央 |
| 跨模組 / 架構問題 | 必須合併至專案的 `open-questions.md`，編號續接現有最大編號 |
| 分類標記 | 合併時在備註欄標明來源（如「來源：需求單 spec」「來源：訂單討論」），方便追蹤 |

### 2.2 OQ 解答時

| 規則 | 說明 |
|------|------|
| 更新正本 | 在 `open-questions.md` 標記解答內容與日期 |
| 同步 Spec | 若 OQ 原存於 Spec 文件，同步更新 Spec 內的狀態 |
| 移至封存 | 已解答的 OQ 定期移至 `open-questions-archive.md`，正本只保留 ⏳ 待確認項目 |

### 2.3 減少 Token 使用

| 規則 | 說明 |
|------|------|
| 查 OQ 只讀正本 | 查詢任何待確認事項時，直接讀 `open-questions.md`，不需翻各 Spec 文件 |
| Spec OQ 章節精簡 | Spec 的 Open Questions 章節只列**該功能直接相關**的問題；已合併至中央的跨模組問題可僅保留參照（如「見 OQ #24」） |

---

## 三、PM 視角

- **每次討論的預設框架**：使用者價值 × 商業目標 × 技術可行性，三者平衡
- **回應前**：先確認問題定義，不預設解法
- **有歧義時**：主動提問，不靜默假設
- **優先級標示**：P0（必做）/ P1（重要）/ P2（Nice-to-have）

---

## 四、文件規範

| 規範 | 說明 |
|------|------|
| 主語言 | 繁體中文（技術術語保留英文縮寫，如 API、FK、UUID、PRD） |
| OQ 格式 | 參照各專案 `open-questions.md` 現有欄位格式，保持一致 |
| 章節標題 | 新文件的章節結構盡量與同專案既有 Spec 對齊，方便跨文件閱讀 |

---

## 五、Spec / Prototype 迭代工作流

**目的**：確保迭代後，參考文件同步更新，避免邏輯破裂。
**核心原則**：邊迭代邊檢查，邊做邊驗證，而非「做完再檢查」。

### 5.1 迭代前：定義驗證標準

迭代開始前，在 Spec / open-questions.md 頂部補充清晰的驗證標準：

**檢查項目**：
- [ ] 此次迭代要驗證什麼？（邏輯、需求、邊界情況？）
- [ ] 迭代完成的成功標準是什麼？（對標哪些 Spec 章節或 OQ？）
- [ ] 檢查清單是什麼？（參考 § 5.3 三步檢查流程）

**範例格式**：
```markdown
## 本次迭代目標與驗證標準

### 目標
- [ ] 驗證 [具體邏輯/計算規則]
- [ ] 解決 OQ-X （[問題摘要]）
- [ ] 補充 [參考文件] 的 [缺失內容]

### 驗證標準
- Spec 新增欄位已同步至 data-model.md ✓
- scenarios.md 新增情境已補充至 user-scenarios.md ✓
- state-machines.md / scenarios.md / test-cases.md 邏輯一致 ✓
- 無新的未記錄 OQ ✓
```

### 5.2 迭代中：邊做邊驗證

**不是「做完再檢查」，而是三步驟邊迭代邊驗證**：

1. **修改 Spec** → 立即檢查 ① 連帶更新、② 邏輯驗證
   - 新增欄位 → 同步 data-model.md？
   - 新增狀態 → 對應 state-machines.md？
   - 修改計算邏輯 → scenarios.md 受影響嗎？

2. **更新參考文件** → 立即檢查跨檔案一致性
   - 修改 state-machines.md → scenarios.md / test-cases.md 是否還合理？
   - 修改 scenarios.md → user-scenarios.md 的角色行為是否對應？
   - 修改 data-model.md → 涉及該欄位的所有 Spec 是否需要更新？

3. **識別新問題** → 記錄至 open-questions.md，不堵塞進度
   - 發現邊界情況 → 立即記錄為 OQ
   - 發現依賴關係 → 立即記錄為 OQ
   - 不確定的設計選擇 → 標記為 OQ，繼續迭代

**詳細檢查規則**見 `.claude/skills/erp-spec/SKILL.md` Step 6 的三層檢查：
- **① 連帶更新確認**：修改某文件時，應連帶檢查哪些相關檔案
- **② 多檔案相互驗證**：邏輯一致性檢查矩陣（state-machines ↔ scenarios ↔ test-cases 等）
- **③ 自我稽核腳本**：索引層面的自動檢查

### 5.3 迭代後：稽核關卡

**三步驟確保完整同步**：

**Step 1：執行自動稽核**
```bash
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```
稽核涵蓋索引一致性（檔案清單、快速索引、參考資源）。出現 ⚠️ 時依提示補充。

**Step 2：檢查清單**（對照 § 5.1 定義的驗證標準）
- ☐ 文件同步確認：所有連帶更新檔案已同步
- ☐ 邏輯驗證完成：無跨檔案矛盾（見 SKILL.md Step 6 ② 檢查清單）
- ☐ 版本遞增：涉及的 .md 檔案版本號已遞增
- ☐ 沒有遺漏的 OQ：新發現的問題都已記錄

**Step 3：Commit 時註記**
```
feat: [模組] 迭代 Spec

§ 多檔案驗證已完成
- ① 連帶更新：data-model.md, scenarios.md, user-scenarios.md
- ② 邏輯驗證：state-machines.md ↔ scenarios.md ↔ test-cases.md 一致
- ③ 自動稽核：通過

解決 OQ: OQ-5, OQ-12
新增 OQ: 無
```

### 5.4 常見陷阱（紅旗指標）

見 `.claude/skills/erp-spec/SKILL.md` Step 6 的常見矛盾模式：

- ❌ state-machines.md 新增狀態，但 test-cases.md 沒有對應測試 → **補充測試**
- ❌ scenarios.md 假設和 user-scenarios.md 角色行為不符 → **檢查誰更正確，並統一**
- ❌ test-cases.md 發現邊界情況，但 open-questions.md 沒標記 → **新增 OQ**
- ❌ business-process.md 異動後，scenarios.md 和 state-machines.md 沒同步 → **逐項檢查補齊**
