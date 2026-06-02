## MODIFIED Requirements

### Requirement: 訂單階段印件規格編輯時機

訂單階段的印件規格（`spec_note`）/ 購買數量（`pi_ordered_qty`）/ 單位（`unit`）/ 難易度（`difficulty_level`）/ 報價單價（`price_per_unit`）的可編輯性 SHALL 依 `Order.status` **以「訂單完成 / 已取消」終態為界**區分兩階段（路 C：明細時點分界 = 訂單狀態終態集合，取代舊「報價單價製作後 disabled」與「金額 / 印件規格分開操作」門控）：

**階段一：訂單未進入終態（status ∉ {訂單完成, 已取消}）**

業務 / 諮詢 / 訂單管理人 SHALL 可於訂單詳情頁印件清單操作欄點「編輯印件」開啟 `EditOrderPrintItemPanel` 直接編輯下列欄位：`spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level` / `price_per_unit`（**含調降**）。系統 SHALL 直接更新 PrintItem / OrderItem 對應值，印件費（`pi_ordered_qty × price_per_unit`）與訂單應收即時重算；ActivityLog MUST 記錄變更內容（before / after）。

- **金額調降留痕**：`price_per_unit` 或 `pi_ordered_qty` 調降（致印件費減少）時，系統 MUST 寫 OrderActivityLog 事件類型 `pre_completion_amount_decrease`（含 timestamp / 操作者 / before-after / 印件識別）。調降為弱把關（不阻擋、不送業務主管核可；主管事後可於活動紀錄查見）。
- **製作後規格異動通知**：製作後（status ∈ 製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中）業務於 Side Panel 編輯規格類欄位（含金額類）時，系統 SHALL 推送 in-app 通知 + 寫 ActivityLog（詳見 § Requirement: 製作後印件規格異動系統自動通知）。

**階段二：訂單進入終態（status ∈ {訂單完成, 已取消}）**

所有印件欄位（含金額類）MUST 為唯讀；金額異動一律走「訂單異動」Tab 建立 OrderAdjustment（補收正 / 退款負）。訂單完成後的退款 OA 經 AfterSalesTicket 容器；補收 OA 為訂單完成後對客戶加收（極少，公司多吸收）。

**權責邊界**：
- 業務 / 諮詢：負責訂單中的資訊（含 PrintItem 金額與規格）— 訂單詳情頁 Side Panel 為單一寫入入口
- 印務：負責工單中的資訊（ProductionTask / 製程 / 材料規格）— 工單異動流程不寫回 PrintItem 規格

**廢止**：原「印件售價 / 訂單其他費用變更含金額影響時 SHALL 走訂單異動 Tab」（金額 / 規格分離、議題 5 拍板）於訂單完成前**廢止**——完成前金額可直接改、不需走 OA；金額異動走 OA 僅適用訂單完成後。

#### Scenario: 製作中業務直接加印（調高數量）

- **GIVEN** 訂單 SO-001 狀態 = 製作中、某印件 pi_ordered_qty = 500、price_per_unit = 100（印件費 50000）
- **WHEN** 業務於 Side Panel 改 pi_ordered_qty = 800
- **THEN** 系統 SHALL 直接更新 PrintItem，印件費即時重算 = 80000，訂單應收即時 +30000
- **AND** ActivityLog MUST 記錄變更（before 500 / after 800）
- **AND** 系統 SHALL 推送 in-app 通知給印務（製作後規格異動通知）
- **AND** 對帳面板 SHALL 出現「應收 > 發票淨額 / 收款淨額」待開票 + 待收差額

#### Scenario: 製作中業務調降單價（含調降留痕）

- **GIVEN** 訂單 SO-001 狀態 = 製作中、某印件 price_per_unit = 100
- **WHEN** 業務於 Side Panel 改 price_per_unit = 90（調降）
- **THEN** 系統 SHALL 直接更新 PrintItem，印件費與應收即時減少
- **AND** 系統 MUST 寫 OrderActivityLog 事件 `pre_completion_amount_decrease`（含 before 100 / after 90 / 操作者 / 時間）
- **AND** 調降 MUST NOT 阻擋、MUST NOT 送業務主管核可（弱把關）

#### Scenario: 訂單完成後印件金額唯讀走 OA

- **GIVEN** 訂單 SO-001 狀態 = 訂單完成
- **WHEN** 業務於印件清單嘗試編輯 price_per_unit
- **THEN** 系統 SHALL disabled 金額欄位、顯示 Tooltip「訂單已完成，金額變更需走『訂單異動』Tab」
- **AND** 金額異動 SHALL 走 OrderAdjustment（補收 / 退款）

#### Scenario: 諮詢取消訂單（已取消終態）印件唯讀

- **GIVEN** 諮詢取消後諮詢訂單 status = 已取消
- **THEN** 所有印件欄位 MUST 為唯讀（已取消為終態，與訂單完成同屬鎖定終態集合）

---

### Requirement: OrderExtraCharge vs OrderAdjustment.fee 時間邊界

訂單額外費用（資料模型實體 `OrderExtraCharge`）SHALL 限於「訂單未進入終態」時使用。凍結錨點為 **`Order.status` 進入終態集合 {訂單完成, 已取消}**（路 C：與印件金額同步，鎖定點統一為訂單完成終態；取代舊版「線下自審核通過起凍結」——審核通過完全不鎖定明細金額）：

- **線下訂單**：訂單額外費用可於訂單完成前任一狀態（草稿 / 待業務主管審核 / 審核通過 / 報價待回簽 / 已回簽 / 製作中 / 出貨中等）由業務 / 諮詢直接新增 / 編輯 / 刪除（含調降 amount，運費 / 急件費等），不需業務主管審核；**自進入「訂單完成 / 已取消」終態起凍結**，之後費用異動走訂單異動的 `item_type = fee` 明細。
- **線上訂單**：訂單額外費用由 EC 結帳帶入、無業務手動新增視窗；訂單完成後新增費用走訂單異動。
- **諮詢訂單**：訂單額外費用為建立時的諮詢費；進入終態後費用變更走訂單異動。

OrderExtraCharge 調降（amount 減少 / 刪除致應收減少）時 MUST 寫 OrderActivityLog `pre_completion_amount_decrease`（弱把關、不阻擋）。

UI SHALL 在訂單進入終態後隱藏「新增訂單額外費用」按鈕，引導走訂單異動。系統 SHALL 在 API 層拒絕終態後的訂單額外費用寫入請求。

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

### Requirement: 審核通過狀態下訂單修改

訂單於「審核通過」狀態下，業務 / 諮詢 SHALL 可直接修改訂單內容（如印件規格細節、印件金額 / 報價總額、訂單須知 / 交貨備註等一般備註、配送資訊等），修改 MUST NOT 觸發回業務主管重新審核（路 C：審核通過不再鎖定明細金額 / 報價總額，鎖定點移至訂單完成終態）。

**鎖定欄位（進入審核通過起唯讀，非金額類成交條件保護，路 C 不放開）**：`payment_terms_note`（收款條件備註）與 `approved_by_sales_manager_id`（審核業務主管）自進入「審核通過」起鎖定為唯讀，**MUST NOT** 於審核通過後被業務直接修改（避免核准後外發前竄改業務主管已審視的收款條件 / 核可者軌跡繞過把關）。`approved_by_sales_manager_id` 進入審核通過後即為「實際核可者」歷史紀錄、鎖定唯讀。

**客戶變更**：客戶（廠客）變更直接影響成交對象，MUST 走訂單異動 / 重審（保留，非路 C 報價鎖定範疇）。

**移除（路 C）**：原「核心欄位變更例外」中「報價總額（含 OrderExtraCharge 加總）」「付款條件結構（PaymentPlan 期次金額 / 期數）」**移出鎖定**——報價總額由印件金額 / OEC 完成前可直接改涵蓋（應收即時重算）；期次結構變更沿用「廢止付款計畫變更觸發回審」既有 Requirement（ActivityLog 留軌、不回審）。

業務直接修改 MUST 於訂單 ActivityLog 記載「審核通過狀態下訂單修改：欄位 X 由 A 變更為 B」；金額調降另寫 `pre_completion_amount_decrease`。

#### Scenario: 業務於審核通過狀態直接修改報價總額（路 C）

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務於印件清單直接改 price_per_unit（影響報價總額）
- **THEN** 系統 SHALL 直接儲存、應收即時重算
- **AND** 訂單狀態 MUST 維持「審核通過」（不回審）
- **AND** ActivityLog MUST 記載修改

#### Scenario: 業務於審核通過狀態直接修改備註

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務修改「訂單須知」備註
- **THEN** 系統 SHALL 直接儲存、訂單狀態維持「審核通過」、ActivityLog 記載

#### Scenario: 收款條件備註審核通過後鎖定

- **GIVEN** 訂單狀態為「審核通過」
- **WHEN** 業務嘗試修改 payment_terms_note
- **THEN** 系統 MUST 阻擋（唯讀），提示「收款條件已於審核通過鎖定」

---

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額分解：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（**僅 Payment.paymentStatus = '已完成'**，含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

**差額分解（路 C：四向善後引導）**：
- 應收 > 發票淨額 → **待開票 / 待折讓**（尚有收入未開立發票，或退款已調應收但未開折讓）
- 應收 > 收款淨額 → **待收**（尚有應收未收款）
- 收款淨額 > 應收 → **應退差額**（已收 > 應收，本 change 一律當「退款待執行」；溢收 / 預收細分另議，見 BI-3）
- 發票淨額 > 應收 → **待折讓**（已開票過多，需折讓沖減）

差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

**[路 C] 退款核銷應退差額**：退款 Payment（amount < 0）核銷「應退差額」、不綁單一 OA 累計（`linkedOrderAdjustmentId` 選填）、不進期次。退款完成的物理錨點 = 退款 Payment 自身切「已完成」（業務上傳匯款證明），對帳差額歸零是**結果呈現**、非完成判定本身。多筆退款帳平不分筆判定，但每筆退款 Payment MUST 各自挂匯款證明附件。

**[路 C] 差額警示不可忽略**：對帳面板的應退差額 / 待開票 / 待收警示 SHALL NOT 提供「忽略此差額」選項——缺口只能靠實際開票 / 收款 / 退款消除（補「帳上已退、實際沒退」保護降級洞）。

**[路 C] 完成前調降與期次同步引導**：完成前明細調降致應收下降、若 `Σ BillingInstallment.scheduled_amount > 應收`，對帳面板 SHALL 顯示「應收已下降、期次規劃需同步」引導（不阻擋；沿用警示而非阻擋精神），業務 MAY 下修期次 scheduled_amount。

**[本 change 沿用] 處理中 Payment 資訊軸（不計入收款淨額）**：對帳面板收款淨額卡片內 SHALL 顯示 breakdown（已完成一般收款 +N / 已完成退款 -M / 處理中 ±0 muted）；差額 hint 加註「另含處理中款項 K 元，齊備後將計入」。

#### Scenario: 完成前減量退款核銷應退差額（情境 C）

- **GIVEN** 訂單某印件 800 張 × 100 = 印件費 80000、已開發票 80000、已完成收款 80000（三軸平）
- **WHEN** 業務於 Side Panel 改數量 800 → 500（調降）
- **THEN** 印件費即時 = 50000、應收 = 50000；對帳面板顯示「發票淨額(80000) > 應收(50000) 待折讓 30000」「收款淨額(80000) > 應收(50000) 應退差額 30000」
- **WHEN** 業務於原發票開折讓 SalesAllowance(-30000)
- **THEN** 發票淨額 = 50000
- **WHEN** 業務建退款 Payment(-30000, linkedOrderAdjustmentId = null)、上傳匯款證明、切已完成
- **THEN** 收款淨額 = 50000、三軸平、應退差額歸零（退款完成 = 退款 Payment 已完成）

#### Scenario: 多筆退款逐筆挂憑證

- **GIVEN** 訂單應退差額 = 40000（明細減 30000 + 售後 OA 退 10000）
- **WHEN** 業務建退款 Payment P-A(-30000) + P-B(-10000)
- **THEN** P-A 與 P-B SHALL 各自挂匯款證明附件方可切「已完成」
- **AND** 兩筆皆已完成後收款淨額減 40000、應退差額歸零（帳平不分筆判定）

#### Scenario: 應退差額警示不可忽略

- **GIVEN** 訂單應退差額 = 30000（已收 > 應收）
- **WHEN** 業務 / 會計查看對帳面板
- **THEN** 面板 SHALL 顯示「應退差額 30000、退款待執行」警示
- **AND** 面板 MUST NOT 提供「忽略此差額」選項

#### Scenario: 訂單異動 + 折讓退款的三方對帳（已完成 Payment 條件）

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000（已執行）、開立發票合計 25,000、確認折讓 -10,000、已完成收款合計 25,000、已完成退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

---

### Requirement: 補收 OA（正項）跳過審核中間態直達已執行

系統 SHALL 依 amount 正負與 adjustment_type 自動判定 OA 是否需業務主管審核：補收正項 OA（amount > 0 且 adjustment_type ∈ 五項補收 type）SHALL 跳過「待主管審核」與「已核可」中間態直達「已執行」狀態（approved_by = 業務 user_id、executed_at = now、應收 +N 立即認列）。

OrderAdjustment `requires_supervisor_approval` derived field：
- amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項} → false（補收正項）
- amount < 0 → true（退款負項）
- adjustment_type = 諮詢取消退費（系統內生）→ false

**[路 C] OA「已執行」語意統一**：補收與退款 OA 的「已執行」一致定義為「核可後應收調整生效」（不綁 Payment 切已完成累計達標）。補收 OA 核可 = 建立即執行（免審）、應收即時 +N。此語意取代舊「退款 OA 已執行需綁 Payment 累計達 OA.amount」（退款 OA 改同此語意，見 § 退款 OA Requirement）。

補收 OA 主要適用訂單完成後對客戶加收（完成前增項走明細直接改、不建 OA）。

#### Scenario: 業務建立加印追加補收 OA 立即執行（訂單完成後）

- **GIVEN** 訂單已完成、客戶要求補印 +8000（客戶承擔）
- **WHEN** 業務於 AfterSalesTicket 內建立 OA-060（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** 系統 SHALL 設定 requires_supervisor_approval = false、OA-060.status 直接 = 已執行（approved_by=業務, executed_at=now）
- **AND** 應收 SHALL 立即 +8000
- **AND** 對帳面板 SHALL 顯示「應收 > 期次規劃」差額、引導業務建 / 併期次

---

### Requirement: 退款 OA（負項）沿用業務主管核可 + 不進期次

退款負項 OA（amount < 0）SHALL 沿用業務主管核可把關（現金流出強把關），但「已執行」語意改為「核可後應收調整生效」（路 C：與補收對稱、不綁 Payment 累計達標）：

- requires_supervisor_approval = true
- 狀態流轉：草稿 → 待主管審核 → 已核可（業務主管核可）→ **已執行（核可後應收調整生效，系統自動推進、不等退款 Payment）**
- **[路 C 移除]** 舊「業務建退款 Payment 切已完成 → 累計達 OA.amount 才推進已執行」推進綁定 **移除**；OA 已執行不再等退款 Payment。
- **[路 C 移除]** 舊「取消已完成 Payment 致累計不足回退 OA 至已核可」回退機制 **移除**（不再有「累計達標」概念，見 [ORD-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-003-取消退款Payment是否回退OA.md) 取代）。
- **退款現金動作**：業務於 OA 介面或對帳面板建退款 Payment（amount < 0, paymentMethod=退款, `linkedOrderAdjustmentId` 選填）、上傳匯款證明、切「已完成」核銷應退差額；**退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次）。
- **退款完成判定** = 退款 Payment 切「已完成」（物理錨點）；對帳應退差額歸零為結果呈現。
- 誤建退款 Payment 修正：取消退款 Payment → 應退差額重新出現 → 對帳差額警示引導重退（OA 已執行 / 應收已調整維持不動）。
- 發票端（免審核，退款 OA 已核可即批准）：未跨月作廢原 Invoice 重開；已跨月開立 SalesAllowance 折讓關聯原 Invoice、refund_payment_id 手動關聯退款 Payment。
- BillingInstallment 不受退款影響（保留正向期次稽核歷史）。

#### Scenario: 訂單完成後售後退款（核可即生效 + 退款核銷差額）

- **GIVEN** 訂單已完成、應收 80000、已開發票 80000、已收訖 80000
- **WHEN** 業務建立 AfterSalesTicket + 內建退款 OA-070（amount=-10000, adjustment_type=退印）並送審
- **THEN** OA-070.status = 待主管審核
- **WHEN** 業務主管核可
- **THEN** OA-070.status SHALL 直接 = 已執行（核可即生效）、應收 SHALL = 70000（不等退款 Payment）
- **AND** 對帳面板 SHALL 顯示「收款淨額(80000) > 應收(70000) 應退差額 10000」
- **WHEN** 業務建退款 Payment P-070(amount=-10000, linkedOrderAdjustmentId=OA-070.id)、上傳匯款證明、切已完成
- **THEN** 收款淨額 = 70000、應退差額歸零（退款完成）
- **AND** P-070 MUST NOT 建 PaymentAllocation
- **WHEN** 已跨月：業務於原發票建 SalesAllowance(-10000, refund_payment_id=P-070.id)
- **THEN** 發票淨額 = 70000、三軸平

#### Scenario: 取消退款 Payment 後差額重現（無回退機制）

- **GIVEN** 退款 OA-070 已執行（應收已 -10000）、退款 Payment P-070 已完成
- **WHEN** 業務取消 P-070（發現匯款金額打錯）
- **THEN** OA-070 SHALL 維持「已執行」（應收維持已調整 -10000、不回退）
- **AND** 對帳面板 SHALL 重新出現「應退差額 10000」、引導業務重建退款 Payment
