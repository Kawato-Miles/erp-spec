## MODIFIED Requirements

### Requirement: 訂單異動（OrderAdjustment）狀態機

OrderAdjustment SHALL 為**獨立狀態機**，不影響主訂單狀態。狀態定義：

| 狀態 | 說明 |
|------|------|
| 草稿 | 業務 / 諮詢建立但未提交審核 |
| 待主管審核 | 業務提交後等待業務主管核可（僅退款負項 OA 經此態；補收正項免審）|
| 已核可 | 業務主管核可（退款 OA）；待系統推進已執行 |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | **核可後應收調整生效（系統自動推進、不綁 Payment 累計）；應收總額更新（終態）** |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核（退款 OA）─────────────────▶ 待主管審核
草稿 ─ 儲存並執行（補收正項，免審）────────▶ 已執行
草稿 ─ 取消 ──────────────────────────────▶ 已取消
待主管審核 ─ 核可 ────────────────────────▶ 已核可
待主管審核 ─ 退回 ────────────────────────▶ 已退回
已退回 ─ 修改後重交 ──────────────────────▶ 待主管審核
已退回 ─ 取消 ────────────────────────────▶ 已取消
已核可 ─ 核可後應收調整生效（系統自動）───▶ 已執行
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 BillingInstallment（請款期次）。

**「已執行」推進機制（路 C MODIFY：核可即生效、不綁 Payment 累計）**：

OrderAdjustment 的 `status = 已執行` 推進條件為「核可後應收調整生效」，與退款 Payment / 補收 Payment **解耦**（取代舊「對應 OA 的關聯 Payment 累計達 OA.amount 才推進」）：

- **補收正項 OA**（amount > 0、免審）：建立並「儲存並執行」時直接推進「已執行」（approved_by = 業務本人、executed_at = now），應收即時 +N。
- **退款負項 OA**（amount < 0、送審）：業務主管核可後系統自動推進「已執行」（executed_at = 核可時點），應收即時 −N；不等退款 Payment 切已完成。
- 補收與退款 OA「已執行」語意統一 = 應收調整生效；退款的**現金完成**獨立由退款 Payment 切「已完成」承載（見 [order-management § 退款 OA](../order-management/spec.md)）。

「執行」action 由系統自動觸發（補收於儲存並執行、退款於主管核可後）；UI 上 OA 編輯介面 SHALL NOT 提供獨立「執行」按鈕。

**[路 C 移除]「已執行」回退機制**：舊「業務取消已完成關聯 Payment 致累計不足 → OA 回退已核可」回退機制 **移除**——OA 已執行不再綁 Payment 累計，無「累計不足」概念。誤建退款 Payment 的修正改為「取消退款 Payment → 對帳應退差額重現 → 差額警示引導重退」，OA 維持已執行（應收已調整、不回退）。此取代既有 [ORD-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-003-取消退款Payment是否回退OA.md) 候選做法 1。

**OrderAdjustment 雙重身份廢止（沿用）**：OrderAdjustment 不再有 `adjustment_phase` 欄位，所有 adjustment_type 皆可於任何 Order 狀態下選用。OrderAdjustment 有 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）：

- **NULL**：訂單期間業務直接建立的金額異動
- **非 NULL**：AfterSalesTicket 內部建立的關聯異動（退款 / 補印收費）

兩種情境共用同一狀態機。`linked_after_sales_ticket_id` 一經建立 MUST NOT 變動。

**對帳警示觸發（沿用）**：對帳檢視面板警示 banner 觸發條件為「`OrderAdjustment.executed_at > Order.completed_at`」，同時適用 linked_after_sales_ticket_id 為 NULL 與非 NULL。

#### Scenario: OrderAdjustment 草稿提交審核（退款 OA）

- **GIVEN** 退款 OrderAdjustment.status = 草稿（amount < 0）
- **WHEN** 業務點擊「提交審核」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 MUST 通知業務主管

#### Scenario: 退款 OA 核可後核可即生效（路 C）

- **GIVEN** 退款 OrderAdjustment OA-001（status = 已核可、amount = -5000）
- **WHEN** 業務主管核可
- **THEN** 系統 SHALL 自動推進 OA-001.status → 已執行、executedAt = 核可時點
- **AND** 系統 MUST 重算訂單應收總額（含此筆已執行 OA，應收 −5000）
- **AND** OA 推進已執行 MUST NOT 等待退款 Payment 切已完成
- **AND** 對帳面板 SHALL 顯示「收款淨額 > 應收」應退差額，引導業務建退款 Payment 核銷

#### Scenario: 補收正項 OA 儲存並執行直達已執行（沿用）

- **GIVEN** 補收 OrderAdjustment OA-002（amount = +8000、adjustment_type = 加印追加、免審）
- **WHEN** 業務點「儲存並執行」
- **THEN** OA-002.status SHALL 跳過待主管審核 / 已核可、直接 = 已執行（approved_by = 業務、executed_at = now）
- **AND** 應收即時 +8000、MUST NOT 綁 Payment 切已完成

#### Scenario: 取消退款 Payment 後 OA 維持已執行（無回退）

- **GIVEN** 退款 OA-001 已執行（應收已 −5000）、退款 Payment P-001 已完成
- **WHEN** 業務取消 P-001
- **THEN** OA-001.status SHALL 維持「已執行」（應收維持 −5000、不回退已核可）
- **AND** 對帳面板 SHALL 重現「應退差額 5000」、引導業務重建退款 Payment
