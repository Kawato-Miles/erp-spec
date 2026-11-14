# 乙方案畫面檢查清單，第二回修訂版

用途：Prototype 畫面做完後，稽核代理逐條判定「符合／不符合／不適用」，不符合時附檔案行號或截圖位置。
範圍：整體 UX，即佈局、心智模型、操作用字、狀態呈現，加上字級、字重、顏色、提示文字。鍵盤操作與焦點順序不列入（Miles 原話：「不用考慮鍵盤操作」，見 `feedback_ui_audit_whole_ux.md` 第 13 行）。
機械檢查腳本：同資料夾 `check-B2.sh`。表中「機械 Cxx」指該腳本的檢查項。

## 相對第一回改了什麼

| 項目 | 內容 |
|------|------|
| 第一回已有 | T01–T06、T08–T12、T14–T18（票 42 禁止清單草稿 16 條）；L05、S01（票 42「檢查畫面」一列） |
| 新增的類別 | 佈局與版型、心智模型、操作用字、狀態呈現，各自成節 |
| 新增的條目 | 佈局 15 條、心智模型 7 條、操作用字 6 條、狀態呈現 5 條、細節層 3 條（T07、T13、T19） |
| 細節層的修訂 | 草稿字級第 3 條、字重第 2 條的數字移到門檻值表；顏色第 2 條依 erp 補上連結（見 T09）；提示文字第 4 條依記憶卡補上停用按鈕的例外（見 T17） |
| 改由 erp 規範決定的地方 | L04（新增按鈕位置）、T09（藍色用途）、T14（搜尋框灰字，第一回已補） |

## 出處代號

| 代號 | 檔案 |
|------|------|
| D | `/Users/b-f-03-029/erp/Designs.md` |
| SK | `/Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md` |
| RR | `/Users/b-f-03-029/erp/docs/recipes/resource-page.recipe.md` |
| DR | `/Users/b-f-03-029/erp/docs/recipes/detail-page.recipe.md` |
| LJ | `/Users/b-f-03-029/erp/apps/erp/src/app/layout.js` |
| AB、ADP、ADL、ARF、AF | Ant Design 官方設計規範頁：`/tmp/workflow-rebuild-ticket42-src-20261113/src/ant/spec/` 下的 `buttons.md`、`detail-page.md`、`data-list.md`、`research-form.md`、`feedback.md` |
| OS、OP、OC | `office-web-ui-system`：`/tmp/workflow-rebuild-ticket42-src-20261113/src/thienanblog_awesome-ai-agent-skills/skills/office-web-ui-system/` 下的 `SKILL.md`、`references/page-type-playbook.md`、`references/component-recipes.md` |
| R42 | Sens 工作樹 `.scratch/workflow-rebuild/research/42-dashboard-ux-skills.md`（Impeccable 與 interface-design 的原文句摘錄，主對話已逐字比對） |
| Q42 | Sens 工作樹 `.scratch/workflow-rebuild/issues/42-dashboard-ux-skills.md` |
| AU | Sens 工作樹 `.scratch/workflow-rebuild/research/42-trial/audit-B.md` |
| WG | Sens 工作樹 `memory/Sens_wiki/wiki/erp/ERP 詞彙表.md` |
| WE | Sens 工作樹 `memory/Sens_wiki/wiki/erp/05-entities/規範 - 實體.md` |
| WS | Sens 工作樹 `memory/Sens_wiki/wiki/erp/06-state-machines/規範 - 狀態機.md` |
| WT | Sens 工作樹 `memory/Sens_wiki/wiki/erp/05-entities/生產執行/轉交單.md` |
| MO、MS、MH、MU | `/Users/b-f-03-029/.claude/projects/-Users-b-f-03-029-Sens/memory/` 下的 `feedback_operation_terms_exact.md`、`feedback_prefer_state_definitions_for_conditions.md`、`feedback_hide_unavailable_actions.md`、`feedback_ui_audit_whole_ux.md` |
| GC | `/Users/b-f-03-029/.claude/CLAUDE.md` |

## 門檻值表

門檻值只寫在這裡。各條目寫「見門檻值表」。

| 門檻 | 值 | 出處 |
|------|----|------|
| 一個畫面的字級數上限 | 3 至 4 級（單一數字待定，見 G01） | Q42:255「一個畫面至多用 3 至 4 級。」；R42:540「3-4 sizes maximum」 |
| 一個畫面的字重數上限 | 2 至 3 種（單一數字待定，見 G01） | Q42:261「一個畫面至多用 2 至 3 種字重。」；R42:592「2-3 weights」 |
| 同頁展開的高度 | 不超過一個畫面高 | ADL:123「the height of the expanded content area should not exceed one screen」 |
| 表單內逐列編輯的子項目 | 欄位數 ≤3 用動態增減；2–5 用可編輯表格；6–8 用摺疊面板；>8 用抽屜 | ARF:126「Recommended when the number of form items ≤3」；ARF:134「Recommended when the number of form items is between 2 and 5」；ARF:142「Recommended when the number of form items is between 6 and 8.」；ARF:150「Recommended when the number of form items is >8.」 |
| 機械篩選值（非規則） | 提示 20 字、長文字 30 字；超過只代表要人工判讀 T15、T16 | 第一回 `check-B.sh` 第 28 行「任務書指定」、第 29 行；不是設計規則 |
| 允許的字級與字重 | 字級與字重以 erp 字體階層為準，本表不重抄 | D:120 起的 Type scale 表；D:118 |

## 一、佈局與版型

| 編號 | 檢查項 | 怎麼查 | 出處 |
|------|--------|--------|------|
| L01 | 新頁的整頁結構套 erp 整頁配方：列表頁套資源列表頁配方，詳情頁套詳情頁配方 | 讀程式 | SK:47「列表頁 → `resource-page.recipe.md`;詳情頁 → `detail-page.recipe.md`」；D:189「套 `docs/recipes/` 的整頁配方，而不是從單顆元件拼」 |
| L02 | 修改既有頁時沿用該頁原本的配方與元件，沒有重挑配方或重建骨架 | 讀程式（比對改動前後的頁面骨架） | SK:80「先讀既有頁面,辨識它套用的 recipe 與元件,修改沿用同一套」 |
| L03 | 頁面沒有自己加側欄、頁首或外層內距 | 讀程式 | SK:58「不要自己加 Sider / Header,也不要自己包外層 padding」 |
| L04 | 列表頁由上而下是篩選列、表格；「新增」按鈕放在篩選列內 | 看渲染畫面＋讀程式 | D:217「篩選列 + 「新增」按鈕」；RR:13 同句。office-web-ui-system 寫「放篩選列上方或標題旁」（OP:99），與 erp 不同，以 erp 為準 |
| L05 | 列操作只出現在表格列內；篩選列不放列操作 | 看渲染畫面 | OP:100「row actions stay inside the table or mobile cards」；OP:117「filters visually mixed with row actions」（反模式）；OC:174「filters should read as a working surface separate from row actions」 |
| L06 | 表格的列操作用低強調的按鈕（文字按鈕或圖示按鈕），不用主按鈕 | 讀程式 | AB:31「Low emphasis and light-weight button type, such as actions in a table.」；D:218「操作欄用 useActionColumn」 |
| L07 | 同一個按鈕群組至多一個主按鈕 | 看渲染畫面＋讀程式（數 `variant="primary"`、`type="primary"`） | AB:27「There is at most one primary button per a button group.」 |
| L08 | 詳情頁各段的操作按鈕放在該段標題的右側；只影響某一段的操作留在該段內 | 看渲染畫面 | DR:8「右上放操作按鈕」；DR:50 段標題 `extra` 放「編輯」鈕；OP:152「local actions stay inside the panel or section they affect」 |
| L09 | 表格外框用 `TableBlock`；詳情頁每一段用 `BorderBlock` 加 `SectionHeader` | 讀程式 | D:230「沿用 `TableBlock` 包表格、`GenericFormDrawer` 包表單，不要重畫外框。」；DR:79「多段就重複 `BorderBlock` + `SectionHeader`（number 遞增）」 |
| L10 | 新增與編輯表單用 `GenericFormDrawer`，沒有直接用 AntD 的 `Drawer` | 讀程式 | RR:92「抽屜用 GenericFormDrawer（自帶標題與取消／確認鈕），不要裸用 AntD Drawer」；D:165「新增 / 編輯抽屜（右側 Drawer + react-hook-form + Zod）」 |
| L11 | 從列表開詳情的方式合乎資訊量：同頁展開的高度在門檻內；超過就用抽屜；要單獨分享或屬複雜任務才開獨立頁（見門檻值表） | 看渲染畫面 | ADL:123「the height of the expanded content area should not exceed one screen」；ADL:124「if the information display exceeds one screen, it is not convenient for the user to use the unfolding method」；ADL:125「Details need to be shared with others separately, or complex immersive tasks」 |
| L12 | 詳情頁資訊分段平鋪，沒有不必要的摺疊；用分頁時，每個分頁依同一種特徵分組（版本、意圖、階段等） | 看渲染畫面 | ADP:21「Try to display the information as flat as possible. Do not hide or fold up the content if not necessary.」；ADP:133「Tabs: to put the information into groups according to some feature, such as version, intention, phase, etc.」 |
| L13 | 表單內逐列編輯的子項目，依欄位數選擇編輯方式（見門檻值表） | 讀程式（數欄位）＋看渲染畫面 | ARF:134、ARF:142、ARF:150（原文見門檻值表） |
| L14 | 表單的儲存、送出、取消鈕和表單在同一個抽屜、對話框或表單區塊內，沒有放在無關的側欄 | 看渲染畫面 | OP:202「save, continue, submit, and cancel remain close to the form context」；OP:203「do not bury primary form actions inside unrelated side content」 |
| L15 | 破壞性操作（作廢、刪除）的按鈕與安全操作不用同一種強調樣式 | 看渲染畫面＋讀程式 | OC:144「avoid placing destructive actions in the same visual emphasis as safe actions」 |
| L16 | 間距取 `theme.spacing`，沒有手寫 px | 機械 C10＋讀程式 | D:174「一律從 `@shared/styles/theme` 取值」；D:240「手寫 hex、px、font-size」（Don't 欄） |

## 二、心智模型

| 編號 | 檢查項 | 怎麼查 | 出處 |
|------|--------|--------|------|
| M01 | 表格欄名、欄位標籤用實體卡欄位表的欄位名 | 讀程式＋對照實體卡 | WE:18「實體卡是業務可見欄位與單據操作的正本」 |
| M02 | 欄內顯示的值就是欄名所指的欄位（例：「編號」欄放的是單據編號，不是列序號） | 讀程式＋看渲染畫面 | WE:18（同上）；第一回 U79「「編號」欄內容是列序號」 |
| M03 | 畫面上的狀態名與狀態機卡「狀態列舉」一字不差（例：「受理中（逾期）」不在列舉內就不符合） | 讀程式（含 `*_META` 表）＋對照狀態機卡 | WS:94「本卡「狀態列舉（正本）」段是該實體狀態的唯一正本，其他卡引用狀態名、不另列清單」 |
| M04 | 操作按鈕顯示與否、可否點擊的條件用狀態名判斷 | 讀程式 | MS:11「實體有狀態機就優先用狀態名判斷」 |
| M05 | 因階段未到而不能用的操作直接不渲染；只有本階段可用、但這一筆資料的條件不符時，才用停用加原因 | 讀程式＋看渲染畫面 | MH:11「當前狀態無法使用的功能，就隱藏此功能，不是滑過後才出現提示說不能點。」；MH:15「功能在這個階段本來可用，只因這筆資料的個別條件不符而擋下，要讓人知道被擋的原因」 |
| M06 | 同一種單據在各頁用同一種方式開啟詳情（抽屜、獨立頁或同頁展開） | 讀程式（找同一實體的既有頁面比對） | ADP:35「try to use similar layouts and modules to reduce the interference of structural differences to users」；D:9「而不是另立一套」；MU:13 Miles 原話「對系統的心智模型是否相同」 |
| M07 | 同一種操作在各頁用同一個圖示 | 讀程式（比對同類操作的圖示名） | ADP:35（同上）；MU:13（同上）；第一回 U20「作廢類圖示 block 與 cancel 不一致」 |

## 三、操作用字

| 編號 | 檢查項 | 怎麼查 | 出處 |
|------|--------|--------|------|
| O01 | 同一個操作在按鈕、圖示按鈕提示、對話框標題、確認鈕、成功訊息用同一個名稱 | 機械 C12、C13＋讀程式 | MU:11「同一個操作不能列上叫「編輯」、對話框叫「修改」」；MU:13 Miles 原話「編輯、修改這種用字就是很重要指引」；MO:11「同一件事只有一個名字」 |
| O02 | 同一份改動裡，「編輯、修改、修正、訂正、變更」的不同叫法只出現在 wiki 本來就分立的操作上（例：「編輯轉交單」與「修正點收」是兩個操作） | 機械 C12（附操作名稱清單）＋對照實體卡操作段 | MO:11「不寫「修正裝箱回報」「修改箱子」「訂正」等變體」；WT:131「編輯轉交單」、WT:135「修正點收」 |
| O03 | 畫面文字不用 ERP 詞彙表列為 `_Avoid_` 的說法 | 機械 C14＋讀程式 | WG:12「同一概念有哪些說法不能用」 |
| O04 | 按鈕文字含動詞（下拉按鈕除外），與情境相關且精簡 | 讀程式 | AB:194「Should use verb (except dropdown buttons)」；AB:195「Should be relevant to the context and be concise.」 |
| O05 | 破壞性操作的確認視窗寫出操作對象與後果 | 讀程式＋看渲染畫面 | R42:548「For destructive actions, name the object and consequence.」；AB:203「If primary action means negative, stress the consequences.」 |
| O06 | 畫面文案用正體中文，不夾英文詞（單號等業務代號除外） | 讀程式 | D:180「文案用正體中文」（原句只講狀態標籤）；GC:6「禁止中英文夾雜」（原句管產出文件）。兩處都不是直接管畫面文案，見「缺規則」G15 |

## 四、狀態呈現

| 編號 | 檢查項 | 怎麼查 | 出處 |
|------|--------|--------|------|
| S01 | 每個表格與非同步區塊都有空白、載入、錯誤三種狀態 | 讀程式（`locale.emptyText`、`loading`、錯誤分支） | OC:331「every table, dashboard module, and async support panel」；OS:28「Support relevant loading, empty, error, validation, selection, disabled, and focus states.」。Prototype 是否適用見 G09 |
| S02 | 空白狀態說明為什麼沒有資料（例：尚無紀錄、篩選條件下沒有符合的資料），不只寫「沒有資料」 | 讀程式＋看渲染畫面 | OC:335「avoid raw placeholder text such as "No data" with no context」 |
| S03 | 錯誤狀態附重試或其他復原操作 | 讀程式 | OC:316「optional recovery action」；OC:327「retry or recovery actions need the same quality as primary buttons」 |
| S04 | 頁面內的警示與提示用 `StyledAlert` 或 AntD `Alert`，不用紅字內文段落 | 讀程式 | D:168「狀態標籤 / 提示」（`StyledAlert` 一列）；D:154「先用 Ant Design 原生元件」；AF:28「It is a non-blocking information display.」 |
| S05 | 操作完成的回饋用全域訊息（`message`）；只有重要的失敗才用對話框 | 讀程式 | D:181「全域訊息透過 `App` + `MessageInitializer`」；AF:124「a lightweight reminder that does not interrupt the user's operation」；AF:143「Dialog is a strong feedback mechanism that is only needed when passing on very important and actionable information.」 |
| S06 | 刪除的二次確認用 `DeleteConfirmModal` | 讀程式 | D:169「刪除二次確認」 |

## 五、字級、字重、顏色、提示文字

票 42 禁止清單草稿（Q42 第 251 至 277 行）整份納入，編號對照寫在出處欄。

| 編號 | 檢查項 | 怎麼查 | 出處 |
|------|--------|--------|------|
| T01 | 不手寫字級與字重，只用 erp 字體階層的五級 | 機械 C01、C02 | Q42:253「不手寫字級與字重，只用 erp 字體階層的五級。」（草稿字級 1）；D:130「需要排版時直接套 mixin，不要自訂 font-size。」 |
| T02 | 同一種畫面角色在所有頁面用同一級字 | 讀程式（跨頁比對） | Q42:254「同一種角色在所有頁面用同一級。」（草稿字級 2）；R42:539「Keep repeated roles consistent across screens and states.」 |
| T03 | 一個畫面用到的字級數不超過門檻值表的上限 | 讀程式（含共用元件）＋看渲染畫面 | Q42:255（草稿字級 3，數字移到門檻值表）；R42:540 |
| T04 | 要分層級時先用字重與文字顏色，不另加一級字 | 讀程式 | Q42:256「要分層級時，先用字重與文字顏色，不另加一級字。」（草稿字級 4）；R42:541「instead of asking size alone to do all the work」 |
| T05 | 不手寫字重，只用 erp 字體階層附帶的字重 | 機械 C02 | Q42:260「不手寫字重，只用 erp 字體階層附帶的 400、500、700。」（草稿字重 1）；D:118「Noto Sans TC（400/500/700）」 |
| T06 | 一個畫面用到的字重數不超過門檻值表的上限 | 讀程式＋看渲染畫面 | Q42:261（草稿字重 2，數字移到門檻值表）；R42:592 |
| T07 | 畫面實際渲染出的字重都在 erp 載入範圍內，包含 `strong`、`Typography.Title` 等元件的預設字重 | 看渲染畫面（量文字的計算後字重） | D:118「Noto Sans TC（400/500/700）」；LJ:44 字型網址「Noto+Sans+TC:wght@400;500;700」；AU:129「依 Ant Design 預設渲染字重 600，erp 沒有載入 600」 |
| T08 | 不手寫色碼，只用 erp 的色彩代號 | 機械 C03 | Q42:265「不手寫色碼，只用 erp 的色彩 token。」（草稿顏色 1）；D:74「改色 / 改字體一律回 Figma 改 token 再跑 transform。」 |
| T09 | 藍色只用在互動元素（按鈕、連結）、目前選取的項目、狀態指示，不拿來裝飾 | 看渲染畫面 | Q42:266「藍色只用在主要操作、目前選取的項目、狀態指示，不拿來裝飾。」（草稿顏色 2）；D:86 藍色用途「主色 / 互動」。草稿沒列連結，依 erp 補上 |
| T10 | 狀態標籤只用語意色，不用調色盤色名；同一個狀態在所有頁面同色 | 機械 C04、C05＋讀程式 | Q42:267「狀態標籤只用語意色，不用調色盤色名。同一個狀態在所有頁面同色。」（草稿顏色 3）；D:245「狀態用 AntD Tag + 正體中文文案」。語意色的名單與對照表待定，見 G02 |
| T11 | 文字顏色四階各有固定用途：內文、輔助說明、中繼資料、停用；已取消或停用的內容用停用色，不用透明度淡化 | 讀程式 | Q42:268「文字顏色四階各有固定用途：內文、輔助說明、中繼資料、停用。」（草稿顏色 4）；D:101「文字四階」；R42:589「Primary, secondary, tertiary, muted (default / supporting / metadata / disabled).」 |
| T12 | 顏色不單獨表達意思，搭配文字或圖示 | 看渲染畫面 | Q42:269「顏色不單獨表達意思，要搭配文字或圖示。」（草稿顏色 5）；R42:595「pair each with a non-color cue」 |
| T13 | 不是狀態的分類標籤（例：款項類型「收款」「退款」）不用狀態色 | 讀程式 | D:107「狀態色只用於狀態（Tag / Alert / 狀態欄）」；AU:128「類型標籤該用什麼色沒有條目」 |
| T14 | 輸入框的灰字只放格式範例，不寫「請輸入」或「請選擇」加欄位名稱；搜尋框例外，照 erp 配方列出可搜尋的條件 | 機械 C07＋讀程式 | Q42:273「輸入框的灰字只放格式範例。不寫「請輸入」加欄位名稱。搜尋框例外：照 erp 配方，灰字列出可搜尋的條件。」（草稿提示文字 1）；RR:111「多條件搜尋用單一 `search` 框 + placeholder 列出條件」；R42:543「placeholders are examples, not labels」。配方範例碼有疑義，見 K02 |
| T15 | 欄位旁的說明至多一句，只回答使用者此刻會問的問題，不重述欄位名稱 | 機械 C06（篩選）＋讀程式 | Q42:274「欄位旁的說明至多一句，只回答使用者此刻會問的問題。不重述欄位名稱。」（草稿提示文字 2）；R42:542「Helper text answers an implicit question instead of restating the control.」 |
| T16 | 業務規則的全文不寫進畫面，包含提示、說明、空白狀態與操作成功訊息 | 機械 C09（篩選）＋讀程式 | Q42:275「業務規則的全文不寫進畫面。規則留在 wiki 與操作手冊。」（草稿提示文字 3）；AU:132「操作成功訊息帶規則說明」（第一回不確定是否涵蓋成功訊息，依草稿「畫面」二字涵蓋） |
| T17 | 圖示按鈕的提示只寫動作名稱；操作的後果只寫在破壞性操作的確認視窗。例外：因這一筆資料的條件不符而停用的按鈕，提示寫停用原因 | 機械 C08＋讀程式 | Q42:276「圖示按鈕的提示只寫動作名稱。操作的後果只寫在破壞性操作的確認視窗。」（草稿提示文字 4）；MH:15「要讓人知道被擋的原因」 |
| T18 | 同一件事在同一個畫面只說一次，包含標籤、說明、空白狀態（例：同一列用兩個標籤標同一件事） | 讀程式＋看渲染畫面 | Q42:277「同一件事在同一個畫面只說一次。」（草稿提示文字 5）；R42:544「Say each idea once.」；R42:547「no repeated explanations, say it once」 |
| T19 | 只有圖示的按鈕都有提示 | 讀程式 | AB:38「Buttons with icon only need to provide Tooltip to indicate the meaning of the button.」 |

## 缺規則、待 Miles 決定

下列事項沒有出處可依，或正本互相衝突，不進正表。稽核時看到相關情形，列為「觀察」，不判不符合。

### 正本衝突

| 編號 | 事項 | 並列的正本 |
|------|------|-----------|
| K01 | 畫面字樣（按鈕、對話框標題）要不要與 wiki 操作名稱一字不差 | 任務書要求「操作名稱照 wiki 實體卡操作段一字不差」，Miles 2026-11-14 說「編輯、修改這種用字就是很重要指引」（MU:13）。記憶卡 MO:15 寫「介面字樣（按鈕、對話框標題）由 Prototype 決定，可與操作名稱不同」「不要求統一」（2026-10-23）。O01、O02 只管同一畫面內一致與同義改寫，兩邊都相容；`check-B2.sh` 的 C13 列出的是候選，判定等 Miles 決定 |
| K02 | 資源列表頁配方的範例碼用了「請輸入名稱」灰字 | RR:102 `<Input placeholder="請輸入名稱" />`；T14 禁止「請輸入」加欄位名稱。RR:102 是骨架範例碼，不是規則句，T14 暫不改 |

### 缺規則

| 編號 | 事項 | 看到什麼、查過哪裡 |
|------|------|------------------|
| G01 | 字級數、字重數的上限要定成單一數字 | 來源給的是範圍（R42:540、R42:592），稽核遇到 4 級字或 3 種字重時判不了 |
| G02 | 業務狀態對顏色的對照表，以及哪些色名算語意色 | Q42:281 草稿未定點；AU:147 第一回自行把 red、green、blue、orange 也算調色盤色名；D:104 只列 Success、Warning、Error 三種狀態色，沒提 processing、default |
| G03 | 現有長提示拿掉後，使用者是否需要其中一部分 | Q42:282 草稿未定點 |
| G04 | 畫面角色對字級的對照表 | Q42:245「erp 沒有，兩個來源也給不出來」；AU:133 |
| G05 | 文字四階對具體內容（時間戳記算內文或中繼資料） | AU:134；D:101 只列四階的值；DR:36 唯讀欄位標籤用 `neutral[500]`，與四階的關係沒寫 |
| G06 | 間距 4 與 20 不在 erp 間距階層，要對到哪一級 | D:140 階層從 8 起；AU:21、AU:45 |
| G07 | 「不手寫 px」是否包含欄寬與對話框寬 | AU:141；D:240 只寫「手寫 hex、px、font-size」 |
| G08 | 表格欄寬、截斷、固定欄壓住表頭 | AU:135；第一回 X01 至 X03 要看畫面才能判 |
| G09 | Prototype 資料在記憶體、沒有非同步讀取時，S01 的載入與錯誤狀態要不要做 | AU:144 |
| G10 | 篩選下拉的空值文字（「全部狀態」「全部」）重述欄名、各欄寫法不一 | AU:142；第一回 U78 |
| G11 | 可點的摘要卡，計數要等於點下去後的列表筆數 | AU:138；第一回 U64。OS:26「define date ranges, units, comparisons, and drilldowns where relevant」只要求定義下鑽，沒說要相等 |
| G12 | 負數金額的顏色 | AU:140；第一回 U32 |
| G13 | 有框容器內再放有框卡片（卡中卡） | 第一回 U47；ADP:35「Reduce the use of complex structures」只有原則，判不了；第一回判定者查 D:155 沒有禁止 |
| G14 | 同一個數字在兩張卡各出現一次，算不算 T18 的重複 | AU:145 |
| G15 | 畫面文案的語言規則（O06 的出處不直接管畫面） | AU:148；D:180 只管狀態標籤文案；GC:6 管產出文件 |
| G16 | 區塊右上同時放篩選與區塊操作 | AU:146；L05 只管篩選與列操作 |
| G17 | 顏色搭配文字時，畫面他處有文字算不算搭配 | AU:137 |
| G18 | 詳情頁內容多到什麼程度要分頁 | Q42:127「沒有門檻」；ADP:98 只寫「large and complex content」 |
| G19 | 圖示按鈕與輸入框的可及名稱要不要列入 | Q42:141 第一回結論要補「可及名稱」；第二回範圍扣掉無障礙（Q42:95），Miles 只明說鍵盤操作不列入 |

### 第一回「規則不夠用 21 項」的去向

| 去向 | AU 第四節序號 |
|------|--------------|
| 進正表 | 1→T13、2→T07、3→T09、4→T17、5→T16、12→O01、16→L04 至 L08 與 L14、21→O06 |
| 鍵盤操作，不列入 | 9 |
| 列入缺規則 | 6→G04、7→G05、8→G08、10→G17、11→G11、13→G12、14→G07、15→G10、17→G09、18→G14、19→G16、20→G02 |

## 稽核時需要的輸入

| 輸入 | 用在哪幾條 | 怎麼取得 |
|------|-----------|---------|
| 本次改動的檔案清單與基底提交 | 全部 | `git diff --name-only <基底提交>`；`check-B2.sh` 第一段輸出 |
| 改動頁面的渲染截圖（桌機寬度，含展開的抽屜、對話框、空白狀態） | 標「看渲染畫面」的條目 | 主對話或稽核代理開頁面截圖 |
| 畫面上每種單據的實體卡：「欄位（業務可見）」段與「操作」段 | M01、M02、O01、O02、O05 | `memory/Sens_wiki/wiki/erp/05-entities/` 下對應的卡，例：轉交單畫面讀 `生產執行/轉交單.md` |
| 畫面上每種單據的狀態機卡：「狀態列舉（正本）」段 | M03、M04、M05、T10 | `memory/Sens_wiki/wiki/erp/06-state-machines/` 下對應的卡，例：`生產執行/轉交單狀態.md` |
| 操作名稱清單檔 | O01、O02（機械 C12、C13） | 照 `check-B2.sh` 開頭註解的指令從實體卡操作段產生 |
| ERP 詞彙表 | O03（機械 C14） | `memory/Sens_wiki/wiki/erp/ERP 詞彙表.md` |
| 同一實體的既有頁面路徑 | M06、M07、T02、L02 | 在 erp 的 `(prototype)/` 搜尋同一實體的頁面與共用元件 |
| erp 規範 | L 節、S 節、T 節 | `Designs.md`、`docs/recipes/` 兩份配方、`docs/component-catalog.md`、`prototype-from-prompt` skill |
