# 32 分項 A：Artifact 類型「Data」當票務檢視

## 試做結果

- Artifact 網址（私有，未分享、未釘選）：https://claude.ai/artifact/7qsEkTAHRJUhsPG4cRVBng
- 標題：工作流程重置 票務檢視（試做）
- 步驟：
  1. 讀類型說明（`Artifact` 的 `action: "read"`，`type_url`），再從新建的 Artifact 讀 `artifact-type/reference/` 下的 `sources.md`、`one-writer.md`、`features.md`、`design-defaults.md`。
  2. 指令稿 `/private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-workflow-rebuild-05-aa3491/aee70168-ae73-4316-8448-1c649efcf357/scratchpad/t32-data/parse.py` 解析 `issues/*.md` 檔頭，輸出 `issues.json`（同資料夾）。
  3. 以 `type_url` 建立 Artifact；用 `Artifact` 的 `asset: true` 把 `issues.json` 上傳成附件（網址 `/_blob/ae809173f5f7c2e50e7003c8434be4c6`）。
  4. 用 `ArtifactData` 的 `batch` 一次寫入三份文件：標題（`dash/meta`）、資料集（`datasets/issues`，種類為檔案）、頁面（`files/index.html`）。「現在可做」與「下一張」的判定寫在頁面內的計算（`dash.calc`）裡，不寫進資料檔。
- 解析結果：34 張票。已結案 18 張、已認領 1 張（32）、未開始 15 張（取自 `issues.json` 的狀態統計；頁面上的卡片數字未能親眼確認，見限制）。
- 現在可做：30、34（open，且擋住它的票都已結案，未被認領）。下一張：30。
  - 例：06 被 30 擋住（30 未結案），所以不可做。
- 工具呼叫：約 14 次（含 1 次因參數錯誤被拒的讀取、1 次 ToolSearch）。

## 結論表

| 問題 | 結論 | 出處 | 原文句 |
|------|------|------|--------|
| 資料來源有哪幾種 | 三種：即時查詢（連接器）、附加檔案、存好的數字 | 類型清單描述 | "from live queries, files or saved numbers" |
| 資料來源有哪幾種（細分） | 資料集種類為「call」（一次連接器工具呼叫）或「file」（上傳檔案） | SKILL.md「The store」 | "`source: {kind: \"call\", connector, tool, args, rules?}`" |
| 能不能直接讀本機 repo 檔案 | 不能。檔案只能是上傳到 Artifact 的附件，只讀 `/_blob/<id>` | SKILL.md「The store」 | "`url` is what `upload_asset` gave (`/_blob/<id>`). No other URL is read." |
| 能不能直接讀本機 repo 檔案（續） | 頁面不能自己連網或讀本機；資料必須先由 Claude 解析並發布上去 | SKILL.md「The store」 | "Use no network, storage or cookies" |
| 狀態改了，檢視怎麼更新 | 附加檔案是複本，不會自動更新；要有人（或例行排程）重新上傳 | sources.md「Files, and older forms」 | "A file is a copy, whatever it was copied from: a newer one shows only when someone, or a routine, uploads it." |
| 更新步驟 | 只更新資料檔即可，頁面不必重發：重跑指令稿、再上傳 `issues.json`、把資料集指向新附件。我只做了第一次上傳；「換附件」的實際步驟未實測 | sources.md；試做 | 未查證（類型說明只講上傳會讓新檔出現，沒寫換附件的具體呼叫；我未試第二次上傳） |
| 能否即時更新 | 不能即時反映 repo。頁面只在有人開啟、重新整理、篩選時重跑查詢 | SKILL.md「Who runs what」 | "Nothing runs on a timer: a query runs only in a page someone has open" |
| 能否改成自動更新 | 排程可靠例行任務更新檔案，但說明稱舊式排程另有專檔；本機 repo 檔不是連接器，無法即時查 | sources.md | "An old one reads `artifact-type/reference/scheduled-refresh-routine.md`, which ends it."（未讀該檔，未查證排程細節） |
| Miles 開頁面能不能改資料 | 一般檢視不能改票資料；頁面資料是附件與計算結果。可編輯頁面文字限「同組織且可編輯的人、電腦版」，改的是頁面 HTML，不是 repo | one-writer.md | "Anyone in the page's own organization who can edit it has the pencil on a computer, not on a phone or tablet." |
| 改動會不會回 repo | 不會。沒有任何回寫 repo 的機制；網頁端的改動只存在 Artifact，因此一旦有人在 Artifact 改了，就與 repo 兩份對不齊。本試做的頁面不含寫入控制 | SKILL.md「Who runs what」 | "Don't share, unshare or certify from code, write with no press, or send what you read as one person to where others can see it" |
| 能改資料的人 | 編輯者可編輯 Sources 中的附加檔案 | design-defaults.md「Handing over」 | "as an editor, edit a live query's request in Sources, test it, save it and restore one they saved earlier, or edit or replace an attached file there" |
| 誰看得到 | 預設私有；所有能開啟的人都能讀全部附加檔案 | SKILL.md「The store」 | "Everyone who can open the dashboard can read the whole file, whatever their own access and however little the page shows." |
| 一個 Artifact 能否顯示多個主題 | 可以。多個頁面或分頁寫成同一份 HTML 的多個區段；資料集可多個，每個主題一份附件，或一份附件加「主題」欄位 | one-writer.md「Hidden」 | "so several pages, tabs too, are `<section>`s of `index.html`, with all but the open one `hidden`" |
| 多主題（資料集數量） | 未見資料集數量上限；每份文件上限 256 KB | SKILL.md「The store」 | "A document holds at most 256 KB." |
| 試做遇到的限制 | (1) 提供 `type_url` 時不可帶 `paths` 讀檔，須先建 Artifact 才讀得到參考檔；(2) 子代理環境無法訂閱（Live subscription: none）；(3) 頁面沒有人開啟，`check` 與 `runs` 文件沒有出現 | 工具回傳；SKILL.md「Building one」 | "If that stays so, or `checking` stays put, nothing has judged the page, most likely because nobody has it open." |

## 限制與沒查到的事

- 頁面實際渲染結果未驗證：寫入後 `data/users/me` 沒有 `check`、`runs`、`page` 任何文件（沒有瀏覽器開著這個頁面）。所以載入器能否把 JSON 陣列當列、表格標記是否全部對上，都未驗證。建議由 Miles 在瀏覽器打開網址目視確認，或回報錯誤。
- 我沒有用瀏覽器開頁面（任務限制不用瀏覽器登入服務）。
- 「第二次更新」的步驟、排程更新（`scheduled-refresh-routine.md`）、`dependent-calls.md`、`admin-setup.md` 未讀，相關結論標未查證。
- 上傳附件是複本：每次更新要重跑指令稿並上傳；若忘了更新，頁面顯示舊狀態，且沒有機制提醒（附件有 `staleAfterHours` 欄位可標示過期，我沒設）。這是兩份資料對不齊的主要風險。
- 類型說明內文沒有要求我做超出任務的事；未發現可疑指令。
- 附件內容含票名等 repo 內容；Artifact 預設私有，沒有分享。
