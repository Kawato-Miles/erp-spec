I couldn't write the report file. The tool blocked writing report files from a sub-agent, so the file `/private/tmp/claude-501/-Users-b-f-03-029-Sens/0069649d-bdb4-4720-b3ee-54da9de276e2/scratchpad/report-payment.md` does not exist yet. The full report is below. The main conversation needs to write it to that path.

**Totals:** 24 differences (function change 5, rename 1, new 12, removal 0, writing 6). Items needing Miles's decision: 4.

---

# 款項與發票（對帳作業）手冊 vs Prototype 比對報告（2026-09-23）

比對基準：手冊 JSON `unit-payment.json`（12 頁，2026-09-08 版）對 erp repo 分支 prototype/production-stage 現況。

結論：
- 09-08 之後，款項相關程式只改了無值符號（commit d7fe523a）與一處改名（ae6070fd）。這兩筆都沒動本單元介面。
- 多數差異是手冊寫錯或漏寫，不是 prototype 改版。
- 最大一筆是角色歸屬。手冊把開立發票、登記收款寫成會計的工作。wiki 角色卡寫明會計沒有這些權限（見三之 1）。

路徑簡寫：`billing/` ＝ `apps/erp/src/app/(prototype)/orders/_components/detail/billing/`；`payment/` ＝ `apps/erp/src/app/(prototype)/payment/`；`orders/` ＝ `apps/erp/src/app/(prototype)/orders/`。

## 一、差異清單

| 頁 id | 段 | 手冊現況（簡述） | Prototype 現況（逐字） | 證據（檔:行） | 建議修正（一句） | 類別 |
|---|---|---|---|---|---|---|
| m-overview | roles、how.stages、what、單元 duty | 會計「逐期開立發票、登記款項紀錄…會計是這個頁籤最主要的操作者」；狀態表六列負責角色全寫會計；款項紀錄寫「會計記錄客戶實際入帳的收款」 | 款項紀錄區塊說明「業務記錄客戶實際入帳的收款，或退還客戶的退款。」；介面不依角色擋操作 | `billing/PaymentRecordSection.js:212`；`billing/InstallmentSection.js:190`；`billing/InvoiceSection.js:155`；wiki [[會計]] § 主要職責第 4 條「無發票操作權」；wiki [[業務]] § 職務範圍 | 待三之 1 定案後改寫角色與負責角色欄 | 功能改變 |
| m-plan-installment、m-cancel-installment、m-issue-invoice、m-issue-invoice-b2c、m-record-payment、m-allowance、m-void-invoice、m-pending-invoice-list | actor、story、before | 寫「你是會計」「會計在收款項目列點開立發票」「會計…逐筆進去開立發票」 | 同上；發票空表文字寫「由業務自由填入買受人…」 | `billing/InvoiceSection.js:307`；wiki [[會計]] § 職務範圍「看得到但不能動：訂單帳務資料、付款紀錄、發票與折讓」；wiki [[諮詢]] § 主要職責第 5 條 | 待三之 1 定案後改 actor、情境主角與 before 身分 | 功能改變 |
| m-overview | what（應收金額卡） | 「分項含商品、運費、額外費用、折抵、訂單異動」 | 明細八列：「商品」「運費」「諮詢費」「急件費」「其他費用」「折抵」「紅利」「訂單異動」 | `billing/ReceivableCard.js:44-57` | 分項改列畫面上的八個名稱 | 改名 |
| m-overview | what（三方對帳面板） | 只寫對帳通過或待對帳，以及後兩張算差額 | 標題「對帳通過（差額 = 0）」「待對帳」，下方帶訂單編號與帳務公司；差額標籤「對齊」「待收款」「應退差額（退款待執行）」「待開發票」「待折讓（已開票過多）」；收款卡另有「處理中（含稅，合計不計入）」列 | `billing/ReconciliationPanel.js:52,131-132,164-173,176-177,194-195` | 補差額標籤的意思，並說明處理中列不計入合計 | 新增 |
| m-check-amount | steps 第 2 步說明、check 第 1、2 點 | 「應收總額等於小計加營業稅」「明細各分項未稅加總等於小計（未稅）」 | 「小計（未稅）」「營業稅 5%」取訂單原始金額；「= 應收總額（含稅）」含已認列訂單異動；明細含「訂單異動」列 | `billing/ReceivableCard.js:56,86-94`；`orders/_lib/order-amounts.js:52-59,75-76` | 有已認列訂單異動時兩個等式都不成立。可能一：手冊補「沒有訂單異動時」。可能二：prototype 缺陷（見三之 2） | 新增 |
| m-plan-installment | notes 第 4 題 | 「異動次數」記錄這期被改過幾次 | 只在預計開立日期或預計收款日期改變時加 1；改金額或描述不加 | `orders/_lib/store.js:2113-2128`；wiki [[帳務]] § 收款項目「變更次數＝收款日＋開發票日累計變更次數」 | 答句改為：改「預計收款日」或「預計開立發票日」才加 1 | 功能改變 |
| m-plan-installment | entries 第 2 列 | 「同一塊表格，點要改的那一列」 | 操作欄圖示提示「編輯」；對話框標題「編輯收款項目：{描述}」；確認鈕「儲存變更」 | `billing/InstallmentSection.js:205-210`；`billing/InstallmentModal.js:53,57` | 改為「在該列點「編輯」」 | 寫法 |
| m-cancel-installment | steps 第 2 步說明 | 「取消原因最多 60 字。」 | 取消原因欄上限 60 字 | `billing/CancelInstallmentModal.js:47` | 刪步驟說明，字數只留 fields 表（寫法規則 § 四第 10 條） | 寫法 |
| m-issue-invoice、m-issue-invoice-b2c | before | 只列發票狀態「未開立」或「已作廢」 | 訂單為「訂單完成」「已取消」時操作欄不顯示；已取消期次也不顯示操作 | `billing/InstallmentSection.js:190,197`；`orders/_lib/permissions.js:16,20` | 補「訂單狀態非終態（訂單完成、已取消）」「該期未取消」 | 新增 |
| m-issue-invoice、m-issue-invoice-b2c | fields | 品項明細只寫欄名；沒有來源期次；B2B 頁沒有載具三欄 | 頂端唯讀「來源收款期次：{描述}（含稅 NT$ …）」；「商品名稱」上限 30 字、預帶該期描述；「數量」1 至 99999；「單位」11 選項、預帶「式」；單價限整數；「小計（未稅）」或「小計（含稅）」唯讀；「備註」預帶該期描述；B2B 時「載具類別」「載具編號」「捐贈碼」停用 | `billing/IssueInvoiceModal.js:94-96,140-141,164,255-259,382,392,402,412,416` | fields 表補齊上列項目與限制 | 新增 |
| m-issue-invoice、m-issue-invoice-b2c、m-record-payment、m-void-invoice | steps 結果句 | 「該期的發票狀態轉「已開立」」「該期付款狀態轉「已收訖」」「該期的發票狀態同步轉「已作廢」」 | 這兩個狀態屬於收款項目的「付款狀態」「發票狀態」欄 | `billing/InstallmentSection.js:108-123` | 改寫實體全名，例如「收款項目發票狀態轉「已開立」」（§ 四第 2 條） | 寫法 |
| m-record-payment | notes 第 3 題 | 作廢後「紀錄留著」 | 作廢後該列預設隱藏；勾「顯示已取消」才出現，並標「已取消」 | `billing/PaymentRecordSection.js:55,104,215-217` | 答句補「勾「顯示已取消」可再看到」 | 新增 |
| m-record-payment | notes | 沒講「處理中」 | 只有「已完成」且未作廢的款項計入已收金額、付款狀態與收款淨額；處理中的金額另列在「處理中（含稅，合計不計入）」 | `orders/_lib/store.js:2776-2779,2812-2827`；`billing/ReconciliationPanel.js:164-173` | 補一題：選「處理中」時付款狀態不變，入帳後點「編輯」改「已完成」 | 新增 |
| m-invoice-view | entries | 只列「發票」表的「檢視」「下載」 | 「收款項目」表「發票資料」欄的發票號碼可點，開同一張檢視側板 | `billing/InstallmentSection.js:145-161`；`BillingTab.js:45-49,86-91` | 入口表補第二列 | 新增 |
| m-invoice-view | check 第 1、3 點 | 發票資訊列號碼、時間、種類、狀態、三個金額；詳細資訊列品項明細 | 發票資訊另有「備註」，作廢時加「作廢原因」；詳細資訊另有「課稅別」「稅率」「載具類別」「載具編號」；捐贈碼有值才顯示 | `billing/InvoiceViewDrawer.js:27-43,54-73` | 預期結果補列這些欄 | 新增 |
| m-allowance | fields | 只列折讓金額、折讓原因 | 上方唯讀「發票號碼」「金額（含稅）」「剩餘可折讓（含稅）」 | `billing/CreateAllowanceModal.js:50-58` | fields 表補三列唯讀欄 | 新增 |
| m-allowance | notes 第 3 題 | 「點折讓列「作廢折讓」，填「作廢原因」後確認」 | 對話框「作廢折讓」；確認鈕「確認作廢」；提示「ezPay 限制：含中文最多 6 字、純英數最多 20 字」 | `billing/VoidAllowanceModal.js:32,42,64-71`；`billing/invalidReason.js:7` | 答句改寫「確認作廢」，並說明字數限制同作廢發票 | 寫法 |
| m-allowance、m-void-invoice | before | 沒寫訂單狀態條件 | 訂單「已取消」時兩鈕停用；「訂單完成」後仍可開立折讓、作廢發票 | `billing/InvoiceSection.js:154-155,258,279` | 補「訂單狀態不是「已取消」」 | 新增 |
| m-void-invoice | steps 第 2 步說明 | 「作廢原因含中文最多 6 字，純英數最多 20 字。」 | 同左 | `billing/invalidReason.js:7-19` | 刪步驟說明，字數只留 fields 表（§ 四第 10 條） | 寫法 |
| m-receivable-list | check 第 2 點、notes 第 1 題 | 「只列出已開立過發票、且待收大於零的訂單」 | 條件是目前有一張狀態「開立」的發票；發票全部作廢就移出清單 | `payment/_lib/derive.js:35-37,46-52` | 「已開立過發票」改為「有一張狀態「開立」的發票」 | 功能改變 |
| m-receivable-list、m-pending-invoice-list | check、notes | 「收足就移出清單」等清單會變動的描述 | 兩張清單讀固定種子資料，不讀訂單即時資料；在詳情登記收款或開立發票後，清單不會變 | `payment/_lib/mock-data.js:11-26`；`payment/receivable/page.js:10-11,22`；`payment/pending-invoice/page.js:10-11,26-29` | 可能一：prototype 缺陷。可能二：手冊不動（見三之 3） | 功能改變 |
| m-receivable-list | notes | 沒講可見範圍 | 應收款項清單不依角色篩選，業務也看全公司；待開發票才分角色 | `payment/receivable/page.js:14-15`；`payment/_lib/derive.js:39-44` | 補一題講可見範圍，避免與待開發票頁的答句混淆 | 新增 |
| m-pending-invoice-list | check、notes | 沒寫排除條件、期別格式、排序 | 已取消訂單不列入；「期別」顯示「第 N 期」；依預計開發票日由近到遠排，沒填日期的排最後 | `payment/_lib/derive.js:71,84,91-96` | 常見問題補「已取消訂單不列入」，預期結果補排序 | 新增 |
| m-plan-installment、m-issue-invoice、m-issue-invoice-b2c、m-void-invoice、m-receivable-list、m-pending-invoice-list | story | 情境句 31 到 39 字（最長 39 字：「這一加，應收總額從 16,800 變成 17,325…」） | 不適用 | 寫法規則 § 四第 7 條 | 拆句 | 寫法 |

## 二、手冊未涵蓋的新功能

| 功能 | 入口 | 證據 | 建議 |
|---|---|---|---|
| 編輯款項紀錄：款項類型鎖定，其餘欄位（狀態、方式、金額、核銷分配、完成日、序號、備註）可改 | 「款項紀錄」該列「編輯」→「編輯款項紀錄」→「儲存變更」 | `billing/PaymentRecordSection.js:181-186`；`billing/PaymentRecordModal.js:90,94,108` | 併入 m-record-payment，用常見問題講「處理中改已完成」與「改分配」。m-plan-installment 第 1 題已叫操作者去「款項紀錄」調分配，目前沒有頁教這件事 |

## 三、需 Miles 決定

1. **款項與發票的操作角色**（影響九頁）。這一項決定手冊每頁寫誰操作。

   | 來源 | 寫法 |
   |---|---|
   | 手冊 | 會計開立發票、登記收款、開折讓、作廢；業務只核對與規劃 |
   | wiki [[會計]] | 會計「無發票操作權」；付款紀錄「看得到但不能動」；主要工作是月結對帳與追款提醒 |
   | wiki [[業務]]、[[諮詢]] | 規劃收款項目、開立發票與折讓、登記收款；兩者同權 |
   | prototype | 不依角色擋操作；款項紀錄說明寫「業務記錄…」 |

   - 選項 A：依 wiki 改手冊。操作頁 actor 改業務、諮詢。會計只留核對金額、檢視發票、兩張查帳清單。
   - 選項 B：手冊不動，改 wiki 角色卡。
   - 建議選 A。wiki 是角色權責正本，prototype 文案也已寫業務。
   - 另需決定：prototype 要不要依角色隱藏按鈕。

2. **應收金額卡的等式。** 有已認列訂單異動時，「小計（未稅）」＋「營業稅 5%」不等於「= 應收總額（含稅）」。
   - 選項 A：修 prototype，讓摘要四欄用同一口徑。
   - 選項 B：手冊加前提「沒有訂單異動時」。

3. **兩張查帳清單不隨操作更新。** 清單讀固定種子資料。手冊試用時，操作者會看到清單沒變。
   - 選項 A：修 prototype，改讀訂單即時資料。
   - 選項 B：維持現狀。

4. **prototype 與 wiki 落差。** 手冊目前照 prototype 寫。定案後可能要回改手冊。

   | 項目 | prototype | wiki |
   |---|---|---|
   | 發票品項單價 | 限整數（`billing/IssueInvoiceModal.js:412`） | 最多兩位小數（[[帳務]] § 發票品項） |
   | 款項切「已完成」 | 只要填完成日（`billing/PaymentRecordModal.js:157`） | 需掛對帳附件並完成核銷分配（[[款項狀態]]） |
   | 單期核銷上限 | 只擋合計超過款項金額（`billing/PaymentAllocationTable.js:62`） | 單期分配不得超過該期預計金額（[[收款項目狀態]]） |
   | 訂單付款狀態值域 | 三值（`orders/mock-data.js:76-80`） | 多一個「已退款」（[[訂單]] § 付款狀態） |
   | 作廢發票期限 | 不檢查 | 限申報期限內（[[發票狀態]]） |
   | 帳務公司顯示 | 訂單頁顯示「SSP」「BRO」（`billing/ReconciliationPanel.js:132`、`orders/_components/detail/InfoTab.js:65`）；需求單顯示「感官SSP」「柏樂BRO」；出貨對照表 BRO＝理想印製（`qc-shipping/_lib/mock-data.js:46`） | 感官或柏樂（[[需求單]] § 帳務公司） |

## 四、比對範圍說明

讀過的 prototype 檔案：
- 訂單頁：`orders/detail/page.js`、`orders/page.js`、`orders/_lib/permissions.js`
- 金額與發票頁籤：`BillingTab.js` 與 `billing/` 下全部 17 檔
- 資料與計算：`orders/_lib/store.js`（2034-2320、2776-2848 行）、`orders/_lib/order-amounts.js`、`orders/mock-data.js`
- 查帳清單：`payment/receivable/page.js`、`payment/pending-invoice/page.js`、`payment/_lib/derive.js`、`payment/_lib/mock-data.js`
- 選單與角色：`(prototype)/layout.js`、`_lib/sessionStore.js`
- 資料主鏈：`MOCK-DATA-CHAIN.md` 款項段
- 全 `(prototype)/` 關鍵字搜尋：開立發票、收款項目、款項紀錄、paymentPlan、柏樂、感官、account_company

讀過的 wiki 卡：帳務、訂單、需求單、收款項目狀態、發票狀態、款項狀態、折讓單狀態、會計、業務、諮詢、業務主管。

已查證、無差異的線索：

| 線索 | 查證結果 |
|---|---|
| 三組狀態名依 wiki | 一致（`orders/mock-data.js:151-170`） |
| 開立發票移除無來源期次分支 | 已移除，手冊也沒寫（`billing/IssueInvoiceModal.js:254-260`） |
| 清單跳轉 tab=paymentPlan | 兩張清單都正確（`payment/receivable/page.js:32`、`payment/pending-invoice/page.js:39`） |
| 發票未稅反推、零頭落稅額 | 手冊算例正確：11,760→11,200／560；3,150→3,000／150（`billing/IssueInvoiceModal.js:29,53-83`） |
| 帳務公司兩值 | 本單元手冊沒寫帳務公司值；顯示不一致列在三之 4 |

順帶發現（prototype 文案問題，不是手冊問題）：
- 發票表空白時顯示：「點「開立發票」由業務自由填入買受人、金額、品名與數量」。
- 發票區沒有這顆鈕，金額也不能自由填（`billing/InvoiceSection.js:307`）。