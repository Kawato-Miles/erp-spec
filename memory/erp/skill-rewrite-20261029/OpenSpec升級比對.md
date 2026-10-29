# OpenSpec 升級比對（批次 0.5，2026-10-29）

結論：CLI 已升到 1.15.0，22 個 opsx 指令與 openspec-* skill 已重新產生。自訂 schema 仍可載入，proposal、design、specs、tasks 的規則照常注入。驗證變嚴，未通過由 1 筆增為 4 筆。下列待裁決事項未處理，交回主對話。

依 D15：不改 `openspec/config.yaml` 與 `openspec/schemas/sens-spec-driven/` 的內容。

## 一、升級做了什麼

| 步驟 | 做法 | 結果 |
|---|---|---|
| 升級 CLI | 以 homebrew 的 npm 全域安裝 `@fission-ai/openspec@1.15.0` | `/opt/homebrew/bin/openspec --version` 回 1.15.0。本機只剩這一份 |
| 重新產生 | 工作樹執行 `openspec update`（先跑 `--dry-run` 確認範圍） | 只改 22 檔：`.claude/commands/opsx/` 11 檔、`.claude/skills/openspec-*/SKILL.md` 11 檔。config.yaml 與自訂 schema 零差異 |
| 驗證 | 升級前後各跑 `openspec validate --all --no-interactive` | 見 § 三 |

過程中的意外：第一次用預設 npm 安裝，裝進 fnm 的 Node 目錄，homebrew 目錄的 1.4.1 沒被取代。已移除 fnm 那份、改裝 homebrew 那份。

## 二、重新產生的 skill 與指令差異

被覆蓋的檔案在上一版（提交 4d916a8）已無 Sens 自訂內容。差異裡被刪除的行沒有任何中文行，所以這次重新產生沒有丟掉 Sens 的修改。

| 差異類別 | 內容 | 對 Sens 流程的影響 |
|---|---|---|
| frontmatter | 加 `allowed-tools: Bash(openspec:*)`；description 加「使用者說 openspec X 或 opsx X 時也觸發」 | 觸發詞變多，批次 1 觸發評測以此版為基線 |
| 新段落 | 「Store selection」與「Project check」：先查 `openspec list --json` 的 root，沒有 root 就不寫檔 | 無影響。本 repo 有 `openspec/` |
| continue | 改為「`instruction` 欄位是權威指引」；刪掉寫死的 spec-driven 順序（proposal → specs → design → tasks） | 有利。sens-spec-driven 的順序是 proposal → design → specs → tasks，舊版文字與它衝突 |
| continue | 選 change 的規則由「一律請使用者選」改為「能推斷就自動選，並宣告用哪個」 | 行為改變，影響小 |
| continue | 開工前先補完寫到一半的 specs 檔；依賴檔每次重讀磁碟 | 有利 |
| archive、bulk-archive、sync | 路徑改由 status JSON 的 `planningHome`、`artifactPaths` 決定；不支援工作區規劃模式時停下 | 無影響 |
| 全部 | 改用中性措辭「Ask the user」，不再指名 AskUserQuestion 工具 | 無影響 |

歷史缺口（不是本次造成）：提交 3909185 曾在 archive skill 加「OQ 收尾檢查」步驟，提交 4d916a8 重新產生時已被覆蓋。現在 archive 的 OQ 收尾只剩 config.yaml 的 `rules.archive`，而這段 CLI 不讀（見 § 四 待裁決 1）。

## 三、驗證結果前後

| 項目 | 1.4.1 | 1.15.0 |
|---|---|---|
| 通過／未通過 | 30／1 | 27／4 |
| 錯誤（ERROR） | 1 筆 | 10 筆 |
| 警告（WARNING） | 0 筆 | 196 筆 |

新增未通過的 change：

| change | 新規則 | 錯誤筆數 |
|---|---|---|
| officer-files-to-print-item | 修改（MODIFIED）的需求區塊少了主 spec 現有的情境，封存時會拒絕 | 1 |
| print-item-copy-rule | 同上 | 3 |
| quote-estimate-by-sales | 同上 | 5 |
| add-consultation-activity-log | 沒有任何規格差異檔（兩版都未通過；1.15.0 提示可設 `skip_specs: true`） | 1 |

警告的組成：

| 警告 | 筆數 | 落在哪 |
|---|---|---|
| 需求描述超過 500 字元 | 192 | 主 spec 18 份、change 4 份；最多 order-management 30、work-order 28、shipment 19 |
| Purpose 段仍是封存時自動產生的佔位文字 | 4 | consultation-request、document-access、download-center、prepress-review |

## 四、待裁決

| 編號 | 問題 | 事實 | 選項 |
|---|---|---|---|
| 1 | config.yaml 的 `rules.explore`、`rules.apply`、`rules.verify`、`rules.archive` 共 19 條，CLI 不讀 | `openspec instructions` 對這四個鍵印「Unknown artifact ID in rules」。1.4.1 原始碼有同一段檢查，所以升級前也沒被讀。proposal 7、design 7、specs 16、tasks 6 條照常注入 | A：apply 4 條、archive 9 條搬到 1.15.0 新增的 `operations.apply.guidance`、`operations.archive.guidance`；explore 3 條、verify 3 條沒有對應欄位，改寫進 skill 或刪除。B：維持現狀，承認這 19 條只是給人看的註記 |
| 2 | 三個進行中的 change 封存會被擋 | 修改區塊必須含主 spec 現有的全部情境。刻意刪情境要改用其他寫法 | 封存前逐一補回或改寫；屬 spec 內容修正，排進 specs 重構或各 change 封存前處理 |
| 3 | 自訂 schema 落後內建 schema | 內建 spec-driven 由 153 行增為 272 行。新增：零差異 change 用 `skip_specs`、需求描述 500 字元上限、新能力要寫 Purpose 段、specs 逐檔寫、design 的未決問題不可影響規格、tasks 每項附驗證方式。sens-spec-driven 從 1.4.1 版分支，這些都沒有 | A：比照 1.15.0 內建版重新分支，再補回 Sens 的 Priority、Rationale、情境標註。B：維持現狀，等 specs 重構時一起處理 |
| 4 | 自訂設定檔（profile）少一個核心流程 `update` | `openspec update` 提示「custom profile is missing 1 core workflow: update」 | A：執行 `openspec config profile` 加入。B：不加 |
| 5 | 需求描述 500 字元警告 192 筆 | 只是警告，不擋驗證 | 交給 specs 重構計畫（§ 7-3），本計畫不處理 |

## 五、Schema 格式比對（1.4.1 → 1.15.0）

| 項目 | 變化 | sens-spec-driven 是否受影響 |
|---|---|---|
| artifact 的 `generates`、`template`、apply 的 `tracks` | 必須是相對路徑，不可含 `..` 或絕對路徑 | 不受影響，全部是相對路徑 |
| artifacts 數量 | 上限 1000 | 不受影響 |
| 其他欄位（id、description、instruction、requires、apply.requires） | 不變 | 不受影響 |
| config.yaml 新欄位 | `operations`（apply、archive 的建議指引）、`store`、`githubCopilot`、`references` | 未使用；見待裁決 1 |
| 範本機制 | 仍由 schema 的 `template` 指向 templates/ 下的檔案 | `openspec templates --schema sens-spec-driven` 正確列出 proposal、design、specs、tasks 四個範本 |
