## ADDED Requirements

### Requirement: 訂單詳情頁業務負責人 row 簡化

訂單詳情頁「資訊」Tab 內的「訂單資訊」卡中，業務負責人 row 的 value 區 SHALL 僅顯示業務負責人姓名純文字，MUST NOT 包含「分享 / 轉單」按鈕或任何 inline 動作按鈕。

業務的臨時協助 / 代理授權 SHALL 完全由「分享」Tab 內的 PermissionManagement 元件承接（沿用 US-ORD-004 機制）。正式轉單需求 SHALL 由 Supervisor 透過既有「Supervisor 重新指定訂單業務主管」流程處理（見既有 Requirement）。

#### Scenario: 業務查看訂單資訊卡業務負責人 row

- **WHEN** 業務於訂單詳情頁「資訊」Tab 查看「訂單資訊」卡的業務負責人 row
- **THEN** value 區 SHALL 僅顯示業務負責人姓名（或當無業務負責人時顯示 `-`）
- **AND** value 區 MUST NOT 顯示「分享 / 轉單」按鈕或任何 inline 動作按鈕

#### Scenario: 業務需要分享訂單檢視 / 編輯權限

- **GIVEN** 業務想授予同事檢視 / 編輯訂單的權限
- **WHEN** 業務切到「分享」Tab
- **THEN** PermissionManagement 元件 SHALL 提供搜尋同事 + 授予檢視 / 編輯權限的完整流程
- **AND** 業務 SHALL NOT 需要回到「資訊」Tab 觸發任何業務負責人 row 內的按鈕

---

### Requirement: 訂單詳情頁印件清單表格結構

訂單詳情頁「印件清單」Tab 的表格 SHALL 採單層 row 結構（移除 ErpExpandableRow 兩層展開），共 14 欄，順序如下：

| 順位 | 欄位 | 來源 / 說明 |
|------|------|-------------|
| 1 | 縮圖 | PrintItem.thumbnail（120px 方形；無圖時顯示佔位 icon） |
| 2 | 印件名稱 | PrintItem.item_name |
| 3 | 規格備註 | PrintItem.spec_note |
| 4 | 類型 | PrintItem.type（打樣印件 / 大貨印件 / 補印印件，沿用 PrintItemTypeLabel） |
| 5 | 印件狀態 | PrintItem 印製維度狀態 |
| 6 | 審稿狀態 | PrintItem 審稿維度狀態 |
| 7 | 打樣結果 | 打樣印件適用（sampleResult） |
| 8 | 購買數量 | PrintItem.ordered_qty + unit |
| 9 | 售價 | PrintItem.price_per_unit（未稅，製作前可編輯） |
| 10 | 生產數量 | PrintItem.produced_qty |
| 11 | 入庫數量 | PrintItem.warehouse_qty |
| 12 | 出貨數量 | PrintItem.shipped_qty |
| 13 | 交期 | PrintItem.delivery_date |
| 14 | 操作 | 補件 / 編輯印件 / 檢視 按鈕群（依狀態條件顯示） |

縮圖欄 SHALL 為首欄、尺寸 120 × 120 pixel 方形，渲染對齊 DESIGN.md § 0.1「縮圖 / 圖像欄置於資料列首欄」原則。

操作欄 SHALL 依印件狀態條件顯示三種按鈕：
- **補件**：審稿維度狀態 = 不合格 時顯示（沿用既有 add-prepress-review 補件入口）
- **編輯印件**：訂單處於製作前階段（isBeforeProduction）時顯示，點擊開啟 EditOrderPrintItemPanel
- **檢視**：**永遠顯示**，點擊開啟 PrintItemDetailSidePanel（見下方 ADDED Requirement）

操作欄 MUST NOT 包含「申請異動」按鈕（移除原 row-level 入口，動線改由業務通知印務從工單異動處理；見 § MODIFIED 訂單階段印件規格編輯時機）。

以下 5 個欄位從表格主表移除，內容統一在 PrintItemDetailSidePanel 內呈現（漸進揭露 progressive disclosure）：
- 預計產線
- 難易度
- 出貨方式
- 稿件檔案
- 工單數

#### Scenario: 業務查看訂單詳情頁印件清單

- **WHEN** 業務於訂單詳情頁切到「印件清單」Tab
- **THEN** 表格 SHALL 顯示 14 欄、單層 row 結構
- **AND** 縮圖 SHALL 為首欄、120px 方形
- **AND** 表格 SHALL NOT 含「展開圖示」欄與兩層展開的工單嵌套表格

#### Scenario: 製作前印件操作欄按鈕顯示

- **GIVEN** 訂單處於製作前階段（status ∈ {報價待回簽、已回簽、審稿段}）
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 顯示「編輯印件」按鈕（點擊開 EditOrderPrintItemPanel）+「檢視」按鈕（點擊開 PrintItemDetailSidePanel）

#### Scenario: 製作後印件操作欄按鈕顯示

- **GIVEN** 訂單已進入製作階段（status ∈ {製作等待中、工單已交付、製作中、製作完成、出貨中}）
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 僅顯示「檢視」按鈕
- **AND** 操作欄 MUST NOT 顯示「申請異動」按鈕（規格異動動線改走印務從工單異動處理）
- **AND** 操作欄 MUST NOT 顯示「編輯印件」按鈕

#### Scenario: 不合格印件含補件入口

- **GIVEN** 印件審稿維度狀態 = 不合格
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 顯示「補件」按鈕（沿用 add-prepress-review change 既有補件入口）
- **AND** 同時顯示「檢視」按鈕（以及製作前的「編輯印件」按鈕，依條件組合）

#### Scenario: 縮圖無圖時顯示佔位

- **GIVEN** 印件無縮圖（thumbnail URL 為空）
- **WHEN** 業務查看印件清單縮圖欄
- **THEN** 縮圖欄 SHALL 顯示 120 × 120 pixel 佔位框（dashed border + Image icon）
- **AND** 佔位框 SHALL NOT 含下載 link icon

---

### Requirement: 印件詳情 Side Panel（PrintItemDetailSidePanel）

訂單詳情頁印件清單表格的「檢視」按鈕點擊 SHALL 開啟右側 Side Panel（PrintItemDetailSidePanel），承載印件單筆深入檢視內容。

**容器規格**：
- 採用 ErpSidePanel 元件
- size = `lg`
- direction = `right`

**Header**：
- 印件名稱
- PrintItemTypeLabel（沿用 add-after-sales-ticket / refine-after-sales-refund 既有共用元件）
- 印件狀態 Badge
- 「開啟完整詳情頁」link（點擊 navigate 至 `/print-items/<id>` 印件完整詳情頁）

**Body**（三區塊垂直排列）：

1. **印件資訊區塊**：沿用既有 `PrintItemSpecCard` 共用元件（印件詳情 / 工單詳情 / 審稿詳情三頁共用、吃 ViewModel interface）。MUST 涵蓋本次從主表移除的欄位：預計產線 / 難易度 / 出貨方式（自動由 PrintItemSpecCard 渲染）。

2. **印件檔案區塊**：沿用既有 `PrintItemArtworkCard` 共用元件。MUST 涵蓋原始稿件檔案、審稿後稿件檔案、縮圖三類，承接本次從主表移除的「稿件檔案」欄。

3. **相關工單清單**：6 欄表格（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日），承接本次從主表移除的「工單數」摘要 + 原 ErpExpandableRow 子表內容。工單編號 SHALL 為可點擊連結，點擊 navigate 至 `/work-orders/<id>`。

**Footer**：關閉按鈕

#### Scenario: 業務點檢視按鈕開啟 Side Panel

- **WHEN** 業務於印件清單操作欄點擊「檢視」按鈕
- **THEN** 右側 SHALL 開啟 PrintItemDetailSidePanel
- **AND** Header SHALL 顯示印件名稱 + 類型 Label + 狀態 Badge + 開啟完整詳情頁 link
- **AND** Body SHALL 依序顯示印件資訊區塊（PrintItemSpecCard）+ 印件檔案區塊（PrintItemArtworkCard）+ 相關工單清單表格

#### Scenario: Side Panel 內預計產線 / 難易度 / 出貨方式呈現

- **GIVEN** 印件設有預計產線、難易度、出貨方式
- **WHEN** 業務查看 Side Panel 印件資訊區塊
- **THEN** PrintItemSpecCard SHALL 涵蓋預計產線 / 難易度 / 出貨方式三個欄位（由共用元件統一渲染）

#### Scenario: Side Panel 相關工單清單

- **GIVEN** 印件下有 1 個（或多個）相關工單
- **WHEN** 業務查看 Side Panel 相關工單清單區塊
- **THEN** 表格 SHALL 顯示 6 欄（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日）
- **AND** 工單編號 SHALL 為可點擊連結（點擊 navigate 至 `/work-orders/<id>`）
- **AND** 印件無相關工單時 SHALL 顯示「尚無工單」空狀態提示

#### Scenario: 從 Side Panel 跳轉至印件完整詳情頁

- **WHEN** 業務點擊 Side Panel Header 內「開啟完整詳情頁」link
- **THEN** 系統 SHALL navigate 至 `/print-items/<id>` 印件完整詳情頁

---

## MODIFIED Requirements

### Requirement: 訂單階段印件規格編輯時機

訂單階段的印件規格（`spec_note`）/ 購買數量（`pi_ordered_qty`）/ 單位（`unit`）/ 難易度（`difficulty_level`）/ 報價單價的可編輯性 SHALL 依 `Order.status` 區分兩階段：

**階段一：訂單已建立 → 報價待回簽 → 已回簽 → 審稿段（稿件未上傳 / 等待審稿 / 待補件）**

業務 / 訂單管理人 SHALL 可直接編輯上述欄位，系統直接更新 PrintItem / OrderItem 對應值；ActivityLog MUST 記錄變更。

**階段二：製作等待中（含）之後所有狀態（已取消除外）**

涵蓋狀態：製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成。

業務 SHALL NOT 直接編輯上述欄位；變更 SHALL 透過以下兩條動線之一處理：

- **金額異動**（規格變更含價差 / 加印追加 / 退印 / 補退 / 折扣 / 客訴退款 / 補件免收 / 訂金補收）：業務於訂單詳情頁「訂單異動」Tab 建立 OrderAdjustment，依變更類型選用對應 adjustment_type；OrderAdjustment 經業務主管核可並執行後，系統 SHALL 同步更新 PrintItem / OrderItem 欄位並建立補收 / 退款 Payment。

- **印件規格異動**（不涉及金額的規格描述更新）：業務 SHALL 通知印務，由印務從工單異動流程處理（見 work-order spec § 工單異動流程）。

訂單詳情頁「印件清單」Tab 表格 row 操作欄 MUST NOT 顯示「申請異動」按鈕。製作後印件規格變更的動線指引 SHALL 由表格下方頁面層級 Info Banner（「訂單已進入製作階段，調整需走訂單異動流程」）承擔，不在 row 層級重複提示。

> OrderAdjustment 完整 enum（8 值）與狀態機定義於 `add-after-sales-ticket` change 的 `specs/order-management/spec.md` § OrderAdjustment.adjustment_type 完整 enum 與 `specs/state-machines/spec.md` § OrderAdjustment 狀態機。訂單期間建立的 OrderAdjustment SHALL 將 `linked_after_sales_ticket_id` 設為 NULL，售後 ticket 內建立的關聯異動才填入 ticket FK。

訂單狀態 = 已取消的訂單，所有印件欄位 MUST 為唯讀，不允許異動。

#### Scenario: 報價待回簽階段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁修改 `spec_note` 與 `pi_ordered_qty`
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** ActivityLog MUST 記錄變更內容、操作人、時間

#### Scenario: 審稿段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 等待審稿
- **WHEN** 業務 / 客戶溝通後於印件詳情頁調整 `spec_note`
- **THEN** 系統 SHALL 直接更新 PrintItem（審稿段內無需走 OrderAdjustment）
- **AND** ActivityLog MUST 記錄變更

#### Scenario: 製作後業務發起含金額的印件規格變更

- **GIVEN** 訂單 SO-001 狀態 = 製作等待中、業務需追加 100 份印件
- **WHEN** 業務切到訂單詳情頁「訂單異動」Tab 點擊「新增訂單異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment 草稿（adjustment_type = 加印追加）
- **AND** 業務 SHALL 填寫差額並送業務主管審核
- **AND** OrderAdjustment 經核可並執行後系統 SHALL 同步更新 PrintItem.ordered_qty 並建立補收 Payment

#### Scenario: 製作後業務發起不涉及金額的印件規格描述變更

- **GIVEN** 訂單 SO-001 狀態 = 製作中、業務需更新印件 spec_note 文字描述（不影響金額）
- **WHEN** 業務通知印務需異動印件規格描述
- **THEN** 印務 SHALL 從工單異動流程處理（沿用 work-order spec § 工單異動流程既有 Requirement）
- **AND** 訂單詳情頁印件清單 row 操作欄 MUST NOT 提供「申請異動」按鈕作為業務發起入口

#### Scenario: OrderAdjustment 執行後同步印件欄位

- **GIVEN** OrderAdjustment OA-001 狀態 = 已核可、明細包含「PrintItem PI-001 規格變更：500g 銅版紙 → 350g 雪銅」
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 系統 SHALL 同步更新 PrintItem PI-001.spec_note
- **AND** 若異動含金額差，系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）

#### Scenario: 已取消訂單印件唯讀

- **GIVEN** 訂單 SO-001 狀態 = 已取消
- **WHEN** 業務開啟印件詳情頁
- **THEN** 所有印件欄位 MUST 為唯讀
- **AND** 系統 MUST NOT 顯示「編輯」或「申請異動」按鈕

---

### Requirement: 雙欄計價輸入與顯示

訂單 SHALL 採雙欄計價，所有金額欄位（subtotal、other_fee、shipping_fee、consult_fee、discount、total）同時儲存 `_with_tax` 與 `_without_tax` 兩個值，並於 `Order.tax_amount` 記錄總稅額。

**輸入規則：**

- 線下訂單（order_source = 線下）：業務於需求單 / 訂單階段輸入**未稅金額**，系統依稅率（預設 5%）反推含稅；雙欄同步寫入。
- 線上訂單（order_source ∈ {線上, 線上自定義}）：EC 帶入**含稅金額**，系統反推未稅；雙欄同步寫入。

**顯示規則（採業界 ERP / MES 模式 A1：分項 ErpTable 四欄 + 底部 summary stack）：**

訂單詳情頁「付款記錄」Tab 內的「金額組成」區塊 SHALL 採以下結構，**取代原本「主從欄位（線下單主未稅、線上單主含稅）」動態切換邏輯**：

- **分項區**：ErpTableCard + `.erp-table` 結構，四欄如下：
  | 順位 | 欄位 | 對齊 | 說明 |
  |------|------|------|------|
  | 1 | 分項名稱 | 左 | 商品 / 運費 / 急件費 / 諮詢費 / 其他費用 / 折抵 / 紅利 / 訂單異動 |
  | 2 | 數量 / 說明 | 中 | 商品 row 顯示「N 個印件」；其他 row 顯示來源摘要（如「OrderExtraCharge × N」）|
  | 3 | 小計（未稅） | 右 + font-mono | 該分項的未稅金額 |
  | 4 | 小計（含稅） | 右 + font-mono + text-muted-foreground | 該分項的含稅金額（弱化呈現） |

  - 折抵 / 紅利 / 負值異動 row：金額前綴 `−` + `text-destructive`
  - 待審核異動 row：金額欄改顯「待核可」chip + tooltip
  - 空值分項 row：`text-muted-foreground` 弱化（保留視覺平衡）

- **底部 summary stack**（分項區下方垂直堆疊三層）：
  - 行 1：**小計（未稅）** — `text-sm text-muted-foreground` + `font-mono`
  - 行 2：**營業稅 5%** — `text-sm text-muted-foreground` + `font-mono`
  - 分隔線 Separator
  - 行 3：**= 應收總額（含稅）** — `text-body-medium` label + `text-2xl font-bold text-foreground` value
  - 行 4（條件顯示）：付款狀態 Badge（從分項區移出至 summary 結尾）

- 應收總額 SHALL 使用 `text-2xl font-bold text-foreground`，MUST NOT 使用品牌色（primary / emerald 等飽和色），對齊 DESIGN.md「金額本身不適合用品牌色搶視覺」原則。

- 列表 / 報表查詢 SHALL 支援以任一基準篩選與排序。

**計算公式（稅率 r，預設 r = 0.05）：**

```
with_tax = round(without_tax × (1 + r))
without_tax = round(with_tax / (1 + r))
tax_amount = total_with_tax − total_without_tax
```

rounding 採整數（小數 0 位，與會計慣例一致）。

退款 / 折讓 / OrderAdjustment 金額 SHALL 沿用雙欄結構；實際收款 Payment.amount 不拆雙欄（含稅實收即為入帳金額）。

#### Scenario: 線下單業務輸入未稅金額

- **GIVEN** 業務於需求單成交轉訂單，需求單商品小計（未稅）= 100,000
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_without_tax = 100,000
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_with_tax = 105,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 5,000（總額層級）

#### Scenario: 線上單 EC 帶入含稅金額

- **GIVEN** EC 商品成交金額（含稅）= 5,250
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_with_tax = 5,250
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_without_tax = 5,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 250（總額層級）

#### Scenario: 金額組成分項區雙欄並列

- **WHEN** 業務開啟訂單詳情頁「付款記錄」Tab
- **THEN** 「金額組成」區塊分項區 SHALL 採 ErpTable 四欄結構（分項名稱 / 數量摘要 / 未稅小計 / 含稅小計）
- **AND** 含稅小計欄 SHALL 採 `text-muted-foreground` 弱化呈現（與未稅小計欄並列但非主視覺焦點）
- **AND** 線下單與線上單顯示結構 SHALL 一致（不再依 order_source 動態切換主從）

#### Scenario: 金額組成 summary stack 三層

- **WHEN** 業務查看金額組成區塊底部
- **THEN** SHALL 顯示三層垂直堆疊：小計（未稅）→ 營業稅 5% → = 應收總額（含稅）
- **AND** 應收總額 value SHALL 使用 `text-2xl font-bold text-foreground`
- **AND** 應收總額 MUST NOT 使用品牌色（primary / emerald 等飽和色）

#### Scenario: 折抵 / 紅利 row 視覺呈現

- **GIVEN** 訂單含折抵金額 5,000（負值）
- **WHEN** 業務查看金額組成分項區
- **THEN** 折抵 row 的小計欄位 SHALL 顯示 `−5,000`（前綴 `−`）
- **AND** 採 `text-destructive` 色彩呈現

#### Scenario: 待審核訂單異動的金額組成呈現

- **GIVEN** 訂單存在狀態 = 待主管審核 的 OrderAdjustment
- **WHEN** 業務查看金額組成分項區「訂單異動」row
- **THEN** 金額欄 SHALL NOT 顯示具體數字
- **AND** 應顯示「待核可」chip + tooltip 說明「另有待審核異動，核可執行後將計入」

#### Scenario: 雙欄寫入失敗的一致性保護

- **WHEN** 系統寫入金額時其中一欄寫入失敗
- **THEN** 系統 MUST rollback 整筆寫入並回報錯誤
- **AND** 訂單金額狀態 MUST 保持寫入前一致
