# 29：記憶重新初始化

Type: task
Status: open
Blocked by: 15

## Question

Miles 2026-11-12：商業需求走 matt 的流程進 wiki，不該再進記憶；同一件事在記憶與 wiki 各有一份會互相矛盾。環境的設置與去重要提前，可以重新初始化。

記憶目錄 `~/.claude/projects/-Users-b-f-03-029-Sens/memory/` 清場後剩 112 張：feedback 59、project 51、reference 2。把它重新初始化成只放「別處放不了」的內容：

- project 類 51 張：逐張核對卡內的決策是否已在 wiki 卡（或進行中工作的資料夾、地圖與票）。已在就封存記憶卡。不在的列成清單給 Miles：那是 wiki 的缺口，走 `wiki-amend` 落卡或開 OQ，不留在記憶。
- feedback 類 59 張：對照 `AGENTS.md`、`~/.claude/CLAUDE.md`、輸出風格檔、各 skill。別處已有同義句的封存記憶卡。只在記憶卡有的先留，並標出它之後該搬到哪個檔（交給票 30 與票 11）。
- 定一條規則並寫進 `AGENTS.md`：什麼可以進記憶、什麼不可以（商業決策進 wiki；工作進度進地圖與票；記憶只當新指示的收件匣與外部資源位置）。規則的範圍與理由要寫明（票 20 的結論）。
- 用資深 PM 的角度判斷；不確定哪類內容該留時，先找既有做法（Anthropic 對記憶檔的官方說法見 `research/20-anthropic-setup-guidance.md`）。

封存不是刪除：記憶卡搬到 `~/.claude/archive/`，比照票 15 的做法，並在回報裡說封存在哪。動手前把分類給 Miles 確認。
完成後記錄留了幾張、封存幾張、列出沒落到 wiki 的決策清單。
