---
type: raw
status: raw
created-at: 2026-10-29
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - PrintVis
  - BusinessCentral
  - 導入方法
  - 覆蓋對照
  - 邊界釐清
  - MES
related-vault:
  - "[[訂單]]"
  - "[[印件]]"
  - "[[生產任務]]"
  - "[[工單]]"
  - "[[品項主檔]]"
  - "[[印件配方]]"
  - "[[部件配方]]"
  - "[[計價快照]]"
  - "[[品檢紀錄]]"
  - "[[成品庫存]]"
  - "[[審稿輪次]]"
  - "[[EC 商品管理]]"
  - "[[ERP與MES建置專案]]"
  - "[[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]"
raw-source-link: https://learn.printvis.com/Legacy/General/BCPV-Overview/
---

# PrintVis 承接印刷業務範圍的覆蓋與導入方法

> 摘錄重點，非全文轉錄。撰寫者為三個 Sonnet 研究代理（2026-10-29，分組抓取），主對話以 WebFetch 抽查 13 條來源（來源 2、3、6、8、14、16、21、25、54、56、64、82、85），全部相符。未抽查的來源是代理開啟後整理的摘要，仍標來源編號，但主對話沒有重驗。related-vault 由主對話核對卡名後補齊。

## 研究範圍與方法

委託方問題：一家印刷公司只用 PrintVis（含底層的 Microsoft Dynamics 365 Business Central，下稱 BC），PrintVis 的導入夥伴會怎麼做商業分析與設計。七個業務範圍各用什麼承接、承接到什麼程度。生產段的最佳實踐是什麼。

方法：用 WebSearch 找來源，再用 WebFetch 逐頁開啟確認。只列開得起來、內容與敘述相符的頁面。開不起來的頁面記在「查無公開資料」。

四項限制：

- WebFetch 回傳的是小型模型整理的摘要，不是逐字全文。頁面內的截圖、流程圖、設定工作表讀不到。
- learn.printvis.com 的頁面沒有署名，也沒有日期。WebSearch 多半搜不到這些頁，來源是依官方目錄與頁內連結直接開頁。
- Microsoft Marketplace 與 AppSource 的 PrintVis 相關頁回 HTTP 403 或 404，內容拿不到。
- PrintVis 官方沒有公開的導入階段表。第二組的導入步驟混用 PrintVis 官方設定導引、夥伴 Sabre Limited 的定價頁與文章、Microsoft 的通用導入指南。文中逐句標示身分。

標記規則：每個結論句後標（來源 N）。標「推論」的句子是本卡作者的判斷，不是來源原文。【PrintVis】指 PrintVis 自己的功能，【BC】指 Business Central 標準功能。

## 一、覆蓋對照

名詞說明：PrintVis 是建在 BC 之內的印刷管理資訊系統。官方自述涵蓋從報價到收款，並與 BC 共用資料庫、會計科目與報表引擎（來源 1、58）。PrintVis 以案件（Case）為頂層紀錄，一個案件含一或多個工作（Job）（來源 18）。

### 七範圍總表

| 委託方範圍 | 承接者與物件 | 承接程度 | 核心物件 |
|-----------|-------------|---------|---------|
| 1a 線下業務接單（需求、報價、成交轉訂單） | 【PrintVis】案件與估價；【BC】商機與行銷活動 | 完整。PrintVis 有自己的報價系統，取代 BC 的銷售訂單（來源 2） | 案件（Case）、狀態碼（Status Code）、估價、工作版本（Version）（來源 18、31、40） |
| 1b 線上電商（規格品，選項綁識別碼） | 【PrintVis】Web2PV 網店訂單匯入介面 | 部分。有訂單匯入介面，沒有網店本身。「選項綁材料、工序、設備」查無 | Web2PV 標頭、明細、組件、出貨四個結構（來源 16） |
| 1c 諮詢服務 | 無 | PrintVis 無此場景 | 無對應物件 |
| 2a 訂單、印件 | 【PrintVis】案件、工作、工作項目（Job Item） | 完整。工作加工作項目承接產品定義 | 案件、工作、印張（Sheet）、工作項目（來源 18、44） |
| 2b 稿件審稿、打樣 | 【PrintVis】製前訂單（Prepress Order）加外部製前系統 | 部分到無。有製前案件與 JDF 對接，審稿與打樣步驟頁面沒寫 | 製前訂單（來源 34） |
| 3 生產 | 【PrintVis】估價、排程、現場、工作成本 | 完整（PrintVis 自有做法，取代 BC 標準製造）。細表見下 | 計算單位、規劃單位、產能單位、電子工單（來源 2、22、30） |
| 4 成本 | 【PrintVis】工作成本（Job Costing） | 完整。估價、訂單、實際三層並列 | 成本中心費率、工作成本日記帳、工作成本報表（來源 20、50） |
| 5 品檢與入庫 | 【PrintVis】品質保證檢核表；釋出成品 | 品檢為部分（只有檢核表）；入庫為完整但選配 | 品質保證（QA）檢核表、釋出成品（Release Finished Goods）（來源 14、21） |
| 6a 出貨、物流、送達 | 【PrintVis】出貨單；第三方承運商整合 | 出貨完整。物流為部分（包裹承運商整合） | 出貨卡（Shipment Card）、nShift、EasyPost（來源 5、23、41） |
| 6b 售後服務單 | 【PrintVis】客訴登記 | 部分。有客訴登記與貸項，沒有獨立服務單與狀態機 | 客訴（Complaints）（來源 10、11） |
| 6c 補做 | 【PrintVis】額外工作碼、複製案件 | PrintVis 無專用補做流程。只有近似工具 | 額外工作碼、複製案件或工作（來源 12、13） |
| 7 帳務（收款、發票、對帳、退款） | 【PrintVis】組發票內容；【BC】銷售發票、收款、對帳 | 開發票完整；收款與對帳靠 BC；退款只見客訴觸發的貸項 | 銷售發票、貸項單（來源 6、11、27） |

各列的證據：

- 1a：PrintVis 有自己的報價系統取代銷售訂單，案件承載從詢價到開票的資料（來源 2）。案件狀態從詢價（Request）、報價（Quote）走到訂單（Order）（來源 18、31）。轉訂單時保留報價行，新增一行訂單行，工作號碼不變、版本號加一（來源 18）。商機（Opportunity）是 BC 標準功能，PrintVis 可從商機直接建案件，商機成交或流失會連動案件狀態碼（來源 4、40）。流失時記拒絕代碼（來源 35）。粗估報價可用快速報價與估價範本精修（來源 4）。
- 1b：電商或客戶入口網站的訂單經 Web2PV REST 介面送入，在未處理前可修改或刪除，之後由排程或人工轉成案件（來源 16）。可供網路下單的選項限於勾了「Web Extranet」或「External Web」的產品群組、格式碼、後加工類型（來源 16）。官方頁沒有寫這些選項如何綁定材料、工序、設備，也沒有寫是否自動建估價（來源 16）。夥伴說網店適合小單，大客戶用 XML、JDF 或系統對系統接單（來源 60）。BC 銷售訂單也可反向觸發：品項勾「Sales Order Auto Create Case」，加進銷售報價或訂單時自動建案件（來源 15）。
- 1c：開得起來的頁面都沒有諮詢服務對應物件。製前訂單是不涉及印刷的案件類型，涵蓋到客戶打樣核准為止，它不是諮詢服務（來源 34）。
- 2a：一個案件含多個有效工作，每個工作號碼是一個獨立產品，各有估價、排程、出貨（來源 18）。工作可有多個版本，同一時間只有一個版本有效（來源 18）。工作項目是「產品組件的技術定義」，欄位含組件類型、頁數、正反面色數、拼版型式、紙張（來源 44）。
- 2b：製前訂單由成品品項建立，Case 進入 Esko 製前狀態碼時送 JDF 給 Esko Automation Engine，依 JMF 回覆更新品項屬性（來源 34）。該頁只在簡介提到「客戶打樣核准」，沒有核准步驟（來源 34）。品質保證檢核表是生產品管，不是稿件審稿（來源 14）。
- 4：成本三層與費率見「生產段逐物件細表」。
- 5：品檢見細表。釋出成品經標準 BC 品項日記帳入庫（來源 21）。
- 6a：出貨卡記錄訂單出貨或無訂單的手動出貨，含分批比例、棧板與包裝、地址標籤、送貨單、追蹤號、運費與額外費用（來源 23）。出貨過帳依設定分三種：不建銷售訂單、每次出貨建銷售訂單、每次出貨建並過帳（來源 23）。nShift 整合可建出貨、合併出貨、取包裹標籤、取運費報價、回填追蹤號（來源 41）。
- 6b：客訴登記連到被客訴的訂單，記客訴代碼、描述、造成瑕疵的部門或供應商（來源 11）。可建固定金額貸項，貸項行填訂單編號才會影響該訂單的工作成本（來源 11）。貸項可轉成對供應商的發票（來源 10、11）。官方頁沒有獨立服務單，也沒有狀態機（來源 10、11）。
- 6c：客訴頁提到客訴會導致貸項或重做，但沒有寫重做流程（來源 10）。額外工作碼記錄多耗的時間與材料，可設為可向客戶計費，或設為成本照算但售價為零（來源 13）。複製案件把案件與有效工作 1:1 複製成新案件，估價原樣複製，需重算（來源 12）。頁面沒有重印、補做、錯誤成本的專屬物件（來源 12、13）。
- 7：PrintVis 的發票就是 BC 標準銷售發票，直接過帳到總帳科目，因為多數客戶不為生產結果建品項與庫存（來源 6）。發票行可來自確認金額、PrintVis 出貨或 BC 已過帳出貨，可不出貨就開票，可超交（來源 6）。官方財務頁列出 BC 標準的銀行帳戶、自動開支票與銀行對帳、付款條件與折扣（來源 27）。PrintVis 的總帳過帳不使用 BC 的一般產品過帳群組，改用一般業務過帳群組搭配訂單類型、客戶群組、計量單位（來源 7）。收款與退款的 PrintVis 專屬功能開得起來的頁面都沒有寫（來源 6、27）。信用額度由案件狀態碼設定檢查點，超額時警告或擋下（來源 45）。

### PrintVis 與 BC 的分界

| 面向 | 說法 | 來源 |
|------|------|------|
| 報價與訂單 | PrintVis 自有報價系統取代 BC 銷售訂單 | 2 |
| 製造 | PrintVis 估價取代 BC 製造的製程路線與物料清單；不需要 BC 製造功能，也不需要 Premium 授權 | 2 |
| 排程 | PrintVis 排程板取代 BC 的資源排程與排程板 | 2 |
| 現場 | PrintVis 取代 BC 的車間介面，工單資訊顯示在工作單、生產磚與提示 | 2 |
| 出貨 | BC 銷售出貨為選用；PrintVis 有自己的出貨卡 | 2、5 |
| 品項與庫存 | 用 BC 品項表加 PrintVis 欄位；庫存、採購、帳務用 BC | 3、58 |
| 發票 | PrintVis 組內容，載體是 BC 銷售發票 | 6 |
| BC 標準製造（Production BOM、Routing、Production Order） | 另購選配「Production Manufacturing」，夥伴說只在有大量製造設備時才需要 | 56 |

### 生產段逐物件細表

| 委託方項目 | PrintVis 或 BC 的物件與做法 | 判定 | 來源 |
|-----------|---------------------------|------|------|
| 品項：成品與半成品要不要建品號 | 成品品項是帶 PrintVis 設定的 BC 品項。官方明說接單生產或商業印刷不需要成品品項，PrintVis 可以不用任何 BC 品項就出貨與開票。品項卡「登記原料、半成品與成品」，PrintVis 另加 100 多個欄位 | 成品品號選用；半成品沒有專屬建模 | 3、37 |
| 品項：紙張與油墨、單位換算 | 紙張欄位含寬、長、重量與計價單位。「PrintVis 庫存單位」把 BC 基本單位對應到張、公尺、平方公尺；「PrintVis 價格單位」連結價格單位與庫存單位。例：估價用公斤、庫存用張，1,004 公斤對應 10,650 張 | 完整 | 3、24 |
| BOM 與製程 | 計算單位（Calculation Unit）綁成本中心，含工序行（時間）與品項行（材料），用公式算數量或時間。工作項目上以「單位清單」（List of Units）組合，主印刷機排第一行。估價取代 BC 的 Routing 與 BOM。沒有標準 BOM | 完整，以 PrintVis 方式取代 | 2、22 |
| 工單：Job 與 Production Order 的關係 | PrintVis 的工作是案件內的產品單位，不是 BC 生產單。狀態碼的「Production Order」指案件內另建的工作版本。官方頁沒有寫它會建立 BC 生產單。狀態碼頁有「Prod = Sale」整合勾選，所指生產單是否為 BC 生產單頁面未寫 | PrintVis 自有；BC 生產單路徑存在但另購 | 2、18、31、56 |
| 派工 | 規劃單位連到計算單位取得計算時間，經產能單位的效率係數轉成計畫時間，排到產能單位行事曆。系統在工作達到允許排程的狀態時產生規劃單位。官方頁沒有描述派給人員 | 排程完整；派給人員頁面沒寫 | 30、52 |
| 報工 | 現場觸控介面與電子工單：開始、停止計時，可即時過帳或交他人核准後過帳。工時與品項耗用登在 PrintVis 消耗日記帳。產出數量附在工時登錄上，進工作成本分錄。機台資料採集整合以開始與停止檔掃描資料夾 | 完整 | 19、20、53 |
| 在製品（實體位置） | 生產追蹤在 BC 標準庫存之外進行，不產生過帳。用 PrintVis 的 SF Production Zone 與 SF Production Storage 兩個位置。成本中心開啟標籤列印後，在工時登錄中建生產標籤。消耗標籤只標記已消耗，案件封存時才移除 | 完整，輕量，不入庫存帳 | 54 |
| 在製品（會計） | WIP 日記帳：定義為尚未封存訂單上已採購或已消耗的材料或服務，加上投入工時。四種方法：無、依完成百分比（Earned Sales）、完工工作單一科目、完工工作多科目。頁面明說這是會計面，沒有倉位或車間位置 | 完整（會計面） | 28 |
| 在製品（領料） | 工作領料與撿料：依倉庫設定產生倉儲移動工作表、內部移動工作表，或材料交付日記帳，之後走 BC 標準倉儲流程 | 部分 | 29 |
| 成本 | 估價三層：報價估價、訂單估價、實際工作成本，在工作成本報表並排，顯示金額與百分比。工時成本 = 時數 x 成本中心時薪，工序可有專屬時薪。品項成本可選庫存值、標準成本、最近採購價、平均成本。實際成本來源：工時、庫存品項、財務分錄、外包採購發票 | 完整 | 20、50 |
| 品檢 | 品質保證（QA）是「可自訂的生產品質管制檢核表」。依客戶群、客戶、訂單類型、產品群組、環保標章代碼決定套用哪份。分一般、換版、生產三階段，必填題擋住「工作完成」或「開始換版或生產計時」。頁面沒有寫拒收代碼、抽樣、檢驗批、與庫存或出貨的連結 | 部分（檢核表，無檢驗批與不合格處置） | 14 |
| 完工入庫 | 釋出成品（Release Finished Goods）寫標準 BC 品項日記帳，品項分類帳類型為 Purchase。單位成本由品項品質（Quality）的「入庫值」決定：估價直接或總成本、工作成本直接或總成本、品項成本、標準成本、零值。成本在過帳時取定，之後不隨成本異動調整。另有出貨卡的「放入庫存」（Put On Stock），出貨時在背景建銷售訂單與已過帳銷售出貨以產生庫存。官方頁說釋出成品「通常不用於接單生產公司」 | 完整，但選配；接單生產廠通常不用 | 3、21、23 |
| 外包 | 估價端：計算單位加外包品項，可設「基本價、每千件加價、固定開辦費」，數量變動自動重算。採購端：用虛擬品項（不可消耗過帳、不帶庫存值），經採購引導（Purchase Guide）建 BC 標準採購單，採購單以發票過帳後金額進工作成本。出貨卡顯示前三個外包品項的供應商 | 完整，PrintVis 加 BC 採購 | 8、9、23、42 |
| 重工與補做 | 額外工作碼（現場稱 waste codes）、複製案件或工作、客訴連貸項。無專用重印或補做流程 | PrintVis 無此場景（只有近似工具） | 12、13、11 |
| 審稿與打樣 | 製前訂單加 JDF 對接 Esko；打樣核准步驟頁面沒寫 | 部分 | 34 |

補充說明：

- 前人 2026-06-14 的調研把「PrintVis Storage」當在製品位置。本次兩者分開：「PrintVis Storage」是案件資料歸檔，把舊案件表搬到雲端以釋放效能，不是在製品（來源 25）。在製品位置是生產追蹤頁的 SF Production Zone 與 SF Production Storage（來源 54）。
- 估價有兩種「版本」。案件內的版本是不同數量或頁數的替代估價，以及詢價、報價、訂單類型的工作行（來源 18、49）。「Versioning」功能是產品部件如何組合到印張，例如多語言小冊（來源 48）。
- 同一狀態內只有一個版本作用，所以報價版與訂單版可同時作用；只有作用中版本會印出工作單（來源 49）。
- 複製案件不更新主檔，也不套用現行速度、成本、價格，需重算（來源 12）。

## 二、導入夥伴的商業分析與設計方法

先說明證據範圍。PrintVis 官方沒有公開的導入階段表，也沒有「夥伴問客戶哪些問題」的清單。可用的資料有四類：PrintVis 官方設定導引（來源 64、77）、夥伴 Sabre Limited 的定價頁與文章（來源 56、60、81）、Microsoft 的通用導入指南（來源 82 到 92）、其他印刷管理資訊系統廠商的旁證（來源 93、94、95）。

### 官方與夥伴的導入路徑

| 項目 | 內容 | 來源 |
|------|------|------|
| 官方：30 天試用 | 五段影片依序：安裝 BC 試用版加 PrintVis；估價並送報價；採購管理（報價轉訂單、向廠商買紙、入庫、採購發票）；工作單與工作排程；工作成本與開立發票 | 80 |
| 官方：上線導引（Onboarding） | 入門模組依序：基本設定、案件管理、資料夾管理、使用者欄位、工時登錄。模組有相依，依序設定。採漸進式導入。進階模組可能需要導入夥伴協助 | 77 |
| 官方：夥伴角色 | 全球導入夥伴負責導入與支援，依客戶需求與在地要求調整。大型專案建議讓有經驗的 PrintVis 顧問進入指導委員會 | 78、79 |
| 夥伴 Sabre：固定費用套件與時程 | 三種套件：Bronze 約 5 個月、Silver 約 7 個月、Gold 約 9 個月。之後上線約 1 個月密集支援，過渡約 2 個月。這是單一夥伴的定價頁，不能當 PrintVis 全體的常態週期 | 56 |
| 夥伴 Sabre：套件分級判準 | Bronze 不支援重大客製與第三方附加；Silver 有限客製與部分附加；Gold 幾乎任何客製與多數附加。程式開發費與附加元件授權另計 | 56 |
| 夥伴 Sabre：訓練分區 | 財務、貿易（庫存、採購、案件）、PrintVis 估價（成本中心、物料、速度與損耗表、公式、價目表）、PrintVis 製造（排程、工作成本與工時回報、拼版、瓶頸排程）、一般（範本、資料載入、文件管理、Power BI） | 56 |
| 夥伴 Sabre：專案管理 | 不含固定價，另收月費，從專案開始到上線後 15 個月 | 56 |
| 夥伴 Sabre：成敗關鍵 | 流程對齊：把實際車間流程對映進系統、統一估價與成本邏輯、備妥乾淨遷移資料。獨立的印刷管理資訊系統會產生客戶、品項、工作的重複資料。須訓練使用者理解生產決策如何影響財務報表 | 39 |

各階段「誰負責、產出什麼」，PrintVis 與 Sabre 的公開頁面都沒有列（來源 56、77、78）。

### 印刷業先建什麼主檔、順序

PrintVis 官方設定導引（Assisted Setup）是最明確的一手依據。順序由上而下，共 22 節，頁面明說「成本中心」要等「部門」完成才能開始（來源 64）。預選資料經 Web Service 從參考資料庫帶入，含常用成本中心、狀態碼、格式碼、部門、元件類型（來源 64）。

| 順序 | 設定項 | 備註 | 來源 |
|------|--------|------|------|
| 1 | 使用者 | 從頂端開始往下做 | 64 |
| 2 | 狀態碼、元件類型、格式碼、品項類型碼、品項品質、色彩表 | 由參考資料庫預帶 | 64 |
| 3 | 訂單類型、產品群組 | 用於生產與銷售統計，掛在案件上；可取消不需要的項目、改成自家代碼與名稱 | 71、72 |
| 4 | 部門 | 先決定部門結構（含生產部門在工作單上如何拆分），再設成本中心 | 70 |
| 5 | 成本中心 | 代表一台機器、一項功能、一個工作站或一個人，帶固定時薪。必須掛在一個部門。匯入機台組態時自動建對應的計算單位 | 17、65 |
| 6 | 成本中心費率、附加費率 | 變動成本加人工成本 = 直接成本；加間接費用 = 總成本；加淨利率 = 售價。頁面強調總成本與售價對準確估價至關重要 | 69 |
| 7 | 品項（紙、版等） | 有價目表代碼時直接成本欄留空；無價目表時強烈建議填「PrintVis 直接成本」 | 73 |
| 8 | 營業時間、里程碑、計量單位、額外工作碼、發票範本 | 計量單位在這裡指工作成本的「作業」：人工時、物料、外包 | 64、74 |
| 9 | 設定套件、資料對映 | 客戶、廠商、品項等主檔由 Excel 批次匯入，逐張驗證後再匯入下一張 | 75 |

估價結構的建置順序：先建成本中心，再建組態（Configuration），再建計算單位（來源 66、67）。組態分基本（可獨立運轉的主機）與附加（如上光、上膠，不可獨立運轉），各有自己的成本與利潤費率、損耗表、作業、速度表、價目表（來源 66）。一台印刷機通常需要 2 到 3 個計算單位：機器單位、單位清單用的單位，有時另加製版單位（來源 67）。公式編號 1 到 999 為系統公式，自訂公式從 1000 起，引用他公式者編號須較大（來源 68）。已被估價使用的計算單位不可刪除，只能取消（來源 67）。

### 怎麼驗證估價

- PrintVis 官方與夥伴都沒有公開「用歷史工作重算比對」或「平行運行」的正式方法。計算公式頁明確沒有測試章節（來源 68）。
- 官方可用的機制：生產分析（Production Analysis）可依工作、成本中心、員工或類別比較預估與實際時間（來源 59）。官方指出總成本與售價的正確性「對準確估價至關重要」（來源 69）。試用指引內含「用試用資料估價並送出報價」一課（來源 80）。
- 工作成本比對估價靠「作業綁定的計量單位」。登記的粒度若與估價的計量單位不一致，就看不到逐作業差異。官方建議合併為較粗的計量單位（來源 20）。
- Microsoft 的通用方法：遷移資料至少在系統整合測試與使用者驗收測試環境各測一次（來源 88）；切換前在測試環境做模擬切換，重複到有把握（來源 89）；測試案例要連回所驗證的業務流程（來源 90）。Microsoft 切換頁沒有提平行運行（來源 89）。
- 旁證（其他印刷管理資訊系統廠商，非 PrintVis）：Avanti 提到客戶新舊系統並行兩週，並在驗證階段用真實工作測試（來源 94）。

### Business Central 的導入方法論

| 面向 | 內容 | 來源 |
|------|------|------|
| 階段 | Success by Design 現行頁分五個與方法論無關的階段：Discover、Initiate、Implement、Prepare、Operate。同一網站的導入指南總覽頁寫的第一階段是 Strategize，兩頁名稱不一致 | 82、83 |
| 必做審查 | 方案藍圖審查（Solution Blueprint Review）與上線整備審查（Go-live Readiness Review）為必做。方案藍圖審查在 Discover 階段開始 | 82 |
| 切換 | Prepare 階段定義切換計畫（含上線與否的決策標準）、排模擬上線、備部署手冊 | 82 |
| 以流程為骨架 | 用業務流程目錄定義範圍，先畫現況再畫未來流程；建置階段避免不必要或零散的客製 | 84 |
| Fit-to-standard | 每個專案都做。步驟：下載流程目錄、依目錄由高層核心流程到細項逐步評估、依目錄二級流程領域辦工作坊、再配置。目標是「盡量採用標準，只在有理由時調整」（adopt wherever possible, adapt only where justified） | 85 |
| Fit-gap | 在 fit-to-standard 與配置之後才做。客製或擴充前先評估開發維護成本、對可用性與效能的影響、被 Microsoft 新功能取代的風險、替代做法（Power Platform、夥伴方案） | 85 |
| 先標準後客製 | 有。「不要複製舊系統」：複製舊系統功能會得到高度客製、技術債與維護成本 | 85、87 |
| 資料遷移 | 資料分配置資料與遷移資料。遷移策略要寫來源與目標、載入順序與相依、角色。遷移不與其他測試併行 | 88 |
| BC 專屬遷移工具 | 新公司可用設定套件（RapidStart）與問卷匯入主檔，再用日記帳補期初餘額。設定套件只用於首次設定，已上線公司改用 XMLport | 91 |
| 客戶自己的責任 | 定義範圍、來源資料品質、訓練、使用者驗收、安全定義、切換管理、預算、組織變革 | 86 |
| 適用規模 | 導入指南明說適用中型與大型組織；小型企業可先看 BC | 83 |

### 商業分析的重點問題

- 本次沒有找到 PrintVis 夥伴公開的「問客戶哪些問題」清單。產品類型、按單生產或備貨、估價方式、外包比例這幾題，沒有來源把它們列為導入問卷題。
- 夥伴 Sabre 的套件分級判準隱含要問的範疇：是否有製造與工作成本分析、是否需要倉儲、是否需要 JDF 整合、是否需要客製與附加元件（來源 56）。
- 需早拍板的設計決策：部門結構（官方明說先決定部門結構再設成本中心）（來源 70）；訂單類型與產品群組（統計維度，上線時就要定）（來源 71、72）。
- 常見失敗點（來源 93，印刷管理資訊系統廠商 Dataline 的行銷文，非 PrintVis）：選沒有印刷專業的供應商、讓會計師選系統、用倉儲導向模型做按單生產、先上網店再做後台。
- 外包：外包是計算單位的用途之一，也是計量單位類別之一（來源 67、74）。沒有來源把外包比例當導入題。

## 三、PrintVis 對生產段的建議做法

### 估價是生產計畫的資料來源

- 估價是報價、建立訂單、規劃生產三件事的共同基礎（來源 46、47）。
- 估價給生產的是計算單位。系統在工作達到允許排程的狀態時，由計算單位翻譯出規劃單位，經產能單位的效率係數把估價時間轉成計畫時間（來源 30、52）。規劃單位可依「規格」設定在工作內合併或拆分：預設每個產能與印張一行，另有合併工序、合併印張、不合併等（來源 30）。
- 用料走採購引導：它列出估價中需要採購的材料行，可建採購報價、採購單或需求工作表行（來源 42）。工單層的材料需求由「材料需求」彙整，含估價數量與單位、庫存可用日（來源 24）。
- 估價變更後既有規劃單位怎麼處理，官方頁沒有寫。只有一句：狀態碼設定變更須手動套用到所有訂單的規劃單位（來源 30）。

### 工作成本比對估價與實際

- 實際成本三個來源：工時與庫存品項消耗（進消耗日記帳）、外部採購如外包（採購發票上註記訂單編號）（來源 20）。
- 工時也可由電子工單的開始與停止、工作成本日記帳進來（來源 28、55）。案件換到指定狀態碼時可自動入帳工時與消耗，條件是品項的計量單位設為自動成本（來源 51）。
- 差異怎麼看：工作成本報表並排報價估價、訂單估價、實際工作成本，最右欄把正常計算與實際並列金額與百分比（來源 50）。欄位含直接成本（材料、外包、工時）、預期成本（尚未入帳發票）、貢獻毛利、利潤與利潤率、內部錯誤成本、客戶額外工作成本（來源 50）。官方頁的部分公式看起來像文件筆誤，使用前須對照系統（來源 50）。
- 費率：只有成本中心時薪與作業專屬時薪，沒有獨立的機台費率（來源 20）。

### 成品是否入庫

- 官方明說：商業印刷或接單生產不需要成品品項，PrintVis 可以不用任何 BC 品項就出貨與開票（來源 3）。
- 釋出成品是「為生產出來的品項建立庫存」的選配功能，官方說通常不用於接單生產公司（來源 3、21）。夥伴也說 PrintVis 不需要為每次生產建新品號，很適合很少重複、重複時要重新報價的產品（來源 56）。
- 要入庫時：釋出成品寫標準 BC 品項日記帳，成本取估價、工作成本、品項成本或零值（來源 21）。出貨時也可用「放入庫存」（來源 3）。
- 成品品項可只為開發票而存在：工作版本的「成品品號」欄在沒勾「從庫存取」時，可用來建發票行或做入庫（來源 48）。
- 重複生產的成品品項可當範本載體，指向範本案件的案件編號、版本、工作（來源 3）。

### 網店訂單怎麼進 PrintVis

- 網店訂單經 Web2PV REST 介面進入暫存結構，處理後轉成案件。標頭對應案件、明細對應工作、組件對應工作項目、出貨對應出貨（來源 16）。
- 轉案件可自動（排程的工作佇列）或人工（在標頭清單按「Process Web2PV orders to cases」）。案件建立時的狀態碼由網店前端設定決定（來源 16）。
- 官方頁沒有寫網店商品選項如何對應到估價或規格，也沒有寫是否自動建工作與估價（來源 16）。
- 此介面是 2024 年新增的功能，由廠商新聞稿宣布（來源 59）。

### Business Central 標準製造在 PrintVis 情境下用不用

- BC 標準製造用 Production BOM 定義元件、Routing 定義工序、工作中心與機台中心建模產能與成本、生產單協調消耗與產出；此功能需要 Premium 體驗（來源 33）。生產單狀態：Simulated、Planned、Firm Planned、Released、Finished；Simulated 可用於報價與成本估算，不影響物料需求規劃（來源 61）。
- PrintVis 官方說估價取代 BC 的製程路線與物料清單，不需要 BC 製造功能與 Premium 授權（來源 2）。PrintVis 的排程頁與規劃單位頁完全沒有提到 BC 生產單（來源 30、52）。
- 夥伴 Sabre 說 PrintVis 用自己的案件與工作做生產，「有別於 BC 標準的開箱即用製造」（來源 56、57）。
- 並用路徑存在：另購選配「Production Manufacturing」含 BOM、Routing、生產單管理、倒沖、MPS 與 MRP，夥伴說只在有大量製造設備時才需要（來源 56、57）。
- 沒有夥伴文章說明「重複性成品、包裝、非印刷組裝」何時改用 BC 標準製造（來源 57）。

### 外包

- 估價端：外包是計算單位加外包品項，可設基本價、每千件加價、固定開辦費（來源 9）。
- 採購端：虛擬品項經採購引導產生 BC 標準採購單，發票過帳後金額直接顯示在 PrintVis 工作成本（來源 8、42）。工作成本欄位把外包分成「直接成本」與「預期成本（尚未開發票）」兩欄（來源 50）。
- BC 標準做法對照：外包工作中心加製程路線作業加外包採購單，成本自動記到生產單（來源 63）。PrintVis 走的是品項與估價行，不是製程路線（來源 8、63）。

### 重工與補做

- 額外工作碼的「可計費」選項讓額外量自動帶進發票草稿，常見於客戶造成；「供應商錯誤」旗標標示廠商造成（來源 13）。
- 官方頁沒有寫重印要開新工單、新案件或在原案件補做，也沒有寫錯誤成本的計算細節（來源 10、13）。

### 現場報工與在製品

- 官方建議的現場回報是觸控介面與電子工單。選項含同時進行的工作數、間接時間、班組人數、條碼、機台整合（來源 53）。
- 產出數量附在工時登錄上，過帳後成為工作成本分錄上的註解行（來源 19）。
- 在製品移動用生產標籤追蹤，不走 BC 標準庫存過帳（來源 54）。

## 四、對委託方情境的對照（推論）

本段是本卡作者的推論，不是來源原文。推論依據標在括號內。

### 推論一：PrintVis 的按單生產做法與委託方現況在三處同向

| 面向 | PrintVis | 委託方 | 依據 |
|------|---------|--------|------|
| 成品與半成品品號 | 成品品號選用，接單生產不需要；半成品沒有專屬品號，以生產標籤追蹤 | 品項主檔只有原物料，無成品與半成品品號 | 來源 3、54 |
| 完工後的數字 | 產出數量附在工時登錄上；釋出成品入庫是選配，接單生產通常不用 | 完工良品與可出貨額度由印件層算出，沒有成品倉 | 來源 3、19、21 |
| 在製品 | 在 BC 庫存之外，用位置與標籤追蹤，不產生過帳 | 無在製品帳 | 來源 54 |

### 推論二：PrintVis 與委託方的差異

- 用量的角色不同。PrintVis 的計算單位把工序行與品項行放在一起，用公式算數量，用量進估價成本，也進材料需求供採購使用（來源 22、24）。委託方的配方「用量只作參考」，用量不驅動成本與採購（依據：委託方範圍第 3 項）。
- 庫存與差異科目。PrintVis 借 BC 的庫存、品項分類帳與會計過帳，有在製品會計四種方法與三層成本差異（來源 28、50）。委託方沒有庫存模組、在製品帳、差異科目（依據：委託方範圍第 4 項）。這是 PrintVis 靠 BC 底座才有的能力，不是 PrintVis 自己的印刷功能（來源 3、58）。
- 成本算式的位置。PrintVis 的算式（公式編號）掛在成本中心組態、計算單位的工序行與品項行，並且速度表、損耗表、價目表都在組態內（來源 66、67、68）。這與委託方「算式掛在主檔項目的計價方法」做法相近，兩者都把算法放在資源主檔，不放在工單（推論）。
- 成本比對粒度。PrintVis 明說登記粒度與估價的計量單位不一致就看不到逐作業差異（來源 20）。委託方以報工數量重算快照，同樣要先決定粒度（推論）。
- 外包。PrintVis 用虛擬品項與採購引導接外包，成本在發票過帳後才進工作成本（來源 8）。委託方有外包派單，成本回貼時點需另定（推論）。

### 推論三：PrintVis 無此場景或只有近似工具的項目

| 委託方範圍 | PrintVis 狀況 | 依據 |
|-----------|--------------|------|
| 諮詢服務 | PrintVis 無此場景 | 來源 34 |
| 稿件審稿、打樣 | 只有製前訂單與 JDF 對接，步驟頁面沒寫 | 來源 34 |
| 補做 | PrintVis 無專用補做流程；近似工具為額外工作碼、複製案件、客訴貸項 | 來源 10、12、13 |
| 售後服務單 | 只有客訴登記，無獨立服務單與狀態機 | 來源 10、11 |
| 品檢檢驗批、抽樣、不合格處置 | PrintVis 的品檢只有檢核表 | 來源 14 |
| 派給人員的派工 | 官方頁只寫排到產能單位，沒有寫派給個人 | 來源 30 |
| 場內轉交與點收 | 生產標籤隨件在成本中心間移動並標記消耗，近似點收，官方頁沒有以「轉交與點收」為名的流程 | 來源 54 |

### 推論四：只用 PrintVis 的顧問會怎麼做

依來源 64、85、56 推論，顧問的順序大致是：先用 BC 流程目錄做 fit-to-standard，再依 PrintVis 設定導引建部門、成本中心、費率、品項，最後以樣本工作驗證估價。這個順序的特色是主檔先於交易：成本中心費率決定估價準確度（來源 69）。委託方可借鏡的是主檔建置順序與「先標準後客製」原則，不是 PrintVis 的物件本身。

### 推論五：對委託方生產段的結論

PrintVis 完整承接按單生產廠的估價、排程、報工、工作成本、外包與出貨（來源 2、30、20、8、23）。承接方式是以估價與案件取代 BC 標準製造，不建成品與半成品品號（來源 2、3）。委託方最擔心的「缺成品與半成品品號」，在 PrintVis 的按單生產做法中也不是必要條件（來源 3）。兩邊真正的差別在用量與成本：PrintVis 的用量與公式進成本計算，並靠 BC 的庫存與會計落帳（來源 22、28）。

## 第一輪初步分析（Claude 寫）

- 觀察：PrintVis 的生產段幾乎全在自己的物件內完成（案件、計算單位、規劃單位、電子工單、工作成本），BC 標準製造被官方明說取代，BC 提供的是庫存、採購、發票、總帳、收款。這與 2026-06-14 的 PrintVis 調研一致，本卡新開來源補了覆蓋對照、導入方法、成品與品號、外包、重工、審稿打樣。
- 觀察：「成品品號選用、接單生產不建」是 PrintVis 官方明文（來源 3），這是對委託方「無成品與半成品品號」最直接的外部佐證。反例也要寫：PrintVis 仍借 BC 品項表放紙、版、油墨、外包佔位品，並有單位換算（來源 3、24），所以它不是「完全沒有品項層」。
- 觀察：PrintVis 的在製品有兩層：實體位置用標籤不入帳（來源 54），會計面用 WIP 日記帳（來源 28）。委託方現況只有前者的精神，沒有後者。
- 觀察：前人調研把「PrintVis Storage」當在製品位置，本次查明是案件資料歸檔（來源 25）；在製品位置是 SF Production Zone 與 Storage（來源 54）。精練時用本卡的分法。
- 觀察：導入方法端，PrintVis 官方的價值在「主檔建置順序」（來源 64）；夥伴與官方都沒有公開估價驗證方法與商業分析問卷，這部分只能靠 Microsoft 通用方法補（來源 85、88、89）。
- 候選相關卡：[[品項主檔]]、[[印件配方]]、[[部件配方]]、[[計價快照]]、[[成品庫存]]、[[品檢紀錄]]、[[審稿輪次]]、[[生產任務]]、[[工單]]、[[印件]]；OQ [[ORD-043-EC整合前置訂單類型收斂與下游分流盤點]]。
- 同主題既有 raw：2026-06-14 PrintVis 調研（資料結構與功能面）；2026-10-29 Salesforce 調研（同角度、另一套產品）。本卡補覆蓋與導入面，不重疊、不合併。
- 候選 OQ 候補：本卡的待精練題屬設計決策，留到下一輪規劃流 pre-check 判定是否開 OQ，本次不開。
- 候選升級路徑：不直接升級。供 `memory/erp/erp-mes-standard-alignment-20261028/PrintVis對照.md` 與下一輪規劃流引用。

## 來源

1. [PrintVis 官方首頁](https://www.printvis.com) — 官方功能分七塊（估價報價、訂單管理、排程、現場、庫存採購、工作成本、財務）；自述涵蓋報價到收款，建在 Business Central 上
2. [BC PV Touchpoints Overview](https://learn.printvis.com/Legacy/General/BCPV-Overview/) — PrintVis 自有報價系統取代銷售訂單；估價取代 BC 製造的製程路線與物料清單，不需 Premium 授權；排程板取代 BC 資源排程；取代車間介面；銷售出貨為選用（主對話抽查相符）
3. [BC PV Touchpoints Items](https://learn.printvis.com/Legacy/General/BCPV-Items/) — 商業印刷或接單生產不需要成品品項；可不用 BC 品項出貨開票；品項表欄位範圍 6010000..6011999；庫存單位與價格單位換算；領料產生 Sale 類型分類帳；釋出成品通常不用於接單生產公司；放入庫存於出貨時建庫存（主對話抽查相符）
4. [BC PV Touchpoints CRM](https://learn.printvis.com/Legacy/General/BCPV-CRM/) — PrintVis 搭配 BC 商機；案件狀態碼標示漏斗階段；快速報價與估價範本；流失填拒絕代碼
5. [BC PV Touchpoints Shipments](https://learn.printvis.com/Legacy/General/BCPV-Shipments/) — PrintVis 出貨設計上不用 BC 銷售訂單；有 EasyPost（北美）與 nShift（歐洲）整合
6. [BC PV Touchpoints Invoice](https://learn.printvis.com/Legacy/General/BCPV-Invoice/) — 發票是標準 BC 銷售發票，直接過帳總帳科目；發票範本；可不出貨開票；頁面沒有收款與貸項（主對話抽查相符）
7. [BC PV Touchpoints GL Posting](https://learn.printvis.com/Legacy/General/BCPV-GLPosting/) — PrintVis 用一般業務過帳群組搭配訂單類型、客戶群組、計量單位；不使用一般產品過帳群組
8. [Posted Purchase Order - Subcontracting](https://learn.printvis.com/Legacy/JobCosting/PostedPOOutwork/) — 外包用虛擬品項（不可消耗過帳、外包、庫存值零）；估價行到採購引導到 BC 標準採購單，發票過帳後進工作成本（主對話抽查相符）
9. [Subcontracting setup (Outwork)](https://learn.printvis.com/Legacy/Estimation/Subcontracting/) — 外包報價為基本價加每千件加價加固定費；OUTSOURCE 與 OUTSOURCESTART 兩個外包品項；計算單位公式；數量變動自動重算
10. [Complaints（PrintVis pages）](https://learn.printvis.com/Pages/pvscomplaints/) — 結構化登記客訴；可建貸項掛在案件；貸項可轉供應商發票；沒有重做流程描述
11. [Complaints（Invoicing 章節）](https://learn.printvis.com/Legacy/Invoicing/Complaints/) — 登記步驟；客訴連訂單、代碼、部門、供應商；貸項行填訂單編號才影響工作成本；Invoice Guide 段落文字被截斷
12. [Copying a Case or Job](https://learn.printvis.com/Pages/pvscasecopy/) — 複製案件或工作 1:1 複製，估價原樣複製需重算；複製到、複製自、複製替代方案、新版本、複製週期性工作；沒有專用補做流程
13. [Extra work codes](https://learn.printvis.com/Legacy/JobCosting/ExtraWorkCodes/) — 額外工作碼（現場稱 waste codes）；可計費自動進發票草稿；供應商錯誤旗標；成本照算售價為零選項；沒有錯誤成本計算
14. [Quality Assurance（PrintVis pages）](https://learn.printvis.com/Pages/pvsqa/) — 可自訂的生產品質管制檢核表；依客戶群、客戶、訂單類型、產品群組、環保標章套用；一般、換版、生產三階段；必填題擋工作完成與計時；沒有拒收、抽樣、庫存連結（主對話抽查相符）
15. [PrintVis and Business Central Sales Order Integration](https://learn.printvis.com/PrintVis/SalesOrderIntegration/) — 啟用後銷售行顯示 PrintVis 欄位；品項勾 Sales Order Auto Create Case 時自動建案件；只描述銷售行建案件方向
16. [Web2PV REST API](https://learn.printvis.com/Legacy/Integrations/Web2PVREST/) — 網店訂單經四結構（標頭、明細、組件、出貨）進入；未處理前可改可刪；工作佇列自動或人工轉案件；產品群組、格式碼、後加工類型須勾 Web 旗標；沒有寫選項與估價的對應（主對話抽查相符）
17. [Cost Center（PrintVis pages）](https://learn.printvis.com/Pages/pvscostcenter/) — 成本中心＝機器、功能、工作站或人員；存固定屬性；隸屬部門；排程經產能單位間接使用；沒有寫與 BC 工作中心的對應
18. [Case management（PrintVis pages）](https://learn.printvis.com/Pages/pvscasemanagement/) — 案件頂層紀錄；多個有效工作；版本；報價轉訂單保留報價行並新增訂單行；印張與工作項目
19. [Produced output](https://learn.printvis.com/Legacy/JobCosting/ProducedOutput/) — 產出數量附在工時登錄上，進工作成本分錄；欄位含估計量、已過帳量、待過帳量、已生產量；沒有庫存過帳
20. [Job Costing](https://learn.printvis.com/Legacy/JobCosting/JobCosting/) — 實際成本四個來源；工時 = 時數 x 成本中心時薪；品項成本可選四種基準；比對估價靠作業綁定的計量單位；只有成本中心費率，沒有機台費率
21. [Release Finished Goods](https://learn.printvis.com/Legacy/Shipping/ReleaseFinishedGoods/) — 寫標準品項日記帳，分類帳類型 Purchase；入庫值選項；成本過帳時取定、之後不調整；頁面沒有品檢連結（主對話抽查相符）
22. [Calculation Units](https://learn.printvis.com/Legacy/Estimation/CalcUnits/) — 計算單位為估價基本單元，綁成本中心；含工序行與品項行；單位清單在工作項目上選取；沒有正式比較計算單位與 BOM 或製程路線
23. [Shipment](https://learn.printvis.com/Legacy/Shipping/Shipment/) — 出貨卡；分批比例、包裝、標籤、追蹤號、運費；放入庫存區塊；三種過帳方式；外包供應商提示
24. [Material requirements](https://learn.printvis.com/Legacy/Warehouse/MaterialRequirements/) — 工單材料需求清單；估價數量與單位、庫存單位換算例（1,004 公斤等於 10,650 張）；庫存可用日取值順序
25. [PrintVis Storage](https://learn.printvis.com/Legacy/System/PrintVisStorage/) — 把舊案件表歸檔到雲端以釋放效能、可還原；不是在製品位置（主對話抽查相符）
26. [Order Management（官方功能頁）](https://printvis.com/features/case-management/) — 案件記錄報價到開票全部資訊並標示各階段負責人；狀態碼依生產方式設定；整合 JDF 與製前系統
27. [Financial Management（官方功能頁）](https://printvis.com/features/financial-management/) — 發票由工單資料建立；狀態碼變更時可自動開票；發票維度拆分用 BC 維度；銀行對帳與付款條件屬 BC 標準
28. [WIP Posting](https://learn.printvis.com/Legacy/JobCosting/WIPPosting/) — 在製品定義；四種 WIP 方法；來源含採購發票、消耗、電子工單；明說無倉位或車間位置；完成品釋出過到 WIP 庫存科目
29. [Job material movement and pick](https://learn.printvis.com/Legacy/Warehouse/JobMaterialMovement/) — 領料依倉庫設定產生倉儲移動工作表、內部移動工作表或材料交付日記帳
30. [Planning Units](https://learn.printvis.com/Legacy/Planning/PlanningUnits/) — 規劃單位連計算單位取得時間，經產能單位效率係數轉計畫時間；規格欄決定合併方式；狀態碼驅動自動推進；沒有寫估價變更後如何處理，也沒有寫派給人員
31. [Status Codes](https://learn.printvis.com/Legacy/Workflow/StatusCodes/) — 系統狀態：詢價、報價、訂單、生產訂單；「生產訂單」是案件內另建的工作版本；「Prod = Sale」整合勾選所指生產單頁面未明
32. [Register consumption output for a production order（Microsoft Learn）](https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-register-consumption-and-output) — BC 生產日記帳：耗用、產出、報廢、工序時間；行由生產單的元件與製程路線帶出；耗用為負、產出為正的品項分類帳
33. [Manufacturing overview（Microsoft Learn）](https://learn.microsoft.com/en-us/dynamics365/business-central/production-manage-manufacturing) — BC 製造：Production BOM、Routing、工作中心與機台中心、生產單；需 Premium 體驗；可倒沖
34. [Prepress orders](https://learn.printvis.com/Legacy/Estimation/Prepressorders/) — 製前訂單：不涉及印刷的案件類型，涵蓋到客戶打樣核准為止；由成品品項建立；Esko 製前狀態碼送 JDF；沒有核准步驟
35. [Rejection Codes](https://learn.printvis.com/Legacy/General/RejectionCodes/) — 記錄案件被拒絕的原因；與 BC 關係管理連動；不涉及品檢
36. [Invoicing per job line](https://learn.printvis.com/Legacy/Invoicing/Invoicingperjobline/) — 多工作時以發票範本、開票方式設為出貨、每個有效工作各一張出貨，分開開票
37. [Items（PrintVis pages）](https://learn.printvis.com/Pages/item/) — 品項卡登記原料、半成品與成品；PrintVis 加 100 多個欄位，分群；沒有逐項列品項類型
38. [Order Types](https://learn.printvis.com/Legacy/Workflow/OrderTypes/) — 訂單類型是生產統計維度；決定案件起始狀態碼；用於責任區控制工作流；沒有列重做、重印等例子
39. [What Is PrintVis? Print Management Software for Business Central](https://dynamicscommunities.com/uncategorized/what-is-printvis-print-management-software-for-business-central) — Robbie Janes，2026-01-22；導入成敗取決於流程對齊；乾淨遷移資料；獨立印刷系統產生重複資料；作者與 Sabre 的關係頁面未明示
40. [BC PV Touchpoints Relationship Management](https://learn.printvis.com/Legacy/General/BC-RelationMgmt/) — 從 BC 商機直接建案件；商機成交或流失連動案件狀態碼；行銷活動折扣群組帶入案件
41. [nShift Ship integration](https://learn.printvis.com/Legacy/Shipping/nShiftShip/) — 出貨卡按鈕建 nShift 出貨、合併出貨、取包裹標籤、取運費報價、回填追蹤號；運費成本依計費期間套到採購單
42. [Purchase Guide](https://learn.printvis.com/Legacy/Purchasing/PurchaseGuide/) — 從案件為估價中的材料行建採購報價、採購單或需求工作表行；前提為品質碼啟用採購引導且案件達訂單狀態
43. [Format Codes](https://learn.printvis.com/Legacy/Estimation/FormatCodes/) — 格式碼定義尺寸，用於拼版計算、速度表、價目表、損耗表；沒有寫連材料或成本中心
44. [Job Card（估價章節）](https://learn.printvis.com/Legacy/Estimation/JobCard/) — 工作項目是產品組件的技術定義；欄位含組件類型、拼版型式、紙張；項目編號欄連到品項表，為選用
45. [PrintVis Credit Limit Check](https://learn.printvis.com/PrintVis/PrintVisCreditLimitCheck/) — 帳單客戶變更或狀態碼變更時檢查信用額度；設為停止時超額擋下
46. [Creating an estimate](https://learn.printvis.com/Legacy/Estimation/Estimate/) — 估價是報價、建立訂單、規劃生產的基礎；案件、工作、組件結構；影響價格的製程都要設成計算單位
47. [Estimating](https://learn.printvis.com/Legacy/Estimation/Estimating/) — 估價章節首頁；訂單編號在案件達訂單狀態後才出現；數字都是計算值；「全部重算」功能
48. [Versioning](https://learn.printvis.com/Legacy/Estimation/Version/) — 此處的版本功能指產品部件如何組合到印張；「成品品號」欄與「從庫存取」旗標
49. [PrintVis Case](https://learn.printvis.com/Legacy/Estimation/Case/) — 案件狀態往上走產生新版本；作用中版本才印工作單；生產狀態碼唯讀；沒有寫訂單異動後的處理
50. [Job Costing report](https://learn.printvis.com/Legacy/JobCosting/JobCostingreport/) — 報價估價、訂單估價、實際工作成本三欄並列；欄位含錯誤與額外工作成本；部分公式像文件筆誤
51. [Auto job costing](https://learn.printvis.com/Legacy/JobCosting/AutoJobCosting/) — 案件換到指定狀態碼時自動入帳消耗、工時、外包計算成本；會擋住的情況
52. [Production plan](https://learn.printvis.com/Legacy/Planning/ProductionPlan/) — 規劃單位於工作達到允許排程的狀態時由系統產生；由計算單位翻譯而來；頁面完全沒提 BC 生產單
53. [Shop Floor](https://learn.printvis.com/Legacy/JobCosting/ShopFloor/) — 現場觸控介面；即時過帳或交他人核准；同時進行工作數、間接時間、班組人數、條碼、機台整合選項
54. [Shop Floor Production Tracking](https://learn.printvis.com/Legacy/JobCosting/ProductionTracking/) — 半成品追蹤在 BC 標準庫存之外，不產生過帳；SF Production Zone 與 Storage 位置；生產標籤與消耗；標籤到案件封存才移除（主對話抽查相符）
55. [Job Costing journal setup](https://learn.printvis.com/Legacy/JobCosting/JobCostingjournalsetup/) — 日記帳可設用於工時或材料；品項行移到品項日記帳過帳；可標為範本並指派給成本中心
56. [Business Central & PrintVis Commercial Print Pricing](https://www.sabrelimited.com/commercial-print-pricing-printvis-training/) — Sabre Limited（夥伴）定價頁；Bronze、Silver、Gold 套件時程與客製限制；PrintVis 用自己的案件與工作，不需為每次生產建新品號；選配 Production Manufacturing 含 BOM、Routing、生產單，標價美金 13,750；專案管理另收月費（主對話抽查相符）
57. [Packaging Manufacturing Pricing（PrintVis）](https://www.sabrelimited.com/packaging-manufacturing-pricing-printvis/) — Sabre 包裝版定價頁；同一段常見問題；沒有按包裝說明何時改用 BC 標準製造
58. [What Is PrintVis? A Complete Guide for Print Manufacturers](https://www.sabrelimited.com/blogs/what-is-printvis) — Robbie Janes（Sabre），2026-07-20 更新；PrintVis 完全嵌入 BC，共用資料庫、科目、客戶、廠商、庫存；行銷性文章
59. [PrintVis Introduces More Features to Elevate Operations](http://www.piworld.com/article/printvis-introduces-more-features-to-elevate-operations) — Printing Impressions 刊登 PrintVis 新聞稿，2024-11-27；生產分析、材料分析、產能分析、Web2PV REST、成本中心匯入
60. [Why Top Printers Choose PrintVis and Business Central](https://dynamicscommunities.com/industries/manufacturing/why-top-printers-choose-printvis-and-business-central/) — Robbie Janes，2025-07-23，Sabre 推廣文；估價範本；企業客戶用 XML、JDF 或系統對系統接單；網店適合小單
61. [About production orders（Microsoft Learn）](https://learn.microsoft.com/en-us/dynamics365/business-central/production-about-production-orders) — BC 生產單由品項、Production BOM、Routing 建立；五種狀態；Simulated 可用於報價與成本估算
62. [About finished production order costs（Microsoft Learn）](https://learn.microsoft.com/en-us/dynamics365/business-central/finance-about-finished-production-order-costs) — 完工生產單彙整實際成本；以批次作業調整成本並算差異；只有完工狀態的生產單會被調整
63. [Subcontracting overview（Microsoft Learn）](https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-subcontract-manufacturing) — BC 外包：外包工作中心、製程路線作業、外包採購單；Microsoft 的外包擴充套件全部建立在生產單加製程路線之上
64. [PrintVis Assisted Setup](https://learn.printvis.com/Legacy/General/PrintVisAssistedSetup/) — 設定導引 22 節順序；成本中心須等部門完成；預選資料從參考資料庫帶入（主對話抽查相符）
65. [PrintVis Assisted Setup - Cost Center](https://learn.printvis.com/Legacy/General/CostCenter-AS/) — 成本中心代表機器、功能、工作站或人員；帶固定時薪；從機器資料庫匯入組態並自動建計算單位
66. [Cost Center Configurations](https://learn.printvis.com/Pages/pvscostcenterconfig/) — 組態分基本與附加；各有成本與利潤費率、損耗表、作業、速度表、價目表；建議從參考資料庫匯入
67. [Calculation Units（PrintVis pages）](https://learn.printvis.com/Pages/pvscalculationunits/) — 先建成本中心、再建組態、再建計算單位；一台印刷機通常 2 到 3 個單位；已被估價使用者不可刪除
68. [Calculation Formulas](https://learn.printvis.com/Pages/pvscalcformulas/) — 系統公式 1 到 999，自訂公式 1000 起；依編號順序計算；頁面無測試程序
69. [PrintVis Assisted Setup - Cost Center Rates](https://learn.printvis.com/Legacy/General/CostCenterRates-AS/) — 固定費率與附加費率；時薪結構；總成本與售價對準確估價至關重要
70. [PrintVis Assisted Setup - Departments](https://learn.printvis.com/Legacy/General/Departments-AS/) — 部門決定成本中心歸屬；先決定部門結構再設成本中心
71. [PrintVis Assisted Setup - Product Groups](https://learn.printvis.com/Legacy/General/ProductGroup-AS/) — 產品群組是訂單類型的子主題；用於統計；預設全部匯入，可取消勾選與改名
72. [PrintVis Assisted Setup - Order Type](https://learn.printvis.com/Legacy/General/OrderType-AS/) — 訂單類型用於生產統計；決定案件起始狀態碼
73. [PrintVis Assisted Setup - Items](https://learn.printvis.com/Legacy/General/Items-AS/) — 品項欄位含品項類型、預設供應商、價目表代碼、PrintVis 直接成本、價格單位、庫存單位；頁面不談單位換算
74. [PrintVis Assisted Setup - Unit of Measure](https://learn.printvis.com/Legacy/General/PVUOM-AS/) — 此處的計量單位是工作成本的作業：人工時、物料、外包；頁面不談紙張單位換算
75. [PrintVis Assisted Setup - Configuration Package](https://learn.printvis.com/Legacy/General/ConfigPackage-AS/) — 用 BC 設定套件把客戶、廠商、品項等主檔從 Excel 匯入；逐張驗證後再下一張
76. [Capacity Resources](https://learn.printvis.com/Legacy/Planning/CapacityResources/) — 產能資源是員工或班組；與產能單位只經選填的產能代碼連結；未定義產能單位本身
77. [PrintVis Onboarding Guide](https://learn.printvis.com/Legacy/General/PrintVisOnboardingGuide/) — 入門模組順序；模組有相依；漸進式導入；進階模組可能需要夥伴協助；步驟細節在引導內
78. [New to PrintVis](https://printvis.com/learn-more/new/) — 超級使用者認證、社群；大型導入專案建議讓有經驗的顧問進指導委員會
79. [How to Buy PrintVis](https://printvis.com/solution/how-to-buy/) — 全球導入夥伴負責導入與支援；頁面不載步驟、時程、價格
80. [Get Started Trial Guidance](https://printvis.com/trial/get-started/) — 30 天試用五段影片依序：安裝、估價、採購、工作單與排程、工作成本與開票
81. [PrintVis: The Game-Changing ERP for Print Manufacturing](https://dynamicscommunities.com/industries/manufacturing/printvis-the-game-changing-erp-for-print-manufacturing/) — Robbie Janes，2024-04-24，Sabre 推廣文；自 2017 年起導入 PrintVis；固定費用；稱 PrintVis 為 BC 附加元件；無導入階段說明
82. [Introduction to the Success by Design framework](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design) — 五階段 Discover、Initiate、Implement、Prepare、Operate；方案藍圖審查與上線整備審查必做；2026-08-04 版（主對話抽查相符）
83. [What Is the Dynamics 365 Implementation Guide?](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview) — 寫五階段 Strategize、Initiate、Implement、Prepare、Operate，與來源 82 的第一階段名稱不同；適用中型與大型組織
84. [Base the implementation lifecycle on processes](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-implementation-lifecycle) — 以業務流程為骨架；流程目錄；先現況再未來；建置避免不必要客製
85. [Optimize your implementation with a fit-to-standard and fit-gap analysis](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis) — fit-to-standard 每個專案都做；步驟與工作坊；fit-gap 在配置之後；客製前評估項目；常見陷阱（主對話抽查相符）
86. [How to approach a Dynamics 365 implementation project](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance-project-approach) — 客戶自己的責任範圍；沒有早期分析與整體藍圖的敏捷專案會反覆重設計；開發應建立或擴充標準流程
87. [Extend Dynamics 365 apps without compromising performance](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution) — 不要複製舊系統；擴充前先確認需求與影響；市集夥伴方案的更新風險；用功能設計文件記錄
88. [Manage configuration and migration data for Dynamics 365 projects](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/data-management-configuration-data-migration) — 配置資料與遷移資料分開；遷移策略內容；遷移不與其他測試併行；至少在系統整合測試與使用者驗收測試環境各測一次
89. [Transition to new solutions successfully with the cutover process](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-cutover-strategy) — 切換五步；模擬切換；回退計畫；上線與否的決策標準；頁面未提平行運行
90. [Test your Dynamics 365 solution before deployment](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy) — 測試類型；測試案例連回業務流程；簽核是「足以安全運作業務」
91. [Apply Company Configuration Packages - Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/apply-company-configuration-packages) — 空公司套用設定套件；遷移主檔後以日記帳補期初餘額；設定套件只用於首次設定
92. [Overview of tasks to set up Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/setup) — BC 內建多數流程的標準配置；設定項目含製造 BOM 與製程路線與工作中心；未談印刷成本中心
93. [How to ensure your Print MIS project fails](https://dataline.eu/en/blog/how-ensure-your-print-mis-project-fails) — 印刷管理資訊系統廠商 Dataline 的行銷文（非 PrintVis），2025-07-31；失敗點清單
94. [3-Phase MIS Implementation Approach for Print Businesses](https://printepssw.com/insight/3-phase-mis-implementation-approach-for-print-businesses) — Avanti（非 PrintVis）；訓練、驗證、上線評估三階段；有客戶新舊系統並行兩週
95. [Implementation FastTrack（Braintree）](https://www.braintree.co.za/pivot-business-central-extensions/implementation-fasttrack/) — BC 夥伴 Braintree（通用方案，未涉 PrintVis）；設定、遷移、上線三步；逐批與舊系統核對

## 查無公開資料

- PrintVis 官方或夥伴的正式導入階段名稱、每階段產出與負責角色：官方頁只講夥伴角色，Sabre 頁只有套件與訓練主題（來源 56、78、79）。
- 夥伴問客戶的商業分析問題清單（產品類型、按單生產或備貨、估價方式、外包比例）：未找到公開來源。
- 用歷史工作重算比對估價、平行運行（PrintVis 專屬）：未找到。計算公式頁明說無測試章節（來源 68）。
- 諮詢服務的 PrintVis 對應物件：開得起來的頁面都沒有。
- 網店商品選項綁材料、工序、設備的說明，以及 Web2PV 訂單是否自動建估價：Web2PV 頁明說沒寫（來源 16）。
- XPR365 PrintVis for BigCommerce 連接器內容：Microsoft 市集頁回 HTTP 403。搜尋摘要說它是第三方連接器，沒有開啟，不採信。
- Microsoft AppSource 的 PrintVis 頁：搜尋沒有給出可開啟的網址。
- Sabre 的一小時評估、Rainbow Solutions 的 PrintVis 概念驗證：Microsoft 市集頁回 HTTP 403。
- Microsoft 市集的夥伴固定費用價目表 PDF、Sikich 的 Dynamics 365 FOR PRINT 頁：回 HTTP 404。
- 稿件審稿、打樣的步驟：製前訂單頁只在簡介提到「打樣核准」（來源 34）。
- 品檢的檢驗批、抽樣、不合格處置、與庫存或出貨的連結：品質保證頁明說沒有涵蓋（來源 14）。PrintVis 是否使用 BC 品質管理功能，沒有查到。
- 專用的重印、補做、錯誤成本計算流程：額外工作碼、複製案件、客訴三類頁面都標明沒有寫（來源 10、12、13）。
- 獨立售後服務單與狀態機：只有客訴登記。
- 退款（把錢退給客戶）與 PrintVis 專屬的收款對帳功能：開得起來的頁面都沒有寫（來源 6、27）。
- 估價變更後既有規劃單位與工單怎麼處理：官方案件、規劃單位、排程頁都沒寫（來源 30、49）。
- PrintVis 工作與 BC 生產單的資料關係：官方頁沒有寫是否同時建立 BC 生產單。「Prod = Sale」整合所指的生產單未明（來源 31）。
- 夥伴對「何時改用 BC 標準製造（重複性成品、包裝、非印刷組裝）」的具體建議：只找到「大量製造設備才需要」一句（來源 56、57）。
- 成本中心與 BC 工作中心的對應、獨立機台費率：成本中心頁明說沒寫對應（來源 17）；工作成本頁只有成本中心時薪（來源 20）。
- 外包採購單欄位細節：外包設定頁的步驟多為截圖，讀不到（來源 8）。
- 紙張單位換算的設定頁細節：品項與計量單位的設定導引頁不談換算（來源 73、74）；換算說明見來源 3、24。
- 資料遷移的對帳方法（筆數、金額控制總數）：Microsoft 遷移頁只說驗證資料品質，沒有給方法（來源 88）。
- 產能單位的建置順序：只讀了產能資源頁（來源 76），未讀產能群組與規劃單位的設定頁。
- PrintVis 客戶案例頁、Microsoft FastTrack 專頁：未開啟。
- Microsoft Learn 兩頁階段名稱不一致（來源 82、83）：委託方若依「四階段（Initiate、Implement、Prepare、Operate）」的舊說法查證，現行頁面都是五階段。
- 夥伴 Sabre 的時程與價格只出自單一定價頁（來源 56），不是 PrintVis 全體夥伴的常態值。

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡（related-vault 的卡名已核對存在；本卡未讀卡內容，是否補內容待精練時判定）
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）：候選議題為「接單生產廠的成品與半成品品號是否建立」與「配方用量是否進成本計算與採購需求」

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
