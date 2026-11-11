# 14：架構面內容完整盤點（以初始化專案的角度）

Type: research
Status: resolved

## Question

所有與專案有關的架構面內容（AGENTS.md、skill、範本、規範、hook、設定、子代理定義、說明檔、散檔）各是什麼、誰在讀、有沒有在用？
以「全新初始化」的角度，每一項該留、改寫、併入他處或刪除？
「現有環境盤點與使用證據」已查過的項目不重查，只補沒查到的範圍並給去留判定。

## Answer

盤點分三份，檔頭有主對話的抽查與更正，以檔頭為準：

- `research/14a-sens-and-global-inventory.md`：Sens 根目錄、`docs/`、`memory/`（wiki 以外）、`.claude/`、使用者層。157 項：留 50、改寫 8、併入 2、刪 71、待判 25。記憶卡 143 張中可刪 38、改寫 8、待判 2。第七節是可直接刪除的路徑清單。
- `research/14b-wiki-architecture-inventory.md`：wiki 的規範、範本、卡片類型。30 項：留 6、改寫 16、併入 3、刪 2、待判 3。查一件事要跨 7 到 10 張卡；首頁寫的讀者是人，與「只給模型讀」的前提相反。
- `research/14c-prototype-and-tests-inventory.md`：erp 程式庫的代理指引與 mock、Sens 的測試目錄、情境與測試對照表。48 項：留 24、改寫 3、刪 5、待判 16。462 節情境中 153 節追不回 wiki 情境卡；6 張情境卡沒有任何測試。

清場的前置依賴：
- wiki 卡 `source` 欄以路徑引用 `memory/erp/plans`（240 張）、`memory/erp/wiki-normalization-20261104`（194 張）等資料夾。刪資料夾前要先決定 `source` 欄怎麼處理。
- 提交後自動推送的 hook 只寫在 `.claude/settings.local.json`。刪該檔前要先搬進 `settings.json`。
- erp 程式庫由前端主管共用，其中的檔要分開列給 Miles 確認。
