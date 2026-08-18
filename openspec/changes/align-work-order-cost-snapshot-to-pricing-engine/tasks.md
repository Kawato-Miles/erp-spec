> 實作範圍：erp repo Prototype（`/Users/b-f-03-029/erp`），自 `prototype/production-stage` 開新分支 `prototype/cost-snapshot-pricing-engine`，完成後由前端主管 PR 合併。
> 檔案路徑一律相對於 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`。
> repo 內無自動化測試框架，情境覆蓋以「純函式驗算腳本（node 執行、assert 期望值）」落地；期望值取自 delta spec 各 Scenario 的 THEN 描述，不由實作回算。

## 1. 分支與情境驗算先行（紅在綠前）

- [x] 1.1 自 `prototype/production-stage` 建分支 `prototype/cost-snapshot-pricing-engine`。完成條件：`git branch --show-current` 輸出 `prototype/cost-snapshot-pricing-engine`。
- [x] 1.2 建立驗算腳本 `work-orders/_lib/__checks__/estimate-cost.check.mjs`，覆蓋六個 Scenario 各一個案例，期望值以字面量寫死於腳本：(a) 工序型平版任務存檔凍結四分項且設備費＝開機費＋各色貢獻 (b) 外包工序任務的行情價落工序費、回傳物件無 `outsource` 鍵 (c) 大圖任務設備費＝才數費率算出且不含開機費與折舊 (d) 材料型任務未填上機張數時 `material` 為 0 (e) 同一任務改上機張數後重算金額改變 (f) 主檔單價改動後對既存凍結值不生效（以已存 `est_cost` 不被重算驗證）。完成條件：`node "apps/erp/src/app/(prototype)/work-orders/_lib/__checks__/estimate-cost.check.mjs"` 執行後六個案例全部失敗並印出失敗清單（此時實作未改，失敗即預期）。

## 2. 概算引擎改接計價引擎口徑

- [x] 2.1 改寫 `work-orders/_lib/estimate-cost.js`：回傳鍵名改為 `material` / `process` / `binding` / `equipment` 四分項，移除 `outsource` 鍵；材料費＝材料規格單張價 × 上機張數；工序費與裝訂費改查 BOM mock 的行情價（外包承作亦取同一查表價，不再分流到外包分項）；設備費依計價型別分流——平版＝開機費＋Σ 各色貢獻（依令數階梯查表單價）、數位＝Σ 各色查表（面數階梯）× 印刷面數、大圖＝才數費率 × 數量。完成條件：`grep -n "outsource\|hourly_rate \* 0.2\|calcMachineHours\|inputQty \* 0.2" apps/erp/src/app/\(prototype\)/work-orders/_lib/estimate-cost.js` 無輸出。
- [x] 2.2 上機張數缺值處理：未填時以張數為輸入的分項回 0，不以目標數量或投入量推估。完成條件：1.2 腳本案例 (d) 通過。
- [x] 2.3 執行 1.2 腳本至六案例全部通過。完成條件：腳本輸出 `6/6 passed`、exit code 0。

## 3. BOM 主檔 mock 補計價參數

- [x] 3.1 `work-orders/_lib/bom-master-mock.js` 的工序項目補行情價查表欄位（張數類與數量類各自的區間價），裝訂項目補每本單價與最低金額查表欄位。完成條件：`grep -c "price_table" apps/erp/src/app/\(prototype\)/work-orders/_lib/bom-master-mock.js` 大於 0，且工序與裝訂兩個陣列的每一筆皆有查表欄位（腳本或人工逐筆點名確認）。
- [x] 3.2 同檔設備項目補三型計價階梯參數：平版的開機費與令數階梯每色單價、數位的面數階梯各色欄、大圖的每才費率與折扣乘數區間；移除概算專用的每小時費率依賴（`hourly_rate` 若他處仍引用則保留欄位但不參與預估）。完成條件：`grep -n "hourly_rate" apps/erp/src/app/\(prototype\)/work-orders/_lib/estimate-cost.js` 無輸出。

## 4. 生產任務表單新增計價輸入

- [x] 4.1 `work-orders/_components/detail/TaskFormDialog.js` 新增「上機張數」整數欄位，材料型與工序型任務顯示（裝訂型不顯示——裝訂計價吃頁數與本數，不吃張數），欄位說明點明「依拼版換算、含放損」；即時預估區塊的分項標籤同步改為材料費／工序費／裝訂費／設備費。完成條件：開啟工單詳情的新增生產任務對話框，畫面出現「上機張數」欄位，輸入 12000 後即時預估的材料費隨之變動、四個分項標籤為新式名稱。
- [x] 4.2 上機張數的可修改期限對齊製程確認階段（製程審核完成後不可編輯）。完成條件：開啟一張製程審核完成工單的任務編輯，上機張數欄位為唯讀或不可編輯。

## 5. 呈現層對齊

- [x] 5.1 `work-orders/_components/detail/EstimateTab.js` 表頭改為材料費／工序費／裝訂費／設備費，設備費欄標題移除「折舊」字樣、改標計價型別口徑。完成條件：開啟工單詳情「預估成本分項」分頁，表頭四欄為新式名稱，頁面全文不含「外包」與「折舊」字樣。
- [x] 5.2 `work-orders/_components/detail/CostCompareTab.js` 預估側改用新四分項，實際側依生產任務類型歸戶對映到預估分項（材料型→材料費、工序型含外包實付→工序費、裝訂型→裝訂費、設備相關→設備費），並加口徑說明「預估為計價口徑金額、實際為執行累積，差額含毛利與管銷空間，非純執行差異」。完成條件：開啟有報工事實工單的「成本對照」分頁，四列分項名為新式、每列標示實際來源、頁面出現口徑說明文字。

## 6. 既有資料與彙總同步

- [x] 6.1 `work-orders/_lib/mock-data.js` 全部既有生產任務的 `est_cost` 依新式重算（鍵名換為四分項、金額以新引擎算出的量級填寫），檔頭註解同步改寫分項語意。完成條件：`grep -c "outsource" apps/erp/src/app/\(prototype\)/work-orders/_lib/mock-data.js` 輸出 0；隨機抽三張工單的預估成本合計與 `estimateTaskCost` 重算結果一致（腳本比對）。
- [x] 6.2 `work-orders/_lib/store.js` 的 `calcCostSummary` 與補做任務的預估成本比例縮放，其分項鍵名清單同步為四分項。完成條件：`grep -n "'material', 'labor', 'equipment', 'outsource'" apps/erp/src/app/\(prototype\)/work-orders/_lib/store.js` 無輸出；由品檢缺口發起一筆補做任務後，新任務四分項金額約為原任務的數量比例。
- [x] 6.3 `recipes/_lib/store.js` 引用 `estimateTaskCost` 之處確認回傳鍵名相容。完成條件：開啟配方頁面的任務預覽，四分項金額正常顯示、瀏覽器主控台無錯誤。
- [x] 6.4 確認 `production-floor/_lib/actual-cost.js` 未被修改。完成條件：`git diff --name-only prototype/production-stage -- "apps/erp/src/app/(prototype)/production-floor/_lib/actual-cost.js"` 無輸出。

## 7. 收尾驗收

- [x] 7.1 全域殘留字眼掃描：預估側不得再出現外包分項與折舊字樣。完成條件：`grep -rn "est_cost.*outsource\|預估.*折舊" apps/erp/src/app/\(prototype\)/work-orders` 無輸出。
- [x] 7.2 lint 與格式檢查。完成條件：`pnpm lint` 與 `pnpm format:check` 皆 exit code 0。
- [x] 7.3 端到端試用一輪：建立工單草稿 → 新增印刷型任務並填上機張數與色數 → 存檔看四分項 → 改上機張數看重算 → 送製程審核完成看定格 → 開成本對照分頁。完成條件：六步皆按預期呈現，瀏覽器主控台無錯誤。
- [x] 7.4 提交並開 PR 交前端主管審核。完成條件：PR 已建立且標題含 change 名稱、描述連回本 change 的 proposal 路徑。（後續依 PM 指示改為直接併入 `prototype/production-stage`、PR 已關閉、分支已刪除；第 8 群組起直接於該分支疊 commit）

## 8. 缺輸入計價因子改手填（Miles 2026-08-18 裁決：比照上機張數）

- [ ] 8.1 `TaskFormDialog.js` 依所選主檔項目的計價方法動態顯示計價輸入欄位：「才數」（大圖輸出）、「工序面積」（工序面積計價）、「頁數」（台數／頁數／本數計價的裝訂）；未填時以其為輸入的分項回 0。完成條件：選大圖工序出現才數欄、選局部上光類出現工序面積欄、選書冊裝訂出現頁數欄，未填時對應分項為 0。
- [ ] 8.2 `estimate-cost.js` 移除以主檔預設值頂替的路徑（`chi_per_unit` 等 fallback），改讀任務手填值；單軸退化的查表（工序面積計價誤用數量軸、裝訂一律本數軸）改回各自正確的查表軸。完成條件：`grep -n "chi_per_unit" apps/erp/src/app/\(prototype\)/work-orders/_lib/estimate-cost.js` 無輸出；驗算腳本案例 3 改以手填才數為輸入後通過。
- [ ] 8.3 mock 既有任務補填合理的才數／工序面積／頁數並全量重算 est_cost。完成條件：重算比對腳本 0 不一致。
- [ ] 8.4 WO-2026-0301 的局部 UV 任務（pt-0301-3）改指既有工序「局部上光」（pc-203），生產單位類別如實改為加工廠，est_cost 依行情價重算落工序費。完成條件：該任務四分項不再全 0、外發動線欄位如實呈現。
- [ ] 8.5 驗算腳本全數重跑、lint 通過，直接 commit 至 `prototype/production-stage` 並推送。完成條件：`6/6 passed`、`pnpm lint` exit 0、push 成功。
