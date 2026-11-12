# 40：票與規格怎麼寫，單看一個來源也足夠、AI 也找得到

Type: research
Status: open
Blocked by: —

## Question

產品需求文件（PRD）、工作分解（WBS）、任務票這三層，資深產品經理與專案管理的既有做法怎麼分工？一條規則屬於別的功能時，沿用它的任務票要怎麼寫？

- 專案管理與產品管理的一手來源（PMI 的 PMBOK 與 WBS 實務標準、IIBA 的 BABOK、Atlassian、Linear 等官方文件）怎麼規定需求追溯與票的內容？
- 開發用 AI 爬 Linear 的資料時，什麼寫法讓 AI 找得到沿用的規則（關聯、連結、規則名、標籤）？
- 來源限一手，每個來源讀完相關章節全文。

## 緣由

票 30 的題 B（任務票能不能寫「沿用某規則」）定不下來。先前調研的共識是「規則內容只寫一處，票不複製」，但好不好難判斷。

Miles 2026-11-12 給的方向與驗證方式：

- 「去看看 PM skill 或專案管理 prd / wbs / task 等方向，找出最佳實踐。」
- 「目前開發也是會用 AI 去爬 Linear 的資料，所以重點是要找的到。」
- 驗證方式：「如果這樣寫的話，我是否能夠知道要做什麼，且 wiki / prototype / linear 的結果是相同的，且就算我只看單獨看一個來源也 linear 也一樣，尤其是商業上的需求。」

## 完成的樣子

- `research/40-ticket-content-findable-and-sufficient.md`：每條做法附網址與原文句，標明讀了全文或部分。
- 依 Miles 的驗證方式設計一次實測：同一個功能用兩種寫法各寫一張票，只給受測代理 Linear 的內容，請它說出要做什麼，再與 wiki、Prototype 對照。
- 結論交票 24（Linear 各層的內容）。票 30 的題 B 在票 24 定案前維持現行交付規範，`feedback_features_mece_no_rules_in_project` 先不刪。
