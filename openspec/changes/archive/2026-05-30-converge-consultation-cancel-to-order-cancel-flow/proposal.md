## Why

諮詢取消目前把「沒成交的生意」結算成「**訂單完成**」，業務掃訂單列表時把它誤讀成成交、月會數字也被灌入未成交單；且它是一條寫死的**專屬例外路徑**（半額退費 -1000 + 系統自動建單 + 訂單強制完成 + 諮詢專屬自動建待開發票），違反「能用既有流程就不另開例外路徑」原則（見 [feedback_erp_reuse_existing_flows](../../../memory/erp/ERP_Vault/)）。

本 change 將諮詢取消收斂到既有的**一般訂單取消流程**——訂單終態改「已取消」、善後金流沿用既有退款流程、對帳改以「已開立發票」為主軸堵漏帳。經四輪 explore 收斂（plan：`~/.claude/plans/stateful-chasing-hennessy.md`）+ pre-check 稽核（[audit-log 2026-05-29](../../../memory/erp/ERP_Vault/00-meta/audit-log.md)）+ 序列協作 Phase 1-4，過程中顧問揭露 as-built 一個**既存 bug**（諮詢取消 OA 一建即「已執行」卻配「處理中」退款 Payment，違反「OA 已執行→必有已完成 Payment」invariant），本 change 一併修正。

商業背景見 [諮詢單實體卡](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)、[訂單實體卡](../../../memory/erp/ERP_Vault/05-entities/訂單.md)、[付款發票邏輯（七實體連帶矩陣）](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)；相關 OQ：[CR-5](../../../memory/erp/ERP_Vault/08-open-questions/CR-5-諮詢取消退款OA審核路徑.md)、[CR-6](../../../memory/erp/ERP_Vault/08-open-questions/CR-6-諮詢取消專屬待開發票是否廢除.md)、[BI-15](../../../memory/erp/ERP_Vault/08-open-questions/BI-15-對帳主軸改已開發票後未開票應收呈現.md)。

## What Changes

- 諮詢取消後諮詢訂單終態：訂單完成 → **已取消**（解業務誤讀成交的痛點）。**BREAKING**：推翻 `unify-billing-installment-and-reconciliation-csv`（2026-05-28 歸檔）「諮詢取消結算訂單完成」拍板。
- 諮詢取消退款 OA 建法：系統建「**已核可**」（approved_by=system、executed_at=null）→ 沿用一般退款「退款 Payment 切已完成累計達 -1000 才推進已執行」。取代 as-built「一建即已執行」（修既存 invariant bug + 實現業務可調退款金額，沿用既有「已核可後修改不需重審」規則）。
- 廢除諮詢專屬「自動建待開發票」（`BillingInstallment` source_type=consultation_cancellation 的待開票自動建）；改由對帳「應收 > 發票淨額」差額警示提醒業務未開票。保留 source_type=consultation_cancellation enum 語意。
- 善後金流歸一：諮詢取消後發票開立 + 退款款項紀錄沿用一般訂單取消既有流程；「已取消」只鎖訂單內容編輯（印件 / 規格 / 備註），不鎖善後金流（開票 / 收款 / 折讓）。
- 對帳差錯偵測篩選：`calcReconciliationDiscrepancies` 訂單篩選 `status='訂單完成'` → `status ∈ {訂單完成, 已取消} 且該訂單有 status=開立 的 Invoice`，根治「已取消但有收入訂單從對帳消失」漏帳（連帶修一般訂單取消的同類漏帳）。**BREAKING**：推翻 unify-billing 對帳差錯偵測「限訂單完成」拍板。
- 保留不變：半額退費 -1000（CR-3 決議不翻）、金流數字（收 2000 / 退 1000 / 淨 1000）、諮詢取消權限（當前 consultant_id + 業務主管）、諮詢結束不做大貨 / 需求單流失另兩情境（不受影響）。

## Capabilities

### New Capabilities

（無新增 capability，皆為既有 spec 的 requirement 修改）

### Modified Capabilities

- `consultation-request`: 諮詢取消終態改「已取消」+ 廢諮詢專屬自動建待開發票 + 善後歸一一般訂單取消流程
- `order-management`: 諮詢取消退款 OA 建「已核可」（系統內生分流）+ 對帳差錯偵測篩選涵蓋已取消有發票訂單 + 收款變更率認知對齊（諮詢退款 OA 不污染，no-op 註明）
- `state-machines`: 諮詢訂單狀態路徑「建立 → 已取消」（取代「建立 → 訂單完成」）+ OrderAdjustment 狀態機諮詢取消退費分流（系統建「已核可」approved_by=system）
- `prototype-data-store`: `cancelConsultation` 改 status=已取消 + OA 建已核可 + 廢自動建 BillingInstallment；`reconciliationCsv.ts` 差錯偵測篩選改

## Impact

- **Spec**：4 個 delta（consultation-request / order-management / state-machines / prototype-data-store）
- **Prototype（真實程式碼改動僅兩處）**：
  - `src/store/useErpStore.ts` `cancelConsultation`：status 改寫（限此 action，**不動共用 `buildConsultationOrder` helper** 以保護諮詢結束不做大貨 / 需求單流失另兩情境）+ OA 建已核可 + 移除自動建 BillingInstallment
  - `src/utils/reconciliationCsv.ts` L361 `calcReconciliationDiscrepancies`：訂單篩選條件改
- **CEO 指標（經顧問驗證，不增實作）**：收款變更率排除諮詢退款 OA = no-op（公式本就不含 OA 事件）；對帳完整率 KPI=100% 本就達成（CSV 已發票主軸）；NSM 分母排除取消類終態無 prototype 量測載體（dashboard deferred、只需 status=已取消 資料正確）
- **推翻 unify-billing 部分拍板**（design 留決策理由）：諮詢取消終態 + 對帳差錯偵測篩選 + as-built OA 已執行→已核可
- **修既存 bug**：as-built 諮詢取消 OA「已執行配處理中 Payment」invariant 破洞
- **平台**：僅桌機瀏覽器（ERP 限制）
