## 1. 規格與落卡

- [x] 1.1 wiki 落卡：31 張卡，提交 ee8425f 與 2902818；ORD-059 封存；新增 OQ 兩張（延後，見 grill.md）
- [x] 1.2 delta specs：order-management（修改 15、新增 3、移除 1）、quote-request（修改 2）、work-order（修改 7）、production-execution（新增 1）、prepress-review（修改 3）、production-overview（修改 1）、dispatch-order（新增 1）、shipment（新增 1）；`openspec validate rush-order-definition --strict` 通過
- [x] 1.3 design.md 檔尾追加「規格與驗收對應」

## 2. Prototype 資料與純函式（erp 工作副本 `prototype/rush-order-definition`）

規則正本見 design.md § 二至 § 四與 delta specs。依序執行：先改 MOCK-DATA-CHAIN，再改各模組 mock 資料，再改純函式、store、元件。

- [x] 2.1 `(prototype)/MOCK-DATA-CHAIN.md`：移除未扣欄敘述；各鏈起點改為印件預計交期；內部完成日＝預計交期減 1 個工作天；既有情境（急件、延後型、留空、已完工、逾期）保留
- [x] 2.2 各模組 mock 資料移除印件與需求單項目的未扣欄：orders、work-orders、print-items、production-floor、quote-prototype。完成條件：`grep -rn "undeducted_internal_due_date" (prototype)/` 無結果
- [x] 2.3 `_lib/delivery-chain.js`：內部完成日改由預計交期減 1 推導；刪除建議值、下限把關、覆蓋提示、扣減註記；重算函式只由預計交期重算內部完成日；全部交完日算式不變
- [x] 2.4 `orders/_lib/urgent-due-date.js`：急件判準改為凍結天數大於 0；標示文字不再寫提前天數；延後型不標
- [x] 2.5 既存缺陷：`delivery-chain.js` 的排程超期預設狀態集，依 wiki〈工單狀態〉與〈工單〉排程超期標示段修正（補「異動」、移除工單沒有的「製作完成」）
- [x] 2.6 既存缺陷：`work-orders/_lib/due-date-sync.js` 不再把未扣欄寫進工單副本；同步只推非終態工單的內部完成日與預計交期兩欄
- [x] 2.7 `orders/_lib/store.js`：改印件預計交期（含清空）→ 重算內部完成日、同步非終態工單、寫訂單活動紀錄；改急件選項 → 不重算、不同步、寫活動紀錄；打樣 NG 複製帶入原預計交期；訂單複製與需求單複製帶入原值；加開留空
- [x] 2.8 訂單急件標注（即時推算，不存欄）：任一有效印件被標注；已棄用不計

## 3. Prototype 畫面

- [x] 3.1 印件編輯對話框與訂單印件列：填印件預計交期；內部完成日唯讀；手動選定凍結天數大於 0 的急件選項時提示「此印件為急件，請確認印件預計交期」，不擋存檔；系統帶入不提示；客戶指定收件日提醒文字改版
- [x] 3.2 訂單詳情：訂單急件標注與印件列標注；兩個預計出貨日只有線上單有，線下單與諮詢訂單沒有；訂單列表新增「急件」篩選條件、不自動排序
- [x] 3.3 需求單印件項目：欄位改名印件預計交期，不顯示內部完成日、不帶急件標注
- [x] 3.4 審稿待審清單、工單列表／詳情／摘要／工單單據、生產任務列表、派工畫面、品檢站、印件詳情與列表：急件標注判準統一大於 0
- [x] 3.5 轉交單與出貨單：子列帶急件標注，單頭不顯示

## 4. 測試（Sens `erp-prototype-tests/`）

測試影響清單（依 `docs/scenario-catalog.md` 節號）：

| 章 | 節 | 動作 |
|---|---|---|
| 1 | 1.10 | 改寫：需求單印件項目欄名與帶入 |
| 2 | 2.5 | 改寫：兩個預計出貨日只有線上單有，線下單與諮詢訂單沒有 |
| 4 | 4.5、4.6 | 改寫：4.5 由「扣急件推導」改為預計交期減 1；4.6 改預計交期重算同步、改急件不重算 |
| 4 | 4.7 至 4.15 | 逐節檢查未扣欄與下限敘述，有則改寫 |
| 5 | 5.13 至 5.15 | 改寫：待審清單急單判準大於 0、排序不變 |
| 6 | 6.13 | 改寫：工單日期副本同步與標注 |
| 7 | 7.23、7.24、7.30 至 7.32 | 改寫：工單排程超期（含異動）、準時、任務超期 |
| 8 | 8.8 | 改寫：工單單據標注 |
| 9 | 9.7、9.11 | 改寫：派工畫面標注 |
| 11 | 11.7、11.22 | 改寫：品檢站標注判準 |
| 14 | 14.26 | 改寫：訂單列表（新增急件篩選） |
| 15 | 15.7、15.12、15.13、15.17 | 改寫：準時完工率比對值 |
| 新增 | 於相關章末新增 | 急件判準大於 0 與延後型不標；預計交期減 1 含跨週末與落週六；急件不影響日期；訂單急件標注與棄用後消失；對話框提示與不提示；轉交單與出貨單子列標注；既存缺陷兩項 |

mock 動到的位置：orders、work-orders、print-items、production-floor、quote-prototype 的 mock 資料（移除未扣欄）；MOCK-DATA-CHAIN.md。

- [x] 4.1 `docs/scenario-catalog.md`：上表各節改寫與新增，統計表重算
- [x] 4.2 Vitest 單元測試：`tests/unit/delivery-chain/`、`work-orders/rules-urgent-badge-print-item-only`、`print-items/rules-prepress-review-sort`、`qc-shipping/pending-inspections`、`data-consistency/rules-due-date-consistency` 更新；新增行為各至少一項，期望值取自 delta specs 的 THEN
- [x] 4.3 Playwright e2e：01-quote、04-order-print-item、05-prepress-review、06-work-order-draft（含 blank-due-date-chain）、08 print-sheet、09 dispatch-board 與 work-packages-view、11-qc、14-query-ui 更新
- [x] 4.4 `npm run impact` 對映影響；改哪章跑哪章；`npm run test:smoke` 通過；不主動跑全套

## 5. 驗收與合併

- [x] 5.1 實作交回後，主對話對照 prototype-from-prompt 與 delta specs 稽核
- [x] 5.2 畫面測試只由主對話跑一次，背景執行；測試期間不改 erp 檔
- [ ] 5.3 erp 提交訊息附測試結果；`prototype/rush-order-definition` 合併回 `prototype/production-stage`，刪除該分支與隔離工作副本
