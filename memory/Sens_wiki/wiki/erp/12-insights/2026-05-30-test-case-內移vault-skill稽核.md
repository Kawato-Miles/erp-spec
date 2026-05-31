---
type: insight
module:
  - cross-module
status: resolved
priority: medium
raised-at: 2026-05-30
resolved-at: 2026-06-01
raised-by: erp-test-case 稽核 workflow + plan 探索（Miles 指示留存）
triggered-by: manual
related-vault:
  - "[[wiki-schema]]"
  - "[[sync-workflow]]"
  - "[[scope-boundary]]"
  - "[[business-logic-writing-guide]]"
  - "[[wiki/erp/13-user-stories/README]]"
related-oq:
  - BI-12
  - BI-13
expected-action-at:
---

# 2026-05-30：test-case 管理內移 Vault — skill 稽核與內移路徑

## 背景

稽核 `erp-test-case` skill 是否過時，揭露核心轉折：test case 的管理正本應從 Notion 移進 Vault（Obsidian），Notion 降為對外發布版，比照已內移的 [[wiki/erp/13-user-stories/README|User Story]]。

稽核 workflow 原判「test case 留 Notion 屬刻意設計」，但 Miles 當場推翻並定方向：「User story / Test Case 的管理都會在 Obsidian，Notion 是往外發布的內容」。Miles 決定先自行調整 Obsidian 架構，再由 Claude 接續修 skill；本卡留存調研供接續。

## 觀察

### 1. erp-test-case skill 稽核判定：partially_outdated（部分過時，不必停用）

核心 6 步流程設計仍有效（Step 2 已正確改為讀 OpenSpec spec、跟上規格正本內移）。問題集中三類：

- **A 文字自相矛盾（會誤導執行者讀錯來源）**：frontmatter description（SKILL.md L7-8）+ 工作流程進度清單（L39）仍寫舊版「讀取 BRD 與 User Story」，但內文 Step 2（L69、L79）已改為「讀 OpenSpec spec、明令不讀 Notion BRD」，方向相反。
- **B 追溯鏈斷掉**：User Story 2026-05-21 已遷 Vault，但 Step 2 必讀清單（L71-78）漏掉 Vault 13-user-stories。導致 `erp-user-story` ↔ `erp-test-case` 設計好的「成功條件 ↔ 測試案例」雙向追溯形同虛設（實證：40+ 張 user story 卡 `related-test-cases` 全空）。
- **C 死交棒（不影響運作）**：已停用的 `erp-spec` skill（L150）仍掛「Spec 完成後觸發 erp-test-case 建 TC」，該觸發已死，但本體真正上游已轉為自讀 spec，不靠 erp-spec。

### 2. 引用關係（grep 全 repo）

- **唯一活躍 skill 依賴 → `erp-user-story`**：下游交棒（acceptance criteria 是 TC 取材來源）+ 雙向連結（`related-test-cases`）+ 職責邊界。
- **唯一死鏈 → `erp-spec`**（已停用）。
- Vault 多處 cross-reference（07-scenarios README、付款發票兩卡、business-logic-writing-guide、erp-planning-audit-framework、wiki-schema lint）皆有效，屬「情境/故事素材 → test case」交棒指引或職責邊界規則。
- CLAUDE.md 對 test case 僅純索引；ERP 討論主動路由表未路由到 erp-test-case（靠「寫 test case」關鍵字觸發）。

### 3. 內移技術路徑（探索成果，可直接接續）

- **落點**：Vault 最大編號 14，**15 空號可用** → 建議新增 `15-test-cases/<module>/`。
- **範本可平移**：`erp-user-story` 的「三層定位（Vault 正本 / OpenSpec spec § Scenarios / Notion 發布版，單向禁反向覆寫）+ 三模式（A 新增 / B 補層 / C 推送）+ Mode C 推送機制（query → 唯一鍵配對 → update/create → 禁重複 → 回填 notion-published-at/notion-page-url）+ frontmatter schema + 目錄按 module 分 + MODULE 前綴表 + lint grep + _template 自檢」整套可平移。
- **wiki-schema 要動 4-5 處**：§ 一 type↔目錄表加列 test-case / § 四 加 `type=test-case` frontmatter 區塊 / § 五 目錄允許 page-type 加列 / § 七 命名規約加 test-case 段 /（配套）§ 六維度 14 內容職責表補一列 test-case 正文邊界。
- **sync-workflow 新增「流程 1-C：Vault → Notion Test Case DB 單向推送」**（目前不存在，照流程 1-B 平移即可）。
- **scope-boundary 補 test case 定位**（目前零命中、灰色地帶）。

### 4. 待改措辭清單（A 類正本定位 9 條 = 改寫主戰場）

| 編號 | 位置 | 現況 |
|---|---|---|
| A-1 | CLAUDE.md:405 ERP 資源表 | test case row 只有 Notion、無 Vault 正本欄 |
| A-2 | CLAUDE.md:376 載入原則表 | **完全沒有 test-case row**（隱性排除在 Vault 正本體系外）|
| A-3 | erp-test-case SKILL.md:8 | description「建立 Test Case（Notion）」|
| A-4 | erp-test-case SKILL.md:41-42 | 進度清單 Step 4/5 直接寫 Notion |
| A-5 | erp-test-case SKILL.md:99,118 | 章節標題層 Step 4/5 直接寫 Notion |
| A-6 | erp-test-case SKILL.md:79 | 「Notion=發布版」概念僅套用在 BRD |
| A-7 | business-logic-writing-guide.md:142 | **憲法級源頭句「Vault 不放 test-case 正文」**（改寫起點）|
| A-8 | wiki-schema.md:216 | `related-test-cases` 值定為「Notion URL」|
| A-9 | erp-planning-audit-framework.md:155 | 四層追溯 Test Case row 標 Notion |

- B 類（純 URL 索引，保留 URL、定位語改發布版）8 條；C 類（交棒指引，含「推送 Notion」字樣需改括號描述）4 條（C-1/C-2/C-3/C-10）。

### 5. 兩個坑（接續時必處理）

- **Scenario DB URL 重疊**：Test Scenario 分組用的 Notion DB（`…b37b9e05`）與「業務情境 spec 發布版」是**同一個 DB**（CLAUDE.md:400 / notion-index.md:30）。內移正好脫鉤釐清。
- **維度 14 配套缺口**：新增 test-case 卡型 MUST 同步補維度 14 正文職責邊界，否則 test-case 卡落入「無邊界 → 任何卡可混入別型內容不被抓」的同一缺口（audit-failure-patterns.md:138 根因）。

## 推論

test case 內移是 User Story 內移（2026-05-21）的**對稱延伸**，root 是「ERP 知識管理正本統一進 Vault、Notion 一律降對外發布版」的一致性收斂。User Story 已完成、test case 是最後一塊；完成後「business-logic / scenario → user story → test case」四層追溯全部落在 Vault 內、可用 `[[ ]]` 串接。

priority 標 medium（非 high）理由：Miles 主動推遲（先調架構）、不阻塞當前 Prototype 開發、屬知識管理一致性治理而非功能交付。

## 下一步建議

**觸發點 = Miles 完成 Obsidian 架構調整後**（事件觸發，非日期）。屆時接續：

### 待 Miles 拍板的 3 個設計決策（已備選項）

1. **Test Scenario 分組層**：(a) 目錄+frontmatter 欄位取代〔建議〕 / (b) Scenario 也做 Vault 卡 / (c) 留 Notion。
2. **兩階段**：(a) 不分階段、單卡〔建議〕 / (b) 分驗收意圖穩定層 + 操作步驟易變層。
3. **related-test-cases 反向連結**：(a) 改 Vault wiki link〔建議〕，既有空欄併 BI-12/BI-13 漸進 backfill / (b) 維持 Notion URL / (c) 雙寫。

### 接續執行清單（拍板後）

- 負責人：Claude 執行、Miles 拍板
- 動作：新增 `15-test-cases/`（_template + README）→ 改 wiki-schema 4-5 處 → 新增 sync-workflow 流程 1-C → 補 scope-boundary → 重寫 erp-test-case SKILL.md（三模式 + Step 2 補 Vault user story + Step 6 補回填 related-test-cases）→ 改 A 類 9 條 + B/C 措辭 → 補維度 14 test-case 邊界。
- 驗證：vault-audit 跑過、grep 確認 A-7 等憲法句已翻轉、erp-test-case description 與內文一致、新 test-case 卡可被 user story `[[ ]]` 連回。

### 低優先收尾（與內移無關，可獨立做）

- 已停用的 `erp-spec/SKILL.md:150` 死交棒加註說明。

## 涉及

- `.claude/skills/erp-test-case/SKILL.md`（稽核對象）
- `.claude/skills/erp-user-story/SKILL.md`（內移範本）
- [[wiki-schema]]（§ 一/四/五/七 + 維度 14）
- [[sync-workflow]]（新增流程 1-C）
- [[scope-boundary]]（補 test case 定位）
- [[business-logic-writing-guide]]（L142 憲法句）
- OQ BI-12 / BI-13（related-test-cases backfill / 反向配對缺失）

## 後續更新

<!-- status 變化時追加；Miles 完成 Obsidian 架構調整後接續修 skill -->

### 2026-06-01：resolved（架構與原建議不同）

Miles 完成 Obsidian 架構調整（5/31 建 `15-test-cases/` + `_template-test-case` + wiki-schema test-case schema），本日接續執行：

- **關鍵差異**：原 insight 建議「test-case 正文內移 vault」，Miles 5/31 定案改為 **Vault 只放索引卡（frontmatter + happy/edge 索引 + 依據鏈），正文仍存 Notion**。故 A-7「憲法句 Vault 不放 test-case 正文」**不翻轉**（維持正確），insight 該項作廢。
- **已完成**：`erp-test-case` skill 重寫對齊（三模式 + Step 2 讀 Vault user-story + 回填 related-test-cases wiki link）；3 決策採建議預設（Test Scenario 分組用目錄+卡內 happy/edge / TC 單階段 / related-test-cases 改 Vault wiki link）；連帶 user-story 單階段化（移除兩階段，UI 下移 test-case + Prototype e2e）。
- **未竟（漸進）**：16 張抽出的 UI 內容（[[_migration-ui-from-userstory]]）seed 成 TC 卡 + Notion 正文；既有 user-story `related-test-cases` 空欄回填（併 [[BI-12]] / [[BI-13]]）；sync-workflow 流程 1-C 與 scope-boundary test-case 定位補述（skill Mode C 已涵蓋推送機制）。
