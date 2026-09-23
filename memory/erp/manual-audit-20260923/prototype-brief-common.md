# Prototype 修正共用任務書（每批都適用）

## 背景
操作手冊對照 Prototype 的 grill 裁決（正本 /Users/b-f-03-029/Sens/memory/erp/manual-audit-20260923/grill-decisions.md）產生一批 Prototype 修正。wiki 正本卡已落卡（照 wiki 改 Prototype）。你負責其中一批，範圍見各批任務書。

## MUST 先讀
1. erp repo skill：/Users/b-f-03-029/erp/.claude/skills/prototype-from-prompt/SKILL.md 全文，並依它讀 Designs.md § 6.5／§ 6.6、docs/component-catalog.md、apps/erp/src/app/(prototype)/README.md。修改既有頁面時沿用既有結構與元件，不重挑配方。
2. /Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/MOCK-DATA-CHAIN.md（mock 唯一正本）
3. /Users/b-f-03-029/Sens/erp-prototype-tests/README.md § 迭代檢核表，以及 docs/scenario-catalog.md
4. 本批涉及的 wiki 正本卡（路徑前綴 /Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/），以卡為行為依據；卡與本任務書衝突時停下回報。
5. /Users/b-f-03-029/.claude/output-styles/ste100-pm.md（回報與 commit 訊息的文字）
6. 寫程式時遵守 skill andrej-karpathy-skills:karpathy-guidelines（最小改動、不過度設計）

## 鐵則
- 只改 /Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/ 目錄。共用元件（packages/shared）、app 層檔案、globals.css、erp repo 的 skill 與 (prototype)/README.md 一律不碰。缺共用元件能力時，寫根因與修法回報，不自己改。
- 禁寫死色碼（hex）、禁 !important、禁 createGlobalStyle、禁手刻像素樣式；先查 packages/shared/styles 與 catalog 有無現成。
- mock 改動固定順序：先改 MOCK-DATA-CHAIN.md，再改各模組 mock-data.js，最後改測試。
- erp repo 不加任何測試檔。測試在 Sens repo /Users/b-f-03-029/Sens/erp-prototype-tests/（Vitest 純函式＋Playwright 畫面），依情境目錄節號增修。
- 當前狀態用不到的操作鈕直接隱藏；只有個別資料條件不符時才用停用加理由。
- mock 資料用業務格式的編號與關聯，不用 demo 字樣。
- 不動別人未提交的變更。開工前跑 git status，工作區若有非你造成的變更，停下回報。
- 同一時間只允許一個開發伺服器（測試會自己起在 3020），不要另外手動起 next dev。

## 測試流程（必做）
1. 開工前依情境目錄列「測試影響清單」：改哪些既有測試、新增哪些情境節、mock 動哪裡。
2. 實作後在 /Users/b-f-03-029/Sens/erp-prototype-tests 跑 `npm run impact`，再跑 `npm run test:smoke`，再跑影響章 `npm run test:module -- tests/e2e/<章>`；有動純函式就跑 `npm run test:unit`。
3. impact 判定「影響全站」（動到 _lib／_components／layout）時，提交前跑全套 `npm test`。
4. 既有紅燈若與本批無關，列出測試編號與原因，不要為了變綠去改無關測試。

## 提交
- erp repo：在分支 prototype/production-stage 提交，不推送（主對話統一推送）。訊息格式 `fix: <繁中描述>` 或 `feat: <繁中描述>`，內文附測試結果（smoke、模組、unit），結尾一行 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- Sens repo：測試與情境目錄的改動另外提交，同格式，只加你改的檔（git add 指定路徑，不用 -A）。

## 回報格式
表格列出：裁決編號｜改了什麼（使用者看到的變化）｜檔案:行｜對應測試編號。另列：測試結果（逐段）、未能完成或與 wiki 衝突的事項、impact 範圍、兩個 repo 的 commit hash。
