# 票 42 實測比對：三份畫面稽核的判定

判定者只核對事實，不評哪個方法好。基準是 erp 提交 `6e75fa07`；A1、A2、B 的改動分別在本機分支 `local/ticket42-a`、`local/ticket42-a2`、`local/ticket42-b`。
路徑相對於 `apps/erp/src/app/(prototype)/`；P2 的檔省略 `orders/_components/detail/billing/` 前綴，P1 的檔寫成 `transfers/page.js`。

## 一、摘要

115 項發現：屬實 112、不屬實 0、無法由程式判定 3（2.6%）。屬實的合併成 81 個問題。
#### 第 3 項　四類問題的涵蓋（問題數）
| 類別 | 聯集 | A1 | A2 | B | 只有 A1 | 只有 A2 | 只有 B |
|------|------|----|----|---|--------|--------|-------|
| 字級 | 8 | 6 | 6 | 8 | 0 | 0 | 2 |
| 字重 | 2 | 1 | 1 | 2 | 0 | 0 | 1 |
| 顏色 | 20 | 9 | 14 | 8 | 1 | 6 | 4 |
| 提示文字 | 17 | 3 | 4 | 16 | 1 | 0 | 11 |
| 四類小計 | 47 | 19 | 25 | 34 | 2 | 6 | 18 |
| 四類以外小計 | 34 | 21 | 18 | 14 | 6 | 4 | 8 |
#### 第 7 項　四類問題已改（以 diff 為準）
| 類別 | 聯集 | A1 已改 | A2 已改 | B 已改 |
|------|------|--------|--------|-------|
| 字級 | 8 | 7 | 7 | 8 |
| 字重 | 2 | 2 | 2 | 2 |
| 顏色 | 20 | 2 | 1 | 4 |
| 提示文字 | 17 | 1 | 0 | 14 |
| 小計 | 47 | 12 | 10 | 28 |
#### 第 4 項　建議改法與 erp 規範衝突（發現數）
| 方法 | 衝突 | 已自行攔下 | 照做進了 diff |
|------|------|-----------|--------------|
| A1 | 4 | 4 | 0 |
| A2 | 4 | 4 | 0 |
| B | 2 | 0 | 2 |
#### 第 5 項　改動越界（條目數）
| 類型 | A1 | A2 | B |
|------|----|----|---|
| 動到欄名或操作按鈕的可及名稱 | 2 | 0 | 0 |
| 改動沒有對應的發現編號 | 0 | 0 | 1 |
| 其餘類型（新增手寫值、業務邏輯與 mock、範圍外檔、語法錯誤） | 0 | 0 | 0 |
#### 第 6 項　機械檢查命中行數（`check-B.sh`，範圍內 8 檔）
| 版本 | C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | 合計 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|
| 改前 | 14 | 1 | 0 | 11 | 19 | 9 | 3 | 5 | 8 | 33 | 0 | 103 |
| A1 | 0 | 0 | 0 | 11 | 19 | 9 | 3 | 7 | 8 | 29 | 0 | 86 |
| A2 | 0 | 0 | 0 | 11 | 19 | 10 | 3 | 5 | 8 | 29 | 0 | 85 |
| B | 0 | 0 | 0 | 5 | 19 | 2 | 0 | 3 | 0 | 27 | 0 | 56 |

## 二、問題聯集表

合併規則：同一個檔的同一處、同一種問題算一列。一項發現在問題描述或建議改法裡寫了兩種問題，就分進兩列（例：A-13 同時寫字級、字重、邊距）。
類別由判定者依問題本身重分，不沿用受測者的分類：

| 類別 | 收什麼 |
|------|--------|
| 字級 | 手寫字級、字級不在階層、同一角色字級不同 |
| 字重 | 手寫字重、用到未載入的字重 |
| 顏色 | 文字或標籤的對比、用調色盤色名而非語意色、淡化方式、同一意義兩種顏色 |
| 提示文字 | 提示框、欄位說明、提示泡泡、灰字、區塊說明的內容與份量（含缺少說明） |
| 用詞 | 同一概念兩種名稱、英文夾雜、欄名與內容不符 |
| 狀態 | 空白、載入、錯誤狀態，以及警示的呈現元件 |
| 無障礙 | 鍵盤操作、可及名稱、標題語意 |
| 版型與組合 | 間距、容器結構 |
| 其他 | 行為、格式、重複標示等 |

「已改」以 diff 為準，與受測者有沒有列這項發現無關。發現欄寫「－」但已改欄寫「改」，表示改動不是針對這列的發現。
受測者自述的已改清單（`fix-A.md` 18 項、`fix-A2.md` 16 項、`fix-B.md` 30 項）逐項對照 diff，全部有對應改動。

| 序 | 頁 | 檔案與行號（改前） | 類別 | 問題 | A1 | A2 | B | A1 已改 | A2 已改 | B 已改 |
|----|----|------------------|------|------|----|----|---|--------|--------|-------|
| U01 | P1 | transfers/page.js 573–579 | 提示文字 | 頂部提示框約 100 字，講 Slack 通道機制；生管版本講只對負責廠務出現的按鈕 | A-02 | A2-01 | B-01 | － | － | 改 |
| U02 | P1 | transfers/page.js 582 | 提示文字 | 搜尋框灰字用「請輸入」列出可搜尋條件，灰字當標籤用 | － | A2-02 | B-02 | － | － | 改 |
| U03 | P1 | transfers/page.js 582、594、605、616、626 | 顏色 | 輸入框灰字 #babcbf 對白底 1.9:1 | A-11 | A2-02 | － | － | － | － |
| U04 | P1 | transfers/page.js 900 | 提示文字 | 負責廠務下拉灰字「請選擇廠務」 | － | － | B-03 | － | － | 改 |
| U05 | P1 | transfers/page.js 894 | 提示文字 | 負責廠務欄說明 37 字，重述可編輯的事實 | － | － | B-04 | － | － | 改 |
| U06 | P1 | transfers/page.js 910 | 提示文字 | 目的產線欄說明 64 字，寫進取值規則 | － | － | B-05 | － | － | 改 |
| U07 | P1 | transfers/page.js 986 | 提示文字 | 重開對話框目的產線說明 59 字，寫進沿用規則 | － | － | B-06 | － | － | 改 |
| U08 | P1 | transfers/page.js 669–671 | 提示文字 | 側板警示寫完整處置流程 | － | － | B-07 | － | － | 改 |
| U09 | P1 | transfers/page.js 667–673 | 狀態 | 側板警示是紅色內文段落，不是提示元件 | A-04 | A2-05 | － | 改 | 改 | － |
| U10 | P1 | transfers/page.js 709、723 | 版型與組合 | 側板小標下方間距手寫 8 | A-05 | A2-06 | B-08 | 改 | 改 | 改 |
| U11 | P1 | transfers/page.js 666 | 版型與組合 | 側板區塊間距手寫 20，不在間距階層 | A-05 | － | B-09 | 改 | － | － |
| U12 | P1 | transfers/page.js 588、593、604、615、627 | 版型與組合 | 篩選列欄距 16 與標籤下距 4 手寫 | － | － | B-09 | － | － | － |
| U13 | P1 | transfers/page.js 589–631 | 無障礙 | 篩選標題沒有綁到下拉與日期區間 | A-01 | A2-03 | － | 改 | 改 | － |
| U14 | P1 | transfers/page.js 590、601、612、625 | 顏色 | 篩選標題用次要文字灰 #949699，對白底 2.97:1 | － | A2-04 | － | － | － | － |
| U15 | P1 | transfers/page.js 585 | 其他 | 刷新按鈕的處理函式是空函式 | A-03 | A2-09 | － | － | － | － |
| U16 | P1 | transfers/page.js 428、842–843 | 用詞 | 列上按鈕叫編輯，對話框叫修改轉交單、儲存修改 | A-06 | A2-08 | － | － | － | － |
| U17 | P1 | transfers/page.js 866–867、957–958 | 用詞 | 對話框欄名「數量」，他處叫「搬運數量」 | A-07 | － | － | 改 | － | － |
| U18 | P1 | transfers/page.js 872–883、963–974 | 無障礙 | 明細數字輸入框沒有可及名稱 | A-08 | － | － | 改 | － | － |
| U19 | P1 | transfers/page.js 732–780 | 提示文字 | 抵達站點對話框沒寫每條明細至少一張照片 | A-09 | － | － | 改 | － | － |
| U20 | P1 | transfers/page.js 444；Installment 253；PaymentRecord 221；Invoice 131、307 | 其他 | 作廢類圖示 block 與 cancel 不一致 | A-10 | － | － | － | － | － |
| U21 | P1 | transfers/page.js 504–506、517 | 無障礙 | 側板印件、工單連結沒有 href，鍵盤跳不到 | － | A2-07 | － | － | － | － |
| U22 | P1 | transfers/page.js 713、740、846、937 | 狀態 | 側板與對話框表格沒有載入與錯誤狀態 | － | － | B-10 | － | － | － |
| U23 | P2 | ReconciliationPanel 31、38、66、72、77、103、129 | 字級 | 對帳卡文字手寫 13px | A-12 | A2-10 | B-11 | 改 | 改 | 改 |
| U24 | P2 | ReconciliationPanel 132 | 字級 | 主數字手寫 22px | A-13 | A2-11 | B-12 | 改 | 改 | 改 |
| U25 | P2 | ReconciliationPanel 132 | 字重 | 主數字字重 600，未載入 | A-13 | A2-12 | B-13 | 改 | 改 | 改 |
| U26 | P2 | ReconciliationPanel 132 | 版型與組合 | 主數字上下距手寫 8、12 | A-13 | A2-11 | B-32 | 改 | 改 | 改 |
| U27 | P2 | ReconciliationPanel 108 | 版型與組合 | 差額數字右距手寫 8 | － | － | B-32 | － | － | 改 |
| U28 | P2 | ReceivableCard 24 | 字級 | 摘要欄標籤手寫 13px | A-14 | A2-18 | B-14 | 改 | 改 | 改 |
| U29 | P2 | ReceivableCard 24 | 版型與組合 | 摘要欄標籤下距手寫 8 | － | A2-18 | B-32 | － | 改 | 改 |
| U30 | P2 | ReceivableCard 96 | 字級 | 應收總額 18px，對帳卡同一數字 22px | A-14 | A2-19 | B-15 | 改 | 改 | 改 |
| U31 | P2 | PaymentRecordSection 149、154 | 字級 | 核銷分配欄手寫 13px | A-15 | A2-25 | B-16 | 改 | 改 | 改 |
| U32 | P2 | ReconciliationPanel 36–41；Invoice 63、239 | 顏色 | 負數同設紅色與深灰，深灰生效；發票區負數是紅字 | A-16 | A2-13 | － | － | － | － |
| U33 | P2 | ReconciliationPanel 168–173 | 提示文字 | 待對帳提示框說明重複訂單編號與帳務公司 | A-17 | － | B-27 | － | － | 改 |
| U34 | P2 | InstallmentSection 101 | 顏色 | 已取消收款項目用透明度 0.5，不用停用或次要文字色 | A-18 | A2-20 | B-29 | 改 | － | 改 |
| U35 | P2 | PaymentRecordSection 38–40 | 顏色 | 已取消款項整列透明度 0.5 | A-18 | A2-20 | B-30 | 改 | － | － |
| U36 | P2 | PaymentRecordSection 169 | 其他 | 退款金額自組字串，未用 format.js | A-19 | A2-26 | － | 改 | 改 | － |
| U37 | P2 | PaymentRecordSection 35–37、109–112、168–169、178–186 | 其他 | 一筆退款四重標示，付款方式欄多一個金色退款標籤 | A-20 | A2-24 | B-28 | － | － | 改 |
| U38 | P2 | PaymentRecordSection 111 | 顏色 | 款項類型（收款、退款）用綠紅狀態色 | － | A2-24 | － | － | － | － |
| U39 | P2 | ReconciliationPanel 89、111 | 顏色 | 差額標籤金色對比 2.76:1 | A-23 | A2-14 | － | － | － | － |
| U40 | P2 | PaymentRecordSection 111、133、182 | 顏色 | 收款綠、老化橘、退款金標籤對比 3.37、3.34、2.76:1 | A-23 | － | － | － | － | － |
| U41 | P2 | Installment 131–142；PaymentRecord 122；Receivable 87；Invoice 86、219 | 顏色 | 狀態標籤綠色對比 3.37:1 | － | A2-17 | － | － | － | － |
| U42 | P2 | ReconciliationPanel 89 | 顏色 | 差額標籤用調色盤色名 green、gold、red | － | A2-14 | B-18 | － | － | 改 |
| U43 | P2 | PaymentRecordSection 133 | 顏色 | 老化天數標籤用調色盤色名 orange | － | － | B-19 | － | － | 改 |
| U44 | P2 | orders/mock-data.js 81–83、150–151、157–158、166、173–175、180 | 顏色 | 帳務狀態 META 表用調色盤色名（範圍外檔） | － | － | B-20 | － | － | － |
| U45 | P2 | InstallmentSection 247–260；Invoice 114–139、287–315 | 無障礙 | 停用按鈕原因只在滑鼠提示；鍵盤取不到；回簽檔、作廢折讓停用時無原因 | A-21 | A2-22 | － | 改 | － | － |
| U46 | P2 | InvoiceSection 154 | 狀態 | 折讓子表空狀態只寫「沒有資料」 | A-22 | A2-27 | － | － | － | － |
| U47 | P2 | ReconciliationPanel 176–232 | 版型與組合 | 三方對帳外框內再放三張有框卡片 | － | A2-15 | － | － | － | － |
| U48 | P2 | ReconciliationPanel 31 等；Receivable 24；PaymentRecord 154 | 顏色 | 帳務區卡名、欄名、未分配用次要文字灰 2.97:1 | － | A2-16 | － | － | － | － |
| U49 | P2 | InstallmentSection 271 | 提示文字 | 區塊說明重述區塊名稱、帶實作說明 | － | A2-23 | B-24 | － | － | 改 |
| U50 | P2 | InstallmentSection 211–214、239 | 提示文字 | 開立發票圖示提示多了操作說明 | － | － | B-21 | － | － | 改 |
| U51 | P2 | InvoiceSection 266–270、288 | 提示文字 | 作廢發票、開立折讓單停用提示寫原因，超出動作名稱 | － | － | B-22 | － | － | － |
| U52 | P2 | InstallmentSection 248 | 提示文字 | 取消收款項目停用提示寫原因，超出動作名稱 | － | － | B-23 | － | － | － |
| U53 | P2 | InvoiceSection 335 | 提示文字 | 發票空白狀態重複收款項目區塊說明 | － | － | B-25 | － | － | 改 |
| U54 | P2 | PaymentRecordSection 235 | 提示文字 | 區塊說明重述區塊名稱 | － | － | B-26 | － | － | 改 |
| U55 | P2 | ReconciliationPanel 180–230；Receivable 95；Installment 108、116 | 其他 | 「（含稅）」重複十次以上 | － | － | B-31 | － | － | － |
| U56 | P2 | 整個分頁（B-11 至 B-16 各行） | 字級 | 分頁內用了 13、14、16、18、22 五級字 | － | － | B-17 | 改 | 改 | 改 |
| U57 | P2 | Installment 293；PaymentRecord 250；Invoice 146、326；Receivable 111 | 狀態 | 帳務區表格沒有載入與錯誤狀態 | － | － | B-34 | － | － | － |
| U58 | P2 | 帳務五檔共 14 處（B-33 所列） | 版型與組合 | 分項上距 4、欄距 16、區塊距 20、按鈕距 4 與 8 手寫 | － | － | B-33 | － | － | － |
| U59 | P3 | after-sales/page.js 280、399 | 字級 | 案名與空白狀態說明手寫 12px | A-30 | A2-28 | B-35 | 改 | 改 | 改 |
| U60 | P3 | after-sales/page.js 572 | 字級 | 摘要卡計數 24px，P2 摘要數字與 StatCards 用 20 | － | － | B-42 | － | － | 改 |
| U61 | P3 | after-sales/page.js 572 | 字重 | 摘要卡計數用 h3，字重 600 未載入 | － | － | B-42 | 改 | 改 | 改 |
| U62 | P3 | after-sales/page.js 572 | 無障礙 | 摘要卡計數用 h3，標題大綱出現數字 | A-26 | A2-36 | － | 改 | 改 | 改 |
| U63 | P3 | after-sales/page.js 558–578 | 無障礙 | 摘要卡可點但不是按鈕，鍵盤無法操作 | A-24 | A2-35 | － | 改 | 改 | － |
| U64 | P3 | after-sales/page.js 211–216、509–515 | 其他 | 待結案卡計數含待建關聯動作，點下去只篩待結案 | A-25 | － | － | － | － | － |
| U65 | P3 | after-sales/page.js 504、511 | 顏色 | 摘要卡金、青標籤對比 2.76、3.39:1 | A-27 | A2-37 | － | － | － | － |
| U66 | P3 | after-sales/page.js 497、504、511 | 顏色 | 摘要卡標籤用調色盤色名 red、gold、cyan | A-27 | － | B-38 | － | － | － |
| U67 | P3 | after-sales/page.js 321–326 | 其他 | 逾期單在狀態欄與下一步動作欄各標一次紅色逾期 | A-28 | － | B-41 | － | － | － |
| U68 | P3 | after-sales/page.js 323 | 顏色 | 逾期狀態標籤用調色盤色名 red | － | － | B-37 | － | － | 改 |
| U69 | P3 | orders/mock-data.js 234–236、252–255 | 顏色 | 售後狀態與下一步動作 META 表用調色盤色名（範圍外檔） | － | － | B-39 | － | － | － |
| U70 | P3 | after-sales/page.js 400 | 用詞 | 空白狀態說明寫英文「Tab」 | A-31 | － | － | 改 | － | 改 |
| U71 | P3 | after-sales/page.js 395–404 | 狀態 | 有篩選條件時空白狀態沒有下一步提示 | A-31 | － | － | 改 | － | － |
| U72 | P3 | after-sales/page.js 400 | 提示文字 | 空白狀態說明後半寫業務規則 | － | － | B-40 | － | － | 改 |
| U73 | P3 | after-sales/page.js 413 | 提示文字 | 搜尋框灰字「請輸入」列出可搜尋條件 | － | A2-32 | B-36 | － | － | 改 |
| U74 | P3 | after-sales/page.js 413、425、453、468、480 | 顏色 | 輸入框灰字 #babcbf 對白底 1.9:1 | A-33 | A2-32 | － | － | － | － |
| U75 | P3 | after-sales/page.js 419–489 | 無障礙 | 篩選標題沒有綁到下拉與日期區間 | A-32 | A2-30 | － | 改 | 改 | － |
| U76 | P3 | after-sales/page.js 421、436、449、464、479 | 顏色 | 篩選標題用次要文字灰 2.97:1 | － | A2-31 | － | － | － | － |
| U77 | P3 | after-sales/page.js 292、360 | 顏色 | 受理時間、最後活動用次要文字灰 2.97:1 | － | A2-29 | － | － | 改 | － |
| U78 | P3 | after-sales/page.js 425 | 用詞 | 下一步動作灰字只寫「全部」，與他處不一致 | － | A2-33 | － | － | 改 | － |
| U79 | P3 | after-sales/page.js 253–258 | 用詞 | 「編號」欄內容是列序號 | － | A2-34 | － | － | － | － |
| U80 | P3 | after-sales/page.js 419、424、438、452、467、481、494、570 | 版型與組合 | 篩選欄距 16、標籤下距 4、摘要卡內距 4 手寫 | － | － | B-43 | － | － | － |
| U81 | P3 | after-sales/page.js 519 | 狀態 | 列表沒有載入與錯誤狀態 | － | － | B-44 | － | － | － |

各類別完整統計（由上表重算，指令見第五節）：

| 類別 | 聯集 | A1 | A2 | B | 只有 A1 | 只有 A2 | 只有 B | A1 已改 | A2 已改 | B 已改 |
|------|------|----|----|---|--------|--------|-------|--------|--------|-------|
| 字級 | 8 | 6 | 6 | 8 | 0 | 0 | 2 | 7 | 7 | 8 |
| 字重 | 2 | 1 | 1 | 2 | 0 | 0 | 1 | 2 | 2 | 2 |
| 顏色 | 20 | 9 | 14 | 8 | 1 | 6 | 4 | 2 | 1 | 4 |
| 提示文字 | 17 | 3 | 4 | 16 | 1 | 0 | 11 | 1 | 0 | 14 |
| 版型與組合 | 9 | 3 | 4 | 8 | 0 | 1 | 4 | 3 | 3 | 4 |
| 狀態 | 6 | 3 | 2 | 3 | 1 | 0 | 3 | 2 | 1 | 0 |
| 無障礙 | 7 | 6 | 6 | 0 | 1 | 1 | 0 | 6 | 4 | 1 |
| 用詞 | 5 | 3 | 3 | 0 | 2 | 2 | 0 | 2 | 1 | 1 |
| 其他 | 7 | 6 | 3 | 3 | 2 | 0 | 1 | 1 | 1 | 1 |
| 合計 | 81 | 40 | 43 | 48 | 8 | 10 | 26 | 26 | 20 | 35 |

## 三、不屬實與無法判定的發現

判定方式：逐項讀改前檔（`git show 6e75fa07:<路徑>`），確認發現說的那幾行與現象存在。對比值由判定者用 WCAG 相對亮度公式，從 token 與 AntD 預設色重算，結果與發現一致：灰字 #babcbf 1.90、次要文字 #949699 2.97、金色標籤 2.76、綠色標籤 3.37、青色標籤 3.39、橘色標籤 3.34、透明度 0.5 的內文約 3.15。

不屬實：無。

無法由程式判定：

| 序 | 發現 | 頁 | 判定 | 原因 |
|----|------|----|------|------|
| X01 | A-29 | P3 | 無法由程式判定 | 程式只看得出表格 `scroll.x` 為 1340、操作欄固定在右（改前 523、334 行）；狀態欄是否被推出畫面、欄名是否被蓋住要看畫面 |
| X02 | A2-21 | P2 | 無法由程式判定 | 程式看得出收款項目表 16 欄加操作欄、`scroll.x` 為 max-content（改前 90–208、299 行）；「1440 寬只看得到前 7 欄」要看畫面 |
| X03 | A2-38 | P3 | 無法由程式判定 | 同 X01 |

屬實，但行號或細節有出入：

| 發現 | 出入 |
|------|------|
| A2-10 | 列的 73 行應為 72 行（`style={{ fontSize: 13 }}` 在 72 行） |
| A-27 | 青色標籤在 511 行，列成 512；列出的 497 行是紅色「逾期」標籤，不是金、青色 |
| A-33 | 「全部業務」灰字在 468 行，列成 467 |
| B-17 | 16px 來自共用元件 `PanelBlock` 的區塊標題（h5），不在範圍內的檔；分頁畫面上確有 13、14、16、18、22 五級 |
| B-27 | 「頁首已顯示同一個訂單編號」的頁首在範圍外的檔，未查證；說明含訂單編號一事屬實 |
| A-03、A2-09 | 改前 585 行是空函式。共用元件 `GenericFilter` 在搜尋框有未送出的文字時，按刷新會先送出搜尋；其他情況沒有作用 |

## 四、與 erp 規範衝突的建議、越界改動

### 4.1 建議改法與 erp 規範衝突

| 發現 | 建議改法 | erp 原文句與位置 | 處置 |
|------|---------|-----------------|------|
| A-11 | 把輸入框灰字顏色調到對比 4.5:1 以上 | `Designs.md` §2 第 74 行：「改色 / 改字體一律回 Figma 改 token 再跑 transform。不要在元件裡硬寫顏色。」 | 已自行攔下 |
| A-33 | 同 A-11 | 同上 | 已自行攔下 |
| A-23 | 標籤文字色調深到 4.5:1 以上 | 同上；§8 第 245 行 Don't 欄：「自訂狀態色塊」 | 已自行攔下 |
| A-27 | 標籤改用對比足夠的語意色 | 同 A-23。語意色標籤對比：success 3.31、warning 2.01、error 4.16，都未達 4.5，要達標只能自訂色 | 已自行攔下 |
| A2-14 | 提高標籤文字對比 | 同 A-23 | 已自行攔下 |
| A2-37 | 提高標籤文字對比 | 同 A-23 | 已自行攔下 |
| A2-02 | 可搜尋條件改成框外常駐說明，灰字只放範例 | `docs/recipes/resource-page.recipe.md` 第 111 行：「多條件搜尋用單一 `search` 框 + placeholder 列出條件（如 `'搜尋單號 / 客戶名稱'`），不要拆成多個搜尋框。」該配方由 `Designs.md` §6.5 第 189 行（產一整頁時套 `docs/recipes/` 的整頁配方）與 `prototype-from-prompt` 第 47 行（先挑整頁配方）指定 | 已自行攔下 |
| A2-32 | 提高灰字對比；可搜尋條件改框外常駐說明 | `Designs.md` §2 第 74 行；配方第 111 行（同 A2-02） | 已自行攔下 |
| B-02 | 灰字改成格式範例 | 配方第 111 行（同 A2-02） | 照做。B 分支改前 582 行灰字改為「例如：TT-20261019-001」 |
| B-36 | 灰字改成格式範例 | 配方第 111 行（同 A2-02） | 照做。B 分支改前 413 行灰字改為「例如：AS-20261015-01」 |

受測者主張不相容，但 erp 原文沒有直接涵蓋（不計入摘要）：

| 發現 | 受測者引的 erp 原文 | 判定 |
|------|-------------------|------|
| A2-15 卡中卡 | `Designs.md` §6.1 第 155 行；`prototype-from-prompt` 第 17 行（長相等於正式環境） | 第 155 行沒有禁止拿掉內層框。第 17 行是否成立要對照正式頁，程式庫內查不到 |
| A2-22 停用原因鍵盤取不到 | `prototype-from-prompt` 第 52 行（禁止就地手刻共用模式） | 第 52 行指跨模組的視覺模式或元件。A1 用既有 `span` 加 `tabIndex` 與聚焦觸發做到，沒有新建元件 |
| A2-24、A-20、B-28 退款重複標示 | A2 引程式註解「比照正式前端」 | 改前 105 行註解只說款項類型欄比照正式前端；付款方式欄的退款標籤沒有比照註解。要對照正式頁。B 已刪該標籤 |

### 4.2 越界改動

逐一讀三個分支對 `6e75fa07` 的 diff。三個分支都只改 `prep.md` 範圍內的檔（A1 7 檔、A2 5 檔、B 7 檔）；用 erp 既有的 `@babel/parser` 解析四個版本的 8 檔，全部通過，沒有未使用或漏匯入的識別字。

| 分支 | 類型 | 檔案與 diff 行 | 說明 |
|------|------|---------------|------|
| A1 | 動到欄名 | `transfers/page.js` 改後 883、975：`title: '數量'` 改為 `title: '搬運數量'` | 編輯、重開對話框的欄名文字。欄位本身與取值未變。對應 A-07 |
| A1 | 動到操作按鈕的可及名稱 | `InstallmentSection.js` 改後 255；`InvoiceSection.js` 改後 123、140、309、327 | 停用時 `aria-label` 改為「動作名＋原因」，例「作廢發票：訂單已取消，不可操作」。停用條件未變（`allowanceDisabled = !canEdit \|\| noQuota` 與改前同式）。對應 A-21 |
| B | 改動沒有對應的發現編號 | `after-sales/page.js` 改後 404：「自訂單詳情頁的「售後服務」Tab 建立」改為「從訂單詳情頁的「售後服務」分頁建立」 | B-40 只指後半句的業務規則。「Tab」改「分頁」在 `audit-B.md` 第四節第 21 項列為規則不夠用，沒有列入發現 |

其餘類型三個分支都沒有：沒有新增手寫字級、字重、色碼或階層外數值（C01 至 C03 改後皆 0）；沒有動業務邏輯、流程、mock 的值；沒有改範圍外的檔；沒有語法錯誤。

### 4.3 其他觀察（事實，不計入越界）

| 分支 | 觀察 |
|------|------|
| A1 | 新增 6 處畫面文字：抵達站點對話框說明句（A-09，改後 753–755）、有篩選時的空白狀態提示（A-31）、四個停用提示的原因「訂單已取消，不可操作」（A-21）。C08 由 5 升到 7 即來自其中兩處 |
| A1 | A-09 加的說明句與改前 239 行註解相反：「檢核在資料層（缺照時整筆擋下並列出缺照的明細），介面不另寫一份」 |
| A1 | A-05 把側板區塊間距由 20 改為 `theme.spacing.lg`（24），畫面間距變大；`ReceivableCard.js` 改動行保留原有的 `marginBottom: 8` |
| A2 | C06 由 9 升到 10：A2-05 把警示拆成 `message` 與 `description`，處置流程那句落進 `description`，被腳本計入。文字內容未增加 |
| A2 | `DatePicker.RangePicker` 的 `aria-label`、A1 的 `id={{ start: ... }}` 都沒有實際執行驗證 |
| B | B-01、B-04 至 B-07、B-40 刪掉畫面上的規則說明，受測者自標「暫定，待 PM 決定」 |
| B | B-18、B-19 把 gold、orange 改為 `warning`。AntD 的 `warning` 標籤文字 #eea23e 對底色 #fff8eb 為 2.01:1，低於原本 gold 2.76、orange 3.34 |
| B | `fix-B.md` 第二節機械檢查改後合計寫 55；各項相加（0+0+0+5+19+2+0+3+0+27+0）為 56，判定者重跑亦為 56 |
| 三者 | 改前、B 的機械檢查重跑結果與 `check-B-base.txt`、`check-B-after.txt` 逐字相同 |

## 五、統計指令

以下指令只讀 erp，不切分支、不寫入 erp。

1. 取出四個版本的 `(prototype)` 目錄（`check-B.sh` 追 META 表要相對路徑，所以整個目錄取出）：

```bash
W=/private/tmp/claude-501/ticket42-judge; mkdir -p "$W"
P='apps/erp/src/app/(prototype)'
for r in base:6e75fa07 a:local/ticket42-a a2:local/ticket42-a2 b:local/ticket42-b; do
  n=${r%%:*}; ref=${r#*:}; mkdir -p "$W/$n"
  git -C /Users/b-f-03-029/erp archive "$ref" "$P" | tar -x -C "$W/$n"
done
for n in a a2 b; do git -C /Users/b-f-03-029/erp diff --stat 6e75fa07 local/ticket42-$n; done
```

2. 機械檢查（第 6 項）。存成 `run-check.sh` 後執行 `bash run-check.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail
W=/private/tmp/claude-501/ticket42-judge
S=/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-research-21-23-be9ac2/.scratch/workflow-rebuild/research/42-trial/check-B.sh
F=(production-floor/transfers/page.js
   orders/_components/detail/billing/ReconciliationPanel.js
   orders/_components/detail/billing/ReceivableCard.js
   orders/_components/detail/billing/InstallmentSection.js
   orders/_components/detail/billing/PaymentRecordSection.js
   orders/_components/detail/billing/InvoiceSection.js
   orders/_components/detail/billing/format.js
   after-sales/page.js)
for n in base a a2 b; do
  (cd "$W/$n/apps/erp/src/app/(prototype)" && bash "$S" "${F[@]}" > "$W/check-$n.txt")
done
for k in C01 C02 C03 C04 C05 C06 C07 C08 C09 C10 C11; do
  row="$k"
  for n in base a a2 b; do row="$row $(grep "^$k .*：[0-9]*$" "$W/check-$n.txt" | sed 's/.*：//')"; done
  echo "$row"
done
for n in base a a2 b; do echo "$n 合計 $(grep -c '^C[0-9][0-9] .* | ' "$W/check-$n.txt")"; done
D=/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-research-21-23-be9ac2/.scratch/workflow-rebuild/research/42-trial
diff -q "$W/check-base.txt" "$D/check-B-base.txt" && diff -q "$W/check-b.txt" "$D/check-B-after.txt" && echo 與受測者輸出相同
```

3. 發現數、聯集表、類別統計（第 1、2、3、7 項）。在結果資料夾執行，輸出應與第一節、第二節的表相同：

```bash
cd /Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-research-21-23-be9ac2/.scratch/workflow-rebuild/research/42-trial
for f in audit-A.md audit-A2.md audit-B.md; do echo "$f $(grep -cE '^\| (A|A2|B)-[0-9]{2} \|' $f)"; done
echo "無法判定 $(grep -cE '^\| X[0-9]{2} \|' compare-audit.md)"
echo "聯集列數 $(grep -cE '^\| U[0-9]{2} \|' compare-audit.md)"
# 屬實發現全數進聯集表的檢查：應無輸出
comm -23 \
  <(cat audit-A.md audit-A2.md audit-B.md | grep -oE '^\| (A|A2|B)-[0-9]{2} ' | tr -d '| ' | sort -u) \
  <( { grep -E '^\| U[0-9]{2} \|' compare-audit.md | awk -F'|' '{print $7; print $8; print $9}' | tr -d ' ';
       grep -E '^\| X[0-9]{2} \|' compare-audit.md | awk -F'|' '{gsub(/ /,"",$3); print $3}'; } | grep -v '^－$' | sort -u )
# 類別統計：類別 聯集 A1 A2 B 只A1 只A2 只B A1已改 A2已改 B已改
grep -E '^\| U[0-9]{2} \|' compare-audit.md | awk -F'|' '
function has(x){ gsub(/ /,"",x); return x!="－" }
{ c=$5; gsub(/ /,"",c); a=has($7); a2=has($8); b=has($9)
  n[c]++; A[c]+=a; A2[c]+=a2; B[c]+=b
  oA[c]+=(a&&!a2&&!b); oA2[c]+=(!a&&a2&&!b); oB[c]+=(!a&&!a2&&b)
  fA[c]+=has($10); fA2[c]+=has($11); fB[c]+=has($12) }
END{ split("字級 字重 顏色 提示文字 版型與組合 狀態 無障礙 用詞 其他", o, " ")
  for(i=1;i<=9;i++){ c=o[i]; printf "%s %d %d %d %d %d %d %d %d %d %d\n", c, n[c], A[c], A2[c], B[c], oA[c], oA2[c], oB[c], fA[c], fA2[c], fB[c] } }'
```

4. 第 4 項的語意色對比（WCAG 相對亮度）：

```bash
python3 -I -c "
def L(h):
  r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
  f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
cr=lambda a,b:round((max(L(a),L(b))+0.05)/(min(L(a),L(b))+0.05),2)
for n,a,b in [('灰字','#babcbf','#ffffff'),('次要文字','#949699','#ffffff'),('gold','#d48806','#fffbe6'),('green','#389e0d','#f6ffed'),('cyan','#08979c','#e6fffb'),('orange','#d46b08','#fff7e6'),('success','#3c9d13','#f1fde8'),('warning','#eea23e','#fff8eb'),('error','#e2341d','#fef6f6')]: print(n,cr(a,b))"
```

5. 語法檢查（第 5 項）：用 erp 主檢出既有的 `node_modules/.pnpm/@babel+parser@7.29.2`，以 `sourceType: 'module'`、`plugins: ['jsx']` 解析步驟 1 取出的四個版本 8 檔。腳本在 `/private/tmp/claude-501/ticket42-judge/parse.cjs`，執行 `node /private/tmp/claude-501/ticket42-judge/parse.cjs`。
