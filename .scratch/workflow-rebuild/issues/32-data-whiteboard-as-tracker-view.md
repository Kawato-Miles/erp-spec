# 32：Claude 的資料與白板功能能不能當議題追蹤的可視化工具

Type: research
Status: open

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
