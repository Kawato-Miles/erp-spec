# 票 42 實測：受測者 A2 稽核結果（Impeccable 4.9.1，偵測程式 v0.1.23）

受測工作樹：`/Users/b-f-03-029/erp/.claude/worktrees/ticket42-a2`（基底 `6e75fa07`）。路徑相對於 `apps/erp/src/app/(prototype)/`。
方法：照 Impeccable `audit`（技術稽核）流程做。代理是子代理，沒有向使用者提問的工具，訪談題由代理依 erp 文件推斷作答（見過程紀錄）。

## 一、Impeccable 的評分與總結

### 稽核健康分數（Audit Health Score）

| # | 面向 | 分數 | 關鍵發現 |
|---|------|------|---------|
| 1 | 無障礙（Accessibility） | 2 | 系統次要文字、狀態標籤、輸入框灰字對比 1.9 至 3.4:1；摘要卡只能用滑鼠點；篩選欄標題沒連到控制項 |
| 2 | 效能（Performance） | 3 | 無圖片、無動畫；P1 側板欄位定義每次重繪重建，影響輕微 |
| 3 | 主題（Theming） | 2 | 寫死字級 13、18、22、12，字重 600，間距 8px；狀態標籤用 AntD 預設色名（gold、cyan、green、red、orange），不走語意 token |
| 4 | 版面適應（Responsive Design） | 2 | 辦公角色只支援桌機；P3 在 1440 寬時「狀態」欄被固定的操作欄蓋住；P2 收款項目表 16 欄要橫向捲動 |
| 5 | 實作一致性（Implementation Integrity） | 3 | 整體照 erp 配方與共用元件；偏差集中在個別字級、紅字段落取代提示元件、卡中卡 |
| **合計** | | **12/20** | **Acceptable（10–13）** |

### 實作一致性判定（Implementation Integrity Verdict）

通過。三頁都用 erp 的共用容器（`GenericFilter`、`TableBlock`、`PanelBlock`、`BorderBlock`、`PanelDialog`、`PanelDrawer`）與 AntD 原生元件，圖示按鈕都有可及名稱（`aria-label`）與提示泡泡。偏差是零星的：P2 帳務卡片自訂字級、P1 側板用紅字段落表達錯誤、偵測程式在 P2 測到兩處卡中卡。

### 總結（Executive Summary）

- 稽核健康分數 **12/20**（Acceptable）。
- 發現 38 項：P0 0 項、P1 0 項、P2 19 項、P3 19 項。
- 最重要的下列事項：
  - 系統層的對比不足：次要文字 2.97:1、輸入框灰字 1.9:1、狀態標籤 2.8 至 3.4:1。值來自 Figma token 與 AntD 預設色，不是頁面層能修的。
  - P2 帳務卡片的字級與字重不在 erp 字級表上（13、18、22、600）。
  - P3 摘要卡只能用滑鼠操作，選中狀態只靠邊框顏色表達。
  - P3 在 1440 寬時「狀態」欄被蓋住。
  - 提示文字偏長或靠灰字說明：P1 頂部說明兩行、搜尋框灰字列四種條件。
- 建議下一步：`/impeccable typeset`、`/impeccable clarify`、`/impeccable layout`，最後 `/impeccable polish`。

## 二、發現表

嚴重度照 `audit.md`：P0 阻斷、P1 嚴重、P2 次要、P3 打磨。依據欄照抄 Impeccable 英文原文句，或寫偵測程式規則代號。

| 編號 | 頁 | 檔案與行號 | 類別 | 問題描述（使用者看到什麼） | 依據 | 來源 | 嚴重度 | 建議改法 |
|------|----|-----------|------|--------------------------|------|------|--------|---------|
| A2-01 | P1 | `production-floor/transfers/page.js` 573–579 | 提示文字 | 列表頂部固定一段兩行灰底說明（約 110 字），講 Slack 通道與補登入口。生管每次開頁都先讀到一段跟自己操作無關的長文 | `clarify.md`：Use progressive disclosure for uncommon detail. | 代理判讀 | P2 | 留一句結論，細節收進可展開說明或提示泡泡 |
| A2-02 | P1 | `production-floor/transfers/page.js` 582 | 提示文字 | 搜尋框只靠灰字列出四種可搜尋條件，一輸入就消失；同一元件灰字在 P3 實測 1.9:1 | `clarify.md`：Use persistent labels; placeholders are examples, not labels.；`craft-floor.md`：body and placeholder text ≥4.5:1, large text ≥3:1. | 代理判讀 | P2 | 把可搜尋條件改成框外常駐說明，灰字只放範例 |
| A2-03 | P1 | `production-floor/transfers/page.js` 590、601、612、625 | 無障礙 | 「狀態」「目的產線」「負責廠務」「建單時間區間」四個篩選標題是普通文字，沒連到下拉選單；螢幕閱讀器只念出「全部狀態」這類灰字 | `audit.md`：Inputs without labels, poor error messaging, missing required indicators | 代理判讀 | P2 | 每個下拉選單與日期區間補上與可見標題相同的可及名稱 |
| A2-04 | P1 | `production-floor/transfers/page.js` 590、601、612、625 | 顏色 | 篩選標題用次要文字灰（#949699），對白底 2.97:1，低於 4.5:1 | 偵測程式 `low-contrast`（P2、P3 同色值命中；P1 渲染掃描沒進到頁面） | 代理判讀 | P2 | 改用通過對比的文字色；值屬 AntD token |
| A2-05 | P1 | `production-floor/transfers/page.js` 667–673 | 狀態 | 側板裡「來源任務已無效」用一整段紅字呈現，沒有圖示、沒有標題與說明分層；JSX 換行在「已擋下，」後面多出一個空白 | `audit.md`：Look for repeated implementation shortcuts, design-system drift, misleading or decorative content, and structure that is interchangeable with an unrelated product.；`clarify.md`：An actionable error answers: | 代理判讀 | P2 | 改用 erp 的提示元件（`StyledAlert`，錯誤型），標題寫發生什麼，說明寫處置方式 |
| A2-06 | P1 | `production-floor/transfers/page.js` 709、723 | 版型與組合 | 側板「明細」「歷程」小標下方間距寫死 8px | `layout.md`：Use a documented spacing scale rather than one-off values. | 代理判讀 | P3 | 改用 `theme.spacing.xs` |
| A2-07 | P1 | `production-floor/transfers/page.js` 504–506、517 | 無障礙 | 側板明細的印件與工單連結是沒有 href 的連結，鍵盤按 Tab 跳不到 | `audit.md`：Missing focus indicators, illogical tab order, keyboard traps | 代理判讀 | P2 | 改成可聚焦的連結或按鈕型連結 |
| A2-08 | P1 | `production-floor/transfers/page.js` 428、842–843 | 提示文字 | 同一個動作，列表按鈕叫「編輯」，對話框標題叫「修改轉交單（待搬運）」、確認鈕叫「儲存修改」 | `clarify.md`：Keep the same noun and verb for the same concept throughout the product. | 代理判讀 | P3 | 統一成同一個操作名稱（照實體卡操作段） |
| A2-09 | P1 | `production-floor/transfers/page.js` 585 | 狀態 | 「刷新」按鈕按了沒有任何反應，也沒有回饋 | `critique.md`：Confirmation of user actions (save, submit, delete) | 代理判讀 | P3 | 刷新後給回饋，或 prototype 階段不顯示 |
| A2-10 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 31、38、66、73、77、103、129 | 字級 | 三方對帳卡的卡名、分項列、處理中列、差額列都用 13px，不在 erp 字級表（14、12）上 | `typeset.md`：Is there a deliberate role scale, or a collection of arbitrary values?；偵測程式規則 `design-system-font-size` 描述（本次沒觸發） | 代理判讀 | P2 | 卡名用 bodyMd 14，分項列用 bodySm 12，皆從 `theme.typography` 取值 |
| A2-11 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 132 | 字級 | 卡片主數字 22px，不在字級表（titleMd 20、titleLg 24）上；上下間距寫死 8px、12px | `typeset.md`：Is there a deliberate role scale, or a collection of arbitrary values? | 代理判讀 | P3 | 改用 titleMd 的字級與行高，間距改 `theme.spacing` |
| A2-12 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 132 | 字重 | 主數字字重 600，但 Noto Sans TC 只載入 400、500、700；瀏覽器改用 700 顯示，程式寫的值與畫面不符 | `typeset.md`：What happens with long headings, localization expansion, zoom, narrow containers, missing weights, and font fallback? | 代理判讀 | P3 | 改用 titleMd 的字重 700 |
| A2-13 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 36–42 | 顏色 | 負數分項同時設了紅色（danger）與近黑色（neutral 900），近黑色蓋過紅色；退款、折讓在這裡是黑字，在款項紀錄與發票區卻是紅字 | `polish.md`：Use semantic tokens and stable color meanings across themes. | 代理判讀 | P3 | 選定一種負數顏色，三區一致 |
| A2-14 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 89、111 | 顏色 | 差額標籤「待收款」「待開發票」用金色（gold），文字對底 2.76:1；色名是 AntD 預設色，不是 erp 的語意狀態色 | 偵測程式 `low-contrast`（2.8:1 — text #d48806 on #fffbe6） | 偵測程式 | P2 | 提高標籤文字對比；erp 只允許 token 色（見不相容紀錄） |
| A2-15 | P2 | `orders/_components/detail/billing/ReconciliationPanel.js` 176–232 | 版型與組合 | 「三方對帳」外框裡再放三張有框卡片，框中有框 | 偵測程式 `nested-cards`；`craft-floor.md`：Cards are the lazy container; nested cards are always wrong. | 偵測程式 | P3 | 內層改用分隔線與間距分組 |
| A2-16 | P2 | `ReconciliationPanel.js` 31、66、73、77、103、129；`ReceivableCard.js` 24；`PaymentRecordSection.js` 154 | 顏色 | 帳務區的卡名、欄位標題、未分配金額都用次要文字灰（#949699），對白底 2.97:1 | 偵測程式 `low-contrast`（3.0:1 — text #949699 on #ffffff (and 16 more)） | 代理判讀 | P2 | 改用通過對比的文字色；值屬 AntD token |
| A2-17 | P2 | `InstallmentSection.js` 131–142；`PaymentRecordSection.js` 122；`ReceivableCard.js` 87；`InvoiceSection.js` 86、219 | 顏色 | 付款狀態、發票狀態等標籤（綠「已收訖」「已開立」等）文字對底 3.4:1 | 偵測程式 `low-contrast`（3.4:1 — text #389e0d on #f6ffed (and 4 more)） | 偵測程式 | P2 | 提高標籤文字對比；顏色由共用元件 `StatusTag` 與 mock 狀態表提供 |
| A2-18 | P2 | `orders/_components/detail/billing/ReceivableCard.js` 24 | 字級 | 應收金額四欄的欄位標題 13px，與 P1 等頁的欄位標題 14px 不一致；下方間距寫死 8px | `typeset.md`：Keep repeated roles consistent across screens and states. | 代理判讀 | P3 | 用預設 14px，間距改 `theme.spacing.xs` |
| A2-19 | P2 | `orders/_components/detail/billing/ReceivableCard.js` 96 | 字級 | 「應收總額（含稅）」18px；同一個數字在上方對帳卡是 22px，兩處大小不同且都不在字級表上 | `typeset.md`：Keep repeated roles consistent across screens and states. | 代理判讀 | P3 | 兩處都用 titleMd 20 |
| A2-20 | P2 | `InstallmentSection.js` 101；`PaymentRecordSection.js` 38–40 | 顏色 | 已取消的收款項目與款項以半透明 0.5 呈現，文字對比降到約 3.15:1 | 偵測程式規則 `low-contrast` 描述；`critique.md`：Meaning conveyed by color alone (red = error, green = success) | 代理判讀 | P3 | 已有「已取消」標籤，可不再降透明度，或改刪除線 |
| A2-21 | P2 | `orders/_components/detail/billing/InstallmentSection.js` 90–208 | 版型與組合 | 收款項目表 16 欄加操作欄，1440 寬只看得到前 7 欄，「預計開立日期」被切掉 | `critique.md`：Is complexity revealed only when the user needs it? | 代理判讀 | P3 | 次要欄位收進展開列或欄位設定 |
| A2-22 | P2 | `InstallmentSection.js` 247–260；`InvoiceSection.js` 115–137、287–314 | 無障礙 | 停用的「取消收款項目」「作廢發票」等按鈕，停用原因只在滑鼠移上去的提示泡泡裡；鍵盤使用者跳不到、讀不到原因 | `critique.md`：Click-only interactions with no keyboard alternative | 代理判讀 | P2 | 停用原因要能用鍵盤取得（聚焦時顯示，或改成可見文字） |
| A2-23 | P2 | `orders/_components/detail/billing/InstallmentSection.js` 271 | 提示文字 | 區塊說明要使用者找「開立發票圖示」，但該圖示沒有文字標籤；句尾「（不離開此頁）」是實作說明 | `critique.md`：Labels on icons (not icon-only navigation) | 代理判讀 | P3 | 說明改指向可見的東西，刪掉實作說明 |
| A2-24 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 111、182 | 顏色 | 一筆退款同時出現紅「退款」標籤、金「退款」標籤、淡黃整列底色、紅字負數，同一件事講四次；收款與退款是類型不是狀態，卻用綠紅狀態色 | `clarify.md`：Say each idea once.；`critique.md`：Purposeful use of color and emphasis | 代理判讀 | P2 | 保留一到兩種退款訊號 |
| A2-25 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 149、154 | 字級 | 「核銷分配」欄文字 13px，同一表其他欄 14px | `typeset.md`：Keep repeated roles consistent across screens and states. | 代理判讀 | P3 | 用預設 14px |
| A2-26 | P2 | `orders/_components/detail/billing/PaymentRecordSection.js` 169 | 其他 | 退款金額在本欄自己拼字串，沒走帳務區共用的金額格式（小數位規則在 `money-format`） | `polish.md`：Replace custom implementations with shared components where the system owns the pattern. | 代理判讀 | P3 | 改用 `format.js` 的 `fmtNegative` |
| A2-27 | P2 | `orders/_components/detail/billing/InvoiceSection.js` 154 | 狀態 | 發票展開後沒有折讓時只顯示「沒有資料」，看不出是「這張發票沒有折讓單」 | `operate.md`：Empty states that teach the interface, not "nothing here." | 代理判讀 | P3 | 改成說明這張發票尚無折讓單 |
| A2-28 | P3 | `after-sales/page.js` 280、399 | 字級 | 案名與空狀態補充說明寫死 12px（值等於 bodySm，但沒從 token 取） | `typeset.md`：Is there a deliberate role scale, or a collection of arbitrary values? | 代理判讀 | P3 | 改從 `theme.typography.bodySm` 取值 |
| A2-29 | P3 | `after-sales/page.js` 292、360 | 顏色 | 「受理時間」「最後活動」的「30 天前」用次要文字灰，對白底 2.97:1；這是判斷拖多久的資料，不是附註 | 偵測程式 `low-contrast`（3.0:1 — text #949699 on #ffffff (and 6 more)） | 代理判讀 | P2 | 改用一般文字色 |
| A2-30 | P3 | `after-sales/page.js` 421、436、449、464、479 | 無障礙 | 篩選標題沒連到下拉選單與日期區間（同 A2-03） | `audit.md`：Inputs without labels, poor error messaging, missing required indicators | 代理判讀 | P2 | 每個控制項補上與可見標題相同的可及名稱 |
| A2-31 | P3 | `after-sales/page.js` 421、436、449、464、479 | 顏色 | 篩選標題用次要文字灰，2.97:1（同 A2-04） | 偵測程式 `low-contrast`（同色值命中） | 代理判讀 | P2 | 改用通過對比的文字色；值屬 AntD token |
| A2-32 | P3 | `after-sales/page.js` 413、425、453、468、480 | 提示文字 | 搜尋框灰字「請輸入售後單號、訂單編號、案名或客戶名稱」對比 1.9:1；下拉「全部類型」與日期「開始日期」「結束日期」灰字同樣 1.9:1 | 偵測程式 `low-contrast`（placeholder "請輸入售後單號、訂單編號、案名或客戶名稱" 1.9:1 (need 4.5:1) — text #babcbf on #ffffff） | 偵測程式 | P2 | 提高灰字對比；可搜尋條件改框外常駐說明 |
| A2-33 | P3 | `after-sales/page.js` 425 | 提示文字 | 「下一步動作」的灰字只寫「全部」，其他篩選寫「全部類型」「全部業務」，P1 寫「全部狀態」 | `clarify.md`：inconsistent terminology and capitalization; | 代理判讀 | P3 | 改成「全部動作」 |
| A2-34 | P3 | `after-sales/page.js` 253–258 | 提示文字 | 第一欄叫「編號」但內容是列序號 1、2、3；旁邊就是「售後單號」「訂單編號」，容易誤認成單據編號 | `clarify.md`：ambiguous nouns, verbs, and actions; | 代理判讀 | P3 | 改名「序號」 |
| A2-35 | P3 | `after-sales/page.js` 494–516、558–578 | 無障礙 | 三張摘要卡可以點來篩選，但只是可點的方框：鍵盤跳不到、螢幕閱讀器不知道它是按鈕；選中只靠藍色邊框表達 | `audit.md`：Improper heading hierarchy, missing landmarks, divs instead of buttons；`critique.md`：Meaning conveyed by color alone (red = error, green = success) | 代理判讀 | P2 | 加按鈕角色、可聚焦、按 Enter 或空白鍵觸發、宣告選中狀態 |
| A2-36 | P3 | `after-sales/page.js` 572 | 無障礙 | 摘要卡的計數「1」「0」用第三級標題（h3）呈現，標題大綱裡出現一串數字 | `audit.md`：Improper heading hierarchy, missing landmarks, divs instead of buttons | 代理判讀 | P3 | 改成一般文字，字級沿用 titleLg |
| A2-37 | P3 | `after-sales/page.js` 504、511、571 | 顏色 | 摘要卡標籤「待填決議」金色 2.76:1、「待結案」青色 3.39:1 | 偵測程式 `low-contrast`（2.8:1 — text #d48806 on #fffbe6；3.4:1 — text #08979c on #e6fffb） | 偵測程式 | P2 | 提高標籤文字對比；erp 只允許 token 色（見不相容紀錄） |
| A2-38 | P3 | `after-sales/page.js` 316–327、519–523 | 版型與組合 | 1440 寬時「狀態」欄被固定在右側的操作欄蓋住，「下一步動作」欄名被切成「下一步」；要橫向捲動才看得到狀態 | `layout.md`：At narrow, intermediate, wide, zoomed, and localized states, what reorders, collapses, wraps, scrolls, or remains fixed? | 代理判讀 | P2 | 重排欄寬讓業務視角在 1440 寬一屏放下，或把狀態欄移到操作欄前且不被蓋住 |

### 依類別統計

| 類別 | 項數 | 編號 |
|------|------|------|
| 字級 | 6 | A2-10、11、18、19、25、28 |
| 字重 | 1 | A2-12 |
| 顏色 | 10 | A2-04、13、14、16、17、20、24、29、31、37 |
| 提示文字 | 7 | A2-01、02、08、23、32、33、34 |
| 版型與組合 | 4 | A2-06、15、21、38 |
| 狀態 | 3 | A2-05、09、27 |
| 無障礙 | 6 | A2-03、07、22、30、35、36 |
| 其他 | 1 | A2-26 |
| 合計 | 38 | 偵測程式 5 項（A2-14、15、17、32、37），代理判讀 33 項 |

### 系統性問題（Patterns & Systemic Issues）

- 對比不足來自系統值：AntD 次要文字（`colorTextTertiary` #949699）、輸入框灰字（`colorTextQuaternary` #babcbf）、AntD 預設標籤色。三頁都受影響，頁面層改不了。
- 篩選列「灰字標題＋下拉選單」寫法在 `(prototype)/` 內共 39 處，標題都沒連到控制項。
- 帳務區自訂字級 13px 在 `(prototype)/` 內有 17 處、10 個檔，P2 範圍內占 11 處。

### 做得好的地方（Positive Findings）

- 圖示按鈕都同時有提示泡泡與可及名稱，鍵盤與螢幕閱讀器可用。
- 「做不了就不渲染、個別資料條件不符才停用加理由」的規則在三頁一致。
- P3 空狀態會教使用者去哪裡建單（`after-sales/page.js` 395–404）。
- P1 錯誤訊息與成功訊息都寫出單號與結果（例：`${ticket.ticket_no} 已作廢，明細的佔用即刻退出、可搬量回補`）。

### 建議指令（Recommended Actions）

1. **[P2] `/impeccable typeset`**：帳務區 13、18、22px 與字重 600 改回字級表；12px 改從 token 取（A2-10、11、12、18、19、25、28）。
2. **[P2] `/impeccable clarify`**：頂部長說明、灰字當標籤、操作名稱不一、「編號」欄名、空狀態文字、圖示指引（A2-01、02、05、08、23、27、32、33、34）。
3. **[P2] `/impeccable layout`**：P3 狀態欄被蓋住、P2 16 欄表、間距寫死（A2-06、21、38）。
4. **[P2] `/impeccable polish`**：對比、鍵盤可及、標題語意、顏色意義一致、共用格式（A2-03、04、07、09、13、14、15、16、17、20、22、24、26、29、30、31、35、36、37）。最後一步。

## 三、偵測程式判讀表

### 規則清單（`detect --list-rules --json`，共 62 條）

side-tab、border-accent-on-rounded、overused-font、flat-type-hierarchy、gradient-text、ai-color-palette、cream-palette、nested-cards、monotonous-spacing、bounce-easing、pulsing-dot、blinking-cursor、shape-assembled-illustration、organic-clip-path、buried-raster、hard-offset-shadow、dark-glow、radial-halo、radial-spotlight-glow、marquee、icon-tile-stack、italic-serif-display、hero-eyebrow-chip、kicker-above-heading、numbered-section-labels、em-dash-overuse、marketing-buzzword、aphoristic-cadence、oversized-h1、extreme-negative-tracking、broken-image、script-error、content-hidden-at-rest、edge-flush-cards、text-occlusion、first-viewport-column-overflow、gray-on-color、low-contrast、line-length、cramped-padding、body-text-viewport-edge、tight-leading、skipped-heading、heading-rhythm、justified-text、straggler、unbalanced-heading、tiny-text、undersized-ui-text、all-caps-body、wide-tracking、text-overflow、repeated-container-text、clipped-overflow-container、design-system-font、design-system-color、design-system-radius、design-system-font-size、gpt-thin-border-wide-shadow、repeating-stripes-gradient、codex-grid-background、theater-slop-phrase。

### 與本次關注類別有關的規則

| 類別 | 規則 | 備註 |
|------|------|------|
| 字級 | tiny-text、undersized-ui-text、flat-type-hierarchy、oversized-h1、design-system-font-size | 前四條要渲染頁面才跑；`design-system-font-size` 要讀 `DESIGN.md`，erp 的檔名是 `Designs.md`，沒被讀到 |
| 字重 | 無專門規則 | `flat-type-hierarchy` 只看字級比 |
| 顏色 | low-contrast、gray-on-color、design-system-color、ai-color-palette、cream-palette、gradient-text | `low-contrast` 要渲染頁面；`design-system-color` 同樣要 `DESIGN.md` |
| 提示文字 | 無專門規則 | 只有 `low-contrast` 會量輸入框灰字對比；提示泡泡、欄位說明的內容沒有規則 |

### 原始碼掃描（`detect-A2-base.json`）

8 個範圍內檔案，輸出 `[]`，結束碼 0。偵測程式在文字模式說明（原文）：「3 files scanned with regex matching only (.js). Rules that need a parsed page (tiny-text, low-contrast and other element rules) did not run on them; findings are an undercount, not a clean bill of health.」對 JSX 檔它只跑正規表示式比對，沒有任何規則命中。

### 渲染頁面掃描（`detect-A2-render.json`，23 筆）

| 規則 | 命中數 | 真問題（範圍內） | 真問題（範圍外） | 誤命中 | 例 |
|------|--------|-----------------|-----------------|--------|----|
| low-contrast | 19（含 2 筆提醒級） | 10 | 8 | 1 | 誤命中例：P1 那筆「#999999 on #ffffff」掃到的是登入頁，不是受測頁 |
| nested-cards | 2 | 0 | 0 | 0 | 命中屬實（確為卡中卡），但屬 erp 容器規範內的用法，判為規範允許，見 A2-15 與不相容紀錄 |
| pulsing-dot | 1 | 0 | 0 | 1 | 掃到登入頁的 AntD 載入轉圈（`ant-spin`），是真的載入指示，不是裝飾 |
| bounce-easing（提醒級） | 1 | 0 | 0 | 1 | `cubic-bezier(0.71, -0.46, 0.88, 0.6)` 是 AntD 內建動畫，頁面沒有自己寫 |
| 合計 | 23 | 10 | 8 | 3 | 另 2 筆規範允許 |

`low-contrast` 範圍內 10 筆的歸屬：P2 次要文字、P2 差額金色標籤、P2 綠色狀態標籤；P3 次要文字、搜尋框灰字、下拉灰字、開始日期灰字、結束日期灰字、金色標籤、青色標籤。範圍外 8 筆：P2 與 P3 側欄選單各 2 筆（外框 `DashboardShell`）、P2 訂單頁首按鈕 2 筆、P2 分頁籤 1 筆、P3 主色連結 1 筆。

## 四、涵蓋表

| 檔案 | 行數 | 是否逐行讀完 | 發現數 |
|------|------|-------------|--------|
| `production-floor/transfers/page.js` | 1006 | 已逐行讀完 | 9 |
| `orders/_components/detail/billing/ReconciliationPanel.js` | 237 | 已逐行讀完 | 7 |
| `orders/_components/detail/billing/ReceivableCard.js` | 124 | 已逐行讀完 | 2（另在 A2-16、17 共列，不重複計） |
| `orders/_components/detail/billing/InstallmentSection.js` | 322 | 已逐行讀完 | 5（A2-17、20、22 以本檔為主檔） |
| `orders/_components/detail/billing/PaymentRecordSection.js` | 290 | 已逐行讀完 | 3（另在 A2-16、17、20 共列） |
| `orders/_components/detail/billing/InvoiceSection.js` | 392 | 已逐行讀完 | 1（另在 A2-17、22 共列） |
| `orders/_components/detail/billing/format.js` | 25 | 已逐行讀完 | 0 |
| `after-sales/page.js` | 579 | 已逐行讀完 | 11 |

P2 合計 18 項（A2-10 至 A2-27）；跨檔項目只在主檔計一次。

## 五、過程紀錄

### 用到的指令與參考檔

| 指令 | 為什麼用 | 依據原文句 |
|------|---------|-----------|
| `impeccable context`（設定） | SKILL.md 規定每次工作階段先跑一次 | `SKILL.md`：Run `<skill-base-dir>/scripts/impeccable context` once per session |
| `init` | 任務書指定；context 回報沒有 PRODUCT.md | `init.md`：No PRODUCT.md:** explore, interview, and write it. |
| `audit` | 既有後台頁面、目的是稽核後改善；audit 是技術稽核，產出評分與建議指令 | `SKILL.md`：Technical quality checks (a11y, perf, responsive) |
| `detect`（原始碼、渲染頁面） | audit 第 5 面向要求跑內附偵測程式 | `audit.md`：Run the bundled detector and verify each finding in context. |

讀過全文的參考檔：`SKILL.md`、`init.md`、`audit.md`、`routing.md`、`critique.md`、`operate.md`、`mode-operate.md`、`typeset.md`、`clarify.md`、`layout.md`、`polish.md`、`craft-floor.md`。後四份修正類與 `craft-floor.md` 是第二步要用的，第一步先讀以便把發現對應到建議指令。

### init 的訪談：它問了什麼、代理答了什麼

`impeccable context` 輸出要求子代理在沒有提問工具時依任務書推斷並在回報中說明（原文：「Infer from the brief alone only after that probe errors, times out, or the user tells you to proceed, or when you have no structured question tool and no way to serve the decision page, as in a subagent running a brief.」）。代理沒有提問工具，照此推斷作答，寫進 `apps/erp/PRODUCT.md`，推斷的句子都標「（推斷）」。

| init 的問題（`init.md` Step 3） | 代理的回答 | 依據 |
|-------------------------------|-----------|------|
| Who is the primary user, in what situation, and what job are they doing? | 印刷廠內部辦公角色（生管、印務、業務、會計、廠務等），桌機瀏覽器上處理轉交、帳務、售後等單據 | `(prototype)/_lib/sessionStore` 角色、受測頁面 |
| What does the product make possible, and what is its meaningfully different mechanism or position? | 印刷業 ERP 後台；`(prototype)/` 是 PM 確認商業邏輯用、交前端接手的可運行頁面 | `(prototype)/README.md`、`prototype-from-prompt` |
| What durable constraints, assets, evidence, or product facts must future work preserve? | 視覺正本 `Designs.md`（token、圓角、狀態用 AntD Tag）、整頁配方、元件先行 PR 鐵則；mock 資料不另造 | `Designs.md`、`docs/recipes/`、`prototype-from-prompt` |
| 平台確認（Confirm ambiguous platform separately.） | web | Next.js 專案、`Designs.md` §1 |

Step 5 的建置路線問題（comp-first 或 code-first）沒有問：context 只回報圖片轉檔工具，沒有圖片生成能力（`init.md`：Without image generation there is no choice to record; code-first is the only path.）。沒有寫 `.impeccable/config.json`。

### 跳過的步驟（附原文句）

| 跳過什麼 | 原文句 | 理由 |
|---------|--------|------|
| 即時瀏覽器模式設定 | `init.md`：Then configure live mode when useful: skip native or non-runnable projects and leave existing config untouched. Otherwise follow [live.md](live.md)'s first-time setup. | 任務書規定不開 `live` |
| 建議提交 Impeccable 檔 | `init.md`：Tell the user once which files to commit: | 任務書規定 Impeccable 檔留在未追蹤 |
| 稽核報告存檔 | `audit.md`：run `.claude/skills/impeccable/scripts/impeccable audit-storage write "<resolved target, or . for the whole project>" <temp-file>` | 任務書規定結果寫在輸出資料夾，工作樹只留安裝檔與脈絡檔 |
| `critique` | `critique.md`：Assessment A and B MUST run as two isolated sub-agents whenever a sub-agent/Task tool is exposed. | 任務要求的是稽核類指令；critique 屬設計評論，要兩個隔離子代理並向使用者提問，本輪只跑 audit |
| 外部網址 | `routing.md`：Link to the [docs](https://impeccable.style/docs/) for the broader workflow guide.；偵測程式文字輸出：For the full check, scan the running dev server (npx impeccable detect http://localhost:PORT) or a static site's built .html. | 不連外、不執行 `npx`；改用本機程式本體掃本機網址 |
| 訪談提問 | `init.md`：Ask with the AskUserQuestion tool and wait for the answer before continuing. | 子代理沒有提問工具，改為推斷作答並標註 |

### 偵測程式執行紀錄

- 每次都帶 `DO_NOT_TRACK=1` 與 `IMPECCABLE_DOWNLOAD_BASE=http://127.0.0.1:9`。啟動器沒有顯示下載，程式本體從 `scripts/bin/darwin-arm64/impeccable` 執行。
- 啟動器 `--help` 結束碼 1，但正常印出說明。
- **`impeccable context` 在家目錄建立了 `~/.impeccable/update-check.json`**（51 位元組，內容 `{"lastCheck":1794664136524,"latestVersion":"4.9.0"}`，時間 21:48）。這是更新檢查紀錄，不是程式本體下載。無法確認它有沒有連網取得「4.9.0」：值與本機 SKILL.md 的版本相同，可能是本機值。檔案保留未刪，交 PM 判斷。
- 原始碼掃描：8 檔，`[]`，見第三節。

### 渲染頁面掃描結果

| 項目 | 結果 |
|------|------|
| 開發伺服器 | 從 `ticket42-shots/apps/erp` 以 `next dev --port 3142` 啟動，2 秒就緒；掃完關閉，`lsof -i :3142` 為空 |
| 偵測程式指令 | `detect --json --viewport 1440x900 <三個網址>`，結束碼 2（有發現） |
| P1 `/production-floor/transfers/` | 沒進到頁面：未登入被導到登入頁 `/login/?redirect=…`，偵測程式掃到的是登入頁（2 筆，皆判誤命中） |
| P2 `/orders/detail/?id=ORD-2026-0710&tab=paymentPlan` | 進到受測頁，預設模擬角色剛好是「業務（洪嘉駿）」，看得到金額與發票分頁 |
| P3 `/after-sales/` | 進到受測頁，預設角色「業務（洪嘉駿）」 |
| 為何 P2、P3 不用登入 | 未查證。代理用 Playwright 不登入依序開三個網址，第一個被導到登入頁，後兩個直接顯示內容；沒有再追原因 |
| 角色切換 | 偵測程式不會切角色，掃的是預設角色；P1 需要的「生管」沒測到 |
| `ticket42-shots` | 掃描後 `git status --porcelain` 為空、HEAD 仍是 `6e75fa07` |
