# Skill 改寫準則（草案，待 Miles 確認）

來源只取 Anthropic 官方文件站 `platform.claude.com/docs`（2026-11-04 讀取）。Miles 指定的「claude.dev」不是 Anthropic 官方站，經 Miles 確認改用本站。
引文為英文原文，每句不超過 15 字。官方站沒有「Claude 5 系列專用的 skill 撰寫頁」：skill 撰寫頁不分模型版本；模型專屬指引在各模型的提示頁。下表分開標示。

## 一、官方來源清單

| 代號 | 頁面 | 網址 |
|------|------|------|
| S | Skill authoring best practices | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices |
| P | Prompting best practices（涵蓋 Fable 5.1、Opus 5.5、Sonnet 5.5、Haiku 5.5） | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| P-S | Prompting Claude Sonnet 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5 |
| P-O | Prompting Claude Opus 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 |
| P-F | Prompting Claude Fable 5.1 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1 |
| M | Models overview（確認 Claude 5 系列型號與預設強度） | https://platform.claude.com/docs/en/models/overview |

## 二、準則（每條附官方原文）

| 編號 | 準則 | 官方原文 | 出處 |
|------|------|---------|------|
| R1 | 只寫模型本來不知道的事。刪掉解釋通用概念的段落 | "Only add context Claude doesn’t already have." | S，Concise is key |
| R2 | 規則的硬度配合步驟的脆弱度。易錯、順序固定的步驟寫死；可多解的步驟只給方向 | "Match the level of specificity to the task’s fragility and variability." | S，Degrees of freedom |
| R3 | 描述欄用第三人稱，同時寫「做什麼」與「何時用」 | "Always write in third person." | S，Writing effective descriptions |
| R4 | 描述欄不超過 1,024 字元 | "description: Maximum 1,024 characters" | S，YAML frontmatter |
| R5 | `SKILL.md` 本文不超過 500 行；超過就拆檔 | "Keep the `SKILL.md` body under 500 lines for optimal performance." | S，Progressive disclosure |
| R6 | 引用檔只從 `SKILL.md` 往下一層，不再往下串 | "Keep references one level deep from `SKILL.md`." | S，Avoid deeply nested references |
| R7 | 超過 100 行的引用檔，檔首放目錄 | "For reference files longer than 100 lines, include a table of contents" | S，Structure longer reference files |
| R8 | 一個概念只用一個詞，全 skill 一致 | "Choose one term and use it throughout the Skill." | S，Use consistent terminology |
| R9 | 有預設做法就只給預設，附一個例外出口，不列多條路 | "Don’t present multiple approaches unless necessary" | S，Avoid offering too many options |
| R10 | 品質關鍵的步驟寫成「檢查，不過就改，再檢查」迴圈 | "Run validator → fix errors → repeat" | S，Implement feedback loops |
| R11 | 先建評測，再寫大量說明 | "Create evaluations BEFORE writing extensive documentation." | S，Build evaluations first |
| R12 | 不寫會過期的時間資訊；舊做法放獨立段 | "Don’t include information that will become outdated" | S，Avoid time-sensitive information |
| R13 | 指令清楚明確。要模型多做，就明說，不要靠它推測 | "Claude responds well to clear, explicit instructions." | P，Be clear and direct |
| R14 | 少用強硬語氣。新模型對系統提示更敏感，強硬語氣會造成過度觸發 | "The fix is to soften any aggressive language." | P，Tool usage（該段實測對象是 Opus 4.5、4.6） |
| R15 | 明寫「做完該做的就停，不加未要求的功能、測試、檔案、文件」 | "Don't add features, tests, files, docs or refactors that weren't asked for." | P-S，Steer initiative and scope |
| R16 | 明寫「不是卡在使用者才能解的事，就做到完」 | "Keep working until everything the user asked for is done" | P-S，Steer initiative and scope |
| R17 | 改了可執行的東西，回報完成前要跑真正會碰到改動的檢查 | "run a real check that exercises the change before reporting it done" | P-S，Verification on coding tasks |
| R18 | 要少想，調低強度；不要在文字裡叫模型少想 | "Asking the model in the system prompt to think less doesn’t reliably reduce its thinking." | P-S，Calibrate effort |
| R19 | 不要要求模型把推理過程寫進回覆；可要求簡短說明或動作摘要 | "remove those instructions, because they invite `reasoning_extraction` declines." | P-S，Safeguard refusals |
| R20 | 長任務用清單追蹤；只有文字的回合結束不等於做完 | "Treat a text-only end of turn as a report rather than as proof the task is done." | P-O，Unattended agentic runs |
| R21 | 簡單任務、單檔修改、需要連續脈絡的任務，直接做，不派子代理 | "work directly rather than delegating" | P，Subagent orchestration |
| R22 | 每個 skill 要用實際會用的模型測試 | "Test your Skill with all the models you plan to use it with." | S，Test with all models |
| R23 | 模型專屬做法，換模型後要用自己的評測重新驗證 | "re-check it against your own evals before applying it to another." | P，General principles |

### 補充：官方 skill-creator 與 claude.dev 部落格（2026-11-04 追加）

| 編號 | 準則 | 官方原文 | 出處 |
|------|------|---------|------|
| R24 | 規則要附理由。全大寫的 ALWAYS、NEVER 是警訊 | "Try hard to explain the **why** behind everything" | SC，Improving the skill |
| R25 | 保持精簡，刪掉沒用的段落；讀執行紀錄找出讓模型白做工的段落 | "Keep the prompt lean. Remove things that aren't pulling their weight." | SC，Improving the skill |
| R26 | 描述欄用實際查詢句評測觸發率；太簡單的單步查詢不會觸發 skill，不能當測試句 | "Claude only consults skills for tasks it can't easily handle on its own" | SC，How skill triggering works |
| R27 | 為舊模型寫的「不要偷懶」類補丁，換模型後先刪掉再重跑評測 | "remove them and re-run your evals before tuning anything else." | C-S，On migrating existing prompts |

來源補充：

| 代號 | 頁面 | 網址 |
|------|------|------|
| SC | 官方 skill-creator 外掛（Anthropic 發行，本機 `claude-plugins-official/plugins/skill-creator`；上游 `anthropics/skills` 最後一次動到它是 2026-03-06） | https://github.com/anthropics/skills/commits/main/skills/skill-creator |
| C-S | claude.dev 部落格「Building with Claude Sonnet 5.5」（作者 Addy Osmani，2026-09-28） | https://claude.dev/blog/building-with-claude-sonnet-5-5/ |
| C-O | claude.dev 部落格「Getting the most out of Opus 5.5 in Claude and Claude Code」（2026-09-22） | https://claude.dev/blog/getting-the-most-out-of-opus-5-5/ |

claude.dev 的性質：自稱「來自 Anthropic 開發者的技術文章」，但頁面沒有署名營運者，我無法證實它是 Anthropic 官方站。它目前列出的 10 篇都不是 skill 撰寫指南；有「SKILLS」分類標籤但本次沒取得該分類的文章清單。

## 三、與 Sens 現況的對照（我先掃過的事實）

| 項目 | 事實 | 指令輸出 |
|------|------|---------|
| 描述欄長度 | 七個 skill 的描述欄都在 R4 的 1,024 字元內；最長是 wiki-amend 525、erp-plan 490 | `python3 -I` 以 UTF-8 逐字元統計：erp-plan 490、erp-audit 168、linear-delivery 232、oq-manage 303、vault-audit 288、vault-ingest 330、wiki-amend 525 |
| 本文行數 | 四個 skill 皆在 R5 上限內 | `wc -l`：erp-plan 75、erp-audit 75、linear-delivery 150、oq-manage 70 |
| 描述欄格式 | 現用「用：…不用：…」，已含何時用；官方要求第三人稱，現有寫法不含第一、二人稱，符合 R3 | 目視 `erp-plan/SKILL.md` 前 8 行 |

## 四、最強反例與處理

反例：官方鼓勵「寫短、少強調」（R1、R14），但 Sens skill 有大量 MUST 與禁止清單，改短可能讓關鍵規則消失。
結論：反例不成立於「易錯且順序固定」的步驟。R2 明說這類步驟要寫死。所以 Sens 的禁止清單與把關條件保留；只刪解釋通用概念的段落，並把「強硬語氣」限縮到真正不可逆的動作。
但 R14 的實測對象是 Opus 4.5、4.6，官方也說模型專屬做法要重驗（R23）。因此 R14 只當方向，不當硬性規則；改寫後用評測集（觸發評測、稽核回放）比對前後差異。

## 五、無法確認處

| 項目 | 說明 |
|------|------|
| Sonnet 5.5 的 skill 專屬指引 | 官方 skill 撰寫頁不分模型，只在檢核表要求測 Haiku、Sonnet、Opus。Sonnet 5.5 的行為差異只在 P-S 頁，已納入 R15 至 R18 |
| Haiku 5.5 頁、Fable 5.1 頁 | Haiku 頁未讀。Fable 5.1 頁只讀了強度、寫作密度與範圍段，其餘章節未讀；本準則未引用它的內容 |
| R14 對 Claude 5 系列是否仍適用 | 官方原句限定 Opus 4.5、4.6，5 系列未見同句，標未查證 |
