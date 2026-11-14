# 試做 B（第二回）：諮詢單畫面的需求描述（照版型選擇規則）

| 項目 | 內容 |
|------|------|
| 受測方法 | 票 42「版型層：採用的來源與用在哪一步」一節；Ant Design 官方設計規範頁七頁（本機副本） |
| 商業內容來源 | wiki 卡 [[諮詢單]]、[[諮詢單狀態]]、[[諮詢受理與出口分流]]、[[諮詢費結算收尾]]、[[諮詢人員認領活動清單]]、[[執行諮詢活動清單]]、[[出口分流活動清單]]、[[改派負責人活動清單]]（ACT-RAS-002）、[[售前單據檢視活動清單]]（ACT-VPRE-007 至 010）、[[諮詢]]、[[ERP 詞彙表]] 諮詢單狀態詞條、[[CR-007-諮詢單編號正本缺口與表單欄位修正規則]] |
| 下游規範 | erp 工作樹 `.claude/skills/prototype-from-prompt/SKILL.md`、`Designs.md`、`docs/recipes/` 兩份配方、`docs/component-catalog.md`、`docs/pm-prototype-workflow.md`、`(prototype)/README.md`；元件實作只讀不改：`GenericFilter.js`、`RadioButtonGroup.js`、`PanelDrawer.js`、`PanelDialog.js`、`ConfirmModal.js`、`ActivityTimeline.js`；腳手架只讀不改：`(prototype)/layout.js`、`_lib/sessionStore.js`、`_lib/people-roster.js` |
| 日期 | 2026-11-14 |

路徑縮寫：下文「spec/」指 `/tmp/workflow-rebuild-ticket42-src-20261113/src/ant/spec/`。

---

## 一、需求描述正文

以下整段可貼給 `prototype-from-prompt`。

### 需求來源與用詞

- 商業規則正本是 Sens wiki 卡：諮詢單、諮詢單狀態、諮詢受理與出口分流、諮詢費結算收尾，以及上列活動清單。
- 狀態只有四種：待諮詢、完成諮詢、已轉需求單、已取消。後三種是終態。
- 操作名照實體卡操作段：認領諮詢單、代派諮詢人員、改派諮詢人員、編輯諮詢單、撰寫諮詢人員筆記、轉需求單、完成諮詢、取消諮詢、檢視諮詢單。
- 諮詢單沒有使用者發起的建立操作。畫面上不放「新增」鈕。

### 範圍

- 本次做九個操作的畫面：清單、明細（檢視諮詢單），以及其餘八個操作。
- 使用者是辦公角色，只做桌機寬度。
- 做法是用完即丟的驗證草稿：資料放模組內記憶體，重新整理就回到初始資料。
- 不做：系統連帶建立的單據本身（需求單、諮詢訂單、半額退費的訂單異動），只在諮詢單上寫入關聯單號；被指派者的通知；側欄選單入口。

### 角色與權限差異（用腳手架右上角的模擬角色切換）

| 操作 | 諮詢 | 業務主管 | Supervisor | 其他角色 |
|------|------|---------|-----------|---------|
| 清單、檢視諮詢單 | 全公司 | 全公司 | 全公司 | 看不到，顯示無權限 |
| 認領諮詢單 | 待諮詢且還沒有諮詢人員 | 不可 | 不可 | 不可 |
| 代派諮詢人員 | 不可 | 待諮詢且還沒有諮詢人員 | 不可 | 不可 |
| 改派諮詢人員 | 不可 | 待諮詢且已有諮詢人員 | 待諮詢且已有諮詢人員 | 不可 |
| 編輯諮詢單 | 全公司，不限本人 | 不可 | 不可 | 不可 |
| 撰寫諮詢人員筆記 | 自己負責的待諮詢單 | 全公司的待諮詢單 | 不可 | 不可 |
| 轉需求單、完成諮詢 | 自己負責的待諮詢單 | 不可 | 不可 | 不可 |
| 取消諮詢 | 自己負責的待諮詢單 | 全公司的待諮詢單 | 不可 | 不可 |

- 不能做的操作，按鈕直接不出現，不做停用加提示。
- 需求原文寫「業務主管編輯諮詢單」，與 wiki 不符。本描述照 wiki（見第四節第 1 項）。

### 頁型

| 頁 | 頁型 | 網址 |
|----|------|------|
| 諮詢單清單 | 資源列表頁：上方篩選區，下方表格；不設新增鈕 | `/consultations` |
| 諮詢單明細 | 詳情頁：獨立頁面；分段平鋪，不分頁籤 | `/consultations/detail?id=<諮詢單編號>` |
| 編輯諮詢單 | 明細頁右側抽屜，抽屜內分組表單 | 明細頁內開啟 |
| 撰寫諮詢人員筆記 | 明細頁的置中對話框，內含一個多行文字框 | 明細頁內開啟 |
| 代派、改派諮詢人員 | 明細頁的置中對話框，內含人員下拉 | 明細頁內開啟 |
| 取消諮詢 | 明細頁的置中對話框，內含必選的取消理由分類 | 明細頁內開啟 |
| 轉需求單、完成諮詢 | 明細頁的置中確認對話框 | 明細頁內開啟 |
| 認領諮詢單 | 明細頁按鈕，按下即生效，頂部顯示成功訊息 | 明細頁內 |

### 頁 1：諮詢單清單

- 篩選區：一個搜尋框，提示文字「搜尋諮詢單編號 / 聯絡人 / 公司抬頭」。
- 篩選條件：狀態（四個按鈕，可再按一次取消）、諮詢人員（下拉，含「未認領」）。另有「清空」鈕。
- 表格欄位依序：諮詢單編號、狀態、客戶類型、公司抬頭、聯絡人、預約日期時間、來訪人數、預計製作數量級距、諮詢人員。
- 點諮詢單編號進入明細頁。
- 預設依諮詢單編號由新到舊排序。
- 表格不放列操作鈕，不設批次勾選。
- 沒有資料或篩選沒有結果時，表格顯示空狀態「沒有符合條件的諮詢單」。
- 每頁 10 筆；資料不滿一頁時不顯示分頁器。

### 頁 2：諮詢單明細

由上而下四段，每段一個外框加段標題：

| 段 | 內容 | 段標題右側的按鈕 |
|----|------|----------------|
| 1 受理與結果 | 諮詢單編號、狀態、諮詢人員、諮詢費、取消理由分類、關聯需求單、關聯諮詢訂單 | 依角色與狀態顯示：認領諮詢單、代派諮詢人員、改派諮詢人員、轉需求單、完成諮詢、取消諮詢 |
| 2 客戶填寫資料 | 客戶類型、公司統編、公司抬頭、聯絡人、市話、分機、手機、Email、預約日期、預約時間、來訪人數、預計製作數量級距、諮詢費發票意向、客戶原話 | 編輯諮詢單 |
| 3 諮詢人員筆記 | 筆記全文；沒有內容時寫「尚未撰寫」 | 撰寫諮詢人員筆記 |
| 4 活動紀錄 | 由新到舊的操作紀錄：操作者、事件、時間 | 無 |

- 段 1 的按鈕一組至多一顆主按鈕。諮詢自己負責的待諮詢單：「完成諮詢」為主按鈕，「轉需求單」為一般按鈕，「取消諮詢」為危險按鈕放最右。諮詢看到未認領的單：「認領諮詢單」為主按鈕。
- 取消理由分類只在已取消時有值；關聯需求單、關聯諮詢訂單沒有值時顯示「—」。
- 客戶原話與諮詢費發票意向是唯讀欄位，不出現在編輯抽屜。
- 終態的單：頁頂顯示一行提示「本諮詢單已收尾於「<狀態>」，諮詢人員筆記已鎖定」。
- 找不到該編號時顯示「找不到諮詢單」與「返回清單」鈕。

### 操作細節

| 操作 | 開啟後看到什麼 | 必填與檢查 | 確認後 |
|------|-------------|-----------|-------|
| 編輯諮詢單 | 右側抽屜「編輯諮詢單」，分三組：客戶資料、聯絡資料、預約資訊 | 客戶類型為公司戶時，公司統編與公司抬頭必填；Email 檢查格式；錯誤訊息顯示在欄位下方 | 寫回欄位；活動紀錄記「編輯諮詢單」與改了哪些欄位；頂部成功訊息 |
| 撰寫諮詢人員筆記 | 對話框「撰寫諮詢人員筆記」，多行文字框帶字數（上限 2000 字） | 無 | 寫回筆記；活動紀錄記一筆 |
| 代派諮詢人員、改派諮詢人員 | 對話框，諮詢人員下拉 | 必選；改派時不可選原本的人 | 寫回諮詢人員；狀態不變；活動紀錄記操作者與被指派者 |
| 認領諮詢單 | 不開框 | 無 | 諮詢人員寫入目前使用者；狀態不變；成功訊息「已認領諮詢單」 |
| 轉需求單 | 確認框「轉需求單」，說明系統會建需求單並帶入客戶資料，之後狀態定格 | 無 | 狀態轉「已轉需求單」；寫入關聯需求單號 |
| 完成諮詢 | 確認框「完成諮詢」，提醒先與客戶確認諮詢已結束、客戶不做大貨 | 無 | 狀態轉「完成諮詢」；寫入關聯諮詢訂單號 |
| 取消諮詢 | 對話框「取消諮詢」，取消理由分類下拉；選「其他」時提示補充說明寫在諮詢人員筆記 | 未選理由時「取消諮詢」鈕不能按 | 狀態轉「已取消」；寫入取消理由分類與關聯諮詢訂單號 |

- 對話框的離開鈕寫「返回」，避免與「取消諮詢」混淆。
- 轉需求單、完成諮詢、取消諮詢的確認鈕文字與操作名相同。

### mock 資料

- 十張諮詢單，四個狀態都有；待諮詢含未認領與已認領兩種。
- 諮詢單編號用 `CR-2026-0611` 至 `CR-2026-0620`；需求單號 `QR-2026-0xxx`；諮詢訂單號 `ORD-2026-0xxx`。
- 諮詢人員用腳手架名冊上的諮詢：張惠雯、蘇怡君。
- 諮詢費一律 2,000 元。

---

## 二、每個版型決定的依據

| # | 決定 | 規則出處（檔名與原文句） | 與 erp 規範的關係 |
|---|------|----------------------|----------------|
| 1 | 清單用表格，不用清單或卡片 | `research-list.md` Query Table：「When each entry needs to expose many fields」；`data-list.md` Table：「more data exposure without having to go into the details」 | 一致：erp `resource-page.recipe.md` |
| 2 | 篩選放清單上方單欄 | `research-list.md` Single Column Layout：「with the data filtering module at the top」 | 一致：GenericFilter |
| 3 | 一個搜尋框查多個欄位 | `data-list.md` Search：「query in multiple data attributes at one time」 | 一致：recipe「多條件搜尋用單一 search 框」 |
| 4 | 狀態篩選用按鈕式單選 | `data-entry.md` Radio：「must be more than two options, and normally less than five」（四種狀態） | 一致：RadioButtonGroup「選項少（2–5 個）」 |
| 5 | 諮詢人員篩選用下拉 | `data-entry.md` Dropdown：「Used when there are more than five options」 | 現有選項只有三個，見第三節第 2 項 |
| 6 | 明細開成獨立頁 | `data-list.md` Navigate to details：「if the information display exceeds one screen ... Drawer」；「complex immersive tasks, jump to independent page」 | 一致：erp `detail-page.recipe.md` 落 `<resource>/detail/` |
| 7 | 明細分段平鋪，不分頁籤 | `detail-page.md` Basic：「To display information with less content and low complexity」；Direct 原則：「Do not hide or fold up the content if not necessary」 | 一致：recipe「多段就重複 BorderBlock + SectionHeader」 |
| 8 | 每段一個外框 | `detail-page.md` Separation Methods：「Cards: to display information on one topic」 | 一致：BorderBlock |
| 9 | 操作鈕放段標題右側（含頁層級的出口操作） | `buttons.md` 頁尾條件：「could not show the entire content in one screen」時放頁尾 | 衝突，照 erp。見第三節第 1 項 |
| 10 | 一組至多一顆主按鈕 | `buttons.md` Primary：「at most one primary button per a button group」 | 一致：Button variant |
| 11 | 取消諮詢用危險按鈕，排在最右 | `buttons.md` Danger：「Warns users that there are risks」；Ordering：「then present the risks involved」 | 一致：Button danger |
| 12 | 按鈕文字用動詞並寫出結果 | `buttons.md` Label：「Describe the action result」；「If primary action means negative, stress the consequences」 | 一致 |
| 13 | 編輯諮詢單用抽屜 | `research-form.md` Editable List：「Drawer Editing: Recommended when the number of form items is >8」（可編輯欄位 12 個） | 一致：PanelDrawer「詳情頁的編輯表單抽屜」 |
| 14 | 抽屜內分三組加組標題 | `research-form.md` In-Area Grouping：「in-area grouping can be achieved by distinguishing titles」；Settings：「Number 7~15, grouping is recommended」 | 一致：SectionHeader（不帶編號） |
| 15 | 市話與分機排同一列 | `research-form.md` Weak Grouping：「form items with shorter widths and relevant content can be grouped into one line」 | 一致 |
| 16 | 預約時間用下拉 | `data-entry.md` Dropdown：「more than five options」（10:30 至 18:30 每半小時，17 個） | 一致：AntD Select |
| 17 | 來訪人數、客戶類型、數量級距用按鈕式單選 | `data-entry.md` Radio（見 #4） | 客戶類型兩個選項、數量級距五個選項，見第三節第 3 項 |
| 18 | 筆記用多行文字框 | `data-entry.md` Textarea：「multi-line text input for single long text」 | 一致：Input.TextArea |
| 19 | 欄位錯誤訊息顯示在欄位下方 | `feedback.md` Input feedback：「The feedback text is followed by the block to be explained」 | 一致：AntD Form 規則 |
| 20 | 完成諮詢、轉需求單用置中確認框 | `feedback.md` Dialog：「only needed when passing on very important and actionable information」；`data-list.md`：「Second Confirmation」 | 一致：ConfirmModal getConfirmModalConfig |
| 21 | 取消、代派、改派、筆記用置中對話框 | `feedback.md` Dialog（同上）；需要填值，確認框放不下 | 一致：PanelDialog「只針對頁面部分 section 編輯／新增時」 |
| 22 | 認領不開框，直接生效再顯示訊息 | `feedback.md`：「you can omit the feedback prompt at the results users can see immediately and simple operation」；Message：「lightweight reminder」 | 一致：App message |
| 23 | 操作成功用頂部訊息 | `feedback.md` Message：「centered on the top and disappears automatically」 | 一致：App message |
| 24 | 終態頁頂提示 | `feedback.md` Alert：「non-blocking information display ... (top preferentially)」 | 一致：StyledAlert |
| 25 | 清單空狀態 | `data-list.md` Empty state：「an empty state should be displayed」 | 一致：Table locale |
| 26 | 不滿一頁不顯示分頁器 | `data-list.md` Pagination：「when the content of the page is less than one page, the pager will not be displayed」 | 一致：AntD pagination hideOnSinglePage |
| 27 | 不放新增鈕 | `data-list.md` New：右上新增鈕是給「Click to trigger a new form」的情境；諮詢單沒有建立操作 | 一致 |

---

## 三、規則沒有門檻、沒涵蓋或與 erp 衝突，由我自己判斷的地方

| # | 項目 | 規則的狀況 | 我的判斷 |
|---|------|----------|---------|
| 1 | 頁層級操作鈕放哪 | `buttons.md` 說內容超過一屏要放頁尾。erp 詳情配方寫「右上放操作按鈕」，段標題 extra 放按鈕 | 衝突，照 erp：放段 1 標題右側 |
| 2 | 諮詢人員篩選用下拉還是按鈕 | 目前只有三個選項（未認領、兩位諮詢），照 Ant 門檻應用單選按鈕 | 人員名單會增加，用下拉 |
| 3 | 客戶類型只有兩個選項 | `data-entry.md` 單選要多於兩個；兩個選項沒有對應元件 | 照 erp RadioButtonGroup 的 2–5 個範圍，用按鈕式單選 |
| 4 | 數量級距剛好五個選項 | Ant 單選「normally less than five」、下拉「more than five」，五個兩邊都不落 | 照 erp 2–5 範圍，用按鈕式單選 |
| 5 | 編輯抽屜的確認鈕位置 | `buttons.md` 長表單建議頁尾；erp PanelDrawer 固定放抽屜右上角 | 衝突，照 erp 元件 |
| 6 | 「完成諮詢」與「轉需求單」誰當主按鈕 | Ant 只說一組一顆，沒說兩個同等出口怎麼選 | 情境卡主流程走完成諮詢，選它當主按鈕 |
| 7 | 列表要不要放「認領」列操作 | `buttons.md` 文字按鈕可放表格內，但沒說何時該放 | 不放，所有操作集中在明細頁 |
| 8 | 列表頂部要不要放狀態統計卡 | `research-list.md` Standard List 提到統計，Query Table 沒有 | 不放；狀態篩選已能分群 |
| 9 | 預設排序 | 規則沒寫 | 依諮詢單編號由新到舊 |
| 10 | 明細段落的排序 | `detail-page.md` 只說相關內容靠近 | 受理與結果放第一段，因為操作鈕在這段 |
| 11 | 確認框與對話框的離開鈕文字 | `buttons.md` 預設 OK / Cancel | 改寫「返回」，避免與「取消諮詢」同字 |
| 12 | 狀態標籤顏色 | 規則沒寫；票 42 寫業務狀態對顏色的對照表未定 | 待諮詢藍、完成諮詢綠、已轉需求單紫、已取消灰，程式碼加待確認註解 |
| 13 | 認領要不要確認 | `feedback.md` 只說簡單、結果立即可見的操作可省回饋 | 認領可由主管改派補救，不開確認框 |

---

## 四、與 wiki 不符，或 wiki 沒寫而我自己假設的地方

| # | 項目 | wiki 的狀況 | 本描述的假設 |
|---|------|-----------|------------|
| 1 | 業務主管能不能編輯諮詢單 | 需求原文說可以；[[諮詢人員認領活動清單]] 的編輯諮詢單只列諮詢，未列即不可做 | 照 wiki：業務主管不出現「編輯諮詢單」 |
| 2 | 終態後能不能編輯諮詢單 | 實體卡只寫筆記終態後鎖定、諮詢人員限待諮詢；外部表單欄位沒寫狀態限制 | 照字面：四個狀態都能編輯（終態明細仍有「編輯諮詢單」鈕） |
| 3 | 已有諮詢人員時能不能再認領 | 認領活動沒寫；情境卡把未認領的單稱「待認領清單」 | 只有還沒有諮詢人員的單能認領 |
| 4 | 代派的時機 | 情境卡寫「諮詢人員未及時自我認領」時代派 | 只有還沒有諮詢人員的單能代派；有人時改走改派 |
| 5 | 公司戶的統編與抬頭必填 | 實體卡寫「公司戶必填」，沒寫一般客戶是否隱藏 | 一般客戶仍顯示兩欄、不必填 |
| 6 | 其他欄位是否必填、格式檢查 | 實體卡沒寫 | 只檢查 Email 格式，其餘不設必填 |
| 7 | 列表顯示哪些欄位 | 實體卡沒有清單欄位的規定 | 照第一節頁 1 的欄位 |
| 8 | 諮詢單編號格式 | 實體卡範例 `CR-2026-0604`；CR-007 待解答，問題描述寫「CR 接年月再接四碼流水號」 | 照實體卡範例格式 |
| 9 | 轉需求單、完成諮詢、取消諮詢之後的連帶單據 | 狀態機卡寫系統建需求單、諮詢訂單、訂單異動 | 只寫入關聯單號，不做連帶單據的畫面與連結 |
| 10 | 活動紀錄寫什麼 | 實體卡寫修改與筆記儲存要留活動紀錄，沒有寫逐筆文字 | 每個操作留一筆，寫操作名與改動摘要 |
| 11 | Supervisor 範圍 | 需求只點名諮詢與業務主管；wiki 給 Supervisor 檢視與改派 | 一併做 Supervisor 的檢視與改派 |
| 12 | 狀態篩選要不要有「全部」 | wiki 沒寫 | 不設；不選就是全部 |
