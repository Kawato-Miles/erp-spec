---
name: vault-insight
description: >
  ERP_Vault insight 提煉 skill。對累積的 Vault 內容做跨主題模式識別，產出帶具體「下一步建議」的 insight 卡，寫入 `memory/Sens_wiki/wiki/erp/12-insights/<YYYY-MM-DD>-<主題>.md`。
  觸發時機：
    1. Miles 說「跑 insight」「精練 insight」「找下一步」「找系統性議題」
    2. `08-open-questions/` 達 15 個 open OQ 時（建議 Miles 跑）
    3. Phase 切換 / change archive 後（建議 Miles 跑）
    4. `vault-audit` 發現 ≥ 5 個 error 時（自動建議）
  **強制規則**（Anti-Pattern 防護）：
    1. 禁空洞讚美（「Vault 結構良好」「資料完整」等無 actionable 內容）
    2. 禁無下一步（每個 insight MUST 帶具體 action，含負責人與時程）
    3. 禁無 source（每個 insight MUST 指向具體卡 / OQ / spec / commit）
    4. 禁重複（跑前 MUST 讀 audit-log，避免報相同議題）
    5. **禁讀 status=raw 的 raw 卡**（只讀 status=ingested 或 reviewed）— 防 self-amplification（對應 vault-ingest 防線 4）
  範圍：**只處理 ERP_Vault 內容**，不涉及 Prototype / 程式碼 / 對外發布。
  不適用：日常對話回應、單一卡片內容問題、純技術稽核（用 vault-audit）。
---

# vault-insight

ERP_Vault 跨主題模式識別與下一步提煉工具。

---

## 一、定位與範圍

**目標**：對 Vault 累積內容做「**從觀察到推論到下一步**」的提煉，產出可 actionable 的 insight 卡。

**對標**：Karpathy LLM Wiki 模式的 Query 操作（有價值的合成回存為新頁面）+ Sens 特化的「系統性議題識別」。

**價值定位**：

| 角色 | 沒有 vault-insight 時 | 有 vault-insight 後 |
|------|---------------------|----------------------|
| Miles | 各 OQ 獨立看，難識別「12 個 OQ 中有 4 個是同一根本議題」 | insight 卡明確指出「角色 alignment 是系統性議題，建議一次性處理」 |
| Claude | 每次跑 audit 都從零分析 | 讀 audit-log 累積結論，避免重複勞動 |
| Phase 進度 | Phase 1 / 2 / 3 KPI 對照靠 Miles 手動回顧 | insight 主動識別「哪個 Phase 卡在哪」+「下一步」 |

---

## 二、工作流程（5 步）

### Step 1：讀 audit-log（避免重複）

```bash
cat /Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/00-meta/audit-log.md
```

- 最近 3 筆 audit / insight 紀錄
- 已標記為 in-progress / resolved 的議題不重複
- 已有 insight 卡且 status: open 的不重複，除非有新證據

### Step 2：讀目標素材（依觸發情境）

| 觸發情境 | 必讀素材 |
|---------|---------|
| **手動 / 通用** | `03-roles/_alignment-report.md` + `08-open-questions/` 全部 + `00-meta/audit-log.md` 最近 3 筆 + **`raw/` status=ingested 或 reviewed 卡**（2026-05-21 新增）|
| **OQ 累積** | `08-open-questions/` 全部 + `08-open-questions/README.md` |
| **Phase 切換** | `01-products/phases.md` + `success-metrics.md` + `01-products/kpi/` |
| **change archive 後** | 該 change 的 design.md / proposal.md + Vault 受影響的 `04-business-logic/` / `05-entities/` 卡 |
| **vault-audit 接續** | audit 報告中 Error / Warning 項對應的卡 |
| **raw 同主題累積（vault-audit 維度 11 觸發）** | `raw/` 同主題 status=ingested 或 reviewed 卡 ≥ 3 張（**MUST 過濾 status=raw**，違反 anti-pattern 防線 5）|

**Raw 過濾 Bash**（讀 raw 卡時 MUST 套用）：

```bash
cd /Users/b-f-03-029/Sens/memory/Sens_wiki/raw

# 只列 status=ingested 或 reviewed 的 raw 卡（過濾 raw status 防 self-amplification）
for f in *.md; do
  [[ "$f" == "README.md" || "$f" == "_template.md" ]] && continue
  status=$(grep "^status:" "$f" | head -1 | awk '{print $2}')
  if [[ "$status" == "ingested" || "$status" == "reviewed" ]]; then
    echo "$f"
  fi
done
```

### Step 3：跨主題模式識別

對讀進的素材，找 **patterns（不是逐筆列舉）**：

#### 3.1 OQ 跨模組共通議題

例：12 個 OQ 中 4 個是「角色權責邊界」（XM-002 / XM-003 / ORD-001 / QC-001）→ 系統性議題

**檢查方法**：
1. 對 12 OQ 萃取「核心問題類型」（角色 / 流程 / 欄位定義 / 計算公式 / ...）
2. 同類型聚類，若 ≥ 3 個同類型 → 系統性議題候選

#### 3.2 角色 R&R 落後與 OQ 重複度

例：_alignment-report 標 11 角色 OpenSpec 缺漏，且 4 個 OQ 是角色邊界 → 兩件事其實是同一根因（OpenSpec user-roles spec 不全）

#### 3.3 business-logic 卡間矛盾或冗餘

例：「報價邏輯」與「付款發票邏輯」是否有重複定義「補收」？

#### 3.4 Phase 進度對照 vs 北極星指標

對照 phases.md + success-metrics.md：

| Phase | 北極星指標 | 對應 Vault 內容 | 狀態 |
|-------|-----------|----------------|------|
| Phase 1 | EC 規格品 BOM 覆蓋率 ≥ 80% | `material-master/` / `process-master/` spec | ? |
| Phase 2 | 訂單流程完整完成率 ≥ 80% | 各模組 spec + Prototype | ? |
| Phase 3 | 生產效率優化 | 後驗 epic | 未開始 |

識別「哪些 KPI 沒有對應 Vault / spec 內容支持」。

#### 3.5 變動頻繁卡 vs 穩定卡

例：哪些卡近 30 天被改 ≥ 3 次？這代表設計仍在收斂，相關卡可能需要 review。

```bash
git log --since="30 days ago" --pretty=format: --name-only memory/Sens_wiki/wiki/ | sort | uniq -c | sort -rn | head -10
```

#### 3.6 Raw 跨主題累積（2026-05-21 新增）

> 對應 vault-audit 維度 11 觸發：同主題 raw 累積 ≥ 3 張時，可能浮現「該模組 / 該議題有系統性問題」。

**檢查方法**：
1. 從 vault-audit 維度 11 報告取「同主題累積警示」清單
2. 對該主題的 raw 卡（**MUST 過濾 status=ingested 或 reviewed**）讀內文
3. 識別跨卡共通 pattern

例：本月累積 4 張售後相關 raw（[[raw/2026-05-XX-prototype-dogfood-售後 ticket A]] / [[B]] / [[C]] / [[D]]）→ 推論「售後 ticket 模組仍在 reactive 補丁循環」（可與既有 insight [[../12-insights/2026-05-20-售後ticket-reactive-補丁循環]] 串接）

**寫入 insight 卡時**：frontmatter 加 `related-raw: ["[[raw/...]]"]` 列出來源 raw 卡（追溯性）。

### Step 4：產 insight 卡

**檔名格式**：`12-insights/<YYYY-MM-DD>-<主題 slug>.md`

**範本**：

```markdown
---
type: insight
module:
  - <模組>  # 多選
status: open      # open / in-progress / resolved / cancelled
priority: <high|medium|low>
raised-at: YYYY-MM-DD
raised-by: vault-insight skill
triggered-by: <觸發來源：manual / OQ-累積 / phase-切換 / change-archive / audit>
related-vault:
  - "[[相關卡]]"
related-oq:
  - <OQ-id>
related-raw:                     # 2026-05-21 新增：raw 卡素材來源（MUST 是 status=ingested 或 reviewed 的卡）
  - "[[raw/<檔名>]]"
related-spec: <OpenSpec spec 路徑（若有）>
expected-action-at: YYYY-MM-DD  # 建議完成時程
---

# <YYYY-MM-DD>：<主題標題>

## 背景

<為什麼產這 insight？觸發情境？>

## 觀察

具體事實清單（每筆引用具體卡 / OQ / spec / commit）：

1. **觀察 1**：xxx（[[來源卡]]）
2. **觀察 2**：xxx（[[來源卡]]）
3. ...

## 推論

從觀察推論的 pattern / 系統性議題：

<1-3 段論述，明確指出「這些觀察其實是同一根因」或「這代表 X 現象」>

## 下一步建議

每條 action 含：負責人（建議）+ 時程 + 預期結果 + 對應驗證

1. **Action 1**：[誰] [何時] [做什麼] → [預期結果]
2. **Action 2**：...
3. ...

## 涉及

- [[相關 Vault 卡 1]]
- [[相關 Vault 卡 2]]
- [[OQ-id 1]]
- `openspec/specs/<模組>/spec.md`

## 後續更新

（status 變化時追加）

- YYYY-MM-DD：status → in-progress（已開始執行 Action 1）
- YYYY-MM-DD：status → resolved（已完成）
```

### Step 5：更新 audit-log

追加至 `00-meta/audit-log.md`：

```markdown
## [YYYY-MM-DD HH:MM] insight | <觸發來源>

**輸出**：[[../12-insights/YYYY-MM-DD-主題slug]]

**關鍵推論**：[1-2 句濃縮]

**下一步 actions 數**：N
```

---

## 三、觸發機制詳細

| 觸發類型 | 信號 | 動作 |
|---------|------|------|
| **A 手動** | Miles 說「跑 insight」「精練 insight」「找下一步」「找系統性議題」 | 直接全流程 |
| **B OQ 累積** | `08-open-questions/` 達 15 個 open 時 | **建議**（不自動執行）：「目前累積 15+ open OQ，建議跑 vault-insight 識別系統性議題」 |
| **C Phase 切換** | phases.md 更新 / change archive 影響北極星指標 | **建議**（不自動執行） |
| **D change archive 後** | `/opsx:archive` 完成 | **建議**（不自動執行） |
| **E audit 接續** | vault-audit 發現 ≥ 5 個 Error | **自動建議**：「audit 發現多重 Error，建議跑 vault-insight」 |

**注意**：除手動外的 B/C/D/E 都是「**建議**」，**不主動執行**，避免 noise。

---

## 四、Anti-Pattern 範例

### 反例 1：空洞讚美

```markdown
# 2026-05-19 Vault 健康狀況

Vault 結構良好，資料完整。
12 個 OQ 都有完整 frontmatter，命名規約遵守。
建議繼續維持。
```

**錯在哪**：
- 無 actionable 結論
- 沒指出任何 pattern
- 浪費 Miles 時間

**正例**：略過此 insight 不寫（單純報告由 vault-audit 處理）。

### 反例 2：無下一步

```markdown
# 2026-05-19 角色議題

12 OQ 中有 4 個是角色議題：XM-002 / XM-003 / ORD-001 / QC-001。
這是個趨勢。
```

**錯在哪**：觀察與推論到了，但「下一步該做什麼」缺。

**正例**：補上具體 action：

```markdown
## 下一步建議
1. Miles 與業務 / 印務 / 品管 / 訂單管理人各約 30 分鐘訪談（時程：5/22-5/28）
2. 訪談後開 OpenSpec change `add-missing-roles-to-user-roles-spec`（時程：5/29-5/31）
3. change archive 時解決 XM-002 / XM-003 / ORD-001 / QC-001 四個 OQ
```

### 反例 3：無 source

```markdown
# 2026-05-19 報價邏輯有問題

報價邏輯卡需要重寫。
```

**錯在哪**：沒指向具體卡 / OQ / commit。Miles 無從追溯。

**正例**：

```markdown
## 觀察
1. `04-business-logic/報價邏輯.md` last-reviewed: 2026-02-01（90+ 天）
2. 卡內提到「Phase B 補完整內容」但未實際補
3. 與 `付款發票邏輯.md` 在「補收金額」描述有差異
```

### 反例 4：重複歷史 insight

跑前未讀 audit-log，又寫一次同主題 insight。

**正例**：跑前必讀 audit-log，若已有 open / in-progress insight 同主題，**跳過或補強既有卡**而非新建。

---

## 五、12-insights/ 階層結構

```
12-insights/
├── README.md                              # 入口導覽 + 清單表
├── <YYYY-MM-DD>-<主題slug>.md             # 每個 insight 一檔
└── _archives/                              # 已 resolved 移到此
    └── <YYYY>/
        └── <YYYY-MM-DD>-<主題slug>.md
```

**README.md 結構**：

```markdown
---
type: meta
status: active
last-reviewed: YYYY-MM-DD
---

# Insights 總覽

> 跨主題模式識別與下一步建議。由 `vault-insight` skill 產出。

## 一、Insight 清單（依日期）

| 日期 | 主題 | status | priority | actions 數 | 對應 |
|------|------|--------|----------|------------|------|
| YYYY-MM-DD | <主題> | open | high | 3 | [[YYYY-MM-DD-slug]] |

## 二、Status 統計

- open: X
- in-progress: Y
- resolved: Z

## 三、近期執行
（最近 3-5 個 insight 摘要 + 主要 action）
```

---

## 六、與其他 skill 的協作

| 情境 | 協作 |
|------|------|
| audit 發現多重 error | vault-audit 建議跑 vault-insight |
| OQ 累積 ≥ 15 | 本 skill 主動建議 Miles |
| Phase 切換 | 本 skill 主動建議 Miles |
| change archive 後 | 本 skill 主動建議 Miles |
| OQ 透過 insight 識別為系統性議題 | 將既有 OQ 連結至 insight 卡，OQ frontmatter `related-insight` 標註 |
| insight resolved 後 | 移至 `12-insights/_archives/<YYYY>/`；更新 audit-log |

---

## 七、跑 insight 前的 5 個檢查

執行前 Claude 自我檢查：

- [ ] 已讀 audit-log 最近 3 筆？
- [ ] 已讀目標素材（依觸發情境）？
- [ ] 是否有現有 open / in-progress insight 涵蓋相同主題？
- [ ] 觀察 ≥ 3 條具體事實？
- [ ] 下一步 action 是否具體（誰 / 何時 / 做什麼）？

若任一不符 → 不產出 insight 卡，回報 Miles「跳過原因」。

---

## 八、輸出規範

對話顯示：

```markdown
# vault-insight 執行報告（YYYY-MM-DD HH:MM）

## 觸發來源
<手動 / OQ 累積 / phase 切換 / change archive / audit 接續>

## 讀取素材
- audit-log 最近 3 筆
- <其他素材清單>

## 識別出的 insight
N 個 insight：

### Insight 1：<主題>
- priority: <high|medium|low>
- 對應 action 數：X
- 寫入：[[YYYY-MM-DD-主題slug]]

### Insight 2：...

## 寫入 audit-log
追加 N 筆紀錄。

## 後續建議
- Miles 優先處理 priority high 的 X 個 action
- 預估 Y 週內可完成核心議題
```

---

## 九、不適用的情境

- 單一卡片內容問題（直接編該卡，不必跑 insight）
- 純技術稽核（用 vault-audit）
- 日常對話回應（不必每次都跑）
- Spec 撰寫過程（屬 OpenSpec workflow，不必跑 insight）
- Prototype 程式碼問題（屬 Prototype repo / e2e 測試範疇）

---

## 十、工具使用

| 操作 | 工具 |
|------|------|
| 讀 audit-log / OQ / alignment-report | Read |
| 跨卡 grep | Grep / Bash |
| 看 commit 頻率 | Bash `git log` |
| 寫 insight 卡 | Write |
| 更新 audit-log | Edit（追加） |
| 列出 insight 清單 | Bash `ls 12-insights/` |
