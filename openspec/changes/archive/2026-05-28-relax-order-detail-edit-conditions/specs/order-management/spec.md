## MODIFIED Requirements

### Requirement: 訂單階段印件規格編輯時機

訂單階段的印件規格（`spec_note`）/ 購買數量（`pi_ordered_qty`）/ 單位（`unit`）/ 難易度（`difficulty_level`）/ 報價單價的可編輯性 SHALL 依 `Order.status` 區分兩階段：

**階段一：訂單未取消（status ≠ 已取消）**

業務 / 諮詢 / 訂單管理人 SHALL 可於訂單詳情頁印件清單操作欄點「編輯印件」開啟 `EditOrderPrintItemPanel` 直接編輯下列欄位：`spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level`。系統 SHALL 直接更新 PrintItem / OrderItem 對應值；ActivityLog MUST 記錄變更內容（before / after）。

`price_per_unit`（報價單價）SHALL 額外受「製作前可編輯」門控：訂單狀態 ∈ 製作前狀態（草稿 / 待業務主管審核 / 報價待回簽 / 已回簽 / 等待付款 / 已付款 / 稿件未上傳 / 等待審稿 / 待補件）時可在 Side Panel 編輯；製作後 disabled 並顯示 Tooltip「訂單已進入製作階段，售價變更需走『訂單異動』Tab 建立補收 / 折讓單」+ 點此跳轉 link。

**製作後**（status ∈ 製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成）業務於 Side Panel 編輯印件規格類欄位（`spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level`）時，系統 SHALL 推送 in-app 通知 + 寫 ActivityLog（詳見 § Requirement: 製作後印件規格異動系統自動通知）。

**權責邊界**（v1.13 新明定）：
- 業務：負責訂單中的資訊（含 PrintItem）— 訂單詳情頁 Side Panel 為 PrintItem 規格的單一寫入入口
- 印務：負責工單中的資訊（含 ProductionTask / 製程 / 材料規格）— 印務的工單異動流程（見 [work-order spec § 工單異動流程](../work-order/spec.md)）不寫回 PrintItem 規格

異動發起時序（人工協作，無系統強制流程）：
- 業務發起（客戶需求調整）：業務於 Side Panel 改 PrintItem → 系統推通知印務 → 印務於工單模組依需求調整生產任務（如需要）
- 印務發起（製程問題）：印務通知業務 → 業務於 Side Panel 改 PrintItem → 系統推通知印務 → 印務於工單模組調整生產任務（如需要）

**金額異動動線**（議題 5 拍板「金額 / 印件規格分開操作」）：印件售價 / 訂單其他費用變更含金額影響時 SHALL 走「訂單異動」Tab 建立 OrderAdjustment（業務 → 業務主管核可 → 執行 → 同步補收 / 退款 Payment）；售後階段（訂單完成後）亦可由 AfterSalesTicket 內建立 OrderAdjustment。業務於 Side Panel 改規格時若涉及金額調整 MUST 分兩步操作（先 Side Panel 改規格、再 Tab 5 / 售後建 OA 處理金額）。

**廢止動線**（v1.7 → v1.13）：原「印件規格異動 → 業務通知印務，由印務從工單異動流程處理」動線完全廢止（spec line 2018 既有規則移除）；印務的工單異動流程僅處理工單層內容，不寫回 PrintItem 規格。

訂單狀態 = 已取消的訂單，所有印件欄位 MUST 為唯讀，不允許異動。

#### Scenario: 報價待回簽階段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件清單操作欄點「編輯印件」開啟 Side Panel 修改 `spec_note` 與 `pi_ordered_qty`
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** ActivityLog MUST 記錄變更內容、操作人、時間
- **AND** 系統 MUST NOT 推送通知給印務（製作前不觸發通知機制）

#### Scenario: 審稿段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 等待審稿
- **WHEN** 業務 / 客戶溝通後於 Side Panel 調整 `spec_note`
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** ActivityLog MUST 記錄變更
- **AND** 系統 MUST NOT 推送通知給印務（製作前不觸發通知機制）

#### Scenario: 製作後業務於 Side Panel 調整印件規格觸發通知

- **GIVEN** 訂單 SO-001 狀態 = 製作中、業務需更新印件 `spec_note` 文字描述
- **WHEN** 業務開啟 Side Panel 編輯 `spec_note` 並儲存
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** 系統 SHALL 推送 in-app 通知給工單負責印務 + 印務主管 + 訂單管理人
- **AND** ActivityLog `action_type = print_item_spec_modified_in_production`，payload 含 before / after / notified_recipients
- **AND** Toast 顯示「已更新印件規格，已通知印務 / 印務主管 / 訂單管理人」

#### Scenario: 製作後業務於 Side Panel 調整含金額影響的印件規格

- **GIVEN** 訂單 SO-001 狀態 = 製作中、業務需追加印件數量 100 份且需補收價差
- **WHEN** 業務於 Side Panel 改 `pi_ordered_qty` 從 500 → 600（規格層動線）
- **THEN** 系統 SHALL 更新 PrintItem 並推通知（同上 Scenario）
- **AND** 業務 MUST 切到「訂單異動」Tab 建立 OrderAdjustment（adjustment_type = 加印追加）處理金額（金額層動線）
- **AND** Side Panel 內 `price_per_unit` 欄位 SHALL disabled + Tooltip「訂單已進入製作階段，售價變更需走『訂單異動』Tab 建立補收 / 折讓單」

#### Scenario: 製作後印務發起異動但不直接寫 PrintItem

- **GIVEN** 訂單 SO-001 狀態 = 製作中、印務發現紙張缺貨需改規格
- **WHEN** 印務於工單模組點「異動」進入工單異動流程
- **THEN** 印務 SHALL 通知業務（Slack / 電話）需調整 PrintItem.spec_note
- **AND** 業務確認後 SHALL 於訂單 Side Panel 改 `spec_note`（觸發系統通知回印務）
- **AND** 印務的工單異動 MUST NOT 寫入 PrintItem.spec_note（職責邊界）
- **AND** 印務的工單異動 SHALL 僅調整工單 / 生產任務 / 製程 / 材料規格

#### Scenario: 已取消訂單印件唯讀

- **GIVEN** 訂單 SO-001 狀態 = 已取消
- **WHEN** 業務開啟印件詳情頁或 Side Panel
- **THEN** 所有印件欄位 MUST 為唯讀
- **AND** 系統 MUST NOT 顯示「編輯印件」或「申請異動」按鈕

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
| 9 | 售價 | PrintItem.price_per_unit（未稅；訂單未取消即可顯示；製作前可 inline 編輯；製作後 disabled） |
| 10 | 生產數量 | PrintItem.produced_qty |
| 11 | 入庫數量 | PrintItem.warehouse_qty |
| 12 | 出貨數量 | PrintItem.shipped_qty |
| 13 | 交期 | PrintItem.delivery_date |
| 14 | 操作 | 補件 / 編輯印件 / 檢視 按鈕群（依狀態條件顯示） |

縮圖欄 SHALL 為首欄、尺寸 120 × 120 pixel 方形，渲染對齊 DESIGN.md § 0.1「縮圖 / 圖像欄置於資料列首欄」原則。

操作欄 SHALL 依條件顯示三種按鈕：
- **補件**：審稿維度狀態 = 不合格 時顯示（沿用既有 add-prepress-review 補件入口）
- **編輯印件**：訂單狀態 ≠ 已取消 時顯示，點擊開啟 EditOrderPrintItemPanel（v1.13 放寬：不再限製作前；製作後仍顯示但 Panel 內售價欄位 disabled）
- **檢視**：**永遠顯示**，點擊開啟 PrintItemDetailSidePanel（見下方 Requirement）

操作欄 MUST NOT 包含「申請異動」按鈕（移除原 row-level 入口）。製作後印件規格變更的動線統一由「編輯印件」按鈕承擔（v1.7「業務通知印務從工單異動處理」動線廢止；改由業務於 Side Panel 直接編輯 + 系統推通知，見 § 訂單階段印件規格編輯時機）。

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

#### Scenario: 製作後印件操作欄按鈕顯示（v1.13 放寬）

- **GIVEN** 訂單已進入製作階段（status ∈ {製作等待中、工單已交付、製作中、製作完成、出貨中、訂單完成}）
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 顯示「編輯印件」按鈕（v1.13 放寬：開啟 Side Panel 可編輯規格類欄位；Panel 內 `price_per_unit` disabled）+「檢視」按鈕
- **AND** 操作欄 MUST NOT 顯示「申請異動」按鈕

#### Scenario: 已取消訂單印件操作欄

- **GIVEN** 訂單狀態 = 已取消
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 僅顯示「檢視」按鈕
- **AND** 操作欄 MUST NOT 顯示「編輯印件」按鈕

#### Scenario: 不合格印件含補件入口

- **GIVEN** 印件審稿維度狀態 = 不合格
- **WHEN** 業務查看印件清單操作欄
- **THEN** 操作欄 SHALL 顯示「補件」按鈕（沿用 add-prepress-review change 既有補件入口）
- **AND** 同時顯示「檢視」按鈕（以及訂單未取消時的「編輯印件」按鈕）

#### Scenario: 縮圖無圖時顯示佔位

- **GIVEN** 印件無縮圖（thumbnail URL 為空）
- **WHEN** 業務查看印件清單縮圖欄
- **THEN** 縮圖欄 SHALL 顯示 120 × 120 pixel 佔位框（dashed border + Image icon）
- **AND** 佔位框 SHALL NOT 含下載 link icon

---

### Requirement: 訂單階段訂單備註編輯權限與時機

訂單階段的三個備註欄位（`order_note` / `delivery_note` / `payment_note`）編輯權限 SHALL 對齊 user-roles spec 粗粒度模組權限（[user-roles spec § 模組存取權限模型](../user-roles/spec.md)）。各角色的編輯權限 MUST 依下表配置：

| 角色 | 訂單模組粗粒度 | 訂單備註編輯權限 | 備註 |
|------|-------------|---------------|------|
| Supervisor | R/W | **唯讀模式** | 沿用 user-roles spec § Supervisor 角色行為限制（line 112-125），所有編輯按鈕 disabled |
| 訂單管理人 | R/W | 可編輯 | — |
| 業務 | R/W | 可編輯（限 `Order.sales_id = currentUser.id` 自己負責的訂單或被分享編輯權限的訂單） | — |
| 諮詢 | R/W | 可編輯（沿用業務範圍規則） | — |
| 會計 | R/W（細粒度為讀取） | **唯讀** | 沿用 user-roles spec § 會計角色職責「報價單 / 訂單模組（讀取）+ 對帳檢視」 |
| 業務主管 | X | **無權限編輯** | v1.13 移除既有「業務主管代編訂單備註」破例（對齊 user-roles spec 業務主管訂單模組 X 邊界）；如需協助由 Supervisor 重新指定訂單業務主管或業務分享編輯權限 |
| 其他角色（審稿主管 / 審稿 / 印務主管 / 印務 / 生管 / 師傅 / QC / 出貨 / 外包 / 中國廠商 / EC商品管理） | X | 路由禁止進入 | — |

編輯時機 SHALL 遵守以下規則：

- 訂單未取消（`order.status !== '已取消'`）：三個欄位皆可編輯（v1.13 放寬：不再受 `completed_at IS NULL` 限制；訂單完成後仍可編輯）
- 訂單已取消（`order.status === '已取消'`）：三個欄位 SHALL 鎖定為唯讀，避免取消後改備註影響歷史對帳

對應「插入常用備註」按鈕 SHALL 與 textarea 編輯權限同步（textarea 唯讀時按鈕 disabled）。

#### Scenario: 業務於訂單未完成階段編輯訂單備註

- **GIVEN** Order.status = 製作等待中
- **AND** 使用者為訂單 sales_id 對應的業務
- **WHEN** 業務點訂單備註 section 右上「編輯」按鈕並於 dialog 內修改
- **THEN** 系統 SHALL 允許編輯並於儲存後寫入

#### Scenario: 業務於訂單完成後編輯訂單備註（v1.13 放寬）

- **GIVEN** Order.status = 訂單完成、Order.completed_at IS NOT NULL
- **AND** 使用者為業務 / 諮詢 / 訂單管理人
- **WHEN** 該角色於訂單詳情頁查看訂單備註 section
- **THEN** Section header 右上「編輯」按鈕 SHALL 啟用
- **AND** 角色 SHALL 可開啟 OrderNotesEditDialog 並修改三個欄位
- **AND** ActivityLog MUST 記錄變更內容

#### Scenario: 已取消訂單鎖定訂單備註

- **GIVEN** Order.status = 已取消
- **WHEN** 業務於訂單詳情頁查看訂單備註 section
- **THEN** Section header 右上的「編輯」按鈕 SHALL disabled
- **AND** Section header 右側 SHALL 顯示鎖定原因（「訂單已取消，無法編輯」）
- **AND** Section body 仍以 read-only 顯示既有填寫內容

#### Scenario: 業務主管查看訂單備註（v1.13 移除代編破例）

- **GIVEN** Order.status = 製作中
- **AND** 使用者為業務主管
- **WHEN** 業務主管於訂單詳情頁查看訂單備註 section
- **THEN** Section header 右上的「編輯」按鈕 SHALL disabled 或不顯示
- **AND** 業務主管 MUST NOT 透過任何路徑修改三個欄位（對齊 user-roles spec 業務主管訂單模組 X 邊界）
- **AND** 如需協助補備註，業務主管 SHALL 透過 Supervisor 重新指定訂單業務主管或請業務分享編輯權限

#### Scenario: Supervisor 查看訂單備註

- **GIVEN** 使用者為 Supervisor
- **WHEN** Supervisor 進入訂單詳情頁
- **THEN** 訂單備註 section 編輯按鈕 SHALL disabled（沿用 user-roles spec § Supervisor 角色行為限制）
- **AND** Section body 仍以 read-only 顯示

#### Scenario: 會計查看訂單備註

- **GIVEN** 使用者為會計
- **WHEN** 會計進入訂單詳情頁
- **THEN** 訂單備註 section 編輯按鈕 SHALL disabled（沿用 user-roles spec § 會計角色職責「報價單 / 訂單模組（讀取）」）
- **AND** Section body 仍以 read-only 顯示

---

### Requirement: OrderSignedFile 訂單回簽附件

每筆訂單 SHALL 支援多檔回簽檔案上傳，透過子表 `OrderSignedFile` 儲存。檔案用途為客戶印 / 簽名後回傳的報價 / 訂單確認文件。

`OrderSignedFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `order_id`）。

**上傳時機**（v1.13 放寬）：訂單未取消（`order.status !== '已取消'`）皆可上傳。首次上傳於「報價待回簽」狀態時 SHALL 觸發訂單狀態自動推進（詳見 § 訂單確認觸發），並寫入 `Order.signed_at` = 第一份上傳完成時間。後續追加上傳走「append」模式，MUST NOT 覆寫既有檔案，MUST NOT 重複觸發狀態推進，MUST NOT 覆寫 `signed_at`。

#### Scenario: 業務於報價待回簽狀態首次上傳回簽檔案觸發狀態推進

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽、無 OrderSignedFile
- **WHEN** 業務上傳「客戶回簽報價單.pdf」
- **THEN** 系統 SHALL 建立 OrderSignedFile 紀錄
- **AND** 系統 SHALL 推進訂單狀態（依正常 / 免審稿快速路徑）
- **AND** 系統 SHALL 寫入 Order.signed_at = 上傳完成時間

#### Scenario: 已回簽訂單追加上傳檔案

- **GIVEN** 訂單 SO-001 狀態 = 製作中、已有 OrderSignedFile
- **WHEN** 業務再上傳補充回簽文件
- **THEN** 系統 SHALL 建立新 OrderSignedFile 紀錄
- **AND** 訂單狀態 MUST NOT 變更（避免向後推進）
- **AND** Order.signed_at MUST NOT 覆寫

#### Scenario: 製作後 / 訂單完成後追加上傳回簽檔案（v1.13 UI 對齊）

- **GIVEN** 訂單 SO-001 狀態 ∈ {製作中、製作完成、出貨中、訂單完成}
- **AND** 訂單已有 OrderSignedFile
- **WHEN** 業務於 Tab 9 檔案點「上傳回簽檔案」按鈕
- **THEN** 系統 SHALL 顯示上傳按鈕（v1.13 UI 對齊既有 spec：上傳按鈕不再限「報價待回簽」單一狀態）
- **AND** 業務上傳後系統 SHALL 建立新 OrderSignedFile 紀錄
- **AND** 訂單狀態 MUST NOT 變更
- **AND** Order.signed_at MUST NOT 覆寫
- **AND** ActivityLog MUST 記錄上傳

#### Scenario: 已取消訂單禁止上傳回簽檔案

- **GIVEN** 訂單 SO-001 狀態 = 已取消
- **WHEN** 業務查看 Tab 9 檔案
- **THEN** 「上傳回簽檔案」按鈕 SHALL disabled
- **AND** Tooltip 提示「訂單已取消，無法上傳」

---

### Requirement: 訂單其他費用明細（OrderExtraCharge）

訂單 SHALL 支援「其他費用」明細項目，作為訂單應收金額構成的一部分（與印件費並列）。OrderExtraCharge 實體用於記錄訂單建立時即確定、非屬印件規格的費用項目。

**OrderExtraCharge 欄位**：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單 |
| `charge_type` | enum | Y | `consultation_fee` / `shipping_fee` / `rush_fee` / `other` |
| `amount` | decimal | Y | 金額（一般為正數） |
| `description` | string | N | 描述（如「諮詢費（諮詢單編號 CR-XXX）」） |
| `created_at` | timestamp | Y | 建立時間 |
| `created_by` | FK -> 使用者 | N | 建立者（系統自動建立時可為 null） |

**與 OrderAdjustment 的語意分離**：

| 概念 | OrderExtraCharge | OrderAdjustment |
|------|-----------------|-----------------|
| 何時建立 | 訂單成立時即確定 | 訂單成立後因規格變更 / 加印 / 退印 / 折扣等異動 |
| 是否需要審核 | 否（屬訂單明細的一部分） | 是（草稿 → 待主管審核 → 已核可 → 已執行） |
| 業務語意 | 應收明細項目 | 應收金額異動 |

**諮詢費的特殊路徑**：當訂單 `order_type = 諮詢` 或主訂單來自 ConsultationRequest 時（`linked_consultation_request_id` 非空），系統 SHALL 自動建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，業務無需手動建立。

**編輯時機**（v1.13 明文化）：
- 製作前（訂單狀態 ∈ 製作前狀態）：業務 SHALL 可於訂單詳情頁「新增其他費用」/「編輯」/「刪除」OrderExtraCharge
- 製作後（訂單狀態 ∈ 製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成）：「新增其他費用」與既有 OrderExtraCharge 編輯按鈕 SHALL disabled；UI MUST NOT 再顯示「點下後 toast 提示走訂單異動」引導；金額異動 SHALL 走「訂單異動」Tab 建立 OrderAdjustment
- 已取消：所有操作 disabled

#### Scenario: 諮詢來源主訂單自動建 consultation_fee OrderExtraCharge

- **GIVEN** 需求單 `linked_consultation_request_id = CR-202605-0001`、諮詢費 = 1000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 在主訂單上建立 OrderExtraCharge：
  - `charge_type = consultation_fee`
  - `amount = 1000`
  - `description = 「諮詢費（諮詢單編號 CR-202605-0001）」`
  - `created_by = null`（系統自動建立）

#### Scenario: 諮詢訂單自動建 consultation_fee OrderExtraCharge

- **WHEN** 系統在「諮詢結束不做大貨 / 需求單流失 / 諮詢取消」三種收尾情境之一建立諮詢訂單
- **THEN** 系統 SHALL 同步建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，使諮詢訂單應收 = 諮詢費

#### Scenario: 業務製作前手動加運費

- **WHEN** 業務於主訂單詳情頁（製作前）點擊「新增其他費用」、選擇 `charge_type = shipping_fee`、填入 amount = 200、description = 「黑貓宅配」
- **THEN** 系統 SHALL 建立 OrderExtraCharge 記錄
- **AND** 主訂單應收總額 SHALL 增加 200

#### Scenario: 製作後 OrderExtraCharge 編輯按鈕 disabled（v1.13 移除 toast）

- **GIVEN** 訂單 SO-001 狀態 = 製作等待中
- **WHEN** 業務於訂單詳情頁查看其他費用區
- **THEN** 「新增其他費用」按鈕 SHALL disabled
- **AND** 既有 OrderExtraCharge 編輯按鈕 SHALL disabled
- **AND** Tooltip 提示「訂單已進入製作階段，金額異動需走『訂單異動』Tab 建立補收 / 折讓單」+ 點此跳轉 link
- **AND** UI MUST NOT 出現「點下後 toast」引導模式

## ADDED Requirements

### Requirement: 訂單詳情頁編輯型 Section 統一編輯時機與角色

訂單詳情頁「資訊」Tab 內 4 個編輯型 Section（**訂單資訊** / **訂單備註** / **出貨資訊** / **發票設定**）SHALL 採統一編輯時機與角色規則：

**統一編輯時機**：`order.status !== '已取消'` 即可編輯（v1.13 放寬：取代既有 `isBeforeProduction(status)` 與 `completed_at IS NULL` 雙閘門控）。

**統一編輯方式**：點 Section header 右上「編輯」按鈕 → 開啟對應 Dialog（OrderInfoEditDialog / OrderNotesEditDialog / ShippingInfoEditDialog / InvoiceSettingEditDialog）→ Dialog 內編輯後儲存 → updateOrder + ActivityLog。

**廢止 UX**：v1.7 既有「製作後點下編輯按鈕 toast 提示『需走訂單異動流程』」MUST 移除。製作後直接 Dialog 編輯，無 toast 引導。

**統一角色規則**（對齊 user-roles spec 粗粒度模組權限）：

| 角色 | 訂單模組粗粒度 | 4 個 Section 編輯權限 | 備註 |
|------|-------------|---------------------|------|
| Supervisor | R/W | **唯讀**（編輯按鈕 disabled） | 沿用 user-roles spec § Supervisor 角色行為限制 |
| 訂單管理人 | R/W | 可編輯 | — |
| 業務 | R/W | 可編輯（限負責訂單或被分享編輯權限的訂單） | — |
| 諮詢 | R/W | 可編輯（沿用業務範圍規則） | — |
| 會計 | R/W（細粒度為讀取） | **唯讀** | 沿用 user-roles spec § 會計角色職責 |
| 業務主管 / 其他模組 X 角色 | X | 路由禁止進入 OrderDetail | — |

**helper functions**（prototype 實作層）：

- `canEditOrderSection(order, currentUser)`：統一判定訂單 Section 編輯權限；4 個 Section 編輯按鈕 disabled 條件統一接此 helper

#### Scenario: 業務於訂單未取消階段編輯 4 個 Section

- **GIVEN** Order.status ∈ {報價待回簽、製作中、訂單完成} 任一非已取消狀態
- **AND** 使用者為訂單負責業務
- **WHEN** 業務點訂單資訊 / 訂單備註 / 出貨資訊 / 發票設定 任一 Section header 編輯按鈕
- **THEN** 系統 SHALL 開啟對應 Dialog（OrderInfoEditDialog / OrderNotesEditDialog / ShippingInfoEditDialog / InvoiceSettingEditDialog）
- **AND** Dialog 內可編輯所有欄位
- **AND** 儲存後 SHALL 寫入 store + ActivityLog + Toast
- **AND** UI MUST NOT 出現「需走訂單異動流程」toast

#### Scenario: 已取消訂單 4 個 Section 編輯按鈕 disabled

- **GIVEN** Order.status = 已取消
- **WHEN** 任何使用者進入訂單詳情頁查看 4 個 Section
- **THEN** 編輯按鈕 SHALL disabled
- **AND** Tooltip 提示「訂單已取消，無法編輯」

#### Scenario: Supervisor 進入訂單詳情頁

- **GIVEN** 使用者為 Supervisor
- **WHEN** Supervisor 進入訂單詳情頁
- **THEN** 4 個 Section 編輯按鈕 SHALL disabled
- **AND** Section body 仍以 read-only 顯示既有內容
- **AND** Supervisor 的操作紀錄 MUST 僅包含查看行為（沿用 user-roles spec § Supervisor 唯讀規則）

#### Scenario: 會計進入訂單詳情頁

- **GIVEN** 使用者為會計
- **WHEN** 會計進入訂單詳情頁
- **THEN** 4 個 Section 編輯按鈕 SHALL disabled
- **AND** 會計 SHALL 可查看金額及付款狀態 / 發票 / 對帳檢視 Tab（沿用既有會計權限）

#### Scenario: 發票設定 Section 條件顯示

- **GIVEN** Order.invoiceEnabled === true
- **WHEN** 業務進入訂單詳情頁資訊 Tab
- **THEN** 發票設定 Section SHALL 顯示
- **AND** 編輯按鈕條件對齊統一規則（`order.status !== '已取消'` + 角色判定）

- **GIVEN** Order.invoiceEnabled === false
- **THEN** 發票設定 Section SHALL NOT 顯示

---

### Requirement: 訂單其他附件上傳

訂單 SHALL 支援「其他附件」上傳功能，透過子表 `OrderAttachment` 儲存，與既有 `OrderSignedFile`（回簽檔案）並存於訂單詳情頁 Tab 9「檔案」。

`OrderAttachment` 用途為承載非回簽用途的訂單相關文件（如合約掃描 / 規格說明書 / 客戶聲明 / 其他補充文件），業務上傳時 SHALL 填寫「用途」free-text 欄位（200 字上限），用於日後查找辨識。

**附件分類策略**（議題 2 拍板方案 A）：採「統一一個附件清單 + 上傳時填用途 free-text」，不分桶（不採合約 / 規格說明 / 聲明 / 其他四桶分類）。理由：prototype 階段優先驗證上傳功能本身被使用的頻率，分類功能待真實使用累積樣本後再升級為 LOV（見 [[ORD-019]] OQ）。

**邊界規則**（議題反向挑戰 3 拍板「不訂明、來源並存」）：訂單完成後客訴相關附件 SHALL 由業務自由判斷上傳位置（訂單其他附件區 / 售後 ticket 附件區皆可）；spec 不約束邊界規則。

#### Scenario: 業務於訂單未取消階段上傳其他附件

- **GIVEN** Order.status ∈ {報價待回簽、製作中、訂單完成} 任一非已取消狀態
- **AND** 使用者為業務 / 諮詢 / 訂單管理人
- **WHEN** 該角色於訂單詳情頁 Tab 9 點「上傳其他附件」按鈕
- **THEN** 系統 SHALL 開啟 OrderAttachmentUploadDialog
- **AND** Dialog 內 SHALL 包含檔案選擇器 + 「用途」textarea（200 字上限、必填）
- **AND** 業務填寫用途並選擇檔案後點儲存
- **AND** 系統 SHALL 建立 OrderAttachment 紀錄（含 file_url / file_name / purpose_note / uploaded_by / uploaded_at）
- **AND** Toast 顯示「附件已上傳」+ ActivityLog 記錄

#### Scenario: 其他附件清單顯示

- **GIVEN** 訂單有多筆 OrderAttachment
- **WHEN** 業務開啟訂單詳情頁 Tab 9
- **THEN** 系統 SHALL 顯示「其他附件」區（與回簽檔案區分開）
- **AND** 附件清單 SHALL 依 uploaded_at 倒序排列
- **AND** 每筆 SHALL 顯示 file_name + purpose_note + uploaded_by + uploaded_at + 下載 link
- **AND** 統一一個清單，MUST NOT 依用途分桶

#### Scenario: 已取消訂單禁止上傳其他附件

- **GIVEN** Order.status = 已取消
- **WHEN** 業務查看訂單詳情頁 Tab 9
- **THEN** 「上傳其他附件」按鈕 SHALL disabled
- **AND** Tooltip 提示「訂單已取消，無法上傳」
- **AND** 既有 OrderAttachment 清單 SHALL 仍可下載檢視

#### Scenario: 售後 ticket 附件並存

- **GIVEN** 訂單已完成、有關聯 AfterSalesTicket
- **WHEN** 業務需上傳客戶客訴照片
- **THEN** 業務 SHALL 可選擇上傳到「訂單其他附件區」或「售後 ticket 附件區」
- **AND** 系統 MUST NOT 約束上傳位置（不訂邊界、來源並存）

---

### Requirement: 製作後印件規格異動系統自動通知

訂單狀態 ∈ 製作後狀態（製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成）時，業務於 Side Panel 編輯印件規格類欄位（`spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level`）並儲存後，系統 SHALL 自動推送通知 + 寫入 ActivityLog，承擔印務感知責任。

**通知對象**（標準路徑）：
- 工單負責印務（PrintItem 關聯 WorkOrder.printing_owner_id 對應使用者）
- 印務主管
- 訂單管理人（Order.order_manager_id 對應使用者）

**Fallback 規則**（訂單管理人為空時）：通知對象退化為「業務（Order.sales_id 對應使用者）+ 工單負責印務 + 印務主管」。理由：業務是訂單建立者，對訂單異動有第一手感知責任。

**通知形式**：in-app 通知（既有通知元件複用），通知內容含：
- 操作者姓名
- 印件編號 + 名稱
- 變更欄位 diff 摘要（before → after）
- 跳轉印件詳情 link

**ActivityLog**：
- `action_type = print_item_spec_modified_in_production`
- `payload` 含：`before`（變更前欄位值快照）、`after`（變更後欄位值快照）、`notified_recipients`（實際通知對象 user_id 陣列，含 fallback 觸發紀錄）、`triggered_by`（操作者 user_id）

**何時不觸發通知**：
- 訂單狀態 ∈ 製作前狀態：直接更新 PrintItem，不推通知（無印務介入需要）
- 訂單狀態 = 已取消：所有編輯禁止（按鈕 disabled），不會觸發通知
- 編輯非規格類欄位（如 `price_per_unit` 不在規格類；製作後本就 disabled 不會觸發）：不推通知

#### Scenario: 製作中業務改 spec_note 觸發三組通知

- **GIVEN** 訂單 SO-001 狀態 = 製作中
- **AND** Order.order_manager_id 已指派
- **AND** PrintItem PI-001 關聯工單 WO-001（printing_owner_id = 印務 A）
- **WHEN** 業務於 Side Panel 改 PrintItem PI-001 `spec_note` 從「500g 銅版紙」→「350g 雪銅」並儲存
- **THEN** 系統 SHALL 更新 PrintItem.spec_note
- **AND** 系統 SHALL 推送 in-app 通知給：印務 A + 印務主管 + 訂單管理人
- **AND** ActivityLog 寫入 `action_type = print_item_spec_modified_in_production`，payload 含 before / after / notified_recipients
- **AND** Toast 顯示「已更新印件規格，已通知印務 A / 印務主管 / 訂單管理人」

#### Scenario: 製作後訂單管理人為空觸發 fallback 通知

- **GIVEN** 訂單 SO-002 狀態 = 製作中
- **AND** Order.order_manager_id IS NULL
- **AND** Order.sales_id = 業務 B
- **AND** PrintItem PI-002 關聯工單 WO-002（printing_owner_id = 印務 C）
- **WHEN** 業務 B 於 Side Panel 改 PrintItem PI-002 `pi_ordered_qty` 從 500 → 600 並儲存
- **THEN** 系統 SHALL 更新 PrintItem.pi_ordered_qty
- **AND** 系統 SHALL 推送 in-app 通知給：業務 B（fallback）+ 印務 C + 印務主管
- **AND** ActivityLog payload.notified_recipients SHALL 含 fallback 觸發紀錄（標記 `order_manager_fallback_to_sales = true`）
- **AND** Toast 顯示「已更新印件規格，已通知業務 / 印務 C / 印務主管（訂單管理人未指派）」

#### Scenario: 工單負責印務未指派時通知對象退化

- **GIVEN** 訂單 SO-003 狀態 = 製作等待中
- **AND** PrintItem PI-003 關聯工單 WO-003（printing_owner_id IS NULL）
- **WHEN** 業務於 Side Panel 改 PrintItem PI-003 規格類欄位
- **THEN** 系統 SHALL 更新 PrintItem
- **AND** 系統 SHALL 推送 in-app 通知給：印務主管 + 訂單管理人（fallback 略過工單負責印務）
- **AND** ActivityLog payload.notified_recipients SHALL 含 fallback 紀錄

#### Scenario: 印務點通知跳轉至印件詳情頁

- **GIVEN** 印務 A 收到「業務改了印件 PI-001 規格」通知
- **WHEN** 印務 A 點通知 link
- **THEN** 系統 SHALL 跳轉至印件詳情頁 `/print-items/PI-001`
- **AND** 印件詳情頁 SHALL 顯示最新 spec_note + ActivityLog 歷史
- **AND** 印務 SHALL 可在工單模組依需求調整生產任務 / 製程 / 材料規格

#### Scenario: 製作前業務改規格不觸發通知

- **GIVEN** 訂單 SO-004 狀態 = 報價待回簽
- **WHEN** 業務於 Side Panel 改 PrintItem 規格類欄位
- **THEN** 系統 SHALL 更新 PrintItem
- **AND** 系統 MUST NOT 推送通知
- **AND** ActivityLog `action_type = print_item_spec_modified`（製作前事件型別，與製作後事件型別 `print_item_spec_modified_in_production` 區分）

## ADDED Data Model

### OrderAttachment（訂單其他附件實體）

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單 |
| `file_url` | string | Y | 檔案 URL（既有 mock file upload 機制） |
| `file_name` | string | Y | 檔案名稱（原始上傳檔名） |
| `purpose_note` | text(200) | Y | 用途說明（free-text，業務上傳時填寫，例：「合約掃描」「規格說明書」「客戶聲明」） |
| `uploaded_by` | FK -> 使用者 | Y | 上傳者 |
| `uploaded_at` | timestamp | Y | 上傳時間 |

**與 OrderSignedFile 的語意分離**：

| 概念 | OrderSignedFile | OrderAttachment |
|------|----------------|-----------------|
| 用途 | 客戶印 / 簽名後回傳的報價 / 訂單確認文件（既有設計） | 其他訂單相關文件（合約 / 規格說明 / 客戶聲明 / 補充說明 / 等）|
| 用途欄位 | 無（固定為「回簽」用途） | `purpose_note` free-text |
| 上傳觸發狀態推進 | 首次上傳於「報價待回簽」狀態時 SHALL 推進至「已回簽」 | MUST NOT 觸發任何狀態推進 |
| 分桶 | 不分桶（單一用途） | 不分桶（v1.13 議題 2 拍板；新 OQ ORD-019 上線前驗證是否轉 LOV） |

**未來升級路徑**：累積 ≥ 20 筆 OrderAttachment.purpose_note 樣本後，若樣本可歸納為 5-7 個 LOV 選項，則上線前轉 `purpose_type` enum 欄位（保留 purpose_note 作補充說明）；見 [[ORD-019]] OQ。
