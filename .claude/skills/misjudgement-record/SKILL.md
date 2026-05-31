---
name: misjudgement-record
description: >
  三視角審查 Agent（senior-pm / ceo-reviewer / erp-consultant）誤審記錄管理 skill。
  目的：累積誤審案例庫讓 agent 自學避免重複犯錯。
  正本位置：Vault `memory/Sens_wiki/wiki/erp/11-review-knowledge/` 內三個誤審卡（分類存放）。
  觸發時機：
    1. Miles 反駁 agent 的審查建議（「這不對」「審錯了」「以後別這樣審」）
    2. Miles 說「記下來」「這是誤審」「補誤審案例」
    3. agent 審查後 Miles 明確表示「方向錯了」「規則太學術」「不通順」等
    4. 主動收尾時識別到本次討論發生過 agent 誤審
  此 skill 強制執行去重邏輯：新增前先搜尋相似案例，由 Claude 分析並建議。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁止只在當前回應口頭說「以後別這樣」「下次會注意」卻不觸發本 skill
    2. 寫入時 MUST 提取「案例情境 / 誤審內容 / 實際情況 / 教訓」四要素，缺一不可
    3. 教訓 MUST 用具體場景（誰會在哪裡混淆），MUST NOT 用學術理由（資料模型語義學等）
    4. 同類誤審 MUST 去重（搜尋既有案例後決定是擴充還是新增）
    5. 寫入後 MUST 更新對應卡 frontmatter `last-reviewed`
  不適用：
    - 一般 spec 修訂建議（不是誤審）
    - agent 提了好建議但 Miles 不採（不是誤審，是設計選擇）
    - 還沒確認的「可能誤審」（要先確認是誤審才能記）
    - 純口語 / 措辭調整（與審查邏輯無關）
---

# 誤審記錄

統一管理三視角審查 agent 的誤審案例。**操作正本在 Vault `11-review-knowledge/`**，與 agent.md 解耦，讓 Miles 可直接維護案例庫。

---

## 三類誤審 → 三個目標卡

| 誤審類型 | 判斷標準 | 目標卡 |
|---------|---------|--------|
| **跨 agent 通用** | 任一 agent 都可能犯的誤審（設計理解不充分、過度推論、跳防誤審步驟）| [`_shared/review-loading-checklist.md`](../../../memory/Sens_wiki/wiki/erp/11-review-knowledge/_shared/review-loading-checklist.md) § 三 |
| **ERP 顧問命名 / 用語** | erp-consultant 提改名 / 新術語時違反 5 秒測試（英文 ERP 術語直接搬、學術名稱衝突推論、直譯外來語）| [`erp/erp-naming-misjudgements.md`](../../../memory/Sens_wiki/wiki/erp/11-review-knowledge/erp/erp-naming-misjudgements.md) |
| **CEO 商業推論誤區** | ceo-reviewer 以「政治成本」「教育負擔」「上線時程壓力」等 prototype 階段不存在的因素為由建議延後 / 不做 | [`ceo/ceo-review-pitfalls.md`](../../../memory/Sens_wiki/wiki/erp/11-review-knowledge/ceo/ceo-review-pitfalls.md) § 一 |

### 分類決策樹（Step B1 使用）

```
誤審內容是 →

  改名 / 新術語建議？
  ├─ 是 → 走 ERP 命名卡（erp-naming-misjudgements.md）
  └─ 否 ↓

  以「政治成本 / 教育負擔 / 上線時程 / 客戶習慣轉換 / 翻轉 spec 成本」為由？
  ├─ 是 → 走 CEO 誤區卡（ceo-review-pitfalls.md）
  └─ 否 ↓

  其他（設計理解錯、跳防誤審步驟、過度推論、規則過於學術等）
  └─ 走跨 agent 通用卡（review-loading-checklist.md § 三）
```

**跨 agent 衍生規則**：跨 agent 通用案例若有 ERP 命名或 CEO 商業面向，**MUST** 在目標卡加 cross-reference 引用至專屬卡。

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| A：查詢 | Miles 想看既有誤審案例 / 審查前重溫案例 |
| B：新增（含去重）| 識別到誤審 / Miles 說「記下來」|
| C：更新 | 既有案例需補充細節 / 新發現相關情境 |

---

## 模式 A：查詢

### A1：列出特定卡的所有案例

```
Read: memory/Sens_wiki/wiki/erp/11-review-knowledge/<目標卡路徑>
```

或 grep 找特定關鍵字：

```bash
grep -n "案例\|2026" memory/Sens_wiki/wiki/erp/11-review-knowledge/erp/erp-naming-misjudgements.md
```

### A2：跨卡搜尋（特定關鍵字）

```bash
grep -rn "<關鍵字>" memory/Sens_wiki/wiki/erp/11-review-knowledge/{_shared,erp,ceo}/
```

### A3：回報格式

```
[誤審案例查詢結果]

跨 agent 通用（review-loading-checklist § 三）：
- 2026-04-XX「Payment 跨訂單轉移」誤審（適用所有 agent）
- ...

ERP 命名（erp-naming-misjudgements）：
- 2026-05-08「期次待收金額」改名建議
- 2026-05-08「watchlist」命名
- ...

CEO 誤區（ceo-review-pitfalls § 一）：
- 「翻轉既有 spec 的政治成本」
- 「業務 / 印務 / 客戶被反覆教育的負擔」
- ...
```

---

## 模式 B：新增（強制去重流程）

**禁止跳過任何步驟。**

### Step B1：分類

依 § 三類誤審 § 分類決策樹 判斷誤審類型。

**若無法判斷**：先停下來，跟 Miles 確認分類（不要瞎猜）。

### Step B2：提取四要素

確認以下四要素（若 Miles 未完整提供，從對話脈絡推論並請 Miles 確認）：

1. **案例情境**：日期、誤審 agent 名稱、發生在哪個 change / 哪段討論
2. **誤審內容**：agent 提了什麼建議 / 結論 / 規則
3. **實際情況 / Miles 反饋**：Miles 的反駁原話（**MUST 原話保留**，不要轉述）
4. **教訓**：從這次誤審萃取的規則或 anti-pattern

**強制規則**：教訓 **MUST** 用具體場景描述（「誰會在哪裡混淆」「什麼情境下會誤判」），**MUST NOT** 用學術理由（「資料模型語義學」「狀態機論」這類詞 Miles 也看不懂——這條規則本身就是從 2026-05-08「期次待收金額」案例萃取出來的）。

### Step B3：搜尋相似案例（去重）

讀目標卡完整內容，分析語意相似度：

| 相似度 | 判斷標準 | 建議動作 |
|--------|---------|---------|
| 高（同一類誤審重演）| 核心教訓相同，只是情境不同 | 建議擴充既有案例的「歷史案例」段，不新增獨立條目 |
| 中（相關但不同面向）| 同一視角但教訓不同 | 新增獨立案例 + 在「相關案例」標註關聯 |
| 低（明顯不同）| 與既有案例無重疊 | 新增獨立案例 |

回報格式：

```
[誤審分類與去重分析]

分類：<跨 agent 通用 / ERP 命名 / CEO 誤區>
目標卡：<檔案路徑>

相似度：高 / 中 / 低
既有相關案例：
  - <案例日期> + <案例標題>

建議動作：擴充既有案例 / 新增獨立案例

請 Miles 確認。
```

**等待 Miles 確認後**才執行 Step B4。

### Step B4：寫入

#### 跨 agent 通用案例（review-loading-checklist.md § 三）

用 Edit 工具在 § 三 內追加新案例條目，格式：

```markdown
### YYYY-MM-DD「<案例標題>」誤審

- **誤審 agent**：<agent 名稱 / 多個 agent>
- **誤審內容**：<agent 提了什麼>
- **實際情況**：<Miles 原話反饋>
- **教訓**：
  1. <教訓 1 — 用具體場景>
  2. <教訓 2 — 用具體場景>
  3. **規則**：<從此案例萃取的可重用規則>
- **適用 agent**：<所有 agent / 特定視角>
- **相關專屬卡**：<若有，加 wiki link 至 erp-naming-misjudgements 或 ceo-review-pitfalls>
```

#### ERP 命名案例（erp-naming-misjudgements.md）

用 Edit 在 § 一 / § 二 後追加新「§ 案例 N」條目，格式（參考 § 一 § 案例 1 結構）：

```markdown
## <案例編號>、案例 N：YYYY-MM-DD「<改名建議名稱>」<簡短描述>

**背景**：<什麼 change / 場景中提了什麼改名建議>

**理由（誤審當時）**：
- <agent 當時的理由 1>
- <agent 當時的理由 2>

**Miles 反饋**：
<Miles 原話反饋，MUST 保留原話>

**教訓 N**：<從此案例萃取的規則或 anti-pattern，用具體場景>

**規則**：<可重用的判斷規則，整合進 erp-naming-rules.md（若需要）>
```

#### CEO 誤區案例（ceo-review-pitfalls.md § 一）

用 Edit 在 § 一 5 條既有誤區後追加第 6+ 條（若是新類型誤區）；或在既有對應誤區內追加「歷史案例」（若是既有類型的新案例）。

格式（新類型）：

```markdown
### N. 「<誤區名稱>」

- **誤區**：<具體誤區描述>
- **正解**：<該怎麼想 / 該怎麼做>
- **依據**：<wiki link 至 prototype-stage-context 或其他依據>
- **歷史案例**：YYYY-MM-DD <案例情境>
```

### Step B5：更新 frontmatter

寫入後 **MUST** 更新對應卡的 frontmatter `last-reviewed`：

```yaml
last-reviewed: <今日日期>
```

### Step B6：跨 agent 通用案例的 cross-reference

若新增的是「跨 agent 通用」案例，且涉及 ERP 命名或 CEO 商業推論面向，**MUST** 同步在對應專屬卡（erp-naming-misjudgements 或 ceo-review-pitfalls）的「相關卡」段加引用。

範例：跨 agent 案例「過度推論導致建議用學術術語」→ 同步在 erp-naming-misjudgements 加：
> 此案例同時收錄於 [[review-loading-checklist]] § 三 跨 agent 通用記錄。

### Step B7：回報

```
[誤審案例已寫入]

分類：<跨 agent 通用 / ERP 命名 / CEO 誤區>
目標卡：<檔案路徑>
案例：<案例標題>
教訓：<一句話摘要>

frontmatter last-reviewed：已更新為 YYYY-MM-DD
Cross-reference：<已加 / 無需 / 加在 XX 卡>
```

---

## 模式 C：更新

### C1：補充既有案例細節

讀目標卡 → 用 Edit 在對應案例條目追加新內容。**保留原有內容**，不覆寫。

範例：發現「期次待收金額」案例還有第三層教訓 → 在原案例「教訓 3」後加「教訓 4」，不動原本 3 條。

### C2：發現既有案例分類錯誤

若發現某誤審案例放在錯誤的卡（如「watchlist」案例應該放跨 agent 通用而不是 ERP 命名）：

1. 從原卡用 Edit 移除該條目
2. 走 mode B 在新卡建立條目
3. 在原卡留 cross-reference：「<案例> 已重新分類至 [[新卡]]」

### C3：擴充既有 CEO 誤區的「歷史案例」段

CEO 誤區若再次發生，**不新增 § 條目**（避免條目膨脹），而是在既有 § 對應誤區下追加：

```markdown
- **歷史案例**：
  - YYYY-MM-DD <原案例情境>
  - YYYY-MM-DD <新案例情境>  ← 追加
```

---

## 與其他 skill 的關係

| Skill | 關係 |
|------|------|
| `oq-manage` | 平行：OQ 是「設計不確定項」，誤審記錄是「agent 審查犯錯」；兩者結構類似但內容不同 |
| `vault-audit` | 互補：vault-audit 掃 Vault 健康（結構、引用、孤兒），不掃誤審記錄內容；本 skill 確保誤審記錄正確累積 |
| `vault-insight` | 上游：若同類誤審累積過多（如同一 agent 一個月內 5 次以上類似誤審），vault-insight 可識別為「系統性議題」並建議行動 |
| `doc-audit` | 不重疊：doc-audit 處理 OpenSpec spec 層的索引一致性 |

---

## Anti-Pattern 範例

### 反例 1：口頭說「以後別這樣」不寫入

```
Miles：「你這次又把 reason 自由文字看成可接受了。」
Claude：「了解，以後我會優先建議 LOV+備註。」
[未觸發本 skill]
```

**錯在哪**：下次 session 失憶，agent 又會犯一樣的錯。違反 hard rule 第 1 條。

**正例**：

```
Miles：「你這次又把 reason 自由文字看成可接受了。」
Claude：「這是 ERP 命名 / 用語類誤審，我用 misjudgement-record mode B 建檔。」
[觸發 mode B → 提取四要素 → 去重 → 寫入 erp-naming-misjudgements 或 erp-review-framework]
```

---

### 反例 2：教訓用學術理由

```markdown
## 案例 N：2026-XX-XX「XX 改名」

**教訓**：依資料模型語義學原則，跨層級欄位應使用 disambiguating prefix...
```

**錯在哪**：違反 hard rule 第 3 條。Miles 看不懂「資料模型語義學」「disambiguating prefix」，下次審查時 agent 套不上這條規則。

**正例**：

```markdown
**教訓**：
1. UI 上下文已能區分「Payment 是訂單的還是期次的」，使用者不會混淆
2. 強行加學術前綴只會增加 PM / 業務 / 老闆閱讀成本
3. 規則：「同名欄位跨層級」不是業務認知衝突，不要改名
```

---

### 反例 3：未去重，重複記錄

不查既有案例就直接新增「2026-06-XX 期次層誤審」，導致 erp-naming-misjudgements 累積多筆「期次 XX」相似案例，案例庫膨脹但實質教訓重複。

**錯在哪**：違反 hard rule 第 4 條。

**正例**：先 grep「期次」找到 2026-05-08 案例 → 判定為「同類誤審重演」→ 在既有案例 § 末加「歷史案例：2026-06-XX」一行，不新增獨立條目。

---

### 反例 4：四要素缺漏

```markdown
**教訓**：以後別這樣命名。
```

**錯在哪**：缺案例情境、誤審內容、實際情況。違反 hard rule 第 2 條。下次 agent 不知道「哪種命名」「為何不對」「Miles 怎麼反饋的」。

**正例**：四要素完整填寫（見 Step B2）。

---

## 工具使用

| 操作 | 工具 |
|------|------|
| 查詢既有案例 | Read / Grep |
| 跨卡搜尋 | Bash `grep -rn` |
| 寫入新案例 | Edit（追加既有檔，**不要 Write 覆蓋**）|
| 更新 frontmatter | Edit |

**重要**：誤審記錄 **MUST** 用 Edit **追加**至既有卡，**MUST NOT** Write 覆蓋整檔。三個目標卡是長期累積式案例庫。

---

## 觸發頻率預估

- 預期：每月 2-5 次（agent 誤審頻率）
- 隨案例累積，同類誤審應遞減（agent 自學效果）
- 若同類誤審月頻率不降反升，觸發 vault-insight 識別為「系統性議題」

---

## 相關卡

- [[review-loading-checklist]] § 三 — 跨 agent 通用誤審記錄
- [[erp-naming-misjudgements]] — ERP 命名誤審記錄
- [[ceo-review-pitfalls]] — CEO 商業推論誤區
- [[erp-naming-rules]] — ERP 命名規則（誤審累積後可演化為新規則）
- [[insight-discipline]] — Insight 共通規範（誤審的根源規範）
