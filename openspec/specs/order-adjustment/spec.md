## Purpose

訂單異動模組 — 管理訂單成立後因規格變更、加印追加、退印、折扣、補運費、急件費等原因導致的金額異動。

**問題**：
- 訂單成立後客戶仍可能追加、退印、或因品質問題退款，這些金額增減需要有獨立的審核軌跡，不能直接改訂單明細（否則無法追溯「原本報多少、後來改了什麼」）
- 補收（客戶加單）與退款（錢退出去）的風險不對稱——退款一旦出錯難追回，補收是送上門的生意——所以需要不同的審核門檻

**目標**：
- 補收正項免審直達已執行（不阻擋業務接單效率），退款負項須業務主管核可（現金流出強把關）
- 每筆異動有獨立狀態機（草稿 → 待主管審核 → 已核可 → 已執行），不阻擋主訂單狀態推進

- 相依模組：[order-management](../order-management/spec.md)（共用 Order 實體）、[order-billing](../order-billing/spec.md)（異動影響應收、退款牽動發票折讓）、[after-sales-ticket](../after-sales-ticket/spec.md)（售後退款走 ticket 容器建異動單）
- 欄位正本：[wiki 訂單異動實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單異動.md)
- 狀態列舉正本：[wiki 訂單異動狀態機卡](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單異動狀態.md)

---
## Requirements

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢於訂單詳情頁建立訂單異動，記錄訂單成立後的金額增減（規格變更 / 加印 / 退印 / 折扣 / 運費 / 急件費等）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消），不影響主訂單狀態推進。補收正項免審直達已執行，退款負項須業務主管核可。「已執行」由關聯 Payment 累計達 OA.amount 自動推進，補收與退款對稱處理。訂單進入終態後售後異動改走 AfterSalesTicket。

**Priority**: P0

**Rationale**: 訂單成立後加印、退印、折扣等金額增減是印刷業常態，需要有獨立審核軌跡（不直接改訂單明細），且補收與退款因風險不對稱需不同審核門檻。

#### Scenario: 業務建立加印追加異動（不變，沿用既有）

- **GIVEN** 訂單 SO-001 狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁點擊「建立訂單異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、UI 標題顯示「訂單異動單」
- **AND** 業務 SHALL 可選 `adjustment_type = 加印追加`
- **AND** 業務新增明細「item_type = print_item，描述 = 加印 200 份，金額 = +20,000」
- **AND** OrderAdjustment.amount SHALL 自動加總為 +20,000
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment（不變，沿用既有）

- **GIVEN** AfterSalesTicket AS-001 status = 處理中、resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、預填 adjustment_type = 退印、linked_after_sales_ticket_id = AS-001
- **AND** 業務填入 amount = -5000、明細描述
- **AND** OrderAdjustment.status SHALL = 草稿，後續走原狀態機（提交審核 → 主管核可 → 業務於 OA 編輯介面建立關聯 Payment 並切「已完成」累計達 OA.amount 自動推進已執行）

#### Scenario: 已完成 / 已取消訂單禁止於訂單詳情頁新增訂單異動單（add-after-sales-ticket 補驗收）

- **GIVEN** Order.status ∈ {訂單完成、已取消}
- **AND** 使用者為業務 / 諮詢
- **WHEN** 使用者進入訂單詳情頁「訂單異動」Tab
- **THEN** 「新增訂單異動單」按鈕 SHALL disabled
- **AND** 按鈕 SHALL 顯示引導提示（Tooltip / title）：已完成 → 「訂單已完成，售後異動請至『售後服務』Tab 建立售後服務單」；已取消 → 「訂單已取消，無法新增訂單異動」
- **AND** 既有 OrderAdjustment（完成前建立的存量）SHALL 仍可檢視、審核、編輯金額、管理關聯 Payment（不受新增閘門影響）
- **AND** 訂單完成後的金額異動 SHALL 改於 AfterSalesTicket 內建立（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）

#### Scenario: 業務主管核可 OrderAdjustment（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核、amount = -5000
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at、approved_amount = -5000

#### Scenario: 業務主管退回 OrderAdjustment（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務於已核可狀態調整金額（沿用 refine-after-sales-refund 設計）

- **GIVEN** OrderAdjustment.status = 已核可、approved_amount = -5000、current_amount = -5000
- **WHEN** 業務發現實際退款金額應為 -4800（客戶談判），於 OA 編輯介面點擊「編輯金額」
- **THEN** 系統 SHALL 允許業務修改 current_amount = -4800
- **AND** OrderAdjustment.status SHALL 維持「已核可」（不需重新送審）
- **AND** 對照欄位 SHALL 顯示「主管核可金額 -$5,000（{approved_at}）｜當前金額 -$4,800｜業務已調整 +$200」
- **AND** audit log SHALL 記錄此異動（previous_amount = -5000, new_amount = -4800, status_at_adjustment = 已核可）

#### Scenario: Payment 切已完成累計達 OA.amount 自動推進 OA 已執行（MODIFY 既有「建立即推進」）

- **GIVEN** OrderAdjustment.status = 已核可、current_amount = -5000、linked_after_sales_ticket_id = AS-001
- **AND** 業務已在 OA 編輯介面建立關聯 Payment P-001（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中'）
- **WHEN** 業務於 P-001 編輯 dialog 補 paidAt、上傳對帳附件、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-001.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA 對應已完成 Payment 累計 = -5000 = OA.amount
- **AND** 系統 SHALL 同 transaction 推進 OrderAdjustment.status → '已執行'、executedAt = now
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ [OrderExtraCharge](../order-management/spec.md).amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** BillingInstallment（請款期次，見 [order-billing](../order-billing/spec.md)）SHALL NOT 自動變動
- **AND** OA 編輯介面內「關聯 Payment 卡片」SHALL 顯示「已執行（透過 Payment-{payment_no} 推進）」

#### Scenario: 補收 OA 對稱化建立 Payment + 切已完成自動推進（對稱化新規）

- **GIVEN** OrderAdjustment OA-002（status = 已核可、amount = +20000、adjustment_type = 加印追加）
- **WHEN** 業務於 OA-002 編輯介面點「新增 Payment」（OA 補收型 → 預填 paymentMethod = '銀行轉帳'）、填入 amount = +20000、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment P-002（amount = +20000, paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **AND** OA-002.status SHALL 維持「已核可」
- **WHEN** 客戶匯款後業務補 paidAt + attachments、切 P-002 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 重算 OA-002 對應已完成 Payment 累計 = +20000 = OA-002.amount
- **AND** 系統 SHALL 推進 OA-002.status → '已執行'

#### Scenario: 棄用「執行 OA 自動建補收 Payment」舊行為驗證

- **GIVEN** 業務建立 OrderAdjustment OA-003（adjustment_type = 加印追加, amount = +20000, status = 草稿）→ 提交審核 → 主管核可（status = 已核可）
- **WHEN** 系統處理該 OA 核可事件
- **THEN** 系統 SHALL NOT 自動建立補收 Payment（既有 spec L1719 / L1734 行為已廢止）
- **AND** OA 編輯介面 SHALL 顯示「新增 Payment」入口供業務手動建補收 Payment
- **AND** 業務 SHALL 在 OA 編輯介面手動建 + 補齊 + 切已完成才能推進 OA 至已執行

#### Scenario: OA 上找不到「執行」按鈕（沿用 refine-after-sales-refund 設計）

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務打開 OA 編輯介面
- **THEN** 系統 SHALL NOT 顯示「執行」按鈕
- **AND** 系統 SHALL 顯示「新增 Payment」按鈕（OA 編輯介面 dialog 內、退款型 / 補收型皆顯示）

#### Scenario: 已執行 OA 鎖定金額（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 已執行
- **WHEN** 業務嘗試打開 OA 編輯金額
- **THEN** 系統 SHALL NOT 顯示「編輯金額」按鈕
- **AND** 金額欄位 SHALL 為唯讀（disabled）

#### Scenario: 訂單異動不阻擋主訂單推進（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

#### Scenario: 訂單異動執行後生產內容變更提示（修訂觸發機制描述）

- **GIVEN** OrderAdjustment 含 print_item 類型明細（例如加印追加、規格變更）
- **WHEN** 透過關聯 Payment 切「已完成」累計達 OA.amount 自動推進 OA 至「已執行」
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 提示為非阻擋式（業務可關閉提示繼續），系統 NOT 自動建立或修改 PrintItem

---

### Requirement: OrderAdjustment.adjustment_type 完整 enum

`OrderAdjustment.adjustment_type` SHALL 採用以下完整 enum 列舉，不再依 phase 限制可選範圍：

| adjustment_type | 適用情境 | 建立方式 |
|----------------|---------|---------|
| 規格變更 | 訂單期間客戶變更印件規格導致金額調整 | 業務手動 |
| 加印追加 | 訂單期間客戶要求加印 | 業務手動 |
| 退印 | 退印 / 退款（訂單期間或售後皆可）| 業務手動 |
| 折扣 | 業務給予客戶折扣 | 業務手動 |
| 加運費 | 訂單成立後補收運費 | 業務手動 |
| 急件費 | 訂單成立後補收急件費 | 業務手動 |
| 補退 | 售後補印收費 / 訂單期間補退 | 業務手動 |
| **諮詢取消退費** | **諮詢取消觸發的半額退款（諮詢費 × 50%）；僅由系統於諮詢取消觸發點自動建立**| **系統內生（業務 UI 不顯示此選項）**|
| 其他 | 不屬上述類別 | 業務手動 |

業務透過 UI 與 API 皆 SHALL 可選用「業務手動」類別的任一 adjustment_type，系統不再依 Order.status 推算限制。「諮詢取消退費」為系統內生 type — 業務 UI 的 adjustment_type 下拉選單 MUST NOT 包含此選項，僅由系統於 [consultation-request spec § 諮詢取消觸發建諮詢訂單與退費](../consultation-request/spec.md) 流程自動建立。

當業務於 AfterSalesTicket 內建關聯 OrderAdjustment 時，UI 仍 SHALL 預填合理的 adjustment_type（例：resolution=退款 → 預填退印；resolution=補印 → 預填補退），但業務可改選（限「業務手動」類別內選項）。

**Priority**: P0

**Rationale**: 明確列舉所有異動類型（規格變更 / 加印 / 退印 / 折扣 / 運費 / 急件費 / 補退 / 諮詢取消退費 / 其他），業務選用時不會選到不適用的類型，系統自動建的「諮詢取消退費」不暴露給業務。

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment 預填 adjustment_type

- **GIVEN** AfterSalesTicket.resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 預填 adjustment_type = 退印
- **AND** 業務可改選為 折扣 / 補退 / 其他（「業務手動」類別內）
- **AND** 業務下拉選單 MUST NOT 顯示「諮詢取消退費」選項

#### Scenario: 業務於訂單期間自由選 adjustment_type

- **GIVEN** Order.status = 生產中
- **WHEN** 業務建立 OrderAdjustment
- **THEN** 業務 SHALL 可從「業務手動」8 個 enum（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）選擇
- **AND** 業務下拉選單 MUST NOT 顯示「諮詢取消退費」選項

#### Scenario: 系統自動建立諮詢取消退費 OA

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、諮詢人員觸發取消諮詢確認流程
- **WHEN** 系統執行「諮詢取消觸發建諮詢訂單與半額退費」流程
- **THEN** 系統 SHALL 自動建立 OrderAdjustment（adjustment_type = `諮詢取消退費`、amount = -1000、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false）
- **AND** OA 建立 MUST NOT 經過業務 / 主管的 UI 操作
- **AND** 業務 SHALL 可於 OA 已核可狀態調整退款金額（沿用既有「已核可後修改不需重審」）；退款 Payment 切已完成累計達 -1000 推進 OA 已執行
- **AND** 應收認列已核可 OA(-1000)，應收公式 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000

### Requirement: 業務主管批次審核 OrderAdjustment（user story）

業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看所有 status = 待主管審核 的 OrderAdjustment，依負責業務 / adjustment_type / 訂單編號篩選，逐筆核可 / 退回。

**Priority**: P1

**Rationale**: 業務主管需要在後台集中檢視所有待審核異動單，逐筆核可或退回，避免散落在各訂單詳情頁逐單處理。

#### Scenario: 業務主管查看待審核異動清單

- **WHEN** 業務主管登入後台進入「待審核訂單異動」頁
- **THEN** 系統 SHALL 列出所有 status = 待主管審核 的 OrderAdjustment
- **AND** 主管 SHALL 可依 adjustment_type 篩選

### Requirement: OrderExtraCharge vs OrderAdjustment.fee 時間邊界

訂單額外費用（資料模型實體 `OrderExtraCharge`，見 [order-management § OrderExtraCharge](../order-management/spec.md)）SHALL 限於「訂單未進入終態」時使用。凍結錨點為 **`Order.status` 進入終態集合 {訂單完成, 已取消}**（與印件金額同步，鎖定點統一為訂單完成終態；取代舊版「線下自審核通過起凍結」——審核通過完全不鎖定明細金額）：

- **線下訂單**：訂單額外費用可於訂單完成前任一狀態（草稿 / 待業務主管審核 / 審核通過 / 報價待回簽 / 已回簽 / 製作中 / 出貨中等）由業務 / 諮詢直接新增 / 編輯 / 刪除（含調降 amount，運費 / 急件費等），不需業務主管審核；**自進入「訂單完成 / 已取消」終態起凍結**，之後費用異動走訂單異動的 `item_type = fee` 明細。
- **線上訂單**：訂單額外費用由 EC 結帳帶入、無業務手動新增視窗；訂單完成後新增費用走訂單異動。
- **諮詢訂單**：訂單額外費用為建立時的諮詢費；進入終態後費用變更走訂單異動。

OrderExtraCharge 調降（amount 減少 / 刪除致應收減少）時 MUST 寫 OrderActivityLog `pre_completion_amount_decrease`（弱把關、不阻擋）。

UI SHALL 在訂單進入終態後隱藏「新增訂單額外費用」按鈕，引導走訂單異動。系統 SHALL 在 API 層拒絕終態後的訂單額外費用寫入請求。

**Priority**: P0

**Rationale**: 訂單額外費用（建立時即確定，不需審核）與訂單異動（成立後變動，需審核）語意不同但都影響應收，必須明確以訂單完成終態為分界，避免業務混淆「該走哪條路徑加費用」。

#### Scenario: 業務於製作中加運費走訂單額外費用

- **GIVEN** 線下訂單 SO-001 處於「製作中」狀態（未進入終態）
- **WHEN** 業務新增 200 元運費
- **THEN** 系統 SHALL 建立 OrderExtraCharge(charge_type = shipping_fee, amount = 200)、應收即時 +200
- **AND** 不需業務主管審核

#### Scenario: 訂單完成後加運費走訂單異動

- **GIVEN** 線下訂單 SO-001 處於「訂單完成」終態
- **WHEN** 業務需補收 200 元運費
- **THEN** UI SHALL 隱藏「新增訂單額外費用」按鈕
- **AND** 業務 SHALL 建立 OrderAdjustment(adjustment_type = 加運費，明細：item_type = fee，amount = 200)

#### Scenario: API 拒絕終態後新增訂單額外費用

- **GIVEN** 線下訂單 SO-001 處於「訂單完成」或「已取消」終態
- **WHEN** 系統收到訂單額外費用寫入請求
- **THEN** 系統 SHALL 拒絕並回傳 400 錯誤
- **AND** 錯誤訊息 SHALL 為「訂單已進入終態，新增費用請走訂單異動單流程」

---

## Data Model

> **欄位正本已遷移至 wiki 實體卡**。本段僅保留實體關聯總覽。
>
> - 異動欄位正本：[wiki 訂單異動實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單異動.md) § 欄位（業務可見）
> - 訂單核心欄位：[wiki 訂單實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)
> - Prototype 型別定義：`sens-erp-prototype/src/types/order.ts`

### 實體關聯總覽

- 一張**訂單**可有多筆**訂單異動單**（金額增減記錄）
- 一筆**異動單**底下有多筆**異動明細項**（逐筆記錄印件或費用的增減）
- 一筆**異動單**可關聯一張**售後服務單**（售後退款走 ticket 容器建異動）
