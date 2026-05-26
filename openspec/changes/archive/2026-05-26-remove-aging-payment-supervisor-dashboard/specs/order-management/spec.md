## MODIFIED Requirements

### Requirement: 處理中 Payment 老化追蹤

Payment 滿足以下條件時系統 SHALL 視為「老化處理中 Payment」：

- `paymentStatus = '處理中'`
- `cancelled = false`
- `createdAt < now - 7 天`（依自然日計算，閾值 resolve [[ORD-021-處理中Payment老化追蹤機制]]）

老化判定後系統 SHALL 於訂單詳情頁 `OrderPaymentSection` 收款紀錄列表 row 顯示 amber Badge「老化 N 天」，N = `floor((now - createdAt) / 86400000)`。

老化閾值 7 天為初版固定值，未來累積 KPI「處理中 Payment 老化率」UAT 數據後可調整。

**設計理由**：原 change 引入 paymentStatus 雙態後，業務先建處理中 Payment 屬於「實際金流尚未發生、待確認」的中間態。若無老化追蹤、業務忘了補齊資料 → Payment 永遠停留處理中 → 對帳數字虛胖（應收找不到對應已完成 Payment）。7 天閾值對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期。訂單層級的 row Badge 提示讓業務在訂單詳情頁不離開頁面即可知悉該筆 Payment 已老化，提示時機與業務操作焦點對齊。

跨訂單聚合的「業務主管老化清單」視圖在 2026-05-26 後續決策中拆除 — 主管追蹤跨訂單老化 Payment 改採「匯出 csv row data 後 Excel 自行篩選」方式進行；系統內保留訂單層級 row Badge 但不再提供 sidebar 入口與聚合清單頁（csv 匯出機制本 spec 不定義、另議）。

#### Scenario: 處理中 Payment 超過 7 天顯示老化 Badge

- **GIVEN** Payment P-013 createdAt = now - 8 天、paymentStatus = '處理中'、cancelled = false
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** P-013 row SHALL 顯示 amber Badge「老化 8 天」

#### Scenario: 處理中未滿 7 天不顯示老化 Badge

- **GIVEN** Payment P-014 createdAt = now - 5 天、paymentStatus = '處理中'
- **WHEN** 業務刷新訂單詳情頁
- **THEN** P-014 row SHALL NOT 顯示老化 Badge（未達閾值）

#### Scenario: 已取消 Payment 不列入老化追蹤

- **GIVEN** Payment P-015 createdAt = now - 10 天、paymentStatus = '處理中'、cancelled = true
- **WHEN** 老化追蹤掃描
- **THEN** P-015 SHALL NOT 顯示老化 Badge（cancelled 排除）
