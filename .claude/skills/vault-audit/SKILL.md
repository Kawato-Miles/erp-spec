---
name: vault-audit
description: >
  ERP_Vault 自審稽核 skill。對 `memory/erp/ERP_Vault/` 執行 10 維度健康檢查（Karpathy LLM Wiki 模式 6 維度 + Sens 特化 4 維度），產出對話報告 + 追加 `00-meta/audit-log.md`。
  觸發時機：
    1. Miles 說「跑 vault audit」「Vault 健康檢查」「audit vault」
    2. 主動收尾發現 ≥ 5 個 Vault 卡異動時建議
    3. change archive 後建議
    4. 每 20+ commit 後建議
  範圍：**只稽核 ERP_Vault**。OpenSpec spec 層稽核由 `doc-audit` skill 處理。
  輸出：對話報告 + 寫入 `memory/erp/ERP_Vault/00-meta/audit-log.md`（追加式、禁覆寫）。
  不適用：OpenSpec spec 稽核（用 doc-audit）、Prototype 程式碼稽核（用 e2e 測試）、純對話內容稽核。
---

# vault-audit

ERP_Vault 自審工具。**禁止運行於 ERP_Vault 以外的目錄**。

---

## 一、定位與範圍

**目標**：對 `memory/erp/ERP_Vault/` 102+ 卡執行健康檢查，產出可 actionable 的稽核報告。

**對標**：Karpathy LLM Wiki 模式的 `lint` 操作 — 「**找出矛盾 / 過時 / 孤立 / 缺連結 / 缺口 / 需調查方向**」。

**範圍**：

| 範圍 | 處理 |
|------|------|
| ERP_Vault 內所有 .md / .canvas | **本 skill 處理** |
| OpenSpec spec / change / archive | 用 `doc-audit` skill |
| Prototype src/ | 不在範圍（e2e 測試處理）|
| memory/ 其他目錄 | 不在範圍（保留為 Prototype / shared 範疇）|

---

## 二、三種執行模式

| 模式 | 觸發句 | 用途 |
|------|--------|------|
| **A 全量** | 「跑 vault audit」「audit vault」「全量稽核」 | 10 維度全掃，~3-5 分鐘 |
| **B 單維度** | 「跑維度 N audit」「audit 維度 X」「只查孤立頁面」 | 針對性檢查，~30 秒 |
| **C 修復** | 「跑 vault audit + fix」「audit 並修復」「audit 自動修」 | 全掃 + 對可自動修復項建議或執行修復 |

---

## 三、10 個稽核維度

### 維度 1：頁面間矛盾（Karpathy）

**檢查方法**：
1. 對核心概念清單（如「齊套邏輯」「印件」「工單」「審稿」「QC」）grep 在哪些卡被引用
2. LLM 比對描述差異
3. 標記矛盾敘述（同概念在 A 卡寫「X」，在 B 卡寫「非 X」）

**Bash**：

```bash
# 範例：抓「齊套邏輯」在哪些卡定義
grep -rln "齊套\|kitting" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/ --include="*.md"
```

**判定**：
- OK：同概念跨卡描述一致
- Warning：補充性差異（不矛盾，但細節不同）
- Error：明確矛盾

### 維度 2：過時宣稱（Karpathy）

**檢查方法**：

```bash
# 找 last-reviewed > 90 天且 status: active 的卡
today=$(date +%Y-%m-%d)
threshold=$(date -v-90d +%Y-%m-%d 2>/dev/null || date -d "90 days ago" +%Y-%m-%d)
grep -rn "^last-reviewed:" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/ --include="*.md" \
  | awk -F: -v t="$threshold" '$NF < " "t {print}'
```

**判定**：
- OK：所有 active 卡 last-reviewed < 90 天
- Warning：1-5 卡過時
- Error：> 5 卡過時

### 維度 3：孤立頁面（Karpathy）

**檢查方法**：

```bash
# 用 obsidian CLI（若已啟用）
obsidian orphans

# 或 fallback：grep 反向引用為 0 的卡
# 對每個 .md 檔，檢查其檔名是否被其他卡 wiki link 引用
```

**判定**：
- OK：0 個 orphan（除 README / index 性質檔）
- Warning：1-3 個 orphan
- Error：> 3 個 orphan

### 維度 4：缺失連結（Karpathy）

**檢查方法**：

```bash
# 用 obsidian CLI
obsidian unresolved

# 或 fallback：grep 所有 [[X]]，對 X 檔不存在的列出
```

**判定**：
- OK：0 個 dangling
- Warning：1-5 個 dangling（多半是 placeholder）
- Error：> 5 個 dangling

### 維度 5：數據缺口（Karpathy）

**檢查方法**：

1. **必填 frontmatter 欄位**（依 `00-meta/wiki-schema.md`）：

```bash
# 例：所有 entity 卡必須有 type / module / related-spec
for f in /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/05-entities/*.md; do
  grep -L "^type:" "$f" && echo "$f 缺 type"
done
```

2. **README 列了但無實際卡**：

```bash
# 例：08-open-questions/README.md 列出 OQ 名單，逐一檢查是否有對應 .md
```

**判定**：
- OK：0 個缺口
- Warning：1-5 個
- Error：> 5 個

### 維度 6：規則遵守（Karpathy + Sens）

**檢查項目**：

1. **無 inline `[!question]` callout**（Phase D 強制規則）：

```bash
grep -rn "\[!question\]" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/ --include="*.md" | grep -v "08-open-questions/README.md"
# 應為 0 筆（除 README 教示文字）
```

2. **無 inline OQ 措辭**（待確認 / 待釐清 / 需確認 / 尚未確認 / 待補）：

```bash
grep -rn "（待補\|（待釐清\|（待確認）" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/ --include="*.md" \
  | grep -v "08-open-questions/" | grep -v "wiki-schema"
```

3. **命名規約**：OQ 卡用 `<MODULE>-<NNN>-<簡述>.md` 格式

**判定**：
- OK：0 違規
- Warning：1-3 違規
- Error：> 3 違規（觸發建議跑 `oq-manage` mode D 遷出）

### 維度 7：Vault ↔ OpenSpec 對齊（Sens 特化）

**檢查方法**：

1. **Vault 卡引用的 spec 是否存在**：

```bash
grep -rn "related-spec:" /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/ --include="*.md" \
  | awk -F"related-spec: " '{print $2}' \
  | while read spec_path; do
      [ ! -f "/Users/b-f-03-029/Sens/$spec_path" ] && echo "缺 spec: $spec_path"
    done
```

2. **反向：OpenSpec spec 提到的商業概念是否在 Vault 有對應卡**：
   - 抽 OpenSpec 各模組 spec 的關鍵業務名詞（如 BOM / TransferTicket / OrderAdjustment）
   - 檢查 Vault `04-business-logic/` 或 `05-entities/` 是否有對應卡

**判定**：
- OK：Vault → OpenSpec 雙向引用完整
- Warning：少數缺漏（< 3 個）
- Error：明顯不對齊（如某模組無對應 Vault 卡）

### 維度 8：OQ 健康度（Sens 特化）

**檢查項目**：

1. **open 過久**（raised-at > 30 天 + status: open）：

```bash
# 對 08-open-questions/ 各 OQ 卡，看 raised-at 是否超期
```

2. **缺 `expected-resolution-at`**：

```bash
for f in /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions/*.md; do
  [ "$(basename "$f")" = "README.md" ] && continue
  grep -L "^expected-resolution-at:" "$f"
done
```

3. **缺 `source-link`**：同上

4. **priority high 但 raised-at 過久**：高優先但長期擱置

**判定**：
- OK：所有 OQ 健康
- Warning：1-3 OQ 需 follow-up
- Error：> 3 OQ 需 follow-up（建議跑 `vault-insight` 識別系統性議題）

### 維度 9：角色 alignment 落後狀態（Sens 特化）

**檢查方法**：

讀 `03-roles/_alignment-report.md` § 三、OpenSpec 缺漏（11）：

1. 每個「OpenSpec 缺漏」角色：是否仍在 Vault 但 OpenSpec spec 仍無？
2. 對照 OpenSpec change archive 紀錄：是否有對應 change 已補 user-roles spec？
3. 若已補 → 該議題可結案
4. 若未補 → 標記為「持續落後」

**判定**：
- OK：alignment-report 已完全消化（所有缺漏已補或已結案）
- Warning：1-5 角色持續落後
- Error：> 5 角色持續落後 + 已過 60 天（觸發建議跑 `vault-insight` 提煉「角色補建」insight）

### 維度 10：KPI / Phase 進度對照（Sens 特化）

**檢查方法**：

1. 讀 `01-products/erp/phases.md` + `success-metrics.md`
2. 對照 `01-products/erp/kpi/` 各 KPI 卡：
   - 是否有對應 Vault 內容佐證進度？
   - 是否有對應 OpenSpec spec / change 落實？
3. Phase 1（EC 規格品 BOM 覆蓋率）：對照 `material-master` / `process-master` / `binding-master` spec 與 Prototype 實作
4. Phase 2（訂單流程完整完成率）：對照 quote-request / order-management / work-order / production-task / qc / shipping 等模組 spec
5. Phase 3（生產效率優化）：依 plan 為「後驗 epic」，本維度暫跳過

**判定**：
- OK：KPI 對照清晰、有佐證
- Warning：少數 KPI 缺對應 Vault / spec 內容
- Error：多數 KPI 無法對照（觸發建議跑 `vault-insight`）

---

## 四、執行流程

### Step 1：宣告稽核範圍

依模式回報：
- 全量：「執行 vault-audit 全量稽核，10 維度 ...」
- 單維度：「執行 vault-audit 維度 N（XXX）...」
- 修復：「執行 vault-audit + fix ...」

### Step 2：依序執行各維度

每維度執行：
1. Bash 命令（grep / find / obsidian CLI）
2. 整理命中清單
3. 判定 OK / Warning / Error

### Step 3：產出對話報告

```markdown
# Vault Audit 報告（YYYY-MM-DD HH:MM）

## 摘要
- 模式：全量 / 單維度（X） / 修復
- 總體狀態：OK / Warning / Error
- 維度通過：X / 10

## 維度結果

### 維度 1 頁面間矛盾：OK ✓ / Warning / Error
（命中筆數 + 主要案例）

### 維度 2 過時宣稱：...
（同上）

...

## 主要發現（top 3-5）
1. ...
2. ...
3. ...

## 建議下一步
- [自動修復可做的]：建議跑 mode C 修復
- [需 Miles 決策的]：列出待 Miles 處理項
- [需跑 vault-insight 的]：建議跑 insight skill
```

### Step 4：寫入 audit-log.md

追加格式：

```markdown
## [YYYY-MM-DD HH:MM] audit | <模式> | <維度數>

**模式**：全量 / 單維度（N） / 修復

**結果**：
- 維度 1 矛盾：<status>（命中數）
- 維度 2 過時：<status>（命中數）
...

**主要發現**：[3-5 句濃縮]

**下一步建議**：[1-3 條]
```

---

## 五、自動修復可做 vs 不可做

| 可自動修復 | 不可自動修復 |
|-----------|--------------|
| 建立缺失連結的 stub 頁面（含 frontmatter + TODO 註記） | 頁面間矛盾（需 LLM 判斷） |
| 為過時卡列出「last-reviewed 更新提醒」清單 | Vault ↔ OpenSpec 對齊（需 Miles 決策） |
| 為 orphan 卡建議納入 README 索引 | OQ 解答（需 Miles / 利害關係人）|
| 為缺 frontmatter 必填欄位的卡補預設值 | 角色補建決策 |

修復模式（mode C）執行步驟：
1. 先全量稽核
2. 對「可自動修復」項列出清單 + 取得 Miles 確認
3. Miles 確認後執行修復
4. 補一筆 audit-log（標 fix）

---

## 六、與其他 skill 的協作

| Skill | 協作方式 |
|-------|---------|
| `oq-manage` | 維度 6 / 8 發現 inline OQ / 過期 OQ 時，建議觸發 oq-manage mode D / C |
| `vault-insight` | 維度 8 / 9 / 10 發現系統性議題時，建議觸發 vault-insight |
| `doc-audit` | doc-audit 處理 OpenSpec 層，本 skill 處理 Vault 層；可順序執行（先 doc-audit → 再 vault-audit）|

---

## 七、Anti-Pattern（禁止行為）

- ❌ **跑於 ERP_Vault 以外的目錄**（範圍嚴格限制）
- ❌ **未產出對話報告，只追加 audit-log**（Miles 看不到）
- ❌ **修復模式未經 Miles 確認直接動檔**
- ❌ **誇大判定**（OK 報成 Warning，導致信號疲勞）
- ❌ **跳過維度卻不標註原因**（透明性）

---

## 八、輸出範例

對話報告範例：

```markdown
# Vault Audit 報告（2026-05-19 15:30）

## 摘要
- 模式：全量
- 總體狀態：Warning（2 個維度 Error，5 個 Warning，3 個 OK）
- 維度通過：3 / 10

## 維度結果

### 維度 1 頁面間矛盾：OK ✓
0 筆矛盾。

### 維度 2 過時宣稱：Warning
3 卡 last-reviewed > 90 天：
- `04-business-logic/報價邏輯.md`（last-reviewed: 2026-02-01）
- ...

### 維度 6 規則遵守：OK ✓
0 inline `[!question]`（Phase D 後保持）

### 維度 8 OQ 健康度：Error
4 OQ 缺 expected-resolution-at：XM-002 / XM-003 / PI-001 / PI-002
2 OQ raised-at > 30 天無進度：SHP-005 / PT-001

### 維度 9 角色 alignment：Error
11 角色仍標「OpenSpec 缺漏」，無對應 user-roles spec change 補建
建議跑 `vault-insight` 提煉「角色補建」系統性議題

...

## 主要發現
1. **角色 alignment 11 角色長期未補**（已建議 vault-insight）
2. **6 OQ 缺解答時程**（影響跨主題分析）
3. **3 卡需 review 更新**

## 建議下一步
- 跑 `vault-insight` 識別「角色補建」系統性議題
- Miles 補 6 個 OQ 的 expected-resolution-at
- review 3 卡並更新 last-reviewed
```

---

## 九、frontmatter 範本（供 stub 自動建檔用）

當 mode C 修復「缺失連結」時，建議的 stub 卡格式：

```yaml
---
type: <推斷類型>
module: [<推斷模組>]
status: draft
last-reviewed: <今日>
audit-stub: true  # 標記由 audit 自動建檔
---

# <檔名 = 標題>

> [!info] Stub 卡
> 本卡由 vault-audit mode C 於 <YYYY-MM-DD> 自動建立。內容待補。
> 觸發來源：<哪個卡的 dangling link>

## 待補內容

- 描述
- 涉及範圍
- 來源
```
