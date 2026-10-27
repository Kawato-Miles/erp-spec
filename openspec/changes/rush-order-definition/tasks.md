## 1. 規格與落卡

- [x] 1.1 wiki 落卡：急件新定義（是否急件、購買的急件選項、標注判準、勾起狀態常駐提示）與印件預計交期依階段必填，提交 4fc3a8b 並已合併 master；ORD-059 封存；延後事項見 grill.md 延後列
- [x] 1.2 delta specs 依 R5、R6 改寫：order-management（修改 15、新增 6、移除 2）、consultation-request（修改 1，新增 delta）、quote-request（修改 2）、work-order（修改 7）、production-execution（新增 1）、prepress-review（修改 3）、production-overview（修改 1）、dispatch-order（新增 1）、shipment（新增 1）；`openspec validate rush-order-definition --strict` 通過
- [x] 1.3 design.md 檔尾「規格與驗收對應」依新 delta 重寫

## 2. Prototype 資料與純函式

工作位置：erp 工作副本，分支 `prototype/rush-order-r2`（自 `prototype/production-stage` 切出），路徑 `apps/erp/src/app/(prototype)/`。實作 MUST 經 erp repo 內 skill `prototype-from-prompt`。規則正本見 design.md § 二至 § 四與 delta specs。順序固定：先改 MOCK-DATA-CHAIN.md，再改各模組 mock-data.js，再改純函式、store、元件，最後改測試。

已完成且不受新設計影響：

- [x] 2.1 日期鏈：印件內部完成日＝印件預計交期往前減 1 個工作天；刪除未扣欄、建議值、下限把關與覆蓋提示（`_lib/delivery-chain.js`）
- [x] 2.2 既存缺陷：排程超期預設狀態集補「異動」、移除「製作完成」（`_lib/delivery-chain.js`）
- [x] 2.3 既存缺陷：工單日期副本同步只推非終態工單的印件內部完成日與印件預計交期兩欄（`work-orders/_lib/due-date-sync.js`）
- [x] 2.4 改印件預計交期 → 重算內部完成日、同步非終態工單、寫訂單活動紀錄；打樣 NG 複製與訂單複製帶入原日期；加開不預填日期（`orders/_lib/store.js`）
- [x] 2.5 訂單急件標注即時推算、不存欄；訂單列表「急件」篩選、不自動排序

依新設計重做：

- [x] 2.6 `MOCK-DATA-CHAIN.md`：印件急件欄改為「是否急件」（是／否），刪急件選項與天數快照敘述；線上單鏈的印件另記「購買的急件選項」（名稱、增減天數，負數＝提早）；需求單印件項目補是否急件；保留急件、一般、已棄用急件、留空日期、已完工、逾期各情境；補一張「離開草稿後新增印件」與一張「送審缺日期」的資料鏈。完成條件：MOCK-DATA-CHAIN 內不再出現急件選項、凍結、天數快照字樣
- [x] 2.7 各模組 mock-data.js 依 MOCK-DATA-CHAIN 改：印件移除 urgent_option_id、urgent_option_name、urgent_option_days 三欄，改為是否急件；線上單印件帶購買的急件選項值（含提早、延後、不增減各一例）；需求單印件項目補是否急件。完成條件：`grep -rn "urgent_option" "apps/erp/src/app/(prototype)/"` 無結果
- [x] 2.8 刪除 `orders/_lib/urgent-option-mock.js` 與所有引用。完成條件：`grep -rn "urgent-option-mock" "apps/erp/src/app/(prototype)/"` 無結果
- [x] 2.9 判準改看是否急件：`orders/_lib/urgent-due-date.js` 急件標注＝是否急件為是且印件非已棄用；`_lib/delivery-chain.js` 的 urgentDaysOf 一帶移除急件天數取值，日期鏈不讀任何急件欄；`orders/_lib/__checks__/urgent-due-date.check.mjs` 同步改寫。完成條件：判準函式只讀是否急件與印製維度
- [x] 2.10 `orders/_lib/store.js`：改是否急件 → 不重算、不同步、寫訂單活動紀錄（舊值、新值為是／否）；需求單轉訂單帶入是否急件作為預設值；打樣 NG 複製、訂單複製、複製加開帶入原印件的是否急件；三種複製都不帶購買的急件選項
- [x] 2.11 `orders/_lib/store.js`：送審檢查加「有效印件都有印件預計交期」，不符時列出缺日期的印件，已棄用印件不列；諮詢訂單不檢查
- [x] 2.12 `orders/_lib/store.js`：訂單已離開草稿時，新增印件與複製加開存檔必填印件預計交期；既有有效印件可改不可清空；草稿期間可空
- [x] 2.13 其他讀急件欄的模組改讀是否急件：`print-items/_lib/store.js`、`qc-shipping/_lib/pending-inspections.js`、`orders/_lib/production-detail-actions.js`

## 3. Prototype 畫面

- [x] 3.1 印件編輯對話框（`orders/_components/detail/PrintItemEditDrawer.js`）與新增、加開對話框：急件選項下拉改為「是否急件」勾選，新增時預設不勾；勾起狀態時印件預計交期欄旁常駐顯示「此印件為急件，請確認印件預計交期」，取消勾選即消失，不跳出、不擋存檔；系統帶入為是時開啟即顯示
- [x] 3.2 印件編輯與新增對話框：訂單離開草稿後印件預計交期未填時擋存檔並在該欄提示必填；既有印件清空時擋存檔
- [x] 3.3 訂單詳情送審：「送主管審核」停用時缺項列出缺印件預計交期的印件
- [x] 3.4 線上單印件：唯讀顯示購買的急件選項「提早 N 天」「延後 N 天」「不增減」，mock 帶值；不做接收介面，不做編輯入口（唯讀只是未決期間的呈現，不是規則）
- [x] 3.5 需求單印件項目：新增「是否急件」勾選，預設不勾；勾起時該列印件預計交期欄旁常駐同一條提示；複製需求單帶入；轉訂單帶入作為預設值
- [x] 3.6 訂單項目表（`orders/_components/detail/ItemsTab.js`）：急件選項欄改為是否急件；印件列急件標注依新判準
- [x] 3.7 各處急件標注判準統一只看印件是否急件：審稿待審清單（`prepress-review/_components/ReviewOrderList.js`）、工單列表／詳情／工單單據、生產任務列表、派工畫面、轉交單明細、出貨單明細、品檢站（`qc-shipping/inspection/page.js`）、派單、印件列表與詳情、訂單列表與詳情

## 4. 測試（Sens `erp-prototype-tests/`）

測試影響清單（依 `docs/scenario-catalog.md` 節號）：

| 章 | 節 | 動作 |
|---|---|---|
| 1 | 1.3 | 改寫：轉訂單時是否急件帶入作為預設值，開啟印件即見提示 |
| 1 | 1.6 | 改寫：複製需求單帶入是否急件原值，勾起者顯示提示 |
| 1 | 1.10 | 改寫：需求單印件項目有是否急件；勾選時常駐提示、不擋存檔、取消即消失；轉訂單帶入作為預設值、之後可改且不回寫需求單 |
| 2 | 2.1 | 改寫：送審前有效印件都有印件預計交期 |
| 2 | 2.14 | 改寫：送審缺項加列缺印件預計交期的印件，已棄用印件不列 |
| 2 | 2.15 | 改寫：沒有印件的訂單照樣可送審；其餘段落補「有效印件都有日期」前置 |
| 2 | 2.16 | 檢查：核准當下重檢沿用；不新增缺日期的核准情境 |
| 4 | 4.5 | 改寫：勾選是否急件不改日期、常駐提示；刪除延後型段落 |
| 4 | 4.6 | 改寫：改是否急件不重算、不同步、活動紀錄記是／否；離開草稿後不可清空 |
| 4 | 4.7 | 改寫：必填欄不含急件選項；是否急件預設否；草稿可空、離開草稿後必填 |
| 4 | 4.8 | 改寫：複製加開帶入是否急件、顯示提示；印件預計交期不預填、離開草稿後存檔必填 |
| 4 | 4.9 | 改寫：已棄用後是否急件與印件預計交期唯讀 |
| 4 | 4.10 | 改寫：三條複製路徑帶入是否急件原值並顯示提示；不帶購買的急件選項 |
| 4 | 4.14、4.15 | 改寫：欄名與提示改為是否急件新定義 |
| 4 | 4.24 | 改寫：標注判準改為是否急件為是且非已棄用；刪延後型與天數判準段落 |
| 4 | 新增 4.25 | 新增：訂單離開草稿後新增印件未填日期擋存檔、既有印件可改不可清空 |
| 4 | 新增 4.26 | 新增：線上單印件顯示購買的急件選項（提早、延後、不增減），不參與標注 |
| 5 | 5.13 | 改寫：急單標示判準改為是否急件；已棄用不列 |
| 5 | 5.14、5.15 | 檢查：日期欄不受急件影響，必要時改起點資料 |
| 6 | 6.13 | 改寫：留空情境改用草稿訂單或線上單起點，線下單離開草稿後不再有空日期 |
| 7 | 7.30、7.32 | 改寫：「改急件選項解不了擋」改為改是否急件不觸發判定 |
| 8 | 8.8 | 改寫：工單單據急件標注依是否急件 |
| 9 | 9.11、9.23 | 改寫：現場三頁與派工畫面標注依是否急件；勾選後即時更新 |
| 10 | 10.63 | 改寫：轉交單明細標注依是否急件 |
| 11 | 11.7、11.22 | 改寫：品檢站急件欄與篩選依是否急件 |
| 12 | 12.60 | 改寫：出貨明細標注依是否急件 |
| 14 | 14.26 | 檢查：摘要卡日期不受急件影響 |
| 14 | 14.46 | 改寫：訂單列表急件篩選依新判準（已棄用急件印件不計） |
| 14 | 14.47 | 改寫：印件列表與詳情標注依是否急件，否與已棄用不標 |
| 15 | 15.12、15.17 | 檢查：工作天與準時完工率不讀任何急件欄 |
| 統計 | 統計表 | 重算節數 |

mock 動到的位置：`MOCK-DATA-CHAIN.md`；orders、print-items、quote-prototype、work-orders、production-floor 各模組 mock-data.js（印件急件欄、線上單購買的急件選項、需求單印件項目是否急件、新增兩條必填資料鏈）。

- [x] 4.1 `docs/scenario-catalog.md`：上表各節改寫與新增，統計表重算
- [x] 4.2 Vitest 單元測試改寫：`tests/unit/work-orders/rules-urgent-badge-print-item-only`、`tests/unit/delivery-chain/` 各檔、`tests/unit/print-items/rules-prepress-review-sort`、`tests/unit/qc-shipping/pending-inspections`、`tests/unit/orders/order-copy`、`tests/unit/orders/print-item-date-change`、`tests/unit/data-consistency/rules-due-date-consistency`；新增送審缺日期、離開草稿後新增必填、既有不可清空、是否急件帶入四項；期望值取自 delta specs 的 THEN
- [x] 4.3 Playwright 畫面測試改寫：01-quote、02-order-setup、04-order-print-item、05-prepress-review、08-process-review-deliver（print-sheet）、09-planner-dispatch（dispatch-board、work-packages-view）、10-report-transfer、11-qc、12-shipping、14-query-ui（work-orders、print-items、order-list-delivery-date）
- [x] 4.4 erp 修改全部完成後跑 `npm run impact` 對映影響；改哪章跑哪章；`npm run test:smoke` 通過；不主動跑全套

## 5. 驗收與合併

- [x] 5.1 實作交回後，主對話對照 prototype-from-prompt 與 delta specs 稽核
- [x] 5.2 畫面測試只由主對話跑一次，背景執行；測試期間不改 erp 檔
- [ ] 5.3 erp 提交訊息附測試結果；`prototype/rush-order-r2` 快轉合併回 `prototype/production-stage`，刪除該分支與隔離工作副本
