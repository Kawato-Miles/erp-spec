# 43：給 Miles 的回報怎麼做到一眼看懂，成效怎麼追蹤

Type: research
Status: open
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

- 紀錄檔：[report-feedback-log.md](../report-feedback-log.md)，只追加。正式位置由票 11 定。
- 檢視時點：票 12 真實需求試跑結束時看一次。不另設目標值。

### 要 Miles 決定的問題領域（草稿，待 Miles 確認）

Miles 2026-11-13：「我有用 ste100 控制回覆方式，我覺得重點應該在於要我做決策的問題領域是哪些」。
他最初的原話也有這一半：「你給的東西不是我習慣吸收或是我該需要做決策的」。本票先前只處理了「怎麼寫」，漏了「問什麼」。

草稿只整理既有的拍板，不新增規則：

| 要 Miles 決定 | 依據 |
|--------------|------|
| 商業規則：金額算式、庫存、狀態轉換條件、權限 | 票 39 的結論；票 09 的假設清單。每條附實際數字的例子 |
| 欄位與狀態的新增與修改 | `AGENTS.md` 正本分層：這是商業決策 |
| 看得到的操作：Prototype 的畫面與動線 | 票 09：Miles 點畫面確認 |
| 範圍與先後：做什麼、不做什麼、先做哪個 | 地圖 Notes：專案管理是 Miles 的工作 |
| 難反悔或對外的動作：交付 Linear、發布、刪除 | `AGENTS.md` 停下與繼續 |
| 正本互相矛盾時以哪個為準 | `AGENTS.md` 停下與繼續 |

| 代理自己定，只告訴 Miles 結果與影響 | 依據 |
|-----------------------------------|------|
| 技術題：版本控管、hook、設定檔、規則放哪個檔、測試顆粒度 | 地圖 Notes（Miles 2026-11-12）；票 09 目標第 4 項 |
| 工具與 skill 的選用與安裝 | 同上；安裝前先說明影響 |
| 工作方法：調研、派工、換對話、紀錄與追蹤的做法 | 記憶卡 `feedback_report_in_chat_and_handoff.md` |

- 回覆的句法由 Miles 的輸出風格檔控制，本票不另設一套。上面的版型只當成代理自查的清單，要不要寫進輸出風格檔由 Miles 決定。
- 回述檢核屬於工作方法，代理決定先不做，只記事後翻案次數。先前向 Miles 提的那一題撤回。
- 確認後交票 09（代理何時停下問 Miles）與票 11（`AGENTS.md` 停下與繼續段）。

### 交接

- 票 11：把版型、圖種表、指標寫進 `~/.claude/output-styles/ste100-pm.md`，並與 `AGENTS.md` 收尾回報段合成一份。
- 票 09：決策領域表確認後，用來定代理何時停下問 Miles。
