# 票 42 實測比對：前置準備

基底提交 `6e75fa07`（erp 分支 `prototype/production-stage`）。Prototype 目錄 `apps/erp/src/app/(prototype)/`，下表路徑都相對於它。

## 一、三個受測頁面

| 代號 | 瀏覽器路徑 | 走法 | 範圍內檔案與行數 |
|------|-----------|------|----------------|
| P1 | `/production-floor/transfers` | 切模擬角色「生管（許文傑）」後直接看列表，不用點分頁。廠務角色會被導到 `/transfers/mine`，所以用生管 | `production-floor/transfers/page.js` 1006 |
| P2 | `/orders/detail?id=ORD-2026-0710&tab=paymentPlan` | 切「業務（洪嘉駿）」，網址帶 `tab=paymentPlan` 直接進「金額與發票」分頁（分頁標籤文字為「金額與發票」），不用點。ORD-2026-0710 有收款項目、款項紀錄與發票各一筆以上 | `orders/_components/detail/billing/ReconciliationPanel.js` 237；`ReceivableCard.js` 124；`InstallmentSection.js` 322；`PaymentRecordSection.js` 290；`InvoiceSection.js` 392；`format.js` 25。合計 1390 |
| P3 | `/after-sales` | 切「業務（洪嘉駿）」直接看列表。mock 只有一張未結案售後單（AS-20261015-01），表內只看到「逾期」紅色標籤；調色盤色名出現在上方摘要卡（待填決議 gold、待結案 cyan） | `after-sales/page.js` 579 |

P2 的範圍說明：入口檔是 `orders/_components/detail/BillingTab.js`（146 行，在 billing 資料夾外，不計入範圍）。它匯入的六個非對話框元件即上表。以下檔案要點按鈕才會出現或只被對話框使用，已排除：`PaymentAllocationTable.js`（只被 `PaymentRecordModal.js` 匯入）、`InvoiceViewDrawer.js`、`IssueInvoiceModal.js`、各 `*Modal.js`、`invalidReason.js`、`mockAttachment.js`。
P2 的狀態標籤共用元件 `orders/_components/StatusTag.js`（20 行）不在範圍內，改它屬 `(prototype)/` 內共用元件。P3 同樣取用該元件與 `orders/mock-data.js` 的狀態表。

## 二、P3 挑選依據

條件：列表頁、狀態標籤顏色用調色盤色名（gold、cyan、geekblue、lime、purple、magenta、volcano）、檔案 300 至 1200 行、不在 `production-floor/`（P1）與 `orders/`（P2）。

計數方式：頁面檔內直接寫的 `color="..."`，加上頁面用到的 `*_STATUS_META`／`*_META` 表裡命中這七個色名的項目數（腳本 `/tmp/p3scan.py`，狀態標籤的顏色由 META 表提供，頁面檔本身多半不寫色名）。

| 候選頁 | 行數 | 命中數 | 備註 |
|--------|------|--------|------|
| `after-sales/page.js` | 579 | 5 | 摘要卡直接寫 gold、cyan 共 2；`NEXT_ACTION_META` gold、cyan 共 2；`TICKET_STATUS_META` gold 1 |
| `qc-shipping/shipments/page.js` | 397 | 4 | `SHIPMENT_STATUS_META` cyan、lime、purple、geekblue |
| `dispatch-orders/page.js` | 360 | 4 | `DISPATCH_STATUS_META`（`dispatch-orders/_lib/mock-data.js`）geekblue 2、purple、cyan。腳本因同名表先命中 `qc-shipping/_lib/mock-data.js` 而顯示 0，已用 `sed -n 10,30p` 讀原檔手算 |
| `work-orders/page.js` | 377 | 3 | `WORK_ORDER_STATUS_META` 2、`WORK_ORDER_TYPE_META` 1 |
| `work-orders/review-queue/page.js` | 398 | 1 | |
| `dispatch-orders/waybills/page.js`、`qc-shipping/inspection/page.js` | 609、864 | 0 | |

命中數最多是 `after-sales/page.js`（5）。第二名 `qc-shipping/shipments/page.js` 與 `dispatch-orders/page.js` 並列 4。
單檔直接搜 `"(gold|cyan|geekblue|lime|purple|magenta|volcano)"` 的結果：`orders/mock-data.js` 19、`qc-shipping/_lib/mock-data.js` 8、`work-orders/_lib/mock-data.js` 7，這些是 META 資料檔，不是列表頁，故未選。

## 三、工作樹

| 用途 | 路徑 | 分支 |
|------|------|------|
| 甲 | `/Users/b-f-03-029/erp/.claude/worktrees/ticket42-a` | `local/ticket42-a` |
| 乙 | `/Users/b-f-03-029/erp/.claude/worktrees/ticket42-b` | `local/ticket42-b` |
| 拍照用 | `/Users/b-f-03-029/erp/.claude/worktrees/ticket42-shots` | 分離 HEAD（`6e75fa07`），已裝相依套件 |

甲、乙沒有裝相依套件（只改檔、不跑）。拍照用工作樹的 `apps/erp/.env` 從主檢出複製（該檔被版控忽略）。

## 四、重拍指令

先切到要拍的版本，再跑腳本。腳本自己啟動並關閉 3142 埠的開發伺服器。

```
# 拍改前
git -C /Users/b-f-03-029/erp/.claude/worktrees/ticket42-shots checkout --detach 6e75fa07
node /tmp/workflow-rebuild-ticket42-trial-20261114/shoot.mjs base

# 拍甲改後（乙把 a 換成 b、標籤換成 b）
git -C /Users/b-f-03-029/erp/.claude/worktrees/ticket42-shots checkout --detach local/ticket42-a
node /tmp/workflow-rebuild-ticket42-trial-20261114/shoot.mjs a

# 確認伺服器已關
lsof -i :3142
```

輸出 `/tmp/workflow-rebuild-ticket42-trial-20261114/shots/<標籤>-P1.png`、`-P2.png`、`-P3.png`。同標籤會覆蓋。

腳本做的事：
1. 從 `ticket42-shots/apps/erp` 執行 `node_modules/.bin/next dev --port 3142`，最多等 120 秒。
2. 用 Sens `erp-prototype-tests/node_modules` 的 Playwright，視窗 1440 寬，整頁截圖。
3. 登入帳密讀 `/Users/b-f-03-029/Sens/erp-prototype-tests/.env.local`（不印出）。
4. 每頁先載入一次暖機（首次編譯路由），再正式載入，用該測試目錄 `_helpers.mjs` 的 `switchRole` 切角色，等網路閒置後拍。
5. 結束時關瀏覽器與伺服器。3142 埠若已有服務，腳本直接中止。

注意：角色與 mock 存在記憶體，切角色不能重新載入頁面，所以腳本是「載入、切角色、拍」的順序。

## 五、遇到的問題

| 項目 | 說明 |
|------|------|
| 登入 | erp 本機要登入才能開 prototype 頁。照 Sens 測試 README 的做法，帳密放 `.env.local`，腳本自己登入 |
| P3 資料偏少 | after-sales mock 只有一張未結案單，列表表格內看不到調色盤色標籤；用「業務主管（林雅婷）」試過，一樣只有這一張。調色盤色只在上方摘要卡看得到 |
| husky | 在拍照用工作樹跑 `pnpm install --frozen-lockfile`，`prepare` 會跑 husky。主檢出 `git config core.hooksPath` 回傳 `.husky/_`（設定檔 `.git/config`），不確定是這次寫入還是先前就有 |
| 相依套件 | 安裝用 3.6 秒，沿用 pnpm 全域快取。sharp、unrs-resolver 的建置腳本被略過，不影響開發伺服器 |
