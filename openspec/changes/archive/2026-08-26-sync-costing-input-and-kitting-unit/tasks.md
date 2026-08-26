# Tasks

## 1. Delta 一致性驗證（本 change 為 spec 同步，無程式實作）

- [x] 1.1 驗證 delta 三個 Requirement 與 wiki 正本一致：逐段比對 wiki 生產任務 § 數量、BOM結構 § 計價引擎計算框架、齊套邏輯 § 規則、工單 § 建立來源；成功條件＝delta 無任何一句與 wiki 拍板口徑相反
- [x] 1.2 全庫掃 openspec/specs/ 殘留：`grep -rn "上機張數\|計價輸入" openspec/specs/`，成功條件＝除 work-order delta 承接處外，其餘命中皆屬計價方法本身（process-master 的工序面積計價、order-billing 的需求單雙欄計價），與任務層輸入欄無關
- [x] 1.3 全庫掃齊套措辭殘留：`grep -rn "取各工序\|各工單的最慢" openspec/specs/`，成功條件＝main spec 合併後零命中（取數單位一律「各計入生產任務」）

## 2. 封存

- [x] 2.1 執行 openspec 驗證與 archive，delta 併回 openspec/specs/work-order/spec.md；成功條件＝main spec 的三個 Requirement 內容等於 delta 版本、change 移入 archive
