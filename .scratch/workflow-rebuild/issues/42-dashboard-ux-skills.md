# 42：做 Prototype 時把關畫面組合的 UX skill

Type: research
Status: open
Blocked by: —

## Question

代理用 erp 的 `prototype-from-prompt` 做畫面時，常見的問題不是缺元件，是元件的組合方式錯。
有哪些既有的 skill 能把關後台管理介面（Dashboard）的畫面組合？

- Miles 點名的兩個：`https://github.com/pbakaus/impeccable`、`https://github.com/ibelick/ui-skills`。
- 其他熱門的同類 skill。
- 每一個的內容是什麼、技術前提是什麼（erp 用 Next.js、Ant Design 5.22、styled-components）、有沒有談頁面層級的組合（列表頁、詳情頁、表單、資料表）。
- 哪些可以直接用，哪些與 erp 的元件庫或既有規範衝突。

## 緣由

Miles 2026-11-13：「我認為需要 Dashboard UX 的 Skill 納入考量，這樣用 erp skill 時，才能組合出正確的畫面，很多時候不是缺少元件，是元件的組合方式錯。」

## 限制

- erp 程式庫與 erp 的 skill 不動。新 skill 只能加在 Sens 這一側，在 erp skill 之前（選版型）與之後（檢查畫面）使用。
- 調研階段不安裝、不執行來源裡的任何檔案。

## 完成的樣子

- `research/42-dashboard-ux-skills.md`：每個 skill 附網址、檔案清單、原文句、技術前提、熱門程度、授權。
- 主對話讀完要採用的 skill 檔全文，再向 Miles 說明採用哪些、用在流程的哪一步。結論交票 09 與票 11。
