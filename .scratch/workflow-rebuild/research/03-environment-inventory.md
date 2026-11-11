# 03 代理工作環境盤點

主對話查證（2026-11-11）：
- 相符：記憶卡 143 張；AGENTS.md 陷阱表 32 列；多個工作樹的 `core.hooksPath` 指向空的 `.git/hooks`；`lint_error_codes` 與 `lint_done_domains` 仍為「無」。
- 更正一：第 6 批（款項與發票）已併入 master（提交 14e0e79 起共七筆）。本檔寫「未併入」是盤點當下的狀態，盤點期間另一個工作階段完成了合併。
- 更正二：林則孟課程的 12 張 raw 卡與 303 個附件沒有消失。它們在 2026-10-27 的 GitHub Desktop 暫存（stash 35d81fa）裡，master 沒有。主對話已建分支 `rescue/ppc-course-stash-20261027` 指向該暫存提交，防止被清除；暫存本身沒有動。
- 其餘數字未逐項查證。


盤點日期：2026-11-11。對象：Sens 專案的代理工作環境（AGENTS.md、全域設定、記憶檔、skill、hook、子代理、在途工作、wiki、測試）。只讀不改。
基準工作樹：`/Users/b-f-03-029/Sens/.claude/worktrees/blissful-leavitt-e539ef`，分支 `claude/wiki-project-restructure-cc9d40`。origin/master 為 1d528ac；本工作樹另有 1 筆「開工作環境重建地圖」提交，其餘等同 master。
「判定」欄是依內容讀取後的判斷；沒有逐字核對者標「未逐字核對」。數字的算法見各表下方與最後的「附：計數指令」。

## 一、摘要

1. AGENTS.md 共 157 行，陷阱表 32 列。依內容分類：可寫成程式檢查 8 列、已屬某個 skill 或規範 10 列、一般模型常識 5 列、專案特有 8 列、與現行正本矛盾 1 列。32 列全部在記憶卡、skill 或其他規範有同義句（見二之 2）。
2. 記憶檔 143 張（project 80、feedback 61、reference 2）。project 類 49 張以「已完成工作的紀錄」為主、22 張以仍有效的決策為主、6 張標進行中（其中 4 張已過期或疑似過期、1 張成果遺失）、翻案 3 張。feedback 類 61 張：30 張在 AGENTS.md 陷阱表有同義列，共 32 張在 AGENTS.md 有對應；7 張過期或與現行正本矛盾（見三）。
3. 林則孟 34 講的成果不在 master：工作流第二次執行的結果檔（`wf_e17baeb1-b91.json`）記錄寫出 11 張章別 raw 卡與 276 個附件，目前 master、任何分支與磁碟上都找不到；`raw/` 無 2026-09-17 的卡，`領域知識/` 3 張卡的來源都不是該課程（見十一）。
4. wiki 正規化遷移共 9 個編號批次（0 至 8；批 0 有兩段、批 4 拆 4A 與 4B）。批 0 至 5 已併入 master；批 6（款項與發票）已做完但未併入 master，在兩條分支上；批 7 收縮、批 8 資料夾整理未開始（見十）。
5. 設定漂移：`.claude/settings.local.json` 為 gitignored，179 項允許清單中 58 項指向已不存在的 skill、worktree、OpenSpec 或其他專案路徑；三份設定合計 71 項過期（pattern 比對，為下限，見五）。`core.hooksPath` 在 7 個工作樹被覆寫為空的 `.git/hooks`，這些工作樹的提交不跑 wiki 寫入檢查，其中包含正在做批 6 的工作樹。
6. skill 重複集中在三類：每個 skill 都複寫「任務書須指名讀 non-business-terms.md、句法由 hook 送達」；同一歷史事件寫進兩個 skill 的陷阱表；七個 skill 各有 CHANGELOG（合計 311 行），與全域「本體不疊加歷史」原則並存（見四）。
7. 近 60 天使用證據：Skill 工具呼叫 wiki-amend 26 次、obsidian-cli 25、oq-manage 18、grilling 12、linear-delivery 12；vault-audit 1 次、vault-ingest 1 次；erp-audit 0 次（11 月 4 日由 plan-audit 與 misjudgement-record 併成，舊名近 60 天合計 10 次）；defuddle、json-canvas、obsidian-bases、obsidian-markdown、frontend-design 近 60 天 0 次（見七）。
8. 在途工作：18 個工作樹（含主檢出）、38 個本地分支。分支超前 origin/master 0 筆者 29 個（含 master，已併入）；2 個工作樹有未提交改動（happy-rhodes 17 項、printvis 2 項）（見八）。
9. 互相矛盾或已被翻案的記憶卡與正本共 12 組（見三之 4）。要點：搜尋範圍限 /Sens 對上讀碼需讀 erp 與後端；Linear 取材「不看 Prototype」對上現行規範取材含 Prototype；模型分工在 5 處數值不一致；後端 repo 名稱 sensation-api 對上 sens-print-core；出貨批次拋單 10 月 20 日與 22 日兩卡結論相反。
10. erp-prototype-tests 共 203 個檔，其中測試檔 189 個（畫面 97、純函式 92）；情境目錄統計表合計 480 條，但「### 數字.數字」形式的標題只有 463 個，差 17 條，原因未查證（見十二）。
11. 查不到或不確定的項目集中在最後一節。

## 二、AGENTS.md、全域 CLAUDE.md、輸出風格

### 1. 各段行數

| 檔 | 段落 | 行號 | 行數 |
|---|---|---|---|
| AGENTS.md（157 行、13210 位元組） | 專案是什麼 | 3-10 | 8 |
|  | 正本分層 | 11-25 | 15 |
|  | 工作入口 | 26-49 | 24 |
|  | 模型分工 | 50-60 | 11 |
|  | 停下與繼續 | 61-66 | 6 |
|  | 收尾回報 | 67-77 | 11 |
|  | 陷阱（32 列） | 78-114 | 37 |
|  | 版本控管 | 115-124 | 10 |
|  | Prototype 與測試 | 125-133 | 9 |
|  | 生產主檔用詞 | 134-144 | 11 |
|  | Agent skills（含 Issue tracker、Triage labels、Domain docs 三小節） | 145-157 | 13 |
| ~/.claude/CLAUDE.md（46 行、3461 位元組） | 語言與用語 | 3-20 | 18 |
|  | 表達限制 | 21-23 | 3 |
|  | 推論方式 | 24-26 | 3 |
|  | 轉述他人產出前必查證 | 27-32 | 6 |
|  | 回覆規範 | 33-35 | 3 |
|  | 語氣 | 36-38 | 3 |
|  | 文件迭代：收斂本體，不疊加歷史 | 39-46 | 8 |
| ~/.claude/output-styles/ste100-pm.md（66 行、3664 位元組） | 前言（含 frontmatter） | 1-12 | 12 |
|  | 開場 | 13-18 | 6 |
|  | 句子 | 19-27 | 9 |
|  | 結構 | 28-36 | 9 |
|  | 用詞 | 37-44 | 8 |
|  | 範例 | 45-63 | 19 |
|  | 例外 | 64-66 | 3 |
| memory/Sens_wiki/AGENTS.md（60 行；一併盤點，因為與根目錄 AGENTS.md 有重複） | 標題／一範圍與語言／二目錄權限與讀取邊界／三共用標準／四寫入後必維護／五陷阱／六工作流入口 | 1-60 | 2／6／9／9／16／9／9 |

算法：`python3` 掃 `^#{1,3} ` 標題，取相鄰標題行號相減。

### 2. AGENTS.md 陷阱表逐列分類

分類代號：P＝可寫成程式檢查（hook、腳本或權限規則）；S＝屬於某個 skill 或規範卡的內容；G＝一般模型常識或已由全域設定涵蓋；U＝專案特有且必須保留；X＝與現行正本矛盾。每列只給一個主要分類，其他寫在備註。

| # | 陷阱（摘要） | 分類 | 備註 |
|---|---|---|---|
| 1 | 回覆改用英文，尤其代理回報後的狀態更新 | G | 全域 CLAUDE.md 語言段、settings.json `language: zh-TW`、記憶卡 no_english_replies 三處已有；刪 |
| 2 | 輸出簡體中文字元 | P | wiki 卡已由 wiki_lint S2 檢查簡體字；對話端無法程式檢查。全域 CLAUDE.md、記憶卡 always_traditional_chinese 重複 |
| 3 | 寫「as-is」；一律寫現況 | P | 字串比對可進 wiki_lint 避免用詞（S7）或寫入 hook。記憶卡 no_asis_term 重複；全域 CLAUDE.md「禁中英夾雜」已涵蓋 |
| 4 | 規則名稱帶數量；門檻值寫兩處以上；範本放規則 | P | wiki_lint S2 已含「寫死數量的名稱」；「門檻值只寫一處」oq-manage、vault-ingest 限制句已有。記憶卡 rule_names_no_counts 重複 |
| 5 | 操作名稱不照實體卡操作段，改用同義詞 | U | 需對照實體卡操作段；authority_check 只檢查編號格式與關聯。記憶卡 operation_terms_exact 重複 |
| 6 | 有狀態機卻用抽象描述判條件；要用狀態名 | U | 記憶卡 prefer_state_definitions_for_conditions 重複 |
| 7 | 分級與影響範圍數模組；要看實體間關聯 | S | 分級在審查知識路由 § 三、erp-plan、erp-audit。記憶卡 entity_not_module 重複 |
| 8 | 為單一情境設特別規則；先設計通用工具再用情境驗證 | G | 一般設計原則，記憶卡 tools_first_scenarios_validate 重複；本專案特有成分是「情境卡驗證覆蓋」 |
| 9 | 規劃單漏列互動、錯誤提示、例外處理；代理要在 grill 主動列題 | S | erp-plan 限制第 8 條逐句相同；記憶卡 flow_data_first_no_ux 重複 |
| 10 | OQ 裁決加閾值分級、疊提醒、新欄位；預設先不做 | U | Miles 的設計偏好；記憶卡 no_over_design_on_oq 重複 |
| 11 | 設狀態把關前沒找既存額度、數量、事實條件 | U | 記憶卡 meaningful_guards 重複 |
| 12 | 異常用事後沖帳補救；要停止並排除 | U | 家應是領域知識卡「豐田式生產管理對映」；記憶卡 jidoka_stop_first_design 重複 |
| 13 | 文件矛盾自行調和；要停下並排呈報 | S | 共用規範 § 三、wiki-amend 限制、AGENTS「停下與繼續」、wiki AGENTS 陷阱、記憶卡共 5 處 |
| 14 | 宣告缺口前只讀一張卡；要追完事實來源鏈 | S | erp-audit 陷阱第 7 條、erp-plan 陷阱「沒讀完既有卡就判缺漏」；記憶卡 trace_fact_source_chain 重複 |
| 15 | 設計前漏讀架構正本卡 | X | 引用的記憶卡要求讀 raw 設計收斂記錄；erp-plan 限制「設計者不讀 raw」，2026-10-29 拍板「設計以 wiki 為邊界、不直接查 raw」，兩者相反 |
| 16 | wiki 引用用文字路徑或相對引用；一律 [[卡名]] | P | wiki_lint S5（連結存在）、S2（相對引用）已檢；wiki AGENTS § 三、記憶卡兩張重複 |
| 17 | 不同卡資料重疊，連摘要都留；一個事實一張卡 | P | wiki_lint S9（逐字相同長句）、S10（相似度）；共用規範 § 二之四、記憶卡重複 |
| 18 | 改卡名用 git mv，反向連結全斷；用 obsidian-cli | P | 可用 PreToolUse hook 擋 `git mv` 作用於 memory/Sens_wiki/wiki。同句另在 wiki AGENTS § 五、wiki-amend 陷阱、記憶卡 project_obsidian_link_stability 共 4 處 |
| 19 | 還不要提交的改動先暫存；並行工作階段會一起提交 | G | git 常識；「代理一律用工作樹」後只剩主檢出與同工作樹並行情境，適用範圍縮小。記憶卡 no_staging_before_commit 重複 |
| 20 | 派單、貨運、運費類沒先爬 sensation-api | U | 記憶卡寫後端正本是 sens-print-core，linear-delivery 也寫 sens-print-core，與本列的 sensation-api 不一致 |
| 21 | 採信子代理「已遵循 skill」自述 | G | 全域 CLAUDE.md「轉述他人產出前必查證」、AGENTS 模型分工末句、記憶卡兩張共 4 處 |
| 22 | 規劃句沒有「規劃」字眼就不跑 erp-plan | S | erp-plan 陷阱末列逐句相同；其實是 skill description 觸發問題，不屬於 AGENTS |
| 23 | Prototype 動到 (prototype)/ 以外的共用元件或 app 層檔 | S | erp repo 的 prototype-from-prompt skill 是正本；記憶卡 prototype_scope_strict 重複 |
| 24 | 直接改 Prototype 前沒讀 prototype-from-prompt skill | S | AGENTS § Prototype 與測試同檔已寫 MUST 經該 skill，檔內重複；記憶卡重複 |
| 25 | 比對 Prototype 現況只搜模組目錄，漏共用元件 | U | 記憶卡 check_shared_components_when_diffing 重複 |
| 26 | Prototype 的 PR 關聯 Linear issue | P | 可由 erp repo 的 PR 範本預設值或 CI 檢查處理；記憶卡 prototype_pr_no_linear_link 重複 |
| 27 | 發布時把等 CI 與合併接成一條管線 | G | shell 管線出口狀態是通用知識；erp repo 的 prototype-publish skill 可承載。記憶卡 publish_ci_gate_no_pipe 重複 |
| 28 | Linear 修正用補充；要刪除或重構 | S | linear-delivery 規範 § 訂正紀錄；記憶卡 linear_fix_restructure_not_append 重複 |
| 29 | Linear 留言不用原本／現行對照表，或用 Markdown 連結引 issue | S | linear-delivery SKILL 陷阱表同義列（逐句相近）、規範 § 訂正紀錄；記憶卡重複 |
| 30 | Linear 開票不先在 PM team 建再轉隊 | S | linear-delivery SKILL 步驟 3 與陷阱表；記憶卡 linear_issue_via_pm_team 重複 |
| 31 | 當前狀態用不到的操作鈕做成停用加提示；要直接隱藏 | U | ui-business-rules.md 沒有此句（grep 隱藏 無命中）；只有記憶卡 hide_unavailable_actions |
| 32 | 沒被指示就跑全套測試 | P | 可用權限規則對 `npm test` 設為詢問；AGENTS § Prototype 與測試同檔已寫同句；記憶卡重複 |

小計：P 8、S 10、G 5、U 8、X 1，合計 32。
算法：`awk` 以外的工具讀 AGENTS.md 第 78 至 114 行，去掉表頭與分隔列，得 32 列；分類為閱讀後判斷。

### 3. 與 skill、記憶卡、其他規範重複的句子

| 重複內容 | 出現處 | 判定 |
|---|---|---|
| 「回覆風格正本是 ste100-pm.md；全域偏好正本在 ~/.claude/CLAUDE.md，本檔不重述」 | AGENTS.md 第 9 行 | 自己宣告不重述，但陷阱表列 1 至 3 仍重述語言規則 |
| 禁 emoji、用台灣用語、英文放括號 | 全域 CLAUDE.md 第 5、6、22 行；ste100-pm.md 第 43 行 | 兩檔重複；ste100 是句法規則，語言與用語應只留全域一處 |
| 對 PM 用業務術語、罕見工程詞附白話 | 全域 CLAUDE.md 第 17 行；ste100-pm.md 第 39、41 行；記憶卡 describe_in_business_terms | 三處 |
| 子代理回報先查證才轉述 | 全域 CLAUDE.md § 轉述他人產出前必查證（6 行）；AGENTS.md 第 59 行與陷阱列 21；記憶卡 audit_subagent_against_skill | 四處 |
| 任務書須指名讀 non-business-terms.md、句法由 SubagentStart hook 送達 | AGENTS.md 第 44 行；erp-audit、erp-plan、vault-audit、vault-ingest 四個 SKILL.md；派工任務書範本；兩個子代理定義；linear-delivery、wiki-amend 的 SKILL.md 也各寫指名句 | 至少 8 個檔重複同一句 |
| 停下並排呈報矛盾 | AGENTS.md「停下與繼續」第 2 項與陷阱列 13；共用規範 § 三；wiki-amend 限制；wiki AGENTS § 五；記憶卡 contradiction_must_stop | 5 處 |
| 改卡名用 obsidian-cli、禁 git mv | AGENTS.md 陷阱列 18；wiki AGENTS § 五；wiki-amend 限制與陷阱；記憶卡 project_obsidian_link_stability | 4 處 |
| wiki 內部連結一律 [[卡名]] | AGENTS.md 陷阱列 16；wiki AGENTS § 三；共用規範；wiki_lint S5；記憶卡兩張 | 6 處 |
| 分支完成直接快轉合併 master、不開 PR | AGENTS.md § 版本控管；記憶卡 erp_spec_merge_direct_no_pr（卡內自述只留理由） | 2 處；記憶卡可刪 |
| 全套測試只在 Miles 指示時跑 | AGENTS.md 第 130 行與陷阱列 32；記憶卡 tests_smoke_and_module_only | 3 處（同檔 2 處） |
| 模型分工 | AGENTS.md § 模型分工；記憶卡 model_split_opus_for_agents、subagent_tier_blind_test、linear_fix_restructure_not_append；erp-plan 限制（opus、high）；兩個 agents 定義 model 欄；全域 settings.json `CLAUDE_CODE_SUBAGENT_MODEL=opus[1m]` | 至少 5 處，數值互不相同（見三之 4） |
| 工作入口對照表（情境對應 skill） | AGENTS.md 第 26-49 行；各 SKILL.md 的 description「用／不用」；wiki AGENTS § 六 | 三處各寫一份觸發條件 |
| 收尾回報「發現」段的檢查項（開 OQ、存 raw、建議 vault-audit、設計拍板先落卡） | AGENTS.md 第 67-77 行；oq-manage、vault-ingest、vault-audit、wiki-amend 各 skill 已有同樣觸發 | 4 項都已在 skill 內 |
| 歷史標記（日期、拍板來源）寫進本體 | AGENTS.md 陷阱表「出處」欄 32 列全帶日期；標題「生產主檔用詞（2026-10-29 拍板…）」；各 SKILL 陷阱表出處欄 | 與全域「文件迭代：收斂本體，不疊加歷史」並存；陷阱表出處欄是歷史層 |


AGENTS.md 另有兩處指向不存在的物：第 8 行與 § Agent skills 提到 `docs/adr/`（實際不存在，`docs/` 下只有 agents、state-machine-flowcharts.md、superpowers 三項）；工作入口表列出的 `grill-with-docs`、`to-spec`、`to-tickets`、`implement` 在 matt 外掛 1.3.2 存在，但 SKILL.md 標 `disable-model-invocation: true`，本工作階段的技能清單不列出，只能手動斜線觸發。

## 三、記憶檔

位置：`~/.claude/projects/-Users-b-f-03-029-Sens/memory/`（不在 git 內，不受版本控管）。另有 repo 內的 `memory/MEMORY.md`，見本節第 5 點。

### 1. 依類型統計

| 項目 | 張數 | 算法 |
|---|---|---|
| 檔案總數（含 MEMORY.md） | 144 | `ls \| wc -l` |
| project_* | 80 | `ls \| grep -c "^project_"` |
| feedback_* | 61 | `ls \| grep -c "^feedback_"` |
| reference_* | 2 | erp-test-map 外掛、watch 影片外掛兩張 |
| user_* | 0 | — |
| MEMORY.md 索引 | 150 行 | 索引列：Project 79、Feedback 61、Reference 2；另有 1 張 project 卡（entity_charter_gap_list）被列在 Feedback 段 |
| 不在索引內的卡 | 1 | feedback_linear_task_prefix.md |
| 索引指向不存在的檔 | 0 | — |
| 最後修改日 | 2026-11-04 | 目錄與多數卡的 mtime；11-04 之後沒有新增或修改記憶卡 |

project 類判定統計：

| 判定 | 張數 |
|---|---|
| 完成兼決策 | 23 |
| 完成 | 20 |
| 決策 | 18 |
| 完成（過期） | 4 |
| 翻案 | 3 |
| 決策（部分翻案） | 3 |
| 進行（疑似過期） | 2 |
| 進行（過期） | 2 |
| 進行（中斷） | 1 |
| 進行 | 1 |
| 決策（部分重疊） | 1 |
| 完成（部分翻案） | 1 |
| 完成兼進行 | 1 |

彙總：以「已完成工作的紀錄」為主 49 張；以仍有效的決策為主 22 張；標進行中 6 張；被翻案 3 張。
「完成兼決策」表示卡內既有完成紀錄，也有勿重問的決策；這類決策多半已經落在 wiki 卡或 skill 規範，是否已落卡未逐張查證。

### 2. project 類逐張（80 張）

日期欄為檔案 mtime，不是卡內決策日期；卡名省略 `project_` 前綴。

| 卡 | mtime | 判定 | 備註 |
|---|---|---|---|
| after_sales_responsibility_removal | 2026-10-27 | 完成兼決策 | 行為驅動收費、結案軟提示、AFT-10 留痕；四層已落地 |
| authority_matrix_grill_20261013 | 2026-10-23 | 完成兼決策 | G1 至 G63；權責結構已併入主線 wiki |
| bom_pricing_input_one_row_20261013 | 2026-10-13 | 決策 | 翻案 09-03 的一列一計價層級；手填欄位規則 |
| business_scenario_unit | 2026-06-13 | 進行（疑似過期） | 「Phase B 遷移待執行」；後續由 wiki 正規化批次承接，未查證是否取代 |
| consultation_cancel_converge | 2026-05-29 | 決策 | 諮詢取消收斂到一般訂單取消流程 |
| consultation_request_explore | 2026-05-07 | 決策 | v3 結論：款項多型、諮詢訂單只在收尾建立 |
| delivery_date_naming_20260911 | 2026-09-21 | 翻案 | 第 2、9、10、14 條已於 09-21 翻案（卡內自述） |
| delivery_date_redefinition_20260921 | 2026-09-21 | 決策 | 現行：用公司日期名稱溝通；內部完成日、預計交期定義 |
| entity_charter_gap_list | 2026-06-12 | 完成 | 13 張卡合規；欄位正本歸 wiki |
| erp_dashboard_deferred | 2026-05-11 | 決策 | 核心流程完成前不規劃 dashboard |
| erp_manual_dev_verified | 2026-09-23 | 完成 | 操作手冊全書批修；單一 HTML 與 Artifact 固定網址 |
| erp_mes_design_baseline | 2026-08-05 | 決策 | 豐田式生產管理準則；ISA-95 至 Level 2 |
| erp_repo_prototype_workflow | 2026-10-27 | 決策 | Prototype 在 erp repo、唯一長期分支；與 AGENTS 的 PR 描述有出入（見三之 4） |
| invoice_view_drawer_done | 2026-08-20 | 完成 | 單張發票檢視側板 |
| linear_format_redesign_grill_20261012 | 2026-10-23 | 決策 | Linear 三層格式；現由 linear-delivery 規範承載 |
| manual_prototype_sync_grill_20260923 | 2026-09-24 | 完成 | 手冊對照 Prototype 修訂全數拍板 |
| mes_architecture_planning | 2026-07-23 | 進行（疑似過期） | 2026-07 規劃卡，五層架構；生產階段段 1 至 4 已 archive |
| mes_production_stage_planning | 2026-07-31 | 完成 | 生產階段重構式規劃；後續四段已完成 |
| mock_chain4_urgent_multipart | 2026-09-07 | 完成 | Prototype 資料鏈四、五、六 |
| obsidian_link_stability | 2026-05-31 | 決策 | 改卡名用 obsidian-cli；同一規則另在 AGENTS、wiki AGENTS、wiki-amend 各寫一次 |
| officer_files_to_print_item_20260924 | 2026-09-29 | 完成兼決策 | 印務檔案搬到印件層 |
| openspec_cleanup_batch1 | 2026-07-31 | 完成（過期） | OpenSpec 清整；OpenSpec 已退場，repo 無 openspec 資料夾 |
| order_invoice_amount_rules | 2026-09-01 | 決策 | 金額規則現行版（稅額取整、發票反推） |
| order_module_v45_rewrite | 2026-08-31 | 完成（過期） | Linear v4.5 全票重寫；格式後續改 v5、v6 |
| order_workorder_wiki_iteration_grill_20261004 | 2026-10-06 | 完成 | 十三題拍板，已落卡 |
| payment_worklists_delivery | 2026-09-03 | 完成 | 款項管理 Linear 交付 |
| planning_flow_reform | 2026-08-05 | 翻案 | plan-design 與 plan-audit 流程、/opsx:propose；已由 skill 重構（11-04）取代，卡內仍寫「試行中」 |
| ppc_course_to_wiki_20260917 | 2026-09-18 | 進行（中斷） | 成果不在 master；見十一 |
| prep_spec_layer_20260907 | 2026-09-07 | 決策 | 備料規格層；十一題拍板勿重問 |
| print_item_delivery_date_20260908 | 2026-09-11 | 決策（部分翻案） | 命名「訂單交期／預計交期」部分已被 09-21 日期定義改版取代 |
| process_note_qc_to_print_item_20260915 | 2026-09-15 | 完成兼決策 | 製程說明與品檢需求搬到印件層 |
| production_dispatch_report_transfer_grill_20261006 | 2026-10-06 | 決策 | 只收場內；報工四維度；點收單一動作 |
| production_management_linear_20261005 | 2026-10-06 | 完成 | 中台生產管理 Linear 首次交付 |
| production_management_prototype_fix | 2026-09-04 | 完成兼決策 | 群組改「生產管理」；工作包純分組 |
| production_quantity_audit_grill_20261026 | 2026-10-27 | 進行 | G1 至 G20 已拍板，待裁決 P1 至 P7 |
| production_stage_restructure | 2026-07-21 | 完成兼決策 | 品檢為印件層品檢紀錄等商業層收斂 |
| production_stage_seg2_done | 2026-08-11 | 完成兼決策 | 段 2 報工與場內轉交；關鍵拍板勿重問 |
| production_stage_seg3_done | 2026-08-12 | 完成兼決策 | 段 3 品檢出貨訂單 |
| production_stage_seg4a_done | 2026-08-17 | 完成兼決策 | 段 4A 副流程生產側 |
| production_stage_seg4b_done | 2026-08-17 | 完成兼決策 | 段 4B 審稿段重寫 |
| production_ui_correction_grill_20261012 | 2026-10-23 | 決策 | 修正機制統一；一次報多筆整批擋下 |
| prompt_audit_grill_20260923 | 2026-09-23 | 完成 | 提示詞稽核拍板與執行進度 |
| prototype_batch2_destination_station_20260907 | 2026-09-07 | 完成兼決策 | 目的站點欄位 |
| prototype_test_strategy_20260908 | 2026-09-21 | 決策 | Vitest 加 Playwright 放 Sens；現行寫法已在 AGENTS § Prototype 與測試 |
| prototype_ui_consistency_fix_20260907 | 2026-09-07 | 完成 | 介面一致性修正五項 |
| qc_pick_ship_flow_confirm_20260922 | 2026-09-23 | 完成兼決策 | 品檢、揀貨、出貨三角色流程確認 |
| quote_item_drawer_regroup_20260923 | 2026-09-23 | 完成 | 需求單印件側板分五區 |
| quote_linear_delivery_prototype_standard_20261004 | 2026-10-04 | 完成 | 需求單 Linear 精簡版交付 |
| quote_prototype_sync_20260908 | 2026-09-08 | 完成兼決策 | 需求單 Prototype 對齊 wiki 六題 |
| quote_to_order_gap_fix | 2026-09-02 | 完成 | 需求單轉訂單帶入缺口 |
| rule_card_normalization_20261027 | 2026-10-27 | 決策（部分重疊） | 規則單元只留做法與底線；與 11-04 起的 wiki 正規化規則組有重疊，未查證是否被取代 |
| rush_order_definition_20261027 | 2026-11-04 | 完成兼決策 | 急件新定義；已歸檔、erp 已部署 |
| sdd_workflow_improvement | 2026-06-09 | 進行（過期） | P1 至 P3 待執行；SDD 與 OpenSpec 前提已消失 |
| shipment_batch_dispatch_box_size_grill_20261022 | 2026-10-23 | 完成兼決策 | 推翻 G20、G31；已收官 |
| shipment_draft_flow_20260917 | 2026-09-21 | 完成兼決策 | 草稿態與品檢待驗清單；部分翻案見卡內 |
| shipment_logistics_split_grill_20261020 | 2026-10-22 | 完成（部分翻案） | G31 至 G36 的「無批次拋單」被 10-22 卡推翻，索引說明仍寫舊結論 |
| shipment_print_download_center_grill_20261023 | 2026-10-26 | 完成 | 已結案 2026-10-26 |
| shipment_row_actions_grill_20261006 | 2026-10-06 | 決策 | 列上動作鈕改版；翻案 09-22 |
| skill_rewrite_c5_20261029 | 2026-11-04 | 完成兼進行 | 批次 0.5 至 7 已合併；仍列未完成：真實主題試用、Linear 範例、specs 重構另立 |
| state_machine_refactor_workflow | 2026-06-11 | 完成（過期） | 四方比對含 openspec，前提已消失 |
| task_form_bom_picker_done | 2026-09-03 | 完成兼決策 | BOM 選擇器攤平到計價層級 |
| vault_convergence_backlog | 2026-07-30 | 進行（過期） | 2026-07-30 待辦；OQ 分流與封存已由 oq-manage 承接 |
| vault_operating_contract | 2026-05-31 | 決策 | 診斷：缺強制機制；Miles 拍板先不做 |
| wiki_cleanup_by_domain | 2026-08-04 | 完成 | 七批全完 |
| wiki_tag_migration | 2026-07-28 | 完成兼決策 | 領域 tag 化；檢索規約 |
| wiki_write_entry_consolidation | 2026-08-01 | 完成 | wiki 寫卡入口收攏 |
| work_order_assign_dialog_done | 2026-09-04 | 完成兼決策 | 印件層工單分派 Dialog |
| work_order_cost_color_lines_20260916 | 2026-09-20 | 決策 | 顏色費用獨立五列；十二題拍板勿重問 |
| work_order_creation_delivery | 2026-08-26 | 完成 | 工單建立主流程已交付 Linear |
| work_order_detail_company_alignment_20260920 | 2026-09-21 | 完成兼決策 | 工單詳情頁對齊公司參考文件 |
| work_order_detail_gap_round2_20260921 | 2026-09-22 | 完成兼決策 | 第二輪缺口九題 |
| work_order_detail_layout_done | 2026-09-04 | 完成 | 工單詳情介面優化；檔案最大（7067 位元組） |
| work_order_linear_delivery_prototype_standard_20261005 | 2026-10-05 | 完成 | 工單 Linear 交付，六輪 10 分 |
| work_order_qty_color_costing_done | 2026-08-21 | 完成兼決策 | 工單建立改良；目標數量倒推 |
| work_order_task_editing_done | 2026-08-27 | 完成兼決策 | 生產任務編輯實務修正 |
| work_order_visibility_sharing_20260907 | 2026-09-07 | 決策 | 列表只帶自己的；詳情全體可看 |
| workflow_boundary_grill_20261004 | 2026-10-04 | 決策（部分翻案） | 規則正本只在 wiki；以 OpenSpec 為前提的段落已過期 |
| workflow_change_as_design_carrier_20261022 | 2026-10-23 | 翻案 | 以 OpenSpec change 資料夾為設計載體；現行為 .scratch 規劃單 |
| workflow_skill_fit | 2026-05-30 | 完成（過期） | 12 個舊 skill 的適用性評級；skill 集合已重切 |
| workflow_v2_delivery | 2026-07-20 | 決策（部分翻案） | Prototype 為介面互動正本；現由 AGENTS 承載 |


### 3. feedback 類逐張（61 張）

代號：A＝AGENTS.md 有對應（陷阱表同義列或其他段）；S＝已在某 skill 或 wiki 規範；X＝過期或與現行正本矛盾；M＝只在記憶卡。判定依內容讀取，未逐字核對。卡名省略 `feedback_` 前綴。

| 卡 | mtime | 代號 | 備註 |
|---|---|---|---|
| always_traditional_chinese | 2026-06-09 | A | AGENTS 陷阱表列 2；全域 CLAUDE.md 與 settings language 已規定；卡內稱 config.yaml（已不存在） |
| amendment_advice_and_honesty | 2026-05-30 | S | wiki-amend 限制：每筆增修先給建議、影響、優缺點 |
| analogy_scaffold_plain_language | 2026-05-31 | S | 全域 CLAUDE.md 用語段與共用規範用語規則；部分，未逐字核對 |
| audit_subagent_against_skill | 2026-09-04 | A | 陷阱表列 21；全域 CLAUDE.md「轉述前必查證」同義 |
| brd_methodology | 2026-06-10 | S | 共用規範 § 二撰寫流程；卡內寫三次 BRD 重構期的教訓 |
| check_sensation_api_asis | 2026-08-11 | A | 陷阱表列 20；卡內寫後端正本是 sens-print-core，AGENTS 寫 sensation-api |
| check_shared_components_when_diffing | 2026-09-21 | A | 陷阱表列 25 |
| contradiction_must_stop | 2026-06-10 | A | 陷阱表列 13；AGENTS「停下與繼續」、共用規範 § 三、wiki-amend 同義 |
| delete_deprecated_templates | 2026-06-11 | S | 共用規範：作廢卡改 deprecated 並移 _archives；範本不放源由部分未查證 |
| describe_in_business_terms | 2026-06-11 | S | 全域 CLAUDE.md「對 PM 優先業務術語」；STE100 用詞段 |
| design_scope_discipline | 2026-08-19 | S | 規劃品質評分準則 § 八範圍紀律；erp-plan 引用 |
| entity_not_module | 2026-10-29 | A | 陷阱表列 7 |
| erp_reuse_existing_flows | 2026-05-08 | M | 設計偏好；評分準則是否收錄未查證 |
| erp_spec_merge_direct_no_pr | 2026-10-27 | A | AGENTS § 版本控管；卡內自述只留理由，且稱「專案 CLAUDE.md」 |
| features_mece_no_rules_in_project | 2026-09-03 | S | linear-delivery 規範：project 描述不寫規則、Feature 票互斥；未逐字核對 |
| flow_data_first_no_ux | 2026-11-04 | A | 陷阱表列 9；erp-plan 限制第 8 條同句 |
| hide_unavailable_actions | 2026-09-08 | A | 陷阱表列 31；ui-business-rules.md 無對應句 |
| impact_score_gun_framework | 2026-03-25 | X | 引用 pm-guideline.md，repo 內不存在此檔 |
| implement_all_spec_requirements | 2026-05-16 | X | 前提是 OpenSpec change；OpenSpec 已退場 |
| industry_best_practice_first | 2026-06-15 | S | 審查知識路由與參考模型卡；project 卡 erp_mes_design_baseline |
| invoice_reconciliation_flexibility | 2026-05-18 | M | 設計偏好；是否已在 wiki 款項規則卡未查證 |
| jidoka_stop_first_design | 2026-08-11 | A | 陷阱表列 12；領域知識卡「豐田式生產管理對映」 |
| linear_comment_format | 2026-09-04 | A | 陷阱表列 29；linear-delivery SKILL 陷阱表同義 |
| linear_fix_restructure_not_append | 2026-10-07 | A | 陷阱表列 28；卡內另含「撰寫 Sonnet、稽核 Opus、推理中等」，與 AGENTS 模型分工衝突 |
| linear_issue_via_pm_team | 2026-07-07 | A | 陷阱表列 30；linear-delivery SKILL 步驟與陷阱同義 |
| linear_task_prefix | 2026-08-21 | S | linear-delivery 規範 § Task 標題格式；本卡未列入 MEMORY.md 索引 |
| linear_ticket_wiki_only | 2026-08-27 | X | 寫「不看 prototype」；現行 linear-delivery 規範取材含 Prototype、情境目錄 |
| linear_v4_ticket_format | 2026-09-03 | X | v4（2026-08-27）；現行 linear-delivery v6.x、project 卡寫 v5 |
| meaningful_guards | 2026-08-12 | A | 陷阱表列 11 |
| model_split_opus_for_agents | 2026-09-15 | A | AGENTS § 模型分工；數值與其他卡、設定不一致（見三之 4） |
| no_asis_term | 2026-09-20 | A | 陷阱表列 3 |
| no_deadline_assignment | 2026-08-04 | S | 規範 - OQ 與 wiki-schema 已改選填（卡內自述）；wiki-schema 第 369 行 |
| no_english_replies | 2026-10-26 | A | 陷阱表列 1 |
| no_invented_phrasing | 2026-07-08 | S | 全域 CLAUDE.md 台灣用語段與 non-business-terms.md；部分 |
| no_over_design_on_oq | 2026-08-01 | A | 陷阱表列 10 |
| no_staging_before_commit | 2026-09-23 | A | 陷阱表列 19；「代理一律用工作樹」規則後適用範圍縮小 |
| operation_terms_exact | 2026-10-23 | A | 陷阱表列 5 |
| oq_closure_resolve_then_archive | 2026-06-11 | S | oq-manage 封存制與規範 - OQ 的 cancelled 語意 |
| oq_naming_convention | 2026-03-24 | X | 針對 Notion Follow-up DB；oq-manage 寫該推送已暫停 |
| prefer_state_definitions_for_conditions | 2026-10-22 | A | 陷阱表列 6 |
| production_task_standardized | 2026-09-03 | M | 卡內自述段 2 三變體已推翻；規則本體應在 wiki 生產任務卡，未查證 |
| prototype_layout_follow_source | 2026-10-27 | M | erp repo prototype-from-prompt 的補充；搬移案已完成 |
| prototype_mirror_reality | 2026-04-19 | M | mock 貼近真實；MOCK-DATA-CHAIN.md 在 erp repo，未在本 repo 驗證 |
| prototype_pr_no_linear_link | 2026-09-22 | A | 陷阱表列 26 |
| prototype_scope_strict | 2026-09-03 | A | 陷阱表列 23 |
| prototype_upload_real_file_picker | 2026-05-29 | M | 2026-05 單點偏好 |
| publish_ci_gate_no_pipe | 2026-09-22 | A | 陷阱表列 27 |
| read_architecture_card_first | 2026-08-10 | X | 陷阱表列 15 引用；要求讀 raw 設計收斂記錄，與 erp-plan「設計者不讀 raw」相反 |
| read_prototype_skill_before_direct_edit | 2026-09-23 | A | 陷阱表列 24；AGENTS § Prototype 與測試也寫 MUST 經該 skill |
| rule_names_no_counts | 2026-09-23 | A | 陷阱表列 4；oq-manage、vault-ingest 限制句同義 |
| scope_expansion_needs_checkpoint | 2026-07-21 | M | 與 AGENTS「停下與繼續：缺 Miles 的決策」部分重疊 |
| search_scope | 2026-03-25 | X | 限 /Users/b-f-03-029/Sens；與 AGENTS 讀碼範圍（讀 erp、後端）矛盾 |
| state_contract_once_no_overprocessing | 2026-06-01 | S | AGENTS § 正本分層「同一內容只有一個家」；共用規範 § 二之四 |
| ste100_output_style | 2026-11-04 | S | output-styles/ste100-pm.md 與 SubagentStart hook |
| subagent_tier_blind_test_20260915 | 2026-09-15 | A | AGENTS § 模型分工；本卡性質是盲測結果紀錄 |
| tests_smoke_and_module_only | 2026-10-23 | A | 陷阱表列 32；AGENTS § Prototype 與測試同句；卡內稱「Sens CLAUDE.md」 |
| tools_first_scenarios_validate | 2026-10-06 | A | 陷阱表列 8 |
| trace_fact_source_chain | 2026-08-10 | A | 陷阱表列 14；erp-audit 陷阱第 7 條同義 |
| wiki_data_governance_no_overlap | 2026-10-13 | A | 陷阱表列 17 |
| wiki_link_not_text_path | 2026-06-14 | A | 陷阱表列 16；wiki AGENTS § 三、wiki_lint S5 同義 |
| wiki_single_direction_reference | 2026-10-27 | S | 共用規範 § 四第 1 條、規範 - 實體 § 三（卡內自述已落） |

小計：A 32、S 15、X 7、M 7，合計 61。其中陷阱表有同義列的卡 30 張（陷阱表 32 列中，列 18 對應 project 類 obsidian_link_stability，列 22 沒有記憶卡）。

### 4. 互相矛盾或已被後來的卡翻案

| # | 甲方 | 乙方 | 性質 |
|---|---|---|---|
| 1 | feedback_search_scope：搜尋只能在 /Users/b-f-03-029/Sens 以內 | AGENTS.md § 工作入口讀碼範圍：Prototype 在 /Users/b-f-03-029/erp，後端 sens-print-core 與 sensation-api 在 Sens 之外；全域 settings 允許 `Read(//Users/b-f-03-029/**)` | 矛盾 |
| 2 | feedback_linear_ticket_wiki_only：Linear 內容只取材 wiki、不看 Prototype | linear-delivery 規範 § 一與 SKILL 限制：取材 wiki、Prototype、情境目錄；AGENTS § 正本分層同 | 矛盾；後者較新 |
| 3 | feedback_linear_v4_ticket_format（v4，2026-08-27） | linear-delivery CHANGELOG v6.3、v6.4；project_linear_format_redesign_grill_20261012 寫三層格式 v5 | 翻案 |
| 4 | feedback_model_split_opus_for_agents：實作與稽核 Opus high，Sonnet 只留純機械 | feedback_linear_fix_restructure_not_append（2026-10-07）：撰寫 Sonnet、稽核 Opus、推理中等，並註記「覆蓋 09-15 舊分工」；AGENTS § 模型分工：子代理實作 Opus high、查找與重複任務 Sonnet；erp-plan 限制：平行盤點 opus、effort high；settings.json：`CLAUDE_CODE_SUBAGENT_MODEL=opus[1m]`、`effortLevel: medium`；agents/plan-auditor.md 寫「模型暫定 opus，待 D8」 | 至少 5 處數值互不相同 |
| 5 | feedback_read_architecture_card_first：設計前必讀 source 指向的 raw 設計收斂記錄 | erp-plan 限制「設計者不讀 raw」；project_skill_rewrite_c5 拍板 1「設計以商業現況需求為準，wiki 是設計邊界」；AGENTS.md 陷阱列 15 仍引用前者 | 矛盾 |
| 6 | feedback_oq_naming_convention：Notion Follow-up DB 的任務名稱不放序號 | oq-manage 限制：Notion Follow-up DB 推送暫停 | 過期 |
| 7 | project_shipment_logistics_split_grill_20261020：G31 拿掉批次拋單、不設單筆重試（索引說明仍寫「無批次拋單與單筆重試」） | project_shipment_batch_dispatch_box_size_grill_20261022：批次拋單，推翻 G20、G31 | 翻案；索引說明未更新 |
| 8 | project_delivery_date_naming_20260911（十五條）與 project_print_item_delivery_date_20260908 | project_delivery_date_redefinition_20260921：改用公司日期名稱，第 2、9、10、14 條翻案 | 翻案（卡內自述） |
| 9 | project_workflow_change_as_design_carrier_20261022、project_planning_flow_reform、project_workflow_boundary_grill_20261004、project_sdd_workflow_improvement：以 OpenSpec change 為設計載體、/opsx:propose、plan-design 與 plan-audit | AGENTS.md：規劃單是 `.scratch/<主題>/spec.md`，做完不合併；repo 無 openspec 資料夾；project_skill_rewrite_c5 已重切 skill | 整組過期 |
| 10 | project_erp_repo_prototype_workflow：唯一長期分支 prototype/production-stage；feedback_model_split 寫「不開 PR」 | AGENTS.md § Prototype 與測試：開分支加前端主管 PR 合併；feedback_prototype_pr_no_linear_link 與 project_shipment_* 記載 PR #230 至 #244 合進 develop | 三處說法不一，未查證現況 |
| 11 | feedback_check_sensation_api_asis：ERP 後端正本 /Users/b-f-03-029/sens-print-core（卡名與標題寫 sensation-api）；linear-delivery SKILL 寫 sens-print-core | AGENTS.md 第 48 行與陷阱列 20 寫 sensation-api；三個目錄 sensation-api、sens-print-core、erp 都存在 | 名稱不一致；哪個是現況正本未查證 |
| 12 | feedback_impact_score_gun_framework：依 pm-guideline.md § 四的 G.U.N. 框架 | repo 內沒有 pm-guideline.md | 引用失效 |

另有三處引用已改名的檔：feedback_erp_spec_merge_direct_no_pr 與 feedback_tests_smoke_and_module_only 稱「專案 CLAUDE.md」（現為 AGENTS.md）；feedback_always_traditional_chinese 稱 config.yaml（OpenSpec 退場後不存在）。

### 5. repo 內的 memory/MEMORY.md

`memory/MEMORY.md`（repo 內，6 行）只列 2 筆：`feedback_oq_management.md`（repo 內不存在，記憶目錄也沒有）與 `../shared/notion-mcp-guidelines.md`。與 `~/.claude/.../memory/MEMORY.md`（150 行）是兩份不同的索引，前者已失效。AGENTS.md § 版本控管說「改 memory/ 連同 AGENTS.md 一起提交」，指的是 repo 內 memory/（wiki、erp 規劃紀錄、shared），與自動記憶目錄不是同一處。

## 四、專案 skill

### 1. 七個專案 skill

| skill | 檔數 | 總行數 | references | scripts | 一句話目的 |
|---|---|---|---|---|---|
| erp-audit | 7 | 430 | 稽核者派工單 57、推演者派工單 57、誤判要素 60、評測集 52；CHANGELOG 23 | 收件檢查.py 106 | 審規劃單 spec.md 是否符合規劃品質評分準則，Miles 指出誤判時建檔 |
| erp-plan | 7 | 441 | 設計收件 61、調研判斷 41、衝突檢查 33、盤點方法 55、平行盤點.workflow.js 135；CHANGELOG 39 | 無（.workflow.js 放在 references） | 動 ERP 流程、規則、欄位前先盤點正本卡、現況缺口、調研建議 |
| linear-delivery | 6 | 1509 | 規範 339、範本 198、範例 388、blocked-cases-log 277；CHANGELOG 156 | 無 | 把已實作的模組整理成 Linear project、Feature 票、Task 票，經稽核與盲測後寫入 |
| oq-manage | 5 | 203 | 去重方法 35、待裁決清單格式 40、整理報告格式 29；CHANGELOG 28 | 無 | 開、去重、拍板、封存待裁決問題卡（OQ） |
| vault-audit | 7 | 2096 | 稽核維度 225、判讀派工單 49；CHANGELOG 20 | wiki_lint.py 549、authority_check.py 431、mechanical_check.py 745 | wiki 健檢：矛盾、過時、孤島、死鏈、缺欄位、違規；同一支 lint 供寫入掛鉤使用 |
| vault-ingest | 6 | 242 | 去處表 39、調研派工單 49、查證紀錄格式 30、掃描報告格式 30；CHANGELOG 17 | 無 | 素材先進 raw、調研派工、精練 raw 進 wiki 的分流與防線 |
| wiki-amend | 5 | 293 | 落點判準 108、連帶分析 41、下游更正表 33；CHANGELOG 28 | 無（用 vault-audit 的 wiki_lint.py） | 正本卡與 11 層卡的唯一寫入入口，一個事實只落一張卡 |

算法：`find .claude/skills/<名> -type f | while read f; do wc -l < "$f"; done`，每個 skill 的 SKILL.md 行數另算入總行數（erp-audit 75、erp-plan 77、linear-delivery 151、oq-manage 71、vault-audit 77、vault-ingest 77、wiki-amend 83）。CHANGELOG 合計 23+39+156+28+20+17+28＝311 行。

### 2. 其餘 skill（不是本專案自寫者）

| skill | 檔數 | 行數 | 外部通用？ |
|---|---|---|---|
| defuddle | 1 | 41 | 是（網頁轉 markdown 的通用 skill）；依內容與名稱推定，未查原始來源 |
| frontend-design | 1 | 42 | 是（frontmatter 有 license 欄；.claude/settings.local.json 有從 anthropics 倉庫 curl 取得的紀錄）；與本專案無關（Prototype 在 erp repo） |
| json-canvas | 2 | 573 | 是（Obsidian 通用） |
| obsidian-bases | 2 | 670 | 是（Obsidian 通用） |
| obsidian-markdown | 4 | 378 | 是（Obsidian 通用） |
| obsidian-cli | 不在 repo | — | 是；位於 ~/.claude/skills/obsidian-cli，專案 skill 與 wiki AGENTS 都指定使用 |

另：`~/.claude/skills/gstack`（外部，近 60 天 0 次）；`~/.claude/skills-disabled/` 有 impeccable、openspec；外掛 mattpocock-skills 1.3.2、andrej-karpathy-skills、product-management、watch、eli5 為啟用，其餘 pm-skills 外掛 settings 中設為 false。

### 3. 彼此重疊的職責

| 重疊的兩者 | 重疊內容 | 證據 |
|---|---|---|
| wiki-amend 與 vault-audit | 同一支 wiki_lint.py：wiki-amend 步驟 3 與 vault-audit 步驟 2、維度 16 都跑；寫入掛鉤與 pre-commit 也跑。「收件自檢」與「機械維度」是同一批檢查的兩個入口 | wiki-amend/SKILL.md 步驟 3；vault-audit/SKILL.md 步驟 2；settings.json PostToolUse；.githooks/pre-commit |
| erp-plan 與 wiki-amend | 「連帶影響」各寫一份：erp-plan 盤點報告列連帶影響與須更新的卡；wiki-amend 有「連帶分析.md」與「下游更正表」 | erp-plan/SKILL.md 產出表；wiki-amend/references/連帶分析.md |
| erp-plan、vault-audit 維度 1、AGENTS、共用規範 § 三 | 矛盾偵測與停下：erp-plan 衝突檢查、vault-audit 維度 1 頁面間矛盾、AGENTS「停下與繼續」 | 各檔 |
| erp-audit 與 linear-delivery | 都用「撰寫者、稽核者、受測者／懷疑者三方分離」；各自一套派工單與案例紀錄（誤判記錄、blocked-cases-log） | erp-audit/references；linear-delivery/SKILL.md 限制 |
| oq-manage 與 vault-audit | OQ 健康度（維度 8）與 oq-manage 整理報告（mode E）都量 OQ 停留；門檻分別寫在不同檔（腳本讀不到 oq-manage 門檻時略過） | vault-audit/references/稽核維度.md 維度 8；oq-manage/references/整理報告格式.md |
| vault-ingest 與 vault-audit | raw 健康度（維度 9）與 vault-ingest 掃描報告（mode C）都量 raw 停留與累積 | 稽核維度.md 維度 9；vault-ingest/references/掃描報告格式.md |
| erp-plan 與 vault-ingest | 調研：erp-plan 調研判斷決定要不要，vault-ingest 調研派工單負責派；兩者之間以 Miles 同意為閘門 | 兩個 SKILL.md |
| 7 個 skill 的陷阱表 | 同一歷史事件寫兩次：「2026-05-30 pre-check v1.1」與「2026-10-27 rush-order precheck § 四」同時在 erp-plan 與 wiki-amend；「依賴未決 OQ 判部分通過」在 erp-audit 與 oq-manage | grep -F 這些字串 |
| 7 個 skill 的 CHANGELOG | 全部標明「只追加層」；其內容與 git log 重複（git 已有每次改動） | 311 行 |


### 4. 各 skill 引用的 wiki 規範卡

依 SKILL.md 與 references 內的 `[[卡名]]` 統計（不含 CHANGELOG 與程式碼內的格式字串）。

| skill | 引用的 wiki 卡與規範 |
|---|---|
| erp-audit | 稽核誤判記錄（11）、規劃品質評分準則（6）、審查知識路由（5）、archive-completeness-misjudgement、business-domain-taxonomy |
| erp-plan | 規劃品質評分準則（3）、business-domain-taxonomy（2）、audit-failure-patterns（2）、卡片撰寫共用規範（2）、審查知識路由（2）、規範 - 資料結構總覽、生產領域資料結構總覽、帳務規劃連帶矩陣；wiki/log.md |
| linear-delivery | 規劃品質評分準則（1）；wiki 受控清單（範圍用詞）；情境目錄 erp-prototype-tests/docs/scenario-catalog.md |
| oq-manage | 規範 - OQ（10）、規劃品質評分準則（2）、範本 - OQ、business-domain-taxonomy、wiki/log.md；一處指向不存在的 `memory/Sens_wiki/CLAUDE.md`（已改名 AGENTS.md） |
| vault-audit | 卡片撰寫共用規範（7）、稽核誤判記錄（4）、wiki-schema、scope-boundary、business-domain-taxonomy、erp_index、審查知識路由、memory/Sens_wiki/AGENTS.md；腳本讀 memory/erp/wiki-normalization-20261104/掛鉤檢查項.md（在 repo 的 memory/erp，不在 wiki） |
| vault-ingest | 審查知識路由（4）、scope-boundary、範本 - Raw 素材、wiki/log.md |
| wiki-amend | 卡片撰寫共用規範（3）、規範 - 商業邏輯（3）、帳務規劃連帶矩陣（2）、審查知識路由（2）、ERP 詞彙表、規範 - 詞彙表、規範 - 實體、scope-boundary、wiki-schema、流程架構、受控清單、範本 - 參考模型、稽核誤判記錄、規劃品質評分準則、log.md、index.md、各單元規範與範本與範例卡 |

算法：Python 對各 skill 目錄（排除 CHANGELOG）擷取 wikilink 並計次，括號內為出現次數；只對次數大於 1 者標註。
死連結：skill 與 AGENTS 內的路徑掃描只找到 2 個不存在的路徑——`memory/Sens_wiki/CLAUDE.md`（oq-manage/SKILL.md）、`.claude/workflows/erp-precheck-audit.js`（erp-plan/CHANGELOG.md，描述歷史，不算錯）。算法：Python 掃 `memory/`、`docs/`、`.claude/`、`erp-prototype-tests/`、`.scratch/` 開頭的 .md／.py／.js 路徑，`os.path.exists` 判定。

## 五、hook 與設定

### 1. 設定檔

| 檔 | 進版控？ | hooks | permissions.allow | 其他 |
|---|---|---|---|---|
| `.claude/settings.json` | 是 | PostToolUse，matcher `Write\|Edit\|MultiEdit`：執行 `wiki_lint.py --hook`（有錯誤回傳結束碼 2，退回代理重寫） | 53 項（WebFetch 4） | — |
| `.claude/settings.local.json` | 否（.gitignore 第 17 行）。主檢出與本工作樹的允許清單相同（diff 無差異），其餘工作樹是否有副本未查 | Stop：`exit 0`（無作用）；PostToolUse，matcher `Bash`：指令含 `git commit` 時執行 `git push 2>/dev/null \|\| true`（AGENTS.md 所稱「提交後 hook 自動推送」的實作處） | 179 項（WebFetch 35） | enabledMcpjsonServers：notion、figma、figma-desktop（本工作階段 figma-desktop 連線失敗，ECONNREFUSED） |
| `~/.claude/settings.json` | 否（使用者層） | SubagentStart：執行 `~/.claude/hooks/ste100-subagent-context.py` | 42 項（WebFetch 11） | env：CLAUDE_CODE_SUBAGENT_MODEL=opus[1m]、CLAUDE_CODE_PLUGIN_DIRS=erp-test-map；model fable[1m]；effortLevel medium；outputStyle STE100 PM；defaultMode auto；enabledPlugins 5 啟用、48 停用 |
| `.githooks/pre-commit` | 是 | 提交前：暫存區有 `memory/Sens_wiki/wiki/*.md` 時執行 `wiki_lint.py --staged`，錯誤即拒絕提交；找不到腳本即略過 | — | — |
| `.git/hooks/` | — | 只有 .sample 範例，無啟用的 hook | — | — |
| `.claude/launch.json` | 是 | — | — | 3 個開發伺服器設定：erp（3000）、erp-verify（3020）、erp-shipment-logistics（3031，指向 /Users/b-f-03-029/erp-shipment-logistics，該目錄不存在） |

算法：`python3 -c "import json;print(len(json.load(open(p))[\"permissions\"][\"allow\"]))"`；hooks 直接讀 JSON。

`core.hooksPath` 的實際值：共用設定（.git/config）為 `/Users/b-f-03-029/Sens/.githooks`。下列 7 個工作樹的 config.worktree 把它覆寫為 `/Users/b-f-03-029/Sens/.git/hooks`（內容只有範例檔），所以這 7 個工作樹的提交不跑 pre-commit 的 wiki 檢查：check-account-credits-4b0b83、happy-rhodes-e5ffe3、print-details-quantity-progress-db75ca、printvis-coverage-research-fe1425、process-improvement-four-4a13d5、sap-coverage-research-e42cb1、shipping-logistics-features-dd104a。其中 print-details-quantity-progress（分支 claude/wiki-normalization-98ca14）正是做批 6 的工作樹。
算法：對 `git worktree list` 每個路徑執行 `git -C <路徑> config --show-origin core.hooksPath`。

版控的疑點：`git ls-files .claude/worktrees` 顯示 `.claude/worktrees/beautiful-neumann-a844ac/.claude/settings.local.json` 被追蹤進索引，與 .gitignore 規則並存。另外 `.gitignore` 第 5 至 7 行的註解仍寫「本 repo 的 CLAUDE.md 是分層規則正本」，現已改名 AGENTS.md。

### 2. permissions 過期項目數

| 檔 | 允許清單總數 | 過期項數 | 分類（項數） |
|---|---|---|---|
| `.claude/settings.json` | 53 | 7 | 不存在的 nvm 路徑 3；不在本 repo 的路徑 3（`/Sens/spec`、src/data/mockWorkOrders.ts 的 sed 兩條）；已不存在的 skill 1（`Edit(/.claude/skills/erp-spec/**)`） |
| `.claude/settings.local.json` | 179 | 58 | 已刪除的 worktree（agent-ad85f79b、funny-thompson-4b61be、zealous-bardeen-16ede8）22；OpenSpec 12；不在本 repo 的路徑 8（src/data、SearchableSelect、AddProductionTaskPanel、mockDispatch、ui-design-system、US-ORD-022、wiki-schema 相對路徑）；已不存在的 skill 7（erp-spec、doc-audit、notion-to-github）；一次性腳本或暫存路徑 6；已不存在的 Notion 工具名 3 |
| `~/.claude/settings.json` | 42 | 6 | 已不存在的 skill 4（erp-spec 兩條、erp-test-case、doc-audit）；不存在的 nvm 路徑 2 |
| 合計 | 274 | 71 | `Edit(/.claude/skills/erp-spec/**)` 同一條出現在三個檔，唯一值為 69 |

判定方法：以 pattern 比對（erp-spec、doc-audit、notion-to-github、erp-test-case、openspec、已刪 worktree 名稱、src/data、SearchableSelect、AddProductionTaskPanel、mockDispatch、ui-design-system、US-ORD-022、`wiki-schema.md)`、nvm、migrate_us_single_stage、extract_billing、user_scenarios_table、temp/readonly、`notion-query-database-view`、`claude_ai_Notion`），再確認 pattern 所指的目標不存在（`~/.nvm` 不存在；`git worktree list` 沒有那三個工作樹；repo 無 openspec 資料夾與上述 skill 目錄）。pattern 比對可能漏掉其他過期項，所以 71 是下限。figma-desktop 工具（settings.json 1 條、全域 3 條）不計入，因為 `.mcp.json` 仍列出該伺服器。WebFetch 共 50 條為一次性調研網域，不計入過期，但同屬可清除項。
另有大範圍規則涵蓋細項：`.claude/settings.local.json` 有 `Bash(grep:*)`、`Bash(python3:*)`、`Bash(awk *)`、`Bash(git log *)`、`Bash(git status *)` 等，許多帶具體參數的單筆規則因此冗餘。冗餘項數未逐條計算。

### 3. vault-audit/scripts 與其他腳本各檢查什麼

| 腳本 | 行數 | 檢查內容 | 觸發方式 |
|---|---|---|---|
| `vault-audit/scripts/wiki_lint.py` | 549 | 單卡規則 S1 至 S15：S1 卡頭欄位值域與領域 tag；S2 相對引用、行號引用、重複來源、簡體字、寫死數量的名稱；S3 下游使用句、未拍板的守衛；S4 待確認措辭、`[!question]`、別名連結；S5 連結與標題存在；S6 正本卡連到封存卡；S7 避免用詞；S8 定義句型出現在詞彙表以外；S9 逐字相同長句；S10 換說法的重複句；S11 基數出現在總覽卡以外；S12 規則句訊號出現在規則卡與狀態機卡以外；S13 規則卡至少連一個實體或狀態機；S14 詞彙表格式；S15 source 只能是出處指標。跨卡規則 X5。`--staged` 另重產 erp_index 清單 | PostToolUse 寫檔後（`--hook`）、`.githooks/pre-commit`（`--staged`）、vault-audit 維度 16（`--all`）、wiki-amend 步驟 3（`--cross`） |
| `vault-audit/scripts/authority_check.py` | 431 | 活動清單卡、實體卡操作段、狀態機觸發操作欄、情境卡活動欄的格式與關聯（OP-、ACT- 編號格式與引用）；只檢查已轉成新結構的卡，舊結構卡略過並計數；唯讀 | vault-audit 維度 15；wiki-amend 動到權責相關卡時手動跑 |
| `vault-audit/scripts/mechanical_check.py` | 745 | 維度 2、5、6、7、8、9、10、11、17：過時宣稱、frontmatter 完整性、規約遵守、出鏈有效性、OQ 健康度、Raw 健康度、標題錨點、log 完整性、審查知識層健康；唯讀。被 wiki_lint.py 以 import 引用 | vault-audit 步驟 2 |
| `erp-audit/scripts/收件檢查.py` | 106 | 規劃資料夾有 spec.md；spec.md 有 matt to-spec 範本七節標題；Implementation Decisions 與 Testing Decisions 兩節不為空；唯讀 | erp-audit 步驟 1 |
| `erp-plan/references/平行盤點.workflow.js` | 135 | 以工作流程工具平行盤點多領域（參數 topic、domains、model、effort） | erp-plan 涉及兩個領域以上 |
| `~/.claude/hooks/ste100-subagent-context.py` | 約 28 | 讀 ste100-pm.md、去掉 frontmatter，包成 SubagentStart 的 additionalContext；讀不到檔即靜默略過 | SubagentStart |

lint 等級現況：`wiki_lint.py` 的 `DEFAULT_ERROR` 只有 S1、S2、S4；其餘規則依 `稽核維度.md` § 一的 `lint_error_codes` 升級，該值目前為「無」；`lint_done_domains`（已完成遷移的領域，避免用詞即為錯誤）目前也是「無」。批 0 至 5 已併入 master，但這兩個設定值仍未填，等於新增的 S5 至 S15 規則與避免用詞目前都只是警告。

## 六、子代理定義（.claude/agents/）

| 檔 | 行數 | 模型與工具 | 用途 | 備註 |
|---|---|---|---|---|
| plan-auditor.md | 30 | model: opus；Read、Grep、Glob、Bash（限唯讀指令） | erp-audit 派用，擔任稽核者、推演者、懷疑者；依派工單判定，不改檔、不給修改建議，每項附證據 | 內文仍寫「模型暫定 opus，待 D8 量測結果決定」；近 60 天以 subagent_type 派用 17 次 |
| erp-researcher.md | 30 | model: sonnet；WebSearch、WebFetch、Read、Grep、Glob、Write（只准寫 scratchpad） | erp-plan 調研建議經 Miles 同意後，由 vault-ingest 派用；查業界做法，回 raw 骨架草稿 | 近 60 天派用 4 次 |

歷史上曾有 senior-pm（2 次）、ceo-reviewer（1 次）、erp-consultant（1 次）三個 subagent_type，已於 2026-08-05 廢除（記憶卡 planning_flow_reform）。對話紀錄中 subagent_type 次數最多者為 general-purpose（近 60 天 483 次）、fork（24）、Explore（11）。

## 七、使用證據

### 1. 方法與限制

| 項目 | 做法 | 限制 |
|---|---|---|
| git 改動次數 | `git log master --since="2026-09-12" --oneline -- <路徑> \| wc -l`；60 天起點 2026-09-12（今天 2026-11-11 減 60 天）；只看 master（不含其他分支）。同時列「全期」與最後改動日 | erp-audit、erp-plan 與 AGENTS.md 是 11 月 4 日由舊名改名而來，路徑歷史從 11 月 4 日起算；舊名另列。目錄層級的次數是「有動到該目錄的提交數」，不是行數 |
| 對話紀錄的 Skill 呼叫 | 讀 `~/.claude/projects/-Users-b-f-03-029-Sens*/`（15 個目錄，含各工作樹與子代理，合計 2122 個 .jsonl、約 2.4 GB），Python 逐行解析 `"name":"Skill","input":{"skill":` 的 tool_use 區塊，以 tool_use id 去重（復原與分支的工作階段會複製歷史）。共 431 筆不重複呼叫。程式在 scratchpad：skillcount.py | 只算模型經 Skill 工具的呼叫。使用者手動斜線指令另算（下表）；`grill-with-docs`、`to-spec`、`to-tickets`、`implement` 標 `disable-model-invocation: true`，不會出現在 Skill 呼叫，且斜線指令偵測（`<command-name>` 標籤）也沒抓到這幾個，所以其實際使用次數未知。經 Read 直接讀 SKILL.md 的使用不計入 Skill 呼叫（另列）。紀錄保存期限不明，最早命中日 2026-05-15 |
| 斜線指令與 Read、Agent、Bash | 同一批 .jsonl：`<command-name>` 標籤、Read 的 file_path 含 `.claude/skills/<名>/`、Agent 的 subagent_type、Bash 與 Workflow 指令字串含腳本名；以 uuid 或 tool_use id 去重。程式：skillcount2.py、bashcalls.py | 「Bash 指令含腳本名」包含子代理跑的次數；寫入 hook 自動執行 wiki_lint 不經 Bash 工具，不計入 |


### 2. 各 skill 與入口（近 60 天為 2026-09-12 起）

| 名稱 | Skill 呼叫全期 | 近 60 天 | 其中子代理 | 首次 | 最後 | 備註 |
|---|---|---|---|---|---|---|
| wiki-amend | 66 | 26 | 14 | 2026-07-27 | 2026-10-28 | 另有 Read SKILL.md 39 次（近 60 天 21） |
| oq-manage | 47 | 18 | 4 | 2026-07-21 | 2026-10-28 | Read 17（5） |
| linear-delivery | 24 | 12 | 0 | 2026-08-03 | 2026-11-05 | Read 19（9） |
| vault-audit | 16 | 1 | 2 | 2026-06-13 | 2026-10-27 | Read 19（1） |
| vault-ingest | 5 | 1 | 2 | 2026-07-27 | 2026-10-28 | Read 5（0） |
| erp-plan（新名，11-04 起） | 3 | 3 | 0 | 2026-11-04 | 2026-11-05 | 前身 erp-planning-pre-check 19（近 60 天 10）、plan-design 17（9）；三者合計 39（22） |
| erp-audit（新名，11-04 起） | 0 | 0 | 0 | — | — | 前身 plan-audit 19（8）、misjudgement-record 4（2）；三者合計 23（10） |
| obsidian-cli | 46 | 25 | 26 | 2026-08-01 | 2026-11-05 | 絕大部分由子代理呼叫 |
| mattpocock-skills:grilling（Skill 呼叫） | 25 | 12 | 1 | 2026-07-27 | 2026-11-05 | 另有使用者斜線指令 70 次（近 60 天 25）、grill-me 斜線 11 次（5） |
| andrej-karpathy-skills:karpathy-guidelines | 8 | 7 | 7 | 2026-09-03 | 2026-10-22 | 子代理為主 |
| workflow-authoring | 5 | 5 | 1 | 2026-09-16 | 2026-11-03 | — |
| defuddle | 1 | 0 | 0 | 2026-07-28 | 2026-07-28 | — |
| json-canvas、obsidian-bases、obsidian-markdown、frontend-design | 0 | 0 | 0 | — | — | 全期未被 Skill 工具呼叫 |
| opsx:* 系列（OpenSpec 流程） | 53 | 14 | — | 2026-05-15 | 2026-10-27 | repo 內沒有 openspec 資料夾；這些 skill 的來源未查證（~/.claude/skills-disabled/ 內有 openspec） |
| openspec-* 系列 | 21 | 12 | — | — | 2026-11-03 | 同上；最後一筆 openspec-archive-change 在 11-03 |
| i-have-adhd-zh-tw | 17 | 0 | 3 | 2026-07-22 | 2026-08-11 | 不在專案 skill 目錄 |

斜線指令（使用者手動）：`mattpocock-skills:grilling` 70、`model` 14、`grill-me` 11、`goal` 5，其餘 1 次。算法：skillcount2.py。
子代理派用（Agent 工具 subagent_type）：general-purpose 1094（近 60 天 483）、Explore 85（11）、fork 24（24）、plan-auditor 17（17）、erp-researcher 4（4）。

### 3. 腳本與測試指令的使用（Bash 呼叫含該字串，全期均落在近 60 天內者以 60 天欄為準）

| 字串 | 全期 | 近 60 天 |
|---|---|---|
| wiki_lint.py（手動，不含 hook 自動觸發） | 184 | 184 |
| authority_check.py | 260 | 260 |
| mechanical_check.py | 26 | 26 |
| 收件檢查.py | 27 | 27 |
| 平行盤點.workflow（erp-plan 的工作流程腳本） | 10 | 10 |
| npm run impact | 140 | 136 |
| npm run test:smoke | 169 | 138 |
| npm test | 71 | 60 |
| obsidian（CLI 指令） | 494 | 234 |


### 4. git 改動次數（master，2026-09-12 至 2026-11-11 共 567 筆提交）

| 路徑 | 近 60 天 | 全期 | 最後改動日 | 備註 |
|---|---|---|---|---|
| .claude/skills/erp-audit | 6 | 6 | 2026-11-04 | 舊名 plan-audit 14（60d 6）、misjudgement-record 10（4） |
| .claude/skills/erp-plan | 5 | 5 | 2026-11-04 | 舊名 erp-planning-pre-check 30（9）、plan-design 14（9） |
| .claude/skills/linear-delivery | 21 | 86 | 2026-11-05 |  |
| .claude/skills/oq-manage | 5 | 29 | 2026-11-04 |  |
| .claude/skills/vault-audit | 18 | 55 | 2026-11-05 | 含三支腳本 |
| .claude/skills/vault-ingest | 5 | 18 | 2026-11-04 | 舊名 vault-insight 13（最後 2026-08-01） |
| .claude/skills/wiki-amend | 13 | 37 | 2026-11-04 |  |
| .claude/skills/defuddle、frontend-design、json-canvas、obsidian-bases、obsidian-markdown | 0 | 各 1 | 2026-03-23 至 2026-06-10 | 只有加入時的一筆提交 |
| .claude/agents | 3 | 36 | 2026-11-04 | 全期含已廢除的三 agent |
| .claude/settings.json | 3 | 9 | 2026-11-04 |  |
| .githooks | 1 | 1 | 2026-11-04 |  |
| AGENTS.md（含 CLAUDE.md 時期，`--follow`） | 23 | 203 | 2026-11-04 | 不加 `--follow` 為 6 筆；CLAUDE.md 舊路徑 60d 18、全期 198 |
| memory/（全部） | 380 | 1237 | 2026-11-11 | 佔近 60 天提交的 67% |
| memory/Sens_wiki/wiki | 260 | 875 | 2026-11-11 |  |
| memory/Sens_wiki/wiki/erp/08-open-questions | 96 | 325 | 2026-11-11 |  |
| memory/Sens_wiki/wiki/erp/00-meta | 53 | 194 | 2026-11-11 |  |
| memory/Sens_wiki/raw | 12 | 36 | 2026-11-05 |  |
| memory/erp | 207 | 423 | 2026-11-11 | 規劃紀錄與遷移紀錄 |
| memory/shared | 18 | 62 | 2026-11-04 |  |
| memory/Sens_wiki/AGENTS.md | 2 | 2 | 2026-11-04 | 11-04 才改名自 CLAUDE.md |
| erp-prototype-tests | 130 | 150 | 2026-11-11 | 首次 2026-09-08 |
| .scratch | 7 | 7 | 2026-11-05 | 首次 2026-11-04 |
| wiki/log.md | 225 | — | 2026-11-11 | 每次異動寫一筆 |

提交類型（近 60 天，依 `feat:` 等前綴）：feat 169、docs 163、fix 126、refactor 49、test 40、chore 4。
記憶卡（~/.claude 內，不在 git）：最後修改日 2026-11-04，之後沒有新增或修改。

## 八、在途工作

### 1. 工作樹（git worktree list，共 18 個含主檢出）

算法：`git -C <路徑> rev-list --left-right --count origin/master...HEAD`（落後、超前）；`git -C <路徑> log -1 --format="%cs"`；`git -C <路徑> status --short | wc -l`。origin 以本地的 origin/master（1d528ac）為準，未重新 fetch。

| 工作樹（.claude/worktrees/ 下，除主檢出） | 分支 | 超前 | 落後 | 最後提交日 | 未提交 | 備註 |
|---|---|---|---|---|---|---|
| （主檢出）/Users/b-f-03-029/Sens | master | 0 | 0 | 2026-11-11 | 0 | Miles 的 Obsidian 視窗 |
| agent-a138e89f33e262c75 | worktree-agent-a138e89f33e262c75 | 0 | 13 | 2026-11-06 | 0 | 批 4B 子代理；已併入 |
| agent-a76856240b7ced5de | worktree-agent-a76856240b7ced5de | 0 | 37 | 2026-11-05 | 0 | 批 3 子代理；已併入 |
| agent-a89223b167a464f4d | worktree-agent-a89223b167a464f4d | 0 | 20 | 2026-11-05 | 0 | 批 4A 子代理；已併入 |
| agent-aa6bf6e70ae0fead5 | worktree-agent-aa6bf6e70ae0fead5 | 0 | 7 | 2026-11-11 | 0 | 批 5 子代理；已併入 |
| agent-ab78e6bf3ffd390d7（locked） | worktree-agent-ab78e6bf3ffd390d7 | 1 | 0 | 2026-11-11 | 0 | 批 6 款項與發票遷移，未併入 master |
| agent-ad988d7c2e7b000d3 | worktree-agent-ad988d7c2e7b000d3 | 0 | 51 | 2026-11-05 | 0 | 批 2 子代理；已併入 |
| blissful-leavitt-e539ef（本工作樹） | claude/wiki-project-restructure-cc9d40 | 1 | 0 | 2026-11-11 | 0（本檔寫入前） | 工作環境重建地圖與十二張決策票 |
| check-account-credits-4b0b83 | claude/check-account-credits-4b0b83 | 0 | 273 | 2026-10-22 | 0 | 已併入；hooksPath 被覆寫 |
| erp-mes-standard-alignment-20261028 | worktree-erp-mes-standard-alignment-20261028 | 0 | 109 | 2026-11-04 | 0 | 已併入 |
| happy-rhodes-e5ffe3 | claude/charming-mcnulty-bee572 | 2 | 33 | 2026-11-05 | 17 | L1 規劃稽核修正；17 個未提交的測試檔變動與新增，hooksPath 被覆寫 |
| l1-naming-fix | claude/l1-naming-fix | 0 | 104 | 2026-11-04 | 0 | 已併入 |
| print-details-quantity-progress-db75ca | claude/wiki-normalization-98ca14 | 4 | 0 | 2026-11-11 | 0 | 批 6 完整分支（含 14e0e79 與三筆補修）；hooksPath 被覆寫 |
| printvis-coverage-research-fe1425 | claude/erp-log-unified-interface-a78534 | 0 | 35 | 2026-11-05 | 2 | `memory/Sens_wiki/wiki/log.md` 已修改、`.scratch/activity-log-unified-format/` 未追蹤；hooksPath 被覆寫 |
| process-improvement-four-4a13d5 | claude/notion-content-optimization-4480a8 | 0 | 42 | 2026-11-05 | 0 | 已併入；hooksPath 被覆寫 |
| sap-coverage-research-e42cb1 | claude/infallible-wilson-f990b1 | 0 | 27 | 2026-11-05 | 0 | 已併入；hooksPath 被覆寫 |
| shipping-logistics-features-dd104a | claude/openspec-mattpocock-evaluation-4f4a9a | 0 | 109 | 2026-11-04 | 0 | 已併入；hooksPath 被覆寫 |
| wiki-authority-restructure | wiki-authority-restructure | 0 | 346 | 2026-10-14 | 0 | 已併入 |

備註欄的用途（如「批 4B 子代理」）依最後提交訊息推定，未讀各工作樹的任務書。
判讀：超前 0 筆代表該分支所有提交都在 origin/master 內，可視為已併入。18 個工作樹中，超前 0 筆者 14 個（含主檢出）；超前大於 0 者 4 個（agent-ab78、blissful-leavitt、happy-rhodes、print-details）。happy-rhodes 有 2 筆提交未併入加 17 項未提交改動，是唯一可能遺失工作的工作樹。

### 2. 分支（git branch -a）

本地分支 38 個、遠端分支 6 個（含 origin/HEAD 別名，實際 5 個：origin/master、origin/claude/mes-erp-order-production-3ei3he、origin/claude/offline-order-review-states-E4hdT、origin/claude/shipping-order-structure-4b6cdc、origin/claude/skill-rewrite-c5-1145e6）。

| 類別 | 分支 | 說明 |
|---|---|---|
| 超前 origin/master 者（9 個） | blind/arm-yi-sonnet-high（1，最後 2026-09-15）、claude/blissful-leavitt-e539ef（2，11-04，不是本工作樹的分支）、claude/charming-mcnulty-bee572（2）、claude/musing-kirch-ad7216（1，08-05）、claude/optimistic-nobel-9c65fb（1，09-21）、claude/print-item-done-qty-transfer-4b8c20（1，10-27）、claude/wiki-normalization-98ca14（4）、claude/wiki-project-restructure-cc9d40（1）、worktree-agent-ab78e6bf3ffd390d7（1） | 其中 blind/arm-yi-sonnet-high、claude/blissful-leavitt-e539ef、musing-kirch、optimistic-nobel、print-item-done-qty-transfer 共 5 個沒有工作樹，最後提交在 2026-08-05 至 2026-11-04 之間；是否有未併入的有效內容未查證 |
| 超前 0 筆（含 master，29 個） | 其餘 29 個本地分支 | 已併入；其中 claude/beautiful-carson-af73ab、claude/agitated-grothendieck-b8e665 最舊（2026-07 初，落後約 1170 筆） |
| 遠端 4 個非 master 分支 | origin/claude/mes-erp-order-production-3ei3he（07-21，落後 1135）、origin/claude/offline-order-review-states-E4hdT（06-01，落後 1470）、origin/claude/shipping-order-structure-4b6cdc（10-22）、origin/claude/skill-rewrite-c5-1145e6（11-04） | 皆超前 0，已併入 |

算法：`git for-each-ref refs/heads refs/remotes --format="%(refname:short)|%(committerdate:short)"`，逐一 `git rev-list --left-right --count origin/master...<分支>`。落後超過 500 筆的本地分支 5 個：agitated-grothendieck 1170、beautiful-carson 1172、musing-kirch 954、optimistic-nobel 538、blind/arm-yi-sonnet-high 566；後三者與 blind 各超前 1 筆。

### 3. .scratch 下各主題

| 目錄 | 檔數 | 檔案 | git 最後提交日 |
|---|---|---|---|
| experience-handover | 10 | precheck.md、grill.md、spec.md、audit-r1 至 r3.md、issues/ 4 張（01 至 04） | 2026-11-05 |
| l1-feedback-optimization | 6 | precheck.md、spec.md、audit-r1、audit-r2、decisions.md、ui-naming-coverage.md | 2026-11-05 |
| matt-migration | 1 | skill改寫準則.md | 2026-11-04 |
| quote-versions | 14 | precheck.md、grill.md、spec.md、audit-r1 至 r3、issues/ 8 張（01 至 08） | 2026-11-05 |
| workflow-rebuild | 13（含本檔另 1） | map.md、issues/ 12 張（01 驗證方法至 12 試跑）、research/（本檔） | 2026-11-11 |

happy-rhodes 之外，printvis 工作樹另有未追蹤的 `.scratch/activity-log-unified-format/`（本工作樹看不到）。

## 九、wiki

### 1. 各子目錄卡數（`find <目錄> -name "*.md" | wc -l`）

| 目錄 | 卡數 | 備註 |
|---|---|---|
| memory/Sens_wiki/wiki（全部） | 847 | erp 824、編輯器 8、跨產品 1、範本 12、index.md 與 log.md 2 |
| wiki/erp/00-meta | 6 | 共用規範與 schema 等，見下表 |
| wiki/erp/01-products | 3 | — |
| wiki/erp/03-roles | 21 | 含規範 - 角色、範例 - 角色 |
| wiki/erp/04-business-logic | 353 | 服務藍圖 50、營運規則 287、領域知識 3、外部約束 5、另 8 張在本層（規範 - 商業邏輯、規範 - 活動清單、範例 4 張、受控清單、流程架構） |
| wiki/erp/05-entities | 45 | 含資料結構總覽與規範、範例 |
| wiki/erp/06-state-machines | 23 | — |
| wiki/erp/07-scenarios | 45 | — |
| wiki/erp/08-open-questions | 316 | 平層 82（OQ 卡 80 加規範、範例各 1）、_archives/2026 共 234 |
| wiki/erp/11-review-knowledge | 10 | 頂層 4、_shared 3、參考模型 3 |
| wiki/erp 根（2 張） | 2 | ERP 詞彙表、規範 - 詞彙表 |
| wiki/編輯器 | 8 | 線上編輯器詞彙表與其他 7 張（04、05、06、07 與 product-vision）；遷移計畫未涵蓋這 7 張 |
| wiki/跨產品 | 1 | 印刷業共用術語表 |
| wiki/範本 | 12 | 見下表 |
| memory/Sens_wiki/raw | 41 個 .md（40 張卡加 README） | _attachments 另有 9 個檔（.gitkeep 1、LLM Wiki.md 1、PDF 與 docx 7）；raw 底下全部檔案 51（含 raw 根的 .gitkeep） |


### 2. 規範與範本卡清單（行數：`wc -l`）

| 類別 | 卡 | 行數 |
|---|---|---|
| 00-meta | 卡片撰寫共用規範 | 347 |
|  | business-domain-taxonomy | 124 |
|  | changelog（已凍結封存） | 1473 |
|  | erp_index（腳本產生清單） | 130 |
|  | scope-boundary | 154 |
|  | wiki-schema | 580 |
| 單元規範（各資料夾內） | 規範 - 詞彙表（erp 根）85；規範 - 角色 219；規範 - 商業邏輯 504；規範 - 活動清單 278；規範 - 實體 312；規範 - 資料結構總覽 143；規範 - 狀態機 302；規範 - 業務情境 317；規範 - OQ 216 | 共 9 張，2376 |
| 單元範例（各資料夾內） | 範例 - 角色 70；範例 - 規則組 115；範例 - 商業規則 66；範例 - 活動清單 76；範例 - 服務藍圖 80；範例 - 實體 167；範例 - 資料結構總覽 198；範例 - 狀態機 163；範例 - 業務情境 111；範例 - OQ 80 | 共 10 張，1126 |
| wiki/範本（12 張） | 角色 60；商業規則 78；服務藍圖 64；活動清單 57；資料結構總覽 86；參考模型 48；實體 97；狀態機 111；業務情境 93；規則組 54；OQ 60；Raw 素材 56 | 共 864 |
| 11-review-knowledge | 審查知識路由 79；規劃品質評分準則 132；帳務規劃連帶矩陣 99；稽核誤判記錄 74；_shared/audit-failure-patterns 176；_shared/e2e-planning-checklist 129；_shared/archive-completeness-misjudgement 93；參考模型/訂單管理 42、售前 49、生產執行 80 | 共 953 |

「規範 - 參考模型」不存在：參考模型卡沒有對應的單元規範，只有範本 - 參考模型。

### 3. 08-open-questions 與 raw 的狀態分布（frontmatter `status`）

| 範圍 | 狀態分布 | 算法 |
|---|---|---|
| 08-open-questions 平層 OQ 卡（80 張，不含規範與範例） | open 79、active 1 | Python 讀 frontmatter status |
| 08-open-questions/_archives/2026（234 張） | answered 215、cancelled 19 | 同上 |
| raw（41 個 .md） | raw 20、reviewed 11、ingested 9、active 1（README） | 同上 |
| raw 依 source | claude-research 25、miles-upload 6、miles-dialogue 6、claude-self-capture 3、（無）1（README） | 同上 |
| raw 依月份（檔名前綴） | 2026-05 4、2026-06 18、2026-07 8、2026-08 1、2026-09 1、2026-10 6、2026-11 2、README 1 | — |

平層 active 1 張的身分未查（oq-manage 的 status 值域是 open、answered、cancelled）。status＝raw 的 20 張依 vault-ingest 規則不得被合成（只取 ingested 與 reviewed）。

## 十、wiki 正規化遷移

計畫正本：`memory/erp/wiki-normalization-20261104/遷移計畫.md`（5478 位元組）。拍板紀錄：同資料夾 `grill.md`（G1 至 G29）。每批產物：盤點、範圍、待裁決、能力問題遷移前、遷移後、比對六類檔。

編號批次 0 至 8，共 9 批；批 0 在計畫表中分兩列（擴充、擴充的入口檔改名），批 4 拆成 4A 與 4B，所以執行單位共 11 個。已併入 master 8 個（批 0 兩段、1、2、3、4A、4B、5）；批 6 已完成但未併入 master；批 7、8 未開始。

| 批 | 領域或內容 | 狀態 | 證據（提交） |
|---|---|---|---|
| 0 | 擴充：共用規範、各單元規範、wiki-schema、骨架與範例卡、掛鉤腳本、詞彙表骨架、標竿（齊套邏輯、印件） | 已併入 master | b7457e0（規範草案）、d4c02e4（掛鉤與腳本）、383a4cf（範本與範例同步）、12f825c（log）、b27f483 與 a75c779（標竿）；2026-11-04 |
| 0（入口檔） | `memory/Sens_wiki/CLAUDE.md` 改名 AGENTS.md，現行引用改指 AGENTS.md | 已併入 master，但 oq-manage/SKILL.md 仍寫 `memory/Sens_wiki/CLAUDE.md` | `memory/Sens_wiki/AGENTS.md` 存在；07a0853 為計畫修訂 |
| 1 | 售前 | 已併入 master | 2604315（四張營運規則卡拆成規則組資料夾，索引卡加 56 張規則卡），a98ff07、849bdb7 補修；2026-11-04 |
| 2 | 訂單管理 | 已併入 master | d4934a1（全庫改名）；2026-11-05 |
| 3 | 印前審稿 | 已併入 master | b56ddee；2026-11-05 |
| 4A | 生產執行（工單規劃與派工） | 已併入 master | 61a81a2；2026-11-05 |
| 4B | 生產執行（現場執行） | 已併入 master | fe2b8df；2026-11-06 |
| 5 | 履約與售後 | 已併入 master | 8c5fe02；2026-11-11 |
| 6 | 款項與發票 | 已完成，未併入 master | 14e0e79（refactor）與 76a6383、c45dfb4、7634787 三筆補修，在分支 claude/wiki-normalization-98ca14（超前 4 筆）；14e0e79 單筆另在 worktree-agent-ab78e6bf3ffd390d7（locked，超前 1）；master 上只有該批的盤點、待裁決、稅務法條、角色權限查證（cf362fe 與 975ea78 等 docs 提交） |
| 7 | 收縮：避免用詞升為錯誤、印刷業術語表整理、erp/08 平層 OQ 與 11 與 01 用詞統一、總目錄只留產品入口 | 未開始 | master 上無對應提交 |
| 8 | 資料夾整理（G12）、建封存資料夾（G13） | 未開始 | master 上無對應提交 |
| 另案 | 角色與權限全庫通盤處理（第 6 批範圍內 41 句清單在 `第6批-角色與權限.md`） | 未排入分批，Miles 決定何時開 | 遷移計畫 § 六 |

剩餘領域：款項與發票（批 6，待合併）；批 7、8 不是領域批次。計畫只涵蓋 ERP；`wiki/編輯器` 下 7 張卡（04、05、06、07 與 product-vision）未列入任何批次。
算法：`git log origin/master --format="%cs %h %s" | grep "refactor: 第"` 列出 6 筆（批 1、2、3、4A、4B、5）；`git log origin/master..claude/wiki-normalization-98ca14` 列出批 6 的 4 筆；批 0 提交以 `grep "第 0 批\|標竿\|掛鉤"` 取得。

遷移期間的狀態旗標：`wiki_lint.py` 的 `lint_done_domains` 與 `lint_error_codes` 目前皆為「無」（見五之 3），表示每批收尾「加入已完成領域」這一步沒有落在設定值。

## 十一、林則孟「生產計畫與管制」34 講

依據：記憶卡 `project_ppc_course_to_wiki_20260917.md`（2026-09-17，標「進行中」）、`~/.claude/projects/-Users-b-f-03-029-Sens/f7771b4e-bf56-49f3-80bd-60f8d4114b8f/workflows/` 下兩個工作流結果檔，以及 repo 與磁碟實際狀態。

| 項目 | 記憶卡與工作流紀錄 | 實際查到 |
|---|---|---|
| 34 講看片 | 第一次執行 wf_a0707d49-811：34 講全失敗（YouTube 限速與用量上限）；第二次執行 wf_e17baeb1-b91：`failedLectures` 為空，34 講全部看完 | 紀錄層面完成；成果檔不在 repo |
| 12 張章別 raw 卡 | 工作流結果列出第 2 至 12 章共 11 張，路徑 `/Users/b-f-03-029/Sens/memory/Sens_wiki/raw/2026-09-17-mes-study-生產計畫與管制第N章…`；`failedChapters` 為 [1]，第 1 章沒寫出 | `raw/` 沒有任何 2026-09-17 的檔；`git log --all -- memory/Sens_wiki/raw/2026-09-17-mes-study*` 無結果；以檔名樣式在 /Users/b-f-03-029 找（深度 8）也沒有 |
| 附件 | 各章附件數：第 2 章 27、3 章 51、4 章 36、5 章 18、6 章 18、7 章 45、8 章 18、9 章 27、10 章 9、11 章 18、12 章 9，合計 276；記憶卡寫「每講 8 張截圖加逐字稿，共 9.7 MB」 | `raw/_attachments/` 共 9 個檔：頂層 2 個 PDF 與 .gitkeep，01_workflow 1 個 md、02_ERP 工作流程與辦法 4 個、03_外部文件與法規 1 個；無 `2026-09-17-生產計畫與管制-林則孟` 目錄 |
| 精練既有 raw（D5：19 張納入） | 第二段，需 Miles 批准後執行 | 未做。現有 raw 狀態 raw 20、reviewed 11、ingested 9；11 月 4 日把 6 張參考模型引用的調研卡升為 reviewed，與本課程無關 |
| 整合卡、矛盾表、封存清單、wiki 領域知識草稿、rubric 與 skill diff（提案區） | 放在 `/private/tmp/claude-501/.../scratchpad/ppc/proposals/` | 該目錄已不存在 |
| wiki `領域知識/` 來自課程的卡 | 規劃落點：`04-business-logic/領域知識/` | 目錄現有 3 張：生產績效指標、豐田式生產管理對映、印刷成本結構。三張的 source 欄分別指向 2026-06-13 生產模組架構設計、2026-07-27 豐田式生產管理 TPS 調研、公司工單範例，沒有任何一張引用該課程。`grep 林則孟\|生產計畫與管制` 在 memory/Sens_wiki 無命中 |
| raw/_archives 封存區（D3） | 新增 `raw/_archives/2026/`，並改 raw README 與 wiki-schema | 不存在 |
| 外部素材 | — | 講義 PDF `~/Downloads/清大工工系林则孟教授_生產計畫與管制課程講義.pdf` 存在；wiki-schema 與 raw README 已有 `mes-study` 來源類型，但沒有任何卡使用它 |

結論：完成到「看片與落 raw 卡」且工作流結果紀錄為成功（11 章），但這些成果檔現已不在 repo 與磁碟上，原因未查證（推測為寫入主檢出後未提交、遇到並行工作階段或工作樹清理而遺失）。第 1 章、第二段（精練、整合、wiki 領域卡、rubric 改寫、封存）全部未做。要補，需重跑看片流程（講義 PDF 仍在），或確認該批檔案是否仍在別處。
另需注意：記憶卡寫的看片腳本與暫存區（scratchpad/ppc、prep_all.sh）已不存在；Whisper 金鑰設定檔位置 `~/.config/watch/.env` 未檢查（涉及密鑰，不讀）。

## 十二、erp-prototype-tests

| 項目 | 數量或位置 | 算法 |
|---|---|---|
| 根目錄 | `/Users/b-f-03-029/Sens/.claude/worktrees/blissful-leavitt-e539ef/erp-prototype-tests/`（與主檢出同路徑結構） | — |
| 全部檔案（不含 node_modules） | 203（tests/ 下）；另有 config.mjs、package.json、playwright.config.mjs、vitest.config.mjs、README.md、reporters/、scripts/（含 full.mjs、impact.mjs）、docs/ | `find tests -type f \| wc -l`＝203 |
| 測試檔 | 189：畫面測試 `*.spec.mjs` 97、純函式測試 `*.test.mjs` 92 | `find tests -name "*.spec.mjs"`、`-name "*.test.mjs"` |
| 畫面測試分章資料夾 | 00-main-flow 至 14-query-ui 共 14 個（無 13）；檔數最多：10-report-transfer（18 個檔）、02-order-setup（16）、14-query-ui（15） | `find tests/e2e -type f` 依資料夾計數 |
| 純函式測試資料夾 | access、data-consistency、delivery-chain、orders、payment、print-items、production-floor（23）、qc-shipping（19）、quote、work-orders（15） | 同上 |
| 情境目錄 | `docs/scenario-catalog.md`，4472 行；另有 `docs/main-flow.md` 58 行、`docs/findings-20260908.md` 87 行 | `wc -l docs/*` |
| 情境條數 | 統計表合計 480 條（正流程 459、逆流程與附加流程待辦 21）；16 章：需求單 31、訂單成立與維護 28、款項與發票 28、訂單成立與印件 26、審稿 18、草稿工單 13、印務登打製程 50、製程審核與交付產線 22、生管接收與派工 23、師傅報工與場內轉交 64、品檢 32、出貨與送達 56、外發與派單 2、查詢與畫面 47、計算規則與資料一致性 19、逆流程待辦 21 | 讀統計表；`grep -c "^### "` 得 467，扣統計表 4 個小節標題為 463 個條目標題，與 480 差 17，未查證原因（可能待辦章以清單而非標題呈現） |
| 「依據」行 | 每條情境有「- 依據：<wiki 卡名>」行；找不到對應卡者寫「（wiki 無對應卡）」 | `grep -cE "依據：" docs/scenario-catalog.md`＝463；`grep -c "依據"`＝481（含說明句） |
| 最近提交 | 2026-11-11；近 60 天 130 筆（全期 150） | git log |
| 未提交的測試變更 | happy-rhodes 工作樹有 12 個已修改檔、5 個新增檔（見八） | `git status --short` |


## 十三、存疑與查不到

| # | 項目 | 原因或缺什麼 |
|---|---|---|
| 1 | 林則孟課程 11 張 raw 卡與 276 個附件的去向 | master、所有分支、磁碟（找檔名樣式，深度 8）都沒有；原因未查證。工作流結果檔與腳本在 ~/.claude/projects/.../workflows/，只有結果摘要，沒有內文 |
| 2 | 記憶卡「已落 wiki／skill」的判定 | feedback 類標 S 的 15 張依內容閱讀判斷，未逐字比對原文是否完全涵蓋；標 A 的卡以陷阱表與標題比對，列號對應已逐列核對 |
| 3 | project 類卡片的決策是否已落到 wiki | 80 張只讀索引說明與開頭段落；「完成兼決策」類是否已進 wiki 未逐張查證 |
| 4 | 3 個 prototype 相關說法（長期分支、是否開 PR、合併到 develop 或 production-stage）哪個是現況 | 需要看 erp repo（/Users/b-f-03-029/erp）的 git 與分支現況；本盤點限制在 Sens 目錄與設定，未進 erp repo |
| 5 | 後端現況正本是 sensation-api 還是 sens-print-core | 三個目錄都在 /Users/b-f-03-029 下；未讀兩個 repo |
| 6 | erp-prototype-tests 情境目錄 480 與 463 的差 | 未逐章核對 |
| 7 | settings.local.json 在其他工作樹的副本是否與本檔一致 | 只比對了主檢出與本工作樹（相同） |
| 8 | permissions 過期數 71 的完整度 | pattern 比對為下限；冗餘（被大範圍規則涵蓋）項數未算 |
| 9 | 對話紀錄的保存範圍 | 最早命中 2026-05-15；5 月 15 日前或已被清除的紀錄看不到；使用者手動斜線指令的偵測只認 `<command-name>` 標籤，to-spec、to-tickets、implement、grill-with-docs 的實際使用次數未知 |
| 10 | raw 平層 OQ 卡中 status＝active 的 1 張 | 未查出是哪一張 |
| 11 | 外部通用 skill（defuddle、json-canvas、obsidian-*）的原始出處 | 依內容與名稱推定，未查上游 |
| 12 | git 提交數的「已併入」判讀 | 以 origin/master 本地副本為基準，未 fetch；超前 0 筆代表所有提交在該副本內，不代表遠端已推送 |
| 13 | AGENTS.md 提及「模型 Opus 5.5」「Fable」等名稱與 settings.json 的 model 值（fable[1m]）是否一致 | 名稱對應未驗證 |
| 14 | repo 根目錄 12 個散檔（factory-*.md、production-stage-*.md、openspec-vault-reconcile-report、order-invoice-manual-test-notes.md、兩個 seg1-manual HTML 等）是否仍有人使用 | 未在盤點項目內，僅列出；檔名含 openspec 者前提已消失 |
| 15 | memory/erp 下 16 個子資料夾與檔（含 plans、linear-drafts、manual-audit 等）的使用狀況 | 未逐一盤點 |

## 附：計數指令

| 數字 | 指令或檔案 |
|---|---|
| AGENTS.md 等行數與段落 | `wc -l AGENTS.md ~/.claude/CLAUDE.md ~/.claude/output-styles/ste100-pm.md memory/Sens_wiki/AGENTS.md`；段落以 Python 掃標題 |
| 陷阱表 32 列 | AGENTS.md 第 78 至 114 行，Python 取 `|` 開頭列扣表頭兩列 |
| 記憶檔統計 | `cd ~/.claude/projects/-Users-b-f-03-029-Sens/memory; ls | grep -c "^project_"` 等 |
| skill 檔數與行數 | `find .claude/skills/<名> -type f -exec wc -l {} +` |
| settings 與 permissions | Python `json.load` 讀三份 settings 取 `permissions.allow`、`hooks` |
| git 改動次數 | `git log master --since="2026-09-12" --oneline -- <路徑> | wc -l`；全期去掉 `--since`；`--follow` 用於 AGENTS.md |
| Skill 呼叫次數 | scratchpad 內 skillcount.py、skillcount2.py、bashcalls.py（路徑 /private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-blissful-leavitt-e539ef/9bd9d353-5474-4498-b25d-0bf9e9d8ea0a/scratchpad/） |
| 工作樹與分支 | `git worktree list --porcelain`；`git rev-list --left-right --count origin/master...HEAD`；`git for-each-ref` |
| wiki 卡數與狀態 | `find memory/Sens_wiki/wiki/<目錄> -name "*.md" | wc -l`；Python 讀 frontmatter |
| 遷移批次 | `git log origin/master --format="%cs %h %s" | grep "refactor: 第"`；遷移計畫.md |
| 課程成果 | `~/.claude/projects/-Users-b-f-03-029-Sens/f7771b4e-.../workflows/wf_e17baeb1-b91.json` 的 `result` 欄；`git log --all -- <路徑>` |
| 測試 | `find erp-prototype-tests/tests -type f | wc -l`；`grep -c "^### " docs/scenario-catalog.md` |

