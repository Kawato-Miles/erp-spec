# Prototype 製作工作流程

> **目的**：確保 Prototype 設計過程中參考資料完整、驗證後同步更新，避免下次製作時引用過時資料。
>
> **適用範圍**：所有產品 Prototype 製作（ERP、圖編器等）
>
> 最後更新：2026-02-23

---

## 一、Prototype 製作前的準備

### 1.1 參考資料清單（必檢查）

製作任何 Prototype **前**，收集並確認以下參考資料已備妥，並註記版本/日期：

| 資料 | 路徑 | 必需 | 用途 |
|------|------|------|------|
| **功能規格** | `spec/*.md` | ✓ | 功能需求、邊界條件、資料欄位 |
| **情境流程** | `memory/[product]/scenarios.md` | ✓ | 完整的操作步驟與分支情況 |
| **使用者故事** | `memory/[product]/user-scenarios.md` | ✓ | 各角色的工作內容、期望結果 |
| **狀態機** | `memory/[product]/state-machines.md` 或 `state-machines-ops.md` | ✓ | 業務狀態轉移規則 |
| **測試案例** | `memory/[product]/test-cases.md` | 視需要 | 邊界測試、異常情況 |
| **UI 設計系統** | `memory/shared/ui-design-system.md` | ✓ | Design Tokens、版面規範、介面原則 |
| **業務流程** | `memory/[product]/business-process.md` | 視需要 | 核心商業規則 |
| **Open Questions** | `memory/[product]/open-questions.md` | 視需要 | 待確認項目對 Prototype 的影響 |

### 1.2 版本對應表

在 Prototype 檔案的開頭或註解中記錄：

```markdown
<!--
Prototype 版本：v1.0
製作日期：2026-02-23
參考版本：
  - spec-quote-request.md (v1.2, 2026-02-23)
  - scenarios.md (Line 45-67, 2026-02-20)
  - state-machines.md (需求單狀態, 2026-02-15)
  - UI 設計系統 (Ant Design 5.x, 2026-01-30)
  - user-scenarios.md (銷售員工作流, 2026-02-18)
-->
```

---

## 二、Prototype 製作中的檢查點

### 2.1 功能對應檢查

| 檢查項 | 應確保 |
|--------|--------|
| 所有 Spec 需求已實現 | Prototype 涵蓋 Spec 中列出的所有功能點、按鈕、表單欄位 |
| 邊界條件已處理 | Spec 的異常情況（如驗證失敗、空狀態、超長文字）已視覺化 |
| 狀態轉移正確 | 按鈕操作對應 state-machines 的狀態轉移 |
| 流程完整性 | scenarios.md 的完整流程步驟在 Prototype 中有對應 UI |

### 2.2 設計規範檢查

| 檢查項 | 規範來源 |
|--------|---------|
| 配色、字型、間距 | `memory/shared/ui-design-system.md` § Design Tokens |
| 版面佈局（側欄、內容區） | `memory/shared/ui-design-system.md` § 版面結構 |
| 介面原則（無 Emoji、側欄模組等） | `memory/shared/ui-design-system.md` § 介面設計通用原則 |
| 按鈕、表單元件樣式 | `memory/shared/ui-design-system.md` § 元件規範 |

### 2.3 情境驗證檢查

對應 `user-scenarios.md` 中的每個角色工作流：

- ✓ 該角色需要的所有功能在 Prototype 中可見或可訪問
- ✓ 操作流程符合 scenarios.md 的步驟順序
- ✓ 訊息提示、確認對話符合情境需求

---

## 三、Prototype 版本與變更追蹤

### 3.1 版本編號規則

```
v X.Y

X = 主版本（重大功能變更、版面重設計）
Y = 修訂版（局部調整、細節修正、規範更新）

例：
v1.0 - 初版（基本功能完整）
v1.1 - 修正欄位標籤、間距調整
v2.0 - 新增角色切換、大幅版面改版
```

### 3.2 變更記錄（檔案內註釋）

在 Prototype HTML 檔案的 `<head>` 或檔案開頭明確記錄：

```html
<!--
版本歷史：
v1.0 (2026-02-23)
  - 初版：完整報價單流程
  - 參考：spec-quote-request.md v1.2

v1.1 (2026-02-24)
  - 修正：報價金額欄位 label 改為「含稅金額」
  - 修正：驗證失敗時的 error message 位置
  - 來源：OQ#12 反饋

v2.0 (2026-03-01)
  - 新增：客戶審稿權限流程（新情境）
  - 修正：狀態機新增「審稿中」狀態
  - 參考：scenarios.md § 審稿流程 (Line 78-95)
-->
```

---

## 四、Prototype 驗證與反饋流程

### 4.1 驗證流程

1. **內部驗證**（製作者自檢）
   - 對照 2.1 功能對應檢查清單
   - 對照 2.2 設計規範檢查清單
   - 對照 2.3 情境驗證檢查清單
   - 記錄找到的問題（見 4.2）

2. **跨職能驗證**（與 Spec 撰寫者、PM、設計師協審）
   - 確認功能邏輯是否符合 Spec 意圖
   - 確認流程是否符合 scenarios.md 預期
   - 確認設計是否符合業務期望

3. **使用者驗證**（可選，UAT 階段）
   - 真實使用者測試 Prototype 流程
   - 記錄使用者反饋

### 4.2 反饋記錄方式

發現問題時，在 Prototype 檔案中記錄：

```html
<!--
驗證反饋：
[2026-02-24] 審稿員反饋：報價金額欄位在新增行項時應自動重算，目前為手動輸入
  → 影響：scenarios.md § 新增品項流程 (Line 52)
  → 更新對象：spec-quote-request.md OQ#5、scenarios.md Line 52
  → 狀態：待更新 Spec

[2026-02-25] 發現：驗證失敗時缺少「欄位層級」的錯誤提示
  → 影響：spec 需求「每個欄位需獨立驗證提示」(Line 34)
  → 更新對象：spec-quote-request.md（確認需求）
  → 狀態：待確認需求

[2026-02-26] 內部驗證：側欄模組「報表」尚未規劃，應移除或標記為「Coming Soon」
  → 影響：UI 設計系統 § 側欄模組原則
  → 更新對象：Prototype 本身（移除）
  → 狀態：已修正
-->
```

---

## 五、參考資料同步規則

### 5.1 同步原則

**Prototype 驗證發現的問題 → 對應更新相關參考資料**

| 發現問題 | 對應更新 | 更新者 | 時機 |
|---------|---------|-------|------|
| **功能邏輯有誤** | Spec（新增 OQ 或修正需求） | PM | 立即 |
| **步驟流程遺漏** | scenarios.md（新增/修正情境） | PM | 立即 |
| **狀態轉移不符** | state-machines.md（修正狀態定義） | PM | 立即 |
| **角色工作流缺失** | user-scenarios.md（補充/修正角色故事） | PM | 立即 |
| **設計規範缺失** | ui-design-system.md（新增 Token 或規範） | Designer | 下版本 |
| **測試遺漏** | test-cases.md（新增邊界測試） | QA / PM | 立即 |

### 5.2 具體同步範例

**情景：Prototype 發現報價金額需要自動重算**

1. **Prototype 中記錄**（見 4.2）
   ```html
   [2026-02-24] 審稿員反饋：報價金額欄位在新增行項時應自動重算
     → 更新對象：spec-quote-request.md OQ#5、scenarios.md
   ```

2. **更新 Spec（spec-quote-request.md）**
   ```markdown
   OQ#5：報價金額重算時機
   日期：2026-02-24 已解答

   答：新增/編輯任何行項時，總金額應自動重算。
   計算邏輯：Σ(單價 × 數量) × (1 + 稅率)
   UI 反饋：重算完成時 Toast 提示「已自動更新金額」

   Prototype 位置：code/prototype-quote-request.html v1.1
   ```

3. **更新 scenarios.md**
   ```markdown
   § 新增品項
   1. 使用者在「品項表」點擊「新增列」
   2. 輸入品項名稱、單價、數量
   3. **系統自動重算「報價總金額」** ← 新增此行
   4. UI 顯示 Toast「已自動更新金額」← 新增此行
   5. 使用者確認金額無誤，點擊「儲存」
   ```

4. **更新 user-scenarios.md**（如涉及角色工作流變更）
   ```markdown
   銷售員工作流：報價單編輯
   ...
   當編輯品項時，系統自動重算報價金額，銷售員無需手動更新。
   ```

### 5.3 同步檢查清單

Prototype 完成並驗證後，檢查以下：

- [ ] 所有反饋問題都在 Prototype 檔案中記錄（見 4.2）
- [ ] 每個問題都有「更新對象」清單
- [ ] 「待更新」的問題已分配責任人與完成日期
- [ ] Spec、scenarios.md、state-machines.md 已同步更新
- [ ] user-scenarios.md 已同步更新（如有工作流變更）
- [ ] 更新完成後，Prototype 檔案中的記錄標記為「已更新」
- [ ] 相關 OQ（open-questions.md）已更新或移至封存

---

## 六、Prototype 完成交付清單

### 6.1 交付前檢查

- [ ] Prototype 版本號和製作日期已記錄
- [ ] 參考資料版本對應表已完整（見 1.2）
- [ ] 內部驗證清單已完成（見 2.1-2.3）
- [ ] 所有反饋問題已記錄並分類（見 4.2）
- [ ] 相關參考資料已全部同步（見 5.2）
- [ ] 待確認項目（OQ）已記錄
- [ ] Prototype 檔案放在 `code/` 目錄
- [ ] 相關 Spec 放在 `spec/` 目錄

### 6.2 交付物清單

```
交付 Prototype: code/prototype-[功能名].html v1.0
├─ 包含版本對應表
├─ 包含驗證反饋記錄
└─ 所有參考資料已同步

對應 Spec: spec/spec-[功能名].md v1.2
├─ OQ 已更新或新增
└─ 涵蓋 Prototype 發現的所有邊界

對應情境：memory/[product]/scenarios.md（已更新）
對應狀態機：memory/[product]/state-machines.md（已更新）
對應使用者故事：memory/[product]/user-scenarios.md（已更新）
```

---

## 七、常見問題

**Q: Prototype 發現的小改進（如間距、顏色），需要同步嗎？**
A: 是。如果偏離了 ui-design-system.md 的規定，應在該檔案中新增或澄清該 Token；如果是新增合理的設計模式，也應補充到 ui-design-system.md，供下次 Prototype 參考。

**Q: Prototype 涉及多個 Spec，怎麼記錄參考？**
A: 在版本對應表中逐一列出。例：
```html
參考版本：
  - spec-quote-request.md v1.2
  - spec-customer-approval.md v1.0 (審稿流程部分)
  - scenarios.md (Line 45-67, Line 78-95)
```

**Q: Prototype 已交付，後續發現新問題，要重新製作嗎？**
A: 不必重新製作全部。在同一個檔案中新增版本（如 v1.1），記錄變更（見 3.2），更新對應資料。如果是重大變更，考慮製作 v2.0。

**Q: 誰負責同步參考資料？**
A: 原則上 Prototype 製作者在完成前負責發現並記錄；PM 負責更新 Spec、scenarios、state-machines；Designer 負責更新 ui-design-system；但應該**團隊共識**誰最後負責確保所有同步完成。
