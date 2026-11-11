# 票 28：商業分析與系統分析方法調研（流程建模、資料建模、狀態建模、業務規則分析、缺口與影響分析、驗收準則與可追溯）

主對話抽查（2026-11-12）：用 `curl` 抓回三個來源全文，逐字比對 5 句，全部相符：業務規則宣言 PDF 2 句（1.1 一句因兩欄排版，改用 `pdftotext -raw` 才比對到）、Ambler〈業務規則〉2 句、Cockburn 節錄 PDF 的「Field types, lengths and validations」（只在 ifi.uzh.ch 節錄，不在 helsinki 範本）。另核對 wiki 卡型對照兩項：《規範 - 狀態機》§ 十 確有「可達性」稽核維度；實體卡欄位表表頭為「介面欄位、定義、算式、資料範例、欄位形態、填入時點、可否修改」，沒有長度、格式、值域欄，本檔判「部分涵蓋」正確。其餘未抽查。

調研日期：2026-11-12。範圍：商業分析師（Business Analyst，BA）與系統分析師（System Analyst，SA）既有的分析方法，依六個子題拆開找。票 01 已查的驗證方法不重查；票 01 已引過的網址不再引用（例：INCOSE 需求撰寫指南摘要頁、ISTQB 狀態轉換測試詞條、CRUD 矩陣教材、Cucumber 與 Gherkin 頁）。
查證方式：引句全部取自原始檔全文，再用程式逐字比對（空白與彎引號先正規化）。網頁用 `curl` 抓原始 HTML，PDF 用 `pdftotext` 轉全文。引句皆不超過 15 個英文字詞。下列情況另標：
- 國際商業分析學會（IIBA）的 BABOK 指南技法本文只對會員開放。公開頁只有目錄，本檔只引技法名稱，不引技法內容。
- ISO/IEC/IEEE 29148 抓取被擋（HTTP 403），標未查證。
- Harel 1987 年狀態圖論文的 PDF 是掃描檔，無法取得文字，未引句。
來源類型：官方＝標準組織或知識體系擁有者的公開頁與規格；第一手＝方法原作者或有實務年資者本人的文章；社群＝論壇或第三方文章；二手＝轉載、百科、轉述。
「未載」表示該來源沒有談這一點，不是推測。

## 一、摘要

1. BA 與 SA 沒有一份共同的方法清單。BABOK 指南第 3 版列出 50 項技法，其中一項（10.44）就叫「狀態建模」（State Modelling），但技法本文要付費。公開可讀的是 IIBA 免費的核心標準（Core Standard），只到任務層，不到技法層。
2. 50 項技法的名稱裡沒有「缺口分析」「影響分析」「可追溯」。這三件事在 BABOK 裡是任務：5.1 追溯需求、5.4 評估需求變更、6.4 定義變更策略（內含缺口分析）。
3. 流程建模有兩層成熟做法。步驟與角色泳道用 OMG 的 BPMN 2.0.2；單一目標的完成過程用 Cockburn 的使用案例（use case），其「擴充」（extensions）段專門列失敗與替代路線。
4. 資料建模的通行步驟是先找實體，再找屬性、命名、關係、關鍵欄位、正規化。Ambler 把它寫成可重複的流程。BABOK 另列資料字典（Data Dictionary）與詞彙表（Glossary）。
5. 狀態建模的標準記法是 UML 2.5.1 的狀態機（behavior state machine），它是 Harel 狀態圖（statecharts）的物件導向變體。狀態轉換表（state-transition table）是同一份資訊的表格形態，常用來檢查「每個狀態對每個事件都有定義」。
6. 業務規則分析有四件現成工具：業務規則宣言（Business Rules Manifesto，原則）、SBVR（OMG 規格，詞彙與規則的語意）、RuleSpeak（寫句子的指引）、DMN（OMG 規格，決策表與決策需求圖）。四者互相銜接。
7. 影響分析最完整的可用檢核清單是 Wiegers 的「需求變更影響分析檢核清單」。本檔取得的是轉載版（RiPLE 專案頁，頁上註明出自 Process Impact），不是原檔。
8. 可追溯的標準做法是追溯矩陣（traceability matrix）：把一種產出物放欄、另一種放列，填格表示有追溯。BABOK 把目的寫成三件事：影響分析、覆蓋、配置（allocation）。
9. 與 Sens wiki 對照：流程、資料、狀態、規則、角色權限、詞彙這六塊已有對應卡型，狀態與規則最完整。缺口集中在三處：通用的變更影響檢核清單、需求到驗收條目的覆蓋度檢查、欄位層的防呆值域（格式、必填、長度）。詳見「與 Sens wiki 卡型對照」。

## 二、流程建模

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| BPMN 流程圖。產出物：含泳道、活動、閘道、事件的流程圖；規格定義「描述型」（Descriptive）子集，供分析師畫高階流程。檢核清單：未載（規格只有一致性要求，沒有分析檢核表） | 官方（OMG） | https://www.omg.org/spec/BPMN/2.0.2/PDF 「readily understandable by all business users」；「Descriptive is concerned with visible elements and attributes used in high-level modeling」（全文 grep 相符） | 需要讓業務與開發讀同一張圖；流程有多個角色交接 | 規格 532 頁，描述型子集仍有數十種元素；規格未載如何判斷「畫到多細」 |
| 使用案例（Cockburn）。產出物：一個目標一份文件，含範圍、層級、觸發、前置與後置條件、主成功情境、擴充、子變化（sub-variations）。檢核清單：有。出版社 8 頁節錄含 Reminders 與 12 步寫作流程；各編號指南的判準本文未取得 | 第一手（作者） | https://www.ifi.uzh.ch/dam/jcr:00000000-25a0-3d08-0000-00000ce96422/weuc_extract.pdf 節錄目錄有「Brainstorm all conceivable failures and alternative courses.」；步驟 12「Check for readability, completeness, and meeting stakeholders' interests.」；Reminders「Highlight the actor's intention, not the user interface details.」「Work breadth-first, from lower precision to higher precision.」；資料描述分三級，第三級是「Precision Level 3: Field types, lengths and validations」（全文 grep 相符）。範本：https://www.cs.helsinki.fi/u/mluukkai/ohmas09/usecase.pdf（HaT TR96.03a，欄位含 EXTENSIONS 與 SUB-VARIATIONS） | 要寫「一個人坐下來一次做完的一件事」；要窮舉失敗路線 | 偏互動敘事，不表達並行與資料物件；節錄只有目錄、前言與清單，各指南的判準未讀。Reminders 要求使用案例文字只放資料描述的第一級，欄位型別、長度、驗證另處記錄 |
| 事件風暴（EventStorming）。產出物：貼滿便利貼的時間軸牆，依序排領域事件。檢核清單：未載 | 第一手（作者網站） | https://www.eventstorming.com/ 「EventStorming is a flexible workshop format for collaborative exploration of complex business domains.」（全文 grep 相符） | 多部門一起釐清跨部門流程與不一致；要找出現況流程的缺口 | 需要多人同場工作坊；該頁未載產出如何轉成需求文件 |
| 服務藍圖（service blueprint）。產出物：把人、物證、流程對到顧客旅程接觸點的分層圖，分前台與後台動作 | 第一手（Nielsen Norman Group） | https://www.nngroup.com/articles/service-blueprints-definition/ 「A service blueprint is a diagram that visualizes the relationships between different service components」（全文 grep 相符） | 流程跨顧客接觸與內部作業；分析多通路服務 | 該頁談的是服務設計，未載與資料或狀態建模如何銜接 |
| BABOK 流程類技法：流程建模（10.35）、流程分析（10.34）、使用案例與情境（10.47）、循序圖（10.42）、資料流程圖（10.13）、功能分解（10.22）、範圍建模（10.41）、組織建模（10.32）、業務能力分析（10.6） | 官方（IIBA） | https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/ 只讀到技法名稱（全文 grep 相符）；技法本文為會員內容，未讀 | 需要查「有哪些流程類技法可選」時當索引 | 技法的產出物、適用條件、檢核清單皆未讀，標未查證 |

## 三、資料建模

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 資料建模流程（Ambler）。產出物：實體關係圖，加實體屬性、關係、關鍵欄位。步驟為找實體、找屬性、命名、找關係、套資料模型樣式、設關鍵欄位、正規化、反正規化。檢核清單：未載（該文只有步驟） | 第一手（Scott Ambler） | https://agiledata.org/essays/dataModeling101.html 「Identify entity types Identify attributes Apply naming conventions Identify relationships」（全文 grep 相符） | 要設計資料庫結構，或把業務物件整理成實體與關係 | 偏物理與邏輯設計；該文未載如何與業務詞彙表對齊 |
| 物件角色模型（ORM）。產出物：實體類型、事實類型（fact type）、角色、限制條件，並附事實類型範例表供業務核對 | 第一手（Ambler 介紹頁） | https://agilemodeling.com/artifacts/ormDiagram.htm 該頁稱其為與利害關係人探索領域概念的方式（頁面原句超過引句長度限制，改述；全文已讀） | 要和業務人員一起核對「這兩種東西是什麼關係」 | 工具與讀者群小；該頁未載與 UML 類別圖的取捨 |
| UML 類別圖當概念模型。產出物：類別、屬性、關聯與多重性 | 官方（OMG） | https://www.omg.org/spec/UML/2.5.1/PDF 規格含完整類別圖元素定義；本檔未逐句引用 | 需要與物件導向設計銜接 | 規格不教「如何找出類別」，只定義記法 |
| 資料字典（BABOK 10.12）、概念建模（10.11）、資料建模（10.15）、詞彙表（10.23）、介面分析（10.24） | 官方（IIBA） | https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/ 只讀到技法名稱；本文未讀 | 索引用 | 技法內容、檢核清單皆未查證 |
| 詞彙表。產出物：術語與定義的清單，業務詞與技術詞並列 | 第一手（Ambler） | https://agilemodeling.com/artifacts/glossary.htm 「A glossary is a collection of definitions of terms.」（全文 grep 相符） | 業務與開發用詞不一致時 | 該頁主張「定義夠好就好」，不要求單一定義；與 Sens 要求詞彙受控的做法方向不同 |

## 四、狀態建模

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| UML 狀態機圖。產出物：狀態、轉換（事件加條件）、初始與終止偽狀態、複合狀態。檢核清單：未載（規格是語意定義，不是檢核表） | 官方（OMG） | https://www.omg.org/spec/UML/2.5.1/PDF 第 14 章「modeling discrete event-driven Behaviors using a finite state-machine formalism」；「based on an object-oriented variant of David Harel's statecharts formalism」（全文 grep 相符） | 單據或物件的行為隨處境而變，且處境數有限 | 規格 796 頁；未載「該不該畫狀態機」的判準 |
| 協定狀態機（protocol state machine）。產出物：標出「哪些操作在哪些狀態下合法」的狀態機 | 官方（OMG） | 同上，第 14 章摘要說狀態機也可用來表達 protocols（有效互動順序） | 要明確寫出「這個狀態下不能做什麼」 | 規格只定義元素，未載實務範本 |
| 狀態轉換表。產出物：以「目前狀態」為列、「事件」為欄，格內填下一狀態 | 二手（Wikipedia） | https://en.wikipedia.org/wiki/State-transition_table 「It is essentially a truth table or a control table」（全文 grep 相符） | 用來檢查每個狀態對每個事件都有定義，補圖看不出的缺格 | 百科頁；未載業務單據的寫法 |
| UML 狀態機圖指引（Ambler）。要點：狀態不等於每個方法呼叫，只有造成狀態改變的呼叫才是轉換 | 第一手（Ambler） | https://agilemodeling.com/artifacts/stateMachineDiagram.htm 全文已讀；可引句超過長度限制，改述 | 要判斷什麼該畫成轉換 | 以物件導向類別為對象，未談業務單據 |
| BABOK 狀態建模（10.44） | 官方（IIBA） | https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/ 只讀到技法名稱 | 索引用 | 本文未讀；Harel 1987 論文為掃描檔，未取得文字 |

## 五、業務規則分析

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 業務規則宣言（Business Rules Group，2003）。產出物：原則清單，規定規則要獨立於流程、用業務人員看得懂的句子寫。檢核清單：未載（是原則，不是檢核表） | 官方（業務規則團體，BRG） | https://www.businessrulesgroup.org/brmanifesto/BRManifesto.pdf 1.1「Rules are a first-class citizen of the requirements world.」；2.2「Rules are not process and not procedure.」；4.2「If something cannot be expressed, then it is not a rule.」（全文 grep 相符） | 決定規則該放哪、要不要與流程分開寫 | 只給原則，不給範本 |
| SBVR 規則分類。產出物：詞彙加規則陳述。規則分兩類：行為規則（義務、禁止）與定義規則（必然、不可能） | 官方（OMG） | https://www.omg.org/spec/SBVR/1.5/PDF 「A behavioral business rule indicates something people or organizations are either obliged to do」；「A definitional rule indicates either what is always the case」（全文 grep 相符） | 需要規則的語意定義，或在工具間交換詞彙與規則 | 規格 334 頁，目標是機器可交換；未載業務人員如何起手寫 |
| RuleSpeak（Ross）。產出物：規則句子，附句型與「該做與不該做」兩份免費下載 | 第一手（作者公司） | http://www.rulespeak.com 「a set of guidelines for expressing business rules in concise, business-friendly fashion」（全文 grep 相符）；頁面稱其為 SBVR 的三種參考記法之一 | 要把規則寫成業務人員能驗證的句子 | 下載檔（Do's and Don'ts、Sentence Forms）本檔未取得，句型細節未查證 |
| DMN 決策表與決策需求圖。產出物：決策表（條件欄加結果欄加命中策略 hit policy），以及標出決策、輸入資料、知識來源關係的圖。檢核項：規則重疊與否、決策邏輯是否完整 | 官方（OMG） | https://www.omg.org/spec/DMN/1.5/PDF 「a hit policy indicates how to handle the multiple matches」；「Two rules are overlapping if all corresponding input entries are overlapping」；「the decision logic must be complete」；決策需求圖「forming a bridge between business process models and decision logic models」（全文 grep 相符） | 規則有多個條件的組合；要窮舉所有組合 | 「完整」一句的前提是要全自動化決策；半自動時規格容許留給人判斷 |
| 業務規則卡（Ambler）。產出物：每條規則有識別碼、名稱、說明、例子、來源、相關規則、修訂紀錄 | 第一手（Ambler） | https://agilemodeling.com/artifacts/businessrule.htm 「A business rule defines or constrains one aspect of your business」；「support traceability between rules」（全文 grep 相符） | 規則數量中等，要能被其他文件引用 | 該頁自述欄位多數選填；未載規則分類 |
| BABOK 規則與決策類技法：業務規則分析（10.9）、決策分析（10.16）、決策建模（10.17）、角色與權限矩陣（10.39） | 官方（IIBA） | https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/ 只讀到技法名稱。10.9 的用途說明僅見搜尋摘要（可信度低）：識別、表達、驗證、精煉、組織日常業務行為的規則 | 索引用 | 本文未讀；角色與權限矩陣的格式未查證 |

## 六、缺口與影響分析

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 現況到未來狀態的缺口分析（BABOK 任務 6.4）。產出物：現況描述、未來狀態描述、兩者差距、方案選項與建議路線 | 官方（IIBA 核心標準） | https://www.iiba.org/globalassets/standards-and-resources/core-standard/iiba-core-standard.pdf 「performs a gap analysis between current and future state」（全文 grep 相符）。輸入含現況描述、未來狀態描述（同檔 6.4 節） | 要改既有流程或系統，需先把現況與目標差距列清楚 | 核心標準不列技法與範本；50 項技法名稱中沒有「缺口分析」 |
| 需求變更評估（BABOK 任務 5.4）。產出物：對提議變更的影響評估，涵蓋需求與設計 | 官方（IIBA 核心標準） | 同上 「evaluate the implications of proposed changes to requirements and designs」（全文 grep 相符） | 任何開工後或定案後的變更提案 | 只定義目的與輸入輸出，未給清單 |
| 變更影響分析檢核清單（Wiegers）。產出物：一頁清單加報告表（估計工時、進度影響、品質影響、受影響的其他需求與任務）。檢核清單：有 | 第一手（作者，以轉載版取得） | 清單轉載：https://www.cin.ufpe.br/~sople/testing/epf/RiPLE/guidances/checklists/CR%20Analysis%20Checklist_C31462FA.html（頁上註明出自 www.processimpact.com）。原句：「Identify any existing requirements in the baseline that conflict with the proposed change.」；「Identify any user interface changes, additions, or deletions required.」；「Identify any changes, additions, or deletions required in reports, databases, or data files.」；「Identify existing unit, integration, system, and acceptance test cases that must be modified or deleted.」（全文 grep 相符，最後一句 15 字）。作者自述：https://www.cs.hmc.edu/~mike/courses/mike121/readings/requirements/reqtraps.html 「Understand the implications of accepting the change, identify all associated tasks」；「Use requirements traceability information to help you identify all affected」（全文 grep 相符，頁面為課程轉載） | 變更提案來了，要在答應之前列出波及範圍 | 原檔（Process Impact 網站）未取得；清單偏軟體專案，含硬體、原始碼、組建檔等 ERP 規劃用不到的項目 |
| 變更案例（change case，Ambler）。產出物：預期的需求變更描述，附發生可能性與影響 | 第一手（Ambler） | https://agilemodeling.com/artifacts/changecase.htm 「indicate the potential impact of that change」（全文 grep 相符） | 事先預想未來可能的變更，提早在架構上留空間 | 談的是預測，不是對既有提案做影響評估 |
| 事件風暴用於找現況缺口 | 第一手（作者網站） | https://www.eventstorming.com/ 該頁列出的用途含「Uncover inconsistencies between different perspectives and competing goals」（全文已讀；此句 8 字，grep 相符） | 現況流程跨部門且說法不一致 | 需要多人工作坊 |

## 七、驗收準則與可追溯

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 追溯需求（BABOK 任務 5.1）。產出物：需求、設計、解決方案元件及其他產出物之間的關係，用於影響分析、覆蓋與配置 | 官方（IIBA 核心標準） | https://www.iiba.org/globalassets/standards-and-resources/core-standard/iiba-core-standard.pdf 「relationships between requirements, designs, solution components, and other work products」；5.1 目的「ensure that requirements and designs at different levels are aligned to one another」（全文 grep 相符） | 需求有多層（目標、需求、設計）且會變動 | 核心標準不給矩陣格式；追溯成本隨層數上升（來源未載，此為判斷） |
| 追溯矩陣。產出物：一種產出物放欄、另一種放列，有追溯的格填上標記 | 二手（Wikipedia） | https://en.wikipedia.org/wiki/Requirements_traceability 「A traceability matrix is a table-like representation that maps artifacts of one type」（全文 grep 相符）。同頁說明矩陣的好處是所有連結一眼可見 | 要查「某需求有沒有對應的設計與測試」，或「某測試對應哪些需求」 | 百科頁；矩陣要手動維護，工具支援情形該頁未載 |
| 驗收測試當需求產出物（Ambler）。產出物：測試編號、說明、前置步驟、預期結果 | 第一手（Ambler） | https://agilemodeling.com/artifacts/acceptanceTests.htm 「they're executable specifications」（全文 grep 相符）；該頁說業務規則、功能與非功能需求都可寫成驗收測試 | 要讓驗收條目與需求同時成形 | 以自動化回歸測試為前提；未載與追溯矩陣的接法 |
| 需求驗證與確認（BABOK 任務 7.2、7.3）。產出物：已驗證需求（品質夠好）與已確認需求（對得上業務目標） | 官方（IIBA 核心標準） | 同上核心標準。7.2「is internally consistent, and is of high quality」；7.3「does not benefit the organization, does not fall within the solution scope, or both」（全文 grep 相符） | 需求定稿前的品質關卡 | 此兩項屬票 01 的驗證方法範圍，本檔只取其與追溯的接點；不展開 |
| 需求架構（BABOK 任務 7.4）。要點：每條需求只寫一次，再納入需求架構 | 官方（IIBA 核心標準） | 同上 「every requirement should be stated once, and only once」（全文 grep 相符） | 需求跨文件、跨層，要避免重複 | 未載重複的偵測方法 |
| BABOK 技法 10.1 驗收與評估準則、10.37 審查、10.26 項目追蹤 | 官方（IIBA） | https://www.iiba.org/knowledgehub/business-analysis-body-of-knowledge-babok-guide/10-techniques/ 只讀到技法名稱 | 索引用 | 本文未讀；驗收準則的格式未查證 |
| 使用案例的完整度檢查 | 第一手（Cockburn） | 見二節。步驟 12「Check for readability, completeness, and meeting stakeholders' interests.」 | 檢查一組使用案例是否漏目標 | 節錄未載「完整」的判準 |

## 與 Sens wiki 卡型對照

判定欄用詞：已涵蓋＝卡型有專屬段落與稽核維度；部分涵蓋＝有對應但缺關鍵要素；未涵蓋＝沒有對應卡型或段落。證據皆取自規範卡原文，只讀未改。

| 方法 | 判定 | 卡名與段名（證據） | 缺什麼 |
|------|------|------------------|--------|
| 流程建模：階段層（BPMN 的高階流程、服務藍圖） | 已涵蓋 | 《規範 - 商業邏輯》§ 三「服務藍圖撰寫規則」與 § 二「服務藍圖的判準＝有起點、終點與階段先後的端到端工作」；《範例 - 服務藍圖》 | 無泳道與並行的記法；規範未規定藍圖的畫法 |
| 流程建模：步驟層（使用案例、含擴充） | 已涵蓋 | 《規範 - 業務情境》§ 八「主流程」「副流程」「收斂狀態」；§ 〇 陷阱三引 Cockburn（主流程為骨幹、副流程掛接）；變體含接力型、能力型、排程型 | 副流程沒有「窮舉失敗路線」的步驟；§ 十二稽核維度未逐項核對 |
| 流程建模：流程分析（瓶頸、改善量測） | 未涵蓋 | 規範中未見對應段落；卡片撰寫共用規範未讀 | 現況與目標的流程差距量測 |
| 資料建模：實體、欄位、關聯、基數 | 已涵蓋 | 《規範 - 實體》§ 七「欄位（業務可見）」「關鍵關聯」（ER model，基數）；《規範 - 資料結構總覽》§ 〇（全系統總覽是實體關聯與基數的唯一正本） | 見下列兩列 |
| 資料建模：概念、邏輯、物理三層分離 | 部分涵蓋 | 《規範 - 實體》§ 七「通用技術欄位宣告」把主鍵、外鍵、時間戳記排除；§ 〇「收什麼」只收業務可見欄位 | 刻意只做概念與邏輯層。物理層留在實作，這是設計取捨，不是缺漏 |
| 資料建模：欄位層防呆（格式、必填、長度、值域）即資料字典 | 部分涵蓋 | 《規範 - 實體》§ 〇 投影表「同一筆資料內的檢核」寫在檢核區塊；§ 七 欄位表有「欄位形態」「填入時點」「可否修改」；§ 七 卡頂不寫欄位值域；《規範 - 商業邏輯》§ 二之二 把「系統行為承諾（整批不寫入、提示不擋）」歸規劃單 | 格式、長度、必填、列舉值域沒有固定欄位；「提示不擋」類行為只在規劃單，沒有跨單據的一致規則。開發常問的「防呆不一致」落在這裡。Cockburn 的資料描述第三級（欄位型別、長度、驗證）可當這一列的欄位定義依據 |
| 詞彙表 | 已涵蓋 | 《規範 - 實體》§ 七「營運背景」第一行連到詞彙表；《規範 - 狀態機》§ 七 狀態定義只寫在詞彙表；專案 AGENTS.md 列 ERP 詞彙表為術語定義正本 | 無 |
| 狀態建模：狀態、轉換、圖 | 已涵蓋 | 《規範 - 狀態機》§ 七「狀態列舉」「狀態機圖（UML）」「轉換條件與觸發事件」，§ 七「狀態機圖（UML）記法規約」（初始、終態、`<<choice>>`、複合狀態） | 無 |
| 狀態建模：完整性檢查 | 已涵蓋（多數） | 《規範 - 狀態機》§ 十 維度 4「可達性」、5「觸發操作完備」、6「條件互斥」、7「負向路徑」 | 沒有「狀態乘操作」的完整矩陣；§ 七「各狀態可改內容」是選填，只涵蓋「可改」，不涵蓋「可做哪些操作」 |
| 業務規則分析：規則分類、可變性 | 已涵蓋 | 《規範 - 商業邏輯》§ 二「歸類決策樹」與三種可變性（外部、領域、內部） | 與 SBVR 的行為規則與定義規則兩類不同軸。Sens 以「誰能改」分類；對映見未查證段 |
| 業務規則分析：規則句與決策表 | 已涵蓋 | 《規範 - 商業邏輯》§ 四「撰寫規則」：兩個以上條件的組合用決策表（窮舉封閉）；§ 十三 維度 9「量詞紀律」；《範例 - 商業規則》「規則」「為什麼這樣定」「具體例子」 | 決策表沒有命中策略與「重疊」檢查的明文；沒有類似 DMN 的決策需求圖（決策依賴關係） |
| 業務規則分析：規則與流程分離（宣言 2.2） | 已涵蓋 | 《規範 - 業務情境》§ 〇「判準本體正本在規則卡，禁抄準則本體與門檻數字」；《規範 - 商業邏輯》§ 二之二 落點表 | 無 |
| 角色與權限矩陣 | 已涵蓋 | 《規範 - 活動清單》§ 〇 活動定義（角色、目的、操作、範圍四要素）；§ 七 活動表；《規範 - 角色》§ 〇 角色卡不承載能做什麼 | 無 |
| 缺口分析（現況到目標） | 部分涵蓋 | `erp-plan` SKILL.md 盤點報告含「現況缺口」「連帶影響」；《審查知識路由》§ 三 正本重構流階段 2「矛盾與缺口清單」 | 缺口對象是 wiki 卡的缺漏，不是流程或系統現況與目標的差距；沒有現況描述與未來狀態描述的成對產出物 |
| 影響分析 | 部分涵蓋 | 《審查知識路由》§ 三 分級表（看實體間的關聯）；《帳務規劃連帶矩陣》（改哪一種單據要一起檢查哪些實體，限帳務）；`wiki-amend` Step 6 下游同步（Linear、手冊、Prototype 的受影響清單） | 沒有跨領域通用的變更影響檢核清單。帳務以外的領域沒有連帶矩陣；介面欄位、報表、測試案例、文件的影響沒有固定問題清單 |
| 驗收準則 | 部分涵蓋 | 《規範 - 業務情境》§ 〇「對驗收條目」：每條驗收條目掛在情境卡某一步或某個副流程分支之下；情境目錄「依據」行指向情境卡 | 驗收條目寫法在 Sens 外（情境目錄與測試）；wiki 只規定掛靠方式，不規定條目格式 |
| 可追溯 | 部分涵蓋 | 《規範 - 業務情境》§ 〇 讀者情境「改規則前反查哪些過程經過它」與 § 五「查掛在該步或該分支底下的驗收條目」；專案 AGENTS.md 規定單向引用 | 追溯靠單向連結反查，沒有矩陣或覆蓋度報表，查不出「哪個情境步驟沒有任何驗收條目」 |

## 對照 Miles 情境

下列只寫前提成立與否，不下結論。

| 做法 | 前提 | 在 Miles 情境 |
|------|------|--------------|
| BABOK 技法 | 技法本文要付費且為會員內容 | 公開頁只有目錄。要採用具體技法，需另購或取得合法授權；本檔無法驗證其內容 |
| BPMN 全套記法 | 多角色交接、開發者讀圖 | 成立：有多角色。不成立：沒有流程引擎，Sens 以卡片文字承載，記法規格 532 頁 |
| 使用案例的擴充段 | 一人窮舉失敗路線 | 成立：Sens 情境卡已有副流程段。代理主動列失敗路線屬 AGENTS.md「陷阱」中規劃單漏列互動、錯誤提示、例外處理的對策 |
| 事件風暴、工作坊類方法 | 多人同場 | 不成立：Miles 一人維護 |
| 資料字典與欄位防呆值域 | 有一處寫齊格式、必填、長度、列舉 | 成立：開發最常問欄位防呆不一致，而 Sens 實體卡欄位表沒有這些欄 |
| 狀態轉換表（狀態乘事件） | 狀態數有限、要查漏格 | 成立：狀態機卡已有可達性與負向路徑維度，缺的是整格矩陣 |
| SBVR 與 DMN | 要機器交換或自動決策 | 不成立：不做規則引擎。可借用的是分類與決策表的重疊、完整檢查 |
| RuleSpeak 句型 | 業務人員能驗證句子 | 成立：Sens 規則卡已有量詞紀律，兩者做法接近；下載檔未取得，無法逐項比對 |
| 缺口分析、影響分析檢核清單 | 規劃前跑一次 | 成立：`erp-plan` 已有盤點步驟。Wiegers 清單偏軟體專案，ERP 可用的項目以介面、報表、測試案例、文件為主 |
| 追溯矩陣 | 兩端產出物都有編號 | 部分成立：情境卡步驟、活動編號、操作編號有編號；驗收條目依「依據」行指向情境卡，可由代理產生覆蓋表。維護靠代理，不靠人工 |
| BA 與 SA 分工 | 兩種角色分開 | 不成立：同一人加代理；本檔不分 BA 與 SA，只按子題找方法 |

## 未查證與存疑

1. BABOK 指南第 3 版的技法本文（10.1 至 10.50）與其檢核清單：只讀到目錄，標未查證。缺什麼：會員內容。
2. ISO/IEC/IEEE 29148：iso.org 與 ieee.org 頁面回應 HTTP 403，未取得。搜尋摘要提到單條需求的品質特性與需求集合的完整、一致，屬搜尋摘要，可信度低，本檔不引用。
3. Harel 1987「Statecharts: A visual formalism」：PDF 是掃描檔，抽不出文字（`pdftotext` 輸出空白）。已改引 UML 2.5.1 對其變體關係的原句。
4. Cockburn《Writing Effective Use Cases》各編號指南（Guideline）的判準：只取得出版社 8 頁節錄（含 Reminders 與寫作流程）與 HaT 範本，指南本文未取得。
5. Wiegers 影響分析檢核清單原檔：Process Impact 網站與捷克大學的副本回傳 HTTP 402 或 404。本檔引用的是 RiPLE 專案頁的轉載版，原句經全文比對，但是否與原檔逐字相同未查證。
6. RuleSpeak 的「Do's and Don'ts」「Sentence Forms」下載檔：只讀到網頁，下載檔未取得。
7. SBVR 的行為規則與定義規則，和 Sens 規則卡的「做法」與「底線」是否同軸：本檔判斷底線接近「定義規則」、做法接近「行為規則」，但 Sens 規範以「誰能改」另立三種可變性，沒有查到明文對映。標存疑。
8. DMN 的完整性檢查如何用於業務單據規則：規格只說全自動化時邏輯須完整，半自動時未要求。
9. BA 與 SA 的職責界線：本檔取得的 BABOK 公開頁只列「資訊科技」等視角，未載 BA 與 SA 的分工定義。
10. 追溯矩陣與 Wikipedia 狀態轉換表屬二手百科，未找到標準組織或作者的公開頁；可信度較低。
11. 對照表中「缺什麼」欄屬本檔對規範卡的判讀，只讀規範與範例卡，未逐張抽查現有業務卡是否違反規範。

## 頁面夾帶的指示

無。IIBA 頁面有促銷文字（證照考試折扣），不是對 AI 的指示。
