# 票 41：長期專案分期交付時，後續階段的設計怎麼處理

調研日期：2026-11-12。本檔只列出處與原文句，不建議甲或乙，不下結論。
前一輪（`30-bco-best-practice.md` 題 C）只有 Fowler 的 YAGNI 與演進式資料庫設計，加上二手的 Poppendieck 摘要。本檔不重做那些，只補企業系統的導入方法與案例，並把 Fowler、Poppendieck 改讀原文。

## 讀取方式說明

- 多數頁面用命令列工具（curl）下載原始網頁，轉成純文字後以關鍵字比對引句，不經過小模型摘要。引句因此是逐字，只調整過因網頁轉檔造成的空白。
- 少數頁面只能用抓取工具（WebFetch，會經小模型摘要）。這些來源在表中標「摘要」，引句未逐字比對。
- 部分官方站擋下命令列下載（TOGAF 官網要登入、SAFe 官網被網站防護擋下、cio.com 被擋）。這幾處改讀網際網路檔案館（Wayback Machine）保存的同一頁副本。表中註明。
- 「全文」指本檔要用的章節已讀完，不是整個網站。

## 來源清單

| # | 網址 | 作者或機構 | 讀取程度 |
|---|------|-----------|---------|
| 1 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/drive-app-value-phases-increments | Microsoft（Dynamics 365 實施指南） | 全文 |
| 2 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/drive-app-value-minimal-viable-product-strategy | Microsoft | 全文 |
| 3 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/implementation-strategy-define-strategy-deployment-release | Microsoft | 全文 |
| 4 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/drive-app-value-drive-expansion | Microsoft | 部分（以關鍵字讀相關段落） |
| 5 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/drive-app-value-transformation-map | Microsoft | 全文 |
| 6 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design | Microsoft（Success by Design 框架） | 部分（頁面含新增的人工智慧代理內容，只讀藍圖與各階段段落） |
| 7 | https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-implementation-lifecycle | Microsoft | 部分（以關鍵字讀相關段落） |
| 8 | https://learn.microsoft.com/en-us/azure/architecture/guide/saas/case-studies/dynamics-365-journey-saas | Microsoft（Dynamics 365 團隊自述產品演進） | 部分（讀開頭決策與範圍段） |
| 9 | https://www.odoo.com/web/content/38170603?unique=1d2afcb2ac19f3787f44ad67d4d20ae456a97b3b | Odoo S.A.《Implementation Methodology》，2023 年 4 月版 PDF | 部分（讀階段表、分析、上線、第二次部署、資料、客製開發各節；約 102k 字元，未逐頁讀完） |
| 10 | https://blog.sap-press.com/sap-project-release-planning-with-sap-activate | SAP PRESS 部落格，改寫自 Lal 與 Viswanathan《SAP Activate Project Management Certification Guide》 | 全文（二手：出版社改寫的認證書節選，不是 SAP 官方文件） |
| 11 | https://learning.sap.com/courses/discovering-sap-activate-agile-project-delivery/explore-phase-overview_f9f503a3-54e9-4868-855c-5b88f879c6ad | SAP Learning | 摘要（抓取工具） |
| 12 | https://www.iiba.org/globalassets/standards-and-resources/core-standard/iiba-core-standard.pdf | IIBA《Global Business Analysis Core Standard》（對應 BABOK 指南第 3 版，2017 年） | 全文（約 12 萬字元，已搜尋並讀相關段落）。BABOK 指南本文需會員，未讀 |
| 13 | https://pubs.opengroup.org/togaf-standard/adm/chap09.html（Phase E）與 .../chap03.html（Phase A） | The Open Group《TOGAF Standard》第 10 版 | 全文（官網要登入，改讀 Wayback Machine 2024 年副本） |
| 14 | https://martinfowler.com/bliki/Yagni.html | Martin Fowler | 全文 |
| 15 | https://martinfowler.com/articles/designDead.html（Is Design Dead?） | Martin Fowler | 部分（讀序言、計畫式設計與演進式設計、架構、「難以用重構加入的事」各節） |
| 16 | https://martinfowler.com/articles/evodb.html | Martin Fowler 與 Pramod Sadalage | 部分（以關鍵字讀相關段落） |
| 17 | https://ptgmedia.pearsoncmg.com/images/0321150783/samplechapter/poppendieckch.pdf | Mary Poppendieck、Tom Poppendieck《Lean Software Development: An Agile Toolkit》試讀章（8 頁，是書的導論，不含第 3 章「Decide as Late as Possible」本文） | 全文（8 頁） |
| 18 | https://wirfs-brock.com/rebecca/blog/2011/01/18/agile-architecture-myths-2-architecture-decisions-should-be-made-at-the-last-responsible-moment/ | Rebecca Wirfs-Brock | 全文（內含 Poppendieck 書中句的引用，屬二手轉引） |
| 19 | https://www.scaledagileframework.com/architectural-runway/ 與 .../agile-architecture/ | Scaled Agile, Inc.（SAFe 官網） | 全文（官網擋命令列，改讀 Wayback Machine 2023 年副本） |
| 20 | https://www.cio.de/a/nestle-s-erp-odyssey,805779（頁面標示來源 CIO USA，2002 年） | CIO 雜誌；頁面未顯示作者 | 全文（10 頁中的 10 頁，第 8 頁只有短短一段；官網擋下，讀 Wayback Machine 2020 年副本） |

## 一、ERP 廠商的導入方法

### 1-1 Microsoft Dynamics 365：第一期不要只做「基本款」，要做橫跨流程的完整切片

- 來源 1。「But this approach has some risks. If the most valuable parts of the transformation are planned for later, you risk stakeholders losing interest, or poor user perception of the system, which is hard to correct.」
  說明：Microsoft 反對「第一期只做必要基本功能，創新的留到後期」的排法，理由是使用者對系統的第一印象難修正。
- 來源 1。「You want to deliver a holistic solution that has the key process elements, integrations, and reporting that create value.」
  說明：每一期都要涵蓋關鍵流程、整合與報表，而不是只做一個模組。
- 來源 2。「An MVP isn't a solution with just the basic and essential features.」；「An MVP with a broad scope that takes years to deliver is not an MVP.」
  說明：最小可行產品（MVP）可以超出基本款，但範圍大到要做好幾年就不算。
- 來源 2。「It creates the foundation for long-term success by supporting a "building block" mindset in which you keep adding without disrupting previous steps.」
  說明：第一期要用「積木」心態做，後面加東西時不能動到前面已做的部分。該頁指向「Solution architecture design pillars」說明所需的架構能力。
- 來源 3。「One approach is to release an initial set of features in the first phase, and then build on that by releasing the rest of the features in subsequent phases.」
  說明：分期上線的一種做法是先上一組功能，後面再疊。分期可依模組、業務優先順序、事業單位或地區切（同頁）。
- 來源 3（分期的代價）。「You have a more complex data migration from the old system to the new system, as it must be planned in a staggered way.」；「You might still need temporary interfaces to connect the new system with the old systems until all phases are rolled out.」
  說明：分期讓資料搬遷更複雜，且新舊系統之間要暫時的介面。
- 來源 3（分期的代價）。「tendency to incorporate changes and rework, which can affect the work for subsequent phases and their timelines.」
  說明：分期專案容易不斷併入變更與重做，並拖累後續各期。
- 來源 3（分期的好處）。「You can optimize the later phases by incorporating the lessons learned from the earlier ones.」
  說明：後期可吸收前期學到的東西。
- 來源 6（藍圖時點）。「Starting the SBR in Discover allows the team to surface architectural risks and alignment gaps early, before design decisions become costly to reverse.」（SBR：解決方案藍圖審查）
  說明：藍圖審查從探索階段就開始，目的是在設計決定變得難以回頭之前找出風險。
- 來源 6（範圍時點）。「In the Initiate phase, the project team defines all in-scope workstreams and updates the project plan to reflect these updates.」
  說明：啟動階段就把所有納入範圍的工作流定下來。
- 來源 6（細節時點）。「Implementation Reviews help you more deeply address questions related to the specific aspects of the solution design (data model, security, and integration) and implementation practices (ALM, testing strategy).」
  說明：資料模型、安全、整合的細部檢視放在實作階段，不在藍圖階段。
- 來源 6（下一期）。「The goal of this phase is stabilization and a shift in focus towards functionality and enhancements that are planned for the next phase of the project.」
  說明：上線後的營運階段轉向「下一期」才做的功能。
- 來源 7。「We recommend that you use the business process catalog to define the scope of work.」；「Keep in mind that your processes are always subject to change.」
  說明：用流程目錄界定工作範圍，同時提醒流程會變，目錄要保持彈性。
- 來源 5。「You should review and update your transformation map for each phase, product release, pivot, or strategic change in your business.」
  說明：功能與目標對應的轉型地圖，每一期都要重新檢視，不是一次定案。
- 來源 4（資料與整合）。「The core integrations should be part of the initial phases and not left to future expansion phases.」；「it's important to have strong governance around the data model and avoid creating more data stores that can lead to data fragmentation.」
  說明：核心整合放進初期；資料模型要有治理，避免日後各自長出資料存放處。

### 1-2 Odoo：上線前先分「沒有就無法營運」與「可等第二次部署」，上線後再依使用回饋重排

- 來源 9（階段表）。「ROI Analysis 10% ROI analysis, phasing & budget.」（原文為表格，欄位為階段、時間占比、目標）；「Implementation 80% Series of cycles: analysis, development, validation, key-user training.」；「Second deployment variable Broaden scope or add custom features.」
  說明：分期與預算在專案前 10% 的分析階段決定；80% 時間用在短週期循環；第二次部署用來擴大範圍。
- 來源 9。「Development that can be rolled out in the second deployment phase, after the project goes live」
  說明：分析時把客製開發分成「上線前一定要有」與「可在第二次部署做」兩類（原文括號：沒有它也能營運，但不理想）。
- 來源 9。「With the modularity of Odoo, it makes sense to deploy in several phases: first, with what the customer absolutely needs to operate the business, and only after moving to the second phase, other features to improve efficiencies.」
  說明：先上營運所需，其餘提升效率的功能放第二期。
- 來源 9。「Remember, customer’s priorities change when they go into production.」
  說明：客戶上線後優先順序會變。
- 來源 9（第二次部署）。「With the users' feedback, the prioritization of specific development will usually change (typically we notice that 50% of development was not necessary and new development has been requested).」
  說明：Odoo 自述經驗：上線後回頭看，約一半原本排定的開發用不到，且出現新需求。這是廠商整體觀察，文中未附樣本數。
- 來源 9（變更規則）。「If the change impacts a requirement to be completed in a later phase/cycle, accept it only if another requirement is dropped to compensate.」
  說明：影響後期需求的變更，要另一項需求被拿掉才接受。
- 來源 9（全貌）。「Get the global picture: stakeholders will have given you key objectives and/or issues early on. Your job is to present a consistent solution, addressing the management main concerns and ensuring end-users adoption.」
  說明：分析階段要先掌握整體樣貌，提出一致的解決方案。
- 來源 9（資料）。「Don’t delay the production launch due to data quality」；「Import master data, but avoid the full history (if possible)」
  說明：主檔要匯入，但不為了資料乾淨而延後上線，也不一定匯入完整歷史。

### 1-3 SAP Activate：只取得二手與摘要，官方一手文件未讀到

SAP 官方社群與說明站拒絕命令列下載（HTTP 403），下列兩處是替代來源。

- 來源 10（出版社改寫的認證書節選，二手）。「In almost all cases, the initial release plan happens based on the fixed scope during the proposal phase, and the team comes up with the high-level dates and budget.」
  說明：初期發版計畫依提案階段的固定範圍，只有高階日期與預算。
- 來源 10。「At the end of each sprint, the release planning process repeats with greater details and fewer unknowns, as shown below.」
  說明：每個衝刺（sprint）結束後重做發版計畫，細節變多、未知變少。
- 來源 10。「The product backlog is a live document and will continuously change during the process」
  說明：待辦清單是會持續變動的文件。
- 來源 11（SAP Learning，摘要，引句未逐字比對）。「The main purpose of the Explore phase is to perform a Fit-to-Standard Analysis」；「validate the solution functionality included in the project scope.」
  說明：探索階段用標準功能對照檢視（fit-to-standard）驗證「已在範圍內」的功能；差異項進待辦清單，留到實現階段處理。

## 二、商業分析與企業架構

### 2-1 BABOK（只讀到 IIBA 核心標準，BABOK 指南本文未讀）

- 來源 12。「When a change will have a predictable outcome, the future state and possible transition states can typically be clearly defined, and a clear strategy can be planned out.」
  說明：結果可預測時，未來狀態與過渡狀態可以事先講清楚。
- 來源 12。「If the outcome of a change is difficult to predict, the strategy may need to focus more on mitigating risk, testing assumptions, and changing course」
  說明：結果難預測時，策略改以降低風險、驗證假設、隨時轉向為主。
- 來源 12。「recommends the highest value approach for reaching the future state including any transition states that may be required along the way.」
  說明：「定義變更策略」任務的輸出包含過渡狀態；同任務輸出「解決方案範圍」（Solution Scope）。
- 來源 12（過渡需求）。「Transition requirements: describe the capabilities that the solution must have and the conditions the solution must meet to facilitate transition from the current state to the future state, but which are not needed once the change is complete.」；「Transition requirements address topics such as data conversion, training, and business continuity.」
  說明：過渡需求是為了從舊狀態過到新狀態才要的能力，完成後就不需要，例如資料轉換、訓練、業務持續。
- 來源 12（追溯）。「clearly defined relationships to other requirements, solution components, or releases, phases, or iterations, within a solution scope」
  說明：需求要能追溯到它屬於哪個發版、階段或迭代，變更的影響才看得出來。
- 來源 12（細節程度）。「Requirements and designs may be either high-level or very detailed based upon what is appropriate to those consuming the information.」
  說明：需求與設計可粗可細，由使用者與用途決定，標準不規定第一期要寫到多細。

### 2-2 TOGAF（企業架構）

- 來源 13（Phase A）。「Define what is inside and what is outside the scope of the Baseline Architecture and Target Architecture efforts, understanding that the baseline and target need not be described at the same level of detail.」
  說明：現況與目標不必寫到同樣細。
- 來源 13（Phase A）。「The extent of the time period aimed at, plus the number and extent of any intermediate time period」
  說明：定範圍時就要決定時間跨度，以及中間時期的數量與範圍。
- 來源 13（Phase A）。「The Architecture Vision typically covers the breadth of scope identified for the project, at a high level.」
  說明：架構願景涵蓋整個範圍的廣度，但層級是高階。
- 來源 13（Phase E）。「Determine whether an incremental approach is required, and if so identify Transition Architectures that will deliver continuous business value」
  說明：是否需要分段，是在 Phase E 才判斷；需要時定出過渡架構。
- 來源 13（Phase E）。「A Transition Architecture describes the enterprise at an architecturally significant state between the Baseline and Target Architectures.」；「The Transition Architectures should provide measurable business value.」
  說明：過渡架構是現況與目標之間的中途狀態，每一段要有可衡量的業務價值。
- 來源 13（Phase E）。「Determine where the difficult activities are, and unless there are compelling reasons, implement them after other activities that most easily deliver missing capability.」
  說明：困難的工作，除非有強理由，排在容易補上缺口能力的工作之後。
- 來源 13（Phase E）。「The key is to focus on the final target while realizing incremental business value.」
  說明：一邊盯著最終目標，一邊逐段實現價值。
- 來源 13（Phase E）。「Where significant additional detail is required before implementation the architecture is likely transitioning to a different level.」
  說明：實作前需要更多細節時，架構工作進入下一個細節層級，不是回頭改前一層。
- 未讀：TOGAF 資料架構（Phase C）章，因此資料模型怎麼分期，TOGAF 一欄標「來源未談」。

## 三、敏捷與架構：預留與不預留

### 3-1 Martin Fowler

- 來源 14。「Yagni only applies to capabilities built into the software to support a presumptive feature, it does not apply to effort to make the software easier to modify.」
  說明：YAGNI 只管「為還沒要用的功能預先做能力」，不管讓軟體更易修改的投入。
- 來源 14。「Yagni is only a viable strategy if the code is easy to change」（原文同段）
  說明：YAGNI 成立的前提是程式碼容易改。
- 來源 14（估算後再決定）。「Often that thought experiment is enough to convince them that it won't be significantly more expensive to add it later.」
  說明：Fowler 的做法是請人設想「之後加進來要重構什麼」，常會發現之後加並沒貴很多。
- 來源 14（承認失敗情形）。「there are times when applying yagni does cause a problem, and you are faced with an expensive change when an earlier change would have been much cheaper.」；「My sense is that yagni-failures are relatively rare and their costs are easily outweighed by when yagni succeeds.」
  說明：他承認會發生，但判斷罕見，且代價小於成功的情形。這是作者自己的判斷，沒附數據。
- 來源 15。「To me the term architecture conveys a notion of the core elements of the system, the pieces that are difficult to change.」
  說明：他對架構的定義就是「難以改變的核心部分」。
- 來源 15（難以事後加入的項目）。「Can we use refactoring to deal with all design decisions, or are there some issues that are so pervasive that they are difficult to add in later?」；「Adding anticipatory structures is probably better if you're in that position, than if you're new to the problem.」
  說明：他舉國際化為例，結論是做過這類事、能評估成本的人，預先加結構較合理；沒做過的人，之後再加較好。
- 來源 15。「Getting to a release as fast as possible is vitally important.」
  說明：他把盡快第一次發版放在高優先。
- 來源 16（資料庫）。「For a long time, people in the database community considered database design as something that absolutely needs up-front planning.」
  說明：舊觀點認為資料庫設計一定要預先規劃。
- 來源 16。「Over the course of the last decade and half we've been involved in many large projects that have used evolutionary database design and made it work.」；同段「Some projects involved more than 100 people in multiple sites world-wide.」「Others involved over half-million lines of code, over 500 tables.」
  說明：ThoughtWorks 自述在大型專案（超過 100 人、500 張表以上）用演進式資料庫設計。這是作者自述，文中沒列專案名稱，也沒列代價。
- 來源 16。「A transition phase is a period of time when the database supports both the old access pattern and the new ones simultaneously.」
  說明：結構要改時，過渡期新舊並存，等下游系統遷完再移除舊的。

### 3-2 Mary Poppendieck 與 Tom Poppendieck（原書導論，本文第 3 章未取得）

- 來源 17。「Don’t make irreversible decisions in the first place; delay design decisions as long as possible, and when they are made, make them with the best available information to make them correctly.」
  說明：作者自己的主張：不要做不可逆的決定，其餘延後到有最佳資訊時。
- 來源 17。「Delaying decisions is valuable because better decisions can be made when they are based on fact, not speculation.」；「In an evolving market, keeping design options open is more valuable than committing early.」
  說明：延後的理由是用事實取代推測；市場在變，保留選項勝過早承諾。
- 來源 17。「A key strategy for delaying commitments when developing a complex system is to build a capacity for change into the system.」
  說明：延後決策的前提，是把「能改」的能力建進系統裡。
- 來源 18（Wirfs-Brock 轉引書中第 3 章）。「Concurrent development makes it possible to delay commitment until the last responsible moment, that is, the moment at which failing to make a decision eliminates an important alternative.」
  說明：「最後負責時刻」的定義是不決定就會讓重要選項消失的時間點。這是二手轉引，我沒讀到書中原頁。
- 來源 18（批評）。「Making decisions early that are going to have huge implications isn’t bad or always wasteful.」；「Just having a last-responsible moment mindset leaves me open to making late decisions.」
  說明：Wirfs-Brock 不反對延後，但認為影響大的決定早做不一定浪費，她偏好「最適當的時刻」。

### 3-3 SAFe（Scaled Agile Framework）

- 來源 19。「Traditional architecture approaches led to extensive early architecture work. This can create overly comprehensive documentation and unvalidated decisions.」
  說明：SAFe 批評傳統做法一開始做太多架構，產生過多文件與沒驗證過的決定。
- 來源 19。「This yields the practice of emergent design—defining and extending the architecture only as necessary to deliver the next increment of functionality.」
  說明：敏捷的湧現式設計：只做到下一個增量需要的程度。
- 來源 19。「Organizations overcome these problems by balancing emergent design with intentional architecture, which requires some centralized planning and cross-team coordination.」
  說明：只靠湧現式設計在大規模下會出問題，所以仍要有一部分集中規劃（刻意架構）。列出的問題包括：缺標準使成本與延誤增加、一次性方案難改難維護。
- 來源 19。「Just the right amount of architectural runway is required at any given time. Too much, and the architecture bottlenecks the teams and over-engineers the current solution increment. Too little, and the organization will not have the runway it needs to meet near-term business commitments.」
  說明：架構跑道（runway）要剛好：太多拖累團隊，太少趕不上近期承諾。跑道定義是「近期功能所需、能以最少重做與延誤實作的程式碼、元件與基礎設施」。
- 來源 19。「The value is in working systems, not models or specifications」
  說明：跑道本身要用可運作的系統建，不是用模型或規格建。

## 四、案例

### 4-1 Nestlé USA「Best」專案（SAP，1997 至 2003）

這是本次找到唯一一個有具名公司、時間、代價且讀完全文的企業系統案例。出處是 2002 年的雜誌專題（來源 20），主要內容是 Nestlé USA 資訊長 Jeri Dunn 的自述，不是獨立稽核。

- 先定了什麼（藍圖）。「Soon the stakeholders team presented Weller with a blueprint for major changes they thought could be made in three to five years.」
  說明：1997 年先提出三到五年的整體變革藍圖。
- 先定了什麼（主檔）。「On the technical side, a smaller team spent 18 months examining every bit of item data in each division in order to implement a common structure across the company.」
  說明：開發前先花 18 個月統一各事業部的品項資料結構（例：同一款香草在每個事業部都叫 1234）。文中沒說這項決定後來被改。
- 先定了什麼（模組）。「Nestlé would implement five SAP modules - purchasing, financials, sales and distribution, accounts payable and accounts receivable - and the Manugistics' supply chain module.」
  說明：1998 年 3 月定出六個模組，各自跨全部事業部上線。
- 後來出了什麼問題。「In the rush to beat the Y2K deadline, the Best project team had overlooked the integration points between the modules.」；「In its haste to unify the company's separate brands, the project team had essentially replaced divisional silos with process silos.」
  說明：為趕千禧年期限，模組之間的整合點被漏掉，業務輸入的折扣，應收帳款看不到。
- 代價。「In June 2000 the project was halted.」；「Dunn estimates that last-minute switcheroo accounted for 5 percent of Best's $210 million cost.」
  說明：2000 年 6 月專案暫停；後來臨時改換供應鏈模組，Dunn 估計占總成本 2.1 億美元的 5%。另一代價是來自文中的客服電話一天達 300 通、需求預測人員離職率 77%（同文）。
- 後來怎麼改。「The offsite group members eventually decided that to finish the project they would need to begin at the beginning, starting with the business requirements then reaching an end date」；「By April 2001, the end-state design was complete, giving the project team a highly detailed road map to follow.」
  說明：暫停後改成先從業務需求出發，2001 年 4 月完成目標狀態設計，再往下做。這是「先做藍圖，卻因期限壓力沒做完整合設計」，後來補做的案例。
- 事後的看法。「If Dunn were to do it over again, she'd focus first on changing business processes and achieving universal buy-in, and then and only then on installing the software.」
  說明：Dunn 事後的說法：先改流程、取得共識，再裝系統。文中另稱此專案累計省下 3.25 億美元（Dunn 自述，未經查證）。
- 限制：本案是一次要涵蓋所有事業部的專案，不是「功能分期」，所以只能說明哪些東西先定、哪些漏掉，不能直接對應功能分期。

### 4-2 Microsoft Dynamics 365 自己的產品路線（來源 8）

這個案例是廠商做 ERP 產品自身的分期，不是客戶導入。

- 來源 8。「But in an ERP, components are tightly interconnected. The product isn't useful until there’s a slice of functionality across all these components, providing a suitable end-to-end experience to customers. The MVP scope is a horizontal slice of features across each component.」
  說明：ERP 的元件彼此緊密相連，第一版要切成橫跨所有元件的一片，而不是做完一個元件。
- 來源 8。「The initial deliverable should be minimal yet complete enough to enable real usage.」
  說明：第一個交付物要小，但完整到能被真正使用。
- 來源 8。「First, there was sufficient value in the data models and business logic that we’d created and validated with thousands of customers that it was worth evolving our existing solutions.」
  說明：他們沿用已被數千客戶驗證的資料模型與業務邏輯，而不是重做。

### 4-3 找不到的案例

- 有具名客戶、寫出「第一期先設計了什麼、後來改了什麼、代價多少」的 ERP 分期導入案例，除 Nestlé 外沒找到。
- 找到的失敗案例報導（Hershey、Lidl、Target Canada、Birmingham 市議會 Oracle）只有搜尋摘要，我沒讀到全文，也沒有一篇的主題是「預先設計或預留」。Birmingham 的報導我也沒找到它採分期的證據。這些不列為來源。
- 「預留欄位或擴充點，後來用上或沒用上」的企業系統量化資料：未找到。最接近的是 Odoo 的「約一半開發用不到」（廠商自述）與 Fowler 的「YAGNI 失敗罕見」（作者判斷）。

## 五、對照：規劃第一期時，四層各來源主張先定或留到各期

欄內文字都是來源說了什麼，不是建議。「來源未談」表示我讀到的範圍沒有說。主張不同的地方並排，不調和。

### 5-1 逐來源對照

| 來源 | 整體藍圖與範圍 | 流程全貌 | 資料模型與主檔 | 各功能的細部設計與欄位 |
|------|---------------|---------|---------------|---------------------|
| Microsoft Success by Design | 一開始定：探索階段起做解決方案藍圖審查，啟動階段定所有納入範圍的工作流。轉型地圖「每一期都重新檢視」 | 一開始用流程目錄界定範圍，並提醒流程會變、目錄要保持彈性 | 資料模型的細部審查放實作階段；資料模型要有治理；核心整合放初期 | 留到實作階段與各期 |
| Microsoft MVP 與分期頁 | 第一期要涵蓋關鍵流程、整合、報表（完整切片），不是只做基本款 | 同左（橫跨流程） | 來源未談（分期時資料搬遷更複雜） | 第一期積木式，後面加不動前面 |
| Odoo | 一開始定：前 10% 的分析階段定分期與預算，並把開發分成「上線前必要」與「可放第二次部署」 | 分析階段要掌握整體並提出一致方案 | 匯入主檔，不為資料乾淨延後上線，歷史不一定要匯 | 留到各週期與第二次部署；自述上線後約一半原排開發用不到 |
| SAP Activate（二手與摘要） | 一開始定：提案階段固定範圍與高階日期、預算 | 探索階段逐流程做標準對照 | 來源未談 | 留到各衝刺；每個衝刺結束重排，細節變多、未知變少 |
| BABOK 核心標準 | 一開始定未來狀態、過渡狀態與解決方案範圍，但「結果難預測時」改以降風險與驗證假設為主 | 來源未談 | 過渡需求涵蓋資料轉換 | 可粗可細，看使用者與用途；需求要追溯到發版、階段或迭代 |
| TOGAF | 一開始定：Phase A 就定範圍、時間跨度、中間時期數量，願景涵蓋整個範圍的高階；Phase E 才判斷是否分段，並定出過渡架構與路線圖 | 業務、資料、應用、技術各領域的目標架構在 Phase B 到 D 先定，現況與目標不必同樣細 | 來源未談（資料架構章未讀） | 路線圖與目標架構同層級；實作前要更細時進入下一個細節層級 |
| Fowler | 來源未談範圍；主張盡快第一次發版，不為推測的功能預先做 | 來源未談 | 資料庫設計可演進，不必預先定案（舊觀點相反）；難以事後加入的項目（例：國際化），有經驗者可預先加結構 | 不預先做推測功能；前提是程式碼容易改 |
| Poppendieck | 延後不可逆以外的決定；保留選項 | 來源未談 | 來源未談 | 延後到有事實時；要把「能改」的能力建進系統 |
| Wirfs-Brock | 影響大的決定早做不一定浪費；偏好「最適當的時刻」 | 來源未談 | 來源未談 | 不主張全部延後 |
| SAFe | 一部分刻意架構（集中規劃）加湧現式設計；路線圖定計畫 | 來源未談 | 來源未談 | 湧現式：只做到下一增量；跑道要「剛好」，太多或太少都有代價 |
| Nestlé 案例（Dunn 自述） | 先做了三到五年藍圖；暫停後補做完整的目標狀態設計 | 各模組各自定義流程，漏了模組間整合點 | 開發前花 18 個月統一品項資料結構 | 趕期限時細部整合被漏掉 |
| Microsoft Dynamics 產品自述 | 第一版範圍切成橫跨所有元件的一片 | ERP 元件緊密相連，要有端到端 | 沿用已驗證的資料模型 | 來源未談 |

### 5-2 主張並排（互相不同之處）

| 議題 | 主張甲 | 主張乙 |
|------|--------|--------|
| 第一期內容 | Microsoft：不要只做基本款，要含關鍵流程、整合、報表，否則使用者第一印象難修正 | Odoo：第一期只做「沒有就無法營運」的部分，其餘效率類功能放第二期 |
| 要不要預先設計 | Fowler、Poppendieck、SAFe 的湧現式部分：只做眼前需要，延後其餘 | TOGAF：範圍、時間跨度、中間時期、目標架構先定；SAFe 的刻意架構：部分集中規劃；Wirfs-Brock：影響大的決定早做不一定浪費 |
| 資料庫與主檔 | Fowler：可演進，不必預先定案，用過渡期新舊並存 | Fowler 轉述的舊觀點：資料庫設計要預先規劃（他本人不同意）；Nestlé：開發前先統一品項資料結構 |
| 後期需求會不會變 | Odoo：上線後約一半原排開發用不到；Microsoft：轉型地圖每期重審 | BABOK：結果可預測時，過渡狀態可事先清楚定義 |
| 不可逆的東西 | Poppendieck：不做不可逆決定，延後 | Microsoft：藍圖審查要早做，因為設計決定「變得難以回頭」之前要先看到風險；Fowler：架構是「難以改變的核心部分」 |

## 六、未取得與限制

- SAP Activate 官方文件（help.sap.com、SAP Community）被拒絕下載，SAP 一欄只有出版社改寫的二手與一份摘要。「分期時主檔怎麼設計」在 SAP 來源完全沒找到。
- Microsoft FastTrack 另有的文件未讀；本檔只讀實施指南相關頁。來源 6 的頁面含新增的人工智慧代理章節，與本題無關，未採用。
- BABOK 指南（第 3 版）本文為會員內容，只讀到核心標準；「解決方案範圍」「過渡需求」只有核心標準的定義句，沒有指南的技法與檢核清單。
- TOGAF 資料架構章（Phase C）未讀，資料模型一欄來源未談。TOGAF 也有〈Applying the ADM using Agile Sprints〉指引，本次未取得。
- Poppendieck 書第 3 章「Decide as Late as Possible」本文未取得，只有導論試讀章與 Wirfs-Brock 的轉引。
- Mary Poppendieck 本人的文章，本次沒有找到可全文讀取的版本。
- Davenport 的 HBR 文章、Markus 與 Tanis 的 ERP 研究等學術來源有付費牆，未讀。
- Nestlé 案例是單一公司的事後自述，成本數字（2.1 億美元、省下 3.25 億美元）由當事人提供，未經獨立查證。
