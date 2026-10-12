# Prototype 第一包任務書：生產管理與工單（2026-10-12）

你是 Prototype 實作者。依本任務書修改 erp repo 與 Sens 測試專案。

## 一、開工前必讀

1. erp repo skill：/Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md，以及它列的 `Designs.md` §6.5／§6.6、`docs/component-catalog.md`、`apps/erp/src/app/(prototype)/README.md`。本任務是「修改既有 prototype」：沿用既有頁面結構與元件，不重挑配方。
2. 回覆與註解語言：/Users/b-f-03-029/.claude/output-styles/ste100-pm.md。台灣繁中，禁 emoji，禁簡體字。
3. 設計依據：/Users/b-f-03-029/Sens/memory/erp/plans/production-ui-correction-20261012/design.md 與 grill.md（第 1～41 題）。wiki 正本已更新，用詞以 wiki 為準：/Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/ 下 [[報工紀錄]]、[[報工規則]]、[[生產任務]]、[[轉交單]]、[[轉交單狀態]]、[[印件生產流程]]。
4. 測試專案：/Users/b-f-03-029/Sens/erp-prototype-tests/README.md（撰寫規約、執行注意、迭代檢核表全部照做）。

## 二、硬規則

- erp repo 工作分支：`prototype/dispatch-and-shipping`（已在此分支，不要切換、不要 merge develop）。
- 只動 `apps/erp/src/app/(prototype)/` 目錄。共用元件（`packages/shared`）、app 層檔案、`(prototype)/README.md`、erp skill 一律不碰。缺共用元件時停下回報，不就地手刻。
- 禁手寫 hex、px、`!important`、`createGlobalStyle`。尺寸與顏色一律用 theme token（縮圖沿用 `theme.spacing.xxl`，即現有轉交單完稿縮圖的寫法）。
- 當前狀態用不到的操作鈕直接不渲染，不做停用加提示。
- **Prototype mock 與測試同步規則（Miles 2026-09-08、09-21 拍板）**：`(prototype)/MOCK-DATA-CHAIN.md` 是 mock 資料唯一正本；改 mock 的順序固定為先改 MOCK-DATA-CHAIN、再改各模組 `mock-data.js`、最後改 Sens repo 的測試。erp repo 不加任何測試檔。實作後先 `npm run impact`，再跑 `npm run test:smoke` 與受影響章 `npm run test:module -- tests/e2e/<章>`（一律 `--workers=1`）。規劃功能而漏掉測試撰寫視同未完成。
- 不暫存（git add）還不提交的改動。本任務**不要 commit**，交回後由主對話稽核再提交。

## 三、要做的事

### A. MOCK-DATA-CHAIN.md 說明文字（只改文字，不改資料值）

1. 轉交進度對照表（約 816～824 行）：表頭「轉交量」→「搬運量」、「轉交點收量」→「點收量」；轉交進度欄改兩數，例如「500／480」；下方說明句同步。
2. 全檔用詞：轉交量→搬運量、轉交點收量→點收量、現場照片→報工照片、報工的修改紀錄→報工修正紀錄、修改與作廢（報工、點收語境）→修正與作廢、點收修改→點收修正、搬運數量修改→搬運數量修正、點收紀錄單筆「點收量」→點收數量、轉交明細合計「點收數量」→點收量。一般語意的「修改」不改。
3. 簽收照片說明（約 88 行）：「mock 無預覽網址，畫面只顯示檔名」改為「mock 無預覽網址，畫面顯示佔位圖」。
4. 品檢與出貨相關段落本包不動（由第二、三包處理）。

### B. 工單詳情（work-orders）

1. 生產任務表「現場執行」群組：
   - 「轉交進度」欄表頭改「轉交進度（搬運量／點收量）」，格內只顯示數字「1,000／500」；不適用時維持無值符號。
   - 欄序改為：生產任務狀態、交付狀態、轉交狀態、生產數量、轉交進度（生產數量移到轉交進度前面）。
2. 生產任務列加「檢視」圖示鈕，開同一個生產任務側板（`production-floor/_components/TaskDetailDrawer.js`）。側板的報工紀錄表在工單詳情開放修正與作廢，範圍＝工單詳情報工範圍（工單負責人與取得編輯分享的成員，判定沿用工單詳情報工現有的 `isEditorOf`），其他人唯讀。
3. 工單詳情的任務展開列維持顯示歷程，不動。

### C. 生產任務側板（`production-floor/_components/TaskDetailDrawer.js`，四個生產管理單元與工單詳情共用）

1. 區塊標題改用印件項目樣式：`SectionHeader` 傳 `number`（1～5），即共用元件已支援的序號圓標。
2. 分五區：
   | 序 | 區塊 | 內容 |
   |----|------|------|
   | 1 | 基本資料 | 工單編號、印件、工作包、指派師傅 |
   | 2 | 狀態 | 生產任務狀態、交付狀態、轉交狀態（拿掉「接收工作」） |
   | 3 | 數量 | 依序：目標數量、生產數量、良品、不良品、搬運量／點收量（拿掉可做量；前置未到料的說明句保留在本區下方） |
   | 4 | 報工紀錄（N） | 沿用 `WorkReportRecords`，可修正與作廢依單元：所有生產任務、所有工作包＝範圍內全部；我的生產任務、我的工作包＝只限自己提交的；主管唯讀 |
   | 5 | 歷程（N） | 不變 |
3. 側板寬度加大到報工紀錄表不出現橫向捲動（用既有側板寬度選項或 token，不手寫 px；若 `PanelDrawer` 無對應寬度選項，停下回報）。
4. 所有與我的生產任務**不改子母表**（grill 41）。

### D. 報工紀錄表（`production-floor/_components/WorkReportRecords.js`）

1. 最左邊兩欄固定（`fixed: 'left'`）：「完稿縮圖」（該印件當前合格審稿輪次的完稿，取法比照 `TransferTicketTable.js` 的 `thumbOf`；沒有時佔位圖）、「報工照片」（第一張；mock 只有檔名時顯示佔位圖）。都用 `GenericImage`，點開看那一張，不標張數。
2. 「照片」欄拿掉（已由報工照片欄取代）。
3. 按鈕與對話框文字：修改→修正（如「修正報工」「修正原因」）；作廢不變。

### E. 點收與轉交（`ReceiptOperations.js`、`TransferTicketTable.js`、`transfers/page.js`、`receiving/page.js`）

1. 「作廢點收紀錄」從子層明細列移到母層轉交單列：按鈕開對話框，列出這張轉交單所有有效點收紀錄，勾選要作廢的那筆並填原因。母層因此有點收、修正點收紀錄、作廢點收紀錄三個點收類動作。
2. 「修改點收紀錄」改名「修正點收紀錄」；「搬運數量修改」改名「搬運數量修正」。
3. 點收對話框的明細表最左邊加「完稿縮圖」欄（固定左側）。
4. 轉交單子層的「簽收照片」欄：一律顯示縮圖，沒有預覽網址時顯示佔位圖，不再退回顯示檔名。完稿縮圖與簽收照片兩欄固定在最左。
5. 欄名：轉交單明細合計「點收數量」→「點收量」；點收紀錄單筆→「點收數量」。

### F. 轉交進度文字（`production-floor/_lib/transfer-rules.js`）

`describeTransferProgress` 回傳「搬運量／點收量」兩數字串，例如「1,000／500」，不帶文字。程式註解同步改用新詞。其他 `_lib` 的變數名維持英文代號不動。

### G. 全面用詞

本包涉及的頁面與元件，畫面文字依任務書 A-2 的對照改名（轉交量、點收量、報工照片、修正）。

## 四、測試影響清單（Sens repo `erp-prototype-tests/`）

### 改寫既有

| 測試檔 | 情境節 | 改什麼 |
|-------|-------|-------|
| `tests/unit/production-floor/transfer-status-derivation.test.mjs` | 10 章 | `describeTransferProgress` 期望值改兩數（如「1,000／500」）；註解用詞 |
| `tests/unit/production-floor/transfer-receipts.test.mjs` | 10.26～10.31 | 同上；測試名稱用詞 |
| `tests/unit/production-floor/report-precondition-and-entries.test.mjs` | 10.49 | 若錯誤訊息「現場照片必填」改為「報工照片必填」，期望值同步（訊息文字在 erp `_lib` 時一併改） |
| `tests/unit/production-floor/layered-correction.test.mjs`、`13-1-outsourced-completion.test.mjs`、`report-remark-and-history.test.mjs` | — | 測試名稱與註解用詞 |
| `tests/e2e/14-query-ui/task-drawer-and-thumbnail.spec.mjs` | 14.29 | 改驗五區（基本資料、狀態、數量、報工紀錄、歷程）與序號；不再驗「接收工作」；數量區依序含目標數量、生產數量、搬運量／點收量 |
| 同上 | 14.30 | 子層簽收照片欄改驗縮圖或佔位圖 |
| `tests/e2e/08-process-review-deliver/deliver-to-shopfloor-chain.spec.mjs` | 第 115 行附近 | 側板仍有「報工紀錄（1）」，確認仍通過；若選取器因區塊改名失效則修正 |
| 點收作廢相關 e2e（搜 `作廢點收紀錄`） | 10 章 | 入口由子層改母層 |
| `tests/e2e/_helpers.mjs` | — | 註解用詞 |

### 新增情境（先寫進 `docs/scenario-catalog.md` 14 章，再寫測試；依據行寫 wiki 情境卡名）

| 節號 | 驗什麼 | 依據 |
|------|-------|------|
| 14.31 | 工單詳情轉交進度欄只顯示「搬運量／點收量」數字；現場執行群組中生產數量排在轉交進度前 | [[生產任務]] |
| 14.32 | 工單詳情生產任務列按「檢視」開生產任務側板；工單負責人可修正報工，非負責人唯讀 | [[報工與修正]] |
| 14.33 | 報工紀錄表最左兩欄為完稿縮圖、報工照片 | [[報工與修正]] |
| 14.34 | 所有轉交單母層有作廢點收紀錄，子層不再有；點收對話框有完稿縮圖欄 | [[場內轉交與修正]] |
| 14.35 | 我的生產任務的側板只能修正與作廢自己提交的報工 | [[報工與修正]] |

情境目錄既有 14.28、14.29、14.30 改寫內容。迭代順序：先補目錄與測試、跑一次應為紅，再實作到綠。

## 五、交回內容

1. erp 改動檔清單（每檔一句話）。
2. 測試改動檔清單。
3. 三段結果：`npm run impact` 輸出摘要、`npm run test:smoke` 結果、受影響章 `test:module` 結果（通過數／失敗數，失敗附原因）。
4. 自我檢核：`grep -rn "#[0-9a-fA-F]\{3,6\}\|[0-9]px\|!important\|createGlobalStyle"` 在你改過的 erp 檔的結果。
5. 任何停下的地方與原因。
