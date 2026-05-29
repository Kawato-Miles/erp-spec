## ADDED Requirements

### Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單

對帳三方差錯偵測 SHALL 涵蓋「`status ∈ {訂單完成, 已取消}` 且該訂單有 `status=開立` 的 Invoice」的訂單，取代既有「限 `status=訂單完成`」篩選。此修訂根治「已取消但有認列收入訂單從對帳差錯偵測消失」的漏帳——包含諮詢取消（留存 1000 收入）+ 一般訂單取消後依實際成本保留部分收入兩種情境。

**範圍界定**：對帳 CSV 匯出層已以「已開立發票」為主軸（一列 = 一張已開立發票、無 order.status 篩選），涵蓋率本就 100%，**不需修改**。本 requirement 針對的是**差錯偵測層**（計算應收 / 發票淨額 / 收款淨額三方差額時的訂單集合篩選）。**推翻 unify-billing（2026-05-28）對帳差錯偵測「限訂單完成」拍板**，補齊其只改一半的對帳主軸修正。

#### Scenario: 諮詢取消訂單納入對帳差錯偵測

- **GIVEN** 諮詢取消後諮詢訂單 status = 已取消、有 status=開立 的諮詢費 Invoice（1000）
- **WHEN** 系統執行三方對帳差錯偵測
- **THEN** 該已取消諮詢訂單 SHALL 被納入偵測集合（不因 status=已取消 被排除）
- **AND** 對帳：應收 1000 = 發票淨額 1000 = 收款淨額 1000，差額 = 0 對帳通過

#### Scenario: 一般訂單取消保留收入納入對帳差錯偵測

- **GIVEN** 一般訂單取消、業務依實際成本退部分款、保留部分收入、有 status=開立 Invoice
- **WHEN** 系統執行三方對帳差錯偵測
- **THEN** 該已取消訂單 SHALL 被納入偵測集合（連帶修一般訂單取消的同類漏帳）

#### Scenario: 已取消但無發票訂單由差額警示涵蓋

- **GIVEN** 諮詢取消後諮詢訂單 status = 已取消、尚未開立任何 Invoice（諮詢人員還沒手動開那 1000 發票）
- **WHEN** 系統執行對帳
- **THEN** 系統 SHALL 透過「應收 > 發票淨額」差額警示提醒未開票（應收 1000 > 發票淨額 0）
- **AND** 此差額警示為廢除「諮詢專屬自動建待開發票」後的未開票兜底提醒機制

### Requirement: 諮詢退款 OA 不計入收款變更率（認知對齊）

收款變更率指標分子（既有 6 種修改事件：DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / PAYMENT_ALLOCATION_OVERRIDDEN / PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE）SHALL NOT 含任何 OrderAdjustment 事件。故諮詢取消退費 OA（系統內生）及其金額調整天然不計入收款變更率分子，**無需新增排除規則**（公式本就不含 OA 事件，CEO「排除諮詢退款 OA」需求為 no-op）。

**設計理由**：收款變更率量測「業務對自己規劃的收款計畫（BillingInstallment / PaymentAllocation）改了幾次」的操作穩定性；OrderAdjustment 是獨立金額異動實體、非收款計畫操作，本就不在分子。諮詢退款 OA 由系統內生、更非業務主動操作，計入會污染指標語意。

#### Scenario: 諮詢退款 OA 建立與調整不影響收款變更率

- **GIVEN** 諮詢取消自動建退款 OA(-1000, 已核可) + 業務後續調整其金額
- **WHEN** 系統計算該訂單收款變更率
- **THEN** 諮詢退款 OA 的建立與金額調整 MUST NOT 計入收款變更率分子（分子僅含 6 種 BillingInstallment / PaymentAllocation 修改事件）
