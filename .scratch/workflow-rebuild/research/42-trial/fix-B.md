# 票 42 實測乙：依稽核結果改一輪

44 項發現改了 30 項，14 項未改。改動在 erp 工作樹 `ticket42-b` 的本機提交 `2fb7604c`（`local: 票 42 實測乙`），沒有推送。
動手前讀完 `.claude/skills/prototype-from-prompt/SKILL.md`。改法照它與 `Designs.md`：字級、字重、間距一律取 `theme` token，沒有新建元件，沒有動共用元件與 mock 資料。
下文路徑相對於 `apps/erp/src/app/(prototype)/`；P2 的檔案省略 `orders/_components/detail/billing/` 前綴。行號是改後的行號。

## 一、處置表

「暫定，待 PM 決定」標的是票上兩個未定點：業務狀態對顏色的對照表，與長提示要不要留一部分。

本次用的狀態顏色對照（暫定）：

| 原調色盤色 | 改成的語意色 | 用到的地方 |
|-----------|-------------|-----------|
| green（對齊） | success | B-18 |
| gold、orange（待處理、老化） | warning | B-18、B-19 |
| red（異常、逾期） | error | B-18、B-37 |

| 編號 | 處置 | 檔案與行號 | 改前 | 改後 |
|------|------|-----------|------|------|
| B-01 | 已改。暫定，待 PM 決定 | `production-floor/transfers/page.js:577-578` | 「我的轉交單只列負責廠務是你的單。開始搬運與抵達站點實際通道為 Slack 表單（通知帶著這張單、欄位預填、Slack 帳號對映到 ERP 廠務）；本頁的兩顆按鈕是系統端的補登入口，供 Slack 回報失敗或漏報時使用。」與生管版本（多「只對該單的負責廠務出現」） | 我的轉交單：「回報請用 Slack 表單，本頁按鈕只供補登。」所有轉交單：「搬運回報由負責廠務用 Slack 表單送出。」刪掉的原句：列表範圍說明、Slack 通知帶單、欄位預填、帳號對映、按鈕只對負責廠務出現 |
| B-02 | 已改 | `production-floor/transfers/page.js:582` | 「請輸入轉交單編號、印件項目名稱／編號、來源任務，或負責廠務」 | 「例如：TT-20261019-001」 |
| B-03 | 已改 | `production-floor/transfers/page.js:892` | 灰字「請選擇廠務」 | 拿掉灰字 |
| B-04 | 已改。暫定，待 PM 決定 | `production-floor/transfers/page.js:889` | 「待搬運的單可改負責廠務；改後系統通知新的負責廠務，改前與改後記入本單歷程。」 | 「改後系統會通知新的負責廠務。」刪掉的原句：「待搬運的單可改負責廠務」「改前與改後記入本單歷程」 |
| B-05 | 已改。暫定，待 PM 決定 | `production-floor/transfers/page.js:898` | 「建單時取自各條明細目的站點所屬的產線，改單不可改；之後任務改了目的站點，這張單也不跟著改。要改去處請作廢後從待轉交任務重新建單。」 | 「要改去處，請作廢後從待轉交任務重新建單。」刪掉的原句：目的產線的取值規則與不跟著改的規則 |
| B-06 | 已改。暫定，待 PM 決定 | `production-floor/transfers/page.js:970` | 「重開的新單沿用原單的目的產線與各條明細的目的站點，不可改。要改去處請改從待轉交任務建單，新單取來源任務當下的目的站點。」 | 「要改去處，請改從待轉交任務建單。」刪掉的原句：沿用規則與新單取值規則 |
| B-07 | 已改。暫定，待 PM 決定 | `production-floor/transfers/page.js:669` | 「來源任務已無效（…）：本單自動標警示、點收已擋下，處置由生管、印務或印務主管決定——實體貨已到目的地者作廢原單並依實況重建，貨還沒動者直接作廢。」 | 「來源任務已無效（…），點收已擋下。」刪掉的原句：「本單自動標警示」與整段處置流程 |
| B-08 | 已改 | `production-floor/transfers/page.js:707、721` | `marginBottom: 8` | `marginBottom: theme.spacing.xs` |
| B-09 | 未改。其他 | `production-floor/transfers/page.js:588、593、604、615、627、666` | | 4 與 20 不在 `Designs` §5 間距階層，要先決定對到哪一級；`gutter`、`gap` 只收數字，token 是帶 px 的字串；篩選欄 `marginTop: 4` 是全 Prototype 的共用寫法，單頁改會與其他頁不一致 |
| B-10 | 未改。其他 | `production-floor/transfers/page.js:711、738、844、924` | | 資料在記憶體，沒有非同步讀取。補載入與錯誤狀態要新增狀態變數，超出只改呈現 |
| B-11 | 已改 | `ReconciliationPanel.js:31、63、67、96、120` 等 | `<Text type="secondary" style={{ fontSize: 13 }}>` | `<Text type="secondary">`（回到基準 14px） |
| B-12 | 已改 | `ReconciliationPanel.js:123` | `fontSize: 22` | `fontSize: theme.typography.titleMd.fontSize`（20） |
| B-13 | 已改 | `ReconciliationPanel.js:124` | `fontWeight: 600` | `fontWeight: theme.typography.titleMd.fontWeight`（700） |
| B-14 | 已改 | `ReceivableCard.js:24` | `fontSize: 13` | 拿掉（14px） |
| B-15 | 已改 | `ReceivableCard.js:98-99` | `<Text strong style={{ fontSize: 18 }}>` | 取 `titleMd` 的字級與字重，與 B-12 同級 |
| B-16 | 已改 | `PaymentRecordSection.js:150、155` | 分配列與未分配列 `fontSize: 13` | 分配列回到 14px；未分配列 `theme.typography.bodySm.fontSize`（12） |
| B-17 | 已改 | 同 B-11 至 B-16 | 範圍檔案用 13、14、16、18、22 五級 | 12、14、16、20 四級 |
| B-18 | 已改。暫定，待 PM 決定 | `ReconciliationPanel.js:82` | `'green' : … 'gold' : 'red'` | `'success' : … 'warning' : 'error'` |
| B-19 | 已改。暫定，待 PM 決定 | `PaymentRecordSection.js:134` | `color="orange"` | `color="warning"` |
| B-20 | 未改。超出範圍 | `orders/mock-data.js` 六張 META 表 | | 顏色來自範圍外的對照表 |
| B-21 | 已改 | `InstallmentSection.js:229` | 「開立發票：帶入這一期的發票草稿，可再儲存草稿或開立」／「開立發票：可先儲存草稿，或直接開立」 | 提示只寫按鈕的動作名稱「開立發票」；連帶刪掉只供提示用的匯入 `draftInvoiceOf` |
| B-22 | 未改。需要 PM 決定 | `InvoiceSection.js:266-270、288` | | 停用原因是使用者唯一能知道為何不能作廢、不能開折讓的地方。依字面拿掉，按鈕停用時沒有任何說明 |
| B-23 | 未改。需要 PM 決定 | `InstallmentSection.js:238` | | 同 B-22；原因文字在範圍外的 `_lib/billing-rules.js` |
| B-24 | 已改 | `InstallmentSection.js:261` | 「規劃本訂單何時收款、何時開立發票；發票從該列的開立發票圖示開立（不離開此頁）。」 | 「發票從該列的「開立發票」圖示開立。」 |
| B-25 | 已改 | `InvoiceSection.js:334` | 「尚無發票紀錄。發票從上方收款項目該期的「開立發票」開立。」 | 「尚無發票紀錄」 |
| B-26 | 已改 | `PaymentRecordSection.js:222` | 區塊說明「業務記錄客戶實際入帳的收款，或退還客戶的退款。」 | 拿掉說明 |
| B-27 | 已改 | `ReconciliationPanel.js:168` | 「訂單編號 ORD-2026-0710 · 帳務公司 感官」 | 「帳務公司 感官」 |
| B-28 | 已改 | `PaymentRecordSection.js:175` | 退款列付款方式欄「銀行轉帳」旁加金色「退款」標籤 | 只顯示付款方式；退款仍由款項類型標籤、紅字負號金額、淡黃底表達 |
| B-29 | 已改 | `InstallmentSection.js:97` | `<span style={{ opacity: 0.5 }}>` | `<Typography.Text disabled>`（停用文字色） |
| B-30 | 未改。其他 | `PaymentRecordSection.js:39-41` | | 整列淡化包含標籤；換成文字色後標籤不會跟著淡化，改變「整列已取消」的呈現 |
| B-31 | 未改。需要 PM 決定 | `ReconciliationPanel.js`、`ReceivableCard.js`、`InstallmentSection.js` 的「（含稅）」 | | 「含稅」是金額口徑，屬欄位名稱；欄位維持原樣 |
| B-32 | 已改 | `ReconciliationPanel.js:99、125`；`ReceivableCard.js:24` | `marginRight: 8`、`margin: '8px 0 12px'`、`marginBottom: 8` | `theme.spacing.xs`、`` `${theme.spacing.xs} 0 ${theme.spacing.sm}` ``、`theme.spacing.xs` |
| B-33 | 未改。其他 | 同 B-33 稽核所列各行 | | 理由同 B-09 |
| B-34 | 未改。其他 | 同 B-34 稽核所列各表格 | | 理由同 B-10 |
| B-35 | 已改 | `after-sales/page.js:283、403` | `fontSize: 12` | `fontSize: theme.typography.bodySm.fontSize` |
| B-36 | 已改 | `after-sales/page.js:417` | 「請輸入售後單號、訂單編號、案名或客戶名稱」 | 「例如：AS-20261015-01」 |
| B-37 | 已改。暫定，待 PM 決定 | `after-sales/page.js:327` | `color="red"` | `color="error"` |
| B-38 | 未改。規則互相牴觸 | `after-sales/page.js:501、508、515` | | 顏色 3 前半要求改語意色，後半要求同一狀態全頁同色。同頁表格「下一步動作」欄的同名標籤由範圍外 META 表給 red、gold、cyan；只改摘要卡會讓同一狀態兩種顏色 |
| B-39 | 未改。超出範圍 | `orders/mock-data.js` 兩張 META 表 | | 顏色來自範圍外的對照表 |
| B-40 | 已改。暫定，待 PM 決定 | `after-sales/page.js:404` | 「售後服務單自訂單詳情頁的「售後服務」Tab 建立；訂單完成或取消後才建得出來」 | 「售後服務單從訂單詳情頁的「售後服務」分頁建立」。刪掉的原句：「訂單完成或取消後才建得出來」 |
| B-41 | 未改。需要 PM 決定 | `after-sales/page.js:326-327` | | 拿掉狀態欄的「（逾期）」會改變狀態欄顯示的資訊；要在哪一欄表達逾期由 PM 決定 |
| B-42 | 已改 | `after-sales/page.js:578-579` | `<Typography.Title level={3}>`（24px、字重 600） | `Typography.Text` 取 `titleMd` 的字級與字重（20、700），與 P2 摘要數字同級 |
| B-43 | 未改。其他 | 同 B-43 稽核所列各行 | | 理由同 B-09 |
| B-44 | 未改。其他 | `after-sales/page.js:523` | | 理由同 B-10 |

處置統計：

| 處置 | 項數 | 編號 |
|------|------|------|
| 已改 | 30 | B-01 至 B-08、B-11 至 B-19、B-21、B-24 至 B-29、B-32、B-35 至 B-37、B-40、B-42 |
| 其中暫定，待 PM 決定 | 9 | B-01、B-04 至 B-07、B-18、B-19、B-37、B-40 |
| 未改：超出範圍 | 2 | B-20、B-39 |
| 未改：需要 PM 決定 | 4 | B-22、B-23、B-31、B-41 |
| 未改：規則互相牴觸 | 1 | B-38 |
| 未改：其他 | 7 | B-09、B-10、B-30、B-33、B-34、B-43、B-44 |

## 二、機械檢查改前與改後

改前 `check-B-base.txt`（115 行），改後 `check-B-after.txt`（68 行）。

| 檢查項 | 改前 | 改後 | 改後剩下的是什麼 |
|--------|------|------|----------------|
| C01 手寫字級 | 14 | 0 | |
| C02 手寫字重 | 1 | 0 | |
| C03 手寫色碼 | 0 | 0 | |
| C04 狀態標籤用調色盤色名 | 11 | 5 | 款項類型標籤 2 筆（誤命中）；P3 摘要卡 3 筆（B-38 未改） |
| C05 狀態標籤用調色盤色名（來源 META 表） | 19 | 19 | 範圍外 META 表（B-20、B-39 未改） |
| C06 提示泡泡或欄位說明超過 20 字 | 9 | 2 | P1 我的轉交單提示框 21 字（含句號）；`InvoiceSection.js:267` 停用原因（B-22 未改） |
| C07 輸入框灰字為請輸入或請選擇加欄位名 | 3 | 0 | |
| C08 圖示按鈕提示超出動作名稱 | 5 | 3 | 發票停用原因（B-22 未改） |
| C09 長畫面文字超過 30 字 | 8 | 0 | |
| C10 手寫間距 px | 33 | 27 | B-09、B-33、B-43 未改的部分 |
| C11 emoji | 0 | 0 | |
| 合計 | 103 | 55 | |

P1 我的轉交單提示框改後 21 字。C06 的 20 字門檻是給提示泡泡與欄位說明的，提示框沿用同一門檻是本腳本的選擇；這筆保留，不再刪字。

## 三、`git diff --stat 6e75fa07`

```
 apps/erp/src/app/(prototype)/after-sales/page.js   | 23 ++++++++----
 .../detail/billing/InstallmentSection.js           | 20 +++--------
 .../_components/detail/billing/InvoiceSection.js   |  4 +--
 .../detail/billing/PaymentRecordSection.js         | 25 ++++---------
 .../_components/detail/billing/ReceivableCard.js   |  9 +++--
 .../detail/billing/ReconciliationPanel.js          | 41 ++++++++++------------
 .../(prototype)/production-floor/transfers/page.js | 38 ++++++--------------
 7 files changed, 64 insertions(+), 96 deletions(-)
```

`format.js` 沒有發現，沒有改。七個檔都在 `prep.md` 範圍內。

## 四、沒有驗證的事

| 項目 | 狀態 |
|------|------|
| 畫面實際長相 | 沒有啟動開發伺服器，沒有拍改後截圖 |
| 測試 | 沒有跑 |
| 程式語法與格式 | 用拍照用工作樹的 Prettier 檢查七個檔，全部通過；P1 的換行由 Prettier 重排 |
| ESLint | 沒有跑；移除 `draftInvoiceOf` 後人工確認沒有留下未使用的匯入 |
