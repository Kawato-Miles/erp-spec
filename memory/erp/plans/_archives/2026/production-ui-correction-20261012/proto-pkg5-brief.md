# Prototype 第五包任務書：品檢與出貨逆流程、補附送達憑證、第 63～65 題（2026-10-14）

你是 Prototype 實作者。依本任務書修改 erp repo 與 Sens 測試專案。

## 一、開工前必讀與硬規則

1. 第一包任務書 § 一、§ 二全部適用：/Users/b-f-03-029/Sens/memory/erp/plans/_archives/2026/production-ui-correction-20261012/proto-pkg1-brief.md。
2. erp 工作分支改為 `prototype/production-stage`（已在此分支，唯一長期分支）。不要切換、不要 merge develop。
3. wiki 已更新，規則以 wiki 為準（/Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/）：
   - 權責看活動清單：04-business-logic/服務藍圖/ 下品檢活動清單、出貨活動清單、製程規劃活動清單；受控清單。
   - 05-entities/印件（品檢缺口處置的處置數量檢核、可出貨額度）、出貨單（OP-SHP-015 補附送達憑證）、生產任務（OP-TSK-011 刪除生產任務）。
   - 06-state-machines/出貨單狀態、生產任務狀態（待處理 → 刪除的轉換條件）。
4. 不 commit、不 git add。交回後由主對話稽核再提交。
5. `apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js` 本包要改（第 63、64 題）。改前先 `git status` 確認該檔沒有其他人的未提交改動；有就停下回報。

## 二、要做的事

### A. 品檢與出貨逆流程（情境目錄第十六章標待辦的項目）

對下列各列，先查 Prototype 現況：已經做到的，只補情境目錄具名案例與畫面測試；沒做到的，先補 Prototype 再補案例與測試。補好的案例從第十六章表格移到對應章節（第十一章品檢、第十二章出貨）成為正式一節，第十六章該列刪除或改標已完成（依目錄現行慣例）。

| 目錄列 | 內容（以 wiki 為準） |
|--------|---------------------|
| 16.4、16.6、16.14 | 印務記錄品檢缺口處置：補不補與瑕疵品去向兩軸、數量；可分次處置，處置留痕逐筆列出；品檢人員看不到入口。處置數量檢核只約束「報廢類處置合計不得大於不通過累計」，客戶照收不設上限；照收那一筆不讓未處置缺口下降，要等品檢人員修正品檢紀錄改判 |
| 16.5、16.12、16.17 | 出貨人員對運送中的出貨單標記異常；業務（及有編輯權者）對未離廠出貨單作廢。理由必填、記轉入時間；該單不再計入累計已出貨數量，可出貨額度即時回補，印件列表與印件詳情同時變；收掉最後一張在途單時補跑送達收尾判定。16.5 原文寫「出貨人員或業務轉異常」，請照 wiki 改為轉異常只歸出貨人員 |

### B. 補附送達憑證（第 66 題）

出貨人員在「已送達」的出貨單可補附送達憑證（專車＝司機交付照、自取＝現場點交照），用於送達確認時漏附照片。比照出貨單既有的列上動作鈕與對話框做法；其他狀態不渲染這顆鈕。補情境目錄一節與畫面測試。

### C. 缺口處置數量上限（第 65 題）

`print-items` 的 `DispositionDialog` 與 store 目前把每筆處置數量夾在未處置缺口。改為：只檢核「報廢類處置合計（含本筆）不得大於不通過累計」，客戶照收不設上限；處置修正共用同一條。情境目錄 16.14 已改寫，相關測試同步。

### D. 生產任務刪除（第 63 題）

1. 刪除生產任務入口開放給印務（工單負責人）、被分享（編輯）成員、印務主管（全公司）。`permissions.js` 的 `canEditProcess` 目前只放行印務，依製程規劃活動清單調整（只放行到活動清單列出的範圍，不多開）。
2. 刪除前提照 wiki 生產任務狀態卡：所屬工單在草稿或重新確認製程，且本任務未被任何生產任務設為前置（含同印件其他工單的任務）。`ProcessTab.js` 的 `handleRemove` 目前只檢查同工單前置，補跨工單。
3. 情境目錄目前沒有「刪除生產任務」情境：補一節（含被跨工單前置擋下的案例）與測試。

### E. 印務主管隨時可改目的站點與產線（第 64 題）

`permissions.js` 的 `canEditTaskDestination` 拿掉印務主管「核可後才可改」（PRE_APPROVAL_STATUSES）的限制。情境目錄 8.19、10.23 已改寫，對應測試同步：
- tests/unit/work-orders/rules-production-line.test.mjs
- tests/e2e/08-process-review-deliver/delivery-status.spec.mjs
- tests/unit/production-floor/transfer-destination-change.test.mjs
- tests/e2e/10-report-transfer/transfer-tickets.spec.mjs

## 三、不要做的事

- 品檢待驗清單開放生管與業務、出貨單操作只限業務與諮詢這兩個既有權限落差，屬權限修正 change，本包不動。
- 不模擬物流商串接。

## 四、測試

照第一包任務書：先 `npm run impact`，再跑 smoke 與受影響章（`--workers=1`）。本包動到權限與第 8、10、11、12 章，`npm run impact` 若判定影響全站，就跑全套 `npm test`。

## 五、交回內容

1. erp 改動檔清單（每檔一句話）。
2. 測試改動檔清單、新增的情境目錄節號與全文。
3. 跑過的測試與結果（通過數／失敗數）。
4. 禁用寫法 grep 結果（hex、px、!important、createGlobalStyle）。
5. 停下的地方與原因；Prototype 與 wiki 不一致之處。
