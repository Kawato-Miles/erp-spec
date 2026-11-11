# 34：記憶卡內舊待辦的清點

Type: task
Status: open

## Question

票 29 核對記憶卡時，有 48 列被分類為「紀錄或待辦」：卡裡寫著還沒做完的事，或只是完成紀錄。記憶卡已封存，待辦不能留在記憶裡（`AGENTS.md` § 記憶目錄：工作進度、待辦寫進地圖與票）。逐列清點，判定每一列的去向。

來源：`research/29-verify/R-*.md` 中結論為「仍缺」、分類為「紀錄或待辦」的 48 列，分布在 31 張記憶卡。取列的指令：

```bash
grep -h "| *仍缺 *| *紀錄或待辦 *|" .scratch/workflow-rebuild/research/29-verify/R-*.md
```

記憶卡原文在 `~/.claude/archive/memory-reinit-20261112/memory-cards/`（票 15 封存的在 `~/.claude/archive/env-reset-20261112/memory-cards/`）。

每一列判成下列其中一種：

| 去向 | 做法 |
|---|---|
| 純完成紀錄 | 不處理，git 紀錄已有 |
| 已做完 | 附證據（提交、檔案位置） |
| 還沒做、仍需要 | 併入本地圖既有的票，或列給 Miles 決定要不要開新工作 |
| 還沒做、已不需要 | 寫明理由（例：做法已被取代） |

已知的例子：6 張 raw 升 reviewed、Linear 範例更新、PT-048 封存、印件生產階段數量帳重構 grill 的待裁決項（該 grill 有 7 列）。

「還沒做、仍需要」的清單要給 Miles 看；其餘三種由代理判定並附證據。
完成後記錄：四種去向各幾列、給 Miles 的清單。
