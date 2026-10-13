# 單據可見範圍與操作權限：現況落差盤點（2026-10-13）

只讀盤點，未修改任何檔案。

## 盤點基準

| 項目 | 基準 |
|------|------|
| wiki 正本 | `memory/Sens_wiki/wiki/erp/`；卡名以 `[[卡名]]` 標示 |
| 拍板 | `memory/erp/plans/linear-format-20261012/grill-decisions.md`（S、V、R、X4b、X4c、D1 至 D6 為最新） |
| Prototype | erp repo 分支 `prototype/production-stage`，提交 `ecf5d06c`；下文路徑皆省略前綴 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/` |
| 測試 | `/Users/b-f-03-029/Sens/erp-prototype-tests/`（提交 `f5b42bc` 時的版本） |
| 舊盤點 | `downstream-list.md` § D、§ E 看的是 `prototype/dispatch-and-shipping` 分支；本檔已依現行分支重新核對行號 |

落差類型代碼：

| 代碼 | 意思 |
|------|------|
| 可見範圍 | 看得到哪些單與 wiki 不同 |
| 動作角色 | 誰能做某動作與 wiki 不同 |
| 分享不限角色 | 被分享者或候選人被角色卡住 |
| 改派 | 改派的執行者或時機與 wiki 不同 |
| 用詞 | 使用者可見文案、頁籤名、權限名稱與 wiki 用詞不同 |
| wiki 未定義 | Prototype 有行為，wiki 沒有對應規則 |

---

## 一、各模組落差

### 1. 共用：側欄選單（模組入口即可見範圍）

正本：[[單據存取範圍]] § 各模組持有全公司範圍的角色。Prototype：`layout.js` 的 `ROLE_VISIBLE_ITEMS`（第 181 至 219 行）。

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務主管看出貨單 | 出貨單列「全公司：揀貨人員、出貨人員、業務主管、Supervisor」 | `layout.js:183` sales_manager 無「品檢與出貨」群組，看不到出貨管理 | 可見範圍 | 業務主管側欄加出貨管理 |
| 會計看售後服務單 | 售後服務單列「全公司：業務主管、會計、Supervisor」 | `layout.js:185` accountant 只有「訂單管理」（僅訂單列表）與「款項管理」 | 可見範圍 | 會計側欄加售後服務 |
| Supervisor 看審稿與售後服務單 | 審稿列與售後服務單列皆含 Supervisor | `layout.js:186-200` supervisor 無「審稿管理」；所用「訂單管理_訂單管理人」群組（`layout.js:45-52`）無售後服務 | 可見範圍 | Supervisor 側欄加審稿與售後服務 |
| 訂單管理人看工單 | 工單列「全公司：印務、印務主管、生管、訂單管理人、Supervisor」 | `layout.js:202` order_manager 無「工單管理」 | 可見範圍 | 訂單管理人側欄加工單列表 |
| 審稿主管看訂單 | 訂單列含審稿主管（V2：完整全公司） | `layout.js:203` reviewer_supervisor 只有「審稿管理_可分派」 | 可見範圍 | 審稿主管側欄加訂單列表 |
| 印務看訂單、審稿 | 訂單列與審稿列皆含印務 | `layout.js:204` print_officer 無「訂單管理」「審稿管理」 | 可見範圍 | 印務側欄加訂單列表與待審訂單 |
| 印務看出貨單 | 出貨單列不含印務，「其餘角色：無」 | `layout.js:204` print_officer 有「品檢與出貨」，含出貨管理 | 可見範圍 | 印務側欄移除出貨管理 |
| 印務主管看訂單、審稿、派單 | 訂單列、審稿列、派單列皆含印務主管 | `layout.js:205-212` print_manager 無「訂單管理」「審稿管理」「派單管理」 | 可見範圍 | 印務主管側欄加三個入口 |
| 印務主管看出貨單 | 出貨單列不含印務主管；[[印務主管]] § 職務範圍「不接觸：…出貨單」 | `layout.js:205-212` 有「品檢與出貨」，含出貨管理 | 可見範圍 | 印務主管側欄移除出貨管理 |
| 生管看工單 | 工單列含生管；[[生管]] § 職務範圍「看得到但不能動：工單（全公司）」 | `layout.js:213` production_planner 無「工單管理」 | 可見範圍 | 生管側欄加工單列表 |
| 生管看品檢與出貨單 | 品檢待驗清單、品檢紀錄、出貨單三列皆不含生管 | `layout.js:213` 有「品檢與出貨」（品檢站與出貨管理） | 可見範圍 | 生管側欄移除品檢與出貨 |
| 品檢人員看出貨單 | 出貨單列不含品檢人員 | `layout.js:216` qc_inspector 有「品檢與出貨」，含出貨管理 | 可見範圍 | 品檢人員側欄移除出貨管理 |
| 揀貨人員、出貨人員看品檢待驗清單 | 品檢待驗清單列「全公司：品檢人員、印務主管、Supervisor」；二者只在品檢紀錄列 | `layout.js:217-218` 有品檢站；品檢站同頁呈現待驗清單與品檢紀錄（`qc-shipping/inspection/page.js:196-214` 不分角色列全部） | 可見範圍 | 二者只留品檢紀錄的檢視 |
| 業務看品檢待驗清單 | 品檢待驗清單列不含業務；業務只經上下層延伸看自己負責訂單的品檢紀錄 | `layout.js:182` sales 有品檢站，整頁不過濾 | 可見範圍 | 業務移除品檢站，品檢紀錄改走訂單延伸 |
| Supervisor 角色名 | 角色卡名為 [[Supervisor]] | `_lib/sessionStore.js:30` 角色標籤「主管」 | 用詞 | 標籤改 Supervisor |
| 外包廠商、中國廠商 | 派單列「自己負責：外包廠商、中國廠商」 | `_lib/sessionStore.js:24-50` 角色名冊無此二角色 | wiki 未定義（Prototype 未做） | 待決定是否補模擬角色 |

### 2. 需求單（quote-prototype）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務主管列表範圍 | [[單據存取範圍]] 需求單列「全公司：印務主管、業務主管、Supervisor」；[[業務主管]] 「需求單（全公司；不編輯不推進）」 | `_lib/permissions.js:101-106` `RELATED_ONLY_ROLES` 含 sales_manager，`canSeeQuote` 只回相關的單；`page.js:111` 依此過濾 | 可見範圍 | sales_manager 移出 `RELATED_ONLY_ROLES` |
| 其餘角色列表範圍 | 需求單列「其餘角色：無」 | `_lib/permissions.js:104` 非 `RELATED_ONLY_ROLES` 一律回真；入口靠側欄擋，詳情頁 `detail/page.js` 無可見範圍判斷，直連可開 | wiki 未定義 | 決定詳情頁直連是否比照可見範圍 |
| 被分享（編輯）者管理需求單 | [[單據存取範圍]] § 分享「被分享（檢視）與被分享（編輯）對所有角色一律適用」；[[需求單狀態]] § 轉換條件「業務可執行的轉換，被分享（編輯）者也可執行」 | `_lib/permissions.js:26-27` `canManageQuote` 先限 role 為 sales 或 consultant | 分享不限角色 | 拿掉角色條件，只看負責或編輯分享 |
| 評估印務主管等同被分享（編輯） | [[需求單]] 評估印務主管欄「被指派者由系統自動列入分享成員（編輯（代理）層級）…可做接單業務能做的事，含刪除」 | `_lib/permissions.js:14-19` `isQuoteOwnerOrEditor` 只看 `permissions`；評估指派不寫入 `permissions`（`_lib/store.js` 無對應寫入）；`:110-112` 註解明寫「因指派取得的編輯授權…不含刪除」 | 動作角色 | 指派時自動寫入編輯分享，移出名單時撤銷 |
| 評估印務主管列在分享成員清單 | [[需求單]] 分享成員欄「評估印務主管由系統自動列入」 | `detail/page.js:1001-1026` 權限管理頁籤只列 `quote.permissions`，評估印務主管不在清單 | 動作角色 | 清單列出評估印務主管 |
| 評估印務主管改成本的狀態 | [[需求單]] 成本估算欄「業務、諮詢與被指派的評估印務主管於需求確認中、待評估成本、已評估成本可改」 | `_lib/permissions.js:59-69` `canEditCostFields` 只放行待評估成本、已評估成本 | 動作角色 | 加需求確認中 |
| 評估印務主管刪除與推進 | [[需求單狀態]] 刪除列「被指派的評估印務主管也可刪除」 | `_lib/permissions.js:112` `canDeleteQuote = canManageQuote`，印務主管回假；`:35-36` `canCompleteEstimate` 同 | 動作角色 | 依評估指派放行刪除與推進 |
| Supervisor 改派接單業務 | [[需求單]] 接單業務欄「建單後業務主管或 Supervisor 可改派」（X4b） | `_lib/permissions.js:119-120` `canReassignQuoteOwner` 限 sales_manager | 改派 | 加 supervisor |
| 分享候選人 | [[單據分享與職務代理]] 主流程第 2 步「被授權同事（不限角色）」；[[業務]] § 主要職責 10「分享給同事（不限角色）」 | `detail/page.js:570-573` 候選取 `MOCK_ADMIN_USERS`；`mock-data.js:29-39` 名冊只有業務與印務主管兩種角色 | 分享不限角色 | 候選名冊涵蓋各角色 |
| 頁籤名 | [[需求單]] 欄位名「分享成員」 | `detail/page.js:1002` 頁籤「權限管理」；`:2130` 抽屜欄名「管理員名稱」 | 用詞 | 頁籤改「分享成員」 |
| 評估印務主管欄名 | [[需求單]] 欄位名「評估印務主管」 | `detail/page.js:1253` 欄名「評估印務」 | 用詞 | 欄名改「評估印務主管」 |

### 3. 諮詢單

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 整個模組 | [[單據存取範圍]] 諮詢單列「全公司：業務主管、Supervisor。自己負責：諮詢」；[[諮詢單]] 諮詢人員欄「改派限業務主管或 Supervisor」 | `layout.js:29` 諮詢單列表 `path: null`，無頁面、無權限函式 | wiki 未定義（Prototype 未做） | 模組未建，範圍與改派無從比對 |

### 4. 訂單（orders，含旗下印件、訂單異動、收款項目、發票、款項紀錄）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務、諮詢列表範圍 | [[單據存取範圍]] 訂單列「自己負責：業務、諮詢」；被分享兩層級 | `_lib/permissions.js:91-98` `canSeeOrder` 另加「被指派為審核主管」（`order.assigned_manager === userName`） | wiki 未定義 | 移除審核主管途徑（X6：不收為範圍用詞） |
| 詳情頁直連 | 訂單列「其餘角色：無」 | `detail/page.js:65-90` 只判訂單存不存在，不判可見範圍 | wiki 未定義 | 決定直連是否比照可見範圍 |
| 業務主管代操作（推進） | [[業務主管]] § 職務範圍「訂單的代操作、分享管理與跨單取消（全公司）」（R1） | `_lib/permissions.js:65-66` `canAdvanceOrderStatus` 限 role 為 sales | 動作角色 | 加 sales_manager |
| 業務主管跨單取消 | 同上 | `_lib/permissions.js:73` `canCancelOrder` 限 sales；`_lib/cancel-actions.js:110` 寫入守衛同 | 動作角色 | 加 sales_manager |
| 業務主管代操作（送審、刪印件、編印件、上傳稿件、棄用印件） | 同上 | `_lib/permissions.js:169-172` `canSubmitOrderForReview`、`:182-185` `canDeletePrintItem` 限業務或諮詢；`:84-87` `canAbandonPrintItem`、`:227` `canUploadArtwork`、`:241-242` `canEditPrintItem` 限 sales | 動作角色 | 依「代操作」範圍放行（範圍見第三節第 2 條） |
| 諮詢做業務同權的訂單動作 | [[諮詢]] § 職務範圍「訂單（含印件與稿件）…可建可改」；§ 職責邊界「兩個位置的動作幾乎等價」 | `canAdvanceOrderStatus`（`:65`）、`canCancelOrder`（`:73`）、`canAbandonPrintItem`（`:84`）、`canUploadArtwork`（`:227`）、`canEditPrintItem`（`:241`）都只認 sales；`canManageSharing`（`:122`）負責人途徑只認 sales | 動作角色 | 加 consultant |
| 上述動作不看負責歸屬 | [[單據分享與職務代理]] 主流程第 2 步「檢視層級…任何修改入口都不開放」 | `canAdvanceOrderStatus`、`canCancelOrder`、`canAbandonPrintItem`、`canEditPrintItem`、`canUploadArtwork` 只判角色；業務以檢視層級被分享時列表看得到（`:95` 任一層級），也按得到這些動作 | 動作角色 | 加負責人或編輯分享條件 |
| 被分享（編輯）者不限角色 | [[單據存取範圍]] § 分享「對所有角色一律適用」 | `canSubmitOrderForReview`（`:169`）、`canDeletePrintItem`（`:182`）、`canOperateOrderShipments`（`:313-316`）先限業務或諮詢 | 分享不限角色 | 拿掉角色條件 |
| 看得到但不能動的角色可改訂單內容 | [[會計]]、[[訂單管理人]]、[[審稿主管]]、[[印務主管]]、[[印務]] 對訂單皆列「看得到但不能動」；[[Supervisor]]「不建立、不修改任何單據」 | `_components/detail/InfoTab.js:522、603、623、646` 資訊、客戶、備註、發票與收款四區的編輯鈕只看訂單狀態；`ItemsTab.js:257` 單價行內編輯、`:262` 新增印件只看狀態；`AttachmentsTab.js:135、162` 只看 `readOnly`；`billing/InstallmentSection.js:219、237、263`、`billing/PaymentRecordSection.js:173、219` 只看 `readOnly`；`AdjustmentsTab.js:402-410` 建立訂單異動只看狀態；`AfterSalesTab.js:99-101` 建售後只看 `ticketCreationGuard` | 動作角色 | 各編輯入口加負責人、編輯分享或代操作角色條件 |
| 訂單異動取消 | [[業務主管]] § 主要職責 3「尚未認列的由接單業務自己取消」 | `_lib/permissions.js:335-336` `canCancelAdjustment` 未認列時不判角色與歸屬 | 動作角色 | 加接單業務或編輯分享條件 |
| 確認可製作、退回重審 | [[業務]] § 主要職責 2「逐件確認印件可製作…退回重審」 | `_lib/permissions.js:247、255` 只判角色，不判歸屬；`ItemsTab.js:1211、1229` 依此顯示 | 動作角色 | 加負責人或編輯分享條件 |
| 分享成員管理 | [[訂單]] 分享成員欄「接單業務或被分享（編輯）者維護；業務主管、Supervisor 亦可管理」（D1） | `_lib/permissions.js:120-125` 一致；唯負責人途徑限 sales（見上列諮詢） | 動作角色 | 負責人途徑加 consultant |
| 分享候選人 | [[單據分享與職務代理]]「被授權同事（不限角色）」 | `_components/detail/SharingTab.js:48-50` 候選取 `SALES_PERSON_OPTIONS`；`mock-data.js:265` 只有三位業務與諮詢 | 分享不限角色 | 候選名冊涵蓋各角色 |
| 改派接單業務的時機 | [[訂單接單業務改派]] 主流程第 1 步「未取消的訂單（含已完成訂單）皆可改派」 | `_components/detail/InfoTab.js:198` `showReassign` 在訂單完成時隱藏（`readOnly` 為真且非已取消） | 改派 | 訂單完成時顯示改派入口 |
| 改派接單業務的角色 | 同卡「業務主管或 Supervisor」 | `_lib/permissions.js:298` `canReassignOwner` 一致 | 無落差 | — |

### 5. 售後服務單（after-sales，及訂單詳情的售後頁籤）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務、諮詢列表範圍 | [[單據存取範圍]] 上下層延伸「訂單 → 售後服務單」；拍板 D5「可見範圍跟著訂單…不再看建立者」 | `after-sales/page.js:146、180` 非主管視角只列 `opened_by === currentUser` | 可見範圍 | 改看所屬訂單的接單業務與分享成員 |
| 業務主管、會計、Supervisor 操作 | [[業務主管]]「售後服務單（全公司）」列在看得到但不能動；[[會計]] 同；[[Supervisor]] 不改單據 | `after-sales/page.js:28` 三者為主管視角；`orders/_components/detail/TicketRowActions.js:96、109` 送出決議與結案只看單據狀態，不看角色 | 動作角色 | 送出決議與結案限業務、諮詢（負責或編輯分享） |
| 建單者範圍 | [[售後服務]] 相關角色「業務／諮詢（建單、決議、結案）」 | `orders/_components/detail/AfterSalesTab.js:99-101` 不判角色，看得到訂單者都能建 | 動作角色 | 加負責人或編輯分享條件 |
| 改派 | [[售後服務]] 所屬訂單欄「售後服務單沒有改派」（D4） | Prototype 無售後改派入口 | 無落差 | — |
| 主管視角欄名 | — | `after-sales/page.js:326-331` 欄名「業務 / 諮詢」取 `opened_by`（建立者） | wiki 未定義 | 負責人改取訂單接單業務 |

### 6. 款項跨訂單清單（payment）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務、諮詢看待開發票、待退款、帳務異常 | [[單據存取範圍]] 上下層延伸「訂單 → 款項跨訂單清單中屬於該訂單的項目」；被分享也延伸（S3） | `payment/_lib/derive.js:41-44` `visibleForRole` 只認 `sales_person === userName`，不含被分享 | 可見範圍 | 加被分享（兩層級） |
| 應收款項清單 | 應收款項清單列「全公司：業務、諮詢、業務主管、會計、Supervisor」 | `payment/_lib/derive.js:39-40` 註明不套用過濾，全見 | 無落差 | — |

### 7. 印件（print-items 列表與詳情）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務看印件列表 | [[單據存取範圍]] 上下層延伸「旗下印件…屬訂單模組本身，範圍與訂單相同」 | `layout.js:39-44` 業務側欄有印件列表；`print-items/_lib/usePrintItemsFilter.js:54` 只用 `canSeeWorkOrderInList` 過濾，業務一律回真，看得到全公司有工單的印件 | 可見範圍 | 業務改依訂單範圍過濾 |
| 印件備註四欄編輯 | [[業務]] 負責的單據限自己負責的訂單（含印件） | `print-items/_lib/permissions.js:210-222` `printItemNotesEditGuard` 只判角色（業務、印務、印務主管），不判歸屬；諮詢不在名單 | 動作角色 | 業務加負責或編輯分享條件，補諮詢 |
| 印務列表範圍 | 拍板 X5「列表只列自己負責或被分享」屬介面預設篩選，正本在 Prototype | `usePrintItemsFilter.js:48-54` 依工單列表範圍過濾 | 無落差 | — |

### 8. 工單（work-orders）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 被分享（編輯）者執行負責人動作 | [[工單]] 負責人欄「負責人動作…限負責人與被分享（編輯）者」；[[單據存取範圍]] § 分享「對所有角色一律適用」 | `_lib/permissions.js:28-31` `canSubmitProcess`、`:48-51` `canEditProcess`、`:90-96` `canWithdrawProcess`、`:122-126` `canDeliverTasks`、`:202-205` `canAdjustTasks`、`:312-315` `canPreviewWorkOrder`、`:335-336` `canManageSharing`、`:457-468` `proofRequirementEditGuard` 皆先限 role 為 print_officer | 分享不限角色 | 拿掉角色條件，只看負責或編輯分享 |
| 工單詳情報工 | 同上 | `production-floor/_lib/permissions.js:99-107` `canPrintOfficerReport` 限印務與印務主管 | 分享不限角色 | 編輯分享者不限角色 |
| 分享候選人 | [[單據分享與職務代理]]「被授權同事（不限角色）」 | `_components/detail/SharingTab.js:50-51` 候選取 `PRINT_OFFICER_OPTIONS`；`_lib/mock-data.js:75` 只有兩位印務 | 分享不限角色 | 候選名冊涵蓋各角色 |
| 業務、諮詢經訂單延伸看工單 | [[單據存取範圍]] 上下層延伸「訂單 → 工單」 | 業務、諮詢側欄無工單列表；工單詳情 `detail/page.js` 無可見範圍判斷 | wiki 未定義 | 決定延伸看工單的入口（訂單詳情或印件詳情） |
| 改派負責人 | [[工單]] 負責人欄「限印務主管操作、改派時必選理由分類」 | `_lib/permissions.js:326-327` `canReassignWorkOrder` 一致 | 無落差 | — |
| 印務列表預設篩選 | 拍板 X5 | `_lib/permissions.js:345-351` `canSeeWorkOrderInList` 一致 | 無落差 | — |

### 9. 生產管理（production-floor）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| Supervisor 的範圍 | [[單據存取範圍]] 生產管理產線單元列「全公司：Supervisor」 | `_lib/sessionStore.js:30` 與 `production-floor/_lib/mock-data.js:103` 給 Supervisor 所屬產線全選；範圍函式 `production-floor/_lib/unit-scope.js:14-33` 照所屬產線判定 | 可見範圍 | 改為不看產線的全公司判定 |
| 權限名稱外露 | 拍板 W5「wiki 中的權限名稱刪除」；P1「權限項目怎麼切、叫什麼名字交給後端」 | `production-floor/_lib/permissions.js:237-286` `FLOOR_UNITS.permission` 為「管理生產任務（產線）」等；`production-floor/dispatch/page.js:465` 使用者可見提示「打包派工限持有「管理生產任務（產線）」權限者操作」 | 用詞 | 提示改寫為不含權限名稱 |
| 範圍用詞 | [[單據存取範圍]] § 範圍用詞「所屬產線」「自己負責」 | `production-floor/_lib/permissions.js:202-216`、`unit-scope.js:3-6`、`layout.js:102-104` 等註解用「產線」「負責」兩範圍；使用者可見文案未見 | 用詞 | 註解改用詞（不影響畫面） |
| 唯讀提示 | 角色名 [[Supervisor]] | `production-floor/_lib/permissions.js:335-336` 提示「主管在生產管理只有唯讀檢視…」 | 用詞 | 「主管」改 Supervisor |
| 各角色單元 | [[單據存取範圍]] 生產管理三列 | `production-floor/_lib/permissions.js:305-313` `ROLE_FLOOR_PERMISSIONS` 一致 | 無落差 | — |

### 10. 審稿（prepress-review）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 印務、印務主管、Supervisor 看審稿 | [[單據存取範圍]] 審稿列「全公司：訂單管理人、審稿主管、印務主管、印務、Supervisor」 | 三者側欄無審稿管理（見第 1 張表） | 可見範圍 | 側欄加待審訂單 |
| 審稿人員範圍 | 審稿列「自己負責：審稿人員」 | `prepress-review/_components/ReviewOrderList.js:93-99` reviewer 只取指派給自己的印件所屬訂單 | 無落差 | — |
| 分派 | [[審稿主管]]、[[訂單管理人]] 同權 | `prepress-review/_lib/selectors.js:163-164` 一致 | 無落差 | — |

### 11. 品檢與出貨（qc-shipping）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 業務看出貨單 | [[單據存取範圍]] 上下層延伸「訂單 → 出貨單」；出貨單列不含業務 | `qc-shipping/shipments/page.js:46-59` 不分角色列全部出貨單；動作才在 `useShipmentActions.js:204-207` 依訂單歸屬收窄 | 可見範圍 | 業務改只列自己負責或被分享訂單的出貨單 |
| 印務看品檢 | [[印務]]「品檢待驗清單與品檢紀錄（自己負責的工單底下的）」 | `qc-shipping/inspection/page.js:196-214` 不分角色列全部 | 可見範圍 | 印務依工單延伸過濾 |
| 業務、諮詢作廢出貨單 | [[出貨單]] 作廢歸業務（本盤點未逐欄核對出貨單卡） | `qc-shipping/_lib/next-status-options.js:122-123` 只判角色；呼叫端 `useShipmentActions.js:204-207` 先擋非負責者 | 無落差 | — |
| 品檢寫入 | [[品檢人員]] 負責品檢紀錄 | `print-items/_lib/permissions.js:54-61`、`inspection/page.js:155` 限 qc_inspector | 無落差 | — |

### 12. 派單（dispatch-orders）

| 角色或動作 | wiki 正本 | Prototype 現況 | 落差類型 | 要改什麼 |
|---|---|---|---|---|
| 印務主管看派單 | 派單列「全公司：印務、印務主管、揀貨人員、Supervisor」 | print_manager 側欄無派單管理（見第 1 張表） | 可見範圍 | 側欄加派單列表 |
| 派單操作 | [[印務]]「派單（全公司）：外發的聯繫、指派供應商與推進」 | `dispatch-orders/_lib/permissions.js:41-57、88-135` 操作限 print_officer，點收段限 picker | 無落差 | — |

---

## 二、測試落差

| 檔案:行或情境目錄節號 | 現行斷言 | 依 wiki 應為 |
|---|---|---|
| `tests/unit/quote/quote-rules.test.mjs:142-143` | `canManageQuote` 對印務主管吳國豪（已被指派評估）回假 | 評估印務主管為被分享（編輯），應回真 |
| `tests/unit/quote/quote-rules.test.mjs:146-152` | `canCompleteEstimate` 對評估印務主管回假 | [[需求單狀態]]：被分享（編輯）者可執行業務可執行的轉換，應回真 |
| `tests/unit/quote/quote-rules.test.mjs:162-165` | 「評估印務主管因指派取得的編輯授權不含刪除」，`canDeleteQuote` 回假 | [[需求單狀態]] 刪除列：評估印務主管也可刪除，應回真 |
| `tests/unit/quote/quote-rules.test.mjs:167-171` | 業務主管看不到無關需求單 | 業務主管為全公司，應看得到 |
| `tests/unit/quote/quote-rules.test.mjs:181-186` | `canReassignQuoteOwner` 對 Supervisor 回假 | Supervisor 可改派（X4b），應回真 |
| `tests/unit/quote/quote-rules.test.mjs:189-197` | 評估印務主管只在待評估、已評估兩階段可改成本 | 需求確認中也可改；缺此斷言 |
| `tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:27` | `canCancelOrder` 對業務主管回假 | 業務主管可跨單取消（R1），應回真 |
| `tests/unit/orders/order-completion-no-print-items.test.mjs:103` | `canAdvanceOrderStatus` 對業務主管回假 | 業務主管可代操作任何訂單（R1）；是否含手動推進見第三節第 2 條 |
| `tests/unit/orders/review-gate-and-print-item-delete.test.mjs:210-218、228-235` | 業務主管送主管審核回權限不足 | 同上，代操作是否含送審未定義（第三節第 2 條） |
| `tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:182-184` | 業務主管不可建出貨單 | [[業務主管]] 出貨單列在看得到但不能動，與代操作任何訂單並存（第三節第 2 條） |
| `tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:168-178` | 被分享（編輯）建出貨單的斷言只用業務、諮詢角色 | 被分享（編輯）不論角色；缺非業務角色的斷言 |
| `tests/e2e/01-quote/quote-request.spec.mjs:550-561`（情境目錄 1.13） | 評估印務主管列上沒有編輯與刪除鈕 | 評估印務主管可改成本與刪除，應有入口 |
| `tests/e2e/01-quote/quote-request.spec.mjs:574-580`（情境目錄 1.14） | 業務主管在分享前看不到該需求單 | 業務主管為全公司，應看得到 |
| 情境目錄 1.14 說明（`docs/scenario-catalog.md:146`） | 「業務主管的可見範圍依 2026-09-08 裁定維持後端現況」 | 已由 W3 改為全公司 |
| 情境目錄 1.15（`docs/scenario-catalog.md:151`）與 e2e `01-quote/quote-request.spec.mjs:603-644` | 「改派是管理動作，收歸業務主管」，只測業務主管 | 業務主管或 Supervisor；缺 Supervisor 情境 |
| `tests/e2e/02-order-setup/sharing-members.spec.mjs:50-60`（情境目錄 2.10） | 諮詢張惠雯以分享成員身分改訂單備註成功；mock 中張惠雯為檢視層級（`orders/mock-data.js:525` 為字串，`orders/_lib/store.js:135` 正規化為 `view`） | 檢視層級「任何修改入口都不開放」；應改用編輯（代理）層級成員，並補檢視層級改不了的斷言 |
| 情境目錄 2.10「未實作」（`docs/scenario-catalog.md:319`） | 「訂單的分享沒有檢視與編輯（代理）兩個層級的下拉」 | Prototype 已有層級（`orders/_lib/permissions.js:101-106`）；描述過期 |
| 情境目錄 9.12（`docs/scenario-catalog.md:1747-1754`） | 「主管王大明，所屬產線全選」 | Supervisor 為全公司，不看所屬產線；角色名用 Supervisor |
| 情境目錄 14.10、14.28（`docs/scenario-catalog.md:2986、3124-3126`） | 「權限分『產線』與『負責』兩種範圍」 | 範圍用詞為所屬產線、自己負責 |
| 情境目錄 10.40（`docs/scenario-catalog.md:2246`）與 `tests/e2e/10-report-transfer/transfer-tickets.spec.mjs:465` | 候選「持『管理轉交單（負責）』權限的人員」 | 權限名稱不寫進 wiki（W5）；改寫為「廠務」或「我的轉交單的持有角色」 |
| 情境目錄 14.15（`docs/scenario-catalog.md:3029`） | 新增視窗候選「排除負責人本人與既有成員」 | 未斷言候選不限角色；Prototype 候選只有印務 |
| 售後服務單可見範圍 | 測試與情境目錄皆無業務列表範圍的斷言 | 應新增「業務看得到自己負責或被分享訂單的售後服務單」 |
| 款項跨訂單清單可見範圍 | `tests/unit/payment/` 無 `visibleForRole` 斷言 | 應新增被分享者看得到的斷言 |

---

## 三、wiki 本身矛盾或未定義

以下逐條附兩邊原文，不作調和。

1. 分享候選人是否不限角色。
   - [[單據分享與職務代理]] 主流程第 2 步：「被授權同事（不限角色）」。[[單據存取範圍]] § 為什麼這樣定：「分享不看角色」。
   - 同卡 § 範圍外：「可被授予者的候選範圍（哪些角色、是否限同組）與授權清單的呈現方式 → 屬實作規格，本卡不約束」。

2. 業務主管「代操作任何訂單」的範圍未定義。
   - [[業務主管]] § 職務範圍：「訂單的代操作、分享管理與跨單取消（全公司；管理權責仍在接單業務）」。§ 職責邊界：「業務主管可代操作任何訂單」。
   - 同卡 § 職務範圍「看得到但不能動」：「售後服務單（全公司）、出貨單（全公司）」。
   - 未寫明代操作是否涵蓋訂單下層單據（出貨單、售後服務單）。
   - 未寫明代操作是否涵蓋「送主管審核」。業務主管同時是核准者，Prototype 註解（`orders/_lib/permissions.js:48-50`）以「業務自己核准自己的單」為由擋住手動推進前兩格。

3. 業務對審稿印件是否可操作。
   - [[業務]] § 職務範圍：「看得到但不能動：工單、品檢紀錄、審稿印件（自己負責的訂單底下的…查閱以回覆客戶，不操作）」。
   - 同卡 § 主要職責 2：「逐件確認印件可製作…印件合格後客戶要改稿時退回重審」。[[諮詢]] § 職責邊界：「確認可製作與退回重審同權」。
   - 拍板矩陣（`role-module-scope-matrix.md:38`）原寫「訂單 → 審稿模組中屬於該訂單的印件｜可操作」，V1 後範圍卡不寫可否操作。

4. 評估印務主管是否算被分享（編輯）：wiki 與 Linear 暫行拍板不一致。
   - [[需求單]] 評估印務主管欄：「被指派者由系統自動列入分享成員（編輯（代理）層級）…可做接單業務能做的事，含刪除」。
   - 拍板 K8：「照現行 Linear 時，評估指派不算被分享（編輯）：評估印務主管只能改成本估算與預計產線」。K13：「評估印務主管不列在分享成員清單」。
   - K1 寫明此為 Linear 暫行，權限修正完成後改成 wiki 版。Prototype 與測試現況等同 K8、K13。

5. 售後服務單「自己負責」看哪一欄：計畫檔與拍板不一致。
   - `role-module-scope-matrix.md:24`（用詞標準化覆寫段，宣告「優先於本檔其餘內容」）：「售後服務單｜建立者」。`:146`：「售後服務單的『自己負責』＝建立者」。
   - 拍板 D5：「售後服務單的可見範圍跟著訂單…不再看建立者」。[[單據存取範圍]] § 各單據看哪一欄無售後服務單列，上下層延伸列有「訂單 → 售後服務單」。

6. 改派單據種類：計畫檔與拍板不一致。
   - `downstream-list.md:3` 變動編號 4：「Supervisor 可改派四種單據」。
   - 拍板 D4：「X4c 修正為 Supervisor 可改派諮詢單、需求單、訂單三種單據的接單業務」。

7. 「改派限縮三種」的適用對象。
   - 拍板 D4 原文限定「Supervisor 可改派…接單業務」。
   - [[工單]] 負責人欄：「全生命週期可改派…限印務主管操作」。[[單據分享與職務代理]] § 範圍外：「工單由 [[印務主管]] 改派」。
   - 工單負責人改派不在 D4 原文範圍內；若 D4 意指全系統只有三種單據可改派，則與工單卡衝突。需確認解讀。

8. 範圍用詞數量：拍板 S1 與 V1 不一致。
   - S1：「範圍用詞定為六個：全公司（檢視）、全公司（編輯）、自己負責、被分享（檢視）、被分享（編輯）、所屬產線」。`role-module-scope-matrix.md:16` 照此寫六個。
   - V1（推翻 X2、M2）：「全公司、自己負責、被分享（檢視）、被分享（編輯）、所屬產線」。[[單據存取範圍]] § 範圍用詞照 V1 寫五個。
   - 矩陣檔第 16 行與第 149-160 行定案用詞表仍是舊版。

9. 被分享（檢視）者在下層模組的延伸是否含工單詳情。
   - [[單據分享與職務代理]] 主流程第 3 步：「工單的情形：列表不再帶出，詳情仍可開但負責人動作不開放」。
   - [[單據存取範圍]] § 範圍外：「列表預設只列自己負責或被分享的工單。這屬介面預設篩選，正本在 Prototype」。
   - 兩段一致，但情境卡把介面預設篩選寫進成立判準，屬正本歸屬交疊，非矛盾。列出供確認是否要從情境卡移除。

10. 業務、諮詢經上下層延伸看工單、出貨單、品檢紀錄的入口未定義。
    - [[單據存取範圍]] 上下層延伸表列「訂單 → 工單」「訂單 → 出貨單」「訂單 → 品檢紀錄」。
    - [[單據存取範圍]] § 規則：「看哪個模組，就用哪個模組的範圍」。工單模組、品檢待驗清單模組的全公司名單都不含業務、諮詢。
    - 未寫明業務是在工單模組列表裡看到「自己訂單底下的工單」，還是只在訂單或印件詳情的頁籤看到。

---

## 四、Prototype 有、wiki 沒有

| # | Prototype 行為 | 位置 | wiki 狀況 |
|---|---|---|---|
| 1 | 業務、諮詢經「被指派為審核主管」看得到訂單 | `orders/_lib/permissions.js:91-98` | X6 不收為範圍用詞；wiki 無此途徑 |
| 2 | 需求單、訂單詳情頁可直連開啟，不判可見範圍 | `quote-prototype/detail/page.js`、`orders/detail/page.js:65-90` | wiki 只定列表範圍；直連未定義（工單直連另有 X5 前例） |
| 3 | 會計、訂單管理人、審稿主管、Supervisor、業務主管可編輯訂單資訊、備註、單價、收款項目、款項紀錄、附件，可建訂單異動與售後服務單 | 第一節第 4 張表「看得到但不能動的角色可改訂單內容」一列 | wiki 列為看得到但不能動（業務主管代操作除外） |
| 4 | 業務主管、會計、Supervisor 可送出售後決議與結案 | `orders/_components/detail/TicketRowActions.js:96、109` | wiki 列為唯讀檢視 |
| 5 | 印務、印務主管、生管、品檢人員看得到出貨單；業務、揀貨人員、出貨人員、生管、印務看得到品檢待驗清單全部 | `layout.js:182、204、205-212、213、216-218` | wiki 範圍表未給 |
| 6 | 業務看得到全公司有工單的印件，並可編輯任一印件的備註四欄 | `print-items/_lib/usePrintItemsFilter.js:54`、`print-items/_lib/permissions.js:210-222` | wiki 範圍同訂單 |
| 7 | Supervisor 在生產管理以「所屬產線全選」取得全貌 | `_lib/sessionStore.js:30`、`production-floor/_lib/mock-data.js:103` | wiki 為全公司，不經所屬產線 |
| 8 | 生產管理使用者可見提示含權限名稱 | `production-floor/dispatch/page.js:465` | W5 刪除權限名稱 |
| 9 | 訂單「確認可製作」「退回重審」任一業務或諮詢都按得到（不看歸屬） | `orders/_lib/permissions.js:247、255` | wiki 歸自己負責的訂單 |
| 10 | 未認列訂單異動任何看得到訂單的人都能取消 | `orders/_lib/permissions.js:335-336` | wiki 歸接單業務 |

## 五、落差筆數

只計第一節「落差類型」非「無落差」的列。

| 模組 | 筆數 |
|---|---|
| 共用側欄 | 16 |
| 需求單 | 11 |
| 諮詢單 | 1 |
| 訂單 | 14 |
| 售後服務單 | 4 |
| 款項跨訂單清單 | 1 |
| 印件 | 2 |
| 工單 | 4 |
| 生產管理 | 4 |
| 審稿 | 1 |
| 品檢與出貨 | 2 |
| 派單 | 1 |
| 合計 | 61 |

測試落差 23 筆。wiki 矛盾或未定義 10 筆。Prototype 有、wiki 沒有 10 筆。
