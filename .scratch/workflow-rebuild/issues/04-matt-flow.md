# 04：matt 流程全貌

Type: research
Status: resolved
Blocked by: None

## Question

matt 的 skill（1.3.2 版）完整流程是什麼？
每一步用哪個 skill、輸入輸出、誰啟動、怎麼交接（handoff）、怎麼回顧（retro）、怎麼連續執行。
哪些只能由使用者啟動？哪些步驟 matt 沒有、Sens 必須自己補？結果寫入 `research/04-matt-flow.md`。

## Answer

結果在 `research/04-matt-flow.md`。matt 主流程每一步都由使用者啟動，沒有自動串接；只有 `implement-spec` 會連續跑。`handoff` 產交接文件、`retro` 建議改代理環境。matt 沒有的：既有正本衝突盤點、規格稽核、業務規則長期正本、不確定項管理、對外交付、中斷後的接續器、實作票完成與重新認領的狀態。
