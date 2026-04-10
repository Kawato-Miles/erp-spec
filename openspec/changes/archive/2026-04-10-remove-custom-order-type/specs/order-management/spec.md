## MODIFIED Requirements

### Requirement: 訂單建立
系統 SHALL 支援兩種訂單建立方式：(1) 線下單由需求單成交後一鍵轉訂單，自動帶入印件規格、客戶資料、交期；(2) EC 線上單（含一般訂單與客製單）Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

#### Scenario: 線下單由需求單轉入
- **WHEN** 業務在成交需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿，自動帶入印件規格、客戶資料、交期（帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則）

#### Scenario: EC 訂單進入節點預留
- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（含一般訂單與客製單），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）
- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

### Requirement: 訂單確認觸發
系統 SHALL 支援訂單確認觸發：線下單 = 業務手動標記回簽（客戶回簽後）；線上單（含客製單）= 付款完成自動觸發（Phase 2，由 EC 同步）。

#### Scenario: 線下單業務手動確認
- **WHEN** 客戶印回簽後，業務在訂單頁面標記「已回簽」
- **THEN** 訂單狀態從草稿轉為已確認

#### Scenario: US-ORD-001 回簽後訂單確認推進
- **WHEN** 客戶印回簽後，業務在訂單頁面手動點擊「標記回簽」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「訂單確認」；活動紀錄 MUST 記錄操作人、操作類型與時間戳

## REMOVED Requirements

### Requirement: 訂單顧客資訊
**Reason**: ERP 端客製單建立功能移除，顧客資訊改由 EC 端管理
**Migration**: Phase 2 EC 同步時由 API 帶入顧客資訊

### Requirement: 訂單發票設定
**Reason**: ERP 端客製單建立功能移除，發票設定改由 EC 端管理
**Migration**: Phase 2 EC 同步時由 API 帶入發票設定

### Requirement: 訂單物流設定
**Reason**: ERP 端客製單建立功能移除，物流設定改由 EC 端管理
**Migration**: Phase 2 EC 同步時由 API 帶入物流設定

### Requirement: 訂單金額試算
**Reason**: ERP 端客製單建立功能移除，金額試算改由 EC 端處理
**Migration**: Phase 2 EC 同步時由 API 帶入金額資訊
