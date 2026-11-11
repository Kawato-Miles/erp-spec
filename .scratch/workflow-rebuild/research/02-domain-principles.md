# ERP 與 MES 設計的學術與標準原則調研（raw 骨架草稿）

調研日期：2026-11-11。調研者：erp-researcher（sonnet）。
本檔只記業界與學術怎麼說，不給公司該怎麼做的建議。

來源等級（照本檔自訂標記）：
- A：標準組織或作者一手文件，已逐字讀到原文（用 Read 看 PDF 影像）。
- B：標準組織公開摘要頁，或經摘要工具（WebFetch 內建小模型）回傳的引句，標「摘要工具，未逐字核對」。
- C：大學、廠商文件、百科、搜尋結果摘要。只能佐證，不能當標準。
- 「推導」：原則句是調研者從來源歸納而成，來源沒有直接寫成這句話。

引句一律不超過 15 個英文詞。中文課程章名為頁面原文。

---


主對話抽查（2026-11-11）：下載 CPIM 2020 試閱、TAGA 2015 論文、ISA-95.00.03-2013 試閱三份 PDF 轉文字比對，閉環與產能約束、損耗與合版、Work Master 與有限產能排程的引句與原文相符。SCOR 前言 PDF 下載被擋，未抽查。其餘引句未抽查。
更正：清大課程頁列 12 章，專案紀錄的「34 講」是 34 支影片分屬 12 章，兩者不矛盾。

## 一、結論摘要

1. ISA-95 Part 3 的一手文件（2013 版前言與範圍）確認：第 3 層只模型化「製造作業管理」活動，介於第 4 層規劃與第 2 層控制之間。付費全文未讀，生產、品質、維護三類作業的活動模型細節未查證。
2. ASCM（原 APICS）CPIM 教材引用字典定義：製造規劃與管制是「閉環」系統。主排程、物料需求規劃、產能需求規劃都要受產能約束，現場執行回饋要讓計畫保持有效。
3. 清華開放式課程林則孟「生產計畫與管制」頁面列 12 講，章名與 ASCM 體系的順序大致對得上。
4. REA 模型的核心是「增加資源事件與減少資源事件成對」（對偶性）。McCarthy 1982 原文未讀，只讀到論文與百科的描述。ISO/IEC 15944-4:2015 是 REA 的國際標準出口，只讀到公開摘要。
5. 雙式簿記不變量（借貸合計相等、會計恆等式）有百科引句可佐證，未取得會計準則原文。
6. 內控：職能分工（授權、記錄、保管不可同一人）有 ISACA 與州審計長的公開文件佐證。COSO 2013 原文沒取到，原則 10 至 12 只有二手引述，標「未查證」。
7. 三單勾稽（採購單、驗收單、發票）只找到會計教學與廠商文章，找不到標準或準則出處。
8. SCOR 數位標準前言（A 級）確認六大流程與「是流程不是職能」。APQC PCF 簡介（A 級）確認 13 個大類與五層階層。「訂單到收款」「採購到付款」的 PCF 編號未查證。
9. 印刷業：CIP4 XJDF 一手論文（A 級）確認 JDF 把整張工作單與流程相依寫在同一檔，XJDF 改為每次只交換一筆交易。MIS 通用模型只有 CIP4 ICS 的搜尋摘要。
10. 「沖銷而非刪除」「主檔與交易檔分離」查不到公認標準，只有廠商文件與 APICS 對 ERP 的定義句，列為弱佐證。

---

## 二、原則總表

欄位：編號｜領域｜原則陳述（可判定）｜適用模組｜違反時的典型症狀｜來源（等級）

| 編號 | 領域 | 原則陳述 | 適用模組 | 違反症狀 | 來源 |
|------|------|----------|----------|----------|------|
| P01 | ISA-95 | 第 3 層（製造作業管理）活動只在第 4 層規劃與第 2 層控制之間交換資料，不替代兩者。（範圍界定） | 生產、報工、轉交 | ERP 規劃欄位與現場報工欄位混用，同一欄位兩種語意 | ISA-95.00.03-2013 範圍節（A） |
| P02 | ISA-95 | 製造作業管理分生產、維護、品質、庫存四類作業，各有自己的作業定義與排程；庫存作業負責協調、指揮、管理、追蹤庫存與物料移動。 | 生產、倉儲、品檢 | 庫存異動寫在生產報工裡，物料帳與工單帳對不起來 | ISA-95.00.03-2013 第 3.1.2 節（A，只確認庫存定義）；其餘三類見 § 三（B/C） |
| P03 | ISA-95 | 要說明「怎麼做」的資料（Work Master）與「要做什麼、已做什麼」的資料（Job Order、Job list）分成不同物件。 | 工序主檔、工單、派工 | 改工序主檔後，已開工的工單被連帶改變 | ISA-95.00.03-2013 前言第 13 點（A） |
| P04 | ISA-95 | 有限產能排程的任何時段，已排工作量不得超過可用產能。 | 排程、派工 | 設備同一時段被排超載，現場靠人工插單調整 | ISA-95.00.03-2013 第 3.1.1 節（A） |
| P05 | MESA | MES 功能範圍有 11 項（排程、資源配置與狀態、派工、文件管制、資料收集、人力管理、品質、流程管理、維護、產品追蹤與譜系、績效分析）。 | MES 範圍盤點 | 漏掉某項功能而事後以人工補洞 | 見 § 三 3.2（C，未取得 MESA 一手文件） |
| P06 | 生產計畫 | 計畫與執行構成閉環：主排程、物料需求規劃、產能需求規劃都檢查產能；執行端回報要回到計畫，讓計畫保持有效。 | 排程、報工、採購 | 計畫只往下發、現場延誤沒回饋，交期承諾失準 | CPIM 2020 試閱 p.1-58、1-64（A） |
| P07 | 生產計畫 | 計畫由上往下逐層細化，層級越低期間越短、細節越多；每層計畫能回溯到上一層計畫。 | 訂單、排程、工單 | 工單找不到對應訂單需求，或訂單改量後工單不跟著檢視 | CPIM 2020 試閱 p.1-61（A） |
| P08 | 生產計畫 | 產能分層檢查：資源規劃、粗估產能、產能需求規劃、現場產能控制，每層只檢查自己層級的資源。 | 排程 | 只在最後一層才發現產能不夠，要大量改單 | CPIM 2020 試閱 p.1-61（A） |
| P09 | 生產計畫 | 不假設產能無限；排程要把產能約束納入。 | 排程、承諾交期 | 承諾交期總是被現場打破 | CPIM 2020 試閱 p.1-64（A） |
| P10 | 限制理論 | 先找出系統的限制資源，再讓其他資源配合限制資源的節奏；限制資源前設緩衝，投料依限制資源節奏釋放。 | 排程、投料 | 非限制資源忙碌但出貨不增加，在製品堆積 | Wikipedia 限制理論（C，摘要工具，未逐字核對） |
| P11 | 拉式與推式 | 拉式由顧客訂單觸發補貨或生產；推式靠預測觸發。接單生產屬於訂單觸發。 | 訂單、備料 | 以預測量備料，訂單取消後庫存積壓 | Wikipedia Kanban（C，摘要工具，未逐字核對） |
| P12 | REA | 每一筆減少資源的經濟事件，都有對應增加資源的事件，兩者以對偶關係連結。（推導） | 款項、發票、出貨、採購、收貨 | 出貨了沒有收款或應收，領料了沒有產出 | Wikipedia REA（C）；Hruby 整合論文（B，摘要工具）；McCarthy 1982（未讀） |
| P13 | REA | 製造等轉換流程的對偶關係可連結兩個以上事件，不限一對一。 | 工單、報工 | 把轉換流程硬拆成一對一，部分領料或部分完成對不起來 | Wikipedia REA（C，摘要工具） |
| P14 | REA | 事件要指出「影響哪些資源」（存量流量關係）與「誰參與、誰負責」（參與者）。（推導） | 全部單據 | 單據只記金額不記是哪個資源、誰經手 | Hruby 整合論文（B，摘要工具） |
| P15 | 雙式簿記 | 每筆已記錄的交易讓會計恆等式（資產＝負債＋權益）保持平衡；借方合計等於貸方合計。 | 款項、發票、成本 | 試算表借貸不平，帳要靠人工平 | Wikipedia 雙式簿記（C，摘要工具） |
| P16 | 內控 | 授權交易、記錄交易、保管交易產生的資產，三項職能不可由同一人兼任。 | 採購、收貨、付款、出貨、庫存 | 同一人可開採購單、收貨、核准付款，舞弊無人察覺 | 明尼蘇達州審計長（B，摘要工具）；ISACA（B，摘要工具） |
| P17 | 內控 | 不可能完全分工時，要有替代控制（例如第二人覆核、第三方查核）。 | 小組織各模組 | 一人兼多職但無覆核紀錄 | COSO 要點二手引述（C）；未取得一手 |
| P18 | 內控 | 付款前，採購單、驗收紀錄、發票三者的數量與單價要核對；不符者先查明。 | 採購、收貨、應付 | 沒收到貨仍付款，或重複付款 | AccountingCoach（C，摘要工具）；搜尋摘要（C）；無準則原文 |
| P19 | 內控 | 控制活動透過政策（說明期望）與程序（落實政策）部署，並指定責任人。 | 全部模組的權限與流程 | 規則只寫在文件，系統沒有對應動作或責任人 | COSO 原則 12 二手引述（C，未查證） |
| P20 | 參考模型 | SCOR 描述的是流程，不是職能；同一個流程由誰做是另一層設計。 | 角色與流程 | 把流程分類綁死在組織部門，改組織就要改流程 | SCOR 數位標準前言 p.vi（A） |
| P21 | 參考模型 | 流程分類有階層編號；基準比較用編號對齊，即使名稱不同。 | 流程盤點 | 同一流程在不同文件名稱不同，無法對照 | APQC PCF 簡介（A） |
| P22 | 參考模型 | SCOR 涵蓋從訂單進入到發票付清的活動，但不涵蓋行銷、產品開發與研發。 | 訂單到收款範圍 | 把報價、設計研發也算進訂單到收款而範圍失控 | SCOR 數位標準前言 p.v（A） |
| P23 | 單據流 | 業務交易的進度可以用狀態機描述，狀態與轉換有明確定義。 | 全部單據 | 單據狀態靠人工判讀，同一狀態兩種意思 | ISO/IEC 15944-4:2015 公開摘要（B，摘要工具） |
| P24 | 單據流 | 已過帳的交易以沖銷（另建反向交易）修正，原交易保留以留下稽核軌跡。 | 款項、發票、庫存、出貨 | 刪改已過帳單據後帳務與庫存無法回溯 | Intacct 說明（C，廠商文件）；無公認標準原文 |
| P25 | 主檔與交易 | ERP 以集中資料庫存放主檔記錄與歷史及現行交易資料，一份資料只存一處，避免多份互相不同步的重複記錄。 | 全部模組 | 同一客戶或品項在多張表各存一份，修改後不一致 | CPIM 2020 試閱 p.1-63、1-64（A） |
| P26 | 印刷業 | 印刷工作單把「產品意圖」與「流程」分開描述；一個流程步驟可對應多個產品（例如合版）。 | 印件、工單 | 合版或一張大紙做多件時，工單無法表達 | TAGA 2015 Prosi 論文 p.33（A） |
| P27 | 印刷業 | 流程步驟的資源要分清「消耗」與「產出」，兩者的數量可能因損耗而不同。 | 報工、損耗、庫存 | 投入張數等於產出張數，損耗無處記 | TAGA 2015 Prosi 論文 p.31（A） |
| P28 | 印刷業 | 工單變更需支援「增量改單」；改頁數或尺寸會使原生產方法失效，須從規劃重來。 | 改單、工單 | 改單後舊工序仍照舊方法執行 | TAGA 2015 Prosi 論文 p.33（A） |
| P29 | 印刷業 | 工作單交換單位是「兩方之間的一筆交易」；完整工作單只存在管理系統內部模型。 | 外發、轉交 | 把整張工單丟給外發廠，對方收到與其無關的資料 | CIP4 詞彙表（B，摘要工具）；TAGA 論文 p.29（A） |

---

## 三、各領域細節與引句

### 3.1 ISA-95 與 IEC 62264（領域 1）

一手來源：ANSI/ISA-95.00.03-2013 試閱 PDF（ISA 官網）。https://www.isa.org/getmedia/506c4c83-c2d3-4807-83e7-682fd98c17f8/ISA-95-00-03-2013-preview.pdf
說明：付費標準只公開前言、範圍、術語約三頁，已用 Read 逐頁看影像，下列引句為原文。

- 範圍（p.13）：「a model of the activities associated with manufacturing operations management, Level 3 functions」。同節說明活動介於第 4 層「business planning and logistics functions」與第 2 層「process control functions」之間。
- 目的（p.11）：「reduce the risks, costs and errors associated with implementing enterprise systems」。
- 庫存作業管理定義（p.13，第 3.1.2 節）：「activities within Level 3 of a manufacturing facility which coordinate, direct, manage and track inventory」。
- 有限產能排程定義（p.13，第 3.1.1 節）：「no capacity scheduled exceeds the capacity available」。
- 資料物件改名（p.12，前言第 13 點）：「Production Dispatch List changed to Job list」；「Work Masters as objects that define how work is to be done」。
- 本版與 IEC 62264-3 對應（p.11）：「The document is based on the IEC/ISO 62264-3 version.」

生產、維護、品質三類作業管理的活動模型：只從搜尋摘要得知 IEC 62264-3:2016 目次含生產作業管理（執行、資料收集、追蹤、績效分析）與維護作業管理。品質在西門子頁面稱為實驗室作業管理。以上為搜尋摘要（C），未取得原文，列入 § 五。
西門子頁面：https://www.sw.siemens.com/en-US/technology/isa-95-framework-layers/（C，未逐字核對）。
Wikipedia ISA-95（C，摘要工具）：「focuses on the functions and activities at level 3」。https://en.wikipedia.org/wiki/ISA-95

### 3.2 MESA 的 MES 功能模型（領域 1）

- 一手來源 MESA White Paper #6「MES Explained: A High Level Vision」未取得，列入 § 五。
- Wikipedia（C，摘要工具，未逐字核對）：MESA 「introduced some structure by defining 11 functions that set the scope of MES」。https://en.wikipedia.org/wiki/Manufacturing_execution_system
- 11 項名稱來自兩個搜尋結果摘要拼合（C，未逐字核對）：作業／細部排程、資源配置與狀態、派工生產單位、文件管制、資料收集或擷取、人力管理、品質管理、流程管理、維護管理、產品追蹤與譜系、績效分析。https://www.symestic.com/en-us/what-is/mesa-11
- 同一摘要稱 ANSI/ISA-95 把 MESA-11 與 Purdue 參考模型合併成功能階層（C，未逐字核對）。

### 3.3 ASCM／APICS 知識體系（領域 2）

一手來源：ASCM CPIM 2020 試閱 PDF（Version 6.2），用 Read 逐頁看影像，下列為原文。https://learningsystem.ascm.org/wp-content/uploads/2019/11/CPIM_LS_2020_Excerpt.pdf

- 閉環（p.1-59）：「Closed-loop means that capacity constraints are considered when planning and controlling manufacturing.」
- 製造規劃與管制定義（p.1-58，引 APICS 字典第 16 版）：「A closed-loop information system that includes the planning functions of production planning」。後接主排程、物料需求規劃、產能需求規劃。
- 計畫與執行的切換（p.1-58）：「Once the plan has been accepted as realistic, execution begins.」
- 閉環 MRP（p.1-64）：「feedback is provided by the execution processes so the planning can be kept valid」。
- 早期開環 MRP（p.1-64）：「simplifying assumption that there was infinite capacity」。
- 層次（p.1-61）：主排程階段做粗估產能計畫，只檢查瓶頸；物料需求規劃階段做產能需求規劃，「This capacity check looks at all resource capacities, not just bottlenecks.」現場階段由產能控制管制工作中心產能。
- 由上而下（p.1-61）：「Planning occurs from the top down」，並指出這是迭代系統：計畫先粗後細，反覆修正。
- 期間與頻率表（p.1-63，Exhibit 1-18）：主排程約 3 個月、每週；物料需求規劃約 10 週、每日；工單與採購單約 6 週、每班。表中數字為「illustrative」，依產業而異。
- ERP 定義（p.1-63，字典第 16 版）：「An ERP system provides extensive databanks of information including master file records」，並含「historic and current transactional data」。

拉式與推式：ASCM 一手定義未取得。Wikipedia Kanban（C，摘要工具）：「Re-supply or production is determined according to customer orders.」https://en.wikipedia.org/wiki/Kanban
限制理論：Wikipedia（C，摘要工具）五步驟引句：「Identify the system's constraint(s).」；「Subordinate everything else to the above decision.」；繩的定義：「The rope is the work release mechanism for the plant.」https://en.wikipedia.org/wiki/Theory_of_constraints
高德拉特原著與 ASCM 對限制理論的官方定義未取得，列入 § 五。

### 3.4 清華開放式課程「生產計畫與管制」（領域 2）

來源：https://ocw.nthu.edu.tw/courses/136（摘要工具，章名為頁面原文，「Chapters on Youtube」區塊為空）。
講者：林則孟教授。課程頁列 12 講：

1. 第1講 生產系統與計畫管制
2. 第2講 預測
3. 第3講 存貨管理
4. 第4講 產能
5. 第5講 總體計畫
6. 第6講 主生產排程
7. 第7講 物料需求規劃
8. 第8講 製造資源規劃
9. 第9講 作業排程
10. 第10講 限制理論
11. 第11講 生產活動管制
12. 第12講 精實生產與豐田生產系統

清大課程說明頁（搜尋摘要，C，未逐字核對）列出主題：「存貨管制,總合生產計劃,主排程,物料需求計劃(MRP),產能規劃,生產活動管制,作業排程,限制理論,與預測等」。https://khub.nthu.edu.tw/document/courses/09710IEEM304000.html
講義 PDF：https://ocw.nthu.edu.tw/ocw/upload/136/1806/清大工工系林则孟教授_生產計畫與管制課程講義.pdf（只看到搜尋摘要，未讀內文）。

與 ASCM 對照（調研者對照，非來源所述）：第 5 至 8 講對應 S&OP、主排程、MRP、MRP II；第 4 講對應產能；第 11 講對應現場管制（PAC）；第 10 講為限制理論。

### 3.5 REA 與 ISO/IEC 15944-4（領域 3）

- 原始出處：McCarthy, W.E. 1982, The Accounting Review 57(3), 554–578（Wikipedia 引用資訊，摘要工具）。原文未讀。https://en.wikipedia.org/wiki/Resources,_Events,_Agents
- 對偶性（Wikipedia，摘要工具，未逐字核對）：「a pair of events, linked by an exchange relationship」。同頁指出製造類流程可連結兩個以上事件。
- Hruby 與 McCarthy 參考模型整合論文第 2.1 節（B，摘要工具，未逐字核對）：「This duality balances the changes in resources due to events.」並稱存量流量關係「shows which resources are involved in and affected by which events」。https://scitepress.org/Papers/2010/28717/pdf/index.html
- 搜尋摘要提到有研究者指出原模型對對偶關係未設價值限制，並提出「平衡對偶」概念（C，未核對原文）。因此「每減少必有增加」是對偶性的通俗推導，是否要求價值相等有學術爭議，列入 § 五。
- ISO/IEC 15944-4:2015 公開摘要（IEC 商店，摘要工具，未逐字核對）：提供「a set of UML class diagrams and conceptual explanations」；描述「the mechanics of a business transaction state machine」；範圍「propose standards only for the Business Operational View (BOV)」。https://webstore.iec.ch/publication/22042
- 2007 年版把 REA 列為理論背景（搜尋摘要，C，未逐字核對）。2015 版是否沿用 REA 的措辭未查證。

### 3.6 雙式簿記不變量（領域 3）

Wikipedia 雙式簿記（C，摘要工具，未逐字核對）：
- 「The total of the debit column must equal the total of the credit column.」（試算表）
- 「Every transaction recorded will keep this equation in balance.」（會計恆等式）
https://en.wikipedia.org/wiki/Double-entry_bookkeeping
一手來源（會計準則或簿記教科書）未取得。

### 3.7 內控（領域 4）

職能分工：
- 明尼蘇達州審計長（B，摘要工具，未逐字核對）：理想狀態是任何人都不能同時「Authorize a transaction」、「Record the transaction in the entity's books」、「Obtain custody of the item resulting from the transaction」。同頁：「a person should not be in a position to commit an irregularity and cover it up.」https://www.osa.state.mn.us/audit-resources/audit-guidance/avoiding-pitfalls-articles/segregation-of-duties-part-i
- ISACA Journal 2022 年第 5 期（B，摘要工具）：「Incompatible duties are duties that should not be performed by the same actor」。https://www.isaca.org/resources/isaca-journal/issues/2022/volume-5/a-step-by-step-sod-implementation-guide
- Wikipedia（C，摘要工具）：「Separation of duties is a key concept of internal controls.」https://en.wikipedia.org/wiki/Separation_of_duties
- 有些來源加第四項「對帳」（搜尋摘要，C）。三項與四項兩種版本並存，未找到統一的權威定義，列入 § 五。

COSO：
- COSO 官網執行摘要 PDF 與 AAA 頁面無法取得內文。原則 10 至 12 只有二手引述（大學與 CPA 教學頁，搜尋摘要，C，未逐字核對）：「selects and develops control activities that contribute to the mitigation of risks」。https://finance.arizona.edu/internal-control/components/control-activities
- 原則 12 的二手引述含「deploys control activities through policies」與「procedures that put policies into action」。
- 「處理職能分工」是原則 10 的關注點之一（搜尋摘要，C）。原文未查證。

三單勾稽：
- AccountingCoach（C，摘要工具）：目的是「avoid paying an incorrect and perhaps fraudulent invoice」。https://accountingcoach.com/blog/what-is-three-way-match
- 三單為採購單、驗收報告、廠商發票；兩單版本只比採購單與發票；四單版本加驗收檢驗報告（搜尋摘要，來源多為廠商部落格，C）。
- 找不到準則或標準組織對三單勾稽的定義，三單勾稽屬業界慣例。

### 3.8 參考流程模型（領域 5）

APQC PCF（一手，用 Read 看 PDF 影像）：「APQC's Intro to PCF」2018。https://www.apqc.org/sites/default/files/files/PCF%20Collateral/Intro%20to%20PCF%20-%20FINAL.pdf
- 「The PCF is a hierarchical list of business processes.」
- 「It includes 13 high-level Categories of work」，層級為 Category、Process Group、Process、Activity、Task。
- 「The PCF is not a visual representation of the flow of work」；不是流程圖。
- 例：4.0 Deliver physical products；4.3 Produce/manufacture/deliver product；4.3.1 Schedule production，說明「Scheduling the production of final products.」與「Create and release production orders and lots.」
- 編號用途：識別碼讓名稱不同時仍能做基準比較。
- 未取得：第 3.0 類（行銷與銷售）與訂單到收款、採購到付款在 PCF 的確切編號與名稱。列入 § 五。

SCOR 數位標準前言（一手，用 Read 看 PDF 影像）：https://www.ascm.org/globalassets/ascm_website_assets/docs/intro-and-front-matter-scor-digital-standard.pdf
- 「organized around the six primary management processes of Plan, Source, Make, Deliver, Return and Enable」（p.iv）。
- 「SCOR spans all customer interactions from order entry through paid invoice」（p.v）。同頁：不涵蓋銷售行銷、產品開發、研發。
- 「this model describes processes, not functions」（p.vi）。
- 第 2 層含 Make-to-Stock、Make-to-Order、Engineer-to-Order；第 3 層是「process steps that are performed in a certain sequence」（p.ix）。
- 「SCOR does not attempt to prescribe how an organization should conduct its business」（p.v）。
- 績效屬性五項：Reliability、Responsiveness、Agility、Costs、Asset Management（p.vii）。
- 計畫到生產：SCOR 的 Plan 與 Make 對應，但原文並未使用「plan-to-produce」一詞；該詞只出現於 SAP 等廠商語彙，未查證出處。

### 3.9 狀態機與單據流通則（領域 6）

只列有來源者：
- 交易狀態機：ISO/IEC 15944-4:2015 公開摘要，見 3.5。
- 沖銷而非刪除：Intacct 說明頁（廠商文件，C，摘要工具）：「The transaction is not zeroed out so there's an audit trail.」https://www.intacct.com/ia/docs/en_US/help_action/Intacct_basics/Data_entry/reverse-a-transaction.htm 搜尋結果另有多家會計軟體說明同方向，均為廠商，不是標準。
- 主檔與交易檔分離：只有 APICS 字典對 ERP 的定義句（見 3.3，A 級）把「master file records」與「transactional data」並列。資料管理標準（DAMA-DMBOK 等）未查。
- 稽核軌跡的法規依據（SOX 等）：搜尋未取得具體條文，未查證。

### 3.10 印刷業（領域 7）

CIP4 XJDF 一手論文：Rainer Prosi（CIP4 技術官員）〈XJDF – The Evolution of JDF〉，TAGA 2015 Proceedings，用 Read 看 PDF 影像，下列為原文。https://library-files.taga.org/2015-proceedings/T20150028.pdf
- 摘要：「JDF is the de facto standard for job tickets in a commercial printing environment.」
- p.29：「JDF represents a complete job ticket including process dependencies.」
- p.28：JDF 設計為整張工作單的數位表示，缺點是檔案含「data that may be irrelevant to the recipient」。
- p.31：「there is a clear difference between consumption and production of resources」；數量可因損耗而不同。
- p.33 改單：改頁數或尺寸「typically invalidates the chosen production method」；XJDF「allows job changes by making all attributes optional」。
- p.33 合版：「multiple products are produced in one step」，XJDF「separates the concepts of product and process completely」。
- p.29：MIS 與工作流程處理器使「complete description of the entire job in one file」需求降低。
CIP4 詞彙表（B，摘要工具）：「Each XJDF ticket specifies a single transaction between two parties.」https://www.cip4.org/glossary/XJDF
CIP4 設計準則頁與演進頁未取得內文，只有搜尋摘要。

印刷業 MIS 的公認模型：CIP4 的 MIS ICS 定義 MIS 與生產設備之間的互通需求（搜尋摘要，C，未逐字核對），涵蓋印前、印刷、印後，版本到 1.8，含 L1、L2、L3 三個符合等級。https://cip4.atlassian.net/wiki/spaces/PUB/pages/1196097802/Management+Information+System+ICS 頁面內文沒取得。MIS 的資料模型、成本與估價模型沒有找到公認標準。

---

## 四、對接單生產型印刷廠最關鍵的原則排序與理由

排序依據：違反後造成的錯誤難以事後修復，且來源可靠度高。先列來源等級高者。

1. P06、P09（閉環、產能約束）。接單生產沒有成品庫存緩衝，交期承諾全靠排程可信。CPIM 一手文件直接支持。
2. P03（作業定義與作業實例分離）、P26 至 P28（印刷業工作單模型）。多工序、合版、改單是印刷業日常，TAGA 一手論文直接點出 JDF 在這三處的設計缺陷。
3. P12、P13（REA 對偶與多事件對偶）。外發與場內轉交會造成「資源離開 A、進入 B」的成對事件。來源只到論文與公開摘要，一手原文未讀，採用時要先補讀。
4. P16、P18（職能分工、三單勾稽）。外發與採購涉及付款，分工是通用內控。標準級來源薄弱，只有 ISACA 與州審計長文件。
5. P24（沖銷而非刪除）。印刷業改單頻繁，不可回溯會使成本與庫存帳失真。來源只有廠商文件，屬業界慣例，不是標準。
6. P04、P01（有限產能、層級邊界）。ISA-95 一手支持，且與使用者已採用的 ISA-95 至第 2 層一致。
7. P20、P21（流程不等於職能、階層編號）。SCOR 與 PCF 一手支持，用於流程盤點與命名，不直接影響交易正確性。
8. P10、P11（限制理論、拉式與推式）。只有百科級來源，需補讀一手文獻才能當檢核項。

---

## 五、未查證與存疑項

| 項目 | 狀況 |
|------|------|
| ISA-95 Part 3 的生產、維護、品質作業管理活動模型與資訊物件細節 | 標準全文付費，只讀到前言、範圍、術語三頁。IEC 62264-3:2016 目次只有搜尋摘要。未查證 |
| ISA-95 Part 2 物件模型（人員、設備、物料、製程段、工單）原文 | 未讀 |
| MESA-11 一手文件（MESA White Paper #6） | 未取得。11 項名稱只來自搜尋摘要拼合，各家用詞略有不同 |
| McCarthy 1982 原文 | 未讀。只讀到百科引用資訊與論文描述 |
| ISO/IEC 15944-4:2015 全文，以及其是否明文規定「對偶性」 | 只有公開摘要。未查證 |
| REA 對偶是否要求價值相等 | 搜尋摘要指原模型未設價值限制，並有「平衡對偶」主張。學術上有爭議，來源為二手，未核對原文 |
| 「存量與流量」（stockflow） | 百科頁未出現此詞。只在 Hruby 論文的摘要工具回傳中看到相關描述 |
| 雙式簿記不變量的準則級來源 | 只有百科 |
| COSO 2013 原則 10、11、12 與「職能分工」關注點原文 | 官網 PDF 與 AAA 頁面無法取得內文。只有二手引述，未查證 |
| 職能分工是三項還是四項（含對帳） | 來源並存，無統一權威定義 |
| 三單勾稽的準則出處 | 找不到。只有教學與廠商文章 |
| APQC PCF 中「訂單到收款」「採購到付款」的編號與名稱 | 未取得。簡介 PDF 只給 4.0、4.3 範例，且為 2018 年資料 |
| 「plan-to-produce」是否為 SCOR 或 APQC 的正式名稱 | 未查證。SCOR 一手文件用 Plan、Make，沒有此詞 |
| SCOR 數位標準與 SCOR 12 版流程數量差異 | 搜尋結果互相矛盾：維基與 Coursera 稱數位標準改為七個或新增 Orchestrate、Order、Transform、Fulfill 等，ASCM 前言仍寫六大流程。本檔採 ASCM 前言，但前言頁碼對應的是較早版本文字，未確認現行標準 |
| ASCM 對拉式、推式、限制理論的官方定義 | 未取得，只有百科 |
| 林則孟課程講數 | 課程頁列 12 講。專案另有「34 講」的紀錄，兩者差異來源未釐清（可能是不同版本或影片切分），本檔未查 |
| 沖銷與稽核軌跡的標準或法規依據 | 只有會計軟體廠商文件，找不到公認標準。SOX 條文未查 |
| 主檔與交易檔分離的公認標準 | 只有 APICS 字典對 ERP 的描述，資料管理標準未查 |
| 單據生命週期通則的公認來源 | 只有 ISO/IEC 15944-4 摘要提到狀態機，內容未讀 |
| JDF 的流程與資源模型細節、XJDF 現行 2.x 規格 | 只讀 2015 年論文。現行規格與 CIP4 設計準則頁內文未取得 |
| 印刷業 MIS 的公認資料模型（估價、成本、工單） | 只找到 CIP4 MIS ICS 的搜尋摘要，找不到公認模型 |
| 摘要工具引句 | 本檔標「摘要工具」者為 WebFetch 內建小模型回傳，未逐字核對 |
