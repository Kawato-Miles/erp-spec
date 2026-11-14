# 票 42 第二回實測：稽核發現核對與成品事實比對

日期 2026-11-15。判定者只核對事實，不給設計意見，不評畫面好壞。

## 判定規則與代號

| 項目 | 內容 |
|------|------|
| 屬實 | 發現描述的現象在該方案初版提交存在，且依據條文確實這樣要求 |
| 不屬實 | 現象不存在，或稽核者自己判定為誤判 |
| 要看畫面 | 程式與既有截圖都無法確認 |
| 不列入 | 鍵盤操作與無障礙（含文字對比度）。只標記，不計入任何件數 |
| 與 erp 規範 | 依據條文與 erp 規範（`Designs.md`、`docs/recipes/`、`docs/component-catalog.md`）的關係：一致、衝突、無對應（erp 規範沒有這條，依據來自稽核工具或票 42 草稿） |
| 甲初版 | `ticket42-a2` 提交 `a09f2aec`；甲改後 `d8e22923` |
| 乙初版 | `ticket42-r2-b` 提交 `8af55053`；乙改後 `0d87b756` |
| 路徑簡寫 | 檔案路徑都在 `apps/erp/src/app/(prototype)/consultations/` 之下。`page.js`＝清單頁，`detail.js`＝`detail/page.js` |
| 截圖 | `/tmp/workflow-rebuild-ticket42-trial-20261114/shots2/`。開工時有 `a1-S1` 至 `a1-S7`、`b1-S1` 至 `b1-S7`、`a2-S1` 至 `a2-S4`；沒有 `b2-*`。改後畫面除 `a2-S3` 外以程式為準 |
| wiki 卡 | 實體卡＝`05-entities/售前/諮詢單.md`；狀態機卡＝`06-state-machines/售前/諮詢單狀態.md`（wiki 根目錄見 `requirement.md`） |

讀某版本的檔：`git -C /Users/b-f-03-029/erp/.claude/worktrees/<工作樹> show <提交碼>:'apps/erp/src/app/(prototype)/consultations/<檔>' | cat -n`

## 第一節：發現是否屬實

### 甲（對照 `a09f2aec`）

| 編號 | 類別 | 判定 | 與 erp 規範 | 證據 |
|------|------|------|------|------|
| A01 | 提示文字 | 屬實 | 無對應 | `CancelConsultationDialog.js:51-53` 不分有無諮詢人員都顯示「請寫在諮詢人員筆記」；`permissions.js:23` 筆記限已認領，`permissions.js:26` 未認領也能取消；實體卡第 61 行「終態後鎖定」 |
| A02 | 操作用字 | 屬實 | 無對應 | `CancelConsultationDialog.js:27` 確認鈕「確認取消」；PanelDialog 預設關閉鈕「取消」；a1-S5 兩鈕並排 |
| A03 | 顏色 | 屬實 | 無對應 | `CancelConsultationDialog.js:23-30` 沒有傳 danger；`detail.js:179` 標頭鈕有 danger；a1-S5 確認鈕藍色 |
| A04 | 狀態呈現 | 屬實 | 無對應 | `page.js:150`、`detail.js:203-207`；`mock-data.js:315-331` CR-2026-0608 為已取消且諮詢人員空值；a1-S1 該列顯示橘色「未認領」 |
| A05 | 心智模型 | 屬實 | 無對應 | `detail.js:363-364` 純文字；實體卡第 63-64 行欄位形態為「連結」 |
| A06 | 其他 | 屬實 | 無對應 | a1-S5 標題帶單號、無圖示；a1-S6 標題無單號、有驚嘆號、關閉鈕顯示「取 消」；`detail.js:111`、`detail.js:132` 標題無單號 |
| A07 | 狀態呈現 | 屬實 | 無對應 | `page.js:77-83` 統計只依可見範圍算，不依篩選；a1-S2 清單 0 筆、統計卡 4、1、2、2 |
| A08 | 提示文字 | 屬實 | 無對應 | `page.js:235`；a1-S2 只有「沒有符合條件的諮詢單」，篩選區沒有「清空」鈕 |
| A09 | 操作用字 | 屬實 | 無對應 | `page.js:186` `onRefresh` 實際清空篩選；a1-S1 鈕名「刷新」 |
| A10 | 佈局 | 屬實 | 無對應 | `detail.js:351-359` 列出編號與狀態；`detail.js:239-244` 標頭已顯示 |
| A11 | 佈局 | 屬實 | 無對應 | `detail.js:362`；a1-S3 待諮詢單顯示「取消理由分類 -」；實體卡第 62 行「其他狀態空白」 |
| A12 | 提示文字 | 屬實 | 無對應 | `EditConsultationDrawer.js:121、130` 灰字「24681357」「晨光文創有限公司」，與 `mock-data.js:19-20` CR-2026-0611 的值相同 |
| A13 | 操作用字 | 屬實 | 無對應 | `detail.js:117`「狀態定格」、`detail.js:299`「已定格」；「定格」不在 ERP 詞彙表（`grep -n 定格 "ERP 詞彙表.md"` 0 筆），出自狀態機卡 |
| A14 | 操作用字 | 屬實 | 無對應 | `detail.js:408` 代派、改派共用「諮詢人員已改為」 |
| A15 | 其他 | 屬實 | 無對應（既有模組同做法） | `detail.js:208-217` 用 AntD 文字連結鈕；需求單明細 `quote-prototype/detail/page.js:1247-1249`（基底 `6e75fa07`）改派鈕也是文字連結鈕 |
| A16 | 提示文字 | 屬實 | 無對應 | `EditConsultationDrawer.js:140` `tooltip`；a1-S4 聯絡人旁問號圖示 |
| A17 | 提示文字 | 屬實 | 無對應 | `CancelConsultationDialog.js:36` 含「離開待諮詢後不可再取消」，沒有「不能復原」 |
| A18 | 鍵盤與無障礙（原歸顏色，判定者改歸） | 不列入 | — | 文字對比度屬無障礙。`detect-A-render.json` 確有 low-contrast 紀錄 |
| A19 | 鍵盤與無障礙（同上） | 不列入 | — | 同上 |
| A20 | 鍵盤與無障礙（同上） | 不列入 | — | 同上 |
| A21 | 鍵盤與無障礙（同上） | 不列入 | — | 同上 |
| A22 | 鍵盤與無障礙（同上） | 不列入 | — | 同上 |
| A23 | 佈局 | 屬實 | 無對應（既有模組同做法） | `page.js:216-223` StatCards 放在 GenericFilter 內；需求單清單 `quote-prototype/_components/QuoteList.js:372-377`（基底）同樣放在 GenericFilter 內 |
| A24 | 佈局 | 不屬實 | — | 稽核者自判偵測誤判：描述清單是表格，不是卡片 |
| A25 | 鍵盤與無障礙 | 不列入 | — | 稽核者已標不列入 |
| A26 | 心智模型 | 屬實 | 無對應 | a1-S1 至 a1-S7 頁首「consultations（prototype）」「detail（prototype）」；a1-S1 左側選單沒有亮起 |

甲小計：屬實 19、不屬實 1、要看畫面 0、不列入 6，合計 26。

### 乙（對照 `8af55053`）

| 編號 | 類別 | 判定 | 與 erp 規範 | 證據 |
|------|------|------|------|------|
| B01 | 佈局 | 屬實 | 部分衝突 | `EditConsultationDrawer.js:72、97、109、127` gutter 16；`detail.js:191、219` gutter 24。詳情頁配方 `detail-page.recipe.md:52` 範例碼本身寫 `gutter={24}`，明細頁兩處與配方一致 |
| B02 | 佈局 | 屬實 | 衝突 | `EditConsultationDrawer.js:59` 用 PanelDrawer。`component-catalog.md:108-109` 把 PanelDrawer 的用途寫為「詳情頁的編輯表單抽屜」 |
| B03 | 心智模型 | 屬實 | 一致 | `page.js:73`「預約日期時間」；實體卡第 47 行「預約日期／預約時間」 |
| B04 | 心智模型 | 屬實 | 一致 | `detail.js:235-236` 標籤帶「（僅供參考）」「（唯讀）」 |
| B05 | 操作用字 | 屬實 | 無對應 | `detail.js:313`「已指派諮詢人員」；`ConsultationDialogs.js:67` 代派標籤「指派給」 |
| B06 | 操作用字 | 屬實 | 無對應 | `detail.js:283`「已儲存諮詢單」、`detail.js:296`「已儲存諮詢人員筆記」；`EditConsultationDrawer.js:64`、`ConsultationDialogs.js:25` 確認鈕「儲存」 |
| B07 | 操作用字 | 屬實 | 無對應 | `detail.js:284`「沒有變更」 |
| B08 | 操作用字 | 屬實 | 無對應 | b1-S4 抽屜「取消」；`ConsultationDialogs.js:24、59、93` 對話框「返回」 |
| B09 | 提示文字 | 屬實 | 無對應 | `ConsultationDialogs.js:89、111` 標題與警示都沒有單號；b1-S5 |
| B10 | 其他（與 A26 同型，判定者歸心智模型） | 屬實 | 無對應 | b1-S1 至 b1-S7 頁首英文 |
| B11 | 狀態呈現 | 屬實 | 無對應 | `page.js:151` 不分有無篩選 |
| B12 | 字重 | 屬實 | 無對應 | 主題代幣 `design-tokens.json` 的 global 沒有 fontWeightStrong，AntD 預設 600；`layout.js:44` 只載入 400、500、700；`ActivityTimeline.js:55` 用 `strong`。計算後字重沒量（乙稽核也標明是推論） |
| B13 | 顏色 | 屬實 | 衝突 | `ConsultationStatusTag.js:8` purple。依據是票 42 草稿條目（checklist T10）；`Designs.md:89、107` 允許紫色作標籤點綴 |
| B14 | 提示文字 | 屬實 | 無對應 | `ConsultationDialogs.js:69、121` |
| B15 | 提示文字 | 屬實 | 無對應 | `ConsultationDialogs.js:29-31` |
| B16 | 提示文字 | 屬實 | 無對應 | `ConsultationDialogs.js:76` |
| B17 | 提示文字 | 屬實 | 無對應 | `ConsultationDialogs.js:111` |
| B18 | 提示文字 | 屬實 | 無對應 | `detail.js:108`，字數 61（`python3 -c` 計算） |
| B19 | 提示文字 | 屬實 | 無對應 | `detail.js:126`，字數 58 |
| B20 | 提示文字 | 屬實 | 無對應 | `detail.js:175-181`；b1-S7 提示條「已收尾於「完成諮詢」」與狀態標籤並存 |

乙小計：屬實 20、不屬實 0、要看畫面 0、不列入 0，合計 20。其中依據與 erp 規範衝突或部分衝突 3 件（B01、B02、B13）。

## 第二節：互相漏抓

「有（部分）」指只有一部分現象存在。稽核欄「部分」指發現只涵蓋一部分，小計不算抓到。

| # | 問題 | 類別 | 甲初版 | 甲稽核 | 乙初版 | 乙稽核 |
|---|------|------|------|------|------|------|
| 1 | 取消時提示寫筆記，但筆記可能寫不了或取消後鎖定 | 提示文字 | 有：`CancelConsultationDialog.js:51-53` | A01 | 有（部分）：`ConsultationDialogs.js:118` 提示補充寫筆記，取消後筆記鎖定（`permissions.js:27`） | 未抓；T15 判此句符合（audit-B 第 80 行） |
| 2 | 關閉鈕與確認鈕用字幾乎相同 | 操作用字 | 有：a1-S5「取消／確認取消」 | A02 | 無：b1-S5「返回／取消諮詢」 | — |
| 3 | 取消的確認鈕不是危險色 | 顏色 | 有：a1-S5 | A03 | 無：`ConsultationDialogs.js:96-99` 有 danger | — |
| 4 | 終態單沒有諮詢人員時顯示「未認領」 | 狀態呈現 | 有：a1-S1 CR-2026-0608 | A04 | 有：`page.js:83`、`detail.js:196`；b1-S1 CR-2026-0611 已取消列 | 未抓；只在第三節第 2 點記錄為空值不一致 |
| 5 | 關聯需求單、關聯諮詢訂單不是連結 | 心智模型 | 有：`detail.js:363-364` | A05 | 有：`detail.js:199-200` | 未抓；只在第三節第 3 點記錄 |
| 6 | 確認框兩種樣式並存（圖示有無、關閉鈕字距） | 其他 | 有：a1-S5、a1-S6 | A06 | 有（部分）：b1-S5 無圖示、b1-S6 有圖示且關閉鈕顯示「返 回」；標題都不帶單號，標題一致 | 未抓 |
| 7 | 統計卡不跟篩選變動 | 狀態呈現 | 有：a1-S2 | A07 | 無：沒有統計卡 | — |
| 8 | 篩選無結果時沒有下一步 | 提示文字 | 有：a1-S2 | A08 | 有（部分）：`page.js:151` 文案沒有下一步；但 b1-S2 篩選區有「清空」鈕 | 未抓 |
| 9 | 「刷新」鈕實際清空篩選 | 操作用字 | 有：`page.js:186` | A09 | 無：乙的刷新是元件預設的重新查詢（第三節第 1 點記錄「按了沒有作用」，屬另一種問題） | — |
| 10 | 同一區塊重複列出編號與狀態 | 佈局 | 有：`detail.js:351-359` | A10 | 無：乙明細沒有標頭，編號與狀態只列一次 | — |
| 11 | 非已取消的單也列出取消理由分類 | 佈局 | 有：a1-S3 | A11 | 有：`detail.js:198`；b1-S3 待諮詢單「取消理由分類 —」 | 未抓 |
| 12 | 灰字是真實樣子的資料 | 提示文字 | 有：`EditConsultationDrawer.js:121、130` | A12 | 無：抽屜輸入框沒有灰字 | — |
| 13 | 畫面寫內部用語「定格」 | 操作用字 | 有：`detail.js:117、299` | A13 | 有：`detail.js:108、126` | B18、B19（以規則全文角度，內含「定格」） |
| 14 | 代派的訊息或標籤用了別的動詞 | 操作用字 | 有：`detail.js:408`；`AssignConsultantDialog.js:36`「指派給」 | A14（部分：未提「指派給」標籤，小計仍計抓到，因成功訊息為主體） | 有：`detail.js:313`、`ConsultationDialogs.js:67` | B05 |
| 15 | 代派改派用文字連結鈕，其他用一般鈕 | 其他 | 有：`detail.js:208-217` | A15 | 無：全用 AppButton | — |
| 16 | 欄位規定藏在問號圖示 | 提示文字 | 有：`EditConsultationDrawer.js:140` | A16 | 無：`EditConsultationDrawer.js:94` 用常駐說明 | — |
| 17 | 取消警示寫「離開待諮詢後不可再取消」 | 提示文字 | 有：`CancelConsultationDialog.js:36` | A17 | 有：`ConsultationDialogs.js:111` | B17 |
| 18 | 統計卡放在篩選區外框 | 佈局 | 有：`page.js:216-223` | A23 | 無：沒有統計卡 | — |
| 19 | 頁首顯示英文路徑 | 心智模型 | 有：a1-S1 至 a1-S7 | A26 | 有：b1-S1 至 b1-S7 | B10（未提選單沒亮） |
| 20 | 版面間距手寫數字 | 佈局 | 有：`EditConsultationDrawer.js:79、111、135、175`、`detail.js:279` | 未抓；主題代幣面向只看色碼 | 有 | B01 |
| 21 | 編輯抽屜用 PanelDrawer（依據與 erp 元件目錄衝突） | 佈局 | 有：`EditConsultationDrawer.js:64` | 未抓 | 有 | B02 |
| 22 | 欄名不是實體卡欄位名 | 心智模型 | 有：`page.js:133`、`detail.js:260`「預約時段」；`page.js:137`「客戶」 | 未抓 | 有 | B03 |
| 23 | 欄位標籤自加註記 | 心智模型 | 無 | — | 有 | B04 |
| 24 | 編輯、筆記的確認鈕與成功訊息不用操作名稱 | 操作用字 | 有：`EditConsultationDrawer.js:70`「儲存」、`detail.js:384`「諮詢單已更新」、`detail.js:304`「撰寫筆記」、`detail.js:326`「儲存筆記」、`detail.js:160`「筆記已儲存」 | 未抓 | 有 | B06 |
| 25 | 同一操作出現編輯、修改、更新、變更等叫法 | 操作用字 | 有：`EditConsultationDrawer.js:75`「修改會寫入活動紀錄」、`detail.js:384`「已更新」 | 未抓 | 有 | B07 |
| 26 | 離開鈕用字不一致（抽屜與對話框不同） | 操作用字 | 無：初版都是「取消」（確認框的字距問題歸第 6 列） | — | 有 | B08 |
| 27 | 取消確認沒寫出是哪一張單 | 提示文字 | 無：`CancelConsultationDialog.js:26` 標題帶單號 | — | 有 | B09 |
| 28 | 空白狀態不分有無篩選 | 狀態呈現 | 無：`page.js:235` 已分寫 | — | 有 | B11 |
| 29 | 渲染字重 600 不在載入範圍 | 字重 | 有：`page.js:228` Table 表頭、`detail.js:111、132` 確認框標題、共用 ActivityTimeline | 未抓；typeset 偵測 0 件 | 有 | B12 |
| 30 | 狀態標籤用調色盤色名 purple（依據與 Designs.md 衝突） | 顏色 | 有：`constants.js:22`；另 `page.js:41-42` 統計卡圖示用 `theme.colors.purple` | 未抓；主題代幣面向寫「全用 AntD 預設色名」 | 有 | B13 |
| 31 | 灰字寫「請選擇」或「選擇」加欄位名 | 提示文字 | 有：`CancelConsultationDialog.js:43`、`AssignConsultantDialog.js:38`；另 `page.js:193、204`、`EditConsultationDrawer.js:191、200、209` 為「請選擇」 | 未抓 | 有 | B14 |
| 32 | 說明段寫欄位規則 | 提示文字 | 有：`detail.js:284`、`detail.js:299` 區塊說明；`EditConsultationDrawer.js:75` 抽屜提示 | 未抓 | 有 | B15 |
| 33 | 對話框寫狀態機規則句 | 提示文字 | 無：代派改派對話框沒有說明句 | — | 有 | B16 |
| 34 | 轉需求單確認框寫規則全文 | 提示文字 | 有：`detail.js:135-136` | 未抓 | 有 | B18 |
| 35 | 完成諮詢確認框寫規則全文 | 提示文字 | 有：`detail.js:114-117` | 部分（A13 只就「定格」一詞） | 有 | B19 |
| 36 | 終態頁頂提示重述狀態 | 提示文字 | 有：`detail.js:46-78` OutcomeAlert，a1-S7 提示條與狀態標籤並存（另含接手單據資訊） | 未抓 | 有 | B20 |

### 小計（以類別為列）

| 類別 | 甲成品有此問題 | 甲稽核抓到 | 乙成品有此問題 | 乙稽核抓到 |
|------|------|------|------|------|
| 佈局 | 5 | 3 | 3 | 2 |
| 心智模型 | 3 | 2 | 4 | 3 |
| 操作用字 | 6 | 4 | 5 | 5 |
| 狀態呈現 | 2 | 2 | 2 | 1 |
| 字重 | 1 | 0 | 1 | 1 |
| 顏色 | 2 | 1 | 1 | 1 |
| 提示文字 | 10 | 5 | 10 | 8 |
| 其他 | 2 | 2 | 1 | 0 |
| 合計 | 31 | 19 | 27 | 21 |

小計附註：

- 乙稽核抓到 21 列，但發現只有 20 件。原因是第 13 列由 B18、B19 一併涵蓋。
- 「有（部分）」計入「成品有此問題」：乙第 1、6、8 列。
- 第 21 列（PanelDrawer）與第 30 列（purple）的依據與 erp 規範衝突。兩列都扣掉時，甲成品有 29、甲抓到 19；乙成品有 25、乙抓到 19。
- 重現：歸類是人工判斷；小計可由上表機械重算。計數規則：初版欄以「有」開頭算有；稽核欄以「未」「部分」開頭或為「—」算沒抓到。

```
awk '/^## 第二節/,/^### 小計/' compare-audit.md | grep -E '^\| [0-9]+ \| ' | python3 -c "
import sys,collections
c=collections.defaultdict(lambda:[0,0,0,0])
for l in sys.stdin:
    f=[x.strip() for x in l.split('|')[1:-1]]
    miss=lambda s: s.startswith('未') or s.startswith('部分') or s=='—'
    ah=f[3].startswith('有'); bh=f[5].startswith('有')
    v=c[f[2]]; v[0]+=ah; v[1]+=ah and not miss(f[4]); v[2]+=bh; v[3]+=bh and not miss(f[6])
for k,v in c.items(): print(k,v)"
```

## 第三節：修改結果

### 甲（`a09f2aec` 到 `d8e22923`）

| 編號 | 類別 | 結果 | 證據與理由核對 |
|------|------|------|------|
| A01 | 提示文字 | 已改掉 | `CancelConsultationDialog.js:67-74`（改後）只在已認領時顯示，並寫「取消前」 |
| A02 | 操作用字 | 已改掉 | 改後 `CancelConsultationDialog.js:34、43`「返回」「確認取消諮詢」 |
| A03 | 顏色 | 已改掉 | 改後 `CancelConsultationDialog.js:39` danger |
| A04 | 狀態呈現 | 已改掉 | 改後 `page.js:152-153`、`detail.js:206-207` |
| A05 | 心智模型 | 沒改 | 理由是目標頁對不上單號，屬實作限制，不是 erp 規範。理由未查證（沒核對需求單明細的開頁參數） |
| A06 | 其他 | 部分 | 標題已補單號（改後 `detail.js:112、133`）。圖示寫死在共用 `ConfirmModal.js:18`，理由成立。「取 消」字距來自 AntD 按鈕自動插空白，是否一定要改共用元件才能避開，未查證 |
| A07 | 狀態呈現 | 沒改 | 理由引狀態機卡第 86 行「列表按狀態分組就是諮詢成效報表」，原文屬實 |
| A08 | 提示文字 | 已改掉 | 改後 `page.js:239-242` |
| A09 | 操作用字 | 已改掉 | 改後 `page.js:189` 改接 `onClearFilters` |
| A10 | 佈局 | 已改掉 | 改後 `detail.js:355-367`；a2-S3 受理與結果只剩諮詢人員、諮詢費、關聯需求單、關聯諮詢訂單 |
| A11 | 佈局 | 已改掉 | 改後 `detail.js:359-361`；a2-S3 待諮詢單不再列取消理由分類 |
| A12 | 提示文字 | 已改掉 | 改後 `EditConsultationDrawer.js:121、130`。新灰字見下方改壞第 2 點 |
| A13 | 操作用字 | 已改掉 | 改後畫面字串沒有「定格」（只剩 `detail.js:45` 程式註解） |
| A14 | 操作用字 | 已改掉 | 改後 `detail.js:410、413`。`AssignConsultantDialog.js:36` 代派標籤仍是「指派給」，不在 A14 範圍 |
| A15 | 其他 | 攔下 | 理由是需求單明細同做法，事實成立（基底 `quote-prototype/detail/page.js:1247-1249`）。erp 規範原文沒有對應條文 |
| A16 | 提示文字 | 已改掉 | 改後 `EditConsultationDrawer.js:140` `extra` |
| A17 | 提示文字 | 已改掉 | 改後 `CancelConsultationDialog.js:52` |
| A23 | 佈局 | 攔下 | 理由分兩部分。「資源列表頁配方的組法」不成立：`resource-page.recipe.md` 沒有 StatCards。「其他模組相同」成立：`QuoteList.js:372-377` |
| A26 | 心智模型 | 沒改 | 理由是共同條件第 3 點禁止改選單，原文屬實 |

範圍外：A18 至 A22 攔下，理由引 `Designs.md:240`「手寫 hex」列在 Don't 欄，原文屬實；A24、A25 沒改。

越界改動：沒有。diff 的每段都對應上表編號（`git -C …/ticket42-a2 diff a09f2aec d8e22923`）。

改壞或造成新不一致（3 件）：

| # | 事實 | 證據 |
|---|------|------|
| 1 | 離開鈕用字變得不一致：取消諮詢對話框改成「返回」，其他地方仍是「取消」 | 改後 `CancelConsultationDialog.js:34`「返回」；`AssignConsultantDialog.js` 用 PanelDialog 預設「取消」（共用 `PanelDialog.js:55`）；抽屜「取消」（共用 `PanelDrawer.js:77`）；筆記編輯 `detail.js:328`「取消」；確認框預設「取消」（共用 `ConfirmModal.js` cancelText 預設值） |
| 2 | 新灰字「請輸入公司抬頭」是「請輸入」加欄位名；同抽屜其他灰字是格式範例 | 改後 `EditConsultationDrawer.js:130`；對照 `EditConsultationDrawer.js:148、153、170` |
| 3 | 終態筆記說明改成「諮詢已結束」，也套用在已取消的單；狀態機卡寫取消限「諮詢尚未進行」 | 改後 `detail.js:302-304`（條件是 terminal，含已取消）；狀態機卡第 76 行 |

### 乙（`8af55053` 到 `0d87b756`）

| 編號 | 類別 | 結果 | 證據與理由核對 |
|------|------|------|------|
| B01 | 佈局 | 已改掉 | 改後 `EditConsultationDrawer.js:73、98、110、128`、`detail.js:180、208` |
| B02 | 佈局 | 攔下 | 理由引 `component-catalog.md:108-109`，原文屬實 |
| B03 | 心智模型 | 已改掉 | 改後 `page.js:73` |
| B04 | 心智模型 | 已改掉 | 改後 `detail.js:224-225` |
| B05 | 操作用字 | 已改掉 | 改後 `detail.js:303`、`ConsultationDialogs.js:64` |
| B06 | 操作用字 | 部分 | 成功訊息已改（改後 `detail.js:272、285`）；確認鈕仍「儲存」（`EditConsultationDrawer.js:65`、`ConsultationDialogs.js:25`） |
| B07 | 操作用字 | 已改掉 | 改後 `detail.js:273` |
| B08 | 操作用字 | 攔下 | 理由是 PanelDrawer 的「取消」寫死，原文屬實（共用 `PanelDrawer.js:77`，沒有 cancelText 屬性）；不能改共用元件出自共同條件第 3 點 |
| B09 | 提示文字 | 已改掉 | 改後 `ConsultationDialogs.js:102` |
| B10 | 其他 | 攔下 | 理由是共同條件第 3 點，原文屬實 |
| B11 | 狀態呈現 | 已改掉 | 改後 `page.js:150-155` |
| B12 | 字重 | 攔下 | 理由是要改全域主題，超出可改目錄，屬實 |
| B13 | 顏色 | 已改掉 | 改後 `ConsultationStatusTag.js:8`。造成新問題，見下方 |
| B14 | 提示文字 | 已改掉 | 兩個灰字已刪 |
| B15 | 提示文字 | 已改掉 | 說明段已刪 |
| B16 | 提示文字 | 已改掉 | 說明句已刪 |
| B17 | 提示文字 | 已改掉 | 改後 `ConsultationDialogs.js:102` 沒有規則句 |
| B18 | 提示文字 | 已改掉 | 改後 `detail.js:105` |
| B19 | 提示文字 | 已改掉 | 改後 `detail.js:123` |
| B20 | 提示文字 | 已改掉 | 提示條已刪 |

越界改動：沒有。fix-B.md 自列的兩筆（`isReassign` 變數、移除 Typography 匯入）屬 B05、B15、B16 的附帶改動。

改壞或造成新不一致（1 件）：

| # | 事實 | 證據 |
|---|------|------|
| 1 | 「完成諮詢」與「已轉需求單」兩個不同狀態現在同色 | 改後 `ConsultationStatusTag.js:7-8` 都是 `success` |

### 小計（以類別為列）

| 類別 | 甲屬實數 | 甲已改掉 | 甲部分 | 甲沒改 | 甲攔下 | 乙屬實數 | 乙已改掉 | 乙部分 | 乙沒改 | 乙攔下 |
|------|------|------|------|------|------|------|------|------|------|------|
| 佈局 | 3 | 2 | 0 | 0 | 1 | 2 | 1 | 0 | 0 | 1 |
| 心智模型 | 2 | 0 | 0 | 2 | 0 | 2 | 2 | 0 | 0 | 0 |
| 操作用字 | 4 | 4 | 0 | 0 | 0 | 4 | 2 | 1 | 0 | 1 |
| 狀態呈現 | 2 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| 字重 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| 顏色 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| 提示文字 | 5 | 5 | 0 | 0 | 0 | 8 | 8 | 0 | 0 | 0 |
| 其他 | 2 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 1 |
| 合計 | 19 | 13 | 1 | 3 | 2 | 20 | 15 | 1 | 0 | 4 |
| 改壞 | 3 | | | | | 1 | | | | |

本表類別沿用各稽核檔的原類別（B10 計在「其他」）。

## 第四節：改後成品的事實比對（甲 `d8e22923`、乙 `0d87b756`）

### 操作用字（對照實體卡操作段 9 個操作名稱）

| 操作 | 甲：按鈕／標題／確認鈕／成功訊息 | 甲叫法數 | 乙：按鈕／標題／確認鈕／成功訊息 | 乙叫法數 |
|------|------|------|------|------|
| 認領諮詢單 | 清單列鈕「認領」（`page.js:162`）、明細鈕「認領諮詢單」（`detail.js:191`）／無對話框／—／「已認領 {單號}」（`page.js:115`）、「已認領這張諮詢單」（`detail.js:150`） | 按鈕 2 | 明細鈕「認領諮詢單」（`detail.js:139`）／無／—／「已認領諮詢單」（`detail.js:96`） | 1 |
| 代派諮詢人員 | 鈕「代派」（`detail.js:213`）／「代派諮詢人員」／「確認」／「已代派給 X」；欄名「指派給」（`AssignConsultantDialog.js:30、31、36`；`detail.js:413`） | 3（代派、代派諮詢人員、指派） | 鈕、標題、確認鈕都是「代派諮詢人員」／「已代派諮詢人員 X」；欄名「代派給」（`detail.js:144`；`ConsultationDialogs.js:55、57、64`；`detail.js:303`） | 1 |
| 改派諮詢人員 | 鈕「改派」（`detail.js:218`）／「改派諮詢人員」／「確認」／「已改派給 X」 | 2 | 鈕、標題、確認鈕都是「改派諮詢人員」／「已改派諮詢人員 X」 | 1 |
| 編輯諮詢單 | 鈕「編輯諮詢單」（`detail.js:176`）／「編輯諮詢單」／「儲存」／「諮詢單已更新」（`detail.js:387`）；抽屜提示用「修改」（`EditConsultationDrawer.js:75`） | 3（編輯、更新、修改） | 鈕「編輯諮詢單」（`detail.js:203`）／「編輯諮詢單」／「儲存」／「已編輯諮詢單」、「未編輯任何欄位」（`detail.js:272-273`） | 1（確認鈕為「儲存」） |
| 撰寫諮詢人員筆記 | 鈕「撰寫筆記」（`detail.js:309`）／就地編輯、無標題／「儲存筆記」（`detail.js:331`）／「筆記已儲存」（`detail.js:161`） | 2（撰寫筆記、儲存筆記），無一處用全名 | 鈕、標題「撰寫諮詢人員筆記」（`detail.js:241`；`ConsultationDialogs.js:23`）／「儲存」／「已撰寫諮詢人員筆記」（`detail.js:285`） | 1（確認鈕為「儲存」） |
| 轉需求單 | 鈕「轉需求單」／「轉需求單：{單號}」／「確認轉需求單」／「已轉需求單 {單號}」（`detail.js:186、133、140、143`） | 1 | 鈕「轉需求單」／「轉需求單」／「轉需求單」／「已轉需求單，需求單 {單號}」（`detail.js:154、108、112`） | 1 |
| 完成諮詢 | 鈕「完成諮詢」／「完成諮詢：{單號}」／「確認完成」／「已完成諮詢，建立諮詢訂單 {單號}」（`detail.js:196、112、122、125`） | 2（完成諮詢、確認完成） | 鈕、標題、確認鈕都是「完成諮詢」／「已完成諮詢，諮詢訂單 {單號}」（`detail.js:159、126、130`） | 1 |
| 取消諮詢 | 鈕「取消諮詢」／「取消諮詢：{單號}」／「確認取消諮詢」／「已取消諮詢，建立已取消的諮詢訂單 {單號}」（`detail.js:181`；`CancelConsultationDialog.js:29、43`；`detail.js:398`） | 1 | 鈕、標題、確認鈕都是「取消諮詢」／「已取消諮詢，諮詢訂單 {單號}」（`detail.js:164`；`ConsultationDialogs.js:80、94`；`detail.js:315`） | 1 |
| 檢視諮詢單 | 清單單號連結；明細標題「諮詢單 {單號}」 | — | 清單單號連結；明細頁沒有標題列，單號只在段 1 欄位 | — |
| 離開鈕（非操作） | 「返回」1 處（取消對話框）；「取消」4 類（抽屜、代派改派對話框、筆記編輯、確認框） | 2 | 「返回」4 處（3 個對話框、2 個確認框以 cancelText 傳入）；「取消」1 處（抽屜，共用元件寫死） | 2 |

### 心智模型

| 事實 | 甲 | 乙 |
|------|------|------|
| 狀態名與狀態機卡一字不差 | 是（`constants.js:11-16`） | 是（`mock-data.js:4-9`） |
| 與實體卡欄位名不同的標籤 | 「預約時段」（`page.js:134`、`detail.js:263`）；清單「客戶」欄（`page.js:138`，衍生欄）；明細區塊名「預約與客戶資料」 | 明細區塊名「客戶填寫資料」；諮詢費顯示「NT$」前綴（值格式，非標籤）。欄位標籤沒有其他不同 |
| 待諮詢且未認領時出現的操作 | 認領、代派、編輯、取消（依角色，`permissions.js:19-26`） | 認領、代派、編輯、撰寫筆記（業務主管）、取消（業務主管）（`permissions.js:20-30`） |
| 待諮詢且已認領時出現的操作 | 改派、編輯、撰寫筆記、轉需求單、完成諮詢、取消 | 改派、編輯、撰寫筆記、轉需求單、完成諮詢、取消（依本人與角色） |
| 終態出現的操作 | 無（只檢視） | 編輯諮詢單（諮詢角色，`permissions.js:25` 不限狀態；b1-S7 可見，改後未變） |
| 轉換條件與狀態機卡 | 完成、轉需求單限已認領；取消限待諮詢；符合 | 完成、轉需求單限本人負責（含已認領）；取消限待諮詢；符合 |
| 與實體卡不同的操作條件 | 編輯限待諮詢（`permissions.js:5` 自註「wiki 未寫，暫定」） | 業務主管在未認領時可撰寫筆記（`permissions.js:27`）；實體卡第 61 行寫筆記「認領後」 |
| 用不到的操作 | 隱藏（`detail.js` 以 `can(...) &&` 不渲染） | 隱藏（`detail.js` 以 `can.x &&` 不渲染） |
| 終態沒有諮詢人員時 | 顯示「-」（`page.js:152-153`、`detail.js:206-207`） | 顯示「未認領」（`page.js:83`、`detail.js:185`） |
| 狀態標籤顏色 | 待諮詢 processing、完成諮詢 success、已轉需求單 purple、已取消 default（`constants.js:19-24`） | 待諮詢 processing、完成諮詢 success、已轉需求單 success、已取消 default（`ConsultationStatusTag.js:5-10`） |

### 佈局

| 事實 | 甲 | 乙 |
|------|------|------|
| 清單篩選 | 搜尋框＋狀態下拉＋諮詢人員下拉；統計卡 4 張在篩選區內；「清空」鈕常駐、「刷新」鈕（`page.js:182-232`） | 搜尋框＋狀態按鈕組＋諮詢人員下拉；有篩選時才出現「清空」、「刷新」鈕（`page.js:103-141`；b1-S2） |
| 清單主要操作 | 表格最右「操作」欄有「認領」鈕（`page.js:155-165`） | 表格沒有操作欄；每頁 10 筆分頁（`page.js:148`） |
| 明細分區 | 標頭列（返回鈕、單號標題、狀態標籤、全部操作鈕）＋終態提示條＋預約與客戶資料＋客戶原話與筆記左右兩欄＋受理與結果＋活動紀錄；用 PanelBlock 與描述清單（a2-S3） | 無標頭列；4 段編號區塊：受理與結果、客戶填寫資料、諮詢人員筆記、活動紀錄；用 BorderBlock、SectionHeader、唯讀欄位 |
| 操作鈕位置 | 集中在標頭列右側；代派、改派在受理與結果的諮詢人員欄內；撰寫筆記在筆記區塊標題列 | 分在各段標題右側：段 1 放認領、代派、改派、轉需求單、完成、取消；段 2 放編輯；段 3 放撰寫筆記 |
| 編輯諮詢單 | 右側抽屜 PanelDrawer | 右側抽屜 PanelDrawer |
| 撰寫筆記 | 區塊內就地編輯 | 置中對話框 PanelDialog |
| 代派、改派、取消 | 置中對話框 PanelDialog | 置中對話框 PanelDialog |
| 轉需求單、完成諮詢 | 確認框（modal.confirm） | 確認框（modal.confirm） |
| 一個區塊的主按鈕數 | 標頭列最多 1 顆（認領與完成條件互斥）；取消對話框 1 顆 | 段 1 最多 1 顆（同樣互斥）；其他段 0 顆；取消對話框 1 顆 |

### 狀態呈現

| 狀態 | 甲 | 乙 |
|------|------|------|
| 空白 | 有，分有無篩選兩種文案，有篩選時附下一步（`page.js:238-242`） | 有，分有無篩選兩種文案（`page.js:150-155`） |
| 載入 | 明細頁 Suspense 用共用 Loading（`detail.js:37`）；資料在記憶體，沒有非同步載入 | 明細頁 Suspense 回傳空白（`detail.js:47`）；資料在記憶體 |
| 錯誤 | 找不到單：紅色提示條「找不到諮詢單 {單號}」，沒有返回鈕（`detail.js:100`）；無權限：清單提示條（`page.js:172-177`） | 找不到單：404 結果頁附「返回清單」鈕（`detail.js:80-90`）；無權限：403 結果頁（`page.js:91`、`detail.js:70`） |

### 字級、字重、顏色

計數指令（排除 mock-data.js）：

```
bash /private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-shipping-logistics-features-dd104a/f71ed59c-b274-42b9-af93-8cb4f5ebeb45/scratchpad/count.sh
```

指令內容（暫存區若被清掉，可照這段重建）：對每個提交執行 `git grep -nE '<樣式>' <提交碼> -- 'apps/erp/src/app/(prototype)/consultations/' ':!*mock-data.js' | wc -l`，樣式如下表。

| 項目 | 樣式 | 甲改後 | 乙改後 |
|------|------|------|------|
| 手寫字級 | `fontSize\|font-size` | 0 | 0 |
| 手寫字重 | `fontWeight\|font-weight\|[^a-zA-Z]strong([ >=]\|$)` | 0 | 0 |
| 手寫色碼 | `#[0-9a-fA-F]{3,8}\b\|rgba?\(` | 0 | 0 |
| AntD 調色盤色名字串 | `['"](purple\|blue\|green\|red\|orange\|gold\|cyan\|magenta\|volcano\|lime\|geekblue)['"]` | 1（`constants.js:22` purple） | 0 |
| theme 色階取值 | `theme\.colors\.[a-z]+\[` | 8（`page.js:32-48` 統計卡圖示，含 purple 2 處） | 1（`detail.js` 欄位標籤 `neutral[500]`） |

沒有手寫字重，但兩邊都經共用元件與 AntD 預設渲染 600 字重（Table 表頭、確認框標題、ActivityTimeline 人名）。

### 提示文字

一段＝一個獨立字串，依狀態切換的變體各算一段。字數不含程式變數。

| 類型 | 甲段數 | 甲字數 | 乙段數 | 乙字數 |
|------|------|------|------|------|
| 輸入框灰字 | 14 | 116 | 2 | 26 |
| 欄位旁說明 | 2 | 39 | 2 | 20 |
| 圖示提示 | 0 | 0 | 0 | 0 |
| 段落說明（提示條、區塊說明、確認框內文） | 14 | 327 | 3 | 104 |

清單（甲）：

- 輸入框灰字：`page.js:186、196、207`；`AssignConsultantDialog.js:38`；`CancelConsultationDialog.js:59`；`EditConsultationDrawer.js:121、130、148、153、170、191、200、209`；`detail.js:324`。其中「請選擇」單獨 5 處，「請選擇」或「請輸入」加欄位名 3 處（`AssignConsultantDialog.js:38`、`CancelConsultationDialog.js:59`、`EditConsultationDrawer.js:130`）。
- 欄位旁說明：`EditConsultationDrawer.js:140`；`CancelConsultationDialog.js:67-74`（已認領才出現）。
- 段落說明：`EditConsultationDrawer.js:75`；`CancelConsultationDialog.js:52`；`detail.js:52、58-59、64、73`（終態提示條 4 段）；`detail.js:287、303-304`（區塊說明 3 段）；`detail.js:115-118、136-137`（確認框內文 4 段）。

清單（乙）：

- 輸入框灰字：`page.js:106、133`。
- 欄位旁說明：`EditConsultationDrawer.js:95`；`ConsultationDialogs.js:109`（選「其他」才出現）。
- 段落說明：`ConsultationDialogs.js:102`；`detail.js:105、123`。

列出位置的指令：`git -C <工作樹> grep -nE 'placeholder[=:]|extra=|tooltip=|description=|secondary|message=' <提交碼> -- 'apps/erp/src/app/(prototype)/consultations/' | grep -v 'variant="secondary"' | grep -v mock-data`。乙的 `extra=` 命中裡，`detail.js:83、178、200、238` 是區塊標題的按鈕位置，不是說明，要人工剔除。字數由暫存區 python 片段計算，字串照上列位置抄錄。

## 檔尾：無法判定或沒查的項目

| 項目 | 原因 |
|------|------|
| 乙改後畫面 | 沒有 `b2-*` 截圖。乙改後事實全部以程式為準 |
| 甲改後畫面 | 只有 `a2-S1` 至 `a2-S4`，只用 `a2-S3` 核對 A10、A11。其他以程式為準 |
| B12 與第二節第 29 列 | 計算後字重沒有量，依主題代幣沒有覆寫與 AntD 預設值推論 |
| A18 至 A22 的對比數值 | 判為不列入，沒有重算對比值；只確認 `detect-A-render.json` 有 28 筆紀錄（S1 9、S3 7、S5 8、S7 4） |
| A05 沒改的理由 | 沒核對需求單明細的開頁參數與訂單模擬資料 |
| A06 字距 | 沒查 AntD 版本是否支援從模組層關掉按鈕自動插空白 |
| 第二節的歸類 | 「同一種問題」由判定者人工判斷，沒有機械指令。抽查請逐列看證據欄的行號 |
| 兩邊都沒抓的事實 | 只在第四節列出、未計入第二節：乙業務主管可在未認領時撰寫筆記；乙終態仍顯示「編輯諮詢單」；甲限制編輯只在待諮詢。實體卡外部表單欄位沒有寫狀態限制，這兩種做法都不是卡上明文 |

各節件數的重現：

```
cd /Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/.scratch/workflow-rebuild/research/42-trial2
# 第一節判定件數
awk '/^## 第一節/,/^## 第二節/' compare-audit.md | grep -E '^\| A[0-9]{2} \|' | awk -F'|' '{gsub(/ /,"",$4); print $4}' | sort | uniq -c
awk '/^## 第一節/,/^## 第二節/' compare-audit.md | grep -E '^\| B[0-9]{2} \|' | awk -F'|' '{gsub(/ /,"",$4); print $4}' | sort | uniq -c
# 第二節列數（應為 36）
awk '/^## 第二節/,/^### 小計/' compare-audit.md | grep -cE '^\| [0-9]+ \| '
# 第三節結果件數（甲 19 列、乙 20 列）
awk '/^### 甲（`a09f2aec` 到/,/^範圍外/' compare-audit.md | grep -E '^\| A[0-9]{2} ' | awk -F'|' '{gsub(/ /,"",$4); print $4}' | sort | uniq -c
awk '/^### 乙（`8af55053` 到/,/^越界改動/' compare-audit.md | grep -E '^\| B[0-9]{2} ' | awk -F'|' '{gsub(/ /,"",$4); print $4}' | sort | uniq -c
```
