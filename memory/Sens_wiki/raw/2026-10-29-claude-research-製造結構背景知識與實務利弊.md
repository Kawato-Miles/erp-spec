---
type: raw
status: raw
created-at: 2026-10-29
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - 品號主檔
  - 物料清單
  - 製程路線
  - 在製品與待驗庫存
  - 商品配置器
  - 重工與報廢
  - 製造指標
related-vault:
  - "[[印件配方]]"
  - "[[部件配方]]"
  - "[[配方展開規則]]"
  - "[[數量換算規則]]"
  - "[[成品庫存]]"
  - "[[物料庫存]]"
  - "[[品檢紀錄]]"
  - "[[齊套邏輯]]"
  - "[[生產績效指標]]"
  - "[[EC 商品管理]]"
raw-source-link: https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-create-production-boms
---

# 製造結構背景知識與實務利弊（品號、物料清單、在製品、配置器、重工、指標）

> 摘錄重點，非全文轉錄。撰寫者為 Sonnet 研究代理（2026-10-29），主對話以 WebFetch 抽查 7 條來源（來源 1、15、20、25、28、38、41），全部相符，兩處措辭收緊並標在原句。

## 研究範圍與方法

目的：替印刷業產品經理整理六個主題的外部背景知識與實務利弊。六個主題如下表。

| 代號 | 主題 |
|------|------|
| A | 品號主檔（item master）與一次性客製品的品號策略 |
| B | 物料清單（BOM）與製程路線（routing）的存法、用量驅動、損耗率、版本 |
| C | 在製品（WIP）、待驗庫存狀態、品檢後分流、分批入庫 |
| D | 商品配置器（product configurator）與網路印刷（web-to-print）資料正本 |
| E | 重工（rework）的記法與報廢成本歸屬 |
| F | 製造指標與上述結構的關係 |

方法：用網路搜尋找來源，再逐頁開啟內容核對。共 42 頁開啟成功，全部列在「來源」段。

下列頁面開啟失敗，不列為來源：ASQ 詞彙與文章（403）、ASCM 詞彙（未開到頁面）、Gelato 印刷管理資訊系統（MIS）文章（403）、WhatTheyThink InfoFlo 文章（403）、McKinsey 準時足量文章（逾時）、SAP 新版說明入口（頁面只回傳標題）。

使用限制如下。

- 微軟文件描述的是 Business Central 或 Dynamics 365 Supply Chain Management（簡稱 D365）的做法，不代表所有系統。
- SAP 文件是舊版頁面（來源 4、14），新版行為未核對。
- 論壇文章（來源 15、21、22、40）是使用者意見，不是廠商規格。
- 網路印刷文章（來源 33、34、35）發表於 2017 至 2018 年，內含廠商自述。
- 本檔主題段只寫來源明載的內容。來源沒寫的格子標「來源未載明」。
- 研究期間除指定的 Raw 素材範本外，未讀 Sens wiki 任何檔案。

## 主題 A：品號主檔與一次性客製品的品號策略

背景：品號主檔是物料與產品的登錄資料。Dynamics 365 把產品定義成「產品主檔」加「產品變體」。主檔存規則，變體是依規則產生的具體產品（來源 13）。PrintVis（建在 Business Central 內的印刷管理資訊系統）以案件（case）為單位。案件收納一張訂單從報價到開發票的全部資訊（來源 29）。工作（job）是系統內部紀錄，編號由系統自動給（來源 29）。工作項目（job item）是案件內產品組成件的技術定義（來源 28）。工作項目可用品號連結到品項表（Item table），也可用產品代碼當範本或庫存品項（來源 28；查證相符）。

| 做法 | 好處 | 代價 | 適用條件 | 來源 |
|------|------|------|----------|------|
| 基底品號複製：先建基底品號，每張客戶訂單複製一份 | 複製時同步複製物料清單與製程路線，可針對該客戶修改，不動基底品號（來源 20） | 來源未載明 | 產品已標準化、但每單都要客製（來源 20） | 20 |
| 類型級品號加每單一份物料清單 | 不必為每種規格建一個品號。論壇使用者認為每種面板一個品號不實際（來源 21） | 沒有相容規則的引導（來源 21） | 客製程度高、規格種類多（來源 21） | 21 |
| 非庫存佔位品號：物料清單先放佔位品，設計逐步具體後替換 | 每次工程迭代讓結構更具體，並對採購送出需求訊號（來源 21） | 需用物料清單替換工具或介面，部分需客製開發（來源 21） | 與外部設計軟體整合（來源 21） | 21 |
| 通用品號加手填用料：不建專屬品號與物料清單，直接在製造單上輸入用料 | 簡單產品不必建獨立品號或物料清單（來源 20） | 來源未載明 | 較簡單的產品（來源 20） | 20 |
| 專案專屬庫存：全部庫存屬於特定專案，須為該專案製造或採購 | 配置規則在下單時評估，不必預先備好所有組合的庫存（來源 24） | 不保留可跨訂單共用的配置品庫存（來源 24） | 按專案接單的工程型客製（來源 24） | 24 |
| 可配置品號：一個產品主檔加配置規則，產生變體 | 一個主檔存規則，可產生多個變體（來源 13）。每個變體有獨立的物料清單與製程路線（來源 12） | 配置技術要在導入前選好。導入後產品不能從一種模型轉成另一種（來源 13） | 規格由屬性組合決定（來源 12） | 12、13 |
| 以工作當核心物件（PrintVis） | 估價、訂單、出貨掛在同一個案件與工作下（來源 29）。工作成本比對估價與實際（來源 30） | 作業單位分得太細，師傅沒記到那個細度，估價行就沒有對應實績（來源 30） | 印刷接單流程，報價與生產要用同一份資料（來源 28、29） | 28、29、30 |
| 結構群組不用品號：用虛擬物料清單（phantom BOM）分組 | 不需品號卡，也沒有庫存交易，成本直接滾入上層品項（來源 1） | 該群組不會形成可獨立管理的庫存（來源 1） | 子組件不單獨入庫、不單獨銷售（來源 1） | 1 |

補充：工程型客製（engineer-to-order，ETO）通常要求每單有自訂物料清單與專屬製程（來源 27）。同一頁指出「不是所有企業資源規劃系統都處理得好」（來源 27）。要比較四套印刷管理資訊系統（EFI Pace、Avanti Slingshot、Tharstern、PrintVis）的核心物件，只找到 PrintVis 的文件（見「查無公開資料」段）。

## 主題 B：物料清單與製程路線

背景：Business Central 的物料清單決定生產單的用料需求（來源 1）。製程路線決定生產單的工序排程（來源 2）。兩者是兩份主檔，用「路線連結代碼」把用料綁到工序（來源 2）。Monitor ERP 把兩者放在同一個「物料清單與路線」程序內維護（來源 23）。損耗有兩種記法。物料清單損耗增加用料量，路線損耗增加每道工序要處理的數量（來源 2）。

| 做法 | 好處 | 代價 | 適用條件 | 來源 |
|------|------|------|----------|------|
| 物料清單與路線分開存，用連結代碼綁定 | 生產可能把某道工序改外包，物料清單不必改（來源 22）。連結代碼讓用料與工序的關係在任一邊修改後仍保留，並可在工序開工時才領料（來源 2） | 同一連結代碼用在兩道工序，用料會被算兩次（來源 2） | 同一產品的製法會變、設計與生產由不同人負責（來源 22） | 2、22 |
| 兩者在同一程序維護（Monitor ERP） | 資料用於計算、需求計算與負荷計畫（來源 23）。回報的實際工時可回寫到物料清單與路線（來源 23） | 來源未載明 | 來源未載明 | 23 |
| 物料清單用量驅動用料展開 | 規劃引擎可依損耗算出該採購的原料量（來源 3）。生產單的元件用量由物料清單計算（來源 1） | 準確度要求高。JD Edwards 文件要求物料清單準確率至少 98%，量法是比對現場實際做法與物料清單（來源 25）。準確度不足會降低供貨率，或需要更多庫存（來源 26） | 需要規劃引擎算採購量時（來源 3） | 1、3、25、26 |
| 由人填數量（物料清單不驅動） | 簡單產品可直接在製造單輸入用料（來源 20） | 標準成本制下，手動加入的用料或工序會記為「替代差異」（來源 11） | 簡單產品（來源 20） | 11、20 |
| 損耗率放物料清單行 | Business Central 的損耗百分比加在領料消耗量上（來源 1）。D365 可分固定損耗與變動損耗，採購量 = 需求 ×（1 + 變動損耗）+ 固定損耗（來源 3） | 行上計算公式選「固定數量」時，同一行的損耗百分比被忽略（來源 1） | 損耗與領料量有關（來源 1） | 1、3 |
| 損耗率放工序（路線） | 損耗從最後一道工序往前累積，路線損耗也計入標準成本（來源 2）。D365 以累積損耗算出第一道工序要投入的原料量（來源 3） | 來源未載明 | 損耗發生在特定工序（來源 2、3） | 2、3 |
| 損耗率放設備（機台） | 來源只見機台損耗百分比的報表指標：機台損耗量除以機台產出（來源 9） | 設定層面的做法來源未載明 | 來源未載明 | 9 |
| 物料清單版本與有效日期 | 版本由起始日定義有效期，下一版生效前一直有效。用於零件換新或客戶要特殊版本（來源 1）。路線也有同樣的版本機制（來源 2）。變更管理型產品可記錄每筆交易用的版本（來源 13） | 建單時選到和標準成本計算不同的版本，會產生替代差異（來源 11） | 零件會換新、有工程變更管理（來源 1、13） | 1、2、11、13 |
| 印刷業特殊性：紙張用量 | 開機（make-ready）損耗是固定的開機損失，與印量無關，並加進紙張數量（來源 37）。Business Central 的用量公式可用長乘寬算面積用量（來源 1） | 拼版（imposition）如何影響紙量，本檔所開頁面未說明（來源 37） | 膠印（offset）按每個印刷區段設定開機損耗（來源 37） | 1、37 |

補充：PrintVis 的工作項目帶有紙材、印刷機與印刷張號（來源 28）。可見印刷管理資訊系統把用料與印刷機資訊放在工作項目上，而不是通用物料清單。

## 主題 C：在製品、待驗庫存狀態、品檢後分流、分批入庫

背景：SAP 把庫存分為「可自由使用」「品檢中」「凍結」三類。收貨時選類型（來源 4）。標準設定下，品檢中與凍結庫存不能出庫（來源 4）。D365 用庫存狀態分「可用」與「不可用」。被封鎖的狀態不能用於生產單、銷售單、調撥單（來源 5）。Business Central 的成本流程是原料帳、在製品帳、成品帳三個帳。完工產出把成本從在製品轉進成品（來源 8）。

| 做法 | 好處 | 代價 | 適用條件 | 來源 |
|------|------|------|----------|------|
| 庫存狀態（可用／不可用／封鎖） | 封鎖狀態的庫存不能被生產、銷售、調撥取用（來源 5）。排程執行時，封鎖品視為缺料並自動補貨（來源 5） | 有未完成倉庫作業的位置，不能改庫存狀態（來源 5）。在製品相關的狀態通常由作業員用行動應用程式改（來源 5） | 需要把「不可賣」庫存擋在配貨之外（來源 5） | 5 |
| 品檢單掛在生產單或工序，不靠庫存位置 | 品檢單可指向生產單（成品入庫前檢驗），也可指向工序（下一步前檢驗在製品）（來源 7） | 手動建立的品檢單會自動產生一筆庫存封鎖紀錄（來源 7）。驗過且通過的品檢單預設不能再編輯，要「重新開啟」（來源 7） | 品檢與工序、生產單要對得上（來源 7） | 7 |
| 隔離倉與隔離單（退貨重驗） | 退貨或待分析品移到隔離倉，結束後再移回正常倉，也可在流程內報廢（來源 6）。品檢單可指向隔離單（來源 7） | 啟用倉庫管理流程時，隔離單只適用退貨銷售單（來源 6） | 要把待分析品實體隔離（來源 6） | 6、7 |
| 輕量帳：不產生在製品庫存 | Business Central 的組裝單成本只過帳一次，不產生在製品庫存。生產單才有在製品流程（來源 8） | 來源未載明 | 簡單組裝流程（來源 8） | 8 |
| 在製品追蹤：工單隨行單據加條碼 | 掃條碼可開啟工單、對單一工序記工時、查在製品在哪（來源 39） | 來源未載明 | 按工單走站的生產（來源 39） | 39 |
| 在製品位置追蹤的三種做法（論壇，航太工廠） | 單一在製品儲位：簡單，但沒有位置細節。推車儲位：不必做庫存移動，位置由推算而來。自動移轉儲位：位置精確（來源 40） | 自動移轉儲位每次移動都要交易，設定與訓練負擔重。推車儲位需要報工系統與人員維護（來源 40） | 4,533 張開立工單、104 個工作中心的大型工廠（來源 40） | 40 |
| 分批入庫：產出少於需求時拆出後續單 | 已做好的先結案，其餘留在後續單（來源 18）。路線可設「先送量」，下一工序不必等整批做完（來源 2） | 現場介面若按「全部數量」鍵，會把全量登記為已產出（來源 18） | 需分批完工與出貨（來源 18） | 2、18 |
| 跨訂單調撥：完工時改指定給別張訂單 | Sage 100 允許完工時覆寫原指定的銷售單；「欠量補貨報表」列出已完工、可供其他工單或銷售單欠量使用的零件（來源 38；查證：報表不配對特定成品與特定訂單） | 成品仍會先入庫，不論指定給誰（來源 38） | 以「為誰而做」欄位管理用途的系統（來源 38） | 38 |

## 主題 D：商品配置器與網路印刷資料正本

背景：D365 的商品配置模型是通用產品結構，可配置出許多變體。每個變體有獨立的物料清單與路線（來源 12）。配置規則分「運算式限制」與「資料表限制」兩種，保證只選得到有效組合（來源 12）。D365 有三種配置技術：預先定義變體、維度式配置（共用一份全域物料清單）、限制式配置（來源 13）。

| 做法 | 好處 | 代價 | 適用條件 | 來源 |
|------|------|------|----------|------|
| 預先定義變體：每個有效組合一筆 | 每個變體有自己的庫存與銷售紀錄（來源 19）。D365 的預先定義變體要先定義有效的維度組合（來源 13） | 組合數相乘。Odoo 的範例是四種顏色乘五種尺寸，得二十個變體（來源 19）。Shopify 的單一產品變體上限已從 100 升到 2,048（來源 36） | 組合數少而固定（來源 19） | 13、19、36 |
| 變體建立模式：立即、動態、不建立（Odoo） | 動態模式只在屬性值加入銷售單時才建立變體。不建立模式只當資訊，不產生可購買的變體（來源 19） | 屬性加入產品後，建立模式不能再改（來源 19） | 組合很多、多數不會被下單時（來源 19） | 19 |
| 維度式配置（全域物料清單） | 一份共用物料清單，依選定組態取有效行來規劃與生產（來源 13） | 來源未載明 | 製造情境（來源 13） | 13 |
| 限制式配置模型 | 限制條件保證只選得到有效值（來源 12）。物料清單行與工序可用條件決定是否納入（來源 12） | 運算式限制要用求解器語法撰寫。子組件的產品要設為限制式配置技術（來源 12） | 規格由多個屬性與限制組成（來源 12、13） | 12、13 |
| 自建配置器或外購配置器 | 外購：自帶規則引擎與介面，用介面整合（來源 21） | 自建：論壇使用者估計要數百小時，且要自訂資料表與介面。外購：每月授權費高，並要修改系統（來源 21） | 沒有現成方案時（來源 21） | 21 |
| 手動維護多份物料清單 | 最簡單（來源 21） | 沒有相容規則引導（來源 21） | 組合少、人工可控（來源 21） | 21 |
| 資料正本在管理資訊系統，網店唯讀（MarketDirect StoreFront） | 非印刷品名稱、品號、價格、圖片由管理資訊系統提供，網店不能改。庫存量由管理資訊系統回傳網店，訂單由網店送回（來源 32） | 不是每套管理資訊系統都支援這種出貨整合（來源 32） | 有庫存的非印刷品（來源 32） | 32 |
| 網店與管理資訊系統共用資料庫或內建 | 廠商宣稱不需再串接線上訂單與生產系統（來源 33）。Accura 的客戶、帳號、產品圖與價格都在管理資訊系統維護（來源 33） | 以上是廠商自述（來源 33） | 單一廠商方案（來源 33） | 33 |
| 兩個系統靠介面串接 | 來源未載明 | 介面串接常需廠商客製程式，增加時間與成本。Accura 把沒有直接串接的網店稱為「網店通往虛空」（來源 33） | 已有網店要沿用（來源 33） | 33 |
| 分工：網店報價數位印刷，管理資訊系統管膠印與生產 | 網店可報多數數位印件價（來源 34） | 複雜膠印要靠管理資訊系統的估價引擎。生產規劃、工作成本、現場資料收集、倉儲仍需管理資訊系統（來源 34）。網店設定有時要數個月（來源 34） | 數位與膠印並存（來源 34） | 34 |

補充：多平台並行會削弱商業智慧（BI）報表能力。這是一位印刷業者的看法（來源 35）。

## 主題 E：重工與報廢成本

背景：SAP 文件列出三種把重工放進生產單的做法：另開重工單、手動插入個別工序、加入參考工序組（來源 14）。D365 把「手動在生產路線加工序並回報」列為替代差異的來源之一（來源 11）。最終良率把重工後合格的單位算良品。一次通過良率（FPY）不算（來源 41）。

| 做法 | 好處 | 代價 | 適用條件 | 來源 |
|------|------|------|----------|------|
| 在原工單插入重工工序（SAP 個別工序、參考工序組） | 重工工序確認後，成本更新到原單。計畫成本會重算（來源 14） | 在 IFS 論壇，新增的重工工序沿用整張工單的批量。例：批量 50 片只重工 2 片，成本與工時會失真（來源 15） | 整批重工（來源 15） | 14、15 |
| 另開重工單，結算回原單（SAP） | 重工成本在重工單累積，結算時轉回原單，在原單以一般差異類別呈現。用專屬結算成本要素可辨識重工成本，以資源使用差異報告（來源 14） | 重工單結算完成前，接收單不能刪除或歸檔（來源 14） | 重工用的製程與原生產不同時（來源 14） | 14 |
| 重工中發生的報廢 | SAP：重工工序確認的報廢，歸到「造成重工的工序」，成本落在一般差異類別（來源 14） | 來源未載明 | 使用 SAP 重工流程時（來源 14） | 14 |
| 良率口徑：最終良率對一次通過良率 | 一次通過良率暴露重工。範例：1,000 件中 120 件首檢不合格，最終良率 98%，一次通過良率 88%。差距 10 點等於 100 件重工（來源 41） | 兩種口徑都要記首檢結果與重工結果（來源 41） | 想看「隱藏工廠」（重工耗用的產能）時（來源 41） | 41 |
| 報廢成本：進損失科目 | Odoo：報廢品移到類型為「庫存損失」的位置，記入損失科目，在損益表顯示為費用（來源 17）。製造單內報廢品移到虛擬報廢位置（來源 16） | 需設定成本方法與永續盤存（來源 17） | 要在損益表看到報廢損失時（來源 17） | 16、17 |
| 報廢成本：併入工序標準成本 | 路線損耗讓工序產能成本乘上累積損耗係數，標準成本隨之增加（來源 2） | 來源未載明 | 損耗率穩定的工序（來源 2） | 2 |
| 報廢成本：以差異呈現 | Business Central 把實際成本與標準成本比對，差異可用於發現加工過程的過量損耗（來源 8）。報表指標含「生產單報廢率」，等於報廢量除以完成量（來源 9） | 來源未載明 | 有標準成本基準時（來源 8、9） | 8、9 |

## 主題 F：製造指標與結構的關係

背景：JD Edwards 文件列出物料需求規劃（MRP）的輸入準確度：物料清單至少 98%，庫存至少 95%，庫存準確度靠循環盤點達成（來源 25）。TechTarget 的專欄指出 98% 是老經驗法則。作者認為準確度是程度問題，不是硬門檻（來源 26）。

| 指標 | 做法（定義與口徑） | 需要的資料基礎 | 準確度或口徑的代價 | 來源 |
|------|-------------------|----------------|--------------------|------|
| 物料清單準確率 | 比對現場實際做法與物料清單中的元件與數量（來源 25） | 要有物料清單可比對（來源 25） | JD Edwards 建議至少 98%（來源 25） | 25 |
| 庫存紀錄準確率 | 庫存計數至少 95% 準確，靠循環盤點（來源 25） | 要有庫存計數（來源 25） | 準確度低時，要更多安全庫存或接受較低供貨率（來源 26） | 25、26 |
| 良率、一次通過良率、折損率 | 最終良率 = 良品除以投入。一次通過良率不含重工（來源 41）。生產單報廢率 = 報廢量除以完成量（來源 9） | 要記投入數、首檢不合格數、報廢量與完成量（來源 9、41） | 兩種良率口徑差 10 點的範例見來源 41 | 9、41 |
| 準時足量交付（OTIF） | OTIF = 準時且足量的訂單數除以總訂單數（來源 42） | 要有訂單（或訂單行）的應交量與實交量（來源 42） | 訂單層級與行層級口徑不同。部分延遲出貨在嚴格定義下算失敗（來源 42） | 42 |
| 工單成本差異 | 實際成本與標準成本比對。D365 分生產價格、數量、批量、替代差異（來源 10）。數量差異來源含領料過量或不足、工時多報或少報（來源 11） | 要有標準成本（由物料清單與路線算出）（來源 8、11） | 手動改物料清單或路線、選不同版本，會產生批量或替代差異（來源 11） | 8、10、11 |

## 對委託方情境的對照（以下是推論，不是來源明載）

委託方現況：沒有成品與半成品品號主檔；配方的用量只作參考；工單數量由印務手填；沒有庫存模組；待驗、合格、可出貨是印件層算出的數字；重工在原工單加開任務；電商人工維護部件與物料清單。

| 議題 | 推論 | 推論所依據的來源 |
|------|------|------------------|
| 沒有品號主檔是否異常 | 線下客製接單以案件與工作為核心，不一定要品號。PrintVis 的做法就是如此。電商規格品像標準產品，較接近「產品主檔加變體」的情境。兩條線可能適用不同策略 | 13、28、29 |
| 電商部件與物料清單人工維護 | 組合多時，人工維護成本隨組合數上升。配置規則放網店或放管理資訊系統，要先決定正本方向。有一種現成模式是管理資訊系統為正本、網店唯讀 | 19、21、32、36 |
| 用量只作參考、數量手填 | 工單成本差異沒有標準基準可比。需求計算與採購量也算不出。損耗率放哪一層的問題，目前無從落地 | 3、8、11 |
| 待驗、合格、可出貨由印件層算出 | 這等同「數量帳」做法。要不要升級成庫存狀態，取決於有沒有「要擋住不被取用」的需求，例如退貨重驗、跨單調撥、分批出貨 | 4、5、6、18、38 |
| 重工在原工單加任務 | 若重工只涉及部分數量，原單任務可能沿用整單批量，成本失真。是否要拆出重工成本，取決於要不要算重工率與一次通過良率 | 14、15、41 |
| 指標可算性 | 物料清單準確率與庫存準確率，在沒有物料清單驅動與庫存模組時，無對象可比對。OTIF 只需訂單的應交量與實交量，與品號無關。良率需要首檢不合格數與重工數，印件層能否取得要另行確認 | 25、41、42 |

## 第一輪初步分析（Claude 寫）

- 觀察：外部資料支持「按單生產可以不靠品號」，但只在工作成本、報價、生產共用同一份資料時成立（來源 29、30）。
- 觀察：多數利弊來自 Business Central、D365、SAP、Odoo 的文件。印刷業專屬證據只有 PrintVis 文件與 2017 至 2018 年的印刷業報導。
- 候選相關卡（主對話補）：[[印件配方]]、[[部件配方]]、[[配方展開規則]]、[[數量換算規則]]（主題 A、B）；[[成品庫存]]、[[物料庫存]]、[[品檢紀錄]]、[[齊套邏輯]]（主題 C、E）；[[EC 商品管理]]（主題 D）；[[生產績效指標]]（主題 F）。
- 同主題既有 raw：2026-10-28 整合架構與完工入庫流程研究（流程面）；本卡補結構面的背景與利弊，不重疊、不合併。
- 用途：供 `memory/erp/erp-mes-standard-alignment-20261028/` 的說明頁「背景知識與實務利弊」段與下一輪規劃流 pre-check 引用。
- 候選 OQ 候補：無。本檔只提供外部背景，未涉及設計決定。
- 候選升級路徑：不升級，供精練階段參考。

## 來源

1. [Create production BOMs - Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-create-production-boms) — 取用物料清單決定用料、損耗百分比、版本起始日、計算公式、虛擬物料清單。
2. [Create routings - Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/production-how-to-create-routings) — 取用路線版本、路線連結代碼、先送量、路線損耗與累積方式、損耗對標準成本的影響。
3. [Set up scrap to calculate raw material requirements - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/scrap-calculations) — 取用物料清單與路線損耗設定、固定與變動損耗、採購量公式。
4. [Inventory Management: Stock Types - SAP Documentation](https://help.sap.com/doc/a6a8c7536e8e2a4be10000000a174cb4/700_SFIN3E%20006/en-US/299bc7536e8e2a4be10000000a174cb4.html) — 取用三種庫存類型與可用性。
5. [Inventory statuses - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-statuses) — 取用庫存狀態、封鎖機制、排程視封鎖品為缺料、改狀態的限制。
6. [Quarantine orders - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/quarantine-orders) — 取用隔離單流程、狀態、報廢、與倉庫管理的限制。
7. [Quality orders - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/quality-orders) — 取用品檢單參照類型（生產、工序、隔離）、自動封鎖紀錄、重新開啟。
8. [Design details - Production order posting - Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/design-details-production-order-posting) — 取用原料、在製品、成品三帳、組裝單不產生在製品、標準成本與差異。
9. [Manufacturing KPIs and measures (Power BI) - Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/manufacturing-powerbi-kpis) — 取用報廢率、預期報廢量、機台損耗率等指標定義。
10. [Standard cost variance posting - Finance](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/standard-cost-variance-posting) — 取用生產價格、數量、批量、替代差異的定義。
11. [Common sources of production variances - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/common-sources-of-production-variances) — 取用各類差異的常見來源，含手動改物料清單與路線。
12. [Product configuration models overview - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/pim/product-configuration-models) — 取用商品配置模型、限制、物料清單行與工序條件。
13. [Product information overview - Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/pim/product-information) — 取用產品主檔與變體、三種配置技術、導入後不可轉換、變更管理型產品。
14. [Integration of Rework for Production Orders - SAP Documentation](https://help.sap.com/saphelp_470/helpdata/en/90/ba69a9446711d189420000e829fbbd/content.htm) — 取用三種重工整合做法、結算回原單、重工中報廢的歸屬。
15. [Applying rework labor without a rework shop order - IFS Community](https://community.ifs.com/products-manufacturing-products-engineering-40/applying-rework-labor-without-a-rework-shop-order-8154) — 取用在原單加重工工序沿用整單批量的限制。
16. [Scrap during manufacturing - Odoo 20.0 documentation](https://www.odoo.com/documentation/20.0/applications/inventory_and_mrp/manufacturing/workflows/scrap_manufacturing.html) — 取用製造單內報廢移到虛擬位置的做法。
17. [Account for scrapped goods - Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/inventory_valuation/scrapped_inventory_valuation.html) — 取用報廢記入庫存損失位置與損失科目的設定。
18. [Manufacturing backorders - Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/workflows/manufacturing_backorders.html) — 取用分批完工拆出後續單、現場介面按鍵風險。
19. [Product variants - Odoo 18.0 documentation](https://www.odoo.com/documentation/18.0/applications/sales/sales/products_prices/products/variants.html) — 取用變體建立模式、變體各有庫存紀錄、四乘五得二十的範例。
20. [Bespoke manufacturing, engineer to order, configure to order - MRPeasy](https://www.mrpeasy.com/?p=4081) — 取用基底品號複製、每單物料清單、通用品號手填用料三種做法。
21. [Different BOMs for same item (Engineer-To-Order ETO) - Frappe Forum](https://discuss.frappe.io/t/different-boms-for-same-item-engineer-to-order-eto/118033) — 取用類型級品號加每單物料清單、佔位品、自建與外購配置器成本。
22. [Production routing for items - Frappe Forum](https://discuss.frappe.io/t/production-routing-for-items/4673) — 取用路線與物料清單應分開的論點。
23. [BOM and routing - Monitor ERP help](https://help.monitorerp.com/MY-MONITOR_G5/en-us/Content/Topics/Manufacturing/Parts/BOMAndRouting/wBOMAndRouting.htm) — 取用物料清單與路線在同一程序維護、用於計算與負荷計畫。
24. [Understanding Configured Item Orders in Engineer to Order - Oracle JD Edwards](https://docs.oracle.com/en/applications/jd-edwards/supply-chain-manufacturing/9.2/eoabc/understanding-configured-item-orders-in-engineer-to-order.html) — 取用工程型客製庫存屬於專案、配置規則下單時評估。
25. [Understanding Material Requirements Planning - Oracle JD Edwards](https://docs.oracle.com/en/applications/jd-edwards/supply-chain-manufacturing/9.2/eoarp/understanding-material-requirements-planning.html) — 取用物料清單 98%、庫存 95% 的準確度要求與量法。
26. [Can MRP be successful without 98 percent inventory accuracy? - TechTarget（Dave Turbide，2015）](https://www.techtarget.com/enterprise-software/answer/Can-MRP-be-successful-without-98-percent-inventory-accuracy?amp=1) — 取用 98% 是老經驗法則、準確度低的代價。
27. [Engineer to Order (ETO) - ERP Research glossary](https://www.erpresearch.com/glossary/eto) — 取用工程型客製常需每單自訂物料清單與專屬製程。
28. [Job Card - PrintVis Documentation](https://learn.printvis.com/Legacy/Estimation/JobCard/) — 取用工作項目、品號連結、產品代碼可當範本。
29. [PrintVis Case - PrintVis Documentation](https://learn.printvis.com/Legacy/Estimation/Case/) — 取用案件、工作、版本、出貨的結構。
30. [Job Costing - PrintVis Documentation](https://learn.printvis.com/Legacy/JobCosting/JobCosting/) — 取用估價與實績比對、作業單位細度的限制。
31. [Why Top Printers Choose PrintVis and Business Central - Dynamics Communities](https://dynamicscommunities.com/industries/manufacturing/why-top-printers-choose-printvis-and-business-central/) — 取用 PrintVis 建在 Business Central 內、報價與工作與材料紀錄同處。
32. [MIS Integration and Fulfillment in MarketDirect StoreFront - DLA](https://dso.dla.mil/DSF/documentation/en/HTML/AdminHelp/MIS_Systems/MIS_Integration_and_Fulfillment_in_Digital_StoreFront.htm) — 取用管理資訊系統為正本、網店唯讀、庫存與訂單流向。
33. [Technology guide: MIS & W2P - Sprinter（Athina Mallis，2017）](https://www.sprinter.com.au/technology-guide-mis-w2p-2) — 取用內建、共用資料庫、介面串接成本等廠商說法。
34. [Tech Talk: Pros Give W2P, Online Storefront Advice - Printing Impressions（Julie Greenbaum，2017）](https://www.piworld.com/article/w2p-online-storefront-advice-pros/) — 取用網店與管理資訊系統分工、設定耗時。
35. [Web-to-Print Adoption Is Key Enabler - Printing Impressions（Patrick Henry，2018）](https://www.piworld.com/article/the-web-to-print-picture/) — 取用網店與管理資訊系統整合程度、多平台削弱報表。
36. [The product variant limit is now 2048 for all merchants - Shopify Changelog](https://shopify.dev/changelog/the-product-variant-limit-is-now-2048-for-all-merchants) — 取用變體上限從 100 升到 2,048（2025-10-15）。
37. [How sheet-fed offset presses work in GelatoConnect estimator - Gelato Support](https://connect-support.gelato.com/en/articles/15422549-how-sheet-fed-offset-presses-work-in-gelatoconnect-estimator) — 取用開機損耗為固定損失、與印量無關、加進紙張數量。
38. [Assigning Work Orders to Sales Orders or to Other Work Orders - Sage 100 Help](https://help-sage100.na.sage.com/2018/Subsystems/WO/ConceptTopics/Assigning_Work_Orders_to_Sales_Orders_or_to_Other_Work_Orders.htm) — 取用「為誰而做」欄位、完工時覆寫、成品仍先入庫。
39. [What Is a Traveler and Why is it Barcoded? - Cetec ERP](https://cetecerp.com/blog/What_Is_a_Traveler_and_Why_is_it_Barcoded.html) — 取用工單隨行單據、條碼、掃描記工時。
40. [WIP location in a 500,000 sft job shop - Epicor User Help](https://epiusers.help/t/wip-location-in-a-500-000-sft-job-shop/112476) — 取用三種在製品位置追蹤做法與取捨。
41. [Yield vs first pass yield - Fabrico](https://www.fabrico.io/blog/yield-vs-first-pass-yield/) — 取用最終良率與一次通過良率定義、隱藏工廠、範例數字。
42. [What Is OTIF (On-Time In-Full)? - SourceDay](https://sourceday.com/blog/otif/) — 取用 OTIF 公式、訂單層級與行層級、部分延遲算失敗。

## 查無公開資料

| 項目 | 狀況 |
|------|------|
| EFI Pace、Avanti Slingshot、Tharstern 以「產品」或「工作」為核心物件 | 搜尋只得廠商行銷頁與評比文，無架構說明。只開到 PrintVis 文件（來源 28、29、30） |
| 「臨時品號」作為通用術語與做法 | 未見統一名稱。只見基底品號複製、類型級品號加每單物料清單等做法 |
| 損耗率放設備（機台）層的設定做法 | 只見機台損耗率報表指標（來源 9），未見設定層來源 |
| 拼版（imposition）如何決定紙張用量 | Gelato 頁未說明（來源 37）。BioResources 論文開啟時憑證被拒 |
| 在原單加工序與另開重工單的量化比較（成本可視性、重工率報表） | 只見 SAP 文件與 IFS 論壇，無量化研究 |
| 跨訂單調撥的通用做法 | 只開到 Sage 100（來源 38）。SAP 的訂單庫存頁面（help.sap.com 新版）只回傳標題，未能核對 |
| 「數量帳就夠」與「要做庫存狀態」的門檻比較 | 未見來源直接比較 |
| 輕量在製品追蹤對庫存過帳的成本比較 | 未見量化比較 |
| 物料清單與庫存準確率的印刷業專屬基準 | 只見 JD Edwards 通用門檻（來源 25） |
| 網路印刷產品定義歸屬的通則 | 未見通則，只見廠商做法（來源 32、33） |
| ASCM 與 ASQ 的詞彙定義 | 兩站頁面無法取得內文，詞彙未核對 |
| 重工率的標準定義 | 未見獨立來源，只見良率口徑（來源 41） |

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

<!-- 起手提醒（填完刪除本註解）：
- 命名規約、各 mode 流程、Anti-Model-Collapse 四道防線：見 .claude/skills/vault-ingest/SKILL.md 與 raw/README.md
- 共用治理（流程／停下鐵則／紀律）：見 00-meta/卡片撰寫共用規範
-->
