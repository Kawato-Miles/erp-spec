---
type: raw
status: raw
created-at: 2026-10-28
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
  - 工單
  - 生產任務
topic-tag:
  - ERP
  - MES
  - 電商整合
  - 可配置產品
  - 品檢庫存狀態
  - 完工入庫
  - 可承諾量
  - 印刷業MIS
  - Web-to-Print
related-vault:
  - "[[工單]]"
  - "[[生產任務]]"
  - "[[印件]]"
  - "[[品檢紀錄]]"
  - "[[成品庫存]]"
  - "[[配方展開規則]]"
  - "[[印件配方]]"
  - "[[EC 商品管理]]"
raw-source-link: https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-blocking
attached-files: []
---

# 印刷業 ERP／MES 與電商整合架構、完工到入庫流程 — 業界標準比對研究筆記

> 摘錄重點，非全文轉錄。第一到三段是外部來源的摘錄（原始素材層），第四段是對照，第五段是 Claude 的初步分析。撰寫者為 Sonnet 研究代理（2026-10-28），主對話以 WebFetch 抽查 8 條來源（來源 10、12、18、21、23、28、29、39），結果記在各列括號。

## 研究範圍與方法

委託方是台灣的印刷公司，自有工廠，訂單來自線上電商（EC）與線下接單。ERP 與製造執行系統（MES）自行設計。現況沒有成品品號主檔、標準 BOM、庫存模組。本筆記只整理外部來源的架構與流程，供比對與靠齊規劃。

- 範圍：三組問題。電商與 ERP／MES 整合、完工到入庫、印刷業特化。
- 方法：WebSearch 找候選頁面，再用 WebFetch 逐頁開啟，只列入實際開得起來、內容相符的頁面。
- 來源取捨：官方文件優先。官方頁面抓取失敗時，不以搜尋摘要代替，改記入「查無公開資料」。
- 版本提醒：SAP 的 help.sap.com 頁面多數是 4.6C 與 4.70 版舊文件（來源 8、9、10、17 到 25）。SAP 的 learning.sap.com 與 sap.com 產品頁在本次抓取一律失敗（404 或 403），未列入。
- 本筆記不含對委託方設計的建議。第四段只寫可從來源直接推出的對照。

## 一、EC 與 ERP／MES 整合架構

### Salesforce 生態

Salesforce 的整合指南沒有指定訂單或主資料的正本系統。指南把「哪個系統是真實來源」列為設計時要回答的問題。（來源 1）

指南的訂單範例是商機成交後，在 ERP 建立訂單。範例列出的串接手法有事件推送、流程呼叫外部服務、中介軟體（MuleSoft）、同步介面。（來源 1）

指南建議避免不必要的複製。已在 Salesforce 內的資料，改用介面存取，不外複製。（來源 1）

MuleSoft 的 Salesforce 與 SAP 報價到收款（quote-to-cash）範本，把資料歸屬寫得比較具體。下表整理其範本內的假設。

| 情境 | 產品與定價 | 庫存 | 訂單起點 |
|------|-----------|------|---------|
| Sales Cloud（不含 CPQ） | 產品資訊管理系統（PIM）是產品與標準價的正本，同步到 SAP 與 Salesforce（來源 3） | Salesforce 即時查 S/4HANA 的可用量（來源 3） | 商機結案後在 S/4HANA 建單，再同步回 Salesforce（來源 3） |
| CPQ | PIM 是產品、庫存、標準價的正本；S/4HANA 是定價條件的正本（來源 3） | PIM 是庫存的正本（來源 3） | 在 Salesforce 由報價建單，再流向 S/4HANA（來源 3） |

上表的歸屬是範本的假設，不是 Salesforce 的硬性規定。範本把 PIM 當產品資料來源。（來源 3）

訂單進入 Salesforce 訂單管理（Order Management）後，有固定的物件結構。

- 原始訂單啟用後不再變動。（來源 5）
- 訂單摘要（order summary）是目前狀態的動態檢視。它包含履行、變更、取消、退貨。（來源 5）
- 實質變更（取消、退貨）才產生變更單。履行流程中的一般更新不產生。（來源 5）
- 工作流程自動建立履行單，並把產品指派到履行地點。（來源 6）
- 履行單與訂單摘要連動，訂單摘要隨履行單更新。（來源 6）
- 發票與外部財務系統對帳，需要另做整合。（來源 6）

訂單怎麼流到 ERP，官方範本有一條路徑。

| 步驟 | 單據 | 資料流向 |
|------|------|---------|
| 1 | 訂單、訂單摘要（Salesforce 訂單管理）| 由高流量訂單介面建立（來源 2） |
| 2 | 履行單 | 每張履行單在 S/4HANA 建一張銷售訂單（來源 2） |
| 3 | SAP 訂單編號 | 寫回 Salesforce 履行單（來源 2） |
| 4 | 揀貨、出貨狀態、追蹤資訊 | 從 S/4HANA 回傳，履行單標為已履行（來源 2） |
| 5 | 履行單發票與付款資料 | 傳到 SAP，建立銷售發票並對帳（來源 2） |

此範本假設客戶與產品已在兩邊同步，但沒有說哪邊是正本。（來源 2）範本也沒有描述庫存流程。（來源 2）

B2C Commerce（網店）的產品資料方向是單向。

- 範本的產品來源是 PIM。排程把新增與異動的產品推進 B2C Commerce。（來源 4）
- 範本只支援標準（獨立）產品類型。（來源 4）
- Salesforce 教材說，商家在後台正本系統維護品項資料（例如 SKU），再匯入 B2C Commerce。（來源 7）
- 教材建議用只含異動的差異檔（delta feed）。價格與庫存這類頻繁異動，可同時匯入暫存與正式環境。（來源 7）

配置（configurable product）、CPQ 配置結果的主資料歸屬，以及 Manufacturing Cloud 與 ERP 的串接，本次沒有查到可開啟的官方頁面。見「查無公開資料」。

### SAP 生態

SAP 以「一個可配置物料」涵蓋一個產品的所有變體。

- 可配置物料以特徵（characteristic）描述，指派到類別類型 300。客戶選特徵值。（來源 10）
- 可配置物料另有超級 BOM（super BOM）與超級途程（super routing）。它們含所有變體需要的零件與工序。（來源 10）
- 相依性（dependency）擋掉不允許的組合，並為特定變體挑出正確的零件與工序。（來源 10）
- 每個可配置物件需要配置檔（configuration profile）。它控制銷售訂單中的配置流程。（來源 10）

銷售訂單到生產訂單（接單生產）有兩個策略可對照。

| 項目 | 策略 20：接單生產 | 策略 25：可配置物料的接單生產 |
|------|------------------|------------------------------|
| 用途 | 為一張銷售訂單生產一個物料（來源 8） | 與策略 20 相似，用於不需或無法規劃母品時（來源 9） |
| 產品結構 | 基本策略不需要 BOM（來源 8） | 必須配置（來源 9） |
| 訂單輸入 | 銷售訂單（來源 8） | 在銷售訂單輸入變體物料與配置值（來源 9） |
| 庫存歸屬 | 物料與銷售訂單綁定，成本在銷售訂單層級追蹤（來源 8） | 可配置物料在交貨時發料（來源 9） |
| 母品規劃 | 不做淨需求計算（來源 8） | 不規劃母品，零件視需要另外規劃（來源 9） |

網店端如何取用 SAP 的可配置物料，有一份第三方網店廠商（Sana Commerce）的說明。

- 該廠商用可配置物料（KMAT）當父產品，變體類別（類型 300）放特徵。（來源 11）
- 該廠商的限制是只能啟用兩個變體元件，庫存只在父產品層級維護。（來源 11）

SAP Commerce Cloud 與 S/4HANA 的官方整合文件（產品主檔複製、銷售訂單複製）沒有抓取成功。見「查無公開資料」。

### 通用模式：共用品號、BOM、工單骨架

多屬性商品有兩種建模方式。下表整理來源中三個系統的做法。

| 模式 | SAP | Dynamics 365 | Odoo |
|------|-----|--------------|------|
| 母料號加屬性，BOM 依選項展開 | 一個可配置物料加超級 BOM、相依性（來源 10） | 限制式（constraint-based）配置模型，內含屬性、限制、BOM 行、途程工序（來源 12） | 單一 BOM，零件與工序用「套用於變體」欄限定（來源 14、15） |
| 每個組合一個變體品號 | 來源未描述 | 來源未描述 | 屬性建立變體，每個變體有獨立庫存與銷售紀錄（來源 13） |
| 變體何時產生 | 來源未描述 | 配置在銷售單、報價單、採購單、生產單上進行（來源 12） | 可選「立即」全建、「動態」加入銷售單時才建、「從不」只當資訊（來源 13） |

三家共同點是配置結果最終變成可生產的零件清單與工序。

- Dynamics 365 的配置模型把 BOM 行當成「製造該變體所需的零件」，把途程工序當成「製造步驟」。（來源 12）
- Dynamics 365 的「使用者需求」像幽靈 BOM（phantom BOM）：不指向品項，其下 BOM 行會併入上層元件。（來源 12）
- Odoo 選定變體並確認銷售單後，製造單只列該變體的零件。（來源 14）
- Odoo 的 BOM「產品變體」欄只供單一變體專用的 BOM，用變體分配零件時要留空。（來源 14）
- Odoo 的接單補貨路線（MTO）要搭配「製造」路線，並需要有 BOM。（來源 16）

各家怎麼選、適用條件，來源沒有明列判準。唯一明文的適用條件是 SAP 策略 25：用於不需或無法規劃母品時。（來源 9）

## 二、完工到入庫的執行流程

下列三張表以「系統」欄區分 SAP、Dynamics 365（D365）、Odoo。庫存狀態欄若寫「頁面未明載」，表示該官方頁面沒有寫。

### 待驗狀態

| 系統 | 步驟 | 單據 | 庫存狀態變化 |
|------|------|------|-------------|
| SAP | 生產訂單收料過帳，移動類型 101，填生產訂單號（來源 22） | 物料文件 | 頁面未明載庫存數量變化（來源 22） |
| SAP | 品質管理（QM）啟用時，收料過帳可自動建檢驗批。生產收料的檢驗類型是 04，與訂單內的製程中檢驗（類型 03）分開（來源 17、19） | 檢驗批（inspection lot） | 收料入檢驗庫存，產生「庫存相關」的檢驗批（來源 18） |
| SAP | 檢驗庫存只能經品質管理的使用決定（usage decision）移出（來源 18） | 使用決定記錄 | 留在檢驗庫存，直到做使用決定（來源 18） |
| SAP | 若用倉庫管理（WM），採購收料量以庫存單位（quant）存在收料暫存區（來源 20） | 移轉需求、庫存單位 | 庫存類別 Q（品質檢驗庫存）。此頁是採購收料範例（來源 20） |
| D365 | 先設品質關聯（quality association），指定哪個事件產生品質單，例如採購入庫單過帳（來源 26、28） | 品質關聯 | 無變化 |
| D365 | 事件發生，系統產生品質單（來源 28） | 品質單（quality order） | 品質單上的數量被封鎖（來源 28） |
| D365 | 品質單封鎖的量與抽樣量是兩件事。手動建單封鎖品質單上的數量；自動建單依抽樣計畫決定，勾「全數封鎖」則封鎖整行（來源 28） | 抽樣計畫 | 封鎖量可大於送檢量（來源 28） |
| D365 | 另可把庫存狀態（inventory status）設為封鎖。封鎖狀態視為實體庫存，但不能用於生產訂單、銷售訂單、調撥單、出庫交易（來源 29；查證相符） | 庫存狀態 | 實體庫存存在，但不可被領用或出貨（來源 29） |
| Odoo | 品質控制點（QCP）把作業設為「製造」（來源 34） | 品質控制點 | 新製造單自動產生品質檢查（來源 34） |
| Odoo | 製造單按「全部生產」完成（來源 35） | 製造單 | 成品登記進庫存（來源 35） |
| Odoo | 三步製造設定下，完成製造單後產生「成品入庫」調撥（來源 35） | 調撥單（WH/SFP） | 驗證後，成品從生產位置移到儲存位置，庫存數更新（來源 35） |

補充：D365 同時用庫存狀態封鎖與品質單封鎖時，會多出一筆封鎖交易，容易看成封鎖量大於現有量。官方建議此時開啟「保留已訂購品項」選項。（來源 28）

### 品檢分流

| 系統 | 分流 | 單據 | 庫存狀態變化 |
|------|------|------|-------------|
| SAP | 合格：做使用決定，系統自動把檢驗庫存過帳到非限制使用庫存（來源 19） | 使用決定 | 檢驗庫存 → 非限制使用庫存（來源 19） |
| SAP | 部分合格：使用決定可提案數量。範例是 990 件進非限制使用、10 件進凍結庫存（來源 21） | 使用決定 | 檢驗庫存 → 非限制使用＋凍結（來源 21） |
| SAP | 報廢、退回生產：使用決定頁面沒有提到這兩種去向（來源 21；查證：頁面只寫非限制使用與凍結兩欄） | 未查證 | 未查證 |
| SAP | 重工（同一張單）：在原生產訂單手動插入重工工序，或套用參考工序組。成本記在原單（來源 23） | 原生產訂單 | 沿用原單，物料不變（來源 23） |
| SAP | 重工（獨立單）：另開「不帶物料」的生產訂單，結算時成本轉回原單；途程工序的控制碼設重工指標是途程層的設定，不限定哪一種重工做法（來源 23） | 獨立重工訂單 | 官方建議原單在重工單結算前不要刪除或歸檔，是建議不是系統限制（來源 23） |
| SAP | 重工量回報：確認回報可分開填良品、報廢、重工量。自動收料只過帳確認的良品量，重工後的良品須手動過帳入庫（來源 24） | 工序確認 | 良品自動入庫；重工良品手動入庫（來源 24） |
| SAP | 重工工序上確認的報廢，視為發生在引起重工的那道工序（來源 23） | 工序確認 | 成本落在一般差異類別，不算報廢成本（來源 23） |
| D365 | 完工回報填良品數量、不良數量、不良原因（來源 30） | 完工回報日記帳 | 良品與不良品分開記錄（來源 30） |
| D365 | 不良數量的成本有兩種處理：分攤到良品，或記入報廢科目（來源 32） | 完工回報日記帳 | 成本進良品或進報廢科目（來源 32） |
| D365 | 品質單：填結果數量與判定結果，再由檢驗人驗證（來源 27） | 品質單 | 驗證後依判定處理。頁面未明載庫存過帳（來源 27） |
| D365 | 不合格品可開不符合單（nonconformance）。核准狀態從「新」變成「核准」或「拒絕」（來源 26） | 不符合單 | 標籤可標示「不可用」或「限制使用」（來源 26） |
| D365 | 核准的不符合單可定義相關作業，並累計零件、雜費、工時成本。也可再開品質單複驗（來源 26） | 相關作業、品質單 | 成本只供品質管理參考（來源 26） |
| D365 | 全數報廢時，品質單會擋住完工回報。這是已知問題，繞過方式是刪除品質單再回報（來源 31） | 品質單 | 無 |
| Odoo | 製造單報廢：草稿或確認階段只能報廢零件，完成後才能報廢成品（來源 36） | 報廢單 | 移到虛擬位置「Scrap」（來源 36） |
| Odoo | 拆解單：把已完成的成品拆回零件（來源 37） | 拆解單 | 成品庫存減少，零件加回目的位置（來源 37） |
| Odoo | 品質控制點可設「失敗訊息」，例如建立品質警示（來源 34） | 品質檢查、品質警示 | 頁面未描述警示的設定與庫存影響（來源 34） |

重工在 D365 與 Odoo 的官方作法，本次沒有查到。見「查無公開資料」。

### 入庫與可承諾量

| 系統 | 步驟 | 單據 | 庫存狀態變化與可承諾量 |
|------|------|------|----------------------|
| SAP | 建銷售訂單時，可用量檢查（ATP）確認需求有庫存或計畫收料覆蓋（來源 25） | 銷售訂單 | 頁面列出的收料是倉庫庫存、計畫訂單、請購單，沒有提到生產訂單（來源 25） |
| SAP | 接單生產：物料與銷售訂單綁定，成本在銷售訂單層級追蹤（來源 8） | 銷售訂單庫存 | 非通用庫存，不能供其他訂單使用（來源 8） |
| SAP | 重工量不會自動收料，需手動過帳（來源 24） | 手動收料 | 手動過帳後才進庫存（來源 24） |
| D365 | 訂單承諾方式有銷售前置天數、ATP、ATP 加出貨緩衝、CTP（來源 33） | 銷售訂單行 | 銷售前置天數法不看庫存與供給（來源 33） |
| D365 | ATP 納入未承諾庫存、前置時間、計畫收料與發料（來源 33） | 銷售訂單行 | 第一期 ATP 是現有量扣到期與逾期訂單（來源 33） |
| D365 | CTP 比 ATP 多考量產能（來源 33） | 銷售訂單行 | 較接近完整的承諾日期（來源 33） |
| D365 | 品質單封鎖預設勾「預期收料」，計畫把封鎖量當預期可用量（來源 28） | 封鎖交易 | 封鎖中的量仍在計畫的預期供給內（來源 28） |
| D365 | 封鎖狀態的庫存在主計畫視為缺料，系統自動補貨（來源 29） | 庫存狀態 | 計畫不把封鎖量當可用（來源 29） |
| D365 | 完工回報過帳後，要改內容須手動建立新的日記帳（來源 30） | 完工回報日記帳 | 原日記帳不可直接改（來源 30） |
| Odoo | 接單補貨路線：每次確認銷售單就建一張草稿製造單，不管現有庫存多少（來源 16） | 銷售單、製造單 | 兩單互有連結按鈕，可追溯（來源 16） |
| Odoo | 取消製造單後，系統不自動補建，手動補建的單也無法連回銷售單（來源 16） | 製造單 | 無 |

「哪一步讓銷售訂單看到可承諾量」，來源的明確答案有限。

- D365 的 ATP 以庫存、計畫收料、發料算。完工回報與入庫各自如何進入 ATP，官方頁面沒有寫。（來源 33）
- SAP 的可用量檢查頁面沒有確認生產訂單是否算收料。（來源 25）
- Odoo 的可承諾量算法，本次沒有查到官方頁面。

## 三、印刷業特化

### 網路印刷（Web-to-print）與印刷 MIS 的整合

工作定義格式（JDF）與訊息格式（JMF）是印刷業的共通語言。

- JDF 是 CIP4 在 2000 年推出的 XML 標準。它描述印刷品與所需製程，涵蓋從接單到交貨。（來源 38）
- JDF 的工單內容含產品細節、生產細節、業務資料（客戶、交期）。（來源 38）
- JMF 傳遞裝置回饋等訊息。（來源 38）
- 2018 年發布的 XJDF 是簡化版，重點放在系統之間交換資訊。（來源 38）
- MIS 的角色：估價時記錄估價資料；估價轉成訂單後，把資料傳給印前、印刷、後加工；各裝置再回傳作業資料，供 MIS 事後計算。（來源 38）

電商（網店）到 MIS 的流程，以 MarketDirect StoreFront（網店）串接 Pace、Monarch、PrintSmith 為例。

| 步驟 | 單據 | 資料流向 |
|------|------|---------|
| 1 | 通訊通道 | Pace 與 Monarch 用直接通道；PrintSmith Vision 與 Radius 用 eFlow（來源 41） |
| 2 | 客戶公司 | 由 Pace 傳到網店；買家在網店掛到該公司（來源 39；頁面只寫傳送方向，未寫在哪一邊建立） |
| 3 | 訂單 | 網店以 XML 傳給 MIS，可選一單一檔或每行一檔（來源 39） |
| 4 | 工作（job） | 多行訂單若不勾「接受單一訂單」，會拆成各自的工作送出（來源 39） |
| 5 | 狀態、發票、出貨資訊 | MIS 回傳；MIS 送最終發票後，網店訂單變為完成並已開票（來源 39） |

eFlow 路線用業務物件文件（BOD）訊息，包含目錄、客戶主檔、品項主檔、銷售訂單、發票、付款狀態。（來源 39）

產品定義與價格歸誰，要分「非印刷品」與「印刷品」。

- 非印刷的履行品（fulfillment products）在 MIS 建立與維護，匯入網店目錄。（來源 40）
- 整合後，履行品的價格來自 MIS，網店的價格表唯讀。（來源 40）
- 庫存由 MIS 更新。訂購時 MIS 把現有量傳給網店。（來源 40）
- MIS 回報出貨狀態。每行都「已出貨」，網店訂單才算完成。（來源 40）
- 要啟用進階的 MIS 整合與履行，需另購履行模組授權。不是每個 MIS 都支援。（來源 40）
- 印刷品的產品定義，依一份 2014 年的業界導讀：一般由印刷廠控制網店的產品與規則。（來源 44）
- 同一導讀說，網店定價常連結 MIS 或定價引擎。庫存與採購主要在 MIS 處理。（來源 44）
- 同一導讀只在 Pace 提到 JDF 與 JMF 模組，用來連結 MIS 與拼版、印前、印刷、後加工。（來源 44）

其他 MIS 的做法。

| MIS | 與網店的關係 |
|-----|-------------|
| PrintVis | 內嵌在 Microsoft Dynamics 365 Business Central，共用資料庫與科目表（來源 43）。Web2PrintVis 連結客戶網站入口與 PrintVis，訂單以最少人工輸入進入估價、生產、排程（來源 42） |
| PrintVis | 已通過 JDF 認證，可與印刷機和後加工設備整合（來源 42） |
| PrintVis | 物料需求由工作資料驅動，並使用同一套品項與庫存紀錄（來源 42） |
| Quote & Print、MyPrintCloud 等 | 網店訂單自動進 MIS，不重新輸入（來源 44） |

Avanti Slingshot 與 Tharstern 的官方整合頁面，本次抓取失敗或無可用頁面。見「查無公開資料」。

### 成品入庫，或完工即出貨

來源沒有任何一頁寫出「印刷業慣例」。下列只是各 MIS 官方或業界文章顯示的「兩種做法都存在」。

| 做法 | 來源中的描述 |
|------|-------------|
| 追蹤成品，等出貨 | Printlogic 追蹤已完工、等待出貨的成品，並記錄每件的貨架位置。出貨時產生送貨單，並把工作標為已送達（來源 45） |
| 以工作為單位消耗物料 | Printlogic 在工作進入生產時分配物料並扣庫存；領料單由工作紀錄產生（來源 45） |
| 工作與庫存並用 | Avanti 的產品架構師說，一個工作可同時使用庫存品與新印製品（來源 46） |
| 成品成本與數量要追蹤 | 同一篇文章說，系統應追蹤成品的成本與數量，不論是自製、外購或組合包（來源 46） |
| 履行品由 MIS 管庫存 | 網店的非印刷履行品，庫存與出貨狀態由 MIS 維護（來源 40） |

「一次性客製單完工即出貨、不入庫」的明確說法，來源沒有。接單生產在 SAP 與 Odoo 的做法，是讓訂單直接綁定生產單。（來源 8、16）

## 四、對委託方情境的借鏡與不適用

只寫可從來源直接推出的對照。

### 可借鏡

| 委託方現況 | 來源顯示的標準做法 | 對應來源 |
|-----------|------------------|---------|
| 題目選項綁主檔識別碼，沒有成品品號 | 母料號加屬性，配置結果展開成零件與工序。SAP、D365、Odoo 三家都有此做法 | 來源 10、12、14 |
| 線上規格品與線下客製單要共用骨架 | D365 的配置模型可從銷售單、報價單、採購單、生產單配置。同一個配置模型服務多種單據入口 | 來源 12 |
| 接單生產沒有成品品號 | SAP 基本策略 20 不需要 BOM，生產單綁銷售訂單。Odoo 的接單補貨路線讓製造單連回銷售單 | 來源 8、16 |
| 銷售訂單與工單要能互查 | Odoo 兩單互有連結按鈕。SAP 的成本在銷售訂單層級追蹤 | 來源 8、16 |
| 完工數直接看現場報工 | SAP 與 D365 的完工回報都把良品與不良（報廢、重工）分開填 | 來源 24、30 |
| 重工後的良品是否入庫 | SAP 重工量不自動收料，要手動過帳。重工可用原單加工序，或獨立不帶物料的單 | 來源 23、24 |
| 規劃「品檢通過前不可用」 | 三套系統都在完工與可用庫存之間有一道可選的檢驗或移庫步驟 | 來源 18、28、29、34、35 |
| 電商訂單進 MIS 後拆成工作 | MarketDirect StoreFront 多行訂單可拆成各自的工作送出 | 來源 39 |
| ERP 與電商的資料分工 | MIS 是履行品的產品、價格、庫存正本；訂單狀態由 MIS 回傳 | 來源 40 |
| 現場設備回傳完工資料 | JDF／JMF 讓裝置把作業資料回傳 MIS，供事後計算 | 來源 38 |

### 不適用或要小心

| 項目 | 原因 | 對應來源 |
|------|------|---------|
| 沒有庫存模組，無法套用「待驗庫存狀態」 | SAP、D365、Odoo 的待驗都以庫存狀態或庫存位置承載。沒有庫存，就沒有載體 | 來源 18、28、29、35 |
| 可承諾量（ATP）算法 | D365 的 ATP 以庫存、計畫收料、發料計算。無庫存模組時不能直接套用 | 來源 33 |
| Salesforce 範本的資料歸屬 | 範本以 PIM 為產品正本，是範本假設，不是通則 | 來源 3 |
| SAP 舊版文件 | 策略 20、25、重工、可用量檢查的頁面是 4.6C 與 4.70 版，S/4HANA 可能不同 | 來源 8、9、23、24、25 |
| 印刷業導讀的時效 | 網店與 MIS 的導讀是 2014 年，內容為廠商宣稱 | 來源 44 |
| 單一第三方網店限制 | Sana Commerce 只支援兩個變體元件、庫存只在父層。這是該廠商的限制，不是 SAP 標準 | 來源 11 |
| D365 品質單與完工回報的衝突 | 全數報廢時品質單會擋住完工回報，屬已知問題 | 來源 31 |

## 來源

1. [Data Integration with Salesforce](https://architect.salesforce.com/docs/architect/decision-guides/guide/data-integration.html) — 訂單送 ERP 與主資料回寫的串接手法、「未指定正本系統」的說明
2. [MuleSoft Accelerator for Salesforce OMS — Salesforce OMS to ERP Integration](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-salesforce-oms/minor/1.1/pages/e74-ta9/Salesforce%20OMS%20to%20ERP%20Integration/) — 履行單對應 S/4HANA 銷售訂單、狀態回傳、發票流程
3. [MuleSoft Accelerator for SAP — Use case 3a Quote-to-cash Salesforce and SAP S4HANA](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-sap/minor/1.6/pages/Use%20case%203a%20-%20Quote-to-cash%20-%20Salesforce%20and%20SAP%20S4HANA/) — Sales Cloud 與 CPQ 兩種情境的產品、定價、庫存、訂單歸屬
4. [MuleSoft Accelerator for Salesforce B2C Commerce Cloud — Use case 1 Products](https://anypoint.mulesoft.com/exchange/org.mule.examples/mulesoft-accelerator-for-salesforce-b2c-commerce-cloud/minor/1.5/pages/Use%20case%201%20-%20Products/) — 產品從 PIM 單向排程同步到 B2C Commerce
5. [Trailhead: Use Order Summaries](https://trailhead.salesforce.com/content/learn/modules/om-salesforce-order-management/om-use-order-summaries) — 訂單、訂單摘要、履行單、變更單的物件關係
6. [Trailhead: Streamline Order Fulfillment and Payment](https://trailhead.salesforce.com/content/learn/modules/om-salesforce-order-management/om-streamline-order-fulfillment-payment) — 履行單建立、指派地點、發票與外部財務對帳需整合
7. [Trailhead: Import and Export (Architecture of B2C Commerce)](https://trailhead.salesforce.com/content/learn/modules/architecture-of-commerce-cloud-digital/cc-digital-import-export) — 後台正本維護 SKU、匯入模式、差異檔建議
8. [SAP Help 4.6C: Strategies for Make-to-Order Production](https://help.sap.com/saphelp_46C/helpdata/EN/e0/71bb169c9f11d191920000e8a5f6e6/content.htm) — 策略 20：銷售訂單庫存、不需 BOM、成本在訂單層級
9. [SAP Help 4.6C: Make-to-Order Production with Configuration (25)](https://help.sap.com/saphelp_46C/helpdata/EN/cb/7f942743b711d189410000e829fbbd/content.htm) — 策略 25：可配置物料、銷售訂單輸入配置、不規劃母品
10. [SAP Help 4.70: Variant Configuration（可配置物料）](https://help.sap.com/saphelp_470/helpdata/en/d8/fa9bd49ede11d1903b0000e8a49aad/content.htm) — 可配置物料、超級 BOM、超級途程、配置檔
11. [Sana Commerce: Product Variants (SAP S/4HANA)](https://support.sana-commerce.com/Content/ERP-User-Guide/SAP-S4HANA/Webstore-Catalog/Product-Variants-SAP-S4HANA.htm) — 網店以 KMAT 與變體類別取用 S/4HANA 變體及其限制
12. [Set up a product configuration model (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/pim/set-up-maintain-product-configuration-model) — 限制式配置模型含 BOM 行、途程工序，可從多種單據配置
13. [Odoo 18: Product variants](https://www.odoo.com/documentation/18.0/applications/sales/sales/products_prices/products/variants.html) — 屬性、變體建立模式、每個變體有獨立庫存與銷售紀錄
14. [Odoo 18: Product variants in manufacturing (BoM)](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/product_variants.html) — 單一 BOM 服務多變體，製造單只列該變體零件
15. [Odoo 18: Bill of materials configuration](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/bill_configuration.html) — 零件與工序的「套用於變體」欄
16. [Odoo 18: Make to Order (MTO)](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/mto.html) — 確認銷售單即建製造單，兩單可追溯
17. [SAP Help 4.6C: Inspection Type](https://help.sap.com/saphelp_46c/helpdata/en/be/00bbd8ca5311d2961800a0c930e04c/content.htm) — 檢驗批來源類型清單，04 為生產收料檢驗、03 為製程中檢驗
18. [SAP Help 4.70: Inspection Lot Creation for Goods Receipt](https://help.sap.com/saphelp_470/helpdata/en/92/b808a8d52a11d2962200a0c930e04c/content.htm) — 收料自動建檢驗批、庫存相關與否、檢驗庫存只能經使用決定移出
19. [SAP Help 4.6C: Goods Receipt, Inspection and Stock for Production Orders](https://help.sap.com/saphelp_46c/helpdata/en/51/953e74a1fa11d189ba0000e829fbbd/content.htm) — 生產收料檢驗（類型 04）與使用決定後自動過帳到非限制使用庫存
20. [SAP Help 4.70: Goods Receipt and Quality Inspection Stock (WM)](https://help.sap.com/saphelp_470/helpdata/en/c6/f842d44afa11d182b90000e829fbfe/content.htm) — 庫存類別 Q、使用決定後轉非限制使用庫存（採購收料範例）
21. [SAP Help 4.6C: Making the Usage Decision](https://help.sap.com/saphelp_46c/helpdata/en/e9/78a937776eca61e10000009b38f8cf/content.htm) — 使用決定提案數量，範例 990 件非限制、10 件凍結
22. [SAP Help 4.6C: Goods Receipt for a Production Order](https://help.sap.com/saphelp_46c/helpdata/en/51/9531d8a1fa11d189ba0000e829fbbd/content.htm) — 生產訂單收料過帳（移動類型 101）的操作
23. [SAP Help 4.70: Integration of Rework for Production Orders](https://help.sap.com/saphelp_470/helpdata/en/90/ba69a9446711d189420000e829fbbd/content.htm) — 重工放同一張單或另開不帶物料的單，成本與報廢處理
24. [SAP Help 4.6C: Rework and Confirmation](https://help.sap.com/saphelp_46C/helpdata/EN/b1/c05187439a11d189410000e829fbbd/content.htm) — 重工量、自動收料只過帳良品、重工良品手動入庫
25. [SAP Help 4.6C: Availability Check According to ATP Logic](https://help.sap.com/saphelp_46c/helpdata/en/f4/7d325344af11d182b40000e829fbfe/content.htm) — 可用量檢查的收料來源與可用量定義
26. [Quality and nonconformance management overview (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/quality-management-processes) — 品質關聯、品質單、不符合單、矯正處理
27. [Inspect the quality of goods (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/tasks/inspect-quality-goods) — 品質單的結果輸入與驗證步驟
28. [Inventory blocking (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-blocking) — 品質單與庫存狀態兩種封鎖機制、預期收料、保留已訂購品項
29. [Inventory statuses (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-statuses) — 庫存狀態、封鎖狀態不可用於生產與銷售、計畫視為缺料
30. [Report a production order as finished (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/tasks/report-production-order-finished) — 完工回報填良品、不良數量與原因，日記帳過帳
31. [Microsoft Community KA-23690: Quality order blocks Report as finished](https://community.dynamics.com/article/KA-23690) — 全數報廢時品質單擋住完工回報的已知問題與繞過方式
32. [Scrap in Dynamics Finance and Operations (Dynamics Communities)](https://dynamicscommunities.com/ug/dynamics-fo-ax-ug/scrap-in-dynamics-finance-operations-what-it-means-where-to-set-it-and-how-the-math-works/) — 計畫報廢與不良數量，分攤到良品或記入報廢科目
33. [Order promising (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/supply-chain/sales-marketing/delivery-dates-available-promise-calculations) — 銷售前置天數、ATP、CTP 與 ATP 算法
34. [Odoo 18: Quality control points](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_control_points.html) — 品質控制點設定作業為製造、檢查類型、失敗訊息
35. [Odoo 18: Three-step manufacturing](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html) — 領料、製造、成品入庫三張單
36. [Odoo 18: Scrap in manufacturing orders](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/workflows/scrap_manufacturing.html) — 製造單報廢的階段限制與虛擬報廢位置
37. [Odoo 18: Unbuild orders](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/workflows/unbuild_orders.html) — 拆解單的庫存效果
38. [CIP4: JDF and XJDF](https://cip4.org/print-automation/jdf) — JDF、XJDF、JMF 的定義與 MIS 在其中的角色
39. [MarketDirect StoreFront Help: MIS Systems](https://dso.dla.mil/DSF/documentation/en/HTML/AdminHelp/MIS_Systems/MIS_Systems.htm) — 網店送訂單給 MIS 的 XML、拆工作、狀態與發票回傳（此頁由第三方機構代管）
40. [MarketDirect StoreFront Help: MIS Integration and Fulfillment](https://dso.dla.mil/DSF/documentation/en/HTML/AdminHelp/MIS_Systems/MIS_Integration_and_Fulfillment_in_Digital_StoreFront.htm) — 履行品、價格、庫存由 MIS 維護，授權條件（此頁由第三方機構代管）
41. [MarketDirect StoreFront Help: Communication Channels](https://dso.dla.mil/DSF/documentation/en/HTML/AdminHelp/MIS_Systems/Communication_Channels.htm) — Pace 與 Monarch 用直接通道，PrintSmith Vision 與 Radius 用 eFlow（此頁由第三方機構代管）
42. [Sabre Limited: What is PrintVis](https://www.sabrelimited.com/blogs/what-is-printvis/) — Web2PrintVis、JDF 認證、物料需求由工作資料驅動（PrintVis 實作夥伴的文章）
43. [What Is PrintVis? Print Management Software for Business Central (Dynamics Communities)](https://dynamicscommunities.com/uncategorized/what-is-printvis-print-management-software-for-business-central) — PrintVis 內嵌 Business Central、共用資料庫
44. [Tech guide: MIS and web-to-print (Sprinter, 2014)](https://www.sprinter.com.au/tech-guide-mis-and-web-to-print) — 多家廠商的網店到 MIS 訂單流、產品定義、JDF 與庫存分工（業界媒體導讀）
45. [Printlogic: Print Inventory Management Software](https://www.printlogicsystem.com/print-inventory-management-software.php) — 成品等待出貨追蹤、領料與出貨流程（廠商頁面）
46. [Print Planet: What's in Your Warehouse? Are You Sure?](https://printplanet.com/threads/what%E2%80%99s-in-your-warehouse-are-you-sure.290463/) — 引述 Avanti 架構師對工作式與庫存式、成品追蹤的說明（論壇轉載文章）

## 查無公開資料

| 項目 | 狀況 |
|------|------|
| Salesforce 官方對「可配置產品／CPQ 配置結果」主資料歸屬的說明 | 官方頁面（developer.salesforce.com）抓取回應 403。搜尋摘要有 Revenue Cloud 產品配置器的描述，但未能開啟，未列入 |
| Salesforce Manufacturing Cloud 與 ERP 的串接模式 | 官方常見問答頁已開啟，內容未涵蓋 ERP、CPQ、銷售協議的整合 |
| Salesforce 訂單如何從 ERP 流到生產工單 | 範本只到「ERP 建銷售訂單」與狀態回傳，未涵蓋生產 |
| SAP Commerce Cloud 與 S/4HANA 的官方整合（產品複製、訂單複製、資料歸屬） | learning.sap.com 與 sap.com 頁面抓取失敗（404 或 403）。第三方顧問文章已開啟但未明確指定資料歸屬，未列入 |
| SAP 的銷售訂單到生產訂單在 S/4HANA 現行版的流程 | 只取得 4.6C 與 4.70 舊版文件 |
| SAP 報廢過帳（移動類型與單據）的官方說明 | 使用決定頁面明寫未涵蓋報廢與退回生產；只在論壇看到說法，未列入 |
| SAP 的可用量檢查是否把生產訂單算作收料 | 官方頁面未提 |
| D365 與 Odoo 的重工單（rework order）官方作法 | 未找到現行官方頁面。D365 只找到 AX 2012 批次重工，與生產訂單重工無關 |
| D365 品質單判定後，庫存從封鎖轉可用的過帳細節 | 驗證步驟頁面未寫庫存過帳 |
| D365 完工回報與入庫各自如何進入 ATP | 官方頁面未寫 |
| Odoo 的可承諾量算法與銷售單承諾日期 | 未找到官方頁面 |
| 多品號與可配置 BOM 兩種模式的選擇判準 | 各家文件只描述功能，沒有明列適用條件 |
| Avanti Slingshot 網店串接的官方文件 | avantisystems.com 頁面憑證過期，抓取失敗；搜尋摘要未列入 |
| Tharstern 網店到工單的官方文件 | 未找到 Tharstern 官方頁面 |
| EFI Pace 的產品目錄同步與工單建立機制 | 只取得 MarketDirect StoreFront 管理說明；Pace 端的整合指南未找到 |
| PrintVis 網店產品如何定義、工單如何對應品項 | 只取得廠商與夥伴的概述，未涵蓋細節 |
| 印刷業「成品入庫或完工即出貨」的業界慣例 | 沒有來源明確陳述慣例；只能呈現兩種做法並存 |

## 第一輪初步分析（Claude 寫）

- 觀察：三套通用系統把「待驗」做成成品的庫存狀態或庫存位置（SAP 檢驗庫存、D365 品質單封鎖與庫存狀態、Odoo 三步製造的中間位置）；現行 wiki 把待驗做成 [[印件]] 層的衍生數字，差在載體不在數值。
- 觀察：可配置產品在 SAP、D365、Odoo 三家都以「母料號加屬性，配置結果展開成零件與工序」落地；EC 現況的題目與選項綁 ERP 主檔識別碼對應其前半段，後半段（選項到 BOM 行與工序）尚無載體，與 [[配方展開規則]] 現況段「EC 商品的部件與 BOM 人工建立」一致。
- 觀察：網店到 MIS 的整合（MarketDirect StoreFront）以 XML 訂單進 MIS、多行拆成多個工作、狀態與發票回傳；產品與價格的正本在 MIS 端。對照 [[EC 商品管理]]「EC 商品不在 ERP 範圍」，分工方向相反，值得在 EC 整合設計時攤開。
- 觀察：重工在 SAP 有「原單加工序」與「另開不帶物料的單、成本轉回原單」兩路；現行「補做在原工單加開生產任務」接近第一路。
- 候選相關卡：[[印件]]、[[品檢紀錄]]、[[成品庫存]]、[[物料庫存]]、[[配方展開規則]]、[[印件配方]]、[[部件配方]]、[[EC 商品管理]]、[[ERP與MES建置專案]]
- 同主題既有 raw：2026-06-14 六份系統調研（Dynamics 365、Odoo、ISA-95、PrintVis、印刷 MIS、Salesforce Manufacturing Cloud）涵蓋結構層；本卡補執行流程與整合架構，不重疊、不建議合併。
- 候選 OQ 候補：無（查無資料段是來源狀況，不是設計問題）。
- 候選升級路徑：不直接升級。本卡是 `memory/erp/erp-mes-standard-alignment-20261028/比對矩陣.md` 的來源 7；下一輪規劃流 pre-check 讀本卡與比對矩陣後，再決定哪些結論進 04 規則或 05 實體。

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）

## 精練去處（Mode B 完成後填）

<!-- Mode A 寫入時保留下方註解樣板不填。Mode B 完成後以實際 wiki link 清單取代整段註解 -->

<!-- Mode B step 6 寫入後在此列出 wiki link：
- [[../04-business-logic/X]] — 新增 § A
- [[../08-open-questions/Y-001-Z]] — 升級為 OQ
- 取消（理由：...）
-->
