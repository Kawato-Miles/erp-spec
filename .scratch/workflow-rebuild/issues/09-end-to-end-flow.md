# 09：端到端流程定案

Type: grilling
Status: open
Blocked by: 04, 05, 15, 24, 29, 30

## Question

從 Miles 給需求到交付 Linear，每一步用 matt 的哪個 skill？
Sens 在哪幾步插入自己的 skill？代理何時自行往下、何時停下問 Miles？
中斷後怎麼接續？Linear 交付怎麼做？
現況同步的兩個時點（規劃功能時、驗收之前）放在流程的哪一步？驗收之前的比對由 Miles 問了才查，還是定時查（票 05）？

## Comments

### 2026-11-12 票 39 交來的輸入

- 票 39 的 Answer 段有 Anthropic 產品團隊的做法、與 Sens 現行流程的差別、不能照搬的前提，以及主對話的建議：把 Prototype 提到流程前段。本票裁決流程順序時先讀它。
- 待裁決問題卡的處置（票 10）也用得到：來源中沒有待決清單，定不了的事用做原型解決。這與票 30 第三輪裁決段記的 matt 做法方向相同。

### 2026-11-13 Miles 對票 39 建議的回應（尚未裁決）

Miles 的前提：Prototype 直接交付給前端做串接，取代前端切版。

Miles 的質疑：看不出 Prototype 提前怎麼解決 wiki、規劃單、Prototype 不一致。

主對話的更正：Prototype 提前不解決不一致。它只改變 Miles 何時做判斷，並減少文件被重寫的次數。不一致的原因是同一個事實寫在多處、各自手改。要靠下列做法處理：

| 做法 | 處理哪一種不一致 | 狀態 |
|------|------------------|------|
| 一個事實只寫一處：規則、欄位、狀態在 wiki；畫面與介面操作規則在 Prototype；規劃單不寫規則、用完即丟 | 規劃單與另外兩者 | 票 05 已定案正本分工；規劃單縮成一頁是新提議 |
| wiki 情境卡對應測試，測試在 Prototype 上跑 | wiki 的規則與 Prototype 的行為 | 機制已存在；三分之一的測試追不回情境卡（票 14、27），測試太慢（票 07） |
| 程式比對 wiki 卡與 Prototype 的欄位、狀態、可選值 | wiki 的欄位表與 Prototype 的欄位 | 新提議，未試做；票 25 的比對對象是後端契約 |
| Linear 票文從 wiki 與 Prototype 產生，不手寫規則 | Linear 與另外兩者 | 票 24 |

Miles 的前提帶來的修正：

- Prototype 是前端的成品，不是用完即丟的草稿。來源裡「先做一次再丟掉」不適用。第一版也照 erp 的 Prototype skill 做；「最小」指範圍小，不指品質低。
- 介面操作規則（欄位防呆、按鈕何時出現、錯誤提示）的家是 Prototype。前端票不重述這些規則，只指向 Prototype 頁面。這對應 Miles 回報的痛點「開發最常問介面操作規則」。
- 後端看不到 Prototype 裡的規則。後端票仍要帶 wiki 的規則；wiki 與後端的一致靠現況同步（票 05）。

主對話向 Miles 提出、等他確認的目標清單：

1. Miles 只給需求，代理從釐清做到交付，中斷後自行接續。
2. Miles 不再人工比對 wiki、規劃單、Prototype、Linear。
3. 開發不再回頭問介面操作規則。
4. Miles 只判斷商業情境與看得到的操作，不判斷技術題與測試顆粒度。
5. 環境只留用得到的內容。

前四項的來源是地圖的 Destination 與 Miles 回報的痛點。Prototype 提前對應第 1、4 項，不對應第 2 項。

### 2026-11-13 Miles 的第二則回應（尚未裁決）

Miles 的前提：流程設計不以前後端看得到 wiki 為前提。

- 影響：票文要單看就夠，不能指向 wiki 卡。前端看得到 Prototype 與票；後端只看得到票。
- 票裡的規則因此是 wiki 的第二份。做法：票文由代理從 wiki 與 Prototype 產生，不手寫；wiki 改了之後，依票 05 的規則改原票或開新票。票文怎麼產生在票 24。

Miles 問怎麼看到 Prototype。現有的方式（已查 erp 的 `prototype-from-prompt`、`prototype-publish` 與本 repo 的 `.claude/launch.json`）：

- 第一輪：代理用 `launch.json` 的 `erp` 設定啟動本機頁面，開在對話旁邊的瀏覽器窗格。Miles 直接點。
- 定案後：代理照 `prototype-publish` 發布到測試機（網址在記憶卡 `reference_erp_manual.md`），前端與同事看同一份。

主對話對三個風險提出的解法：

| 風險 | 解法 | 落在哪張票 |
|------|------|-----------|
| 畫面看起來對，規則可能是錯的 | 假設清單分兩區。看得見的：Miles 點畫面確認。看不見的（金額算式、狀態轉換、權限）：每條附一個實際數字的例子，Miles 判斷例子對不對。確認過的例子寫成 wiki 情境卡與測試 | 本票的流程設計；票 07 |
| 程式比對 wiki 與 Prototype 還沒試做 | 用需求單模組試做一次。比不出來的部分，由代理逐欄比對並附對照表給 Miles 抽看 | 票 25、26 加入 Prototype 當比對對象 |
| 測試沒清、沒變快之前，目標 2 達不到 | 票 27（清情境目錄落差）與票 07（測試分層與提速）排在真實需求試跑（票 12）之前。每輪只跑改到的情境，全套只在交付前跑 | 票 07、27、12 的順序 |

給 Miles 的白話圖解：https://claude.ai/artifact/EKb2JfoXxbnYamZEgdvKKS （原始檔不在 repo；內容與本留言相同）。

### 2026-11-13 Miles 同意試行，並提出下列要求

Miles：「看起來可以試看看。」

- 做畫面仍用 erp 的 `prototype-from-prompt`，發布用 `prototype-publish`，兩者不動。
- Miles 要求加入把關畫面組合的 UX skill，用在 erp skill 之前（選版型）與之後（檢查畫面）。調研見票 42。
- 做畫面的步驟（主對話提出）：Miles 給需求 → 代理讀現況並只問不能讓步的事 → 代理選頁面版型 → 代理用 erp skill 做畫面 → 自動檢查（UX 檢查、改到的情境測試）→ Miles 在瀏覽器窗格點畫面並回答假設清單 → 不對就回到做畫面；對了就寫 wiki、發布測試機、產生票。
- 需求太大時：照 matt 的做法切成垂直切片，一片是一段 Miles 點得完的操作，一片一張票、一個對話。主題的地圖放 `.scratch/<主題>/`，換對話用 `handoff`。Miles 每一片各自確認。
- 與 matt 的差別：matt 的 `prototype` 是用完即丟、用來回答設計問題；Sens 的 Prototype 直接交前端。其餘步驟（釐清、規劃單、拆票、交接）照 matt。
- 用語定案（Miles 2026-11-13 同意）：Sens 的維持「Prototype」，指開發產物。matt `prototype` skill 的產物在 Sens 的文件裡叫「驗證草稿」。matt 的 skill 本身不改。Prototype 不改名為 Demo：erp 的資料夾、分支、skill 都叫 prototype 且不能動；前端也容易把 Demo 當成展示用樣品而重切畫面。定義寫在 `memory/shared/non-business-terms.md`。
- Miles 對回報方式的要求記在地圖 Notes 與票 43。
