# 29：記憶重新初始化

Type: task
Status: claimed
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

## Comments

### 2026-11-12 進行中：已認領，核對分批已定，尚未派工

現況（實測）：記憶目錄 113 檔，含索引檔；feedback 59、project 51、reference 2。`feedback_linear_task_prefix.md` 不在索引內。封存資料夾 `~/.claude/archive/env-reset-20261112/memory-cards/` 有 36 張加清場前的索引檔，其中 project 類 29 張。

判準（資深 PM 的角度）：這張卡不在記憶裡，代理會不會做錯 Miles 的四件工作。既有做法依據是 `research/20-anthropic-setup-guidance.md` § 六：記憶不存 repo 已記錄的內容與指令檔已寫的內容；一則一檔；過時的刪除。

核對方式：派 Sonnet 子代理分批，每批把卡內決策逐條拆開，逐條找家並附原文句。結果寫到 `research/29-verify/<批名>.md`，主對話抽查後才採用。

決策的家依正本分層判：

| 決策類型 | 家 |
|---|---|
| 商業規則、欄位、狀態、權限 | wiki 卡 |
| 介面互動、版型 | erp 程式庫的 Prototype |
| 流程與環境規則 | `AGENTS.md`、skill、wiki 規範卡、地圖與票 |
| 完成紀錄（做了什麼、哪個 PR） | git 紀錄，不需要家 |
| 找不到 | 缺口，列給 Miles |

分批：

| 批 | 範圍 | 張數 |
|---|---|---|
| P1 | 訂單、需求單、款項、諮詢、售後 | 6 |
| P2 | 交期、急件、印件層、備料、BOM | 8 |
| P3 | 工單 | 7 |
| P4 | 生產 | 9 |
| P5 | 出貨、品檢 | 6 |
| P6 | wiki 結構與規範 | 8 |
| P7 | Prototype、Linear、手冊、skill | 7 |
| P8 | 已封存的完成紀錄：訂單、需求單、款項、工單 | 9 |
| P9 | 已封存的完成紀錄：其他 | 9 |
| F1 至 F3 | feedback 類 59 張，對照 `AGENTS.md`、全域 `CLAUDE.md`、輸出風格檔、專案 skill、wiki 規範卡 | 59 |

5 小時額度在 2026-11-12 開工時是 96%，等重置後才派工。
