# 43：給 Miles 的回報怎麼做到一眼看懂，成效怎麼追蹤

Type: research
Status: resolved
Blocked by: —

## Question

代理給 Miles 的回報現在太長、全是文字、太技術、問題太細。
要怎麼改成他一眼看出重點與下一步？改了之後怎麼知道有效？

- 有哪些既有的 skill 能產出 PM、BA、SA 慣用的圖：服務藍圖、UML（活動圖、循序圖、狀態圖、使用案例圖）、泳道流程圖。
- 有哪些既有的 skill 或成熟做法處理「對主管說明」：結論先行、一次一個決策、風險用商業案例與衝擊說明。
- 讀的人有沒有真的理解，既有做法怎麼檢查。

## 緣由

Miles 2026-11-13 的原話與要點記在記憶卡 `feedback_report_executive_visual.md`。他發現自己開始「因為你好像說得很正確，所以我就忽略理解，直接同意」，要求改進並追蹤成效，並要代理去找熱門的 skill 來解決。

## 完成的樣子

- `research/43-reporting-to-miles.md`：每個 skill 與做法附網址與原文句。
- 主對話讀完要採用的來源全文，再定：回報的固定版型、哪種內容用哪種圖、成效指標與紀錄方式。
- 結論交票 11（改輸出風格檔 `~/.claude/output-styles/ste100-pm.md` 與 `AGENTS.md` 的收尾回報段）。

## Answer

全文：[research/43-reporting-to-miles.md](../research/43-reporting-to-miles.md)。主對話於 2026-11-13 讀完下列來源全文：`discernment-nudge`、本機 `stakeholder-update`、`policy-memo`、`executive-briefing`、infrasity 的 `service-blueprint`、j-clegg 的 `METHODOLOGY.md`、NN/g 服務藍圖定義文、Buçinca 與 Bansal 兩篇的摘要（論文全文未讀）。引文重新比對 101 句，85 句相符，其餘 16 句的原因見調研檔檔頭。

### 不安裝外部 skill

- 圖解類：已讀到的兩個都不適合。`drawio` 產出 `.drawio` 檔，要桌面版程式轉檔，Miles 不開檔。`plantuml-skill` 預設把圖的原始文字上傳到公開服務 kroki.io。其餘圖解 skill 沒讀全文，依限制不安裝。
- 畫圖改用已有的工具：對話內建的圖解工具、`eli5`、Artifact。
- 服務藍圖類與決策者溝通類的 skill 內容是幾行結構規則，直接寫進輸出風格檔，不另裝。
- `discernment-nudge` 不安裝：一個對話只觸發一次；開頭句固定是英文；一次附兩到三個問題，與「一次最多問一個決策」衝突；檔內沒有追蹤理解的機制。

### 回報的固定版型

每則給 Miles 的回報依序放下列內容：

| 順序 | 內容 | 出處 |
|------|------|------|
| 1 | 先一句定位：這則在講哪件事、它是主線還是支線、主線現在到哪。再一句結論，加狀態：順利、有風險、卡住 | 定位句：Miles 2026-11-13 的反應（見紀錄檔）；其餘：`stakeholder-update` 主管版、`policy-memo` |
| 2 | 一張圖，圖種照下一節 | Miles 2026-11-13 |
| 3 | 下一步：誰做什麼 | `executive-briefing` |
| 4 | 要 Miles 決定的事，最多一題：選項含維持現況、建議、接受的代價、預期結果 | `policy-memo`；全域偏好的四項 |
| 5 | 風險：只列會改變決定或需要 Miles 出手的。每條一個商業案例：誰、什麼情況、損失、可能性、應對、要 Miles 做什麼 | `stakeholder-update` 的風險溝通步驟 |
| 6 | 查證狀態：已讀全文、只比對引文、未查證 | `executive-briefing` 的信心標示；全域偏好 |

- 圖以外的文字上限由票 11 寫進輸出風格檔一處。參考值：`stakeholder-update` 的主管版寫 200 與 300 個英文字兩種上限。
- 細節留在檔案，對話只附連結。
- `AGENTS.md` 收尾回報段現在寫三段（卡在 Miles 的事、改了什麼、發現什麼）。兩者要由票 11 合成一份，主對話不自行調和。票 11 完成前，照本版型回報。

### 哪種內容用哪種圖

| 要講的事 | 圖種 |
|---------|------|
| 誰在哪一步做什麼 | 泳道流程圖 |
| 客戶看得到的事與內部作業怎麼接 | 服務藍圖 |
| 一張單據經過哪些狀態 | 狀態圖 |
| 資料之間的關係 | ER 圖 |
| 系統之間誰先呼叫誰 | 循序圖 |
| 改之前與改之後差在哪 | 同一張圖畫兩次，標出不同處 |
| 選項比較 | 比較表 |

服務藍圖照 NN/g 的定義畫：客戶動作、前台動作、後台動作、支援流程、實體憑證；互動線、可見線、內部互動線。一張圖只畫一個情境（NN/g：「A service blueprint corresponds to a specific customer journey」）。

未查證的提醒：j-clegg 的方法檔轉引「服務藍圖用於既有服務，新服務先做旅程圖與原型」（Wales Centre for Digital Public Services），主對話沒有讀到該機構的原文。

### 成效指標與紀錄方式

兩篇研究摘要的結論改變了指標設計：

- Bansal 等：「explanations increased the chance that humans will accept the AI's recommendation, regardless of its correctness.」說明做得更清楚，接受率會上升，不論建議對錯。
- Buçinca 等：「cognitive forcing significantly reduced overreliance」，同時「people assigned the least favorable subjective ratings to the designs that reduced the overreliance the most.」要人先想一下的設計有效，但使用者最不喜歡。

所以「看不懂的次數下降」不能單獨當成改善的證據。指標如下：

| 指標 | 量什麼 | 怎麼記 |
|------|--------|--------|
| 看不懂次數 | 回報好不好讀 | Miles 說看不懂、要求補案例或白話重講，每次一筆 |
| 事後翻案次數 | 有沒有照單全收 | 已拍板的決定，Miles 事後推翻或說當時沒理解，每次一筆 |
| 回述不一致次數 | 有沒有照單全收（即時） | 待 Miles 決定要不要做，見下 |

- 紀錄檔：[report-feedback-log.md](../report-feedback-log.md)，只追加。正式位置由票 11 定。
- 檢視時點：票 12 真實需求試跑結束時看一次。不另設目標值。

### 待 Miles 決定

難反悔的決定（判準沿用決策紀錄的三個條件），Miles 同意後要不要用一句話回述「同意了什麼、接受什麼代價」。代理比對回述與原意，不一致就換方式重講並記一筆。已於 2026-11-13 在對話提問。

回述法的權威來源（AHRQ）抓取被擋，沒有取得原文；本項依 Buçinca 摘要與一般做法提出。

### 交接

- 票 11：把版型、圖種表、指標寫進 `~/.claude/output-styles/ste100-pm.md`，並與 `AGENTS.md` 收尾回報段合成一份。
- 票 09：回述檢核若採用，放在流程中每個拍板點。
