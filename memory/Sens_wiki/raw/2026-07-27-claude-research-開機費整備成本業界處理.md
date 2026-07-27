---
type: raw
status: ingested
created-at: 2026-07-27
source: claude-research
captured-by: claude-on-task
module:
  - 工作包
  - 計價快照
  - 成本差異
topic-tag:
  - 開機費
  - 整備成本
  - 批量差異
  - 併批分攤
related-vault:
  - "[[計價快照]]"
  - "[[工作包]]"
  - "[[成本差異]]"
raw-source-link: SAP Learning／SAP Help／Microsoft Learn／Odoo 文件／PrintVis 文件／Google Patents 等 16 條，見內文來源清單
ingested-at: 2026-07-27
ingested-to:
  - "[[計價快照]]"
  - "[[工作包]]"
  - "[[成本差異]]"
  - "[[報工紀錄]]"
  - "[[在製品]]"
---

# 開機費（整備成本）在預計與實際兩層的業界處理

> 調研目的：Miles 2026-07-27 就 PT-022（開機費雙記：計價快照凍結 vs 工作包歸集）指示「找一下實務上怎麼做」。調研執行：opus agent，URL 經實際抓取或搜尋驗證。

## 原始素材

### 一、SAP PP/CO：計畫成本怎麼算 setup，以及批量差異

SAP 生產訂單在建立或下達時執行初步計價（preliminary costing），做法是把工藝路線（routing）各工序的計畫整備時間、機器時間、人工時間，分別乘上評價變式（valuation variant）指定的作業價格，作業價格來自成本中心與作業類型的費率（KP26 維護），材料端則用 BOM 計畫用量乘材料價格。也就是說，SAP 凍結的是「量結構（quantity structure）× 值結構（value structure）」，setup 成本是「整備工時 × 整備費率」的計算結果，不是主檔上掛一筆固定金額；訂單數量、BOM、routing 或價格異動時可重跑初步計價。

目標成本（target cost）的算法明確區分兩類：隨批量變動的成本按「標準成本估算 ÷ costing lot size × 實際交貨量」換算，不隨批量變動的成本（SAP 直接舉例 setup 與 teardown）直接採用、不按數量縮放。差異計算把差異分為投入面五類（scrap、input price、input quantity、resource usage、remaining input）與產出面四類（mixed price、lot size、output price、remaining），其中批量差異（lot size variance）就是專為此設計，公式為「與批量無關的目標成本 ×（1 − 控制數量 ÷ 計畫數量）」，只在計畫數量與確認（交貨）數量不一致時產生。

對本案的含義：SAP 的答案是「凍量價結構、不凍批量結果」，批量假設與實際不符所產生的固定成本落差，被獨立成一個有名有姓的差異類別，而不是回頭改預計基準。另外 SAP 還有一個更貼近「一次上機多張單」的機制：聯產（joint production），成本先歸集在訂單抬頭，再依分攤結構（apportionment structure）中的當量數（equivalence number，例如 30:30:20:20）分配給各聯產品，分攤結構可依成本要素群組分別設定不同比例。這正是「工作包歸集一次、按占比分回各任務」的標準做法，本案的工作包等同 SAP 的訂單抬頭，生產任務等同聯產品項。

### 二、Dynamics 365 與 Odoo：估算成本與實際成本中的 setup

D365 SCM 的生產訂單成本估算（estimation）依五項輸入計算：訂單數量、生產 BOM 元件、生產路線工序、適用的間接成本、計算日當下有效的成本資料；輸出分為 production cost、route or resource costs（官方明列包含 setup time、run time、overhead）與 material costs。文件明說可以重跑估算作業，讓估算反映更新後的資訊，包括訂單數量變更、BOM 變更、路線變更或成本資料變更。更關鍵的是路線群組（route group）設定：在「Estimation and costing」區塊，Setup time、Run time、Quantity 是三個獨立勾選項，勾了 Setup time 才把整備時間納入成本估算；另一個獨立區塊「Automatic route consumption」的 Setup 勾選項則決定開工或報完工時是否自動消耗整備時間。換言之，D365 在資料模型層就把「估算要不要算 setup」與「實際要不要自動歸集 setup」拆成兩個開關。此外 Standard 公式的 process time = run time ÷ process quantity，setup 時間不除以數量，屬批量無關成本；聯產品情境則用總成本分攤（TCA），先估 cost allocation 百分比，再依實際報完工數量做加權平均重算。

Odoo 的模型比較單薄。工作中心有每小時成本（cost per hour，分 per workcenter 與 per employee 兩欄，前者優先），另有 setup time 與 cleanup time 欄位，定義為「開工前所需時間」與「完工後的拆卸清理時間」，兩者加進工單總時長。製造單成本 = 元件成本 + 各作業成本，作業成本 = 時長 × 費率，官方文件並未把 setup 單獨列成一條成本行，也區分 MO cost（估算，用工作中心上的平均員工費率）與 real cost（實際，用員工個人費率）。Odoo 沒有原生的併批分攤機制。

對本案的含義：兩套系統都不把 setup 當作「掛在訂單上的固定金額」，而是「時間 × 費率」，而且估算可隨數量重算。D365 更直接證明了一件事：估算層納入 setup 與實際層歸集 setup 是可以分離設定的兩件事，這在架構上直接支持方案 A 的雙層分工。Odoo 那種「實際只登一次時間」的模型天然不會重複計，但也因此無法把併單效益顯性化。

### 三、印刷 MIS 與 gang run：make-ready 成本怎麼分

印刷業成本核算的通用底層是預算工時費率（budgeted hourly rate，BHR，或稱 direct manufacturing hourly cost rate），算法是年度直接製造成本 ÷ 年度預算可計費工時，而可計費生產工時的定義本身就包含 make-ready（整備）、running（印製）與 washup（清洗），維修停機不算可計費工時。這代表在印刷業的成本語言裡，開機費就是「整備工時 × 機台費率」，不是主檔上的一筆金額。印刷 MIS 的兩層結構也很標準：PrintVis（建在 Business Central 上的印刷 MIS）的 job costing 模組，官方文件寫明目的是「把實際發生成本登錄到足夠細的程度，以便與估價階段的預測（prognosis）比對」，實際端收三類項目（工時登錄、庫存物料、外購），比對顆粒度由計量單位（Unit of Measure）設定決定。

至於 gang run 併版的分攤基礎，必須誠實說明查證結果：公開來源一致確認「多張單共用一次整備、成本被分散到各單」，但沒有一份公開的權威規範指定唯一分攤基礎。Formax 的定義寫得最直接：gang run 又稱 combination run，指多張訂單在同一次上機印製，「press set-up 與紙張損耗這類生產成本被分散到多張訂單，而不是只算在一張上」。Wikipedia 的 gang run 條目同樣寫「多張訂單共享包含製版與整備印機在內的 setup cost」，並以 28×40 吋大版可容納 9 個 4×6 明信片版位為例說明版面切分，但不談分攤公式。可查到的最接近分攤基礎的一手文獻是專利：Xerox 的 US7812997「Job ganging via automatic proportional concatenation」明確以數量比決定各訂單在版面上占幾個版位，原文為「數量為另一張兩倍的訂單，應占兩倍的版位數」；Vistaprint 的 US7542155「Preparation of aggregate jobs for production」描述把 143 張名片訂單拼成一個大版同時生產，材料與生產成本因此在整個 gang 內共享，但同樣沒有給分攤公式。Metrix 這類成本驅動拼版工具則是用機台成本資料反過來決定拼版與選機。

對本案的含義：實務上分攤基礎是「各單在版面上的占比」，而占版比又由數量與成品面積共同決定（數量高的單占多個版位），所以「按占版面積或版位數分攤」與「按數量比分攤」在併版情境下高度重疊，前者更精確。既然沒有公開統一標準，分攤基礎應設計成主檔可設參數（占版面積比 / 版位數比 / 數量比 / 平均分攤），而且印刷、裁切、裝訂等不同工序的合理基礎可能不同。

### 四、標準成本會計原則：setup 屬批次層成本

Cooper 與 Kaplan 1991 年提出的成本層級（cost hierarchy）把成本分為單位層、批次層、產品層、廠務層四級，機台整備（machine setups）與品質檢驗是批次層活動的標準例子，定義為「由批次數驅動，而非批內單位數驅動；一個批次可以是 5 個單位也可以是 10,000 個單位，成本由批次數決定」。標準成本制的做法是用一個標準批量假設，把批次層成本攤成單位成本，實際批量結構與假設不符時，差額進差異科目，SAP 的 lot size variance 就是這條原則的系統實作。ABC 情境下的差異分析結構也一樣：支出差異 = 實際成本 −（實際作業量 × 標準費率），效率差異 =（實際作業量 − 標準作業量）× 標準費率，費率鎖住、作業量差異顯性化。

對本案的含義：這條原則明確支持方案 A 的形狀，也就是「預計用標準批量假設（單獨上機、整備一次）、實際依真實發生歸集、差額進差異」。但要同時記住 ABC 對標準成本的原始批評：用單位數去攤批次層成本本來就有系統性偏誤，所以差異出來時必須能被讀成「批量結構效益」，而不是被誤讀成「估價估不準」。落到規格上，就是差異項要帶原因碼，把併批造成的差異與報價估錯造成的差異分開列示。

### 方案 A 對 B 的實務對照結論

建議採方案 A，但要修正一個關鍵細節：快照凍結的內容不是「開機費金額」，而是「整備標準工時 + 機台整備費率 + 批量假設（本工單單獨上機、整備一次）」這組參數；預計金額只是這組參數的計算結果，是衍生顯示值，不是比對基準的本體。這樣定義之後，重複計問題在定義上就消失了，因為預計成本與實際成本本來就是兩本獨立的帳，實際帳只認工作包分攤下來的那一份，預計帳從不進實際帳。

方案 A 的四方佐證都齊：SAP 的初步計價凍量價結構加 lot size variance；D365 把「估算納入 setup」與「實際自動消耗 setup」設成兩個獨立開關，且估算可依數量重算，聯產品用 TCA 事前估比例事後依實際數量重算；印刷業 BHR 把整備視為可計費工時乘費率；ABC 把整備歸為批次層成本。差異呈現上，「各單預計獨立整備成本合計 − 實際整備成本一次」就是併單效益，這個數字有直接的管理價值（衡量生管併批決策的貢獻），而且它就是 lot size variance 的印刷業版本。

方案 B 的三個實務問題：第一，工單建立到工作包成立之間，工單沒有完整的預計成本，報價毛利與生產成本無法即時比對，違反「訂單建立即應有完整計畫成本」的通則（SAP 與 D365 都在訂單建立時就產生完整估算）。第二，若最後沒有併批，仍要補一次預計成本，等於把預計成本的產生時點綁在排程決策上，而補算時用的是補算當下的費率，主檔改價污染快照的原始風險反而從後門回來了。第三，預計基準本身就是併批後的結果，併單效益永遠等於零，管理上看不到生管併批做得好不好。

方案 B 唯一站得住的殘留情境是：如果開機費在商業上是「按次向客戶收取的收費項目」而不是成本項目，那它屬於計價層而非成本層，兩者要分開處理，那是另一個題目，不應與成本快照混為一談。

實作方向（規格層，不涉程式）：快照存費率參數與驅動因子（整備標準工時、機台整備費率、色數與版數等），並存快照時點的計算結果僅供顯示；工作包成立時，實際整備成本 = 實際整備工時 × 機台費率，比照 SAP 分攤結構的當量數概念，依主檔可設的分攤基礎（占版面積比為預設，備選版位數比、數量比、平均分攤）分攤到各生產任務；成本差異報表獨立列一行「併批整備效益」，原因碼標批量結構，與價格差異、用量差異分開。

### 來源清單

第一題（SAP）
1. Performing Variance Calculation, SAP Learning https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/performing-variance-calculation
2. Performing Preliminary Costing for Production Orders, SAP Learning https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/performing-preliminary-costing-for-production-orders
3. Calculation of Target Costs, SAP Help Portal https://help.sap.com/docs/SAP_ERP/6fe2dad9dab7486fb4469d13552824f2/ebd0d7531a4d414de10000000a174cb4-330.html （動態載入頁，內容以搜尋摘要與 SAP Learning 交叉佐證）
4. Joint Production, SAP Help Portal https://help.sap.com/docs/SAP_S4HANA_CLOUD/4032610758dc437089f0c28320eec93f/753b77a7bb224b5dac3c80ebc0f57b13.html （同上）

第二題（D365 與 Odoo）
5. Production order cost estimation, Microsoft Learn https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/production-order-cost-estimation
6. Create route groups, Microsoft Learn（AX 2012 封存版，設定語意沿用至 D365）https://learn.microsoft.com/en-us/previous-versions/dynamicsax-2012/appuser-itpro/create-route-groups
7. Total cost allocation method, Microsoft Learn https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/methodology-total-cost-allocation
8. Work centers, Odoo 18 https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html
9. Manufacturing order costs, Odoo 18 https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/mo_costs.html

第三題（印刷 MIS 與 gang run）
10. Direct Manufacturing Hourly Cost Rates for Printing Equipment, Profectus https://profectus.com/resources/articles/Article-Direct-Manufacturing-Rates.asp
11. Job Costing, PrintVis Documentation https://learn.printvis.com/Legacy/JobCosting/JobCosting/
12. Printing Lingo: What is a Gang Run or Combination Run, Formax Printing https://www.formaxprinting.com/blog/printing-lingo-what-is-a-gang-run-or-combination-run
13. Gang run printing, Wikipedia https://en.wikipedia.org/wiki/Gang_run_printing
14. US7812997B2, Job ganging via automatic proportional concatenation, Xerox https://patents.google.com/patent/US7812997B2/en
15. US7542155B2, Preparation of aggregate jobs for production, Vistaprint https://patents.google.com/patent/US7542155B2/en

第四題（標準成本與 ABC）
16. Variations of Activity-Based Costing, Business LibreTexts https://biz.libretexts.org/Bookshelves/Accounting/Managerial_Accounting/03%3A_How_Does_an_Organization_Use_Activity-Based_Costing_to_Allocate_Overhead_Costs/3.08%3A_Variations_of_Activity-Based_Costing_(ABC)
17. Using Variance Analysis with Activity-Based Costing, Saylor Managerial Accounting 10.7 https://saylordotorg.github.io/text_managerial-accounting/s14-07-using-variance-analysis-with-a.html

驗證狀態：每條連結皆經實際抓取或搜尋結果驗證存在；兩條 SAP Help 頁為動態載入、以交叉來源佐證；gang run 分攤基礎屬業界慣例歸納（公開來源只確立「共享並分攤」、無統一權威規範），已如實標明。

## 第一輪初步分析（Claude 寫）

- 觀察：四方來源一致指向「凍參數不凍金額、實際單一發生點、批量落差獨立成差異科目」；工作包＝SAP 聯產訂單抬頭的對映清楚，直接支撐既有「工作包＝一次上機＝開機費歸集單元」架構裁決。
- 候選相關卡：[[計價快照]] / [[工作包]] / [[成本差異]] / [[報工紀錄]] / [[在製品]]
- 候選 OQ 候補：無（PT-022 已於 2026-07-27 拍板）
- 候選升級路徑：business-logic（已依 Miles 2026-07-27 拍板即時精練，見下）

## 待精練（Mode B 處理）

- [x] 已更新既有 vault 卡（見精練去處）
- [x] 是否升級為 OQ（否，PT-022 反向結案）
- [ ] 是否累積成 insight（單張，不適用）

## 精練去處（Mode B 完成後填）

- [[計價快照]] — 開機費改凍參數組、預計為衍生顯示、與工作包分工聲明
- [[工作包]] — 實際開機費唯一發生點、分攤基礎主檔可設參數、報工歸集口徑
- [[成本差異]] — 新增「併批整備效益」差異維度（帶原因碼）
- [[報工紀錄]] — 補「所屬工作包」欄位與歸集口徑
- [[在製品]] — 估值層級校正為生產任務層快照
- [[PT-022-開機費與工作包歸集口徑]] — 決議封存
