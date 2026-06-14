## Why

### Background

公司退款不即時退，集中在月底由會計統一出金：業務因訂單狀況調整金額（退款）後建立「處理中」的退款款項，業務主管月底彙整一份「要退哪些、各退多少、退到哪」的清單交會計，會計依清單逐筆匯款並掛匯款證明。此清單目前靠人工整理、未規格化。

商業需求正本：

- 業務規則：[待出金退款清單組成](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/待出金退款清單組成.md)（清單組成規則：資料源＝處理中退款款項逐筆、款項層非異動單層、出金即切已完成移出）
- 欄位：[帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) § 收款紀錄（已新增「退款收款帳號」欄位）
- 流程：[帳務流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/帳務流程.md) §6 月底現金流出
- 角色：[會計](../../../memory/Sens_wiki/wiki/erp/03-roles/會計.md)（執行出金）、[業務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/業務主管.md)（彙整清單）

### Problem Statement

退款款項建立後狀態為「處理中」（待出金），但系統無集中列管入口：會計看不到「目前有哪些處理中退款待匯款、各退多少、退到哪個戶頭」，只能靠業務主管以 Excel 人工彙整，且退款收款帳號未在款項建立時結構化記錄，出金時需另外問。需要一個唯讀列管視圖讓會計逐筆執行出金、切已完成移出清單。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `order-billing`：
  1. 新增 Requirement「待出金退款清單」——定義清單組成（款項類型＝退款 且 款項狀態＝處理中，逐筆一列）、出金後切已完成移出、會計／業務主管可見範圍。
  2. 退款款項建立時填「退款收款帳號」（欄位正本在 wiki [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) § 收款紀錄，spec 僅引用不複寫欄位表）。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `order-billing`：新增「待出金退款清單」Requirement（處理中退款款項的逐筆列管與出金執行視圖）；退款款項建立流程補「退款收款帳號」填寫點。

## Impact

- **相依模組**：無新增跨模組關聯。建立在既有 Payment 模型（`paymentType` ＝ 收款／退款、`paymentStatus` ＝ 處理中／已完成／已取消）與「退款流程三組件」Requirement（[order-billing spec § 退款流程三組件](../../specs/order-billing/spec.md)）組件 2「退款款項處理」之上。
- **Prototype 層**（[sens-erp-prototype](https://github.com/Kawato-Miles/sens-erp-prototype)）：
  - `types/payment.ts` Payment 新增「退款收款帳號」欄位。
  - `components/order/PaymentEditPanel.tsx` 款項類型＝退款時顯示「退款收款帳號」欄。
  - 新增獨立 finance 頁「待出金退款」（路由與導覽入口，與待開發票／應收款項並列），鏡像 `pages/finance/Receivables.tsx` 列表範式。
  - 清單列「檢視」開 side panel，重用既有「已完成 + 匯款證明附件」完成機制（complete-payment-status change 已歸檔）。
- **資料移轉**：退款收款帳號為新選填欄位，既有資料不需回填。
- **效能**：清單為 `paymentStatus = 處理中 且 paymentType = 退款` 的衍生查詢，量級小，MVP 不需特別優化。
- **不在範疇**（避免過度設計）：
  - order-billing spec 退款舊模型殘留文字清理（§ 退款 Payment 與折讓分離、§ 發票異動流程情境 C 等處仍寫「金額為負數、收款方式＝退款」舊模型，與現行 `paymentType` 正值模型不一致）——既有 wiki↔spec 落差，另案處理。
  - legacy finance 頁（待開發票／應收款項）與廢棄 change `add-pending-receivables-and-invoicing-pages` 的清理——另案。
