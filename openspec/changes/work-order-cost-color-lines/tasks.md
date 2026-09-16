## 0. 實作範圍宣告（動工前必讀）

- 實作範圍為 erp repo `/Users/b-f-03-029/erp` 的 `apps/erp/src/app/(prototype)/`。
- 實作 MUST 經 repo 內 skill `prototype-from-prompt`（設計規範唯一入口）。
- 只動 `(prototype)/` 目錄。共用元件與 app 層檔案一律不碰；發現缺口寫根因與修法交前端主管，不自行改。
- erp repo 不加任何測試檔。測試一律寫在 Sens repo 的 `erp-prototype-tests/`。
- 不動 erp repo 的 skill 檔，也不動 `(prototype)/README.md`。
- mock 欄位命名一律 snake_case。
- 顏色欄的鍵固定為 `single_black`、`cmyk`、`pantone`、`metallic`、`metal_only`。
- 錨例驗收值：工單 WO-2026-0820 的預估成本合計為 43,009；延伸例（該工單封面書腰合印任務加登記 Pantone 一色）為 43,503。

## 1. mock 主鏈文件先行

- [ ] 1.1 改 `(prototype)/MOCK-DATA-CHAIN.md`：預估成本欄結構由材料費、工序費、裝訂費、設備費四欄改為 `{ subtotal, colors: { single_black, cmyk, pantone, metallic, metal_only } }`；文件內成本口徑敘述同步改為任務小計（不含顏色）與顏色費用：單黑、CMYK、Pantone、金屬色（合印）、獨立印
- [ ] 1.2 依設計 § 六重算鏈一 WO-2026-0820 的錨例值並寫入主鏈文件：任務小計（不含顏色）依序為 4,741／5,054／1,421／1,186／3,677／1,591／281／278／23,000，顏色費用：單黑 260、顏色費用：CMYK 1,520，其餘顏色為 0，合計 43,009
- [ ] 1.3 驗算並於主鏈文件註記：書芯印刷任務的任務小計 5,054＝工序費 1,854＋開機費 3,200；封面書腰合印任務的任務小計 3,677＝工序費 477＋開機費 3,200

## 2. 測試先行（紅在綠前，先落地失敗測試）

> 期望值取自本 change 的差異規格情境描述，MUST NOT 由實作重算。本節在第 3 節之前完成。

- [ ] 2.1 在 Sens `erp-prototype-tests/` 改寫實際成本規則測試：`tests/unit/production-floor/rules-actual-cost-four-parts.test.mjs` 更名為 `rules-actual-cost-subtotal-colors.test.mjs`，期望值改為任務實際小計（不含顏色）與各顏色費用實際值；覆蓋差異規格 work-order § 工單成本對照的「顏色費用的實際值只取階梯價」
- [ ] 2.2 改寫 `tests/unit/production-floor/rules-metrics-cost-consistency.test.mjs`：成本達成率取數改為預估成本合計與實際成本合計
- [ ] 2.3 改寫 `tests/unit/work-orders/process-planning.test.mjs`：預估成本輸出結構改為小計加顏色群，覆蓋「存檔時凍結任務小計與各顏色費用」與「大圖任務的設備側金額全進任務小計」
- [ ] 2.4 新增純函式情境：顏色費用：單黑、CMYK、Pantone、金屬色（合印）、獨立印的列固定產生，未登記者為 0；任務小計不含任何顏色貢獻
- [ ] 2.5 新增純函式情境：延伸例——封面書腰合印任務加登記 Pantone 一色，顏色費用：Pantone 為 494（380 × 1.3），該任務小計仍為 3,677，工單合計為 43,503
- [ ] 2.6 改寫畫面測試 `tests/e2e/07-process-planning/process-tab.spec.mjs` 與 `task-form.spec.mjs`：預估成本欄改讀任務小計（不含顏色）
- [ ] 2.7 改寫畫面測試 `tests/e2e/08-process-review-deliver/process-review.spec.mjs`：待審核工單列表母表列新增顏色費用合計與預估成本合計
- [ ] 2.8 改寫畫面測試 `tests/e2e/14-query-ui/work-orders.spec.mjs`：工單成本呈現的列結構改為任務列加顏色列加合計列
- [ ] 2.9 新增畫面情境：成本對照頁籤的顏色列同時呈現預估、實際與升降；預估與實際皆為 0 的顏色列升降留空
- [ ] 2.10 改寫 `docs/scenario-catalog.md` 的 7.8 節與其他受影響節，補上新增情境的節號

## 3. 預估與實際成本計算模組

- [ ] 3.1 改 `(prototype)/work-orders/_lib/estimate-cost.js`：輸出結構改為 `{ subtotal, colors: { ... } }`，開機費併入 `subtotal`、各色貢獻依色別進 `colors`
- [ ] 3.2 改 `(prototype)/production-floor/_lib/actual-cost.js`：輸出結構同上；實際側的顏色值只取階梯價、不含開機費；數量取有效報工的生產數量累計
- [ ] 3.3 兩模組皆讓大圖與非印刷任務的顏色群回傳全 0，不回傳 undefined

## 4. 工單層彙總

- [ ] 4.1 改 `(prototype)/work-orders/_lib/store.js`：工單層彙總改為各生產任務的 `subtotal` 逐筆保留，顏色依色別跨任務加總，合計取兩者相加
- [ ] 4.2 彙總排除已作廢生產任務，保留已報廢生產任務（成本留、數量除）
- [ ] 4.3 依數量比例縮放的邏輯改為同時縮放 `subtotal` 與 `colors` 各鍵，取整以列為單位

## 5. 工單詳情成本頁籤

- [ ] 5.1 改工單詳情預估成本頁籤（`EstimateTab`）：頁籤名由「預估成本分項」改為「預估成本」；列結構改為各生產任務一列、顏色費用五列、合計列；欄為成本項目與小計
- [ ] 5.2 改工單詳情成本對照頁籤（`CostCompareTab`）：列結構同上；欄為成本項目、預估、實際、升降；預估與實際皆為 0 的列升降留空

## 6. 其他畫面

- [ ] 6.1 改工單詳情生產任務列表（`ProductionTasksTable`）：預估成本欄改顯示任務小計（不含顏色）
- [ ] 6.2 改待審核工單列表母表列：新增顏色費用合計與預估成本合計兩格；子表任務列的預估成本欄改顯示任務小計（不含顏色）
- [ ] 6.3 改工單詳情統計卡：新增顏色費用合計一格，版位依 prototype 版面決定

## 7. 自檢腳本與各模組 mock 資料

- [ ] 7.1 改 `(prototype)/work-orders/__checks__/color-costing.check.mjs`：期望值改為新結構，含錨例 43,009 與延伸例 43,503
- [ ] 7.2 依 `MOCK-DATA-CHAIN.md` 重算各模組 `mock-data.js` 的預估成本欄，改為新結構
- [ ] 7.3 檢查引用預估成本的其他模組 mock（印件詳情、生產現場、工廠總覽）欄位形狀一致

## 8. 測試影響清單（依 `erp-prototype-tests/docs/scenario-catalog.md` 節號）

### 8.1 既有測試要改

| 測試檔 | 改什麼 |
|---|---|
| `tests/unit/production-floor/rules-actual-cost-four-parts.test.mjs` | 檔名改為 `rules-actual-cost-subtotal-colors.test.mjs`，期望值改任務實際小計（不含顏色）與各顏色費用實際值 |
| `tests/unit/production-floor/rules-metrics-cost-consistency.test.mjs` | 成本達成率取數改預估成本合計與實際成本合計 |
| `tests/unit/work-orders/process-planning.test.mjs` | 預估成本輸出結構改小計加顏色群 |
| `tests/e2e/07-process-planning/process-tab.spec.mjs` | 預估成本欄改讀任務小計（不含顏色）|
| `tests/e2e/07-process-planning/task-form.spec.mjs` | 任務表單存檔後的成本斷言改新結構 |
| `tests/e2e/08-process-review-deliver/process-review.spec.mjs` | 待審核母表列新增顏色費用合計與預估成本合計 |
| `tests/e2e/14-query-ui/work-orders.spec.mjs` | 工單成本列結構改任務列加顏色列加合計列 |

### 8.2 新增情境

| 情境 | 落點 |
|---|---|
| 顏色費用：單黑、CMYK、Pantone、金屬色（合印）、獨立印的列固定顯示，未登記者為 0 | 純函式與畫面各一 |
| 任務小計（不含顏色）不含任何顏色貢獻 | 純函式 |
| 成本對照頁籤的顏色列呈現預估、實際與升降 | 畫面 |
| 延伸例：加登記 Pantone 一色，顏色費用：Pantone 為 494、合計 43,503 | 純函式 |

### 8.3 mock 動哪裡

- `(prototype)/MOCK-DATA-CHAIN.md`（先改）
- `(prototype)/work-orders/_lib/mock-data.js`（後改）
- 其他引用預估成本欄的模組 mock 資料檔

### 8.4 情境目錄改寫

- `docs/scenario-catalog.md` 第 7.8 節改寫為新的成本列結構；新增情境依節號補入相關節

### 8.5 執行順序

- [ ] 8.5.1 改動後先跑影響對映：`npm run impact`
- [ ] 8.5.2 再跑冒煙測試：`npm run test:smoke`
- [ ] 8.5.3 改哪章跑哪章：`npm run test:module -- tests/e2e/<章>`
- [ ] 8.5.4 提交前跑全套：`npm test`

## 9. 主對話稽核（sub-agent 交回後自行核對，不採信自述）

- [ ] 9.1 在 erp repo 的 `(prototype)/` 範圍執行 `grep -rn "#[0-9a-fA-F]\{3,6\}"` 檢查是否有寫死色碼，命中須改用設計系統變數
- [ ] 9.2 執行 `grep -rn "px"` 檢查是否有寫死像素值，命中須改用設計系統間距
- [ ] 9.3 執行 `grep -rn "!important"` 與 `grep -rn "createGlobalStyle"`，命中須說明理由或改寫
- [ ] 9.4 確認本次未新增共用元件、未改動 `(prototype)/` 以外檔案：`git diff --name-only` 全部落在 `(prototype)/` 內
- [ ] 9.5 錨例核對：工單 WO-2026-0820 的預估成本合計為 43,009；加登記 Pantone 一色後為 43,503
- [ ] 9.6 差異規格檢查：`grep -rn "四分項" openspec/changes/work-order-cost-color-lines/specs/` 命中數為 0
