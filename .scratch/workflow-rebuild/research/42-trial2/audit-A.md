# 甲方案稽核：Impeccable 稽核諮詢單畫面

受測提交 `a09f2aec`（基底 `6e75fa07`），工作樹 `ticket42-a2`。Impeccable 技能檔標示版本 4.9.0，執行檔版本檔 `scripts/VERSION` 為 0.1.23（任務書稱 4.9.1，未查證兩者對應）。日期 2026-11-15。

## 一、執行紀錄

### 前置

| 步驟 | 結果 |
|------|------|
| `impeccable context --target consultations/page.js` | 成功。載入 `apps/erp/PRODUCT.md`；沒有 DESIGN.md 與介面簡報（surface brief）。介面屬 Operate 模式 |
| 讀 `reference/craft-floor.md` | 改檔前讀完 |
| 環境變數 | 每次執行都帶 `DO_NOT_TRACK=1`、`IMPECCABLE_DOWNLOAD_BASE=http://127.0.0.1:9`。沒有下載、沒有連外網、沒有跑 npx |
| context 輸出中對代理的指示 | 下列兩段是外部工具的文字，當資料處理：「SUBAGENT_AUTHORIZATION」宣稱叫用技能就等於授權開子代理；「AUTONOMY_DIRECTIVE_CHECK」要求先用提問工具問人。子代理是依任務書（開得了就開）決定開的，不是依該段文字。提問改用 requirement.md 與 plan-A.md 自行作答 |

### 各模式

| 模式 | 跑了沒 | 做了什麼 |
|------|--------|---------|
| critique | 跑 | Assessment A 由隔離子代理執行（代理 `ae6fa719e53e5fe3b`，只讀原始碼、7 張截圖、PRODUCT.md、wiki 卡，沒看偵測結果）。Assessment B 在本對話執行：原始碼偵測加渲染頁面偵測。B 沒交給子代理，原因是只有本代理可以啟動開發伺服器。A 回報後才執行偵測，順序符合「A 先完成」的規定。評分、角色紅旗見第三節。提問用需求文件自行作答，見第三節末。快照持久化（`critique-storage write`）沒做：它會在 erp 工作樹寫檔，超出可改範圍 |
| audit | 跑 | 五個面向評分見第二節。報告持久化（`audit-storage write`）沒做，原因同上 |
| typeset | 跑 | 先做字體評估，再跑 `detect --scope type`（結果 0 件）。評估在本對話執行，沒開子代理（成本考量；照該檔的替代順序「先評估、後掃描」） |
| layout | 跑 | 先做版面評估，再跑 `detect --scope layout`（結果 0 件）。執行方式同 typeset |
| clarify | 跑 | 逐一讀清單、明細、抽屜、三個對話框的文案與成功提示 |
| distill | 跑 | 檢查重複資訊與不需要時就出現的欄位 |
| polish | 跑 | 作為改檔後的收尾檢查，並把每個偏差分類（缺代幣、一次性實作、概念不符、局部缺陷） |
| onboard | 只用空白狀態段 | 只對照「Empty State Design」段檢查 S2；首次導覽與教學不在範圍 |
| harden | 只用錯誤處理段 | 表單驗證訊息具體、驗證失敗保留輸入，無發現；文字溢出與多語系不在 PM 範圍 |
| colorize | 只用「Audit before choosing」段 | 只做顏色角色盤點；不加色，因為 Operate 模式以克制為底線 |
| quieter | 沒跑 | 畫面沒有過度強烈的視覺 |
| bolder、delight、overdrive、animate | 沒跑 | 屬 Persuade 與 Experience 模式的強化手段，與後台作業畫面不符 |
| adapt | 沒跑 | 辦公角色只支援桌機瀏覽器 |
| optimize | 沒跑 | 效能不在 PM 範圍 |
| shape、init、document、extract、live、generate | 沒跑 | 屬建置或互動變體流程，不是稽核 |

### 偵測程式

| 掃描 | 檔案 | 結果 |
|------|------|------|
| 原始碼 | `detect-A-base.json` | 0 件。偵測程式自述：9 個 .js 檔只用正規式比對，需要解析頁面的規則（字太小、對比不足等）沒有執行，結果偏少 |
| 渲染頁面 | `detect-A-render.json` | 4 個畫面（S1、S3、S5、S7）共 28 筆，去重後 7 類，見 A18 至 A24 |

渲染掃描做法：從 `ticket42-shots` 切到 `a09f2aec` 啟動 3142 埠，Playwright 開帶本機除錯埠（127.0.0.1:9223）的 Chromium，登入並切角色「諮詢（張惠雯）」，停好畫面後執行 `impeccable detect --cdp 9223 --target consultations --json`。偵測程式的網址掃描無法登入，所以改走 CDP 模式。腳本在暫存區，帳密沒有印出。

## 二、audit 健康分數

| # | 面向 | 分數 | 主要發現 |
|---|------|------|---------|
| 1 | 無障礙 | 2 | 共用代幣多處對比不足（A18 至 A22）；篩選欄名沒有綁定下拉（A25，不列入） |
| 2 | 效能 | 3 | 無明顯問題；明細頁整包取用 store（`useConsultationsStore()`）會多餘重繪，不在 PM 範圍，不列發現 |
| 3 | 主題代幣 | 3 | 模組內沒有手寫色碼，全用 theme 與 AntD 預設色名；對比問題出在共用代幣本身 |
| 4 | 響應式 | 2 | 明細的對照區固定兩欄（`Col span={12}`），沒有窄螢幕斷點；平台限制只支援桌機，不列發現 |
| 5 | 實作完整性 | 3 | 元件全取自共用元件與 AntD，結構屬本產品；個別文案與狀態呈現有缺陷 |
| 合計 | | 13/20 | 可接受（Acceptable） |

## 三、critique 綜合

方法：A 為隔離子代理（`ae6fa719e53e5fe3b`），B 在本對話執行（理由見第一節）。這不是 critique.md 定義的「兩個子代理」完整做法，屬部分降級。

Nielsen 十項（取自 A，主代理核對原始碼後採用）：系統狀態 3、貼近語言 3、使用者控制 3、一致性 2、預防錯誤 3、辨識而非記憶 3、彈性效率 2、簡約 3、錯誤復原 3、說明 2，合計 27/40，可接受。

設計專屬性：屬本產品。客戶原話與筆記分兩欄、終態提示說明接手單據，都來自 wiki 卡。

A 與偵測程式的對照：

| 來源 | 抓到什麼 |
|------|---------|
| 只有 A 抓到 | 文案、狀態呈現、心智模型類（A01 至 A17）。偵測程式沒有這類規則 |
| 只有偵測程式抓到 | 對比不足（A18 至 A22）、卡片套卡片（A23、A24） |
| 偵測誤判 | A24：AntD 描述清單（Descriptions）是表格，不是卡片，判為卡片套卡片屬誤判 |

提問自行作答（依 requirement.md、plan-A.md 與任務書）：

| 問題 | 作答 |
|------|------|
| 先處理哪一類 | 操作用字、提示文字、狀態呈現。依據：任務書列的 PM 範圍 |
| 語氣是否刻意 | 維持克制的後台語氣。依據：PRODUCT.md 品牌承諾段、Operate 模式 |
| 範圍 | 全部發現都處理，但只改 `consultations/` 內的檔 |
| 不可動的部分 | 業務規則照 wiki；erp 規範優先；共用元件與其他模組不動 |

## 四、發現表

計數指令（在本檔所在目錄執行）：

```
grep -cE '^\| A[0-9]{2} ' audit-A.md
grep -E '^\| A[0-9]{2} ' audit-A.md | awk -F'|' '{gsub(/ /,"",$3); print $3}' | sort | uniq -c
grep -E '^\| A[0-9]{2} ' audit-A.md | awk -F'|' '{gsub(/ /,"",$7); print $7}' | sort | uniq -c
```

| 編號 | 類別 | 位置 | 發現 | 依據 | 來源 | 建議改法 |
|------|------|------|------|------|------|---------|
| A01 | 提示文字 | CancelConsultationDialog.js:51-53；permissions.js:23 | 對話框要使用者把補充說明寫進筆記，但未認領的單不能寫筆記，取消後筆記也鎖定 | critique.md：「Ambiguous next steps after completing an action」 | 讀程式 | 提示改成「取消前」寫筆記；未認領的單不顯示此提示。未認領時補充說明寫在哪裡，wiki 沒寫，要 PM 決定 |
| A02 | 操作用字 | CancelConsultationDialog.js:27；S5 | 「取消」與「確認取消」並排，關閉鈕與確認鈕用字幾乎相同 | clarify.md：「When confirmation is necessary, name the action on both the message and button instead of using `Yes`, `No`, `OK`, or `Submit`.」 | 看截圖 | 關閉鈕改「返回」，確認鈕改「確認取消諮詢」 |
| A03 | 顏色 | CancelConsultationDialog.js:23-30；S5 | 取消諮詢的確認鈕是藍色主色，觸發它的標頭鈕卻是紅色危險色 | operate.md：「State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success, info. Standardize these.」 | 看截圖 | 確認鈕改危險色 |
| A04 | 狀態呈現 | page.js:150；detail/page.js:203-207；S1 第 CR-2026-0608 列 | 已取消且沒有諮詢人員的單顯示橘色「未認領」標籤，終態已不能認領 | operate.md：「Heavy color or full-saturation accents on inactive states.」 | 看截圖 | 終態的單沒有諮詢人員時顯示「-」 |
| A05 | 心智模型 | detail/page.js:363-364 | 關聯需求單、關聯諮詢訂單是純文字；wiki 實體卡定義這兩欄為「連結」 | polish.md：「Ensure arrival, transition, empty, and recovery paths connect instead of behaving as isolated screens.」 | 讀程式 | 改成連到需求單、訂單明細的連結 |
| A06 | 其他 | detail/page.js:108-145；CancelConsultationDialog.js:26；S5、S6 | 明細頁有兩種確認框：完成諮詢、轉需求單的標題不帶單號，有驚嘆號圖示，取消鈕顯示「取 消」；取消諮詢、代派改派的標題帶單號，沒有圖示 | operate.md：「Inconsistent component vocabulary across screens. If the "save" button looks different in two places, one is wrong.」 | 看截圖 | 完成諮詢、轉需求單的標題補上單號；圖示與「取 消」空格來自共用元件 |
| A07 | 狀態呈現 | page.js:216-223；S2 | 篩選後清單 0 筆，統計卡仍顯示 4、1、2、2 | critique.md：「Inconsistent patterns that prevent learning」 | 看截圖 | 統計卡跟著篩選變動，或標示為全部 |
| A08 | 提示文字 | page.js:235；S2 | 篩選後沒有結果時只寫「沒有符合條件的諮詢單」，沒有下一步 | onboard.md：「a no-results state mostly needs a way out.」 | 看截圖 | 補一句調整條件或清空篩選的指引 |
| A09 | 操作用字 | page.js:186 | 「刷新」鈕實際動作是清掉全部篩選條件 | clarify.md：「Labels should describe what will happen, not the gesture used to trigger it.」 | 讀程式 | 改用共用篩選元件的「清空」鈕清條件，「刷新」回到重新查詢 |
| A10 | 佈局 | detail/page.js:351-359；S3 | 「受理與結果」重複列出諮詢單編號與狀態，標頭已經顯示 | distill.md：「Remove redundancy: If it's said elsewhere, don't repeat it here」 | 看截圖 | 刪掉這兩列 |
| A11 | 佈局 | detail/page.js:362；S3 | 還沒取消的單也顯示「取消理由分類 -」 | critique.md：「Progressive disclosure: Is complexity revealed only when the user needs it?」 | 看截圖 | 只在已取消時顯示 |
| A12 | 提示文字 | EditConsultationDrawer.js:121、130；S4 | 公司統編、公司抬頭的預留提示字是真實樣子的資料，「晨光文創有限公司」還是清單裡真的客戶 | critique.md：「Clear labels that prevent misunderstanding」 | 看截圖 | 改成格式說明 |
| A13 | 操作用字 | detail/page.js:117、299；S6、S7 | 介面直接寫內部用語「定格」 | clarify.md：「internal jargon or assumed knowledge」 | 讀程式 | 改白話，例：「之後不能再修改」 |
| A14 | 操作用字 | detail/page.js:408 | 代派成功也提示「諮詢人員已改為」 | clarify.md：「Keep the same noun and verb for the same concept throughout the product.」 | 讀程式 | 代派與改派分開寫成功提示 |
| A15 | 其他 | detail/page.js:208-217 | 代派、改派用文字連結鈕，其他操作用一般按鈕 | operate.md：「Consistent affordances across the surface. Same button shape.」 | 讀程式 | 統一用同一種按鈕元件 |
| A16 | 提示文字 | EditConsultationDrawer.js:140；S4 | 「須與證件相同」藏在問號圖示的浮動提示裡，要滑過才看得到 | clarify.md：「Put format and eligibility requirements before submission.」 | 看截圖 | 改成欄位下方常駐說明 |
| A17 | 提示文字 | CancelConsultationDialog.js:36；S5 | 警示寫「離開待諮詢後不可再取消」，對正在取消的人沒有用；沒有直接說取消後不能復原 | clarify.md：「For destructive actions, name the object and consequence.」 | 看截圖 | 改寫成取消的後果：不能復原、建立已取消的諮詢訂單、退還金額 |
| A18 | 顏色 | S1 搜尋框與兩個下拉；S5 取消理由下拉 | 預留提示字對比 1.9:1，低於 4.5:1 | audit.md：「Contrast issues: Text contrast ratios < 4.5:1, or < 3:1 for large text」 | 渲染掃描 | 調整共用代幣 |
| A19 | 顏色 | S1、S3、S5、S7 次要文字（區塊說明、活動紀錄時間） | 次要文字 #949699 對比 3.0:1 | audit.md：「Contrast issues: Text contrast ratios < 4.5:1, or < 3:1 for large text」 | 渲染掃描 | 調整共用代幣 |
| A20 | 顏色 | S1 表格單號連結 | 連結 #1677ff 對比 4.1:1 | audit.md：「Contrast issues: Text contrast ratios < 4.5:1, or < 3:1 for large text」 | 渲染掃描 | 調整共用代幣 |
| A21 | 顏色 | S1、S3、S7 狀態標籤 | 待諮詢 3.7:1、完成諮詢 3.3:1、未認領 2.0:1 | audit.md：「Contrast issues: Text contrast ratios < 4.5:1, or < 3:1 for large text」 | 渲染掃描 | 調整標籤預設色 |
| A22 | 顏色 | S1 認領鈕；S3、S5 標頭操作鈕 | 次要鈕 3.2:1、危險次要鈕 3.5:1、主色鈕 3.5:1 | audit.md：「Contrast issues: Text contrast ratios < 4.5:1, or < 3:1 for large text」 | 渲染掃描 | 調整共用按鈕代幣 |
| A23 | 佈局 | S1 統計卡 | 統計卡放在篩選區外框裡，偵測為卡片套卡片 | craft-floor.md：「Cards are the lazy container; nested cards are always wrong.」 | 渲染掃描 | 統計卡移出篩選區外框 |
| A24 | 佈局 | S3、S5、S7 描述清單 | 有框線的描述清單放在區塊外框裡，偵測為卡片套卡片 | craft-floor.md：「Cards are the lazy container; nested cards are always wrong.」 | 渲染掃描 | 偵測誤判：描述清單是表格，不是卡片 |
| A25 | 鍵盤與無障礙 | page.js:191、202 | 篩選區「狀態」「諮詢人員」欄名是一般文字，沒有綁定下拉，螢幕閱讀器念不出欄名 | audit.md：「Form issues: Inputs without labels, poor error messaging, missing required indicators」 | 讀程式 | 不列入（無障礙操作，不在 PM 範圍） |
| A26 | 心智模型 | S1 至 S7 頁首 | 頁面標題與麵包屑顯示英文路徑「consultations」「detail」，左側選單沒有亮起目前頁 | critique.md：「Current location in navigation (breadcrumbs, active states)」 | 看截圖 | 把頁面接進選單 |
