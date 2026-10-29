---
type: raw
status: raw
created-at: 2026-10-29
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - Salesforce
  - ManufacturingCloud
  - 導入方法
  - 覆蓋對照
  - 邊界釐清
  - MES
related-vault:
  - "[[訂單]]"
  - "[[印件]]"
  - "[[生產任務]]"
  - "[[工單]]"
  - "[[EC 商品管理]]"
  - "[[ERP與MES建置專案]]"
  - "[[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]"
raw-source-link: https://www.salesforce.com/manufacturing/cloud/guide/
---

# Salesforce 承接印刷業務範圍的覆蓋與導入方法

> 摘錄重點，非全文轉錄。撰寫者為 Sonnet 研究代理（2026-10-29），主對話以 WebFetch 抽查 7 條來源（來源 1、5、9、14、27、46、47），全部相符。related-vault 由主對話核對卡名後補齊。

## 研究範圍與方法

委託方問題：一家印刷公司只用 Salesforce 的解決方案，導入顧問會怎麼做商業分析與設計。哪些業務範圍 Salesforce 有場景，哪些沒有。

方法：用 WebSearch 找來源，再用 WebFetch 逐頁開啟確認。只列開得起來、內容與敘述相符的頁面。開不起來的頁面記在「查無公開資料」。

三項限制：

- Salesforce 官方開發文件（developer.salesforce.com）多數回 403，物件欄位級資料拿不到。
- Salesforce Help 頁多為動態渲染，部分頁只讀到選單，讀不到本文。
- 找不到 Salesforce 官方的 Manufacturing Cloud 導入指南，也找不到 Industries 流程庫。第二組的導入步驟因此混用官方 Trailhead 教材與有署名的顧問公司文章，文中逐句標示出處。

標記規則：每個結論句後標（來源 N）。標「推論」的句子是本卡作者的判斷，不是來源原文。

## 一、覆蓋對照

名詞說明：Manufacturing Cloud 現已改稱 Agentforce Manufacturing，本卡沿用舊名（來源 9、42）。它建構在 Sales Cloud 與 Service Cloud 之上（來源 42）。Salesforce 官方定位它為管理「車間以外」營運的 CRM 平台（來源 9）。

### 七範圍總表

| 委託方範圍 | Salesforce 承接產品 | 承接程度 | 核心物件 |
|-----------|-------------------|---------|---------|
| 1a 線下業務接單（需求單、報價、成交轉訂單） | Sales Cloud（機會、報價）；Revenue Cloud（報價、定價引擎） | 完整。成交轉訂單有流程（來源 19）。報價有可設定的定價引擎（來源 18） | 機會（Opportunity）、報價、訂單（Order）（來源 19）；長期供貨另有銷售協議（Sales Agreement）（來源 10、50） |
| 1b 線上電商（規格品，選項綁識別碼） | B2B Commerce | 部分。有目錄、議價、變體商品、動態屬性（來源 17、46、47）。官方頁未描述「選項綁材料、工序、設備識別碼」 | 商品、變體商品（各有 SKU）（來源 47）；動態屬性與屬性定價（來源 46） |
| 1c 諮詢服務 | 未找到對應場景 | 查無。能否用服務案件承接屬推論，見四 | 案件（Case）（來源 8、34） |
| 2a 訂單、印件 | Sales Cloud 訂單；Order Management | 完整（訂單與異動）。印件「訂單明細同時是產品定義」為部分，見四 | 訂單、訂單明細（Order Item）（來源 8）；訂單摘要（Order Summary）、異動單（Change Order）（來源 12） |
| 2b 稿件審稿、打樣 | Salesforce 無此場景 | 無。產品能力清單與資料模型均無對應項（來源 9、50） | 無 |
| 3 生產 | Salesforce 無原生製造執行場景 | 無，詳見細表。Salesforce 官方定位 Manufacturing Cloud 管車間以外（來源 9） | Field Service 的 WorkOrder 是服務工單（來源 13、14） |
| 4 成本 | 無生產成本場景 | 無。只有銷售協議層的成本與毛利指標（來源 10） | 銷售協議指標（來源 10、45） |
| 5 品檢與入庫 | 無品檢與完工入庫場景 | 無。Salesforce 缺品質檢驗批次，只有案件式品質追蹤（來源 27） | 無 |
| 6a 出貨、物流、送達 | Order Management | 部分到完整。出貨由出貨履行單（Fulfillment Order）承接（來源 33） | 出貨履行單（Fulfillment Order）、履行據點（來源 33） |
| 6b 售後服務單 | Service Cloud；Manufacturing Cloud for Service | 部分。有案件、保固、索賠（來源 34） | 案件（Case）、資產（Asset）、保固索賠（來源 8、34） |
| 6c 補做 | Salesforce 無此場景 | 無。查無「重新生產」對應流程 | 無 |
| 7 帳務（收款、發票、對帳、退款） | Revenue Cloud Billing；Order Management | 完整（國際通用流程）。台灣統一發票查無資料 | 發票（Invoice）、款項、貸項單（Credit Memo）（來源 32、33） |

各列的證據：

- 1a：MuleSoft 的 Salesforce 與 SAP 範本中，業務在機會加入產品、算報價、核准後建訂單（來源 19）。Revenue Cloud 官方頁列出定價引擎支援數量折扣、複合折扣、比例折扣（來源 18）。頁面沒有描述依印刷材料與工序累加報價的算式。
- 1b：B2B Commerce 支援個人化目錄、議價與預先談好的價格（來源 17）。變體商品每個有自己的 SKU，單一商品最多五個屬性（來源 47）。動態屬性讓價格隨選項更新，不必每種組合各一個 SKU（來源 46）。
- 2a：訂單摘要是單一紀錄，彙整各通路的訂單處理資料，反映目前狀態（來源 12）。異動單記錄取消與退貨，更新訂單摘要但不改原訂單（來源 12）。
- 2b：Manufacturing Cloud 官方能力清單（來源 9）與資料模型整理（來源 50）都沒有稿件審稿或打樣項目。
- 6a：訂單進 Order Management 後，自動流程建立出貨履行單並指派履行據點（來源 33）。出貨履行單存放承運商、運送方式、地址（來源 33）。
- 6b：Manufacturing Cloud for Service 提供保固計畫與索賠，客戶與夥伴可經入口網站提交索賠（來源 34）。官方服務頁未提退貨與送修流程（來源 34）。
- 7：Revenue Cloud Billing 涵蓋發票、款項、貸項單、催收、沖銷（來源 32）。Order Management 的發票記錄已收款項，支援與外部財務系統對帳（來源 33）。第三方文章指出 Salesforce 缺總帳與交易層級應收應付（來源 27）。

### 生產段逐物件細表

| 委託方項目 | Salesforce 原生物件或流程 | 判定 | 來源 |
|-----------|-------------------------|------|------|
| 品項主檔（現階段只有原物料） | 商品目錄（Product Catalog Management）管銷售用商品與資產資料；Product2 被銷售協議產品引用 | 部分。目錄服務銷售，不是原物料料號主檔 | 9、50 |
| 工序與裝訂主檔、製程路線 | 無 | Salesforce 無此場景。第三方文章把製程路線歸在 ERP 的製造執行 | 27、50 |
| 設備與產線 | 資產（Asset）用於客戶資產的服務與保固。無產線、工作中心物件 | Salesforce 無此場景（產線與工作中心） | 9、34、50 |
| 配方、BOM | 無 | Salesforce 無此場景。第三方文章稱 BOM 與工程變更不在原生功能內 | 27、50 |
| 工單與生產任務 | Field Service 的 WorkOrder 是為客戶執行的服務工作紀錄，子項為 Work Order Line Item | Salesforce 無製造工單。WorkOrder 是服務工單 | 13、14 |
| 派工 | 服務預約排程屬服務場景 | 生產派工 Salesforce 無此場景 | 34 |
| 報工 | WorkOrder 記錄服務完成的工作與用掉的零件 | 生產報工 Salesforce 無此場景 | 14 |
| 場內轉交與點收 | 無對應物件或流程 | Salesforce 無此場景 | 9、50 |
| 外包派單 | 無。採購流程在第三方文章中歸 ERP | Salesforce 無此場景 | 27 |
| 在製品 | 官方能力清單與資料模型都沒列 | Salesforce 無此場景 | 9、27、50 |
| 成本計算 | 銷售協議指標含成本與毛利，用於議價 | 生產成本、差異科目 Salesforce 無此場景 | 10、27 |
| 完工入庫 | 庫存只到可視與配置層級 | 完工入庫 Salesforce 無此場景。庫存可視為部分 | 9、27 |

補充說明：

- Field Service 官方教材舉的例子是太陽能板維護：一張 WorkOrder 追蹤一次到客戶現場的維護，子項為清潔、檢查（來源 13）。Salesforce 官方定義工單管理為建立、指派、追蹤、完成維護與其他現場服務請求（來源 14）。兩者都不是生產排程（來源 14）。
- 官方頁提到「製造業的維修單」是工單管理的例子（來源 14）。這仍然是修設備或修產品，不是生產流程。
- 出貨履行單的「履行據點」是出貨據點，會依產能上限接單、被拒絕時改派（來源 33）。這不是生產產線的產能。
- Manufacturing Cloud 官方頁說它支援「按庫存生產與按單生產」的製造商，但沒描述生產規劃或排程功能（來源 9）。
- 第三方資料顯示，若要在 Salesforce 平台上做製造執行，路徑是合作夥伴的產品，不是 Salesforce 自家雲。Rootstock 自稱在 Salesforce 平台原生提供 BOM、製程路線、工單、MRP、庫存、成本（來源 51）。24Flow 在 Salesforce 上提供視覺排程、工作站介面、無紙工時記錄，並稱它「執行 ERP 已規劃的內容」（來源 29）。這兩者都是第三方產品，不屬 Salesforce 自家解決方案。

## 二、導入顧問的商業分析與設計方法

先說明證據範圍。本組沒有找到 Salesforce 官方的 Manufacturing Cloud 導入指南。可用的官方材料是 Trailhead 的通用顧問與商業分析教材，加上 Architects 的決策指南。製造業專屬步驟來自有署名的顧問公司文章（來源 5、20），標為第三方。

### 顧問走的步驟

| 步驟 | 顧問做什麼 | 設計決策 | 來源 |
|------|-----------|---------|------|
| 準備 | 把銷售階段的知識交給交付團隊，建立 RACI（誰負責、誰核准、誰被告知）矩陣，擬專案計畫，辦啟動會 | 角色分工與專案範圍 | 36 |
| 探索 | 備妥背景、與關係人會談、再回頭確認需求有無誤解 | 需求的真實意圖 | 35 |
| 探索 | 用訪談、觀察、工作坊、流程建模、原型等技巧引出需求。許多需求只存在關係人腦中，很少有文件 | 引出方法的選擇 | 35 |
| 探索（製造業） | 確認商業模式：直銷或通路、按庫存生產或按單生產。選 2 到 3 個第一版成果，定成功指標 | 第一版範圍與指標 | 5 |
| 需求分級 | 把需求分成必要、想要、期待，並畫範圍框：框內是範圍、框外不是 | 範圍邊界 | 37 |
| 流程盤點 | 畫流程圖：步驟、誰做什麼、補充脈絡、成功怎麼衡量。理解流程會影響資料模型與指標 | 流程的現況與目標 | 15 |
| 流程盤點（製造業） | 對協議生命週期（建立、核准、檢視、修訂、續約或結案）定義誰更新、多久更新、什麼算「實際值」 | 實際值的定義 | 5 |
| 資料模型設計 | 為帳戶與階層、產品與單位、價格、訂單與出貨、歷史訂單各指定一個正本系統。產出資料字典與正本矩陣 | 各資料的正本系統 | 5 |
| 資料模型設計 | 用一組小樣本（10 到 20 個帳戶、50 到 100 個 SKU）提早驗證模型 | 模型能否承載真實資料 | 5 |
| 整合設計 | 判斷整合方式時看現有工具、方向、時機、使用者體驗、資料量、實作複雜度、可維護性、平台限制 | 整合工具與模式 | 22 |
| 整合設計 | 用 Salesforce 整合模式表選型：依方向（誰呼叫誰）、類型（流程、資料、虛擬）、同步或非同步 | 整合模式 | 43 |
| 整合設計（製造業） | 只帶入對照所需的最少實際值（訂單或出貨）。對應帳戶與產品鍵值，定義例外（退貨、取消、缺貨、分批出貨），並與 ERP 對帳 | 最少整合範圍與例外處理 | 5 |
| 整合設計（製造業） | 做資料稽核、寫資料對應文件、指定長期監控負責人 | 資料對應與負責人 | 20 |
| 架構審查 | 用 Well-Architected 框架的五項支柱（信任、可靠、營運卓越、資源與成本最佳化、公平）權衡取捨 | 取捨的依據 | 26、30 |
| 設計定案 | 規劃與架構階段定義功能需求、技術架構、設計，取得客戶簽核，再建立待辦清單 | 簽核後才開發 | 36 |
| 建置與上線 | 依待辦清單分批建置與驗收，部署後提供一段支援期 | 分批交付 | 36 |
| 上線（製造業） | 先以第一版帳戶小範圍試行，再分批擴大。建儀表板與指標定義，依角色訓練 | 試行範圍與擴大節奏 | 5 |

補充：

- 官方商業分析教材主張分析要在設計與建置之前做，連小專案也要（來源 15）。
- 這份模板的順序是先簽核範圍與設計，再依待辦清單分批建置，並在全程管理範圍變更（來源 36）。
- Architects 的決策指南共列八份，涵蓋流程自動化、非同步處理、表單、事件驅動、資料整合、Data 360 等（來源 24）。清單中沒有製造業或 ERP 專屬指南（來源 24）。
- 整合模式表有六種模式，包括請求與回應、發後不理、批次資料同步、遠端呼入、資料虛擬化（來源 43）。
- 整合指南說模式取自成功的導入經驗，Salesforce 顧問架構師在架構審查時以它為參考（來源 6）。這份指南頁沒有談「哪個系統是正本」（來源 6、22）。
- Architect 認證備考教材要求學員會判斷情境中的正本系統，並說明業務實體如何跨「紀錄系統」與「互動系統」相關聯（來源 23）。

### 商業分析的重點問題

顧問在製造業導入時，上述來源顯示會先問下列問題：

- 這家公司是按庫存生產還是按單生產（來源 5）。
- 第一版只做哪 2 到 3 個成果，怎麼量成功（來源 5）。
- 各類資料誰是正本（來源 5、20）。
- 「實際值」從哪個系統來、何時算數（來源 5、41）。

銷售協議的實際值有三種計算模式可選：從直接訂單自動算、經合約下的訂單自動算、經 API 手動上傳（來源 45）。這是設計時要拍板的一項決策（來源 45）。

## 三、官方對製造與生產的立場與參考架構

### Salesforce 官方怎麼分工

| 面向 | 官方說法 | 來源 |
|------|---------|------|
| 定位 | Manufacturing Cloud 是管理車間以外營運（銷售、服務、通路、資產）的 CRM 平台 | 9 |
| 與 ERP | 它扮演「互動層」，把 ERP 與物聯網系統的資料釋出，並串接銷售與營運規劃和後台資料庫 | 9 |
| 與 ERP（教材） | 平台可把訂單與庫存的後台資料，和銷售協議談判的前台資料合併呈現 | 42 |
| 與 ERP（部落格） | CRM 聚焦客戶關係。ERP 處理財務、庫存、人資、營運資料，並在成交後處理履行、帳務與營運面 | 40 |
| 製造執行 | Manufacturing Cloud 官方頁沒有描述生產規劃或排程，也沒有提到 MES | 9 |
| 資料 | Data 360 把 ERP、PLM、物聯網、夥伴系統的客戶、產品、資產資料集中，不必搬移資料 | 44 |

結論：Salesforce 官方沒有明文劃定「哪些留在 MES」。官方只說自己管車間以外，並且與 ERP 整合（來源 9、44）。MES 邊界的明確說法只出現在第三方文章（來源 27、29、21）。

### 第三方文章對分工的說法

- 第三方文章列出 ERP 的範圍含財務、採購、供應鏈與庫存、製造執行、人資、訂單管理。它說 Salesforce 缺總帳、生產排程與車間執行、BOM 與工程變更、採購流程、品質檢驗批次（來源 27）。
- Argano 的文章把角色分成：Manufacturing Cloud 產生報價與訂單、預測與需求資料；ERP 處理訂單並規劃生產與庫存；MES 提供生產排程、工單與車間活動，回報進度與品質（來源 21）。
- Fast Slow Motion 的文章把 ERP 說成「追蹤庫存、生產、履行與財務」，Salesforce 管客戶關係與銷售流程，並顯示來自 ERP 的訂單狀態、出貨日、發票、生產狀態（來源 20）。
- Softweb Solutions 的文章說核准後的預測會在連接的 ERP 觸發訂單釋出與庫存保留。它也說平台可引入 MES 的生產排程、機台指標與品質資料，供端到端的可視（來源 28）。

### MuleSoft 參考架構：正本各在哪一邊

| 範本 | 正本歸屬 | 流程 | 來源 |
|------|---------|------|------|
| Accelerator for SAP，訂單到收款（版本 1.3） | 明文：SAP S/4HANA 是產品與庫存的正本。訂單與價格未明文 | 業務在機會加產品，Salesforce 向 SAP 查庫存。機會結案成功後，SAP 建銷售訂單，Salesforce 建對應訂單 | 1 |
| Accelerator for SAP，報價到收款（版本 1.6） | 明文：PIM（產品資訊管理系統）是產品、庫存、定價清單的正本；SAP 持有定價條件。訂單與客戶未明文，但各系統間同步 | 報價算價時向 SAP 取淨價並驗證折扣，核准後 Salesforce 建訂單，再觸發 SAP 建單 | 19 |
| Accelerator for Manufacturing，穩定供貨業務管理（版本 1.0） | 頁面未明文指定正本 | SAP 把客戶與訂單送進 Manufacturing Cloud；PIM 送產品與價目表 | 3 |
| Accelerator for Manufacturing（最新文件） | 頁面未明文指定。用例含帳戶、產品、訂單由 ERP 同步到 CRM；回扣；設備維護 | 回扣依規則在 SAP 建貸項單；工廠設備資料經視覺化工具觸發維護工單。MES 頁面未提 | 2 |
| Accelerator for Salesforce OMS，OMS 對 ERP | 頁面未明文指定。出貨履行單狀態跟隨 SAP 銷售訂單階段（推論：SAP 帶動履行狀態） | 每張出貨履行單在 SAP 建一張銷售訂單，SAP 單號回寫履行單，出貨後回傳追蹤資訊，再由 OMS 把發票與款項送 SAP 對帳 | 31 |
| Accelerator for Retail，銷售訂單同步 | 主資料系統（MDM）只存主鍵與外部編號。訂單在各系統各一份，各以外部編號對應主鍵 | 訂單從通路進來，更新 MDM 後再更新下游 | 48 |
| NetSuite 報價到收款（MuleSoft for Flow） | Salesforce 管銷售管線，NetSuite 管訂單管理與財務 | 已接受的報價或成交機會可轉成 NetSuite 銷售訂單或發票，訂單變動可回映到 Salesforce | 49 |

觀察：

- 範本之間對正本的說法不一致。產品與庫存在 1.3 版歸 SAP，在 1.6 版歸 PIM（來源 1、19）。
- 訂單在 Salesforce 與 ERP 各有一份，以外部編號對應（來源 1、48）。
- 沒有一份開得起來的範本把生產或 MES 資料的正本歸給 Salesforce。範本中的 MES 若有出現，也只是整合對象（來源 2、3）。
- Dynamics 365 與 Oracle 的官方範本未能開啟查證，見「查無公開資料」。

MuleSoft 的三層介面做法也影響設計：系統層介面釋出核心「紀錄系統」資料（ERP、帳務、客戶系統），流程層串接多個系統做業務流程，體驗層給特定通路（來源 38）。

### Sales Agreement、Account Forecast、Rebate、庫存與製造執行的關係

| 能力 | 官方說法 | 與製造執行的關係 | 來源 |
|------|---------|----------------|------|
| 銷售協議（Sales Agreement） | 長期供貨協議，記錄計畫與實際的數量、營收、價格、折扣。實際值來自訂單 | 與生產排程無關。實際值可來自 ERP 或訂單管理系統。官方教材範例有 ERP 整合敘事 | 10、41、45 |
| 帳戶預測（Account Forecast） | 進階版可用資料處理引擎，從標準與自訂物件過濾、串接、彙總。可從外部系統匯入指標表 | 官方頁未提生產規劃。預測可分享給需求與財務規劃系統 | 10、25 |
| 回扣（Rebate Management） | 附加應用程式，管理回扣方案、資格規則、分級獎勵、核算與稽核 | 付款經 ERP 送出。MuleSoft 範本則在 SAP 建貸項單 | 11、2 |
| 庫存 | 官方列出庫存指標、庫存可視；教材範例中外部倉庫庫存匯入 Salesforce 當協議指標 | 庫存正本可留在外部系統（教材範例即如此） | 9、42、45 |

說明：Inventory Search（庫存查詢）的官方說明頁沒能開啟，本表不列（見「查無公開資料」）。

## 四、對委託方情境的對照（推論）

本段是本卡作者的推論，不是來源原文。推論依據已標在括號內。

### 推論一：只用 Salesforce 自家解決方案，覆蓋範圍止於前端與帳務

| 範圍 | 推論 | 依據 |
|------|------|------|
| 售前 | 線下接單與報價可用 Sales Cloud 與 Revenue Cloud。線上電商可用 B2B Commerce | 來源 17、18、19 |
| 訂單、出貨 | 可用 Order Management | 來源 12、33 |
| 帳務 | 可用 Revenue Cloud Billing 與 Order Management 的發票、款項、貸項單 | 來源 32、33 |
| 售後 | 保固與索賠可用 Manufacturing Cloud for Service | 來源 34 |
| 審稿打樣、生產、成本、品檢入庫 | 沒有 Salesforce 自家場景 | 來源 9、27、50 |

若委託方堅持只用 Salesforce 自家產品，顧問不會憑空補生產場景。顧問較可能提三條路之一：

| 路徑 | 利 | 弊 |
|------|---|---|
| A 外接 ERP 與 MES，Salesforce 管前端與帳務 | 官方與第三方都按此分工（來源 9、27） | 要整合，要決定訂單與產品的正本（來源 1、19、48） |
| B 在 Salesforce 平台上買合作夥伴的製造產品 | 資料在同一平台（來源 51、29） | 不是 Salesforce 自家解決方案，另有授權與依賴（需另查） |
| C 在平台上自建物件與流程 | 彈性高 | 本卡沒有查到官方指引，屬風險最高的路（無來源） |

建議：不做結論，交委託方依「是否接受第三方」決定。路徑 C 的官方指引查無（見「查無公開資料」）。

### 推論二：資料結構與委託方的設計方向有落差

- Salesforce 的商品目錄是銷售用商品（來源 9、50）。委託方的品項主檔現階段只放原物料。兩邊方向相反（依據：委託方範圍第 3 項，與來源 9、50）。
- Salesforce 的訂單與商品是兩個層次，變體商品每個有 SKU（來源 47）。委託方「訂單明細同時是產品定義」的做法，在 Salesforce 沒有看到對應說明。可能要靠動態屬性（來源 46）承接，這是推論，需驗證。
- 動態屬性讓價格隨選項更新（來源 46）。委託方的「選項綁材料、工序、裝訂、設備識別碼」要讓選項觸發製程，官方頁未描述這類綁定（見「查無公開資料」）。
- 銷售協議是長期供貨承諾，記錄計畫與實際（來源 10、41）。委託方以按單生產為主，每張單是一次性的印件。銷售協議可能只適用少數長期客戶的年約（推論）。

### 推論三：顧問會問委託方的問題

依來源 5、20 的探索問題清單，對照委託方範圍，顧問會問：

- 第一版只上哪幾個範圍，成功指標是什麼（來源 5）。
- 品項主檔、產品、價格、訂單、出貨，各由哪個系統當正本（來源 5）。
- 生產段若不在 Salesforce，哪個系統承接，訂單如何下推、完工如何回報（來源 5、20、21）。
- 「實際值」以什麼為準，例如出貨或報工（來源 5、45）。委託方的成本算式以報工數量重算，這個「實際值」要先講清楚（推論）。

### 推論四：對委託方生產段的結論

委託方最擔心的生產段，Salesforce 自家沒有場景：工單、品項主檔（成品與半成品）、製程路線、成本、產線、在製品、入庫都不在 Manufacturing Cloud 的範圍內（來源 9、27、50）。Field Service 的 WorkOrder 容易被誤認為製造工單，實際是服務工單（來源 13、14）。因此「只用 Salesforce」的答案是：前端與帳務可以，生產段要靠外部系統或第三方產品（來源 27、29、51）。

## 第一輪初步分析（Claude 寫）

- 觀察：Salesforce 自家產品的覆蓋止於售前、訂單、出貨履行、售後、帳務；生產段（品項主檔、製程、BOM、工單、派工、報工、轉交、在製品、成本、入庫）與審稿打樣、補做都無原生場景，官方定位是「車間以外」的互動層。這與 2026-06-14 的 Manufacturing Cloud 調研結論一致，本卡以新開的 51 條來源重新查證。
- 觀察：顧問方法的可借鏡處不在產品，在做法——先定商業模式（按單或按庫存）、先挑 2 到 3 個第一版成果與指標、為每類資料指定正本系統、用小樣本驗證資料模型、只帶最少實際值並定義例外。這四步對委託方的下一輪規劃流（T1 品號層）可直接套用。
- 觀察：MuleSoft 範本對「產品與庫存正本」的歸屬不一致（SAP 或 PIM），訂單在兩邊各一份以外部編號對應；可作為 EC 整合設計時「正本放哪」的對照素材。
- 候選相關卡：[[訂單]]、[[印件]]、[[工單]]、[[生產任務]]、[[EC 商品管理]]、[[ERP與MES建置專案]]；OQ [[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]。
- 同主題既有 raw：2026-06-14 Salesforce Manufacturing Cloud 調研（產品能力面）；本卡補覆蓋對照、導入方法與正本歸屬，不重疊、不合併。
- 候選 OQ 候補：本卡「待精練」列的兩題屬設計決策，留到下一輪規劃流 pre-check 判定是否開 OQ，本次不開。
- 候選升級路徑：不直接升級。供 `memory/erp/erp-mes-standard-alignment-20261028/Salesforce對照.md` 與下一輪規劃流引用。

## 來源

1. [MuleSoft Accelerator for SAP — Use case 3 Order-to-cash（1.3）](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-sap/minor/1.3/pages/Use case 3 - Order-to-cash/) — SAP S/4HANA 是產品與庫存正本的明文；機會結案成功後 SAP 建銷售訂單、Salesforce 建對應訂單的流程
2. [MuleSoft Accelerator for Manufacturing（最新文件）](https://docs.mulesoft.com/manufacturing/latest/) — 用例：帳戶、產品、訂單由 ERP 同步到 CRM；回扣在 SAP 建貸項單；設備維護工單。頁面未提 MES
3. [MuleSoft Accelerator for Manufacturing 1.0（Exchange）](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-manufacturing/minor/1.0) — 穩定供貨業務管理：SAP 客戶與訂單、PIM 產品與價目表進 Manufacturing Cloud；頁面未明文正本
4. [Trailhead：Get Started with Manufacturing Cloud（admin essentials）](https://trailhead.salesforce.com/content/learn/modules/manufacturing-cloud-admin-essentials/get-started-manufacturing-cloud) — 功能：銷售協議、帳戶預測、夥伴入口、計畫對實際；使用者角色；頁面未提 ERP 或 MES
5. [Fast Slow Motion：Manufacturing Cloud implementation steps](https://www.fastslowmotion.com/manufacturing-cloud-implementation-steps/) — 顧問公司（署名 Kaitlynn Sirotkin，2026-01-28）的探索、流程、資料模型、整合、上線步驟與產出物
6. [Salesforce Architects：Get Started with Data 360 and Integration](https://architect.salesforce.com/docs/architect/fundamentals/guide/get-started-data-360.html) — 整合模式指南取自成功導入；選型矩陣；Salesforce 顧問架構師用於架構審查；頁面未談正本
7. [Salesforce Architects 首頁（Architecture Center）](https://architect.salesforce.com/) — 架構中心的組成：Well-Architected、決策指南、模式；頁面未描述通用導入方法
8. [Salesforce Help：Manufacturing Cloud Data Model Objects](https://help.salesforce.com/s/articleView?id=sf.mfg_datacloud_data_model_objects.htm&language=en_US&type=5) — 只讀到選單：資料串流含 Case、Order、Order Item、Work Order、Work Order Line Item、Asset、Product 等；本文未能讀取；未見生產訂單、BOM、製程路線
9. [Salesforce：What Is Manufacturing Cloud?](https://www.salesforce.com/manufacturing/cloud/guide/) — 官方定位車間以外的 CRM；能力清單；ERP 互動層；未描述生產規劃或 MES
10. [Salesforce：Manufacturing Cloud for Sales](https://www.salesforce.com/manufacturing/cloud/sales/) — 銷售協議指標含數量、訂單、價格、成本、毛利；實際訂單可取自 ERP 或訂單管理系統；預測可分享給需求與財務規劃系統
11. [Trailhead：Get Insights and Plan Better with Account Forecasts（Manufacturing basics）](https://trailhead.salesforce.com/content/learn/modules/manufacturing-cloud-basics/get-insights-and-plan-better-with-account-forecasts) — 夥伴入口、回扣方案、回扣經 ERP 付款；帳戶預測只一筆提及
12. [Trailhead：Use Order Summaries（Order Management）](https://trailhead.salesforce.com/content/learn/modules/om-salesforce-order-management/om-use-order-summaries) — 訂單摘要、異動單、出貨履行單需 Order Management 授權；涵蓋訂單從擷取到售後
13. [Trailhead：Generate Work Orders（Field Service）](https://trailhead.salesforce.com/es/content/learn/modules/field_service_maint/field-service-generate-work-orders) — WorkOrder 追蹤為客戶執行的工作；太陽能板維護範例；Work Order Line Item；工作類型模板
14. [Salesforce：Work Order Management](https://www.salesforce.com/service/field-service-management/work-order-management/) — 工單管理定義為現場服務與維護請求；製造業只作為設備維護與維修單例子；未涉生產排程與庫存
15. [Trailhead：Understand the Value of Business Analysis](https://trailhead.salesforce.com/content/learn/modules/business-process-mapping/understand-the-value-of-business-analysis) — 分析在設計建置之前；流程文件化帶來清楚需求；流程理解影響資料模型與指標
16. [Trailhead：Process Mapping for Business Analysts](https://trailhead.salesforce.com/content/learn/modules/process-mapping-for-business-analysts) — 模組存在，三個單元：開始流程圖、流程圖語言、工具；本文內容未能讀取
17. [Salesforce：B2B Commerce](https://www.salesforce.com/products/commerce-cloud/b2b-commerce/) — 個人化目錄、議價、預先談好的價格、複雜商品設定、大單分批出貨；頁面未提 ERP 整合
18. [Salesforce：Revenue Cloud](https://salesforce.com/products/cpq) — 屬性式商品目錄、定價引擎（數量、複合、比例折扣）、報價設定器、契約、Billing；頁面未提 ERP 功能
19. [MuleSoft Accelerator for SAP — Use case 3a Quote-to-cash（1.6）](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-sap/minor/1.6/pages/Use case 3a - Quote-to-cash - Salesforce and SAP S4HANA/) — PIM 是產品、庫存、定價清單正本；SAP 持有定價條件；報價到訂單流程
20. [Fast Slow Motion：Salesforce Integration Strategies for Manufacturing ERPs](https://www.fastslowmotion.com/salesforce-integration-manufacturing-erp/) — 顧問公司文章：ERP 追蹤庫存、生產、履行、財務；三種整合方式；資料稽核與對應文件
21. [Argano：Unlocking the Full Value of Salesforce Manufacturing Cloud with Seamless Integrations](https://argano.com/insights/articles/unlocking-the-full-value-of-salesforce-manufacturing-cloud-with-seamless-integrations.html) — 顧問公司文章：Manufacturing Cloud、ERP、MES、PLM 各自角色
22. [Salesforce Architects：Get Started with Integration Decision Guides](https://architect.salesforce.com/docs/architect/decision-guides/guide/get-started-integration-decision-guides.html) — 整合決策因素：現有工具、方向、時機、使用者體驗、資料量、複雜度、可維護性、平台限制
23. [Trailhead：Review Data Model and Management（B2B 解決方案架構師備考）](https://trailhead.salesforce.com/content/learn/modules/b2c-solution-architect-cert-prep-architecture-and-integration/b2b-p2-data-model-and-management) — 學員須能判斷情境的正本系統；跨系統的資料架構
24. [Salesforce Architects：Architect Decision Guides](https://architect.salesforce.com/decision-guides) — 八份決策指南的清單與用途；無製造業或 ERP 專屬指南
25. [Trailhead：Explore Advanced Account Forecasting](https://trailhead.salesforce.com/content/learn/modules/advanced-account-forecasting-with-manufacturing-cloud/explore-advanced-account-forecasting) — 進階預測用資料處理引擎；可匯入外部指標表；未提生產規劃
26. [Salesforce Architects：Well-Architected Overview](https://architect.salesforce.com/well-architected/overview) — 五項支柱；框架用於權衡取捨；頁面未說明設計審查用法
27. [Minuscule Technologies：Is Salesforce an ERP?（2026-05-25）](https://www.minusculetechnologies.com/blogs/salesforce-manufacturing-cloud-vs-sap-oracle-erp) — 顧問公司文章：Salesforce 缺總帳、生產排程、BOM、採購、品質檢驗批次；庫存可視與軟性保留
28. [Softweb Solutions：Salesforce Manufacturing Cloud guide](https://www.softwebsolutions.com/resources/salesforce-manufacturing-cloud-guide/) — 顧問公司文章：核准預測觸發 ERP 訂單釋出；可引入 MES 資料；整合方式含 MuleSoft 與 AppExchange 連接器
29. [24Flow：Salesforce MES](https://24flow.eu/salesforce-mes/) — 合作夥伴產品：視覺排程、工作站介面、無紙工時；「不取代 ERP」；ERP 仍是訂單、BOM、銷售正本
30. [Salesforce 部落格：New Well-Architected Framework](https://www.salesforce.com/blog/new-well-architected-framework/) — 框架更新為五項支柱，舊版三項為 Trusted、Easy、Adaptable；取捨要明講
31. [MuleSoft Accelerator for Salesforce OMS — OMS to ERP Integration](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-salesforce-oms/minor/1.1/pages/e74-ta9/Salesforce OMS to ERP Integration/) — 每張出貨履行單在 SAP 建銷售訂單；單號回寫；出貨追蹤回傳；發票與款項送 SAP 對帳
32. [Trailhead：Navigate the Full Billing Lifecycle（Revenue Cloud）](https://trailhead.salesforce.com/content/learn/modules/billing-basics-in-revenue-cloud/navigate-the-full-billing-lifecycle) — 發票、款項、貸項單、催收、沖銷
33. [Trailhead：Streamline Order Fulfillment and Payment（Order Management）](https://trailhead.salesforce.com/content/learn/modules/om-salesforce-order-management/om-streamline-order-fulfillment-payment) — 出貨履行單、履行據點、運送資料；款項三階段；發票與貸項單
34. [Salesforce：Manufacturing Cloud for Service](https://salesforce.com/manufacturing/cloud/service) — 保固計畫、索賠；資產服務主控台並列工單、保固、案件、索賠；未提退貨
35. [Trailhead：Explore Techniques for Information Discovery](https://trailhead.salesforce.com/content/learn/modules/business-analyst_skills-strategies/explore-techniques--information-discovery) — 引出需求的技巧清單；準備、進行、確認三階段
36. [Trailhead：Get to Know the Template（專案管理計畫）](https://trailhead.salesforce.com/content/learn/modules/project-management-plan-lite/get-to-know-the-template) — 準備、規劃與架構、建置驗證部署支援、監控控制四階段
37. [Trailhead：Gather Requirements](https://trailhead.salesforce.com/content/learn/modules/best-practices-for-project-management/gather-requirements) — 必要、想要、期待；範圍框；需求要足夠詳細
38. [MuleSoft：Types of APIs](https://www.mulesoft.com/api/types-of-apis) — 系統層、流程層、體驗層介面的定義
39. [Salesforce：Consumer Goods Cloud](https://www.salesforce.com/consumer-goods/cloud/) — 消費品牌的 CRM；貿易促銷、零售執行、經銷商管理；未提生產
40. [Salesforce 部落格：What Is ERP?](https://www.salesforce.com/blog/what-is-erp/) — CRM 管客戶關係；ERP 處理履行、帳務與營運；許多公司兩者並用
41. [Trailhead：Track Sales with Agreement Terms](https://trailhead.salesforce.com/content/learn/modules/manufacturing-cloud-basics/track-sales-with-agreement-terms) — 銷售協議記錄計畫與實際；實際值來自訂單與合約；頁面未提 ERP
42. [Trailhead：Get Started with Manufacturing Cloud（basics）](https://trailhead.salesforce.com/content/learn/modules/manufacturing-cloud-basics/get-started-with-manufacturing-cloud) — 建構在 Sales Cloud 與 Service Cloud 上；三種版本；訂單與庫存的後台資料與前台合併
43. [Salesforce Architects：Integration Patterns](https://architect.salesforce.com/docs/architect/fundamentals/guide/integration-patterns.html) — 六種整合模式與依方向、類型、同步性的選型表
44. [Salesforce：Manufacturing 首頁](https://www.salesforce.com/ap/manufacturing/) — CRM 與 ERP、供應鏈整合；Data 360 集中 ERP、PLM、物聯網資料
45. [Trailhead：Configure Sales Agreements（admin essentials）](https://trailhead.salesforce.com/content/learn/modules/manufacturing-cloud-admin-essentials/configure-sales-agreements-to-negotiate-better) — 實際值三種計算模式；自訂庫存指標；ERP 整合敘事；外部倉庫庫存匯入
46. [Salesforce Help：Create Configurable Products with Dynamic Attributes in a B2B Store](https://help.salesforce.com/s/articleView?id=commerce.comm_create_configurable_products.htm&language=en_US&type=5) — 動態屬性隨選項更新價格；屬性式價格元件；不必每種組合一個 SKU
47. [Salesforce Help：Product Classes, Variations, and Attributes](https://help.salesforce.com/s/articleView?id=sf.comm_product_class.htm&language=en_US&type=5) — 單一、變體母項、變體商品；每個變體各有 SKU；最多五個屬性
48. [MuleSoft Accelerator for Retail — Sales order sync](https://www.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-retail/minor/2.1/pages/Use%20case%202%20-%20Sales%20order%20sync/?no_navbar=1&no_cookie=1&embedded=1&is_marketing=1) — 訂單在各系統各一份、以外部編號對應 MDM 主鍵
49. [MuleSoft 部落格：Quote-to-Cash with NetSuite（MuleSoft for Flow）](https://blogs.mulesoft.com/news/quote-to-cash-netsuite-mulesoft-for-flow-integration-templates/) — Salesforce 報價或成交機會轉 NetSuite 銷售訂單；NetSuite 管訂單與財務
50. [Valorx：Salesforce Manufacturing Cloud Data Model（更新 2026-05-06）](https://www.valorx.com/blog/salesforce-manufacturing-cloud-data-model-a-visual-guide) — 物件清單：銷售協議三件套、帳戶預測、回扣；未提生產訂單、工單、BOM、製程路線、在製品；ERP 整合載入實際值
51. [Rootstock：Manufacturing ERP Software Solution](https://clouderp.rootstock.com/manufacturing-erp-software-solution) — 合作夥伴官網自稱在 Salesforce 平台原生提供 BOM、製程路線、工單、MRP、庫存、成本；車間功能未描述

## 查無公開資料

- Salesforce 官方開發文件開不起來（回 403），物件欄位級資料拿不到：整合模式原頁、Field Service 核心資料模型、ProductItem 物件參考、出貨履行單物件參考、Sales Cloud 資料模型、Manufacturing Cloud 庫存預約物件參考。因此 ProductItem、Fulfillment Order 的欄位本卡不列。
- Salesforce Help 頁讀不到本文：銷售協議說明頁、產品與零件庫存管理頁、Experience Cloud 說明頁、Flow Orchestration 頁。Inventory Search（庫存查詢）的官方說明因此查無，本卡不寫它與製造執行的關係。
- 官方 Manufacturing Cloud 導入指南：搜尋找不到。本卡第二組只能用通用 Trailhead 教材加顧問公司文章。
- Industries 流程庫（process library）：搜尋找不到製造業對應頁。
- Salesforce Architects 針對製造業或 ERP 的決策指南：決策指南清單中沒有（來源 24）。
- 標準物件與自訂物件的官方選型指南：只找到第三方文章，未開啟，不採用。
- Salesforce 官方對 MES 邊界的明文：Manufacturing Cloud 官方頁與 MuleSoft 製造範本都沒提 MES（來源 2、9）。MES 邊界的說法只出現在第三方文章。
- 稿件審稿、打樣、印刷管理資訊系統（MIS）的 Salesforce 官方資料：查無。Salesforce 的審核流程（Flow 審核）能否自建審稿流程，因官方頁未能開啟而未驗證。
- B2B Commerce 把選項綁定到材料、工序、設備識別碼的官方說明：查無。
- Revenue Cloud 如何以材料與工序累加報價的官方說明：查無。
- 台灣統一發票與電子發票的 Salesforce 官方或合作夥伴方案：搜尋無結果。
- 場內轉交與點收、外包派單、在製品、完工入庫、補做的 Salesforce 對應物件或流程：查無。
- Dynamics 365 與 Oracle 的 MuleSoft 官方訂單整合範本：搜尋摘要有連接器與用例，但範本頁未開啟，本卡不列。
- Trailhead 流程圖模組的單元本文、Well-Architected 的設計審查用法：只讀到摘要或單元名。

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡（「related-vault」兩張為候選，本次未讀 wiki，未驗證卡名存在）
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）：候選議題為「生產段正本歸屬：外部 ERP／MES、第三方產品、或自建」與「訂單明細兼產品定義的對照做法」

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
