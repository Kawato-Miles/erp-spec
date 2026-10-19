# Prototype 任務書：出貨單裝箱資料與物流單拆分

## 〇、先讀（缺一不可）

1. `/Users/b-f-03-029/erp-shipment-logistics/.claude/skills/prototype-from-prompt/SKILL.md`（設計規範唯一入口，照它的流程與禁止事項做；改既有頁沿用原 recipe 與元件）。
2. 設計方案：`/Users/b-f-03-029/Sens/.claude/worktrees/optimistic-nobel-9c65fb/memory/erp/plans/shipment-logistics-split-20261020/design.md`（行為正本；本任務書與設計衝突時以設計為準並回報）。
3. 句法：`/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`、`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`（程式內中文註解、介面文字、回報都照它，台灣繁中，禁 emoji）。
4. 載入 skill `andrej-karpathy-skills:karpathy-guidelines`（寫程式守則）。

## 一、工作位置與紀律

| 項目 | 內容 |
|---|---|
| erp 工作副本 | `/Users/b-f-03-029/erp-shipment-logistics`，分支 `prototype/shipment-logistics-split`（已建好，node_modules 已連結）。**不要動 `/Users/b-f-03-029/erp`**，其他工作階段在用 |
| 可改範圍 | 只能改 `apps/erp/src/app/(prototype)/`。共用元件、`packages/shared`、app 層檔案一律不碰；缺共用能力時停下回報 |
| 測試專案 | `/Users/b-f-03-029/Sens/.claude/worktrees/optimistic-nobel-9c65fb/erp-prototype-tests/`（node_modules 已連結）。erp repo 不加任何測試檔 |
| 跑測試 | 一律帶環境變數：`ERP_ROOT=/Users/b-f-03-029/erp-shipment-logistics DEV_PORT=3031`。3020 埠是別人的伺服器，不要用 |
| 提交 | erp 工作副本：完成後 commit 到 `prototype/shipment-logistics-split`，格式 `feat: 繁中描述`，結尾 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`；不要 push、不要開 PR。Sens 測試專案：只改檔、不 commit（主對話提交）。不要 `git add` 任何 `node_modules` 連結 |
| mock 順序 | 先改 `(prototype)/MOCK-DATA-CHAIN.md`，再改各模組 `mock-data.js`，最後改測試 |
| 範圍紀律 | 只做設計寫到的行為；介面便利功能（通知、自動帶文字）不做（G24） |

## 二、要做的事

### 1. 出貨方式與箱規（`qc-shipping/_lib/mock-data.js`）

- `SHIPPING_METHOD_OPTIONS` 改為：自取、專車配送、順豐、新竹物流、7-11 交貨便、全家、其他。刪除「超商」。
- 每個出貨方式帶兩個屬性：支援子母單、有外部物流單號（值見設計 § 三）。提供單一查詢函式，取代各處比字串；`isThirdPartyMethod` 改為讀「有外部物流單號」。
- 箱規改為依出貨方式分組：順豐、新竹物流、7-11 交貨便、全家各一組；自取、專車、其他共用公司自有箱規。箱規名稱貼近實際（例：順豐「標準箱 A」「標準箱 B」，7-11 交貨便依材積級距），寫在 mock 常數，附註「示意值，正本待物流商資料」。

### 2. 狀態

- 出貨單狀態：草稿、未處理、打包中、已裝箱、等待出貨、已出貨、運送中、異常、已送達、已作廢。「待出貨」改名「已裝箱」。
- 物流單狀態：已裝箱、等待出貨、已出貨、可自取、運送中、已送達、已自取、未送達、無追蹤中包裹、例外事故、已作廢。
- 出貨單在已裝箱之後的狀態由物流單計算（設計 § 六之一）：寫成一支純函式，store 與畫面都呼叫它；不要把計算結果另存一份。任一未作廢物流單在例外，出貨單即為異常（優先於所有其他計算結果）。
- 集合詞（設計 § 六之一）：未出貨動作、部分離廠、全數離廠，各寫一支判斷函式，取代現行「未離廠」判斷。

### 3. 資料結構（mock 欄位 snake_case）

- 出貨單：刪 `box_spec`、`packing_photos`、`tracking_no`、`shipped_at`、`shipped_by`、`delivered_at`、`delivered_by`、`delivery_proof`；`boxes` 改為計算值或刪除；新增 `packing_boxes[]` 與 `logistics_orders[]`。
- `packing_boxes[]`：`box_no`（三位數）、`box_spec`、`photos[]`、`note`、`logistics_order_no`、`sub_tracking_no`。
- `logistics_orders[]`：`logistics_order_no`（出貨單編號＋三位序號）、`status`、`tracking_no`、`label_file`、`dispatch_error`、`left_at`、`left_by`、`delivered_at`、`delivered_by`、`delivery_proof`、`exception_reason`、`exception_source`（manual／carrier）、`void_reason`、`undelivered[]`（`print_item_no`、`qty`）、`history[]`。
- 出貨明細 `details[]` 新增 `delivered_qty`（出貨單轉已送達時寫入）。
- 實際出貨日改為計算：全部未作廢物流單都有 `left_at` 時取最晚，否則無值。

### 4. store 動作（`qc-shipping/_lib/store.js`；action 命名對齊未來 API 動詞）

| 動作 | 行為（細節見設計 § 七） |
|---|---|
| 完成裝箱回報 | 逐明細揀貨數量、每箱幾個（沿用）；至少一箱；每箱箱規＋至少一張照片；依拆單規則產生物流單（支援子母單一筆、否則一箱一筆） |
| 裝箱回報修正 | 只在「未出貨動作」時可改：明細揀貨數量、每箱幾個、逐箱新增修改刪除（至少一箱）；執行過出貨動作後全部鎖住（含部分失敗）；修正原因必填；寫修正紀錄 |
| 出貨動作（批次，出貨單上） | 揀貨相符且訂單未取消才可；只處理仍在已裝箱的物流單。第三方＝拋單：系統模擬回傳物流單號、物流單檔案、子母單的子單號，轉等待出貨並寫 `left_at`。專車、其他＝出貨確認，轉已出貨。自取＝標記可自取，轉可自取。Prototype 要能模擬失敗（例：一個 mock 開關或特定箱規觸發），失敗者留在已裝箱並寫 `dispatch_error` |
| 單筆重試 | 物流單上，限已裝箱且有失敗原因，且訂單未取消 |
| 重新同步 | Prototype 模擬物流商回傳：依序推進 等待出貨 → 已出貨 → 運送中 → 已送達；例外狀態按一次回到已出貨 |
| 標記例外 | 等待出貨、已出貨、可自取、運送中；選三種例外之一；理由必填；來源記 manual |
| 送達確認、交付確認 | 依設計 § 七開放時點；附憑證；各出貨方式都可選填逐印件未送達數量 |
| 作廢物流單 | 業務；開放狀態依設計 § 六之二；理由必填；逐印件未送達數量（非最後一筆預設 0；最後一筆系統預填＝明細數量 − 已填合計且不可改，並把出貨單轉已作廢）；上限＝明細數量 |
| 作廢出貨單 | 「未出貨動作」才可；底下物流單一併作廢 |
| 編輯出貨單 | 「未出貨動作」才可（沿用現行）；明細數量不得小於本單該印件未送達合計 |
| 訂單取消連鎖 | 未出貨動作的出貨單系統作廢（含物流單）；部分離廠者擋下出貨動作與重試、已裝箱物流單留給業務作廢；全數離廠者不動 |

### 5. 額度與送達量

改寫 `calcShippableQty`、品檢修正通過下限（改取累計已出貨數量，異常出貨單仍佔用）、`calcShippedQty`、`occupiedDetailsOf` 等，以及 `print-items/_lib/detail-selectors.js` 的 `sumShippedQty`、`sumDeliveredQty`、`orders/_lib/store.js` 的 `isPrintItemDelivered`，全部照設計 § 八之一的定義。口徑只寫在一支共用純函式，其他地方呼叫它。

### 6. 介面（G28）

- 沿用出貨單既有對話框，不新增側板。
- 完成裝箱回報對話框：在既有逐條明細表格下方加「裝箱明細」表格，比照 `print-items/_components/AssignWorkOrdersDialog.js` 的可加列表格寫法（AntD `Table bordered size="small" pagination={false}`，列可移除）。欄位：箱序、箱規（下拉，只列本出貨方式）、照片（上傳，至少一張）、備註。提供「一次新增多箱」：輸入箱數、選箱規、上傳共用照片，產生多列（D20）。
- 出貨單對話框（`ShipmentDetailDialog`）：加「裝箱明細」與「物流單」兩個表格。物流單表格直接呈現欄位，不做側板：物流單編號、物流單號、箱數（子母單列出子單號）、狀態、離廠時間、送達時間、失敗原因或例外理由、操作。操作用 icon 按鈕（沿用列表 icon 化慣例），依狀態只顯示可用動作。
- 出貨單層的出貨動作按鈕依出貨方式顯示名稱：拋單、出貨確認、標記可自取。
- 出貨單層「下載全部物流單」。
- 狀態標籤：出貨單與物流單各自的狀態色，放在 `StatusTag` 既有機制內。

### 7. mock 資料（G27：以順豐與自取為主）

- 改 `MOCK-DATA-CHAIN.md` 再改 mock。鏈一（ORD-2026-0601）的兩張出貨單：一張改順豐多箱（例 5 箱、1 筆物流單、5 個子單號、已送達），一張改自取（例 2 箱、1 筆物流單、已自取）。保持鏈一數量驗算成立。
- 另需能在畫面上走到：順豐已裝箱待拋單、順豐異常（例外事故）、自取可自取等待交付各一張樣本。可沿用鏈四或新增樣本；新增時編號、關聯都用業務格式，並寫進 MOCK-DATA-CHAIN。
- 其他出貨方式不必有 mock，但選單要可選、拆單規則要可運作。

## 三、測試影響清單（依 `erp-prototype-tests/docs/scenario-catalog.md` 節號）

| 類型 | 項目 |
|---|---|
| 要改的既有單元測試 | `tests/unit/qc-shipping/` 的 next-status-options、shipment-access、shipment-draft、shipment-proof-access、shipment-terminal、shippable-quota、shipping-rules；`tests/unit/orders/shipment-advance`；`tests/unit/print-items/rules-shipment-stats`；`tests/unit/delivery-chain/shipment-on-time` |
| 要改的既有畫面測試 | `tests/e2e/12-shipping/shipping.spec.mjs`（12.3～12.7、12.19～12.25 受影響）、`access-scope.spec.mjs`、`tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs`；共用工具 `tests/e2e/11-qc/_setup.mjs` 的 `pickAndPack`、`fillPackingLines` |
| 要新增的情境（情境目錄第十二章新節，含「依據」設計段落） | 拆單規則（順豐一筆＋子單號、7-11 一箱一筆）；出貨單狀態取最落後；任一物流單例外出貨單轉異常、重新同步後恢復；作廢物流單回補（含最後一筆系統預填與出貨單轉已作廢、不重複回補）；自取部分交付填未送達；部分出貨動作失敗後重試；裝箱至少一箱與每箱照片必填；一次新增多箱 |
| mock 動到 | `MOCK-DATA-CHAIN.md` 鏈一出貨段、`qc-shipping/_lib/mock-data.js` |

## 四、跑測試（G26：不跑全套）

在測試專案目錄依序跑，全部帶 `ERP_ROOT=/Users/b-f-03-029/erp-shipment-logistics DEV_PORT=3031`：

1. `npm run impact`（記下輸出）。
2. `npx vitest run tests/unit/qc-shipping tests/unit/orders/shipment-advance.test.mjs tests/unit/print-items/rules-shipment-stats.test.mjs tests/unit/delivery-chain/shipment-on-time.test.mjs`
3. `npm run test:smoke`
4. `npx playwright test tests/e2e/12-shipping tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs`

成功條件：2、3、4 全部通過。失敗時修到通過；改不動的寫進回報。

## 五、回報格式

1. erp commit 雜湊與訊息。
2. 改了哪些檔（erp 與測試專案分開列）。
3. 四個測試指令的結果（通過數／失敗數；impact 輸出摘要）。
4. 自我稽核：對照 prototype-from-prompt skill 必守規則逐條勾選；grep 手寫 hex、px、`!important`、`createGlobalStyle` 的結果。
5. 設計中做不到、或你自行判斷的地方，逐條列出。
