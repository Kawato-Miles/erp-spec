## Why

目前 Payment 採「建立 ＝ 完成」硬綁定設計：建立退款 Payment 同 transaction 自動推進關聯 OrderAdjustment 為「已執行」，業務只能等對帳資料齊備才敢建檔。實務上業務需要「先填一半、陸續補齊資料」的能力（含一般收款場景，例如「客戶說已匯但銀行對帳單未到」），且補收 OA 與退款 OA 目前採 asymmetric 設計（退款業務手動建、補收系統自動建），增加業務理解負擔。本 change 為 Payment 加 `paymentStatus`（處理中 / 已完成）通用化狀態欄、解耦 OA 已執行觸發、對稱化兩側流程。

商業背景參考：[ERP_Vault 訂單實體卡 § OrderAdjustment 行為摘要](../../../memory/erp/ERP_Vault/05-entities/訂單.md#orderadjustment訂單異動單行為摘要)、[付款發票邏輯卡 § 三方對帳](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md#六三方對帳)。

## What Changes

- **新增 Payment.paymentStatus 欄位**（enum: 處理中 / 已完成，預設處理中），通用化適用一般收款 / 退款 / 補收三類 Payment
- **新增 Payment.completedAt 欄位**（業務手動切「已完成」時寫入時間戳）
- **paidAt 欄位語意明文化**為「款項實際完成日」（既有註解已暗示通用語意，本次正式統一），所有 Payment 共用、處理中可缺、已完成必填
- **對帳附件（attachments）切「已完成」時必填 ≥ 1 個**（規則從「退款專用」擴及所有 Payment）
- **解耦「Payment 建立 ↔ OA 已執行」自動綁定**：OA「已執行」推進條件從「建立退款 Payment」改為「對應 OA 的 Payment（linkedOrderAdjustmentId = OA.id AND paymentStatus = 已完成）累計 amount = OA.amount」（含符號比較）
- **BREAKING：棄用「執行 OA 自動建補收 Payment」既有設計**（refine-after-sales-refund-and-add-supplementary-print change 在 2026-05-20 歸檔後的對稱機制）：補收 OA（amount > 0，含加印追加 / 加運費 / 急件費 / 補退正向情境）核可後，由業務在 OA 編輯介面手動建補收 Payment（處理中態，符號為正），補齊資料切「已完成」後自動推進 OA「已執行」。與退款 OA 流程完全對稱
- **新增 linkedOrderAdjustmentId 必填規則對稱化**：從 OA 編輯介面建立的 Payment（不論退款 / 補收）必填 OA.id；從 OrderPaymentSection 建立的一般收款 Payment 維持可空；退款 / 補收 Payment 不允許從 OrderPaymentSection 直接建（保留 OA 審核流程的權威性）
- **PaymentPlan.status 推導改用「已完成」Payment 累計**：處理中 Payment 不影響期次狀態（避免「業務先填一半就讓期次跳『已收訖』」的虛假狀態）
- **Order.payment_status 推導改用「已完成」Payment 累計**：處理中 Payment 不觸發訂單付款狀態變動
- **三方對帳公式變動**：收款淨額 = ∑ Payment.amount（**僅 paymentStatus = '已完成'**），新增「處理中（合計）」資訊軸（不計入淨額）
- **store action 拆解**：createRefundPayment 改寫為「建處理中 Payment、不推進 OA」+ 新增 updatePayment（含 paymentStatus 切換、含驗證規則）+ 新增 cancelPayment（處理中直接刪除、已完成可能回退 OA）
- **OA UI 從卡片改 ErpTable 形式**（售後 ticket 內 + 訂單詳情頁 OrderAdjustmentSection 兩處統一），row 操作欄只用單一「編輯」按鈕，編輯 Dialog 內含關聯 Payment 列表 + 新增 / 編輯 / 取消 Payment
- **修正路徑**：「已完成 → 處理中」反向禁止，要修正只能「取消 Payment → 重建」維持 OA 已執行的終態語意（與既有 ORD-003 候選做法 1 對齊）
- **既有 ORD-003 OQ resolve**：處理中 Payment 取消 = 直接刪除、OA 不動；已完成 Payment 取消 = 若該 OA 累計不再達 OA.amount 則回退 OA 至已核可
- **既有 ORD-004 OQ 補 constraint**：處理中 Payment 期間禁止觸發 SalesAllowance 自動建立或弱提示
- **既有資料 Migration**：所有既有 Payment（一般收款 + 退款 + 補收）一律 backfill `paymentStatus = '已完成'`、`completedAt = createdAt`

## Capabilities

### New Capabilities

無（本 change 不引入新 capability）。

### Modified Capabilities

- `order-management`：MODIFY「收款記錄（Payment）」「付款計畫建立」「訂單異動建立與審核」「三方對帳檢視面板」四條 Requirement + Payment Data Model 新增兩欄位 + 新增 Scenario「業務先填一半再補齊」「補收 OA 對稱化流程」
- `state-machines`：MODIFY OrderAdjustment 狀態機觸發點描述（已核可 → 已執行 條件從「Payment 建立」改為「Payment 累計達 OA.amount」）+ Scenario
- `business-processes`：MODIFY 收款流程 + 退款流程 + 補收流程，新 Scenario「業務先填一半再補齊」、「補收 OA 對稱化處理」

## Impact

### spec
- `openspec/specs/order-management/spec.md` — 多條 Requirement + Data Model 異動，含 paymentStatus 欄位定義、對帳公式重寫、訂單異動觸發點改寫
- `openspec/specs/state-machines/spec.md` — OrderAdjustment 狀態機觸發點描述變動，補 Scenario
- `openspec/specs/business-processes/spec.md` — 收款 / 退款 / 補收三條流程改寫

### Prototype 程式碼
- `src/types/payment.ts` — Payment interface 加 paymentStatus / completedAt；helpers 全部加 paymentStatus 過濾（calcPaymentsNetAmount / calcRegularPaymentsAmount / calcRefundsAmount / derivePlanStatus / 新增 calcPendingPaymentsAmount）
- `src/types/order.ts` — PaymentRecord 同步加欄位（兩套並存的型別都加）
- `src/store/useErpStore.ts` — createRefundPayment 改寫（不再同 transaction 推進 OA）+ 新增 updatePayment / cancelPayment + OA 自動推進邏輯改為 Payment 切「已完成」事件觸發
- `src/components/order/AfterSalesTicketDetail.tsx` — OA 從卡片改 ErpTable + 編輯 Dialog 包含關聯 Payment 列表 + 補收 OA 也支援建 Payment（既有設計只支援退款）
- `src/components/order/OrderAdjustmentSection.tsx` — 訂單詳情頁訂單異動 Tab 也改 ErpTable，與售後 ticket 內一致
- `src/components/order/OrderPaymentSection.tsx` — 列表加 paymentStatus column / 處理中視覺差異 / 單一「編輯」按鈕 / Dialog 加 paymentStatus 切換 + conditional required 驗證
- `src/components/order/OrderReconciliationPanel.tsx` — 收款淨額 breakdown 加第三軸「處理中（合計）」+ 差額 hint

### Mock data
- `src/data/mockPayments.ts` — 既有 Payment backfill `paymentStatus = '已完成'`、`completedAt = createdAt`
- 新增 demo mock：1-2 筆一般收款 + 1-2 筆退款 + 1-2 筆補收處於 `paymentStatus = '處理中'`

### Vault 收尾
- `memory/erp/ERP_Vault/08-open-questions/ORD-003-取消退款Payment是否回退OA.md` — 標 resolved + 記錄決策
- `memory/erp/ERP_Vault/08-open-questions/ORD-004-跨期退款SalesAllowance自動建立.md` — 補 constraint「處理中期間禁止觸發 SalesAllowance」
- `memory/erp/ERP_Vault/05-entities/訂單.md` § OrderAdjustment 行為摘要 — 更新「已執行」推進機制描述
- `memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md` § 六、三方對帳 — 更新對帳公式

### 後續關聯 change（不在本範疇）
- 「處理中 Payment 老化追蹤機制」（>7 天提醒 / 主管看板可見度）— 列為新 OQ 候選
- 「會計實務對處理中 Payment 的應收應付處理」— 列為新 OQ 候選，需與會計確認
- 銀行 API 自動對帳整合（Phase 3 進階分析期考慮）

### 風險
- 業務嫌麻煩可能規避（「建立即切已完成」回到原狀 / 「建了忘切」比現狀更糟）→ design.md 內納入失敗條件監測指標
- refine-after-sales-refund-and-add-supplementary-print 在 2026-05-20 才歸檔，1.5 個月內第二次翻轉同議題 → 與 refine 階段建立的「對帳附件必填」設計併存，本 change 不取消必填規則，只是把驗證時點從「建立時」推到「切已完成時」
