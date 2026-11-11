# 29：記憶重新初始化

Type: task
Status: resolved
Blocked by: 15

## Question

Miles 2026-11-12：商業需求走 matt 的流程進 wiki，不該再進記憶；同一件事在記憶與 wiki 各有一份會互相矛盾。環境的設置與去重要提前，可以重新初始化。

記憶目錄 `~/.claude/projects/-Users-b-f-03-029-Sens/memory/` 清場後剩 112 張：feedback 59、project 51、reference 2。把它重新初始化成只放「別處放不了」的內容：

- project 類 51 張：逐張核對卡內的決策是否已在 wiki 卡（或進行中工作的資料夾、地圖與票）。已在就封存記憶卡。不在的列成清單給 Miles：那是 wiki 的缺口，走 `wiki-amend` 落卡或開 OQ，不留在記憶。
- feedback 類 59 張：對照 `AGENTS.md`、`~/.claude/CLAUDE.md`、輸出風格檔、各 skill。別處已有同義句的封存記憶卡。只在記憶卡有的先留，並標出它之後該搬到哪個檔（交給票 30 與票 11）。
- 定一條規則並寫進 `AGENTS.md`：什麼可以進記憶、什麼不可以（商業決策進 wiki；工作進度進地圖與票；記憶只當新指示的收件匣與外部資源位置）。規則的範圍與理由要寫明（票 20 的結論）。
- 用資深 PM 的角度判斷；不確定哪類內容該留時，先找既有做法（Anthropic 對記憶檔的官方說法見 `research/20-anthropic-setup-guidance.md`）。

封存不是刪除：記憶卡搬到 `~/.claude/archive/`，比照票 15 的做法，並在回報裡說封存在哪。動手前把分類給 Miles 確認。
完成後記錄留了幾張、封存幾張、列出沒落到 wiki 的決策清單。

## Comments

### 2026-11-12 進行中：已認領，核對分批已定，尚未派工

現況（實測）：記憶目錄 113 檔，含索引檔；feedback 59、project 51、reference 2。`feedback_linear_task_prefix.md` 不在索引內。封存資料夾 `~/.claude/archive/env-reset-20261112/memory-cards/` 有 36 張加清場前的索引檔，其中 project 類 29 張。

判準（資深 PM 的角度）：這張卡不在記憶裡，代理會不會做錯 Miles 的四件工作。既有做法依據是 `research/20-anthropic-setup-guidance.md` § 六：記憶不存 repo 已記錄的內容與指令檔已寫的內容；一則一檔；過時的刪除。

核對方式：派 Sonnet 子代理分批，每批把卡內決策逐條拆開，逐條找家並附原文句。結果寫到 `research/29-verify/<批名>.md`，主對話抽查後才採用。

決策的家依正本分層判：

| 決策類型 | 家 |
|---|---|
| 商業規則、欄位、狀態、權限 | wiki 卡 |
| 介面互動、版型 | erp 程式庫的 Prototype |
| 流程與環境規則 | `AGENTS.md`、skill、wiki 規範卡、地圖與票 |
| 完成紀錄（做了什麼、哪個 PR） | git 紀錄，不需要家 |
| 找不到 | 缺口，列給 Miles |

分批：

| 批 | 範圍 | 張數 |
|---|---|---|
| P1 | 訂單、需求單、款項、諮詢、售後 | 6 |
| P2 | 交期、急件、印件層、備料、BOM | 8 |
| P3 | 工單 | 7 |
| P4 | 生產 | 9 |
| P5 | 出貨、品檢 | 6 |
| P6 | wiki 結構與規範 | 8 |
| P7 | Prototype、Linear、手冊、skill | 7 |
| P8 | 已封存的完成紀錄：訂單、需求單、款項、工單 | 9 |
| P9 | 已封存的完成紀錄：其他 | 9 |
| F1 至 F3 | feedback 類 59 張，對照 `AGENTS.md`、全域 `CLAUDE.md`、輸出風格檔、專案 skill、wiki 規範卡 | 59 |

5 小時額度在 2026-11-12 開工時是 96%，等重置後才派工。

### 2026-11-12 進行中：12 批子代理已回報，檢核只做了第一步

產出在 `research/29-verify/`：`P1.md` 至 `P9.md`、`F1.md` 至 `F3.md`（共 3,515 行）。任務書是同資料夾的 `00-任務書-project.md`、`00-任務書-feedback.md`。下表數字是子代理自報，尚未採用。

project 類（現有 51 張加已封存的完成紀錄 18 張）：

| 批 | 範圍 | 張數 | 決策條數 | 已有家 | 部分 | 矛盾 | 找不到 | 過期 | 子代理判可封存 |
|---|---|---|---|---|---|---|---|---|---|
| P1 | 訂單、需求單、款項、諮詢、售後 | 6 | 102 | 74 | 8 | 8 | 11 | 1 | 0 |
| P2 | 交期、急件、印件層、備料、BOM | 8 | 138 | 102 | 11 | 6 | 8 | 11 | 0 |
| P3 | 工單 | 7 | 143 | 84 | 21 | 24 | 9 | 5 | 0 |
| P4 | 生產 | 9 | 226 | 145 | 39 | 12 | 16 | 3 | 0 |
| P5 | 出貨、品檢 | 6 | 142 | 88 | 19 | 14 | 8 | 13 | 0 |
| P6 | wiki 結構與規範 | 8 | 125 | 76 | 15 | 8 | 7 | 10 | 0 |
| P7 | Prototype、Linear、手冊、skill | 7 | 172 | 112 | 26 | 9 | 25 | 0 | 0 |
| P8 | 已封存：訂單、需求單、款項、工單 | 9 | 171 | 113 | 21 | 14 | 14 | 9 | 0 |
| P9 | 已封存：其他 | 9 | 151 | 82 | 20 | 17 | 16 | 7 | 1 |
| 合計 | | 69 | 1,370 | 876 | 180 | 112 | 114 | 59 | 1 |

feedback 類 59 張：

| 批 | 張數 | 可封存 | 先留待搬 | 有矛盾 | 過期可封存 |
|---|---|---|---|---|---|
| F1 | 20 | 4 | 13 | 3 | 0 |
| F2 | 20 | 0 | 12 | 7 | 1 |
| F3 | 19 | 4 | 13 | 2 | 0 |
| 合計 | 59 | 8 | 38 | 12 | 1 |

reference 類 2 張：F3 回報卡內路徑都存在，建議保留。

子代理回報的共同現象（未查證）：

- 矛盾多半是記憶卡比家舊。例：工單卡寫「完成判定三變體」，wiki 寫四種廠商類別同一條路徑；出貨卡寫「出貨確認押實際出貨日」，wiki 的 SHP-024 已刪該欄。
- 「找不到」裡有一類是否決類決策（決定不做某事），wiki 本來就不寫。
- `AGENTS.md` 陷阱表的出處欄指向多張 feedback 卡（例：第 83、94、95、101 行）。封存卡之前要先處理這些列，歸票 30。
- 後端現況正本的名稱兩邊相反：記憶卡 `feedback_check_sensation_api_asis` 與 seg3 卡寫 sens-print-core；`AGENTS.md` 第 48、101 行與 `erp-plan/SKILL.md` 第 32 行寫 sensation-api。要 Miles 裁決。
- 操作手冊的 Artifact 固定網址與 Dev 環境網址只在記憶卡，屬外部資源位置，要留。

主對話已做的檢核：

- 比對指令 `research/29-verify/verify_quotes.py`：逐列取「原文句」，查它是否存在於候選的家（工作樹的規範檔與 wiki、全域 `CLAUDE.md`、輸出風格檔、erp 的 Prototype 與 skill）。輸出在 `research/29-verify/檢核-原文句比對.txt`。
- 結果：有原文句的 1,198 列中，指令找到 847 列，找不到 351 列，另有 59 列句子在別的檔。帶驚嘆號的明細共 410 列。
- 這 410 列還沒判讀。F1、F2 兩批看過，多數是子代理把兩三句併在一格或自己改寫，不是捏造。P 類九批的找不到比例三到四成，還沒看，不能假設同因。

還沒做的事：

1. 判讀 410 列：分清是指令切句的問題、子代理改寫，還是子代理捏造。捏造比例高的批退回重做。
2. 矛盾 124 條（project 112、feedback 12）逐條重查，並判方向：記憶卡較新，還是家較新。可用記憶卡日期對 `git log` 該行的日期。
3. 找不到與部分共 294 條（project）逐條重查後分類：否決類、介面細節、Linear 或待辦、真正的商業規則缺口。只有最後一類列給 Miles。
4. 抽查「已有家」的判定是否同義。
5. 定封存判準並呈報 Miles。子代理的判法是「有任何一條矛盾或缺口就不可封存」，照這個判法 69 張只有 1 張可封存。這個判法太嚴：家較新的矛盾，代表記憶卡是過期的舊結論，更該封存。
6. 之後才是：Miles 確認分類、封存、寫 `AGENTS.md` 的記憶規則句（先給 Miles 看）、結案。

Miles 2026-11-12 在本對話的指示：派工一律用子代理、新對話只接續主線（已入地圖 Notes）；子代理的結論要檢核（已入地圖 Notes）；`派工任務書範本.md` 刪掉，歸票 30（已入票 30 留言）。

### 2026-11-12 進行中：檢核五步做完，分類已呈報 Miles，等確認

上一段「還沒做的事」第 1 至 5 項已完成。第 6 項（Miles 確認、封存、寫 `AGENTS.md` 的記憶規則句、結案）還沒做。記憶目錄、封存資料夾、`AGENTS.md` 仍未改動。

第 1 項，判讀比對不到的列：

- 第二輪比對指令 `research/29-verify/triage_unmatched.py`，輸出 `檢核-第二輪分類.txt`。它把比對不到的列分成：引號內的句子存在、改寫或併句、疑似無出處。
- 判為「已有家」或「別處已有」但疑似無出處的共 47 列。逐列看過：都是子代理把說明寫進原文句欄（例：「三張皆已有決議段」「以程式現況判定」），不是引用。主對話抽查其中 20 項，全部在原始檔成立。
- 結論：沒有發現捏造，沒有批次要退回重做。第一輪的缺點是原文句欄混了說明，所以第二輪任務書改成一格一句照抄。

第 2 至 4 項，重查（project 類）：

- 做法：`make_recheck_lists.py` 從第一輪抽出矛盾 112、找不到 114、部分 180 共 406 列，另從「已有家」每 8 列抽 1 列共 107 列，合計 513 列，分 14 批派 Sonnet 子代理。任務書 `00-任務書-重查.md`，清單 `重查清單-*.md`，產出 `R-*.md`。
- 矛盾要判方向。任務書要求正面證據（wiki 的 `log.md`、OQ 卡、較晚的記憶卡、`git log -S` 找出說法第一次出現的提交），不能只看該行最後修改日，因為 wiki 在 2026-10 至 2026-11 整批改寫過。
- 主對話檢核：`aggregate_recheck.py` 核對 513 列沒有漏列；有原文句的列逐句比對是否在所寫的檔，只有 5 列比對不到（4 列的家是操作手冊成品檔，不在比對範圍；1 列原文句只有兩個字）。另抽查 6 條「家較新」的提交日期與 wiki 原句，全部成立。子代理沒有改到產出檔以外的檔。輸出 `重查彙整-統計.txt`、`重查彙整-待裁決.md`。

重查結果：

| 第一輪判定 | 列數 | 重查結論 |
|---|---|---|
| 矛盾 | 112 | 家較新 104；不是矛盾 5；記憶卡較新 3 |
| 找不到 | 114 | 已有家 17；家較新 7；仍缺 90 |
| 部分 | 180 | 已有家 112；家較新 4；仍缺 64 |
| 已有家（抽查） | 107 | 同義 101；不同義 6（都是記憶卡過期或講不同的事，沒有新缺口） |

「仍缺」154 列的分類：否決 47、紀錄或待辦 48、流程環境 36、商業規則 13、介面 10。

記憶卡較新 3 條：

| 記憶卡 | 內容 | 去向 |
|---|---|---|
| production_quantity_audit_grill_20261026 C12 | 2026-10-27 拍板「補做不建新任務，對原任務填補做數量」；wiki `07-scenarios/QC不通過補生產.md:34` 仍寫「加開整串補做生產任務」。同源的 C13（整筆報廢的任務重做走加開新任務）wiki 沒有 | 該 grill 進行中，拍板記在工作資料夾的 `grill.md`；等補做設計一起落卡 |
| production_stage_seg3_done F13 | ERP 後端是 sens-print-core，sensation-api 是 EC 後台；`AGENTS.md` 第 48、101 行寫反。兩個程式庫本機都在 | 票 30，要 Miles 裁決 |
| erp_repo_prototype_workflow 5 | erp 的 Prototype 分支做法，記憶卡、erp skill、`AGENTS.md` 說法不一 | 票 30，要 Miles 裁決 |

商業規則缺口 13 條（明細在 `重查彙整-待裁決.md`）：

| 類 | 記憶卡與列 | 內容 |
|---|---|---|
| 兩邊說法相反 | work_order_visibility_sharing 1 | 印務的工單列表只帶自己的；wiki 的 ACT-VPRD-027 寫印務查閱全公司工單，Prototype 與情境目錄 7.47 仍收窄 |
| 兩邊說法相反 | production_stage_seg4b_done H13 | 卡寫 B2C 生產任務由印務建；wiki `工單.md:49` 寫線上單由系統自動建工單與任務 |
| 兩邊說法相反 | work_order_detail_company_alignment 20 | 卡寫印務看不到訂單層金額；wiki `訂單.md:133` 起的訂單層利潤欄可見範圍含印務 |
| 兩邊說法相反 | work_order_detail_layout_done 30 | 卡寫生管列印不以異動為前提；wiki 輸出活動清單的活動名稱是「工單異動確認後重印紙本工單」 |
| 疑似已被取代 | work_order_qty_color_costing_done 5 | 工單層目標數量不含放損；wiki 部件倍率卡寫印務常因放損多填 |
| 疑似已被取代 | work_order_task_editing_done 10 | 材料任務放損只含開機損；wiki 材料用量卡寫材料任務與工序任務同一套填法 |
| wiki 沒有這句 | invoice_view_drawer_done 4 | 發票「奇數月 14 日」是 ezPay 平台時限、不是法規；2026-11-11 正規化第 6 批（提交 14e0e79）時遺失 |
| wiki 沒有這句 | production_stage_seg4b_done H4 | 取消免審稿時，已建的免審輪怎麼處理 |
| wiki 沒有這句 | work_order_visibility_sharing 9 | 工單改派後，原負責人不自動成為分享成員 |
| wiki 沒有這句 | mock_chain4_urgent_multipart 12 | 需求單轉訂單時出貨方式先取印件層、空白才取單頭；建需求單時窗口聯絡人預設帶主要窗口 |
| wiki 沒有這句 | quote_to_order_gap_fix 4 | 需求單轉入訂單的參考附件可刪除 |
| wiki 沒有這句 | after_sales_responsibility_removal 7 | 售後強制結案時，活動紀錄附未完結清單 |
| wiki 沒有這句 | production_quantity_audit_grill C13 | 見上表 C12 |

feedback 類（主對話已檢核第一輪的 `F1.md` 至 `F3.md` 總表與矛盾列）：

| 結論 | 張數 | 卡 |
|---|---|---|
| 可封存（別處已有同義句，或前提已不存在） | 9 | advice_format_no_counterexample_section、always_traditional_chinese、contradiction_must_stop、erp_spec_merge_direct_no_pr、no_staging_before_commit、research_split_by_domain、subagent_tier_blind_test_20260915、wiki_data_governance_no_overlap、wiki_single_direction_reference |
| 先留，等票 30 搬到對應的檔 | 38 | 見 `F1.md` 至 `F3.md` 總表「建議的家」欄 |
| 與現行規則相反，等票 30 由 Miles 裁決 | 12 | check_sensation_api_asis、features_mece_no_rules_in_project、industry_best_practice_first、linear_comment_format、linear_fix_restructure_not_append、linear_task_prefix、model_split_opus_for_agents、oq_closure_resolve_then_archive、production_task_standardized、prototype_layout_follow_source、prototype_pr_no_linear_link、wiki_link_not_text_path |

第 5 項，封存判準（呈報 Miles 的版本）：

- project 類：卡內每條決策都有去向就封存。去向有四種：已在 wiki 或 Prototype；家較新（記憶卡是過期的舊結論）；屬完成紀錄，git 已有；已列入上面的缺口表。照這個判準，51 張有 48 張封存。
- project 類留 3 張並改寫成只剩位置：`project_workflow_rebuild_map_20261111`（本地圖的接續入口）、`project_production_quantity_audit_grill_20261026`（進行中 grill 的工作資料夾入口）、`project_erp_manual_dev_verified`（操作手冊的 Artifact 網址與 Dev 環境網址，改成 reference 類）。
- feedback 類封存 9 張，留 50 張等票 30。reference 類 2 張留著。
- 封存後記憶目錄剩 55 張卡。

等 Miles 回覆的問題：

1. 上述分類與封存判準是否同意。
2. 否決類 47 條（決定不做某事）wiki 正文不寫。要不要另外補到決策紀錄（`docs/adr/`），或維持不補。
3. 商業規則缺口 13 條怎麼處理：開 OQ 卡由 Miles 逐條裁決，或直接在對話裡裁決後走 `wiki-amend` 落卡。這是 wiki 內容的事，不在本票範圍，要另開票。
4. `AGENTS.md` 的記憶規則句草稿（見對話）是否同意。

舊待辦：「紀錄或待辦」48 列裡有還沒做完的事（例：6 張 raw 升 reviewed、Linear 範例更新、PT-048 封存）。結案時另開一張票清點，不留在記憶。

### 2026-11-12 Miles 回覆（睡前）：分類同意，可以封存

- 第 1 題（封存分類與判準）：Miles 回「可以」。照上一段的分類封存 57 張（project 48、feedback 9），project 留 3 張改寫成只剩位置。
- 第 2 題（否決類 47 條要不要補決策紀錄）：Miles 沒裁決，反問三件事：`docs/adr/` 是不是 matt 的 skill；會不會與 wiki 打架；怎麼避免。要先讀 matt 的 `domain-modeling` skill 原文（決策紀錄的寫法與收什麼）再回答，寫四項：做法、建議、風險、預期結果。Miles 裁決前維持不補。
- 第 3 題：Miles 問「外部資源現在那兩筆是什麼」。已在對話回答：`reference_erp_test_map_mod`（ERP 測試進度與涵蓋地圖外掛的本機安裝位置）、`reference_claude_video_watch_plugin`（影片外掛的安裝與 ffmpeg 補丁）。
- 商業規則缺口 13 條另開票、`AGENTS.md` 記憶規則句草稿：Miles 看過，沒有反對也沒有明說同意。規則句的內容就是 Miles 2026-11-12 的原決定（地圖 Notes 第 39 行）與本票 Question，照草稿寫入，回報時標明用字可再改。
- Miles 另外交辦一件調研，已開票 32。
- Miles 說明早才看。處理完在對話裡完整回報。

## Answer

2026-11-12 完成。Miles 已同意封存分類。

記憶目錄的結果：

| 類 | 原本 | 封存 | 留下 | 說明 |
|---|---|---|---|---|
| project | 51 | 48 | 2 | 留下的 2 張改寫成只剩位置：地圖入口、進行中 grill 的工作資料夾 |
| feedback | 59 | 9 | 50 | 留下的 50 張交票 30：38 張待搬到規範檔，12 張與現行規則相反、等 Miles 裁決 |
| reference | 2 | 0 | 3 | 原本 2 張不動；`project_erp_manual_dev_verified` 改寫成 `reference_erp_manual`，只留手冊檔位置、Artifact 網址、Dev 環境網址 |
| 合計 | 112 | 57 | 55 | 索引檔 `MEMORY.md` 已刪對應的 57 列，剩 63 行 |

封存位置：`~/.claude/archive/memory-reinit-20261112/`。

- `memory-cards/`：封存的 57 張卡。
- `memory-backup-before/`：動手前整個記憶目錄的複本（113 檔，含索引檔）。改寫過的 3 張卡的原文在這裡。
- `README.md`：原位置、封存理由、封存的卡名單。

`AGENTS.md` 的改動：

- 新增「記憶目錄」一節：記憶只放 Miles 新給的做事指示與外部資源位置；商業決策寫 wiki 卡，進度寫地圖與票，完成紀錄寫提交訊息。寫法依票 20：寫明範圍與理由，不用強調字。這段用字 Miles 沒有明說同意，可再改。
- 陷阱表 4 列的出處原本指向已封存的記憶卡，改成日期。
- 「停下與繼續」段刪掉「記憶卡標『勿重問』者直接沿用」。

沒落到 wiki 的決策：

| 類 | 條數 | 去向 |
|---|---|---|
| 商業規則缺口（含「補做不建新任務」） | 14 | [票 33：記憶卡清出的商業規則缺口裁決與落卡](33-business-rule-gaps-from-memory.md) |
| 舊待辦與完成紀錄 | 48 列 | [票 34：記憶卡內舊待辦的清點](34-old-todos-from-memory.md) |
| 流程環境（36 列）、後端名稱、erp 分支做法 | — | 票 30（留言已寫名單位置與待裁決題目） |
| 介面細節 | 10 列 | 不處理；介面的正本是 Prototype |
| 否決類（決定不做某事） | 47 列 | 維持不補，等 Miles 對下一節的裁決 |

明細都在 `research/29-verify/`：`重查彙整-待裁決.md`、`重查彙整-統計.txt`、`R-*.md`。

### 決策紀錄（`docs/adr/`）：回答 Miles 的三個問題

是不是 matt 的 skill：是。`docs/adr/` 是 matt 的 `domain-modeling` skill 規定的位置，格式在同資料夾的 `ADR-FORMAT.md`。matt 的 grilling 類工作固定會呼叫它（wayfinder 原文：Always call the Skill tool twice, for "grilling" and "domain-modeling"）。

matt 對決策紀錄的規定（原文）：

- 門檻是三個條件同時成立：難以反悔（Hard to reverse）、沒有脈絡會讓人意外（Surprising without context）、真的有取捨（The result of a real trade-off）。缺一個就不寫（If any of the three is missing, skip the ADR）。
- 內容只要一到三句：背景、決定了什麼、為什麼（An ADR can be a single paragraph）。
- 用到才建資料夾（Create the `docs/adr/` directory lazily）。所以資料夾現在不存在是正常的。
- 收的類型是架構形狀、跨領域整合方式、綁死的技術選擇、範圍邊界、刻意偏離一般做法、看不出來的限制、不明顯的否決。都是系統層，不是單一欄位或單一規則。

會不會與 wiki 打架：照 matt 的門檻寫就不會，放寬就會。

- Sens 現在已有兩個地方記「為什麼」：wiki 的 `log.md`（每筆有「動機」行）與 OQ 卡（決策脈絡）。`docs/adr/` 會是第三個。
- 打架的情況有兩種：決策紀錄把規則句再寫一次，wiki 卡改了之後它變成舊說法（與這次記憶卡的問題相同）；同一個理由在 `log.md` 與決策紀錄各寫一份。
- 否決類 47 列看過標題：多數是「某欄位不做」「某提示不加」這類容易反悔的小決定，不到 matt 的門檻。其中有多少列到門檻，沒有逐列判定。

建議（四項）：

| 項 | 內容 |
|---|---|
| 做法 | 照 matt 原樣保留 `docs/adr/`，不改 skill。分工寫成一句放進 `AGENTS.md`：決策紀錄只收三個條件都成立的系統層決定，內容寫理由與被否決的方案，用卡名指向 wiki 卡，不重寫規則句；日常的「為什麼改」仍寫 `log.md` 的動機行。否決類 47 列不回填 |
| 建議 | 採用上述做法。理由：地圖 Notes 定了先完整照 matt 走一遍再調整；matt 的門檻本來就高，照門檻寫的量很少 |
| 風險 | 代理日後可能重提已否決過的小功能，Miles 要再答一次。代理可能放寬門檻，把規則句寫進決策紀錄，造成第二份正本；要靠分工句與稽核擋 |
| 預期結果 | wiki 正文不變。`docs/adr/` 在第一個到門檻的決定出現時才建立。47 列留在封存的記憶卡與 `research/29-verify/`，查得到但不載入 |

Miles 2026-11-12 裁決：採用上表的做法。分工已寫進 `AGENTS.md` 正本分層表的「決策紀錄」一列。否決類 47 列不回填。
