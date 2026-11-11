# 37：受控清單拆卡

Type: task
Status: open
Blocked by: 06

## Question

受控清單卡依內容類型拆開。拆法已定（`memory/erp/wiki-normalization-20261104/拆卡盤點.md` 第 41 行、`memory/erp/wiki-normalization-20261104/grill.md` G8）：

- 「未列即不可做」是規則，搬到規則卡。
- 「範圍用詞」「動作類型」是業務名詞，搬到詞彙表。
- 單據代碼、活動清單代碼留在代碼登錄卡。
- 兩段「編輯權」屬於誰能做什麼。先對照活動清單卡判斷是否重複，再定去留；判不了就列給 Miles。

改卡走 `wiki-amend`；改卡名用 obsidian-cli，不用 git mv。
完成後記錄：拆成哪幾張卡、各段搬到哪裡、「編輯權」兩段的處置。
