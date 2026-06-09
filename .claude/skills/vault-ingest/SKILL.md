---
name: vault-ingest
description: >
  Raw 素材承接與精練 skill。為 ERP_Vault 提供「未精練素材的承接層 + 精練流程」。
  寫入位置：Vault `memory/Sens_wiki/raw/`（2026-05-21 新增，採 Karpathy LLM Wiki raw 層概念）。
  觸發時機：
    1. Miles 說「存進 raw」「我要記」「先收集」「研究一下 X」「掃 raw」「精練 [檔名]」「ingest 這張」
    2. Claude 在被指派研究任務（如 WebFetch / WebSearch）後完成資料蒐集
    3. Claude 在對話中識別「值得記」的素材（須 Miles 確認後才執行）
    4. 主動收尾：累積 ≥ 10 張 status=raw 時建議 Miles 跑 Mode C
  此 skill 強制執行 Anti-Model-Collapse 紀律：raw 是已驗證素材的歸檔，不是 LLM 自編內容的暫存。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁止 Claude 自迭代（自己讀 vault → 自己編 raw → 下次再讀寫）
    2. `claude-self-capture` 觸發 Mode A MUST 先問 Miles 才寫入
    3. `claude-research` 觸發 Mode A MUST 附真實 raw-source-link（WebFetch URL / 文件來源），無來源不寫
    4. Mode A step 2 若識別「明確未解問題」MUST 改走 oq-manage mode B 不寫 raw
    5. Mode B step 3「提議 cards diff」MUST 等 Miles 確認後才動既有卡，禁止「批准 + 自動套用」
    6. vault-insight skill MUST NOT 讀 status=raw 的卡（只讀 ingested / reviewed），防止 self-amplification
  不適用：已精練的知識更新（直接改既有 vault 卡）、UI 規範（留 DESIGN.md）、明確未解問題（走 oq-manage）。
---

# vault-ingest

ERP_Vault 的 raw 素材承接與精練 skill。對應 Karpathy LLM Wiki 模式的 ingest 操作；同時採 Yu Wenhao 的 Anti-Model-Collapse 紀律。

---

## 一、定位與哲學

### 1.1 為什麼需要

ERP 規劃是持續迭代過程：Prototype 試用、競品研究、Miles 對話中的觀察會源源不絕產生。若直接寫入既有 12 編號目錄，會混入未驗證內容；若不寫，則素材散落各處日後遺失。

raw 承接層解決這個問題：**已驗證但未精練的素材有地方暫存，未來由 Mode B 拆解到既有 vault 卡**。

### 1.2 核心原則（Yu Wenhao）

> 「思考在對話裡發生，歸檔是思考完的結果。」
>
> 「進知識庫的每張卡都是驗證過的。」

對應規則：
- raw 是「**已驗證素材的歸檔**」，不是 LLM 自編內容的暫存
- 每張 raw 卡都應能回答：誰看過、誰確認過、來源是什麼
- vault 不是 LLM 的草稿紙，是 Miles 確認後的成品庫

### 1.3 Karpathy LLM Wiki 三大操作對應

| Karpathy 操作 | Sens 對應 |
|--------------|----------|
| **Ingest（攝入）**| 本 skill 三 mode（A / B / C）|
| **Lint（健檢）**| 既有 `vault-audit` skill（第二階段加維度 11）|
| **Insight 提煉**| 既有 `vault-insight` skill（第二階段加 raw 為素材來源）|

---

## 二、三個操作 Mode

| Mode | 用途 | 觸發 |
|------|------|------|
| **A：寫入 raw** | 把未精練素材歸檔到 raw/ | Miles 主動 / Claude 被指派研究 / Claude 主動建議（須確認） |
| **B：拆解 raw → vault** | 把 raw 卡內容精練後寫入既有 12 編號目錄 / 升級為 OQ / insight | Miles 主動指定卡 / Mode C 後挑卡 |
| **C：批次掃描** | 列出 status=raw 待處理清單 + 同主題累積警示 + 過期警告 | Miles 主動 / 主動收尾累積 ≥ 10 張 raw |

---

## 三、Anti-Model-Collapse 四道防線（強制規約）

| 防線 | 規則 | 為何 |
|------|------|------|
| 1. `claude-self-capture` 須 Miles 確認 | Mode A 中 captured-by=claude-self 時，**MUST 先問 Miles**：「我把這段存 raw 嗎？」Miles 同意才寫入 | 防止 Claude 自己決定什麼值得記，造成噪音氾濫 |
| 2. `claude-research` 須真實來源 | Mode A 中 source=claude-research 時，**MUST 在 raw-source-link 填真實 WebFetch URL / 文件來源**。若研究無對外資料（純內部對話），改用 miles-dialogue source | 防止 Claude 編造看似合理但無出處的「研究結論」 |
| 2b. `miles-upload` 須附原檔 + 出處 | Mode A 中 source=miles-upload 時，**MUST 原檔搬進 `raw/_attachments/<檔名>`** + **MUST 在 frontmatter `attached-files` 列檔名** + **MUST 在 raw-source-link 填原始出處**（Notion URL / Google Drive / 客戶寄件等）。raw 卡內文「原始素材」section 由 Claude 讀檔後摘要重點（不複製貼上全文）並標註「原檔見 [[_attachments/<檔名>]]」 | 防止 Miles 之後刪了原始 Notion 頁就找不回；確保 raw 卡永遠可追溯 |
| 3. Mode B cards diff 須 Miles 批准 | Mode B step 3 「提議 cards diff」**僅是提案**。**禁止「批准 + 自動套用」一鍵流程**，每張卡的更新都要 Miles 看過 cards diff 後說「OK 寫入」才動 | 防止 LLM 在跨卡連鎖更新時過度自由發揮，磨平細節 |
| 4. vault-insight 不讀 raw | `vault-insight` skill 第二階段加 raw 為素材來源時，**MUST 過濾**只讀 `status: ingested` 或 `status: reviewed`，**禁止讀** `status: raw` | 防止未驗證 raw 進入 insight，形成 self-amplification 循環 |

### Anti-Pattern 範例

| Anti-pattern | 為什麼錯 |
|--------------|---------|
| Claude 讀 04-business-logic 既有卡 → 自己編一段「總結」存進 raw | 違反防線 2（無外部來源）；本質是 LLM 自迭代 |
| Mode B 跑完直接寫入既有 6 張卡，Miles 看到時已寫完 | 違反防線 3（無 cards diff 確認） |
| 對話中 Claude 主動建議「我幫你存這段觀察」沒等 Miles 回應就寫了 | 違反防線 1（claude-self-capture 須確認） |
| vault-insight 報告中發現某 raw 卡很有趣，就把它的觀點當 source | 違反防線 4（raw 是未驗證內容） |

---

## 四、Vault 位置與檔名規約

### 4.1 目錄
`/Users/b-f-03-029/Sens/memory/Sens_wiki/raw/`

### 4.2 檔名格式
`<YYYY-MM-DD>-<source-slug>-<主題 slug>.md`

`source-slug` 六值：
- `miles-dialogue`
- `claude-research`
- `claude-self-capture`
- `prototype-dogfood`
- `mes-study`
- `miles-upload`

### 4.3 範例
- `2026-05-21-prototype-dogfood-狀態卡點擊區域64px過小.md`
- `2026-05-21-claude-research-tharstern-rma-flow.md`
- `2026-05-21-miles-dialogue-訂單備註異動歷史未來範疇.md`
- `2026-05-21-mes-study-printavo-客戶自助看單.md`
- `2026-05-21-miles-upload-客戶訪談-富禾印務.md`

### 4.4 附件目錄

`_attachments/` 子目錄專用於存放 source=miles-upload 的原檔（PDF / docx / xlsx / 圖 / 訪談錄音轉文字等）。
- 命名：保留原檔名；若同名衝突在前綴加日期
- 範例：`_attachments/富禾印務訪談2026-05-15.docx`
- 範例：`_attachments/2026-05-21-廠商規格書-XX.pdf`
- 大檔案（> 10 MB）警示：建議考慮 git-lfs 或外部存放（第一版不強制）
- `_attachments/` 內檔案**不需要 frontmatter**

### 4.5 主題 slug 規約
- 用繁體中文（與 vault 其他卡片一致）
- 名詞 / 名詞片語，不用動詞句
- 不用問號 / 驚嘆號（明確問題請走 oq-manage）

---

## 五、Frontmatter Schema（raw 卡）

```yaml
---
type: raw
status: raw                # raw / reviewed / ingested / cancelled
created-at: YYYY-MM-DD
source: <enum 六值>
captured-by: miles | claude-on-task | claude-self
module:
  - <候選模組>             # 或 cross-module
topic-tag:
  - <自由標籤>
related-vault:
  - "[[候選相關卡]]"
raw-source-link: <對話片段 / WebFetch URL / Slack URL / 原始檔出處>
attached-files:            # source=miles-upload 必填；其他可選
  - "_attachments/<檔名>"
ingested-at: YYYY-MM-DD            # status=ingested 時填
ingested-to:                       # status=ingested 時填
  - "[[寫入的既有卡]]"
---
```

**captured-by 與 source 對應**：
- `miles` → 必為 `miles-dialogue` / `prototype-dogfood` / `miles-upload`（Miles 試用回饋或上傳）
- `claude-on-task` → 必為 `claude-research` 或 `mes-study`（被指派研究）
- `claude-self` → 必為 `claude-self-capture`（**須 Miles 確認**）

**`attached-files` 規約**：
- `source=miles-upload` 時**必填**，列出 `_attachments/` 內所有對應原檔
- 其他 source 可選（如 prototype-dogfood 想附 UI 截圖）
- 不需要時整個欄位刪除（YAML 空陣列 `[]` 也可）

---

## 六、進 raw vs 進 OQ vs 進 既有 vault 卡（判斷表）

| 場景 | 該走哪個 | 為什麼 |
|------|---------|--------|
| 「業務離職時 ticket 怎麼接手？」明確未解問題 | **OQ**（oq-manage mode B） | 是個明確問題，不是觀察 |
| 「QuoteListPage 在 64px 行高時，狀態卡點擊區域變小」試用觀察 | **raw**（vault-ingest mode A） | 是已驗證觀察，待精練成 UI 規範或 spec 更新 |
| 「Tharstern 用三階段審批 vs Sens 五階段」競品比較 | **raw**（vault-ingest mode A） | 是研究筆記，待累積成 insight |
| Miles 上傳客戶訪談錄音轉文字 / 廠商規格書 / 設計草稿截圖 | **raw**（vault-ingest mode A，source=miles-upload）| 是已驗證外部素材；原檔搬 `_attachments/` |
| 「訂單備註欄位的字數上限該設多少」設計選擇 | **raw**（vault-ingest mode A）或直接寫入 spec | 若已確定答案 → 寫 spec；若是待商議的設計選擇 → raw |
| 「銷售額同比下降 30%，原因是什麼？」分析任務 | **OQ**（明確問題）或進入 12-insights/（若已分析完） | 不應進 raw |
| 「報價邏輯詳細規則」已確認業務規則 | **04-business-logic 直接寫入** | 已精練的知識，不必經 raw |
| Claude 主動「Miles 剛才那段對話值得記」 | **raw**（vault-ingest mode A，須 Miles 確認） | 對話 highlight，未必形成明確問題 |
| Claude 讀完 vault 想「總結一下」存 raw | **拒絕**（防線 2） | 無外部來源，違反 Anti-Model-Collapse |

**判斷準則**：
- 「能直接回答 What / Why 嗎？」→ 是 → 進 既有 vault 卡
- 「是個明確問題嗎？」→ 是 → OQ
- 「是還沒消化的已驗證觀察 / 反饋 / 研究筆記嗎？」→ 是 → raw
- 「是 LLM 自編無外部來源嗎？」→ 是 → 拒絕（防線 2）

---

## 七、Mode A：寫入 raw

### 7.1 觸發信號

**Miles 主動觸發**：
- 「把這段存進 raw」「我要記下來」「先收集」
- 「研究一下 X」（Claude 跑完研究後自主寫入）
- 「這份檔案存 raw」「把這個 PDF 收進來」「這份訪談存 raw」（Miles 上傳檔案 / 截圖 / 連結時，source=miles-upload）

**Claude 自主觸發**（claude-on-task）：
- 完成 Miles 指派的研究任務（WebFetch / WebSearch）後，自動把結果存 raw（**不必每次問**，但 raw-source-link 必填真實 URL）

**Claude 主動建議**（claude-self-capture）：
- 對話中識別「值得記」的素材（如 Miles 提到「未來範疇但本 change 不做」的觀察）
- **MUST 先問 Miles**：「我把這段存 raw 嗎？理由：[簡述]」
- Miles 同意才執行；不同意則跳過

### 7.2 五步驟流程

```
Step 1：接收 raw 內容
  - 確認 source（五選一）
  - 確認 captured-by（三選一，與 source 對應）
  - 確認主題 slug
  - claude-self-capture：先問 Miles 才繼續

Step 2：分析提取
  - 識別涉及哪些模組（module enum）
  - 識別涉及哪些既有 vault 卡（grep 候選）
  - 判斷是否為「明確未解問題」→ 若是，改走 oq-manage mode B（不寫 raw）
  - 判斷是否與既有 raw 卡主題重複（grep raw/ slug）→ 若是，建議合併

Step 3：寫入 raw 卡（+ 附件搬檔，若 source=miles-upload）
  - **若 source=miles-upload**：
    1. 把原檔搬進 `memory/Sens_wiki/raw/_attachments/<檔名>`
       （若同名衝突在前綴加日期：`<YYYY-MM-DD>-<原檔名>`）
    2. 在 frontmatter `attached-files` 列出檔名（如 `- "_attachments/富禾印務訪談2026-05-15.docx"`）
    3. raw-source-link 填原始出處（Notion URL / Google Drive / 客戶寄件 / Slack 等）
    4. 讀檔內容（Claude 可讀 PDF / docx / 圖等）後在「原始素材」section 寫摘要重點（不複製貼上全文，避免 raw 卡肥大）並標註「原檔見 [[_attachments/<檔名>]]」
  - **其他 source**：
    1. 複製 raw/_template.md
    2. 填 frontmatter（type/status/created-at/source/captured-by/module/topic-tag/related-vault/raw-source-link）
    3. 填「原始素材」section（一字不漏的 raw 內容，不要加自己的解釋）
  - 共通：
    - 填「第一輪初步分析」section（觀察 / 候選相關卡 / 候選 OQ / 候選升級路徑）
    - 「待精練」section 留空（Mode B 會處理）

Step 4：追加 changelog
  追加格式：
  ## [YYYY-MM-DD HH:MM] ingest-A | <source> | <主題簡述>

  **輸入 / 觸發**：[[../raw/<檔名>]]
  **輸出 / 異動**：新增 raw 卡
  **備註**：<可選 — 如「Miles 確認後寫入」「Claude 自主 on-task」>

Step 5：回報「下次精練建議」
  - 不立即 ingest 到既有卡
  - 提示 Miles：「已存 raw。建議在累積 3 條同主題後跑 Mode C 批次掃描，或直接 Mode B 拆解這張」
  - 若識別主題與既有 raw 卡重複：提議「建議合併 [[既有 raw 卡]]」
```

### 7.3 步驟 2 強制分流

**若 raw 內容本質是「明確未解問題」**（用詞如「該怎麼處理 X」「Y 觸發節點是什麼」「Z 是否要 W」），**MUST**：
1. **不寫 raw**
2. 改觸發 oq-manage mode B（含去重）
3. 回報「這是明確問題，已改走 OQ：[[新 OQ 卡]]」

---

## 八、Mode B：拆解 raw → vault

### 8.1 觸發信號

- Miles 主動：「精練 [檔名]」「ingest 這張」「拆解 raw」「把 [檔名] 寫進 vault」
- Mode C 批次掃描後 Miles 挑一張處理
- 累積 ≥ 3 張同主題 raw → Claude 主動建議「建議跑 Mode B 升級為 insight」

### 8.2 六步驟流程

```
Step 1：讀取目標 raw 卡
  - 讀 frontmatter + 原始素材 + 第一輪初步分析
  - 讀「候選相關卡」中列出的既有 vault 卡全文（不是摘要，要全文）

Step 2：對照 scope-boundary 判斷升級路徑
  讀 memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md § 三判斷表，判斷該升級為：
  - business-logic 規則 → 寫 04-business-logic/
  - entity 欄位 / 關聯 → 寫 05-entities/
  - state machine → 寫 06-state-machines/
  - cross-module 情境 → 寫 07-scenarios/
  - 明確未解問題 → OQ（觸發 oq-manage mode B）
  - 3+ 條同主題模式 → insight（觸發 vault-insight）
  - 不該進 Vault（如 UI 規範 / 演算法） → status=cancelled，給理由

Step 3：提議 cards diff
  以下列格式回報給 Miles 看（**未經確認不動檔**）：

  [Mode B 拆解提案 — <raw 卡檔名>]

  建議 1：更新既有卡 [[X]]
    新增 § A — 補充 raw 內 <內容>
    diff 預覽：
      + 第 N 行：<新增內容>
      ~ 第 M 行：<修改前 → 修改後>

  建議 2：新增 OQ [[Y-NNN-Z]]
    觸發 oq-manage mode B 處理

  建議 3：升級為 insight（累積 ≥ 3 同主題）
    觸發 vault-insight

  不適用部分：
    - raw 內提到「希望加 dark mode」→ UI 範疇，不進 Vault（建議轉到 prototype DESIGN.md 不必處理）

Step 4：觸發 oq-manage mode B（若 step 3 識別 OQ 候選）
  - 跑完去重 → 新增 OQ 卡 → 拿到 OQ-id
  - oq-manage 自己會寫 changelog（`oq` 標）

Step 5：觸發 vault-insight（若 step 2 判定累積到 insight 級別）
  - 條件：≥ 3 張同主題 status=raw 或 status=reviewed 的 raw 卡 + Miles 同意
  - 先把這幾張 raw 卡 status 轉 `reviewed`（避免 vault-insight 過濾掉）
  - 觸發 vault-insight skill 產出 insight 卡
  - vault-insight 自己會寫 changelog（`insight` 標）

Step 6：Miles 確認後執行寫入（**這步必須等 Miles 明確說 OK**）
  - 用 Edit 工具更新既有 vault 卡（依 step 3 提案）
  - 更新 raw 卡 frontmatter：
    - status: ingested
    - ingested-at: YYYY-MM-DD
    - ingested-to: [<wiki link 列表>]
  - 在 raw 卡內文末「精練去處」section 填寫 wiki link
  - 追加 changelog：
    ## [YYYY-MM-DD HH:MM] ingest-B | <主題簡述>

    **輸入 / 觸發**：[[../raw/<檔名>]]
    **輸出 / 異動**：[[<更新的既有卡>]] / [[<新 OQ>]] / [[<新 insight>]]
    **備註**：<可選>
```

### 8.3 Step 6 強制守則

- **禁止** Miles 沒明確說 OK 就動既有卡
- 若 Miles 只說「再看看」「等等」 → 把 raw 卡 status 改為 `reviewed`（表示已分析但未確認）
- 若 Miles 說「這個不對 / 重新分析」 → status 保持 raw，重跑 step 2-3

---

## 九、Mode C：批次掃描

### 9.1 觸發信號

- Miles 主動：「看 raw」「掃 raw」「raw 待處理」「batch ingest」
- 主動收尾：累積 ≥ 10 張 status=raw 時 Claude 主動建議
- vault-audit 第二階段維度 11 發現 raw 堆積

### 9.2 步驟（純報告，不寫檔）

```
Step 1：列出所有 status=raw 卡
  bash:
    cd memory/Sens_wiki/raw
    grep -l "^status: raw" *.md

Step 2：按 created-at 排序 + 依 source 分組顯示

Step 3：識別「值得優先處理」的卡
  - 同主題（topic-tag 或檔名主題 slug）累積 ≥ 3 張 → 建議跑 vault-insight
  - status=raw > 30 天 → 建議優先處理或 cancelled
  - status=reviewed > 5 天未確認 → 提醒 Miles 確認

Step 4：產出報告（範例格式）

  [Raw 掃描 — 2026-MM-DD]

  待處理（status=raw）：12 張

  ## miles-dialogue（4 張）
  - 2026-05-21 售後逾期分級邊界（5 天前）
  - 2026-05-18 訂單備註異動歷史未來範疇（8 天前）
  - ...

  ## claude-research（3 張）
  - 2026-05-19 Tharstern RMA flow（5 天前）→ 累積 2 張售後相關 → 建議精練
  - ...

  ## prototype-dogfood（5 張）
  - ...

  處理中（status=reviewed，待 Miles 確認）：2 張
  - 2026-05-15 ... ⚠ 已超過 5 天未確認

  已 ingest（最近 7 天）：8 張
  - ...

  ### 同主題累積警示
  - 「售後流程」主題已累積 4 張（建議跑 Mode B → vault-insight）

  ### 過期警告
  - <檔名> status=raw 已 95 天 → 建議優先處理或 cancelled

Step 5：追加 changelog
  ## [YYYY-MM-DD HH:MM] ingest-C | 批次掃描

  **輸入 / 觸發**：raw/ 全掃
  **輸出 / 異動**：報告（不動檔）
  **備註**：待處理 N 張、處理中 M 張、警示 K 條
```

---

## 十、與既有 skill 銜接

### 10.1 oq-manage

| 銜接點 | 怎麼做 |
|--------|-------|
| Mode A step 2 識別「明確問題」 | 不寫 raw，改觸發 oq-manage mode B（含去重） |
| Mode B step 4 識別 OQ 候選 | 觸發 oq-manage mode B 開 OQ 卡，拿 OQ-id 填回 raw 卡 ingested-to |
| oq-manage 完成後 | oq-manage 自己寫 changelog（`oq` 標）|

### 10.2 vault-insight

| 銜接點 | 怎麼做 |
|--------|-------|
| Mode B step 5 觸發 insight 條件 | ≥ 3 張同主題 raw + Miles 同意 → 先升 raw 卡 status=reviewed → 再觸發 vault-insight |
| vault-insight 第二階段加 raw 為來源 | **MUST 過濾**只讀 status=ingested 或 reviewed，禁止讀 status=raw（防線 4）|
| insight 卡 frontmatter | 加 `related-raw: ["[[<檔名>]]"]` 保留追溯路徑 |

### 10.3 vault-audit

| 銜接點 | 怎麼做 |
|--------|-------|
| 第二階段擴維度 11「raw 健康度」 | 掃 status=raw > 90 天 → Warning；> 180 天 → Error |
| Audit 報告 § 主要發現 | 若 raw status=raw ≥ 10 → 列入「下一步建議」，建議跑 Mode C |
| changelog 寫入 | vault-audit 自己寫（`audit` 標）|

### 10.4 misjudgement-record

**完全不交叉**。誤審記錄不存 raw，raw 不放誤審。誤審 skill 自己寫 changelog（`misjudgement` 標）。

### 10.5 openspec change archive

| 銜接點 | 怎麼做 |
|--------|-------|
| change archive 後 | archive skill 寫 changelog（`change-archive` 標）|
| change 期間累積的 raw 卡 | archive 時提醒 Miles 跑 Mode C 處理積壓 raw |

---

## 十一、CLAUDE.md § ERP 討論主動路由銜接

主 CLAUDE.md § ERP 討論主動路由新增三 row（本 skill 安裝後生效）：

| 討論類型 | 觸發信號 | 主動行動 |
|---------|---------|---------|
| Raw 素材收集 / 研究筆記 | 「存進 raw」「我要記」「研究一下 X」/ Claude 主動識別「值得記」 | 觸發 vault-ingest mode A（claude-self-capture 須 Miles 確認）|
| 批次掃描 raw | 「看 raw」「掃 raw」「raw 待處理」 | 觸發 vault-ingest mode C |
| 精練 raw 卡 | 「精練 [檔名]」「ingest 這張」 | 觸發 vault-ingest mode B |

### 主動收尾原則銜接

§ 主動收尾原則 step 9（新增）：
> 若本次對話累積到 Miles 主動或 Claude 自主可寫入 raw 的素材 ≥ 1 條 → 主動觸發 vault-ingest mode A（claude-self-capture 須 Miles 確認）。若本次對話結束時累積 status=raw ≥ 10 張 → 建議 Miles 跑 Mode C 批次掃描。

---

## 十二、Workflow 範例（end-to-end）

### 範例 A：Miles 在對話中說「這個 prototype 反饋很重要，存下來」

Miles 試用 prototype 後說：「QuoteListPage 在 64px 行高時，狀態卡的點擊區域變得很難按，我要記下來。」

1. Claude 識別觸發信號（「我要記下來」） → 觸發 vault-ingest Mode A
2. **Step 1**：確認 source = `prototype-dogfood`，captured-by = `miles`，主題 = 「狀態卡點擊區域 64px 行高過小」
3. **Step 2**：分析
   - module: `cross-module`（影響所有列表頁）
   - 候選相關卡：`[[列表頁範式B]]` / `prototype-shared-ui spec`
   - **非 OQ**（不是不確定，是已觀察到的缺陷，但需設計決定怎麼修）
   - 既有 raw 卡無同主題（grep 通過）
4. **Step 3**：寫入 `raw/2026-05-21-prototype-dogfood-狀態卡點擊區域64px過小.md`
   - 「原始素材」section：「QuoteListPage 在 64px 行高時，狀態卡的點擊區域變得很難按。」
   - 「第一輪初步分析」：觀察為 UI 觸碰目標尺寸與行高的衝突；候選相關卡列出；候選升級路徑：可能更新 DESIGN.md § 6.1（UI 範疇）或 prototype-shared-ui spec
5. **Step 4**：追加 changelog（`ingest-A`）
6. **Step 5**：回報
   > 「已存 raw。候選升級路徑：可能更新 DESIGN.md § 6.1（UI 範疇）或 prototype-shared-ui spec。建議下次試用再累積 2-3 條 UI 反饋後一起精練。」

### 範例 B：Miles 說「研究一下 Tharstern 的售後處理流程」

Claude 用 WebFetch 抓 Tharstern 文件 + 知識庫，產出研究筆記。

1. Claude 完成研究後識別「這是 claude-research 任務，應自主寫 raw」 → 觸發 vault-ingest Mode A（**不必問**，但 raw-source-link 必填）
2. **Step 1**：source = `claude-research`，captured-by = `claude-on-task`
3. **Step 2**：分析
   - module: `after-sales-ticket`
   - 候選相關卡：`[[售後ticket-reactive-補丁循環]]`（既有 insight）/ `XM-004` OQ
   - 候選升級：可能成為 insight 的 source 之一
4. **Step 3**：寫入 `raw/2026-05-21-claude-research-tharstern-rma-flow.md`
   - 「原始素材」section：含 WebFetch 摘要 + 「來源：https://tharstern.com/...」
   - frontmatter `raw-source-link: https://tharstern.com/...`
5. **Step 4**：追加 changelog（`ingest-A`）
6. **Step 5**：回報
   > 「已存。觀察到 Tharstern RMA 用 3 階段審批 vs Sens 目前 ticket 5 stage。建議連同既有 `[[2026-05-20-售後ticket-reactive-補丁循環]]` insight 一起檢視，但不立即更新該 insight。」

### 範例 C：Claude 在三視角審查中主動建議存 raw

senior-pm + ceo-reviewer + erp-consultant 討論訂單備註 dialog 設計，Miles 提到：「我希望未來訂單管理人能在訂單詳情頁看到備註異動歷史，但這次 change 不做。」

1. Claude 識別「Miles 提了一個未來範疇但本 change 不做」 → 不是 OQ（不是不確定），但值得記 → **主動建議**
2. Claude 回應：「Miles 剛才提的『訂單管理人看備註異動歷史』屬於未來範疇但本 change 不做。我把這段存 raw 嗎？理由：未來重提時有歷史脈絡。」
3. **等 Miles 確認**「好」
4. Mode A 啟動：source = `claude-self-capture`，captured-by = `claude-self`
5. Step 2-5 同範例 A，寫入 `raw/2026-05-21-claude-self-capture-訂單備註異動歷史未來範疇.md`
6. 回報：「已存。未列為 OQ（不屬不確定項，是延後實作的觀察）。下次設計 order-management v1.7 時可主動帶回此 raw 卡。」

### 範例 D：Claude 識別「這該走 OQ 不該走 raw」

Miles 提：「分批出貨的觸發節點該是什麼？是 QC 通過就出嗎還是另有條件？」

1. Claude 識別「明確未解問題」 → **不寫 raw**
2. 改觸發 oq-manage mode B
3. oq-manage 完成去重 + 開 OQ 卡 → 拿到 SHP-NNN
4. 回報：「這是明確問題，已改走 OQ：[[SHP-005-分批出貨觸發節點]]。raw 不新增。」

### 範例 E：批次掃描

Miles 經過一週後說：「掃 raw」

1. 觸發 Mode C
2. Step 1-3：列三狀態清單 + 同主題累積警示 + 過期警告（如範例輸出）
3. Step 4：產出報告
4. Step 5：追加 changelog（`ingest-C`）
5. Miles 看完報告後可指定處理某張 → 觸發 Mode B

### 範例 F：精練單卡

Miles 對某張 raw 卡說：「精練 2026-05-21-prototype-dogfood-狀態卡點擊區域64px過小」

1. 觸發 Mode B
2. **Step 1-3**：讀卡 + 對照 scope-boundary + 提議 cards diff（如「建議更新 prototype-shared-ui spec § 列表頁範式 B；其餘屬 UI 細節不進 vault」）
3. Miles 看 cards diff 後說「OK 寫入」
4. **Step 4**：無 OQ 候選，跳過
5. **Step 5**：無 insight 級別累積，跳過
6. **Step 6**：執行寫入 spec + 更新 raw 卡 status=ingested + 追加 changelog（`ingest-B`）

### 範例 G：Miles 上傳客戶訪談檔案

Miles 把一份 docx 檔丟給 Claude：「這是富禾印務 5/15 訪談錄音轉文字，存 raw。」

1. Claude 識別觸發信號（「存 raw」+ 附帶檔案）→ 觸發 Mode A，source = `miles-upload`，captured-by = `miles`
2. **Step 1**：確認檔名 = `富禾印務訪談2026-05-15.docx`、主題 slug = 「客戶訪談-富禾印務」、raw-source-link = Miles 提供的對話片段（或客戶寄件 URL）
3. **Step 2**：分析
   - module: 暫定 `cross-module`（客戶訪談通常跨多模組）
   - 候選相關卡：grep 既有卡看是否提過富禾 → 無 → 不掛
   - **非 OQ**（是訪談原始資料）
   - 既有 raw 無同主題（grep 通過）
4. **Step 3**：
   - 搬檔：`memory/Sens_wiki/raw/_attachments/富禾印務訪談2026-05-15.docx`
   - 寫 raw 卡 `2026-05-21-miles-upload-客戶訪談-富禾印務.md`
   - frontmatter `attached-files: ["_attachments/富禾印務訪談2026-05-15.docx"]`
   - frontmatter `raw-source-link: <Miles 提供的原始出處>`
   - 讀 docx 內容後在「原始素材」section 寫**摘要重點**（如「富禾提到 3 個主要痛點：…」）並標註「原檔見 [[_attachments/富禾印務訪談2026-05-15.docx]]」
5. **Step 4**：追加 changelog（`ingest-A`，標 source=miles-upload）
6. **Step 5**：回報
   > 「已存。客戶訪談涉及 3 個痛點，建議累積 2-3 場訪談後跑 Mode B 拆解成 [[../01-products/pain-points]] 與對應 [[../04-business-logic]] 卡。原檔保留在 `_attachments/`。」

### 範例 H：Anti-Model-Collapse 試煉（拒絕場景）

Miles 對 Claude 說：「你總結一下既有 vault 的售後流程，然後存進 raw 給我看」

1. Claude 識別：這是「讀 vault → 自己編 → 存 raw」的 self-amplification 流程
2. **拒絕**：
   > 「依 Anti-Model-Collapse 防線 2，claude-research 必須附真實外部 raw-source-link。純粹總結既有 vault 的內容沒有外部來源，等於 LLM 自己編。
   > 
   > 建議替代方案：
   > 1. 若想看售後流程總結 → 我可以直接在對話中產出，不寫 raw
   > 2. 若想做競品比較 → 我可以 WebFetch Tharstern / Printavo 等資料，然後存 raw（含真實 URL）
   > 3. 若想升級為 insight → 直接觸發 vault-insight skill（讀既有 vault 是 insight 該做的事，但不該寫進 raw）」

---

## 十三、Anti-Pattern 提醒（總結）

| Anti-pattern | 違反條款 |
|--------------|---------|
| Claude 自主寫 raw 沒問 Miles | 防線 1 |
| claude-research 寫 raw 沒填 raw-source-link | 防線 2 |
| Mode B 跑完直接寫既有卡沒給 Miles 看 cards diff | 防線 3 |
| vault-insight 讀 status=raw 的卡作為素材 | 防線 4 |
| 把「明確未解問題」存進 raw（該走 OQ） | step 2 強制分流 |
| 把「LLM 自己總結既有 vault 的內容」存進 raw | 防線 2 + 防線 1 |
| Mode A 寫入時主題與既有 raw 卡重複沒建議合併 | step 2 去重檢查遺漏 |
| raw 卡內文用 `> [!question]` callout 標注 OQ | 違反 Vault 整體 anti-pattern（與 oq-manage 共用規則）|

---

## 十四、相關卡

- [[../../memory/Sens_wiki/raw/README|raw/ 入口導覽]]
- [[../../memory/Sens_wiki/raw/_template|raw 卡模板]]
- [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema|Wiki Schema]] § 一 type Enum / § 三 status Enum / § 四 type=raw frontmatter / § 七命名規約
- [[../../memory/Sens_wiki/wiki/erp/00-meta/scope-boundary|Scope Boundary]] § 一 / § 三判斷準則
<!-- vault-charter 已刪除（2026-06-10），內容併入 erp_index -->
- [[../../memory/Sens_wiki/wiki/erp/00-meta/changelog|Audit Log]] — 所有 ingest 操作記錄於此
- `.claude/skills/oq-manage/SKILL.md` — Mode A step 2 分流目的地、Mode B step 4 觸發
- `.claude/skills/vault-audit/SKILL.md` — 第二階段加維度 11
- `.claude/skills/vault-insight/SKILL.md` — 第二階段加 raw 為素材來源（過濾 raw status）
- `.claude/skills/misjudgement-record/SKILL.md` — 完全不交叉（誤審不存 raw）

---

## 十五、版本與升級紀錄

| 版本 | 日期 | 變動 |
|------|------|------|
| v0.1 | 2026-05-21 | 初版（Mode A/B/C + Anti-Model-Collapse 四道防線 + 銜接點 + 七個 workflow 範例） |
| v0.2 | 2026-05-21 | 補強：新增 `miles-upload` source + `_attachments/` 子目錄；frontmatter 加 `attached-files`；防線 2b（miles-upload 須附原檔 + 出處）；判斷表 / 觸發信號 / Mode A step 3 / 範例 G 補入；舊「Anti-Model-Collapse 試煉」順移為範例 H |
