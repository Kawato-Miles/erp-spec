---
type: raw
status: raw
created-at: 2026-10-29
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - SAP
  - S4HANA
  - 導入方法
  - 覆蓋對照
  - 邊界釐清
  - MES
  - 生產段
related-vault:
  - "[[訂單]]"
  - "[[印件]]"
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[品項主檔]]"
  - "[[工序主檔]]"
  - "[[設備]]"
  - "[[部件配方]]"
  - "[[印件配方]]"
  - "[[報工紀錄]]"
  - "[[品檢紀錄]]"
  - "[[成本計算規則]]"
  - "[[EC 商品管理]]"
  - "[[ERP與MES建置專案]]"
  - "[[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]"
raw-source-link: https://learning.sap.com/courses/exploring-production-planning-in-sap-s-4hana/outlining-make-to-order-production
---

# SAP 承接印刷業務範圍的覆蓋與導入方法

> 摘錄重點，非全文轉錄。撰寫者為四個 Sonnet 研究代理（2026-10-29；分組：非生產範圍、生產物件、導入方法、最佳實踐與行業方案），主對話以 WebFetch 抽查 16 條來源（來源 1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16），全部相符。一處更正：代理稱來源 3「反對固定順序」，原文只反對依物件類型逐一排序，仍要求依相依關係排序，本卡已照原文改寫。related-vault 由主對話核對卡名存在後補齊。

## 研究範圍與方法

委託方問題：一家印刷公司只用 SAP 的解決方案（S/4HANA 各模組加 SAP Commerce Cloud），導入顧問會怎麼做商業分析與設計。七個業務範圍各用什麼承接、承接到什麼程度。生產段的最佳實踐是什麼。

方法：用 WebSearch 找來源，再用 WebFetch 逐頁開啟確認。只列開得起來、內容與敘述相符的頁面。開不起來的頁面記在「查無公開資料」。

五項限制：

- help.sap.com 新版（S/4HANA 現行版說明）頁面幾乎全部只回頁面標題，本文讀不到。現行版證據因此主要來自 learning.sap.com 課程頁。
- 開得起來的 help.sap.com 頁多為舊版：R/3 4.6C（網址 saphelp_46c）、4.7（saphelp_470）、ERP 6.0 時期（saphelp_me60）、700_SFIN3E、SCM 7.0 EHP1。舊版來源在句中標「舊版」。
- sap.com 產品頁、community.sap.com、blogs.sap.com 多數回 403。
- 多數頁面沒有標發布日期。
- 找不到 SAP 印刷業專屬的官方方案，也找不到官方的按單生產範圍項目（scope item）代碼表。

標記規則：每個結論句後標（來源 N）。標「推論」的句子是本卡作者的判斷，不是來源原文。「查無」指本卡沒有開到來源，不代表 SAP 沒有這項功能。

## 一、覆蓋對照

名詞說明：S/4HANA 有 Public Edition、Private Edition、on-premise 三個版本，後一版包含前一版較受限版本的延伸選項（來源 17）。RISE with SAP 綁 Private Edition，GROW with SAP 以 Public Edition 為核心（來源 18，第三方）。

「承接程度」指 SAP 有沒有原生的物件與流程：完整＝有物件也有流程；部分＝只有一段；SAP 無此場景＝本卡開過的官方頁查無，不是逐項否證；查無＝本卡沒開到來源。

### 七範圍總表

| 委託方範圍 | SAP 承接產品 | 承接程度 | 核心物件 |
|-----------|-------------|---------|---------|
| 1a 線下業務接單（需求單、報價、成交轉訂單） | S/4HANA Sales（SD）的詢價單與報價單；SAP Sales Cloud 的 Quotation Management；SAP CPQ | 完整（報價、轉訂單、定價）。CPQ 與 BOM、工序的對應查無 | 詢價單（Inquiry）、報價單（Quotation）、銷售訂單（Sales Order）（來源 19）；定價流程（Pricing procedure）、條件類型（Condition type）（來源 20）；CPQ 的設定器（Configurator）與折扣核准（來源 21） |
| 1b 線上電商（規格品，選項綁識別碼） | SAP Commerce Cloud；S/4HANA 的可配置物料（Variant Configuration，簡稱 VC） | 部分。Commerce Cloud 與 S/4HANA 的整合課程只涵蓋商品主資料複寫與訂單送出（來源 16、22）。選項決定 BOM 與工序由 VC 承接（來源 13） | 特性（Characteristic）、類別（Class）、相依性（Object dependency）、超級 BOM（Super BOM）、配置設定檔（Configuration profile）（來源 23、24、13） |
| 1c 諮詢服務 | 未找到對應場景 | 查無。S/4HANA Service 列技術服務（Technical Service）與商業服務（Commercial Service），未提付費諮詢（來源 25）。開票請求可合併一次性、週期性、用量計費，同樣未提付費諮詢（來源 26） | 無 |
| 2a 訂單、印件 | S/4HANA Sales | 完整（訂單、明細、可用量檢查、配額）。「訂單明細同時是產品定義」見四 | 銷售訂單、產品配額（Product Allocation）（來源 27、28，舊版）；可配置物料在銷售訂單內配置（來源 29，舊版） |
| 2b 稿件審稿、打樣 | SAP 無此場景 | 無。官方頁查無審稿與打樣。第三方 delaware 的印刷包裝方案頁也未提 proof 功能（來源 30） | 無 |
| 3 生產 | S/4HANA 生產規劃（PP）、物料主檔、工作中心、生產訂單 | 完整，詳見細表 | 物料主檔、BOM、Routing、Work Center、生產訂單（Production Order） |
| 4 成本 | S/4HANA 成本管理（CO）的產品成本 | 完整，詳見細表 | 成本估算（Cost Estimate）、訂單結算（Settlement）、差異（Variance）（來源 31、32） |
| 5 品檢與入庫 | S/4HANA 品質管理（QM）、庫存管理 | 完整（檢驗批、使用決策、品檢庫存）。證據多為舊版 | 檢驗批（Inspection lot）、使用決策（Usage decision）、品檢庫存（Inspection stock）（來源 33、34） |
| 6a 出貨、物流、送達 | S/4HANA Sales 的出貨交貨（Outbound Delivery） | 完整（出貨文件、揀貨、過帳發料、觸發開票）。運輸管理（Transportation Management）查無專頁 | 出貨交貨、揀貨（Picking）、過帳發料（Post goods issue）（來源 35） |
| 6b 售後服務單 | S/4HANA Sales 的退貨；S/4HANA Service 的廠內維修 | 部分。有退貨單、退貨交貨、貸項單、免費後續交貨（來源 14）。有廠內維修單（來源 36、37）。保固查無 | 退貨單（Return order）、退貨交貨（Returns delivery）、維修單（Repair order） |
| 6c 補做 | SAP 無此場景 | 無。本卡查無「售後觸發重新生產」頁。退貨流程只到貸項單或免費後續交貨（來源 14） | 無 |
| 7 帳務（收款、發票、對帳、退款） | S/4HANA Sales 的開票；S/4HANA Finance | 完整（國際通用流程）。台灣統一發票只有知識庫文章預覽的證據 | 開票單（Billing document）、會計文件、預付款請求（Down payment request）（來源 38、39）；貸項單（來源 14） |

各列的證據：

- 1a：詢價單與報價單可互相參照，兩者不是銷售流程的必要步驟（來源 19）。價格由定價流程列出條件類型，再依存取順序（access sequence）逐表搜尋條件紀錄，找到後複製進銷售單據（來源 20）。Sales Cloud 的報價接受後轉 S/4HANA 訂單，訂單後續變更不回寫報價（來源 40）。SAP CPQ 的設定器依規則避免不相容選項，配置完成後才能加入報價（來源 21、41）。CPQ 的可配置產品頁完全沒出現 BOM（來源 42）。
- 1b：不用 VC 時，每個變體都要獨立的物料主檔、BOM、工序清單、成本與定價紀錄（來源 23）。用 VC 時，一個可配置物料涵蓋所有變體，系統建超級 BOM 與超級 Routing；相依性選出變體所需的 BOM 組件與作業（來源 13，舊版）。變體物料沒有自己的 BOM 或 Routing，須先在銷售訂單配置再估成本（來源 29，舊版）。新版課程頁只說超級 BOM、Routing、相依性各自存在，沒寫選項如何選出工序（來源 23、24）。Commerce 與 S/4HANA 整合課程沒提可配置產品與價格（來源 16、22）。
- 2a：可用量檢查有三種：依庫存與計畫收發量、對產品配額、對計畫（來源 27，舊版）。產品配額依期間為特定客戶或區域分配，避免第一位客戶拿走全部數量（來源 27、28，舊版）。
- 6a：出貨交貨控制揀貨、包裝、運輸規劃、過帳發料，後三項選用。過帳發料更新庫存數量與價值，並產生待開票清單（來源 35）。
- 6b：退貨單參照開票單或銷售訂單建立，須維護退貨原因，系統自動帶入開票鎖定（來源 14）。退貨入庫通常進退貨庫存，不進非限制使用庫存（來源 14）。廠內維修一個維修物件一張維修單，技師確認工時與備件，成本過帳成本管理，之後可計費（來源 36）。
- 7：開票單是財務會計的資料來源，儲存時自動產生會計文件並更新總帳與獲利分析（來源 38）。預付款在訂單以 billing plan 處理，到期日建預付款請求，收款指派到請求，最終發票時轉為待清算（來源 39）。標準系統有台灣電子文件（Taiwan eDocument）流程與統一發票（GUI）單號機制，貸項單缺單號時顯示 EDOCUMENT_TW047，開票過帳須維護營業據點（business place）（來源 15、43，知識庫文章預覽，內文須登入）。SAP 台灣站的 Comarch 夥伴頁沒有台灣統一發票字樣（來源 44）。
- 倉儲：只用庫存管理時依廠（plant）與儲存地點管庫存。倉庫管理（WM）由 Stock Room Management 取代，embedded EWM 自 S/4HANA 1610 起內建，decentralized EWM 是獨立系統（來源 45）。Sales 這條產品線含訂單與合約管理、訂單履行、開票（來源 46）。

### 生產段逐物件細表

| 委託方項目 | SAP 原生物件或流程 | 判定 | 來源 |
|-----------|------------------|------|------|
| 品項主檔（成品、半成品、原物料） | 物料主檔（Material Master，交易碼 MM01）。物料類型 FERT 是成品（自製賣客戶）、HALB 是半成品（自製、通常不賣、當組件）、ROH 是原物料（外購）。物料類型決定可選檢視、價格控制預設、數量與金額更新方式 | 完整。物料類型是否決定可有 BOM，查無 | 12、47 |
| BOM（物料清單） | 物料 BOM，用途（BOM usage）1 是生產、6 是成本估算。同物料可有替代 BOM（alternative）。變更用變更編號（change number）管理有效起日與歷史。庫存項目可倒扣領料 | 完整。用途 2、5 與可配置 BOM 的細節查無 | 48、49（舊版）、50、10 |
| Routing（製程路線） | 每道作業（operation）指定工作中心、計畫時間（準備、機器、人工）與成本活動。工序清單群組與計數器識別替代製法。控制碼（control key）決定作業是否排程、算產能、計成本、確認、外部加工、列印 | 完整 | 48、51（舊版）、52 |
| BOM 與 Routing 的關係 | 兩個獨立物件。以物料指派（material assignment）或生產版本（production version）連到物料。組件分配（component allocation）把 BOM 項目分到 Routing 的作業，每項只能分到一道作業，沒分配的預設到第一道作業。估算成本時生產版本為必要，它定義 Routing、BOM、批量的唯一組合 | 完整 | 10、48 |
| 工序與裝訂主檔 | 作業定義在 Routing 內，預設值（控制碼、標準時間）由工作中心帶入（來源 52、48）。可重用的工序組是參考作業集（reference operation set），本卡只在重工頁看到（來源 11，舊版）。是否另有獨立的工序主檔，本卡未開到來源 | 部分 | 52、48、11 |
| 設備與產線 | 工作中心（Work Center）：隸屬廠（plant），存營運時間、產能、成本公式與成本中心（cost center），用於 Routing、檢驗計畫、生產與維護訂單 | 完整 | 52 |
| 配方（製法範本，用量只作參考） | BOM 與 Routing 合稱數量結構（quantity structure），是成本估算的輸入。BOM 的用量進成本估算，也驅動倒扣領料 | 完整。用量不是參考值，是成本與扣料的正式輸入 | 48、10 |
| 工單與生產任務 | 生產訂單（Production Order）含表頭與作業。計畫訂單（planned order）可集合、個別、部分轉換為生產訂單；緊急工作可手動建單。release 前做可用量檢查與產能評估，release 後才能領料、確認、入庫。狀態有 CRTD、REL、PCNF、CNF、TECO（舊版 4.6C）、DLV（現行版課程）、CLSD（舊版 ERP 6.0） | 完整 | 53、54、55、56、57、58 |
| 派工 | 產能平準（Capacity Scheduling Table）把瓶頸作業派到節拍工作中心（pacemaker work center）。生產主管用 Assign Work 把作業指派給個人或團隊，操作員在 My Work Queue 看到自己的作業。舊版 4.6C 的產能平準規劃表（交易碼 CM21）可自動或手動派工 | 完整 | 59、60、54、61（舊版） |
| 報工 | 確認（Confirmation）：CO15 在表頭層、CO11N 在作業層，一張單只能用一種。數量分良品（yield）、報廢（scrap）、重工（rework）。時間分準備時間與機器、人工時間，數值由 Routing 帶出可改。使用 MES 時，現場在 MES 作業，確認資料經介面自動拋回 S/4HANA。最終確認時倒扣領料並入庫，失敗用 COGI 重處理（舊版 4.6C） | 完整 | 8、62（舊版） |
| 場內轉交與點收 | 良品量是可移到下一個工作中心的數量（來源 8）。獨立的轉交單與點收動作，本卡查無 | 查無 | 8 |
| 外包派單 | 兩種做法。外部加工（external processing）：Routing 設外部作業，生產訂單產生請購單，只描述作業、不含元件，收貨對採購單並指派給生產訂單。外包（subcontracting）：採購項目類別 L，提供的元件以供應商專屬特殊庫存管理，收貨以服務價加所耗元件價值評價 | 完整 | 9、63、64、51（舊版）、65（舊版） |
| 在製品（WIP） | 訂單未達交貨完成（Delivered）或技術完成（TECO）時算 WIP，之後改算差異。WIP 等於已發生實際成本減入庫貸方（舊版）。WIP 到結算時才更新財務 | 完整 | 5、66（舊版）、67 |
| 成本估算 | 標準成本估算（交易碼 CK11N 單筆、CK40N 成本批次）以計畫價評價計畫數量結構，為標準價物料算出標準價。成本組成結構分物料、機器、人工、間接費用。管理費用依成本計算表（costing sheet）套用百分比或數量基礎（舊版） | 完整。現行版的成本計算表說明查無 | 31、68、69（舊版）、70（舊版） |
| 結算與差異 | 結算把訂單成本與入庫價值之差轉財務，訂單餘額歸零。價格控制為標準價時借價差、貸成品庫存變動。現行版課程列輸入價、輸入量、資源用量、輸出價、剩餘五類差異；舊版 4.7 列更多類別，含報廢、混合價、批量差異 | 完整 | 71、32、5、72（舊版） |
| 品檢 | 檢驗批（inspection lot）在生產訂單 release 時自動建，也可在入庫時建（舊版 4.6C）。生產後入庫檢驗（型別 04）自用檢驗計畫（舊版）。使用決策記錄檢驗完成，放行後品檢庫存過帳到非限制使用庫存。品質問題另走品質通知（quality notification），每類問題有專屬通知類型 | 完整。證據多為舊版與第三方 | 33（舊版）、34（舊版）、73（第三方）、74 |
| 完工入庫 | 入庫移動類型 101（交易碼 MB31，舊版 4.6C）。入庫通常在最後一道作業後過帳，增加庫存數量與金額。最終確認時也可同時入庫 | 完整。三種庫存類型的入庫規則查無 | 75（舊版）、55、62（舊版） |
| 重工 | 三種做法：手動插入作業、放入參考作業集、另建獨立重工單（結算時成本轉回原單）。Routing 控制碼有重工指標。重工作業上的報廢，歸給造成重工的那道作業 | 完整（機制）。現行版文件查無，只有舊版 4.7 | 11（舊版）、8 |

補充說明：

- 外部加工與外包不同。外部加工只送出作業，外包由客戶供料給供應商（來源 9）。印刷公司的「外包後印加工」屬哪一種，取決於是否供料給外包商。這是推論，不是來源原文。
- 外包的供料過帳移動類型 541，只確認過帳到供應商持有庫存，不能轉入特殊庫存 E 或 Q（來源 76，知識庫文章預覽）。
- 範圍項目（scope item）代碼在已開頁面只見三個：BMY 外包（來源 9）、BKJ 帶預付款的銷售訂單（來源 39）、3XK 廠內維修（來源 37）。按單生產的範圍項目代碼查無。
- 數量結構的資料不全時，可用多階單項成本估算（multilevel unit costing）補成本（來源 68）。

## 二、導入顧問的商業分析與設計方法

先說明證據範圍。SAP Activate 的官方資料來自 learning.sap.com 課程頁。其中兩頁屬 Ariba 產品課程，不是 S/4HANA 專屬（來源 77、78），表中已標明。SAP Signavio 的流程分層、官方主資料載入順序、資料清理指引查無。第三方來源已標明。

### 顧問走的步驟

| 階段與步驟 | 顧問做什麼 | 設計決策 | 來源 |
|-----------|-----------|---------|------|
| 方法骨架 | Prepare、Explore、Realize、Deploy 是四個核心階段，Discover 與 Run 在核心之外。每階段後有品質關卡（Quality Gate）。Realize 依 backlog 優先序以 sprint 迭代，客戶主導優先序與驗收 | 階段出口的把關 | 79、77（Ariba）、80 |
| Discover | 建商業案例。交付物含創新策略與路線圖、價值與影響分析、導入策略、技術架構需求 | 做不做、範圍多大 | 79、80 |
| Prepare：定範圍 | 審數位探索評估（Digital Discovery Assessment，簡稱 DDA）定範圍，收商業設定問卷答案。每個流程找 2 到 4 位代表使用者角色的客戶專家，每場工作坊合併 1 到 3 個相關流程 | 哪些流程進工作坊、誰代表 | 81（德文） |
| Prepare：備標準內容 | 從 Process Navigator 取範圍項目的流程圖、測試腳本、設定說明。測試腳本事先在 Starter System 預跑 | 以哪個標準流程當基準 | 82、81、2 |
| Explore：Fit-to-Standard 工作坊 | 顧問依測試腳本展示標準流程，客戶逐項評為符合或有差異，需求記入 SAP Cloud ALM。作法是小幅調整標準，不是重建，只追求關鍵需求 | 標準夠不夠用 | 83、81 |
| Explore：差異進 backlog | 差異經 Product Owner 驗證後以 User Story 進 Product Backlog，排序後只有最高優先項進 Design workshop。精簡流程文件，不寫大型設計文件 | 哪些差異做、哪些延後 | 83、80 |
| Explore：組織結構 | 定義 client、company code、plant、storage location。一個 plant 屬於一個 company code，plant 在 Public Edition 同時是評價範圍 | plant 怎麼切（影響補貨前置時間與 MRP 方法） | 84 |
| Explore：延伸方式 | 對每個差異判斷用 key user、developer 或 SAP BTP 上的 side-by-side 延伸。Clean core 等級 A 到 D 由延伸使用的最低階技術決定。原則：零修改、只用 released API | 延伸放哪、等級多高 | 85、86、87、17 |
| Explore：角色與授權 | 從測試腳本找每個流程所需的 business role 與 catalog。不直接改 SAP 標準角色，要複製或用範本建立 | 角色如何組合 | 88 |
| Explore：資料需求 | 取得資料蒐集範本，與 Deployment Lead 檢視可行性。決定遷移哪些物件 | 遷移範圍 | 89、78（Ariba） |
| Explore：主資料治理 | 決定是否導入主資料治理（Master Data Governance，簡稱 MDG）。集中治理以變更請求為基礎並含核准。聯邦式把共通屬性交 Core Data Owner，應用專屬片段交 Application Data Owner | 集中或聯邦；重複資料的保留規則 | 90、91 |
| Explore：階段出口 | 設計規格與流程設計規格簽核，通過品質關卡 | 進 Realize 前凍結哪些設計 | 78（Ariba）、80、2 |
| Realize：啟用與設定 | 在 SAP Central Business Configuration 啟用範圍內容並填入問卷值 | 設定值的最終取值 | 81（德文） |
| Realize：資料遷移 | 用 S/4HANA Migration Cockpit：建專案、選物件、填範本、上傳、處理 mapping、模擬、遷移。每個物件有暫存表。先遷移前置物件。mapping 分來源值對目標值與目標欄位預設值 | 前置物件順序、mapping 規則 | 89 |
| Realize：遷移驗證（第三方） | 物料的行為取決於工廠、單位、MRP、採購、評價等設定。BOM 的「有效」狀態未必反映現行生產。work center 要先定目標資源模型再把舊資料對應過去。生產版本連結物料、工廠、BOM、Routing，驗證它才知製造結構可用。載入百分比說明不了可運作性，建議用端到端情境驗證 | 遷移範圍與驗收方式 | 3（第三方） |
| Realize：測試與驗收 | 客戶專家依原工作坊腳本做使用者驗收測試並正式簽收 | 驗收由誰簽 | 81（德文） |
| Deploy 與 Run | 移轉到正式環境、執行變更管理、上線與上線後支援。Run 是持續營運 | 上線就緒判斷 | 79、77（Ariba） |
| 製造業範例：按單生產 | 以銷售訂單為驅動，設策略與個別、集合指標，規劃執行後轉生產訂單。成品選純按單（策略 20）或不含最終組裝的規劃（策略 50） | 需求獨立管理或併入淨需求 | 1 |
| 版本差異 | GROW（Public）按季自動更新並遵循嚴格的 fit-to-standard；Private 的延伸盡可能做到最高 clean core 等級；只有 on-premise 才有 classic extensibility。系統轉換專案先測舊流程再找改善 | 選哪個版本與延伸邊界 | 18（第三方）、86、17、92 |

### 流程模型與標準內容

- Best Practices 是預先設定的標準內容，含設定指南、測試腳本、流程圖、主資料指南、範例資料，經 SAP Signavio Process Navigator 取得，用途含端到端基準情境與及早找出流程差異（來源 82）。
- Process Navigator 的方案包分四層：範圍項目群組、業務領域、範圍項目、建置區塊（來源 2）。Roadmap Viewer 的層級是階段、交付物、任務、加速器（來源 80、2）。
- SAP Signavio Process Explorer 是參考內容儲存庫，含 S/4HANA best practices、標準公司流程描述、能力地圖、方案地圖。SAP 流程模型可帶入自己的工作區，與目前流程績效比較（來源 93）。
- 第三方資料稱 Process Explorer 含 7,000 個流程模型、20 個業務領域能力地圖、13 個以上產業加速器（來源 94）。Process Navigator 的參考流程可用來比對自家流程，找差異與冗餘步驟（來源 95）。
- SAP Signavio 的 Process Manager 供流程擁有者維護流程模型，Process Intelligence 以流程探勘看實際執行，Process Insights 持續監控（來源 96，第三方）。第三方頁面全文沒用 as-is、to-be 字樣。

### 商業分析的重點問題

顧問在製造業導入時，上述來源顯示會先處理下列問題：

- 範圍：哪些流程進工作坊，誰代表使用者角色（來源 81）。
- 差異：標準流程哪裡不夠，哪些差異值得做，每個差異都增加日後升級維護成本（來源 81、83）。
- 組織：plant 怎麼切，影響前置時間與 MRP 方法（來源 84）。
- 延伸：差異用哪種延伸承接，等級多高（來源 86、87）。
- 資料：遷移範圍依業務規則與相依關係決定，不是單純篩選（來源 3，第三方）。
- 生產模式：按單生產用策略 20，部分預先生產用策略 50（來源 1）。

## 三、生產段最佳實踐

### 按單生產的規劃策略

| 策略 | SAP 的做法 | 需求類型 | 來源 |
|------|-----------|---------|------|
| 20 純按單生產 | 銷售訂單是驅動元素，採購與生產由它觸發。成品不能用計畫獨立需求，不規劃組件與組裝件。策略設在成品的 MRP 3 視圖 | KE | 1、97（舊版） |
| 25 可配置物料按單 | 與策略 20 相似，用於母產品不需要或無法規劃的情況。適用可配置物料，必須配置。銷售訂單輸入變體與配置，銷售後才生產（舊版 4.6C） | KEK | 98（舊版）、97（舊版）、99 |
| 50 不含最終組裝的規劃 | 組裝件可在收到銷售訂單前預先生產，成品的最終組裝等銷售訂單才觸發。成品有計畫獨立需求 | VSE 加 KEV | 1、97（舊版） |
| 54 規劃變體 | 可配置成品用規劃變體，銷售訂單以型別比對（type matching）消耗計畫獨立需求，組件可預先生產 | 未列 | 100 |

補充：

- 個別與集合指標決定需求怎麼處理。指標 1 為每個需求各建獨立區段，指標 2 把需求併入淨需求區段。成品留空且為按單生產時，系統改成 1（來源 1）。
- 需求類型由策略決定，頁面建議使用標準策略（來源 97，舊版）。需求類型依物料主檔的 MRP 群組與策略群組決定，按單項目須指定廠（來源 101，舊版）。
- 策略 20 的範例流程：銷售訂單、MRP 產生計畫訂單、轉生產訂單、釋放、入庫。收貨後以客戶專屬庫存區段顯示銷售訂單庫存，沒有銷售訂單就不生產（來源 102，舊版）。
- 策略 26 只在需求類型表中出現，說明頁查無（來源 97）。策略 82 查無。

### 選項如何轉成 BOM 與工序（可配置物料）

- 可配置物料用超級 BOM 與超級 Routing 涵蓋所有變體。相依性從中選出該配置所需的 BOM 組件與作業，同一組相依性也禁止不合理的特性組合（來源 13，舊版）。
- 選擇條件可建在 BOM 項目上，也可獨立建立後指派。Routing 的作業與生產資源工具同樣靠選擇條件選出（來源 103）。
- 可配置物料的 Routing 稱超級作業清單。程序（procedure）可修改作業欄位，例如標準值（來源 104，舊版）。
- 客戶選特性，系統用相依性防止不允許的組合，售價依選定特性計算（來源 99）。
- 配置在銷售訂單內進行，成本估算在配置之後（來源 29，舊版）。

### 成本的標準流程

| 步驟 | SAP 的做法 | 來源 |
|------|-----------|------|
| 計畫成本 | 依 BOM 與 Routing 的數量結構估算。單一物料建估算，多個物料用成本批次。組件成本逐層向上累加，Routing 的活動成本含固定與變動（舊版 ERP 6.0） | 68、48、69 |
| 間接費用 | 成本計算表把管理費用率指派給產品，可用百分比或數量基礎，計算基礎只能選一種（舊版 ERP 6.0） | 70 |
| 成本物件 | 一般生產以生產訂單為成本物件。複雜按單情境建議以銷售訂單項目為成本物件（Product Cost by Sales Order），看計畫與實際成本、收入。舊版 4.6C 的成本與收入帳戶指派也在銷售訂單項目層級 | 4、105（舊版） |
| 實際成本 | 確認時內部作業成本計入訂單。評價的銷售訂單庫存在耗用物料時才產生成本，收貨本身不產生銷售訂單成本 | 8、4 |
| 期末 | 未達交貨完成或技術完成算 WIP，之後算差異。差異只出現在生產訂單層級，不用於銷售訂單項目 | 5 |
| 差異 | 差異等於借記訂單的實際成本減入庫貸方金額。結算類型完整（FUL）要使用者先設交貨狀態才算差異；週期（PER）無聯產品時用目標成本算差異與 WIP。舊版 4.6C：週期結算的差異等於目標成本減管制成本 | 58、106（舊版） |
| 結算 | 結算把訂單成本與入庫價值之差轉財務。標準價物料借價差、貸成品庫存變動；移動平均價物料借庫存、貸庫存變動。可用價差拆分設定檔把差異類別對應到總帳科目 | 71、32 |
| 到獲利分析 | 只有依目標成本版本 0 算的差異可結算到成本基礎獲利分析（CO-PA） | 32 |

### 品檢與入庫的標準流程

| 步驟 | SAP 的做法 | 來源 |
|------|-----------|------|
| 建檢驗批 | 生產訂單 release 時自動建，也可在入庫時建（舊版 4.6C）。生產後入庫檢驗（型別 04）在入庫時自動建，每個入庫明細各一張（第三方） | 33、34、73 |
| 檢驗計畫 | 型別 04 不用製造配方的檢驗特性，用自己的檢驗計畫或物料規格（舊版 4.6C）。型別 03 在生產中檢驗，結果在生產期間輸入 | 34 |
| 記錄結果 | 檢驗活動與結果在確認作業時記錄，檢驗點依作業規劃（舊版 4.6C） | 33 |
| 使用決策 | 使用決策記錄檢驗完成。生產檢驗可依檢驗點做部分批的使用決策（舊版 4.6C） | 33 |
| 庫存過帳 | 入庫無缺陷時進非限制使用庫存，也可先進品檢庫存。品管放行時，系統自動把品檢庫存過帳到非限制使用庫存（舊版 4.6C）。第三方資料稱接受路徑用移動類型 321 | 33、34、73 |
| 品質通知 | 每類問題有專屬通知類型。處理時記缺陷與矯正任務，有未完成任務不能關閉，結案前記根本原因 | 74 |

### 行業套件

- SAP 印刷業專屬的官方方案：查無。找過的搜尋詞與頁面見「查無公開資料」。
- SAP 官方出版業方案：2021 年的新聞稿，對象是報紙與雜誌出版商，內容是紙本報刊的內容與發行業務。頁面沒提印刷廠生產（來源 7）。
- 第三方 delaware 的 LP. Print & Packaging：以 FAST 範本方案 powered by S/4HANA，含 Pricing Cockpit（成本計算、報價、變體建立）、Sequence Planning、delaware MES（來源 6、30，第三方行銷頁）。頁面沒說價格、量化成效，客戶推薦語為廠商提供、未獨立驗證（來源 6）。
- 第三方 delaware 的 Mill Products（紙廠等捲材與片材產業）：頁面提到 prepress、press、postpress 系統的 SAP-JDF 流程整合。紙廠不是印刷廠，頁面沒說是否支援按單生產（來源 107）。

## 四、對委託方情境的對照（推論）

本段是本卡作者的推論，不是來源原文。推論依據標在括號內。

### 推論一：只用 SAP 自家解決方案，生產、成本、品檢入庫、帳務可原生承接，其餘範圍只承接一部分

| 範圍 | 推論 | 依據 |
|------|------|------|
| 售前（線下）、訂單、出貨、帳務 | S/4HANA Sales 與 Finance 原生承接 | 來源 19、35、38 |
| 生產、成本、品檢入庫 | S/4HANA 的 PP、CO、QM 原生承接，且是本卡開過的對照對象中範圍最完整的一份 | 見第一組細表 |
| 售前（線上）、售後 | 部分承接。選項綁工序靠 VC，Commerce 前端是否呈現可配置產品查無；售後有退貨與維修，沒有保固與補做 | 來源 13、16、14 |
| 諮詢服務、審稿打樣、補做 | 沒有 SAP 自家場景 | 來源 25、30 |

導入顧問若遇到「SAP 無此場景」的範圍，較可能提三條路之一：

| 路徑 | 利 | 弊 |
|------|---|---|
| A 外接專用系統，SAP 管其餘 | 保持標準流程與乾淨核心 | 要定資料正本、做整合 |
| B 買第三方印刷業方案 | 有印刷業專用元件（來源 6） | 不是 SAP 自家方案，另有授權與依賴（需另查） |
| C 在 SAP 平台上自建延伸 | 彈性高 | 延伸等級要守 clean core，過度客製會增加升級維護成本（來源 81、86） |

建議：不做結論，交委託方依「是否接受第三方」決定。

### 推論二：SAP 的資料結構與委託方的設計方向有落差

- SAP 的物料主檔涵蓋成品、半成品、原物料三類（來源 12）。委託方的品項主檔現階段只放原物料，成品與半成品沒有品號（依據：委託方範圍第 3 項）。
- SAP 的 BOM 與 Routing 是兩個獨立物件，用生產版本與組件分配連結（來源 10、48）。BOM 的用量是成本與扣料的正式輸入（來源 48、10）。委託方的配方只記製法，用量只作參考（依據：委託方範圍第 3 項）。兩邊方向不同。
- SAP 的成本掛在成本估算（成本計算變式、數量結構、成本組成結構）與成本物件上（來源 31、4）。委託方的算式掛在主檔項目的計價方法（依據：委託方範圍第 4 項）。
- SAP 有在製品與差異：確認把作業成本計入訂單，期末算 WIP，交貨後算差異並結算（來源 8、5、71）。委託方沒有庫存模組、在製品帳與差異科目（依據：委託方範圍第 4 項）。
- SAP 完工後貨進庫存，經品檢庫存放行到非限制使用庫存（來源 33、34）。委託方以印件層的算出數字取代庫存狀態（依據：委託方範圍第 5 項）。
- SAP 的可配置物料把配置放在銷售訂單內，成本估算在配置之後（來源 29，舊版）。委託方「訂單明細同時是產品定義」的做法，與這個設計相近（推論）。
- SAP 的 VC 用相依性把選項連到 BOM 組件與作業（來源 13，舊版）。這與委託方「選項綁材料、工序、裝訂、設備識別碼」的需求對應，但 Commerce Cloud 端的呈現查無（見查無）。

### 推論三：顧問會問委託方的問題

依來源 83、81、3、1，對照委託方範圍，顧問會問：

- 哪些流程進第一版範圍，誰代表使用者角色。
- 標準流程在哪些地方不夠，哪些差異值得做。
- 成品採純按單（策略 20）、部分預先生產（策略 50）或按庫存。印刷是按單接單，成品與半成品是否要有品號，影響整個物料與 BOM 設計（推論）。
- plant 與儲存地點怎麼切，工作中心對應哪些設備與產線。
- 遷移範圍：哪些現有 BOM 與工作中心要帶進來，「有效」的判準是什麼。

### 推論四：對委託方生產段的結論

SAP 對委託方最擔心的生產段有原生物件與流程：物料主檔、BOM、Routing、工作中心、生產訂單、確認、WIP、結算、檢驗批、入庫、外包、重工（見細表）。SAP 的設計前提是成品與半成品都有品號、BOM 帶用量、庫存與成本帳連動。委託方現況與這三個前提都不同。

SAP 是通用離散製造方案，不是印刷專屬。印刷專屬需求在已開頁面中只見第三方方案（來源 6）。顧問做法的重點是標準優先：先展示標準流程，只對關鍵差異做延伸（來源 81、86）。

## 第一輪初步分析（Claude 寫）

- 觀察：SAP 自家產品對生產段的覆蓋遠大於 Salesforce：物料主檔三類型、BOM 與 Routing 分離、生產訂單、確認、WIP、結算、檢驗批、入庫、外包、重工都有原生物件。審稿打樣、諮詢服務、補做在官方頁查無。
- 觀察：SAP 的設計前提有三項：成品與半成品有品號、BOM 帶正式用量、庫存與成本帳連動。與委託方現況的落差集中在這三項。對照見 `memory/erp/erp-mes-standard-alignment-20261028/SAP對照.md`。
- 觀察：顧問方法與 Salesforce 版不同。SAP 的特色是標準優先：Fit-to-Standard 工作坊先展示標準流程，差異進 backlog 排序，延伸受 clean core 等級約束。範圍、組織結構、遷移範圍是前期要定案的決策。
- 觀察：可配置物料（VC）是 SAP 對「選項決定 BOM 與工序」的做法，可作 EC 規格品選項綁識別碼的對照素材。官方新版頁沒寫選項如何選出工序，需另查。
- 觀察：版本限制。現行版證據多來自課程頁。品檢、成本計算表、重工的主要來源仍是舊版文件（4.6C、4.7、ERP 6.0），現行版行為未逐項核對。
- 候選相關卡：[[訂單]]、[[印件]]、[[工單]]、[[生產任務]]、[[品項主檔]]、[[工序主檔]]、[[設備]]、[[部件配方]]、[[印件配方]]、[[報工紀錄]]、[[品檢紀錄]]、[[成本計算規則]]、[[EC 商品管理]]、[[ERP與MES建置專案]]；OQ [[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]。
- 同主題既有 raw：2026-06-14 的 Dynamics 365、Odoo、PrintVis 調研（產品能力面）；2026-10-28 的印刷業 ERP／MES／EC 整合架構調研與 2026-10-29 的製造結構背景知識調研（引用 SAP 舊版文件）。本卡補七範圍覆蓋、導入方法與現行版課程證據，不重疊、不合併。
- 候選 OQ 候補：「成品與半成品是否要有品號」與「配方用量是否升為正式輸入」屬設計決策，留到下一輪規劃流 pre-check 判定是否開 OQ，本次不開。
- 候選升級路徑：不直接升級。供 `memory/erp/erp-mes-standard-alignment-20261028/SAP對照.md` 與下一輪規劃流引用。

## 來源

1. [Outlining Make-to-Order Production（SAP Learning）](https://learning.sap.com/courses/exploring-production-planning-in-sap-s-4hana/outlining-make-to-order-production) — 策略 20 以銷售訂單為驅動、成品不可用計畫獨立需求、不規劃組件；個別與集合指標；策略 50 讓組裝件預先生產、最終組裝等銷售訂單
2. [Accessing Content（SAP Learning）](https://learning.sap.com/courses/discovering-sap-activate-implementation-tools-and-methodology/accessing-content_b3af817e-fbbb-4c14-baee-117f10fdd6bb) — Roadmap Viewer 分 Cloud、On-Premise、Upgrade、General 四類；Process Navigator 的方案包分 Scope Item Group、Business Area、Scope Item、Building Block；accelerator 含流程圖、test script、設定說明
3. [SAP Data Migration Use Cases for Manufacturing Enterprises（LeverX，第三方）](https://leverx.com/en-gb/blog/sap-data-migration-use-cases-manufacturing-uk) — 第三方顧問公司（2026-08-19，自述情境為示意）：遷移順序應依物件相依關係而非依資料領域逐一排；work center 先定目標資源模型；production version 連結物料、工廠、BOM、routing；建議以端到端情境驗證
4. [Using Make-to-Order Production (MTO) for Sales Orders（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/using-make-to-order-production-mto-for-sales-orders) — 複雜按單情境建議用 Product Cost by Sales Order；銷售訂單項目是成本物件；評價的銷售訂單庫存在耗用物料時才產生成本、收貨本身不產生；Order BOM 成本估算只配此庫存
5. [Period-End Closing for Production Order in MTO Scenario（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/period-end-closing-for-production-order-in-mto-scenario) — 未達 Delivery Completed 或 TECO 算 WIP，之後算差異；差異分輸入價、輸入量、資源用量、輸出價、剩餘；WIP 到結算才更新財務；差異不用於銷售訂單項目
6. [delaware：Print and packaging（第三方）](https://www.delaware.co.uk/en-gb/services/print-and-packaging) — 第三方顧問公司行銷頁：LP. Print & Packaging（2020 年併入）與 FAST 範本方案 powered by S/4HANA；含 Pricing Cockpit、Sequence Planning、delaware MES；客戶推薦語為廠商提供、未獨立驗證
7. [Verlagsbranche（SAP News Germany）](https://news.sap.com/germany/2021/07/print-verlagsbranche-loesung-digitalisierung/) — SAP 官方新聞（2021-07-02）：出版業雲端方案，對象為報紙與雜誌出版商；約 160 家出版商使用建在 ECC 上的 IS Media；內容是紙本報刊的內容與發行業務，不是印刷廠生產
8. [Confirming Production Orders（SAP Learning）](https://learning.sap.com/courses/exploring-business-processes-in-sap-s4-hana-discrete-shopfloor-control/confirming-production-orders_d5811bf4-fb07-411d-8bdb-0f9cec11e4db) — 確認是進度控制與內部作業成本計入的基礎；CO15 表頭層、CO11N 作業層，一張單只能用一種；yield、scrap、rework 三類數量；setup 與 machine、labor 時間；MES 回報自動拋回；未提 backflush 與 WIP
9. [Outlining Subcontracting（SAP Learning，Public Edition）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-sourcing-and-procurement/outlining-subcontracting_af403e3e-188d-4dbb-bde1-632253739fa6) — 範圍項目 BMY：供應商用客戶提供的元件製造再交回；與 external processing 不同；item category L；提供的元件以供應商專屬特殊庫存管理；收貨以服務價加所耗元件價值評價
10. [Creating Material Assignments and Component Allocations（SAP Learning）](https://learning.sap.com/courses/exploring-basic-data-for-manufacturing-and-product-management-in-sap-s-4hana/creating-material-assignments-and-component-allocations) — material assignment 決定哪個物料用哪份 routing；component allocation 把 BOM 項目分到 routing 的作業，每項只能分到一個作業；沒分配的預設到第一個作業；庫存項目可倒扣領料
11. [Rework in Cost Object Controlling（SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/90/ba69a9446711d189420000e829fbbd/content.htm) — 舊版 4.7：重工三種做法（手動插入作業、reference operation set、獨立重工單）；獨立重工單結算時成本轉回原單；重工中報廢歸造成重工的作業
12. [Why Is the Material Master So Important in SAP S/4HANA?（SAP PRESS，第三方）](https://blog.sap-press.com/why-is-the-material-master-so-important-in-sap-s4hana) — 第三方出版商：FERT 成品（自製賣客戶）、HALB 半成品（自製、通常不賣、當組件）、ROH 原物料（外購）；物料主檔在 MM01 建立
13. [Variant Configuration（SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/d8/fa9bd49ede11d1903b0000e8a49aad/content.htm) — 舊版 4.70：可配置物料建 super BOM 與 super routing；dependencies 選出變體所需的 BOM 組件與 operations；定價可依特性值加價或折扣
14. [Executing Lean Customer Returns（SAP Learning，Public Edition）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-sales-complaint-processing/executing-lean-customer-returns-bdd_ac40972d-cd34-4b9e-a32f-69225bcc252c) — 退貨單、退貨交貨、退貨庫存、貸項單，或免費後續交貨；未提維修與重工
15. [SAP KBA 3766936：GUI document number is Missing In Taiwan eDocument processing](https://userapps.support.sap.com/sap/support/knowledge/en/3766936) — 知識庫文章預覽：標準系統有 Taiwan eDocument 與 GUI 單號；SD 貸項單缺 GUI 單號時顯示 EDOCUMENT_TW047；內文須登入 SAP for Me
16. [Commerce and S/4HANA End to End Integration（SAP Learning）](https://learning.sap.com/courses/commerce-and-s-4hana-end-to-end-integration) — 串接 Commerce Cloud 與 S/4HANA Cloud；商品主資料由 S/4HANA 複寫到 Commerce；訂單經 Order Exchange 送 ERP；用 Integration Suite；頁面未提可配置產品與價格
17. [Explaining the Extensibility Possibilities, Depending on the SAP S/4HANA Version（SAP Learning）](https://learning.sap.com/courses/expanding-sap-s-4hana-using-key-user-side-by-side-extensibility/explaining-the-extensibility-possibilities-depending-on-the-sap-s-4hana-version) — 涵蓋 Public、Private、On-premise 三版；key user extensibility 含自訂欄位與邏輯；只有 on-premise 才有 classic extensibility；建議遵循 Clean Core 政策
18. [What Is RISE with SAP?（SAP PRESS，第三方）](https://blog.sap-press.com/what-is-rise-with-sap) — 第三方出版商：RISE 綁 Private Edition、偏轉型既有系統；GROW 以 Public Edition 為核心、導入以 SAP Activate 為基礎並遵循嚴格的 fit-to-standard
19. [Using Presales Documents（SAP Learning）](https://learning.sap.com/courses/exploring-sap-s-4hana-sales-essentials/using-presales-documents_b23b2418-88db-4494-99d1-bda90e0af1f1) — 售前文件分詢價單與報價單，可互相參照；兩者不是銷售流程必要步驟；可填拒絕原因結案；未說報價轉訂單步驟
20. [Introducing the Condition Technique（SAP Learning）](https://learning.sap.com/courses/configuring-pricing-in-sap-s-4hana-sales/introducing-the-condition-technique_dce0f313-dee6-470e-8851-3f1773cb5d45) — pricing procedure 列出可用的 condition type；access sequence 以 condition table 順序搜尋；找到後複製進銷售單據；有級距時依訂單數量
21. [Introducing SAP CPQ（SAP Learning）](https://learning.sap.com/courses/implementing-sap-cpq/introducing-sap-cpq_aa474ffa-c7b3-440a-a14e-6f30561982e7) — CPQ 為 Configure Price Quote；折扣依使用者類型設上限、超過送主管核准；Configurator 依規則避免不相容選項；配置 Complete 後才能 Add to Quote；未提 ERP 整合
22. [Implement an Integration of SAP S/4HANA Cloud with SAP Commerce Cloud（SAP Learning）](https://learning.sap.com/learning-journeys/implement-an-integration-of-sap-s-4hana-cloud-with-sap-commerce-cloud) — 資料流兩向：商品主資料由 S/4HANA Cloud 到 Commerce 再發佈到 storefront、訂單由 Commerce 到 S/4HANA Cloud；未提可配置與變體商品
23. [Introducing Variant Configuration（SAP Learning）](https://learning.sap.com/courses/implementing-variant-configuration-in-sap-s4hana/introducing-variant-configuration) — 不用 VC 時每個變體都要獨立的物料主檔、BOM、task list、成本與定價紀錄；特性以 characteristics 與 values 存放；限制以 object dependencies 實現；可配置物料用 super BOM 並可搭配 routing
24. [Setting up a Configurable Model using Variant Configuration（SAP Learning，Public Edition）](https://learning.sap.com/courses/implementing-product-lifecycle-management-in-sap-s-4hana-cloud-public-edition/setting-up-a-configurable-model-using-variant-configuration_dae07103-fc85-41f7-a473-4e184e142a96) — 建模者建 characteristics 與 classes；生產工程師建 super BOM 與連 routing；以 BOM 展開模擬驗證組件；未說選項如何選取工序
25. [Exploring SAP S/4HANA Service（SAP Learning）](https://learning.sap.com/courses/identifying-business-processes-in-sap-s4hana-service/exploring-sap-s-4hana-service_f704b013-3e84-4e36-9aaf-2f847b922354) — Technical Service 與 Commercial Service；課程目錄列有服務單與服務開票；未提付費諮詢與保固
26. [Using Billing Functionality in SAP S/4HANA（SAP Learning）](https://learning.sap.com/courses/functions-innovations-in-sap-s-4hana-sales/using-billing-functionality-in-sap-s-4hana_c98c3917-bdd2-461a-a430-80effce890ac) — 開票請求（BDR）可存外部系統與試算表資料；Convergent Billing 合併一次性、週期性、用量計費；僅一處提到專案型服務；未提付費諮詢
27. [Types of Availability Check in SD（SAP Help，700_SFIN3E，舊版）](https://help.sap.com/doc/862eb853dcfcb44ce10000000a174cb4/700_SFIN3E%20006/en-US/5a63b753128eb44ce10000000a174cb4.html) — 可用量檢查三種：ATP 數量、對 product allocation、對計畫；product allocation 依期間為特定客戶或區域分配
28. [Product Allocation（SAP SCM 7.0 EHP1，APO，舊版）](https://help.sap.com/doc/saphelp_scm700_ehp01/7.0.1/en-US/48/42c95360267614e10000000a174cb4/content.htm?no_cache=true) — SAP APO 的 product allocation；短缺時公平分配；超額時建議未來交貨日；不是 S/4HANA 現行版
29. [Configurable material 成本估算（SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/7e/cb857b43a311d189ee0000e81ddfac/content.htm) — 舊版 4.70：系統依配置從最大 BOM 挑組件、從最大 routing 挑 operations；變體物料沒有自己的 BOM 或 routing；須先在銷售訂單配置再估成本
30. [delaware：Print and Packaging（第三方夥伴頁）](https://www.delaware.pro/en-in/solutions/print-and-packaging) — 第三方：LP. Solution Suite built on S/4HANA；涵蓋會計到出貨；標準不足時加印刷業專用元件；未提 proof、稿件管理、色彩管理
31. [Explaining the Costing Variant（SAP Learning）](https://learning.sap.com/courses/product-cost-planning-in-sap-s-4hana/explaining-the-costing-variant) — 每份成本估算連一個 costing variant；標準成本估算以計畫價評價計畫數量結構並為 S-price 物料算標準價；CK11N、CK40N；成本組成結構分物料、機器、人工、間接費用
32. [Performing Settlement（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/performing-settlement) — 價格控制 S 與 V 的結算借貸科目不同；結算把 WIP 轉到 FI；更新 Material Ledger 總差異；Price Difference Splitting Profile 把差異類別對應到總帳科目
33. [QM in Production（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/8a/1a1d794e4211d182be0000e829fbfe/content.htm) — 舊版 4.6C：釋放生產訂單時自動建 inspection lot，也可在入庫時建；入庫無缺陷進 unrestricted-use stock，也可進 inspection stock；usage decision 記錄檢驗完成；檢驗結果在確認作業時記錄
34. [Additional Process Information（QM 與生產整合，SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/51/953e74a1fa11d189ba0000e829fbbd/content.htm) — 舊版 4.6C：QM 依 inspection type 產生檢驗批；型別 03 生產中檢驗、型別 04 生產後入庫檢驗並使用自己的 inspection plan；品管放行時 inspection stock 自動過帳到 unrestricted-use stock
35. [Executing the Shipping Process（SAP Learning）](https://learning.sap.com/courses/exploring-sap-s-4hana-sales-essentials/executing-the-shipping-process_e796d891-1485-4b97-874b-f4cbcbd9dbc9) — outbound delivery 控制 picking、packing、運輸規劃、post goods issue；後三者選用；過帳發料更新庫存並產生待開票清單；未提 movement type
36. [Explaining the Process Steps for In-House Repairs（SAP Learning，Public Edition）](https://learning.sap.com/courses/implementing-in-house-service-processes-in-sap-s-4hana-cloud-public-edition-service/explaining-the-process-steps-for-in-house-repairs_a5ddc919-9c1b-435b-b031-d413d9182f6c) — 客戶寄來的維修物件入客戶專屬庫存；每物件一張 repair order；技師以 service confirmation 記工時與備件；確認後成本過帳 Controlling，可計費
37. [Executing an In-House Repair Process（SAP Learning）](https://learning.sap.com/courses/discovering-sap-s-4hana-service/executing-an-in-house-repair-process_c94e773a-464d-4d8c-bf2e-8bdbf9169d60) — 維修五步（建立、預檢、維修報價、規劃執行、準備開票）；預檢決定維修或退回；測試腳本代號 3XK；未提保固
38. [Executing the Billing Process and the Integration to SAP S/4HANA Finance（SAP Learning）](https://learning.sap.com/courses/exploring-sap-s-4hana-sales-essentials/executing-the-billing-process-and-the-integration-to-sap-s-4hana-finance_e2dd5db3-73c3-4cda-8ad5-1e7f39f04fba) — billing document 是財務會計的資料來源；儲存時自動產生會計文件並更新總帳、CO-PA、信用額度；收款由財務過帳；未提部分付款、退款、催收
39. [Sales Order Processing with Customer Down Payment（BKJ，SAP Learning）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-sales-advanced-business-processes/sales-order-processing-with-customer-down-payment-bkj-_da2171c8-079c-4435-bb5b-c894a522af33) — 範圍項目 BKJ：訂單以 billing plan 處理預付款，到期日建 down payment request；收款指派到請求；最終發票時已收預付款轉為待清算；未提退還與沖銷
40. [Examining the Quoting Capabilities of Quotation Management（SAP Learning）](https://learning.sap.com/courses/discover-sap-sales-cloud/examining-the-quoting-capabilities-of-quotation-management_ab43fbba-fd61-486d-b8e2-ca5e195d4c36) — Sales Cloud 報價可沿用 S/4HANA 定價；接受後轉 S/4HANA 訂單；訂單後續變更不回寫報價；可啟用版本控制；頁面未出現 CPQ
41. [Creating Configuration Rules（SAP CPQ，SAP Learning）](https://learning.sap.com/courses/implementing-sap-cpq/creating-configuration-rules_ab17e7f5-df83-4f3e-add2-0e088ddcd81b) — 每條規則含條件與動作（IF、THEN）；有 Disallow 與 Mandatory 範例；多規則以 Ranking 排序；未說規則與 BOM 或工序的對應
42. [Managing Configurable Products（SAP CPQ，SAP Learning）](https://learning.sap.com/courses/implementing-sap-cpq/managing-configurable-products_f2dce808-288b-41fb-ab68-6216ec92684b) — 可配置產品由 attributes 組成，可顯示為下拉、單選、核取；有相依；頁面完全未出現 BOM
43. [SAP KBA 3766970：F5A 192 Enter a business location（Taiwan）](https://userapps.support.sap.com/sap/support/knowledge/en/3766970) — 知識庫文章預覽：國家代碼 TW 的開票單過帳至會計時須維護 business place；內文須登入
44. [Comarch e-Invoicing Platform（SAP 台灣站夥伴頁）](https://www.sap.com/taiwan/products/financial-management/partners/comarch-ag-einvoicing-platform.html) — 第三方夥伴頁；頁面沒有台灣電子發票或統一發票字樣
45. [Differentiating the SAP Solutions for Warehouse Management（SAP Learning）](https://learning.sap.com/courses/processes-in-sap-s-4hana-ewm/differentiating-the-sap-solutions-for-warehouse-management) — 只用 Inventory Management 時依 plant 與 storage location 管庫存；WM 由 Stock Room Management 取代；embedded EWM 自 1610 起內建；decentralized EWM 為獨立系統
46. [Introducing SAP S/4HANA and SAP S/4HANA Sales（SAP Learning）](https://learning.sap.com/courses/functions-innovations-in-sap-s-4hana-sales/introducing-sap-s-4hana-and-sap-s-4hana-sales_d26c8079-9806-4a95-bca6-0534143be1ad) — Sales 含訂單與合約管理、訂單履行、開票；另有 Finance 與 Enterprise Management
47. [How to Configure a New Material Type in SAP S/4HANA（SAP PRESS，第三方）](https://blog.sap-press.com/how-to-configure-a-new-material-type-in-sap-s4hana) — 第三方出版商：每筆物料主檔須指派 material type；類型決定可選檢視、價格控制預設、數量與金額更新方式；列出 ROH、FERT、HALB、HAWA、DIEN
48. [Defining the Quantity Structure（SAP Learning）](https://learning.sap.com/courses/product-cost-planning-in-sap-s-4hana/defining-the-quantity-structure) — 數量結構由 BOM、routing、recipe 組成；BOM usage 1（Production）與 6（Costing）與成本相關；routing 每個作業指定 work center、計畫時間與成本活動；production version 為必要
49. [Initial Screen for Creating a Multiple BOM（SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/ea/e9b9c44c7211d189520000e829fbbd/content.htm) — 舊版 4.7：同一物料可建 alternative 形成 multiple BOM；BOM usage 決定項目層可設的狀態；以 change number 建立時有效起日取自 change master
50. [Changing BOMs with Engineering Change Management（SAP Learning）](https://learning.sap.com/courses/exploring-basic-data-for-manufacturing-and-product-management-in-sap-s-4hana/changing-boms-with-engineering-change-management) — ECM 以 change number 歸組一次變更影響的物件；變更記錄定義有效期間；release key 依領域生效；有歷史的變更保存前後狀態
51. [Control Keys（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/b1/c03525439a11d189410000e829fbbd/content.htm) — 舊版 4.6C：control key 的指標決定作業是否排程、算產能、計成本、確認、外部加工、列印；外部加工指標在建單時產生請購單
52. [Using Work Centers（SAP Learning）](https://learning.sap.com/courses/applying-sap-s-4hana-product-engineering/using-work-centers_f67f7a8c-ef0a-4122-be21-b634928287fa) — work center 隸屬 plant；用於 routing、inspection plan、生產與維護訂單；存營運時間、成本公式與 cost center、產能；提供 control key 與標準值給 routing
53. [Creating Production Orders by Planned Order Conversion（SAP Learning）](https://learning.sap.com/courses/manage-production-orders-in-sap-s-4hana-manufacturing/creating-production-orders-by-planned-order-conversion) — MRP 建 planned order，自製的在接近生產日時轉為生產訂單；轉換含集合、個別、部分三種；轉換後元件相依需求改為預留；緊急工作可手動建單
54. [Releasing Production Orders（SAP Learning）](https://learning.sap.com/courses/exploring-business-processes-in-sap-s4-hana-discrete-shopfloor-control/releasing-production-orders_b51cd721-9423-454d-85f7-36021999996b) — release 後才能列印、領料、確認、入庫；release 前做 availability check 與產能平準；缺料訂單不能跑；可列印 time ticket、pull list，可下載到 MES
55. [Processing Production Orders（SAP Learning）](https://learning.sap.com/courses/executing-basic-erp-processes-with-sap-s-4hana/processing-production-orders) — 建單帶出 routing 並排程；release 後才可過帳 goods issue、確認、goods receipt；goods issue 降低元件庫存；goods receipt 通常在最後作業後增加庫存
56. [Production Order Phases（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/ab/9b466f0e18d311ae620060b03c9bbe/content.htm) — 舊版 4.6C：生產訂單階段 CRTD、REL、PRT、PCNF、CNF、TECO，另有刪除旗標；未列 DLV、CLSD
57. [Closing a Production Order（SAP Library saphelp_me60，舊版）](https://help.sap.com/saphelp_me60/helpdata/en/da/ffb753128eb44ce10000000a174cb4/content.htm) — ERP 6.0 時期：CLSD 後不再允許確認與貨物移動；前提為 REL 或 TECO、訂單餘額為零、無未結請購與採購；可撤銷
58. [Calculating Variances for Final Delivered Manufacturing Orders（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/calculating-variances-for-final-delivered-manufacturing-orders) — 訂單為 DLV 狀態時才算差異；結算類型 FUL 與 PER 對聯產品與 WIP 的處理不同；差異等於借記實際成本減入庫貸方金額
59. [Capacity Leveling Using the Capacity Scheduling Table（SAP Learning）](https://learning.sap.com/courses/exploring-the-capacity-planning-in-sap-s-4hana/capacity-leveling-using-the-capacity-scheduling-table) — Fiori 產能平準工具；瓶頸作業派到 pacemaker work center；Bucket 與 Sequence 兩種模式；可重排訂單
60. [Assigning Production Operators and Selecting Work（SAP Learning）](https://learning.sap.com/courses/s-4hana-peo-foundational-setup-and-basic-processes/assigning-production-operators-and-selecting-work) — 生產主管以 Assign Work 把作業指派給個人或團隊；Work Center Queue 與 My Work Queue 顯示作業進度；Perform Work 可掃描條碼
61. [Capacity Leveling（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/51/9541c7a1fa11d189ba0000e829fbbd/content.htm) — 舊版 4.6C：交易碼 CM21 規劃表；自動或手動派工；deallocation 退回訂單池
62. [Confirming the Production Order（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/51/9536f6a1fa11d189ba0000e829fbbd/content.htm) — 舊版 4.6C：CO11N 對最後作業做 final confirmation；過帳時倒扣領料並把成品入庫；貨物移動失敗用 COGI 重處理
63. [External processing in S/4HANA: an overview（CONSILIO，第三方）](https://www.consilio-gmbh.de/en/trendblog/external-processing-in-s-4hana-an-overview) — 第三方顧問公司：planned order 轉生產訂單時為外部加工作業自動產生請購單；採購單只有文字項目；收貨對採購單並指派給生產訂單
64. [Subcontracting in S/4HANA: an overview（CONSILIO，第三方）](https://www.consilio-gmbh.de/en/trendblog/subcontracting-in-s-4hana-an-overview) — 第三方顧問公司：外包商收到客戶提供的全部元件；元件以特殊庫存放在 plant 層級、法律所有權仍屬客戶；subcontracting cockpit 顯示外包商需求與庫存
65. [External Processing in Production（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/51/95312fa1fa11d189ba0000e829fbbd/content.htm) — 舊版 4.6C：外部作業由廠商在其工廠執行；可選是否供料給廠商；有自己的收貨文件、作業狀態與成本顯示；未提 control key
66. [Work in Process in Product Cost by Order（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/90/ba6a93446711d189420000e829fbbd/content.htm) — 舊版 4.6C：WIP 等於已發生實際成本（領料、內部活動、外部活動、間接費用）減入庫貸方；DLV 或 TECO 時取消前期 WIP；結算到 FI 借未完工科目、貸庫存變動科目
67. [Using Periodic Cost and WIP for Final Delivered Manufacturing Orders（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/using-periodic-cost-and-wip-for-final-delivered-manufacturing-orders) — 最後一次入庫後比較實際成本與標準或預先成本估算；差異可一筆轉 FI 或依類別拆分；交貨後 WIP 重算並過帳對沖分錄
68. [Creating Cost Estimates with Quantity Structures（SAP Learning）](https://learning.sap.com/courses/product-cost-planning-in-sap-s-4hana/creating-cost-estimates-with-quantity-structures) — 前提為物料主檔有成本與會計視圖；costing date、quantity structure date、valuation date 三個日期；系統自動決定並估價數量結構；可從估算導覽到 BOM 與 routing
69. [Cost Estimate with Quantity Structure: Process Flow（SAP Library saphelp_me60，舊版）](https://help.sap.com/saphelp_me60/helpdata/en/c4/a4b9537cceb44ce10000000a174cb4/content.htm) — ERP 6.0 時期：依 BOM 與 routing 算製造成本；單一物料建 cost estimate、多個物料用 costing run；組件成本逐層向上累加；routing 活動成本含固定與變動
70. [Applied Overhead（SAP Library saphelp_me60，舊版）](https://help.sap.com/saphelp_me60/helpdata/en/12/b24453e415e447e10000000a441470/content.htm) — ERP 6.0 時期：管理費用率透過 costing sheet 指派給產品；可套用百分比與數量基礎管理費用；計算基礎只能選單一種
71. [Performing Settlement of Final Delivered Manufacturing Orders（SAP Learning）](https://learning.sap.com/courses/cost-object-controlling-in-sap-s-4hana/performing-settlement-of-final-delivered-manufacturing-orders) — 結算把訂單成本與入庫價值之差轉 FI、訂單餘額歸零；價格控制 S 借價差、貸成品庫存變動；沖銷前期 WIP；差異可依類別拆入 CO-PA
72. [Variance Categories（SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/90/ba624f446711d189420000e829fbbd/content.htm) — 舊版 4.7：輸入側差異含 Input Price、Resource-Usage、Input Quantity、Remaining Input、Scrap；輸出側含 Mixed-Price、Output Price、Lot Size、Remaining
73. [Inspection Type 04 in SAP QM: Final Inspection & UD（Guru99，第三方）](https://www.guru99.com/final-inspection-production-sap-qm.html) — 第三方教學站：生產訂單過帳入庫時自動建型別 04 檢驗批；庫存留在品檢庫存直到檢驗完成；使用決策代碼 A 為接受，過帳移動類型 321
74. [Using Quality Notifications（SAP Learning）](https://learning.sap.com/courses/applying-sap-s-4hana-quality-management/using-quality-notifications_cbfede70-e185-42e3-b0ba-81c631317b3a) — 每類問題有專屬通知類型；流程為建立、立即任務、處理、完成；處理時記錄缺陷與矯正任務；有未完成任務時不能關閉；結案前記錄根本原因
75. [Goods Receipt for a Production Order（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/51/9531d8a1fa11d189ba0000e829fbbd/content.htm) — 舊版 4.6C：交易碼 MB31 對生產訂單入庫；移動類型 101；未說庫存類型
76. [SAP KBA 2391194：Movement 541 with Special Stock E or Q](https://userapps.support.sap.com/sap/support/knowledge/en/2391194) — 知識庫文章預覽：外包採購單領用特殊庫存 E 或 Q 的元件時不能用 movement type 541 轉入；541 只過帳到供應商持有庫存；內文須登入
77. [Describing the Deployment Process and the SAP Activate Methodology（SAP Learning，SAP Ariba 課程）](https://learning.sap.com/courses/planning-end-to-end-deployment-of-sap-ariba-strategic-sourcing-suite/describing-the-deployment-process-and-the-sap-activate-methodology) — Ariba 產品課程（非 S/4HANA 專屬）：六階段 Discover、Prepare、Explore、Realize、Deploy、Run 與各階段主要活動
78. [Identifying Key Activities in the Explore Phase（SAP Learning，SAP Ariba 課程）](https://learning.sap.com/courses/planning-end-to-end-deployment-of-sap-ariba-strategic-sourcing-suite/identifying-key-activities-in-the-explore-phase) — Ariba 產品課程（非 S/4HANA 專屬）：Functional Lead 主持 fit-to-standard 工作坊；核心活動含方案示範、需求工作坊、資料蒐集範本、記錄 to-be 流程；階段出口為設計規格簽核
79. [Describing the Methodology Structure（SAP Learning）](https://learning.sap.com/courses/discovering-sap-activate-implementation-tools-and-methodology/describing-the-methodology-structure_d959f6fc-ebfc-4143-94b3-6b83a6339b8b) — Prepare、Explore、Realize、Deploy 為四個核心階段，Discover 與 Run 為外加階段；Discover 交付物含創新策略、價值分析、導入策略、技術架構需求；Realize 依 backlog 優先序以 sprint 迭代
80. [Discovering SAP Activate（SAP Learning）](https://learning.sap.com/courses/discovering-sap-activate-agile-project-delivery/discovering-sap-activate_b99eb8ed-8a51-4975-9a29-6d3596d33bd3) — Product Backlog 存放排序後的需求；Realize 以短迭代建置；客戶主導優先序與驗收；每階段後有 Quality Gate；Roadmap Viewer 層級為 Phase、Deliverable、Tasks、Accelerators
81. [Überblick über den Fit-to-Standard-Analyseprozess（SAP Learning，德文）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-de/uberblick-uber-den-fit-to-standard-analyseprozess_aa2f7030-617a-4679-997f-c937f8a8cc03_de-DE) — 德文版：顧問對客戶部門專家展示 DDA 選定的標準流程；小幅調整標準而非重建；每流程 2 到 4 位客戶專家、每場工作坊合併 1 到 3 個流程；事先跑過 test script；需求記入 SAP Cloud ALM；UAT 後正式簽收
82. [Accelerating Your Project with SAP Best Practices（SAP Learning）](https://learning.sap.com/courses/cloud-onboarding-for-sap-cloud-erp/accelerating-your-project-with-sap-best-practices_a77aa493-7775-4049-8f14-43dc5840fd4f) — Best Practices 是預先設定的標準內容，經 SAP Signavio Process Navigator 取得；含設定指南、測試腳本、流程圖、主資料指南、範例資料；用於端到端基準與及早找出流程 gap
83. [Explore Phase Overview（SAP Learning）](https://learning.sap.com/courses/discovering-sap-activate-agile-project-delivery/explore-phase-overview_f9f503a3-54e9-4868-855c-5b88f879c6ad) — Explore 的目的是用 Fit-to-Standard 分析確認範圍內功能符合需求；顧問在 Starter System 以 show-and-tell 展示標準流程；delta 經 Product Owner 驗證後以 User Story 進 Product Backlog；只有最高優先項進 Design workshop
84. [Identifying Organizational Units for Supply Chain（SAP Learning，Public Edition）](https://learning.sap.com/courses/experiencing-supply-chain-business-scenarios-in-sap-s-4hana-cloud-public-edition/identifying-organizational-units-for-supply-chain_b3cd6670-b630-4a15-8514-bcdf63a2ff86) — 組織結構為 client、company code、plant、storage location；plant 是製造、銷售、採購核心單位；Public Edition 每個 plant 是一個評價範圍；plant 的定義影響補貨前置時間與 MRP 方法
85. [Introducing the Clean Core Approach（SAP Learning）](https://learning.sap.com/courses/practicing-clean-core-extensibility-for-sap-s-4hana-cloud/introducing-the-clean-core-approach_fcb6c662-7041-4c99-88bd-345636fae7f3) — Clean core 有五個面向（流程、資料、整合、營運、延伸）；原則含零修改、只用 released API、充分用 key user extensibility、較大型延伸用 SAP BTP
86. [Exploring Clean Core Extensibility Best Practices（SAP Learning）](https://learning.sap.com/courses/practicing-clean-core-extensibility-for-sap-s-4hana-cloud/explaining-extensibility-model-best-practices_e290f382-800e-40ef-a203-85a13115f487) — Clean core 等級 A 到 D 取代舊三層模型；A 只用 released API，D 為不建議；延伸等級由其中使用的最低階技術決定
87. [Introducing the SAP S/4HANA Cloud Extensibility Model（SAP Learning）](https://learning.sap.com/courses/practicing-clean-core-extensibility-for-sap-s-4hana-cloud/introducing-the-sap-s-4hana-cloud-extensibility-model_ccb4be88-d66d-47e1-96a0-3341dc007416) — 延伸分 on-stack 的 key user 與 developer、及在 SAP BTP 執行的 side-by-side；延伸只能用 released 的公開 API 與延伸點
88. [Finding the Required Business Roles and Business Catalogs for a Solution Process（SAP Learning）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-service-management/finding-the-required-business-roles-and-business-catalogs-for-a-solution-process_f5cdee81-2981-484c-b6d2-c60b43a424f4) — 每個 solution process 有對應 business role 與 business catalog；從 test script 找所需角色；不可直接改 SAP 標準角色，須複製或用範本建立
89. [Migrating Data to SAP S/4HANA Cloud Public Edition with Local Templates（SAP Learning）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition/migrating-data-to-sap-s-4hana-cloud-public-edition-with-local-templates_d46f2417-0824-4596-9da0-319ef99e562e) — Migration Cockpit 為每個 migration object 建 staging table；須先遷移前置物件；範本為 XML 或 CSV；引導程序 11 步；mapping 分 value mapping 與 fixed value；未談資料清理
90. [Describing Key Capabilities（SAP Master Data Governance，SAP Learning）](https://learning.sap.com/courses/introducing-sap-master-data-governance/describing-key-capabilities) — MDG 三項能力：consolidation、central governance、data quality management；central governance 以變更請求為基礎並含核准；支援 Business Partner、Material Master
91. [Introducing Federated Master Data Governance（SAP Learning）](https://learning.sap.com/courses/introducing-sap-master-data-governance/introducing-federated-master-data-governance) — Core Data Owner 管企業共通屬性、Application Data Owner 管應用專屬片段；資料在最了解它的地方建立再回傳核心系統
92. [Evaluating Current Processes after a System Conversion（SAP Learning，Private Edition）](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/evaluating-current-processes-after-a-system-conversion_b2ac1860-e346-481b-807f-4c7688b6e7ce) — 系統轉換後 Sprint 1 先測現有流程、Sprint 2 找改善機會；SAP Readiness Check 顯示實際使用的交易碼與可取代的 Fiori app
93. [Exploring Best Practices with SAP Signavio Process Explorer（SAP Learning）](https://learning.sap.com/courses/understanding-the-signavio-plug-gain-approach/exploring-best-practices-with-sap-signavio-process-explorer) — Process Explorer 是參考內容儲存庫；SAP 流程模型可帶入自己的工作區與目前流程績效比較；best practice 在 fit-to-standard 中當基準
94. [SAP Signals: SAP Signavio Process Explorer General Release（ASUG，第三方）](https://www.asug.com/insights/sap-signals-sap-signavio-process-explorer-general-release) — 第三方使用者組織（2023-02-23）：Process Explorer 含 7,000 個流程模型、20 個業務領域 capability map、13 個以上產業 value accelerator
95. [How does SAP Signavio Process Navigator support process management?（Hicron，第三方）](https://hicron.com/blog/how-does-sap-signavio-process-navigator-support-process-management/) — 第三方顧問公司（無作者與日期）：Process Navigator 提供以 S/4HANA best practices 為本的參考流程庫；可比對自家流程找 gap
96. [Using SAP Signavio to Enhance Business Transformation Efforts（Surety Systems，第三方）](https://www.suretysystems.com/insights/using-sap-signavio-to-enhance-business-transformation-efforts/) — 第三方顧問公司：Process Manager、Process Intelligence、Process Insights、Journey Modeler、Collaboration Hub 的功能分工；全文未用 as-is、to-be 字樣
97. [Table of Planning Strategy Assignments（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/1e/bb3f966fa211d191820000e8a5f6e6/content.htm) — 舊版 4.6C：策略對應需求類型——20 為 KE、25 為 KEK、26 為 KEL、50 為 VSE 加 KEV；需求類型由策略決定，建議用標準策略
98. [Make-to-Order Production w/ Configuration (25)（SAP Library saphelp_46C，舊版）](https://help.sap.com/saphelp_46C/helpdata/EN/cb/7f942743b711d189410000e829fbbd/content.htm) — 舊版 4.6C：策略 25 與 20 相似，用於母產品不需要或無法規劃；適用可配置物料且必須配置；銷售訂單輸入變式與配置，銷售後才生產
99. [Managing Make to Order Process for Product Variants（SAP Learning，Public Edition）](https://learning.sap.com/courses/implementing-product-lifecycle-management-in-sap-s-4hana-cloud-public-edition/make-to-order-process-for-managing-product-variants_a45f64e4-66fb-4ceb-ac96-bf71f8d5a0ed) — 可配置產品按單生產：銷售訂單納入 MRP 再依配置建生產訂單；客戶選特性、系統用相依性防止不允許的組合；售價依選定特性計算；未說 BOM 與 routing 如何依特性選取
100. [Planning with Planning Variants（SAP Learning）](https://learning.sap.com/courses/configuring-variant-configuration-in-sap-s-4hana/planning-with-planning-variants) — 規劃變體對應策略 54；以 type matching 讓可配置物料的銷售訂單消耗計畫獨立需求；組件可預先生產
101. [Make-to-Order Production: Cost Management Using the Sales Order（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/dd/5600cb545a11d1a7020000e829fd11/content.htm) — 舊版 4.6C：一個訂單項目的所有成本與收入集中指派在該項目；需求類型由 MRP group 與 strategy group 決定；按單項目須指定工廠
102. [Sample Scenario: Strategy 20（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/e0/71bb1f9c9f11d191920000e8a5f6e6/content.htm) — 舊版 4.6C：策略 20 沒有銷售訂單就不生產；MRP 產生計畫訂單，轉生產訂單、釋放、入庫；收貨後以客戶專屬庫存區段顯示銷售訂單庫存
103. [Defining Selection Conditions in BOMs and Task Lists（SAP Learning）](https://learning.sap.com/courses/implementing-variant-configuration-in-sap-s4hana/defining-selection-conditions-in-boms-and-task-lists) — 選擇條件可建在 BOM 項目上或獨立建立後指派；模擬配置時顯示 super BOM；須建 object dependencies 才能選出該配置的 BOM；task list 也需選擇條件選出作業與生產資源工具
104. [Variant Configuration（Routing 與 Master Recipe 段，SAP Library saphelp_470，舊版）](https://help.sap.com/saphelp_470/helpdata/en/92/58c149417011d189ec0000e81ddfac/content.htm) — 舊版 4.7：可配置物料的 routing 稱 super task list，含製造所有變式所需的作業；選擇條件確保變式需要的作業被選取；程序可修改作業欄位如標準值
105. [Make-to-Order: Account Assignment for Cost Management to the Sales Order（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/dd/5600f2545a11d1a7020000e829fd11/content.htm) — 舊版 4.6C：成本與收入的帳戶指派在銷售訂單項目層級；可設利潤中心、獲利段、settlement rule、results analysis key
106. [Target / Actual / Production Variances（SAP Library saphelp_46c，舊版）](https://help.sap.com/saphelp_46c/helpdata/en/cf/6fe7c4414f11d182b10000e829fbfe/content.htm) — 舊版 4.6C：periodic 結算差異等於目標成本減管制成本；full settlement 的 WIP 為未最終交貨的餘額，差異在訂單達 DLV 或 TECO 的期間累計
107. [delaware：Mill Products（第三方）](https://www.delawareconsulting.com/en-us/solutions/mill-products) — 第三方顧問公司行銷頁：紙廠等捲材與片材產業方案；提到 prepress、press、postpress 系統的 SAP-JDF 流程整合；是否支援按單生產頁面未說

## 查無公開資料

- help.sap.com 新版頁面只回頁面標題，未取得本文：物料類型與標準物料類型頁、台灣統一發票官方使用說明（含 certificate mode 與 exchange mode）、預付款請求與產品配額的新版頁、報價參照建單頁、Commerce 與 CPQ 整合頁、Commerce 可配置產品整合頁。
- community.sap.com、blogs.sap.com、sap.com 產品頁多回 403：台灣統一發票社群文章、SAP Variant Configuration and Pricing 產品頁、SAP CPQ 產品頁與整合指南、Service Cloud 案件管理文章、embedded EWM 部落格、SAP 官方產業清單頁、SAP Mill Products 官方說明、官方 clean core 白皮書。
- learning.sap.com 多個頁面回 404，因此未取得：Analyzing each phase of SAP Activate、scope item 定義頁、較新的 Variant Configuration 課程頁、客戶退貨總覽與貸項請求頁、銷售端預付款其他課程頁、Sales Cloud 報價轉訂單課程頁、檢驗批與品質通知設定課程頁、成本估算部分課程頁。
- 印刷業專屬 SAP 官方方案：查無。搜尋詞含「SAP printing industry solution」「SAP industry solutions list print and publishing」「printing industry SAP S/4HANA add-on print shop ERP SAP Store」。官方頁只找到出版業方案（來源 7）。SAP Store 的 priint 頁回 403，未讀到本文。
- SAP 官方 Packaging、Consumer Products 方案頁：查無。
- 按單生產、可配置物料銷售的範圍項目代碼與名稱：查無。搜尋摘要出現多個代碼來自第三方簡報，簡報檔無法開啟，不採用。一份 1BM（含半成品規劃的按單生產）流程圖 PDF 只讀到標題中繼資料，內文是圖片，不採用。
- Process Navigator 的 Level 1 到 3 分層：查無官方說明。只有範圍項目群組、業務領域、範圍項目、建置區塊四層（來源 2）。
- SAP Signavio 在 Discover 與 Explore 階段做 as-is 與 to-be 的官方作法：查無。
- Fit-to-Standard 與傳統藍圖（blueprint）差別的官方論述：查無。
- 官方主資料載入順序（物料、BOM、工作中心、Routing）與官方資料清理指引：查無。只有物件須先遷移前置物件（來源 89）。
- 主資料責任（data owner）的官方職責定義：查無。MDG 頁只有 Core Data Owner 與 Application Data Owner 的系統角色（來源 91）。
- Discrete Manufacturing 專屬導入指引：查無。
- 物料類型是否決定可有 BOM、採購類型（自製、外購）與特殊採購碼 30、BOM 用途 2 與 5、可配置 BOM 與變體 BOM 的細節：查無。
- 領料移動類型 261、外包的入庫 101 與 543 用法、外部加工控制碼 PP03、結算交易碼 KO88 與 CO88：查無。
- 型別 04 檢驗批的現行版官方說明、檢驗批來源代碼、三種庫存類型（非限制、品檢、凍結）的入庫規則：查無。型別 04 只見舊版與第三方（來源 34、73）。
- Production Operator Dashboard 與 Manage Production Operations 應用：查無。
- 轉交單、點收動作的 SAP 對應物件：查無。
- 重工在現行版文件的說明：查無，只有舊版 4.7（來源 11）。
- 付費諮詢、審稿、打樣、補做的 SAP 官方場景：查無。
- 台灣統一發票的官方使用說明：只有知識庫文章預覽顯示標準系統有台灣電子文件與統一發票單號機制（來源 15、43），是否涵蓋電子發票上傳財政部未讀到。
- 保固、運輸管理的專頁：查無。
- 成本計算表與產品期間成本在 S/4HANA 現行版的說明：查無，只有舊版 ERP 6.0（來源 69、70）。
- 官方或署名顧問談按單生產離散製造常見陷阱的文章：查無。
- Commerce Cloud 端呈現可配置產品與依選項變價的官方說明：查無（來源 16、22 都沒提）。

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡（「related-vault」十五張為候選，卡名已核對存在）
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）：候選議題為「成品與半成品是否要有品號」與「配方用量是否升為正式輸入」

## 精練去處（Mode B 完成後填）

<!-- Mode A 寫入時保留下方註解樣板不填。Mode B 完成後以實際 wiki link 清單取代整段註解 -->

<!-- Mode B step 6 寫入後在此列出 wiki link：
- [[../04-business-logic/X]] — 新增 § A
- [[../08-open-questions/Y-001-Z]] — 升級為 OQ
- 取消（理由：...）
-->

<!-- 起手提醒（填完刪除本註解）：
- 命名規約、各 mode 流程、Anti-Model-Collapse 四道防線：見 .claude/skills/vault-ingest/SKILL.md 與 raw/README.md
- 共用治理（流程／停下鐵則／紀律）：見 00-meta/卡片撰寫共用規範
-->
