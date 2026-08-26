# tasks：fix-adjustment-recognition-and-refund-sign

## 1. delta 撰寫與併回

- [x] 1.1 枚舉三份 spec 內認列時點、補收流程、退費款項的既有 Requirement，寫 delta（全 MODIFIED）
- [x] 1.2 delta 併回主檔，`openspec validate` 本 change 通過
- [x] 1.3 grep 主檔驗證「核可即認列」「核可當下即推進」「跳過中間態」與退費負值款項語句零殘留

## 2. 收尾

- [x] 2.1 ORD-045 依 BI-25 決議、CR-009 依 ezPay 卡 § 4.6 結案封存（oq-manage mode C）
- [x] 2.2 `/opsx:archive` 歸檔本 change
- [x] 2.3 commit 並更新記憶檔
