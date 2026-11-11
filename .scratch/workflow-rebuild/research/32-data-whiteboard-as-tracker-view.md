# 32：Claude 的 Data 與 Whiteboard 能不能當議題追蹤的檢視

日期：2026-11-12。分項證據在 `32-parts/A-data.md`（Data 試做）與 `32-parts/B-whiteboard-eli5.md`（Whiteboard 與 eli5 試做）。本檔是主對話檢核後的彙整。

## 主對話的檢核

- Miles 指的功能：用 `Artifact` 工具查帳號的類型清單，共 8 種，其中有 Data 與 Whiteboard。原文描述記在票 32 的留言。
- 原文句比對：把兩個試做 Artifact 內的類型說明檔存到本機，用指令逐句比對兩份分項檔的「原文句」欄。A 檔 14 句、B 檔 18 句全部存在；另有 3 列子代理自己標「未查證」或「無原文」。B 檔「改動存在哪裡」一列引的能力清單來自工具回傳的標頭，主對話對照 Artifact 的宣告內容：項目相同，宣告另多一項 `flags`。
- 解析結果：主對話另外用指令列出 34 張票的狀態與阻擋，與 A 檔一致（結案 18、認領 1、未開始 15；現在可做 30、34；下一張 30）。
- 畫面：主對話用瀏覽器打開兩個 Artifact 看過。Data 頁顯示五格數字與票表，標題下一行寫「目前可做的票：30、34。下一張：30。」。Whiteboard 顯示標題、8 個區塊與箭頭，沒有重疊。手機畫面沒有看。
- 子代理沒有改到產出檔與暫存資料夾以外的檔。
- 子代理沒讀的 `scheduled-refresh-routine.md`，主對話讀了：那是已停用的舊排程說明（原文：That routine belongs to a Dashboard release that has been retired）。

## 試做結果

| 試做 | Artifact（私有） | 內容 | 花費 |
|---|---|---|---|
| Data | https://claude.ai/artifact/7qsEkTAHRJUhsPG4cRVBng | 34 張票的狀態、阻擋、現在可做的票、下一張 | 約 14 次工具呼叫，約 100 秒 |
| Whiteboard 加 eli5 | https://claude.ai/artifact/Lz3hqX2Vd1KSivzrb2mA2P | 用 eli5 的寫法說明「票 29 做了什麼」，畫成區塊與箭頭 | 8 次工具呼叫，約 100 秒 |

## Data 類型

| 問題 | 結論 | 原文句（出處） |
|---|---|---|
| 能不能直接讀 repo 的檔 | 不能。資料要由 Claude 解析後上傳成附件 | `url` is what `upload_asset` gave (`/_blob/<id>`). No other URL is read.（類型說明 SKILL.md） |
| 資料怎麼更新 | 附件是複本，不會自己更新。票的狀態改了，要重跑解析指令稿並重新上傳資料檔；頁面本身不用重做 | A file is a copy, whatever it was copied from: a newer one shows only when someone, or a routine, uploads it.（sources.md） |
| 能不能即時更新 | 不能 | Nothing runs on a timer: a query runs only in a page someone has open（SKILL.md） |
| 資料過期時看不看得出來 | 可以設過期時數，超過就標示過期。試做沒設 | Past `staleAfterHours`, about twice the time between updates, the file shows as stale.（sources.md） |
| 看的人能不能改資料 | 編輯者可以在「Sources」換掉附件。改動只存在 Artifact，不會回到 repo | as an editor, edit a live query's request in Sources, test it, save it and restore one they saved earlier, or edit or replace an attached file there（design-defaults.md） |
| 能不能做跨主題總覽 | 可以。多個主題寫成同一頁的多個區段，各用一份資料 | so several pages, tabs too, are `<section>`s of `index.html`, with all but the open one `hidden`（one-writer.md） |

沒試的事：第二次更新的實際步驟；多主題；手機畫面。

## Whiteboard 類型與 eli5

| 問題 | 結論 | 原文句（出處） |
|---|---|---|
| eli5 的產出是什麼 | 整個 skill 只有一句：做一個大圖少字的 HTML Artifact。沒有步驟、格式、檢查 | Explain like I'm someone who knows nothing about this topic, using a HTML artifact with big pictures and few words.（eli5 的 SKILL.md 第 8 行） |
| eli5 的成品能不能直接放進 Whiteboard | 不能。白板的內容要一個一個元素寫進它自己的資料庫，不收頁面。eli5 的結果要重畫成區塊與箭頭 | Its content lives in the board's own live store, written with the ArtifactData tool, never in files.（類型說明 SKILL.md） |
| 白板畫不畫圖 | 白板類型規定軟體運作這類題目不畫圖，與 eli5 的「大圖」相反。試做只有區塊與箭頭 | What has nothing to see gets no pictures unless the person asks to draw or illustrate it: a list, a schedule, a brainstorm, a comparison of ideas, the workings of software, a network or an organisation.（同上） |
| 看的人能不能改 | 能移動、能改字。改動存在白板的資料庫，不會回到 repo | their words and colours stay theirs unless the ask concerns them.（同上） |
| 更新會不會蓋掉手動排過的位置 | 只送有變的欄位就不會。說明禁止整張重建 | Never rebuild a board, because people may be working on it as you write and a rewrite would lose what they did.（同上） |
| 適不適合畫 30 多張票加阻擋箭頭 | 元素夠用，但不適合：版面要代理自己算座標；箭頭不會自動避開區塊；顏色最多四種。這一題是依說明推論，沒有試做 | The route the page picks for an arrow won't steer around anything, so where it would cross a block or run along another arrow, give it `bends`, worked out as you write it.（同上） |

## 與票 19、票 23 的對照

- 票 19 的缺口有三項：沒有跨主題總覽；沒有「等 Miles 看原型」「待驗收」這類階段；啟動靠使用者下指令。
- Data 類型補得上第一項的「顯示」：一頁可以放多個主題。它補不上資料面：階段要先在票的 `Status:` 行有定義才顯示得出來，這是票 10（總看板與在途工作去留）的決策。
- 票 23 的結論是看板只要求寫出開始與完成的定義、明確控制在製品。Data 頁可以顯示在製數量，但上限是多少仍是票 10 的決策。
- 檢視不是正本這一點，兩種類型都做得到，前提是只由代理單向更新、Miles 不在 Artifact 裡改。

## 給 Miles 的結論

議題追蹤的檢視：

| 項 | 內容 |
|---|---|
| 做法 | 用 Data 類型做一個固定網址的總覽頁。一支指令稿解析 `.scratch/*/issues/*.md`，每次票結案時重新上傳資料檔。頁面設過期時數，資料太舊會自己標示。Whiteboard 不用在這裡 |
| 建議 | 可以採用，但併入票 10 一起定，不現在加進流程。票 10 要先定階段與在製上限，檢視才有東西可顯示 |
| 風險 | 代理忘了更新，頁面就顯示舊狀態；有人在頁面裡換了附件，就與 repo 不一致。第二次更新的步驟與手機畫面沒試過。Miles 目前的習慣是在對話裡問，這頁可能用不到 |
| 預期結果 | Miles 打開一個網址，看到每個主題各有幾張票、哪張是下一張、哪些被擋住。正本仍是 repo 的 Markdown 檔 |

用 eli5 說明後畫到 Whiteboard：

| 項 | 內容 |
|---|---|
| 做法 | 做得到，但不是「先 eli5 再貼上」。eli5 只有一句指示，成品是 HTML 頁；放進白板要重畫成區塊與箭頭。兩種載體分開用：講流程、先後、關係，畫 Whiteboard；講單一概念、需要大圖，用 eli5 原本的 HTML Artifact |
| 建議 | 需要時才做，不設成固定步驟。試做的白板可直接看，判斷這種說明對 Miles 有沒有幫助 |
| 風險 | 每次約 8 次工具呼叫。白板上的字是代理改寫的白話，可能不精確（試做把留下的 55 張寫成「還要用的卡」，其實 50 張 feedback 卡還要搬或待裁決） |
| 預期結果 | 一件事用一張白板說明，Miles 可以移動區塊、留言。它是說明用的圖，不是紀錄 |
