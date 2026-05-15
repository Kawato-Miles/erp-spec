## Why

`refactor-order-payment-and-invoice-with-billing-company` change（2026-05-07 歸檔）將帳務公司設計為與接單公司獨立的欄位，業務於需求單建立時需手動指定帳務公司，並提供「該接單公司近 30 天最常用：[BillingCompany 名稱]」軟性提示。

實際落地時 Miles 與業務確認，公司的接單品牌與帳務主體為**固定對應關係**，業務不應有選擇權：

- SSP 感官 / KAD 川人 → 感官股份有限公司（bc-ssp）
- BRO 柏樂 / EC 奕果 → 柏樂創意有限公司（bc-bro）

Prototype 已於 2026-05-06 依此規則調整：`CreateQuotePanel` / `EditQuotePanel` 拿掉「帳務公司」下拉、`mockBillingCompanies.ts` 加入 `inferBillingCompanyByAccount(accountCompany)` 推導函式、建單時自動帶入。

但 `quote-request` spec.md 仍維持「業務手動選帳務公司」的設計（L22 / § 帳務公司指定 / § 接單公司與帳務公司對應提示），與 prototype 實作不一致。doc-audit 於本次歸檔後跨檔案稽核時抓到此差異。

本 change 修正 spec 與 prototype 對齊，讓帳務公司由接單公司硬推導，業務無需選擇也不可手動覆寫。

## What Changes

- **修訂** `quote-request` capability：帳務公司由接單公司硬推導
  - 修訂「需求單建立與編輯」Requirement：建立時 MUST 指定接單公司；帳務公司由系統依接單公司推導，業務不選
  - 修訂「帳務公司指定」Requirement → 改名為「帳務公司自動推導」：規則為 SSP/KAD → bc-ssp、BRO/EC → bc-bro
  - **移除**「接單公司與帳務公司對應提示」Requirement：軟性引導下架，硬映射不需提示
  - QuoteRequest Data Model：`billing_company_id` 欄位由「Y 必填（業務指定）」改為「Y 必填（系統推導，唯讀）」

- **無 Prototype 變更**：實作已於 2026-05-06 完成（CreateQuotePanel / EditQuotePanel / inferBillingCompanyByAccount）

## Capabilities

### Modified Capabilities
- `quote-request`: 修訂「需求單建立與編輯」+ 修訂「帳務公司指定」→「帳務公司自動推導」+ 移除「接單公司與帳務公司對應提示」+ Data Model `billing_company_id` 改為系統推導唯讀欄位
