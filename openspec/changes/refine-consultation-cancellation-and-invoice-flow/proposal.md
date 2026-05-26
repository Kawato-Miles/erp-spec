## Why

既有 [consultation-request spec § 諮詢取消觸發建諮詢訂單與退費](../../specs/consultation-request/spec.md) 採全額退費（諮詢費 2000 → 退 2000），業務側已決定改為「半額退費」政策（取消一律退 50%，諮詢費 2000 → 退 1000），保留 50% 作為公司前置投入成本的部分認列。同時既有 [諮詢費發票時間點處理](../../specs/consultation-request/spec.md) 透過 `consultation_invoice_option`（`issue_now` / `defer_to_main_order`）區分自動開立 Invoice 時機，但實際情境（不做大貨 / 需求單流失 / 諮詢取消）下 `defer_to_main_order` 都「沒有主訂單可合併」、最終還是必須當下開立，邏輯反直覺；加上現有「自動開 Invoice + 自動開 SalesAllowance 沖銷」對諮詢取消情境造成發票流水複雜、會計與客戶都不易理解。

本 change 一次處理兩件互相耦合的議題：

1. 將諮詢取消退費改為半額（諮詢費 × 50%），並以 OrderAdjustment 載體記錄半額退款而非直接調整 OrderExtraCharge — 對齊既有「應收 = OEC + ∑OA」對帳公式，保留「收 2000 / 退 1000」雙筆 Payment 流水
2. 廢止諮詢費 Invoice 在「不做大貨 / 需求單流失 / 諮詢取消」三個收尾情境的全部自動化邏輯，統一改為由系統自動建 PlannedInvoice（待開發票）作為待辦提醒，由諮詢人員手動轉成實際 Invoice — 對齊 [付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md) 中 PlannedInvoice 既有的「業務規劃發票時程」定位

本 change 服務 Phase 2 北極星指標「訂單流程完整完成率 ≥ 60%」：諮詢前置流程的取消政策與發票生命週期釐清，是業務 / 諮詢日常工作系統化的基礎。Vault 對應卡：[諮詢單實體](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)、[諮詢角色](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)。

對應既有 Open Question：[CR-3 諮詢取消三項擴充議題](../../../memory/erp/ERP_Vault/08-open-questions/CR-3-諮詢取消三項擴充議題.md) 三個議題（部分退費 / 取消理由 / 退款 SLA）本 change 一併解決，CR-3 隨本 change archive 標為 resolved。

## What Changes

### A. 諮詢取消改為半額退費（50%）

- 諮詢取消時系統 SHALL 一律退諮詢費 50%（諮詢費 2000 → 退 1000），不分時機、不分客戶 / 諮詢人員主動，固定比例 hardcode in code、不開放系統設定
- **BREAKING**：取消觸發建單流程改為：建諮詢訂單（OEC=2000）+ Payment 轉移 +2000 + **自動建 OrderAdjustment(-1000, type=諮詢取消退費, status=已核可, approved_by=system)** + Payment(-1000, linkedOrderAdjustmentId=該 OA, status=處理中)
- 諮詢訂單最終應收 = OEC(2000) + ∑OA(-1000) = 1000；收款淨額 = +2000 - 1000 = 1000；對帳通過

### B. 新增 OrderAdjustment.adjustment_type enum 第 9 值「諮詢取消退費」

- **BREAKING**（enum 擴充）：既有 8 值（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）→ 9 值
- 新增「諮詢取消退費」專用 type，僅由系統於諮詢取消觸發點建立，業務不可手動選用

### C. 諮詢取消權限限縮

- 取消權限限定為「當前 consultant_id」（已認領該諮詢單的諮詢人員自己）+「諮詢主管」
- **BREAKING**：移除既有 spec 內「業務點擊取消諮詢」條款，業務不可取消諮詢

### D. 新增 ConsultationRequest.cancel_reason_category 必填欄位

- 取消時必填 enum 6 值：找到其他廠商 / 預算問題 / 需求改變 / 時間無法配合 / 諮詢人員無法出席 / 其他（原因請參考備註）
- 不新增 `cancel_reason_note` 欄位，補充說明（特別在「其他」情境）寫入既有 `consultant_note`

### E. 諮詢費 Invoice 自動化全面退場 → 改為自動建 PlannedInvoice

- **BREAKING**：廢止諮詢費 Invoice 在三個收尾情境的全部自動化邏輯：
  - 諮詢結束不做大貨（既有 `issue_now` 與 `defer_to_main_order` 兩條自動開 Invoice 分支）
  - 需求單流失（既有兩條自動開 Invoice 分支）
  - 諮詢取消（既有 `issue_now` 自動開 Invoice + SalesAllowance 邏輯）
- 改為統一行為：諮詢訂單建立時系統 SHALL 自動建 PlannedInvoice 1 筆，由諮詢人員後續手動轉為實際 Invoice：

  | 情境 | 自動建 PlannedInvoice |
  |------|----------------------|
  | 諮詢結束不做大貨 | 1 筆 2000 元，description=「諮詢費」 |
  | 需求單流失（已轉需求單後）| 1 筆 2000 元，description=「諮詢費」 |
  | 諮詢取消 | 1 筆 1000 元，description=「諮詢費（取消退費後）」 |
  | 諮詢結束做大貨 → 需求單成交轉一般訂單 | 不自動建（業務於主訂單既有發票時程流程自行規劃）|

- PlannedInvoice 欄位帶入：`expectedDate` = 觸發時點當天、`status` = 預計開立、`createdBy` = system
- **BREAKING**：`consultation_invoice_option` 欄位從「自動化分支控制器」降為「客戶意向參考」純展示，不再驅動任何系統行為

### F. 諮詢訂單完成路徑簡化

- **BREAKING**：諮詢訂單狀態機簡化為單一短路徑：建立 → 製作等待中 →（諮詢人員切退款 Payment「已完成」、自動推進 OA「已執行」）→ 訂單完成
- 廢止既有 `issue_now` / `defer_to_main_order` 的「已開發票」分支（因為已不自動開 Invoice）

### G. 取消 dialog 防呆 + cancel_reason_category 必填

- 取消按鈕點擊後 SHALL 彈出二次確認 dialog：「確定取消？將自動建諮詢訂單並退款 1000 元，無法復原」+ cancel_reason_category 必選下拉
- dialog 不顯示 `consultation_invoice_option` 意向作為提示

### H. CR-3 OQ 全解 + design.md 紀錄設計決議

- 既有 OQ [CR-3 諮詢取消三項擴充議題](../../../memory/erp/ERP_Vault/08-open-questions/CR-3-諮詢取消三項擴充議題.md) 三個議題一次全解，隨本 change archive 標 resolved
- 衍生決議（CR-4 / CR-5 / CR-6 / CR-7 / CR-8）寫入本 change `design.md § Decisions`，不另開 OQ 卡

## Capabilities

### New Capabilities

無（本 change 全為既有 capability 補齊與行為修訂）。

### Modified Capabilities

- `consultation-request`：諮詢取消大幅改寫為半額退費 + 新增 cancel_reason_category 欄位 + 諮詢取消權限限縮 + 三情境 Invoice 自動化全面退場改 PlannedInvoice + invoice_option 降為純展示（7 段 Requirement 異動）
- `order-management`：OrderAdjustment.adjustment_type enum 8 → 9 值（新增「諮詢取消退費」）+ Scenario「待諮詢取消觸發建諮詢訂單」改寫 + 不做大貨 / 需求單流失兩個建單 Scenario 補 PlannedInvoice 自動建 + 諮詢取消對帳邏輯更新 + 新增「諮詢訂單收尾自動建 PlannedInvoice 規則」Requirement（5 段異動）
- `state-machines`：諮詢訂單完成路徑簡化為單一短路徑 + 待諮詢取消 Scenario 對齊（2 段異動）
- `business-processes`：諮詢前置流程端到端規則 ASCII 流程圖補 PlannedInvoice 節點與半額退費路徑（1 段異動）

## Impact

- **specs（4 個 modified）**：consultation-request（主要）、order-management、state-machines、business-processes
- **記憶檔（1 個 modified）**：Vault `08-open-questions/CR-3-諮詢取消三項擴充議題.md`（status → resolved，三議題全解、連結本 change archive 路徑）
- **Prototype 影響**（後續另案實作）：
  - 取消諮詢按鈕權限改寫（限 consultant_id 自己 + 諮詢主管，業務隱藏）
  - 取消 dialog 加 cancel_reason_category 必選下拉、防呆文案改為「退 1000 元」
  - 取消後系統建單流程拆解：諮詢訂單 + OEC + Payment 轉移 + **新增 OA(-1000)** + **新退款 Payment(-1000) 為「處理中」**（既有為 -2000 一次建完）
  - 諮詢結束不做大貨 / 需求單流失 / 諮詢取消：移除既有 Invoice 自動建立邏輯、改為自動建 PlannedInvoice
  - 諮詢單實體新增 `cancel_reason_category` 欄位
  - 諮詢單詳情頁 / 取消後諮詢訂單詳情頁：顯示取消理由
- **業務培訓**：
  - 諮詢取消政策變更（全額 → 半額）需通知諮詢人員與客服流程
  - 諮詢訂單建立後的「待開發票」由諮詢人員手動處理（不再系統自動開）
  - 客戶通知退款由諮詢人員手動執行（不入系統）
- **既有 archived change 牽動**：
  - [add-after-sales-ticket](../archive/) 定義 OA 8 值 enum，本 change MODIFY 為 9 值
  - [refactor-order-payment-and-invoice-with-billing-company](../archive/) 定義 invoice_option 自動化分支，本 change 廢止其對發票自動化的影響（invoice_option 欄位保留作客戶意向參考）
- **同時進行的 change 共存**：[align-business-consultation-coverage-gaps](../align-business-consultation-coverage-gaps/) 同時 modify order-management spec，但範圍互不重疊（前者改訂單前段審核 / 退款三組件 / 發票作廢折讓；本 change 改諮詢取消 / PlannedInvoice 自動化）；兩者 archive 時序由 Miles 決定
- **無新 OQ**（本 change 為既有 CR-3 OQ 的完整解 + 設計決議寫入 design.md）
