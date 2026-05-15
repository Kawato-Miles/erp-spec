## 1. Spec 撰寫

- [x] 1.1 quote-request delta spec：修訂「需求單建立與編輯」Requirement（建立時 MUST 指定接單公司；帳務公司由系統推導）
- [x] 1.2 quote-request delta spec：修訂「帳務公司指定」Requirement → 改名為「帳務公司自動推導」（含 SSP/KAD → bc-ssp、BRO/EC → bc-bro 規則）
- [x] 1.3 quote-request delta spec：REMOVED「接單公司與帳務公司對應提示」Requirement（軟性引導下架）
- [x] 1.4 quote-request delta spec：Data Model `billing_company_id` 欄位由「業務指定」改為「系統推導，唯讀」

## 2. Prototype 已落地（既存）

- [x] 2.1 `mockBillingCompanies.ts` 含 `inferBillingCompanyByAccount` 函式（SSP/KAD → bc-ssp、BRO/EC → bc-bro）
- [x] 2.2 `CreateQuotePanel.tsx` 已移除「帳務公司」下拉欄位
- [x] 2.3 `EditQuotePanel.tsx` 已移除「帳務公司」下拉欄位
- [x] 2.4 既有 mock 資料 `billingCompanyId` 與 `accountCompany` 對齊

## 3. 歸檔準備

- [x] 3.1 openspec validate 通過
- [x] 3.2 main spec 合併（手動執行，因 archive 使用 --skip-specs flag）
- [x] 3.3 CLAUDE.md § Spec 規格檔清單：需求單版本由 v3.1 → v3.2 並補本 change 註腳
