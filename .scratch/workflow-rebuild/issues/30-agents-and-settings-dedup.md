# 30：AGENTS.md 與設定檔去重

Type: task
Status: open
Blocked by: 29

## Question

把不依賴後面決策票的去重提前做（Miles 2026-11-12：環境的設置與去重要提前）。流程怎麼走是票 09 的事，本票不改流程，只去重與消除矛盾。

- `AGENTS.md` 陷阱表 32 列：每列在記憶卡或 skill 都有同義句（票 03）。一個事實只留一個家，其餘刪除或改成引用。
- 票 03 列出的 12 組矛盾（例：模型分工在 5 處數值不一致、後端名稱兩種寫法、分支與 PR 說法三處不一）：並排列給 Miles 裁決，不自行調和。裁決後改到只剩一種說法。
- `AGENTS.md` 與 `docs/agents/domain.md` 引用不存在的 `docs/adr/`；`.gitignore` 註解指向已不存在的 `CLAUDE.md` 與 `tools/superpowers`；`oq-manage/SKILL.md` 引用已改名的路徑。
- 設定檔的過期項目：`.claude/settings.json` 7 項、`~/.claude/settings.json` 6 項過期允許；`.claude/launch.json` 第三筆指向不存在的目錄；`.mcp.json` 的 `figma-desktop` 連不上。
- `.claude/settings.local.json`（不進版控，只在主檢出）裡的提交後自動推送 hook 要不要搬進 `settings.json`：搬了會讓每個工作樹一提交就推自己的分支。列選項給 Miles。
- 票 29 標出「只在記憶卡有、該搬到別處」的做事方法，搬進對應的檔。

明細在 `research/14a-sens-and-global-inventory.md`（改寫列）與 `research/03-environment-inventory.md`。改 `~/.claude/` 下的檔之前先備份到 `~/.claude/archive/`。
完成後記錄改了哪些檔、裁決了哪些矛盾。依決策票結論的重寫仍歸票 11。

## Comments

### 2026-11-12 Miles 拍板：刪掉派工任務書範本（由票 29 的對話記入）

- 決定：`memory/shared/派工任務書範本.md` 刪掉，在本票處理。
- 理由：官方認同任務書的內容（子代理看不到對話歷史；放手前要答五題：知道完成長怎樣、能否自檢、能碰什麼、何時停、成果交給誰簽核），但沒有要求用填空表。現行模型用簡短指令就能引導。出處見 `research/20-anthropic-setup-guidance.md` § 四、§ 七、§ 八。
- 做法：五題濃縮成 `AGENTS.md` 的兩三行。四個附加段（寫 wiki 卡、Prototype、調研、稽核）各自搬回對應的 skill，搬之前逐段核對有沒有漏。
- 同步要改的引用處（2026-11-12 實測）：`AGENTS.md` 第 44、121 行；`.claude/skills/vault-audit/references/判讀派工單.md`；`.claude/skills/erp-audit/references/稽核者派工單.md`、`推演者派工單.md`；`.claude/skills/vault-ingest/references/調研派工單.md`。
- 風險：寫 wiki 卡與 Prototype 兩個附加段有實質限制（不准動規範卡、要列測試影響）。漏搬會讓子代理改到不該改的檔。

### 2026-11-12 票 29 交來的事項

票 29 已結案。記憶目錄剩 55 張卡：feedback 50、reference 5。下列事項歸本票。

待搬的 feedback 卡 38 張：

- 名單與每張卡該搬到哪個檔：`research/29-verify/F1.md`、`F2.md`、`F3.md` 的「總表」，看「建議的家」欄。
- 搬完刪卡，並刪記憶索引檔 `MEMORY.md` 的對應列（`AGENTS.md` § 記憶目錄）。
- `AGENTS.md` 陷阱表還有 6 列的出處寫「記憶卡 feedback_…」（no_over_design_on_oq、meaningful_guards、jidoka_stop_first_design、trace_fact_source_chain、check_sensation_api_asis、linear_issue_via_pm_team）。這 6 張卡目前都在。卡搬走時，同步把出處改成日期或刪掉該列。
- 留下的卡裡有指向已封存 project 卡的 `[[project-…]]` 連結，搬卡時一併清掉。

與現行規則相反的 feedback 卡 12 張，並排列給 Miles 裁決：

check_sensation_api_asis、features_mece_no_rules_in_project、industry_best_practice_first、linear_comment_format、linear_fix_restructure_not_append、linear_task_prefix、model_split_opus_for_agents、oq_closure_resolve_then_archive、production_task_standardized、prototype_layout_follow_source、prototype_pr_no_linear_link、wiki_link_not_text_path。

- 每張卡與哪一句現行規則相反，見 `F1.md` 至 `F3.md` 各卡的小節。
- `feedback_linear_task_prefix.md` 不在 `MEMORY.md` 索引內。

要 Miles 裁決的兩條（票 29 重查判定「記憶卡較新」）：

| 題目 | 兩邊的說法 | 證據 |
|---|---|---|
| ERP 後端現況正本的名稱 | 記憶卡 `feedback_check_sensation_api_asis` 與已封存的 seg3 卡：ERP 後端是 sens-print-core，sensation-api 是 EC 後台。`AGENTS.md` 第 59、112 行與 `erp-plan/SKILL.md` 第 32 行：先查 sensation-api | `research/29-verify/重查彙整-待裁決.md` 的 `project_production_stage_seg3_done` F13 列；`linear-delivery/SKILL.md:77` 以 sens-print-core 為後端現況 |
| erp 的 Prototype 分支做法 | 已封存的記憶卡 `project_erp_repo_prototype_workflow`：唯一長期分支 prototype/production-stage。erp 的 skill `prototype-from-prompt/SKILL.md:69`：一律在 `prototype/<name>` 分支，從 main 拉出。`AGENTS.md` 第 138 行：開分支加前端主管 PR 合併，沒寫分支名 | 同檔的 `project_erp_repo_prototype_workflow` 5 列 |

陷阱表要刪的一列：

- `AGENTS.md` 第 111 行「還不要提交的改動先暫存；並行工作階段會一起提交」。前提已不成立：代理一律在自己的工作樹作業，每個工作樹有自己的暫存區。對應的記憶卡 `feedback_no_staging_before_commit` 已封存。

票 29 已改掉的部分（本票不用再做）：

- 陷阱表 4 列的出處原本指向已封存的記憶卡，已改成日期（輸出簡體中文字元、文件矛盾自行調和、設計前漏讀架構正本卡、改卡名用 git mv）。
- 「停下與繼續」段刪掉「記憶卡標『勿重問』者直接沿用」。記憶目錄已沒有任何卡含「勿重問」。

`docs/adr/` 的處理等 Miles 裁決：

- 本票 Question 第三點把 `docs/adr/` 列為「引用不存在的資料夾」。matt 的 `domain-modeling` skill 原文是用到才建（Create the `docs/adr/` directory lazily: only when the first ADR is needed），`docs/agents/domain.md` 也寫資料夾不存在就照常進行。所以資料夾不存在不算錯。
- 要不要保留這個引用，取決於 Miles 對票 29 Answer「決策紀錄」一節的裁決。裁決前不動。

### 2026-11-12 Miles 裁決：決策紀錄採用，`docs/adr/` 的引用保留

- Miles 採用票 29 Answer「決策紀錄」一節的做法。分工已寫進 `AGENTS.md` 正本分層表的「決策紀錄」一列。
- 本票 Question 第三點的 `docs/adr/` 引用不用刪。資料夾用到才建，現在不存在是正常的。

### 2026-11-12 `.claude/settings.json` 新增記憶目錄寫入檢查（票 29 加的，本票清設定檔時保留）

- `.claude/settings.json` 的 `hooks.PreToolUse` 有一筆「記憶目錄寫入檢查」，指令稿在 `.claude/hooks/memory_write_guard.py`。它擋下寫進記憶目錄的 project 類卡。說明見票 29 Answer。
- 記憶目錄現在是 feedback 50 張、reference 5 張，沒有 project 類。上一段留言寫的「project 2、reference 3」已改成這個數字。
- Miles 已同意 `AGENTS.md`「記憶目錄」一節的用字。


### 2026-11-12 進行中：已認領，設定檔過期項已清，裁決題已呈報 Miles

已做（不需裁決）：

- `.claude/settings.json`：刪 7 項過期允許（不存在的 nvm 路徑 3、`/Sens/spec` 1、`src/data/mockWorkOrders.ts` 的 sed 2、已刪的 skill `erp-spec` 1）。剩 46 項。記憶目錄寫入檢查與 wiki 寫入檢查兩個 hook 沒動。
- `~/.claude/settings.json`：刪 6 項過期允許（`erp-spec` 2、`erp-test-case` 1、`doc-audit` 1、nvm 2）。剩 36 項。備份在 `~/.claude/archive/agents-settings-dedup-20261112/settings.json.before`。
- `.claude/launch.json`：刪第三筆 `erp-shipment-logistics`（目錄不存在）。
- `.gitignore`：刪指向 `CLAUDE.md` 的三行與 `tools/superpowers` 一行（兩者在 repo 都不存在）。
- `oq-manage/SKILL.md` 的失效引用：實測已不存在，不用改。

票 03 的 12 組矛盾現況（2026-11-12 對照記憶目錄與規範檔）：

| 組 | 現況 |
|---|---|
| 1、2、3、6、12 | 甲方的記憶卡已封存，矛盾消失 |
| 7、8、9 | 兩邊都是 project 類記憶卡，票 29 已封存 |
| 4 模型分工 | 待裁決（下表 M） |
| 5 架構正本卡 | 待裁決（下表 N） |
| 10 erp 分支 | 待裁決（下表 L） |
| 11 後端名稱 | 待裁決（下表 A） |

待 Miles 裁決的題目（已在對話呈報，建議欄是主對話的建議）：

| 代號 | 題目 | 記憶卡或甲方 | 現行規則或乙方 | 建議 |
|---|---|---|---|---|
| A | ERP 後端現況查哪個程式庫 | `feedback_check_sensation_api_asis`（2026-08-11）：ERP 後端是 sens-print-core，sensation-api 是電商後台 | `AGENTS.md:61`、`:114`、`erp-plan/SKILL.md:32`：先查 sensation-api | 採記憶卡。本機查證：sensation-api 的 README 自稱電商後端；sens-print-core 有 production、order、ec 模組，設定檔把 sensation-api 標為 EC |
| B | Task 票能不能用規則名引用沿用的規則 | `feedback_features_mece_no_rules_in_project`（2026-09-02）：可以 | `規範 - Linear 交付.md:54`（2026-11-04）：不寫，也不寫引用句 | 採現行規範 |
| C | 後續階段的功能要不要先設計並預留欄位 | `feedback_industry_best_practice_first`（2026-06-15）：要，完整 Roadmap 都處理 | `規劃品質評分準則.md:110`、`:17`：未被要求的不加；遠期可預留不實作 | 採現行準則 |
| D | Linear 留言引用 issue 的寫法 | `feedback_linear_comment_format`（2026-09-04）：手寫提及元素與 UUID | `規範 - Linear 交付.md:21`、`SKILL.md:141`：直接寫識別碼 | 採現行規範 |
| E | Linear 票標題前綴 | `feedback_linear_task_prefix`（2026-08-21）：所有票都加 `[ Task ] - `，既有票不改名 | `範本 - Linear 交付.md:65`：Feature 票用 `[ Feature ] - `；`SKILL.md:140`：補前綴是覆寫例外 | 採現行範本 |
| F | 可封存的 OQ 要不要先問 Miles | `feedback_oq_closure_resolve_then_archive`（2026-06-11）：不要問 | `oq-manage/references/整理報告格式.md:18`（2026-11-04）：Miles 確認後批次封存 | 採記憶卡：不問，封存後回報名單 |
| G | 計價輸入手填或只能選 | `feedback_production_task_standardized`：只從選項挑、不手填（卡內另一句又寫手填） | wiki `生產任務.md:120`：依計價方式填或選 | 採 wiki。卡內第 7 條的九項規則併入票 33 核對 |
| H | 搬移舊頁面時版型依來源頁 | `feedback_prototype_layout_follow_source`（2026-07-07）：依來源頁 | erp 的 `prototype-from-prompt/SKILL.md:56`：套 recipe 骨架 | 封存記憶卡（要 Miles 確認已沒有搬移舊頁的工作） |
| I | Prototype 的 PR 填不填 Linear 票號 | `feedback_prototype_pr_no_linear_link`（2026-09-22）：一律填 N/A | erp 的 skill 與 PR 範本：有對應票就填 | 採記憶卡，寫進 `AGENTS.md` § Prototype 與測試；erp 的檔不動 |
| J | wiki 連結能不能帶別名 | `feedback_wiki_link_not_text_path`（2026-06-14）：帶別名更清楚 | `memory/Sens_wiki/AGENTS.md:21`、共用規範 L1-6：禁別名 | 採現行規範 |
| L | erp 的 Prototype 分支做法 | `feedback_model_split_opus_for_agents` 第 6 條：固定在 prototype/production-stage、不開 PR | `AGENTS.md`：開分支加前端主管 PR 合併；erp 的 skill 第 69、70 行：`prototype/<name>` 從 main 拉出，「發布」併進 develop | `AGENTS.md` 改成指向 erp 的兩個 skill，不重述 |
| M | 模型分工 | `feedback_linear_fix_restructure_not_append`（2026-10-07）：撰寫 Sonnet、稽核 Opus、推理中等；`feedback_model_split_opus_for_agents`（2026-09-15）：Sonnet 只留純機械 | `AGENTS.md` § 模型分工：子代理實作、wiki 修正、稽核用 Opus high；查找與重複任務用 Sonnet | 以 `AGENTS.md` 的表為唯一正本；兩張卡的模型段刪掉；skill 與子代理定義的數值對齊該表 |
| N | 陷阱表「設計前漏讀架構正本卡」 | `AGENTS.md:109` | `erp-plan/SKILL.md:32`：設計者不讀 raw | 刪這一列 |
| O | 提交後自動推送 hook 要不要搬進 `settings.json` | 搬：每個工作樹一提交就推自己的分支 | 不搬：hook 只在主檢出的 `settings.local.json` | 不搬；`AGENTS.md`「提交後 hook 自動推送」一句刪掉 |
| P | Prototype 類做事規則放哪裡（約 10 張卡） | 全放 `AGENTS.md` § Prototype 與測試 | 流程類放 `AGENTS.md`，介面行為類放 `memory/shared/ui-business-rules.md` 並由 `AGENTS.md` 引用 | 後者 |
| Q | `.mcp.json` 的 `figma-desktop` | 留（Figma 桌面版開著才連得上） | 刪（另有雲端的 `figma`） | 刪，連同設定檔 4 條允許項 |

裁決後要做：

- 依裁決改 `AGENTS.md`、skill、wiki 規範；12 張相反的卡刪掉或改寫。
- 38 張待搬卡：先產出「搬到哪、改寫成哪一句」的清單給 Miles 看，同意後才搬。原本建議的家是「派工任務書範本」的卡（`audit_subagent_against_skill`、`dispatch_senior_pm_lens`、`operation_terms_exact`）要改落點，因為範本要刪。
- 陷阱表逐列去留，與上一項同一份清單。
- 刪派工任務書範本（本票第一段留言）。
- 上一則對話（票 29）封存失敗：它還開著遠端控制。要 Miles 關掉或自己封存。

### 2026-11-12 進行中：搬遷清單草稿乙已回報並通過原文比對

- 草稿：`research/30-relocation-draft-B.md`。內容是 F3 的 13 張待搬卡（要搬 34 條），與 `AGENTS.md` 陷阱表 32 列的逐列去留（子代理建議刪 23 列、搬 9 列、留 0 列，整節可刪）。
- 主對話的檢核：164 句引文用指令逐句比對所指檔案與行號，全部存在（其中 1 句只差全形與半形冒號）。陷阱表 32 列的原文與行號全部相符。判定是否正確只抽讀了第 1、8 節與陷阱表第 1 至 3、18 列，其餘未抽查。
- 草稿甲（F1、F2 的 25 張卡）由另一個子代理撰寫，寫入 `research/30-relocation-draft-A.md`，回報後同法檢核。
- 比對用的指令稿不進版控。做法：抓出「縮寫:行號「原文」」的每一筆，去掉空白與標記符號後，確認原文出現在該檔該行前後三行內。
- 兩份草稿都還沒給 Miles 看。規範檔與記憶卡沒有動。

### 2026-11-12 進行中：搬遷清單草稿甲已回報並通過原文比對，換對話接續

- 草稿：`research/30-relocation-draft-A.md`。F1、F2 的 25 張待搬卡共 97 條指示：搬 45 條、已有不搬 47 條、過期不搬 5 條。Prototype 類 11 條等題 P。
- 主對話的檢核：215 句引文，204 句用指令比對所指檔案與行號都存在；11 句指令稿判不出檔案，改用全庫搜尋，原文都找得到。判定是否正確只抽讀第一節，其餘未抽查。
- 子代理與票 29 核對檔不同的兩條判定（未查證）：「沿用既有流程」的通則在評分準則第 19 行已有；「發票預填、自由編輯」在發票品項預設一式、開放編輯卡第 24 行已有。
- 子代理列的沒把握處（未查證）：發票規則的「不適用範圍」找不到 Miles 的拍板出處；「約 5 張」是否留成門檻值；「Wiki 憲章」章名是否改名；刪卡前要先改 `AGENTS.md` 與 `linear-delivery` 內指向記憶卡的出處欄。
- 下一步：把兩份草稿合併成一份給 Miles 看的清單（只列要搬的句子與目標檔），連同 16 題裁決題的回覆一起處理。Miles 還沒回覆 16 題。

### 2026-11-12 進行中：兩份草稿已合併成一份清單，連同 16 題再次呈報 Miles

- 合併檔：`research/30-relocation-merged.md`。只列要搬的句子，依目標檔分組；檔頭有條數、合併時的調整、落地順序的限制。
- 條數：草稿甲搬 45、已有 47、過期 5；草稿乙工作一搬 35（3 條併入他句）、已有 20、過期 3；陷阱表搬 9、刪 23。
- 抽查：兩份草稿的「已有不搬」67 條與陷阱表「刪」23 列，主對話都對著草稿內的原文引文讀過，其中 46 行回原檔讀原文。改了 3 處判定，見合併檔「主對話抽查後改的判定」。
- 新增一題給 Miles（代號 R）：`feedback_brd_methodology`「擴充到新模組前與使用者確認方向」要不要搬。建議不搬。
- 落地順序：草稿甲有 9 條「已有」只靠陷阱表的列。陷阱表搬出的新句要先寫入，才刪陷阱表與記憶卡。
- 等票 11 的 13 列不在這輪搬；`feedback_report_in_chat_and_handoff`、`feedback_sessions_same_sidebar_group` 兩張卡這輪不刪。
- 開工整理：本對話已命名「工作流程重置 - 票 30」、移出子對話、放進「工作流程優化」區段。上一則對話（`local_bb4959a8-c037-4d11-bbc0-5f4a81e994fb`）封存被擋，原因是它開著遠端控制；已請 Miles 處理。
- 還沒做：Miles 回覆 16 題與清單後改規範檔、刪卡；刪派工任務書範本。

### 2026-11-12 Miles 裁決（第一輪）：A、D、E、H、N、Q 定案，其餘重講後再裁決

| 代號 | Miles 的裁決 |
|---|---|
| A | 採記憶卡。後端有兩個程式庫：ERP 後端是 sens-print-core，sensation-api 是電商後台 |
| D | 採現行規範：Linear 留言引用其他票時直接寫識別碼 |
| E | 採現行範本：Feature 票用 `[ Feature ] - ` 前綴 |
| H | 封存 `feedback_prototype_layout_follow_source` |
| N | 刪陷阱表「設計前漏讀架構正本卡」一列 |
| Q | 刪 `.mcp.json` 的 `figma-desktop`，連同設定檔的 4 條允許項 |

- B、C、F、G、I、J、L、M、O、P、R：Miles 回「看不懂」。主對話改用業務情境重講後再請 Miles 裁決。
- G：Miles 指示去看 ERP 後端怎麼做。已派子代理查 `/Users/b-f-03-029/sens-print-core`。
- P：Miles 問 `memory/shared/ui-business-rules.md` 在現行流程用不用得到。實測：`AGENTS.md`、Sens 的 skill、erp 的 `prototype-from-prompt` 都沒有引用它；只有 `memory/shared/ui-wording.md:6` 與 wiki `scope-boundary.md:74` 提到。票 14 盤點把它列為待判。主對話的建議改成：Prototype 類規則全放 `AGENTS.md` § Prototype 與測試。
- R：Miles 的原話是「擴充新的 ERP 功能要和我確認，但由你設計與稽核」。記憶卡原句講的是「把 wiki 寫卡擴到新模組前先確認方向」，兩者不是同一件事，要向 Miles 釐清。
- 搬遷清單 74 句：Miles 還沒回覆，說先確定裁決題再處理後續。
