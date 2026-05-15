## 設計脈絡

`refactor-order-payment-and-invoice-with-billing-company` change 的原始設計（v3.1 spec L373 § 帳務公司指定）將帳務公司視為「業務於需求單建立時指定的欄位」，並提供「該接單公司近 30 天最常用」的軟性提示協助業務選擇。

實際業務脈絡：接單公司本身就代表品牌歸屬（SSP 感官 / BRO 柏樂 / KAD 川人 / EC 奕果），而這四個品牌底下只有兩個法人主體：

| 接單公司 | 法人主體 / 帳務公司 | BillingCompany.id |
|---------|-----------------|-------------------|
| SSP 感官 | 感官股份有限公司 | bc-ssp |
| KAD 川人 | 感官股份有限公司 | bc-ssp |
| BRO 柏樂 | 柏樂創意有限公司 | bc-bro |
| EC 奕果 | 柏樂創意有限公司 | bc-bro |

由於對應關係固定且不會跨切（業務不會用 BRO 品牌出 SSP 公司的發票），讓業務多選一次帳務公司只會增加錯選風險，不會增加彈性。Miles 於 2026-05-06 拍板（OQ-6）改為「接單公司硬推導帳務公司」。

## D1 帳務公司由接單公司硬推導

- 業務建立需求單時 SHALL 選接單公司（account_company）。
- 系統 MUST 依 `inferBillingCompanyByAccount(accountCompany)` 規則自動推導 `billing_company_id`。
- UI MUST NOT 顯示「帳務公司」下拉選單，但 MAY 在資訊欄位顯示推導結果（「帳務公司：感官股份有限公司」唯讀文字），協助業務確認。
- 業務 SHALL NOT 手動覆寫帳務公司。需要切換時 SHALL 改接單公司，系統重新推導。
- 既有「接單公司與帳務公司對應提示」軟性引導 Requirement 整個下架（硬映射不需提示）。

## D2 推導規則

實作位置：`sens-erp-prototype/src/data/mockBillingCompanies.ts`

```
function inferBillingCompanyByAccount(accountCompany):
  if accountCompany in ['SSP', 'KAD']: return 'bc-ssp'
  if accountCompany in ['BRO', 'EC']: return 'bc-bro'
  throw error  // 未來新增接單公司時 MUST 同步更新此規則
```

未來新增接單公司或新增帳務公司時 MUST 同步更新 `inferBillingCompanyByAccount`；本規則為 Mockup 階段的硬編碼映射，正式上線時可改為 BillingCompany 主檔欄位 `account_company_keys: string[]` 反向查詢。

## D3 Data Model 影響

QuoteRequest 與 Order 的 `billing_company_id` 欄位定義變更：

| 欄位 | 修訂前 | 修訂後 |
|------|-------|--------|
| billing_company_id | Y 必填（業務指定） | Y 必填（系統推導，唯讀） |

欄位本身保留，因為下游模組（Invoice / SalesAllowance / 對帳檢視面板）都已依賴此 FK，且未來若需求複雜化可重新開啟手動覆寫。

## D4 Migration

- Prototype 階段無正式運行資料，無需資料遷移。
- Prototype 已於 2026-05-06 完成實作（commit 略，doc-audit 已確認 CreateQuotePanel / EditQuotePanel / mockBillingCompanies.ts 一致）。
- 既有 mock 資料（mockQuotes / mockOrders）依 `inferBillingCompanyByAccount` 規則重新計算 `billingCompanyId`，與 `accountCompany` 對齊。

## D5 未來擴充

未來若公司新增第三個法人主體（如海外公司）或既有品牌切換帳務公司，需求路徑：

1. 更新 BillingCompany 主檔（新增 / 修改）。
2. 同步更新 `inferBillingCompanyByAccount` 規則或反向查詢機制。
3. 既有訂單與發票的 `billing_company_id` 維持原值（不追溯歷史）。

本 change 不涵蓋上述擴充情境，留待實際需求出現時再開新 change。

## Open Questions

無未解問題。本 change 僅為對齊 spec 與既有 prototype 實作的清理動作，所有設計決策皆於 2026-05-06 OQ-6 拍板時確認。
