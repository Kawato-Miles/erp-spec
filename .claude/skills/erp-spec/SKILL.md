---
name: erp-spec-writing
description: Writes feature specs and PRDs for a printing industry ERP system. Use when Miles asks to write a spec, PRD, or requirements document for any ERP module — including quote requests, orders, production scheduling, purchasing, inventory, and work orders. Loads state machines, product goals, and domain principles automatically.
---

# ERP Spec 撰寫

適用於印刷業 ERP 系統各模組的功能規格書（Spec / PRD）撰寫。

---

## 使用時機

- 「幫我寫 [功能] 的 spec / PRD」
- 「起一個 [模組] 的規格書」
- 「ERP 的 [功能] 要怎麼規格化」

---

## 撰寫工作流程

依序完成以下步驟，可在回應中附上 Checklist 讓 Miles 追蹤進度：

```
Spec 撰寫進度：
- [ ] Step 1：確認範圍與問題定義
- [ ] Step 2：載入必要背景資源
- [ ] Step 3：觸發 product-management:feature-spec skill
- [ ] Step 4：依模板撰寫草稿
- [ ] Step 5：識別與同步 Open Questions
- [ ] Step 6：Task 結束同步檢查 + 稽核
```

### Step 1：確認範圍與問題定義

若 Miles 未提供，**撰寫前**先確認：

| 問題 | 說明 |
|------|------|
| 核心痛點 | 這個功能要解決什麼問題？誰的問題？ |
| 使用者角色 | 業務、印務主管、排程、倉管、採購、系管？ |
| 範圍邊界 | 哪些在 scope？哪些明確 out of scope？ |
| 成功標準 | 上線後怎樣算成功？（對照 `product-goals.md` KPI） |
| 相關模組 | 需參考哪條狀態機？ |

> 若無法確認，保留 `TBD` 並標記為 OQ，不靜默跳過。

### Step 2：載入必要背景資源

依功能類型選取最小必要檔案：

| Spec 類型 | 必讀 |
|-----------|------|
| 需求單 / 訂單 / 工單 / 印件 | `memory/erp/state-machines.md` |
| 生產任務 / QC / 出貨單 | `memory/erp/state-machines-ops.md` |
| 跨上下層流程 | 兩個 state-machines*.md |
| 所有 ERP Spec | `memory/erp/product-goals.md`（KPI 對齊） |

通用原則（OQ 管理、Spec 撰寫規範）一律參照 `memory/shared/principles.md`，無需重複載入。

### Step 3：觸發 product-management:feature-spec

**每次撰寫 Spec 前必須先調用此 skill**，確保 PM mindset 完整納入：
- 問題陳述、使用者故事、成功指標（KPI）、非目標（Out of Scope）

### Step 4：依模板撰寫草稿

骨架使用 `references/spec-template.md`。

**重要預設規則：**

| 規則 | 說明 |
|------|------|
| Section 10 不寫 | 開發估算與里程碑由 PM 在 GitHub Issues 管理，Spec 預設跳過 |
| Section 11 不寫 | 測試計畫獨立維護於 `memory/erp/test-cases.md`，Spec 預設跳過；Spec 完成後在 test-cases.md 補充測試案例 |
| Section 7 只寫差異 | 全局資料模型統一維護於 `docs/data-model.md`；Section 7 只列此 Spec 新增 / 修改的欄位，完成後同步更新 data-model.md |
| Ragic = 歷史基準 | Ragic 視為遷移前系統，**不納入新系統設計**；僅用於遷移前後 KPI 對比 |
| 需求格式 | 「系統應…（System shall）」，每條需求含可測試驗收條件 |
| 避免模糊詞 | 不用「更好」「更快」「某些情況」，改為具體數字或行為 |

### Step 5：識別與同步 Open Questions

撰寫中識別到的不確定項，依層級處理：

| 類型 | 處置 |
|------|------|
| 功能局部問題（僅影響此模組）| 寫入 `memory/erp/open-questions.md` 對應模組分類，Spec Section 12 以**參照節點**格式顯示摘要 |
| 跨模組 / 架構問題 | 寫入 `memory/erp/open-questions.md` XM 分類（續接最大編號、標明來源），Spec Section 12「跨模組 OQ」欄標注 ID |

**Section 12 格式（參照節點）**：
- 正本為 `open-questions.md`；Section 12 只顯示摘要與 ID，不重複維護內容
- 有 OQ 時：列出 ID 清單 + 一行摘要 + 狀態；無 OQ 時：填「本模組目前無待確認事項」

查詢現有 OQ 狀態時，**直接讀 `memory/erp/open-questions.md`**，不需翻各 Spec 文件。

### Step 6：Task 結束同步檢查 + 稽核

Spec 完成後，依序執行：

**① 連帶更新確認**

| 修改內容 | 需同步確認 |
|----------|------------|
| 新增 / 修改狀態或流程 | `memory/erp/scenarios.md` 是否需補情境 |
| 解答現有 OQ | `memory/erp/open-questions.md` 更新狀態；已解答項定期移至 archive |
| 出現新術語 | `memory/erp/glossary.md` 是否需補充定義 |
| 新增 memory/ 資源檔案 | CLAUDE.md 快速索引、SKILL.md 參考資源 |
| 新增 ERP 功能模組 | SKILL.md 印刷 ERP 特定注意事項、Step 2 表格 |

**② 執行自我稽核腳本**

```bash
bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
```

稽核結果若出現 ⚠️，依提示補充索引後再 commit。ℹ️ 為提示項，確認後決定是否補充。

---

## 格式與風格規範

- **語言**：繁體中文（技術術語保留英文，如 WO、BOM、FK、UUID、API）
- **使用者故事**：`作為 [角色]，我想要 [功能]，以便 [目的]`
- **優先級**：P0（必做）/ P1（重要）/ P2（Nice-to-have）

---

## 印刷 ERP 特定注意事項

| 模組 | 特殊考量 |
|------|----------|
| 生產排程 | 機台換線時間、版費成本、廢張比例、急單插入邏輯 |
| 採購 | 紙張規格多元（磅數 × 尺寸 × 類型）、供應商交期差異 |
| 倉儲 | FIFO 紙張管理、批次追蹤、保存條件 |
| 訂單管理 | 稿件狀態與生產狀態連動、交期計算需扣除假日 |
| 需求單 | 業務報價流程、成本評估（印務主管）、成交 / 流失分流 |

---

## 輸出物

1. **功能規格書（.md 格式）**：依 `references/spec-template.md` 結構產出，Section 10 / 11 預設跳過
2. **OQ 參照節點（Section 12）**：顯示本模組與相關跨模組 OQ 的 ID + 摘要，正本在 `memory/erp/open-questions.md`
3. **資料模型更新**（若有欄位異動）：同步更新 `docs/data-model.md` 對應模組節

---

## 參考資源

| 資源 | 路徑 |
|------|------|
| Spec 模板 | `references/spec-template.md` |
| ERP 全局資料模型 | `docs/data-model.md` |
| 通用工作原則 | `memory/shared/principles.md` |
| ERP 產品目標 / KPI | `memory/erp/product-goals.md` |
| 狀態機（上層：需求單 / 訂單 / 工單） | `memory/erp/state-machines.md` |
| 狀態機（下層：任務 / QC / 出貨） | `memory/erp/state-machines-ops.md` |
| 待確認事項 | `memory/erp/open-questions.md` |
| 情境驗證 | `memory/erp/scenarios.md` |
| 使用者情境（角色需求故事） | `memory/erp/user-scenarios.md` |
| 業務流程（核心規則） | `memory/erp/business-process.md` |
| ERP 術語表 | `memory/erp/glossary.md` |
| 共用術語 | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
