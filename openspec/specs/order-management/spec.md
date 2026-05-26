## Purpose

訂單管理模組 -- 統一線上/線下訂單管理，支援多印件多工單結構，涵蓋訂單建立、印件管理、付款記錄、電子發票、出貨單管理全流程。
取代現有 EC + Ragic 雙平台組合。

**問題**：
- EC + Ragic 雙平台管理訂單，線上/線下資料結構不同無法互通
- EC 一訂單僅對應一張工單，無法支援「一訂單→多印件→各自多工單」
- 分批出貨無系統化統計與防呆，審稿兼任工單開立導致職責錯位

**目標**：
- 主要：建立統一訂單管理平台，支援線上/線下訂單，完成 EC + Ragic 系統轉換，支援多印件多工單結構
- 次要：建立 Dashboard / Forecast 的資料基礎

- 來源 BRD：[訂單 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567)（v0.5）
- Prototype：`sens-erp-prototype/src/components/order/`
- 相依模組：需求單（線下單轉入）、EC 平台（線上單）、工單管理、統一金流、第三方物流

---
## Requirements
### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）。**諮詢費 PlannedInvoice 由業務於主訂單既有發票時程規劃流程自行加入，系統 MUST NOT 自動建立諮詢費 PlannedInvoice 於主訂單**。`consultation_invoice_option` 作為客戶意向參考保留於 ConsultationRequest 實體，業務可參考決定主訂單發票時程，但不驅動系統行為。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

3. **不做大貨**：客戶最終沒做大貨製作，涵蓋兩個觸發點：
   - 3.1 諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」時建立
   - 3.2 諮詢結束做大貨後，需求單流失：系統將此事件歸類為「不做大貨」結局，自動建諮詢訂單收尾
4. **待諮詢取消（半額退費）**：諮詢人員 / 業務主管於待諮詢階段點「取消諮詢」並於 dialog 確認後建立，含退款 Payment 與 OrderAdjustment

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不建任何訂單**；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共同的建立動作：(a) 訂單金額 = 諮詢費全額（2000），(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) **自動建立 PlannedInvoice 1 筆作為待開發票提醒**（金額依情境決定：不做大貨 / 需求單流失 = 2000；諮詢取消 = 1000），(e) 取消情境額外建立 OrderAdjustment(-1000) + 退款 Payment(-1000)，(f) **MUST NOT 自動開立 Invoice 或 SalesAllowance**（廢止 `consultation_invoice_option` 對發票自動化的影響）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 2000、印件費 = 4000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 2000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 系統 MUST NOT 自動建立諮詢費的 PlannedInvoice（業務於主訂單既有發票時程規劃流程自行加入）
- **AND** 系統 MUST NOT 依 `consultation_invoice_option` 自動開立 Invoice（欄位降為客戶意向參考）
- **AND** 主訂單三方對帳：應收 = 6000 = 已收 2000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 3.1）

- **WHEN** ConsultationRequest 諮詢結束，諮詢人員選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 3.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失（流失事件由需求單模組觸發）
- **WHEN** 系統處理需求單流失事件，且需求單 `linked_consultation_request_id` 非空
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 流失時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice

#### Scenario: 非諮詢來源的需求單流失不建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（非諮詢來源）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 需求單流失走需求單自身的退款 / 流失流程，與諮詢訂單無關

#### Scenario: 待諮詢取消觸發建諮詢訂單與半額退費

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 從 ConsultationRequest 轉移至諮詢訂單（金額 +2000 不變、status 維持已完成）
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、approved_at = 取消時點、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 諮詢訂單應收 = OEC(2000) + OA(-1000) = 1000

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

---

### Requirement: 訂單確認觸發

系統 SHALL 支援訂單確認觸發，線下單採「OR 觸發」設計，任一觸發條件成立即推進：

- **線下單觸發條件 A（手動）**：業務於訂單詳情頁點擊「確認回簽」按鈕
- **線下單觸發條件 B（自動）**：業務於訂單詳情頁「回簽檔案上傳區」成功上傳至少一份回簽檔案（建立 OrderSignedFile 紀錄）
- **線上單（含客製單）**：付款完成自動觸發（Phase 2，由 EC 同步）

任一觸發成立時，系統 SHALL 寫入 `Order.signed_at` = 觸發時間並推進狀態。

Prototype 補強：原實作為每個訂單狀態配一個手動推進按鈕，與[狀態機 spec](../state-machines/spec.md) 不符。修正為 OrderDetail SHALL 僅提供「確認回簽」與「取消訂單」兩個人工操作按鈕；審稿段之後的狀態推進（稿件未上傳 → 等待審稿 → 製作等待中 → ... → 訂單完成）SHALL 由下層模組 bubble-up 驅動。

#### Scenario: 線下單業務手動確認

- **WHEN** 客戶印回簽後，業務在訂單頁面標記「已回簽」
- **THEN** 訂單狀態從草稿轉為已確認
- **AND** 系統 SHALL 寫入 `Order.signed_at` = 操作時間

#### Scenario: 線下單上傳回簽檔案自動推進

- **GIVEN** 訂單狀態 = 報價待回簽
- **WHEN** 業務於訂單詳情頁「回簽檔案上傳區」上傳檔案，系統 SHALL 建立 OrderSignedFile 紀錄
- **THEN** 系統 SHALL 自動推進訂單狀態（依「正常路徑」或「免審稿快速路徑」決定下個狀態）
- **AND** 系統 SHALL 寫入 `Order.signed_at` = 上傳完成時間
- **AND** ActivityLog MUST 記錄「上傳回簽檔案自動推進」與操作人

#### Scenario: US-ORD-001 回簽後訂單確認推進

- **WHEN** 客戶印回簽後，業務在訂單頁面手動點擊「標記回簽」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「訂單確認」；活動紀錄 MUST 記錄操作人、操作類型與時間戳

#### Scenario: 線下訂單確認回簽（正常路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」或上傳回簽檔案
- **AND** 訂單下有印件的 reviewStatus 不為「合格」且不為「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「稿件未上傳」

#### Scenario: 線下訂單確認回簽（免審稿快速路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」或上傳回簽檔案
- **AND** 訂單下所有印件的 reviewStatus 皆為「合格」或「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」直接推進至「製作等待中」，跳過「稿件未上傳」與「等待審稿」

#### Scenario: 審稿段之後無手動推進按鈕

- **WHEN** 訂單狀態為「稿件未上傳」或之後的任何狀態
- **THEN** OrderDetail 頁面 MUST NOT 顯示狀態推進按鈕
- **AND** 狀態推進 SHALL 等待下層模組（印件審稿、工單、出貨）的 bubble-up 觸發

### Requirement: 多印件管理
系統 SHALL 支援 1 訂單 -> N 印件結構，區分打樣印件與大貨印件。業務/諮詢業務在建立印件時可設定「免審稿」，免審稿設定後審稿狀態直接為「合格」（主要場景：線下追加大貨）。

#### Scenario: 訂單包含多筆印件
- **WHEN** 訂單包含打樣印件與大貨印件
- **THEN** 系統分別管理各印件的審稿狀態、工單狀態、生產進度

#### Scenario: 業務設定免審稿印件
- **WHEN** 業務建立線下追加大貨印件並勾選「免審稿」
- **THEN** 系統將該印件審稿狀態直接設為「合格」，跳過審稿流程

### Requirement: 稿件上傳
系統 SHALL 提供統一的稿件上傳入口，打樣與大貨印件的稿件上傳在訂單管理頁的印件區塊操作。

#### Scenario: 業務上傳印件稿件
- **WHEN** 業務在訂單詳情頁的印件區塊上傳稿件
- **THEN** 系統儲存稿件並觸發對應的審稿流程（除非已設定免審稿）

### Requirement: 打樣決策點
系統 SHALL 支援打樣結果確認流程，業務取得打樣成品後與客戶確認，依據確認結果推進後續流程。

#### Scenario: US-PI-001 打樣結果確認 -- OK 進入大貨
- **WHEN** 業務取得打樣成品，與客戶確認結果為 OK
- **THEN** 系統 SHALL 將打樣印件標記為「打樣通過」，並允許業務觸發大貨生產流程

#### Scenario: US-PI-001 打樣結果確認 -- NG 製程問題重新打樣
- **WHEN** 業務取得打樣成品，與客戶確認結果為 NG（製程問題）
- **THEN** 系統 SHALL 允許業務發起「重新打樣」，建立新一輪打樣工單並推進對應流程

#### Scenario: US-PI-001 打樣結果確認 -- NG 稿件問題作廢重建
- **WHEN** 業務取得打樣成品，與客戶確認結果為 NG（稿件問題）
- **THEN** 系統 SHALL 將該打樣印件作廢，並允許業務重新建立印件與稿件上傳流程

### Requirement: 訂單狀態機
系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 訂單定義的規則進行狀態轉換，支援線下/線上 EC 訂單的完整狀態流程。

#### Scenario: 訂單完整生命週期
- **WHEN** 訂單從建立到完成經歷所有狀態
- **THEN** 狀態依序轉換：草稿 -> 已確認 -> 生產中 -> 出貨中 -> 已完成

### Requirement: 工單清單顯示
系統 SHALL 在訂單詳情頁顯示各印件對應的工單狀態，提供生產進度可見性。工單詳情連結至工單模組。

#### Scenario: 業務查看訂單生產進度
- **WHEN** 業務在訂單詳情頁查看工單區塊
- **THEN** 系統顯示各印件對應的工單清單與狀態，可點擊連結至工單詳情

### Requirement: 訂單取消流程
系統 SHALL 支援任何狀態均可取消訂單。取消後進入「已取消」終態（不可逆）。連動：所屬工單全數轉「取消」終態，所屬生產任務轉「報廢」。已完成報工數量 MUST 計算成本（不退回）。

#### Scenario: 業務取消進行中的訂單
- **WHEN** 業務在任何狀態下取消訂單
- **THEN** 訂單進入「已取消」終態；所屬工單自動轉「已取消」；生產任務轉「報廢」；已報工數量計入成本

#### Scenario: 取消後退款流程
- **WHEN** 已取消訂單需要退款
- **THEN** 系統啟動退款流程：退款申請 -> 退款處理中 -> 已退款（以 EC 狀態機為設計基準）

#### Scenario: US-ORD-002 訂單取消與 top-down 連鎖
- **WHEN** 業務點擊「取消訂單」
- **THEN** 訂單 SHALL 進入「已取消」終態（不可逆）；系統 MUST 自動執行 top-down 連鎖：工單全數轉「已取消」→ 任務全數轉「已作廢」→ 生產任務依當前狀態轉「已作廢」或「報廢」；退款流程 SHALL 依序推進：退款申請 → 退款處理中 → 已退款

### Requirement: 出貨單管理

系統 SHALL 支援分批出貨、訂單內多印件合併出貨，並實施木桶原則出貨防呆：出貨數 <= 印件層累計 QC 入庫數。出貨單 MUST 一對一綁定單一訂單；跨訂單同收件人的合併寄出由揀貨人員於出貨作業階段自行處理，系統不提供跨訂單合併出貨單的資料模型支援。

#### Scenario: 分批出貨

- **WHEN** 印件部分完成，業務建立第一批出貨單
- **THEN** 系統允許出貨數量不超過該印件已入庫數量，記錄累計已出貨量

#### Scenario: 出貨防呆攔截

- **WHEN** 出貨人員填入的出貨數量超過印件可出貨數量
- **THEN** 系統阻擋並提示「出貨數量不可超過可出貨數量（QC 入庫數 - 已出貨數）」

#### Scenario: 出貨單一對一綁訂單

- **WHEN** 業務或揀貨人員嘗試於同一出貨單加入跨訂單的印件
- **THEN** 系統 SHALL 阻擋並提示「出貨單僅可包含同一訂單的印件；跨訂單合併寄出請於揀貨作業時自行整批處理」

#### Scenario: US-SH-001 自行出貨完整流程

- **WHEN** 業務建立出貨單並選擇「自行出貨」方式，新增出貨明細
- **THEN** 出貨單 SHALL 依序推進狀態：備料打包完成 → 車輛出發出貨中 → 確認送達（已送達）；系統 MUST 支援同訂單合併出貨（多印件同一出貨單）及分批出貨（同印件多次出貨）

#### Scenario: US-SH-002 第三方物流出貨完整流程

- **WHEN** 業務建立出貨單並選擇「第三方物流」方式，完成備料打包後移交物流商
- **THEN** 系統 SHALL 透過 API 自動接收物流商狀態更新：運送中 → 已送達；物流異常時系統 MUST 通知業務介入處理

### Requirement: 訂單列表與分享權限
系統 SHALL 依角色限制訂單可見範圍：業務預設看自己的訂單；訂單管理人看全公司訂單。分享機制同需求單（授予他人檢視/編輯權限）。

#### Scenario: 業務查看自己的訂單
- **WHEN** 業務登入查看訂單列表
- **THEN** 系統僅顯示該業務為負責人或被授權的訂單

#### Scenario: 訂單管理人查看全公司訂單
- **WHEN** 訂單管理人登入查看訂單列表
- **THEN** 系統顯示全公司所有訂單

#### Scenario: US-ORD-005 訂單管理人全公司訂單檢視與篩選
- **WHEN** 訂單管理人登入系統後進入訂單列表
- **THEN** 系統 SHALL 預設顯示全公司所有訂單；系統 MUST 提供依業務負責人、訂單狀態、交期等條件篩選功能；業務角色登入時 SHALL 預設僅顯示自己負責的訂單

#### Scenario: US-ORD-004 訂單分享與代理授權
- **WHEN** 業務在訂單詳情頁進入「權限管理」Tab，搜尋同事並授予「檢視」或「編輯」權限
- **THEN** 被授權同事 SHALL 可依授予的權限等級存取該訂單；分享機制 MUST 與需求單權限管理機制一致

### Requirement: 活動紀錄
系統 SHALL 記錄訂單的所有操作歷程，供稽核與追溯。

#### Scenario: 查閱訂單活動紀錄
- **WHEN** 使用者在訂單詳情頁查看活動紀錄
- **THEN** 系統顯示完整的操作歷程，包含操作人、操作時間、操作內容

### Requirement: 印件預計產線

系統 SHALL 支援在印件層填寫「預計產線」，為多選欄位，記錄該印件預計涉及的產線。

#### Scenario: 印務為印件設定預計產線

- **WHEN** 印務在印件詳情頁填寫預計產線
- **THEN** 系統 SHALL 顯示所有產線供多選
- **AND** 選取結果 SHALL 儲存至 PrintItemExpectedLine junction

#### Scenario: 訂單印件清單顯示預計產線

- **WHEN** 使用者在訂單詳情頁查看印件清單
- **THEN** 每筆印件 SHALL 顯示其預計產線（以標籤形式呈現，多個並列）

#### Scenario: 印件總覽顯示預計產線

- **WHEN** 使用者在印件總覽查看印件列表
- **THEN** 系統 SHALL 顯示每筆印件的預計產線（以標籤形式呈現，多個並列）

### Requirement: 印件成品縮圖上傳

系統 SHALL 支援審稿人員為印件上傳成品縮圖。成品縮圖獨立於稿件檔案，代表最終成品的視覺呈現。

#### Scenario: 審稿人員上傳成品縮圖

- **WHEN** 審稿人員在印件詳情頁上傳成品縮圖
- **THEN** 系統 SHALL 儲存縮圖並更新 PrintItem.thumbnail_url
- **AND** 印件詳情頁與相關生產任務詳情頁 SHALL 顯示此縮圖

#### Scenario: 印件詳情顯示稿件與縮圖

- **WHEN** 使用者開啟印件詳情頁
- **THEN** 系統 SHALL 顯示稿件檔案列表（區分最終版與歷史版本）
- **AND** 系統 SHALL 在醒目位置顯示成品縮圖（若已上傳）

---

### Requirement: 成交轉訂單

系統 SHALL 支援從需求單一鍵轉訂單，自動帶入印件規格、客戶資料、交期。

#### Scenario: 需求單成交後建立訂單

- **WHEN** 業務在成交狀態的需求單點擊「建立訂單」
- **THEN** 系統 SHALL 建立新訂單，自動從 quote.printItems 映射為 OrderPrintItem[]
- **AND** 設定 quote.linkedOrderId = 新訂單 ID、quote.status = '成交'
- **AND** 新訂單狀態 SHALL 為「報價待回簽」
- **AND** 操作完成後導航至新訂單頁面

### Requirement: 訂單印件難易度繼承

訂單中每一筆印件 SHALL 具備 `difficulty_level` 欄位，值域 1-10。其值依訂單來源自動帶入：

- **B2B 訂單**（自需求單成交建立）：自對應需求單印件的 `difficulty_level` 繼承
- **B2C 訂單**（自 EC 商品下單建立）：自 EC 商品主檔的 `difficulty_level` 繼承
- **EC 商品主檔**：`difficulty_level` 由 EC 商品管理角色於商品建立時填寫，值域 1-10，必填

訂單印件 `difficulty_level` 本身於本 change 範疇內 SHALL **不**允許業務或其他角色於訂單層覆寫，以確保自動分配依據穩定。

#### Scenario: B2B 訂單印件繼承需求單難易度

- **GIVEN** 需求單印件 `difficulty_level = 7`
- **WHEN** 需求單成交轉為訂單
- **THEN** 訂單印件 SHALL 自動繼承 `difficulty_level = 7`

#### Scenario: B2C 訂單印件繼承商品主檔難易度

- **GIVEN** EC 商品主檔 `difficulty_level = 5`
- **WHEN** 會員下單成功並建立 B2C 訂單
- **THEN** 訂單印件 SHALL 自動繼承 `difficulty_level = 5`

#### Scenario: EC 商品主檔難易度必填

- **WHEN** EC 商品管理角色建立新商品
- **THEN** 系統 SHALL 要求輸入 `difficulty_level`（1-10）
- **AND** 未填寫時不可儲存為上架狀態

---

### Requirement: 訂單詳情頁印件補件入口

當訂單中的印件審稿維度狀態為「不合格」且訂單來源為 B2B 時，訂單詳情頁 SHALL 於該筆印件列表旁提供「補件」入口。業務 SHALL 可點選該入口上傳新的印件檔案，作為客戶端補件的代理操作。

業務 SHALL 僅能檢視到訂單層級，不可直接操作工單或生產任務。補件操作不可跨訂單範圍。

**本 change 新增**：補件入口 SHALL 顯示**歷史輪次 `review_note` 清單**，讓業務於補件前可參照審稿意見並轉達客戶。歷史清單內容與呈現方式對齊 [prepress-review spec § B2B 業務補件](../prepress-review/spec.md)。

#### Scenario: 不合格印件顯示補件入口

- **GIVEN** B2B 訂單中的印件 X 審稿維度狀態為「不合格」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 於印件 X 列顯示「補件」按鈕或入口

#### Scenario: 業務點選補件上傳檔案

- **WHEN** 業務點選印件 X 的「補件」入口
- **THEN** 系統 SHALL 彈出上傳元件
- **AND** 業務上傳檔案後，系統 SHALL 建立新的補件檔案紀錄
- **AND** 印件 X 審稿維度狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

#### Scenario: 非不合格狀態不顯示補件入口

- **WHEN** 印件審稿維度狀態不為「不合格」
- **THEN** 系統 SHALL **不**於訂單詳情頁顯示該印件的「補件」入口

#### Scenario: 補件入口顯示歷史審稿備註清單

- **WHEN** 業務點選印件 X 的「補件」入口
- **THEN** 系統 SHALL 於上傳元件同頁顯示**歷史輪次 `review_note` 清單**（最新在上）
- **AND** 清單 SHALL 含每輪 round_no、result、reject_reason_category、review_note 與時間
- **AND** 業務可參照清單修正或轉達客戶後再上傳補件

### Requirement: 印件 ReviewRound 整合

訂單印件 SHALL 與 `prepress-review` capability 定義的 ReviewRound 模型整合。

**PrintItem 層新增欄位**：
- `current_round_id`：FK ReviewRound（unique）。指向當前合格輪次，作為印件摘要呈現的單一指針。尚未合格時為 NULL。

**PrintItemFile 欄位調整**：
- 新增 `round_id`：FK ReviewRound
- 新增 `file_role`：enum（印件檔 / 縮圖；PI-003 定案兩值）
- 保留 `review_status` 但標為衍生值
- **移除** `is_final`：由 `PrintItem.current_round_id → Round → File` 指針鏈取代

印件詳情頁 SHALL 呈現所有歷史 ReviewRound（時間、輪次、審稿人員、結果、備註、當時的檔案），最新在上。印件摘要（訂單層呈現）SHALL 透過 `current_round_id` 指針查詢合格輪次的加工檔與縮圖。

#### Scenario: 印件詳情頁呈現歷史輪次

- **WHEN** 任一角色檢視訂單下的印件詳情頁
- **THEN** 系統 SHALL 列出該印件所有 ReviewRound 輪次
- **AND** 每一輪可展開檢視當時的原稿、加工檔、縮圖與結果

#### Scenario: 訂單層透過 current_round_id 呈現合格輪檔案

- **WHEN** 訂單詳情頁呈現印件摘要縮圖
- **THEN** 系統 SHALL 透過 `PrintItem.current_round_id → Round → File (file_role=縮圖)` 查詢顯示
- **AND** current_round_id 為 NULL 的印件 SHALL 顯示「待審稿」狀態而非舊輪檔案

#### Scenario: is_final 移除後既有查詢改由指針鏈

- **GIVEN** 本 change 上線前的既有印件已存在 PrintItemFile 紀錄
- **WHEN** 執行資料遷移
- **THEN** 系統 SHALL 為每個既有印件建立 `round_no = 1` 的 ReviewRound（result 依原 review_status 對應）
- **AND** 原 `is_final = TRUE` 的檔案綁入該 Round
- **AND** 若原 review_status = 合格，設 PrintItem.current_round_id 指向該 Round

### Requirement: B2C 會員上傳印件稿件備註

B2C 會員於 EC 前台上傳印件時 SHALL 可選擇性填寫 `client_note`，作為給審稿人員的稿件說明。EC 系統 SHALL 呼叫 ERP 介面將 `client_note` 隨印件一併回寫。

**欄位定義對齊** [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)：
- `client_note`：text（最長 500 字，非必填）
- 層級：印件 1:1，跟著印件走
- 方向：會員 → 審稿

**整合邊界**：EC 整合介面擴充與 `difficulty_level` 同路徑；本 change 僅規範 `client_note` 欄位語意與 Prototype demo，實際 EC API 欄位擴充由 EC 整合 change 處理。

#### Scenario: 會員於 EC 上傳印件附稿件備註

- **WHEN** 會員於 EC 下單頁上傳印件並填寫 `client_note`
- **THEN** EC 系統 SHALL 呼叫 ERP 補件 / 上傳介面，欄位含 `client_note`
- **AND** ERP SHALL 將 `client_note` 存至對應 PrintItem
- **AND** 審稿人員於工作台接收此印件時 SHALL 可見 `client_note` 內容

#### Scenario: 會員未填寫稿件備註仍可送出

- **WHEN** 會員於 EC 下單頁上傳印件但未填寫 `client_note`
- **THEN** 系統 SHALL 允許送出，PrintItem.client_note 存為 NULL

#### Scenario: 稿件備註超過字數上限被拒

- **WHEN** 會員填寫 `client_note` 超過 500 字
- **THEN** EC 前端 SHALL 於送出前顯示字數超出提示
- **AND** 若略過前端檢查直接呼叫 ERP API，ERP SHALL 於介面回應錯誤拒絕寫入

### Requirement: 訂單詳情頁 Tabs 化版型

訂單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 訂單編號（標題）
- 訂單狀態 Badge（沿用既有 `OrderStatusBadge`）
- 主動作群（依訂單狀態條件顯示：B2C 前台 Demo / 確認回簽 / 變更路徑導引 Tooltip / 取消訂單）

訂單詳情頁 SHALL 包含 6 個 Tab，順序：`資訊（首位，defaultValue）→ 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄`。

「資訊」Tab 為 [refactor-detail-pages-to-subheader-tab-layout](../../changes/archive/) 新增 Tab，SHALL 承載原 Tabs 之上資訊區的 5 張資訊卡：訂單資訊 / 金額及付款狀態 / 發票設定（條件顯示）/ 物流設定（條件顯示）/ 客戶資訊。5 張卡 SHALL 在「資訊」Tab 內依此順序單欄垂直排列（移除既有 `grid grid-cols-[1fr_380px]` 兩欄佈局），各自保留 rounded card 邊框（`rounded-xl border border-[#e3e4e5] bg-white`）。

「發票設定」卡 SHALL 在 `order.invoiceEnabled === true` 時顯示，否則隱藏。「物流設定」卡 SHALL 在 `order.shippingMethod` 不為空時顯示，否則隱藏。

#### Scenario: 業務進入訂單詳情頁預設停留資訊 Tab

- **WHEN** 業務從訂單列表點擊訂單編號進入訂單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 依序顯示訂單資訊 → 金額及付款狀態 → 發票設定（條件）→ 物流設定（條件）→ 客戶資訊 5 張卡
- **AND** 5 張卡 SHALL 為單欄垂直排列（不採兩欄 grid 佈局）

#### Scenario: 訂單詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽訂單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）

#### Scenario: 訂單詳情頁資訊區重組

- **WHEN** 業務進入訂單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「訂單資訊」「金額及付款狀態」「發票設定」「物流設定」「客戶資訊」5 張卡
- **AND** 5 張卡 SHALL 在「資訊」Tab 內呈現

#### Scenario: 訂單發票 / 物流卡條件顯示

- **WHEN** 訂單 `order.invoiceEnabled === false`
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「發票設定」卡

- **WHEN** 訂單 `order.shippingMethod` 為空
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「物流設定」卡

#### Scenario: 訂單 ErpPageHeader 主動作維持

- **WHEN** 業務查看訂單詳情頁
- **THEN** `ErpPageHeader` 右側 SHALL 顯示「B2C 前台 Demo」按鈕（恆顯示）
- **AND** 訂單狀態為「報價待回簽」時 SHALL 顯示「確認回簽」按鈕
- **AND** 訂單狀態非「已取消」、非「訂單完成」時 SHALL 顯示「變更路徑導引」Tooltip + 「取消訂單」按鈕
- **AND** 主動作 SHALL NOT 移至 Tab 內或下放至其他位置

---

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
- **檢視**：**永遠顯示**，點擊開啟 PrintItemDetailSidePanel（見下方 Requirement）

操作欄 MUST NOT 包含「申請異動」按鈕（移除原 row-level 入口，動線改由業務通知印務從工單異動處理；見 § 訂單階段印件規格編輯時機）。

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
- size = `2xl`（800px，對齊 Figma node-id 8977:269607 詳情預覽型 SidePanel 規格；add-side-panel-shared-components 2026-05-25 歸檔調整）
- direction = `right`

**Header**：
- 印件名稱
- PrintItemTypeLabel（沿用 add-after-sales-ticket / refine-after-sales-refund 既有共用元件）
- 印件狀態 Badge
- 「開啟完整詳情頁」link（點擊 navigate 至 `/print-items/<id>` 印件完整詳情頁）

**Body**（四區塊垂直排列、用 SidePanel 共用元件組裝；add-side-panel-shared-components 2026-05-25 歸檔對齊 Figma node-id `8977:269607`）：

整體採 `<SidePanelBody>` 包裝（自動處理 padding px-6 py-5 + section 間距 16+1+16 + `#e3e4e5` 水平分隔線、最後 section 無底部 hr）。

1. **印件資訊區塊**：`<SidePanelSection title="印件資訊">` 包 2 個 `<SidePanelInfoTable>`：
   - 上半 cols=1：訂單編號（link 至 /orders/<id>）/ 案名 / 客戶
   - 下半 cols=2：印件編號（link 至 /print-items/<id>）/ 印件類型 / 審稿狀態 / 難易度 / 印製狀態 / 免審稿快速路徑 / 訂單來源 / 出貨方式 / 預計產線 + 規格備註 / 檔案備註 / 包裝備註 span=2 跨欄

2. **印件檔案區塊**：`<SidePanelSection title="印件檔案">` 包 1 個 `<SidePanelInfoTable>` 3 行：
   - 原始檔案 → `<SidePanelFileList files={sourceFiles} />`（垂直疊放）
   - 審稿後檔案 → `<SidePanelFileList files={processedFiles} />`（垂直疊放，對齊 Figma 多檔案疊放）
   - 稿件縮圖 → `<SidePanelThumbnailList thumbs={thumbFiles} />`（48x48 / gap 4px / horizontal）
   - 每行 label 含 Info hint icon（透過 `SidePanelInfoItem.hint` prop）

3. **相關工單清單**：`<SidePanelSection title="相關工單">` 內放 6 欄 `<table className="erp-table">`（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日），承接本次從主表移除的「工單數」摘要 + 原 ErpExpandableRow 子表內容。工單編號 SHALL 為可點擊連結，點擊 navigate 至 `/work-orders/<id>`。

4. **審稿紀錄區塊**：`<SidePanelSection title="審稿紀錄">` 內放 7 欄 `<table className="erp-table">`（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註），承載該印件全部 ReviewRound 歷史摘要。資料來源為 `OrderPrintItem.reviewRounds: ReviewRound[]`（內嵌結構、無需新增 store selector）。
   - **排序**：依 `roundNo` 由新到舊（最新一輪在最上）
   - **送審方式欄**：直接顯示 ReviewRound.source 值（`審稿` / `免審稿` / `售後補印`）
   - **審稿人員欄文案規則**：
     - `source = 審稿` + `reviewerId` 有值 → 顯示審稿人員姓名（透過 reviewerNames lookup）
     - `source = 審稿` + `reviewerId` 為 null → 顯示「待分派」
     - `source = 免審稿` → 顯示「系統免審」
     - `source = 售後補印` → 顯示「系統沿用」
   - **結果欄樣式**：採文字加色，**不**使用 Badge 元件
     - `合格` → 預設色
     - `不合格` → destructive 紅 `#dc2626`
     - `待審`（`result = null`，補件後新建 Round 尚未審完）→ 橘色 `#C97A00`
   - **退件分類欄**：合格 / 待審輪次 SHALL 顯示「—」；不合格輪次 SHALL 顯示 `rejectReasonCategory` enum 值
   - **備註欄**（`reviewNote`）：採 `line-clamp-2` 截斷顯示 + 原生 `title` attribute hover tooltip 顯示完整內容（最長 1000 字）
   - **空狀態**：`reviewRounds.length === 0` SHALL 顯示「此印件尚未送審」（與第 3 區塊「尚無工單」視覺一致）

**Footer**：關閉按鈕

#### Scenario: 業務點檢視按鈕開啟 Side Panel

- **WHEN** 業務於印件清單操作欄點擊「檢視」按鈕
- **THEN** 右側 SHALL 開啟 PrintItemDetailSidePanel
- **AND** Header SHALL 顯示印件名稱 + 類型 Label + 狀態 Badge + 開啟完整詳情頁 link
- **AND** dialog 寬度 SHALL 為 800px（ErpSidePanel size="2xl"）
- **AND** Header SHALL 顯示印件名稱 + 類型 Label + 狀態 Badge + 開啟完整詳情頁 link
- **AND** Body SHALL 依序顯示印件資訊 / 印件檔案 / 相關工單 / 審稿紀錄四區塊

#### Scenario: SidePanel 內 section 間有水平分隔線

- **GIVEN** PrintItemDetailSidePanel 開啟
- **WHEN** 業務查看 SidePanel body
- **THEN** 4 section 中前 3 個 section 後 SHALL 各有 1px `#e3e4e5` 水平分隔線
- **AND** 最後一個 section（審稿紀錄）SHALL NOT 有底部分隔線
- **AND** section 與 hr 之間 SHALL 各有 16px 垂直間距

#### Scenario: SidePanel 印件檔案多檔垂直疊放

- **GIVEN** 印件審稿後檔案有 2 個 file（`reviewFiles.fileRole='審稿後檔案'`）
- **WHEN** 業務查看 SidePanel 印件檔案區塊「審稿後檔案」row
- **THEN** 2 個 file chips SHALL 垂直疊放（wrapper class 含 `flex-col`）
- **AND** chips 間距 SHALL 為 4px

#### Scenario: SidePanel 稿件縮圖水平排列 48x48

- **GIVEN** 印件稿件縮圖有 3 個 thumb（`reviewFiles.fileRole='縮圖'`）
- **WHEN** 業務查看 SidePanel 印件檔案區塊「稿件縮圖」row
- **THEN** 3 個縮圖 SHALL 水平排列（wrapper class 含 `flex-row`）
- **AND** 每個縮圖尺寸 SHALL 為 48x48 (`w-12 h-12`)
- **AND** 縮圖間距 SHALL 為 4px

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

#### Scenario: Side Panel 審稿紀錄顯示多輪混合結果

- **GIVEN** 印件已有 2 輪審稿（第 1 輪不合格、第 2 輪合格）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 2 列、第 2 輪在最上（最新一輪在最上）
- **AND** 第 2 輪結果欄 SHALL 顯示「合格」（預設色）、退件分類欄 SHALL 顯示「—」
- **AND** 第 1 輪結果欄 SHALL 顯示「不合格」（destructive 紅）、退件分類欄 SHALL 顯示對應 rejectReasonCategory enum 值

#### Scenario: Side Panel 審稿紀錄顯示免審稿輪次

- **GIVEN** 印件於業務階段勾選免審稿、系統自動產生 source=`免審稿` 的 ReviewRound（reviewerId 為 null、result = 合格）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 1 列
- **AND** 審稿人員欄 SHALL 顯示「系統免審」
- **AND** 送審方式欄 SHALL 顯示「免審稿」
- **AND** 結果欄 SHALL 顯示「合格」（預設色）
- **AND** 退件分類欄 SHALL 顯示「—」

#### Scenario: Side Panel 審稿紀錄顯示售後補印自動通過輪次

- **GIVEN** 印件為補印印件（type = `補印印件`），系統建立 ticket 內補印 PrintItem 時自動產生 source=`售後補印` 的 ReviewRound（reviewerId 為 null、result = 合格、sourcePrintItemId 指向來源印件）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 1 列
- **AND** 審稿人員欄 SHALL 顯示「系統沿用」
- **AND** 送審方式欄 SHALL 顯示「售後補印」
- **AND** 結果欄 SHALL 顯示「合格」（預設色）

#### Scenario: Side Panel 審稿紀錄空狀態

- **GIVEN** 印件尚未送審（reviewRounds 為空陣列）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格區域 SHALL 顯示「此印件尚未送審」空狀態提示
- **AND** 視覺樣式 SHALL 與第 3 區塊「尚無工單」空狀態一致（灰字置中）

#### Scenario: Side Panel 審稿紀錄備註截斷與完整顯示

- **GIVEN** 某輪審稿備註（reviewNote）內容長度 > 50 字
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊的備註欄
- **THEN** 備註欄 SHALL 以 `line-clamp-2` 截斷顯示
- **AND** 滑鼠 hover 該儲存格 SHALL 顯示完整 reviewNote 內容（透過原生 title attribute tooltip，無需引入 shadcn Tooltip 元件）

#### Scenario: 從 Side Panel 跳轉至印件完整詳情頁

- **WHEN** 業務點擊 Side Panel Header 內「開啟完整詳情頁」link
- **THEN** 系統 SHALL navigate 至 `/print-items/<id>` 印件完整詳情頁

---

### Requirement: 訂單業務主管審核欄位

Order 資料模型 SHALL 新增以下業務主管審核相關欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK->使用者；訂單建立時指派、進入「報價待回簽」後鎖定（僅 Supervisor 可解鎖） |
| 是否需審核 | approval_required | boolean | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | text(500) | | | 從來源 QuoteRequest 帶入；業務主管於審核時查看作為決策依據；進入「報價待回簽」後鎖定 |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | text(500) | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續若訂單退回需重審時的條件對照 |

`approved_by_sales_manager_id` 欄位的可選範圍 MUST 限定為具業務主管角色的用戶。

#### Scenario: 線下訂單建立時自動指派業務主管

- **WHEN** 業務於需求單成交後點擊「轉訂單」建立線下訂單
- **THEN** 系統 SHALL 自動將 `approved_by_sales_manager_id` 設為預設業務主管（Phase 1 第一位）
- **AND** 系統 SHALL 將 `approval_required` 設為 `true`
- **AND** 系統 SHALL 將來源需求單的 `payment_terms_note` 內容寫入訂單同名欄位
- **AND** 系統 SHALL 將 `lastApprovedPaymentTermsNote` 預設為 `null`

#### Scenario: 進入報價待回簽後業務主管欄位鎖定

- **GIVEN** 訂單狀態為「報價待回簽」或更後狀態
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `approved_by_sales_manager_id`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀
- **AND** 此規則 MUST NOT 限制 Supervisor 的解鎖權限（見 § Supervisor 重新指定訂單業務主管）

---

### Requirement: 業務主管核准訂單

線下訂單從「待業務主管審核」推進至「報價待回簽」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，訂單維持「待業務主管審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行；本 Requirement MUST NOT 提供「退回討論」按鈕（避免 ERP 內 / Slack 內雙軌討論造成資訊分散）。

業務主管核准時 MUST：
- 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`（快照）
- 寫入 OrderActivityLog（事件描述 = 「核准訂單（成交條件審核）」）
- 將訂單狀態推進至「報價待回簽」

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: 業務主管核准訂單

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`、`payment_terms_note` 非空
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准訂單（成交條件審核）」）
- **AND** 業務 SHALL 看到「外發報價單」相關動作可推進

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 訂單狀態為「待業務主管審核」、`payment_terms_note` 為空
- **WHEN** 業務主管點擊「核准訂單」
- **THEN** UI MUST 跳出 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核准訂單（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，訂單狀態 MUST 維持「待業務主管審核」

#### Scenario: 業務主管不核准透過 Slack thread 溝通

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 業務主管認為需重新討論收款條件或成交條件
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過 Slack thread 與業務直接討論
- **AND** 訂單狀態 MUST 維持「待業務主管審核」直到業務主管核准

#### Scenario: 業務不可從待業務主管審核直接推進至報價待回簽

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟訂單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准訂單」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「報價待回簽」 MUST 回傳權限不足錯誤

#### Scenario: 非指定業務主管不可核准

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於訂單詳情頁點擊「核准訂單」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 該訂單 MUST NOT 出現在當前業務主管的「訂單審核」待辦清單

---

### Requirement: 業務主管於訂單模組的資料可見範圍

業務主管 SHALL 於訂單模組的可見範圍依頁面區分：

| 頁面 | 業務主管可見範圍 |
|------|----------------|
| 訂單列表頁（`/orders`）| 所有訂單（提供部門總覽能力）|
| 訂單審核待辦頁（`/sales-manager/approvals`）| `approved_by_sales_manager_id = self` AND `status ∈ {待業務主管審核, 報價待回簽, 已回簽, 已取消}` |
| 訂單詳情頁（`/orders/{id}`）| 所有訂單可瀏覽；「核准訂單」按鈕僅在 `approved_by_sales_manager_id = self` 時顯示 |

預設篩選 `status = 待業務主管審核`，按進入時間 ASC 排序（最久優先）。

#### Scenario: 業務主管於訂單審核頁僅見自己被指派的訂單

- **GIVEN** 訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管登入並開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 在審核清單中顯示此訂單

#### Scenario: 業務主管於訂單列表頁可見全部

- **WHEN** 業務主管登入並開啟 `/orders`
- **THEN** 列表 SHALL 顯示所有訂單（含其他業務主管被指定、含未進入審核的訂單）
- **AND** 業務主管點開非自己被指定的訂單詳情頁，MUST NOT 顯示「核准訂單」按鈕

---

### Requirement: Supervisor 重新指定訂單業務主管

Supervisor SHALL 擁有「解鎖並重新指定訂單 `approved_by_sales_manager_id`」的權限，作為業務主管離職 / 請假 / 異動時的 Phase 1 處理機制，避免訂單卡在「待業務主管審核」狀態。

此操作 MUST 寫入 OrderActivityLog 記錄解鎖動作（操作者 = Supervisor、舊業務主管、新業務主管、解鎖原因 free text 必填）。新業務主管 MUST 為具業務主管角色的用戶。

#### Scenario: Supervisor 重新指定訂單業務主管

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 原指定業務主管因離職 / 請假 / 異動無法核准
- **WHEN** Supervisor 於訂單詳情頁執行「重新指定業務主管」並填寫解鎖原因
- **THEN** 系統 SHALL 允許 Supervisor 變更 `approved_by_sales_manager_id`
- **AND** 新業務主管 MUST 為具業務主管角色的用戶
- **AND** 系統 MUST 寫入 OrderActivityLog（操作者 = Supervisor、事件描述 = 「重新指定訂單業務主管」、舊值、新值、原因）
- **AND** 新業務主管 SHALL 於自己的訂單審核待辦頁看到此訂單

#### Scenario: 一般使用者不可重新指定訂單業務主管

- **WHEN** 業務、業務主管、印務主管或其他非 Supervisor 角色嘗試執行「重新指定訂單業務主管」
- **THEN** 系統 MUST NOT 顯示此操作入口
- **AND** 任何 API 請求嘗試變更 `approved_by_sales_manager_id` MUST 回傳權限不足錯誤

### Requirement: 帳務公司管理（BillingCompany）

系統 SHALL 維護 BillingCompany 主檔，每個 BillingCompany 對應一個藍新（NewebPay / ezPay）商店帳號（ezpay_merchant_id）。系統管理員可新增、停用 BillingCompany；業務 / 諮詢 / 會計僅可讀取，於需求單 / 訂單建立時選用。BillingCompany.ezpay_merchant_id MUST 唯一，避免兩家公司共用同一商店代號（會違反藍新 MerchantOrderNo 不可重覆規則）。同時間 SHALL 僅允許一筆 is_default = true。

#### Scenario: 系統管理員建立帳務公司

- **WHEN** 系統管理員於後台新增 BillingCompany
- **THEN** 系統 SHALL 寫入 BillingCompany 主檔，要求填入 name、tax_id、ezpay_merchant_id、address、phone
- **AND** 系統 MUST 驗證 ezpay_merchant_id 唯一性

#### Scenario: 業務於需求單下拉選擇帳務公司

- **WHEN** 業務於需求單編輯頁開啟帳務公司下拉
- **THEN** 系統 SHALL 僅顯示 is_active = true 的 BillingCompany
- **AND** 預設值 SHALL 為 is_default = true 的那筆

### Requirement: 付款計畫建立（PaymentPlan）

業務 / 諮詢 SHALL 於訂單成立後（狀態 = 報價待回簽 或 訂單確認）建立付款計畫，定義一個訂單分成 N 期收款的金額與時程。每筆 PaymentPlan 紀錄期別、描述、預定金額、預計收款日。

`PaymentPlan.scheduled_date` SHALL 為必填欄位，避免追款篩選遺漏。

建立時各期金額合計 MUST = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)；若不等系統 SHALL 顯示差額提示。

**[本 change 修訂] PaymentPlan.status 推導機制**：

`PaymentPlan.status`（未收 / 部分收款 / 已收訖）SHALL 依「對應 PaymentPlan 且 paymentStatus = '已完成'」的 Payment 累計推導：

- 累計 ≤ 0：status = '未收'
- 0 < 累計 < scheduledAmount：status = '部分收款'
- 累計 ≥ scheduledAmount：status = '已收訖'

處理中 Payment 不影響期次狀態（避免「業務先填一半就讓期次跳『已收訖』」的虛假狀態）。

#### Scenario: 業務建立兩期付款計畫

- **GIVEN** 訂單成立後總額 100,000
- **WHEN** 業務建立 PaymentPlan 訂金 30,000、尾款 70,000，並各填入 scheduled_date
- **THEN** 系統 SHALL 建立兩筆 PaymentPlan 紀錄（installment_no = 1, 2）

#### Scenario: 付款計畫合計與應收總額不符的提示

- **WHEN** 業務建立 PaymentPlan 各期合計 ≠ Order.total_with_tax + ∑(OrderAdjustment.amount)
- **THEN** 系統 SHALL 顯示「差額 X 元」提示，仍允許儲存

#### Scenario: 缺漏 scheduled_date 無法儲存

- **WHEN** 業務建立 PaymentPlan 未填入 scheduled_date
- **THEN** 系統 SHALL 阻擋儲存並提示「預計收款日為必填」

#### Scenario: PaymentPlan 期次狀態僅累計已完成 Payment

- **GIVEN** PaymentPlan PP-010（scheduledAmount = 50000, status 推導前 = '未收'）
- **AND** 兩筆對應 Payment：P-010a（amount = +30000, paymentStatus = '已完成', paymentPlanId = PP-010.id）+ P-010b（amount = +20000, paymentStatus = '處理中', paymentPlanId = PP-010.id）
- **WHEN** 系統推導 PP-010.status
- **THEN** 系統 SHALL 累計已完成 Payment = 30000
- **AND** 30000 < 50000 → status = '部分收款'（非「已收訖」，因 P-010b 處理中不計入）

### Requirement: 付款計畫變更觸發訂單回業務主管審核

業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到「業務主管審核」狀態（沿用 [add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 機制）。業務主管未核可前訂單不得進入後續狀態。

#### Scenario: 業務修改尾款日期觸發回審

- **GIVEN** 訂單付款計畫已建立且訂單已過業務主管審核
- **WHEN** 業務修改 PaymentPlan #2 的 scheduled_date
- **THEN** 系統 SHALL 將訂單狀態回退至「業務主管審核」
- **AND** 系統 MUST 在活動紀錄記載「付款計畫變更，回業務主管審核」

#### Scenario: 業務主管核可付款計畫變更

- **GIVEN** 訂單因付款計畫變更回到「業務主管審核」狀態
- **WHEN** 業務主管於訂單詳情頁核可
- **THEN** 訂單 SHALL 推進至原付款計畫變更前的後續狀態

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

**Payment polymorphic 關聯設計（沿用 refactor change）**：

Payment 的關聯目標 SHALL 為 polymorphic，支援關聯 ConsultationRequest 或 Order：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `linked_entity_type` | enum: `ConsultationRequest` / `Order` | Payment 關聯的實體類型 |
| `linked_entity_id` | UUID | 依 `linked_entity_type` 指向 ConsultationRequest 或 Order 主鍵 |
| `is_transferred` | boolean | 是否已從 ConsultationRequest 轉移過至 Order（一次性轉移完成標記）|
| `original_entity_type` / `original_entity_id` | optional | 若 is_transferred = true，紀錄原始關聯（保留歷史） |

`linked_entity_type = ConsultationRequest` 僅出現在「諮詢費 webhook 自動建立的 Payment 尚未轉移至訂單」的中間態。一旦轉移至 Order（諮詢結束或需求單流失或諮詢取消觸發），`is_transferred` 設為 true，後續不可再次轉移。

`linked_entity_type = Order` 為一般情境（refactor change 原設計皆涵蓋）。

退款 Payment 的 `linked_entity_type` 一律為 `Order`（諮詢取消情境下退款 Payment 直接建在新建的諮詢訂單上）。

**[本 change 新增] Payment 狀態欄通用化（一般收款 + 退款 + 補收同邏輯）**：

Payment SHALL 新增 `paymentStatus` 欄位：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `paymentStatus` | enum: `處理中` / `已完成` | 必填 | 新建預設 `處理中`；業務手動切「已完成」表示款項實際發生且對帳資料齊備 |
| `completedAt` | timestamp | nullable | 業務切「已完成」時系統寫入；切回「處理中」禁止（見修正路徑）|

`paymentStatus` 適用所有 paymentMethod（一般收款 / 退款 / 補收皆同邏輯），不分情境。

**Invariant**：

- 新建 Payment MUST 帶 `paymentStatus`（不可為 null）
- 既有資料 Migration：所有歷史 Payment backfill `paymentStatus = '已完成'`、`completedAt = createdAt`（過去設計即為「建立 = 完成」）
- `paymentStatus = '已完成' → completedAt 必為非 null timestamp`

**[本 change 修訂] paidAt 欄位語意通用化**：

`paidAt` 欄位語意明文化為「款項實際完成日」，所有 Payment（一般收款 / 退款 / 補收）共用此欄位：

- 處理中 Payment：paidAt 可空（業務尚未確認實際完成日）
- 已完成 Payment：paidAt 必填（業務確認的實際匯款 / 沖帳日）

棄用既有「退款情境另用 refundDate」雙軌語意（spec L875 既有設計），統一用 paidAt。types/payment.ts L77 既有註解已暗示通用語意，本 change 正式統一。

**[本 change 修訂] 對帳附件（attachments）切「已完成」時必填**：

切「已完成」時 attachments 必填 ≥ 1 個檔案，規則從 refine-after-sales-refund 既有「退款專用」擴及所有 Payment：

| 欄位 | 處理中（建立 / 編輯時）| 已完成（切換時驗證）|
|------|----------------------|---------------------|
| amount | 必填、非 0 | 鎖定（不可改）|
| paymentMethod | 必填 | 鎖定 |
| paidAt（款項實際完成日）| 選填 | 必填（所有 Payment 適用）|
| attachments | 選填 | 必填 ≥ 1（所有 Payment 適用，作為款項實際發生的事實依據）|
| linkedOrderAdjustmentId | 從 OA 入口建：必填、symbol(amount) = symbol(OA.amount)；從 OrderPaymentSection 建一般收款：null | 同處理中 |
| paymentRef | 選填 | 選填 |
| notes / reconciliation_note | 選填 | 選填 |

切「已完成」未通過上述必填驗證時 MUST NOT 通過儲存。

**[本 change 新增] linkedOrderAdjustmentId 必填規則對稱化**：

從 OA 編輯介面建立的 Payment（不論退款 / 補收）：

- linkedOrderAdjustmentId 必填 = OA.id
- amount 符號必須與 OA.amount 同方向（退款 OA amount < 0 → Payment amount ≤ 0；補收 OA amount > 0 → Payment amount ≥ 0）

從 OrderPaymentSection 入口建立的一般收款 Payment：linkedOrderAdjustmentId 可空（一般收款 / 臨時預收沿用 spec L850 既有設計）。

退款 / 補收 Payment SHALL NOT 從 OrderPaymentSection 直接建立（保留 OA 審核流程的權威性）；要建退款 / 補收 Payment 必須走 OA 編輯介面入口。

**[本 change MODIFY refine-after-sales-refund] 退款 / 補收 Payment 切「已完成」自動推進關聯 OrderAdjustment**：

當 Payment 滿足以下條件時，系統 SHALL 同 transaction 推進關聯 OA 狀態：

- Payment.linkedOrderAdjustmentId 非空
- Payment.paymentStatus 從 '處理中' 切換為 '已完成'
- 對應 OA 的所有已完成 Payment 累計 amount（含符號比較）= OA.amount

推進動作：OrderAdjustment.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點。

注意：「建立退款 Payment 即推進 OA 已執行」既有設計（spec L883）已 MODIFY 為「Payment 切已完成累計達 OA.amount 才推進」。建立處理中 Payment 不影響 OA 狀態。

**[本 change MODIFY] 退款 / 補收 Payment 與 OA 資料一致性 invariant**：

系統 MUST 強制以下不變式：

- `OrderAdjustment.status = '已執行' AND linkedAfterSalesTicketId 任意 → 存在至少一筆關聯 Payment WHERE Payment.linkedOrderAdjustmentId = OA.id AND Payment.paymentStatus = '已完成'，且所有已完成 Payment 累計 amount = OA.amount（含符號比較）`
- 既有 invariant「OA 已執行 → 必有關聯退款 Payment」MODIFY 為「OA 已執行 → 必有關聯已完成 Payment 累計達 OA.amount」（涵蓋退款 + 補收兩類）
- 此 invariant 於 verify 階段 SHALL 被 Playwright 斷言檢驗

#### Scenario: 業務記錄訂金收款（一般收款，預設處理中）

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 開啟 Payment 建立 dialog
- **AND** 業務 MUST 填入 amount = +30000、paymentMethod = '銀行轉帳'、paymentPlanId（選擇對應期次）
- **AND** 業務可選填 paidAt 與 attachments（處理中態可缺）
- **AND** 業務點擊「儲存」後系統 SHALL 建立 Payment（paymentStatus = '處理中'）
- **AND** Payment 出現在收款列表標「處理中」狀態 badge

#### Scenario: 業務先填一半再補齊資料切已完成

- **GIVEN** 業務先建一筆處理中 Payment P-007（amount = +30000, paymentMethod = '銀行轉帳', paidAt = null, attachments = []）
- **WHEN** 業務於後續日子收到銀行對帳單，於收款列表點 P-007「編輯」開啟 dialog，補入 paidAt = 2026-05-25、上傳對帳單.pdf、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過必填驗證（paidAt 與 attachments 已齊）
- **AND** 系統 SHALL 寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000（之前處理中不計入，現在計入）
- **AND** 若該 Payment 對應 PaymentPlan 期次，期次累計可能達 scheduledAmount → status 變「已收訖」

#### Scenario: 業務未補齊資料直接切已完成被擋

- **GIVEN** 業務開啟處理中 Payment P-008 編輯 dialog（attachments = []）
- **WHEN** 業務直接切換 paymentStatus → '已完成' 並點擊「儲存」
- **THEN** 系統 SHALL 顯示驗證錯誤「對帳附件為必填（至少 1 個）」「款項實際完成日為必填」
- **AND** 系統 SHALL NOT 寫入 paymentStatus = '已完成'
- **AND** Payment 維持 paymentStatus = '處理中'

#### Scenario: 諮詢費 webhook 建立的 Payment 預設已完成（既有自動化流程）

- **GIVEN** webhook 觸發、ConsultationRequest 已建立
- **WHEN** 系統建立諮詢費 Payment
- **THEN** Payment.linked_entity_type SHALL = `ConsultationRequest`
- **AND** Payment.linked_entity_id SHALL = consultation_request_id
- **AND** Payment.is_transferred SHALL = false
- **AND** Payment.paymentStatus SHALL = '已完成'（webhook 觸發代表金流已實際發生，不需業務手動切）
- **AND** Payment.completedAt SHALL = webhook 觸發時點

#### Scenario: PaymentPlan 期次狀態僅累計已完成 Payment

- **GIVEN** PaymentPlan PP-001（scheduledAmount = 30000, status = '未收'）
- **AND** 對應一筆處理中 Payment（amount = +30000, paymentStatus = '處理中', paymentPlanId = PP-001.id）
- **WHEN** 系統推導 PP-001.status
- **THEN** 系統 SHALL 過濾 paymentStatus = '已完成' 的 Payment 累計（此時 = 0）
- **AND** PP-001.status SHALL 維持「未收」（處理中 Payment 不影響期次狀態）

#### Scenario: 業務於 OA 編輯介面建立退款 Payment（處理中，OA 不動）

- **GIVEN** OrderAdjustment OA-001（status = 已核可、amount = -5000、linkedAfterSalesTicketId = AS-001、adjustment_type = 退印）
- **WHEN** 業務於 OA-001 編輯 dialog 內點「新增 Payment」按鈕（OA 退款型自動預填 paymentMethod = '退款'）、填入 amount = -5000、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-001.id, linked_entity_type = Order, linked_entity_id = OA-001.order_id）
- **AND** OA-001.status SHALL 維持「已核可」（建立處理中 Payment 不推進 OA）
- **AND** 對帳收款淨額不變（處理中 Payment 不計入）

#### Scenario: 業務切退款 Payment 已完成自動推進 OA

- **GIVEN** OA-001 已有處理中 Payment P-001（amount = -5000）
- **WHEN** 業務於 OA-001 編輯 dialog 點 P-001 row「編輯」、補 paidAt = 2026-05-21、上傳銀行轉帳憑證.pdf、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-001.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-001 對應已完成 Payment 累計 = -5000 = OA-001.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-001.status → '已執行'、executedAt = now
- **AND** 系統 SHALL 觸發訂單應收總額重算
- **AND** OA 編輯介面 SHALL 顯示「已執行（透過 Payment P-001 推進）」

#### Scenario: 補收 OA 對稱化建立 + 切已完成自動推進（新規）

- **GIVEN** 訂單期間客戶要求加印，業務建立 OrderAdjustment OA-002（amount = +20000, adjustment_type = 加印追加, status = 已核可）
- **WHEN** 業務於 OA-002 編輯 dialog 內點「新增 Payment」（OA 補收型自動預填 paymentMethod 為非「退款」項）、填入 amount = +20000、paymentMethod = '銀行轉帳'、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment P-002（amount = +20000, paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **AND** OA-002.status SHALL 維持「已核可」
- **WHEN** 客戶實際匯款後，業務於 P-002 補 paidAt、上傳轉帳憑證、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 重算 OA-002 對應已完成 Payment 累計 = +20000 = OA-002.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-002.status → '已執行'、executedAt = now

#### Scenario: 退款 / 補收 Payment 不允許從 OrderPaymentSection 入口建立

- **GIVEN** 業務於訂單詳情頁 OrderPaymentSection 點「新增收款」
- **WHEN** dialog 顯示
- **THEN** paymentMethod 下拉選單 SHALL NOT 包含「退款」選項
- **AND** dialog SHALL NOT 提供 linkedOrderAdjustmentId 欄位
- **AND** 業務若要建退款 / 補收 Payment SHALL 從 OA 編輯介面入口建立（保留 OA 審核流程的權威性）

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與 PaymentPlan / Payment 解耦：可先開後收、後收先開、合併（多筆 Payment 對一張 Invoice）、拆分（一筆 Payment 對多張 Invoice）。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立

#### Scenario: 業務拆分一筆收款開兩張發票

- **GIVEN** 訂單有一筆 Payment 100,000
- **WHEN** 業務開立兩張 Invoice 各 50,000，於 PaymentInvoice junction 各關聯該 Payment 50,000
- **THEN** 系統 SHALL 允許並驗證 ∑(PaymentInvoice.amount where payment_id = X) ≤ Payment.amount

#### Scenario: 業務合併多筆收款開一張發票

- **GIVEN** 訂單有 Payment #1 = 30,000、Payment #2 = 70,000
- **WHEN** 業務開立 Invoice = 100,000，於 PaymentInvoice junction 各關聯一筆
- **THEN** 系統 SHALL 允許並寫入兩筆 PaymentInvoice 紀錄

#### Scenario: 業務先開發票後收款

- **WHEN** 業務於 Payment 為空時開立 Invoice
- **THEN** 系統 SHALL 允許，PaymentInvoice 暫無記錄
- **AND** 後續 Payment 建立時，業務 SHALL 可手動關聯到該 Invoice

### Requirement: 發票作廢

業務 / 諮詢 SHALL 可於訂單詳情頁作廢已開立的發票，不需業務主管 / 會計核可。作廢時必填作廢原因（限中文 6 字或英文 20 字，對應藍新 InvalidReason 限制）。發票字軌號碼作廢後不可重用，重新開新發票時 ezpay_merchant_order_no 流水號 +1。系統 SHALL 在活動紀錄記載作廢動作（誰、何時、原因）。

#### Scenario: 業務作廢統編打錯的發票

- **GIVEN** 業務開立 Invoice 時誤填客戶統編
- **WHEN** 業務於發票清單點擊「作廢」並填入原因「統編錯誤」
- **THEN** 系統 SHALL 更新 Invoice.status = 作廢、invalid_reason、invalid_at、invalid_by
- **AND** 系統 MUST 在訂單活動紀錄記載作廢

#### Scenario: 業務作廢後重新開立新發票

- **GIVEN** Invoice #1 已作廢（ezpay_merchant_order_no = O-25050601-INV-01）
- **WHEN** 業務開立新 Invoice
- **THEN** 系統 SHALL 產生新 ezpay_merchant_order_no = O-25050601-INV-02（流水 +1，不重用）

### Requirement: Invoice 折讓衍生標籤（derived，不入狀態機）

Invoice 自身狀態機只有「開立 / 作廢」兩態，**折讓資訊不入發票狀態機**，改以 derived 衍生標籤呈現於 UI。系統 SHALL 即時計算每張發票的折讓衍生屬性，於發票清單與發票詳情頁顯示。

**衍生欄位算法**：

```
folded = ∑ SalesAllowance.|allowance_amount|
         where invoice_id = X AND status = 已確認

remaining = invoice.total_amount - folded

折讓衍生標籤：
  if invoice.status = 作廢                     → 顯示「－」（不適用）
  elif folded = 0                              → 顯示「無折讓」
  elif 0 < folded < total_amount               → 顯示「已部分折讓 -{folded}」
  elif folded = total_amount                   → 顯示「已完全折讓」
```

**為什麼不入狀態機**：
- 折讓金額是 ∑ SalesAllowance 累計算出，重複進 Invoice.status 會造成同步問題（SalesAllowance 變動要回頭改 Invoice）
- 一張發票可被多次折讓 / 作廢折讓，狀態回退邏輯複雜
- 業界（SAP / NetSuite / Oracle）做法一致：發票狀態只記 issued / void，credited 是 derived

#### Scenario: 發票清單顯示折讓衍生標籤

- **WHEN** 業務 / 會計於訂單詳情頁查看發票清單
- **THEN** 每張發票 SHALL 顯示三欄：對帳編號 / 發票號碼 / 金額 / 狀態 badge / 折讓衍生標籤
- **AND** 折讓衍生標籤 SHALL 依即時計算結果呈現「無折讓 / 已部分折讓 -X,XXX / 已完全折讓 / －（作廢）」

#### Scenario: 發票詳情頁顯示折讓累計

- **WHEN** 業務 / 會計開啟發票詳情頁
- **THEN** 系統 SHALL 顯示：發票金額（total_amount）、折讓累計（folded，已確認折讓合計）、剩餘可折讓金額（remaining）、折讓記錄清單
- **AND** 折讓累計 SHALL 排除 status = 已作廢 的 SalesAllowance

#### Scenario: 折讓變動後衍生標籤即時更新

- **GIVEN** Invoice = 100,000，已有 SalesAllowance #1 = -10,000（已確認）
- **WHEN** 業務作廢 SalesAllowance #1（status → 已作廢）
- **THEN** 折讓衍生標籤 SHALL 從「已部分折讓 -10,000」變回「無折讓」
- **AND** 剩餘可折讓金額 SHALL 從 90,000 回到 100,000

### Requirement: 折讓單（SalesAllowance）建立、確認、作廢

業務 / 諮詢 SHALL 可於已開立發票的詳情頁建立折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條），用於發票已開後不能整張作廢時，附加在原發票上的部分減額憑證。折讓單建立不需業務主管核可。折讓金額 MUST 為負數且絕對值 MUST ≤ 該發票尚未折讓的剩餘金額（即原發票金額 - 已確認折讓累計）。折讓建立時系統 SHALL 呼叫藍新（Mockup）兩段式流程：開立折讓 → 觸發確認折讓，狀態直接寫入「已確認」。已確認折讓可作廢（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立），作廢後該筆 SalesAllowance.status = 已作廢，發票剩餘可折讓金額回到作廢前狀態。一張發票 SHALL 可建立多筆折讓單，直到累計金額 = 原發票金額（已完全折讓）。

#### Scenario: 業務開立折讓單

- **WHEN** 業務於 Invoice = 100,000 詳情頁點擊「開立折讓」，填入金額 -10,000、原因「品質投訴」
- **THEN** 系統 SHALL 建立 SalesAllowance 紀錄、Mockup 產生 ezpay_allowance_no（A + 14 碼數字）
- **AND** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API，status 直接寫入「已確認」（不停留於草稿）
- **AND** Mockup 回傳 RemainAmt = 90,000（折讓後發票剩餘）

#### Scenario: 折讓金額超過剩餘可折讓金額被擋

- **GIVEN** Invoice = 100,000 已有 SalesAllowance #1 = -50,000（已確認）
- **WHEN** 業務嘗試開立 SalesAllowance #2 = -60,000
- **THEN** 系統 SHALL 拒絕並提示「折讓金額不可超過發票剩餘 50,000」

#### Scenario: 折讓限負數防呆

- **WHEN** 業務於折讓金額欄位輸入正數或零
- **THEN** 系統 SHALL 拒絕並提示「折讓金額必須為負數」

#### Scenario: 業務作廢已確認的折讓

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務點擊「作廢折讓」並填入原因
- **THEN** 系統 SHALL 更新 SalesAllowance.status = 已作廢，發票回到折讓前狀態
- **AND** Mockup 呼叫 allowanceInvalid API

### Requirement: 退款 Payment 與折讓分離（先記退款，再開折讓）

退款 Payment 與 SalesAllowance 為**分離設計**，符合業界會計分離原則（Credit Memo 與 Refund 分軸）。實務流程：(1) 業務 / 諮詢先在訂單詳情頁建立退款 Payment（payment_method = 「退款」、amount 為負數）；(2) 視情境決定後續：(a) 已開立發票且需保留發票 → 開立 SalesAllowance 並手動關聯 refund_payment_id；(b) 發票錯誤可作廢 → 作廢原發票重開（refund_payment_id 不需關聯到 SalesAllowance）。系統 SHALL NOT 在折讓建立時自動建立 Payment。

#### Scenario: 業務先建退款 Payment 再開折讓

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先於訂單詳情頁建立 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -10,000、reason = 品質瑕疵）
- **THEN** SalesAllowance.refund_payment_id SHALL 由業務手動關聯該退款 Payment
- **AND** Activity log MUST 分別記載 Payment 建立與 SalesAllowance 開立
- **AND** 系統 SHALL NOT 自動建立任何 Payment

#### Scenario: 業務先建退款後決定走作廢重開

- **GIVEN** Invoice #1 = 100,000 已開立但金額誤填
- **WHEN** 業務先建立 Payment（amount = -100,000、payment_method = 退款）
- **AND** 業務作廢 Invoice #1，重新開立 Invoice #2（金額正確）
- **THEN** 系統 SHALL 接受兩個獨立動作（退款 Payment、作廢 Invoice）
- **AND** SalesAllowance 不需建立

#### Scenario: 對帳檢視面板分桶顯示收款與退款

- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** Payment 區段 SHALL 分兩桶顯示：
- **AND** 一般收款（payment_method ≠ 退款）：累計正項
- **AND** 退款（payment_method = 退款）：累計負項
- **AND** 收款淨額 SHALL = 一般收款 - |退款|

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止原 v1.2 「雙重身份」設計（`adjustment_phase` 欄位 + UI 「售後服務單」雙重表述）。OrderAdjustment 不再依 Order.status 自動推算 phase，所有 `adjustment_type` 皆可於任何 Order 狀態下選用（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑），無關聯售後 ticket
- **非 NULL**：源自 AfterSalesTicket 內部建立的關聯異動（退款、補印收費）

訂單已完成後（Order.status = 已完成）的售後事件改走 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。業務不再於訂單詳情頁直接建「售後服務單」OrderAdjustment，而是於 AfterSalesTicket 內部建關聯 OrderAdjustment。

OrderAdjustment SHALL 支援多筆明細項（OrderAdjustmentItem 子實體），每筆明細記錄 `item_type`（print_item / fee）、描述、金額。OrderAdjustment.amount 為所有明細金額加總（系統自動計算）。

**[refine-after-sales-refund 既有] 編輯閘門規則**（不動）：

OrderAdjustment 金額編輯閘門按 status 分階段：

| status | 業務可改金額？ | 改後狀態流轉 | 主管動作 |
|--------|--------------|-------------|---------|
| 草稿 | 可（不限次數）| 維持「草稿」 | 無 |
| 待主管審核 | 不可（已送出，待主管動作）| — | 主管核可 / 退回 |
| 已退回 | 可（業務修正後重送）| 改後維持「已退回」直至業務重新送出 → 進入「待主管審核」 | 業務送出後主管重新審核 |
| 已核可 | 可（業務退款前最後校正）| 維持「已核可」（不需重新送審）| 對照欄位即時顯示業務調整 |
| 已執行 | 不可（金錢已實際發生，鎖定）| — | 無 |
| 已取消 | 不可（終態）| — | 無 |

**[refine-after-sales-refund 既有] 主管核可金額對照欄位 + audit log 必欄位**（不動）：

OrderAdjustment 卡片於 `status = 已核可` 時 SHALL 顯示「主管核可金額 vs 當前金額」對照欄位（沿用 refine-after-sales-refund 設計）；金額異動 audit log 必欄位（adjusted_at / adjusted_by / previous_amount / new_amount / status_at_adjustment）沿用。

**[本 change 變更] 「已執行」推進機制 — 從「建立 Payment 自動推進」改為「Payment 切已完成累計達 OA.amount 自動推進」**：

OrderAdjustment 的 `status = 已執行` 推進條件 MODIFY 為：

- 觸發事件：任一關聯 Payment（linkedOrderAdjustmentId = OA.id）從 paymentStatus = '處理中' 切為 '已完成'
- 推進條件：對應 OA 的所有已完成 Payment 累計 amount（含符號比較）= OA.amount
- 推進動作：同 transaction 將 OA.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點

對稱適用退款 OA（amount < 0，配對 paymentMethod = '退款' 的負值 Payment）與補收 OA（amount > 0，配對 paymentMethod ≠ '退款' 的正值 Payment）。詳見 [state-machines spec § 訂單異動狀態機](../state-machines/spec.md)。

**[本 change BREAKING] 棄用「執行 OA 自動建補收 Payment」既有設計**：

既有 spec 對補收 OA（如加印追加 / 加運費 / 急件費）的處理流程（L1719「OrderAdjustment 經核可並執行後系統 SHALL 同步更新 PrintItem.ordered_qty 並建立補收 Payment」、L1734「系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）」）SHALL 廢止。

新設計：所有 OA（退款 + 補收）核可後，由業務於 OA 編輯介面手動建立關聯 Payment（處理中態），補齊資料切「已完成」後自動推進 OA「已執行」。兩條路徑完全對稱。

**Migration 影響**：既有實作中若有「OA 已執行自動建 Payment」邏輯 MUST 移除，相關 UI（如加印追加流程的提示）改為「業務應至 OA 編輯介面建立補收 Payment」。

**[本 change 新增] OA 編輯介面入口（取代既有「建立退款 Payment」按鈕）**：

OrderAdjustment 卡片 / Table row 點「編輯」開啟 OA 編輯 dialog，dialog 內結構：

- 上半：OA 欄位（adjustmentType / amount / reason）依 OA.status 決定可改否
- 下半：關聯 Payment 列表（Table，列出 linkedOrderAdjustmentId = OA.id 的所有 Payment、含 paymentStatus 與金額顯示）
- 下半底部：「新增 Payment」button（僅 OA.status = '已核可' 時可用）
  - OA 為退款型（amount < 0）：自動預填 paymentMethod = '退款'、amount 必須 ≤ 0
  - OA 為補收型（amount > 0）：自動預填 paymentMethod 為非「退款」項（如「銀行轉帳」）、amount 必須 ≥ 0
- 每筆關聯 Payment row 操作欄：「編輯」單一按鈕（點開另一 dialog 編輯該 Payment、含切換 paymentStatus、補齊資料、取消）

OA 編輯介面 SHALL NOT 提供「執行」按鈕（沿用 refine-after-sales-refund 對 UI 入口的處置）。

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
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動
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
- **THEN** 系統 SHALL 自動建立 OrderAdjustment（adjustment_type = `諮詢取消退費`、amount = -1000、status = 已核可、approved_by = system、approved_at = 取消時點）
- **AND** OA 建立 MUST NOT 經過業務 / 主管的 UI 操作
- **AND** OA 於訂單詳情頁顯示為唯讀（業務不可編輯系統內生 type 的 OA）

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（**僅 Payment.paymentStatus = '已完成'**，含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

**[本 change 修訂] 收款淨額公式變動**：

收款淨額公式從「∑ Payment.amount」修訂為「∑ Payment.amount WHERE paymentStatus = '已完成'」。處理中 Payment 不計入收款淨額，避免「業務先填一半即影響對帳數字」。

**[本 change 新增] 處理中 Payment 資訊軸（不計入收款淨額）**：

對帳面板收款淨額卡片內 SHALL 顯示三項 breakdown：

- 已完成一般收款（一般收款 + 補收的已完成 Payment 加總）：+N
- 已完成退款（退款的已完成 Payment 加總絕對值）：-M
- 處理中（合計：含一般收款 / 退款 / 補收的處理中 Payment）：±0（muted 視覺，加 tooltip「不計入收款淨額」）

差額 hint 文字 SHALL 加註：「另含處理中款項 K 元，齊備後將計入」。

語意更新（vs refactor change + refine-after-sales-refund）：原算式 `應收總額 = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)` 已於 refactor change 修訂為 `應收總額 = ∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`；收款淨額本 change 進一步限縮為「只計已完成 Payment」。

#### Scenario: 諮詢來源主訂單對帳通過（已完成 Payment 條件）

- **GIVEN** 主訂單印件費 4000、OrderExtraCharge(consultation_fee, 1000) = 1000、無其他 OrderAdjustment
- **AND** Payment 累計（綁主訂單 AND paymentStatus = '已完成'）= 5000（諮詢費轉移 Payment 1000 + 後續補繳 Payment 4000）
- **AND** Invoice 累計開立 = 5000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 5000，發票淨額 SHALL = 5000，收款淨額 SHALL = 5000，差額 SHALL = 0
- **AND** 面板 SHALL 標記「對帳通過」

#### Scenario: 處理中 Payment 不計入收款淨額

- **GIVEN** 訂單應收 30000、已開發票 30000、已完成 Payment 累計 = 20000、處理中 Payment 累計 = 10000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 20000（僅已完成）
- **AND** 差額 SHALL = 30000 - 30000 - 20000 = -20000（待收 20000）
- **AND** 對帳面板 SHALL 顯示處理中 Payment 資訊軸「處理中 10000（不計入）」
- **AND** 差額 hint 文字 SHALL = 「另含處理中款項 10000 元，齊備後將計入」

#### Scenario: 處理中退款不影響收款淨額

- **GIVEN** 訂單應收 30000、發票 30000、已完成一般收款 30000、處理中退款 Payment 5000
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 SHALL = 30000，發票淨額 SHALL = 30000，收款淨額 SHALL = 30000（處理中退款 -5000 不計入）
- **AND** 差額 SHALL = 0（對帳通過，因處理中退款仍未實際發生）
- **AND** 對帳面板 SHALL 標示「處理中退款 5000（不計入）」

#### Scenario: 諮詢訂單退費對帳通過（已完成退款條件）

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、issue_now 路徑
- **AND** Payment 綁諮詢訂單：諮詢費 1000（已完成）+ 退款 -1000（已完成）= 0
- **AND** Invoice 1000 + SalesAllowance -1000，發票淨額 = 0
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票淨額 = 0、收款淨額 = 0、差額 = 1000

**註**：此情境差額 = 1000 反映「應收沒沖銷」，但實務上退費完成的諮詢訂單視為合法終態。對帳面板 SHALL 標示「退費完成（OrderExtraCharge 與 SalesAllowance / 退款抵銷）」而非「對帳通過」（細節見「諮詢取消對帳邏輯」既有 ADDED Requirement）。

#### Scenario: 訂單異動 + 折讓退款的三方對帳（已完成 Payment 條件）

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000（已執行）、開立發票合計 25,000、確認折讓 -10,000、已完成收款合計 25,000、已完成退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000（5000 + 20,000）、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

---

### Requirement: 會計批次對帳檢視

會計 SHALL 可於後台「對帳檢視」頁批次查詢訂單，依 BillingCompany、開立期間、狀態（對帳通過 / 待對帳）篩選，並匯出對帳清單（含 ERP 訂單編號、藍新 InvoiceTransNo、InvoiceNumber、AllowanceNo、三方金額、差額）供藍新後台對帳使用。

#### Scenario: 會計依帳務公司與期間批次查詢

- **WHEN** 會計於「對帳檢視」頁選擇 BillingCompany = 森紙公司、期間 = 2026-04
- **THEN** 系統 SHALL 列出該期間該帳務公司所有訂單對帳狀態
- **AND** 業務 / 會計 SHALL 可勾選「僅顯示差額 ≠ 0」篩選待對帳訂單

#### Scenario: 會計匯出對帳清單

- **WHEN** 會計於對帳清單點擊「匯出」
- **THEN** 系統 SHALL 匯出 CSV 含 ERP 訂單編號、藍新 ezpay_merchant_order_no、InvoiceTransNo、InvoiceNumber、ezpay_allowance_no、應收 / 發票 / 收款 / 差額

### Requirement: 業務一鍵開發票（user story）

業務 / 諮詢 SHALL 可於訂單詳情頁付款區塊點擊「一鍵開發票」，系統自動帶入買受人資訊（從客戶資料）、訂單金額、商品明細（從訂單印件）。業務確認 / 微調後送出。此為效率優化，不取代手動建立發票流程。

#### Scenario: 業務於訂單詳情頁一鍵開發票

- **WHEN** 業務於訂單詳情頁的「發票」區塊點擊「一鍵開發票」
- **THEN** 系統 SHALL 開啟發票表單，自動帶入買受人（B2B 從客戶 tax_id；B2C 從客戶 name）、發票金額（= 訂單應收總額 - 已開發票淨額）、商品明細（從訂單印件）
- **AND** 業務 SHALL 可微調後送出，呼叫藍新 Mockup

### Requirement: 應收帳款帳齡底層欄位與訂單列表帳齡篩選

系統 SHALL 計算 PaymentPlan 的 derived field `overdue_days`（status ≠ 已收訖 時 = TODAY - scheduled_date；scheduled_date 為空時 = NULL），作為應收帳款帳齡（AR aging）底層基礎。訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 PaymentPlan 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）、逾期自動通知、應收帳款 Dashboard 不在本次範疇。

#### Scenario: PaymentPlan 逾期天數自動計算

- **GIVEN** PaymentPlan #1 status = 未收、scheduled_date = 2026-04-01
- **WHEN** 系統時間為 2026-05-06
- **THEN** PaymentPlan #1.overdue_days SHALL = 35

#### Scenario: 已收訖 PaymentPlan 不算逾期

- **GIVEN** PaymentPlan #1 status = 已收訖、scheduled_date = 2026-04-01
- **WHEN** 系統計算 overdue_days
- **THEN** overdue_days SHALL = NULL（不顯示逾期）

#### Scenario: 訂單列表依最長逾期天數篩選

- **WHEN** 業務 / 主管於訂單列表選擇篩選器「最長逾期天數 ≥ 30 天」
- **THEN** 系統 SHALL 列出所有有 PaymentPlan.overdue_days ≥ 30 的訂單
- **AND** 列表 SHALL 顯示該訂單最長逾期天數欄位

### Requirement: 業務主管批次審核 OrderAdjustment（user story）

業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看所有 status = 待主管審核 的 OrderAdjustment，依負責業務 / adjustment_type / 訂單編號篩選，逐筆核可 / 退回。

#### Scenario: 業務主管查看待審核異動清單

- **WHEN** 業務主管登入後台進入「待審核訂單異動」頁
- **THEN** 系統 SHALL 列出所有 status = 待主管審核 的 OrderAdjustment
- **AND** 主管 SHALL 可依 adjustment_type 篩選

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

#### Scenario: 業務手動加運費

- **WHEN** 業務於主訂單詳情頁點擊「新增其他費用」、選擇 `charge_type = shipping_fee`、填入 amount = 200、description = 「黑貓宅配」
- **THEN** 系統 SHALL 建立 OrderExtraCharge 記錄
- **AND** 主訂單應收總額 SHALL 增加 200

---

### Requirement: Payment 跨實體轉移

系統 SHALL 支援 Payment 從 ConsultationRequest 轉移至 Order 的單向能力，僅限於以下四種觸發情境之一：

1. 諮詢結束選「不做大貨」 → Payment 轉移至新建諮詢訂單
2. 諮詢結束選「做大貨」、需求單成交、業務轉訂單 → Payment 轉移至新建一般訂單
3. 諮詢結束選「做大貨」、需求單流失 → Payment 轉移至新建諮詢訂單
4. 待諮詢取消（退費）→ Payment 轉移至新建諮詢訂單

**轉移動作**：

1. 修改 `Payment.linked_entity_type` 從 `ConsultationRequest` 改為 `Order`
2. 修改 `Payment.linked_entity_id` 為新建訂單 ID
3. 紀錄 `Payment.original_entity_type / original_entity_id` 為原 ConsultationRequest（保留歷史）
4. 設定 `Payment.is_transferred = true`
5. ActivityLog 記錄轉移動作

**轉移後限制**：Payment.is_transferred = true 後 MUST NOT 再次轉移。

**為何僅限 ConsultationRequest → Order 單向**：本 change 範疇內 Payment 轉移只服務於諮詢費四種收尾情境；其他「跨訂單支付調整」走 refactor change 既有的「退款 Payment + SalesAllowance」分離設計。

#### Scenario: 諮詢結束不做大貨 Payment 轉移

- **GIVEN** ConsultationRequest CR-XXX、Payment(linked_entity_type=ConsultationRequest, linked_entity_id=CR-XXX, amount=1000)
- **WHEN** 諮詢人員點擊「結束諮詢 - 不做大貨」、系統建立諮詢訂單 SO-YYY
- **THEN** 系統 SHALL 修改 Payment.linked_entity_type 從 `ConsultationRequest` 改為 `Order`、linked_entity_id 從 CR-XXX 改為 SO-YYY
- **AND** Payment.is_transferred SHALL = true
- **AND** Payment.original_entity_type / original_entity_id MUST 保留 CR-XXX
- **AND** ActivityLog 記錄「Payment 由 ConsultationRequest CR-XXX 轉移至諮詢訂單 SO-YYY」

#### Scenario: 諮詢結束做大貨需求單成交 Payment 轉移至一般訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX（linked_consultation_request_id = CR-XXX）成交
- **WHEN** 業務點擊「轉訂單」、系統建立一般訂單 SO-ZZZ
- **THEN** 系統 SHALL 修改 Payment.linked_entity_id 為 SO-ZZZ、linked_entity_type = Order
- **AND** is_transferred = true

#### Scenario: 需求單流失觸發 Payment 轉移至諮詢訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX 流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單 SO-WWW
- **THEN** 系統 SHALL 將 Payment 轉移至 SO-WWW
- **AND** is_transferred = true

#### Scenario: 已轉移 Payment 不可再次轉移

- **GIVEN** Payment.is_transferred = true
- **WHEN** 系統嘗試再次修改 Payment.linked_entity_id
- **THEN** 系統 MUST 拒絕
- **AND** ActivityLog 記錄拒絕事件

---

### Requirement: 諮詢訂單發票時間點處理

諮詢訂單（`order_type = 諮詢`）的 Invoice **MUST NOT 由系統自動開立**。所有諮詢費 Invoice 統一由諮詢人員於 PlannedInvoice 既有手動轉立流程處理（見 § 諮詢訂單收尾自動建 PlannedInvoice 規則）。

本 change 廢止既有「依 `consultation_invoice_option` 自動開立 Invoice」邏輯：
- `issue_now` 與 `defer_to_main_order` 兩值在任何諮詢訂單收尾情境（不做大貨 / 需求單流失 / 諮詢取消）下，系統 MUST NOT 自動觸發 Invoice 開立
- `consultation_invoice_option` 欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示（不再驅動系統行為）
- 於諮詢結束做大貨 → 需求單成交轉一般訂單情境，諮詢費 PlannedInvoice **不自動建**，業務於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice 並可參考客戶意向決定獨立 / 併入主訂單其他 Invoice

#### Scenario: 諮詢訂單建立時不自動開立 Invoice（任一 invoice_option）

- **GIVEN** ConsultationRequest `consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **AND** 諮詢訂單因任一收尾情境（不做大貨 / 需求單流失 / 諮詢取消）建立
- **WHEN** 系統建立諮詢訂單
- **THEN** 系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance
- **AND** 系統 SHALL 依情境自動建立對應金額的 PlannedInvoice（見 § 諮詢訂單收尾自動建 PlannedInvoice 規則）
- **AND** 諮詢人員 SHALL 後續手動將 PlannedInvoice 轉為實際 Invoice（金額由諮詢人員依客戶需求決定）

#### Scenario: 諮詢結束做大貨主訂單不自動建諮詢費 PlannedInvoice

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立諮詢費的 PlannedInvoice
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice
- **AND** 業務 SHALL 可參考 `consultation_invoice_option` 客戶意向決定獨立 PlannedInvoice 或併入其他主訂單 PlannedInvoice

---

### Requirement: 諮詢訂單收尾自動建 PlannedInvoice 規則

當諮詢訂單於三個收尾情境（不做大貨 / 需求單流失 / 諮詢取消）任一建立時，系統 SHALL 自動建立 PlannedInvoice 1 筆作為「待開發票提醒」，讓諮詢人員於 PendingInvoices 列表頁看到待辦並手動轉為實際 Invoice。

**PlannedInvoice 實體**（Prototype 既有，[src/types/plannedInvoice.ts](../../../sens-erp-prototype/src/types/plannedInvoice.ts)）：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string PK | 主鍵 |
| `orderId` | FK Order | 關聯訂單 |
| `expectedDate` | date | 預計開立日 |
| `scheduledAmount` | decimal | 預計金額（含稅）|
| `description` | string | 描述（如「諮詢費」/「諮詢費（取消退費後）」）|
| `status` | enum | `預計開立` / `已開立` / `已取消` |
| `linkedInvoiceId` | FK Invoice (nullable) | 實際開立 Invoice 的關聯（status = 已開立 時必填）|
| `createdBy` | string | 建立者 user_id 或 `system` |
| `createdAt` | timestamp | 建立時點 |

**狀態機**：
- `預計開立` → `已開立`（諮詢人員手動轉立 Invoice、寫入 linkedInvoiceId）
- `預計開立` → `已取消`（諮詢人員手動取消、寫入 cancelReason）

**自動建立規則**（依諮詢訂單收尾情境）：

| 觸發情境 | scheduledAmount | description | expectedDate |
|---------|-----------------|-------------|--------------|
| 諮詢結束不做大貨（諮詢人員點「結束諮詢 - 不做大貨」）| 2000 | 「諮詢費」 | 完成諮詢時點當天 |
| 諮詢來源需求單流失歸類為不做大貨 | 2000 | 「諮詢費」 | 需求單流失時點當天 |
| 諮詢取消（諮詢人員 / 業務主管點「取消諮詢」並確認）| 1000 | 「諮詢費（取消退費後）」 | 取消時點當天 |

**諮詢結束做大貨 → 需求單成交轉一般訂單情境**：系統 MUST NOT 自動於主訂單建立諮詢費 PlannedInvoice。業務於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice（既有 PlannedInvoice 手動建立流程），可參考 `consultation_invoice_option` 客戶意向決定獨立 / 併入其他 PlannedInvoice。

**共同欄位**：所有自動建立的 PlannedInvoice SHALL 設定 `status = 預計開立`、`createdBy = system`、`linkedInvoiceId = NULL`。

#### Scenario: 諮詢結束不做大貨自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」、系統建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 諮詢來源需求單流失自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、對應需求單流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 流失時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 諮詢取消自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 確認取消、系統建立諮詢訂單 + OA + 退款 Payment
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 自動建立的 PlannedInvoice 出現在 PendingInvoices 待辦列表

- **GIVEN** 諮詢訂單收尾自動建立 PlannedInvoice、status = 預計開立
- **WHEN** 諮詢人員開啟 `/finance/pending-invoices` 列表頁
- **THEN** 列表 SHALL 包含此 PlannedInvoice
- **AND** 列表 SHALL 顯示「今天到期」狀態（`deriveExpectedDateStatus`）以提示諮詢人員優先處理
- **AND** 諮詢人員 SHALL 可點擊進入諮詢訂單詳情頁手動開立 Invoice

#### Scenario: 諮詢人員手動轉立 PlannedInvoice 為 Invoice

- **GIVEN** PlannedInvoice(scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、status = 預計開立)
- **WHEN** 諮詢人員於諮詢訂單詳情頁發票區點「開立」並確認金額
- **THEN** 系統 SHALL 建立 Invoice（金額由諮詢人員確認、預設帶入 PlannedInvoice.scheduledAmount）
- **AND** 系統 SHALL 將 PlannedInvoice.status 改為「已開立」、linkedInvoiceId 寫入新建 Invoice ID
- **AND** PlannedInvoice 從 PendingInvoices 待辦列表移除

#### Scenario: 諮詢結束做大貨需求單成交主訂單不自動建諮詢費 PlannedInvoice

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立 PlannedInvoice
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice

---

### Requirement: 諮詢取消對帳邏輯

諮詢取消（待諮詢狀態半額退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並依新公式計算與標示。

**新對帳公式**：
- 應收總額 = OEC(2000) + ∑(已執行 OA(-1000)) = 1000
- 收款淨額 = Payment(+2000, 已完成) + Payment(-1000, 已完成) = 1000
- 發票淨額 = ∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance（由諮詢人員手動開立、預設目標 1000）
- 差額 = 應收總額 - 發票淨額 - 收款淨額 = 1000 - 發票淨額 - 1000 = -發票淨額

對帳狀態標示規則：
- 退款 Payment 仍處理中（OA 未已執行）：標示「退費處理中」、應收 SHALL 顯示為 2000（OA 未計入）、收款淨額顯示為 2000（含+2000、扣除處理中-1000 = 不計入處理中 Payment 規則，依既有對帳規則）；發票淨額 0 = 預期當下尚未開
- 退款 Payment 已完成（OA 已執行）且發票淨額 = 1000：標示「對帳通過 - 退費完成」
- 退款 Payment 已完成（OA 已執行）且發票淨額 ≠ 1000：標示「待對帳 - 發票金額需確認」、差額由既有對帳警示 banner 提示諮詢人員處理

#### Scenario: 諮詢取消退費完成對帳通過

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已執行) + Payment(+2000, 已完成) + Payment(-1000, 已完成) + Invoice(1000, 已開立)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 1000、差額 SHALL = 0
- **AND** 面板 SHALL 標示「對帳通過 - 退費完成」

#### Scenario: 諮詢取消退費處理中

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已核可) + Payment(+2000, 已完成) + Payment(-1000, 處理中)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 2000（處理中退款 -1000 不計入既有對帳公式）
- **AND** 應收總額 SHALL = 2000（OA 未已執行不計入既有對帳公式）
- **AND** 對帳面板 SHALL 標示「退費處理中」並顯示「另含處理中退款 1000 元」

#### Scenario: 諮詢取消後發票金額不符提示

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(-1000, 已執行) + Payment(+2000) + Payment(-1000, 已完成) + Invoice(2000, 已開立，諮詢人員誤開全額)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 2000、差額 SHALL = -1000
- **AND** 對帳面板 SHALL 標示「待對帳 - 發票金額需確認」
- **AND** 既有對帳警示 banner SHALL 提示諮詢人員開立 SalesAllowance(-1000) 或作廢部分 Invoice

### Requirement: 對帳警示 banner 觸發條件

訂單詳情頁的對帳檢視面板 SHALL 於以下條件成立時顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」：

```
任一 OrderAdjustment 滿足：
  Order.completed_at IS NOT NULL
  AND OrderAdjustment.status = 已執行
  AND OrderAdjustment.executed_at > Order.completed_at
```

觸發條件 SHALL 同時適用於：
- 訂單期間建立但跨期執行的 OrderAdjustment（linked_after_sales_ticket_id IS NULL）
- AfterSalesTicket 內部建立的關聯 OrderAdjustment（linked_after_sales_ticket_id IS NOT NULL）

兩種情境的對帳意義相同（跨完成日的金額異動需重新對帳），不分桶判斷。Order 尚未完成時（completed_at IS NULL），banner 不觸發。

完整對帳警示與三方對帳檢視邏輯延續本 spec § 三方對帳檢視面板 既有定義。

#### Scenario: 訂單期間建立但跨期執行觸發警示

- **GIVEN** OrderAdjustment 建立時 Order.status = 生產中（executed_at 尚未設定）
- **AND** 業務主管核可後 Order 推進至已完成（completed_at = 2026-03-15）
- **WHEN** 業務於 2026-05-06 點擊「執行」（executed_at = 2026-05-06）
- **THEN** 因 executed_at（2026-05-06）> completed_at（2026-03-15），對帳檢視面板 SHALL 顯示警示 banner
- **AND** banner 文字 SHALL = 「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行，請會計確認原月結紀錄」

#### Scenario: AfterSalesTicket 關聯 OrderAdjustment 執行觸發警示

- **GIVEN** Order.completed_at = 2026-03-15、AfterSalesTicket AS-001 已建立、resolution = 退款
- **WHEN** 業務於 ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=AS-001, amount=-5000) 並執行於 2026-05-06
- **THEN** 對帳檢視面板 SHALL 顯示警示 banner（與訂單期間建立的 OA 處理方式相同）

#### Scenario: 訂單未完成時不觸發警示

- **GIVEN** OrderAdjustment 已執行（executed_at = 2026-05-06）
- **AND** Order.completed_at IS NULL（尚未完成）
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 系統 SHALL NOT 顯示警示 banner

### Requirement: OrderExtraCharge vs OrderAdjustment.fee 時間邊界

`OrderExtraCharge` SHALL 限於「訂單成立時即確定」的費用使用，定義為訂單建立至「訂單確認」狀態之間（含）的費用記錄。訂單成立後（進入「報價待回簽」之後）新增的費用 SHALL 走 `OrderAdjustment` 的 `item_type = fee` 明細，即使費用類型相同（如後加運費）。

時間邊界明確：

- 訂單建立時 / 報價評估階段 → 業務可新增 OrderExtraCharge（運費 / 急件費等）
- 訂單進入「報價待回簽」之後 → OrderExtraCharge 凍結，不可新增；業務需走 OrderAdjustment

UI SHALL 在訂單已成立後隱藏「新增 OrderExtraCharge」按鈕，引導業務走 OrderAdjustment 流程。系統 SHALL 在 API 層拒絕訂單成立後的 OrderExtraCharge 寫入請求。

#### Scenario: 業務於訂單成立前加運費走 OrderExtraCharge

- **GIVEN** 訂單 SO-001 處於「報價評估」階段
- **WHEN** 業務新增 200 元運費
- **THEN** 系統 SHALL 建立 OrderExtraCharge(charge_type = shipping_fee, amount = 200)
- **AND** 不需業務主管審核

#### Scenario: 業務於訂單成立後加運費走 OrderAdjustment

- **GIVEN** 訂單 SO-001 處於「生產中」階段
- **WHEN** 業務發現需要補收 200 元運費
- **THEN** UI SHALL 隱藏「新增 OrderExtraCharge」按鈕
- **AND** 業務 SHALL 建立 OrderAdjustment(adjustment_type = 加運費，明細：item_type = fee，amount = 200)
- **AND** 該 OrderAdjustment 走業務主管審核流程

#### Scenario: API 拒絕訂單成立後新增 OrderExtraCharge

- **GIVEN** 訂單 SO-001 處於「報價待回簽」之後狀態
- **WHEN** 系統收到 OrderExtraCharge 寫入請求
- **THEN** 系統 SHALL 拒絕並回傳 400 錯誤
- **AND** 錯誤訊息 SHALL 為「訂單已成立，新增費用請走訂單異動單流程」

---

### Requirement: 訂單聯絡人

訂單 SHALL 帶單一窗口聯絡人（`Order.contact_id` FK → 廠客模組聯絡人主檔）。線下單於成交轉訂單時自動帶入需求單指定的窗口聯絡人；線上單由 EC 帶入後不可編輯（廠客 / EC CRM 無連動）。

廠客模組的「公司抬頭統編 + 多窗口聯絡人」兩層結構不在訂單層複現，訂單僅指向其中一個窗口的 contact_id。

#### Scenario: 線下單成交轉訂單帶入聯絡人

- **GIVEN** 需求單 QR-001 已指定窗口聯絡人 contact_id = C-100
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 將 Order.contact_id 設為 C-100
- **AND** 訂單詳情頁 SHALL 顯示該聯絡人的姓名 / 電話 / Email

#### Scenario: 業務變更訂單聯絡人

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽、contact_id = C-100
- **WHEN** 業務於訂單詳情頁切換聯絡人至 C-101（同客戶下的另一窗口）
- **THEN** 系統 SHALL 更新 Order.contact_id = C-101
- **AND** ActivityLog MUST 記錄聯絡人變更（舊值 / 新值 / 操作人 / 時間）

#### Scenario: 線上單聯絡人不可編輯

- **GIVEN** 訂單為線上單（order_source ∈ {線上, 線上自定義}）
- **WHEN** 業務嘗試於訂單詳情頁切換聯絡人
- **THEN** 系統 SHALL 禁用聯絡人切換 UI（唯讀），原因提示「線上單聯絡資料由 EC 帶入，ERP 廠客與 EC CRM 未連動」

---

### Requirement: 訂單備註三類分欄

訂單 SHALL 將備註拆為三個獨立欄位：

| 欄位 | 適用 | 用途 |
|------|------|------|
| `customer_note` | 僅線上單 | EC 前台購物車客戶下單時填寫的備註 |
| `internal_note` | 線上 / 線下皆有 | 內部員工備註，客戶不可見 |
| `production_note` | 僅線下單 | 訂單製作備註（製作 / 交易 / 出貨備註的彙整） |

UI 上 SHALL 依 order_source 條件顯示適用欄位，避免業務混淆。

#### Scenario: 線上單顯示客戶端備註

- **WHEN** 訂單為線上單
- **THEN** 訂單詳情頁 SHALL 顯示 `customer_note`（唯讀，自 EC 帶入）與 `internal_note`（可編輯）
- **AND** MUST NOT 顯示 `production_note`

#### Scenario: 線下單顯示製作備註

- **WHEN** 訂單為線下單
- **THEN** 訂單詳情頁 SHALL 顯示 `internal_note`（可編輯）與 `production_note`（可編輯）
- **AND** MUST NOT 顯示 `customer_note`

#### Scenario: 內部備註客戶端不可見

- **WHEN** EC 前台或任何客戶端介面查詢訂單
- **THEN** 系統 MUST NOT 暴露 `internal_note` 內容

---

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

**顯示規則（採業界 ERP / MES 模式 A1：頂部 Info Banner + 分項 ErpTable 四欄 + 底部 summary 水平 4 欄；2026-05-26 對齊 Figma 9030:317559 更新底部 summary 為水平 4 欄）：**

訂單詳情頁「金額及付款狀態」Tab 內的「金額組成」區塊 SHALL 採以下結構，**取代原本「主從欄位（線下單主未稅、線上單主含稅）」動態切換邏輯**：

- **頂部 Info Banner**：灰底 `bg-muted` (#f7f7f7) + `rounded-[8px]` + `p-2` + `Info` icon + 說明文字「訂單金額來源拆解；分項區雙欄並列（未稅 / 含稅），底部彙總含應收總額。對齊業界 ERP / MES 模式（SAP / NetSuite / Odoo / Dynamics 365）。」

- **分項區**：ErpTableCard + `.erp-table` 結構，四欄如下：
  | 順位 | 欄位 | 對齊 | 說明 |
  |------|------|------|------|
  | 1 | 分項名稱 | 左 | 商品 / 運費 / 急件費 / 諮詢費 / 其他費用 / 折抵 / 紅利 / 訂單異動 |
  | 2 | 數量 / 說明 | 中 | 商品 row 顯示「N 個印件」；其他 row 顯示來源摘要（如「OrderExtraCharge × N」）|
  | 3 | 小計（未稅） | 右 | 該分項的未稅金額 |
  | 4 | 小計（含稅） | 右 + text-muted-foreground | 該分項的含稅金額（弱化呈現） |

  - 折抵 / 紅利 / 負值異動 row：金額前綴 `−` + `text-destructive`
  - 待審核異動 row：金額欄改顯「待核可」chip + tooltip
  - 空值分項 row：`text-muted-foreground` 弱化（保留視覺平衡）

- **底部 summary 水平 4 欄**（分項表格下方水平並列，每欄內 label 上 / value 下）：
  | 順位 | 欄位 | flex | value 字級 | 說明 |
  |------|------|------|-----------|------|
  | 1 | 付款狀態 | flex-1 | PaymentStatusBadge | 從分項區移出至此欄 |
  | 2 | 小計（未稅）| flex-1 | text-base font-medium | 全分項未稅累計 |
  | 3 | 營業稅 5% | flex-1 | text-base font-medium | 全分項稅額累計 |
  | 4 | = 應收總額（含稅）| shrink-0 | text-[28px] font-bold leading-8 tracking-[-0.28px] | 主視覺強調，MUST NOT 品牌色 |

  - 外層 wrapper：`flex items-center gap-3 w-full`
  - 前 3 欄 cell：`flex flex-1 flex-col gap-2 px-2 min-w-0 min-h-[86px]`
  - 應收總額欄 cell：`flex flex-col gap-2 px-2 shrink-0 min-h-[86px]`
  - 每欄 label：`text-sm font-medium text-muted-foreground leading-5`
  - SHALL NOT 改為垂直 stack（偏離 Figma 設計、損失 KPI 對照效率）

- 應收總額 SHALL 使用 `text-[28px] font-bold text-foreground leading-8 tracking-[-0.28px]`（對齊 Figma 28px Bold），MUST NOT 使用品牌色（primary / emerald 等飽和色），對齊 DESIGN.md「金額本身不適合用品牌色搶視覺」原則。

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

- **WHEN** 業務開啟訂單詳情頁「金額及付款狀態」Tab
- **THEN** 「金額組成」區塊分項區 SHALL 採 ErpTable 四欄結構（分項名稱 / 數量摘要 / 未稅小計 / 含稅小計）
- **AND** 含稅小計欄 SHALL 採 `text-muted-foreground` 弱化呈現（與未稅小計欄並列但非主視覺焦點）
- **AND** 線下單與線上單顯示結構 SHALL 一致（不再依 order_source 動態切換主從）

#### Scenario: 金額組成 summary 水平 4 欄

- **WHEN** 業務查看金額組成區塊底部
- **THEN** SHALL 顯示水平 4 欄並列：付款狀態 / 小計（未稅）/ 營業稅 5% / = 應收總額（含稅）
- **AND** 每欄內 label SHALL 在上、value 在下（垂直堆疊）
- **AND** 前 3 欄 SHALL 採 `flex-1` 平分寬度、應收總額欄 SHALL 採 `shrink-0` 自然寬度
- **AND** 應收總額 value SHALL 使用 `text-[28px] font-bold text-foreground tracking-[-0.28px]`（對齊 Figma 9030:317559 28px Bold）
- **AND** 應收總額 MUST NOT 使用品牌色（primary / emerald 等飽和色）

#### Scenario: 金額組成頂部 Info Banner

- **WHEN** 業務開啟金額組成區塊
- **THEN** SHALL 在分項表格上方顯示頂部 Info Banner（灰底 `bg-muted` (#f7f7f7) + `rounded-[8px]` + `p-2` + `Info` icon + 業界 ERP / MES 對齊說明文字）

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

---

### Requirement: 訂單類型 enum 範圍

`Order.order_type` SHALL 僅採以下 enum 值：

- `一般`：線下 / 線上一般訂單，需處理印件與出貨
- `諮詢`：諮詢訂單（不需印製，詳見 [consultation-request spec](../consultation-request/spec.md)）
- `點數`：EC 會員儲值訂單

月結訂單（EC 月結單）/ 訂閱制訂單不在 Phase 1 / 2 / 3 範圍。

`Order.order_source` SHALL 採以下 enum 值：`線下` / `線上` / `線上自定義`。

#### Scenario: 系統拒絕不在 enum 內的訂單類型

- **WHEN** 任何來源（API / Prototype / 資料遷移）嘗試建立 order_type = `月結` 或 `訂閱` 的訂單
- **THEN** 系統 SHALL 拒絕並回報「訂單類型不在 Phase 1 / 2 / 3 範圍」

---

### Requirement: 印件單位與難易度於訂單階段可編輯

`PrintItem.unit` 與 `PrintItem.difficulty_level` 於訂單階段 SHALL 為「自動帶入（可編輯）」：

- 線下單：自需求單繼承
- 線上單：自 EC 商品主檔繼承
- 業務於訂單階段（依本 spec § 訂單階段印件規格編輯時機規範）SHALL 可手動覆寫
- 覆寫 SHALL 記錄於 ActivityLog（舊值 / 新值 / 操作人 / 時間）

#### Scenario: 業務調整印件單位

- **GIVEN** 印件 PI-001 自需求單帶入 unit = 「冊」、訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁將 unit 改為 「式」
- **THEN** 系統 SHALL 更新 PrintItem.unit = 「式」
- **AND** ActivityLog MUST 記錄變更

#### Scenario: 業務調整印件難易度

- **GIVEN** 印件 PI-001 自需求單帶入 difficulty_level = 5、訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁將 difficulty_level 改為 7
- **THEN** 系統 SHALL 更新 PrintItem.difficulty_level = 7
- **AND** ActivityLog MUST 記錄變更（包含繼承來源值 5 與新值 7）

---

### Requirement: Invoice Data Model 與 ezpay 連結

訂單發票 SHALL 透過藍新（NewebPay / ezPay）電子發票平台開立。Invoice 子實體欄位定義如下（資料模型詳見本 spec § Data Model）：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `category` | Y | 發票種類：B2B / B2C |
| `buyer_name` | Y | 買受人名稱 |
| `buyer_ubn` | Y（B2B）| 買方統一編號（B2C 留空）|
| `buyer_address` | N | 買受人地址 |
| `buyer_email` | N | 發票寄送信箱 |
| `carrier_type` | N | 載具類別（B2C 適用）|
| `carrier_num` | N | 載具編號 |
| `tax_type` | Y | 課稅別：應稅 / 零稅率 / 免稅 |
| `tax_rate` | Y（auto）| 稅率，依 tax_type 自動帶入 |
| `sales_amount` | Y（auto）| 銷售額（未稅，自動計算）|
| `tax_amount` | Y（auto）| 稅額（自動計算）|
| `total_amount` | Y | 發票金額（含稅），業務可微調 |
| `items` | Y | 商品明細，自訂單印件帶入可編輯 |
| `comment` | N | 發票備註 |
| `status` | Y | 開立 / 作廢 |
| `invoice_number` | Y（藍新回傳）| 財政部核發的發票號碼 |
| `invalid_reason` | Y（作廢時）| 作廢原因，限中文 6 字或英文 20 字 |
| `ezpay_invoice_url` | Y（derived）| 藍新平台單張發票的連結 URL，呼叫藍新 API 取得，業務可從訂單詳情頁直接開啟下載 PDF |
| `folded` | Y（derived）| 此張發票已確認折讓的金額合計（∑ 已確認折讓單金額絕對值，排除已作廢）|
| `remaining` | Y（derived）| 此張發票尚可開立折讓的金額上限（= 發票金額 − 折讓累計）|
| `allowance_label` | Y（derived）| 折讓衍生標示，依折讓累計即時計算 |

Invoice MUST NOT 包含 `print_flag`（索取紙本）欄位；客戶 SHALL 統一至 ezpay 自行下載 PDF；業務若需代客寄信 / 列印，從 `ezpay_invoice_url` 開啟。

#### Scenario: 業務從訂單詳情頁開啟 ezpay 發票連結

- **GIVEN** 訂單 SO-001 已開立發票 INV-001、藍新已回傳 invoice_number
- **WHEN** 業務於訂單詳情頁的發票區點擊「下載發票」
- **THEN** 系統 SHALL 呼叫藍新 API 取得 `ezpay_invoice_url`
- **AND** 系統 SHALL 於新分頁開啟連結，供業務下載 PDF 或寄送客戶

#### Scenario: 客戶端不暴露索取紙本選項

- **WHEN** 任何客戶端介面（EC 前台、訂單確認 email、客戶查詢頁）顯示發票
- **THEN** 系統 MUST NOT 提供「索取紙本」選項
- **AND** SHALL 提供 ezpay 平台連結供客戶自行下載

---

### Requirement: SalesAllowanceFile 折讓回簽附件

每筆 SalesAllowance SHALL 支援多檔回簽檔案上傳，透過子表 `SalesAllowanceFile` 儲存。檔案用途包含：用印折讓單 PDF、客戶端折讓證明、其他補充文件。

`SalesAllowanceFile` 欄位：

| 欄位 | 型別 | 必填 | 唯讀 | 說明 |
|------|------|------|------|------|
| id | UUID | Y | Y | 主鍵 |
| sales_allowance_id | FK | Y | Y | FK → SalesAllowance |
| filename | 字串 | Y | | |
| file_url | 字串 | Y | Y | |
| file_size_kb | 整數 | Y | Y | |
| file_type | 字串 | Y | | MIME type（如 application/pdf, image/jpeg）|
| uploaded_by | FK | Y | Y | FK → 使用者 |
| uploaded_at | 日期時間 | Y | Y | |

業務 SHALL 可於折讓單詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次上傳 / 刪除動作。

#### Scenario: 業務上傳折讓單回簽檔

- **GIVEN** SalesAllowance SA-001 狀態 = 已確認、折讓金額 = -3,000
- **WHEN** 業務於折讓單詳情頁上傳「用印折讓單.pdf」
- **THEN** 系統 SHALL 建立 SalesAllowanceFile 紀錄
- **AND** 折讓單詳情頁 SHALL 顯示已上傳的檔案清單
- **AND** ActivityLog MUST 記錄上傳

#### Scenario: 業務上傳多份回簽檔案

- **GIVEN** SalesAllowance SA-001 已上傳「用印折讓單.pdf」
- **WHEN** 業務再上傳「客戶折讓證明.jpg」
- **THEN** 系統 SHALL 建立第二筆 SalesAllowanceFile 紀錄
- **AND** 兩筆檔案 SHALL 並列顯示

---

### Requirement: PaymentFile 收款對帳附件

每筆 Payment SHALL 支援多檔對帳檔案上傳，透過子表 `PaymentFile` 儲存。檔案用途包含：對帳截圖、收據照片、匯款信 PDF、第三方付款證明。

`PaymentFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `payment_id`）。

業務 SHALL 可於收款記錄詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次動作。

#### Scenario: 業務上傳收款對帳截圖

- **GIVEN** Payment P-001 狀態 = 已收訖、金額 = 30,000
- **WHEN** 業務上傳「銀行對帳截圖.png」
- **THEN** 系統 SHALL 建立 PaymentFile 紀錄
- **AND** 收款記錄 SHALL 顯示已上傳的檔案清單

---

### Requirement: OrderSignedFile 訂單回簽附件

每筆訂單 SHALL 支援多檔回簽檔案上傳，透過子表 `OrderSignedFile` 儲存。檔案用途為客戶印 / 簽名後回傳的報價 / 訂單確認文件。

`OrderSignedFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `order_id`）。

上傳至少一份 OrderSignedFile SHALL 觸發訂單狀態自動推進（詳見 § 訂單確認觸發），並寫入 `Order.signed_at` = 第一份上傳完成時間。

#### Scenario: 業務上傳回簽檔案觸發狀態推進

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

---

### Requirement: 內部製作截止日定義

系統 SHALL 將 `Order.internal_complete_date` 定義為內部出貨端寄出日期，預設值為 `delivery_date − 1 day`（客戶預計收件日的前一天）。

業務或印務 SHALL 可手動覆寫此預設值；ActivityLog MUST 記錄覆寫紀錄。

棄用欄位提示：原「工單印件完成時間」（位於工單層）已棄用，不再作為內部完工日期判斷依據；統一以本欄位作為印務與出貨溝通的時間基準。

#### Scenario: 系統依交期推算內部製作截止日

- **GIVEN** 訂單 SO-001 delivery_date = 2026-06-10、internal_complete_date 為空
- **WHEN** 業務儲存訂單
- **THEN** 系統 SHALL 自動寫入 Order.internal_complete_date = 2026-06-09

#### Scenario: 業務手動覆寫內部製作截止日

- **GIVEN** 訂單 SO-001 系統預設 internal_complete_date = 2026-06-09
- **WHEN** 業務手動改為 2026-06-08
- **THEN** 系統 SHALL 更新 Order.internal_complete_date = 2026-06-08
- **AND** ActivityLog MUST 記錄覆寫（系統預設值 / 業務覆寫值 / 操作人 / 時間）

---

### Requirement: 訂單金額 Data Model 雙欄擴充

Order Data Model 金額相關欄位 SHALL 同時包含 `_with_tax` 與 `_without_tax` 兩個基準的儲存：

| 業務語義 | 含稅欄位（既有保留）| 未稅欄位（新增）|
|---------|-------------------|----------------|
| 商品小計 | `subtotal_with_tax` | `subtotal_without_tax` |
| 其他費用小計 | `other_fee_with_tax` | `other_fee_without_tax` |
| 運費 | `shipping_fee_with_tax` | `shipping_fee_without_tax` |
| 諮詢費 | `consult_fee_with_tax` | `consult_fee_without_tax` |
| 折扣金額 | `discount_amount`（含稅）| `discount_without_tax` |
| 訂單總額 | `total_with_tax` | `total_without_tax` |
| 稅額 | — | `tax_amount`（= total_with_tax − total_without_tax）|

新增欄位 type 為 Decimal(12,2)，必填，預設 0；既有 `_with_tax` 欄位定義不變更。

OrderAdjustment.amount 與 OrderExtraCharge.amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

SalesAllowance.allowance_amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

Payment.amount 不拆雙欄（實際收款金額為含稅實收）。

#### Scenario: 既有訂單未稅欄位回填

- **GIVEN** 既有 Order 資料的 `_with_tax` 欄位有值、`_without_tax` 欄位為空
- **WHEN** 資料遷移腳本執行
- **THEN** 系統 SHALL 計算 `_without_tax = round(_with_tax / 1.05)` 並寫入
- **AND** 系統 SHALL 計算 `tax_amount = total_with_tax − total_without_tax` 並寫入

### Requirement: 訂單詳情頁售後服務 Tab 入口

訂單詳情頁 SHALL 新增「售後服務」Tab，顯示訂單關聯的 AfterSalesTicket 列表與「建立售後服務單」按鈕。Tab 的具體 UI 與行為見 [after-sales-ticket spec § 訂單詳情頁售後服務 Tab](../after-sales-ticket/spec.md)。

訂單列表 SHALL 新增「售後」欄位，依關聯 AfterSalesTicket 狀態推導徽章（無 / 售後處理中 / 售後逾期 / 售後已結案）。具體規格見 [after-sales-ticket spec § 訂單列表售後狀態欄位與篩選器](../after-sales-ticket/spec.md)。

#### Scenario: 訂單詳情頁切換到售後服務 Tab

- **GIVEN** Order.status = 已完成
- **WHEN** 業務於訂單詳情頁切到「售後服務」Tab
- **THEN** Tab 內容 SHALL 顯示訂單關聯的 AfterSalesTicket 列表或建單入口
- **AND** 詳細行為見 [after-sales-ticket spec § 訂單詳情頁售後服務 Tab](../after-sales-ticket/spec.md)

### Requirement: 印件詳情頁工單與生產任務區塊

系統 SHALL 在印件詳情頁新增「工單與生產任務」區塊，呈現該印件下所有工單與其下生產任務的進度，作為印務追蹤跨工單印件狀況的戰情室視角。

區塊 SHALL 包含以下呈現規則：
- 依工單分組（預設展開）：每組顯示工單編號、工單負責印務、工單狀態
- 工單下列出所有生產任務，每筆 SHALL 顯示以下齊套性視圖欄位（與 work-order spec § 工單詳情頁印件區塊三欄一致）：
  - 預計數量（pt_target_qty）
  - 完成數量（pt_produced_qty，累計報工數）
  - 入庫數量（pt_warehouse_qty，QC 通過後依齊套性邏輯計算結果）
  - QC 狀態徽章（最近一次 QC 結果：通過 / 不合格 / 未檢；多筆 QC 時取最新一筆）
  - 生產任務狀態（依 state-machines spec）
- 跨工單可見性：印件下所有工單與生產任務資訊 SHALL 對開啟此頁的印務 / 印務主管完整可見，不因工單負責人不同而隱藏
- 進度呈現方式：採用印製狀態詞（state-machines spec § 印件狀態機 / 工單狀態機 / 生產任務狀態機所定義），不另計算百分比或總任務完成數

齊套性視圖目的：讓使用者透過介面直接看到「預計 → 完成 → 入庫」三欄的數字流向，搭配狀態機 bubble-up 規則（state-machines spec），印務 SHALL 可判讀印件層的齊套性與瓶頸所在。

#### Scenario: 印務開啟印件詳情頁查看工單與生產任務區塊

- **WHEN** 印務從印件總覽（`/work-orders/print-items`）點擊一筆印件進入詳情頁
- **THEN** 系統 SHALL 顯示「工單與生產任務」區塊
- **AND** 區塊 SHALL 依工單分組列出該印件下所有工單
- **AND** 每個工單組 SHALL 顯示工單編號、負責印務、工單狀態
- **AND** 各工單下 SHALL 列出所屬生產任務的編號、工序、預計數量、完成數量、入庫數量、QC 狀態徽章、生產任務狀態

#### Scenario: 跨印務印件呈現他人負責工單

- **WHEN** 印件 B 同時包含工單 #3（印務甲負責）與工單 #4（印務乙負責），印務甲開啟印件 B 詳情頁
- **THEN** 「工單與生產任務」區塊 SHALL 同時顯示工單 #3 與工單 #4 的所有資訊
- **AND** 工單 #4 下的生產任務 SHALL 顯示完整明細（編號、工序、預計 / 完成 / 入庫數量、QC 狀態、生產任務狀態）
- **AND** 工單 #4 下的生產任務 MUST NOT 提供報工操作入口（依 user-roles spec 規則）

#### Scenario: 進度以狀態詞 + 齊套性三欄呈現

- **WHEN** 印務在印件詳情頁查看工單與生產任務區塊
- **THEN** 印件層級 SHALL 顯示印件印製狀態（依 state-machines spec § 印件狀態機）
- **AND** 工單層級 SHALL 顯示工單狀態
- **AND** 生產任務層級 SHALL 顯示生產任務狀態 + 預計 / 完成 / 入庫三欄數字 + QC 狀態徽章
- **AND** 系統 MUST NOT 顯示百分比或聚合完成度數字

#### Scenario: 已完成生產任務的 QC 失敗顯示

- **WHEN** 工單 #3 的 PT-6 印刷已報工完成數量達到目標數量（pt_produced_qty == pt_target_qty）但 QC 抽檢出 200 張不合格
- **THEN** 印件詳情頁 SHALL 在 PT-6 列顯示完成數 1000、入庫數 800、QC 狀態徽章「不合格」
- **AND** 印務 SHALL 可從齊套性三欄差距（完成 1000 - 入庫 800 = 200）判讀重印缺口

### Requirement: 印件詳情頁批次報工入口

系統 SHALL 在印件詳情頁「工單與生產任務」區塊提供批次報工操作。批次報工 SHALL 重用工單詳情頁既有的批次報工元件，且權限守門依「工單負責人」規則執行。

#### Scenario: 印務批次選取自己負責工單下的生產任務

- **WHEN** 印務甲在印件 B 詳情頁勾選工單 #3（自己負責）下的 PT-6、PT-9 兩筆生產任務，點擊「批次報工」
- **THEN** 系統 SHALL 開啟批次報工面板（重用工單詳情頁元件）
- **AND** 面板中每筆生產任務 SHALL 標示其所屬工單編號，避免報錯
- **AND** 提交後 SHALL 為每筆生產任務各建立一筆 ProductionTaskWorkRecord（依 production-task spec § 批次報工操作）

#### Scenario: 非自己負責工單下的生產任務勾選框禁用

- **WHEN** 印務甲在印件 B 詳情頁查看工單 #4（印務乙負責）下的生產任務
- **THEN** 該批次報工勾選框 MUST 為禁用狀態
- **AND** 系統 SHALL 提供禁用原因提示（hover / 標籤）：「此工單由其他印務負責，無法在此報工」

#### Scenario: 單筆報工入口

- **WHEN** 印務甲在印件詳情頁某筆自己負責工單下的生產任務點擊「報工」按鈕
- **THEN** 系統 SHALL 開啟單筆報工面板（重用工單詳情頁元件）
- **AND** 面板 SHALL 顯示該生產任務所屬工單編號

### Requirement: 印件狀態讀取路徑統一

印件總覽列表與印件詳情頁顯示的印件印製狀態 MUST 來自同一讀取路徑（同一查詢函式或同一 cache 來源），確保兩處顯示一致。

任一處狀態變更（例如生產任務報工觸發 bubble-up）後，兩處 SHALL 在合理延遲內（同一交易週期內）顯示同步結果，MUST NOT 出現「總覽顯示等待中、詳情顯示製作中」的不一致情境。

#### Scenario: 印件狀態變更後兩處同步

- **WHEN** 某印件下首筆生產任務報工觸發狀態 bubble-up，印件印製狀態從「等待中」變為「製作中」
- **THEN** 印件總覽列表 SHALL 顯示「製作中」
- **AND** 印件詳情頁同步顯示「製作中」
- **AND** 兩處狀態 MUST NOT 不一致

### Requirement: 訂單詳情頁印件區「印件類型」欄位

訂單詳情頁印件區的印件表格 SHALL 新增「印件類型」欄位，呈現規範依 [prototype-shared-ui spec § 列表頁印件類型欄位通用設計](../prototype-shared-ui/spec.md)。補印與大貨印件混合排列、**不獨立分組**，靠欄位內 `PrintItemTypeLabel` 標籤識別。

訂單詳情頁印件區屬同訂單下印件總表，數量有限，**不需要 filter**（避免干擾），但欄位 MUST 顯示。

#### Scenario: 訂單詳情頁印件區三值同表呈現

- **GIVEN** 訂單 SO-001 有 4 筆印件：2 筆大貨（PI-001 / PI-002）、2 筆補印（PI-003 / PI-004，來自 AS-001）
- **WHEN** 業務 / 印務 / 主管打開 SO-001 訂單詳情頁的印件區
- **THEN** 4 筆印件 SHALL 在同一張表格內呈現（按印件編號排序）
- **AND** 每筆印件 SHALL 在「印件類型」欄位顯示對應的 `PrintItemTypeLabel`
- **AND** 補印印件 SHALL NOT 被獨立分組 / 加分隔線 / 加區塊標題
- **AND** 補印印件的標籤 SHALL 可點擊跳轉 ticket AS-001

### Requirement: 訂單詳情頁訂單備註 section

訂單詳情頁的「資訊 Tab」SHALL 新增「訂單備註」section，容納三個 free-text 欄位：`order_note`（訂單備註）、`delivery_note`（交貨備註）、`payment_note`（付款備註），由業務 / 諮詢在訂單階段填寫對客戶說明的標準化條款。

此 section 與既有「訂單備註三類分欄」Requirement（`customer_note` / `internal_note` / `production_note`）並存：
- **既有三類**：按「來源／可見性」分（員工內部紀錄、客戶不可見）
- **新三類**：按「業務主題」分（訂單條件 / 交貨條件 / 付款條件，供後續匯出至客戶文件）

每個新欄位的 textarea label 列右側 SHALL 顯示「插入常用備註」按鈕，觸發 [NoteTemplatePopover](../prototype-shared-ui/spec.md) 共用元件，業務可多選 seed 模板組合插入備註尾端。

#### Scenario: 訂單詳情頁顯示訂單備註 section

- **GIVEN** 訂單 status >= 訂單建立
- **WHEN** 業務開啟訂單詳情頁切到「資訊 Tab」
- **THEN** 資訊 Tab SHALL 顯示「訂單備註」section
- **AND** section 內 SHALL 包含三個 textarea，UI label 為「訂單須知 / 交貨備註 / 付款備註」（對應 `order_note` / `delivery_note` / `payment_note`）
- **AND** 每個 textarea label 列右側 SHALL 顯示「插入常用備註」按鈕
- **AND** section 標題下方 SHALL 顯示副標題「訂單階段對客戶說明的標準化條款（訂單／交貨／付款）」

#### Scenario: 既有訂單備註 section 與新 section 視覺分組

- **GIVEN** 訂單詳情頁同時顯示既有「訂單備註三類分欄」與新「訂單備註」section
- **THEN** 兩個 section SHALL 在視覺上明確分組（不同 section title、不同位置）
- **AND** 新「訂單備註」section MUST 位於既有「訂單資訊卡」下方
- **AND** 既有 customer_note / internal_note / production_note 區塊保持原有條件顯示邏輯（依 order_source 決定可見性）

#### Scenario: 點 section 「編輯」按鈕開啟 OrderNotesEditDialog

- **GIVEN** 訂單未完成（completed_at IS NULL）且使用者具編輯權限
- **WHEN** 業務點訂單備註 section header 右上的「編輯」按鈕
- **THEN** 系統 SHALL 開啟獨立的 `OrderNotesEditDialog`（不沿用既有 `OrderInfoEditDialog`，原因見 [ORD-014](../../../memory/erp/ERP_Vault/08-open-questions/ORD-014-訂單備註與訂單資訊編輯dialog分開.md)）
- **AND** Dialog 內 SHALL 包含三個 textarea（訂單備註 / 交貨備註 / 付款備註）並預填當前 Order 對應欄位值
- **AND** 每個 textarea label 列右側 SHALL 顯示「插入常用備註」按鈕（NoteTemplatePopover）+ 字數計數
- **AND** 業務 SHALL 可同時編輯多個欄位後一次儲存
- **AND** 點儲存後 SHALL 寫入 store（updateOrder）+ 顯示 Toast「訂單備註已更新」+ 加入 ActivityLog
- **AND** Section body SHALL 為 read-only 顯示（label + 多行文字塊，空值顯示「尚未填寫」）；編輯動作一律走 dialog

### Requirement: 訂單階段訂單備註編輯權限與時機

訂單階段新增的三個備註欄位（`order_note` / `delivery_note` / `payment_note`）SHALL 由以下角色可編輯：

| 角色 | 編輯權限 |
|------|---------|
| 業務（訂單 sales_id 對應） | 可編輯 |
| 諮詢 | 可編輯（諮詢轉訂單後仍可補充） |
| 業務主管 | 可編輯（代編場景） |
| 訂單管理人 | 可編輯（進度追蹤時補充客戶溝通記錄） |
| 其他角色（印務 / 出貨 / 會計） | 唯讀 |

編輯時機 SHALL 遵守以下規則：

- 訂單成立後（status >= 訂單建立）且訂單未完成（`completed_at IS NULL`）：三個欄位皆可編輯
- 訂單已完成（`completed_at IS NOT NULL`）：三個欄位 SHALL 鎖定為唯讀，避免訂單結算後改備註影響歷史對帳

對應「插入常用備註」按鈕 SHALL 與 textarea 編輯權限同步（textarea 唯讀時按鈕 disabled）。

#### Scenario: 業務於訂單未完成階段編輯訂單備註

- **GIVEN** Order.status = 製作等待中
- **AND** Order.completed_at IS NULL
- **AND** 使用者為訂單 sales_id 對應的業務
- **WHEN** 業務點訂單備註 section 右上「編輯」按鈕並於 dialog 內修改
- **THEN** 系統 SHALL 允許編輯並於儲存後寫入

#### Scenario: 訂單完成後鎖定訂單備註

- **GIVEN** Order.completed_at IS NOT NULL
- **WHEN** 業務於訂單詳情頁查看訂單備註 section
- **THEN** Section header 右上的「編輯」按鈕 SHALL disabled
- **AND** Section header 右側 SHALL 顯示鎖定原因（如「訂單已完成，無法編輯」「訂單已取消」「您的角色不可編輯」）
- **AND** Section body 仍以 read-only 顯示既有填寫內容
- **AND** 使用者 MUST NOT 透過任何路徑修改三個欄位

#### Scenario: 非授權角色查看訂單備註

- **GIVEN** Order.status = 製作中
- **AND** 使用者為印務 / 出貨 / 會計（非業務 / 諮詢 / 業務主管 / 訂單管理人）
- **WHEN** 該角色開啟訂單詳情頁
- **THEN** Section body 仍以 read-only 顯示三個欄位的既有內容（可閱讀）
- **AND** Section header 右上的「編輯」按鈕 SHALL disabled 或不顯示
- **AND** 該角色 MUST NOT 透過任何路徑修改三個欄位

### Requirement: 訂單備註與 payment_terms_note 共存策略

新欄位 `payment_note`（訂單階段補充付款條件）與既有 `payment_terms_note`（從需求單帶入並鎖定的報價合約條款）SHALL 同時顯示於訂單詳情頁，並透過以下策略明確區分：

- **位置區分**：`payment_terms_note` 放在「訂單資訊卡」內既有位置；`payment_note` 放在新「訂單備註」section 內
- **Label 加註**：
  - `payment_terms_note` 顯示為「收款條件（來自需求單）」
  - `payment_note` 顯示為「付款備註（訂單階段補充）」
- **可編輯性對比**：`payment_terms_note` 唯讀；`payment_note` 依「訂單階段訂單備註編輯權限與時機」Requirement 開放編輯

#### Scenario: 兩個 payment 相關欄位同時顯示

- **GIVEN** Order 含 payment_terms_note 與 payment_note 兩個欄位
- **WHEN** 業務開啟訂單詳情頁資訊 Tab
- **THEN** 訂單資訊卡 SHALL 顯示 payment_terms_note label 為「收款條件（來自需求單）」、唯讀
- **AND** 訂單備註 section SHALL 顯示 payment_note label 為「付款備註（訂單階段補充）」、可編輯（依角色與時機）
- **AND** 兩個欄位之間 MUST NOT 互相覆蓋或合併

### Requirement: 訂單訂單備註 Data Model

Order 實體 SHALL 新增以下三個 free-text 欄位：

| 欄位 | type | 長度上限 | 預設值 | 用途 |
|------|------|---------|--------|------|
| `order_note` | text | 500 | `''` | 訂單條件備註（印刷須知 / 不打樣聲明 / 印刷風險告知等對客戶說明的整體訂單條款） |
| `delivery_note` | text | 500 | `''` | 交貨條件備註（工作天估算 / 急件處理 / 外島運費 / 規格調整交期順延等對客戶說明的交貨條款） |
| `payment_note` | text | 500 | `''` | 付款條件備註（全額 vs 頭尾款 / 指定日期付款 / 發票開立等對客戶說明的付款補充說明） |

三個欄位皆為 optional，預設空字串。儲存時 SHALL trim 前後空白；長度超過 500 字 SHALL 由 UI 顯示警告，但 spec 不強制截斷。

三個欄位與既有 5 個備註欄位（`payment_terms_note` / `payment_detail` / `customer_note` / `internal_note` / `production_note`）並存，**MUST NOT 合併或覆蓋既有欄位**。

#### Scenario: 新訂單初始化三個備註欄位為空

- **WHEN** 新訂單建立
- **THEN** order_note / delivery_note / payment_note SHALL 預設為空字串

#### Scenario: 三個欄位獨立儲存

- **GIVEN** Order.order_note = "已知悉印刷須知"
- **AND** Order.delivery_note = "預估 15-18 工作天"
- **AND** Order.payment_note = "全額付款 3-5 工作天"
- **WHEN** 業務僅更新 payment_note 為新內容
- **THEN** 系統 SHALL 只更新 payment_note 欄位
- **AND** order_note 與 delivery_note 保持原值

---

### Requirement: Payment 修正路徑（已完成不可改回處理中）

業務發現「已完成」標錯時，SHALL NOT 直接從 paymentStatus = '已完成' 切回 '處理中'。修正路徑為「取消整筆 Payment → 重建新 Payment」。

此規則維持 OA「已執行」的終態語意（避免狀態反覆翻動），與 [state-machines spec § 訂單異動狀態機](../state-machines/spec.md) 內「已執行回退機制」搭配運作。

#### Scenario: 業務嘗試將已完成 Payment 切回處理中被擋

- **GIVEN** Payment P-099（paymentStatus = '已完成', completedAt = 2026-05-21）
- **WHEN** 業務於 P-099 編輯 dialog 內嘗試將 paymentStatus 切換為 '處理中'
- **THEN** dialog UI SHALL 阻擋切換（toggle / select 限制或 disabled）
- **AND** UI SHALL 顯示提示「已完成 Payment 不可改回處理中。如需修正請改用「取消」功能後重建新 Payment」

#### Scenario: 業務取消已完成 Payment 後重建

- **GIVEN** Payment P-099（已完成、amount = -5000、關聯 OA-099 已執行）
- **WHEN** 業務於 OA-099 編輯介面 P-099 row 點「取消」
- **THEN** 系統 SHALL 刪除 P-099
- **AND** OA-099 對應已完成 Payment 累計 = 0 ≠ OA-099.amount → OA-099 回退至「已核可」（沿用 state-machines spec 回退機制）
- **AND** 業務 SHALL 可於 OA-099 編輯介面重新建立新 Payment

---

### Requirement: 既有資料 Migration（一次性 backfill）

本 change 上線時 SHALL 對既有所有 Payment 執行一次性 backfill：

- 所有 paymentStatus 為 null 的既有 Payment（含一般收款 + 退款 + 補收 + 諮詢費）SHALL 設為 `paymentStatus = '已完成'`、`completedAt = createdAt`
- 理由：refine-after-sales-refund + refactor change 時期的設計即為「建立 = 完成」，既有資料的 paidAt 與 attachments 也已是「實際發生」狀態，backfill 為「已完成」符合實質

Migration SHALL 為冪等：重複執行不會改變已 backfill 的資料。

#### Scenario: 既有退款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆退款 Payment P-old（amount = -5000, paymentMethod = '退款', paymentStatus = null, createdAt = 2026-05-20T10:00:00Z）
- **WHEN** 系統執行 Migration
- **THEN** P-old.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** P-old.completedAt SHALL 被 backfill 為 2026-05-20T10:00:00Z（= createdAt）
- **AND** Migration 結束後 OA invariant SHALL 仍滿足（既有「已執行 OA → 必有關聯退款 Payment」已隱含「已完成」語意）

#### Scenario: 既有一般收款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆一般收款 Payment P-old2（amount = +30000, paymentMethod = '銀行轉帳', paymentStatus = null, createdAt = 2026-04-10）
- **WHEN** 系統執行 Migration
- **THEN** P-old2.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** 對帳收款淨額計算結果 SHALL 與本 change 上線前一致（向後相容）

### Requirement: 一般收款列表編輯入口

業務 / 諮詢 SHALL 可於訂單詳情頁 `OrderPaymentSection` 收款紀錄列表的每一 row 操作欄上找到單一「編輯」按鈕；點擊後系統 SHALL 開啟 `PaymentEditDialog`（重用與 OA 編輯介面內 Payment Edit 一致的 `PaymentEditPanel` 共用元件），業務於 dialog 內 SHALL 可補對帳附件、實際完成日（paidAt）、切換 paymentStatus（處理中 ↔ 已完成）並通過 UI / store 雙重驗證。

阻擋規則沿用 store 既有設計（已完成 → 處理中 反向 SHALL NOT 通過、需走「取消 → 重建」）、UI 層 SHALL 在 dialog 內即時提示「請改用『取消』功能後重建新 Payment」。

**設計理由**：原 change `add-payment-status-and-decouple-oa-execution` 於 store action 層完成 paymentStatus 雙態邏輯，但 OrderPaymentSection 列表 row 操作欄完全無編輯按鈕，業務若先建處理中 Payment 後無 UI 入口可補齊資料切已完成，核心 user story「客戶說已匯但對帳未到、先填一半再補齊」UI 走不通。

#### Scenario: 業務先填一半再補齊資料切已完成（UI 走通）

- **GIVEN** 業務於訂單詳情頁建一筆處理中 Payment P-009（amount = +30000, paymentStatus = '處理中', paidAt = null, attachments = []）
- **WHEN** 業務於收款紀錄列表 P-009 row 操作欄點「編輯」按鈕
- **THEN** 系統 SHALL 開啟 PaymentEditDialog 載入 P-009 當前資料
- **WHEN** 業務補入 paidAt = 2026-05-25、上傳對帳單.pdf、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-009.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000

#### Scenario: 編輯 dialog 阻擋已完成 → 處理中反向切換

- **GIVEN** Payment P-010 paymentStatus = '已完成'
- **WHEN** 業務於收款列表 P-010 row 點「編輯」、嘗試切 paymentStatus → '處理中'、點擊「儲存」
- **THEN** 系統 SHALL 在 dialog 內即時顯示驗證錯誤「已完成 Payment 不可改回處理中，請改用『取消』功能後重建新 Payment」
- **AND** 系統 SHALL NOT 寫入變更
- **AND** P-010.paymentStatus SHALL 維持 '已完成'

#### Scenario: OrderPaymentSection 與 OA 編輯介面共用 PaymentEditPanel

- **GIVEN** PaymentEditPanel 共用元件已從 OrderAdjustmentEditDialog 抽出至獨立檔
- **WHEN** 業務分別於（a）OrderPaymentSection 列表 row 點「編輯」、（b）OA 編輯 dialog 內 Payment row 點「編輯」
- **THEN** 兩處 dialog 載入內容 SHALL 一致（同一 PaymentEditPanel 元件）
- **AND** 驗證邏輯、UI 行為、阻擋規則皆完全相同

### Requirement: 退款 Payment 切已完成顯示銷貨折讓弱提示（二者並存）

退款型 Payment（paymentMethod = '退款'）切「已完成」事件後，系統 SHALL 顯示非阻擋式弱提示「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance（銷貨折讓）」，提示位置採二者並存：

1. **PaymentEditDialog inline banner**：切已完成成功後在 dialog 內顯示 banner，提供「我知道了（關閉提示）」與「前往 Invoice 詳情頁建 SalesAllowance」兩個 action button
2. **訂單詳情頁對帳面板下方 sticky 提示**：訂單詳情頁載入時若該訂單存在「至少一筆未取消已完成退款 Payment 且訂單對應 Invoice 累計 - 已確認 SalesAllowance 累計 > 退款 Payment 累計絕對值」（即有發票尚未折讓對應）→ SHALL 顯示 sticky 提示，提供「前往建 SalesAllowance」action button

弱提示 SHALL NOT 阻擋業務任何操作、僅提供建議行動。對應 SalesAllowance 建立後 sticky 提示 SHALL 自動消失。

**設計理由**：兩處提示時序互補：dialog inline 處理即時情境（業務注意力在 dialog 內、看到 banner 立即決定下一步）、sticky 處理「業務當下沒空、離開 dialog 後忘了」情境（刷新訂單詳情頁仍能看到）。對應 SalesAllowance 建立後 sticky 消失避免重複嘮叨。

#### Scenario: 業務切退款 Payment 已完成 PaymentEditDialog inline banner

- **GIVEN** 退款 Payment P-011（amount = -5000, paymentStatus = '處理中'）
- **WHEN** 業務於 OA 編輯介面內點 P-011「編輯」、補資料、切 paymentStatus → '已完成'、點擊「儲存」並成功通過驗證
- **THEN** PaymentEditDialog SHALL 顯示 inline banner「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance」
- **AND** banner SHALL 提供「我知道了」「前往 Invoice 詳情頁」兩個按鈕
- **AND** banner SHALL NOT 阻擋業務關閉 dialog 或其他操作

#### Scenario: 訂單詳情頁對帳面板 sticky 提示出現

- **GIVEN** 訂單已開立 Invoice 累計 = 1000、SalesAllowance 累計 = 0
- **AND** 該訂單已有未取消已完成退款 Payment 累計 = -500
- **WHEN** 業務刷新訂單詳情頁
- **THEN** 對帳面板下方 SHALL 顯示 sticky 提示「此訂單有已完成退款 -500 元、但 Invoice 累計尚未折讓對應」
- **AND** sticky 提示 SHALL 提供「前往建 SalesAllowance」action button

#### Scenario: 對應 SalesAllowance 建立後 sticky 提示消失

- **GIVEN** 訂單已完成退款 -500、後續建 SalesAllowance -500 已確認
- **WHEN** 業務刷新訂單詳情頁
- **THEN** sticky 提示 SHALL NOT 再顯示（已折讓對應）
- **AND** 對帳面板維持顯示對帳數字 + 處理中 / 已完成 breakdown

#### Scenario: 補收 Payment 切已完成不顯示弱提示

- **GIVEN** 補收 Payment P-012（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中'）
- **WHEN** 業務於 OA 編輯介面內切 P-012 paymentStatus → '已完成'
- **THEN** PaymentEditDialog SHALL NOT 顯示銷貨折讓弱提示（補收非退款情境不需折讓）

### Requirement: 處理中 Payment 老化追蹤

Payment 滿足以下條件時系統 SHALL 視為「老化處理中 Payment」：

- `paymentStatus = '處理中'`
- `cancelled = false`
- `createdAt < now - 7 天`（依自然日計算，閾值 resolve [[ORD-021-處理中Payment老化追蹤機制]]）

老化判定後系統 SHALL：

1. **訂單詳情頁 row 視覺標示**：OrderPaymentSection 收款紀錄列表 row 顯示 amber Badge「老化 N 天」，N = `floor((now - createdAt) / 86400000)`
2. **業務主管 sidebar 入口**：新增「老化處理中 Payment」清單頁入口（業務主管 / 諮詢主管 / supervisor role 可見），列出全公司所有符合老化條件的 Payment
3. **清單頁欄位**：訂單編號 / 業務負責人 / 處理中天數 / 金額 / paymentMethod / 對應 OA 連結（若有）/ 「跳轉訂單詳情頁」action

老化閾值 7 天為初版固定值，未來累積 KPI「處理中 Payment 老化率」UAT 數據後可調整。

**設計理由**：原 change 引入 paymentStatus 雙態後，業務先建處理中 Payment 屬於「實際金流尚未發生、待確認」的中間態。若無老化追蹤、業務忘了補齊資料 → Payment 永遠停留處理中 → 對帳數字虛胖（應收找不到對應已完成 Payment）。7 天閾值對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期。

#### Scenario: 處理中 Payment 超過 7 天顯示老化 Badge

- **GIVEN** Payment P-013 createdAt = now - 8 天、paymentStatus = '處理中'、cancelled = false
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** P-013 row SHALL 顯示 amber Badge「老化 8 天」

#### Scenario: 處理中未滿 7 天不顯示老化 Badge

- **GIVEN** Payment P-014 createdAt = now - 5 天、paymentStatus = '處理中'
- **WHEN** 業務刷新訂單詳情頁
- **THEN** P-014 row SHALL NOT 顯示老化 Badge（未達閾值）

#### Scenario: 業務主管查看老化處理中 Payment 清單

- **GIVEN** 公司內有 3 筆 createdAt > 7 天的處理中 Payment 分屬 3 個訂單
- **WHEN** 業務主管點擊 sidebar「老化處理中 Payment」
- **THEN** 系統 SHALL 顯示 3 row（含訂單編號 / 業務負責人 / 處理中天數 / 金額 / paymentMethod / 對應 OA 連結）
- **AND** 主管點 row 的「跳轉訂單詳情頁」action SHALL 跳轉至對應訂單詳情頁、滾動到 OrderPaymentSection

#### Scenario: 已取消 Payment 不列入老化追蹤

- **GIVEN** Payment P-015 createdAt = now - 10 天、paymentStatus = '處理中'、cancelled = true
- **WHEN** 老化追蹤掃描
- **THEN** P-015 SHALL NOT 顯示老化 Badge（cancelled 排除）
- **AND** P-015 SHALL NOT 出現於老化清單頁

### Requirement: 處理中 Payment 不入會計帳本（GL 邊界規範）

處理中 Payment SHALL NOT 影響 General Ledger 應收應付帳本：

- 處理中 Payment 僅在訂單詳情頁三方對帳面板顯示為「處理中（合計）」資訊軸（既有實作沿用）
- 已完成才入 GL 應收應付帳本
- 對帳面板「處理中（合計）」軸下方 SHALL 補註「不入 GL 應收應付帳本」說明文字 + hover tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

當前 Prototype 階段無正式 GL 系統，本規範作為未來導入 GL 時的入帳邊界規範（resolve [[ORD-019-會計處理中Payment應收應付處理]]）。

**設計理由**：會計準則要求應收應付認列須有「實際交易發生」事實依據（對帳附件）。處理中 Payment 屬於業務預登記、未有事實依據，不應入 GL 避免月結 / 季結報表虛胖。雙重保護：對帳面板顯示處理中合計（業務 / 會計可見、便於追蹤）+ GL 不入帳。

#### Scenario: 對帳面板處理中合計軸顯示「不入 GL」說明

- **WHEN** 業務 / 會計開啟訂單詳情頁對帳面板
- **THEN**「處理中（合計）」軸下方 SHALL 顯示說明文字「不入 GL 應收應付帳本」
- **AND** 業務 / 會計 hover 該說明 SHALL 顯示 tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

#### Scenario: 處理中 Payment 不影響應收應付推導

- **GIVEN** 訂單應收 30000、已完成 Payment 累計 20000、處理中 Payment 累計 10000
- **WHEN** 系統推導 Order.payment_status（既有設計、僅累計已完成 Payment）
- **THEN** Order.payment_status 推導 SHALL 僅計入已完成 20000、處理中 10000 不入
- **AND** 對帳面板「應收應付差額」計算 SHALL 不含處理中金額

### Requirement: Payment 邏輯刪除（取消已完成 Payment 保留稽核軌跡）

Payment Data Model SHALL 新增以下三個欄位：

| 欄位 | 類型 | 必填 | 預設 | 說明 |
|------|------|------|------|------|
| cancelled | boolean | 必填 | false | 是否已取消（邏輯刪除旗標）|
| cancelReason | string | 選填 | '' | 取消原因（cancelled = true 時 SHALL 為非空字串）|
| cancelledAt | string \| null | nullable | null | 取消時點（cancelled = true 時必填 ISO 8601 timestamp）|

`cancelPayment(paymentId, options)` action 行為依 paymentStatus 分支：

- **paymentStatus = '處理中'**：直接從 `Order.payments` 陣列刪除（物理刪除、無稽核需求）
- **paymentStatus = '已完成'**：邏輯刪除（設 `cancelled = true`、`cancelReason`、`cancelledAt = now`），SHALL NOT 從陣列移除；同時觸發 OA 回退邏輯（若關聯 OA 已執行且累計重算不再達 OA.amount，OA 回退至 '已核可'、executedAt = null）

`calcOACompletedPaymentsTotal` 與對帳面板收款淨額計算 SHALL 排除 `cancelled = true` 的 Payment。

訂單詳情頁 OrderPaymentSection 列表 SHALL 預設隱藏 `cancelled = true` 的 Payment，提供「顯示已取消」toggle 切換可見性；已取消 row 顯示時 SHALL 標示 grey Badge「已取消」+ cancelReason hover tooltip。

既有 mock data SHALL backfill `cancelled = false`、`cancelReason = ''`、`cancelledAt = null`（一次性 migration）。

（resolve [[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]）

**設計理由**：已完成 Payment 代表「實際金流已發生且對帳已過」，物理刪除會造成稽核軌跡缺失（無法回查「為什麼這筆 Payment 不見了」）。處理中 Payment 屬於「業務預登記未實際發生」，刪除等同放棄此登記、無稽核需求。雙態分支符合「實際發生事件不可抹除」會計準則。

#### Scenario: 取消處理中 Payment 直接物理刪除

- **GIVEN** Payment P-016 paymentStatus = '處理中'、Order.payments 含 P-016
- **WHEN** 業務於 OA 編輯介面內點 P-016「取消」、確認
- **THEN** 系統 SHALL 從 Order.payments 陣列移除 P-016（物理刪除）
- **AND** Order.payments SHALL NOT 含 P-016

#### Scenario: 取消已完成 Payment 邏輯刪除保留稽核軌跡 + OA 回退

- **GIVEN** Payment P-017 paymentStatus = '已完成'、amount = -5000、linkedOrderAdjustmentId = OA-001
- **AND** OA-001.status = '已執行'、amount = -5000
- **AND** Order.payments 含 P-017
- **WHEN** 業務於 OA 編輯介面內點 P-017「取消」、填入 cancelReason = '對帳資料填錯'、確認
- **THEN** 系統 SHALL 設 P-017.cancelled = true、cancelReason = '對帳資料填錯'、cancelledAt = now
- **AND** Order.payments SHALL 仍含 P-017（邏輯刪除、不從陣列移除）
- **AND** 系統 SHALL 重算 OA-001 對應未取消已完成 Payment 累計 = 0（P-017 排除）≠ OA-001.amount
- **AND** OA-001.status SHALL 回退至 '已核可'、executedAt = null

#### Scenario: 已取消 Payment 預設隱藏 + toggle 顯示

- **GIVEN** Order.payments 含 P-017（cancelled = true）+ P-018（cancelled = false）
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** 列表 SHALL 僅顯示 P-018（預設隱藏已取消）
- **WHEN** 業務點「顯示已取消」toggle 切換為顯示
- **THEN** 列表 SHALL 同時顯示 P-017（含 grey Badge「已取消」+ cancelReason hover tooltip）

#### Scenario: 對帳收款淨額排除已取消 Payment

- **GIVEN** Order.payments 含 P-017（cancelled = true、amount = +5000、paymentStatus = '已完成'）+ P-018（cancelled = false、amount = +3000、paymentStatus = '已完成'）
- **WHEN** 業務開啟對帳面板
- **THEN** 收款淨額 SHALL = 3000（僅計入未取消 + 已完成）
- **AND** 已完成一般收款 breakdown SHALL = 3000

#### Scenario: 取消已完成 Payment 但累計仍達 OA.amount 維持已執行

- **GIVEN** OA-002 amount = -10000、status = '已執行'
- **AND** 關聯已完成 Payment P-019（amount = -5000）+ P-020（amount = -5000）
- **WHEN** 業務取消 P-019、填入 cancelReason、確認
- **THEN** P-019.cancelled SHALL = true
- **AND** 重算 OA-002 累計（排除 cancelled）= -5000 ≠ OA-002.amount
- **AND** OA-002.status SHALL 回退至 '已核可'、executedAt = null

#### Scenario: cancelReason 必填驗證

- **GIVEN** Payment P-021 paymentStatus = '已完成'
- **WHEN** 業務點 P-021「取消」、未填 cancelReason 直接點「確認」
- **THEN** 系統 SHALL 顯示驗證錯誤「取消原因為必填」
- **AND** 系統 SHALL NOT 寫入 cancelled = true
- **AND** P-021 維持 paymentStatus = '已完成'、cancelled = false

## Data Model

> 來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### Order

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 訂單編號 | order_no | 字串 | Y | Y | 系統自動產生 |
| 訂單類型 | order_type | 單選 | Y | | 線下 / 線上(EC) / 諮詢 |
| 狀態 | status | 單選 | Y | | 依狀態機 |
| 客戶 | customer_id | FK | Y | | FK -> 客戶 |
| 負責業務 | sales_id | FK | Y | | FK -> 使用者 |
| 來源需求單 | quote_request_id | FK | | | FK -> 需求單；線上訂單 / 諮詢訂單可無 |
| 來源諮詢單 | linked_consultation_request_id | FK | | | FK -> ConsultationRequest；非空表示來自諮詢流程；諮詢訂單建立時寫入，需求單轉訂單時若需求單來源為諮詢單也寫入 |
| 帳務公司 | billing_company_id | FK | Y | | FK -> BillingCompany；對應發票主體（藍新 MerchantID_）；從來源需求單帶入，訂單建立後不可變更 |
| 案名 | case_name | 字串 | | | 從需求單 title 帶入，可編輯 |
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK -> 使用者；訂單建立時指派、進入「報價待回簽」後鎖定（僅 Supervisor 可解鎖） |
| 是否需審核 | approval_required | 布林值 | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | 文字 | | | 從來源需求單帶入；最長 500 字；業務主管於審核時查看作為決策依據；進入「報價待回簽」後鎖定 |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | 文字 | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續退回需重審時的條件對照 |
| 客戶交期 | delivery_date | 日期 | | | 客戶確認的最終交期 |
| 審稿前預計出貨日 | expected_ship_date_pre_review | 日期 | | | 審稿前預計出貨 |
| 審稿後預計出貨日 | expected_ship_date_post_review | 日期 | | | 審稿後預計出貨 |
| 內部製作截止日 | internal_complete_date | 日期 | | | 內部製作截止日 |
| 付款狀態 | payment_status | 單選 | Y | | 未付款 / 已付款 / 部分退款 / 已退款 |
| 付款方式 | payment_method | 單選 | | | 現金 / 信用卡 / 銀行轉帳 / 支票 / 其他 |
| 付款備註 | payment_detail | 文字 | | | 分期資訊 / 發票備註 |
| 付款時間 | paid_at | 日期時間 | | | 線上訂單用 |
| 回簽時間 | signed_at | 日期時間 | | | 線下訂單回簽時間 |
| 發票統一編號 | invoice_unified_number | 字串 | | | 發票統一編號 |
| 商品含稅小計 | subtotal_with_tax | 小數 | | | 商品含稅小計（冗餘） |
| 折扣金額 | discount_amount | 小數 | | | 折扣金額（含稅） |
| 紅利金額 | bonus_amount | 小數 | | | 紅利金額（含稅） |
| 運費 | shipping_fee_with_tax | 小數 | | | 運費（含稅） |
| 訂單總額 | total_with_tax | 小數 | | | 訂單總額（含稅） |
| 可獲得紅利點數 | earned_bonus_points | 整數 | | | 可獲得紅利點數 |
| 是否急件 | is_urgent | 布林值 | | | 是否急件 |
| 主訂單 | parent_order_id | FK | | | 補收款主訂單（nullable） |
| 是否補收款訂單 | is_supplemental | 布林值 | Y | | 是否補收款訂單 |
| 最後稿件上傳時間 | file_uploaded_at | 日期時間 | | | 最後稿件上傳時間（統計） |
| 備註 | notes | 文字 | | | 既有欄位，extend-order-fields-from-vendor-feedback change 後語意對應「customer_note」（線上單客戶端備註） |
| 內部員工備註 | internal_note | 文字 | | | 線上 / 線下皆有；客戶不可見（既有 `staffNotes` 命名於 Prototype 沿用） |
| 訂單製作備註 | production_note | 文字 | | | 僅線下單；訂單製作 / 交易 / 出貨備註彙整（extend-order-fields-from-vendor-feedback change）|
| 窗口聯絡人 | contact_id | FK | | | FK → 廠客模組聯絡人主檔；線下單可切換、線上單唯讀（extend-order-fields-from-vendor-feedback change）|
| 商品小計（未稅）| subtotal_without_tax | 小數 | | | 雙欄計價未稅版本 |
| 其他費用（未稅）| other_fee_without_tax | 小數 | | | 雙欄計價未稅版本 |
| 運費（未稅）| shipping_fee_without_tax | 小數 | | | 雙欄計價未稅版本 |
| 諮詢費（未稅）| consult_fee_without_tax | 小數 | | | 雙欄計價未稅版本 |
| 折扣金額（未稅）| discount_without_tax | 小數 | | | 雙欄計價未稅版本 |
| 訂單總額（未稅）| total_without_tax | 小數 | | | 雙欄計價未稅版本；報表 / 對帳基準 |
| 訂單稅額 | tax_amount | 小數 | | | = total_with_tax − total_without_tax（extend-order-fields-from-vendor-feedback change）|
| 稅率 | tax_rate | 小數 | | | 訂單適用稅率（預設 0.05；零稅率 / 免稅為 0）|
| 回簽時間（自動推進）| signed_at | 日期時間 | | | 既有 + extend-order-fields-from-vendor-feedback change：上傳 OrderSignedFile 首份檔案時自動寫入（與業務手動點按鈕並行） |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### OrderItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> 訂單 |
| 來源需求單印件項目 | quote_request_item_id | FK | | | FK -> 需求單印件項目 |
| 名稱 | name | 字串 | Y | | |
| 數量 | quantity | 整數 | Y | | |
| 成交單價 | unit_price | 小數 | Y | | 成交單價 |

### PrintItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> 訂單 |
| 所屬訂單項目 | order_item_id | FK | Y | Y | FK -> 訂單項目 |
| 來源需求單印件項目 | quote_request_item_id | FK | | | FK -> 需求單印件項目 |
| 名稱 | name | 字串 | Y | | |
| 類型 | type | 單選 | Y | | 打樣 / 大貨 |
| 規格備註 | spec_note | 文字 | | | 規格備註 |
| 單位 | unit | 單選 | | | 個 / 冊 / 張 / 式 |
| 購買數量 | pi_ordered_qty | 小數 | Y | | 購買數量 |
| 目標數量 | pi_target_qty | 整數 | | Y | 目標數量（跨工單加總） |
| 生產數量 | pi_produced_qty | 整數 | | Y | 生產數量（報工累計） |
| 入庫數量 | pi_warehouse_qty | 整數 | | Y | 入庫數量（QC 通過） |
| 出貨數量 | pi_shipped_qty | 整數 | | Y | 出貨數量 |
| 預計產線 | expected_production_lines | M:N | | | 多選；FK -> ProductionLine（透過 PrintItemExpectedLine） |
| 審稿狀態 | review_status | 單選 | Y | | 稿件未上傳 / 等待審稿 / 已補件 / 合格 |
| 生產狀態 | production_status | 單選 | Y | | 等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達 / 已棄用 |
| 打樣結果 | sample_result | 單選 | | | 待確認 / OK / NG-製程問題 / NG-稿件問題（打樣印件專用） |
| 稿件上傳開放 | file_upload_enabled | 布林值 | Y | | 稿件上傳開放 |
| 首次稿件上傳時間 | file_uploaded_at | 日期時間 | | | 首次稿件上傳時間 |
| 稿件鎖定工單 | file_lock_wo_id | FK | | | 稿件鎖定工單 |
| 成品縮圖 | thumbnail_url | 字串 | | | 審稿人員獨立上傳的成品縮圖 |
| 難易度 | difficulty_level | 整數 | Y | | 印件審稿難易度（1-10），自需求單 / EC 商品主檔繼承（add-prepress-review D5） |
| 當前合格輪次 | current_round_id | FK | | Y | FK -> ReviewRound；指向目前合格的送審輪次，尚未合格時為 NULL；unique constraint 保證每印件至多一合格指針（add-prepress-review D4） |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### PrintItemExpectedLine（印件預計產線 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 印件 | print_item_id | FK | Y | Y | FK -> PrintItem |
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine |

### PrintItemFile

> add-prepress-review D4 調整：以 `PrintItem.current_round_id` 指針 +
> `round_id` FK 取代原 `is_final` 旗標，避免並發切換下多列 TRUE 的 race condition；
> `review_status` 標為衍生值（= 所屬 ReviewRound.result 投影）。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬印件 | print_item_id | FK | Y | Y | FK -> 印件 |
| 所屬審稿輪次 | round_id | FK | | | FK -> ReviewRound；補件上傳時 roundId 暫為 NULL，審稿人員下次送審時與新 Round 綁定（add-prepress-review D4） |
| 檔案角色 | file_role | 單選 | Y | | 印件檔 / 縮圖（PI-003 定案兩值：客戶內容合併為單一印件檔；縮圖為視覺摘要兼參考圖）|
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案網址 | file_url | 字串 | | Y | |
| 檔案大小 | file_size_kb | 整數 | | Y | |
| 檔案類型 | file_type | 單選 | Y | | 稿件 / 刀模 / 其他 |
| 審稿狀態 | review_status | 單選 | | Y | 衍生值（= 所屬 ReviewRound.result 投影）：待審稿 / 合格 / 不合格 |
| 審稿備註 | review_note | 文字 | | | 不合格原因（若有）|
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

出貨單相關資料表（Shipment、ShipmentItem、OrderPaymentRecord）見出貨模組（待建立）。

### Invoice（統一發票，藍新平台開立）

> extend-order-fields-from-vendor-feedback change 首次完整定義 Data Model。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬訂單 | order_id | FK | Y | Y | FK → 訂單 |
| 帳務公司 | billing_company_id | FK | Y | Y | 自訂單繼承；對應藍新 ezpayMerchantId |
| 發票種類 | category | 單選 | Y | | B2B / B2C |
| 買受人名稱 | buyer_name | 字串 | Y | | |
| 買受人統編 | buyer_ubn | 字串 | Y（B2B）| | B2B 必填、B2C 留空 |
| 買受人地址 | buyer_address | 字串 | | | 可選填 |
| 買受人信箱 | buyer_email | 字串 | | | 可選填 |
| 載具類別 | carrier_type | 單選 | | | 手機條碼 / 自然人憑證 / ezPay 載具（B2C 適用）|
| 載具編號 | carrier_num | 字串 | | | |
| 課稅別 | tax_type | 單選 | Y | | 應稅 / 零稅率 / 免稅 |
| 稅率 | tax_rate | 小數 | Y | Y | 依 tax_type 自動帶入 |
| 銷售額（未稅）| sales_amount | 小數 | Y | Y | 系統自動計算 |
| 稅額 | tax_amount | 小數 | Y | Y | 系統自動計算 |
| 發票金額（含稅）| total_amount | 小數 | Y | | 業務可微調 |
| 商品明細 | items | JSON | Y | | 自訂單印件帶入可編輯 |
| 備註 | comment | 文字 | | | |
| 狀態 | status | 單選 | Y | | 開立 / 作廢 |
| 發票號碼 | invoice_number | 字串 | Y | Y | 藍新回傳 |
| 作廢原因 | invalid_reason | 字串 | Y（作廢時）| | 限中文 6 字或英文 20 字 |
| ezpay 連結 | ezpay_invoice_url | 字串 | Y（derived）| Y | 呼叫藍新 API 取得，業務從訂單詳情頁直接開啟下載 PDF |
| 折讓累計 | folded | 小數 | Y（derived）| Y | ∑ 已確認折讓單金額絕對值，排除已作廢 |
| 剩餘可折讓 | remaining | 小數 | Y（derived）| Y | = total_amount − folded |
| 折讓衍生標示 | allowance_label | 單選 | Y（derived）| Y | 無折讓 / 已部分折讓 / 已完全折讓 / —|
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

Invoice MUST NOT 包含 `print_flag`（索取紙本）欄位。

### SalesAllowanceFile（折讓單回簽附件）

> extend-order-fields-from-vendor-feedback change 新增。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬折讓單 | sales_allowance_id | FK | Y | Y | FK → SalesAllowance |
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案網址 | file_url | 字串 | Y | Y | |
| 檔案大小 | file_size_kb | 整數 | Y | Y | |
| 檔案類型 | file_type | 字串 | Y | | MIME type |
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

### PaymentFile（收款對帳附件）

> extend-order-fields-from-vendor-feedback change 新增。結構同 SalesAllowanceFile，FK 改為 `payment_id`。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬收款 | payment_id | FK | Y | Y | FK → Payment |
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案網址 | file_url | 字串 | Y | Y | |
| 檔案大小 | file_size_kb | 整數 | Y | Y | |
| 檔案類型 | file_type | 字串 | Y | | MIME type |
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

### OrderSignedFile（訂單回簽附件）

> extend-order-fields-from-vendor-feedback change 新增。結構同 SalesAllowanceFile，FK 改為 `order_id`。上傳首份檔案 SHALL 自動推進訂單狀態（詳見 § 訂單確認觸發）。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬訂單 | order_id | FK | Y | Y | FK → 訂單 |
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案網址 | file_url | 字串 | Y | Y | |
| 檔案大小 | file_size_kb | 整數 | Y | Y | |
| 檔案類型 | file_type | 字串 | Y | | MIME type |
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

---

## Phase 2 預留功能

- EC 訂單全自動 API 同步
- 準時出貨率/訂單週期 Dashboard
- 業務 Forecast（需求預測）
- 訂單獲利分析
