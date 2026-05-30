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

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）。**諮詢費 BillingInstallment 由業務於主訂單既有發票時程規劃流程自行加入，系統 MUST NOT 自動建立諮詢費 BillingInstallment 於主訂單**。`consultation_invoice_option` 作為客戶意向參考保留於 ConsultationRequest 實體，業務可參考決定主訂單發票時程，但不驅動系統行為。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

3. **不做大貨**：客戶最終沒做大貨製作，涵蓋兩個觸發點：
   - 3.1 諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」時建立
   - 3.2 諮詢結束做大貨後，需求單流失：系統將此事件歸類為「不做大貨」結局，自動建諮詢訂單收尾
4. **待諮詢取消（半額退費）**：諮詢人員 / 業務主管於待諮詢階段點「取消諮詢」並於 dialog 確認後建立，含退款 Payment 與 OrderAdjustment

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不建任何訂單**；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共同的建立動作：(a) 訂單金額 = 諮詢費全額（2000），(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) **不做大貨 / 需求單流失情境自動建立待開發票 1 筆作為提醒**（金額 2000）；**諮詢取消情境 MUST NOT 自動建待開發票**（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底），(e) 取消情境額外建立 OrderAdjustment(-1000, status=已核可, approved_by=system, executed_at=NULL) + 退款 Payment(-1000, 處理中)，(f) **MUST NOT 自動開立 Invoice 或 SalesAllowance**（廢止 `consultation_invoice_option` 對發票自動化的影響）。終態：不做大貨 / 需求單流失 = 訂單完成；諮詢取消 = 已取消（見 § Requirement: 諮詢取消諮詢訂單終態收斂 / 諮詢取消退費 OA 系統建已核可，於 state-machines spec）。

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
- **AND** 系統 MUST NOT 自動建立諮詢費的 BillingInstallment（業務於主訂單既有發票時程規劃流程自行加入）
- **AND** 系統 MUST NOT 依 `consultation_invoice_option` 自動開立 Invoice（欄位降為客戶意向參考）
- **AND** 主訂單三方對帳：應收 = 6000 = 已收 2000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 3.1）

- **WHEN** ConsultationRequest 諮詢結束，諮詢人員選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 完成諮詢時點當天、source_type = consultation_end_no_production、invoicing_status = 未開立、created_by = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 3.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失（流失事件由需求單模組觸發）
- **WHEN** 系統處理需求單流失事件，且需求單 `linked_consultation_request_id` 非空
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 流失時點當天、source_type = quote_lost、invoicing_status = 未開立、created_by = system）
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
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
- **AND** 應收認列已核可 OA(-1000)（公式 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000）；退款 Payment 切「已完成」累計達 -1000 後推進 OA「已執行」
- **AND** 系統 MUST NOT 為諮詢取消自動建待開發票（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 諮詢訂單 SHALL 直接推進至「已取消」終態（見 § Requirement: 諮詢取消諮詢訂單終態收斂，於 state-machines spec）
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

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與 PaymentPlan / Payment 解耦：可先開後收、後收先開、合併（多筆 Payment 對一張 Invoice）、拆分（一筆 Payment 對多張 Invoice）。

**品項欄位送藍新對應**（本次新增）：每張 Invoice.items 陣列轉換為藍新 PostData 五欄序列（`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`），多項以 `|` 分隔。送出前 SHALL 通過「發票品項符合 ezPay 與電子發票法規硬約束」Requirement 全部 Scenario 驗證。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編、品項列輸入 name + count + unit + unitPrice（unitPrice 為未稅金額）
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立
- **AND** Invoice.items 每筆 itemAmount SHALL = count × unitPrice

#### Scenario: 業務拆分一筆收款開兩張發票

- **GIVEN** 訂單有一筆 Payment 100,000
- **WHEN** 業務開立兩張 Invoice 各 50,000，於 PaymentInvoice junction 各關聯該 Payment 50,000
- **THEN** 系統 SHALL 允許並驗證 ∑(PaymentInvoice.amount where payment_id = X) ≤ Payment.amount
- **AND** 兩張 Invoice 各自的 items 陣列 SHALL 獨立填寫（業務自行分配品項至兩張發票）

#### Scenario: 業務合併多筆收款開一張發票

- **GIVEN** 訂單有 Payment #1 = 30,000、Payment #2 = 70,000
- **WHEN** 業務開立 Invoice = 100,000，於 PaymentInvoice junction 各關聯一筆
- **THEN** 系統 SHALL 允許並寫入兩筆 PaymentInvoice 紀錄
- **AND** Invoice.items 為業務手動輸入或從 BillingInstallment（一鍵開票繼承品項）/ 訂單印件帶入的單一品項清單

#### Scenario: 業務先開發票後收款

- **WHEN** 業務於 Payment 為空時開立 Invoice
- **THEN** 系統 SHALL 允許，PaymentInvoice 暫無記錄
- **AND** 後續 Payment 建立時，業務 SHALL 可手動關聯到該 Invoice

#### Scenario: 業務開立 B2C 發票時單價為含稅金額

- **GIVEN** 業務於 Dialog 選擇 category = B2C
- **WHEN** 業務於品項列輸入 unitPrice = 1050（含 5% 稅）
- **THEN** 系統 SHALL 將該 unitPrice 視為含稅金額寫入 Invoice.items
- **AND** 系統 SHALL 自動換算 Invoice.salesAmount（未稅）= total / 1.05、taxAmount = total - salesAmount

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

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 BillingInstallment（請款期次）SHALL NOT 自動變動，由業務手動調整。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止原 v1.2 「雙重身份」設計（`adjustment_phase` 欄位 + UI 「售後服務單」雙重表述）。OrderAdjustment 不再依 Order.status 自動推算 phase，所有 `adjustment_type` 皆可於任何 Order 狀態下選用（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑），無關聯售後 ticket
- **非 NULL**：源自 AfterSalesTicket 內部建立的關聯異動（退款、補印收費）

訂單已完成後（Order.status = 已完成）的售後事件改走 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。業務不再於訂單詳情頁直接建「售後服務單」OrderAdjustment，而是於 AfterSalesTicket 內部建關聯 OrderAdjustment。

**新增閘門（訂單詳情頁訂單異動區）**：訂單詳情頁「訂單異動」區的「新增訂單異動單」入口 SHALL 僅於 `Order.status ∉ {訂單完成、已取消}` 時可用。已完成訂單的售後金額異動改走 AfterSalesTicket；已取消訂單一律唯讀（對齊 § 訂單詳情頁編輯型 Section 統一編輯時機與角色 之已取消規則）。既有 OrderAdjustment（完成前建立的存量）SHALL NOT 受此閘門影響，仍可檢視、審核、編輯金額、管理關聯 Payment（沿用獨立狀態機，不影響 task 5.9 已完成訂單存量待審 OA 走完流程）。

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
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** BillingInstallment（請款期次）SHALL NOT 自動變動
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
- **THEN** 系統 SHALL 自動建立 OrderAdjustment（adjustment_type = `諮詢取消退費`、amount = -1000、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false）
- **AND** OA 建立 MUST NOT 經過業務 / 主管的 UI 操作
- **AND** 業務 SHALL 可於 OA 已核可狀態調整退款金額（沿用既有「已核可後修改不需重審」）；退款 Payment 切已完成累計達 -1000 推進 OA 已執行
- **AND** 應收認列已核可 OA(-1000)，應收公式 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000

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

#### Scenario: 諮詢取消訂單退費對帳通過（半額退費、OA 模型、已完成退款條件）

- **GIVEN** 諮詢取消後諮詢訂單（status = 已取消）OrderExtraCharge(consultation_fee, 2000) = 2000
- **AND** OrderAdjustment(諮詢取消退費, -1000, 已執行)
- **AND** Payment 綁諮詢訂單：諮詢費 +2000（已完成）+ 退款 -1000（已完成）= 1000
- **AND** Invoice 1000（已開立，由諮詢人員手動開立），無自動 SalesAllowance
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000（OEC 2000 + 已執行 OA -1000）、發票淨額 = 1000、收款淨額 = 1000、差額 = 0

**註**：諮詢取消收斂為半額退費（2026-05-30 converge-consultation-cancel-to-order-cancel-flow）——諮詢費 2000、退款走 OrderAdjustment(-1000) + 退款 Payment(-1000)、不自動建 SalesAllowance、諮詢訂單終態為「已取消」。留存 1000 收入由諮詢人員手動開立 Invoice，未開票時對帳「應收 > 發票淨額」差額警示兜底。完整對帳公式與標示規則見「諮詢取消對帳邏輯」既有 ADDED Requirement。

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

系統 SHALL 計算 BillingInstallment（請款期次）的 derived field `overdue_days`（收款維度狀態 ≠ 已收訖 時 = TODAY - due_date；due_date 為空時 = NULL），作為應收帳款帳齡（AR aging）底層基礎。訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 BillingInstallment 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）、逾期自動通知、應收帳款 Dashboard 不在本次範疇。

#### Scenario: BillingInstallment 逾期天數自動計算

- **GIVEN** BillingInstallment #1 收款維度 = 未收、due_date = 2026-04-01
- **WHEN** 系統時間為 2026-05-06
- **THEN** BillingInstallment #1.overdue_days SHALL = 35

#### Scenario: 已收訖 BillingInstallment 不算逾期

- **GIVEN** BillingInstallment #1 收款維度 = 已收訖、due_date = 2026-04-01
- **WHEN** 系統計算 overdue_days
- **THEN** overdue_days SHALL = NULL（不顯示逾期）

#### Scenario: 訂單列表依最長逾期天數篩選

- **WHEN** 業務 / 主管於訂單列表選擇篩選器「最長逾期天數 ≥ 30 天」
- **THEN** 系統 SHALL 列出所有有 BillingInstallment.overdue_days ≥ 30 的訂單
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

諮詢訂單（`order_type = 諮詢`）的 Invoice **MUST NOT 由系統自動開立**。發票開立依情境分流：不做大貨 / 需求單流失情境由系統自動建待開發票（BillingInstallment）提醒、諮詢人員手動一鍵開立 Invoice（見 § 諮詢訂單收尾自動建 BillingInstallment 規則）；**諮詢取消情境系統 MUST NOT 自動建待開發票**，留存 1000 收入由業務手動開立 Invoice、未開票由對帳差額警示兜底（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）。

本 change 廢止既有「依 `consultation_invoice_option` 自動開立 Invoice」邏輯：
- `issue_now` 與 `defer_to_main_order` 兩值在任何諮詢訂單收尾情境（不做大貨 / 需求單流失 / 諮詢取消）下，系統 MUST NOT 自動觸發 Invoice 開立
- `consultation_invoice_option` 欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示（不再驅動系統行為）
- 於諮詢結束做大貨 → 需求單成交轉一般訂單情境，諮詢費 BillingInstallment **不自動建**，業務於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment 並可參考客戶意向決定獨立 / 併入主訂單其他 Invoice

#### Scenario: 諮詢訂單建立時不自動開立 Invoice（任一 invoice_option）

- **GIVEN** ConsultationRequest `consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **AND** 諮詢訂單因不做大貨 / 需求單流失情境建立
- **WHEN** 系統建立諮詢訂單
- **THEN** 系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance
- **AND** 系統 SHALL 依情境自動建立對應金額的待開發票（BillingInstallment）（見 § 諮詢訂單收尾自動建 BillingInstallment 規則）
- **AND** 諮詢人員 SHALL 後續手動將待開發票轉為實際 Invoice（金額由諮詢人員依客戶需求決定）
- **AND** 諮詢取消情境系統 MUST NOT 自動開立 Invoice 亦 MUST NOT 自動建待開發票（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）

#### Scenario: 諮詢結束做大貨主訂單不自動建諮詢費 BillingInstallment

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立諮詢費的 BillingInstallment
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment
- **AND** 業務 SHALL 可參考 `consultation_invoice_option` 客戶意向決定獨立 BillingInstallment 或併入其他主訂單 BillingInstallment

---

### Requirement: 諮詢訂單收尾自動建 BillingInstallment 規則

當諮詢訂單於不做大貨 / 需求單流失兩收尾情境任一建立時，系統 SHALL 自動建立 BillingInstallment 1 筆作為「待開發票提醒」，讓諮詢人員於待開票期次列表看到待辦並手動一鍵開立為實際 Invoice。諮詢取消情境系統 MUST NOT 自動建待開發票（見下方「諮詢取消情境例外」）。各情境機制單一正本見 [consultation-request spec](../consultation-request/spec.md) § 諮詢結束不做大貨情境自動建請款期次 / § 需求單流失情境自動建請款期次 / § 諮詢取消半額退費自動建請款期次。

**BillingInstallment 實體與狀態機**：完整欄位定義與雙維度狀態機（開票維度 invoicing_status + 收款維度 payment_status）見 [state-machines spec](../state-machines/spec.md) § BillingInstallment 雙維度狀態機 / § BillingInstallment 取代 PlannedInvoice 狀態機。品項鏈式預填語意見本 spec § Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承 / § Requirement: BillingInstallment 品項鏈式預填。

**自動建立規則**（依諮詢訂單收尾情境）：

| 觸發情境 | scheduled_amount | description | due_date / scheduled_issue_date | source_type |
|---------|-----------------|-------------|--------------|-------------|
| 諮詢結束不做大貨（諮詢人員點「結束諮詢 - 不做大貨」）| 2000 | 「諮詢費」 | 完成諮詢時點當天 | consultation_end_no_production |
| 諮詢來源需求單流失歸類為不做大貨 | 2000 | 「諮詢費」 | 需求單流失時點當天 | quote_lost |

**諮詢取消情境例外**：諮詢取消（待諮詢狀態半額退費）情境系統 **MUST NOT 自動建待開發票**（2026-05-30 converge-consultation-cancel-to-order-cancel-flow 收斂、廢除諮詢專屬自動建期次，推翻既有自動建 1000 待開發票拍板）。留存 1000 收入由業務手動開立 Invoice、未開票由對帳差額警示兜底（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）。`source_type = consultation_cancellation` enum 保留供業務手動建期次時標示來源。

**諮詢結束做大貨 → 需求單成交轉一般訂單情境**：系統 MUST NOT 自動於主訂單建立諮詢費 BillingInstallment。業務於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment（既有 BillingInstallment 手動建立流程），可參考 `consultation_invoice_option` 客戶意向決定獨立 / 併入其他 BillingInstallment。

**共同欄位**：所有自動建立的 BillingInstallment SHALL 設定 `invoicing_status = 未開立`、`created_by = system`、`linked_invoice_id = NULL`。

#### Scenario: 諮詢結束不做大貨自動建 BillingInstallment

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」、系統建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 BillingInstallment（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 完成諮詢時點當天、source_type = consultation_end_no_production、invoicing_status = 未開立、created_by = system、linked_invoice_id = NULL）

#### Scenario: 諮詢來源需求單流失自動建 BillingInstallment

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、對應需求單流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 BillingInstallment（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 流失時點當天、source_type = quote_lost、invoicing_status = 未開立、created_by = system、linked_invoice_id = NULL）

#### Scenario: 諮詢取消不自動建待開發票

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 確認取消、系統建立諮詢訂單 + OA + 退款 Payment
- **THEN** 系統 MUST NOT 自動建立待開發票（BillingInstallment）（留存 1000 收入由業務手動開立 Invoice）
- **AND** 未開票由對帳差額警示兜底（應收 1000 > 發票淨額 0，見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）

#### Scenario: 自動建立的 BillingInstallment 出現在待開票期次待辦列表

- **GIVEN** 諮詢訂單收尾自動建立 BillingInstallment、invoicing_status = 未開立
- **WHEN** 諮詢人員開啟待開票期次列表頁
- **THEN** 列表 SHALL 包含此 BillingInstallment
- **AND** 列表 SHALL 顯示「今天到期」狀態（依 scheduled_issue_date 推導）以提示諮詢人員優先處理
- **AND** 諮詢人員 SHALL 可點擊進入諮詢訂單詳情頁一鍵開立 Invoice

#### Scenario: 諮詢人員手動一鍵開立 BillingInstallment 為 Invoice

- **GIVEN** BillingInstallment(scheduled_amount = 2000、description = 「諮詢費」、invoicing_status = 未開立)（不做大貨 / 需求單流失情境自動建）
- **WHEN** 諮詢人員於諮詢訂單詳情頁發票區點「一鍵開立」並確認金額
- **THEN** 系統 SHALL 建立 Invoice（金額由諮詢人員確認、預設帶入 BillingInstallment.scheduled_amount、品項繼承自 BillingInstallment.items）
- **AND** 系統 SHALL 將 BillingInstallment.invoicing_status 改為「已開立」、linked_invoice_id 寫入新建 Invoice ID
- **AND** BillingInstallment 從待開票期次待辦列表移除

#### Scenario: 諮詢結束做大貨需求單成交主訂單不自動建諮詢費 BillingInstallment

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立 BillingInstallment
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment

---

### Requirement: 諮詢取消對帳邏輯

諮詢取消（待諮詢狀態半額退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並依新公式計算與標示。

**新對帳公式**：
- 應收總額 = OEC(2000) + ∑(已執行或已核可 OA(-1000)) = 1000
- 收款淨額 = Payment(+2000, 已完成) + Payment(-1000, 已完成) = 1000
- 發票淨額 = ∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance（由業務 / 諮詢人員手動開立、預設目標 1000）
- 差額 = 應收總額 - 發票淨額 - 收款淨額 = 1000 - 發票淨額 - 1000 = -發票淨額

對帳狀態標示規則：
- 退款 Payment 仍處理中（OA 為已核可、未推進已執行）：標示「退費處理中」、應收 SHALL 顯示為 1000（已核可 OA 即時計入應收）、收款淨額顯示為 2000（含+2000、扣除處理中-1000 = 不計入處理中 Payment 規則，依既有對帳規則）；發票淨額 0 = 預期當下尚未開
- 退款 Payment 已完成（OA 已推進已執行）且發票淨額 = 1000：標示「對帳通過 - 退費完成」
- 退款 Payment 已完成（OA 已推進已執行）且發票淨額 ≠ 1000：標示「待對帳 - 發票金額需確認」、差額由既有對帳警示 banner 提示業務 / 諮詢人員處理

#### Scenario: 諮詢取消退費完成對帳通過

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已執行) + Payment(+2000, 已完成) + Payment(-1000, 已完成) + Invoice(1000, 已開立)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 1000、差額 SHALL = 0
- **AND** 面板 SHALL 標示「對帳通過 - 退費完成」

#### Scenario: 諮詢取消退費處理中

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已核可) + Payment(+2000, 已完成) + Payment(-1000, 處理中)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 2000（處理中退款 -1000 不計入既有對帳公式）
- **AND** 應收總額 SHALL = 1000（已核可 OA 即時計入應收）
- **AND** 對帳面板 SHALL 標示「退費處理中」並顯示「另含處理中退款 1000 元」

#### Scenario: 諮詢取消後發票金額不符提示

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(-1000, 已執行) + Payment(+2000) + Payment(-1000, 已完成) + Invoice(2000, 已開立，諮詢人員誤開全額)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 2000、差額 SHALL = -1000
- **AND** 對帳面板 SHALL 標示「待對帳 - 發票金額需確認」
- **AND** 既有對帳警示 banner SHALL 提示諮詢人員修正誤開的發票（將 2000 發票作廢重開為 1000，或開立 SalesAllowance(-1000) 將發票淨額降至 1000）——此為**發票開立金額更正**動作；退款本身已由系統自動建立的 OA(-1000) + 退款 Payment(-1000) 處理，非以折讓退費（對齊 converge-consultation-cancel OA 退款模型、退款 Payment 與 SalesAllowance 分離設計）

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

老化判定後系統 SHALL 於訂單詳情頁 `OrderPaymentSection` 收款紀錄列表 row 顯示 amber Badge「老化 N 天」，N = `floor((now - createdAt) / 86400000)`。

老化閾值 7 天為初版固定值，未來累積 KPI「處理中 Payment 老化率」UAT 數據後可調整。

**設計理由**：原 change 引入 paymentStatus 雙態後，業務先建處理中 Payment 屬於「實際金流尚未發生、待確認」的中間態。若無老化追蹤、業務忘了補齊資料 → Payment 永遠停留處理中 → 對帳數字虛胖（應收找不到對應已完成 Payment）。7 天閾值對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期。訂單層級的 row Badge 提示讓業務在訂單詳情頁不離開頁面即可知悉該筆 Payment 已老化，提示時機與業務操作焦點對齊。

跨訂單聚合的「業務主管老化清單」視圖在 2026-05-26 後續決策中拆除（remove-aging-payment-supervisor-dashboard change） — 主管追蹤跨訂單老化 Payment 改採「匯出 csv row data 後 Excel 自行篩選」方式進行；系統內保留訂單層級 row Badge 但不再提供 sidebar 入口與聚合清單頁（csv 匯出機制本 spec 不定義、另議）。

#### Scenario: 處理中 Payment 超過 7 天顯示老化 Badge

- **GIVEN** Payment P-013 createdAt = now - 8 天、paymentStatus = '處理中'、cancelled = false
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** P-013 row SHALL 顯示 amber Badge「老化 8 天」

#### Scenario: 處理中未滿 7 天不顯示老化 Badge

- **GIVEN** Payment P-014 createdAt = now - 5 天、paymentStatus = '處理中'
- **WHEN** 業務刷新訂單詳情頁
- **THEN** P-014 row SHALL NOT 顯示老化 Badge（未達閾值）

#### Scenario: 已取消 Payment 不列入老化追蹤

- **GIVEN** Payment P-015 createdAt = now - 10 天、paymentStatus = '處理中'、cancelled = true
- **WHEN** 老化追蹤掃描
- **THEN** P-015 SHALL NOT 顯示老化 Badge（cancelled 排除）

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

### Requirement: 發票品項符合 ezPay 與電子發票法規硬約束

Invoice.items 陣列 SHALL 對齊 ezPay 電子發票 API（[EZP_INVI_1.2.2](../../../../memory/erp/ERP_Vault/raw/_attachments/EZP_INVI_1.2.2.pdf)）對品項的五欄結構要求 + 平台檢核硬性條件。法規源頭：財政部電子發票整合服務平台 MIG（Message Implementation Guideline）。詳細規格與印刷業實務衝突點參見 raw 卡 [2026-05-26-miles-upload-ezpay-invoice-api-spec](../../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

每個 InvoiceItem MUST 包含五欄：

| 欄位 | 對應藍新 | 型別 | 必填 | 約束 |
|------|---------|------|------|------|
| `name` | ItemName | 字串 (≤ 30) | Y | 商品名稱 |
| `count` | ItemCount | 整數 (Int(5)) | Y | 純整數 ≤ 99999 |
| `unit` | ItemUnit | 列舉 | Y | 必須來自 `prototype-shared-ui` 的共用單位 LOV（≤ 2 中文字 / ≤ 6 英數字符合 ezPay Varchar(2)）|
| `unitPrice` | ItemPrice | 整數 (Int(10)) | Y | 純整數；B2B 為未稅金額 / B2C 為含稅金額 |
| `itemAmount` | ItemAmt | 整數 (Int(10)) | Y | 系統計算 = `count × unitPrice`，業務不可手動覆寫 |

平台檢核硬性條件（不可違反）：

- `itemAmount = count × unitPrice`（每筆品項皆須成立）
- `Invoice.totalAmount = Invoice.salesAmount + Invoice.taxAmount`（既有規則，與本 change 無關但仍須符合）

#### Scenario: 業務開立發票時五欄全部必填

- **GIVEN** 業務於訂單詳情頁點擊「開立發票」打開 Dialog
- **WHEN** 業務新增一筆品項但未填寫 `count` / `unit` / `unitPrice` 任一欄
- **THEN** 系統 SHALL 顯示該欄位錯誤提示
- **AND** 系統 MUST NOT 允許送出表單

#### Scenario: itemAmount 由系統計算且業務不可手動覆寫

- **GIVEN** 業務輸入 `count = 5`、`unitPrice = 1500`
- **WHEN** 系統渲染品項列
- **THEN** `itemAmount` 欄位 SHALL 自動顯示 `7500`
- **AND** `itemAmount` 欄位輸入框 SHALL 為 disabled 狀態，業務無法手動修改
- **AND** 業務修改 `count` 或 `unitPrice` 時 `itemAmount` SHALL 即時重新計算

#### Scenario: count 純整數且 ≤ 99999

- **GIVEN** 業務於品項列輸入 `count`
- **WHEN** 業務嘗試輸入小數（如 `5.5`）或負數
- **THEN** 系統 SHALL 拒絕輸入並顯示「數量必須為正整數」
- **WHEN** 業務嘗試輸入超過 99999 的值
- **THEN** 系統 SHALL 顯示「數量上限 99999；超量請拆分多筆品項或改用更大單位」

#### Scenario: unitPrice 純整數，前端 lint 擋小數

- **GIVEN** 業務於品項列輸入 `unitPrice`
- **WHEN** 業務嘗試輸入小數（如 `0.5`）
- **THEN** 系統 SHALL 拒絕輸入並顯示「單價必須為正整數；如為小數計價（如每張 0.5 元）建議改用較大單位（如『每千張 500 元』）」
- **AND** 業務修改後系統 SHALL 即時重算 `itemAmount`

#### Scenario: unit 來自共用 LOV，dropdown 強制選擇

- **GIVEN** 業務於品項列要選擇 `unit`
- **WHEN** 業務點擊單位欄位
- **THEN** 系統 SHALL 顯示 dropdown，選項來自 [`prototype-shared-ui` § 共用單位 LOV](../prototype-shared-ui/spec.md)
- **AND** 業務 SHALL NOT 自由輸入文字（防止填入超出 ezPay Varchar(2) 限制的值）

#### Scenario: unitPrice label 依 Category 切換稅基提示

- **GIVEN** 業務於 Dialog 選擇 `category = B2B`
- **WHEN** 系統渲染品項列 `unitPrice` 輸入框
- **THEN** label SHALL 顯示「單價（未稅）」
- **WHEN** 業務切換 `category = B2C`
- **THEN** label SHALL 即時切換為「單價（含稅）」
- **AND** 已輸入的 `unitPrice` 值 SHALL NOT 自動換算（業務需手動確認金額重新填入）

### Requirement: BillingInstallment 品項鏈式預填

業務 / 諮詢建立 BillingInstallment 時 SHALL 可從訂單印件清單預填 `items[]`，使用者可編輯預填內容；後續訂單印件異動 SHALL NOT 即時連動至已建立的 BillingInstallment。實際開立 Invoice 時，由 BillingInstallment 「一鍵開立」觸發 SHALL 將 BillingInstallment.items 深拷貝預填至 Invoice.items，使用者可編輯（與本 spec § Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承 的繼承品項規則一致）。

#### Scenario: 建立 BillingInstallment 時從訂單印件預填 items

- **GIVEN** 訂單包含 3 筆印件（PrintItem A 數量 1000 張、B 數量 5000 張、C 數量 500 本）
- **WHEN** 業務點擊「新增請款期次」打開 Dialog
- **THEN** 系統 SHALL 預填 3 筆 InvoiceItem 候選（name = 印件名稱、count = 印件數量、unit = 印件單位、unitPrice = 印件未稅單價、itemAmount 自動計算）
- **AND** 業務 SHALL 可勾選 / 取消勾選候選項，或編輯任一欄位
- **AND** 業務 SHALL 可手動新增不對應印件的品項（如「製版費」「運費」）

#### Scenario: 印件異動不連動到已建立的 BillingInstallment

- **GIVEN** BillingInstallment BI-001 已從印件 A 預填（count = 1000）
- **WHEN** 業務將印件 A 的數量改為 2000
- **THEN** 系統 SHALL NOT 修改 BI-001.items 中的 count 值
- **AND** BI-001.items 維持原預填內容
- **AND** UI 在 BillingInstallment 編輯介面 SHALL 顯示 hint「品項複製自訂單印件，後續異動需手動同步」

#### Scenario: Invoice 一鍵開立沿用 BillingInstallment items

- **GIVEN** BillingInstallment BI-001 已規劃 items 含 3 筆品項
- **WHEN** 業務點擊「一鍵開立」按鈕
- **THEN** 系統 SHALL 開啟開立發票 Dialog，items 區塊預填 BI-001.items 全部 3 筆內容（深拷貝）
- **AND** 業務 SHALL 可編輯任一品項欄位或新增 / 移除品項
- **AND** 開立完成後 Invoice.items 為業務最終確認的內容（非 BI-001.items 原值，深拷貝原則沿用 v1.13）

#### Scenario: 手動建立品項（期次未從印件預填時）

- **GIVEN** 業務新增 BillingInstallment 時未從訂單印件預填（手動填品項）
- **WHEN** 系統渲染品項區塊
- **THEN** 系統 SHALL 顯示空品項列 + 「新增品項」按鈕
- **AND** 業務 SHALL 手動逐筆輸入品項；如需印件預填應於建立 BillingInstallment 時使用「從訂單印件帶入」候選功能

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

### Requirement: 請款期次（BillingInstallment）統一實體

系統 SHALL 提供「請款期次（BillingInstallment）」作為訂單應收的單一規劃實體，合併原本「付款計畫（PaymentPlan）」與「預計發票（PlannedInvoice）」雙頭維護。每筆 BillingInstallment 同時承載：應收日、預計金額、預計開票日、品項、備註、雙維度狀態（開票/收款獨立）、來源類型（source_type）、原始日期凍結基準、變更歷史。業務於訂單成立後（status = 報價待回簽 / 訂單確認）建立一筆或多筆 BillingInstallment 規劃分期請款，建立期間各期金額合計 SHALL 等於 Order.total_with_tax + Σ 已執行 OrderAdjustment.amount（補收進期次、退款不進期次的不對稱規則，違反時系統 SHALL 顯示警示但允許儲存）。

#### Scenario: 業務建立兩期請款期次（取代 PaymentPlan + PlannedInvoice 雙建立流程）

- **GIVEN** 訂單成立後總額 100000
- **WHEN** 業務點「新增請款期次」、建立 BillingInstallment(installment_no=1, description=「訂金」, scheduled_amount=30000, due_date=2026-06-01, expected_invoice_date=2026-05-15, items=[訂金品項]) + BillingInstallment(installment_no=2, description=「尾款」, scheduled_amount=70000, due_date=2026-07-01, expected_invoice_date=2026-06-30, items=[尾款品項])
- **THEN** 系統 SHALL 建立兩筆 BillingInstallment 紀錄，各自 invoicing_status = 未開立、payment_status = 未收
- **AND** 系統 MUST NOT 另外建立 PaymentPlan / PlannedInvoice 紀錄（雙實體已棄用）
- **AND** 兩筆 BillingInstallment.scheduled_amount 合計 = 100000 = Order.total_with_tax

#### Scenario: 期次合計與應收總額不符時警示但允許儲存（沿用既有 L915 規則）

- **GIVEN** 訂單總額 100000 + 已執行 OA(+5000 加印追加)，應收 = 105000
- **WHEN** 業務建立 BillingInstallment 合計只填 100000（少 5000）
- **THEN** 系統 SHALL 顯示警示「應收 105000、期次合計 100000、差額 5000」
- **AND** 系統 SHALL 允許儲存（業務後續可補建 BillingInstallment 或調整既有期次金額）

### Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承

每張 Invoice MUST 透過 `source_billing_installment_id` NOT NULL UNIQUE FK 指向唯一一筆 BillingInstallment。業務在 BillingInstallment「一鍵開票」時，系統 SHALL 建立 Invoice 並從來源期次自動繼承品項、應收日、備註；Invoice.source_billing_installment_id 寫入該期次 id、BillingInstallment.linked_invoice_id 寫入新 Invoice id、BillingInstallment.invoicing_status 推進為「已開立」。原 v1.13「業務從 PlannedInvoice 一鍵開立」入口廢止，取代為「從 BillingInstallment 一鍵開立」。

#### Scenario: 業務從期次一鍵開立發票繼承品項

- **GIVEN** BillingInstallment BI-001（scheduled_amount=30000, expected_invoice_date=2026-05-15, items=[訂金品項], invoicing_status=未開立）
- **WHEN** 業務點 BI-001「一鍵開立發票」
- **THEN** 系統 SHALL 建立 Invoice INV-001（total_amount=30000, items=深拷貝自 BI-001.items, source_billing_installment_id=BI-001.id, status=開立）
- **AND** 系統 SHALL 寫入 BI-001.linked_invoice_id = INV-001.id、BI-001.invoicing_status = 已開立
- **AND** 業務 MAY 在開立 dialog 內微調品項（不影響 BI-001.items，深拷貝原則沿用 v1.13）

#### Scenario: 期次↔發票 1:1 約束阻擋重複開票

- **GIVEN** BillingInstallment BI-002.invoicing_status = 已開立、linked_invoice_id = INV-002
- **WHEN** 業務再次點 BI-002「一鍵開立發票」
- **THEN** 系統 SHALL 隱藏「一鍵開立」按鈕（按鈕只在 invoicing_status = 未開立 / 已作廢 顯示）

### Requirement: 拆票 = 拆期（產生獨立平輩期次 + 純追溯欄位）

業務於 BillingInstallment 列表編輯動作或開立發票 Dialog 內按「拆此期」捷徑時，系統 SHALL 將原期次拆為兩個獨立平輩期次。原期次設 cancelled = true 保留稽核軌跡（不物理刪除）；兩筆新期次各自獨立 query / aggregation（無父子 hierarchical FK），但**保留** `split_from_installment_id` 純追溯欄位指向原期次 id 用於 CSV 諮詢取消半額退費 lineage 稽核與 source_type 繼承。新期次 source_type 繼承原期次（manual / consultation_cancellation 等），note 自動帶「原一期拆兩期，源期次描述：「{原 description}」」前綴。

#### Scenario: 業務在規劃階段拆票（一期 78000 拆兩張票各 2500 + 75500）

- **GIVEN** BillingInstallment BI-010（installment_no=1, scheduled_amount=78000, source_type=manual, invoicing_status=未開立）
- **WHEN** 業務於期次列表點 BI-010「拆此期」，輸入拆分規格（期A 2500 / 期B 75500，各自 due_date 業務填）
- **THEN** 系統 SHALL 建立 BillingInstallment BI-010-A（installment_no=新序號, scheduled_amount=2500, source_type=manual, split_from_installment_id=BI-010.id, note=「原一期拆兩期，源期次描述：「[原 description]」」）+ BI-010-B（scheduled_amount=75500, 同上欄位）
- **AND** 系統 SHALL 設定 BI-010.cancelled = true、cancel_reason = 「拆兩期」（保留稽核，UI 預設隱藏可切換顯示）
- **AND** 兩筆新期次 change_count 從 0 起算（拆期事件本身寫入 OrderActivityLog SPLIT 事件作為稽核依據，不計入 change_count）

#### Scenario: 業務在開票 Dialog 內動態拆票

- **GIVEN** 業務在 BI-011「一鍵開立發票」Dialog 內、客戶臨時要求拆兩張票
- **WHEN** 業務於 Dialog 內按「拆此期」捷徑、輸入兩期金額與日期
- **THEN** 系統 SHALL 執行同「規劃階段拆票」邏輯（產生 BI-011-A + BI-011-B、原期次 cancelled = true）
- **AND** Dialog SHALL 切換至「選擇對哪筆新期次開票」step、業務選定後完成開票（單一 Dialog 流程內完成拆 + 開）

### Requirement: 期次變更稽核軌跡（原始日期凍結基準 + 變更歷史 + 變更次數）

每筆 BillingInstallment SHALL 凍結 `original_due_date` 與 `original_expected_invoice_date` 兩個基準欄位（於期次首次儲存當下凍結，之後變更不影響）。每次 due_date / expected_invoice_date 變更 SHALL 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED）含 old_value / new_value / operator / timestamp。`change_count` derived field 統計該期次 due_date + expected_invoice_date 兩欄位變更累計次數（拆期事件不計入）。UI 顯示「原始 vs 現況」對照 + 變更次數，作為業務操作穩定性的事後稽核依據（沿用顧問 §1 + CEO 指標 4）。

#### Scenario: 業務修改期次預計開票日寫入變更歷史

- **GIVEN** BillingInstallment BI-020（original_due_date=2026-06-01, due_date=2026-06-01, original_expected_invoice_date=2026-05-15, expected_invoice_date=2026-05-15, change_count=0）
- **WHEN** 業務修改 BI-020.expected_invoice_date 從 2026-05-15 改為 2026-05-20
- **THEN** 系統 SHALL 寫入 OrderActivityLog EXPECTED_DATE_CHANGED 事件（old_value=2026-05-15, new_value=2026-05-20, operator=業務 user_id, timestamp=now）
- **AND** BI-020.change_count SHALL = 1
- **AND** BI-020.original_expected_invoice_date SHALL 維持 2026-05-15（凍結基準不變）
- **AND** UI 顯示「原始預計開立日：2026-05-15 ｜ 現況：2026-05-20（業務於 [日期] 調整）｜ 本期變更次數 1」

### Requirement: 期次雙維度狀態（開票維度 + 收款維度獨立）

BillingInstallment SHALL 維護兩個獨立狀態維度：
- **開票維度（invoicing_status）**：`未開立` → `已開立`（業務一鍵開票觸發）；`已開立` → `已作廢`（Invoice 作廢觸發，linked_invoice_id 設 NULL，可重新開票）
- **收款維度（payment_status，derived）**：依未取消已完成 PaymentAllocation 累計推導
  - 累計 = 0：未收
  - 0 < 累計 < scheduled_amount：部分收款
  - 累計 ≥ scheduled_amount：已收訖

兩維度完全獨立，支援「先收後開」（收款維度先到已收訖、開票維度仍未開立）與「先開後收」（開票維度先到已開立、收款維度仍未收）情境。

#### Scenario: 先收後開情境 — 業務先收訂金 30000 後再開票

- **GIVEN** BillingInstallment BI-030（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收）
- **WHEN** 業務登錄 Payment 30000、依序填滿核銷至 BI-030（PaymentAllocation.allocated_amount=30000、auto_allocated=true、業務切 Payment 為已完成）
- **THEN** BI-030.payment_status SHALL = 已收訖（payment 維度已推進）
- **AND** BI-030.invoicing_status SHALL = 未開立（開票維度仍未推進）
- **WHEN** 業務於 BI-030 點「一鍵開立發票」
- **THEN** BI-030.invoicing_status SHALL = 已開立（兩維度均推進完成）

#### Scenario: 發票作廢後期次回未開立可重新開票

- **GIVEN** BI-031.invoicing_status = 已開立、linked_invoice_id = INV-031
- **WHEN** 業務於 Invoice 詳情頁作廢 INV-031（填入作廢原因）
- **THEN** 系統 SHALL 設定 INV-031.status = 作廢
- **AND** BI-031.invoicing_status SHALL → 已作廢、linked_invoice_id 設 NULL
- **AND** BI-031.payment_status SHALL 不受影響（保留稽核）
- **AND** 業務 MAY 於 BI-031 重新點「一鍵開立發票」建立新 Invoice INV-031'

### Requirement: 收款核銷分配（PaymentAllocation 業務手動入帳）

業務登錄一筆 Payment（amount > 0、paymentMethod ∈ 一般收款）時，系統 SHALL 於「新增收款」Dialog 內 inline 顯示該訂單所有未取消收款項目（BillingInstallment where cancelled = false），不需先填收款金額即顯示。業務 SHALL 勾選要入帳的收款項目並逐筆手動填入帳金額（PaymentAllocation.allocated_amount）。系統 SHALL NOT 自動依序填滿、SHALL NOT 提供「自動回填差額」按鈕——入帳金額由業務全手動決定（Miles 拍板）。

校驗（防呆）：系統 SHALL 即時校驗「勾選入帳金額合計 ≤ Payment.amount」，超過時 Input 紅標 + 禁止送出並提示「入帳合計不可大於收款金額」。允許合計 < Payment.amount（溢收場景）：剩餘金額 SHALL 自動記為「預收（未分配）」桶（PaymentAllocation.billing_installment_id = NULL）。

PaymentAllocation 的 auto_allocated / manually_overridden 欄位於業務手動入帳模型下恆為 false（無系統自動預設值可供覆寫），保留為相容欄位；變更率類指標 MUST NOT 依「覆寫事件」計算（見 § 訂單收款變更率指標）。Payment 切「已完成」時系統 SHALL 觸發各對應 BillingInstallment 收款維度狀態（payment_status）依累計已完成入帳金額推導（未收 / 部分收款 / 已收訖）。

#### Scenario: 一筆 Payment 業務手動入帳兩期

- **GIVEN** 訂單兩筆未收期次：BI-040（scheduled_amount=30000, due_date=2026-06-01）+ BI-041（scheduled_amount=70000, due_date=2026-07-01）
- **WHEN** 業務於「新增收款」Dialog 填 Payment P-040（amount=100000, paymentMethod=銀行轉帳），於入帳明細勾選 BI-040 填 30000、勾選 BI-041 填 70000
- **THEN** 系統 SHALL 校驗入帳合計 100000 = Payment.amount（PASS）並建立兩筆 PaymentAllocation（PA-040a → BI-040 allocated 30000、PA-040b → BI-041 allocated 70000；auto_allocated=false、manually_overridden=false）
- **AND** 業務切 P-040 為已完成後，BI-040.payment_status 與 BI-041.payment_status SHALL 均推進至「已收訖」

#### Scenario: 業務只入帳部分金額（某期部分收款）

- **GIVEN** 訂單兩筆未收期次：BI-050（scheduled_amount=3000）+ BI-051（scheduled_amount=2000）
- **WHEN** 業務登錄 Payment 4000，勾 BI-050 填 3000、勾 BI-051 填 1000
- **THEN** 系統 SHALL 校驗入帳合計 4000 = Payment.amount（PASS）並建立兩筆 PaymentAllocation（BI-050 allocated 3000、BI-051 allocated 1000）
- **AND** 業務切 Payment 為已完成後，BI-050.payment_status = 已收訖（累計達 3000）、BI-051.payment_status = 部分收款（累計 1000 < 2000）

#### Scenario: 入帳合計超過收款金額被擋（防呆）

- **GIVEN** 業務登錄 Payment 5000
- **WHEN** 業務勾 BI-050 填 3000、勾 BI-051 填 3000（合計 6000 > 5000）
- **THEN** 系統 SHALL 將超額 Input 紅標 + 禁止送出，提示「入帳合計不可大於收款金額」

#### Scenario: 溢收標記為「預收（未分配）」桶

- **GIVEN** 訂單兩筆未收期次合計 5000，業務登錄 Payment 6000
- **WHEN** 業務勾兩期入帳合計 5000（剩 1000 未指定收款項目）
- **THEN** 系統 SHALL 額外建立 PaymentAllocation（billing_installment_id=NULL, allocated_amount=1000）作「預收（未分配）」桶
- **AND** 預收桶後續業務可手動核銷至新期次或退款處理（後續路徑見 OQ-BI-C）

### Requirement: 補收 OA（正項）跳過審核中間態直達已執行

系統 SHALL 依 amount 正負與 adjustment_type 自動判定 OA 是否需業務主管審核：補收正項 OA（amount > 0 且 adjustment_type ∈ 五項補收 type）SHALL 跳過「待主管審核」與「已核可」中間態直達「已執行」狀態（approved_by=業務 user_id、executed_at=now、應收 +N 立即認列、MUST NOT 綁 Payment 切已完成才推進）。

OrderAdjustment 新增 `requires_supervisor_approval` derived field：
- amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項} → false（補收正項）
- amount < 0 → true（退款負項，沿用 v1.13）
- adjustment_type = 諮詢取消退費（系統內生）→ false（v1.10 既有）

補收正項 OA 建立後 SHALL 跳過「待主管審核」與「已核可」中間態，直接推進至「已執行」狀態（approved_by = self/business、executed_at = now），應收 +N 立即認列。**補收 OA MUST NOT 綁 Payment 切已完成才推進已執行**（與退款 OA 對稱破壞但語意分流：補收 = 即時 +N、退款 = 必綁退款動作）。

#### Scenario: 業務建立加印追加補收 OA 立即執行

- **GIVEN** 訂單在製作中、客戶要求加印 +8000
- **WHEN** 業務建立 OA-060（amount=+8000, adjustment_type=加印追加, linked_after_sales_ticket_id=null）並點「儲存並執行」
- **THEN** 系統 SHALL 設定 OA-060.requires_supervisor_approval = false
- **AND** OA-060.status SHALL 跳過「草稿 → 待主管審核 → 已核可」直接 = 已執行（approved_by=業務 user_id, executed_at=now）
- **AND** 應收 SHALL 立即 +8000（不需等收款）
- **AND** Order 對帳檢視 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃」+ action button「建立期次」（顧問 C-PM-2 期次規劃 invariant）
- **AND** 業務 MAY 點 action 新增 BillingInstallment（scheduled_amount=8000, source_type=manual）或併入既有未開期次

### Requirement: 補收 OA 大額閾值監督機制

當補收 OA 建立時，若 amount > 大額閾值（建議起始 50000，實際值待 OQ-BI-4 Miles 拍板）SHALL 觸發以下事後監督：
- OrderActivityLog 寫入紅色標記事件（high_amount_supplementary_charge）
- Slack 自動通知該訂單業務主管「業務 [name] 建立大額補收 OA +N 元於訂單 [order_no]」
- 業務主管 MAY 事後審查、發現異常時與業務溝通修正（不阻擋業務操作）

#### Scenario: 業務建立超閾值補收 OA 觸發 Slack 通知

- **GIVEN** 大額閾值設為 50000（系統設定值）
- **WHEN** 業務建立 OA-061（amount=+60000, adjustment_type=規格變更）並執行
- **THEN** OA-061.status SHALL = 已執行（仍立即執行、不阻擋）
- **AND** 系統 SHALL 寫入 OrderActivityLog 紅標事件 high_amount_supplementary_charge
- **AND** 系統 SHALL 透過 Slack 推送通知至業務主管：「業務 [name] 建立大額補收 OA +60000 元於訂單 [order_no]」

### Requirement: 三方對帳警示 banner（期次規劃 invariant）

訂單 SHALL 維護以下 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`。違反時對帳檢視（OrderReconciliationPanel）SHALL 顯示警示 banner「OA 已執行 N 元、但未對應期次規劃」+ action button「建立期次」，讓業務一鍵新增期次承載該補收金額。本警示為提示性質、不阻擋業務後續操作（沿用既有警示而非阻擋的設計精神）。

#### Scenario: 補收 OA 已執行但未建期次觸發警示

- **GIVEN** 訂單應收 = 印件費 100000 + OEC 0 + 已執行 OA(+8000) = 108000
- **AND** Σ BillingInstallment.scheduled_amount where cancelled=false = 100000（業務未補建期次）
- **WHEN** 業務或會計查看 OrderReconciliationPanel
- **THEN** 系統 SHALL 顯示警示 banner「OA 已執行 +8000、但未對應期次規劃（差額 8000）」
- **AND** banner SHALL 含 action button「建立期次」、點擊後開啟 BillingInstallment 新建 Dialog 預填 scheduled_amount=8000

### Requirement: 退款 OA（負項）沿用業務主管核可 + 不進期次

退款負項 OA（amount < 0）SHALL 沿用 v1.13 流程：
- requires_supervisor_approval = true
- 狀態流轉：草稿 → 待主管審核 → 已核可（業務主管核可）→ 業務於 OA 介面建退款 Payment（處理中）→ 業務補對帳附件 + paidAt 切已完成 → 累計達 OA.amount 時系統推進 OA 至「已執行」
- **退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次，沿用 v1.13 設計）
- 發票端處理（免審核，退款 OA 已核可即為批准）：
  - 未跨月：作廢原 Invoice + 重開正確金額
  - 已跨月：開立 SalesAllowance 折讓關聯原 Invoice，refund_payment_id 手動關聯退款 Payment
- BillingInstallment 不受退款影響（保留正向期次稽核歷史）

#### Scenario: 訂單已完成後售後退款 5000（透過 AfterSalesTicket）

- **GIVEN** 訂單已完成、期2 尾款 70000 已開 INV-002 已收訖
- **WHEN** 業務建立 AfterSalesTicket（responsibility=客戶投訴、resolution=退款）+ ticket 內建退款 OA-070（amount=-5000, linked_after_sales_ticket_id=ticket.id, adjustment_type=退印）並送審
- **THEN** OA-070.status = 待主管審核
- **WHEN** 業務主管核可 → OA-070.status = 已核可
- **WHEN** 業務於 OA-070 介面建退款 Payment P-070（amount=-5000, paymentMethod=退款, paymentStatus=處理中, linkedOrderAdjustmentId=OA-070.id）+ 補對帳附件 + paidAt + 切已完成
- **THEN** 系統 SHALL 推進 OA-070.status = 已執行、executedAt=now
- **AND** P-070 MUST NOT 建立 PaymentAllocation（不進正向期次）
- **AND** 應收 SHALL = -5000
- **AND** BillingInstallment 期2 仍記 payment_status = 已收訖、scheduled_amount = 70000（保留稽核歷史、不變動）

#### Scenario: 跨月退款開立折讓 + 關聯退款 Payment

- **GIVEN** OA-070 已執行、退款 Payment P-070 已完成
- **AND** INV-002（total_amount=70000, 已跨月不可作廢）
- **WHEN** 業務於 INV-002 詳情頁建立 SalesAllowance SA-070（allowance_amount=-5000, linked_invoice_id=INV-002.id, refund_payment_id=P-070.id, status=已確認）
- **THEN** INV-002 自動顯示「已部分折讓 -5000」（既有 derived 折讓衍生標籤）
- **AND** 三方對帳對齊：應收 -5000 ｜ 發票淨額 70000-5000 ｜ 收款淨額 70000-5000 = 65000

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

廢止 v1.13 spec L951「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則。**BREAKING**：BillingInstallment 變更（新增 / 修改 / 拆期 / 取消）SHALL NOT 觸發訂單回審，改為 ActivityLog 留軌跡 + change_count derived 供事後稽核。

#### Scenario: 業務修改期次日期不再觸發回審

- **GIVEN** BillingInstallment BI-080.due_date = 2026-06-01、訂單已過業務主管審核進入製作中
- **WHEN** 業務修改 BI-080.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-080.change_count SHALL = 1
- **AND** 訂單狀態 SHALL 維持「製作中」（不回退至「業務主管審核」）

### Requirement: 對帳 CSV 匯出（14 欄定稿）

會計 SHALL 可於對帳模組匯出 14 欄對帳 CSV，一列 = 一張已開立發票（status = 開立、不含作廢）。每欄資料來源：

| # | 欄位 | 來源 |
|---|------|------|
| 1 | 帳務公司 | Invoice.billing_company → BillingCompany.name |
| 2 | 發票號碼 | Invoice.invoice_number |
| 3 | 訂單編號 | Order.order_no |
| 4 | 案名 | Order.case_name |
| 5 | 開立日期 | Invoice.issued_at |
| 6 | 應收日期 | 繼承來源期次 Invoice.source_billing_installment_id → BillingInstallment.due_date（現況值，非 original） |
| 7 | 客戶名稱 | Order.customer_name |
| 8 | 總金額(含稅) | Invoice.total_amount（發票面額，不扣折讓） |
| 9 | 備註 | 繼承來源期次 BillingInstallment.note |
| 10 | 收款日期 | derived（透過 Invoice → BillingInstallment → PaymentAllocation → Payment.paidAt）|
| 11 | 收款狀態 | derived（依 BillingInstallment.payment_status 推導：未收/部分/已收訖） |
| 12 | 業務名稱 | Order.sales_id → User.name |
| 13 | 開立日期月底 | EOM(Invoice.issued_at) 計算結果 |
| 14 | 天數 | #6 - #5（應收日 − 開立日，正值代表給客戶的帳期 Net N） |

#### Scenario: 會計匯出當月對帳 CSV

- **WHEN** 會計於對帳模組點「匯出當月對帳 CSV」、選擇日期範圍 2026-05-01 ~ 2026-05-31
- **THEN** 系統 SHALL 列出所有 Invoice.status=開立 且 Invoice.issued_at IN 範圍的發票紀錄
- **AND** 每張發票一列，14 欄資料依上表填寫
- **AND** Invoice.status=作廢 的發票預設不列入（OQ-BI-G 待會計實務反饋擴充篩選 UI）
- **AND** CSV 檔案格式 UTF-8 with BOM（對應 Excel 開啟中文不亂碼）

#### Scenario: 已部分收款發票的 CSV 收款日與狀態

- **GIVEN** INV-090（total_amount=70000）已收 40000（PaymentAllocation 1 = 25000 paid_at=2026-05-10 + PaymentAllocation 2 = 15000 paid_at=2026-05-25）
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-090 對應 row 第 10 欄收款日 = 最近收款日 2026-05-25（OQ-BI-D 待 Miles 拍板「最近 vs 結清」）
- **AND** 第 11 欄收款狀態 = 部分收款

#### Scenario: 先開後收尚未收款發票的 CSV

- **GIVEN** INV-091（issued_at=2026-05-20, total_amount=50000, source_billing_installment_id=BI-091）+ BI-091.payment_status=未收
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-091 對應 row 第 10 欄收款日 = 空（未收款）
- **AND** 第 11 欄收款狀態 = 未收

### Requirement: 收款 / 開票領域營運管理 KPI（管理組員績效用，非產品成功指標）

系統 SHALL 提供以下「營運管理 KPI」供業務主管管理組員收款績效、業務 / 會計檢視自身達成度。這些是**營運管理指標（管理組員 KPI）**，非產品成功指標（NSM / 衡量功能成不成功），亦非產品機制指標（如已移除的「業務手動覆寫率」——衡量自動分配演算法預設準不準，業務手動入帳後失去意義）。判斷錨點：每個指標皆能回答「誰、在什麼情境看、用來管理誰」。

閾值為起始建議值，SHALL 標「上線前 / 累積實務數據後校準」，prototype 階段不當硬規則。

| KPI | 定義 | 公式（as-built 實體）| 看的人 / 管理場景 | 健康 / 警示（暫定）| 詳細定義位置 |
|-----|------|---------------------|------------------|-------------------|---------|
| 收款達成率 | 該收的錢實收比例 | Σ 已完成入帳金額（PaymentAllocation where Payment 已完成、扣已完成退款）÷ Σ 應收期次金額（BillingInstallment.scheduled_amount where !cancelled 且 due_date ≤ 區間末）| 業務看自己、主管月會排名 | ≥ 95% / < 85% | 本 Requirement |
| 訂單異動率 | 成立後又改金額 / 退補比例（反映前期報價品質）| count(有非系統內生 OrderAdjustment 的訂單) ÷ count(該業務該期間成立訂單)；可拆補收 / 退款子率 | 業務看自己、主管看誰常事後補退 | < 15% / > 30%（退款子率 > 10% 須檢討報價）| 本 Requirement |
| 對帳差錯率 | 三方（應收 / 發票 / 收款）對不起來的訂單比例 | count(應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額 的訂單) ÷ count(該期間有應收 / 已開票訂單)| 會計月結追、主管看自己組 | = 0% / > 0% 即列管 | § 三方對帳檢視面板 |
| 逾期收款率 | 過應收日未收金額占比（含 30 / 60 / 90 帳齡）| Σ scheduled_amount（BillingInstallment where 收款維度 ≠ 已收訖 且 overdue_days > 0）÷ Σ scheduled_amount（!cancelled 期次）| 業務看自己、主管催收盯人 | < 5% / > 15%（90 天以上單獨列管）| § 收款逾期天數指標 |
| 預收未沖比例 | 溢收預收桶掛著沒沖 / 沒退金額 | Σ allocated_amount（PaymentAllocation where billing_installment_id = NULL）÷ Σ 已完成入帳金額（或看絕對金額 + 筆數）| 業務 / 會計收尾 | 趨近 0 / 單筆 > 30 天未處理 | 本 Requirement |
| 開票及時率 | 該開的票有沒有在預計開票日前開出 | count(已開立且 Invoice.issued_at ≤ expected_invoice_date 的期次) ÷ count(已過 expected_invoice_date 的期次)| 業務 / 會計月結看漏開 | ≥ 95% / < 80% | 本 Requirement |
| 收款變更率 | 業務對款項操作的穩定性 | 見 § 訂單收款變更率指標 | 主管看誰老改期次 / 入帳明細 | 待校準 | § 訂單收款變更率指標 |

平均收款天數（DSO）列為次要——偏經營趨勢指標、受客戶帳期影響非業務全可控，**定義保留、視覺化後驗 dashboard epic、不在本批實作**（依 MEMORY「核心流程完成前不規劃 dashboard 類功能」）。實作優先序：收款達成率 / 訂單異動率 / 對帳差錯率 / 逾期收款率為第一批，其餘第二批（非「效益低砍掉」，是分批落地）。

#### Scenario: 業務主管月會看組員收款達成率

- **GIVEN** 業務 A 本月應收期次合計 1,000,000、已完成入帳 920,000
- **WHEN** 業務主管於月會檢視收款達成率
- **THEN** 業務 A 收款達成率 SHALL = 92%（低於 95% 健康線，主管關注）

#### Scenario: 移除產品機制指標「業務手動覆寫率」

- **GIVEN** unify-billing change 曾定義「業務手動覆寫率」衡量系統依序填滿預設被業務改的比例
- **WHEN** 入帳機制改為業務手動（無系統自動預設值可供覆寫）
- **THEN** 「業務手動覆寫率」SHALL 移除（無可覆寫的自動值、且非營運管理 KPI）

### Requirement: 訂單收款變更率指標（Miles 補充指標 ⑩）

系統 SHALL 統計每張訂單的「收款變更率」derived 指標（營運管理 KPI——業務主管管理組員操作穩定性用），用於業務主管月會檢視業務對訂單款項操作的整體穩定性。
- **公式**：每張訂單 = sum(該訂單期次與入帳相關修改事件次數)；業務層級彙總 = 該業務訂單的平均每訂單修改次數（不再除以 Payment 數——Payment 數無營運管理意義）
- **修改事件涵蓋**：DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED + SPLIT + CANCELLED + PAYMENT_ALLOCATION_SET（業務手動建立 / 修改入帳明細；取代已廢自動分配模型的 PAYMENT_ALLOCATION_OVERRIDDEN + PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE 兩事件）；BILLING_INSTALLMENT_CREATED 不計入
- **與既有 BillingInstallment.change_count 差異**：change_count 是期次層級變更頻率、本指標是訂單層級整體收款相關修改頻率（含期次調整 + 入帳明細修改兩類）

#### Scenario: 計算訂單收款變更率

- **GIVEN** 某訂單有 5 個期次與入帳相關修改事件（2 個 DUE_DATE_CHANGED + 1 個 SPLIT + 2 個 PAYMENT_ALLOCATION_SET）
- **WHEN** 系統計算該訂單收款變更率
- **THEN** 該訂單修改次數 = 5；業務層級彙總 = 該業務所有訂單修改次數平均
- **AND** 健康範圍待累積實務數據後校準（暫不設警示閾值）

### Requirement: 收款逾期天數指標（Miles 補充指標 ⑪，沿用 v1.13 spec L1609）

`BillingInstallment.overdue_days` derived field SHALL 沿用 v1.13 spec L1609 既有設計：
- payment_status ≠ 已收訖 且 due_date 不為空時：overdue_days = TODAY − due_date
- payment_status = 已收訖 或 due_date 為空時：overdue_days = NULL

訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 BillingInstallment 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）+ 逾期自動通知 + 應收帳款 Dashboard 不在本 change 範疇。

#### Scenario: BillingInstallment 逾期天數自動計算

- **GIVEN** BillingInstallment BI-100.payment_status = 未收、due_date = 2026-04-01
- **WHEN** 系統於 2026-05-06 顯示 BI-100
- **THEN** BI-100.overdue_days SHALL = 35

#### Scenario: 已收訖 BillingInstallment 不算逾期

- **GIVEN** BI-101.payment_status = 已收訖、due_date = 2026-04-01
- **WHEN** 系統顯示 BI-101
- **THEN** BI-101.overdue_days SHALL = NULL

### Requirement: OrderActivityLog 擴充 7 個事件型別

OrderActivityLog SHALL 新增以下 7 個事件型別記錄 BillingInstallment 與 PaymentAllocation 的稽核軌跡：

| 事件型別 | 觸發時機 | 記錄欄位 |
|---------|---------|---------|
| BILLING_INSTALLMENT_CREATED | 新建 BillingInstallment | operator / timestamp / billing_installment_id / scheduled_amount / source_type |
| DUE_DATE_CHANGED | 修改 BillingInstallment.due_date | operator / timestamp / billing_installment_id / old_value / new_value |
| EXPECTED_DATE_CHANGED | 修改 BillingInstallment.expected_invoice_date | 同上 |
| SPLIT | 拆期（原期次 cancelled=true + 建兩筆新期次）| operator / timestamp / original_installment_id / new_installment_ids[] / split_spec |
| CANCELLED | 期次取消（cancelled = true）| operator / timestamp / billing_installment_id / cancel_reason |
| PAYMENT_ALLOCATION_OVERRIDDEN | 業務手動覆寫 PaymentAllocation（diff-based） | operator / timestamp / payment_allocation_id / old_allocated / new_allocated |
| PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE | Payment 切已完成後業務調整 PaymentAllocation（CEO Challenge 4） | operator / timestamp / payment_allocation_id / payment_id / old_allocated / new_allocated |

#### Scenario: 拆期觸發 SPLIT 事件 + 兩個 BILLING_INSTALLMENT_CREATED 事件

- **WHEN** 業務拆 BI-110 為 BI-110-A + BI-110-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件（original_installment_id=BI-110.id, new_installment_ids=[BI-110-A.id, BI-110-B.id], split_spec=「2500/75500 各自 due_date」）
- **AND** 系統 SHALL 寫入兩筆 BILLING_INSTALLMENT_CREATED 事件（各新期次一筆）

### Requirement: 收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導

系統 SHALL 沿用 v1.13 Payment 主結構，但 paymentPlanId 欄位 SHALL 不再強制必填、不再透過 Payment 直接關聯期次；Payment 與期次的關聯 SHALL 改為透過 PaymentAllocation N:M 推導。

v1.13 既有 Payment Requirement 主體沿用，但 `paymentPlanId` 欄位 **REMOVED**（不再強制必填、不再透過 Payment 直接關聯期次）。Payment 與期次的關聯改為透過 PaymentAllocation N:M 推導：sum(PaymentAllocation where payment_id = X).billing_installment_id distinct = Payment 對應的期次清單。

#### Scenario: Payment 不再有 paymentPlanId 欄位

- **WHEN** 業務建立 Payment
- **THEN** Payment 紀錄 MUST NOT 包含 paymentPlanId 欄位
- **AND** 對應期次清單 SHALL 透過 PaymentAllocation 表查詢推導

### Requirement: 訂單列表印件子層展開

訂單列表（OrderList）SHALL 支援以可展開列（inline expandable row）在父層訂單下方展開該訂單的印件子層，讓業務順著「訂單入口」直接查看印件的審稿與印製狀態，無需進入訂單詳情頁。父層訂單既有欄位與行為 SHALL 維持不變，子層為新增能力。

子層 SHALL 顯示該訂單下全部印件（「已棄用」狀態除外），欄位包含：印件名稱（含印件類型標籤與協力標籤）、審稿狀態、印件狀態、交期、操作（共 5 欄）。為符合列表頁子表規範（DESIGN.md：子表 ≥6 欄或含圖片 SHALL 改 Side Panel，避免 row 高度爆增），子層維持 5 欄且不含縮圖——縮圖於「檢視」開啟的印件詳情 Side Panel 內呈現。子層 SHALL NOT 顯示生產相關欄位（生產數量／預計產線／難易度／工單數／排程時間／負責印務），亦 SHALL NOT 重複顯示父層訂單已有的案名／客戶／訂單編號。

本 Requirement SHALL NOT 改變訂單列表既有的訂單可見範圍（業務角色範圍過濾議題見 OQ ORD-024）；訂單列表與印件總覽兩個印件入口的分工邊界見 OQ ORD-023。

#### Scenario: 展開訂單列查看印件子層
- **WHEN** 業務在訂單列表點擊某訂單列的展開箭頭
- **THEN** 該訂單列下方 inline 展開印件子層，逐列顯示該訂單的印件，欄位依序為印件名稱（含印件類型標籤與協力標籤）、審稿狀態、印件狀態、交期、操作（共 5 欄、不含縮圖）

#### Scenario: 子層同時呈現審稿與印件兩維度狀態
- **WHEN** 印件子層渲染某一印件
- **THEN** 審稿狀態欄顯示該印件的審稿維度狀態、印件狀態欄顯示印製維度狀態，兩欄分開呈現，使業務能一次回答客戶「稿子審到哪」與「印件做到哪」

#### Scenario: 子層顯示訂單下全部印件含已完成
- **WHEN** 訂單含已送達或製作完成的印件
- **THEN** 子層仍顯示這些印件（不沿用印件總覽「製作完成隱藏」的過濾），僅「已棄用」印件除外，確保客戶查詢已完成印件（如簽收狀況）時業務查得到

#### Scenario: 搜尋印件名稱命中時過濾並自動展開
- **WHEN** 業務在訂單列表搜尋框輸入印件名稱或編號
- **THEN** 列表過濾為僅含命中印件的訂單、重置至第一頁、命中的訂單自動展開、命中的印件列以高亮標示

#### Scenario: 搜尋同時涵蓋訂單層與印件層欄位
- **WHEN** 業務輸入的關鍵字符合訂單編號／客戶／案名，或符合任一印件的名稱／編號
- **THEN** 該訂單保留於過濾結果中；若因印件層命中而保留，則自動展開該訂單並高亮命中印件

#### Scenario: 清空搜尋後收合並還原全集
- **WHEN** 業務清空搜尋框
- **THEN** 所有展開的子層收合、列表還原為未過濾的全部訂單

#### Scenario: 子層檢視開啟印件詳情且內容完整
- **WHEN** 業務點擊子層某印件的「檢視」
- **THEN** 開啟印件詳情 Side Panel，且「相關工單」與「審稿紀錄」區塊正確顯示對應資料（非空白）

#### Scenario: 訂單尚無印件時的展開行為
- **WHEN** 訂單尚未建立任何印件
- **THEN** 該訂單列的展開箭頭呈現不可展開狀態，或展開後顯示「此訂單尚無印件」空狀態提示

### Requirement: 訂單列表角色可見範圍

訂單列表 SHALL 依使用者角色決定可見訂單範圍：業務與諮詢（業務平台語境）SHALL 僅見自己負責（`order.salesPerson` 等於當前使用者）或被分享（`sharedMembers` 含當前使用者）的訂單；業務主管（中台語境）SHALL 見全公司訂單。此範圍過濾 SHALL 一併套用於印件子層——印件子層可見的印件繼承過濾後的訂單範圍，業務 SHALL NOT 透過子層看到其他業務未分享訂單的印件。

本 Requirement 修正 OrderList 目前對業務無範圍過濾的現況落差；訂單分享成員（`sharedMembers`）的維護沿用訂單詳情頁既有分享機制，本能力僅消費該資料做過濾。

#### Scenario: 業務僅見自己負責與被分享的訂單
- **WHEN** 業務角色開啟訂單列表
- **THEN** 列表僅顯示該業務負責的訂單，以及被分享給該業務的訂單；其他業務的未分享訂單不顯示

#### Scenario: 業務主管見全公司訂單
- **WHEN** 業務主管角色開啟訂單列表
- **THEN** 列表顯示全公司所有訂單，不套用角色範圍過濾

#### Scenario: 諮詢角色比照業務套用範圍過濾
- **WHEN** 諮詢角色開啟訂單列表
- **THEN** 套用與業務相同的範圍過濾（自己負責 ∪ 被分享）

#### Scenario: 角色範圍過濾套用於印件子層
- **WHEN** 業務展開訂單列表的印件子層
- **THEN** 僅能展開其可見訂單（自己負責或被分享）的印件子層，無法看到其他業務未分享訂單的印件

### Requirement: 發票 Tab 雙層展開（發票列表 + 折讓單子層）

訂單詳情頁發票 Tab 的發票列表 SHALL 採雙層展開呈現（沿用訂單列表印件子層的 `ErpExpandableRow` 範式）。父層 SHALL 精簡為 8 欄：toggle / 發票號碼 / 類別 / 金額（含稅）/ 買受人 / 狀態 / 折讓衍生標籤 / 操作；「對帳編號（藍新自訂）」與「開立人 / 時間」SHALL 移入發票詳情 Side Panel，不在父層顯示。

子層展開內容 SHALL 為該發票的折讓單（SalesAllowance）清單，精簡為 5 欄：折讓號 / 金額 / 原因 / 狀態 / 操作（作廢折讓 + 上傳回簽檔）。折讓的退款 Payment 關聯 SHALL 以「已關聯退款 / 未關聯退款」小標記呈現（不另立欄位）；該發票剩餘可折讓金額 SHALL 顯示於子層區塊標題。

發票級操作（檢視 / 開立折讓 / 作廢發票 / 下載）SHALL 集中於父層操作欄；子層 MUST NOT 放置發票級操作按鈕。操作欄的點擊 MUST NOT 觸發父列展開 / 收合。

#### Scenario: 父層精簡欄位與操作欄

- **WHEN** 業務於訂單詳情頁切換至發票 Tab
- **THEN** 發票列表父層 SHALL 顯示 8 欄（toggle / 發票號碼 / 類別 / 金額（含稅）/ 買受人 / 狀態 / 折讓衍生 / 操作）
- **AND** 父層 SHALL NOT 顯示「對帳編號」與「開立人 / 時間」欄
- **AND** 父層操作欄 SHALL 含「檢視」按鈕；發票狀態為「開立」時另含下載 / 開立折讓 / 作廢發票

#### Scenario: 展開有折讓的發票顯示折讓單子層

- **GIVEN** 一張已開立發票有至少一筆已確認折讓
- **WHEN** 業務點擊該發票父列展開
- **THEN** 子層 SHALL 顯示折讓單清單 5 欄（折讓號 / 金額 / 原因 / 狀態 / 操作）
- **AND** 已關聯退款 Payment 的折讓 SHALL 顯示「已關聯退款」標記、未關聯者顯示「未關聯退款」標記
- **AND** 子層區塊標題 SHALL 顯示該發票剩餘可折讓金額

#### Scenario: 展開無折讓的發票顯示空狀態

- **WHEN** 業務展開一張尚無折讓的發票
- **THEN** 子層 SHALL 顯示空狀態文字「尚無折讓紀錄」（已作廢且無折讓者顯示「此發票已作廢，無折讓紀錄」）
- **AND** 子層 MUST NOT 出現「開立折讓」按鈕（發票級操作僅於父層操作欄）

### Requirement: 發票詳情 Side Panel（InvoiceDetailSidePanel）

發票列表父層操作欄的「檢視」按鈕 SHALL 開啟發票詳情 Side Panel（唯讀，size=2xl / 800px，對齊 Figma node `8977:269607` 規格）。Side Panel SHALL 依 DESIGN.md §1.5 透過 SidePanel 共用元件組（SidePanelBody / SidePanelSection / SidePanelInfoTable / SidePanelTable）組裝，MUST NOT 使用詳情頁專用卡（ErpDetailCard 等）。

Side Panel SHALL 分四區塊：(1) 發票資訊（含對帳編號、藍新開立序號、防偽隨機碼、課稅別、開立人 / 時間、備註；作廢發票補作廢原因 / 作廢人 / 時間）、(2) 買受人資訊（類別 / 名稱 / 統編 / 地址 / 信箱；B2C 補載具 / 捐贈）、(3) 品項明細（五欄唯讀：商品名稱 / 數量 / 單位 / 單價 / 小計 + 銷售額 / 稅額 / 含稅總額）、(4) 對應收款（derived 自 PaymentAllocation，純展示）。

Side Panel 與發票列表子層的職責邊界：Side Panel SHALL 承載發票本身詳情，MUST NOT 含折讓單清單（折讓單清單僅於父層子層展開），兩者不重複。

#### Scenario: 點檢視開啟發票詳情 Side Panel 四區塊

- **WHEN** 業務點擊發票列表父層操作欄「檢視」
- **THEN** 系統 SHALL 開啟發票詳情 Side Panel
- **AND** Side Panel SHALL 顯示「發票資訊」「買受人資訊」「品項明細」「對應收款」四區塊標題
- **AND** Side Panel 標題列 SHALL 顯示發票號碼 + 類別 Badge + 狀態 Badge；發票狀態為「開立」時提供「下載發票」動作

#### Scenario: 品項明細五欄唯讀呈現

- **WHEN** 業務於 Side Panel 檢視品項明細區
- **THEN** 品項 SHALL 以五欄唯讀表格呈現（商品名稱 / 數量 / 單位 / 單價 / 小計）
- **AND** 單價欄標題 SHALL 依發票類別標示稅基（B2B 未稅 / B2C 含稅）
- **AND** 區塊底部 SHALL 顯示銷售額（未稅）/ 稅額 / 含稅總額

#### Scenario: 對應收款 derived 與先開後付提示

- **WHEN** 一張發票尚無核銷收款（先開後付情境）
- **THEN** Side Panel 對應收款區 SHALL 顯示提示「尚未核銷收款」（不顯示空表格）
- **AND** 已有核銷分配時 SHALL 列出收款 ID / 收款方式 / 收款時間 / 分配金額並顯示合計

### Requirement: 發票開立 Dialog 版型（Figma 9041:297881 對齊）

訂單詳情頁開立電子發票 Dialog SHALL 對齊 Figma node `9041:297881` 版型：Dialog 寬度 720px、最大高度 800px；標題列（header）與動作列（footer 取消 / 確認）SHALL 固定，中間表單內容區 SHALL 可獨立滾動；表單區塊之間（基本資訊 / 商品明細 / 備註）SHALL 以分隔線區分。

開立 Dialog 的商品明細 SHALL 透過五欄輸入元件（`InvoiceItemTable`：商品名稱 / 數量 / 單位 / 單價 / 小計）填寫，落實「發票品項符合 ezPay 與電子發票法規硬約束」Requirement；小計 SHALL 由系統計算（數量 × 單價）且唯讀。MUST NOT 以僅有「商品名稱 + 金額」兩欄、數量 / 單位寫死的簡化形式呈現。

#### Scenario: 開立 Dialog 版型（固定 header/footer + 滾動 body + 分隔線）

- **WHEN** 業務於發票 Tab 點擊「手動開立」開啟開立 Dialog
- **THEN** Dialog 寬度 SHALL 為 720px、標題列與取消 / 確認動作列 SHALL 固定
- **AND** 中間表單內容超出時 SHALL 可獨立滾動（header / footer 不隨之捲動）
- **AND** 基本資訊 / 商品明細 / 備註區塊之間 SHALL 以分隔線區分

#### Scenario: 商品明細五欄輸入

- **WHEN** 業務於開立 Dialog 編輯商品明細
- **THEN** 商品明細 SHALL 提供五欄（商品名稱 / 數量 / 單位 / 單價 / 小計）
- **AND** 業務 SHALL 可自由輸入數量與選擇單位（不再被寫死為數量 1 / 單位「式」）
- **AND** 小計欄 SHALL 由系統計算（數量 × 單價）並唯讀顯示

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

### OrderAttachment（訂單其他附件）

> relax-order-detail-edit-conditions change 新增。承載非回簽用途的訂單相關文件（合約 / 規格說明 / 客戶聲明 / 補充說明等）。
> 與 OrderSignedFile（回簽檔案）並存於訂單詳情頁 Tab 9，但 MUST NOT 觸發任何狀態推進。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬訂單 | order_id | FK | Y | Y | FK -> Order |
| 檔案網址 | file_url | 字串 | Y | Y | 既有 mock file upload 機制 |
| 檔案名稱 | file_name | 字串 | Y | Y | 原始上傳檔名 |
| 用途說明 | purpose_note | 文字 | Y | | free-text，業務上傳時填寫；上限 200 字（例：「合約掃描」「規格說明書」「客戶聲明」）|
| 上傳者 | uploaded_by | FK | Y | Y | FK -> 使用者 |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | ISO 8601 |

**與 OrderSignedFile 的語意分離**：

| 概念 | OrderSignedFile | OrderAttachment |
|------|----------------|-----------------|
| 用途 | 客戶印 / 簽名後回傳的報價 / 訂單確認文件（既有設計）| 其他訂單相關文件（合約 / 規格說明 / 客戶聲明 / 補充說明 / 等）|
| 用途欄位 | 無（固定為「回簽」用途）| `purpose_note` free-text |
| 上傳觸發狀態推進 | 首次上傳於「報價待回簽」狀態時 SHALL 推進至「已回簽」| MUST NOT 觸發任何狀態推進 |
| 分桶 | 不分桶（單一用途）| 不分桶（v1.13 議題 2 拍板；新 OQ ORD-019 上線前驗證是否轉 LOV）|

**未來升級路徑**：累積 ≥ 20 筆 OrderAttachment.purpose_note 樣本後，若樣本可歸納為 5-7 個 LOV 選項，則上線前轉 `purpose_type` enum 欄位（保留 purpose_note 作補充說明）；見 [[ORD-019]] OQ。

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
| 商品明細 | items | InvoiceItem[] | Y | | 結構同 § InvoiceItem；可從 BillingInstallment.items（一鍵開票繼承）或訂單印件預填，業務可編輯 |
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

### InvoiceItem（發票品項子結構，對應 Invoice.items[]）

> align-invoice-line-items-to-ezpay-spec change 新增。
> Invoice 實體 `items` 欄位陣列元素的明文展開結構。對應藍新 EZP_INVI 1.2.2 § 4-(一)-3 PostData ItemName / ItemCount / ItemUnit / ItemPrice / ItemAmt 五欄。
> 外部硬約束來源：[2026-05-26-miles-upload-ezpay-invoice-api-spec raw 卡](../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

| 欄位 | 英文名稱 | 對應藍新 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|---------|------|------|------|------|
| 商品名稱 | name | ItemName | 字串 (≤ 30) | Y | | 例：彩色名片 |
| 商品數量 | count | ItemCount | 整數 | Y | | 純整數，0 < count ≤ 99999 |
| 商品單位 | unit | ItemUnit | 列舉 | Y | | 來自 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md)（11 項：張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批 / 式 / 組）|
| 商品單價 | unit_price | ItemPrice | 整數 | Y | | B2B 為未稅 / B2C 為含稅；純整數 |
| 商品小計 | item_amount | ItemAmt | 整數 | Y | Y | 系統計算 = count × unit_price |

**送藍新對應**：Invoice.items 陣列 N 筆品項轉成藍新 PostData 五欄字串時，以 `|` 為分隔符（例：`ItemName="商品一|商品二"` / `ItemCount="1|2"`）。

### PlannedInvoice（預計發票）— 已廢止，由 BillingInstallment 取代

> **BREAKING（unify-billing-installment-and-reconciliation-csv 2026-05-28 歸檔）**：PlannedInvoice 實體已廢止，由 BillingInstallment（請款期次）統一實體取代（合併原 PaymentPlan + PlannedInvoice 雙頭維護）。
> 欄位對應：`status`（預計開立 / 已開立 / 已取消）→ `invoicing_status`（未開立 / 已開立 / 已作廢）+ `cancelled` boolean（對應見 [state-machines spec](../state-machines/spec.md) § BillingInstallment 取代 PlannedInvoice 狀態機）；`expected_date` → `due_date` / `scheduled_issue_date`；`scheduled_amount` / `description` / `items: InvoiceItem[]` / `linked_invoice_id` / `created_by` / `created_at` / `updated_at` 沿用語意。
> `items: InvoiceItem[]` 品項鏈式預填語意（建立時從訂單印件預填、印件異動不連動、一鍵開票深拷貝至 Invoice）已移轉至 § Requirement: BillingInstallment 品項鏈式預填 + § Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承。
> 自動建立規則（諮詢訂單收尾不做大貨 / 需求單流失自動建、諮詢取消 MUST NOT 自動建）見 § Requirement: 諮詢訂單收尾自動建 BillingInstallment 規則。
> Prototype 階段三型別檔（`src/types/plannedInvoice.ts` 等）暫留作 `buildBillingInstallmentsFromLegacy` seed data（R2 deferred），業務 UI 三層 dead code 已於 remove-legacy-payment-plan-planned-invoice-junction（2026-05-29）移除。

**BillingInstallment 完整實體欄位表尚未獨立寫入本 spec Data Model section**（unify-billing change 以 Requirements + 雙維度狀態機定義 BillingInstallment，未補 Data Model 實體表）。完整雙維度狀態機定義見 [state-machines spec](../state-machines/spec.md) § BillingInstallment 雙維度狀態機；承載屬性（應收日 / 預計金額 / 預計開票日 / 品項 / 備註 / source_type / 原始日期凍結基準 / 變更歷史）見 § Requirement: 請款期次（BillingInstallment）統一實體。

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
