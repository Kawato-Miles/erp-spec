# tasks：sync-amount-rules-to-specs

## 1. delta 併回 main specs

- [x] 1.1 以 `/opsx:sync` 將七份 delta 併回 `openspec/specs/<capability>/spec.md`，逐份確認 MODIFIED 標題完全匹配、REMOVED 已自主檔移除
- [x] 1.2 grep 主檔驗證舊語句零殘留：「報價總額」（quote-request／order-management／consultation-request 語境）、「發票金額誤差核銷」、「訂單未終態不開放退款與補收」等被翻案句，命中數為 0

## 2. 一致性驗證

- [x] 2.1 `openspec validate` 全庫通過
- [x] 2.2 抽查三份主檔（order-billing、order-adjustment、work-order）的金額 Requirement 與 wiki 對應卡逐句比對，無矛盾
- [x] 2.3 12,501 驗算錨在 spec Scenario、wiki 例子 4、Linear PM-1100／1101 驗收條件三處數字一致

## 3. 收尾

- [x] 3.1 三個 Open Questions（退款認列時點、補收草稿、諮詢退費口徑）經 oq-manage mode B 開獨立 OQ 卡
- [x] 3.2 `/opsx:archive` 歸檔本 change
- [x] 3.3 commit 並更新記憶檔的「OpenSpec 未同步」未結項
