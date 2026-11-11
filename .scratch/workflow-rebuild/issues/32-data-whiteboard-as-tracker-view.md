# 32：Claude 的資料與白板功能能不能當議題追蹤的可視化工具

Type: research
Status: resolved

## Question

Miles 2026-11-12（睡前交辦）：評估 Claude 新出的 data 與 whiteboard 功能，能不能拿來當議題追蹤（地圖與票）的可視化工具。另外確認：要向 Miles 說明一件事時，能不能先用 `eli5` skill 處理，再畫到 whiteboard 裡。

要回答的事：

- 「data」與「whiteboard」各自是什麼功能。先確認 Miles 指的是哪兩個：候選是 Artifact 的共用資料庫（`ArtifactData`）與 Artifact 類型清單裡的類型（用 `Artifact` 工具的 `action: "list"`、`scope: "types"` 查這個帳號有哪些），也可能是 Figma 的 FigJam。查不到就列出查過什麼，回報時請 Miles 指認。
- 它能不能讀本 repo 的 `.scratch/<主題>/map.md` 與 `issues/*.md`，顯示票的狀態、阻擋關係、哪張是下一張。資料是每次重新發布，還是能即時更新。
- 正本仍是 repo 的 Markdown 檔（地圖 Notes：工作管理放本 repo，不放 Linear）。可視化只是檢視，不能變成第二個正本。評估它會不會造成兩份資料對不齊。
- `eli5` skill 的產出是什麼形式，能不能放進 whiteboard；實際試做一次，附結果。
- 與票 19（追蹤與交接的既有 skill 與外掛）、票 23（多項工作追蹤與看板的既有做法）的結論對照：缺的「跨主題總覽」這一塊，這個工具補不補得上。

調研規則照地圖 Notes：讀完原始說明才評估；每筆結論附出處與原文句；查不到標未查證。產出放 `research/32-data-whiteboard-as-tracker-view.md`。
給 Miles 的結論寫四項：做法、建議、風險、預期結果。

## Comments

### 2026-11-12 進行中：已認領，確認 Miles 指的是哪兩個功能

用 `Artifact` 工具查這個帳號的 Artifact 類型清單（`action: "list"`、`scope: "types"`），共 8 種：Data、Design、Design System、Docs、Motion、Sheets、Slides、Whiteboard。
Miles 說的「data」與「whiteboard」就是其中的 Data 與 Whiteboard 兩種類型。清單的原文描述：

- Data：Dashboards, metrics pages, KPI trackers, scorecards, data visualizations and recurring reports: a page or scroll story of charts, numbers and tables of data, from live queries, files or saved numbers. Every number shows where it came from.
- Whiteboard：Whiteboards: shared infinite canvases that show ideas as blocks, arrows, sections and marker sketches, which people rearrange together, with live cursors.

派兩個 Sonnet 子代理分別試做，產出寫到 `research/32-parts/`，主對話檢核後才彙整到 `research/32-data-whiteboard-as-tracker-view.md`。

## Answer

全文：[research/32-data-whiteboard-as-tracker-view.md](../research/32-data-whiteboard-as-tracker-view.md)。分項證據在 `research/32-parts/`。主對話逐句比對原文句（32 句全部存在），並用瀏覽器看過兩個試做頁面。

- 「data」與「whiteboard」是 Artifact 類型清單裡的 Data 與 Whiteboard。
- Data 可以當票務檢視，但不能直接讀 repo：資料要由代理解析後上傳成附件，附件是複本，票的狀態改了要重新上傳。不能即時更新；可設過期時數讓舊資料自己標示。
- Data 一頁可放多個主題，補得上票 19 缺的跨主題總覽的顯示。階段與在製上限仍要票 10 先定。
- Whiteboard 不適合當票務檢視：版面要代理自己算座標，箭頭不會避開區塊，顏色最多四種；看的人改的內容只存在白板。這一項是依說明推論，沒有試做。
- eli5 只有一句指示，成品是大圖少字的 HTML 頁，不能直接放進白板。要放就得重畫成區塊與箭頭；白板類型另規定軟體運作類的題目不畫圖。
- 兩種類型都不會把改動寫回 repo。只由代理單向更新時，正本仍只有 repo 的 Markdown 檔。
- 試做（私有）：Data https://claude.ai/artifact/7qsEkTAHRJUhsPG4cRVBng ；Whiteboard https://claude.ai/artifact/Lz3hqX2Vd1KSivzrb2mA2P 。
- 沒試：Data 第二次更新的步驟、多主題、手機畫面；Whiteboard 畫票地圖。

建議：票務檢視用 Data，併入票 10 一起定，不現在加進流程。eli5 加白板需要時才做，不設成固定步驟。

