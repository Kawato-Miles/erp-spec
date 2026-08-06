# 生產階段三方差異矩陣（wiki 基準 × openspec × prototype）

> 產出：2026-08-06 全盤點（四段並行稽核，Opus 唯讀）。
> 用途：生產階段校正計畫的工作基準；四段 change（工單建立與派工派單 → 報工轉交 → 品檢出貨 → 副流程）逐段消化本檔差異項。
> 基準：wiki（`memory/Sens_wiki/wiki/erp/`）為商業正本；openspec（`openspec/specs/`）為行為規格；prototype（erp repo `prototype/production-stage` 分支）為介面互動正本。
> 統計：段 1＝48 項、段 2＝31 項、段 3＝35 項、段 4＝42 項，共 156 項差異；wiki 疑似缺漏 33 項。
> 注意：本檔為只追加的工作文件，逐項消化後在該項行尾標注處理狀態（change 名或「已裁決」），不刪列。

---

# 段 1：製作細節確認 → 工單建立與分派 → 製程規劃 → 製程審核 → 交付產線 → 生管派工 → 外發派單

## 差異矩陣（段 1）

### A. 製作細節確認

| # | 流程點／規則 | wiki 正本（卡名＋要點） | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 1 | 訂單管理人確認製作細節的作業入口 | `07-scenarios/印件製作細節確認.md` 主成功過程第 1-2 步：審稿維度到「已確認可製作」後由訂單管理人逐件確認 | work-order/spec.md:19、25-31 有 Requirement 與 Scenario，但未規範佇列頁（介面歸 Prototype，合理） | 無「待確認製作細節」佇列頁。最接近者為 `/orders/detail` 印件頁籤的「確認可製作」按鈕（`orders/_components/detail/ItemsTab.js:436`），該動作只改 `review_status`、不建工單草稿（store `orders/_lib/store.js:450-463`），且門控為 `review_status==='合格' && order_source==='B2B'`、未綁訂單管理人角色 | 已拍板待改（prototype 缺頁＋角色門控錯置） |
| 2 | 確認通過即建工單草稿 | `06-state-machines/印件狀態.md`:154；`05-entities/工單.md`:33 建立來源「審稿路徑（線下單）」 | work-order/spec.md:19、29 一致 | `confirmProducible`（`orders/_lib/store.js:450-463`）不建工單草稿；工單 mock 為靜態 12 張（`work-orders/_lib/mock-data.js:63`） | prototype 缺 |
| 3 | 製作細節有誤的處置 | `07-scenarios/印件製作細節確認.md`:34 岔路「製作細節有誤 → 訂單管理人退回業務補齊」；`06-state-machines/印件狀態.md`:169 動機段例子同；`03-roles/訂單管理人.md`:20、22、30 三處寫「退回業務補齊」 | work-order/spec.md:32-35 Scenario「製作細節有誤退回業務」——系統 SHALL 退回業務補齊 | 無退回動作 | 已拍板待改（拍板定為系統內不留退回動作、走 Slack；wiki 四處＋openspec 一處均需改，prototype 現況反而符合拍板） |
| 4 | 印件印製維度含「製程已確認」 | `06-state-machines/印件狀態.md`:45、117-118、154 列舉與轉換均含「製程已確認」 | 相斥：order-management/spec.md:2161 狀態鏈寫 `等待中 → 工單已交付 → 部分工單製作中 → 製作中 → 製作完成 → 出貨中 → 已送達`，缺「製程已確認」；同檔 2175「印製狀態 SHALL 維持『等待中』直到工單交付」。與 work-order/spec.md:19、29「印製維度推進至『製程已確認』時建立工單草稿」直接相斥 | `orders/mock-data.js:79-85` 印件印製狀態僅 5 值：`待生產／生產中／已完成／已取消／已棄用`，與 wiki 9 值完全不對應；`prepress-review/detail/page.js:336-380` 顯示的「印製狀態」即取此列舉 | openspec 衝突（＋openspec 複寫 wiki 狀態列舉）／prototype 衝突 |
| 5 | 工單建立的觸發點條文 | `05-entities/工單.md`:33；`06-state-machines/工單狀態.md`:101 | 舊條文未更新：order-management/spec.md:2093「訂單 → 印件審稿維度進入『已確認可製作』後建立工單」；2099-2102「合格（尚未確認可製作）→ MUST NOT 建立工單」；2104-2107「已確認可製作 → SHALL 允許建立工單」；2171-2175 同義 Scenario。四處均缺「訂單管理人確認製作細節」這一關 | 不適用（介面層無此規則） | openspec 衝突（措辭過時） |
| 6 | 生產任務的建立時點 | `05-entities/工單.md`:71-72 材料清單／工序在「製程確認階段可改」；`06-state-machines/工單狀態.md`:28 草稿態即由印務填寫製程 | 相斥：order-management/spec.md:2093「工單審核完成後建立生產任務」＋2109-2112 Scenario「工單狀態為『製程審核完成』→ SHALL 允許為該工單建立生產任務」。與 work-order/spec.md:61「生產任務的新增與修改 SHALL 僅在工單狀態為草稿或重新確認製程時允許」、74-78「製程審核完成後不可再改生產任務」完全顛倒 | prototype 依 work-order 側：`work-orders/_lib/permissions.js:5-6` 僅草稿／重新確認製程可編輯 | openspec 衝突（openspec 內部相斥） |
| 7 | 製作討論串（業務勾選多印件建 Slack 串、URL 回寫印件） | wiki 無此欄位（`05-entities/印件.md` 欄位表無「製作討論串」；全庫 grep 0 命中） | 無對應 Requirement。order-management/spec.md:2218-2226 有「訂單回簽開放審稿分派與討論」，但主題為審稿討論串 | 只有審稿討論串：`orders/_components/detail/ItemsTab.js:496`、`:514-527`，store `openReviewDiscussion`（`orders/_lib/store.js:466-486`）。生產側無任何討論串欄位 | 已拍板待改（wiki 缺欄位、openspec 缺 Requirement、prototype 缺） |
| 8 | 統一印件詳情頁 | wiki 不承載介面（Prototype 為介面正本） | order-management/spec.md:1481-1497「印件詳情頁工單與生產任務區塊」——但內容用「入庫數量（pt_warehouse_qty，QC 通過後依齊套性邏輯計算）」與「QC 狀態徽章」。wiki 已將 QC 實體退役、品檢改掛印件層，欄位亦已正名「完工良品數」（`05-entities/印件.md`:80）。該段並宣稱「與 work-order spec § 工單詳情頁印件區塊三欄一致」，但 work-order/spec.md 已無該段＝失效引用 | `prepress-review/detail/page.js`（503 行）為獨立詳情頁，含審稿紀錄／活動紀錄兩 Tab；`print-items` 為抽屜 `PrintItemViewDrawer.js`（四段），無 `print-items/detail` 路由 | 已拍板待改／openspec 衝突（QC 用語與欄位名過時、死鏈） |
| 9 | 印件詳情頁成本（預計／實際成本印務＋主管可見、毛利率限主管） | `05-entities/印件.md`:84-86 三欄位已在正本 | 無角色可見性 Requirement | `print-items/` 全目錄 grep「成本／毛利」0 命中；成本只在工單詳情兩 Tab（`work-orders/detail/page.js:231-232`）且無角色門控 | 已拍板待改（openspec 缺、prototype 缺） |

### B. 工單建立與分派

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 10 | 印務主管加開工單 | `07-scenarios/印件製作細節確認.md`:38 岔路；`05-entities/工單.md`:33；`03-roles/印務主管.md`:27 | work-order/spec.md:19「亦 MAY 自行增開工單」 | 無加開動作：工單列表無新增鈕、詳情無加開鈕。「加開」字串僅出現在缺口處置的「補做（原工單異動加開）」＝加開生產任務 | prototype 缺 |
| 11 | 依印件配方展開工單草稿（覆蓋、僅全草稿時允許） | `04-business-logic/營運規則/訂單到交付/配方展開規則.md`:32-33 | work-order/spec.md:19 引 `recipe-expansion` | 有：`print-items/page.js:281-289`「展開工單草稿」，權限 `recipes/_lib/permissions.js:14`，覆蓋守衛 `work-orders/_lib/permissions.js:51-62` | 一致 |
| 12 | 分派與改派（全生命週期可改派、限印務主管、留異動紀錄） | `05-entities/工單.md`:57；`06-state-machines/工單狀態.md`:127 | work-order/spec.md:45 一致 | 有：`work-orders/detail/page.js:164`／`:171`，權限 `permissions.js:41-47`，改派寫異動紀錄 `store.js:101-130` | 一致 |
| 13 | 印務主管印件總覽（待收斂清單、防掉單） | wiki 未立此頁為正本（介面層） | work-order/spec.md:236-247 有 Requirement 與篩選要求 | 有：`print-items/page.js:374` Alert 定義工作目標、篩選含分派狀態／印件類型／負責印務／工單狀態／交期 | 一致 |

### C. 製程規劃

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 14 | 生產任務規劃介面分三段（材料／工序／裝訂） | wiki 不承載版型 | 無（介面歸 Prototype） | 單一表格混列三類、以「類別」欄區分：`work-orders/_components/detail/ProcessTab.js:145-284`、`:372` | 已拍板待改（prototype） |
| 15 | 序號欄移除、段內拖曳、不表達平行 | wiki 未設序號為業務欄位（`05-entities/生產任務.md`:80 明列「排序序號」屬實作規格） | 無 | 有序號欄（`ProcessTab.js:146`）、表單欄位 label「順序（同序號可平行）」（`TaskFormDialog.js:363`）＝明示平行；全 prototype 無拖曳 | 已拍板待改（prototype 三項全反） |
| 16 | BOM 下拉不顯示任何價格 | `04-business-logic/營運規則/訂單到交付/BOM結構.md`:39 起跳價屬主檔參數，未要求介面呈現 | 無 | 材料規格顯示 `{unit_price} 元/張`（`TaskFormDialog.js:283`）、裝訂顯示 `起跳 {min_total} 元`（`:338`）；工序不顯示價格（`:321`） | 已拍板待改（prototype） |
| 17 | 工單「參考完稿圖」自動帶入印件審稿後檔案、唯讀 | `05-entities/工單.md`:73「參考完稿圖｜來源：印務附上｜製程確認階段可改」——wiki 正本仍是印務手動上傳 | 無對應 Requirement | 有 Upload「重新上傳完稿檔」（`ProcessTab.js:479-493`、store `work-orders/_lib/store.js:171-174`），`reference_artwork` 為 mock 字串、無自印件帶入邏輯 | 已拍板待改（wiki 欄位表＋prototype 皆需改；openspec 缺） |
| 18 | 生產任務日期欄名 | `05-entities/生產任務.md`:39「預計執行日」、:40「實際開工日」；`03-roles/印務.md`:20、28 與 `03-roles/生管.md`:35 亦用「預計執行日」 | work-order/spec.md:391-393、399-404、417-421 一律用「建議開工日」 | 三種寫法：表頭「建議開工日」（`ProcessTab.js:195`）、表單「建議日期（依交期倒推預填、可改）」（`TaskFormDialog.js:371`）、派工／排程頁「建議日期」。全 repo 無「預計開工日」 | 已拍板待改（拍板取「預計開工日」；wiki 四處、openspec 三處、prototype 三處） |
| 19 | 計價快照建立時凍結四分項 | `05-entities/計價快照.md`:30-37；:41 內嵌於生產任務（1:1） | work-order/spec.md:283-300 一致 | 有 `EstimateTab.js` 四分項＋工單彙總、`estimate-cost.js` 概算；對話框第 5 段「預估成本分項（展開時凍結）」 | 一致 |
| 20 | 色數登記（特殊色逐色、倍率不落任務） | `05-entities/生產任務.md`:73-78 | work-order/spec.md:303-321 一致 | 有第 4 段「色數與特殊色」，僅自有工廠工序＋有色數能力機台 | 一致 |
| 21 | 交期倒推預填、手改不被覆寫、跨工單走 | `05-entities/生產任務.md`:39；`04-business-logic/營運規則/訂單到交付/配方展開規則.md`:34 | work-order/spec.md:389-421 完整 | 有「依交期倒推預填」鈕＋`_lib/backtrack.js`，手改標「手動」 | 一致 |
| 22 | 前置相依（數量級、可跨工單、刪除擋下） | `04-business-logic/營運規則/訂單到交付/工序相依性規則.md`:30、35 | work-order/spec.md:423-439、production-execution/spec.md:207-225 | 有多前置 multiple select、候選分「本工單內」與「WO-xxxx（同印件）」；刪除前置檢查 `ProcessTab.js:291-298` | 一致 |

### D. 製程審核

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 23 | 送審／核可／退回（原因必填）／收回三動作與守衛 | `07-scenarios/工單製程審核.md`:25-33；`06-state-machines/工單狀態.md`:102-106 | work-order/spec.md:86-123、207-233 一致（含收回守衛） | 四動作齊備並含二次確認與必填校驗 | 一致 |
| 24 | 印務主管審核待辦清單（列製程確認中、顯送審時間與印件交期） | wiki 明示屬實作規格（`07-scenarios/工單製程審核.md`:49） | work-order/spec.md:249-260 有 Requirement | 無專屬佇列頁，只能在 `/work-orders` 用通用「工單狀態」下拉自行篩 | prototype 缺 |
| 25 | 核可時自動產生派單（廠商×工單、初始態） | `06-state-machines/派單狀態.md`:26 初始態名為「未送大陸」；`05-entities/派單.md`:34 | work-order/spec.md:88 寫「初始狀態為未送」——非 wiki 列舉值（dispatch-order/spec.md:19 則正確寫「未送大陸」） | 核可時為外包／中國廠任務自動配 `dispatch_no`；派單 mock 初始態用「未送大陸」 | 措辭過時（openspec 狀態名不符列舉） |
| 26 | 印務主動收回時與主管同時操作的先到先處理 | `07-scenarios/工單製程審核.md`:34 明文 | openspec 無對應 Scenario | prototype 無併發處理 | openspec 缺／prototype 缺 |

### E. 交付產線

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 27 | UI 動作文字「交付產線」 | `06-state-machines/工單狀態.md`:14、31、37、81、107 內文用「交付產線」，但未定義「交付」這個動作本身 | work-order/spec.md:262-280 用「交付」／「任務交付」 | 按鈕「交付選取任務（N）」（`ProcessTab.js:415`）、欄位「交付」／「已交付」／「未交付」；「交付產線」僅出現在 ACCEPTANCE.md 敘述 | 已拍板待改（wiki 補定義＋prototype 改文字） |
| 28 | 全部生產任務交付才推進「工單已交付」（取最落後） | `06-state-machines/工單狀態.md`:37、107 | work-order/spec.md:211、217-227 一致（依 PT-028 取「全部」） | 一致：`deliverTasks` 全部交付才推進 | 一致 |
| 29 | 外發任務交付＝派單發送 | `07-scenarios/外發委外與回廠點收.md`:27；`05-entities/派單.md`:34 | work-order/spec.md:264、276-281；dispatch-order/spec.md:32-44 一致 | 成功訊息「已交付 N 個生產任務（外包任務交付＝派單發送）」 | 一致 |

### F. 生管派工

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 30 | 待派任務清單（外發不入清單、已取消退出） | `04-business-logic/服務藍圖/生產流程.md`:40；`03-roles/生管.md`:34 | production-execution/spec.md:15-38 完整 | 有：`production-floor/dispatch/page.js:65`、計數列 `:306` | 一致 |
| 31 | 生管「確認接收」留痕（接收時間與操作者） | `03-roles/生管.md`:26 明文要求 | production-execution/spec.md:17 只寫「SHALL 在派工介面接收」，無接收確認動作與留痕 Requirement | 無接收確認動作，只有「合批打包（N）」 | openspec 缺／prototype 缺 |
| 32 | 合批打包工作包（單一設備、跨工單、生管自主、聚合條件） | `05-entities/工作包.md`:32-40 | production-execution/spec.md:40-62 一致 | 有：對話框含聚合條件／指派師傅／上機日／備註、設備唯一性擋下 | 一致 |
| 33 | 派工前置檢查（到料為 0 擋下、多前置取最小、跨工單納入） | `04-business-logic/營運規則/訂單到交付/工序相依性規則.md`:30、35 | production-execution/spec.md:207-225 一致 | 有：`production-floor/_lib/precedence.js`、三態標示 | 一致 |
| 34 | 待排區（已交付未入工作包） | 藍圖階段 3 涵蓋，未立獨立正本 | production-overview/spec.md:49-61（要求顯示所屬工單、印件交期、建議開工日） | 有：`production-floor/schedule/page.js:94`、`:206`，欄位未顯示印件交期 | prototype 缺（欄位缺印件交期） |
| 35 | 拉料備料＝材料型生產任務走同一條路徑 | `05-entities/工單.md`:67、71；`05-entities/生產任務.md`:89 | production-execution/spec.md:83-101（含 BOM 備料清單、材料型為同段工序前置） | 無獨立備料介面（設計上正確）；材料型任務走同一路徑。無 BOM 產出的備料清單 | prototype 缺（備料清單） |
| 36 | 工作包不設業務狀態欄位 | `05-entities/工作包.md`:29-40 欄位表無狀態欄 | production-execution/spec.md:262-274 明文 SHALL NOT 有狀態欄位 | 相斥：`production-floor/_lib/store.js:145-149` 定義 `PACKAGE_STATUS_META = 待開工／上機中／已完成`，排程頁佇列表有「狀態」欄 | prototype 衝突 |

### G. 外發派單

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 37 | 派單自動產生、粒度廠商×工單、明細掛生產任務 | `05-entities/派單.md`:34、103；`05-entities/生產領域資料結構總覽.md`:141 | dispatch-order/spec.md:17-30 一致 | 派單 mock 為工單×廠商，明細表「明細（生產任務 N 項）」 | 一致 |
| 38 | 「已交付工單」這一站是否保留（第二道確認） | wiki 內部相斥：`06-state-machines/派單狀態.md`:27「新設計不設此第二道確認（B9 定案 2026-08-05）……本站僅為現況平台事實保留」；但 `07-scenarios/外發委外與回廠點收.md`:26 主成功過程第 2 步仍寫「訂單管理人確認工單內容無誤後切狀態……內容確認與派案分兩關」，且 `05-entities/派單.md`:52 未標註 | dispatch-order/spec.md:66「內部段：訂單管理人確認工單內容 → 已交付工單」——把已被 B9 取消的第二道確認寫成生效轉換 | 大陸處理狀態下拉含「已交付工單」值但無「訂單管理人確認」專屬動作 | wiki 疑似缺漏（兩卡相斥）／openspec 衝突 |
| 39 | 外發任務由「運送中」轉「已完成」的觸發者 | B1 定案 2026-08-05：`06-state-machines/生產任務狀態.md`:30、90「揀貨人員完成回廠點收後，印務依點收結果對本任務報工、報工累計達目標即完成」；`05-entities/生產任務.md`:49-50 產出數量＝報工累計、點收數量僅為對照憑據；`07-scenarios/外發委外與回廠點收.md`:32 同 | 三處相斥：work-order/spec.md:327-328「外發生產任務的生產數量 SHALL 取回廠點收數量……點收確認即該任務完成」；dispatch-order/spec.md:95、103-107、117-121；production-execution/spec.md:231、243-246「點收確認時自動轉為已完成」 | 與 openspec 同側：`dispatch-orders/_lib/store.js:80-112` `confirmReceiving` 足量即切「台灣已入庫」＋生產任務自動完成 | openspec 衝突（三檔一致偏離 wiki B1 定案）／prototype 衝突 |
| 40 | 回廠點收介面（貨運單認列工單、清點＋秤重） | `07-scenarios/外發委外與回廠點收.md`:31；`06-state-machines/派單狀態.md`:34、103 | dispatch-order/spec.md:93-113 完整（含認列工單觸發已到貨品檢） | 點收表單有「清點數量」＋「秤重（kg）」＋「點收確認」；無「認列工單」動作；無貨運單獨立頁面，僅派單詳情一個唯讀欄位 | prototype 缺（認列工單動作、貨運單頁面） |
| 41 | 點收短少／損壞的二路處置（補件／折價） | `07-scenarios/外發委外與回廠點收.md`:36 | dispatch-order/spec.md:109-113 只寫「記錄差異並通知印務，派單不自動切終態」，未寫補件與折價二路 | 短少僅留痕不切終態，無二路處置介面 | openspec 缺／prototype 缺 |
| 42 | 報價與核價（退回原因、終態前可調） | `04-business-logic/營運規則/訂單到交付/供應商報價規則.md`:27-32；`05-entities/生產任務.md`:67-69；`05-entities/派單.md`:71 | dispatch-order/spec.md:46-60 一致 | 有：「核價確認」／「退回報價」（理由必填）／「模擬廠商回寫報價」 | 一致 |
| 43 | 委外製作情境六值為派單欄位、不入狀態鏈 | `05-entities/派單.md`:51；`06-state-machines/派單狀態.md`:17、113 | dispatch-order/spec.md:143-157 一致 | 派單列表與詳情皆有「委外製作情境」欄 | 一致 |
| 44 | 外發在途段由派單自動映射回生產任務 | `06-state-machines/生產任務狀態.md`:36、88-89 | dispatch-order/spec.md:79-91、production-execution/spec.md:231 一致 | 有 `TASK_STATUS_MAPPING`、詳情頁顯示「生產任務自動映射（粗狀態）」 | 一致 |

### H. 訂單層狀態向上傳遞

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 45 | 三個訂單狀態值與段落定義 | `06-state-machines/訂單狀態.md`:50-52 | order-management/spec.md:356 一致 | 一致：`orders/mock-data.js:28-30`、`:47` | 一致 |
| 46 | 「製作等待中 → 工單已交付」的轉換條件 | `06-state-machines/訂單狀態.md`:181「印件印製維度須已至『製程已確認』……且工單已完成製程審核」 | order-management/spec.md:2050-2058 傳遞鏈只寫「生產任務（製作中）→ 工單 → 印件 → 訂單」，未涵蓋「工單已交付」這一層的向上帶動 | 訂單狀態為 mock 靜態值，無 store 層向上傳遞邏輯 | openspec 缺（傳遞鏈缺交付層）／prototype 缺 |
| 47 | 「工單已交付 → 製作中」由首個生產任務報工觸發 | `06-state-machines/訂單狀態.md`:182；`06-state-machines/工單狀態.md`:108 | order-management/spec.md:2064-2068、production-execution/spec.md:132-144 一致 | `production-floor` 報工不連動訂單狀態（跨模組 mock 各自持有） | prototype 缺 |
| 48 | 內部製作截止日 | `05-entities/訂單.md`:65 有此欄位 | order-management/spec.md:1454-1460 有 Requirement，但正文含棄用欄位提示（舊新並陳，違反收斂原則）；且與 work-order/spec.md:393 三個日期無銜接說明 | 無此欄位 | 措辭過時（openspec）／prototype 缺 |

## 情境走查（段 1）

### 一、印件製作細節確認

| 步 | wiki 內容 | openspec 對應 | prototype 對應 |
|---|---|---|---|
| 主 1 | 訂單管理人依印件製作細節確認內容正確；此時工單尚未產生 | 有：work-order/spec.md:19、25-31 | 缺佇列頁；最接近的「確認可製作」按鈕在 `orders/_components/detail/ItemsTab.js:436`，門控未綁訂單管理人 |
| 主 2 | 確認通過 → 印製維度「等待中 → 製程已確認」＋系統建工單草稿；線上單不走本卡 | 有：work-order/spec.md:19、29、37-41。但 order-management/spec.md:2161、2175 缺「製程已確認」（矩陣 #4） | 缺：`confirmProducible` 只改審稿狀態、不建草稿 |
| 主 3 | 印務主管檢視草稿、決定是否增加工單、指派印務 | 有：work-order/spec.md:19、43-55 | 分派／改派有；加開工單缺；展開配方有 |
| 主 4 | 交棒印務展開製程 | 有：work-order/spec.md:57-84 | 有：ProcessTab 製程規劃 |
| 岔 1 | 製作細節有誤 → 退回業務補齊 | 有：work-order/spec.md:32-35 | 無退回動作 → 已拍板取消此岔路，wiki 與 openspec 需刪 |
| 岔 2 | 補印印件走同一條確認與建單鏈 | work-order 引 wiki § 建立來源。但 `05-entities/生產領域資料結構總覽.md`:73 記「補印（售後）由印務主管直接分配工單（A3 定案），不再經訂單管理人細節確認」，與情境卡岔路 2 相斥 | 無補印建單流程 |
| 岔 3 | 印務主管加開工單 | 有：work-order/spec.md:19 | 缺 |

### 二、工單製程審核

| 步 | wiki 內容 | openspec 對應 | prototype 對應 |
|---|---|---|---|
| 主 1 | 印務送審：草稿 → 製程確認中 | 有 | 有 |
| 主 2 | 印務主管檢視製程（機台選定與預計執行日） | 有 | 有；但缺審核待辦佇列頁（矩陣 #24），日期欄名為「建議開工日」（矩陣 #18） |
| 主 3 | 核可 → 製程審核完成，系統通知印務 | 有 | 有；無通知機制 |
| 岔 1 | 主管退回（原因必填）→ 重新確認製程，通知附原因 | 有 | 有；無通知 |
| 岔 2 | 印務收回（填收回原因）→ 草稿 | 有：work-order/spec.md:105-123 | 有；收回原因未要求填寫（僅二次確認框） |
| 岔 2 附 | 與主管同時操作的先到先處理 | 缺 | 缺 |

### 三、外發委外與回廠點收

| 步 | wiki 內容 | openspec 對應 | prototype 對應 |
|---|---|---|---|
| 主 1 | 製程審核完成時系統自動產生派單 | 有 | 有 |
| 主 2 | 訂單管理人確認工單內容後切「已交付工單」 | dispatch-order/spec.md:66 有——但 wiki 派單狀態卡:27 已由 B9 定案取消此站確認動作（矩陣 #38） | 無專屬確認動作 |
| 主 3 | 印務指派供應商 → 自動切「已發稿」；交付即發送 | 有 | 有交付連動；派單詳情無「指派供應商」動作（廠商為 mock 既定值） |
| 主 4 | 廠商回寫報價、印務核價 | 有 | 有 |
| 主 5 | 廠商開始生產 → 製作中；在途段自動映射 | 有 | 有 |
| 主 6 | 廠商送出運單 → 依路線分流；貨運單承載承運與運費關稅 | 有 | 狀態值齊備；貨運單無獨立頁面 |
| 主 7 | 揀貨人員於貨運單認列工單 → 點收（清點＋秤重）→ 手動切「台灣已入庫」 | 有 | 點收＋秤重有；「認列工單」動作缺 |
| 主 8 | 依點收收尾：印務依點收結果報工、達標轉已完成、運費關稅按重量攤回 | dispatch-order/spec.md:95 與 production-execution/spec.md:243-246 寫「點收即完成」→ 與 B1 定案相斥（矩陣 #39）；攤回有 | 點收足量即自動完成任務；無印務報工步驟；無攤回計算 |
| 岔 1 | 點收短少／損壞二路（補件／折價） | 只寫記錄差異通知印務 | 只留痕 |
| 岔 2 | 外包大貨 NG → 退原廠、開新工單與新派單 | 有 | 缺 |
| 岔 3 | 打樣委外走同鏈 | 有 | 欄位有、無打樣判定流程 |
| 岔 4 | 分批出貨回台（各批分別點收） | 狀態有；分批多次點收累計未寫 | 點收表單為單筆，無分批累計 |
| 岔 5 | 海外直發本輪範圍外 | 有 | 三終態列舉在，無收尾邏輯 |

## wiki 疑似缺漏清單（段 1）

| # | 位置 | 疑似問題 |
|---|---|---|
| 1 | `07-scenarios/外發委外與回廠點收.md`:26 vs `06-state-machines/派單狀態.md`:27 | 「已交付工單」第二道確認的存廢兩卡相斥（B9 定案 vs 情境卡主成功步驟） |
| 2 | `07-scenarios/印件製作細節確認.md`:36 岔路 2 vs `05-entities/生產領域資料結構總覽.md`:73 | 補印印件是否經訂單管理人細節確認，兩卡相斥（A3 定案 vs 情境卡） |
| 3 | `05-entities/工單.md`:73 參考完稿圖 | 欄位正本仍寫「印務附上／可改」，與拍板「自動帶入、唯讀」相斥 |
| 4 | `05-entities/生產任務.md` 欄位表 | 無「預計開工日」；印務卡、生管卡三處沿用「預計執行日」，改名須同步四處以上 |
| 5 | `05-entities/印件.md` 欄位表 | 無「製作討論串」欄位；`04-business-logic/外部約束/審稿討論Slack串接約束.md` 僅涵蓋審稿討論串 |
| 6 | `06-state-machines/工單狀態.md` | 未定義「交付」動作的執行者、對象粒度與可執行區間（拍板要求補定義） |
| 7 | `03-roles/印務主管.md`:20、29 | BOM 三主檔寫成「材料／製程／裝訂」，正本用「工序」。用詞不一致 |
| 8 | `07-scenarios/工單製程審核.md`:33 岔路 2 | 要求填「收回原因」，但工單卡欄位表只有「退回原因」、無「收回原因」欄 |
| 9 | `03-roles/生管.md`:26 | 要求接收留痕，但生產任務卡與工作包卡欄位表皆無接收確認人／時間欄位 |
| 10 | `07-scenarios/外發委外與回廠點收.md`:39 岔路 4 | 分批多次點收的累計口徑與派單終態切換時機未定義 |
| 11 | `04-business-logic/服務藍圖/生產流程.md`:76 | 「生產段情境待產，核心三條」——場內滾動轉交、揀貨裝箱出貨、分批出貨端到端三張情境卡至今未建 |

## 段 1 相關 open OQ

PT-036（交辦前內容檢查留痕——B9 定案後前提可能失效，需連同矩陣 #38 一併裁決）、PT-026（外部廠商門戶身分）、PT-027（改價與快照）、PI-005（印件交貨日）、PT-041、PT-023、PT-013、PT-004、PT-040、ORD-043。
另：PT-007 已拍板但 `工序相依性規則.md`:56 與派單卡引用未回填，屬死引用候選。

---

## 實作階段追加發現（段 1 批 1-2 稽核，2026-08-06）

| # | 發現 | 位置 | 處置 |
|---|------|------|------|
| A1 | 同一印件跨模組編號兩制（訂單模組 `ORD-…_NNN`、印件總覽 `PI-…`），連動只能靠名稱字串比對 | erp prototype orders／print-items 模擬資料 | 段 1 批 9（tasks 9.5） |
| A2 | 工單編號兩制（`W-YYYYMMDD-NN` 為 spec 格式、既有 `WO-2026-0NNN`） | 同上 work-orders／recipes | 段 1 批 9（tasks 9.5） |
| A3 | 工單事實由工單模組與印件總覽兩處持有，副本無同步機制 | print-items store | 段 1 批 9（tasks 9.6） |
| A4 | 訂單類型出現 wiki 值域外的「客製單」（wiki 訂單卡為線下／線上／諮詢） | orders 模擬資料 | 段 1 批 9（tasks 9.7）；值域字面 2026-08-06 改由 wiki 對齊介面用語（線下單／線上單／諮詢訂單） |
| A5 | **wiki 兩卡相斥**：[[印件]] 累計送達數定義為「出貨明細行『已送達』數量的累計」，但 [[出貨單]] 明寫「狀態掛單頭，一箱貨一起送達、一起異常」——明細行無狀態則無從逐行累計 | wiki 印件卡 § 生產與出貨進度 vs 出貨單卡 | 已開 [[SHP-017-累計送達數的計算層級]]，**段 3（出貨主場）裁決**；段 1 維持以出貨單層狀態計算、不為此新增欄位 |
| A8 | 派單明細另存一份點收與產出數字，與「事實單一持有」相斥（兩側靠 work-order-actions 同步，任務名稱對不上時會靜默分岔——風險繫於 A6） | erp prototype dispatch-orders store vs work-orders store | **段 3（派單主場）** |
| A9 | dispatch-order spec 的「指派供應商自初始態直接發稿」與實作脫節（實作於製程核可時依 BOM 承作廠商建派單、發稿由交付產線觸發） | openspec dispatch-order spec § 派單狀態轉換 | **段 3** |
| A10 | 五張模擬派單指向工單模組不存在的工單（WO-2026-0296／0299／0301C／0282／0275），其跨模組回寫靜默無作用 | erp prototype dispatch-orders 模擬資料 | **段 3** |
| A6 | 生產任務無業務可見編號，跨模組對映只能用任務名稱字串比對（印件與工單已於段 1 統一編號） | wiki 生產任務卡欄位表；erp prototype 四處跨模組對映 | 待裁決是否為生產任務設編號；段 1 接受現況不自創 |
| A7 | **一印件多工單時，印件層產出數量的彙整口徑未定義**：[[印件]] 卡說產出數量＝報工累計、[[齊套邏輯]] 說齊套完成數才是取最慢，但本體與配件各自換算回印件當量後該加總還是取最落後，兩卡都沒答。段 1 已修「未經每份印件生產數量換算」這一點（工單量除以倍數再彙整），彙整方式維持加總 | wiki 印件卡 § 生產與出貨進度 vs 齊套邏輯 | **段 2（報工主場）裁決**——段 1 產出多為 0，此口徑要到報工累積後才真正浮現 |

---

# 段 2：報工、轉交

（路徑前綴：W＝wiki/erp/、O＝openspec/specs/、P＝erp prototype 目錄）

## 差異矩陣（段 2）

| # | 流程點／規則 | wiki 正本（卡名＋要點） | openspec 現況與差異（檔＋行號） | prototype 現況與差異（檔案路徑） | 性質 |
|---|---|---|---|---|---|
| 1 | 首次報工的向上反映鏈 | `W06/生產任務狀態.md` L102：首次報工 → 工單製作中 → 印件印製維度 → 訂單製作中；`W04/報工規則.md` L45 同 | `Oproduction-execution/spec.md` L132-144 只寫「向上帶動工單與印件」，無訂單層 | `Pproduction-floor/_lib/store.js` L70-92 `submitWorkReport` 只改生產任務層 | openspec 缺／prototype 缺 |
| 2 | 「所屬任務」層級殘留 | 報工規則 L68 例子 1、生產任務狀態 L96 皆寫「所屬任務、工單同步反映」，但任務層已移除 | 無此措辭 | 無此措辭 | wiki 疑似缺漏 |
| 3 | 報工五管道 | 報工規則 L27-33：師傅自助／供應商自助／生管代報／印務於工單詳情頁／印務於印件詳情頁 | L107 五值齊；印務兩管道行為在 `Oorder-management/spec.md` L1532-1545 | `Ppermissions.js` L8-11 只有師傅自助／生管代報；work-orders、print-items 全無報工入口 | prototype 缺 |
| 4 | 報工欄位：運轉設備 | `W05/報工紀錄.md` L52：報工人員填寫、預設帶實際設備、跨機台各自記 | L105 有 | 批次報工無設備欄，設備由工作包推定 | prototype 缺 |
| 5 | 報工欄位：實際耗料／放損量 | 報工紀錄 L61 連結 `W05/物料消耗記錄.md` L31-37 | L105 有（含物料消耗記錄） | 全模組無耗料資料與介面；材料型任務無「領用量」欄（openspec L85 要求） | prototype 缺 |
| 6 | 誤報走作廢重報 | 報工紀錄 L37 | L107 明文；L77-81 工作包刪除 Scenario 依賴此功能 | 無報工作廢動作 | prototype 缺 |
| 7 | 放損自動計算 | 報工紀錄 L40：生產數量 −（良品＋不良品）換算投入單位 | L105 有「換算投入單位」 | `store.js` L74、`work-packages/page.js` L516-527 直接相減，未做單位換算 | prototype 衝突 |
| 8 | 超量警示門檻 | 報工規則 L52：超過「目標數量（含依放損率預留的投入量）」即警示——門檻語意不明 | L151-163 一律以目標數量為門檻 | `work-packages/page.js` L172 以 target_qty 判定 | wiki 疑似缺漏 |
| 9 | 報工權限守門 | 報工規則 L59：介面與系統兩層，繞過寫稽核日誌 | L165-177 一致 | 兩層檢查有，無稽核日誌留痕 | prototype 缺 |
| 10 | 轉交送達後下游到料量遞增（滾動放行） | 工序相依性規則 L30、L43 | L195-199 Scenario 明定 | `store.js` L94-122 `confirmTransfer` 只累加來源 `moved_qty`，未寫入下游 `arrived_qty` → 滾動放行鏈斷 | prototype 衝突 |
| 11 | 可做量＝各前置到料量取最小 | 工序相依性規則 L30 | L221-225 | `precedence.js` L50 算出 `workableQty` 但無任何頁面呈現 | prototype 缺 |
| 12 | 預設需轉交、印務只標例外 | 工序相依性規則 L43；轉交單 L30 | L183 明文 | 任務無 `needs_transfer` 欄；製程規劃無轉交標記 | prototype 缺 |
| 13 | 轉交可申請上限與作廢回補 | 生產任務 L52；轉交單狀態 L55、L57 | 未承載上限檢核與作廢回補 | 上限＝produced−moved，無作廢回補項 | openspec 缺／prototype 缺 |
| 14 | 可轉交量的數量口徑 | 生產任務 L49：產出數量＝良品＋不良品，上限取此數 | L191 Scenario 寫「已報工良品 300 → 可送 300」，口徑不一致 | 與 wiki 一致 | openspec 衝突 |
| 15 | 轉交單作廢（印務、附原因） | 轉交單狀態 L57；轉交單 L52 | 無作廢轉換的 Requirement／Scenario | transfers 頁全唯讀，無作廢動作 | openspec 缺／prototype 缺 |
| 16 | 現場回報通道與裝置政策 | `W03/廠務.md` L30：轉交回報走 Slack 表單；`W03/師傅.md` L42：師傅用 ERP 行動版 | openspec 生產段無「行動版／手機／Slack」任何規格 | 均為桌機表格頁；無行動版報工版型、無 Slack 通道 | openspec 缺／prototype 缺 |
| 17 | 報工裝置政策的 wiki 內部矛盾 | 報工規則 L78「現行政策桌機限定，待拍」vs 師傅卡 L42 已拍板行動版（PT-001 已封存） | — | — | wiki 疑似缺漏 |
| 18 | 開機費歸集與分攤 | 工作包 L39-40、L50-52 | L248-260 一致 | `setup_fee` 寫死、`allocation_basis` 固定不可調；無攤回計算 | prototype 缺 |
| 19 | 工作包欄位缺項 | 工作包 L35、L37-38：確樣需求、共用資源用量、拼版結果 | 未逐欄要求（引用 wiki） | mock 與檢視面板皆無此三欄 | prototype 缺 |
| 20 | 「上機日」欄位歸屬 | 工作包欄位表無上機日 | L42 要求生管「選定上機日」 | mock 有 `machine_date`、頁面有上機日欄與篩選 | wiki 疑似缺漏 |
| 21 | 停機以工作包歸集一次 | 報工紀錄 L53-55 | L109、L126-130 明文 | 只把停機記在批次第一筆（分兩次送出即重複計）；`calcMetrics` 未使用停機值 | prototype 衝突 |
| 22 | 時間稼動率取數 | 生產績效指標 L47-52：分子＝實際工時扣除停機、分母＝設備主檔可用時數 | `Oproduction-overview/spec.md` L83 一致 | 分子未扣停機；分母＝有報工的設備×日×8 | prototype 衝突 |
| 23 | 良率分母 | 生產績效指標 L40-44：良品數 ÷ 生產數量（投入） | L84 一致 | `yield = goodQty / totalQty`，totalQty 為產出端 | prototype 衝突 |
| 24 | 折損率分子（三處互斥） | 生產績效指標 L34-37：分子＝報廢數＋放損量 | L85 寫「（報工不良品數＋放損）÷投入」；`Oqc/spec.md` L87 又寫報廢處置計入報廢數 | 依 openspec 版取全部不良品＋放損 | openspec 衝突（含內部互斥）／prototype 衝突 |
| 25 | 漏單率 | 生產績效指標 L29、L68-74：六項指標含漏單率 | L6、L79 只列五指標 | 五張指標卡，無漏單率 | openspec 缺／prototype 缺 |
| 26 | 實際成本累積起點 | 生產績效指標 L58：工時＋材料＋設備＋外包四來源 | `Owork-order/spec.md` L469-487 一致 | `calcCostSummary` 讀靜態 `actual_cost`；報工不寫入成本，與 CostCompareTab 文案不符 | prototype 缺 |
| 27 | 印件詳情頁實際成本 | 生產績效指標 L58、L65 | order-management L1481-1530 印件詳情頁區塊無成本段 | 抽屜無成本、無生產任務清單、無報工入口 | 已拍板待改 |
| 28 | 印件詳情頁生產任務列的品質帳 | 齊套邏輯 L36：完工良品數唯一的家在印件層；生產任務 L88：品檢不掛生產任務 | order-management L1488-1491 複寫欄位並要求「入庫數量＋QC 狀態徽章」，與同檔 L1523 自我矛盾 | 未實作 | openspec 複寫＋衝突 |
| 29 | 術語規約 bubble-up | CLAUDE.md § 9 →「狀態向上傳遞」 | order-management L1497 仍用「bubble-up」 | — | 措辭過時 |
| 30 | 「交付」→「交付產線」 | wiki 已全用「交付產線」 | production-execution L3、L17、L26、L32；work-order L262-279 用「交付」 | schedule 頁、mock 寫「印務已交付」 | 已拍板待改 |
| 31 | 轉交上限公式的正本指向 | 轉交單 L70 指齊套邏輯，齊套邏輯 L32 與轉交單狀態 L73 指生產任務卡——三處不一致 | — | — | wiki 疑似缺漏 |

## 情境走查（段 2）

| 來源 | 規則條目 | openspec 對應 | prototype 對應 |
|---|---|---|---|
| 生產流程 L42-43（階段 4） | 師傅／供應商報工、首次報工向上反映 | 有 | 部分：批次報工有；供應商自助無、印務兩管道無；向上反映僅任務層 |
| 生產流程 L45-46（階段 5） | 報工累積可轉交量 → 廠務待搬清單 → 下游滾動開工 | 有 | 部分：待搬清單有；下游到料量未遞增 |
| 生產流程 L25-31（現場回報五載體） | 廠務 Slack 表單、師傅行動版 | 缺 | 缺 |
| 報工規則 L27-33 | 五管道、系統自動記錄 | 有 | 部分：兩管道 |
| 報工規則 L34-39 | 良品＋不良品＋原因＋照片 | 有 | 有 |
| 報工規則 L41-46 | 首次報工觸發製作中；指派不觸發 | 有 | 有 |
| 報工規則 L48-53 | 超目標警示不阻擋、達標即完成 | 有 | 有 |
| 報工規則 L55-60 | 範圍守門＋稽核日誌 | 有 | 部分：守門有，日誌無 |
| 工序相依性 L26-31 | 到料 >0 可派工、取最小、為 0 阻擋 | 有 | 部分：阻擋有；可做量不呈現、滾動不生效 |
| 工序相依性 L33-37 | 跨工單前置 | 有 | 有 |
| 工序相依性 L39-44 | 預設需轉交、標例外 | 有 | 缺 |
| 工序相依性 L52-57 | 前置受影響警示 | 有 | 有 |
| 轉交單狀態 L55 | 廠務確認搬運、自動成單、明細不超上限 | 有 | 有 |
| 轉交單狀態 L56 | 確認送達附簽收照 | 有 | 有（但直接成「已送達」，未經「運送中」，與狀態機兩步不一致） |
| 轉交單狀態 L57 | 作廢 | 缺 | 缺 |

## wiki 疑似缺漏清單（段 2）

1. 報工規則 L68、生產任務狀態 L96 任務層殘留措辭。
2. 報工規則 L52 超量警示門檻語意不明（目標數量 vs 含放損投入量）。
3. 報工規則 L78 裝置政策與師傅卡 L42（PT-001 已拍板）矛盾。
4. 報工規則 L38、報工紀錄 L41 引用已封存的 QC-003／QC-004 當未決。
5. 轉交單 L70 上限公式正本指向不一致（三處）。
6. 工作包欄位表無「上機日」。
7. 生產績效指標折損率分子在報工層取不到數（報工紀錄無報廢分類欄）。
8. 六項指標（含漏單率）與下游五指標不一致，漏單率承載介面未定。
9. 報工紀錄 L52 多筆跨設備與工作包「一次上機＝單一設備」語意未對齊。

## 段 2 相關 open OQ

PT-013（耗料，卡差異 #5）、PT-023（放損換算鏈，卡差異 #7）、PT-040（停機取數，卡差異 #21/#22）、PT-041（報廢除帳）、PT-027（成本基準）、PT-004（相鄰）。
已封存但仍被引用為未決：QC-003、QC-004、PT-001。

---

# 段 3：品檢、出貨

## 差異矩陣（段 3）

| # | 流程點／規則 | wiki 正本（卡名＋要點） | openspec 現況與差異（檔＋行號） | prototype 現況與差異（檔案路徑） | 性質 |
|---|---|---|---|---|---|
| 1 | 待驗清單＝品檢站在站量 | 品檢紀錄 L64、印件生產流程 L80 | qc/spec.md L17-28 一致 | inspection 頁 `arrived_qty` 為靜態 mock、未由轉交單推導 | prototype 缺 |
| 2 | 不通過原因值域＝六分組約 20 個固定選項、無「其他」 | 品檢紀錄 L41-55（值域正本） | qc/spec.md L54 引用 wiki 不複寫（合規） | `qc-shipping/_lib/mock-data.js:21` 六個平鋪選項且含「其他」 | prototype 衝突 |
| 3 | 驗畢通過品生成「品檢站 → 暫存區」搬運待辦 | 品檢紀錄 L64 | qc/spec.md L70 有 | `submitInspection` 無搬運待辦生成 | prototype 缺 |
| 4 | 品檢記錄介面＝ERP 行動版 | 品檢人員 L27 | qc/spec.md L34 有 | 桌機表格＋置中 dialog | prototype 缺 |
| 5 | 品檢紀錄只增不改、誤記走新增更正紀錄 | 品檢紀錄 L39 | qc/spec.md L32 有 | 扣減 `arrived_qty` 後該批消失，無更正入口 | prototype 缺 |
| 6 | 處置數量由印務填、一次處置一筆（可分次） | 印件 L96 | qc/spec.md L85 有 | DispositionDialog 無數量輸入；`store.js:32` 全額吃掉 | prototype 衝突 |
| 7 | 補做發起入口定案於印件層 | QC不通過補生產 L26 | work-order L443、L454 入口寫成品檢紀錄 | 印件列（合規） | 措辭過時 |
| 8 | 補做預帶＝起補工序與各工序補做量依齊套帳推算 | QC不通過補生產 L26 | work-order L443、business-scenarios L596 皆為「預帶全部工序、數量預填不通過數」 | `print-items/page.js:138` 同 | openspec 衝突／prototype 衝突 |
| 9 | 補做生產任務「補做來源」欄掛品檢紀錄（防重複發起） | QC不通過補生產 L26 | 兩 spec 皆無此欄與防重複機制 | 無 | openspec 缺／prototype 缺 |
| 10 | 品質帳只在印件層 | 齊套邏輯 L36 | order-management L1492、L1494、L1509、L1515、L1526-1529 要求生產任務列顯示入庫數量＋QC 徽章，與同檔 L1523 自我矛盾 | orders mock 印件節點留 `warehouse_qty`（20+ 處） | openspec 衝突 |
| 11 | 品檢無狀態機 | QC 狀態（已退役）、品檢紀錄 L39 | order-management L381、L432-434；business-scenarios L3、L18、L32、L67、L72、L118、L578、L602 QC 當單據狀態 | 已無舊 QC 任務型實作 | openspec 衝突／措辭過時 |
| 12 | 印件詳情頁統一（品檢紀錄、缺口處置遷入 Tab） | 已拍板 | sales-platform L110／L123／L134 仍列七 Tab 含獨立「QC 紀錄」 | 無印件詳情 route；內容在抽屜 | 已拍板待改 |
| 13 | 成本可見性 | 印件 L84-86；分權已拍板 | 無成本可見性 Requirement | 無成本／毛利率欄 | 已拍板待改 |
| 14 | 通過側守恆鏈：產出 ≥ 良品 ≥ 完工良品 ≥ 已出貨 ≥ 送達 | 齊套邏輯 L34 | 無 Requirement | 無 | openspec 缺／prototype 缺 |
| 15 | 印件層缺口口徑＝購買數量 − 完工良品數 | 齊套邏輯 L34（2026-08-05 定案） | qc/spec.md L85「不通過數量的累計形成品質缺口」，口徑不同 | `failed_unhandled` ＝不通過累計扣已處置 | openspec 衝突／prototype 衝突 |
| 16 | 「完工良品數」正名 | 印件 L80 | qc L68 以「入庫數」為主詞；order-management L606、L622、L2140「QC 入庫數」 | 「入庫累計」／`passed_qty` | 措辭過時 |
| 17 | 可出貨額度＝完工良品數 − 已出貨 ＋ 回補 | 印件 L83 | order-management L622、L1953、L2140 三處皆缺回補項 | `calcShippableQty` 以排除異常／作廢明細實現回補（等價、合規） | openspec 衝突 |
| 18 | 累計已出貨／送達數為衍生、不另存欄位（SHP-009） | 印件 L81-82 | order-management L1946「SHALL 有獨立的累計已出貨數量欄位」 | `shippable_qty` 靜態存值；與 qc-shipping 衍生算法並存 | openspec 衝突／prototype 衝突 |
| 19 | 印件無「出貨狀態」維度 | 印件狀態 L51、印件欄位表 | order-management L1946-1951 自創三值列舉「未出貨／部分出貨／已出貨」 | 無此三值 | openspec 複寫 wiki 列舉 |
| 20 | 印製維度含「製程已確認」 | 印件狀態 L45、L117-118、L154 | order-management L2161 缺此態；business-scenarios L26-30 印製由「等待中」直跳「製作中」 | `PRINT_ITEM_STATUS_META` 五值與 wiki 九態不對應 | openspec 複寫＋衝突／prototype 衝突 |
| 21 | 短出（讓步允收）收尾＝印務手動結案、購買數量與已出貨都不下修、批次連動 | 齊套邏輯 L42、印件狀態 L131-132／L161 | work-order L383-387「短出下修」與 wiki 直接相反；order-management L2157 無短交結案轉換；qc L102 僅一句 | 「不補（印件層結案）」只寫留痕，不推印製維度、不連動 | openspec 衝突＋缺／prototype 缺 |
| 22 | 短出退款為獨立維度（業務開退款異動） | 齊套邏輯 L42 | 無「短出結案 → 退款」掛接路徑 | 無 | openspec 缺 |
| 23 | 打樣週期歸零特例（六欄按週期歸零） | 齊套邏輯 L44、印件狀態 L162 | qc L109-121 只寫品檢紀錄不變；無歸零欄位清單 Requirement | 無 | openspec 缺／prototype 缺 |
| 24 | 出貨單七態單一路徑 | 出貨單狀態 L25-35 | shipment L140-155 一致；order-management L2118-2119 為兩條舊路徑、缺異常與已作廢；L631-632 同舊 | qc-shipping 七態一致；orders/mock-data.js:134 四值 | openspec 複寫＋衝突／prototype 衝突 |
| 25 | 物流段人工推進（不串物流商 API） | 出貨單狀態 L79、L89 | order-management L637「SHALL 透過 API 自動接收物流商狀態」 | 人工（合規） | openspec 衝突 |
| 26 | 實裝與明細不符：系統外通知業務、系統不設異常回報 | 出貨單狀態 L76、揀貨人員 L30 | shipment L59、L75 寫系統記錄異常並通知 | `packing_variance` 差異欄＋通知訊息 | openspec 衝突／prototype 衝突 |
| 27 | 送達憑證三方式不對稱 | 出貨單 L44、出貨單狀態 L79 | shipment L81 一致 | proof 硬寫字串，無上傳或輸入欄 | prototype 缺 |
| 28 | 作廢須附理由 | 出貨單 L45 | shipment L115、L131-133 一致 | 硬寫理由字串、無輸入欄 | prototype 缺 |
| 29 | 額度不足擋下後的兩條出路（補驗／談短出） | 出貨與送達 L34 | shipment L31-35 只有擋下 | 額度檢核等價擋下，無短出引導 | openspec 缺 |
| 30 | 送達累計 → 印製轉已送達 → 訂單自動完成 | 出貨單狀態 L94-95、出貨與送達 L30 | shipment L100 判準寫「印件數量」（正本詞為購買數量）；order-management 無「出貨中 → 訂單完成」Requirement | `confirmDelivery` 只改出貨單狀態，不連動 | 措辭過時／openspec 缺／prototype 缺 |
| 31 | 訂單完成附加條件：打樣結果＝OK | 訂單狀態 L60、L185 | 兩 spec 皆無 | 無 | openspec 缺／prototype 缺 |
| 32 | 出貨單不可跨訂單 | 出貨單 L32、L58 | shipment L17 一致；order-management L608 另加「跨訂單合併寄出由揀貨人員自行處理」——wiki 未定義 | 限單一訂單（合規） | openspec 衝突 |
| 33 | 出貨行為規格的單一落點 | 分工鐵則 | order-management 三段與 shipment 全篇大量重疊、版本互不一致 | — | openspec 複寫 |
| 34 | 出貨單為單一實作 | 出貨單、出貨單狀態 | — | 兩套並存且分歧：qc-shipping/shipments（對齊）vs orders/ShipmentsTab.js（四值物流狀態、無額度檢核、自創出貨日期欄） | prototype 衝突 |
| 35 | 品檢紀錄與品質帳單一資料源 | 品檢紀錄、印件 | — | print-items 與 qc-shipping 各持一份 `MOCK_QC_RECORDS` 與品質帳，互不同步 | prototype 衝突 |

## 情境走查（段 3）

### QC不通過補生產（六步）
步 1 品檢記錄：openspec 有、prototype 有（原因值域錯 #2、非行動版 #4）。步 2 印務一鍵發起補做：openspec 入口措辭掛品檢紀錄、預帶全工序（#7 #8）、無補做來源欄（#9）；prototype 僅 message 文字，未建異動與任務。步 3 生管確認：openspec 無此把關步、prototype 無。步 4 師傅報工：走同一路徑、prototype 未串。步 5 補做再驗回原累計：一致。步 6 自動收尾：openspec 一致、prototype 未連動。岔路短交結案：#21。岔路瑕疵品去向：兩軸實作合規、數量不可分次（#6）。岔路補做再缺口：openspec 未寫多輪。

### 品檢通過入庫正常路徑
待驗清單（#1）、分次驗累計（合規、主詞 #16）、逐批放大額度（合規）、搬運待辦（#3）、工單層不設品質欄（#10）、打樣同路徑（prototype 未實作打樣分支）。

### 齊套守恆條文
守恆鏈無 Requirement（#14）、缺口口徑（#15）、完工良品數唯一的家（#10）、多工單不取小（合規）、額度回補（openspec 缺回補項 #17、prototype 合規）、完成判定兩本帳脫鉤（openspec 一致、prototype 未連動）、短出不下修（#21）、打樣歸零（#23）。

### 出貨與送達（六步＋五岔路）
建單（合規；order-management 三處分歧版本 #17 #18 #19 #24 #32 #33）、揀貨（合規）、裝箱（合規、照片硬寫）、交付三方式（合規）、送達憑證（#27）、系統收尾（#30 #31）。岔路：額度不足（#29）、分批（合規）、實裝不符（#26）、異常回補（合規、無理由輸入 #28）、作廢（同）。

## wiki 疑似缺漏清單（段 3）

| # | 位置 | 內容 |
|---|---|---|
| A | 印件 L95 缺口處置 | 「處置決策」單選三分流 vs 情境卡與 qc spec 的「缺口補不補 × 瑕疵品去向」兩軸，欄位正本未同步 |
| B | 出貨單 L39 vs 出貨單狀態 L76 | 實裝不符回報：系統內 vs 系統外，兩卡相斥，下游都照系統內做了 |
| C | 品檢人員 L28 | 引用已封存 QC-003 當未決 |
| D | 齊套邏輯 L34 | 引用已封存 QC-004 當未決 |
| E | 印件 L55 vs 出貨單 L36 | 「出貨方式」同名欄位兩層並存，未宣告帶入關係 |
| F | 出貨與送達 L34 | 「結案後不再建新出貨單」把關條件未收入出貨單狀態卡建單條件 |
| G | 印件 L79「報廢數」 | 與生產任務「報廢」狀態同詞不同義，未區隔 |
| H | 品檢紀錄欄位表 | 無「本批到站量／受驗數量」欄，守恆條文無正本承載 |

## 段 3 相關 open OQ

PT-004（品檢資料遷移）、PT-041（守恆鏈依賴）、PI-005（印件交貨日，prototype 已自用 `delivery_date`）。
QC-、SHP- 系列全數已封存。無 OQ 承載的缺口：短交結案 openspec 矛盾、印件出貨狀態三值列舉去留。

---

# 段 4：副流程（訂單異動、售後補印、取消連鎖、工單異動、打樣）

## 差異矩陣（段 4）

### A. 訂單異動（金額）

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 1 | 退款認列兩段式（BI-25 拍板） | 訂單異動規則、訂單異動狀態 L81：核可停「已核可」、確認生效才認列 | 全庫仍寫核可即生效：order-adjustment 22、46、237、239、248、262、270、278-284；after-sales-ticket 247、253、273；order-management 598、604；order-billing 598。「確認生效」全庫 0 命中 | store 兩段已對齊 wiki | openspec 衝突 |
| 2 | 補收兩段（草稿覆核） | 訂單異動規則 § 補收免審 | order-adjustment 22、91-98、261、269 一鍵直達 | 兩段已對齊 | openspec 衝突 |
| 3 | 已核可校正窗口對線下退款一致適用 | 訂單異動規則、訂單異動流程 L47 | after-sales-ticket 261、order-adjustment 237 明文否定 | 已對齊 | openspec 衝突 |
| 4 | 確認可執行非終態、業務主管可取消 | 訂單異動狀態 L29、L83 | order-adjustment 22、239 寫終態不可逆；240 取消限草稿／已退回 | 已對齊 | openspec 衝突 |
| 5 | 取消原因一律必填 | 訂單異動規則第 6 條；訂單異動實體卡 | 全篇未要求 | 已對齊 | openspec 缺 |
| 6 | 應收認列門檻＝只算確認可執行 | 訂單異動規則鐵則 3 | order-adjustment 176「確認可執行或已核可」 | — | openspec 衝突 |
| 7 | 諮詢取消退費推進條件 | 訂單異動規則：諮詢人員確認生效才推進、與退款款項脫鉤 | order-adjustment 175 與 263 自相矛盾 | — | openspec 衝突 |
| 8 | 訂單異動狀態列舉 | 訂單異動狀態（正本） | order-adjustment 231-241 整表複寫且內容不符 | — | openspec 複寫 |
| 9 | 終態後不得於訂單詳情頁新增異動 | 訂單異動規則、明細時點分界 | order-adjustment 48-56 有閘門（對齊） | AdjustmentsTab.js:396 無終態守衛 | prototype 衝突 |
| 10 | 完成後加收「原單善後 vs 新生意」分流 | 訂單異動規則、售後受理與決議 | 只有售後單內建補收一條，無另開新訂單分支 | 同 | openspec 缺／prototype 缺 |
| 11 | 來源售後服務單標記不可改 | 訂單異動規則鐵則 4 | 只定義 FK 未寫不可變 | 隱含符合 | openspec 缺 |
| 12 | 狀態名「確認可執行」 | 正本 | business-scenarios 482、505、510、624、632 用「已執行」 | 正確 | 措辭過時 |
| 13 | 「收款項目」名稱 | 收款項目狀態 | business-scenarios 627 用 PaymentPlan（已宣告取代） | 正確 | 措辭過時 |
| 14 | 訂單終態名「訂單完成」 | 訂單狀態 | after-sales-ticket 全篇＋business-scenarios 461-648 用「已完成」 | 正確 | 措辭過時 |
| 15 | 售後建單前提＝訂單完成或已取消 | 售後服務實體卡、售後受理與決議步 1 | after-sales-ticket 41-46 僅允許已完成 | canCreateTicket 僅「訂單完成」 | openspec 衝突＋prototype 衝突 |

### B. 售後補印

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 16 | 補印收費的補收異動免審 | 售後服務規則 38、售後受理與決議 | after-sales-ticket 294 與 846、862-863 庫內自相矛盾（送審 vs 免審） | 已對齊（草稿→確認生效） | openspec 衝突 |
| 17 | 補印跳過審稿＝自動產生一筆審稿輪次、沿用最終合格稿件 | 售後服務規則 44 | after-sales-ticket 328-329 寫複製全部 reviewRounds | 補印印件建為「等待審稿」＝仍走人工審稿 | openspec 衝突＋prototype 衝突 |
| 18 | 補印印件印製維度初值「等待中」 | 印件狀態 | after-sales-ticket 334「待生產」 | 同「待生產」 | 措辭過時 |
| 19 | 補印是否經訂單管理人細節確認 | wiki 內部矛盾（售後服務規則 45 vs 售後受理與決議 39 A3 定案） | after-sales-ticket 367-372 按情境卡（印務主管直接分配） | 未實作 | wiki 疑似缺漏 |
| 20 | 補印不可同時改稿的出口 | 售後服務規則 47：走新訂單流程 | after-sales-ticket 349：走「規格變更」異動 | 無此分流 | openspec 衝突 |
| 21 | 補印印件必掛來源售後單（恆定約束） | 售後服務規則 43 | 有 FK 無恆定約束 | 對齊 | openspec 缺 |

### C. 訂單取消連鎖

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 22 | 生產任務連鎖依報工事實分流（作廢／報廢） | 訂單狀態 188、生產任務狀態 91-92 | order-management 583、592 未分流寫「報廢」，與同檔 604 自相矛盾 | cancelOrder 只改訂單狀態，無下層連鎖 | openspec 衝突＋prototype 缺 |
| 23 | 任務層已移除 | 工單狀態 124、生產任務狀態 102 | order-management 604 仍有任務層三層鏈 | 無任務層（對齊） | 措辭過時 |
| 24 | 取消 → 印件轉已棄用 | 印件狀態 163、185 | 有（對齊） | 僅畫面過濾，無棄用轉態 action | prototype 缺 |
| 25 | 印件印製維度狀態列舉 | 印件狀態九態＋打樣回頭與短交結案轉換 | order-management 2161 複寫且漏「製程已確認」、無兩條轉換 | — | openspec 複寫（不完整） |

### D. 工單異動與生產任務調整

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 26 | 生管確認關卡（審視→確認→重印紙本→離開異動） | 情境卡步 3、4 | work-order 141-153 無生管確認；business-scenarios 200 有（兩檔不一致） | store 無異動發起／確認 action；AdjustmentsTab 全唯讀 | openspec 缺＋prototype 缺 |
| 27 | 已有入庫成品時強制填處置說明 | 情境卡岔路 2 | 皆無 | 無 | openspec 缺／prototype 缺 |
| 28 | 最後一筆有效生產任務作廢阻擋 | 情境卡岔路 4 | 皆無 | removeProductionTask 無守衛，且會自動收斂已完成 | openspec 缺／prototype 缺 |
| 29 | 有報工未入庫者轉報廢 | 情境卡岔路 3 | business-scenarios 218-225 有；work-order 未寫 | 無作廢／報廢 action（僅硬刪） | prototype 缺 |
| 30 | 工單異動紀錄五欄 | 工單 § 異動紀錄子表 | work-order 155-166 缺異動類型與確認資訊 | 五欄齊備（比 spec 完整） | openspec 缺 |
| 31 | 工單異動規則正本指向 | 正本＝情境卡＋齊套＋工序相依 | work-order 143 指錯到「訂單異動規則」（金額卡） | — | 措辭過時 |
| 32 | 補做重開守衛終態範圍（已送達／已棄用） | 工單狀態 110 | work-order 445、463-467 只寫已送達 | 未實作補做重開 | openspec 缺／prototype 缺 |
| 33 | 短出結案不下修 | 印件狀態 161、175 | work-order 383-387 反向寫下修，與 qc 102 跨檔矛盾 | 未實作 | openspec 衝突 |
| 34 | 加量＝加開印件、原工單鎖定（PT-009） | 工單 § 建立來源＋§ 數量 | work-order 365 對齊；order-adjustment 121-126 對齊 | 可新增印件但無「複製原印件規格」加印入口；無生產內容提示 | prototype 缺 |

### E. 打樣決策與重打／稿件問題重審

| # | 流程點／規則 | wiki 正本 | openspec 現況與差異 | prototype 現況與差異 | 性質 |
|---|---|---|---|---|---|
| 35 | NG-製程由系統自動建新打樣工單 | 打樣流程 40、情境卡岔路 1 | order-management 200-203 改成業務發起；business-scenarios 91 自相矛盾 | 無打樣判定入口（sample_result 唯讀） | openspec 衝突＋prototype 缺 |
| 36 | 重打：已送達→等待中、打樣結果重置、舊週期樣品報廢＋歸零 | 印件狀態 54、133、162 | order-management 2161 無此轉換；business-scenarios 91 部分、無報廢歸零 | 無 | openspec 衝突＋缺／prototype 缺 |
| 37 | NG-稿件由系統自動棄用＋複製新印件（衍生來源追溯） | 打樣後稿件問題重審步 2、印件「衍生來源印件」欄 | order-management 205-208 寫「作廢＋業務重建」（用詞與角色錯）；business-scenarios 112-113 寫手動 | 無 | openspec 衝突＋prototype 缺 |
| 38 | 新印件審稿初值＝待分派、訂單管理人分派 | 情境卡步 3、印件狀態 | business-scenarios 113 寫「稿件未上傳」、無分派步 | 分派機制有、路徑未接 | openspec 衝突＋prototype 缺 |
| 39 | 打樣 OK 是大貨稿件上傳前置關卡 | 情境卡步 3、收斂狀態 | order-management 198 無此關卡 | 稿件上傳無打樣守衛 | openspec 缺／prototype 缺 |
| 40 | 序列強制對象＝大貨投產、不設系統管制（PT-025 拍板） | 打樣流程 § 序列強制 | work-order 129 寫「不得開大貨工單」＋引用已封存 OQ | 無管制（符合拍板） | openspec 衝突 |
| 41 | 訂單完成需打樣結果＝OK | 訂單狀態 185 | 訂單狀態機（210-324）無此條件 | 無 | openspec 缺／prototype 缺 |
| 42 | 工單類型由印件類型帶入 | 工單「工單類型」欄、打樣流程 | work-order 125-139 對齊 | ACCEPTANCE.md:123 自承 mock 違反（同印件掛大貨＋打樣） | prototype 衝突（mock 層） |

## 情境走查（段 4）

### 工單異動與生產任務調整
步 1 新增任務：openspec 有；prototype 守衛只允許草稿／重新確認製程，製作中無新增路徑。步 2 鏡像異動：openspec 有；prototype 缺 action。步 3 生管確認：work-order 無（business-scenarios 有）；prototype 缺。步 4 重印紙本＋回原狀態：回原狀態有、重印無；prototype 缺。步 5 重算完成度：有；prototype 有（無異動語意）。步 6 交付新任務：有；有。岔路 1-4：見矩陣 #26-29。

### 打樣決策與重新打樣
步 1 客戶回饋：openspec 有；prototype 缺動線。步 2 業務填三值：openspec 角色與觸發錯（#35 #37）；prototype 無入口。步 3 打樣 OK 開放大貨稿上傳：兩邊皆缺關卡（#39）。步 4 大貨審稿：有；有（無守衛）。岔路 NG-製程／NG-稿件：見 #35-38。

### 打樣後稿件問題重審
步 1 判定（前提未寫）；步 2 自動棄用＋複製（openspec 部分、prototype 缺）；步 3 分派步缺；步 4 審稿週期（business-scenarios 跳過「已確認可製作」與「製程已確認」）；步 5 缺訂單管理人確認關卡。岔路補件迴圈：兩邊有；再判 NG 重入：無。

### 售後受理與決議
步 1-5 與岔路 4、5 大致對齊（終態前提 #15 例外）。岔路 1 退款：openspec 認列時點衝突（#1）；prototype 對齊。岔路 2 補印：openspec 輪次複製與狀態名不符（#17 #18）；prototype 衝突。岔路 3 補收：openspec 寫成送審（#16）；新訂單分支缺（#10）。

### 訂單異動流程
補收兩段（openspec #2）、開票收款（對齊）、退款三進入點（取消連鎖 #22、售後對齊、諮詢矛盾 #7）、退款共用後續（#1 #3）、發票二選一（對齊）、已核可校正（#3、after-sales-ticket 279-286 Scenario 內部矛盾）、取消建錯的單（#4 #5）、預開低於實作（對齊）、三方對齊（對齊）。

## wiki 疑似缺漏清單（段 4）

1. 補印是否經訂單管理人細節確認：售後服務規則 45 vs 售後受理與決議 39（A3 定案 2026-08-05），原文相斥。
2. 物流問題是否走售後：售後服務規則 78 排除 vs 售後服務實體卡 45 值域含「物流問題」＋印件卡 44「物流問題重製」。
3. OQ 序號 PI-005 撞號（平層印件交貨日 vs 已封存打樣免審）。
4. 打樣重打歸零與 PT-041 報廢除帳耦合，兩處未互相回指。
5. 訂單「已取消」後的售後路徑未在售後服務規則卡展開（通篇只寫「訂單完成後」）。

## 段 4 相關 open OQ

PT-041（作廢／報廢數量帳收斂，直接卡完成度重算條文）、PT-027（改價與快照）、PI-005（交期倒推輸入源）、ORD-043（取消連鎖依訂單類型盤點）、PT-036（異動發起前檢查留痕）。
關鍵背景：BI-25（兩段式認列）與 PT-025（序列不設管制）已拍板落 wiki，openspec 全庫未同步；prototype 訂單異動實作是三方中最新的一面。
