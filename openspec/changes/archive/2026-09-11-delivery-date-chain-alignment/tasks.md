## 1. OpenSpec 收尾

- [x] 1.1 確認四份 delta spec（order-management、quote-request、work-order、prepress-review）已通過 `openspec validate --changes`，且 `openspec status` 顯示 proposal / design / specs 三項為 done。
- [x] 1.2 待 Prototype 與測試施工完成、Miles 確認後執行 `openspec archive`，delta 併回四份 main spec。

## 2. Prototype：需求單模組（quote-prototype）

> 對應 spec：quote-request § 印件項目管理、§ 成交轉訂單。

- [x] 2.1（測試先行）於 Sens `erp-prototype-tests` 新增情境「需求單單頭訂單交期預填至各印件項目、業務逐列可改」，比對 scenario-catalog 一、需求單 章節（緊鄰 1.1）；期望值取自 quote-request delta § 印件項目管理 Scenario「單頭訂單交期預填至印件項目」「業務逐列改寫印件項目訂單交期」。
- [x] 2.2 修改 `(prototype)/quote-prototype/mock-data.js` 與 `_lib/pricing.js` 或對應欄位模組：需求單單頭「客戶期望交期」欄改名「訂單交期」；印件項目新增「訂單交期」欄（選填，建立當下預填單頭值，業務可逐列改寫或清空）。
- [x] 2.3（測試先行）新增情境「成交轉訂單時印件項目訂單交期分層帶入、空值不取單頭補」，對應 quote-request delta § 成交轉訂單 Scenario。
- [x] 2.4 修改成交轉訂單邏輯（`_lib/transitions.js` 或對應轉單函式）：單頭訂單交期帶入訂單單頭；各印件項目訂單交期逐件帶入對應印件，空值維持空值、不取單頭回補。
- [x] 2.5 跑 `npm run test:smoke`，確認需求單主流程未斷；跑一、需求單章節既有測試全過。

## 3. Prototype：訂單模組——印件交期欄位與推導

> 對應 spec：order-management § 印件預計交期推導、§ 印件急件選項、§ 印件急件選項與訂單交期變更留痕與同步、§ 新增印件欄位與必填檢核、§ 內部製作截止日定義。核心邏輯檔：`(prototype)/orders/_lib/urgent-due-date.js`、`_lib/urgent-option-mock.js`。

- [x] 3.1（測試先行）改寫 scenario-catalog 四、訂單成立與印件 章節 4.5「業務在印件上選急件選項，系統推出扣除急件後的交期」：起點資料與期望值改用印件自身訂單交期（不再取訂單 `deadline`）、算式多減一天；比對 order-management delta § 印件預計交期推導 Scenario。
- [x] 3.2 修改 `urgent-due-date.js`：`deriveDueDateExUrgent(order, item)` 改為 `derivePlannedDueDate(item)`，改讀印件自身的訂單交期欄位（新增 `item.order_due_date`），算式改為 `order_due_date − 1 − urgentDaysOf(item)`；訂單交期為空時回傳 `null`。同步更新函式內註解與 openspec 引用（改指向 § 印件預計交期推導）。
- [x] 3.3 修改 `(prototype)/orders/mock-data.js`：每筆印件新增 `order_due_date` 欄位（依錨例：鏈四 PI-2026-0820 訂單交期 2026-09-05、鏈其他印件依各自案例填值或留空以覆蓋空值情境）；訂單層 `deadline` 欄位改名 `order_due_date`（訂單單頭語意，不與印件層混淆——欄位名可維持 `deadline` 由前端另行決定，此處僅記錄欄位語意需求，避免同名衝突）。
- [x] 3.4（測試先行）改寫 scenario-catalog 4.6「改急件要通知排單的印務，工單交期跟著改」為「改急件選項或印件訂單交期只留痕與同步，不通知」：移除通知鈴、通知訊息的期望斷言，改斷言活動紀錄留痕與工單預計交期同步；比對 order-management delta § 印件急件選項與訂單交期變更留痕與同步 Scenario。
- [x] 3.5 修改印件編輯面板的急件選項變更與訂單交期變更處理邏輯（`orders/_lib/store.js` 或印件編輯 action）：移除通知派發呼叫，保留活動紀錄寫入與 `applyPrintItemDueDate` 同步呼叫（見任務 5.2）。
- [x] 3.6（測試先行）改寫 scenario-catalog 4.7「訂單的『是否急件』只是注記」為「印件訂單交期各自獨立，訂單訂單交期編輯不觸發印件同步」：起點資料改用鏈四訂單（訂單交期已改名）與旗下兩件不同訂單交期的印件；期望值斷言業務改訂單單頭訂單交期後，旗下印件的訂單交期與預計交期皆不變；比對 order-management delta § 訂單階段印件規格編輯時機、wiki 訂單資訊分區編輯情境卡。
- [x] 3.7 移除訂單層 `is_urgent` 欄位與其在 UI 上的注記顯示（`orders/_lib/urgent-option-mock.js` 若有引用一併清理）；訂單資訊分區編輯 Dialog 移除「是否急件」欄位，新增「訂單交期」「內部製作截止日」兩欄位的編輯入口，訂單交期欄位不觸發任何印件同步。
- [x] 3.8（測試先行）新增情境「印件已棄用後訂單交期唯讀」「訂單完成後印件訂單交期唯讀」，比對 order-management delta 對應 Scenario。
- [x] 3.9 印件編輯面板加入印製維度「已棄用」時訂單交期欄位唯讀的把關；訂單完成/已取消時沿用既有終態唯讀邏輯納入訂單交期欄位。
- [x] 3.10（測試先行）新增情境「內部製作截止日與印件預計交期不設比對關係」，比對 order-management delta § 內部製作截止日定義 Scenario「印件預計交期晚於內部製作截止日不受檢查」。
- [x] 3.11 移除既有「工單預計完工日/預計交期不晚於內部製作截止日」的任何比對或警示邏輯（如有）。

## 4. Prototype：訂單模組——新增印件與複製加開印件 Dialog

> 對應 spec：order-management § 新增印件欄位與必填檢核、§ 加開印件（複製原印件規格）。核心元件：`(prototype)/print-items/_components/AssignWorkOrdersDialog.js` 或訂單詳情頁印件清單的新增/加開入口元件（依現況命名於施工時確認）。

- [x] 4.1（測試先行）新增情境「新增印件收齊七項必填、訂單交期選填並預設帶入訂單訂單交期」，比對 order-management delta § 新增印件欄位與必填檢核 Scenario。
- [x] 4.2 新增印件 Dialog：七項必填（印件名稱、生產類型、購買數量、單位、單價、急件選項、難易度）存檔把關；訂單交期欄位選填、預設帶入所屬訂單的訂單交期；八項選填欄位（訂單交期、規格備註、出貨方式、包裝備註、預計產線、免審稿、稿件備註、印件配方）齊備。
- [x] 4.3（測試先行）改寫既有「複製既有印件加開」情境（scenario-catalog 四章相關列點，或新增於同章）：斷言購買數量與訂單交期留空、其餘規格側欄位（含新增的包裝備註）帶入原印件值。
- [x] 4.4 複製加開 Dialog：規格側欄位預填（含新增的包裝備註、稿件備註兩欄位分開預填，不再合併為「包裝與檔案說明」一欄）；購買數量與訂單交期留空、皆為必填/選填依 spec（購買數量必填、訂單交期選填）。

## 5. Prototype：工單模組

> 對應 spec：work-order § 工單排程日期、§ 工單列印單據、§ 工單與生產任務的急件標示。核心邏輯檔：`(prototype)/work-orders/_lib/due-date-sync.js`、`print/page.js`。

- [x] 5.1（測試先行）改寫 scenario-catalog 8.8「急件工單的紙本標示與交期」：期望值改用印件「預計交期」（多減一天）；新增「無值時印－」斷言；比對 work-order delta § 工單列印單據 Scenario「工單交期為空時印據表頭印「－」」。
- [x] 5.2 修改 `due-date-sync.js`：`applyPrintItemDueDate` 的呼叫來源改接任務 3.2 的 `derivePlannedDueDate` 輸出；印件推導值為 `null` 時，非終態工單的 `delivery_date` 同步為 `null`（原判斷 `if (!dueDate) return workOrders` 需改為允許把 `null` 寫入非終態工單，而非整批跳過）。
- [x] 5.3 修改 `print/page.js` 表頭渲染：交期欄位無值時顯示「－」，不留空白或報錯。
- [x] 5.4（測試先行）改寫 scenario-catalog 15.7「訂單、印件、工單三處交期一致」為「印件與工單的預計交期一致；訂單層訂單交期是另一個獨立數字」：拆分斷言為（a）印件預計交期＝工單預計交期（b）訂單訂單交期與印件預計交期允許不同、系統不比對。
- [x] 5.5 確認工單詳情頁與生產任務管理頁（9.7 相關）的「印件預計交期」欄位取數邏輯與任務 3.2 輸出對齊，值同步更新。
- [x] 5.6（測試先行）新增情境「工單急件標示不再引用訂單是否急件」：斷言標示邏輯只讀印件急件選項，訂單層無 `is_urgent` 欄位可讀。
- [x] 5.7 確認 `isUrgentPrintItem` 等急件標示函式（已只讀印件層，見 `urgent-due-date.js` 現況）不需修改；補上一筆迴歸測試防止未來又接回訂單層欄位。

## 6. Prototype：審稿模組

> 對應 spec：prepress-review § 審稿訂單脈絡查詢視圖、§ 待審清單排序與停滯規則。核心元件：`(prototype)/prepress-review/_lib/selectors.js`、`ReviewOrderList.js`。

- [x] 6.1（測試先行）新增情境「待審清單依印件預計交期近者優先排序，空值排在有值之後」，比對 prepress-review delta § 待審清單排序與停滯規則 Scenario。
- [x] 6.2 修改 `prepress-review/_lib/selectors.js` 的排序鍵：由訂單 `deadline` 改為印件「預計交期」（讀任務 3.2 的輸出欄位），空值以自訂比較函式排到最後、同組依印件編號排序。
- [x] 6.3（測試先行）新增情境「待審訂單模組母列顯示訂單交期、子列訂單交期與預計交期並列」，比對 prepress-review delta § 審稿訂單脈絡查詢視圖 Scenario。
- [x] 6.4 修改 `ReviewOrderList.js`：母列顯示欄改為訂單交期（讀訂單層新欄位）；子列印件交期欄改為「訂單交期」與「預計交期」並列兩欄，移除原自創的單一「印件交期」欄名。
- [x] 6.5（測試先行）確認急單標示情境維持「取印件急件選項」不變，補一筆迴歸測試防止誤讀訂單層欄位（訂單層 `is_urgent` 已移除）。

## 7. Mock 資料鏈同步

> 依 CLAUDE.md 規範：先改 `MOCK-DATA-CHAIN.md`，再改各模組 `mock-data.js`，最後跑測試。

- [x] 7.1 更新 `(prototype)/MOCK-DATA-CHAIN.md`：新增印件層選填 `order_due_date` 欄位說明——各印件的訂單交期一律鏡射所屬訂單的訂單交期，鏈六 PI-2026-0903 刻意留空覆蓋「印件訂單交期未談定」情境，預計交期同為空。鏈四 ORD-2026-0820 只有精裝書一件印件（PI-2026-0820），其 `order_due_date` 鏡射訂單交期 2026-09-10，推導預計交期 2026-09-06（訂單交期 − 1 天 − 三天急件凍結天數 3）。
- [x] 7.2 印件層 `order_due_date`（訂單交期）與 `packaging_notes`（包裝備註）兩欄位已隨任務 3.3 一併加入 `orders/mock-data.js`；訂單層 `is_urgent` 已隨任務 3.7 移除（全庫已無殘留）。工單與印件模組的包裝備註即時自訂單印件查表（讀 `orderItem.packaging_notes`，見 `print-items/_components/detail/PrintItemInfoPanels.js`），不在 `work-orders/_lib/mock-data.js`、`print-items/_lib/mock-data.js` 設欄位副本。
- [x] 7.3 跑 `npm run test:smoke`，確認主鏈（需求單成交轉訂單 → 印件審稿 → 工單建立 → 報工 → 出貨）在新交期模型下不斷。

## 8. 測試影響清單（Sens erp-prototype-tests）

> 依 `erp-prototype-tests/docs/scenario-catalog.md` 節號列出改動範圍；改哪章跑哪章，提交前跑全套。

**既有情境需修改**：

| 節號 | 情境 | 修改內容 |
|------|------|---------|
| 一、需求單 1.1 | 業務建需求單、逐筆填印件項目後送印務評估 | 欄位詞由「預計交期」改「訂單交期」（單頭與印件項目兩處） |
| 二、訂單成立與維護 2.4 | 比價期間直接改印件單價、重出報價單 | 「加開…數量與交期要重填」改為「數量必填、訂單交期選填」 |
| 四、訂單成立與印件 4.5 | 業務在印件上選急件選項，系統推出扣除急件後的交期 | 起點改印件自身訂單交期、算式多減一天，欄名改「預計交期」 |
| 四、訂單成立與印件 4.6 | 改急件要通知排單的印務，工單交期跟著改 | 改為「只留痕與同步、不通知」，移除通知鈴與通知訊息斷言 |
| 四、訂單成立與印件 4.7 | 訂單的「是否急件」只是注記，不參與交期計算 | 整條情境改寫為「印件訂單交期各自獨立，訂單訂單交期編輯不觸發印件同步」（是否急件欄位已刪除） |
| 八、製程審核與交付產線 8.8 | 急件工單的紙本標示與交期 | 交期欄取印件「預計交期」（多減一天）、補無值印「－」 |
| 九、生管接收與派工 9.7 | 工廠總覽待排區顯示印件預計交期 | 確認取數欄位對齊任務 3.2 輸出，數值隨錨例更新 |
| 十五、跨模組一致性 15.7 | 訂單、印件、工單三處交期一致 | 拆分為「印件與工單預計交期一致」「訂單訂單交期與印件預計交期允許不同」兩條斷言 |

**新增情境**：

| 章節 | 新增情境 | 對應 spec Scenario |
|------|---------|---------------------|
| 一、需求單 | 單頭訂單交期預填印件項目、業務逐列可改 | quote-request § 印件項目管理 |
| 一、需求單 | 成交轉訂單印件項目訂單交期分層帶入、空值不取單頭補 | quote-request § 成交轉訂單 |
| 四、訂單成立與印件 | 新增印件收齊七項必填、訂單交期選填並預設帶入訂單訂單交期 | order-management § 新增印件欄位與必填檢核 |
| 四、訂單成立與印件 | 複製加開印件購買數量與訂單交期留空、規格側欄位帶入 | order-management § 加開印件（複製原印件規格）|
| 四、訂單成立與印件 | 印件已棄用後訂單交期唯讀；訂單完成後印件訂單交期唯讀 | order-management § 訂單階段印件規格編輯時機 |
| 四、訂單成立與印件 | 內部製作截止日與印件預計交期不設比對關係 | order-management § 內部製作截止日定義 |
| 五、審稿 | 待審清單依印件預計交期排序、空值排最後 | prepress-review § 待審清單排序與停滯規則 |
| 五、審稿 | 待審訂單模組母列訂單交期、子列訂單交期與預計交期並列 | prepress-review § 審稿訂單脈絡查詢視圖 |

**Mock 異動範圍**：`MOCK-DATA-CHAIN.md`（先改）→ `quote-prototype/mock-data.js`、`orders/mock-data.js`、`work-orders/_lib/mock-data.js`、`print-items/_lib/mock-data.js`（後改）。新增欄位：印件層 `order_due_date`（訂單交期）、`packaging_note`（包裝備註）；移除欄位：訂單層 `is_urgent`。

**測試執行順序**：`npm run test:smoke` → 改動章節（一、二、四、五、八、九、十五）→ 提交前跑全套。

## 9. Linear 另案追蹤（不在本 change 施工範圍，僅記錄）

- [x] 9.1 記錄後端落差三條供另案 Linear 票：印件建立 API 不收印件類型與急件選項；訂單 `is_urgent` 欄位後端廢除；審稿前後預計出貨日兩欄與訂單更新可改清單的落差。
- [x] 9.2 記錄 OQ ORD-050（印件層交期成為承諾正本後訂單準時交貨率取數層級）為待拍板事項，不在本 change 處理。
