# 試做 B：轉交單管理畫面的需求描述（照版型選擇規則）

| 項目 | 內容 |
|------|------|
| 受測方法 | 票 42 Answer「版型層：採用的來源與用在哪一步」一節；Ant Design 官方設計規範頁七頁（本機副本） |
| 商業內容來源 | wiki 卡 [[轉交單]]、[[轉交單狀態]]、[[場內轉交與修正]]、[[場內外流轉活動清單]]、[[生產單據檢視活動清單]]、[[廠務]]、[[生產任務]]（具名清單、轉交可申請上限欄）、[[生產任務轉交狀態]]（狀態列舉與推導條件）、[[ERP 詞彙表]]（生管、廠務詞條） |
| 下游規範 | erp 主檢出 `.claude/skills/prototype-from-prompt/SKILL.md`、`Designs.md`、`docs/recipes/` 兩份配方、`docs/component-catalog.md`（查元件做不做得出）、`packages/shared/components/common/GenericFilter.js` 與 `FilterBlock.js`（確認新增鈕位置） |
| 沒讀 | erp `apps/erp/src/app/(prototype)/production-floor/transfers/` 整個目錄；`(prototype)/MOCK-DATA-CHAIN.md` |
| 日期 | 2026-11-14 |

路徑縮寫：下文「spec/」指 `/tmp/workflow-rebuild-ticket42-src-20261113/src/ant/spec/`；「erp/」指 `/Users/b-f-03-029/erp/`。

---

## 一、需求描述正文

以下整段可貼給 `prototype-from-prompt`。

### 需求來源與用詞

- 商業規則正本是 Sens wiki 卡：轉交單、轉交單狀態、場內轉交與修正、場內外流轉活動清單、生產單據檢視活動清單、生產任務。
- 欄位名、狀態名、操作名照下列寫法，不改同義詞。操作名：建立轉交單、檢視轉交單、作廢轉交單。
- 狀態只有五種：待搬運、搬運中、已送達、已點收、已作廢。

### 範圍

- 本次做四件事：轉交單清單、檢視轉交單（明細頁）、建立轉交單、作廢轉交單。
- 使用者是辦公角色，只做桌機寬度。
- 不在本次：編輯轉交單、重開轉交單、開始搬運、抵達站點、點收、修正點收、作廢點收紀錄。這些操作鈕本次一律不出現。

### 角色與權限差異（用腳手架的角色切換器切換）

| 角色 | 看得到哪些轉交單 | 可建立轉交單 | 可作廢轉交單 |
|------|----------------|------------|------------|
| 生管 | 來源生產任務的產線在所屬產線內，或目的產線在所屬產線內 | 可，限來源生產任務的產線在所屬產線內 | 可，範圍同「看得到」 |
| 印務、印務主管（代行生管） | 同生管 | 同生管 | 同生管 |
| 廠務 | 只看負責廠務是自己的單 | 不可 | 不可 |
| Supervisor | 全公司 | 不可 | 不可 |

需求原文寫「廠務建立與作廢轉交單」，與 wiki 不符。本描述照 wiki，待 PM 確認（見第五節第 1 項）。

### 頁型

| 頁 | 頁型 | 視覺參照 |
|----|------|---------|
| 轉交單清單 | 資源列表頁：上方篩選列，下方表格；建立用右側抽屜 | 像 `/admin-user` 列表 |
| 轉交單明細 | 詳情頁：獨立頁面；分段平鋪，不分頁籤 | 像 `equipment/detail`、`outsource/detail` 的分段唯讀欄位 |
| 建立轉交單 | 清單頁右側抽屜，抽屜內含可勾選、可填數量的表格 | 像資源列表頁的新增抽屜 |
| 作廢轉交單 | 明細頁上的置中確認對話框，含必填原因 | 一般二次確認對話框 |

### 頁 1：轉交單清單

- 篩選列：一個搜尋框，提示文字「搜尋轉交單編號 / 所屬印件」。篩選條件：狀態、目的產線、負責廠務。
- 篩選列右側放一顆主按鈕「建立轉交單」。廠務與 Supervisor 看不到這顆按鈕。
- 表格欄位依序：轉交單編號、狀態、目的產線、所屬印件（可多筆）、負責廠務、預計轉交日、實際轉交日、建單人、建單時間。
- 點轉交單編號進入明細頁。
- 預設依建單時間由新到舊排序。
- 表格不放列操作鈕，不設批次勾選。
- 沒有資料或搜尋沒有結果時，顯示空狀態。

### 頁 2：轉交單明細（獨立頁）

| 段 | 內容 |
|----|------|
| 1 基本資料 | 轉交單編號、狀態、目的產線、所屬印件、負責廠務、預計轉交日、備註。段標題右側放「作廢轉交單」按鈕（顯示條件見頁 4） |
| 2 動作者與時間 | 建單人、建單時間、實際轉交日。狀態為已作廢時，加顯示作廢時間、作廢人、作廢原因 |
| 3 轉交明細（表格） | 生產任務、急件標注、目的站點、搬運數量、點收量、簽收照片 |
| 4 點收紀錄（表格） | 所屬明細的生產任務、點收數量、備註、點收人、點收時間、作廢人、作廢時間、作廢原因。作廢的那一筆仍列出，標示「不計入點收量」 |
| 5 點收修正紀錄（表格） | 所屬點收紀錄、修正欄位、修正前、修正後、修正人、修正時間、修正原因 |
| 6 搬運數量修正紀錄（表格） | 所屬明細的生產任務、修正前、修正後、修正人、修正時間、修正原因 |
| 7 歷程紀錄 | 時間軸，新到舊；一行記時間、操作人、發生什麼 |

- 某一段沒有資料時保留該段，顯示空狀態文字。各段順序在每張單都相同。
- 警示：任一條明細的來源生產任務在「報廢」或「已作廢」，且本單在待搬運、搬運中或已送達時，頁面頂部顯示常駐警示。警示說明來源生產任務已終止、這張單不能點收（文案待 PM 確認）。
- 「作廢轉交單」是本頁唯一的操作鈕，用紅色危險樣式，不設為主按鈕。

### 頁 3：建立轉交單（右側抽屜）

抽屜上半是待轉交任務表格：

- 列出待轉交任務：生產任務轉交狀態為「待轉交」的生產任務，且生產任務的產線在操作者的所屬產線內。
- 依目的產線分群。一群就是一張轉交單，讓使用者看得出這次會建幾張單。
- 每列可勾選。欄位：生產任務、目的站點、急件標注、轉交可申請上限、搬運數量（輸入）。
- 勾選後才能填搬運數量。沒有待轉交任務時顯示空狀態。

抽屜下半是單頭欄位，單欄由上到下：

| 欄位 | 必填 | 說明 |
|------|------|------|
| 負責廠務 | 必填 | 下拉選單，候選限具廠務角色的人員 |
| 預計轉交日 | 必填 | 日期 |
| 備註 | 選填 | 多行文字 |

抽屜確認鈕文字為「建立轉交單」。

建立時的規則（照 wiki）：

| 規則 | 內容 |
|------|------|
| 明細 | 至少勾選一筆；同一筆生產任務在一張單裡只出現一次 |
| 搬運數量 | 大於 0，且不超過該生產任務的轉交可申請上限 |
| 檢核時點 | 以按下「建立轉交單」那一刻的最新額度計 |
| 超額處置 | 任一筆超額，這次一張單都不建立；在超額的那幾列旁顯示錯誤，抽屜不關閉 |
| 分組成單 | 系統按目的產線分組成單；同一條目的產線併成一張單的多條明細，各明細的目的站點可不同 |
| 系統寫入 | 轉交單編號（格式 TT-YYYYMMDD-NNN）、建單人、建單時間；狀態一律為待搬運；所屬印件與目的產線由明細推導 |
| 通知 | 系統只通知負責廠務。Prototype 不需呈現通知 |

建立成功後：

- 關閉抽屜，頁面頂部顯示會自動消失的訊息「已建立 N 張轉交單」。
- 新建的單排在清單最前面。

假設：負責廠務、預計轉交日、備註套用到這次建立的每一張單（待 PM 確認，見第五節第 3 項）。

### 頁 4：作廢轉交單

- 「作廢轉交單」只在狀態為待搬運、搬運中、已送達時顯示。已點收、已作廢時不顯示。
- 按下後跳出置中確認對話框。對話框說明作廢後果：這張單不算數，各明細的搬運數量退回來源生產任務的轉交可申請上限。
- 對話框內有「作廢原因」，必填，自由填寫文字。
- 對話框按鈕：「作廢轉交單」（紅色危險樣式）、「取消」。
- 作廢只能以整張單為單位，不能作廢單條明細。

作廢成功後：

- 狀態變為已作廢；段 2 顯示作廢時間、作廢人、作廢原因；歷程紀錄新增一行。
- 「作廢轉交單」按鈕消失。
- 頁面頂部顯示會自動消失的訊息「已作廢轉交單」。

作廢失敗時：

- 作廢與點收同時發生時，先寫入的成立。若送出作廢前這張單已被點收，作廢被拒絕。
- 這時用對話框說明原因（例：這張單已點收，不能作廢），按確定後頁面更新為最新狀態（文案待 PM 確認）。

### 模擬資料（mock）

- 值照 `(prototype)/MOCK-DATA-CHAIN.md`；新增的值沿用 wiki 卡的資料範例格式（如 TT-20260904-001、A5 型錄、壓克力產線、數位站、負責廠務陳志明、建單人林雅婷）。
- 至少涵蓋下列情況：

| 情況 | 用來看什麼 |
|------|-----------|
| 五種狀態各至少一張 | 作廢鈕的顯示條件、狀態標籤 |
| 一張單含兩張印件的貨、兩個目的站點 | 所屬印件多筆、明細目的站點不同 |
| 一張已點收的單，有點收短少後再點收 | 點收紀錄多筆 |
| 一張有作廢的點收紀錄 | 作廢那一筆仍列出、不計入點收量 |
| 一張有搬運數量修正與點收修正 | 兩張修正紀錄表 |
| 一張在途單，其來源生產任務已報廢 | 頁面頂部警示 |
| 待轉交任務至少分屬兩條目的產線，其中一筆轉交可申請上限很小 | 分群成單、超額擋下 |

### 本描述的假設（產出說明中請標註）

- 一次建多張單時，單頭三欄共用（第五節第 3 項）。
- 狀態標籤顏色未定，程式內標 `// TODO: 請 PM 確認狀態顏色`（第五節第 4 項）。
- 錯誤提示與警示的文案是草稿（第五節第 5 項）。

---

## 二、過程紀錄

| # | 判斷題 | 來源檔與原文句 | 選擇 |
|---|--------|---------------|------|
| 1 | 清單用哪種呈現 | spec/data-list.md：「Tables are used especially when the user would benefit from more data exposure without having to go into the details of the object.」；spec/research-list.md：「When each entry needs to expose many fields; use when users have an accurate query scope when searching for entries.」 | 表格。一張轉交單要露出編號、狀態、目的產線、印件、負責廠務、兩個日期，使用者多半知道要找哪張單。erp/docs/recipes/resource-page.recipe.md 有現成配方：「要做一個「列表 + 篩選 + 新增/編輯抽屜」的後台資源頁」 |
| 2 | 清單版面：篩選放上方或側欄 | spec/research-list.md：「Stack from top to bottom, with the data filtering module at the top.」；同檔：「Place the data filtering module in the sidebar when there are many filtering conditions and ample horizontal space.」 | 單欄，篩選在上。篩選條件只有三項，不到「many」 |
| 3 | 搜尋方式 | spec/data-list.md：「Known Items Exploration: Start the search with verbally describable known items.」；同檔：「Exploratory query: search for a target with a defined but broad scope.」 | 已知單號用搜尋框；依狀態、目的產線、負責廠務找單用篩選條件。搜尋框只放一個，照 erp/docs/recipes/resource-page.recipe.md：「多條件搜尋用單一 `search` 框 + placeholder 列出條件」 |
| 4 | 分頁 | spec/data-list.md：「Recommended by default. When used, when the content of the page is less than one page, the pager will not be displayed.」 | 與 erp 配方不相容，照 erp（見不相容紀錄第 3 項） |
| 5 | 明細怎麼開啟 | spec/data-list.md：「if the information display exceeds one screen, it is not convenient for the user to use the unfolding method」；同檔：「Details need to be shared with others separately, or complex immersive tasks」 | 獨立頁。明細含七段，超過一個畫面；同一張單由建單的生管、搬運的廠務、點收的人分別查看，屬於要單獨分享的明細。erp/docs/recipes/detail-page.recipe.md 有配方：「點列表某一筆要看完整內容的頁」 |
| 6 | 明細頁用哪一版 | spec/detail-page.md 基本版：「To display information with less content and low complexity.」；分頁版：「When the detail page has large and complex content, it has to be split into multiple tabs to guide users to browse information.」；設計原則：「Try to display the information as flat as possible. Do not hide or fold up the content if not necessary.」 | 基本版，分段平鋪，不分頁籤。七段內容都屬同一趟搬運，關聯度高；依「flat as possible」不收進頁籤。複雜度的門檻方法沒給，見第四節第 2 項 |
| 7 | 明細頁怎麼分段 | spec/detail-page.md：「Cards: to display information on one topic;」 | 一段一個主題，各自成框。照 erp/docs/recipes/detail-page.recipe.md：「多段就重複 `BorderBlock` + `SectionHeader`（number 遞增）。」與基本版的「一整張卡」寫法不同，見不相容紀錄第 5 項 |
| 8 | 某段沒資料時怎麼呈現 | spec/detail-page.md：「try to use similar layouts and modules to reduce the interference of structural differences to users」；spec/data-list.md：「When the list has no data or no search results, an empty state should be displayed.」 | 保留該段並顯示空狀態，各狀態的單段落順序一致 |
| 9 | 建立按鈕放哪 | spec/data-list.md：「New button in the upper right corner」 | 篩選列右側一顆「建立轉交單」。erp 的篩選列外殼把新增鈕放在篩選區下層、靠右（`FilterBlock.js` 下層 `justify-content: flex-end`），位置在表格右上方，與規則相容。erp/docs/component-catalog.md：「上半放篩選條件，下半放查詢／重置等操作按鈕」 |
| 10 | 建立用彈窗、抽屜或獨立頁 | spec/data-list.md：「Click to trigger a new form pop-up window, drawer, page, etc.」 | 方法列了三種、沒給選擇條件。照 erp 資源列表頁配方用右側抽屜（見第四節第 4 項） |
| 11 | 建立用哪種表單 | spec/research-form.md 基本表單：「When a simple and quick task needs to be completed, e.g., creating with minimal information input.」；可編輯清單：「Editable Table: Recommended when the number of form items is between 2 and 5, so each row of content can be fully displayed.」；版面：「Arrange all the information to be filled out from top to bottom in a single column within one area, guiding users to read vertically.」 | 單頭三欄用單欄基本表單；明細用可編輯表格，每列露出生產任務、目的站點、急件標注、轉交可申請上限、搬運數量。「form items」怎麼數，方法沒講清楚，見第四節第 3 項 |
| 12 | 單頭欄位用哪類輸入 | spec/data-entry.md 下拉：「Used when there are more than five options.」；日期：「DatePicker provides a visual way to browse and select a date or date range for users.」；多行：「It's a multi-line text input for single long text.」 | 負責廠務用下拉（廠務人員數不固定，可能多於五人）；預計轉交日用日期選擇；備註用多行文字。實際元件由 erp skill 的代理照元件目錄決定 |
| 13 | 欄位標題放左側或上方 | spec/data-entry.md：「Input usually works together with label which is to the left of input by default」；同段：「However, it should be consistent within the same system.」 | 與 erp 配方不相容，照 erp 的上方標題（見不相容紀錄第 4 項） |
| 14 | 清單頁主按鈕幾顆 | spec/buttons.md：「There is at most one primary button per a button group.」 | 清單頁只有「建立轉交單」一顆主按鈕 |
| 15 | 抽屜的確認鈕放哪 | spec/buttons.md：「Body section has collapsed or hidden content, such as it could not show the entire content in one screen;」 | 抽屜內表格可能超過一個畫面，規則指向頁尾。erp 抽屜元件把按鈕放右上角，照 erp（見不相容紀錄第 1 項） |
| 16 | 按鈕文字 | spec/buttons.md：「Should use verb (except dropdown buttons)」；同檔：「Describe the action result.」；同檔：「If primary action means negative, stress the consequences.」 | 建立抽屜的確認鈕寫「建立轉交單」，不用預設的「確認」；作廢對話框的確認鈕寫「作廢轉交單」，對話框內說明作廢後果 |
| 17 | 作廢鈕放哪、用什麼樣式 | spec/buttons.md：「Header: subject's heading, summary and navigation」；同檔危險按鈕：「Warns users that there are risks involved in the action.」 | 放明細頁基本資料段的標題右側，紅色危險樣式。erp/docs/recipes/detail-page.recipe.md：「用 `SectionHeader` 分段，段內以「標題 + 值」的唯讀欄位呈現，右上放操作按鈕。」相容 |
| 18 | 表格內要不要放列操作 | spec/data-list.md：「By default, click on the title to navigate to the details」；spec/buttons.md：「Low emphasis and light-weight button type, such as actions in a table.」 | 轉交單編號當連結進明細頁。表格不放列操作鈕；作廢只放明細頁（見第四節第 8 項） |
| 19 | 作廢前怎麼確認 | spec/data-list.md：「When clicking the delete operation, a second confirmation is required.」；spec/feedback.md 氣泡確認：「When the operation of the target element requires further confirmation by the user, a floating layer prompt is ejected near the target element to inquire the user.」 | 要二次確認。不用按鈕旁的氣泡確認，改用置中對話框，因為 wiki 規定作廢要填原因（見第四節第 14 項）。erp/docs/component-catalog.md 確認對話框：「任何操作需向使用者二次確認時」 |
| 20 | 作廢成功的回饋 | spec/feedback.md：「The feedback floating layer triggered by an operation is centered on the top and disappears automatically, which is a lightweight reminder that does not interrupt the user's operation.」 | 頁面頂部會自動消失的訊息。erp/Designs.md：「全域訊息透過 `App` + `MessageInitializer`（AntD `message` / `notification`）。」相容 |
| 21 | 作廢失敗的回饋 | spec/feedback.md：「for more important failure notifications, it is recommended to use a dialog box to notify you to avoid missing information.」 | 作廢被拒（單已被點收）時用對話框說明原因 |
| 22 | 建立成功的回饋 | spec/data-list.md：「After the creation is completed, the newly created content appears in the first item of the list and is briefly highlighted.」；spec/feedback.md 訊息（同第 20 項原文句） | 頂部訊息「已建立 N 張轉交單」，新單排第一。短暫高亮 erp 沒有共用做法，見不相容紀錄第 2 項 |
| 23 | 超額與必填錯誤的回饋 | spec/feedback.md：「does not disappear automatically (it disappears when the user performs the corresponding interaction)」 | 錯誤提示緊跟在出錯的列或欄位旁，不自動消失，抽屜不關閉 |
| 24 | 來源任務終止時的警示 | spec/feedback.md：「It is a non-blocking information display. It does not interrupt the user's current operation.」 | 明細頁頂部常駐警示。erp/docs/component-catalog.md：「表單或頁面頂部的提示訊息」相容 |
| 25 | 建立抽屜裡的分群呈現 | erp/docs/component-catalog.md 群組表格：「清單要依某個維度分群呈現」。規範頁七頁無對應規則 | 依目的產線分群，一群一張單。依據是 wiki 的分組成單規則（見第四節第 5 項） |
| 26 | 歷程怎麼呈現 | erp/docs/component-catalog.md：「詳情頁要呈現操作歷程時」。規範頁七頁無對應規則 | 時間軸，新到舊 |

---

## 三、不相容紀錄

| # | 規範頁原文句與位置 | erp 原文句與位置 | 怎麼處理 |
|---|------------------|-----------------|---------|
| 1 | spec/buttons.md「When to Put Buttons in the Footer?」：「Body section has collapsed or hidden content, such as it could not show the entire content in one screen;」 | erp/docs/component-catalog.md GenericFormDrawer：「右上角提供取消與確認按鈕」 | 照 erp：建立抽屜的「取消」與「建立轉交單」放右上角 |
| 2 | spec/data-list.md「New button in the upper right corner」：「After the creation is completed, the newly created content appears in the first item of the list and is briefly highlighted.」 | erp/.claude/skills/prototype-from-prompt/SKILL.md 第 2 步：「禁止在 prototype 就地手刻共用模式」 | 元件目錄沒有「新列短暫高亮」。新單排第一、不做高亮。PM 若要高亮，屬跨模組會重用的視覺模式，照元件先行規則請前端先補進共用元件庫 |
| 3 | spec/data-list.md「Pagination」：「Recommended by default. When used, when the content of the page is less than one page, the pager will not be displayed.」 | erp/docs/recipes/resource-page.recipe.md Prototype 版骨架：`<Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />` | 照 erp 配方：Prototype 不分頁；前端接手時由正式版的資源頁工具處理分頁 |
| 4 | spec/data-entry.md「Tips and helps」：「Input usually works together with label which is to the left of input by default」 | erp/docs/recipes/resource-page.recipe.md Prototype 版骨架：`<Form layout="vertical">` | 照 erp：欄位標題放輸入框上方。規範頁同段也要求同一系統一致：「However, it should be consistent within the same system.」 |
| 5 | spec/detail-page.md「Basic Detail Templates」：「Basic layout templates display the main information on one whole card, using non-column split lines to separate the content into groups.」 | erp/docs/recipes/detail-page.recipe.md「升級重點」：「多段就重複 `BorderBlock` + `SectionHeader`（number 遞增）。」 | 照 erp：一段一個框。規範頁的分段方法也允許「Cards: to display information on one topic;」，差異只在基本版範本 |
| 6 | spec/data-list.md「Paging」：「The user's browsing position in the original list should be cached, and the browsed items in the list should be marked.」 | erp/.claude/skills/prototype-from-prompt/SKILL.md 第 2 步：「禁止在 prototype 就地手刻共用模式」 | 元件目錄沒有「已瀏覽標記」與「返回原捲動位置」。本次不做，不寫進需求描述 |

---

## 四、方法沒涵蓋、自己補判斷的地方

| # | 補判斷 | 方法有沒有給依據 | 我的依據 |
|---|-------|----------------|---------|
| 1 | 角色與權限照 wiki，不照需求原文（需求寫廠務建立、作廢） | 沒有 | [[場內外流轉活動清單]] ACT-FLW-001、ACT-FLW-011 歸生管；[[廠務]] 範圍外寫「轉交單的建立、修改、作廢 → [[生管]]」；任務書規定規則照 wiki |
| 2 | 明細頁七段仍算基本版，不用分頁版 | 部分：給了「資訊複雜度與關聯度」兩個維度，沒給門檻 | 七段都描述同一趟搬運；設計原則「flat as possible」 |
| 3 | 可編輯表格的「form items」以每列露出的欄位數（5 欄）計，不以可輸入欄位數（1 欄）計 | 部分：給了筆數門檻，沒說怎麼數 | 若只數可輸入欄位，會落到「動態增減」，但列是從既有生產任務勾選來的，不是自由新增，所以不適用 |
| 4 | 建立用右側抽屜，不用彈窗或獨立頁 | 沒有：只列出三種 | erp 資源列表頁配方用抽屜 |
| 5 | 待轉交任務放進建立抽屜，並依目的產線分群 | 沒有 | wiki：「在待轉交任務勾選要送的量建單」「系統按目的產線分組成單」 |
| 6 | 清單欄位挑哪幾個 | 部分：查詢表格要露出多欄，沒說哪幾欄 | 只取 [[轉交單]] 單頭與動作者欄位；[[轉交單狀態]] 範圍外寫清單呈現屬介面設計 |
| 7 | 篩選條件用狀態、目的產線、負責廠務 | 部分：給了兩種搜尋模式，沒說用哪些條件 | 三欄是單頭的單選欄位，最常用來縮小範圍 |
| 8 | 作廢只放明細頁，清單不放列操作 | 沒有 | 作廢要先看清單內容與狀態再決定；清單保持只有一顆主按鈕 |
| 9 | 清單不設批次勾選 | 沒有 | wiki 沒有批次作廢；作廢要逐張填原因 |
| 10 | 「要單獨分享」成立 | 部分：給了條件，沒給判斷方法 | 同一張單由生管、負責廠務、點收人分別查看；通知帶著那張單 |
| 11 | 已點收、已作廢時隱藏作廢鈕，不做停用加提示 | 沒有 | [[轉交單狀態]] 可作廢的狀態；Sens AGENTS.md 陷阱「當前狀態用不到的操作鈕做成停用加提示；要直接隱藏」 |
| 12 | Prototype 不呈現通知負責廠務 | 沒有 | 通知走 Slack，不在本畫面 |
| 13 | 沒資料的段落保留並顯示空狀態 | 部分：規範頁要求結構一致、清單空時顯示空狀態，沒講詳情頁的空段 | 各狀態的單版面一致，使用者不必重新找段落 |
| 14 | 作廢確認用置中對話框，不用按鈕旁的氣泡確認 | 部分：兩種都有規則，沒講要填欄位時選哪種 | wiki 規定作廢原因必填，氣泡確認放不下輸入框 |
| 15 | 狀態標籤顏色不決定，標待辦 | 沒有 | 票 42 細節層把業務狀態對顏色的對照表列為未定；erp skill 允許先標 `TODO` |

---

## 五、未定事項（要 PM 決定）

| # | 事項 | wiki 現況 | 本描述的處理 |
|---|------|----------|------------|
| 1 | 誰建立、作廢轉交單 | 需求原文寫廠務。wiki 寫生管建立與作廢、印務與印務主管代行；廠務只做開始搬運與抵達站點，看自己負責的單。[[廠務]] 寫廠務照紙本工單與 Slack 作業、不必登入系統，與「辦公角色、桌機」也不一致 | 照 wiki。若 PM 要改成廠務，要先改 wiki 卡 |
| 2 | 建單的候選範圍與分批送貨衝突 | [[生產任務]] 具名清單「待轉交任務」只收轉交狀態為「待轉交」（搬運量等於 0）的任務。[[場內轉交與修正]]「邊做邊送」「先做完再分批」要在任務已有轉交單（轉交狀態為「轉交中」）時再建單。依現行定義，第二批建不出來 | 照具名清單的定義。這是 wiki 兩卡矛盾，建議開 OQ |
| 3 | 一次建多張單時，負責廠務、預計轉交日、備註共用或逐張填 | wiki 沒寫 | 假設共用 |
| 4 | 五種狀態的標籤顏色 | wiki 沒寫；票 42 列為未定 | 程式內標待辦 |
| 5 | 錯誤提示與警示的文案：超額、必填未填、作廢被拒、來源任務終止 | wiki 只寫規則，沒寫文案 | 寫了草稿，待 PM 確認 |
| 6 | 路由與檔案位置 | erp 已有 `production-floor/transfers/` 目錄（本次未讀） | PM 決定新建或改既有頁。改既有頁時，erp skill 會沿用既有結構，本描述的頁型判斷可能用不上 |
| 7 | 清單欄位與篩選條件 | [[轉交單狀態]] 範圍外寫清單呈現屬介面設計，不在知識庫 | 自選，待 PM 確認 |
| 8 | 清單要不要標示來源任務已終止的警示、要不要顯示急件 | wiki 寫在途單「會被標示警示」，沒寫在哪裡；急件標注是明細層欄位 | 只在明細頁頂部警示；清單不顯示急件 |
| 9 | 作廢後要不要在同頁提供重開轉交單 | wiki 有重開轉交單（OP-TT-002），常接在作廢之後 | 不在本次範圍，不出現 |

---

## 附：規範頁中略過的內容

規範頁七頁沒有對代理下指令的文字。下列內容與本任務的版型判斷無關，未取用：

| 來源 | 略過的內容 | 理由 |
|------|-----------|------|
| spec/research-form.md | 登入、註冊、設定頁範本；步驟表單；規則樹 | 不是本次頁型 |
| spec/research-form.md | 要求設計前先讀外部的表單規則頁與資料輸入規則頁 | 外部連結，不在基線；資料輸入規則頁已在七頁內 |
| spec/research-list.md | 卡片清單、搜尋清單、成員管理範本 | 不是本次頁型 |
| spec/data-list.md | 「Security check」對破壞性操作要求高強度安全驗證 | wiki 對作廢只要求填原因，未要求額外驗證；依規則照 wiki |
| spec/data-list.md | 「Communicate well with developers to understand system performance」 | 屬開發溝通，不是版型判斷 |
| spec/data-list.md | 同頁載入、虛線新增鈕、清單專屬區 | 本次不適用 |
| spec/buttons.md | 幽靈按鈕、行動呼籲按鈕、按鈕群組與收合 | 本次按鈕數少，不適用 |
| spec/data-entry.md | 上傳、滑桿、穿梭框、開關、單選鈕、核取方塊 | 本次欄位用不到；簽收照片上傳屬抵達站點，不在範圍 |
| spec/feedback.md | 通知、徽章、說明氣泡、載入進度 | 本次不適用 |
| spec/detail-page.md | 單據審批範本、發布流程範本、外部參考連結 | 不是本次頁型 |
