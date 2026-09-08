# ERP prototype 自動化驗收

驗收 erp repo `apps/erp/src/app/(prototype)/` 的商業邏輯。測試碼全部放這裡，erp repo 不加任何檔案。

| 層 | 工具 | 測什麼 | 位置 |
|----|------|------|------|
| 純函式 | Vitest | `_lib/` 的計算與規則（數量換算、成本估算、齊套、權限） | `tests/unit/<模組>/*.test.mjs` |
| 畫面操作 | Playwright | 切模擬角色、進頁面、點按鈕、驗預期結果 | `tests/e2e/<章>/*.spec.mjs` |

## 執行（三層，在 `/Users/b-f-03-029/Sens/erp-prototype-tests` 下）

| 層 | 指令 | 內容 | 何時跑 |
|----|------|------|------|
| smoke | `npm run test:smoke` | 主流程一條：一件印件從需求單到訂單製作完成，33 站，站表見 `docs/main-flow.md` | 改 mock 或 prototype 後立刻跑 |
| module | `npm run test:module -- tests/e2e/07-process-planning` | 該章全部 | 改單一模組時 |
| full | `npm test` | Vitest 純函式加全部 Playwright | erp 提交前 |

Playwright 會自動在 3020 埠啟動 erp 開發伺服器（已在跑則沿用；跑久出現 ChunkLoadError 就先 `pkill -f "next dev --port 3020"`）。erp 每次提交前必跑全套，commit 訊息附「測試 N 項通過」。

## 依據文件

| 文件 | 用途 |
|------|------|
| erp `(prototype)/MOCK-DATA-CHAIN.md` | mock 資料唯一正本，測試引用的單據編號一律出自這裡 |
| `docs/scenario-catalog.md` | 情境目錄，一條情境對應一條測試 |
| `docs/main-flow.md` | 主流程 smoke 站表：每站角色、動作、驗什麼 |
| wiki `07-scenarios/` | 分母：每張業務情境卡都應有對應情境節與測試 |

## 撰寫規約

1. **一條情境一條測試**。測試標題＝情境目錄的節號加標題，例如 `5.1 印務把工單製程送印務主管審核（原編號 3）`。
2. **標題與步驟用業務語言**：誰對哪張單做什麼、系統之後怎麼變。禁縮寫（不寫「建單」「送審」）。
3. **記憶體狀態鐵則**：mock 與模擬角色存在記憶體，整頁載入即重置。一條情境內只允許第一步 `openAs`（含 `page.goto`），之後一律 `gotoInApp` 與 `switchRole`。跨頁面的推狀態鏈也在同一條測試內完成。情境本文明寫「重新整理頁面」時才可 `page.reload()`，並加註解。禁用 `history.pushState` 加 `popstate` 導頁，Next 會整頁重載。
4. **起點資料**照情境目錄「起點資料」列；要先推狀態的情境，前置步驤寫在同一條測試開頭並加註解「前置」。
5. **選取元素**優先用使用者看得到的文字與角色（`getByRole`、`getByText`、表格列含單據編號），不用 CSS class 當唯一依據；AntD 結構類名只在共用工具內使用。
6. **數字驗算**寫在純函式測試；畫面測試只驗畫面呈現的結果字串。
7. **逆流程與附加流程不寫測試**，待辦見情境目錄末章。例外：主流程第 14 站業務退回重審。
9. **主流程 smoke 不設 fixme、不繞道**：任一站走不通即失敗，斷點就是缺口，記進 `docs/findings-*.md`。標籤 `@smoke` 只給主流程。
8. **handoff**：模組搬到 `(dashboard)/` 後，該模組的 e2e 轉成 Linear 驗收段後刪除；純函式測試整包交前端。路徑只改 `config.mjs`。

共用工具在 `tests/e2e/_helpers.mjs`：`openAs(page, 角色, 路徑)`、`switchRole(page, 角色)`、`gotoInApp(page, 路徑)`、`clickIntoDetail(page, 文字, 網址樣式)`、`cjkName('核可')`（AntD 兩字按鈕中間插空白的容錯）、`ROLE_USERS`。

## 執行注意

- 正式複驗一律 `--workers=1`。多條 Playwright 併發會互相清掉 `test-results/` 造成假失敗；一定要併發時各自帶 `--output=<不同目錄>`。
- AntD Select 的可見選項用 `.ant-select-dropdown:visible .ant-select-item-option`，`role=option` 是畫面外隱藏複本。
- 共用篩選元件的搜尋框要按 Enter 才送出。
- 詳情頁以 `router.push` 開啟時網址可能未即時更新，判定用頁面內容。
- 每章可有自己的 `_xxx.mjs` 工具檔（非 spec 檔），跨章共用的再收進 `_helpers.mjs`。
- 首輪撰寫的發現與處置見 `docs/findings-20260908.md`。

## 迭代檢核表（每次 prototype 迭代，不論有沒有進 OpenSpec）

迭代順序固定三步：wiki 業務情境卡先有（wiki-amend）→ 依卡在情境目錄補節並寫測試，跑一次應全紅 → 派工實作到綠、提交。wiki 業務情境卡（07-scenarios）就是分母：目錄每節的「依據」行指回卡名，用卡名一搜就知道有沒有測；不另設覆蓋清單。

| 時機 | 做什麼 | 產出 |
|------|------|------|
| 規劃 | 用情境目錄找受影響的節；找不到就是新情境，先補目錄 | 測試影響清單：改哪些既有測試、新增哪些情境、mock 動哪裡 |
| 派工 | 任務書帶測試影響清單與 mock 三步順序（先 MOCK-DATA-CHAIN、再 mock-data.js、再測試） | sub-agent 交回程式加測試 |
| 實作後 | `npm run impact`（對映 erp 改動到章與測試）→ `npm run test:smoke` → 該章 `npm run test:module -- tests/e2e/<章>` | 三段結果 |
| 提交前 | `npm test` 全套；commit 訊息附 smoke／模組／全套三個結果。影響清單為空且未改測試時，訊息寫明「無測試影響」理由 | erp 提交 |
| 收尾 | 情境目錄該節更新（含「依據」wiki 卡名）、發現清單關掉已修項 | Sens 提交 |

`npm run impact` 預設取 erp 工作區未提交變更加最近一筆提交；`npm run impact -- HEAD~3` 取範圍；`npm run impact -- --paths <檔>...` 直接給路徑。
