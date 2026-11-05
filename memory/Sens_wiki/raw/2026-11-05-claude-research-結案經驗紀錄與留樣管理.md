---
type: raw
status: ingested
created-at: 2026-11-05
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - 結案經驗紀錄
  - 留樣管理
related-vault: []
ingested-at: 2026-11-05
ingested-to:
  - "[[訂單管理]]"
raw-source-link:
  - https://images.e.dnv.com/Web/DNVGL/%7B5a611925-15cd-4b5a-9020-7c3034a7cccf%7D_Business_Performance_white_paper_150818.pdf
  - https://www.dqsglobal.com/en/explore/blog/organizational-knowledge-in-iso-9001-what-does-the-standard-say
  - https://www.pref.kagawa.lg.jp/documents/7455/240201annex19.pdf
  - https://learn.printvis.com/Legacy/JobCosting/AutoJobCosting/
  - https://learn.printvis.com/Legacy/JobCosting/JobCosting/
  - https://learn.printvis.com/Legacy/Estimation/QtyVarOverDelv/
  - https://ukstandards.org.uk/en/nos-finder/GQAMP529/check-and-archive-finished-print-job-records
  - https://www.archives.nysed.gov/book/export/html/13350
  - https://avantisystems.com/wp-content/uploads/2025/06/Avanti-ePS-Slingshot-CoreModules-June-2025.pdf-1.pdf
---

# 印刷業與製造業的結案經驗紀錄與成品留樣管理

## 原始素材

### 問題 1：印刷 MIS 有沒有結案檢討或經驗紀錄欄位

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| PrintVis 的工作成本（job costing）用途之一是估價的後續改進，文件沒有提到自由文字的結案經驗欄位 | https://learn.printvis.com/Legacy/JobCosting/JobCosting/ | "Follow-up, and refinement, of the estimation process." | 摘要工具，未逐字核對 |
| PrintVis 的工作成本在生產結束狀態觸發過帳，與預估對照 | https://learn.printvis.com/Legacy/JobCosting/AutoJobCosting/ | "Production Ended or Auto Job Costing"（兩個狀態碼欄位可觸發自動過帳） | 摘要工具，未逐字核對 |
| Avanti Slingshot 工作完成時，印表伺服器回傳成本與庫存資料，用於帳單與追蹤 | https://avantisystems.com/wp-content/uploads/2025/06/Avanti-ePS-Slingshot-CoreModules-June-2025.pdf-1.pdf | "Upon completion of every job, the print server automatically sends job costing and stock information back to Avanti Slingshot." | 摘要工具，未逐字核對 |
| 英國職業標準：印刷生產工作完成後，通常歸檔生產紀錄，含完成品樣本 | https://ukstandards.org.uk/en/nos-finder/GQAMP529/check-and-archive-finished-print-job-records | "When a print production job is completed, it is usual to archive production records, including samples of the finished job"（頁面回 403，句子來自搜尋摘要） | 摘要工具，未逐字核對 |
| 紐約州檔案保存表：印刷服務的工作檔，在工作完成或出版品停止後保存 1 年（取較晚者），理由是可能重印 | https://www.archives.nysed.gov/book/export/html/13350 | 頁面憑證錯誤無法開啟；只有搜尋摘要「1 year after job is completed or the publication is discontinued, whichever is later」，原文句未取得 | 摘要工具，未逐字核對 |

誰寫、何時寫、掛哪一層：EFI Pace、Avanti Slingshot、PrintVis 的官方文件均未查到結案檢討欄位的說明（見無法確認處）。

### 問題 2：留樣狀態與處置流程、保存期限

來源為 PIC/S GMP 附錄 19（藥品參考樣品與留存樣品）。香川縣政府網站上的 PDF，內含英文原文與日文譯文對照。依任務書，只參考狀態與處置。

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 兩種樣品。參考樣品供日後分析；留存樣品是整個包裝完成的一個單位，供辨識用 | https://www.pref.kagawa.lg.jp/documents/7455/240201annex19.pdf | "Reference sample: a sample of a batch of starting material, packaging material or finished product which is stored for the purpose of being analyzed should the need arise during the shelf life of the batch concerned." "Retention sample: a sample of a fully packaged unit from a batch of finished product. It is stored for identification purposes." | 直接讀 PDF 頁面 |
| 成品樣品至少保存到效期後 1 年 | 同上 | "Reference and retention samples from each batch of finished product should be retained for at least one year after the expiry date." | 直接讀 PDF 頁面 |
| 原料樣品至少保存到放行後 2 年，可因原料安定期較短而縮短；包材保存到成品效期 | 同上 | "samples of starting materials ... should be retained for at least two years after the release of product. That period may be shortened if the period of stability of the material, as indicated in the relevant specification, is shorter. Packaging materials should be retained for the duration of the shelf life of the finished product concerned." | 直接讀 PDF 頁面 |
| 留存樣品代表出貨流通的批次；每個包裝作業至少取一個 | 同上 | "A retention sample should represent a batch of finished products as distributed" "at least one retention sample should be taken from each individual packaging operation" | 直接讀 PDF 頁面 |
| 樣品的追溯紀錄要保存，供主管機關審查 | 同上 | "Records of traceability of samples should be maintained and be available for review by competent authorities." | 直接讀 PDF 頁面 |
| 樣品用途是日後出現客訴等問題時回頭評估 | 同上 | "The reference and/or retention samples serve as a record of the batch of finished product" "can be assessed in the event of, for example, a dosage form quality complaint" | 直接讀 PDF 頁面 |
| 保存期內留存樣品放在許可製造商場所，主管機關可快速取用 | 同上 | "Retention samples should be stored at the premises of an authorised manufacturer in order to permit ready access by the Competent Authority." | 直接讀 PDF 頁面 |
| 保存條件須與核准文件一致 | 同上 | "Storage conditions should be in accordance with the marketing authorisation" | 直接讀 PDF 頁面 |

附錄 19 本文沒有「銷毀」條文，也沒有「不留樣」的轉換條件（只有第 2.1 節提到例外情形，如小批量或昂貴產品可不留重複樣品）。銷毀時點與流程，目前只有商業 SOP 範本的搜尋摘要，未取得原文（見無法確認處）。

印刷業的留樣（問題 2 的印刷面）：

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 英國職業標準把「完成品樣本」列為歸檔生產紀錄的一部分 | https://ukstandards.org.uk/en/nos-finder/GQAMP529/check-and-archive-finished-print-job-records | 同問題 1 | 摘要工具，未逐字核對 |

### 問題 3：留樣數量是否從出貨數或庫存帳扣除

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| PIC/S 附錄 19 規定樣品大小須足以做兩次完整分析，但沒有規定樣品數量是否從批量或庫存帳扣除 | https://www.pref.kagawa.lg.jp/documents/7455/240201annex19.pdf | "The reference sample should be of sufficient size to permit the carrying out, on, at least, two occasions, of the full analytical controls on the batch" | 直接讀 PDF 頁面 |
| PrintVis 的訂購量、生產量、出貨量可以不同；超交比例按客戶設定 | https://learn.printvis.com/Legacy/Estimation/QtyVarOverDelv/ | "allowed/agreed over and under deliveries"（頁面沒有提到樣品、留樣或留底本） | 摘要工具，未逐字核對 |

### 問題 4：ISO 9001:2015 第 7.1.6 條對結案經驗保存的要求

| 結論 | 網址 | 原文句 | 取得方式 |
|------|------|--------|---------|
| 第 7.1.6 條要求組織決定運作所需的知識、維持它、在需要的範圍內讓人取得 | https://images.e.dnv.com/Web/DNVGL/%7B5a611925-15cd-4b5a-9020-7c3034a7cccf%7D_Business_Performance_white_paper_150818.pdf（DNV GL 認證機構白皮書第 4 頁，標「From ISO 9001:2015 version」） | "The organisation shall determine the knowledge necessary for the operation of its processes and to achieve conformity of products and services. This knowledge shall be maintained, and made available to the extent necessary." | 直接讀 PDF 頁面 |
| 面對需求與趨勢變化時，要考慮現有知識並決定如何取得額外知識 | 同上 | "When addressing changing needs and trends, the organisation shall consider its current knowledge and determine how to acquire or access the necessary additional knowledge." | 直接讀 PDF 頁面 |
| 註 1 把「經驗教訓」列為組織知識的一種 | 同上 | "NOTE 1 Organisational knowledge can include information such as intellectual property and lessons learned." | 直接讀 PDF 頁面 |
| 註 2 把「從失敗與成功專案學習」與「擷取未成文的專家經驗」列為內部來源 | 同上 | "NOTE 2 To obtain the knowledge required, the organisation can consider: a) internal sources (e.g. learning from failures and successful projects, capturing undocumented knowledge and experience of topical experts within the organisation)." | 直接讀 PDF 頁面 |
| 註為資訊性，不是要求句；本條本文沒有要求建立文件化資訊。DQS 說明頁沒有主張要把知識文件化 | https://www.dqsglobal.com/en/explore/blog/organizational-knowledge-in-iso-9001-what-does-the-standard-say | "it may be enough to finally take the time to document everything thoroughly"（DQS 的實務建議句，不是標準條文） | 摘要工具，未逐字核對 |
| 認證機構的說明：重點是關鍵知識，不是全部知識 | DNV GL 白皮書第 2 頁 | "it is not about all of the knowledge available in the organisation but only about the critical knowledge." | 直接讀 PDF 頁面 |

## 無法確認處

| 項 | 說明 |
|----|------|
| 問題 1：EFI Pace、Avanti Slingshot、PrintVis 的結案檢討欄位 | 搜尋三家官方文件，未找到「結案檢討」「經驗教訓」「後驗（post-mortem）」欄位的說明。只找到工作成本與預估對照功能。不能說這些系統沒有，只能說公開文件查不到 |
| 問題 1：誰寫、何時寫、掛工作層或品項層 | 沒有官方來源支持；只有通用專案管理文章（Projul、InvestorCOM 等部落格），列為線索，不寫結論 |
| 問題 1：英國職業標準與紐約州保存表 | 英國頁面回 403，紐約頁面憑證錯誤，兩者只有搜尋摘要句，未逐字核對 |
| 問題 2：留樣「銷毀」條件與流程 | 附錄 19 無銷毀條文。商業 SOP 範本（gmpsop.com）回 403，只有搜尋摘要，不採用 |
| 問題 2：印刷業留樣的狀態與保存期限 | 沒找到印刷業官方或標準來源。PIC/S 附錄 19 是藥品規範，只能當狀態與處置的參考 |
| 問題 3：留樣是否從出貨數或庫存帳扣除 | 附錄 19 與三家 MIS 公開文件都沒有說明；PrintVis 文件查不到樣品相關欄位 |
| 問題 4：ISO 9001:2015 原文 | 標準原文付費，未取得。條文與註來自 DNV GL 白皮書引用，非 ISO 官方頁面 |
| 附錄 19 版本 | 香川縣 PDF 是 2015 年製作的日英對照版；搜尋曾出現「Annex 19 revision 2026」，未開啟，不確定現行版是否有改 |

## 查證紀錄（主對話抽查）

| 來源 | 抽查方式 | 結果 |
|------|---------|------|
| https://www.pref.kagawa.lg.jp/documents/7455/240201annex19.pdf | 主對話下載 PDF、以文字抽取工具比對 1 組關鍵句（成品樣品至少保存到效期後一年） | 相符 |

未抽查：DNV GL 白皮書、dqsglobal 部落格、PrintVis 文件、紐約州檔案保存表、英國職業標準。這些引文採用時標「未逐字核對」。

## 第一輪初步分析（Claude 寫）

（留空，主對話抽查後寫）

## 精練去處（Mode B 完成後填）

- [[訂單管理]]（11-review-knowledge 參考模型卡，Miles 2026-11-05 批准）
