# 票 30 盤點：OQ 現況與 matt 流程處理「未決事項」的事實對照

> 主對話查證（2026-11-12）：本檔寫的 `OQ/` 實際路徑是 `memory/Sens_wiki/wiki/erp/08-open-questions/`。張數已重數：未解 77、封存 237（answered 218、cancelled 19），與本檔相符。正本卡連到未解 OQ 的連結，主對話用另一種算法得 184 處、83 張卡，本檔是 178 處、80 張卡。「超過 30 天 47 張、最久 176 天」未查證。wayfinder 第 46 至 48、105 行原文已對照。


盤點日 2026-11-12。只列事實，不給建議。路徑省略前綴者：`skills/` 指 `.claude/skills/`；matt 路徑簡寫為 `matt/`，全名是 `/Users/b-f-03-029/.claude/plugins/cache/mattpocock/mattpocock-skills/1.3.2/skills/`。OQ 資料夾簡寫為 `OQ/`，全名是 `memory/Sens_wiki/wiki/erp/08-open-questions/`。

## 一、OQ 現況

### 1.1 位置與張數

資料夾：只有一處，`OQ/`（平層）與 `OQ/_archives/2026/`。`memory/Sens_wiki/wiki/erp/00-meta/_archives/` 是 changelog 封存，不放 OQ。搜過：`find memory/Sens_wiki -type d | grep -i -E 'oq|open-q|question|封存|archive'`。

| 位置與狀態 | 張數 | 指令 |
|-----------|------|------|
| 平層 status＝open | 77 | `grep -l -E '^status: *open' OQ/*.md`，扣除 `規範 - OQ`、`範例 - OQ`、`OQ運作總覽` |
| 平層 status＝answered | 0 張真實卡（1 筆是 `範例 - OQ.md`，非真實 OQ） | `grep -l -E '^status: *answered' OQ/*.md` |
| 平層 status＝cancelled | 0 | `grep -l -E '^status: *cancelled' OQ/*.md` |
| 封存 `_archives/2026/` 總數 | 237 | `find OQ/_archives -name '*.md' \| wc -l` |
| 封存 status＝answered | 218 | `grep -rl -E '^status: *answered' OQ/_archives \| wc -l` |
| 封存 status＝cancelled | 19 | `grep -rl -E '^status: *cancelled' OQ/_archives \| wc -l` |
| 封存 status＝open | 0 | 同上，值 open |

平層檔案共 81 個項目：77 張 open 卡、3 張非卡（`OQ運作總覽.md`、`範例 - OQ.md`、`規範 - OQ.md`）、1 個 `_archives` 資料夾。全部（平層加封存）編號 OQ 共 263 張（編號格式 `前綴-NNN-` 比對）。

平層 77 張 open 卡的屬性（python 讀 frontmatter，基準日 2026-11-12）：

| 屬性 | 分布 |
|------|------|
| audience | internal 77、external 0 |
| priority | medium 52、low 24、high 1 |
| 超過 30 天（自 raised-at 起算） | 47 張；最久 176 天、最新 1 天 |
| 有 related-change 欄位 | 11 張（`grep -c 'related-change' OQ/*.md`） |

「30 天」門檻出處見 1.3。

### 1.2 OQ 卡欄位

出處：`memory/Sens_wiki/wiki/erp/00-meta/wiki-schema.md`（`### type=open-question`，第 342 行起）。

- wiki-schema.md:344：「平層 `08-open-questions/`＝未結案佇列（只放 status=open）；`08-open-questions/_archives/<拍板年份>/`＝已結案封存（answered／cancelled 拍板即移入，封存卡只增不改、翻案開新 OQ 引舊卡）。序號取號平層與封存一起算、永不重用。操作一律走 `oq-manage` skill。」

欄位逐行（wiki-schema.md:348–373 的 frontmatter 樣板）：

| 欄位 | 原文（wiki-schema.md 行號） |
|------|-----------------------------|
| type | `type: open-question`（348） |
| module | `module:`，值為中文 module（349–350） |
| tags | 「領域/<領域名>   # 必填，可多值；oq-manage mode A 依領域 tag 查佇列」（352） |
| oq-id | `oq-id: <前綴>-<NNN>`（353） |
| status | 「status: open \| answered \| cancelled   # 嚴格限此值域，禁 resolved / closed / active 等自創值，禁行內註解」（354） |
| priority | `priority: high \| medium \| low`（355） |
| audience | `audience: internal \| external`（356）；判斷問句「誰能回答這個問題？」（357） |
| raised-at / raised-by / source-link | 360–362 |
| related-vault / related-oq | 363–366；related-oq 註解「禁別名、禁短名」 |
| related-change | 「承接此問題的規劃主題名（`.scratch/<主題>/`，可多值）；無則刪整個欄位」（367） |
| expected-resolution-at | 「一律選填；何時確認由使用者排程，開卡時不代填時點、不硬填假日期」（369） |
| answered-at / answered-by | 370–371 |
| notion-url | `notion-url: <external 推送 Notion 後回填>`（372） |

（行號以 `sed -n 340,372p` 起算，樣板內各行位置誤差在 ±1 行內；欄位名稱與原文確定。）

卡內段落（`OQ/規範 - OQ.md:83-91` § 3.6）：問題描述、待解答、候選方案、部分拍板、決議。
- 規範 - OQ.md:91：「決議 \| **未拍板前整段不留**；拍板時寫結論＋理由（採納案為何站得住、否決案哪裡不成立）＋拍板日期與拍板者＋落地去處（逐卡 `[[卡名]]`，無需落地則寫明）」
- 規範 - OQ.md:17：「**OQ 卡是待裁決佇列的單位**——商業決策當下無法定案、或為避免對話過大而先記錄的問題，作為實作前要釐清的細節載體。」
- 規範 - OQ.md:19：「**它不是知識的家**：拍板後的知識歸正本卡（03／04／05／06），OQ 只留裁決紀錄與脈絡；」

### 1.3 `oq-manage` 做哪些事

`skills/oq-manage/SKILL.md`（71 行）加 `references/` 三檔（去重方法.md、待裁決清單格式.md、整理報告格式.md）。SKILL.md 沒有單獨定義 mode A 至 E 的表；模式字母只出現在「順序」表與「情況對應檔案」表的標籤。對應如下：

| 模式 | 功能 | 出處與原文 |
|------|------|-----------|
| A 查詢 | 討論前查某領域未解 OQ | SKILL.md:60：「討論前查某領域未解 OQ（mode A）\| 依 [[business-domain-taxonomy]] § 檢索規約判領域；查平層 status＝open 且領域 tag 命中的卡，先列卡名再讀」；SKILL.md:45：「討論時帶入未解 OQ \| mode A」 |
| B 開卡 | 去重後開卡，原處改連結，記 log | SKILL.md:44：「開卡，或指到既有卡；原處改連結；記 log \| mode B、mode D」；SKILL.md:29：「Miles 說「記下來」「列 OQ」就直接開卡。主對話自己識別到的，先提案，Miles 確認後開。」 |
| B 去重 | 開卡前搜平層 open 與全部封存 | 去重方法.md:7–9 表；SKILL.md:28：「開卡前先去重，範圍含 `_archives/`。已拍板的題不重開，引舊決議問 Miles。」 |
| C 裁決落地 | 拍板後補決議段、改 status、移封存、轉 wiki-amend | SKILL.md:47–48：「拍板：補決議段，改 status，移封存，記 log \| mode C」；「決議要改正本卡：轉 `wiki-amend` \| mode C」；SKILL.md:33：「決議落地到 03～07 正本卡，寫入轉 `wiki-amend`。本 skill 只動 OQ 卡。」 |
| C 封存 | 拍板即移 `_archives/<年>/`，卡只增不改 | SKILL.md:20：「封存卡 \| `08-open-questions/_archives/<拍板年份>/`，檔名不改」；SKILL.md:35：「封存卡只增不改。翻案開新卡，舊卡只追加取代註記」 |
| D 遷出 inline 不確定項 | 掃 `[!question]` 與「待確認」類措辭，遷成 OQ 卡 | 去重方法.md:14：「mode D 的掃描對象：`[!question]` callout，以及「待確認、待釐清、需確認、尚未確認、待補」措辭。引用既有 OQ 卡的連結不算。」；SKILL.md:27：「不確定項一律開獨立卡，原處改連結。禁 inline 標注，禁 `[!question]` callout，禁只在回覆裡說「列為 OQ」。」 |
| E 整理 | 狀態違規、可封存、久置、規範違反四張清單；只產報告 | 整理報告格式.md:3：「Miles 說「整理 OQ」「掃 OQ」「OQ 健康」時讀本檔（mode E）。」；整理報告格式.md:5：「mode E 只產報告。改動等 Miles 確認後才做，做了才記 log。」 |
| E 久置提醒 | 門檻 30 天，自 raised-at 起算；priority＝high 另標 | 整理報告格式.md:11：「open 久置天數 \| 30 天；自 `raised-at` 起算」；整理報告格式.md:19：「久置 \| status＝open 且超過久置天數；priority＝high 者另標 \| 問 Miles：裁決、延後或取消」。久置不會自動提醒，須 Miles 觸發 mode E 或 `vault-audit` 維度 8 才出報告（見 OQ運作總覽.md:36） |
| 待裁決清單 | erp-audit 評分表有待裁決項時，依 OQ 編號列給 Miles | 待裁決清單格式.md:14：「清單格式（當輪一次列給 Miles）」；欄位 OQ、待解答問句、依賴它的檢核項、不裁決會怎樣、建議（待裁決清單格式.md:21）；裁決後去向表（待裁決清單格式.md:33–40）：「延後 \| 只留 OQ 卡，status 維持 open；不寫進 spec.md」 |
| log | 動到 wiki 時記 log | SKILL.md:23：「`memory/Sens_wiki/wiki/log.md`，動作＝同步、標籤＝oq；只在動到 wiki 時記」 |

SKILL.md:12–13：「每個不確定項都在 `08-open-questions/` 平層有一張卡。平層張數就是待裁決的壓力。」「拍板後，卡只留在 `_archives/<年>/`，決議落地到正本卡。」
SKILL.md:34：「查詢撈出的 OQ 是未決選項。帶入討論時明說：不得當現況依據，不得拿來與 wiki 或 spec 比對矛盾。」
SKILL.md:32：「`audience` 一律填 internal。Notion Follow-up DB 推送暫停，恢復由 Miles 另行指示。」

### 1.4 誰引用 OQ

#### AGENTS.md（`/Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/AGENTS.md`）

| 行 | 原文 |
|----|------|
| 15 | wiki 層「放什麼」欄含「OQ」（「商業目標、痛點、營運原則、業務規則與恆定約束、角色分權、領域知識、KPI、OQ、業務可見欄位表…」） |
| 32 | 「商業決策（規則、欄位、狀態、權限）：寫進 wiki 卡；未定案的開 OQ。」 |
| 49 | 「識別到不確定項、待裁決項 \| `oq-manage`，立即開卡，禁 inline 標注」 |
| 60 | 「流程順序：`erp-plan` 盤點 → `grill-with-docs`（中途 `oq-manage`）→ `wiki-amend` → …」 |
| 86 | 「新不確定項 \| 已開 OQ 卡。提交前掃本次改動的 Vault 與規劃單，有 `[!question]` 或「待確認」類措辭就先遷出（`oq-manage`）」 |
| 104 | 陷阱：「OQ 裁決加閾值分級、疊提醒、新欄位；預設先不做，人工可行先人工 \| 記憶卡 feedback_no_over_design_on_oq」 |

#### 其他 skill（`grep -rn -E 'oq-manage|OQ' .claude/skills`，排除 oq-manage 自己）

| 檔:行 | 原文（摘要處以…標示截斷） |
|-------|------------------------|
| skills/erp-plan/SKILL.md:49 | 「`grill-with-docs`，第一題確認調研建議；盤點結果當查事實的來源；識別到不確定項立即 `oq-manage` 開卡，不等 grill 結束」 |
| skills/erp-plan/SKILL.md:30 | 「盤點交子代理；修補、存檔、開 OQ 在主對話。」 |
| skills/erp-plan/references/盤點方法.md:29, 40 | 「未決 \| 要 Miles 決定的事 \| `oq-manage` mode B 開卡」；「待確認 OQ \| 依涉及領域查 `08-open-questions/` 平層（`oq-manage` mode A）；列編號與一句議題；不預設任何編號前綴」 |
| skills/erp-plan/references/衝突檢查.md:11, 22 | 「相關的未決 OQ \| `oq-manage` mode A；只查 `08-open-questions/` 平層」；「A 繞過：用既有機制；B 推翻：改既有規則；C 待釐清：開 OQ」 |
| skills/erp-plan/references/設計收件.md:24, 47 | 「定不了的事開 OQ（`oq-manage` mode B），情境表標「待 OQ」，不擋送審。」；「沒有行為依賴未決 OQ；有的話，該處寫明「OQ 拍板前此行為不得寫進規劃單」」 |
| skills/erp-plan/references/平行盤點.workflow.js:60–61, 132–134 | `openOQ`「既有未決 OQ」、`newOQ`「建議新開的 OQ 議題，一句一條；編號由 oq-manage 給」；note「新 OQ 走 oq-manage mode B」 |
| skills/erp-audit/references/稽核者派工單.md:39 | 「依賴 \| 待裁決必填：依賴哪張 OQ，或哪條偏離」 |
| skills/erp-audit/SKILL.md:75 | 陷阱「依賴未決 OQ 的項目判「部分通過」退回設計者，設計者修不動，輪數空轉」 |
| skills/wiki-amend/SKILL.md:40 | 「不確定項不寫進卡，轉 `oq-manage` 開卡，卡上只留連結。」 |
| skills/wiki-amend/references/落點判準.md:12 | 「不確定項 \| `oq-manage` 開卡；卡上只留連結」 |
| skills/vault-audit/SKILL.md:27–28 | 「OQ 卡轉 `oq-manage`」；「矛盾並排呈報，建議開 OQ，不自行調和。」 |
| skills/vault-audit/references/稽核維度.md:101–113 | 維度 8「OQ 健康度（機械，腳本）」；「open 停留超過 oq-manage 門檻（priority high 另標）\| 警告」 |
| skills/vault-audit/scripts/mechanical_check.py:11, 42, 507 | 讀 `.claude/skills/oq-manage/` 內門檻句（30 天）；`Dim(8, "OQ 健康度")` |
| skills/vault-ingest/SKILL.md:42–43, 52 | 「明確未解問題改走 `oq-manage` mode B，不寫 raw。」；「raw 卡內不用 `[!question]` callout；與 oq-manage 共用此禁令。」 |
| skills/vault-ingest/references/去處表.md:8, 25 | 「明確未解問題（問句、「是否要」）\| OQ（`oq-manage` mode B）」 |
| skills/linear-delivery/SKILL.md:34, 51, 80, 148 | 「規格缺口無法不捏造時，轉 `oq-manage` mode B」；「兩邊都沒有的開 OQ 標另案」；陷阱「未決 OQ 影響的規則沒標另案，或另案寫成定案句」 |
| skills/linear-delivery/references/規範 - Linear 交付.md:15, 285 | 「不外露內部檔：…內部問題編號（OQ 編號）與 PM 內部流程術語」；「來源未定義時停下，觸發 `oq-manage` mode B」 |

#### hooks（`.claude/hooks/`，只有一個檔 `memory_write_guard.py`）

- .claude/hooks/memory_write_guard.py:17：「- 商業決策（規則、欄位、狀態、權限）：寫進 wiki 卡；未定案的開 OQ。\n」（記憶目錄寫入被擋時的提示訊息）。
- 其他 hook 檔：找不到（`ls .claude/hooks` 只有此一檔；搜過 `grep -rn -E 'OQ|oq-manage|open-questions' .claude/hooks`）。

#### wiki 規範卡

| 檔:行 | 原文 |
|-------|------|
| memory/Sens_wiki/AGENTS.md:49 | 「發現矛盾就蓋掉舊說法。要開 OQ 卡（`oq-manage`），原處改連結引用」 |
| memory/Sens_wiki/AGENTS.md:60 | 「OQ：開卡、去重、拍板封存 \| `oq-manage`」 |
| memory/Sens_wiki/AGENTS.md:34–35, 41 | log 條目的動機行「得連 [[OQ卡]]」；衝突行「已開 [[OQ]]」；動機「OQ 拍板 / explore 定案 / Miles 指示」 |
| 00-meta/卡片撰寫共用規範.md:248, 272, 301 | 「矛盾：與既有卡、狀態機、規則卡、權責分工矛盾——停下並列出矛盾兩方，開 OQ，不自行調和。」；「不確定項開 OQ（`oq-manage` mode B），不留 inline 標注、不用 callout 釘正文。」；L1-5「無 inline 不確定項…不確定項一律開 OQ 卡後 wiki link 引用」 |
| 00-meta/scope-boundary.md:28, 136 | 「OQ \| `08-open-questions/` \| oq-manage skill 改寫後寫入」；「這是「明確未解問題」（不是觀察，是待回答的問題）？ \| 是 \| 進 OQ（不進 raw/，觸發 oq-manage mode B）」 |
| 00-meta/business-domain-taxonomy.md:20, 118 | 「`08-open-questions` 平層（status=open；此處的 tag 只服務 `oq-manage` mode A 的待辦…）」；2026-07-31 紀錄：檢索範圍排除整個 `08-open-questions/`，理由「OQ 是待辦佇列非事實正本，混入檢索會在 wiki 與 spec 比對時產生假矛盾」（118 行內文，原文較長，此為重點） |
| 00-meta/erp_index.md:41, 59 | 「無把握時明說不知道，該開 OQ 就開」；「待確認問題（OQ）：[[OQ運作總覽]]」 |
| 00-meta/wiki-schema.md:32, 85–87, 342–373, 441, 462 | type 值 `open-question`；status 值表；frontmatter 樣板；資料夾對應；OQ 前綴 enum |
| 11-review-knowledge/規劃品質評分準則.md:40, 44, 45, 69, 70 | 「待裁決 \| 陳述成立與否取決於未決 OQ，或取決於偏離業界做法的取捨 \| 不退回設計者。主對話當輪把全部待裁決項一次列給 Miles，每項寫明依賴哪張 OQ 或哪條偏離」；「OQ 拍板前此行為不得寫進規劃單」 |
| 11-review-knowledge/審查知識路由.md:36 | 「需求對齊 \| `grill-with-docs` skill；第一題確認調研建議；沒有 precheck.md 就停下補跑；中途識別的不確定項走 `oq-manage`」 |
| 08-open-questions/OQ運作總覽.md:13, 45 | 「OQ 是**待裁決佇列**：每張卡一個待確認的問題，拍板後決議寫回卡、封存出平層。」；「`.claude/skills/oq-manage/SKILL.md` — 操作正本（五 mode）」 |

#### wiki 正本卡連到 OQ 卡的連結

方法：python 掃 `memory/Sens_wiki/wiki/**/*.md`，排除 `08-open-questions/` 自己，比對 `[[檔名]]`（去掉別名與錨點）是否等於任一 OQ 卡檔名（263 個，含封存）。

| 範圍 | 連結處數 | 涉及檔案數 |
|------|---------|-----------|
| 正本卡 03-roles、04-business-logic、05-entities、06-state-machines、07-scenarios | 178 處，全部指向平層 open 卡，0 處指向封存卡 | 80 張卡 |
| 其中各層檔案數 | 04-business-logic 35、05-entities 21、07-scenarios 15、03-roles 5、06-state-machines 4 | |
| 其他（11-review-knowledge 4 張、00-meta 2 張、01-products 1 張、`log.md` 與 `changelog.md`） | 全部 wiki 排除 OQ 資料夾後合計 997 處、87 張卡；其中非 log 檔合計 189 處、85 張卡（log.md 約佔 808 處） | |

## 二、matt 流程怎麼處理「還沒決定的事」

讀過全文：`matt/productivity/grilling`、`engineering/grill-with-docs`、`engineering/to-spec`、`engineering/to-tickets`、`engineering/domain-modeling`（含 ADR-FORMAT.md）、`engineering/wayfinder`、`engineering/triage`、`productivity/handoff`；本專案 `docs/agents/issue-tracker.md`、`triage-labels.md`、`domain.md`；`.scratch/workflow-rebuild/research/04-matt-flow.md`（搜尋相關詞後讀重點段，全檔 428 行未逐行通讀）。

| skill | 未決問題記在哪 | 什麼時候問 | 問完記到哪 |
|-------|---------------|-----------|-----------|
| grilling | 只在對話；沒有紀錄檔。「設計樹」每個決定掛下一層決定 | 以「回合」問：一次問完「frontier」（前提都已定案的所有問題），每題附建議答案，等使用者答完再算下一輪（matt/productivity/grilling/SKILL.md:8） | 無落點。第 30 行：「The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.」（設計樹全走完才算結束，使用者確認才行動） |
| grill-with-docs | 同 grilling 加 domain-modeling | 同 grilling | 第 7 行：「Call the Skill tool twice, for "grilling" and "domain-modeling".」（只做委派，自己無內容）；詞彙與 ADR 由 domain-modeling 即時寫 |
| domain-modeling | 沒有未決問題容器。處理的是「用語衝突、模糊用語」，當場問使用者 | 對話中：「Challenge against the glossary」「Sharpen fuzzy language」（SKILL.md:44–50） | 詞彙定案寫入 `GLOSSARY.md`（SKILL.md:60–64：「When a term is resolved, update `GLOSSARY.md` right there.」）；ADR 只在三條件全成立時才提議（SKILL.md:66–73：難以反悔、沒有脈絡會讓人意外、真有取捨）。ADR-FORMAT.md:21 的 Status 可選值含 `proposed`（提議中，非問題容器） |
| to-spec | 沒有。第 7 行：「Do NOT interview the user; just synthesize what you already know.」（不訪談，只整理已知） | 唯一會問的是測試接縫：「Check with the user that these seams match their expectations.」（第 17 行） | 規劃單模板有「Out of Scope」與「Further Notes」段（第 67–73 行），沒有「未決問題」段。發布到追蹤器並貼 `ready-for-agent`（第 19 行） |
| to-tickets | 沒有未決問題容器。第 4 步「Quiz the user」問拆法粒度、阻擋邊是否正確（to-tickets/SKILL.md:42–56） | 發布前一次 | 使用者核准才發布；票以「Blocked by」記阻擋關係（第 38、62–63 行）；票的 Status 預設 `ready-for-agent`（第 77 行） |
| wayfinder | 地圖（map）的兩處：（1）「Not yet specified」段：看得到但還不能精確表述的決策（wayfinder/SKILL.md:46–48、84–93）；（2）能精確表述的問題建成「決策票」（child issue），每票一個 Question（第 57–63 行） | 地圖建好後，每個工作階段只解一張票：「never resolve more than one ticket per session, with the exception of research tickets」（第 105 行）。票型：research（AFK）、prototype、grilling（預設，HITL）、task（第 77–80 行） | 解答寫成「resolution comment」，關票，並在地圖「Decisions so far」補一行索引（第 125 行）。第 23 行：「The map is an **index**, not a store.」（地圖只做索引）。本專案本機做法：docs/agents/issue-tracker.md:25–30 `.scratch/<effort>/map.md` 與 `issues/NN-<slug>.md`，`Status: claimed／resolved`、`Blocked by:`、答案寫在 `## Answer` 段 |
| triage | 議題的狀態標籤。`needs-info`：「waiting on reporter for more information」（等回報者補資訊）（triage/SKILL.md:34） | 處理某議題時：先查事實、判斷分類，必要時 grill（第 76 行） | `needs-info` 時貼「Triage Notes」留言，分「What we've established so far」與「What we still need from you」兩段（第 94–106 行）；回覆後回 `needs-triage`（第 45 行）。本專案標籤對照 docs/agents/triage-labels.md:7–11 與 matt 原名相同 |
| handoff | 不記問題；把對話摘要成交接檔給下個代理 | 使用者要換工作階段時 | 第 8 行：存到系統暫存目錄，不放工作區。第 12 行：「Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.」（已在別處有紀錄的不複寫，用路徑引用） |
| 本專案 docs/agents 三檔 | issue-tracker.md：議題放 `.scratch/<feature-slug>/`；留言放檔尾 `## Comments`（第 11 行）；triage-labels.md：五個標籤；domain.md：讀 `GLOSSARY-MAP.md` 與 `docs/adr/`，第 35–37 行「Flag ADR conflicts」：與既有 ADR 矛盾時明說 | | |

`.scratch/workflow-rebuild/research/04-matt-flow.md` 相關原文：
- 第 19 行：「7. matt 沒有對「規格本身」的稽核步驟。規格的品質只靠三個人工關卡：`grilling` 結束要使用者確認、`to-spec` 要使用者確認測試接縫、`to-tickets` 要使用者核准拆法。」
- 第 23 行：「11. matt 沒有、本專案必須自補的步驟（詳見第八節）：對規格與 wiki 的稽核、業務規則的長期正本與落卡、不確定項管理、對 Linear 的交付、…」
- 第 376 行：「`triage` \| 處理外部回報者的議題 \| 本專案無外部回報者 \| 「識別到不確定項」本專案用 `oq-manage` 開 OQ 卡；matt 無不確定項管理，最近的是 `needs-info`，但語意是等回報者」
- 第 402 行：「訪談中 \| 詞彙與 ADR 即時寫入 \| `oq-manage` 即時開 OQ 卡，且禁止在卡內標注待確認 \| 多出不確定項分流」
- 第 20 行：「8. matt 的詞彙表（`GLOSSARY.md`）只放用語定義，不放規則、欄位、狀態；「其餘決定只留在對話」，由 `to-spec` 接走。」
- 第 14 行：「2. 大題目（一個工作階段裝不下、路還看不清）走 `wayfinder`：先畫地圖，每個工作階段只解一張決策票；地圖清空後交回主流程的 `to-spec`，不直接建置。」

搜過 matt 的 to-spec、to-tickets、domain-modeling、grill-with-docs、grilling、handoff 全文，關鍵字 `open question|unresolved|undecided|not yet specified|needs-info|TBD|unknown`：只有 wayfinder 的「Not yet specified」與 triage 的 `needs-info` 命中。

## 三、對照表

| OQ 功能 | OQ 現況出處 | matt 流程裡做同一件事的機制 | 出處或「沒有對應」 |
|---------|-----------|---------------------------|-------------------|
| 1. 開卡記下問題 | SKILL.md:27、29、44 | 部分對應（三種，語意都不同）：（a）wayfinder 把「能精確表述」的問題建成決策票，一票一個 Question；（b）wayfinder 把「還不能精確表述」的問題寫進地圖「Not yet specified」；（c）triage 的 `needs-info` 留言列「What we still need from you」。grilling 與 domain-modeling 只在對話當場問，不留紀錄 | matt/engineering/wayfinder/SKILL.md:57–63、46–48；matt/engineering/triage/SKILL.md:94–106；matt/productivity/grilling/SKILL.md:8。差異：wayfinder 的票與地圖需先「Chart the map」建立（第 107–117 行）；`needs-info` 對象是議題回報者，不是 PM 自己的設計題 |
| 2. 依模組查未解問題 | SKILL.md:60（mode A，依領域 tag 查平層 open） | 部分對應：wayfinder 的 frontier 查詢（open、未被阻擋、未認領的子議題）；triage 的「Show what needs attention」三桶（unlabeled、`needs-triage`、`needs-info`） | matt/engineering/wayfinder/SKILL.md:69；matt/engineering/triage/SKILL.md:58–62；docs/agents/issue-tracker.md:28。差異：兩者都以單一地圖或單一追蹤器為範圍，沒有「依業務領域標籤跨主題查」的機制，找不到相關描述（搜過 wayfinder、triage、domain-modeling） |
| 3. 裁決後寫回正本卡 | SKILL.md:33、47–48（mode C，轉 wiki-amend） | 部分對應：詞彙定案當場寫 `GLOSSARY.md`；重大決策寫 ADR（三條件）；wayfinder 票的答案寫成 resolution comment 並在地圖 Decisions so far 補索引。其餘決定「只留在對話」再由 to-spec 接走 | matt/engineering/domain-modeling/SKILL.md:60–64、66–73；matt/engineering/wayfinder/SKILL.md:125；04-matt-flow.md:20。matt 的 `GLOSSARY.md` 不放規則、欄位、狀態，沒有「業務規則寫回哪張卡」的機制（04-matt-flow.md:20、§ 8.2 表「業務規則的家 \| 原文未說明」） |
| 4. 封存已解的 | SKILL.md:20、35；規範 - OQ 平層只放 open、answered 即移 `_archives/<年>/` | 部分對應：wayfinder 關票（close the issue）加地圖索引；triage 的 `wontfix` 關議題，被拒的功能需求另寫 `.out-of-scope/`。沒有「依年份資料夾封存」「封存卡只增不改、翻案開新卡引舊卡」的機制 | matt/engineering/wayfinder/SKILL.md:125；matt/engineering/triage/SKILL.md:82–85、OUT-OF-SCOPE.md。差異：wayfinder 對「已關決策發現錯誤」沒有官方做法（04-matt-flow.md 第 9 節第 9 點：「已關決策發現錯誤時無官方做法，代理傾向繞過而非挑戰」） |
| 5. 久置提醒 | 整理報告格式.md:11、19（30 天；mode E 需 Miles 觸發才出報告）；vault-audit 維度 8 腳本 | matt 沒有對應。wayfinder 與 triage 找不到逾期、久置、停留天數的規則；04-matt-flow.md 第 9 節第 3 點亦寫「有無「認領逾期」或「重新認領」規則，原文未說明」。搜過：wayfinder、triage、to-tickets、handoff 全文 | 找不到。triage 的「Show what needs attention」只排序「oldest first」（triage/SKILL.md:58），不設門檻，不標示久置 |
| 6. wiki 卡上引用未解問題 | SKILL.md:27（原處改連結，禁 inline、禁 `[!question]`）；正本卡 178 處連結到 open OQ 卡 | matt 沒有對應。matt 的詞彙表禁放實作細節，沒有規定未解問題怎麼在其他文件被引用。wayfinder 的「Refer by name」規定地圖內引用票要用名稱包連結，但那只管地圖與票之間（wayfinder/SKILL.md:15–17）。找不到「文件內不確定項怎麼標示」的規定（搜過 domain-modeling、to-spec、GLOSSARY-FORMAT.md 關鍵字 `unresolved|TBD|unknown`） | 找不到 |
| 7. 給 Miles 的待裁決清單 | 待裁決清單格式.md:14–29（依 OQ 編號列：待解答問句、依賴它的檢核項、不裁決會怎樣、建議） | 部分對應：grilling 每輪「frontier」編號問題並附建議答案，等使用者答；triage 的 needs-info 範本列「What we still need from you」。沒有「稽核評分表待裁決項彙整成清單」的機制，matt 也沒有稽核步驟 | matt/productivity/grilling/SKILL.md:8–22；matt/engineering/triage/SKILL.md:94–106；04-matt-flow.md:19（「matt 沒有對「規格本身」的稽核步驟」）。差異：grilling 的問題當場問當場答，不跨輪保存 |
| 8. 去重（開卡前搜既有卡與封存卡） | SKILL.md:28；去重方法.md | 部分對應：triage 步驟 1 查「redundancy」（是否已實作）與「prior rejection」（`.out-of-scope/`）；wayfinder 沒有去重規則 | matt/engineering/triage/SKILL.md:70。對象是外部回報的需求與既有程式，不是「同一未決問題是否已有票」；找不到 wayfinder 去重規則 |
| 9. 一卡一議題、卡只放問題與候選方案、決議整段拍板才寫 | 規範 - OQ.md:53、83–91 | 部分對應：wayfinder 票「sized to one 100K token agent session」，Question 段只放問題，答案在關票時另記（wayfinder/SKILL.md:57–71：「The answer isn't part of the body; it's recorded on resolution」）。找不到「候選方案段」「不受影響項」「部分拍板」的對應結構 | matt/engineering/wayfinder/SKILL.md:57–71 |
| 10. 外部確認（audience＝external，推送 Notion） | SKILL.md:32（推送暫停）；OQ運作總覽.md:25–28、38–41 | matt 沒有對應。triage 的 `needs-info` 是向回報者索資訊，沒有「分內部、外部」欄位 | 目前 77 張全為 internal，0 張 external（本檔 § 1.1） |

### 對照表摘要

- 有部分對應（機制同類但粒度、範圍、對象不同）：開卡記問題（1）、依模組查（2）、裁決後寫回（3）、封存（4）、待裁決清單（7）、去重（8）、卡的結構（9）。
- matt 沒有對應：久置提醒（5）、wiki 卡上引用未解問題（6）、外部確認（10）。
- 沒有任何一列在 matt 裡是完整對等；所有「部分對應」項的差異欄都已列出。
