# 單據權責：活動清單與 Prototype、測試的落差盤點（第二版，2026-10-14）

只讀盤點。本檔以活動清單卡為判準；舊版 [asis-gap.md](asis-gap.md) 只用來定位程式位置。

## 盤點基準

| 項目 | 基準 |
|------|------|
| wiki | Sens 主線 master，提交 `83c6b04`；判準為 `04-business-logic/服務藍圖/<流程群組>/<階段>活動清單.md` 活動表、`05-entities/` 操作段、`營運規則/受控清單.md`（含未列即不可做、G61、G63） |
| 拍板 | `grill.md` G1 至 G63、C1、C2 |
| Prototype | erp repo 分支 `prototype/production-stage`，提交 `6c728709`（2026-10-13）；工作目錄即在該分支，未切換、未拉取 |
| 測試 | Sens `erp-prototype-tests/`，隨 Sens `83c6b04`（該目錄最後一次提交 `90b88f6`） |
| 路徑寫法 | 下文 `P/` 代表 `erp/apps/erp/src/app/(prototype)/`；`T/` 代表 `Sens/erp-prototype-tests/` |

落差類型：

| 類型 | 意思 |
|------|------|
| 可見範圍 | 看得到哪些單與活動表不同 |
| 動作角色 | 活動表有列的角色做不了（含 Prototype 未實作該操作） |
| 多給權限 | Prototype 允許、活動表沒有列（違反未列即不可做） |
| 分享 | 被分享（編輯）者或分享候選人被角色卡住 |
| 改派 | 改派執行者或時機不同 |
| 用詞 | 使用者看得到的文字與 wiki 用詞不同 |
| wiki 未定義 | Prototype 有行為，wiki 沒有規則；不判對錯 |

## 一、根因（先讀）

| 根因 | 影響範圍 |
|------|---------|
| 訂單詳情各頁籤的編輯入口只看訂單狀態，不看角色與歸屬（`P/orders/detail/page.js:92` `readOnly = isOrderTerminal`） | 能進訂單詳情的人都能改訂單、帳務、異動、售後；會計與檢視層級分享者也能改 |
| 少數動作改用角色名單把關，名單只有業務（或加諮詢），不看歸屬 | G61 的六個全公司協助角色做不了；別人的訂單反而按得到 |
| 工單側動作一律先判 `role === 'print_officer'` | G62、G63 的印務主管代做與非印務的編輯分享者做不了 |
| 側欄 `P/layout.js:181-219` `ROLE_VISIBLE_ITEMS` 決定模組入口 | 入口與活動表的全公司名單不一致；模組頁本身多半不再過濾 |
| 分享候選名冊只放業務或印務 | 「所有角色」被分享的活動列無從發生 |

## 二、落差總表

### 1. 共用側欄（模組入口）

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-001 | 訂單 | ACT-VORD-007、008、009 | 印務主管、印務、審稿主管可看全公司訂單 | `P/layout.js:203-212` 三角色無訂單管理群組 | 可見範圍 | 無 |
| V2-002 | 訂單 | （無列）、G48 | 會計不在訂單模組，從款項清單進入 | `P/layout.js:185` 會計有「訂單管理」；款項清單每列連到訂單詳情（`P/payment/receivable/page.js:35` 等四頁） | 多給權限 | `T/tests/e2e/03-payment/reconciliation-lists.spec.mjs:10`（3.11） |
| V2-003 | 工單 | ACT-VPRD-029、030 | 生管、訂單管理人可看全公司工單 | `P/layout.js:202、213` 兩角色無工單管理 | 可見範圍 | 無 |
| V2-004 | 印件（審稿） | ACT-VPRD-004、005、006 | 印務主管、印務、Supervisor 可看全公司審稿印件 | `P/layout.js:186-212` 三角色無審稿管理 | 可見範圍 | 無 |
| V2-005 | 出貨單 | ACT-VDLV-006 | 業務主管可看全公司出貨單 | `P/layout.js:183` 業務主管無品檢與出貨群組 | 可見範圍 | 無 |
| V2-006 | 出貨單 | （無列） | 印務、印務主管、生管、品檢人員無出貨單檢視活動 | `P/layout.js:204、205-212、213、216` 四角色有出貨管理 | 多給權限 | 無 |
| V2-007 | 售後服務單 | ACT-VDLV-012、013 | 會計、Supervisor 可看全公司售後服務單 | `P/layout.js:185-200` 兩角色側欄無售後服務；`P/after-sales/page.js:28` 卻把會計、Supervisor 算主管視角 | 可見範圍 | 無 |
| V2-008 | 派單 | ACT-VPRD-067 | 印務主管可看全公司派單 | `P/layout.js:205-212` 無派單管理 | 可見範圍 | 無 |
| V2-009 | 需求單、訂單、工單等 | 所有「所有角色　被分享」列 | 任何角色被分享後都看得到該單 | 被分享者若側欄沒有該模組（如會計、生管被分享訂單），沒有入口；詳情頁可直連 | 分享 | 無 |
| V2-010 | 角色名 | — | 角色卡名 Supervisor | `P/_lib/sessionStore.js:30` 標籤「主管」；`P/production-floor/_lib/permissions.js:335`、`P/production-floor/_lib/transfer-rules.js:333` 提示「主管在生產管理只有唯讀檢視」 | 用詞 | 9.12 說明文字 |
| V2-011 | 生產任務 | — | 權限名稱不寫進介面（W5） | `P/production-floor/dispatch/page.js:465` 提示「限持有「管理生產任務（產線）」權限者操作」 | 用詞 | 10.40 候選描述 |
| V2-012 | 派單、貨運單 | ACT-VPRD-070、075、ACT-FLW-023、026、027 | 外包廠商、中國廠商自己負責 | `P/_lib/sessionStore.js:24-54` 名冊無這兩個角色 | 動作角色（未實作；G53 外包另案） | 無 |

### 2. 需求單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-013 | 需求單 | ACT-VPRE-005 | 業務主管看全公司需求單 | `P/quote-prototype/_lib/permissions.js:101-106` 業務主管只看相關的單 | 可見範圍 | `T/tests/unit/quote/quote-rules.test.mjs:171`；e2e `01-quote/quote-request.spec.mjs:576`（1.14） |
| V2-014 | 需求單 | ACT-VPRE-001、G36 | 自己負責只看接單業務；建立者欄不給權限 | `P/quote-prototype/_lib/permissions.js:14-19、91-94` 建立者也算可看、可管理 | 多給權限 | 1.14 說明「自己建立」 |
| V2-015 | 需求單 | ACT-REQ-012、017、022、ACT-EST-005、010、011、030、035、040、ACT-DEAL-005、010、015、020 | 被分享（編輯）的所有角色可編輯、刪除、推進 | `P/quote-prototype/_lib/permissions.js:26-27` `canManageQuote` 先限業務或諮詢 | 分享 | 無 |
| V2-016 | 需求單 | ACT-EST-011、[[需求單]] 評估印務主管欄 | 評估印務主管由系統列入分享成員（編輯），可做編輯分享者能做的全部動作 | `P/quote-prototype/_lib/permissions.js:59-69` 只改成本與預計產線、限兩個狀態；`:110-112` 不含刪除；`P/quote-prototype/detail/page.js:1001-1026` 分享成員清單不列評估印務主管 | 動作角色 | `quote-rules.test.mjs:143、150、159、164、189-197`；e2e `quote-request.spec.mjs:563`（1.13） |
| V2-017 | 需求單 | ACT-RAS-001 | 業務主管、Supervisor 可改派接單業務 | `P/quote-prototype/_lib/permissions.js:119-120` 只給業務主管 | 改派 | `quote-rules.test.mjs:184`；e2e `quote-request.spec.mjs:616`（1.15 只測業務主管） |
| V2-018 | 需求單 | ACT-REQ-003、007、G36 | 複製後新單接單業務是執行複製的人 | `P/quote-prototype/_lib/store.js:253-266` 接單業務沿用來源單 | 動作角色 | e2e `quote-request.spec.mjs:930`（1.25） |
| V2-019 | 需求單 | ACT-SHR-005 | 被分享（編輯）的所有角色可管理分享成員 | 分享管理同 `canManageQuote`，限業務、諮詢 | 分享 | 無 |
| V2-020 | 需求單 | ACT-SHR-001、005 | 分享對象不限角色 | `P/quote-prototype/detail/page.js:570-573` 候選取 `MOCK_ADMIN_USERS`；`P/quote-prototype/mock-data.js:28-40` 只有業務與印務主管，且林雅婷、黃聖雯標成印務主管，與 `sessionStore` 的業務主管、訂單管理人不一致 | 分享 | 無 |
| V2-021 | 需求單 | （無列） | 未列的角色不能看需求單 | `P/quote-prototype/_lib/permissions.js:103-104` 非業務部門角色一律回真；詳情頁無範圍判斷，直連可開 | 多給權限 | 無 |
| V2-022 | 需求單 | — | 欄名「分享成員」「評估印務主管」 | `P/quote-prototype/detail/page.js:1002` 頁籤「權限管理」；`:1253` 欄名「評估印務」 | 用詞 | 1.15 斷言「權限管理顯示尚無授權人員」 |

### 3. 諮詢單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-023 | 諮詢單 | ACT-CLM-001 至 003、ACT-CON-001、002、ACT-EXIT-001 至 004、ACT-RAS-002、ACT-VPRE-007 至 010 | 諮詢認領、筆記、出口分流；業務主管代派、代為取消；改派 | `P/layout.js:29` 諮詢單列表 `path: null`，模組未建 | 動作角色（未實作） | 無 |

### 4. 訂單（含訂單頁籤內的帳務、異動）

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-024 | 訂單 | ACT-VORD-001、002、003 | 業務、諮詢看自己負責與被分享 | `P/orders/_lib/permissions.js:91-98` 多一條「被指派為審核業務主管」 | 多給權限 | 無 |
| V2-025 | 訂單 | （無列） | 未列的角色不能看 | `P/orders/detail/page.js:65-90` 只判訂單存在，直連可開 | 多給權限 | 無 |
| V2-026 | 訂單 | ACT-APV-001 至 006、014 至 016（OP-ORD-002） | 編輯限自己負責、被分享（編輯）、六個全公司協助角色 | `P/orders/_components/detail/InfoTab.js:212、240、441、522、604、623、646` 只看訂單狀態；會計、檢視層級分享者、經審核主管途徑看到的業務都能改 | 多給權限 | e2e `02-order-setup/sharing-members.spec.mjs:49-60`（2.10：檢視層級的張惠雯改交貨備註成功） |
| V2-027 | 訂單 | ACT-SIGN-001 至 012（OP-ORD-011、012、013） | 已送報價單、確認回簽、上傳回簽限三類編輯者 | `P/orders/detail/page.js:292-303` 兩鈕無任何角色條件；`P/orders/_components/detail/AttachmentsTab.js:135、162` 只看 `readOnly` | 多給權限 | 無 |
| V2-028 | 訂單 | ACT-APV-012（OP-ORD-009） | 六個全公司協助角色可協助送審 | `P/orders/_lib/permissions.js:169-172` 限業務或諮詢本人或編輯分享 | 動作角色 | `T/tests/unit/orders/review-gate-and-print-item-delete.test.mjs:210-218、227-235`；e2e `review-gate.spec.mjs:185`（2.17） |
| V2-029 | 訂單 | ACT-APV-011 | 被分享（編輯）的所有角色可送審 | 同上，先限業務或諮詢 | 分享 | 無 |
| V2-030 | 訂單 | ACT-APV-020、021、022（OP-ORD-015） | 取消訂單限三類編輯者 | `P/orders/_lib/permissions.js:73` 任一業務即可，不看歸屬；諮詢、六個協助角色、非業務的編輯分享者不可；`P/orders/_lib/cancel-actions.js:110` 寫入同 | 動作角色、多給權限 | `T/tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:27` |
| V2-031 | 訂單 | ACT-DONE-001、002、003（OP-ORD-014） | 手動推進限三類編輯者 | `P/orders/_lib/permissions.js:65-66` 任一業務即可；諮詢與協助角色不可 | 動作角色、多給權限 | `T/tests/unit/orders/order-completion-no-print-items.test.mjs:102-103` |
| V2-032 | 訂單 | ACT-APV-029、030、031（OP-ORD-003） | 新增印件限三類編輯者 | `P/orders/_components/detail/ItemsTab.js:263、1329` 只看狀態 | 多給權限 | 無 |
| V2-033 | 訂單 | ACT-APV-007、008、009（OP-ORD-004） | 刪除印件限三類編輯者 | `P/orders/_lib/permissions.js:182-185` 限業務或諮詢；印務主管等協助角色不可 | 動作角色、分享 | `review-gate-and-print-item-delete.test.mjs:329-345`；e2e `04-order-print-item/delete-print-item.spec.mjs:137`（4.20） |
| V2-034 | 訂單 | ACT-APV-017、018、019（OP-ORD-008） | 複製訂單，新單接單業務記執行者 | Prototype 無複製訂單 | 動作角色（未實作） | 無 |
| V2-035 | 訂單 | ACT-SHR-006 | 諮詢對自己負責的訂單可管理分享 | `P/orders/_lib/permissions.js:122` 負責人途徑只認業務 | 分享 | `ch2-order-lifecycle-rules.test.mjs:81-91` 未含諮詢 |
| V2-036 | 訂單 | ACT-SHR-006 至 008 | 分享對象不限角色 | `P/orders/_components/detail/SharingTab.js:48`；`P/orders/mock-data.js:265` 只有三位業務、諮詢 | 分享 | 無 |
| V2-037 | 訂單 | ACT-RAS-003、[[訂單接單業務改派]] 第 1 步 | 未取消的訂單（含訂單完成）可改派；已取消不可改派 | `P/orders/_components/detail/InfoTab.js:198` `showReassign` 條件為「非終態或已取消」：已取消時顯示、訂單完成時隱藏，兩頭都反 | 改派 | 無 |
| V2-038 | 訂單異動 | ACT-CHG-001 至 003、006 至 011、014 至 019 | 建立、編輯、送審、確認生效、取消限三類編輯者 | `P/orders/_components/detail/AdjustmentsTab.js:402-410` 建立只看狀態；`P/orders/_lib/permissions.js:335-336` 未認列的取消不判角色與歸屬 | 多給權限 | 無 |
| V2-039 | 訂單異動 | ACT-CHG-020 | 取消已認列的異動限該訂單審核業務主管本人 | `P/orders/_lib/permissions.js:335-336` 任一業務主管即可 | 多給權限 | 無 |
| V2-040 | 收款項目、發票、折讓、款項紀錄 | ACT-BPL-001 至 012、ACT-INV-001 至 018、ACT-RCV-001 至 012、ACT-CSH-001 至 006 | 限三類編輯者 | `P/orders/_components/detail/billing/InstallmentSection.js:219、237、263`、`PaymentRecordSection.js:173、219` 只看 `readOnly`；`InvoiceSection.js:160` 只看是否已取消 | 多給權限 | 無 |
| V2-041 | 出貨單 | ACT-SHP-028（OP-ORD-001） | 六個協助角色可協助建出貨單草稿 | `P/orders/_lib/permissions.js:313-316` 限業務或諮詢 | 動作角色 | `ch2-order-lifecycle-rules.test.mjs:181-184` |
| V2-042 | 出貨單 | ACT-SHP-003 | 被分享（編輯）的所有角色可建草稿 | 同上 | 分享 | `ch2-order-lifecycle-rules.test.mjs:167-178` 只測業務、諮詢 |
| V2-043 | 售後服務單 | ACT-AFR-001、002、011（OP-ORD-007） | 建售後服務單限三類編輯者 | `P/orders/_components/detail/AfterSalesTab.js:99-101` 只看訂單狀態與未結案單 | 多給權限 | 無 |

### 5. 印件

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-044 | 印件 | ACT-VORD-010 | 業務、諮詢只看自己負責或被分享訂單的印件 | `P/print-items/_lib/usePrintItemsFilter.js:54` 業務一律回真，看得到全公司有工單的印件 | 可見範圍 | 無 |
| V2-045 | 印件 | ACT-APV-023 至 025（OP-PI-001） | 編輯印件限三類編輯者 | `P/orders/_lib/permissions.js:241-242` 任一業務即可，不看歸屬；諮詢、協助角色不可 | 動作角色、多給權限 | 無 |
| V2-046 | 印件 | ACT-APV-026 至 028、ACT-PLAN-016、017、042（OP-PI-002） | 規格備註、包裝備註：業務與諮詢（訂單）、編輯分享者、六個協助角色、印務（工單）、印務主管 | `P/print-items/_lib/permissions.js:210-222` 限業務、印務、印務主管，不看歸屬；諮詢、業務主管、訂單管理人、審稿主管、Supervisor 不可 | 動作角色、多給權限 | 無 |
| V2-047 | 印件 | ACT-APV-025（OP-PI-001；稿件備註屬一般欄位） | 印務以全公司協助角色可改稿件備註 | 印件備註側板對印務鎖稿件備註 | 動作角色（見第五節第 3 條） | e2e `07-process-planning/proof-and-notes.spec.mjs:76`（7.27） |
| V2-048 | 印件 | ACT-ART-001 至 003、ACT-WOA-001 至 003（OP-PI-003、011） | 開討論串限三類編輯者 | `P/orders/_components/detail/ItemsTab.js:1375-1390` 只看狀態 | 多給權限 | 無 |
| V2-049 | 印件 | ACT-ART-006 至 014（OP-PI-005） | 上傳稿件、補件限三類編輯者 | `P/orders/_lib/permissions.js:227` 任一業務即可；諮詢與協助角色不可 | 動作角色、多給權限 | 無 |
| V2-050 | 印件 | ACT-ART-017 至 022（OP-PI-008、009） | 確認可製作、退回重審限三類編輯者 | `P/orders/_lib/permissions.js:247、255` 只判業務或諮詢角色，不看歸屬 | 動作角色、多給權限 | `T/tests/unit/orders/confirm-producible-roles.test.mjs:13-17`（斷言業務主管、訂單管理人、印務、Supervisor 不可） |
| V2-051 | 印件 | ACT-ART-023 至 025（OP-PI-010） | 填打樣結果限三類編輯者 | `P/orders/_lib/permissions.js:264`、`P/print-items/_lib/permissions.js:177` 只判業務或諮詢角色 | 動作角色、多給權限 | 無 |
| V2-052 | 印件 | ACT-ART-026 至 028（OP-PI-019） | 取消製作限三類編輯者 | `P/orders/_lib/permissions.js:84-87` 任一業務即可 | 動作角色、多給權限 | 無 |
| V2-053 | 印件 | ACT-INSP-003 至 011（OP-PI-020、021、022） | 缺口處置與補做：印務（自己負責工單）、工單編輯分享者、印務主管 | `P/print-items/_lib/permissions.js:38-45、88-91` 只判印務或印務主管角色，任一印務可處置別人的工單 | 多給權限、分享 | 無 |
| V2-054 | 印件 | ACT-MFG-019、020、024（OP-PI-023） | 短出結案同上 | `P/print-items/_lib/permissions.js:141-143`、`P/print-items/_components/ShortCloseAction.js:50` 同上 | 多給權限、分享 | 無 |
| V2-055 | 印件 | ACT-AFH-003、004、006（OP-PI-020） | 售後補做同上 | `P/print-items/_components/RemakeAction.js:149、196` 同上 | 多給權限、分享 | 無 |
| V2-056 | 印件 | ACT-WOA-009（OP-PI-025） | 印務可自行加開工單（全公司） | `P/work-orders/_lib/permissions.js:370-372` 限印務主管 | 動作角色（未實作） | 無 |
| V2-057 | 印件 | ACT-PLAN-011、014（OP-PI-016、017） | 被分享（編輯）的所有角色可改製程說明與品檢需求、印務印件檔案 | `P/work-orders/_lib/permissions.js:506、545` 非印務一律擋 | 分享 | `T/tests/unit/work-orders/rules-print-item-officer-files-guard.test.mjs:64-67` 只測業務、生管為非分享者，未涵蓋 |
| V2-058 | 印件 | — | 欄位與頁籤層級可見性不寫（XM-016） | `P/print-items/_lib/permissions.js:18-30、197-198` 成本、利潤欄依角色、會計不看生產頁籤 | wiki 未定義 | 14.6、14.8、15.10 |

### 6. 審稿（印件審稿面）

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-059 | 印件 | ACT-VPRD-001 至 003、ACT-ART-004、005、015、016 | 審稿人員自己負責；訂單管理人、審稿主管分派 | `P/prepress-review/_lib/selectors.js:163-164、189-194、216-221`、`_components/ReviewOrderList.js:93-99` 一致 | 無落差 | — |

### 7. 工單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-060 | 工單 | ACT-PLAN-034、036、037、038、039、043（G62） | 印務主管可協助建生產任務、送審、收回、交付、發起異動 | `P/work-orders/_lib/permissions.js:28-31、48-51、90-96、122-126、202-205` 先限印務 | 動作角色 | 無 |
| V2-061 | 工單 | ACT-PLAN-002、019、023、025、027、029 | 被分享（編輯）的所有角色可做負責印務的動作 | 同上 | 分享 | 無 |
| V2-062 | 工單 | ACT-PLAN-035 | 印務主管可協助維護確樣需求 | `P/work-orders/_lib/permissions.js:457-468` 確樣需求排除印務主管 | 動作角色 | 無 |
| V2-063 | 生產任務 | ACT-PLAN-041、[[生產任務]] 目的站點欄 | 印務主管可協助改目的站點與產線；任務作廢、報廢前皆可改 | `P/work-orders/_lib/permissions.js:63-66` 印務主管要等製程核可後 | 動作角色 | `T/tests/unit/work-orders/rules-production-line.test.mjs:235、281-285`；e2e `08-process-review-deliver/delivery-status.spec.mjs:231`（8.19） |
| V2-064 | 工單 | ACT-VPRD-078、ACT-OUT-010 | 印務主管可預覽、列印工單單據 | `P/work-orders/_lib/permissions.js:299-300、312-315` 預覽限印務、列印限印務與生管 | 動作角色 | e2e `print-sheet.spec.mjs:124`（8.7） |
| V2-065 | 工單 | ACT-OUT-002 | 列印限自己負責的印務 | `P/work-orders/_lib/permissions.js:299-300` 任一印務皆可，不看歸屬 | 多給權限 | 8.7 |
| V2-066 | 工單 | （無列） | 生管沒有列印工單單據活動 | `P/work-orders/_lib/permissions.js:299-300` 生管可列印 | 多給權限（見第五節第 4 條） | e2e `print-sheet.spec.mjs:124`（8.7 標題「列印權限限印務與生管」） |
| V2-067 | 工單 | ACT-SHR-010、011 | 被分享（編輯）的所有角色、印務主管可管理工單分享 | `P/work-orders/_lib/permissions.js:335-336` 限印務 | 分享、動作角色 | e2e `14-query-ui/work-orders.spec.mjs:221`（14.15 斷言印務主管無新增鈕） |
| V2-068 | 工單 | ACT-SHR-009 至 011 | 分享對象不限角色 | `P/work-orders/_components/detail/SharingTab.js:51`；`P/work-orders/_lib/mock-data.js:75` 只有兩位印務 | 分享 | 14.15 |
| V2-069 | 工單 | ACT-VPRD-034 至 036 | 業務、諮詢經訂單看工單 | 入口只有印件詳情的工單頁籤；印件列表範圍見 V2-044 | 可見範圍（入口未定義，見第五節第 6 條） | 14.8 |
| V2-070 | 工單 | ACT-RAS-005、ACT-WOA-005 至 008、ACT-PLAN-020、021、030、031 | 印務主管改派、展開、加開、分派、刪空草稿、核可退回；生管確認異動 | `P/work-orders/_lib/permissions.js:75-76、185-191、321-327、370-395`、`P/recipes/_lib/permissions.js:17` 一致 | 無落差 | — |

### 8. 生產任務、報工紀錄、工作包、轉交單（生產管理）

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-071 | 報工紀錄 | ACT-MFG-021、022、023（G63） | 印務主管可在任一工單詳情報工、修正、作廢 | `P/production-floor/_lib/permissions.js:99-107` 印務主管也要是負責人或編輯分享 | 動作角色 | `T/tests/unit/production-floor/correction-entry-scope.test.mjs:71-73`；e2e `14-query-ui/correction-entries.spec.mjs:53`（14.32） |
| V2-072 | 報工紀錄 | ACT-MFG-006、011、016 | 工單編輯分享的所有角色可在工單詳情報工、修正、作廢 | 同上，先限印務、印務主管 | 分享 | 無 |
| V2-073 | 報工紀錄 | ACT-MFG-007、012、G53(3) | 師傅修正、作廢只看報工人員是本人 | `P/production-floor/_lib/permissions.js:178-185` 另要求任務所屬工作包的師傅仍是本人 | 動作角色 | `correction-entry-scope.test.mjs:91-98`；e2e `correction-entries.spec.mjs:133`（14.35） |
| V2-074 | 生產任務、工作包、轉交單 | ACT-VPRD-054、058、065 | Supervisor 看全公司 | `P/_lib/sessionStore.js:30` 以所屬產線全選模擬；結果相同，判定口徑不同 | 可見範圍（口徑） | `T/tests/unit/production-floor/supervisor-read-only.test.mjs:62`；情境目錄 9.12 |
| V2-075 | 生產任務 | ACT-MFG-004 | 印務以所屬產線回報加工廠任務 | 未找到對應入口；外發報工走工單詳情（`P/dispatch-orders/_lib/permissions.js:122`） | 無法判斷（G53 外包另案） | 無 |
| V2-076 | 生產任務、轉交單、工作包、報工 | ACT-DSP-001 至 009、ACT-FLW-001 至 022、ACT-MFG-001 至 003、008、009、013、014、017、018、ACT-VPRD-049 至 065 | 生管主責、印務與印務主管代行、所屬產線；師傅、廠務自己負責 | `P/production-floor/_lib/permissions.js:22-27、298-313`、`transfer-rules.js:329-347`、`unit-scope.js:13-37` 一致 | 無落差 | — |

### 9. 品檢紀錄與品檢待驗清單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-077 | 印件（待驗清單） | ACT-VPRD-010 至 015 | 品檢人員、印務主管、Supervisor 全公司；印務看自己負責工單；工單分享者 | `P/qc-shipping/inspection/page.js:150-214` 不分角色列全部；業務、揀貨、出貨、生管也看得到整份待驗清單 | 可見範圍、多給權限 | 無 |
| V2-078 | 品檢紀錄 | ACT-VPRD-016 至 026 | 業務、諮詢只看自己負責或被分享訂單的；印務只看自己負責工單的 | 同上，全部列出 | 可見範圍 | 無 |
| V2-079 | 品檢紀錄 | ACT-INSP-001、002 | 品檢人員新增與修正 | `P/qc-shipping/inspection/page.js:155`、`P/print-items/_lib/permissions.js:54-61` 一致 | 無落差 | — |

### 10. 出貨單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-080 | 出貨單 | ACT-VDLV-001、002、003 | 業務、諮詢只看自己負責或被分享訂單的出貨單 | `P/qc-shipping/shipments/page.js:46-59` 不分角色列全部 | 可見範圍 | 無 |
| V2-081 | 出貨單 | ACT-SHP-029 至 033 | 六個協助角色可編輯、刪草稿、建立、作廢 | `P/qc-shipping/_components/useShipmentActions.js:139-140、206`、`_lib/next-status-options.js:122` 限業務或諮詢 | 動作角色 | `T/tests/unit/qc-shipping/next-status-options.test.mjs:143-149`（斷言其他角色無作廢） |
| V2-082 | 出貨單 | ACT-SHP-017、020、022、024、027 | 被分享（編輯）的所有角色可做同樣動作 | 同上 | 分享 | 無 |
| V2-083 | 出貨單 | ACT-SHP-025（OP-SHP-015） | 出貨人員補附送達憑證 | Prototype 無補附動作（送達確認時一次附） | 動作角色（未實作） | 無 |
| V2-084 | 出貨單 | ACT-SHP-007 至 014、ACT-OUT-001 | 揀貨人員、出貨人員現場動作與下載物流單 | `P/qc-shipping/_lib/next-status-options.js:40-120`、`useShipmentActions.js:219-225` 一致 | 無落差 | — |

### 11. 售後服務單

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-085 | 售後服務單 | ACT-VDLV-008、009、010 | 業務、諮詢看自己負責或被分享訂單底下的單 | `P/after-sales/page.js:146、180` 只列建立者是本人的單 | 可見範圍 | 無 |
| V2-086 | 售後服務單 | ACT-AFR-009、010、015、ACT-AFC-001、002、005 | 送出決議、結案限三類編輯者 | `P/orders/_components/detail/TicketRowActions.js:96-110` 只看單據狀態；會計在售後總覽也按得到 | 多給權限 | 無 |
| V2-087 | 售後服務單 | ACT-AFR-012 至 014、ACT-AFC-006、ACT-AFH-005 | 業務主管、Supervisor 等協助角色可編輯 | `P/after-sales/page.js:319` 主管視角不給編輯 | 動作角色 | 無 |
| V2-088 | 訂單異動 | ACT-CHG-004、005、021（OP-AFT-005） | 在售後服務單內建訂單異動限三類編輯者 | `P/orders/_components/detail/TicketViewDrawer.js` 無角色條件 | 多給權限 | 無 |

### 12. 款項跨訂單清單與輸出

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-089 | 帳務清單 | ACT-VORD-026、027、032、033、038、039 | 被分享訂單的項目也看得到 | `P/payment/_lib/derive.js:41-44` 業務、諮詢只認接單業務是本人 | 可見範圍 | 無 |
| V2-090 | 帳務清單 | ACT-VORD-020 至 042 | 未列的角色不能看；非業務部門的被分享者可看 | 側欄只給業務、業務主管、諮詢、會計、Supervisor；其餘被分享者無入口 | 分享 | 無 |
| V2-091 | 帳務 | ACT-OUT-007 至 009（OP-BIL-017） | 匯出待退款報表限業務主管、會計、Supervisor | `P/payment/refund-payout/page.js:122-128` 任何進得來的角色皆可按 | 多給權限 | 無 |
| V2-092 | 帳務 | ACT-OUT-004 至 006（OP-BIL-016） | 匯出對帳明細限會計、業務主管、Supervisor | `P/payment/receivable/page.js:94-100`「匯出逐張發票明細」任何角色可按；是否就是對帳明細不確定 | 多給權限或 wiki 未定義（見第六節） | 無 |

### 13. 派單、貨運單、主檔

| 編號 | 單據 | 活動編號 | wiki 規定 | Prototype 現況（檔案:行） | 落差類型 | 影響測試 |
|---|---|---|---|---|---|---|
| V2-093 | 派單、貨運單 | ACT-PLAN-032、033、ACT-FLW-024 至 033 | 印務、揀貨人員全公司 | `P/dispatch-orders/_lib/permissions.js:41-135` 一致 | 無落差（G53 外包另案） | — |
| V2-094 | 主檔 | ACT-PTM-001 至 004、ACT-EQM-001、002、ACT-BOM-001 至 006、ACT-SKL-001、ACT-CNM-001、002 | 廠客、設備、BOM、人員能力、中國供應商帳號維護 | Prototype 無維護頁面（只有 mock） | 動作角色（未實作；G60(53) 主檔納入 Prototype 時再處理） | 無 |
| V2-095 | 配方 | ACT-RCP-001 至 004 | 印務維護 | `P/recipes/_lib/permissions.js:5-12` 一致；另給印務主管、Supervisor、生管檢視 | 檢視部分 wiki 未定義（G60(53) 主檔檢視不補活動） | 7.21 |

## 三、測試衝突清單

以下測試斷言了與活動表衝突的舊權限。

| 測試位置 | 情境目錄節號 | 舊斷言 | 依活動表應為 |
|---|---|---|---|
| `T/tests/unit/quote/quote-rules.test.mjs:143` | 1.2 前後 | 評估印務主管 `canManageQuote` 為否 | 評估印務主管是編輯分享者，應為是（ACT-EST-011 等） |
| `quote-rules.test.mjs:150` | — | 評估印務主管不可評估完成 | 應可（ACT-EST-030） |
| `quote-rules.test.mjs:159` | — | 評估印務主管 `canManageCostFields` 為否 | 應可，含需求確認中 |
| `quote-rules.test.mjs:162-164` | 1.13 | 評估印務主管不可刪除 | 應可（ACT-REQ-022） |
| `quote-rules.test.mjs:171` | 1.14 | 業務主管看不到無關需求單 | 應看得到（ACT-VPRE-005） |
| `quote-rules.test.mjs:184` | 1.15 | Supervisor 不可改派 | 應可（ACT-RAS-001） |
| `quote-rules.test.mjs:189-197` | 1.5 | 評估印務主管只在兩個狀態改成本 | 需求確認中也可，且不只成本兩欄 |
| e2e `01-quote/quote-request.spec.mjs:563` | 1.13 | 評估印務主管列上沒有編輯與刪除鈕 | 應有 |
| e2e `quote-request.spec.mjs:576` | 1.14 | 業務主管分享前看不到需求單；建立者看得到 | 業務主管全公司；建立者不給權限 |
| e2e `quote-request.spec.mjs:930` | 1.25 | 複製後接單業務沿用來源單 | 接單業務是執行複製的人（G36） |
| e2e `02-order-setup/sharing-members.spec.mjs:49-60` | 2.10 | 檢視層級的張惠雯（`P/orders/mock-data.js:525` 字串正規化為檢視）改交貨備註成功 | 檢視層級不能編輯；應改用編輯層級成員，並補檢視層級改不了的斷言 |
| `T/tests/unit/orders/review-gate-and-print-item-delete.test.mjs:210-218、227-235`；e2e `review-gate.spec.mjs:185` | 2.17 | 業務主管、印務主管不可送審 | 兩者為全公司協助角色，應可（ACT-APV-012）；會計不可維持 |
| `review-gate-and-print-item-delete.test.mjs:329-345`；e2e `delete-print-item.spec.mjs:137` | 4.20 | 印務主管看不到刪除印件 | 應看得到（ACT-APV-009） |
| `T/tests/unit/orders/ch2-order-lifecycle-rules.test.mjs:27` | 2.x | 業務主管不可取消訂單 | 應可（ACT-APV-022） |
| `ch2-order-lifecycle-rules.test.mjs:181-184` | 11.x | 業務主管、訂單管理人不可建出貨單 | 應可（ACT-SHP-028）；揀貨、出貨人員不可維持 |
| `T/tests/unit/orders/order-completion-no-print-items.test.mjs:102-103` | 2.19 | 業務主管不可手動推進 | 應可（ACT-DONE-003） |
| `T/tests/unit/orders/confirm-producible-roles.test.mjs:13-17` | 5.x | 業務主管、訂單管理人、印務、Supervisor 不可確認可製作 | 四者應可（ACT-ART-019）；審稿人員不可維持 |
| `T/tests/unit/qc-shipping/next-status-options.test.mjs:143-149` | 12.15 | 業務、諮詢以外角色沒有作廢 | 六個協助角色應可作廢（ACT-SHP-033） |
| `T/tests/unit/work-orders/rules-production-line.test.mjs:235、281-285`；e2e `delivery-status.spec.mjs:231` | 8.19 | 製程確認中印務主管不可改產線與目的站點 | 應可（ACT-PLAN-041；實體卡只鎖作廢、報廢） |
| e2e `08-process-review-deliver/print-sheet.spec.mjs:124` | 8.7 | 預覽限負責印務；列印開給印務與生管 | 印務主管應可預覽、列印；生管無列印活動；列印限自己負責的印務 |
| e2e `14-query-ui/work-orders.spec.mjs:221` | 14.15 | 印務主管沒有分享新增與移除 | 應可（ACT-SHR-011） |
| `T/tests/unit/production-floor/correction-entry-scope.test.mjs:71-73`；e2e `correction-entries.spec.mjs:53` | 14.32 | 非負責的印務主管在工單詳情不可修正、作廢報工 | 應可（ACT-MFG-022、023） |
| `correction-entry-scope.test.mjs:91-98`；e2e `correction-entries.spec.mjs:133` | 14.35、10.x | 工作包改派後師傅不可修正自己提交的報工 | 只看報工人員是本人，應可（ACT-MFG-007、012） |
| e2e `07-process-planning/proof-and-notes.spec.mjs:76` | 7.27（第二個 7.27） | 印務對稿件備註唯讀 | 依 ACT-APV-025 應可；待第五節第 3 條確認 |
| e2e `03-payment/reconciliation-lists.spec.mjs:10` | 3.11 | 會計打開訂單詳情看三方對帳區 | 會計沒有訂單檢視活動（G48） |
| 情境目錄 `docs/scenario-catalog.md` 1.14 說明 | 1.14 | 「業務主管的可見範圍依 2026-09-08 裁定維持後端現況」 | 已改為全公司 |
| 情境目錄 2.10「未實作」 | 2.10 | 「訂單的分享沒有兩個層級」 | Prototype 已有層級（`P/orders/_lib/permissions.js:101-111`）；描述過期 |
| 情境目錄 9.12 起點資料 | 9.12 | 「主管王大明，所屬產線全選」 | Supervisor 全公司，不經所屬產線；角色名用 Supervisor |
| 情境目錄 10.40、14.10、14.28；e2e `10-report-transfer/transfer-tickets.spec.mjs:465` | 10.40、14.10、14.28 | 以權限名稱「管理轉交單（負責）」描述候選、以「產線」「負責」描述範圍 | 範圍用詞為所屬產線、自己負責；權限名稱不寫 |

另見：情境目錄有兩個 7.27（第 1313 行與第 1350 行），節號重複。

## 四、未覆蓋清單

下列活動組合沒有任何測試斷言。依活動類別列。

| 類別 | 未覆蓋的組合 | 建議落點（情境目錄章） |
|---|---|---|
| G61 全公司協助角色 | 業務主管、訂單管理人、印務主管、印務、審稿主管、Supervisor 對訂單、印件、出貨單、帳務、訂單異動、售後服務單的協助動作（每類至少一角色一動作） | 二、三、四、五、十二章 |
| 被分享（編輯）的非業務角色 | 生管、印務等被分享訂單或需求單後可編輯；業務被分享工單後可報工、可改生產任務 | 1、2、14 章 |
| 被分享（檢視）不可編輯 | 訂單、需求單、工單三種單據各一則反向斷言 | 1.x、2.10、14.15 |
| 會計不在訂單模組 | 會計側欄無訂單、直連訂單詳情的處置 | 3 章 |
| 檢視範圍 | 出貨單列表依訂單範圍（ACT-VDLV-001 至 003）；售後服務單依訂單範圍（ACT-VDLV-008 至 010）；品檢待驗清單與品檢紀錄依角色範圍（ACT-VPRD-010 至 026）；印件列表依訂單範圍（ACT-VORD-010 至 012）；款項清單含被分享訂單（`visibleForRole` 無任何測試） | 9、11、12、14 章 |
| 需求單 | 建立需求單限業務、諮詢（ACT-REQ-001）；評估印務主管列在分享成員清單；建立者不得權限 | 1 章 |
| 訂單 | 已送報價單、確認回簽、上傳回簽的角色（ACT-SIGN-001 至 012）；改派在訂單完成可、已取消不可（ACT-RAS-003）；諮詢管理分享（ACT-SHR-006）；取消已認列異動限審核業務主管本人（ACT-CHG-020） | 2、6 章 |
| 工單 | 印務主管代做（ACT-PLAN-034 至 043）；印務自行加開工單（ACT-WOA-009） | 6、7、8 章 |
| 印件 | 缺口處置、補做、短出結案限負責印務（ACT-INSP-003 至 011、ACT-MFG-019 至 024） | 11、16 章 |
| 輸出 | 待退款報表與對帳明細的匯出角色（ACT-OUT-004 至 009） | 3 章 |
| 未實作 | 諮詢單全部活動；複製訂單；補附送達憑證；主檔維護 | 新增章節 |

## 五、wiki 未定義或 wiki 內部待確認

1. 詳情頁直連：活動表只定義誰可檢視，未寫列表以外的直連網址如何處置。依未列即不可做，直連算多給權限；需求單、訂單、印件、工單詳情都不判範圍（V2-021、V2-025）。
2. 編輯權有、檢視權沒有：訂單管理人、印務主管、印務、審稿主管有出貨單（ACT-SHP-028 至 033）與售後服務單（ACT-AFR-011 至 015）的全公司協助列，但出貨與售後檢視活動清單沒有這四個角色的全公司檢視列。[[訂單與帳務檢視活動清單]] 範圍外只說訂單異動、收款項目、發票、折讓單、款項紀錄隨訂單查閱，未包含出貨單與售後服務單。
3. 印務改稿件備註：依實體卡稿件備註屬一般欄位、ACT-APV-025 給印務全公司協助編輯印件；G48 另記「本輪印務不能改製作備註」待後續權責調整。Prototype 與 7.27 鎖住印務改稿件備註。
4. 生管列印工單單據：[[工單異動與生產任務調整]] 第 3 步寫生管確認異動後重新印製紙本工單，但 [[輸出活動清單]] 沒有生管的列印列。Prototype 給生管列印（V2-066）。
5. 欄位層級可見性：成本、利潤欄依角色顯示（V2-058）屬 XM-016，wiki 不寫。
6. 業務經訂單看工單、生產任務的入口：活動表有列（ACT-VPRD-034 至 036、046 至 048），未寫入口在哪個模組；Prototype 只從印件詳情進入。
7. 印務主管看品檢紀錄、Supervisor 看工作包等全公司範圍，Prototype 以所屬產線全選或側欄入口模擬，口徑不同、結果相同（V2-074）。
8. 配方的檢視角色（V2-095）：G60(53) 主檔檢視先不補活動。
9. 工單列表只列自己負責或被分享：[[生產單據檢視活動清單]] 範圍外宣告為介面預設篩選、正本在 Prototype，不列落差（`P/work-orders/_lib/permissions.js:345-351`）。

## 六、無法判斷

| 項目 | 原因 |
|---|---|
| 應收款項清單「匯出逐張發票明細」是否等於 OP-BIL-016 匯出對帳明細 | Prototype 註解寫逐張發票明細，wiki 對帳明細欄位細節在 [[對帳與催收]] 範圍外 |
| ACT-MFG-004 印務以所屬產線報加工廠任務的入口 | Prototype 外發報工只在工單詳情；G53 外包另案 |
| 狀態條件是否另有限制 | 本盤點只比角色、範圍、依據欄位；各操作的狀態時機正本在實體卡與狀態機卡，只有改派（V2-037）與目的站點（V2-063）逐條核對 |
| 審核業務主管途徑（V2-024）是否要保留給業務、諮詢 | 活動表沒有此範圍；被指派審核者只能是業務主管，本途徑實際只影響 mock 資料組合 |

## 七、依單據統計落差數

只計落差類型不是「無落差」的列。一列標兩種類型時算一筆。

| 單據 | 筆數 |
|---|---|
| 共用側欄 | 12 |
| 需求單 | 10 |
| 諮詢單 | 1 |
| 訂單（含帳務、異動在訂單頁籤的列） | 20 |
| 印件 | 15 |
| 審稿 | 0 |
| 工單、生產任務（製程規劃） | 10 |
| 生產管理（報工、轉交、工作包） | 5 |
| 品檢 | 2 |
| 出貨單 | 4 |
| 售後服務單 | 4 |
| 款項清單與輸出 | 4 |
| 派單、主檔、配方 | 2 |
| 合計 | 89 |

測試衝突 29 筆（含情境目錄描述 4 筆）。wiki 未定義或待確認 9 筆。無法判斷 4 筆。
