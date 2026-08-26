# Tasks

## 1. Delta 一致性驗證（本 change 為 spec 同步，無程式實作）

- [x] 1.1 逐段比對 delta 與 wiki 正本（QC不通過補生產第 2 步、齊套邏輯至少一筆計入段、生產任務 § 數量、數量換算規則 § 三、BOM結構）；成功條件＝delta 無任何一句與 wiki 拍板口徑相反
- [x] 1.2 掃 main spec 殘留：`grep -n "起補工序\|小數表達開料" openspec/specs/work-order/spec.md`，成功條件＝合併後零命中

## 2. 封存

- [x] 2.1 delta 併回 main spec 並 archive；成功條件＝main spec 三個修訂 Requirement 等於 delta 版本、新 Requirement 已加入、change 移入 archive
