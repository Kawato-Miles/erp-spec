# 票 39 調研：Anthropic 的產品團隊怎麼用 AI 迭代產品

調研日期：2026-11-12。接續票 16，不重做票 16 已查的部分。

## 讀法與限制

- 來源類型：全部是 Anthropic 談自己，或 Anthropic 人員在第三方節目中談自己。這是廠商自述，沒有獨立驗證。
- 讀取方式：用指令列工具把網頁原始碼存成檔案，再整頁讀文字。不用會先摘要的抓取工具。所以下列引文是從原頁文字逐字照抄。
- 「全文」指頁面文字從頭讀到尾。「部分」指只讀了一段，或遇到付費牆。「二手」指不是原文，是別人的摘要。
- 逐字稿類來源由第三方整理（Every、Latent Space、Simon Willison）。語音轉文字的錯字保留在引文中時會註明。
- 引文保留英文，後面一句中文說明。

## 來源清單（依對 Miles 的重要性排序）

| 編號 | 網址 | 作者與日期 | 讀取程度 | 最值得主對話自己讀的理由 |
|------|------|-----------|---------|------------------------|
| S1 | https://claude.com/blog/product-management-on-the-ai-exponential | Cat Wu（Claude Code 產品負責人），2026-03-19，Anthropic 官方 | 全文 | 官方對「產品經理角色怎麼變」的唯一直接文章。短，必讀。 |
| S2 | https://simonwillison.net/2026/Jul/21/cat-and-thariq/ | Cat Wu、Thariq Shihipar 對談，Simon Willison 主持並編輯，2026-07-21 | 全文（編輯過的逐字稿；Willison 的粗體重點與評語不是 Anthropic 人員所說，本檔不引用） | 最新（2026-07）。含發布門檻、程式碼審查信任流程、產品經理補缺口的做法。 |
| S3 | https://every.to/podcast/transcript-how-to-use-claude-code-like-the-people-who-built-it | Cat Wu、Boris Cherny 對談，Dan Shipper 主持，2025-10-29 | 全文 | 日常做法最具體：職責分工、內部試用（ant fooding）、規劃模式、斜線指令。 |
| S4 | https://every.to/podcast/transcript-how-to-build-an-agent-native-product | Mike Krieger（Anthropic Labs）對談，Dan Shipper 主持，2026-03-25 | 全文 | 談「什麼變容易、什麼沒變」、小團隊、兩週評估、沒決定的事怎麼處理。 |
| S5 | https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic | Saffron Huang 等，2025-12-02，Anthropic 官方研究 | 全文（含附錄） | 唯一有調查與使用資料的來源：哪些事交給 AI、哪些自己判斷。限於工程師，不含產品經理。 |
| S6 | https://www.latent.space/p/felix-anthropic | Felix Rieseberg（Cowork 負責人，職稱為技術人員）對談，swyx、Alessio 主持，約 2026-03-17 | 部分（87 分鐘逐字稿，語音轉文字有錯字；讀了「為什麼 10 天做完」「把所有候選都做出來」及關鍵字命中段，其餘未讀） | 與 Cat Wu 不同團隊（Cowork）的說法，可對照。 |
| S7 | https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built | Gergely Orosz，2025-09-23，第三方記者訪談 Boris Cherny、Sid Bidasaria、Cat Wu | 部分（付費牆，讀到第 3 節「Building and shipping features in days」結束；第 4 節以後未讀） | 有 20 個原型的實例與提示語。注意引用段落中有記者自己的評論。 |
| S8 | https://claude.com/blog/how-anthropic-teams-use-claude-code | Anthropic 官方，2025-07-24 | 全文 | 產品設計團隊、產品工程團隊的實際用法。 |
| S9 | https://code.claude.com/docs/en/best-practices | Anthropic 官方說明文件，日期頁面未載 | 部分（讀了「Brainstorm with Claude first」到「Enforce the check with a Stop hook」；其餘未讀） | 官方建議的「先訪談、寫 SPEC.md、再依規格審查」流程。 |
| S10 | https://techcrunch.com/2026/05/13/anthropics-cat-wu-says-that-in-the-future-ai-will-anticipate-your-needs-before-you-know-what-they-are | Lucas Ropek（TechCrunch）訪談 Cat Wu，2026-05-13 | 全文（短） | 一段關於「管理代理人需要懂該領域」的說法。 |
| S11 | https://www.anthropic.com/news/introducing-anthropic-labs | Anthropic 官方，2026-01（頁面未標日期，內文稱 Cowork「昨天」發布） | 全文（短） | 官方對 Labs 三種動作的描述。 |
| S12 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | Justin Young，Anthropic 工程部落格，日期頁面未載 | 全文 | 談代理人長時間工作，不是產品經理做法。只有「功能清單檔」一點與規格有關。 |
| S13 | https://inferencebysequoia.substack.com/p/anthropic-cpo-mike-krieger-building | Sequoia 的 Inference 電子報，2025-05-08 | 二手（頁面自述用 Claude 3.7 從逐字稿改寫成文章；內含 Krieger 原話片段，但不是逐字稿） | 只用於一句關於「對齊會議變成瓶頸」的引文，並標明二手。 |

未取得逐字稿、因此未列為來源的線索：Lenny's Podcast 的 Cat Wu 訪談（付費牆，搜尋只回到摘要）；Cat Wu 與 Alex Albert 的訪談（只有節目列表頁，沒有逐字稿）。

## 問題 1：產品經理每天做什麼、產出什麼；哪些交給 AI，哪些自己判斷

### 1.1 產出物：原型、評測、腳本，不是規格文件

- S1，Cat Wu 描述自己的工具分工。
  - 原文：「Claude Code is where I build prototypes, evals, and scripts, many of which call Claude API.」
  - 說明：她用寫程式的工具做原型、評測與腳本。
- S1，她早期的工作。
  - 原文：「building Streamlit apps to analyze large-scale user feedback and running evals to help the company find new benchmarks to trust」
  - 說明：她自己寫小程式分析大量使用者回饋，並跑評測找出可信的基準。
- S1，團隊角色界線。
  - 原文：「designers ship code, engineers make product decisions, product managers build prototypes and evals.」
  - 說明：設計師交付程式碼，工程師做產品決定，產品經理做原型與評測。
- S1，產品經理的職責定義。
  - 原文：「The product manager’s job is to create clarity in the ambiguity that rapid model progress creates, push the team to think bigger about what’s possible, and clear the path to shipping faster.」
  - 說明：職責是在模糊中建立清楚的方向、推團隊想更大、清除阻礙。

### 1.2 日常：把發布流程帶完，補缺口

- S3，Cat Wu 說明自己與 Boris Cherny 的分工。
  - 原文：「setting the quality threshold for dogfooding through to communicating that to our end users」
  - 說明：她決定哪些原型進入內部試用、定內部試用的品質門檻、再對外溝通。同段還提到她負責定價與包裝。
- S3，Boris Cherny 說技術方向與點子來源。
  - 原文：「these ideas come from everyone」
  - 說明：待辦清單、子代理、掛鉤、外掛都由不同成員做出來，不是由產品經理規劃出來的。
- S2，Cat Wu 說產品經理的日常。
  - 原文：「For us it really means plugging in whenever there’s any kind of gap.」
  - 說明：哪裡有缺口就補哪裡。她舉例：沒有工程師接的點子，自己先做成筆記本原型再激發工程師接手；設計有點偏，就做第一版設計再請細心的人補。
- S2，同一段。
  - 原文：「let’s automate getting those status updates asynchronously so we’re not bugging people」
  - 說明：她把發布行事曆與狀態更新也交給自動化。
- S2，Cat Wu 說判斷力的價值。
  - 原文：「So it’s an increase in value on product taste and business sense, and a bit lower on execution in most product domains.」
  - 說明：品味與商業判斷的價值上升，執行的價值下降。
- S2，同段，Cat Wu 自己標出例外。
  - 原文：「for infra there’s still a very heavy emphasis on making sure all the details are right」
  - 說明：基礎設施類仍然要求每個細節正確。

### 1.3 編制：產品經理很少

- S4，Krieger 說 Labs 的編制。
  - 原文：「It’s rarely a pure PM. We actually only have one PM for all of labs right now.」
  - 說明：Labs 的新專案帶頭人通常是設計師或懂產品的工程師，整個 Labs 只有一位產品經理。
- S7 引 Cat Wu 為「創始產品經理」，並說團隊後來有工程、產品管理、設計、資料科學。
- S3 中 Boris Cherny 說團隊經理「hasn’t coded in like 10 years」，第一天就送出合併請求。

### 1.4 哪些交給 AI、哪些自己判斷

S5 的調查對象是工程師與研究員，不是產品經理。引用它是因為它是唯一有資料的來源。

- S5，受訪者保留的工作。
  - 原文：「People consistently said they didn’t use Claude for tasks involving high-level or strategic thinking, or for design decisions that require organizational context or “taste.”」
  - 說明：高層策略與需要組織脈絡或品味的設計決定，由人自己做。
- S5，交給 AI 的條件，受訪者原話。
  - 原文：「It's absolutely amazing for everything where validation effort isn't large in comparison to creation effort.」
  - 說明：驗證成本遠低於製作成本的事，才適合交出去。S5 另列：定義明確或自成一體、低風險、重複或無聊的事。
- S5，邊界會變。
  - 原文：「Many people described delegation boundaries as a “moving target,”」
  - 說明：交付邊界隨模型進步重新談。
- S5，完全放手的比例。
  - 原文：「more than half said they can “fully delegate” only between 0-20% of their work to Claude」
  - 說明：多數人只能完全放手 0 至 20% 的工作，其餘需要主動監督與驗證。
- S10，Cat Wu 談管理代理人。
  - 原文：「I think it is extremely hard to manage agents if you can’t do the job yourself.」
  - 說明：管理代理人的人要懂該領域，並能排查代理人為什麼出錯。
- S8，產品設計團隊用 AI 找例外情況。
  - 原文：「mapping out error states, logic flows, and system statuses to identify edge cases during design rather than discovering them in development」
  - 說明：在設計階段就用 AI 列出錯誤狀態、邏輯流程、系統狀態，提早找邊界情況。
- S3，Cat Wu 說 AI 不會主動發問，要自己下指令。
  - 原文：「Please ask me questions. If there’s anything you’re unsure about, I want you to ask questions」
  - 說明：腦力激盪時，她明確要求 Claude 反問她。

## 問題 2：從想法到上線的步驟；規格、原型、工程票怎麼保持一致

### 2.1 各來源描述的步驟（非單一官方流程；來源沒有給出一張完整流程圖）

| 步驟 | 來源與原文 | 說明 |
|------|-----------|------|
| 想法來源 | S1：「A side quest is a short self-directed experiment you run outside your official roadmap」 | 任何人用一個下午做的短實驗，不在正式規劃內。 |
| 想法來源 | S1：「Some of Anthropic’s most popular features—Claude Code on Desktop, the AskUserQuestion tool, and todo lists—emerged this way.」 | 官方稱這幾個功能是這樣出現的。 |
| 想法來源 | S3：「historically a lot of Claude Code has been built bottom-up」 | Cat Wu 說過去多半由下而上。同段她接著說，擴展到更多服務時，改為「let’s talk to customers」，找客戶與工程師一起排優先順序。 |
| 做原型 | S1：「Our team has largely replaced documentation-first thinking with prototype-first thinking.」 | 以原型優先取代文件優先。 |
| 做原型 | S7（記者的敘述）：「he built around 20 prototypes of the new feature, todo lists, in a few hours over two days」 | Boris 兩天內做了約 20 個待辦清單原型，每個用一句提示語產生。 |
| 展示 | S1：「Instead of hosting traditional stand-ups, we share demos of new ideas. Internal users try them, and the ones with real engagement get polished and shared more broadly.」 | 站會改成展示。有實際使用的才打磨並擴大。 |
| 內部試用 | S3：「We have a feedback channel. I think we get a post every five minutes.」 | 內部回饋頻道，用來判斷好不好用、是否有錯、是否撤下。 |
| 發布門檻 | S2：「We have an internal bar for the number of active users and the amount of retention a feature has to have before we share it with the world.」 | 內部有使用人數與留存的明確門檻，過門檻才對外。 |
| 實作與審查 | S2：「They’ll nudge it, then pass it on to eng to take it to the finish line and get it out to prod.」 | 同段的流程：產品經理請 Claude Tag 做第一版，要求附上實作錄影，請設計看，再交工程完成並上線。 |
| 審查分級 | S2：「for the changes at the outer layers, we actually have Claude code review fully review those」 | 外層變更由 AI 審查全權處理。 |
| 審查分級 | S2：「For important areas we have code owners.」 | 重要區塊有程式碼負責人，必須由他核准。 |
| 審查信任建立 | S2：「we look at the PRs that caused the incident and say, okay, how do we update code review to catch that?」 | 事故後，把造成事故的合併請求加進評測集，防止審查機制退步。Cat Wu 稱這個過程花了六個月以上。 |

### 2.2 規格還存在，但角色變了（兩處說法並排，見「來源說法不同」節）

- S1：「Pro-tip: after you write a spec, send it to Claude Code and see if it can build it.」說明：規格寫完先丟給 Claude Code 試做。
- S1 的例子：Noah 把外掛規格交給 Claude Code，回來的原型接近可上線，「That prototype anchored what the team ultimately shipped」。說明：原型成為團隊最後出貨內容的依據。
- S3：Boris 的功能開發斜線指令，流程是「first ask me what exactly I want, like build the specification, and then, you know, kind of build a detailed plan and then make a to-do list」。說明：先被問需求、產規格、再產計畫與待辦。
- S3：Boris 對較難的功能，「usually I’ll shift tabs into plan mode and then align on the plan first before it even writes any code」。說明：先對齊計畫，再寫程式。
- S9（官方文件）：「Interview me until you could write the spec, then write it to SPEC.md.」說明：官方建議請 Claude 訪談後寫出規格檔。
- S9：「start a fresh session to build from it, so the build begins with a clean context and a written definition of done」。說明：規格檔是新工作階段的起點，也是完成定義。
- S9：審查提示語範例「review the rate limiter diff against SPEC.md, check every requirement is implemented and the listed edge cases have tests」。說明：依規格逐項檢查需求與邊界情況測試。
- S12：功能清單檔每項標記 `"passes": false`，「We prompt coding agents to edit this file only by changing the status of a passes field」。說明：代理人只能改通過狀態，不能改條目。此例是代理人長時間工作的實驗，不是產品團隊做法。

### 2.3 一致性機制：只找到「修正回寫」，沒有找到規格、原型、票的對齊機制

- S3，Boris Cherny 說遇到錯誤時。
  - 原文：「if you see a mistake, I’ll just be like, at Claude, add this to Claude MD so that the next time it just knows this automatically.」
  - 說明：把錯誤寫回指示檔，讓下次自動避開。
- S3，同段。
  - 原文：「write a test. You know, that’s an easy way to make sure this doesn’t regress.」
  - 說明：用測試防止退步。
- S3，Boris Cherny 說自家問題追蹤：「Claude dedupes the issues and it automatically finds duplicates」，並會主動送出初步修正的合併請求。說明：這是處理使用者回報的錯誤，不是規格對齊。
- S4，Krieger 說驗證要有證據。
  - 原文：「before you PR, prove to yourself and then to me that it works as intended.」
  - 說明：要求代理人在送出前證明功能如預期。
- S4，同段。
  - 原文：「I think of it as proof of thoughtfulness rather than just proof of work.」
  - 說明：他要的是「想清楚」的證明，不只是做完的證明。
- S7（Sid Bidasaria 原話，記者轉述）：「We didn’t have formal processes inside the team: it was all super fluid.」說明：早期團隊沒有正式流程。

**找不到**：規格、原型、工程票三者如何保持一致；產品經理的規格放在哪裡、工程票由誰開、改規格是否回寫票。搜過的詞：ticket、Jira、Linear、backlog、PRD、roadmap、design doc、issue tracker、RFC、ADR、OKR，在 S1 至 S5、S8 的全文與 S7 已讀部分中只出現下列結果：S2 與 S1 提到 PRD 與路線圖是「過去的做法」；S3 提到問題追蹤是處理使用者回報；S10 的 tickets 指客服單。沒有任何來源描述 Anthropic 內部的工程票系統。

## 問題 3：還沒決定的事怎麼處理

來源中沒有「待決事項清單」類的做法。下列是來源實際描述的處理方式。

### 3.1 先做出來看，不先辯論

- S6（Felix Rieseberg）。
  - 原文：「you just build all of them and try them out with a small focus group and then whatever, whatever is better is what you go with.」
  - 說明：原本要花成本決定的技術或做法選擇，現在全做出來，找小群人試，選好的。
- S6：「don’t even write a memo, just like build, like let’s build all the candidates very quickly」。說明：不寫備忘錄，直接把所有候選做出來。語音轉文字稿，用字有錯，語意依上下文。
- S4（Krieger）。
  - 原文：「torn it down and done a V2 to iterate from there.」
  - 說明：多個專案在上線前把整個做完，發現過度複雜或前提有誤，就拆掉做第二版。他說重寫現在以「天」計，不是一年。

### 3.2 不預先鎖定，並定期評估

- S1，不鎖定路線圖的原因。
  - 原文：「The constraints you designed around might disappear mid-project.」
  - 說明：設計時依據的限制，可能在專案中途因模型進步而消失。
- S1，產品經理要抓住的事。
  - 原文：「the product manager’s role is now to identify the handful of true non-negotiables and let the rest go.」
  - 說明：只找出少數不可妥協的事，其餘放手。
- S4，Labs 的評估節奏。
  - 原文：「it’s part of our labs process to evaluate every project every two weeks and decide whether to double down or release those folks back into the broader labs pool」
  - 說明：每兩週評估每個專案，決定加碼或釋出人力。
- S4，專案啟動門檻。
  - 原文：「having someone with extreme conviction」
  - 說明：Krieger 說這是開新專案的把關條件。信念要放在問題或問題領域，不一定是具體點子。

### 3.3 上線早於「想完整」

- S4：「we are learning to launch earlier」。說明：提早上線，因為使用者會讓團隊意外。
- S4：Cowork 第一版「in 10 days」做出最精簡版本，Krieger 說多做兩個月、加 50 個功能不見得更有用。
- S4，AI 的盲點。
  - 原文：「I find even the models today are good at adding features—they’re not necessarily good at figuring out what to cut.」
  - 說明：模型擅長加功能，不擅長判斷該砍什麼。他也說過度建置的 V1 組合太多，上線前很難測、也難向人說明。
- S4，沒人決定的決定。
  - 原文：「Many times the answer is: they didn’t choose—it was just the choice the model made.」
  - 說明：他問工程師為何這樣選，常聽到的答案是「模型選的」。所以他要求「想清楚」的證明。

### 3.4 組織層：決策與對齊成為瓶頸（二手）

- S13（Sequoia 改寫文章中的 Krieger 原話片段，二手）。
  - 原文：「It makes all of your other inefficiencies as a product organization extremely painful」
  - 說明：寫程式變快後，對齊會議的成本相對變大。同文引他說 AI 還沒到「organizationally driving decision making」的程度。

**找不到**：未決問題的登記、追蹤、結案方式（例如待裁決清單、決策紀錄）。搜過的詞：open question、decision log、ADR、RFC。S1 至 S5、S8 全文沒有出現。

## 問題 4：哪些前提與「一人加代理的 ERP 產品經理」不同

本節先列來源自己說明的前提與限制，再列 Miles 現況（取自 `AGENTS.md` 的描述）。不下「該怎麼改」的結論。

### 4.1 來源自己說明的前提

| 前提 | 來源與原文 | 說明 |
|------|-----------|------|
| 產品的使用者就是團隊成員 | S3：「Internally over I think 70 or 80 percent of ants—technical Anthropic employees—use Claude Code every day.」 | 內部試用能快速得到訊號。S2 的發布門檻（使用人數與留存）也建立在這個族群上。 |
| 產品本身是 AI 工具，限制隨模型改變 | S1：「Exponentially improving models break that assumption.」 | 「中途限制消失」與「改用簡單做法」都是針對模型進步。 |
| 團隊成員工程能力強 | S2：「All the PMs on our team are this mix of engineer, designer, PM — most of them actually used to be full-time engineers.」 | 產品經理自己做原型、補缺口。 |
| 有大量自動驗證與審查基礎 | S2：「we’ve had a six-plus-month-long process to get here」 | AI 審查接手外層變更，是六個月以上累積評測與信任的結果。 |
| 來源自己說不能直接推廣 | S5：「our findings likely don’t generalize to other organizations or contexts right now」 | Anthropic 自己說調查結果不一定適用其他組織。 |
| 來源自己說有不易移植的部分 | S7 開頭摘要：「things to keep in mind about what makes it unique, that might be less transferable」 | 記者承認有部分是 Anthropic 特有。細節在付費牆後，未讀。 |
| 原型不等於從零做出來 | S6：「we sort of picked the right pieces out of the many prototypes that we had.」 | Felix Rieseberg 說，10 天做完 Cowork 之前已有很多內部原型。 |
| 外部客戶會綁住「刪功能」 | S4：「the unshipping problem is real.」 | 企業客戶依賴既有功能，刪除不如內部團隊想的容易。 |

### 4.2 Miles 現況（取自 `AGENTS.md`，僅作對照）

- 一位產品經理加代理人。
- 使用者是印刷廠辦公角色與現場人員，不是團隊成員。
- 原型放在 erp 儲存庫，由前端主管合併；Sens 儲存庫只放規劃知識庫。
- 商業規則、欄位、狀態有唯一正本（wiki 卡）。

與來源的差異是事實對照，來源沒有談及這些情境：

- 來源中的內部試用與留存門檻，沒有談到使用者不是團隊成員的情況。
- 來源中的工程票、審查者、程式碼負責人，沒有談到產品經理只做原型、不合併程式碼的情況。
- 來源中「產品經理做評測」的對象是模型行為，沒有談到業務規則正確性的驗證。

## 來源說法不同（並排，不調和）

| 主題 | 說法 A | 說法 B |
|------|--------|--------|
| 規格還要不要寫 | S2，Cat Wu：過去「align over the course of six months with cross-functional teams on some PRD」，「Now things are completely turned the opposite way」。 | S1，同一位 Cat Wu：寫好規格後丟給 Claude Code 試做；Noah 的外掛規格是原型的起點。S3 與 S9：仍有規格、計畫、SPEC.md。 |
| 做多少再看 | S6，Felix：把所有候選都做出來再挑。 | S4，Krieger：上線前做太多形成難測的組合；模型不擅長決定該砍什麼；要刻意做最小版本。 |
| 人要不要在審查流程中 | S2，Cat Wu：「we are trying to move to a world where humans don’t need to be in the loop」，核心仍由負責人手動審。 | S4，Krieger：要求「想清楚」的證明，並追問工程師為何這樣選。S5：多數人只能完全放手 0 至 20%。 |
| 由下而上或找客戶 | S3，Cat Wu：過去由下而上；擴展到更多服務時要找客戶與工程師排優先順序。 | S2，Cat Wu：過去的「找客戶、對齊六個月」做法已反轉；S13（二手），Krieger 摘要：「the best products are the ones that are built very close to the model」，主張更多由下而上。 |
| 產品經理是否重要 | S1：產品經理的職責是建立清楚的方向，並做原型與評測。 | S4：「It’s rarely a pure PM.」Labs 只有一位產品經理，頭人多為設計師或工程師。 |
| 職稱 | S6：Cowork 負責人自稱是「Member of Technical Staff」，被主持人稱為產品經理。 | S1、S10：Cat Wu 的職稱為產品負責人。同一個「產品經理」在不同團隊的範圍不同。 |

## 沒讀到或存疑

1. Lenny's Podcast 的 Cat Wu 訪談：付費牆，只有第三方摘要，未讀。摘要提到「每週看指標」，未查證。
2. S7 第 4 節以後（終端介面、AI 優先的工程做法、子代理建構、可移植性）：付費牆，未讀。
3. S6 約 87 分鐘逐字稿只讀了與本票有關的段落，其餘（虛擬機、技能、安全）未讀。
4. S9 文件其餘章節未讀。
5. 搜尋結果出現一則稱 Cat Wu 於 2026-11-03 離開 Anthropic 的第三方報導。未取得原始來源，未查證。引用她的文章與訪談時，職稱以各來源發表當時為準。
6. Krieger 在 AI Engineer 世界博覽會的演講（ai.engineer）：只有頁面摘要，未取得逐字稿。
7. 「Labs 以每幾小時至幾天的短週期取代兩週評估」的說法：只見聚合網站轉述，未查證，不採用。
8. S5 內部有一處數字不一致：摘要寫使用 Claude 於 60% 工作，內文寫 59%。不影響本檔結論。
