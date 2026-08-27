# Tasks

## 1. Delta 一致性驗證（spec 同步，無程式實作）

- [x] 1.1 逐段比對 delta 與 wiki 正本（生產任務 § 數量計價輸入宣告、數量換算規則 § 單位分工）；成功條件＝delta 無任何一句與拍板口徑相反
- [x] 1.2 掃 delta 與 main spec：`grep "張數取同工單\|同工單材料型任務"`，成功條件＝合併後零命中

## 2. 封存

- [x] 2.1 delta 併回 main spec 並 archive
