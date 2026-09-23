---
name: linear-delivery
description: >
  把已定案的規格交付到 Linear（巢狀：project 薄目錄 + milestone 需求主題 + Feature 票 + Task 票），依規範檔撰寫、交付前由獨立評分者依規範檔評分，達合格分數才發布。對開發而言 Linear 為交付正本、wiki 為欄位與狀態正本、Prototype 為介面與互動正本；OpenSpec 為 PM 內部工作版本不外露。
  觸發：Miles 說「交付到 Linear」「發布給開發」「把 X 模組交付給開發」「調整 Linear 上的 project / issue」「依評分稽核交付文件」。
  不適用：Vault 整體健康稽核（用 vault-audit）、規劃前 know-how 稽核（用 erp-planning-pre-check）。
  寫法規則、評分維度與門檻值見 references/規範 - Linear 交付.md。
---

# Linear 交付與評分稽核（linear-delivery）

把已定案的規格交付到 Linear，讓開發團隊拿到可動工的需求。交付前由與撰寫者分離的評分者把關品質。

## 檔案分工

| 檔案 | 內容 | 誰讀 |
|------|------|------|
| 本檔 | 流程：步驟、誰評分、何時停、Linear 操作注意事項 | 主對話 |
| `references/規範 - Linear 交付.md` | 寫法規則（帶短名）、評分維度、門檻值 | 撰寫者、評分者 |
| `references/範本 - Linear 交付.md` | 段落骨架與占位，不放規則 | 撰寫者 |
| `references/範例 - Linear 交付.md` | 依規範評分達合格分數的真實交付 | 撰寫者、評分者 |
| `references/blocked-cases-log.md` | 評分失分案例的只追加紀錄，規範演化的原料 | 主對話 |
| `references/CHANGELOG.md` | 規範、範本、範例的版本紀錄 | 不在交付時載入 |

本檔提到的門檻值（合格分數、輪數、驗收條數）只寫在規範檔「門檻值」段，本檔只引用。

## 交付目標宣告

每次交付前，先把任務寫成下列宣告，替換 `<...>` 占位。

```text
# /goal：交付「<模組名>」到 Linear（project <project-id>）

## Outcome
<模組> 的 project 描述、milestone、Feature 票、Task 票〔狀態密集模組另含狀態機圖〕齊備，依規範檔評分達合格分數。撰寫者不自判完成。

## Verification
評分 sub-agent 依規範檔評分維度逐維度給分，每個維度引用草稿位置作為證據。

## Constraint
- 依規範檔、範本、範例撰寫；不以其他既有 issue 當對照。
- 只改本次交付的 project 描述與指定 issue 描述。既有票不動 estimate、assignee、cycle、priority、milestone、labels；新開票依規範設 milestone 與 Label。
- <本次特有限制>

## Iteration Policy
依本檔「評分循環」與規範檔門檻值。

## Error Handling
- 規格來源未定義 → 觸發 oq-manage mode B，交付文件標「另案處理」。
- 達停止條件 → 停下回報 Miles：已試什麼、卡在哪、需要什麼。
```

## 工作流程

| 步驟 | 動作 | 執行者 |
|------|------|-------|
| 1 | 抓已定案規格 | 主對話 |
| 2 | 依規範、範本、範例產出交付草稿 | 主對話（或派撰寫 sub-agent） |
| 3 | 撰寫者自審 | 撰寫者 |
| 4 | 評分 | 評分 sub-agent |
| 5 | 評分循環：未達合格就修正後重評 | 主對話與評分 sub-agent |
| 6 | 達合格才寫入 Linear，回報每個容器的網址 | 主對話 |

### 步驟 1：抓已定案規格

- 讀對應模組的 OpenSpec spec（Purpose、Requirements、轉換規則 Scenario）與 wiki 狀態機卡（`06-state-machines/`）。欄位不進交付內容（依「不寫欄位表」）。
- 用 `list_projects`、`list_issues` 確認目標 project 與 issue 的既有欄位，避免覆蓋。
- 迭代交付只反映 `openspec/changes/archive/` 內的 change；未 archive 的 change 不交付。
- 核心邏輯與狀態機變動投中台 project；業務平台是視圖層，只沿用。
- 開新 project 前確認該平台真有對應模組；平台上沒有的模組，內容以情境擴充段併入該平台既有 project。
- 每條要寫進 Feature 票的規則，先標出它的 wiki 正本卡與領域標籤，判斷是否為沿用規則（依「沿用規則不寫」）。

### 步驟 2：產出交付草稿

- 撰寫前讀規範檔、範本檔、範例檔，以及 `/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`（受控句法）與 `/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`（非商業術語對照）。
- 草稿由 sub-agent 代寫時，任務書附上述檔案的路徑。
- 不拿其他需求或 issue 的內容當對照。實例會被修改或刪除，對照即失效。
- 既有票改寫成現行結構，或整個 project 重整時，照下列順序，順序不可顛倒：

| 順序 | 動作 |
|------|------|
| 1 | 先不寫 Task 票。把每張 Feature 票切成單一主線的功能節；節名有「與」或頓號時，檢查是否兩條主線 |
| 2 | 列出全部規則短名表：一條規則只在一節，一個短名只指一處 |
| 3 | 依短名表寫 Task 票的實作契約 |

跳過這個順序直接搬舊段落，Task 票會整段複寫規則本體、短名對不到父票，評分反覆失分。

### 步驟 3：撰寫者自審

撰寫者依規範檔評分維度表逐維度自查，修掉明顯違規。結構性交付缺結構件者不得送評分。

### 步驟 4：評分

- 派 sub-agent 當評分者，模型用 Opus、effort high。撰寫者與評分者必須分離。
- 餵給評分者：完整草稿、規範檔、範例檔。要求依規範檔「評分輸出格式」輸出。
- 評分只看規範符合性，不重新審查上游設計（依規範檔「評分範圍」）。
- 是否可免派評分者，依規範檔門檻值「免派評分者」。

### 步驟 5：評分循環

| 階段 | 評分者 | 判不判停 |
|------|-------|---------|
| 換人評分輪 | 每輪換新評分者，擴大覆蓋 | 不判停 |
| 續評輪 | 同一位評分者續評，讓失分收斂為上輪修正的連帶效應 | 依規範檔「停止條件」 |
| 任何輪次 | — | 達規範檔「輪數安全上限」即停 |

輪數與停止條件的值見規範檔門檻值。

- 每輪重評都餵完整的修正後草稿，不暗示改了什麼、上輪哪個維度被扣。
- 不以撰寫者自審代替重評，未重評不得寫入。
- 每輪記錄：第幾輪、改了什麼、哪些維度失分、下一步。
- 未滿分的維度追加到 `references/blocked-cases-log.md`，不論最終是否達標。
- 不為了收斂而放水、降標或表面改字。修正必須是真實修正。
- 規格缺口無法不捏造時，觸發 `oq-manage` mode B，交付文件標「另案處理」。這屬合法缺口，不扣分。

### 步驟 6：寫入 Linear

達合格分數才寫入。依下方「Linear 操作注意事項」寫入，回報每個容器的網址，並請 Miles 確認狀態機圖渲染。

開票順序：

| 順序 | 動作 | 注意 |
|------|------|------|
| 1 | 建 milestone | 名稱依「Milestone 名寫需求主題」 |
| 2 | 開全部 Feature 票 | PM team 建立、不轉隊；掛 milestone 與 Label；取得識別碼 |
| 3 | 覆寫 project 描述 | 把 Feature 票識別碼與範圍句填進 Scope |
| 4 | 依阻擋順序開 Task 票 | PM team 建立，再轉入 FE 或 BE team，以 parentId 掛回 Feature 票 |
| 5 | 建 blocking 關係 | 建在 Task 層，Feature 票不掛 blocked by |
| 6 | 回填原生提及 | project 描述的 Scope 清單在各票建立後回填識別碼 |

## Linear 操作注意事項

| 主題 | 注意事項 |
|------|---------|
| 新 issue 先開在 PM team 再轉隊 | PM team 掛有「同步建立 GitHub backlog issue」自動化；直接開在 FE、BE team 不會產生同步票。流程：`save_issue` 帶 `team: "PM"` 建立，再帶 `id` 與目標 team 轉移。識別碼會換新，GitHub 附件保留 |
| 轉隊會靜默解除 project 關聯 | 目標 team 不在 project 的 teams 清單時，轉隊會拿掉 project 關聯且不報錯。開票前先 `save_project` 帶 `addTeams` 把 FE、BE 加進 project；轉隊後逐票驗回傳的 `projectId` 非空 |
| save_project 觸發狀態跳轉 | 更新 project 描述時，Linear 自動化會把狀態帶到「Kick off」。`save_project` 同時帶交付前的原狀態抑制 |
| 既有票只傳描述 | 覆寫既有票時 `save_issue` 只傳 `id` 與 `description`，其他欄位不傳即不動。例外：Project 全域規劃 milestone、補齊標題前綴與 Label 時可傳 |
| 設 parent 用 UUID | `parentId` 傳識別碼可能不生效，傳 UUID 才穩定。寫入後逐票驗 `parentId` |
| 原生提及的寫法 | 依規範「引用 Linear 資源用原生提及」。issue 寫純識別碼即可，不必先查 UUID；猜錯 UUID 會被降級成純連結 |
| 長內容整份重傳 | `save_issue` 的 `patch` 對中文 `old_string` 常回「not found」。只插一段用 `insert_before`；改多處時重傳完整 `description` |
| save_project 描述是整段覆寫 | 更新某段時重傳完整描述，避免回退既有內容 |
| 進行中的 issue 不覆寫 | 已有內容且 In Progress 的 issue 不覆寫，只由 project 描述引用 |

## 規範演化

交付出現新型錯誤、或要調整評分維度時，依下列順序處理：

| 順序 | 動作 |
|------|------|
| 1 | 把 Miles 或評分者皺眉的具體原因記進 `references/blocked-cases-log.md` |
| 2 | 歸類到規範檔既有章節；真的放不進既有章節才新增章節 |
| 3 | 寫成帶短名的具體規則，附反例 |
| 4 | 門檻值只改規範檔「門檻值」段 |
| 5 | 用改好的規範檔重評範例檔；範例未達合格分數，就先更新範例 |
| 6 | 在 `references/CHANGELOG.md` 追加版本與理由 |

規範、範本、範例同一次 commit 更新。
