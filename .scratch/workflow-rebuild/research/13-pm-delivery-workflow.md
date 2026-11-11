# 票 13：產品經理的規格流動、一致性與交付實務調研

主對話抽查（2026-11-11）：抓回三個來源逐句比對。相符：Cagan 2006 三句與日期；Linear Method 四句；Adzic 調查的 57%、「Work items tend to explain the sequence of work」、22% 對 8%（數字在表格內）。更正：「copy-paste the scenarios to Jira tickets」是 Gáspár Nagy 的話，由 Adzic 引用；原文說造成麻煩的是交叉連結（「Cross-linking causes trouble too」），沒有直接說複製貼上會出問題。本檔第一節第 3 條與第三節「反例」列以此更正為準。其餘引句未抽查。

調研日期：2026-11-11。範圍：規格生命週期、一致性維持、原型與需求知識庫的拆法、情境與測試的掌握、AI 規格驅動開發、遺漏問題。
查證方式：引句皆以抓回原文後逐字比對，每句不超過 15 個英文字詞。「未載」表示該來源沒有談這一點，不是推測。
用詞：「唯一正本」即 single source of truth。

## 一、摘要

1. 各家的共通切法：長文規格放在文件，議題追蹤工具只放可交付的小工作，並連結回文件（Linear、Atlassian、GitLab）。
2. 何時建票沒有統一規則。Shape Up 最嚴格：尚未押注的工作不進追蹤，任務由團隊在建置中發現，不預先拆好。
3. 反對把同一內容複寫多處：GitLab 要求連結到唯一正本；Gojko Adzic 指出把情境複製貼上到票上會出問題。
4. Adzic 的 2020 年調查中，57% 的團隊以 Jira 類工具為需求來源；他批評工作項目記的是「工作順序」，不是「系統現況」。
5. Marty Cagan（2006）主張高擬真原型是規格主體、單一主表徵，補充內容放 wiki；他 2025 年又強調原型與正式產品是兩種活動，不可混淆。
6. 讓需求、範例、測試不分家的主流做法是：用範例當規格，並自動化成測試常態執行（SBE、BDD）；沒自動化就拿不到「活文件」的好處。
7. 追溯（traceability）的標準定義存在（ISO/IEC/IEEE 29148 的上下向追溯與追溯矩陣）；BABOK 原文需登入，未取得。
8. 文件即程式碼（docs-as-code）：文件與程式碼同庫、同審查流程，可擋下沒附文件的合併。
9. AI 規格驅動開發把規格放在程式庫內並版本控管；防漂移多靠工具比對（spec-kit 的 analyze、converge）或人工同步（Kiro）；Birgitta Böckeler 與 Thoughtworks 都提醒審查負擔與結果不穩定。
10. 「高擬真原型在開發完成後如何處理」與「上線後以誰為準」：未找到一手的業界統計或明文規則（見第九節）。

## 二、規格生命週期：各階段寫在哪裡、追蹤工具放什麼

| 做法 | 出處與引句 | 適用條件 | 缺點 |
|------|-----------|---------|------|
| Linear：短規格＋小議題 | linear.app/method/introduction。「Short specs are more likely to be read.」「create an issue for each one when possible」 | 軟體團隊，專案有具名負責人，每張議題小到可在一週內完成數張 | 未載何時從規格轉成議題的明文時點（未查證） |
| Linear：文件掛在工作上 | linear.app/docs/project-documents。「Use documents to keep long-form text attached to the work references.」 | 長文可掛在專案、議題、週期 | 未載如何防止文件與議題內容分歧 |
| Linear：進度看實際成果 | 同上 Method。「show the diff in the code or design file」 | 議題小、變更小的團隊 | 未載 |
| Shape Up：雙軌，押注前不進追蹤 | basecamp.com/shapeup/1.1-chapter-02。「not shared with the wider team until the commitment has been made」 | 小團隊、固定週期、有人專責整形（shaping） | 需要一個專責整形的人；來源未載對大型團隊的適用度 |
| Shape Up：粗略方案，不過早寫細 | 同上。「Work that’s too fine, too early commits everyone to the wrong details.」 | 設計與開發有判斷空間的團隊 | 來源未載；與「驗收要明確」的需求有張力（見第八節） |
| Shape Up：不預拆任務、不留待辦清單 | 3.1-chapter-10：「Teams discover tasks by doing real work.」2.1-chapter-07：「Backlogs are a big weight we don’t need to carry.」 | 團隊有自主權、專案有時間上限 | 沒有集中清單；想再推的點子要自己追蹤並重新爭取 |
| Atlassian：需求頁連到 Jira 史詩與議題 | atlassian.com/blog/development/write-product-requirements-confluence。「get from your Confluence requirement to your Jira epic and vice versa」 | 用 Confluence＋Jira 的團隊 | 官方未寫「何時該建 Jira 議題」的規則（未查證）；自動關聯只限特定專案類型（二手來源，未核） |
| GitLab：議題描述是唯一正本 | handbook 產品開發流程頁。「Issue descriptions shall always be maintained as the single source of truth.」另「issues are the single source of truth for any change to the product」 | 全員遠端、以議題為工作單位 | 要求負責人持續維護描述；留言內的決定要搬進描述 |
| GitLab：文件優先，連結不複寫 | handbook 溝通頁。「ideally the handbook, otherwise an epic, issue, or Google Doc」；「The email or Slack message should not be the source of truth.」 | 同上 | 未載 |
| 設計文件（design doc） | industrialempathy.com/posts/design-docs-at-google/。「whether the solution to the design problem is ambiguous」決定要不要寫 | 技術方案有歧義時 | 同文自述：文件會與現實脫節，變更常寫在新文件（見第四節） |
| RFC | blog.pragmaticengineer.com/rfcs-and-design-docs/。Stedi：「written as .MD files on GitHub」，留言也在 GitHub | 大型、跨團隊或會改介面的專案 | 來源未載實作後是否維護 |
| 決策記錄（ADR） | Michael Nygard，cognitect.com/blog/2011/11/15/documenting-architecture-decisions。決策被推翻時「mark it as superseded」 | 架構決策需留下理由 | 只記決策，不是規格本體 |
| 原型當規格 | Cagan，svpg.com/revisiting-the-product-spec/（頁面日期 2006-10-12）。「the majority of the product spec should be the high-fidelity prototype」 | 有使用者介面的產品 | 見第四節 |

## 三、一致性怎麼維持：避免各寫一份再人工比對

| 做法 | 出處與引句 | 適用條件 | 缺點 |
|------|-----------|---------|------|
| 票只連結、不複寫 | GitLab 溝通頁（見上）；Linear：「Attach requests and feedback to the relevant issue」 | 有一個明確的唯一正本 | 連結端依賴人持續維護；GitLab 要求負責人維護描述 |
| 反例：複製貼上 | Adzic，gojko.net/2020/03/17/sbe-10-years.html。「copy-paste the scenarios to Jira tickets」（他描述有團隊這樣做，並稱這會造成麻煩） | — | 複本與正本分歧 |
| 單一主表徵 | Cagan 2006。「there needs to be a single master representation of the spec」 | 產品規格有多種附屬文件時 | 靠人遵守 |
| 範例即規格＋自動化（SBE、BDD） | cucumber.io/docs/bdd/。「Producing system documentation that is automatically checked against the system's behaviour」；「writing this executable specification collaboratively」 | 團隊能維護自動化測試，業務能參與寫範例 | Adzic 調查：29% 的使用者不自動化，等於拿不到活文件好處；範例格式（Gherkin）純文字不足以存放協作所需資訊（Gáspár Nagy 說法，經 Adzic 轉述） |
| 活文件需要便宜地追蹤有效性 | Adzic 同上調查。「it relies on a quick and cheap way of tracking which examples are still valid」 | 範例數量多時 | 發布情境成網頁的工具（Relish、Pickles 等）多已被放棄（同文） |
| 規格結構對齊業務領域模型 | Adzic，gojko.net/2010/12/02/the-principle-of-symmetric-change/。「results in one small change in software」 | 規格依業務概念切分時 | 需要先有穩定的領域模型 |
| 情境寫行為、不寫實作 | cucumber.io/docs/bdd/better-gherkin/。「Your scenarios should describe the intended behaviour of the system, not the implementation.」 | 想讓實作改變時情境不必跟著改 | 未載 |
| 需求追溯 | ISO/IEC/IEEE 29148:2018 試閱頁（iTeh 14 頁）。「derivation path (upward) and allocation/flow-down path (downward)」；追溯矩陣：「structured information artifact that links requirements」 | 需要稽核或高可靠度的系統 | 標準只定義詞彙與資訊項，不規定工具；條文第 5～9 章未讀（見第九節） |
| BABOK 需求生命週期管理 | 一手原文需 IIBA 登入，未取得。二手來源（Watermark Learning 等）描述含追溯、維護、評估變更 | — | 未查證 |
| 文件即程式碼 | writethedocs.org/guide/docs-as-code/。「writing documentation with the same tools as code」；「You can block merging of new features if they don’t include documentation」 | 文件與程式碼在同一程式庫與審查流程 | 該頁未載跨庫、跨工具的情況 |
| 基準版本 | ISO 29148 詞彙：baseline 為「formally approved version of a configuration item」 | 需要凍結某個時點的規格 | 未載 |

## 四、「需求知識庫＋原型」的拆法有無業界對應；原型在開發後的處置；上線後以誰為準

| 做法 | 出處與引句 | 適用條件 | 缺點 |
|------|-----------|---------|------|
| BRD、FRD、SRS 分層 | ISO 29148 試閱頁列出 BRS、StRS、SyRS、SRS 等資訊項（業務、利害關係人、系統、軟體層）；Cagan 2006：這些文件「have merged and morphed and lost many of their original distinctions」 | 需要分層追溯時 | Cagan 認為實務上各層區別已模糊；各層都寫成文件的成本高 |
| 原型是規格主體，wiki 補充 | Cagan 2006：「you will still need to supplement the prototype」，補充放 wiki，可「track the history of decisions」 | 以使用者介面為主的產品；補充內容為效能、平台、使用案例等 | 原型未涵蓋「error conditions and corner cases」（同文）；同文也承認要自備 Q&A 與決策歷史 |
| 原型要先通過測試才算規格 | Cagan 2006。「You don’t actually have a spec worth handing over to engineering」（接續：原型通過使用者測試前） | 能在開發前找使用者測試 | 與「原型是需求落地後的樣子」的順序相反 |
| 原型主要用途是探索 | svpg.com/the-purpose-of-prototypes/。「The primary purpose of prototyping is to help discover a successful solution.」作為溝通規格是「A secondary but still valuable benefit」 | 探索階段 | 若只當溝通工具而不測試，可能做出市場不要的產品（同文） |
| 原型與產品是兩種活動 | svpg.com/prototypes-vs-products/（2025-11-07）。「there are very different demands and considerations for each of these activities」；內部工具「the operational demands are usually, although not always, much less」 | 判斷原型能否直接當產品 | 原文也說 AI 工具能否從原型直通產品「an open question」，並指出問題來自「the limitations of spoken language as a specification language」 |
| 丟棄式原型 | Brooks《人月神話》第 11 章「Plan to Throw One Away」（只讀到二手引述與目錄，原書全文未讀） | 初版必定要重做時 | Brooks 1995 年版承認此說預設瀑布式（二手來源，未核） |
| 上線後的唯一正本 | 無一手來源直接回答。相關：Adzic 的調查顯示 57% 以 Jira 為來源，他批評該做法（「Work items tend to explain the sequence of work」，後接 not the current state）；設計文件「tend to get out of sync with reality over time」（Ubl）；spec-kit 的規格文件稱 code 曾是 source of truth，且「specs rarely kept pace」 | — | 見第九節 |
| 規格留存程度分級 | Böckeler，martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html。spec-first、spec-anchored（「The spec is kept even after the task is complete」）、spec-as-source | 評估規格上線後是否持續維護 | 她認為多數工具仍只到 spec-first |

## 五、產品經理如何掌握「有哪些情境與測試」並確認正確

| 做法 | 出處與引句 | 適用條件 | 缺點 |
|------|-----------|---------|------|
| 範例對照（example mapping） | cucumber.io/blog/bdd/example-mapping-introduction/。黃（故事）、藍（規則）、綠（範例）、紅（問題）四色卡；「We capture those on a red card and move on with the conversation.」；25 分鐘後「a quick thumb-vote」決定故事是否可進開發 | 開發前逐故事對齊 | 輸出是一次會議的卡片；本頁未載如何長期留存 |
| 活文件（自動檢查） | cucumber.io/docs/bdd/。「automatically checked against the system's behaviour」 | 範例已自動化 | 需自動化與持續執行（Adzic：29% 未自動化） |
| 追溯矩陣 | ISO 29148 試閱頁：矩陣連結需求至上層需求或下層實作 | 要證明每條需求都有對應實作與驗證 | 維護成本；一手來源只給定義 |
| 使用者驗收測試（UAT） | istqb-glossary.page/user-acceptance-testing/。「Acceptance testing carried out by future users」（在擬真營運環境） | 要簽核的情境 | 該詞條只給定義；簽核流程細節未載 |
| 以產出差異看進度 | Linear Method：「show the diff in the code or design file」 | 變更小的團隊 | 看不出「是否涵蓋所有情境」 |
| Adzic 調查：用範例做驗收準則與品質 | gojko.net/2020/03/17/sbe-10-years.html：自評「上線後幾乎沒問題」的比例，用範例做驗收準則者 22%，不用者 8%；原文寫明「correlation, not necessarily causation」 | — | 自填調查，樣本與偏誤未載 |

## 六、用 AI 代理做規格驅動開發的近期做法

| 做法 | 出處與引句 | 適用條件 | 缺點 |
|------|-----------|---------|------|
| spec-kit：規格放程式庫，一個功能一個分支 | github.com/github/spec-kit 的 spec-driven.md。目錄為 `specs/[branch-name]/`；憲章在 `memory/constitution.md`；「The specification becomes the primary artifact.」 | 新功能、棕地專案需自行調整 | Böckeler 評為「still what I would call spec-first only」 |
| spec-kit：防漂移靠指令比對 | github.github.io/spec-kit/reference/agentic-sdd.html。analyze「never edits files」只產出報告；converge 比對實作與規格，缺口以新任務附加，結果為「Converged」或附加任務 | 實作後要對照規格 | 該頁未載「刻意偏離規格」時怎麼處理 |
| spec-kit：正式雙向回饋 | spec-driven.md。「Production reality informs specification evolution.」 | 有營運資料回流時 | 自述目前仍需自行組合工具並維持紀律 |
| Kiro：三份檔（需求、設計、任務） | kiro.dev/docs/specs/best-practices/。存放在 `.kiro/specs/`；「designed for continuous refinement」；改需求後設計會重新對齊，任務用「Sync files」補新任務 | 要在 IDE 內迭代規格 | 同步由人觸發；Böckeler 試用時認為對小問題「way too verbose」 |
| Kiro：steering 檔 | kiro.dev/docs/steering/。「Steering gives Kiro persistent knowledge about your project through markdown files.」也支援 AGENTS.md | 讓代理長期遵守專案慣例 | 與規格是兩種檔，需分清楚放什麼 |
| AGENTS.md 慣例 | agents.md。「README.md files are for humans」；「Agents automatically read the nearest file in the directory tree」 | 給代理看的建置、測試、慣例 | 內容限於代理指引，不是需求規格 |
| 規格審查負擔與不穩定 | Böckeler：規格檔「very verbose and tedious to review」；同一規格重複產碼時「I have seen the non-determinism in action」。Thoughtworks 技術雷達：「elaborate and opinionated」，產出的 PRD「sometimes unclear who their intended user is」 | — | 這兩份是批評，不是做法；未載解法 |

## 七、Miles 可能沒想到、但與規格流動、一致性、交付有關的問題

下列只列問題與各來源的相關做法，不提解法。

| 問題 | 相關出處與引句 | 說明 |
|------|---------------|------|
| 開發提問的答案寫回哪裡 | GitLab 流程頁：負責人要「Transfer discussion notes」到議題描述；Cagan 2006：Q&A 與決策歷史放 wiki | 各家都要求答案進唯一正本，不留在聊天或留言 |
| 交付後變更怎麼回到來源 | spec-kit：「Production reality informs specification evolution.」；Ubl：變更常「isolated into new documents」 | 變更落在實作或新文件時，來源是否更新，各家做法不同，多半靠人 |
| 版本基準：以哪個時點的規格交付 | ISO 29148：baseline 定義；spec-kit：一功能一分支 | 來源未載小型團隊的輕量做法 |
| 上線後以誰為準 | Adzic：工作項目不是現況的記錄；Böckeler：spec-anchored 才保留規格 | 一手資料無統一答案（第九節） |
| 規格的讀者是誰 | Cagan 2006：規格有 engineering、QA、客服、行銷等多種消費者；Thoughtworks：PRD 的使用者不明 | 目前知識庫只有 AI 讀，開發不讀，與這些來源的假設不同 |
| 誰是單一負責人 | Linear：「Every project should have a named owner」 | 負責寫規格與交付 |
| 規格粒度與審查負擔 | Shape Up：太細太早會鎖死細節；Böckeler：規格太冗長難審 | 粗與細之間的取捨，各家立場不同 |
| 議題存的是工作還是現況 | Adzic：工作項目記工作順序，不記現況 | 與「Linear 作為對開發的唯一交付正本」相關 |
| 原型的資料與 API 形狀由誰定 | Cagan 2025：原型與產品需求差異大；2006：原型可「fake (simulate) the back end processing and data」 | 原型不負責的部分，需另有地方承接 |

## 八、對照 Miles 現況

| 面向 | Miles 現況 | 與調研的關係 |
|------|-----------|-------------|
| 原型為規格主體 | 高擬真原型在 erp repo，前端主管審查合併；wiki 補充業務規則 | 相同：Cagan 2006 主張原型為規格主體、wiki 為補充 |
| 原型與需求的先後 | 先有 wiki 需求，再由 AI 做出原型 | 相反：Cagan 的原型是探索工具，先測試再成為規格；Miles 的原型是落地結果 |
| 原型被當作產品的風險 | 原型帶 mock 資料，後端另做 | 相同：Cagan 2025 強調原型與產品是不同活動 |
| 內容只有一個家 | 正本分層：wiki、規劃單、情境與測試、原型、Linear 各有範圍 | 相同：GitLab 與 Cagan 的單一主表徵 |
| Linear 內容 | 自包含，從 wiki 與原型人工重寫 | 相反：Linear、Atlassian、GitLab 都是連結到正本；Adzic 描述複製貼上會有問題 |
| 規劃單 | 一次性，做完不合併 | 近似：Shape Up 的 pitch 是押注用文件，並非長期正本；但 Shape Up 不維護它，Miles 同樣不維護 |
| 情境與測試 | 情境目錄對應測試，「依據」行指向 wiki 情境卡；測試跑在原型上 | 近似 BDD 與 SBE；差異：目標是原型而非上線實作，且測試放在 Sens repo、不在 erp repo（docs-as-code 的主張是同庫） |
| 知識庫讀者 | 只有 AI 讀，沒有人直接讀 | 與 Cagan 2006（規格有多類人讀）假設不同；Thoughtworks 也提醒使用者不明 |
| 規格放置位置 | wiki、原型、Linear、測試各在不同地方 | 相反：spec-kit、Kiro 把規格放進程式庫 |
| 追蹤工具角色 | Linear 為交付正本 | 部分相同：GitLab 以議題為產品變更的唯一正本；Adzic 認為這會讓規格失去現況記錄 |
| 簡稱與命名 | 規劃單與 wiki 卡有穩定名稱 | 可對應追溯所需的穩定識別，但來源未載 Miles 的做法是否足夠 |

## 九、未查證與存疑

未查證（共 9 項）：

1. BABOK 需求生命週期管理的一手原文：IIBA 任務卡需登入，僅取得二手摘要。
2. Atlassian 官方「何時建 Jira 議題」的明文規則：只找到需求頁連 Jira 的操作說明，沒有時點規則。
3. Gojko Adzic《Specification by Example》書中「關鍵流程模式」原文：只讀到書目頁與他部落格的相關文章。
4. Cagan 對「開發完成後原型怎麼處理」的明文：2006 與 2025 兩篇均未直接回答。
5. 高擬真原型在上線後被丟棄、續維護或被取代的業界一手資料：GOV.UK 原型套件文件頁讀不到內容，其他來源只有二手。
6. ISO/IEC/IEEE 29148 條文第 5 至 9 章：只取得 14 頁試閱，僅核對了詞彙定義。
7. Linear Method 對「何時從規格轉成議題」的明文：Method 頁沒有此規則。
8. 「需求知識庫是 BRD、原型是落地結果」這種拆法的直接業界對應：沒有任何一手來源直接這樣說，上述 ISO 29148 的 BRS 與 Cagan 的原型是各自獨立的說法，不能當作同一種做法。
9. UAT 簽核的實務流程：只取得 ISTQB 詞條定義，沒有一手的簽核做法。

存疑（引用上需留意）：

- Cagan 的兩個立場相隔近二十年（2006 與 2025），後者針對「用 AI 工具做原型的產品創造者」，不能視為他對 2006 主張的修正。
- Adzic 的調查是自填調查，品質與範例的關係原文自述為相關，不一定是因果。
- 引自 Böckeler 對 spec-kit 與 Kiro 的評語，是她個人試用的結論，且她的文章有日期；工具之後可能改版（spec-kit 的 converge 指令即較新）。
- 本檔中「Brooks 1995 年版承認預設瀑布」一項，取自搜尋結果的二手轉述，未讀原書。
