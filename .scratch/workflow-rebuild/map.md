# 地圖：工作環境重建

## Destination

Miles 只給需求。代理依 matt 的 skill 流程，從釐清一路做到交付，中斷後能自行接續。
Miles 不再花時間做對齊工作（wiki 用詞、規劃單、Prototype、Linear 之間的一致）。
環境（AGENTS.md、記憶檔、skill、hook）只留實際用得到的內容。
抵達判準：用一個真實需求走完整流程，記錄 Miles 投入的時間與用量，結果 Miles 接受。

## Notes

- 本地圖含執行：決策票解完後，task 票直接動手改環境，不另開規劃。
- 不帶包袱：現行規則、skill、記憶卡都是輸入，不是限制。該重構、搬遷、刪除的直接做。
- 流程骨幹照 matt 的 skill，一字不改；Sens 自己的 skill 只補 matt 沒有的領域知識與稽核。
- 每個工作階段只解一張票（research 票除外），解完提交。
- 每張票解完前先找 Miles 立場最強的反例。
- 已確定的事實：
  - 工作管理放本 repo 的 Markdown 檔，不放 Linear。Linear 只收交付給開發的內容。
  - Linear 的議題狀態不能改；PM team 建票會同步開一張 GitHub issue；方案是 Basic，沒有私有團隊。
  - Linear 現行交付結構：專案 → 里程碑 → Feature 票（PM team）→ 前端與後端 Task 子票。
  - Prototype 在 erp repo，用該 repo 的 skill 實作，不做前後端分離。
  - 主檢出停在 master，代理一律在工作樹作業。
- 調研產出放 `research/`，每筆結論附網址與原文句；查不到就標未查證。

## Decisions so far

<!-- 一張已解的票一行：票名、一句結論 -->

## Not yet specified

- Linear 交付要怎麼從 wiki 與票自動展開，取代人工重寫與盲測。等「對齊工作怎麼消除」解完才能問清楚。
- wiki 要不要另有給部門同仁讀的閱讀頁。等「wiki 的粒度與正規化範圍」解完。
- 新的稽核與領域 skill 要怎麼證明有效（評測方法）。等「稽核的目的與內容」解完。
- 進行中的 wiki 正規化遷移（已到第 6 批）剩餘批次怎麼處理。等「在途工作去留」與「wiki 的粒度」解完。

## Out of scope

- 上線切換與資料遷移計畫、非功能需求、主檔維護權責、整合介面契約：Miles 於 2026-11-11 判定偏離本次目標。
- ERP 功能本身的新規劃。
