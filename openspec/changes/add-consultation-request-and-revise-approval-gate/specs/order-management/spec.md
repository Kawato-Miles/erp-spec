## MODIFIED Requirements

### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「已核准成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`from_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）、(c) 依 ConsultationRequest 的 `consultation_invoice_option`（若 `issue_now` 則立即在主訂單上開立諮詢費 Invoice）。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下三種「沒進大貨製作」收尾情境之一才建立（webhook 階段不建）：

3. 諮詢結束 - 不做大貨：諮詢人員點擊「結束諮詢 - 不做大貨」時建立
4. 需求單流失：ConsultationRequest 狀態 = 已轉需求單、需求單流失時，系統自動建立諮詢訂單收尾
5. 待諮詢取消（退費）：業務點擊「取消諮詢」時建立

三種情境共同的建立動作：(a) 訂單金額 = 諮詢費，(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) 依 invoice_option 與是否退費決定 Invoice / SalesAllowance 處理（見 [consultation-request spec](../consultation-request/spec.md) § 諮詢費發票時間點處理）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「已核准成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `from_consultation_request_id` 非空，諮詢費 = 1000、印件費 = 4000
- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 1000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，主訂單 SHALL 立即開立諮詢費 Invoice（金額 = 1000）
- **AND** 主訂單三方對帳：應收 = 5000 = 已收 1000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單

- **WHEN** ConsultationRequest 諮詢結束選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 需求單流失觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 待諮詢取消觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment（amount = -諮詢費、payment_method = 退款）

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

---

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

語意更新（vs refactor change）：原算式 `應收總額 = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)` 修訂為 `應收總額 = ∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`。`Order.total_with_tax` 為衍生欄位（從印件費與 OrderExtraCharge 計算而來）。

收款淨額算式同步調整以匹配 Payment polymorphic 設計（只計算當前訂單的 Payment，不計入 ConsultationRequest 上的 Payment）。

#### Scenario: 諮詢來源主訂單對帳通過

- **GIVEN** 主訂單印件費 4000、OrderExtraCharge(consultation_fee, 1000) = 1000、無其他 OrderAdjustment
- **AND** Payment 累計（綁主訂單）= 5000（諮詢費轉移 Payment 1000 + 後續補繳 Payment 4000）
- **AND** Invoice 累計開立 = 5000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 5000，發票淨額 SHALL = 5000，收款淨額 SHALL = 5000，差額 SHALL = 0
- **AND** 面板 SHALL 標記「對帳通過」

#### Scenario: 諮詢訂單對帳通過（不做大貨情境）

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、無印件費、無 OrderAdjustment
- **AND** Payment 綁諮詢訂單 = 1000、Invoice = 1000
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票 = 1000、收款 = 1000、差額 = 0

#### Scenario: 諮詢訂單退費對帳通過

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、issue_now 路徑
- **AND** Payment 綁諮詢訂單：諮詢費 1000 + 退款 -1000 = 0
- **AND** Invoice 1000 + SalesAllowance -1000，發票淨額 = 0
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票淨額 = 0、收款淨額 = 0、差額 = 1000

**註**：此情境差額 = 1000 反映「應收沒沖銷」，但實務上退費完成的諮詢訂單視為合法終態。對帳面板 SHALL 標示「退費完成（OrderExtraCharge 與 SalesAllowance / 退款抵銷）」而非「對帳通過」（細節見「諮詢取消對帳邏輯」ADDED Requirement）。

#### Scenario: 訂單異動 + 折讓退款的三方對帳

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000、開立發票合計 25,000、確認折讓 -10,000、收款合計 25,000、退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000（5000 + 20,000）、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

---

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

**Payment polymorphic 關聯設計（本 change MODIFY refactor change 設計）**：

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

#### Scenario: 業務記錄訂金收款

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 建立 Payment 紀錄（linked_entity_type = Order、linked_entity_id = 訂單 ID）
- **AND** 業務 MUST 填入金額、付款方式、收款時間、可選填第三方付款序號

#### Scenario: 諮詢費 webhook 建立的 Payment 關聯 ConsultationRequest

- **GIVEN** webhook 觸發、ConsultationRequest 已建立
- **WHEN** 系統建立諮詢費 Payment
- **THEN** Payment.linked_entity_type SHALL = `ConsultationRequest`
- **AND** Payment.linked_entity_id SHALL = consultation_request_id
- **AND** Payment.is_transferred SHALL = false

#### Scenario: PaymentPlan 期次狀態自動更新

- **WHEN** 某 PaymentPlan 的累計 Payment 金額 = scheduled_amount
- **THEN** 系統 SHALL 自動更新 PaymentPlan.status = 已收訖

---

## ADDED Requirements

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

**諮詢費的特殊路徑**：當訂單 `order_type = 諮詢` 或主訂單來自 ConsultationRequest 時（`from_consultation_request_id` 非空），系統 SHALL 自動建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，業務無需手動建立。

#### Scenario: 諮詢來源主訂單自動建 consultation_fee OrderExtraCharge

- **GIVEN** 需求單 `from_consultation_request_id = CR-202605-0001`、諮詢費 = 1000
- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
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

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX（from_consultation_request_id = CR-XXX）已核准成交
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

諮詢訂單（`order_type = 諮詢`）的 Invoice 開立邏輯 SHALL 依對應 ConsultationRequest 的 `consultation_invoice_option` 決定，MUST NOT 套用一般訂單的「業務 / 諮詢手動開立」流程（自動觸發）：

- `issue_now`：諮詢訂單建立時系統 SHALL 自動開立 Invoice（金額 = 諮詢費）
- `defer_to_main_order`：諮詢訂單建立時 MUST NOT 立即開 Invoice。但因諮詢訂單只在三種收尾情境出現，實作上：
  - 不做大貨 / 需求單流失情境：系統 SHALL 在諮詢訂單建立後自動開立 Invoice（沒有「主訂單可合併」的情境，必須當下開）
  - 待諮詢取消（退費）情境：系統 MUST NOT 開 Invoice（直接建退款 Payment、不開 Invoice 也不需 SalesAllowance）

實際上 `defer_to_main_order` 的「延後到主訂單」語意只在「諮詢結束做大貨需求單成交轉一般訂單」情境發揮作用 — 此時諮詢費以 OrderExtraCharge 形式進入主訂單，諮詢費 Invoice 由業務於主訂單正常開立流程涵蓋全額。

#### Scenario: defer_to_main_order 不做大貨諮詢訂單建立時開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`
- **AND** 諮詢人員選「結束諮詢 - 不做大貨」、系統建諮詢訂單
- **WHEN** 系統推進諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）
- **AND** 諮詢訂單推進至「已開發票 → 訂單完成」

#### Scenario: defer_to_main_order 需求單流失諮詢訂單建立時開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`、需求單流失、系統建諮詢訂單
- **WHEN** 系統推進諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）

#### Scenario: defer_to_main_order 待諮詢取消諮詢訂單不開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`、業務點擊取消
- **WHEN** 系統建諮詢訂單與退款 Payment
- **THEN** 系統 MUST NOT 開立 Invoice
- **AND** 諮詢訂單推進至「訂單完成」終態（退費完成）

#### Scenario: issue_now 諮詢訂單建立時開立 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、諮詢訂單建立（任一收尾情境）
- **THEN** 系統 SHALL 立即開立 Invoice（金額 = 諮詢費）

#### Scenario: issue_now 待諮詢取消開立 Invoice 與 SalesAllowance

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、業務點擊取消
- **WHEN** 系統建諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment
- **AND** 系統 SHALL 開立 SalesAllowance（金額 = -諮詢費）關聯該退款 Payment

---

### Requirement: 諮詢取消對帳邏輯

諮詢取消（待諮詢狀態退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並標示「退費完成」而非「對帳通過」或「待對帳」。

判定條件：諮詢訂單同時存在以下特徵時，視為退費完成：

- 至少一筆 Payment.amount > 0（諮詢費收款）
- 至少一筆 Payment.amount < 0（退款）
- ∑ Payment.amount = 0（收支抵銷）
- 若 issue_now 路徑：至少一筆 SalesAllowance 金額對應退款 Payment

對帳面板 SHALL 顯示：

- 應收：諮詢費（OrderExtraCharge）
- 已收：0（諮詢費 + 退款抵銷）
- 已開票（淨額）：0（issue_now：Invoice - SalesAllowance；defer_to_main_order：未開票）
- 標示：「退費完成 - 此筆諮詢已取消、款項已退回」

#### Scenario: 退費完成對帳標示

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000
- **AND** Payment：諮詢費 1000 + 退款 -1000 = 0
- **AND** issue_now 路徑：Invoice 1000 + SalesAllowance -1000 = 0
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 面板 SHALL 顯示「退費完成」標示
- **AND** 不標示為「對帳通過」或「待對帳」
