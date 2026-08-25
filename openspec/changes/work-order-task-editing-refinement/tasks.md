> 實作範圍：erp repo Prototype（`/Users/b-f-03-029/erp`），自現行 prototype 主線開分支 `prototype/wo-task-editing-refinement`，完成後依現行工作模式併入。
> 檔案路徑一律相對於 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`。
> repo 內無自動化測試框架，情境覆蓋以「純函式驗算腳本（node 執行、assert 期望值）」落地，放在各模組的 `_lib/__checks__/`；期望值取自 delta spec 各 Scenario 的 THEN 描述，MUST NOT 由實作回算。
> 每個群組的第一項為驗算腳本（先失敗），其後才是實作。
> 實作 MUST 經 repo 內 skill `prototype-from-prompt`；版型與元件語彙以來源頁現況為準。

## 1. 分支與驗算骨架

- [ ] 1.1 自現行 prototype 主線建分支 `prototype/wo-task-editing-refinement`。完成條件：`git branch --show-current` 輸出 `prototype/wo-task-editing-refinement`。
- [ ] 1.2 建立三支驗算腳本骨架並掛進既有 `module-loader.mjs` 載入方式：`work-orders/_lib/__checks__/planned-spoilage.check.mjs`、`work-orders/_lib/__checks__/task-order.check.mjs`、`orders/_lib/__checks__/urgent-due-date.check.mjs`（orders 模組尚無 `__checks__` 目錄，一併建立並複製既有 loader）。完成條件：三支皆可 `node` 執行、各印出 `0/0 passed` 且 exit code 0。

## 2. 數量兩欄化：計算引擎與存量遷移

- [ ] 2.1 `planned-spoilage.check.mjs` 補預填案例（對應 work-order delta 「生產任務目標數量預設與放損率」的 Scenario）：(a) 工單目標 1,000、裁切放損率 2% → 預計生產 1,000／放損 20／目標 1,020；印刷放損率 3% → 預計生產 1,020／放損 31／目標 1,051 (b) 每份工單需生產數量 4 → 末端需求 4,000 (c) 外發放損率 0 → 放損 0、目標等於下游需收 (d) 首道工序目標 1,051、一張開 21 模、開機損 20 → 材料任務預計生產 51／放損 20／目標 71 (e) 裝訂型任務放損預填 0 (f) 手改上游預計生產後下游值不變。完成條件：`node` 執行後六案例全部失敗。
- [ ] 2.2 `work-orders/_lib/target-qty.js` 改寫為兩值輸出：以 `calcPlannedQtyDefault`（預計生產）與 `calcSpoilageQtyDefault`（放損）取代原單值 `calcTargetQtyDefault`，目標數量改為 `plannedQty + spoilageQty` 的衍生計算函式；檔頭註解改寫為兩欄口徑（工序與裝訂：放損＝預計生產 × 放損率無條件進位；材料：放損＝設備固定開機損、預計生產＝乘積項）。完成條件：2.1 案例 (a)(b)(c)(d)(e) 通過；`grep -rn "calcTargetQtyDefault" apps/erp/src/app/\(prototype\)/` 無輸出。
- [ ] 2.3 預填只發生一次：`work-orders/_lib/store.js` 與 `recipes/_lib/store.js` 的任務建立與展開路徑改呼叫 2.2 的兩支函式各寫一次值；任務更新路徑 MUST NOT 重算任何其他任務的預計生產與放損。完成條件：2.1 案例 (f) 通過；`grep -n "recalc\|重算" apps/erp/src/app/\(prototype\)/work-orders/_lib/store.js` 的命中處經逐一確認皆不涉及上游任務數量。
- [ ] 2.4 存量 mock 拆欄遷移：`work-orders/_lib/mock-data.js` 每筆生產任務補 `planned_qty` 與 `spoilage_qty` 兩欄，值依 delta spec § 存量生產任務的數量拆欄遷移（工序與裝訂型以放損率反推、材料型先扣開機損），`target_qty` 原值保留；`target_qty_manual` 欄移除（改量口徑改由兩成分欄承載，不再需要手填標記）。完成條件：比對腳本逐筆檢查 `planned_qty + spoilage_qty === target_qty`，輸出 0 筆不一致；`grep -rn "target_qty_manual" apps/erp/src/app/\(prototype\)/` 無輸出。
- [ ] 2.5 數量邊界防呆改掛成分欄：兩欄皆不接受負值，加總為零時擋下存檔。完成條件：`planned-spoilage.check.mjs` 補兩案例（放損填負值被擋、兩欄皆 0 被擋）並通過。

## 3. 生產任務編輯對話框欄位重組

- [ ] 3.1 `work-orders/_components/detail/TaskFormDialog.js` 數量段改版：新增預計生產與放損兩個可編輯欄，目標數量改為唯讀即時加總顯示，移除目標數量的輸入。完成條件：開啟任一草稿工單新增生產任務，改動放損欄後目標數量即時變動，且目標數量欄無法輸入。
- [ ] 3.2 同檔放損率欄改唯讀參考、僅工序型任務顯示；材料型與裝訂型任務不渲染該欄。完成條件：以工序型任務開啟對話框可見唯讀放損率、以材料型與裝訂型開啟皆不見該欄。
- [ ] 3.3 同檔新增製作細節與備註兩個文字欄；既有 `production_note` 欄收編為製作細節（欄名沿用、標籤改「製作細節」），另新增 `remark` 承載備註。製作細節於製程確認階段可改、備註全生命週期可改。完成條件：製程審核完成的工單開啟任務編輯時，製作細節為唯讀而備註仍可輸入並儲存。
- [ ] 3.4 同檔預計開工日改純手填：移除倒推預填的呼叫與任何預設值填入，新增任務時該欄為空。完成條件：`grep -rn "backtrack" apps/erp/src/app/\(prototype\)/work-orders/_components/detail/TaskFormDialog.js` 無輸出；新增任務時預計開工日為空。
- [ ] 3.5 `work-orders/_lib/backtrack.js` 的預計開工日倒推預填移除；工單「推算完工日」的順推保留，且未填開工日的任務不參與、全部未填時不顯示推算值。完成條件：驗算腳本檢查「三筆任務皆未填開工日 → 推算完工日為空」與「填兩筆 → 依已填者順推」兩案例通過。

## 4. 生產任務清單改平列卡片

- [ ] 4.1 `work-orders/_components/detail/ProcessTab.js` 移除材料／工序／裝訂三段結構，改單一平列卡片清單，列序依任務的排序值。完成條件：開啟任一含三類任務的工單，清單無分段標題、六筆任務在同一序列中。
- [ ] 4.2 同檔卡片顯示欄目依 delta spec 與紙本欄序排列：群組、廠商、任務名稱（需填尺寸的工序將尺寸併入名稱）、製作細節、設備、預計生產、放損、目標數量、單位、備註，其後接狀態、預計開工日、前置相依（一行「前置：X」）與操作。完成條件：畫面逐欄比對清單無缺漏、無成本欄位出現。
- [ ] 4.3 新增單位推導：於 `work-orders/_lib/bom-master-mock.js` 既有計價方法對照出單位（張／才／本／頁／台），卡片顯示推導值，不新增主檔欄位、不提供輸入。完成條件：`grep -rn "unit_name\|unit:" apps/erp/src/app/\(prototype\)/work-orders/_lib/bom-master-mock.js` 無新增欄位；材料型任務顯示「張」、大圖工序顯示「才」。
- [ ] 4.4 新增入口改先選類型：同檔的新增生產任務改為單一按鈕，第一步選材料／工序／裝訂，選定後才展開該類型欄位；新任務排在清單最後。完成條件：畫面只有一個新增按鈕；新增後該任務出現在清單末列。

## 5. 排序側板

- [ ] 5.1 `task-order.check.mjs` 補三案例（對應 work-order delta 「生產任務清單排序」）：(a) 建立時初始順序為材料→工序→裝訂 (b) 側板送出的順序陣列寫入後清單依新序 (c) 送出時清單版本與開啟時不符則拒絕寫入。完成條件：`node` 執行後三案例全部失敗。
- [ ] 5.2 `work-orders/_lib/store.js` 生產任務補排序值欄與排序寫入動作（`applyTaskOrder`），寫入前比對清單版本（任務 id 集合或版本序號），不符即拒絕並回傳需重開的結果。完成條件：5.1 案例 (a)(b)(c) 通過。
- [ ] 5.3 新建排序側板元件 `work-orders/_components/detail/TaskOrderDrawer.js`：內容為全部生產任務的標題表格（順序號、群組、任務名稱、廠商），支援拖曳調整，按確定一次寫入、取消不寫入；寫入被拒時提示清單已變更、請重新開啟。完成條件：開啟側板拖曳後按取消，清單順序不變；按確定後清單依新序；側板開啟期間於另一分頁加開任務後按確定，出現重新開啟提示且順序未變。
- [ ] 5.4 `ProcessTab.js` 接上排序入口，且清單本身不提供直接拖曳。完成條件：清單列無拖曳握把；排序按鈕開啟側板。

## 6. 訂單編輯：印件急件選項與交期推導

- [ ] 6.1 `urgent-due-date.check.mjs` 補四案例（對應 order-management delta 兩條急件 Requirement）：(a) 客戶交期 2026-08-20、凍結天數 3 → 訂單交期（扣除急件）2026-08-17 (b) 一般件（天數 0）→ 等於客戶交期 (c) 客戶交期改 2026-08-25 → 重推為 2026-08-22 (d) 扣減後早於今日仍照實回傳、不校正。完成條件：`node` 執行後四案例全部失敗。
- [ ] 6.2 新建急件主檔 mock `orders/_lib/urgent-option-mock.js`：欄位為急件名稱、增減天數、商品金額調整%、是否啟用，資料含一般件（0 天）與數筆急件等級，值以業務格式撰寫。完成條件：檔案存在且匯出清單含一筆增減天數為 0 的「一般件」。
- [ ] 6.3 `orders/mock-data.js` 每筆印件補急件選項三欄（引用 id、凍結名稱、凍結天數），既有印件一律補為一般件（天數 0）；印件的交期顯示改由推導值提供。完成條件：比對腳本檢查每筆印件皆有凍結天數欄，且推導值等於所屬訂單 `deadline` 減凍結天數，輸出 0 筆不一致。
- [ ] 6.4 新建推導選取器 `orders/_lib/urgent-due-date.js`：輸出印件的訂單交期（扣除急件），日曆日計、不設下限。完成條件：6.1 四案例通過。
- [ ] 6.5 `orders/_components/detail/PrintItemEditDrawer.js` 新增急件選項單選欄（必填、選項取 6.2 主檔的啟用項），選定時寫入凍結快照；急件選項於訂單未進終態時全程可改（含製作段，不受購買數量鎖定所限），終態唯讀。完成條件：製作中訂單開啟編輯面板可改急件選項、購買數量仍唯讀；訂單完成的訂單兩者皆唯讀；未選定即存檔被擋下。
- [ ] 6.6 同面板與 `orders/_components/detail/ItemsTab.js` 顯示唯讀的訂單交期（扣除急件），值取 6.4 的推導；急件主檔改天數或停用後顯示仍為凍結快照。完成條件：改 6.2 mock 的天數後重新載入，既有印件顯示的凍結天數與推導交期不變。
- [ ] 6.7 `orders/_components/detail/InfoTab.js` 的訂單是否急件欄補注記語意說明（不參與日期計算），並確認該欄不進入任何交期計算路徑。完成條件：`grep -rn "is_urgent" apps/erp/src/app/\(prototype\)/` 的命中處皆為顯示或篩選用途，無任何日期運算。

## 7. 急件標示與變更通知

- [ ] 7.1 急件選項變更時推播通知並寫活動紀錄：`orders/_lib/store.js` 的印件更新路徑偵測急件選項變動，通知該印件旗下各工單的負責印務（為空則印務主管），活動紀錄記操作者、時間與變更前後的選項與天數。完成條件：製作中訂單改急件選項後，通知清單出現該筆、活動紀錄含前後值；同一次操作不另產生「製作後印件規格異動」通知。
- [ ] 7.2 工單與生產任務頁急件標示：`work-orders/page.js`、`work-orders/detail/page.js` 與 `ProcessTab.js` 依所屬印件的凍結天數非零顯示標示，不新增工單層欄位。完成條件：以急件印件的工單檢視有標示；以一般件（且訂單注記為急件）的工單檢視無標示。
- [ ] 7.3 工單預計交期改取印件推導值：建單帶入、非終態隨推導值同步、終態工單不回寫。完成條件：驗算腳本檢查「印件推導值變動 → 製作中工單同步、已完成工單不變」通過。

## 8. 審稿待審清單急單標示來源

- [ ] 8.1 `prepress-review/_lib/selectors.js` 與 `prepress-review/_components/ReviewOrderList.js` 的急單標示改取印件的急件選項凍結天數非零，不再取訂單 `is_urgent`。完成條件：`grep -rn "is_urgent" apps/erp/src/app/\(prototype\)/prepress-review/` 無輸出；同一張訂單下只有急件印件帶標示。

## 9. 工單列印頁

- [ ] 9.1 新建列印頁 `work-orders/print/page.js`：表頭載工單編號、客戶名稱、印件名稱、購買數量、工單建立日期、負責印務與聯絡電話、單頭備註、確樣需求、品檢需求；明細為單一平列表格（第一欄群組、列序同畫面排序、欄目同卡片但去除成本相關內容、保留廠商與放損）；明細後附製程說明與參考完稿圖。完成條件：開啟該頁逐欄比對表頭與明細欄目齊備，頁面無任何價格或成本欄位。
- [ ] 9.2 同頁加列印友善樣式（`@media print`：隱藏導覽與操作按鈕、表格不跨頁截斷），並由瀏覽器列印輸出。完成條件：瀏覽器列印預覽中只見單據內容、無導覽列與按鈕。
- [ ] 9.3 `work-orders/detail/page.js` 的 `handlePrint` 樁改為導向 9.1；限工單狀態為製程審核完成之後、限印務與生管可執行（沿用 `work-orders/_lib/permissions.js` 角色判定）。完成條件：草稿工單點列印被擋並提示；製程審核完成的工單以印務與生管兩個角色皆可開啟列印頁。
- [ ] 9.4 列印內容只含已生效變更：尚未確認的工單異動所加開的生產任務不出現在明細。完成條件：以含未確認異動的工單開啟列印頁，明細不含該任務；模擬確認該異動後重開，明細含該任務。

## 10. 驗證與收尾

- [ ] 10.1 三支驗算腳本全部執行通過。完成條件：依序 `node` 執行 `planned-spoilage.check.mjs`、`task-order.check.mjs`、`urgent-due-date.check.mjs`，三支皆 `N/N passed`、exit code 0。
- [ ] 10.2 頁面實測工單側動線：開啟一張草稿工單 → 新增各類型任務一筆（先選類型）→ 填兩欄數量與手填開工日 → 側板調順序 → 送審 → 核可 → 開啟列印頁。完成條件：六個步驟皆可完成，過程無 console error。
- [ ] 10.3 頁面實測訂單與審稿側動線：訂單編輯設印件急件選項 → 確認推導交期與工單預計交期同步 → 確認印務收到通知 → 於審稿待審清單確認只有該印件帶急單標示。完成條件：四個檢查點皆符合，過程無 console error。
- [ ] 10.4 更新 `ACCEPTANCE.md`：補本次的驗收項（兩欄數量、排序側板、急件選項與交期、列印頁），移除已不成立的目標數量直接編輯與開工日預填相關項。完成條件：`grep -n "目標數量\|預計開工日\|急件" ACCEPTANCE.md` 的命中處皆與本 change 的 delta spec 一致。
