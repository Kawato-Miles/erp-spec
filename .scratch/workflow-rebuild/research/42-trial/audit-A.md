# 票 42 實測甲：Impeccable 稽核結果（第一步）

受測：P1 所有轉交單、P2 訂單「金額與發票」分頁、P3 我的售後服務。基底 erp 提交 `6e75fa07`。
稽核方法：Impeccable `SKILL.src.md` 的 `audit` 指令（`reference/audit.md`），表面模式判為 Operate。
路徑都相對於 `apps/erp/src/app/(prototype)/`。行號是基底版本的行號。

## 一、發現表

嚴重度照 `audit.md` 的定義：P0 擋住任務、P1 明顯困難或違反 WCAG AA、P2 有替代做法的困擾、P3 修飾。

| 編號 | 頁 | 檔案與行號 | 類別 | 問題描述（使用者會看到什麼） | 依據（Impeccable 檔名與原文句） | 嚴重度 | 建議改法 |
|------|----|-----------|------|---------------------------|-------------------------------|--------|---------|
| A-01 | P1 | `production-floor/transfers/page.js` 589–631 | 無障礙 | 篩選區四個下拉與日期區間的標題是另一段文字，沒有綁到欄位。螢幕閱讀器只念出灰字「全部狀態」，不念「狀態」 | `audit.md`：「Inputs without labels, poor error messaging, missing required indicators」 | P2 | 每個下拉與日期區間加上與標題同字的無障礙名稱（`aria-label`）。指令：`harden` |
| A-02 | P1 | `production-floor/transfers/page.js` 573–579 | 提示文字 | 生管看到兩行說明，內容是 Slack 表單通道與「補登入口」，但那兩顆按鈕只對負責廠務出現，生管看不到。說明用了「Slack 帳號對映到 ERP 廠務」這類系統內部用語 | `operate.md`：「The tool should disappear into the task.」 | P2 | 依角色縮短，生管只看與自己有關的一句。指令：`clarify` |
| A-03 | P1 | `production-floor/transfers/page.js` 585 | 其他 | 篩選區的「刷新」按鈕點了沒有任何反應 | `audit.md`：「Look for repeated implementation shortcuts, design-system drift, misleading or decorative content, and structure that is interchangeable with an unrelated product.」 | P2 | 讓刷新有可見結果（例：回第一頁並提示已更新），或拿掉。指令：`harden` |
| A-04 | P1 | `production-floor/transfers/page.js` 667–673 | 狀態 | 側板的「來源任務已無效」警示是一段紅色內文，不是提示框。與本頁上方的提示框長相不同，紅字段落也比提示框難掃讀 | `operate.md`：「State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success, info. Standardize these.」 | P2 | 改用共用提示框 `StyledAlert`（警示樣式），文字不變。指令：`harden` |
| A-05 | P1 | `production-floor/transfers/page.js` 666、709、723 | 版型與組合 | 側板區塊間距 20px 不在專案間距級距內（16、24）；「明細」「歷程」小標題下方間距寫死 8px | `craft-floor.md`：「tight groups, generous separation, more space above a heading than below it. Read the computed values.」；`audit.md`：「Using wrong tokens, mixing token types」 | P3 | 區塊間距改用 `theme.spacing.lg`，小標題下方改用 `theme.spacing.xs`。指令：`layout` |
| A-06 | P1 | `production-floor/transfers/page.js` 428–432、842–843 | 提示文字 | 列上的按鈕叫「編輯」，點開的對話框標題卻是「修改轉交單（待搬運）」，確認鈕是「儲存修改」。同一個操作有兩個名字 | `operate.md`：「Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong.」 | P3 | 對話框標題與確認鈕改用「編輯」。指令：`clarify` |
| A-07 | P1 | `production-floor/transfers/page.js` 866–867、957–958 | 提示文字 | 編輯與重開對話框的欄名是「數量」，側板與點收佇列同一個值叫「搬運數量」 | `operate.md`：「Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong.」 | P3 | 欄名改為「搬運數量」。指令：`clarify` |
| A-08 | P1 | `production-floor/transfers/page.js` 872–883、963–974 | 無障礙 | 編輯與重開對話框表格裡的數字輸入框沒有名稱。螢幕閱讀器只念「編輯數字」，不知道是哪一條明細的數量 | `audit.md`：「Inputs without labels, poor error messaging, missing required indicators」 | P2 | 輸入框加無障礙名稱：「<生產任務名> 搬運數量」。指令：`harden` |
| A-09 | P1 | `production-floor/transfers/page.js` 732–780 | 提示文字 | 「回報抵達站點」對話框沒說每條明細至少要一張簽收照片。使用者送出被擋，才從錯誤訊息知道規則 | `audit.md`：「Inputs without labels, poor error messaging, missing required indicators」 | P2 | 表格上方加一句說明「每條明細至少上傳一張簽收照片」。規則出處：同檔 239 行註解。指令：`harden` |
| A-10 | P1 | `production-floor/transfers/page.js` 444；`billing/InstallmentSection.js` 253；`billing/PaymentRecordSection.js` 221；`billing/InvoiceSection.js` 131、307 | 其他 | 「作廢」類按鈕的圖示在轉交單是禁止符號（block），在帳務區是圓圈叉（cancel）。跨頁同類操作圖示不一致 | `operate.md`：「Consistent affordances across the surface. Same button shape. Same form-control vocabulary. Same icon style.」 | P3 | 定一個作廢圖示，全站統一。指令：`polish` |
| A-11 | P1 | `production-floor/transfers/page.js` 582、594、605、616、626 | 提示文字 | 搜尋框與下拉的灰字（例「全部狀態」「開始日期」）很淡。灰字顏色 `#babcbf` 在白底的對比約 1.9:1 | `craft-floor.md`：「body and placeholder text ≥4.5:1, large text ≥3:1.」；`audit.md`：「Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)」 | P1 | 把輸入框灰字顏色調到對比 4.5:1 以上。指令：`harden` |
| A-12 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 31、38、66、72、77、103、129 | 字級 | 三方對帳卡的標題、明細列、差額列都寫死 13px，不在專案字級（12、14）內 | `audit.md`：「Using wrong tokens, mixing token types」；`craft-floor.md`：「obvious scale and weight steps」 | P2 | 改用 `theme.typography.bodySm`。指令：`typeset` |
| A-13 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 132 | 字重 | 三張對帳卡的主數字寫死 22px、字重 600。22 不在字級內；專案只載入 400、500、700 三種字重，600 由瀏覽器就近替代 | `craft-floor.md`：「obvious scale and weight steps」；`audit.md`：「Using wrong tokens, mixing token types」 | P2 | 改用 `theme.typography.titleMd`（20／700），上下邊距改用間距級距。指令：`typeset` |
| A-14 | P2 | `orders/_components/detail/billing/ReceivableCard.js` 24、96 | 字級 | 應收金額卡的欄名寫死 13px；應收總額寫死 18px。同一個應收總額在上方對帳卡是 22px，兩處大小不同 | `audit.md`：「Using wrong tokens, mixing token types」 | P3 | 欄名改 `bodySm`；應收總額改與對帳卡主數字同級（`titleMd`）。指令：`typeset` |
| A-15 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 149、154 | 字級 | 核銷分配欄寫死 13px | `audit.md`：「Using wrong tokens, mixing token types」 | P3 | 改用 `bodySm`。指令：`typeset` |
| A-16 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 36–41；`billing/InvoiceSection.js` 63、239 | 顏色 | 對帳卡的負數（已完成退款、已確認折讓）同時設了紅色類型與深灰色，實際顯示深灰；發票區的折讓負數顯示紅色。同一種負數金額兩處顏色不同 | `operate.md`：「Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong.」 | P3 | 定一種負數金額顏色，兩處一致。指令：`polish` |
| A-17 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 168–173 | 提示文字 | 黃色「待對帳」提示框的說明只重複訂單編號與帳務公司，沒說哪裡沒對上、差多少 | `craft-floor.md`：「Controls name their action; errors name the problem and the recovery.」 | P2 | 說明改寫成差在哪裡（待收款、待開發票金額）。指令：`clarify` |
| A-18 | P2 | `orders/_components/detail/billing/InstallmentSection.js` 101；`billing/PaymentRecordSection.js` 38–40 | 無障礙 | 已取消的收款項目與款項紀錄用半透明淡化。文字對比約 3.2:1，低於 4.5:1 | `audit.md`：「Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)」 | P1 | 改用次要文字色（對比約 5.9:1）表達淡化，不用半透明。指令：`harden` |
| A-19 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 169 | 其他 | 退款金額自己組字串（`-NT$` 加千分位），沒走帳務區共用的金額格式。小數位規則與其他金額欄可能不同 | `audit.md`：「Look for repeated implementation shortcuts, design-system drift, misleading or decorative content, and structure that is interchangeable with an unrelated product.」 | P3 | 改用同資料夾 `format.js` 的負數格式。指令：`polish` |
| A-20 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 35–37、109–112、168–169、178–186 | 顏色 | 一筆退款同時用四種方式標示：款項類型紅色標籤、付款方式欄再一個金色「退款」標籤、整列淡黃底、紅色金額 | `operate.md`：「Accent color used for primary actions, current selection, and state indicators only, not decoration.」 | P3 | 保留一到兩種標示，拿掉重複的付款方式欄標籤。指令：`quieter` |
| A-21 | P2 | `orders/_components/detail/billing/InstallmentSection.js` 247–260；`billing/InvoiceSection.js` 114–139、287–315 | 無障礙 | 停用的按鈕（取消收款項目、作廢發票、開立折讓單、回簽檔、作廢折讓）只在滑鼠移上去時顯示原因。鍵盤使用者跳不到停用按鈕，看不到原因。回簽檔與作廢折讓在訂單已取消時停用，提示只寫按鈕名稱，沒寫原因 | `audit.md`：「Missing focus indicators, illogical tab order, keyboard traps」；`audit.md`：「Interactive elements without proper roles, labels, or states」 | P2 | 停用時讓外層可用鍵盤聚焦、聚焦時顯示提示；提示補上停用原因。指令：`harden` |
| A-22 | P2 | `orders/_components/detail/billing/InvoiceSection.js` 154 | 狀態 | 每張發票都可展開。沒有折讓時，子表只寫「沒有資料」，沒說這裡放的是折讓單 | `operate.md`：「Empty states that teach the interface, not "nothing here."」 | P3 | 改成「尚無折讓單」。指令：`clarify` |
| A-23 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 89、111；`billing/PaymentRecordSection.js` 111、133、182 | 顏色 | 金色「待收款」「待開發票」「退款」、綠色「收款」、橘色老化天數等標籤，12px 字在淺色底上對比不足（金色約 2.8:1、綠色約 3.4:1） | `audit.md`：「Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)」 | P1 | 標籤文字色調深到 4.5:1 以上。指令：`harden` |
| A-24 | P3 | `after-sales/page.js` 558–578 | 無障礙 | 三張摘要卡點了會切換篩選，但它們是一般區塊，不是按鈕。鍵盤跳不到、按 Enter 沒反應；選中只靠藍色外框，螢幕閱讀器不知道選中與否 | `audit.md`：「Improper heading hierarchy, missing landmarks, divs instead of buttons」 | P2 | 摘要卡加按鈕角色、可聚焦、Enter／空白鍵觸發、選中狀態（`aria-pressed`）。指令：`harden` |
| A-25 | P3 | `after-sales/page.js` 211–216、509–515 | 其他 | 「待結案」卡的數字含「待結案」與「待建關聯動作」兩種單，點下去卻只篩出「待結案」。卡上寫 N 張，列表可能少於 N 張 | `audit.md`：「Look for repeated implementation shortcuts, design-system drift, misleading or decorative content, and structure that is interchangeable with an unrelated product.」 | P1 | 卡的計數與點擊篩選改成同一個範圍。指令：`harden` |
| A-26 | P3 | `after-sales/page.js` 572 | 無障礙 | 摘要卡的計數用三級標題呈現。螢幕閱讀器的標題清單會出現「1」「0」「0」三個標題 | `audit.md`：「Improper heading hierarchy, missing landmarks, divs instead of buttons」；`craft-floor.md`：「The hero-metric template: big number, small label, supporting stats, accent.」 | P3 | 計數改成一般文字，字級沿用專案 `titleLg`。指令：`typeset` |
| A-27 | P3 | `after-sales/page.js` 497、504、512 | 顏色 | 摘要卡的「待填決議」金色、「待結案」青色標籤對比不足（金色約 2.8:1、青色約 3.5:1）；金、青兩色也不在專案語意色內 | `audit.md`：「Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)」；`audit.md`：「Colors not using design tokens」 | P1 | 標籤改用對比足夠的語意色。指令：`harden` |
| A-28 | P3 | `after-sales/page.js` 321–326 | 狀態 | 逾期的單在同一列出現兩個紅標籤：下一步動作欄「逾期」、狀態欄「處理中（逾期）」 | `operate.md`：「Accent color used for primary actions, current selection, and state indicators only, not decoration.」 | P3 | 狀態欄只顯示狀態，逾期留給下一步動作欄。指令：`quieter` |
| A-29 | P3 | `after-sales/page.js` 253–344、523 | 版型與組合 | 1440 寬的桌機畫面，表格寬度 1340 超出容器。「狀態」欄被推到畫面外，「下一步動作」欄名被固定的操作欄蓋掉一半（截圖只看到「下一步」） | `craft-floor.md`：「Run the real copy at every breakpoint and fix what overflows.」 | P2 | 調整各欄寬度，讓業務視角在 1440 寬不需橫捲就看到狀態欄。指令：`layout` |
| A-30 | P3 | `after-sales/page.js` 280、399 | 字級 | 案名與空白狀態說明寫死 12px，沒用字級代號 | `audit.md`：「Using wrong tokens, mixing token types」 | P3 | 改用 `theme.typography.bodySm`。指令：`typeset` |
| A-31 | P3 | `after-sales/page.js` 395–404 | 狀態 | 空白狀態說明寫「售後服務」Tab」，英文夾在中文介面裡；有篩選條件時沒有任何下一步提示 | `operate.md`：「Empty states that teach the interface, not "nothing here."」；`craft-floor.md`：「the product's own language.」 | P3 | 「Tab」改「分頁」；有篩選時補一句「可調整或清空篩選條件」。指令：`clarify` |
| A-32 | P3 | `after-sales/page.js` 419–489 | 無障礙 | 篩選區的下拉與日期區間沒有綁定標題，螢幕閱讀器只念灰字 | `audit.md`：「Inputs without labels, poor error messaging, missing required indicators」 | P2 | 加與標題同字的無障礙名稱。指令：`harden` |
| A-33 | P3 | `after-sales/page.js` 413、425、453、467、480 | 提示文字 | 搜尋框與下拉的灰字對比約 1.9:1（與 A-11 同一個顏色） | `craft-floor.md`：「body and placeholder text ≥4.5:1, large text ≥3:1.」 | P1 | 把輸入框灰字顏色調到對比 4.5:1 以上。指令：`harden` |

### 嚴重度與類別統計

| 嚴重度 | 數量 |
|--------|------|
| P0 | 0 |
| P1 | 6 |
| P2 | 13 |
| P3 | 14 |
| 合計 | 33 |

| 類別 | 數量 | 編號 |
|------|------|------|
| 字級 | 4 | A-12、A-14、A-15、A-30 |
| 字重 | 1 | A-13 |
| 顏色 | 4 | A-16、A-20、A-23、A-27 |
| 提示文字 | 7 | A-02、A-06、A-07、A-09、A-11、A-17、A-33 |
| 版型與組合 | 2 | A-05、A-29 |
| 狀態 | 4 | A-04、A-22、A-28、A-31 |
| 無障礙 | 7 | A-01、A-08、A-18、A-21、A-24、A-26、A-32 |
| 其他 | 4 | A-03、A-10、A-19、A-25 |

對比數值是用色碼手算的相對亮度比，沒有經偵測程式或瀏覽器實測。

## 二、Impeccable 的評分與總結

`audit.md` 的流程產出下列內容，照格式填寫。

### Audit Health Score

| # | 面向 | 分數 | 主要發現 |
|---|------|------|---------|
| 1 | Accessibility（無障礙） | 2 | 灰字與標籤對比不足；摘要卡鍵盤操作不了；篩選欄位沒有名稱 |
| 2 | Performance（效能） | 3 | 未發現問題。偵測程式與畫面效能量測沒跑，只讀程式碼 |
| 3 | Theming（主題） | 2 | 帳務區寫死 13、18、22px 與字重 600；摘要卡用不在語意色內的金、青色。專案沒有深色模式，該項不適用 |
| 4 | Responsive Design（響應式） | 3 | 售後列表在 1440 寬桌機就要橫捲，狀態欄看不到。專案辦公頁面只支援桌機，未檢查手機寬度 |
| 5 | Implementation Integrity（實作一致性） | 2 | 售後「待結案」卡計數與篩選範圍不同；刷新鈕無作用；退款金額自組格式 |
| **合計** | | **12/20** | **Acceptable（需要明顯修整）** |

### Implementation Integrity Verdict

通過，有偏移。三頁都用專案共用元件組成：篩選列 `GenericFilter`、表格外框 `TableBlock`、區塊 `PanelBlock`、提示框 `StyledAlert`、對話框 `PanelDialog`。圖示按鈕一律附提示泡泡與無障礙名稱。偏移集中在帳務區的寫死字級與字重，以及少數誤導的控制項（A-03、A-25）。偵測程式沒跑，本段只有人工讀碼的證據。

### Executive Summary

- Audit Health Score：12/20（Acceptable）
- 問題數：P0 0、P1 6、P2 13、P3 14
- 最重要的問題：
  - 輸入框灰字與多種標籤對比不足（A-11、A-23、A-27、A-33）。這是專案色彩代號層級的問題，三頁都有。
  - 已取消列用半透明，文字對比不足（A-18）。
  - 售後「待結案」卡的數字與點下去的結果不一致（A-25）。
  - 摘要卡與篩選欄位對鍵盤與螢幕閱讀器不友善（A-01、A-24、A-32）。
- 建議下一步：見「Recommended Actions」。

### Patterns & Systemic Issues

- 篩選區的標題與欄位分開寫，三頁中兩頁有此情況（P1、P3）。模式來自各頁自己組篩選條件。
- 帳務區四個檔案共七處以上寫死字級，沒有一處用字級代號。
- 停用按鈕的原因全靠滑鼠提示泡泡（P2 三個檔案）。
- 標籤用 AntD 預設色盤（gold、cyan、green、orange），淺底小字普遍對比不足。

### Positive Findings

- 所有純圖示按鈕都有提示泡泡與無障礙名稱（`aria-label`），操作名稱與按鈕文字一致。
- 操作依角色與狀態直接不渲染，畫面不堆停用按鈕（P1 的 `rowActions`）。
- 金額欄一律靠右對齊，金額格式集中在 `format.js`。
- 空表格大多有專屬文案（收款項目、款項紀錄、發票）。

### Recommended Actions

1. **[P1] `harden`**：已取消列改用次要文字色（A-18）；摘要卡改成可鍵盤操作的按鈕（A-24）；篩選欄位與表格輸入框補名稱（A-01、A-08、A-32）；停用原因可用鍵盤看到（A-21）；抵達站點補照片規則說明（A-09）；側板警示改提示框（A-04）。灰字與標籤對比（A-11、A-23、A-27、A-33）與待結案計數（A-25）也歸此指令。
2. **[P2] `typeset`**：帳務區與售後頁的寫死字級改用字級代號（A-12 至 A-15、A-26、A-30）。
3. **[P2] `clarify`**：轉交單說明縮短（A-02）、待對帳說明改寫（A-17）、操作與欄位用詞一致（A-06、A-07）、空白狀態文案（A-22、A-31）。
4. **[P2] `layout`**：售後列表欄寬（A-29）、側板間距（A-05）。
5. **[P3] `quieter`**：退款四重標示（A-20）、逾期雙紅標籤（A-28）。
6. **`polish`**：圖示一致（A-10）、負數顏色（A-16）、退款金額格式（A-19），並做最後一輪檢查。

`audit.md` 規定在總結後告訴使用者：

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `{{command_prefix}}impeccable audit` after fixes to see your score improve.

## 三、涵蓋表

一個發現可能涉及多個檔案，所以各檔發現數加總大於 33。

| 檔案（相對 `(prototype)/`） | 行數 | 讀取 | 涉及的發現數 | 編號 |
|---------------------------|------|------|------------|------|
| `production-floor/transfers/page.js` | 1006 | 已逐行讀完 | 11 | A-01 至 A-11 |
| `orders/_components/detail/billing/ReconciliationPanel.js` | 237 | 已逐行讀完 | 5 | A-12、A-13、A-16、A-17、A-23 |
| `orders/_components/detail/billing/ReceivableCard.js` | 124 | 已逐行讀完 | 1 | A-14 |
| `orders/_components/detail/billing/InstallmentSection.js` | 322 | 已逐行讀完 | 3 | A-10、A-18、A-21 |
| `orders/_components/detail/billing/PaymentRecordSection.js` | 290 | 已逐行讀完 | 6 | A-10、A-15、A-18、A-19、A-20、A-23 |
| `orders/_components/detail/billing/InvoiceSection.js` | 392 | 已逐行讀完 | 4 | A-10、A-16、A-21、A-22 |
| `orders/_components/detail/billing/format.js` | 25 | 已逐行讀完 | 0 | 無 |
| `after-sales/page.js` | 579 | 已逐行讀完 | 10 | A-24 至 A-33 |

截圖 `base-P1.png`、`base-P2.png`、`base-P3.png` 三張都看過。

## 四、過程紀錄

### 用到的指令與參考檔

| 項目 | 內容 |
|------|------|
| 指令 | `audit`。依據 `SKILL.src.md` 指令表：「Technical quality checks (a11y, perf, responsive)」，以及路由規則：「load its reference (native variant on native platforms) and follow it.」本任務明示要稽核 |
| 表面模式 | Operate。依據 `SKILL.src.md`：「the visitor completes a task. App UI, dashboards, editors, admin, settings, tools.」 |
| 讀完全文的檔 | `SKILL.src.md`、`reference/audit.md`、`reference/operate.md`、`reference/mode-operate.md`、`reference/routing.md`、`reference/craft-floor.md` |
| 專案脈絡（代替 PRODUCT.md、DESIGN.md） | erp 工作樹的 `Designs.md`、`AGENTS.md`、三頁原始碼、`prep.md` |
| 為何讀 `craft-floor.md` | 稽核本身不需要；`SKILL.src.md` 規定任何介面修改前要讀。第二步會改檔，所以先讀，並借它的對比與間距判準當依據 |
| 為何讀 `mode-operate.md` | 確認 Operate 模式規則。讀完發現它是新畫面構想階段用的，對稽核沒有可用判準 |
| 沒用的指令 | `critique`（UX 啟發式評分）。`audit.md` 寫明「This is a code-level audit, not a design critique.」，本任務只要求稽核類指令，所以沒跑 |

### 降級或跳過的步驟

| 原文句（出處） | 處理 | 少了什麼 |
|---------------|------|---------|
| 「Run `<skill-base-dir>/scripts/impeccable context` once per session」（`SKILL.src.md` Setup 1） | 不執行。改走「Launcher unavailable」流程，先送出原文要求的那句話，再直接讀既有脈絡 | 沒有載入 PRODUCT.md、DESIGN.md 與表面簡報。專案沒有這兩個檔，用 `Designs.md` 代替。也沒有平台判定與 `CONTEXT_STALE` 檢查 |
| 「Context loading did not run; I’ll read the existing project context directly.」（`SKILL.src.md` Launcher unavailable） | 照做，在下一個工具呼叫前送出 | 無 |
| 「read existing PRODUCT.md and DESIGN.md without inventing missing context」（同上） | 兩檔都不存在，沒有自行補寫 | 沒有產品定位與設計規範的 Impeccable 格式紀錄。`audit-A-files/` 因此沒有產生任何檔 |
| 「Run the bundled detector and verify each finding in context.」（`audit.md` 第 5 面向） | 不執行 | 沒有偵測程式的確定性發現。第 5 面向只有人工讀碼的證據，無法把「確定性發現」與「視覺判斷」分開 |
| 「When the app cannot run, start with committed visual-regression goldens or screenshot fixtures」（`SKILL.src.md` Setup 2） | 用任務提供的改前截圖代替。截圖取自基底 `6e75fa07`，與受測程式碼同版本 | 只有 1440 寬整頁截圖各一張。沒有懸停、聚焦、對話框、側板、空白狀態的畫面；對比只能手算 |
| 「Verify by looking at the rendered result at the sizes it ships at」（`SKILL.src.md` Core principles） | 不能啟動開發伺服器 | 改前只能看既有截圖，改後無法目視驗證 |
| 「then run `{{scripts_path}}/impeccable audit-storage write」（`audit.md` Save the Report） | 不執行 | 報告沒有存進 Impeccable 的報告目錄。本檔即報告 |
| 「Only recommend commands from: {{available_commands}}」（`audit.md` Recommended Actions） | 範本變數未經啟動程式展開。改用 `SKILL.src.md` 指令表的指令 | 無法確認這個版本實際可用的指令清單 |
| 「Exercise the gesture when a browser tool can synthesize touch」（`audit.md` 第 4 面向） | 跳過 | 沒有觸控測試。專案辦公頁面只支援桌機 |
| 「launch the app with a local DevTools port」（`audit.md` 第 5 面向，桌面應用） | 不適用。本專案是網頁 | 無 |

### 略過的無關指示

| 原文句（出處） | 原因 |
|---------------|------|
| `allowed-tools` 的「Bash(npx impeccable *)」（`SKILL.src.md` 開頭設定） | 任務禁止執行 `npx impeccable` |
| 「The launcher runs a self-contained binary that ships next to it or is downloaded once on first run」（`SKILL.src.md` Setup 1） | 對外下載與執行外部程式，任務禁止 |
| 「Link to the [docs](https://impeccable.style/docs/) for the broader workflow guide.」（`routing.md`） | 對外連線，任務禁止 |
| 「run `{{scripts_path}}/impeccable signals` once」（`routing.md`） | 執行腳本，且只用於無參數時的選單 |
| `Pin / Unpin`、`Hooks`、`Doctor` 三段（`SKILL.src.md`） | 改代理設定與掛勾，與本任務無關 |

### 依「Keep P3s few」刪去的觀察

`audit.md` 寫「Keep P3s few: a long tail of minor issues buries the ones that matter.」下列觀察不列入發現表：

- `PaymentRecordSection.js` 258 行空表格文案帶句號，`InstallmentSection.js` 301 行不帶，標點不一致。
- `ReceivableCard.js` 86–99 行摘要欄固定四等分，沒有窄螢幕斷點。專案詳情頁配方本來就用固定欄寬。
- `after-sales/page.js` 492–493 行註解寫「業務視角限本人開立」，與 196 行「不看開立者」矛盾。這是註解，使用者看不到。

### Impeccable 判準沒涵蓋、因此不列入的觀察

- `production-floor/transfers/page.js` 253 行：本機照片產生預覽網址後沒有釋放。`audit.md` 的效能檢查項沒有記憶體釋放這一項，找不到依據句。
- `after-sales/page.js` 287–294、355–362 行：受理時間與最後活動只顯示「N 天前」，沒有確切日期可查。找不到直接對應的依據句。
