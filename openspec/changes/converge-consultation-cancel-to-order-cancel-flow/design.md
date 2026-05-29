## Context

諮詢取消（待諮詢階段客戶 / 諮詢人員取消預約）現況是一條**寫死的專屬例外路徑**（[consultation-request spec L398-479](../../specs/consultation-request/spec.md)）：系統自動建諮詢訂單 + OrderExtraCharge(+2000) + 退款 OA(-1000) + 退款 Payment + 自動建待開發票，並把訂單**強制推進「訂單完成」**。

這造成兩個問題：(1) 業務掃訂單列表把「沒成交的諮詢」誤讀成成交、月會數字被灌入未成交單；(2) 維護兩套做同一件事（取消 + 退款善後）的邏輯，違反「能用既有流程就不另開例外路徑」。

經四輪 explore 收斂 + pre-check 稽核（[audit-log 2026-05-29](../../../memory/erp/ERP_Vault/00-meta/audit-log.md)）+ 序列協作 Phase 1-4，方向定為**收斂到一般訂單取消流程**。過程中顧問（Phase 3）揭露 as-built 一個既存 bug：諮詢取消 OA 一建即「已執行」，但配「處理中」退款 Payment，違反 [order-management spec L1193-1203](../../specs/order-management/spec.md)「OA 已執行 → 必有已完成 Payment 累計達 OA.amount」invariant；且「已執行」鎖死金額（[L1230-1235](../../specs/order-management/spec.md)），使業務無法調整退款金額。

商業 ground truth：[諮詢單實體卡](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)、[訂單實體卡](../../../memory/erp/ERP_Vault/05-entities/訂單.md)、[付款發票邏輯 §五B 七實體連帶矩陣](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)。

## Goals / Non-Goals

**Goals:**
- 諮詢取消後諮詢訂單終態走「已取消」，解業務誤讀成交痛點
- 諮詢取消善後（發票開立 / 退款款項紀錄）歸一到一般訂單取消既有流程，消除專屬例外路徑
- 修正 as-built OA 既存 invariant bug（已執行配處理中 Payment）+ 實現業務可調退款金額
- 對帳差錯偵測根治：涵蓋「已取消但有開立發票」訂單，連帶修一般訂單取消的同類漏帳
- 金流數字完全不變（收 2000 / 退 1000 / 淨 1000）

**Non-Goals:**
- 不改半額退費 -1000（[CR-3](../../../memory/erp/ERP_Vault/08-open-questions/CR-3-諮詢取消三項擴充議題.md) resolved，比例不重議）
- 不改一般退款 OA 的人工主管核可機制（unify-billing 既有，不鬆動）
- 不重做對帳 CSV 結構（已是發票主軸、14 欄 unify-billing 定稿）
- 不建 dashboard（NSM 量測載體屬 [dashboard deferred epic](../../../memory/erp/ERP_Vault/)）
- 不動共用 `buildConsultationOrder` helper 本體（保護諮詢結束不做大貨 / 需求單流失另兩情境）
- 諮詢取消不走 AfterSalesTicket（售後強制 Order.status=已完成，與已取消衝突）

## Decisions

### D1（核心，Miles 拍板）：諮詢取消退款 OA 建「已核可」而非「已執行」

諮詢取消系統自動建 OA(-1000) 時，status 建為「**已核可**」（approved_by=system、approved_amount=-1000、executed_at=null），而非 as-built 現況的「已執行」。後續沿用一般退款流程：諮詢人員實際銀行退款 → 切退款 Payment「已完成」累計達 -1000 → 系統自動推進 OA「已執行」（[order-management spec L1193-1203](../../specs/order-management/spec.md)）。

- **為什麼 over「已執行」**：「已執行」鎖死金額（L1230，業務無法調整、違反 Phase 1「可調」）+ 配「處理中」退款 Payment 破壞 invariant（既存 bug）。「已核可」同時滿足：系統審核通過（approved_by=system 免人工核可）+ 可調（[L1184 已核可後修改不需重審](../../specs/order-management/spec.md)）+ 善後歸一 + 修 invariant bug。
- **替代方案（否決）**：維持「已執行」→ 須放棄 Phase 1「可調」且 invariant bug 留存。
- **與一般退款 OA 的分流**：諮詢取消退款 OA `requires_supervisor_approval=false`（系統內生、approved_by=system 直接已核可，免人工待主管審核）；一般退款 OA `requires_supervisor_approval=true`（業務送審 → 人工主管核可）。兩者推進「已執行」機制相同（綁退款 Payment 切已完成）。

### D2：諮詢訂單終態「已取消」（推翻 unify-billing）

諮詢取消的諮詢訂單 status = 已取消（取代「訂單完成」），paymentStatus 維持已付款（半額已收事實）。**推翻 `unify-billing-installment-and-reconciliation-csv`（2026-05-28 歸檔）「諮詢取消結算訂單完成」拍板**——當時諮詢取消終態只是順帶沿用「訂單完成」、非 explore 深思決定；本 change 專門針對諮詢取消語義收斂，論證深度不同（prototype 階段翻轉剛歸檔設計無政治成本）。

### D3：對帳改「差錯偵測層篩選」（非 CSV 結構）

顧問釐清對帳有兩層：CSV 匯出層（[reconciliationCsv.ts](../../../sens-erp-prototype/src/utils/reconciliationCsv.ts) buildReconciliationRows）**已以已開立發票為主軸、無 order.status 篩選，涵蓋率本就 100%**；真正限「訂單完成」的是**差錯偵測層** `calcReconciliationDiscrepancies`（L361）。本 change 只改差錯偵測層篩選：`status='訂單完成'` → `status ∈ {訂單完成, 已取消} 且該訂單有 status=開立 的 Invoice`。**推翻 unify-billing 對帳差錯偵測「限訂單完成」拍板**（補齊 unify-billing 只改一半的對帳主軸修正）。

### D4：廢諮詢專屬自動建待開發票 + 差額警示兜底

`cancelConsultation` 移除自動建 BillingInstallment(source_type=consultation_cancellation 待開票) 的邏輯；諮詢取消留的 1000 收入改由業務循一般訂單取消發票開立路徑手動開立。未開票風險由對帳「應收 > 發票淨額」差額警示兜底提醒。保留 `source_type=consultation_cancellation` enum 語意（OQ-BI-1 拍板、避免 unify-billing 拆 enum 白做）。

### D5：top-down 連鎖空轉天然 no-op

諮詢訂單無 workOrders / printItems。`cancelConsultation` 直接組裝 Order 物件 set 進 store（非走 `cancelOrder` action），故一般訂單取消的 top-down 連鎖（工單取消 / 生產任務報廢，[order-management spec L216-229](../../specs/order-management/spec.md)）**天然不被觸發**，無空轉、無報錯。apply e2e MUST 斷言 console 無 error。

### D6：CEO 指標經驗證無需新增實作

- 收款變更率排除諮詢退款 OA = **no-op**：變更率公式分子 6 事件（[order-management spec L3310-3315](../../specs/order-management/spec.md)）本就不含任何 OA 事件，諮詢退款 OA 天然不污染。僅 design / spec 註明認知對齊。
- 對帳收入涵蓋完整率 KPI=100% = **本就達成**（D3 釐清 CSV 匯出層本就發票主軸）。
- NSM「訂單流程完整完成率」分母排除取消類終態 = 正確口徑但**無 prototype 量測載體**（dashboard deferred）；本 change 只確保「諮詢取消 status=已取消」資料基礎正確，量測排除邏輯隨未來 dashboard epic。

## Risks / Trade-offs

- **推翻 unify-billing 剛拍板（2026-05-28，僅隔一天）** → Mitigation：prototype 階段無 production 政治成本；design D2/D3 留決策理由；CR-3 半額 + source_type 語意保留不翻、只翻終態 + 對帳篩選。
- **改寫 cancelConsultation 波及共用 helper 的另兩情境** → Mitigation：status / OA 改寫 MUST 限 cancelConsultation 的 orderWithPayments 組裝層，MUST NOT 動 buildConsultationOrder helper 本體；apply e2e MUST 回歸驗證諮詢結束不做大貨 / 需求單流失兩情境仍為非取消終態 + 仍自動建 BillingInstallment。
- **諮詢退款金額可調但無人工核可** → Mitigation：諮詢退款 OA 系統內生 approved_by=system（政策性半額無業務裁量需把關），業務調整靠既有「已核可後修改不需重審」+ OrderActivityLog 留痕 + 對帳差額警示事後把關（符合「一致性靠事後對帳警示」原則）。
- **諮詢人員忘記開那 1000 發票（廢自動建待開發票後）** → Mitigation：對帳「應收 > 發票淨額」差額警示兜底提醒。
- **差額警示文案混淆兩種善後缺口**（應收>發票淨額 = 待開票 / 收款淨額>應收 = 退款待執行）→ Mitigation：列新 OQ，上線前驗證對外溝通文案，prototype 階段以差額 hint 呈現即可。

## Migration Plan

- prototype 階段無正式資料遷移（mock）。
- as-built 既有諮詢取消 mock 資料：status 改已取消 + OA 改已核可（不影響 `buildBillingInstallmentsFromLegacy` 反向重建，因廢的是 cancelConsultation 的新建邏輯、非歷史遷移 helper）。
- 回滾：本 change 為單一 store action（cancelConsultation）+ 一個對帳 helper（calcReconciliationDiscrepancies）改動，回滾即還原兩處。

## Open Questions

- [CR-5 諮詢取消退款 OA 審核路徑](../../../memory/erp/ERP_Vault/08-open-questions/CR-5-諮詢取消退款OA審核路徑.md)：**D1 已拍板採「已核可」（approved_by=system）** → 隨本 change 標 answered。
- [CR-6 諮詢專屬待開發票是否廢除](../../../memory/erp/ERP_Vault/08-open-questions/CR-6-諮詢取消專屬待開發票是否廢除.md)：**D4 已拍板廢除 + 保留 source_type 語意** → 隨本 change 標 answered。
- [BI-15 對帳主軸改已開發票後未開票應收呈現](../../../memory/erp/ERP_Vault/08-open-questions/BI-15-對帳主軸改已開發票後未開票應收呈現.md)：**D3+D4 已拍板差額警示兜底** → 隨本 change 標 answered。
- **新 OQ（待開）**：差額警示文案區分「待開票」vs「退款待執行」兩種善後缺口（顧問 C-2）→ 留 open，上線前驗證。
