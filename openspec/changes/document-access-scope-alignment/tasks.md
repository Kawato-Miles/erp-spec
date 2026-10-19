## 測試影響清單

依 Sens `erp-prototype-tests/docs/scenario-catalog.md` 節號列出。路徑寫法：`T/` 代表 `Sens/erp-prototype-tests/`，`P/` 代表 `erp/apps/erp/src/app/(prototype)/`。

### 一、mock 修改（順序固定：先 MOCK-DATA-CHAIN，再 mock-data.js，再測試）

| 順序 | 檔案 | 改什麼 | 服務的節號 |
|------|------|------|----------|
| 1 | `P/MOCK-DATA-CHAIN.md` | 人員名冊統一一份；林雅婷、黃聖雯的角色改回業務主管、訂單管理人 | 1.13 至 1.15、2.10、14.15 |
| 2 | `P/MOCK-DATA-CHAIN.md` | 需求單、訂單、工單各補一筆檢視層級與一筆編輯層級的分享成員；成員限依活動列可分享的角色：需求單與訂單的編輯層級用非接單業務的諮詢，工單的編輯層級用生管與業務 | 1.26 起、2.10、2.20 起、14.15、14.41 起 |
| 3 | `P/MOCK-DATA-CHAIN.md` | 訂單分享成員張惠雯的層級寫明檢視；另加一位編輯層級成員 | 2.10 |
| 4 | `P/MOCK-DATA-CHAIN.md` | 移除「業務被記為審核業務主管」的組合，或改為業務主管 | 2.21 起（新增） |
| 5 | `P/MOCK-DATA-CHAIN.md` | 一張出貨單由業務甲建立、所屬訂單後來改派給業務乙 | 12.22 起（新增） |
| 6 | `P/MOCK-DATA-CHAIN.md` | 一張售後服務單由編輯層級被分享的業務乙代開 | 12.x 售後（新增） |
| 7 | `P/MOCK-DATA-CHAIN.md` | 一筆報工紀錄的報工人員為劉阿海、任務所屬工作包後來改派陳金水（若已存在則註明） | 14.35 |
| 8 | `P/quote-prototype/mock-data.js` | 分享候選改為依活動列可分享的角色（業務、諮詢、業務主管、印務主管、Supervisor）；角色標示對齊 sessionStore | 1.13 至 1.15 |
| 9 | `P/orders/mock-data.js` | 分享候選改為依活動列可分享的角色（原 :265 只有業務、諮詢；改為業務、諮詢與六個全公司協助角色，不含會計、生管）；張惠雯層級（原 :525）寫成檢視 | 2.10 |
| 10 | `P/work-orders/_lib/mock-data.js` | 分享候選改為依活動列可分享的角色（原 :75 只有兩位印務；改為印務、印務主管、生管、訂單管理人、Supervisor、業務、諮詢） | 14.15 |
| 11 | `P/_lib/sessionStore.js` | Supervisor 標籤由「主管」改為「Supervisor」；Supervisor 不再以所屬產線全選模擬全公司 | 9.12 |

### 二、既有測試衝突逐筆處置（29 筆）

| # | 測試位置 | 節號 | 處置 | 批次 |
|---|---------|------|------|------|
| C01 | `T/tests/unit/quote/quote-rules.test.mjs:143` | 1.2 前後 | 改斷言：評估印務主管可管理需求單 | 三 |
| C02 | 同檔 `:150` | — | 改斷言：評估印務主管可評估完成 | 三 |
| C03 | 同檔 `:159` | — | 改斷言：評估印務主管在需求確認中也可改成本 | 三 |
| C04 | 同檔 `:162-164` | 1.13 | 改斷言：評估印務主管可刪除 | 三 |
| C05 | 同檔 `:171` | 1.14 | 改斷言：業務主管看得到無關需求單 | 三 |
| C06 | 同檔 `:184` | 1.15 | 改斷言：Supervisor 可改派 | 三 |
| C07 | 同檔 `:189-197` | 1.5 | 改斷言：評估印務主管不限兩個狀態、不限成本兩欄 | 三 |
| C08 | `T/tests/e2e/01-quote/quote-request.spec.mjs:563` | 1.13 | 改斷言：評估印務主管列上有編輯與刪除鈕；1.13 標題改寫 | 三 |
| C09 | 同檔 `:576` | 1.14 | 改斷言：業務主管分享前就看得到；建立者（非接單業務）看不到 | 三 |
| C10 | 同檔 `:930` | 1.25 | 改斷言：新單接單業務為執行複製的人 | 三 |
| C11 | `T/tests/e2e/02-order-setup/sharing-members.spec.mjs:49-60` | 2.10 | 改用編輯層級成員改交貨備註；另補檢視層級成員看不到編輯入口的反向斷言 | 二 |
| C12 | `T/tests/unit/orders/review-gate-and-print-item-delete.test.mjs:210-218、227-235`；`T/tests/e2e/.../review-gate.spec.mjs:185` | 2.17 | 改斷言：業務主管、印務主管可送審；會計不可維持 | 二 |
| C13 | 同 unit 檔 `:329-345`；`T/tests/e2e/04-order-print-item/delete-print-item.spec.mjs:137` | 4.20 | 改斷言：印務主管看得到刪除印件；成立後與線上單等待付款的兩項斷言維持；4.20 標題改寫 | 二 |
| C14 | `T/tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:27` | 2.x | 改斷言：業務主管可取消訂單；另補非負責業務不可 | 二 |
| C15 | 同檔 `:181-184` | 11.x | 改斷言：業務主管、訂單管理人可建出貨單草稿；揀貨、出貨人員不可維持 | 二 |
| C16 | `T/tests/unit/orders/order-completion-no-print-items.test.mjs:102-103` | 2.19 | 改斷言：業務主管可手動推進 | 二 |
| C17 | `T/tests/unit/orders/confirm-producible-roles.test.mjs:13-17` | 5.x | 改斷言：業務主管、訂單管理人、印務、Supervisor 可確認可製作；審稿人員不可維持 | 二 |
| C18 | `T/tests/unit/qc-shipping/next-status-options.test.mjs:143-149` | 12.15 | 改斷言：六個全公司協助角色有作廢；揀貨、出貨人員無作廢；12.15 說明改寫 | 五 |
| C19 | `T/tests/unit/work-orders/rules-production-line.test.mjs:235、281-285`；`T/tests/e2e/08-process-review-deliver/delivery-status.spec.mjs:231` | 8.19 | 改斷言：製程確認中印務主管可改產線與目的站點；8.19 標題改寫 | 四 |
| C20 | `T/tests/e2e/08-process-review-deliver/print-sheet.spec.mjs:124` | 8.7 | 改斷言：印務主管可預覽與列印；非負責印務不可列印；生管可列印維持；8.7 標題改寫 | 四 |
| C21 | `T/tests/e2e/14-query-ui/work-orders.spec.mjs:221` | 14.15 | 改斷言：印務主管有分享新增與移除；候選含非印務角色 | 四 |
| C22 | `T/tests/unit/production-floor/correction-entry-scope.test.mjs:71-73`；`T/tests/e2e/14-query-ui/correction-entries.spec.mjs:53` | 14.32 | 改斷言：非負責的印務主管在工單詳情可修正、作廢報工；14.32 標題改寫 | 四 |
| C23 | 同 unit 檔 `:91-98`；同 e2e 檔 `:133` | 14.35、10.x | 依 design Q3（G66 第 64 題）：unit 改斷言為師傅修正只看報工人員、限仍看得到任務時；工作包改派後原師傅看不到原任務、無修正入口，由所屬產線的生管更正。e2e 斷言原師傅的我的生產任務不列原任務，生管在所有生產任務可修正 | 四 |
| C24 | `T/tests/e2e/07-process-planning/proof-and-notes.spec.mjs:76` | 7.27（第二個） | 改斷言：印務可改稿件備註（G65 第 60 題） | 二 |
| C25 | `T/tests/e2e/03-payment/reconciliation-lists.spec.mjs:10` | 3.11 | 改寫：會計從帳務異常清單看差額，不開訂單詳情；三方對帳面板改由業務主管開訂單詳情驗 | 一 |
| C26 | `T/docs/scenario-catalog.md` 1.14 說明 | 1.14 | 改寫說明：業務主管全公司 | 三 |
| C27 | 同檔 2.10「未實作」 | 2.10 | 刪除過期描述，改寫為兩個層級已實作 | 二 |
| C28 | 同檔 9.12 起點資料 | 9.12 | 改寫起點：Supervisor 全公司，不經所屬產線；角色名用 Supervisor | 一 |
| C29 | 同檔 10.40、14.10、14.28；`T/tests/e2e/10-report-transfer/transfer-tickets.spec.mjs:465` | 10.40、14.10、14.28 | 移除權限名稱；範圍改寫為所屬產線、自己負責 | 一 |

另：情境目錄第二個 7.27（印件備註側板依角色鎖欄）改編為 7.44，消除節號重複（第二批處理）。

### 三、新增情境（暫編節號，落目錄時依實際最後一節順延）

| 新節 | 章 | 內容 | 對應 delta Scenario | 測試形式 |
|------|----|------|-------------------|---------|
| 1.26 | 一 | 建立者不因建立而看得到需求單；直連導回 | quote-request〈建立者不因建立而看得到〉 | e2e |
| 1.27 | 一 | 諮詢乙被分享（編輯）他人的需求單後可編輯、送評估；檢視層級不可 | quote-request〈編輯層級的被分享者可編輯並推進〉、document-access〈檢視層級的分享成員改不了需求單〉 | e2e |
| 1.28 | 一 | 評估印務主管列在分享成員清單；頁籤名「分享成員」、欄名「評估印務主管」 | quote-request〈評估印務主管列在分享成員清單〉、document-access〈需求單頁籤與欄名用 wiki 名稱〉 | e2e |
| 1.29 | 一 | 只有業務、諮詢看到建立需求單；未列角色無需求單入口 | quote-request〈業務、諮詢可建立需求單〉〈未列的角色看不到需求單〉 | unit＋e2e |
| 1.30 | 一 | Supervisor 改派需求單；其他角色無改派入口 | quote-request〈Supervisor 改派進行中需求單〉〈其他角色看不到改派入口〉〈改派與分享為獨立入口〉 | e2e |
| 1.31 | 一 | 編輯分享成員再授予分享；收回即時生效 | quote-request〈編輯層級的被分享者可再管理分享成員〉〈收回授權即時生效〉 | unit |
| 2.20 | 二 | 六個全公司協助角色可編輯訂單；會計無訂單入口、直連導回 | document-access〈全公司協助角色看得到接單業務能做的操作〉〈會計直連訂單詳情被導回〉〈會計看不到訂單管理〉 | e2e |
| 2.21 | 二 | 業務直連別人的訂單導回；審核業務主管途徑不給業務看 | document-access〈業務直連別人的訂單詳情被導回〉、order-management〈審核業務主管途徑不給業務看訂單〉 | e2e |
| 2.22 | 二 | 已送報價單、確認回簽、上傳回簽只給訂單編輯權者 | order-management〈已送報價單只對有訂單編輯權的人顯示〉 | unit |
| 2.23 | 二 | 諮詢乙被分享（編輯）他人的訂單後送主管審核；業務乙被分享後直連可進 | order-management〈編輯層級的分享成員送主管審核〉、document-access〈被分享後直連詳情可進入〉 | e2e |
| 2.24 | 二 | 核准訂單只給審核業務主管本人 | order-management〈核准訂單不隨編輯權開放〉 | unit |
| 2.25 | 二 | 訂單改派：Supervisor 可、訂單完成可、已取消不可、其他角色無入口 | order-management〈訂單接單業務改派〉全部 Scenario；document-access〈管理類動作不隨訂單編輯權開放〉 | e2e |
| 2.26 | 二 | 印務主管、印務、審稿主管側欄有訂單管理並看全公司 | document-access〈印務主管、印務、審稿主管看得到訂單管理〉、order-management〈印務、印務主管、審稿主管看全公司訂單〉 | e2e |
| 2.27 | 二 | 訂單分享候選含審稿主管，不含會計與生管 | document-access〈業務把訂單分享給審稿主管〉〈會計不會出現在訂單分享候選〉 | e2e |
| 3.24 | 三 | 檢視層級分享成員看不到帳務入口；業務主管可登錄款項 | order-management〈檢視層級分享成員看不到訂單頁籤內的帳務入口〉、order-billing〈檢視層級分享成員不能開立發票〉〈全公司協助角色登錄款項紀錄〉 | e2e |
| 3.25 | 三 | 跨訂單清單含被分享訂單；業務應收全公司 | order-billing〈被分享訂單的待開發票列在清單〉〈業務在應收款項清單看全公司〉 | unit（`visibleForRole` 首次覆蓋） |
| 3.26 | 三 | 會計從帳務異常清單對帳、列上沒有訂單連結 | order-billing〈會計從帳務異常清單對帳不進訂單詳情〉 | e2e |
| 3.27 | 三 | 匯出對帳明細給看得到應收的人；待退款報表只給三角色 | order-billing〈業務可匯出對帳明細〉〈業務不能匯出待退款報表〉 | e2e |
| 3.28 | 三 | 訂單異動：檢視層級不可建、協助角色可建可送審、已認列取消限審核主管本人、非負責業務不可取消 | order-adjustment 全部 Scenario | unit＋e2e |
| 4.21 | 四 | 業務的印件列表只列自己負責與被分享訂單的印件 | order-management〈業務的印件列表只列自己負責與被分享訂單的印件〉 | e2e |
| 4.22 | 四 | 協助角色新增與刪除印件、修改規格與包裝備註、取消製作 | order-management〈全公司協助角色新增與刪除印件〉〈全公司協助角色修改規格備註與包裝備註〉〈全公司協助角色取消製作〉 | unit |
| 4.23 | 四 | 協助角色取消訂單、手動推進；非負責業務不可 | order-management〈全公司協助角色取消訂單〉〈全公司協助角色手動推進訂單〉 | unit |
| 5.18 | 五 | 協助角色確認可製作；非負責業務擋下；諮詢上傳稿件 | order-management〈全公司協助角色確認可製作〉〈非負責業務不能確認可製作〉〈諮詢可上傳自己負責訂單的稿件〉 | unit |
| 7.45 | 七 | 印務主管代做工單：建任務、送審、確樣需求 | work-order〈印務主管代做工單〉〈印務主管維護確樣需求〉 | unit＋e2e |
| 7.46 | 七 | 業務被分享（編輯）工單：建任務、送審、改製程說明與印務印件檔案 | work-order〈非印務的編輯分享成員做負責印務的動作〉〈非印務的編輯分享成員改製程說明與印務印件檔案〉 | unit |
| 7.47 | 七 | 印務不能動別人的工單；檢視層級分享成員無修改入口 | work-order〈印務不能動別人的工單〉、document-access〈檢視層級的分享成員改不了工單〉 | unit |
| 7.48 | 七 | 印務自行加開工單，負責人為加開者、送審時指定審核主管 | work-order〈印務自行加開工單〉〈自行加開的工單送審時指定審核主管〉 | e2e |
| 7.49 | 七 | 印務改稿件備註 | order-management〈印務可改稿件備註〉 | e2e（與 C24 同檔） |
| 8.20 | 八 | 核可製程不隨工單編輯權開放；印務主管管理分享成員 | work-order〈核可製程不隨工單編輯權開放〉〈印務主管管理工單分享成員〉 | unit |
| 8.21 | 八 | 業務被分享（編輯）工單可改目的站點；生管不可 | production-execution〈非印務的編輯分享成員可改目的站點〉〈生管不可改目的站點〉〈製程核可前印務主管也可改〉 | unit |
| 8.22 | 八 | 工單單據：印務主管預覽列印、非負責印務不可、生管異動後重印 | work-order〈工單單據預覽與列印的操作者依活動清單〉全部 Scenario | e2e（與 C20 同檔） |
| 10.62 | 十 | 印務主管與業務（編輯分享）在工單詳情報工、修正、作廢；檢視層級不可；印務不得報別人的工單 | production-execution〈報工權限守門〉全部 Scenario | unit＋e2e |
| 11.28 | 十一 | 待驗清單與品檢紀錄依角色範圍 | qc 全部 Scenario | e2e |
| 11.30 | 十一 | 缺口處置、修正處置、補做、短出結案限工單編輯權（落目錄時 11.29 已被缺口處置數量檢核使用，順延為 11.30） | work-order〈非負責印務不能處置缺口〉〈編輯分享成員短出結案〉〈售後決議補做限工單編輯權〉 | unit |
| 12.22 | 十二 | 出貨單列表跟著訂單；業務主管與協助角色全公司；生管、品檢人員無入口 | shipment〈業務的出貨單列表只列自己負責訂單的單〉〈業務主管與協助角色看全公司出貨單〉、document-access〈沒有出貨單檢視列的角色看不到出貨管理〉〈活動清單沒有列出的角色看不到操作鈕〉 | e2e |
| 12.23 | 十二 | 協助角色建草稿、作廢；印務（編輯分享）建立並作廢；改派後新業務可處置；現場動作不開放 | shipment〈出貨單業務端操作的操作者依訂單編輯權〉全部 Scenario | unit（與 C18 同檔）＋e2e |
| 12.24 | 十二 | 出貨人員補附送達憑證 | shipment〈出貨人員於已送達後補附憑證〉 | e2e |
| 12.25 | 十二 | 售後服務單跟著訂單；會計與 Supervisor 有入口；會計只能看 | after-sales-ticket〈接單業務看得到同事代開的售後服務單〉〈會計與 Supervisor 有售後服務入口〉〈會計看得到但不能操作〉 | e2e |
| 12.26 | 十二 | 業務主管協助編輯送出決議；印務主管建立售後服務單；非負責業務擋下建訂單異動 | after-sales-ticket〈業務主管協助編輯與送出決議〉〈全公司協助角色建立售後服務單〉〈非負責業務不能在售後服務單內建立訂單異動〉 | unit |
| 14.41 | 十四 | 工單分享候選含業務與生管 | document-access〈印務把工單分享給業務〉〈生管會出現在工單分享候選〉 | e2e（與 C21 同檔） |
| 14.42 | 十四 | 介面用詞：Supervisor、不顯示權限名稱 | document-access〈角色名顯示 Supervisor〉〈介面不顯示權限名稱〉 | e2e |
| 14.43 | 十四 | 訂單檢視層級分享成員無修改入口 | document-access〈檢視層級的分享成員改不了訂單備註〉 | e2e（與 C11 同檔） |
| 2.28 | 二 | 複製訂單：編輯分享成員與協助角色可複製、新單接單業務為複製者；檢視層級不可 | order-management〈複製訂單的執行者與新訂單接單業務〉全部 Scenario | e2e（第七批） |

由既有測試改斷言覆蓋、不另開新節的 delta Scenario：

| delta Scenario | 覆蓋的衝突處置 |
|------|------|
| order-management〈全公司協助角色送主管審核〉 | C12（2.17） |
| quote-request〈接單業務授予同事檢視層級〉 | 1.27 檢視層級反向斷言，另於 C09 同檔補檢視層級分享 |
| quote-request〈業務主管改派進行中需求單〉 | C06 同檔（1.15 既有業務主管改派） |
| quote-request〈業務主管看全公司需求單〉 | C05、C09（1.14） |
| quote-request〈評估印務主管可做編輯分享成員能做的動作〉 | C01 至 C04、C07、C08（1.13、1.5） |
| quote-request〈編輯分享成員複製他人負責的需求單〉 | C10（1.25） |

不另列節號的 delta Scenario：production-execution〈生產任務目的站點的修改〉中沿用的五則既有 Scenario（已有報工仍可改、已完成可改、核可後可改、改站不改寫已建轉交單、待搬運作廢重建），既有測試已覆蓋，本變更只確認仍通過。

## 0. 前置

- [x] 0.1 確認 erp repo 在 `prototype/production-stage` 分支、工作區乾淨；記下起點提交（`git -C /Users/b-f-03-029/erp rev-parse HEAD` 有輸出）
- [x] 0.2 design § Open Questions 的 Q1 至 Q5 已依 grill G66 決議，不另開 OQ 卡
- [x] 0.3 讀 erp repo skill `prototype-from-prompt`，後續每批 Prototype 實作依該 skill 執行
- [x] 0.4 在 `T/` 跑 `npm test` 取得基準（記下失敗數，作為各批比對）

## 1. 第一批：共用判斷、側欄、直連、分享候選、用詞

- [x] 1.1 mock：依測試影響清單一、第 1、2、8、9、10、11 項改 `P/MOCK-DATA-CHAIN.md`，再改三個模組的 `mock-data.js` 與 `P/_lib/sessionStore.js` 標籤
- [x] 1.2 測試先行：改 C25（3.11）、C28（9.12 目錄）、C29（10.40、14.10、14.28 目錄與 `transfer-tickets.spec.mjs:465`）
- [x] 1.3 測試先行：新增 2.20、2.21、2.26、2.27、14.41、14.42 的測試；跑 `npm run test:module -- tests/e2e/02-order-setup tests/e2e/14-query-ui` 確認新測試先失敗
- [x] 1.4 測試先行：新增一則 unit 測試，抽樣比對 Prototype 活動表與活動清單卡（至少訂單審核、出貨、製程規劃三張卡的列數與角色組合）
- [x] 1.5 Prototype：建立集中權限判斷與活動表資料（design D1 至 D4），先不改各模組呼叫
- [x] 1.6 Prototype：側欄入口改由集中判斷產生（D5）；會計移除訂單管理，款項清單的訂單連結對會計不顯示
- [x] 1.7 Prototype：需求單、訂單、印件、工單、出貨單、售後服務單詳情頁加進入判斷，無檢視組合導回預設頁
- [x] 1.8 Prototype：三種單據的分享候選改為依活動列可分享的角色（D6、D7）
- [x] 1.9 Prototype：用詞修正（Supervisor 標籤、移除權限名稱提示）
- [x] 1.10 驗證：`npm run impact` 判影響全站，跑 `npm test` 全套；1.2 至 1.4 的測試全部通過、其餘失敗數不高於 0.4 基準
- [x] 1.11 提交 erp 與 Sens，訊息附全套結果

## 2. 第二批：訂單與印件

- [x] 2.1 mock：依測試影響清單一、第 3、4 項改 `P/MOCK-DATA-CHAIN.md` 與 `P/orders/mock-data.js`
- [x] 2.2 測試先行：改 C11、C12、C13、C14、C15、C16、C17、C24、C27；情境目錄第二個 7.27 改編 7.44
- [x] 2.3 測試先行：新增 2.22、2.23、2.24、2.25、4.21、4.22、4.23、5.18、7.49、14.43 的測試；跑 `npm run test:module -- tests/e2e/02-order-setup tests/e2e/04-order-print-item tests/e2e/07-process-planning` 確認新測試先失敗
- [x] 2.4 Prototype：訂單詳情各頁籤的編輯入口改由集中判斷（不再只看 `readOnly = isOrderTerminal`）
- [x] 2.5 Prototype：送審、取消、手動推進、已送報價單、確認回簽、上傳回簽、新增與刪除印件改由集中判斷
- [x] 2.6 Prototype：印件審稿面操作（討論串、上傳與補件、確認可製作、退回重審、打樣結果、取消製作、規格備註與包裝備註、稿件備註）改由集中判斷
- [x] 2.7 Prototype：訂單改派顯示條件改為「未取消」，並開放 Supervisor
- [x] 2.8 Prototype：印件列表依訂單範圍過濾；移除審核業務主管途徑
- [x] 2.9 驗證：`npm run test:smoke` 通過；`npm run test:module -- tests/e2e/02-order-setup tests/e2e/04-order-print-item tests/e2e/05-prepress-review tests/e2e/07-process-planning` 通過；`npx vitest run tests/unit/orders tests/unit/print-items` 通過
- [ ] 2.10 提交 erp 與 Sens，訊息附 smoke 與模組結果

## 3. 第三批：需求單

- [x] 3.1 測試先行：改 C01 至 C10、C26
- [x] 3.2 測試先行：新增 1.26 至 1.31 的測試；跑 `npm run test:module -- tests/e2e/01-quote` 確認新測試先失敗
- [x] 3.3 Prototype：需求單列表與詳情改由集中判斷；建立者不給權限；業務主管全公司
- [x] 3.4 Prototype：評估印務主管以編輯分享成員判定，並列入分享成員清單
- [x] 3.5 Prototype：改派開放 Supervisor；分享管理開放所有編輯分享成員
- [x] 3.6 Prototype：複製需求單的新單接單業務改為執行者；頁籤名「分享成員」、欄名「評估印務主管」
- [x] 3.7 驗證：`npm run test:smoke` 通過；`npm run test:module -- tests/e2e/01-quote` 通過；`npx vitest run tests/unit/quote` 通過
- [ ] 3.8 提交 erp 與 Sens

## 4. 第四批：工單與生產

- [x] 4.1 mock：依測試影響清單一、第 7 項確認報工紀錄與工作包改派資料（原無此樣本：先改 MOCK-DATA-CHAIN，再改 PT-0820-3 的報工人員為劉阿海、工作包改派陳金水並補任務歷程一筆）
- [x] 4.2 測試先行：改 C19（8.19 先前已改寫，本批確認仍通過）、C20、C21、C22、C23
- [x] 4.3 測試先行：新增 7.45、7.46、7.47、8.20、8.21、8.22、10.62、11.30 的測試；跑 `npm run test:module -- tests/e2e/07-process-planning tests/e2e/08-process-review-deliver tests/e2e/10-report-transfer` 確認新測試先失敗
- [x] 4.4 Prototype：工單側動作移除「先判印務」，改由集中判斷（含印務主管代做、編輯分享成員）
- [x] 4.5 Prototype：目的站點與產線修改開放印務主管於核可前；確樣需求開放印務主管
- [x] 4.6 Prototype：工單分享管理開放印務主管與編輯分享成員
- [x] 4.7 Prototype：工單單據預覽與列印依集中判斷
- [x] 4.8 Prototype：工單詳情的報工、修正、作廢依工單編輯權；師傅修正只看報工人員、限仍看得到任務時，工作包改派後由生管更正
- [x] 4.9 Prototype：缺口處置、補做、短出結案依工單編輯權
- [x] 4.10 驗證：`npm run test:smoke` 通過；`npm run test:module -- tests/e2e/07-process-planning tests/e2e/08-process-review-deliver tests/e2e/09-planner-dispatch tests/e2e/10-report-transfer tests/e2e/14-query-ui` 通過；`npx vitest run tests/unit/work-orders tests/unit/production-floor` 通過
- [ ] 4.11 提交 erp 與 Sens

## 5. 第五批：出貨、售後、品檢

- [ ] 5.1 mock：依測試影響清單一、第 5、6 項改 `P/MOCK-DATA-CHAIN.md` 與對應 `mock-data.js`
- [ ] 5.2 測試先行：改 C18
- [ ] 5.3 測試先行：新增 11.28、12.22、12.23、12.25、12.26 的測試；跑 `npm run test:module -- tests/e2e/11-qc tests/e2e/12-shipping` 確認新測試先失敗
- [ ] 5.4 Prototype：品檢待驗清單與品檢紀錄依角色範圍過濾
- [ ] 5.5 Prototype：出貨單列表依訂單範圍；業務端操作依訂單編輯權，不看建單人
- [ ] 5.6 Prototype：售後服務單列表依訂單範圍（不看開立者）；編輯、送出決議、結案、建訂單異動依訂單編輯權；會計只能檢視
- [ ] 5.7 驗證：`npm run test:smoke` 通過；`npm run test:module -- tests/e2e/11-qc tests/e2e/12-shipping` 通過；`npx vitest run tests/unit/qc-shipping` 通過
- [ ] 5.8 提交 erp 與 Sens

## 6. 第六批：帳務清單與輸出

- [ ] 6.1 測試先行：新增 3.24 至 3.28 的測試；跑 `npm run test:module -- tests/e2e/03-payment` 確認新測試先失敗
- [ ] 6.2 Prototype：訂單頁籤內收款項目、發票、款項紀錄、訂單異動的入口依集中判斷；取消已認列異動限審核業務主管本人
- [ ] 6.3 Prototype：四張跨訂單清單依活動清單範圍，含被分享訂單；應收款項對業務、諮詢全公司
- [ ] 6.4 Prototype：匯出對帳明細給看得到應收款項清單的人；匯出待退款報表限業務主管、會計、Supervisor
- [ ] 6.5 驗證：`npm run test:smoke` 通過；`npm run test:module -- tests/e2e/03-payment` 通過；`npx vitest run tests/unit/payment` 通過
- [ ] 6.6 提交 erp 與 Sens

## 7. 第七批：未實作操作補齊（依 design Q5，留在本變更最後做）

- [ ] 7.1 測試先行：新增 2.28、7.48、12.24 的測試，確認先失敗
- [ ] 7.2 Prototype：複製訂單（新單接單業務為執行者；帶入內容依既有〈訂單複製功能〉）
- [ ] 7.3 Prototype：印務自行加開工單（負責人固定為加開者、送審時指定審核主管）
- [ ] 7.4 Prototype：出貨人員補附送達憑證
- [ ] 7.5 驗證：`npm run test:smoke` 與 `npm run test:module -- tests/e2e/02-order-setup tests/e2e/07-process-planning tests/e2e/12-shipping` 通過
- [ ] 7.6 提交 erp 與 Sens

## 8. 收尾

- [ ] 8.1 合併前跑 `npm test` 全套，失敗數為 0；結果附在合併說明
- [ ] 8.2 情境目錄各新節補「依據」wiki 卡名；`T/docs/findings-20260908.md` 關掉已修項
- [ ] 8.3 archive 前手動清理下列既有 Requirement 的舊權限句（design D8），每項清理後 `openspec validate --strict` 通過：
  - order-management〈訂單列表權限與可見範圍〉：角色範圍段與「訂單管理人」「業務主管」兩則 Scenario 改引用檢視活動清單
  - order-management〈訂單詳情頁編輯型 Section 統一編輯時機與角色〉：角色表刪除，改引用活動清單
  - order-management〈業務送出訂單審核（草稿 → 待業務主管審核）〉：「印務主管（不參與訂單維護）」一句與〈只有訂單可編輯角色看得到送審按鈕〉Scenario
  - order-management〈訂單複製功能〉：「業務與諮詢 SHALL 可」
  - order-management〈訂單階段印件規格編輯時機〉：「業務 / 諮詢 / 訂單管理人 SHALL 可」、「稿件備註 SHALL 維持只有業務與 B2C 會員可改」、權責邊界段
  - order-management〈訂單詳情頁印件操作入口〉：「業務 SHALL 僅能檢視到訂單層級」（與 ACT-VPRD-034、ACT-VPRD-046 不一致）
  - prepress-review〈業務確認可製作操作〉、〈業務退回重審操作〉：角色句
  - prepress-review〈打樣結果業務判定〉：「SHALL NOT 由業務主管代填」（與 ACT-ART-025 不一致）
  - prepress-review〈稿件上傳開放與上傳角色分流〉：B2B 上傳角色句與 Rationale「開給非業務角色」一句（與 ACT-ART-008 不一致）
  - quote-request〈需求單詳情頁 Tabs 化版型〉：主動作群的角色列
  - order-billing〈發票開立（藍新 Mockup）〉、〈發票作廢與折讓〉、〈折讓單（SalesAllowance）建立、確認、作廢〉、〈會計批次對帳檢視〉、〈對帳 CSV 匯出（14 欄定稿）〉：執行角色句
  - order-adjustment〈訂單異動（OrderAdjustment）建立與審核〉：「使用者為業務 / 諮詢」；〈訂單異動（OrderAdjustment）狀態機〉：已取消列的取消者
  - work-order〈工單列印單據〉：「觸發與權限」段的列印角色與 Rationale「列印權限含生管」一句；〈工單分派〉：「印務主管 SHALL 統一分派」補自行加開例外的引用
  - production-execution〈生產管理單元的權限與可見範圍〉：「主管（Supervisor）」用詞與權限名稱
  - qc〈待驗清單〉：「生管、印務、印務主管 SHALL 可唯讀檢視」與〈非品檢人員唯讀檢視〉Scenario
  - after-sales-ticket〈我的售後服務作業頁〉、〈業務主管全公司售後管理頁〉：「範圍為開立者本人」
- [ ] 8.4 主動收尾：依 CLAUDE.md § 主動收尾掃本變更檔案有無 inline 待確認措辭；後端未解問題卡（AFT-16、ORD-058、QR-015）補記 Prototype 已改的事實
