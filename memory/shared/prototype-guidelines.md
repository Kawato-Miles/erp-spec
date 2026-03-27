# Prototype 製作工作流程

> **目的**：確保 Prototype 設計過程中參考資料完整、驗證後同步更新，避免下次製作時引用過時資料。
>
> **適用範圍**：所有產品 Prototype 製作（ERP、圖編器等）
>
> 最後更新：2026-03-26

---

## 一、Prototype 製作前的準備

### 1.1 參考資料清單（必檢查）

製作任何 Prototype **前**，收集並確認以下參考資料已備妥：

| 資料 | 正本位置 | 必需 | 用途 |
|------|---------|------|------|
| **功能規格（BRD）** | Notion Feature Database | ✓ | 功能需求、邊界條件 |
| **資料欄位定義** | Notion 資料欄位 DB | ✓ | 各模組欄位名稱、型別、說明（撰寫 prompt 時以此為準） |
| **業務情境** | Notion 業務情境 DB | ✓ | 完整操作步驟與分支情況 |
| **使用者故事 / 角色權責** | Notion User Story DB + Notion 使用者情境 | ✓ | 各角色的工作內容、期望結果 |
| **狀態機** | Notion 狀態變化 | ✓ | 業務狀態轉移規則 |
| **測試案例** | Notion ERP Test Case DB | 視需要 | 邊界測試、異常情況 |
| **業務流程** | Notion 商業流程 | 視需要 | 核心商業規則 |
| **Open Questions** | Notion Follow-up DB | 視需要 | 待確認項目對 Prototype 的影響 |

> Notion 各資源 URL 見 `memory/shared/notion-index.md`。

> **撰寫 Lovable / Prototype prompt 時**：表單欄位名稱、欄位型別、必填規則一律查 Notion 資料欄位 DB，不得自行命名或憑印象填入。

---

## 二、Prototype 製作中的檢查點

### 2.1 功能對應檢查

| 檢查項 | 應確保 |
|--------|--------|
| 所有 Spec 需求已實現 | Prototype 涵蓋 BRD 中列出的所有功能點、按鈕、表單欄位 |
| 邊界條件已處理 | BRD 的異常情況（如驗證失敗、空狀態、超長文字）已視覺化 |
| 狀態轉移正確 | 按鈕操作對應 Notion 狀態變化的狀態轉移規則 |
| 流程完整性 | Notion 業務情境 DB 的完整流程步驟在 Prototype 中有對應 UI |

### 2.2 情境驗證檢查

對應 Notion User Story DB + Notion 使用者情境中的每個角色工作流：

- 該角色需要的所有功能在 Prototype 中可見或可訪問
- 操作流程符合 Notion 業務情境 DB 的步驟順序
- 訊息提示、確認對話符合情境需求

---

## 三、Prototype 版本追蹤

以 Lovable 的版本紀錄為主。PM 在 Notion BRD 或 Follow-up DB 中記錄每次重大修訂對應的 BRD 版本與 OQ 編號即可。

---

## 四、Prototype 驗證流程

1. **功能自檢**
   - 對照 2.1 功能對應檢查清單
   - 對照 2.2 情境驗證檢查清單

2. **跨職能驗證**（與 Spec 撰寫者、PM 協審）
   - 確認功能邏輯是否符合 BRD 意圖
   - 確認流程是否符合 Notion 業務情境 DB 預期
   - 確認設計是否符合業務期望

3. **使用者驗證**（可選，UAT 階段）
   - 真實使用者測試 Prototype 流程
   - 記錄使用者反饋

> 驗證發現的問題，統一以 oq-manage 新增至 Notion Follow-up DB，不在 Prototype 原始碼中記錄。

---

## 五、驗證問題同步規則

**驗證發現的問題 → 觸發 oq-manage → 更新對應 Notion 資料**

| 發現問題 | 對應更新 | 更新者 |
|---------|---------|-------|
| **功能邏輯有誤** | Notion BRD（新增 OQ 或修正需求） | PM |
| **步驟流程遺漏** | Notion 業務情境 DB（新增/修正情境） | PM |
| **狀態轉移不符** | Notion 狀態變化（修正狀態定義） | PM |
| **角色工作流缺失** | Notion User Story DB + Notion 使用者情境 | PM |
| **測試遺漏** | Notion ERP Test Case DB（新增邊界測試） | QA / PM |

---

## 六、Prototype 完成交付清單

- [ ] 參考資料清單（§1.1）已確認備妥
- [ ] 功能對應與情境驗證（§2.1-2.2）已完成
- [ ] 驗證發現的問題已透過 oq-manage 記錄至 Notion Follow-up DB
- [ ] Notion BRD、業務情境 DB、狀態變化 已同步更新

---

## 七、常見問題

**Q: Prototype 涉及多個 BRD，怎麼記錄參考？**
A: 在 Notion BRD 的對應頁面或 Follow-up DB OQ 中說明跨模組影響範圍即可。

**Q: Prototype 已交付，後續發現新問題，要重新製作嗎？**
A: 不必重新製作全部。在 Lovable 上迭代修改，並透過 oq-manage 記錄本次修改的 OQ 依據。

**Q: 誰負責同步參考資料？**
A: PM 負責更新 Notion BRD、業務情境 DB、狀態變化；QA 負責更新 Notion ERP Test Case DB。
