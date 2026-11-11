# 任務書：核對 feedback 類記憶卡的做事方法是否別處已有

## 背景

Miles 是印刷業 ERP 的產品經理。他的工作只有四件：維護 wiki、做 Prototype、開 Linear 議題給前後端、專案管理。
代理的記憶卡（`feedback_*.md`）記的是 Miles 對代理做事方法的指示。很多指示後來已寫進 `AGENTS.md`、全域 `CLAUDE.md`、輸出風格檔、skill 或 wiki 規範卡，同一句話存在兩三處。
本任務用資深 PM 的角度核對：這張記憶卡拿掉後，代理還會不會照這條指示做事。別處已有同義句，記憶卡就可以封存。只在記憶卡有的，要標出它之後該搬到哪個檔。

你只核對、只回報。不改任何檔。不執行任何 git 寫入指令。

## 先讀

1. `/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`（用語對照）。
2. 本檔。
3. 對照用的規範檔（全部讀完再開始核對）：
   - `/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491/AGENTS.md`
   - `/Users/b-f-03-029/.claude/CLAUDE.md`
   - `/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`
   - `/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491/.claude/skills/` 下七個 skill 的 `SKILL.md`（`references/` 用 Grep 搜，不必全讀）
4. 派工訊息指定的記憶卡（逐張讀全文）。

其他可能的家，用 Grep 搜：

| 位置 | 內容 |
|---|---|
| 工作樹的 `memory/Sens_wiki/wiki/erp/00-meta/`、各層 `規範 - *.md`、`memory/Sens_wiki/wiki/AGENTS.md`（若有） | wiki 寫卡規範 |
| 工作樹的 `memory/Sens_wiki/wiki/erp/11-review-knowledge/` | 審查知識、評分準則、參考模型 |
| 工作樹的 `memory/shared/`、`docs/agents/`、`erp-prototype-tests/README.md` | 共用規則 |
| `/Users/b-f-03-029/erp/.claude/skills/`、`/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/` 下的 `.md` 檔 | Prototype 實作規範（只讀） |
| 工作樹的 `.scratch/workflow-rebuild/map.md` | 工作環境重建的現行指示 |
| 工作樹的 `memory/Sens_wiki/wiki/erp/` 內容卡 | 卡內若是商業規則（不是做事方法），家在 wiki 內容卡 |

工作樹根目錄是 `/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491/`。

## 做法

1. 逐張讀記憶卡全文。把卡內每一條指示拆成獨立的一列。一張卡通常有一條主指示，加上「為什麼」與「怎麼套用」裡的附帶指示。
2. 每條指示找同義句。記下檔案路徑、行號、原文句（照抄，可截到 60 字）。同一條在多處都有，全部列出。
3. 判定只有下列五種：

| 判定 | 條件 |
|---|---|
| 別處已有 | 找到同義句，拿掉記憶卡不影響代理行為 |
| 部分 | 別處只有結論，記憶卡多了判斷方法、例子或適用範圍；寫明多了什麼 |
| 只在記憶 | 別處找不到 |
| 矛盾 | 別處的現行規則與記憶卡相反；兩邊原文並列，不判誰對 |
| 過期 | 卡內引用的檔、工具、流程已不存在（例：OpenSpec、專案 CLAUDE.md、config.yaml）；寫明哪個前提不存在，並用 `ls` 或 Grep 驗證 |

4. 「只在記憶」與「部分」的指示，建議一個之後該搬去的檔，並說明理由。依下表判：

| 指示性質 | 建議的家 |
|---|---|
| 每次對話都要遵守的做事方法 | `AGENTS.md` |
| 回覆的語言、句法、用詞 | 全域 `CLAUDE.md` 或輸出風格檔 |
| 只在某個流程步驟用得到 | 對應的 skill |
| wiki 卡怎麼寫 | wiki 規範卡 |
| Prototype 怎麼做 | erp 程式庫的 Prototype skill（Miles 不讓動 erp 的 skill，標「需 Miles 決定」） |
| 其實是商業規則或設計原則 | wiki 內容卡或審查知識卡 |

5. 不推測。沒有原文句就不能判「別處已有」。
6. 另外標出：卡內有沒有帶強調字的絕對規則（MUST、禁止、絕對不可）卻沒寫理由或適用範圍。

## 產出

把結果寫成一個檔，路徑由派工訊息指定（在 `.scratch/workflow-rebuild/research/29-verify/` 下）。格式：

```markdown
# <批名> 核對結果

## 總表

| 記憶卡 | 指示條數 | 別處已有 | 部分 | 只在記憶 | 矛盾 | 過期 | 整張卡結論 | 建議的家 |

（整張卡結論四選一：可封存／先留待搬／有矛盾／過期可封存）

## <記憶卡檔名>

| # | 指示（照卡內原句精簡） | 判定 | 別處位置（路徑:行號） | 原文句 | 記憶卡多了什麼 |

## 先留待搬與矛盾清單

（只列整張卡結論不是「可封存」的卡；每張寫：留下的指示、建議的家、理由）
```

## 回報（回傳給主對話的訊息，繁體中文，300 字以內）

1. 產出檔路徑。
2. 總表各結論的張數。
3. 矛盾幾條，各一句話。
4. 沒核對完或沒把握的地方：哪張卡、為什麼。

不要把逐條明細貼進回報，主對話會讀檔。
