---
type: raw
status: ingested
created-at: 2026-07-27
source: claude-research
captured-by: claude-on-task
module:
  - 跨模組
topic-tag:
  - 豐田式生產管理
  - 精實生產
  - 拉式生產
  - 目視化管理
  - 限制理論邊界
related-vault:
  - "[[2026-06-13-生產模組架構設計]]"
  - "[[轉交單狀態]]"
  - "[[品檢紀錄]]"
  - "[[齊套邏輯]]"
raw-source-link: https://global.toyota/en/company/vision-and-philosophy/production-system/ ＋ https://www.lean.org/lexicon-terms/（18 條個別條目 URL 見內文來源清單）
ingested-at: 2026-07-27
ingested-to:
  - "[[豐田式生產管理對映]]"
---

# 豐田式生產管理（TPS）核心概念調研

> 調研目的：Miles 2026-07-27 拍板以 TPS 作為生產階段 MES 設計的機制層準則（plan mes-erp-lucky-beacon），Vault 內原無 TPS 素材，本卡補知識基礎。調研執行：opus agent，所有 URL 經實際抓取或 HTTP 狀態驗證。

## 原始素材

### 1. 兩大支柱：及時生產與自働化

#### 1a. 及時生產（Just-in-Time, JIT）

定義：豐田官方定義為「只做需要的東西、在需要的時候做、做需要的數量」，透過同步化各廠與各製程形成連續流。JIT 的運作靠三個要素支撐：後拉式（pull）、節拍時間（takt time）、連續流（continuous flow），並以平準化（heijunka）為基礎。運作機制是後製程到前製程的「店面」領取所需品項，前製程只補回被領走的量，形成逐站往上游傳遞的補充迴路。

現場作用：把生產觸發權從「預測與排產推料」改成「下游實際消耗」，直接壓縮在製品庫存與前置時間，並讓「只生產賣得掉的東西」成為系統性約束而非人為紀律。

來源：https://global.toyota/en/company/vision-and-philosophy/production-system/ ／ https://www.lean.org/lexicon-terms/just-in-time-production/

#### 1b. 自働化（Jidoka，人字旁的自動化）

定義：豐田官方譯為「帶人性的自動化」（automation with a human touch），指設備或作業者具備偵測異常並立即停止的能力，異常包含設備故障、品質不良與作業延遲。Lean Enterprise Institute 的定義補上兩項功能：把品質內建於製程（build quality into process），以及分離人與機器的工作，讓一人可看顧多台機器（多製程操作）。關鍵不是「自動化」，而是「異常時自動停」。

現場作用：不良品不流到下工站，且因為停線會讓問題浮上檯面，反而強迫追根本原因而非靠事後檢驗攔截。同時免除「有人站著看機器」的無附加價值工時。

來源：https://global.toyota/en/company/vision-and-philosophy/production-system/ ／ https://www.lean.org/lexicon-terms/jidoka/

### 2. 看板（Kanban，補充信號機制）

定義：看板是「在後拉式系統中，授權並指示生產或搬運某項物料的信號裝置」，日文原意為「看板、招牌」。主要三型：生產看板（指示上游做什麼、做多少）、領取看板（授權搬運，再分廠內看板與供應商看板）、信號看板（累積到最小容器數才觸發批量生產，用於換模時間長的製程）。

與介面看板 UI 的區分（重要）：TPS 的看板是「補充授權信號」，本質是一張授權卡在製程間循環，卡回來才准生產。與敏捷或專案管理常見的「看板牆 / Kanban board」介面（欄位式工作項目視覺化）不是同一件事，後者是目視化管理的一種呈現，不具備「無信號不得生產」的授權語意。ERP/MES 設計若把兩者混為一談，會做出一個只會顯示狀態、卻不會限制投料的假看板。

現場作用：讓上下游不需人為排程協調即可傳遞需求資訊，並在機制層面防止過量生產。

來源：https://www.lean.org/lexicon-terms/kanban/

### 3. 平準化（Heijunka，生產節奏與品種平均化）

定義：平準化是「在固定期間內把生產的品種與數量拉平」，日文原意近似「平準化 / levelization」，由豐田提出。它有兩個維度：數量平準（例如一週需求 500 件但每日分布不均，改以成品緩衝吸收波動、每日固定產 100 件）與品種平準（不做 A A A A A B B B C C D D 的批量式排列，改做 A A B C D A A B C D 的重複序列）。實務工具是平準化箱（heijunka box），以固定時距把看板分配下去。

現場作用：把下游需求的忽高忽低擋在成品端，讓上游製程與供應商面對穩定負荷，避免產能與人力依尖峰配置；代價是必須先把換模時間降下來，否則品種平準跑不動。

來源：https://www.lean.org/lexicon-terms/heijunka/ ／ https://www.lean.org/lexicon-terms/heijunka-box/

### 4. 目視化管理（Visual Management）與安燈（Andon）

定義：目視化管理是「把所有工具、零件、生產活動與績效指標放在一眼可見之處，使系統狀態能被所有相關人員一望即知」。安燈（andon，日文原意為「燈」）是目視化管理的具體工具，以看板燈號顯示各工站或機台狀態，異常時由感測器自動點亮，或由作業者拉繩、按鈕觸發，立即召喚班長支援。豐田採用「定位置停止」（fixed-position stop）機制：拉繩不是當下急停，而是讓線體行進到預定位置才停，避免單點異常擾亂全線。

現場作用：把「有沒有異常」從需要問人、查系統，變成抬頭就看到，並把異常升級（escalation）的觸發權下放到現場第一線；這是自働化在人工作業段的落實手段。

來源：https://www.lean.org/lexicon-terms/visual-management/ ／ https://www.lean.org/lexicon-terms/andon/ ／ https://global.toyota/en/company/vision-and-philosophy/production-system/

### 5. 七大浪費（Muda）

定義：大野耐一（Taiichi Ohno）歸納量產現場的七種浪費，Lean Enterprise Institute 逐項定義如下：

| 浪費 | 定義 |
|------|------|
| 過量生產（Overproduction） | 生產超前於下一製程或客戶實際所需；被稱為最嚴重的浪費，因為它會誘發其他六項 |
| 等待（Waiting） | 作業者閒置，例如等機器跑完、等設備修好、等料未到 |
| 搬運（Conveyance） | 不必要的物料與產品移動，例如加工後先送倉再送下一站，而該兩站其實可以相鄰配置 |
| 加工過度（Processing） | 執行不必要或錯誤的加工，通常源自工具或產品設計不良 |
| 庫存（Inventory） | 超出精確控制的後拉式系統所需之最低存量 |
| 動作（Motion） | 作業者做出勉強或多餘的動作，例如找零件、找工具、找文件 |
| 不良與修正（Correction / Defects） | 檢驗、重工、報廢 |

延伸的「三 M」框架另有兩項：mura（不均，作業節奏或排程忽快忽慢，導致人員一下趕工一下閒置，通常靠平準化與流程管理處理）與 muri（超載，要求人或設備以超出設計與合理管理範圍的強度長時間運轉）。豐田官方頁面亦以 muda / mura / muri 三者並列描述改善對象。

現場作用：作為現場診斷的共同分類語彙，讓「這裡效率不好」可以被拆成可指認、可量測的具體項目；其中過量生產被列為優先攻擊目標。

來源：https://www.lean.org/lexicon-terms/seven-wastes/ ／ https://www.lean.org/lexicon-terms/muda-mura-muri/

### 6. 標準作業、改善（Kaizen）與防錯（Poka-yoke）

定義：標準作業（standardized work）是「每位作業者在製程中的精確作業程序」，由三要素構成：節拍時間、作業順序（在節拍時間內執行任務的精確次序）、標準在製存量（含機台內在製品，維持製程順暢所需的最低存量）。改善（kaizen，「持續改善」）以標準作業為基準線運作，大野耐一的說法是「沒有標準就沒有改善」；改善達成後必須回頭更新標準，成果才不會流失。防錯（poka-yoke，又稱 mistake-proofing / error-proofing）則是「協助作業者避免選錯件、漏裝、裝反等失誤的方法」，典型手段包含把零件外形設計成只有正確方向裝得進去，或以光電感測確認作業者確實取過該料才允許流到下一站。

現場作用：標準作業把「品質與工時穩定」從個人熟練度轉為可管理的製程條件，也是新人訓練與跨班一致性的依據；防錯則把品質保證從「事後檢出」前移到「事前不可能做錯」，這是與檢驗（inspection）本質上的分工差異。

來源：https://www.lean.org/lexicon-terms/standardized-work/ ／ https://www.lean.org/lexicon-terms/kaizen/ ／ https://www.lean.org/lexicon-terms/error-proofing/

### 7. 節拍時間（Takt time）與快速換模（SMED）

定義：節拍時間為「可用生產時間除以客戶需求量」，被稱為精實生產系統的心跳；例如每日可用 480 分鐘、需求 240 件，節拍時間即 2 分鐘一件。它是需求端決定的應有速度，與製程實際完成一件所需的週期時間（cycle time）是不同概念。換模（changeover）指機台從一個品號切換到另一個品號的過程，換模時間計算自「前一批最後一件良品」到「後一批第一件良品」之間。快速換模（SMED, single-minute exchange of dies）由新鄉重夫（Shigeo Shingo）於 1950 至 1960 年代提出並命名，目標是把換模壓到個位數分鐘（十分鐘以內）；核心方法是區分內部換模作業（必須停機才能做，例如裝新模）與外部換模作業（機台運轉中就能做，例如把新模具搬到機邊），再把內部作業盡量轉為外部作業。新鄉的團隊曾把車體成型設備的換模時間從數天縮短到約十分鐘。

現場作用：節拍時間讓產線配置、人力配置與標準作業有一個共同的速度基準，不以「機台跑最快」為目標而以「跟上需求」為目標。SMED 則是小批量與品種平準化的前提條件，換模成本降下來，經濟批量才會縮小，庫存與前置時間才跟著降。

來源：https://www.lean.org/lexicon-terms/takt-time/ ／ https://www.lean.org/lexicon-terms/single-minute-exchange-of-die/ ／ https://www.lean.org/lexicon-terms/changeover/ ／ https://www.lean.org/lexicon-terms/setup-reduction/

### 8. 額外釐清：TPS 與限制理論（TOC）的差異與邊界

TOC 是什麼：限制理論（Theory of Constraints, TOC）源自高德拉特（Eliyahu M. Goldratt），核心是五步聚焦法：找出系統限制、榨盡限制（不投入大額改造前先把限制的產出用滿）、其餘一切遷就限制、提升限制、回到第一步且不讓惰性成為新限制。其排程手法為鼓、緩衝、繩（Drum-Buffer-Rope, DBR）：瓶頸即「鼓」，其節奏決定全系統產出；「緩衝」是護住瓶頸不斷料的庫存；「繩」把投料速度綁在瓶頸節奏上。TOC 的績效語言是三個財務量：有效產出（throughput）、庫存（inventory）、營運費用（operating expense）。

與 TPS 的差別（不可混談）：
- 目標不同：TOC 以最大化有效產出來提高獲利；精實以消除浪費與提升顧客價值來提高獲利。
- 焦點不同：TOC 聚焦於系統限制（瓶頸）這個局部；精實聚焦於整條價值流的非加值活動。
- 手段不同：TOC 是分析式的限制管理，靠瓶頸前的緩衝庫存防止斷料；精實是後拉式與連續流，沒有信號就不准生產。這是兩者最容易被混淆卻最實質的分歧點，TOC 刻意在瓶頸前「養庫存」，精實則把庫存本身列為七大浪費之一。
- 邊界結論：LEI 的立場是兩者互補而非互斥，TOC 可用來決定精實導入的優先順序；但把 DBR 的瓶頸排程說成「這就是豐田式」是錯的，DBR 不屬於 TPS 系譜。ERP/MES 設計上務必分開：若採 TOC，系統要能識別瓶頸資源並以瓶頸節奏控投料；若採 TPS，系統要能傳遞補充信號並限制未授權生產。兩者的資料模型與管制邏輯不同。

來源：https://www.lean.org/the-lean-post/articles/what-is-the-theory-of-constraints-and-how-does-it-compare-to-lean-thinking/

### 來源清單

豐田官方（一手）
1. Toyota Motor Corporation, Toyota Production System（兩大支柱、jidoka、Just-in-Time、andon、muda/mura/muri、TPS 起源）https://global.toyota/en/company/vision-and-philosophy/production-system/ （此頁對自動抓取工具回 403，改以瀏覽器標頭請求驗證回 200 並取得全文）

Lean Enterprise Institute Lexicon（權威二手，皆已實際抓取驗證）
2. Just-in-Time Production https://www.lean.org/lexicon-terms/just-in-time-production/
3. Jidoka https://www.lean.org/lexicon-terms/jidoka/
4. Kanban https://www.lean.org/lexicon-terms/kanban/
5. Heijunka https://www.lean.org/lexicon-terms/heijunka/
6. Heijunka Box https://www.lean.org/lexicon-terms/heijunka-box/
7. Visual Management https://www.lean.org/lexicon-terms/visual-management/
8. Andon https://www.lean.org/lexicon-terms/andon/
9. Seven Wastes https://www.lean.org/lexicon-terms/seven-wastes/
10. Muda, Mura, Muri https://www.lean.org/lexicon-terms/muda-mura-muri/
11. Standardized Work https://www.lean.org/lexicon-terms/standardized-work/
12. Kaizen https://www.lean.org/lexicon-terms/kaizen/
13. Error-Proofing（poka-yoke）https://www.lean.org/lexicon-terms/error-proofing/
14. Takt Time https://www.lean.org/lexicon-terms/takt-time/
15. Single Minute Exchange of Die（SMED）https://www.lean.org/lexicon-terms/single-minute-exchange-of-die/
16. Changeover https://www.lean.org/lexicon-terms/changeover/
17. Setup Reduction https://www.lean.org/lexicon-terms/setup-reduction/
18. What is the Theory of Constraints, and How Does it Compare to Lean Thinking?（TOC 對照）https://www.lean.org/the-lean-post/articles/what-is-the-theory-of-constraints-and-how-does-it-compare-to-lean-thinking/

經典出版品（出版社頁面，已驗證回 200）
19. Taiichi Ohno,《Toyota Production System: Beyond Large-Scale Production》, Productivity Press / Routledge, 1988（日文原版 1978）https://www.routledge.com/Toyota-Production-System-Beyond-Large-Scale-Production/Ohno/p/book/9780915299140
20. Womack, Jones & Roos,《The Machine That Changed the World》（MIT 國際汽車計畫 IMVP 五年研究，1990，精實生產一詞的傳播源頭）https://www.lean.org/store/book/the-machine-that-changed-the-world/

### 給 ERP/MES 引用時的三個提醒（調研 agent 結語）

1. 看板不是介面看板：TPS 的看板是授權信號，具「無卡不得生產」的強制語意；ERP 若只做狀態顯示牆，不構成看板。
2. 自働化的重點是停，不是自動：MES 若只做設備連線與數據採集，沒有「異常即停 + 升級呼叫」的動作路徑，就不是自働化。
3. TOC 與 TPS 的庫存立場相反：瓶頸前緩衝（TOC）與庫存即浪費（TPS）不可在同一套投料邏輯裡混用，需先選定管制哲學再設計資料模型。

## 第一輪初步分析（Claude 寫）

- 觀察：感官既有拍板中有多處與 TPS 概念天然同構——滾動轉交的「到料放行」（下游依已送達量開工）即後拉式；品檢紀錄「不通過不入庫不可出貨」即自働化的品質內建；「待驗清單＝品檢站在站量」「待搬清單」即目視化。Vault 原先零 TPS 素材，且「看板」一詞在 Vault 幾乎全指介面甘特看板，與 TPS 看板語意不同（本卡 § 2 明確區分）。
- 候選相關卡：[[2026-06-13-生產模組架構設計]] / [[轉交單狀態]] / [[品檢紀錄]] / [[齊套邏輯]] / [[設備]]
- 候選 OQ 候補：無（Miles 已拍板 TPS 為機制層準則）
- 候選升級路徑：business-logic（已依核准 plan mes-erp-lucky-beacon 精練為 [[豐田式生產管理對映]]，見下）

## 待精練（Mode B 處理）

- [x] 是否更新既有 vault 卡（已建對映卡，既有卡不動）
- [x] 是否升級為 OQ（否）
- [ ] 是否累積成 insight（單張，不適用）

## 精練去處（Mode B 完成後填）

- [[豐田式生產管理對映]] — 新建 04-business-logic/領域知識 對映卡（Miles 2026-07-27 於 plan mes-erp-lucky-beacon 核准）
