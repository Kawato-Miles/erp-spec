> 實作範圍：erp repo Prototype（`/Users/b-f-03-029/erp`），自現行 prototype 主線開分支 `prototype/wo-qty-color-costing`，完成後依現行工作模式併入。
> 檔案路徑一律相對於 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`。
> repo 內無自動化測試框架，情境覆蓋以「純函式驗算腳本（node 執行、assert 期望值）」落地，放在各模組的 `_lib/__checks__/`；期望值取自 delta spec 各 Scenario 的 THEN 描述，MUST NOT 由實作回算。
> 每個群組的第一項為驗算腳本（先失敗），其後才是實作。

## 1. 分支與驗算骨架

- [ ] 1.1 （不執行，見執行註記 A）自現行 prototype 主線建分支 `prototype/wo-qty-color-costing`。完成條件：`git branch --show-current` 輸出 `prototype/wo-qty-color-costing`。
- [x] 1.2 建立四支驗算腳本骨架並掛進既有 `module-loader.mjs` 載入方式：`work-orders/_lib/__checks__/target-qty.check.mjs`、`work-orders/_lib/__checks__/color-costing.check.mjs`、`production-floor/_lib/__checks__/completion-rules.check.mjs`、`production-floor/_lib/__checks__/report-threshold.check.mjs`。完成條件：四支皆可 `node` 執行、各印出 `0/0 passed` 且 exit code 0。

## 2. 主檔 mock 補欄與參數正名

- [x] 2.1 驗算腳本 `color-costing.check.mjs` 補三個案例（對應 process-master delta 三個 Scenario）：(a) 工序項目具「是否印刷類工序」欄且預設否 (b) 標為是的工序仍有計價方法與價格表 (c) 主檔項目清單中不存在計價方法值「依設備計價」。完成條件：`node` 執行後三案例全部失敗。
- [x] 2.2 `work-orders/_lib/bom-master-mock.js` 工序項目補 `is_printing_process` 欄（預設 false），三筆印刷工序標 true；同檔三筆 `pricing_method: '依設備計價'` 改為既有計價方法（印刷工序配 0 元價格表），檔頭註解同步改寫。完成條件：`grep -n "依設備計價" apps/erp/src/app/\(prototype\)/work-orders/_lib/bom-master-mock.js` 無輸出；2.1 三案例通過。
- [x] 2.3 （範圍依 delta spec 收斂，見執行註記 B）同檔外發工序項目（工序廠商為協力廠、外包廠、中國廠商）的 `default_spoilage_rate` 一律改為 0。完成條件：腳本逐筆檢查外發工序放損率皆為 0，輸出 0 筆例外。
- [x] 2.4 （欄位不存在故改為新增，見執行註記 C）同檔設備項目的 `metallic_min_colors` 更名為 `metal_only_multiplier`（獨立印倍率），三顆倍率欄補註解標明僅平版適用；數位設備補「特殊色」面價欄、移除倍率依賴。完成條件：`grep -rn "metallic_min_colors" apps/erp/src/app/\(prototype\)/` 無輸出。

## 3. 目標數量預設引擎與放損率欄

- [x] 3.1 驗算腳本 `target-qty.check.mjs` 補七個案例（對應 work-order delta 「生產任務目標數量預設與放損率」七個 Scenario）：(a) 印刷 3%／裁切 2%、工單目標 1,000 → 裁切 1,020、印刷 1,051 (b) 每份工單需生產數量 4 → 末端需求 4,000 (c) 外發放損率 0 → 目標等於下游需收 1,020 (d) 首道工序目標 1,051、一張開 21 模、開機損 20 → 材料任務 71 張 (e) 工序主檔 3% 帶入、任務改 8% 後目標重算且主檔不變 (f) 材料型與裝訂型任務放損率為 0 (g) 手改後的目標數量不被預設值覆寫。完成條件：`node` 執行後七案例全部失敗。
- [x] 3.2 新建 `work-orders/_lib/target-qty.js`：實作沿工序相依鏈自末端倒推的預設值計算（場內與外發同一公式、下行無條件進位）、材料型任務公式（首道場內工序目標 × 用量倍率，進位後加設備固定開機損）、末端需求（工單目標 × 每份工單需生產數量，允許小數）。完成條件：3.1 案例 (a)(b)(c)(d) 通過。
- [x] 3.3 `work-orders/_components/detail/TaskFormDialog.js` 的目標數量欄改為帶預設值可改：新增任務時以 3.2 的計算帶入、印務手改後標記為已覆寫且不再被重算覆寫；放損率欄維持主檔帶入並開放任務層調整（材料型與裝訂型帶 0）。完成條件：3.1 案例 (e)(f)(g) 通過；開啟工單詳情新增生產任務時目標數量已預填、改動後重開對話框保留手改值。
- [x] 3.4 `work-orders/_lib/store.js` 與 `recipes/_lib/store.js` 的任務建立路徑改呼叫 3.2 的同一支計算（配方展開與手動路徑共用），對應 recipe-expansion delta 四個 Scenario。完成條件：`grep -n "target_set_qty \* draft.qty_per_set" apps/erp/src/app/\(prototype\)/recipes/_lib/store.js` 無輸出；`target-qty.check.mjs` 補配方展開四案例（含外發展開目標等於下游需收）後全部通過。
- [x] 3.5 （改以手填標記收斂，見執行註記 D）既有 mock 工單的生產任務目標數量依新公式全量重算，檔頭註解記明重算口徑（投入計畫、場內含放損）。完成條件：比對腳本逐筆重算 `work-orders/_lib/mock-data.js` 的 `target_qty`，輸出 0 筆不一致。

## 4. 成本引擎：工序費與設備費相加、特殊色分流

- [x] 4.1 `color-costing.check.mjs` 補十個案例（對應 work-order delta 「預估成本凍結」十個 Scenario）：工序費 1,000 ＋ 設備費 400 ＝ 1,400 並列、計價方法無「依設備計價」、存檔凍結四分項、平版 Pantone 與獨立印各乘對應倍率、數位三類特殊色共用面價且不乘倍率、外包工序併入工序費、大圖取才數費率、上機張數未填分項為 0、草稿改值重算覆寫、審核完成後不重算。完成條件：`node` 執行後十案例全部失敗（已通過者標註為既有行為不列入）。
- [x] 4.2 `work-orders/_lib/estimate-cost.js` 改寫：工序費與設備費改為相加、移除二選一分支；設備費依計價型別分流——平版乘三顆倍率（特別色、金屬、獨立印）、數位取「特殊色」面價不乘倍率、大圖無色數加價。完成條件：4.1 前七案例通過；`grep -n "依設備計價" apps/erp/src/app/\(prototype\)/work-orders/_lib/estimate-cost.js` 無輸出。
- [x] 4.3 外發（無計畫設備）印刷任務的設備費固定為 0、色數不參與計價。完成條件：`color-costing.check.mjs` 新增外發案例通過，回傳物件的設備費為 0 且色數登記仍在。
- [x] 4.4 `work-orders/_lib/mock-data.js` 全部既有任務的預估成本依新引擎重算。完成條件：重算比對腳本輸出 0 筆不一致。

## 5. 色數段顯示條件與五選項

- [x] 5.1 `color-costing.check.mjs` 補五個案例（對應 work-order delta 「色數登記」五個 Scenario）：印刷類旗標為是即顯示（未選設備亦顯示）、旗標為否不顯示、特殊色逐色計數、外發純記錄、任務不儲存倍率。完成條件：`node` 執行後五案例全部失敗。
- [x] 5.2 `TaskFormDialog.js` 第 215 行的色數段顯示條件改取所選工序的「是否印刷類工序」旗標，移除 `selectedEquipment?.color_mode` 與 `unit_class === '自有工廠'` 兩個條件。完成條件：`grep -n "color_mode && draft.unit_class" apps/erp/src/app/\(prototype\)/work-orders/_components/detail/TaskFormDialog.js` 無輸出；選印刷工序但未選設備時色數段仍出現。
- [x] 5.3 同檔色數登記的色別改為五選項（單黑、CMYK、Pantone、金屬色（合印）、獨立印），逐項計數並存、無自動判定。完成條件：對話框色數段出現五個色別輸入格，同時填 Pantone 2 與獨立印 1 後即時預估的設備費隨兩者各自變動。
- [x] 5.4 既有 mock 任務的色數登記補「獨立印」鍵（值 0），區塊標題移除「依 X 機」的設備依賴措辭。完成條件：`grep -c "metal_only" apps/erp/src/app/\(prototype\)/work-orders/_lib/mock-data.js` 大於 0（色數登記存的是五色別計數鍵，中文標籤「獨立印」的正本在 `bom-master-mock.js` 的 `SPECIAL_COLOR_OPTIONS`）；`grep -n "色數與特殊色（依" apps/erp/src/app/\(prototype\)/work-orders/_components/detail/TaskFormDialog.js` 無輸出。

## 6. 完成判定變體與生管手動完成

- [x] 6.1 `completion-rules.check.mjs` 補十案例（對應 production-execution delta 「生產任務狀態轉換」八個 Scenario 與 work-order delta 「工單完工判定」前兩個 Scenario）：場內投入累計 1,051 達目標即完成且不看良品、材料型報工即完成、外發產出累計達標才完成、分批點收累計達標、點收不令完成、派單映射在途、生管手動完成後狀態與歷程紀錄、非生管操作被擋、工單於場內任務投入達標時完成、齊套完成數不因工單完成補齊。完成條件：`node` 執行後十案例全部失敗（既有已通過者標註）。
- [x] 6.2 `production-floor/_lib/report-rules.js` 與 `report-actions.js` 的完成判定改依任務變體取數：場內工序型與裝訂型取生產數量累計、材料型報工即完成、外發取產出累計。完成條件：6.1 前五案例通過；`work-orders/_lib/store.js` 第 438 行與第 461 行的鏡像判定同步改取對應變體的累計數。
- [x] 6.3 新增生管手動完成動作：在 `production-floor` 的生管視圖（`work-packages` 或 `schedule` 頁的任務列）提供「手動完成」，限生管角色（`production-floor/_lib/permissions.js` 把關），寫入歷程紀錄「生管手動完成」含操作人與時間（沿用 `production-floor/_lib/history.js`）。完成條件：6.1 手動完成兩案例通過；以生管身分操作後任務轉已完成且歷程新增一筆，以印務身分該動作不可見。
- [x] 6.4 已完成任務的報工作廢改為擋下並提示人工程序出路（對應 production-execution delta 「報工作廢與留痕」新增 Scenario）。完成條件：`completion-rules.check.mjs` 新增案例通過——已完成任務呼叫作廢回傳擋下與提示文字；未完成任務的既有兩道檢核行為不變（原六個 Scenario 全部仍通過）。

## 7. 報工超量警示門檻

- [x] 7.1 `report-threshold.check.mjs` 補三個案例（對應 production-execution delta 「報工數量上限警示」三個 Scenario）：目標 1,051 累計 1,030 不警示、累計 1,081 警示、材料型目標 4,220 累計 4,300 警示且門檻不再乘放損率加開機損。完成條件：`node` 執行後三案例全部失敗。
- [x] 7.2 `production-floor/_lib/report-rules.js` 的門檻計算改為直接取目標數量，移除 `×（1＋放損率）＋ 開機損` 的推算；`report-actions.js`、`_components/WorkReportDialog.js`、`work-packages/page.js` 三處的門檻取值與提示文字同步（不再顯示「預計投入量」）。完成條件：7.1 三案例通過；`grep -rn "預計投入量" apps/erp/src/app/\(prototype\)/production-floor/` 無輸出。

## 8. 印件移除預計投入量

- [x] 8.1 `print-items/detail/page.js` 第 430 行的「預計投入量」欄位移除。完成條件：`grep -rn "planned_input_qty\|預計投入量" apps/erp/src/app/\(prototype\)/print-items/` 無輸出；開啟印件詳情的生產進度區塊不再出現該列。
- [x] 8.2 `print-items/_lib/mock-data.js` 與 `detail-selectors.js` 移除該欄的資料與取值。完成條件：`grep -rn "planned_input" apps/erp/src/app/\(prototype\)/` 無輸出、頁面主控台無錯誤。

## 9. 收尾驗收

- [x] 9.1 四支驗算腳本全數重跑。完成條件：四支皆輸出全數通過、exit code 0，合計案例數不少於 delta 各 Scenario 的對應數。
- [x] 9.2 全域殘留字眼掃描。完成條件：`grep -rn "依設備計價\|預計投入量\|metallic_min_colors" apps/erp/src/app/\(prototype\)/` 無輸出。
- [x] 9.3 lint 與格式檢查。完成條件：`pnpm lint` exit code 0；`pnpm format:check` 除既有未格式化的 `README.md` 與 `tokens.json` 兩檔（本次未動）外無其他報告項，本次新增與修改的檔案皆通過 prettier 檢查。
- [x] 9.4 （部分，見執行註記 E）端到端試用一輪：建工單草稿 → 新增印刷型任務（看目標數量預設、改放損率看重算、登記 Pantone 與獨立印看設備費）→ 新增材料型任務看張數預設含開機損 → 存檔看四分項 → 送製程審核完成看定格 → 現場報工至投入達標看任務完成與工單完成 → 另一筆任務以生管手動完成看歷程 → 對已完成任務嘗試作廢報工看擋下。完成條件：八步皆按預期呈現、瀏覽器主控台無錯誤。
- [x] 9.5 更新 `ACCEPTANCE.md` 的對應驗收項（目標數量口徑、色數五選項、完成判定變體、手動完成、超量門檻）。完成條件：檔內五項皆有對應描述且不含「依設備計價」與「預計投入量」字樣。
- [ ] 9.6 （待 Miles 決定是否 push，見執行註記 F）提交並依現行工作模式併入 prototype 主線。完成條件：commit 訊息含 change 名稱、push 成功。

## 執行註記（2026-08-20 實作）

- **A｜不開分支**：依當串工作模式直接疊 commit 到 `prototype/production-stage`（生產階段校正期間的既定例外），未建 `prototype/wo-qty-color-costing`。四筆 commit：`ec8f16f` 主檔與成本引擎、`afb30a5` 目標數量引擎與表單、`157e247` 完成判定與手動完成、`401d4aa` ACCEPTANCE。
- **B｜外發的範圍**：tasks 2.3 把「協力廠（加工廠）」列入外發，與 delta spec「外發＝外包廠與中國廠商、加工廠屬場內（含放損）」相衝，實作以 delta spec 為準——只有燙金、燙玫瑰金、彩盒印製、書盒壓紋四筆（外包廠／中國廠商）放損率歸 0，覆亮膜等加工廠工序照實保留放損率。
- **C｜`metallic_min_colors` 在 prototype 不存在**：既有設備 mock 只有 `pantone`、`metallic` 兩顆倍率，故改為**新增** `metal_only`（獨立印倍率，對齊後端 `equipment_offset_printing.metallic_min_colors` 同一欄的語意），並移除數位設備的倍率欄（三類特殊色改共用階梯表 `special_price` 面價）。
- **D｜mock 目標數量不覆寫**：既有 66 筆任務的目標數量承載了拼版模數換算（印張／成品單位落差，如名片線 530 印張 vs 5,000 張名片），而拼版代算屬另案（PT-042）、引擎算不出那個換算；直接以倒推值覆寫會破壞整條線的單位語意、並連帶失效現場任務池與 ACCEPTANCE 的既有數字。故改為全數標記 `target_qty_manual: true`（＝印務依拼版換算填入），倒推預設值只在新增任務時帶入。驗算腳本因此改驗兩件事：全數帶手改標記、且引擎對它們的輸出與 mock 一致（手改值不被覆寫在整份 mock 上都成立）。
- **E｜端到端試用的覆蓋**：瀏覽器實測完成前半段——新增工序任務時目標數量預填 20,600（＝20,000 × 1.03）、放損率帶 3.0%、手改 21,000 後改放損率 8% 不被覆寫、未選設備即出現色數段五色別、選 SM102 後 Pantone 1 ＋ 獨立印 1 的設備費即時變為 7,400（＝3,200＋1,560＋2,640）、印務身分看不到「手動完成」欄、頁面主控台僅既有 antd `destroyOnClose` 棄用警告。後半段（現場報工至達標、生管手動完成、已完成任務作廢擋下）由 `completion-rules.check.mjs` 與 `report-threshold.check.mjs` 共 16 個案例覆蓋；模擬角色切換器在本次無頭瀏覽器環境下不穩定（虛擬清單選項點不到），生管視角的實機點擊未完成。
- **F｜未 push**：本分支含前幾串未推的 10 筆 commit（共 14 筆 ahead），是否推送由 Miles 決定，本次未執行 `git push`。
- **G｜舊驗算腳本併入**：`estimate-cost.check.mjs`（前一個 change 的六個情境）已逐案併入 `color-costing.check.mjs`（案例 5、8、9、10、11、12）後刪除，避免兩份腳本用不同色數資料形狀驗同一件事。
