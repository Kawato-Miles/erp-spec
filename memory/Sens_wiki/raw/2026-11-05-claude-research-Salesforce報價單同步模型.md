---
type: raw
status: ingested
created-at: 2026-11-05
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - Salesforce
  - 報價單同步
  - 商機
related-vault: []
ingested-at: 2026-11-05
ingested-to:
  - "[[售前]]"
raw-source-link:
  - https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm
  - https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch.htm
  - https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_considerations_for_creating.htm
  - https://help.salesforce.com/s/articleView?id=quotes_considerations_for_creating_pdfs.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=sales.quotes_sync_troubleshooting.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=ind.qocal_considerations_syncing_quotes_and_opportunities_in_revenue_cloud.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=ind.qocal_create_orders_from_a_quote.htm&language=en_US&type=5
  - https://help.salesforce.com/s/articleView?id=sales.order_create.htm&language=en_US&type=5
  - https://help.salesforce.com/HTViewSolution?id=000004966
  - https://help.salesforce.com/s/issue?id=a028c00000qPxnZAAS&language=en_US
  - https://help.salesforce.com/s/articleView?id=000381216&language=en_US&type=1
  - https://trailhead.salesforce.com/content/learn/projects/manage-products-prices-quotes-orders/create-multiple-quotes
---

# Salesforce Sales Cloud 商機與報價單同步模型

## 原始素材

說明：Salesforce Help 新版頁面多半載入失敗（只回傳載入畫面）。可讀的是舊版網址 `apex/HTViewHelpDoc`。所有原文句都經 WebFetch 摘要工具取得，未逐字核對。「取得方式」欄一律為摘要工具，未逐字核對，除非另註。

### 問題 1　開始同步時，商機產品被整批取代還是合併

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 換掉已同步的報價單時，商機既有的產品列被新同步報價單的資料取代。首次開始同步時如何處理商機既有產品，官方頁面沒寫。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | "If you replace the synced quote with another synced quote, the existing opportunity line items are replaced by the newly synced quote records." | 摘要工具，未逐字核對 |
| 開始同步的操作：開啟報價單，按 Start Sync。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch.htm | "Open the quote that you want to sync, and then click Start Sync." | 摘要工具，未逐字核對 |
| 商機同一時間只能與一張報價單同步；改同步另一張時，前一張停止同步。 | 同上 | "The previously synced quote stops syncing, and the new quote starts." / "An opportunity can have multiple quotes, but it can sync with only one quote at a time." | 摘要工具，未逐字核對 |

### 問題 2　雙向同步欄位；商機產品增刪如何回寫

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 產品清單雙向同步：任一側新增或刪除，另一側跟著增刪。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | "any addition or change to the list of products in one record syncs with the list of products in the other one." / "Adding or removing a line item from a quote updates the synced opportunity's Products related list." / "Adding or removing a product from the opportunity updates the synced quote's Quote Line Items related list." / "Product sorting also syncs between the two records." | 摘要工具，未逐字核對 |
| 欄位對應：報價單項目（QuoteLineItem）與商機產品（OpportunityLineItem）對應 Quantity、UnitPrice、ServiceDate、Discount；報價單表頭對應 Pricebook2、Amount 對 TotalPrice。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch.htm | "When you sync a QuoteLineItem to an OpportunityLineItem, the system matches these fields." 欄位表經摘要工具攤平：Quantity/Quantity、UnitPrice/UnitPrice、ServiceDate/ServiceDate、Discount/Discount。 | 摘要工具，未逐字核對；表格配對由摘要工具重組 |
| 報價單新增項目會複製到商機成為產品；刪報價單項目會刪對應商機產品。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_considerations_for_creating.htm | "the new line item is copied to the opportunity as a product in the Products related list." / "deleting the quote line item deletes the corresponding product" | 摘要工具，未逐字核對 |
| 新版 Revenue Cloud 版注意事項只說同步方向是報價單項目到商機產品，且同步中不能更新商機產品。此與舊版「雙向」說法不同（見無法確認處）。 | https://help.salesforce.com/s/articleView?id=ind.qocal_considerations_syncing_quotes_and_opportunities_in_revenue_cloud.htm&language=en_US&type=5 | 摘要工具轉述："Syncing occurs only from quote line item to opportunity product. Also, you can't update the opportunity products while the sync is in process." 此為搜尋摘要轉述，非頁面原文。 | 搜尋結果摘要，未逐字核對；全文頁面未能載入 |

### 問題 3　停止同步或刪除報價單後，商機產品保留還是清除

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 停止同步：兩邊連結斷開，不再互相更新。官方頁面未寫商機產品是否保留。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | "If you stop the sync between a quote and an opportunity, the link is broken" / "the records are no longer automatically updated with each other's changes." | 摘要工具，未逐字核對 |
| 停止同步操作：開啟已同步報價單，按 Stop Sync。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch.htm | "To stop syncing between a quote and an opportunity, open the synced quote, and then click Stop Sync." / "Updates are no longer synced between the records." | 摘要工具，未逐字核對 |
| 商機的 Amount 欄位即使停止同步也不能手改。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | "You can't edit the opportunity's Amount field, even if you stop syncing." | 摘要工具，未逐字核對 |
| 刪除報價單：頁面只說同步持續到停止或刪除其中一筆，未寫刪除後商機產品如何處理。 | 同上 | "The quote and opportunity continue to sync each way until you stop syncing or delete one of the records." | 摘要工具，未逐字核對 |

### 問題 4　報價單 PDF 的前提、份數、刪除報價單時的 PDF

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| PDF 能否建立的狀態條件，官方「注意事項」頁沒寫。頁面只說管理員決定哪些狀態可寄 PDF，例如可擋住「審核中」的報價單不得寄出。價格齊全的條件查無。 | https://help.salesforce.com/s/articleView?id=quotes_considerations_for_creating_pdfs.htm&language=en_US&type=5 | "Your Salesforce admin determines which status is the default for new quotes" / "which statuses allow you to email a quote PDF." / "For example, your admin can prevent you from emailing a quote whose status is In Review." | 摘要工具，未逐字核對 |
| 建立 PDF 的操作：在報價單表頭動作選單按 Create PDF，再按 Save to Quote 存入報價單。 | https://trailhead.salesforce.com/content/learn/projects/manage-products-prices-quotes-orders/create-multiple-quotes | "In the Quote header, open the actions menu and click Create PDF." / "Click Save to Quote." | 摘要工具，未逐字核對 |
| PDF 存在報價單的「Quote PDFs」相關清單，名稱含版本號（例 AcmeQuote_V1），表示一張報價單可存多份。此句為搜尋摘要轉述。 | https://help.salesforce.com/s/articleView?language=en_US&id=sales.quotes_create_pdf.htm&type=5 | 搜尋摘要轉述："you generate a preview, then save it to the Quote PDFs related list. The PDF name is the quote name plus a version number, such as AcmeQuote_V1." 非頁面原文。 | 搜尋結果摘要，未逐字核對；頁面全文未能載入 |
| 報價單項目排序變更，會同步更新 PDF 與已同步商機。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_considerations_for_creating.htm | "the sort order updates in PDF quotes and in synced opportunities." | 摘要工具，未逐字核對 |
| 刪除報價單時 PDF 的處理：查無。 | — | — | — |

### 問題 5　成交（Closed Won）是否要求同步報價單；建訂單的資料來源

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 標準 Sales Cloud 官方頁面查無「Closed Won 須有同步報價單」的要求。 | — | — | — |
| 一鍵建訂單（Revenue Management 版）從已接受的報價單建立，同步產品、數量、價格、稅額。資料來源是報價單，不是商機產品。 | https://help.salesforce.com/s/articleView?id=ind.qocal_create_orders_from_a_quote.htm&language=en_US&type=5 | 搜尋摘要轉述："Convert an accepted quote into an order with one click to synchronize product, quantity, pricing, and tax data." 非頁面原文；頁面本文未能載入。 | 搜尋結果摘要，未逐字核對 |
| 該功能屬 Revenue Management（需 Transaction Management），不是標準 Sales Cloud 報價單功能；標準報價單到訂單的按鈕查無。 | 同上 | 搜尋摘要轉述：available in Enterprise, Unlimited, and Developer Editions of Revenue Management where Transaction Management is enabled。 | 搜尋結果摘要，未逐字核對 |
| 標準訂單建立頁面未提從商機或報價單帶入產品；只列從訂單頁籤、帳戶、合約建立。 | https://help.salesforce.com/s/articleView?id=sales.order_create.htm&language=en_US&type=5 | 摘要工具："The page doesn't say how orders are created from opportunities or quotes, and it doesn't say which products are copied from them." 此為摘要工具對頁面的評述，非原文。 | 摘要工具，未逐字核對 |

### 問題 6　報價單折扣、運費、稅額與商機金額

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 商機 Amount 對應報價單 TotalPrice，TotalPrice 註記為各項目小計之和。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch.htm | "The Amount field on the Opportunity syncs with the TotalPrice field on the Quote," 後接說明 "calculated as the subtotal of all line items"（後者為摘要工具轉述，非逐字）。 | 摘要工具，未逐字核對 |
| 項目層折扣（Discount）有同步；同步頁面未提報價單層的運費（Shipping Handling）與稅額。 | 同上 | 摘要工具："Shipping and Tax: The article doesn't mention either." 此為摘要工具評述。 | 摘要工具，未逐字核對 |
| 報價單項目有預設排程或商機產品有排程時，Discount 不可編輯。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_considerations_for_creating.htm | "you can’t edit the Discount field of the line item" | 摘要工具，未逐字核對 |
| 報價單層折扣、運費、稅額是否計入商機 Amount：查無明文。Quote 物件欄位說明頁（developer.salesforce.com）回傳 403，未能讀取。 | https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_quote.htm | — | 403 |

### 問題 7　標準 Sales Cloud 有沒有主要報價單

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 標準報價單的對應概念是「同步中的報價單」：商機有 Synced Quote 欄位，報價單相關清單有 Syncing 勾選。標準物件頁面查無名為 Primary 的欄位。 | https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | "The Synced Quote field on the Opportunity detail page" / "The Syncing checkbox in the Quotes related list" | 摘要工具，未逐字核對 |
| Salesforce CPQ（管理套件）才有 Primary 勾選。官方疑難排解文章把 Primary 勾選為 True 列為檢查項，並以更新 Primary 勾選觸發同步。 | https://help.salesforce.com/s/articleView?id=000381216&language=en_US&type=1 | "Primary checkbox is True." / "Update the Primary checkbox on the Quote." | 摘要工具，未逐字核對 |
| CPQ 一商機只能有一張 Primary；把第二張設為 Primary 會自動取消第一張。此句來自搜尋摘要對 Trailhead 的轉述，未取得該頁。 | https://trailhead.salesforce.com/content/learn/modules/salesforce-cpq-order-generation/generate-your-first-order | 搜尋摘要轉述："Only one quote related to an opportunity can be flagged as Primary. Making a second quote Primary automatically unchecks the Primary checkbox of the first." | 搜尋結果摘要，未逐字核對；頁面未取得 |

### 問題 8　複製商機時報價單與項目帶不帶

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 複製商機的選項只列聯絡人角色、產品、產品排程；報價單不在清單內。Classic 的 Clone 按鈕可選含或不含產品。 | https://help.salesforce.com/HTViewSolution?id=000004966 | 摘要工具：商機可複製 "contact roles, products, or product (line item) schedules."；Classic 可 "with or without products." | 摘要工具，未逐字核對 |
| 已知問題：Lightning 複製帶有同步報價單的商機時，新商機會誤留原報價單。 | https://help.salesforce.com/s/issue?id=a028c00000qPxnZAAS&language=en_US | 本頁全文未能載入；僅見搜尋摘要轉述："if an Opportunity record with a synced Quote is Cloned using Lightning Experience, the resulting Opportunity will incorrectly retain that original quote during the cloning process." | 搜尋結果摘要，未逐字核對；頁面未取得 |

## 無法確認處

1. 首次按 Start Sync 時，商機原有的手建產品是被取代、合併或保留：官方頁面只寫「換報價單時被取代」，首次情形未寫。
2. 同步方向：舊版頁面寫雙向，新版 Revenue Cloud 版搜尋摘要寫單向且同步中不能改商機產品。新舊頁面是否矛盾，或只是產品線不同（標準報價單與 Revenue Management），未能確認。新版全文頁面載入失敗。
3. 停止同步與刪除報價單後，商機產品保留或清除：官方頁面未寫。CPQ 社群貼文稱同步會刪除沒有對應報價單項目的商機產品，屬線索，且指的是同步運作時，不是停止後。
4. PDF 建立前提（報價單狀態、價格齊全）：官方頁面只提「管理員決定哪些狀態可寄 PDF」，建立 PDF 本身的狀態限制未查到。「價格齊全」查無。
5. 每張報價單可存幾份 PDF、刪報價單時 PDF 的處理：「Considerations for Deleting Quotes」「Quote Template and PDF Limitations」兩頁未取得。多份 PDF 的說法只來自搜尋摘要。
6. Closed Won 是否要求有同步報價單：查無任何來源。
7. 標準 Sales Cloud 報價單建訂單的資料來源：只找到 Revenue Management 的一鍵建訂單，且頁面全文未載入，僅有搜尋摘要。標準版是否有此功能未確認。
8. 報價單層折扣、運費、稅額與商機 Amount 的關係：同步頁面只提 Amount 對 TotalPrice。Quote 物件欄位說明（403）未能讀取，TotalPrice 是否含運費與稅額未確認。
9. Primary Quote 的 Trailhead 句子與 Quote 複製行為：只有搜尋摘要轉述，未取得頁面。CPQ 官方 Primary 欄位說明頁未取得。
10. 複製商機是否帶報價單：商機複製頁未明列報價單，「不帶」是依清單未列推論，無明文。
11. 本次所有原文句皆經摘要工具或搜尋摘要取得，無一為直接讀頁面全文逐字。

## 查證紀錄（主對話抽查）

| 來源 | 抽查方式 | 結果 |
|------|---------|------|
| https://help.salesforce.com/apex/HTViewHelpDoc?id=quotes_synch_overview.htm | 主對話以網頁讀取逐句比對 4 組關鍵句：一次只同步一張、換同步報價單時商機產品被取代、停止同步斷開、同步持續到停止或刪除任一方 | 全部相符；問題 1 該句可改標直接讀頁面 |

未抽查：quotes_synch.htm、quotes_considerations_for_creating.htm、quotes_considerations_for_creating_pdfs.htm、ind.qocal_create_orders_from_a_quote.htm、000381216、000004966。這些引文採用時標「未逐字核對」。

## 第一輪初步分析（Claude 寫）

## 精練去處（Mode B 完成後填）

- [[售前]]（11-review-knowledge 參考模型卡，Miles 2026-11-05 批准）
