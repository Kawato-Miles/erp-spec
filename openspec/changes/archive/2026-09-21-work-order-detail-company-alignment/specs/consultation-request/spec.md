# consultation-request 規格差異檔：接單業務改名

> 本檔只改用詞。諮詢單的認領、轉需求單與改派行為一律不動。

## MODIFIED Requirements

### Requirement: 諮詢單轉需求單欄位帶入

當諮詢結束分支為「做大貨」時，系統 SHALL 建立新需求單（[quote-request spec](../quote-request/spec.md)）並依以下規則 mapping ConsultationRequest 欄位：

| 欄位類別 | ConsultationRequest 來源 | QuoteRequest 目的地 | 處理方式 |
|---------|--------------------------|---------------------|---------|
| 客戶資料 | customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension | 需求單客戶資料區 | 直接 mapping |
| 諮詢討論記錄 | `consultation_topic` + `consultant_note`（**合併雙區塊格式**）| 需求單 `requirement_note` | 合併 mapping，業務（即諮詢人員）可編輯（見下方雙區塊格式定義） |
| 數量級距預填 | estimated_quantity_band | 印件項目 `quantity` 預填 | 中間值預填：1-100→50；101-300→200；301-500→400；501-1000→750；1000+→1500（皆可業務手動調整） |
| 諮詢預約資訊 | reserved_date / reserved_time / visitor_count | 不帶入 | 已過期 |
| 印件規格細節 | （諮詢單不蒐集）| 印件規格欄位 | 由「需求確認中」狀態下業務（即諮詢人員）與客人交互填入 |
| 來源關聯 | consultation_request_id | `linked_consultation_request_id` | 反向關聯 |

**諮詢討論記錄合併 mapping 雙區塊格式**：諮詢轉需求單時，系統 SHALL 將 `consultation_topic`（客戶原話）+ `consultant_note`（諮詢人員筆記）合併為以下格式寫入需求單 `requirement_note` 預設值：

```
[客戶原話]
<consultation_topic 全文>

[諮詢人員筆記]
<consultant_note 全文>
```

`consultant_note` 為空時，雙區塊格式 SHALL 省略「[諮詢人員筆記]」區塊（只帶入 `[客戶原話]` 區塊）。`consultation_topic` 為空（理論上不會發生，因為是必填）時，雙區塊格式 SHALL 同樣省略對應區塊。

業務在需求單 `requirement_note` 上 SHALL 可再編輯（既有規則不變）；下游 spec / Prototype MUST NOT 依賴雙區塊格式做 parsing（純文字傳輸，業務可自由編輯）。

**諮詢人員 = 需求單接單業務**：諮詢人員轉需求單時，新建需求單的接單業務（owner）SHALL 設定為當前諮詢人員（即 `consultant_id`）。

需求單後續結局影響 Payment 轉移目的地：

- 需求單成交且業務轉訂單 → Payment 轉移至一般訂單，主訂單上建 OrderExtraCharge(consultation_fee)（見 [order-management spec](../order-management/spec.md) § Payment 跨實體轉移、§ 訂單其他費用明細）
- 需求單流失 → 系統建諮詢訂單收尾，Payment 轉移至諮詢訂單（見「需求單流失觸發建諮詢訂單收尾」Requirement）

#### Scenario: 諮詢結束建立需求單帶入欄位（含 consultant_note）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、客戶資料完整、`estimated_quantity_band = 101-300`、`consultation_topic` = 「想做名片，雙面 250g」、`consultant_note` = 「客戶確認要燙金 LOGO，預計 7 月初取件」
- **WHEN** 諮詢人員點擊「結束諮詢 - 轉需求單」
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料 MUST 自 ConsultationRequest 直接帶入
- **AND** `requirement_note` 欄位 MUST 以雙區塊格式帶入：
  ```
  [客戶原話]
  想做名片，雙面 250g

  [諮詢人員筆記]
  客戶確認要燙金 LOGO，預計 7 月初取件
  ```
- **AND** `linked_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** 印件預填 `quantity` MUST = 200（級距 101-300 中間值）
- **AND** 需求單接單業務 MUST = `consultant_id`

#### Scenario: consultant_note 為空時雙區塊省略諮詢人員筆記區塊

- **GIVEN** ConsultationRequest `consultation_topic` = 「想做 A4 海報 100 張」、`consultant_note` = NULL
- **WHEN** 諮詢人員點擊「結束諮詢 - 轉需求單」
- **THEN** 需求單 `requirement_note` 預設值 MUST 為：
  ```
  [客戶原話]
  想做 A4 海報 100 張
  ```
- **AND** 系統 MUST NOT 帶入空的「[諮詢人員筆記]」區塊

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `linked_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

#### Scenario: 業務於需求單 requirement_note 自由編輯雙區塊內容

- **GIVEN** 需求單已自諮詢單帶入 `requirement_note` 雙區塊預設值
- **WHEN** 業務於需求單詳情頁編輯 `requirement_note`，修改格式或新增內容
- **THEN** 系統 SHALL 允許自由編輯（既有 quote-request 規則不變）
- **AND** 編輯不影響上游 ConsultationRequest 的 `consultation_topic` / `consultant_note`（兩者解耦，僅在 mapping 時刻合併）

### Requirement: 諮詢單負責人改派

業務主管 SHALL 可於諮詢單詳情頁改派負責諮詢人員（`consultant_id`），即「重新指定認領人」，覆寫已有值。改派為改 owner 的管理動作。改派的通用規則（理由分類五值必填、五要素留痕、候選人以 Role 模組權限篩選、全公司範圍、改派不改狀態）沿用 wiki [業務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/業務主管.md) § 改派接單業務。

**與認領的區分**：本改派針對 `consultant_id` **已有值**（已認領）的諮詢單；`consultant_id` 為空時應走「認領 / 代為認領」（見 § Requirement: 諮詢人員認領），不走改派。

**允許改派狀態**：諮詢單 `status = 待諮詢`（含已認領）SHALL 可改派、且 MUST NOT 回退狀態（僅換人，維持「待諮詢」）。已轉需求單 / 完成諮詢 / 已取消為終態，禁改派。

#### Scenario: 業務主管改派已認領諮詢單

- **GIVEN** 諮詢單 `status = 待諮詢`、`consultant_id` 已有值（A 已認領）
- **WHEN** 業務主管點「改派負責人」、選新諮詢人員 B（候選 = 具諮詢權限的使用者）、必選理由分類、確認
- **THEN** 系統 SHALL 將 `consultant_id` 覆寫為 B
- **AND** SHALL 寫入活動紀錄五要素（原 / 新負責人、改派時間、理由分類與補述、操作主管；事件型別 = 「改派負責人」，與「認領」「代為認領」區分）
- **AND** 諮詢單狀態 MUST 維持「待諮詢」（不回退、不推進）

#### Scenario: 未認領諮詢單不走改派

- **GIVEN** 諮詢單 `status = 待諮詢`、`consultant_id` 為空
- **WHEN** 業務主管開啟該諮詢單詳情頁
- **THEN** SHALL 顯示「代為認領」入口、MUST NOT 顯示「改派負責人」入口（兩者互斥）

#### Scenario: 完成 / 取消諮詢單禁止改派

- **GIVEN** 諮詢單 `status ∈ {已轉需求單, 完成諮詢, 已取消}`
- **WHEN** 業務主管開啟該諮詢單詳情頁
- **THEN** 「改派負責人」入口 SHALL disabled
